(function () {
  "use strict";

  const config = window.KariyushiConfig;
  const api = new window.KariyushiApiClient(config, window.KariyushiSeed);
  const renderers = window.KariyushiRenderers;

  const state = {
    catalog: null,
    session: null,
    brief: { ...config.defaultBrief },
    proposals: [],
    selectedId: "",
    edit: { ...config.defaultEdit },
    model: { ...config.defaultModel },
    estimate: null
  };

  function selectedProposal() {
    return state.proposals.find((proposal) => proposal.id === state.selectedId) || state.proposals[0];
  }

  function getSelectedChoice(name) {
    return document.querySelector(`[data-name="${name}"] .choice.selected`)?.dataset.value;
  }

  function collectBrief() {
    return {
      scene: getSelectedChoice("scene"),
      mood: getSelectedChoice("mood"),
      palette: getSelectedChoice("palette"),
      motif: document.getElementById("motifSelect").value,
      quantity: Number(document.getElementById("quantityInput").value) || 50
    };
  }

  function syncInputs() {
    document.getElementById("editPalette").value = state.edit.palette;
    document.getElementById("editDensity").value = state.edit.density;
    document.getElementById("editScale").value = state.edit.scale;
    document.getElementById("editCollar").value = state.edit.collar;
    document.getElementById("editLogo").value = state.edit.logo;
    document.getElementById("editButton").value = state.edit.button;
    document.getElementById("heightInput").value = state.model.height;
    document.getElementById("chestInput").value = state.model.chest;
    document.getElementById("waistInput").value = state.model.waist;
    document.getElementById("shoulderInput").value = state.model.shoulder;
    document.getElementById("bodyType").value = state.model.body;
    document.getElementById("sizeSelect").value = state.model.size;
  }

  function syncModelSegments() {
    const rotation = ((Number(state.model.rotation) || 0) % 360 + 360) % 360;
    const targets = { front: 0, side: 90, back: 180 };
    document.querySelectorAll(".segment").forEach((button) => {
      const target = targets[button.dataset.view];
      const diff = Math.abs(((rotation - target + 540) % 360) - 180);
      button.classList.toggle("selected", diff <= 12);
    });
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
    renderers.renderAssets(document.getElementById("assetGallery"), state.catalog.assets, config, state.edit.assetId);
    renderers.renderEditor(document.getElementById("editorPreview"), proposal, state.catalog.palettes, state.edit, state.catalog.assets, config);
    renderers.renderFitReport(document.getElementById("fitReport"), state.model, fit);
    renderers.renderDesignNotes(document.getElementById("designNotes"), proposal, state.edit, state.catalog.assets);
    renderers.renderSpec(document.getElementById("specSheet"), proposal, state.brief, state.edit, fit, state.estimate);
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
    syncModelSegments();
  }

  async function generateDesigns() {
    state.brief = collectBrief();
    state.session = await api.createDesignSession(state.brief);
    const result = await api.generateDesigns(state.session.id, state.brief);
    state.proposals = result.proposals;
    state.selectedId = state.proposals[0].id;
    const first = state.proposals[0];
    state.edit = {
      ...state.edit,
      palette: first.palette,
      logo: first.logo,
      collar: first.collar,
      button: first.button,
      density: first.density,
      scale: first.scale,
      assetId: first.assetId
    };
    state.estimate = await api.createEstimate(state.brief.quantity);
    const fit = renderers.fitAnalysis(state.model, state.catalog.sizeTable);
    state.model.size = fit.recommendedSize;
    renderAll();
  }

  function setupChoices() {
    document.querySelectorAll(".choice-grid").forEach((grid) => {
      grid.addEventListener("click", (event) => {
        const button = event.target.closest(".choice");
        if (!button) return;
        grid.querySelectorAll(".choice").forEach((item) => item.classList.remove("selected"));
        button.classList.add("selected");
      });
    });
  }

  function setupCatalogControls() {
    document.getElementById("editPalette").innerHTML = Object.keys(state.catalog.palettes)
      .map((key) => `<option>${key}</option>`)
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
      document.getElementById(id).addEventListener("input", (event) => {
        state.edit[key] = event.target.value;
        renderAll();
      });
    });
    document.getElementById("assetGallery").addEventListener("click", (event) => {
      const button = event.target.closest(".asset-card");
      if (!button) return;
      state.edit.assetId = button.dataset.id;
      renderAll();
      document.getElementById("editor").scrollIntoView({ behavior: "smooth" });
    });
  }

  function setupModel() {
    document.querySelector(".segmented").addEventListener("click", (event) => {
      const button = event.target.closest(".segment");
      if (!button) return;
      state.model.view = button.dataset.view;
      state.model.rotation = { front: 0, side: 90, back: 180 }[button.dataset.view] || 0;
      renderAll();
    });

    const modelPreview = document.getElementById("modelPreview");
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

    const numberMap = {
      heightInput: "height",
      chestInput: "chest",
      waistInput: "waist",
      shoulderInput: "shoulder"
    };
    Object.entries(numberMap).forEach(([id, key]) => {
      document.getElementById(id).addEventListener("input", (event) => {
        state.model[key] = Number(event.target.value);
        const fit = renderers.fitAnalysis(state.model, state.catalog.sizeTable);
        state.model.size = fit.recommendedSize;
        renderAll();
      });
    });
    document.getElementById("bodyType").addEventListener("change", (event) => {
      state.model.body = event.target.value;
      renderAll();
    });
    document.getElementById("sizeSelect").addEventListener("change", (event) => {
      state.model.size = event.target.value;
      renderAll();
    });
  }

  function setupForms() {
    document.getElementById("briefForm").addEventListener("submit", async (event) => {
      event.preventDefault();
      await generateDesigns();
      document.getElementById("proposals").scrollIntoView({ behavior: "smooth" });
    });
    document.getElementById("regenerate").addEventListener("click", generateDesigns);
    document.getElementById("proposalList").addEventListener("click", (event) => {
      const button = event.target.closest(".select-proposal");
      if (!button) return;
      state.selectedId = button.dataset.id;
      const proposal = selectedProposal();
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
      renderAll();
      document.getElementById("editor").scrollIntoView({ behavior: "smooth" });
    });
    document.getElementById("contactForm").addEventListener("submit", async (event) => {
      event.preventDefault();
      const form = event.currentTarget;
      const inquiry = await api.saveInquiry({
        sessionId: state.session?.id,
        proposal: selectedProposal(),
        brief: state.brief,
        edit: state.edit,
        model: state.model,
        estimate: state.estimate,
        customer: {
          name: form.querySelector('input[type="text"]').value,
          email: form.querySelector('input[type="email"]').value,
          note: form.querySelector("textarea").value
        }
      });
      document.getElementById("contactStatus").textContent = `保存しました。管理用ID: ${inquiry.id}`;
    });
  }

  async function init() {
    state.catalog = await api.getCatalog();
    setupChoices();
    setupCatalogControls();
    setupEditor();
    setupModel();
    setupForms();
    await generateDesigns();
  }

  init();
})();
