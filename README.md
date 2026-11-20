# Deniz Dizisi

Kapalı kutuların açıldığı, deniz canlılarını sütunlarda toplama bulmacası. Tek sayfalık, bağımlılıksız bir web oyunu.

## Çalıştırma
`index.html` dosyasını tarayıcıda açmak yeterli. Vercel'e ya da GitHub Pages'e olduğu gibi yüklenebilir.

## Nasıl oynanır
- 9 canlı türü, her biri 12 kutu. 10 sütunun biri başta boş.
- Açık, aynı türden bir bloğu boş sütuna ya da üstü aynı tür olan sütuna taşı.
- Sütun kapasitesi 12 kutu. Kutular sütunun altına yığılır.
- Üstteki 4 geçici yuvaya tek kutu konabilir.
- 11. satırdaki kapalı bir kutuyu açınca 5. yuva açılır.
- Geri al da bir hamle sayılır.

## Notlar
- Dağıtımlar bir çözücüyle doğrulanır, yani her oyun kazanılabilir. İpucu da aynı çözücüden gelir.
- Günün Oyunu herkese aynı dağıtımı verir. Rekorlar normal ve günlük oyun için ayrı tutulur.
- Görseller `assets` klasöründe (256x256 PNG). Eksik dosya olursa oyun yerleşik çizimleri kullanır.
- Görseller Canva ile üretildi, yayına almadan önce kullanım koşullarını kontrol edin.
