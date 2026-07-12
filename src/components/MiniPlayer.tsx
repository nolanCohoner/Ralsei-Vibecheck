import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  Animated,
  Easing,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Svg, { Path } from 'react-native-svg';
import { useAudioPlayer } from '../hooks/useAudioPlayer';
import { PixelIcon } from './PixelIcon';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

const C = {
  CREAM: '#F1F1D3',
  SAGE_LIGHT: '#E3EBD0',
  SAGE_MID: '#C7DDC5',
  SAGE_DARK: '#9FCDA8',
  TEAL: '#7DC2A5',
  INK: '#2D3B2D',
  INK_LIGHT: '#5A6B5A',
};

const formatTime = (ms: number) => {
  const sec = Math.floor(ms / 1000);
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
};

// Goutte pixel-art individuelle qui dérive lentement vers le bas
const PixelDrop: React.FC<{ color: string; delay: number }> = ({ color, delay }) => {
  const animY = useRef(new Animated.Value(-30)).current;
  const startX = useRef(Math.random() * (SCREEN_W - 40) + 20).current;

  useEffect(() => {
    const startAnimation = () => {
      animY.setValue(-30);
      Animated.timing(animY, {
        toValue: SCREEN_H - 120,
        duration: 9000 + Math.random() * 5000,
        delay: delay,
        easing: Easing.linear,
        useNativeDriver: true,
      }).start(() => {
        startAnimation();
      });
    };
    startAnimation();
  }, []);

  // Dérive sinusoïdale légère sur les côtés
  const animX = animY.interpolate({
    inputRange: [-30, SCREEN_H - 120],
    outputRange: [startX - 20, startX + 20],
  });

  return (
    <Animated.View
      style={[
        styles.pixelDrop,
        {
          backgroundColor: color,
          transform: [{ translateY: animY }, { translateX: animX }],
        },
      ]}
    />
  );
};

