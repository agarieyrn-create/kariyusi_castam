# CHANGELOG

## 2.0.0 — Review-complete studio

この版は、レビューで提示されたP0〜P3の指摘事項をすべて反映し、デザイン検討の体験を保ちながら、データ境界・復元性・失敗回復性・保守性を大幅に引き上げた完成版です。

| 領域 | 対応内容 |
| --- | --- |
| P0 / RLS | `pgcrypto`へ統一し、`gen_random_uuid()`との不整合を解消しました。匿名の広域SELECT/ALLポリシーを削除し、所有者またはサーバー署名済み`session_id`だけがセッションと子データを読めるRLSへ変更しました。初期スキーマとマイグレーションを同じ方針で更新し、SQL契約テストを追加しました。 |
| P0 / Gemini | Gemini呼び出し用のサーバー境界`server/gemini-gateway.mjs`を追加しました。キーは`GEMINI_API_KEY`からだけ読み取り、HTML・ブラウザJavaScript・localStorage・共有URLへ注入しません。 |
| P1 / 共有URL | `kariyushi-share`スキーマとバージョン2を導入し、`brief`・`edit`・`model`・`fabricJson`を明示的に保存・復元します。完全往復テストと、旧形式をホワイトリスト変換する移行読み込みを追加しました。 |
| P1 / 失敗回復 | 提案生成・再提案を`try/catch/finally`で包み、処理中のボタン無効化、`aria-live`ステータス、再試行ボタン、成功表示を追加しました。 |
| P1 / 依存関係 | 依存関係とロックファイルを更新し、`npm audit --audit-level=high`で脆弱性0件を確認しました。 |
| P2 / モジュール | エントリーポイントをES moduleへ統一し、設定・モックデータ・APIクライアント・共有ストア・描画入口をimport/export化しました。従来のグローバル利用箇所には限定的な互換ブリッジを残しています。 |
| P2 / 入力検証 | `scripts/validation.js`に数量・密度・拡大率・採寸の共通範囲検証を集約し、APIクライアントと共有復元で再利用しています。 |
| P2 / 描画 | 描画入口を提案、素材、編集、3D/採寸、見積・仕様書の責務別に分けました。画面へ挿入する値は既存のエスケープ処理を通し、描画単位の契約を明確化しています。 |
| P2 / テスト | 既存テストに加え、共有完全往復、RLSポリシー、ブラウザ画面構造のテストを追加しました。 |
| P3 / 参考実装 | 重複する試作群を`docs/archive/reference-prototypes/`へ整理し、配信対象から分離しました。 |
| UX / 視認性 | CSS変数、処理中・成功・失敗状態、再試行、反映表示、縮小モーション設定、CDN障害時の既存フォールバックを整備しました。 |
| CI | `.github/workflows/quality.yml`で、依存関係導入、lint、テスト、buildをpush/PRごとに自動確認します。 |

### 検証済みコマンド

```text
npm run lint       pass
npm test -- --run  7 files / 21 tests pass
npm run build      pass
npm run smoke      pass
npm audit --audit-level=high 0 vulnerabilities
```

Chromiumでも初期画面、条件入力、3案表示、編集・3D・見積導線を確認しました。Three.js配信方式に関する将来の非推奨警告はありますが、3Dの再構築完了を確認し、アプリ固有の未処理例外はありませんでした。詳細は`docs/browser-verification.md`に記録しています。

### サーバー側提案サービスの運用

`GEMINI_API_KEY`をクライアント向け環境変数やHTMLへ置かないでください。サーバーでのみ設定し、必要に応じて認証・レート制限・監査ログを`server/README.md`の方針に沿って追加してください。
