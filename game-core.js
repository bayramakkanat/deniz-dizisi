/* ==============================================================
   Deniz Dizisi - ORTAK OYUN ÇEKİRDEĞİ
   Hem tarayıcı (index.html) hem sunucu (api/*.js) tarafından kullanılır.
   Günün Oyunu dağıtımı, çözücü, kurallar ve hamle kaydının
   (log) yeniden oynatılarak doğrulanması burada.
   ÖNEMLİ: Bu dosyadaki dağıtım/kural mantığı değişirse eski
   günlerin kayıtları doğrulanamaz; dikkatli değiştirin.
   ============================================================== */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) { module.exports = factory(); }
  else { root.DenizCore = factory(); }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var PER = 12, NC = 10, NS = 4, SPECIES = 9;
  var MAX_LOG = 3000;

  /* ---------- Tarih / tohum (Türkiye saati: UTC+3 sabit) ---------- */
  function istanbulDateKey(d) {
    var ms = (d ? d.getTime() : Date.now()) + 3 * 3600 * 1000;
    return new Date(ms).toISOString().slice(0, 10); // YYYY-MM-DD
  }
  function seedFromKey(key) {
    var p = String(key).split('-');
    return (+p[0]) * 10000 + (+p[1]) * 100 + (+p[2]);
  }
  function createSeededRandom(seed) {
    var s = seed >>> 0;
    return function () {
      s += 0x6D2B79F5;
      var t = Math.imul(s ^ (s >>> 15), 1 | s);
      t ^= t + Math.imul(t ^ (t >>> 7), 61 | t) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function shuffle(a, rand) {
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(rand() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  /* ---------- Çözücü ---------- */
  var Solver = (function () {
    var seen, nodes, limit;
    function key(cols, slots, ms) {
      var k = cols.map(function (c) { return c.map(function (t) { return t.up ? t.s : String.fromCharCode(97 + t.s); }).join(''); }).sort().join('|');
      return k + '#' + slots.slice().sort().join('') + ms;
    }
    function clone(c) { return c.map(function (x) { return x.map(function (t) { return { s: t.s, up: t.up }; }); }); }
    function isWon(cols, slots) {
      if (slots.some(function (x) { return x !== null; })) return false;
      var n = 0;
      for (var i = 0; i < cols.length; i++) {
        var l = cols[i]; if (!l.length) continue; n++;
        if (l.length !== PER) return false;
        for (var k = 0; k < l.length; k++) if (!l[k].up || l[k].s !== l[0].s) return false;
      }
      return n === 9;
    }
    function runStart(l) { var i = l.length - 1; while (i > 0 && l[i - 1].up && l[i - 1].s === l[i].s) i--; return i; }
    function apply(cols, slots, ms, mv) {
      var c = clone(cols), s = slots.slice(), m = ms;
      if (mv.k === 's') { var t = s[mv.i]; s[mv.i] = null; c[mv.to].push({ s: t, up: true }); }
      else {
        var l = c[mv.from], run = l.splice(mv.i);
        if (mv.slot !== undefined) s[mv.slot] = run[0].s;
        else run.forEach(function (x) { c[mv.to].push(x); });
        if (l.length) {
          var tp = l[l.length - 1];
          if (!tp.up) { tp.up = true; if (l.length - 1 === PER - 11 && m < NS + 1) { m = NS + 1; s.push(null); } }
        }
      }
      return { c: c, s: s, m: m };
    }
    function dfs(cols, slots, ms) {
      if (isWon(cols, slots)) return [];
      if (++nodes > limit) return null;
      var k = key(cols, slots, ms);
      if (seen.has(k)) return null;
      seen.add(k);
      var moves = [], emptyDone = false, slotFree = slots.indexOf(null);
      for (var i = 0; i < slots.length; i++) if (slots[i] !== null) for (var t = 0; t < cols.length; t++) {
        var d = cols[t];
        if (d.length && d[d.length - 1].s === slots[i] && d.length < PER) moves.push({ k: 's', i: i, to: t, p: 0 });
        else if (!d.length && !emptyDone) { emptyDone = true; moves.push({ k: 's', i: i, to: t, p: 5 }); }
      }
      for (var f = 0; f < cols.length; f++) {
        var l = cols[f]; if (!l.length) continue;
        var rs = runStart(l), len = l.length - rs, ed = false;
        if (rs === 0 && l.length === PER) continue;
        for (var t2 = 0; t2 < cols.length; t2++) {
          if (t2 === f) continue;
          var d2 = cols[t2];
          if (d2.length && d2[d2.length - 1].s === l[rs].s && d2.length + len <= PER)
            moves.push({ k: 'c', from: f, i: rs, to: t2, p: (rs > 0 && !l[rs - 1].up) ? 0 : (d2.length >= len ? 1 : 2) });
          else if (!d2.length && rs > 0 && !ed) { ed = true; moves.push({ k: 'c', from: f, i: rs, to: t2, p: 6 }); }
        }
        if (len === 1 && slotFree !== -1 && rs > 0 && !l[rs - 1].up) moves.push({ k: 'c', from: f, i: rs, slot: slotFree, p: 4 });
      }
      moves.sort(function (a, b) { return a.p - b.p; });
      for (var q = 0; q < moves.length; q++) {
        var r = apply(cols, slots, ms, moves[q]);
        var res = dfs(r.c, r.s, r.m);
        if (res) return [moves[q]].concat(res);
        if (nodes > limit) return null;
      }
      return null;
    }
    function solve(cols, slots, ms, lim) {
      seen = new Set(); nodes = 0; limit = lim;
      var r = dfs(cols, slots, ms);
      return { sol: r, nodes: nodes, exhausted: !r && nodes <= lim };
    }
    return { solve: solve };
  })();

  /* ---------- Dağıtım ---------- */
  function dealSolvable(rand) {
    rand = rand || Math.random;
    var best = null;
    for (var tries = 0; tries < 30; tries++) {
      var all = [];
      for (var i = 0; i < SPECIES; i++) for (var k = 0; k < PER - 1; k++) all.push(i);
      shuffle(all, rand);
      var tops = shuffle([0, 1, 2, 3, 4, 5, 6, 7, 8], rand), d = [];
      for (var c = 0; c < 9; c++) {
        var col = all.slice(c * (PER - 1), (c + 1) * (PER - 1)).map(function (s) { return { s: s, up: false }; });
        col.push({ s: tops[c], up: true });
        d.push(col);
      }
      d.push([]);
      if (!best) best = d;
      if (Solver.solve(d, [null, null, null, null], NS, 60000).sol) return d;
    }
    return best;
  }

  /* ---------- Durum ve kurallar ---------- */
  function cloneCols(c) { return c.map(function (x) { return x.map(function (t) { return { s: t.s, up: t.up }; }); }); }
  function newState(deal) {
    return { cols: cloneCols(deal), slots: [null, null, null, null], maxSlots: NS, moves: 0, hist: [] };
  }
  function snapshot(st) { return JSON.stringify({ cols: st.cols, slots: st.slots, maxSlots: st.maxSlots }); }

  function flip(st, c) {
    var l = st.cols[c];
    if (!l.length) return;
    var t = l[l.length - 1];
    if (!t.up) {
      t.up = true;
      if (l.length - 1 === PER - 11 && st.maxSlots < NS + 1) { st.maxSlots = NS + 1; st.slots.push(null); }
    }
  }
  function isWon(st) {
    if (st.slots.some(function (x) { return x !== null; })) return false;
    var n = 0;
    for (var c = 0; c < st.cols.length; c++) {
      var l = st.cols[c];
      if (!l.length) continue;
      n++;
      if (l.length !== PER) return false;
      for (var k = 0; k < l.length; k++) if (!l[k].up || l[k].s !== l[0].s) return false;
    }
    return n === 9;
  }
  function inRange(x, lo, hi) { return typeof x === 'number' && Math.floor(x) === x && x >= lo && x <= hi; }
  function canLand(d, sp, n) {
    if (!d.length) return true;
    var top = d[d.length - 1];
    return top.up && top.s === sp && d.length + n <= PER;
  }

  /*  Hamle kaydı (log) biçimi — her eleman bir dizi:
        ['m', kaynakSütun, kaynakSıra, hedefSütun]   sütundan sütuna (grup) taşıma
        ['k', kaynakSütun, yuva]                     sütunun üst kartı → geçici yuva
        ['s', yuva, hedefSütun]                      yuvadan sütuna
        ['z', yuva, yuva2]                           yuvadan yuvaya
        ['u']                                        geri al (1 hamle sayılır)
        ['a']                                        "Topla" başladı (anlık görüntü alınır)
        ['M', ...] ve ['S', ...]                     "Topla" sırasındaki m / s (anlık görüntüsüz)
  */
  function applyAction(st, a) {
    if (!Array.isArray(a) || typeof a[0] !== 'string') return 'bad-action';
    var t = a[0], nc = st.cols.length, l, d, i, k, sp, n;
    switch (t) {
      case 'u': {
        if (a.length !== 1) return 'bad-args';
        if (!st.hist.length) return 'undo-empty';
        var o = JSON.parse(st.hist.pop());
        st.cols = o.cols; st.slots = o.slots; st.maxSlots = o.maxSlots;
        st.moves = st.moves + 1;
        return null;
      }
      case 'a': {
        if (a.length !== 1) return 'bad-args';
        st.hist.push(snapshot(st));
        return null;
      }
      case 'm': case 'M': {
        if (a.length !== 4 || !inRange(a[1], 0, nc - 1) || !inRange(a[3], 0, nc - 1) || a[1] === a[3]) return 'bad-args';
        l = st.cols[a[1]]; d = st.cols[a[3]]; i = a[2];
        if (!inRange(i, 0, l.length - 1)) return 'bad-index';
        if (!l[i].up) return 'face-down';
        for (k = i; k < l.length; k++) if (l[k].s !== l[i].s) return 'mixed-stack';
        n = l.length - i;
        if (!canLand(d, l[i].s, n)) return 'cannot-land';
        if (t === 'm') st.hist.push(snapshot(st));
        var tiles = l.slice(i);
        l.length = i;
        flip(st, a[1]);
        tiles.forEach(function (x) { d.push({ s: x.s, up: true }); });
        st.moves++;
        return null;
      }
      case 's': case 'S': {
        if (a.length !== 3 || !inRange(a[1], 0, st.slots.length - 1) || !inRange(a[2], 0, nc - 1)) return 'bad-args';
        sp = st.slots[a[1]];
        if (sp === null) return 'slot-empty';
        d = st.cols[a[2]];
        if (!canLand(d, sp, 1)) return 'cannot-land';
        if (t === 's') st.hist.push(snapshot(st));
        st.slots[a[1]] = null;
        d.push({ s: sp, up: true });
        st.moves++;
        return null;
      }
      case 'k': {
        if (a.length !== 3 || !inRange(a[1], 0, nc - 1) || !inRange(a[2], 0, st.slots.length - 1)) return 'bad-args';
        l = st.cols[a[1]];
        if (!l.length) return 'col-empty';
        if (!l[l.length - 1].up) return 'face-down';
        if (st.slots[a[2]] !== null) return 'slot-full';
        st.hist.push(snapshot(st));
        sp = l[l.length - 1].s;
        l.length = l.length - 1;
        flip(st, a[1]);
        st.slots[a[2]] = sp;
        st.moves++;
        return null;
      }
      case 'z': {
        if (a.length !== 3 || !inRange(a[1], 0, st.slots.length - 1) || !inRange(a[2], 0, st.slots.length - 1) || a[1] === a[2]) return 'bad-args';
        if (st.slots[a[1]] === null) return 'slot-empty';
        if (st.slots[a[2]] !== null) return 'slot-full';
        st.hist.push(snapshot(st));
        st.slots[a[2]] = st.slots[a[1]];
        st.slots[a[1]] = null;
        st.moves++;
        return null;
      }
    }
    return 'unknown-action';
  }

  /* Başlangıç dağıtımı + hamle kaydı → kazandı mı, kaç hamle? */
  function replay(deal, log) {
    if (!Array.isArray(log) || log.length === 0 || log.length > MAX_LOG) return { ok: false, err: 'bad-log-size' };
    var st = newState(deal);
    for (var i = 0; i < log.length; i++) {
      if (isWon(st)) return { ok: false, err: 'action-after-win', step: i };
      var e = applyAction(st, log[i]);
      if (e) return { ok: false, err: e, step: i };
    }
    if (!isWon(st)) return { ok: false, err: 'not-won' };
    return { ok: true, moves: st.moves };
  }

  /* Süre makullüğü için: elle yapılan ve otomatik ("Topla") eylem sayıları */
  function logStats(log) {
    var manual = 0, auto = 0;
    for (var i = 0; i < log.length; i++) {
      var t = log[i][0];
      if (t === 'M' || t === 'S') auto++;
      else if (t !== 'a') manual++;
    }
    return { manual: manual, auto: auto };
  }

  return {
    PER: PER, NC: NC, NS: NS, MAX_LOG: MAX_LOG,
    istanbulDateKey: istanbulDateKey, seedFromKey: seedFromKey,
    createSeededRandom: createSeededRandom, shuffle: shuffle,
    Solver: Solver, dealSolvable: dealSolvable, cloneCols: cloneCols,
    newState: newState, applyAction: applyAction, isWon: isWon,
    replay: replay, logStats: logStats
  };
});
