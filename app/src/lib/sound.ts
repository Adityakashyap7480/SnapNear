import { Vibration } from 'react-native';
import { type AudioPlayer, createAudioPlayer, setAudioModeAsync } from 'expo-audio';

export type Chime = 'ping' | 'broadcast' | 'success' | 'warning';
type Sound = Chime | 'alarm';

// Rendered from the same tones as the web chimes by scripts/generate-sounds.mjs
const SOURCES: Record<Sound, number> = {
  ping: require('../../assets/sounds/ping.wav'),
  broadcast: require('../../assets/sounds/broadcast.wav'),
  success: require('../../assets/sounds/success.wav'),
  warning: require('../../assets/sounds/warning.wav'),
  alarm: require('../../assets/sounds/alarm.wav'),
};

const players: Partial<Record<Sound, AudioPlayer>> = {};
let audioModeSet = false;

function play(sound: Sound) {
  try {
    if (!audioModeSet) {
      audioModeSet = true;
      setAudioModeAsync({ playsInSilentMode: true, interruptionMode: 'mixWithOthers' }).catch(() => {});
    }
    const player = players[sound] || (players[sound] = createAudioPlayer(SOURCES[sound]));
    player.seekTo(0).catch(() => {});
    player.play();
  } catch {
    /* audio not available */
  }
}

/** Same pattern format as navigator.vibrate: [buzz, pause, buzz, ...] in ms; 0 stops. */
export function vibrate(pattern: number | number[]) {
  if (pattern === 0) {
    Vibration.cancel();
    return;
  }
  Vibration.vibrate(Array.isArray(pattern) ? [0, ...pattern] : pattern);
}

const ALARM_REPEAT_MS = 1800;

/** Loops an alarm until the returned stop() is called. */
export function startAlarm() {
  play('alarm');
  const timer = setInterval(() => play('alarm'), ALARM_REPEAT_MS);
  return () => {
    clearInterval(timer);
    players.alarm?.pause();
  };
}

export function playChime(type: Chime = 'ping') {
  play(type);
}
