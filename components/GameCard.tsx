import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors, FontSize, Spacing, BorderRadius } from '@/constants/theme';
import * as Haptics from 'expo-haptics';

interface GameCardProps {
  title: string;
  description: string;
  icon: string;
  color: string;
  onPress: () => void;
}

export default function GameCard({
  title,
  description,
  icon,
  color,
  onPress,
}: GameCardProps) {
  return (
    <TouchableOpacity
      style={[
        styles.card,
        {
          borderColor: color + '25',
          shadowColor: color,
        },
      ]}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        onPress();
      }}
      activeOpacity={0.75}
    >
      <View style={[styles.iconContainer, { backgroundColor: color + '15' }]}>
        <Text style={styles.icon}>{icon}</Text>
      </View>
      <View style={styles.textContainer}>
        <Text style={[styles.title, { color }]}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
      </View>
      <Text style={[styles.arrow, { color: color + '60' }]}>›</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    padding: Spacing.lg,
    gap: Spacing.md,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 28,
  },
  textContainer: {
    flex: 1,
    gap: Spacing.xs,
  },
  title: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  description: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  arrow: {
    fontSize: 32,
    fontWeight: '300',
  },
});
