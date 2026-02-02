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

### npmスクリプト一覧
| コマンド | 説明 |
|----------|------|
| `npm start` | Expo開発サーバー起動 |
| `npm run ios` | iOSシミュレータで起動 |
| `npm run android` | Androidエミュレータで起動 |
| `npm run web` | Webブラウザで起動 |
| `npm run lint` | ESLintでコード品質チェック |
| `npm run lint:fix` | ESLintで自動修正 |
| `npm run format` | Prettierでコード整形 |
| `npm run format:check` | フォーマットチェック（修正しない） |
| `npm run typecheck` | TypeScript型チェック |
| `npm run test` | テスト実行 |
| `npm run prebuild` | ビルド前チェック（typecheck + lint） |
| `npm run clean` | 依存関係リセット |

---

## コード品質ツール

### ESLint
コードの品質と一貫性を保つためのリンター。

```bash
# 全ファイルをチェック
npm run lint

# 自動修正可能な問題を修正
npm run lint:fix
```

**設定ファイル**: `.eslintrc.json`

主なルール:
- TypeScript厳格モード
- React Hooks ルール
- 未使用変数の警告（`_`プレフィックスは除外）
- Prettier統合

### Prettier
コードフォーマッター。保存時に自動整形されます。

```bash
# 全ファイルを整形
npm run format

# 整形が必要なファイルをチェック
npm run format:check
```

**設定ファイル**: `.prettierrc`

設定内容:
| 項目 | 値 |
|------|-----|
| セミコロン | あり |
| クォート | シングル |
| インデント | 2スペース |
| 末尾カンマ | ES5準拠 |
| 行幅 | 100文字 |
| 改行コード | LF |

### TypeScriptチェック
```bash
npm run typecheck
```


---

## VSCode設定

このプロジェクトにはVSCode用の設定が含まれています。

### 自動設定（.vscode/settings.json）
- **保存時自動フォーマット**: ファイル保存時にPrettierで自動整形
- **保存時ESLint修正**: ESLintエラーを自動修正
- **インポート整理**: 未使用インポートの削除と並べ替え
- **デフォルトフォーマッター**: Prettier

### 推奨拡張機能（.vscode/extensions.json）
VSCodeを開くと、以下の拡張機能のインストールを促されます：

| 拡張機能 | 用途 |
|----------|------|
| `expo.vscode-expo-tools` | Expo開発ツール |
| `dbaeumer.vscode-eslint` | ESLint統合 |
| `esbenp.prettier-vscode` | Prettier統合 |
| `bradlc.vscode-tailwindcss` | Tailwind CSS |
| `formulahendry.auto-rename-tag` | タグ自動リネーム |
| `christian-kohler.path-intellisense` | パス補完 |
| `streetsidesoftware.code-spell-checker` | スペルチェック |

### 手動インストール
```bash
# 推奨拡張機能を一括インストール
code --install-extension expo.vscode-expo-tools
code --install-extension dbaeumer.vscode-eslint
code --install-extension esbenp.prettier-vscode
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

### ソーシャル認証（Google/Apple）がExpo Goで動作しない
**原因**: Expo Goにはネイティブ認証モジュールが含まれていないため、Google/Appleログインはサポートされていません。

**解決策**: Development Buildを作成してテストする
```bash
# EAS CLIをインストール
npm install -g eas-cli

# EASにログイン
eas login

# Development Buildを作成
eas build --profile development --platform ios
```

**開発中の代替**: メール/パスワード認証はExpo Goでも動作します。

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

