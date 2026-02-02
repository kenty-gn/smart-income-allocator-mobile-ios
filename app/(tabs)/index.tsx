import AIAdviceCard from '@/components/AIAdviceCard';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { calculateProgress, formatCurrency, getProgressStatus } from '@/lib/budgetCalculator';
import { supabase } from '@/lib/supabase';
import { BudgetSummary, Category, Transaction } from '@/types/database';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export default function DashboardScreen() {
  const { user, profile, isPro } = useAuth();
  const { colors } = useTheme();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const targetIncome = profile?.target_income || 300000;

  const fetchData = async () => {
    if (!user) return;

    try {
      const [transRes, catRes] = await Promise.all([
        supabase.from('transactions').select('*').eq('user_id', user.id),
        supabase.from('categories').select('*').eq('user_id', user.id),
      ]);

      if (transRes.data) setTransactions(transRes.data);
      if (catRes.data) setCategories(catRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const budgetSummary: BudgetSummary = useMemo(() => {
    const fixedCosts = categories
      .filter((c) => c.type === 'fixed')
      .reduce((sum, c) => {
        const spent = transactions
          .filter((t) => t.category_id === c.id && t.type === 'expense')
          .reduce((s, t) => s + Number(t.amount), 0);
        return sum + spent;
      }, 0);

    const totalIncome = transactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const disposableIncome = targetIncome - fixedCosts;

    const variableSpent = categories
      .filter((c) => c.type === 'variable')
      .reduce((sum, c) => {
        const spent = transactions
          .filter((t) => t.category_id === c.id && t.type === 'expense')
          .reduce((s, t) => s + Number(t.amount), 0);
        return sum + spent;
      }, 0);

    return {
      total_income: Math.max(totalIncome, targetIncome),
      fixed_costs: fixedCosts,
      disposable_income: disposableIncome,
      variable_spent: variableSpent,
      remaining: disposableIncome - variableSpent,
    };
  }, [categories, transactions, targetIncome]);

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color="#10b981" />
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#10b981" />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.greeting, { color: colors.textSecondary }]}>おかえりなさい 👋</Text>
        <Text style={[styles.title, { color: colors.text }]}>今月の予算</Text>
      </View>

      {/* AI Advice Card */}
      <AIAdviceCard
        transactions={transactions}
        categories={categories}
        isPro={isPro}
        targetIncome={targetIncome}
      />

      {/* Budget Card */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>収支サマリー</Text>
          <LinearGradient
            colors={['#10b981', '#14b8a6']}
            style={styles.iconBadge}
          >
            <Ionicons name="trending-up" size={16} color="white" />
          </LinearGradient>
        </View>

        <Text style={styles.incomeLabel}>総収入</Text>
        <Text style={styles.incomeAmount}>
          {formatCurrency(budgetSummary.total_income)}
        </Text>

        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFilled,
                {
                  width: `${Math.min((budgetSummary.fixed_costs / budgetSummary.total_income) * 100, 100)}%`,
                  backgroundColor: '#f43f5e',
                },
              ]}
            />
            <View
              style={[
                styles.progressFilled,
                {
                  width: `${Math.min((budgetSummary.variable_spent / budgetSummary.total_income) * 100, 100)}%`,
                  backgroundColor: '#f59e0b',
                },
              ]}
            />
          </View>
        </View>

        {/* Legend */}
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#f43f5e' }]} />
            <Text style={styles.legendLabel}>固定費</Text>
            <Text style={styles.legendValue}>{formatCurrency(budgetSummary.fixed_costs)}</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#f59e0b' }]} />
            <Text style={styles.legendLabel}>変動費</Text>
            <Text style={styles.legendValue}>{formatCurrency(budgetSummary.variable_spent)}</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#10b981' }]} />
            <Text style={styles.legendLabel}>残り</Text>
            <Text style={[styles.legendValue, { color: budgetSummary.remaining >= 0 ? '#10b981' : '#f43f5e' }]}>
              {formatCurrency(budgetSummary.remaining)}
            </Text>
          </View>
        </View>
      </View>

      {/* Pro Badge */}
      {isPro && (
        <View style={styles.proBadge}>
          <Ionicons name="sparkles" size={14} color="#a855f7" />
          <Text style={styles.proText}>PRO</Text>
        </View>
      )}

      {/* Categories */}
      <View style={styles.categorySectionHeader}>
        <Text style={styles.sectionTitle}>カテゴリ別</Text>
        <TouchableOpacity onPress={() => router.push('/budget-setup')}>
          <Text style={styles.seeAllText}>AI設定 →</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.categoriesGrid}>
        {categories.slice(0, 6).map((cat) => {
          const spent = transactions
            .filter((t) => t.category_id === cat.id && t.type === 'expense')
            .reduce((sum, t) => sum + Number(t.amount), 0);
          const target = cat.target_amount || 0;
          const progress = target > 0 ? calculateProgress(spent, target) : null;
          const status = progress !== null ? getProgressStatus(progress) : null;

          return (
            <View key={cat.id} style={styles.categoryCard}>
              <View style={[styles.categoryColor, { backgroundColor: cat.color }]} />
              <Text style={styles.categoryName}>{cat.name}</Text>
              <Text style={styles.categoryAmount}>{formatCurrency(spent)}</Text>
              {target > 0 && (
                <>
                  <View style={styles.progressContainer}>
                    <View style={styles.progressBg}>
                      <View
                        style={[
                          styles.progressBar,
                          {
                            width: `${Math.min(progress || 0, 100)}%`,
                            backgroundColor:
                              status === 'safe' ? '#10b981' :
                              status === 'warning' ? '#f59e0b' : '#ef4444',
                          },
                        ]}
                      />
                    </View>
                  </View>
                  <Text style={styles.targetText}>
                    目標: {formatCurrency(target)}
                  </Text>
                </>
              )}
            </View>
          );
        })}
      </View>

      {/* Recent Transactions */}
      <View style={styles.recentHeader}>
        <Text style={styles.sectionTitle}>直近の取引</Text>
        <TouchableOpacity onPress={() => router.push('/transactions')}>
          <Text style={styles.seeAllText}>全て見る →</Text>
        </TouchableOpacity>
      </View>
      {transactions.slice(0, 3).map((t) => {
        const cat = categories.find((c) => c.id === t.category_id);
        return (
          <TouchableOpacity
            key={t.id}
            style={styles.recentItem}
            onPress={() => router.push('/transactions')}
          >
            <View style={[styles.recentDot, { backgroundColor: cat?.color || '#94a3b8' }]} />
            <View style={styles.recentInfo}>
              <Text style={styles.recentCategory}>
                {t.type === 'income' ? '収入' : cat?.name || '未分類'}
              </Text>
              {t.description && <Text style={styles.recentDesc}>{t.description}</Text>}
            </View>
            <Text
              style={[
                styles.recentAmount,
                t.type === 'income' ? styles.incomeColor : styles.expenseColor,
              ]}
            >
              {t.type === 'income' ? '+' : '-'}{formatCurrency(Number(t.amount))}
            </Text>
          </TouchableOpacity>
        );
      })}
      {transactions.length === 0 && (
        <View style={styles.emptyRecent}>
          <Text style={styles.emptyText}>取引がありません</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  content: {
    padding: 16,
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    marginBottom: 20,
  },
  greeting: {
    fontSize: 14,
    color: '#64748b',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0f172a',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
  },
  iconBadge: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  incomeLabel: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
  },
  incomeAmount: {
    fontSize: 32,
    fontWeight: '700',
    color: '#0f172a',
    textAlign: 'center',
    marginBottom: 20,
  },
  progressContainer: {
    marginBottom: 20,
  },
  progressBar: {
    height: 12,
    backgroundColor: '#e2e8f0',
    borderRadius: 6,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  progressFilled: {
    height: '100%',
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  legendItem: {
    alignItems: 'center',
    flex: 1,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginBottom: 4,
  },
  legendLabel: {
    fontSize: 11,
    color: '#64748b',
    marginBottom: 2,
  },
  legendValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
  },
  proBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#f3e8ff',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 16,
    gap: 4,
  },
  proText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#a855f7',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 12,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  categoryCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    width: '47%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  categoryColor: {
    width: 32,
    height: 32,
    borderRadius: 10,
    marginBottom: 8,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#0f172a',
    marginBottom: 4,
  },
  categoryAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
  },
  recentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 12,
  },
  seeAllText: {
    fontSize: 14,
    color: '#10b981',
    fontWeight: '500',
  },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    gap: 12,
  },
  recentDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  recentInfo: {
    flex: 1,
  },
  recentCategory: {
    fontSize: 14,
    fontWeight: '500',
    color: '#0f172a',
  },
  recentDesc: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 2,
  },
  recentAmount: {
    fontSize: 16,
    fontWeight: '600',
  },
  incomeColor: {
    color: '#10b981',
  },
  expenseColor: {
    color: '#f43f5e',
  },
  emptyRecent: {
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#94a3b8',
  },
  categorySectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressBg: {
    height: 6,
    backgroundColor: '#e2e8f0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  targetText: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 4,
  },
});
