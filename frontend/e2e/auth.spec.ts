import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('should login successfully with valid credentials', async ({ page }) => {
    // Navigate to login page
    await page.goto('/login');
    
    // Wait for login form to be visible
    await expect(page.locator('form')).toBeVisible();
    await expect(page.locator('input[name="identifier"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    
    // Fill in login form - using admin credentials from documentation
    const identifier = process.env.TEST_USER_IDENTIFIER || 'admin';
    const password = process.env.TEST_USER_PASSWORD || 'admin123';
    
    await page.fill('input[name="identifier"]', identifier);
    await page.fill('input[name="password"]', password);
    
    // Submit form and wait for navigation
    await Promise.all([
      page.waitForResponse(response => 
        response.url().includes('/api/auth/login') && response.status() < 500,
        { timeout: 10000 }
      ).catch(() => null),
      page.click('button[type="submit"]')
    ]);
    
    // Wait for navigation to dashboard or check for error
    try {
      await page.waitForURL(/\/dashboard/, { timeout: 10000 });
      expect(page.url()).toContain('/dashboard');
    } catch (error) {
      // If navigation fails, check what happened
      const currentUrl = page.url();
      const pageContent = await page.content();
      
      // Log for debugging
      console.log('Login failed. Current URL:', currentUrl);
      console.log('Page contains error:', pageContent.includes('error') || pageContent.includes('Error'));
      
      // Check for error messages on page
      const errorElements = await page.locator('[role="alert"], .error, [class*="error"]').all();
      if (errorElements.length > 0) {
        const errorText = await errorElements[0].textContent();
        console.log('Error message:', errorText);
      }
      
      throw error;
    }
  });

  test('should show error with invalid credentials', async ({ page }) => {
    await page.goto('/login');
    
    await page.fill('input[name="identifier"]', 'invalid@user.com');
    await page.fill('input[name="password"]', 'wrongpassword');
    
    await page.click('button[type="submit"]');
    
    // Wait for error message - use more specific selector
    await page.waitForTimeout(2000); // Give time for error to appear
    
    // Check for error in alert or status role
    const errorAlert = page.getByRole('alert').first();
    const errorStatus = page.getByRole('status').filter({ hasText: /error|failed|invalid/i }).first();
    
    // Either should be visible
    const hasError = await errorAlert.isVisible({ timeout: 3000 }).catch(() => false) ||
                    await errorStatus.isVisible({ timeout: 3000 }).catch(() => false);
    
    expect(hasError).toBeTruthy();
  });

  test('should redirect to login when accessing protected route', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Should redirect to login
    await page.waitForURL(/\/login/, { timeout: 5000 });
    expect(page.url()).toContain('/login');
  });
});
