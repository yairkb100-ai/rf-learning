const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const SCREENSHOTS_DIR = path.join(__dirname, 'screenshots');

// Ensure screenshots directory exists
if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    console.log('📸 Starting screenshot capture...\n');

    const page = await browser.newPage();
    await page.setViewport({ width: 1400, height: 900 });

    // Screenshot 1: Login Page
    console.log('1️⃣  Capturing Login Page...');
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle2', timeout: 30000 });
    await sleep(1000);
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, '01_login.png'),
      fullPage: false
    });
    console.log('✅ Login page saved\n');

    // Screenshot 2: Home Page (Student View) - Login first
    console.log('2️⃣  Capturing Home Page (Student)...');

    // Find and fill login form
    const idInput = await page.$('input[type="text"]');
    const passInput = await page.$('input[type="password"]');

    if (idInput && passInput) {
      await idInput.type('123456789', { delay: 30 });
      await passInput.type('password123', { delay: 30 });

      // Find and click login button
      const buttons = await page.$$('button');
      if (buttons.length > 0) {
        await buttons[0].click();
        await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 });
        await sleep(2000);
        await page.screenshot({
          path: path.join(SCREENSHOTS_DIR, '02_home_student.png'),
          fullPage: true
        });
        console.log('✅ Home page saved\n');

        // Screenshot 3: Course Page
        console.log('3️⃣  Capturing Course Page...');
        const courseLinks = await page.$$('a');

        for (const link of courseLinks) {
          const href = await page.evaluate(el => el.getAttribute('href'), link);
          if (href && href.includes('/course/')) {
            await link.click();
            await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 });
            await sleep(1500);
            await page.screenshot({
              path: path.join(SCREENSHOTS_DIR, '03_course_page.png'),
              fullPage: true
            });
            console.log('✅ Course page saved\n');

            // Screenshot 4: Chapter Page
            console.log('4️⃣  Capturing Chapter Page...');
            const chapterLinks = await page.$$('a');

            for (const chLink of chapterLinks) {
              const chHref = await page.evaluate(el => el.getAttribute('href'), chLink);
              if (chHref && chHref.includes('/chapter/')) {
                await chLink.click();
                await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 });
                await sleep(1500);
                await page.screenshot({
                  path: path.join(SCREENSHOTS_DIR, '04_chapter_page.png'),
                  fullPage: true
                });
                console.log('✅ Chapter page saved\n');
                break;
              }
            }
            break;
          }
        }
      }
    }

    // Screenshot 5: Admin Panel - Logout and login as admin
    console.log('5️⃣  Capturing Admin Dashboard...');
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle2', timeout: 30000 });
    await sleep(500);

    // Clear localStorage
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await sleep(1000);

    // Login as admin
    const idInput2 = await page.$('input[type="text"]');
    const passInput2 = await page.$('input[type="password"]');

    if (idInput2 && passInput2) {
      await idInput2.type('999999999', { delay: 30 });
      await passInput2.type('postgres123', { delay: 30 });

      const buttons = await page.$$('button');
      if (buttons.length > 0) {
        await buttons[0].click();
        await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 });
        await sleep(2000);

        // Find admin link
        const adminLinks = await page.$$('a');
        for (const aLink of adminLinks) {
          const aHref = await page.evaluate(el => el.getAttribute('href'), aLink);
          if (aHref && aHref.includes('/admin')) {
            await aLink.click();
            await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 });
            await sleep(1500);
            await page.screenshot({
              path: path.join(SCREENSHOTS_DIR, '05_admin_dashboard.png'),
              fullPage: true
            });
            console.log('✅ Admin dashboard saved\n');

            // Screenshot 6: Add Course Page
            console.log('6️⃣  Capturing Add Course Page...');
            const addCourseLinks = await page.$$('a, button');
            for (const acLink of addCourseLinks) {
              const text = await page.evaluate(el => el.textContent, acLink);
              if (text && text.includes('הוסף')) {
                await acLink.click();
                await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 }).catch(() => {});
                await sleep(1000);
                await page.screenshot({
                  path: path.join(SCREENSHOTS_DIR, '06_add_course.png'),
                  fullPage: true
                });
                console.log('✅ Add course page saved\n');
                break;
              }
            }
            break;
          }
        }
      }
    }

    console.log('🎉 All screenshots captured successfully!\n');
    console.log(`📁 Screenshots saved in: ${SCREENSHOTS_DIR}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await browser.close();
  }
})();
