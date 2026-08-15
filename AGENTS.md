# オリジナルかりゆしウェア注文サイト

## Codex開発指示書・3エージェント分業設計

---

# 1. プロジェクト概要

## 1.1 目的

ユーザーがWeb上でオリジナルかりゆしウェアをカスタマイズし、完成イメージを確認したうえで、見積もり依頼または注文を送信できるサイトを構築する。

主なユーザー体験は以下とする。

1. 商品の形を選ぶ
2. メンズ・レディース・ユニセックスを選ぶ
3. 袖、襟、生地、色、柄を選ぶ
4. ロゴや社名を配置する
5. 3Dモデル上で着用イメージを確認する
6. サイズ、数量、オプションを選ぶ
7. 概算価格を確認する
8. 見積もり依頼または注文を送信する

---

# 2. 開発体制

開発作業は、以下の3担当に分けて進める。

* 総合・統合担当
* EC担当
* 3D担当

各担当は自分の責任範囲を守り、他担当の内部実装を無断で大きく変更しないこと。

## 2.1 担当間の基本方針

* 総合担当が共通仕様と開発順序を決める
* EC担当が注文導線と商品カスタマイズ機能を作る
* 3D担当が共通データに基づく3Dプレビューを作る
* 最後に総合担当が全体を統合する
* 3D機能が完成していなくても、見積もり依頼まで利用できる状態を先に作る

---

# 3. MVPの完成条件

初期版では、人体モデルへ自由に服を着せ替える高度なシミュレーションを完成条件にしない。

MVPでは、以下を実現する。

* 服を着用済みの3Dモデルを表示できる
* メンズ、レディースなどのモデルを切り替えられる
* ベースカラーを変更できる
* 柄テクスチャを変更できる
* プリセット位置にロゴを表示できる
* 360度回転とズームができる
* 3Dプレビューのスクリーンショットを保存できる
* 3Dが利用できない場合でも、2D画像で見積もり依頼を続けられる

以下はMVP後の拡張項目とする。

* 服と人体モデルを完全に分離した自由な着せ替え
* ボーン、スキニング、ウェイト調整
* 体型に応じた服の変形
* ロゴの完全自由配置
* リアルタイムな布シミュレーション
* AR試着

---

# 4. 共通技術方針

基本構成は以下を想定する。

* React
* TypeScript
* Vite
* Three.js
* React Three Fiber
* Zustand
* Tailwind CSS
* SupabaseまたはFirebase
* NetlifyまたはVercel

ただし、既存プロジェクトが別の技術構成で作られている場合、合理的な理由なく全面的に変更しないこと。

既存コードを調査し、活用できる部分を優先的に残す。

---

# 5. 全担当共通ルール

## 5.1 調査優先

作業開始時は、必ず既存コードを確認する。

以下を把握するまで、大規模なコード変更を行わない。

* ディレクトリ構成
* 使用技術
* 主要ライブラリ
* 状態管理方法
* 画面構成
* 3D関連の実装状況
* 商品・注文関連の実装状況
* データベースや外部サービスとの接続状況
* ビルド方法
* デプロイ方法

## 5.2 実装方針

* 一度にすべてを実装しない
* 小さな機能単位で実装する
* 変更前に対象コードを読む
* 既存機能を壊さない
* 変更範囲を必要最小限にする
* 型安全を優先する
* `any`を安易に使わない
* ハードコードを避ける
* 商品データと3Dデータを分離する
* PCとスマートフォンの両方に対応する
* 画面が真っ白になる障害を防ぐ
* 3Dが動かなくても注文操作を継続できるようにする
* アップロード画像を検証する
* 注文内容と3D表示状態を同じデータから生成する

## 5.3 作業報告

各タスク完了時に以下を報告する。

1. 実施した内容
2. 変更したファイル
3. 変更理由
4. 動作確認結果
5. 残っている問題
6. 次に推奨する小さなタスク

推測で実装した部分がある場合は、確定事項と仮説を分けて記載すること。

---

# 6. 共通コンフィギュレーション

ユーザーが選択した商品仕様は、共通のコンフィギュレーションデータとして一元管理する。

3D担当とEC担当が、それぞれ独自形式で同じ状態を持たないこと。

