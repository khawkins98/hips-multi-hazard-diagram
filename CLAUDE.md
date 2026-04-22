# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Single-hazard causal diagram generator for the UNDRR Hazard Information Profiles (HIPs). Given a hazard code via `?hip={CODE}`, it visualizes "what causes this hazard" and "what it causes," grouped by hazard type. Designed for embedding via iframe on other sites.

Spiritual successor to [hips-multihazard](https://github.com/khawkins98/hips-multihazard) (the full 281-hazard atlas); this is the single-page map.

## Build & Dev Commands

```bash
npm install          # install dependencies
npm run dev          # start Vite dev server
npm run build        # production build to dist/ (standalone page)
npm run build:embed  # build embed script to dist/hips-diagram.js
npm run preview      # preview production build locally
npm test             # run unit tests (Vitest)
npm run test:watch   # run tests in watch mode
```

No linter is configured yet. Test framework: **Vitest** (`npm test`).

## Tech Stack

- **Vite + vanilla JS** (ES modules, no framework, zero runtime dependencies)
- **HTML divs** for type-group boxes with **CSS Grid** layout
- **SVG overlay** for connector lines only (no D3 — despite PRD mention, layout uses DOM)
- **Plain CSS** with custom properties for hazard-type colors
- **Deployed to GitHub Pages** at `/hips-multi-hazard-diagram/`

## Architecture

### Entry points

There are two build targets that share the data + rendering modules:

- `src/main.js` — standalone page (default `npm run build`). Reads `?hip={CODE}` from URL, shows loading/error states, renders into `#app`. Pulls global styles from `src/styles.css`.
- `src/embed.js` — embed script (`npm run build:embed` → `dist/hips-diagram.js`). Auto-discovers `data-hips-diagram="{CODE}"` containers on the host page, injects scoped styles from `src/embed-styles.css`, and renders one diagram per container.

Both paths call the same `fetchHip()` + `render()` pipeline below.

### Data flow

1. `src/data/fetch-hip.js` — `fetchHip(code)` fetches from PreventionWeb API, parses JSON-LD, returns `{ name, code, type, causedBy: Map<typeName, items[]>, causes: Map<typeName, items[]> }`
2. `src/data/hazard-types.js` — maps 2-letter code prefixes to type names and colors (border + bg hex)
3. `src/data/jsonld.js` — JSON-LD helpers: `str()`, `refId()`, `toArray()`
4. `src/diagram/render.js` — builds DOM structure: causedBy (top), center node, causes (bottom). CSS Grid columns weighted by item count. Same-type banner when >= `SAME_TYPE_BANNER_THRESHOLD` (4)
5. `src/diagram/boxes.js` — creates type-group box elements; uses `format-items.js` for comma-grouped and range-notated hazard entries, links to `https://undrr.org/hip/{CODE}`
6. `src/diagram/format-items.js` — pure helpers: `groupItemsByName()` (merge same-name items), `collapseToRanges()` (range notation for 3+ sequential codes)
7. `src/diagram/connectors.js` — SVG connector overlay using `getBoundingClientRect()`. Bus-pattern routing (stubs → bus → conduit → trunk). Redraws on resize via `ResizeObserver`
8. `src/diagram/row-utils.js` — `groupIntoRows()` clusters boxes by Y position; imported by connectors

### Layout rules

- **Causedby (top):** Same-type items get full-width banner when >= 4 items; others in color-coded boxes in rows
- **Center:** "Name (CODE)" in a neutral box
- **Causes (bottom):** All types equal (no banner); large groups may span full width
- **Connectors:** Converge → center → diverge (not point-to-point). Arrow markers on causes stubs only
- **Row splitting:** <= 4 groups → 1 row; > 4 → balanced split by item count

### Key constants

- `SAME_TYPE_BANNER_THRESHOLD = 4` (render.js)
- `STUB = 22`, `CONDUIT_MARGIN = 24`, `ARROW_SIZE = 7` (connectors.js)
- `ROW_Y_TOLERANCE = 20` (row-utils.js) — Y-position tolerance in px for grouping boxes into the same connector row

## Data Source

- **API:** `https://www.preventionweb.net/api/terms/hips/{code}` (live fetch, no caching)
- **Format:** JSON-LD with `xkos:causedBy` and `xkos:causes` arrays
- **Type derivation:** 2-letter prefix → type name (BI, MH, TL, CH, GH, EN, ET, SO)

## Color Palette

Colors sourced from the UNDRR-ISC Hazard Classification wheel diagram (page 5). Each type has border/background colors in `hazard-types.js`:

- Met & Hydro: green (#3AAE2B), Biological: black (#1A1A1A), Chemical: blue (#5B92C5)
- Extraterrestrial: orange (#E8792B), Societal: purple (#8B3FA0)
- Technological: dark gold (#B8860B), Geological: crimson (#C21E2C), Environmental: navy (#1B355F)
- Fallback: gray (#9E9E9E)

## Deployment

GitHub Pages via GitHub Actions (`.github/workflows/deploy.yml`) on push to `main`. Vite base path: `/hips-multi-hazard-diagram/`.

## Known Gaps

Documented in **SUGGESTIONS.md**. Two items remain open: `"and others"` truncation (needs threshold design decision) and large causes groups spanning full width (needs verification against MH0607). Good test cases: Fire (TL0305), Glacial Lake (MH0607), Flash Flooding (MH0603), Building Collapse (TL0201).

## License & attribution

Two licenses in play — keep them straight when making changes:

- **Viewer source code** (this repo): Apache License 2.0 (see `LICENSE`).
- **HIP content** (fetched live from PreventionWeb): CC BY-NC 4.0, © UNDRR + ISC (see `NOTICE`). This is **non-commercial** and requires attribution; do not bundle, cache, or redistribute the HIP dataset from this repo. Attribution and citation are handled via the NOTICE file and README — do not remove them. No UNDRR logo, no implication of UNDRR/ISC endorsement.

Practical implication: features that snapshot HIP data into the repo, ship it as JSON fixtures, or strip attribution are out of scope. Live fetch is the intended architecture.
