# 🚀 Miray AR - Tesisat Görselleştirme Sistemi

<div align="center">

![AR Badge](https://img.shields.io/badge/AR-Augmented%20Reality-00D9FF?style=for-the-badge)
![Python](https://img.shields.io/badge/Python-3.7+-3776AB?style=for-the-badge&logo=python&logoColor=white)
![Flask](https://img.shields.io/badge/Flask-2.0+-000000?style=for-the-badge&logo=flask&logoColor=white)
![A-Frame](https://img.shields.io/badge/A--Frame-VR/AR-EF2D5E?style=for-the-badge&logo=a-frame&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)

**QR kod destekli, marker tabanlı Augmented Reality (AR) tesisat görselleştirme platformu.**

[📖 Özellikler](#-özellikler) • [🚀 Kurulum](#-kurulum) • [📱 Kullanım](#-kullanım) • [🔧 Model Ekleme](#-model-ekleme) • [🛠️ Teknik Yapı](#-teknik-yapı)

</div>

---

## 📖 Hakkında

Miray AR, elektrik ve boru tesisatlarının 3D modellerini gerçek zamanlı **Artırılmış Gerçeklik (AR)** deneyimi olarak sunan modern bir web uygulamasıdır. Proje, teknik ekiplerin binalardaki gizli tesisatları (elektrik kabloları, su boruları vb.) yerinde ve 3D olarak görüntülemesini sağlamak amacıyla geliştirilmiştir.

### 🎯 Neden Miray AR?
- **Hızlı Erişim**: QR kodları ile saniyeler içinde doğru modele ulaşım.
- **Düşük Maliyet**: Sadece bir akıllı telefon veya tablet ile profesyonel AR çözümü.
- **Esneklik**: Her türlü GLB/glTF modelini kolayca sisteme dahil edebilme.
- **İnteraktif**: Modelleri yerinde inceleme, zoom yapma ve konumlandırma.

---

## ✨ Özellikler

| Özellik | Detay |
|:---:|:---|
| 🎯 **QR Kod Entegrasyonu** | Her tesisat için özel QR kod ile anında model yükleme. |
| 🔄 **Hibrit AR Modu** | Hem Marker (Hiro) hem de Markerless (ARCore) desteği. |
| 📱 **Cross-Platform** | Web tabanlı olduğu için indirme gerektirmez (iOS/Android/PC). |
| 🎮 **Gelişmiş Kontroller** | Zoom, rotasyon, pozisyon ve drift modu ile tam kontrol. |
| 📡 **Local Network Hosting** | WiFi üzerinden anında çoklu cihaz erişimi. |
| 🏗️ **Otomatik Dönüştürme** | glTF modellerini otomatik GLB'ye çevirme araçları. |
| ✅ **Model Doğrulama** | Hatalı referansları ve eksik dosyaları raporlayan kontrol sistemi. |

---

## 🚀 Kurulum

### 1️⃣ Gereksinimler
- **Python 3.7+**
- Modern bir web tarayıcısı (Chrome önerilir)
- Aynı ağda bir mobil cihaz (AR testi için)

### 2️⃣ Hızlı Başlangıç
```bash
# Projeyi klonlayın
git clone https://github.com/kullanici-adi/miray-ar.git
cd miray-ar

# Bağımlılıkları yükleyin
pip install flask flask-cors
```

### 3️⃣ Çalıştırma
**Windows Kullanıcıları:**
Sadece `BASLAT.bat` dosyasına çift tıklayın.

**Manuel (Tüm Sistemler):**
```bash
python server.py
```
Sunucu başladığında size yerel ağ IP'nizi verecektir (örn: `http://192.168.1.10:8000/agaa.html`).

---

## 📱 Kullanım Akışı

1.  **Giriş**: `agaa.html` üzerinden ana arayüze erişin.
2.  **Model Seçimi**:
    - **QR Seçeneği**: Kameranızı başlatın ve tesisat üzerindeki QR kodu taratın.
    - **Manuel Seçenek**: ID kısmına model kodunu (örn: `1001`) yazın.
3.  **Önizleme**: Modeli 3D olarak tarayıcıda inceleyin.
4.  **AR Başlat**: "AR Modunu Başlat" butonuna tıklayıp kameranızı [Hiro Marker](https://jeromeetienne.github.io/AR.js/data/images/HIRO.jpg)'a doğrultun.

### ⌨️ Klavye Kısayolları
- `ESC`: AR modundan çıkış.
- `R`: Pozisyonu sıfırla.
- `N`: Navigasyon halkasını göster/gizle.
- `+ / -`: Zoom kontrolleri.

---

## 🔧 Model Ekleme (Admin)

Yeni bir tesisat modeli eklemek çok kolaydır:

1.  **Dosyayı Hazırlayın**: `.glb` dosyanızı `models/` klasörüne atın.
2.  **JSON Güncelleyin**: `models.json` dosyasına yeni bir ID tanımlayın:
    ```json
    "1234": {
      "name": "Mutfak Tesisatı",
      "description": "Gider boruları ve elektrik hattı",
      "modelUrl": "models/mutfak.glb",
      "scale": 1.2,
      "position": { "x": 0, "y": 0, "z": 0 }
    }
    ```
3.  **Doğrulama**: `KONTROL.bat` çalıştırarak dosya yollarını teyit edin.

---

## 🛠️ Teknik Yapı

Proje, düşük gecikmeli ve yüksek performanslı AR deneyimi için aşağıdaki teknolojileri kullanır:

- **Frontend**: A-Frame & AR.js (Web-based AR engine)
- **Backend**: Flask (Python web framework)
- **Model Viewer**: Google Model-Viewer (PBR rendering)
- **QR Engine**: jsQR
- **Controls**: WASD + Mouse controls for PC, Touch for Mobile.

---

## 📁 Proje Hiyerarşisi

```text
Miray-AR/
├── agaa.html              # Ana arayüz (Dashboard)
├── ghf.js                 # Tüm AR ve uygulama mantığı
├── fg.css                 # Premium Dark-UI stilleri
├── models.json            # Model veritabanı (Single point of truth)
├── server.py              # Yerel ağ yayın sunucusu
├── BASLAT.bat             # Tek tıkla başlatıcı
├── modül/                 # Varlık klasörü (GLB Modelleri)
└── models/                # Yedek model klasörü
```

---

## 🔒 Güvenlik & Notlar
> [!IMPORTANT]
> Bu uygulama yerel ağ (LAN) üzerinde çalışacak şekilde optimize edilmiştir. İnternete açarken SSL (HTTPS) sertifikası gerekmektedir (Kamera izinleri için zorunludur).

---

## 🤝 Katkıda Bulunun
1. Projeyi fork edin.
2. Yeni özellik ekleyin (`git checkout -b feature/yeniozellik`).
3. Değişiklikleri gönderin (`git commit -am 'Geliştirme: X eklendi'`).
4. Pull Request açın!

---

<div align="center">
  
**Miray AR - Geleceği Görün.**  
[Your Name] tarafından ❤️ ile yapıldı.

[![Star on GitHub](https://img.shields.io/github/stars/kullanici-adi/miray-ar?style=social)](https://github.com/kullanici-adi/miray-ar)

</div>
