const matrixState = {
  matrix: [[1, 2, 4, 8], [10, 11, 12, 13], [14, 20, 30, 40]],
  target: 12,
  stage: 0,
  flatVisible: false,
  trailVisible: false,
  mappedIndex: null,
  left: null,
  right: null,
  mid: null,
  activeTool: "left",
  activeCodeLine: 2,
  pendingIteration: false,
  found: false,
  lastAction: "",
};

const matrixStages = [
  { title: "Unfold the grid", text: "Read each row left to right, then continue at the first cell of the next row. The row breaks do not interrupt the sorted order." },
  { title: "One flat index, two coordinates", text: "Select the cell at flat index 6. With 4 columns, division finds its row and remainder finds its column." },
  { title: "Fence the whole trail", text: "Place Left at flat index 0 and Right at flat index 11. You can click a cell or drag an existing pointer." },
  { title: "Keep the final cell searchable", text: "The flattened matrix is still binary search, so the inclusive loop must inspect a range containing one last cell." },
  { title: "Find and map the midpoint", text: "Calculate a flat middle index, then convert it back into a row and column before reading the matrix value." },
  { title: "Compare, discard, repeat", text: "Compare the target with the mapped middle value. Move one boundary, then explicitly begin the next iteration." },
  { title: "Return the result", text: "The flat index mapped to the target cell, so the function returns True without ever copying or flattening the matrix." },
];

const matrixCode = [
  `<span class="kw">class</span> <span class="type">Solution</span>:`,
  `    <span class="kw">def</span> <span class="fn">searchMatrix</span>(self, matrix: <span class="type">List</span>[<span class="type">List</span>[<span class="type">int</span>]], target: <span class="type">int</span>) -&gt; <span class="type">bool</span>:`,
  `        rows, cols = len(matrix), len(matrix[<span class="num">0</span>])`,
  `        left, right = <span class="num">0</span>, rows * cols - <span class="num">1</span>`,
  ``,
  `        <span class="kw">while</span> left &lt;= right:`,
  `            mid = left + (right - left) // <span class="num">2</span>`,
  `            row, col = mid // cols, mid % cols`,
  `            value = matrix[row][col]`,
  ``,
  `            <span class="kw">if</span> value == target:`,
  `                <span class="kw">return</span> <span class="type">True</span>`,
  `            <span class="kw">elif</span> value &lt; target:`,
  `                left = mid + <span class="num">1</span>`,
  `            <span class="kw">else</span>:`,
  `                right = mid - <span class="num">1</span>`,
  ``,
  `        <span class="kw">return</span> <span class="type">False</span>`,
];

const matrixNotes = {
  2: ["def searchMatrix(self, matrix, target) -> bool:", "The function receives the sorted grid and returns whether the target exists."],
  3: ["rows, cols = len(matrix), len(matrix[0])", "The column count is the bridge between a flat position and a matrix coordinate."],
  4: ["left, right = 0, rows * cols - 1", "There are rows × cols searchable cells, numbered from 0 through rows × cols − 1."],
  6: ["while left <= right:", "Equal boundaries mean one flat position is still unchecked. Crossed boundaries mean the search range is empty."],
  7: ["mid = left + (right - left) // 2", "This is ordinary binary-search midpoint arithmetic over flat positions."],
  8: ["row, col = mid // cols, mid % cols", "Whole groups of cols determine the row; the leftover positions determine the column."],
  9: ["value = matrix[row][col]", "Only now do we read the matrix cell represented by the flat midpoint."],
  11: ["if value == target:", "An equal middle value proves the target is present."],
  12: ["return True", "The mapped middle cell contains the target, so the search ends successfully."],
  14: ["left = mid + 1", "When the middle value is too small, every earlier flat position is also too small."],
  16: ["right = mid - 1", "When the middle value is too large, every later flat position is also too large."],
  18: ["return False", "Reaching this line means the boundaries crossed without finding the target."],
};

