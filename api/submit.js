const core = require('../game-core.js');
const db = require('./_db.js');

const dealCache = new Map(); // tarih -> dağıtım (aynı sıcak örnek içinde tekrar hesaplamamak için)
function getDeal(date) {
  if (!dealCache.has(date)) {
    if (dealCache.size > 5) dealCache.clear();
    dealCache.set(date, core.dealSolvable(core.createSeededRandom(core.seedFromKey(date))));
  }
  return dealCache.get(date);
}

function parseBody(req) {
  let b = req.body;
  if (typeof b === 'string') { try { b = JSON.parse(b); } catch (_) { b = null; } }
  return b && typeof b === 'object' ? b : null;
}

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'method' });
  const b = parseBody(req);
  if (!b) return res.status(400).json({ ok: false, error: 'bad-body' });

  const date = b.date, pid = b.playerId;
  const name = db.cleanName(b.name);
  const log = b.log;
  const sec = Math.floor(Number(b.sec));

  const today = core.istanbulDateKey();
  const yesterday = core.istanbulDateKey(new Date(Date.now() - 86400000));
  if (typeof date !== 'string' || !db.DATE_RE.test(date) || (date !== today && date !== yesterday)) {
    return res.status(400).json({ ok: false, error: 'bad-date' });
  }
  if (typeof pid !== 'string' || !db.PID_RE.test(pid)) return res.status(400).json({ ok: false, error: 'bad-player' });
  if (!name) return res.status(400).json({ ok: false, error: 'bad-name' });
  if (!Number.isFinite(sec) || sec < 0 || sec > 86400) return res.status(400).json({ ok: false, error: 'bad-time' });
  if (!Array.isArray(log) || log.length < 1 || log.length > core.MAX_LOG) return res.status(400).json({ ok: false, error: 'invalid-log' });

  // Hamle kaydını sunucuda, o günün dağıtımı üzerinde baştan oynatıp doğrula
  const r = core.replay(getDeal(date), log);
  if (!r.ok) return res.status(422).json({ ok: false, error: 'invalid-log', detail: r.err, step: r.step });

  // Süre makullüğü: elle yapılan eylemler en az ~0.25 sn, "Topla" adımları ~0.08 sn sürer
  const st = core.logStats(log);
  if (sec < Math.floor(st.manual * 0.25 + st.auto * 0.08)) return res.status(422).json({ ok: false, error: 'too-fast' });

  try {
    const old = await db.getEntry(date, pid);
    const better = !old || r.moves < old.moves || (r.moves === old.moves && sec < old.sec);
    let best;
    if (better) {
      best = { name, moves: r.moves, sec, ts: Date.now() };
      await db.setEntry(date, pid, best);
    } else {
      best = Object.assign({}, old, { name }); // sonuç eskisi kalır, isim güncellenir
      if (name !== old.name) await db.setEntry(date, pid, best);
    }
    const all = await db.loadEntries(date);
    const idx = all.findIndex((e) => e.pid === pid);
    res.status(200).json({
      ok: true, date, improved: !!better, rank: idx + 1, total: all.length,
      moves: r.moves, sec, best: { moves: best.moves, sec: best.sec }
    });
  } catch (e) {
    res.status(503).json({ ok: false, error: e.message === 'db-not-configured' ? 'db-not-configured' : 'db' });
  }
};
