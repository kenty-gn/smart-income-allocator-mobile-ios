# デプロイガイド

> 最終更新: 2026-01-17

## 前提条件

- Expo アカウント（[expo.dev](https://expo.dev)）
- Apple Developer Program（年間$99）

---

## EAS Build

### 1. EAS CLIを使用（npx推奨）
```bash
# ログイン（初回のみ）
npx eas-cli login

# ビルド設定
npx eas-cli build:configure
```

### 2. ビルド実行

#### 開発ビルド（シミュレータ用）
```bash
npx eas-cli build --profile development --platform ios
```

#### プレビュービルド（TestFlight用）
```bash
npx eas-cli build --profile preview --platform ios
```

#### 本番ビルド（App Store用）
```bash
npx eas-cli build --profile production --platform ios
```

---

## 環境変数の設定

### EASシークレット（推奨）
```bash
npx eas-cli secret:create --name EXPO_PUBLIC_SUPABASE_URL --value "https://..."
npx eas-cli secret:create --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "..."
```

### 確認
```bash
npx eas-cli secret:list
```

---

## App Storeへの提出

### 1. Apple Developer Programに登録
https://developer.apple.com/programs/

### 2. App Store Connectでアプリを作成

### 3. EASでSubmit
```bash
npx eas-cli submit --platform ios
```

---

## eas.json 設定

```json
{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "ios": { "simulator": true }
    },
    "preview": {
      "distribution": "internal"
    },
    "production": {
      "autoIncrement": true
    }
  }
}
```

---

## app.json 設定

```json
{
  "expo": {
    "name": "smart-income-allocator-mobile",
    "ios": {
      "bundleIdentifier": "com.smartbudget.app",
      "buildNumber": "1"
    }
  }
}
```

---

## バージョニング

| バージョン | 意味 |
|------------|------|
| `x.0.0` | メジャー（破壊的変更） |
| `0.x.0` | マイナー（新機能） |
| `0.0.x` | パッチ（バグ修正） |

### 自動インクリメント
```bash
npx eas-cli build --auto-increment
```

---

## トラブルシューティング

### EAS CLI権限エラー
グローバルインストールではなくnpxを使用：
```bash
npx eas-cli <command>
```

### ビルドエラー
```bash
npx expo doctor
```
