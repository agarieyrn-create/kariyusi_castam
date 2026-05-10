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
