import { Category, Transaction } from '@/types/database';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface AIAdviceCardProps {
  transactions: Transaction[];
  categories: Category[];
  isPro: boolean;
  targetIncome: number;
}

interface Advice {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  message: string;
  type: 'success' | 'warning' | 'tip';
}

export default function AIAdviceCard({
  transactions,
  categories,
  isPro,
  targetIncome,
}: AIAdviceCardProps) {
  const advice = useMemo((): Advice => {
    if (!isPro) {
      return {
        icon: 'sparkles',
        title: 'Pro機能',
        message: 'Proにアップグレードして、AI分析による節約アドバイスを受けましょう',
        type: 'tip',
      };
    }

    const totalExpense = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const totalIncome = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const savingsRate = totalIncome > 0 ? (totalIncome - totalExpense) / totalIncome : 0;

    // カテゴリ別支出を計算
    const categorySpending = categories.map(cat => ({
      ...cat,
      spent: transactions
        .filter(t => t.category_id === cat.id && t.type === 'expense')
        .reduce((sum, t) => sum + Number(t.amount), 0),
    }));

    const topSpending = categorySpending.sort((a, b) => b.spent - a.spent)[0];

    // アドバイスの生成
    if (savingsRate >= 0.3) {
      return {
        icon: 'checkmark-circle',
        title: '素晴らしい！',
        message: `貯蓄率${Math.round(savingsRate * 100)}%は目標達成ペースです。このまま継続しましょう！`,
        type: 'success',
      };
    } else if (savingsRate >= 0.1) {
      return {
        icon: 'trending-up',
        title: '順調です',
        message: topSpending
          ? `${topSpending.name}への支出を見直すと、さらに貯蓄を増やせます`
          : '支出パターンを分析中...',
        type: 'tip',
      };
    } else if (savingsRate >= 0) {
      return {
        icon: 'alert-circle',
        title: '注意が必要',
        message: topSpending
          ? `${topSpending.name}が支出の大部分を占めています。予算を設定しましょう`
          : '収支バランスに注意してください',
        type: 'warning',
      };
    } else {
      return {
        icon: 'warning',
        title: '赤字警告',
        message: '支出が収入を上回っています。固定費の見直しをおすすめします',
        type: 'warning',
      };
    }
  }, [transactions, categories, isPro, targetIncome]);

  const getColors = (): [string, string] => {
    if (!isPro) return ['#a855f7', '#7c3aed'];
    switch (advice.type) {
      case 'success':
        return ['#10b981', '#14b8a6'];
      case 'warning':
        return ['#f59e0b', '#f97316'];
      default:
        return ['#3b82f6', '#6366f1'];
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={getColors()} style={styles.gradient}>
        <View style={styles.iconContainer}>
          <Ionicons name={advice.icon} size={24} color="white" />
        </View>
        <View style={styles.content}>
          <Text style={styles.title}>{advice.title}</Text>
          <Text style={styles.message}>{advice.message}</Text>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  gradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
    marginBottom: 2,
  },
  message: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.9)',
    lineHeight: 18,
  },
});
