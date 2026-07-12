/**
 * Icônes pixel-art natives pour la tab bar de VibeCheck.
 * Dessinées avec des View React Native (pas de SVG externe).
 */
import React from 'react';
import { View, StyleSheet } from 'react-native';

interface IconProps {
  color: string;
  size?: number;
}

// ♩ Note de musique pixel-art
export const PixelMusicIcon: React.FC<IconProps> = ({ color, size = 20 }) => {
  const u = size / 10;
  return (
    <View style={{ width: size, height: size, justifyContent: 'flex-end' }}>
      {/* Tête de note */}
      <View style={[styles.notehead, { width: u * 3, height: u * 2, backgroundColor: color, bottom: 0, left: 0 }]} />
      {/* Queue verticale */}
      <View style={[styles.stem, { width: u, height: u * 6, backgroundColor: color, bottom: u * 2, left: u * 2 }]} />
      {/* Drapeau */}
      <View style={[styles.flag, { width: u * 3, height: u, backgroundColor: color, top: u, left: u * 3 }]} />
    </View>
  );
};

// ♥ Cœur pixel-art
export const PixelHeartIcon: React.FC<IconProps> = ({ color, size = 20 }) => {
  const u = size / 10;
  return (
    <View style={{ width: size, height: size }}>
      {/* Rangée du haut (deux bosses) */}
      <View style={{ flexDirection: 'row', marginTop: u, marginLeft: u }}>
        <View style={{ width: u * 2, height: u * 2, backgroundColor: color }} />
        <View style={{ width: u, height: u * 2, backgroundColor: 'transparent' }} />
        <View style={{ width: u * 2, height: u * 2, backgroundColor: color }} />
      </View>
      {/* Rangée principale large */}
      <View style={{ flexDirection: 'row' }}>
        <View style={{ width: u * 6, height: u * 2, backgroundColor: color, marginLeft: u * 0.5 }} />
      </View>
      {/* Triangle vers le bas */}
      <View style={{ flexDirection: 'row', marginLeft: u * 1.5 }}>
        <View style={{ width: u * 4, height: u, backgroundColor: color }} />
      </View>
      <View style={{ flexDirection: 'row', marginLeft: u * 2.5 }}>
        <View style={{ width: u * 2, height: u, backgroundColor: color }} />
      </View>
      <View style={{ flexDirection: 'row', marginLeft: u * 3.5 }}>
        <View style={{ width: u, height: u, backgroundColor: color }} />
      </View>
    </View>
  );
};

// 📅 Calendrier pixel-art
export const PixelCalendarIcon: React.FC<IconProps> = ({ color, size = 20 }) => {
  const u = size / 10;
  return (
    <View style={{ width: size, height: size }}>
      {/* Corps principal */}
      <View style={{ width: size, height: size, borderWidth: u, borderColor: color, backgroundColor: 'transparent' }}>
        {/* En-tête */}
        <View style={{ height: u * 2.5, backgroundColor: color, width: '100%' }} />
        {/* Grille de points (3 colonnes x 2 lignes) */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-around', paddingTop: u, paddingHorizontal: u }}>
          {[0, 1, 2].map(i => (
            <View key={i} style={{ width: u * 1.5, height: u * 1.5, backgroundColor: color }} />
          ))}
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-around', paddingTop: u * 0.5, paddingHorizontal: u }}>
          {[0, 1, 2].map(i => (
            <View key={i} style={{ width: u * 1.5, height: u * 1.5, backgroundColor: color }} />
          ))}
        </View>
      </View>
    </View>
  );
};

// 👤 Utilisateur pixel-art
export const PixelUserIcon: React.FC<IconProps> = ({ color, size = 20 }) => {
  const u = size / 10;
  return (
    <View style={{ width: size, height: size, alignItems: 'center' }}>
      {/* Tête (carré pixel) */}
      <View style={{ width: u * 4, height: u * 4, backgroundColor: color, marginTop: u }} />
      {/* Corps (trapèze simplifié) */}
      <View style={{ width: u * 6, height: u * 4, backgroundColor: color, marginTop: u * 0.5 }} />
    </View>
  );
};

// 📖 Livre pixel-art (Favoris)
export const PixelBookIcon: React.FC<IconProps> = ({ color, size = 20 }) => {
  const u = size / 10;
  return (
    <View style={{ width: size, height: size }}>
      {/* Couverture extérieure */}
      <View style={{ position: 'absolute', left: 0, top: 0, width: size, height: size, borderWidth: u * 0.8, borderColor: color }} />
      {/* Reliure centrale */}
      <View style={{ position: 'absolute', left: size / 2 - u * 0.4, top: u, width: u * 0.8, height: size - u * 2, backgroundColor: color }} />
      {/* Lignes page gauche */}
      <View style={{ position: 'absolute', left: u, top: u * 2.5, width: size / 2 - u * 2, height: u * 0.8, backgroundColor: color }} />
      <View style={{ position: 'absolute', left: u, top: u * 4.5, width: size / 2 - u * 2, height: u * 0.8, backgroundColor: color }} />
      <View style={{ position: 'absolute', left: u, top: u * 6.5, width: size / 2 - u * 2, height: u * 0.8, backgroundColor: color }} />
      {/* Lignes page droite */}
      <View style={{ position: 'absolute', right: u, top: u * 2.5, width: size / 2 - u * 2, height: u * 0.8, backgroundColor: color }} />
      <View style={{ position: 'absolute', right: u, top: u * 4.5, width: size / 2 - u * 2, height: u * 0.8, backgroundColor: color }} />
      <View style={{ position: 'absolute', right: u, top: u * 6.5, width: size / 2 - u * 2, height: u * 0.8, backgroundColor: color }} />
    </View>
  );
};

// 💬 Bulle de texte pixel-art (Suivi)
export const PixelChatIcon: React.FC<IconProps> = ({ color, size = 20 }) => {
  const u = size / 10;
  return (
    <View style={{ width: size, height: size }}>
      {/* Corps de la bulle */}
      <View style={{ position: 'absolute', left: 0, top: 0, width: size, height: size * 0.72, borderWidth: u * 0.8, borderColor: color, backgroundColor: 'transparent' }} />
      {/* Coins coupés style pixel */}
      <View style={{ position: 'absolute', left: u * 0.5, top: u * 0.5, width: u * 1.5, height: u * 1.5, backgroundColor: 'transparent' }} />
      {/* 3 points de dialogue */}
      <View style={{ position: 'absolute', left: u * 1.5, top: u * 2.5, width: u * 1.2, height: u * 1.2, backgroundColor: color }} />
      <View style={{ position: 'absolute', left: u * 4, top: u * 2.5, width: u * 1.2, height: u * 1.2, backgroundColor: color }} />
      <View style={{ position: 'absolute', left: u * 6.5, top: u * 2.5, width: u * 1.2, height: u * 1.2, backgroundColor: color }} />
      {/* Queue de la bulle (triangle bas gauche) */}
      <View style={{ position: 'absolute', left: u * 1.5, top: size * 0.72, width: u * 1.5, height: u * 1.5, backgroundColor: color }} />
      <View style={{ position: 'absolute', left: u * 1.5, top: size * 0.72 + u * 1.5, width: u, height: u, backgroundColor: color }} />
    </View>
  );
};

const styles = StyleSheet.create({
  notehead: {
    position: 'absolute',
  },
  stem: {
    position: 'absolute',
  },
  flag: {
    position: 'absolute',
  },
});
