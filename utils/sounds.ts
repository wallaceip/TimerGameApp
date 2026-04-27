import { useAudioPlayer } from 'expo-audio';
import { Platform } from 'react-native';

/**
 * Generate a short beep WAV as a base64 data URI.
 * This avoids needing an external sound file asset.
 */
function generateBeepWav(frequency: number = 880, duration: number = 0.15): string {
  const sampleRate = 44100;
  const volume = 0.5;
  const numSamples = Math.floor(sampleRate * duration);

  const header = new ArrayBuffer(44 + numSamples * 2);
  const view = new DataView(header);

  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + numSamples * 2, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(36, 'data');
  view.setUint32(40, numSamples * 2, true);

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    let envelope = 1;
    const fadeLen = 0.01;
    if (t < fadeLen) envelope = t / fadeLen;
    else if (t > duration - fadeLen) envelope = (duration - t) / fadeLen;

    const sample = Math.sin(2 * Math.PI * frequency * t) * volume * envelope;
    const intSample = Math.max(-32768, Math.min(32767, Math.floor(sample * 32767)));
    view.setInt16(44 + i * 2, intSample, true);
  }

  const bytes = new Uint8Array(header);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }

  if (typeof btoa === 'function') {
    return 'data:audio/wav;base64,' + btoa(binary);
  }

  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let result = '';
  for (let i = 0; i < binary.length; i += 3) {
    const a = binary.charCodeAt(i);
    const b = i + 1 < binary.length ? binary.charCodeAt(i + 1) : 0;
    const c = i + 2 < binary.length ? binary.charCodeAt(i + 2) : 0;
    result += chars[a >> 2];
    result += chars[((a & 3) << 4) | (b >> 4)];
    result += i + 1 < binary.length ? chars[((b & 15) << 2) | (c >> 6)] : '=';
    result += i + 2 < binary.length ? chars[c & 63] : '=';
  }
  return 'data:audio/wav;base64,' + result;
}

let cachedBeepUri: string | null = null;

export function getBeepUri(): string {
  if (!cachedBeepUri) {
    cachedBeepUri = generateBeepWav();
  }
  return cachedBeepUri;
}

/**
 * Play a beep using the Web Audio API on web, or expo-audio on native.
 * This is a standalone function that doesn't need React hooks.
 */
export async function playBeep(): Promise<void> {
  try {
    if (Platform.OS === 'web' && typeof AudioContext !== 'undefined') {
      // Use Web Audio API directly for web — more reliable
      const ctx = new AudioContext();
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(880, ctx.currentTime);
      gainNode.gain.setValueAtTime(0.5, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.15);

      return new Promise((resolve) => {
        setTimeout(resolve, 160);
      });
    }

    // For native, use expo-audio's createAudioPlayer
    const { createAudioPlayer } = await import('expo-audio');
    const player = createAudioPlayer({ uri: getBeepUri() });
    player.play();

    return new Promise((resolve) => {
      setTimeout(() => {
        try {
          player.remove();
        } catch (e) {
          // ignore cleanup errors
        }
        resolve();
      }, 300);
    });
  } catch (e) {
    console.warn('Failed to play beep:', e);
  }
}
