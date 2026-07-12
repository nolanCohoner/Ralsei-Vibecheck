import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, Dimensions, Platform, StatusBar, Image, Animated,
} from 'react-native';
import { StorageAccessFramework } from 'expo-file-system/legacy';
const SAF = StorageAccessFramework;
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as DocumentPicker from 'expo-document-picker';
import { useAudioPlayer } from '../hooks/useAudioPlayer';
import { Track } from '../utils/constants';
import { PixelIcon } from '../components/PixelIcon';

const { width: SW } = Dimensions.get('window');
const STAT_H = Platform.OS === 'android' ? ((StatusBar as any).currentHeight || 24) : 44;

// ── Assets ────────────────────────────────────────────────────────────────────
const HEART    = require('../assets/images/album/coeur.webp');
const RALSEI   = require('../assets/images/album/ralsei_idle.webp');
const VICTORY  = require('../assets/images/album/ralsei_victory.webp');
const GREENBAR = require('../assets/images/album/greenbar.gif');
const YELLOWBAR= require('../assets/images/album/yellowbar.gif');

// ── Palette (dark, fidele a Deltarune) ───────────────────────────────────────
const C = {
  BG:        '#090909',
  CARD:      '#161616',
  CARD2:     '#1C1C1C',
  BORDER:    '#2A2A2A',
  GREEN:     '#5BC8A0',
  GREEN_DIM: 'rgba(91, 200, 160, 0.15)',
  GREEN_BDR: 'rgba(91, 200, 160, 0.35)',
  PINK:      '#E91E8C',
  TEAL:      '#5BC8A0',
  WHITE:     '#FFFFFF',
  GRAY:      '#888888',
  MUTED:     '#555555',
  ACTIVE_BG: 'rgba(91, 200, 160, 0.55)',
  ACTIVE_TXT:'#5BC8A0',
};

// ── Helpers ───────────────────────────────────────────────────────────────────
const AUDIO_EXTS = ['.mp3','.wav','.flac','.ogg','.aac','.m4a','.opus','.wma','.ape','.aiff','.aif','.mp4'];
const isAudio = (uri: string) => AUDIO_EXTS.some(e => decodeURIComponent(uri).toLowerCase().endsWith(e));
const getFilename = (uri: string) => { const p = decodeURIComponent(uri).split('/'); return p[p.length-1] || uri; };
const cleanTitle  = (f: string) => f.replace(/\.[^/.]+$/,'').replace(/[-_]/g,' ').replace(/^\d+[\s._-]*/,'').trim();
const fmtDur      = (s: number) => (!s||s<=0) ? '' : `${Math.floor(s/60)}:${String(Math.floor(s%60)).padStart(2,'0')}`;

// ── Pixel note icone ──────────────────────────────────────────────────────────
const NoteIcon: React.FC<{ active: boolean; activeColor?: string }> = ({ active, activeColor }) => (
  <View style={[st.noteBox, active && (activeColor ? { borderColor: activeColor, backgroundColor: activeColor + '20' } : st.noteBoxOn)]}>
    <Text style={[st.noteTxt, active && (activeColor ? { color: activeColor } : st.noteTxtOn)]}>♪</Text>
  </View>
);

// ── Dossier pixelisé ──────────────────────────────────────────────────────────
const PixelFolderIcon: React.FC<{ color: string; size?: number }> = ({ color, size = 18 }) => {
  const u = size / 8;
  return (
    <View style={{ width: size, height: size, position: 'relative' }}>
      <View style={{ position: 'absolute', top: 0, left: 0, width: u * 3, height: u * 2, backgroundColor: color }} />
      <View style={{ position: 'absolute', top: u * 1.5, left: 0, width: size, height: size - u * 1.5, backgroundColor: color }} />
      <View style={{ position: 'absolute', top: u * 3.5, left: u, width: size - u * 2, height: u, backgroundColor: '#000000', opacity: 0.35 }} />
    </View>
  );
};

// ── Plus pixelisé ─────────────────────────────────────────────────────────────
const PixelPlusIcon: React.FC<{ color: string; size?: number }> = ({ color, size = 18 }) => {
  const u = size / 5;
  return (
    <View style={{ width: size, height: size, position: 'relative', justifyContent: 'center', alignItems: 'center' }}>
      <View style={{ position: 'absolute', width: size, height: u, backgroundColor: color }} />
      <View style={{ position: 'absolute', width: u, height: size, backgroundColor: color }} />
    </View>
  );
};

