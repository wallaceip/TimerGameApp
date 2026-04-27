import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  View,
  ActivityIndicator,
} from 'react-native';
import { Colors, FontSize, Spacing, BorderRadius } from '@/constants/theme';
import * as Haptics from 'expo-haptics';

interface GlowButtonProps {
  title: string;
  onPress: () => void;
  color?: string;
  glowColor?: string;
  disabled?: boolean;
  loading?: boolean;
  size?: 'normal' | 'large' | 'small';
  variant?: 'filled' | 'outline';
  icon?: string;
}

export default function GlowButton({
  title,
  onPress,
  color = Colors.neonCyan,
  glowColor,
  disabled = false,
  loading = false,
  size = 'normal',
  variant = 'filled',
  icon,
}: GlowButtonProps) {
  const glow = glowColor || color + '40';
  const isFilled = variant === 'filled';

  const handlePress = () => {
    if (disabled || loading) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress();
  };

  const sizeStyles = {
    small: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, fontSize: FontSize.sm },
    normal: { paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md, fontSize: FontSize.md },
    large: { paddingHorizontal: Spacing.xxl, paddingVertical: Spacing.lg, fontSize: FontSize.lg },
  };

  const currentSize = sizeStyles[size];

  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={disabled || loading}
      activeOpacity={0.7}
      style={[
        styles.button,
        {
          paddingHorizontal: currentSize.paddingHorizontal,
          paddingVertical: currentSize.paddingVertical,
          backgroundColor: isFilled ? color + '20' : 'transparent',
          borderColor: disabled ? Colors.textMuted : color,
          shadowColor: disabled ? 'transparent' : glow,
          opacity: disabled ? 0.5 : 1,
        },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={color} />
      ) : (
        <View style={styles.content}>
          {icon && <Text style={[styles.icon, { fontSize: currentSize.fontSize }]}>{icon}</Text>}
          <Text
            style={[
              styles.text,
              {
                fontSize: currentSize.fontSize,
                color: disabled ? Colors.textMuted : color,
              },
            ]}
          >
            {title}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 15,
    elevation: 8,
    minWidth: 120,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  icon: {
    marginRight: 2,
  },
  text: {
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
});
