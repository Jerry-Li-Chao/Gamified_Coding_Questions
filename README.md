# Algo Arcade — Gamified Coding Questions

Algo Arcade turns coding interview questions into interactive lessons. Each tutorial connects a playful visualization, learner-controlled experiments, plain-language explanations, and a live implementation so the code changes feel physically meaningful.

The project currently includes a complete Binary Search lesson and is structured to grow into a library of algorithm and data-structure tutorials.

## Shared tutorial experience

- Extensible lesson navigation and progress
- Interactive problem visualization with reversible steps
- Live code that stays synchronized with learner actions
- Exact “Why this line?” explanations
- Manual edge-case and complexity demonstrations
- Responsive three-pane layout that stacks cleanly on smaller screens
- Accessible controls with keyboard and reduced-motion support

## Run locally

No build step or dependencies are required.

```bash
python3 -m http.server 4173
```

Then open [http://localhost:4173](http://localhost:4173).

## Current lessons

- **Binary Search:** boundaries, shrinking search ranges, loop conditions, midpoint arithmetic, comparisons, and complexity.

## Adding future tutorials

Use the repository-local [`design-gamified-code-tutorials`](.agents/skills/design-gamified-code-tutorials/SKILL.md) skill as the shared design and interaction contract. Keep problem-specific teaching content separate from the reusable lesson shell.
