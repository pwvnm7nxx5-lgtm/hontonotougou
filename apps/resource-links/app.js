const sites = Array.isArray(window.RESOURCE_LINKS) ? window.RESOURCE_LINKS : [];
const prints = Array.isArray(window.PRINT_RESOURCES) ? window.PRINT_RESOURCES : [];

const favoriteStorageKey = "special-support-resource-favorites-v2";

const elements = {
  searchInput: document.querySelector("#searchInput"),
  printMode: document.querySelector("#printMode"),
  siteMode: document.querySelector("#siteMode"),
  gradeFilter: document.querySelector("#gradeFilter"),
  subjectFilter: document.querySelector("#subjectFilter"),
  unitFilter: document.querySelector("#unitFilter"),
  favoriteOnly: document.querySelector("#favoriteOnly"),
  resultCount: document.querySelector("#resultCount"),
  siteGrid: document.querySelector("#siteGrid"),
  emptyState: document.querySelector("#emptyState"),
  modeTitle: document.querySelector("#modeTitle"),
  modeDescription: document.querySelector("#modeDescription"),
  siteCardTemplate: document.querySelector("#siteCardTemplate"),
  printCardTemplate: document.querySelector("#printCardTemplate"),
};

let mode = "prints";
let favorites = loadFavorites();

function normalizeText(value) {
  return String(value || "").trim().toLowerCase();
}

function loadFavorites() {
  try {
    const saved = JSON.parse(localStorage.getItem(favoriteStorageKey) || "[]");
    return new Set(Array.isArray(saved) ? saved : []);
  } catch {
    return new Set();
  }
}

function saveFavorites() {
  try {
    localStorage.setItem(favoriteStorageKey, JSON.stringify([...favorites]));
  } catch {}
}

function gradeLabel(grade) {
  if (grade === "pre") return "入学前";
  return `${grade}年`;
}

function getAllSubjects() {
  return [...new Set([
    ...sites.flatMap((site) => site.subjects || []),
    ...prints.map((print) => print.subject).filter(Boolean),
  ])].sort((a, b) => a.localeCompare(b, "ja"));
}

function getAllUnits() {
  return [...new Set(prints.map((print) => print.unit).filter(Boolean))].sort((a, b) => a.localeCompare(b, "ja"));
}

function fillSubjectOptions() {
  const options = getAllSubjects().map((subject) => {
    const option = document.createElement("option");
    option.value = subject;
    option.textContent = subject;
    return option;
  });
  elements.subjectFilter.append(...options);
}

function fillUnitOptions() {
  const options = getAllUnits().map((unit) => {
    const option = document.createElement("option");
    option.value = unit;
    option.textContent = unit;
    return option;
  });
  elements.unitFilter.append(...options);
}

function makeMeta(site) {
  const meta = document.createDocumentFragment();

  (site.subjects || []).slice(0, 3).forEach((subject) => {
    const span = document.createElement("span");
    span.className = "subject";
    span.textContent = subject;
    meta.append(span);
  });

  const grades = document.createElement("span");
  grades.className = "grade";
  grades.textContent = (site.grades || []).includes("pre")
    ? "入学前・小学生"
    : `小学${(site.grades || []).map(gradeLabel).join("・")}`;
  meta.append(grades);

  return meta;
}

function makePrintMeta(print) {
  const meta = document.createDocumentFragment();

  const subject = document.createElement("span");
  subject.className = "subject";
  subject.textContent = print.subject || "その他";
  meta.append(subject);

  const unit = document.createElement("span");
  unit.className = "unit";
  unit.textContent = print.unit || "単元";
  meta.append(unit);

  const grades = document.createElement("span");
  grades.className = "grade";
  grades.textContent = `小学${(print.grades || []).map(gradeLabel).join("・")}`;
  meta.append(grades);

  return meta;
}

function searchableText(site) {
  return [
    site.title,
    site.description,
    site.note,
    ...(site.subjects || []),
    ...(site.grades || []).map(gradeLabel),
    ...(site.tags || []),
  ].join(" ");
}

function searchablePrintText(print) {
  return [
    print.title,
    print.description,
    print.siteTitle,
    print.subject,
    print.unit,
    ...(print.grades || []).map(gradeLabel),
    ...(print.tags || []),
  ].join(" ");
}

function matchesSite(site) {
  const query = normalizeText(elements.searchInput.value);
  const selectedGrade = elements.gradeFilter.value;
  const selectedSubject = elements.subjectFilter.value;
  const favoriteMatches = !elements.favoriteOnly.checked || favorites.has(site.id);
  const gradeMatches = selectedGrade === "all" || (site.grades || []).includes(selectedGrade);
  const subjectMatches = selectedSubject === "all" || (site.subjects || []).includes(selectedSubject);
  const queryMatches = !query || normalizeText(searchableText(site)).includes(query);
  return favoriteMatches && gradeMatches && subjectMatches && queryMatches;
}

