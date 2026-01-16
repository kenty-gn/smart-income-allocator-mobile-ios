import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface SavingsGoalProps {
  currentSavings: number;
  targetAmount: number;
  monthlyIncome: number;
  monthlyExpense: number;
}

export default function SavingsGoal({
  currentSavings,
  targetAmount,
  monthlyIncome,
  monthlyExpense,
}: SavingsGoalProps) {
  const progress = targetAmount > 0 ? Math.min(currentSavings / targetAmount, 1) : 0;
  const progressPercent = Math.round(progress * 100);

  const estimatedMonths = useMemo(() => {
    const monthlySavings = monthlyIncome - monthlyExpense;
    if (monthlySavings <= 0) return null;
    const remaining = targetAmount - currentSavings;
    if (remaining <= 0) return 0;
    return Math.ceil(remaining / monthlySavings);
  }, [currentSavings, targetAmount, monthlyIncome, monthlyExpense]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getProgressColor = () => {
    if (progress >= 1) return '#10b981';
    if (progress >= 0.7) return '#3b82f6';
    if (progress >= 0.4) return '#f59e0b';
    return '#ef4444';
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Ionicons name="flag" size={20} color="#10b981" />
          <Text style={styles.title}>貯蓄目標</Text>
        </View>
        {progress >= 1 && (
          <View style={styles.achievedBadge}>
            <Ionicons name="checkmark" size={12} color="white" />
            <Text style={styles.achievedText}>達成！</Text>
          </View>
        )}
      </View>

      <View style={styles.amountRow}>
        <Text style={styles.currentAmount}>{formatCurrency(currentSavings)}</Text>
        <Text style={styles.separator}>/</Text>
        <Text style={styles.targetAmount}>{formatCurrency(targetAmount)}</Text>
      </View>

      <View style={styles.progressBarBg}>
        <View
          style={[
            styles.progressBarFill,
            { width: `${progressPercent}%`, backgroundColor: getProgressColor() },
          ]}
        />
      </View>

      <View style={styles.footer}>
        <Text style={styles.percentText}>{progressPercent}%</Text>
        {estimatedMonths !== null && estimatedMonths > 0 && (
          <Text style={styles.estimateText}>
            あと約{estimatedMonths}ヶ月で達成
          </Text>
        )}
        {estimatedMonths === 0 && (
          <Text style={[styles.estimateText, { color: '#10b981' }]}>
            目標達成おめでとう！
          </Text>
        )}
        {estimatedMonths === null && (
          <Text style={[styles.estimateText, { color: '#ef4444' }]}>
            毎月の貯蓄を増やしましょう
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
  },
  achievedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10b981',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  achievedText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 12,
  },
  currentAmount: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0f172a',
  },
  separator: {
    fontSize: 20,
    color: '#94a3b8',
    marginHorizontal: 4,
  },
  targetAmount: {
    fontSize: 16,
    color: '#64748b',
  },
  progressBarBg: {
    height: 8,
    backgroundColor: '#e2e8f0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  percentText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
  },
  estimateText: {
    fontSize: 12,
    color: '#94a3b8',
  },
});
