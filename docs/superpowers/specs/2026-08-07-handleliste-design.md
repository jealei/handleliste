# Handleliste Tønsberg — design

**Dato:** 2026-08-07
**Status:** Godkjent

## Formål

Gjøre regnearket `Handleliste Tønsberg.xlsx` (arket «Ny») om til en statisk web-app som kan
installeres som app på en Samsung Galaxy Z Fold 6. Alle varedata er hardkodet. Det eneste
brukeren endrer er kolonnen **Kjøp**, som lagres i `localStorage`.

Ikke-mål (bevisst utelatt):

- Ingen database, ingen backend, ingen synkronisering mellom enheter.
- Ingen mulighet til å legge til, fjerne eller redigere varer i appen. Varelista endres ved å
  oppdatere regnearket og kjøre importskriptet på nytt.
- Ingen ekte autentisering. Se «Sikkerhet» under.

## Kilde-data

Arket **«Ny»** i `Handleliste Tønsberg.xlsx`.

- Overskriftsrad på rad 6: `Kategori | Vare | Merke | Bør ha | Kjøp | Forpakn. | Kommentar`
- **11 kategorier, 112 varer.**
- Kategorinavn står i kolonne A på egen rad; varene under tilhører den kategorien til neste
  kategorirad. Tomme rader skiller kategoriene.
- Kolonnen `Kjøp` er tom i hele arket — det er den brukeren fyller ut.

Kategorier i rekkefølge, med antall varer:

| # | Kategori | Varer |
|---|---|---|
| 1 | Drikkevarer | 15 |
| 2 | Bakevarer | 4 |
| 3 | Tørrvare / hermetikk / krydder | 6 |
| 4 | Frukt / grønt | 13 |
| 5 | Pålegg | 41 |
| 6 | Rengjøring / kjøkkenartikler | 11 |
| 7 | Godis | 4 |
| 8 | Diverse | 3 |
| 9 | Sesongvarer, jul | 1 |
| 10 | Sesongvarer, sommer | 1 |
| 11 | Varmmat | 13 |
| | **Sum** | **112** |

Rekkefølgen fra regnearket bevares — både på kategorier og på varer innenfor hver kategori.

## Arkitektur

Next.js (App Router) med `output: 'export'`. Bygget produserer ren statisk HTML/CSS/JS som
GitHub Pages serverer. Ingen server-side kjøring i produksjon.

```
Excel «Ny»
   │  scripts/les-excel.py   (kjøres manuelt ved behov)
   ▼
src/data/handleliste.ts      (generert, committes)
   │
   ▼
React-komponenter ──► localStorage  (kun «Kjøp» + opplåst-flagg)
   │
   ▼
next build → out/ ──► GitHub Actions ──► GitHub Pages
```

### Datamodell

```ts
export type Vare = {
  id: string          // stabil slug, f.eks. "paalegg-ketchup-idun"
  vare: string
  merke?: string
  borHa?: string
  forpakning?: string
  kommentar?: string
}

export type Kategori = {
  id: string
  navn: string
  varer: Vare[]
}

export const KATEGORIER: Kategori[]
```

**`borHa` er `string`, ikke `number`.** Regnearket inneholder verdiene `1-2`, `2-3` og `2?`.
Feltet vises som tekst og brukes aldri til regning.

**`id` må være stabil på tvers av re-import.** Hvis id-en var en array-indeks ville en endring i
regnearket forskyve alle lagrede Kjøp-verdier over på feil varer, uten feilmelding. Slug bygges
av `kategori + vare + merke`, normalisert:

- lowercase
- `æ→ae`, `ø→oe`, `å→aa`
- alt annet enn `a-z0-9` blir `-`, gjentatte `-` slås sammen, ledende/etterfølgende `-` fjernes

Merke inngår fordi `Ketchup` finnes to ganger i kategorien Pålegg (Idun og Heinz).

