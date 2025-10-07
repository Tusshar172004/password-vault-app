const express = require('express');
const VaultItem = require('../models/VaultItem');
const auth = require('../middleware/auth');

const router = express.Router();


router.post('/', auth, async (req, res) => {
  const { ciphertext, iv, tag, tags = [], folder = '' } = req.body || {};
  if (!ciphertext || !iv || !tag) return res.status(400).json({ error: 'Missing fields' });
  const item = await VaultItem.create({ userId: req.user.id, ciphertext, iv, tag, tags, folder });
  res.json({ id: item._id });
});


router.get('/', auth, async (req, res) => {
  const items = await VaultItem.find({ userId: req.user.id }).sort({ updatedAt: -1 });
  res.json(items.map(({ _id, ciphertext, iv, tag, tags, folder, createdAt, updatedAt }) => ({
    id: _id, ciphertext, iv, tag, tags, folder, createdAt, updatedAt,
  })));
});


router.put('/:id', auth, async (req, res) => {
  const { id } = req.params;
  const { ciphertext, iv, tag, tags, folder } = req.body || {};
  const update = {};
  if (ciphertext) update.ciphertext = ciphertext;
  if (iv) update.iv = iv;
  if (tag) update.tag = tag;
  if (Array.isArray(tags)) update.tags = tags;
  if (typeof folder === 'string') update.folder = folder;
  const item = await VaultItem.findOneAndUpdate({ _id: id, userId: req.user.id }, update, { new: true });
  if (!item) return res.status(404).json({ error: 'Not found' });
  res.json({ ok: true });
});


router.delete('/:id', auth, async (req, res) => {
  const { id } = req.params;
  const r = await VaultItem.deleteOne({ _id: id, userId: req.user.id });
  if (!r.deletedCount) return res.status(404).json({ error: 'Not found' });
  res.json({ ok: true });
});

module.exports = router;


