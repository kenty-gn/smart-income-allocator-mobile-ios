import SavingsGoal from '@/components/SavingsGoal';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Category, Transaction } from '@/types/database';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { PieChart } from 'react-native-gifted-charts';

const screenWidth = Dimensions.get('window').width;

export default function AnalyticsScreen() {
  const { user, isPro, profile } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

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
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const totalExpense = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  // カテゴリ別支出データ
  const pieChartData = useMemo(() => {
    const categorySpending = categories.map(cat => {
      const spent = transactions
        .filter(t => t.category_id === cat.id && t.type === 'expense')
        .reduce((sum, t) => sum + Number(t.amount), 0);
      return { ...cat, spent };
    }).filter(c => c.spent > 0);

    if (categorySpending.length === 0) return [];

    return categorySpending.map(cat => ({
      value: cat.spent,
      color: cat.color,
      text: cat.name,
      focused: false,
    }));
  }, [categories, transactions]);

  // 貯蓄率計算
  const savingsRate = totalIncome > 0
    ? Math.round(((totalIncome - totalExpense) / totalIncome) * 100)
    : 0;

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#10b981" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#10b981" />
      }
    >
      <Text style={styles.title}>分析</Text>

      {/* Summary Cards */}
      <View style={styles.row}>
        <View style={[styles.statCard, { backgroundColor: '#dcfce7' }]}>
          <Ionicons name="trending-up" size={20} color="#10b981" />
          <Text style={styles.statLabel}>総収入</Text>
          <Text style={[styles.statValue, { color: '#10b981' }]}>
            {formatCurrency(totalIncome)}
          </Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#fee2e2' }]}>
          <Ionicons name="trending-down" size={20} color="#ef4444" />
          <Text style={styles.statLabel}>総支出</Text>
          <Text style={[styles.statValue, { color: '#ef4444' }]}>
            {formatCurrency(totalExpense)}
          </Text>
        </View>
      </View>

      {/* Savings */}
      <View style={styles.savingsCard}>
        <LinearGradient colors={['#10b981', '#14b8a6']} style={styles.savingsGradient}>
          <Ionicons name="wallet" size={24} color="white" />
          <View style={{ flex: 1 }}>
            <Text style={styles.savingsLabel}>貯蓄額</Text>
            <Text style={styles.savingsValue}>
              {formatCurrency(totalIncome - totalExpense)}
            </Text>
          </View>
          <View style={styles.savingsRateBadge}>
            <Text style={styles.savingsRateText}>{savingsRate}%</Text>
          </View>
        </LinearGradient>
      </View>

      {/* Savings Goal */}
      {isPro && (
        <SavingsGoal
          currentSavings={totalIncome - totalExpense}
          targetAmount={profile?.target_income || 500000}
          monthlyIncome={totalIncome}
          monthlyExpense={totalExpense}
        />
      )}

      {/* Pie Chart */}
      {pieChartData.length > 0 && (
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>カテゴリ別支出</Text>
          <View style={styles.chartContainer}>
            <PieChart
              data={pieChartData}
              donut
              radius={screenWidth * 0.28}
              innerRadius={screenWidth * 0.16}
              centerLabelComponent={() => (
                <View style={styles.centerLabel}>
                  <Text style={styles.centerLabelValue}>
                    {formatCurrency(totalExpense)}
                  </Text>
                  <Text style={styles.centerLabelText}>合計</Text>
                </View>
              )}
            />
          </View>
          {/* Legend */}
          <View style={styles.legendContainer}>
            {pieChartData.map((item, index) => (
              <View key={index} style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: item.color }]} />
                <Text style={styles.legendText}>{item.text}</Text>
                <Text style={styles.legendValue}>{formatCurrency(item.value)}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* No Data */}
      {pieChartData.length === 0 && (
        <View style={styles.emptyCard}>
          <Ionicons name="pie-chart-outline" size={48} color="#cbd5e1" />
          <Text style={styles.emptyText}>支出データがありません</Text>
          <Text style={styles.emptySubText}>「追加」タブから支出を入力してください</Text>
        </View>
      )}

      {/* Pro Feature */}
      {!isPro && (
        <View style={styles.proCard}>
          <View style={styles.proIconContainer}>
            <Ionicons name="sparkles" size={24} color="white" />
          </View>
          <Text style={styles.proTitle}>Pro機能</Text>
          <Text style={styles.proDescription}>
            AI分析と支出予測を利用できます
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: 16, paddingBottom: 100 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: '700', color: '#0f172a', marginBottom: 20 },
  row: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  statCard: { flex: 1, borderRadius: 16, padding: 16, alignItems: 'center' },
  statLabel: { fontSize: 12, color: '#64748b', marginTop: 8 },
  statValue: { fontSize: 18, fontWeight: '700', marginTop: 4 },
  savingsCard: { marginBottom: 16, borderRadius: 16, overflow: 'hidden' },
  savingsGradient: { flexDirection: 'row', alignItems: 'center', padding: 20, gap: 16 },
  savingsLabel: { fontSize: 12, color: 'rgba(255,255,255,0.8)' },
  savingsValue: { fontSize: 24, fontWeight: '700', color: 'white' },
  savingsRateBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  savingsRateText: { fontSize: 16, fontWeight: '700', color: 'white' },
  chartCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  chartTitle: { fontSize: 16, fontWeight: '600', color: '#0f172a', marginBottom: 16 },
  chartContainer: { alignItems: 'center', marginBottom: 16 },
  centerLabel: { alignItems: 'center' },
  centerLabelValue: { fontSize: 16, fontWeight: '700', color: '#0f172a' },
  centerLabelText: { fontSize: 12, color: '#64748b' },
  legendContainer: { gap: 8 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  legendDot: { width: 12, height: 12, borderRadius: 6 },
  legendText: { flex: 1, fontSize: 14, color: '#64748b' },
  legendValue: { fontSize: 14, fontWeight: '600', color: '#0f172a' },
  emptyCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyText: { fontSize: 16, fontWeight: '500', color: '#64748b', marginTop: 12 },
  emptySubText: { fontSize: 14, color: '#94a3b8', marginTop: 4 },
  proCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  proIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f59e0b',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  proTitle: { fontSize: 16, fontWeight: '600', color: '#0f172a', marginBottom: 4 },
  proDescription: { fontSize: 14, color: '#64748b', textAlign: 'center' },
});
