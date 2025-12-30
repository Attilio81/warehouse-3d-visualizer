import express from 'express';
import sql from 'mssql';
import cors from 'cors';
import dotenv from 'dotenv';
import Anthropic from '@anthropic-ai/sdk';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 4000;

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

app.use(cors());
app.use(express.json());

// Mutable DB config - can be changed at runtime for demo purposes
let dbConfig = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  database: process.env.DB_DATABASE,
  options: {
    encrypt: false, // For local dev, sometimes encryption causes issues with self-signed certs
    trustServerCertificate: true,
  },
};

// Function to update DB config and close existing connections
async function updateDbConfig(newConfig) {
  // Close existing connections
  try {
    await sql.close();
  } catch (err) {
    // Ignore close errors
  }
  
  // Update config
  dbConfig = {
    ...dbConfig,
    ...newConfig,
    options: dbConfig.options, // Keep options unchanged
  };
  
  return dbConfig;
}

// SQL Query - Show ALL locations from anaubic, with stock info, pending movements and barcodes
// Using OUTER APPLY to get the product with highest stock (if any exists)
// Funzione condivisa per ottenere i dati del magazzino
// Usa la vista vw_WarehouseLocations che include anche il JSON multi-articolo
async function getWarehouseData() {
  try {
    const pool = await sql.connect(dbConfig);
    const result = await pool.request().query('SELECT * FROM vw_WarehouseLocations ORDER BY au_ubicaz');
    return result.recordset;
  } catch (err) {
    console.error('getWarehouseData error:', err);
    throw err;
  }
}

// Shared: Get heatmap data (location usage frequency)
// Shared: Get heatmap data (location usage frequency)
async function getHeatmapData(days) {
  try {
    const pool = await sql.connect(dbConfig);
    // Usa la vista vw_MovementHeatmap (default 365gg).
    // Nota: Il parametro 'days' viene ignorato perché la vista è statica, 
    // ma la firma è mantenuta per compatibilità.
    const result = await pool.request().query('SELECT * FROM vw_MovementHeatmap ORDER BY pickupCount DESC');
    return result.recordset;
  } catch (err) {
    console.error('getHeatmapData error:', err);
    throw err;
  }
}

// Shared: Get optimization suggestions
// Shared: Get optimization suggestions
async function getOptimizationSuggestions(days, minFrequency) {
  try {
    const pool = await sql.connect(dbConfig);
    // Usa la vista vw_OptimizationSuggestions (default 365gg, minFreq 3).
    // Nota: I parametri passati vengono ignorati perché la vista è statica.
    const result = await pool.request().query('SELECT * FROM vw_OptimizationSuggestions ORDER BY totalMovements DESC');
    return result.recordset;
  } catch (err) {
    console.error('getOptimizationSuggestions error:', err);
    throw err;
  }
}

// ============================================
// REST API ENDPOINTS
// ============================================

