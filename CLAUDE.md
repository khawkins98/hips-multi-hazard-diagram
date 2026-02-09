# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Single-hazard causal diagram generator for the UNDRR Hazard Information Profiles (HIPs). Given a hazard code, it visualizes "what causes this hazard" and "what it causes," grouped by hazard type. Designed for embedding via iframe on other sites.

### Relationship to `hips-multihazard`

This project is a spiritual successor to [hips-multihazard](https://github.com/khawkins98/hips-multihazard), which visualizes the full graph of all 281 hazards at once. This repo is not a fork or direct dependency — it is an independent, focused companion that borrows design language (color palette, type conventions) and implementation patterns (Vite + vanilla JS, JSON-LD helpers, GitHub Pages deploy) from the parent project. Think of `hips-multihazard` as the atlas; this project is the single-page map.

## Tech Stack

- **Vite + vanilla JS** (no framework)
- **D3** for SVG rendering (boxes, type-group layout, connector lines). If the box/flow layout proves unworkable, fallback is a D3 sunburst/radial layout (ref: [d3-sunburst](https://observablehq.com/@d3/sunburst/2?collection=@d3/d3-hierarchy)).
- **Plain CSS** with custom properties for hazard-type colors
- **Deployed to GitHub Pages** at `/hips-multi-hazard-diagram/`

## Build & Dev Commands

Project scaffolding is not yet complete. Once `package.json` exists, expected commands:

```bash
npm install          # install dependencies
npm run dev          # start Vite dev server
npm run build        # production build to dist/
npm run preview      # preview production build locally
```

## Data Source

- **API endpoint:** `https://www.preventionweb.net/api/terms/hips/{code}` (live fetch, no snapshot)
- **Response format:** JSON-LD with `xkos:causedBy` and `xkos:causes` arrays. Each entry has `@id`, `dct:identifier`, and `skos:prefLabel` (but NOT `skos:broader`/type info).
- **Hazard type** is derived from the 2-letter prefix of the identifier code:

| Prefix | Type |
|--------|------|
| BI | Biological |
| MH | Meteorological and Hydrological |
| TL | Technological |
| CH | Chemical |
| GH | Geological |
| EN | Environmental |
| ET | Extraterrestrial |
| SO | Societal |

## Architecture

### URL API
- Query parameter `?hip={CODE}` selects the hazard (e.g. `?hip=TL0305`)
- Each hazard name/code in the diagram links to its own `?hip={CODE}` view

### Diagram Layout & Business Rules
- **Top — "Caused by":** Hazards grouped by type. Same-type items (matching the center HIP's type) get a full-width banner above other boxes when there are many items; otherwise they appear as a regular box. Other types in separate color-coded boxes in a row below.
- **Center:** The selected HIP as "Name (CODE)" in a neutral box.
- **Bottom — "Causes":** Hazards grouped by type in color-coded boxes. **No same-type banner** — all types are equal. Groups with many items may span full width.
- **Box content:** Bold type name header, then semicolon-separated entries sorted by code ascending: `Name (CODE); Name (CODE)`. Sequential codes use range notation: `Air Pollution (EN0101-EN0103)`. Commas for sub-types of one concept: `Land Transportation Accidents (TL0404, TL0405)`. Semicolons for distinct hazards under a broader category: `Building Failures (TL0201; TL0203; ...)`. Hazard names may contain their own parenthetical text — code is always the final parenthetical: `Gravitational Mass Movement (Landslides) (GH0300)`. Very long lists may end with "and others".
- **Bidirectional:** The same hazard can appear in both causedBy and causes for a given HIP.
- **Box layout:** Boxes size proportionally to content within rows; rows wrap when needed.
- **Connectors:** Lines converge to a single point → center node → diverge to causes boxes (not point-to-point).

### JSON-LD Helpers
Adapted from the parent project `hips-multihazard` (copied/rewritten, not imported as a dependency):
- `str()` — extract string value from JSON-LD
- `refId()` — extract reference ID
- `toArray()` — normalize single-or-array JSON-LD values

### Color Palette
Each hazard type has a distinct border/background color. Observed from reference mockups:
- **Technological:** Gold/amber
- **Chemical:** Blue
- **Geological:** Red/maroon
- **Environmental:** Green
- **Societal:** Purple/lavender
- **Meteorological & Hydrological:** Dark green/teal
- Biological, Extraterrestrial: follow parent project palette. Fallback: gray.

## Deployment

GitHub Pages via GitHub Actions on push to `main`. Vite base path must be set to `/hips-multi-hazard-diagram/`.

## Key Reference

- **PRD.md** — full product requirements with detailed diagram layout rules, ASCII mockup, and reference examples (Fire/TL0305, Glacial Lake/MH0607)
