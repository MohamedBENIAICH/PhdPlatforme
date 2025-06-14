const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mysql = require('mysql2/promise');
const nodemailer = require('nodemailer');

const app = express();
const PORT = process.env.PORT || 3009;

// MySQL connection pool
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '', // No password as you specified
  database: 'PhdPlatforme',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Middleware
app.use(cors());
app.use(express.json());

// JWT Secret
const JWT_SECRET = 'your-secret-key-change-in-production';

// Email configuration (for development, use ethereal or similar)
const emailTransporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: '',
    pass: ''
  }
});

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Token d\'accès requis' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Token invalide' });
    }
    req.user = user;
    next();
  });
};

// Generate random password
const generatePassword = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
};

// Send email with password
const sendPasswordEmail = async (email, password, firstName) => {
  try {
    const mailOptions = {
      from: 'professor@edu.com',
      to: email,
      subject: 'Accès à la Plateforme Éducative',
      html: `
        <h2>Bienvenue sur la Plateforme Éducative</h2>
        <p>Bonjour ${firstName},</p>
        <p>Votre compte a été créé par le Professeur Abdelghani BELAKOUIRI.</p>
        <p><strong>Votre mot de passe temporaire:</strong> ${password}</p>
        <p>Vous devrez changer ce mot de passe lors de votre première connexion.</p>
        <p>Connectez-vous sur la plateforme avec votre email et ce mot de passe.</p>
        <p>Cordialement,<br>Prof. Abdelghani BELAKOUIRI</p>
      `
    };

    await emailTransporter.sendMail(mailOptions);
    console.log('Email sent successfully to:', email);
  } catch (error) {
    console.error('Error sending email:', error);
  }
};

