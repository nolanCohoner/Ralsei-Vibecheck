import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import 'react-native-url-polyfill/auto';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

// Déterminer si nous devons tourner en mode simulation (Mock Mode)
// pour que l'app se lance sans erreur même sans configuration réelle
export const isMockMode = 
  !supabaseUrl || 
  supabaseUrl.includes('your-supabase-project') || 
  !supabaseAnonKey || 
  supabaseAnonKey.includes('your-anon-key');

if (isMockMode) {

}

export const supabase = isMockMode 
  ? null 
  : createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    });
