import { runPlainScript } from '../server/runner.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ ok: false, error: 'Use POST to run PlainScript.' });
    return;
  }
  try {
    const result = await runPlainScript(req.body?.source);
    res.status(result.ok ? 200 : 400).json(result);
  } catch {
    res.status(500).json({ ok: false, error: 'The compiler service could not start.' });
  }
}
