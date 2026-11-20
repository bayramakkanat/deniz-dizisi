/* Deniz Dizisi — Günün Oyunu sıralaması yaması
   Kullanım (proje klasöründe):   node apply-patch.js
   index.html'i değiştirir; önce index.html.bak yedeği alır.
   Herhangi bir bağlantı noktası bulunamazsa HİÇBİR ŞEY yazmaz. */
const fs = require('fs');
const path = require('path');
const file = path.join(process.cwd(), 'index.html');
if (!fs.existsSync(file)) { console.error('index.html bulunamadı. Komutu proje klasöründe çalıştırın.'); process.exit(1); }
const raw = fs.readFileSync(file, 'utf8');
const crlf = raw.indexOf('\r\n') !== -1;
let s = raw.replace(/\r\n/g, '\n');
if (s.indexOf('DenizCore') !== -1) { console.error('Yama zaten uygulanmış görünüyor (DenizCore bulundu).'); process.exit(1); }

const errors = [];
function count(h, n) { let c = 0, i = 0; while ((i = h.indexOf(n, i)) !== -1) { c++; i += n.length; } return c; }
function rep(name, oldT, newT) {
  const c = count(s, oldT);
  if (c !== 1) { errors.push(name + ': ' + c + ' eşleşme (1 olmalı)'); return; }
  s = s.replace(oldT, function () { return newT; });
}
function repRange(name, startM, endM, newT) {
  const a = s.indexOf(startM);
  if (a === -1 || count(s, startM) !== 1) { errors.push(name + ': başlangıç işareti bulunamadı/tekil değil'); return; }
  const b = s.indexOf(endM, a);
  if (b === -1) { errors.push(name + ': bitiş işareti bulunamadı'); return; }
  s = s.slice(0, a) + newT + s.slice(b + endM.length);
}

/* 1) çekirdek betiği */
rep('head-script', '<link rel="manifest" href="manifest.webmanifest">',
  '<link rel="manifest" href="manifest.webmanifest">\n<script src="game-core.js"></script>');

/* 2) CSS */
rep('css', '/* Mobile & Tablet Adjustments */', String.raw`/* ---- Günün Oyunu sıralaması ---- */
input{user-select:text;-webkit-user-select:text}
#dailyPill{cursor:pointer}
.win-board{width:100%;display:flex;flex-direction:column;gap:8px;margin:2px 0 8px}
.win-board-status{font-size:13px;line-height:1.45;color:#cbd5e1;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);border-radius:12px;padding:10px 12px;text-align:center}
.win-board-status.ok{color:#ffd166;border-color:rgba(255,209,102,.5);background:rgba(255,209,102,.1);font-weight:700}
.win-board-status.warn{color:#ffb4a2;border-color:rgba(255,120,100,.4)}
.name-row{display:flex;gap:8px;justify-content:center;align-items:center;flex-wrap:wrap}
.name-row input{flex:1 1 140px;min-width:0;font:inherit;font-size:14px;color:#fff;background:rgba(6,17,36,.7);border:1px solid rgba(100,175,255,.35);border-radius:10px;padding:9px 12px;outline:none}
.name-row input:focus{border-color:#00d2ff;box-shadow:0 0 8px rgba(0,210,255,.35)}
.board-list{display:flex;flex-direction:column;gap:4px;max-height:44vh;overflow-y:auto;width:100%}
.board-row{display:grid;grid-template-columns:34px 1fr auto auto;gap:10px;align-items:center;padding:7px 10px;border-radius:10px;background:rgba(6,17,36,.55);border:1px solid rgba(255,255,255,.07);font-size:13px}
.board-row.me{border-color:rgba(255,209,102,.6);background:rgba(255,209,102,.1)}
.board-rank{text-align:center;font-weight:800;color:#8bb3e8}
.board-name{font-weight:700;color:#fff;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.board-moves{color:#ffd166;font-weight:700;font-variant-numeric:tabular-nums}
.board-time{color:#00d2ff;font-weight:700;font-variant-numeric:tabular-nums}
.board-msg{text-align:center;font-size:13px;color:var(--ink-muted);padding:6px 4px;min-height:8px}
/* Mobile & Tablet Adjustments */`);

