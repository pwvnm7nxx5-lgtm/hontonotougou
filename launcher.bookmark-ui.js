window.LauncherBookmarkUi = (() => {
  function renderFolderSelect(select, bookmarkFolders, selectedFolderId) {
    const options = [
      new Option("フォルダなし", ""),
      ...bookmarkFolders.map((folder) => {
        const count = folder.appIds.length;
        return new Option(`${folder.name} (${count})`, folder.id);
      }),
    ];
    select.replaceChildren(...options);
    select.value = selectedFolderId;
  }

  function makeChooserFolderButton(folder, appId, onSelectFolder) {
    const button = document.createElement("button");
    const containsApp = folder.appIds.includes(appId);
    button.type = "button";
    button.className = "chooser-folder-button";
    button.setAttribute("aria-pressed", String(containsApp));
    button.textContent = containsApp ? `${folder.name} から外す` : `${folder.name} に保存`;
    button.addEventListener("click", () => onSelectFolder(folder.id));
    return button;
  }

  function makeEmptyChooserMessage() {
    const empty = document.createElement("p");
    empty.className = "chooser-empty";
    empty.textContent = "まだフォルダがありません。下で名前を付けて作成できます。";
    return empty;
  }

  function renderChooser({ elements, app, bookmarkFolders, appId, onSelectFolder }) {
    elements.bookmarkChooserTitle.textContent = "保存先を選ぶ";
    elements.bookmarkChooserApp.textContent = app.title;

    if (bookmarkFolders.length) {
      elements.bookmarkChooserFolders.replaceChildren(
        ...bookmarkFolders.map((folder) => makeChooserFolderButton(folder, appId, onSelectFolder))
      );
    } else {
      elements.bookmarkChooserFolders.replaceChildren(makeEmptyChooserMessage());
    }
  }

  function openChooser(elements) {
    elements.bookmarkChooser.hidden = false;
    elements.bookmarkChooserName.value = "";
    elements.bookmarkChooserName.placeholder = "新しいフォルダ名";
  }

  function closeChooser(elements) {
    elements.bookmarkChooser.hidden = true;
  }

  return {
    closeChooser,
    openChooser,
    renderChooser,
    renderFolderSelect,
  };
})();