Slug-algoritmen finnes **kun i TypeScript** (`lib/slug.ts`), ikke i importskriptet. Skriptet
skriver bare en flat, ordrett avskrift av arket til `data/rader.ts`; `data/handleliste.ts`
grupperer radene og regner ut id-ene ved import. Da finnes algoritmen ett sted og kan
enhetstestes, i stedet for å være duplisert i Python og TypeScript der de to kunne drifte fra
hverandre. `data/handleliste.ts` **kaster** ved duplikat id, slik at en kollisjon blir en
byggefeil og ikke stille datatap.

Verifisert mot dagens ark: 112 varer gir 112 unike id-er, ingen kollisjoner.

`Kategori.id` bygges med samme normalisering, fra kategorinavnet alene — f.eks.
`Tørrvare / hermetikk / krydder` → `toerrvare-hermetikk-krydder`. Den brukes kun som React-nøkkel
og som anker i DOM-en, aldri til lagring, så den trenger ikke være stabil over tid.

### Tilstand

To nøkler i `localStorage`:

| Nøkkel | Verdi | Beskrivelse |
|---|---|---|
| `handleliste:kjop:v1` | `{ [vareId]: number }` | Kun oppføringer med verdi `> 0` lagres |
| `handleliste:opplast:v1` | `"ja"` | Settes ved riktig passord |

`v1`-suffikset gjør det mulig å endre format senere uten å krasje på gamle data.

**Hydrering:** Statisk eksport betyr at HTML-en er generert på byggetid, uten tilgang til
`localStorage`. All lesing fra `localStorage` skjer derfor i `useEffect` etter montering, aldri
under render. Før første effekt rendres nøytral tilstand (låst skjerm, alle Kjøp = 0). Uten dette
får vi hydreringsavvik i React.

`lib/lagring.ts` innkapsler dette og er robust mot:

- `localStorage` som kaster (privat modus, blokkerte cookies) → faller tilbake til minne
- korrupt JSON → returnerer tom tilstand i stedet for å krasje
- verdier som ikke er tall → filtreres bort ved lesing

### Komponenter

| Fil | Ansvar |
|---|---|
| `app/page.tsx` | Setter sammen låsskjerm og liste |
| `app/layout.tsx` | Metadata, manifest-lenke, tema-farge, registrering av service worker |
| `components/Passordlas.tsx` | Passordskjerm. Eier opplåst-tilstand |
| `components/Handleliste.tsx` | Eier `kjop`-tilstand og handletur-modus |
| `components/Verktoylinje.tsx` | Klistret topplinje: modusbryter, antall, Nullstill, Logg ut |
| `components/KategoriKort.tsx` | Ett kategorikort med eget antall-merke |
| `components/VareRad.tsx` | Én varerad med teller |
| `components/RegistrerSW.tsx` | Registrerer service worker etter `load` |
| `lib/lagring.ts` | `localStorage`-innpakning, trygg mot SSR og feil |
| `lib/config.ts` | `basePath`-konstanten. Eneste sted repo-navnet står |
| `lib/slug.ts` | Id-generering. Eneste sted algoritmen finnes |
| `lib/filter.ts` | Handletur-filter og opptelling |
| `data/rader.ts` | Generert, ordrett avskrift av arket |
| `data/handleliste.ts` | Grupperer rader til kategorier, regner ut id-er |
| `scripts/les-excel.py` | Importskript, kjøres manuelt |
| `scripts/lag-ikoner.py` | Genererer PWA-ikoner, kjøres én gang |

Hver komponent kan forstås uten å lese de andre. Tilstand eies ett sted (`Handleliste.tsx`) og
sendes ned som props; `VareRad` og `KategoriKort` er rene visningskomponenter.

### Layout

CSS multi-column (`column-count` + `break-inside: avoid`) på beholderen rundt kategorikortene.
Brytepunkter følger viewport-bredde, ikke enhetsdeteksjon, slik at layouten tilpasser seg når
telefonen brettes ut midt i bruk — uten JavaScript.

