import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface UserProfile {
  id: string;
  name: string;
  emoji: string;
  createdAt: number;
}

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

const PROFILES_KEY = '@timesync_profiles';
const ACTIVE_PROFILE_KEY = '@timesync_active_profile';
const MAX_RECORDS_PER_MODE = 200;

export const DEFAULT_SETTINGS: AppSettings = {
  stopwatch: { minCs: 5, maxCs: 1000 },   // 0.05s – 10s
  beep: { minCs: 5, maxCs: 1000 },         // 0.05s – 10s
};

const DEFAULT_PROFILE: UserProfile = {
  id: 'default',
  name: 'Player 1',
  emoji: '🎮',
  createdAt: 0,
};

// ─── Active Profile (module-level cache) ─────────────────────────────────────

let _activeProfile: UserProfile = DEFAULT_PROFILE;

/** Get the currently active profile (sync, from cache). */
export function getActiveProfile(): UserProfile {
  return _activeProfile;
}

/** Initialize the active profile from storage. Call once on app start. */
export async function initActiveProfile(): Promise<UserProfile> {
  try {
    const profiles = await getProfiles();
    if (profiles.length === 0) {
      // First launch: create default profile
      await saveProfiles([DEFAULT_PROFILE]);
      _activeProfile = DEFAULT_PROFILE;
      return _activeProfile;
    }

    const activeId = await AsyncStorage.getItem(ACTIVE_PROFILE_KEY);
    const found = profiles.find((p) => p.id === activeId);
    _activeProfile = found || profiles[0];
    return _activeProfile;
  } catch (e) {
    console.warn('Failed to init active profile:', e);
    _activeProfile = DEFAULT_PROFILE;
    return _activeProfile;
  }
}

/** Switch to a different profile. */
export async function setActiveProfile(profile: UserProfile): Promise<void> {
  _activeProfile = profile;
  try {
    await AsyncStorage.setItem(ACTIVE_PROFILE_KEY, profile.id);
  } catch (e) {
    console.warn('Failed to set active profile:', e);
  }
}

// ─── Profile-scoped storage keys ─────────────────────────────────────────────

function historyKey(): string {
  return `@timesync_history_${_activeProfile.id}`;
}

function settingsKey(): string {
  return `@timesync_settings_${_activeProfile.id}`;
}

// ─── Profile Management ──────────────────────────────────────────────────────

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
}

export async function getProfiles(): Promise<UserProfile[]> {
  try {
    const raw = await AsyncStorage.getItem(PROFILES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.warn('Failed to load profiles:', e);
    return [];
  }
}

async function saveProfiles(profiles: UserProfile[]): Promise<void> {
  try {
    await AsyncStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));
  } catch (e) {
    console.warn('Failed to save profiles:', e);
  }
}

export async function createProfile(name: string, emoji: string): Promise<UserProfile> {
  const profile: UserProfile = {
    id: generateId(),
    name: name.trim() || 'Player',
    emoji,
    createdAt: Date.now(),
  };
  const profiles = await getProfiles();
  profiles.push(profile);
  await saveProfiles(profiles);
  return profile;
}

export async function deleteProfile(profileId: string): Promise<void> {
  const profiles = await getProfiles();
  const filtered = profiles.filter((p) => p.id !== profileId);
  await saveProfiles(filtered);

  // Clean up profile data
  try {
    await AsyncStorage.removeItem(`@timesync_history_${profileId}`);
    await AsyncStorage.removeItem(`@timesync_settings_${profileId}`);
  } catch (e) {
    console.warn('Failed to clean up profile data:', e);
  }

  // If we deleted the active profile, switch to first remaining
  if (_activeProfile.id === profileId) {
    if (filtered.length > 0) {
      await setActiveProfile(filtered[0]);
    } else {
      // Re-create default
      await saveProfiles([DEFAULT_PROFILE]);
      await setActiveProfile(DEFAULT_PROFILE);
    }
  }
}

export async function renameProfile(profileId: string, name: string, emoji: string): Promise<void> {
  const profiles = await getProfiles();
  const profile = profiles.find((p) => p.id === profileId);
  if (profile) {
    profile.name = name.trim() || profile.name;
    profile.emoji = emoji || profile.emoji;
    await saveProfiles(profiles);
    if (_activeProfile.id === profileId) {
      _activeProfile = { ..._activeProfile, name: profile.name, emoji: profile.emoji };
    }
  }
}

// ─── History (profile-scoped) ────────────────────────────────────────────────

export async function saveGameRecord(
  record: Omit<GameRecord, 'id' | 'timestamp'>
): Promise<GameRecord> {
  const full: GameRecord = {
    ...record,
    id: generateId(),
    timestamp: Date.now(),
  };

  try {
    const key = historyKey();
    const raw = await AsyncStorage.getItem(key);
    const all: GameRecord[] = raw ? JSON.parse(raw) : [];
    all.unshift(full); // newest first

    // Prune per-mode if needed
    const stopwatch = all.filter((r) => r.mode === 'stopwatch');
    const beep = all.filter((r) => r.mode === 'beep');
    const pruned = [
      ...stopwatch.slice(0, MAX_RECORDS_PER_MODE),
      ...beep.slice(0, MAX_RECORDS_PER_MODE),
    ].sort((a, b) => b.timestamp - a.timestamp);

    await AsyncStorage.setItem(key, JSON.stringify(pruned));
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
    const raw = await AsyncStorage.getItem(historyKey());
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
    await AsyncStorage.removeItem(historyKey());
  } catch (e) {
    console.warn('Failed to clear history:', e);
  }
}

// ─── Settings (profile-scoped) ───────────────────────────────────────────────

export async function getSettings(): Promise<AppSettings> {
  try {
    const raw = await AsyncStorage.getItem(settingsKey());
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch (e) {
    console.warn('Failed to load settings:', e);
    return DEFAULT_SETTINGS;
  }
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  try {
    await AsyncStorage.setItem(settingsKey(), JSON.stringify(settings));
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
