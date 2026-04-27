import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, FontSize, Spacing, BorderRadius } from '@/constants/theme';
import NumPad from '@/components/NumPad';
import ScoreResult from '@/components/ScoreResult';
import GlowButton from '@/components/GlowButton';
import {
  generateBeepInterval,
  parseSmartInput,
  formatTimeShort,
  getScoreRating,
} from '@/utils/timeHelpers';
import { playBeep } from '@/utils/sounds';
import { getSettings, saveGameRecord, AppSettings, DEFAULT_SETTINGS } from '@/utils/storage';

type GameState = 'ready' | 'waiting' | 'first_beep' | 'between' | 'second_beep' | 'guessing' | 'result';

export default function BeepScreen() {
  const router = useRouter();
  const [gameState, setGameState] = useState<GameState>('ready');
  const [intervalCs, setIntervalCs] = useState(0);
  const [guessInput, setGuessInput] = useState('');
  const [guessCs, setGuessCs] = useState(0);
  const [countdown, setCountdown] = useState(0);
  const [saved, setSaved] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const settingsRef = useRef<AppSettings>(DEFAULT_SETTINGS);

  // Load settings on mount
  useEffect(() => {
    (async () => {
      settingsRef.current = await getSettings();
    })();
  }, []);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, []);

  const clearTimers = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
  };

  const startRound = useCallback(() => {
    clearTimers();
    const { minCs, maxCs } = settingsRef.current.beep;
    const interval = generateBeepInterval(minCs, maxCs);
    setIntervalCs(interval);
    setGuessInput('');
    setGuessCs(0);
    setSaved(false);

    // Full 3s countdown before the first beep
    const totalDelayBeforeFirstBeep = 3000;
    
    setGameState('waiting');
    setCountdown(3);

    // Countdown display
    let countVal = 3;
    countdownRef.current = setInterval(() => {
      countVal--;
      setCountdown(countVal);
      if (countVal <= 0) {
        if (countdownRef.current) clearInterval(countdownRef.current);
      }
    }, 1000);

    // First beep after full countdown + random delay
    timeoutRef.current = setTimeout(async () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
      setGameState('first_beep');
      await playBeep();

      // Wait 300ms to show beep state
      timeoutRef.current = setTimeout(() => {
        setGameState('between');

        // Second beep after the interval
        const intervalMs = interval * 10; // centiseconds to milliseconds
        timeoutRef.current = setTimeout(async () => {
          setGameState('second_beep');
          await playBeep();

          // Transition to guessing after 500ms
          timeoutRef.current = setTimeout(() => {
            setGameState('guessing');
          }, 500);
        }, intervalMs);
      }, 300);
    }, totalDelayBeforeFirstBeep);
  }, []);

  const handleSubmitGuess = useCallback(() => {
    const parsed = parseSmartInput(guessInput);
    setGuessCs(parsed);
    setGameState('result');

    // Save to history
    const diffCs = Math.abs(intervalCs - parsed);
    const { label } = getScoreRating(diffCs);
    saveGameRecord({
      mode: 'beep',
      targetCs: intervalCs,
      actualCs: parsed,
      diffCs,
      rating: label,
    }).then(() => setSaved(true));
  }, [guessInput, intervalCs]);

  const handlePlayAgain = useCallback(() => {
    startRound();
  }, [startRound]);

  const handleGoBack = useCallback(() => {
    clearTimers();
    router.back();
  }, [router]);

  // Result screen
  if (gameState === 'result') {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ScoreResult
          targetCs={intervalCs}
          actualCs={guessCs}
          onPlayAgain={handlePlayAgain}
          onGoBack={handleGoBack}
          mode="beep"
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
          <Text style={styles.modeTitle}>BEEP INTERVAL</Text>
          <View style={styles.backButton} />
        </View>

        {/* Game Area */}
        <View style={styles.gameArea}>
          {gameState === 'ready' && (
            <View style={styles.readyContainer}>
              <Text style={styles.instructionEmoji}>🔔</Text>
              <Text style={styles.instructionTitle}>How it works</Text>
              <View style={styles.instructionList}>
                <Text style={styles.instructionItem}>
                  1. You'll hear two beeps
                </Text>
                <Text style={styles.instructionItem}>
                  2. Focus on the time between them
                </Text>
                <Text style={styles.instructionItem}>
                  3. Use the numpad to enter your guess
                </Text>
                <Text style={styles.instructionItem}>
                  4. Type digits — last 2 are centiseconds
                </Text>
                <Text style={styles.instructionHint}>
                  e.g. 1252 → 12.52s, 141 → 1.41s
                </Text>
              </View>
              <GlowButton
                title="Start"
                onPress={startRound}
                color={Colors.neonMagenta}
                size="large"
                icon="🎧"
              />
            </View>
          )}

          {gameState === 'waiting' && (
            <View style={styles.listeningContainer}>
              <Text style={styles.listeningText}>GET READY</Text>
              <View style={styles.countdownContainer}>
                <Text style={styles.countdownText}>{countdown || '•'}</Text>
              </View>
              <Text style={styles.listeningHint}>Listen carefully...</Text>
            </View>
          )}

          {gameState === 'first_beep' && (
            <View style={styles.beepContainer}>
              <View style={[styles.beepRing, { borderColor: Colors.neonMagenta }]}>
                <View style={[styles.beepDot, { backgroundColor: Colors.neonMagenta }]} />
              </View>
              <Text style={[styles.beepLabel, { color: Colors.neonMagenta }]}>
                BEEP 1
              </Text>
            </View>
          )}

          {gameState === 'between' && (
            <View style={styles.betweenContainer}>
              <Text style={styles.betweenText}>⏳</Text>
              <Text style={styles.betweenLabel}>Counting...</Text>
              <Text style={styles.betweenHint}>
                Wait for the second beep
              </Text>
            </View>
          )}

          {gameState === 'second_beep' && (
            <View style={styles.beepContainer}>
              <View style={[styles.beepRing, { borderColor: Colors.neonGreen }]}>
                <View style={[styles.beepDot, { backgroundColor: Colors.neonGreen }]} />
              </View>
              <Text style={[styles.beepLabel, { color: Colors.neonGreen }]}>
                BEEP 2
              </Text>
            </View>
          )}

          {gameState === 'guessing' && (
            <View style={styles.guessingContainer}>
              <Text style={styles.guessingLabel}>
                How long was the interval?
              </Text>
              <NumPad
                value={guessInput}
                onChange={setGuessInput}
                onSubmit={handleSubmitGuess}
              />
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
    color: Colors.neonMagenta,
    fontWeight: '700',
    letterSpacing: 3,
  },
  gameArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Ready
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
  instructionHint: {
    fontSize: FontSize.sm,
    color: Colors.neonMagenta,
    fontStyle: 'italic',
    marginTop: Spacing.xs,
  },

  // Waiting / Countdown
  listeningContainer: {
    alignItems: 'center',
    gap: Spacing.lg,
  },
  listeningText: {
    fontSize: FontSize.xl,
    color: Colors.textSecondary,
    letterSpacing: 6,
    fontWeight: '700',
  },
  countdownContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: Colors.neonMagenta + '40',
    backgroundColor: Colors.neonMagentaDim,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countdownText: {
    fontSize: FontSize.timerLarge,
    color: Colors.neonMagenta,
    fontWeight: '300',
    fontFamily: 'monospace',
  },
  listeningHint: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    letterSpacing: 2,
  },

  // Beep visual
  beepContainer: {
    alignItems: 'center',
    gap: Spacing.lg,
  },
  beepRing: {
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  beepDot: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  beepLabel: {
    fontSize: FontSize.xl,
    fontWeight: '800',
    letterSpacing: 4,
  },

  // Between beeps
  betweenContainer: {
    alignItems: 'center',
    gap: Spacing.md,
  },
  betweenText: {
    fontSize: 64,
  },
  betweenLabel: {
    fontSize: FontSize.xl,
    color: Colors.textSecondary,
    letterSpacing: 4,
    fontWeight: '600',
  },
  betweenHint: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    letterSpacing: 1,
  },

  // Guessing
  guessingContainer: {
    width: '100%',
    alignItems: 'center',
    gap: Spacing.lg,
  },
  guessingLabel: {
    fontSize: FontSize.lg,
    color: Colors.white,
    fontWeight: '600',
    letterSpacing: 1,
    textAlign: 'center',
  },
});
