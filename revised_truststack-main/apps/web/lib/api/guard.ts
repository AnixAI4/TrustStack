import "server-only";
import {
  assertActiveMembership,
  can,
  ForbiddenError,
  isRoleCode,
  LastOrganizationAdminError,
  TenantAccessDeniedError,
  type Membership,
  type PermissionCode,
  type RoleCode,
} from "@truststack/core";
import type { User as AuthUser } from "@supabase/supabase-js";
import { z, type ZodType } from "zod";
import { ACTIVE_ORG_COOKIE, decodeActiveOrganization, readCookie } from "@/lib/auth/active-organization";
import { recordAuditEvents, type AuditEvent } from "@/lib/audit/record";
import { createSupabaseForRequest, type AppSupabaseClient } from "@/lib/supabase/server";
import { fail, type ApiErrorCode } from "./envelope";

/**
 * THE guard chain. Every `/api/v1` route handler is `withApi(options, handler)`
 * — `tests/unit/route-guard.test.ts` fails the build otherwise, and
 * `e2e/api/route-sweep.spec.ts` fails if a route is missing from the
 * cross-tenant sweep.
 *
 *   authenticate → resolve app user → load memberships + permissions (one query)
 *   → resolve organisation (active cookie | route param) → assertActiveMembership
 *   → can(permission) → Zod-validate → execute
 *
 * Handlers audit through `ctx.audit()` (as the user, via RLS) or inside a
 * SECURITY DEFINER RPC. Permissions are loaded once per request, never cached
 * across requests (D-023): a role change applies on the very next call.
 */

export type AuthMode = "public" | "optional" | "required";
export type TenantMode = "none" | "active" | "fromParam";

export interface ApiOptions<B, Q> {
  auth: AuthMode;
  /** Default "none". "active" = signed cookie, else first membership. "fromParam" = `params[param]`. */
  tenant?: TenantMode;
  /** Route param holding the organisation id when tenant = "fromParam". Default "id". */
  param?: string;
  /** Requires a tenant: checked against the permissions of THAT membership. */
  permission?: PermissionCode;
  body?: ZodType<B>;
  query?: ZodType<Q>;
}

export interface MembershipWithRole extends Membership {
  roleCode: RoleCode;
  permissions: ReadonlySet<string>;
}

export interface AppUser {
  id: string;
  email: string;
  fullName: string | null;
}

interface BaseContext<B, Q> {
  request: Request;
  params: Record<string, string>;
  body: B;
  query: Q;
}

export interface PublicContext<B, Q> extends BaseContext<B, Q> {
  supabase: AppSupabaseClient;
  authUser: AuthUser | null;
  user: AppUser | null;
}

export interface AuthedContext<B, Q> extends BaseContext<B, Q> {
  supabase: AppSupabaseClient;
  authUser: AuthUser;
  user: AppUser;
  memberships: MembershipWithRole[];
  /** Resolved for every authenticated request, whatever the tenant mode. Null if no membership. */
  activeOrganizationId: string | null;
  audit: (events: Omit<AuditEvent, "userId">[]) => Promise<void>;
}

export interface TenantContext<B, Q> extends AuthedContext<B, Q> {
  organizationId: string;
  membership: MembershipWithRole;
  permissions: ReadonlySet<string>;
}

type ContextFor<O extends ApiOptions<unknown, unknown>, B, Q> = O["tenant"] extends "active" | "fromParam"
  ? TenantContext<B, Q>
  : O["auth"] extends "required"
    ? AuthedContext<B, Q>
    : PublicContext<B, Q> & Partial<AuthedContext<B, Q>>;

type RouteContext = { params: Promise<Record<string, string | string[]>> };

