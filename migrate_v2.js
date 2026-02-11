import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    multipleStatements: true
};

const migration = async () => {
    try {
        const connection = await mysql.createConnection(dbConfig);
        console.log('Connected to database.');

        const queries = [
            `CREATE TABLE IF NOT EXISTS projects (
                id INT AUTO_INCREMENT PRIMARY KEY,
                resume_id INT NOT NULL,
                title VARCHAR(255) NOT NULL,
                link VARCHAR(255),
                description TEXT,
                start_date VARCHAR(50),
                end_date VARCHAR(50),
                FOREIGN KEY (resume_id) REFERENCES resumes(id) ON DELETE CASCADE
            )`,
            `CREATE TABLE IF NOT EXISTS languages (
                id INT AUTO_INCREMENT PRIMARY KEY,
                resume_id INT NOT NULL,
                language VARCHAR(100) NOT NULL,
                proficiency VARCHAR(50),
                FOREIGN KEY (resume_id) REFERENCES resumes(id) ON DELETE CASCADE
            )`,
            `CREATE TABLE IF NOT EXISTS interests (
                id INT AUTO_INCREMENT PRIMARY KEY,
                resume_id INT NOT NULL,
                name VARCHAR(255) NOT NULL,
                FOREIGN KEY (resume_id) REFERENCES resumes(id) ON DELETE CASCADE
            )`,
            `CREATE TABLE IF NOT EXISTS activities (
                id INT AUTO_INCREMENT PRIMARY KEY,
                resume_id INT NOT NULL,
                description TEXT NOT NULL,
                FOREIGN KEY (resume_id) REFERENCES resumes(id) ON DELETE CASCADE
            )`,
            `CREATE TABLE IF NOT EXISTS achievements (
                id INT AUTO_INCREMENT PRIMARY KEY,
                resume_id INT NOT NULL,
                title VARCHAR(255) NOT NULL,
                description TEXT,
                date VARCHAR(50),
                FOREIGN KEY (resume_id) REFERENCES resumes(id) ON DELETE CASCADE
            )`,
            `CREATE TABLE IF NOT EXISTS certifications (
                id INT AUTO_INCREMENT PRIMARY KEY,
                resume_id INT NOT NULL,
                name VARCHAR(255) NOT NULL,
                issuer VARCHAR(255),
                date VARCHAR(50),
                FOREIGN KEY (resume_id) REFERENCES resumes(id) ON DELETE CASCADE
            )`
        ];

        for (const query of queries) {
            await connection.query(query);
            console.log('Executed table creation query.');
        }

        console.log('Migration V2 completed successfully.');
        await connection.end();
    } catch (error) {
        console.error('Migration failed:', error);
    }
};

migration();
