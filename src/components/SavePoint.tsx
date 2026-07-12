import React, { useState, useEffect } from 'react';
import { View, Image, StyleSheet } from 'react-native';

const SPRITESHEET = require('../assets/images/spritesheet_violet.png');

interface SavePointProps {
  size?: number;
}

export const SavePoint: React.FC<SavePointProps> = ({ size = 24 }) => {
  const [frameIndex, setFrameIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setFrameIndex((prev) => (prev + 1) % 6);
    }, 150); // 150ms par frame pour l'animation scintillante

    return () => clearInterval(interval);
  }, []);

  // Dimensions réelles de l'image source : 167 x 184
  // Chaque frame d'étoile fait environ 25x25 pixels
  // Largeur de coupe : 25, Hauteur de coupe : 25
  const spriteWidth = 25;
  const spriteHeight = 25;
  const scale = size / spriteWidth;

  const frameX = frameIndex * 27.8; // Espace horizontal moyen par frame

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <View
        style={{
          width: spriteWidth,
          height: spriteHeight,
          overflow: 'hidden',
          transform: [{ scale }],
          position: 'absolute',
          left: (size - spriteWidth) / 2,
          top: (size - spriteHeight) / 2,
        }}
      >
        <Image
          source={SPRITESHEET}
          style={{
            position: 'absolute',
            left: -frameX,
            top: 0,
            width: 167,
            height: 184,
            resizeMode: 'stretch',
          }}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default SavePoint;
