const config = window.GRADE3_APP_CONFIG;

document.documentElement.style.setProperty("--accent", config.accent || "#475569");

const els = {
  studentName: document.querySelector("#studentName"),
  worksheetDate: document.querySelector("#worksheetDate"),
  worksheetTitle: document.querySelector("#worksheetTitle"),
  problemType: document.querySelector("#problemType"),
  problemCount: document.querySelector("#problemCount"),
  problemCountPreset: document.querySelector("#problemCountPreset"),
  columns: document.querySelector("#columns"),
  printBtn: document.querySelector("#printButton"),
  regenerateBtn: document.querySelector("#regenerateButton"),
  copyLinkBtn: document.querySelector("#copyLinkButton"),
  pageCount: document.querySelector("#pageCount"),
  pages: document.querySelector("#pages"),
  pageTemplate: document.querySelector("#pageTemplate"),
  status: document.querySelector("#status"),
};

const stateStorageKey = `${config.id}-state`;
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

function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick(items) {
  return items[rand(0, items.length - 1)];
}

function getProblemCount() {
  return clampNumber(els.problemCount.value, problemCountMin, problemCountMax, config.defaultCount || 12);
}

function typeValues() {
  return config.types.map((type) => type.value);
}

function getSettings() {
  return {
    name: els.studentName.value,
    date: els.worksheetDate.value,
    title: els.worksheetTitle.value || config.title,
    type: clampChoice(els.problemType.value, typeValues(), config.types[0].value),
    count: getProblemCount(),
    columns: Number.parseInt(clampChoice(els.columns.value, ["1", "2", "3"], String(config.defaultColumns || 2)), 10),
  };
}

function applySettings(settings) {
  if (!settings || typeof settings !== "object") {
    return;
  }
  els.studentName.value = settings.name || "";
  els.worksheetDate.value = settings.date || "";
  els.worksheetTitle.value = settings.title || config.title;
  els.problemType.value = clampChoice(settings.type, typeValues(), config.types[0].value);
  els.problemCount.value = String(clampNumber(settings.count, problemCountMin, problemCountMax, config.defaultCount || 12));
  els.problemCountPreset.value = "";
  els.columns.value = clampChoice(settings.columns, ["1", "2", "3"], String(config.defaultColumns || 2));
}

function setStatus(message) {
  window.clearTimeout(statusTimer);
  els.status.textContent = message;
  statusTimer = window.setTimeout(() => {
    els.status.textContent = "";
  }, 2800);
}

function pad(value) {
  return String(value).padStart(2, "0");
}

function timeText(totalMinutes) {
  const minutes = ((totalMinutes % 720) + 720) % 720;
  const hour = Math.floor(minutes / 60) || 12;
  const minute = minutes % 60;
  return minute === 0 ? `${hour}時` : `${hour}時${pad(minute)}分`;
}

function clockSvg(totalMinutes, handMode = "both") {
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
  const nums = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((n) => {
    const angle = (n * 30 - 90) * Math.PI / 180;
    return `<text x="${(64 + Math.cos(angle) * 42).toFixed(1)}" y="${(68 + Math.sin(angle) * 42).toFixed(1)}" font-size="11" text-anchor="middle">${n}</text>`;
  }).join("");
  const minuteAngle = (minute * 6 - 90) * Math.PI / 180;
  const hourAngle = (((hour % 12) + minute / 60) * 30 - 90) * Math.PI / 180;
  const hands = [];
  if (handMode === "both" || handMode === "hour") {
    hands.push(`<line x1="64" y1="64" x2="${(64 + Math.cos(hourAngle) * 28).toFixed(1)}" y2="${(64 + Math.sin(hourAngle) * 28).toFixed(1)}" stroke="#111827" stroke-width="5" stroke-linecap="round"/>`);
  }
  if (handMode === "both" || handMode === "minute") {
    hands.push(`<line x1="64" y1="64" x2="${(64 + Math.cos(minuteAngle) * 43).toFixed(1)}" y2="${(64 + Math.sin(minuteAngle) * 43).toFixed(1)}" stroke="#111827" stroke-width="3" stroke-linecap="round"/>`);
  }
  hands.push(`<circle cx="64" cy="64" r="3" fill="#111827"/>`);
  return `<svg class="clock" viewBox="-14 -14 156 156" width="132" height="132" role="img" aria-label="時計"><circle cx="64" cy="64" r="59" fill="#fff" stroke="#344054" stroke-width="3"/>${marks}${nums}${hands.join("")}</svg>`;
}

