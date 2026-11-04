# HIPs Single-Hazard Causal Diagram

Visualizes "what causes this hazard" and "what it causes" for a single [UNDRR Hazard Information Profiles (HIPs)](https://www.preventionweb.net/drr-glossary/hips) hazard, grouped by hazard type. Designed for embedding on other sites.

Browse the full HIPs glossary at [preventionweb.net/drr-glossary/hips](https://www.preventionweb.net/drr-glossary/hips).

This project is a focused companion to [hips-multihazard](https://github.com/khawkins98/hips-multihazard), which renders the full interactive graph of all 281 HIPs. Where that project is the atlas, this is the single-page map.

## Usage

Select a hazard via query parameter:

```
?hip=TL0305    # Fire
?hip=MH0607    # Glacial Lake Outburst Flooding
?hip=TL0201    # Building Collapse
```

### Embedding

Add a container element and the embed script to any page:

```html
<div data-hips-diagram="TL0305"></div>
<script src="https://khawkins98.github.io/hips-multi-hazard-diagram/hips-diagram.js"></script>
```

The script auto-discovers all `data-hips-diagram` containers and renders a diagram into each one. Multiple diagrams on one page are supported:

```html
<div data-hips-diagram="TL0305"></div>
<div data-hips-diagram="MH0607"></div>
<script src="https://khawkins98.github.io/hips-multi-hazard-diagram/hips-diagram.js"></script>
```

CSS is scoped to the diagram container, so it won't affect styles on your page. Including the script more than once is harmless: each container is rendered once and styles are injected once.

The diagram fills the width of its container and reflows to fit it, so it also works in a narrow sidebar column. Give the container a width from the page layout (a normal content area does this already). If the container sizes to fit its contents, such as a flex item with no width, an inline-block or a table cell, the diagram falls back to a narrow 320px layout rather than collapsing. Set `width: 100%` (or `flex: 1`) on the container to use the full width.

#### Theming with Mangrove

On pages that load [UNDRR Mangrove](https://mangrove.undrr.org/), the diagram picks up the host theme automatically:

| Diagram element | Mangrove token | Fallback |
|---|---|---|
| Font | `--mg-font-family-text` | system font stack |
| Text | `--mg-color-text` | `rgb(51 51 51)` |
| Labels, loading text | `--mg-color-neutral-600` | `rgb(77 77 77)` |
| Links | `--mg-color-interactive` | `rgb(21 101 192)` |
| Keyboard focus ring | `--mg-color-focus-ring`, `--mg-focus-ring-width`, `-offset`, `-radius` | `rgb(134 98 0)`, 2px |

No configuration is needed, and the diagram looks the same as before on pages without Mangrove. Hazard-type colors are not themed: they come from the UNDRR-ISC classification wheel.

#### Iframe fallback

If you prefer an iframe, you can use the standalone page directly:

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

Height depends on how many causal relationships the hazard has — 600px works for most, but hazards with many connections (like MH0603 Flash Flooding) may need 800px or more.

## Development

```bash
npm install          # install dependencies
npm run dev          # start Vite dev server
npm run build        # production build to dist/
npm run build:embed  # build embed script (dist/hips-diagram.js)
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

When a section has multiple rows, a vertical conduit runs along the right side (outside all boxes) so lines never cross through a box. The section reserves a lane for it, so the conduit stays inside the diagram.

More than 4 type groups split into two rows of at most half the groups each, balanced by item count.

The layout responds to the width of its container (CSS container queries), not the browser window. Below 640px, boxes wrap into as many columns as fit, each at least 150px wide.

### File structure

```
src/
  main.js                  # Entry point: URL routing, loading/error states
  embed.js                 # Embed entry point: auto-init, CSS injection, fetch + render
  diagram-styles.css       # Diagram styles scoped under .hips-diagram (shared by page and embed)
  styles.css               # Standalone page: page-level resets + imports diagram-styles.css
  data/
    fetch-hip.js           # API fetch + JSON-LD parsing + groupByType
    hazard-types.js        # Prefix-to-type mapping, color palette
    jsonld.js              # JSON-LD value extraction helpers (str, refId, toArray)
  diagram/
    render.js              # HTML structure: sections, grid rows, center node
    layout.js              # Row splitting and weighted grid columns (pure, tested)
    boxes.js               # Type-group box creation with clickable hazard links
    format-items.js        # Name grouping and code range notation (pure, tested)
    connectors.js          # SVG overlay: bus-pattern lines, arrowheads, resize
    row-utils.js           # Groups box positions into connector rows (pure, tested)
```

### Tech stack

Vite for build tooling, vanilla JS with no runtime dependencies, CSS grid for box layout, SVG for connector lines only.

## Hazard type color palette

Colors are sourced from the UNDRR-ISC Hazard Definition & Classification Review Technical Report wheel diagram (page 5). Each hazard type has a primary color (used for borders), a light tint (used for box backgrounds) and a header text color. Where the primary color is too light to read on the tint, the header uses a darker shade of the same hue that meets WCAG AA (4.5:1). A unit test checks every pair.

| Type | Prefix | Primary (border) | Background (tint) | Header text | Visual |
|------|--------|------------------|--------------------|-------------|--------|
| Meteorological & Hydrological | MH | `#3AAE2B` (green) | `#E8F5E5` | `#297B1E` | Bright green |
| Biological | BI | `#1A1A1A` (black) | `#E8E8E8` | `#1A1A1A` | Black |
| Chemical | CH | `#5B92C5` (blue) | `#ECF2F9` | `#3970A2` | Medium blue |
| Extraterrestrial | ET | `#E8792B` (orange) | `#FCF0E8` | `#AE5313` | Orange |
| Societal | SO | `#8B3FA0` (purple) | `#F2E8F6` | `#8B3FA0` | Purple / magenta |
| Technological | TL | `#B8860B` (dark gold) | `#F5EDD6` | `#886308` | Dark gold / mustard |
| Geological | GH | `#C21E2C` (red) | `#F9E6E8` | `#C21E2C` | Deep red / crimson |
| Environmental | EN | `#1B355F` (navy) | `#E3E8EF` | `#1B355F` | Dark navy blue |

Fallback for unknown types: border `#9E9E9E`, background `#F5F5F5`, header `#6F6F6F` (gray).

These values are defined in `src/data/hazard-types.js`.

## Data source

Data comes from the PreventionWeb API at `https://www.preventionweb.net/api/terms/hips/{code}`. The response is JSON-LD with `xkos:causedBy` and `xkos:causes` arrays. Hazard type is derived from the 2-letter identifier prefix (BI, MH, TL, CH, GH, EN, ET, SO).

The full HIPs glossary is published at [preventionweb.net/drr-glossary/hips](https://www.preventionweb.net/drr-glossary/hips).

## Deployment

GitHub Pages via GitHub Actions on push to `main`. Vite base path is set to `/hips-multi-hazard-diagram/`.

Built versions are also redistributed via the **UNDRR Asset Library** at:

```
https://assets.undrr.org/projects/hips/single-hazard-diagram/
```

Each version is published as an immutable directory (e.g. `v0.1.0/`) with stable asset filenames. For UNDRR-related use cases, the asset library URL is the preferred production reference. See the [asset library README](https://assets.undrr.org/projects/hips/single-hazard-diagram/README.md) for available versions and usage examples.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development setup, scope, and PR guidelines.

## License & attribution

The **viewer source code** in this repository is licensed under the [Apache License, Version 2.0](LICENSE).

The **hazard content** rendered by the viewer is fetched live from the PreventionWeb API and is separately licensed. It comes from the UNDRR-ISC Hazard Information Profiles (HIPs), made available by UNDRR and ISC under [Creative Commons Attribution-NonCommercial 4.0 International (CC BY-NC 4.0)](https://creativecommons.org/licenses/by-nc/4.0/):

> United Nations Office for Disaster Risk Reduction (UNDRR), & International Science Council (ISC). (2025). *UNDRR-ISC Hazard Information Profiles – 2025 Update*. <https://doi.org/10.24948/2025.05>

If you deploy this viewer, note in particular that CC BY-NC 4.0 restricts the HIP content to **non-commercial use** and requires attribution. Commercial licensing requests for the content should be directed to UNDRR at <https://www.undrr.org/contact-us>. See [NOTICE](NOTICE) for the full third-party attribution.

This is a personal project developed by an UNDRR staff member in an individual capacity — it is not an official UNDRR, ISC, or PreventionWeb product, and is not affiliated with, endorsed by, or sponsored by any of them.