```ts
export type KariyushiConfiguration = {
  productId: string;
  productName: string;

  gender: "mens" | "womens" | "unisex";
  bodyType: "slim" | "standard" | "wide";

  sleeveType: "short" | "long";
  collarType: string;
  baseColor: string;

  fabricId: string;
  patternId: string;

  size: string;
  quantity: number;

  pocket?: {
    enabled: boolean;
    position?: "leftChest" | "rightChest";
  };

  logo?: {
    imageUrl: string;
    position: "leftChest" | "rightChest" | "back" | "leftSleeve" | "rightSleeve";
    processingType: "print" | "embroidery";
    scale: number;
    rotation: number;
  };

  companyName?: {
    text: string;
    fontFamily: string;
    color: string;
    position: "leftChest" | "rightChest" | "back" | "sleeve";
  };

  individualName?: {
    enabled: boolean;
    text?: string;
    position?: string;
  };

  options: string[];

  requestedDeliveryDate?: string;
  notes?: string;

  estimatedPrice: number;
};
```

必要に応じて型を分割してよいが、EC表示、3D表示、見積もり保存で同じ値を利用すること。

---

# 7. 状態管理方針

共通状態はZustandなどのストアで管理する。

```ts
type KariyushiStore = {
  configuration: KariyushiConfiguration;
  previewImageUrl?: string;

  updateConfiguration: (
    updates: Partial<KariyushiConfiguration>
  ) => void;

  resetConfiguration: () => void;

  setPreviewImageUrl: (
    previewImageUrl?: string
  ) => void;
};
```

利用例は以下とする。

```ts
const {
  configuration,
  updateConfiguration,
  previewImageUrl,
  setPreviewImageUrl,
} = useKariyushiStore();
```

注文時も、同じストアの値から送信データを作る。

```ts
const quotationPayload = {
  customer,
  configuration,
  estimatedPrice: configuration.estimatedPrice,
  previewImageUrl,
};
```

画面表示用の状態と送信用の状態を別々に管理しないこと。

---

# 8. 総合・統合担当

## 8.1 役割

あなたは、オリジナルかりゆしウェア注文サイトの設計・統合・品質管理担当である。

3D担当とEC担当が個別に作成した機能を接続し、一つのサービスとして完成させる。

すべてのコードを自分で作り直すのではなく、以下を中心に進める。

* 現状調査
* 共通仕様の決定
* タスク分解
* 担当間インターフェースの管理
* 成果物のレビュー
* 統合
* 品質確認
* リリース管理

## 8.2 主な責任範囲

* 全体要件の管理
* MVP範囲の管理
* ディレクトリ構成の決定
* 共通型の管理
* 状態管理設計
* 3DとECの接続
* API仕様の決定
* データベース設計の確認
* 画面遷移の確認
* UIの統一
* レスポンシブ対応の確認
* セキュリティ確認
* パフォーマンス確認
* エラー処理の統一
* テスト計画
* リリース管理
* ドキュメント管理
* 各担当への修正指示

## 8.3 総合担当が最初に行うこと

1. 既存ディレクトリを確認する
2. 主要ファイルを確認する
3. 使用技術と依存関係を確認する
4. 現在の画面と機能を一覧化する
5. 3D関連コードを確認する
6. EC・注文関連コードを確認する
7. 既存データ構造を確認する
8. 残すコードと修正候補を整理する
9. 問題点を重要度順に整理する
10. 3担当に作業を分解する

調査が終わるまでは、大規模な書き換えを行わない。

## 8.4 重要な確認項目

### データ整合性

* ECで選んだ商品と3Dモデルが一致しているか
* 商品IDとモデルIDが正しく対応しているか
* 柄IDとテクスチャが一致しているか
* ロゴ位置と3D表示位置が一致しているか
* サイズと数量が保存されているか
* 表示価格と保存価格が一致しているか
* スクリーンショットが正しい見積もりデータに紐づいているか

### エラー処理

3Dモデルの読み込みに失敗しても、注文導線を止めない。

表示例：

```text
3Dプレビューを読み込めませんでした。
商品画像による確認に切り替えます。
デザイン内容の選択と見積もり依頼は、そのまま続けられます。
```

### モバイル対応

スマートフォンでは以下のいずれかを採用する。

```text
上部：プレビュー
下部：カスタマイズパネル
```

