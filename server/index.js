import express from 'express';
import fs from 'node:fs/promises';
import path from 'node:path';

const PORT = Number(process.env.PORT) || 8000;
const DATA_DIR = process.env.DATA_DIR || '/data';
const DATA_FILE = path.join(DATA_DIR, 'workspace.json');

/** Satu dokumen workspace (seluruh data aplikasi) — last-write-wins per updatedAt. */
let workspace = null;
let writeChain = Promise.resolve();

async function persist() {
  const snapshot = JSON.stringify(workspace);
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
    workspace = JSON.parse(raw);
    console.log(
      `[api] workspace dimuat: ${workspace.users?.length ?? 0} akun, ${workspace.exams?.length ?? 0} ujian`,
    );
  } catch {
    workspace = null;
    console.log('[api] belum ada workspace tersimpan — klien akan mengirim data awal');
  }
}

const app = express();
app.use(express.json({ limit: '12mb' }));

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.get('/api/workspace', (_req, res) => {
  res.json({ workspace });
});

// Simpan seluruh workspace dari klien offline; tolak versi yang lebih lama.
app.put('/api/workspace', async (req, res) => {
  const incoming = req.body;
  if (!incoming || typeof incoming !== 'object' || !Array.isArray(incoming.users)) {
    res.status(400).json({ error: 'Workspace tidak valid' });
    return;
  }
  const currentTs = Number(workspace?.updatedAt) || 0;
  const incomingTs = Number(incoming.updatedAt) || 0;
  if (incomingTs < currentTs) {
    res.json({ ok: true, applied: false, serverTime: Date.now() });
    return;
  }
  workspace = incoming;
  await persist();
  res.json({ ok: true, applied: true, serverTime: Date.now() });
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
  console.log(`[api] E-Ujian SCBT API listening on :${PORT}`);
});
