# Board Studio

A local board-game studio that turns a conversation with Astra into an editable 3D game you can play in the browser. Printable kits and component STL exports are optional.

## Try it

Open `http://127.0.0.1:4173/board.html?example=lantern-cove` after starting the server to preview **Catan-like**, an original island settlement game inspired by familiar resource-building games. Apply the draft, inspect its editable geometry, and enter Play to gather resources, trade, build settlements, and upgrade cities. Play locally against a heuristic computer opponent or share the browser for two-person play; there is no networked multiplayer.

The main demo follows **prompt → visual directions → generate → revise → play**, with printing and STL export at the end. **Last Light** (`?example=last-light`), **Gutter Duel** (`?example=gutter-duel`), and the observatory geometry study are also available. These are saved Astra-generated examples, not canned responses to new prompts.

Watch the [narrated one-minute demo](https://board-studio-demo-eko.eric-ex.chatgpt.site) or [open the video directly](https://board-studio-demo-eko.eric-ex.chatgpt.site/island-demo-v2.mp4). This public page presents the recorded demo; live AI generation runs locally. See [submission materials](submission/SUBMISSION.md) and the [demo outline](submission/DEMO-SCRIPT.md).

## Run

Requires Node.js 22 or newer. No package installation is needed.

1. Install the Codex CLI and run `codex login`, choosing ChatGPT sign-in. No API key is used.
2. Keep `OPENAI_MODEL=gpt-6-astra` unless intentionally using another compatible model.
3. Run `npm run dev`.
4. Open http://127.0.0.1:4173/board.html.

The server uses the signed-in Codex CLI with ChatGPT subscription usage limits. It rejects API-key login and strips API-key environment variables from CLI processes; there is no API fallback. Optional `.env` settings select the model. Each turn uses an ephemeral, read-only CLI run with validated structured output, and temporary viewport files are deleted afterward. `.env` is ignored by Git. The server binds to loopback and restricts API calls to the local studio origin. This is a local development server, not an internet-facing production service.

## Design flow

- Discuss an idea, choose among visual directions, and ask for design checks.
- Ask Astra to build a draft when ready.
- Review the proposed board on the canvas and apply or discard it.
- Select a component and ask for a focused revision. The request includes the current game and selection.
- The assistant maintains a compact design brief. While generating, the composer shows elapsed time and whether a viewport is included. You can revise an unapplied proposal without losing it; failures and cancellation preserve it. The proposal review lists actual additions, removals, component edits and rule changes. Changes are staged and validated; applying them creates an undo snapshot. If manual edits occurred since the request began, the stale proposal is rejected.
- Short tile text is drawn on the component face and rotates with it. Guided Play enforces quarter-turns, locks and water scoring for routing games.
- Use Components for manual editing. Play enforces routing, rescue and island-settlement rules when a game supplies a supported runtime. Other mechanics use free movement, dice, and deck actions. Print produces assembly instructions, board layouts, cutouts, cards and rules.

Conversation history is retained for the browser session only. Save game downloads the game document, not the chat. There is no account, cloud persistence, arbitrary generated rules enforcement, image generation, or unbounded autonomous playtesting. Components can contain up to 32 editable primitive parts (box, cylinder, cone, sphere, torus), with 1200 total parts per scene. Parts replace the component’s base shape. Older v1 game files load with empty part lists. Paper output uses symbolic footprints and tokens. Export 3D produces a dimensioned binary STL for one component, checks each primitive shell for closed edges, and places the result on the build plate. It does not boolean-union intersecting shells or verify supports, minimum wall thickness, connectivity, or physical manufacturability; inspect the mesh in a slicer before printing. Visual options are generated geometry sketches, not image assets. With Include viewport enabled, each sent message includes a JPEG of the current 3D canvas; it does not capture other pages, UI panels, or the desktop. Review view asks for visual critique. Disable the checkbox for data-only conversations.

## Verification

Run `npm test`: 38 tests cover game validation, guided rules and deterministic replay, deck behavior, provider response validation, local-server access checks, and STL geometry checks. Tests mock the legacy API transport; live studio requests use the ChatGPT-authenticated Codex CLI. Independent Astra agents also played a recorded Gutter Duel match through the UI. That is separate from the local heuristic opponent in the game.

Software checks and agent playtests do not establish human enjoyment or long-term balance. Paper and STL exports have not been physically printed or validated in a slicer.

## Architecture

- `dist/game-model.mjs`: shared versioned game data and validation.
- `dist/board.js`: canvas/editor, selection, preview/apply, play, print, save/open.
- `dist/design-chat.js`: persistent design conversation and visual options.
- `server/design-agent.mjs`: shared output contract and validation; legacy API adapter (not wired to the studio).
- `server/codex-agent.mjs`: subscription-only local Codex CLI adapter.
- `server.mjs`: local static server and same-origin API adapter.

An earlier exploratory Sites publication is not the submitted live app. The subscription-backed app requires this local server and a local Codex sign-in; uploading `dist` alone will not provide AI functionality.

The generated **Gutter Duel** example (`?example=gutter-duel`) records a complete exploration-to-choice-to-game test, including its design brief and playtest hypotheses. It uses rotating gutter tiles, a shared water pawn and household paper for scores.

## Guided play and bounded improvement

Gutter Duel now has 34 editable rooftop parts generated in a live Astra visual revision. The editor validated that all 14 IDs, rules and runtime fields were preserved. Open `?example=gutter-duel`, apply, then Play.

Three declarative families run locally: **routing** (quarter-turns, locks, traced water, scoring, and a turn-limit ending), **rescue** (seeded weather, alternating initiative, movement limits, separate rescues and terminal scoring), and **settlement** (seeded resource production, a free resource choice when production misses, adjacent construction, city upgrades, 3-for-1 bank trade, and point/turn-limit endings). Catan-like uses the settlement family, with buildings on hex centers. The computer opponent uses local heuristics (two-ply for grid games); it is not an Astra call. Manual tabletop remains available for other mechanics. A common runtime generates both enforced behavior and rules prose. Save stores the design; completed matches have a separate downloadable record with the seed and action history.

**Test game** runs a bounded 12-match diagnostic with deterministic strategy and random policies, reports coarse warnings, and can send the evidence to Astra for a targeted proposal. Complete a match to review its actual log with Astra. Inspect/apply changes, then test again. No background model calls or automatic application. These small samples do not establish balance, enjoyment or human comprehension.

Run `node scripts/playtest.mjs` to regenerate `submission/playtest-report.json`. Run `python scripts/print-demo.py` with reportlab installed to generate the two paper kits from current examples. PDFs include calibration, assembly, starting positions, components, weather backs where applicable, quick reference and rules. The browser Print view also derives a kit from the current guided design; arbitrary manual games retain the generic print layout.
