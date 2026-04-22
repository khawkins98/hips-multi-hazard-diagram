# Suggestions

Review of the original PRD requirements, with implementation status and known gaps.

## Addressed

### Code range notation ✓
Sequential codes now use hyphen notation: `Air Pollution (EN0101-EN0103)`. Implemented in `format-items.js` (`collapseToRanges()`). Runs of 3+ consecutive same-prefix codes collapse; pairs stay individual. Both endpoints are rendered as HIP links; the hyphen between them is plain text.

### Comma grouping for sub-types ✓
Items sharing the same name are merged: `Land Transportation Accidents (TL0404, TL0405)`. Implemented in `format-items.js` (`groupItemsByName()`), used by `boxes.js`.

### Row-grouping threshold ✓
The 20px magic number in the connector row-grouping logic is now a named constant `ROW_Y_TOLERANCE` in `src/diagram/row-utils.js`, with documentation explaining its relationship to the CSS inter-row margin.

### Accessible connector colors ✓
Connector `STROKE_COLOR` in `connectors.js` darkened from `#555` to `#333`.

### Responsive behavior at narrow widths ✓
Media query at `max-width: 540px` added to both `styles.css` and `embed-styles.css`, reducing font sizes, padding, and grid gaps on narrow viewports.

## Still open

### "and others" truncation *(needs design decision)*
PRD notes that very long lists may end with "and others" to keep box sizes manageable. No truncation logic exists yet. Needs a decision on threshold (how many items triggers truncation?) and display format before implementing.

### Large causes groups spanning full width *(needs verification)*
The PRD specifies that a causes group with many items should span the full diagram width. Load `?hip=MH0607` (Glacial Lake Outburst Flooding) and check whether its Technological causes box fills the full row. If it doesn't, `splitIntoRows` in `render.js` likely needs a full-width override case for large groups.