const matrixStageLineEnds = [2, 3, 4, 6, 9, 16, 18];
const $m = (selector) => document.querySelector(selector);
const matrixBoard = $m("#matrix-board");
const matrixModal = $m("#concept-modal");
let matrixRenderedStage = matrixState.stage;
let matrixDraggedPointer = null;
let matrixLastDragIndex = null;

function flatValues() { return matrixState.matrix.flat(); }
function matrixColumns() { return matrixState.matrix[0].length; }
function toCoordinate(index) { return [Math.floor(index / matrixColumns()), index % matrixColumns()]; }

function matrixMarkers(index) {
  const draggable = matrixState.stage === 2;
  const marker = (pointer) => `<span class="matrix-pointer-handle ${pointer}${matrixState.activeTool === pointer ? " active" : ""}" data-pointer="${pointer}" ${draggable ? `role="slider" tabindex="0" aria-label="Move ${pointer} boundary"` : ""}>${pointer === "left" ? "L" : "R"}</span>`;
  return `${matrixState.left === index ? marker("left") : ""}${matrixState.right === index ? marker("right") : ""}`;
}

function renderMatrixBoard() {
  const cols = matrixColumns();
  let content = `<span class="matrix-axis matrix-corner">r/c</span>`;
  for (let col = 0; col < cols; col += 1) content += `<span class="matrix-axis">COL ${col}</span>`;

  flatValues().forEach((value, index) => {
    const [row, col] = toCoordinate(index);
    if (col === 0) content += `<span class="matrix-axis">ROW ${row}</span>`;
    const outside = matrixState.left !== null && matrixState.right !== null && (index < matrixState.left || index > matrixState.right);
    const classes = [
      "matrix-cell",
      value === matrixState.target ? "is-target" : "",
      outside ? "out-of-range" : "",
      matrixState.mappedIndex === index ? "is-mapped" : "",
      matrixState.mid === index ? "is-mid" : "",
      matrixState.found && matrixState.mid === index ? "found" : "",
    ].join(" ");
    const isRowEnd = col === cols - 1 && index < flatValues().length - 1;
    const arrow = index < flatValues().length - 1 ? `<span class="trail-arrow${isRowEnd ? " trail-turn" : ""}"></span>` : "";
    content += `<button class="${classes}" data-index="${index}" type="button" aria-label="Value ${value}, row ${row}, column ${col}, flat index ${index}">
      ${matrixState.mid === index ? `<span class="matrix-mid-label">MID</span>` : ""}
      <span class="flat-index">#${index}</span>
      <span class="matrix-value">${value}</span>
      <span class="matrix-coordinate">[${row},${col}]</span>
      ${arrow}
      <span class="matrix-pointer-layer">${matrixMarkers(index)}</span>
    </button>`;
  });

  matrixBoard.innerHTML = `<span class="matrix-trail-copy">${matrixState.trailVisible ? "0 → 1 → … → 11" : "3 rows × 4 columns"}</span><div class="matrix-grid">${content}</div>`;
  matrixBoard.classList.toggle("show-flat-indices", matrixState.flatVisible);
  matrixBoard.classList.toggle("show-trail", matrixState.trailVisible);
  matrixBoard.querySelectorAll(".matrix-cell").forEach(cell => cell.addEventListener("click", () => handleMatrixCell(Number(cell.dataset.index))));
  matrixBoard.querySelectorAll(".matrix-pointer-handle[role='slider']").forEach(handle => {
    handle.addEventListener("pointerdown", startMatrixDrag);
    handle.addEventListener("keydown", event => {
      if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) return;
      event.preventDefault();
      const offsets = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -matrixColumns(), ArrowDown: matrixColumns() };
      matrixState.activeTool = handle.dataset.pointer;
      placeMatrixPointer(matrixState[handle.dataset.pointer] + offsets[event.key]);
    });
  });
  renderMatrixSummary();
}

function handleMatrixCell(index) {
  if (matrixState.stage === 1) {
    if (index !== 6) return matrixNudge(`That is flat index ${index}. Count across each complete row before continuing.`);
    matrixState.mappedIndex = index;
    matrixState.activeCodeLine = 3;
    matrixState.lastAction = "mapped";
    renderMatrix();
    return;
  }
  if (matrixState.stage === 2) placeMatrixPointer(index);
}

