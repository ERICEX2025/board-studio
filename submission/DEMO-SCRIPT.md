# One-minute demo: Catan-like

**Opening promise:** Describe a board game, refine it with AI, and play it in your browser.

The final 60-second video uses narration, large chapter captions, and focused recordings of real product interaction. It opens on the finished island so viewers immediately see what Board Studio creates, then explains how it was made.

| Chapter | Recorded action | What the viewer should understand |
| --- | --- | --- |
| Describe your game | Enter an island-settlement idea in the design conversation. | Start with intent; no modeling or code is required from the user. |
| Choose a direction | Compare visual options and choose Catan-like. | The conversation helps turn an idea into a concrete design. |
| Refine with AI | Inspect the generated board and a labeled before/after revision. | The generated 3D game remains editable after the first draft. |
| Play in your browser | Gather resources, build settlements, and reach the match result. | Supported rules are enforced in playable browser matches. |
| Optional: take it to the table | Show paper-kit and component STL export during the final six seconds. | Physical outputs are optional; browser play is the primary experience. |

Catan-like is an original Catan-inspired island-settlement game, not an implementation of Catan's exact rules. The browser opponent is a local heuristic. The separate Gutter Duel recording contains moves chosen by two independent Astra agents and serves as supporting QA evidence.

Generation waits and iteration are shortened, with accelerated portions labeled. Before/after views are explicitly identified. The raw capture preserves the longer journey, including a timeout and retry; the edit does not claim one-minute generation latency or first-attempt success.

## Verification boundaries

- Generation and revision returned validated editable documents; the visual revision preserved the runtime.
- A complete Catan-like browser match ended 6–5 after 13 turns, and its action record replayed exactly.
- Paper and STL exports are optional artifacts. STL dimensions and primitive shell closure are checked; slicer validation and a successful physical print are not claimed.
- Neither heuristic simulations nor agent matches establish human enjoyment or balance.
- The public demo page presents the recording. Live AI generation still requires the local server and a signed-in Codex CLI.
