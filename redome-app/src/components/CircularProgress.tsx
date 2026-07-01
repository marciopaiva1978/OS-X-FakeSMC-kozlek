import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { COLORS } from '../constants/colors';

interface Props {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
}

export const CircularProgress: React.FC<Props> = ({
  percentage,
  size = 140,
  strokeWidth = 12,
  color = COLORS.accent,
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (Math.min(percentage, 100) / 100) * circumference;
  const center = size / 2;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg
        width={size}
        height={size}
        style={[StyleSheet.absoluteFillObject, { transform: [{ rotate: '-90deg' }] }]}
      >
        <Circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={COLORS.border}
          strokeWidth={strokeWidth}
        />
        <Circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
        />
      </Svg>
      <Text style={styles.percentage}>{percentage}%</Text>
      <Text style={styles.label}>concluído</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  percentage: {
    fontSize: 26,
    fontWeight: '700',
    color: COLORS.text,
    lineHeight: 30,
  },
  label: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
});
