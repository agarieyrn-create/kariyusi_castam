(function () {
  "use strict";

  window.KariyushiConfig = {
    mode: "mock",
    assetBaseUrl: "デザイン写真/",
    storageKeys: {
      sessions: "kariyushi-design-sessions",
      inquiries: "kariyushi-design-inquiries",
      selectedSession: "kariyushi-design-selected-session"
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
      size: "M"
    }
  };
})();
