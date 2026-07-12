import React from 'react';
import Svg, { Rect } from 'react-native-svg';

interface SoulIconProps {
  color?: string;
  size?: number;
}

export const SoulIcon: React.FC<SoulIconProps> = ({ color = '#ff0000', size = 16 }) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 9 9">
      {/* Ligne 1 */}
      <Rect x="1" y="1" width="2" height="1" fill={color} />
      <Rect x="4" y="1" width="1" height="1" fill={color} />
      <Rect x="6" y="1" width="2" height="1" fill={color} />
      {/* Ligne 2, 3, 4 */}
      <Rect x="0" y="2" width="9" height="1" fill={color} />
      <Rect x="0" y="3" width="9" height="1" fill={color} />
      <Rect x="0" y="4" width="9" height="1" fill={color} />
      {/* Ligne 5 */}
      <Rect x="1" y="5" width="7" height="1" fill={color} />
      {/* Ligne 6 */}
      <Rect x="2" y="6" width="5" height="1" fill={color} />
      {/* Ligne 7 */}
      <Rect x="3" y="7" width="3" height="1" fill={color} />
      {/* Ligne 8 */}
      <Rect x="4" y="8" width="1" height="1" fill={color} />
    </Svg>
  );
};

export default SoulIcon;
