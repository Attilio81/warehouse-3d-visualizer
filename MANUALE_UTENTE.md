# 📖 Manuale Utente - Warehouse 3D Visualizer

## Indice
1. [Introduzione](#introduzione)
2. [Primi Passi](#primi-passi)
3. [Interfaccia Utente](#interfaccia-utente)
4. [Navigazione 3D](#navigazione-3d)
5. [Funzionalità Principali](#funzionalità-principali)
6. [Gestione Movimenti](#gestione-movimenti)
7. [Ottimizzazione Magazzino](#ottimizzazione-magazzino)
8. [Ricerca e Filtri](#ricerca-e-filtri)
9. [FAQ](#faq)
10. [Risoluzione Problemi](#risoluzione-problemi)

---

## 📌 Introduzione

Warehouse 3D Visualizer è un'applicazione web professionale per la gestione visuale e l'ottimizzazione di magazzini. Permette di:

- Visualizzare il magazzino in un ambiente 3D interattivo
- Gestire movimenti di merce tra ubicazioni
- Analizzare l'utilizzo del magazzino con heatmap
- Ottimizzare i percorsi di picking
- Monitorare stock e movimenti in tempo reale

### Requisiti di Sistema

- **Browser**: Chrome 90+, Firefox 88+, Edge 90+, Safari 14+
- **Connessione**: Rete locale con accesso al database SQL Server
- **Risoluzione**: Minimo 1366x768 (consigliato 1920x1080 o superiore)

---

## 🚀 Primi Passi

### Avvio dell'Applicazione

1. **Avviare il Server**
   - L'amministratore di sistema deve aver avviato il server backend
   - Verificare che sia raggiungibile su `http://localhost:4000`

2. **Aprire l'Applicazione**
   - Aprire il browser e navigare su `http://localhost:5173`
   - L'applicazione carica automaticamente i dati dal database

3. **Attendere il Caricamento**
   - Apparirà il messaggio "Caricamento dati..."
   - Una volta completato, vedrete il magazzino in 3D

### Primo Utilizzo

Al primo accesso vedrete:
- Una vista 3D del magazzino con tutte le ubicazioni
- Pannello laterale destro con statistiche generali
- Barra di ricerca in alto
- Pannelli funzionali nella parte inferiore

---

## 🖥️ Interfaccia Utente

### Layout Generale

```
┌─────────────────────────────────────────────────────────┐
│  [🔍 Ricerca]                          [≡ Filtri]       │
├─────────────────────────────────────────────────────────┤
│                                              │           │
│                                              │ Statistiche│
│          VISTA 3D MAGAZZINO                  │           │
│                                              │ - Ubicazioni│
│                                              │ - Piene   │
│                                              │ - Vuote   │
│                                              │           │
├──────────────────────────────────────────────┤           │
│ [📦 Movimenti] [📊 Ottimizzazione]           │           │
└─────────────────────────────────────────────────────────┘
```

### Elementi dell'Interfaccia

#### 1. Barra Superiore
- **Campo Ricerca**: Cerca ubicazioni per codice
- **Filtri**: Filtra visualizzazione (Tutte/Piene/Vuote)
- **Pulsante Ricarica**: Aggiorna dati dal database

#### 2. Vista 3D (Centrale)
- Visualizzazione tridimensionale del magazzino
- Scaffalature rappresentate come cubi colorati
- Pavimento grigio con griglia di riferimento

#### 3. Pannello Statistiche (Destra)
- **Ubicazioni Totali**: Numero totale di posizioni
- **Ubicazioni Piene**: Posizioni con merce
- **Ubicazioni Vuote**: Posizioni disponibili
- **Scaffalature**: Numero totale corridoi
- **Posizioni**: Numero posizioni per corridoio
- **Livelli**: Numero piani per scaffalatura

#### 4. Pannelli Funzionali (Basso)
- **Movimenti**: Gestione movimenti merce
- **Ottimizzazione**: Analisi e suggerimenti

---

## 🎮 Navigazione 3D

### Controlli Mouse

#### Rotazione della Vista
- **Azione**: Click sinistro + trascinamento
- **Effetto**: Ruota la camera intorno al magazzino
- **Uso**: Visualizzare il magazzino da diverse angolazioni

#### Zoom
- **Azione**: Rotellina del mouse
- **Effetto**: 
  - Rotellina su = zoom in (avvicinamento)
  - Rotellina giù = zoom out (allontanamento)
- **Uso**: Focalizzare su aree specifiche o vista d'insieme

#### Pan (Spostamento laterale)
- **Azione**: Click destro + trascinamento
- **Effetto**: Sposta la vista lateralmente
- **Uso**: Centrarsi su diverse aree del magazzino

### Interazione con Ubicazioni

#### Selezione Ubicazione
1. Posizionare il cursore sopra un'ubicazione
2. L'ubicazione si illumina in giallo
3. Click sinistro per selezionarla
4. Appare un tooltip con informazioni dettagliate

#### Informazioni Visualizzate
- **Codice Ubicazione**: es. "A01-02-03"
- **Codice Prodotto**: se presente
- **Descrizione Prodotto**: nome articolo
- **Quantità**: pezzi presenti
- **Movimenti Pendenti**: 
  - In arrivo (↓)
  - In uscita (↑)

### Legenda Colori

| Colore | Significato |
|--------|-------------|
| 🟦 **Blu Chiaro** | Ubicazione vuota |
| 🟩 **Verde** | Ubicazione con merce |
| 🟨 **Giallo** | Ubicazione selezionata/hover |
| 🟧 **Arancione** | Movimenti in arrivo |
| 🟥 **Rosso scuro** | Movimenti in uscita |
| 🟪 **Viola** | Movimenti sia in arrivo che uscita |

---

## ⚙️ Funzionalità Principali

### 1. Visualizzazione Stock

#### Vedere lo Stock di un'Ubicazione
1. Navigare nella vista 3D
2. Click su un'ubicazione verde (piena)
3. Leggere le informazioni nel tooltip:
   - Codice articolo
   - Descrizione prodotto
   - Quantità disponibile

#### Visualizzare solo Ubicazioni Piene
1. Click sul menu **Filtri** in alto a destra
2. Selezionare **"Solo Piene"**
3. Le ubicazioni vuote scompaiono dalla vista

#### Visualizzare solo Ubicazioni Vuote
1. Click sul menu **Filtri**
2. Selezionare **"Solo Vuote"**
3. Utile per trovare spazio disponibile

### 2. Ricerca Ubicazioni

#### Ricerca per Codice Ubicazione
1. Click sulla barra di ricerca in alto
2. Digitare il codice (es. "A01-02-03" o solo "A01")
3. Le ubicazioni corrispondenti vengono evidenziate
4. La camera si focalizza automaticamente

#### Ricerca per Codice Prodotto
1. Click sulla barra di ricerca
2. Digitare il codice prodotto (es. "PROD123")
3. Vengono evidenziate tutte le ubicazioni contenenti quel prodotto

#### Cancellare la Ricerca
- Click sul pulsante **✕** nella barra di ricerca
- Oppure cancellare manualmente il testo
- La vista torna normale

---

## 📦 Gestione Movimenti

### Aprire il Pannello Movimenti

1. Click sul pulsante **"📦 Movimenti"** in basso a sinistra
2. Si apre il pannello laterale con la lista movimenti pendenti

### Visualizzare Movimenti Pendenti

Nel pannello vengono mostrati tutti i movimenti non ancora confermati:

```
┌─────────────────────────────────────┐
│ Movimenti Pendenti                  │
├─────────────────────────────────────┤
│ PROD123                             │
│ A01-02-03 → B02-04-01               │
│ Quantità: 10                        │
│ [✓ Conferma] [✕ Elimina]           │
├─────────────────────────────────────┤
│ ...                                 │
└─────────────────────────────────────┘
```

### Creare un Nuovo Movimento

1. Click sul pulsante **"+ Nuovo Movimento"**
2. Si apre il dialog di creazione
3. Compilare i campi:

#### Campo Azienda (Codditt)
- Inserire codice azienda (es. "001")
- Campo obbligatorio

#### Campo Codice Prodotto
- Inserire il codice articolo da movimentare
- Campo obbligatorio
- Deve esistere nel database

#### Campo Magazzino
- Inserire codice magazzino (es. "01")
- Campo obbligatorio

#### Campo Ubicazione Partenza
- Inserire codice ubicazione di origine
- Formato: "A01-02-03" (Scaffalatura-Posizione-Livello)
- Deve esistere ed essere piena

#### Campo Ubicazione Destinazione
- Inserire codice ubicazione di arrivo
- Formato: "B02-04-01"
- Deve esistere ed essere vuota o compatibile

#### Campo Quantità
- Inserire numero pezzi da spostare
- Deve essere maggiore di 0
- Non può superare la disponibilità

4. Click su **"Salva Movimento"**
5. Il movimento viene creato in stato "pendente"

### Confermare un Movimento

1. Individuare il movimento nella lista
2. Click sul pulsante **"✓ Conferma"**
3. Il sistema:
   - Aggiorna lo stock nelle ubicazioni
   - Rimuove il movimento dalla lista pendenti
   - Ricarica la vista 3D

### Annullare un Movimento

1. Individuare il movimento nella lista
2. Click sul pulsante **"✕ Elimina"**
3. Confermare l'operazione
4. Il movimento viene rimosso senza effettuare spostamenti

### Stati dei Movimenti

| Stato | Descrizione | Colore |
|-------|-------------|--------|
| **Pendente** | Movimento creato ma non eseguito | Arancione |
| **Confermato** | Movimento completato | Verde |
| **Annullato** | Movimento eliminato | - |

---

## 📊 Ottimizzazione Magazzino

### Aprire il Pannello Ottimizzazione

1. Click sul pulsante **"📊 Ottimizzazione"** in basso
2. Si apre il pannello con varie funzionalità di analisi

### Funzionalità di Ottimizzazione

#### 1. Heatmap Utilizzo

La heatmap mostra visivamente quali ubicazioni sono più utilizzate.

**Attivare la Heatmap:**
1. Nel pannello Ottimizzazione
2. Click su **"🔥 Mostra Heatmap"**
3. Le ubicazioni cambiano colore in base alla frequenza d'uso:
   - 🔵 **Blu**: Poco utilizzate
   - 🟢 **Verde**: Utilizzo medio
   - 🟡 **Giallo**: Utilizzo frequente
   - 🟠 **Arancione**: Utilizzo molto frequente
   - 🔴 **Rosso**: Utilizzo intensivo

**Interpretare la Heatmap:**
- Zone rosse → prodotti ad alta rotazione
- Zone blu → prodotti stoccaggio lungo termine
- Considera di spostare prodotti ad alta rotazione vicino alle zone di prelievo

**Disattivare la Heatmap:**
- Click su **"Nascondi Heatmap"**
- I colori tornano normali

#### 2. Suggerimenti Ottimizzazione

Il sistema analizza il magazzino e suggerisce miglioramenti.

**Generare Suggerimenti:**
1. Click su **"💡 Genera Suggerimenti"**
2. Il sistema analizza:
   - Frequenza utilizzo ubicazioni
   - Distanza da zone di prelievo
   - Accessibilità ubicazioni
3. Vengono mostrati suggerimenti prioritizzati

**Esempio Suggerimento:**
```
┌─────────────────────────────────────┐
│ PRIORITÀ: ALTA                      │
│ Prodotto: PROD123                   │
│ Ubicazione attuale: A05-10-03       │
│ Ubicazione suggerita: A01-01-01     │
│ Motivo: Alta rotazione, troppo      │
│         lontano dalla zona picking  │
│ Risparmio stimato: 30%              │
└─────────────────────────────────────┘
```

**Applicare un Suggerimento:**
1. Leggere i dettagli del suggerimento
2. Valutare la fattibilità
3. Creare manualmente il movimento nella sezione "Movimenti"

#### 3. Percorso Picking Ottimale

Calcola il percorso migliore per raccogliere più prodotti.

**Calcolare un Percorso:**
1. Nel pannello Ottimizzazione
2. Sezione **"Percorso Picking"**
3. Inserire elenco ubicazioni da visitare:
   ```
   A01-01-01
   B02-03-02
   C01-05-03
   ```
4. Click su **"🎯 Calcola Percorso"**
5. Il sistema mostra:
   - Ordine ottimale di visita
   - Distanza totale stimata
   - Tempo stimato

**Visualizzare il Percorso:**
1. Dopo il calcolo, click su **"Mostra Percorso"**
2. Nella vista 3D appare:
   - Linee colorate che collegano le ubicazioni
   - Numeri che indicano l'ordine
   - Frecce direzionali

**Vantaggi:**
- Riduce tempo di picking
- Minimizza spostamenti
- Aumenta efficienza operatori

---

## 🔍 Ricerca e Filtri

### Ricerca Avanzata

#### Ricerca Multipla
- Digitare più codici separati da virgola:
  ```
  A01-01-01, B02-03-02, C01-05-03
  ```
- Tutte le ubicazioni vengono evidenziate

#### Ricerca per Pattern
- Usare prefissi per cercare gruppi:
  - `A01` → Tutte le ubicazioni scaffalatura A01
  - `A01-02` → Tutte le ubicazioni posizione 02 di A01
  - `A01-*-03` → Tutti i livelli 03 di A01

### Filtri Combinati

#### Filtro + Ricerca
1. Applicare un filtro (es. "Solo Piene")
2. Eseguire una ricerca
3. Vengono mostrate solo le ubicazioni piene corrispondenti

#### Reset Filtri
- Click su **"Tutte"** nel menu filtri
- Oppure ricaricare la pagina

---

## ❓ FAQ (Domande Frequenti)

### Generali

**Q: L'applicazione non carica i dati. Cosa fare?**
A: Verificare che:
1. Il server backend sia avviato
2. La connessione al database SQL Server sia attiva
3. Non ci siano errori nella console del browser (F12)

**Q: Posso utilizzare l'app su tablet o smartphone?**
A: L'app è ottimizzata per desktop. Su mobile la navigazione 3D può essere limitata.

**Q: I dati sono in tempo reale?**
A: Sì, l'applicazione interroga il database a ogni caricamento. Click su "Ricarica" per aggiornare.

### Navigazione 3D

**Q: Come torno alla vista iniziale?**
A: Ricaricare la pagina o usare il pulsante "Reset Camera" (se implementato).

**Q: Le ubicazioni appaiono sovrapposte. Normale?**
A: No, verificare che i dati nel database abbiano coordinate corrette (scaff, posiz, piano).

**Q: Non riesco a vedere alcune ubicazioni.**
A: Usare lo zoom out (rotellina mouse) e pan (click destro) per navigare.

### Movimenti

**Q: Posso annullare un movimento confermato?**
A: No, una volta confermato il movimento modifica lo stock. Creare un movimento inverso se necessario.

**Q: Perché non posso creare un movimento?**
A: Verificare che:
- L'ubicazione di partenza abbia stock sufficiente
- L'ubicazione di destinazione esista
- Tutti i campi obbligatori siano compilati

**Q: I movimenti pendenti influenzano lo stock visualizzato?**
A: Sì, vengono mostrati con indicatori (frecce) ma lo stock effettivo cambia solo dopo conferma.

### Ottimizzazione

**Q: Ogni quanto aggiornare la heatmap?**
A: Consigliato settimanalmente o dopo variazioni significative del magazzino.

**Q: I suggerimenti sono automatici?**
A: No, sono raccomandazioni. L'operatore decide se e quando applicarli.

**Q: Il percorso picking considera ostacoli fisici?**
A: Il calcolo è basato su distanza euclidea. Considerare manualmente corridoi e ostacoli.

---

## 🔧 Risoluzione Problemi

### Problemi Comuni

#### 1. Schermata Bianca al Caricamento

**Causa**: Errore JavaScript o caricamento fallito

**Soluzione**:
1. Aprire la Console Browser (F12)
2. Verificare errori nella tab "Console"
3. Ricaricare la pagina (Ctrl+R o Cmd+R)
4. Svuotare cache browser (Ctrl+Shift+Delete)

#### 2. "Errore Caricamento Dati"

**Causa**: Backend non raggiungibile o errore database

**Soluzione**:
1. Verificare che il server sia avviato (`http://localhost:4000/api/warehouse-data`)
2. Controllare credenziali database nel file `.env`
3. Verificare connessione di rete
4. Consultare log del server backend

#### 3. Performance Lenta

**Causa**: Troppi elementi 3D o hardware limitato

**Soluzione**:
1. Usare filtri per ridurre elementi visualizzati
2. Chiudere altre applicazioni pesanti
3. Aggiornare driver scheda grafica
4. Usare un browser più recente

#### 4. Ubicazioni Mancanti

**Causa**: Dati incompleti nel database

**Soluzione**:
1. Verificare query SQL in `server/index.js`
2. Controllare tabella `anaubic` nel database
3. Verificare campo `au_ubicaz` non NULL

#### 5. Movimento Non Viene Salvato

**Causa**: Validazione fallita o errore database

**Soluzione**:
1. Verificare tutti i campi obbligatori
2. Controllare formato codici ubicazione
3. Verificare permessi database
4. Controllare log server per errori SQL

### Errori Specifici

#### "Cannot read property of undefined"

- **Causa**: Dati mancanti dal database
- **Fix**: Verificare che tutte le tabelle richieste esistano e siano popolate

#### "Failed to fetch"

- **Causa**: Problema CORS o server offline
- **Fix**: Verificare configurazione CORS in `server/index.js`

#### "Location already has pending movement"

- **Causa**: Tentativo di creare movimento duplicato
- **Fix**: Confermare o eliminare movimento pendente esistente

---

## 📚 Glossario

| Termine | Definizione |
|---------|-------------|
| **Ubicazione** | Posizione specifica nel magazzino (scaffalatura-posizione-livello) |
| **Scaffalatura** | Corridoio o fila di scaffali (es. A01, B02) |
| **Posizione** | Posto specifico lungo la scaffalatura |
| **Livello** | Piano verticale dello scaffale |
| **Movimento Pendente** | Trasferimento merce pianificato ma non eseguito |
| **Heatmap** | Mappa di calore che mostra frequenza d'uso |
| **Picking** | Processo di raccolta prodotti da ubicazioni |
| **Stock** | Quantità di merce presente |
| **Ubicazione Piena** | Posizione contenente merce |
| **Ubicazione Vuota** | Posizione disponibile senza merce |

---

## 📞 Supporto

### Ottenere Aiuto

1. **Consultare questo manuale** - Maggior parte delle risposte sono qui
2. **Verificare FAQ** - Problemi comuni risolti
3. **Contattare amministratore di sistema** - Per problemi tecnici
4. **Aprire Issue su GitHub** - Per bug o richieste funzionalità

### Informazioni da Fornire per Supporto

Quando si richiede assistenza, includere:
- **Browser e versione** (es. Chrome 120)
- **Sistema operativo** (Windows, macOS, Linux)
- **Descrizione problema** dettagliata
- **Passi per riprodurre** l'errore
- **Screenshot** se possibile
- **Messaggi di errore** dalla console browser

---

## 🎓 Best Practices

### Utilizzo Efficiente

1. **Aggiornare regolarmente**: Click "Ricarica" ogni ora per dati freschi
2. **Usare filtri**: Riduce carico visuale e migliora performance
3. **Pianificare movimenti**: Creare movimenti in batch per efficienza
4. **Analizzare heatmap**: Settimanalmente per ottimizzare layout
5. **Backup**: L'amministratore deve effettuare backup database regolari

### Organizzazione Magazzino

1. **Prodotti alta rotazione**: Ubicare vicino zone picking (A01, B01)
2. **Prodotti bassa rotazione**: Ubicare in zone meno accessibili
3. **Prodotti pesanti**: Livelli bassi (01, 02)
4. **Prodotti leggeri**: Livelli alti (03, 04, 05)
5. **Prodotti simili**: Raggruppare per facilitare picking

### Sicurezza

1. **Non modificare dati critici** senza autorizzazione
2. **Verificare sempre** prima di confermare movimenti
3. **Comunicare** grandi riorganizzazioni al team
4. **Documentare** cambiamenti significativi

---

## 📄 Note sulla Versione

**Versione**: 1.0.0  
**Ultimo aggiornamento**: Dicembre 2024  
**Compatibilità**: Node.js 18+, React 19, SQL Server 2016+

---

## 🎯 Prossimi Passi

Dopo aver padroneggiato le funzioni base:

1. ✅ Familiarizzare con navigazione 3D
2. ✅ Creare e gestire movimenti
3. ✅ Analizzare heatmap settimanalmente
4. ✅ Implementare suggerimenti ottimizzazione
5. ✅ Ottimizzare percorsi picking quotidianamente

---

**Buon lavoro con Warehouse 3D Visualizer!** 🚀📦
