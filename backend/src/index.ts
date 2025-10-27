import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
const port = process.env.PORT || 3000;

// public directory is ../public from compiled code location
const publicDir = path.resolve(__dirname, '..', 'public');

app.use(express.static(publicDir));

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// SPA fallback: send index.html
app.get('*', (_req, res) => {
  res.sendFile(path.join(publicDir, 'index.html'));
});

app.listen(port, () => {
  console.log(`Server listening on ${port}, serving ${publicDir}`);
});
