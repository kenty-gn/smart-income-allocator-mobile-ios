import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Category, Transaction } from '@/types/database';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

export default function TransactionsScreen() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'income' | 'expense'>('all');

  // Edit modal state
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [editAmount, setEditAmount] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editCategoryId, setEditCategoryId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  const fetchData = async () => {
    if (!user) return;
    try {
      const [transRes, catRes] = await Promise.all([
        supabase
          .from('transactions')
          .select('*')
          .eq('user_id', user.id)
          .order('date', { ascending: false })
          .order('created_at', { ascending: false }),
        supabase.from('categories').select('*').eq('user_id', user.id),
      ]);
      if (transRes.data) setTransactions(transRes.data);
      if (catRes.data) setCategories(catRes.data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  const getCategoryName = (categoryId: string | null) => {
    if (!categoryId) return '未分類';
    const cat = categories.find(c => c.id === categoryId);
    return cat?.name || '未分類';
  };

  const getCategoryColor = (categoryId: string | null) => {
    if (!categoryId) return '#94a3b8';
    const cat = categories.find(c => c.id === categoryId);
    return cat?.color || '#94a3b8';
  };

  const filteredTransactions = transactions.filter(t => {
    if (filter === 'all') return true;
    return t.type === filter;
  });

  const openEditModal = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setEditAmount(String(transaction.amount));
    setEditDescription(transaction.description || '');
    setEditCategoryId(transaction.category_id);
    setEditModalVisible(true);
  };

  const handleSave = async () => {
    if (!editingTransaction || !editAmount) return;

    const numAmount = parseInt(editAmount.replace(/[^0-9]/g, ''));
    if (isNaN(numAmount) || numAmount <= 0) {
      Alert.alert('エラー', '有効な金額を入力してください');
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('transactions')
        .update({
          amount: numAmount,
          description: editDescription || null,
          category_id: editCategoryId,
        })
        .eq('id', editingTransaction.id);

      if (error) throw error;

      setEditModalVisible(false);
      fetchData();
      Alert.alert('保存完了', '取引を更新しました');
    } catch (error) {
      console.error('Error:', error);
      Alert.alert('エラー', '保存に失敗しました');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = (transaction: Transaction) => {
    Alert.alert(
      '取引を削除',
      `この取引（${formatCurrency(Number(transaction.amount))}）を削除しますか？`,
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '削除',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('transactions')
                .delete()
                .eq('id', transaction.id);
              if (error) throw error;
              fetchData();
            } catch (error) {
              console.error('Error:', error);
              Alert.alert('エラー', '削除に失敗しました');
            }
          },
        },
      ]
    );
  };

  // Group by month
  const groupedTransactions = filteredTransactions.reduce((acc, t) => {
    const date = new Date(t.date);
    const key = `${date.getFullYear()}年${date.getMonth() + 1}月`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(t);
    return acc;
  }, {} as Record<string, Transaction[]>);

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
          title: '取引履歴',
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={24} color="#0f172a" />
            </TouchableOpacity>
          ),
        }}
      />

      <View style={styles.container}>
        {/* Filter */}
        <View style={styles.filterRow}>
          {(['all', 'expense', 'income'] as const).map(f => (
            <TouchableOpacity
              key={f}
              style={[styles.filterButton, filter === f && styles.filterButtonActive]}
              onPress={() => setFilter(f)}
            >
              <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
                {f === 'all' ? '全て' : f === 'income' ? '収入' : '支出'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          {Object.keys(groupedTransactions).length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="receipt-outline" size={48} color="#cbd5e1" />
              <Text style={styles.emptyText}>取引がありません</Text>
            </View>
          ) : (
            Object.entries(groupedTransactions).map(([month, items]) => (
              <View key={month} style={styles.monthSection}>
                <Text style={styles.monthTitle}>{month}</Text>
                {items.map(t => (
                  <TouchableOpacity
                    key={t.id}
                    style={styles.transactionItem}
                    onPress={() => openEditModal(t)}
                    onLongPress={() => handleDelete(t)}
                  >
                    <View
                      style={[
                        styles.categoryDot,
                        { backgroundColor: getCategoryColor(t.category_id) },
                      ]}
                    />
                    <View style={styles.transactionInfo}>
                      <Text style={styles.transactionCategory}>
                        {t.type === 'income' ? '収入' : getCategoryName(t.category_id)}
                      </Text>
                      {t.description && (
                        <Text style={styles.transactionDesc}>{t.description}</Text>
                      )}
                    </View>
                    <View style={styles.transactionRight}>
                      <Text
                        style={[
                          styles.transactionAmount,
                          t.type === 'income'
                            ? styles.incomeAmount
                            : styles.expenseAmount,
                        ]}
                      >
                        {t.type === 'income' ? '+' : '-'}
                        {formatCurrency(Number(t.amount))}
                      </Text>
                      <Text style={styles.transactionDate}>{formatDate(t.date)}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            ))
          )}

          <Text style={styles.hint}>タップで編集、長押しで削除</Text>
        </ScrollView>
      </View>

      {/* Edit Modal */}
      <Modal visible={editModalVisible} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setEditModalVisible(false)}>
              <Text style={styles.cancelText}>キャンセル</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>取引を編集</Text>
            <View style={{ width: 70 }} />
          </View>

          <ScrollView style={styles.modalContent}>
            {/* Amount */}
            <Text style={styles.label}>金額</Text>
            <TextInput
              style={styles.input}
              value={editAmount}
              onChangeText={setEditAmount}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor="#94a3b8"
            />

            {/* Description */}
            <Text style={styles.label}>メモ</Text>
            <TextInput
              style={styles.input}
              value={editDescription}
              onChangeText={setEditDescription}
              placeholder="メモ（任意）"
              placeholderTextColor="#94a3b8"
            />

            {/* Category (only for expense) */}
            {editingTransaction?.type === 'expense' && (
              <>
                <Text style={styles.label}>カテゴリ</Text>
                <View style={styles.categoryGrid}>
                  {categories.map(cat => (
                    <TouchableOpacity
                      key={cat.id}
                      style={[
                        styles.categoryChip,
                        editCategoryId === cat.id && styles.categoryChipActive,
                        editCategoryId === cat.id && { borderColor: cat.color },
                      ]}
                      onPress={() => setEditCategoryId(cat.id)}
                    >
                      <View style={[styles.chipDot, { backgroundColor: cat.color }]} />
                      <Text
                        style={[
                          styles.categoryChipText,
                          editCategoryId === cat.id && styles.categoryChipTextActive,
                        ]}
                      >
                        {cat.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}

            {/* Save */}
            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleSave}
              disabled={isSaving}
            >
              <LinearGradient colors={['#10b981', '#14b8a6']} style={styles.saveGradient}>
                {isSaving ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={styles.saveText}>保存</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  filterRow: {
    flexDirection: 'row',
    padding: 16,
    paddingBottom: 8,
    gap: 8,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#e2e8f0',
    alignItems: 'center',
  },
  filterButtonActive: { backgroundColor: '#10b981' },
  filterText: { fontSize: 14, fontWeight: '500', color: '#64748b' },
  filterTextActive: { color: 'white' },
  content: { padding: 16, paddingTop: 8, paddingBottom: 100 },
  emptyContainer: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 16, color: '#94a3b8', marginTop: 12 },
  monthSection: { marginBottom: 24 },
  monthTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 8,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    gap: 12,
  },
  categoryDot: { width: 12, height: 12, borderRadius: 6 },
  transactionInfo: { flex: 1 },
  transactionCategory: { fontSize: 14, fontWeight: '500', color: '#0f172a' },
  transactionDesc: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  transactionRight: { alignItems: 'flex-end' },
  transactionAmount: { fontSize: 16, fontWeight: '600' },
  incomeAmount: { color: '#10b981' },
  expenseAmount: { color: '#f43f5e' },
  transactionDate: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  hint: { fontSize: 12, color: '#94a3b8', textAlign: 'center', marginTop: 16 },
  modalContainer: { flex: 1, backgroundColor: '#f8fafc' },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    backgroundColor: 'white',
  },
  cancelText: { fontSize: 16, color: '#64748b' },
  modalTitle: { fontSize: 18, fontWeight: '600', color: '#0f172a' },
  modalContent: { padding: 20 },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748b',
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#0f172a',
  },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: 'white',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'transparent',
    gap: 6,
  },
  categoryChipActive: { backgroundColor: '#f8fafc' },
  chipDot: { width: 8, height: 8, borderRadius: 4 },
  categoryChipText: { fontSize: 14, color: '#64748b' },
  categoryChipTextActive: { color: '#0f172a', fontWeight: '600' },
  saveButton: { marginTop: 32, borderRadius: 16, overflow: 'hidden' },
  saveGradient: { paddingVertical: 16, alignItems: 'center' },
  saveText: { fontSize: 18, fontWeight: '600', color: 'white' },
});
