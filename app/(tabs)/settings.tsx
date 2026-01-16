import EditSettingModal from '@/components/EditSettingModal';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useState } from 'react';
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

export default function SettingsScreen() {
  const { user, profile, isPro, signOut, refreshProfile } = useAuth();

  // Modal states
  const [incomeModalVisible, setIncomeModalVisible] = useState(false);
  const [salaryDayModalVisible, setSalaryDayModalVisible] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleLogout = () => {
    Alert.alert('ログアウト', 'ログアウトしますか？', [
      { text: 'キャンセル', style: 'cancel' },
      { text: 'ログアウト', style: 'destructive', onPress: signOut },
    ]);
  };

  const handleSaveIncome = async (value: string) => {
    if (!user) return;
    const numValue = parseInt(value.replace(/[^0-9]/g, ''));
    if (isNaN(numValue) || numValue <= 0) {
      Alert.alert('エラー', '有効な金額を入力してください');
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ target_income: numValue })
        .eq('id', user.id);

      if (error) throw error;
      await refreshProfile?.();
      Alert.alert('保存完了', '目標収入を更新しました');
    } catch (error) {
      console.error('Error:', error);
      Alert.alert('エラー', '保存に失敗しました');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveSalaryDay = async (value: string) => {
    if (!user) return;
    const numValue = parseInt(value);
    if (isNaN(numValue) || numValue < 1 || numValue > 31) {
      Alert.alert('エラー', '1〜31の日付を入力してください');
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ salary_day: numValue })
        .eq('id', user.id);

      if (error) throw error;
      await refreshProfile?.();
      Alert.alert('保存完了', '給料日を更新しました');
    } catch (error) {
      console.error('Error:', error);
      Alert.alert('エラー', '保存に失敗しました');
    } finally {
      setIsSaving(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>設定</Text>

      {/* Profile Card */}
      <View style={styles.card}>
        <View style={styles.profileHeader}>
          <LinearGradient
            colors={isPro ? ['#a855f7', '#7c3aed'] : ['#10b981', '#14b8a6']}
            style={styles.avatar}
          >
            <Text style={styles.avatarText}>{user?.email?.charAt(0).toUpperCase()}</Text>
          </LinearGradient>
          <View style={styles.profileInfo}>
            <Text style={styles.email}>{user?.email}</Text>
            {isPro && (
              <View style={styles.proBadge}>
                <Ionicons name="sparkles" size={12} color="#a855f7" />
                <Text style={styles.proText}>PRO</Text>
              </View>
            )}
          </View>
        </View>
      </View>

      {/* Settings Items */}
      <View style={styles.card}>
        <TouchableOpacity style={styles.settingItem} onPress={() => setIncomeModalVisible(true)}>
          <Ionicons name="wallet-outline" size={22} color="#64748b" />
          <View style={styles.settingContent}>
            <Text style={styles.settingLabel}>目標収入</Text>
            <Text style={styles.settingValue}>
              {formatCurrency(profile?.target_income || 300000)}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
        </TouchableOpacity>

        <View style={styles.divider} />

        <TouchableOpacity
          style={styles.settingItem}
          onPress={() => setSalaryDayModalVisible(true)}
        >
          <Ionicons name="calendar-outline" size={22} color="#64748b" />
          <View style={styles.settingContent}>
            <Text style={styles.settingLabel}>給料日</Text>
            <Text style={styles.settingValue}>毎月{profile?.salary_day || 25}日</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
        </TouchableOpacity>

        <View style={styles.divider} />

        <TouchableOpacity
          style={styles.settingItem}
          onPress={() => router.push('/categories')}
        >
          <Ionicons name="pricetag-outline" size={22} color="#64748b" />
          <View style={styles.settingContent}>
            <Text style={styles.settingLabel}>カテゴリ管理</Text>
            <Text style={styles.settingValue}>追加・編集・削除</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
        </TouchableOpacity>
      </View>

      {/* Pro Upgrade */}
      {!isPro && (
        <TouchableOpacity style={styles.upgradeCard}>
          <LinearGradient
            colors={['#f59e0b', '#f97316']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.upgradeGradient}
          >
            <View>
              <Text style={styles.upgradeTitle}>Proにアップグレード</Text>
              <Text style={styles.upgradeDescription}>AI予測と詳細分析を解放</Text>
            </View>
            <Ionicons name="arrow-forward" size={20} color="white" />
          </LinearGradient>
        </TouchableOpacity>
      )}

      {/* Logout */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={20} color="#ef4444" />
        <Text style={styles.logoutText}>ログアウト</Text>
      </TouchableOpacity>

      <Text style={styles.version}>バージョン 1.0.0</Text>

      {/* Modals */}
      <EditSettingModal
        visible={incomeModalVisible}
        onClose={() => setIncomeModalVisible(false)}
        onSave={handleSaveIncome}
        title="目標収入"
        label="月間の目標収入を入力"
        initialValue={String(profile?.target_income || 300000)}
        keyboardType="numeric"
        prefix="¥"
      />

      <EditSettingModal
        visible={salaryDayModalVisible}
        onClose={() => setSalaryDayModalVisible(false)}
        onSave={handleSaveSalaryDay}
        title="給料日"
        label="毎月の給料日を入力"
        initialValue={String(profile?.salary_day || 25)}
        keyboardType="numeric"
        suffix="日"
      />
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
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 20,
  },
  card: {
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
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: 'white',
    fontSize: 20,
    fontWeight: '600',
  },
  profileInfo: {
    flex: 1,
  },
  email: {
    fontSize: 16,
    fontWeight: '500',
    color: '#0f172a',
  },
  proBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3e8ff',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    alignSelf: 'flex-start',
    gap: 4,
    marginTop: 4,
  },
  proText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#a855f7',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  settingContent: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 14,
    color: '#64748b',
  },
  settingValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#0f172a',
  },
  divider: {
    height: 1,
    backgroundColor: '#e2e8f0',
    marginVertical: 8,
  },
  upgradeCard: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  upgradeGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
  },
  upgradeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  upgradeDescription: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    marginBottom: 16,
  },
  logoutText: {
    fontSize: 16,
    color: '#ef4444',
    fontWeight: '500',
  },
  version: {
    textAlign: 'center',
    fontSize: 12,
    color: '#94a3b8',
  },
});
