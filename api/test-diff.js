const core = require('./game-core.js');
const PER = 12, NS = 4;

let cols, slots, sel, moves, hist, maxSlots, gameOver, actionLog;
function snap() { hist.push(JSON.stringify({ cols, slots, maxSlots, moves })); }
function flip(c) {
  var l = cols[c]; if (!l.length) return;
  var t = l[l.length - 1];
  if (!t.up) {
    t.up = true;
    if (l.length - 1 === PER - 11 && maxSlots < NS + 1) { maxSlots = NS + 1; slots.push(null); }
  }
}
function pick(c, i) {
  var l = cols[c];
  if (!l[i] || !l[i].up) return null;
  for (var k = i; k < l.length; k++) if (l[k].s !== l[i].s) return null;
  return { kind: "col", c: c, i: i };
}
function selTiles() {
  if (!sel) return [];
  if (sel.kind === "slot") return [{ s: slots[sel.i], up: true }];
  return cols[sel.c].slice(sel.i);
}
function takeSel() {
  if (sel.kind === "slot") slots[sel.i] = null;
  else { cols[sel.c].length = sel.i; flip(sel.c); }
}
function logMove(c) {
  if (sel.kind === 'slot') actionLog.push(['s', sel.i, c]);
  else actionLog.push(['m', sel.c, sel.i, c]);
}
function logSlotMove(i) {
  if (sel.kind === 'slot') actionLog.push(['z', sel.i, i]);
  else actionLog.push(['k', sel.c, i]);
}
function won() {
  if (slots.some(function (x) { return x !== null })) return false;
  var n = 0;
  for (var c = 0; c < cols.length; c++) {
    var l = cols[c]; if (!l.length) continue; n++;
    if (l.length !== PER) return false;
    for (var k = 0; k < l.length; k++) if (!l[k].up || l[k].s !== l[0].s) return false;
  }
  return n === 9;
}
function tapCol(c, i) {
  if (gameOver) return;
  if (sel) {
    if (sel.kind === "col" && sel.c === c) { sel = null; return; }
    var t = selTiles(), d = cols[c], top = d[d.length - 1];
    if (!d.length || (top.up && top.s === t[0].s && d.length + t.length <= PER)) {
      logMove(c);
      snap();
      takeSel();
      t.forEach(function (x) { d.push({ s: x.s, up: true }) });
      moves++; sel = null;
      if (won()) gameOver = true;
      return;
    }
    var p = pick(c, i);
    if (p) sel = p;
    return;
  }
  var p = pick(c, i);
  if (p) sel = p;
}
function tapSlot(i) {
  if (gameOver) return;
  if (sel) {
    if (sel.kind === "slot" && sel.i === i) { sel = null; return; }
    if (slots[i] === null && selTiles().length === 1) {
      var s = selTiles()[0].s;
      logSlotMove(i);
      snap();
      takeSel();
      slots[i] = s; moves++; sel = null;
      if (won()) gameOver = true;
      return;
    }
    if (slots[i] !== null) { sel = { kind: "slot", i: i }; }
    return;
  }
  if (slots[i] !== null) sel = { kind: "slot", i: i };
}
function undo() {
  if (!hist.length || gameOver) return;
  var o = JSON.parse(hist.pop());
  cols = o.cols; slots = o.slots; maxSlots = o.maxSlots;
  moves = moves + 1; sel = null;
  actionLog.push(['u']);
}
/* "Topla" (sürekli bütün kartlar açıkken) — senkron kopya, düzeltilmiş 3. adım */
function autoFinishStep() {
  for (var sIdx = 0; sIdx < slots.length; sIdx++) {
    if (slots[sIdx] !== null) {
      var sp = slots[sIdx];
      for (var c = 0; c < cols.length; c++) {
        var col = cols[c];
        if (col.length > 0 && col[col.length - 1].s === sp && col.length < PER) {
          actionLog.push(['S', sIdx, c]);
          sel = { kind: 'slot', i: sIdx }; takeSel();
          col.push({ s: sp, up: true }); moves++; return true;
        }
      }
    }
  }
  for (var c1 = 0; c1 < cols.length; c1++) {
    var col1 = cols[c1]; if (!col1.length) continue;
    if (col1.length === PER && col1.every(function (t) { return t.s === col1[0].s; })) continue;
    for (var i = col1.length - 1; i >= 0; i--) {
      var p = pick(c1, i); if (!p) break;
      var stack = col1.slice(i);
      for (var c2 = 0; c2 < cols.length; c2++) {
        if (c1 === c2) continue;
        var col2 = cols[c2];
        if (col2.length > 0 && col2[col2.length - 1].s === stack[0].s && col2.length + stack.length <= PER) {
          actionLog.push(['M', c1, p.i, c2]);
          sel = p; takeSel();
          stack.forEach(function (card) { col2.push(card); });
          moves++; return true;
        }
      }
    }
  }
  var emptyCol = cols.findIndex(function (col) { return col.length === 0; });
  if (emptyCol !== -1) {
    for (var c1 = 0; c1 < cols.length; c1++) {
      var col1 = cols[c1];
      if (col1.length > 0 && col1.length < PER) {
        var isPure = col1.every(function (t) { return t.s === col1[0].s; });
        if (!isPure) {
          var p = pick(c1, col1.length - 1);
          if (p) {
            var movedSp = cols[c1][p.i].s;
            actionLog.push(['M', c1, p.i, emptyCol]);
            sel = p; takeSel();
            cols[emptyCol].push({ s: movedSp, up: true }); moves++; return true;
          }
        }
      }
    }
  }
  return false;
}