// Auth routes
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const [users] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    const user = users[0];

    console.log('User from DB:', user);
    console.log('Password from client:', password);
    console.log('Password hash from DB:', user.password);

    const isValidPassword = await bcrypt.compare(password, user.password);
    console.log('Password valid?', isValidPassword);

    if (!user) {
      return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
    }

    // const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Track login activity
    await pool.query(
      'INSERT INTO activities (studentName, action, timestamp, userId) VALUES (?, ?, ?, ?)',
      [`${user.firstName} ${user.lastName}`, 'login', new Date().toISOString(), user.id]
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        firstLogin: !!user.firstLogin
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const [users] = await pool.query('SELECT * FROM users WHERE id = ?', [req.user.id]);
    const user = users[0];
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    res.json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        firstLogin: !!user.firstLogin
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

app.post('/api/auth/change-password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const [users] = await pool.query('SELECT * FROM users WHERE id = ?', [req.user.id]);
    const user = users[0];

    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    const isValidPassword = await bcrypt.compare(currentPassword, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Mot de passe actuel incorrect' });
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    await pool.query(
      'UPDATE users SET password = ?, firstLogin = ? WHERE id = ?',
      [hashedNewPassword, false, user.id]
    );

    res.json({ message: 'Mot de passe changé avec succès' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Articles routes
app.get('/api/articles', authenticateToken, async (req, res) => {
  try {
    const [articles] = await pool.query('SELECT * FROM articles');
    res.json(articles);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

app.post('/api/articles', authenticateToken, async (req, res) => {
  try {
    const { title, content } = req.body;
    const [users] = await pool.query('SELECT * FROM users WHERE id = ?', [req.user.id]);
    const user = users[0];

    const [result] = await pool.query(
      'INSERT INTO articles (title, content, author, authorId, createdAt) VALUES (?, ?, ?, ?, ?)',
      [title, content, `${user.firstName} ${user.lastName}`, user.id, new Date().toISOString()]
    );

    const newArticle = {
      id: result.insertId,
      title,
      content,
      author: `${user.firstName} ${user.lastName}`,
      authorId: user.id,
      createdAt: new Date().toISOString()
    };

    // Track activity
    await pool.query(
      'INSERT INTO activities (studentName, action, timestamp, details, userId) VALUES (?, ?, ?, ?, ?)',
      [`${user.firstName} ${user.lastName}`, 'article_created', new Date().toISOString(), title, user.id]
    );

    res.status(201).json(newArticle);
  } catch (error) {
    console.error('Create article error:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Messages routes

// GET /api/messages?studentId=...
app.get('/api/messages', authenticateToken, async (req, res) => {
  try {
    const user = req.user;
    let messages;

    if (user.role === 'professor') {
      // Professor wants messages with a specific student
      const studentId = req.query.studentId;
      if (!studentId) {
        return res.status(400).json({ message: 'studentId is required' });
      }
      [messages] = await pool.query(
        `SELECT * FROM messages
         WHERE (senderId = ? AND recipientId = ?)
            OR (senderId = ? AND recipientId = ?)
         ORDER BY timestamp ASC`,
        [user.id, studentId, studentId, user.id]
      );
    } else if (user.role === 'student') {
      // Student wants messages with the professor
      // Find the professor (assuming only one)
      const [professors] = await pool.query('SELECT id FROM users WHERE role = "professor" LIMIT 1');
      if (professors.length === 0) {
        return res.status(404).json({ message: 'No professor found' });
      }
      const professorId = professors[0].id;
      [messages] = await pool.query(
        `SELECT * FROM messages
         WHERE (senderId = ? AND recipientId = ?)
            OR (senderId = ? AND recipientId = ?)
         ORDER BY timestamp ASC`,
        [user.id, professorId, professorId, user.id]
      );
    } else {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    res.json(messages);
  } catch (error) {
    console.error('Fetch messages error:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// POST /api/messages
app.post('/api/messages', authenticateToken, async (req, res) => {
  try {
    const { recipientId, content, role } = req.body;
    const [users] = await pool.query('SELECT * FROM users WHERE id = ?', [req.user.id]);
    const user = users[0];

    if (!recipientId || !content) {
      return res.status(400).json({ message: 'recipientId and content are required' });
    }

    // Save message
    const [result] = await pool.query(
      'INSERT INTO messages (content, senderId, recipientId, sender, senderRole, timestamp) VALUES (?, ?, ?, ?, ?, ?)',
      [content, user.id, recipientId, user.email, user.role, new Date().toISOString()]
    );

    const newMessage = {
      id: result.insertId,
      content,
      senderId: user.id,
      recipientId,
      sender: user.email,
      senderRole: user.role,
      timestamp: new Date().toISOString()
    };

    // Track activity
    await pool.query(
      'INSERT INTO activities (studentName, action, timestamp, userId) VALUES (?, ?, ?, ?)',
      [`${user.firstName} ${user.lastName}`, 'message', new Date().toISOString(), user.id]
    );

    res.status(201).json(newMessage);
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Activity tracking routes
app.post('/api/activity/login', authenticateToken, async (req, res) => {
  try {
    const [users] = await pool.query('SELECT * FROM users WHERE id = ?', [req.user.id]);
    const user = users[0];

    await pool.query(
      'INSERT INTO activities (studentName, action, timestamp, userId) VALUES (?, ?, ?, ?)',
      [`${user.firstName} ${user.lastName}`, 'login', new Date().toISOString(), user.id]
    );

    res.json({ message: 'Login tracked' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

app.post('/api/activity/reading', authenticateToken, async (req, res) => {
  try {
    const { articleId, readingTime } = req.body;
    const [users] = await pool.query('SELECT * FROM users WHERE id = ?', [req.user.id]);
    const user = users[0];
    const [articles] = await pool.query('SELECT * FROM articles WHERE id = ?', [articleId]);
    const article = articles[0];

    await pool.query(
      'INSERT INTO readingTimes (userId, articleId, readingTime, timestamp) VALUES (?, ?, ?, ?)',
      [user.id, articleId, readingTime, new Date().toISOString()]
    );

    // Track activity
    await pool.query(
      'INSERT INTO activities (studentName, action, timestamp, details, userId) VALUES (?, ?, ?, ?, ?)',
      [
        `${user.firstName} ${user.lastName}`,
        'reading',
        new Date().toISOString(),
        `${article?.title} (${Math.floor(readingTime / 60)}m ${readingTime % 60}s)`,
        user.id
      ]
    );

    res.json({ message: 'Reading time tracked' });
  } catch (error) {
    console.error('Track reading error:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Admin routes (Professor only)
app.get('/api/admin/professors', authenticateToken, async (req, res) => {
  try {
    const [professors] = await pool.query('SELECT id, email, firstName, lastName FROM users WHERE role = "professor"');
    res.json(professors);
  } catch (error) {
    console.error('Error fetching professors:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

app.get('/api/admin/students', authenticateToken, async (req, res) => {
  if (req.user.role !== 'professor') {
    return res.status(403).json({ message: 'Accès non autorisé' });
  }

  try {
    const [students] = await pool.query('SELECT * FROM users WHERE role = "student"');
    const [readingTimes] = await pool.query('SELECT * FROM readingTimes');
    const [activities] = await pool.query('SELECT * FROM activities');

    const studentsWithStats = students.map(student => {
      const studentReadingTimes = readingTimes.filter(rt => rt.userId === student.id);
      const totalReadingTime = studentReadingTimes.reduce((sum, rt) => sum + rt.readingTime, 0);
      const articlesRead = studentReadingTimes.length;
      const lastLogin = activities
        .filter(a => a.userId === student.id && a.action === 'login')
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0]?.timestamp;

      return {
        id: student.id,
        firstName: student.firstName,
        lastName: student.lastName,
        email: student.email,
        lastLogin,
        totalReadingTime,
        articlesRead
      };
    });

    res.json(studentsWithStats);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

app.get('/api/admin/activities', authenticateToken, async (req, res) => {
  if (req.user.role !== 'professor') {
    return res.status(403).json({ message: 'Accès non autorisé' });
  }

  try {
    const [activities] = await pool.query('SELECT * FROM activities ORDER BY timestamp DESC LIMIT 50');
    res.json(activities);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Get recent activities for the authenticated student
app.get('/api/activity/student', authenticateToken, async (req, res) => {
  if (req.user.role !== 'student') {
    return res.status(403).json({ message: 'Accès non autorisé' });
  }
  try {
    const userId = req.user.id;
    // Get 10 most recent activities for this student
    const [activities] = await pool.query(
      'SELECT id, action, timestamp, details FROM activities WHERE userId = ? ORDER BY timestamp DESC LIMIT 10',
      [userId]
    );
    res.json(activities);
  } catch (error) {
    console.error('Error fetching student activities:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

app.post('/api/admin/students', authenticateToken, async (req, res) => {
  if (req.user.role !== 'professor') {
    return res.status(403).json({ message: 'Accès non autorisé' });
  }

  try {
    const { email, firstName, lastName } = req.body;

    // Check if user already exists
    const [existingUsers] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (existingUsers.length > 0) {
      return res.status(400).json({ message: 'Un utilisateur avec cet email existe déjà' });
    }

    // Generate password and hash it
    const tempPassword = generatePassword();
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    const [result] = await pool.query(
      'INSERT INTO users (email, firstName, lastName, password, role, firstLogin) VALUES (?, ?, ?, ?, ?, ?)',
      [email, firstName, lastName, hashedPassword, 'student', true]
    );

    // Send email with temporary password
    await sendPasswordEmail(email, tempPassword, firstName);

    res.status(201).json({
      message: 'Étudiant ajouté avec succès',
      student: {
        id: result.insertId,
        email,
        firstName,
        lastName
      }
    });
  } catch (error) {
    console.error('Add student error:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Delete student by ID
app.delete('/api/admin/students/:id', async (req, res) => {
  try {
    const studentId = req.params.id;
    // Only allow deletion if user is a student
    await pool.query('DELETE FROM users WHERE id = ? AND role = "student"', [studentId]);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting student:', error);
    res.status(500).json({ message: "Erreur lors de la suppression de l'étudiant." });
  }
});

console.log('Registered routes:');
app._router.stack.forEach((r) => {
  if (r.route && r.route.path) {
    console.log(`${Object.keys(r.route.methods).join(',').toUpperCase()} ${r.route.path}`);
  }
});

app.get('/api/student/stats', authenticateToken, async (req, res) => {
  if (req.user.role !== 'student') {
    return res.status(403).json({ message: 'Accès non autorisé' });
  }
  try {
    const userId = req.user.id;
    const [readingTimes] = await pool.query('SELECT readingTime FROM readingTimes WHERE userId = ?', [userId]);
    const articlesRead = readingTimes.length;
    const totalReadingTime = readingTimes.reduce((sum, rt) => sum + (rt.readingTime || 0), 0);
    res.json({ articlesRead, totalReadingTime });
  } catch (error) {
    console.error('Error fetching student stats:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

app.get('/api/student/reading-times', authenticateToken, async (req, res) => {
  if (req.user.role !== 'student') {
    return res.status(403).json({ message: 'Accès non autorisé' });
  }
  try {
    const userId = req.user.id;
    const [readingTimes] = await pool.query('SELECT articleId FROM readingTimes WHERE userId = ?', [userId]);
    res.json(readingTimes);
  } catch (error) {
    console.error('Error fetching student reading times:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;