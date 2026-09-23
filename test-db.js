const { Pool } = require('pg');
require('dotenv').config();
const pool = new Pool({ connectionString: process.env.PRISMA_URL || process.env.DATABASE_URL });
async function run() {
  try {
    const res = await pool.query('SELECT role, count(*) FROM "User" GROUP BY role');
    console.log('User stats:', res.rows);
  } catch (e) {
    console.error(e);
  } finally {
    pool.end();
  }
}
run();
