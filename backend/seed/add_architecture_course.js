// יוצר מגמת "מחשוב ובקרה" + קורס "ארכיטקטורת מחשבים" עם פרקים ותוכן טכני מעמיק.
// אידמפוטנטי לכל הרמות (מגמה/קורס/פרק/תוכן) לפי שם/כותרת.
const { Pool } = require('pg');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const pool = new Pool({
  host: process.env.DB_HOST, port: Number(process.env.DB_PORT),
  database: process.env.DB_NAME, user: process.env.DB_USER, password: process.env.DB_PASSWORD,
});
const en = (t) => `<span dir="ltr">${t}</span>`;

const SPEC = { name: 'מגמת מחשוב ובקרה', description: 'ארכיטקטורת מחשבים, מעבדים, זיכרון ומערכות בקרה' };
const COURSE = { title: 'ארכיטקטורת מחשבים', description: 'מבנה המחשב מבפנים — מעבד, זיכרון RAM, מטמון, אפיקים, ומקביליות ברמה הטכנית.' };

// פרקים + תוכן. img מצביע לשרטוט ב-/uploads (נוצר ע"י gen_arch_diagrams.js).
const CHAPTERS = [
  { title: 'מבוא לארכיטקטורת מחשבים ומודל פון-נוימן', order: 1, content: [
    { title: 'מודל פון-נוימן (Von Neumann)', img: '/uploads/arch_vonneumann.svg', body: `
<h3>מהי ארכיטקטורת מחשב?</h3>
<p>ארכיטקטורת מחשב היא התכנון הלוגי והפיזי של רכיבי המחשב ואופן האינטראקציה ביניהם — כיצד המעבד, הזיכרון וההתקנים מחוברים ומתקשרים.</p>
<h3>מודל פון-נוימן</h3>
<p>רוב המחשבים בנויים על מודל פון-נוימן, שבו <b>הוראות התוכנית והנתונים נשמרים יחד באותו זיכרון</b>. המודל כולל ארבעה חלקים:</p>
<ul>
  <li><b>יחידת עיבוד מרכזית</b> (${en('CPU')}) — מבצעת את ההוראות.</li>
  <li><b>זיכרון ראשי</b> (${en('Memory / RAM')}) — מאחסן הוראות ונתונים.</li>
  <li><b>יחידות קלט/פלט</b> (${en('I/O')}) — תקשורת עם העולם החיצון.</li>
  <li><b>אפיק</b> (${en('Bus')}) — מחבר בין כל הרכיבים.</li>
</ul>
<h3>"צוואר הבקבוק של פון-נוימן"</h3>
<p>מכיוון שהוראות ונתונים עוברים באותו אפיק בין המעבד לזיכרון, קצב ההעברה מגביל את הביצועים. זהו ${en('Von Neumann Bottleneck')} — אחת הסיבות המרכזיות לפיתוח זיכרון מטמון ומקביליות.</p>
` },
    { title: 'מחזור ההוראה (Fetch–Decode–Execute)', img: '/uploads/arch_cycle.svg', body: `
<h3>מחזור ההוראה</h3>
<p>המעבד מבצע כל הוראה בשלושה שלבים החוזרים על עצמם מיליארדי פעמים בשנייה:</p>
<ul>
  <li><b>שליפה</b> (${en('Fetch')}) — ההוראה נשלפת מהזיכרון לפי מונה התוכנית (${en('Program Counter')}).</li>
  <li><b>פענוח</b> (${en('Decode')}) — יחידת הבקרה מפענחת מה ההוראה דורשת.</li>
  <li><b>ביצוע</b> (${en('Execute')}) — היחידה האריתמטית-לוגית (${en('ALU')}) מבצעת את הפעולה.</li>
</ul>
<h3>רכיבי הליבה של המעבד</h3>
<ul>
  <li><b>${en('ALU')}</b> (יחידה אריתמטית-לוגית) — חישובים ופעולות לוגיות.</li>
  <li><b>${en('CU')}</b> (יחידת בקרה) — מתזמנת ומכוונת את שאר הרכיבים.</li>
  <li><b>אוגרים</b> (${en('Registers')}) — תאי זיכרון זעירים ומהירים ביותר בתוך המעבד.</li>
</ul>
<h3>שעון המעבד (${en('Clock')})</h3>
<p>תדר השעון (${en('GHz')}) קובע כמה מחזורים בשנייה המעבד מבצע. מעבד ${en('3 GHz')} מבצע 3 מיליארד מחזורי שעון בשנייה.</p>
` },
  ]},

  { title: 'זיכרון RAM והיררכיית הזיכרון', order: 2, content: [
    { title: 'מהו זיכרון RAM וכיצד הוא עובד', img: '/uploads/arch_ram.svg', body: `
<h3>זיכרון גישה אקראית (${en('RAM')})</h3>
<p>${en('RAM')} (${en('Random Access Memory')}) הוא הזיכרון הראשי של המחשב — מהיר, נדיף (${en('Volatile')}, מתאפס בכיבוי) ומאפשר גישה אקראית: ניתן לקרוא/לכתוב לכל תא בזמן זהה, ללא תלות במיקומו.</p>
<h3>שני סוגים עיקריים</h3>
<ul>
  <li><b>${en('DRAM')}</b> (${en('Dynamic RAM')}) — כל סיבית נשמרת בקבל זעיר שדורש "רענון" מתמיד. זול וצפוף — משמש כזיכרון הראשי.</li>
  <li><b>${en('SRAM')}</b> (${en('Static RAM')}) — שומר מידע ללא רענון, מהיר בהרבה אך יקר וגדול פיזית — משמש לזיכרון מטמון (${en('Cache')}).</li>
</ul>
<h3>כתובות וארגון</h3>
<p>הזיכרון מאורגן כמערך של תאים, לכל אחד <b>כתובת</b> ייחודית. המעבד ניגש לתא דרך אפיק הכתובות (${en('Address Bus')}), והנתונים עוברים באפיק הנתונים (${en('Data Bus')}).</p>
<h3>מושגים טכניים</h3>
<ul>
  <li><b>${en('DDR')}</b> (${en('Double Data Rate')}) — מעביר נתונים בשני קצוות אות השעון; דורות: ${en('DDR3, DDR4, DDR5')}.</li>
  <li><b>${en('Latency')}</b> (השהיה) — הזמן עד שהזיכרון מחזיר נתון (${en('CAS Latency')}).</li>
  <li><b>${en('Bandwidth')}</b> (רוחב פס) — כמות הנתונים בשנייה.</li>
</ul>
` },
    { title: 'היררכיית הזיכרון והמטמון (Cache)', img: '/uploads/arch_hierarchy.svg', body: `
<h3>למה צריך היררכיה?</h3>
<p>יש פער עצום בין מהירות המעבד למהירות ה-${en('RAM')}. כדי לגשר עליו בנוי הזיכרון בשכבות — מהיר/קטן/יקר למעלה, איטי/גדול/זול למטה:</p>
<ul>
  <li><b>אוגרים</b> (${en('Registers')}) — הכי מהיר, בתוך המעבד (פחות מ-${en('1 ns')}).</li>
  <li><b>מטמון ${en('L1 / L2 / L3')}</b> (${en('SRAM')}) — מהיר מאוד, ליד הליבות.</li>
  <li><b>זיכרון ראשי ${en('RAM')}</b> (${en('DRAM')}) — גדול ובינוני במהירות.</li>
  <li><b>אחסון</b> (${en('SSD / HDD')}) — עצום ואיטי, לא נדיף.</li>
</ul>
<h3>עקרון המקומיות (${en('Locality')})</h3>
<p>המטמון עובד כי תוכניות נוטות לגשת שוב ושוב לאותם נתונים (מקומיות זמנית) ולנתונים סמוכים (מקומיות מרחבית). לכן שמירת בלוק נתונים במטמון מאיצה גישות עתידיות.</p>
<h3>פגיעה והחטאה (${en('Hit / Miss')})</h3>
<p>אם הנתון נמצא במטמון — ${en('Cache Hit')} (מהיר). אם לא — ${en('Cache Miss')}, והמעבד נאלץ לפנות ל-${en('RAM')} האיטי. שיעור הפגיעות (${en('Hit Rate')}) הוא מדד מרכזי לביצועים.</p>
` },
  ]},

  { title: 'אפיקים, קלט/פלט ותקשורת פנימית', order: 3, content: [
    { title: 'אפיקים (Buses): כתובות, נתונים ובקרה', img: '/uploads/arch_bus.svg', body: `
<h3>מהו אפיק?</h3>
<p>אפיק (${en('Bus')}) הוא אוסף קווים מוליכים שמעבירים מידע בין רכיבי המחשב. שלושה סוגים:</p>
<ul>
  <li><b>אפיק כתובות</b> (${en('Address Bus')}) — נושא את כתובת תא הזיכרון. רוחבו קובע כמה זיכרון ניתן למען (${en('32-bit')} → ${en('4 GB')}).</li>
  <li><b>אפיק נתונים</b> (${en('Data Bus')}) — נושא את הנתונים עצמם. רוחבו (${en('32/64 bit')}) קובע כמה ביטים עוברים בו-זמנית.</li>
  <li><b>אפיק בקרה</b> (${en('Control Bus')}) — אותות בקרה (קריאה/כתיבה, פסיקות וכו').</li>
</ul>
<h3>תקני אפיקים מודרניים</h3>
<p>${en('PCIe')} (כרטיסי מסך/${en('SSD')}), ${en('SATA / NVMe')} (אחסון), ${en('USB')} (התקנים חיצוניים).</p>
` },
    { title: 'קלט/פלט ופסיקות (Interrupts)', img: null, body: `
<h3>שיטות קלט/פלט</h3>
<ul>
  <li><b>${en('Polling')} (תשאול)</b> — המעבד בודק שוב ושוב אם ההתקן מוכן. פשוט אך מבזבז זמן מעבד.</li>
  <li><b>${en('Interrupts')} (פסיקות)</b> — ההתקן "מקפיץ" אות למעבד כשהוא מוכן; המעבד עוצר, מטפל, וממשיך. יעיל בהרבה.</li>
  <li><b>${en('DMA')} (${en('Direct Memory Access')})</b> — ההתקן מעביר נתונים ישירות ל-${en('RAM')} בלי לערב את המעבד בכל בית, ומשחרר אותו למשימות אחרות.</li>
</ul>
<h3>מנגנון הפסיקה</h3>
<p>בקבלת פסיקה המעבד שומר את מצבו הנוכחי, קופץ לשגרת טיפול (${en('ISR')}), ובסיומה משחזר את מצבו וממשיך מהמקום בו עצר.</p>
` },
  ]},

  { title: 'מקביליות וטכניקות האצה', order: 4, content: [
    { title: 'עיבוד מקבילי (Parallelism) וריבוי ליבות', img: '/uploads/arch_parallel.svg', body: `
<h3>מהי מקביליות?</h3>
<p>מקביליות (${en('Parallelism')}) היא ביצוע כמה פעולות <b>בו-זמנית</b> כדי להאיץ עיבוד — בניגוד לעיבוד טורי (${en('Serial')}) שבו פעולה אחת בכל רגע.</p>
<h3>רמות מקביליות</h3>
<ul>
  <li><b>מקביליות ברמת הוראות</b> (${en('ILP')}) — המעבד מבצע כמה הוראות בו-זמנית (${en('Pipelining')}, ${en('Superscalar')}).</li>
  <li><b>מקביליות ברמת חוטים</b> (${en('TLP')}) — ריבוי חוטי ביצוע (${en('Threads')}), כמו ${en('Hyper-Threading')}.</li>
  <li><b>מקביליות ברמת נתונים</b> (${en('DLP')}) — אותה פעולה על הרבה נתונים (${en('SIMD')}, מעבדי ${en('GPU')}).</li>
</ul>
<h3>ריבוי ליבות (${en('Multi-core')})</h3>
<p>מעבד מודרני מכיל כמה ליבות עצמאיות על שבב אחד, שכל אחת מריצה הוראות במקביל. ${en('4, 8, 16')} ליבות ויותר.</p>
<h3>חוק אמדל (${en('Amdahl&rsquo;s Law')})</h3>
<p>ההאצה ממקביליות מוגבלת על ידי החלק <b>הטורי</b> של התוכנית שלא ניתן להקביל. אם 10% מהקוד טורי, גם עם אינסוף מעבדים ההאצה המרבית היא פי 10.</p>
` },
    { title: 'צנרת (Pipelining) וזיכרון וירטואלי', img: '/uploads/arch_pipeline.svg', body: `
<h3>צנרת (${en('Pipelining')})</h3>
<p>במקום לסיים הוראה לפני שמתחילים את הבאה, המעבד מחלק את מחזור ההוראה לשלבים ומריץ אותם כמו פס ייצור: בעוד הוראה אחת ב"ביצוע", הבאה ב"פענוח" והשלישית ב"שליפה". כך עולה התפוקה (${en('Throughput')}) משמעותית.</p>
<h3>סיכוני צנרת (${en('Hazards')})</h3>
<ul>
  <li><b>תלות נתונים</b> — הוראה זקוקה לתוצאה של קודמתה.</li>
  <li><b>הסתעפות</b> (${en('Branch')}) — קפיצה מותנית; נפתר ע"י ניבוי הסתעפויות (${en('Branch Prediction')}).</li>
</ul>
<h3>זיכרון וירטואלי (${en('Virtual Memory')})</h3>
<p>מנגנון שמאפשר לתוכניות "לראות" יותר זיכרון מה-${en('RAM')} הפיזי, על ידי שמירת חלקים על האחסון (${en('Paging')}). יחידת ${en('MMU')} מתרגמת כתובות וירטואליות לפיזיות. כאשר נדרש דף שאינו ב-${en('RAM')} מתרחש ${en('Page Fault')} והוא נטען מהדיסק.</p>
` },
  ]},
];

