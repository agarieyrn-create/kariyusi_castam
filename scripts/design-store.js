(function () {
  "use strict";

  const STORAGE_KEY = "kariyushi-saved-designs";

  function uid() {
    return `design_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  }

  /* ── Save Design ── */
  function saveDesign(designData) {
    const designs = readAll();
    const entry = {
      id: uid(),
      createdAt: new Date().toISOString(),
      ...designData
    };
    designs.unshift(entry);
    if (designs.length > 50) designs.length = 50;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(designs));
    return entry;
  }

  /* ── Read All ── */
  function readAll() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch (_) {
      return [];
    }
  }

  /* ── Load by ID ── */
  function loadDesign(id) {
    return readAll().find((d) => d.id === id) || null;
  }

  /* ── Generate Share URL ── */
  function generateShareUrl(designData) {
    try {
      const compressed = btoa(unescape(encodeURIComponent(JSON.stringify(designData))));
      const url = new URL(window.location.href.split("?")[0]);
      url.searchParams.set("design", compressed);
      return url.toString();
    } catch (_) {
      return null;
    }
  }

  /* ── Load from URL ── */
  function loadFromUrl() {
    try {
      const params = new URLSearchParams(window.location.search);
      const data = params.get("design");
      if (!data) return null;
      return JSON.parse(decodeURIComponent(escape(atob(data))));
    } catch (_) {
      return null;
    }
  }

  /* ── Copy to Clipboard ── */
  async function copyShareUrl(designData) {
    const url = generateShareUrl(designData);
    if (!url) return false;
    try {
      await navigator.clipboard.writeText(url);
      return true;
    } catch (_) {
      const input = document.createElement("input");
      input.value = url;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      return true;
    }
  }

  window.KariyushiDesignStore = {
    saveDesign,
    readAll,
    loadDesign,
    generateShareUrl,
    loadFromUrl,
    copyShareUrl
  };
})();
