const state = {
  nums: [1, 4, 7, 12, 16, 20, 29],
  target: 16,
  left: null,
  right: null,
  activeTool: "left",
  stage: 0,
  explored: false,
  mid: null,
  found: false,
  histograms: true,
  activeCodeLine: 1,
};

const stages = [
  { title: "Mark the search boundaries", text: "Select the <b>Left</b> tool, then place it at index 0. Place the <b>Right</b> tool at index 6." },
  { title: "The same problem, made smaller", text: "Move either boundary and watch values outside it fade. Each move turns the original search into the same problem over a smaller sorted slice." },
  { title: "Keep the last candidate alive", text: "Why does the loop use <b>left &lt;= right</b>? Inspect the one-cell case, then choose the condition that still checks it." },
  { title: "Cut the range safely in half", text: "Compute the middle index. Floor division gives us one real array index when the range has an even number of positions." },
  { title: "Compare, then discard half", text: "Compare the target with the glowing middle value. Which half can be safely discarded?" },
  { title: "Specimen located!", text: "When <b>nums[mid] == target</b>, return the index. You found the answer without checking every value." },
];

const codeLines = [
  `<span class="kw">class</span> <span class="type">Solution</span>:`,
  `    <span class="kw">def</span> <span class="fn">search</span>(self, nums: <span class="type">List</span>[<span class="type">int</span>], target: <span class="type">int</span>) -&gt; <span class="type">int</span>:`,
  `        left = <span class="num">0</span>`,
  `        right = len(nums) - <span class="num">1</span>`,
  ``,
  `        <span class="kw">while</span> left &lt;= right:`,
  `            mid = left + (right - left) // <span class="num">2</span>`,
  ``,
  `            <span class="kw">if</span> nums[mid] == target:`,
  `                <span class="kw">return</span> mid`,
  `            <span class="kw">elif</span> nums[mid] &lt; target:`,
  `                left = mid + <span class="num">1</span>`,
  `            <span class="kw">else</span>:`,
  `                right = mid - <span class="num">1</span>`,
  ``,
  `        <span class="kw">return</span> -<span class="num">1</span>`,
];

const $ = (selector) => document.querySelector(selector);
const rig = $("#array-rig");
const modal = $("#concept-modal");
let draggedPointer = null;
let lastDragIndex = null;
let renderedStage = state.stage;

function renderArray() {
  rig.innerHTML = state.nums.map((value, index) => {
    const outside = state.left !== null && state.right !== null && (index < state.left || index > state.right);
    const canDrag = state.stage <= 1;
    const leftActive = state.activeTool === "left" ? " active" : "";
    const rightActive = state.activeTool === "right" ? " active" : "";
    const markers = `${state.left === index ? `<span class="marker-handle left${leftActive}" data-pointer="left" title="Drag the Left pointer" ${canDrag ? 'role="slider" tabindex="0" aria-label="Drag Left pointer"' : ""}><span class="marker">L</span>${canDrag ? "<small>DRAG</small>" : ""}</span>` : ""}${state.right === index ? `<span class="marker-handle right${rightActive}" data-pointer="right" title="Drag the Right pointer" ${canDrag ? 'role="slider" tabindex="0" aria-label="Drag Right pointer"' : ""}><span class="marker">R</span>${canDrag ? "<small>DRAG</small>" : ""}</span>` : ""}`;
    const classes = ["array-cell", value === state.target ? "is-target" : "", outside ? "out-of-range" : "", state.mid === index ? "is-mid" : "", state.found && state.mid === index ? "found" : ""].join(" ");
    return `<button class="${classes}" data-index="${index}" type="button" aria-label="Value ${value} at index ${index}">
      ${state.mid === index ? '<span class="mid-label" aria-label="Middle index">MID</span>' : ""}
      <span class="histogram" style="--value:${value}"></span>
      <span class="cell-body"><span class="cell-value">${value}</span></span>
      <span class="cell-index">${index}</span>
      <span class="pointer-marker">${markers}</span>
    </button>`;
  }).join("");
  rig.classList.toggle("hide-histograms", !state.histograms);
  rig.querySelectorAll(".array-cell").forEach(cell => cell.addEventListener("click", () => placePointer(Number(cell.dataset.index))));
  rig.querySelectorAll(".marker-handle[role='slider']").forEach(marker => {
    marker.addEventListener("pointerdown", startPointerDrag);
    marker.addEventListener("keydown", event => {
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
      event.preventDefault();
      state.activeTool = marker.dataset.pointer;
      const current = state[marker.dataset.pointer];
      placePointer(current + (event.key === "ArrowRight" ? 1 : -1));
    });
  });
  updateRangeSentence();
}

