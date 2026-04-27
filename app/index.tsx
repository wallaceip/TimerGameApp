import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, FontSize, Spacing } from '@/constants/theme';
import GameCard from '@/components/GameCard';

export default function HomeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.logo}>⏱</Text>
          <Text style={styles.title}>TimeSync</Text>
          <Text style={styles.subtitle}>Train your internal clock</Text>
        </View>

        {/* Decorative line */}
        <View style={styles.decorLine}>
          <View style={[styles.lineSegment, { backgroundColor: Colors.neonCyan }]} />
          <View style={[styles.lineDot, { backgroundColor: Colors.neonCyan }]} />
          <View style={[styles.lineSegment, { backgroundColor: Colors.neonCyan }]} />
        </View>

        {/* Game Modes */}
        <View style={styles.modesContainer}>
          <Text style={styles.sectionTitle}>GAME MODES</Text>

          <GameCard
            title="Blind Stopwatch"
            description="See the target time, then blindly stop the timer when you think you've hit it"
            icon="⏱"
            color={Colors.neonCyan}
            onPress={() => router.push('/stopwatch')}
          />

          <GameCard
            title="Beep Interval"
            description="Listen for two beeps, then estimate the time between them using the numpad"
            icon="🔔"
            color={Colors.neonMagenta}
            onPress={() => router.push('/beep')}
          />
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            How well do you know time?
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xxl,
    justifyContent: 'center',
    gap: Spacing.xl,
  },
  header: {
    alignItems: 'center',
    gap: Spacing.sm,
  },
  logo: {
    fontSize: 56,
    marginBottom: Spacing.sm,
  },
  title: {
    fontSize: FontSize.xxl + 8,
    fontWeight: '900',
    color: Colors.white,
    letterSpacing: 6,
    textTransform: 'uppercase',
    textShadowColor: Colors.neonCyanGlow,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  subtitle: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    letterSpacing: 3,
    textTransform: 'uppercase',
  },
  decorLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
  },
  lineSegment: {
    height: 1,
    width: 60,
    opacity: 0.3,
  },
  lineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    opacity: 0.6,
  },
  modesContainer: {
    gap: Spacing.md,
  },
  sectionTitle: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    letterSpacing: 4,
    fontWeight: '600',
    marginLeft: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: Spacing.lg,
  },
  footerText: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    letterSpacing: 1,
    fontStyle: 'italic',
  },
});
