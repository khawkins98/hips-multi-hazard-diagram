# Contributing

Thanks for your interest in contributing. This is a small, focused project — a single-hazard causal diagram viewer for the UNDRR-ISC Hazard Information Profiles (HIPs). Most contributions should be bug fixes, layout/rendering improvements, or new display features for data already returned by the PreventionWeb API.

## Scope

**In scope:**
- Bug fixes in rendering, layout, or connector drawing
- Accessibility improvements (contrast, keyboard nav, screen reader support)
- New visual encodings or layout modes that help communicate the data
- Embed ergonomics (sizing, theming hooks, framework adapters)
- Documentation improvements

**Out of scope here:**
- Changes to the HIP dataset itself — hazard definitions, codes, causal relationships, and descriptive text are maintained upstream by UNDRR/ISC. Issues about the content of a specific hazard should be raised with [PreventionWeb](https://www.preventionweb.net/) rather than in this repo.
- Features that require a server, build-time data snapshot, or caching layer — this project is intentionally a static client that fetches live from PreventionWeb. Propose the architectural change in an issue first if you think it's warranted.

The sibling project [hips-multihazard](https://github.com/khawkins98/hips-multihazard) renders the full 281-hazard atlas; contributions about the cross-hazard graph belong there.

## Development

```bash
npm install
npm run dev           # Vite dev server
npm run build         # production build -> dist/
npm run build:embed   # embed script -> dist/hips-diagram.js
npm run preview       # preview production build locally
npm test              # run unit tests (Vitest)
npm run test:watch    # run tests in watch mode while developing
```

### Test-driven development

This project uses [Vitest](https://vitest.dev/) for unit tests. Pure logic — item formatting, grouping, range notation, row calculations — lives in testable modules (`src/diagram/format-items.js`, `src/diagram/row-utils.js`) separate from DOM-dependent rendering code.

When making a change, the preferred workflow is:

1. **Write a failing test** that describes the expected behaviour.
2. **Implement** until the test passes.
3. **Run `npm test`** and confirm all tests are green before opening a PR.

CI will run `npm test`, `npm run build`, and `npm run build:embed` on every PR automatically — a failing test will block merging.

Tests that cover rendering behaviour (DOM output) belong in `src/__tests__/` with a `jsdom` environment annotation if needed. Pure logic tests need no environment annotation.

Before opening a PR, also verify your change visually against a few hazards with different shapes:

- `?hip=TL0305` — Fire (mixed causedBy + causes)
- `?hip=MH0607` — Glacial Lake Outburst Flooding (large causes group)
- `?hip=MH0603` — Flash Flooding (many connections, stress test)
- `?hip=TL0201` — Building Collapse (technological cascade)

Check at desktop and narrow viewport widths, and check both the standalone page and the embed script (`hips-diagram.js`) if your change touches rendering.

## Architecture orientation

See `CLAUDE.md` and `README.md` for the data flow and layout rules. Key files:

- `src/main.js` — URL routing and orchestration
- `src/data/fetch-hip.js` — API fetch + JSON-LD parsing
- `src/data/hazard-types.js` — code-prefix → type + color mapping
- `src/diagram/render.js` — DOM structure and row-splitting rules
- `src/diagram/boxes.js` — type-group box creation
- `src/diagram/format-items.js` — pure item grouping and range-notation logic (tested)
- `src/diagram/connectors.js` — SVG bus-pattern connector overlay
- `src/diagram/row-utils.js` — box row-grouping logic (tested)

`SUGGESTIONS.md` tracks known gaps against the original PRD — good starting points if you're looking for something to work on.

## Pull requests

1. Branch from `main`. Use a descriptive prefix: `fix/…`, `feat/…`, `chore/…`, `docs/…`.
2. Keep PRs focused. Unrelated cleanup in a separate PR is easier to review.
3. Describe **what** and **why** in the PR body. Screenshots or short recordings are very helpful for any visual change — include before/after when applicable and mention which hazard codes you tested.
4. Don't commit build artifacts (`dist/`) unless the change is specifically about the build output.

## Licensing of contributions

This repository is licensed under Apache 2.0 (see [LICENSE](LICENSE)). By submitting a contribution, you agree that your contribution is licensed under the same terms.

Please do **not** submit HIP content (hazard definitions, descriptions, etc.) as code or data in this repo — it is fetched live from PreventionWeb and is separately licensed (CC BY-NC 4.0 to UNDRR/ISC). See [NOTICE](NOTICE) for details.

## Reporting issues

Use GitHub Issues. Helpful things to include:

- Hazard code (`?hip=…`) that reproduces the issue
- Browser + viewport width
- Screenshot or short recording for visual issues
- Console errors, if any

For suspected data issues (wrong causal relationship, outdated description), please link to the corresponding hazard on [undrr.org/hip/{CODE}](https://www.undrr.org/hip) — and note that the fix almost certainly needs to happen upstream.
