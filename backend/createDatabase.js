const mysql = require('mysql2');

// Create connection without database
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  port: 3306
});

connection.connect((err) => {
  if (err) {
    console.error('Error connecting to MySQL:', err.message);
    process.exit(1);
  }
  
  console.log('Connected to MySQL server');
  
  // Create database
  connection.query('CREATE DATABASE IF NOT EXISTS crm_database', (err, result) => {
    if (err) {
      console.error('Error creating database:', err.message);
      connection.end();
      process.exit(1);
    }
    
    console.log('Database "crm_database" created successfully or already exists');
    
    connection.end();
    console.log('Setup complete!');
  });
});
