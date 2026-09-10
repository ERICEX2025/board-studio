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
