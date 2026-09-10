# Main demo: Lantern Cove

Show one continuous user story: a familiar island-settlement game, made and revised in a general-purpose editor. The game is original and Catan-inspired; it is not an implementation of Catan's exact rules.

| Time | Actual screen action | What the viewer should understand |
| --- | --- | --- |
| 0–10s | Start from a blank workspace; enter the island idea. | The user supplies intent, not a model or code. |
| 10–20s | Show two returned visual directions and select Lantern Cove. | The conversation helps make design decisions. |
| 20–35s | Review and apply the generated island. Orbit and inspect a building. | The result is editable 3D geometry plus structured rules. |
| 35–50s | Request a visible revision, review the difference, and apply. | AI remains part of editing after the first draft. |
| 50–70s | Collect a resource, build, show the opponent's turn and scoring. | The selected game has enforced, playable rules. |
| 70–85s | Show the paper board, building markers, resource ledger and manual. | The digital design becomes an assembly kit. |
| 85–95s | Export a house to STL with millimetre dimensions and mesh checks. | Optional fabrication output exists; a slicer/physical print still needs testing. |

Keep a raw capture. Shorten waiting and repetitive turns only with a visible label. A timeout and retry are part of the raw evidence; do not imply the first request succeeded. If using a saved result, label it as a previously generated example.

The built-in computer is a local heuristic, not Astra. The separate Gutter Duel recording contains a complete game chosen by two independent Astra players and serves as supporting QA evidence. Neither a heuristic simulation nor an AI-player match establishes human enjoyment or balance.

# Quality gates before a final submission claim

- Actual generation and revision return validated, editable documents.
- UI gameplay respects the same rules used in the paper manual.
- PDF pages are rendered and inspected for clipping and readable assembly instructions.
- STL dimensions and edge closure are checked. No claim of slicer validation or a successful physical print without doing it.
- Raw recording and edited review remain available; the final public video plays while signed out.
- The user judges visual polish, clarity, and whether the experience tells a convincing story.
