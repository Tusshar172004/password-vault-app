const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const totpRoutes = require('./routes/totp');
const vaultRoutes = require('./routes/vault');

const app = express();

app.use(helmet());
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

app.get('/health', (req, res) => {
  res.json({ ok: true });
});

// Add this route to your server/index.js file

app.get('/', (req, res) => {
  // This is a standard way for APIs to respond to the root URL
  res.status(200).json({
      message: 'Welcome to the API! Available endpoints are at /api/auth, /api/totp, and /api/vault.',
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/totp', totpRoutes);
app.use('/api/vault', vaultRoutes);

const PORT = process.env.PORT || 4000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/password_vault';

mongoose
  .connect(MONGO_URI)
  .then(() => {
    app.listen(PORT, () => {
     
      console.log(`server listening on ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Mongo connection error:', err.message);
    process.exit(1);
  });


