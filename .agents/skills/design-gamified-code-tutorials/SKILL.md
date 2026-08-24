---
name: design-gamified-code-tutorials
description: Design, build, or refine interactive gamified coding-tutorial webpages with a consistent lesson shell, live code synchronization, learner-controlled visuals and explanations, responsive layouts, and restrained instructional motion. Use for new algorithm/data-structure lessons, extensions to an existing coding-tutorial repository, or reviews of tutorial UI, animation, navigation, teaching clarity, accessibility, and responsive behavior.
---

# Design Gamified Coding Tutorials

Build each lesson as the same learning instrument with problem-specific content plugged into it. Preserve learner control, make every state transition legible, and keep the live visualization and code causally synchronized.

## Define the lesson before implementing

Write these three statements first:

- **Learning thesis:** Name the single mental model the visualization must make tangible.
- **Interaction thesis:** Name the direct action learners perform and the state change it reveals.
- **Visual thesis:** Describe a bright, friendly, hand-drawn classroom world with clear contrast and minimal decorative distraction.

Map each tutorial step to one concept, one learner action, one visible state change, and the exact code line that action executes. Exclude problem-specific content from the shared shell.

## Preserve the page anatomy

Use three primary regions on wide screens:

1. **Lesson navigation:** Keep a vertical, extensible menu with the active topic, future-topic placeholders, and progress.
2. **Interactive workspace:** Make the visualization the largest region. Include the lesson title/header, optional visual-aid toggle, compact focus/target readout, prominent live state summary, non-overlapping tool area, visualization, and step coach.
3. **Live code inspector:** Show the incrementally revealed solution, the exact active line, a plain-language “Why this line?” explanation that repeats the referenced line, and a complexity footer.

Keep the live state summary above the visualization. Treat it as a real-time notification, not as step copy. Make it larger than supporting instructions and update it whenever the represented subproblem changes.

Keep tools outside the visualization’s data and coaching regions. Never allow pointers, labels, tool palettes, code notes, or coach controls to overlap at supported sizes.

Include an appropriate source-problem or authoritative reference link in the header when one exists. Label it with the source name rather than a generic “Problem” label. Omit it for a concept lesson with no useful canonical source.

Place a compact **Problem** or **Prompt** button beside the lesson title. Open an in-page, attributed problem sheet containing the title, paraphrased task, examples, constraints, and required complexity. Preserve factual values but do not republish lengthy third-party wording verbatim. Keep the learner’s current lesson state unchanged when opening or closing it.

## Keep teaching state synchronized

Maintain one canonical lesson state and derive the visualization, summary, instructions, and code inspector from it.

- Update the highlighted code line to the line actually executed by the learner’s latest action.
- Update displayed variable values when learners operate or manipulate the corresponding visual controls.
- Highlight the element that changed; do not pre-highlight a correct choice or visually reveal an answer.
- Distinguish the current focus, target, selected tool, active boundary, inactive data, and completed state without relying on text alone.
- Constrain invalid actions physically and explain the constraint briefly.
- Prefer the interaction native to the concept: use dragging for spatial relationships and buttons, inputs, or selections for discrete operations. Provide click/tap and keyboard alternatives whenever dragging is used.

Allow learners to move backward and forward freely. Restore a canonical snapshot for each main step so navigation remains deterministic even after experimentation. Preserve learner-created state across Next only when the following step explicitly teaches from that exact state; otherwise load the next step’s canonical example. Reset must restore the canonical start of the current step.

## Give learners control

Never advance the main lesson merely because a learner selected a correct answer. Update the current explanation if useful, keep the popup open, and require an explicit **Next** action to advance.

Never autoplay instructional demonstrations. Provide visible Previous/Next controls and support reversal at every demonstration state.

Keep explanatory popups open after choices. Close them only through an explicit close button, clicking the backdrop, or pressing Escape. Do not close them when feedback appears.

Use neutral styling for unanswered choices. Apply success/error styling only after selection. Let incorrect choices remain retryable unless the lesson explicitly requires a reset.

## Animate causality, not decoration

Avoid teleporting or snapping between meaningful states.

