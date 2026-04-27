import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, FontSize, Spacing, BorderRadius } from '@/constants/theme';

export interface BarData {
  value: number;   // error in centiseconds
  color: string;
  label?: string;  // e.g. game number
}

interface BarChartProps {
  data: BarData[];
  maxValue?: number;
  height?: number;
  title?: string;
}

export default function BarChart({
  data,
  maxValue,
  height = 160,
  title,
}: BarChartProps) {
  if (data.length === 0) {
    return (
      <View style={[styles.container, { height: height + 40 }]}>
        {title && <Text style={styles.title}>{title}</Text>}
        <View style={[styles.chartArea, { height }]}>
          <Text style={styles.emptyText}>No data yet</Text>
        </View>
      </View>
    );
  }

  const max = maxValue || Math.max(...data.map((d) => d.value), 1);
  const barWidth = Math.max(4, Math.min(16, (280 - data.length * 2) / data.length));

  return (
    <View style={styles.container}>
      {title && <Text style={styles.title}>{title}</Text>}

      {/* Y-axis labels + chart area */}
      <View style={styles.chartRow}>
        {/* Y-axis */}
        <View style={[styles.yAxis, { height }]}>
          <Text style={styles.axisLabel}>{(max / 100).toFixed(1)}s</Text>
          <Text style={styles.axisLabel}>{(max / 200).toFixed(1)}s</Text>
          <Text style={styles.axisLabel}>0s</Text>
        </View>

        {/* Chart */}
        <View style={[styles.chartArea, { height }]}>
          {/* Grid lines */}
          <View style={[styles.gridLine, { top: 0 }]} />
          <View style={[styles.gridLine, { top: '50%' }]} />
          <View style={[styles.gridLine, { bottom: 0 }]} />

          {/* Bars */}
          <View style={styles.barsContainer}>
            {data.map((bar, i) => {
              const barHeight = Math.max(2, (bar.value / max) * (height - 20));
              return (
                <View key={i} style={styles.barWrapper}>
                  <View
                    style={[
                      styles.bar,
                      {
                        height: barHeight,
                        width: barWidth,
                        backgroundColor: bar.color,
                        shadowColor: bar.color,
                      },
                    ]}
                  />
                </View>
              );
            })}
          </View>
        </View>
      </View>

      {/* X-axis label */}
      <Text style={styles.xAxisLabel}>Recent games →</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    gap: Spacing.xs,
  },
  title: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    letterSpacing: 3,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: Spacing.xs,
  },
  chartRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  yAxis: {
    width: 36,
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingRight: 4,
  },
  axisLabel: {
    fontSize: 9,
    color: Colors.textMuted,
    fontFamily: 'monospace',
  },
  chartArea: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  gridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: Colors.surfaceBorder,
  },
  barsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    height: '100%',
    paddingBottom: 4,
    paddingHorizontal: 8,
    gap: 2,
  },
  barWrapper: {
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  bar: {
    borderRadius: 2,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 4,
    elevation: 3,
  },
  emptyText: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    fontStyle: 'italic',
  },
  xAxisLabel: {
    fontSize: 9,
    color: Colors.textMuted,
    textAlign: 'right',
    fontFamily: 'monospace',
    marginTop: 2,
  },
});
