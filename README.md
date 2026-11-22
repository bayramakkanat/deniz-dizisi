# Sea Stack

Kapalı kutuların açıldığı, deniz canlılarını sütunlarda toplama bulmacası. Tek sayfalık bir web oyunu; telefonda ana ekrana eklenebilir ve çevrimdışı oynanır.

## Özellikler
- **Rastgele oyun** ve **Günün Oyunu** (Türkiye saatine göre herkese aynı dağıtım)
- **Online günlük sıralama:** en az hamle, eşitlikte en kısa süre. Sonuçlar sunucuda hamle kaydı baştan oynatılarak doğrulanır.
- Günlük seri, 1-3 yıldız, profil (takma ad, rekorlar), başarımlar
- Ana menü, mobil için ince üst çubuk ve alt eylem çubuğu, titreşim (Android)

## Nasıl oynanır
- 9 canlı türü, her biri 12 kutu. 10 sütunun biri başta boş.
- Açık, aynı türden bir bloğu boş sütuna ya da üstü aynı tür olan sütuna taşı.
- Sütun kapasitesi 12 kutu. Kutular sütunun altına yığılır.
- Üstteki 4 geçici yuvaya tek kutu konabilir.
- 11. satırdaki kapalı bir kutuyu açınca 5. yuva açılır.
- Geri al da bir hamle sayılır.

## Dosyalar
- `index.html`: oyunun tamamı (arayüz, kurallar, ses, görseller)
- `game-core.js`: dağıtım, çözücü, kurallar ve hamle kaydının doğrulanması. **Hem tarayıcı hem sunucu kullanır;** değiştirirsen eski günlerin kayıtları doğrulanamaz.
- `api/`: Vercel sunucusuz fonksiyonları (`submit`, `leaderboard`, `rename`) ve `_db.js` (Upstash Redis bağlantısı)
- `sw.js`: çevrimdışı önbellek. `assets/` veya `icons/` içindeki görseller değişirse içindeki `VERSION` değerini artır.
- `manifest.webmanifest`, `favicon.svg`, `icons/`: uygulama kimliği ve simgeler
- `_arsiv/`: eski yama betikleri ve yedekler (git'e girmez, silinebilir)

## Yayınlama ve sıralama
Oyun statik olarak çalışır, ama **Günün Oyunu sıralaması** için Vercel ve bir Redis veritabanı gerekir:

1. Projeyi Vercel'e bağla.
2. Vercel'de **Storage / Marketplace** üzerinden **Upstash Redis** ekle ve projeye bağla (`UPSTASH_REDIS_REST_URL` ve `UPSTASH_REDIS_REST_TOKEN` otomatik eklenir; eski `KV_REST_API_*` adları da tanınır).
3. GitHub'a gönderince Vercel yeniden yayınlar.

`index.html`'i doğrudan dosyadan açarsan oyun çalışır, sıralama çalışmaz.

## Notlar
- Dağıtımlar bir çözücüyle doğrulanır, yani her oyun kazanılabilir. İpucu da aynı çözücüden gelir.
- Kazanmak için tüm gizli kutuların açılması gerekir ve bir hamle en fazla bir kutu açar; bu yüzden en az 99 hamle gerekir.
- Yıldız eşikleri `index.html` içinde `STAR3` ve `STAR2` değerleridir.
- Süre kullanıcının tarayıcısından gelir ve yalnızca makullüğü denetlenir; hamle sayısı ise sunucuda tam doğrulanır.
- Görseller `assets` klasöründe (256x256 PNG). Eksik dosya olursa oyun yerleşik çizimleri kullanır.
- Görseller Canva ile üretildi, yayına almadan önce kullanım koşullarını kontrol edin.
