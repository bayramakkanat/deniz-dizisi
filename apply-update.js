/* Sea Stack — yıldız eşikleri + başarım düzeltmesi + önbellek sürümü
   Kullanım (proje klasöründe):  node apply-update.js
   index.html ve sw.js'i günceller; yedekleri .bak olarak alır.
   Bir bağlantı noktası bulunamazsa HİÇBİR ŞEY yazmaz. */
const fs = require('fs'), path = require('path');
const files = {
  'index.html': [
    ['var STAR3 = 100, STAR2 = 140;', 'var STAR3 = 130, STAR2 = 165;'],
    ["{ id: 'moves_65', icon: '🎯', title: 'Kusursuz Hamle', desc: 'Oyunu 65 veya daha az hamleyle bitir.' }",
     "{ id: 'moves_115', icon: '🎯', title: 'Kusursuz Hamle', desc: 'Oyunu 115 veya daha az hamleyle bitir.' }"],
    ["if(currentMoves <= 65) unlockAchievement('moves_65');", "if(currentMoves <= 115) unlockAchievement('moves_115');"]
  ],
  'sw.js': [["const VERSION = 'v1';", "const VERSION = 'v2';"]]
};
const out = {}, errors = [];
for (const [name, edits] of Object.entries(files)) {
  const p = path.join(process.cwd(), name);
  if (!fs.existsSync(p)) { errors.push(name + ' bulunamadı (komutu proje klasöründe çalıştırın)'); continue; }
  const raw = fs.readFileSync(p, 'utf8');
  const crlf = raw.includes('\r\n');
  let s = raw.replace(/\r\n/g, '\n');
  for (const [o, n] of edits) {
    const c = s.split(o).length - 1;
    if (c === 1) s = s.replace(o, () => n);
    else if (s.includes(n)) continue; // zaten uygulanmış
    else errors.push(name + ': "' + o.slice(0, 50) + '…" ' + c + ' eşleşme');
  }
  out[name] = { raw, text: crlf ? s.replace(/\n/g, '\r\n') : s };
}
if (errors.length) { console.error('UYGULANAMADI — hiçbir dosya değiştirilmedi:\n - ' + errors.join('\n - ')); process.exit(1); }
for (const [name, v] of Object.entries(out)) {
  if (v.raw === v.text) { console.log(name + ': zaten güncel'); continue; }
  fs.writeFileSync(name + '.bak', v.raw);
  fs.writeFileSync(name, v.text);
  console.log(name + ': güncellendi (yedek: ' + name + '.bak)');
}