function same(cst) {
  return JSON.stringify(cst.cols) === JSON.stringify(cols) &&
    JSON.stringify(cst.slots) === JSON.stringify(slots) &&
    cst.maxSlots === maxSlots && cst.moves === moves;
}

function randGame(seed) {
  const rnd = core.createSeededRandom(seed);
  const deal = core.dealSolvable(rnd);
  cols = core.cloneCols(deal); slots = [null, null, null, null]; maxSlots = NS;
  sel = null; moves = 0; hist = []; gameOver = false; actionLog = [];
  const cst = core.newState(deal);
  let applied = 0, unlocked = false, undos = 0;
  for (let step = 0; step < 700; step++) {
    if (rnd() < 0.05 && hist.length) { undo(); }
    else {
      // rastgele jest dene; ilk başarılı olan geçerli
      let before = moves, tries = 0;
      while (moves === before && tries < 80) {
        tries++;
        sel = null;
        const srcKind = rnd();
        if (srcKind < 0.8) {
          const c = Math.floor(rnd() * 10);
          const i = Math.floor(rnd() * 12);
          tapCol(c, i);
        } else {
          tapSlot(Math.floor(rnd() * slots.length));
        }
        if (!sel) continue;
        if (rnd() < 0.75) tapCol(Math.floor(rnd() * 10), -1);
        else tapSlot(Math.floor(rnd() * slots.length));
        if (sel && moves === before) { /* geçersizdi */ }
      }
      sel = null;
    }
    for (; applied < actionLog.length; applied++) {
      const e = core.applyAction(cst, actionLog[applied]);
      if (e) throw new Error('core rejected ' + JSON.stringify(actionLog[applied]) + ' ' + e + ' seed ' + seed + ' step ' + step);
    }
    if (!same(cst)) throw new Error('state mismatch seed ' + seed + ' step ' + step + ' last=' + JSON.stringify(actionLog[actionLog.length - 1]));
    if (maxSlots > NS) unlocked = true;
    if (gameOver) break;
  }
  return { n: actionLog.length, unlocked, moves, won: gameOver };
}

let totalActions = 0, unlockedGames = 0;
for (let s = 1; s <= 150; s++) {
  const r = randGame(s);
  totalActions += r.n; if (r.unlocked) unlockedGames++;
}
console.log('random differential OK: actions=', totalActions, 'games with 5th slot unlock=', unlockedGames);

