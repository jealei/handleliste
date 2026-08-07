# Handleliste Tønsberg Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the "Ny" sheet of `Handleliste Tønsberg.xlsx` into a statically-exported, installable Next.js app hosted on GitHub Pages, where the only mutable state — the `Kjøp` count per item — lives in `localStorage`.

**Architecture:** A Python script transcribes the sheet verbatim into `src/data/rader.ts`. A TypeScript module groups those rows into categories and derives stable slug ids. React client components own `Kjøp` state, persist it to `localStorage`, and render categories into a CSS multi-column layout that reflows when the phone unfolds. `next build` with `output: 'export'` emits static files that GitHub Actions publishes to Pages.

**Tech Stack:** Next.js 16.3.0 (App Router), React 19.2.8, TypeScript, CSS Modules, Vitest 4 + jsdom + @testing-library/react, Python 3 + openpyxl (build-time only).

## Global Constraints

- **Spec:** `docs/superpowers/specs/2026-08-07-handleliste-design.md`. Read it before starting.
- **Node `>=20.9.0`** — required by Next 16. Verified present: v20.19.3.
- **Interface language is Norwegian.** All user-visible copy, and all identifiers in new code (variables, functions, files, CSS classes), are Norwegian — matching the spec. Do not translate to English.
- **`basePath` is `/handleliste`, defined only in `src/lib/config.ts`.** Never hardcode it anywhere else.
- **No `assetPrefix`.** `basePath` already prefixes `_next` assets; setting both produces `/handleliste/handleliste/_next/…`.
- **`borHa` is `string`, never `number`.** The sheet contains `1-2`, `2-3`, `2?`.
- **Never read `localStorage` during render** — only inside `useEffect`. Static export has no `localStorage` at build time; reading during render causes hydration mismatch.
- **The password is obfuscation, not security.** Do not add hashing — it would imply a guarantee that does not exist.
- **Source data:** `/Users/jealei/Downloads/Handleliste Tønsberg.xlsx`, sheet `Ny`. Expected: **11 categories, 112 items.** These exact numbers are asserted in tests.
- Commit after every task. Norwegian commit messages, `feat:`/`test:`/`chore:` prefixes.

---

### Task 1: Project scaffold, config, and test harness

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `vitest.config.ts`, `vitest.setup.ts`
- Create: `src/lib/config.ts`, `src/lib/config.test.ts`
- Create: `public/.nojekyll`
- Create: `src/app/layout.tsx`, `src/app/page.tsx` (placeholders, replaced in Task 9 and 10)

**Interfaces:**
- Consumes: nothing.
- Produces: `BASE_PATH: string` from `src/lib/config.ts`. The `@/*` → `src/*` path alias, used by every later task.

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "handleliste",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "test": "vitest run",
    "test:watch": "vitest",
    "importer": "python3 scripts/les-excel.py",
    "ikoner": "python3 scripts/lag-ikoner.py"
  },
  "dependencies": {
    "next": "16.3.0",
    "react": "19.2.8",
    "react-dom": "19.2.8"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.6.3",
    "@testing-library/react": "^16.1.0",
    "@testing-library/user-event": "^14.5.2",
    "@types/node": "^22.10.2",
    "@types/react": "^19.0.2",
    "@types/react-dom": "^19.0.2",
    "@vitejs/plugin-react": "^4.3.4",
    "jsdom": "^25.0.1",
    "typescript": "^5.7.2",
    "vitest": "^4.1.10"
  }
}
```

- [ ] **Step 2: Create `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "ES2022"],
    "allowJs": false,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules", "out"]
}
```

- [ ] **Step 3: Create `src/lib/config.ts`**

This file must have zero imports — `next.config.ts` imports it, and Next's config loader is happiest with a leaf module.

```ts
/**
 * Stien appen serveres under på GitHub Pages.
 *
 * Dette er ENESTE sted repo-navnet står. Endres repoet til noe annet, endres
 * denne konstanten — ingenting annet.
 *
 * Tom streng betyr at appen ligger på domenerota (bruker- eller org-side).
 * Ellers må verdien starte med "/" og ikke slutte med "/".
 */
export const BASE_PATH = '/handleliste'

/** Bygger en absolutt sti til en fil i `public/`, med riktig prefiks. */
export function offentligSti(fil: string): string {
  return `${BASE_PATH}/${fil.replace(/^\//, '')}`
}
```

- [ ] **Step 4: Write the failing test**

Create `src/lib/config.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { BASE_PATH, offentligSti } from './config'

describe('config', () => {
  it('har en basePath som er tom eller starter med skråstrek', () => {
    expect(BASE_PATH === '' || BASE_PATH.startsWith('/')).toBe(true)
  })

  it('har en basePath uten etterfølgende skråstrek', () => {
    expect(BASE_PATH.endsWith('/')).toBe(false)
  })

  it('bygger offentlige stier med prefiks', () => {
    expect(offentligSti('sw.js')).toBe(`${BASE_PATH}/sw.js`)
  })

  it('tåler at filnavnet allerede har ledende skråstrek', () => {
    expect(offentligSti('/ikon-192.png')).toBe(`${BASE_PATH}/ikon-192.png`)
  })

  it('lager aldri dobbel skråstrek', () => {
    expect(offentligSti('/sw.js')).not.toContain('//')
  })
})
```

- [ ] **Step 5: Create `vitest.config.ts` and `vitest.setup.ts`**

`vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'node:path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
  },
  resolve: {
    alias: { '@': path.resolve(import.meta.dirname, './src') },
  },
})
```

`vitest.setup.ts`:

```ts
import '@testing-library/jest-dom/vitest'
```

- [ ] **Step 6: Create `next.config.ts`**

```ts
import type { NextConfig } from 'next'
import { BASE_PATH } from './src/lib/config'

const nextConfig: NextConfig = {
  output: 'export',
  basePath: BASE_PATH,
  images: { unoptimized: true },
  trailingSlash: true,
}

export default nextConfig
```

- [ ] **Step 7: Create placeholder `src/app/layout.tsx` and `src/app/page.tsx`**

These exist only so `next build` succeeds; Tasks 9 and 10 replace them.

`src/app/layout.tsx`:

```tsx
import type { ReactNode } from 'react'

export default function RotOppsett({ children }: { children: ReactNode }) {
  return (
    <html lang="nb">
      <body>{children}</body>
    </html>
  )
}
```

`src/app/page.tsx`:

```tsx
export default function Side() {
  return <main>Handleliste</main>
}
```

- [ ] **Step 8: Create `public/.nojekyll`**

Must exist and be empty. Without it GitHub Pages ignores `_next/` (leading underscore) and every asset 404s.

```bash
mkdir -p public && touch public/.nojekyll
```

- [ ] **Step 9: Install and run the tests**

```bash
npm install
npm test
```

Expected: 5 tests pass in `src/lib/config.test.ts`.

- [ ] **Step 10: Verify the build produces a static export**

```bash
npm run build
ls out/
```

Expected: `out/` exists and contains `index.html` and `_next/`. If `out/` is missing, `output: 'export'` is not being applied — fix before continuing.

- [ ] **Step 11: Commit**

```bash
git add -A
git commit -m "chore: sett opp Next.js-prosjekt med statisk eksport og Vitest"
```

---

### Task 2: Slug generation

**Files:**
- Create: `src/lib/slug.ts`
- Test: `src/lib/slug.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: `slug(...deler: (string | undefined)[]): string`. Task 4 uses it to derive `Vare.id` and `Kategori.id`.

- [ ] **Step 1: Write the failing test**

Create `src/lib/slug.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { slug } from './slug'

describe('slug', () => {
  it('gjør om til små bokstaver', () => {
    expect(slug('Eplejuice')).toBe('eplejuice')
  })

  it('translittererer norske tegn', () => {
    expect(slug('Pålegg')).toBe('paalegg')
    expect(slug('Tørrvare')).toBe('toerrvare')
    expect(slug('Rød løk')).toBe('roed-loek')
  })

  it('fjerner aksenter fra andre latinske tegn', () => {
    expect(slug('Gräddost')).toBe('graddost')
  })

  it('slår sammen skilletegn og mellomrom til én bindestrek', () => {
    expect(slug('Tørrvare / hermetikk / krydder')).toBe('toerrvare-hermetikk-krydder')
  })

  it('fjerner ledende og etterfølgende bindestreker', () => {
    expect(slug('  Kaffe, filtermalt  ')).toBe('kaffe-filtermalt')
  })

  it('setter sammen flere deler', () => {
    expect(slug('Pålegg', 'Ketchup', 'Idun')).toBe('paalegg-ketchup-idun')
  })

  it('hopper over tomme og udefinerte deler', () => {
    expect(slug('Pålegg', 'Eggesalat', undefined)).toBe('paalegg-eggesalat')
    expect(slug('Pålegg', 'Eggesalat', '')).toBe('paalegg-eggesalat')
    expect(slug('Pålegg', 'Eggesalat', '   ')).toBe('paalegg-eggesalat')
  })

  it('skiller varer som bare er ulike på merke', () => {
    expect(slug('Pålegg', 'Ketchup', 'Idun')).not.toBe(slug('Pålegg', 'Ketchup', 'Heinz'))
  })

  it('gir bare tegn som er trygge i en id', () => {
    expect(slug('Fun Light, variere smak')).toMatch(/^[a-z0-9-]+$/)
    expect(slug('Batterier AA')).toMatch(/^[a-z0-9-]+$/)
    expect(slug('Knekkebrød, Finn Crisp original')).toMatch(/^[a-z0-9-]+$/)
  })

  it('gir tom streng når ingenting er igjen', () => {
    expect(slug('///')).toBe('')
    expect(slug()).toBe('')
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/lib/slug.test.ts`
Expected: FAIL — `Failed to resolve import "./slug"`.

- [ ] **Step 3: Write the implementation**

Create `src/lib/slug.ts`:

```ts
/**
 * Lager en stabil id av tekstbiter.
 *
 * Id-ene brukes som nøkler i localStorage. De MÅ derfor være stabile over tid:
 * endres algoritmen, mister brukeren alle lagrede Kjøp-verdier. Endre den ikke
 * uten å også migrere lagringsnøkkelen.
 *
 * Norske tegn translittereres eksplisitt (æ→ae, ø→oe, å→aa) FØR
 * Unicode-normaliseringen, siden NFD ellers ville gjort «å» til «a» og
 * dermed kollapset «Rød»/«Rod» til samme id.
 */
const NORSKE_TEGN: Record<string, string> = { æ: 'ae', ø: 'oe', å: 'aa' }

export function slug(...deler: (string | undefined)[]): string {
  return deler
    .filter((del): del is string => Boolean(del && del.trim()))
    .join(' ')
    .toLowerCase()
    .replace(/[æøå]/g, (tegn) => NORSKE_TEGN[tegn])
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run src/lib/slug.test.ts`
Expected: PASS, 10 tests.

- [ ] **Step 5: Commit**

```bash
git add src/lib/slug.ts src/lib/slug.test.ts
git commit -m "feat: legg til slug-generering for stabile vare-id-er"
```

---

### Task 3: Excel import script

