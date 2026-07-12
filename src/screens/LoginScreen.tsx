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
} from 'react-native';
import { signUp, signIn } from '../services/auth';

// Palette VibeCheck
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
      <StatusBar barStyle="dark-content" backgroundColor={C.CREAM} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* === LOGO === */}
          <View style={styles.logoSection}>
            {/* Motif de 3 pixels décoratifs */}
            <View style={styles.pixelDots}>
              <View style={[styles.pixelDot, { backgroundColor: C.SAGE_MID }]} />
              <View style={[styles.pixelDot, { backgroundColor: C.SAGE_DARK }]} />
              <View style={[styles.pixelDot, { backgroundColor: C.TEAL }]} />
            </View>

            <View style={styles.logoBox}>
              {/* "VIBE" en TEAL, "CHECK" en INK */}
              <Text style={[styles.logoText, { color: C.TEAL }]}>VIBE</Text>
              <View style={styles.logoDot} />
              <Text style={[styles.logoText, { color: C.INK }]}>CHECK</Text>
            </View>

            <Text style={styles.tagline}>Ton humeur, ta musique.</Text>
          </View>

          {/* === FORMULAIRE === */}
          <View style={styles.formCard}>
            {/* Titre */}
            <View style={styles.formTitleRow}>
              <View style={styles.formTitleDot} />
              <Text style={styles.formTitle}>
                {isRegistering ? 'CREER UN COMPTE' : 'CONNEXION'}
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
              <Text style={styles.fieldLabel}>EMAIL</Text>
              <View style={[
                styles.inputWrapper,
                focusedField === 'email' && styles.inputWrapperFocused
              ]}>
                <Text style={styles.inputIcon}>@</Text>
                <TextInput
                  style={styles.input}
                  placeholder="adresse@email.com"
                  placeholderTextColor={C.INK_LIGHT}
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
              <Text style={styles.fieldLabel}>MOT DE PASSE</Text>
              <View style={[
                styles.inputWrapper,
                focusedField === 'password' && styles.inputWrapperFocused
              ]}>
                <Text style={styles.inputIcon}>▪</Text>
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
                  placeholderTextColor={C.INK_LIGHT}
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
                  <Text style={[styles.eyeText, showPassword && styles.eyeTextActive]}>
                    {showPassword ? '●' : '○'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Bouton principal avec ombre pixel-art */}
            <View style={styles.submitBtnWrapper}>
              {/* Ombre décalée pixel-art */}
              <View style={styles.submitBtnShadow} />
              <TouchableOpacity
                onPress={handleSubmit}
                style={styles.submitBtn}
                disabled={loading}
                activeOpacity={0.9}
              >
                {loading ? (
                  <ActivityIndicator color={C.INK} size="small" />
                ) : (
                  <Text style={styles.submitText}>
                    {isRegistering ? 'CREER MON COMPTE' : 'SE CONNECTER'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>

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
                  ? "Deja un compte ?"
                  : "Pas encore inscrit ?"}
              </Text>
              <Text style={styles.secondaryLink}>
                {isRegistering ? ' Se connecter' : " S'inscrire"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* 3 pixels bas */}
          <View style={styles.pixelDots}>
            <View style={[styles.pixelDot, { backgroundColor: C.TEAL }]} />
            <View style={[styles.pixelDot, { backgroundColor: C.SAGE_DARK }]} />
            <View style={[styles.pixelDot, { backgroundColor: C.SAGE_MID }]} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: C.CREAM,
  },
  container: { flex: 1 },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 36,
    gap: 24,
  },

  // Logo
  logoSection: {
    alignItems: 'center',
    gap: 12,
  },
  pixelDots: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  pixelDot: {
    width: 10,
    height: 10,
  },
  logoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoText: {
    fontSize: 22,
    fontFamily: 'PressStart2P-Regular',
    letterSpacing: 2,
  },
  logoDot: {
    width: 8,
    height: 8,
    backgroundColor: C.SAGE_DARK,
  },
  tagline: {
    fontSize: 7,
    fontFamily: 'PressStart2P-Regular',
    color: C.INK,
    letterSpacing: 1,
  },

  // Carte formulaire
  formCard: {
    backgroundColor: C.SAGE_LIGHT,
    borderWidth: 2,
    borderColor: C.SAGE_MID,
    padding: 20,
    gap: 0,
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
    color: C.INK,
    letterSpacing: 1,
  },

  // Erreur
  errorBox: {
    backgroundColor: '#FCE4E4',
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
  fieldLabel: {
    fontSize: 7,
    fontFamily: 'PressStart2P-Regular',
    color: C.INK_LIGHT,
    marginBottom: 6,
    letterSpacing: 1,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.CREAM,
    borderWidth: 2,
    borderColor: C.SAGE_MID,
    height: 52,
    paddingHorizontal: 12,
  },
  // Border TEAL quand focus
  inputWrapperFocused: {
    borderColor: C.TEAL,
    borderWidth: 2,
  },
  inputIcon: {
    fontSize: 12,
    color: C.INK_LIGHT,
    marginRight: 10,
    fontFamily: 'PressStart2P-Regular',
    width: 16,
    textAlign: 'center',
  },
  input: {
    flex: 1,
    color: C.INK,
    fontSize: 9,
    fontFamily: 'PressStart2P-Regular',
    height: '100%',
    padding: 0,
  },
  eyeBtn: { padding: 4 },
  eyeText: {
    fontSize: 14,
    color: C.INK_LIGHT,
  },
  eyeTextActive: {
    color: C.TEAL,
  },

  // Bouton principal avec ombre pixel
  submitBtnWrapper: {
    position: 'relative',
    marginTop: 8,
    marginBottom: 0,
  },
  submitBtnShadow: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    left: 4,
    top: 4,
    backgroundColor: C.SAGE_DARK,
  },
  submitBtn: {
    height: 52,
    backgroundColor: C.TEAL,
    borderWidth: 2,
    borderColor: C.INK,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
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
    backgroundColor: C.SAGE_MID,
  },
  separatorText: {
    fontSize: 7,
    fontFamily: 'PressStart2P-Regular',
    color: C.INK_LIGHT,
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
    color: C.INK_LIGHT,
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
