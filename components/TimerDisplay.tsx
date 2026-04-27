import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, FontSize, Spacing } from '@/constants/theme';
import { formatTime } from '@/utils/timeHelpers';

interface TimerDisplayProps {
  centiseconds: number;
  hidden?: boolean;
  color?: string;
  label?: string;
  size?: 'normal' | 'large';
}

export default function TimerDisplay({
  centiseconds,
  hidden = false,
  color = Colors.neonCyan,
  label,
  size = 'normal',
}: TimerDisplayProps) {
  const timeStr = formatTime(centiseconds);
  const fontSize = size === 'large' ? FontSize.timerLarge : FontSize.timer;

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={[styles.timerBox, { borderColor: color + '30' }]}>
        <Text
          style={[
            styles.timerText,
            {
              fontSize,
              color: hidden ? Colors.textMuted : color,
              textShadowColor: hidden ? 'transparent' : color + '80',
            },
          ]}
        >
          {hidden ? '--:--.--' : timeStr}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: Spacing.sm,
  },
  label: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 3,
    fontWeight: '600',
  },
  timerBox: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    borderRadius: 16,
    borderWidth: 1,
    backgroundColor: Colors.surface,
  },
  timerText: {
    fontFamily: 'monospace',
    fontWeight: '300',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
    letterSpacing: 4,
  },
});
