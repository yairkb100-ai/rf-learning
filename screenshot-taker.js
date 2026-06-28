const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const SCREENSHOTS_DIR = path.join(__dirname, 'screenshots');

// Ensure screenshots directory exists
if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox']
  });

  try {
    console.log('📸 Starting screenshots capture...\n');

    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });

    // Screenshot 1: Login Page
    console.log('1️⃣  Capturing Login Page...');
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle2', timeout: 30000 });
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '01_login.png'), fullPage: false });
    console.log('✅ Login page saved\n');

    // Screenshot 2: Home Page (Student View) - Login first
    console.log('2️⃣  Capturing Home Page (Student)...');
    await page.type('input[placeholder*="ת"]', '123456789', { delay: 50 });
    await page.type('input[type="password"]', 'password123', { delay: 50 });
    await page.click('button:has-text("התחברות"), button:contains("התחברות"), button');
    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 });
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '02_home_student.png'), fullPage: true });
    console.log('✅ Home page saved\n');

    // Screenshot 3: Course Page
    console.log('3️⃣  Capturing Course Page...');
    const courses = await page.$$('a[href*="/course"]');
    if (courses.length > 0) {
      await courses[0].click();
      await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 });
      await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '03_course_page.png'), fullPage: true });
      console.log('✅ Course page saved\n');

      // Screenshot 4: Chapter Page
      console.log('4️⃣  Capturing Chapter Page...');
      const chapters = await page.$$('a[href*="/chapter"]');
      if (chapters.length > 0) {
        await chapters[0].click();
        await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 });
        await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '04_chapter_page.png'), fullPage: true });
        console.log('✅ Chapter page saved\n');
      }
    }

    // Screenshot 5: Admin Panel - Logout and login as admin
    console.log('5️⃣  Capturing Admin Panel...');
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle2', timeout: 30000 });

    // Clear previous login
    await page.evaluate(() => localStorage.clear());
    await page.reload();

    // Login as admin
    await page.type('input[placeholder*="ת"]', '999999999', { delay: 50 });
    await page.type('input[type="password"]', 'postgres123', { delay: 50 });
    await page.click('button');
    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 });

    // Go to admin
    const adminLink = await page.$('a[href*="/admin"], a:has-text("ניהול")');
    if (adminLink) {
      await adminLink.click();
      await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 });
      await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '05_admin_dashboard.png'), fullPage: true });
      console.log('✅ Admin dashboard saved\n');
    }

    console.log('🎉 All screenshots captured successfully!\n');
    console.log(`📁 Screenshots saved in: ${SCREENSHOTS_DIR}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await browser.close();
  }
})();