/** Thrown by handlers for an expected, enveloped failure. */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: ApiErrorCode,
    message: string,
    readonly details: { field?: string; issue: string }[] = [],
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function withApi<B = undefined, Q = undefined, const O extends ApiOptions<B, Q> = ApiOptions<B, Q>>(
  options: O & ApiOptions<B, Q>,
  handler: (ctx: ContextFor<O, B, Q>) => Promise<Response> | Response,
) {
  const tenant = options.tenant ?? "none";
  if (tenant !== "none" && options.auth !== "required") {
    throw new Error("withApi: a tenant-scoped route must require authentication");
  }
  if (options.permission && tenant === "none") {
    throw new Error("withApi: a permission check needs a tenant to check it in");
  }

  return async function guarded(request: Request, routeContext: RouteContext): Promise<Response> {
    try {
      const params = flattenParams(await routeContext?.params);
      const query = parseQuery(options.query, request);

      if (options.auth === "public") {
        const body = await parseBody(options.body, request);
        return await handler({ request, params, body, query } as ContextFor<O, B, Q>);
      }

      const { supabase, accessToken } = await createSupabaseForRequest(request);
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser(accessToken);

      if (!authUser) {
        if (options.auth === "required") {
          return fail(401, "UNAUTHENTICATED", "Sign in to continue.", request);
        }
        const body = await parseBody(options.body, request);
        return await handler({ request, params, body, query, supabase, authUser: null, user: null } as ContextFor<
          O,
          B,
          Q
        >);
      }

      const user = await resolveAppUser(supabase, authUser.id);
      if (!user) {
        if (options.auth === "optional") {
          const body = await parseBody(options.body, request);
          return await handler({ request, params, body, query, supabase, authUser, user: null } as ContextFor<O, B, Q>);
        }
        return fail(403, "TENANT_ACCESS_DENIED", "You are not a member of any organisation.", request);
      }

      const memberships = await loadMemberships(supabase, user.id);
      const cookieOrg = decodeActiveOrganization(readCookie(request, ACTIVE_ORG_COOKIE), user.id);
      const activeOrganizationId = resolveActiveOrganizationId(memberships, user.id, cookieOrg);

      const authed: AuthedContext<B, Q> = {
        request,
        params,
        query,
        body: undefined as B,
        supabase,
        authUser,
        user,
        memberships,
        activeOrganizationId,
        audit: (events) => recordAuditEvents(supabase, events.map((e) => ({ ...e, userId: user.id }))),
      };

      if (tenant === "none") {
        authed.body = await parseBody(options.body, request);
        return await handler(authed as ContextFor<O, B, Q>);
      }

      // Tenant BEFORE permission: a non-member learns only "no access", never
      // whether they would have had the permission.
      let requested: string | null;
      if (tenant === "fromParam") {
        const raw = params[options.param ?? "id"];
        const parsed = z.uuid().safeParse(raw);
        if (!parsed.success) {
          throw new ApiError(400, "VALIDATION_ERROR", "Invalid organisation id.", [
            { field: options.param ?? "id", issue: "must be a UUID" },
          ]);
        }
        requested = parsed.data;
      } else {
        requested = activeOrganizationId;
      }
      if (requested === null) throw new TenantAccessDeniedError(user.id, null);

      const membership = assertActiveMembership(memberships, user.id, requested) as MembershipWithRole;
      if (options.permission && !can(membership.permissions, options.permission)) {
        throw new ForbiddenError();
      }

      const ctx: TenantContext<B, Q> = {
        ...authed,
        body: await parseBody(options.body, request),
        organizationId: membership.organizationId,
        membership,
        permissions: membership.permissions,
      };
      return await handler(ctx as ContextFor<O, B, Q>);
    } catch (error) {
      return toFailure(error, request);
    }
  };
}

/** Cookie org if it is still an active membership; otherwise the first active membership. */
export function resolveActiveOrganizationId(
  memberships: readonly Membership[],
  userId: string,
  cookieOrganizationId: string | null,
): string | null {
  const active = memberships.filter((m) => m.userId === userId && m.status === "active");
  return (active.find((m) => m.organizationId === cookieOrganizationId) ?? active[0])?.organizationId ?? null;
}

