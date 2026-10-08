import mongoose from 'mongoose';
import { BOOKING_STATUS } from '../constants/roles.js';

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
    completedAt: Date,
    cancelledAt: Date,
    cancelledBy: { type: String, enum: ['client', 'superadmin'] },
  },
  { timestamps: true }
);

bookingSchema.index({ status: 1, serviceType: 1, createdAt: -1 });

const Booking = mongoose.model('Booking', bookingSchema);

export default Booking;