**Files:**
- Create: `scripts/les-excel.py`
- Create (generated): `src/data/rader.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: `type Rad = { kategori: string; vare: string; merke?: string; borHa?: string; forpakning?: string; kommentar?: string }` and `RADER: readonly Rad[]` from `src/data/rader.ts`. Task 4 consumes both.

**Sheet structure the script relies on:** row 6 is the header. From row 7 down, a row with column A filled starts a new category; a row with column A empty and column B filled is an item in the current category. Blank rows separate categories.

- [ ] **Step 1: Write the import script**

Create `scripts/les-excel.py`:

```python
#!/usr/bin/env python3
"""Leser arket «Ny» og skriver en ordrett avskrift til src/data/rader.ts.

Skriptet gjør bevisst SÅ LITE som mulig: ingen id-generering, ingen gruppering,
ingen opprydding. Alt slikt hører hjemme i TypeScript, der det kan testes.
Skriptet er en ren avskrift, slik at diffen mot forrige kjøring er lett å lese.

Kjør:  npm run importer
"""
from pathlib import Path
import sys

try:
    import openpyxl
except ImportError:
    sys.exit('Mangler openpyxl. Installer med:  python3 -m pip install openpyxl')

KILDE = Path.home() / 'Downloads' / 'Handleliste Tønsberg.xlsx'
ARK = 'Ny'
FORSTE_DATARAD = 7
MAL = Path(__file__).resolve().parent.parent / 'src' / 'data' / 'rader.ts'

FELT = ['kategori', 'vare', 'merke', 'borHa', 'forpakning', 'kommentar']


def tekst(celle):
    """Gjør en celle om til trimmet tekst. Heltall skal ikke bli «5.0»."""
    verdi = celle.value
    if verdi is None:
        return ''
    if isinstance(verdi, float) and verdi.is_integer():
        return str(int(verdi))
    return str(verdi).strip()


def les_rader(ark):
    rader, kategori = [], None
    for rad in ark.iter_rows(min_row=FORSTE_DATARAD, max_row=ark.max_row, max_col=7):
        a, b, c, d, _kjop, f, g = (tekst(celle) for celle in rad)
        if a:
            kategori = a
        elif b:
            if kategori is None:
                sys.exit(f'Vare uten kategori på rad {rad[0].row}: {b!r}')
            rader.append({
                'kategori': kategori, 'vare': b, 'merke': c,
                'borHa': d, 'forpakning': f, 'kommentar': g,
            })
    return rader


def sitat(verdi):
    """Escaper til et TypeScript-strengliteral med enkle apostrofer."""
    return "'" + verdi.replace('\\', '\\\\').replace("'", "\\'").replace('\n', ' ') + "'"


def skriv(rader):
    linjer = [
        '// GENERERT FIL — IKKE REDIGER FOR HÅND.',
        '// Kjør `npm run importer` for å regenerere fra regnearket.',
        f'// Kilde: {KILDE.name}, arket «{ARK}».',
        '',
        'export type Rad = {',
        '  kategori: string',
        '  vare: string',
        '  merke?: string',
        '  borHa?: string',
        '  forpakning?: string',
        '  kommentar?: string',
        '}',
        '',
        'export const RADER: readonly Rad[] = [',
    ]
    for rad in rader:
        par = [f'{felt}: {sitat(rad[felt])}' for felt in FELT if rad[felt]]
        linjer.append('  { ' + ', '.join(par) + ' },')
    linjer += [']', '']
    MAL.parent.mkdir(parents=True, exist_ok=True)
    MAL.write_text('\n'.join(linjer), encoding='utf-8')


def main():
    if not KILDE.exists():
        sys.exit(f'Finner ikke regnearket: {KILDE}')
    bok = openpyxl.load_workbook(KILDE, data_only=True)
    if ARK not in bok.sheetnames:
        sys.exit(f'Fant ikke arket «{ARK}». Ark i boka: {bok.sheetnames}')
    rader = les_rader(bok[ARK])
    kategorier = list(dict.fromkeys(r['kategori'] for r in rader))
    if not rader:
        sys.exit('Fant ingen varer — sjekk at arkstrukturen ikke er endret.')
    skriv(rader)
    print(f'Skrev {len(rader)} varer i {len(kategorier)} kategorier til {MAL}')
    for navn in kategorier:
        print(f"  {sum(1 for r in rader if r['kategori'] == navn):3d}  {navn}")


if __name__ == '__main__':
    main()
```

- [ ] **Step 2: Run the script**

```bash
python3 -m pip install --quiet openpyxl 2>/dev/null || python3 -m pip install --quiet --break-system-packages openpyxl
npm run importer
```

Expected output — these exact numbers, already verified against the sheet:

```
Skrev 112 varer i 11 kategorier til .../src/data/rader.ts
   15  Drikkevarer
    4  Bakevarer
    6  Tørrvare / hermetikk / krydder
   13  Frukt / grønt
   41  Pålegg
   11  Rengjøring / kjøkkenartikler
    4  Godis
    3  Diverse
    1  Sesongvarer, jul
    1  Sesongvarer, sommer
   13  Varmmat
```

If the numbers differ, **stop** — the sheet changed and the assertions in Task 4 need updating to match.

- [ ] **Step 3: Spot-check the generated file**

```bash
head -20 src/data/rader.ts
grep -c '^  {' src/data/rader.ts
grep "Ketchup" src/data/rader.ts
```

Expected: 112 from the count. The two Ketchup rows must show different `merke` values (`Idun` and `Heinz`) — this is what keeps their ids distinct.

- [ ] **Step 4: Commit**

The generated file **is** committed — the app has no database, so the data must ship in the bundle.

```bash
git add scripts/les-excel.py src/data/rader.ts
git commit -m "feat: importer varedata fra regnearket"
```

---

### Task 4: Category model with stable ids

**Files:**
- Create: `src/data/handleliste.ts`
- Test: `src/data/handleliste.test.ts`

**Interfaces:**
- Consumes: `RADER`, `Rad` (Task 3); `slug()` (Task 2).
- Produces:
  - `type Vare = { id: string; vare: string; merke?: string; borHa?: string; forpakning?: string; kommentar?: string }`
  - `type Kategori = { id: string; navn: string; varer: Vare[] }`
  - `KATEGORIER: readonly Kategori[]`
  - `byggKategorier(rader: readonly Rad[]): Kategori[]` — exported for testing.

- [ ] **Step 1: Write the failing test**

Create `src/data/handleliste.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { KATEGORIER, byggKategorier } from './handleliste'
import type { Rad } from './rader'

describe('KATEGORIER', () => {
  it('har 11 kategorier', () => {
    expect(KATEGORIER).toHaveLength(11)
  })

  it('har 112 varer til sammen', () => {
    const antall = KATEGORIER.reduce((sum, k) => sum + k.varer.length, 0)
    expect(antall).toBe(112)
  })

  it('bevarer rekkefølgen fra regnearket', () => {
    expect(KATEGORIER.map((k) => k.navn)).toEqual([
      'Drikkevarer',
      'Bakevarer',
      'Tørrvare / hermetikk / krydder',
      'Frukt / grønt',
      'Pålegg',
      'Rengjøring / kjøkkenartikler',
      'Godis',
      'Diverse',
      'Sesongvarer, jul',
      'Sesongvarer, sommer',
      'Varmmat',
    ])
  })

  it('gir hver vare en unik id', () => {
    const ider = KATEGORIER.flatMap((k) => k.varer.map((v) => v.id))
    expect(new Set(ider).size).toBe(ider.length)
  })

  it('gir bare id-er med trygge tegn', () => {
    for (const kategori of KATEGORIER) {
      expect(kategori.id).toMatch(/^[a-z0-9-]+$/)
      for (const vare of kategori.varer) {
        expect(vare.id).toMatch(/^[a-z0-9-]+$/)
      }
    }
  })

  it('har ingen varer uten navn', () => {
    for (const kategori of KATEGORIER) {
      for (const vare of kategori.varer) {
        expect(vare.vare.trim()).not.toBe('')
      }
    }
  })

  it('skiller de to Ketchup-radene', () => {
    const paalegg = KATEGORIER.find((k) => k.navn === 'Pålegg')!
    const ketchup = paalegg.varer.filter((v) => v.vare === 'Ketchup')
    expect(ketchup).toHaveLength(2)
    expect(ketchup[0].id).not.toBe(ketchup[1].id)
  })

  it('beholder borHa som tekst, også for intervaller', () => {
    const alle = KATEGORIER.flatMap((k) => k.varer)
    const intervall = alle.find((v) => v.borHa?.includes('-'))
    expect(intervall).toBeDefined()
    expect(typeof intervall!.borHa).toBe('string')
  })
})

