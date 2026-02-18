import { test, expect } from '@playwright/test'

test.describe('Dashboard @critical', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel(/email/i).fill(process.env.TEST_USER_EMAIL || 'test@example.com')
    await page.getByLabel(/password/i).fill(process.env.TEST_USER_PASSWORD || 'password')
    await page.getByRole('button', { name: /accedi|login/i }).click()
    await page.waitForURL(/.*dashboard/)
  })

  test('displays dashboard with stats', async ({ page }) => {
    await expect(page.getByRole('heading')).toBeVisible()
    await expect(page.getByText(/appuntamenti oggi/i)).toBeVisible()
    await expect(page.getByText(/chiamate gestite/i)).toBeVisible()
  })

  test('shows today appointments section', async ({ page }) => {
    await expect(page.getByText(/appuntamenti di oggi/i)).toBeVisible()
  })

  test('shows recent conversations', async ({ page }) => {
    await expect(page.getByText(/conversazioni recenti/i)).toBeVisible()
  })

  test('logout works', async ({ page }) => {
    await page.getByRole('button', { name: /esci|logout/i }).click()
    await expect(page).toHaveURL(/.*login/)
  })
})
