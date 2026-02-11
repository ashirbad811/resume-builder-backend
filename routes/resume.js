import express from 'express';
import pool from '../db.js';
import { verifyToken, identifyUser } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public/Optional Routes uses identifyUser
// Protected Routes uses verifyToken explicitly

// Create a new resume (Public - Guests can create)
router.post('/', identifyUser, async (req, res) => {
    const { title, full_name, email, phone, address, summary } = req.body;
    const userId = req.userId; // Null if guest

    try {
        const [result] = await pool.query(
            'INSERT INTO resumes (user_id, title, user_email, full_name, email, phone, address, summary) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [userId, title, userId ? 'linked' : 'guest', full_name, email, phone, address, summary]
        );
        res.status(201).json({ id: result.insertId, message: 'Resume created successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to create resume' });
    }
});

// Get all resumes (Protected - History only for logged in)
router.get('/', verifyToken, async (req, res) => {
    const userId = req.userId;
    try {
        const [rows] = await pool.query('SELECT * FROM resumes WHERE user_id = ?', [userId]);
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch resumes' });
    }
});

// Get a single resume (Optional Auth - Allow if owner OR if guest resume)
router.get('/:id', identifyUser, async (req, res) => {
    const { id } = req.params;
    const userId = req.userId;
    try {
        const [resumeRows] = await pool.query('SELECT * FROM resumes WHERE id = ?', [id]);
        if (resumeRows.length === 0) {
            return res.status(404).json({ error: 'Resume not found' });
        }
        const resume = resumeRows[0];

        // Check permissions
        if (resume.user_id && resume.user_id !== userId) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        const [education] = await pool.query('SELECT * FROM education WHERE resume_id = ?', [id]);
        const [experience] = await pool.query('SELECT * FROM experience WHERE resume_id = ?', [id]);
        const [skills] = await pool.query('SELECT * FROM skills WHERE resume_id = ?', [id]);

        // New sections
        const [projects] = await pool.query('SELECT * FROM projects WHERE resume_id = ?', [id]);
        const [languages] = await pool.query('SELECT * FROM languages WHERE resume_id = ?', [id]);
        const [interests] = await pool.query('SELECT * FROM interests WHERE resume_id = ?', [id]);
        const [activities] = await pool.query('SELECT * FROM activities WHERE resume_id = ?', [id]);
        const [achievements] = await pool.query('SELECT * FROM achievements WHERE resume_id = ?', [id]);
        const [certifications] = await pool.query('SELECT * FROM certifications WHERE resume_id = ?', [id]);

        res.json({ ...resume, education, experience, skills, projects, languages, interests, activities, achievements, certifications });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch resume details' });
    }
});

// Helpers for sub-resources
const validateAccess = async (req, res, next) => {
    const { id } = req.params; // resume_id
    const userId = req.userId;
    try {
        const [resume] = await pool.query('SELECT user_id FROM resumes WHERE id = ?', [id]);
        if (resume.length === 0) return res.status(404).json({ error: 'Resume not found' });

        // If resume has a user_id, requester must match. If null (guest), allow.
        if (resume[0].user_id && resume[0].user_id !== userId) {
            return res.status(403).json({ error: 'Unauthorized' });
        }
        next();
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
};

// Update Resume Details
router.put('/:id', identifyUser, validateAccess, async (req, res) => {
    const { id } = req.params;
    const { title, full_name, email, phone, address, summary } = req.body;

    try {
        await pool.query(
            'UPDATE resumes SET title=?, full_name=?, email=?, phone=?, address=?, summary=? WHERE id=?',
            [title, full_name, email, phone, address, summary, id]
        );
        res.json({ message: 'Resume updated' });
    } catch (error) {
        res.status(500).json({ error: 'Update failed' });
    }
});

// --- GENERIC CRUD GENERATOR ---
const createCrudRoutes = (tableName, fields) => {
    // Add
    router.post(`/:id/${tableName}`, identifyUser, validateAccess, async (req, res) => {
        const { id } = req.params;
        const values = fields.map(f => req.body[f]);
        const placeholders = fields.map(() => '?').join(', ');
        try {
            await pool.query(
                `INSERT INTO ${tableName} (resume_id, ${fields.join(', ')}) VALUES (?, ${placeholders})`,
                [id, ...values]
            );
            res.status(201).json({ message: `${tableName} item added` });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: `Failed to add to ${tableName}` });
        }
    });

    // Update
    router.put(`/:id/${tableName}/:itemId`, identifyUser, validateAccess, async (req, res) => {
        const { id, itemId } = req.params;
        const values = fields.map(f => req.body[f]);
        const updates = fields.map(f => `${f}=?`).join(', ');
        try {
            await pool.query(
                `UPDATE ${tableName} SET ${updates} WHERE id=? AND resume_id=?`,
                [...values, itemId, id]
            );
            res.json({ message: `${tableName} item updated` });
        } catch (error) {
            res.status(500).json({ error: `Failed to update ${tableName}` });
        }
    });

    // Delete
    router.delete(`/:id/${tableName}/:itemId`, identifyUser, validateAccess, async (req, res) => {
        const { id, itemId } = req.params;
        try {
            await pool.query(`DELETE FROM ${tableName} WHERE id=? AND resume_id=?`, [itemId, id]);
            res.json({ message: `${tableName} item deleted` });
        } catch (error) {
            res.status(500).json({ error: `Delete failed` });
        }
    });
};

// Define fields for each table (excluding id and resume_id)
createCrudRoutes('experience', ['company', 'role', 'start_date', 'end_date', 'description']);
createCrudRoutes('education', ['institution', 'degree', 'start_date', 'end_date', 'description']);
createCrudRoutes('skills', ['skill', 'level']);
createCrudRoutes('projects', ['title', 'link', 'description', 'start_date', 'end_date']);
createCrudRoutes('languages', ['language', 'proficiency']);
createCrudRoutes('interests', ['name']);
createCrudRoutes('activities', ['description']);
createCrudRoutes('achievements', ['title', 'description', 'date']);
createCrudRoutes('certifications', ['name', 'issuer', 'date']);

export default router;