/* 3) üst çubuk düğmesi */
rep('header-btn', '<button class="btn btn-util" id="achieveBtn" title="Başarımlar ve Rozetler (B)">',
  '<button class="btn btn-util" id="boardBtn" title="Günün Sıralaması (L)">\n          <span class="btn-icon">📊</span>\n        </button>\n        <button class="btn btn-util" id="achieveBtn" title="Başarımlar ve Rozetler (B)">');

/* 4) kazanma penceresi bloğu */
rep('win-block', '<div id="winRecordCallout" class="win-record-banner"></div>',
  `<div id="winRecordCallout" class="win-record-banner"></div>

    <div id="winBoard" class="win-board" style="display:none;">
      <div id="winBoardStatus" class="win-board-status"></div>
      <div id="winNameRow" class="name-row" style="display:none;">
        <input id="winNameInput" type="text" maxlength="16" placeholder="Takma adın" autocomplete="nickname" aria-label="Takma ad">
        <button class="btn btn-primary" id="winNameSubmit" style="padding:8px 14px;font-size:13px;">Gönder</button>
      </div>
      <div class="name-row">
        <button class="btn btn-secondary" id="winRetry" style="display:none;">🔄 Tekrar dene</button>
        <button class="btn btn-secondary" id="winBoardOpen">📊 Günün Sıralaması</button>
      </div>
    </div>`);

/* 5) sıralama penceresi */
rep('board-modal', '<!-- Confirm New Game Modal -->', `<!-- Günün Sıralaması Modal -->
<div class="modal-overlay" id="boardModal">
  <div class="modal-card" style="max-width: 480px;">
    <div class="modal-header">
      <h2 class="modal-title" style="color: #ffd166;">🏆 Günün Sıralaması</h2>
      <p class="modal-subtitle" id="boardSub">Herkes için aynı oyun • en az hamle, eşitlikte en kısa süre</p>
    </div>
    <div class="name-row">
      <input id="boardNameInput" type="text" maxlength="16" placeholder="Takma adın" autocomplete="nickname" aria-label="Takma ad">
      <button class="btn" id="boardNameSave">Kaydet</button>
    </div>
    <div id="boardPending" class="win-board-status warn" style="display:none;">
      Gönderilemeyen bir sonucun var.
      <button class="btn btn-secondary" id="boardPendingSend" style="margin-left:6px;padding:4px 10px;min-height:0;">Şimdi gönder</button>
    </div>
    <div class="board-msg" id="boardMsg"></div>
    <div class="board-list" id="boardList"></div>
    <div class="modal-actions" style="justify-content: center;">
      <button class="btn btn-secondary" id="boardRefresh">🔄 Yenile</button>
      <button class="btn btn-primary" id="boardClose">Kapat ✕</button>
    </div>
  </div>
</div>

<!-- Confirm New Game Modal -->`);

/* 6) durum değişkenleri + kayıt yardımcıları */
rep('state-vars', 'var currentGameMode = "normal"; // "normal" or "daily"', `var currentGameMode = "normal"; // "normal" or "daily"
var actionLog = [];   // Günün Oyunu sıralaması için hamle kaydı
var startDeal = null; // oyunun başlangıç dağıtımı (kaydı doğrulamak için)
var logValid = true;
function logMove(c){
  if(sel.kind === 'slot') actionLog.push(['s', sel.i, c]);
  else actionLog.push(['m', sel.c, sel.i, c]);
}
function logSlotMove(i){
  if(sel.kind === 'slot') actionLog.push(['z', sel.i, i]);
  else actionLog.push(['k', sel.c, i]);
}`);