async function upsertContent(client, chId, items) {
  let i = 1;
  for (const it of items) {
    const ex = await client.query('SELECT id FROM learning_content WHERE chapter_id=$1 AND title=$2', [chId, it.title]);
    if (ex.rows.length) {
      await client.query('UPDATE learning_content SET content=$1, extra=$2, sort_order=$3 WHERE id=$4',
        [it.body.trim(), it.img, i, ex.rows[0].id]);
    } else {
      await client.query(
        `INSERT INTO learning_content (course_id, chapter_id, content_type, title, content, extra, sort_order)
         VALUES (NULL,$1,'RICH',$2,$3,$4,$5)`, [chId, it.title, it.body.trim(), it.img, i]);
    }
    i++;
  }
}

(async () => {
  const client = await pool.connect();
  try {
    // 1) מגמה
    let s = await client.query('SELECT id FROM specializations WHERE name=$1', [SPEC.name]);
    const sid = s.rows.length ? s.rows[0].id
      : (await client.query('INSERT INTO specializations (name,description) VALUES ($1,$2) RETURNING id', [SPEC.name, SPEC.description])).rows[0].id;
    console.log('specialization id', sid);

    // 2) קורס
    let c = await client.query('SELECT id FROM courses WHERE title=$1', [COURSE.title]);
    const cid = c.rows.length
      ? (await client.query('UPDATE courses SET specialization_id=$1, description=$2 WHERE id=$3 RETURNING id', [sid, COURSE.description, c.rows[0].id])).rows[0].id
      : (await client.query('INSERT INTO courses (title,description,specialization_id) VALUES ($1,$2,$3) RETURNING id', [COURSE.title, COURSE.description, sid])).rows[0].id;
    console.log('course id', cid);

    // 3) פרקים + תוכן
    for (const ch of CHAPTERS) {
      let chRow = await client.query('SELECT id FROM chapters WHERE course_id=$1 AND title=$2', [cid, ch.title]);
      const chId = chRow.rows.length
        ? (await client.query('UPDATE chapters SET order_number=$1 WHERE id=$2 RETURNING id', [ch.order, chRow.rows[0].id])).rows[0].id
        : (await client.query('INSERT INTO chapters (course_id,title,order_number,is_active) VALUES ($1,$2,$3,TRUE) RETURNING id', [cid, ch.title, ch.order])).rows[0].id;
      await upsertContent(client, chId, ch.content);
      console.log('  chapter', chId, '-', ch.title, '(' + ch.content.length + ' items)');
    }
    console.log('\nDone.');
  } catch (e) { console.error('ERROR:', e.message); }
  finally { client.release(); await pool.end(); }
})();
