import { test, expect } from '@playwright/test'

test.describe('Authentication', () => {
  test('login page loads correctly', async ({ page }) => {
    await page.goto('/login')
    
    // Check for login form elements
    await expect(page.getByLabel(/email/i)).toBeVisible()
    await expect(page.getByLabel(/password/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /sign in|login|accedi/i })).toBeVisible()
  })

  test('shows error on invalid credentials @critical', async ({ page }) => {
    await page.goto('/login')
    
    // Fill in invalid credentials
    await page.getByLabel(/email/i).fill('invalid@example.com')
    await page.getByLabel(/password/i).fill('wrongpassword')
    await page.getByRole('button', { name: /sign in|login|accedi/i }).click()
    
    // Should show error message
    await expect(page.getByText(/invalid|error|errore|credenziali/i)).toBeVisible()
  })

  test('redirects to dashboard after successful login', async ({ page }) => {
    // Note: This test requires valid test credentials
    // Set up test user in environment or use test database
    test.skip(!process.env.TEST_USER_EMAIL, 'Test credentials not configured')
    
    await page.goto('/login')
    
    await page.getByLabel(/email/i).fill(process.env.TEST_USER_EMAIL!)
    await page.getByLabel(/password/i).fill(process.env.TEST_USER_PASSWORD!)
    await page.getByRole('button', { name: /sign in|login|accedi/i }).click()
    
    // Should redirect to dashboard
    await expect(page).toHaveURL(/.*dashboard/)
    await expect(page.getByText(/dashboard|overview|panoramica/i)).toBeVisible()
  })

  test('protected routes redirect to login when not authenticated', async ({ page }) => {
    await page.goto('/dashboard')
    
    // Should redirect to login
    await expect(page).toHaveURL(/.*login/)
  })
})
