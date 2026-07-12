import React from 'react';
import { View, Image, StyleSheet } from 'react-native';

const SPRITESHEET = require('../assets/images/spritesheet_violet.png');

interface ChestIconProps {
  isOpen: boolean;
  size?: number;
}

export const ChestIcon: React.FC<ChestIconProps> = ({ isOpen, size = 24 }) => {
  const spriteWidth = 25;
  const spriteHeight = 25;
  const scale = size / spriteWidth;

  const frameX = isOpen ? 28 : 0; // X du coffre ouvert vs fermé
  const frameY = 50; // Y de la ligne des coffres

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

export default ChestIcon;
