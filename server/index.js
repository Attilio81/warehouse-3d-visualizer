import express from 'express';
import sql from 'mssql';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = 4000;

app.use(cors());
app.use(express.json());

const dbConfig = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  database: process.env.DB_DATABASE,
  options: {
    encrypt: false, // For local dev, sometimes encryption causes issues with self-signed certs
    trustServerCertificate: true,
  },
};

// SQL Query - Show ALL locations from anaubic, with stock info and pending movements
// Using OUTER APPLY to get the product with highest stock (if any exists)
const QUERY = `
SELECT
    anaubic.au_ubicaz,
    anaubic.au_magaz,
    anaubic.au_zona,
    anaubic.au_scaff,
    anaubic.au_posiz,
    anaubic.au_piano,
    anaubic.au_cella,
    anaubic.au_tipo,
    anaubic.au_percorso,
    anaubic.au_indrot,
    anaubic.au_volume,
    anaubic.au_monopr,
    anaubic.au_barcode,
    anaubic.au_bloccata,
    anaubic.au_descr,
    anaubic.au_livello,
    ISNULL(stock.lp_codart, '') AS lp_codart,
    ISNULL(stock.lp_esist, 0) AS lp_esist,
    ISNULL(stock.ar_descr, '') AS ar_descr,
    ISNULL(mov_in.quantita_in, 0) AS mov_in,
    ISNULL(mov_out.quantita_out, 0) AS mov_out
FROM
    anaubic
OUTER APPLY (
    SELECT TOP 1
        lotcpro.lp_codart,
        lotcpro.lp_esist,
        artico.ar_descr
    FROM lotcpro
    LEFT JOIN artico ON lotcpro.codditt = artico.codditt
        AND lotcpro.lp_codart = artico.ar_codart
    WHERE lotcpro.codditt = anaubic.codditt
        AND lotcpro.lp_ubicaz = anaubic.au_ubicaz
        AND lotcpro.lp_magaz = anaubic.au_magaz
        AND lotcpro.lp_esist > 0
    ORDER BY lotcpro.lp_esist DESC
) stock
LEFT JOIN (
    SELECT ubicaz_destinazione, SUM(quantita) as quantita_in
    FROM egmovimentimag3d
    WHERE confermato = 0
    GROUP BY ubicaz_destinazione
) mov_in ON anaubic.au_ubicaz = mov_in.ubicaz_destinazione
LEFT JOIN (
    SELECT ubicaz_partenza, SUM(quantita) as quantita_out
    FROM egmovimentimag3d
    WHERE confermato = 0
    GROUP BY ubicaz_partenza
) mov_out ON anaubic.au_ubicaz = mov_out.ubicaz_partenza
WHERE
    anaubic.au_ubicaz IS NOT NULL
    AND LEN(LTRIM(RTRIM(anaubic.au_ubicaz))) > 0
ORDER BY
    anaubic.au_scaff, anaubic.au_posiz, anaubic.au_piano
`;

app.get('/api/warehouse-data', async (req, res) => {
  try {
    const pool = await sql.connect(dbConfig);
    const result = await pool.request().query(QUERY);

    // Transform data to match frontend requirements if needed,
    // but sending raw for now is fine, frontend can parse.
    res.json(result.recordset);

  } catch (err) {
    console.error('SQL Error:', err);
    res.status(500).json({ error: 'Failed to fetch data', details: err.message });
  }
});

// API: Get all pending movements
app.get('/api/movimenti', async (req, res) => {
  try {
    const pool = await sql.connect(dbConfig);
    const result = await pool.request().query(`
      SELECT
        id,
        codditt,
        lp_codart,
        lp_magaz,
        ubicaz_partenza,
        ubicaz_destinazione,
        quantita,
        data_movimento,
        utente,
        confermato,
        data_conferma,
        note
      FROM egmovimentimag3d
      WHERE confermato = 0
      ORDER BY data_movimento DESC
    `);
    res.json(result.recordset);
  } catch (err) {
    console.error('SQL Error:', err);
    res.status(500).json({ error: 'Failed to fetch movements', details: err.message });
  }
});

