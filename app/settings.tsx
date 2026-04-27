import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, FontSize, Spacing, BorderRadius } from '@/constants/theme';
import {
  getSettings,
  saveSettings,
  clearHistory,
  AppSettings,
  DEFAULT_SETTINGS,
} from '@/utils/storage';
import GlowButton from '@/components/GlowButton';
import * as Haptics from 'expo-haptics';

// ─── Types ──────────────────────────────────────────────────────────────────

type EditTarget = {
  mode: 'stopwatch' | 'beep';
  bound: 'minCs' | 'maxCs';
  label: string;
  color: string;
} | null;

// ─── Main Screen ────────────────────────────────────────────────────────────

export default function SettingsScreen() {
  const router = useRouter();
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);

  // Numpad modal state
  const [editTarget, setEditTarget] = useState<EditTarget>(null);
  const [numpadValue, setNumpadValue] = useState('');

  useEffect(() => {
    (async () => {
      const s = await getSettings();
      setSettings(s);
    })();
  }, []);

  const openNumpad = useCallback(
    (mode: 'stopwatch' | 'beep', bound: 'minCs' | 'maxCs') => {
      const color = mode === 'stopwatch' ? Colors.neonCyan : Colors.neonMagenta;
      const label = bound === 'minCs' ? 'Min Time' : 'Max Time';
      // Pre-fill with current value as raw digits (cs → raw input string)
      const currentCs = settings[mode][bound];
      setNumpadValue(String(currentCs));
      setEditTarget({ mode, bound, label, color });
    },
    [settings]
  );

  const handleNumpadConfirm = useCallback(() => {
    if (!editTarget) return;
    const parsed = parseInt(numpadValue, 10) || 0;
    const { mode, bound } = editTarget;

    setSettings((prev) => {
      let value = parsed;

      // Clamp: min 0.05s (5cs), max 180s (18000cs)
      value = Math.max(5, Math.min(value, 18000));

      // Ensure min < max
      if (bound === 'minCs' && value >= prev[mode].maxCs) {
        value = prev[mode].maxCs - 100;
      }
      if (bound === 'maxCs' && value <= prev[mode].minCs) {
        value = prev[mode].minCs + 100;
      }

      return {
        ...prev,
        [mode]: { ...prev[mode], [bound]: value },
      };
    });

    setDirty(true);
    setEditTarget(null);
    setNumpadValue('');
  }, [editTarget, numpadValue]);

  const handleNumpadCancel = useCallback(() => {
    setEditTarget(null);
    setNumpadValue('');
  }, []);

  const handleSave = useCallback(async () => {
    setSaving(true);
    await saveSettings(settings);
    setDirty(false);
    setSaving(false);
  }, [settings]);

  const handleClearHistory = useCallback(() => {
    Alert.alert(
      'Clear All History',
      'This will permanently delete all game records for both modes. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            await clearHistory();
            Alert.alert('Done', 'History has been cleared.');
          },
        },
      ]
    );
  }, []);

  const handleReset = useCallback(() => {
    setSettings(DEFAULT_SETTINGS);
    setDirty(true);
  }, []);

  const formatCs = (cs: number) => {
    const totalS = cs / 100;
    const seconds = Math.floor(totalS);
    const centis = Math.round((totalS - seconds) * 100);
    return `${seconds}.${String(centis).padStart(2, '0')}s`;
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backText}>‹ Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>SETTINGS</Text>
          <View style={styles.backButton} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Stopwatch Settings */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionIcon}>⏱</Text>
              <Text style={[styles.sectionTitle, { color: Colors.neonCyan }]}>
                Blind Stopwatch
              </Text>
            </View>
            <Text style={styles.sectionDesc}>
              Tap a value to type a new time using the numpad
            </Text>

            <TouchableOpacity
              style={styles.rangeRow}
              onPress={() => openNumpad('stopwatch', 'minCs')}
              activeOpacity={0.6}
            >
              <Text style={styles.rangeLabel}>Min Time</Text>
              <View style={[styles.valuePill, { borderColor: Colors.neonCyan + '40' }]}>
                <Text style={[styles.valueText, { color: Colors.neonCyan }]}>
                  {formatCs(settings.stopwatch.minCs)}
                </Text>
                <Text style={styles.editHint}>tap to edit</Text>
              </View>
            </TouchableOpacity>

            <View style={styles.rangeDivider} />

            <TouchableOpacity
              style={styles.rangeRow}
              onPress={() => openNumpad('stopwatch', 'maxCs')}
              activeOpacity={0.6}
            >
              <Text style={styles.rangeLabel}>Max Time</Text>
              <View style={[styles.valuePill, { borderColor: Colors.neonCyan + '40' }]}>
                <Text style={[styles.valueText, { color: Colors.neonCyan }]}>
                  {formatCs(settings.stopwatch.maxCs)}
                </Text>
                <Text style={styles.editHint}>tap to edit</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Beep Settings */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionIcon}>🔔</Text>
              <Text style={[styles.sectionTitle, { color: Colors.neonMagenta }]}>
                Beep Interval
              </Text>
            </View>
            <Text style={styles.sectionDesc}>
              Tap a value to type a new time using the numpad
            </Text>

            <TouchableOpacity
              style={styles.rangeRow}
              onPress={() => openNumpad('beep', 'minCs')}
              activeOpacity={0.6}
            >
              <Text style={styles.rangeLabel}>Min Time</Text>
              <View style={[styles.valuePill, { borderColor: Colors.neonMagenta + '40' }]}>
                <Text style={[styles.valueText, { color: Colors.neonMagenta }]}>
                  {formatCs(settings.beep.minCs)}
                </Text>
                <Text style={styles.editHint}>tap to edit</Text>
              </View>
            </TouchableOpacity>

            <View style={styles.rangeDivider} />

            <TouchableOpacity
              style={styles.rangeRow}
              onPress={() => openNumpad('beep', 'maxCs')}
              activeOpacity={0.6}
            >
              <Text style={styles.rangeLabel}>Max Time</Text>
              <View style={[styles.valuePill, { borderColor: Colors.neonMagenta + '40' }]}>
                <Text style={[styles.valueText, { color: Colors.neonMagenta }]}>
                  {formatCs(settings.beep.maxCs)}
                </Text>
                <Text style={styles.editHint}>tap to edit</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Actions */}
          <View style={styles.actionsSection}>
            {dirty && (
              <GlowButton
                title={saving ? 'Saving...' : 'Save Settings'}
                onPress={handleSave}
                color={Colors.neonGreen}
                size="large"
                icon="✓"
                loading={saving}
              />
            )}

            <GlowButton
              title="Reset Defaults"
              onPress={handleReset}
              color={Colors.textSecondary}
              variant="outline"
              size="normal"
            />
          </View>

          {/* Danger Zone */}
          <View style={styles.dangerSection}>
            <Text style={styles.dangerTitle}>DATA</Text>
            <TouchableOpacity
              style={styles.dangerButton}
              onPress={handleClearHistory}
              activeOpacity={0.7}
            >
              <Text style={styles.dangerIcon}>🗑</Text>
              <View style={styles.dangerTextContainer}>
                <Text style={styles.dangerButtonText}>Clear All History</Text>
                <Text style={styles.dangerDesc}>
                  Permanently delete all game records
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>

      {/* ─── Numpad Modal ─────────────────────────────────────────────── */}
      <Modal
        visible={editTarget !== null}
        transparent
        animationType="fade"
        onRequestClose={handleNumpadCancel}
      >
        <View style={modalStyles.overlay}>
          <View style={modalStyles.container}>
            {/* Display */}
            <View style={modalStyles.displaySection}>
              <Text style={modalStyles.displayLabel}>
                {editTarget?.label?.toUpperCase() ?? ''}
              </Text>
              <Text
                style={[
                  modalStyles.displayValue,
                  {
                    color: editTarget?.color ?? Colors.white,
                    textShadowColor: (editTarget?.color ?? Colors.white) + '60',
                  },
                ]}
              >
                {formatNumpadDisplay(numpadValue)}
                <Text style={modalStyles.displayUnit}>s</Text>
              </Text>
              <Text style={modalStyles.displayHint}>
                Type digits • last 2 = centiseconds
              </Text>
            </View>

            {/* Keypad */}
            <SettingsNumPad
              value={numpadValue}
              onChange={setNumpadValue}
              onConfirm={handleNumpadConfirm}
              onCancel={handleNumpadCancel}
              accentColor={editTarget?.color ?? Colors.neonCyan}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatNumpadDisplay(val: string): string {
  if (!val) return '0.00';
  const num = parseInt(val, 10);
  if (isNaN(num)) return '0.00';
  const seconds = Math.floor(num / 100);
  const cs = num % 100;
  return `${seconds}.${String(cs).padStart(2, '0')}`;
}

