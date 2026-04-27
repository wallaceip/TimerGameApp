/**
 * Generate a random target time in centiseconds.
 * Accepts optional min/max bounds (in centiseconds) from settings.
 * Falls back to a weighted distribution if no bounds given.
 */
export function generateTargetTime(minCs?: number, maxCs?: number): number {
  const lo = minCs ?? 5;
  const hi = maxCs ?? 1000;
  const range = hi - lo;
  return Math.floor(Math.random() * range) + lo;
}

/**
 * Generate a random beep interval in centiseconds.
 * Accepts optional min/max bounds (in centiseconds) from settings.
 */
export function generateBeepInterval(minCs?: number, maxCs?: number): number {
  const lo = minCs ?? 5;
  const hi = maxCs ?? 1000;
  const range = hi - lo;
  return Math.floor(Math.random() * range) + lo;
}

/**
 * Format centiseconds into MM:SS.CC display string
 */
export function formatTime(centiseconds: number): string {
  const totalSeconds = Math.floor(centiseconds / 100);
  const cs = Math.floor(centiseconds % 100);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(cs).padStart(2, '0')}`;
}

/**
 * Format centiseconds adaptively:
 *  - Under 60s: SS.CC  (e.g. "05.30")
 *  - 60s+:      MM:SS.CC (e.g. "01:23.45")
 */
export function formatTimeAdaptive(centiseconds: number): string {
  const totalSeconds = Math.floor(centiseconds / 100);
  const cs = Math.floor(centiseconds % 100);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes > 0) {
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(cs).padStart(2, '0')}`;
  }
  return `${String(seconds).padStart(2, '0')}.${String(cs).padStart(2, '0')}`;
}

/**
 * Format centiseconds into a short display (seconds with 2 decimal places)
 */
export function formatTimeShort(centiseconds: number): string {
  const seconds = centiseconds / 100;
  return `${seconds.toFixed(2)}s`;
}

/**
 * Parse smart numpad input into centiseconds.
 * User types digits without decimal. Last 2 digits are centiseconds.
 * e.g. "1252" → 12.52s → 1252cs, "141" → 1.41s → 141cs, "530" → 5.30s → 530cs
 *      "5" → 0.05s → 5cs, "52" → 0.52s → 52cs
 */
export function parseSmartInput(input: string): number {
  if (!input || input.length === 0) return 0;
  const num = parseInt(input, 10);
  if (isNaN(num)) return 0;
  // The raw number IS centiseconds
  return num;
}

/**
 * Calculate score rating based on difference in centiseconds
 */
export function getScoreRating(diffCs: number): {
  label: string;
  emoji: string;
  color: string;
} {
  if (diffCs <= 10) {
    return { label: 'PERFECT', emoji: '🎯', color: '#39ff14' };
  } else if (diffCs <= 30) {
    return { label: 'AMAZING', emoji: '🔥', color: '#39ff14' };
  } else if (diffCs <= 50) {
    return { label: 'GREAT', emoji: '⚡', color: '#00f0ff' };
  } else if (diffCs <= 100) {
    return { label: 'GOOD', emoji: '👍', color: '#ffe600' };
  } else if (diffCs <= 200) {
    return { label: 'OK', emoji: '😐', color: '#ff6b35' };
  } else {
    return { label: 'PRACTICE!', emoji: '💪', color: '#ff3b3b' };
  }
}
