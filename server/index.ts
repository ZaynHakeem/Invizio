import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import itemsRouter from './routes/items.js';

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error('Missing MONGODB_URI in environment');
  process.exit(1);
}

try {
  await mongoose.connect(MONGODB_URI);
} catch (err) {
  const message = err instanceof Error ? err.message : String(err);
  console.error('Failed to connect to MongoDB:', message);
  process.exit(1);
}

const app = express();

const allowedOrigins = [
  'http://localhost:5173',
  ...(process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim()).filter(Boolean) : []),
];
app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
      return cb(null, false);
    },
  })
);
app.use(express.json());
app.use('/api/items', itemsRouter);

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

const PORT = 3000;
app.listen(PORT);
