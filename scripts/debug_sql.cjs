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
    },
};

async function runDebug() {
    try {
        await sql.connect(dbConfig);
        console.log('Connected to DB');

        const productCode = 'OPS-009/9';

        // 1. Check lotcpro raw data
        console.log(`\n--- CHECKING LOTCPRO FOR ${productCode} ---`);
        const resultLot = await sql.query`
      SELECT TOP 5 
        lp_ubicaz, 
        LEN(lp_ubicaz) as len_ubicaz, 
        DATALENGTH(lp_ubicaz) as bytes_ubicaz,
        lp_codart, 
        lp_esist 
      FROM lotcpro 
      WHERE lp_codart = ${productCode} AND lp_esist > 0
    `;
        console.table(resultLot.recordset);

        if (resultLot.recordset.length > 0) {
            const sampleLoc = resultLot.recordset[0].lp_ubicaz;
            console.log(`Sample Location from LOTCPRO: '${sampleLoc}'`);

            // 2. Check anaubic for this location
            console.log(`\n--- CHECKING ANAUBIC FOR '${sampleLoc}' ---`);
            // Use query method to allow parameter injection for exact match check
            const resultAna = await sql.query(`
        SELECT TOP 1 
            au_ubicaz, 
            LEN(au_ubicaz) as len, 
            DATALENGTH(au_ubicaz) as bytes
        FROM anaubic 
        WHERE au_ubicaz = '${sampleLoc}'
      `);
            console.table(resultAna.recordset);

            if (resultAna.recordset.length === 0) {
                console.log("!!! MATCH FAILED IN ANAUBIC WITH EXACT STRING !!!");

                // Try with TRIM
                console.log("Trying with TRIM...");
                const resultAnaTrim = await sql.query(`
            SELECT TOP 1 au_ubicaz FROM anaubic WHERE LTRIM(RTRIM(au_ubicaz)) = LTRIM(RTRIM('${sampleLoc}'))
          `);
                console.log("Match with TRIM:", resultAnaTrim.recordset.length > 0 ? "YES" : "NO");
            }
        }

        // 6. Test VIEW vw_WarehouseLocations
        console.log(`\n--- TESTING VIEW vw_WarehouseLocations ---`);
        const searchView = `%${productCode}%`;

        const resultView = await sql.query(`
        SELECT TOP 1
            au_ubicaz,
            ArticlesJSON,
            ISNULL(anaubic.codditt, 'NULL') as anaubic_codditt
        FROM vw_WarehouseLocations anaubic
        WHERE au_ubicaz = '02 09 04'
    `);

        console.log(`Rows found in View: ${resultView.recordset.length}`);
        if (resultView.recordset.length > 0) {
            console.log('Location:', resultView.recordset[0].au_ubicaz);
            console.log('Codditt:', resultView.recordset[0].anaubic_codditt);
            console.log('ArticlesJSON:', resultView.recordset[0].ArticlesJSON);
        }


    } catch (err) {
        console.error('Error:', err);
    } finally {
        await sql.close();
    }
}

runDebug();
