const fs = require('fs');
const path = require('path');
const markdownIt = require('markdown-it');

const mdFile = path.join(__dirname, 'GITHUB_DEPLOYMENT.md');
const htmlFile = path.join(__dirname, 'GITHUB_DEPLOYMENT.html');

const md = markdownIt({
  html: true,
  linkify: true,
  typographer: true
});

console.log('📝 Converting Markdown to HTML...\n');

// Read markdown file
const markdownContent = fs.readFileSync(mdFile, 'utf-8');

// Convert to HTML
const htmlContent = md.render(markdownContent);

// Create full HTML page
const fullHtml = `<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ספר המערכת - לומדת ענף 71</title>
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

        .subtitle {
            text-align: center;
            color: #666;
            font-size: 1.1em;
            margin-bottom: 30px;
        }

        .toc {
            background: #f0f0f0;
            padding: 20px;
            border-radius: 5px;
            margin: 30px 0;
            page-break-inside: avoid;
        }

        .toc a {
            color: #a435f0;
            text-decoration: none;
            display: block;
            margin: 8px 0;
        }

        .toc a:hover {
            text-decoration: underline;
        }

        .section {
            page-break-inside: avoid;
            margin-bottom: 30px;
        }

        blockquote {
            border-right: 4px solid #a435f0;
            padding: 15px;
            margin: 20px 0;
            background: #f9f9f9;
            border-radius: 3px;
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
            a {
                color: #a435f0;
            }
        }

        /* Code syntax highlighting */
        pre {
            white-space: pre-wrap;
            word-wrap: break-word;
        }
    </style>
</head>
<body>
    <div class="container">
${htmlContent}
        <div class="footer">
            <p>ספר המערכת - לומדת ענף 71</p>
            <p>עדכון אחרון: 2026-06-28</p>
            <p>גרסה: 1.0 Extended</p>
        </div>
    </div>
</body>
</html>`;

// Write HTML file
fs.writeFileSync(htmlFile, fullHtml, 'utf-8');

console.log(`✅ HTML created successfully: ${htmlFile}`);
console.log(`📊 File size: ${(fs.statSync(htmlFile).size / 1024).toFixed(2)} KB\n`);
