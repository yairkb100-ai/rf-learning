const markdownPdf = require('markdown-pdf');
const fs = require('fs');
const path = require('path');

const mdFile = path.join(__dirname, 'SYSTEM_BOOK.md');
const pdfFile = path.join(__dirname, 'SYSTEM_BOOK.pdf');

const options = {
  cssPath: path.join(__dirname, 'pdf-styles.css'),
  paperBorder: '1cm',
  runnings: {
    header: {
      height: '1cm',
      contents: 'לומדת ענף 71 - ספר המערכת'
    },
    footer: {
      height: '0.5cm',
      contents: {
        first: 'עמוד 1',
        2: 'עמוד 2',
        default: '<span style="color: #444;">{{page}}</span>',
        last: 'עמוד אחרון'
      }
    }
  }
};

console.log('📄 Converting Markdown to PDF...\n');

const md = fs.createReadStream(mdFile);
const pdf = fs.createWriteStream(pdfFile);

markdownPdf(options).from.stream(md).to.stream(pdf, () => {
  console.log(`✅ PDF created successfully: ${pdfFile}`);
});

pdf.on('error', (error) => {
  console.error('❌ Error creating PDF:', error.message);
});
