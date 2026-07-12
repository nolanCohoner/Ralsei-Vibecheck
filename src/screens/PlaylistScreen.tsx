import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  Platform,
  StatusBar,
  Animated,
  Modal,
  TouchableWithoutFeedback,
} from 'react-native';
import { getPlaylistForMood } from '../services/deezer';
import { getFavorites, addFavorite, removeFavorite } from '../services/db';
import { useAudioPlayer } from '../hooks/useAudioPlayer';
import { Track } from '../utils/constants';
import { PixelIcon } from '../components/PixelIcon';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

const C = {
  CREAM: '#F1F1D3',
  SAGE_LIGHT: '#E3EBD0',
  SAGE_MID: '#C7DDC5',
  SAGE_DARK: '#9FCDA8',
  TEAL: '#7DC2A5',
  INK: '#2D3B2D',
  INK_LIGHT: '#5A6B5A',
  ERROR: '#C0392B',
};

// Indicateur de lecture animé (3 barres qui pulsent)
const PlayingBars: React.FC<{ color: string }> = ({ color }) => {
  const bar1 = useRef(new Animated.Value(0.4)).current;
  const bar2 = useRef(new Animated.Value(1)).current;
  const bar3 = useRef(new Animated.Value(0.7)).current;

  useEffect(() => {
    const anim = (val: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(val, { toValue: 1, duration: 400, delay, useNativeDriver: true }),
          Animated.timing(val, { toValue: 0.3, duration: 400, useNativeDriver: true }),
        ])
      );
    anim(bar1, 0).start();
    anim(bar2, 150).start();
    anim(bar3, 300).start();
  }, []);

  const barStyle = (val: Animated.Value) => ({
    width: 3,
    height: 14,
    backgroundColor: color,
    transform: [{ scaleY: val }],
  });

  return (
    <View style={{ flexDirection: 'row', gap: 2, alignItems: 'center', height: 16 }}>
      <Animated.View style={barStyle(bar1)} />
      <Animated.View style={barStyle(bar2)} />
      <Animated.View style={barStyle(bar3)} />
    </View>
  );
};

const formatDuration = (sec: number) => {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
};

