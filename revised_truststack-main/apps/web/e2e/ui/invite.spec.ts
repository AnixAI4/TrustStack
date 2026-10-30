import { expect, test } from "@playwright/test";
import {
  cleanupE2eInvitees,
  e2eEmail,
  giveInviteKnownToken,
  openInviteIdFor,
  SEED_ORGS,
  SEED_USERS,
  seedPassword,
} from "../helpers";

const SCOPE = "ui";
test.afterAll(() => cleanupE2eInvitees(SCOPE));

test("admin invites through the modal (no link shown); the invitee opens the emailed link signed out, creates an account and lands in the org", async ({
  page,
  browser,
}) => {
  const email = e2eEmail(SCOPE, "modal");

  await page.goto("/login");
  await page.getByLabel("Email").fill(SEED_USERS.muAdmin.email);
  await page.getByLabel("Password").fill(seedPassword());
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await page.goto("/dashboard/users");

  await page.getByRole("button", { name: "Invite user" }).click();
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.getByLabel("Role", { exact: true }).selectOption("legal_user");
  await page.getByRole("button", { name: "Send invite" }).click();
  // No link for the inviter — the email carries it (D-025).
  await expect(page.getByTestId("invite-sent")).toContainText(email);
  await expect(page.getByTestId("invite-sent")).toContainText("reserved test address");
  await expect(page.locator("body")).not.toContainText("/invites/accept?token=");
  await page.getByRole("button", { name: "Done" }).click();
  await expect(page.getByTestId("pending-invites")).toContainText(email);

  // Resend from the list; then "read the email" for the fresh link.
  await page.getByTestId(`resend-${email}`).click();
  await expect(page.getByTestId("invite-notice")).toContainText("previous link no longer works");
  const token = await giveInviteKnownToken(await openInviteIdFor(email));
  const inviteUrl = `/invites/accept?token=${token}`;

  // A fresh, signed-out browser — /invites is reachable without a session.
  const invitee = await browser.newContext();
  const p = await invitee.newPage();
  await p.goto(inviteUrl);
  await expect(p.getByTestId("invite-summary")).toContainText(SEED_ORGS.mumbaiUniversity.name);
  await expect(p.getByTestId("invite-summary")).toContainText("Legal User");
  await p.getByLabel("Full name").fill("UI Invitee");
  await p.getByLabel("Choose a password").fill("Ui-invitee-passw0rd");
  await p.getByRole("button", { name: "Create account and join" }).click();

  await expect(p).toHaveURL(/\/dashboard$/);
  await expect(p.getByTestId("organization-name")).toHaveText(SEED_ORGS.mumbaiUniversity.name);
  // Slice 10.5 B1 (F1.1): the role in words, on Your next steps — never the code.
  await expect(p.getByTestId("user-role")).toHaveText("Legal User");

  // The link is single-use.
  await p.goto(inviteUrl);
  await expect(p.getByTestId("invite-state")).toContainText("not valid");
  // F1.9: a dead invitation says who can send a new one.
  await expect(p.getByTestId("invite-state")).toContainText("Ask your organisation's admin to send a new invitation.");
  await invitee.close();
});
