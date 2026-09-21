/**
 * Playwright script to capture screenshots of the FMU Platform
 * for admin documentation purposes
 */

const { chromium } = require('playwright');

const BASE_URL = 'http://127.0.0.1:8080';
const SCREENSHOT_DIR = './docs/admin-runtime-report/screenshots';
const LOGIN_USERNAME = 'admin';
const LOGIN_PASSWORD = 'admin123';

async function captureScreenshots() {
  console.log('🚀 Starting screenshot capture...');
  
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
  });
  const page = await context.newPage();

  const screenshots = [];
  const errors = [];

  try {
    // 1. Login Page
    console.log('📸 Capturing login page...');
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    await page.screenshot({ 
      path: `${SCREENSHOT_DIR}/01_login.png`,
      fullPage: true 
    });
    screenshots.push({ name: '01_login.png', description: 'Login page' });

    // 2. Login and capture dashboard
    console.log('🔐 Logging in...');
    await page.fill('input[name="identifier"], input[type="text"]', LOGIN_USERNAME);
    await page.fill('input[type="password"]', LOGIN_PASSWORD);
    await page.click('button[type="submit"], button:has-text("Login"), button:has-text("Sign in")');
    
    // Wait for navigation after login
    await page.waitForURL(/dashboard/, { timeout: 10000 });
    await page.waitForTimeout(3000);

    // 3. Main Dashboard
    console.log('📸 Capturing main dashboard...');
    await page.screenshot({ 
      path: `${SCREENSHOT_DIR}/02_main_dashboard.png`,
      fullPage: true 
    });
    screenshots.push({ name: '02_main_dashboard.png', description: 'Main dashboard after login' });

    // 4. Admin Dashboard (if different)
    try {
      console.log('📸 Capturing admin dashboard...');
      await page.goto(`${BASE_URL}/dashboard/admin`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(3000);
      await page.screenshot({ 
        path: `${SCREENSHOT_DIR}/03_admin_dashboard.png`,
        fullPage: true 
      });
      screenshots.push({ name: '03_admin_dashboard.png', description: 'Admin dashboard' });
    } catch (e) {
      errors.push({ page: 'Admin Dashboard', error: e.message });
    }

    // 5. Students Page
    try {
      console.log('📸 Capturing students page...');
      await page.goto(`${BASE_URL}/students`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(3000);
      await page.screenshot({ 
        path: `${SCREENSHOT_DIR}/04_students_list.png`,
        fullPage: true 
      });
      screenshots.push({ name: '04_students_list.png', description: 'Students listing page' });
    } catch (e) {
      errors.push({ page: 'Students Page', error: e.message });
    }

    // 6. Courses Page
    try {
      console.log('📸 Capturing courses page...');
      await page.goto(`${BASE_URL}/courses`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(3000);
      await page.screenshot({ 
        path: `${SCREENSHOT_DIR}/05_courses_list.png`,
        fullPage: true 
      });
      screenshots.push({ name: '05_courses_list.png', description: 'Courses listing page' });
    } catch (e) {
      errors.push({ page: 'Courses Page', error: e.message });
    }

    // 7. Attendance Dashboard
    try {
      console.log('📸 Capturing attendance dashboard...');
      await page.goto(`${BASE_URL}/attendance`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(3000);
      await page.screenshot({ 
        path: `${SCREENSHOT_DIR}/06_attendance_dashboard.png`,
        fullPage: true 
      });
      screenshots.push({ name: '06_attendance_dashboard.png', description: 'Attendance dashboard' });
    } catch (e) {
      errors.push({ page: 'Attendance Dashboard', error: e.message });
    }

    // 8. Finance Dashboard
    try {
      console.log('📸 Capturing finance dashboard...');
      await page.goto(`${BASE_URL}/finance`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(3000);
      await page.screenshot({ 
        path: `${SCREENSHOT_DIR}/07_finance_dashboard.png`,
        fullPage: true 
      });
      screenshots.push({ name: '07_finance_dashboard.png', description: 'Finance dashboard' });
    } catch (e) {
      errors.push({ page: 'Finance Dashboard', error: e.message });
    }

    // 9. Admin Users Page
    try {
      console.log('📸 Capturing admin users page...');
      await page.goto(`${BASE_URL}/admin/users`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(3000);
      await page.screenshot({ 
        path: `${SCREENSHOT_DIR}/08_admin_users.png`,
        fullPage: true 
      });
      screenshots.push({ name: '08_admin_users.png', description: 'Admin users management page' });
    } catch (e) {
      errors.push({ page: 'Admin Users', error: e.message });
    }

    // 10. Programs Page
    try {
      console.log('📸 Capturing programs page...');
      await page.goto(`${BASE_URL}/academics/programs`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(3000);
      await page.screenshot({ 
        path: `${SCREENSHOT_DIR}/09_programs_list.png`,
        fullPage: true 
      });
      screenshots.push({ name: '09_programs_list.png', description: 'Academic programs listing' });
    } catch (e) {
      errors.push({ page: 'Programs Page', error: e.message });
    }

    // 11. Admin Settings
    try {
      console.log('📸 Capturing admin settings page...');
      await page.goto(`${BASE_URL}/admin/settings`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(3000);
      await page.screenshot({ 
        path: `${SCREENSHOT_DIR}/10_admin_settings.png`,
        fullPage: true 
      });
      screenshots.push({ name: '10_admin_settings.png', description: 'Admin settings page' });
    } catch (e) {
      errors.push({ page: 'Admin Settings', error: e.message });
    }

    // 12. Syllabus Manager
    try {
      console.log('📸 Capturing syllabus manager page...');
      await page.goto(`${BASE_URL}/admin/syllabus`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(3000);
      await page.screenshot({ 
        path: `${SCREENSHOT_DIR}/11_syllabus_manager.png`,
        fullPage: true 
      });
      screenshots.push({ name: '11_syllabus_manager.png', description: 'Syllabus manager page' });
    } catch (e) {
      errors.push({ page: 'Syllabus Manager', error: e.message });
    }

  } catch (error) {
    console.error('❌ Error during screenshot capture:', error);
    errors.push({ page: 'General', error: error.message });
  } finally {
    await browser.close();
  }

  return { screenshots, errors };
}

// Run if executed directly
if (require.main === module) {
  captureScreenshots()
    .then(({ screenshots, errors }) => {
      console.log('\n✅ Screenshot capture complete!');
      console.log(`\n📊 Summary:`);
      console.log(`   - Screenshots captured: ${screenshots.length}`);
      console.log(`   - Errors encountered: ${errors.length}`);
      
      if (errors.length > 0) {
        console.log('\n⚠️  Errors:');
        errors.forEach(({ page, error }) => {
          console.log(`   - ${page}: ${error}`);
        });
      }

      console.log('\n📸 Screenshots saved:');
      screenshots.forEach(({ name, description }) => {
        console.log(`   - ${name}: ${description}`);
      });
    })
    .catch((error) => {
      console.error('❌ Fatal error:', error);
      process.exit(1);
    });
}

module.exports = { captureScreenshots };