function matchesPrint(print) {
  const query = normalizeText(elements.searchInput.value);
  const selectedGrade = elements.gradeFilter.value;
  const selectedSubject = elements.subjectFilter.value;
  const selectedUnit = elements.unitFilter.value;
  const favoriteKey = favoriteId("print", print.id);
  const favoriteMatches = !elements.favoriteOnly.checked || favorites.has(favoriteKey);
  const gradeMatches = selectedGrade === "all" || (print.grades || []).includes(selectedGrade);
  const subjectMatches = selectedSubject === "all" || print.subject === selectedSubject;
  const unitMatches = selectedUnit === "all" || print.unit === selectedUnit;
  const queryMatches = !query || normalizeText(searchablePrintText(print)).includes(query);
  return favoriteMatches && gradeMatches && subjectMatches && unitMatches && queryMatches;
}

function favoriteId(type, id) {
  return `${type}:${id}`;
}

function toggleFavorite(key) {
  if (favorites.has(key)) {
    favorites.delete(key);
  } else {
    favorites.add(key);
  }
  saveFavorites();
  render();
}

function renderSite(site) {
  const card = elements.siteCardTemplate.content.firstElementChild.cloneNode(true);
  const key = favoriteId("site", site.id);
  const isFavorite = favorites.has(key);
  const favoriteButton = card.querySelector(".favorite-button");
  favoriteButton.textContent = isFavorite ? "★" : "☆";
  favoriteButton.setAttribute("aria-pressed", String(isFavorite));
  favoriteButton.setAttribute("aria-label", isFavorite ? `${site.title}をお気に入りから外す` : `${site.title}をお気に入りに追加`);
  favoriteButton.addEventListener("click", () => toggleFavorite(key));

  card.querySelector(".site-mark").textContent = site.title.slice(0, 1);
  card.querySelector(".meta-row").append(makeMeta(site));
  card.querySelector("h3").textContent = site.title;
  card.querySelector(".description").textContent = site.description;
  card.querySelector(".note").textContent = site.note || "外部サイトへ移動します。";

  const tags = card.querySelector(".tag-row");
  (site.tags || []).forEach((tag) => {
    const span = document.createElement("span");
    span.textContent = tag;
    tags.append(span);
  });

  const link = card.querySelector(".open-link");
  link.href = site.url;
  link.setAttribute("aria-label", `${site.title}を外部サイトで開く`);

  return card;
}

function renderPrint(print) {
  const card = elements.printCardTemplate.content.firstElementChild.cloneNode(true);
  const key = favoriteId("print", print.id);
  const isFavorite = favorites.has(key);
  const favoriteButton = card.querySelector(".favorite-button");
  favoriteButton.textContent = isFavorite ? "★" : "☆";
  favoriteButton.setAttribute("aria-pressed", String(isFavorite));
  favoriteButton.setAttribute("aria-label", isFavorite ? `${print.title}をお気に入りから外す` : `${print.title}をお気に入りに追加`);
  favoriteButton.addEventListener("click", () => toggleFavorite(key));

  card.querySelector(".site-mark").textContent = print.subject ? print.subject.slice(0, 1) : "教";
  card.querySelector(".meta-row").append(makePrintMeta(print));
  card.querySelector("h3").textContent = print.title;
  card.querySelector(".description").textContent = print.description;
  card.querySelector(".note").textContent = `掲載元: ${print.siteTitle}。外部サイト側で該当プリントを確認して印刷します。`;

  const tags = card.querySelector(".tag-row");
  [print.siteTitle, ...(print.tags || [])].forEach((tag) => {
    const span = document.createElement("span");
    span.textContent = tag;
    tags.append(span);
  });

  const link = card.querySelector(".open-link");
  link.href = print.url;
  link.setAttribute("aria-label", `${print.title}を${print.siteTitle}で開く`);

  return card;
}

function updateModeControls() {
  const printMode = mode === "prints";
  elements.printMode.setAttribute("aria-pressed", String(printMode));
  elements.siteMode.setAttribute("aria-pressed", String(!printMode));
  elements.unitFilter.disabled = !printMode;
  elements.modeTitle.textContent = printMode ? "プリントをすばやく探す" : "プリントサイトをすばやく探す";
  elements.modeDescription.textContent = printMode
    ? "外部サイト内のプリント候補を、学年・教科・単元・キーワードで絞り込めます。"
    : "よく使う外部教材サイトを、学年・教科・キーワードで絞り込めます。";
}

function render() {
  updateModeControls();
  const visibleItems = mode === "prints" ? prints.filter(matchesPrint) : sites.filter(matchesSite);
  elements.resultCount.textContent = String(visibleItems.length);
  elements.siteGrid.replaceChildren(...visibleItems.map((item) => mode === "prints" ? renderPrint(item) : renderSite(item)));
  elements.emptyState.hidden = visibleItems.length > 0;
}

function bindEvents() {
  elements.printMode.addEventListener("click", () => {
    mode = "prints";
    render();
  });
  elements.siteMode.addEventListener("click", () => {
    mode = "sites";
    render();
  });
  [elements.searchInput, elements.gradeFilter, elements.subjectFilter, elements.unitFilter, elements.favoriteOnly].forEach((control) => {
    control.addEventListener("input", render);
    control.addEventListener("change", render);
  });
}

fillSubjectOptions();
fillUnitOptions();
bindEvents();
render();
