import { supabase } from '../supabase';
import { Session, User } from '@supabase/supabase-js';
import { formatLoginRequest } from './validation';

// REGISTREERIMINE
export async function signUp(email: string, password: string, username: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        username
      }
    }
  });

  if (error) {
    throw error;
  }

  return data.user;
}

// SISSELOGIMINE
export async function signIn(email: string, password: string): Promise<{ user: User | null; session: Session | null }> {
  console.log('Attempting to sign in with:', email);
  
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    console.error('Sign in error:', error.message, error.status);
    throw error;
  }

  console.log('Sign in data:', data);

  // Kui sessioon puudub, proovi seda uuesti tõmmata
  if (!data.session) {
    console.warn('Session is missing, attempting to fetch session again...');
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('Error fetching session:', sessionError.message);
      throw sessionError;
    }

    return { user: data.user, session: sessionData.session };
  }

  return { user: data.user, session: data.session };
}

// VÄLJALOGIMINE
export async function signOut() {
  const { error } = await supabase.auth.signOut();

  if (error) {
    console.error('Sign out error:', error.message);
    throw error;
  }

  console.log('User signed out successfully');
}

// SESSIOONI UUENDAMINE
export async function refreshSession(): Promise<{ session: Session | null; error: any }> {
  const { data, error } = await supabase.auth.refreshSession();

  if (error) {
    console.error('Session refresh error:', error.message);
  }

  return { session: data.session, error };
}

// TESTIMISEKS - SISSELOGIMINE
async function testSignIn(email: string, password: string) {
  try {
    const { user, session } = await signIn(email, password);

    console.log("Test Sign In User:", user);
    console.log("Test Sign In Session:", session);
  } catch (error) {
    console.error("Test Sign In Error:", error);
  }
}
