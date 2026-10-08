export const STATUS_META = {
  searching: {
    label: 'Finding Photographer',
    short: 'Searching',
    badge: 'bg-amber-100 text-amber-800 ring-amber-200',
    dot: 'bg-amber-500',
    progress: 15,
  },
  assigned: {
    label: 'Photographer On The Way',
    short: 'Assigned',
    badge: 'bg-indigo-100 text-indigo-800 ring-indigo-200',
    dot: 'bg-indigo-500',
    progress: 45,
  },
  arrived: {
    label: 'Photographer Arrived',
    short: 'Arrived',
    badge: 'bg-sky-100 text-sky-800 ring-sky-200',
    dot: 'bg-sky-500',
    progress: 70,
  },
  shooting: {
    label: 'Shoot In Progress',
    short: 'Shooting',
    badge: 'bg-orange-100 text-orange-800 ring-orange-200',
    dot: 'bg-orange-500',
    progress: 88,
  },
  completed: {
    label: 'Shoot Completed',
    short: 'Completed',
    badge: 'bg-emerald-100 text-emerald-800 ring-emerald-200',
    dot: 'bg-emerald-500',
    progress: 100,
  },
  cancelled: {
    label: 'Cancelled',
    short: 'Cancelled',
    badge: 'bg-slate-100 text-slate-600 ring-slate-200',
    dot: 'bg-slate-400',
    progress: 0,
  },
};

export const ACTIVE_STATUSES = ['searching', 'assigned', 'arrived', 'shooting'];

export const isActive = (status) => ACTIVE_STATUSES.includes(status);

export const CREATOR_NEXT_ACTION = {
  assigned: { label: 'Reached Venue', next: 'arrived' },
  arrived: { label: 'Start Shoot', next: 'shooting' },
  shooting: { label: 'Mark Completed', next: 'completed' },
};

export const OCCASION_EMOJI = {
  'Birthday Celebration': '🎂',
  'Instagram / Fashion Shoot': '📸',
  'Baby & Maternity': '👶',
  'Family Portrait': '👨‍👩‍👧',
  'Society / Clubhouse Event': '🏢',
  'Pre-Wedding / Couple': '💑',
  'Product / Business': '🛍️',
};
