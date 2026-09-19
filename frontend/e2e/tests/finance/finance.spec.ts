import { test, expect } from '../../fixtures/auth'
import { LANDING_PATH, ROUTES } from '../../data/test-data'

test.describe('Finance role smoke @finance', () => {
  test('FIN-01: finance user lands on finance dashboard', async ({ financePage: page }) => {
    await page.goto('/dashboard')
    await expect(page).toHaveURL(new RegExp(`${LANDING_PATH.finance.replaceAll('/', '\\/')}$`))
    await expect(page.getByRole('heading', { name: /finance/i }).first()).toBeVisible()
  })

  test('FIN-02: finance user can read fee types and sees the permitted create action', async ({ financePage: page }) => {
    await page.goto(ROUTES.finance.feeTypes)
    await expect(page.getByRole('heading', { name: /fee type/i }).first()).toBeVisible()
    await expect(page.getByRole('button', { name: /new fee type|add fee type|create fee type/i })).toBeVisible()
  })
})
