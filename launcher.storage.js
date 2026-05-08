window.LauncherStorage = (() => {
  const favoriteStorageKey = "special-support-app-favorites";
  const bookmarkStorageKey = "special-support-app-bookmark-folders-v1";

  function loadFavorites() {
    try {
      const saved = JSON.parse(localStorage.getItem(favoriteStorageKey) || "[]");
      return new Set(Array.isArray(saved) ? saved : []);
    } catch {
      return new Set();
    }
  }

  function saveFavorites(favorites) {
    try {
      localStorage.setItem(favoriteStorageKey, JSON.stringify([...favorites]));
    } catch {}
  }

  function normalizeBookmarkFolder(folder) {
    if (!folder || !folder.id || !folder.name) {
      return null;
    }
    return {
      id: String(folder.id),
      name: String(folder.name),
      appIds: Array.isArray(folder.appIds) ? [...new Set(folder.appIds.map(String))] : [],
    };
  }

  function loadBookmarkFolders() {
    try {
      const saved = JSON.parse(localStorage.getItem(bookmarkStorageKey) || "{}");
      return Array.isArray(saved.folders) ? saved.folders.map(normalizeBookmarkFolder).filter(Boolean) : [];
    } catch {
      return [];
    }
  }

  function saveBookmarkFolders(bookmarkFolders) {
    try {
      localStorage.setItem(bookmarkStorageKey, JSON.stringify({ folders: bookmarkFolders }));
    } catch {}
  }

  return {
    loadFavorites,
    saveFavorites,
    loadBookmarkFolders,
    saveBookmarkFolders,
  };
})();
