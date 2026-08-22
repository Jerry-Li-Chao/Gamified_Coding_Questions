# Searchlight — Gamified Binary Search

An interactive, visual binary-search lesson that connects pointer movement, shrinking subproblems, loop conditions, midpoint arithmetic, and comparisons directly to working Python code.

## Run locally

No build step or dependencies are required.

```bash
python3 -m http.server 4173
```

Then open [http://localhost:4173](http://localhost:4173).

## Lesson flow

1. Place inclusive left and right boundaries.
2. Explore how the active subproblem changes.
3. See why `left <= right` preserves the final candidate.
4. Calculate `mid` using floor division.
5. Compare and discard half of the candidates.
6. Return the target index.

The left navigation is structured for future algorithm lessons, while the right-side codebook progressively reveals the final solution.