function placeMatrixPointer(index) {
  if (matrixState.stage !== 2 || index < 0 || index >= flatValues().length) return;
  const pointer = matrixState.activeTool;
  if (pointer === "left" && matrixState.right !== null && index > matrixState.right) return matrixNudge("Left cannot move beyond Right because that would invert the search range.");
  if (pointer === "right" && matrixState.left !== null && index < matrixState.left) return matrixNudge("Right cannot move before Left because that would invert the search range.");
  matrixState[pointer] = index;
  matrixState.activeCodeLine = 4;
  matrixState.lastAction = "boundaries";
  if (matrixState.left === 0 && matrixState.right === flatValues().length - 1) matrixState.activeTool = "left";
  else if (matrixState.left === 0) matrixState.activeTool = "right";
  renderMatrix();
}

function startMatrixDrag(event) {
  event.preventDefault();
  event.stopPropagation();
  matrixDraggedPointer = event.currentTarget.dataset.pointer;
  matrixLastDragIndex = matrixState[matrixDraggedPointer];
  matrixState.activeTool = matrixDraggedPointer;
  document.body.classList.add("is-dragging-pointer");
  event.currentTarget.setPointerCapture?.(event.pointerId);
}

function moveMatrixDrag(event) {
  if (!matrixDraggedPointer) return;
  event.preventDefault();
  const cell = document.elementFromPoint(event.clientX, event.clientY)?.closest(".matrix-cell");
  if (!cell) return;
  const index = Number(cell.dataset.index);
  if (index === matrixLastDragIndex) return;
  matrixLastDragIndex = index;
  matrixState.activeTool = matrixDraggedPointer;
  placeMatrixPointer(index);
}

function stopMatrixDrag() {
  matrixDraggedPointer = null;
  matrixLastDragIndex = null;
  document.body.classList.remove("is-dragging-pointer");
}

function renderMatrixSummary() {
  const summary = $m("#range-sentence");
  if (matrixState.found) {
    const [row, col] = toCoordinate(matrixState.mid);
    summary.innerHTML = `Found <b>${matrixState.target}</b> at flat index ${matrixState.mid} → matrix[${row}][${col}].`;
    return;
  }
  if (matrixState.lastAction === "higher") {
    summary.innerHTML = `The middle value was too small. Left moved to <b>${matrixState.left}</b>; earlier flat positions are discarded.`;
    return;
  }
  if (matrixState.lastAction === "lower") {
    summary.innerHTML = `The middle value was too large. Right moved to <b>${matrixState.right}</b>; later flat positions are discarded.`;
    return;
  }
  if (matrixState.mid !== null) {
    const [row, col] = toCoordinate(matrixState.mid);
    summary.innerHTML = `Flat mid ${matrixState.mid} maps to matrix[${row}][${col}] = <b>${flatValues()[matrixState.mid]}</b>.`;
    return;
  }
  if (matrixState.left !== null && matrixState.right !== null) {
    const count = matrixState.right - matrixState.left + 1;
    summary.innerHTML = `Current flat range: indices <b>${matrixState.left}–${matrixState.right}</b>. ${count} candidate${count === 1 ? " remains" : "s remain"}.`;
    return;
  }
  if (matrixState.mappedIndex !== null) {
    const [row, col] = toCoordinate(matrixState.mappedIndex);
    summary.innerHTML = `Flat index <b>${matrixState.mappedIndex}</b> becomes row ${row}, column ${col}: matrix[${row}][${col}] = ${flatValues()[matrixState.mappedIndex]}.`;
    return;
  }
  summary.innerHTML = matrixState.trailVisible
    ? `One sorted trail is folded every <b>${matrixColumns()} cells</b>: 8 &lt; 10 and 13 &lt; 14.`
    : `The rows form one continuous sorted trail.`;
}

