const mysql = require('mysql2/promise');
require('dotenv').config();

async function setupThesisDatabase() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
  });

  try {
    // Create thesis table
    await connection.execute(`
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
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS yearly_objectives (
        id INT AUTO_INCREMENT PRIMARY KEY,
        thesis_id INT NOT NULL,
        year_number INT NOT NULL,
        objectives TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (thesis_id) REFERENCES theses(id) ON DELETE CASCADE,
        UNIQUE KEY unique_year_per_thesis (thesis_id, year_number)
      )
    `);

    console.log("Thesis database tables created successfully");
  } catch (error) {
    console.error("Error creating thesis database tables:", error);
  } finally {
    await connection.end();
  }
}

// Run the database setup
setupThesisDatabase();

module.exports = { setupThesisDatabase };