describe('byggKategorier', () => {
  it('grupperer rader under kategorinavnet sitt', () => {
    const rader: Rad[] = [
      { kategori: 'Drikkevarer', vare: 'Melk' },
      { kategori: 'Drikkevarer', vare: 'Juice' },
      { kategori: 'Godis', vare: 'Twist' },
    ]
    const bygget = byggKategorier(rader)
    expect(bygget).toHaveLength(2)
    expect(bygget[0].varer.map((v) => v.vare)).toEqual(['Melk', 'Juice'])
    expect(bygget[1].varer.map((v) => v.vare)).toEqual(['Twist'])
  })

  it('utleder id fra kategori, vare og merke', () => {
    const bygget = byggKategorier([{ kategori: 'Pålegg', vare: 'Ketchup', merke: 'Idun' }])
    expect(bygget[0].varer[0].id).toBe('paalegg-ketchup-idun')
    expect(bygget[0].id).toBe('paalegg')
  })

  it('kaster ved duplikat id i stedet for å miste data stille', () => {
    const rader: Rad[] = [
      { kategori: 'Godis', vare: 'Twist' },
      { kategori: 'Godis', vare: 'Twist' },
    ]
    expect(() => byggKategorier(rader)).toThrow(/[Dd]uplikat/)
  })

  it('lar samme varenavn leve i ulike kategorier', () => {
    const rader: Rad[] = [
      { kategori: 'Frukt / grønt', vare: 'Løk' },
      { kategori: 'Varmmat', vare: 'Løk' },
    ]
    expect(() => byggKategorier(rader)).not.toThrow()
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/data/handleliste.test.ts`
Expected: FAIL — `Failed to resolve import "./handleliste"`.

- [ ] **Step 3: Write the implementation**

Create `src/data/handleliste.ts`:

```ts
import { slug } from '@/lib/slug'
import { RADER, type Rad } from './rader'

export type Vare = {
  /** Stabil id. Brukes som nøkkel i localStorage — se lib/slug.ts. */
  id: string
  vare: string
  merke?: string
  /** Tekst, ikke tall: arket inneholder «1-2», «2-3» og «2?». */
  borHa?: string
  forpakning?: string
  kommentar?: string
}

export type Kategori = {
  id: string
  navn: string
  varer: Vare[]
}

/**
 * Grupperer flate rader til kategorier og regner ut id-er.
 *
 * Kaster ved duplikat vare-id. Det er med vilje: to varer med samme id ville
 * delt Kjøp-verdi i localStorage, og feilen ville vist seg som en teller som
 * «flytter seg selv» — nesten umulig å feilsøke. Bedre å stoppe ved bygging.
 */
export function byggKategorier(rader: readonly Rad[]): Kategori[] {
  const kategorier: Kategori[] = []
  const brukteIder = new Set<string>()

  for (const rad of rader) {
    let kategori = kategorier.find((k) => k.navn === rad.kategori)
    if (!kategori) {
      kategori = { id: slug(rad.kategori), navn: rad.kategori, varer: [] }
      kategorier.push(kategori)
    }

    const id = slug(rad.kategori, rad.vare, rad.merke)
    if (brukteIder.has(id)) {
      throw new Error(
        `Duplikat vare-id «${id}» (${rad.kategori} / ${rad.vare}). ` +
          'Gi varene ulikt merke i regnearket, eller utvid slug-nøkkelen.',
      )
    }
    brukteIder.add(id)

    kategori.varer.push({
      id,
      vare: rad.vare,
      merke: rad.merke,
      borHa: rad.borHa,
      forpakning: rad.forpakning,
      kommentar: rad.kommentar,
    })
  }

  return kategorier
}

export const KATEGORIER: readonly Kategori[] = byggKategorier(RADER)
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run src/data/handleliste.test.ts`
Expected: PASS, 12 tests.

- [ ] **Step 5: Commit**

```bash
git add src/data/handleliste.ts src/data/handleliste.test.ts
git commit -m "feat: bygg kategorimodell med stabile vare-id-er"
```

---

### Task 5: localStorage wrapper

**Files:**
- Create: `src/lib/lagring.ts`
- Test: `src/lib/lagring.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `type KjopKart = Record<string, number>`
  - `lesKjop(): KjopKart`
  - `skrivKjop(kart: KjopKart): void`
  - `tommKjop(): void`
  - `erOpplast(): boolean`
  - `settOpplast(verdi: boolean): void`
  - `NOKKEL_KJOP`, `NOKKEL_OPPLAST` — exported for tests only.

- [ ] **Step 1: Write the failing test**

Create `src/lib/lagring.test.ts`:

```ts
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  NOKKEL_KJOP,
  NOKKEL_OPPLAST,
  erOpplast,
  lesKjop,
  settOpplast,
  skrivKjop,
  tommKjop,
} from './lagring'

beforeEach(() => window.localStorage.clear())
afterEach(() => vi.restoreAllMocks())

describe('lesKjop / skrivKjop', () => {
  it('gir tomt kart når ingenting er lagret', () => {
    expect(lesKjop()).toEqual({})
  })

  it('skriver og leser tilbake', () => {
    skrivKjop({ 'godis-twist': 3 })
    expect(lesKjop()).toEqual({ 'godis-twist': 3 })
  })

  it('lagrer ikke nuller', () => {
    skrivKjop({ 'godis-twist': 0, 'godis-mandler': 2 })
    expect(lesKjop()).toEqual({ 'godis-mandler': 2 })
  })

  it('tåler korrupt JSON', () => {
    window.localStorage.setItem(NOKKEL_KJOP, '{ikke gyldig json')
    expect(lesKjop()).toEqual({})
  })

  it('tåler at lagret verdi er en array', () => {
    window.localStorage.setItem(NOKKEL_KJOP, '[1,2,3]')
    expect(lesKjop()).toEqual({})
  })

  it('tåler at lagret verdi er null', () => {
    window.localStorage.setItem(NOKKEL_KJOP, 'null')
    expect(lesKjop()).toEqual({})
  })

  it('filtrerer bort verdier som ikke er tall', () => {
    window.localStorage.setItem(NOKKEL_KJOP, '{"a":2,"b":"tre","c":null,"d":true}')
    expect(lesKjop()).toEqual({ a: 2 })
  })

  it('filtrerer bort negative verdier og NaN', () => {
    window.localStorage.setItem(NOKKEL_KJOP, '{"a":-1,"b":2}')
    expect(lesKjop()).toEqual({ b: 2 })
  })

  it('runder desimaltall ned', () => {
    window.localStorage.setItem(NOKKEL_KJOP, '{"a":2.7}')
    expect(lesKjop()).toEqual({ a: 2 })
  })

  it('krasjer ikke når localStorage kaster', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blokkert')
    })
    expect(() => lesKjop()).not.toThrow()
    expect(lesKjop()).toEqual({})
  })

  it('krasjer ikke når skriving kaster', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('full')
    })
    expect(() => skrivKjop({ a: 1 })).not.toThrow()
  })
})

describe('tommKjop', () => {
  it('sletter alt', () => {
    skrivKjop({ a: 1 })
    tommKjop()
    expect(lesKjop()).toEqual({})
  })

  it('rører ikke opplåst-flagget', () => {
    settOpplast(true)
    tommKjop()
    expect(erOpplast()).toBe(true)
  })
})

describe('opplåst-flagget', () => {
  it('er usant til det settes', () => {
    expect(erOpplast()).toBe(false)
  })

  it('settes og leses', () => {
    settOpplast(true)
    expect(erOpplast()).toBe(true)
  })

  it('fjernes igjen', () => {
    settOpplast(true)
    settOpplast(false)
    expect(erOpplast()).toBe(false)
    expect(window.localStorage.getItem(NOKKEL_OPPLAST)).toBeNull()
  })

  it('godtar ikke vilkårlig verdi i nøkkelen', () => {
    window.localStorage.setItem(NOKKEL_OPPLAST, 'kanskje')
    expect(erOpplast()).toBe(false)
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/lib/lagring.test.ts`
Expected: FAIL — `Failed to resolve import "./lagring"`.

- [ ] **Step 3: Write the implementation**

Create `src/lib/lagring.ts`:

```ts
/**
 * Innpakning rundt localStorage.
 *
 * Alle funksjoner er trygge å kalle under server-rendering (de returnerer
 * nøytrale verdier når `window` mangler) og trygge når localStorage kaster —
 * som i privat modus eller når nettleseren blokkerer lagring. Da faller vi
 * tilbake til et minnekart, slik at appen fungerer i økten selv om ingenting
 * overlever en omlasting.
 *
 * MERK: kall aldri disse under render. Statisk eksport betyr at HTML-en
 * bygges uten localStorage; leser du under render blir klient og server
 * ulike, og React klager på hydreringsavvik. Bruk useEffect.
 */
export type KjopKart = Record<string, number>

export const NOKKEL_KJOP = 'handleliste:kjop:v1'
export const NOKKEL_OPPLAST = 'handleliste:opplast:v1'

const RESERVE = new Map<string, string>()

function les(nokkel: string): string | null {
  try {
    return window.localStorage.getItem(nokkel)
  } catch {
    return RESERVE.get(nokkel) ?? null
  }
}

function skriv(nokkel: string, verdi: string): void {
  try {
    window.localStorage.setItem(nokkel, verdi)
  } catch {
    RESERVE.set(nokkel, verdi)
  }
}

function fjern(nokkel: string): void {
  try {
    window.localStorage.removeItem(nokkel)
  } catch {
    RESERVE.delete(nokkel)
  }
}

export function lesKjop(): KjopKart {
  if (typeof window === 'undefined') return {}

  const rå = les(NOKKEL_KJOP)
  if (!rå) return {}

  let tolket: unknown
  try {
    tolket = JSON.parse(rå)
  } catch {
    return {}
  }

  if (typeof tolket !== 'object' || tolket === null || Array.isArray(tolket)) return {}

  const kart: KjopKart = {}
  for (const [id, verdi] of Object.entries(tolket)) {
    if (typeof verdi === 'number' && Number.isFinite(verdi) && verdi > 0) {
      kart[id] = Math.floor(verdi)
    }
  }
  return kart
}

export function skrivKjop(kart: KjopKart): void {
  if (typeof window === 'undefined') return

  const rensket: KjopKart = {}
  for (const [id, verdi] of Object.entries(kart)) {
    if (verdi > 0) rensket[id] = verdi
  }
  skriv(NOKKEL_KJOP, JSON.stringify(rensket))
}

export function tommKjop(): void {
  if (typeof window === 'undefined') return
  fjern(NOKKEL_KJOP)
}

export function erOpplast(): boolean {
  if (typeof window === 'undefined') return false
  return les(NOKKEL_OPPLAST) === 'ja'
}

export function settOpplast(verdi: boolean): void {
  if (typeof window === 'undefined') return
  if (verdi) skriv(NOKKEL_OPPLAST, 'ja')
  else fjern(NOKKEL_OPPLAST)
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run src/lib/lagring.test.ts`
Expected: PASS, 17 tests.

- [ ] **Step 5: Commit**

```bash
git add src/lib/lagring.ts src/lib/lagring.test.ts
git commit -m "feat: legg til trygg localStorage-innpakning"
```

---

### Task 6: Shopping-mode filter

**Files:**
- Create: `src/lib/filter.ts`
- Test: `src/lib/filter.test.ts`

**Interfaces:**
- Consumes: `Kategori` (Task 4), `KjopKart` (Task 5).
- Produces:
  - `filtrerHandletur(kategorier: readonly Kategori[], kjop: KjopKart): Kategori[]`
  - `antallValgte(kjop: KjopKart): number`
  - `antallIKategori(kategori: Kategori, kjop: KjopKart): number`

- [ ] **Step 1: Write the failing test**

Create `src/lib/filter.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import type { Kategori } from '@/data/handleliste'
import { antallIKategori, antallValgte, filtrerHandletur } from './filter'

const kategorier: Kategori[] = [
  {
    id: 'drikkevarer',
    navn: 'Drikkevarer',
    varer: [
      { id: 'a', vare: 'Melk' },
      { id: 'b', vare: 'Juice' },
    ],
  },
  { id: 'godis', navn: 'Godis', varer: [{ id: 'c', vare: 'Twist' }] },
]

describe('filtrerHandletur', () => {
  it('tar bare med varer med antall over null', () => {
    const ut = filtrerHandletur(kategorier, { a: 2 })
    expect(ut).toHaveLength(1)
    expect(ut[0].varer.map((v) => v.id)).toEqual(['a'])
  })

  it('fjerner kategorier som blir tomme', () => {
    const ut = filtrerHandletur(kategorier, { c: 1 })
    expect(ut.map((k) => k.navn)).toEqual(['Godis'])
  })

  it('gir tom liste når ingenting er valgt', () => {
    expect(filtrerHandletur(kategorier, {})).toEqual([])
  })

  it('regner null som ikke valgt', () => {
    expect(filtrerHandletur(kategorier, { a: 0 })).toEqual([])
  })

  it('endrer ikke det opprinnelige datasettet', () => {
    filtrerHandletur(kategorier, { a: 1 })
    expect(kategorier[0].varer).toHaveLength(2)
  })

  it('bevarer rekkefølgen', () => {
    const ut = filtrerHandletur(kategorier, { b: 1, c: 1 })
    expect(ut.map((k) => k.navn)).toEqual(['Drikkevarer', 'Godis'])
  })
})

describe('antallValgte', () => {
  it('teller varelinjer, ikke summen av antall', () => {
    expect(antallValgte({ a: 5, b: 2 })).toBe(2)
  })

  it('ser bort fra nuller', () => {
    expect(antallValgte({ a: 0, b: 1 })).toBe(1)
  })

  it('er null for tomt kart', () => {
    expect(antallValgte({})).toBe(0)
  })
})

describe('antallIKategori', () => {
  it('teller valgte varer i én kategori', () => {
    expect(antallIKategori(kategorier[0], { a: 1, c: 9 })).toBe(1)
  })

  it('er null når ingenting er valgt', () => {
    expect(antallIKategori(kategorier[0], {})).toBe(0)
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/lib/filter.test.ts`
Expected: FAIL — `Failed to resolve import "./filter"`.

- [ ] **Step 3: Write the implementation**

Create `src/lib/filter.ts`:

```ts
import type { Kategori } from '@/data/handleliste'
import type { KjopKart } from './lagring'

/**
 * Reduserer lista til det som faktisk skal kjøpes.
 *
 * Returnerer nye objekter — kategoriene fra data-modulen er delt tilstand og
 * skal aldri muteres.
 */
export function filtrerHandletur(
  kategorier: readonly Kategori[],
  kjop: KjopKart,
): Kategori[] {
  return kategorier
    .map((kategori) => ({
      ...kategori,
      varer: kategori.varer.filter((vare) => (kjop[vare.id] ?? 0) > 0),
    }))
    .filter((kategori) => kategori.varer.length > 0)
}

/** Antall varelinjer som er valgt — ikke summen av antallene. */
export function antallValgte(kjop: KjopKart): number {
  return Object.values(kjop).filter((antall) => antall > 0).length
}

/** Antall valgte varelinjer innenfor én kategori. */
export function antallIKategori(kategori: Kategori, kjop: KjopKart): number {
  return kategori.varer.filter((vare) => (kjop[vare.id] ?? 0) > 0).length
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run src/lib/filter.test.ts`
Expected: PASS, 11 tests.

- [ ] **Step 5: Commit**

```bash
git add src/lib/filter.ts src/lib/filter.test.ts
git commit -m "feat: legg til filter for handletur-modus"
```

---

### Task 7: Design tokens and global styling

**Files:**
- Create: `src/app/globals.css`
- Modify: `src/app/layout.tsx` (replaces the Task 1 placeholder)

**Interfaces:**
- Consumes: `BASE_PATH` (Task 1).
- Produces: CSS custom properties used by every component's CSS module. Names are fixed here and referenced literally in Tasks 8–10:
  `--flate`, `--flate-hev`, `--kant`, `--tekst`, `--tekst-dempet`, `--merke`, `--merke-tekst`, `--valgt-flate`, `--valgt-kant`, `--radius`, `--trykkflate`.

- [ ] **Step 1: Create `src/app/globals.css`**

```css
/*
 * Fargene er definert som variabler ett sted, og bare overstyrt i mørk modus.
 * Begge temaer holder minst 4.5:1 kontrast på brødtekst.
 */
:root {
  --merke: #1b4d3e;
  --merke-tekst: #f5f1e8;
  --flate: #f7f6f2;
  --flate-hev: #ffffff;
  --kant: #dedbd2;
  --tekst: #16201c;
  --tekst-dempet: #5c6b64;
  --valgt-flate: #e6f0ea;
  --valgt-kant: #1b4d3e;
  --radius: 12px;
  /* Minste trykkflate. Under dette blir knappene vanskelige med tommelen. */
  --trykkflate: 44px;
}

@media (prefers-color-scheme: dark) {
  :root {
    --merke: #2f7d63;
    --merke-tekst: #f5f1e8;
    --flate: #121715;
    --flate-hev: #1b2320;
    --kant: #2e3a35;
    --tekst: #e8ede9;
    --tekst-dempet: #9aa8a1;
    --valgt-flate: #1c3229;
    --valgt-kant: #4bbf95;
  }
}

* {
  box-sizing: border-box;
}

html {
  /* Hindrer at iOS/Android forstørrer teksten når telefonen brettes ut. */
  -webkit-text-size-adjust: 100%;
}

body {
  margin: 0;
  background: var(--flate);
  color: var(--tekst);
  font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
  font-size: 16px;
  line-height: 1.4;
  /* Plass til systemlinjer når appen kjører i standalone-modus. */
  padding-bottom: env(safe-area-inset-bottom);
}

button {
  font: inherit;
  color: inherit;
  cursor: pointer;
}

input {
  font: inherit;
}

/* Synlig fokusmarkering for tastaturbruk, uten ring ved museklikk. */
:focus-visible {
  outline: 3px solid var(--valgt-kant);
  outline-offset: 2px;
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

- [ ] **Step 2: Replace `src/app/layout.tsx`**

```tsx
import type { Metadata, Viewport } from 'next'
import type { ReactNode } from 'react'
import './globals.css'

export const metadata: Metadata = {
  title: 'Handleliste Tønsberg',
  description: 'Handleliste for Tønsberg',
  appleWebApp: {
    capable: true,
    title: 'Handleliste',
    statusBarStyle: 'black-translucent',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  // Ikke lås zoom — brukeren må kunne forstørre teksten.
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f7f6f2' },
    { media: '(prefers-color-scheme: dark)', color: '#121715' },
  ],
}

export default function RotOppsett({ children }: { children: ReactNode }) {
  return (
    <html lang="nb">
      <body>{children}</body>
    </html>
  )
}
```

- [ ] **Step 3: Verify the build still passes**

```bash
npm run build
```

Expected: build succeeds, `out/index.html` exists.

- [ ] **Step 4: Commit**

```bash
git add src/app/globals.css src/app/layout.tsx
git commit -m "feat: legg til fargevariabler og globalt oppsett med lyst og mørkt tema"
```

---

### Task 8: Item row with counter

**Files:**
- Create: `src/components/VareRad.tsx`, `src/components/VareRad.module.css`
- Test: `src/components/VareRad.test.tsx`

**Interfaces:**
- Consumes: `Vare` (Task 4), CSS variables (Task 7).
- Produces: `<VareRad vare={vare} antall={number} onEndre={(id: string, antall: number) => void} />`. Task 9 renders it.

**Behaviour that must hold:** `−` is disabled at 0 so the count can never go negative; typing non-digits yields 0, never `NaN`; a row with a count above 0 is visually marked.

- [ ] **Step 1: Write the failing test**

Create `src/components/VareRad.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { VareRad } from './VareRad'

const vare = {
  id: 'drikkevarer-eplejuice-eldorado',
  vare: 'Eplejuice',
  merke: 'Eldorado',
  borHa: '5',
  forpakning: '1,75l',
  kommentar: 'Fersk',
}

describe('VareRad', () => {
  it('viser varenavn, merke, forpakning og kommentar', () => {
    render(<VareRad vare={vare} antall={0} onEndre={vi.fn()} />)
    expect(screen.getByText('Eplejuice')).toBeInTheDocument()
    expect(screen.getByText(/Eldorado/)).toBeInTheDocument()
    expect(screen.getByText(/1,75l/)).toBeInTheDocument()
    expect(screen.getByText('Fersk')).toBeInTheDocument()
    expect(screen.getByText(/Bør ha 5/)).toBeInTheDocument()
  })

  it('viser bare varenavnet når resten mangler', () => {
    render(<VareRad vare={{ id: 'x', vare: 'Sylte' }} antall={0} onEndre={vi.fn()} />)
    expect(screen.getByText('Sylte')).toBeInTheDocument()
    expect(screen.queryByText(/Bør ha/)).not.toBeInTheDocument()
  })

  it('deaktiverer minusknappen på null', () => {
    render(<VareRad vare={vare} antall={0} onEndre={vi.fn()} />)
    expect(screen.getByRole('button', { name: /færre/i })).toBeDisabled()
  })

  it('aktiverer minusknappen over null', () => {
    render(<VareRad vare={vare} antall={1} onEndre={vi.fn()} />)
    expect(screen.getByRole('button', { name: /færre/i })).toBeEnabled()
  })

  it('øker med én', async () => {
    const onEndre = vi.fn()
    render(<VareRad vare={vare} antall={2} onEndre={onEndre} />)
    await userEvent.click(screen.getByRole('button', { name: /flere/i }))
    expect(onEndre).toHaveBeenCalledWith(vare.id, 3)
  })

  it('reduserer med én', async () => {
    const onEndre = vi.fn()
    render(<VareRad vare={vare} antall={2} onEndre={onEndre} />)
    await userEvent.click(screen.getByRole('button', { name: /færre/i }))
    expect(onEndre).toHaveBeenCalledWith(vare.id, 1)
  })

  it('tolker skrevet tall', async () => {
    const onEndre = vi.fn()
    render(<VareRad vare={vare} antall={0} onEndre={onEndre} />)
    await userEvent.type(screen.getByRole('textbox', { name: /antall/i }), '7')
    expect(onEndre).toHaveBeenCalledWith(vare.id, 7)
  })

  it('gir null — ikke NaN — når feltet tømmes', async () => {
    const onEndre = vi.fn()
    render(<VareRad vare={vare} antall={5} onEndre={onEndre} />)
    await userEvent.clear(screen.getByRole('textbox', { name: /antall/i }))
    expect(onEndre).toHaveBeenCalledWith(vare.id, 0)
    expect(onEndre.mock.calls.every(([, n]) => !Number.isNaN(n))).toBe(true)
  })

  it('ser bort fra bokstaver i feltet', async () => {
    const onEndre = vi.fn()
    render(<VareRad vare={vare} antall={0} onEndre={onEndre} />)
    await userEvent.type(screen.getByRole('textbox', { name: /antall/i }), 'a')
    expect(onEndre).toHaveBeenCalledWith(vare.id, 0)
  })

  it('merker raden når noe er valgt', () => {
    const { rerender } = render(<VareRad vare={vare} antall={0} onEndre={vi.fn()} />)
    expect(screen.getByRole('listitem')).toHaveAttribute('data-valgt', 'false')
    rerender(<VareRad vare={vare} antall={2} onEndre={vi.fn()} />)
    expect(screen.getByRole('listitem')).toHaveAttribute('data-valgt', 'true')
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/components/VareRad.test.tsx`
Expected: FAIL — `Failed to resolve import "./VareRad"`.

- [ ] **Step 3: Write the component**

Create `src/components/VareRad.tsx`:

```tsx
'use client'

import type { Vare } from '@/data/handleliste'
import stiler from './VareRad.module.css'

type Props = {
  vare: Vare
  antall: number
  onEndre: (id: string, antall: number) => void
}

export function VareRad({ vare, antall, onEndre }: Props) {
  const detaljer = [vare.merke, vare.forpakning].filter(Boolean).join(' · ')

  function skrevet(tekst: string) {
    // Fjern alt som ikke er siffer, slik at et tomt felt blir 0 og ikke NaN.
    const bare = tekst.replace(/\D/g, '')
    onEndre(vare.id, bare === '' ? 0 : Number.parseInt(bare, 10))
  }

  return (
    <li className={stiler.rad} data-valgt={antall > 0}>
      <div className={stiler.tekst}>
        <span className={stiler.navn}>{vare.vare}</span>
        {detaljer && <span className={stiler.detaljer}>{detaljer}</span>}
        {vare.kommentar && <span className={stiler.kommentar}>{vare.kommentar}</span>}
      </div>

      <div className={stiler.teller}>
        {vare.borHa && <span className={stiler.borHa}>Bør ha {vare.borHa}</span>}
        <button
          type="button"
          className={stiler.knapp}
          aria-label={`Færre ${vare.vare}`}
          disabled={antall === 0}
          onClick={() => onEndre(vare.id, antall - 1)}
        >
          −
        </button>
        <input
          className={stiler.felt}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          aria-label={`Antall ${vare.vare}`}
          value={String(antall)}
          onChange={(e) => skrevet(e.target.value)}
          onFocus={(e) => e.target.select()}
        />
        <button
          type="button"
          className={stiler.knapp}
          aria-label={`Flere ${vare.vare}`}
          onClick={() => onEndre(vare.id, antall + 1)}
        >
          +
        </button>
      </div>
    </li>
  )
}
```

- [ ] **Step 4: Write the styles**

Create `src/components/VareRad.module.css`:

```css
.rad {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.5rem 0.75rem;
  border-top: 1px solid var(--kant);
  border-left: 3px solid transparent;
  list-style: none;
}

.rad[data-valgt='true'] {
  background: var(--valgt-flate);
  border-left-color: var(--valgt-kant);
}

.tekst {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.navn {
  font-weight: 600;
  /* Lange varenavn skal brytes, ikke kuttes. */
  overflow-wrap: anywhere;
}

.detaljer,
.kommentar {
  color: var(--tekst-dempet);
  font-size: 0.8125rem;
  overflow-wrap: anywhere;
}

.kommentar {
  font-size: 0.75rem;
  font-style: italic;
}

.teller {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  flex-shrink: 0;
}

.borHa {
  color: var(--tekst-dempet);
  font-size: 0.75rem;
  white-space: nowrap;
  margin-right: 0.25rem;
}

.knapp {
  width: var(--trykkflate);
  height: var(--trykkflate);
  border: 1px solid var(--kant);
  border-radius: 50%;
  background: var(--flate-hev);
  font-size: 1.25rem;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.knapp:disabled {
  opacity: 0.35;
  cursor: default;
}

.felt {
  width: 2.75rem;
  height: var(--trykkflate);
  text-align: center;
  border: 1px solid var(--kant);
  border-radius: var(--radius);
  background: var(--flate-hev);
  color: var(--tekst);
  font-variant-numeric: tabular-nums;
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `npx vitest run src/components/VareRad.test.tsx`
Expected: PASS, 11 tests.

- [ ] **Step 6: Commit**

```bash
git add src/components/VareRad.tsx src/components/VareRad.module.css src/components/VareRad.test.tsx
git commit -m "feat: legg til varerad med teller"
```

---

### Task 9: Category card and multi-column grid

**Files:**
- Create: `src/components/KategoriKort.tsx`, `src/components/KategoriKort.module.css`
- Create: `src/components/Rutenett.tsx`, `src/components/Rutenett.module.css`
- Test: `src/components/KategoriKort.test.tsx`

**Interfaces:**
- Consumes: `Kategori` (Task 4), `KjopKart` (Task 5), `antallIKategori` (Task 6), `VareRad` (Task 8).
- Produces:
  - `<KategoriKort kategori={Kategori} kjop={KjopKart} onEndre={(id, antall) => void} />`
  - `<Rutenett>{children}</Rutenett>` — the multi-column container. Task 10 uses both.

- [ ] **Step 1: Write the failing test**

Create `src/components/KategoriKort.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { Kategori } from '@/data/handleliste'
import { KategoriKort } from './KategoriKort'

const kategori: Kategori = {
  id: 'godis',
  navn: 'Godis',
  varer: [
    { id: 'godis-twist', vare: 'Twist', borHa: '2-3' },
    { id: 'godis-mandler', vare: 'Mandler' },
  ],
}

describe('KategoriKort', () => {
  it('viser kategorinavnet', () => {
    render(<KategoriKort kategori={kategori} kjop={{}} onEndre={vi.fn()} />)
    expect(screen.getByRole('heading', { name: 'Godis' })).toBeInTheDocument()
  })

  it('viser alle varene', () => {
    render(<KategoriKort kategori={kategori} kjop={{}} onEndre={vi.fn()} />)
    expect(screen.getAllByRole('listitem')).toHaveLength(2)
  })

  it('viser ikke antallsmerke når ingenting er valgt', () => {
    render(<KategoriKort kategori={kategori} kjop={{}} onEndre={vi.fn()} />)
    expect(screen.queryByTestId('antall-merke')).not.toBeInTheDocument()
  })

  it('viser antall valgte varer i kategorien', () => {
    render(<KategoriKort kategori={kategori} kjop={{ 'godis-twist': 3 }} onEndre={vi.fn()} />)
    expect(screen.getByTestId('antall-merke')).toHaveTextContent('1')
  })

  it('sender antallet videre til hver rad', () => {
    render(<KategoriKort kategori={kategori} kjop={{ 'godis-twist': 3 }} onEndre={vi.fn()} />)
    expect(screen.getByRole('textbox', { name: /Antall Twist/i })).toHaveValue('3')
    expect(screen.getByRole('textbox', { name: /Antall Mandler/i })).toHaveValue('0')
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/components/KategoriKort.test.tsx`
Expected: FAIL — `Failed to resolve import "./KategoriKort"`.

- [ ] **Step 3: Write `KategoriKort`**

Create `src/components/KategoriKort.tsx`:

```tsx
'use client'

import type { Kategori } from '@/data/handleliste'
import { antallIKategori } from '@/lib/filter'
import type { KjopKart } from '@/lib/lagring'
import { VareRad } from './VareRad'
import stiler from './KategoriKort.module.css'

type Props = {
  kategori: Kategori
  kjop: KjopKart
  onEndre: (id: string, antall: number) => void
}

export function KategoriKort({ kategori, kjop, onEndre }: Props) {
  const valgte = antallIKategori(kategori, kjop)

  return (
    <section className={stiler.kort} aria-labelledby={`kat-${kategori.id}`}>
      <h2 className={stiler.tittel} id={`kat-${kategori.id}`}>
        <span className={stiler.navn}>{kategori.navn}</span>
        {valgte > 0 && (
          <span className={stiler.merke} data-testid="antall-merke" aria-label={`${valgte} valgt`}>
            {valgte}
          </span>
        )}
      </h2>
      <ul className={stiler.liste}>
        {kategori.varer.map((vare) => (
          <VareRad
            key={vare.id}
            vare={vare}
            antall={kjop[vare.id] ?? 0}
            onEndre={onEndre}
          />
        ))}
      </ul>
    </section>
  )
}
```

- [ ] **Step 4: Write `KategoriKort.module.css`**

```css
.kort {
  background: var(--flate-hev);
  border: 1px solid var(--kant);
  border-radius: var(--radius);
  overflow: hidden;
  /* Kortet skal aldri deles over to spalter. */
  break-inside: avoid;
  page-break-inside: avoid;
  margin: 0 0 1rem;
}

.tittel {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  margin: 0;
  padding: 0.625rem 0.75rem;
  background: var(--merke);
  color: var(--merke-tekst);
  font-size: 0.9375rem;
  font-weight: 700;
  letter-spacing: 0.02em;
  text-transform: uppercase;
}

.navn {
  min-width: 0;
  overflow-wrap: anywhere;
}

.merke {
  flex-shrink: 0;
  min-width: 1.5rem;
  padding: 0.0625rem 0.4rem;
  border-radius: 999px;
  background: var(--merke-tekst);
  color: var(--merke);
  font-size: 0.8125rem;
  text-align: center;
}

.liste {
  margin: 0;
  padding: 0;
  list-style: none;
}

/* Første rad trenger ikke skillelinje mot overskriften. */
.liste > :first-child {
  border-top: none;
}
```

- [ ] **Step 5: Write `Rutenett`**

Create `src/components/Rutenett.tsx`:

```tsx
import type { ReactNode } from 'react'
import stiler from './Rutenett.module.css'

/**
 * Spaltebeholder for kategorikortene.
 *
 * Bruker CSS multi-column framfor grid fordi kortene har svært ulik høyde
 * (Pålegg har 41 varer, «Sesongvarer, jul» har 1). Grid ville gitt store hull.
 * Brytepunktene følger bredde, ikke enhet, slik at layouten følger med når
 * telefonen brettes ut midt i bruk.
 */
export function Rutenett({ children }: { children: ReactNode }) {
  return <div className={stiler.rutenett}>{children}</div>
}
```

Create `src/components/Rutenett.module.css`:

```css
.rutenett {
  column-count: 1;
  column-gap: 1rem;
  padding: 1rem;
  max-width: 1600px;
  margin: 0 auto;
}

/* Fold 6 utbrettet, portrett */
@media (min-width: 640px) {
  .rutenett {
    column-count: 2;
  }
}

/* Utbrettet landskap og desktop */
@media (min-width: 1000px) {
  .rutenett {
    column-count: 3;
  }
}
```

- [ ] **Step 6: Run the test to verify it passes**

Run: `npx vitest run src/components/KategoriKort.test.tsx`
Expected: PASS, 5 tests.

- [ ] **Step 7: Commit**

```bash
git add src/components/KategoriKort.tsx src/components/KategoriKort.module.css \
        src/components/Rutenett.tsx src/components/Rutenett.module.css \
        src/components/KategoriKort.test.tsx
git commit -m "feat: legg til kategorikort og spaltelayout"
```

---

### Task 10: Toolbar

**Files:**
- Create: `src/components/Verktoylinje.tsx`, `src/components/Verktoylinje.module.css`
- Test: `src/components/Verktoylinje.test.tsx`

**Interfaces:**
- Consumes: CSS variables (Task 7).
- Produces:
  ```ts
  <Verktoylinje
    antallValgte={number}
    handletur={boolean}
    onBytteHandletur={() => void}
    onNullstill={() => void}
    onLoggUt={() => void}
  />
  ```
  Task 11 renders it.

**Behaviour that must hold:** `Nullstill` requires two taps. The first tap arms it and relabels it `Sikker?`; the second within 4 seconds fires `onNullstill`. Waiting disarms it. This is the guard against wiping real work on a mis-tap.

- [ ] **Step 1: Write the failing test**

Create `src/components/Verktoylinje.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Verktoylinje } from './Verktoylinje'

function oppsett(overstyr = {}) {
  const props = {
    antallValgte: 0,
    handletur: false,
    onBytteHandletur: vi.fn(),
    onNullstill: vi.fn(),
    onLoggUt: vi.fn(),
    ...overstyr,
  }
  render(<Verktoylinje {...props} />)
  return props
}

describe('Verktoylinje', () => {
  it('viser antall valgte varer', () => {
    oppsett({ antallValgte: 7 })
    expect(screen.getByText(/7/)).toBeInTheDocument()
  })

  it('bytter handletur-modus', async () => {
    const props = oppsett()
    await userEvent.click(screen.getByRole('switch', { name: /handletur/i }))
    expect(props.onBytteHandletur).toHaveBeenCalledOnce()
  })

  it('viser modusen i switch-tilstanden', () => {
    oppsett({ handletur: true })
    expect(screen.getByRole('switch', { name: /handletur/i })).toBeChecked()
  })

  it('logger ut', async () => {
    const props = oppsett()
    await userEvent.click(screen.getByRole('button', { name: /logg ut/i }))
    expect(props.onLoggUt).toHaveBeenCalledOnce()
  })
})

describe('Nullstill', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  const bruker = () => userEvent.setup({ advanceTimers: vi.advanceTimersByTime })

  it('sletter ingenting på første trykk', async () => {
    const props = oppsett()
    await bruker().click(screen.getByRole('button', { name: /nullstill/i }))
    expect(props.onNullstill).not.toHaveBeenCalled()
  })

  it('ber om bekreftelse på første trykk', async () => {
    oppsett()
    await bruker().click(screen.getByRole('button', { name: /nullstill/i }))
    expect(screen.getByRole('button', { name: /sikker/i })).toBeInTheDocument()
  })

  it('sletter på andre trykk', async () => {
    const props = oppsett()
    const b = bruker()
    await b.click(screen.getByRole('button', { name: /nullstill/i }))
    await b.click(screen.getByRole('button', { name: /sikker/i }))
    expect(props.onNullstill).toHaveBeenCalledOnce()
  })

  it('avvæpnes når man venter', async () => {
    const props = oppsett()
    await bruker().click(screen.getByRole('button', { name: /nullstill/i }))
    await vi.advanceTimersByTimeAsync(4500)
    expect(screen.getByRole('button', { name: /nullstill/i })).toBeInTheDocument()
    expect(props.onNullstill).not.toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/components/Verktoylinje.test.tsx`
Expected: FAIL — `Failed to resolve import "./Verktoylinje"`.

- [ ] **Step 3: Write the component**

Create `src/components/Verktoylinje.tsx`:

```tsx
'use client'

import { useEffect, useState } from 'react'
import stiler from './Verktoylinje.module.css'

const BEKREFT_MS = 4000

type Props = {
  antallValgte: number
  handletur: boolean
  onBytteHandletur: () => void
  onNullstill: () => void
  onLoggUt: () => void
}

export function Verktoylinje({
  antallValgte,
  handletur,
  onBytteHandletur,
  onNullstill,
  onLoggUt,
}: Props) {
  // To-trinns sletting: ett feiltrykk skal ikke kunne slette ekte arbeid.
  const [bekrefter, setBekrefter] = useState(false)

  useEffect(() => {
    if (!bekrefter) return
    const id = setTimeout(() => setBekrefter(false), BEKREFT_MS)
    return () => clearTimeout(id)
  }, [bekrefter])

  function trykkNullstill() {
    if (bekrefter) {
      setBekrefter(false)
      onNullstill()
    } else {
      setBekrefter(true)
    }
  }

  return (
    <header className={stiler.linje}>
      <div className={stiler.venstre}>
        <span className={stiler.tittel}>Handleliste</span>
        <span className={stiler.antall}>{antallValgte} valgt</span>
      </div>

      <div className={stiler.hoyre}>
        <button
          type="button"
          role="switch"
          aria-checked={handletur}
          className={stiler.bryter}
          onClick={onBytteHandletur}
        >
          Handletur
        </button>

        <button
          type="button"
          className={bekrefter ? stiler.fareAktiv : stiler.fare}
          onClick={trykkNullstill}
        >
          {bekrefter ? 'Sikker?' : 'Nullstill'}
        </button>

        <button type="button" className={stiler.knapp} onClick={onLoggUt}>
          Logg ut
        </button>
      </div>
    </header>
  )
}
```

- [ ] **Step 4: Write the styles**

Create `src/components/Verktoylinje.module.css`:

```css
.linje {
  position: sticky;
  top: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  padding-top: max(0.5rem, env(safe-area-inset-top));
  background: var(--merke);
  color: var(--merke-tekst);
}

.venstre {
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
  min-width: 0;
}

.tittel {
  font-weight: 700;
}

.antall {
  font-size: 0.8125rem;
  opacity: 0.85;
  white-space: nowrap;
}

.hoyre {
  display: flex;
  align-items: center;
  gap: 0.375rem;
}

.knapp,
.bryter,
.fare,
.fareAktiv {
  min-height: var(--trykkflate);
  padding: 0 0.75rem;
  border-radius: var(--radius);
  border: 1px solid rgb(255 255 255 / 0.35);
  background: transparent;
  color: var(--merke-tekst);
  font-size: 0.8125rem;
  white-space: nowrap;
}

.bryter[aria-checked='true'] {
  background: var(--merke-tekst);
  color: var(--merke);
  border-color: var(--merke-tekst);
  font-weight: 600;
}

.fareAktiv {
  background: #b3261e;
  border-color: #b3261e;
  color: #ffffff;
  font-weight: 700;
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `npx vitest run src/components/Verktoylinje.test.tsx`
Expected: PASS, 8 tests.

- [ ] **Step 6: Commit**

```bash
git add src/components/Verktoylinje.tsx src/components/Verktoylinje.module.css src/components/Verktoylinje.test.tsx
git commit -m "feat: legg til verktøylinje med handletur-modus og to-trinns nullstilling"
```

---

### Task 11: List container with persistence

**Files:**
- Create: `src/components/Handleliste.tsx`, `src/components/Handleliste.module.css`
- Test: `src/components/Handleliste.test.tsx`

**Interfaces:**
- Consumes: `KATEGORIER` (Task 4); `lesKjop`, `skrivKjop`, `tommKjop`, `KjopKart` (Task 5); `filtrerHandletur`, `antallValgte` (Task 6); `KategoriKort`, `Rutenett` (Task 9); `Verktoylinje` (Task 10).
- Produces: `<Handleliste onLoggUt={() => void} />`. Task 12 renders it.

**Behaviour that must hold:** state loads from `localStorage` in an effect, never during render; nothing is written back until after that first load (otherwise mounting would overwrite saved data with `{}`); counts clamp at 0.

- [ ] **Step 1: Write the failing test**

Create `src/components/Handleliste.test.tsx`:

```tsx
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NOKKEL_KJOP, lesKjop } from '@/lib/lagring'
import { Handleliste } from './Handleliste'

beforeEach(() => window.localStorage.clear())

describe('Handleliste', () => {
  it('viser alle kategoriene', async () => {
    render(<Handleliste onLoggUt={vi.fn()} />)
    expect(await screen.findByRole('heading', { name: 'Drikkevarer' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Varmmat' })).toBeInTheDocument()
  })

  it('laster lagrede verdier fra localStorage', async () => {
    window.localStorage.setItem(
      NOKKEL_KJOP,
      JSON.stringify({ 'drikkevarer-eplejuice-eldorado': 4 }),
    )
    render(<Handleliste onLoggUt={vi.fn()} />)
    const felt = await screen.findByRole('textbox', { name: /Antall Eplejuice/i })
    expect(felt).toHaveValue('4')
  })

  it('overskriver ikke lagrede verdier ved oppstart', async () => {
    window.localStorage.setItem(NOKKEL_KJOP, JSON.stringify({ 'godis-twist': 2 }))
    render(<Handleliste onLoggUt={vi.fn()} />)
    await screen.findByRole('heading', { name: 'Godis' })
    expect(lesKjop()).toEqual({ 'godis-twist': 2 })
  })

  it('lagrer når antallet endres', async () => {
    render(<Handleliste onLoggUt={vi.fn()} />)
    const knapp = await screen.findByRole('button', { name: /Flere Eplejuice/i })
    await userEvent.click(knapp)
    expect(lesKjop()).toEqual({ 'drikkevarer-eplejuice-eldorado': 1 })
  })

  it('oppdaterer antallet i verktøylinja', async () => {
    render(<Handleliste onLoggUt={vi.fn()} />)
    await userEvent.click(await screen.findByRole('button', { name: /Flere Eplejuice/i }))
    expect(screen.getByText('1 valgt')).toBeInTheDocument()
  })

  it('viser bare valgte varer i handletur-modus', async () => {
    render(<Handleliste onLoggUt={vi.fn()} />)
    await userEvent.click(await screen.findByRole('button', { name: /Flere Eplejuice/i }))
    await userEvent.click(screen.getByRole('switch', { name: /handletur/i }))

    expect(screen.getByRole('heading', { name: 'Drikkevarer' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Varmmat' })).not.toBeInTheDocument()
    const drikke = screen.getByRole('heading', { name: 'Drikkevarer' }).closest('section')!
    expect(within(drikke).getAllByRole('listitem')).toHaveLength(1)
  })

  it('viser en forklaring når handletur-modus er tom', async () => {
    render(<Handleliste onLoggUt={vi.fn()} />)
    await screen.findByRole('heading', { name: 'Drikkevarer' })
    await userEvent.click(screen.getByRole('switch', { name: /handletur/i }))
    expect(screen.getByText(/ingenting/i)).toBeInTheDocument()
  })

  it('nullstiller etter to trykk', async () => {
    render(<Handleliste onLoggUt={vi.fn()} />)
    await userEvent.click(await screen.findByRole('button', { name: /Flere Eplejuice/i }))
    await userEvent.click(screen.getByRole('button', { name: /nullstill/i }))
    await userEvent.click(screen.getByRole('button', { name: /sikker/i }))

    expect(lesKjop()).toEqual({})
    expect(screen.getByRole('textbox', { name: /Antall Eplejuice/i })).toHaveValue('0')
  })

  it('lar ikke antallet bli negativt', async () => {
    render(<Handleliste onLoggUt={vi.fn()} />)
    const minus = await screen.findByRole('button', { name: /Færre Eplejuice/i })
    expect(minus).toBeDisabled()
    expect(lesKjop()).toEqual({})
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/components/Handleliste.test.tsx`
Expected: FAIL — `Failed to resolve import "./Handleliste"`.

- [ ] **Step 3: Write the component**

Create `src/components/Handleliste.tsx`:

```tsx
'use client'

import { useEffect, useMemo, useState } from 'react'
import { KATEGORIER } from '@/data/handleliste'
import { antallValgte, filtrerHandletur } from '@/lib/filter'
import { type KjopKart, lesKjop, skrivKjop, tommKjop } from '@/lib/lagring'
import { KategoriKort } from './KategoriKort'
import { Rutenett } from './Rutenett'
import { Verktoylinje } from './Verktoylinje'
import stiler from './Handleliste.module.css'

export function Handleliste({ onLoggUt }: { onLoggUt: () => void }) {
  const [kjop, setKjop] = useState<KjopKart>({})
  const [handletur, setHandletur] = useState(false)
  // Skiller «ikke lest ennå» fra «lest, og tom». Uten dette ville effekten
  // under skrevet {} til localStorage ved montering og slettet alt.
  const [lastet, setLastet] = useState(false)

  useEffect(() => {
    setKjop(lesKjop())
    setLastet(true)
  }, [])

  useEffect(() => {
    if (lastet) skrivKjop(kjop)
  }, [kjop, lastet])

  function endre(id: string, antall: number) {
    const trygt = Math.max(0, Math.floor(antall))
    setKjop((forrige) => {
      const neste = { ...forrige }
      if (trygt === 0) delete neste[id]
      else neste[id] = trygt
      return neste
    })
  }

  function nullstill() {
    setKjop({})
    tommKjop()
  }

  const synlige = useMemo(
    () => (handletur ? filtrerHandletur(KATEGORIER, kjop) : KATEGORIER),
    [handletur, kjop],
  )

  return (
    <>
      <Verktoylinje
        antallValgte={antallValgte(kjop)}
        handletur={handletur}
        onBytteHandletur={() => setHandletur((v) => !v)}
        onNullstill={nullstill}
        onLoggUt={onLoggUt}
      />

      <main>
        {synlige.length === 0 ? (
          <p className={stiler.tom}>
            Du har ikke valgt noe å kjøpe ennå. Slå av handletur-modus for å se
            hele lista.
          </p>
        ) : (
          <Rutenett>
            {synlige.map((kategori) => (
              <KategoriKort
                key={kategori.id}
                kategori={kategori}
                kjop={kjop}
                onEndre={endre}
              />
            ))}
          </Rutenett>
        )}
      </main>
    </>
  )
}
```

- [ ] **Step 4: Write the styles**

Create `src/components/Handleliste.module.css`:

```css
.tom {
  max-width: 28rem;
  margin: 3rem auto;
  padding: 0 1.5rem;
  color: var(--tekst-dempet);
  text-align: center;
  text-wrap: balance;
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `npx vitest run src/components/Handleliste.test.tsx`
Expected: PASS, 9 tests.

- [ ] **Step 6: Commit**

```bash
git add src/components/Handleliste.tsx src/components/Handleliste.module.css src/components/Handleliste.test.tsx
git commit -m "feat: koble lista til localStorage og handletur-modus"
```

---

### Task 12: Password gate and page composition

**Files:**
- Create: `src/components/Passordlas.tsx`, `src/components/Passordlas.module.css`
- Test: `src/components/Passordlas.test.tsx`
- Modify: `src/app/page.tsx` (replaces the Task 1 placeholder)

**Interfaces:**
- Consumes: `erOpplast`, `settOpplast` (Task 5); `Handleliste` (Task 11).
- Produces: `<Passordlas onApnet={() => void} />`; the finished `src/app/page.tsx`.

**Mobile detail that matters:** the password input must set `autoCapitalize="none"`, `autoCorrect="off"` and `spellCheck={false}`. Android keyboards otherwise capitalise the first letter, turning `Tønsberg!` into a login that fails for reasons the user cannot see.

- [ ] **Step 1: Write the failing test**

Create `src/components/Passordlas.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { Passordlas } from './Passordlas'

async function skrivOgSend(passord: string) {
  await userEvent.type(screen.getByLabelText(/passord/i), passord)
  await userEvent.click(screen.getByRole('button', { name: /logg inn/i }))
}

describe('Passordlas', () => {
  it('slipper inn med riktig passord', async () => {
    const onApnet = vi.fn()
    render(<Passordlas onApnet={onApnet} />)
    await skrivOgSend('Tønsberg!')
    expect(onApnet).toHaveBeenCalledOnce()
  })

  it('avviser feil passord', async () => {
    const onApnet = vi.fn()
    render(<Passordlas onApnet={onApnet} />)
    await skrivOgSend('feil')
    expect(onApnet).not.toHaveBeenCalled()
    expect(screen.getByRole('alert')).toHaveTextContent(/feil passord/i)
  })

  it('er følsomt for store og små bokstaver', async () => {
    const onApnet = vi.fn()
    render(<Passordlas onApnet={onApnet} />)
    await skrivOgSend('tønsberg!')
    expect(onApnet).not.toHaveBeenCalled()
  })

  it('ser bort fra mellomrom rundt passordet', async () => {
    const onApnet = vi.fn()
    render(<Passordlas onApnet={onApnet} />)
    await skrivOgSend('  Tønsberg!  ')
    expect(onApnet).toHaveBeenCalledOnce()
  })

  it('slår av autoretting slik at mobiltastaturet ikke ødelegger passordet', () => {
    render(<Passordlas onApnet={vi.fn()} />)
    const felt = screen.getByLabelText(/passord/i)
    expect(felt).toHaveAttribute('autocapitalize', 'none')
    expect(felt).toHaveAttribute('autocorrect', 'off')
    expect(felt).toHaveAttribute('spellcheck', 'false')
  })

  it('viser ingen feilmelding før man har prøvd', () => {
    render(<Passordlas onApnet={vi.fn()} />)
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('fjerner feilmeldingen når man skriver på nytt', async () => {
    render(<Passordlas onApnet={vi.fn()} />)
    await skrivOgSend('feil')
    expect(screen.getByRole('alert')).toBeInTheDocument()
    await userEvent.type(screen.getByLabelText(/passord/i), 'x')
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/components/Passordlas.test.tsx`
Expected: FAIL — `Failed to resolve import "./Passordlas"`.

- [ ] **Step 3: Write the component**

Create `src/components/Passordlas.tsx`:

```tsx
'use client'

import { type FormEvent, useState } from 'react'
import stiler from './Passordlas.module.css'

/**
 * MERK: dette er skjuling, ikke sikkerhet.
 *
 * Strengen ligger i JavaScript-bundelen og kan leses av hvem som helst med
 * utviklerverktøy. Den holder lista unna tilfeldige forbipasserende på en
 * offentlig URL — ingenting mer. Ikke legg noe hemmelig i denne appen.
 *
 * Hashing ville ikke hjulpet: den som kan lese hashen kan lese koden som
 * sammenligner den, og ville bare gitt en falsk følelse av trygghet.
 */
const PASSORD = 'Tønsberg!'

export function Passordlas({ onApnet }: { onApnet: () => void }) {
  const [verdi, setVerdi] = useState('')
  const [feil, setFeil] = useState(false)

  function send(e: FormEvent) {
    e.preventDefault()
    if (verdi.trim() === PASSORD) onApnet()
    else setFeil(true)
  }

  return (
    <main className={stiler.skjerm}>
      <form className={stiler.kort} onSubmit={send}>
        <h1 className={stiler.tittel}>Handleliste</h1>
        <p className={stiler.undertittel}>Tønsberg</p>

        <label className={stiler.merkelapp} htmlFor="passord">
          Passord
        </label>
        <input
          id="passord"
          className={stiler.felt}
          type="password"
          value={verdi}
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          autoComplete="current-password"
          onChange={(e) => {
            setVerdi(e.target.value)
            setFeil(false)
          }}
        />

        {feil && (
          <p className={stiler.feil} role="alert">
            Feil passord.
          </p>
        )}

        <button className={stiler.knapp} type="submit">
          Logg inn
        </button>
      </form>
    </main>
  )
}
```

- [ ] **Step 4: Write the styles**

Create `src/components/Passordlas.module.css`:

```css
.skjerm {
  min-height: 100dvh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
  background: var(--merke);
}

.kort {
  width: 100%;
  max-width: 22rem;
  display: flex;
  flex-direction: column;
  padding: 1.5rem;
  border-radius: var(--radius);
  background: var(--flate-hev);
}

.tittel {
  margin: 0;
  font-size: 1.5rem;
}

.undertittel {
  margin: 0 0 1.5rem;
  color: var(--tekst-dempet);
}

.merkelapp {
  margin-bottom: 0.375rem;
  font-size: 0.875rem;
  font-weight: 600;
}

.felt {
  height: var(--trykkflate);
  padding: 0 0.75rem;
  border: 1px solid var(--kant);
  border-radius: var(--radius);
  background: var(--flate);
  color: var(--tekst);
}

.feil {
  margin: 0.5rem 0 0;
  color: #b3261e;
  font-size: 0.875rem;
}

@media (prefers-color-scheme: dark) {
  .feil {
    color: #ff8a80;
  }
}

.knapp {
  margin-top: 1rem;
  min-height: var(--trykkflate);
  border: none;
  border-radius: var(--radius);
  background: var(--merke);
  color: var(--merke-tekst);
  font-weight: 600;
}
```

- [ ] **Step 5: Replace `src/app/page.tsx`**

```tsx
'use client'

import { useEffect, useState } from 'react'
import { Handleliste } from '@/components/Handleliste'
import { Passordlas } from '@/components/Passordlas'
import { erOpplast, settOpplast } from '@/lib/lagring'

export default function Side() {
  const [opplast, setOpplast] = useState(false)
  // Låst-tilstanden kan ikke leses under render (statisk eksport har ingen
  // localStorage), så vi venter én runde før vi bestemmer hva som vises.
  // Uten dette blinker innloggingsskjermen for en bruker som er logget inn.
  const [klar, setKlar] = useState(false)

  useEffect(() => {
    setOpplast(erOpplast())
    setKlar(true)
  }, [])

  if (!klar) return null

  if (!opplast) {
    return (
      <Passordlas
        onApnet={() => {
          settOpplast(true)
          setOpplast(true)
        }}
      />
    )
  }

  return (
    <Handleliste
      onLoggUt={() => {
        settOpplast(false)
        setOpplast(false)
      }}
    />
  )
}
```

- [ ] **Step 6: Run the whole suite**

```bash
npm test
```

Expected: all tests pass across all 8 test files.

- [ ] **Step 7: Commit**

```bash
git add src/components/Passordlas.tsx src/components/Passordlas.module.css \
        src/components/Passordlas.test.tsx src/app/page.tsx
git commit -m "feat: legg til passordlås og koble sammen sida"
```

---

### Task 13: PWA — icons, manifest, service worker

**Files:**
- Create: `scripts/lag-ikoner.py`
- Create (generated): `public/ikon-192.png`, `public/ikon-512.png`, `public/ikon-maskable-512.png`
- Create: `public/sw.js`
- Create: `src/app/manifest.ts`
- Create: `src/components/RegistrerSW.tsx`
- Modify: `src/app/layout.tsx` (add `<RegistrerSW />` and the icon metadata)

**Interfaces:**
- Consumes: `BASE_PATH`, `offentligSti` (Task 1).
- Produces: an installable app. Nothing later depends on it.

**Why hand-written:** Chrome on Android offers "Install app" only when a manifest *and* a service worker with a `fetch` handler are present. `next-pwa` would pull in a large dependency to generate ~30 lines. The service worker cannot import `BASE_PATH` — it is served as a raw file — so it derives its scope from `self.registration.scope` at runtime instead.

- [ ] **Step 1: Write the icon generator**

This is dependency-free on purpose: neither Pillow nor an SVG rasteriser is available on the target machine. It writes PNGs directly with `zlib` and draws with signed-distance functions, supersampled 3× for antialiasing. Verified: produces valid 8-bit RGBA PNGs in about 12 seconds.

Create `scripts/lag-ikoner.py`:

```python
#!/usr/bin/env python3
"""Genererer PWA-ikonene i public/.

Ingen eksterne avhengigheter — verken Pillow eller en SVG-rasterizer finnes
nødvendigvis på maskina. PNG-ene skrives direkte med zlib, og motivet tegnes
med avstandsfunksjoner som samples 3x3 ganger per piksel for kantutjevning.

Kjør én gang:  npm run ikoner
"""
import math
import struct
import zlib
from pathlib import Path

GRONN = (0x1B, 0x4D, 0x3E)
KRITT = (0xF5, 0xF1, 0xE8)
UT = Path(__file__).resolve().parent.parent / 'public'
SS = 3


def skriv_png(sti, bredde, hoyde, piksler):
    raw = b''.join(
        b'\x00' + piksler[y * bredde * 4:(y + 1) * bredde * 4] for y in range(hoyde)
    )

    def blokk(merke, data):
        crc = zlib.crc32(merke + data) & 0xFFFFFFFF
        return struct.pack('>I', len(data)) + merke + data + struct.pack('>I', crc)

    png = (
        b'\x89PNG\r\n\x1a\n'
        + blokk(b'IHDR', struct.pack('>IIBBBBB', bredde, hoyde, 8, 6, 0, 0, 0))
        + blokk(b'IDAT', zlib.compress(raw, 9))
        + blokk(b'IEND', b'')
    )
    sti.write_bytes(png)


def rund_boks(x, y, halv_b, halv_h, radius):
    """Signert avstand til en rektangel med avrundede hjørner."""
    qx = abs(x) - halv_b + radius
    qy = abs(y) - halv_h + radius
    return math.hypot(max(qx, 0.0), max(qy, 0.0)) + min(max(qx, qy), 0.0) - radius


def tegn(storrelse, skala, full_utfall):
    n = storrelse * SS
    ut = bytearray(storrelse * storrelse * 4)
    bakgrunn_radius = 0.0 if full_utfall else 0.2237
    piksel = 1.0 / n

    for py in range(storrelse):
        for px in range(storrelse):
            sum_r = sum_g = sum_b = sum_a = 0.0
            for sy in range(SS):
                for sx in range(SS):
                    u = (px * SS + sx + 0.5) / n - 0.5
                    v = (py * SS + sy + 0.5) / n - 0.5

                    d_bak = rund_boks(u, v, 0.5, 0.5, bakgrunn_radius)
                    a_bak = min(max(0.5 - d_bak / piksel, 0.0), 1.0)

                    gu, gv = u / skala, v / skala
                    d_kropp = rund_boks(gu, gv - 0.115, 0.315, 0.175, 0.045)
                    d_hank = max(
                        abs(math.hypot(gu, gv + 0.055) - 0.115) - 0.026,
                        gv + 0.055,
                    )
                    d_motiv = min(d_kropp, d_hank)
                    a_motiv = min(max(0.5 - d_motiv / (piksel / skala), 0.0), 1.0) * a_bak

                    for i, (bak, fram) in enumerate(zip(GRONN, KRITT)):
                        verdi = bak * a_bak * (1 - a_motiv) + fram * a_motiv
                        if i == 0:
                            sum_r += verdi
                        elif i == 1:
                            sum_g += verdi
                        else:
                            sum_b += verdi
                    sum_a += a_bak

            antall = SS * SS
            i = (py * storrelse + px) * 4
            ut[i:i + 4] = bytes((
                round(sum_r / antall),
                round(sum_g / antall),
                round(sum_b / antall),
                round(255 * sum_a / antall),
            ))
    return bytes(ut)


def main():
    UT.mkdir(parents=True, exist_ok=True)
    # Maskable-ikonet må gå helt ut i kanten og holde motivet innenfor den
    # midtre 80 %-sirkelen, siden Android beskjærer det til vilkårlig form.
    for navn, storrelse, skala, full in [
        ('ikon-192.png', 192, 1.0, False),
        ('ikon-512.png', 512, 1.0, False),
        ('ikon-maskable-512.png', 512, 0.72, True),
    ]:
        skriv_png(UT / navn, storrelse, storrelse, tegn(storrelse, skala, full))
        print('skrev', navn)


if __name__ == '__main__':
    main()
```

- [ ] **Step 2: Generate and verify the icons**

```bash
npm run ikoner
file public/ikon-192.png public/ikon-512.png public/ikon-maskable-512.png
```

Expected: three lines reading `PNG image data, … 8-bit/color RGBA, non-interlaced`, at 192×192, 512×512 and 512×512. Open `public/ikon-512.png` and confirm it shows a cream shopping bag on a dark green rounded square.

- [ ] **Step 3: Write the service worker**

Create `public/sw.js`:

```js
/*
 * Enkel service worker: precacher app-skallet og serverer cache-først.
 *
 * Kan ikke importere BASE_PATH — fila serveres rå, uten bygging. Den utleder
 * i stedet omfanget sitt fra registration.scope under kjøring, og fungerer
 * dermed uansett hva basePath er satt til.
 */
const CACHE = 'handleliste-v1'
const ROT = new URL(self.registration.scope).pathname

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll([ROT]))
      .then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((navn) =>
        Promise.all(navn.filter((n) => n !== CACHE).map((n) => caches.delete(n))),
      )
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const foresporsel = event.request
  if (foresporsel.method !== 'GET') return
  if (new URL(foresporsel.url).origin !== self.location.origin) return

  event.respondWith(
    caches.match(foresporsel).then((truffet) => {
      if (truffet) return truffet
      return fetch(foresporsel)
        .then((svar) => {
          if (svar.ok) {
            const kopi = svar.clone()
            caches.open(CACHE).then((cache) => cache.put(foresporsel, kopi))
          }
          return svar
        })
        .catch(() => caches.match(ROT))
    }),
  )
})
```

- [ ] **Step 4: Write the manifest**

Create `src/app/manifest.ts`:

```ts
import type { MetadataRoute } from 'next'
import { BASE_PATH, offentligSti } from '@/lib/config'

export const dynamic = 'force-static'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Handleliste Tønsberg',
    short_name: 'Handleliste',
    description: 'Handleliste for Tønsberg',
    start_url: `${BASE_PATH}/`,
    scope: `${BASE_PATH}/`,
    display: 'standalone',
    background_color: '#1b4d3e',
    theme_color: '#1b4d3e',
    lang: 'nb',
    icons: [
      { src: offentligSti('ikon-192.png'), sizes: '192x192', type: 'image/png' },
      { src: offentligSti('ikon-512.png'), sizes: '512x512', type: 'image/png' },
      {
        src: offentligSti('ikon-maskable-512.png'),
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  }
}
```

- [ ] **Step 5: Write the service worker registration**

Create `src/components/RegistrerSW.tsx`:

```tsx
'use client'

import { useEffect } from 'react'
import { offentligSti } from '@/lib/config'

/**
 * Registrerer service workeren etter at sida er lastet, slik at den ikke
 * konkurrerer med den første innlastingen. Feiler stille — en nettleser uten
 * støtte skal fortsatt kunne bruke lista.
 */
export function RegistrerSW() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return

    const registrer = () => {
      navigator.serviceWorker
        .register(offentligSti('sw.js'), { scope: offentligSti('') })
        .catch(() => {})
    }

    if (document.readyState === 'complete') {
      registrer()
      return
    }
    window.addEventListener('load', registrer)
    return () => window.removeEventListener('load', registrer)
  }, [])

  return null
}
```

- [ ] **Step 6: Wire it into the layout**

Modify `src/app/layout.tsx` — add the import, the icon metadata, and the component. The file becomes:

```tsx
import type { Metadata, Viewport } from 'next'
import type { ReactNode } from 'react'
import { RegistrerSW } from '@/components/RegistrerSW'
import { offentligSti } from '@/lib/config'
import './globals.css'

export const metadata: Metadata = {
  title: 'Handleliste Tønsberg',
  description: 'Handleliste for Tønsberg',
  manifest: offentligSti('manifest.webmanifest'),
  icons: {
    icon: offentligSti('ikon-192.png'),
    apple: offentligSti('ikon-192.png'),
  },
  appleWebApp: {
    capable: true,
    title: 'Handleliste',
    statusBarStyle: 'black-translucent',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f7f6f2' },
    { media: '(prefers-color-scheme: dark)', color: '#121715' },
  ],
}

export default function RotOppsett({ children }: { children: ReactNode }) {
  return (
    <html lang="nb">
      <body>
        {children}
        <RegistrerSW />
      </body>
    </html>
  )
}
```

- [ ] **Step 7: Build and verify the PWA files land in the export**

```bash
npm run build
ls out/ | head -20
cat out/manifest.webmanifest
```

Expected: `out/` contains `manifest.webmanifest`, `sw.js`, `.nojekyll`, the three icons, and `index.html`. Every path inside `manifest.webmanifest` must begin with `/handleliste/` — including `start_url`, `scope`, and all three icon `src` values. If any path lacks the prefix, `offentligSti` is not being applied.

- [ ] **Step 8: Commit**

```bash
git add scripts/lag-ikoner.py public/ikon-*.png public/sw.js \
        src/app/manifest.ts src/components/RegistrerSW.tsx src/app/layout.tsx
git commit -m "feat: gjør appen installerbar med manifest, ikoner og service worker"
```

---

### Task 14: Deployment and documentation

**Files:**
- Create: `.github/workflows/deploy.yml`
- Create: `README.md`

**Interfaces:**
- Consumes: everything.
- Produces: a live site.

- [ ] **Step 1: Write the GitHub Actions workflow**

Create `.github/workflows/deploy.yml`:

```yaml
name: Bygg og publiser

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: false

jobs:
  bygg:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm

      - run: npm ci
      - run: npm test
      - run: npm run build

      - uses: actions/configure-pages@v5
      - uses: actions/upload-pages-artifact@v3
        with:
          path: out

  publiser:
    needs: bygg
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.publisering.outputs.page_url }}
    steps:
      - id: publisering
        uses: actions/deploy-pages@v4
```

Note the workflow runs `npm test` before building — a failing test must block the deploy.

- [ ] **Step 2: Write the README**

Create `README.md`:

````markdown
# Handleliste Tønsberg

Statisk handleliste-app. Varedata er hardkodet fra regnearket; det eneste som
lagres er kolonnen **Kjøp**, i `localStorage` på telefonen.

## Kom i gang

```bash
npm install
npm run dev
```

Passord: `Tønsberg!`

## Kommandoer

| Kommando | Hva den gjør |
|---|---|
| `npm run dev` | Utviklingsserver |
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
````

- [ ] **Step 3: Run the full verification**

```bash
npm test && npm run build
```

Expected: every test passes, build succeeds.

- [ ] **Step 4: Verify the export serves correctly under the basePath**

The export lives at `/handleliste/`, so serving `out/` at the root would 404. Mirror the real path:

```bash
rm -rf /tmp/pages-test && mkdir -p /tmp/pages-test
cp -r out /tmp/pages-test/handleliste
npx --yes serve -l 4321 /tmp/pages-test
```

Open `http://localhost:4321/handleliste/` and confirm:

1. The password screen appears; `Tønsberg!` unlocks it.
2. All 11 categories render.
3. Incrementing an item, reloading the page, and seeing the value persist.
4. Handletur-mode hides everything unselected.
5. `Nullstill` needs two taps and then zeroes everything.
6. Browser devtools → Console shows **no 404s** for `_next/` assets. A 404 here means the `basePath`/`assetPrefix` problem described in the spec.
7. Devtools → Application → Manifest shows the icons and no errors.
8. Narrowing the window below 640px gives one column; widening past 1000px gives three.

Stop the server when done.

- [ ] **Step 5: Commit**

```bash
git add .github/workflows/deploy.yml README.md
git commit -m "chore: legg til utrulling til GitHub Pages og dokumentasjon"
```

- [ ] **Step 6: Report what remains manual**

These cannot be done from this machine and are the user's to do:

1. Create the GitHub repo (named `handleliste`, or change `BASE_PATH` to match).
2. `git remote add origin …` and `git push -u origin main`.
3. **Settings → Pages → Source: GitHub Actions.**
4. Install on the Fold from Chrome once the deploy is green.

---

## Self-Review

**Spec coverage** — every section maps to a task:

| Spec section | Task |
|---|---|
| Kilde-data, 11 kategorier / 112 varer | 3, 4 |
| Datamodell, `borHa` as string | 4 |
| Stable ids, collision throws | 2, 4 |
| Tilstand, two localStorage keys, hydration rule | 5, 11, 12 |
| Komponenter table | 8–12 |
| Layout, breakpoints 640/1000 | 9 |
| Varerad contents and counter | 8 |
| Handletur-modus + empty state | 6, 11 |
| Nullstill two-step, Logg ut | 10, 11, 12 |
| Tema, light/dark, contrast | 7 |
| PWA: manifest, SW, icons | 13 |
| Sikkerhet: no hashing, documented | 12, 14 |
| Utrulling: basePath, `.nojekyll`, no `assetPrefix` | 1, 13, 14 |
| Testing, all 6 listed areas | 4, 5, 6, 8, 10 |

**Placeholder scan:** none — every code step contains complete, runnable content.

**Type consistency:** `KjopKart` (Task 5) is consumed under that exact name in Tasks 6, 9, 11. `onEndre(id: string, antall: number) => void` is identical across Tasks 8, 9, 11. `Kategori`/`Vare` (Task 4) are used unchanged in 6, 8, 9, 11. `offentligSti` (Task 1) is used in 13 only. `antallIKategori` is defined in Task 6 and consumed in Task 9.

**Known ordering constraint:** Task 4's tests assert 11 categories and 112 items, so Task 3 must run first and produce those exact counts.