export const PlaylistScreen: React.FC<any> = ({ route, navigation }) => {
  const { moodId, moodName, color, undertaleMode } = route.params;
  const [tracks, setTracks] = useState<Track[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [sharingLoading, setSharingLoading] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);

  const { currentTrack, isPlaying, playTrack, pause } = useAudioPlayer();

  useEffect(() => {
    loadPlaylistAndFavorites();
  }, [moodId]);

  const loadPlaylistAndFavorites = async () => {
    setLoading(true);
    try {
      const generatedTracks = await getPlaylistForMood(moodId, undertaleMode || false);
      setTracks(generatedTracks);
      const favList = await getFavorites();
      setFavorites(favList.map(f => f.id));
    } catch (_err) {
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFavorite = async (track: Track) => {
    const isFav = favorites.includes(track.id);
    if (isFav) {
      const ok = await removeFavorite(track.id);
      if (ok) setFavorites(prev => prev.filter(id => id !== track.id));
    } else {
      const ok = await addFavorite(track);
      if (ok) setFavorites(prev => [...prev, track.id]);
    }
  };

  const handleSharePlaylist = async () => {
    setMenuVisible(false);
    if (tracks.length === 0) return;
    setSharingLoading(true);
    try {
      let text = `VibeCheck — ${moodName}\n${new Date().toLocaleDateString('fr-FR')}\n\n`;
      tracks.forEach((t, i) => { text += `${i + 1}. ${t.title} — ${t.artist}\n`; });
      const file = new File(Paths.cache, `VibeCheck_${moodName}.txt`);
      file.write(text);
      const ok = await Sharing.isAvailableAsync();
      if (ok) await Sharing.shareAsync(file.uri, { mimeType: 'text/plain' });
    } catch (_err) {
    } finally {
      setSharingLoading(false);
    }
  };

  const handlePlayTrack = (track: Track) => playTrack(track, tracks, moodName);

  const renderTrackItem = ({ item, index }: { item: Track; index: number }) => {
    const isCurrent = currentTrack?.id === item.id;
    const isFav = favorites.includes(item.id);

    return (
      <View style={[styles.trackCard, isCurrent && { borderColor: color }]}>
        {/* Indicateur lecture ou numéro */}
        <View style={styles.trackIndexCol}>
          {isCurrent && isPlaying
            ? <PlayingBars color={color} />
            : <Text style={[styles.trackNum, isCurrent && { color }]}>{index + 1}</Text>
          }
        </View>

        {/* Pochette avec bordure couleur si actif */}
        <Image
          source={{ uri: item.coverUrl }}
          style={[styles.cover, isCurrent && { borderColor: color, borderWidth: 2 }]}
        />

        {/* Infos */}
        <TouchableOpacity style={styles.trackInfo} onPress={() => handlePlayTrack(item)} activeOpacity={0.7}>
          <Text style={[styles.trackTitle, isCurrent && { color }]} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={styles.trackArtist} numberOfLines={1}>{item.artist}</Text>
          <Text style={styles.trackDuration}>{formatDuration(item.duration)}</Text>
        </TouchableOpacity>

        {/* Actions */}
        <View style={styles.actions}>
          {/* Favori pixelisé */}
          <TouchableOpacity
            onPress={() => handleToggleFavorite(item)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={{ paddingHorizontal: 6 }}
          >
            <PixelIcon
              type={isFav ? 'heart-filled' : 'heart-empty'}
              color={isFav ? C.ERROR : C.INK_LIGHT}
              size={18}
            />
          </TouchableOpacity>

          {/* Play / Pause */}
          <TouchableOpacity
            onPress={() => isCurrent && isPlaying ? pause() : handlePlayTrack(item)}
            style={[styles.playBtn, isCurrent && isPlaying && { backgroundColor: color }]}
          >
            <Text style={[styles.playBtnText, isCurrent && isPlaying && { color: C.INK }]}>
              {isCurrent && isPlaying ? '❚❚' : '▶'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: color }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <PixelIcon type="prev" color={C.INK} size={28} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <View style={[styles.moodDot, { backgroundColor: color }]} />
          <Text style={styles.headerTitle} numberOfLines={1}>{moodName.toUpperCase()}</Text>
        </View>

        {/* Menu ⋮ */}
        <TouchableOpacity
          onPress={() => setMenuVisible(true)}
          style={styles.menuBtn}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          {sharingLoading
            ? <ActivityIndicator size="small" color={C.TEAL} />
            : <Text style={styles.menuDots}>⋮</Text>
          }
        </TouchableOpacity>
      </View>

      {/* Modal menu */}
      <Modal visible={menuVisible} transparent animationType="fade" onRequestClose={() => setMenuVisible(false)}>
        <TouchableWithoutFeedback onPress={() => setMenuVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.menuBox}>
                <TouchableOpacity onPress={handleSharePlaylist} style={styles.menuItem}>
                  <Text style={styles.menuItemText}>📤  PARTAGER LA PLAYLIST</Text>
                </TouchableOpacity>
                <View style={styles.menuDivider} />
                <TouchableOpacity onPress={() => setMenuVisible(false)} style={styles.menuItem}>
                  <Text style={[styles.menuItemText, { color: C.INK_LIGHT }]}>✕  FERMER</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={C.TEAL} />
          <Text style={styles.loadingText}>Génération en cours...</Text>
        </View>
      ) : (
        <FlatList
          data={tracks}
          keyExtractor={item => item.id}
          renderItem={renderTrackItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyTitle}>Aucun morceau trouvé.</Text>
              <Text style={styles.emptyText}>Essaie une autre humeur !</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.CREAM },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 3,
    backgroundColor: C.SAGE_LIGHT,
    paddingTop: Platform.OS === 'android' ? (StatusBar as any).currentHeight || 24 : 14,
  },
  backBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    gap: 8,
  },
  moodDot: { width: 8, height: 8 },
  headerTitle: {
    fontSize: 9,
    fontFamily: 'PressStart2P-Regular',
    color: C.INK,
    letterSpacing: 1,
  },
  menuBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuDots: {
    fontSize: 28,
    color: C.INK,
    lineHeight: 32,
  },
  // Modal menu
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(45,59,45,0.25)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 80,
    paddingRight: 16,
  },
  menuBox: {
    backgroundColor: C.SAGE_LIGHT,
    borderWidth: 2,
    borderColor: C.SAGE_MID,
    minWidth: 220,
  },
  menuItem: {
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  menuItemText: {
    fontSize: 7.5,
    fontFamily: 'PressStart2P-Regular',
    color: C.INK,
    lineHeight: 14,
  },
  menuDivider: {
    height: 2,
    backgroundColor: C.SAGE_MID,
  },
  loaderContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  loadingText: {
    color: C.INK_LIGHT,
    fontSize: 7,
    fontFamily: 'PressStart2P-Regular',
    lineHeight: 14,
  },
  listContent: {
    paddingVertical: 8,
    paddingBottom: 140,
  },
  trackCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginHorizontal: 12,
    marginBottom: 8,
    backgroundColor: C.SAGE_LIGHT,
    borderWidth: 2,
    borderColor: C.SAGE_MID,
  },
  trackIndexCol: {
    width: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trackNum: {
    color: C.INK_LIGHT,
    fontSize: 7,
    fontFamily: 'PressStart2P-Regular',
  },
  cover: {
    width: 44,
    height: 44,
    borderWidth: 2,
    borderColor: C.SAGE_MID,
    marginLeft: 4,
  },
  trackInfo: {
    flex: 1,
    marginLeft: 10,
    marginRight: 6,
    gap: 3,
  },
  trackTitle: {
    fontSize: 7.5,
    fontFamily: 'PressStart2P-Regular',
    color: C.INK,
  },
  trackArtist: {
    fontSize: 6,
    fontFamily: 'PressStart2P-Regular',
    color: C.INK_LIGHT,
  },
  trackDuration: {
    fontSize: 5.5,
    fontFamily: 'PressStart2P-Regular',
    color: C.INK_LIGHT,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  heartText: {
    fontSize: 18,
    color: C.SAGE_DARK,
  },
  playBtn: {
    width: 32,
    height: 32,
    backgroundColor: C.SAGE_MID,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: C.SAGE_DARK,
  },
  playBtnText: {
    color: C.INK,
    fontSize: 10,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 80,
    paddingHorizontal: 30,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 9,
    fontFamily: 'PressStart2P-Regular',
    color: C.INK,
    textAlign: 'center',
  },
  emptyText: {
    color: C.INK_LIGHT,
    fontSize: 7,
    fontFamily: 'PressStart2P-Regular',
    textAlign: 'center',
    lineHeight: 12,
  },
});

export default PlaylistScreen;
