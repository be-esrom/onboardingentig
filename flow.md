# Onboarding flow and handoff

First launch → Welcome → Lookup → Begin → Dictionary search.

Skip from any intro screen → Dictionary search. Back reverses one screen; the three progress dots navigate directly. Returning completed launches → Dictionary search. Replay intro clears the versioned completion preference and opens Welcome.

| State | Visual | Main action | Back action |
| --- | --- | --- | --- |
| Welcome | English Hello card paired with Tigrinya ሰላም card | Continue → Lookup | Hidden |
| Lookup | English water search and Tigrinya ማይ result | Continue → Begin | Welcome |
| Begin | Approved paired-tile symbol and two small word cards | Start exploring → Search | Lookup |
| Search | Search input, suggested words and result cards | Search / choose a word | Replay intro in header |

## Layout

Mobile stacks the visual, copy and navigation within a full-height view. At 390 × 844 the visual is 310 px tall with a 28 px corner radius, horizontal screen gutters are 24 px, and action controls are 56 px high. At shorter heights, the visual reduces to 250 px; content scrolls naturally if the device or user text settings require it. Support top and bottom safe areas in the native implementation.

Above 760 px, show the visual and copy as two columns. The content shell is capped at 1440 px; the visual is capped around 608 px tall. Search remains in a centered, readable column. Use layout constraints rather than positioning screenshots inside devices.

## Type and color

- UI: Noto Sans Regular and Bold. Tigrinya: Noto Sans Ethiopic Regular and Bold. Use system scaling; avoid setting a fixed native text-size cap.
- Tigrinya uses BCP 47 language tag `ti` and **left-to-right** direction. The script is Ethiopic, and should not be rendered with RTL layout.
- Identity blue: `#087AFF`; action blue: `#0062DF` for white button text and small colored text.
- Ink: `#121C30`; supporting text: `#53627A`; canvas: `#F5F8FF`; borders: `#DCE5F4`; surface: white.
- Custom EnTig lettering belongs only in logo artwork. Use proper text fonts for UI labels and translation results.

## Motion

Step transition: text fades from 35% to 100% opacity and rises 7 px over 250 ms; desktop art rises 10 px over 350 ms. Mobile art uses opacity only. Timing is `ease`; avoid spinning or stretching letters. The control hover rises 1 px over 150 ms, only on pointer devices. All these effects become immediate when `prefers-reduced-motion: reduce` is active. Native equivalent: check platform Reduce Motion and use immediate state changes when enabled.

## Accessibility and behavior

- All interactive controls are at least 48 × 48 CSS px. Primary actions are 56 px high.
- Visible focus rings use action blue with a 4 px offset. Enter/Space trigger native buttons; arrow keys and Home/End navigate intro steps. Keyboard shortcuts ignore editable inputs and modifier keys.
- On button-based step changes, move focus to the new title. Dot navigation preserves dot focus; arrow shortcuts focus the destination dot. Completion focuses the search field; saved-completion startup does not steal focus.
- A polite live region announces step changes and search results. Set the active dot to `aria-current="step"`. Decorative art is hidden from screen readers so the meaningful copy is announced once.
- Search input has a real label; translation text has `lang="ti" dir="ltr"`. Preserve HTML semantics when porting to your framework.
- In production, page titles, localized copy, font scaling, error messages and VoiceOver/TalkBack labels should follow this behavior. No account setup, permission prompts or personal information are needed for this intro.

## Data and release scope

This handoff demonstrates known English → Tigrinya lookup only. Its two-word dataset is local demo data, not a production dictionary. Hook up the reviewed data source and provide loading/retry states before shipping. If the app gains extra capabilities later, add those claims only after they exist. Final Tigrinya content requires a fluent-language editorial review.