function startPointerDrag(event) {
  if (state.stage > 1) return;
  event.preventDefault();
  event.stopPropagation();
  draggedPointer = event.currentTarget.dataset.pointer;
  lastDragIndex = state[draggedPointer];
  state.activeTool = draggedPointer;
  document.body.classList.add("is-dragging-pointer");
  render();
}

function moveDraggedPointer(event) {
  if (!draggedPointer) return;
  event.preventDefault();
  const cell = document.elementFromPoint(event.clientX, event.clientY)?.closest(".array-cell");
  if (!cell) return;
  const index = Number(cell.dataset.index);
  if (index === lastDragIndex) return;
  lastDragIndex = index;
  state.activeTool = draggedPointer;
  placePointer(index);
}

function stopPointerDrag() {
  if (!draggedPointer) return;
  draggedPointer = null;
  lastDragIndex = null;
  document.body.classList.remove("is-dragging-pointer");
}

function placePointer(index) {
  if (state.stage > 1 || state.found) return;
  if (index < 0 || index >= state.nums.length) return nudgeInvalid("That pointer is already at the edge of the array.");
  if (state.activeTool === "left") {
    if (state.right !== null && index > state.right) return nudgeInvalid("Left cannot pass Right — that would make the range empty.");
    state.left = index;
    state.activeCodeLine = 2;
    if (state.stage === 0 && index === 0) state.activeTool = "right";
  } else {
    if (state.left !== null && index < state.left) return nudgeInvalid("Right cannot pass Left — that would make the range empty.");
    state.right = index;
    state.activeCodeLine = 3;
  }
  if (state.stage === 1 && (state.left !== 0 || state.right !== 6)) state.explored = true;
  render();
  if (state.stage === 0 && state.left === 0 && state.right === 6) {
    setTimeout(() => {
      if (state.stage === 0 && state.left === 0 && state.right === 6) jumpToStage(1);
    }, 450);
  }
}

function nudgeInvalid(message) {
  $("#range-sentence").textContent = message;
  rig.animate([{ transform: "translateX(-4px)" }, { transform: "translateX(4px)" }, { transform: "none" }], { duration: 260 });
}

function updateRangeSentence() {
  const label = $("#range-sentence");
  if (!label) return;
  if (state.left === null || state.right === null) {
    const missing = state.left === null ? "Left" : "Right";
    label.textContent = `${missing} boundary is waiting to be placed.`;
    return;
  }
  const slice = state.nums.slice(state.left, state.right + 1);
  label.innerHTML = `Current subproblem: find <b>${state.target}</b> inside [${slice.join(", ")}]. ${slice.length} candidate${slice.length === 1 ? " remains" : "s remain"}.`;
}

function renderCoach() {
  const copy = stages[state.stage];
  $("#stage-count").textContent = `STEP ${state.stage + 1} OF ${stages.length}`;
  $("#coach-title").textContent = copy.title;
  $("#coach-text").innerHTML = copy.text;
  const actions = $("#coach-actions");
  actions.innerHTML = "";

  if (state.stage === 1) {
    actions.innerHTML = `<button class="action-button" id="lock-range" ${state.explored ? "" : "disabled"}>Reset & lock range</button>`;
    $("#lock-range").onclick = () => jumpToStage(2);
  } else if (state.stage === 2) {
    actions.innerHTML = `<button class="action-button" id="inspect-loop">Inspect one-cell case</button>`;
    $("#inspect-loop").onclick = openLoopModal;
  } else if (state.stage === 3) {
    actions.innerHTML = `<button class="action-button" id="calculate-mid">Calculate mid</button>`;
    $("#calculate-mid").onclick = openMidModal;
  } else if (state.stage === 4) {
    const midValue = state.nums[state.mid];
    actions.innerHTML = `<button class="action-button choice" data-choice="higher">Target is higher</button><button class="action-button secondary choice" data-choice="lower">Target is lower</button>${midValue === state.target ? '<button class="action-button choice" data-choice="found">It matches!</button>' : ''}`;
    actions.querySelectorAll(".choice").forEach(button => button.onclick = () => compareChoice(button.dataset.choice));
  } else if (state.stage === 5) {
    actions.innerHTML = `<button class="action-button" id="replay">Replay lesson</button><a class="action-button secondary" href="https://neetcode.io/problems/binary-search/question?list=neetcode150" target="_blank" rel="noreferrer" style="text-align:center;text-decoration:none">Try the problem ↗</a>`;
    $("#replay").onclick = resetLesson;
  }

  actions.insertAdjacentHTML("beforeend", `
    <div class="step-nav" aria-label="Lesson step navigation">
      <button class="step-button" id="previous-step" type="button" ${state.stage === 0 ? "disabled" : ""} aria-label="Previous step">← <span>Back</span></button>
      <button class="step-button" id="next-step" type="button" ${state.stage === stages.length - 1 ? "disabled" : ""} aria-label="Next step"><span>Next</span> →</button>
    </div>`);
  $("#previous-step").onclick = () => jumpToStage(state.stage - 1);
  $("#next-step").onclick = () => jumpToStage(state.stage + 1);
}

