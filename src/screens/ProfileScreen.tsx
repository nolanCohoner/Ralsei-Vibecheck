import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getCurrentUser, signOut } from '../services/auth';
import { isMockMode, supabase } from '../services/supabase';
import { getMoodHistory, calcStreakDays, getInstallDate } from '../services/db';
import { MOODS } from '../utils/constants';
import { PixelEmoji } from '../components/PixelEmoji';

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

// Avatars pixel-art : 9 humeurs + 1 par défaut
const AVATARS = [
  { id: 'default', emoji: '👤', label: 'Par défaut' },
  { id: 'joyeux', emoji: '☀️', label: 'Joyeux' },
  { id: 'nostalgique', emoji: '🍂', label: 'Nostalgique' },
  { id: 'energique', emoji: '⚡', label: 'Energique' },
  { id: 'melancolique', emoji: '🌧️', label: 'Melancolique' },
  { id: 'concentre', emoji: '📖', label: 'Concentre' },
  { id: 'festif', emoji: '🎉', label: 'Festif' },
  { id: 'amoureux', emoji: '❤️', label: 'Amoureux' },
  { id: 'colerique', emoji: '😡', label: 'Colérique' },
  { id: 'fatigue', emoji: '💤', label: 'Fatigué' },
];

const AVATAR_KEY = 'vibecheck_avatar';

