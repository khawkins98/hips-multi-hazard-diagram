# HIPs Single-Hazard Causal Diagram

Visualizes "what causes this hazard" and "what it causes" for a single [UNDRR Hazard Information Profiles (HIPs)](https://www.preventionweb.net/drr-glossary/hips) hazard, grouped by hazard type. Designed for embedding via iframe on other sites.

This project is a focused companion to [hips-multihazard](https://github.com/khawkins98/hips-multihazard), which renders the full interactive graph of all 281 HIPs. Where that project is the atlas, this is the single-page map.

## Usage

Select a hazard via query parameter:

```
?hip=TL0305    # Fire
?hip=MH0607    # Glacial Lake Outburst Flooding
?hip=TL0201    # Building Collapse
```

### Embedding

Drop this into any page to embed a diagram:

```html
<iframe
  src="https://khawkins98.github.io/hips-multi-hazard-diagram/?hip=TL0305"
  width="100%"
  height="600"
  style="border: none; max-width: 860px;"
  loading="lazy"
  title="Causal diagram for Fire (TL0305)"
></iframe>
```

The diagram scales to fit the iframe width (up to 860px). Height depends on how many causal relationships the hazard has — 600px works for most, but hazards with many connections (like MH0603 Flash Flooding) may need 800px or more. Use `loading="lazy"` if embedding multiple diagrams on one page.

## Development

```bash
npm install          # install dependencies
npm run dev          # start Vite dev server
npm run build        # production build to dist/
npm run preview      # preview production build locally
```

## Architecture

### Data flow

1. `main.js` reads `?hip={CODE}` from the URL and calls `fetchHip(code)`
2. `fetch-hip.js` fetches from the PreventionWeb API (`/api/terms/hips/{code}`), parses JSON-LD, and groups related hazards by type (derived from the 2-letter code prefix)
3. `render.js` builds an HTML structure of CSS grid rows containing type-group boxes, plus a center node
4. `connectors.js` draws an SVG overlay with orthogonal bus-pattern connector lines, reading actual box positions from the DOM

### Diagram layout

```
  [Same-type causedBy banner]         <- full-width, when >= 4 same-type items
  [Type A]  [Type B]  [Type C]        <- other causedBy groups, CSS grid
       |        |        |
       +--------+--------+-----+      <- horizontal bus + right-side conduit
                |               |
         [HIP Name (Code)]     |      <- center node
                |               |
       +--------+--------+-----+      <- horizontal bus + right-side conduit
       |        |        |
  [Type D]  [Type E]  [Type F]        <- causes groups, CSS grid
```

Boxes are HTML divs styled with CSS custom properties for type colors. CSS grid (`minmax(140px, Nfr)` weighted by item count) handles text wrapping and proportional sizing.

Connectors are an SVG overlay positioned absolutely over the wrapper. A `ResizeObserver` redraws them on resize.

When a section has multiple rows, a vertical conduit runs along the right side (outside all boxes) so lines never cross through a box.

### File structure

```
src/
  main.js                  # Entry point: URL routing, loading/error states
  styles.css               # All styles: grid layout, type-box colors, connectors
  data/
    fetch-hip.js           # API fetch + JSON-LD parsing + groupByType
    hazard-types.js        # Prefix-to-type mapping, color palette
    jsonld.js              # JSON-LD value extraction helpers (str, refId, toArray)
  diagram/
    render.js              # HTML structure: sections, grid rows, center node
    boxes.js               # Type-group box creation with clickable hazard links
    connectors.js          # SVG overlay: bus-pattern lines, arrowheads, resize
```

### Tech stack

Vite for build tooling, vanilla JS with no runtime dependencies, CSS grid for box layout, SVG for connector lines only.

## Data source

Data comes from the PreventionWeb API at `https://www.preventionweb.net/api/terms/hips/{code}`. The response is JSON-LD with `xkos:causedBy` and `xkos:causes` arrays. Hazard type is derived from the 2-letter identifier prefix (BI, MH, TL, CH, GH, EN, ET, SO).

## Deployment

GitHub Pages via GitHub Actions on push to `main`. Vite base path is set to `/hips-multi-hazard-diagram/`.

## License

TBD
