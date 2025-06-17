const mysql = require("mysql2/promise");

async function setupDocument() {
  const connection = await mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "", 
    database: "PhdPlatforme",
  });

  try {
    console.log("Creating documents table...");
    await connection.execute(`
        CREATE TABLE IF NOT EXISTS documents (
        id INT AUTO_INCREMENT PRIMARY KEY,
        filename VARCHAR(255) NOT NULL,
        filepath VARCHAR(255) NOT NULL,
        uploaded_by INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (uploaded_by) REFERENCES users(id)
        );
    `);
    console.log("Document Table has been added successfully");
  }
    catch (error) {
    console.error("Error creatign table docuement:", error);
  } finally {
    await connection.end();
  }
}

setupDocument();