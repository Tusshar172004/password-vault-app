Password Generator + Secure Vault (MVP)

Tech stack

- Frontend: React (Vite, Javascript)
- Backend: Node.js (Express)
- Database: MongoDB (Mongoose)

Quick start

1) Server

- cd server
- Copy `.env.example` to `.env` and set values
  - PORT=4000
  - MONGO_URI=mongodb://localhost:27017/password_vault
  - JWT_SECRET=use your secret value
- npm run dev

2) Client

- cd client
- npm run dev
- Open the printed URL (usually `http://localhost:5173`)

Features

- Password generator with options and exclude look-alikes
- Simple auth (email + password)
- Client-side encryption for vault items (no plaintext sent or stored on server)
- Copy to clipboard with auto-clear (~15s)
- Basic search/filter
- Tags/folders and filtering
- Dark mode (toggle + persistence)
- Export/import encrypted file

Crypto

- Derivation: PBKDF2-SHA256 (WebCrypto), 310k iterations, per-user salt
- Encryption: AES-GCM 256-bit using WebCrypto
- Why: WebCrypto is built-in, audited, constant-time primitives; AES-GCM provides confidentiality + integrity; PBKDF2 with high iterations and per-user salt resists brute-force

Notes

- Only `ciphertext`, `iv`, `tag` (and optional tags/folder metadata) are stored server-side. The server never sees vault plaintext or keys.
- Do not log secrets.

