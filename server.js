require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const bodyParser = require('body-parser');

const app = express();
const port = process.env.PORT || 3009;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('build')); // Serve static files from the React app

// Database connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_DATABASE || 'thesis_platform',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Test database connection
app.get('/api/test-db', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT 1 as test');
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Database connection error:', error);
    res.status(500).json({ success: false, error: 'Database connection failed' });
  }
});

// Get student by ID
app.get('/api/students/:id', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Student not found' });
    }
    res.json({ success: true, data: rows[0] });
  } catch (error) {
    console.error('Error fetching student:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch student' });
  }
});

// Get student's thesis
app.get('/api/students/:id/thesis', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM theses WHERE user_id = ?', [req.params.id]);
    if (rows.length === 0) {
      return res.json({ success: true, data: null });
    }
    res.json({ success: true, data: rows[0] });
  } catch (error) {
    console.error('Error fetching thesis:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch thesis' });
  }
});

// Get student's objectives
app.get('/api/students/:id/objectives', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM yearly_objectives WHERE thesis_id IN (SELECT id FROM theses WHERE user_id = ?) ORDER BY year_number',
      [req.params.id]
    );
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Error fetching objectives:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch objectives' });
  }
});

// Update objective status
app.put('/api/objectives/:id', async (req, res) => {
  const { is_completed } = req.body;
  try {
    await pool.query('UPDATE yearly_objectives SET is_completed = ? WHERE id = ?', 
      [is_completed, req.params.id]);
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating objective:', error);
    res.status(500).json({ success: false, error: 'Failed to update objective' });
  }
});

// Get all students (for professor)
app.get('/api/admin/students', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM users WHERE role = "student"');
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch students' });
  }
});

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
});
