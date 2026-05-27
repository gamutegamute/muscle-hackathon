import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';

type AITrainerIconProps = {
  size?: number;
  style?: StyleProp<ViewStyle>;
  iconStyle?: { color?: string };
};

export default function AITrainerIcon({ size = 36, style, iconStyle }: AITrainerIconProps) {
  return (
    <View style={[styles.container, { width: size, height: size, borderRadius: size / 2 }, style]}>
      <Ionicons name="chatbubble-ellipses" size={Math.round(size * 0.56)} color={iconStyle?.color ?? '#5B6C7A'} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
