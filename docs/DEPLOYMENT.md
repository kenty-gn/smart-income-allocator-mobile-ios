# デプロイガイド

## EAS Build（推奨）

### 1. EAS CLIインストール
```bash
npm install -g eas-cli
eas login
```

### 2. プロジェクト設定
```bash
eas build:configure
```

### 3. ビルド実行

#### 開発ビルド
```bash
eas build --profile development --platform ios
```

#### プレビュービルド（TestFlight用）
```bash
eas build --profile preview --platform ios
```

#### 本番ビルド（App Store用）
```bash
eas build --profile production --platform ios
```

---

## App Storeへの提出

### 1. Apple Developer Programに登録
https://developer.apple.com/programs/

### 2. App Store Connectでアプリを作成

### 3. EASでSubmit
```bash
eas submit --platform ios
```

---

## 環境別設定

### app.json
```json
{
  "expo": {
    "name": "SmartBudget",
    "slug": "smart-income-allocator-mobile",
    "version": "1.0.0",
    "ios": {
      "bundleIdentifier": "com.yourcompany.smartbudget",
      "buildNumber": "1"
    }
  }
}
```

### eas.json
```json
{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal"
    },
    "production": {}
  }
}
```

---

## 環境変数（本番）

EASシークレットを使用:
```bash
eas secret:create --name EXPO_PUBLIC_SUPABASE_URL --value "https://..."
eas secret:create --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "..."
```

---

## バージョニング

### セマンティックバージョニング
- `x.0.0` - メジャー（破壊的変更）
- `0.x.0` - マイナー（新機能）
- `0.0.x` - パッチ（バグ修正）

### ビルド番号
App Store提出ごとにインクリメント:
```bash
eas build --auto-increment
```
