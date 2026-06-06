(function () {
  "use strict";

  const STORAGE_KEY = "kariyushi-saved-designs";
  const MAX_SAVED_DESIGNS = 30;
  const MAX_SHARE_PAYLOAD_BYTES = 120 * 1024;

  function uid() {
    return `design_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  }

  /* ── Save Design ── */
  function saveDesign(designData) {
    const designs = readAll();
    const { id, createdAt, ...rest } = designData || {};
    const entry = {
      id: uid(),
      createdAt: new Date().toISOString(),
      ...rest
    };
    designs.unshift(entry);
    if (designs.length > MAX_SAVED_DESIGNS) designs.length = MAX_SAVED_DESIGNS;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(designs));
    } catch (_error) {
      designs.pop();
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(designs));
      } catch (err2) {
        throw new Error("localStorageの容量制限に達したため、保存できません。不要なデータを削除してください。");
      }
    }
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
      const payload = JSON.stringify({ version: 1, ...designData });
      if (new Blob([payload]).size > MAX_SHARE_PAYLOAD_BYTES) {
        throw new Error("デザインデータのサイズが大きすぎるため、共有URLを作成できません。（上限120KB）");
      }
      const uint8 = new TextEncoder().encode(payload);
      const binString = Array.from(uint8, (x) => String.fromCharCode(x)).join("");
      const compressed = btoa(binString);
      const url = new URL(window.location.href.split("?")[0]);
      url.searchParams.set("design", compressed);
      return url.toString();
    } catch (e) {
      console.error("共有URL生成エラー:", e);
      throw e;
    }
  }

  /* ── Schema Validation ── */
  function validateDesignData(data) {
    if (!data || typeof data !== "object") return null;
    const validKeys = [
      "version", "palette", "pattern", "logo", "collar", 
      "button", "density", "scale", "assetId", "fabricJson"
    ];
    const validated = {};
    for (const key of validKeys) {
      if (data[key] !== undefined) {
        if (key === "fabricJson") {
          // fabricJsonは文字列またはオブジェクトであることを確認
          if (typeof data[key] !== "string" && typeof data[key] !== "object") continue;
        }
        validated[key] = data[key];
      }
    }
    return validated;
  }

  /* ── Load from URL ── */
  function loadFromUrl() {
    try {
      const params = new URLSearchParams(window.location.search);
      const data = params.get("design");
      if (!data) return null;
      
      const binString = atob(data);
      const uint8 = Uint8Array.from(binString, (c) => c.charCodeAt(0));
      const decodedPayload = new TextDecoder().decode(uint8);
      
      const parsed = JSON.parse(decodedPayload);
      return validateDesignData(parsed);
    } catch (e) {
      console.error("共有デザイン読み込みエラー:", e);
      return null;
    }
  }

  /* ── Copy to Clipboard ── */
  async function copyShareUrl(designData) {
    try {
      const url = generateShareUrl(designData);
      if (!url) return false;
      if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
        await navigator.clipboard.writeText(url);
        return true;
      }
      // フォールバック
      const input = document.createElement("input");
      input.value = url;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      return true;
    } catch (e) {
      console.error("クリップボード書き込みエラー:", e);
      return false;
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
