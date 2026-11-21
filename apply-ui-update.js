/* Sea Stack — sade oyun ekranı + tek satır ve büyük mobil üst çubuk
   Kullanım (proje klasöründe):  node apply-ui-update.js
   index.html'i günceller; yedeği index.html.bak olarak alır.
   Bir bağlantı noktası bulunamazsa HİÇBİR ŞEY yazmaz. */
const fs = require('fs'), path = require('path');
const EDITS = [
 {
  "oldText": "#dailyPill{cursor:pointer}",
  "newText": "#dailyPill{cursor:pointer}\n/* Sade oyun ekranı: bu işlevler ana menüde (klavye kısayolları çalışmaya devam eder) */\n#boardBtn,#achieveBtn,#helpBtn,#fs{display:none !important}\n@media (hover:hover) and (pointer:fine){#fxBtn,#hapticBtn{display:none !important}}\n.pill-label{display:inline}"
 },
 {
  "oldText": "    grid-template-columns: auto 1fr;\n    grid-template-areas: \"menu stats\" \"pill pill\";",
  "newText": "    grid-template-columns: auto 1fr auto;\n    grid-template-areas: \"menu pill stats\";"
 },
 {
  "oldText": "    width: 42px;\n    min-width: 42px;\n    height: 42px;",
  "newText": "    width: 46px;\n    min-width: 46px;\n    height: 46px;"
 },
 {
  "oldText": "  #dailyPill { grid-area: pill; justify-self: center; margin-top: 4px; font-size: 11px; padding: 2px 10px; }",
  "newText": "  #dailyPill { grid-area: pill; justify-self: center; font-size: 14px; padding: 8px 14px; border-radius: 12px; min-height: 36px; }\n  .pill-label { display: none; }\n  @media (min-width: 400px) { .pill-label { display: inline; } }"
 },
 {
  "oldText": "  .stats-badge {\n    grid-area: stats;\n    justify-self: end;\n    flex-direction: row;\n    align-items: center;\n    gap: 14px;\n    padding: 6px 14px;\n  }",
  "newText": "  .stats-badge {\n    grid-area: stats;\n    justify-self: end;\n    flex-direction: row;\n    align-items: center;\n    gap: 16px;\n    padding: 8px 16px;\n    min-height: 46px;\n    border-radius: 12px;\n  }\n  .stats-badge .stat-icon { font-size: 20px; }\n  .stats-badge .stat-value { font-size: 19px; }"
 },
 {
  "oldText": "    flex: 1 1 28%;",
  "newText": "    flex: 1 1 22%;"
 },
 {
  "oldText": "<span id=\"dailyPill\" class=\"mode-badge\" style=\"display:none;\" title=\"Günün Özel Oyunu\">📅 Günün Oyunu</span>",
  "newText": "<span id=\"dailyPill\" class=\"mode-badge\" style=\"display:none;\" title=\"Günün Özel Oyunu\">📅 <span class=\"pill-label\">Günün Oyunu</span></span>"
 },
 {
  "oldText": "function startDailyGame(){\n  currentGameMode = \"daily\";\n  currentDailyKey = DenizCore.istanbulDateKey();\n  randomGenerator = DenizCore.createSeededRandom(DenizCore.seedFromKey(currentDailyKey));\n  var dailyPill = document.getElementById(\"dailyPill\");\n  if(dailyPill) {\n    dailyPill.style.display = \"inline-flex\";\n    var kp = currentDailyKey.split('-');\n    dailyPill.textContent = \"📅 Günün Oyunu (\" + (+kp[2]) + \".\" + (+kp[1]) + \")\";\n  }\n  init();\n}",
  "newText": "function renderDailyPill(){\n  var dp = document.getElementById(\"dailyPill\");\n  if(!dp) return;\n  dp.textContent = \"\";\n  dp.appendChild(document.createTextNode(\"📅 \"));\n  var lab = document.createElement(\"span\");\n  lab.className = \"pill-label\";\n  lab.textContent = \"Günün Oyunu \";\n  dp.appendChild(lab);\n  if(currentDailyKey){\n    var kp = currentDailyKey.split('-');\n    dp.appendChild(document.createTextNode((+kp[2]) + \".\" + (+kp[1])));\n  }\n}\n\nfunction startDailyGame(){\n  currentGameMode = \"daily\";\n  currentDailyKey = DenizCore.istanbulDateKey();\n  randomGenerator = DenizCore.createSeededRandom(DenizCore.seedFromKey(currentDailyKey));\n  var dailyPill = document.getElementById(\"dailyPill\");\n  if(dailyPill) {\n    dailyPill.style.display = \"inline-flex\";\n    renderDailyPill();\n  }\n  init();\n}"
 },
 {
  "oldText": "      if(dp) dp.style.display = currentGameMode === \"daily\" ? \"inline-flex\" : \"none\";",
  "newText": "      if(dp) dp.style.display = currentGameMode === \"daily\" ? \"inline-flex\" : \"none\";\n      if(dp && currentGameMode === \"daily\") renderDailyPill();"
 }
];
const p = path.join(process.cwd(), 'index.html');
if (!fs.existsSync(p)) { console.error('index.html bulunamadı (komutu proje klasöründe çalıştırın)'); process.exit(1); }
const raw = fs.readFileSync(p, 'utf8');
const crlf = raw.includes('\r\n');
let s = raw.replace(/\r\n/g, '\n');
if (s.includes('function renderDailyPill()')) { console.log('Güncelleme zaten uygulanmış.'); process.exit(0); }
const errors = [];
for (const e of EDITS) {
  const c = s.split(e.oldText).length - 1;
  if (c === 1) s = s.replace(e.oldText, () => e.newText);
  else errors.push('"' + e.oldText.slice(0, 60).replace(/\n/g, ' ') + '…" ' + c + ' eşleşme (1 olmalı)');
}
if (errors.length) { console.error('UYGULANAMADI — hiçbir dosya değiştirilmedi:\n - ' + errors.join('\n - ')); process.exit(1); }
fs.writeFileSync(p + '.bak', raw);
fs.writeFileSync(p, crlf ? s.replace(/\n/g, '\r\n') : s);
console.log('Tamam: index.html güncellendi (yedek: index.html.bak).');
