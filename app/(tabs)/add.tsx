import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { supabase } from '@/lib/supabase';
import { Category, TransactionType } from '@/types/database';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

export default function AddTransactionScreen() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<TransactionType>('expense');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (user) {
      fetchCategories();
    }
  }, [user]);

  const fetchCategories = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const { data } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', user.id);
      if (data) {
        setCategories(data);
        // デフォルトで最初のカテゴリを選択
        if (data.length > 0 && !selectedCategory) {
          setSelectedCategory(data[0].id);
        }
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNumberPress = (num: string) => {
    if (num === 'C') {
      setAmount('');
    } else if (num === '←') {
      setAmount(prev => prev.slice(0, -1));
    } else {
      // 最大10桁まで
      if (amount.length < 10) {
        setAmount(prev => prev + num);
      }
    }
  };

  const handleSave = async () => {
    if (!user) return;
    if (!amount || amount === '0') {
      Alert.alert('エラー', '金額を入力してください');
      return;
    }
    if (!selectedCategory && type === 'expense') {
      Alert.alert('エラー', 'カテゴリを選択してください');
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase.from('transactions').insert({
        user_id: user.id,
        category_id: selectedCategory,
        amount: parseInt(amount),
        date: new Date().toISOString().split('T')[0],
        description: description || (type === 'income' ? '収入' : '支出'),
        type,
      });

      if (error) throw error;

      Alert.alert('保存完了', '取引を保存しました', [
        {
          text: 'OK',
          onPress: () => {
            setAmount('');
            setDescription('');
          },
        },
      ]);
    } catch (error) {
      console.error('Error saving transaction:', error);
      Alert.alert('エラー', '保存に失敗しました');
    } finally {
      setIsSaving(false);
    }
  };

  const formatCurrency = (value: string) => {
    if (!value) return '¥0';
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY',
      maximumFractionDigits: 0,
    }).format(parseInt(value));
  };

  const numberPad = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '←'];

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color="#10b981" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.content}>
        {/* Type Toggle */}
        <View style={styles.typeToggle}>
          <TouchableOpacity
            style={[styles.typeButton, type === 'expense' && styles.typeButtonActive]}
            onPress={() => setType('expense')}
          >
            <Ionicons
              name="arrow-down-circle"
              size={20}
              color={type === 'expense' ? 'white' : '#64748b'}
            />
            <Text style={[styles.typeText, type === 'expense' && styles.typeTextActive]}>
              支出
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.typeButton, type === 'income' && styles.typeButtonActiveIncome]}
            onPress={() => setType('income')}
          >
            <Ionicons
              name="arrow-up-circle"
              size={20}
              color={type === 'income' ? 'white' : '#64748b'}
            />
            <Text style={[styles.typeText, type === 'income' && styles.typeTextActive]}>
              収入
            </Text>
          </TouchableOpacity>
        </View>

        {/* Amount Display */}
        <View style={styles.amountContainer}>
          <Text style={[styles.amount, type === 'income' && styles.amountIncome]}>
            {formatCurrency(amount)}
          </Text>
        </View>

        {/* Category Selector (only for expense) */}
        {type === 'expense' && (
          <View style={styles.categorySection}>
            <Text style={styles.sectionTitle}>カテゴリ</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.categoryList}>
                {categories.map(cat => (
                  <TouchableOpacity
                    key={cat.id}
                    style={[
                      styles.categoryChip,
                      selectedCategory === cat.id && styles.categoryChipActive,
                      selectedCategory === cat.id && { borderColor: cat.color },
                    ]}
                    onPress={() => setSelectedCategory(cat.id)}
                  >
                    <View style={[styles.categoryDot, { backgroundColor: cat.color }]} />
                    <Text
                      style={[
                        styles.categoryChipText,
                        selectedCategory === cat.id && styles.categoryChipTextActive,
                      ]}
                    >
                      {cat.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
        )}

        {/* Memo Input */}
        <View style={styles.memoSection}>
          <Text style={styles.sectionTitle}>メモ（任意）</Text>
          <TextInput
            style={styles.memoInput}
            placeholder="例：ランチ代"
            placeholderTextColor="#94a3b8"
            value={description}
            onChangeText={setDescription}
          />
        </View>

        {/* Number Pad */}
        <View style={styles.numberPad}>
          {numberPad.map(num => (
            <TouchableOpacity
              key={num}
              style={styles.numberButton}
              onPress={() => handleNumberPress(num)}
            >
              <Text
                style={[
                  styles.numberText,
                  (num === 'C' || num === '←') && styles.numberTextAction,
                ]}
              >
                {num}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleSave}
          disabled={isSaving}
        >
          <LinearGradient
            colors={type === 'income' ? ['#10b981', '#14b8a6'] : ['#f43f5e', '#fb7185']}
            style={styles.saveGradient}
          >
            {isSaving ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={20} color="white" />
                <Text style={styles.saveText}>保存</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
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
  typeToggle: {
    flexDirection: 'row',
    backgroundColor: '#e2e8f0',
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
  },
  typeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 6,
  },
  typeButtonActive: {
    backgroundColor: '#f43f5e',
  },
  typeButtonActiveIncome: {
    backgroundColor: '#10b981',
  },
  typeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748b',
  },
  typeTextActive: {
    color: 'white',
  },
  amountContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  amount: {
    fontSize: 48,
    fontWeight: '700',
    color: '#f43f5e',
  },
  amountIncome: {
    color: '#10b981',
  },
  categorySection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 8,
  },
  categoryList: {
    flexDirection: 'row',
    gap: 8,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: 'white',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'transparent',
    gap: 6,
  },
  categoryChipActive: {
    backgroundColor: '#f8fafc',
  },
  categoryDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  categoryChipText: {
    fontSize: 14,
    color: '#64748b',
  },
  categoryChipTextActive: {
    color: '#0f172a',
    fontWeight: '600',
  },
  memoSection: {
    marginBottom: 20,
  },
  memoInput: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: '#0f172a',
  },
  numberPad: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  numberButton: {
    width: '31%',
    aspectRatio: 2,
    backgroundColor: 'white',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  numberText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#0f172a',
  },
  numberTextAction: {
    color: '#64748b',
  },
  saveButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  saveGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  saveText: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
  },
});
