/**
 * Single place to edit Step-2 session duration (hours) and prices.
 * Catalog API, booking quotes, and env defaults all read from here.
 *
 * Change a number here → it applies everywhere after backend restart/redeploy.
 */
export const SESSION_PACKAGES = [
  {
    id: '1hr',
    hours: 1,
    minutes: 60,
    label: '1 Hour',
    photo: { price: 499, subtitle: 'Quick Solo / Insta' },
    video: { price: 999, subtitle: 'Reels & High-Def Video' },
  },
  {
    id: '2hr',
    hours: 2,
    minutes: 120,
    label: '2 Hours',
    photo: { price: 900, subtitle: 'Birthdays / Family' },
    video: { price: 1500, subtitle: 'Cinematic Coverage' },
  },
  {
    id: '4hr',
    hours: 4,
    minutes: 240,
    label: '4 Hours',
    photo: { price: 1600, subtitle: 'Half Day Party' },
    video: { price: 2500, subtitle: 'Half Day Cinema' },
  },
  {
    id: '1day',
    hours: 8,
    minutes: 480,
    label: '1 Day',
    photo: { price: 3000, subtitle: 'Full Day Coverage (8 hrs)' },
    video: { price: 5000, subtitle: 'Full Day Cinematography (8 hrs)' },
  },
] as const;

export type SessionPackageId = (typeof SESSION_PACKAGES)[number]['id'];

/** Default INR prices used when PRICE_* env vars are not set. */
export const DEFAULT_SESSION_PRICES = {
  photo: Object.fromEntries(SESSION_PACKAGES.map((p) => [p.id, p.photo.price])) as Record<
    SessionPackageId,
    number
  >,
  video: Object.fromEntries(SESSION_PACKAGES.map((p) => [p.id, p.video.price])) as Record<
    SessionPackageId,
    number
  >,
};

/** Shoot length in minutes per package id. */
export const DEFAULT_DURATION_MINUTES = Object.fromEntries(
  SESSION_PACKAGES.map((p) => [p.id, p.minutes])
) as Record<SessionPackageId, number>;