/* 7) günlük tohum / rastgele üreteç / günün oyunu başlatma */
repRange('daily-block', 'function getDailySeed(){', '\n  init();\n}',
`var randomGenerator = Math.random;
var currentDailyKey = null;

function startDailyGame(){
  currentGameMode = "daily";
  currentDailyKey = DenizCore.istanbulDateKey();
  randomGenerator = DenizCore.createSeededRandom(DenizCore.seedFromKey(currentDailyKey));
  var dailyPill = document.getElementById("dailyPill");
  if(dailyPill) {
    dailyPill.style.display = "inline-flex";
    var kp = currentDailyKey.split('-');
    dailyPill.textContent = "📅 Günün Oyunu (" + (+kp[2]) + "." + (+kp[1]) + ")";
  }
  init();
}`);
rep('normal-start', 'function startNormalGame(){\n  currentGameMode = "normal";',
  'function startNormalGame(){\n  currentGameMode = "normal";\n  currentDailyKey = null;');

/* 8) çözücü + dağıtım artık ortak çekirdekten */
repRange('solver-block', 'var Solver = (function(){', '  return best;\n}',
`var Solver = DenizCore.Solver;

function dealSolvable(){
  return DenizCore.dealSolvable(randomGenerator);
}`);

/* 9) init: başlangıç dağıtımını ve kaydı sıfırla */
rep('init', '  cols = dealSolvable();',
`  cols = dealSolvable();
  startDeal = DenizCore.cloneCols(cols);
  actionLog = [];
  logValid = true;
  try { localStorage.setItem('deniz_startdeal', JSON.stringify(startDeal)); } catch(e){}`);

/* 10-12) hamle kaydı */
rep('tapCol-log',
`    if(!d.length || (top.up && top.s===t[0].s && d.length+t.length <= PER)){
      snap();`,
`    if(!d.length || (top.up && top.s===t[0].s && d.length+t.length <= PER)){
      logMove(c);
      snap();`);
rep('tapSlot-log',
`      var s=selTiles()[0].s;
      snap();`,
`      var s=selTiles()[0].s;
      logSlotMove(i);
      snap();`);
rep('undo-log',
`  hasUsedUndo = true;
  var dModal = document.getElementById("deadlockModal");`,
`  hasUsedUndo = true;
  actionLog.push(['u']);
  var dModal = document.getElementById("deadlockModal");`);

/* 13-16) Topla (otomatik bitirme) kaydı + 3. adımdaki tür hatasının düzeltmesi */
rep('auto-start', '  snap();\n  isAutoFinishing = true;', '  snap();\n  actionLog.push([\'a\']);\n  isAutoFinishing = true;');
rep('auto-1',
`            sel = { kind: 'slot', i: sIdx };
            takeSel();
            col.push({ s: sp, up: true });`,
`            actionLog.push(['S', sIdx, c]);
            sel = { kind: 'slot', i: sIdx };
            takeSel();
            col.push({ s: sp, up: true });`);
rep('auto-2',
`            sel = p;
            takeSel();
            stack.forEach(function(card){ col2.push(card); });`,
`            actionLog.push(['M', c1, p.i, c2]);
            sel = p;
            takeSel();
            stack.forEach(function(card){ col2.push(card); });`);
rep('auto-3',
`              sel = p;
              takeSel();
              cols[emptyCol].push({ s: p.s, up: true });`,
`              var movedSp = cols[c1][p.i].s;
              actionLog.push(['M', c1, p.i, emptyCol]);
              sel = p;
              takeSel();
              cols[emptyCol].push({ s: movedSp, up: true });`);

/* 17-18) otomatik kayıt */
rep('save',
`      mode: currentGameMode,
      usedUndo: hasUsedUndo
    }));`,
`      mode: currentGameMode,
      usedUndo: hasUsedUndo,
      log: actionLog,
      dailyKey: currentDailyKey
    }));`);
