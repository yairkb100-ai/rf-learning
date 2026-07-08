const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const markdownIt = require('markdown-it');

const mdFile = path.join(__dirname, 'SYSTEM_BOOK_FINAL.md');
const pdfFile = path.join(__dirname, 'SYSTEM_BOOK_FINAL.pdf');

const md = markdownIt({ html: true, linkify: true, typographer: true });
const htmlContent = md.render(fs.readFileSync(mdFile, 'utf-8'));

const fullHtml = `<!DOCTYPE html>
<html lang="he" dir="rtl">
<head><meta charset="UTF-8">
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family:'Heebo',-apple-system,'Segoe UI',sans-serif; line-height:1.8; color:#1c1d1f; background:#fff; padding:20px; }
  .container { max-width:1000px; margin:0 auto; padding:20px; }
  h1 { color:#a435f0; font-size:2.3em; margin:24px 0 12px; text-align:center; page-break-before:always; }
  h1:first-of-type { page-break-before:avoid; }
  h2 { color:#a435f0; font-size:1.6em; margin:30px 0 15px; border-bottom:3px solid #a435f0; padding-bottom:8px; page-break-after:avoid; }
  h3 { color:#1c1d1f; font-size:1.2em; margin:20px 0 10px; page-break-after:avoid; }
  h4 { color:#555; font-size:1.05em; margin:15px 0 8px; }
  p { margin-bottom:12px; }
  ul,ol { margin:12px 30px; }
  li { margin-bottom:6px; }
  table { width:100%; border-collapse:collapse; margin:18px 0; page-break-inside:avoid; }
  th,td { border:1px solid #ddd; padding:9px; text-align:right; }
  th { background:#a435f0; color:#fff; }
  tr:nth-child(even) { background:#f9f9f9; }
  strong { color:#a435f0; font-weight:700; }
  blockquote { background:#f5f0fb; border-right:4px solid #a435f0; padding:12px 18px; margin:15px 0; page-break-inside:avoid; }
  blockquote p { margin:6px 0; }
  pre { background:#f5f5f5; padding:14px; border-radius:5px; margin:14px 0; border-right:4px solid #a435f0; direction:ltr; text-align:left; page-break-inside:avoid; overflow-x:auto; }
  code { background:#f5f5f5; padding:2px 6px; border-radius:3px; font-family:'Courier New',monospace; color:#d63384; direction:ltr; }
  pre code { color:#1c1d1f; background:none; padding:0; }
  hr { border:none; border-top:1px solid #ddd; margin:20px 0; }
</style></head>
<body><div class="container">${htmlContent}</div></body></html>`;

(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  try {
    const page = await browser.newPage();
    await page.setContent(fullHtml, { waitUntil: 'networkidle0' });
    await page.pdf({
      path: pdfFile, format: 'A4',
      margin: { top: '1.2cm', right: '1.2cm', bottom: '1.2cm', left: '1.2cm' },
      printBackground: true, displayHeaderFooter: true,
      headerTemplate: '<div style="width:100%;text-align:center;font-size:9px;color:#999;">ספר המערכת — לומדת ענף 71</div>',
      footerTemplate: '<div style="width:100%;text-align:center;font-size:9px;color:#999;">עמוד <span class="pageNumber"></span> מתוך <span class="totalPages"></span></div>'
    });
    console.log('PDF created: ' + pdfFile + ' (' + (fs.statSync(pdfFile).size/1024).toFixed(1) + ' KB)');
  } catch (e) { console.error('ERROR:', e.message); process.exit(1); }
  finally { await browser.close(); }
})();
