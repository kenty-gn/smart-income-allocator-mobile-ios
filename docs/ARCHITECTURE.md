# アーキテクチャ

## 技術スタック

| レイヤー | 技術 |
|----------|------|
| フレームワーク | Expo SDK 54 |
| 言語 | TypeScript |
| ナビゲーション | Expo Router |
| 状態管理 | React Context |
| バックエンド | Supabase |
| 認証 | Supabase Auth + SecureStore |

---

## ディレクトリ構成

```
smart-income-allocator-mobile/
├── app/                    # Expo Router pages
│   ├── (auth)/            # 認証フロー（未認証ユーザー）
│   │   ├── _layout.tsx
│   │   └── login.tsx
│   ├── (tabs)/            # メインアプリ（認証済みユーザー）
│   │   ├── _layout.tsx    # タブナビゲーション設定
│   │   ├── index.tsx      # ホーム/ダッシュボード
│   │   ├── analytics.tsx  # 分析画面
│   │   └── settings.tsx   # 設定画面
│   ├── _layout.tsx        # ルートレイアウト（AuthProvider）
│   ├── modal.tsx          # モーダル画面
│   └── +not-found.tsx     # 404画面
├── assets/                 # 画像・フォント
├── components/             # 再利用可能コンポーネント
├── constants/              # 定数（Colors等）
├── contexts/               # React Context
│   └── AuthContext.tsx
├── hooks/                  # カスタムフック
├── lib/                    # ユーティリティ
│   └── supabase.ts
├── types/                  # TypeScript型定義
│   └── database.ts
└── docs/                   # ドキュメント
```

---

## 認証フロー

```
┌─────────────┐
│   App起動   │
└──────┬──────┘
       ▼
┌─────────────┐     未認証     ┌─────────────┐
│ AuthContext │───────────────▶│ ログイン画面 │
│ セッション  │                 └──────┬──────┘
│   チェック  │                        │
└──────┬──────┘                        │ログイン成功
       │認証済み                       ▼
       ▼                        ┌─────────────┐
┌─────────────┐                 │ SecureStore │
│ タブ画面    │◀────────────────│ トークン保存 │
└─────────────┘                 └─────────────┘
```

---

## データフロー

```
┌─────────────┐
│   Supabase  │ ◀──── 同じデータベース
│  (クラウド)  │
└──────┬──────┘
       │
       ▼
┌─────────────┐     ┌─────────────┐
│  Webアプリ   │     │  iOSアプリ   │
│  (Next.js)  │     │  (Expo)     │
└─────────────┘     └─────────────┘
```

---

## Supabase テーブル

| テーブル | 用途 |
|----------|------|
| `profiles` | ユーザープロフィール、Proプラン状態 |
| `categories` | 支出カテゴリ（固定費/変動費） |
| `transactions` | 収入・支出トランザクション |

詳細は `types/database.ts` を参照。
