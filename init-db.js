require('dotenv').config();
const mysql = require('mysql2/promise');

async function initializeDatabase() {
  // Connect to MySQL server without specifying a database
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    multipleStatements: true
  });

  try {
    console.log('Creating database and tables...');
    
    // Create the database if it doesn't exist
    await connection.query(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_DATABASE || 'thesis_platform'}`);
    await connection.query(`USE ${process.env.DB_DATABASE || 'thesis_platform'}`);
    
    // Create users table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        firstName VARCHAR(100) NOT NULL,
        lastName VARCHAR(100) NOT NULL,
        role ENUM('student', 'professor') NOT NULL,
        resetToken VARCHAR(255) DEFAULT NULL,
        resetTokenExpiry DATETIME DEFAULT NULL,
        lastLogin DATETIME DEFAULT NULL,
        totalReadingTime INT DEFAULT 0,
        articlesRead INT DEFAULT 0,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Create theses table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS theses (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        user_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Create yearly_objectives table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS yearly_objectives (
        id INT AUTO_INCREMENT PRIMARY KEY,
        thesis_id INT NOT NULL,
        year_number INT NOT NULL,
        objectives TEXT NOT NULL,
        is_completed BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (thesis_id) REFERENCES theses(id) ON DELETE CASCADE,
        UNIQUE KEY unique_year_per_thesis (thesis_id, year_number)
      )
    `);

    console.log('Database and tables created successfully!');

    // Insert a test professor if not exists
    const [professors] = await connection.query('SELECT id FROM users WHERE email = ?', ['professor@example.com']);
    if (professors.length === 0) {
      console.log('Creating test professor account...');
      await connection.query(
        'INSERT INTO users (email, password, firstName, lastName, role) VALUES (?, ?, ?, ?, ?)',
        ['professor@example.com', '$2a$10$XFDq3wOMeNQzq9j4wYxwvO5V5z5Y5X5X5X5X5X5X5X5X5X5X5X5X5X5X5X5X5X5X5X', 'Test', 'Professor', 'professor']
      );
      console.log('Test professor created with email: professor@example.com and password: password');
    }

    // Insert a test student if not exists
    const [students] = await connection.query('SELECT id FROM users WHERE email = ?', ['student@example.com']);
    if (students.length === 0) {
      console.log('Creating test student account...');
      const [result] = await connection.query(
        'INSERT INTO users (email, password, firstName, lastName, role) VALUES (?, ?, ?, ?, ?)',
        ['student@example.com', '$2a$10$XFDq3wOMeNQzq9j4wYxwvO5V5z5Y5X5X5X5X5X5X5X5X5X5X5X5X5X5X5X5X5X5X5X', 'Test', 'Student', 'student']
      );
      
      // Create a test thesis for the student
      const [thesis] = await connection.query(
        'INSERT INTO theses (title, description, user_id) VALUES (?, ?, ?)',
        ['Test Thesis', 'This is a test thesis description', result.insertId]
      );
      
      // Add some test objectives
      const objectives = [
        { year: 1, objective: 'Complete literature review' },
        { year: 1, objective: 'Submit research proposal' },
        { year: 2, objective: 'Conduct experiments' },
        { year: 2, objective: 'Analyze data' },
        { year: 3, objective: 'Write thesis' },
        { year: 3, objective: 'Defend thesis' }
      ];
      
      for (const obj of objectives) {
        await connection.query(
          'INSERT INTO yearly_objectives (thesis_id, year_number, objectives) VALUES (?, ?, ?)',
          [thesis.insertId, obj.year, obj.objective]
        );
      }
      
      console.log('Test student created with email: student@example.com and password: password');
      console.log('Test thesis and objectives created for the student');
    }

  } catch (error) {
    console.error('Error initializing database:', error);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

initializeDatabase();
