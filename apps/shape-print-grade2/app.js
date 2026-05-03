const APP = {
  id: "shape-print-grade2",
  title: "2年生 図形 名前プリント",
  accent: "#7c3aed",
  stateVersion: 2,
  defaultCount: 10,
  defaultCols: 2,
};

document.documentElement.style.setProperty("--accent", APP.accent);

const els = {
  studentName: document.querySelector("#studentName"),
  worksheetDate: document.querySelector("#worksheetDate"),
  worksheetTitle: document.querySelector("#worksheetTitle"),
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

function clampChoice(value, allowed, fallback) {
  return allowed.includes(String(value)) ? String(value) : fallback;
}

function clampNumber(value, min, max, fallback) {
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? fallback : Math.min(max, Math.max(min, parsed));
}

function getProblemCount() {
  return clampNumber(els.problemCount.value, problemCountMin, problemCountMax, APP.defaultCount);
}

function getSettings() {
  return {
    name: els.studentName.value,
    date: els.worksheetDate.value,
    title: els.worksheetTitle.value || APP.title,
    count: getProblemCount(),
    columns: Number.parseInt(clampChoice(els.columns.value, ["1", "2", "3"], String(APP.defaultCols)), 10),
  };
}

function applySettings(settings) {
  if (!settings || typeof settings !== "object") return;
  els.studentName.value = settings.name || "";
  els.worksheetDate.value = settings.date || "";
  els.worksheetTitle.value = settings.title && settings.title !== "2年生 図形" ? settings.title : APP.title;
  els.problemCount.value = String(clampNumber(settings.count, problemCountMin, problemCountMax, APP.defaultCount));
  els.problemCountPreset.value = "";
  els.columns.value = clampChoice(settings.columns, ["1", "2", "3"], String(APP.defaultCols));
}

function setStatus(message) {
  window.clearTimeout(statusTimer);
  els.status.textContent = message;
  statusTimer = window.setTimeout(() => {
    els.status.textContent = "";
  }, 2800);
}

function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick(items) {
  return items[rand(0, items.length - 1)];
}

function shapeSvg(shape) {
  const paths = {
    triangle: "M38 118 L86 32 L130 118 Z",
    quadrilateral: "M44 44 H124 L112 116 H32 Z",
    rectangle: "M36 46 H132 V112 H36 Z",
    square: "M46 38 H122 V114 H46 Z",
    rightTriangle: "M42 116 H126 V40 Z",
  };
  const labels = {
    triangle: "三角形",
    quadrilateral: "四角形",
    rectangle: "長方形",
    square: "正方形",
    rightTriangle: "直角三角形",
  };
  const rightAngle = shape === "rightTriangle"
    ? `<path d="M106 116 V96 H126" fill="none" stroke="#344054" stroke-width="2"/>`
    : "";
  return `<svg viewBox="0 0 160 160" width="150" height="150" aria-label="${labels[shape]}"><path class="solid-shape" d="${paths[shape]}"/>${rightAngle}</svg>`;
}

function makeProblem() {
  const shapes = ["triangle", "quadrilateral", "rectangle", "square", "rightTriangle"];
  const shape = pick(shapes);
  const names = {
    triangle: "三角形",
    quadrilateral: "四角形",
    rectangle: "長方形",
    square: "正方形",
    rightTriangle: "直角三角形",
  };
  return {
    prompt: "この形の名前を書きましょう。",
    answer: names[shape],
    visual: shapeSvg(shape),
  };
}

function generateProblems(options = {}) {
  if (options.normalizeCount !== false) els.problemCount.value = String(getProblemCount());
  const settings = getSettings();
  problems = Array.from({ length: settings.count }, () => makeProblem());
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
  visual.innerHTML = problem.visual;
  const answerLine = document.createElement("div");
  answerLine.className = "answer-line";
  answerLine.innerHTML = showAnswer
    ? `<span class="answer-value">${problem.answer}</span>`
    : `<span class="blank">□</span><span class="small-note">答え</span>`;
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
  if (!problems.length) {
    problems = Array.from({ length: getSettings().count }, () => makeProblem());
  }
  els.pages.replaceChildren(renderPage("問題", false), renderPage("答え", true));
  els.pageCount.textContent = "2枚";
  saveState();
}

function getShareState() {
  return { version: APP.stateVersion, settings: getSettings(), problems };
}

function encodeState(state) {
  const bytes = new TextEncoder().encode(JSON.stringify(state));
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function decodeState(value) {
  try {
    const padded = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
    const binary = atob(padded);
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    return JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    return null;
  }
}

function saveState() {
  try {
    localStorage.setItem(stateStorageKey, JSON.stringify(getShareState()));
  } catch {}
}

function loadInitialState() {
  const hash = window.location.hash.replace(/^#data=/, "");
  if (hash) {
    const decoded = decodeState(hash);
    if (decoded?.settings) {
      applySettings(decoded.settings);
      problems = decoded.version === APP.stateVersion && Array.isArray(decoded.problems) ? decoded.problems : [];
      return;
    }
  }
  try {
    const saved = localStorage.getItem(stateStorageKey);
    if (saved) {
      const parsed = JSON.parse(saved);
      applySettings(parsed.settings);
      if (parsed.version === APP.stateVersion && Array.isArray(parsed.problems)) problems = parsed.problems;
    }
  } catch {}
}

async function copyShareUrl() {
  const encoded = encodeState(getShareState());
  const url = `${window.location.origin}${window.location.pathname}#data=${encoded}`;
  try {
    await navigator.clipboard.writeText(url);
    setStatus("共有URLをコピーしました。");
  } catch {
    window.location.hash = `data=${encoded}`;
    setStatus("URL欄に共有用データを入れました。");
  }
}

function bindEvents() {
  [els.studentName, els.worksheetDate, els.worksheetTitle].forEach((control) => control.addEventListener("input", render));
  [els.problemCount, els.columns].forEach((control) => control.addEventListener("change", generateProblems));
  els.problemCount.addEventListener("input", () => {
    if (els.problemCount.value === "") return;
    els.problemCountPreset.value = "";
    generateProblems({ normalizeCount: false });
  });
  els.problemCountPreset.addEventListener("change", () => {
    if (!els.problemCountPreset.value) return;
    els.problemCount.value = els.problemCountPreset.value;
    generateProblems();
    els.problemCountPreset.value = "";
  });
  els.printBtn.addEventListener("click", () => {
    render();
    window.print();
  });
  els.regenerateBtn.addEventListener("click", generateProblems);
  els.copyLinkBtn.addEventListener("click", copyShareUrl);
}

loadInitialState();
bindEvents();
if (!problems.length) generateProblems();
else render();
