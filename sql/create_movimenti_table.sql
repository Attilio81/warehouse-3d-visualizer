-- Tabella per tracciare movimenti di magazzino 3D pendenti
-- Questi movimenti devono essere confermati da un'altra applicazione
-- prima di aggiornare effettivamente lotcpro

CREATE TABLE egmovimentimag3d (
    id INT IDENTITY(1,1) PRIMARY KEY,
    codditt VARCHAR(10) NOT NULL,
    lp_codart VARCHAR(50) NOT NULL,           -- Codice articolo da spostare
    lp_magaz VARCHAR(10) NOT NULL,            -- Magazzino
    ubicaz_partenza VARCHAR(50) NOT NULL,     -- Ubicazione di partenza
    ubicaz_destinazione VARCHAR(50) NOT NULL, -- Ubicazione di destinazione
    quantita DECIMAL(18,6) NOT NULL,          -- Quantità da spostare
    data_movimento DATETIME DEFAULT GETDATE() NOT NULL,
    utente VARCHAR(50) NULL,                  -- Chi ha creato il movimento
    confermato BIT DEFAULT 0 NOT NULL,        -- 0=pendente, 1=confermato
    data_conferma DATETIME NULL,              -- Quando è stato confermato
    note VARCHAR(255) NULL,                   -- Note opzionali
    CONSTRAINT CHK_quantita_positiva CHECK (quantita > 0),
    CONSTRAINT CHK_ubicazioni_diverse CHECK (ubicaz_partenza <> ubicaz_destinazione)
);

-- Indici per performance
CREATE INDEX IDX_egmovimentimag3d_confermato ON egmovimentimag3d(confermato);
CREATE INDEX IDX_egmovimentimag3d_ubicaz_partenza ON egmovimentimag3d(ubicaz_partenza) WHERE confermato = 0;
CREATE INDEX IDX_egmovimentimag3d_ubicaz_destinazione ON egmovimentimag3d(ubicaz_destinazione) WHERE confermato = 0;
CREATE INDEX IDX_egmovimentimag3d_codditt_articolo ON egmovimentimag3d(codditt, lp_codart);

-- Commenti
EXEC sp_addextendedproperty
    @name = N'MS_Description',
    @value = N'Tabella per movimenti di magazzino 3D pendenti. I movimenti vengono confermati da altra applicazione prima di aggiornare lotcpro.',
    @level0type = N'SCHEMA', @level0name = N'dbo',
    @level1type = N'TABLE',  @level1name = N'egmovimentimag3d';
