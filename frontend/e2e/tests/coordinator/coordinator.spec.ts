import { test, expect } from '../../fixtures/auth'
import { LANDING_PATH, ROUTES } from '../../data/test-data'

test.describe('Coordinator role smoke @coordinator', () => {
  test('COORD-01: coordinator lands on the coordinator dashboard', async ({ coordinatorPage: page }) => {
    await page.goto('/dashboard')
    await expect(page).toHaveURL(new RegExp(`${LANDING_PATH.coordinator.replaceAll('/', '\\/')}$`))
    await expect(page.getByRole('heading', { name: /coordinator dashboard/i })).toBeVisible()
  })

  test('COORD-02: coordinator is denied admin user management', async ({ coordinatorPage: page }) => {
    await page.goto(ROUTES.admin.users)
    await expect(page.getByText(/access denied/i).first()).toBeVisible()
  })
})
