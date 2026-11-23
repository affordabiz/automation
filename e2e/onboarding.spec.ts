import path from "node:path";
import { expect, test } from "@playwright/test";

const PIXEL = path.join(__dirname, "fixtures", "pixel.png");
const slug = `e2e-${Date.now()}`;

test.describe.serial("onboarding → pending review", () => {
  test("owner submits a webpage for review", async ({ page }) => {
    await page.goto("/create");
    await page.getByLabel("Full name").fill("Erin Example");
    await page.getByLabel("Business name").fill("E2E Tax Service");
    await page.getByLabel("Email").fill("erin@example.com");
    await page.getByLabel("Phone").fill("(404) 555-0100");
    await page.getByLabel("Business address").fill("1 Test St, Atlanta, GA");
    await page.getByLabel("Serving area").fill("Atlanta & Surrounding States");
    await page.getByLabel("Web address").fill(slug);
    await expect(page.getByText("Available", { exact: true })).toBeVisible({ timeout: 15_000 });
    await page.getByLabel(/Template 1/).check();
    await page.getByLabel("Logo").setInputFiles(PIXEL);
    await page.getByLabel("Your photo").setInputFiles(PIXEL);
    const submit = page.getByRole("button", { name: "Submit for review" });
    await expect(submit).toBeEnabled({ timeout: 30_000 });
    await submit.click();
    await expect(page.getByRole("heading", { name: "Your request is under review" })).toBeVisible({ timeout: 30_000 });
  });

  test("the slug is now reported as taken", async ({ page }) => {
    await page.goto("/create");
    await page.getByLabel("Web address").fill(slug);
    await page.getByLabel("Web address").blur();
    await expect(page.getByText("This address is already taken — please choose a different one.")).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByRole("button", { name: "Submit for review" })).toBeDisabled();
  });

  test("the webpage stays private until it is approved", async ({ page }) => {
    await page.goto(`/${slug}`);
    await expect(page.getByRole("heading", { level: 1, name: "E2E Tax Service" })).toHaveCount(0);
  });
});
