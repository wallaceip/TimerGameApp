import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors, FontSize, Spacing, BorderRadius } from '@/constants/theme';
import { formatTimeShort, formatTime } from '@/utils/timeHelpers';
import { getHistory, computeMetrics, GameRecord, GameMetrics } from '@/utils/storage';
import { getScoreRating } from '@/utils/timeHelpers';
import BarChart, { BarData } from '@/components/BarChart';

type TabMode = 'stopwatch' | 'beep';

export default function HistoryScreen() {
  const router = useRouter();
  const [tab, setTab] = useState<TabMode>('stopwatch');
  const [records, setRecords] = useState<GameRecord[]>([]);
  const [metrics, setMetrics] = useState<GameMetrics>({
    totalGames: 0,
    avgErrorCs: 0,
    bestDiffCs: 0,
    accuracyPercent: 0,
  });
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async (mode: TabMode) => {
    setLoading(true);
    const data = await getHistory(mode);
    setRecords(data);
    setMetrics(computeMetrics(data));
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData(tab);
  }, [tab, loadData]);

  const chartData: BarData[] = records.slice(0, 30).reverse().map((r) => {
    const { color } = getScoreRating(r.diffCs);
    return { value: r.diffCs, color };
  });

  const accentColor = tab === 'stopwatch' ? Colors.neonCyan : Colors.neonMagenta;

  const formatTimeFn = tab === 'beep' ? formatTimeShort : formatTime;

  const formatRelativeTime = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backText}>‹ Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>HISTORY</Text>
          <View style={styles.backButton} />
        </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tab, tab === 'stopwatch' && styles.tabActive]}
            onPress={() => setTab('stopwatch')}
          >
            <Text
              style={[
                styles.tabText,
                tab === 'stopwatch' && { color: Colors.neonCyan },
              ]}
            >
              ⏱ Stopwatch
            </Text>
            {tab === 'stopwatch' && (
              <View style={[styles.tabIndicator, { backgroundColor: Colors.neonCyan }]} />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, tab === 'beep' && styles.tabActive]}
            onPress={() => setTab('beep')}
          >
            <Text
              style={[
                styles.tabText,
                tab === 'beep' && { color: Colors.neonMagenta },
              ]}
            >
              🔔 Beep
            </Text>
            {tab === 'beep' && (
              <View style={[styles.tabIndicator, { backgroundColor: Colors.neonMagenta }]} />
            )}
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Metrics Cards */}
          <View style={styles.metricsGrid}>
            <View style={[styles.metricCard, { borderColor: accentColor + '30' }]}>
              <Text style={styles.metricValue}>{metrics.totalGames}</Text>
              <Text style={styles.metricLabel}>Games</Text>
            </View>
            <View style={[styles.metricCard, { borderColor: accentColor + '30' }]}>
              <Text style={styles.metricValue}>
                {metrics.totalGames > 0
                  ? (metrics.avgErrorCs / 100).toFixed(2) + 's'
                  : '—'}
              </Text>
              <Text style={styles.metricLabel}>Avg Error</Text>
            </View>
            <View style={[styles.metricCard, { borderColor: accentColor + '30' }]}>
              <Text style={styles.metricValue}>
                {metrics.totalGames > 0
                  ? (metrics.bestDiffCs / 100).toFixed(2) + 's'
                  : '—'}
              </Text>
              <Text style={styles.metricLabel}>Best</Text>
            </View>
            <View style={[styles.metricCard, { borderColor: accentColor + '30' }]}>
              <Text style={styles.metricValue}>
                {metrics.totalGames > 0 ? metrics.accuracyPercent + '%' : '—'}
              </Text>
              <Text style={styles.metricLabel}>≤1s Accuracy</Text>
            </View>
          </View>

          {/* Chart */}
          <View style={styles.chartSection}>
            <BarChart
              data={chartData}
              title="Error per game"
              height={140}
            />
          </View>

          {/* Recent Games */}
          <View style={styles.recentSection}>
            <Text style={styles.sectionTitle}>RECENT GAMES</Text>
            {records.length === 0 && !loading && (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyEmoji}>📭</Text>
                <Text style={styles.emptyText}>
                  No games played yet in this mode
                </Text>
              </View>
            )}
            {records.slice(0, 50).map((record) => {
              const { emoji, color, label } = getScoreRating(record.diffCs);
              return (
                <View key={record.id} style={styles.recordRow}>
                  <View style={styles.recordLeft}>
                    <Text style={styles.recordEmoji}>{emoji}</Text>
                    <View>
                      <View style={styles.recordTimes}>
                        <Text style={styles.recordTarget}>
                          🎯 {formatTimeFn(record.targetCs)}
                        </Text>
                        <Text style={styles.recordArrow}> → </Text>
                        <Text style={styles.recordActual}>
                          {formatTimeFn(record.actualCs)}
                        </Text>
                      </View>
                      <Text style={styles.recordTimestamp}>
                        {formatRelativeTime(record.timestamp)}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.recordRight}>
                    <Text style={[styles.recordDiff, { color }]}>
                      {record.actualCs > record.targetCs ? '+' : '-'}
                      {(record.diffCs / 100).toFixed(2)}s
                    </Text>
                    <Text style={[styles.recordBadge, { color }]}>{label}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        </ScrollView>
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
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingTop: Spacing.lg,
    paddingHorizontal: Spacing.lg,
  },
  backButton: {
    width: 70,
  },
  backText: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  headerTitle: {
    fontSize: FontSize.sm,
    color: Colors.neonGreen,
    fontWeight: '700',
    letterSpacing: 3,
  },

  // Tabs
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    position: 'relative',
  },
  tabActive: {},
  tabText: {
    fontSize: FontSize.md,
    color: Colors.textMuted,
    fontWeight: '600',
    letterSpacing: 1,
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: '20%',
    right: '20%',
    height: 2,
    borderRadius: 1,
  },

  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxl,
    gap: Spacing.lg,
  },

  // Metrics
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  metricCard: {
    width: '48%',
    flexGrow: 1,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    alignItems: 'center',
    gap: Spacing.xs,
  },
  metricValue: {
    fontSize: FontSize.xl,
    color: Colors.white,
    fontWeight: '800',
    fontFamily: 'monospace',
    letterSpacing: 1,
  },
  metricLabel: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    letterSpacing: 2,
    fontWeight: '600',
    textTransform: 'uppercase',
  },

  // Chart
  chartSection: {
    paddingVertical: Spacing.sm,
  },

  // Recent games
  recentSection: {
    gap: Spacing.sm,
  },
  sectionTitle: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    letterSpacing: 3,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  emptyContainer: {
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.xxl,
  },
  emptyEmoji: {
    fontSize: 48,
  },
  emptyText: {
    fontSize: FontSize.md,
    color: Colors.textMuted,
    fontStyle: 'italic',
  },
  recordRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  recordLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  recordEmoji: {
    fontSize: 20,
  },
  recordTimes: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  recordTarget: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontFamily: 'monospace',
  },
  recordArrow: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
  },
  recordActual: {
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
    fontFamily: 'monospace',
  },
  recordTimestamp: {
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 2,
  },
  recordRight: {
    alignItems: 'flex-end',
    gap: 2,
  },
  recordDiff: {
    fontSize: FontSize.sm,
    fontFamily: 'monospace',
    fontWeight: '700',
  },
  recordBadge: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
  },
});
