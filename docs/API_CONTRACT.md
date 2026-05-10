# API設計たたき台

現在の `scripts/api-client.js` は、下記APIに置き換えられる前提で作っています。

## GET /api/catalog

素材DBを取得します。

レスポンス:

```json
{
  "palettes": {},
  "patterns": [],
  "garments": [],
  "logoLayouts": []
}
```

## POST /api/design-sessions

ヒアリング回答を保存します。

リクエスト:

```json
{
  "scene": "ホテル",
  "mood": "高級感",
  "color": "青系",
  "motif": "AIに任せる",
  "quantity": 50
}
```

レスポンス:

```json
{
  "id": "session_xxx",
  "createdAt": "2026-05-10T00:00:00.000Z",
  "status": "created"
}
```

## POST /api/design-sessions/:id/generate

AI提案3案を生成します。

レスポンス:

```json
{
  "sessionId": "session_xxx",
  "generatedAt": "2026-05-10T00:00:00.000Z",
  "proposals": [
    {
      "id": "proposal_1",
      "title": "案A 法人向け",
      "pattern": {},
      "palette": "青系",
      "garment": "開襟",
      "logo": "leftChest",
      "density": 58,
      "tags": ["ホテル", "高級感"]
    }
  ]
}
```

## POST /api/estimates

概算見積を作成します。

リクエスト:

```json
{
  "quantity": 50,
  "selectedProposalId": "proposal_1",
  "edit": {}
}
```

## POST /api/inquiries

問い合わせを保存します。

リクエスト:

```json
{
  "sessionId": "session_xxx",
  "selectedProposalId": "proposal_1",
  "customer": {
    "name": "沖縄 太郎",
    "email": "example@example.com",
    "note": "店舗ユニフォーム相談"
  }
}
```