function scaleSvg(grams) {
  const max = 3000;
  const angle = -120 + Math.min(grams, max) / max * 240;
  const rad = (angle - 90) * Math.PI / 180;
  const x = 70 + Math.cos(rad) * 43;
  const y = 70 + Math.sin(rad) * 43;
  const marks = [0, 500, 1000, 1500, 2000, 2500, 3000].map((value) => {
    const a = (-120 + value / max * 240 - 90) * Math.PI / 180;
    const mx = 70 + Math.cos(a) * 51;
    const my = 70 + Math.sin(a) * 51;
    return `<text x="${mx.toFixed(1)}" y="${my.toFixed(1)}" font-size="8" text-anchor="middle">${value / 1000}</text>`;
  }).join("");
  return `<svg class="scale" viewBox="0 0 140 120" width="150" height="126" role="img" aria-label="はかり"><circle cx="70" cy="70" r="58" fill="#fff" stroke="#344054" stroke-width="3"/><text x="70" y="24" font-size="10" text-anchor="middle">kg</text>${marks}<line x1="70" y1="70" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" stroke="#111827" stroke-width="4" stroke-linecap="round"/><circle cx="70" cy="70" r="4" fill="#111827"/></svg>`;
}

function makeClockProblem(settings) {
  const step = settings.type === "minute" ? 1 : settings.type === "five" ? 5 : 15;
  const total = rand(1, 11) * 60 + rand(0, Math.floor(59 / step)) * step;
  if (settings.type === "draw") {
    return {
      prompt: `${timeText(total)} の針をかきましょう。`,
      answer: timeText(total),
      visual: clockSvg(total, "none"),
      answerVisual: clockSvg(total, "both"),
    };
  }
  return {
    prompt: "時計の時刻を読みましょう。",
    answer: timeText(total),
    visual: clockSvg(total, "both"),
  };
}

function makeTimeProblem(settings) {
  const base = rand(1, 11) * 60 + rand(0, 11) * 5;
  const delta = pick(settings.type === "hourMinute" ? [40, 45, 50, 75, 90, 105, 120] : [10, 15, 20, 25, 30, 35]);
  if (settings.type === "duration") {
    return {
      prompt: `${timeText(base)} から ${timeText(base + delta)} までは何分ですか。`,
      answer: `${delta}分`,
      visual: clockSvg(base, "both"),
    };
  }
  const dir = pick(["後", "前"]);
  const answer = dir === "後" ? base + delta : base - delta;
  return {
    prompt: `${timeText(base)} の ${delta}分${dir} はいつですか。`,
    answer: timeText(answer),
    visual: clockSvg(base, "both"),
  };
}

function makeDivisionProblem(settings) {
  const divisor = rand(2, 9);
  if (settings.type === "remainder") {
    const quotient = rand(2, 9);
    const remainder = rand(1, divisor - 1);
    const dividend = divisor * quotient + remainder;
    return {
      prompt: `${dividend} ÷ ${divisor} =`,
      answer: `${quotient} あまり ${remainder}`,
    };
  }
  const quotient = rand(2, 12);
  return {
    prompt: `${divisor * quotient} ÷ ${divisor} =`,
    answer: `${quotient}`,
  };
}

function makeBigNumberProblem(settings) {
  const number = rand(1000, 99999);
  const places = [
    ["一万", 10000],
    ["千", 1000],
    ["百", 100],
    ["十", 10],
    ["一", 1],
  ];
  const place = pick(places);
  if (settings.type === "place") {
    return {
      prompt: `${number.toLocaleString("ja-JP")} の ${place[0]} の位の数字は何ですか。`,
      answer: `${Math.floor(number / place[1]) % 10}`,
    };
  }
  if (settings.type === "compare") {
    const other = rand(1000, 99999);
    const sign = number === other ? "=" : number > other ? ">" : "<";
    return {
      prompt: `${number.toLocaleString("ja-JP")} □ ${other.toLocaleString("ja-JP")}`,
      answer: sign,
    };
  }
  return {
    prompt: `${number.toLocaleString("ja-JP")} を数字で書きましょう。`,
    answer: String(number),
  };
}

function makeDecimalProblem(settings) {
  const a = rand(1, 99) / 10;
  const b = rand(1, 99) / 10;
  if (settings.type === "compare") {
    const sign = a === b ? "=" : a > b ? ">" : "<";
    return { prompt: `${a.toFixed(1)} □ ${b.toFixed(1)}`, answer: sign };
  }
  if (settings.type === "sub") {
    const big = Math.max(a, b);
    const small = Math.min(a, b);
    return { prompt: `${big.toFixed(1)} - ${small.toFixed(1)} =`, answer: `${(big - small).toFixed(1)}` };
  }
  return { prompt: `${a.toFixed(1)} + ${b.toFixed(1)} =`, answer: `${(a + b).toFixed(1)}` };
}

function makeWeightProblem(settings) {
  const grams = rand(1, 30) * 100;
  if (settings.type === "read") {
    return {
      prompt: "はかりの重さを読みましょう。",
      answer: grams >= 1000 ? `${Math.floor(grams / 1000)}kg${grams % 1000 ? ` ${grams % 1000}g` : ""}` : `${grams}g`,
      visual: scaleSvg(grams),
    };
  }
  if (settings.type === "compare") {
    const a = rand(1, 30) * 100;
    const b = rand(1, 30) * 100;
    const sign = a === b ? "=" : a > b ? ">" : "<";
    return { prompt: `${a}g □ ${b}g`, answer: sign };
  }
  const kg = rand(1, 5);
  const g = rand(1, 9) * 100;
  return { prompt: `${kg}kg ${g}g =`, answer: `${kg * 1000 + g}g` };
}

