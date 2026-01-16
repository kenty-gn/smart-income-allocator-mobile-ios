# 開発ガイド

## セットアップ

### 1. 依存関係インストール
```bash
npm install
```

### 2. 環境変数設定
`.env` ファイルを作成:
```
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

### 3. 開発サーバー起動
```bash
npx expo start
```

---

## 開発ワークフロー

### ホットリロード
Expoは自動でホットリロードします。ファイル保存時に即座に反映。

### TypeScriptチェック
```bash
npx tsc --noEmit
```

### コード整形
```bash
npx prettier --write .
```

---

## 新機能の追加

### 新しい画面を追加
1. `app/(tabs)/` に新しいファイルを作成
2. `app/(tabs)/_layout.tsx` にタブを追加

### 新しいコンポーネントを追加
1. `components/` にファイルを作成
2. 必要に応じてスタイルを定義

### 新しいAPIエンドポイントを追加
1. `lib/` にAPI関数を作成
2. Supabaseクライアントを使用してクエリ実行

---

## デバッグ

### React Native Debugger
```bash
npx expo start --dev-client
```

### コンソールログ
`console.log()` はターミナルに出力されます。

### Supabaseログ
Supabaseダッシュボード > Logs で確認可能。

---

## テスト

### 単体テスト
```bash
npm test
```

### E2Eテスト（Detox）
```bash
npm run e2e
```

---

## トラブルシューティング

### Metro Bundlerがクラッシュする
```bash
npx expo start --clear
```

### 依存関係の問題
```bash
rm -rf node_modules
npm install
```

### iOSシミュレータが起動しない
```bash
xcrun simctl shutdown all
xcrun simctl boot "iPhone 15 Pro"
```

---

## Git設定

### セキュリティ設定
このプロジェクトでは以下のセキュリティ設定を適用しています：

#### .gitignoreで保護されるファイル
- `.env` - 環境変数（**絶対にコミットしない**）
- `*.pem`, `*.key` - 秘密鍵
- `*.p12`, `*.jks` - 証明書
- `secrets/`, `credentials/` - 機密情報ディレクトリ

#### ローカルGit設定
```bash
# 改行コードの正規化
git config --local core.autocrlf input
git config --local core.safecrlf true

# プッシュ・プル設定
git config --local push.default current
git config --local pull.rebase true

# 差分・マージの改善
git config --local diff.algorithm histogram
git config --local merge.conflictStyle zdiff3

# コンフリクト解決の記録
git config --local rerere.enabled true
```

### 新規開発者のセットアップ
1. リポジトリをクローン
2. `.env.example` を `.env` にコピー
3. 環境変数を設定
4. `npm install` を実行

```bash
git clone <repository-url>
cd smart-income-allocator-mobile
cp .env.example .env
# .envを編集して環境変数を設定
npm install
```

### ブランチ戦略
- `main` - 本番用ブランチ
- `develop` - 開発用ブランチ
- `feature/*` - 機能開発
- `fix/*` - バグ修正
- `hotfix/*` - 緊急修正

### コミットメッセージ規約
```
feat: 新機能
fix: バグ修正
docs: ドキュメント
style: コード整形
refactor: リファクタリング
test: テスト
chore: ビルド・ツール
```

