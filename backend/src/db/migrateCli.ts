// הרצה ידנית של המיגרציות: npm run migrate
import dotenv from "dotenv";
dotenv.config();

import { runMigrations } from "./migrate";
import { pool } from "../config/db";

runMigrations()
  .then(() => {
    console.log("[migrate] סיום בהצלחה");
    return pool.end();
  })
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("[migrate] שגיאה:", err);
    process.exit(1);
  });
