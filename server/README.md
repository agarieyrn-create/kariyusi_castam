# サーバー側提案サービス

`gemini-gateway.mjs` は、ブラウザから受け取った用途・雰囲気・柄の条件をサーバー側で検証し、Geminiを呼び出すための最小境界です。`GEMINI_API_KEY` はサーバー環境変数からだけ読み込み、HTML、クライアントJavaScript、localStorage、共有URLには一切含めません。

開発時は `GEMINI_API_KEY` を設定しない場合に明示的な503を返します。フロントエンドは既定のモック提案へフォールバックできるため、外部サービス障害時にも画面を利用できます。本番では、認証、レート制限、入力サイズ制限、監査ログをこの境界の前段に追加してください。

## 開始

```bash
GEMINI_API_KEY=your-server-secret node server/gemini-gateway.mjs
```

クライアント側にAPIキーを配置する実装は禁止します。`VITE_*` 変数や共有URLに秘密を格納しないでください。
