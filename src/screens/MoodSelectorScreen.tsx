import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
  ActivityIndicator,
  StatusBar,
  Platform,
  Animated,
  FlatList,
  ImageBackground,
  ViewToken,
  Image,
  TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MOODS, Mood } from '../utils/constants';
import { addMoodEntry } from '../services/db';
import { getPlaylistForMood } from '../services/deezer';
import { PixelEmoji } from '../components/PixelEmoji';
import { useAudioPlayer } from '../hooks/useAudioPlayer';
import { PixelIcon } from '../components/PixelIcon';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

// Dimensions de la carte
const CARD_W = SCREEN_W * 0.75;
const CARD_H = SCREEN_H * 0.58;
const SIDE_OFFSET = (SCREEN_W - CARD_W) / 2;

const C = {
  CREAM: '#F1F1D3',
  SAGE_LIGHT: '#E3EBD0',
  SAGE_MID: '#C7DDC5',
  SAGE_DARK: '#9FCDA8',
  TEAL: '#7DC2A5',
  INK: '#2D3B2D',
  INK_LIGHT: '#5A6B5A',
};

// Emojis Unicode par humeur
const MOOD_EMOJIS: Record<string, string> = {
  joyeux:       '☀️',
  nostalgique:  '🍂',
  energique:    '⚡',
  melancolique: '🌧️',
  concentre:    '🧠',
  festif:       '🥳',
  amoureux:     '❤️',
  colerique:    '😡',
  fatigue:      '💤',
};

// Sprites Ralsei mappés par humeur
const RALSEI_IMAGES: Record<string, any> = {
  joyeux: require('../assets/ralsei/Joyeux.png'),
  nostalgique: require('../assets/ralsei/Nostalgique.png'),
  energique: require('../assets/ralsei/Energique.png'),
  melancolique: require('../assets/ralsei/melancolique.png'),
  concentre: require('../assets/ralsei/Concentre.png'),
  festif: require('../assets/ralsei/Festif.png'),
  amoureux: require('../assets/ralsei/amoureux.png'),
  colerique: require('../assets/ralsei/colerique.png'),
  fatigue: require('../assets/ralsei/fatigué.png'),
  tobyfox: require('../assets/images/tobyfox_dog.jpg'),
};

