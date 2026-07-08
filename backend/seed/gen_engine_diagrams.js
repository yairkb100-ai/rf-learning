// יוצר שרטוטי SVG בעברית להמחשה, שומר אותם בתיקיית uploads ומחזיר את הנתיבים.
const fs = require('fs');
const path = require('path');
const UP = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(UP)) fs.mkdirSync(UP, { recursive: true });

const FONT = "font-family='Heebo, Arial, sans-serif'";
function svg(w, h, body) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" direction="rtl">
<rect width="${w}" height="${h}" fill="#ffffff"/>${body}</svg>`;
}
const T = (x, y, s, opt = {}) =>
  `<text x="${x}" y="${y}" ${FONT} font-size="${opt.size||16}" fill="${opt.fill||'#1c1d1f'}" text-anchor="${opt.anchor||'middle'}" font-weight="${opt.weight||'400'}">${s}</text>`;
const box = (x, y, w, h, fill, stroke = '#a435f0') =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="10" fill="${fill}" stroke="${stroke}" stroke-width="2"/>`;
const arrow = (x1, y1, x2, y2) =>
  `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#555" stroke-width="2.5" marker-end="url(#ah)"/>`;
const DEF = `<defs><marker id="ah" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto"><path d="M0,0 L8,3 L0,6 Z" fill="#555"/></marker></defs>`;

// כותרת עליונה אחידה
const title = (t, w) => T(w/2, 34, t, { size: 22, weight: '700', fill: '#1c1d1f' });

// ---- בלוק שלבים אופקי (ימין לשמאל) ----
function stages(w, h, headerText, items, colors) {
  let body = DEF + title(headerText, w);
  const n = items.length;
  const pad = 30, gap = 18;
  const bw = (w - pad * 2 - gap * (n - 1)) / n;
  const y = 80, bh = 90;
  // מימין לשמאל: הפריט הראשון בימין
  for (let i = 0; i < n; i++) {
    const x = w - pad - bw - i * (bw + gap);
    body += box(x, y, bw, bh, colors[i % colors.length]);
    // טקסט (אפשר שתי שורות מופרדות ב-\n)
    const lines = items[i].split('\n');
    lines.forEach((ln, k) =>
      body += T(x + bw/2, y + bh/2 + 6 + (k - (lines.length-1)/2) * 20, ln, { size: 15, weight: '600' }));
    if (i < n - 1) {
      const ax = x; // חץ אל הבלוק הבא (שמשמאל)
      body += arrow(ax, y + bh/2, ax - gap, y + bh/2);
    }
  }
  return svg(w, h, body);
}

const C = ['#f3e8ff', '#e8f0ff', '#fff3e0', '#e8f7ec', '#ffe8ec'];