またはタブ方式とする。

```text
デザインする
3Dで確認
料金を見る
```

PCでは以下の2カラム構成を基本とする。

```text
左：3Dまたは2Dプレビュー
右：商品カスタマイズ
```

### パフォーマンス

* GLBモデルの容量を抑える
* テクスチャを圧縮する
* 3Dを遅延読み込みする
* 不要な再レンダリングを防ぐ
* 3D画面を開いていないときは描画処理を軽くする
* 低性能端末向けの軽量モードを用意する
* 読み込み中の表示を用意する
* 画像やモデルのキャッシュを検討する

### セキュリティ

* アップロード可能な形式を制限する
* ファイルサイズを制限する
* MIMEタイプを確認する
* 拡張子だけでファイルを判断しない
* ファイル名を安全に処理する
* 管理画面に認証を設定する
* データベース権限を設定する
* 顧客情報をブラウザへ不要に公開しない
* 注文金額をフロントエンドの値だけで確定しない
* サーバー側でも価格を再計算する
* 入力値を検証する

## 8.5 成果物

* プロジェクト全体設計書
* 現状調査レポート
* ディレクトリ構成
* 共通型定義
* 状態管理設計
* API仕様
* データベース設計
* 担当間インターフェース
* テスト仕様
* エラー一覧
* リリース手順
* 運用マニュアル
* 未実装項目一覧
* 今後の拡張候補一覧

---

# 9. EC担当

## 9.1 役割

あなたは、オリジナルかりゆしウェア注文サイトの商品選択・カスタマイズ・見積もり・注文・顧客対応機能の担当である。

ユーザーが商品仕様を選び、価格を確認し、見積もり依頼または注文を送信できる機能を構築する。

Three.jsやGLBモデル内部の処理は担当しない。

## 9.2 主な責任範囲

* トップページ
* 商品一覧
* 商品詳細
* 商品カスタマイズ画面
* サイズ選択
* 数量選択
* 生地選択
* 色選択
* 柄選択
* 袖や襟の選択
* ポケット選択
* ロゴ画像アップロード
* ロゴ位置選択
* 社名入力
* 刺繍・プリント選択
* 個別名入れ
* 希望納期入力
* 備考入力
* 概算価格計算
* 注文内容確認
* 見積もりフォーム
* 顧客情報入力
* 見積もりデータ保存
* 完了画面
* メール通知
* 管理画面

## 9.3 担当しないこと

* Three.jsのシーン構築
* 3Dカメラ制御
* GLBモデル内部の編集
* ボーン調整
* スキニング
* ウェイト設定
* UV調整
* 3Dモデル作成
* 3Dビューア内部の無断変更

3D表示に問題がある場合は、共通インターフェースを通じて総合担当または3D担当へ報告する。

## 9.4 注文導線

```text
トップページ
↓
商品一覧
↓
商品詳細
↓
商品カスタマイズ
↓
3Dまたは2Dプレビュー確認
↓
注文内容・概算価格確認
↓
見積もり依頼または注文
↓
顧客情報入力
↓
送信完了
```

MVPでは、決済機能よりも見積もり依頼を優先する。

## 9.5 最低限必要なカスタマイズ項目

* メンズ
* レディース
* ユニセックス
* 半袖
* 長袖
* 襟の種類
* ベースカラー
* 生地
* 柄
* サイズ
* 数量
* ポケット
* ロゴの有無
* ロゴ位置
* 社名の有無
* 刺繍またはプリント
* 個別名入れ
* 希望納期
* 備考

## 9.6 価格計算

価格ルールをUIコンポーネント内へ直接ハードコードしない。

```ts
export type PriceRule = {
  basePrice: number;
  fabricAdditionalPrice: number;
  longSleeveAdditionalPrice: number;
  logoPrintPrice: number;
  embroideryPrice: number;
  namePrintPrice: number;
  quantityDiscountRate: number;
};
```

実際には商品、生地、数量条件などに対応できる拡張可能な構造を検討する。

価格計算は、可能であれば純粋関数として実装する。

```ts
export function calculateEstimatedPrice(
  configuration: KariyushiConfiguration,
  priceRules: PriceRule
): PriceBreakdown {
  // 計算処理
}
```

計算結果は内訳を保持する。

