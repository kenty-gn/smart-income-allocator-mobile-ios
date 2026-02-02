import { supabase } from '@/lib/supabase';
import { Profile } from '@/types/database';
import { Session, User } from '@supabase/supabase-js';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';

WebBrowser.maybeCompleteAuthSession();

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  isPro: boolean;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signInWithGoogle: () => Promise<{ error: Error | null }>;
  signInWithApple: () => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  upgradeToPro: () => Promise<{ error: Error | null }>;
  downgradeFromPro: () => Promise<{ error: Error | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// デフォルトカテゴリ定義
const DEFAULT_CATEGORIES = [
  // 固定費
  { name: '家賃', type: 'fixed' as const, color: '#ef4444' },
  { name: '光熱費', type: 'fixed' as const, color: '#f97316' },
  { name: '通信費', type: 'fixed' as const, color: '#3b82f6' },
  { name: '保険', type: 'fixed' as const, color: '#8b5cf6' },
  // 変動費
  { name: '食費', type: 'variable' as const, color: '#22c55e' },
  { name: '交通費', type: 'variable' as const, color: '#06b6d4' },
  { name: '娯楽', type: 'variable' as const, color: '#ec4899' },
  { name: '買い物', type: 'variable' as const, color: '#f59e0b' },
  { name: 'その他', type: 'variable' as const, color: '#64748b' },
];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isPro = profile?.subscription_tier === 'pro';

  // Google Auth - only initialize if client IDs are configured
  const googleClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
  const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
  
  const [request, googleResponse, googlePromptAsync] = Google.useAuthRequest(
    webClientId
      ? {
          expoClientId: webClientId,
          iosClientId: googleClientId,
          webClientId: webClientId,
          redirectUri: 'https://auth.expo.io/@kenty1031/smart-income-allocator-mobile',
        }
      : null as any
  );

  useEffect(() => {
    if (request) {
      console.log('Google Auth Redirect URI:', request.redirectUri);
    }
  }, [request]);

  useEffect(() => {
    if (googleResponse?.type === 'success') {
      const { id_token } = googleResponse.params;
      supabase.auth.signInWithIdToken({
        provider: 'google',
        token: id_token,
      });
    }
  }, [googleResponse]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setIsLoading(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        await fetchProfile(session.user.id);
      } else {
        setProfile(null);
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      setProfile(data);

      // カテゴリが空の場合、デフォルトカテゴリを作成
      await createDefaultCategoriesIfNeeded(userId);
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const createDefaultCategoriesIfNeeded = async (userId: string) => {
    try {
      // 既存のカテゴリを確認
      const { data: existingCategories } = await supabase
        .from('categories')
        .select('id')
        .eq('user_id', userId)
        .limit(1);

      // カテゴリが既にあれば作成しない
      if (existingCategories && existingCategories.length > 0) return;

      // デフォルトカテゴリを作成
      const categoriesToCreate = DEFAULT_CATEGORIES.map(cat => ({
        user_id: userId,
        name: cat.name,
        type: cat.type,
        color: cat.color,
        target_amount: null,
        target_percentage: null,
      }));

      const { error } = await supabase.from('categories').insert(categoriesToCreate);
      if (error) throw error;
      console.log('Default categories created');
    } catch (error) {
      console.error('Error creating default categories:', error);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      return { error };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signInWithGoogle = async () => {
    try {
      await googlePromptAsync();
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signInWithApple = async () => {
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      if (credential.identityToken) {
        const { error } = await supabase.auth.signInWithIdToken({
          provider: 'apple',
          token: credential.identityToken,
        });
        return { error };
      }
      return { error: new Error('No identity token') };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  const upgradeToPro = async () => {
    if (!user) return { error: new Error('Not logged in') };
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ subscription_tier: 'pro' })
        .eq('id', user.id);
      if (error) throw error;
      await refreshProfile();
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const downgradeFromPro = async () => {
    if (!user) return { error: new Error('Not logged in') };
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ subscription_tier: 'free' })
        .eq('id', user.id);
      if (error) throw error;
      await refreshProfile();
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        isPro,
        isLoading,
        signIn,
        signInWithGoogle,
        signInWithApple,
        signOut,
        refreshProfile,
        upgradeToPro,
        downgradeFromPro,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