// ─── Settings NumPad Component ──────────────────────────────────────────────

interface SettingsNumPadProps {
  value: string;
  onChange: (v: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
  accentColor: string;
}

function SettingsNumPad({
  value,
  onChange,
  onConfirm,
  onCancel,
  accentColor,
}: SettingsNumPadProps) {
  const maxLength = 5;

  const handlePress = (digit: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (value.length < maxLength) {
      onChange(value + digit);
    }
  };

  const handleDelete = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onChange(value.slice(0, -1));
  };

  const handleConfirm = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    onConfirm();
  };

  const handleCancel = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onCancel();
  };

  const keys = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['⌫', '0', '✓'],
  ];

  return (
    <View style={padStyles.container}>
      {keys.map((row, rowIdx) => (
        <View key={rowIdx} style={padStyles.row}>
          {row.map((key) => {
            const isDelete = key === '⌫';
            const isSubmit = key === '✓';
            const isSpecial = isDelete || isSubmit;

            return (
              <TouchableOpacity
                key={key}
                style={[
                  padStyles.key,
                  isSubmit && [padStyles.submitKey, { borderColor: accentColor + '40' }],
                  isDelete && padStyles.deleteKey,
                ]}
                onPress={() => {
                  if (isDelete) handleDelete();
                  else if (isSubmit) handleConfirm();
                  else handlePress(key);
                }}
                activeOpacity={0.6}
              >
                <Text
                  style={[
                    padStyles.keyText,
                    isSubmit && { color: Colors.neonGreen },
                    isDelete && padStyles.deleteKeyText,
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

      {/* Cancel button */}
      <TouchableOpacity
        style={padStyles.cancelButton}
        onPress={handleCancel}
        activeOpacity={0.6}
      >
        <Text style={padStyles.cancelText}>Cancel</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Numpad Styles ──────────────────────────────────────────────────────────

const padStyles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  key: {
    width: 80,
    height: 58,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  submitKey: {
    backgroundColor: Colors.neonGreenDim,
  },
  deleteKey: {
    backgroundColor: Colors.dangerDim,
    borderColor: Colors.danger + '40',
  },
  keyText: {
    fontSize: FontSize.xl,
    fontWeight: '600',
    color: Colors.textPrimary,
    fontFamily: 'monospace',
  },
  deleteKeyText: {
    color: Colors.danger,
  },
  cancelButton: {
    marginTop: Spacing.sm,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xl,
  },
  cancelText: {
    fontSize: FontSize.md,
    color: Colors.textMuted,
    fontWeight: '500',
    letterSpacing: 1,
  },
});

// ─── Modal Styles ───────────────────────────────────────────────────────────

const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: '90%',
    maxWidth: 360,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    padding: Spacing.lg,
    gap: Spacing.lg,
    alignItems: 'center',
  },
  displaySection: {
    alignItems: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
  },
  displayLabel: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    letterSpacing: 3,
    fontWeight: '600',
  },
  displayValue: {
    fontSize: FontSize.timer,
    fontFamily: 'monospace',
    fontWeight: '300',
    letterSpacing: 3,
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
});

// ─── Main Styles ────────────────────────────────────────────────────────────

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
    color: Colors.neonYellow,
    fontWeight: '700',
    letterSpacing: 3,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxl,
    gap: Spacing.xl,
  },

  // Section
  section: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  sectionIcon: {
    fontSize: 22,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    letterSpacing: 1,
  },
  sectionDesc: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    lineHeight: 18,
    marginBottom: Spacing.xs,
  },
  rangeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rangeLabel: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  valuePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    backgroundColor: Colors.surfaceLight,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  valueText: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    fontFamily: 'monospace',
    letterSpacing: 1,
  },
  editHint: {
    fontSize: 9,
    color: Colors.textMuted,
    fontStyle: 'italic',
  },
  rangeDivider: {
    height: 1,
    backgroundColor: Colors.surfaceBorder,
  },

  // Actions
  actionsSection: {
    alignItems: 'center',
    gap: Spacing.md,
  },

  // Danger zone
  dangerSection: {
    gap: Spacing.sm,
  },
  dangerTitle: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    letterSpacing: 3,
    fontWeight: '600',
  },
  dangerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.dangerDim,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.danger + '30',
    padding: Spacing.lg,
  },
  dangerIcon: {
    fontSize: 22,
  },
  dangerTextContainer: {
    flex: 1,
    gap: 2,
  },
  dangerButtonText: {
    fontSize: FontSize.md,
    color: Colors.danger,
    fontWeight: '700',
  },
  dangerDesc: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
  },
});
