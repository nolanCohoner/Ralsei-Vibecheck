import React from 'react';
import { View, Image, StyleSheet } from 'react-native';

const SPRITESHEET = require('../assets/images/spritesheet_violet.png');

interface DialogBubbleProps {
  type: 'exclamation' | 'dots' | 'question' | 'check';
  size?: number;
}

const BUBBLE_Y: Record<string, number> = {
  exclamation: 135,
  dots: 148,
  question: 161,
  check: 174,
};

export const DialogBubble: React.FC<DialogBubbleProps> = ({ type, size = 18 }) => {
  const spriteWidth = 20;
  const spriteHeight = 13;
  const scale = size / spriteWidth;

  const frameX = 0;
  const frameY = BUBBLE_Y[type] || 135;

  return (
    <View style={[styles.container, { width: size, height: size * 0.65 }]}>
      <View
        style={{
          width: spriteWidth,
          height: spriteHeight,
          overflow: 'hidden',
          transform: [{ scale }],
          position: 'absolute',
          left: (size - spriteWidth) / 2,
          top: (size * 0.65 - spriteHeight) / 2,
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

export default DialogBubble;
