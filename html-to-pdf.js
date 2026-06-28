const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const htmlFile = path.join(__dirname, 'GITHUB_DEPLOYMENT.html');
const pdfFile = path.join(__dirname, 'GITHUB_DEPLOYMENT.pdf');

(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox']
  });

  try {
    console.log('📄 Converting HTML to PDF...\n');

    const page = await browser.newPage();

    // Read HTML file
    const htmlContent = fs.readFileSync(htmlFile, 'utf-8');

    // Set content
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

    // PDF options
    await page.pdf({
      path: pdfFile,
      format: 'A4',
      margin: { top: '1cm', right: '1cm', bottom: '1cm', left: '1cm' },
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate: '<div style="width: 100%; text-align: center; font-size: 10px; color: #999;">לומדת ענף 71 - ספר המערכת</div>',
      footerTemplate: '<div style="width: 100%; text-align: center; font-size: 10px; color: #999;"><span class="pageNumber"></span></div>'
    });

    console.log(`✅ PDF created successfully: ${pdfFile}`);

    // Get file size
    const stats = fs.statSync(pdfFile);
    const fileSizeInKB = (stats.size / 1024).toFixed(2);
    console.log(`📊 File size: ${fileSizeInKB} KB\n`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await browser.close();
  }
})();