```ts
export type PriceBreakdownItem = {
  label: string;
  amount: number;
};

export type PriceBreakdown = {
  items: PriceBreakdownItem[];
  subtotal: number;
  discount: number;
  total: number;
  isEstimate: boolean;
};
```

ユーザーには計算根拠を表示する。

```text
基本料金　　　　　　8,000円
長袖オプション　　　1,000円
ロゴ刺繍　　　　　　1,500円
数量　　　　　　　　10枚
数量割引　　　　　 -5,000円
----------------------------
概算合計　　　　　100,000円
```

正式価格が個別確認になる場合は、必ず以下を表示する。

```text
表示価格は概算です。
仕様、数量、生地、加工内容の確認後に正式なお見積もりをご案内します。
```

## 9.7 見積もり保存項目

* 顧客名
* 会社名
* メールアドレス
* 電話番号
* 希望納期
* 希望数量
* 商品ID
* 商品仕様
* カスタマイズ内容
* ロゴデータ
* 3Dまたは2Dプレビュー画像
* 概算価格
* 価格内訳
* 備考
* 送信日時
* 対応ステータス
* 管理者メモ

## 9.8 管理画面

最低限、以下を確認できるようにする。

* 見積もり依頼一覧
* 顧客情報
* 注文仕様
* ロゴデータ
* プレビュー画像
* 概算価格
* 希望納期
* 対応状況
* 管理者メモ
* ステータス変更

ステータス例：

```ts
export type QuotationStatus =
  | "new"
  | "reviewing"
  | "waiting_customer"
  | "quoted"
  | "approved"
  | "manufacturing"
  | "shipped"
  | "cancelled";
```

日本語表示例：

```text
新規受付
確認中
顧客へ質問中
見積もり送付済み
承認済み
製作中
発送済み
キャンセル
```

## 9.9 3D担当へ渡す情報

EC担当は、共通ストアの `configuration` を更新する。

```ts
updateConfiguration({
  baseColor: selectedColor,
  patternId: selectedPatternId,
});
```

3Dビューア内部のマテリアルやモデルを直接操作しない。

## 9.10 成果物

* トップページ
* 商品一覧
* 商品詳細
* カスタマイズ画面
* 見積もりフォーム
* 注文内容確認画面
* 完了画面
* 商品データ構造
* 価格計算ロジック
* 価格内訳表示
* 顧客データ構造
* 見積もりデータ構造
* 管理画面
* 共通ストア更新機能
* バリデーション
* 3D非対応時の2D代替表示

---

# 10. 3D担当

## 10.1 役割

あなたは、オリジナルかりゆしウェア注文サイトの3D表示・着用シミュレーション担当である。

人体モデル、かりゆしウェア、生地、色、柄、ロゴなどをブラウザ上に表示し、ユーザーが着用イメージを確認できる3Dビューアを構築する。

EC機能、注文保存、顧客管理、決済機能は担当しない。

## 10.2 主な責任範囲

* 3D人体モデルの表示
* かりゆしウェアモデルの表示
* 人体と服の位置合わせ
* モデル切り替え
* 色変更
* 柄・テクスチャ変更
* ロゴ表示
* 社名表示
* 360度回転
* ズーム
* 正面・背面表示
* カメラプリセット
* ライティング
* 背景
* ローディング表示
* エラー表示
* パフォーマンス最適化
* スクリーンショット
* モバイル対応

## 10.3 担当しないこと

* ログイン
* 決済
* 注文保存
* 在庫管理
* 顧客管理
* 管理画面
* メール送信
* 配送料計算
* EC全体の画面設計
* 商品価格計算
* 見積もりフォーム

EC部分を勝手に変更しないこと。

## 10.4 段階的な実装

### Phase 1：3Dビューア基盤

* 人体または着用済みモデルを1体表示する
* カメラを回転できるようにする
* ズームできるようにする
* 正面と背面へ切り替えられるようにする
* ライトを設定する
* ローディング状態を表示する
* 読み込み失敗時にエラーを表示する
* Error Boundaryを設ける
* WebGL非対応時の代替表示を用意する

### Phase 2：かりゆしウェアモデル表示

