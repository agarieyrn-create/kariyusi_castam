# API インターフェース仕様書 (v1)

本ドキュメントは、オリジナルかりゆしウェアデザイン開発システムにおけるフロントエンドとバックエンド（BaaS/Supabase等）の間の通信規約（APIコントラクト）を定義します。

---

## 🔒 共通仕様

### ベースURL
- 本番環境: `https://api.kariyushi-custom.jp/v1`
- 開発環境: `http://localhost:3000/v1`

### 認証・認可
- **認証方式**: Bearer トークン認証 (`Authorization: Bearer <JWT>`)
- すべての更新・書き込み処理、およびセッション・問い合わせ履歴の参照には認証が必要です。
- Supabase Auth から発行される JWT を使用します。

### レート制限 (Rate Limiting)
- 一般的な参照API: `100 リクエスト / 分`（IPアドレス単位）
- AI提案生成・問い合わせ送信API: `5 リクエスト / 分`、`50 リクエスト / 日`（ユーザー/IPアドレス単位）

### エラーレスポンス形式
HTTPステータスコードが `2xx` 以外の場合、以下の共通エラーフォーマットが返却されます。

```json
{
  "error": {
    "code": "BAD_REQUEST",
    "message": "リクエストパラメータに不備があります。",
    "details": [
      {
        "field": "quantity",
        "issue": "数量は最低10枚以上で指定してください。"
      }
    ]
  }
}
```

主要なステータスコード:
- `400 Bad Request`: バリデーションエラー
- `401 Unauthorized`: トークンが無効または未設定
- `403 Forbidden`: アクセス権限なし（RLS違反など）
- `429 Too Many Requests`: レート制限超過
- `500 Internal Server Error`: サーバー側での予期せぬエラー

---

## 📡 エンドポイント定義

### 1. GET `/catalog`
カタログ素材DBを取得します。

#### クエリパラメータ
- `type` (任意): 絞り込むアセットのタイプ (`wear` | `motif`)
- `tag` (任意): 特定のタグで絞り込み (例: `ハイビスカス`)

#### レンスポンス (200 OK)
```json
{
  "palettes": {
    "海風ブルー": {
      "base": "#e7f7f7",
      "accent": "#1c7f93",
      "sub": "#f2b64b",
      "dark": "#173d45"
    }
  },
  "patterns": [
    {
      "id": "bingata",
      "name": "紅型風ウェーブ",
      "motif_tags": ["紅型風", "波模様"],
      "formal_score": 4,
      "okinawa_score": 5,
      "bold_score": 3
    }
  ],
  "assets": [
    {
      "id": "wear_010",
      "file": "かりゆしウェア_010_水色ハイビスカス.png",
      "title": "水色ハイビスカス",
      "type": "wear",
      "tags": ["明るい", "リゾート", "ハイビスカス"]
    }
  ],
  "sizeTable": {
    "M": { "chest": 110, "shoulder": 45, "length": 71, "sleeve": 24 }
  }
}
```

---

### 2. POST `/design-sessions`
ヒアリング回答を保存し、セッションを新規作成します。

#### リクエストボディ
```json
{
  "scene": "ホテル・店舗制服",
  "mood": "上品",
  "palette": "海風ブルー",
  "motif": "AIに任せる",
  "quantity": 50
}
```

#### レンスポンス (201 Created)
```json
{
  "id": "session_a1b2c3d4",
  "createdAt": "2026-06-06T01:30:00.000Z",
  "status": "draft",
  "brief": {
    "scene": "ホテル・店舗制服",
    "mood": "上品",
    "palette": "海風ブルー",
    "motif": "AIに任せる",
    "quantity": 50
  }
}
```

---

### 3. POST `/design-sessions/:id/generate`
指定されたセッションIDの回答に基づき、AI提案の3案を生成します。

#### レンスポンス (200 OK)
```json
{
  "sessionId": "session_a1b2c3d4",
  "generatedAt": "2026-06-06T01:31:00.000Z",
  "proposals": [
    {
      "id": "proposal_1",
      "sessionId": "session_a1b2c3d4",
      "lane": "uniform",
      "title": "A案 店舗・制服向け",
      "direction": "遠目では落ち着き、近くで沖縄らしさが伝わる案。",
      "pattern": {
        "id": "wave",
        "name": "青波ミンサー",
        "motif_tags": ["波模様"],
        "formal_score": 5,
        "okinawa_score": 4,
        "bold_score": 2
      },
      "palette": "海風ブルー",
      "logo": "leftChest",
      "collar": "ボタンダウン",
      "button": "黒蝶貝風",
      "density": 56,
      "scale": 96,
      "assetId": "wear_030",
      "tags": ["ホテル・店舗制服", "上品", "青波ミンサー", "海風ブルー"]
    }
  ]
}
```

---

### 4. POST `/estimates`
予定発注数量およびデザイン・カスタマイズ内容に基づき、概算見積もりを作成します。

#### リクエストボディ
```json
{
  "quantity": 120,
  "selectedProposalId": "proposal_1",
  "edit": {
    "palette": "海風ブルー",
    "logo": "leftChest",
    "collar": "ボタンダウン",
    "button": "黒蝶貝風",
    "density": 56,
    "scale": 96,
    "assetId": "wear_030"
  }
}
```

#### レンスポンス (200 OK)
```json
{
  "quantity": 120,
  "unitPrice": 7600,
  "samplePrice": 18000,
  "total": 930000,
  "currency": "JPY",
  "validUntil": "2026-07-06T23:59:59.000Z"
}
```

---

### 5. POST `/inquiries`
顧客情報とお問い合わせ仕様を紐付け、商談用のお問い合わせデータを保存します。

#### リクエストボディ
```json
{
  "sessionId": "session_a1b2c3d4",
  "proposal": {
    "id": "proposal_1",
    "title": "A案 店舗・制服向け"
  },
  "brief": {
    "scene": "ホテル・店舗制服",
    "quantity": 120
  },
  "edit": {
    "palette": "海風ブルー",
    "collar": "ボタンダウン"
  },
  "model": {
    "size": "M"
  },
  "estimate": {
    "unitPrice": 7600,
    "total": 930000
  },
  "customer": {
    "name": "沖縄サンプルホテル 担当：比嘉",
    "email": "higa@sample-hotel.com",
    "note": "ホテル開業用の制服として120着の製作を検討しています。ロゴマークのデータは準備済みです。"
  }
}
```

#### レンスポンス (201 Created)
```json
{
  "id": "inquiry_f9e8d7c6",
  "createdAt": "2026-06-06T01:32:00.000Z",
  "status": "saved",
  "referenceNumber": "INQ-2026-00001"
}
```
