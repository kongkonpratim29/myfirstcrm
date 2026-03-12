const mysql = require('mysql2/promise');
require('dotenv').config();

async function resetDatabase() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'crm_database',
    port: process.env.DB_PORT || 3306
  });

  try {
    console.log('Dropping existing tables...');
    
    // Drop tables in reverse order due to foreign key constraints
    await connection.query('DROP TABLE IF EXISTS notes');
    await connection.query('DROP TABLE IF EXISTS activities');
    await connection.query('DROP TABLE IF EXISTS tasks');
    await connection.query('DROP TABLE IF EXISTS deals');
    await connection.query('DROP TABLE IF EXISTS contacts');
    await connection.query('DROP TABLE IF EXISTS companies');
    await connection.query('DROP TABLE IF EXISTS users');
    
    console.log('✅ All tables dropped successfully');
    console.log('Tables will be recreated when server starts');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await connection.end();
  }
}

resetDatabase();
