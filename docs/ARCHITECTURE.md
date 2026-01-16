# アーキテクチャ

> 最終更新: 2026-01-16

## 技術スタック

| レイヤー | 技術 |
|----------|------|
| フレームワーク | Expo SDK 54 |
| 言語 | TypeScript |
| ナビゲーション | Expo Router |
| 状態管理 | React Context |
| バックエンド | Supabase |
| 認証 | Supabase Auth + SecureStore |
| グラフ | react-native-gifted-charts |

---

## ディレクトリ構成

```
smart-income-allocator-mobile/
├── app/                        # Expo Router pages
│   ├── (auth)/                 # 認証フロー（未認証ユーザー）
│   │   ├── _layout.tsx
│   │   └── login.tsx
│   ├── (tabs)/                 # メインアプリ（認証済みユーザー）
│   │   ├── _layout.tsx         # タブナビゲーション設定
│   │   ├── index.tsx           # ホーム/ダッシュボード
│   │   ├── add.tsx             # トランザクション追加 ★
│   │   ├── analytics.tsx       # 分析画面（円グラフ）
│   │   └── settings.tsx        # 設定画面（テーマ切替）
│   ├── categories.tsx          # カテゴリ管理画面 ★
│   ├── _layout.tsx             # ルートレイアウト
│   └── +not-found.tsx          # 404画面
├── components/                  # 再利用可能コンポーネント
│   ├── AIAdviceCard.tsx        # AI支出アドバイス ★
│   ├── EditSettingModal.tsx    # 設定編集モーダル ★
│   └── SavingsGoal.tsx         # 貯蓄目標 ★
├── contexts/                    # React Context
│   ├── AuthContext.tsx         # 認証状態管理
│   └── ThemeContext.tsx        # テーマ管理（ダークモード）★
├── lib/                         # ユーティリティ
│   └── supabase.ts
├── types/                       # TypeScript型定義
│   └── database.ts
└── docs/                        # ドキュメント
```

★ = Phase 1-3 で新規追加

---

## 画面構成

### タブナビゲーション
| タブ | ファイル | 機能 |
|------|----------|------|
| ホーム | `index.tsx` | 収支サマリー、AIアドバイス |
| 追加 | `add.tsx` | トランザクション入力 |
| 分析 | `analytics.tsx` | 円グラフ、貯蓄目標 |
| 設定 | `settings.tsx` | プロフィール、テーマ切替 |

### スタンドアロン画面
| 画面 | ファイル | 機能 |
|------|----------|------|
| カテゴリ管理 | `categories.tsx` | 追加/編集/削除 |

---

## コンポーネント

| コンポーネント | 用途 |
|----------------|------|
| `AIAdviceCard` | 支出パターン分析とアドバイス（Pro機能） |
| `SavingsGoal` | 貯蓄目標の進捗表示（Pro機能） |
| `EditSettingModal` | 汎用設定編集モーダル |
| `ErrorBoundary` | グローバルエラーハンドリング |

---

## Context

| Context | 用途 |
|---------|------|
| `AuthContext` | ユーザー認証、プロフィール、Pro判定 |
| `ThemeContext` | ライト/ダーク/システム連動テーマ |

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
