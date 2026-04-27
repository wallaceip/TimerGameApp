import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, FontSize, Spacing, BorderRadius } from '@/constants/theme';
import { formatTime, formatTimeShort, getScoreRating } from '@/utils/timeHelpers';
import GlowButton from './GlowButton';

interface ScoreResultProps {
  targetCs: number;
  actualCs: number;
  onPlayAgain: () => void;
  onGoBack: () => void;
  mode: 'stopwatch' | 'beep';
}

export default function ScoreResult({
  targetCs,
  actualCs,
  onPlayAgain,
  onGoBack,
  mode,
}: ScoreResultProps) {
  const diffCs = Math.abs(targetCs - actualCs);
  const { label, emoji, color } = getScoreRating(diffCs);
  const isOver = actualCs > targetCs;

  return (
    <View style={styles.container}>
      {/* Score Rating */}
      <View style={styles.ratingContainer}>
        <Text style={styles.emoji}>{emoji}</Text>
        <Text style={[styles.rating, { color }]}>{label}</Text>
      </View>

      {/* Time Comparison */}
      <View style={styles.comparisonContainer}>
        <View style={styles.timeRow}>
          <Text style={styles.timeLabel}>TARGET</Text>
          <Text style={[styles.timeValue, { color: Colors.neonCyan }]}>
            {mode === 'beep' ? formatTimeShort(targetCs) : formatTime(targetCs)}
          </Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.timeRow}>
          <Text style={styles.timeLabel}>YOUR TIME</Text>
          <Text style={[styles.timeValue, { color: Colors.neonMagenta }]}>
            {mode === 'beep' ? formatTimeShort(actualCs) : formatTime(actualCs)}
          </Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.timeRow}>
          <Text style={styles.timeLabel}>DIFFERENCE</Text>
          <Text style={[styles.timeDiff, { color }]}>
            {isOver ? '+' : '-'}{formatTimeShort(diffCs)}
          </Text>
        </View>
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <GlowButton
          title="Play Again"
          onPress={onPlayAgain}
          color={Colors.neonCyan}
          size="large"
          icon="🔄"
        />
        <GlowButton
          title="Back"
          onPress={onGoBack}
          color={Colors.textSecondary}
          variant="outline"
          size="normal"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xl,
    paddingHorizontal: Spacing.lg,
  },
  ratingContainer: {
    alignItems: 'center',
    gap: Spacing.sm,
  },
  emoji: {
    fontSize: 64,
  },
  rating: {
    fontSize: FontSize.xxl,
    fontWeight: '900',
    letterSpacing: 4,
    textTransform: 'uppercase',
  },
  comparisonContainer: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeLabel: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    letterSpacing: 2,
    fontWeight: '600',
  },
  timeValue: {
    fontSize: FontSize.lg,
    fontFamily: 'monospace',
    fontWeight: '600',
    letterSpacing: 2,
  },
  timeDiff: {
    fontSize: FontSize.xl,
    fontFamily: 'monospace',
    fontWeight: '800',
    letterSpacing: 1,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.surfaceBorder,
  },
  actions: {
    alignItems: 'center',
    gap: Spacing.md,
    marginTop: Spacing.md,
  },
});