function renderCode() {
  const renderedCodeLines = [...codeLines];
  if (state.stage === 1 && state.left !== null && state.right !== null) {
    renderedCodeLines[2] = `        left = <span class="num">${state.left}</span> <span class="comment"># current Left pointer</span>`;
    renderedCodeLines[3] = `        right = <span class="num">${state.right}</span> <span class="comment"># current Right pointer</span>`;
  }
  let revealed = 2;
  if (state.stage >= 1) revealed = 4;
  if (state.stage >= 2) revealed = 6;
  if (state.stage >= 3) revealed = 7;
  if (state.stage >= 4) revealed = 14;
  if (state.stage >= 5) revealed = 16;
  $("#code-block").innerHTML = renderedCodeLines.slice(0, revealed).map((line, i) => `<span class="code-line ${i === state.activeCodeLine ? "active-line" : ""}">${line || " "}</span>`).join("");
  const noteDetails = [
    { label: "WHY THIS LINE?", line: `def search(self, nums, target) -&gt; int:`, text: "This function receives the sorted array and target, then returns the target’s index—or -1 when it is absent." },
    { label: "LIVE POINTER STATE", line: `left = ${state.left ?? 0}\nright = ${state.right ?? state.nums.length - 1}`, text: "These values match the handles on the array. Drag either handle and both the code and active range update immediately." },
    { label: "WHY THIS LINE?", line: `while left &lt;= right:`, text: "The loop continues while at least one unchecked candidate remains. Equal pointers mean one candidate is left; crossed pointers mean the range is empty." },
    { label: "WHY THIS LINE?", line: `mid = left + (right - left) // 2`, text: "Floor division turns the halfway point into a valid integer index, choosing the lower middle when there are two middle positions." },
    { label: "WHY THESE LINES?", line: `if nums[mid] == target:\nelif nums[mid] &lt; target:\nelse:`, text: "These comparisons either return the answer or discard the half that cannot contain the target." },
    { label: "WHY THIS LINE?", line: `return mid`, text: "At this point nums[mid] equals the target, so mid is exactly the index the function must return." },
  ];
  const note = noteDetails[state.stage];
  $("#code-note").innerHTML = `<span class="note-pin">✦</span><div><strong>${note.label}</strong><code class="note-line">${note.line}</code><p>${note.text}</p></div>`;
}

function updateProgress() {
  const value = Math.round((state.stage / (stages.length - 1)) * 100);
  const ring = $("#nav-progress");
  ring.textContent = `${value}%`;
  ring.style.background = `conic-gradient(var(--teal) ${value}%, #183539 0)`;
  $("#progress-copy").textContent = stages[state.stage].title;
}

function render() {
  const previous = captureRenderState();
  document.querySelectorAll(".pointer-tool").forEach(tool => {
    tool.classList.toggle("active", tool.dataset.tool === state.activeTool);
    tool.disabled = state.stage > 1;
  });
  $("#active-pointer-mode").textContent = state.stage <= 1 ? "NOW MOVING" : "POINTERS LOCKED";
  $("#active-pointer-name").textContent = state.activeTool.toUpperCase();
  renderArray();
  renderCoach();
  renderCode();
  updateProgress();
  $("#target-value").textContent = state.target;
  requestAnimationFrame(() => animateRenderChanges(previous));
  renderedStage = state.stage;
}