* 人体と服をセットにしたGLBモデルを表示する
* メンズ、レディース、ユニセックスを切り替える
* 半袖、長袖を切り替える
* モデル切り替え時の位置ずれを確認する
* カメラ位置がモデルごとに大きく変わらないようにする

初期段階では、服を別モデルとして無理に着せ替えず、人体と服をセットにした完成済みGLBモデルを切り替える方式でよい。

### Phase 3：色と柄の変更

* 対象マテリアルを特定する
* ベースカラーを変更する
* 柄画像をテクスチャとして適用する
* UVの向きを確認する
* 柄のスケールを調整する
* 柄の繰り返しサイズを変更できるようにする
* テクスチャ読み込み失敗時に元のマテリアルへ戻す

### Phase 4：ロゴと文字配置

以下のプリセット位置へ表示する。

* 左胸
* 右胸
* 背面
* 左袖
* 右袖

MVPでは完全なドラッグ配置ではなく、プリセット位置方式とする。

位置は3Dモデル内の目印となるMesh、Empty、Nodeなどで管理する。

### Phase 5：スクリーンショット

* 現在のプレビューを画像化する
* 見積もり送信前に保存できるようにする
* 必要に応じて背景色を統一する
* 画像生成失敗時は注文を止めない
* 生成画像を共通ストアまたはコールバックでEC側へ渡す

### Phase 6：高度な着せ替え

MVP完成後、必要性を確認したうえで実施する。

* 服モデルの分離
* 共通スケルトン
* ボーン
* スキニング
* ウェイト
* 体型変形
* モーフターゲット
* クロスシミュレーション

## 10.5 3Dデータ構成

```text
public/
└── models/
    ├── avatars/
    │   ├── male-standard.glb
    │   ├── female-standard.glb
    │   └── unisex-standard.glb
    │
    ├── kariyushi/
    │   ├── mens-short-basic.glb
    │   ├── mens-long-basic.glb
    │   ├── womens-short-basic.glb
    │   └── unisex-short-basic.glb
    │
    └── textures/
        ├── fabrics/
        ├── patterns/
        └── logos/
```

実際の既存構成がある場合は、無理に変更せず調査結果を踏まえて適応する。

## 10.6 モデルカタログ

モデルパス、マテリアル名、ロゴ位置をコンポーネント内へ直接書かない。

設定ファイルで管理する。

```ts
export type ModelCatalogItem = {
  modelPath: string;
  materialName: string;

  camera?: {
    position: [number, number, number];
    target: [number, number, number];
  };

  logoTargets: Partial<
    Record<
      KariyushiConfiguration["logo"]["position"],
      string
    >
  >;
};

export const modelCatalog = {
  mensShortBasic: {
    modelPath: "/models/kariyushi/mens-short-basic.glb",
    materialName: "ShirtFabric",

    camera: {
      position: [0, 1.4, 3],
      target: [0, 1.3, 0],
    },

    logoTargets: {
      leftChest: "Logo_LeftChest",
      rightChest: "Logo_RightChest",
      back: "Logo_Back",
      leftSleeve: "Logo_LeftSleeve",
      rightSleeve: "Logo_RightSleeve",
    },
  },
} satisfies Record<string, ModelCatalogItem>;
```

実際の型エラーがある場合は、共通型を適切に分割して修正すること。

## 10.7 EC担当へ公開するインターフェース

```tsx
type KariyushiViewerProps = {
  configuration: KariyushiConfiguration;

  fallbackImageUrl?: string;

  onLoad?: () => void;

  onError?: (error: Error) => void;

  onScreenshot?: (
    image: Blob | string
  ) => void;
};

export function KariyushiViewer(
  props: KariyushiViewerProps
) {
  // 実装
}
```

利用例：

```tsx
<KariyushiViewer
  configuration={configuration}
  fallbackImageUrl={product.imageUrl}
  onLoad={() => {
    console.log("3D model loaded");
  }}
  onError={(error) => {
    console.error(error);
  }}
  onScreenshot={(image) => {
    savePreviewImage(image);
  }}
/>
```

3D担当は、EC担当から渡された `configuration` に応じて表示を更新する。

## 10.8 成果物

