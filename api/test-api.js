process.env.UPSTASH_REDIS_REST_URL = 'http://fake';
process.env.UPSTASH_REDIS_REST_TOKEN = 'x';
const store = {};
global.fetch = async (url, o) => {
  const a = JSON.parse(o.body), c = a[0]; let result = null;
  if (c === 'HGET') result = (store[a[1]] || {})[a[2]] || null;
  else if (c === 'HSET') { (store[a[1]] = store[a[1]] || {})[a[2]] = a[3]; result = 1; }
  else if (c === 'HGETALL') result = Object.entries(store[a[1]] || {}).flat();
  else if (c === 'EXPIRE') result = 1;
  return { ok: true, json: async () => ({ result }) };
};
const core = require('./game-core.js');
const submit = require('./api/submit.js'), board = require('./api/leaderboard.js'), rename = require('./api/rename.js');
function call(h, req) { return new Promise(r => { const res = { h: {}, setHeader(){}, status(c){ this.c=c; return this; }, json(b){ r({ c: this.c, b }); } }; h(req, res); }); }

const date = core.istanbulDateKey();
const deal = core.dealSolvable(core.createSeededRandom(core.seedFromKey(date)));
const sol = core.Solver.solve(core.cloneCols(deal), [null,null,null,null], 4, 600000).sol;
// çözümü log'a çevir (çözücü hamleleri → log); bunun için çekirdek durumunu izle
const st = core.newState(deal); const log = [];
for (const m of sol) {
  let a;
  if (m.k === 's') a = ['s', m.i, m.to];
  else if (m.slot !== undefined) a = ['k', m.from, m.slot];
  else a = ['m', m.from, m.i, m.to];
  const e = core.applyAction(st, a); if (e) throw new Error(e); log.push(a);
}
const pid = 'a'.repeat(20), pid2 = 'b'.repeat(20);
(async () => {
  let r = await call(submit, { method:'POST', body:{ date, playerId: pid, name:' Bay<ram> ', log, sec: 200 } });
  console.log('submit', r.c, JSON.stringify(r.b));
  r = await call(submit, { method:'POST', body:{ date, playerId: pid2, name:'Ayşe', log, sec: 150 } });
  console.log('submit2', r.c, JSON.stringify(r.b));
  r = await call(submit, { method:'POST', body:{ date, playerId: pid, name:'Bayram', log, sec: 300 } });
  console.log('worse resubmit', r.c, JSON.stringify(r.b));
  // hile denemeleri
  const bad = log.slice(); bad[5] = ['m', 0, 0, 1];
  r = await call(submit, { method:'POST', body:{ date, playerId: pid, name:'x', log: bad, sec: 200 } }); console.log('tampered', r.c, r.b.error, r.b.detail);
  r = await call(submit, { method:'POST', body:{ date, playerId: pid, name:'x', log: log.slice(0,-1), sec: 200 } }); console.log('truncated', r.c, r.b.error, r.b.detail);
  r = await call(submit, { method:'POST', body:{ date, playerId: pid, name:'x', log, sec: 5 } }); console.log('too fast', r.c, r.b.error);
  r = await call(submit, { method:'POST', body:{ date:'2020-01-01', playerId: pid, name:'x', log, sec: 200 } }); console.log('old date', r.c, r.b.error);
  r = await call(submit, { method:'POST', body:{ date, playerId: 'kisa', name:'x', log, sec: 200 } }); console.log('bad pid', r.c, r.b.error);
  r = await call(rename, { method:'POST', body:{ date, playerId: pid, name:'Bayram K' } }); console.log('rename', r.c, JSON.stringify(r.b));
  r = await call(board, { method:'GET', query:{ pid } }); console.log('board', r.c, JSON.stringify(r.b));
})();
