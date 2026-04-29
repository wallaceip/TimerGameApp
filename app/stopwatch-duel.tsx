import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { TouchableOpacity as GHTouchableOpacity } from 'react-native-gesture-handler';
import { useRouter } from 'expo-router';
import { Colors, FontSize, Spacing, BorderRadius } from '@/constants/theme';
import { generateTargetTime, formatTimeAdaptive, formatTimeShort, getScoreRating } from '@/utils/timeHelpers';
import { getSettings, AppSettings, DEFAULT_SETTINGS } from '@/utils/storage';

type GameState = 'ready' | 'running' | 'result';

interface PlayerState {
  elapsedCs: number;
  started: boolean;
  stopped: boolean;
}

export default function StopwatchDuelScreen() {
  const router = useRouter();
  const [gameState, setGameState] = useState<GameState>('ready');
  const [targetCs, setTargetCs] = useState(0);

  // Per-player state
  const [p1, setP1] = useState<PlayerState>({ elapsedCs: 0, started: false, stopped: false });
  const [p2, setP2] = useState<PlayerState>({ elapsedCs: 0, started: false, stopped: false });

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const p1StartTimeRef = useRef<number | null>(null);
  const p2StartTimeRef = useRef<number | null>(null);
  const p1StopTimeRef = useRef<number | null>(null);
  const p2StopTimeRef = useRef<number | null>(null);
  const settingsRef = useRef<AppSettings>(DEFAULT_SETTINGS);

  // Load settings on mount
  useEffect(() => {
    (async () => {
      settingsRef.current = await getSettings();
    })();
  }, []);

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const startNewRound = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    const { minCs, maxCs } = settingsRef.current.stopwatch;
    const target = generateTargetTime(minCs, maxCs);
    setTargetCs(target);
    setP1({ elapsedCs: 0, started: false, stopped: false });
    setP2({ elapsedCs: 0, started: false, stopped: false });
    p1StartTimeRef.current = null;
    p2StartTimeRef.current = null;
    p1StopTimeRef.current = null;
    p2StopTimeRef.current = null;
    setGameState('running');
  }, []);

  // Ensure the shared interval is running whenever at least one player is active
  const ensureInterval = useCallback(() => {
    if (intervalRef.current) return; // already ticking
    intervalRef.current = setInterval(() => {
      const now = Date.now();
      // Update P1 if started but not stopped
      if (p1StartTimeRef.current !== null && p1StopTimeRef.current === null) {
        const cs = Math.floor((now - p1StartTimeRef.current) / 10);
        setP1(prev => ({ ...prev, elapsedCs: cs }));
      }
      // Update P2 if started but not stopped
      if (p2StartTimeRef.current !== null && p2StopTimeRef.current === null) {
        const cs = Math.floor((now - p2StartTimeRef.current) / 10);
        setP2(prev => ({ ...prev, elapsedCs: cs }));
      }
    }, 10);
  }, []);

  const startP1 = useCallback(() => {
    if (p1StartTimeRef.current !== null) return; // already started
    p1StartTimeRef.current = Date.now();
    setP1(prev => ({ ...prev, started: true }));
    ensureInterval();
  }, [ensureInterval]);

  const startP2 = useCallback(() => {
    if (p2StartTimeRef.current !== null) return; // already started
    p2StartTimeRef.current = Date.now();
    setP2(prev => ({ ...prev, started: true }));
    ensureInterval();
  }, [ensureInterval]);

  const checkBothStopped = useCallback(
    (p1Stopped: boolean, p2Stopped: boolean) => {
      if (p1Stopped && p2Stopped) {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        setGameState('result');
      }
    },
    []
  );

  const stopP1 = useCallback(() => {
    if (p1StopTimeRef.current !== null || p1StartTimeRef.current === null) return;
    const now = Date.now();
    p1StopTimeRef.current = now;
    const finalCs = Math.floor((now - p1StartTimeRef.current) / 10);
    setP1({ elapsedCs: finalCs, started: true, stopped: true });
    // Check if P2 is also stopped
    checkBothStopped(true, p2StopTimeRef.current !== null);
  }, [checkBothStopped]);

  const stopP2 = useCallback(() => {
    if (p2StopTimeRef.current !== null || p2StartTimeRef.current === null) return;
    const now = Date.now();
    p2StopTimeRef.current = now;
    const finalCs = Math.floor((now - p2StartTimeRef.current) / 10);
    setP2({ elapsedCs: finalCs, started: true, stopped: true });
    // Check if P1 is also stopped
    checkBothStopped(p1StopTimeRef.current !== null, true);
  }, [checkBothStopped]);

  const handleGoBack = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    router.back();
  }, [router]);

  // ── Compute results ──
  const p1Diff = Math.abs(targetCs - p1.elapsedCs);
  const p2Diff = Math.abs(targetCs - p2.elapsedCs);
  const winner: 'p1' | 'p2' | 'tie' =
    p1Diff < p2Diff ? 'p1' : p2Diff < p1Diff ? 'p2' : 'tie';

  // ── RESULT SCREEN ──
  if (gameState === 'result') {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          {/* P2 result (top, rotated) */}
          <View style={styles.resultHalfTop}>
            <View style={styles.rotated}>
              <PlayerResult
                label="PLAYER 2"
                color={Colors.neonMagenta}
                elapsedCs={p2.elapsedCs}
                targetCs={targetCs}
                diffCs={p2Diff}
                isWinner={winner === 'p2'}
                isTie={winner === 'tie'}
              />
            </View>
          </View>

          {/* Center controls */}
          <View style={styles.resultCenter}>
            <View style={styles.resultDivider} />
            <View style={styles.resultActions}>
              <TouchableOpacity
                style={styles.centerActionBtn}
                onPress={startNewRound}
                activeOpacity={0.7}
              >
                <Text style={styles.centerActionEmoji}>🔄</Text>
                <Text style={[styles.centerActionText, { color: Colors.neonCyan }]}>
                  REMATCH
                </Text>
              </TouchableOpacity>
              <View style={styles.resultActionDivider} />
              <TouchableOpacity
                style={styles.centerActionBtn}
                onPress={handleGoBack}
                activeOpacity={0.7}
              >
                <Text style={styles.centerActionEmoji}>🏠</Text>
                <Text style={[styles.centerActionText, { color: Colors.textSecondary }]}>
                  EXIT
                </Text>
              </TouchableOpacity>
            </View>
            <View style={styles.resultDivider} />
          </View>

          {/* P1 result (bottom) */}
          <View style={styles.resultHalfBottom}>
            <PlayerResult
              label="PLAYER 1"
              color={Colors.neonCyan}
              elapsedCs={p1.elapsedCs}
              targetCs={targetCs}
              diffCs={p1Diff}
              isWinner={winner === 'p1'}
              isTie={winner === 'tie'}
            />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // ── MAIN GAME SCREENS ──
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* ── READY STATE ── */}
        {gameState === 'ready' && (
          <>
            {/* P2 side (top, rotated) */}
            <View style={styles.halfTop}>
              <View style={styles.rotated}>
                <View style={styles.readySide}>
                  <Text style={[styles.readyPlayerLabel, { color: Colors.neonMagenta }]}>
                    PLAYER 2
                  </Text>
                  <Text style={styles.readyEmoji}>⚔️</Text>
                  <Text style={styles.readyDescription}>
                    Sit across from your{'\n'}opponent and get ready!
                  </Text>
                </View>
              </View>
            </View>

            {/* Center divider + button */}
            <View style={styles.centerZone}>
              <View style={styles.dividerLine} />
              <TouchableOpacity
                style={styles.readyGoButton}
                onPress={startNewRound}
                activeOpacity={0.7}
              >
                <Text style={styles.readyGoEmoji}>⚡</Text>
                <Text style={styles.readyGoText}>LET'S DUEL</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleGoBack} style={styles.backBtnCenter}>
                <Text style={styles.backText}>‹ Back</Text>
              </TouchableOpacity>
              <View style={styles.dividerLine} />
            </View>

            {/* P1 side (bottom) */}
            <View style={styles.halfBottom}>
              <View style={styles.readySide}>
                <Text style={[styles.readyPlayerLabel, { color: Colors.neonCyan }]}>
                  PLAYER 1
                </Text>
                <Text style={styles.readyEmoji}>⚔️</Text>
                <Text style={styles.readyDescription}>
                  Sit across from your{'\n'}opponent and get ready!
                </Text>
              </View>
            </View>
          </>
        )}

        {/* ── RUNNING STATE (includes per-player memorize → running → stopped) ── */}
        {gameState === 'running' && (
          <>
            {/* P2 side (top, rotated) */}
            <View style={styles.halfTop}>
              <View style={styles.rotated}>
                <PlayerSide
                  label="PLAYER 2"
                  color={Colors.neonMagenta}
                  dimColor={Colors.neonMagentaDim}
                  glowColor={Colors.neonMagentaGlow}
                  targetCs={targetCs}
                  started={p2.started}
                  stopped={p2.stopped}
                  elapsedCs={p2.elapsedCs}
                  onStart={startP2}
                  onStop={stopP2}
                />
              </View>
            </View>

            {/* Center divider */}
            <View style={styles.runningDivider}>
              <View style={styles.dividerLine} />
              <View style={styles.runningTargetPill}>
                <Text style={styles.runningTargetLabel}>TARGET</Text>
                <Text style={styles.runningTargetValue}>
                  {formatTimeAdaptive(targetCs)}
                </Text>
              </View>
              <View style={styles.dividerLine} />
            </View>

            {/* P1 side (bottom) */}
            <View style={styles.halfBottom}>
              <PlayerSide
                label="PLAYER 1"
                color={Colors.neonCyan}
                dimColor={Colors.neonCyanDim}
                glowColor={Colors.neonCyanGlow}
                targetCs={targetCs}
                started={p1.started}
                stopped={p1.stopped}
                elapsedCs={p1.elapsedCs}
                onStart={startP1}
                onStop={stopP1}
              />
            </View>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

// ── Sub-components ──────────────────────────────────────────────────────────

function PlayerSide({
  label,
  color,
  dimColor,
  glowColor,
  targetCs,
  started,
  stopped,
  onStart,
  onStop,
}: {
  label: string;
  color: string;
  dimColor: string;
  glowColor: string;
  targetCs: number;
  started: boolean;
  stopped: boolean;
  elapsedCs: number;
  onStart: () => void;
  onStop: () => void;
}) {
  // Player has stopped — show locked-in state
  if (stopped) {
    return (
      <View style={styles.runningSide}>
        <Text style={[styles.runningLabel, { color }]}>{label}</Text>
        <View style={styles.stoppedIndicator}>
          <Text style={[styles.stoppedCheck, { color }]}>✓</Text>
          <Text style={[styles.stoppedText, { color }]}>LOCKED IN</Text>
        </View>
        <Text style={styles.waitingText}>Waiting for opponent...</Text>
      </View>
    );
  }

  // Player hasn't started yet — show target + START button
  if (!started) {
    return (
      <View style={styles.runningSide}>
        <Text style={[styles.phaseLabel, { color }]}>{label} — MEMORIZE</Text>
        <View style={[styles.targetBox, { borderColor: color + '40' }]}>
          <Text style={[styles.targetTime, { color }]}>
            {formatTimeAdaptive(targetCs)}
          </Text>
        </View>
        <Text style={styles.hintText}>🧠 Memorize, then start!</Text>
        <GHTouchableOpacity
          style={[
            styles.duelBigButton,
            {
              backgroundColor: color + '15',
              borderColor: color,
              shadowColor: glowColor,
            },
          ]}
          onPress={onStart}
          activeOpacity={0.7}
        >
          <Text style={[styles.duelBigButtonText, { color }]}>START</Text>
        </GHTouchableOpacity>
      </View>
    );
  }

  // Player is running — show target reminder + pulse + STOP button
  return (
    <View style={styles.runningSide}>
      <Text style={[styles.runningLabel, { color }]}>{label}</Text>

      {/* Target reminder */}
      <View style={styles.playerTargetPill}>
        <Text style={styles.playerTargetLabel}>TARGET</Text>
        <Text style={[styles.playerTargetValue, { color }]}>
          {formatTimeAdaptive(targetCs)}
        </Text>
      </View>

      {/* Pulse indicator */}
      <View style={styles.pulseRow}>
        <View style={[styles.pulseOuter, { backgroundColor: dimColor }]}>
          <View style={[styles.pulseInner, { backgroundColor: color }]} />
        </View>
        <Text style={styles.countingText}>Counting...</Text>
      </View>

      {/* Stop button */}
      <GHTouchableOpacity
        style={[
          styles.duelBigButton,
          {
            backgroundColor: dimColor,
            borderColor: color,
            shadowColor: glowColor,
          },
        ]}
        onPress={onStop}
        activeOpacity={0.7}
      >
        <Text style={[styles.duelBigButtonText, { color }]}>STOP</Text>
      </GHTouchableOpacity>
    </View>
  );
}

function PlayerResult({
  label,
  color,
  elapsedCs,
  targetCs,
  diffCs,
  isWinner,
  isTie,
}: {
  label: string;
  color: string;
  elapsedCs: number;
  targetCs: number;
  diffCs: number;
  isWinner: boolean;
  isTie: boolean;
}) {
  const isOver = elapsedCs > targetCs;
  const { color: ratingColor } = getScoreRating(diffCs);

  return (
    <View style={styles.resultSide}>
      {/* Winner / Tie badge */}
      {isWinner && (
        <View style={styles.winnerBadge}>
          <Text style={styles.winnerTrophy}>🏆</Text>
          <Text style={[styles.winnerText, { color }]}>WINNER</Text>
        </View>
      )}
      {isTie && (
        <View style={styles.winnerBadge}>
          <Text style={styles.winnerTrophy}>🤝</Text>
          <Text style={[styles.winnerText, { color: Colors.neonYellow }]}>TIE</Text>
        </View>
      )}
      {!isWinner && !isTie && (
        <View style={styles.winnerBadge}>
          <Text style={styles.winnerTrophy}>💪</Text>
          <Text style={[styles.winnerText, { color: Colors.textMuted }]}>NEXT TIME</Text>
        </View>
      )}

      <Text style={[styles.resultLabel, { color }]}>{label}</Text>

      {/* Stats card */}
      <View style={styles.resultCard}>
        <View style={styles.resultRow}>
          <Text style={styles.resultRowLabel}>YOUR TIME</Text>
          <Text style={[styles.resultRowValue, { color }]}>
            {formatTimeAdaptive(elapsedCs)}
          </Text>
        </View>
        <View style={styles.resultRowDivider} />
        <View style={styles.resultRow}>
          <Text style={styles.resultRowLabel}>DIFFERENCE</Text>
          <Text style={[styles.resultRowDiff, { color: ratingColor }]}>
            {isOver ? '+' : '-'}
            {formatTimeShort(diffCs)}
          </Text>
        </View>
      </View>
    </View>
  );
}

// ── Styles ──────────────────────────────────────────────────────────────────

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    flex: 1,
  },

  // ── Split layout ──
  halfTop: {
    flex: 1,
    overflow: 'hidden',
  },
  halfBottom: {
    flex: 1,
  },
  rotated: {
    flex: 1,
    transform: [{ rotate: '180deg' }],
  },

  // ── Center zone (between halves) ──
  centerZone: {
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  dividerLine: {
    width: SCREEN_WIDTH * 0.85,
    height: 1,
    backgroundColor: Colors.surfaceBorder,
  },

  // ── READY state ──
  readySide: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  readyPlayerLabel: {
    fontSize: FontSize.xs,
    fontWeight: '800',
    letterSpacing: 4,
  },
  readyEmoji: {
    fontSize: 36,
  },
  readyDescription: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  readyGoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.neonCyan + '20',
    borderWidth: 1.5,
    borderColor: Colors.neonCyan,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    shadowColor: Colors.neonCyanGlow,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 15,
    elevation: 8,
  },
  readyGoEmoji: {
    fontSize: FontSize.lg,
  },
  readyGoText: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.neonCyan,
    letterSpacing: 3,
  },
  backBtnCenter: {
    paddingVertical: Spacing.xs,
  },
  backText: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    fontWeight: '500',
  },

  // ── MEMORIZE state ──
  memorizeSide: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  phaseLabel: {
    fontSize: FontSize.xs,
    fontWeight: '700',
    letterSpacing: 4,
  },
  targetBox: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    backgroundColor: Colors.surface,
  },
  targetTime: {
    fontSize: FontSize.xxl + 4,
    fontFamily: 'monospace',
    fontWeight: '300',
    letterSpacing: 4,
  },
  hintText: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    fontWeight: '500',
  },
  startDuelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.neonGreen + '20',
    borderWidth: 1.5,
    borderColor: Colors.neonGreen,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    shadowColor: Colors.neonGreenGlow,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 15,
    elevation: 8,
  },
  startDuelEmoji: {
    fontSize: FontSize.lg,
    color: Colors.neonGreen,
  },
  startDuelText: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.neonGreen,
    letterSpacing: 3,
  },
  // ── RUNNING state ──
  runningSide: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  runningLabel: {
    fontSize: FontSize.xs,
    fontWeight: '800',
    letterSpacing: 4,
  },
  runningDivider: {
    alignItems: 'center',
    paddingVertical: Spacing.xs,
    gap: Spacing.xs,
  },
  runningTargetPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  runningTargetLabel: {
    fontSize: 9,
    color: Colors.textMuted,
    letterSpacing: 2,
    fontWeight: '600',
  },
  runningTargetValue: {
    fontSize: FontSize.sm,
    fontFamily: 'monospace',
    color: Colors.neonYellow,
    fontWeight: '600',
    letterSpacing: 2,
  },
  playerTargetPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  playerTargetLabel: {
    fontSize: 9,
    color: Colors.textMuted,
    letterSpacing: 2,
    fontWeight: '600',
  },
  playerTargetValue: {
    fontSize: FontSize.sm,
    fontFamily: 'monospace',
    fontWeight: '600',
    letterSpacing: 2,
  },
  pulseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  pulseOuter: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  countingText: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    letterSpacing: 2,
    fontWeight: '500',
  },
  duelBigButton: {
    width: '80%',
    maxWidth: 260,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 2.5,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 20,
    elevation: 10,
  },
  duelBigButtonText: {
    fontSize: FontSize.xl,
    fontWeight: '900',
    letterSpacing: 4,
  },

  // Stopped state
  stoppedIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  stoppedCheck: {
    fontSize: FontSize.xl,
    fontWeight: '900',
  },
  stoppedText: {
    fontSize: FontSize.lg,
    fontWeight: '800',
    letterSpacing: 3,
  },
  waitingText: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    fontStyle: 'italic',
  },

  // ── RESULT state ──
  resultHalfTop: {
    flex: 1,
    overflow: 'hidden',
  },
  resultHalfBottom: {
    flex: 1,
  },
  resultCenter: {
    alignItems: 'center',
    paddingVertical: Spacing.xs,
    gap: Spacing.xs,
  },
  resultActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  centerActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
  },
  centerActionEmoji: {
    fontSize: 16,
  },
  centerActionText: {
    fontSize: FontSize.sm,
    fontWeight: '700',
    letterSpacing: 2,
  },
  resultActionDivider: {
    width: 1,
    height: 20,
    backgroundColor: Colors.surfaceBorder,
  },
  resultDivider: {
    width: SCREEN_WIDTH * 0.85,
    height: 1,
    backgroundColor: Colors.surfaceBorder,
  },
  resultSide: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
  },
  winnerBadge: {
    alignItems: 'center',
    gap: Spacing.xs,
  },
  winnerTrophy: {
    fontSize: 32,
  },
  winnerText: {
    fontSize: FontSize.lg,
    fontWeight: '900',
    letterSpacing: 4,
  },
  resultLabel: {
    fontSize: FontSize.xs,
    fontWeight: '700',
    letterSpacing: 3,
    marginTop: Spacing.xs,
  },
  resultCard: {
    width: '90%',
    maxWidth: 280,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  resultRowLabel: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    letterSpacing: 2,
    fontWeight: '600',
  },
  resultRowValue: {
    fontSize: FontSize.md,
    fontFamily: 'monospace',
    fontWeight: '600',
    letterSpacing: 2,
  },
  resultRowDiff: {
    fontSize: FontSize.lg,
    fontFamily: 'monospace',
    fontWeight: '800',
    letterSpacing: 1,
  },
  resultRowDivider: {
    height: 1,
    backgroundColor: Colors.surfaceBorder,
  },
});