| Bredde | Kolonner | Typisk tilstand |
|---|---|---|
| `< 640px` | 1 | Fold-6 dekselskjerm |
| `640–1000px` | 2 | Fold 6 utbrettet, portrett |
| `> 1000px` | 3 | Utbrettet landskap, desktop |

Multi-column er valgt framfor CSS Grid fordi kategoriene har svært ulik høyde (Pålegg har 41
varer, «Sesongvarer, jul» har 1). Grid ville gitt store hull; multi-column pakker kortene tett.

### Varerad

```
Eplejuice
Eldorado · 1,75l
Fersk
Bør ha 5          [ − ]  2  [ + ]
```

- **Vare** er mest fremtredende.
- `merke · forpakning` på dempet andrelinje. Utelates helt hvis begge mangler.
- `kommentar` på egen, mindre linje. Noen er lange (te-raden er en hel setning) og må brytes
  over flere linjer, ikke avkortes.
- `Bør ha` står ved siden av telleren for lett sammenligning. Utelates hvis tom.
- Teller: `−` og `+` med minimum 44×44 px trykkflate. Verdien kan også skrives direkte i et
  `inputmode="numeric"`-felt. Nedre grense 0, ingen øvre grense. `−` er deaktivert på 0.
- Rader med `Kjøp > 0` markeres visuelt (bakgrunn + venstrekant) så de er lette å se i lista.

### Handletur-modus

Bryter i verktøylinja. Når den er på vises kun varer med `Kjøp > 0`, og kategorier uten slike
varer skjules helt. Modusen lagres ikke — den starter alltid av, siden det er den tilstanden
som gir mening når man åpner appen hjemme.

Når modusen er på og ingenting er valgt, vises en forklarende tomtilstand i stedet for en blank
skjerm.

### Nullstill

Toppknapp `Nullstill`. Første trykk bytter den til `Sikker?`; andre trykk innen 4 sekunder
sletter `handleliste:kjop:v1` og setter alle tellere til 0. Ellers går den tilbake til
`Nullstill`. To trinn fordi ett feiltrykk ellers ville slette ekte arbeid.

`Logg ut` fjerner opplåst-flagget og viser passordskjermen igjen. Rører ikke Kjøp-verdiene.

### Tema

Lyst og mørkt via `prefers-color-scheme`, styrt av CSS-variabler definert ett sted. Begge temaer
må ha minst 4.5:1 kontrast på brødtekst. `<meta name="theme-color">` settes for begge så
systemlinjene matcher.

## PWA

- `app/manifest.ts` som importerer `basePath` fra `src/lib/config.ts` — samme konstant som
  `next.config.ts` bruker. `start_url`, `scope` og ikon-stier bygges av den konstanten, slik at
  repo-navnet fortsatt bare står ett sted og feil fanges av typesjekken. Next.js skriver den ut
  som `manifest.webmanifest` i den statiske eksporten.
- `display: "standalone"`, `orientation` ikke låst (telefonen brettes).
- Ikoner: 192×192, 512×512, samt en `maskable` variant. Genereres som del av oppsettet.
- `public/sw.js`: håndskrevet service worker, ca. 30 linjer. Precacher app-skallet ved
  `install`, serverer cache-first ved `fetch`, rydder gamle cacher ved `activate`. Ingen
  `next-pwa`-avhengighet.
- Chrome på Android krever både manifest og en service worker med `fetch`-handler for å tilby
  «Installer app». Precachingen gir samtidig offline-bruk, som er poenget i en butikk med dårlig
  dekning.
- Service worker registreres først etter `load`, og feiler stille hvis nettleseren ikke støtter det.

## Sikkerhet

Passordet `Tønsberg!` er **skjuling, ikke sikkerhet.** Strengen ligger i JavaScript-bundelen og
kan leses av hvem som helst med utviklerverktøy. Det hindrer tilfeldig titting på en offentlig
URL — ingenting mer. Innholdet i lista må ikke behandles som hemmelig.

