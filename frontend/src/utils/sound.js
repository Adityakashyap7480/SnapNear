let ctx = null;

function getContext() {
  ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  return ctx;
}

// Browsers block audio until the user interacts; warm the context on the first tap
// so sounds triggered later by socket events (e.g. "payment received") can play.
if (typeof window !== 'undefined') {
  const unlock = () => {
    try {
      getContext();
    } catch {
      /* audio not available */
    }
  };
  window.addEventListener('pointerdown', unlock, { once: true });
  window.addEventListener('keydown', unlock, { once: true });
}

function tone(c, { freq, start, duration, type = 'sine', volume = 0.2 }) {
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.connect(gain);
  gain.connect(c.destination);
  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(volume, start + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  osc.start(start);
  osc.stop(start + duration + 0.02);
}

/** Small Web Audio chimes so alerts work without external audio files. */
export function playChime(type = 'ping') {
  try {
    const c = getContext();
    const now = c.currentTime;

    if (type === 'success') {
      // Rising "ta-da" arpeggio followed by a coin sparkle
      [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) =>
        tone(c, { freq, start: now + i * 0.1, duration: 0.4, type: 'triangle', volume: 0.22 })
      );
      tone(c, { freq: 1046.5, start: now + 0.4, duration: 0.7, type: 'sine', volume: 0.16 });
      tone(c, { freq: 1567.98, start: now + 0.48, duration: 0.5, type: 'sine', volume: 0.1 });
      tone(c, { freq: 2093, start: now + 0.58, duration: 0.6, type: 'sine', volume: 0.08 });
      return;
    }

    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.connect(gain);
    gain.connect(c.destination);

    if (type === 'broadcast') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, now);
      osc.frequency.setValueAtTime(880, now + 0.12);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
      osc.start(now);
      osc.stop(now + 0.42);
    } else {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(523.25, now);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
      osc.start(now);
      osc.stop(now + 0.22);
    }
  } catch {
    /* audio not available */
  }
}
