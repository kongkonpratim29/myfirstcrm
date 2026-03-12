const mysql = require('mysql2/promise');
require('dotenv').config();

const WORK_PROGRESS_STAGES = [
  'New Lead',
  'Initial Contact',
  'Requirement Discussion',
  'Proposal / Quotation Sent',
  'Follow-up / Re-approach',
  'Deal Confirmed',
  'Invoice Sent',
  'Payment Pending',
  'Payment Received',
  'Work in Progress',
  'Client Feedback / Revision',
  'Project Completed',
  'Closed'
];

const WORK_SUB_STAGES = [
  'Design in Progress',
  'Development in Progress',
  'Testing / Review'
];

// Create connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'crm_database',
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Test database connection
const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Database connected successfully');
    connection.release();
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
  }
};

// Initialize database tables
const initDatabase = async () => {
  try {
    const connection = await pool.getConnection();
    
    // Users table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(191) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        firstName VARCHAR(100) NOT NULL,
        lastName VARCHAR(100) NOT NULL,
        role ENUM('Admin', 'Manager', 'User') DEFAULT 'User',
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_role (role)
      )
    `);

    // Companies table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS companies (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        industry VARCHAR(100),
        website VARCHAR(255),
        address TEXT,
        phone VARCHAR(50),
        email VARCHAR(191),
        employeeCount INT,
        gstNumber VARCHAR(15),
        gstVerified BOOLEAN DEFAULT FALSE,
        gstLegalName VARCHAR(255),
        gstAddress TEXT,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        createdBy INT,
        FOREIGN KEY (createdBy) REFERENCES users(id) ON DELETE SET NULL,
        INDEX idx_name (name(191)),
        INDEX idx_industry (industry),
        INDEX idx_gstNumber (gstNumber)
      )
    `);

    // Contacts table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS contacts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        firstName VARCHAR(100) NOT NULL,
        lastName VARCHAR(100) NOT NULL,
        email VARCHAR(191),
        phone VARCHAR(50),
        position VARCHAR(100),
        companyId INT,
        address TEXT,
        notes TEXT,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        createdBy INT,
        FOREIGN KEY (companyId) REFERENCES companies(id) ON DELETE SET NULL,
        FOREIGN KEY (createdBy) REFERENCES users(id) ON DELETE SET NULL,
        INDEX idx_name (firstName, lastName),
        INDEX idx_company (companyId)
      )
    `);

    const stageEnum = WORK_PROGRESS_STAGES.map((stage) => `'${stage}'`).join(', ');
    const subStageEnum = WORK_SUB_STAGES.map((stage) => `'${stage}'`).join(', ');

    // Deals table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS deals (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        value DECIMAL(15, 2) DEFAULT 0,
        stage ENUM(${stageEnum}) DEFAULT 'New Lead',
        workSubStage ENUM(${subStageEnum}) DEFAULT NULL,
        probability INT DEFAULT 0,
        expectedCloseDate DATE,
        companyId INT,
        contactId INT,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        createdBy INT,
        FOREIGN KEY (companyId) REFERENCES companies(id) ON DELETE SET NULL,
        FOREIGN KEY (contactId) REFERENCES contacts(id) ON DELETE SET NULL,
        FOREIGN KEY (createdBy) REFERENCES users(id) ON DELETE SET NULL,
        INDEX idx_stage (stage),
        INDEX idx_workSubStage (workSubStage),
        INDEX idx_company (companyId),
        INDEX idx_contact (contactId)
      )
    `);

    // Backfill old stage values before enforcing the new enum values.
    await connection.query(`UPDATE deals SET stage = 'New Lead' WHERE stage = 'Lead'`);
    await connection.query(`UPDATE deals SET stage = 'Initial Contact' WHERE stage = 'Qualified'`);
    await connection.query(`UPDATE deals SET stage = 'Proposal / Quotation Sent' WHERE stage = 'Proposal'`);
    await connection.query(`UPDATE deals SET stage = 'Follow-up / Re-approach' WHERE stage = 'Negotiation'`);
    await connection.query(`UPDATE deals SET stage = 'Project Completed' WHERE stage = 'Closed Won'`);
    await connection.query(`UPDATE deals SET stage = 'Closed' WHERE stage = 'Closed Lost'`);

    await connection.query(`
      ALTER TABLE deals
      MODIFY COLUMN stage ENUM(${stageEnum}) DEFAULT 'New Lead'
    `);

    try {
      await connection.query(`
        ALTER TABLE deals
        ADD COLUMN workSubStage ENUM(${subStageEnum}) DEFAULT NULL AFTER stage
      `);
    } catch (error) {
      if (error.code !== 'ER_DUP_FIELDNAME') {
        throw error;
      }
    }

    try {
      await connection.query(`ALTER TABLE deals ADD INDEX idx_workSubStage (workSubStage)`);
    } catch (error) {
      if (error.code !== 'ER_DUP_KEYNAME') {
        throw error;
      }
    }

    // Tasks table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS tasks (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        dueDate DATETIME,
        priority ENUM('Low', 'Medium', 'High', 'Urgent') DEFAULT 'Medium',
        status ENUM('Pending', 'In Progress', 'Completed', 'Cancelled') DEFAULT 'Pending',
        category ENUM('Call', 'Email', 'Meeting', 'Follow-up', 'Other') DEFAULT 'Other',
        assignedTo INT,
        relatedTo INT,
        relatedType ENUM('Contact', 'Company', 'Deal'),
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        createdBy INT,
        FOREIGN KEY (assignedTo) REFERENCES users(id) ON DELETE SET NULL,
        FOREIGN KEY (createdBy) REFERENCES users(id) ON DELETE SET NULL,
        INDEX idx_status (status),
        INDEX idx_assignedTo (assignedTo),
        INDEX idx_dueDate (dueDate)
      )
    `);

    // Activities table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS activities (
        id INT AUTO_INCREMENT PRIMARY KEY,
        type ENUM('Note', 'Email', 'Call', 'Meeting', 'Task', 'Deal Stage Change') NOT NULL,
        description TEXT NOT NULL,
        relatedTo INT,
        relatedType ENUM('Contact', 'Company', 'Deal'),
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        createdBy INT,
        FOREIGN KEY (createdBy) REFERENCES users(id) ON DELETE SET NULL,
        INDEX idx_relatedTo (relatedTo, relatedType),
        INDEX idx_createdAt (createdAt)
      )
    `);

    // Notes table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS notes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        content TEXT NOT NULL,
        relatedTo INT,
        relatedType ENUM('Contact', 'Company', 'Deal'),
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        createdBy INT,
        FOREIGN KEY (createdBy) REFERENCES users(id) ON DELETE SET NULL,
        INDEX idx_relatedTo (relatedTo, relatedType)
      )
    `);

    // Files table for File Management
    await connection.query(`
      CREATE TABLE IF NOT EXISTS files (
        id INT AUTO_INCREMENT PRIMARY KEY,
        fileName VARCHAR(255) NOT NULL,
        originalName VARCHAR(255) NOT NULL,
        fileType VARCHAR(100) NOT NULL,
        fileSize BIGINT NOT NULL,
        filePath VARCHAR(500) NOT NULL,
        description TEXT,
        category VARCHAR(100),
        relatedTo INT,
        relatedType ENUM('Contact', 'Company', 'Deal', 'General'),
        uploadedBy INT,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (uploadedBy) REFERENCES users(id) ON DELETE SET NULL,
        INDEX idx_fileName (fileName(191)),
        INDEX idx_fileType (fileType),
        INDEX idx_category (category),
        INDEX idx_relatedTo (relatedTo, relatedType),
        INDEX idx_uploadedBy (uploadedBy)
      )
    `);

    console.log('✅ Database tables initialized successfully');
    connection.release();
  } catch (error) {
    console.error('❌ Database initialization failed:', error.message);
    throw error;
  }
};

module.exports = { pool, testConnection, initDatabase };
