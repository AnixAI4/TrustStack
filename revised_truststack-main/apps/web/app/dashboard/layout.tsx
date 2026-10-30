import { ToastProvider } from "@/components/feedback/toast";
import { AppShell } from "@/components/shell/app-shell";
import { PermissionsProvider } from "@/lib/client/permissions";

// Plain `app/dashboard/` folder — NOT a `(dashboard)` route group. See middleware.ts.
// The menu, the top bar and their permission gates: components/shell, lib/client/nav.ts.
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <PermissionsProvider>
      <ToastProvider>
        <AppShell>{children}</AppShell>
      </ToastProvider>
    </PermissionsProvider>
  );
}
