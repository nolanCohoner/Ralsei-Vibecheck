import React from 'react';
import { View, Image } from 'react-native';

const BOX_IMG = require('../assets/images/Box.png');

interface DeltaruneRotatedBoxProps {
  children: React.ReactNode;
  width: number;
  height: number;
}

export const DeltaruneRotatedBox: React.FC<DeltaruneRotatedBoxProps> = ({ children, width, height }) => {
  // width et height sont les dimensions cibles verticales à l'écran (ex. width=320, height=480)
  // L'image d'arrière-plan Box.png a un format paysage.
  // Pour qu'elle s'affiche verticalement à ces dimensions après une rotation de 90 degrés,
  // nous dessinons l'image avec une largeur égale à "height" et une hauteur égale à "width".
  return (
    <View style={{ width, height, justifyContent: 'center', alignItems: 'center' }}>
      {/* L'image d'arrière-plan tournée de 90 degrés */}
      <Image
        source={BOX_IMG}
        style={{
          position: 'absolute',
          width: height,
          height: width,
          transform: [{ rotate: '90deg' }],
          resizeMode: 'stretch',
        }}
      />
      {/* Le contenu par-dessus, positionné normalement sans rotation */}
      <View style={{ width: width - 40, height: height - 40, padding: 8 }}>
        {children}
      </View>
    </View>
  );
};

export default DeltaruneRotatedBox;
