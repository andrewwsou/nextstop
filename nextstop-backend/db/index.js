const { Pool } = require('pg');
require('dotenv').config();

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is required. Add it to nextstop-backend/.env.');
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

pool.on('error', (err) => {
  console.error('Unexpected PostgreSQL client error:', err.message);
});

pool.connect()
  .then((client) => {
    client.release();
    console.log('Connected to PostgreSQL');
  })
  .catch(err => console.error('DB connection error:', err));

module.exports = pool;