app.get('/api/warehouse-data', async (req, res) => {
  try {
    const data = await getWarehouseData();
    res.json(data);
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
    const { days = 365 } = req.query;
    const data = await getHeatmapData(parseInt(days));
    res.json(data);
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
    const { days = 365, minFrequency = 3 } = req.query;
    const data = await getOptimizationSuggestions(parseInt(days), parseInt(minFrequency));
    res.json(data);
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

// Helper function: Search location - usa la funzione condivisa getWarehouseData()
// Helper function: Search location - Esegue una query SQL diretta ed efficiente
// Cerca sia nelle ubicazioni che negli articoli/barcode
async function searchLocationInternal(query) {
  try {
    const pool = await sql.connect(dbConfig);
    const searchTerm = `%${query.trim()}%`;

    // Query ottimizzata che cerca direttamente nella tabella giacenze (lotcpro)
    // Questo permette di trovare un articolo anche se non è il principale dell'ubicazione
    const result = await pool.request()
      .input('search', sql.NVarChar, searchTerm)
      .query(`
        SELECT DISTINCT TOP 10
          anaubic.au_ubicaz AS ubicazione,
          anaubic.au_scaff AS scaffale,
          anaubic.au_posiz AS posizione,
          anaubic.au_piano AS piano,
          ISNULL(lotcpro.lp_codart, '') AS codiceArticolo,
          ISNULL(lotcpro.lp_esist, 0) AS quantita,
          ISNULL(artico.ar_descr, '') AS descrizioneArticolo
        FROM anaubic
        LEFT JOIN lotcpro ON anaubic.au_ubicaz = lotcpro.lp_ubicaz AND lotcpro.codditt = anaubic.codditt AND lotcpro.lp_esist > 0
        LEFT JOIN artico ON lotcpro.lp_codart = artico.ar_codart AND lotcpro.codditt = artico.codditt
        LEFT JOIN barcode ON lotcpro.lp_codart = barcode.bc_codart AND lotcpro.codditt = barcode.codditt
        WHERE 
          (anaubic.au_ubicaz LIKE @search) OR 
          (lotcpro.lp_codart LIKE @search) OR 
          (artico.ar_descr LIKE @search) OR 
          (barcode.bc_code LIKE @search) OR
          (anaubic.au_barcode LIKE @search)
        ORDER BY 
          anaubic.au_ubicaz
      `);

    return result.recordset.length > 0
      ? result.recordset
      : [{ message: 'Nessun risultato trovato per: ' + query }];
  } catch (err) {
    console.error('searchLocationInternal error:', err);
    return [{ error: 'Errore nella ricerca: ' + err.message }];
  }
}

// Helper function: Get optimization suggestions - usa la funzione condivisa getOptimizationSuggestions()
async function getOptimizationSuggestionsInternal({ days = 365, minFrequency = 3 }) {
  try {
    const data = await getOptimizationSuggestions(days, minFrequency);

    if (data.length === 0) {
      return [{ message: 'Nessun suggerimento di ottimizzazione disponibile per i parametri specificati.' }];
    }

    // Trasforma i dati nel formato atteso dal chatbot
    return data.slice(0, 10).map(item => ({
      ubicazione: item.currentLocation,
      codiceArticolo: item.productCode,
      descrizione: item.productDesc,
      frequenzaPrelievi: item.pickupFrequency,
      livelloAttuale: item.currentLevel,
      scaffale: item.currentAisle
    }));
  } catch (err) {
    console.error('getOptimizationSuggestionsInternal error:', err);
    return [{ error: 'Errore nel recupero suggerimenti: ' + err.message }];
  }
}

// Helper function: Get heatmap data - usa la funzione condivisa getHeatmapData()
async function getHeatmapDataInternal({ days = 365 }) {
  try {
    const data = await getHeatmapData(days);

    // Filtra e ordina per ottenere solo le ubicazioni con movimenti
    const topLocations = data
      .filter(loc => loc.pickupCount > 0)
      .sort((a, b) => b.pickupCount - a.pickupCount)
      .slice(0, 10)
      .map(loc => ({
        ubicazione: loc.locationCode,
        totalMovimenti: loc.pickupCount,
        entrate: loc.entrate,
        uscite: loc.uscite
      }));

    return {
      topLocations,
      totalAnalyzed: topLocations.length,
      periodDays: days
    };
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

// ============================================
// DATABASE ADMIN ENDPOINTS (DEMO ONLY)
// ============================================

// API: Get current DB configuration (sanitized)
app.get('/api/admin/db-config', async (req, res) => {
  res.json({
    server: dbConfig.server || 'Non configurato',
    database: dbConfig.database || 'Non configurato',
    user: dbConfig.user || 'Non configurato',
    // Password is intentionally not returned
  });
});

// API: Update DB configuration (DEMO ONLY)
app.post('/api/admin/db-config', async (req, res) => {
  try {
    const { server, database, user, password } = req.body;
    
    if (!server || !database || !user || !password) {
      return res.status(400).json({ error: 'Tutti i campi sono obbligatori' });
    }
    
    // Update the config
    await updateDbConfig({ server, database, user, password });
    
    // Test the new connection
    try {
      const pool = await sql.connect(dbConfig);
      await pool.request().query('SELECT 1 as test');
      
      res.json({ 
        success: true, 
        message: 'Configurazione aggiornata e connessione verificata',
        config: {
          server: dbConfig.server,
          database: dbConfig.database,
          user: dbConfig.user,
        }
      });
    } catch (connErr) {
      res.status(400).json({ 
        success: false, 
        error: 'Configurazione salvata ma connessione fallita',
        details: connErr.message 
      });
    }
    
  } catch (err) {
    console.error('Update DB config error:', err);
    res.status(500).json({ error: 'Errore nell\'aggiornamento configurazione', details: err.message });
  }
});

// API: Execute SQL script to create movimenti table
app.post('/api/admin/create-movimenti-table', async (req, res) => {
  try {
    const pool = await sql.connect(dbConfig);
    
    // Read SQL file
    const sqlFilePath = path.join(__dirname, '..', 'create_movimenti_table.sql');
    
    if (!fs.existsSync(sqlFilePath)) {
      return res.status(404).json({ error: 'File SQL non trovato', path: sqlFilePath });
    }
    
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    
    // Split by GO and execute each batch
    const batches = sqlContent.split(/^\s*GO\s*$/im);
    const results = [];
    
    for (const batch of batches) {
      const query = batch.trim();
      if (query && !query.startsWith('--')) {
        try {
          await pool.query(query);
          results.push({ batch: query.substring(0, 50) + '...', status: 'success' });
        } catch (err) {
          // Check if it's just a "table already exists" error
          if (err.message.includes('already an object named')) {
            results.push({ batch: query.substring(0, 50) + '...', status: 'skipped', reason: 'Oggetto già esistente' });
          } else {
            results.push({ batch: query.substring(0, 50) + '...', status: 'error', error: err.message });
          }
        }
      }
    }
    
    res.json({ success: true, message: 'Tabella egmovimentimag3d creata/verificata', results });
    
  } catch (err) {
    console.error('Create movimenti table error:', err);
    res.status(500).json({ error: 'Errore nella creazione tabella', details: err.message });
  }
});

// API: Execute SQL views
app.post('/api/admin/apply-views', async (req, res) => {
  try {
    const pool = await sql.connect(dbConfig);
    
    const viewsDir = path.join(__dirname, '..', 'sql', 'views');
    
    if (!fs.existsSync(viewsDir)) {
      return res.status(404).json({ error: 'Directory views non trovata', path: viewsDir });
    }
    
    const files = fs.readdirSync(viewsDir).filter(f => f.endsWith('.sql'));
    const results = [];
    
    for (const file of files) {
      const filePath = path.join(viewsDir, file);
      const content = fs.readFileSync(filePath, 'utf8');
      
      // Split by GO command
      const batches = content.split(/^\s*GO\s*$/im);
      
      for (const batch of batches) {
        const query = batch.trim();
        if (query) {
          try {
            await pool.query(query);
            results.push({ file, batch: query.substring(0, 50) + '...', status: 'success' });
          } catch (err) {
            results.push({ file, batch: query.substring(0, 50) + '...', status: 'error', error: err.message });
          }
        }
      }
    }
    
    res.json({ success: true, message: 'Views applicate', results });
    
  } catch (err) {
    console.error('Apply views error:', err);
    res.status(500).json({ error: 'Errore nell\'applicazione delle views', details: err.message });
  }
});

// API: Run all DB setup (table + views)
app.post('/api/admin/setup-db', async (req, res) => {
  try {
    const pool = await sql.connect(dbConfig);
    const allResults = { table: [], views: [] };
    
    // 1. Create movimenti table
    const tableSqlPath = path.join(__dirname, '..', 'create_movimenti_table.sql');
    if (fs.existsSync(tableSqlPath)) {
      const tableSql = fs.readFileSync(tableSqlPath, 'utf8');
      const batches = tableSql.split(/^\s*GO\s*$/im);
      
      for (const batch of batches) {
        const query = batch.trim();
        if (query && !query.startsWith('--')) {
          try {
            await pool.query(query);
            allResults.table.push({ status: 'success' });
          } catch (err) {
            if (err.message.includes('already an object named')) {
              allResults.table.push({ status: 'skipped', reason: 'Già esistente' });
            } else {
              allResults.table.push({ status: 'error', error: err.message });
            }
          }
        }
      }
    }
    
    // 2. Apply views
    const viewsDir = path.join(__dirname, '..', 'sql', 'views');
    if (fs.existsSync(viewsDir)) {
      const files = fs.readdirSync(viewsDir).filter(f => f.endsWith('.sql'));
      
      for (const file of files) {
        const filePath = path.join(viewsDir, file);
        const content = fs.readFileSync(filePath, 'utf8');
        const batches = content.split(/^\s*GO\s*$/im);
        
        for (const batch of batches) {
          const query = batch.trim();
          if (query) {
            try {
              await pool.query(query);
              allResults.views.push({ file, status: 'success' });
            } catch (err) {
              allResults.views.push({ file, status: 'error', error: err.message });
            }
          }
        }
      }
    }
    
    const tableSuccess = allResults.table.every(r => r.status !== 'error');
    const viewsSuccess = allResults.views.every(r => r.status !== 'error');
    
    res.json({
      success: tableSuccess && viewsSuccess,
      message: tableSuccess && viewsSuccess 
        ? 'Setup database completato con successo' 
        : 'Setup completato con alcuni errori',
      results: allResults
    });
    
  } catch (err) {
    console.error('Setup DB error:', err);
    res.status(500).json({ error: 'Errore nel setup del database', details: err.message });
  }
});

// API: Test DB connection
app.get('/api/admin/test-connection', async (req, res) => {
  try {
    const pool = await sql.connect(dbConfig);
    await pool.request().query('SELECT 1 as test');
    res.json({ success: true, message: 'Connessione al database riuscita' });
  } catch (err) {
    console.error('DB connection test error:', err);
    res.status(500).json({ success: false, error: 'Connessione fallita', details: err.message });
  }
});

app.listen(port, () => {
  console.log(`Backend server listening at http://localhost:${port}`);
});
