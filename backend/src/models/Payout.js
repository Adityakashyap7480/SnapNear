import mongoose from 'mongoose';

/** A manual transfer from SnapNear to a partner covering one or more paid bookings. */
const payoutSchema = new mongoose.Schema(
  {
    creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    creatorSnapshot: {
      name: String,
      phone: String,
      upiId: String,
    },
    amount: { type: Number, required: true, min: 0 },
    bookings: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Booking' }],
    bookingCount: { type: Number, required: true },
    reference: { type: String, trim: true, maxlength: 80, default: '' },
    note: { type: String, trim: true, maxlength: 200, default: '' },
    paidAt: { type: Date, required: true },
  },
  { timestamps: true }
);

payoutSchema.index({ paidAt: -1 });

const Payout = mongoose.model('Payout', payoutSchema);

export default Payout;
