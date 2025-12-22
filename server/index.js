import express from 'express';
import sql from 'mssql';
import cors from 'cors';
import dotenv from 'dotenv';
import Anthropic from '@anthropic-ai/sdk';

dotenv.config();

const app = express();
const port = 4000;

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

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

// SQL Query - Show ALL locations from anaubic, with stock info, pending movements and barcodes
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
    ISNULL(stock.bc_code, '') AS barcode,
    ISNULL(stock.bc_unmis, '') AS barcode_unmis,
    ISNULL(stock.bc_quant, 0) AS barcode_quant,
    ISNULL(mov_in.quantita_in, 0) AS mov_in,
    ISNULL(mov_out.quantita_out, 0) AS mov_out
FROM
    anaubic
OUTER APPLY (
    SELECT TOP 1
        lotcpro.lp_codart,
        lotcpro.lp_esist,
        artico.ar_descr,
        bc.bc_code,
        bc.bc_unmis,
        bc.bc_quant
    FROM lotcpro
    LEFT JOIN artico ON lotcpro.codditt = artico.codditt
        AND lotcpro.lp_codart = artico.ar_codart
    LEFT JOIN barcode bc ON lotcpro.codditt = bc.codditt
        AND lotcpro.lp_codart = bc.bc_codart
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

// API: Get heatmap data (frequenza utilizzo ubicazioni basata su movimenti REALI)
app.get('/api/optimization/heatmap', async (req, res) => {
  try {
    const { days = 90 } = req.query; // Default 90 giorni per avere più dati significativi
    const pool = await sql.connect(dbConfig);

    // Query basata sui movimenti REALI (tabella movmag)
    // tb_esist: 1 = carico (entrata), altri = scarico (uscita/prelievo)
    // Contiamo sia entrate che uscite per avere un quadro completo dell'attività
    const result = await pool.request()
      .input('days', sql.Int, days)
      .query(`
        WITH MovimentStats AS (
          SELECT
            mm_ubicaz as ubicazione,
            COUNT(*) as total_movements,
            SUM(CASE WHEN tabcaum.tb_esist = 1 THEN 1 ELSE 0 END) as entrate,
            SUM(CASE WHEN tabcaum.tb_esist != 1 THEN 1 ELSE 0 END) as uscite,
            SUM(ABS(mm_quant)) as quantita_totale
          FROM movmag
          INNER JOIN tabcaum ON movmag.mm_causale = tabcaum.tb_codcaum
          WHERE mm_ultagg >= DATEADD(day, -@days, GETDATE())
            AND mm_ubicaz IS NOT NULL
            AND LEN(LTRIM(RTRIM(mm_ubicaz))) > 0
          GROUP BY mm_ubicaz
        )
        SELECT
          anaubic.au_ubicaz as locationCode,
          anaubic.au_scaff,
          anaubic.au_posiz,
          anaubic.au_piano,
          ISNULL(ms.total_movements, 0) as pickupCount,
          ISNULL(ms.entrate, 0) as entrate,
          ISNULL(ms.uscite, 0) as uscite,
          ISNULL(ms.quantita_totale, 0) as quantitaTotale
        FROM anaubic
        LEFT JOIN MovimentStats ms ON anaubic.au_ubicaz = ms.ubicazione
        WHERE anaubic.au_ubicaz IS NOT NULL
          AND LEN(LTRIM(RTRIM(anaubic.au_ubicaz))) > 0
          AND anaubic.au_ubicaz != '00 00 00'
          AND anaubic.au_scaff > 0
      `);

    res.json(result.recordset);
  } catch (err) {
    console.error('SQL Error:', err);
    res.status(500).json({ error: 'Failed to fetch heatmap data', details: err.message });
  }
});

// API: Get location statistics (basato su movimenti REALI)
app.get('/api/optimization/location-stats', async (req, res) => {
  try {
    const { days = 90 } = req.query;
    const pool = await sql.connect(dbConfig);

    const result = await pool.request()
      .input('days', sql.Int, days)
      .query(`
        WITH MovimentStats AS (
          SELECT
            mm_ubicaz as ubicazione,
            COUNT(*) as frequency,
            MAX(mm_ultagg) as last_movement,
            SUM(CASE WHEN tabcaum.tb_esist != 1 THEN 1 ELSE 0 END) as uscite
          FROM movmag
          INNER JOIN tabcaum ON movmag.mm_causale = tabcaum.tb_codcaum
          WHERE mm_ultagg >= DATEADD(day, -@days, GETDATE())
            AND mm_ubicaz IS NOT NULL
            AND LEN(LTRIM(RTRIM(mm_ubicaz))) > 0
          GROUP BY mm_ubicaz
        )
        SELECT
          anaubic.au_ubicaz as locationCode,
          ISNULL(ms.frequency, 0) as pickupFrequency,
          ISNULL(ms.uscite, 0) as pickupCount,
          ms.last_movement as lastPickupDate,
          ISNULL(anaubic.au_volume, 0) as totalVolume,
          anaubic.au_scaff,
          anaubic.au_posiz,
          anaubic.au_piano
        FROM anaubic
        LEFT JOIN MovimentStats ms ON anaubic.au_ubicaz = ms.ubicazione
        WHERE anaubic.au_ubicaz IS NOT NULL
          AND LEN(LTRIM(RTRIM(anaubic.au_ubicaz))) > 0
      `);

    res.json(result.recordset);
  } catch (err) {
    console.error('SQL Error:', err);
    res.status(500).json({ error: 'Failed to fetch location stats', details: err.message });
  }
});

// API: Get optimal location suggestions (basato su movimenti REALI)
app.get('/api/optimization/suggestions', async (req, res) => {
  try {
    const { days = 90, minFrequency = 3 } = req.query;
    const pool = await sql.connect(dbConfig);

    // Query per trovare prodotti ad alta rotazione basata su movimenti REALI
    const result = await pool.request()
      .input('days', sql.Int, days)
      .input('minFrequency', sql.Int, minFrequency)
      .query(`
        WITH MovimentStats AS (
          SELECT
            mm_ubicaz as ubicazione,
            mm_codart as codart,
            COUNT(*) as frequency,
            SUM(CASE WHEN tabcaum.tb_esist != 1 THEN 1 ELSE 0 END) as uscite,
            MAX(mm_ultagg) as last_movement
          FROM movmag
          INNER JOIN tabcaum ON movmag.mm_causale = tabcaum.tb_codcaum
          WHERE mm_ultagg >= DATEADD(day, -@days, GETDATE())
            AND mm_ubicaz IS NOT NULL
            AND LEN(LTRIM(RTRIM(mm_ubicaz))) > 0
          GROUP BY mm_ubicaz, mm_codart
          HAVING SUM(CASE WHEN tabcaum.tb_esist != 1 THEN 1 ELSE 0 END) >= @minFrequency
        ),
        CurrentLocations AS (
          SELECT
            ms.*,
            anaubic.au_piano,
            anaubic.au_scaff,
            anaubic.au_posiz,
            anaubic.au_volume,
            artico.ar_volume,
            artico.ar_descr
          FROM MovimentStats ms
          INNER JOIN anaubic ON ms.ubicazione = anaubic.au_ubicaz
          LEFT JOIN artico ON ms.codart = artico.ar_codart
        )
        SELECT
          ubicazione as currentLocation,
          codart as productCode,
          ar_descr as productDesc,
          uscite as pickupFrequency,
          frequency as totalMovements,
          au_piano as currentLevel,
          au_scaff as currentAisle,
          ISNULL(ar_volume, 0) as productVolume
        FROM CurrentLocations
        ORDER BY uscite DESC
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

// DEBUG: Get barcode info for an article
app.get('/api/debug/barcode/:codart', async (req, res) => {
  try {
    const { codart } = req.params;
    const pool = await sql.connect(dbConfig);
    const result = await pool.request()
      .input('codart', sql.VarChar(50), codart)
      .query(`
        SELECT * FROM barcode WHERE bc_codart LIKE '%' + @codart + '%'
      `);
    res.json(result.recordset);
  } catch (err) {
    console.error('SQL Error:', err);
    res.status(500).json({ error: err.message });
  }
});

// DEBUG: Check if article has stock in any location
app.get('/api/debug/stock/:codart', async (req, res) => {
  try {
    const { codart } = req.params;
    const pool = await sql.connect(dbConfig);
    const result = await pool.request()
      .input('codart', sql.VarChar(50), codart)
      .query(`
        SELECT lp.*, bc.bc_code as barcode
        FROM lotcpro lp
        LEFT JOIN barcode bc ON lp.codditt = bc.codditt AND lp.lp_codart = bc.bc_codart
        WHERE lp.lp_codart LIKE '%' + @codart + '%' AND lp.lp_esist > 0
      `);
    res.json(result.recordset);
  } catch (err) {
    console.error('SQL Error:', err);
    res.status(500).json({ error: err.message });
  }
});

// API: Get movement history for a location (storico movimenti effettuati)
app.get('/api/movimenti/storico/:ubicazione', async (req, res) => {
  try {
    const { ubicazione } = req.params;
    const { limit = 50 } = req.query;
    
    const pool = await sql.connect(dbConfig);
    const result = await pool.request()
      .input('ubicazione', sql.VarChar, ubicazione)
      .input('limit', sql.Int, parseInt(limit))
      .query(`
        SELECT TOP (@limit)
          movmag.mm_ubicaz AS ubicazione,
          movmag.mm_magaz AS magazzino,
          movmag.mm_codart AS codiceArticolo,
          artico.ar_descr AS descrizioneArticolo,
          tabcaum.tb_descaum AS causale,
          tabcaum.tb_esist AS tipoMovimento,
          movmag.mm_colli AS colli,
          movmag.mm_quant AS quantita,
          movmag.mm_ultagg AS dataMovimento,
          movmag.mm_numdoc AS numeroDocumento
        FROM movmag
        INNER JOIN tabcaum ON movmag.mm_causale = tabcaum.tb_codcaum
        LEFT JOIN artico ON movmag.mm_codart = artico.ar_codart
        WHERE movmag.mm_ubicaz = @ubicazione
        ORDER BY movmag.mm_ultagg DESC
      `);

    // Map tipoMovimento: -1 = uscita, 1 = entrata
    const movements = result.recordset.map(m => ({
      ...m,
      tipo: m.tipoMovimento === 1 ? 'entrata' : 'uscita'
    }));

    res.json(movements);
  } catch (err) {
    console.error('SQL Error:', err);
    res.status(500).json({ error: 'Failed to fetch movement history', details: err.message });
  }
});

// API: Get movement history for an article (storico movimenti per articolo)
app.get('/api/movimenti/storico-articolo/:codart', async (req, res) => {
  try {
    const { codart } = req.params;
    const { limit = 50 } = req.query;
    
    const pool = await sql.connect(dbConfig);
    const result = await pool.request()
      .input('codart', sql.VarChar, codart)
      .input('limit', sql.Int, parseInt(limit))
      .query(`
        SELECT TOP (@limit)
          movmag.mm_ubicaz AS ubicazione,
          movmag.mm_magaz AS magazzino,
          movmag.mm_codart AS codiceArticolo,
          artico.ar_descr AS descrizioneArticolo,
          tabcaum.tb_descaum AS causale,
          tabcaum.tb_esist AS tipoMovimento,
          movmag.mm_colli AS colli,
          movmag.mm_quant AS quantita,
          movmag.mm_ultagg AS dataMovimento,
          movmag.mm_numdoc AS numeroDocumento
        FROM movmag
        INNER JOIN tabcaum ON movmag.mm_causale = tabcaum.tb_codcaum
        LEFT JOIN artico ON movmag.mm_codart = artico.ar_codart
        WHERE movmag.mm_codart = @codart
        ORDER BY movmag.mm_ultagg DESC
      `);

    const movements = result.recordset.map(m => ({
      ...m,
      tipo: m.tipoMovimento === 1 ? 'entrata' : 'uscita'
    }));

    res.json(movements);
  } catch (err) {
    console.error('SQL Error:', err);
    res.status(500).json({ error: 'Failed to fetch article movement history', details: err.message });
  }
});

// ============================================
// CHATBOT AI ENDPOINT
// ============================================

// Helper function: Search location by code, article, or barcode
async function searchLocationInternal(query) {
  try {
    const pool = await sql.connect(dbConfig);
    const result = await pool.request()
      .input('query', sql.VarChar, `%${query}%`)
      .query(`
        SELECT TOP 5
          anaubic.au_ubicaz AS ubicazione,
          anaubic.au_scaff AS scaffale,
          anaubic.au_posiz AS posizione,
          anaubic.au_piano AS piano,
          ISNULL(stock.lp_codart, '') AS codiceArticolo,
          ISNULL(stock.lp_esist, 0) AS quantita,
          ISNULL(stock.ar_descr, '') AS descrizioneArticolo,
          ISNULL(stock.bc_code, '') AS barcode
        FROM anaubic
        LEFT JOIN (
          SELECT lp_ubicaz, lp_codart, lp_esist, ar_descr, bc_code,
                 ROW_NUMBER() OVER (PARTITION BY lp_ubicaz ORDER BY lp_esist DESC) as rn
          FROM lotcpro
          LEFT JOIN artico ON lotcpro.lp_codart = artico.ar_codart
          LEFT JOIN barcod ON artico.ar_codart = barcod.bc_codart
        ) stock ON anaubic.au_ubicaz = stock.lp_ubicaz AND stock.rn = 1
        WHERE anaubic.au_ubicaz LIKE @query
           OR stock.lp_codart LIKE @query
           OR stock.bc_code LIKE @query
           OR stock.ar_descr LIKE @query
        ORDER BY anaubic.au_ubicaz
      `);

    return result.recordset.length > 0
      ? result.recordset
      : [{ message: 'Nessuna ubicazione trovata per la ricerca: ' + query }];
  } catch (err) {
    console.error('searchLocationInternal error:', err);
    return [{ error: 'Errore nella ricerca: ' + err.message }];
  }
}

// Helper function: Get optimization suggestions
async function getOptimizationSuggestionsInternal({ days = 30, minFrequency = 5 }) {
  try {
    const pool = await sql.connect(dbConfig);
    const result = await pool.request()
      .input('days', sql.Int, days)
      .input('minFrequency', sql.Int, minFrequency)
      .query(`
        WITH MovementStats AS (
          SELECT
            mm_ubicaz,
            COUNT(*) as frequency,
            SUM(CASE WHEN tabcaum.tb_esist = -1 THEN 1 ELSE 0 END) as pickups
          FROM movmag
          INNER JOIN tabcaum ON movmag.mm_causale = tabcaum.tb_codcaum
          WHERE mm_ultagg >= DATEADD(day, -@days, GETDATE())
          GROUP BY mm_ubicaz
          HAVING COUNT(*) >= @minFrequency
        )
        SELECT TOP 10
          anaubic.au_ubicaz AS ubicazione,
          anaubic.au_scaff AS scaffale,
          anaubic.au_posiz AS posizione,
          anaubic.au_piano AS piano,
          MovementStats.frequency AS frequenzaUtilizzo,
          MovementStats.pickups AS prelievi
        FROM anaubic
        INNER JOIN MovementStats ON anaubic.au_ubicaz = MovementStats.mm_ubicaz
        WHERE anaubic.au_piano > 2
        ORDER BY MovementStats.pickups DESC
      `);

    return result.recordset.length > 0
      ? result.recordset
      : [{ message: 'Nessun suggerimento di ottimizzazione disponibile per i parametri specificati.' }];
  } catch (err) {
    console.error('getOptimizationSuggestionsInternal error:', err);
    return [{ error: 'Errore nel recupero suggerimenti: ' + err.message }];
  }
}

// Helper function: Get heatmap statistics
async function getHeatmapDataInternal({ days = 30 }) {
  try {
    const pool = await sql.connect(dbConfig);
    const result = await pool.request()
      .input('days', sql.Int, days)
      .query(`
        SELECT TOP 10
          mm_ubicaz AS ubicazione,
          COUNT(*) AS totalMovimenti,
          SUM(CASE WHEN tabcaum.tb_esist = 1 THEN 1 ELSE 0 END) AS entrate,
          SUM(CASE WHEN tabcaum.tb_esist = -1 THEN 1 ELSE 0 END) AS uscite
        FROM movmag
        INNER JOIN tabcaum ON movmag.mm_causale = tabcaum.tb_codcaum
        WHERE mm_ultagg >= DATEADD(day, -@days, GETDATE())
          AND mm_ubicaz NOT LIKE '%00 00 00%'
        GROUP BY mm_ubicaz
        ORDER BY COUNT(*) DESC
      `);

    const stats = {
      topLocations: result.recordset,
      totalAnalyzed: result.recordset.length,
      periodDays: days
    };

    return stats;
  } catch (err) {
    console.error('getHeatmapDataInternal error:', err);
    return { error: 'Errore nel recupero dati heatmap: ' + err.message };
  }
}

// Main Chat Endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const { message, conversationHistory = [] } = req.body;

    // Validation
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Messaggio non valido' });
    }

    if (message.length > 1000) {
      return res.status(400).json({ error: 'Messaggio troppo lungo (max 1000 caratteri)' });
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return res.status(500).json({ error: 'Chiave API Anthropic non configurata' });
    }

    // Define available tools for the AI
    const tools = [
      {
        name: "search_location",
        description: "Cerca ubicazioni nel magazzino per codice ubicazione, codice articolo, barcode o descrizione. Restituisce fino a 5 risultati con dettagli completi.",
        input_schema: {
          type: "object",
          properties: {
            query: {
              type: "string",
              description: "Il termine di ricerca (codice ubicazione, codice articolo, barcode o descrizione)"
            }
          },
          required: ["query"]
        }
      },
      {
        name: "get_optimization_suggestions",
        description: "Ottieni suggerimenti per ottimizzare il posizionamento degli articoli nel magazzino. Identifica ubicazioni ad alto utilizzo che potrebbero essere riposizionate per maggiore efficienza.",
        input_schema: {
          type: "object",
          properties: {
            days: {
              type: "number",
              description: "Numero di giorni da analizzare per lo storico movimenti (default: 30)",
              default: 30
            },
            minFrequency: {
              type: "number",
              description: "Frequenza minima di utilizzo per considerare un'ubicazione (default: 5)",
              default: 5
            }
          }
        }
      },
      {
        name: "get_heatmap_data",
        description: "Ottieni statistiche di utilizzo delle ubicazioni (heatmap) per identificare le aree più attive del magazzino.",
        input_schema: {
          type: "object",
          properties: {
            days: {
              type: "number",
              description: "Numero di giorni da analizzare (default: 30)",
              default: 30
            }
          }
        }
      }
    ];

    // System prompt with context
    const systemPrompt = `Sei un assistente AI per un sistema di gestione magazzino 3D.

Il tuo ruolo è aiutare gli utenti a:
- Cercare ubicazioni, articoli e barcode nel magazzino
- Fornire suggerimenti per ottimizzare il posizionamento degli articoli
- Analizzare l'utilizzo del magazzino con statistiche e heatmap
- Rispondere a domande sulla logistica e gestione del magazzino

Hai accesso a queste funzioni:
- search_location: cerca ubicazioni per codice, articolo o barcode
- get_optimization_suggestions: ottieni suggerimenti di ottimizzazione basati su dati reali
- get_heatmap_data: analizza utilizzo e movimenti del magazzino

Linee guida:
- Rispondi SEMPRE in italiano
- Sii conciso e professionale
- Usa i dati reali dalle funzioni quando disponibili
- Se non trovi risultati, suggerisci alternative o chiedi chiarimenti
- Mantieni il contesto della conversazione
- Formatta i numeri in modo leggibile (es: 1.234 invece di 1234)

Ricorda: stai assistendo operatori di magazzino, quindi usa un linguaggio chiaro e pratico.`;

    // Build messages array with conversation history
    const messages = [
      ...conversationHistory,
      { role: "user", content: message }
    ];

    // First API call to Claude
    let response = await anthropic.messages.create({
      model: "claude-3-5-haiku-20241022",
      max_tokens: 2048,
      system: systemPrompt,
      tools: tools,
      messages: messages
    });

    // Handle tool calls
    while (response.stop_reason === "tool_use") {
      const toolUse = response.content.find(block => block.type === "tool_use");

      if (!toolUse) break;

      console.log(`AI chiamando tool: ${toolUse.name}`, toolUse.input);

      // Execute the tool
      let toolResult;
      switch (toolUse.name) {
        case "search_location":
          toolResult = await searchLocationInternal(toolUse.input.query);
          break;

        case "get_optimization_suggestions":
          toolResult = await getOptimizationSuggestionsInternal(toolUse.input);
          break;

        case "get_heatmap_data":
          toolResult = await getHeatmapDataInternal(toolUse.input);
          break;

        default:
          toolResult = { error: "Funzione non riconosciuta" };
      }

      console.log(`Tool result:`, JSON.stringify(toolResult).substring(0, 200));

      // Continue conversation with tool result
      messages.push({
        role: "assistant",
        content: response.content
      });

      messages.push({
        role: "user",
        content: [{
          type: "tool_result",
          tool_use_id: toolUse.id,
          content: JSON.stringify(toolResult)
        }]
      });

      // Call Claude again with the tool result
      response = await anthropic.messages.create({
        model: "claude-3-5-haiku-20241022",
        max_tokens: 2048,
        system: systemPrompt,
        tools: tools,
        messages: messages
      });
    }

    // Extract text response
    const textContent = response.content.find(block => block.type === "text");
    const responseText = textContent ? textContent.text : "Mi dispiace, non sono riuscito a elaborare una risposta.";

    res.json({
      response: responseText,
      conversationId: Date.now().toString() // Simple conversation tracking
    });

  } catch (err) {
    console.error('Chat API Error:', err);

    // Handle specific Anthropic errors
    if (err.status === 401) {
      return res.status(500).json({ error: 'Chiave API Anthropic non valida' });
    }

    if (err.status === 429) {
      return res.status(429).json({ error: 'Troppi messaggi. Riprova tra poco.' });
    }

    res.status(500).json({
      error: 'Errore nel servizio chat',
      details: err.message
    });
  }
});

app.listen(port, () => {
  console.log(`Backend server listening at http://localhost:${port}`);
});
