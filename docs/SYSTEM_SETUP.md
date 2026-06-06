# システム環境構築手順書 (System Setup Guide)

本ドキュメントは、本システムをローカル開発環境および本番環境（Supabase、外部API、クラウドストレージ等）に接続して構築するための手順を定義します。

---

## 📋 システム要件

- **Node.js**: >= 18.0.0 (推奨: v20.x LTS)
- **npm**: >= 9.x
- **データベース**: PostgreSQL >= 14 (または Supabase)

---

## 🛠 ローカル環境構築手順

### Step 1: プロジェクトのクローンと依存関係のインストール
```bash
git clone <repository-url>
cd オリジナルかりゆしウェアデザイン開発システム
npm install
```

### Step 2: 環境変数の設定
`.env.example` から `.env` を作成します。
```bash
cp .env.example .env
```
開発・試作モードでは以下の値で動作します。
```env
VITE_APP_MODE=mock
VITE_APP_BASE_URL=http://localhost:3000
```

### Step 3: ローカル開発サーバーの起動 (Vite)
```bash
npm run dev
```
ブラウザで `http://localhost:3000` を開き、動作を確認します。

---

## 📦 各スクリプトの役割

本システムは以下のスクリプトファイル群で協調動作します。

- **`config.js`**: アプリケーション設定（アセットパス、アバター寸法などのデフォルト値）を保持。
- **`mock-db.js`**: データベース未接続時に利用する配色・柄・アセットのモックデータを定義。
- **`api-client.js`**: 疑似API通信モジュール。将来的に本番API（`/v1/*`）へ接続する際のインターフェースとなります。
- **`renderers.js`**: HTMLテンプレートとSVGシャツ、サイズレポート等のレンダリングロジック。
- **`design-store.js`**: デザインデータの永続化（localStorage）および、非推奨APIを排除した安全なBase64エンコードによる共有URL生成・復元。
- **`fabric-editor.js`**: Fabric.jsを用いたロゴ画像（アップロード時のマジックバイト検証付き）およびカスタムテキスト配置キャンバス。
- **`three-viewer.js`**: Three.jsを用いた3Dアバターとシャツモデルの描画、およびマウスドラッグによる回転制御、リサイズ時メモリ解放（dispose）処理。
- **`app.js`**: メインエントリポイント。状態管理とイベントリスナー（安全なnullチェック付き）をバインド。

---

## 💾 本番データベース (Supabase) のセットアップ

### 1. スキーマの適用
`db/schema.sql` の内容を、Supabase の SQL Editor もしくはマイグレーションツールを用いて適用します。
これにより、`users`、`design_sessions`、`patterns`、`palettes`、`estimates`、`inquiries` 等のテーブルが作成されます。

### 2. RLS (Row Level Security) の設定
Supabase 本番環境ではセキュリティのため、テーブルごとに適切なRLSポリシーを適用します。
例: `inquiries` テーブルに対して匿名ロール (`anon`) での `INSERT` のみを許可し、`SELECT` は管理者または認証済みユーザーのみに制限します。

```sql
ALTER TABLE inquiries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous insert for inquiries" 
ON inquiries FOR INSERT 
TO anon 
WITH CHECK (true);
```

### 3. 初期データの投入
`db/seed.sql` を実行し、カラーパレットや柄テンプレートの初期マスターデータをデータベースに投入します。
