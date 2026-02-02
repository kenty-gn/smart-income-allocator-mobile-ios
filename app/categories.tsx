import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Category, CategoryType } from '@/types/database';
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

const COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#eab308',
  '#84cc16', '#22c55e', '#10b981', '#14b8a6',
  '#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1',
  '#8b5cf6', '#a855f7', '#d946ef', '#ec4899',
];

export default function CategoriesScreen() {
  const { user, isPro } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [type, setType] = useState<CategoryType>('variable');
  const [color, setColor] = useState(COLORS[0]);
  const [targetAmount, setTargetAmount] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (user) fetchCategories();
  }, [user]);

  const fetchCategories = async () => {
    if (!user) return;
    try {
      const { data } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', user.id)
        .order('type', { ascending: true });
      if (data) setCategories(data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const openModal = (category?: Category) => {
    if (category) {
      setEditingCategory(category);
      setName(category.name);
      setType(category.type);
      setColor(category.color);
      setTargetAmount(category.target_amount ? String(category.target_amount) : '');
    } else {
      setEditingCategory(null);
      setName('');
      setType('variable');
      setColor(COLORS[Math.floor(Math.random() * COLORS.length)]);
      setTargetAmount('');
    }
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!user || !name.trim()) {
      Alert.alert('エラー', 'カテゴリ名を入力してください');
      return;
    }

    setIsSaving(true);
    const parsedTarget = targetAmount ? parseInt(targetAmount.replace(/[^0-9]/g, '')) : null;
    try {
      if (editingCategory) {
        // Update
        const { error } = await supabase
          .from('categories')
          .update({
            name: name.trim(),
            type,
            color,
            target_amount: isPro ? parsedTarget : editingCategory.target_amount,
          })
          .eq('id', editingCategory.id);
        if (error) throw error;
      } else {
        // Insert
        const { error } = await supabase.from('categories').insert({
          user_id: user.id,
          name: name.trim(),
          type,
          color,
          target_amount: isPro ? parsedTarget : null,
          target_percentage: null,
        });
        if (error) throw error;
      }

      setModalVisible(false);
      fetchCategories();
    } catch (error) {
      console.error('Error:', error);
      Alert.alert('エラー', '保存に失敗しました');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = (category: Category) => {
    Alert.alert(
      'カテゴリを削除',
      `「${category.name}」を削除しますか？\nこのカテゴリに関連する取引は削除されません。`,
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '削除',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('categories')
                .delete()
                .eq('id', category.id);
              if (error) throw error;
              fetchCategories();
            } catch (error) {
              console.error('Error:', error);
              Alert.alert('エラー', '削除に失敗しました');
            }
          },
        },
      ]
    );
  };

  const fixedCategories = categories.filter(c => c.type === 'fixed');
  const variableCategories = categories.filter(c => c.type === 'variable');

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
          title: 'カテゴリ管理',
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={24} color="#0f172a" />
            </TouchableOpacity>
          ),
        }}
      />

      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Fixed Costs */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>固定費</Text>
          {fixedCategories.map(cat => (
            <TouchableOpacity
              key={cat.id}
              style={styles.categoryItem}
              onPress={() => openModal(cat)}
              onLongPress={() => handleDelete(cat)}
            >
              <View style={[styles.categoryColor, { backgroundColor: cat.color }]} />
              <Text style={styles.categoryName}>{cat.name}</Text>
              <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
            </TouchableOpacity>
          ))}
          {fixedCategories.length === 0 && (
            <Text style={styles.emptyText}>固定費カテゴリがありません</Text>
          )}
        </View>

        {/* Variable Costs */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>変動費</Text>
          {variableCategories.map(cat => (
            <TouchableOpacity
              key={cat.id}
              style={styles.categoryItem}
              onPress={() => openModal(cat)}
              onLongPress={() => handleDelete(cat)}
            >
              <View style={[styles.categoryColor, { backgroundColor: cat.color }]} />
              <Text style={styles.categoryName}>{cat.name}</Text>
              <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
            </TouchableOpacity>
          ))}
          {variableCategories.length === 0 && (
            <Text style={styles.emptyText}>変動費カテゴリがありません</Text>
          )}
        </View>

        <Text style={styles.hint}>
          タップで編集、長押しで削除
        </Text>

        {/* Add Button */}
        <TouchableOpacity style={styles.addButton} onPress={() => openModal()}>
          <LinearGradient colors={['#10b981', '#14b8a6']} style={styles.addGradient}>
            <Ionicons name="add" size={24} color="white" />
            <Text style={styles.addText}>カテゴリを追加</Text>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>

      {/* Modal */}
      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Text style={styles.cancelText}>キャンセル</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {editingCategory ? 'カテゴリを編集' : '新規カテゴリ'}
            </Text>
            <View style={{ width: 70 }} />
          </View>

          <ScrollView style={styles.modalContent}>
            {/* Name */}
            <Text style={styles.label}>カテゴリ名</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="例：食費"
              placeholderTextColor="#94a3b8"
            />

            {/* Type */}
            <Text style={styles.label}>種類</Text>
            <View style={styles.typeRow}>
              <TouchableOpacity
                style={[styles.typeButton, type === 'fixed' && styles.typeButtonActive]}
                onPress={() => setType('fixed')}
              >
                <Text style={[styles.typeText, type === 'fixed' && styles.typeTextActive]}>
                  固定費
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.typeButton, type === 'variable' && styles.typeButtonActive]}
                onPress={() => setType('variable')}
              >
                <Text style={[styles.typeText, type === 'variable' && styles.typeTextActive]}>
                  変動費
                </Text>
              </TouchableOpacity>
            </View>

            {/* Color */}
            <Text style={styles.label}>色</Text>
            <View style={styles.colorGrid}>
              {COLORS.map(c => (
                <TouchableOpacity
                  key={c}
                  style={[
                    styles.colorOption,
                    { backgroundColor: c },
                    color === c && styles.colorOptionActive,
                  ]}
                  onPress={() => setColor(c)}
                >
                  {color === c && <Ionicons name="checkmark" size={16} color="white" />}
                </TouchableOpacity>
              ))}
            </View>

            {/* Target Amount (Pro Feature) */}
            <View style={styles.targetSection}>
              <View style={styles.targetHeader}>
                <Text style={styles.label}>月間予算目標</Text>
                {!isPro && (
                  <View style={styles.proBadge}>
                    <Ionicons name="sparkles" size={10} color="#a855f7" />
                    <Text style={styles.proBadgeText}>PRO</Text>
                  </View>
                )}
              </View>
              {isPro ? (
                <TextInput
                  style={styles.input}
                  value={targetAmount}
                  onChangeText={setTargetAmount}
                  keyboardType="numeric"
                  placeholder="例: 30000"
                  placeholderTextColor="#94a3b8"
                />
              ) : (
                <View style={styles.proLockedInput}>
                  <Ionicons name="lock-closed" size={16} color="#94a3b8" />
                  <Text style={styles.proLockedText}>Proで目標設定が可能</Text>
                </View>
              )}
            </View>

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
  content: { padding: 16, paddingBottom: 100 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 14, fontWeight: '600', color: '#64748b', marginBottom: 8 },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    gap: 12,
  },
  categoryColor: { width: 24, height: 24, borderRadius: 8 },
  categoryName: { flex: 1, fontSize: 16, fontWeight: '500', color: '#0f172a' },
  emptyText: { fontSize: 14, color: '#94a3b8', textAlign: 'center', paddingVertical: 16 },
  hint: { fontSize: 12, color: '#94a3b8', textAlign: 'center', marginBottom: 16 },
  addButton: { borderRadius: 16, overflow: 'hidden' },
  addGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  addText: { fontSize: 16, fontWeight: '600', color: 'white' },
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
  label: { fontSize: 14, fontWeight: '500', color: '#64748b', marginBottom: 8, marginTop: 16 },
  input: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#0f172a',
  },
  typeRow: { flexDirection: 'row', gap: 12 },
  typeButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: 'white',
    alignItems: 'center',
  },
  typeButtonActive: { backgroundColor: '#10b981' },
  typeText: { fontSize: 16, fontWeight: '500', color: '#64748b' },
  typeTextActive: { color: 'white' },
  colorGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorOptionActive: { borderWidth: 3, borderColor: 'white', shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 4 },
  saveButton: { marginTop: 32, borderRadius: 16, overflow: 'hidden' },
  saveGradient: { paddingVertical: 16, alignItems: 'center' },
  saveText: { fontSize: 18, fontWeight: '600', color: 'white' },
  targetSection: { marginTop: 8 },
  targetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  proBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3e8ff',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    gap: 4,
  },
  proBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#a855f7',
  },
  proLockedInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  proLockedText: {
    fontSize: 14,
    color: '#94a3b8',
  },
});
