(function () {
  "use strict";

  window.KariyushiConfig = {
    mode: "mock",
    assetBaseUrl: "デザイン写真/",
    modelPhotoBaseUrl: "3Dモデル/",
    modelPhotos: {
      male: { label: "男性", file: "男性.jpg" },
      female: { label: "女性", file: "女性.jpg" }
    },
    storageKeys: {
      sessions: "kariyushi-design-sessions",
      inquiries: "kariyushi-design-inquiries",
      selectedSession: "kariyushi-design-selected-session",
      configuration: "kariyushi-configuration"
    },
    storageLimits: {
      sessions: 20,
      inquiries: 50
    },
    upload: {
      allowedLogoTypes: ["image/png", "image/jpeg", "image/webp"],
      maxLogoBytes: 2 * 1024 * 1024,
      maxLogoPixels: 16 * 1000 * 1000
    },
    performance: {
      initialAssetLimit: 24,
      assetPageSize: 24
    },
    priceRules: {
      basePrice: 9800,
      samplePrice: 18000,
      longSleeveAdditionalPrice: 1000,
      fabricAdditionalPrices: {
        standard: 0,
        premium: 800
      },
      logoPrintPrice: 900,
      embroideryPrice: 1500,
      namePrintPrice: 800,
      quantityUnitPrices: [
        { minQuantity: 200, unitPrice: 6900 },
        { minQuantity: 100, unitPrice: 7600 },
        { minQuantity: 50, unitPrice: 8600 }
      ]
    },
    defaultBrief: {
      scene: "ホテル・店舗制服",
      mood: "上品",
      palette: "海風ブルー",
      motif: "AIに任せる",
      quantity: 50
    },
    defaultEdit: {
      palette: "海風ブルー",
      logo: "leftChest",
      collar: "開襟",
      button: "黒蝶貝風",
      density: 46,
      scale: 100,
      assetId: "wear_010"
    },
    defaultModel: {
      view: "front",
      rotation: 0,
      body: "normal",
      height: 170,
      chest: 92,
      waist: 82,
      shoulder: 44,
      size: "M",
      mannequin: "male"
    }
  };
})();
