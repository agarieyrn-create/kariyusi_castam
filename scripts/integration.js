(() => {
  "use strict";

  const store = window.KariyushiStore;
  if (!store) return;

  const yen = new Intl.NumberFormat("ja-JP", {
    style: "currency",
    currency: "JPY",
    maximumFractionDigits: 0
  });

  const labels = {
    stripe: "紺ストライプ",
    botanical: "淡緑ボタニカル",
    wave: "青波柄",
    logo: "ロゴ中心",
    short: "半袖",
    long: "長袖"
  };

  const byId = (id) => document.getElementById(id);

  function setText(id, value) {
    const element = byId(id);
    if (element) element.textContent = value;
  }

  function setValue(id, value) {
    const element = byId(id);
    if (element) element.value = value ?? "";
  }

  function summarize(configuration) {
    const pattern = labels[configuration.patternId] || configuration.patternId || "柄未選択";
    const sleeve = labels[configuration.sleeveType] || configuration.sleeveType || "袖未選択";
    return `${pattern}・${sleeve}`;
  }

  function syncQuoteHandoff(state) {
    const { configuration, priceBreakdown, previewImageUrl } = state;
    const total = priceBreakdown?.total || configuration.estimatedPrice || 0;
    setText("quoteSummaryDesign", summarize(configuration));
    setText("quoteSummaryQuantity", `${configuration.quantity || 1}枚`);
    setText("quoteSummaryPrice", yen.format(total));
    setValue("configurationPayload", JSON.stringify(configuration));
    setValue("quotationEstimatedPrice", String(total));
    setValue("previewImagePayload", previewImageUrl || "");

    const colorOutput = document.querySelector("[data-color-output]");
    if (colorOutput) colorOutput.textContent = configuration.baseColor || "#123047";
  }

  function prepareQuoteForm() {
    const state = store.getState();
    const { configuration, priceBreakdown } = state;
    syncQuoteHandoff(state);

    const form = byId("contactForm");
    if (form) {
      const quantity = form.elements.namedItem("quantity");
      const date = form.elements.namedItem("date");
      const image = form.elements.namedItem("image");
      if (quantity) quantity.value = configuration.quantity || 1;
      if (date && configuration.requestedDeliveryDate) date.value = configuration.requestedDeliveryDate;
      if (image && !image.value) {
        image.value = `${summarize(configuration)}／${configuration.size || "M"}サイズ／概算 ${yen.format(priceBreakdown?.total || 0)}`;
      }
    }

    setText("configuratorStatus", "選択内容を見積もりフォームへ反映しました。");
    byId("contact")?.scrollIntoView({ behavior: "smooth", block: "start" });
    window.setTimeout(() => form?.querySelector('input[name="company"]')?.focus({ preventScroll: true }), 520);
  }

  async function readLogo(file) {
    const allowedTypes = new Set(["image/png", "image/jpeg", "image/webp"]);
    if (!allowedTypes.has(file.type)) throw new Error("PNG・JPEG・WebP画像を選択してください。");
    if (file.size > 5 * 1024 * 1024) throw new Error("ロゴ画像は5MB以下にしてください。");
    return URL.createObjectURL(file);
  }

  let previousLogoUrl = "";
  byId("logoUpload")?.addEventListener("change", async (event) => {
    const file = event.currentTarget.files?.[0];
    if (!file) return;
    try {
      const imageUrl = await readLogo(file);
      if (previousLogoUrl) URL.revokeObjectURL(previousLogoUrl);
      previousLogoUrl = imageUrl;
      const currentLogo = store.getState().configuration.logo || {};
      store.updateConfiguration({
        logo: {
          position: "leftChest",
          processingType: "print",
          scale: 1,
          rotation: 0,
          ...currentLogo,
          imageUrl
        }
      });
      setText("configuratorStatus", `${file.name} をロゴとして追加しました。`);
    } catch (error) {
      event.currentTarget.value = "";
      setText("configuratorStatus", error.message || "ロゴ画像を読み込めませんでした。");
    }
  });

  async function capturePreview() {
    const button = byId("capturePreview");
    const originalLabel = button?.textContent || "プレビューを保存";
    try {
      if (button) {
        button.disabled = true;
        button.textContent = "保存中…";
      }
      const viewer = window.KariyushiTryOn || window.KariyushiTryonStudio || window.KariyushiTryon;
      const result = typeof viewer?.capturePreview === "function" ? await viewer.capturePreview() : undefined;
      let image = typeof result === "string" ? result : result?.dataUrl;
      if (!image) image = byId("tryonCanvas")?.toDataURL?.("image/png");
      if (!image) throw new Error("プレビュー画像を作成できませんでした。");
      store.setPreviewImageUrl(image);
      setText("configuratorStatus", "現在のプレビューを見積もり内容に保存しました。");
    } catch (error) {
      setText("configuratorStatus", "画像を保存できませんでしたが、見積もり相談は続けられます。");
    } finally {
      if (button) {
        button.disabled = false;
        button.textContent = originalLabel;
      }
    }
  }

  byId("capturePreview")?.addEventListener("click", capturePreview);
  byId("goToQuote")?.addEventListener("click", prepareQuoteForm);
  byId("configuratorForm")?.addEventListener("reset", () => {
    window.setTimeout(() => {
      store.resetConfiguration();
      setText("configuratorStatus", "選択内容を初期状態へ戻しました。");
    }, 0);
  });

  window.addEventListener("kariyushi:previewcapture", (event) => {
    const image = event.detail?.dataUrl || event.detail?.image || event.detail?.imageUrl || event.detail;
    if (typeof image === "string" && image) store.setPreviewImageUrl(image);
  });

  store.subscribe(syncQuoteHandoff);
  syncQuoteHandoff(store.getState());

  window.addEventListener("beforeunload", () => {
    if (previousLogoUrl) URL.revokeObjectURL(previousLogoUrl);
  });
})();
