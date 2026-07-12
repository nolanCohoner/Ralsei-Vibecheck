import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  StatusBar,
  ImageBackground,
  Animated,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { getFavorites, removeFavorite } from '../services/db';
import { useAudioPlayer } from '../hooks/useAudioPlayer';
import { Track } from '../utils/constants';
import { PixelIcon } from '../components/PixelIcon';

const C = {
  CREAM: '#F1F1D3',
  SAGE_LIGHT: '#E3EBD0',
  SAGE_MID: '#C7DDC5',
  SAGE_DARK: '#9FCDA8',
  TEAL: '#7DC2A5',
  INK: '#2D3B2D',
  INK_LIGHT: '#5A6B5A',
  ERROR: '#C0392B',
  LIBRARY_ORANGE: '#C87941',
  LIBRARY_DARK: '#1A0E06',
};

// Pages du livre — couleurs beige
const PAGE_BG = '#E8DECA';
const PAGE_LINE_DARK = 'rgba(150,136,110,0.45)';
const PAGE_EDGE_A = '#CFC5AD';
const PAGE_EDGE_B = '#BFAF98';

// Couleurs de couverture (tranche/spine)
const BOOK_COVERS = [
  { cover: '#B5263C', coverDark: '#7A1828', bookmark: '#3A8FD4' },  // Rouge
  { cover: '#2566B0', coverDark: '#163D75', bookmark: '#B5263C' },  // Bleu
  { cover: '#2A8A46', coverDark: '#185A2C', bookmark: '#D48A20' },  // Vert
  { cover: '#8B3AB0', coverDark: '#5A1E78', bookmark: '#3AAE6A' },  // Violet
  { cover: '#C07020', coverDark: '#7A4610', bookmark: '#2566B0' },  // Ambre
];

// ─── Lignes de pages pixel art (épaisses, aspect chunky) ───────────────────
const PageLines: React.FC = () => (
  <View style={StyleSheet.absoluteFill} pointerEvents="none">
    {Array.from({ length: 14 }).map((_, i) => (
      <View key={i} style={{ height: 5, backgroundColor: i % 2 === 0 ? PAGE_LINE_DARK : 'transparent' }} />
    ))}
  </View>
);

// ─── Tranche des pages (bord droit) — blocs pixel ──────────────────────────
const PageEdges: React.FC = () => (
  <View style={styles.pageEdgesCol}>
    {Array.from({ length: 20 }).map((_, i) => (
      <View
        key={i}
        style={{ height: 3, backgroundColor: i % 3 === 0 ? PAGE_EDGE_A : i % 3 === 1 ? PAGE_EDGE_B : '#AFA090' }}
      />
    ))}
  </View>
);

// ─── Indicateur de lecture animé ─────────────────────────────────────────────
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

  return (
    <View style={{ flexDirection: 'row', gap: 2, alignItems: 'center', height: 16 }}>
      <Animated.View style={{ width: 3, height: 14, backgroundColor: color, opacity: bar1 }} />
      <Animated.View style={{ width: 3, height: 14, backgroundColor: color, opacity: bar2 }} />
      <Animated.View style={{ width: 3, height: 14, backgroundColor: color, opacity: bar3 }} />
    </View>
  );
};

const formatDuration = (sec: number) => {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
};