function renderMatrixCoach() {
  const stage = matrixStages[matrixState.stage];
  $m("#stage-count").textContent = `STEP ${matrixState.stage + 1} OF ${matrixStages.length}`;
  $m("#coach-title").textContent = stage.title;
  $m("#coach-text").innerHTML = stage.text;
  const actions = $m("#coach-actions");
  let primary = "";
  if (matrixState.stage === 0) primary = `<button class="action-button" id="show-trail" type="button">${matrixState.trailVisible ? "Trail revealed ✓" : "Unfold the trail"}</button>`;
  if (matrixState.stage === 3) primary = `<button class="action-button" id="inspect-matrix-loop" type="button">Inspect one-cell case</button>`;
  if (matrixState.stage === 4) primary = `<button class="action-button" id="calculate-matrix-mid" type="button">Calculate & map mid</button>`;
  if (matrixState.stage === 5) {
    if (matrixState.found) primary = `<div class="matrix-found-copy">Target found ✓</div>`;
    else if (matrixState.pendingIteration) primary = `<button class="action-button" id="next-matrix-iteration" type="button">Next iteration</button>`;
    else primary = `<div class="matrix-choice-buttons"><button type="button" data-choice="higher">Target is higher</button><button type="button" data-choice="lower">Target is lower</button><button type="button" data-choice="found">Values match</button></div>`;
  }
  if (matrixState.stage === 6) primary = `<button class="action-button" id="replay-matrix" type="button">Replay lesson</button>`;
  actions.innerHTML = `${primary}<div class="step-nav" aria-label="Lesson step navigation"><button class="step-button" id="matrix-back" type="button" ${matrixState.stage === 0 ? "disabled" : ""}>← Back</button><button class="step-button" id="matrix-next" type="button" ${matrixState.stage === matrixStages.length - 1 ? "disabled" : ""}>Next →</button></div>`;

  $m("#show-trail")?.addEventListener("click", () => { matrixState.trailVisible = true; matrixState.flatVisible = true; matrixState.lastAction = "trail"; renderMatrix(); });
  $m("#inspect-matrix-loop")?.addEventListener("click", openMatrixLoopModal);
  $m("#calculate-matrix-mid")?.addEventListener("click", openMatrixMidModal);
  $m("#next-matrix-iteration")?.addEventListener("click", beginNextMatrixIteration);
  $m("#replay-matrix")?.addEventListener("click", () => jumpMatrixStage(0));
  actions.querySelectorAll("[data-choice]").forEach(button => button.addEventListener("click", () => compareMatrixChoice(button.dataset.choice)));
  $m("#matrix-back")?.addEventListener("click", () => jumpMatrixStage(matrixState.stage - 1));
  $m("#matrix-next")?.addEventListener("click", () => jumpMatrixStage(matrixState.stage + 1));
}

function renderMatrixCode() {
  const revealThrough = Math.max(matrixStageLineEnds[matrixState.stage], matrixState.activeCodeLine);
  $m("#code-block").innerHTML = matrixCode.slice(0, revealThrough).map((line, index) => {
    const lineNumber = index + 1;
    const classes = ["code-line", lineNumber <= revealThrough ? "revealed" : "", lineNumber === matrixState.activeCodeLine ? "active-line" : ""].join(" ");
    return `<span class="${classes}">${line || " "}</span>`;
  }).join("");
  const [line, explanation] = matrixNotes[matrixState.activeCodeLine] || matrixNotes[2];
  $m("#code-note").innerHTML = `<span class="note-pin">✦</span><div><strong>WHY THIS LINE?</strong><code class="note-line">${line}</code><p>${explanation}</p></div>`;
  $m("#code-block").querySelector(".active-line")?.scrollIntoView({ block: "nearest" });
}

function renderMatrixProgress() {
  const value = Math.round((matrixState.stage / (matrixStages.length - 1)) * 100);
  const ring = $m("#nav-progress");
  ring.textContent = `${value}%`;
  ring.style.background = `conic-gradient(var(--teal) ${value}%, #fff 0)`;
  $m("#progress-copy").textContent = matrixStages[matrixState.stage].title;
}

