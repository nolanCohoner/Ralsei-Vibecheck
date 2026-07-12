import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SavePoint } from './SavePoint';

interface DeltaruneBoxProps {
  children: React.ReactNode;
  style?: any;
}

export const DeltaruneBox: React.FC<DeltaruneBoxProps> = ({ children, style }) => {
  return (
    <View style={[styles.outerContainer, style]}>
      {/* Bordure blanche externe */}
      <View style={styles.whiteBorder}>
        {/* Bordure violette interne */}
        <View style={styles.violetBorder}>
          {/* Contenu interne */}
          <View style={styles.content}>
            {children}
          </View>
        </View>
      </View>

      {/* Points de sauvegarde scintillants aux 4 coins (Deltarune Dialog Box style) */}
      <View style={[styles.corner, styles.topLeft]}>
        <SavePoint size={14} />
      </View>
      <View style={[styles.corner, styles.topRight]}>
        <SavePoint size={14} />
      </View>
      <View style={[styles.corner, styles.bottomLeft]}>
        <SavePoint size={14} />
      </View>
      <View style={[styles.corner, styles.bottomRight]}>
        <SavePoint size={14} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    position: 'relative',
    backgroundColor: '#000000',
    padding: 6, // Espace pour décaler les bordures imbriquées
  },
  whiteBorder: {
    borderColor: '#ffffff',
    borderWidth: 2,
    padding: 2, // Décale la ligne blanche et la ligne violette
  },
  violetBorder: {
    borderColor: '#5e35b1', // Violet profond de la boîte de dialogue de Deltarune
    borderWidth: 2,
    backgroundColor: '#000000',
  },
  content: {
    padding: 18,
    backgroundColor: '#000000',
  },
  // Alignement des coins
  corner: {
    position: 'absolute',
    zIndex: 10,
    backgroundColor: '#000000', // Masque la bordure en dessous
    padding: 2,
  },
  topLeft: {
    top: -2,
    left: -2,
  },
  topRight: {
    top: -2,
    right: -2,
  },
  bottomLeft: {
    bottom: -2,
    left: -2,
  },
  bottomRight: {
    bottom: -2,
    right: -2,
  },
});

export default DeltaruneBox;
