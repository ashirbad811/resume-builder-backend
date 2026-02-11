import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pool from './db.js';
import resumeRoutes from './routes/resume.js';
import authRoutes from './routes/auth.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/resumes', resumeRoutes);

// Basic health check route
app.get('/', (req, res) => {
    res.send('Resume Builder API is running');
});

// Test DB connection
app.get('/test-db', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT 1 + 1 AS solution');
        res.json({ message: 'Database connected', result: rows[0].solution });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Database connection failed' });
    }
});

// Check DB connection on startup
(async () => {
    try {
        const connection = await pool.getConnection();
        console.log('✅ Database connected successfully');
        connection.release();
    } catch (err) {
        console.error('❌ Database connection failed:', err.message);
    }
})();

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
// Force restart
