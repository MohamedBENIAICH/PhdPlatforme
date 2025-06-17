const mysql = require("mysql2/promise");

async function setupDocumentDownloads() {
  const connection = await mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "", 
    database: "PhdPlatforme",
  });

  try {
    console.log("Creating document_downloads ...");
    await connection.execute(`
        CREATE TABLE document_downloads (
        id INT AUTO_INCREMENT PRIMARY KEY,
        document_id INT NOT NULL,
        student_id INT NOT NULL,
        downloaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE,
        FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE
        )
    `);

        console.log("Table created successfully!");
    } catch (error) {
        console.error("Error creating the table document_downloads:", error);
    } finally {
        await connection.end();
    }
    }

setupDocumentDownloads();