function captureRenderState() {
  return {
    stage: renderedStage,
    rangeText: $("#range-sentence")?.textContent || "",
    markers: new Map([...rig.querySelectorAll(".marker-handle")].map(marker => [marker.dataset.pointer, marker.getBoundingClientRect()])),
    cells: new Map([...rig.querySelectorAll(".array-cell")].map(cell => [cell.dataset.index, cell.className])),
    midRect: rig.querySelector(".mid-label")?.getBoundingClientRect() || null,
  };
}

function animateRenderChanges(previous) {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  rig.querySelectorAll(".marker-handle").forEach(marker => {
    const oldRect = previous.markers.get(marker.dataset.pointer);
    if (!oldRect) return;
    const newRect = marker.getBoundingClientRect();
    const deltaX = oldRect.left - newRect.left;
    const deltaY = oldRect.top - newRect.top;
    if (Math.abs(deltaX) < 1 && Math.abs(deltaY) < 1) return;
    marker.animate([{ translate: `${deltaX}px ${deltaY}px` }, { translate: "0 0" }], { duration: 520, easing: "cubic-bezier(.22,.8,.25,1)" });
  });

  const midLabel = rig.querySelector(".mid-label");
  if (midLabel && previous.midRect) {
    const newRect = midLabel.getBoundingClientRect();
    const deltaX = previous.midRect.left - newRect.left;
    const deltaY = previous.midRect.top - newRect.top;
    if (Math.abs(deltaX) >= 1 || Math.abs(deltaY) >= 1) {
      midLabel.animate([
        { translate: `${deltaX}px ${deltaY}px`, opacity: .72 },
        { translate: "0 0", opacity: 1 },
      ], { duration: 520, easing: "cubic-bezier(.22,.8,.25,1)" });
    }
  }

  rig.querySelectorAll(".array-cell").forEach(cell => {
    const oldClass = previous.cells.get(cell.dataset.index);
    if (!oldClass || oldClass === cell.className) return;
    cell.animate([
      { filter: "brightness(1) saturate(1)" },
      { filter: "brightness(1.18) saturate(1.3)", offset: .38 },
      { filter: "brightness(1) saturate(1)" },
    ], { duration: 620, easing: "ease-out" });
  });

  const range = $("#range-sentence");
  if (range && previous.rangeText !== range.textContent) {
    range.animate([
      { boxShadow: "4px 4px 0 #72d6c5", transform: "translateX(-50%) rotate(.25deg) scale(1)" },
      { boxShadow: "6px 6px 0 #ff9ca7", transform: "translateX(-50%) rotate(.25deg) scale(1.018)", offset: .38 },
      { boxShadow: "4px 4px 0 #72d6c5", transform: "translateX(-50%) rotate(.25deg) scale(1)" },
    ], { duration: 620, easing: "ease-out" });
  }

  if (previous.stage !== state.stage) {
    $(".coach-box")?.animate([
      { opacity: .72, translate: "0 10px" },
      { opacity: 1, translate: "0 0" },
    ], { duration: 420, easing: "cubic-bezier(.2,.8,.3,1)" });
  }
}