/* Çözücü ile tam oyun: gerçek istemci jestleriyle kazan, sonra log'u çekirdekle doğrula */
function playSolution(dealSeed, withAutoFinish) {
  const rnd = core.createSeededRandom(dealSeed);
  const deal = core.dealSolvable(rnd);
  cols = core.cloneCols(deal); slots = [null, null, null, null]; maxSlots = NS;
  sel = null; moves = 0; hist = []; gameOver = false; actionLog = [];
  const r = core.Solver.solve(core.cloneCols(deal), [null, null, null, null], NS, 600000);
  if (!r.sol) return null;
  // çözüm hamlelerini istemci jestleriyle uygula; çözücü "Topla" yapmaz
  let usedUndo = false;
  for (let idx = 0; idx < r.sol.length; idx++) {
    const m = r.sol[idx];
    // ara sıra gereksiz hamle + geri al deneyelim (undo mantığı için)
    if (idx === 10 && !usedUndo) {
      const before = moves;
      for (let c = 0; c < 10 && moves === before; c++) { sel = null; tapCol(c, cols[c].length - 1); if (sel) { tapSlot(slots.indexOf(null)); } }
      sel = null; if (moves !== before) undo(); usedUndo = true;
    }
    sel = null;
    if (m.k === 's') { tapSlot(m.i); tapCol(m.to, -1); }
    else if (m.slot !== undefined) { tapCol(m.from, m.i); tapSlot(m.slot); }
    else { tapCol(m.from, m.i); tapCol(m.to, -1); }
    if (gameOver) break;
  }
  return { deal, ok: gameOver, log: actionLog.slice(), moves, solLen: r.sol.length };
}
for (const seed of [20261120, 20261121, 7, 99]) {
  const t0 = Date.now();
  const g = playSolution(seed);
  if (!g) { console.log('seed', seed, 'solver gave up'); continue; }
  const rep = core.replay(g.deal, g.log);
  console.log('seed', seed, 'client won:', g.ok, 'client moves:', g.moves, 'replay:', JSON.stringify(rep), 'ms', Date.now() - t0);
  if (!g.ok || !rep.ok || rep.moves !== g.moves) { console.log('FAIL'); process.exit(1); }
}

/* "Topla" testi: rastgele oyunda tüm kartlar açılınca autoFinishStep ile bitir */
{
  let tested = 0, finished = 0;
  for (let seed = 500; seed < 560; seed++) {
    const g = playSolution(seed);
    if (!g) continue;
    // çözümün bitişinden önceki bir anı yeniden kurmak yerine: çözümü yarıda kes, kalan için Topla uygula
    const rnd = core.createSeededRandom(seed);
    const deal = core.dealSolvable(rnd);
    cols = core.cloneCols(deal); slots = [null, null, null, null]; maxSlots = NS;
    sel = null; moves = 0; hist = []; gameOver = false; actionLog = [];
    const r = core.Solver.solve(core.cloneCols(deal), [null, null, null, null], NS, 600000);
    let allUp = false;
    for (let idx = 0; idx < r.sol.length && !allUp; idx++) {
      const m = r.sol[idx]; sel = null;
      if (m.k === 's') { tapSlot(m.i); tapCol(m.to, -1); }
      else if (m.slot !== undefined) { tapCol(m.from, m.i); tapSlot(m.slot); }
      else { tapCol(m.from, m.i); tapCol(m.to, -1); }
      allUp = cols.every(c => c.every(t => t.up));
    }
    if (!allUp || gameOver) continue;
    actionLog.push(['a']); snap();
    let guard = 0;
    while (!won() && guard++ < 500 && autoFinishStep());
    tested++;
    if (won()) {
      gameOver = true; finished++;
      const rep = core.replay(deal, actionLog);
      if (!rep.ok || rep.moves !== moves) { console.log('AUTO FAIL seed', seed, JSON.stringify(rep), moves); process.exit(1); }
    }
  }
  console.log('autofinish tested:', tested, 'finished+verified:', finished);
}