function captureMatrixRender() {
  return {
    stage: matrixRenderedStage,
    summary: $m("#range-sentence")?.textContent || "",
    markers: new Map([...matrixBoard.querySelectorAll(".matrix-pointer-handle")].map(marker => [marker.dataset.pointer, marker.getBoundingClientRect()])),
    midRect: matrixBoard.querySelector(".matrix-mid-label")?.getBoundingClientRect() || null,
    cells: new Map([...matrixBoard.querySelectorAll(".matrix-cell")].map(cell => [cell.dataset.index, cell.className])),
  };
}

function animateMatrixChanges(previous) {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  matrixBoard.querySelectorAll(".matrix-pointer-handle").forEach(marker => {
    const oldRect = previous.markers.get(marker.dataset.pointer);
    if (!oldRect) return;
    const rect = marker.getBoundingClientRect();
    const dx = oldRect.left - rect.left;
    const dy = oldRect.top - rect.top;
    if (Math.abs(dx) < 1 && Math.abs(dy) < 1) return;
    marker.animate([{ translate: `${dx}px ${dy}px` }, { translate: "0 0" }], { duration: 520, easing: "cubic-bezier(.22,.8,.25,1)" });
  });
  const midLabel = matrixBoard.querySelector(".matrix-mid-label");
  if (midLabel && previous.midRect) {
    const rect = midLabel.getBoundingClientRect();
    const dx = previous.midRect.left - rect.left;
    const dy = previous.midRect.top - rect.top;
    if (Math.abs(dx) >= 1 || Math.abs(dy) >= 1) midLabel.animate([{ translate: `${dx}px ${dy}px`, opacity: .72 }, { translate: "0 0", opacity: 1 }], { duration: 520, easing: "cubic-bezier(.22,.8,.25,1)" });
  }
  matrixBoard.querySelectorAll(".matrix-cell").forEach(cell => {
    const before = previous.cells.get(cell.dataset.index);
    if (before && before !== cell.className) cell.animate([{ filter: "brightness(1)" }, { filter: "brightness(1.14) saturate(1.25)", offset: .4 }, { filter: "brightness(1)" }], { duration: 580, easing: "ease-out" });
  });
  const summary = $m("#range-sentence");
  if (previous.summary !== summary.textContent) summary.animate([{ scale: 1 }, { scale: 1.018, boxShadow: "5px 5px 0 #ff9ca7", offset: .4 }, { scale: 1 }], { duration: 580, easing: "ease-out" });
}

function renderMatrix() {
  const previous = captureMatrixRender();
  document.querySelectorAll(".pointer-tool").forEach(tool => {
    tool.classList.toggle("active", matrixState.stage === 2 && tool.dataset.tool === matrixState.activeTool);
    tool.disabled = matrixState.stage !== 2;
  });
  $m(".matrix-tool-rack").classList.toggle("boundary-stage", matrixState.stage === 2);
  $m("#active-pointer-mode").textContent = matrixState.stage === 2 ? "NOW MOVING" : "CURRENT VIEW";
  $m("#active-pointer-name").textContent = matrixState.stage === 2 ? matrixState.activeTool.toUpperCase() : (matrixState.mid !== null ? "MID MAP" : "FLAT TRAIL");
  $m("#target-value").textContent = matrixState.target;
  renderMatrixBoard();
  renderMatrixCoach();
  renderMatrixCode();
  renderMatrixProgress();
  requestAnimationFrame(() => animateMatrixChanges(previous));
  matrixRenderedStage = matrixState.stage;
}

function compareMatrixChoice(choice) {
  const value = flatValues()[matrixState.mid];
  const correct = value === matrixState.target ? "found" : (value < matrixState.target ? "higher" : "lower");
  if (choice !== correct) return matrixNudge(`Compare ${matrixState.target} with ${value}: the target is ${matrixState.target > value ? "higher" : matrixState.target < value ? "lower" : "equal"}.`);
  if (choice === "found") {
    matrixState.found = true;
    matrixState.activeCodeLine = 12;
    matrixState.lastAction = "found";
    renderMatrix();
    return;
  }
  if (choice === "higher") {
    matrixState.left = matrixState.mid + 1;
    matrixState.activeCodeLine = 14;
    matrixState.lastAction = "higher";
  } else {
    matrixState.right = matrixState.mid - 1;
    matrixState.activeCodeLine = 16;
    matrixState.lastAction = "lower";
  }
  matrixState.pendingIteration = true;
  renderMatrix();
}

