import { supabase, isMockMode } from './supabase';
import { getCurrentUser } from './auth';
import { Track, MoodHistoryEntry, TrackPlayEntry } from '../utils/constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── Utilitaires de date partagés ─────────────────────────────────────────────

/** Convertit une date ISO en clé "AAAA-MM-JJ" (jour calendaire local) */
export const toDateKey = (iso: string): string => {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

/** Retourne la liste triée (desc) des jours uniques ayant au moins 1 session */
export const getUniqueDays = (history: MoodHistoryEntry[]): string[] => {
  const set = new Set(history.map(e => toDateKey(e.createdAt)));
  return Array.from(set).sort((a, b) => b.localeCompare(a)); // du plus récent au plus ancien
};

/** Nombre de jours consécutifs depuis aujourd'hui (streak actuel) */
export const calcStreakDays = (history: MoodHistoryEntry[]): number => {
  const days = getUniqueDays(history);
  if (!days.length) return 0;

  const todayKey = toDateKey(new Date().toISOString());
  const yesterdayKey = toDateKey(new Date(Date.now() - 86400000).toISOString());

  // Le streak n'est actif que si on a une session aujourd'hui ou hier
  if (days[0] !== todayKey && days[0] !== yesterdayKey) return 0;

  let streak = 1;
  for (let i = 0; i < days.length - 1; i++) {
    const a = new Date(days[i]);
    const b = new Date(days[i + 1]);
    const diffDays = Math.round((a.getTime() - b.getTime()) / 86400000);
    if (diffDays === 1) streak++;
    else break;
  }
  return streak;
};

/** Meilleur streak jamais atteint (en jours uniques consécutifs) */
export const calcBestStreakDays = (history: MoodHistoryEntry[]): number => {
  const days = getUniqueDays(history);
  if (!days.length) return 0;

  let best = 1, current = 1;
  for (let i = 0; i < days.length - 1; i++) {
    const a = new Date(days[i]);
    const b = new Date(days[i + 1]);
    const diffDays = Math.round((a.getTime() - b.getTime()) / 86400000);
    if (diffDays === 1) {
      current++;
      if (current > best) best = current;
    } else {
      current = 1;
    }
  }
  return best;
};

// ─── Date d'installation ───────────────────────────────────────────────────────

const INSTALL_DATE_KEY = 'vibecheck_install_date';

/** Enregistre la date d'installation au premier lancement. Idempotent. */
export const initInstallDate = async (): Promise<void> => {
  const existing = await AsyncStorage.getItem(INSTALL_DATE_KEY);
  if (!existing) {
    await AsyncStorage.setItem(INSTALL_DATE_KEY, new Date().toISOString());
  }
};

/** Retourne la date d'installation (ISO string) ou null si inconnue */
export const getInstallDate = async (): Promise<string | null> => {
  return AsyncStorage.getItem(INSTALL_DATE_KEY);
};

/** Nombre de jours depuis l'installation */
export const getDaysSinceInstall = async (): Promise<number> => {
  const iso = await getInstallDate();
  if (!iso) return 0;
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
};

// ─── Favorites ────────────────────────────────────────────────────────────────


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
    return data ? JSON.parse(data) : [];
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

// --- TRACK PLAY HISTORY ---

const TRACK_HISTORY_KEY = (userId: string) => `vibecheck_trackhistory_${userId}`;
const MAX_TRACK_HISTORY = 50;

export const getTrackHistory = async (): Promise<TrackPlayEntry[]> => {
  const user = getCurrentUser();
  if (!user) return [];
  const data = await AsyncStorage.getItem(TRACK_HISTORY_KEY(user.id));
  return data ? JSON.parse(data) : [];
};

export const addTrackPlay = async (track: Track, mood: string): Promise<void> => {
  const user = getCurrentUser();
  if (!user) return;
  const history = await getTrackHistory();
  // Éviter les doublons consécutifs (même chanson rejouée dans la foulée)
  if (history.length > 0 && history[0].trackId === track.id) return;
  const entry: TrackPlayEntry = {
    id: 'tp-' + Math.random().toString(36).substr(2, 9),
    trackId: track.id,
    title: track.title,
    artist: track.artist,
    coverUrl: track.coverUrl,
    mood,
    playedAt: new Date().toISOString(),
  };
  const updated = [entry, ...history].slice(0, MAX_TRACK_HISTORY);
  await AsyncStorage.setItem(TRACK_HISTORY_KEY(user.id), JSON.stringify(updated));
};

// Stats agrégées pour Ralsei
export const getListenStats = async () => {
  const history = await getTrackHistory();
  if (!history.length) return null;

  // Artiste le plus écouté
  const artistCounts: Record<string, number> = {};
  history.forEach(e => { artistCounts[e.artist] = (artistCounts[e.artist] || 0) + 1; });
  const topArtist = Object.entries(artistCounts).sort((a, b) => b[1] - a[1])[0];

  // Heure de prédilection
  const hours = history.map(e => new Date(e.playedAt).getHours());
  const hourCounts: Record<number, number> = {};
  hours.forEach(h => { hourCounts[h] = (hourCounts[h] || 0) + 1; });
  const topHour = parseInt(Object.entries(hourCounts).sort((a, b) => b[1] - a[1])[0][0]);
  const timeSlot = topHour < 6 ? 'la nuit' : topHour < 12 ? 'le matin' : topHour < 18 ? "l'après-midi" : 'le soir';

  // Humeur pendant l'écoute
  const moodCounts: Record<string, number> = {};
  history.forEach(e => { moodCounts[e.mood] = (moodCounts[e.mood] || 0) + 1; });
  const topMood = Object.entries(moodCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '';

  // Jour le plus actif (sur l'historique d'humeurs — récupéré séparément)
  return {
    total: history.length,
    topArtist: topArtist ? { name: topArtist[0], count: topArtist[1] } : null,
    topHour,
    timeSlot,
    topMood,
    recent: history.slice(0, 5),
  };
};
