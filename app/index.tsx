import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Colors, FontSize, Spacing, BorderRadius } from '@/constants/theme';
import GameCard from '@/components/GameCard';
import { getActiveProfile, UserProfile } from '@/utils/storage';

export default function HomeScreen() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile>(getActiveProfile());

  // Refresh profile when returning from profiles screen
  useFocusEffect(
    useCallback(() => {
      setProfile(getActiveProfile());
    }, [])
  );

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

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push('/history')}
            activeOpacity={0.7}
          >
            <View style={[styles.actionIcon, { backgroundColor: Colors.neonGreenDim }]}>
              <Text style={styles.actionEmoji}>📊</Text>
            </View>
            <Text style={[styles.actionLabel, { color: Colors.neonGreen }]}>History</Text>
          </TouchableOpacity>

          <View style={styles.actionDivider} />

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push('/settings')}
            activeOpacity={0.7}
          >
            <View style={[styles.actionIcon, { backgroundColor: Colors.neonYellowDim }]}>
              <Text style={styles.actionEmoji}>⚙️</Text>
            </View>
            <Text style={[styles.actionLabel, { color: Colors.neonYellow }]}>Settings</Text>
          </TouchableOpacity>
        </View>

        {/* Footer (Profile Switch) */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.profileBar}
            onPress={() => router.push('/profiles')}
            activeOpacity={0.7}
          >
            <Text style={styles.profileEmoji}>{profile.emoji}</Text>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{profile.name}</Text>
              <Text style={styles.profileHint}>tap to switch ›</Text>
            </View>
          </TouchableOpacity>
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
    paddingTop: Spacing.xl,
    justifyContent: 'center',
    gap: Spacing.lg,
  },

  // Profile bar
  profileBar: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.neonCyan + '25',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  profileEmoji: {
    fontSize: 24,
  },
  profileInfo: {
    gap: 1,
  },
  profileName: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.neonCyan,
    letterSpacing: 0.5,
  },
  profileHint: {
    fontSize: 9,
    color: Colors.textMuted,
    letterSpacing: 1,
  },

  // Header
  header: {
    alignItems: 'center',
    gap: Spacing.sm,
  },
  logo: {
    fontSize: 48,
    marginBottom: Spacing.xs,
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
    paddingVertical: Spacing.sm,
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

  // Quick actions
  quickActions: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    padding: Spacing.md,
    alignItems: 'center',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  actionIcon: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionEmoji: {
    fontSize: 18,
  },
  actionLabel: {
    fontSize: FontSize.md,
    fontWeight: '700',
    letterSpacing: 1,
  },
  actionDivider: {
    width: 1,
    height: 28,
    backgroundColor: Colors.surfaceBorder,
    marginHorizontal: Spacing.sm,
  },

  footer: {
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  footerText: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    letterSpacing: 1,
    fontStyle: 'italic',
  },
});