function beginNextMatrixIteration() {
  matrixState.mid = matrixState.left + Math.floor((matrixState.right - matrixState.left) / 2);
  matrixState.mappedIndex = matrixState.mid;
  matrixState.pendingIteration = false;
  matrixState.activeCodeLine = 7;
  matrixState.lastAction = "mid";
  renderMatrix();
}

function matrixNudge(message) {
  const text = $m("#coach-text");
  text.textContent = message;
  text.animate([{ transform: "translateX(-4px)" }, { transform: "translateX(4px)" }, { transform: "none" }], { duration: 300 });
}

function openMatrixProblemModal() {
  $m("#modal-content").innerHTML = `
    <span class="eyebrow">NEETCODE 150 · MEDIUM</span>
    <h2 id="modal-title">Search a 2D Matrix</h2>
    <div class="problem-sheet">
      <section class="problem-task"><h3>Problem</h3><p>Given an <code>m × n</code> integer matrix and a target, return <code>True</code> when the target appears and <code>False</code> otherwise.</p><p>Every row is sorted, and each row begins with a value greater than the final value of the row above it. Aim for <code>O(log(m × n))</code> time.</p></section>
      <section class="problem-examples"><h3>Examples</h3><div class="problem-example"><b>Example 1</b><code>matrix = [[1,2,4,8],<br>[10,11,12,13],<br>[14,20,30,40]]<br>target = 10<br><strong>output = true</strong></code></div><div class="problem-example"><b>Example 2</b><code>same matrix<br>target = 15<br><strong>output = false</strong></code></div></section>
      <section class="problem-constraints"><h3>Constraints</h3><ul><li><code>m = matrix.length</code></li><li><code>n = matrix[i].length</code></li><li><code>1 ≤ m, n ≤ 100</code></li><li><code>-10,000 ≤ matrix[i][j], target ≤ 10,000</code></li></ul></section>
    </div>
    <p class="problem-source">Adapted from <a href="https://neetcode.io/problems/search-2d-matrix/question?list=neetcode150" target="_blank" rel="noreferrer">NeetCode’s Search a 2D Matrix question ↗</a>.</p>`;
  matrixModal.hidden = false;
}

function openMatrixLoopModal() {
  $m("#modal-content").innerHTML = `
    <span class="eyebrow">THE LAST MATRIX CELL</span>
    <h2 id="modal-title">One flat position is still a range.</h2>
    <p>Rows and columns change how we display the data, but not when binary search should stop. Move through both cases yourself.</p>
    <div class="condition-demos" data-step="1">
      <section class="condition-case correct-case"><header><span>INCLUSIVE</span><code>left &lt;= right</code><b>CHECKS IT ✓</b></header><div class="one-cell-scene"><span class="case-pointer left">L</span><span class="lone-cell">12</span><span class="case-pointer right">R</span></div><ol class="case-timeline"><li><b>1</b><span>Both boundaries point to the same final flat position.</span></li><li><b>2</b><span><code>left &lt;= right</code> is true, so the cell is mapped and checked.</span></li><li><b>3</b><span>After a miss, the boundaries cross and the range becomes empty.</span></li></ol></section>
      <section class="condition-case wrong-case"><header><span>STRICT</span><code>left &lt; right</code><b>SKIPS IT ✕</b></header><div class="one-cell-scene"><span class="case-pointer left">L</span><span class="lone-cell">12</span><span class="case-pointer right">R</span></div><ol class="case-timeline"><li><b>1</b><span>Both boundaries point to an unchecked matrix cell.</span></li><li><b>2</b><span><code>left &lt; right</code> is already false because the positions are equal.</span></li><li><b>3</b><span>The loop stops before mapping or inspecting that cell.</span></li></ol></section>
      <div class="demo-controls"><button id="matrix-demo-previous" type="button" disabled>← Previous</button><strong id="matrix-demo-label">Step 1 of 3</strong><button id="matrix-demo-next" type="button">Next →</button></div>
    </div>`;
  matrixModal.hidden = false;
  let step = 1;
  const update = next => {
    step = Math.max(1, Math.min(3, next));
    $m(".condition-demos").dataset.step = String(step);
    $m("#matrix-demo-label").textContent = `Step ${step} of 3`;
    $m("#matrix-demo-previous").disabled = step === 1;
    $m("#matrix-demo-next").disabled = step === 3;
  };
  $m("#matrix-demo-previous").onclick = () => update(step - 1);
  $m("#matrix-demo-next").onclick = () => update(step + 1);
}

