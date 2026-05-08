const apps = Array.isArray(window.INTEGRATED_APPS) ? window.INTEGRATED_APPS : [];
const storage = window.LauncherStorage;
const filters = window.LauncherFilters;
const bookmarks = window.LauncherBookmarks;

const gradeOptions = [
  { value: "all", label: "全学年" },
  { value: "1", label: "1年" },
  { value: "2", label: "2年" },
  { value: "3", label: "3年" },
];

const updateHistory = Array.isArray(window.UPDATE_HISTORY) ? window.UPDATE_HISTORY : [];

const elements = {
  appCount: document.querySelector("#appCount"),
  appGrid: document.querySelector("#appGrid"),
  emptyState: document.querySelector("#emptyState"),
  searchInput: document.querySelector("#searchInput"),
  gradeFilters: document.querySelector("#gradeFilters"),
  categoryFilters: document.querySelector("#categoryFilters"),
  favoriteFilter: document.querySelector("#favoriteFilter"),
  bookmarkPanelToggle: document.querySelector("#bookmarkPanelToggle"),
  bookmarkPanel: document.querySelector("#bookmarkPanel"),
  bookmarkChooser: document.querySelector("#bookmarkChooser"),
  bookmarkChooserTitle: document.querySelector("#bookmarkChooserTitle"),
  bookmarkChooserApp: document.querySelector("#bookmarkChooserApp"),
  bookmarkChooserFolders: document.querySelector("#bookmarkChooserFolders"),
  bookmarkChooserName: document.querySelector("#bookmarkChooserName"),
  bookmarkChooserCreate: document.querySelector("#bookmarkChooserCreate"),
  bookmarkChooserClose: document.querySelector("#bookmarkChooserClose"),
  bookmarkFolderSelect: document.querySelector("#bookmarkFolderSelect"),
  bookmarkFolderName: document.querySelector("#bookmarkFolderName"),
  createBookmarkFolder: document.querySelector("#createBookmarkFolder"),
  deleteBookmarkFolder: document.querySelector("#deleteBookmarkFolder"),
  updatesToggle: document.querySelector("#updatesToggle"),
  updatesPanel: document.querySelector("#updatesPanel"),
  updateList: document.querySelector("#updateList"),
};

let selectedGrade = "all";
let selectedCategory = "all";
let showFavoritesOnly = false;
let showBookmarksOnly = false;
let favorites = storage.loadFavorites();
let bookmarkFolders = storage.loadBookmarkFolders();
let selectedBookmarkFolderId = bookmarkFolders[0]?.id || "";
let chooserAppId = "";

function makeBookmarkFolderId() {
  return bookmarks.makeFolderId();
}

function getSelectedBookmarkFolder() {
  return bookmarks.getSelectedFolder(bookmarkFolders, selectedBookmarkFolderId);
}

