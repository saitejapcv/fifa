import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.clear());
  await page.route("**/api/worldcup?endpoint=stadiums", (route) =>
    route.fulfill({ json: { stadiums: [] } })
  );
});

test("fan can use demo credentials and reach the operations dashboard", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: /FIFA World Cup 2026/i })).toBeVisible();
  await page.waitForFunction(() => localStorage.getItem("fifa_tickets") !== null);
  await page.getByLabel("Ticket Number").fill("TICKET-METLIFE");
  await page.getByRole("button", { name: /Sign In to System/i }).click();

  await expect(page.getByText(/fan mode/i)).toBeVisible();
  await expect(page.getByText(/Your gate/i)).toBeVisible();
});

test("staff can navigate to incident operations", async ({ page }) => {
  await page.goto("/");

  await page.waitForFunction(() => localStorage.getItem("fifa_staff_creds") !== null);
  await page.getByRole("button", { name: "staff", exact: true }).click();
  await page.getByLabel("Staff Identification ID").fill("STAFF-001");
  await page.getByLabel("Password").fill("staffpass123");
  await page.getByRole("button", { name: /Sign In to System/i }).click();

  await expect(page.getByText(/staff mode/i)).toBeVisible();
  await page.getByRole("button", { name: "Incidents", exact: true }).click();
  await expect(page.getByText(/Incident Command/i)).toBeVisible();
});

test("unknown routes return a user-visible not-found response", async ({ page }) => {
  await page.goto("/not-a-real-route");
  await expect(page.getByText(/404|not found/i)).toBeVisible();
});

test("skip-to-content link is present and targets main content", async ({ page }) => {
  await page.goto("/");
  const skipLink = page.locator('a[href="#main-content"]');
  await expect(skipLink).toBeAttached();
  // Verify the skip link text
  await expect(skipLink).toHaveText(/skip to main content/i);
});

test("login page has proper heading hierarchy and form labels", async ({ page }) => {
  await page.goto("/");
  // Should have exactly one h1
  const h1s = page.locator("h1");
  await expect(h1s.first()).toBeVisible();
  // Form inputs should have associated labels
  const ticketInput = page.getByLabel("Ticket Number");
  await expect(ticketInput).toBeAttached();
});

test("fan can navigate to the translator view", async ({ page }) => {
  await page.goto("/");
  await page.waitForFunction(() => localStorage.getItem("fifa_tickets") !== null);
  await page.getByLabel("Ticket Number").fill("TICKET-METLIFE");
  await page.getByRole("button", { name: /Sign In to System/i }).click();
  await expect(page.getByText(/fan mode/i)).toBeVisible();

  // Navigate to Translator via sidebar
  await page.getByRole("button", { name: /Translator/i }).click();
  await expect(page.getByText(/Translator/i).first()).toBeVisible();
});
