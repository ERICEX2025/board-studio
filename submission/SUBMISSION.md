# Board Studio

**Builder:** Eric Ko (solo)

**One-line pitch:** Turn a game idea into an editable 3D tabletop prototype and a printable game kit through conversation.

## Project description
Board Studio is an AI-assisted workspace for inventing board games. Describe an idea, discuss mechanics, compare visual layout options, and generate a complete draft with a board, pieces, cards, and rules. Continue refining it through conversation or direct editing. Proposed changes appear in the viewport before you apply them, and undo preserves the previous game.

Astra designs structured game documents and composes editable 3D landmarks from primitive parts. With viewport sharing enabled, it can also review the current camera view alongside the game data. The same document drives the 3D editor, free tabletop mode, save/open, and a printable kit.

## Use of Astra in the project
- Adaptive design conversation, visual layout alternatives, and concrete mechanic critiques.
- Complete game generation and focused revisions grounded in the current game and selection.
- Composition of editable boxes, cylinders, cones, spheres, and rings into original 3D components.
- Optional viewport image input for visual feedback.
- Local Codex CLI integration using ChatGPT sign-in; no API-key fallback. Each response is validated before preview or application.

## Use of Astra during development
Built collaboratively with Astra in Codex: product exploration, browser UI implementation, Three.js geometry, structured generation contract, validation, local subscription integration, tests, and the example geometry/game drafts. Human direction established the general board-game scope, professional editor styling, conversational creation flow, print workflow, and subscription-only constraint.

## Original contribution and dependencies
The project-specific editor, conversation flow, validation, game document format, parts inspector, preview/apply workflow, print rendering, and local model adapter were developed during this hackathon build. The repository is a curated snapshot of that implementation; earlier exploratory prototypes are excluded. Third-party Three.js and OrbitControls are used under their included MIT license. Node.js, browser platform APIs, and the installed Codex CLI are dependencies, not original contributions.

The builder should verify the event-time attribution above against the actual event start before submitting; do not claim pre-existing work as hackathon work.

## Demo
See DEMO-SCRIPT.md for a 60-second recording plan. Use the real running app. If generation is edited for time, visibly label the cut. A recorded example is not evidence of live generation speed.

- Repository: https://github.com/ERICEX2025/board-studio
- Public demo video URL: recording/upload still required.
- Hosted AI app: none. Live generation runs locally with the builder's Codex sign-in. Do not submit the earlier static prototype as the live AI app.

## What works / limits
Works: editable 3D components, generated game drafts, optional visual critique, staged revisions, manual component editing, free movement, dice, card draw/shuffle, JSON save/open, and symbolic print layouts.

Limits: prototype rules need human playtesting; gameplay rules are not automatically enforced. No multiplayer, arbitrary mesh generation, STL export, or guaranteed balance. Printed output is a board overview with tokens/cards/rules, not manufactured 3D objects. Model availability and subscription limits depend on the signed-in account. This local bridge is not a hosted multi-user subscription service.

## Final submission checklist
- Public repo: https://github.com/ERICEX2025/board-studio.
- One-minute video uploaded to a public URL and checked while signed out.
- Eric Ko added as the sole team member.
- Actual required form fields checked in Cerebral Valley after login.
- Event-time contribution statement verified.
- Links and description reviewed before final form submission.

## Actual form fields

Team Name; Team Members; Project Description; Public Project GitHub Repository; 1-Minute Demo Video; Describe your use of OpenAI products to build the submitted project; Provide feedback from your experience using OpenAI products. The form is prepared in Cerebral Valley; the required video URL is still missing.
