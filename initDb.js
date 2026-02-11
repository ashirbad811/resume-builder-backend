import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function initDb() {
    let connection;
    try {
        // Connect without database selected to create it
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD,
        });

        console.log('Connected to MySQL server.');

        await connection.query(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME}\``);
        console.log(`Database '${process.env.DB_NAME}' checked/created.`);

        await connection.changeUser({ database: process.env.DB_NAME });

        const schemaPath = path.join(__dirname, 'schema.sql');
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');

        // Split by semicolon vs running all at once - mysql2 helper needed or split manually
        // Simple split by ; might fail on data containing ; but for schema it is usually fine
        const queries = schemaSql.split(';').filter(q => q.trim());

        for (const query of queries) {
            if (query.trim()) {
                await connection.query(query);
            }
        }

        console.log('Tables initialized successfully.');

    } catch (error) {
        console.error('Database initialization failed:', error);
    } finally {
        if (connection) await connection.end();
    }
}

initDb();
