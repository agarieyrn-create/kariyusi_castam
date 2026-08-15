(function () {
  "use strict";

  const wrap = document.getElementById("tryonCanvasWrap");
  if (!wrap) return;

  const state = {
    model: "male",
    pattern: "stripe",
    size: "M",
    scale: 100,
    baseColor: "#123047",
    viewZoom: 1,
    logo: null,
    lastConfiguration: null,
    fallbackReason: "",
    targetRotation: 0,
    currentRotation: 0,
    spinning: false,
    dragging: false,
    dragX: 0,
    dragRotation: 0,
    sceneReady: false,
    animationFrameId: 0,
  };

  const labels = {
    model: { male: "男性マネキン", female: "女性マネキン" },
    pattern: {
      stripe: "紺ストライプ",
      botanical: "淡緑ボタニカル",
      wave: "青波柄",
      logo: "ロゴ追加",
    },
  };

  const viewMap = { front: 0, side: 78, back: 180 };
  const sizeScale = { S: 0.94, M: 1, L: 1.07, LL: 1.14 };

  let scene;
  let shirt;
  let mannequin;
  let statusElement;

  const validPatterns = new Set(["stripe", "botanical", "wave", "logo"]);
  const validSizes = new Set(["S", "M", "L", "LL"]);

  function normalizePatternId(value) {
    const id = String(value || "").toLowerCase();
    if (validPatterns.has(id)) return id;
    if (/botan|floral|flower|hibiscus|leaf/.test(id)) return "botanical";
    if (/wave|ocean|sea/.test(id)) return "wave";
    if (/logo|brand/.test(id)) return "logo";
    if (/stripe|line/.test(id)) return "stripe";
    return state.pattern;
  }

  function normalizeColor(value) {
    const color = String(value || "").trim();
    return /^#(?:[0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(color)
      ? color
      : state.baseColor;
  }

  function normalizeLogo(logo, companyName) {
    if (!logo || logo.enabled === false || logo.position === "none") return null;
    const position = String(logo.position || "leftChest");
    return {
      imageUrl: safeImageUrl(logo.imageUrl),
      text: String(companyName?.text || companyName || "LOGO").slice(0, 24),
      position,
      scale: Math.min(2.5, Math.max(0.4, Number(logo.scale) || 1)),
      rotation: Math.min(180, Math.max(-180, Number(logo.rotation) || 0)),
    };
  }

  function safeImageUrl(value) {
    const source = String(value || "").trim();
    if (!source) return "";
    if (/^data:image\/(?:png|jpe?g|webp);base64,/i.test(source)) return source;
    try {
      const url = new URL(source, window.location.href);
      return ["http:", "https:", "blob:"].includes(url.protocol) ? url.href : "";
    } catch (_error) {
      return "";
    }
  }

  function initScene() {
    wrap.innerHTML = [
      '<div class="css-tryon-scene" id="cssTryonScene" role="img" aria-label="3Dマネキン試着プレビュー">',
      '  <div class="css-tryon-floor"></div>',
      '  <div class="css-tryon-model" id="cssTryonModel">',
      '    <div class="tryon-head"></div>',
      '    <div class="tryon-neck"></div>',
      '    <div class="tryon-arm tryon-arm-left"></div>',
      '    <div class="tryon-arm tryon-arm-right"></div>',
      '    <div class="tryon-hand tryon-hand-left"></div>',
      '    <div class="tryon-hand tryon-hand-right"></div>',
      '    <div class="tryon-shirt" id="cssTryonShirt"><span class="shirt-logo">LOGO</span><span class="shirt-placket"></span></div>',
      '    <div class="tryon-sleeve tryon-sleeve-left"></div>',
      '    <div class="tryon-sleeve tryon-sleeve-right"></div>',
      '    <div class="tryon-pants"></div>',
      '    <div class="tryon-leg tryon-leg-left"></div>',
      '    <div class="tryon-leg tryon-leg-right"></div>',
      '    <div class="tryon-shoe tryon-shoe-left"></div>',
      '    <div class="tryon-shoe tryon-shoe-right"></div>',
      '  </div>',
      '</div>',
      '<p class="tryon-fallback-status" role="status" aria-live="polite" hidden></p>',
    ].join("");
    scene = document.getElementById("cssTryonScene");
    mannequin = document.getElementById("cssTryonModel");
    shirt = document.getElementById("cssTryonShirt");
    statusElement = wrap.querySelector(".tryon-fallback-status");
    wrap.dataset.previewMode = "css";
    bindControls();
    bindMobileCtaGuard();
    state.sceneReady = true;
    updateScene();
    startAnimationLoop();
  }

  function bindMobileCtaGuard() {
    const mobileCta = document.querySelector(".mobile-cta");
    const tryon = document.getElementById("tryon");
    if (!mobileCta || !tryon) return;
    const update = () => {
      const rect = tryon.getBoundingClientRect();
      const visible = rect.top < window.innerHeight - 120 && rect.bottom > 120;
      mobileCta.classList.toggle("is-hidden", visible);
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
  }

  function updateScene() {
    if (!mannequin || !shirt) return;
    mannequin.dataset.model = state.model;
    shirt.dataset.pattern = state.pattern;
    shirt.style.setProperty("--pattern-scale", `${state.scale / 100}`);
    shirt.style.backgroundColor = state.baseColor;
    mannequin.querySelectorAll(".tryon-sleeve").forEach((sleeve) => {
      sleeve.style.backgroundColor = state.baseColor;
    });
    mannequin.style.setProperty("--size-scale", sizeScale[state.size] || 1);
    updateLogo();
    updateSummary();
  }

  function updateLogo() {
    const logoElement = shirt?.querySelector(".shirt-logo");
    if (!logoElement) return;
    const logo = state.logo;
    logoElement.replaceChildren();
    logoElement.removeAttribute("style");
    logoElement.hidden = !logo;
    if (!logo) return;

    const positions = {
      leftChest: { left: "24px", top: "58px" },
      rightChest: { right: "24px", top: "58px" },
      back: { left: "50%", top: "54px" },
      leftSleeve: { left: "-22px", top: "72px" },
      rightSleeve: { right: "-22px", top: "72px" },
    };
    Object.assign(logoElement.style, positions[logo.position] || positions.leftChest);
    logoElement.style.transform = `translateX(${logo.position === "back" ? "-50%" : "0"}) scale(${logo.scale}) rotate(${logo.rotation}deg)`;
    logoElement.dataset.position = logo.position;

    if (logo.imageUrl) {
      const image = document.createElement("img");
      image.src = logo.imageUrl;
      image.alt = logo.text || "Logo";
      image.decoding = "async";
      image.style.cssText = "display:block;max-width:48px;max-height:32px;object-fit:contain;";
      logoElement.appendChild(image);
    } else {
      logoElement.textContent = logo.text || "LOGO";
    }
  }

  function updateSummary() {
    const pattern = document.getElementById("tryonSummaryPattern");
    const model = document.getElementById("tryonSummaryModel");
    const size = document.getElementById("tryonSummarySize");
    if (pattern) pattern.textContent = labels.pattern[state.pattern] || state.pattern;
    if (model) model.textContent = labels.model[state.model] || state.model;
    if (size) size.textContent = `${state.size}サイズ`;
  }

  function setActive(selector, value, attr) {
    document.querySelectorAll(selector).forEach((button) => {
      button.classList.toggle("is-active", button.getAttribute(attr) === value);
    });
  }

  function setPattern(pattern) {
    state.pattern = normalizePatternId(pattern || "stripe");
    if (state.pattern === "logo" && !state.logo) {
      state.logo = normalizeLogo({ position: "leftChest" }, "LOGO");
    }
    setActive("[data-tryon-pattern]", state.pattern, "data-tryon-pattern");
    updateScene();
  }

  function bindControls() {
    scene?.addEventListener("pointerdown", (event) => {
      state.dragging = true;
      state.dragX = event.clientX;
      state.dragRotation = state.targetRotation;
      scene.setPointerCapture?.(event.pointerId);
      scene.style.cursor = "grabbing";
    });

    scene?.addEventListener("pointermove", (event) => {
      if (!state.dragging) return;
      state.spinning = false;
      state.targetRotation = state.dragRotation + (event.clientX - state.dragX) * 0.45;
    });

    const endDrag = (event) => {
      state.dragging = false;
      scene.style.cursor = "grab";
      if (scene.hasPointerCapture?.(event.pointerId)) scene.releasePointerCapture(event.pointerId);
    };
    scene?.addEventListener("pointerup", endDrag);
    scene?.addEventListener("pointercancel", endDrag);

    scene?.addEventListener("wheel", (event) => {
      event.preventDefault();
      state.viewZoom = Math.min(1.35, Math.max(0.8, state.viewZoom - event.deltaY * 0.001));
    }, { passive: false });

    document.querySelectorAll("[data-tryon-model]").forEach((button) => {
      button.addEventListener("click", () => {
        state.model = button.dataset.tryonModel;
        setActive("[data-tryon-model]", state.model, "data-tryon-model");
        updateScene();
      });
    });

    document.querySelectorAll("[data-tryon-pattern]").forEach((button) => {
      button.addEventListener("click", () => setPattern(button.dataset.tryonPattern));
    });

    document.querySelectorAll("[data-tryon-view]").forEach((button) => {
      button.addEventListener("click", () => {
        state.spinning = false;
        state.targetRotation = viewMap[button.dataset.tryonView] || 0;
        setActive("[data-tryon-view]", button.dataset.tryonView, "data-tryon-view");
        document.querySelector("[data-tryon-spin]")?.classList.remove("is-active");
      });
    });

    document.querySelector("[data-tryon-spin]")?.addEventListener("click", (event) => {
      state.spinning = !state.spinning;
      event.currentTarget.classList.toggle("is-active", state.spinning);
    });

    document.getElementById("tryonSize")?.addEventListener("change", (event) => {
      state.size = event.target.value;
      updateScene();
    });

    document.getElementById("tryonScale")?.addEventListener("input", (event) => {
      state.scale = Number(event.target.value);
      updateScene();
    });

    document.querySelectorAll("[data-tryon-jump]").forEach((button) => {
      button.addEventListener("click", () => {
        setPattern(button.dataset.pattern);
        document.getElementById("tryon")?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });
  }

  function tick() {
    state.animationFrameId = requestAnimationFrame(tick);
    if (!mannequin) return;
    if (state.spinning) state.targetRotation += 0.9;
    state.currentRotation += (state.targetRotation - state.currentRotation) * 0.12;
    mannequin.style.transform = [
      "translate(-50%, -50%)",
      `scale(${(sizeScale[state.size] || 1) * state.viewZoom})`,
      `rotateY(${state.currentRotation}deg)`,
    ].join(" ");
  }

  function startAnimationLoop() {
    if (state.animationFrameId || document.hidden) return;
    state.animationFrameId = requestAnimationFrame(tick);
  }

  function stopAnimationLoop() {
    if (!state.animationFrameId) return;
    cancelAnimationFrame(state.animationFrameId);
    state.animationFrameId = 0;
  }

  function applyConfiguration(configuration = {}) {
    state.lastConfiguration = configuration;
    state.model = /^(?:female|women|womens)$/i.test(String(configuration.gender || ""))
      ? "female"
      : /^(?:male|men|mens|unisex)$/i.test(String(configuration.gender || ""))
        ? "male"
        : state.model;
    state.pattern = normalizePatternId(configuration.patternId);
    state.baseColor = normalizeColor(configuration.baseColor);
    const normalizedSize = String(configuration.size || "").toUpperCase();
    state.size = normalizedSize === "XL" ? "LL" : validSizes.has(normalizedSize) ? normalizedSize : state.size;
    if (Object.prototype.hasOwnProperty.call(configuration, "logo")) {
      state.logo = normalizeLogo(configuration.logo, configuration.companyName);
    }

    setActive("[data-tryon-model]", state.model, "data-tryon-model");
    setActive("[data-tryon-pattern]", state.pattern, "data-tryon-pattern");
    const sizeSelect = document.getElementById("tryonSize");
    if (sizeSelect) sizeSelect.value = state.size;
    updateScene();
    return getPublicState();
  }

  function showFallback(message) {
    state.fallbackReason = String(message || "3D preview is unavailable.");
    wrap.dataset.previewMode = "css-fallback";
    if (statusElement) {
      statusElement.hidden = false;
      statusElement.textContent = "3Dプレビューを表示できないため、2Dプレビューに切り替えました。デザイン選択と見積もりは続けられます。";
      statusElement.style.cssText = "position:absolute;left:16px;right:16px;bottom:16px;z-index:5;margin:0;padding:10px 12px;border-radius:8px;background:rgba(255,255,255,.94);color:#4b5563;font-size:13px;box-shadow:0 4px 16px rgba(0,0,0,.12);";
    }
  }

  function fallbackSvgDataUrl() {
    const color = normalizeColor(state.baseColor);
    const patternMarkup = {
      stripe: '<path d="M260 260v330M320 240v370M380 240v370M440 260v330" stroke="#fff" stroke-opacity=".72" stroke-width="14"/>',
      botanical: '<g fill="#fff" fill-opacity=".62"><circle cx="300" cy="340" r="34"/><circle cx="420" cy="430" r="42"/><path d="M330 500q70-100 145-40q-72 76-145 40Z"/></g>',
      wave: '<g fill="none" stroke="#f7f1e8" stroke-width="18" stroke-opacity=".72"><path d="M245 340q55-60 110 0t110 0"/><path d="M245 430q55-60 110 0t110 0"/><path d="M245 520q55-60 110 0t110 0"/></g>',
      logo: '<path d="M250 300h230M250 390h230M250 480h230" stroke="#fff" stroke-opacity=".25" stroke-width="10"/>',
    }[state.pattern] || "";
    const logoMarkup = state.logo
      ? '<rect x="385" y="330" width="72" height="44" rx="6" fill="#fff"/><text x="421" y="358" text-anchor="middle" font-family="sans-serif" font-size="13" fill="#172326">LOGO</text>'
      : "";
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="900" viewBox="0 0 800 900"><rect width="800" height="900" fill="#e8efe9"/><ellipse cx="400" cy="810" rx="190" ry="36" fill="#173034" opacity=".12"/><circle cx="400" cy="145" r="66" fill="#d1c0a7"/><path d="M330 215h140l125 96-67 85-58-43v290q-70 24-140 0V353l-58 43-67-85Z" fill="${color}"/><path d="M335 220l65 75 65-75" fill="#fff" opacity=".86"/>${patternMarkup}${logoMarkup}<path d="M350 645v128M450 645v128" stroke="#b9a887" stroke-width="52" stroke-linecap="round"/><text x="400" y="855" text-anchor="middle" font-family="sans-serif" font-size="24" fill="#35505a">Kariyushi preview</text></svg>`;
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  }

  function persistPreview(dataUrl) {
    try {
      window.KariyushiStore?.setPreviewImageUrl?.(dataUrl);
    } catch (error) {
      console.warn("[TryOn] Preview image could not be stored.", error);
    }
  }

  async function capturePreview() {
    try {
      const threeCapture = window.KariyushiThreeViewer?.capturePreview?.();
      const dataUrl = await Promise.resolve(threeCapture);
      if (typeof dataUrl === "string" && dataUrl.startsWith("data:image/")) {
        persistPreview(dataUrl);
        return { dataUrl, source: "three" };
      }
    } catch (error) {
      showFallback(error?.message);
    }
    const dataUrl = fallbackSvgDataUrl();
    persistPreview(dataUrl);
    return { dataUrl, source: "css-fallback" };
  }

  function getPublicState() {
    return {
      model: state.model,
      pattern: state.pattern,
      size: state.size,
      scale: state.scale,
      baseColor: state.baseColor,
      viewZoom: state.viewZoom,
      logo: state.logo ? { ...state.logo } : null,
      fallbackReason: state.fallbackReason,
      sceneReady: state.sceneReady,
    };
  }

  window.addEventListener("kariyushi:configurationchange", (event) => {
    applyConfiguration(event.detail?.configuration || {});
  });

  window.addEventListener("kariyushi:viewererror", (event) => {
    showFallback(event.detail?.error?.message || event.detail?.message);
  });

  window.addEventListener("kariyushi:previewcapturerequest", async (event) => {
    const requestId = event.detail?.requestId;
    try {
      const result = await capturePreview();
      window.dispatchEvent(new CustomEvent("kariyushi:previewcapture", {
        detail: { requestId, ...result },
      }));
    } catch (error) {
      window.dispatchEvent(new CustomEvent("kariyushi:previewcapture", {
        detail: { requestId, error: error?.message || String(error), source: "none" },
      }));
    }
  });

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stopAnimationLoop();
    else startAnimationLoop();
  });

  window.KariyushiTryOn = {
    getState: getPublicState,
    setPattern,
    applyConfiguration,
    capturePreview,
    setModel(model) {
      state.model = model === "female" ? "female" : "male";
      setActive("[data-tryon-model]", state.model, "data-tryon-model");
      updateScene();
    },
    setView(view) {
      state.targetRotation = viewMap[view] || 0;
    },
    setZoom(value) {
      state.viewZoom = Math.min(1.35, Math.max(0.8, Number(value) || 1));
    },
    showFallback,
    isReady: () => state.sceneReady,
  };

  initScene();
  try {
    const initialConfiguration = window.KariyushiStore?.getState?.().configuration;
    if (initialConfiguration) applyConfiguration(initialConfiguration);
  } catch (error) {
    console.warn("[TryOn] Initial configuration could not be loaded.", error);
  }
})();
