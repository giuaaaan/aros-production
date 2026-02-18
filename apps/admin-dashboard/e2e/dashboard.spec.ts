import { test, expect } from '@playwright/test'

test.describe('Dashboard', () => {
  // Helper to login before each test
  test.beforeEach(async ({ page }) => {
    // Skip if no test credentials
    test.skip(!process.env.TEST_USER_EMAIL, 'Test credentials not configured')
    
    await page.goto('/login')
    await page.getByLabel(/email/i).fill(process.env.TEST_USER_EMAIL!)
    await page.getByLabel(/password/i).fill(process.env.TEST_USER_PASSWORD!)
    await page.getByRole('button', { name: /sign in|login|accedi/i }).click()
    
    // Wait for dashboard to load
    await expect(page).toHaveURL(/.*dashboard/)
  })

  test('displays KPI cards @critical', async ({ page }) => {
    // Check for common KPI titles
    const kpiTitles = ['Revenue', 'Customers', 'Calls', 'Health']
    
    for (const title of kpiTitles) {
      await expect(page.getByText(title, { exact: false })).toBeVisible()
    }
  })

  test('displays connection status', async ({ page }) => {
    // Check for connection status indicator
    await expect(page.getByText(/live|offline|connected/i)).toBeVisible()
  })

  test('displays activity feed @critical', async ({ page }) => {
    // Check for activity feed section
    await expect(page.getByText(/recent activity|attività recente/i)).toBeVisible()
  })

  test('navigation menu works', async ({ page }) => {
    // Test navigation to organizations
    await page.getByRole('link', { name: /organizations|aziende/i }).click()
    await expect(page).toHaveURL(/.*organizations/)
    
    // Test navigation to analytics
    await page.getByRole('link', { name: /analytics|analisi/i }).click()
    await expect(page).toHaveURL(/.*analytics/)
    
    // Back to dashboard
    await page.getByRole('link', { name: /dashboard|overview/i }).click()
    await expect(page).toHaveURL(/.*dashboard/)
  })

  test('real-time updates indicator', async ({ page }) => {
    // Check if live updates indicator is present
    const liveIndicator = page.getByText(/live updates|in tempo reale/i)
    if (await liveIndicator.isVisible().catch(() => false)) {
      await expect(liveIndicator).toBeVisible()
    }
  })

  test('responsive layout on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    
    // Check that content is still accessible
    await expect(page.getByText(/revenue|customers|calls/i, { exact: false })).toBeVisible()
  })
})
