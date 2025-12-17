# Warehouse 3D Visualizer 📦

Un visualizzatore 3D interattivo per la gestione e ottimizzazione del magazzino con analisi avanzate e suggerimenti intelligenti.

![Version](https://img.shields.io/badge/version-1.1.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![React](https://img.shields.io/badge/React-19.2.3-61dafb.svg)
![Three.js](https://img.shields.io/badge/Three.js-0.182.0-black.svg)

## 🎯 Caratteristiche Principali

> 📚 **Documentazione**: [Manuale Utente completo](MANUALE_UTENTE.md) | [README Tecnico](#) | [API Docs](#api-endpoints)

### Visualizzazione 3D
- **Rendering interattivo** del magazzino in tempo reale
- **Navigazione intuitiva** con controlli mouse (zoom, rotazione, pan)
- **Modalità FPS** (First Person) per navigare in prima persona nel magazzino
- **Colori dinamici** per identificare stato ubicazioni (piena, vuota, con movimenti pendenti)
- **Selezione ubicazioni** con dettagli completi e pannello scrollabile
- **Ricerca rapida** per codice ubicazione, articolo o **barcode**
- **Etichette corridoi** visualizzate a pavimento per orientamento
- **Doppio click** per cambiare punto di orbita della camera

### Gestione Movimenti
- **Spostamento articoli inline** direttamente dal pannello "Dettagli Selezione"
- **Selezione destinazione visuale** con click sulla mappa 3D
- **Creazione movimenti** merce tra ubicazioni
- **Tracking movimenti pendenti** in tempo reale
- **Conferma/Eliminazione** movimenti
- **Validazione automatica** delle operazioni

### 🚀 Ottimizzazione Logistica (NUOVO!)

#### 1. Heatmap Utilizzo
- **Visualizzazione 3D** della frequenza di utilizzo ubicazioni
- **Scala colori graduale** da blu (poco usato) a rosso (molto usato)
- **Analisi statistica** con metriche aggregate
- **Top 10 ubicazioni** più utilizzate

#### 2. Suggerimenti Intelligenti
- **Algoritmo avanzato** per identificare ubicazioni non ottimali
- **Score di miglioramento** percentuale per ogni suggerimento
- **Fattori analizzati**:
  - Frequenza di prelievo (50%)
  - Distanza dalla zona spedizione (30%)
  - Accessibilità per livello (20%)
- **Notifiche in tempo reale** di suggerimenti disponibili

#### 3. Percorsi Ottimali per Picking
- **Algoritmo Nearest Neighbor** con ottimizzazione 2-opt
- **Visualizzazione 3D del percorso** ottimale
- **Metriche dettagliate**:
  - Distanza totale in metri
  - Tempo stimato in minuti
  - Ordine ottimale delle fermate
- **Markers numerati** per sequenza picking

## 🛠️ Tecnologie Utilizzate

### Frontend
- **React 19.2.3** - UI Framework
- **Three.js 0.182.0** - Rendering 3D
- **@react-three/fiber** - React renderer per Three.js
- **@react-three/drei** - Utilities per React Three Fiber
- **Lucide React** - Icone moderne
- **Vite** - Build tool e dev server

### Backend
- **Node.js** - Runtime JavaScript
- **Express 5** - Server web framework
- **MSSQL 12** - Driver Microsoft SQL Server
- **CORS** - Cross-Origin Resource Sharing
- **dotenv** - Gestione variabili d'ambiente

### Database
- **Microsoft SQL Server** - Database relazionale
- Tabelle: `anaubic`, `lotcpro`, `artico`, `egmovimentimag3d`

## 📋 Prerequisiti

- **Node.js** >= 18.0.0
- **npm** >= 9.0.0
- **Microsoft SQL Server** (locale o remoto)
- Browser moderno con supporto WebGL

## 🚀 Installazione

### 1. Clone del Repository
```bash
git clone https://github.com/tuousername/warehouse-3d-visualizer.git
cd warehouse-3d-visualizer
```

### 2. Installazione Dipendenze
```bash
npm install
```

### 3. Configurazione Database

Crea un file `.env` nella root del progetto:

```env
DB_USER=tuo_username
DB_PASSWORD=tua_password
DB_SERVER=localhost
DB_DATABASE=nome_database
```

### 4. Struttura Database

Assicurati che le seguenti tabelle esistano nel database:

**Tabella `anaubic` (Ubicazioni)**
```sql
CREATE TABLE anaubic (
    codditt VARCHAR(10),
    au_ubicaz VARCHAR(50) PRIMARY KEY,
    au_magaz VARCHAR(10),
    au_zona VARCHAR(20),
    au_scaff INT,
    au_posiz INT,
    au_piano INT,
    au_cella INT,
    au_tipo VARCHAR(10),
    au_percorso VARCHAR(50),
    au_indrot VARCHAR(20),
    au_volume DECIMAL(18,4),
    au_monopr BIT,
    au_barcode VARCHAR(50),
    au_bloccata BIT,
    au_descr VARCHAR(255),
    au_livello INT
);
```

**Tabella `egmovimentimag3d` (Movimenti)**
```sql
CREATE TABLE egmovimentimag3d (
    id INT IDENTITY(1,1) PRIMARY KEY,
    codditt VARCHAR(10),
    lp_codart VARCHAR(50),
    lp_magaz VARCHAR(10),
    ubicaz_partenza VARCHAR(50),
    ubicaz_destinazione VARCHAR(50),
    quantita DECIMAL(18,6),
    data_movimento DATETIME DEFAULT GETDATE(),
    utente VARCHAR(50),
    confermato BIT DEFAULT 0,
    data_conferma DATETIME,
    note VARCHAR(255)
);
```

### 5. Avvio Applicazione

**Modalità Development** (avvia sia frontend che backend):
```bash
npm run dev
```

**Avvio separato**:
```bash
# Backend (porta 4000)
npm run server

# Frontend (porta 3000)
npm run client
```

**Build per produzione**:
```bash
npm run build
npm run preview
```

## 📱 Utilizzo

> 📖 **Per una guida completa e dettagliata, consulta il [Manuale Utente](MANUALE_UTENTE.md)**

### Accesso all'Applicazione
Apri il browser su: `http://localhost:3000`

### Navigazione 3D
- **Rotazione**: Click sinistro + drag
- **Pan**: Click destro + drag
- **Zoom**: Scroll mouse / tasti `+` `-`
- **Doppio click**: Cambia punto di orbita
- **Reset vista**: Pulsante "Reset" o tasto `R`
- **Modalità FPS**: Tasto `F` o toggle nella sidebar
  - WASD per muoversi
  - Mouse per guardare
  - Space/Shift per salire/scendere
  - Ctrl per sprint

### Keyboard Shortcuts
- `+` / `-` : Zoom in/out
- `R` : Reset vista
- `F` : Toggle modalità FPS
- `1-5` : Filtra per livello/piano
- `0` : Mostra tutti i livelli

### Funzionalità Base

#### Visualizzazione Ubicazioni
1. Le ubicazioni vengono caricate automaticamente all'avvio
2. I colori indicano lo stato:
   - 🟢 **Verde**: Con giacenza
   - 🟠 **Arancione**: Movimento in arrivo pendente
   - 🟡 **Giallo/Ambra**: Movimento in uscita pendente
   - ⚪ **Grigio**: Vuota
   - 🟡 **Giallo**: Selezionata
   - 🔵 **Blu**: Hover

#### Ricerca Ubicazione
1. Usa la barra di ricerca nella sidebar
2. Digita codice ubicazione, codice articolo o **barcode**
3. Seleziona dall'elenco dropdown
4. La camera si focalizzerà automaticamente
5. Il pannello **"Dettagli Selezione"** si apre automaticamente

#### Filtri
- **Tutte**: Mostra tutte le ubicazioni
- **Piene**: Solo ubicazioni con giacenza
- **Vuote**: Solo ubicazioni senza giacenza
- **Filtro Piano**: Filtra per livello specifico (1-5) o tutti

#### Creare un Movimento (Metodo Rapido)
1. Seleziona un'ubicazione con giacenza (click)
2. Nel pannello **"Dettagli Selezione"** clicca **"Sposta Articolo"**
3. Compila il form inline:
   - **Quantità**: Pre-compilata con il totale disponibile
   - **Ubicazione destinazione**: Scrivi manualmente OPPURE
   - Clicca l'icona 🖱️ per **selezionare sulla mappa** con un click
4. Clicca **"Crea Movimento"**

### 🎯 Ottimizzazione Logistica

#### Visualizzare la Heatmap
1. Nella sidebar, sezione "Ottimizzazione Logistica"
2. Clicca "Mostra Heatmap"
3. Le ubicazioni si colorano in base alla frequenza di utilizzo
4. Usa la legenda colori per interpretare i dati

#### Analisi e Suggerimenti
1. Clicca "Analisi & Suggerimenti"
2. Si apre il pannello con 3 tab:

**Tab Suggerimenti**:
- Visualizza tutti i suggerimenti di ottimizzazione
- Badge mostra percentuale di miglioramento
- Espandi per vedere dettagli fattori
- Click "Visualizza sulla Mappa" per vedere l'ubicazione

**Tab Heatmap**:
- Statistiche aggregate (prelievi totali, media, max)
- Top 10 ubicazioni più utilizzate
- Click su una ubicazione per evidenziarla sulla mappa

**Tab Percorso Ottimale**:
- Visualizza percorso calcolato (se disponibile)
- Metriche: distanza, tempo stimato, fermate
- Ordine ottimale per picking
- Click su ubicazione per evidenziarla

#### Interpretare i Suggerimenti
- **+50% o più**: Miglioramento significativo, alta priorità
- **+30-49%**: Buon miglioramento, media priorità
- **+15-29%**: Miglioramento marginale, bassa priorità

## 🔌 API Endpoints

### Ubicazioni e Movimenti
```
GET  /api/warehouse-data           # Tutti i dati magazzino
GET  /api/movimenti                # Movimenti pendenti
POST /api/movimenti                # Crea nuovo movimento
PUT  /api/movimenti/:id/conferma   # Conferma movimento
DELETE /api/movimenti/:id          # Elimina movimento
```

### Ottimizzazione
```
GET  /api/optimization/heatmap              # Dati heatmap utilizzo
GET  /api/optimization/location-stats       # Statistiche ubicazioni
GET  /api/optimization/suggestions          # Suggerimenti ottimizzazione
POST /api/optimization/picking-path         # Calcola percorso ottimale
```

### Parametri Query

**Heatmap e Statistics**:
- `days` (default: 30) - Giorni di storico da analizzare

**Suggestions**:
- `days` (default: 30) - Giorni di storico
- `minFrequency` (default: 5) - Frequenza minima prelievi

## 📊 Algoritmi di Ottimizzazione

### Score Ubicazione
```
Score = (Frequenza × 0.5) + (Distanza × 0.3) + (Livello × 0.2)
```

### Nearest Neighbor per Picking
1. Parte dalla zona spedizione (0,0,0)
2. Seleziona l'ubicazione non visitata più vicina
3. Ripete fino a visitare tutte le ubicazioni
4. Applica ottimizzazione 2-opt per migliorare

### Distanza Euclidea 3D
```
d = √[(x₂-x₁)² + (y₂-y₁)² + (z₂-z₁)²]
```

## 🎨 Personalizzazione

### Modifica Zona Spedizione
In `utils/optimization.ts`:
```typescript
const DEFAULT_SETTINGS: OptimizationSettings = {
  shippingZoneLocation: { x: 0, y: 0, z: 0 }, // Modifica qui
  walkingSpeed: 80,      // metri/minuto
  pickTimePerItem: 30,   // secondi
};
```

### Modifica Colori Heatmap
In `utils/heatmapUtils.ts`, funzione `getHeatmapColor()`:
```typescript
// Personalizza la scala colori
if (normalizedIntensity < 0.2) {
  return interpolateColor('#TUO_COLORE_1', '#TUO_COLORE_2', ...);
}
```

### Modifica Pesi Algoritmo
In `utils/optimization.ts`, funzione `calculateLocationScore()`:
```typescript
return frequencyScore * 0.5 +  // Modifica peso frequenza
       distanceScore * 0.3 +   // Modifica peso distanza
       levelScore * 0.2;       // Modifica peso livello
```

## 🐛 Troubleshooting

### Il backend non si connette al database
```bash
# Verifica credenziali nel file .env
# Controlla che SQL Server sia in esecuzione
# Verifica firewall e porte
```

### Errore "Port already in use"
```bash
# Il server frontend cercherà automaticamente una porta libera
# Backend usa porta 4000 (modificabile in server/index.js)
```

### La heatmap non mostra dati
```bash
# Assicurati che ci siano movimenti confermati nel database
# Verifica tabella egmovimentimag3d con confermato = 1
```

### Performance lente con molte ubicazioni
```bash
# Considera di aumentare il filtro minFrequency
# Riduci il periodo di analisi (days)
# Ottimizza indici database su tabella anaubic e egmovimentimag3d
```

## 🔐 Sicurezza

- ✅ Validazione input lato server
- ✅ Parametrizzazione query SQL (prevenzione SQL injection)
- ✅ CORS configurato
- ✅ Variabili sensibili in .env
- ⚠️ **IMPORTANTE**: Non committare il file `.env` nel repository

## 📈 Performance

### Ottimizzazioni Implementate
- InstancedMesh per rendering ubicazioni (migliaia di oggetti)
- Memoizzazione componenti React
- Query SQL ottimizzate con CTE
- Caricamento lazy dei dati di ottimizzazione
- Debounce sulla ricerca

### Raccomandazioni Database
```sql
-- Indici consigliati per performance ottimali
CREATE INDEX idx_ubicaz ON anaubic(au_ubicaz);
CREATE INDEX idx_movimenti_ubicaz ON egmovimentimag3d(ubicaz_partenza, confermato, data_conferma);
CREATE INDEX idx_lotcpro_ubicaz ON lotcpro(lp_ubicaz, lp_codart, lp_esist);
```

## 🤝 Contribuire

1. Fork del progetto
2. Crea feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit modifiche (`git commit -m 'Add AmazingFeature'`)
4. Push al branch (`git push origin feature/AmazingFeature`)
5. Apri una Pull Request

## 📝 Changelog

### v1.1.0 (2024-12-17)
#### ✨ Nuove Funzionalità
- ✅ **Spostamento articoli inline** nel pannello "Dettagli Selezione"
- ✅ **Selezione destinazione visuale** con click sulla mappa 3D
- ✅ **Ricerca per barcode** oltre a ubicazione e articolo
- ✅ **Modalità FPS** (First Person) per navigazione immersiva
- ✅ **Filtro per piano/livello** con keyboard shortcuts (1-5, 0)
- ✅ **Keyboard shortcuts globali** (+/- zoom, R reset, F fps)
- ✅ **Etichette corridoi a pavimento** per orientamento
- ✅ **Doppio click** per cambiare punto di orbita camera

#### 🎨 Miglioramenti UI/UX
- ✅ **Sidebar riorganizzata** con sezioni collassabili
- ✅ **Pannello Dettagli Selezione** scrollabile con altezza dinamica
- ✅ Apertura automatica dettagli su selezione da ricerca
- ✅ Badge e contatori nelle sezioni sidebar
- ✅ Indicatore visivo modalità selezione destinazione

#### 🔧 Miglioramenti Tecnici
- ✅ Componente `CollapsibleSection` riutilizzabile
- ✅ Animazioni smooth per navigazione camera
- ✅ Sprint mode (Ctrl) in modalità FPS
- ✅ Gestione dinamica altezza tooltip

### v1.0.0 (2024-12-16)
#### ✨ Nuove Funzionalità
- ✅ Sistema di ottimizzazione logistica completo
- ✅ Heatmap 3D utilizzo ubicazioni
- ✅ Suggerimenti intelligenti posizionamento
- ✅ Calcolo percorsi ottimali picking
- ✅ Algoritmo Nearest Neighbor con 2-opt
- ✅ Pannello analisi con statistiche aggregate
- ✅ 4 nuovi API endpoints per ottimizzazione

#### 🎨 Miglioramenti UI/UX
- ✅ Sezione dedicata ottimizzazione in sidebar
- ✅ Badge notifiche suggerimenti
- ✅ Toggle visualizzazione heatmap
- ✅ Pannello modale con 3 tab analisi
- ✅ Scala colori graduale per intensità

#### 🔧 Miglioramenti Tecnici
- ✅ Nuovi tipi TypeScript per ottimizzazione
- ✅ Utility functions per calcoli complessi
- ✅ Query SQL ottimizzate con CTE
- ✅ Componenti 3D riutilizzabili

## 📄 Licenza

Questo progetto è distribuito sotto licenza MIT.

## 👥 Autori

- **Sviluppatore** - *Sviluppo iniziale e ottimizzazione*

## 🙏 Ringraziamenti

- Three.js community
- React Three Fiber team
- Microsoft SQL Server team
- Tutti i contributori

## 📞 Supporto

Per supporto tecnico e domande, contattare il team di sviluppo.

---

**Made with ❤️ and React Three Fiber**
