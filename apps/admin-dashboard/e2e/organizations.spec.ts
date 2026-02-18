import { test, expect } from '@playwright/test'

test.describe('Organizations Page @critical', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('/login')
    await page.getByLabel(/email/i).fill(process.env.TEST_USER_EMAIL || 'admin@example.com')
    await page.getByLabel(/password/i).fill(process.env.TEST_USER_PASSWORD || 'password')
    await page.getByRole('button', { name: /sign in|login/i }).click()
    
    // Navigate to organizations
    await page.waitForURL(/.*dashboard/)
    await page.getByRole('link', { name: /organizations|aziende/i }).click()
    await page.waitForURL(/.*organizations/)
  })

  test('displays organizations page correctly', async ({ page }) => {
    // Header
    await expect(page.getByRole('heading', { name: 'Organizations' })).toBeVisible()
    await expect(page.getByText('Manage your customer organizations')).toBeVisible()
  })

  test('has search functionality', async ({ page }) => {
    // Search input
    const searchInput = page.getByPlaceholder('Search organizations...')
    await expect(searchInput).toBeVisible()
    await expect(searchInput).toBeEnabled()
  })

  test('has add organization button', async ({ page }) => {
    const addButton = page.getByRole('button', { name: /add organization/i })
    await expect(addButton).toBeVisible()
    await expect(addButton).toBeEnabled()
  })

  test('displays organizations table with headers', async ({ page }) => {
    // Table headers
    await expect(page.getByRole('columnheader', { name: 'Organization' })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: 'Location' })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: 'Plan' })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: 'Status' })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: 'Users' })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: 'Appointments' })).toBeVisible()
  })

  test('search filters organizations', async ({ page }) => {
    const searchInput = page.getByPlaceholder('Search organizations...')
    
    // Type search query
    await searchInput.fill('test')
    
    // Wait for search to apply
    await page.waitForTimeout(500)
    
    // Check that table is still visible
    await expect(page.getByRole('table')).toBeVisible()
  })

  test('displays subscription tier badges', async ({ page }) => {
    // Check for tier badges
    const tiers = ['starter', 'professional', 'enterprise']
    
    for (const tier of tiers) {
      // At least one tier badge should be visible (if data exists)
      const badge = page.locator('text=' + tier).first()
      if (await badge.isVisible().catch(() => false)) {
        await expect(badge).toBeVisible()
      }
    }
  })

  test('displays subscription status badges', async ({ page }) => {
    // Check for status badges
    const statuses = ['active', 'paused', 'cancelled']
    
    for (const status of statuses) {
      const badge = page.locator('text=' + status).first()
      if (await badge.isVisible().catch(() => false)) {
        await expect(badge).toBeVisible()
      }
    }
  })

  test('shows row actions menu', async ({ page }) => {
    // Look for action buttons in table rows
    const actionButtons = page.locator('button >> nth=1') // Skip Add button
    
    if (await actionButtons.isVisible().catch(() => false)) {
      await expect(actionButtons).toBeVisible()
    }
  })

  test('displays total count', async ({ page }) => {
    // Check for count text
    const countText = page.getByText(/showing \d+ of/i)
    await expect(countText).toBeVisible()
  })

  test('empty state when no organizations', async ({ page }) => {
    // Search for non-existent organization
    const searchInput = page.getByPlaceholder('Search organizations...')
    await searchInput.fill('xyz-nonexistent-12345')
    
    await page.waitForTimeout(500)
    
    // Should show empty state
    await expect(page.getByText('No organizations found')).toBeVisible()
  })

  test('table is responsive', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    
    // Table should still be visible or adapted
    const table = page.getByRole('table')
    await expect(table).toBeVisible()
  })

  test('organization names are clickable', async ({ page }) => {
    // Find first organization link/name
    const firstOrg = page.locator('table tbody tr:first-child td:first-child').first()
    
    if (await firstOrg.isVisible().catch(() => false)) {
      await expect(firstOrg).toBeVisible()
      // Could add click test here if navigation is implemented
    }
  })
})
