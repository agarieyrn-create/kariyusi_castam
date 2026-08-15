(function () {
  "use strict";

  const STORAGE_KEY = "kariyushi-saved-designs";
  const MAX_SAVED_DESIGNS = 30;
  const MAX_SHARE_PAYLOAD_BYTES = 120 * 1024;
  const CONFIGURATION_STORAGE_KEY = window.KariyushiConfig?.storageKeys?.configuration || "kariyushi-configuration";
  const DEFAULT_PRICE_RULES = {
    basePrice: 9800,
    samplePrice: 18000,
    longSleeveAdditionalPrice: 1000,
    fabricAdditionalPrices: { standard: 0, premium: 800 },
    logoPrintPrice: 900,
    embroideryPrice: 1500,
    namePrintPrice: 800,
    quantityUnitPrices: [
      { minQuantity: 200, unitPrice: 6900 },
      { minQuantity: 100, unitPrice: 7600 },
      { minQuantity: 50, unitPrice: 8600 }
    ]
  };

  const INITIAL_CONFIGURATION = {
    productId: "kariyushi-basic",
    productName: "オリジナルかりゆしウェア",
    gender: "unisex",
    bodyType: "standard",
    sleeveType: "short",
    collarType: "開襟",
    baseColor: "#e6fbff",
    fabricId: "standard",
    patternId: "bingata",
    size: "M",
    quantity: 50,
    pocket: { enabled: false },
    options: [],
    estimatedPrice: 0
  };

  function toPositiveInteger(value, fallback = 1) {
    const number = Number(value);
    if (!Number.isFinite(number) || number < 1) return fallback;
    return Math.min(Math.floor(number), 10000);
  }

  function calculateEstimatedPrice(configuration = {}, priceRules = {}) {
    const rules = {
      ...DEFAULT_PRICE_RULES,
      ...(window.KariyushiConfig?.priceRules || {}),
      ...priceRules
    };
    const quantity = toPositiveInteger(configuration.quantity, INITIAL_CONFIGURATION.quantity);
    const quantityTiers = [...(rules.quantityUnitPrices || [])]
      .sort((a, b) => Number(b.minQuantity) - Number(a.minQuantity));
    const tier = quantityTiers.find((item) => quantity >= Number(item.minQuantity));
    const discountedBaseUnitPrice = Number(tier?.unitPrice ?? rules.basePrice);
    const baseSubtotal = quantity * Number(rules.basePrice);
    const discount = Math.max(0, baseSubtotal - quantity * discountedBaseUnitPrice);
    const items = [{ label: `基本料金（${quantity}枚）`, amount: baseSubtotal }];

    const fabricUnitPrice = Number(rules.fabricAdditionalPrices?.[configuration.fabricId] || 0);
    if (fabricUnitPrice > 0) items.push({ label: "生地オプション", amount: fabricUnitPrice * quantity });
    if (configuration.sleeveType === "long") {
      items.push({ label: "長袖オプション", amount: Number(rules.longSleeveAdditionalPrice) * quantity });
    }
    if (configuration.logo?.imageUrl) {
      const logoUnitPrice = configuration.logo.processingType === "embroidery"
        ? Number(rules.embroideryPrice)
        : Number(rules.logoPrintPrice);
      items.push({ label: configuration.logo.processingType === "embroidery" ? "ロゴ刺繍" : "ロゴプリント", amount: logoUnitPrice * quantity });
    }
    if (configuration.individualName?.enabled) {
      items.push({ label: "個別名入れ", amount: Number(rules.namePrintPrice) * quantity });
    }
    const samplePrice = Number(rules.samplePrice || 0);
    if (samplePrice > 0) items.push({ label: "サンプル作成費", amount: samplePrice });

    const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
    const total = Math.max(0, subtotal - discount);
    return {
      items,
      quantity,
      baseUnitPrice: Number(rules.basePrice),
      unitPrice: discountedBaseUnitPrice,
      samplePrice,
      subtotal,
      discount,
      total,
      isEstimate: true
    };
  }

  function normalizeConfiguration(value = {}) {
    const source = value && typeof value === "object" ? value : {};
    const normalized = {
      ...INITIAL_CONFIGURATION,
      ...source,
      quantity: toPositiveInteger(source.quantity, INITIAL_CONFIGURATION.quantity),
      pocket: source.pocket && typeof source.pocket === "object"
        ? { ...INITIAL_CONFIGURATION.pocket, ...source.pocket }
        : { ...INITIAL_CONFIGURATION.pocket },
      options: Array.isArray(source.options) ? [...source.options] : []
    };
    if (!normalized.logo?.imageUrl) delete normalized.logo;
    if (!normalized.companyName?.text) delete normalized.companyName;
    const priceBreakdown = calculateEstimatedPrice(normalized);
    normalized.estimatedPrice = priceBreakdown.total;
    return normalized;
  }

  function readSavedConfiguration() {
    try {
      const saved = JSON.parse(localStorage.getItem(CONFIGURATION_STORAGE_KEY));
      return normalizeConfiguration(saved);
    } catch (_error) {
      return normalizeConfiguration(INITIAL_CONFIGURATION);
    }
  }

  let storeState = {
    configuration: readSavedConfiguration(),
    previewImageUrl: undefined,
    priceBreakdown: null
  };
  storeState.priceBreakdown = calculateEstimatedPrice(storeState.configuration);
  const listeners = new Set();

  function emitConfigurationChange() {
    const snapshot = getState();
    listeners.forEach((listener) => listener(snapshot));
    if (typeof window.dispatchEvent === "function" && typeof window.CustomEvent === "function") {
      window.dispatchEvent(new window.CustomEvent("kariyushi:configurationchange", {
        detail: {
          configuration: snapshot.configuration,
          priceBreakdown: snapshot.priceBreakdown
        }
      }));
    }
  }

  function getState() {
    return {
      ...storeState,
      configuration: { ...storeState.configuration },
      priceBreakdown: {
        ...storeState.priceBreakdown,
        items: storeState.priceBreakdown.items.map((item) => ({ ...item }))
      }
    };
  }

  function updateConfiguration(updates = {}) {
    const current = storeState.configuration;
    const merged = {
      ...current,
      ...updates,
      pocket: updates.pocket ? { ...current.pocket, ...updates.pocket } : current.pocket,
      logo: updates.logo ? { ...current.logo, ...updates.logo } : current.logo,
      companyName: updates.companyName ? { ...current.companyName, ...updates.companyName } : current.companyName,
      individualName: updates.individualName ? { ...current.individualName, ...updates.individualName } : current.individualName
    };
    const configuration = normalizeConfiguration(merged);
    const priceBreakdown = calculateEstimatedPrice(configuration);
    storeState = { ...storeState, configuration, priceBreakdown };
    try {
      localStorage.setItem(CONFIGURATION_STORAGE_KEY, JSON.stringify(configuration));
    } catch (_error) {
      // 保存できない環境でも、画面内の編集は継続できる。
    }
    emitConfigurationChange();
    return getState();
  }

  function resetConfiguration() {
    const configuration = normalizeConfiguration(INITIAL_CONFIGURATION);
    storeState = {
      configuration,
      previewImageUrl: undefined,
      priceBreakdown: calculateEstimatedPrice(configuration)
    };
    try {
      localStorage.removeItem(CONFIGURATION_STORAGE_KEY);
    } catch (_error) {
      // 保存領域が利用できない場合も初期化処理は継続する。
    }
    emitConfigurationChange();
    return getState();
  }

  function setPreviewImageUrl(previewImageUrl) {
    storeState = { ...storeState, previewImageUrl: previewImageUrl || undefined };
    emitConfigurationChange();
    return getState();
  }

  function subscribe(listener) {
    if (typeof listener !== "function") return () => {};
    listeners.add(listener);
    return () => listeners.delete(listener);
  }

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
      "button", "density", "scale", "assetId", "fabricJson",
      "brief", "edit", "model", "configuration", "priceBreakdown", "previewImageUrl"
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

  window.KariyushiPricing = {
    calculateEstimatedPrice,
    defaultRules: { ...DEFAULT_PRICE_RULES }
  };

  window.KariyushiStore = {
    getState,
    updateConfiguration,
    resetConfiguration,
    setPreviewImageUrl,
    subscribe
  };
})();
