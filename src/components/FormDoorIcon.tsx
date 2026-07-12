import React from 'react';
import { View, Image, StyleSheet } from 'react-native';

const SPRITESHEET = require('../assets/images/spritesheet_violet.png');

interface FormDoorIconProps {
  isOpen?: boolean;
  size?: number;
}

export const FormDoorIcon: React.FC<FormDoorIconProps> = ({ isOpen = false, size = 30 }) => {
  const spriteWidth = 41;
  const spriteHeight = 50;
  const scale = size / spriteWidth;

  const frameX = isOpen ? 41 : 0; // X de la porte ouverte vs fermée
  const frameY = 80; // Y de la ligne des portes

  return (
    <View style={[styles.container, { width: size, height: size * 1.22 }]}>
      <View
        style={{
          width: spriteWidth,
          height: spriteHeight,
          overflow: 'hidden',
          transform: [{ scale }],
          position: 'absolute',
          left: (size - spriteWidth) / 2,
          top: (size * 1.22 - spriteHeight) / 2,
        }}
      >
        <Image
          source={SPRITESHEET}
          style={{
            position: 'absolute',
            left: -frameX,
            top: -frameY,
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

export default FormDoorIcon;
