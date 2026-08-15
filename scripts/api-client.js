(function () {
  "use strict";

  function readJson(key, fallback) {
    try {
      return JSON.parse(localStorage.getItem(key)) || fallback;
    } catch (_error) {
      return fallback;
    }
  }

  function writeJson(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (_error) {
      return false;
    }
  }

  function uid(prefix) {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      return `${prefix}_${crypto.randomUUID()}`;
    }
    return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
  }

  function cleanText(value, maxLength = 500) {
    return String(value || "").trim().replace(/\s+/g, " ").slice(0, maxLength);
  }

  function normalizeEmail(value) {
    return cleanText(value, 160).toLowerCase();
  }

  function validateInquiryPayload(payload) {
    if (!payload || typeof payload !== "object") {
      throw new Error("見積もり依頼の内容を確認できませんでした。");
    }
    const customer = payload.customer && typeof payload.customer === "object" ? payload.customer : {};
    const name = cleanText(customer.name, 80);
    const email = normalizeEmail(customer.email);
    const note = cleanText(customer.note, 2000);
    if (!name) throw new Error("お名前を入力してください。");
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new Error("メールアドレスを正しく入力してください。");
    }
    if (!note) throw new Error("相談内容を入力してください。");

    const requestedQuantity = Number(payload.configuration?.quantity ?? payload.brief?.quantity ?? payload.estimate?.quantity);
    if (!Number.isFinite(requestedQuantity) || requestedQuantity < 1 || requestedQuantity > 10000) {
      throw new Error("希望枚数は1〜10,000枚の範囲で入力してください。");
    }
    return {
      ...payload,
      requestKey: cleanText(payload.requestKey, 120) || undefined,
      customer: {
        ...customer,
        name,
        companyName: cleanText(customer.companyName, 120) || undefined,
        email,
        phone: cleanText(customer.phone, 30) || undefined,
        preferredContactMethod: cleanText(customer.preferredContactMethod, 20) || undefined,
        note
      }
    };
  }

  function fallbackEstimate(quantityOrConfiguration, configuredRules = {}) {
    const configuration = typeof quantityOrConfiguration === "object"
      ? quantityOrConfiguration
      : { quantity: quantityOrConfiguration };
    const parsedQuantity = Number(configuration.quantity);
    const quantity = Number.isFinite(parsedQuantity) && parsedQuantity >= 1
      ? Math.min(Math.floor(parsedQuantity), 10000)
      : 50;
    const rules = configuredRules || {};
    const basePrice = Number(rules.basePrice || 9800);
    const samplePrice = Number(rules.samplePrice || 18000);
    const tier = [...(rules.quantityUnitPrices || [
      { minQuantity: 200, unitPrice: 6900 },
      { minQuantity: 100, unitPrice: 7600 },
      { minQuantity: 50, unitPrice: 8600 }
    ])]
      .sort((a, b) => Number(b.minQuantity) - Number(a.minQuantity))
      .find((item) => quantity >= Number(item.minQuantity));
    const unitPrice = Number(tier?.unitPrice ?? basePrice);
    const baseSubtotal = quantity * basePrice;
    const discount = Math.max(0, baseSubtotal - quantity * unitPrice);
    const items = [{ label: `基本料金（${quantity}枚）`, amount: baseSubtotal }];
    const fabricUnitPrice = Number(rules.fabricAdditionalPrices?.[configuration.fabricId] || 0);
    if (fabricUnitPrice > 0) items.push({ label: "生地オプション", amount: fabricUnitPrice * quantity });
    if (configuration.sleeveType === "long") {
      items.push({ label: "長袖オプション", amount: Number(rules.longSleeveAdditionalPrice || 1000) * quantity });
    }
    if (configuration.logo?.imageUrl) {
      const logoUnitPrice = configuration.logo.processingType === "embroidery"
        ? Number(rules.embroideryPrice || 1500)
        : Number(rules.logoPrintPrice || 900);
      items.push({ label: configuration.logo.processingType === "embroidery" ? "ロゴ刺繍" : "ロゴプリント", amount: logoUnitPrice * quantity });
    }
    if (configuration.individualName?.enabled) {
      items.push({ label: "個別名入れ", amount: Number(rules.namePrintPrice || 800) * quantity });
    }
    if (samplePrice > 0) items.push({ label: "サンプル作成費", amount: samplePrice });
    const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
    return {
      items,
      quantity,
      baseUnitPrice: basePrice,
      unitPrice,
      samplePrice,
      subtotal,
      discount,
      total: subtotal - discount,
      isEstimate: true
    };
  }

  function scorePattern(pattern, brief, lane) {
    let score = 0;
    if (brief.motif !== "AIに任せる" && pattern.motifs.includes(brief.motif)) score += 6;
    if (brief.mood === "上品") score += pattern.formal;
    else if (brief.mood === "伝統的") score += pattern.okinawa;
    else if (brief.mood === "大胆") score += pattern.bold;
    else score += Math.floor((pattern.formal + pattern.okinawa + pattern.bold) / 3); // デフォルトスコア

    if (lane.id === "uniform") score += pattern.formal;
    if (lane.id === "heritage") score += pattern.okinawa;
    if (lane.id === "resort") score += pattern.bold;
    if (brief.scene === "仕事") score += pattern.formal + 2;
    return score;
  }

  function pickPattern(patterns, brief, lane, index) {
    return [...patterns]
      .sort((a, b) => scorePattern(b, brief, lane) - scorePattern(a, brief, lane))[index % patterns.length];
  }

  class KariyushiApiClient {
    constructor(config, seed) {
      this.config = config;
      this.seed = seed;
    }

    async getCatalog() {
      return {
        palettes: this.seed.palettes,
        patterns: this.seed.patterns,
        assets: this.seed.assets,
        sizeTable: this.seed.sizeTable
      };
    }

    async createDesignSession(brief) {
      const session = {
        id: uid("session"),
        createdAt: new Date().toISOString(),
        brief,
        status: "draft"
      };
      const sessions = readJson(this.config.storageKeys.sessions, []);
      sessions.unshift(session);
      sessions.length = Math.min(sessions.length, this.config.storageLimits?.sessions || 20);
      writeJson(this.config.storageKeys.sessions, sessions);
      writeJson(this.config.storageKeys.selectedSession, session);
      return session;
    }

    async generateDesigns(sessionId, brief) {
      const proposals = this.seed.conceptLanes.map((lane, index) => {
        const pattern = pickPattern(this.seed.patterns, brief, lane, index);
        const reference = this.seed.assets.find((item) => item.tags.some((tag) => pattern.motifs.includes(tag))) || this.seed.assets[index];
        return {
          id: `proposal_${index + 1}`,
          sessionId,
          lane: lane.id,
          title: lane.title,
          direction: lane.direction,
          pattern,
          palette: brief.palette,
          logo: lane.logo,
          collar: lane.collar,
          button: index === 1 ? "白蝶貝風" : "黒蝶貝風",
          density: lane.density,
          scale: lane.scale,
          assetId: reference.id,
          tags: [brief.scene, brief.mood, pattern.name, brief.palette]
        };
      });
      return { sessionId, proposals, generatedAt: new Date().toISOString() };
    }

    async createEstimate(quantityOrConfiguration) {
      const configuration = typeof quantityOrConfiguration === "object"
        ? quantityOrConfiguration
        : { quantity: Number(quantityOrConfiguration) || 50 };
      const calculator = window.KariyushiPricing?.calculateEstimatedPrice;
      return typeof calculator === "function"
        ? calculator(configuration, this.config.priceRules)
        : fallbackEstimate(configuration, this.config.priceRules);
    }

    async saveInquiry(payload) {
      const validated = validateInquiryPayload(payload);
      const { id, createdAt, status, estimate, estimatedPrice, priceBreakdown, ...rest } = validated;
      const inquiries = readJson(this.config.storageKeys.inquiries, []);
      if (validated.requestKey) {
        const savedInquiry = inquiries.find((item) => item.requestKey === validated.requestKey);
        if (savedInquiry) return savedInquiry;
      }
      const calculatedPrice = await this.createEstimate(validated.configuration || validated.brief?.quantity || estimate?.quantity);
      const configuration = validated.configuration
        ? { ...validated.configuration, estimatedPrice: calculatedPrice.total }
        : undefined;
      const inquiry = {
        ...rest,
        id: uid("inquiry"),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: "new",
        configuration,
        estimate: calculatedPrice,
        estimatedPrice: calculatedPrice.total,
        priceBreakdown: calculatedPrice
      };
      inquiries.unshift(inquiry);
      inquiries.length = Math.min(inquiries.length, this.config.storageLimits?.inquiries || 50);
      if (!writeJson(this.config.storageKeys.inquiries, inquiries)) {
        throw new Error("問い合わせ内容の保存容量が不足しています。古い保存データを削除してから再度お試しください。");
      }
      return inquiry;
    }
  }

  window.KariyushiValidation = { validateInquiryPayload };
  window.KariyushiApiClient = KariyushiApiClient;
})();