- Move pointers, markers, and shared labels smoothly from their old position to their new position.
- Briefly emphasize values, ranges, summaries, and code lines that changed.
- Keep elements that did not change visually stable.
- Use consistent easing and short durations, approximately 350–650 ms for state transitions.
- Animate a shared label, such as a computed-position marker, as the same object moving between positions.
- Use entrance motion only to establish a newly introduced concept or control.
- Respect `prefers-reduced-motion` and preserve all meaning without animation.

Do not add ambient motion, autoplay, or decorative effects that compete with the lesson. If motion does not explain cause and effect, remove it.

## Explain code through physical meaning

Use plain language before notation. Describe what the learner can see, then connect it to the code.

- Quote the exact code expression or line inside every “Why this line?” explanation.
- Explain boundary conditions with a concrete edge case and learner-controlled states.
- Explain index arithmetic using visible positions and whole-cell consequences.
- Frame recursive or iterative narrowing as the same problem over a smaller valid state.
- Keep copy conversational and continuous; do not begin with an isolated conclusion that lacks context.
- Use readable instructional type at every supported size; avoid tiny labels and dense paragraphs.

Make complexity explanations interactive. Add a **Why?** control beside time and space complexity. Illustrate work reduction step by step and separately illustrate the amount of extra memory retained as the input grows. Distinguish input/data-structure storage from per-operation auxiliary space whenever both are relevant. Keep this explanation manual and reversible.

## Use the visual language consistently

Favor bright paper-like surfaces, hand-drawn outlines, slightly irregular radii, friendly typography, and clear semantic colors. Keep any texture subtle and stationary. Avoid disorienting scenic backgrounds, dark color grading, excessive gradients, and decoration that reduces data clarity.

Use color to encode meaning consistently, but pair it with labels, shape, position, opacity, or borders. Keep targets and active states visually distinct. Make important computed labels large and place them next to or above the visual element they describe.

Keep body and instructional fonts comfortably readable. Make code slightly denser than prose, using modestly smaller type and tighter indentation so useful expressions fit without sacrificing legibility.

## Make the shell fluid

Avoid fixed canvas widths and minimum sizes that cause clipping. Use `minmax(0, 1fr)`, `clamp()`, fluid gaps, and shrinkable children.

- Keep all three panes visible at common desktop widths.
- Let the code inspector become slightly denser before sacrificing the game workspace.
- Prevent code clipping with wrapping or deliberate scrolling; never let the inspector extend off-screen.
- Compact the navigation at medium widths.
- Stack the code inspector below the game when three columns no longer remain readable.
- Preserve usable controls, readable labels, non-overlap, and modal scrolling on narrow or short viewports.
- Avoid horizontal page scrolling unless the learning content intrinsically requires it.

## Include these shared components

Require the following unless the tutorial genuinely makes one irrelevant:

- Extensible lesson navigation and progress
- Lesson title and source-problem or reference link when one exists
- Title-adjacent Problem/Prompt button opening an attributed in-page problem sheet
- Optional visual-aid toggle when the visualization has secondary layers
- Compact target/focus readout
- Prominent live state/subproblem summary
- Operation/tool area with an unmistakable active operation or tool
- Main problem visualization with indices, labels, or equivalent coordinates
- Step coach with explicit Back and Next controls
- Live code inspector with exact active-line highlighting
- “Why this line?” panel containing the referenced line
- Time and space complexity footer with an interactive “Why?” explanation
- Reusable explanation modal with close button, backdrop close, Escape close, and manual internal navigation; use it for quizzes, complexity explanations, or material too detailed for the main coach
- Reset control for safe experimentation

## Verify before handoff

Test the actual rendered lesson, not only the source.

1. Exercise every main step forward and backward.
2. Manipulate each draggable control and verify constraints, focus styling, code values, and active lines.
3. Choose correct and incorrect answers; confirm that popups stay open and lesson steps do not advance automatically.
4. Reverse every instructional demonstration and confirm it never autoplays.
5. Inspect common wide, medium, narrow, and short viewports for clipping, overlap, unreadable type, and lost controls.
6. Confirm meaningful motion is smooth and reduced-motion mode remains understandable.
7. Check keyboard access, button names, dialog labeling, live-region behavior, focus visibility, and color-independent state cues.
8. Run syntax, formatting, and project tests before committing.

Prefer small, evidence-backed revisions. When a screenshot reveals a layout problem, fix the underlying responsive rule rather than adding a one-off offset for that screenshot.
