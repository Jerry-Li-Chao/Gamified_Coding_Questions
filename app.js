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

function renderArray() {
  rig.innerHTML = state.nums.map((value, index) => {
    const outside = state.left !== null && state.right !== null && (index < state.left || index > state.right);
    const markers = `${state.left === index ? '<span class="marker left" draggable="true" data-pointer="left" title="Drag Left to another index">L</span>' : ''}${state.right === index ? '<span class="marker right" draggable="true" data-pointer="right" title="Drag Right to another index">R</span>' : ''}`;
    const classes = ["array-cell", value === state.target ? "is-target" : "", outside ? "out-of-range" : "", state.mid === index ? "is-mid" : "", state.found && state.mid === index ? "found" : ""].join(" ");
    const height = 18 + (value / 30) * 126;
    return `<button class="${classes}" data-index="${index}" type="button" aria-label="Value ${value} at index ${index}">
      <span class="histogram" style="height:${height}px"></span>
      <span class="cell-body"><span class="cell-value">${value}</span></span>
      <span class="cell-index">${index}</span>
      <span class="pointer-marker">${markers}</span>
    </button>`;
  }).join("");
  rig.classList.toggle("hide-histograms", !state.histograms);
  rig.querySelectorAll(".array-cell").forEach(cell => cell.addEventListener("click", () => placePointer(Number(cell.dataset.index))));
  rig.querySelectorAll(".marker").forEach(marker => marker.addEventListener("dragstart", event => {
    event.stopPropagation();
    event.dataTransfer.setData("text/plain", marker.dataset.pointer);
    event.dataTransfer.effectAllowed = "move";
  }));
  rig.querySelectorAll(".array-cell").forEach(cell => {
    cell.addEventListener("dragover", event => { event.preventDefault(); event.dataTransfer.dropEffect = "move"; });
    cell.addEventListener("drop", event => {
      event.preventDefault();
      event.stopPropagation();
      const pointer = event.dataTransfer.getData("text/plain");
      if (pointer === "left" || pointer === "right") {
        state.activeTool = pointer;
        placePointer(Number(cell.dataset.index));
      }
    });
  });
  updateRangeSentence();
}

