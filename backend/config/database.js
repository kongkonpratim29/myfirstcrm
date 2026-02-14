const mysql = require('mysql2/promise');
require('dotenv').config();

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
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        firstName VARCHAR(100) NOT NULL,
        lastName VARCHAR(100) NOT NULL,
        role ENUM('Admin', 'Manager', 'User') DEFAULT 'User',
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_email (email),
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
        email VARCHAR(255),
        employeeCount INT,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        createdBy INT,
        FOREIGN KEY (createdBy) REFERENCES users(id) ON DELETE SET NULL,
        INDEX idx_name (name),
        INDEX idx_industry (industry)
      )
    `);

    // Contacts table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS contacts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        firstName VARCHAR(100) NOT NULL,
        lastName VARCHAR(100) NOT NULL,
        email VARCHAR(255),
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
        INDEX idx_email (email),
        INDEX idx_company (companyId)
      )
    `);

    // Deals table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS deals (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        value DECIMAL(15, 2) DEFAULT 0,
        stage ENUM('Lead', 'Qualified', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost') DEFAULT 'Lead',
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
        INDEX idx_company (companyId),
        INDEX idx_contact (contactId)
      )
    `);

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

    // Invoices table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS invoices (
        id INT AUTO_INCREMENT PRIMARY KEY,
        invoiceNumber VARCHAR(50) UNIQUE NOT NULL,
        date DATE NOT NULL,
        dueDate DATE NOT NULL,
        contactId INT,
        companyId INT,
        subtotal DECIMAL(15, 2) DEFAULT 0,
        taxRate DECIMAL(5, 2) DEFAULT 0,
        taxAmount DECIMAL(15, 2) DEFAULT 0,
        total DECIMAL(15, 2) DEFAULT 0,
        status ENUM('Draft', 'Sent', 'Paid', 'Overdue', 'Cancelled') DEFAULT 'Draft',
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        createdBy INT,
        FOREIGN KEY (contactId) REFERENCES contacts(id) ON DELETE SET NULL,
        FOREIGN KEY (companyId) REFERENCES companies(id) ON DELETE SET NULL,
        FOREIGN KEY (createdBy) REFERENCES users(id) ON DELETE SET NULL,
        INDEX idx_invoiceNumber (invoiceNumber),
        INDEX idx_status (status),
        INDEX idx_date (date)
      )
    `);

    // Invoice items table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS invoice_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        invoiceId INT NOT NULL,
        description VARCHAR(255) NOT NULL,
        quantity DECIMAL(10, 2) NOT NULL,
        rate DECIMAL(15, 2) NOT NULL,
        amount DECIMAL(15, 2) NOT NULL,
        FOREIGN KEY (invoiceId) REFERENCES invoices(id) ON DELETE CASCADE,
        INDEX idx_invoice (invoiceId)
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

    console.log('✅ Database tables initialized successfully');
    connection.release();
  } catch (error) {
    console.error('❌ Database initialization failed:', error.message);
    throw error;
  }
};

module.exports = { pool, testConnection, initDatabase };
