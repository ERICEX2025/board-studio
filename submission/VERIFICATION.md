# Verification - September 10, 2026

- 18 automated checks pass: game validation, save round trips, card/deck operations, primitive geometry, structured model output, local API access restrictions, subscription credential isolation, and temporary viewport cleanup.
- Live Astra generation through the ChatGPT-authenticated Codex CLI produced Last Light: 26 components, including 9 spaces, 10 pieces/landmarks, 1 deck, and 6 cards; 16 custom 3D parts.
- Browser check: generated example loaded as a proposal, Apply created Last Light, Play exposed the tabletop, and Draw card opened Quiet Water with its generated rules text.
- Browser check: Print displayed board overview, ten cutouts, all six weather cards, the four rules sections, and component reference information.
- Paper kit: a separate five-page PDF layout was generated from the saved game and visually reviewed. It contains a paper board, tokens, six cards, and rules. The PDF is not a screenshot or export of the 3D model.
- Rules review: setup accounts for all components; movement and rescue are separate actions; event timing, alternating initiative, scoring, game end, and ties are explicit.

Not performed: a complete two-person playtest, statistical balance analysis, full browser print-dialog/PDF export, or a recorded live AI revision in this test. The target 10-15 minute duration is a design estimate, not measured playtime. A one-minute public demo recording remains a submission prerequisite.

## Product and UX pass

- 20 automated checks pass, including structured design-brief validation and exact document-diff categorization.
- Controlled browser fixtures (explicitly labeled as fixtures, not live AI) verified a second request revises an unapplied draft; failure and cancellation keep that draft; apply/undo restores the original document; opening an existing saved JSON clears stale conversation.
- Live subscription test: Astra inspected an attached Last Light viewport, identified faint/crowded boat labels and proposed shortening the six boat names. Its reply was previewed and applied. Exact preservation of every field in that live reply was not independently audited.
- Live subscription test: a new rooftop-gardening idea produced two distinct visual alternatives, a clarifying question and a brief preserving two players / ten minutes. Choosing the spatial direction produced Gutter Duel, a 14-component game with setup, turns, scoring and ending rules.
- That new game exposed a real capability gap: rotating arrow tiles need text on their faces, not camera-facing text. Added short face text that rotates with tiles, matching short text in print, and quarter-turn controls in Play.
- Default framing and constant-screen-size name labels improve viewport readability. Paper tokens/cards now use dark text on white with a component-color accent.
- Gutter Duel remains a generated prototype, not a balanced or human-playtested game. Play is a manual tabletop. A complete two-person playtest and final print-dialog pagination check remain outstanding.

## Guided gameplay and print milestone (supersedes earlier manual-only limitations)

- 30 automated tests pass. New tests cover routing exits/loops, immutable transitions, illegal actions, lock timing, exact ending, weather limits, initiative, rescue timing, component references and aligned topology. Strategy-versus-strategy checks complete 40 seeds for each family without illegal moves.
- A separate bounded diagnostic runs 12 matches per example: Gutter Duel seat wins 4/4 and 4 ties; Last Light 4/6 and 2 ties. These are small policy-dependent diagnostics, not statistical balance claims.
- Live Astra UI visual revision generated matching rooftop dioramas with 34 editable parts. The downloaded JSON was independently compared: all 14 component IDs, rules and runtime identical to the baseline.
- Computer use completed Gutter Duel through the actual UI: 12 turns, final 3-7, blocked locked-tile feedback, undo restored turn 12 and a repeat computer action restored the ending.
- Computer use completed Last Light through the UI: initial weather sank boat 1, moving did not rescue, round-two initiative gave Violet consecutive actions, Amber separately rescued boat 4, and the game ended 1-6.
- Print mode visibly showed assembly instructions. Separate six-page Gutter Duel and nine-page Last Light PDFs were rendered and every page visually inspected. They include scale calibration, setup diagrams, cutouts, quick references and full runtime-derived rules; Last Light includes identical card backs.
- Still required for final submission confidence: physical print/cut/assembly check, two-person blind rules playtest with measured duration, final real-screen demo recording and public video URL. Browser print-dialog pagination has not been independently verified.

- Review loop QA: an initial live review response failed validation without changing the design. Added explicit response-list bounds and clearer validation errors. A subsequent live critique succeeded, recommended paired human games, and identified camera cropping when switching modes. Mode switching now refits the board after layout changes.
- Latest UI match replay export button was exercised; download completion was not observed in the filesystem. Deterministic action-record replay is covered by an automated full-state equality test.
