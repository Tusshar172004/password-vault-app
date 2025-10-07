const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');

const router = express.Router();

router.post('/signup', async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'Missing fields' });
  const existing = await User.findOne({ email });
  if (existing) return res.status(409).json({ error: 'Email already used' });
  const passwordHash = await bcrypt.hash(password, 12);
  const kdfSalt = crypto.randomBytes(16).toString('hex');
  const user = await User.create({ email, passwordHash, kdfSalt });
  const token = jwt.sign({ sub: user._id.toString() }, process.env.JWT_SECRET || 'dev', { expiresIn: '7d' });
  res.json({ token, kdfSalt });
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'Missing fields' });
  const user = await User.findOne({ email }).select('+totp.secret');
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
  const token = jwt.sign({ sub: user._id.toString() }, process.env.JWT_SECRET || 'dev', { expiresIn: '7d' });
  res.json({ token, kdfSalt: user.kdfSalt, totpEnabled: !!user.totp.enabled });
});

module.exports = router;


