const mongoose = require('mongoose');

const vaultItemSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true, required: true },
    
    ciphertext: { type: String, required: true },
    iv: { type: String, required: true },
    tag: { type: String, required: true },
    
    tags: { type: [String], default: [] },
    folder: { type: String, default: '' },
   
  },
  { timestamps: true }
);

module.exports = mongoose.model('VaultItem', vaultItemSchema);


