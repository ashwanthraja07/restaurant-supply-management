const path = require('path');
const fs = require('fs');
const oracledb = require('oracledb');
require('dotenv').config();

// Initialize Oracle Client (Thick mode) for Oracle 11g compatibility
const localClientDir = path.resolve(__dirname, '../../instantclient_19_26');
if (fs.existsSync(localClientDir)) {
  try {
    oracledb.initOracleClient({ libDir: localClientDir });
    console.log('Initialized Oracle Client from:', localClientDir);
  } catch (e) {
    console.log('Oracle Client already initialized or failed:', e.message);
  }
}

oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;
oracledb.autoCommit = true; 

const dbConfig = {
  user: process.env.ORACLE_USER,
  password: process.env.ORACLE_PASSWORD,
  connectString: process.env.ORACLE_CONNECT_STRING
};

let pool;

async function initialize() {
  try {
    pool = await oracledb.createPool(dbConfig);
    console.log('Oracle Database connection pool started.');
  } catch (err) {
    console.error('Error starting Oracle connection pool:', err.message);
  }
}

async function close() {
  try {
    if (pool) {
      await pool.close(10);
      console.log('Oracle Database connection pool closed.');
    }
  } catch (err) {
    console.error('Error closing Oracle connection pool:', err.message);
  }
}

async function getConnection() {
  if (!pool) {
    throw new Error('Database pool is not initialized');
  }
  return await pool.getConnection();
}

module.exports = {
  initialize,
  close,
  getConnection,
  oracledb
};
