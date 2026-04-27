import React, { useState, useRef, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, FontSize, Spacing, BorderRadius } from '@/constants/theme';
import TimerDisplay from '@/components/TimerDisplay';
import GlowButton from '@/components/GlowButton';
import ScoreResult from '@/components/ScoreResult';
import { generateTargetTime, formatTimeAdaptive, getScoreRating } from '@/utils/timeHelpers';
import { getSettings, saveGameRecord, AppSettings, DEFAULT_SETTINGS } from '@/utils/storage';

type GameState = 'ready' | 'memorize' | 'running' | 'result';

export default function StopwatchScreen() {
  const router = useRouter();
  const [gameState, setGameState] = useState<GameState>('ready');
  const [targetCs, setTargetCs] = useState(0);
  const [elapsedCs, setElapsedCs] = useState(0);
  const [saved, setSaved] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef(0);
  const settingsRef = useRef<AppSettings>(DEFAULT_SETTINGS);

  // Load settings on mount
  useEffect(() => {
    (async () => {
      settingsRef.current = await getSettings();
    })();
  }, []);

  const startNewRound = useCallback(() => {
    const { minCs, maxCs } = settingsRef.current.stopwatch;
    const target = generateTargetTime(minCs, maxCs);
    setTargetCs(target);
    setElapsedCs(0);
    setSaved(false);
    setGameState('memorize');
  }, []);

  const startTimer = useCallback(() => {
    setGameState('running');
    startTimeRef.current = Date.now();
    intervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      setElapsedCs(Math.floor(elapsed / 10));
    }, 10);
  }, []);

  const stopTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    // Calculate final elapsed time precisely
    const finalElapsed = Date.now() - startTimeRef.current;
    const finalCs = Math.floor(finalElapsed / 10);
    setElapsedCs(finalCs);
    setGameState('result');

    // Save to history
    const diffCs = Math.abs(targetCs - finalCs);
    const { label } = getScoreRating(diffCs);
    saveGameRecord({
      mode: 'stopwatch',
      targetCs,
      actualCs: finalCs,
      diffCs,
      rating: label,
    }).then(() => setSaved(true));
  }, [targetCs]);

  const handlePlayAgain = useCallback(() => {
    startNewRound();
  }, [startNewRound]);

  const handleGoBack = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    router.back();
  }, [router]);

  // Result screen
  if (gameState === 'result') {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ScoreResult
          targetCs={targetCs}
          actualCs={elapsedCs}
          onPlayAgain={handlePlayAgain}
          onGoBack={handleGoBack}
          mode="stopwatch"
          saved={saved}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
            <Text style={styles.backText}>‹ Back</Text>
          </TouchableOpacity>
          <Text style={styles.modeTitle}>BLIND STOPWATCH</Text>
          <View style={styles.backButton} />
        </View>

        {/* Game Area */}
        <View style={styles.gameArea}>
          {gameState === 'ready' && (
            <View style={styles.readyContainer}>
              <Text style={styles.instructionEmoji}>🎯</Text>
              <Text style={styles.instructionTitle}>How it works</Text>
              <View style={styles.instructionList}>
                <Text style={styles.instructionItem}>
                  1. You'll see a target time
                </Text>
                <Text style={styles.instructionItem}>
                  2. Memorize it, then start the timer
                </Text>
                <Text style={styles.instructionItem}>
                  3. The display goes dark — count in your head
                </Text>
                <Text style={styles.instructionItem}>
                  4. Stop when you think you've hit the target!
                </Text>
              </View>
              <GlowButton
                title="Let's Go"
                onPress={startNewRound}
                color={Colors.neonCyan}
                size="large"
                icon="⚡"
              />
            </View>
          )}

          {gameState === 'memorize' && (
            <View style={styles.memorizeContainer}>
              <Text style={styles.phaseLabel}>MEMORIZE THIS TIME</Text>

              <TimerDisplay
                centiseconds={targetCs}
                color={Colors.neonCyan}
                size="large"
              />

              <View style={styles.memorizeHint}>
                <Text style={styles.hintText}>
                  🧠 Take your time to memorize
                </Text>
              </View>

              <GlowButton
                title="Start Timer"
                onPress={startTimer}
                color={Colors.neonGreen}
                size="large"
                icon="▶"
              />
            </View>
          )}

          {gameState === 'running' && (
            <View style={styles.runningContainer}>
              <Text style={styles.phaseLabel}>TIMER RUNNING</Text>

              {/* Target reminder (small) */}
              <View style={styles.targetReminder}>
                <Text style={styles.targetReminderLabel}>TARGET</Text>
                <Text style={styles.targetReminderValue}>
                  {formatTimeAdaptive(targetCs)}
                </Text>
              </View>

              {/* Hidden timer */}
              <TimerDisplay
                centiseconds={elapsedCs}
                hidden={true}
                color={Colors.neonCyan}
                size="large"
              />

              {/* Pulsing indicator */}
              <View style={styles.pulseContainer}>
                <View style={styles.pulseOuter}>
                  <View style={styles.pulseInner} />
                </View>
                <Text style={styles.pulseText}>Counting...</Text>
              </View>

              <TouchableOpacity
                style={styles.stopButton}
                onPress={stopTimer}
                activeOpacity={0.7}
              >
                <View style={styles.stopButtonInner}>
                  <Text style={styles.stopButtonText}>STOP</Text>
                </View>
              </TouchableOpacity>
            </View>
          )}
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
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingTop: Spacing.lg,
  },
  backButton: {
    width: 70,
  },
  backText: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  modeTitle: {
    fontSize: FontSize.sm,
    color: Colors.neonCyan,
    fontWeight: '700',
    letterSpacing: 3,
  },
  gameArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Ready state
  readyContainer: {
    alignItems: 'center',
    gap: Spacing.xl,
    paddingHorizontal: Spacing.lg,
  },
  instructionEmoji: {
    fontSize: 48,
  },
  instructionTitle: {
    fontSize: FontSize.xl,
    fontWeight: '700',
    color: Colors.white,
    letterSpacing: 1,
  },
  instructionList: {
    gap: Spacing.md,
    paddingHorizontal: Spacing.md,
  },
  instructionItem: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    lineHeight: 24,
  },

  // Memorize state
  memorizeContainer: {
    alignItems: 'center',
    gap: Spacing.xl,
  },
  phaseLabel: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    letterSpacing: 4,
    fontWeight: '700',
  },
  memorizeHint: {
    backgroundColor: Colors.neonCyanDim,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  hintText: {
    fontSize: FontSize.sm,
    color: Colors.neonCyan,
    fontWeight: '500',
  },

  // Running state
  runningContainer: {
    alignItems: 'center',
    gap: Spacing.xl,
  },
  targetReminder: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  targetReminderLabel: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    letterSpacing: 2,
    fontWeight: '600',
  },
  targetReminderValue: {
    fontSize: FontSize.md,
    fontFamily: 'monospace',
    color: Colors.neonCyan,
    fontWeight: '600',
    letterSpacing: 2,
  },
  pulseContainer: {
    alignItems: 'center',
    gap: Spacing.sm,
  },
  pulseOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.neonGreenDim,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.neonGreen,
  },
  pulseText: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    letterSpacing: 2,
    fontWeight: '500',
  },
  stopButton: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: Colors.neonMagentaDim,
    borderWidth: 3,
    borderColor: Colors.neonMagenta,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.neonMagentaGlow,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 25,
    elevation: 12,
    marginTop: Spacing.md,
  },
  stopButtonInner: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  stopButtonText: {
    fontSize: FontSize.xl,
    fontWeight: '900',
    color: Colors.neonMagenta,
    letterSpacing: 4,
  },
});
