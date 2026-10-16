import type { AccountStatus, BookingStatus, Role } from './config/constants';

export interface CreatorProfile {
  services: string[];
  experienceYears: number;
  gear: string;
  bio?: string;
  rating: number;
  isOnline: boolean;
  isVerified?: boolean;
  upiId?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  city?: string;
  /** Reverse-geocoded current location (partners). Read-only in the app. */
  address?: string;
  latitude?: number | null;
  longitude?: number | null;
  locationUpdatedAt?: string | null;
  role: Role;
  creatorProfile?: CreatorProfile;
  needsPartnerTerms?: boolean;
  needsPartnerLocation?: boolean;
  accountStatus?: AccountStatus;
}

export interface Session {
  token: string;
  user: User;
}

export interface AccountInfo {
  status: AccountStatus;
  reason?: string;
  supportEmail?: string;
}

export interface ApiFailure {
  status?: number;
  message: string;
  code?: string;
  email?: string;
  name?: string;
  details?: { field: string; message: string }[];
  account?: AccountInfo;
}

export interface AccountNoticeInfo {
  code?: string;
  message: string;
  account?: AccountInfo;
  email?: string;
}

export interface PricingTier {
  id: string;
  label: string;
  subtitle: string;
  total: number;
  creatorPayout: number;
  platformFee: number;
  durationMinutes: number;
}

export interface Catalog {
  creatorShare: number;
  platformShare: number;
  serviceTypes: { id: string; label: string }[];
  tiers: Record<string, PricingTier[]>;
  occasions: string[];
  timeSlots: string[];
  startOtpLength?: number;
  payoutHoldDays?: number;
  supportEmail?: string;
  matchRadiusKm?: number;
}

export interface Payment {
  status: 'due' | 'paid';
  method: string | null;
  via: 'app' | 'qr' | null;
  paidAt: string | null;
}

export interface Booking {
  id: string;
  code: string;
  status: BookingStatus;
  serviceType: string;
  serviceLabel: string;
  durationId: string;
  durationLabel: string;
  durationMinutes: number | null;
  occasion: string;
  shootDate: string;
  timeSlot: string;
  address: string;
  notes: string;
  total: number;
  creatorPayout: number;
  platformFee: number;
  client: { id: string; name: string; phone: string | null; accountName: string; email: string | null };
  creator: {
    id: string;
    name: string | null;
    phone: string | null;
    email?: string | null;
    experienceYears?: number;
    gear?: string;
    rating?: number;
  } | null;
  acceptedAt: string | null;
  startedAt: string | null;
  endsAt: string | null;
  startOtp?: string | null;
  completedAt: string | null;
  payment: Payment | null;
  createdAt: string;
}

export interface BookingForm {
  serviceType: string;
  durationId: string;
  occasion: string;
  shootDate: string;
  timeSlot: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  contactName: string;
  contactPhone: string;
  notes: string;
}

export interface RazorpayCheckout {
  keyId: string;
  orderId: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  prefill?: Record<string, string>;
  notes?: Record<string, string>;
}

export interface RazorpayResult {
  orderId: string;
  paymentId: string;
  signature: string;
}

export interface WalletPayout {
  id: string;
  amount: number;
  bookingCount: number;
  reference: string;
  paidAt: string;
}

export interface Wallet {
  balance: number;
  balanceCount: number;
  readyToPay: number;
  awaitingCustomer: number;
  awaitingCount: number;
  withdrawn: number;
  nextPayoutAt: string | null;
  holdDays: number;
  upiId: string;
  payouts: WalletPayout[];
}

export interface CreatorStats {
  completed: number;
  todayEarnings: number;
  todayCompleted: number;
  lifetimeEarnings: number;
  platformFeePaid: number;
}

export interface CreatorDashboard {
  profile: User & { creatorProfile: CreatorProfile };
  requests: Booking[];
  activeJob: Booking | null;
  awaitingPayment: Booking[];
  history: Booking[];
  stats: CreatorStats;
  wallet: Wallet;
}

export interface FeedUpdate {
  event: string;
  bookingId: string;
  occasion?: string;
  creatorPayout?: number;
}

export interface BookingUpdate {
  event: string;
  bookingId: string;
  code?: string;
}

export interface WalletPayoutEvent {
  amount: number;
  bookingCount: number;
}
