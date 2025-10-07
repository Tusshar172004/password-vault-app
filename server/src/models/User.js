const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, index: true },
    passwordHash: { type: String, required: true },
    // Per-user salt for key derivation on client; we store it so client can derive consistently
    kdfSalt: { type: String, required: true },
    totp: {
      enabled: { type: Boolean, default: false },
      secret: { type: String, select: false }, // store base32 secret only if enabled; hidden by default
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);