function openMatrixMidModal() {
  const mid = matrixState.left + Math.floor((matrixState.right - matrixState.left) / 2);
  const [row, col] = toCoordinate(mid);
  $m("#modal-content").innerHTML = `
    <span class="eyebrow">FLAT INDEX → MATRIX CELL</span>
    <h2 id="modal-title">Where does flat mid ${mid} live?</h2>
    <p>There are ${matrixColumns()} cells in every complete row. Division counts complete rows; modulo counts the leftover cells in the current row.</p>
    <div class="mapping-equation"><strong>mid = 0 + (11 - 0) // 2 = ${mid}</strong><br>row = ${mid} // ${matrixColumns()} = ?<br>col = ${mid} % ${matrixColumns()} = ?</div>
    <div class="quiz-options mapping-options"><button class="quiz-option" data-map="correct">row ${row}, col ${col} → value ${flatValues()[mid]}</button><button class="quiz-option" data-map="wrong">row 0, col ${mid} → outside the row</button></div>
    <div class="modal-feedback" id="modal-feedback"></div>`;
  matrixModal.hidden = false;
  matrixModal.querySelectorAll("[data-map]").forEach(button => button.onclick = () => {
    if (button.dataset.map === "correct") {
      button.classList.add("correct");
      matrixModal.querySelectorAll("[data-map]").forEach(option => { option.disabled = true; });
      $m("#modal-feedback").textContent = `Correct. Flat index ${mid} maps to matrix[${row}][${col}] = ${flatValues()[mid]}. Close this explanation, then press Next when ready.`;
      matrixState.mid = mid;
      matrixState.mappedIndex = mid;
      matrixState.activeCodeLine = 8;
      matrixState.lastAction = "mid";
      renderMatrix();
    } else {
      button.classList.add("wrong");
      $m("#modal-feedback").textContent = `A row has only columns 0 through ${matrixColumns() - 1}. Use division and remainder to wrap the flat position.`;
    }
  });
}

function openMatrixComplexityModal() {
  const sizes = [12, 6, 3, 1];
  const labels = ["12 matrix cells", "At most 6 remain", "At most 3 remain", "One final candidate"];
  const dots = size => Array.from({ length: size }, (_, index) => `<span class="candidate-dot">${index + 1}</span>`).join("");
  $m("#modal-content").innerHTML = `
    <span class="eyebrow">COST OF THE SEARCH</span><h2 id="modal-title">Why O(log(m × n)) time and O(1) space?</h2><p>The matrix contains <code>m × n</code> searchable cells. Binary search halves that total without creating a flattened copy.</p>
    <div class="matrix-complexity-demo"><section class="matrix-time-demo"><header><span>TIME</span><strong>O(log(m·n))</strong></header><div class="candidate-dots" id="matrix-candidate-dots">${dots(12)}</div><p><strong id="matrix-size-label">${labels[0]}</strong><br>Each comparison removes roughly half of the flat positions.</p><div class="demo-controls complexity-controls"><button id="matrix-complexity-previous" type="button" disabled>← Previous</button><strong id="matrix-complexity-label">Step 1 of 4</strong><button id="matrix-complexity-next" type="button">Next →</button></div></section><section class="matrix-space-demo"><header><span>EXTRA SPACE</span><strong>O(1)</strong></header><div class="fixed-memory-grid"><span>left</span><span>right</span><span>mid</span><span>row</span><span>col</span><span>value</span></div><p>These same fixed variables are reused whether the matrix contains 12 cells or millions. The algorithm never builds the visual flat list in memory.</p></section></div>`;
  matrixModal.hidden = false;
  let step = 0;
  const update = next => {
    step = Math.max(0, Math.min(sizes.length - 1, next));
    $m("#matrix-candidate-dots").innerHTML = dots(sizes[step]);
    $m("#matrix-size-label").textContent = labels[step];
    $m("#matrix-complexity-label").textContent = `Step ${step + 1} of 4`;
    $m("#matrix-complexity-previous").disabled = step === 0;
    $m("#matrix-complexity-next").disabled = step === 3;
  };
  $m("#matrix-complexity-previous").onclick = () => update(step - 1);
  $m("#matrix-complexity-next").onclick = () => update(step + 1);
}

