const express = require('express');
const speakeasy = require('speakeasy');
const qrcode = require('qrcode');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();


router.post('/setup', auth, async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  const secret = speakeasy.generateSecret({ name: `PasswordVault (${user.email})` });
  const otpauthUrl = secret.otpauth_url;
  const qrDataUrl = await qrcode.toDataURL(otpauthUrl);
  // Temporarily store secret until verification
  user.totp = { enabled: false, secret: secret.base32 };
  await user.save();
  res.json({ otpauthUrl, qrDataUrl });
});

router.post('/verify', auth, async (req, res) => {
  const { token } = req.body || {};
  if (!token) return res.status(400).json({ error: 'Missing token' });
  const user = await User.findById(req.user.id).select('+totp.secret');
  if (!user || !user.totp || !user.totp.secret) return res.status(400).json({ error: 'No setup in progress' });
  const ok = speakeasy.totp.verify({
    secret: user.totp.secret,
    encoding: 'base32',
    token,
    window: 1,
  });
  if (!ok) return res.status(400).json({ error: 'Invalid code' });
  user.totp.enabled = true;
  await user.save();
  res.json({ ok: true });
});


router.post('/challenge', auth, async (req, res) => {
  const { token } = req.body || {};
  const user = await User.findById(req.user.id).select('+totp.secret');
  if (!user || !user.totp || !user.totp.enabled) return res.status(400).json({ error: '2FA not enabled' });
  const ok = speakeasy.totp.verify({ secret: user.totp.secret, encoding: 'base32', token, window: 1 });
  if (!ok) return res.status(400).json({ error: 'Invalid code' });
  res.json({ ok: true });
});

module.exports = router;


