const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const markdownIt = require('markdown-it');

const mdFile = path.join(__dirname, 'GITHUB_AND_DEPLOYMENT_BOOK.md');
const htmlFile = path.join(__dirname, 'GITHUB_AND_DEPLOYMENT_BOOK.html');
const pdfFile = path.join(__dirname, 'GITHUB_AND_DEPLOYMENT_BOOK.pdf');

const md = markdownIt({
  html: true,
  linkify: true,
  typographer: true
});

console.log('📝 Converting Markdown to HTML...\n');

// Read markdown
const mdContent = fs.readFileSync(mdFile, 'utf-8');

// Convert to HTML
const htmlContent = md.render(mdContent);

// Create full HTML page
const fullHtml = `<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>סיכום שלם - לומדת ענף 71</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Heebo', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            line-height: 1.8;
            color: #1c1d1f;
            background: #f9f9f9;
            padding: 20px;
        }

        .container {
            max-width: 1000px;
            margin: 0 auto;
            background: white;
            padding: 40px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }

        h1 {
            color: #a435f0;
            font-size: 2.5em;
            margin: 40px 0 10px 0;
            text-align: center;
            page-break-after: avoid;
        }

        h2 {
            color: #a435f0;
            font-size: 1.8em;
            margin: 40px 0 15px 0;
            border-bottom: 3px solid #a435f0;
            padding-bottom: 10px;
            page-break-after: avoid;
        }

        h3 {
            color: #1c1d1f;
            font-size: 1.3em;
            margin: 25px 0 10px 0;
            page-break-after: avoid;
        }

        h4 {
            color: #555;
            font-size: 1.1em;
            margin: 15px 0 10px 0;
        }

        p {
            margin-bottom: 12px;
            text-align: justify;
        }

        ul, ol {
            margin: 15px 0 15px 30px;
        }

        li {
            margin-bottom: 8px;
        }

        code {
            background: #f5f5f5;
            padding: 2px 6px;
            border-radius: 3px;
            font-family: 'Courier New', monospace;
            color: #d63384;
        }

        pre {
            background: #f5f5f5;
            padding: 15px;
            border-radius: 5px;
            overflow-x: auto;
            margin: 15px 0;
            border-right: 4px solid #a435f0;
            direction: ltr;
            text-align: left;
            page-break-inside: avoid;
        }

        pre code {
            color: #1c1d1f;
            background: none;
            padding: 0;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
            page-break-inside: avoid;
        }

        th, td {
            border: 1px solid #ddd;
            padding: 12px;
            text-align: right;
        }

        th {
            background: #a435f0;
            color: white;
        }

        tr:nth-child(even) {
            background: #f9f9f9;
        }

        strong {
            color: #a435f0;
            font-weight: 700;
        }

        em {
            font-style: italic;
            color: #666;
        }

        .footer {
            text-align: center;
            color: #999;
            font-size: 0.9em;
            margin-top: 50px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            page-break-before: always;
        }

        @media print {
            body {
                background: white;
                padding: 0;
            }
            .container {
                box-shadow: none;
                padding: 20px;
            }
            h2 {
                page-break-before: always;
            }
        }
    </style>
</head>
<body>
    <div class="container">
${htmlContent}
        <div class="footer">
            <p>ספר GitHub וDeployment - לומדת ענף 71</p>
            <p>עדכון אחרון: 2026-06-28</p>
            <p>גרסה: 1.0</p>
        </div>
    </div>
</body>
</html>`;

// Write HTML
fs.writeFileSync(htmlFile, fullHtml, 'utf-8');
console.log(`✅ HTML created: ${htmlFile}`);

// Convert to PDF
(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox']
  });

  try {
    console.log('📄 Converting HTML to PDF...\n');

    const page = await browser.newPage();
    await page.setContent(fullHtml, { waitUntil: 'networkidle0' });

    await page.pdf({
      path: pdfFile,
      format: 'A4',
      margin: { top: '1cm', right: '1cm', bottom: '1cm', left: '1cm' },
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate: '<div style="width: 100%; text-align: center; font-size: 10px; color: #999;">ספר GitHub וDeployment</div>',
      footerTemplate: '<div style="width: 100%; text-align: center; font-size: 10px; color: #999;"><span class="pageNumber"></span></div>'
    });

    const stats = fs.statSync(pdfFile);
    const fileSizeInKB = (stats.size / 1024).toFixed(2);

    console.log(`✅ PDF created successfully: ${pdfFile}`);
    console.log(`📊 File size: ${fileSizeInKB} KB\n`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await browser.close();
  }
})();
