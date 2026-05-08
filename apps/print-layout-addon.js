(() => {
  const pages = document.querySelector("#pages");
  const settingsGrid = document.querySelector(".settings-grid");
  const answerToggle = document.querySelector("#includeAnswers");
  const pageCount = document.querySelector("#pageCount");
  const printButton = document.querySelector("#printBtn, #printButton");
  if (!pages || !settingsGrid) return;

  const appKey = `print-layout:${location.pathname}:v1`;
  const defaults = {
    problemScale: 100,
    problemSpacing: 7,
    pageMarginY: 14,
    pageMarginX: 13,
    answerGap: 0,
    includeAnswers: true,
  };
  let applying = false;

  function clamp(value, min, max, fallback) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? Math.min(max, Math.max(min, parsed)) : fallback;
  }

  function loadSettings() {
    try {
      const saved = JSON.parse(localStorage.getItem(appKey) || "{}");
      return { ...defaults, ...saved };
    } catch {
      return { ...defaults };
    }
  }

  function saveSettings(settings) {
    try {
      localStorage.setItem(appKey, JSON.stringify(settings));
    } catch {}
  }

  function createRangeField(id, label, min, max, step, value) {
    const field = document.createElement("label");
    field.className = "field range-field";
    field.innerHTML = `<span>${label}</span><span class="range-control"><input id="${id}" type="range" min="${min}" max="${max}" step="${step}" value="${value}"><input id="${id}Number" type="number" min="${min}" max="${max}" step="${step}" value="${value}" inputmode="decimal"></span>`;
    return field;
  }

  function setPair(id, value) {
    const range = document.querySelector(`#${id}`);
    const number = document.querySelector(`#${id}Number`);
    if (range) range.value = String(value);
    if (number) number.value = String(value);
  }

  function readSettings() {
    return {
      problemScale: clamp(document.querySelector("#layoutProblemScale")?.value, 70, 150, defaults.problemScale),
      problemSpacing: clamp(document.querySelector("#layoutProblemSpacing")?.value, 2, 20, defaults.problemSpacing),
      pageMarginY: clamp(document.querySelector("#layoutPageMarginY")?.value, 5, 28, defaults.pageMarginY),
      pageMarginX: clamp(document.querySelector("#layoutPageMarginX")?.value, 5, 28, defaults.pageMarginX),
      answerGap: clamp(document.querySelector("#layoutAnswerGap")?.value, 0, 12, defaults.answerGap),
      includeAnswers: answerToggle?.checked !== false,
    };
  }

  function syncPair(id, onChange) {
    const range = document.querySelector(`#${id}`);
    const number = document.querySelector(`#${id}Number`);
    if (!range || !number) return;
    range.addEventListener("input", () => {
      number.value = range.value;
      onChange();
    });
    number.addEventListener("input", () => {
      range.value = number.value;
      onChange();
    });
  }

  function setupControls() {
    if (document.querySelector("#layoutProblemScale")) return;
    const settings = loadSettings();
    if (answerToggle) {
      answerToggle.disabled = false;
      answerToggle.checked = settings.includeAnswers !== false;
    }
    settingsGrid.append(
      createRangeField("layoutProblemScale", "問題の大きさ（%）", 70, 150, 5, settings.problemScale),
      createRangeField("layoutProblemSpacing", "問題の間隔（mm）", 2, 20, 1, settings.problemSpacing),
      createRangeField("layoutPageMarginY", "上下の余白（mm）", 5, 28, 1, settings.pageMarginY),
      createRangeField("layoutPageMarginX", "左右の余白（mm）", 5, 28, 1, settings.pageMarginX),
      createRangeField("layoutAnswerGap", "答え欄との間隔（mm）", 0, 12, 1, settings.answerGap),
    );
    const warning = document.createElement("p");
    warning.id = "layoutWarning";
    warning.className = "layout-warning";
    warning.setAttribute("role", "status");
    warning.hidden = true;
    settingsGrid.after(warning);

    ["layoutProblemScale", "layoutProblemSpacing", "layoutPageMarginY", "layoutPageMarginX", "layoutAnswerGap"].forEach((id) => {
      syncPair(id, () => {
        const next = readSettings();
        saveSettings(next);
        applyLayout(next);
      });
    });
    answerToggle?.addEventListener("change", () => {
      const next = readSettings();
      saveSettings(next);
      applyLayout(next);
    });

    setPair("layoutProblemScale", settings.problemScale);
    setPair("layoutProblemSpacing", settings.problemSpacing);
    setPair("layoutPageMarginY", settings.pageMarginY);
    setPair("layoutPageMarginX", settings.pageMarginX);
    setPair("layoutAnswerGap", settings.answerGap);
  }

  function isAnswerPage(page) {
    const kind = page.querySelector("[data-kind]");
    return kind?.classList.contains("answer") || kind?.textContent?.trim() === "こたえ";
  }

  function updateWarning(settings) {
    const warning = document.querySelector("#layoutWarning");
    if (!warning) return;
    const problemCount = document.querySelectorAll(".print-page:first-child .problem").length;
    const mayOverflow = settings.problemScale >= 130 && problemCount >= 18;
    const tight = settings.problemSpacing <= 3 || settings.pageMarginY <= 7 || settings.pageMarginX <= 7;
    if (!mayOverflow && !tight) {
      warning.hidden = true;
      warning.textContent = "";
      return;
    }
    warning.hidden = false;
    warning.textContent = mayOverflow
      ? "大きめの設定です。印刷前に1枚に収まるか確認してください。"
      : "余白や間隔が狭めです。書き込みやすさを確認してください。";
  }

  function applyLayout(settings = readSettings()) {
    if (applying) return;
    applying = true;
    const scale = settings.problemScale / 100;
    document.documentElement.style.setProperty("--layout-problem-scale", String(scale));
    document.documentElement.style.setProperty("--layout-problem-spacing", `${settings.problemSpacing}mm`);
    document.documentElement.style.setProperty("--layout-column-gap", `${Math.max(4, settings.problemSpacing)}mm`);
    document.documentElement.style.setProperty("--layout-page-margin-y", `${settings.pageMarginY}mm`);
    document.documentElement.style.setProperty("--layout-page-margin-x", `${settings.pageMarginX}mm`);
    document.documentElement.style.setProperty("--layout-answer-gap", `${settings.answerGap}mm`);
    document.documentElement.style.setProperty("--layout-card-gap", `${Math.max(2, settings.problemSpacing / 2).toFixed(1)}mm`);
    document.documentElement.style.setProperty("--layout-visual-min", `${(24 * scale).toFixed(1)}mm`);
    document.documentElement.style.setProperty("--layout-visual-width", `${Math.round(150 * scale)}px`);
    document.documentElement.style.setProperty("--layout-blank-width", `${(28 * scale).toFixed(1)}mm`);
    document.documentElement.style.setProperty("--layout-blank-height", `${(8 * scale).toFixed(1)}mm`);

    const printPages = Array.from(document.querySelectorAll(".print-page"));
    printPages.forEach((page) => {
      page.classList.toggle("print-layout-hidden-answer", !settings.includeAnswers && isAnswerPage(page));
    });
    if (pageCount) {
      const visibleCount = printPages.filter((page) => !page.classList.contains("print-layout-hidden-answer")).length || printPages.length;
      pageCount.textContent = `${visibleCount}枚`;
    }
    updateWarning(settings);
    applying = false;
  }

  setupControls();
  applyLayout(loadSettings());

  const observer = new MutationObserver(() => {
    window.requestAnimationFrame(() => applyLayout());
  });
  observer.observe(pages, { childList: true });

  if (printButton) {
    const nativePrint = window.print.bind(window);
    window.print = () => {
      applyLayout();
      nativePrint();
    };
  }
})();
