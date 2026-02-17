// Miray - AR Tesisat Görselleştirme Sistemi
// Model Veritabanı - JSON dosyasından yüklenir
let modelDatabase = {};

// Global state
let currentModel = null;
let arActive = false;
let navVisible = true;
let modelScale = 1;

document.addEventListener('DOMContentLoaded', async () => {
  // Model veritabanını JSON dosyasından yükle
  try {
    const response = await fetch('models.json');
    if (response.ok) {
      modelDatabase = await response.json();
      console.log('Model veritabanı yüklendi:', Object.keys(modelDatabase).length, 'model');
    } else {
      console.error('Model veritabanı yüklenemedi, varsayılan modeller kullanılıyor');
      // Fallback: Boş veritabanı
      modelDatabase = {};
    }
  } catch (error) {
    console.error('Model veritabanı yükleme hatası:', error);
    modelDatabase = {};
  }

  // HTTPS kontrolü - kamera erişimi için gerekli (sessiz mod)
  const isSecureContext = window.isSecureContext || location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1';

  if (!isSecureContext && location.protocol === 'file:') {
    // Uyarı mesajı kaldırıldı - sadece konsola yaz
    console.warn('Kamera erişimi file:// protokolünde çalışmayabilir. HTTPS veya localhost önerilir.');
  }

  let stream = null;
  const cameraFeed = document.getElementById('cameraFeed');
  const qrImage = document.querySelector('.qr-img');
  const startButton = document.getElementById('startCamera');
  const stopButton = document.getElementById('stopCamera');
  const mainView = document.getElementById('mainView');
  const arView = document.getElementById('arView');
  const modelIdInput = document.getElementById('modelId');
  const loadModelBtn = document.getElementById('loadModel');
  const startARBtn = document.getElementById('startAR');
  const exitARBtn = document.getElementById('exitAR');
  const resetViewBtn = document.getElementById('resetView');
  const toggleNavBtn = document.getElementById('toggleNav');
  const zoomInBtn = document.getElementById('zoomIn');
  const zoomOutBtn = document.getElementById('zoomOut');
  const modelDescription = document.getElementById('modelDescription');
  const previewModel = document.getElementById('previewModel');
  const modelEntity = document.getElementById('modelEntity');
  const navControls = document.getElementById('navControls');

  // PWA Install Logic
  let deferredPrompt;
  const installBtn = document.getElementById('installApp');

  window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent Chrome 67 and earlier from automatically showing the prompt
    e.preventDefault();
    // Stash the event so it can be triggered later.
    deferredPrompt = e;
    // Update UI to notify the user they can add to home screen
    if (installBtn) installBtn.classList.remove('hidden');

    console.log('📲 Uygulama yüklenebilir durumda');
  });

  if (installBtn) {
    installBtn.addEventListener('click', (e) => {
      // hide our user interface that shows our A2HS button
      installBtn.classList.add('hidden');
      // Show the prompt
      if (deferredPrompt) {
        deferredPrompt.prompt();
        // Wait for the user to respond to the prompt
        deferredPrompt.userChoice.then((choiceResult) => {
          if (choiceResult.outcome === 'accepted') {
            console.log('✅ Kullanıcı uygulamayı yükledi');
          } else {
            console.log('❌ Kullanıcı yüklemeyi reddetti');
          }
          deferredPrompt = null;
        });
      }
    });
  }

  let scanning = false;
  const scanCanvas = document.createElement('canvas');
  const scanCtx = scanCanvas.getContext('2d');

  // UI Helper Functions
  function uiShowCamera() {
    qrImage.classList.add('hidden');
    cameraFeed.classList.remove('hidden');
    startButton.classList.add('hidden');
    stopButton.classList.remove('hidden');
  }

  function uiHideCamera() {
    qrImage.classList.remove('hidden');
    cameraFeed.classList.add('hidden');
    startButton.classList.remove('hidden');
    stopButton.classList.add('hidden');
  }

  // VR (PC) ve AR Değişkenleri
  const vrView = document.getElementById('vrView');
  const vrModelEntity = document.getElementById('vrModelEntity');
  const exitVRBtn = document.getElementById('exitVR');
  let vrActive = false;

  if (exitVRBtn) {
    exitVRBtn.addEventListener('click', showMainView);
  }

  function showMainView() {
    mainView.classList.remove('hidden');
    arView.classList.add('hidden');
    if (vrView) vrView.classList.add('hidden');
    arActive = false;
    vrActive = false;
    if (stream) {
      stopCamera();
    }
  }

  function showARView() {
    if (!currentModel) {
      alert('⚠️ Önce bir model yükleyin!');
      return;
    }

    // PC / Mobil Kontrolü
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 900;

    if (!isMobile) {
      // PC Modu (VR)
      if (confirm('🖥️ Bilgisayar modu algılandı.\n\n"Tam Ekran 3D" modunda açılsın mı?\n(Hayır derseniz Kamera/AR modu açılır)')) {
        showVRView();
        return;
      }
    }

    mainView.classList.add('hidden');
    arView.classList.remove('hidden');
    if (vrView) vrView.classList.add('hidden');
    arActive = true;
    vrActive = false;
    loadModelToScene(modelEntity);
  }

  function showVRView() {
    mainView.classList.add('hidden');
    arView.classList.add('hidden');
    if (vrView) vrView.classList.remove('hidden');
    arActive = false;
    vrActive = true;
    loadModelToScene(vrModelEntity);
  }

  // Ortak Model Yükleyici (Hem AR hem VR için)
  function loadModelToScene(entity) {
    if (!currentModel || !entity) return;
    const modelData = currentModel;
    const modelUrl = modelData.modelUrl;

    console.log('🔄 Model Sahnede Yükleniyor:', modelData.name);

    // Temizle
    entity.removeAttribute('gltf-model');

    setTimeout(() => {
      entity.setAttribute('gltf-model', modelUrl);
      entity.setAttribute('position', `${modelData.position.x} ${modelData.position.y} ${modelData.position.z}`);
      entity.setAttribute('rotation', `${modelData.rotation.x} ${modelData.rotation.y} ${modelData.rotation.z}`);
      entity.setAttribute('scale', `${modelScale} ${modelScale} ${modelScale}`);

      // Animasyon (Sadece AR için, VR'da sabit dursun veya opsiyonel)
      if (arActive) {
        entity.setAttribute('animation', `property: rotation; to: ${modelData.rotation.x} ${modelData.rotation.y + 360} ${modelData.rotation.z}; loop: true; dur: 10000`);
      } else {
        entity.removeAttribute('animation');
      }
    }, 100);
  }

  function loadModel(modelId) {
    const modelData = modelDatabase[modelId];
    if (!modelData) {
      alert('⚠️ Model bulunamadı: ' + modelId);
      return false;
    }

    currentModel = { id: modelId, ...modelData };
    modelScale = modelData.scale;

    // Önizleme modelini güncelle
    if (previewModel) {
      previewModel.src = currentModel.modelUrl;
      previewModel.alt = modelData.name;
    }

    // Açıklamayı güncelle
    if (modelDescription) {
      modelDescription.textContent = modelData.description;
    }

    console.log('Model yüklendi:', currentModel);
    return true;
  }

  function loadModelToAR() {
    // Eski fonksiyon artık kullanılmıyor, showARView içinde loadModelToScene kullanılıyor.
    // Uyumluluk için bırakıldı.
    showARView();
  }


  // Kamera Fonksiyonları - Mobil uyumlu
  async function startCamera() {
    // 1. Önce cihazda kamera var mı kontrol et
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');

      if (videoDevices.length === 0) {
        alert('⚠️ Cihazınızda kamera bulunamadı!\n\n' +
          'Bu cihazda algılanan bir kamera yok. Eğer bir web kamerası kullanıyorsanız, bağlantısını kontrol edin.');
        return;
      }
      console.log('Algılanan kamera sayısı:', videoDevices.length);
    } catch (err) {
      console.warn('Cihaz listesi alınamadı:', err);
      // Hata olsa bile devam et, belki getUserMedia çalışır
    }

    // Mobil ve masaüstü için güvenli bağlam kontrolü
    const isSecure = window.isSecureContext ||
      location.protocol === 'https:' ||
      (location.hostname === 'localhost' || location.hostname === '127.0.0.1');

    if (!isSecure) {
      // Otomatik yönlendirme teklifi
      if (confirm('⚠️ KAMERA İÇİN HTTPS GEREKLİ ⚠️\n\n' +
        'Kamera erişimi için güvenli bağlantı (HTTPS) zorunludur.\n\n' +
        'Güvenli bağlantıya şimdi geçilsin mi?\n' +
        '(Not: "Güvenli Değil" uyarısı alırsanız Gelişmiş -> Devam Et seçeneğini kullanın)')) {
        location.protocol = 'https:';
      }
      return;
    }

    // Eski tarayıcılar için fallback API'leri kontrol et
    const legacyGetUserMedia = navigator.getUserMedia ||
      navigator.webkitGetUserMedia ||
      navigator.mozGetUserMedia ||
      navigator.msGetUserMedia;

    // Modern API var mı?
    const hasModernAPI = navigator.mediaDevices && navigator.mediaDevices.getUserMedia;

    // Hiçbir API yoksa hata ver
    if (!hasModernAPI && !legacyGetUserMedia) {
      alert('⚠️ Tarayıcı kamerayı desteklemiyor.\n\n' +
        'Lütfen Chrome, Firefox veya Safari kullanın.\n' +
        'Tarayıcı sürümünüzü güncelleyin.');
      return;
    }

    try {
      // Mobil cihazlar için daha esnek constraints
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

      let constraints = {
        video: {
          facingMode: { ideal: 'environment' }, // Mobil için arka kamera
          width: { ideal: isMobile ? 640 : Math.min(window.innerWidth, 1280) },
          height: { ideal: isMobile ? 480 : Math.min(window.innerHeight, 720) }
        },
        audio: false
      };

      // Modern API varsa kullan
      if (hasModernAPI) {
        // Önce ideal constraints ile dene
        try {
          stream = await navigator.mediaDevices.getUserMedia(constraints);
        } catch (firstError) {
          console.warn('İlk deneme başarısız, alternatif deneniyor...', firstError);

          // Alternatif 1: Sadece facingMode değiştir
          constraints.video.facingMode = 'environment';
          try {
            stream = await navigator.mediaDevices.getUserMedia(constraints);
          } catch (secondError) {
            console.warn('İkinci deneme başarısız, minimal constraints deneniyor...', secondError);

            // Alternatif 2: Minimal constraints (herhangi bir kamera)
            constraints.video = {
              facingMode: { ideal: 'environment' }
            };
            try {
              stream = await navigator.mediaDevices.getUserMedia(constraints);
            } catch (thirdError) {
              console.warn('Üçüncü deneme başarısız, en basit constraints deneniyor...', thirdError);

              // Alternatif 3: En basit (herhangi bir kamera)
              constraints.video = true;
              stream = await navigator.mediaDevices.getUserMedia(constraints);
            }
          }
        }
      } else {
        // Eski API kullan (callback tabanlı) - daha basit constraints
        return new Promise(async (resolve, reject) => {
          const onSuccess = async (mediaStream) => {
            stream = mediaStream;
            await handleStreamSuccess();
            resolve();
          };

          const onError = (err) => {
            console.error('Eski API kamera hatası:', err);
            showCameraError(err);
            reject(err);
          };

          // Eski API için en basit constraints (herhangi bir kamera)
          try {
            legacyGetUserMedia.call(navigator, { video: true, audio: false }, onSuccess, onError);
          } catch (e) {
            showCameraError(e);
            reject(e);
          }
        });
      }

      // Stream başarıyla alındı, işle (modern API için)
      await handleStreamSuccess();
    } catch (err) {
      console.error('Kamera erişim hatası:', err);
      showCameraError(err);
    }
  }

  // Stream başarıyla alındığında çağrılır
  async function handleStreamSuccess() {
    if (!stream) return;

    // Video elementine bağla
    cameraFeed.srcObject = stream;

    // Mobil için özel ayarlar
    cameraFeed.setAttribute('playsinline', 'true');
    cameraFeed.setAttribute('webkit-playsinline', 'true');

    // Video oynatmayı bekle
    try {
      await cameraFeed.play();
    } catch (err) {
      console.warn('Video play hatası:', err);
      // Yine de devam et
    }

    const videoTrack = stream.getVideoTracks()[0];
    if (videoTrack) {
      const settings = videoTrack.getSettings ? videoTrack.getSettings() : {};
      console.log('Kamera açıldı:', {
        facingMode: settings.facingMode || 'bilinmiyor',
        width: settings.width || videoTrack.getSettings?.()?.width || 'bilinmiyor',
        height: settings.height || videoTrack.getSettings?.()?.height || 'bilinmiyor'
      });
    }

    uiShowCamera();
    scanning = true;
    requestAnimationFrame(scanFrame);
  }

  // Kamera hatalarını göster
  function showCameraError(err) {
    let msg = '';

    if (!err || !err.name) {
      msg = '⚠️ Kamera açılamadı!\n\n' +
        'Lütfen:\n' +
        '1. Tarayıcı ayarlarından kamera iznini kontrol edin\n' +
        '2. Sayfayı yenileyin\n' +
        '3. Farklı bir tarayıcı deneyin (Chrome, Firefox, Safari)';
    } else if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
      msg = '⚠️ Kamera izni reddedildi!\n\n' +
        'Lütfen tarayıcı ayarlarından kamera iznini açın:\n' +
        '• Chrome: Adres çubuğundaki kilit simgesine tıklayın > Kamera > İzin ver\n' +
        '• Safari: Ayarlar > Safari > Kamera\n' +
        '• Firefox: Ayarlar > Gizlilik > Kamera\n\n' +
        'Sayfayı yenileyip tekrar deneyin.';
    } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
      msg = '⚠️ Kamera bulunamadı!\n\n' +
        'Cihazınızda bir kamera olduğundan emin olun.';
    } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError' || err.name === 'SourceUnavailableError') {
      msg = '⚠️ Kamera kullanımda!\n\n' +
        'Başka bir uygulama kamerayı kullanıyor olabilir.\n' +
        'Diğer uygulamaları kapatıp tekrar deneyin.';
    } else if (err.name === 'OverconstrainedError' || err.name === 'ConstraintNotSatisfiedError') {
      msg = '⚠️ Kamera ayarları desteklenmiyor!\n\n' +
        'Cihazınızın kamerası bu ayarları desteklemiyor.\n' +
        'Farklı bir tarayıcı deneyin.';
    } else {
      msg = '⚠️ Kamera açılamadı!\n\n' +
        'Hata: ' + (err.message || err.name || 'Bilinmeyen hata') + '\n\n' +
        'Lütfen:\n' +
        '1. Tarayıcı ayarlarından kamera iznini kontrol edin\n' +
        '2. Sayfayı yenileyin\n' +
        '3. Farklı bir tarayıcı deneyin (Chrome önerilir)';
    }

    alert(msg);
  }

  function stopCamera() {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      stream = null;
      cameraFeed.srcObject = null;
    }
    scanning = false;
    uiHideCamera();
  }

  function scanFrame() {
    if (!scanning || !stream) return;
    const video = cameraFeed;

    if (video.readyState < 2) {
      requestAnimationFrame(scanFrame);
      return;
    }

    scanCanvas.width = video.videoWidth;
    scanCanvas.height = video.videoHeight;
    scanCtx.drawImage(video, 0, 0, scanCanvas.width, scanCanvas.height);

    const imageData = scanCtx.getImageData(0, 0, scanCanvas.width, scanCanvas.height);
    const code = jsQR(imageData.data, imageData.width, imageData.height);

    if (code && code.data) {
      const modelId = code.data.trim();
      modelIdInput.value = modelId;

      if (loadModel(modelId)) {
        stopCamera();
        alert('✅ QR okundu: ' + modelId + '\n\nModel yüklendi: ' + currentModel.name);
      } else {
        stopCamera();
        alert('⚠️ QR okundu: ' + modelId + '\n\nAncak model bulunamadı.');
      }
    } else {
      requestAnimationFrame(scanFrame);
    }
  }

  // AR Kontrol Fonksiyonları
  function resetARView() {
    if (!modelEntity || !currentModel) return;

    const modelData = currentModel;
    modelScale = modelData.scale;
    modelEntity.setAttribute('scale', `${modelScale} ${modelScale} ${modelScale}`);
    modelEntity.setAttribute('position', '0 0 0');
    modelEntity.setAttribute('rotation', '0 0 0');
  }

  function toggleNavigation() {
    navVisible = !navVisible;
    if (navControls) {
      navControls.setAttribute('visible', navVisible);
    }
    toggleNavBtn.textContent = navVisible ? 'Navigasyon (Açık)' : 'Navigasyon (Kapalı)';
  }

  function zoomIn() {
    if (!modelEntity) return;
    modelScale = Math.min(modelScale * 1.2, 5);
    modelEntity.setAttribute('scale', `${modelScale} ${modelScale} ${modelScale}`);
  }

  function zoomOut() {
    if (!modelEntity) return;
    modelScale = Math.max(modelScale / 1.2, 0.2);
    modelEntity.setAttribute('scale', `${modelScale} ${modelScale} ${modelScale}`);
  }

  // Event Listeners
  startButton.addEventListener('click', startCamera);
  stopButton.addEventListener('click', stopCamera);

  modelIdInput.addEventListener('change', function () {
    const modelId = this.value.trim();
    if (modelId) {
      loadModel(modelId);
    }
  });

  modelIdInput.addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
      const modelId = this.value.trim();
      if (modelId) {
        loadModel(modelId);
      }
    }
  });

  loadModelBtn.addEventListener('click', function () {
    const modelId = modelIdInput.value.trim();
    if (modelId) {
      if (loadModel(modelId)) {
        alert('✅ Model yüklendi: ' + currentModel.name);
      }
    } else {
      alert('⚠️ Lütfen bir model ID girin');
    }
  });

  startARBtn.addEventListener('click', showARView);
  exitARBtn.addEventListener('click', showMainView);
  resetViewBtn.addEventListener('click', resetARView);
  toggleNavBtn.addEventListener('click', toggleNavigation);
  zoomInBtn.addEventListener('click', zoomIn);
  zoomOutBtn.addEventListener('click', zoomOut);

  // Klavye kısayolları
  document.addEventListener('keydown', function (e) {
    if (arActive) {
      if (e.key === 'Escape') {
        showMainView();
      } else if (e.key === 'r' || e.key === 'R') {
        resetARView();
      } else if (e.key === 'n' || e.key === 'N') {
        toggleNavigation();
      } else if (e.key === '+' || e.key === '=') {
        zoomIn();
      } else if (e.key === '-' || e.key === '_') {
        zoomOut();
      }
    }
  });

  // Ekran boyutu değişikliği
  window.addEventListener('resize', () => {
    if (!stream) return;
    const track = stream.getVideoTracks()[0];
    if (!track || !track.applyConstraints) return;
    try {
      track.applyConstraints({
        width: Math.min(window.innerWidth, 1280),
        height: Math.min(window.innerHeight, 720)
      }).catch(() => { });
    } catch (e) {
      // ignore
    }
  });

  // AR.js marker tespit eventi
  const marker = document.getElementById('marker');
  if (marker) {
    marker.addEventListener('markerFound', function () {
      console.log('Marker tespit edildi!');
    });

    marker.addEventListener('markerLost', function () {
      console.log('Marker kayboldu');
    });
  }

  // --- ARABA KONTROL SİSTEMİ ---
  const carControls = document.getElementById('carControls');
  const btnUp = document.getElementById('btnUp');
  const btnDown = document.getElementById('btnDown');
  const btnLeft = document.getElementById('btnLeft');
  const btnRight = document.getElementById('btnRight');
  const driftToggle = document.getElementById('driftModeBtn');

  // Araba Fizik Değişkenleri
  let carActive = false;
  let carSpeed = 0;
  let carTurn = 0;
  let carX = 0;
  let carZ = 0;
  let carRotation = 0;
  let driftMode = false;

  // Kontrol Durumları
  const keys = { w: false, s: false, a: false, d: false };

  // Fizik Sabitleri
  const ACCEL = 0.005;
  const DECEL = 0.003;
  const MAX_SPEED = 0.15;
  const TURN_SPEED = 2; // derece
  const DRIFT_FACTOR = 3.5; // Drift dönüş çarpanı

  // Buton Eventleri (Dokunmatik ve Mouse)
  const addBtnEvents = (btn, key) => {
    if (!btn) return;
    const start = (e) => { e.preventDefault(); keys[key] = true; };
    const end = (e) => { e.preventDefault(); keys[key] = false; };
    btn.addEventListener('mousedown', start);
    btn.addEventListener('touchstart', start);
    btn.addEventListener('mouseup', end);
    btn.addEventListener('touchend', end);
    btn.addEventListener('mouseleave', end);
  };

  addBtnEvents(btnUp, 'w');
  addBtnEvents(btnDown, 's');
  addBtnEvents(btnLeft, 'a');
  addBtnEvents(btnRight, 'd');

  if (driftToggle) {
    driftToggle.addEventListener('change', (e) => {
      driftMode = e.target.checked;
      console.log('Drift Modu:', driftMode ? 'AÇIK' : 'KAPALI');
    });
  }

  // updateCarPhysics her frame çalışacak
  function updateCarPhysics() {
    if (!carActive || !modelEntity || !currentModel || currentModel.type !== 'car') return;

    // Hızlanma / Yavaşlama
    if (keys.w) {
      carSpeed = Math.min(carSpeed + ACCEL, MAX_SPEED);
    } else if (keys.s) {
      carSpeed = Math.max(carSpeed - ACCEL, -MAX_SPEED / 2);
    } else {
      // Sürtünme
      if (carSpeed > 0) carSpeed = Math.max(carSpeed - DECEL, 0);
      else if (carSpeed < 0) carSpeed = Math.min(carSpeed + DECEL, 0);
    }

    // Dönüş
    if (Math.abs(carSpeed) > 0.001) {
      let turnMultiplier = driftMode ? DRIFT_FACTOR : 1;
      let direction = carSpeed > 0 ? 1 : -1; // Geri giderken ters dönme

      if (keys.a) {
        carRotation += TURN_SPEED * turnMultiplier * direction;
      }
      if (keys.d) {
        carRotation -= TURN_SPEED * turnMultiplier * direction;
      }
    }

    // Pozisyon Güncelleme (Basit trigonometri)
    // Three.js koordinat sistemi: -Z ileri, +X sağ
    const rad = carRotation * (Math.PI / 180);

    // Drift kayması (Drift modundaysa yana doğru da kayar)
    // Şimdilik basit ileri hareket:
    carX -= Math.sin(rad) * carSpeed; // A-Frame'de eksenler farklı olabilir, deneyerek bulacağız
    carZ -= Math.cos(rad) * carSpeed;

    // Entity güncelleme
    // Local pozisyon yerine global marker altındaki pozisyonu güncelliyoruz
    // Başlangıç pozisyonuna göre offset ekliyoruz
    const baseX = currentModel.position.x;
    const baseZ = currentModel.position.z; // Yükseklik hep 0 veya modelin Y'si

    // Model entity'sini güncelle
    // Not: A-Frame entity.object3D.position doğrudan erişilebilir
    modelEntity.object3D.position.x = baseX + carX;
    modelEntity.object3D.position.z = baseZ + carZ;

    // Rotasyon (Y ekseni etrafında)
    // Başlangıç rotasyonunu ekle
    modelEntity.object3D.rotation.y = (carRotation + currentModel.rotation.y) * (Math.PI / 180);
  }

  // Model Yüklendiğinde Araba Kontrolü Kontrolü
  // loadModel fonksiyonunun sonuna eklenen logic ile entegre çalışacak
  // Ancak loadModel içinde UI güncellemesi yapmamız lazım.
  // Bu yüzden loadModel fonksiyonunu override edemiyoruz, 
  // ama bir mutation observer veya mevcut loadModel'i modifiye edebiliriz.
  // Daha basit: loadModel fonksiyonunu yukarıda bulup içine eklemek yerine,
  // her frame'de kontrol eden bir loop kuralım.

  // Game Loop
  function gameLoop() {
    requestAnimationFrame(gameLoop);

    if (arActive && currentModel && currentModel.type === 'car') {
      // Araba modu aktifse kontrolleri göster
      if (!carActive) {
        carActive = true;
        carControls.classList.remove('hidden');
        // Pozisyonları sıfırla
        carSpeed = 0;
        carTurn = 0;
        carX = 0;
        carZ = 0;
        carRotation = 0;
      }
      updateCarPhysics();
    } else {
      // Araba değilse gizle
      if (carActive) {
        carActive = false;
        carControls.classList.add('hidden');
      }
    }
  }

  // Döngüyü başlat
  gameLoop();

  console.log('Miray AR sistemi hazır!');

  // URL Parametresi Kontrolü (Otomatik Model Yükleme)
  const urlParams = new URLSearchParams(window.location.search);
  const autoModelId = urlParams.get('id') || urlParams.get('model');

  if (autoModelId) {
    console.log('🔗 URL parametresi algılandı:', autoModelId);
    // Veritabanının hazır olmasını bekle (zaten await fetch ile yüklendi yukarıda)
    if (modelDatabase[autoModelId]) {
      loadModel(autoModelId);
      if (modelIdInput) modelIdInput.value = autoModelId;
      // İsteğe bağlı: Otomatik AR başlat
      if (urlParams.get('ar') === 'true' || urlParams.get('ar') === '1') {
        showARView();
      }
    } else {
      console.warn('⚠️ URL parametresindeki model bulunamadı:', autoModelId);
    }
  }
});
