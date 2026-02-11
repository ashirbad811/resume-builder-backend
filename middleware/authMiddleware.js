import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';

export const verifyToken = (req, res, next) => {
    const token = req.headers['authorization'];

    if (!token) {
        return res.status(403).json({ error: 'No token provided' });
    }

    try {
        const bearer = token.split(' ');
        const bearerToken = bearer[1];
        const decoded = jwt.verify(bearerToken, JWT_SECRET);
        req.userId = decoded.id;
        next();
    } catch (error) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
};

export const identifyUser = (req, res, next) => {
    const token = req.headers['authorization'];
    if (!token) {
        req.userId = null;
        return next();
    }

    try {
        const bearer = token.split(' ');
        const bearerToken = bearer[1];
        const decoded = jwt.verify(bearerToken, JWT_SECRET);
        req.userId = decoded.id;
    } catch (error) {
        req.userId = null;
    }
    next();
};
