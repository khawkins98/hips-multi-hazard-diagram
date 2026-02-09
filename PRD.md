## Product Requirements: HIPs Multi-Hazard Diagram

**Single-hazard causal diagram generator — shows what causes a given HIP and what it causes, grouped by hazard type.**

### Relationship to `hips-multihazard`

This project is a spiritual successor to [hips-multihazard](https://github.com/khawkins98/hips-multihazard), which renders the full interactive graph of all 281 HIPs and their causal links. This repo is not a fork or direct dependency — it is an independent, focused companion that borrows design language (color palette, type conventions) and implementation patterns (Vite + vanilla JS, JSON-LD helpers, GitHub Pages deploy) from the parent project. Where `hips-multihazard` is the atlas, this project is the single-page map.

### Problem

The full HIPs Multi-Hazard Explorer shows all 281 hazards at once. There is no lightweight, embeddable way to visualize the causal relationships for a single hazard profile. Users (disaster risk analysts, educators, policy makers) need a focused view that answers: "What causes this hazard, and what does it cause?"

### Data Source

- **API:** `https://www.preventionweb.net/api/terms/hips/{code}` (live fetch, no snapshot)
- **Example:** `/api/terms/hips/TL0305` returns Fire with 25 causedBy and 24 causes entries
- **Response format:** JSON-LD. Each `xkos:causedBy` and `xkos:causes` entry is an embedded object with `@id`, `dct:identifier`, and `skos:prefLabel` (but NOT `skos:broader`/type info)
- **Type derivation:** Hazard type inferred from the 2-letter identifier prefix:

| Prefix | Hazard Type |
|--------|-------------|
| BI | Biological |
| MH | Meteorological and Hydrological |
| TL | Technological |
| CH | Chemical |
| GH | Geological |
| EN | Environmental |
| ET | Extraterrestrial |
| SO | Societal |

- **Limitation:** Only direct causal links declared by this single HIP. No derived/transitive relationships (the full graph resolves bidirectional edges; the individual endpoint does not).

### Diagram Layout

Based on reference mockups (Fire/TL0305 and Glacial Lake Outburst Flooding/MH0607):

```
  ┌─────────────────────────────────────────┐
  │  [Same-type causedBy hazards - banner]  │  ← full-width, same type as center HIP
  └─────────────────────────────────────────┘       (only when many same-type items)
  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐
  │Type A│  │Type B│  │Type C│  │Type D│     ← other-type causedBy, grouped in boxes
  └──┬───┘  └──┬───┘  └──┬───┘  └──┬───┘
     │         │         │         │
     └─────────┴────┬────┴─────────┘
                    ▼
          ┌──────────────────┐
          │  HIP Name (Code) │               ← central hazard node
          └──────────────────┘
                    │
     ┌─────────┬────┴────┬─────────┐
     │         │         │         │
  ┌──┴───┐  ┌─┴────┐  ┌─┴────┐  ┌─┴────┐
  │Type E│  │Type F│  │Type G│  │Type H│     ← causes, grouped by type in boxes
  └──────┘  └──────┘  └──────┘  └──────┘        (no same-type banner in causes)
```

#### Causedby section (top)

- Hazards that cause this HIP, grouped by type
- **Same-type banner:** When the center HIP has many causedBy items of its own type, they appear in a prominent full-width banner **above** the other type boxes (e.g. Fire/TL0305 has 12 Technological causedBy items → full-width gold banner). When there are few same-type causedBy items, they appear as a regular box alongside others (e.g. Glacial Lake/MH0607 has only 2 MH causedBy items → regular box, no banner).
- Other types appear in separate color-coded boxes arranged in a row below the banner (or all in one row if no banner)

#### Center node

- Displays the selected HIP as **"Name (CODE)"** in a prominent neutral box
- Connector lines/arrows arrive from above (causedBy) and depart below (causes)

#### Causes section (bottom)

- Hazards this HIP causes, grouped by type
- **No same-type banner** — all type groups are in equal boxes regardless of whether they match the center HIP's type
- Boxes arrange in rows; groups with many items may span full width for readability (e.g. Glacial Lake's Technological causes group has many items and spans the full width, even though it is not the same type as the center HIP)

#### Box content format

- Each box has a **type name header** (bold, centered) e.g. "Geological", "Chemical"
- Hazards listed as semicolon-separated entries: `Name (CODE); Name (CODE)`
- **Sorted by code ascending** within each box (e.g. TL0201, TL0202, TL0301... in the Fire Technological banner)
- **Code ranges:** Sequential codes use hyphen notation: `Air Pollution (EN0101-EN0103)` instead of listing each individually
- **Commas vs semicolons inside parentheses:** Commas group sub-types of the same named concept: `Land Transportation Accidents (TL0404, TL0405)`. Semicolons group distinct hazards under a broader category name: `Building Failures (TL0201; TL0203; TL0204; TL0205; TL0206; TL0207)`
- **Hazard names may contain parenthetical text** from the API itself — the code is always the *final* parenthetical: `Gravitational Mass Movement (Landslides) (GH0300)`
- When a group has very many items, the list may end with **"and others"** (observed in Fire's Chemical causes group)
- **Bidirectional relationships:** The same hazard can appear in both causedBy and causes for a given HIP (e.g. Wildfires EN0205 and Explosion TL0304 both cause and are caused by Fire)

#### Color coding

Each box has a colored border and background tint by hazard type:

| Type | Color |
|------|-------|
| Technological | Gold/amber |
| Chemical | Blue |
| Geological | Red/maroon |
| Environmental | Green |
| Societal | Purple/lavender |
| Meteorological & Hydrological | Dark green/teal |

(Biological, Extraterrestrial not yet observed in examples — follow parent project palette)

#### Box layout

- Boxes within a row size proportionally to their content (more items = wider)
- Rows wrap when content exceeds available width; a group that fills an entire row spans full width
- Boxes in the same row align to equal height

#### Connectors

- Lines from each causedBy group box descend and **converge to a single point** above the center node, then a single arrow enters the center
- From the center, a single line exits downward and **diverges to separate lines** reaching each causes group box
- This is a converge → node → diverge topology, not individual point-to-point lines

#### Empty states

- If a HIP has no causedBy or no causes, that entire section is omitted

### Embedding & URL API

- **GitHub Pages deployment** at `https://{user}.github.io/hips-multi-hazard-diagram/`
- **Query parameter:** `?hip={CODE}` — e.g. `?hip=TL0305`
- **Embeddable via iframe:**
  ```html
  <iframe src="https://...github.io/hips-multi-hazard-diagram/?hip=TL0305"
          width="800" height="600" frameborder="0"></iframe>
  ```
- **Error states:** Invalid/missing code shows a helpful message with example usage
- **Loading state:** Show skeleton/spinner while fetching from API

### Features

1. Fetch a single HIP from the PreventionWeb API by code
2. Parse JSON-LD response, extract causedBy and causes relationships
3. Group related hazards by type (derived from identifier prefix)
4. Render a structured diagram with color-coded type groupings
5. Link each hazard code/name to its own diagram view (`?hip={CODE}`) for navigation
6. Responsive — readable on desktop and tablet
7. Print/screenshot-friendly (clean background, no interactive chrome needed in static view)

### Tech Stack

- **Build:** Vite + vanilla JS (consistent with parent project)
- **Styling:** Plain CSS with custom properties for type colors
- **Rendering:** D3 for SVG rendering — boxes, type-group layout, and connector lines all drawn as SVG via D3. Keeps the vertical causedBy → center → causes flow from the mockups. **Fallback:** if the box/flow layout proves unworkable, pivot to a D3 sunburst/radial layout (ref: [d3-sunburst](https://observablehq.com/@d3/sunburst/2?collection=@d3/d3-hierarchy)).
- **No heavy dependencies** — D3 is the only significant dependency; keep the bundle small for embedding

### Reusable from Parent Project (`hips-multihazard`)

- **Hazard type color palette** (8 types + fallback gray)
- **JSON-LD helper functions:** `str()`, `refId()`, `toArray()`
- **GitHub Pages deploy workflow** (`.github/workflows/deploy.yml` pattern)
- **Vite config** with base path

### Out of Scope (v1)

- Full graph exploration (that's the parent project)
- Snapshot/offline mode (live API fetch only)
- Derived/transitive causal chains
- Editing or annotating diagrams
- Multi-HIP comparison view

### Deployment

- GitHub Pages via GitHub Actions (push to `main`)
- Base path: `/hips-multi-hazard-diagram/`
