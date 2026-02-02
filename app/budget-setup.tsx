import { useAuth } from '@/contexts/AuthContext';
import { calculateBudgetPlan, formatCurrency } from '@/lib/budgetCalculator';
import { supabase } from '@/lib/supabase';
import { Category } from '@/types/database';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

export default function BudgetSetupScreen() {
  const { user, profile, isPro } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [monthlyIncome, setMonthlyIncome] = useState('');
  const [budgetTargets, setBudgetTargets] = useState<Record<string, number>>({});

  useEffect(() => {
    if (user) {
      fetchCategories();
      if (profile?.target_income) {
        setMonthlyIncome(String(profile.target_income));
        calculateBudgets(profile.target_income);
      }
    }
  }, [user, profile]);

  const fetchCategories = async () => {
    if (!user) return;
    try {
      const { data } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', user.id);
      if (data) setCategories(data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateBudgets = (income: number) => {
    const plan = calculateBudgetPlan(income);
    const targets: Record<string, number> = {};
    plan.recommendations.forEach(rec => {
      if (rec.type !== 'savings') {
        targets[rec.categoryName] = rec.amount;
      }
    });
    setBudgetTargets(targets);
  };

  const handleIncomeChange = (value: string) => {
    setMonthlyIncome(value);
    const numValue = parseInt(value.replace(/[^0-9]/g, ''));
    if (!isNaN(numValue) && numValue > 0) {
      calculateBudgets(numValue);
    }
  };

  const handleTargetChange = (categoryName: string, value: string) => {
    const numValue = parseInt(value.replace(/[^0-9]/g, '')) || 0;
    setBudgetTargets(prev => ({
      ...prev,
      [categoryName]: numValue,
    }));
  };

  const handleApplyAll = async () => {
    if (!user || !isPro) {
      Alert.alert('Pro機能', 'AI予算設定はPro機能です。アップグレードしてください。');
      return;
    }

    setIsSaving(true);
    try {
      // 各カテゴリの目標を更新
      for (const category of categories) {
        const target = budgetTargets[category.name];
        if (target !== undefined) {
          await supabase
            .from('categories')
            .update({ target_amount: target })
            .eq('id', category.id);
        }
      }

      Alert.alert('完了', '予算目標を設定しました！', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error) {
      console.error('Error:', error);
      Alert.alert('エラー', '保存に失敗しました');
    } finally {
      setIsSaving(false);
    }
  };

  const plan = monthlyIncome
    ? calculateBudgetPlan(parseInt(monthlyIncome.replace(/[^0-9]/g, '')) || 0)
    : null;

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#10b981" />
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: 'AI予算設定',
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={24} color="#0f172a" />
            </TouchableOpacity>
          ),
        }}
      />

      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Header */}
        <LinearGradient colors={['#3b82f6', '#6366f1']} style={styles.headerCard}>
          <Ionicons name="sparkles" size={24} color="white" />
          <Text style={styles.headerTitle}>AI予算アドバイザー</Text>
          <Text style={styles.headerDesc}>
            月収を入力すると、50/30/20ルールに基づいて{'\n'}最適な予算配分を提案します
          </Text>
        </LinearGradient>

        {/* Income Input */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>月収を入力</Text>
          <View style={styles.incomeInputContainer}>
            <Text style={styles.currencyPrefix}>¥</Text>
            <TextInput
              style={styles.incomeInput}
              value={monthlyIncome}
              onChangeText={handleIncomeChange}
              keyboardType="numeric"
              placeholder="300000"
              placeholderTextColor="#94a3b8"
            />
          </View>
        </View>

        {/* Budget Summary */}
        {plan && plan.monthlyIncome > 0 && (
          <>
            <View style={styles.summaryRow}>
              <View style={[styles.summaryCard, { backgroundColor: '#fef3c7' }]}>
                <Text style={styles.summaryLabel}>固定費 (50%)</Text>
                <Text style={styles.summaryAmount}>{formatCurrency(plan.fixedTotal)}</Text>
              </View>
              <View style={[styles.summaryCard, { backgroundColor: '#dbeafe' }]}>
                <Text style={styles.summaryLabel}>変動費 (30%)</Text>
                <Text style={styles.summaryAmount}>{formatCurrency(plan.variableTotal)}</Text>
              </View>
              <View style={[styles.summaryCard, { backgroundColor: '#d1fae5' }]}>
                <Text style={styles.summaryLabel}>貯蓄 (20%)</Text>
                <Text style={styles.summaryAmount}>{formatCurrency(plan.savingsTarget)}</Text>
              </View>
            </View>

            {/* Category Budgets */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>カテゴリ別目標</Text>
              <Text style={styles.sectionHint}>金額は自由に編集できます</Text>

              {categories.map(cat => {
                const recommended = budgetTargets[cat.name] || 0;
                return (
                  <View key={cat.id} style={styles.categoryRow}>
                    <View style={[styles.categoryDot, { backgroundColor: cat.color }]} />
                    <Text style={styles.categoryName}>{cat.name}</Text>
                    <View style={styles.categoryInputContainer}>
                      <Text style={styles.inputPrefix}>¥</Text>
                      <TextInput
                        style={styles.categoryInput}
                        value={recommended ? String(recommended) : ''}
                        onChangeText={(v) => handleTargetChange(cat.name, v)}
                        keyboardType="numeric"
                        placeholder="0"
                        placeholderTextColor="#94a3b8"
                      />
                    </View>
                  </View>
                );
              })}
            </View>

            {/* Apply Button */}
            <TouchableOpacity
              style={styles.applyButton}
              onPress={handleApplyAll}
              disabled={isSaving}
            >
              <LinearGradient colors={['#10b981', '#14b8a6']} style={styles.applyGradient}>
                {isSaving ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle" size={20} color="white" />
                    <Text style={styles.applyText}>この予算で設定する</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {!isPro && (
              <View style={styles.proNotice}>
                <Ionicons name="lock-closed" size={16} color="#a855f7" />
                <Text style={styles.proNoticeText}>
                  予算設定の適用にはProプランが必要です
                </Text>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: 16, paddingBottom: 100 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerCard: {
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: 'white',
    marginTop: 8,
  },
  headerDesc: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 18,
  },
  section: { marginBottom: 20 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 8,
  },
  sectionHint: {
    fontSize: 12,
    color: '#94a3b8',
    marginBottom: 12,
  },
  incomeInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    paddingHorizontal: 16,
  },
  currencyPrefix: {
    fontSize: 24,
    fontWeight: '600',
    color: '#64748b',
  },
  incomeInput: {
    flex: 1,
    fontSize: 32,
    fontWeight: '700',
    color: '#0f172a',
    paddingVertical: 16,
    marginLeft: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  summaryCard: {
    flex: 1,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 11,
    color: '#64748b',
    marginBottom: 4,
  },
  summaryAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    gap: 12,
  },
  categoryDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  categoryName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: '#0f172a',
  },
  categoryInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  inputPrefix: {
    fontSize: 14,
    color: '#64748b',
  },
  categoryInput: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
    minWidth: 60,
    textAlign: 'right',
  },
  applyButton: {
    marginTop: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  applyGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  applyText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  proNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 16,
    padding: 12,
    backgroundColor: '#f3e8ff',
    borderRadius: 12,
  },
  proNoticeText: {
    fontSize: 13,
    color: '#a855f7',
  },
});
