const core = require('../game-core.js');
const db = require('./_db.js');

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'GET') return res.status(405).json({ ok: false, error: 'method' });
  const q = req.query || {};
  const today = core.istanbulDateKey();
  const date = (typeof q.date === 'string' && db.DATE_RE.test(q.date)) ? q.date : today;
  const pid = (typeof q.pid === 'string') ? q.pid.slice(0, 64) : '';
  try {
    const all = await db.loadEntries(date);
    const mine = pid ? all.findIndex((e) => e.pid === pid) : -1;
    const entries = all.slice(0, 50).map((e, i) => ({
      rank: i + 1, name: e.name, moves: e.moves, sec: e.sec, me: !!pid && e.pid === pid
    }));
    res.status(200).json({
      ok: true, date, today, total: all.length, entries,
      myRank: mine >= 0 ? mine + 1 : null,
      me: mine >= 0 ? { name: all[mine].name, moves: all[mine].moves, sec: all[mine].sec } : null
    });
  } catch (e) {
    res.status(503).json({ ok: false, error: e.message === 'db-not-configured' ? 'db-not-configured' : 'db' });
  }
};
