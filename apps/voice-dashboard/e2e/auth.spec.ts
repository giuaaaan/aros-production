import { test, expect } from '@playwright/test'

test.describe('Authentication', () => {
  test('login page loads correctly', async ({ page }) => {
    await page.goto('/login')
    
    await expect(page.getByLabel(/email/i)).toBeVisible()
    await expect(page.getByLabel(/password/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /accedi|login/i })).toBeVisible()
  })

  test('shows error on invalid credentials @critical', async ({ page }) => {
    await page.goto('/login')
    
    await page.getByLabel(/email/i).fill('invalid@test.com')
    await page.getByLabel(/password/i).fill('wrong')
    await page.getByRole('button', { name: /accedi|login/i }).click()
    
    await expect(page.getByText(/errore|error|credenziali/i)).toBeVisible()
  })

  test('redirects to dashboard when authenticated', async ({ page }) => {
    // Questo test richiede credenziali valide
    test.skip(!process.env.TEST_USER_EMAIL, 'No test credentials')
    
    await page.goto('/login')
    await page.getByLabel(/email/i).fill(process.env.TEST_USER_EMAIL!)
    await page.getByLabel(/password/i).fill(process.env.TEST_USER_PASSWORD!)
    await page.getByRole('button', { name: /accedi|login/i }).click()
    
    await expect(page).toHaveURL(/.*dashboard/)
  })

  test('protected routes redirect to login', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/.*login/)
  })
})
