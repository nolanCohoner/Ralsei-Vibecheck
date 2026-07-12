import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  Platform,
  StatusBar,
  ScrollView,
  Modal,
  TouchableWithoutFeedback,
  Alert,
  Image,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { getCurrentUser, signOut } from '../services/auth';
import { isMockMode, supabase } from '../services/supabase';
import { getMoodHistory, calcStreakDays, getInstallDate, getXP, resetXP } from '../services/db';
import { MOODS } from '../utils/constants';
import { PixelEmoji } from '../components/PixelEmoji';
import { PixelIcon } from '../components/PixelIcon';
import { playSFX } from '../utils/sfx';
import {
  AVATARS_COLLECTION,
  BACKGROUNDS_COLLECTION,
  getLevelFromXP,
  getXPForNextLevel,
  getXPForCurrentLevel,
  XP_LEVELS,
} from '../utils/profileResources';

const C = {
  CREAM: '#F1F1D3',
  SAGE_LIGHT: '#E3EBD0',
  SAGE_MID: '#C7DDC5',
  SAGE_DARK: '#9FCDA8',
  TEAL: '#7DC2A5',
  INK: '#2D3B2D',
  INK_LIGHT: '#5A6B5A',
  ERROR: '#C0392B',
  WHITE: '#FFFFFF',
};

const AVATAR_KEY = 'vibecheck_avatar';
const BG_KEY = 'vibecheck_profile_bg';

// Configuration pour un effet de dégradé pixelisé (bandes de couleurs distinctes)
const GRADIENT_COLORS = [
  'rgba(125, 194, 165, 0.85)',
  'rgba(125, 194, 165, 0.85)',
  'rgba(159, 205, 168, 0.85)',
  'rgba(159, 205, 168, 0.85)',
  'rgba(199, 221, 197, 0.85)',
  'rgba(199, 221, 197, 0.85)',
  'rgba(227, 235, 208, 0.85)',
  'rgba(227, 235, 208, 0.85)',
  'rgba(241, 241, 211, 0.85)',
  'rgba(241, 241, 211, 0.85)',
] as const;
const GRADIENT_LOCATIONS = [
  0.0, 0.20,
  0.20, 0.40,
  0.40, 0.60,
  0.60, 0.80,
  0.80, 1.00,
] as const;

// Dégradé rouge pixelisé pour le bouton de déconnexion
const LOGOUT_GRADIENT_COLORS = [
  'rgba(255, 223, 219, 0.85)',
  'rgba(255, 223, 219, 0.85)',
  'rgba(251, 191, 184, 0.85)',
  'rgba(251, 191, 184, 0.85)',
  'rgba(247, 159, 149, 0.85)',
  'rgba(247, 159, 149, 0.85)',
  'rgba(243, 128, 113, 0.85)',
  'rgba(243, 128, 113, 0.85)',
  'rgba(240, 96, 77, 0.85)',
  'rgba(240, 96, 77, 0.85)',
] as const;

// ── Barre de progression style Deltarune RPG ──────────────────────────────────
const RPGBar: React.FC<{ progress: number; fillColor: string }> = ({ progress, fillColor }) => {
  const widthPercent = `${Math.max(0, Math.min(100, progress * 100))}%`;
  return (
    <View style={styles.rpgBarOuter}>
      <View style={[styles.rpgBarInner, { width: widthPercent, backgroundColor: fillColor } as any]} />
    </View>
  );
};

