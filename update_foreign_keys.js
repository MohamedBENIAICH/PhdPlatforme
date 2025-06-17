const mysql = require('mysql2/promise');
require('dotenv').config();

async function dropForeignKeyIfExists(connection, tableName, constraintName) {
  try {
    await connection.query(`
      ALTER TABLE ${tableName} 
      DROP FOREIGN KEY ${constraintName};
    `);
    console.log(`Dropped ${constraintName} from ${tableName}`);
  } catch (error) {
    if (error.code === 'ER_CANT_DROP_FIELD_OR_KEY') {
      console.log(`Skipping non-existent constraint: ${constraintName} on ${tableName}`);
    } else {
      throw error;
    }
  }
}

async function updateForeignKeys() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    multipleStatements: true
  });

  try {
    // Get all foreign keys first
    const [foreignKeys] = await connection.query(`
      SELECT 
        TABLE_NAME,
        CONSTRAINT_NAME,
        REFERENCED_TABLE_NAME,
        REFERENCED_COLUMN_NAME
      FROM 
        INFORMATION_SCHEMA.KEY_COLUMN_USAGE
      WHERE 
        REFERENCED_TABLE_SCHEMA = ?
        AND REFERENCED_TABLE_NAME IS NOT NULL
    `, [process.env.DB_DATABASE]);

    console.log('Found foreign keys:', foreignKeys);

    // Drop all foreign keys
    for (const fk of foreignKeys) {
      await dropForeignKeyIfExists(connection, fk.TABLE_NAME, fk.CONSTRAINT_NAME);
    }

    // Recreate foreign keys with ON DELETE SET NULL
    const foreignKeyStatements = [
      // meetings table
      `ALTER TABLE meetings 
       ADD CONSTRAINT fk_meetings_professor 
       FOREIGN KEY (professorId) REFERENCES users(id) 
       ON DELETE SET NULL`,
      
      `ALTER TABLE meetings 
       ADD CONSTRAINT fk_meetings_student 
       FOREIGN KEY (studentId) REFERENCES users(id) 
       ON DELETE SET NULL`,
      
      // meeting_participants table
      `ALTER TABLE meeting_participants 
       ADD CONSTRAINT fk_mp_meeting
       FOREIGN KEY (meetingId) REFERENCES meetings(id)
       ON DELETE CASCADE`,
       
      `ALTER TABLE meeting_participants 
       ADD CONSTRAINT fk_mp_user
       FOREIGN KEY (userId) REFERENCES users(id)
       ON DELETE CASCADE`,
      
      // documents table (if exists)
      `ALTER TABLE documents 
       ADD CONSTRAINT fk_documents_uploader
       FOREIGN KEY (uploaded_by) REFERENCES users(id)
       ON DELETE SET NULL`,
      
      // messages table (if exists)
      `ALTER TABLE messages 
       ADD CONSTRAINT fk_messages_sender
       FOREIGN KEY (sender_id) REFERENCES users(id)
       ON DELETE SET NULL`,
      
      `ALTER TABLE messages 
       ADD CONSTRAINT fk_messages_receiver
       FOREIGN KEY (receiver_id) REFERENCES users(id)
       ON DELETE SET NULL`,
      
      // theses table (if exists)
      `ALTER TABLE theses 
       ADD CONSTRAINT fk_theses_user
       FOREIGN KEY (user_id) REFERENCES users(id)
       ON DELETE SET NULL`,
      
      // yearly_objectives table (if exists)
      `ALTER TABLE yearly_objectives 
       ADD CONSTRAINT fk_yearly_objectives_thesis
       FOREIGN KEY (thesis_id) REFERENCES theses(id)
       ON DELETE CASCADE`
    ];

    // Execute each foreign key creation statement
    for (const stmt of foreignKeyStatements) {
      try {
        await connection.query(stmt);
        console.log('Successfully executed:', stmt.split('\n')[0]);
      } catch (error) {
        console.log('Skipping (table or column might not exist):', error.sqlMessage || error.message);
      }
    }

    console.log('Foreign keys update completed');
  } catch (error) {
    console.error('Error updating foreign keys:', error);
  } finally {
    await connection.end();
  }
}

// Run the update
updateForeignKeys();