Sammenligningen gjøres mot en konstant i koden. Ingen hashing, siden hashing her bare ville gitt
falsk trygghet — den som kan lese hashen kan lese koden som sammenligner den.

## Utrulling

GitHub Pages som prosjektside: `https://<bruker>.github.io/handleliste/`.

`next.config.ts`:

```ts
const basePath = '/handleliste'   // ← eneste sted repo-navnet står

export default {
  output: 'export',
  basePath,
  images: { unoptimized: true },
  trailingSlash: true,
}
```

**Ingen `assetPrefix`.** `basePath` prefikser `_next`-ressursene selv, og Next.js' dokumentasjon
fraråder eksplisitt å bruke `assetPrefix` til underkataloger: *«Next.js 9.5+ introduced support
for a customizable Base Path, which is a more suitable option for hosting applications on a
sub-path like /docs. It is not recommended to use a custom Asset Prefix for this specific use
case.»* Å sette begge risikerer dobbelt prefiks (`/handleliste/handleliste/_next/…`). Det
offisielle `github-pages`-eksemplet i Next.js-repoet bruker kun `basePath`.

- `public/.nojekyll` — uten den ignorerer GitHub Pages filer og mapper som starter med `_`,
  og hele `_next/`-katalogen forsvinner.
- `trailingSlash: true` gjør at Pages finner `index.html` riktig.
- GitHub Actions-workflow bygger og publiserer `out/` ved push til `main`.
- Repo-navnet står kun i `src/lib/config.ts`. Både `next.config.ts`, `app/manifest.ts` og
  service worker-registreringen importerer det derfra, så det endres ett sted.

`public/sw.js` kan derimot ikke importere konstanten — den serveres som en rå fil. Den utleder
i stedet sitt eget omfang fra `self.registration.scope` under kjøring, slik at den fungerer
uansett hva `basePath` er satt til.

## Testing

Vitest, avgrenset til det som faktisk kan gå i stykker:

1. **Dataintegritet** — 11 kategorier, 112 varer, alle `id` unike, alle `id` matcher
   `^[a-z0-9-]+$`, ingen tomme `vare`-navn.
2. **`lib/lagring.ts`** — skriver og leser tilbake; tåler korrupt JSON; tåler at
   `localStorage` kaster; filtrerer bort ikke-numeriske verdier; lagrer ikke nuller.
3. **Slug-funksjonen** — norske tegn translittereres; kjente kollisjoner (de to `Ketchup`-radene)
   gir ulike id-er.
4. **Handletur-filter** — tar kun med varer `> 0`; fjerner kategorier som blir tomme.
5. **Telleren** — `−` er deaktivert på 0, så antallet kan ikke bli negativt; `+` øker med 1;
   skriving av ikke-siffer i feltet gir 0, ikke `NaN`.
6. **Nullstill** — ett trykk sletter ingenting; to trykk sletter; ventetid mellom trykkene
   avbryter.

Punkt 5 og 6 krever komponenttester, og dermed `@testing-library/react` i tillegg til Vitest og
jsdom. De er tatt med fordi begge er stille feil: en negativ teller ser nesten riktig ut, og en
Nullstill som utløses på første trykk oppdages først når arbeid allerede er borte.

Ingen e2e-suite. Appen er en statisk liste; kostnaden ved et browserbasert oppsett står ikke i
forhold til risikoen.

Manuell verifisering før ferdigmelding: `next build` fullfører, `out/` inneholder `index.html`,
`.nojekyll`, `manifest.webmanifest` og `sw.js`, og lista serveres riktig lokalt fra `out/` under
`/handleliste/` — inkludert at `_next/`-ressursene lastes uten 404 og uten dobbelt prefiks.

## Åpne antakelser

- **Repo-navn `handleliste`.** Valgt fordi det ikke ble oppgitt. Endres ett sted i
  `next.config.ts`.
- **Grensesnittspråk er norsk**, i tråd med regnearket.
