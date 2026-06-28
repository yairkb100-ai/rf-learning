const fs = require('fs');
const path = require('path');
const UP = path.join(__dirname, 'uploads');
const FONT = "font-family='Heebo, Arial, sans-serif'";
const svg = (w, h, body) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" direction="rtl"><rect width="${w}" height="${h}" fill="#ffffff"/>${body}</svg>`;
const T = (x, y, s, o = {}) => `<text x="${x}" y="${y}" ${FONT} font-size="${o.size||15}" fill="${o.fill||'#1c1d1f'}" text-anchor="${o.anchor||'middle'}" font-weight="${o.weight||'400'}">${s}</text>`;
const box = (x, y, w, h, fill, stroke = '#a435f0') => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="10" fill="${fill}" stroke="${stroke}" stroke-width="2"/>`;
const DEF = `<defs><marker id="ah" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto"><path d="M0,0 L8,3 L0,6 Z" fill="#555"/></marker></defs>`;
const arr = (x1, y1, x2, y2) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#555" stroke-width="2.5" marker-end="url(#ah)"/>`;
const title = (t, w) => T(w/2, 32, t, { size: 21, weight: '700' });
const C = ['#f3e8ff', '#e8f0ff', '#fff3e0', '#e8f7ec', '#ffe8ec'];

const files = {};

// 1) פון-נוימן
files['arch_vonneumann.svg'] = (() => {
  let b = DEF + title('מודל פון-נוימן', 720);
  b += box(290, 70, 140, 60, C[0]); b += T(360, 105, 'CPU (מעבד)', { weight: '600' });
  b += box(60, 180, 160, 60, C[1]); b += T(140, 215, 'זיכרון (RAM)', { weight: '600' });
  b += box(500, 180, 160, 60, C[3]); b += T(580, 215, 'קלט / פלט (I/O)', { weight: '600' });
  // אפיק
  b += `<rect x="120" y="140" width="480" height="14" rx="7" fill="#a435f0"/>`;
  b += T(360, 172, 'אפיק (Bus)', { size: 13, fill: '#7a2bbf', weight: '600' });
  b += arr(360, 130, 360, 140); b += arr(140, 180, 140, 154); b += arr(580, 180, 580, 154);
  b += T(360, 280, 'הוראות ונתונים חולקים את אותו זיכרון ואותו אפיק', { size: 14, fill: '#555' });
  return svg(720, 310, b);
})();

// 2) מחזור הוראה
files['arch_cycle.svg'] = (() => {
  let b = DEF + title('מחזור ההוראה: Fetch → Decode → Execute', 720);
  const labels = ['שליפה\nFetch', 'פענוח\nDecode', 'ביצוע\nExecute'];
  const cx = [560, 360, 160], y = 90, w = 150, h = 80;
  for (let i = 0; i < 3; i++) {
    b += box(cx[i] - w/2, y, w, h, C[i]);
    labels[i].split('\n').forEach((ln, k) => b += T(cx[i], y + 35 + k * 22, ln, { weight: '600', size: 15 }));
    if (i < 2) b += arr(cx[i] - w/2, y + h/2, cx[i+1] + w/2, y + h/2);
  }
  // לולאה חזרה
  b += `<path d="M160,170 Q360,240 560,170" stroke="#999" stroke-width="2" fill="none" marker-end="url(#ah)"/>`;
  b += T(360, 235, 'חוזר מיליארדי פעמים בשנייה', { size: 13, fill: '#555' });
  return svg(720, 260, b);
})();

// 3) RAM
files['arch_ram.svg'] = (() => {
  let b = DEF + title('זיכרון RAM — מערך תאים עם כתובות', 720);
  const cols = 6, rows = 3, cw = 90, ch = 42, x0 = 90, y0 = 70;
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    const x = x0 + c * cw, y = y0 + r * (ch + 8);
    b += `<rect x="${x}" y="${y}" width="${cw - 8}" height="${ch}" rx="5" fill="${C[1]}" stroke="#3d7bff" stroke-width="1.5"/>`;
    b += T(x + (cw-8)/2, y + 27, '0x' + (r*cols+c).toString(16).toUpperCase().padStart(2,'0'), { size: 12, fill: '#3d7bff' });
  }
  b += T(360, 250, 'גישה אקראית: כל תא נגיש בזמן זהה לפי כתובתו', { size: 14, fill: '#555' });
  b += T(360, 275, 'DRAM = זול וצפוף (ראשי) | SRAM = מהיר ויקר (מטמון)', { size: 13, fill: '#555' });
  return svg(720, 295, b);
})();

