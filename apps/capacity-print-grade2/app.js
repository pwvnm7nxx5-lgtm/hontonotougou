const APP = {
  id: "capacity-print-grade2",
  title: "2年生 水のかさ",
  accent: "#0284c7",
  defaultType: "read",
  defaultDifficulty: "normal",
  defaultCount: 12,
  defaultCols: 2,
};

document.documentElement.style.setProperty("--accent", APP.accent);

const els = {
  studentName: document.querySelector("#studentName"),
  worksheetDate: document.querySelector("#worksheetDate"),
  worksheetTitle: document.querySelector("#worksheetTitle"),
  problemType: document.querySelector("#problemType"),
  difficulty: document.querySelector("#difficulty"),
  problemCount: document.querySelector("#problemCount"),
  problemCountPreset: document.querySelector("#problemCountPreset"),
  columns: document.querySelector("#columns"),
  printBtn: document.querySelector("#printBtn"),
  regenerateBtn: document.querySelector("#regenerateBtn"),
  copyLinkBtn: document.querySelector("#copyLinkBtn"),
  pageCount: document.querySelector("#pageCount"),
  pages: document.querySelector("#pages"),
  pageTemplate: document.querySelector("#pageTemplate"),
  status: document.querySelector("#status"),
};

const stateStorageKey = `${APP.id}-state`;
const problemCountMin = 1;
const problemCountMax = 36;
let statusTimer;
let problems = [];

