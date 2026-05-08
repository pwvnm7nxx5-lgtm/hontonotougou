window.LauncherElements = {
  get() {
    return {
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
  },
};