* `KariyushiViewer`
* モデル読み込み処理
* モデル切り替え処理
* マテリアル変更処理
* テクスチャ変更処理
* ロゴ反映処理
* カメラ制御
* ローディング表示
* エラー表示
* スクリーンショット機能
* 2Dフォールバック
* 3Dデータ仕様書
* 対応モデル一覧
* EC担当向けインターフェース仕様
* モデル最適化方針
* 既知の制約一覧

---

# 11. 推奨ディレクトリ構成

```text
src/
├── app/
│   ├── router/
│   └── providers/
│
├── features/
│   ├── configurator/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── store/
│   │   └── types/
│   │
│   ├── viewer3d/
│   │   ├── components/
│   │   ├── loaders/
│   │   ├── materials/
│   │   ├── controls/
│   │   ├── catalog/
│   │   └── types/
│   │
│   ├── products/
│   ├── pricing/
│   ├── quotation/
│   ├── orders/
│   ├── customers/
│   └── admin/
│
├── components/
│   ├── ui/
│   └── layout/
│
├── stores/
│   └── kariyushiStore.ts
│
├── types/
│   ├── configuration.ts
│   ├── product.ts
│   ├── quotation.ts
│   ├── order.ts
│   └── pricing.ts
│
├── services/
│   ├── api/
│   ├── storage/
│   ├── database/
│   └── notifications/
│
├── data/
│   ├── products/
│   ├── patterns/
│   ├── fabrics/
│   ├── modelCatalog/
│   └── priceRules/
│
├── utils/
│
└── tests/
```

既存プロジェクトの構造が大きく異なる場合は、この構成への全面移行を自動的に行わない。

必要な部分だけ段階的に整理すること。

---

# 12. 推奨データ構造

## 12.1 商品

```ts
export type KariyushiProduct = {
  id: string;
  name: string;
  description: string;

  genderOptions: Array<
    "mens" | "womens" | "unisex"
  >;

  sleeveOptions: Array<
    "short" | "long"
  >;

  collarOptions: string[];
  fabricIds: string[];
  patternIds: string[];
  sizeOptions: string[];

  basePrice: number;

  imageUrl: string;
  fallbackImageUrl?: string;

  modelKeys: Partial<
    Record<string, string>
  >;

  isActive: boolean;
};
```

## 12.2 見積もり依頼

```ts
export type CustomerInformation = {
  customerName: string;
  companyName?: string;
  email: string;
  phone: string;
};

export type QuotationRequest = {
  id: string;

  customer: CustomerInformation;

  configuration: KariyushiConfiguration;

  priceBreakdown: PriceBreakdown;

  previewImageUrl?: string;
  logoFileUrl?: string;

  status: QuotationStatus;

  adminMemo?: string;

  createdAt: string;
  updatedAt: string;
};
```

---

# 13. 開発順序

## 第1段階：総合担当による現状調査

最初に以下を行う。

* 現状コードの調査
* 全体要件の整理
* MVP範囲の明確化
* 共通型の作成
* 状態管理方針の決定
* 商品データ構造の決定
* 価格データ構造の決定
* 仮の画面構成作成
* 担当間インターフェースの決定

## 第2段階：EC担当による注文導線

3D部分を仮画像または2D画像にして、先に見積もり導線を完成させる。

* 商品選択
* 色と柄の選択
* 袖と襟の選択
* サイズと数量
* ロゴアップロード
* 価格計算
* 顧客情報入力
* 見積もり送信
* 完了画面
* 管理画面の最低限実装

この時点で、3D機能がなくてもサービスとして成立する状態にする。

## 第3段階：3D担当によるビューア実装

共通型に従って実装する。

* GLB表示
* カメラ操作
* モデル切り替え
* 色変更
* 柄変更
* ロゴ表示
* スクリーンショット
* エラー処理
* 2Dフォールバック

## 第4段階：総合担当による統合

* ECと3Dの状態同期
* モデルと商品IDの対応確認
* 注文データ確認
* スクリーンショット保存確認
* エラー時の継続操作確認
* モバイル確認
* セキュリティ確認
* テスト
* デプロイ
* ドキュメント更新

---

# 14. テスト方針

## 14.1 最低限確認するケース

### 商品カスタマイズ

* 商品を変更すると対応する選択肢が表示される
* 色を変更すると共通状態が更新される
* 柄を変更すると共通状態が更新される
* 数量を変更すると価格が更新される
* ロゴなしでも見積もり依頼できる
* ロゴありの場合は必要項目が検証される