function placePointer(index) {
  if (state.stage > 1 || state.found) return;
  if (state.activeTool === "left") {
    if (state.right !== null && index > state.right) return nudgeInvalid("Left cannot pass Right — that would make the range empty.");
    state.left = index;
    if (state.stage === 0 && index === 0) state.activeTool = "right";
  } else {
    if (state.left !== null && index < state.left) return nudgeInvalid("Right cannot pass Left — that would make the range empty.");
    state.right = index;
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
    $("#lock-range").onclick = () => { state.left = 0; state.right = 6; state.stage = 2; render(); };
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
    actions.innerHTML = `<button class="action-button" id="replay">Replay lesson</button><a class="action-button secondary" href="https://neetcode.io/problems/binary-search/question" target="_blank" rel="noreferrer" style="text-align:center;text-decoration:none">Try the problem ↗</a>`;
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
  let revealed = 2;
  if (state.stage >= 1) revealed = 4;
  if (state.stage >= 3) revealed = 6;
  if (state.stage >= 4) revealed = 14;
  if (state.stage >= 5) revealed = 16;
  $("#code-block").innerHTML = codeLines.slice(0, revealed).map((line, i) => `<span class="code-line ${i === revealed - 1 ? "revealed" : ""}">${line || " "}</span>`).join("");
  const notes = [
    "Start with the function shell. The game will turn each idea into Python.",
    "The boundaries are inclusive: both ends are still possible answers.",
    "The current range is always nums[left:right + 1].",
    "<= keeps searching while even one candidate remains.",
    "Floor division converts the midpoint into a valid integer index.",
    "Found it. Returning mid gives the target’s index.",
  ];
  $("#code-note").innerHTML = `<span class="note-pin">✦</span><div><strong>WHY THIS LINE?</strong><p>${notes[state.stage]}</p></div>`;
}

function updateProgress() {
  const value = Math.round((state.stage / (stages.length - 1)) * 100);
  const ring = $("#nav-progress");
  ring.textContent = `${value}%`;
  ring.style.background = `conic-gradient(var(--teal) ${value}%, #183539 0)`;
  $("#progress-copy").textContent = stages[state.stage].title;
}

function render() {
  document.querySelectorAll(".pointer-tool").forEach(tool => tool.classList.toggle("active", tool.dataset.tool === state.activeTool));
  renderArray();
  renderCoach();
  renderCode();
  updateProgress();
  $("#target-value").textContent = state.target;
}

function openLoopModal() {
  $("#modal-content").innerHTML = `
    <span class="eyebrow">THE LAST CANDIDATE</span>
    <h2>One cell is still a search range.</h2>
    <p>Imagine every other value has been ruled out. Left and Right now point to the same final candidate. It still might be the target, so the loop must run once more.</p>
    <div class="pointer-demo">
      <div class="demo-array"><span class="demo-cell">7</span><span class="demo-cell single">12<small style="position:absolute;top:-19px;color:#ffb62e;font-size:8px">L &amp; R</small></span><span class="demo-cell">20</span></div>
      <div class="demo-pointers">
        <div class="correct"><b>left &lt;= right ✓</b>“There is at least one candidate.” Equal pointers run the loop and inspect 12. After a miss, one pointer moves past the other and the search stops.</div>
        <div class="wrong"><b>left &lt; right ✕</b>“There are at least two candidates.” Equal pointers stop immediately, skipping 12 entirely—even if 12 is the target.</div>
      </div>
    </div>
    <p>Which condition correctly includes the last remaining candidate?</p>
    <div class="quiz-options"><button class="quiz-option" data-answer="wrong">while left &lt; right</button><button class="quiz-option" data-answer="correct">while left &lt;= right</button></div>
    <div class="modal-feedback" id="modal-feedback"></div>`;
  modal.hidden = false;
  modal.querySelectorAll(".quiz-option").forEach(button => button.onclick = () => {
    if (button.dataset.answer === "correct") {
      button.classList.add("correct");
      $("#modal-feedback").textContent = "Exactly. Equal pointers mean one unchecked candidate remains; crossed pointers mean none remain.";
      setTimeout(() => { closeModal(); state.stage = 3; render(); }, 900);
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
    <h2>An index must be a whole number.</h2>
    <p>We measure the width from Left to Right, halve it, then offset from Left. In languages with fixed-size integers, this form also avoids the overflow risk of <b>(left + right) // 2</b>.</p>
    <div class="math-board"><span>left + (right - left) // 2</span><br><strong>${state.left} + (${state.right} - ${state.left}) // 2 = ?</strong><br><span class="comment">// Exact halfway point: ${exact}</span></div>
    <p>Why floor division? If the halfway point is, say, 3.5, there is no cell 3.5. <b>// 2</b> deliberately chooses the lower middle cell, keeping <code>mid</code> a valid integer index. Either middle can work if the boundary updates are consistent.</p>
    <div class="quiz-options"><button class="quiz-option" data-value="${answer}">mid = ${answer}</button><button class="quiz-option" data-value="${answer + 0.5}">mid = ${answer + 0.5}</button></div>
    <div class="modal-feedback" id="modal-feedback"></div>`;
  modal.hidden = false;
  modal.querySelectorAll(".quiz-option").forEach(button => button.onclick = () => {
    if (Number(button.dataset.value) === answer) {
      button.classList.add("correct");
      $("#modal-feedback").textContent = `Correct. The middle candidate is nums[${answer}] = ${state.nums[answer]}.`;
      setTimeout(() => { closeModal(); state.mid = answer; state.stage = 4; render(); }, 850);
    } else {
      button.classList.add("wrong");
      $("#modal-feedback").textContent = "Arrays need an integer index. Floor division removes the fractional part.";
    }
  });
}

function compareChoice(choice) {
  const midValue = state.nums[state.mid];
  const correct = midValue === state.target ? "found" : (midValue < state.target ? "higher" : "lower");
  if (choice !== correct) return nudgeInvalid(`Not quite: ${state.target} is ${state.target > midValue ? "greater" : state.target < midValue ? "smaller" : "equal to"} ${midValue}.`);
  if (choice === "found") {
    state.found = true;
    state.stage = 5;
    render();
    return;
  }
  if (choice === "higher") state.left = state.mid + 1;
  else state.right = state.mid - 1;
  state.mid = state.left + Math.floor((state.right - state.left) / 2);
  render();
}

function closeModal() { modal.hidden = true; }
function jumpToStage(nextStage) {
  const stage = Math.max(0, Math.min(stages.length - 1, nextStage));
  const snapshots = [
    { left: null, right: null, activeTool: "left", explored: false, mid: null, found: false },
    { left: 0, right: 6, activeTool: "left", explored: true, mid: null, found: false },
    { left: 0, right: 6, activeTool: "left", explored: true, mid: null, found: false },
    { left: 0, right: 6, activeTool: "left", explored: true, mid: null, found: false },
    { left: 0, right: 6, activeTool: "left", explored: true, mid: 3, found: false },
    { left: 4, right: 4, activeTool: "left", explored: true, mid: 4, found: true },
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
$("#modal-close").addEventListener("click", closeModal);
modal.addEventListener("click", event => { if (event.target === modal) closeModal(); });
document.addEventListener("keydown", event => { if (event.key === "Escape") closeModal(); });

render();
