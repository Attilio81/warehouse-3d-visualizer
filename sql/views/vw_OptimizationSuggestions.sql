IF OBJECT_ID('dbo.vw_OptimizationSuggestions', 'V') IS NOT NULL
    DROP VIEW dbo.vw_OptimizationSuggestions;
GO

CREATE VIEW dbo.vw_OptimizationSuggestions AS
WITH MovimentStats AS (
    SELECT
        mm_ubicaz as ubicazione,
        mm_codart as codart,
        COUNT(*) as frequency,
        SUM(CASE WHEN tabcaum.tb_esist != 1 THEN 1 ELSE 0 END) as uscite,
        MAX(mm_ultagg) as last_movement
    FROM movmag
    INNER JOIN tabcaum ON movmag.mm_causale = tabcaum.tb_codcaum
    -- Hardcoded 365 days window and min frequency 3
    WHERE mm_ultagg >= DATEADD(day, -365, GETDATE())
      AND mm_ubicaz IS NOT NULL
      AND LEN(LTRIM(RTRIM(mm_ubicaz))) > 0
    GROUP BY mm_ubicaz, mm_codart
    HAVING SUM(CASE WHEN tabcaum.tb_esist != 1 THEN 1 ELSE 0 END) >= 3
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
FROM CurrentLocations;
GO
