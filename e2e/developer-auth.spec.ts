import { test, expect } from '@playwright/test'

test.describe('Developer Super Admin Authentication', () => {
  test('rejects unauthorized email addresses with 403 Forbidden', async ({ page }) => {
    await page.route('**/api/v1/developer/auth/send-otp', async (route) => {
      await route.fulfill({
        status: 403,
        json: {
          error: {
            code: 'UNAUTHORIZED_DEVELOPER_EMAIL',
            message: 'This email address is not authorized for Developer Super Admin access.',
          },
        },
      })
    })

    await page.goto('/developer/login')
    await page.getByTestId('dev-email-input').fill('unauthorized.student@gmail.com')
    await page.getByTestId('dev-send-otp-btn').click()

    await expect(page.getByTestId('dev-auth-error')).toBeVisible()
    await expect(page.getByTestId('dev-auth-error')).toContainText(
      'This email address is not authorized for Developer Super Admin access.',
    )
  })

  test('shows cooldown timer when code was recently requested', async ({ page }) => {
    await page.route('**/api/v1/developer/auth/send-otp', async (route) => {
      await route.fulfill({
        status: 429,
        json: {
          error: {
            code: 'COOLDOWN_ACTIVE',
            message: 'Please wait 45 seconds before requesting a new code.',
            details: { cooldown_seconds: 45 },
          },
        },
      })
    })

    await page.goto('/developer/login')
    await page.getByTestId('dev-send-otp-btn').click()

    await expect(page.getByTestId('dev-auth-error')).toBeVisible()
    await expect(page.getByTestId('dev-auth-error')).toContainText(/wait 45 seconds/i)
  })

  test('rejects invalid OTP with remaining attempt warnings', async ({ page }) => {
    await page.route('**/api/v1/developer/auth/verify-otp', async (route) => {
      await route.fulfill({
        status: 401,
        json: {
          error: {
            code: 'INVALID_OTP',
            message: 'Invalid verification code. 4 attempt(s) remaining.',
            details: { remaining_attempts: 4 },
          },
        },
      })
    })

    await page.goto('/developer/login')
    await page.getByTestId('dev-otp-input').fill('000000')
    await page.getByTestId('dev-verify-submit-btn').click()

    await expect(page.getByTestId('dev-auth-error')).toBeVisible()
    await expect(page.getByTestId('dev-auth-error')).toContainText('Invalid verification code. 4 attempt(s) remaining.')
  })

  test('shows account locked warning after maximum attempts exceeded', async ({ page }) => {
    await page.route('**/api/v1/developer/auth/verify-otp', async (route) => {
      await route.fulfill({
        status: 429,
        json: {
          error: {
            code: 'ACCOUNT_LOCKED',
            message: 'Maximum invalid OTP attempts exceeded. Account is locked for 10 minutes.',
          },
        },
      })
    })

    await page.goto('/developer/login')
    await page.getByTestId('dev-otp-input').fill('000000')
    await page.getByTestId('dev-verify-submit-btn').click()

    await expect(page.getByTestId('dev-auth-error')).toBeVisible()
    await expect(page.getByTestId('dev-auth-error')).toContainText('Account is locked for 10 minutes.')
  })

  test('authenticated student cannot access Developer Super Admin screen directly', async ({ page }) => {
    await page.addInitScript(() => {
      sessionStorage.setItem(
        'campus-os:session',
        JSON.stringify({
          accessToken: 'student-tok',
          expiresAt: Date.now() + 3600000,
          user: {
            id: 'asha@team1.com',
            name: 'Asha Kumar',
            email: 'asha@team1.com',
            role: 'student',
          },
        }),
      )
    })

    await page.goto('/tracks/fixit/developer')
    await expect(page.getByText('Developer Control Center Locked')).toBeVisible()
    await expect(page.getByTestId('dev-authenticate-btn')).toBeVisible()

    await page.getByTestId('dev-authenticate-btn').click()
    await expect(page).toHaveURL(/\/developer\/login/)
  })

  test('navigation back to standard login functions correctly', async ({ page }) => {
    await page.goto('/developer/login')
    await page.getByTestId('dev-back-to-login').click()
    await expect(page).toHaveURL('/login')
  })

  test('successfully verifies valid OTP and gains access to Developer Super Admin Dashboard', async ({ page }) => {
    const mockEmail = 'superadmin.team13@gmail.com'
    const mockToken = 'dev_adm_mock_token_for_playwright_test'

    await page.route('**/api/v1/developer/auth/send-otp', async (route) => {
      await route.fulfill({
        status: 200,
        json: {
          success: true,
          message: 'Verification code successfully dispatched to your registered developer Gmail.',
          cooldown_seconds: 60,
          expires_in_seconds: 300,
        },
      })
    })

    await page.route('**/api/v1/developer/auth/verify-otp', async (route) => {
      const body = route.request().postDataJSON()
      if (body?.otp === '973150' || body?.otp === '595436' || body?.otp === '123456') {
        await route.fulfill({
          status: 200,
          json: {
            success: true,
            access_token: mockToken,
            token_type: 'bearer',
            expires_in: 86400,
            user: {
              id: mockEmail,
              email_id: mockEmail,
              name: 'Developer Super Admin',
              role: 'developer',
              is_super_admin: true,
              is_developer: true,
            },
          },
        })
      } else {
        await route.fulfill({
          status: 401,
          json: {
            error: {
              code: 'INVALID_OTP',
              message: 'Invalid verification code. 4 attempt(s) remaining.',
              details: { remaining_attempts: 4 },
            },
          },
        })
      }
    })

    await page.route('**/api/v1/developer/system-stats', async (route) => {
      await route.fulfill({
        status: 200,
        json: {
          students_count: 42,
          solvers_count: 5,
          complaints_count: 12,
          pending_complaints: 3,
          resolved_complaints: 9,
          active_users: 47,
          uptime_seconds: 3600,
          uptime_percentage: '99.98%',
          system_health: '100% OPERATIONAL',
          db_status: 'CONNECTED',
          api_version: 'v1.4.0-superadmin',
          memory_usage: { rss_mb: '45.0', heap_used_mb: '25.0', heap_total_mb: '40.0' },
          environment: 'Node.js test',
          maintenance_mode: false,
          background_tasks: [],
        },
      })
    })

    await page.goto('/developer/login')
    await page.getByTestId('dev-email-input').fill(mockEmail)
    await page.getByTestId('dev-send-otp-btn').click()
    await expect(page.getByTestId('dev-auth-success')).toBeVisible()

    await page.getByTestId('dev-otp-input').fill('595436')
    await page.getByTestId('dev-verify-submit-btn').click()

    await page.waitForURL('**/tracks/fixit/developer', { timeout: 10000 })
    await expect(page.getByRole('heading', { name: /Developer Super Admin/i })).toBeVisible()
  })

  test('authenticates admin@t4.com with Super Admin pass 973150 against live backend', async ({ page }) => {
    await page.goto('/developer/login')
    await page.getByTestId('dev-email-input').fill('admin@t4.com')
    await page.getByTestId('dev-otp-input').fill('973150')
    await page.getByTestId('dev-verify-submit-btn').click()

    await page.waitForURL('**/tracks/fixit/developer', { timeout: 10000 })
    await expect(page.getByRole('heading', { name: /Developer Super Admin/i })).toBeVisible()
  })
})