function makeProblem(settings) {
  if (config.kind === "clock") return makeClockProblem(settings);
  if (config.kind === "time") return makeTimeProblem(settings);
  if (config.kind === "division") return makeDivisionProblem(settings);
  if (config.kind === "bigNumber") return makeBigNumberProblem(settings);
  if (config.kind === "decimal") return makeDecimalProblem(settings);
  return makeWeightProblem(settings);
}

function generateProblems(options = {}) {
  if (options.normalizeCount !== false) {
    els.problemCount.value = String(getProblemCount());
  }
  const settings = getSettings();
  problems = Array.from({ length: settings.count }, () => makeProblem(settings));
  render();
  setStatus("もんだいをつくりなおしました。");
}

function renderProblem(problem, showAnswer) {
  const card = document.createElement("div");
  card.className = "problem-card";
  const prompt = document.createElement("div");
  prompt.className = "prompt";
  prompt.textContent = problem.prompt;
  card.append(prompt);

  if (problem.visual) {
    const visual = document.createElement("div");
    visual.className = "visual";
    visual.innerHTML = showAnswer && problem.answerVisual ? problem.answerVisual : problem.visual;
    card.append(visual);
  }

  const answerLine = document.createElement("div");
  answerLine.className = "answer-line";
  answerLine.innerHTML = showAnswer
    ? `<span class="answer-value">${problem.answer}</span>`
    : `<span class="blank">□</span><span class="small-note">こたえ</span>`;
  card.append(answerLine);
  return card;
}

function applyGridDensity(list, settings) {
  const rows = Math.ceil(settings.count / settings.columns);
  let rowGap = 7;
  let problemMin = problemHasVisual() ? 42 : 20;
  let fontSize = 18;

  if (rows > 12) {
    rowGap = 3.5;
    problemMin = problemHasVisual() ? 25 : 12;
    fontSize = 15;
  } else if (rows > 8) {
    rowGap = 5;
    problemMin = problemHasVisual() ? 32 : 16;
    fontSize = 16;
  }

  list.style.setProperty("--cols", settings.columns);
  list.style.setProperty("--row-gap", `${rowGap}mm`);
  list.style.setProperty("--problem-min", `${problemMin}mm`);
  list.style.setProperty("--problem-font", `${fontSize}px`);
}

function problemHasVisual() {
  return config.kind === "clock" || config.kind === "time" || config.kind === "weight";
}

function renderPage(kind, showAnswer) {
  const settings = getSettings();
  const page = els.pageTemplate.content.firstElementChild.cloneNode(true);
  page.querySelector("[data-name]").textContent = settings.name;
  page.querySelector("[data-date]").textContent = settings.date;
  page.querySelector("[data-title]").textContent = settings.title;
  const kindLabel = page.querySelector("[data-kind]");
  kindLabel.textContent = kind;
  if (showAnswer) {
    kindLabel.classList.add("answer");
  }

  const list = page.querySelector("[data-problems]");
  applyGridDensity(list, settings);
  problems.forEach((problem) => {
    const item = document.createElement("li");
    item.className = "problem";
    item.append(renderProblem(problem, showAnswer));
    list.append(item);
  });
  return page;
}

function normalizeProblems() {
  const settings = getSettings();
  if (problems.length > settings.count) {
    problems = problems.slice(0, settings.count);
  }
  while (problems.length < settings.count) {
    problems.push(makeProblem(settings));
  }
}

function render() {
  normalizeProblems();
  els.pages.replaceChildren(renderPage("もんだい", false), renderPage("こたえ", true));
  els.pageCount.textContent = "2枚";
  saveState();
}

function getShareState() {
  return { settings: getSettings(), problems };
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
    if (decoded?.settings && Array.isArray(decoded.problems)) {
      applySettings(decoded.settings);
      problems = decoded.problems;
      return;
    }
  }

  try {
    const saved = localStorage.getItem(stateStorageKey);
    if (saved) {
      const parsed = JSON.parse(saved);
      applySettings(parsed.settings);
      if (Array.isArray(parsed.problems)) {
        problems = parsed.problems;
      }
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
  [els.problemType, els.problemCount, els.columns].forEach((control) => control.addEventListener("change", generateProblems));
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

function setup() {
  document.title = config.title;
  document.querySelector("[data-app-title]").textContent = config.title;
  document.querySelector("[data-app-notice]").textContent = config.notice || `${config.title}は開発中です。プリント作成はできますが、内容や表示はあとで調整します。`;
  els.worksheetTitle.value = config.title;
  config.types.forEach((type) => {
    const option = document.createElement("option");
    option.value = type.value;
    option.textContent = type.label;
    els.problemType.append(option);
  });
}

setup();
loadInitialState();
bindEvents();
if (!problems.length) {
  generateProblems();
} else {
  render();
}