rep('load', '      hasUsedUndo = !!data.usedUndo;',
`      hasUsedUndo = !!data.usedUndo;
      actionLog = Array.isArray(data.log) ? data.log : [];
      currentDailyKey = data.dailyKey || null;
      try { startDeal = JSON.parse(localStorage.getItem('deniz_startdeal') || 'null'); } catch(e){ startDeal = null; }
      logValid = Array.isArray(data.log) && !!startDeal;`);

/* 19) kazanınca sıralama gönderimini başlat */
rep('win-hook',
  "    window._lastWin = { moves: currentMoves, sec: currentSec, daily: currentGameMode === 'daily' };",
`    window._lastWin = { moves: currentMoves, sec: currentSec, daily: currentGameMode === 'daily',
      log: actionLog.slice(), startDeal: startDeal, dailyKey: currentDailyKey, logValid: logValid && !!currentDailyKey };
    if(window.setupWinBoard) window.setupWinBoard();`);

/* 20) sıralama arayüzü betiği */
rep('board-script', '</script>\n</body>', '</script>\n<script>\n' + String.raw`/* ==============================================================
   GÜNÜN OYUNU SIRALAMASI (istemci tarafı)
   ============================================================== */
(function(){
  function $(id){ return document.getElementById(id); }
  var PEND_KEY = 'deniz_pending_submit';
  var cur = null;

  function rndHex(n){ var s = ''; while(s.length < n) s += Math.floor(Math.random() * 16).toString(16); return s; }
  function playerId(){
    try {
      var v = localStorage.getItem('deniz_player_id');
      if(!v || !/^[A-Za-z0-9_-]{16,64}$/.test(v)){
        v = (window.crypto && crypto.randomUUID) ? crypto.randomUUID().replace(/-/g, '') : rndHex(32);
        localStorage.setItem('deniz_player_id', v);
      }
      return v;
    } catch(e){ return window._pidMem || (window._pidMem = rndHex(32)); }
  }
  function cleanName(n){ return String(n || '').replace(/[<>&"'` + "`" + String.raw`]/g, '').replace(/\s+/g, ' ').trim().slice(0, 16); }
  function getName(){ try { return cleanName(localStorage.getItem('deniz_player_name') || ''); } catch(e){ return ''; } }
  function setName(n){ try { localStorage.setItem('deniz_player_name', n); } catch(e){} }

  function api(p, opts){
    opts = opts || {};
    var ctl = window.AbortController ? new AbortController() : null;
    var to = setTimeout(function(){ if(ctl) ctl.abort(); }, 15000);
    if(ctl) opts.signal = ctl.signal;
    return fetch('/api' + p, opts).then(function(r){
      clearTimeout(to);
      return r.json().then(function(j){ j.httpStatus = r.status; return j; },
                           function(){ return { ok: false, error: 'bad-response', httpStatus: r.status }; });
    }, function(e){ clearTimeout(to); throw e; });
  }
  var ERR = {
    'db-not-configured': 'Sıralama sunucusu henüz kurulmamış.',
    'db': 'Sıralama veritabanına ulaşılamadı, biraz sonra tekrar deneyin.',
    'invalid-log': 'Oyun kaydı doğrulanamadı.',
    'too-fast': 'Süre, hamle sayısına göre fazla kısa görünüyor; doğrulanamadı.',
    'bad-date': 'Bu günün oyunu için gönderim süresi geçmiş.',
    'bad-name': 'Geçerli bir takma ad girin.',
    'bad-player': 'Oyuncu kimliği geçersiz.'
  };
  function errText(r){ return ERR[r && r.error] || 'Sıralamaya gönderilemedi.'; }

  function savePending(){ try { if(cur) localStorage.setItem(PEND_KEY, JSON.stringify(cur)); } catch(e){} }
  function clearPending(){ try { localStorage.removeItem(PEND_KEY); } catch(e){} }
  function getPending(){
    try {
      var p = JSON.parse(localStorage.getItem(PEND_KEY) || 'null');
      if(p && p.log && p.date){
        var t = DenizCore.istanbulDateKey(), y = DenizCore.istanbulDateKey(new Date(Date.now() - 86400000));
        if(p.date === t || p.date === y) return p;
      }
    } catch(e){}
    return null;
  }

  /* ---- gönderim ---- */
  function send(entry, setS, onNeedName, onRetry){
    if(!getName()){ if(onNeedName) onNeedName(); return; }
    setS('Sıralamaya gönderiliyor…');
    api('/submit', { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date: entry.date, playerId: playerId(), name: getName(), log: entry.log, sec: entry.sec }) })
    .then(function(r){
      if(r && r.ok){
        clearPending();
        setS(r.improved
          ? '🏆 Günün sıralamasında ' + r.rank + '. sıradasın! (' + r.total + ' oyuncu)'
          : 'Bugünkü en iyin ' + r.best.moves + ' hamle • ' + formatTime(r.best.sec) + ' — şu an ' + r.rank + '. sıradasın.', 'ok');
      } else if(r && (r.error === 'db' || r.error === 'db-not-configured')){
        cur = entry; savePending(); setS(errText(r), 'warn'); if(onRetry) onRetry();
      } else {
        setS(errText(r), 'warn');
        if(r && r.error === 'bad-name' && onNeedName) onNeedName();
      }
    }, function(){
      cur = entry; savePending();
      setS('Sunucuya ulaşılamadı. Bağlantını kontrol edip tekrar dene.', 'warn');
      if(onRetry) onRetry();
    });
  }

  /* ---- kazanma penceresi ---- */
  function winStatus(t, kind){ var el = $('winBoardStatus'); if(!el) return; el.textContent = t; el.className = 'win-board-status' + (kind ? ' ' + kind : ''); }
  function showNameRow(){
    $('winNameRow').style.display = 'flex';
    setTimeout(function(){ try { $('winNameInput').focus(); } catch(e){} }, 50);
  }
  function winSend(){
    $('winRetry').style.display = 'none';
    send(cur, winStatus,
      function(){ winStatus('Sıralamaya girmek için takma adını yaz:'); showNameRow(); },
      function(){ $('winRetry').style.display = 'inline-flex'; });
  }
  window.setupWinBoard = function(){
    var w = window._lastWin, box = $('winBoard');
    if(!box) return;
    if(!w || !w.daily){ box.style.display = 'none'; return; }
    box.style.display = 'flex';
    $('winNameRow').style.display = 'none';
    $('winRetry').style.display = 'none';
    $('winBoardOpen').onclick = function(){ $('winModal').classList.remove('active'); openBoard(); };
    if(!w.logValid){ winStatus('Bu oyun eski sürümden devam ettiği için sıralamaya gönderilemedi. Bir sonraki günün oyununu baştan oyna!', 'warn'); return; }
    var chk = null;
    try { chk = DenizCore.replay(w.startDeal, w.log); } catch(e){}
    if(!chk || !chk.ok || chk.moves !== w.moves){
      console.warn('Oyun kaydı yerel doğrulamadan geçemedi', chk, w.moves);
      winStatus('Oyun kaydı doğrulanamadı; sonuç sıralamaya gönderilemedi.', 'warn');
      return;
    }
    cur = { date: w.dailyKey, log: w.log, sec: w.sec };
    winSend();
  };
  $('winRetry').onclick = winSend;
  $('winNameSubmit').onclick = function(){
    var n = cleanName($('winNameInput').value);
    if(!n){ showToast('Lütfen bir takma ad yaz.'); return; }
    setName(n);
    $('winNameRow').style.display = 'none';
    winSend();
  };
  $('winNameInput').addEventListener('keydown', function(e){ if(e.key === 'Enter') $('winNameSubmit').click(); });

  /* ---- sıralama penceresi ---- */
  function boardMsg(t){ $('boardMsg').textContent = t || ''; }
  function updatePending(){
    var p = getPending();
    $('boardPending').style.display = p ? 'block' : 'none';
  }
  function render(r){
    var list = $('boardList'); list.textContent = '';
    var p = r.date.split('-');
    $('boardSub').textContent = (+p[2]) + '.' + (+p[1]) + '.' + p[0] + ' • ' + r.total + ' oyuncu • en az hamle, eşitlikte en kısa süre';
    if(!r.entries.length){ boardMsg('Henüz kimse bitirmedi. İlk sen ol! 🌊'); return; }
    boardMsg(r.myRank && r.myRank > r.entries.length ? 'Senin sıran: ' + r.myRank : '');
    r.entries.forEach(function(e){
      var row = document.createElement('div');
      row.className = 'board-row' + (e.me ? ' me' : '');
      var rank = e.rank === 1 ? '🥇' : e.rank === 2 ? '🥈' : e.rank === 3 ? '🥉' : String(e.rank);
      [['board-rank', rank], ['board-name', e.name], ['board-moves', e.moves + ' hamle'], ['board-time', formatTime(e.sec)]].forEach(function(c){
        var sp = document.createElement('span'); sp.className = c[0]; sp.textContent = c[1]; row.appendChild(sp);
      });
      list.appendChild(row);
    });
  }
  function loadBoard(){
    $('boardList').textContent = '';
    boardMsg('Yükleniyor…');
    updatePending();
    api('/leaderboard?date=' + DenizCore.istanbulDateKey() + '&pid=' + encodeURIComponent(playerId())).then(function(r){
      if(!r || !r.ok){ boardMsg(errText(r)); return; }
      render(r);
    }, function(){ boardMsg('Sunucuya ulaşılamadı. (Yerelde açtıysan sıralama yalnızca yayınlanan sürümde çalışır.)'); });
  }
  function openBoard(){
    $('boardModal').classList.add('active');
    $('boardNameInput').value = getName();
    loadBoard();
  }
  function closeBoard(){ $('boardModal').classList.remove('active'); }

  $('boardBtn').onclick = openBoard;
  $('boardClose').onclick = closeBoard;
  $('boardRefresh').onclick = loadBoard;
  $('boardModal').addEventListener('click', function(e){ if(e.target === this) closeBoard(); });
  $('dailyPill').onclick = openBoard;
  $('boardNameSave').onclick = function(){
    var n = cleanName($('boardNameInput').value);
    if(!n){ showToast('Lütfen bir takma ad yaz.'); return; }
    setName(n); $('boardNameInput').value = n;
    var done = function(){ loadBoard(); };
    api('/rename', { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date: DenizCore.istanbulDateKey(), playerId: playerId(), name: n }) }).then(done, done);
    showToast('Takma ad kaydedildi.');
  };
  $('boardNameInput').addEventListener('keydown', function(e){ if(e.key === 'Enter') $('boardNameSave').click(); });
  $('boardPendingSend').onclick = function(){
    var p = getPending(); if(!p) return;
    send(p, function(t){ boardMsg(t); }, function(){ boardMsg('Önce yukarıdan bir takma ad kaydet.'); }, null);
    setTimeout(function(){ loadBoard(); }, 1200);
  };
  window.addEventListener('keydown', function(e){
    if(e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
    if(e.ctrlKey || e.metaKey || e.altKey) return;
    if(e.key === 'l' || e.key === 'L') openBoard();
    else if(e.key === 'Escape') closeBoard();
  });
})();
` + '</script>\n</body>');

if (errors.length) {
  console.error('YAMA UYGULANAMADI — hiçbir dosya değiştirilmedi:');
  errors.forEach(function (e) { console.error(' - ' + e); });
  process.exit(1);
}
fs.writeFileSync(file + '.bak', raw);
fs.writeFileSync(file, crlf ? s.replace(/\n/g, '\r\n') : s);
console.log('Tamam: index.html güncellendi (yedek: index.html.bak).');
