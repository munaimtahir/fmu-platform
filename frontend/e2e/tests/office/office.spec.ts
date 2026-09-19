import { test, expect } from '../../fixtures/auth'
import { LANDING_PATH, ROUTES } from '../../data/test-data'

test.describe('Office assistant role smoke @office', () => {
  test('OFFICE-01: office assistant lands on the office dashboard', async ({ officePage: page }) => {
    await page.goto('/dashboard')
    await expect(page).toHaveURL(new RegExp(`${LANDING_PATH.office.replaceAll('/', '\\/')}$`))
    await expect(page.getByRole('heading', { name: /office assistant dashboard/i })).toBeVisible()
  })

  test('OFFICE-02: office assistant is denied student management and admin users', async ({ officePage: page }) => {
    await page.goto(ROUTES.students.list)
    await expect(page.getByText(/access denied/i).first()).toBeVisible()

    await page.goto(ROUTES.admin.users)
    await expect(page.getByText(/access denied/i).first()).toBeVisible()
  })
})