export const MiniPlayer: React.FC = () => {
  const navigation = useNavigation<any>();
  const {
    currentTrack,
    isPlaying,
    position,
    duration,
    pause,
    resume,
    next,
    previous,
    seek,
    stop,
    isRepeat,
    setIsRepeat,
  } = useAudioPlayer();

  const [isExpanded, setIsExpanded] = useState(false);
  const [isShuffle, setIsShuffle] = useState(false);

  // Éléments de mesure pour rendre la barre de progression réduite interactive
  const reducedTrackRef = useRef<View>(null);
  const [reducedWidth, setReducedWidth] = useState(0);
  const [reducedPageX, setReducedPageX] = useState(0);

  // Éléments de mesure pour rendre la barre de progression développée interactive
  const expandedTrackRef = useRef<View>(null);
  const [expandedWidth, setExpandedWidth] = useState(0);
  const [expandedPageX, setExpandedPageX] = useState(0);

  const rotateValue = useRef(new Animated.Value(0)).current;
  const rotateAnimation = useRef<Animated.CompositeAnimation | null>(null);

  // Rotation infinie du disque — démarre dès que la fenêtre est ouverte
  useEffect(() => {
    if (isExpanded) {
      // Toujours remettre à 0 et relancer proprement
      rotateValue.setValue(0);
      const anim = Animated.loop(
        Animated.timing(rotateValue, {
          toValue: 1,
          duration: 7000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      );
      anim.start();
      rotateAnimation.current = anim;
      return () => {
        anim.stop();
        rotateAnimation.current = null;
      };
    }
  }, [isExpanded]);

  if (!currentTrack) return null;

  const totalSec = Math.max(duration, 1);
  const progressRatio = Math.max(0, Math.min(1, position / totalSec));

  const handlePlayPause = () => {
    if (isPlaying) pause(); else resume();
  };

  const handleExpand = () => {
    setIsExpanded(true);
  };

  const handleCollapse = () => {
    setIsExpanded(false);
  };

  // --- Gestion du Touch & Drag pour le défilement (Seeking) ---
  const handleTouchReduced = (event: any) => {
    if (reducedWidth <= 0) return;
    const pageX = event.nativeEvent.pageX;
    const relativeX = pageX - reducedPageX;
    const percentage = Math.max(0, Math.min(1, relativeX / reducedWidth));
    const seekPositionMs = percentage * duration;
    seek(seekPositionMs);
  };

  const onLayoutReduced = () => {
    if (reducedTrackRef.current) {
      reducedTrackRef.current.measure((x, y, w, h, px, py) => {
        setReducedWidth(w);
        setReducedPageX(px);
      });
    }
  };

  const handleTouchExpanded = (event: any) => {
    if (expandedWidth <= 0) return;
    const pageX = event.nativeEvent.pageX;
    const relativeX = pageX - expandedPageX;
    const percentage = Math.max(0, Math.min(1, relativeX / expandedWidth));
    const seekPositionMs = percentage * duration;
    seek(seekPositionMs);
  };

  const onLayoutExpanded = () => {
    if (expandedTrackRef.current) {
      expandedTrackRef.current.measure((x, y, w, h, px, py) => {
        setExpandedWidth(w);
        setExpandedPageX(px);
      });
    }
  };

  const rotate = rotateValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  if (isExpanded) {
    // === MULTI-FENÊTRE ÉDITION LECTURE DÉVELOPPÉE ===
    return (
      <View style={styles.expandedContainer}>
        {/* Fond GIF de combat Deltarune, répété 2 fois verticalement */}
        <View style={styles.gifBackground} pointerEvents="none">
          <Image
            source={require('../assets/images/combat_background.gif')}
            style={styles.gifTile}
            resizeMode="cover"
          />
          <Image
            source={require('../assets/images/combat_background.gif')}
            style={styles.gifTile}
            resizeMode="cover"
          />
        </View>
        {/* Overlay semi-transparent pour lisibilité */}
        <View style={styles.gifOverlay} pointerEvents="none" />

        {/* Bouton de Fermeture en haut à droite avec une croix pixelisée */}
        <TouchableOpacity
          onPress={handleCollapse}
          style={styles.closeBtn}
          activeOpacity={0.8}
        >
          <PixelIcon type="cross" color={C.TEAL} size={14} />
        </TouchableOpacity>

        {/* Corps principal du grand lecteur */}
        <View style={styles.expandedContent}>
          {/* Titre supérieur */}
          <Text style={styles.nowPlayingTitle}>LECTURE EN COURS</Text>

          {/* Grand Disque tournant avec contours verts #7DC2A5 et corps 100% pixelisé (SVG) */}
          <View style={styles.discOuterFrame}>
            {/* Coins pixelisés pour rendre le cadre carré plus rétro */}
            <View style={styles.discPixelCornerTL} />
            <View style={styles.discPixelCornerTR} />
            <View style={styles.discPixelCornerBL} />
            <View style={styles.discPixelCornerBR} />

            <Animated.View style={[styles.vinylDisc, { transform: [{ rotate }] }]}>
              <Svg width={200} height={200} viewBox="0 0 200 200">
                {/* Corps externe du vinyle (cercle pixelisé en escalier) */}
                <Path
                  d="M 50,0 H 150 V 20 H 180 V 50 H 200 V 150 H 180 V 180 H 150 V 200 H 50 V 180 H 20 V 150 H 0 V 50 H 20 V 20 H 50 Z"
                  fill="#181818"
                  stroke="#7DC2A5"
                  strokeWidth={4}
                />
                {/* Rainures concentriques pixelisées */}
                <Path
                  d="M 65,15 H 135 V 30 H 160 V 55 H 175 V 125 H 160 V 145 H 135 V 160 H 65 V 145 H 40 V 125 H 25 V 55 H 40 V 30 H 65 Z"
                  fill="none"
                  stroke="#2D2D2D"
                  strokeWidth={2}
                />
                <Path
                  d="M 78,35 H 122 V 48 H 145 V 68 H 155 V 112 H 145 V 128 H 122 V 140 H 78 V 128 H 55 V 112 H 45 V 68 H 55 V 48 H 78 Z"
                  fill="none"
                  stroke="#2D2D2D"
                  strokeWidth={2}
                />
                {/* Support central pixelisé du logo */}
                <Path
                  d="M 88,60 H 112 V 70 H 130 V 80 H 140 V 120 H 130 V 130 H 112 V 140 H 88 V 130 H 70 V 120 H 60 V 80 H 70 V 70 H 88 Z"
                  fill="#000000"
                  stroke="#7DC2A5"
                  strokeWidth={3}
                />
              </Svg>

              {/* Cover au centre du disque */}
              <View style={styles.vinylCoverContainer}>
                <Image source={{ uri: currentTrack.coverUrl }} style={styles.vinylCoverImage} />
              </View>

              {/* Trou central du spindle */}
              <View style={styles.vinylCenterHoleAbsolute} />
            </Animated.View>

            {/* Ralsei chantant — au-dessus du disque, coin bas-droite */}
            <Image
              source={require('../assets/images/ralsei_sing.webp')}
              style={styles.ralseiSing}
              resizeMode="contain"
            />
          </View>

          {/* Métadonnées du morceau */}
          <View style={styles.metaContainer}>
            <Text style={styles.expandedTitle} numberOfLines={2}>
              {currentTrack.title.toUpperCase()}
            </Text>
            <Text style={styles.expandedArtist}>
              {currentTrack.artist.toUpperCase()}
            </Text>
          </View>

          {/* Barre de progression pixelisée épaisse INTERACTIVE (Scrollable) */}
          <View style={styles.expandedProgressContainer}>
            <View style={styles.timeRow}>
              <Text style={styles.expandedTimeText}>{formatTime(position)}</Text>
              <Text style={styles.expandedTimeText}>{formatTime(duration)}</Text>
            </View>
            <View
              ref={expandedTrackRef}
              onLayout={onLayoutExpanded}
              onTouchStart={handleTouchExpanded}
              onTouchMove={handleTouchExpanded}
              style={styles.expandedProgressTrack}
            >
              <View style={[styles.expandedProgressFill, { flex: progressRatio }]} />
              <View style={styles.expandedProgressCursor} />
              <View style={[styles.expandedProgressEmpty, { flex: 1 - progressRatio }]} />
            </View>
          </View>

          {/* Outils de contrôle développés */}
          <View style={styles.expandedControls}>
            <TouchableOpacity onPress={() => previous()} style={styles.mainControlBtn}>
              <PixelIcon type="prev" color="#FFFFFF" size={24} />
            </TouchableOpacity>

            {/* Gros bouton play/pause vert */}
            <TouchableOpacity onPress={handlePlayPause} style={styles.expandedPlayBtn}>
              <PixelIcon type={isPlaying ? 'pause' : 'play'} color="#000000" size={22} />
            </TouchableOpacity>

            <TouchableOpacity onPress={() => next()} style={styles.mainControlBtn}>
              <PixelIcon type="next" color="#FFFFFF" size={24} />
            </TouchableOpacity>

            {/* Bouton répéter — style "FIGHT" Deltarune, orange de base, jaune quand actif */}
            <TouchableOpacity
              onPress={() => setIsRepeat(!isRepeat)}
              style={[
                styles.fightRepeatBtn,
                isRepeat && styles.fightRepeatBtnActive,
              ]}
            >
              <PixelIcon
                type="repeat"
                color={isRepeat ? '#FFE000' : '#E07A1A'}
                size={18}
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  // === BARRE DE LECTURE RÉDUITE (FOND NOIR & CONTOURS TEAL - STYLE UNIFIÉ) ===
  return (
    <View style={styles.container}>
      {/* Barre de progression épaisse INTERACTIVE (Scrollable) */}
      <View
        ref={reducedTrackRef}
        onLayout={onLayoutReduced}
        onTouchStart={handleTouchReduced}
        onTouchMove={handleTouchReduced}
        style={styles.progressTrack}
      >
        <View style={[styles.progressFill, { flex: progressRatio }]} />
        <View style={styles.progressCursor} />
        <View style={[styles.progressEmpty, { flex: 1 - progressRatio }]} />
      </View>

      <View style={styles.mainRow}>
        {/* Bouton de Fermeture / Désélection de la musique pour la retirer */}
        <TouchableOpacity
          onPress={() => stop()}
          style={styles.deselectBtn}
          activeOpacity={0.8}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <PixelIcon type="cross" color={C.TEAL} size={16} />
        </TouchableOpacity>

        {/* Zone cliquable centrale (ouvre le grand lecteur) */}
        <TouchableOpacity
          style={styles.centerClickZone}
          onPress={handleExpand}
          activeOpacity={0.85}
        >
          {/* Pochette */}
          <Image source={{ uri: currentTrack.coverUrl }} style={styles.cover} />

          {/* Infos */}
          <View style={styles.trackInfo}>
            <Text style={styles.trackTitle} numberOfLines={1}>
              {currentTrack.title}
            </Text>
            <Text style={styles.trackArtist} numberOfLines={1}>
              {currentTrack.artist}
            </Text>
          </View>

          {/* Temps */}
          <Text style={styles.timeText}>{formatTime(position)}</Text>
        </TouchableOpacity>

        {/* Contrôles réduits */}
        <View style={styles.controls}>
          <TouchableOpacity
            onPress={handlePlayPause}
            style={styles.playBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <PixelIcon type={isPlaying ? 'pause' : 'play'} color={C.TEAL} size={16} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  // --- STYLE MINI-PLAYER RÉDUIT STYLE SOMBRE UNIFIÉ ---
  container: {
    position: 'absolute',
    bottom: 66,
    left: 0,
    right: 0,
    backgroundColor: '#000000', // Sali sombre unifié
    borderTopWidth: 2,
    borderBottomWidth: 2,
    borderColor: C.TEAL, // Contours vert clair
    zIndex: 999,
    elevation: 8,
  },
  progressTrack: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 8, // Un peu plus épaisse pour manipuler facilement au toucher
    backgroundColor: '#181818',
  },
  progressFill: {
    height: '100%',
    backgroundColor: C.TEAL,
  },
  progressCursor: {
    width: 6,
    height: 12,
    backgroundColor: '#FFFFFF',
    zIndex: 1,
  },
  progressEmpty: {
    height: '100%',
    backgroundColor: '#333333',
  },
  mainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 8,
  },
  deselectBtn: {
    width: 32,
    height: 32,
    backgroundColor: '#000000',
    borderWidth: 2,
    borderColor: C.TEAL, // Bordure verte assortie
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerClickZone: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cover: {
    width: 40,
    height: 40,
    borderWidth: 2,
    borderColor: C.TEAL,
  },
  trackInfo: {
    flex: 1,
    gap: 2,
  },
  trackTitle: {
    fontSize: 7,
    fontFamily: 'PressStart2P-Regular',
    color: '#FFFFFF', // Texte clair
  },
  trackArtist: {
    fontSize: 5.5,
    fontFamily: 'PressStart2P-Regular',
    color: C.TEAL, // Artiste vert
  },
  timeText: {
    fontSize: 6,
    fontFamily: 'PressStart2P-Regular',
    color: C.TEAL, // Temps vert
    minWidth: 36,
    textAlign: 'right',
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  playBtn: {
    width: 34,
    height: 34,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: C.TEAL,
  },

  // --- STYLE GRAND LECTEUR DÉVELOPPÉ (FOND NOIR & GOUTTES) ---
  expandedContainer: {
    position: 'absolute',
    top: 0,
    bottom: 66,
    left: 0,
    right: 0,
    backgroundColor: 'transparent',
    zIndex: 9999,
    paddingTop: Platform.OS === 'android' ? 40 : 20,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
    paddingBottom: 24,
    overflow: 'hidden',
  },
  gifBackground: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'column',
    overflow: 'hidden',
  },
  gifTile: {
    width: '100%',
    flex: 1,
  },
  gifOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
  },
  pixelDrop: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 0,
    opacity: 0.45,
  },
  closeBtn: {
    position: 'absolute',
    top: Platform.OS === 'android' ? 44 : 24,
    right: 24,
    width: 36,
    height: 36,
    backgroundColor: '#000000',
    borderWidth: 2,
    borderColor: C.TEAL,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10000,
  },
  expandedContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-around',
    marginTop: 20,
  },
  nowPlayingTitle: {
    fontSize: 8,
    fontFamily: 'PressStart2P-Regular',
    color: C.SAGE_MID,
    letterSpacing: 1.5,
  },

  // Cadre du disque vinyle pixelisé avec contours verts #7DC2A5
  discOuterFrame: {
    width: 220,
    height: 220,
    backgroundColor: 'transparent',
    borderWidth: 4,
    borderColor: '#7DC2A5',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  discPixelCornerTL: { position: 'absolute', top: -4, left: -4, width: 14, height: 14, backgroundColor: '#000000' },
  discPixelCornerTR: { position: 'absolute', top: -4, right: -4, width: 14, height: 14, backgroundColor: '#000000' },
  discPixelCornerBL: { position: 'absolute', bottom: -4, left: -4, width: 14, height: 14, backgroundColor: '#000000' },
  discPixelCornerBR: { position: 'absolute', bottom: -4, right: -4, width: 14, height: 14, backgroundColor: '#000000' },

  // Ralsei chantant — positionné au-dessus du disque, coin bas-droite
  ralseiSing: {
    position: 'absolute',
    bottom: -10,
    right: -14,
    width: 80,
    height: 80,
    zIndex: 20,
    // Pas de pointerEvents (image déco)
  },

  vinylDisc: {
    width: 200,
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  vinylCoverContainer: {
    position: 'absolute',
    top: 70,
    left: 70,
    width: 60,
    height: 60,
    borderRadius: 30,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#7DC2A5',
  },
  vinylCoverImage: {
    width: '100%',
    height: '100%',
  },
  vinylCenterHoleAbsolute: {
    position: 'absolute',
    top: 92,
    left: 92,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#000000',
    borderWidth: 2,
    borderColor: '#7DC2A5',
  },

  // Métadonnées
  metaContainer: {
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 20,
    gap: 8,
  },
  expandedTitle: {
    fontSize: 9.5,
    fontFamily: 'PressStart2P-Regular',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 18,
    letterSpacing: 0.5,
  },
  expandedArtist: {
    fontSize: 7.5,
    fontFamily: 'PressStart2P-Regular',
    color: C.TEAL,
    textAlign: 'center',
  },

  // Barre de progression
  expandedProgressContainer: {
    width: '100%',
    gap: 6,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  expandedTimeText: {
    fontSize: 6.5,
    fontFamily: 'PressStart2P-Regular',
    color: C.SAGE_MID,
  },
  expandedProgressTrack: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 10,
    backgroundColor: '#181818',
    borderWidth: 2,
    borderColor: C.SAGE_MID,
  },
  expandedProgressFill: {
    height: '100%',
    backgroundColor: C.TEAL,
  },
  expandedProgressCursor: {
    width: 8,
    height: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#000000',
    zIndex: 1,
  },
  expandedProgressEmpty: {
    height: '100%',
  },

  // Contrôles
  expandedControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    width: '100%',
    paddingHorizontal: 10,
  },
  mainControlBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  expandedPlayBtn: {
    width: 56,
    height: 56,
    backgroundColor: C.TEAL,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  subControlBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#333333',
    backgroundColor: '#111111',
  },
  subControlActive: {
    borderColor: C.TEAL,
  },
  // Bouton répéter style FIGHT Deltarune
  fightRepeatBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#E07A1A',
    backgroundColor: 'rgba(224, 122, 26, 0.15)',
  },
  fightRepeatBtnActive: {
    borderColor: '#FFE000',
    backgroundColor: 'rgba(255, 224, 0, 0.18)',
  },
});

export default MiniPlayer;
