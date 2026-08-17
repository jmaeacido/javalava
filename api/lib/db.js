'use strict';

const crypto = require('crypto');
const mysql = require('mysql2/promise');

let pool = null;

function dbConfig() {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }

  return {
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'javalava',
    waitForConnections: true,
    connectionLimit: 10,
    timezone: 'Z',
    dateStrings: true,
  };
}

function isConfigured() {
  if (String(process.env.DB_DISABLED || '').toLowerCase() === 'true') return false;
  return true;
}

function getPool() {
  if (!pool) {
    pool = mysql.createPool(dbConfig());
  }
  return pool;
}

async function query(sql, params = []) {
  const [rows] = await getPool().execute(sql, params);
  return rows;
}

function newId() {
  return crypto.randomUUID();
}

module.exports = {
  dbConfig,
  getPool,
  query,
  isConfigured,
  newId,
};
