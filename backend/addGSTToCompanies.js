const mysql = require('mysql2/promise');
require('dotenv').config();

async function addGSTColumns() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'crm_database',
  });

  try {
    console.log('Adding GST columns to companies table...');

    // Check and add gstNumber column
    try {
      await connection.query(`
        ALTER TABLE companies 
        ADD COLUMN gstNumber VARCHAR(15) AFTER employeeCount
      `);
      console.log('✓ Added gstNumber column');
    } catch (err) {
      if (err.code !== 'ER_DUP_FIELDNAME') throw err;
      console.log('✓ gstNumber column already exists');
    }

    // Check and add gstVerified column
    try {
      await connection.query(`
        ALTER TABLE companies 
        ADD COLUMN gstVerified BOOLEAN DEFAULT FALSE AFTER gstNumber
      `);
      console.log('✓ Added gstVerified column');
    } catch (err) {
      if (err.code !== 'ER_DUP_FIELDNAME') throw err;
      console.log('✓ gstVerified column already exists');
    }

    // Check and add gstLegalName column
    try {
      await connection.query(`
        ALTER TABLE companies 
        ADD COLUMN gstLegalName VARCHAR(255) AFTER gstVerified
      `);
      console.log('✓ Added gstLegalName column');
    } catch (err) {
      if (err.code !== 'ER_DUP_FIELDNAME') throw err;
      console.log('✓ gstLegalName column already exists');
    }

    // Check and add gstAddress column
    try {
      await connection.query(`
        ALTER TABLE companies 
        ADD COLUMN gstAddress TEXT AFTER gstLegalName
      `);
      console.log('✓ Added gstAddress column');
    } catch (err) {
      if (err.code !== 'ER_DUP_FIELDNAME') throw err;
      console.log('✓ gstAddress column already exists');
    }

    // Add index
    try {
      await connection.query(`
        ALTER TABLE companies 
        ADD INDEX idx_gstNumber (gstNumber)
      `);
      console.log('✓ Added GST index');
    } catch (err) {
      if (err.code !== 'ER_DUP_KEYNAME') throw err;
      console.log('✓ GST index already exists');
    }

    console.log('✅ GST columns migration completed successfully');
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await connection.end();
  }
}

addGSTColumns();
