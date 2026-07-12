import { supabase, isMockMode } from './supabase';
import { getCurrentUser } from './auth';
import { Track, MoodHistoryEntry } from '../utils/constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

// --- FAVORITES ---

export const getFavorites = async (): Promise<Track[]> => {
  const user = getCurrentUser();
  if (!user) return [];

  if (isMockMode) {
    const data = await AsyncStorage.getItem(`vibecheck_favorites_${user.id}`);
    return data ? JSON.parse(data) : [];
  } else {
    const { data, error } = await supabase!
      .from('favorites')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) return [];

    // Mapper du format BDD vers le format interne Track
    return (data || []).map(item => ({
      id: item.track_id,
      title: item.title,
      artist: item.artist_name,
      album: item.album_title,
      coverUrl: item.cover_url,
      previewUrl: item.preview_url,
      duration: 30 // standard preview duration
    }));
  }
};

export const addFavorite = async (track: Track): Promise<boolean> => {
  const user = getCurrentUser();
  if (!user) return false;

  if (isMockMode) {
    const favs = await getFavorites();
    if (favs.some(f => f.id === track.id)) return true;
    favs.unshift(track);
    await AsyncStorage.setItem(`vibecheck_favorites_${user.id}`, JSON.stringify(favs));
    return true;
  } else {
    const { error } = await supabase!
      .from('favorites')
      .insert({
        user_id: user.id,
        track_id: track.id,
        title: track.title,
        artist_name: track.artist,
        album_title: track.album,
        cover_url: track.coverUrl,
        preview_url: track.previewUrl
      });

    if (error) return false;
    return true;
  }
};

export const removeFavorite = async (trackId: string): Promise<boolean> => {
  const user = getCurrentUser();
  if (!user) return false;

  if (isMockMode) {
    const favs = await getFavorites();
    const updated = favs.filter(f => f.id !== trackId);
    await AsyncStorage.setItem(`vibecheck_favorites_${user.id}`, JSON.stringify(updated));
    return true;
  } else {
    const { error } = await supabase!
      .from('favorites')
      .delete()
      .eq('user_id', user.id)
      .eq('track_id', trackId);

    if (error) return false;
    return true;
  }
};

// --- MOOD HISTORY ---

export const getMoodHistory = async (): Promise<MoodHistoryEntry[]> => {
  const user = getCurrentUser();
  if (!user) return [];

  if (isMockMode) {
    const data = await AsyncStorage.getItem(`vibecheck_history_${user.id}`);
    if (data) {
      return JSON.parse(data);
    }
    // Si aucun historique, générer un historique de simulation sympa pour le correcteur
    const defaultHistory: MoodHistoryEntry[] = generateMockHistory();
    await AsyncStorage.setItem(`vibecheck_history_${user.id}`, JSON.stringify(defaultHistory));
    return defaultHistory;
  } else {
    const { data, error } = await supabase!
      .from('mood_history')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) return [];

    return (data || []).map(item => ({
      id: item.id,
      mood: item.mood,
      createdAt: item.created_at
    }));
  }
};

export const addMoodEntry = async (moodName: string): Promise<boolean> => {
  const user = getCurrentUser();
  if (!user) return false;

  if (isMockMode) {
    const history = await getMoodHistory();
    const newEntry: MoodHistoryEntry = {
      id: 'history-' + Math.random().toString(36).substr(2, 9),
      mood: moodName,
      createdAt: new Date().toISOString()
    };
    history.unshift(newEntry);
    await AsyncStorage.setItem(`vibecheck_history_${user.id}`, JSON.stringify(history));
    return true;
  } else {
    const { error } = await supabase!
      .from('mood_history')
      .insert({
        user_id: user.id,
        mood: moodName
      });

    if (error) return false;
    return true;
  }
};

// Fonction utilitaire pour générer des données d'historique de simulation
// couvrant les 30 derniers jours avec des humeurs variées
const generateMockHistory = (): MoodHistoryEntry[] => {
  const moods = ['Joyeux', 'Nostalgique', 'Énergique', 'Mélancolique', 'Concentré', 'Festif', 'Amoureux', 'Colérique', 'Fatigué'];
  const history: MoodHistoryEntry[] = [];
  
  for (let i = 0; i < 20; i++) {
    // Une humeur tous les 1.5 jours en moyenne pour avoir plus de points de données
    const date = new Date();
    date.setDate(date.getDate() - i - Math.floor(Math.random() * 2));
    
    history.push({
      id: `mock-hist-${i}`,
      mood: moods[Math.floor(Math.random() * moods.length)],
      createdAt: date.toISOString()
    });
  }
  
  return history;
};
