let ctx: AudioContext | null = null;

function getContext() {
  const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  ctx = ctx || new Ctor();
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  return ctx;
}

// Browsers block audio until the user interacts; warm the context on the first tap
// so sounds triggered later by socket events can play.
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

/** Short two-note chime played when a partner starts a shoot. */
export function playBroadcastChime() {
  try {
    const c = getContext();
    const now = c.currentTime;
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.connect(gain);
    gain.connect(c.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, now);
    osc.frequency.setValueAtTime(880, now + 0.12);
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
    osc.start(now);
    osc.stop(now + 0.42);
  } catch {
    /* audio not available */
  }
}