### 価格

* 基本料金が正しく計算される
* 長袖料金が加算される
* 刺繍料金が加算される
* 数量割引が反映される
* 画面表示価格と保存価格が一致する
* サーバー側再計算結果と一致する

### 3D

* モデルが正常に読み込まれる
* モデル切り替えができる
* 色が反映される
* 柄が反映される
* ロゴが反映される
* スクリーンショットが生成される
* 読み込み失敗時に2Dへ切り替わる

### 見積もり

* 必須項目が検証される
* 見積もりデータが保存される
* コンフィギュレーションが欠落しない
* プレビュー画像が保存される
* 完了画面が表示される
* 二重送信を防止できる

### 管理画面

* 未認証ユーザーがアクセスできない
* 見積もり一覧が表示される
* 詳細を確認できる
* ステータスを変更できる
* 管理者メモを保存できる

---

# 15. 実装時の禁止事項

* 調査なしで全面リファクタリングしない
* 既存コードを理由なく削除しない
* すべてを1ファイルに実装しない
* 3D状態と注文状態を別々に管理しない
* 商品データをコンポーネント内へ大量にハードコードしない
* 価格を画面表示だけで確定しない
* ユーザーのアップロードファイルを無検証で保存しない
* 管理画面を認証なしで公開しない
* 3Dエラーによって注文画面全体を停止させない
* 実在しないモデル、素材、APIを存在する前提で実装しない
* 不明点を確定事項として扱わない
* MVP段階で高度な布シミュレーションへ進まない

---

# 16. Codexが最初に実行する指示

あなたは、オリジナルかりゆしウェア注文サイトの総合設計・統合担当です。

既存プロジェクトを調査し、現在の実装状況、使用技術、問題点、不足機能を整理してください。

今回は、いきなり全面的な実装や大規模な書き換えを行わないでください。

最初に以下を実施してください。

1. 既存ディレクトリと主要ファイルの確認
2. `package.json` と依存関係の確認
3. 起動方法とビルド方法の確認
4. 現在実装されている画面と機能の一覧化
5. 3D関連コードの実装状況確認
6. 商品選択・カスタマイズ関連コードの確認
7. 見積もり・注文関連コードの確認
8. 状態管理方法の確認
9. 商品、価格、注文データ構造の確認
10. データベース、ストレージ、認証の確認
11. 既存コードを活かせる部分の特定
12. 問題点を重要度順に整理
13. 3D担当、EC担当、総合担当に分けた開発計画の作成
14. 最初に実装する小さなタスクの提案

出力は以下の形式にしてください。

## 現在の構成

* 使用技術
* ディレクトリ構成
* 主要ファイル
* 状態管理
* 外部サービス

## 現在できていること

機能ごとに整理してください。

## 現在できていないこと

機能ごとに整理してください。

## 問題点

各問題について以下を記載してください。

* 問題内容
* 影響範囲
* 重要度
* 原因
* 修正案

## コードの分類

* 残すコード
* 修正するコード
* 削除候補
* 判断保留

## 担当別の作業

### 総合担当

### EC担当

### 3D担当

## 推奨開発順序

依存関係を考慮して順番を提示してください。

## 最初に着手する小さなタスク

1回の変更で完了でき、動作確認しやすいタスクを1〜3件提示してください。

## 不明点

* コードから確認できた事実
* 現時点の仮説
* 実装前に確認が必要な事項

調査が完了するまでは、大規模なコード変更を行わないでください。

不明点を推測だけで実装せず、調査結果と仮説を明確に分けて記載してください。

---

# 17. 最終的な開発原則

本プロジェクトで最も重要な原則は、最初から「人体モデルに自由に服を着せる高度な3D試着」を完成条件にしないことである。

初期版では、以下を優先する。

1. 3Dなしでも見積もり依頼できる注文導線
2. 共通コンフィギュレーションによる状態の一元管理
3. 服を着用済みの3Dモデル切り替え
4. 色、柄、ロゴの反映
5. スクリーンショット付き見積もり依頼
6. 3D失敗時の2Dフォールバック
7. モバイルでも操作できる画面構成

高度な着せ替え機能は、MVPが正常に動作し、必要性と費用対効果を確認した後に追加すること。