// 4) היררכיית זיכרון (פירמידה)
files['arch_hierarchy.svg'] = (() => {
  let b = title('היררכיית הזיכרון', 720);
  const levels = [
    ['אוגרים (Registers) — הכי מהיר', 260, C[0]],
    ['מטמון L1/L2/L3 (SRAM)', 360, C[1]],
    ['זיכרון ראשי RAM (DRAM)', 480, C[2]],
    ['אחסון SSD / HDD — הכי גדול', 620, C[3]],
  ];
  let y = 60;
  levels.forEach(([lbl, w, col]) => {
    b += `<rect x="${360 - w/2}" y="${y}" width="${w}" height="56" rx="6" fill="${col}" stroke="#a435f0" stroke-width="1.5"/>`;
    b += T(360, y + 34, lbl, { weight: '600', size: 14 });
    y += 64;
  });
  b += T(120, 90, 'מהיר', { size: 13, fill: '#1e8e3e', weight: '700' });
  b += T(120, 300, 'איטי', { size: 13, fill: '#d23f3f', weight: '700' });
  b += T(600, 90, 'קטן/יקר', { size: 13, fill: '#555' });
  b += T(600, 300, 'גדול/זול', { size: 13, fill: '#555' });
  return svg(720, 340, b);
})();

// 5) אפיקים
files['arch_bus.svg'] = (() => {
  let b = DEF + title('שלושת האפיקים', 720);
  b += box(300, 70, 120, 50, C[0]); b += T(360, 100, 'CPU', { weight: '600' });
  box;
  const lanes = [['אפיק כתובות (Address)', '#3d7bff', 150], ['אפיק נתונים (Data)', '#a435f0', 185], ['אפיק בקרה (Control)', '#ff8a3d', 220]];
  lanes.forEach(([lbl, col, y]) => {
    b += `<rect x="120" y="${y}" width="480" height="12" rx="6" fill="${col}"/>`;
    b += T(360, y - 4, lbl, { size: 12, fill: col, weight: '600' });
  });
  b += box(120, 250, 150, 50, C[1]); b += T(195, 280, 'זיכרון', { weight: '600' });
  b += box(450, 250, 150, 50, C[3]); b += T(525, 280, 'התקני I/O', { weight: '600' });
  b += arr(360, 120, 360, 145);
  return svg(720, 320, b);
})();

// 6) מקביליות
files['arch_parallel.svg'] = (() => {
  let b = DEF + title('עיבוד טורי מול מקבילי', 720);
  b += T(540, 70, 'טורי (Serial)', { weight: '700', size: 15 });
  for (let i = 0; i < 4; i++) { b += box(460 + 0, 85 + i * 42, 160, 34, C[4]); b += T(540, 107 + i * 42, 'משימה ' + (i+1), { size: 13 }); }
  b += T(200, 70, 'מקבילי (Parallel)', { weight: '700', size: 15 });
  for (let i = 0; i < 4; i++) { b += box(60 + i * 75, 85, 68, 120, C[3]); b += T(94 + i * 75, 150, 'ליבה', { size: 12 }); b += T(94 + i*75, 168, (i+1), {size:12}); }
  b += T(360, 250, 'ריבוי ליבות מבצע משימות בו-זמנית — חוק אמדל מגביל את ההאצה', { size: 13, fill: '#555' });
  return svg(720, 275, b);
})();

// 7) צנרת
files['arch_pipeline.svg'] = (() => {
  let b = title('צנרת (Pipelining)', 720);
  const stages = ['F', 'D', 'E'], colors = [C[0], C[1], C[3]];
  for (let instr = 0; instr < 3; instr++) {
    b += T(660, 80 + instr * 50, 'הוראה ' + (instr + 1), { size: 13, anchor: 'end' });
    for (let s = 0; s < 3; s++) {
      const x = 560 - (instr + s) * 90;
      b += `<rect x="${x}" y="${62 + instr * 50}" width="84" height="36" rx="5" fill="${colors[s]}" stroke="#a435f0" stroke-width="1.5"/>`;
      b += T(x + 42, 86 + instr * 50, stages[s], { weight: '700' });
    }
  }
  b += T(360, 250, 'בעוד הוראה ב-Execute, הבאה ב-Decode והשלישית ב-Fetch — תפוקה גבוהה', { size: 13, fill: '#555' });
  return svg(720, 275, b);
})();

for (const [name, content] of Object.entries(files)) {
  fs.writeFileSync(path.join(UP, name), content, 'utf8');
  console.log('wrote', name, '(' + content.length + ' bytes)');
}
console.log('\nAll architecture diagrams written.');
