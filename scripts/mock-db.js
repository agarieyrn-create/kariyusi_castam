(function () {
  "use strict";

  const asset = (id, file, title, type, tags) => ({ id, file, title, type, tags });

  window.KariyushiSeed = {
    palettes: {
      "海風ブルー": { base: "#e6fbff", accent: "#16a6b8", sub: "#ffc857", dark: "#075e78" },
      "月桃ホワイト": { base: "#fbfff7", accent: "#3ac48f", sub: "#7bdff2", dark: "#275f51" },
      "琉球レッド": { base: "#fff4f2", accent: "#ff7a70", sub: "#16a6b8", dark: "#78443f" },
      "夜海ブラック": { base: "#14313b", accent: "#7bdff2", sub: "#ffc857", dark: "#f4fcff" },
      "若葉グリーン": { base: "#ecfff5", accent: "#3ac48f", sub: "#ffb86b", dark: "#24684f" }
    },
    patterns: [
      { id: "bingata", name: "紅型風ウェーブ", motifs: ["紅型風", "波模様"], motif_tags: ["紅型風", "波模様"], formal: 4, okinawa: 5, bold: 3 },
      { id: "hibiscus", name: "淡色ハイビスカス", motifs: ["ハイビスカス"], motif_tags: ["ハイビスカス"], formal: 3, okinawa: 4, bold: 4 },
      { id: "shisa", name: "シーサー小紋", motifs: ["シーサー"], motif_tags: ["シーサー"], formal: 2, okinawa: 5, bold: 5 },
      { id: "leaf", name: "ヤシ葉ボタニカル", motifs: ["ヤシ葉"], motif_tags: ["ヤシ葉"], formal: 4, okinawa: 3, bold: 3 },
      { id: "wave", name: "青波ミンサー", motifs: ["波模様"], motif_tags: ["波模様"], formal: 5, okinawa: 4, bold: 2 }
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
      asset("wear_014", "かりゆしウェア_014_淡色ハイビスカス.png", "淡色ハイビスカス", "wear", ["ハイビスカス", "上品", "明るい"]),
      asset("wear_027", "かりゆしウェア_027_夕景ビーチ柄.png", "夕景ビーチ柄", "wear", ["大胆", "観光", "写真映え"]),
      asset("wear_030", "かりゆしウェア_030_青波柄.png", "青波柄", "wear", ["波模様", "上品", "青"]),
      asset("wear_031", "かりゆしウェア_031_青波柄.png", "青波柄B", "wear", ["波模様", "上品", "青"]),
      asset("wear_034", "かりゆしウェア_034_赤小紋柄.png", "赤小紋柄", "wear", ["伝統的", "紅型風", "赤"]),
      asset("wear_036", "かりゆしウェア_036_赤シーサー柄.png", "赤シーサー柄", "wear", ["シーサー", "伝統的", "大胆"]),
      asset("wear_040", "かりゆしウェア_040_紺シーサー柄.png", "紺シーサー柄", "wear", ["伝統的", "シーサー", "濃色"]),
      asset("wear_045", "かりゆしウェア_045_青紅型風.png", "青紅型風", "wear", ["紅型風", "沖縄感", "式典"]),
      asset("wear_046", "かりゆしウェア_046.png", "デザイン46", "wear", ["モダン", "柄物"]),
      asset("wear_048", "かりゆしウェア_048.png", "デザイン48", "wear", ["華やか", "リゾート"]),
      asset("wear_050", "かりゆしウェア_050.png", "デザイン50", "wear", ["トロピカル", "大胆"]),
      asset("wear_053", "かりゆしウェア_053.png", "デザイン53", "wear", ["上品", "制服"]),
      asset("motif_009", "素材_009_ハイビスカスピンク.png", "ハイビスカス素材", "motif", ["花", "明るい", "ハイビスカス"]),
      asset("motif_017", "素材_017_焼き物シーサー.png", "焼き物シーサー素材", "motif", ["シーサー", "伝統"]),
      asset("motif_025", "素材_025_モンステラ.png", "モンステラ素材", "motif", ["植物", "ボタニカル", "ヤシ葉"]),
      asset("motif_031", "素材_031_波模様.png", "波模様素材", "motif", ["波", "上品", "波模様"]),
      asset("motif_034", "素材_034_沖縄かりゆしロゴ.png", "ロゴ素材", "motif", ["ロゴ", "胸元"]),
      asset("motif_001", "素材_001_赤シーサー渦模様.png", "赤シーサー渦", "motif", ["シーサー", "伝統", "紅型風"]),
      asset("motif_011", "素材_011_プルメリア白.png", "プルメリア白", "motif", ["花", "上品"]),
      asset("motif_023", "素材_023_サンゴピンク.png", "サンゴピンク", "motif", ["海", "リゾート"]),
      asset("motif_033", "素材_033_海亀.png", "海亀", "motif", ["海", "沖縄感"]),
      asset("motif_029", "素材_029_ヤシ葉.png", "ヤシ葉", "motif", ["植物", "ヤシ葉", "リゾート"])
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
