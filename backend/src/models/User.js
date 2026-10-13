import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { ACCOUNT_STATUS, ROLES } from '../constants/roles.js';

const creatorProfileSchema = new mongoose.Schema(
  {
    services: {
      type: [String],
      enum: ['photo', 'video'],
      default: ['photo'],
    },
    experienceYears: { type: Number, min: 0, max: 50, default: 1 },
    gear: { type: String, trim: true, maxlength: 200, default: '' },
    bio: { type: String, trim: true, maxlength: 300, default: '' },
    isOnline: { type: Boolean, default: false },
    isVerified: { type: Boolean, default: true },
    rating: { type: Number, min: 0, max: 5, default: 5 },
    upiId: { type: String, trim: true, lowercase: true, maxlength: 100, default: '' },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    phone: { type: String, required: true, trim: true },
    password: { type: String, required: true, minlength: 6, select: false },
    role: {
      type: String,
      enum: [ROLES.CLIENT, ROLES.CREATOR],
      required: true,
      index: true,
    },
    city: { type: String, trim: true, maxlength: 80, default: '' },
    creatorProfile: { type: creatorProfileSchema, default: undefined },
    accountStatus: {
      type: String,
      enum: Object.values(ACCOUNT_STATUS),
      default: ACCOUNT_STATUS.ACTIVE,
      index: true,
    },
    statusReason: { type: String, trim: true, maxlength: 300, default: '' },
    statusChangedAt: { type: Date },
    lastLoginAt: { type: Date },
  },
  { timestamps: true }
);

userSchema.pre('save', async function hashPassword() {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.comparePassword = function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.toPublicJSON = function toPublicJSON() {
  return {
    id: this._id.toString(),
    name: this.name,
    email: this.email,
    phone: this.phone,
    role: this.role,
    city: this.city,
    creatorProfile: this.role === ROLES.CREATOR ? this.creatorProfile : undefined,
    accountStatus: this.accountStatus || ACCOUNT_STATUS.ACTIVE,
    createdAt: this.createdAt,
  };
};

const User = mongoose.model('User', userSchema);

export default User;
