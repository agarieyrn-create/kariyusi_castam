# システム構築に必要なAPI・設定

現状は `APP_MODE=mock` 相当で、外部APIなしで動く構成です。実運用に進める場合は、以下を準備してください。

## 必須

1. Supabase
   - 用途: 素材DB、デザインセッション、生成案、問い合わせ保存
   - 必要情報: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`

2. OpenAI API
   - 用途: ヒアリング回答のタグ化、3案のコンセプト文生成、素材選定理由の生成
   - 必要情報: `OPENAI_API_KEY`, `OPENAI_MODEL`
   - 画像生成はMVPでは必須ではありません。今回は素材DBの組み合わせ提案が中心です。

3. 画像ストレージ
   - 用途: 柄画像、ロゴ、プレビュー画像、将来の試着用アセット保存
   - 推奨: Cloudflare R2 または AWS S3
   - 必要情報: `STORAGE_BUCKET`, `STORAGE_PUBLIC_BASE_URL`, `STORAGE_ACCESS_KEY_ID`, `STORAGE_SECRET_ACCESS_KEY`, `STORAGE_ENDPOINT`

4. 問い合わせ通知
   - 用途: 問い合わせが入った時のメール通知
   - 必要情報: `CONTACT_TO_EMAIL`, SMTP設定、または SendGrid/Resend などのAPIキー

## あるとよいもの

- 会社ロゴアップロード用の保存先
- 管理者ログイン用の認証設定
- テスト用スプレッドシートまたはテスト用Supabaseプロジェクト
- デモ用の柄画像一式
- 3D試着を強化する場合のGLBモデル、または簡易アバター画像

## 今回のローカル構成

- `scripts/config.js`: API接続先・保存キーなどの設定
- `scripts/mock-db.js`: 素材DBのモックデータ
- `scripts/api-client.js`: 将来のバックエンドAPI差し替え口
- `scripts/renderers.js`: 画面描画
- `scripts/app.js`: アプリ制御
- `db/schema.sql`: Supabase/PostgreSQL向けの初期スキーマ案

## 実運用化するときの差し替え方

1. `scripts/api-client.js` の各メソッドを `fetch()` 経由のAPI呼び出しへ変更
2. `db/schema.sql` をSupabaseに適用
3. `patterns.asset_path` に画像ストレージのパスを登録
4. OpenAI APIで `generateDesigns` のコンセプト文とタグ化を生成
5. 問い合わせ保存後にメール通知を送信
