(function () {
  "use strict";

  const asset = (id, file, title, type, tags) => ({ id, file, title, type, tags });

  window.KariyushiSeed = {
    palettes: {
      "海風ブルー": { base: "#e7f7f7", accent: "#1c7f93", sub: "#f2b64b", dark: "#173d45" },
      "月桃ホワイト": { base: "#fbf7ea", accent: "#587f58", sub: "#d8a044", dark: "#2f4737" },
      "琉球レッド": { base: "#fff0eb", accent: "#c94f49", sub: "#1c7f93", dark: "#432628" },
      "夜海ブラック": { base: "#172326", accent: "#5db6bd", sub: "#d8a044", dark: "#f7efd9" },
      "若葉グリーン": { base: "#eef7e9", accent: "#5f8f61", sub: "#d76f54", dark: "#244633" }
    },
    patterns: [
      { id: "bingata", name: "紅型風ウェーブ", motifs: ["紅型風", "波模様"], formal: 4, okinawa: 5, bold: 3 },
      { id: "hibiscus", name: "淡色ハイビスカス", motifs: ["ハイビスカス"], formal: 3, okinawa: 4, bold: 4 },
      { id: "shisa", name: "シーサー小紋", motifs: ["シーサー"], formal: 2, okinawa: 5, bold: 5 },
      { id: "leaf", name: "ヤシ葉ボタニカル", motifs: ["ヤシ葉"], formal: 4, okinawa: 3, bold: 3 },
      { id: "wave", name: "青波ミンサー", motifs: ["波模様"], formal: 5, okinawa: 4, bold: 2 }
    ],
    conceptLanes: [
      {
        id: "uniform",
        title: "A案 店舗・制服向け",
        direction: "遠目では落ち着き、近くで沖縄らしさが伝わる案。スタッフ用や法人ユニフォームに使いやすい設計です。",
        logo: "leftChest",
        collar: "ボタンダウン",
        density: 56,
        scale: 96
      },
      {
        id: "resort",
        title: "B案 リゾート・物販向け",
        direction: "写真映えと明るさを重視した案。観光、売店、イベント販売で目を引く方向性です。",
        logo: "sleeve",
        collar: "開襟",
        density: 40,
        scale: 116
      },
      {
        id: "heritage",
        title: "C案 伝統・記念品向け",
        direction: "紅型やシーサーの要素を強め、地域性を前面に出す案。周年記念や贈答品にも向きます。",
        logo: "back",
        collar: "スタンドカラー",
        density: 34,
        scale: 108
      }
    ],
    assets: [
      asset("wear_010", "かりゆしウェア_010_水色ハイビスカス.png", "水色ハイビスカス", "wear", ["明るい", "リゾート", "ハイビスカス"]),
      asset("wear_012", "かりゆしウェア_012_緑ボタニカル.png", "緑ボタニカル", "wear", ["落ち着き", "植物", "制服"]),
      asset("wear_027", "かりゆしウェア_027_夕景ビーチ柄.png", "夕景ビーチ柄", "wear", ["大胆", "観光", "写真映え"]),
      asset("wear_031", "かりゆしウェア_031_青波柄.png", "青波柄", "wear", ["波模様", "上品", "青"]),
      asset("wear_040", "かりゆしウェア_040_紺シーサー柄.png", "紺シーサー柄", "wear", ["伝統的", "シーサー", "濃色"]),
      asset("wear_045", "かりゆしウェア_045_青紅型風.png", "青紅型風", "wear", ["紅型風", "沖縄感", "式典"]),
      asset("motif_009", "素材_009_ハイビスカスピンク.png", "ハイビスカス素材", "motif", ["花", "明るい"]),
      asset("motif_017", "素材_017_焼き物シーサー.png", "焼き物シーサー素材", "motif", ["シーサー", "伝統"]),
      asset("motif_025", "素材_025_モンステラ.png", "モンステラ素材", "motif", ["植物", "ボタニカル"]),
      asset("motif_031", "素材_031_波模様.png", "波模様素材", "motif", ["波", "上品"]),
      asset("motif_034", "素材_034_沖縄かりゆしロゴ.png", "ロゴ素材", "motif", ["ロゴ", "胸元"])
    ],
    sizeTable: {
      S: { chest: 104, shoulder: 43, length: 68, sleeve: 23 },
      M: { chest: 110, shoulder: 45, length: 71, sleeve: 24 },
      L: { chest: 116, shoulder: 47, length: 74, sleeve: 25 },
      LL: { chest: 124, shoulder: 50, length: 77, sleeve: 26 },
      "3L": { chest: 132, shoulder: 53, length: 80, sleeve: 27 }
    }
  };
})();