function clampChoice(value, allowed, fallback) { return allowed.includes(String(value)) ? String(value) : fallback; }
function clampNumber(value, min, max, fallback) { const parsed = Number.parseInt(value, 10); return Number.isNaN(parsed) ? fallback : Math.min(max, Math.max(min, parsed)); }
function getProblemCount() { return clampNumber(els.problemCount.value, problemCountMin, problemCountMax, APP.defaultCount); }
function typeValues() { return [...els.problemType.options].map((option) => option.value); }
function difficultyValues() { return [...els.difficulty.options].map((option) => option.value); }
function getSettings() {
  return {
    name: els.studentName.value,
    date: els.worksheetDate.value,
    title: els.worksheetTitle.value || APP.title,
    type: clampChoice(els.problemType.value, typeValues(), APP.defaultType),
    difficulty: clampChoice(els.difficulty.value, difficultyValues(), APP.defaultDifficulty),
    count: getProblemCount(),
    columns: Number.parseInt(clampChoice(els.columns.value, ["1", "2", "3"], String(APP.defaultCols)), 10),
  };
}
function applySettings(settings) {
  if (!settings || typeof settings !== "object") return;
  els.studentName.value = settings.name || "";
  els.worksheetDate.value = settings.date || "";
  els.worksheetTitle.value = settings.title || APP.title;
  els.problemType.value = clampChoice(settings.type, typeValues(), APP.defaultType);
  els.difficulty.value = clampChoice(settings.difficulty, difficultyValues(), APP.defaultDifficulty);
  els.problemCount.value = String(clampNumber(settings.count, problemCountMin, problemCountMax, APP.defaultCount));
  els.problemCountPreset.value = "";
  els.columns.value = clampChoice(settings.columns, ["1", "2", "3"], String(APP.defaultCols));
}
function setStatus(message) {
  window.clearTimeout(statusTimer);
  els.status.textContent = message;
  statusTimer = window.setTimeout(() => { els.status.textContent = ""; }, 2800);
}
function rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function pick(items) { return items[rand(0, items.length - 1)]; }
function pad(value) { return String(value).padStart(2, "0"); }
function timeText(totalMinutes) {
  const minutes = ((totalMinutes % 720) + 720) % 720;
  const hour = Math.floor(minutes / 60) || 12;
  const minute = minutes % 60;
  return minute === 0 ? `${hour}時` : `${hour}時${minute}分`;
}
function clockSvg(totalMinutes, showHands = true) {
  const minutes = ((totalMinutes % 720) + 720) % 720;
  const minute = minutes % 60;
  const hour = Math.floor(minutes / 60) || 12;
  const marks = Array.from({ length: 60 }, (_, i) => {
    const angle = (i * 6 - 90) * Math.PI / 180;
    const outer = 56;
    const inner = i % 5 === 0 ? 50 : 53;
    const x1 = 64 + Math.cos(angle) * outer;
    const y1 = 64 + Math.sin(angle) * outer;
    const x2 = 64 + Math.cos(angle) * inner;
    const y2 = 64 + Math.sin(angle) * inner;
    return `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="#344054" stroke-width="${i % 5 === 0 ? 2 : 1}"/>`;
  }).join("");
  const nums = [1,2,3,4,5,6,7,8,9,10,11,12].map((n) => {
    const angle = (n * 30 - 90) * Math.PI / 180;
    return `<text x="${(64 + Math.cos(angle) * 42).toFixed(1)}" y="${(68 + Math.sin(angle) * 42).toFixed(1)}" font-size="11" text-anchor="middle">${n}</text>`;
  }).join("");
  const minuteAngle = (minute * 6 - 90) * Math.PI / 180;
  const hourAngle = (((hour % 12) + minute / 60) * 30 - 90) * Math.PI / 180;
  const hands = showHands ? `<line x1="64" y1="64" x2="${(64 + Math.cos(hourAngle) * 28).toFixed(1)}" y2="${(64 + Math.sin(hourAngle) * 28).toFixed(1)}" stroke="#111827" stroke-width="5" stroke-linecap="round"/><line x1="64" y1="64" x2="${(64 + Math.cos(minuteAngle) * 43).toFixed(1)}" y2="${(64 + Math.sin(minuteAngle) * 43).toFixed(1)}" stroke="#111827" stroke-width="3" stroke-linecap="round"/><circle cx="64" cy="64" r="3" fill="#111827"/>` : `<circle cx="64" cy="64" r="3" fill="#111827"/>`;
  return `<svg class="clock" viewBox="0 0 128 128" width="132" height="132" role="img" aria-label="時計"><circle cx="64" cy="64" r="59" fill="#fff" stroke="#344054" stroke-width="3"/>${marks}${nums}${hands}</svg>`;
}
function rulerSvg(mm, showMark = true) {
  const width = 170;
  const step = width / 10;
  const marks = Array.from({ length: 11 }, (_, i) => `<line x1="${10 + i * step}" y1="22" x2="${10 + i * step}" y2="${i % 5 === 0 ? 48 : 39}" stroke="#344054" stroke-width="${i % 5 === 0 ? 2 : 1}"/><text x="${10 + i * step}" y="62" font-size="10" text-anchor="middle">${i}</text>`).join("");
  const marker = showMark ? `<line x1="10" y1="16" x2="${10 + (mm / 100) * width}" y2="16" stroke="#2563eb" stroke-width="5" stroke-linecap="round"/><circle cx="${10 + (mm / 100) * width}" cy="16" r="4" fill="#2563eb"/>` : "";
  return `<svg class="ruler" viewBox="0 0 190 72" width="190" height="72"><rect x="8" y="20" width="174" height="32" rx="4" fill="#fff" stroke="#344054"/>${marks}${marker}<text x="96" y="70" font-size="9" text-anchor="middle">cm</text></svg>`;
}
function beakerSvg(ml, showLevel = true) {
  const h = Math.min(92, Math.max(8, ml / 10));
  const y = 110 - h;
  const marks = [200,400,600,800,1000].map((v) => `<line x1="82" y1="${110 - v / 10}" x2="95" y2="${110 - v / 10}" stroke="#344054"/><text x="100" y="${114 - v / 10}" font-size="9">${v}</text>`).join("");
  const water = showLevel ? `<rect x="34" y="${y}" width="45" height="${h}" fill="#93c5fd" opacity=".8"/>` : "";
  return `<svg viewBox="0 0 132 128" width="130" height="126"><path d="M30 16h54l-6 98a10 10 0 0 1-10 9H46a10 10 0 0 1-10-9z" fill="#fff" stroke="#344054" stroke-width="3"/>${water}${marks}<text x="104" y="20" font-size="9">mL</text></svg>`;
}
function barGraphSvg(labels, values, showBars = true) {
  const max = Math.max(5, ...values);
  const bars = values.map((v, i) => {
    const x = 38 + i * 34;
    const h = 80 * v / max;
    return `${showBars ? `<rect x="${x}" y="${100 - h}" width="22" height="${h}" fill="#f97316"/>` : `<rect x="${x}" y="20" width="22" height="80" fill="transparent" stroke="#cfd8e3" stroke-dasharray="3 3"/>`}<text x="${x + 11}" y="116" font-size="10" text-anchor="middle">${labels[i]}</text>`;
  }).join("");
  const grid = Array.from({ length: 6 }, (_, i) => `<line x1="28" y1="${20 + i * 16}" x2="176" y2="${20 + i * 16}" stroke="#d8e0e8"/><text x="22" y="${24 + i * 16}" font-size="8" text-anchor="end">${Math.round(max - max * i / 5)}</text>`).join("");
  return `<svg class="graph" viewBox="0 0 190 125" width="190" height="125"><line x1="28" y1="100" x2="180" y2="100" stroke="#344054"/><line x1="28" y1="18" x2="28" y2="100" stroke="#344054"/>${grid}${bars}</svg>`;
}
function shapeSvg(shape, mode) {
  const grid = Array.from({ length: 8 }, (_, i) => `<line class="grid-line" x1="${16 + i * 18}" y1="16" x2="${16 + i * 18}" y2="142"/><line class="grid-line" x1="16" y1="${16 + i * 18}" x2="142" y2="${16 + i * 18}"/>`).join("");
  const paths = {
    triangle: "M38 118 L86 32 L130 118 Z",
    quadrilateral: "M36 44 L124 34 L136 112 L50 124 Z",
    rectangle: "M36 46 H132 V112 H36 Z",
    square: "M46 38 H122 V114 H46 Z",
    rightTriangle: "M42 116 H126 V40 Z",
  };
  const label = { triangle: "三角形", quadrilateral: "四角形", rectangle: "長方形", square: "正方形", rightTriangle: "直角三角形" }[shape];
  const cls = mode === "trace" ? "trace-shape" : "solid-shape";
  return `<svg viewBox="0 0 160 160" width="150" height="150" aria-label="${label}">${mode === "draw" ? grid : ""}<path class="${cls}" d="${paths[shape]}"/>${shape === "rightTriangle" ? `<path d="M106 116 V96 H126" fill="none" stroke="#344054" stroke-width="2"/>` : ""}</svg>`;
}
function makeProblem(settings) {
  if (APP.id === "time-print-grade2") return makeTimeProblem(settings);
  if (APP.id === "length-print-grade2") return makeLengthProblem(settings);
  if (APP.id === "capacity-print-grade2") return makeCapacityProblem(settings);
  if (APP.id === "shape-print-grade2") return makeShapeProblem(settings);
  return makeGraphProblem(settings);
}
function makeTimeProblem(settings) {
  const step = settings.difficulty === "easy" ? 30 : settings.difficulty === "hard" ? 1 : 5;
  const base = rand(1, 11) * 60 + rand(0, Math.floor(59 / step)) * step;
  if (settings.type === "draw") return { prompt: `${timeText(base)} の針をかきましょう。`, answer: timeText(base), visual: clockSvg(base, false), answerVisual: clockSvg(base, true) };
  if (settings.type === "beforeAfter") {
    const delta = pick(settings.difficulty === "easy" ? [30, 60] : settings.difficulty === "hard" ? [10, 15, 25, 35, 45, 50] : [5, 10, 15, 30]);
    const dir = pick(["後", "前"]);
    const ans = dir === "後" ? base + delta : base - delta;
    return { prompt: `${timeText(base)} の ${delta}分${dir} はいつですか。`, answer: timeText(ans), visual: clockSvg(base, true) };
  }
  return { prompt: "時計の時刻を書きましょう。", answer: timeText(base), visual: clockSvg(base, true) };
}
function makeLengthProblem(settings) {
  const mm = settings.difficulty === "easy" ? rand(2, 10) * 10 : rand(15, 98);
  if (settings.type === "convert") {
    const cm = rand(1, 9); const extra = rand(1, 9);
    return { prompt: `${cm}cm${extra}mm は何mmですか。`, answer: `${cm * 10 + extra}mm`, visual: rulerSvg(cm * 10 + extra, true) };
  }
  if (settings.type === "compare") {
    const a = rand(20, 90); const b = rand(20, 90);
    return { prompt: `${Math.floor(a / 10)}cm${a % 10}mm と ${Math.floor(b / 10)}cm${b % 10}mm、大きいほうを書きましょう。`, answer: a === b ? "同じ" : (a > b ? `${Math.floor(a / 10)}cm${a % 10}mm` : `${Math.floor(b / 10)}cm${b % 10}mm`), visual: "" };
  }
  return { prompt: "青いしるしの長さを書きましょう。", answer: `${Math.floor(mm / 10)}cm${mm % 10 ? `${mm % 10}mm` : ""}`, visual: rulerSvg(mm, true) };
}
function makeCapacityProblem(settings) {
  const ml = settings.difficulty === "easy" ? rand(1, 9) * 100 : rand(2, 20) * 50;
  if (settings.type === "convert") {
    const dl = rand(1, 9); const extra = rand(0, 9);
    return { prompt: `${dl}dL${extra ? `${extra * 10}mL` : ""} は何mLですか。`, answer: `${dl * 100 + extra * 10}mL`, visual: beakerSvg(dl * 100 + extra * 10, true) };
  }
  if (settings.type === "compare") {
    const a = rand(2, 10); const b = rand(2, 10);
    return { prompt: `${a}dL と ${b * 100}mL、大きいほうを書きましょう。`, answer: a * 100 === b * 100 ? "同じ" : (a > b ? `${a}dL` : `${b * 100}mL`), visual: "" };
  }
  return { prompt: "水のかさを読みましょう。", answer: ml >= 1000 ? "1L" : `${ml}mL`, visual: beakerSvg(ml, true) };
}
function makeShapeProblem(settings) {
  const shapes = ["triangle", "quadrilateral", "rectangle", "square", "rightTriangle"];
  const shape = pick(shapes);
  const names = { triangle: "三角形", quadrilateral: "四角形", rectangle: "長方形", square: "正方形", rightTriangle: "直角三角形" };
  if (settings.type === "trace") return { prompt: "線をなぞりましょう。", answer: names[shape], visual: shapeSvg(shape, "trace"), answerVisual: shapeSvg(shape, "solid") };
  if (settings.type === "draw") return { prompt: `${names[shape]} を方眼にかきましょう。`, answer: names[shape], visual: shapeSvg(shape, "draw"), answerVisual: shapeSvg(shape, "solid") };
  if (settings.type === "classify") return { prompt: "この形のなかまを書きましょう。", answer: names[shape], visual: shapeSvg(shape, "solid") };
  return { prompt: "この形の名前を書きましょう。", answer: names[shape], visual: shapeSvg(shape, "solid") };
}
function makeGraphProblem(settings) {
  const labels = ["りんご", "みかん", "ぶどう", "なし"];
  const values = labels.map(() => rand(1, settings.difficulty === "easy" ? 5 : 9));
  const i = rand(0, labels.length - 1);
  if (settings.type === "makeGraph") return { prompt: "表を見て、棒グラフを完成させましょう。", answer: labels.map((l, idx) => `${l}:${values[idx]}`).join("、"), visual: makeTable(labels, values) + barGraphSvg(labels, values, false), answerVisual: makeTable(labels, values) + barGraphSvg(labels, values, true) };
  if (settings.type === "table") return { prompt: `${labels[i]} はいくつですか。`, answer: `${values[i]}`, visual: makeTable(labels, values) };
  return { prompt: `${labels[i]} はいくつですか。`, answer: `${values[i]}`, visual: barGraphSvg(labels, values, true) };
}
function makeTable(labels, values) {
  const rows = labels.map((label, i) => `<tr><th>${label}</th><td>${values[i]}</td></tr>`).join("");
  return `<table style="border-collapse:collapse;background:#fff;font-size:14px"><tbody>${rows}</tbody></table><style>td,th{border:1px solid #98a2b3;padding:4px 10px}</style>`;
}
function generateProblems(options = {}) {
  if (options.normalizeCount !== false) els.problemCount.value = String(getProblemCount());
  const settings = getSettings();
  problems = Array.from({ length: settings.count }, () => makeProblem(settings));
  render();
  setStatus("問題を作り直しました。");
}
function renderProblem(problem, showAnswer) {
  const card = document.createElement("div");
  card.className = "problem-card";
  const prompt = document.createElement("div");
  prompt.className = "prompt";
  prompt.textContent = problem.prompt;
  const visual = document.createElement("div");
  visual.className = "visual";
  visual.innerHTML = showAnswer && problem.answerVisual ? problem.answerVisual : problem.visual;
  const answerLine = document.createElement("div");
  answerLine.className = "answer-line";
  answerLine.innerHTML = showAnswer ? `<span class="answer-value">${problem.answer}</span>` : `<span class="blank">□</span><span class="small-note">答え</span>`;
  card.append(prompt, visual, answerLine);
  return card;
}
function renderPage(kind, showAnswer) {
  const settings = getSettings();
  const page = els.pageTemplate.content.firstElementChild.cloneNode(true);
  page.querySelector("[data-name]").textContent = settings.name;
  page.querySelector("[data-date]").textContent = settings.date;
  page.querySelector("[data-title]").textContent = settings.title;
  const kindLabel = page.querySelector("[data-kind]");
  kindLabel.textContent = kind;
  if (showAnswer) kindLabel.classList.add("answer");
  const list = page.querySelector("[data-problems]");
  list.style.setProperty("--cols", settings.columns);
  list.style.setProperty("--row-gap", settings.count > 24 ? "4mm" : "7mm");
  list.style.setProperty("--problem-min", settings.count > 24 ? "28mm" : "36mm");
  problems.forEach((problem) => {
    const item = document.createElement("li");
    item.className = "problem";
    item.append(renderProblem(problem, showAnswer));
    list.append(item);
  });
  return page;
}
function render() {
  if (!problems.length) problems = Array.from({ length: getSettings().count }, () => makeProblem(getSettings()));
  els.pages.replaceChildren(renderPage("問題", false), renderPage("答え", true));
  els.pageCount.textContent = "2枚";
  saveState();
}
function getShareState() { return { settings: getSettings(), problems }; }
function encodeState(state) {
  const bytes = new TextEncoder().encode(JSON.stringify(state));
  let binary = "";
  bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function decodeState(value) {
  try {
    const padded = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
    const binary = atob(padded);
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    return JSON.parse(new TextDecoder().decode(bytes));
  } catch { return null; }
}
function saveState() { try { localStorage.setItem(stateStorageKey, JSON.stringify(getShareState())); } catch {} }
function loadInitialState() {
  const hash = window.location.hash.replace(/^#data=/, "");
  if (hash) {
    const decoded = decodeState(hash);
    if (decoded?.settings && Array.isArray(decoded.problems)) { applySettings(decoded.settings); problems = decoded.problems; return; }
  }
  try {
    const saved = localStorage.getItem(stateStorageKey);
    if (saved) {
      const parsed = JSON.parse(saved);
      applySettings(parsed.settings);
      if (Array.isArray(parsed.problems)) problems = parsed.problems;
    }
  } catch {}
}
async function copyShareUrl() {
  const encoded = encodeState(getShareState());
  const url = `${window.location.origin}${window.location.pathname}#data=${encoded}`;
  try { await navigator.clipboard.writeText(url); setStatus("共有URLをコピーしました。"); }
  catch { window.location.hash = `data=${encoded}`; setStatus("URL欄に共有用データを入れました。"); }
}
function bindEvents() {
  [els.studentName, els.worksheetDate, els.worksheetTitle].forEach((control) => control.addEventListener("input", render));
  [els.problemType, els.difficulty, els.problemCount, els.columns].forEach((control) => control.addEventListener("change", generateProblems));
  els.problemCount.addEventListener("input", () => { if (els.problemCount.value === "") return; els.problemCountPreset.value = ""; generateProblems({ normalizeCount: false }); });
  els.problemCountPreset.addEventListener("change", () => { if (!els.problemCountPreset.value) return; els.problemCount.value = els.problemCountPreset.value; generateProblems(); els.problemCountPreset.value = ""; });
  els.printBtn.addEventListener("click", () => { render(); window.print(); });
  els.regenerateBtn.addEventListener("click", generateProblems);
  els.copyLinkBtn.addEventListener("click", copyShareUrl);
}
loadInitialState();
bindEvents();
if (!problems.length) generateProblems(); else render();
