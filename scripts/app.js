import { config } from './config.js';
import { seed } from './mock-db.js';
import { KariyushiApiClient } from './api-client.js';
import * as renderers from './renderers/index.js';
import * as store from './design-store.js';
import { validateBrief, validateEdit } from './validation.js';

const api = new KariyushiApiClient(config, seed);

  const state = {
    catalog: null,
    session: null,
    brief: { ...config.defaultBrief },
    proposals: [],
    selectedId: "",
    edit: { ...config.defaultEdit },
    model: { ...config.defaultModel, environment: "atelier", focus: "full" },
    estimate: null,
    assetLimit: config.performance?.initialAssetLimit || 24
  };

  function selectedProposal() {
    return state.proposals.find((proposal) => proposal.id === state.selectedId) || state.proposals[0];
  }

  function getSelectedChoice(name) {
    return document.querySelector(`[data-name="${name}"] .choice.selected`)?.dataset.value;
  }

  function collectBrief() {
    return {
      scene: getSelectedChoice("scene") || "ホテル・店舗制服",
      mood: getSelectedChoice("mood") || "上品",
      palette: getSelectedChoice("palette") || "海風ブルー",
      motif: document.getElementById("motifSelect")?.value || "AIに任せる",
      quantity: Number(document.getElementById("quantityInput")?.value) || 50
    };
  }

  function syncLiveBrief() {
    const scene = getSelectedChoice("scene") || state.brief.scene;
    const mood = getSelectedChoice("mood") || state.brief.mood;
    const motif = document.getElementById("motifSelect")?.value || state.brief.motif;
    const sceneTarget = document.getElementById("liveScene");
    const moodTarget = document.getElementById("liveMood");
    const motifTarget = document.getElementById("liveMotif");
    if (sceneTarget) sceneTarget.textContent = scene;
    if (moodTarget) moodTarget.textContent = mood;
    if (motifTarget) motifTarget.textContent = motif;
  }

  function animateDynamicCards() {
    const items = document.querySelectorAll(".proposal-card, .asset-card");
    items.forEach((item, index) => {
      item.classList.remove("visible");
      item.classList.add("reveal");
      item.style.transitionDelay = `${Math.min(index * 45, 240)}ms`;
    });
    requestAnimationFrame(() => {
      items.forEach((item) => item.classList.add("visible"));
    });
  }

  function syncInputs() {
    const setVal = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.value = val;
    };
    setVal("editPalette", state.edit.palette);
    setVal("editDensity", state.edit.density);
    setVal("editScale", state.edit.scale);
    setVal("editCollar", state.edit.collar);
    setVal("editLogo", state.edit.logo);
    setVal("editButton", state.edit.button);
    setVal("heightInput", state.model.height);
    setVal("chestInput", state.model.chest);
    setVal("waistInput", state.model.waist);
    setVal("shoulderInput", state.model.shoulder);
    setVal("bodyType", state.model.body);
    setVal("sizeSelect", state.model.size);
  }

  function syncMannequinSegments() {
    document.querySelectorAll("#mannequinSegments .segment").forEach((button) => {
      button.classList.toggle("selected", button.dataset.mannequin === state.model.mannequin);
    });
  }

  function syncViewSegments() {
    const rotation = ((Number(state.model.rotation) || 0) % 360 + 360) % 360;
    const targets = { front: 0, side: 90, back: 180 };
    document.querySelectorAll("#viewSegments .segment").forEach((button) => {
      const target = targets[button.dataset.view];
      const diff = Math.abs(((rotation - target + 540) % 360) - 180);
      button.classList.toggle("selected", diff <= 20);
    });
  }

  function syncEnvironmentSegments() {
    document.querySelectorAll("#environmentSegments .segment").forEach((button) => {
      button.classList.toggle("selected", button.dataset.env === state.model.environment);
    });
  }

  function syncFocusSegments() {
    document.querySelectorAll("#focusSegments .segment").forEach((button) => {
      button.classList.toggle("selected", button.dataset.focus === state.model.focus);
    });
  }

  function syncBodyToggle() {
    const toggle = document.getElementById("toggleBodyBtn");
    if (!toggle) return;
    const visible = window.KariyushiThreeViewer?.isBodyVisible?.() ?? true;
    toggle.textContent = visible ? "BODY ON" : "BODY OFF";
    toggle.classList.toggle("is-off", !visible);
  }

  function updateAIAssistant() {
    const aiAdvice = document.getElementById("aiAdvice");
    if (!aiAdvice) return;
    const mood = state.brief.mood || "上品";
    const advices = {
      "上品": "「上品」な印象を与えるためには、柄の密度を少し抑えると、洗練されたスタイルになります。",
      "伝統的": "「伝統的」な雰囲気を強調するため、襟の形はレギュラーカラーがおすすめです。",
      "リゾート": "「リゾート」感を出すには、柄を大きめに配置し、開放的な開襟スタイルがマッチします。",
      "現代的": "「現代的」なスタイルには、ボタンの色を変えて引き締めるのがポイントです。",
      "大胆": "「大胆」なデザインは、ロゴ位置をあえて「なし」にして柄を主役にするのが効果的です。"
    };
    aiAdvice.textContent = advices[mood] || advices["上品"];
  }

  function renderAll() {
    const proposal = selectedProposal();
    if (!proposal || !state.catalog || !state.estimate) return;
    const fit = renderers.renderModel(
      document.getElementById("modelPreview"),
      proposal,
      state.catalog.palettes,
      state.edit,
      state.model,
      state.catalog.sizeTable,
      state.catalog.assets,
      config
    );
    renderers.renderHero({
      preview: document.getElementById("heroPreview"),
      swatches: document.getElementById("heroSwatches"),
      size: document.getElementById("heroSize"),
      fit: document.getElementById("heroFit")
    }, proposal, state.catalog.palettes, state.edit, fit, state.catalog.assets, config);
    renderers.renderProposals(
      document.getElementById("proposalList"),
      state.proposals,
      state.selectedId,
      state.catalog.palettes,
      config,
      state.catalog.assets
    );
    renderers.renderAssets(document.getElementById("assetGallery"), state.catalog.assets, config, state.edit.assetId, {
      limit: state.assetLimit,
      pageSize: config.performance?.assetPageSize || 24
    });
    renderers.renderEditor(document.getElementById("editorPreview"), proposal, state.catalog.palettes, state.edit, state.catalog.assets, config);
    renderers.renderFitReport(document.getElementById("fitReport"), state.model, fit);
    renderers.renderDesignNotes(document.getElementById("designNotes"), proposal, state.edit, state.catalog.assets);
    renderers.renderSpec(document.getElementById("specSheet"), proposal, state.brief, state.edit, fit, state.estimate);
    updateAIAssistant();
    syncLiveBrief();
    animateDynamicCards();
    window.KariyushiLatest3D = {
      proposal,
      palettes: state.catalog.palettes,
      edit: state.edit,
      model: state.model,
      fit,
      assets: state.catalog.assets,
      config
    };
    window.dispatchEvent(new CustomEvent("kariyushi:render3d", { detail: window.KariyushiLatest3D }));
    syncInputs();
    syncViewSegments();
    syncEnvironmentSegments();
    syncFocusSegments();
    syncMannequinSegments();
    syncBodyToggle();
  }

  function setBusy(busy, label = '提案を準備しています…') {
    document.body.classList.toggle('is-busy', busy);
    const submit = document.querySelector('#briefForm button[type="submit"]');
    const retry = document.getElementById('retryButton');
    if (submit) { submit.disabled = busy; submit.setAttribute('aria-busy', String(busy)); submit.dataset.originalLabel ||= submit.textContent; submit.textContent = busy ? label : submit.dataset.originalLabel; }
    if (retry) retry.hidden = busy;
    const status = document.getElementById('appStatus');
    if (status && busy) { status.textContent = label; status.className = 'status-banner is-loading'; }
  }
  function showAppError(error) {
    const message = error?.message || '処理に失敗しました。'; const status = document.getElementById('appStatus');
    if (status) { status.textContent = `${message} しばらく待ってから再試行してください。`; status.className = 'status-banner is-error'; }
    console.error(error);
  }
  async function generateDesigns() {
    setBusy(true);
    try {
      state.brief = validateBrief(collectBrief(), config.defaultBrief); state.session = await api.createDesignSession(state.brief);
      const result = await api.generateDesigns(state.session.id, state.brief); state.proposals = result.proposals;
      if (!state.proposals.length) throw new Error('提案を作成できませんでした。');
      state.selectedId = state.proposals[0].id; const first = state.proposals[0];
      state.edit = validateEdit({ ...state.edit, palette: first.palette, logo: first.logo, collar: first.collar, button: first.button, density: first.density, scale: first.scale, assetId: first.assetId }, config.defaultEdit);
      state.estimate = await api.createEstimate(state.brief.quantity); const fit = renderers.fitAnalysis(state.model, state.catalog.sizeTable); state.model.size = fit.recommendedSize; renderAll();
      const status = document.getElementById('appStatus'); if (status) { status.textContent = '3案の提案を更新しました。'; status.className = 'status-banner is-success'; }
    } catch (error) { showAppError(error); } finally { setBusy(false); }
  }

  function setupChoices() {
    document.querySelectorAll(".choice-grid").forEach((grid) => {
      grid.addEventListener("click", (event) => {
        const button = event.target.closest(".choice");
        if (!button) return;
        grid.querySelectorAll(".choice").forEach((item) => item.classList.remove("selected"));
        button.classList.add("selected");
        syncLiveBrief();
      });
    });
  }

  function setupCatalogControls() {
    const el = document.getElementById("editPalette");
    if (!el) return;
    el.innerHTML = Object.keys(state.catalog.palettes)
      .map((key) => `<option value="${renderers.esc(key)}">${renderers.esc(key)}</option>`)
      .join("");
  }

  function setupEditor() {
    const inputMap = {
      editPalette: "palette",
      editDensity: "density",
      editScale: "scale",
      editCollar: "collar",
      editLogo: "logo",
      editButton: "button"
    };
    Object.entries(inputMap).forEach(([id, key]) => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener("input", (event) => {
          state.edit[key] = event.target.value;
          renderAll();
        });
      }
    });
    document.getElementById("assetGallery")?.addEventListener("click", (event) => {
      const button = event.target.closest(".asset-card");
      const loadMore = event.target.closest(".load-more-assets");
      if (loadMore) {
        state.assetLimit = Number(loadMore.dataset.nextLimit) || state.assetLimit + 24;
        renderAll();
        return;
      }
      if (!button) return;
      state.edit.assetId = button.dataset.id;
      renderAll();
      document.getElementById("editor")?.scrollIntoView({ behavior: "smooth" });
    });
  }

  function setupModel() {
    document.getElementById("viewSegments")?.addEventListener("click", (event) => {
      const button = event.target.closest(".segment");
      if (!button) return;
      state.model.view = button.dataset.view;
      state.model.rotation = { front: 0, side: 90, back: 180 }[button.dataset.view] || 0;
      renderAll();
    });

    document.getElementById("mannequinSegments")?.addEventListener("click", (event) => {
      const button = event.target.closest(".segment");
      if (!button) return;
      state.model.mannequin = button.dataset.mannequin;
      renderAll();
    });

    document.getElementById("environmentSegments")?.addEventListener("click", (event) => {
      const button = event.target.closest(".segment");
      if (!button) return;
      state.model.environment = button.dataset.env || "atelier";
      renderAll();
    });

    document.getElementById("focusSegments")?.addEventListener("click", (event) => {
      const button = event.target.closest(".segment");
      if (!button) return;
      state.model.focus = button.dataset.focus || "full";
      renderAll();
    });

    // BODY ON/OFF
    document.getElementById("toggleBodyBtn")?.addEventListener("click", () => {
      if (window.KariyushiThreeViewer) {
        window.KariyushiThreeViewer.toggleBody();
        syncBodyToggle();
      }
    });

    const modelPreview = document.getElementById("modelPreview");
    if (modelPreview) {
      let dragStartX = 0;
      let dragStartRotation = 0;
      let dragging = false;

      modelPreview.addEventListener("pointerdown", (event) => {
        if (!event.target.closest(".model-svg")) return;
        dragging = true;
        dragStartX = event.clientX;
        dragStartRotation = Number(state.model.rotation) || 0;
        modelPreview.setPointerCapture(event.pointerId);
        modelPreview.classList.add("dragging");
      });

      modelPreview.addEventListener("pointermove", (event) => {
        if (!dragging) return;
        const delta = event.clientX - dragStartX;
        state.model.rotation = ((dragStartRotation + delta * .75) % 360 + 360) % 360;
        state.model.view = state.model.rotation > 90 && state.model.rotation < 270 ? "back" : "front";
        renderAll();
      });

      function endDrag(event) {
        if (!dragging) return;
        dragging = false;
        if (modelPreview.hasPointerCapture(event.pointerId)) {
          modelPreview.releasePointerCapture(event.pointerId);
        }
        modelPreview.classList.remove("dragging");
      }

      modelPreview.addEventListener("pointerup", endDrag);
      modelPreview.addEventListener("pointercancel", endDrag);
    }

    const numberMap = {
      heightInput: "height",
      chestInput: "chest",
      waistInput: "waist",
      shoulderInput: "shoulder"
    };
    Object.entries(numberMap).forEach(([id, key]) => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener("input", (event) => {
          state.model[key] = Number(event.target.value);
          const fit = renderers.fitAnalysis(state.model, state.catalog.sizeTable);
          state.model.size = fit.recommendedSize;
          renderAll();
        });
      }
    });
    document.getElementById("bodyType")?.addEventListener("change", (event) => {
      state.model.body = event.target.value;
      renderAll();
    });
    document.getElementById("sizeSelect")?.addEventListener("change", (event) => {
      state.model.size = event.target.value;
      renderAll();
    });
  }

  function setupForms() {
    document.getElementById("briefForm")?.addEventListener("submit", async (event) => {
      event.preventDefault();
      await generateDesigns();
      document.getElementById("proposals")?.scrollIntoView({ behavior: "smooth" });
    });
    document.getElementById('regenerate')?.addEventListener('click', generateDesigns);
    document.getElementById('retryButton')?.addEventListener('click', generateDesigns);
    document.getElementById("motifSelect")?.addEventListener("input", () => {
      syncLiveBrief();
      updateAIAssistant();
    });
    document.getElementById("proposalList")?.addEventListener("click", (event) => {
      const button = event.target.closest(".select-proposal");
      if (!button) return;
      state.selectedId = button.dataset.id;
      const proposal = selectedProposal();
      if (proposal) {
        state.edit = {
          ...state.edit,
          palette: proposal.palette,
          logo: proposal.logo,
          collar: proposal.collar,
          button: proposal.button,
          density: proposal.density,
          scale: proposal.scale,
          assetId: proposal.assetId
        };
      }
      renderAll();
      document.getElementById("editor")?.scrollIntoView({ behavior: "smooth" });
    });
    document.getElementById("contactForm")?.addEventListener("submit", async (event) => {
      event.preventDefault();
      const form = event.currentTarget;
      const status = document.getElementById("contactStatus");
      const cleanText = (value, max = 500) => String(value || "").trim().replace(/\s+/g, " ").slice(0, max);
      try {
        const inputName = form.querySelector('input[name="company"]');
        const inputEmail = form.querySelector('input[name="email"]');
        const textareaMsg = form.querySelector('textarea[name="message"]');
        
        const nameVal = inputName ? cleanText(inputName.value, 80) : "";
        const emailVal = inputEmail ? cleanText(inputEmail.value, 160).toLowerCase() : "";
        const noteVal = textareaMsg ? cleanText(textareaMsg.value, 800) : "";
        
        const inquiry = await api.saveInquiry({
          sessionId: state.session?.id,
          proposal: selectedProposal(),
          brief: state.brief,
          edit: state.edit,
          model: state.model,
          estimate: state.estimate,
          customer: {
            name: nameVal,
            email: emailVal,
            note: noteVal
          }
        });
        if (status) status.textContent = `保存しました。管理用ID: ${inquiry.id}`;
      } catch (error) {
        if (status) status.textContent = error.message || "保存に失敗しました。";
      }
    });
  }

  function setupSiteMotion() {
    const progress = document.createElement("div");
    progress.className = "scroll-progress";
    document.body.prepend(progress);

    const sections = [...document.querySelectorAll("main section[id]")];
    const navLinks = [...document.querySelectorAll(".nav a[href^='#']")];
    const revealItems = [...document.querySelectorAll(".section-head, fieldset, .proposal-card, .asset-card, .control-panel, .preview-shell, .model-preview, .spec-sheet, .how-to-card")];
    revealItems.forEach((item, index) => {
      item.classList.add("reveal");
      item.style.transitionDelay = `${Math.min(index * 35, 220)}ms`;
    });
    requestAnimationFrame(() => {
      revealItems.forEach((item) => item.classList.add("visible"));
    });

    function updateScrollState() {
      const height = document.documentElement.scrollHeight - window.innerHeight;
      progress.style.transform = `scaleX(${height > 0 ? window.scrollY / height : 0})`;
      const current = sections.findLast((section) => section.getBoundingClientRect().top <= 120);
      navLinks.forEach((link) => link.classList.toggle("active", current && link.getAttribute("href") === `#${current.id}`));
    }

    window.addEventListener("scroll", updateScrollState, { passive: true });
    updateScrollState();
  }

  function setupDesignStudio() {
    const editor = window.KariyushiFabricEditor;
    const store = window.KariyushiDesignStore;
    if (!editor || !store) return;

    editor.init("fabricCanvas", (_dataUrl) => {
      /* 将来: 3Dテクスチャに反映 */
    });

    // Logo upload
    document.getElementById("logoUpload")?.addEventListener("change", async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      try {
        await editor.addLogo(file);
        showStudioStatus("ロゴ画像を追加しました");
      } catch (error) {
        showStudioStatus(error.message || "ロゴ画像を追加できませんでした");
      } finally {
        e.target.value = "";
      }
    });

    // Text add
    document.getElementById("addTextBtn")?.addEventListener("click", () => {
      const text = document.getElementById("studioText").value || "OKINAWA";
      const font = document.getElementById("studioFont").value;
      const color = document.getElementById("studioTextColor").value;
      const stroke = document.getElementById("studioStrokeColor").value;
      const strokeWidth = Number(document.getElementById("studioStrokeWidth").value);
      editor.addText(text, { font, color, stroke, strokeWidth });
    });

    // Delete selected
    document.getElementById("deleteSelectedBtn")?.addEventListener("click", () => editor.deleteSelected());

    // Clear all
    document.getElementById("clearCanvasBtn")?.addEventListener("click", () => editor.clearAll());

    // Export PNG
    document.getElementById("exportPngBtn")?.addEventListener("click", () => {
      editor.exportPNG(`kariyushi-${Date.now()}.png`);
      showStudioStatus("PNG画像を書き出しました");
    });

    // Save design
    document.getElementById("saveDesignBtn")?.addEventListener("click", () => {
      const designData = {
        fabricJson: editor.toJSON(),
        brief: state.brief,
        edit: state.edit,
        model: state.model
      };
      const saved = store.saveDesign(designData);
      showStudioStatus(`保存しました（ID: ${saved.id}）`);
    });

    // Share URL
    document.getElementById("shareUrlBtn")?.addEventListener("click", async () => {
      const designData = { schema: 'kariyushi-share', version: store.SHARE_SCHEMA_VERSION, fabricJson: editor.toJSON(), brief: state.brief, edit: state.edit, model: state.model };
      const ok = await store.copyShareUrl(designData);
      showStudioStatus(ok ? "共有URLをクリップボードにコピーしました" : "コピーに失敗しました");
    });

    // Load from URL if available
    const fromUrl = store.loadFromUrl();
    if (fromUrl?.fabricJson) {
      editor.fromJSON(fromUrl.fabricJson);
    }
  }

  let studioStatusTimer = null;
  function showStudioStatus(msg) {
    const el = document.getElementById("studioStatus");
    if (!el) return;
    el.textContent = msg;
    if (studioStatusTimer) {
      clearTimeout(studioStatusTimer);
    }
    studioStatusTimer = setTimeout(() => {
      el.textContent = "";
      studioStatusTimer = null;
    }, 4000);
  }

  async function init() {
    state.catalog = await api.getCatalog();
    const shared = store.loadFromUrl();
    if (shared) { state.brief = validateBrief(shared.brief, config.defaultBrief); state.edit = validateEdit(shared.edit, config.defaultEdit); if (shared.model) state.model = { ...state.model, ...shared.model }; }
    setupChoices();
    setupCatalogControls();
    setupEditor();
    setupModel();
    setupForms();
    setupSiteMotion();
    setupDesignStudio();
    syncBodyToggle();
    await generateDesigns();
  }

  init().catch((err) => {
    console.error("アプリケーションの初期化に失敗しました:", err);
    const status = document.getElementById("contactStatus") || document.getElementById("studioStatus");
    if (status) {
      status.textContent = "アプリ初期化エラー: " + err.message;
    }
  });
