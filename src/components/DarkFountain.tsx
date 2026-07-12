import React, { useState, useEffect } from 'react';
import { View, Image, StyleSheet } from 'react-native';

const FOUNTAIN_FRAMES = [
  require('../assets/fountain/loop_0.png'),
  require('../assets/fountain/loop_1.png'),
  require('../assets/fountain/loop_2.png'),
  require('../assets/fountain/loop_3.png'),
  require('../assets/fountain/loop_4.png'),
  require('../assets/fountain/loop_5.png'),
  require('../assets/fountain/loop_6.png'),
  require('../assets/fountain/loop_7.png'),
];

export const DarkFountain: React.FC<{ size?: number }> = ({ size = 200 }) => {
  const [frameIndex, setFrameIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setFrameIndex((prev) => (prev + 1) % FOUNTAIN_FRAMES.length);
    }, 100); // 100ms par frame pour une animation fluide et vivante

    return () => clearInterval(interval);
  }, []);

  return (
    <View style={styles.container}>
      <Image
        source={FOUNTAIN_FRAMES[frameIndex]}
        style={[
          styles.sprite,
          {
            width: size,
            height: size * 1.8, // Format vertical de la fontaine
          },
        ]}
        resizeMode="contain"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  sprite: {
    opacity: 0.85,
  },
});

export default DarkFountain;
