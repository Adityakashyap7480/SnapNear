import mongoose from 'mongoose';
import { BOOKING_STATUS, PAYMENT_STATUS, SETTLEMENT_STATUS } from '../constants/roles.js';

const personSnapshotSchema = new mongoose.Schema(
  {
    name: String,
    phone: String,
    email: String,
  },
  { _id: false }
);

const bookingSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true },

    client: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    clientSnapshot: personSnapshotSchema,

    creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    creatorSnapshot: personSnapshotSchema,

    serviceType: { type: String, enum: ['photo', 'video'], required: true },
    serviceLabel: { type: String, required: true },
    durationId: { type: String, required: true },
    durationLabel: { type: String, required: true },
    durationMinutes: { type: Number, min: 1 },
    occasion: { type: String, required: true },

    shootDate: { type: String, required: true },
    timeSlot: { type: String, required: true },
    address: { type: String, required: true, trim: true, maxlength: 250 },
    contactName: { type: String, required: true, trim: true },
    contactPhone: { type: String, required: true, trim: true },
    notes: { type: String, trim: true, maxlength: 300, default: '' },

    total: { type: Number, required: true },
    creatorPayout: { type: Number, required: true },
    platformFee: { type: Number, required: true },

    status: {
      type: String,
      enum: Object.values(BOOKING_STATUS),
      default: BOOKING_STATUS.SEARCHING,
      index: true,
    },
    declinedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

    acceptedAt: Date,
    arrivedAt: Date,
    startedAt: Date,
    endsAt: Date,
    completedAt: Date,

    // Issued when the partner reaches the venue; only the customer sees the code.
    // The partner enters it to start the shoot, which also starts the countdown.
    startOtp: {
      code: { type: String, select: false },
      attempts: Number,
      issuedAt: Date,
    },
    cancelledAt: Date,
    cancelledBy: { type: String, enum: ['client', 'superadmin'] },

    // Customer -> SnapNear (Razorpay). `orderId` backs in-app checkout, `linkId` backs the partner's QR.
    payment: {
      status: { type: String, enum: Object.values(PAYMENT_STATUS) },
      orderId: String,
      linkId: String,
      linkUrl: String,
      paymentId: String,
      method: String,
      via: { type: String, enum: ['app', 'qr'] },
      paidAt: Date,
    },

    // SnapNear -> partner (manual UPI payout after the hold period)
    settlement: {
      status: { type: String, enum: Object.values(SETTLEMENT_STATUS) },
      eligibleAt: Date,
      payout: { type: mongoose.Schema.Types.ObjectId, ref: 'Payout' },
      paidAt: Date,
    },
  },
  { timestamps: true }
);

bookingSchema.index({ status: 1, serviceType: 1, createdAt: -1 });
bookingSchema.index({ client: 1, 'payment.status': 1 });
bookingSchema.index({ creator: 1, 'settlement.status': 1 });

const Booking = mongoose.model('Booking', bookingSchema);

export default Booking;
