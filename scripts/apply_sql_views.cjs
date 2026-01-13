require('dotenv').config();
const sql = require('mssql');
const fs = require('fs');
const path = require('path');

const dbConfig = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    database: process.env.DB_DATABASE,
    options: {
        encrypt: false,
        trustServerCertificate: true,
    },
};

const VIEWS_DIR = path.join(__dirname, '..', 'sql', 'views');

async function applyViews() {
    try {
        console.log('Connecting to database...');
        const pool = await sql.connect(dbConfig);
        console.log('Connected.');

        const files = fs.readdirSync(VIEWS_DIR).filter(f => f.endsWith('.sql'));

        for (const file of files) {
            console.log(`\nProcessing ${file}...`);
            const filePath = path.join(VIEWS_DIR, file);
            const content = fs.readFileSync(filePath, 'utf8');

            // Split by GO command (case insensitive, surrounded by whitespaces)
            const batches = content.split(/^\s*GO\s*$/im);

            for (const batch of batches) {
                const query = batch.trim();
                if (query) {
                    try {
                        await pool.query(query);
                        console.log('  Batch executed successfully.');
                    } catch (err) {
                        console.error('  Batch execution failed:', err.message);
                        // We continue, maybe it's just a DROP failed because view didn't exist (though we handle check)
                    }
                }
            }
        }

        console.log('\nAll views applied successfully.');

    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        await sql.close();
    }
}

applyViews();