function openLoopModal() {
  $("#modal-content").innerHTML = `
    <span class="eyebrow">THE LAST CANDIDATE</span>
    <h2 id="modal-title">One cell is still a search range.</h2>
    <p>Every other value has been ruled out. Left and Right now meet on 12, so 12 is the final unchecked candidate. Watch how the two conditions handle it differently.</p>
    <div class="condition-demos" data-step="1">
      <section class="condition-case correct-case">
        <header><span>INCLUSIVE CONDITION</span><code>left &lt;= right</code><b>CHECKS 12 ✓</b></header>
        <div class="one-cell-scene"><span class="case-pointer left">L</span><span class="lone-cell">12</span><span class="case-pointer right">R</span></div>
        <ol class="case-timeline">
          <li><b>1</b><span>Left equals Right, so one candidate remains.</span></li>
          <li><b>2</b><span><code>left &lt;= right</code> is true. The loop inspects 12.</span></li>
          <li><b>3</b><span>After a miss, a pointer moves past the other. The range is empty, so the loop stops.</span></li>
        </ol>
      </section>
      <section class="condition-case wrong-case">
        <header><span>STRICT CONDITION</span><code>left &lt; right</code><b>SKIPS 12 ✕</b></header>
        <div class="one-cell-scene"><span class="case-pointer left">L</span><span class="lone-cell">12</span><span class="case-pointer right">R</span></div>
        <ol class="case-timeline">
          <li><b>1</b><span>Left equals Right, but 12 has not been checked yet.</span></li>
          <li><b>2</b><span><code>left &lt; right</code> is false because the pointers are equal.</span></li>
          <li><b>3</b><span>The loop stops immediately and skips 12—even when 12 is the target.</span></li>
        </ol>
      </section>
      <div class="demo-controls" aria-label="One-cell demonstration controls">
        <button id="demo-previous" type="button" disabled>← Previous</button>
        <strong id="demo-step-label">Step 1 of 3</strong>
        <button id="demo-next" type="button">Next →</button>
      </div>
    </div>
    <p>Which condition correctly includes the last remaining candidate?</p>
    <div class="quiz-options"><button class="quiz-option" data-answer="wrong">while left &lt; right</button><button class="quiz-option" data-answer="correct">while left &lt;= right</button></div>
    <div class="modal-feedback" id="modal-feedback"></div>`;
  modal.hidden = false;
  let demoStep = 1;
  const updateDemoStep = (nextStep) => {
    demoStep = Math.max(1, Math.min(3, nextStep));
    $(".condition-demos").dataset.step = String(demoStep);
    $("#demo-step-label").textContent = `Step ${demoStep} of 3`;
    $("#demo-previous").disabled = demoStep === 1;
    $("#demo-next").disabled = demoStep === 3;
  };
  $("#demo-previous").onclick = () => updateDemoStep(demoStep - 1);
  $("#demo-next").onclick = () => updateDemoStep(demoStep + 1);
  modal.querySelectorAll(".quiz-option").forEach(button => button.onclick = () => {
    if (button.dataset.answer === "correct") {
      button.classList.add("correct");
      modal.querySelectorAll(".quiz-option").forEach(option => { option.disabled = true; });
      $("#modal-feedback").textContent = "Exactly. Equal pointers mean one unchecked candidate remains; crossed pointers mean none remain. Close this explanation, then press Next when you are ready.";
    } else {
      button.classList.add("wrong");
      $("#modal-feedback").textContent = "That stops one step too early. The cell under both pointers never gets checked.";
    }
  });
}

function openMidModal() {
  const exact = state.left + (state.right - state.left) / 2;
  const answer = Math.floor(exact);
  $("#modal-content").innerHTML = `
    <span class="eyebrow">MIDPOINT CALIBRATION</span>
    <h2 id="modal-title">An index must be a whole number.</h2>
    <p>We measure the width from Left to Right, halve it, then offset from Left. In languages with fixed-size integers, this form also avoids the overflow risk of <b>(left + right) // 2</b>.</p>
    <div class="math-board"><span>left + (right - left) // 2</span><br><strong>${state.left} + (${state.right} - ${state.left}) // 2 = ?</strong><br><span class="comment">// Exact halfway point: ${exact}</span></div>
    <p>Why floor division? If the halfway point is, say, 3.5, there is no cell 3.5. <b>// 2</b> deliberately chooses the lower middle cell, keeping <code>mid</code> a valid integer index. Either middle can work if the boundary updates are consistent.</p>
    <div class="quiz-options"><button class="quiz-option" data-value="${answer}">mid = ${answer}</button><button class="quiz-option" data-value="${answer + 0.5}">mid = ${answer + 0.5}</button></div>
    <div class="modal-feedback" id="modal-feedback"></div>`;
  modal.hidden = false;
  modal.querySelectorAll(".quiz-option").forEach(button => button.onclick = () => {
    if (Number(button.dataset.value) === answer) {
      button.classList.add("correct");
      modal.querySelectorAll(".quiz-option").forEach(option => { option.disabled = true; });
      $("#modal-feedback").textContent = `Correct. The middle candidate is nums[${answer}] = ${state.nums[answer]}. Close this explanation, then press Next when you are ready.`;
      state.mid = answer;
      state.activeCodeLine = 6;
      render();
    } else {
      button.classList.add("wrong");
      $("#modal-feedback").textContent = "Arrays need an integer index. Floor division removes the fractional part.";
    }
  });
}

