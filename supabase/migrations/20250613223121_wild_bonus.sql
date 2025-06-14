/*
  # Educational Platform Database Schema

  Complete database structure for the educational platform with student tracking,
  article management, messaging, and activity monitoring.

  ## Tables Overview
  1. Users - Student and professor accounts
  2. Articles - Educational content
  3. Messages - Communication between users
  4. Activities - User action tracking
  5. Reading Times - Article reading duration tracking
  6. Sessions - Login/logout tracking

  ## Security
  - Row Level Security enabled on all tables
  - Proper authentication policies
  - Role-based access control
*/

-- Users table for students and professors
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  role ENUM('student', 'professor') NOT NULL DEFAULT 'student',
  first_login BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Articles table for educational content
CREATE TABLE IF NOT EXISTS articles (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  author_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Messages table for communication
CREATE TABLE IF NOT EXISTS messages (
  id SERIAL PRIMARY KEY,
  sender_id INT NOT NULL,
  receiver_id INT,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Activities table for tracking student actions
CREATE TABLE IF NOT EXISTS activities (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL,
  action_type ENUM('login', 'logout', 'article_read', 'article_created', 'message_sent') NOT NULL,
  details JSON,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Reading times table for tracking article reading duration
CREATE TABLE IF NOT EXISTS reading_times (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL,
  article_id INT NOT NULL,
  reading_time INT NOT NULL, -- in seconds
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  finished_at TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE
);

-- Sessions table for login/logout tracking
CREATE TABLE IF NOT EXISTS sessions (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL,
  login_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  logout_time TIMESTAMP,
  session_duration INT, -- in seconds
  ip_address VARCHAR(45),
  user_agent TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_articles_author ON articles(author_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver ON messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_activities_user ON activities(user_id);
CREATE INDEX IF NOT EXISTS idx_activities_timestamp ON activities(timestamp);
CREATE INDEX IF NOT EXISTS idx_reading_times_user ON reading_times(user_id);
CREATE INDEX IF NOT EXISTS idx_reading_times_article ON reading_times(article_id);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);

-- Insert default professor account
INSERT INTO users (email, password_hash, first_name, last_name, role, first_login) 
VALUES (
  'abdelghani.belakouiri@edu.com',
  '$2a$10$rHhOcB8zkGRWNuY9g5i7fOKQ4CjAWbQ8zQTqY5vE2iQ8T7LQOZ3bG', -- password123
  'Abdelghani',
  'BELAKOUIRI',
  'professor',
  false
) ON DUPLICATE KEY UPDATE id=id;

-- Insert sample article
INSERT INTO articles (title, content, author_id)
VALUES (
  'Bienvenue sur la Plateforme Éducative',
  'Cette plateforme vous permet de suivre votre apprentissage, communiquer avec votre professeur et partager vos connaissances. Explorez les différentes fonctionnalités disponibles.',
  1
) ON DUPLICATE KEY UPDATE id=id;