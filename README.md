# Handleliste Tønsberg

Statisk handleliste-app. Varedata er hardkodet fra regnearket; det eneste som
lagres er kolonnen **Kjøp**, i `localStorage` på telefonen.

## Kom i gang

```bash
npm install
npm run dev
```

Åpne **<http://localhost:4000/handleliste/>**. Passord: `Tønsberg!`

Adressen må ha `/handleliste/` med — appen kjører under den stien, både lokalt
og på GitHub Pages. Under utvikling sender rota deg dit automatisk, men Next
skriver ut den nakne adressen i terminalen, så bruk lenka over.

## Kommandoer

| Kommando | Hva den gjør |
|---|---|
| `npm run dev` | Utviklingsserver på port 4000 |
| `npm test` | Kjører testene |
| `npm run build` | Statisk eksport til `out/` |
| `npm run importer` | Leser regnearket på nytt til `src/data/rader.ts` |
| `npm run ikoner` | Genererer PWA-ikonene |

## Oppdatere varelista

1. Endre arket **«Ny»** i `~/Downloads/Handleliste Tønsberg.xlsx`.
2. `npm run importer`
3. `npm test` — sjekker at antallet stemmer og at ingen id-er kolliderer.
   Endret du antall varer, må tallene i `src/data/handleliste.test.ts`
   oppdateres tilsvarende.
4. Commit `src/data/rader.ts`.

Vare-id-ene er utledet av kategori + vare + merke. Endrer du et varenavn eller
et merke, får varen ny id og mister den lagrede Kjøp-verdien sin. Det er en
akseptert kostnad — alternativet, id-er basert på radnummer, ville flyttet
verdier over på feil varer uten å si fra.

## Utrulling

Push til `main`. GitHub Actions bygger og publiserer til GitHub Pages.

Slå på Pages under **Settings → Pages → Source: GitHub Actions** første gang.

Ligger repoet på et annet navn enn `handleliste`, endre `BASE_PATH` i
`src/lib/config.ts`. Det er eneste stedet navnet står.

## Installere på telefonen

Åpne siden i Chrome på Android og velg **Legg til på startskjermen**. Appen
fungerer offline etter første besøk.

## Om passordet

Passordet er **skjuling, ikke sikkerhet**. Det ligger i JavaScript-bundelen og
kan leses av hvem som helst med utviklerverktøy. Det holder lista unna
tilfeldige forbipasserende — ikke noe mer. Legg ikke noe hemmelig i denne appen.