function openProblemModal() {
  $("#modal-content").innerHTML = `
    <span class="eyebrow">NEETCODE 150 · EASY</span>
    <h2 id="modal-title">Binary Search</h2>
    <div class="problem-sheet">
      <section class="problem-task">
        <h3>Problem</h3>
        <p>You receive an ascending array of unique integers, <code>nums</code>, and an integer <code>target</code>. Return the zero-based index of <code>target</code> when it is present. If it is absent, return <code>-1</code>.</p>
        <p>Your algorithm must run in <code>O(log n)</code> time.</p>
      </section>
      <section class="problem-examples" aria-label="Examples">
        <h3>Examples</h3>
        <div class="problem-example"><b>Example 1</b><code>nums = [-1, 0, 2, 4, 6, 8]<br>target = 4<br><strong>output = 3</strong></code><span>The value 4 is at index 3.</span></div>
        <div class="problem-example"><b>Example 2</b><code>nums = [-1, 0, 2, 4, 6, 8]<br>target = 3<br><strong>output = -1</strong></code><span>The value 3 is not in the array.</span></div>
      </section>
      <section class="problem-constraints">
        <h3>Constraints</h3>
        <ul>
          <li><code>1 ≤ nums.length ≤ 10,000</code></li>
          <li><code>-10,000 &lt; nums[i], target &lt; 10,000</code></li>
          <li>Every value in <code>nums</code> is unique.</li>
          <li><code>nums</code> is sorted in ascending order.</li>
        </ul>
      </section>
    </div>
    <p class="problem-source">Adapted from <a href="https://neetcode.io/problems/binary-search/question?list=neetcode150" target="_blank" rel="noreferrer">NeetCode’s Binary Search question ↗</a>.</p>`;
  modal.hidden = false;
}

function openComplexityModal() {
  const rounds = [
    { size: 7, label: "Start with 7 candidates", note: "One comparison checks the middle value." },
    { size: 3, label: "Keep at most 3", note: "The other half cannot contain the target, so it is discarded." },
    { size: 1, label: "Only 1 candidate remains", note: "Another comparison either finds it or empties the range." },
    { size: 0, label: "Search complete", note: "Three comparisons reduced 7 candidates to zero. For n candidates, that takes about log₂(n) comparisons." },
  ];
  const renderRoundCells = (size) => Array.from({ length: 7 }, (_, index) =>
    `<span class="complexity-cell${index < size ? " kept" : " discarded"}">${index < size ? "●" : "×"}</span>`
  ).join("");

  $("#modal-content").innerHTML = `
    <span class="eyebrow">COST OF THE SEARCH</span>
    <h2 id="modal-title">Why O(log n) time and O(1) space?</h2>
    <p>Binary search saves work in two different ways: it repeatedly shrinks the candidates, while reusing the same small set of variables.</p>
    <div class="complexity-lesson">
      <section class="complexity-time-demo">
        <header><span>WORST-CASE TIME</span><strong>O(log n)</strong></header>
        <div class="halving-stage" id="halving-stage">${renderRoundCells(rounds[0].size)}</div>
        <strong class="round-label" id="round-label">${rounds[0].label}</strong>
        <p id="round-note">${rounds[0].note}</p>
        <div class="demo-controls complexity-controls" aria-label="Time complexity demonstration controls">
          <button id="complexity-previous" type="button" disabled>← Previous</button>
          <strong id="complexity-step-label">Step 1 of 4</strong>
          <button id="complexity-next" type="button">Next →</button>
        </div>
      </section>
      <section class="complexity-space-demo">
        <header><span>SPACE</span><strong>O(1)</strong></header>
        <div class="memory-shelf" aria-label="Three reused index variables">
          <span><b>left</b><i id="memory-left">0</i></span>
          <span><b>mid</b><i id="memory-mid">3</i></span>
          <span><b>right</b><i id="memory-right">6</i></span>
        </div>
        <p>The numbers inside these three index variables change, but iterative binary search does not copy the array or add more variables as <code>nums</code> grows.</p>
        <div class="constant-memory-note"><b>7 values or 7 million values</b><span>still the same fixed handful of variables</span></div>
      </section>
    </div>`;
  modal.hidden = false;

  let round = 0;
  const updateComplexityRound = (nextRound) => {
    round = Math.max(0, Math.min(rounds.length - 1, nextRound));
    const current = rounds[round];
    $("#halving-stage").innerHTML = renderRoundCells(current.size);
    $("#round-label").textContent = current.label;
    $("#round-note").textContent = current.note;
    $("#complexity-step-label").textContent = `Step ${round + 1} of ${rounds.length}`;
    $("#complexity-previous").disabled = round === 0;
    $("#complexity-next").disabled = round === rounds.length - 1;
    const memoryStates = [[0, 3, 6], [4, 5, 6], [4, 4, 4], [5, 4, 4]];
    [$("#memory-left"), $("#memory-mid"), $("#memory-right")].forEach((item, index) => {
      if (item.textContent !== String(memoryStates[round][index])) {
        item.textContent = memoryStates[round][index];
        item.animate([{ transform: "translateY(-5px)", background: "#ffd36f" }, { transform: "none", background: "#fff" }], { duration: 360, easing: "ease-out" });
      }
    });
  };
  $("#complexity-previous").onclick = () => updateComplexityRound(round - 1);
  $("#complexity-next").onclick = () => updateComplexityRound(round + 1);
}

