import express from 'express';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runPlainScript } from './runner.js';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const root = join(__dirname, '..');
const app = express();
const port = Number(process.env.PORT || 3000);

app.use(express.json({ limit: '32kb' }));
app.post('/api/run', async (req, res) => {
  try {
    const result = await runPlainScript(req.body?.source);
    res.status(result.ok ? 200 : 400).json(result);
  } catch (error) {
    res.status(500).json({ ok: false, error: 'The compiler service could not start.' });
  }
});
app.get('/api/health', (_req, res) => res.json({ ok: true, service: 'learnplainscript' }));

const dist = join(root, 'dist');
if (existsSync(dist)) app.use(express.static(dist, { index: false }));
app.use((_req, res) => {
  const index = join(dist, 'index.html');
  if (existsSync(index)) res.sendFile(index);
  else res.status(503).send('Build the application before starting the production server.');
});

app.listen(port, '0.0.0.0', () => {
  console.log(`LearnPlainScript listening on ${port}`);
});
