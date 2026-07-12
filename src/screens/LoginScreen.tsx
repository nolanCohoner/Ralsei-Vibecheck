import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { signUp, signIn } from '../services/auth';
import { SoulIcon } from '../components/SoulIcon';
import { DarkFountain } from '../components/DarkFountain';
import { PixelIcon } from '../components/PixelIcon';

const LogoImg = require('../../ConnexionLogin/logo.png');
const RalseiImg = require('../assets/ralsei/Joyeux.png');

// Palette VibeCheck
const C = {
  CREAM: '#F1F1D3',
  SAGE_LIGHT: '#E3EBD0',
  SAGE_MID: '#C7DDC5',
  SAGE_DARK: '#9FCDA8',
  TEAL: '#7DC2A5',
  INK: '#2D3B2D',
  INK_LIGHT: '#A0B0A0',
  ERROR: '#F38071',
  WHITE: '#FFFFFF',
};

const GRADIENT_COLORS = ['#7DC2A5', '#9FCDA8', '#C7DDC5', '#E3EBD0', '#F1F1D3'] as const;
const GRADIENT_LOCATIONS = [0, 0.25, 0.5, 0.75, 1] as const;

export const LoginScreen: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [focusedField, setFocusedField] = useState<'email' | 'password' | null>(null);

  const handleSubmit = async () => {
    if (!email || !password) {
      setErrorMsg('Remplis tous les champs.');
      return;
    }
    setLoading(true);
    setErrorMsg(null);
    try {
      const { error } = isRegistering
        ? await signUp(email, password)
        : await signIn(email, password);
      if (error) setErrorMsg(error.message);
    } catch (_err) {
      setErrorMsg('Une erreur est survenue.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleMode = () => {
    setIsRegistering(!isRegistering);
    setErrorMsg(null);
  };

  return (
    <SafeAreaView style={styles.safeContainer}>
      <StatusBar barStyle="light-content" backgroundColor="#0F120F" />
      
      {/* === FOND ANIMÉ DARK FOUNTAIN === */}
      <View style={styles.fountainBackground} pointerEvents="none">
        <DarkFountain size={220} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* === LOGO IMAGE === */}
          <View style={styles.logoSection}>
            <Image source={LogoImg} style={styles.logoImage} resizeMode="contain" />
            <Text style={styles.tagline}>Ton humeur, ta musique.</Text>
          </View>

          {/* === AVATAR RALSEI D'ACCUEIL === */}
          <View style={styles.ralseiHeaderContainer}>
            <Image source={RalseiImg} style={styles.ralseiHeaderImage} resizeMode="contain" />
          </View>

          {/* === FORMULAIRE DOUBLE BORDURE === */}
          <View style={styles.formCard}>
            <View style={styles.formCardInner}>
              {/* Titre */}
              <View style={styles.formTitleRow}>
                <View style={styles.formTitleDot} />
                <Text style={styles.formTitle}>
                  {isRegistering ? 'CRÉER UN COMPTE' : 'CONNEXION'}
                </Text>
              </View>

              {/* Erreur */}
              {errorMsg && (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>! {errorMsg}</Text>
                </View>
              )}

              {/* Email */}
              <View style={styles.fieldGroup}>
                <View style={styles.labelRow}>
                  {focusedField === 'email' && (
                    <View style={styles.soulIndicator}>
                      <SoulIcon size={10} color="#5BC8A0" />
                    </View>
                  )}
                  <Text style={styles.fieldLabel}>EMAIL</Text>
                </View>
                <View style={[
                  styles.inputWrapper,
                  focusedField === 'email' && styles.inputWrapperFocused
                ]}>
                  <View style={styles.inputIconWrapper}>
                    <PixelIcon type="mail" color="#A0B0A0" size={16} />
                  </View>
                  <TextInput
                    style={styles.input}
                    placeholder="adresse@email.com"
                    placeholderTextColor="#7A8A7A"
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    autoComplete="email"
                    onFocus={() => setFocusedField('email')}
                    onBlur={() => setFocusedField(null)}
                  />
                </View>
              </View>

              {/* Mot de passe */}
              <View style={styles.fieldGroup}>
                <View style={styles.labelRow}>
                  {focusedField === 'password' && (
                    <View style={styles.soulIndicator}>
                      <SoulIcon size={10} color="#5BC8A0" />
                    </View>
                  )}
                  <Text style={styles.fieldLabel}>MOT DE PASSE</Text>
                </View>
                <View style={[
                  styles.inputWrapper,
                  focusedField === 'password' && styles.inputWrapperFocused
                ]}>
                  <View style={styles.inputIconWrapper}>
                    <PixelIcon type="lock" color="#A0B0A0" size={16} />
                  </View>
                  <TextInput
                    style={styles.input}
                    placeholder="••••••••"
                    placeholderTextColor="#7A8A7A"
                    secureTextEntry={!showPassword}
                    value={password}
                    onChangeText={setPassword}
                    autoCapitalize="none"
                    autoComplete="password"
                    onFocus={() => setFocusedField('password')}
                    onBlur={() => setFocusedField(null)}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.eyeBtn}
                    hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                  >
                    <PixelIcon type="eye" color={showPassword ? C.TEAL : '#A0B0A0'} size={16} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Bouton principal avec dégradé style Deltarune */}
              <TouchableOpacity
                onPress={handleSubmit}
                style={styles.submitBtn}
                disabled={loading}
                activeOpacity={0.9}
              >
                <LinearGradient
                  colors={GRADIENT_COLORS}
                  locations={GRADIENT_LOCATIONS}
                  style={styles.btnGradient}
                >
                  {loading ? (
                    <ActivityIndicator color={C.INK} size="small" />
                  ) : (
                    <Text style={styles.submitText}>
                      {isRegistering ? 'CREER MON COMPTE' : 'SE CONNECTER'}
                    </Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              {/* Séparateur */}
              <View style={styles.separator}>
                <View style={styles.separatorLine} />
                <Text style={styles.separatorText}>ou</Text>
                <View style={styles.separatorLine} />
              </View>

              {/* Bouton secondaire — style lien TEAL souligné */}
              <TouchableOpacity
                onPress={handleToggleMode}
                style={styles.secondaryBtn}
                activeOpacity={0.7}
              >
                <Text style={styles.secondaryText}>
                  {isRegistering
                    ? "Déjà un compte ?"
                    : "Pas encore inscrit ?"}
                </Text>
                <Text style={styles.secondaryLink}>
                  {isRegistering ? ' Se connecter' : " S'inscrire"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: '#0F120F',
    position: 'relative',
  },
  fountainBackground: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.18,
    zIndex: 0,
  },
  container: { flex: 1, zIndex: 1 },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 36,
    gap: 20,
  },

  // Logo
  logoSection: {
    alignItems: 'center',
    gap: 8,
    marginBottom: 0,
  },
  logoImage: {
    width: 220,
    height: 90,
  },
  tagline: {
    fontSize: 7,
    fontFamily: 'PressStart2P-Regular',
    color: '#E3EBD0',
    letterSpacing: 1,
    marginTop: 8,
  },

  // Ralsei Header
  ralseiHeaderContainer: {
    alignItems: 'center',
    marginBottom: -16,
    zIndex: 3,
  },
  ralseiHeaderImage: {
    width: 64,
    height: 64,
  },

  // Carte formulaire double bordure
  formCard: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    padding: 4,
    gap: 0,
  },
  formCardInner: {
    backgroundColor: 'rgba(15, 18, 15, 0.90)',
    borderWidth: 1.5,
    borderColor: C.TEAL,
    padding: 20,
  },
  formTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 8,
  },
  formTitleDot: {
    width: 6,
    height: 6,
    backgroundColor: C.TEAL,
  },
  formTitle: {
    fontSize: 9,
    fontFamily: 'PressStart2P-Regular',
    color: '#FFFFFF',
    letterSpacing: 1,
  },

  // Erreur
  errorBox: {
    backgroundColor: 'rgba(192, 57, 43, 0.20)',
    borderWidth: 2,
    borderColor: C.ERROR,
    padding: 10,
    marginBottom: 16,
  },
  errorText: {
    color: C.ERROR,
    fontSize: 7,
    fontFamily: 'PressStart2P-Regular',
    lineHeight: 12,
  },

  // Champs
  fieldGroup: { marginBottom: 16 },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  soulIndicator: {
    marginRight: 6,
  },
  fieldLabel: {
    fontSize: 7,
    fontFamily: 'PressStart2P-Regular',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    height: 52,
    paddingHorizontal: 12,
  },
  // Border TEAL quand focus
  inputWrapperFocused: {
    borderColor: C.TEAL,
    borderWidth: 2,
  },
  inputIconWrapper: {
    marginRight: 10,
    width: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 9,
    fontFamily: 'PressStart2P-Regular',
    height: '100%',
    padding: 0,
  },
  eyeBtn: {
    padding: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Bouton principal
  submitBtn: {
    height: 52,
    marginTop: 18,
    backgroundColor: 'transparent',
  },
  btnGradient: {
    width: '100%',
    height: '100%',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitText: {
    color: C.INK,
    fontSize: 9,
    fontFamily: 'PressStart2P-Regular',
    letterSpacing: 1,
  },

  // Séparateur
  separator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 18,
    gap: 10,
  },
  separatorLine: {
    flex: 1,
    height: 2,
    backgroundColor: '#3D4D3D',
  },
  separatorText: {
    fontSize: 7,
    fontFamily: 'PressStart2P-Regular',
    color: '#7A8A7A',
  },

  // Bouton secondaire — lien TEAL
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    paddingVertical: 8,
  },
  secondaryText: {
    color: '#A0B0A0',
    fontSize: 7,
    fontFamily: 'PressStart2P-Regular',
    lineHeight: 14,
  },
  secondaryLink: {
    color: C.TEAL,
    fontSize: 7,
    fontFamily: 'PressStart2P-Regular',
    lineHeight: 14,
    textDecorationLine: 'underline',
  },
});

export default LoginScreen;
