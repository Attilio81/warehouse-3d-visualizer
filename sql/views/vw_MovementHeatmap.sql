IF OBJECT_ID('dbo.vw_MovementHeatmap', 'V') IS NOT NULL
    DROP VIEW dbo.vw_MovementHeatmap;
GO

CREATE VIEW dbo.vw_MovementHeatmap AS
WITH MovimentStats AS (
    SELECT
        mm_ubicaz as ubicazione,
        COUNT(*) as total_movements,
        SUM(CASE WHEN tabcaum.tb_esist = 1 THEN 1 ELSE 0 END) as entrate,
        SUM(CASE WHEN tabcaum.tb_esist != 1 THEN 1 ELSE 0 END) as uscite,
        SUM(ABS(mm_quant)) as quantita_totale
    FROM movmag
    INNER JOIN tabcaum ON movmag.mm_causale = tabcaum.tb_codcaum
    -- Hardcoded 365 days window for the view. 
    -- For dynamic periods, modify the view or use the raw tables.
    WHERE mm_ultagg >= DATEADD(day, -365, GETDATE())
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
  AND anaubic.au_scaff > 0;
GO
