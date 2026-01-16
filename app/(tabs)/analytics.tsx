import { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    RefreshControl,
    ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Transaction } from '@/types/database';

export default function AnalyticsScreen() {
    const { user, isPro } = useAuth();
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (user) {
            fetchTransactions();
        }
    }, [user]);

    const fetchTransactions = async () => {
        if (!user) return;
        try {
            const { data } = await supabase
                .from('transactions')
                .select('*')
                .eq('user_id', user.id);
            if (data) setTransactions(data);
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

    // 月別統計
    const monthlyStats = transactions.reduce((acc, t) => {
        const month = new Date(t.date).toLocaleString('ja-JP', { month: 'short' });
        if (!acc[month]) acc[month] = { income: 0, expense: 0 };
        if (t.type === 'income') acc[month].income += Number(t.amount);
        else acc[month].expense += Number(t.amount);
        return acc;
    }, {} as Record<string, { income: number; expense: number }>);

    const totalIncome = transactions
        .filter((t) => t.type === 'income')
        .reduce((sum, t) => sum + Number(t.amount), 0);

    const totalExpense = transactions
        .filter((t) => t.type === 'expense')
        .reduce((sum, t) => sum + Number(t.amount), 0);

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#10b981" />
            </View>
        );
    }

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
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
                <LinearGradient
                    colors={['#10b981', '#14b8a6']}
                    style={styles.savingsGradient}
                >
                    <Ionicons name="wallet" size={24} color="white" />
                    <View>
                        <Text style={styles.savingsLabel}>貯蓄額</Text>
                        <Text style={styles.savingsValue}>
                            {formatCurrency(totalIncome - totalExpense)}
                        </Text>
                    </View>
                </LinearGradient>
            </View>

            {/* Pro Feature Placeholder */}
            {!isPro && (
                <View style={styles.proCard}>
                    <View style={styles.proIconContainer}>
                        <Ionicons name="lock-closed" size={24} color="white" />
                    </View>
                    <Text style={styles.proTitle}>Pro機能</Text>
                    <Text style={styles.proDescription}>
                        詳細な分析とAIアドバイスを利用できます
                    </Text>
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
    title: {
        fontSize: 24,
        fontWeight: '700',
        color: '#0f172a',
        marginBottom: 20,
    },
    row: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 16,
    },
    statCard: {
        flex: 1,
        borderRadius: 16,
        padding: 16,
        alignItems: 'center',
    },
    statLabel: {
        fontSize: 12,
        color: '#64748b',
        marginTop: 8,
    },
    statValue: {
        fontSize: 18,
        fontWeight: '700',
        marginTop: 4,
    },
    savingsCard: {
        marginBottom: 16,
        borderRadius: 16,
        overflow: 'hidden',
    },
    savingsGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
        gap: 16,
    },
    savingsLabel: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.8)',
    },
    savingsValue: {
        fontSize: 24,
        fontWeight: '700',
        color: 'white',
    },
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
    proTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#0f172a',
        marginBottom: 4,
    },
    proDescription: {
        fontSize: 14,
        color: '#64748b',
        textAlign: 'center',
    },
});
