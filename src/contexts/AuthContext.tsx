import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { User, Session } from '@supabase/supabase-js';
import { useNavigate } from 'react-router-dom';
import { useApp } from './AppContext';
import { signUp, signIn, signOut } from '../lib/auth/auth';

type UserRole = 'player' | 'dm' | 'admin';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  role: UserRole | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, username: string) => Promise<void>;
  signOut: () => Promise<void>;
  isAdmin: () => boolean;
  isDM: () => boolean;
  isPlayer: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { setGlobalError } = useApp();

  // Kasutaja rolli hankimine
  const fetchUserRole = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('role')
        .eq('id', userId)
        .single();

      if (error) throw error;
      return data?.role as UserRole | null;
    } catch (error) {
      console.error('Error fetching user role:', error);
      setGlobalError('Failed to fetch user role');
      return null;
    }
  }, [setGlobalError]);

  // Kontrolli ja värskenda kasutaja sessiooni
  useEffect(() => {
    const getUser = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase.auth.getSession();
        
        if (error) throw error;
        
        setSession(data?.session || null);
        setUser(data?.session?.user || null);

        if (data?.session?.user) {
          const userRole = await fetchUserRole(data.session.user.id);
          setRole(userRole);
        }
      } catch (error) {
        console.error('Error getting user session:', error);
        setGlobalError('Failed to get user session');
      } finally {
        setIsLoading(false);
      }
    };

    getUser();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth event:', event);
      console.log('Session:', session);
      setUser(session?.user || null);
      setSession(session);

      if (session?.user) {
        const userRole = await fetchUserRole(session.user.id);
        setRole(userRole);
      } else {
        setRole(null);
      }
    });

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, [fetchUserRole]);

  // Parandatud signUp funktsioon
  const handleSignUp = async (email: string, password: string, username: string) => {
    try {
      await signUp(email, password, username);
      navigate('/login', {
        state: { message: 'Registration successful! Please check your email to verify your account.' }
      });
    } catch (error) {
      console.error('Signup error:', error);
      setGlobalError(error instanceof Error ? error.message : 'Signup failed');
    }
  };

  // Parandatud signIn funktsioon - ootab sessiooni enne suunamist
  const handleSignIn = async (email: string, password: string) => {
    try {
      const { user, session } = await signIn(email, password);
      
      if (!session) {
        throw new Error('Login successful but session is missing');
      }

      setUser(user);
      setSession(session);

      const userRole = await fetchUserRole(user.id);
      setRole(userRole);

      console.log('User signed in:', user);
      navigate('/');
    } catch (error) {
      console.error('Login error:', error);
      setGlobalError(error instanceof Error ? error.message : 'Authentication failed');
    }
  };

  // Parandatud signOut funktsioon
  const handleSignOut = useCallback(async () => {
    try {
      await signOut();
      setUser(null);
      setSession(null);
      setRole(null);
      navigate('/login');
    } catch (error) {
      console.error('Sign out error:', error);
      setGlobalError('Failed to sign out');
    }
  }, [navigate, setGlobalError]);

  const isAdmin = () => role === 'admin';
  const isDM = () => role === 'dm' || role === 'admin';
  const isPlayer = () => role === 'player' || isDM();

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        role,
        isLoading,
        signIn: handleSignIn,
        signUp: handleSignUp,
        signOut: handleSignOut,
        isAdmin,
        isDM,
        isPlayer,
      }}
    >
      {!isLoading && children}
    </AuthContext.Provider>
  );
}