export const FavoritesScreen: React.FC = () => {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState<string | null>(null);
  const navigation = useNavigation<any>();
  const { currentTrack, isPlaying, playTrack, pause } = useAudioPlayer();

  useFocusEffect(
    useCallback(() => { loadFavorites(); }, [])
  );

  const loadFavorites = async () => {
    try {
      const favList = await getFavorites();
      setTracks(favList);
    } catch (_err) {
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFavorite = async (trackId: string) => {
    setRemoving(trackId);
    const success = await removeFavorite(trackId);
    if (success) setTracks(prev => prev.filter(t => t.id !== trackId));
    setRemoving(null);
  };

  const handlePlayTrack = (track: Track) => playTrack(track, tracks);

  const renderTrackItem = ({ item, index }: { item: Track; index: number }) => {
    const isCurrent = currentTrack?.id === item.id;
    const isRemoving = removing === item.id;
    const book = BOOK_COVERS[index % BOOK_COVERS.length];

    return (
      <View style={styles.bookWrapper}>
        {/* Coins pixel art (notches) — style UI Deltarune */}
        <View style={[styles.cornerTL, { backgroundColor: book.cover }]} />
        <View style={[styles.cornerTR, { backgroundColor: book.cover }]} />
        <View style={[styles.cornerBL, { backgroundColor: book.cover }]} />
        <View style={[styles.cornerBR, { backgroundColor: book.cover }]} />

        {/* ─── Couverture haut ─── */}
        <View style={[styles.coverStrip, { backgroundColor: book.cover }]}>
          <View style={[styles.coverStripInner, { backgroundColor: book.coverDark }]} />
          {/* Pixel notch haut-gauche dans la bande */}
          <View style={[styles.stripPixelL, { backgroundColor: book.coverDark }]} />
          <View style={[styles.stripPixelR, { backgroundColor: book.coverDark }]} />
        </View>

        {/* ─── Corps du livre ─── */}
        <View style={styles.bookBody}>
          {/* Spine gauche avec blocs pixel + marque-page */}
          <View style={[styles.spine, { backgroundColor: book.coverDark }]}>
            {/* Pixel squares décoratifs spine */}
            <View style={[styles.spinePixel, { backgroundColor: book.cover }]} />
            <View style={[styles.spinePixel, { backgroundColor: book.cover, opacity: 0.5 }]} />
            <View style={[styles.spinePixel, { backgroundColor: book.cover }]} />
            {/* Marque-page blocky en escalier */}
            <View style={[styles.bookmarkBody, { backgroundColor: book.bookmark }]}>
              <View style={[styles.bookmarkStep1, { backgroundColor: book.bookmark }]} />
              <View style={[styles.bookmarkStep2, { backgroundColor: book.bookmark }]} />
            </View>
          </View>

          {/* Zone pages — fond beige + lignes horizontales */}
          <View style={styles.pagesZone}>
            <PageLines />

            {/* ── Contenu de la piste ── */}
            <View style={styles.trackContent}>
              {/* Index / Barres lecture */}
              <View style={styles.trackIndexCol}>
                {isCurrent && isPlaying
                  ? <PlayingBars color={book.cover} />
                  : <Text style={[styles.trackNum, { color: book.coverDark }]}>{index + 1}</Text>
                }
              </View>

              {/* Pochette */}
              <Image
                source={{ uri: item.coverUrl }}
                style={[styles.cover, isCurrent && { borderColor: book.cover, borderWidth: 2 }]}
              />

              {/* Infos */}
              <TouchableOpacity style={styles.trackInfo} onPress={() => handlePlayTrack(item)} activeOpacity={0.7}>
                <Text style={[styles.trackTitle, isCurrent && { color: book.cover }]} numberOfLines={1}>
                  {item.title}
                </Text>
                <Text style={styles.trackArtist} numberOfLines={1}>{item.artist}</Text>
                <Text style={styles.trackDuration}>{formatDuration(item.duration)}</Text>
              </TouchableOpacity>

              {/* Actions */}
              <View style={styles.actions}>
                {/* Cœur pixel — retirer des favoris */}
                <TouchableOpacity
                  onPress={() => handleRemoveFavorite(item.id)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  style={{ paddingHorizontal: 4 }}
                  disabled={!!isRemoving}
                >
                  {isRemoving
                    ? <ActivityIndicator size="small" color={C.ERROR} />
                    : <PixelIcon type="heart-filled" color={C.ERROR} size={18} />
                  }
                </TouchableOpacity>

                {/* Play / Pause */}
                <TouchableOpacity
                  onPress={() => isCurrent && isPlaying ? pause() : handlePlayTrack(item)}
                  style={[
                    styles.playBtn,
                    { borderColor: book.coverDark, backgroundColor: 'rgba(0,0,0,0.12)' },
                    isCurrent && isPlaying && { backgroundColor: book.cover },
                  ]}
                >
                  <Text style={[styles.playBtnText, isCurrent && isPlaying && { color: '#FFFFFF' }]}>
                    {isCurrent && isPlaying ? '❚❚' : '▶'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Tranche droite des pages */}
          <PageEdges />
        </View>

        {/* ─── Couverture bas ─── */}
        <View style={[styles.coverStrip, { backgroundColor: book.cover }]}>
          <View style={[styles.coverStripInner, { backgroundColor: book.coverDark }]} />
          <View style={[styles.stripPixelL, { backgroundColor: book.coverDark }]} />
          <View style={[styles.stripPixelR, { backgroundColor: book.coverDark }]} />
        </View>
      </View>
    );
  };

  const ListHeader = tracks.length > 0 ? (
    <View style={styles.listHeader}>
      <Text style={styles.listHeaderText}>{tracks.length} TITRES FAVORIS</Text>
    </View>
  ) : null;

  const EmptyState = () => (
    <View style={styles.emptyWrapper}>
      <View style={styles.emptyBox}>
        <Image
          source={require('../assets/images/ralsei_standing.webp')}
          style={styles.ralseiImg}
          resizeMode="contain"
        />
        <View style={styles.emptyTextCol}>
          <Text style={styles.emptyText}>
            Pas encore de favoris.{'\n'}
            Lance une playlist, puis{'\n'}
            appuie sur ♡ pour{'\n'}
            sauvegarder tes titres.
          </Text>
          <TouchableOpacity
            style={styles.emptyBtn}
            onPress={() => navigation.navigate('HomeTab')}
            activeOpacity={0.8}
          >
            <View style={styles.emptyBtnShadow} />
            <View style={styles.emptyBtnInner}>
              <Text style={styles.emptyBtnText}>EXPLORER LES PLAYLISTS</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <ImageBackground
      source={require('../assets/images/favoris_bg.png')}
      style={styles.bg}
      resizeMode="cover"
    >
      <View style={styles.overlay} />
      <View style={styles.safeTop} />

      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={C.LIBRARY_ORANGE} />
        </View>
      ) : (
        <FlatList
          data={tracks}
          keyExtractor={item => item.id}
          renderItem={renderTrackItem}
          contentContainerStyle={[
            styles.listContent,
            tracks.length === 0 && styles.listContentEmpty,
          ]}
          ListHeaderComponent={ListHeader}
          ListEmptyComponent={<EmptyState />}
        />
      )}
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: C.LIBRARY_DARK },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(10,5,2,0.42)' },
  safeTop: {
    height: Platform.OS === 'android' ? (StatusBar as any).currentHeight || 24 : 44,
  },
  loaderContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  listContent: { paddingVertical: 8, paddingBottom: 140, paddingHorizontal: 10, gap: 4 },
  listContentEmpty: { flex: 1, justifyContent: 'center' },
  listHeader: { paddingHorizontal: 6, paddingVertical: 8 },
  listHeaderText: {
    fontSize: 9,
    fontFamily: 'PressStart2P-Regular',
    color: C.LIBRARY_ORANGE,
    letterSpacing: 1,
  },

  // ── Livre pixel art ─────────────────────────────────────────────────────────
  bookWrapper: {
    position: 'relative',
    borderWidth: 2,
    borderColor: '#000000',
    marginBottom: 4,
    // Ombre pixel décalée (flat, pas de blur)
    shadowColor: '#000',
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 6,
  },

  // Coins pixel (notches) — 6x6 carrés aux 4 coins
  cornerTL: { position: 'absolute', top: -2, left: -2, width: 6, height: 6, zIndex: 10 },
  cornerTR: { position: 'absolute', top: -2, right: -2, width: 6, height: 6, zIndex: 10 },
  cornerBL: { position: 'absolute', bottom: -2, left: -2, width: 6, height: 6, zIndex: 10 },
  cornerBR: { position: 'absolute', bottom: -2, right: -2, width: 6, height: 6, zIndex: 10 },

  // Bande de couverture haut/bas
  coverStrip: { height: 11, justifyContent: 'flex-end', overflow: 'hidden' },
  coverStripInner: { height: 3 },
  // Pixels décoratifs dans la bande
  stripPixelL: { position: 'absolute', left: 18, top: 2, width: 4, height: 4 },
  stripPixelR: { position: 'absolute', right: 12, top: 2, width: 4, height: 4 },

  // Corps principal
  bookBody: {
    flexDirection: 'row',
    alignItems: 'stretch',
    backgroundColor: PAGE_BG,
  },

  // Spine (tranche gauche reliure)
  spine: {
    width: 20,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 6,
    gap: 4,
    overflow: 'visible',
  },
  // Blocs carrés pixel art sur la spine
  spinePixel: {
    width: 8,
    height: 8,
  },
  // Marque-page blocky (corps + 2 escaliers)
  bookmarkBody: {
    width: 12,
    height: 18,
    marginTop: 4,
  },
  bookmarkStep1: {
    position: 'absolute',
    bottom: -4,
    left: 0,
    width: 6,
    height: 4,
  },
  bookmarkStep2: {
    position: 'absolute',
    bottom: -4,
    right: 0,
    width: 6,
    height: 4,
  },

  // Zone pages avec lignes horizontales
  pagesZone: {
    flex: 1,
    backgroundColor: PAGE_BG,
    overflow: 'hidden',
  },

  // Contenu overlay sur les pages
  trackContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9,
    paddingHorizontal: 8,
    // Fond très légèrement translucide pour lisibilité
    backgroundColor: 'rgba(235,225,200,0.70)',
  },

  trackIndexCol: { width: 24, alignItems: 'center', justifyContent: 'center' },
  trackNum: {
    fontSize: 9,
    fontFamily: 'PressStart2P-Regular',
  },
  cover: {
    width: 42,
    height: 42,
    borderWidth: 1,
    borderColor: 'rgba(100,80,50,0.4)',
    marginLeft: 4,
  },
  trackInfo: { flex: 1, marginLeft: 10, marginRight: 6, gap: 3 },
  trackTitle: {
    fontSize: 9,
    fontFamily: 'PressStart2P-Regular',
    color: C.INK,
  },
  trackArtist: {
    fontSize: 7,
    fontFamily: 'PressStart2P-Regular',
    color: C.INK_LIGHT,
  },
  trackDuration: {
    fontSize: 6.5,
    fontFamily: 'PressStart2P-Regular',
    color: C.INK_LIGHT,
    opacity: 0.8,
  },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  playBtn: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  playBtnText: { color: C.INK, fontSize: 9 },

  // Tranche pages droite
  pageEdgesCol: {
    width: 9,
    overflow: 'hidden',
    flexDirection: 'column',
  },

  // ── État vide ──────────────────────────────────────────────────────────────
  emptyWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  emptyBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#000000',
    borderWidth: 1,
    borderColor: '#7DC2A5',
    paddingVertical: 20,
    paddingHorizontal: 16,
    gap: 14,
    maxWidth: 380,
  },
  ralseiImg: { width: 72, height: 120, flexShrink: 0 },
  emptyTextCol: { flex: 1, gap: 16, alignItems: 'flex-start' },
  emptyText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontFamily: 'PressStart2P-Regular',
    lineHeight: 18,
  },
  emptyBtn: { position: 'relative', alignSelf: 'stretch' },
  emptyBtnShadow: {
    position: 'absolute',
    bottom: -3, right: -3, left: 3, top: 3,
    backgroundColor: C.SAGE_DARK,
  },
  emptyBtnInner: {
    backgroundColor: C.TEAL,
    borderWidth: 2,
    borderColor: '#000000',
    paddingVertical: 10,
    paddingHorizontal: 10,
    alignItems: 'center',
  },
  emptyBtnText: {
    color: '#000000',
    fontSize: 7.5,
    fontFamily: 'PressStart2P-Regular',
    letterSpacing: 0.3,
    textAlign: 'center',
  },
});

export default FavoritesScreen;
