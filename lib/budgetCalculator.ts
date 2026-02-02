/**
 * AI予算計算サービス
 * 月収から50/30/20ルールに基づいて推奨予算配分を計算
 */

export interface BudgetRecommendation {
  categoryName: string;
  type: 'fixed' | 'variable' | 'savings';
  percentage: number;
  amount: number;
}

export interface BudgetPlan {
  monthlyIncome: number;
  fixedTotal: number;
  variableTotal: number;
  savingsTarget: number;
  recommendations: BudgetRecommendation[];
}

// デフォルトの予算配分（50/30/20ルール）
const BUDGET_ALLOCATIONS: Record<string, { type: 'fixed' | 'variable' | 'savings'; percentage: number }> = {
  // 固定費 50%
  '家賃': { type: 'fixed', percentage: 30 },
  '光熱費': { type: 'fixed', percentage: 5 },
  '通信費': { type: 'fixed', percentage: 5 },
  '保険': { type: 'fixed', percentage: 10 },
  // 変動費 30%
  '食費': { type: 'variable', percentage: 15 },
  '交通費': { type: 'variable', percentage: 5 },
  '娯楽': { type: 'variable', percentage: 5 },
  '買い物': { type: 'variable', percentage: 3 },
  'その他': { type: 'variable', percentage: 2 },
  // 貯蓄 20%
  '貯蓄': { type: 'savings', percentage: 20 },
};

/**
 * 月収から推奨予算を計算
 */
export function calculateBudgetPlan(monthlyIncome: number): BudgetPlan {
  const recommendations: BudgetRecommendation[] = Object.entries(BUDGET_ALLOCATIONS).map(
    ([categoryName, { type, percentage }]) => ({
      categoryName,
      type,
      percentage,
      amount: Math.round((monthlyIncome * percentage) / 100),
    })
  );

  const fixedTotal = recommendations
    .filter(r => r.type === 'fixed')
    .reduce((sum, r) => sum + r.amount, 0);

  const variableTotal = recommendations
    .filter(r => r.type === 'variable')
    .reduce((sum, r) => sum + r.amount, 0);

  const savingsTarget = recommendations
    .filter(r => r.type === 'savings')
    .reduce((sum, r) => sum + r.amount, 0);

  return {
    monthlyIncome,
    fixedTotal,
    variableTotal,
    savingsTarget,
    recommendations,
  };
}

/**
 * カテゴリ名から推奨予算を取得
 */
export function getRecommendedBudget(categoryName: string, monthlyIncome: number): number | null {
  const allocation = BUDGET_ALLOCATIONS[categoryName];
  if (!allocation) return null;
  return Math.round((monthlyIncome * allocation.percentage) / 100);
}

/**
 * 進捗率を計算（0-100%、超過時は100以上）
 */
export function calculateProgress(spent: number, target: number): number {
  if (target <= 0) return 0;
  return Math.round((spent / target) * 100);
}

/**
 * 進捗状態を判定
 */
export type ProgressStatus = 'safe' | 'warning' | 'danger';

export function getProgressStatus(progressPercent: number): ProgressStatus {
  if (progressPercent < 70) return 'safe';
  if (progressPercent < 100) return 'warning';
  return 'danger';
}

/**
 * 通貨フォーマット
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('ja-JP', {
    style: 'currency',
    currency: 'JPY',
    maximumFractionDigits: 0,
  }).format(amount);
}
