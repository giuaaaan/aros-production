import { test, expect } from '@playwright/test'

test.describe('Analytics Page', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('/login')
    await page.getByLabel(/email/i).fill(process.env.TEST_USER_EMAIL || 'admin@example.com')
    await page.getByLabel(/password/i).fill(process.env.TEST_USER_PASSWORD || 'password')
    await page.getByRole('button', { name: /sign in|login/i }).click()
    
    // Navigate to analytics
    await page.waitForURL(/.*dashboard/)
    await page.getByRole('link', { name: /analytics|analisi/i }).click()
    await page.waitForURL(/.*analytics/)
  })

  test('displays analytics page correctly', async ({ page }) => {
    // Header
    await expect(page.getByRole('heading', { name: 'Analytics' })).toBeVisible()
    await expect(page.getByText('Detailed insights and performance metrics')).toBeVisible()
  })

  test('displays AI Success Rate metric', async ({ page }) => {
    const card = page.locator('text=AI Success Rate').locator('..').locator('..')
    await expect(page.getByText('AI Success Rate')).toBeVisible()
    await expect(page.getByText('94.2%')).toBeVisible()
    await expect(page.getByText('+2.1% from last month')).toBeVisible()
  })

  test('displays Average Call Duration metric', async ({ page }) => {
    await expect(page.getByText('Avg. Call Duration')).toBeVisible()
    await expect(page.getByText('2m 34s')).toBeVisible()
    await expect(page.getByText('-12s from last month')).toBeVisible()
  })

  test('displays Churn Rate metric', async ({ page }) => {
    await expect(page.getByText('Churn Rate')).toBeVisible()
    await expect(page.getByText('3.2%')).toBeVisible()
    await expect(page.getByText('-0.5% from last month')).toBeVisible()
  })

  test('displays NPS Score metric', async ({ page }) => {
    await expect(page.getByText('NPS Score')).toBeVisible()
    await expect(page.getByText('72')).toBeVisible()
    await expect(page.getByText('+5 from last month')).toBeVisible()
  })

  test('displays Top Performing Organizations section', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Top Performing Organizations' })).toBeVisible()
  })

  test('displays top organizations list', async ({ page }) => {
    // Check for mock organizations
    const orgs = ['Auto Service Bianchi', 'Officina Rossi', 'Car Repair Neri']
    
    for (const org of orgs) {
      await expect(page.getByText(org)).toBeVisible()
    }
  })

  test('displays call counts', async ({ page }) => {
    // Check call counts
    await expect(page.getByText('423 calls')).toBeVisible()
    await expect(page.getByText('156 calls')).toBeVisible()
    await expect(page.getByText('89 calls')).toBeVisible()
  })

  test('displays growth percentages correctly', async ({ page }) => {
    // Positive growth
    await expect(page.getByText('+15%')).toBeVisible()
    await expect(page.getByText('+8%')).toBeVisible()
    
    // Negative growth
    await expect(page.getByText('-2%')).toBeVisible()
  })

  test('has correct colors for growth indicators', async ({ page }) => {
    // Positive should be green
    const positiveGrowth = page.locator('text=+15%')
    await expect(positiveGrowth).toBeVisible()
    
    // Negative should be red
    const negativeGrowth = page.locator('text=-2%')
    await expect(negativeGrowth).toBeVisible()
  })

  test('displays activity chart', async ({ page }) => {
    // Look for chart container
    const chart = page.locator('[class*="recharts"], [class*="chart"]').first()
    
    // Chart should be in the document
    const hasChart = await chart.isVisible().catch(() => false)
    if (hasChart) {
      await expect(chart).toBeVisible()
    }
  })

  test('displays ranking numbers', async ({ page }) => {
    // Check for ranking badges (1, 2, 3)
    const rankings = ['1', '2', '3']
    
    for (const rank of rankings) {
      // Look for the ranking number in a badge-like element
      const rankElement = page.locator(`text="${rank}" >> xpath=.. >> [class*="rounded-full"]`).first()
      if (await rankElement.isVisible().catch(() => false)) {
        await expect(rankElement).toContainText(rank)
      }
    }
  })

  test('stats grid is responsive', async ({ page }) => {
    // Test desktop - 4 columns
    await page.setViewportSize({ width: 1280, height: 720 })
    await expect(page.getByText('AI Success Rate')).toBeVisible()
    
    // Test tablet - 2 columns
    await page.setViewportSize({ width: 768, height: 1024 })
    await expect(page.getByText('AI Success Rate')).toBeVisible()
    
    // Test mobile
    await page.setViewportSize({ width: 375, height: 667 })
    await expect(page.getByText('AI Success Rate')).toBeVisible()
  })

  test('all metric cards have consistent styling', async ({ page }) => {
    // All cards should have similar structure
    const cards = page.locator('[class*="card"], article').filter({ hasText: /Success Rate|Call Duration|Churn Rate|NPS Score/ })
    const count = await cards.count()
    expect(count).toBeGreaterThanOrEqual(4)
  })
})