const files = {
  // מנועי בוכנה
  'eng_4stroke.svg': stages(720, 210, 'מחזור 4 פעימות (מחזור אוטו)',
    ['יניקה\nIntake', 'דחיסה\nCompression', 'הספק\nPower', 'פליטה\nExhaust'], C),
  'eng_2stroke.svg': stages(720, 210, 'מחזור 2 פעימות',
    ['עלייה\nדחיסה + יניקה', 'ירידה\nהספק + סחיטה'], C),
  'eng_wankel.svg': (() => {
    let b = DEF + title('מנוע Wankel — רוטור משולש בתא אובאלי', 720);
    // אליפסה + משולש מסתובב
    b += `<ellipse cx="360" cy="135" rx="180" ry="95" fill="#f3e8ff" stroke="#a435f0" stroke-width="3"/>`;
    b += `<polygon points="360,55 470,190 250,190" fill="#fff" stroke="#7a2bbf" stroke-width="3"/>`;
    b += `<circle cx="360" cy="135" r="14" fill="#a435f0"/>`;
    b += T(360, 235, 'הרוטור יוצר 3 תאי עבודה בתנועה סיבובית רציפה', { size: 15, fill: '#555' });
    return svg(720, 260, b);
  })(),
  'eng_perf.svg': (() => {
    let b = DEF + title('מאזן אנרגיה במנוע בעירה פנימית', 720);
    const data = [['עבודה מועילה', 33, '#a435f0'], ['חום בפליטה', 30, '#ff8a3d'],
                  ['קירור', 30, '#3d7bff'], ['חיכוך', 7, '#9aa0a6']];
    let x = 690, total = 100, barW = 660, y = 90;
    data.forEach(([lbl, pct, col]) => {
      const w = barW * pct / 100;
      b += `<rect x="${x - w}" y="${y}" width="${w}" height="60" fill="${col}"/>`;
      b += T(x - w/2, y + 36, pct + '%', { size: 16, weight: '700', fill: '#fff' });
      x -= w;
    });
    let lx = 690, ly = 190;
    data.forEach(([lbl, , col]) => {
      b += `<rect x="${lx-16}" y="${ly-12}" width="14" height="14" fill="${col}"/>`;
      b += T(lx - 24, ly, lbl, { size: 14, anchor: 'end' });
      lx -= 165;
    });
    return svg(720, 230, b);
  })(),

  // מנועי סילון
  'jet_general.svg': stages(760, 210, 'מבנה מנוע סילון (מחזור Brayton)',
    ['קולט\nInlet', 'דחסן\nCompressor', 'תא בעירה\nCombustor', 'טורבינה\nTurbine', 'נחיר\nNozzle'], C),
  'jet_turbojet.svg': (() => {
    let b = DEF + title('Turbojet — כל האוויר עובר את הליבה', 760);
    b += box(560, 95, 150, 70, C[1]); b += T(635, 138, 'דחסן', {weight:'600'});
    b += box(395, 95, 150, 70, C[2]); b += T(470, 138, 'תא בעירה', {weight:'600'});
    b += box(230, 95, 150, 70, C[3]); b += T(305, 138, 'טורבינה', {weight:'600'});
    b += box(70, 95, 145, 70, C[4]); b += T(142, 138, 'נחיר (דחף)', {weight:'600'});
    b += arrow(560,130,545,130); b += arrow(395,130,380,130); b += arrow(230,130,215,130);
    b += T(380, 200, 'דחף גבוה במהירויות גבוהות, צריכת דלק גבוהה', {size:15, fill:'#555'});
    return svg(760, 230, b);
  })(),
  'jet_turbofan.svg': (() => {
    let b = DEF + title('Turbofan — מאוורר + זרם עוקף (Bypass)', 760);
    b += `<rect x="650" y="70" width="40" height="120" rx="6" fill="#a435f0"/>`;
    b += T(670, 210, 'מאוורר', {size:13, weight:'600'});
    b += box(470, 95, 160, 70, C[2]); b += T(550, 138, 'ליבה (Core)', {weight:'600'});
    b += `<path d="M650,80 Q400,40 120,70" stroke="#3d7bff" stroke-width="14" fill="none"/>`;
    b += T(330, 55, 'זרם עוקף — רוב הדחף', {size:14, fill:'#3d7bff', weight:'600'});
    b += arrow(470,130,455,130);
    b += T(380, 205, 'יחס עקיפה גבוה = יעילות גבוהה ושקט', {size:15, fill:'#555'});
    return svg(760, 235, b);
  })(),
  'jet_ramjet.svg': (() => {
    let b = DEF + title('Ramjet / Scramjet — ללא חלקים נעים', 760);
    b += `<polygon points="700,90 700,170 80,200 80,60" fill="#fff3e0" stroke="#a435f0" stroke-width="2"/>`;
    b += T(620, 135, 'דחיסה\nממהירות', {size:14, weight:'600'});
    b += T(400, 135, 'בעירה', {size:15, weight:'600'});
    b += T(180, 135, 'נחיר\nדחף', {size:14, weight:'600'});
    b += arrow(660,130,150,130);
    b += T(390, 225, 'הדחיסה מושגת ממהירות הטיסה (מאך 3+)', {size:15, fill:'#555'});
    return svg(760, 250, b);
  })(),
  'jet_turbine.svg': (() => {
    let b = DEF + title('טורבינה — להבים בגזים חמים בלחץ גבוה', 720);
    b += `<circle cx="360" cy="140" r="30" fill="#a435f0"/>`;
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      const x1 = 360 + Math.cos(a) * 32, y1 = 140 + Math.sin(a) * 32;
      const x2 = 360 + Math.cos(a) * 95, y2 = 140 + Math.sin(a) * 95;
      b += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#7a2bbf" stroke-width="9" stroke-linecap="round"/>`;
    }
    b += T(360, 255, 'הגזים החמים מסובבים את הטורבינה ~10,000+ RPM', {size:15, fill:'#555'});
    return svg(720, 280, b);
  })(),
  'eng_intro.svg': (() => {
    let b = DEF + title('המרת אנרגיה במנוע בוכנה', 760);
    b += box(560, 95, 170, 70, C[0]); b += T(645, 130, 'דלק', {weight:'700', size:18});
    b += box(310, 95, 200, 70, C[2]); b += T(410, 125, 'בעירה', {weight:'600'}); b += T(410, 148, '(אנרגיה כימית)', {size:12,fill:'#555'});
    b += box(40, 95, 220, 70, C[3]); b += T(150, 130, 'תנועה סיבובית', {weight:'700', size:17});
    b += arrow(560,130,510,130); b += arrow(310,130,260,130);
    return svg(760, 200, b);
  })(),
};

for (const [name, content] of Object.entries(files)) {
  fs.writeFileSync(path.join(UP, name), content, 'utf8');
  console.log('wrote', name, '(' + content.length + ' bytes)');
}
console.log('\nAll diagrams written to /uploads');
