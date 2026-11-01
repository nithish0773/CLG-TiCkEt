import { test, expect } from '@playwright/test'

test.describe('Developer Super Admin Control Panel', () => {
  test('authenticates as admin and accesses developer dashboard', async ({ page }) => {
    // Navigate to login
    await page.goto('/login')
    await page.locator('input[type="email"]').fill('admin@team13.com')
    await page.locator('input[inputmode="numeric"]').fill('595436')
    await page.click('button[type="submit"]')

    // Wait for redirect to home
    await page.waitForURL('/')

    // Navigate to developer super admin dashboard
    await page.goto('/tracks/fixit/developer')
    await expect(page.getByRole('heading', { name: 'Developer Central Command', exact: true })).toBeVisible()
    await expect(page.getByText('SUPER ADMIN', { exact: true })).toBeVisible()

    // Verify 13 navigation sections exist
    const sections = [
      'Overview',
      'User Management',
      'Complaint Management',
      'Problem Solvers',
      'Website Studio',
      'Page Management',
      'Announcements',
      'Analytics & Reports',
      'System Monitoring',
      'Security Center',
      'Database & Backups',
      'Maintenance Mode',
      'Developer Settings',
    ]

    for (const section of sections) {
      await expect(page.getByRole('button', { name: new RegExp(section, 'i') }).first()).toBeVisible()
    }

    // Verify Quick Actions exist
    await expect(page.locator('button[title="Edit Website"]')).toBeVisible()
    await expect(page.locator('button[title="Add User"]')).toBeVisible()
    await expect(page.locator('button[title="Publish Changes"]')).toBeVisible()
    await expect(page.locator('button[title="Create Backup"]')).toBeVisible()
    await expect(page.locator('button[title="Toggle Maintenance Mode"]')).toBeVisible()

    // Test tab navigation to Website Studio
    await page.getByRole('button', { name: /Website Studio/i }).first().click()
    await expect(page.getByText('Website Customization Studio & Design System')).toBeVisible()
    await expect(page.getByText('Brand Identity & Chromatic Tokens')).toBeVisible()

    // Test tab navigation to User Management
    await page.getByRole('button', { name: /User Management/i }).first().click()
    await expect(page.getByText('Identity & Access Control (User Directory)')).toBeVisible()

    // Test tab navigation to System Monitoring
    await page.getByRole('button', { name: /System Monitoring/i }).first().click()
    await expect(page.getByText('Core Infrastructure Telemetry & Node Engine Monitoring')).toBeVisible()
  })

  test('blocks non-admin users from developer dashboard with lock guard', async ({ page }) => {
    await page.goto('/login')
    await page.locator('input[type="email"]').fill('student@team1.com')
    await page.locator('input[inputmode="numeric"]').fill('123456')
    await page.click('button[type="submit"]')
    await page.waitForURL('/')

    // Direct navigate to developer dashboard
    await page.goto('/tracks/fixit/developer')
    await expect(page.getByText('Developer Control Center Locked')).toBeVisible()
    await expect(page.getByRole('button', { name: /Authenticate as Developer Super Admin/i })).toBeVisible()
  })

  test('verifies role switcher is accessible for student and allows switching role', async ({ page }) => {
    // 1. Sign in as normal student
    await page.goto('/login')
    await page.locator('input[type="email"]').fill('student@team1.com')
    await page.locator('input[inputmode="numeric"]').fill('123456')
    await page.click('button[type="submit"]')
    await page.waitForURL('/')

    // 2. Visit Settings screen
    await page.goto('/tracks/fixit/settings')
    await expect(page.getByRole('heading', { name: /Platform Settings & Configuration/i })).toBeVisible()

    // 3. Confirm 1-Click Role Switcher is visible
    await expect(page.getByText(/1-Click Role Switcher/i)).toBeVisible()

    // 4. Check user profile dropdown menu in topbar
    await page.click('button[aria-label="User profile and role menu"]')
    await expect(page.getByText(/Switch Role/i)).toBeVisible()

    // 5. Direct backend request to simulate-role succeeds with 200 OK
    const status = await page.evaluate(async () => {
      const sessionRaw = sessionStorage.getItem('campus-os:session') || '{}'
      const session = JSON.parse(sessionRaw)
      const res = await fetch('/api/v1/developer/simulate-role', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.accessToken || ''}`,
        },
        body: JSON.stringify({ target_email: 'kumar@team1.com' }),
      })
      return res.status
    })
    expect(status).toBe(200)
  })

  test('allows developer to simulate role, shows DEMO MODE banner, and returns safely', async ({ page }) => {
    // 1. Sign in as Developer Super Admin
    await page.goto('/login')
    await page.locator('input[type="email"]').fill('admin@team13.com')
    await page.locator('input[inputmode="numeric"]').fill('595436')
    await page.click('button[type="submit"]')
    await page.waitForURL('/')

    // 2. Go to Settings where Developer Role Switcher is authorized
    await page.goto('/tracks/fixit/settings')
    await expect(page.getByText(/1-Click Role Switcher/i)).toBeVisible()

    // 3. Click switch to Asha Kumar (first 'Switch to this Role' button)
    await page.getByRole('button', { name: /Switch to this Role/i }).first().click()

    // 4. Verify simulation banner appears
    const banner = page.locator('[data-testid="simulation-banner"]')
    await expect(banner).toBeVisible({ timeout: 10000 })
    await expect(banner).toContainText('DEMO / EVALUATION MODE ACTIVE')
    await expect(banner).toContainText('asha@team1.com')

    // 5. Click "Return to Developer Dashboard"
    await page.locator('[data-testid="return-to-developer-btn"]').click()
    await page.waitForURL('**/tracks/fixit/developer', { timeout: 10000 })
    await expect(page.getByRole('heading', { name: 'Developer Central Command', exact: true })).toBeVisible()
  })

  test('allows logged-in user to customize profile picture via preset avatar', async ({ page }) => {
    // 1. Sign in as student
    await page.goto('/login')
    await page.locator('input[type="email"]').fill('student@team1.com')
    await page.locator('input[inputmode="numeric"]').fill('123456')
    await page.click('button[type="submit"]')
    await page.waitForURL('/')

    // 2. Go to Settings
    await page.goto('/tracks/fixit/settings')
    await expect(page.getByText('Profile Photo')).toBeVisible()

    // 3. Open preset picker
    await page.getByRole('button', { name: /Choose Preset/i }).click()
    await expect(page.getByText('Student Explorer')).toBeVisible()

    // 4. Select the preset
    await page.getByRole('button', { name: /Student Explorer/i }).click()

    // 5. Verify success feedback and avatar image rendered in topbar
    await expect(page.getByText(/Preset avatar selected and saved!/i)).toBeVisible()
    await expect(page.locator('button[aria-label="User profile and role menu"] img')).toBeVisible()
  })
})
