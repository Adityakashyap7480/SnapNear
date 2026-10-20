import type { AccountStatus, BookingFilter, BookingStatus, Role } from './config/constants';

export interface BookingFilterParams {
  status: BookingFilter;
  q: string;
  page: number;
  limit: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  city?: string;
  role: Role;
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
  details?: unknown;
  code?: string;
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
}

export interface Payment {
  status: 'due' | 'paid';
  method: string | null;
  via: 'app' | 'qr' | 'cash' | null;
  paidAt: string | null;
  platformFeeStatus?: 'due' | 'paid' | null;
  platformFeePaidAt?: string | null;
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
  creator: { id: string; name: string | null; phone: string | null } | null;
  startedAt: string | null;
  endsAt: string | null;
  payment: Payment | null;
  createdAt: string;
}

interface Totals {
  count: number;
  value: number;
}

export interface Overview {
  gross: number;
  creatorTotal: number;
  platformTotal: number;
  completedCount: number;
  today: { gross: number; platform: number; count: number };
  pipeline: Totals;
  byStatus: Record<BookingStatus, Totals>;
  totalBookings: number;
  users: { clients: number; creators: number; onlineCreators: number };
  last7Days: { date: string; gross: number; platform: number; count: number }[];
  liveShoots: Booking[];
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

interface AccountFields {
  accountStatus: AccountStatus;
  statusReason: string;
  statusChangedAt: string | null;
}

export interface AdminCustomer extends AccountFields {
  id: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  joinedAt: string;
  bookings: number;
  completed: number;
  active: number;
  spent: number;
  lastBookingAt: string | null;
}

export interface AdminPartner extends AccountFields {
  id: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  joinedAt: string;
  services: string[];
  experienceYears: number;
  gear: string;
  rating: number;
  ratingCount: number;
  isOnline: boolean;
  accepted: number;
  completed: number;
  active: number;
  earnings: number;
  platformFee: number;
}

export interface PendingPayout {
  creatorId: string;
  name: string;
  phone: string;
  email: string;
  city: string;
  upiId: string;
  accountStatus: AccountStatus;
  amount: number;
  count: number;
  readyAmount: number;
  readyCount: number;
  oldestPaidAt: string;
  nextEligibleAt: string;
  codes: string[];
}

export interface PayoutRecord {
  id: string;
  creatorId: string;
  name: string;
  phone: string;
  upiId: string;
  amount: number;
  bookingCount: number;
  reference: string;
  note: string;
  paidAt: string;
}

/** Partner tapped "Request Payout" in their Wallet; worked manually from the Payouts page. */
export interface PayoutRequest {
  id: string;
  creatorId: string;
  name: string;
  phone: string;
  email: string;
  upiId: string;
  amount: number;
  status: 'pending' | 'paid';
  createdAt: string;
}

export interface PayoutsData {
  holdDays: number;
  requests: PayoutRequest[];
  summary: {
    owedToPartners: number;
    owedCount: number;
    readyToPay: number;
    collected: number;
    collectedCount: number;
    platformCollected: number;
    dueFromCustomers: number;
    dueCount: number;
    paidOut: number;
    payoutCount: number;
  };
  partners: PendingPayout[];
  history: PayoutRecord[];
}

/** Payload of `admin:update` when a shoot starts (other events only trigger a refresh). */
export interface AdminUpdate {
  event?: string;
  bookingId?: string;
  code?: string;
  creatorName?: string;
  clientName?: string;
  startedAt?: string;
  endsAt?: string;
  durationMinutes?: number;
  requestId?: string;
  creatorId?: string;
  amount?: number;
}