// API: Create new movement
app.post('/api/movimenti', async (req, res) => {
  try {
    const { codditt, lp_codart, lp_magaz, ubicaz_partenza, ubicaz_destinazione, quantita, utente, note } = req.body;

    // Validation
    if (!codditt || !lp_codart || !lp_magaz || !ubicaz_partenza || !ubicaz_destinazione || !quantita) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (quantita <= 0) {
      return res.status(400).json({ error: 'Quantita must be greater than 0' });
    }

    if (ubicaz_partenza === ubicaz_destinazione) {
      return res.status(400).json({ error: 'Ubicazioni partenza e destinazione devono essere diverse' });
    }

    const pool = await sql.connect(dbConfig);
    const result = await pool.request()
      .input('codditt', sql.VarChar(10), codditt)
      .input('lp_codart', sql.VarChar(50), lp_codart)
      .input('lp_magaz', sql.VarChar(10), lp_magaz)
      .input('ubicaz_partenza', sql.VarChar(50), ubicaz_partenza)
      .input('ubicaz_destinazione', sql.VarChar(50), ubicaz_destinazione)
      .input('quantita', sql.Decimal(18, 6), quantita)
      .input('utente', sql.VarChar(50), utente || null)
      .input('note', sql.VarChar(255), note || null)
      .query(`
        INSERT INTO egmovimentimag3d
          (codditt, lp_codart, lp_magaz, ubicaz_partenza, ubicaz_destinazione, quantita, utente, note)
        VALUES
          (@codditt, @lp_codart, @lp_magaz, @ubicaz_partenza, @ubicaz_destinazione, @quantita, @utente, @note);
        SELECT SCOPE_IDENTITY() AS id;
      `);

    const newId = result.recordset[0].id;
    res.status(201).json({ success: true, id: newId, message: 'Movimento creato con successo' });

  } catch (err) {
    console.error('SQL Error:', err);
    res.status(500).json({ error: 'Failed to create movement', details: err.message });
  }
});

// API: Confirm movement (for external application)
app.put('/api/movimenti/:id/conferma', async (req, res) => {
  try {
    const { id } = req.params;

    const pool = await sql.connect(dbConfig);
    const result = await pool.request()
      .input('id', sql.Int, id)
      .query(`
        UPDATE egmovimentimag3d
        SET confermato = 1, data_conferma = GETDATE()
        WHERE id = @id AND confermato = 0;
        SELECT @@ROWCOUNT AS rowsAffected;
      `);

    const rowsAffected = result.recordset[0].rowsAffected;
    if (rowsAffected === 0) {
      return res.status(404).json({ error: 'Movimento not found or already confirmed' });
    }

    res.json({ success: true, message: 'Movimento confermato' });

  } catch (err) {
    console.error('SQL Error:', err);
    res.status(500).json({ error: 'Failed to confirm movement', details: err.message });
  }
});

// API: Delete pending movement
app.delete('/api/movimenti/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const pool = await sql.connect(dbConfig);
    const result = await pool.request()
      .input('id', sql.Int, id)
      .query(`
        DELETE FROM egmovimentimag3d
        WHERE id = @id AND confermato = 0;
        SELECT @@ROWCOUNT AS rowsAffected;
      `);

    const rowsAffected = result.recordset[0].rowsAffected;
    if (rowsAffected === 0) {
      return res.status(404).json({ error: 'Movimento not found or already confirmed' });
    }

    res.json({ success: true, message: 'Movimento eliminato' });

  } catch (err) {
    console.error('SQL Error:', err);
    res.status(500).json({ error: 'Failed to delete movement', details: err.message });
  }
});

// API: Get heatmap data (frequenza utilizzo ubicazioni)
app.get('/api/optimization/heatmap', async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const pool = await sql.connect(dbConfig);

    // Query per ottenere la frequenza di prelievi per ubicazione
    const result = await pool.request()
      .input('days', sql.Int, days)
      .query(`
        WITH PickupStats AS (
          SELECT
            ubicaz_partenza as ubicazione,
            COUNT(*) as pickup_count
          FROM egmovimentimag3d
          WHERE confermato = 1
            AND data_conferma >= DATEADD(day, -@days, GETDATE())
          GROUP BY ubicaz_partenza
        )
        SELECT
          anaubic.au_ubicaz as locationCode,
          anaubic.au_scaff,
          anaubic.au_posiz,
          anaubic.au_piano,
          ISNULL(ps.pickup_count, 0) as pickupCount
        FROM anaubic
        LEFT JOIN PickupStats ps ON anaubic.au_ubicaz = ps.ubicazione
        WHERE anaubic.au_ubicaz IS NOT NULL
          AND LEN(LTRIM(RTRIM(anaubic.au_ubicaz))) > 0
      `);

    res.json(result.recordset);
  } catch (err) {
    console.error('SQL Error:', err);
    res.status(500).json({ error: 'Failed to fetch heatmap data', details: err.message });
  }
});