export const ProfileScreen: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [resetModalVisible, setResetModalVisible] = useState(false);
  const [avatarId, setAvatarId] = useState('kris');
  const [bgId, setBgId] = useState('school');
  const [avatarPickerVisible, setAvatarPickerVisible] = useState(false);
  const [bgPickerVisible, setBgPickerVisible] = useState(false);
  const [stats, setStats] = useState({ total: 0, dominantMood: '', streak: 0, installDate: '' });
  const [xp, setXp] = useState(0);
  const [userLevel, setUserLevel] = useState(0);
  const user = getCurrentUser();

  useFocusEffect(
    useCallback(() => {
      loadAvatar();
      loadBg();
      loadStats();
    }, [])
  );

  const loadAvatar = async () => {
    const saved = await AsyncStorage.getItem(AVATAR_KEY);
    if (saved) {
      setAvatarId(saved);
    } else {
      setAvatarId('kris');
    }
  };

  const saveAvatar = async (id: string) => {
    // Vérifier si le niveau est suffisant
    const asset = AVATARS_COLLECTION.find(a => a.id === id);
    if (asset && userLevel < asset.levelRequired) {
      Alert.alert('🔒 Verrouillé', `Cet avatar requiert le Niveau ${asset.levelRequired}. Gagne de l'XP en écoutant des musiques !`);
      playSFX('damage');
      return;
    }
    playSFX('save');
    setAvatarId(id);
    await AsyncStorage.setItem(AVATAR_KEY, id);
    setAvatarPickerVisible(false);
  };

  const loadBg = async () => {
    const saved = await AsyncStorage.getItem(BG_KEY);
    if (saved) {
      setBgId(saved);
    } else {
      setBgId('school');
    }
  };

  const saveBg = async (id: string) => {
    // Vérifier si le niveau est suffisant
    const asset = BACKGROUNDS_COLLECTION.find(a => a.id === id);
    if (asset && userLevel < asset.levelRequired) {
      Alert.alert('🔒 Verrouillé', `Ce décor requiert le Niveau ${asset.levelRequired}. Gagne de l'XP en écoutant des musiques !`);
      playSFX('damage');
      return;
    }
    playSFX('closet_impact');
    setBgId(id);
    await AsyncStorage.setItem(BG_KEY, id);
    setBgPickerVisible(false);
  };

  const loadStats = async () => {
    try {
      const history = await getMoodHistory();
      const total = history.length;

      // Humeur dominante
      const counts: Record<string, number> = {};
      history.forEach(h => { counts[h.mood] = (counts[h.mood] || 0) + 1; });
      const dominantMood = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || '';

      // Streak sur jours calendaires uniques
      const streak = calcStreakDays(history);

      // Date d'installation
      const installIso = await getInstallDate();
      const installDate = installIso
        ? new Date(installIso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
        : '';

      // Charger l'XP et le Niveau
      const currentXp = await getXP();
      const currentLevel = getLevelFromXP(currentXp);

      setXp(currentXp);
      setUserLevel(currentLevel);
      setStats({ total, dominantMood, streak, installDate });
    } catch (_err) {}
  };

  const handleLogout = async () => {
    playSFX('select');
    setLoading(true);
    try { await signOut(); } catch (_err) {}
    finally { setLoading(false); }
  };

  const handleResetData = async () => {
    setResetModalVisible(false);
    setResetting(true);
    playSFX('damage');
    try {
      const user = getCurrentUser();
      if (!user) return;

      if (isMockMode) {
        await AsyncStorage.removeItem(`vibecheck_history_${user.id}`);
        await AsyncStorage.removeItem(`vibecheck_favorites_${user.id}`);
      } else {
        await supabase!.from('mood_history').delete().eq('user_id', user.id);
        await supabase!.from('favorites').delete().eq('user_id', user.id);
      }

      // Réinitialiser également l'XP de l'utilisateur
      await resetXP();
      setXp(0);
      setUserLevel(0);
      setAvatarId('kris');
      setBgId('school');
      await AsyncStorage.setItem(AVATAR_KEY, 'kris');
      await AsyncStorage.setItem(BG_KEY, 'school');

      setStats(prev => ({ total: 0, dominantMood: '', streak: 0, installDate: prev.installDate }));
      Alert.alert('✅ Réinitialisation', 'Tes données et ton XP ont été effacées.\nTon compte est conservé.');
    } catch (_err) {
      Alert.alert('Erreur', 'Impossible de réinitialiser les données.');
    } finally {
      setResetting(false);
    }
  };

  const currentAvatar = AVATARS_COLLECTION.find(a => a.id === avatarId) || AVATARS_COLLECTION[0];
  const currentBg = BACKGROUNDS_COLLECTION.find(b => b.id === bgId) || BACKGROUNDS_COLLECTION[0];
  const dominantMoodCfg = MOODS.find(m => m.name.toLowerCase() === stats.dominantMood.toLowerCase());

  // Calculs pour la barre d'XP
  const nextLevelXP = getXPForNextLevel(userLevel);
  const currentLevelMinXP = getXPForCurrentLevel(userLevel);
  const xpNeededForNext = nextLevelXP - currentLevelMinXP;
  const xpProgressInLevel = xp - currentLevelMinXP;
  
  // Progression de la barre d'XP (entre 0 et 1)
  const xpBarProgress = userLevel >= 6 
    ? 1.0 
    : xpNeededForNext > 0 
      ? Math.max(0, Math.min(1, xpProgressInLevel / xpNeededForNext)) 
      : 0;

  // Nombre de musiques restantes
  const songsRemaining = userLevel >= 6 ? 0 : nextLevelXP - xp;

  return (
    <View style={[styles.container, { backgroundColor: '#0F120F' }]}>
      {/* Fond d'écran prenant toute la page (PNG ou GIF) */}
      <Image source={currentBg.source} style={styles.absoluteBackground} resizeMode="cover" />
      
      <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* ── ZONE SUPÉRIEURE PERSONNALISABLE (TRANSPARENTE) ── */}
        <View style={[styles.headerContainer, { backgroundColor: 'transparent' }]}>
          {/* Avatar au centre */}
          <TouchableOpacity
            style={styles.avatarContainer}
            onPress={() => setAvatarPickerVisible(true)}
            activeOpacity={0.8}
          >
            <View style={[styles.avatarBox, { backgroundColor: 'rgba(0, 0, 0, 0.40)', borderColor: '#FFFFFF' }]}>
              <Image source={currentAvatar.source} style={styles.avatarImg} />
            </View>
            <View style={styles.avatarEditBadge}>
              <Text style={styles.avatarEditText}>✏</Text>
            </View>
          </TouchableOpacity>

          {/* Titre juste sous la photo */}
          <Text style={styles.profileTitle}>PROFIL</Text>

          {/* Email mis en avant sous le titre */}
          <Text style={styles.profileEmail} numberOfLines={1}>
            {user?.email || 'Anonyme'}
          </Text>

          {/* Boutons d'action pour modifier Avatar & Fond */}
          <View style={styles.actionButtonsRow}>
            <TouchableOpacity 
              style={styles.editBtn} 
              onPress={() => setAvatarPickerVisible(true)}
              activeOpacity={0.7}
            >
              <PixelIcon type="avatar-char" color={C.WHITE} size={24} />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.editBtn} 
              onPress={() => setBgPickerVisible(true)}
              activeOpacity={0.7}
            >
              <PixelIcon type="building" color={C.WHITE} size={24} />
            </TouchableOpacity>
          </View>
        </View>

        {/* ── ZONE DE L'XP (DÉTACHÉE) ── */}
        <LinearGradient
          colors={GRADIENT_COLORS}
          locations={GRADIENT_LOCATIONS}
          style={styles.xpCard}
        >
          <View style={styles.xpCardTitleRow}>
            <PixelIcon type="stats" color={C.INK} size={12} />
            <Text style={styles.xpCardTitle}>NIVEAU AVENTURIER</Text>
          </View>
          
          <View style={styles.xpInfoRow}>
            <Text style={styles.xpLevelLabel}>NIV. {userLevel}</Text>
            {userLevel < 6 ? (
              <Text style={styles.xpLevelNext}>PROCHAIN: NIV. {userLevel + 1}</Text>
            ) : (
              <Text style={styles.xpLevelNext}>NIVEAU MAX</Text>
            )}
          </View>

          <RPGBar progress={xpBarProgress} fillColor="#FFD700" />

          <Text style={styles.xpProgressText}>
            {userLevel >= 6 
              ? `XP: ${xp} (NIV. MAX atteint !)`
              : `XP: ${xp} / ${nextLevelXP} (${songsRemaining} musiques restantes)`
            }
          </Text>
        </LinearGradient>

        {/* ── MES STATISTIQUES (HUD DE COMBAT - DEGRADE SEMI-TRANSPARENT) ── */}
        <LinearGradient
          colors={GRADIENT_COLORS}
          locations={GRADIENT_LOCATIONS}
          style={styles.card}
        >
          <View style={styles.cardTitleRow}>
            <View style={[styles.cardTitleDot, { backgroundColor: C.INK }]} />
            <Text style={styles.cardTitle}>STATS DE COMBAT</Text>
          </View>

          <View style={styles.statsList}>
            {/* Stat Sessions - Version RPG */}
            <View style={styles.statItemRow}>
              <Text style={styles.statLabelCol}>SESSIONS</Text>
              <RPGBar progress={stats.total > 0 ? (stats.total % 10 === 0 ? 1 : (stats.total % 10) / 10) : 0} fillColor="#5BC8A0" />
              <Text style={styles.statValueCol}>
                NIV.{Math.floor(stats.total / 10) + 1} ({stats.total})
              </Text>
            </View>

            {/* Stat Streak - Version HP bar */}
            <View style={styles.statItemRow}>
              <Text style={styles.statLabelCol}>STREAK</Text>
              <RPGBar progress={stats.streak > 0 ? Math.min(stats.streak / 7, 1) : 0} fillColor="#E91E8C" />
              <Text style={styles.statValueCol}>{stats.streak} JOURS</Text>
            </View>

            {/* Stat Humeur - Badge Rétro */}
            <View style={styles.statItemRow}>
              <Text style={styles.statLabelCol}>DOMINANTE</Text>
              <View style={[styles.moodBadge, { borderColor: C.INK }]}>
                <Text style={[styles.moodBadgeTxt, { color: C.INK }]}>
                  {stats.dominantMood ? stats.dominantMood.toUpperCase() : 'AUCUNE'}
                </Text>
              </View>
              <View style={styles.statIconRight}>
                {dominantMoodCfg ? (
                  <PixelEmoji moodId={dominantMoodCfg.id} color={C.INK} size={16} />
                ) : (
                  <Text style={{ fontSize: 11, color: C.INK }}>🎵</Text>
                )}
              </View>
            </View>

            {/* Inscription */}
            {!!stats.installDate && (
              <View style={styles.statItemRow}>
                <Text style={styles.statLabelCol}>AVENTURE</Text>
                <View style={styles.adventureSpacer} />
                <Text style={[styles.statValueCol, { color: C.INK }]}>
                  {stats.installDate.toUpperCase()}
                </Text>
              </View>
            )}
          </View>
        </LinearGradient>

        {/* Bouton réinitialiser les données */}
        <TouchableOpacity
          onPress={() => setResetModalVisible(true)}
          style={styles.resetBtn}
          disabled={resetting}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={GRADIENT_COLORS}
            locations={GRADIENT_LOCATIONS}
            style={styles.btnGradient}
          >
            {resetting ? (
              <ActivityIndicator color={C.INK} size="small" />
            ) : (
              <Text style={styles.resetText}>♻ REINITIALISER LES STATS</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>

        {/* Bouton déconnexion */}
        <TouchableOpacity
          onPress={handleLogout}
          style={styles.logoutBtn}
          disabled={loading}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={LOGOUT_GRADIENT_COLORS}
            locations={GRADIENT_LOCATIONS}
            style={styles.btnGradient}
          >
            {loading ? (
              <ActivityIndicator color={C.INK} size="small" />
            ) : (
              <Text style={styles.logoutText}>SE DECONNECTER</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>

        <View style={{ height: 140 }} />
      </ScrollView>

      {/* Modal confirmation réinitialisation */}
      <Modal
        visible={resetModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setResetModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setResetModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.resetModal}>
                <Text style={styles.resetModalTitle}>⚠ ATTENTION</Text>
                <Text style={styles.resetModalBody}>
                  Cette action va supprimer :{`\n`}
                  • Tout ton historique d'humeurs{`\n`}
                  • Tous tes favoris musicaux{`\n\n`}
                  Ton compte et ton avatar seront conservés.{`\n\n`}
                  Es-tu sûr(e) ?
                </Text>
                <View style={styles.resetModalBtns}>
                  <TouchableOpacity
                    style={styles.resetModalCancel}
                    onPress={() => setResetModalVisible(false)}
                  >
                    <Text style={styles.resetModalCancelTxt}>ANNULER</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.resetModalConfirm}
                    onPress={handleResetData}
                  >
                    <Text style={styles.resetModalConfirmTxt}>CONFIRMER</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Modal sélecteur d'avatar */}
      <Modal
        visible={avatarPickerVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setAvatarPickerVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setAvatarPickerVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.avatarModal}>
                <Text style={styles.avatarModalTitle}>CHOISIR MON AVATAR</Text>
                <ScrollView 
                  style={{ maxHeight: 400, marginTop: 10 }} 
                  contentContainerStyle={styles.avatarGrid}
                  showsVerticalScrollIndicator={true}
                >
                  {AVATARS_COLLECTION.map(avatar => {
                    const isLocked = userLevel < avatar.levelRequired;
                    return (
                      <TouchableOpacity
                        key={avatar.id}
                        style={[
                          styles.avatarOption,
                          avatarId === avatar.id && styles.avatarOptionSelected,
                          isLocked && styles.avatarOptionLocked,
                        ]}
                        onPress={() => saveAvatar(avatar.id)}
                        activeOpacity={isLocked ? 0.9 : 0.7}
                      >
                        <Image source={avatar.source} style={styles.avatarOptionImg} />
                        {isLocked && (
                          <View style={styles.lockOverlay}>
                            <Text style={styles.lockText}>🔒 L.{avatar.levelRequired}</Text>
                          </View>
                        )}
                        <Text style={styles.avatarOptionLabel} numberOfLines={1}>
                          {avatar.label.toUpperCase()}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Modal sélecteur de fond de profil */}
      <Modal
        visible={bgPickerVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setBgPickerVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setBgPickerVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.avatarModal}>
                <Text style={styles.avatarModalTitle}>CHOISIR MON DECOR DE FOND</Text>
                <ScrollView 
                  style={{ maxHeight: 400, marginTop: 10 }} 
                  contentContainerStyle={styles.avatarGrid}
                  showsVerticalScrollIndicator={true}
                >
                  {BACKGROUNDS_COLLECTION.map(bg => {
                    const isLocked = userLevel < bg.levelRequired;
                    return (
                      <TouchableOpacity
                        key={bg.id}
                        style={[
                          styles.avatarOption,
                          bgId === bg.id && styles.avatarOptionSelected,
                          isLocked && styles.avatarOptionLocked,
                        ]}
                        onPress={() => saveBg(bg.id)}
                        activeOpacity={isLocked ? 0.9 : 0.7}
                      >
                        <Image source={bg.source} style={styles.bgOptionImg} />
                        {isLocked && (
                          <View style={styles.lockOverlay}>
                            <Text style={styles.lockText}>🔒 L.{bg.levelRequired}</Text>
                          </View>
                        )}
                        <Text style={styles.avatarOptionLabel} numberOfLines={1}>
                          {bg.label.toUpperCase()}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  absoluteBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  scrollContent: { padding: 0 },

  // XP Card
  xpCard: {
    borderWidth: 2,
    borderColor: '#FFFFFF',
    padding: 16,
    marginTop: 16,
    marginHorizontal: 16,
  },
  xpCardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  xpCardTitle: {
    fontSize: 9.5,
    fontFamily: 'PressStart2P-Regular',
    color: C.INK,
    letterSpacing: 1,
  },
  xpInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  xpLevelLabel: {
    fontSize: 9.5,
    fontFamily: 'PressStart2P-Regular',
    color: C.INK,
  },
  xpLevelNext: {
    fontSize: 7.5,
    fontFamily: 'PressStart2P-Regular',
    color: C.INK_LIGHT,
  },
  xpProgressText: {
    fontSize: 6.5,
    fontFamily: 'PressStart2P-Regular',
    color: C.INK_LIGHT,
    marginTop: 10,
    textAlign: 'center',
  },

  // En-tête personnalisé style Deltarune
  headerContainer: {
    paddingTop: Platform.OS === 'android' ? (StatusBar as any).currentHeight || 24 : 40,
    paddingBottom: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 3,
    borderColor: '#FFFFFF',
  },
  avatarContainer: { position: 'relative', marginBottom: 12 },
  avatarBox: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    overflow: 'hidden',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  avatarEmoji: { fontSize: 36, color: C.WHITE },
  avatarEditBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: C.TEAL,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: C.INK,
  },
  avatarEditText: { fontSize: 10, color: C.INK },

  // Textes profil
  profileTitle: {
    fontSize: 12,
    fontFamily: 'PressStart2P-Regular',
    color: C.WHITE,
    marginBottom: 8,
    letterSpacing: 2,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 1,
  },
  profileEmail: {
    fontSize: 10,
    fontFamily: 'PressStart2P-Regular',
    color: '#FFFFFF',
    marginBottom: 16,
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 1,
  },

  // Boutons modifier
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  editBtn: {
    width: 46,
    height: 46,
    borderWidth: 2,
    borderColor: C.WHITE,
    backgroundColor: 'rgba(0, 0, 0, 0.60)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Cartes / Sections
  card: {
    borderWidth: 2,
    borderColor: '#FFFFFF',
    padding: 16,
    marginTop: 16,
    marginHorizontal: 16,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    gap: 8,
  },
  cardTitleDot: { width: 6, height: 6 },
  cardTitle: {
    fontSize: 10,
    fontFamily: 'PressStart2P-Regular',
    color: C.INK,
    letterSpacing: 1,
  },

  // Liste des Statistiques
  statsList: {
    gap: 10,
  },
  statItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: 'rgba(45, 59, 45, 0.15)',
    paddingVertical: 10,
    paddingHorizontal: 12,
    gap: 10,
  },
  statIconCol: {
    width: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statLabelCol: {
    fontFamily: 'PressStart2P-Regular',
    fontSize: 9.5,
    color: C.INK,
    minWidth: 90,
  },
  statValueCol: {
    fontFamily: 'PressStart2P-Regular',
    fontSize: 9.5,
    color: C.INK,
    textAlign: 'right',
  },
  rpgBarOuter: {
    height: 10,
    flex: 1,
    backgroundColor: '#000000',
    borderWidth: 1.5,
    borderColor: C.INK,
    marginHorizontal: 12,
  },
  rpgBarInner: {
    height: '100%',
  },
  moodBadge: {
    flex: 1,
    borderWidth: 1.5,
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.40)',
    marginHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moodBadgeTxt: {
    fontFamily: 'PressStart2P-Regular',
    fontSize: 9.5,
    letterSpacing: 0.5,
  },
  statIconRight: {
    width: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  adventureSpacer: {
    flex: 1,
  },

  // Boutons d'action internes (style liste Samsung)
  actionRowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: C.CREAM,
    borderWidth: 1.5,
    borderColor: C.SAGE_MID,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 8,
  },
  actionRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  actionRowText: {
    fontFamily: 'PressStart2P-Regular',
    fontSize: 7,
    color: C.INK,
  },
  actionRowArrow: {
    fontFamily: 'PressStart2P-Regular',
    fontSize: 8,
    color: C.INK_LIGHT,
  },

  // Infos
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderColor: C.SAGE_MID,
    gap: 12,
  },
  infoLabel: {
    fontSize: 6.5,
    fontFamily: 'PressStart2P-Regular',
    color: C.INK_LIGHT,
    width: 80,
  },
  infoValue: {
    fontSize: 7,
    fontFamily: 'PressStart2P-Regular',
    color: C.INK,
    flex: 1,
  },
  infoStatus: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 },
  statusDot: { width: 8, height: 8 },

  // Modal reset
  resetModal: {
    margin: 24,
    backgroundColor: C.CREAM,
    borderWidth: 3,
    borderColor: C.SAGE_DARK,
    padding: 20,
    gap: 16,
  },
  resetModalTitle: {
    fontSize: 10,
    fontFamily: 'PressStart2P-Regular',
    color: C.INK,
    textAlign: 'center',
    letterSpacing: 1,
  },
  resetModalBody: {
    fontSize: 7,
    fontFamily: 'PressStart2P-Regular',
    color: C.INK_LIGHT,
    lineHeight: 16,
    textAlign: 'left',
  },
  resetModalBtns: {
    flexDirection: 'row',
    gap: 10,
  },
  resetModalCancel: {
    flex: 1,
    height: 44,
    borderWidth: 2,
    borderColor: C.SAGE_DARK,
    backgroundColor: C.SAGE_LIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resetModalCancelTxt: {
    fontSize: 7,
    fontFamily: 'PressStart2P-Regular',
    color: C.INK_LIGHT,
  },
  resetModalConfirm: {
    flex: 1,
    height: 44,
    borderWidth: 2,
    borderColor: C.ERROR,
    backgroundColor: C.ERROR,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resetModalConfirmTxt: {
    fontSize: 7,
    fontFamily: 'PressStart2P-Regular',
    color: '#FFF',
  },

  // Modal avatar
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(45,59,45,0.35)',
    justifyContent: 'flex-end',
  },
  avatarModal: {
    backgroundColor: C.CREAM,
    borderTopWidth: 3,
    borderColor: C.SAGE_MID,
    padding: 20,
    gap: 16,
  },
  avatarModalTitle: {
    fontSize: 9,
    fontFamily: 'PressStart2P-Regular',
    color: C.INK,
    textAlign: 'center',
    letterSpacing: 1,
  },
  avatarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
    paddingBottom: 20,
  },
  avatarOption: {
    width: 90,
    height: 95,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    padding: 6,
    backgroundColor: C.SAGE_LIGHT,
    borderWidth: 2,
    borderColor: C.SAGE_MID,
    position: 'relative',
  },
  avatarOptionSelected: {
    borderColor: C.TEAL,
    backgroundColor: C.CREAM,
  },
  avatarOptionLocked: {
    opacity: 0.45,
  },
  avatarOptionImg: {
    width: 48,
    height: 48,
    resizeMode: 'contain',
  },
  bgOptionImg: {
    width: 68,
    height: 44,
    resizeMode: 'cover',
    borderWidth: 1,
    borderColor: C.SAGE_MID,
  },
  lockOverlay: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: 'rgba(0, 0, 0, 0.70)',
    paddingVertical: 2,
    paddingHorizontal: 4,
    borderRadius: 2,
  },
  lockText: {
    fontSize: 5.5,
    fontFamily: 'PressStart2P-Regular',
    color: '#FFFFFF',
  },
  avatarOptionLabel: {
    fontSize: 5,
    fontFamily: 'PressStart2P-Regular',
    color: C.INK_LIGHT,
    textAlign: 'center',
    marginTop: 4,
    width: '100%',
  },

  // Bouton reset
  resetBtn: {
    height: 48,
    marginTop: 16,
    marginHorizontal: 16,
    backgroundColor: 'transparent',
  },
  resetText: {
    color: C.INK,
    fontSize: 9.5,
    fontFamily: 'PressStart2P-Regular',
    letterSpacing: 1,
  },

  // Bouton logout
  logoutBtn: {
    height: 52,
    marginTop: 12,
    marginHorizontal: 16,
    backgroundColor: 'transparent',
  },
  logoutText: {
    color: C.INK,
    fontSize: 9.5,
    fontFamily: 'PressStart2P-Regular',
    letterSpacing: 1,
  },

  // Dégradé interne pour les gros boutons
  btnGradient: {
    width: '100%',
    height: '100%',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default ProfileScreen;