async function resolveAppUser(supabase: AppSupabaseClient, authUserId: string): Promise<AppUser | null> {
  // auth_provider_user_id, never the Auth UUID as a PK (D-008).
  const { data, error } = await supabase
    .from("users")
    .select("id, email, full_name")
    .eq("auth_provider_user_id", authUserId)
    .maybeSingle();
  if (error) throw error;
  return data ? { id: data.id, email: data.email, fullName: data.full_name } : null;
}

async function loadMemberships(supabase: AppSupabaseClient, userId: string): Promise<MembershipWithRole[]> {
  const { data, error } = await supabase
    .from("organization_users")
    .select("organization_id, user_id, status, created_at, roles(code, role_permissions(permissions(code)))")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });
  if (error) throw error;

  return (data ?? []).flatMap((row) => {
    const roleCode = row.roles?.code;
    if (!roleCode || !isRoleCode(roleCode)) return [];
    const status = row.status as Membership["status"];
    return [
      {
        organizationId: row.organization_id,
        userId: row.user_id,
        status,
        roleCode,
        permissions: new Set(
          (row.roles?.role_permissions ?? []).flatMap((rp) => (rp.permissions?.code ? [rp.permissions.code] : [])),
        ),
      },
    ];
  });
}

function flattenParams(raw: Record<string, string | string[]> | undefined): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(raw ?? {})) out[k] = Array.isArray(v) ? v.join("/") : v;
  return out;
}

function parseQuery<Q>(schema: ZodType<Q> | undefined, request: Request): Q {
  if (!schema) return undefined as Q;
  const parsed = schema.safeParse(Object.fromEntries(new URL(request.url).searchParams.entries()));
  if (!parsed.success) throw validationError("Invalid query parameters.", parsed.error);
  return parsed.data;
}

async function parseBody<B>(schema: ZodType<B> | undefined, request: Request): Promise<B> {
  if (!schema) return undefined as B;
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    throw new ApiError(400, "VALIDATION_ERROR", "Request body must be JSON.");
  }
  const parsed = schema.safeParse(json);
  if (!parsed.success) throw validationError("Invalid request body.", parsed.error);
  return parsed.data;
}

function validationError(message: string, error: z.ZodError) {
  return new ApiError(
    400,
    "VALIDATION_ERROR",
    message,
    error.issues.map((i) => ({ field: i.path.join("."), issue: i.message })),
  );
}

/** Custom SQLSTATEs raised by the Slice 1 RPCs → envelope. */
const SQLSTATE: Record<string, [number, ApiErrorCode]> = {
  TS401: [401, "UNAUTHENTICATED"],
  TS403: [403, "FORBIDDEN"],
  TS404: [404, "NOT_FOUND"],
  TS409: [409, "CONFLICT"],
  TS410: [410, "INVITE_EXPIRED"],
  TS422: [422, "VALIDATION_ERROR"],
};

export function rpcError(error: { code?: string; message: string; hint?: string | null }): ApiError | null {
  const mapped = error.code ? SQLSTATE[error.code] : undefined;
  if (!mapped) return null;
  const code: ApiErrorCode = error.hint === "LAST_ORGANIZATION_ADMIN" ? "LAST_ORGANIZATION_ADMIN" : mapped[1];
  return new ApiError(mapped[0], code, error.message);
}

function toFailure(error: unknown, request: Request): Response {
  if (error instanceof ApiError) return fail(error.status, error.code, error.message, request, error.details);
  if (error instanceof TenantAccessDeniedError) return fail(403, error.code, error.message, request);
  if (error instanceof ForbiddenError) return fail(403, error.code, error.message, request);
  if (error instanceof LastOrganizationAdminError) return fail(422, error.code, error.message, request);

  const mapped = error && typeof error === "object" && "code" in error ? rpcError(error as { code: string; message: string }) : null;
  if (mapped) return fail(mapped.status, mapped.code, mapped.message, request);

  console.error("[api]", new URL(request.url).pathname, error instanceof Error ? error.message : error);
  return fail(500, "INTERNAL_ERROR", "Something went wrong.", request);
}
