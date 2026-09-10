# Board Studio

**Builder:** Eric Ko (solo)

**One-line pitch:** Turn a conversation into an editable 3D board game you can play in your browser, with optional printable components.

## Project description
Board Studio is an AI-assisted workspace for inventing board games. Describe an idea, discuss mechanics, compare visual directions, and generate a draft with a board, pieces, cards, and rules. Continue refining it through conversation or direct editing. Proposed changes appear in the viewport before you apply them, and undo preserves the previous game.

Astra designs structured game documents and composes editable 3D landmarks from primitive parts. With viewport sharing enabled, it can review the current camera view alongside the game data. The same document drives the editor, guided gameplay for three supported rule families, save/open, and optional paper and component STL exports.

The primary demo is **Lantern Cove**, an original island settlement game inspired by familiar resource-building games. It follows the full journey from a prompt and visual directions through generation, a requested edit, and a playable browser match: gather resources, trade, build settlements, and upgrade cities. The computer opponent uses a local heuristic; two people can also share the browser. Networked multiplayer is not implemented.

## Use of Astra in the project
- Adaptive design conversation, visual layout alternatives, and concrete mechanic critiques.
- Complete game generation and focused revisions grounded in the current game and selection.
- Composition of editable boxes, cylinders, cones, spheres, and rings into original 3D components.
- Optional viewport image input for visual feedback.
- Evidence-based revisions using bounded playtest diagnostics or a completed match log.
- Local Codex CLI integration using ChatGPT sign-in; no API-key fallback. Each response is validated before preview or application.

## Use of Astra during development
Built collaboratively with Astra in Codex: product exploration, browser UI implementation, Three.js geometry, structured generation contract, guided rule engines, local subscription integration, tests, and the example game drafts. Independent Astra agents chose moves in a recorded Gutter Duel browser playtest. Human direction established the general board-game scope, professional editor styling, conversational creation flow, browser-play focus, optional physical exports, and subscription-only constraint.

## Original contribution and dependencies
The project-specific editor, conversation flow, validation, game document format, parts inspector, preview/apply workflow, print rendering, and local model adapter were developed during this hackathon build. The repository is a curated snapshot of that implementation; earlier exploratory prototypes are excluded. Third-party Three.js and OrbitControls are used under their included MIT license. Node.js, browser platform APIs, and the installed Codex CLI are dependencies, not original contributions.

The builder should verify the event-time attribution above against the actual event start before submitting; do not claim pre-existing work as hackathon work.

## Demo
The one-minute demo shows real interaction with the local app: prompt, visual directions, generation, revision, browser gameplay, and optional exports. Generation waits and iteration are shortened and accelerated portions are labeled. The recording does not claim real-time generation speed.

- Repository: https://github.com/ERICEX2025/board-studio
- Public demo video URL: pending final upload and signed-out link check.
- Hosted AI app: none. Live generation runs locally with the builder's Codex sign-in. Do not submit the earlier static prototype as the live AI app.

## What works / limits
Works: conversational generation and revision, editable 3D components, optional visual critique, staged changes, manual editing, JSON save/open, and guided browser play. Three rule families are enforced: routing, rescue, and island settlement. Other mechanics use free tabletop movement, dice, and deck actions. Optional exports include paper boards/components, assembly instructions and rules, plus a dimensioned STL for an individual component.

Verification: 38 automated tests cover validation, rule behavior and replay, server access, and geometry checks. Recorded agent playtesting supplements these checks. STL export checks closed edges per primitive shell and dimensions; it does not boolean-union overlapping shells or establish manufacturability. No physical print or slicer validation has been completed.

Limits: no networked multiplayer, arbitrary generated rule enforcement, arbitrary mesh generation, or guaranteed balance. Human playtesting is still needed. Model availability and subscription limits depend on the signed-in account. Live AI requires the local server and Codex sign-in; this is not a hosted multi-user subscription service.

## Final submission checklist
- Public repo: https://github.com/ERICEX2025/board-studio.
- One-minute video uploaded to a public URL and checked while signed out.
- Eric Ko added as the sole team member.
- Actual required form fields checked in Cerebral Valley after login.
- Event-time contribution statement verified.
- Links and description reviewed before final form submission.

## Actual form fields

Team Name; Team Members; Project Description; Public Project GitHub Repository; 1-Minute Demo Video; Describe your use of OpenAI products to build the submitted project; Provide feedback from your experience using OpenAI products. The form is prepared in Cerebral Valley; the required video URL is still missing.
