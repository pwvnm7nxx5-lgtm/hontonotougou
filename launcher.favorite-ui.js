window.LauncherFavoriteUi = (() => {
  function updateFilter(button, showFavoritesOnly) {
    button.setAttribute("aria-pressed", String(showFavoritesOnly));
  }

  function makeButton(app, isFavorite, onToggle) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "favorite-button";
    button.textContent = isFavorite ? "★" : "☆";
    button.setAttribute("aria-label", isFavorite ? `${app.title}をお気に入りから外す` : `${app.title}をお気に入りに追加`);
    button.setAttribute("aria-pressed", String(isFavorite));
    button.addEventListener("click", () => onToggle(app.id));
    return button;
  }

  return {
    makeButton,
    updateFilter,
  };
})();