function compareChoice(choice) {
  const midValue = state.nums[state.mid];
  const correct = midValue === state.target ? "found" : (midValue < state.target ? "higher" : "lower");
  if (choice !== correct) return nudgeInvalid(`Not quite: ${state.target} is ${state.target > midValue ? "greater" : state.target < midValue ? "smaller" : "equal to"} ${midValue}.`);
  if (choice === "found") {
    state.found = true;
    state.stage = 5;
    state.activeCodeLine = 9;
    render();
    return;
  }
  if (choice === "higher") {
    state.left = state.mid + 1;
    state.activeCodeLine = 11;
  } else {
    state.right = state.mid - 1;
    state.activeCodeLine = 13;
  }
  state.mid = state.left + Math.floor((state.right - state.left) / 2);
  render();
}

function closeModal() { modal.hidden = true; }
function jumpToStage(nextStage) {
  const stage = Math.max(0, Math.min(stages.length - 1, nextStage));
  const snapshots = [
    { left: null, right: null, activeTool: "left", explored: false, mid: null, found: false, activeCodeLine: 1 },
    { left: 0, right: 6, activeTool: "left", explored: true, mid: null, found: false, activeCodeLine: 3 },
    { left: 0, right: 6, activeTool: "left", explored: true, mid: null, found: false, activeCodeLine: 5 },
    { left: 0, right: 6, activeTool: "left", explored: true, mid: null, found: false, activeCodeLine: 6 },
    { left: 0, right: 6, activeTool: "left", explored: true, mid: 3, found: false, activeCodeLine: 6 },
    { left: 4, right: 4, activeTool: "left", explored: true, mid: 4, found: true, activeCodeLine: 9 },
  ];
  closeModal();
  Object.assign(state, snapshots[stage], { stage });
  render();
}

function resetLesson() {
  jumpToStage(0);
}

document.querySelectorAll(".pointer-tool").forEach(tool => tool.addEventListener("click", () => { state.activeTool = tool.dataset.tool; render(); }));
$("#reset-pointers").addEventListener("click", () => { if (state.stage <= 1) { state.left = null; state.right = null; state.activeTool = "left"; render(); } });
$("#histogram-toggle").addEventListener("click", () => {
  state.histograms = !state.histograms;
  $("#histogram-toggle").setAttribute("aria-pressed", String(state.histograms));
  $("#histogram-toggle span").textContent = state.histograms ? "Hide heights" : "Show heights";
  renderArray();
});
$("#problem-button").addEventListener("click", openProblemModal);
$("#complexity-why").addEventListener("click", openComplexityModal);
$("#modal-close").addEventListener("click", closeModal);
modal.addEventListener("click", event => { if (event.target === modal) closeModal(); });
document.addEventListener("keydown", event => { if (event.key === "Escape") closeModal(); });
document.addEventListener("pointermove", moveDraggedPointer, { passive: false });
document.addEventListener("pointerup", stopPointerDrag);
document.addEventListener("pointercancel", stopPointerDrag);

render();
