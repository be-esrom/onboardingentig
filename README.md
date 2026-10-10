# EnTig onboarding

A working three-screen welcome flow for mobile and web, followed by an illustrative dictionary search. Open `index.html` from the complete brand-kit folder. A static server is recommended for consistent font loading; no dependencies, build step, external fonts or network calls are required.

The supplied UI is developer-ready plain HTML/CSS/JavaScript. It is a prototype, not a deployed dictionary or a production backend. `demo-dictionary.js` contains **two illustrative word pairs only**: Hello → ሰላም and Water → ማይ. A fluent Tigrinya reviewer should sign off on final product copy, dictionary entries and language-specific typography before release.

## Preview

- `index.html?step=1`, `?step=2`, `?step=3`: review individual screens regardless of saved completion.
- `index.html?view=home`: review the dictionary preview without saving completion.
- Normal `index.html`: first visit begins at welcome; returning completed visits open search.
- Back, Continue, Start exploring, Skip intro, progress dots, Arrow Left/Right, Home/End and Replay intro all work. Search handles the two demo words and an empty state.

## Implementation

See [flow.md](flow.md) for states, native handoff, motion and accessibility. `onboarding-content.json` is the portable copy source; `app.js` mirrors those three step values inline so the preview also works from a local `file:` URL. Keep both in sync when editing copy.

Reuse the bundled Noto Sans UI and Noto Sans Ethiopic families. The custom logo lettering is reserved for the logo. This prototype references `../logos/entig-primary.png`, `../icons/entig-symbol.svg` and `../fonts/` inside the complete kit; preserve that layout or update paths together.

The visuals are HTML/CSS cards, not raster hero art. For native apps, build those same simple cards with native layout and text, preserving correct Ethiopic font rendering. Do not flatten the onboarding copy into images.

## Search integration

Replace the local `window.ENTIG_DEMO_DICTIONARY` adapter and the `search()` filter with your reviewed dictionary/API. Add real loading, unavailable-service, no-match and retry handling when the data source is connected. Do not treat the two-word dataset as dictionary coverage. The supplied flow makes no claims about audio, offline lookup, accounts, saved words or AI.

Completion uses the versioned local preference `entig:onboarding:v1=complete`. Native apps should store the same preference in their local app settings. Skip and Start exploring both set it; Replay intro removes only this onboarding preference. Blocked browser storage falls back to the current in-memory session. No user information is sent or collected.

## Validation

JavaScript syntax, JSON, local asset references and the actual `app.js` state transitions were checked. Run `node onboarding/validate-state.cjs` from the kit root to repeat the state checks. The state checks use a minimal DOM harness rather than a full browser; see `qa-report.md` for the covered interactions and the rendering limitation. Browser screenshots were not exported because Chromium could not run in the current execution sandbox. Use the presentation links above for a browser review at 390 × 844 and desktop sizes, plus the embedded preview at 346 × 722 and 322 × 676.
