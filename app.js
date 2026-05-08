const apps = Array.isArray(window.INTEGRATED_APPS) ? window.INTEGRATED_APPS : [];
const launcherConfig = window.LauncherConfig;
const storage = window.LauncherStorage;
const filters = window.LauncherFilters;
const filterUi = window.LauncherFilterUi;
const favoriteUi = window.LauncherFavoriteUi;
const bookmarks = window.LauncherBookmarks;
const bookmarkUi = window.LauncherBookmarkUi;
const cardUi = window.LauncherCardUi;
const panelUi = window.LauncherPanelUi;
const updates = window.LauncherUpdates;

const updateHistory = Array.isArray(window.UPDATE_HISTORY) ? window.UPDATE_HISTORY : [];
const elements = window.LauncherElements.get();

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

function updateFavoriteFilter() {
  favoriteUi.updateFilter(elements.favoriteFilter, showFavoritesOnly);
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
  return favoriteUi.makeButton(app, favorites.has(app.id), toggleFavorite);
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
  return cardUi.makeAppCard({
    app,
    gradeLabel: filters.getGradeLabel(app),
    favoriteButton: makeFavoriteButton(app),
    bookmarkButton: makeBookmarkButton(app),
  });
}

function renderGrades() {
  const buttons = launcherConfig.gradeOptions.map((option) =>
    filterUi.makeGradeButton(option, selectedGrade, (grade) => {
      selectedGrade = grade;
      render();
    })
  );
  elements.gradeFilters.replaceChildren(...buttons);
}

function renderCategories() {
  const buttons = filters.getCategories(apps).map((category) =>
    filterUi.makeCategoryButton(category, selectedCategory, (nextCategory) => {
      selectedCategory = nextCategory;
      render();
    })
  );
  elements.categoryFilters.replaceChildren(...buttons);
}

function renderBookmarkFolders() {
  if (!bookmarkFolders.some((folder) => folder.id === selectedBookmarkFolderId)) {
    selectedBookmarkFolderId = bookmarkFolders[0]?.id || "";
  }
  bookmarkUi.renderFolderSelect(elements.bookmarkFolderSelect, bookmarkFolders, selectedBookmarkFolderId);
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

function renderBookmarkChooser() {
  const app = apps.find((item) => item.id === chooserAppId);
  if (!app) {
    closeBookmarkChooser();
    return;
  }

  bookmarkUi.renderChooser({
    elements,
    app,
    bookmarkFolders,
    appId: chooserAppId,
    onSelectFolder: (folderId) => saveAppToBookmarkFolder(chooserAppId, folderId),
  });
}

function openBookmarkChooser(appId) {
  chooserAppId = appId;
  renderBookmarkChooser();
  bookmarkUi.openChooser(elements);
}

function closeBookmarkChooser() {
  chooserAppId = "";
  bookmarkUi.closeChooser(elements);
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
    ? launcherConfig.emptyMessages.grade3
    : launcherConfig.emptyMessages.default;
  elements.emptyState.hidden = visibleApps.length > 0;
}

function renderUpdates() {
  updates.render(updateHistory, elements.updateList);
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
  panelUi.toggle(elements.updatesPanel, elements.updatesToggle);
}

function toggleBookmarkPanel() {
  const shouldOpen = panelUi.toggle(elements.bookmarkPanel, elements.bookmarkPanelToggle);
  if (shouldOpen && selectedBookmarkFolderId) {
    showBookmarksOnly = true;
    render();
  }
}

function closeFloatingPanels(event) {
  const target = event.target;
  const clickedUpdates = panelUi.containsTarget(elements.updatesPanel, elements.updatesToggle, target);
  const clickedBookmarks = panelUi.containsTarget(elements.bookmarkPanel, elements.bookmarkPanelToggle, target);
  const clickedChooser = elements.bookmarkChooser.contains(target) || target.closest?.(".bookmark-button");

  if (!clickedUpdates && !elements.updatesPanel.hidden) {
    panelUi.close(elements.updatesPanel, elements.updatesToggle);
  }

  if (!clickedBookmarks && !elements.bookmarkPanel.hidden) {
    panelUi.close(elements.bookmarkPanel, elements.bookmarkPanelToggle);
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
