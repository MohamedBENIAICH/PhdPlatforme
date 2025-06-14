const mysql = require("mysql2/promise");

async function setupDatabase() {
  const connection = await mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "", // No password as specified
    database: "PhdPlatforme",
  });

  try {
    console.log("Creating meetings table...");
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS meetings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        zoomLink TEXT NOT NULL,
        professorId INT NOT NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (professorId) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    console.log("Creating meeting_participants table...");
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS meeting_participants (
        id INT AUTO_INCREMENT PRIMARY KEY,
        meetingId INT NOT NULL,
        userId INT NOT NULL,
        joinedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (meetingId) REFERENCES meetings(id) ON DELETE CASCADE,
        FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE KEY unique_meeting_participant (meetingId, userId)
      )
    `);

    console.log("Creating indexes...");
    await connection.execute(
      "CREATE INDEX IF NOT EXISTS idx_meetings_professor ON meetings(professorId)"
    );
    await connection.execute(
      "CREATE INDEX IF NOT EXISTS idx_meetings_created ON meetings(createdAt)"
    );
    await connection.execute(
      "CREATE INDEX IF NOT EXISTS idx_meeting_participants_meeting ON meeting_participants(meetingId)"
    );
    await connection.execute(
      "CREATE INDEX IF NOT EXISTS idx_meeting_participants_user ON meeting_participants(userId)"
    );

    console.log("Database setup completed successfully!");
  } catch (error) {
    console.error("Error setting up database:", error);
  } finally {
    await connection.end();
  }
}

setupDatabase();