function closeMatrixModal() { matrixModal.hidden = true; }

function jumpMatrixStage(nextStage) {
  const stage = Math.max(0, Math.min(matrixStages.length - 1, nextStage));
  const snapshots = [
    { flatVisible: false, trailVisible: false, mappedIndex: null, left: null, right: null, mid: null, activeTool: "left", activeCodeLine: 2, pendingIteration: false, found: false, lastAction: "" },
    { flatVisible: true, trailVisible: true, mappedIndex: null, left: null, right: null, mid: null, activeTool: "left", activeCodeLine: 3, pendingIteration: false, found: false, lastAction: "trail" },
    { flatVisible: true, trailVisible: true, mappedIndex: 6, left: null, right: null, mid: null, activeTool: "left", activeCodeLine: 4, pendingIteration: false, found: false, lastAction: "mapped" },
    { flatVisible: true, trailVisible: true, mappedIndex: null, left: 0, right: 11, mid: null, activeTool: "left", activeCodeLine: 6, pendingIteration: false, found: false, lastAction: "boundaries" },
    { flatVisible: true, trailVisible: true, mappedIndex: null, left: 0, right: 11, mid: null, activeTool: "left", activeCodeLine: 7, pendingIteration: false, found: false, lastAction: "boundaries" },
    { flatVisible: true, trailVisible: true, mappedIndex: 5, left: 0, right: 11, mid: 5, activeTool: "left", activeCodeLine: 9, pendingIteration: false, found: false, lastAction: "mid" },
    { flatVisible: true, trailVisible: true, mappedIndex: 6, left: 6, right: 7, mid: 6, activeTool: "left", activeCodeLine: 12, pendingIteration: false, found: true, lastAction: "found" },
  ];
  closeMatrixModal();
  Object.assign(matrixState, snapshots[stage], { stage });
  renderMatrix();
}

document.querySelectorAll(".pointer-tool").forEach(tool => tool.addEventListener("click", () => { matrixState.activeTool = tool.dataset.tool; renderMatrix(); }));
$m("#index-toggle").addEventListener("click", () => {
  matrixState.flatVisible = !matrixState.flatVisible;
  $m("#index-toggle").setAttribute("aria-pressed", String(matrixState.flatVisible));
  $m("#index-toggle span").textContent = matrixState.flatVisible ? "Hide flat indices" : "Show flat indices";
  renderMatrix();
});
$m("#reset-lesson").addEventListener("click", () => jumpMatrixStage(matrixState.stage));
$m("#problem-button").addEventListener("click", openMatrixProblemModal);
$m("#complexity-why").addEventListener("click", openMatrixComplexityModal);
$m("#modal-close").addEventListener("click", closeMatrixModal);
matrixModal.addEventListener("click", event => { if (event.target === matrixModal) closeMatrixModal(); });
document.addEventListener("keydown", event => { if (event.key === "Escape") closeMatrixModal(); });
document.addEventListener("pointermove", moveMatrixDrag, { passive: false });
document.addEventListener("pointerup", stopMatrixDrag);
document.addEventListener("pointercancel", stopMatrixDrag);

renderMatrix();
