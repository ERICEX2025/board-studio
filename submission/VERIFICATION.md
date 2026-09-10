# Verification — September 10, 2026

## Current end-to-end demo

Catan-like is the primary demo: an original island-settlement game created through a real Astra conversation, visual direction selection, generation, a requested visual edit, and guided browser gameplay. The final narrated one-minute recording is included as `board-studio-demo.mp4`. The final cut adds a spoken explanation, large readable chapter captions, focused interface crops, and labeled before/after views to clarify the product journey. Its final board and gameplay shots show the polished Catan-like geometry. Generation waits and iteration are shortened and accelerated portions are labeled; this is not a claim of one-minute generation latency. The first large draft timed out before a compact retry succeeded.

- Computer use completed a real Catan-like match through the browser: 13 turns, final score 6–5. The downloaded action record replayed to exactly the same complete state.
- The live AI edit preserved the game runtime; the downloaded game JSON was compared before and after the revision.
- The browser opponent is a local heuristic, not an Astra player or remote multiplayer participant. Two people can share the same browser.
- Paper-kit and per-component STL export are optional outputs. Live generation requires the local server and a ChatGPT-authenticated Codex CLI; no hosted AI app is claimed.

## Software and player checks

- 38 automated tests cover game validation, structured response validation, server access and subscription credential isolation, guided routing/rescue/settlement rules, deterministic replay, and STL geometry checks.
- An additional 100-policy-match QA run checked island gameplay. Policy simulations are diagnostics, not evidence of human enjoyment or statistical balance.
- Two independent Astra players completed Gutter Duel through the real interface. Green won 6–3 in twelve turns. The downloaded match record replayed to exactly the same complete state. This supporting recording is separate from the Catan-like demo and its heuristic opponent.
- Player reviewers found a forced early scoring line in Gutter Duel and recommended paired games swapping the first seat. One recorded match does not establish balance.

## Physical export checks and remaining work

- Real browser-generated Gutter Duel and Last Light PDFs were rendered and visually inspected: six and nine pages respectively. Print color scheme and page margins were corrected; final renders have white backgrounds and no clipped text.
- STL export checks closed primitive shells and millimetre dimensions. It does not union overlapping shells or certify supports, wall thickness, connectivity, or manufacturability.
- Physical printing, cutting, assembly, and slicer validation have not been completed. Human blind rules tests, measured play duration, and broader balance testing remain outstanding.
- Public review page and direct MP4 links are listed in SUBMISSION.md. They present the recorded artifact, not a hosted AI service.

## Final visual pass

- The final Catan-like example contains detailed terrain clusters, layered tile edges, and architectural cottage parts. Independent browser QA checked production chit visibility, grounded buildings, and a legal settlement build after correcting tile-top occlusion. The runtime is unchanged.
- The final visual version completed another browser match: 13 turns, 17 actions, final 6–5. The downloaded record replayed exactly.
- Updated optional exports are included: `lantern-cove-kit.pdf` (five pages) and `lantern-cove-house.stl` (detailed cottage geometry). Physical printing and slicer verification remain unperformed.
