const { Pool } = require('pg');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const pool = new Pool({
  host: process.env.DB_HOST, port: Number(process.env.DB_PORT),
  database: process.env.DB_NAME, user: process.env.DB_USER, password: process.env.DB_PASSWORD,
});

// תמונה אחת לכל פרק, על רשומת ה"מבוא" הראשונה בלבד (sort הנמוך ביותר / id הנמוך ביותר).
// שאר הרשומות -> extra=NULL כדי שלא תופיע אותה תמונה שלוש פעמים.
const CHAPTER_IMG = {
  12: '/uploads/eng_intro.svg', 13: '/uploads/eng_2stroke.svg',
  14: '/uploads/eng_4stroke.svg', 15: '/uploads/eng_wankel.svg',
  16: '/uploads/eng_perf.svg', 17: '/uploads/jet_general.svg',
  18: '/uploads/jet_turbojet.svg', 19: '/uploads/jet_turbofan.svg',
  20: '/uploads/jet_ramjet.svg', 21: '/uploads/jet_turbine.svg',
};

(async () => {
  const client = await pool.connect();
  try {
    for (const [ch, img] of Object.entries(CHAPTER_IMG)) {
      // קודם מנקים הכל
      await client.query('UPDATE learning_content SET extra = NULL WHERE chapter_id = $1', [ch]);
      // שמים תמונה רק על הרשומה הראשונה (id הנמוך ביותר, בדרך כלל המבוא)
      const first = await client.query(
        'SELECT id FROM learning_content WHERE chapter_id = $1 ORDER BY sort_order, id LIMIT 1', [ch]);
      if (first.rows.length) {
        await client.query('UPDATE learning_content SET extra = $1 WHERE id = $2', [img, first.rows[0].id]);
        console.log(`ch ${ch}: image on id ${first.rows[0].id} -> ${img}`);
      }
    }
    console.log('\nDone.');
  } catch (e) { console.error('ERROR:', e.message); }
  finally { client.release(); await pool.end(); }
})();