// API: Get location statistics
app.get('/api/optimization/location-stats', async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const pool = await sql.connect(dbConfig);

    const result = await pool.request()
      .input('days', sql.Int, days)
      .query(`
        WITH PickupStats AS (
          SELECT
            ubicaz_partenza as ubicazione,
            COUNT(*) as frequency,
            MAX(data_conferma) as last_pickup
          FROM egmovimentimag3d
          WHERE confermato = 1
            AND data_conferma >= DATEADD(day, -@days, GETDATE())
          GROUP BY ubicaz_partenza
        )
        SELECT
          anaubic.au_ubicaz as locationCode,
          ISNULL(ps.frequency, 0) as pickupFrequency,
          ps.last_pickup as lastPickupDate,
          ISNULL(anaubic.au_volume, 0) as totalVolume,
          anaubic.au_scaff,
          anaubic.au_posiz,
          anaubic.au_piano
        FROM anaubic
        LEFT JOIN PickupStats ps ON anaubic.au_ubicaz = ps.ubicazione
        WHERE anaubic.au_ubicaz IS NOT NULL
          AND LEN(LTRIM(RTRIM(anaubic.au_ubicaz))) > 0
      `);

    res.json(result.recordset);
  } catch (err) {
    console.error('SQL Error:', err);
    res.status(500).json({ error: 'Failed to fetch location stats', details: err.message });
  }
});

// API: Get optimal location suggestions
app.get('/api/optimization/suggestions', async (req, res) => {
  try {
    const { days = 30, minFrequency = 5 } = req.query;
    const pool = await sql.connect(dbConfig);

    // Query per trovare prodotti ad alta rotazione in ubicazioni non ottimali
    const result = await pool.request()
      .input('days', sql.Int, days)
      .input('minFrequency', sql.Int, minFrequency)
      .query(`
        WITH PickupStats AS (
          SELECT
            m.ubicaz_partenza,
            m.lp_codart,
            COUNT(*) as frequency,
            MAX(m.data_conferma) as last_pickup
          FROM egmovimentimag3d m
          WHERE m.confermato = 1
            AND m.data_conferma >= DATEADD(day, -@days, GETDATE())
          GROUP BY m.ubicaz_partenza, m.lp_codart
          HAVING COUNT(*) >= @minFrequency
        ),
        CurrentLocations AS (
          SELECT
            ps.*,
            anaubic.au_piano,
            anaubic.au_scaff,
            anaubic.au_posiz,
            anaubic.au_volume,
            artico.ar_volume
          FROM PickupStats ps
          INNER JOIN lotcpro ON ps.ubicaz_partenza = lotcpro.lp_ubicaz
            AND ps.lp_codart = lotcpro.lp_codart
          INNER JOIN anaubic ON ps.ubicaz_partenza = anaubic.au_ubicaz
          LEFT JOIN artico ON ps.lp_codart = artico.ar_codart
          WHERE lotcpro.lp_esist > 0
        )
        SELECT
          ubicaz_partenza as currentLocation,
          lp_codart as productCode,
          frequency as pickupFrequency,
          au_piano as currentLevel,
          au_scaff as currentAisle,
          ISNULL(ar_volume, 0) as productVolume
        FROM CurrentLocations
        ORDER BY frequency DESC
      `);

    res.json(result.recordset);
  } catch (err) {
    console.error('SQL Error:', err);
    res.status(500).json({ error: 'Failed to fetch suggestions', details: err.message });
  }
});

// API: Calculate optimal picking path
app.post('/api/optimization/picking-path', async (req, res) => {
  try {
    const { locations } = req.body;

    if (!locations || !Array.isArray(locations) || locations.length === 0) {
      return res.status(400).json({ error: 'Invalid locations array' });
    }

    const pool = await sql.connect(dbConfig);

    // Ottieni le coordinate delle ubicazioni
    const locationsList = locations.map(l => `'${l}'`).join(',');
    const result = await pool.request()
      .query(`
        SELECT
          au_ubicaz as locationCode,
          au_scaff as aisle,
          au_posiz as bay,
          au_piano as level
        FROM anaubic
        WHERE au_ubicaz IN (${locationsList})
      `);

    res.json(result.recordset);
  } catch (err) {
    console.error('SQL Error:', err);
    res.status(500).json({ error: 'Failed to calculate picking path', details: err.message });
  }
});

app.listen(port, () => {
  console.log(`Backend server listening at http://localhost:${port}`);
});
