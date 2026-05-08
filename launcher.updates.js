window.LauncherUpdates = (() => {
  function makeUpdateItem(item) {
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
  }

  function render(updateHistory, updateList) {
    updateList.replaceChildren(...updateHistory.map(makeUpdateItem));
  }

  return {
    render,
  };
})();