// ── EQ bars animes ────────────────────────────────────────────────────────────
const EqBars: React.FC = () => {
  const vals = [useRef(new Animated.Value(4)).current, useRef(new Animated.Value(4)).current, useRef(new Animated.Value(4)).current];
  useEffect(() => {
    const anims = vals.map((v, i) =>
      Animated.loop(Animated.sequence([
        Animated.timing(v, { toValue: 14, duration: 250 + i * 70, useNativeDriver: false }),
        Animated.timing(v, { toValue: 3,  duration: 250 + i * 70, useNativeDriver: false }),
      ]))
    );
    anims.forEach(a => a.start());
    return () => anims.forEach(a => a.stop());
  }, []);
  return (
    <View style={st.eq}>
      {vals.map((v, i) => <Animated.View key={i} style={[st.eqBar, { height: v }]} />)}
    </View>
  );
};

// ── Ecran principal ───────────────────────────────────────────────────────────
export const AlbumScreen: React.FC = () => {
  const { playTrack, currentTrack, isPlaying, pause, resume } = useAudioPlayer();

  const [tracks,    setTracks]    = useState<Track[]>([]);
  const [filtered,  setFiltered]  = useState<Track[]>([]);
  const [query,     setQuery]     = useState('');
  const [scanning,  setScanning]  = useState(false);
  const [folderName,setFolderName]= useState<string|null>(null);
  const [showSearch,setShowSearch]= useState(false);
  const [isShuffleActive, setIsShuffleActive] = useState(false);

  // Filtrage
  useEffect(() => {
    if (!query.trim()) { setFiltered(tracks); return; }
    const q = query.toLowerCase();
    setFiltered(tracks.filter(t => t.title.toLowerCase().includes(q) || t.artist.toLowerCase().includes(q)));
  }, [query, tracks]);

  // Chargement et persistance du dossier
  useEffect(() => {
    const loadSavedData = async () => {
      try {
        const savedUri = await AsyncStorage.getItem('vibecheck_local_folder_uri');
        const savedName = await AsyncStorage.getItem('vibecheck_local_folder_name');
        const savedTracksJson = await AsyncStorage.getItem('vibecheck_local_tracks');

        let loadedTracks: Track[] = [];
        if (savedTracksJson) {
          loadedTracks = JSON.parse(savedTracksJson);
          setTracks(loadedTracks);
          setFiltered(loadedTracks);
        }
        if (savedName) {
          setFolderName(savedName);
        }

        if (savedUri) {
          // Scanner silencieusement en arrière-plan pour actualiser la liste des morceaux
          scanDirectorySilently(savedUri, savedName || 'Dossier', loadedTracks);
        } else {
          // Si aucun dossier n'est enregistré : ouvrir automatiquement le picker de dossier
          setTimeout(() => pickFolder(), 500);
        }
      } catch (err) {
        console.warn(err);
      }
    };
    loadSavedData();
  }, []);

  const scanDirectorySilently = async (uri: string, dName: string, existingTracks: Track[]) => {
    try {
      const files = await SAF.readDirectoryAsync(uri);
      const audio = files.filter(isAudio);
      const newTracks: Track[] = audio
        .map((fUri: string) => ({
          id: fUri,
          title: cleanTitle(getFilename(fUri)),
          artist: dName,
          album: dName,
          coverUrl: '',
          previewUrl: fUri,
          duration: 0
        }))
        .sort((a: Track, b: Track) => a.title.localeCompare(b.title));

      const existingUrls = new Set(existingTracks.map(t => t.previewUrl));
      const newUrls = new Set(newTracks.map(t => t.previewUrl));
      
      const hasChanges = newTracks.length !== existingTracks.length ||
        [...newUrls].some(url => !existingUrls.has(url));

      if (hasChanges) {
        setTracks(newTracks);
        setFiltered(newTracks);
        await AsyncStorage.setItem('vibecheck_local_tracks', JSON.stringify(newTracks));
      }
    } catch (e) {
      console.warn("Scan en arrière-plan échoué, la permission a peut-être été révoquée :", e);
    }
  };

  // ── Scan dossier ─────────────────────────────────────────────────────────
  const pickFolder = async () => {
    try {
      const result = await SAF.requestDirectoryPermissionsAsync();
      if (!result.granted) return;
      setScanning(true);
      const files = await SAF.readDirectoryAsync(result.directoryUri);
      const audio = files.filter(isAudio);
      const decodedDir = decodeURIComponent(result.directoryUri);
      const parts = decodedDir.replace(/\/$/, '').split('/');
      const dName = (parts[parts.length-1] || 'Dossier').replace(/^primary:/,'').replace(/%3A/gi,'/');
      
      setFolderName(dName);
      
      const newTracks: Track[] = audio
        .map((fUri: string) => ({
          id: fUri,
          title: cleanTitle(getFilename(fUri)),
          artist: dName,
          album: dName,
          coverUrl: '',
          previewUrl: fUri,
          duration: 0
        }))
        .sort((a: Track, b: Track) => a.title.localeCompare(b.title));

      setTracks(newTracks);
      setFiltered(newTracks);
      setScanning(false);

      // Persister l'URI, le nom et les morceaux
      await AsyncStorage.setItem('vibecheck_local_folder_uri', result.directoryUri);
      await AsyncStorage.setItem('vibecheck_local_folder_name', dName);
      await AsyncStorage.setItem('vibecheck_local_tracks', JSON.stringify(newTracks));
    } catch (e) {
      setScanning(false);
      console.warn(e);
    }
  };

  // ── Picker fichiers individuels (Fallback) ─────────────────────────────────
  const pickFiles = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'audio/*',
        multiple: true,
        copyToCacheDirectory: false
      });
      if (result.canceled) return;
      
      const newTracks: Track[] = result.assets.map((a, i) => ({
        id: a.uri + '-' + Date.now() + '-' + i,
        title: cleanTitle(a.name || 'Titre inconnu'),
        artist: 'Fichiers Importés',
        album: 'Sélection manuelle',
        coverUrl: '',
        previewUrl: a.uri,
        duration: 0,
      }));

      setTracks(prev => {
        const ex = new Set(prev.map(t => t.previewUrl));
        const merged = [...prev, ...newTracks.filter(t => !ex.has(t.previewUrl))].sort((a,b)=>a.title.localeCompare(b.title));
        setFiltered(merged);
        
        // Enregistrer la liste manuelle
        AsyncStorage.setItem('vibecheck_local_tracks', JSON.stringify(merged));
        if (!folderName) {
          setFolderName('Fichiers Importés');
          AsyncStorage.setItem('vibecheck_local_folder_name', 'Fichiers Importés');
        }
        return merged;
      });
    } catch (e) {
      console.warn(e);
    }
  };

  const handlePlay = (track: Track) => playTrack(track, filtered, '');

  // ── Ligne piste (style Samsung Music + Deltarune) ─────────────────────────
  const renderItem = useCallback(({ item, index }: { item: Track; index: number }) => {
    const active = currentTrack?.id === item.id;
    const activeColor = isPlaying ? C.GREEN : '#FFFF00'; // Vert combat ou Jaune combat
    return (
      <TouchableOpacity
        style={[st.row, active && { backgroundColor: 'transparent', borderBottomColor: 'transparent', paddingVertical: 0, height: 52 }]}
        onPress={() => handlePlay(item)}
        activeOpacity={0.7}
      >
        {/* Fond GIF barre HP si actif */}
        {active && (
          <Image
            source={isPlaying ? GREENBAR : YELLOWBAR}
            style={st.barGif}
            resizeMode="cover"
          />
        )}

        {/* Icone note / EQ / Bouton Play-Pause si actif */}
        {active ? (
          <TouchableOpacity
            style={st.playPauseBtn}
            onPress={() => {
              isPlaying ? pause() : resume();
            }}
            activeOpacity={0.7}
          >
            <PixelIcon type={isPlaying ? 'pause' : 'play'} color={activeColor} size={14} />
          </TouchableOpacity>
        ) : (
          <NoteIcon active={active} />
        )}

        {/* Infos piste */}
        <View style={st.trackInfo}>
          <Text style={[st.trackTitle, active && { color: activeColor }]} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={st.trackArtist} numberOfLines={1}>
            {item.artist}
          </Text>
        </View>

        {/* Duree + coeur si actif */}
        <View style={st.trackRight}>
          {active && (
            <Image source={HEART} style={[st.heartSmall, { tintColor: activeColor }]} resizeMode="contain" />
          )}
          {!!item.duration && (
            <Text style={st.trackDur}>{fmtDur(item.duration)}</Text>
          )}
        </View>
      </TouchableOpacity>
    );
  }, [currentTrack, isPlaying]);

  // ── Render ────────────────────────────────────────────────────────────────
  const displayList = showSearch ? filtered : tracks;

  return (
    <View style={st.root}>
      {/* Fond GIF de combat Deltarune, répété 2 fois verticalement comme sur le lecteur développé */}
      <View style={st.gifBackground} pointerEvents="none">
        <Image
          source={require('../assets/images/combat_background.gif')}
          style={st.gifTile}
          resizeMode="cover"
        />
        <Image
          source={require('../assets/images/combat_background.gif')}
          style={st.gifTile}
          resizeMode="cover"
        />
      </View>
      {/* Overlay semi-transparent pour lisibilité */}
      <View style={st.gifOverlay} pointerEvents="none" />

      {/* Status bar spacer */}
      <View style={{ height: STAT_H, backgroundColor: 'transparent' }} />

      {/* ── HEADER style Samsung Music + pixel ─────────────────────────────── */}
      <View style={st.header}>
        <View style={st.headerLeft}>
          {/* Ralsei petit en header */}
          <Image
            source={(isPlaying && currentTrack) ? VICTORY : RALSEI}
            style={st.ralseiHeader}
            resizeMode="contain"
          />
          <View>
            <Text style={st.headerTitle}>ALBUM LOCAL</Text>
            <Text style={st.headerSub}>
              {scanning
                ? '⟳ Scan...'
                : `${tracks.length} PISTE${tracks.length !== 1 ? 'S' : ''}${folderName ? ' — ' + folderName : ''}`
              }
            </Text>
          </View>
        </View>

        {/* Boutons icones droite */}
        <View style={st.headerRight}>
          <TouchableOpacity style={st.iconBtn} onPress={() => setShowSearch(s => !s)}>
            <PixelIcon type="search" color={showSearch ? C.GREEN : C.WHITE} size={18} />
          </TouchableOpacity>
          <TouchableOpacity style={st.iconBtn} onPress={pickFolder}>
            <PixelFolderIcon color="#E5C158" size={18} />
          </TouchableOpacity>
          <TouchableOpacity style={st.iconBtn} onPress={pickFiles}>
            <PixelPlusIcon color={C.WHITE} size={14} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Bande rose pixel (reference HUD) */}
      <View style={st.hudBand}>
        <View style={st.hudBarKris} />
        <View style={st.hudBarRalsei} />
      </View>

      {/* ── BARRE RECHERCHE ───────────────────────────────────────────────── */}
      {showSearch && (
        <View style={st.searchRow}>
          <Text style={st.searchIcon}>♪</Text>
          <TextInput
            style={st.searchInput}
            value={query}
            onChangeText={setQuery}
            placeholder="Chercher..."
            placeholderTextColor={C.MUTED}
            selectionColor={C.GREEN}
            autoFocus
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')} style={st.clearBtn}>
              <Text style={st.clearTxt}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* ── BARRE TRI (style Samsung Music) ──────────────────────────────── */}
      <View style={st.sortBar}>
        <Text style={st.sortLabel}>⇅ Ordre alpha</Text>
        <View style={st.sortRight}>
          {/* Shuffle */}
          <TouchableOpacity
            style={[st.sortBtn, isShuffleActive && { borderColor: C.GREEN, backgroundColor: C.GREEN_DIM }]}
            onPress={() => {
              setIsShuffleActive(!isShuffleActive);
              if (filtered.length === 0) return;
              const r = filtered[Math.floor(Math.random() * filtered.length)];
              handlePlay(r);
            }}
            activeOpacity={0.7}
          >
            <PixelIcon type="shuffle" color={isShuffleActive ? C.GREEN : C.WHITE} size={16} />
          </TouchableOpacity>
          {/* Play all */}
          <TouchableOpacity
            style={[st.sortBtn, st.sortBtnPlay, isPlaying && { backgroundColor: C.GREEN, borderColor: C.GREEN }]}
            onPress={() => filtered.length > 0 && handlePlay(filtered[0])}
            activeOpacity={0.7}
          >
            <PixelIcon type="play" color={isPlaying ? C.BG : C.WHITE} size={16} />
          </TouchableOpacity>
        </View>
      </View>

      {/* ── CONTENU ──────────────────────────────────────────────────────── */}
      {scanning ? (
        <View style={st.center}>
          <Text style={st.scanTxt}>⟳ Lecture du dossier...</Text>
        </View>
      ) : (showSearch ? filtered : tracks).length === 0 ? (
        <View style={st.center}>
          {tracks.length === 0 ? (
            <>
              <Image source={RALSEI} style={{ width: 64, height: 88 }} resizeMode="contain" />
              <Text style={st.emptyTitle}>AUCUN DOSSIER LIÉ</Text>
              <Text style={st.emptyText}>Choisis un dossier contenant tes{'\n'}fichiers musicaux (.mp3, .wav, ...)</Text>
              <TouchableOpacity
                style={st.selectFolderBtn}
                onPress={pickFolder}
                activeOpacity={0.8}
              >
                <Text style={st.selectFolderBtnTxt}>SÉLECTIONNER UN DOSSIER</Text>
              </TouchableOpacity>
              <Text style={st.tipText}>
                💡 Astuce Android : Si ton téléphone refuse le dossier Download, crée un sous-dossier (ex: "Download/Musiques") et déplace tes fichiers dedans pour pouvoir le lier, ou importe des morceaux un par un.
              </Text>
              <TouchableOpacity
                style={st.fallbackBtn}
                onPress={pickFiles}
                activeOpacity={0.8}
              >
                <Text style={st.fallbackBtnTxt}>OU IMPORTER DES FICHIERS UN PAR UN</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={st.emptyTitle}>AUCUN RÉSULTAT</Text>
              <Text style={st.emptyText}>Rien pour "{query}"</Text>
            </>
          )}
        </View>
      ) : (
        <FlatList
          data={showSearch ? filtered : tracks}
          keyExtractor={t => t.id}
          renderItem={renderItem}
          contentContainerStyle={st.listContent}
          showsVerticalScrollIndicator={false}
          initialNumToRender={20}
          maxToRenderPerBatch={30}
          windowSize={10}
          keyboardShouldPersistTaps="handled"
        />
      )}
    </View>
  );
};

