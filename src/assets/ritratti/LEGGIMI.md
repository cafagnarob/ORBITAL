# Ritratti dei candidati

Metti qui le immagini dei personaggi, una per candidato, chiamata come il
suo **id** (vedi `src/content/candidati.ts`):

    mara.png   adrian.png   nadia.png   sarah.png   marco.png
    giulia.png davide.png   irene.png   luca.png    elena.png

Formati accettati: `.png`, `.jpg`, `.jpeg`, `.webp`.
Proporzioni consigliate: **3:4** (es. 600×800), soggetto centrato.

Non serve toccare il codice: `src/ui/preparazione/ritratti.ts` trova i file
da solo (import.meta.glob di Vite). Se un'immagine manca, la scheda mostra
il segnaposto. Le immagini a colori vengono "tinte" di verde fosforo dal CSS
(filtro), quindi stanno bene anche se non sono già verdi.