function appIsBookmarked(appId) {
  return bookmarks.appIsBookmarked(bookmarkFolders, selectedBookmarkFolderId, appId);
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

function updateBookmarkFilter() {
  elements.bookmarkPanelToggle.setAttribute("aria-pressed", String(showBookmarksOnly));
  elements.deleteBookmarkFolder.disabled = !getSelectedBookmarkFolder();
}

function toggleFavorite(appId) {
  if (favorites.has(appId)) {
    favorites.delete(appId);
  } else {
    favorites.add(appId);
  }
  storage.saveFavorites(favorites);
  renderApps();
}

function toggleBookmark(appId) {
  openBookmarkChooser(appId);
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

function makeBookmarkButton(app) {
  const button = document.createElement("button");
  const isBookmarked = appIsBookmarked(app.id);
  const selectedFolder = getSelectedBookmarkFolder();
  button.type = "button";
  button.className = "bookmark-button";
  button.setAttribute(
    "aria-label",
    isBookmarked
      ? `${app.title}を${selectedFolder?.name || "ブックマーク"}から外す`
      : `${app.title}を${selectedFolder?.name || "新しいフォルダ"}に保存`
  );
  button.setAttribute("aria-pressed", String(isBookmarked));
  button.addEventListener("click", (event) => {
    event.stopPropagation();
    toggleBookmark(app.id);
  });

  const icon = document.createElement("span");
  icon.className = "bookmark-icon";
  icon.setAttribute("aria-hidden", "true");
  button.append(icon);
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
  grade.textContent = filters.getGradeLabel(app);
  meta.append(grade);

  const category = document.createElement("span");
  category.className = "category";
  category.textContent = app.category || "その他";
  meta.append(category);

  const status = document.createElement("span");
  status.className = app.status === "ready" ? "ready" : "ready dev-status";
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
  const cardActions = document.createElement("div");
  cardActions.className = "card-actions";
  cardActions.append(makeFavoriteButton(app), makeBookmarkButton(app));

  article.append(cardActions, mark, body);
  return article;
}

function renderGrades() {
  elements.gradeFilters.replaceChildren(...gradeOptions.map(makeGradeButton));
}

function renderCategories() {
  elements.categoryFilters.replaceChildren(...filters.getCategories(apps).map(makeCategoryButton));
}

function renderBookmarkFolders() {
  if (!bookmarkFolders.some((folder) => folder.id === selectedBookmarkFolderId)) {
    selectedBookmarkFolderId = bookmarkFolders[0]?.id || "";
  }

  const options = [
    new Option("フォルダなし", ""),
    ...bookmarkFolders.map((folder) => {
      const count = folder.appIds.length;
      return new Option(`${folder.name} (${count})`, folder.id);
    }),
  ];
  elements.bookmarkFolderSelect.replaceChildren(...options);
  elements.bookmarkFolderSelect.value = selectedBookmarkFolderId;
}

function saveAppToBookmarkFolder(appId, folderId) {
  const folder = bookmarks.toggleAppInFolder(bookmarkFolders, folderId, appId);
  if (!folder) {
    return;
  }
  selectedBookmarkFolderId = folder.id;
  storage.saveBookmarkFolders(bookmarkFolders);
  closeBookmarkChooser();
  render();
}

function makeChooserFolderButton(folder) {
  const button = document.createElement("button");
  const containsApp = folder.appIds.includes(chooserAppId);
  button.type = "button";
  button.className = "chooser-folder-button";
  button.setAttribute("aria-pressed", String(containsApp));
  button.textContent = containsApp ? `${folder.name} から外す` : `${folder.name} に保存`;
  button.addEventListener("click", () => saveAppToBookmarkFolder(chooserAppId, folder.id));
  return button;
}

function renderBookmarkChooser() {
  const app = apps.find((item) => item.id === chooserAppId);
  if (!app) {
    closeBookmarkChooser();
    return;
  }

  elements.bookmarkChooserTitle.textContent = "保存先を選ぶ";
  elements.bookmarkChooserApp.textContent = app.title;

  if (bookmarkFolders.length) {
    elements.bookmarkChooserFolders.replaceChildren(...bookmarkFolders.map(makeChooserFolderButton));
  } else {
    const empty = document.createElement("p");
    empty.className = "chooser-empty";
    empty.textContent = "まだフォルダがありません。下で名前を付けて作成できます。";
    elements.bookmarkChooserFolders.replaceChildren(empty);
  }
}

function openBookmarkChooser(appId) {
  chooserAppId = appId;
  renderBookmarkChooser();
  elements.bookmarkChooser.hidden = false;
  elements.bookmarkChooserName.value = "";
  elements.bookmarkChooserName.placeholder = "新しいフォルダ名";
}

function closeBookmarkChooser() {
  chooserAppId = "";
  elements.bookmarkChooser.hidden = true;
}

function createFolderFromChooser() {
  const name = elements.bookmarkChooserName.value.trim();
  if (!name) {
    elements.bookmarkChooserName.focus();
    elements.bookmarkChooserName.placeholder = "フォルダ名を入力";
    return;
  }
  const folder = {
    id: makeBookmarkFolderId(),
    name,
    appIds: chooserAppId ? [chooserAppId] : [],
  };
  bookmarkFolders.push(folder);
  selectedBookmarkFolderId = folder.id;
  storage.saveBookmarkFolders(bookmarkFolders);
  closeBookmarkChooser();
  render();
}

function renderApps() {
  const visibleApps = filters.getVisibleApps({
    apps,
    query: elements.searchInput.value,
    selectedGrade,
    selectedCategory,
    showFavoritesOnly,
    showBookmarksOnly,
    favorites,
    selectedFolder: getSelectedBookmarkFolder(),
  });
  elements.appCount.textContent = String(visibleApps.length);
  elements.appGrid.replaceChildren(...visibleApps.map(makeAppCard));
  elements.emptyState.textContent = selectedGrade === "3"
    ? "3年生のプリント作成アプリは準備中です。外部教材は右上の「外部教材を探す」から確認できます。"
    : "該当するアプリはありません。";
  elements.emptyState.hidden = visibleApps.length > 0;
}

function renderUpdates() {
  const items = updateHistory.map((item) => {
    const li = document.createElement("li");
    li.className = "update-item";

    const date = document.createElement("span");
    date.className = "update-date";
    date.textContent = item.date;

    const title = document.createElement("span");
    title.className = "update-title";
    title.textContent = item.title;

    li.append(date, title);
    if (item.isNew) {
      const badge = document.createElement("span");
      badge.className = "new-badge";
      badge.textContent = "NEW";
      li.append(badge);
    }
    return li;
  });
  elements.updateList.replaceChildren(...items);
}

function render() {
  renderGrades();
  renderCategories();
  renderBookmarkFolders();
  updateFavoriteFilter();
  updateBookmarkFilter();
  renderApps();
}

function createBookmarkFolder() {
  const name = elements.bookmarkFolderName.value.trim();
  if (!name) {
    elements.bookmarkFolderName.focus();
    elements.bookmarkFolderName.placeholder = "フォルダ名を入力";
    return;
  }
  const folder = {
    id: makeBookmarkFolderId(),
    name,
    appIds: [],
  };
  bookmarkFolders.push(folder);
  selectedBookmarkFolderId = folder.id;
  showBookmarksOnly = false;
  elements.bookmarkFolderName.value = "";
  storage.saveBookmarkFolders(bookmarkFolders);
  render();
}

function deleteSelectedBookmarkFolder() {
  const folder = getSelectedBookmarkFolder();
  if (!folder) {
    return;
  }
  const confirmed = window.confirm(`「${folder.name}」フォルダを削除しますか？`);
  if (!confirmed) {
    return;
  }
  bookmarkFolders = bookmarkFolders.filter((item) => item.id !== folder.id);
  selectedBookmarkFolderId = bookmarkFolders[0]?.id || "";
  showBookmarksOnly = false;
  storage.saveBookmarkFolders(bookmarkFolders);
  render();
}

function toggleUpdatesPanel() {
  const shouldOpen = elements.updatesPanel.hidden;
  elements.updatesPanel.hidden = !shouldOpen;
  elements.updatesToggle.setAttribute("aria-expanded", String(shouldOpen));
}

function toggleBookmarkPanel() {
  const shouldOpen = elements.bookmarkPanel.hidden;
  elements.bookmarkPanel.hidden = !shouldOpen;
  elements.bookmarkPanelToggle.setAttribute("aria-expanded", String(shouldOpen));
  if (shouldOpen && selectedBookmarkFolderId) {
    showBookmarksOnly = true;
    render();
  }
}

function closeFloatingPanels(event) {
  const target = event.target;
  const clickedUpdates = elements.updatesPanel.contains(target) || elements.updatesToggle.contains(target);
  const clickedBookmarks = elements.bookmarkPanel.contains(target) || elements.bookmarkPanelToggle.contains(target);
  const clickedChooser = elements.bookmarkChooser.contains(target) || target.closest?.(".bookmark-button");

  if (!clickedUpdates && !elements.updatesPanel.hidden) {
    elements.updatesPanel.hidden = true;
    elements.updatesToggle.setAttribute("aria-expanded", "false");
  }

  if (!clickedBookmarks && !elements.bookmarkPanel.hidden) {
    elements.bookmarkPanel.hidden = true;
    elements.bookmarkPanelToggle.setAttribute("aria-expanded", "false");
  }

  if (!clickedChooser && !elements.bookmarkChooser.hidden) {
    closeBookmarkChooser();
  }
}

elements.searchInput.addEventListener("input", renderApps);
elements.favoriteFilter.addEventListener("click", () => {
  showFavoritesOnly = !showFavoritesOnly;
  render();
});
elements.bookmarkFolderSelect.addEventListener("change", () => {
  selectedBookmarkFolderId = elements.bookmarkFolderSelect.value;
  showBookmarksOnly = Boolean(selectedBookmarkFolderId);
  render();
});
elements.createBookmarkFolder.addEventListener("click", createBookmarkFolder);
elements.deleteBookmarkFolder.addEventListener("click", deleteSelectedBookmarkFolder);
elements.bookmarkFolderName.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    createBookmarkFolder();
  }
});
elements.updatesToggle.addEventListener("click", toggleUpdatesPanel);
elements.bookmarkPanelToggle.addEventListener("click", toggleBookmarkPanel);
elements.bookmarkChooserClose.addEventListener("click", closeBookmarkChooser);
elements.bookmarkChooserCreate.addEventListener("click", createFolderFromChooser);
elements.bookmarkChooserName.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    createFolderFromChooser();
  }
});
document.addEventListener("click", closeFloatingPanels);

renderUpdates();
render();