// ── Styles ────────────────────────────────────────────────────────────────────
const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: 'transparent' },

  // Fond GIF Deltarune
  gifBackground: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'column',
    overflow: 'hidden',
    zIndex: -2,
  },
  gifTile: {
    width: '100%',
    flex: 1,
  },
  gifOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    zIndex: -1,
  },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 14, paddingVertical: 10,
    backgroundColor: 'rgba(22, 22, 22, 0.85)', borderBottomWidth: 1, borderBottomColor: C.BORDER,
  },
  headerLeft:  { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  headerTitle: { fontFamily: 'PressStart2P-Regular', fontSize: 10, color: C.WHITE, letterSpacing: 1 },
  headerSub:   { fontFamily: 'PressStart2P-Regular', fontSize: 5,  color: C.GREEN, marginTop: 4, letterSpacing: 0.5 },
  ralseiHeader:{ width: 36, height: 48 },
  headerRight: { flexDirection: 'row', gap: 4 },
  iconBtn:     { padding: 8 },
  iconTxt:     { fontSize: 16, color: C.WHITE },

  // Bande HUD (reference combat)
  hudBand: { height: 5, flexDirection: 'row', backgroundColor: 'transparent' },
  hudBarKris:   { flex: 3, backgroundColor: C.GREEN },   // Vert Ralsei
  hudBarRalsei: { flex: 2, backgroundColor: C.GREEN },      // Vert Ralsei

  // Recherche
  searchRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(28, 28, 28, 0.85)', borderBottomWidth: 1, borderBottomColor: C.BORDER,
    paddingHorizontal: 14, paddingVertical: 6, gap: 10,
  },
  searchIcon:  { fontFamily: 'PressStart2P-Regular', fontSize: 10, color: C.GREEN },
  searchInput: {
    flex: 1, fontFamily: 'PressStart2P-Regular', fontSize: 8,
    color: C.WHITE, paddingVertical: 6, height: 32,
  },
  clearBtn: { padding: 6 },
  clearTxt: { fontFamily: 'PressStart2P-Regular', fontSize: 8, color: C.GREEN },

  // Barre de tri
  sortBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 14, paddingVertical: 6,
    backgroundColor: 'rgba(22, 22, 22, 0.80)', borderBottomWidth: 1, borderBottomColor: C.BORDER,
  },
  sortLabel:    { fontFamily: 'PressStart2P-Regular', fontSize: 6, color: C.GRAY },
  sortRight:    { flexDirection: 'row', gap: 8 },
  sortBtn:      { width: 34, height: 34, borderWidth: 1.5, borderColor: C.BORDER, backgroundColor: 'rgba(0,0,0,0.65)', alignItems: 'center', justifyContent: 'center' },
  sortBtnPlay:  { backgroundColor: C.GREEN, borderColor: '#FFFFFF' },

  // Liste
  listContent: { paddingBottom: 120 },

  // Ligne piste (style Samsung Music + Deltarune)
  row: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: C.BORDER,
    backgroundColor: 'rgba(9, 9, 9, 0.35)', position: 'relative', gap: 12,
  },

  // Bouton play/pause cliquable si actif
  playPauseBtn: {
    width: 40,
    height: 40,
    backgroundColor: 'rgba(0,0,0,0.65)',
    borderWidth: 1.5,
    borderColor: C.BORDER,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },

  // GIF barre HP (fond de la piste active)
  barGif: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: '100%',
    height: '100%',
    opacity: 0.90,
    zIndex: 0,
  },

  // Icone note (carre sombre)
  noteBox:   { width: 40, height: 40, backgroundColor: C.CARD2, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.BORDER },
  noteBoxOn: { backgroundColor: C.GREEN_DIM, borderColor: C.GREEN_BDR },
  noteTxt:   { fontSize: 18, color: C.GRAY },
  noteTxtOn: { color: C.GREEN },

  // EQ bars
  eq:    { width: 40, height: 40, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', gap: 3, paddingBottom: 8 },
  eqBar: { width: 4, backgroundColor: C.GREEN, borderRadius: 1 },

  // Infos
  trackInfo:    { flex: 1, gap: 4 },
  trackTitle:   { fontFamily: 'PressStart2P-Regular', fontSize: 7,  color: C.WHITE, lineHeight: 12 },
  trackTitleOn: { color: C.GREEN },
  trackArtist:  { fontFamily: 'PressStart2P-Regular', fontSize: 5,  color: C.GRAY,  lineHeight: 9 },

  // Droite
  trackRight:  { alignItems: 'flex-end', gap: 4 },
  heartSmall:  { width: 12, height: 12 },
  trackDur:    { fontFamily: 'PressStart2P-Regular', fontSize: 5, color: C.GRAY },

  // Etats speciaux
  center:     { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, paddingHorizontal: 28 },
  scanTxt:    { fontFamily: 'PressStart2P-Regular', fontSize: 8, color: C.GREEN, letterSpacing: 1 },
  emptyTitle: { fontFamily: 'PressStart2P-Regular', fontSize: 11, color: C.WHITE, textAlign: 'center', letterSpacing: 1 },
  emptyText:  { fontFamily: 'PressStart2P-Regular', fontSize: 7,  color: C.GRAY,  textAlign: 'center', lineHeight: 14 },
  selectFolderBtn: {
    marginTop: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    backgroundColor: 'rgba(91, 200, 160, 0.15)',
  },
  selectFolderBtnTxt: {
    fontFamily: 'PressStart2P-Regular',
    fontSize: 7,
    color: '#5BC8A0',
    textAlign: 'center',
  },
  tipText: {
    fontFamily: 'PressStart2P-Regular',
    fontSize: 6,
    color: '#888888',
    textAlign: 'center',
    lineHeight: 12,
    marginTop: 16,
    paddingHorizontal: 12,
  },
  fallbackBtn: {
    marginTop: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderWidth: 1.5,
    borderColor: '#888888',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  fallbackBtnTxt: {
    fontFamily: 'PressStart2P-Regular',
    fontSize: 6,
    color: '#FFFFFF',
    textAlign: 'center',
  },
});

export default AlbumScreen;
