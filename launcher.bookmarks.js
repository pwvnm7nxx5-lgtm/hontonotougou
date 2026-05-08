window.LauncherBookmarks = (() => {
  function makeFolderId() {
    return `folder-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
  }

  function getSelectedFolder(bookmarkFolders, selectedFolderId) {
    return bookmarkFolders.find((folder) => folder.id === selectedFolderId) || null;
  }

  function appIsBookmarked(bookmarkFolders, selectedFolderId, appId) {
    const selectedFolder = getSelectedFolder(bookmarkFolders, selectedFolderId);
    if (selectedFolder) {
      return selectedFolder.appIds.includes(appId);
    }
    return bookmarkFolders.some((folder) => folder.appIds.includes(appId));
  }

  function toggleAppInFolder(bookmarkFolders, folderId, appId) {
    const folder = bookmarkFolders.find((item) => item.id === folderId);
    if (!folder) {
      return null;
    }
    if (folder.appIds.includes(appId)) {
      folder.appIds = folder.appIds.filter((id) => id !== appId);
    } else {
      folder.appIds.push(appId);
    }
    return folder;
  }

  return {
    appIsBookmarked,
    getSelectedFolder,
    makeFolderId,
    toggleAppInFolder,
  };
})();
