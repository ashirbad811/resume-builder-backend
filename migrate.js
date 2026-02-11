import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function migrateDb() {
    let connection;
    try {
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME || 'resume_builder'
        });

        console.log('Connected to database.');

        // Create users table
        await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
        console.log('Users table checked/created.');

        // Check if user_id column exists in resumes
        const [columns] = await connection.query(`SHOW COLUMNS FROM resumes LIKE 'user_id'`);
        if (columns.length === 0) {
            console.log('Adding user_id column to resumes table...');
            await connection.query(`ALTER TABLE resumes ADD COLUMN user_id INT`);
            await connection.query(`ALTER TABLE resumes ADD CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE`);
            console.log('user_id column added.');
        } else {
            console.log('user_id column already exists.');
        }

    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        if (connection) await connection.end();
    }
}

migrateDb();
