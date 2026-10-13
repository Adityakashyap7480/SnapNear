// Phones are often a few minutes off; shoot timers use the server's clock instead.
let offsetMs = 0;

export function syncServerTime(serverTimeMs) {
  const t = Number(serverTimeMs);
  if (Number.isFinite(t) && t > 0) offsetMs = t - Date.now();
}

export const serverNow = () => Date.now() + offsetMs;
