const core = require('../game-core.js');
const db = require('./_db.js');

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'method' });
  let b = req.body;
  if (typeof b === 'string') { try { b = JSON.parse(b); } catch (_) { b = null; } }
  if (!b || typeof b !== 'object') return res.status(400).json({ ok: false, error: 'bad-body' });
  const name = db.cleanName(b.name);
  const today = core.istanbulDateKey();
  const date = (typeof b.date === 'string' && db.DATE_RE.test(b.date)) ? b.date : today;
  if (typeof b.playerId !== 'string' || !db.PID_RE.test(b.playerId)) return res.status(400).json({ ok: false, error: 'bad-player' });
  if (!name) return res.status(400).json({ ok: false, error: 'bad-name' });
  try {
    const old = await db.getEntry(date, b.playerId);
    if (!old) return res.status(404).json({ ok: false, error: 'no-entry' });
    old.name = name;
    await db.setEntry(date, b.playerId, old);
    res.status(200).json({ ok: true, name });
  } catch (e) {
    res.status(503).json({ ok: false, error: e.message === 'db-not-configured' ? 'db-not-configured' : 'db' });
  }
};
