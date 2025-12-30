IF OBJECT_ID('dbo.vw_WarehouseLocations', 'V') IS NOT NULL
    DROP VIEW dbo.vw_WarehouseLocations;
GO

CREATE VIEW dbo.vw_WarehouseLocations AS
SELECT
    anaubic.codditt, 
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
    
    -- Main Article Data (for quick display/backward compatibility)
    ISNULL(main_stock.lp_codart, '') AS lp_codart,
    ISNULL(main_stock.lp_esist, 0) AS lp_esist,
    ISNULL(main_stock.ar_descr, '') AS ar_descr,
    ISNULL(main_stock.bc_code, '') AS barcode,
    ISNULL(main_stock.bc_unmis, '') AS barcode_unmis,
    ISNULL(main_stock.bc_quant, 0) AS barcode_quant,

    -- All Articles JSON (for detailed view)
    (
        SELECT
            l.lp_codart AS productCode,
            l.lp_esist AS quantity,
            ISNULL(a.ar_descr, '') AS description,
            ISNULL(bc_top.bc_code, '') AS barcode,
            ISNULL(bc_top.bc_unmis, '') AS barcodeUnmis
        FROM lotcpro l
        LEFT JOIN artico a ON l.codditt = a.codditt AND l.lp_codart = a.ar_codart
        OUTER APPLY (
            SELECT TOP 1 bc.bc_code, bc.bc_unmis
            FROM barcode bc
            WHERE bc.codditt = l.codditt AND bc.bc_codart = l.lp_codart
        ) bc_top
        WHERE l.codditt = anaubic.codditt
            AND l.lp_ubicaz = anaubic.au_ubicaz
            AND l.lp_magaz = anaubic.au_magaz
            AND l.lp_esist > 0
        FOR JSON PATH
    ) AS ArticlesJSON,

    -- Pending Movements
    ISNULL(mov_in.quantita_in, 0) AS mov_in,
    ISNULL(mov_out.quantita_out, 0) AS mov_out

FROM anaubic

-- Join for Main Article (Highest Stock)
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
) main_stock

-- Pending Inbound Movements
LEFT JOIN (
    SELECT ubicaz_destinazione, SUM(quantita) as quantita_in
    FROM egmovimentimag3d
    WHERE confermato = 0
    GROUP BY ubicaz_destinazione
) mov_in ON anaubic.au_ubicaz = mov_in.ubicaz_destinazione

-- Pending Outbound Movements
LEFT JOIN (
    SELECT ubicaz_partenza, SUM(quantita) as quantita_out
    FROM egmovimentimag3d
    WHERE confermato = 0
    GROUP BY ubicaz_partenza
) mov_out ON anaubic.au_ubicaz = mov_out.ubicaz_partenza

WHERE
    anaubic.au_ubicaz IS NOT NULL
    AND LEN(LTRIM(RTRIM(anaubic.au_ubicaz))) > 0;
GO
