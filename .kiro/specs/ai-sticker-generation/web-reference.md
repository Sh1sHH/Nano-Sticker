# Web Implementation Reference

Bu doküman, mevcut web uygulamasından React Native implementasyonuna geçiş için referans olarak kullanılacaktır.

## Web Uygulaması Analizi

### Temel Özellikler

#### 1. Fotoğraf Yükleme ve Kamera
- **File Upload**: `input type="file"` ile galeri erişimi
- **Camera Access**: `navigator.mediaDevices.getUserMedia()` ile kamera erişimi
- **Canvas Capture**: Video'dan canvas'a çekip blob'a dönüştürme
- **Base64 Conversion**: Dosyaları base64'e çevirme

#### 2. Stil Seçimi
```javascript
const styleOptions = [
  { id: 'pop-art', en: 'Pop Art', ja: "ポップアート" },
  { id: 'japanese-matchbox', en: 'Retro Japanese Matchbox', ja: "レトロマッチ箱" },
  { id: 'cartoon-dino', en: 'Cartoon Dino', ja: "恐竜漫画" },
  { id: 'pixel-art', en: 'Pixel Art', ja: "ピクセルアート" },
  { id: 'royal', en: 'Royal', ja: "王室" },
  { id: 'football-sticker', en: 'Football Sticker', ja: "サッカーシール" },
  { id: 'claymation', en: 'Claymation', ja: "クレイアニメ" },
  { id: 'vintage-bollywood', en: "Vintage Bollywood", ja: "ボリウッド" },
  { id: 'sticker-bomb', en: "Sticker Bomb", ja: "ステッカーボム" }
];
```

#### 3. Duygu Durumları
```javascript
const emotions = [
  { key: 'Happy', en: 'Happy', ja: 'ハッピー' },
  { key: 'Sad', en: 'Sad', ja: '悲しい' },
  { key: 'Angry', en: 'Angry', ja: '怒り' },
  { key: 'Surprised', en: 'Surprised', ja: '驚き' },
  { key: 'Laughing', en: 'Laughing', ja: '笑い' },
  { key: 'Love', en: 'Love', ja: '愛' },
  { key: 'Winking', en: 'Winking', ja: 'ウインク' },
  { key: 'Confused', en: 'Confused', ja: '混乱' }
];
```

#### 4. AI Prompt Sistemi

**Temel Prompt Yapısı:**
```javascript
const forceCharacter = "\n\n**Character** The generated character/person/animal must match the features of the person/character/animal in the uploaded reference image. keep the facial feature, hair style..."

const forceWhiteBackground = "\n\n**Background:** Plain solid white #FFFFFF background only (no background colors/elements)";

const skinTonePersistence = "ALWAYS PRESERVE the skin tone / hair style and other distict features of the uploaded character/person.";

const colorPalletPersistence = "First, describe the distinct features and style of the uploaded image in great detail e.g. hair style name, outfit name, and so on. Also, specify the color of each main element using its hexadecimal (HEX) code.";
```

**Stil Bazlı Prompt Örnekleri:**

- **Pop Art**: Bold, thick black outlines, vibrant primary colors, Ben-Day dots, dramatic expression
- **Claymation**: Clay-like sculpting, claymation landscape, playful exaggeration
- **Pixel Art**: Retro 8-bit style, colorful, abstract, glitch elements
- **Royal**: Transform into royalty with unicorns, rainbows, playing card elements

#### 5. Google Gemini API Entegrasyonu

```javascript
const makeApiCallWithRetry = async (payload, emotion) => {
  const apiKey = "";
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image-preview:generateContent?key=${apiKey}`;
  
  const payload = {
    contents: [{
      parts: [
        { text: fullPrompt },
        { inlineData: { mimeType: uploadedImage.mimeType, data: uploadedImage.data } }
      ]
    }],
    generationConfig: { responseModalities: ['IMAGE'] }
  };
};
```

#### 6. Sticker Sheet Oluşturma
- Canvas API ile dinamik sticker sheet oluşturma
- Mobil ve desktop için farklı rendering
- HTML2Canvas ile desktop export
- Canvas toDataURL ile mobil export

#### 7. Download ve Paylaşım
- **Tekli İndirme**: Blob URL ile download
- **Toplu İndirme**: JSZip ile zip dosyası oluşturma
- **Sticker Sheet**: Canvas rendering ile sheet export

## React Native Adaptasyonu İçin Öneriler

### 1. Fotoğraf Yönetimi
- `react-native-image-picker` → Web'deki file input + camera
- `react-native-permissions` → Web'deki getUserMedia permissions

### 2. AI API Entegrasyonu
- Aynı Gemini API endpoint'i kullanılabilir
- Retry logic ve error handling aynı şekilde implement edilmeli
- Base64 image handling aynı

### 3. Canvas İşlemleri
- `@shopify/react-native-skia` → Web'deki Canvas API
- Sticker sheet rendering için Skia Canvas kullanılabilir

### 4. Stil ve Duygu Yönetimi
- Aynı stil ve duygu arrays'i kullanılabilir
- Prompt generation logic aynı şekilde uygulanabilir

### 5. State Yönetimi
- Web'deki useState pattern'leri Zustand store'a taşınabilir
- Loading states ve error handling aynı mantık

### 6. Çoklu Dil Desteği
- Web'deki translations object'i aynı şekilde kullanılabilir
- i18n library ile genişletilebilir

## Implementasyon Öncelikleri

1. **Temel Fotoğraf İşlemleri** (Task 3)
2. **Stil Seçim Sistemi** (Task 5)
3. **AI API Entegrasyonu** (Task 6)
4. **Sticker Grid Display** (Task 7)
5. **Export ve Paylaşım** (Task 8)

## Teknik Notlar

- Web uygulaması production-ready görünüyor
- API key management güvenlik açısından backend'e taşınmalı
- Retry logic ve error handling çok iyi implement edilmiş
- Canvas operations React Native Skia ile 1:1 uygulanabilir
- Prompt engineering çok detaylı ve etkili