window.LauncherPanelUi = (() => {
  function toggle(panel, toggleButton) {
    const shouldOpen = panel.hidden;
    panel.hidden = !shouldOpen;
    toggleButton.setAttribute("aria-expanded", String(shouldOpen));
    return shouldOpen;
  }

  function close(panel, toggleButton) {
    panel.hidden = true;
    toggleButton.setAttribute("aria-expanded", "false");
  }

  function containsTarget(panel, toggleButton, target) {
    return panel.contains(target) || toggleButton.contains(target);
  }

  return {
    close,
    containsTarget,
    toggle,
  };
})();
