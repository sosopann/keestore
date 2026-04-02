const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  walletBalance: { type: Number, default: 0 },
  referralCode: { type: String, unique: true },
  referredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  
  // Security Fields
  isEmailVerified: { type: Boolean, default: false },
  emailVerificationCode: { type: String },
  resetPasswordToken: { type: String },
  resetPasswordExpire: { type: Date },
  
  // 2FA Fields
  twoFactorEnabled: { type: Boolean, default: false },
  twoFactorCode: { type: String },
  twoFactorExpire: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
