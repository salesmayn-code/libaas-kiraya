import { test, expect } from "@playwright/test"
import AxeBuilder from "@axe-core/playwright"

const DATE = "2027-06-10"

test("home page answers the date-first question and passes axe", async ({ page }) => {
  await page.goto("/")

  await expect(page.getByRole("heading", { name: "When is the wedding?" })).toBeVisible()
  await expect(page.getByRole("button", { name: "Show what's free" })).toBeVisible()

  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa"])
    .analyze()

  const serious = results.violations.filter(
    (violation) => violation.impact === "serious" || violation.impact === "critical"
  )

  expect(serious, JSON.stringify(serious, null, 2)).toEqual([])
})

test("date search reaches a listing and its reserve action", async ({ page }) => {
  await page.goto(`/search?date=${DATE}&city=Islamabad`)

  await expect(page.getByText(/outfits? in Islamabad/)).toBeVisible()
  const firstListing = page.locator('a[href^="/listings/"]').first()
  await expect(firstListing).toBeVisible()
  await firstListing.click()

  await expect(page.getByRole("button", { name: "Reserve for 15 minutes" })).toBeVisible()
  await expect(page.getByLabel("Event date")).toBeVisible()
})

test("vendor and customer sign-in pages render", async ({ page }) => {
  await page.goto("/account/login")
  await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible()

  await page.goto("/vendor/login")
  await expect(page.getByRole("heading", { name: "Vendor sign in" })).toBeVisible()
})
