require('dotenv').config();
const sql = require('mssql');

const dbConfig = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    database: process.env.DB_DATABASE,
    options: {
        encrypt: false,
        trustServerCertificate: true,
        requestTimeout: 30000 // 30 seconds
    },
};

async function runDebug() {
    try {
        console.log('Connecting to DB...');
        await sql.connect(dbConfig);
        console.log('Connected.');

        console.log('\n--- TESTING VIEW vw_MovementHeatmap ---');
        const startTime = Date.now();

        // Eseguo la stessa query del server
        const resultHeatmap = await sql.query(`
            SELECT * FROM vw_MovementHeatmap ORDER BY pickupCount DESC
        `);

        const duration = Date.now() - startTime;

        console.log(`Heatmap query took ${duration}ms`);
        console.log(`Rows found: ${resultHeatmap.recordset.length}`);

        if (resultHeatmap.recordset.length > 0) {
            console.log('Sample Row:', resultHeatmap.recordset[0]);
        }

    } catch (err) {
        console.error('DEBUG ERROR:', err);
    } finally {
        await sql.close();
    }
}

runDebug();
