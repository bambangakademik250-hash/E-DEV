import express from 'express';
import fs from 'node:fs/promises';
import path from 'node:path';
import { seedState } from './seed.js';

const PORT = Number(process.env.PORT) || 8000;
const DATA_DIR = process.env.DATA_DIR || '/data';
const DATA_FILE = path.join(DATA_DIR, 'db.json');

let state = { peserta: [], ujian: [] };
let writeChain = Promise.resolve();

async function persist() {
  const snapshot = JSON.stringify(state, null, 2);
  writeChain = writeChain.then(async () => {
    await fs.mkdir(DATA_DIR, { recursive: true });
    const tmp = `${DATA_FILE}.tmp`;
    await fs.writeFile(tmp, snapshot, 'utf8');
    await fs.rename(tmp, DATA_FILE);
  });
  return writeChain;
}

async function load() {
  try {
    const raw = await fs.readFile(DATA_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    state = {
      peserta: Array.isArray(parsed.peserta) ? parsed.peserta : [],
      ujian: Array.isArray(parsed.ujian) ? parsed.ujian : [],
    };
    console.log(`[api] memuat ${state.peserta.length} peserta, ${state.ujian.length} ujian`);
  } catch {
    state = seedState();
    await persist();
    console.log('[api] data awal dibuat (seed)');
  }
}

const app = express();
app.use(express.json({ limit: '2mb' }));

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.get('/api/state', (_req, res) => {
  res.json(state);
});

// Terima perubahan offline (upsert/delete) dari klien, idempoten per id.
app.post('/api/sync', async (req, res) => {
  const ops = Array.isArray(req.body?.ops) ? req.body.ops : [];
  let applied = 0;

  for (const op of ops) {
    if (!op || (op.entity !== 'peserta' && op.entity !== 'ujian')) continue;
    if (typeof op.id !== 'string') continue;
    const list = state[op.entity];
    const index = list.findIndex((row) => row.id === op.id);

    if (op.type === 'delete') {
      if (index >= 0) {
        list.splice(index, 1);
        applied += 1;
      }
      continue;
    }

    if (op.type === 'upsert' && op.data && op.data.id === op.id) {
      if (index >= 0) {
        const currentTs = Number(list[index].updatedAt) || 0;
        const incomingTs = Number(op.data.updatedAt) || 0;
        if (incomingTs >= currentTs) {
          list[index] = op.data;
          applied += 1;
        }
      } else {
        list.push(op.data);
        applied += 1;
      }
    }
  }

  if (applied > 0) await persist();
  res.json({ ok: true, applied, serverTime: Date.now() });
});

app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.use((error, _req, res, _next) => {
  console.error('[api] error', error);
  res.status(500).json({ error: 'Internal server error' });
});

await load();
app.listen(PORT, '0.0.0.0', () => {
  console.log(`[api] E-Ujian CBT API listening on :${PORT}`);
});
