-- Tables pour la gestion des réunions

-- Table des réunions
CREATE TABLE IF NOT EXISTS meetings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    zoomLink TEXT NOT NULL,
    professorId INT NOT NULL,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (professorId) REFERENCES users(id) ON DELETE CASCADE
);

-- Table des participants aux réunions
CREATE TABLE IF NOT EXISTS meeting_participants (
    id INT AUTO_INCREMENT PRIMARY KEY,
    meetingId INT NOT NULL,
    userId INT NOT NULL,
    joinedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (meetingId) REFERENCES meetings(id) ON DELETE CASCADE,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_meeting_participant (meetingId, userId)
);

-- Index pour améliorer les performances
CREATE INDEX idx_meetings_professor ON meetings(professorId);
CREATE INDEX idx_meetings_created ON meetings(createdAt);
CREATE INDEX idx_meeting_participants_meeting ON meeting_participants(meetingId);
CREATE INDEX idx_meeting_participants_user ON meeting_participants(userId); 