'use strict';

const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

function connectionOptions() {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }
  return {
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    multipleStatements: true,
  };
}

async function main() {
  const schemaPath = path.join(__dirname, '..', 'database', 'schema.sql');
  const sql = fs.readFileSync(schemaPath, 'utf8');
  const connection = await mysql.createConnection(connectionOptions());

  try {
    await connection.query(sql);
    console.log('Database schema applied successfully.');
  } finally {
    await connection.end();
  }
}

main().catch(function (error) {
  console.error('Database setup failed:', error.message);
  process.exitCode = 1;
});
