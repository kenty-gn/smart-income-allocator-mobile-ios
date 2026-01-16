# API リファレンス

## Supabase クライアント

### インポート
```typescript
import { supabase } from '@/lib/supabase';
```

### 認証

#### ログイン
```typescript
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password123',
});
```

#### ログアウト
```typescript
await supabase.auth.signOut();
```

#### セッション取得
```typescript
const { data: { session } } = await supabase.auth.getSession();
```

---

## データベース操作

### Transactions

#### 全件取得
```typescript
const { data, error } = await supabase
  .from('transactions')
  .select('*')
  .eq('user_id', userId);
```

#### 追加
```typescript
const { data, error } = await supabase
  .from('transactions')
  .insert({
    user_id: userId,
    category_id: categoryId,
    amount: 1500,
    date: '2026-01-16',
    description: 'ランチ',
    type: 'expense',
  });
```

### Categories

#### 取得
```typescript
const { data, error } = await supabase
  .from('categories')
  .select('*')
  .eq('user_id', userId);
```

### Profiles

#### 取得
```typescript
const { data, error } = await supabase
  .from('profiles')
  .select('*')
  .eq('id', userId)
  .single();
```

#### 更新
```typescript
const { error } = await supabase
  .from('profiles')
  .update({ target_income: 350000 })
  .eq('id', userId);
```

---

## 型定義

### Transaction
```typescript
interface Transaction {
  id: string;
  user_id: string;
  category_id: string;
  amount: number;
  date: string;
  description: string;
  type: 'income' | 'expense';
}
```

### Category
```typescript
interface Category {
  id: string;
  user_id: string;
  name: string;
  type: 'fixed' | 'variable';
  target_amount: number | null;
  target_percentage: number | null;
  color: string;
}
```

### Profile
```typescript
interface Profile {
  id: string;
  salary_day: number;
  target_income: number;
  subscription_tier: 'free' | 'pro';
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
}
```

---

## AuthContext

### 使用方法
```typescript
import { useAuth } from '@/contexts/AuthContext';

function MyComponent() {
  const { user, profile, isPro, signIn, signOut } = useAuth();
  
  // ...
}
```

### 提供される値
| プロパティ | 型 | 説明 |
|-----------|-----|------|
| `user` | `User \| null` | 現在のユーザー |
| `session` | `Session \| null` | セッション情報 |
| `profile` | `Profile \| null` | プロフィール |
| `isPro` | `boolean` | Proプランかどうか |
| `isLoading` | `boolean` | ロード中かどうか |
| `signIn` | `function` | ログイン関数 |
| `signOut` | `function` | ログアウト関数 |
| `refreshProfile` | `function` | プロフィール再取得 |
