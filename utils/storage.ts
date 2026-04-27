import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface GameRecord {
  id: string;
  mode: 'stopwatch' | 'beep';
  targetCs: number;
  actualCs: number;
  diffCs: number;
  rating: string;
  timestamp: number;
}

export interface TimeRange {
  minCs: number;
  maxCs: number;
}

export interface AppSettings {
  stopwatch: TimeRange;
  beep: TimeRange;
}

// ─── Defaults ────────────────────────────────────────────────────────────────

const HISTORY_KEY = '@timesync_history';
const SETTINGS_KEY = '@timesync_settings';
const MAX_RECORDS_PER_MODE = 200;

export const DEFAULT_SETTINGS: AppSettings = {
  stopwatch: { minCs: 5, maxCs: 1000 },   // 0.05s – 10s
  beep: { minCs: 5, maxCs: 1000 },         // 0.05s – 10s
};

// ─── Unique ID ───────────────────────────────────────────────────────────────

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
}

// ─── History ─────────────────────────────────────────────────────────────────

export async function saveGameRecord(
  record: Omit<GameRecord, 'id' | 'timestamp'>
): Promise<GameRecord> {
  const full: GameRecord = {
    ...record,
    id: generateId(),
    timestamp: Date.now(),
  };

  try {
    const raw = await AsyncStorage.getItem(HISTORY_KEY);
    const all: GameRecord[] = raw ? JSON.parse(raw) : [];
    all.unshift(full); // newest first

    // Prune per-mode if needed
    const stopwatch = all.filter((r) => r.mode === 'stopwatch');
    const beep = all.filter((r) => r.mode === 'beep');
    const pruned = [
      ...stopwatch.slice(0, MAX_RECORDS_PER_MODE),
      ...beep.slice(0, MAX_RECORDS_PER_MODE),
    ].sort((a, b) => b.timestamp - a.timestamp);

    await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(pruned));
    return full;
  } catch (e) {
    console.warn('Failed to save game record:', e);
    return full;
  }
}

export async function getHistory(
  mode?: 'stopwatch' | 'beep'
): Promise<GameRecord[]> {
  try {
    const raw = await AsyncStorage.getItem(HISTORY_KEY);
    const all: GameRecord[] = raw ? JSON.parse(raw) : [];
    if (mode) return all.filter((r) => r.mode === mode);
    return all;
  } catch (e) {
    console.warn('Failed to load history:', e);
    return [];
  }
}

export async function clearHistory(): Promise<void> {
  try {
    await AsyncStorage.removeItem(HISTORY_KEY);
  } catch (e) {
    console.warn('Failed to clear history:', e);
  }
}

// ─── Settings ────────────────────────────────────────────────────────────────

export async function getSettings(): Promise<AppSettings> {
  try {
    const raw = await AsyncStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch (e) {
    console.warn('Failed to load settings:', e);
    return DEFAULT_SETTINGS;
  }
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  try {
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {
    console.warn('Failed to save settings:', e);
  }
}

// ─── Metrics helpers ─────────────────────────────────────────────────────────

export interface GameMetrics {
  totalGames: number;
  avgErrorCs: number;
  bestDiffCs: number;
  accuracyPercent: number; // % within 100cs (1s) of target
}

export function computeMetrics(records: GameRecord[]): GameMetrics {
  if (records.length === 0) {
    return { totalGames: 0, avgErrorCs: 0, bestDiffCs: 0, accuracyPercent: 0 };
  }

  const diffs = records.map((r) => r.diffCs);
  const totalGames = records.length;
  const avgErrorCs = Math.round(diffs.reduce((a, b) => a + b, 0) / totalGames);
  const bestDiffCs = Math.min(...diffs);
  const within1s = diffs.filter((d) => d <= 100).length;
  const accuracyPercent = Math.round((within1s / totalGames) * 100);

  return { totalGames, avgErrorCs, bestDiffCs, accuracyPercent };
}
