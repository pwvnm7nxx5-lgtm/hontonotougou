window.LauncherFilterUi = (() => {
  function makeGradeButton(option, selectedGrade, onSelectGrade) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "filter-button grade-button";
    button.dataset.grade = option.value;
    button.textContent = option.label;
    button.setAttribute("aria-pressed", String(option.value === selectedGrade));
    button.addEventListener("click", () => onSelectGrade(option.value));
    return button;
  }

  function makeCategoryButton(category, selectedCategory, onSelectCategory) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "filter-button";
    button.dataset.category = category;
    button.textContent = category === "all" ? "すべて" : category;
    button.setAttribute("aria-pressed", String(category === selectedCategory));
    button.addEventListener("click", () => onSelectCategory(category));
    return button;
  }

  return {
    makeCategoryButton,
    makeGradeButton,
  };
})();
