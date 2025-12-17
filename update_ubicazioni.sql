-- Script SQL per parsare il codice ubicazione e popolare i campi au_scaff, au_posiz, au_piano
-- Formato del codice ubicazione: "XX YY ZZ" dove XX=scaffale, YY=posizione, ZZ=piano

-- Backup della tabella (opzionale ma consigliato)
-- SELECT * INTO anaubic_backup FROM anaubic;

-- Update per popolare i campi parsando au_ubicaz
UPDATE anaubic
SET
    au_scaff = LTRIM(RTRIM(SUBSTRING(au_ubicaz, 1, CHARINDEX(' ', au_ubicaz) - 1))),
    au_posiz = LTRIM(RTRIM(SUBSTRING(
        au_ubicaz,
        CHARINDEX(' ', au_ubicaz) + 1,
        CHARINDEX(' ', au_ubicaz, CHARINDEX(' ', au_ubicaz) + 1) - CHARINDEX(' ', au_ubicaz) - 1
    ))),
    au_piano = LTRIM(RTRIM(SUBSTRING(
        au_ubicaz,
        CHARINDEX(' ', au_ubicaz, CHARINDEX(' ', au_ubicaz) + 1) + 1,
        LEN(au_ubicaz)
    )))
WHERE
    au_ubicaz IS NOT NULL
    AND LEN(LTRIM(RTRIM(au_ubicaz))) > 0
    AND au_ubicaz LIKE '% % %';  -- Solo record con formato "XX YY ZZ"

-- Verifica il risultato
SELECT TOP 20
    au_ubicaz,
    au_scaff,
    au_posiz,
    au_piano,
    lp_codart,
    ar_descr
FROM anaubic
INNER JOIN lotcpro ON anaubic.codditt = lotcpro.codditt
    AND anaubic.au_ubicaz = lotcpro.lp_ubicaz
    AND anaubic.au_magaz = lotcpro.lp_magaz
INNER JOIN artico ON lotcpro.codditt = artico.codditt
    AND lotcpro.lp_codart = artico.ar_codart
WHERE lotcpro.lp_esist > 0
ORDER BY au_ubicaz;
