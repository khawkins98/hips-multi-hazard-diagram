# Suggestions

Review of the current implementation against PRD.md, with missing features and improvement ideas.

## Missing PRD features

### Code range notation
PRD specifies sequential codes should use hyphen notation: `Air Pollution (EN0101-EN0103)` instead of listing each individually. Currently `formatItemsHTML()` in `boxes.js` always outputs each item separately as `Name (CODE); Name (CODE)`.

### Comma grouping for sub-types
PRD specifies commas to group sub-types of the same named concept: `Land Transportation Accidents (TL0404, TL0405)`. This requires detecting items that share a name and merging their codes. Not yet implemented.

### "and others" truncation
PRD notes that very long lists may end with "and others" to keep box sizes manageable. No truncation logic exists yet.

### Large causes groups spanning full width
PRD says causes groups with many items "may span full width for readability" (e.g. Glacial Lake's Technological causes). Worth verifying the current `splitIntoRows` logic produces the intended layout for cases like MH0607.

## Improvements

### Row-grouping threshold
`connectors.js` groups boxes into rows using a 20px Y-position tolerance. If CSS gap, padding, or font sizes change, this threshold may need adjusting. Consider deriving it from the actual CSS gap value rather than a magic number.

### Accessible connector colors
The connector lines use `#555` which has reasonable contrast on white, but could be darker for better visibility in print or for users with low vision.

### Responsive behavior at narrow widths
On narrow screens (phones) the diagram text becomes very small. Consider a media query that adjusts font sizes or switches to a single-column layout for small viewports.
