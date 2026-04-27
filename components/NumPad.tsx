import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Colors, FontSize, Spacing, BorderRadius } from '@/constants/theme';
import * as Haptics from 'expo-haptics';

interface NumPadProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  maxLength?: number;
  disabled?: boolean;
}

export default function NumPad({
  value,
  onChange,
  onSubmit,
  maxLength = 5,
  disabled = false,
}: NumPadProps) {
  const handlePress = (digit: string) => {
    if (disabled) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (value.length < maxLength) {
      onChange(value + digit);
    }
  };

  const handleDelete = () => {
    if (disabled) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onChange(value.slice(0, -1));
  };

  const handleSubmit = () => {
    if (disabled || !value) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    onSubmit();
  };

  // Format displayed value: add decimal point before last 2 digits
  const formatDisplayValue = (val: string): string => {
    if (!val) return '0.00';
    const num = parseInt(val, 10);
    if (isNaN(num)) return '0.00';
    const seconds = Math.floor(num / 100);
    const cs = num % 100;
    return `${seconds}.${String(cs).padStart(2, '0')}`;
  };

  const keys = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['⌫', '0', '✓'],
  ];

  return (
    <View style={styles.container}>
      {/* Display */}
      <View style={styles.displayContainer}>
        <Text style={styles.displayLabel}>YOUR GUESS</Text>
        <Text style={styles.displayValue}>
          {formatDisplayValue(value)}
          <Text style={styles.displayUnit}>s</Text>
        </Text>
        <Text style={styles.displayHint}>
          Type digits • last 2 = centiseconds
        </Text>
      </View>

      {/* Keypad */}
      <View style={styles.keypad}>
        {keys.map((row, rowIdx) => (
          <View key={rowIdx} style={styles.row}>
            {row.map((key) => {
              const isDelete = key === '⌫';
              const isSubmit = key === '✓';
              const isSpecial = isDelete || isSubmit;

              return (
                <TouchableOpacity
                  key={key}
                  style={[
                    styles.key,
                    isSubmit && styles.submitKey,
                    isDelete && styles.deleteKey,
                    disabled && styles.disabledKey,
                  ]}
                  onPress={() => {
                    if (isDelete) handleDelete();
                    else if (isSubmit) handleSubmit();
                    else handlePress(key);
                  }}
                  activeOpacity={0.6}
                  disabled={disabled}
                >
                  <Text
                    style={[
                      styles.keyText,
                      isSubmit && styles.submitKeyText,
                      isDelete && styles.deleteKeyText,
                      isSpecial && { fontSize: FontSize.xl },
                    ]}
                  >
                    {key}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    gap: Spacing.lg,
  },
  displayContainer: {
    alignItems: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.md,
  },
  displayLabel: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    letterSpacing: 3,
    fontWeight: '600',
  },
  displayValue: {
    fontSize: FontSize.timerLarge,
    fontFamily: 'monospace',
    color: Colors.neonMagenta,
    fontWeight: '300',
    letterSpacing: 3,
    textShadowColor: Colors.neonMagentaGlow,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 15,
  },
  displayUnit: {
    fontSize: FontSize.xl,
    color: Colors.textSecondary,
  },
  displayHint: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    letterSpacing: 1,
  },
  keypad: {
    width: '100%',
    maxWidth: 320,
    gap: Spacing.sm,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  key: {
    width: 88,
    height: 64,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  submitKey: {
    backgroundColor: Colors.neonGreenDim,
    borderColor: Colors.neonGreen + '40',
  },
  deleteKey: {
    backgroundColor: Colors.dangerDim,
    borderColor: Colors.danger + '40',
  },
  disabledKey: {
    opacity: 0.4,
  },
  keyText: {
    fontSize: FontSize.xl,
    fontWeight: '600',
    color: Colors.textPrimary,
    fontFamily: 'monospace',
  },
  submitKeyText: {
    color: Colors.neonGreen,
  },
  deleteKeyText: {
    color: Colors.danger,
  },
});