export const MoodSelectorScreen: React.FC<any> = ({ navigation }) => {
  const [loadingMood, setLoadingMood] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isUndertaleOnly, setIsUndertaleOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const scrollX = useRef(new Animated.Value(0)).current;
  const flatListRef = useRef<FlatList>(null);

  const { currentTrack } = useAudioPlayer();

  const handleSearchSubmit = () => {
    if (!searchQuery.trim()) return;
    navigation.navigate('Playlist', {
      moodId: 'search-' + searchQuery.trim(),
      moodName: `RECHERCHE: "${searchQuery.trim().substring(0, 10)}"`,
      color: C.TEAL,
      undertaleMode: isUndertaleOnly,
    });
    setSearchQuery('');
  };

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index !== null) {
        setActiveIndex(viewableItems[0].index);
      }
    },
    []
  );

  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 50 }).current;

  const handleSelectMood = async (mood: Mood) => {
    if (loadingMood !== null) return;
    setLoadingMood(mood.id);

    try {
      // Save mood history then navigate — PlaylistScreen handles fetching tracks itself
      await addMoodEntry(mood.name);
      navigation.navigate('Playlist', {
        moodId: mood.id,
        moodName: mood.name,
        color: mood.color,
        undertaleMode: isUndertaleOnly,
      });
    } catch (_err) {
    } finally {
      setLoadingMood(null);
    }
  };

  const renderCard = ({ item, index }: { item: Mood; index: number }) => {
    const inputRange = [
      (index - 1) * CARD_W,
      index * CARD_W,
      (index + 1) * CARD_W,
    ];

    // Rotation 3D Y : cartes de côté tournées
    const rotateY = scrollX.interpolate({
      inputRange,
      outputRange: ['35deg', '0deg', '-35deg'],
      extrapolate: 'clamp',
    });

    // Scale : carte centrale plus grande
    const scale = scrollX.interpolate({
      inputRange,
      outputRange: [0.82, 1, 0.82],
      extrapolate: 'clamp',
    });

    // Opacité : cartes de côté légèrement transparentes
    const opacity = scrollX.interpolate({
      inputRange,
      outputRange: [0.55, 1, 0.55],
      extrapolate: 'clamp',
    });

    const translateX = scrollX.interpolate({
      inputRange,
      outputRange: [CARD_W * 0.06, 0, -CARD_W * 0.06],
      extrapolate: 'clamp',
    });

    const isLoading = loadingMood === item.id;

    return (
      <Animated.View
        style={[
          styles.cardWrapper,
          {
            opacity,
            transform: [
              { perspective: 1000 },
              { translateX },
              { rotateY },
              { scale },
            ],
          },
        ]}
      >
        <TouchableOpacity
          style={[styles.card, { borderColor: item.color }]}
          activeOpacity={0.92}
          onPress={() => handleSelectMood(item)}
          disabled={loadingMood !== null}
        >
          {/* Coins pixel-art décoratifs */}
          <View style={[styles.cornerTL, { backgroundColor: item.color }]} />
          <View style={[styles.cornerTR, { backgroundColor: item.color }]} />
          <View style={[styles.cornerBL, { backgroundColor: item.color }]} />
          <View style={[styles.cornerBR, { backgroundColor: item.color }]} />

          {/* Numéro de la carte */}
          <Text style={[styles.cardNumber, { color: item.color }]}>
            {String(index + 1).padStart(2, '0')}
          </Text>

          {/* Emojis en haut */}
          <View style={styles.emojiWrapper}>
            <PixelEmoji moodId={item.id} color={item.color} size={32} />
          </View>

          {/* Sprite de Ralsei (illustration principale) */}
          <View style={styles.spriteContainer}>
            {isLoading ? (
              <ActivityIndicator color={item.color} size="large" />
            ) : (
              RALSEI_IMAGES[item.id] && (
                <Image
                  source={RALSEI_IMAGES[item.id]}
                  style={styles.ralseiSprite}
                  resizeMode="contain"
                />
              )
            )}
          </View>

          {/* Titre (Nom de la vibe) */}
          <Text style={[styles.cardMoodName, { color: item.color }]}>
            {item.name.toUpperCase()}
          </Text>

          {/* Bouton d'action */}
          <View style={styles.cardBtnWrapper}>
            <View style={[styles.cardBtnShadow, { backgroundColor: item.color + '44' }]} />
            <View style={[styles.cardBtn, { backgroundColor: item.color, borderColor: item.color }]}>
              <Text style={[styles.cardBtnText, { color: '#000000' }]}>
                {isLoading ? 'CHARGEMENT...' : '▶  LANCER'}
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <View style={styles.rootContainer}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Image de fond originale de l'utilisateur */}
      <ImageBackground
        source={require('../assets/images/mood_bg.png')}
        style={styles.bg}
        resizeMode="cover"
      >
        {/* Dégradé vert transparent par dessus */}
        <LinearGradient
          colors={['#9FCDA8F2', '#9FCDA866', '#9FCDA800']}
          locations={[0, 0.45, 1]}
          style={styles.gradientOverlay}
          pointerEvents="none"
        />
      </ImageBackground>

      <SafeAreaView style={styles.safeArea}>
        {/* Barre de Recherche Pixelisée en Haut */}
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="RECHERCHER UNE MUSIQUE..."
            placeholderTextColor="#7DC2A588"
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearchSubmit}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
          />
          <TouchableOpacity
            style={styles.searchBtn}
            onPress={handleSearchSubmit}
            activeOpacity={0.8}
          >
            <PixelIcon type="search" color={C.INK} size={16} />
          </TouchableOpacity>
        </View>

        {/* Flèches d'indication de balayage horizontal — sans texte */}
        <View style={styles.arrowRow}>
          <Text style={styles.arrowText}>◄◄  ►►</Text>
        </View>

        {/* Carousel 3D */}
        <Animated.FlatList
          ref={flatListRef}
          data={MOODS}
          keyExtractor={(item) => item.id}
          renderItem={renderCard}
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToInterval={CARD_W}
          decelerationRate="fast"
          contentContainerStyle={styles.listContent}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { x: scrollX } } }],
            { useNativeDriver: true }
          )}
          scrollEventThrottle={16}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          getItemLayout={(_data, index) => ({
            length: CARD_W,
            offset: CARD_W * index,
            index,
          })}
        />

        {/* Pagination */}
        <View style={styles.paginationRow}>
          {MOODS.map((_, i) => (
            <TouchableOpacity
              key={i}
              onPress={() => flatListRef.current?.scrollToIndex({ index: i, animated: true })}
            >
              <View
                style={[
                  styles.dot,
                  i === activeIndex && styles.dotActive,
                  { backgroundColor: i === activeIndex ? MOODS[activeIndex]?.color : C.SAGE_MID },
                ]}
              />
            </TouchableOpacity>
          ))}
        </View>

        {/* Compteur */}
        <Text style={styles.counter}>
          {String(activeIndex + 1).padStart(2, '0')} / {String(MOODS.length).padStart(2, '0')}
        </Text>
      </SafeAreaView>

      {/* Loading overlay global */}
      {loadingMood !== null && (
        <View style={styles.loadingOverlay} pointerEvents="none">
          <View style={styles.loadingBox}>
            <ActivityIndicator
              color={MOODS.find((m) => m.id === loadingMood)?.color || C.TEAL}
              size="large"
            />
            <Text style={styles.loadingText}>Génération en cours...</Text>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  bg: {
    ...StyleSheet.absoluteFillObject,
  },
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  safeArea: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? (StatusBar as any).currentHeight || 24 : 0,
  },

  // Search Bar
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 20,
    marginBottom: 6,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    height: 52,
    backgroundColor: '#000000',
    borderWidth: 2,
    borderColor: C.TEAL,
    paddingHorizontal: 14,
    fontFamily: 'PressStart2P-Regular',
    fontSize: 10,
    color: '#FFFFFF',
  },
  searchBtn: {
    width: 52,
    height: 52,
    backgroundColor: C.TEAL,
    borderWidth: 2,
    borderColor: C.TEAL,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowRow: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    marginBottom: 8,
  },
  arrowText: {
    fontFamily: 'PressStart2P-Regular',
    fontSize: 20,
    color: C.SAGE_DARK,
    letterSpacing: 6,
  },

  // Carousel
  listContent: {
    paddingHorizontal: SIDE_OFFSET,
    alignItems: 'center',
  },
  cardWrapper: {
    width: CARD_W,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Carte noire style booster
  card: {
    width: CARD_W - 8,
    height: CARD_H,
    backgroundColor: '#000000',
    borderWidth: 3,
    borderRadius: 0,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'space-between',
    position: 'relative',
    overflow: 'hidden',
  },

  // Coins pixel-art
  cornerTL: { position: 'absolute', top: 0, left: 0, width: 8, height: 8 },
  cornerTR: { position: 'absolute', top: 0, right: 0, width: 8, height: 8 },
  cornerBL: { position: 'absolute', bottom: 0, left: 0, width: 8, height: 8 },
  cornerBR: { position: 'absolute', bottom: 0, right: 0, width: 8, height: 8 },

  cardNumber: {
    position: 'absolute',
    top: 10,
    left: 10,
    fontSize: 14,
    fontFamily: 'PressStart2P-Regular',
    opacity: 0.9,
  },

  emojiWrapper: {
    marginTop: 10,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Sprite Ralsei
  spriteContainer: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
  },
  ralseiSprite: {
    width: 110,
    height: 110,
  },

  // Titre Vibe
  cardMoodName: {
    fontSize: 12,
    fontFamily: 'PressStart2P-Regular',
    letterSpacing: 2,
    textAlign: 'center',
    marginBottom: 10,
  },

  // Bouton
  cardBtnWrapper: {
    position: 'relative',
    marginBottom: 8,
    width: '90%',
  },
  cardBtnShadow: {
    position: 'absolute',
    bottom: -3,
    right: -3,
    left: 3,
    top: 3,
  },
  cardBtn: {
    paddingVertical: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBtnText: {
    fontSize: 8.5,
    fontFamily: 'PressStart2P-Regular',
    letterSpacing: 1,
  },

  // Pagination
  paginationRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 14,
  },
  dot: {
    width: 8,
    height: 8,
    backgroundColor: C.SAGE_MID,
  },
  dotActive: {
    width: 16,
    height: 8,
  },
  counter: {
    textAlign: 'center',
    fontSize: 7,
    fontFamily: 'PressStart2P-Regular',
    color: C.CREAM,
    marginTop: 8,
    marginBottom: 4,
    opacity: 0.8,
  },

  // Loading overlay
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 200,
  },
  loadingBox: {
    backgroundColor: C.SAGE_LIGHT,
    borderWidth: 2,
    borderColor: C.SAGE_MID,
    padding: 24,
    alignItems: 'center',
    gap: 14,
  },
  loadingText: {
    fontSize: 7,
    fontFamily: 'PressStart2P-Regular',
    color: C.INK,
    letterSpacing: 1,
  },
  floatingSwitchRow: {
    position: 'absolute',
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 0,
    zIndex: 9999,
    elevation: 10,
  },
  recommendLabel: {
    backgroundColor: '#000000',
    borderWidth: 2,
    borderColor: C.SAGE_MID,
    borderRightWidth: 0,
    paddingHorizontal: 8,
    paddingVertical: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recommendText: {
    fontFamily: 'PressStart2P-Regular',
    fontSize: 5,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  floatingSwitch: {
    width: 64,
    height: 64,
    backgroundColor: '#000000',
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  floatingSwitchActive: {
    borderColor: C.TEAL,
  },
  floatingSwitchInactive: {
    borderColor: C.SAGE_MID,
  },
  switchIcon: {
    width: 50,
    height: 50,
  },
});

export default MoodSelectorScreen;