export const ProfileScreen: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [resetModalVisible, setResetModalVisible] = useState(false);
  const [avatarId, setAvatarId] = useState('default');
  const [avatarPickerVisible, setAvatarPickerVisible] = useState(false);
  const [stats, setStats] = useState({ total: 0, dominantMood: '', streak: 0, installDate: '' });
  const user = getCurrentUser();

  useEffect(() => {
    loadAvatar();
    loadStats();
  }, []);

  const loadAvatar = async () => {
    const saved = await AsyncStorage.getItem(AVATAR_KEY);
    if (saved) setAvatarId(saved);
  };

  const saveAvatar = async (id: string) => {
    setAvatarId(id);
    await AsyncStorage.setItem(AVATAR_KEY, id);
    setAvatarPickerVisible(false);
  };

  const loadStats = async () => {
    try {
      const history = await getMoodHistory();
      const total = history.length;

      // Humeur dominante
      const counts: Record<string, number> = {};
      history.forEach(h => { counts[h.mood] = (counts[h.mood] || 0) + 1; });
      const dominantMood = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || '';

      // Streak sur jours calendaires uniques (pas les sessions)
      const streak = calcStreakDays(history);

      // Date d'installation
      const installIso = await getInstallDate();
      const installDate = installIso
        ? new Date(installIso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
        : '';

      setStats({ total, dominantMood, streak, installDate });
    } catch (_err) {}
  };

  const handleLogout = async () => {
    setLoading(true);
    try { await signOut(); } catch (_err) {}
    finally { setLoading(false); }
  };

  const handleResetData = async () => {
    setResetModalVisible(false);
    setResetting(true);
    try {
      const user = getCurrentUser();
      if (!user) return;

      if (isMockMode) {
        // Effacer historique et favoris du AsyncStorage
        await AsyncStorage.removeItem(`vibecheck_history_${user.id}`);
        await AsyncStorage.removeItem(`vibecheck_favorites_${user.id}`);
      } else {
        // Effacer dans Supabase
        await supabase!.from('mood_history').delete().eq('user_id', user.id);
        await supabase!.from('favorites').delete().eq('user_id', user.id);
      }

      // Réinitialiser les stats affichées
      setStats({ total: 0, dominantMood: '', streak: 0 });
      Alert.alert('✅ Réinitialisation', 'Tes données ont été effacées.\nTon compte et ton avatar sont conservés.');
    } catch (_err) {
      Alert.alert('Erreur', 'Impossible de réinitialiser les données.');
    } finally {
      setResetting(false);
    }
  };

  const currentAvatar = AVATARS.find(a => a.id === avatarId) || AVATARS[0];
  const dominantMoodCfg = MOODS.find(m => m.name.toLowerCase() === stats.dominantMood.toLowerCase());
  const emailInitials = user?.email ? user.email.substring(0, 2).toUpperCase() : '??';

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.headerAccent} />
          <Text style={styles.headerTitle}>PROFIL</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Avatar + Email */}
        <View style={styles.profileCard}>
          {/* Avatar cliquable */}
          <TouchableOpacity
            style={styles.avatarContainer}
            onPress={() => setAvatarPickerVisible(true)}
            activeOpacity={0.8}
          >
            <View style={styles.avatarBox}>
              {currentAvatar.id === 'default' ? (
                <Text style={styles.avatarEmoji}>👤</Text>
              ) : (
                <PixelEmoji moodId={currentAvatar.id} color={C.INK} size={36} />
              )}
            </View>
            {/* Coin pixel-art */}
            <View style={styles.avatarEditBadge}>
              <Text style={styles.avatarEditText}>✏</Text>
            </View>
          </TouchableOpacity>

          <View style={styles.profileInfo}>
            <Text style={styles.profileLabel}>COMPTE CONNECTE</Text>
            <Text style={styles.profileEmail} numberOfLines={2}>
              {user?.email || 'Anonyme'}
            </Text>
          </View>
        </View>

        {/* Stats personnelles */}
        <View style={styles.card}>
          <View style={styles.cardTitleRow}>
            <View style={styles.cardTitleDot} />
            <Text style={styles.cardTitle}>MES STATS</Text>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statBigValue}>{stats.total}</Text>
              <Text style={styles.statItemLabel}>SESSIONS</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <View style={styles.statEmojiWrapper}>
                {dominantMoodCfg ? (
                  <PixelEmoji moodId={dominantMoodCfg.id} color={dominantMoodCfg.color} size={28} />
                ) : (
                  <Text style={styles.statBigEmoji}>{stats.total > 0 ? '🎵' : '—'}</Text>
                )}
              </View>
              <Text style={styles.statItemLabel}>
                {stats.dominantMood ? stats.dominantMood.toUpperCase() : 'AUCUNE'}
              </Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statBigValue}>{stats.streak}</Text>
              <Text style={styles.statItemLabel}>JOURS 🔥</Text>
            </View>
          </View>
          {stats.installDate ? (
            <View style={styles.installRow}>
              <Text style={styles.installLabel}>DEPUIS LE</Text>
              <Text style={styles.installValue}>{stats.installDate}</Text>
            </View>
          ) : null}
        </View>

        {/* Infos compte */}
        <View style={styles.card}>
          <View style={styles.cardTitleRow}>
            <View style={styles.cardTitleDot} />
            <Text style={styles.cardTitle}>INFORMATIONS</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>APPLICATION</Text>
            <Text style={styles.infoValue}>VIBECHECK v1.0</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>PROJET</Text>
            <Text style={styles.infoValue}>M1 SUP DE VINCI</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>BASE</Text>
            <View style={styles.infoStatus}>
              <View style={[styles.statusDot, { backgroundColor: isMockMode ? '#F6C56B' : C.TEAL }]} />
              <Text style={styles.infoValue}>
                {isMockMode ? 'LOCAL' : 'SUPABASE'}
              </Text>
            </View>
          </View>
        </View>

        {/* Bouton réinitialiser les données */}
        <TouchableOpacity
          onPress={() => setResetModalVisible(true)}
          style={styles.resetBtn}
          disabled={resetting}
          activeOpacity={0.85}
        >
          {resetting ? (
            <ActivityIndicator color={C.INK_LIGHT} size="small" />
          ) : (
            <Text style={styles.resetText}>♻ REINITIALISER MES STATS</Text>
          )}
        </TouchableOpacity>

        {/* Bouton déconnexion — outline au repos, rouge au press */}
        <TouchableOpacity
          onPress={handleLogout}
          style={styles.logoutBtn}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color={C.ERROR} size="small" />
          ) : (
            <Text style={styles.logoutText}>SE DECONNECTER</Text>
          )}
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
                <View style={styles.avatarGrid}>
                  {AVATARS.map(avatar => (
                    <TouchableOpacity
                      key={avatar.id}
                      style={[
                        styles.avatarOption,
                        avatarId === avatar.id && styles.avatarOptionSelected,
                      ]}
                      onPress={() => saveAvatar(avatar.id)}
                    >
                      {avatar.id === 'default' ? (
                        <Text style={styles.avatarOptionEmoji}>👤</Text>
                      ) : (
                        <View style={styles.avatarOptionEmojiWrapper}>
                          <PixelEmoji moodId={avatar.id} color={C.INK} size={28} />
                        </View>
                      )}
                      <Text style={styles.avatarOptionLabel}>{avatar.label.toUpperCase()}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.CREAM },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 2,
    borderColor: C.SAGE_MID,
    backgroundColor: C.SAGE_LIGHT,
    paddingTop: Platform.OS === 'android' ? (StatusBar as any).currentHeight || 24 : 16,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerAccent: { width: 4, height: 18, backgroundColor: C.TEAL },
  headerTitle: {
    fontSize: 11,
    fontFamily: 'PressStart2P-Regular',
    color: C.INK,
    letterSpacing: 1,
  },
  scrollContent: { padding: 16 },

  // Profil
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.SAGE_LIGHT,
    borderWidth: 2,
    borderColor: C.SAGE_MID,
    padding: 16,
    marginBottom: 12,
    gap: 16,
  },
  avatarContainer: { position: 'relative' },
  avatarBox: {
    width: 60,
    height: 60,
    backgroundColor: C.SAGE_MID,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: C.TEAL,
  },
  avatarEmoji: { fontSize: 28 },
  avatarEditBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 18,
    height: 18,
    backgroundColor: C.TEAL,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: C.INK,
  },
  avatarEditText: { fontSize: 9, color: C.INK },
  profileInfo: { flex: 1 },
  profileLabel: {
    fontSize: 6,
    fontFamily: 'PressStart2P-Regular',
    color: C.INK_LIGHT,
    marginBottom: 6,
    letterSpacing: 1,
  },
  profileEmail: {
    fontSize: 7.5,
    fontFamily: 'PressStart2P-Regular',
    color: C.INK,
    lineHeight: 14,
  },

  // Stats
  card: {
    backgroundColor: C.SAGE_LIGHT,
    borderWidth: 2,
    borderColor: C.SAGE_MID,
    padding: 16,
    marginBottom: 12,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    gap: 8,
  },
  cardTitleDot: { width: 6, height: 6, backgroundColor: C.TEAL },
  cardTitle: {
    fontSize: 8,
    fontFamily: 'PressStart2P-Regular',
    color: C.INK,
    letterSpacing: 1,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  statDivider: {
    width: 2,
    height: 40,
    backgroundColor: C.SAGE_MID,
  },
  statBigValue: {
    fontSize: 18,
    fontFamily: 'PressStart2P-Regular',
    color: C.INK,
  },
  statBigEmoji: { fontSize: 24, lineHeight: 30 },
  statEmojiWrapper: {
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2,
  },
  statItemLabel: {
    fontSize: 5.5,
    fontFamily: 'PressStart2P-Regular',
    color: C.INK_LIGHT,
    textAlign: 'center',
  },
  installRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: C.SAGE_MID,
  },
  installLabel: {
    fontSize: 5.5,
    fontFamily: 'PressStart2P-Regular',
    color: C.INK_LIGHT,
    letterSpacing: 0.5,
  },
  installValue: {
    fontSize: 6,
    fontFamily: 'PressStart2P-Regular',
    color: C.TEAL,
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

  // Bouton reset
  resetBtn: {
    height: 48,
    borderWidth: 2,
    borderColor: C.SAGE_DARK,
    backgroundColor: C.SAGE_LIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 8,
  },
  resetText: {
    color: C.INK_LIGHT,
    fontSize: 7,
    fontFamily: 'PressStart2P-Regular',
    letterSpacing: 1,
  },

  // Bouton logout — outline au repos
  logoutBtn: {
    height: 52,
    borderWidth: 2,
    borderColor: C.ERROR,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 0,
  },
  logoutText: {
    color: C.ERROR,
    fontSize: 8,
    fontFamily: 'PressStart2P-Regular',
    letterSpacing: 1,
  },

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
  },
  avatarOption: {
    width: 80,
    alignItems: 'center',
    gap: 4,
    padding: 10,
    backgroundColor: C.SAGE_LIGHT,
    borderWidth: 2,
    borderColor: C.SAGE_MID,
  },
  avatarOptionSelected: {
    borderColor: C.TEAL,
    backgroundColor: C.CREAM,
  },
  avatarOptionEmoji: { fontSize: 28 },
  avatarOptionEmojiWrapper: {
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarOptionLabel: {
    fontSize: 5.5,
    fontFamily: 'PressStart2P-Regular',
    color: C.INK_LIGHT,
    textAlign: 'center',
  },
});

export default ProfileScreen;
