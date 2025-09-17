# AI Sticker Generator

React Native uygulaması ile fotoğraflarınızı AI kullanarak sanatsal çıkartmalara dönüştürün.

## Özellikler

- 📷 Kamera ve galeri entegrasyonu
- 🤖 ML Kit ile otomatik nesne segmentasyonu
- 🎨 Çoklu sanatsal stil seçenekleri (Cartoon, Anime, Oil Painting, Caricature)
- ✨ React Native Skia ile gerçek zamanlı efektler
- 💬 WhatsApp çıkartma paketi desteği
- 💳 Kredi sistemi ve uygulama içi satın alma
- 🔄 Google Vertex AI entegrasyonu

## Kurulum

### Gereksinimler

- Node.js >= 18
- React Native CLI
- Android Studio / Xcode
- Google Cloud Platform hesabı (Vertex AI için)

### Adımlar

1. Bağımlılıkları yükleyin:
```bash
npm install
```

2. iOS için pod kurulumu:
```bash
cd ios && pod install && cd ..
```

3. Android için:
```bash
npx react-native run-android
```

4. iOS için:
```bash
npx react-native run-ios
```

## Proje Yapısı

```
src/
├── components/          # Yeniden kullanılabilir bileşenler
├── screens/            # Uygulama ekranları
├── services/           # API ve servis katmanları
├── stores/             # Zustand state yönetimi
├── types/              # TypeScript tip tanımları
├── utils/              # Yardımcı fonksiyonlar
└── App.tsx             # Ana uygulama bileşeni
```

## Kullanılan Teknolojiler

- **React Native 0.73.6** - Mobil uygulama framework'ü
- **TypeScript** - Tip güvenliği
- **React Navigation** - Navigasyon yönetimi
- **Zustand** - State yönetimi
- **React Native Image Picker** - Fotoğraf seçimi
- **ML Kit** - Nesne segmentasyonu
- **React Native Skia** - Grafik ve efektler
- **React Native Share** - Paylaşım özellikleri

## Backend Entegrasyonu

Bu uygulama aşağıdaki backend servisleri ile çalışır:

- **Node.js/Express** backend
- **Google Vertex AI** - AI görüntü işleme
- **PostgreSQL** - Kullanıcı ve işlem verileri
- **Cloud Storage** - Görüntü depolama

## Geliştirme

### Test Çalıştırma

```bash
npm test
```

### Linting

```bash
npm run lint
```

### Type Checking

```bash
npm run typecheck
```

## Yapılacaklar

- [ ] ML Kit entegrasyonu
- [ ] Vertex AI backend bağlantısı
- [ ] React Native Skia efektleri
- [ ] WhatsApp API entegrasyonu
- [ ] Ödeme sistemi entegrasyonu
- [ ] Performans optimizasyonları

## Katkıda Bulunma

1. Fork yapın
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Değişikliklerinizi commit edin (`git commit -m 'Add amazing feature'`)
4. Branch'inizi push edin (`git push origin feature/amazing-feature`)
5. Pull Request oluşturun

## Lisans

Bu proje MIT lisansı altında lisanslanmıştır.