const apps = Array.isArray(window.INTEGRATED_APPS) ? window.INTEGRATED_APPS : [];

const gradeOptions = [
  { value: "all", label: "全学年" },
  { value: "1", label: "1年" },
  { value: "2", label: "2年" },
  { value: "3", label: "3年" },
];

const favoriteStorageKey = "special-support-app-favorites";

const elements = {
  appCount: document.querySelector("#appCount"),
  appGrid: document.querySelector("#appGrid"),
  emptyState: document.querySelector("#emptyState"),
  searchInput: document.querySelector("#searchInput"),
  gradeFilters: document.querySelector("#gradeFilters"),
  categoryFilters: document.querySelector("#categoryFilters"),
  favoriteFilter: document.querySelector("#favoriteFilter"),
};

let selectedGrade = "all";
let selectedCategory = "all";
let showFavoritesOnly = false;
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

function getAppGrades(app) {
  if (Array.isArray(app.grades) && app.grades.length) {
    return app.grades.map(String);
  }
  const text = [app.title, ...(Array.isArray(app.tags) ? app.tags : [])].join(" ");
  if (text.includes("1年")) return ["1"];
  if (text.includes("2年")) return ["2"];
  if (text.includes("3年")) return ["3"];
  return ["all"];
}

function getGradeLabel(app) {
  const grades = getAppGrades(app);
  if (grades.includes("all")) return "全学年";
  return grades.map((grade) => `${grade}年`).join("・");
}

function getCategories() {
  return ["all", ...new Set(apps.map((app) => app.category).filter(Boolean))];
}

function matchesGrade(app) {
  if (selectedGrade === "all") {
    return true;
  }
  const grades = getAppGrades(app);
  return grades.includes(selectedGrade);
}

function matchesApp(app, query) {
  if (!query) {
    return true;
  }

  const searchable = [
    app.title,
    app.description,
    app.category,
    getGradeLabel(app),
    ...(Array.isArray(app.tags) ? app.tags : []),
  ].join(" ");

  return normalizeText(searchable).includes(query);
}

function makeGradeButton(option) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "filter-button grade-button";
  button.dataset.grade = option.value;
  button.textContent = option.label;
  button.setAttribute("aria-pressed", String(option.value === selectedGrade));
  button.addEventListener("click", () => {
    selectedGrade = option.value;
    render();
  });
  return button;
}

function makeCategoryButton(category) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "filter-button";
  button.dataset.category = category;
  button.textContent = category === "all" ? "すべて" : category;
  button.setAttribute("aria-pressed", String(category === selectedCategory));
  button.addEventListener("click", () => {
    selectedCategory = category;
    render();
  });
  return button;
}

function updateFavoriteFilter() {
  elements.favoriteFilter.setAttribute("aria-pressed", String(showFavoritesOnly));
}

function toggleFavorite(appId) {
  if (favorites.has(appId)) {
    favorites.delete(appId);
  } else {
    favorites.add(appId);
  }
  saveFavorites();
  renderApps();
}

function makeFavoriteButton(app) {
  const button = document.createElement("button");
  const isFavorite = favorites.has(app.id);
  button.type = "button";
  button.className = "favorite-button";
  button.textContent = isFavorite ? "★" : "☆";
  button.setAttribute("aria-label", isFavorite ? `${app.title}をお気に入りから外す` : `${app.title}をお気に入りに追加`);
  button.setAttribute("aria-pressed", String(isFavorite));
  button.addEventListener("click", () => toggleFavorite(app.id));
  return button;
}

function makeAppCard(app) {
  const article = document.createElement("article");
  article.className = "app-card";
  article.style.setProperty("--accent", app.accent || "#2f6f8f");

  const mark = document.createElement("div");
  mark.className = "app-mark";
  mark.setAttribute("aria-hidden", "true");
  mark.textContent = app.title.slice(0, 1);

  const body = document.createElement("div");
  body.className = "app-card-body";

  const meta = document.createElement("div");
  meta.className = "meta-row";

  const grade = document.createElement("span");
  grade.className = "grade";
  grade.textContent = getGradeLabel(app);
  meta.append(grade);

  const category = document.createElement("span");
  category.className = "category";
  category.textContent = app.category || "その他";
  meta.append(category);

  const status = document.createElement("span");
  status.className = "ready";
  status.textContent = app.status === "ready" ? "利用可" : app.status || "";
  if (status.textContent) {
    meta.append(status);
  }

  const title = document.createElement("h2");
  title.textContent = app.title;

  const description = document.createElement("p");
  description.textContent = app.description;

  const tags = document.createElement("div");
  tags.className = "tag-row";
  (app.tags || []).forEach((tag) => {
    const span = document.createElement("span");
    span.textContent = tag;
    tags.append(span);
  });

  const link = document.createElement("a");
  link.className = "launch-link";
  link.href = app.href;
  link.textContent = app.actionLabel || "開く";

  body.append(meta, title, description, tags, link);
  article.append(makeFavoriteButton(app), mark, body);
  return article;
}

function getVisibleApps() {
  const query = normalizeText(elements.searchInput.value);
  return apps.filter((app) => {
    const categoryMatches = selectedCategory === "all" || app.category === selectedCategory;
    const favoriteMatches = !showFavoritesOnly || favorites.has(app.id);
    return matchesGrade(app) && categoryMatches && favoriteMatches && matchesApp(app, query);
  });
}

function renderGrades() {
  elements.gradeFilters.replaceChildren(...gradeOptions.map(makeGradeButton));
}

function renderCategories() {
  elements.categoryFilters.replaceChildren(...getCategories().map(makeCategoryButton));
}

function renderApps() {
  const visibleApps = getVisibleApps();
  elements.appCount.textContent = String(visibleApps.length);
  elements.appGrid.replaceChildren(...visibleApps.map(makeAppCard));
  elements.emptyState.hidden = visibleApps.length > 0;
}

function render() {
  renderGrades();
  renderCategories();
  updateFavoriteFilter();
  renderApps();
}

elements.searchInput.addEventListener("input", renderApps);
elements.favoriteFilter.addEventListener("click", () => {
  showFavoritesOnly = !showFavoritesOnly;
  render();
});

render();
