import { supabase, isMockMode } from './supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface UserSession {
  id: string;
  email: string;
}

type AuthCallback = (session: UserSession | null) => void;
const listeners = new Set<AuthCallback>();
let currentUser: UserSession | null = null;

// Initialiser la session au démarrage
export const initAuth = async (): Promise<UserSession | null> => {
  if (isMockMode) {
    const stored = await AsyncStorage.getItem('vibecheck_mock_session');
    if (stored) {
      try {
        currentUser = JSON.parse(stored);
        notifyListeners();
        return currentUser;
      } catch (e) {
        currentUser = null;
      }
    }
    return null;
  } else {
    const { data: { session } } = await supabase!.auth.getSession();
    if (session?.user) {
      currentUser = { id: session.user.id, email: session.user.email || '' };
    } else {
      currentUser = null;
    }
    notifyListeners();
    return currentUser;
  }
};

const notifyListeners = () => {
  listeners.forEach(cb => cb(currentUser));
};

export const onAuthStateChange = (callback: AuthCallback) => {
  listeners.add(callback);
  // Appeler immédiatement avec la valeur actuelle
  callback(currentUser);

  // Pour Supabase réel, on s'abonne aux évènements réels
  let unsubscribeSupabase: (() => void) | null = null;
  if (!isMockMode && supabase) {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        currentUser = { id: session.user.id, email: session.user.email || '' };
      } else {
        currentUser = null;
      }
      notifyListeners();
    });
    unsubscribeSupabase = () => subscription.unsubscribe();
  }

  return () => {
    listeners.delete(callback);
    if (unsubscribeSupabase) {
      unsubscribeSupabase();
    }
  };
};

export const getCurrentUser = () => currentUser;

export const signUp = async (email: string, password: string): Promise<{ user: UserSession | null; error: Error | null }> => {
  if (isMockMode) {
    // Simuler un court délai de réseau
    await new Promise(resolve => setTimeout(resolve, 800));
    
    if (!email.includes('@') || password.length < 6) {
      return { user: null, error: new Error('Email invalide ou mot de passe trop court (min 6 caractères).') };
    }

    const mockId = 'mock-user-' + Math.random().toString(36).substr(2, 9);
    const session: UserSession = { id: mockId, email };
    
    await AsyncStorage.setItem('vibecheck_mock_session', JSON.stringify(session));
    currentUser = session;
    notifyListeners();
    return { user: session, error: null };
  } else {
    const { data, error } = await supabase!.auth.signUp({ email, password });
    if (error) return { user: null, error };
    if (data.user) {
      const user: UserSession = { id: data.user.id, email: data.user.email || '' };
      return { user, error: null };
    }
    return { user: null, error: new Error('Échec de la création de compte') };
  }
};

export const signIn = async (email: string, password: string): Promise<{ user: UserSession | null; error: Error | null }> => {
  if (isMockMode) {
    await new Promise(resolve => setTimeout(resolve, 800));

    if (!email.includes('@') || password.length < 6) {
      return { user: null, error: new Error('Email ou mot de passe invalide.') };
    }

    const mockId = 'mock-user-12345'; // ID constant pour les tests
    const session: UserSession = { id: mockId, email };
    
    await AsyncStorage.setItem('vibecheck_mock_session', JSON.stringify(session));
    currentUser = session;
    notifyListeners();
    return { user: session, error: null };
  } else {
    const { data, error } = await supabase!.auth.signInWithPassword({ email, password });
    if (error) return { user: null, error };
    if (data.user) {
      const user: UserSession = { id: data.user.id, email: data.user.email || '' };
      currentUser = user;
      notifyListeners();
      return { user, error: null };
    }
    return { user: null, error: new Error('Identifiants incorrects') };
  }
};

export const signOut = async (): Promise<{ error: Error | null }> => {
  if (isMockMode) {
    await AsyncStorage.removeItem('vibecheck_mock_session');
    currentUser = null;
    notifyListeners();
    return { error: null };
  } else {
    const { error } = await supabase!.auth.signOut();
    if (!error) {
      currentUser = null;
      notifyListeners();
    }
    return { error };
  }
};
