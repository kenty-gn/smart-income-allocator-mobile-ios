# Smart Income Allocator - iOS App

Expo + React NativeベースのiOSアプリ。WebアプリとSupabaseバックエンドを共有。

## 🚀 クイックスタート

```bash
# 依存関係インストール
npm install

# 開発サーバー起動
npx expo start
```

起動後:
- `i` - iOSシミュレータ
- `a` - Androidエミュレータ
- QRコード - Expo Goアプリで実機テスト

---

## 📁 プロジェクト構成

```
app/
├── (auth)/          # 認証画面（ログイン）
├── (tabs)/          # メイン画面（タブナビゲーション）
│   ├── index.tsx    # ダッシュボード
│   ├── analytics.tsx # 分析
│   └── settings.tsx # 設定
└── _layout.tsx      # ルートレイアウト

contexts/
└── AuthContext.tsx  # 認証状態管理

lib/
└── supabase.ts      # Supabaseクライアント

types/
└── database.ts      # 型定義
```

---

## 🔐 環境変数

`.env` ファイルに以下を設定:

```
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

---

## 📦 ビルド

### 開発ビルド
```bash
npx expo prebuild
npx expo run:ios
```

### 本番ビルド（EAS）
```bash
npm install -g eas-cli
eas build --platform ios
```

---

## 🔗 関連プロジェクト

- Webアプリ: `../smart-income-allocator/`
- Supabaseダッシュボード: https://supabase.com/dashboard
