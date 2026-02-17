@echo off
setlocal enabledelayedexpansion
chcp 65001 >nul
cd /d "%~dp0"

title Miray AR - Sunucu Baslat
color 0B
cls

echo.
echo   ███╗   ███╗██╗██████╗  █████╗ ██╗   ██╗
echo   ████╗ ████║██║██╔══██╗██╔══██╗╚██╗ ██╔╝
echo   ██╔████╔██║██║██████╔╝███████║ ╚████╔╝ 
echo   ██║╚██╔╝██║██║██╔══██╗██╔══██║  ╚██╔╝  
echo   ██║ ╚═╝ ██║██║██║  ██║██║  ██║   ██║   
echo   ╚═╝     ╚═╝╚═╝╚═╝  ╚═╝╚═╝  ╚═╝   ╚═╝   
echo.
echo   AR Tesisat Gorsellestirme - Sunucu Baslat
echo   ===========================================
echo.

:: Python kontrolü
echo [Kontrol] Python araniyor...
python --version >nul 2>&1
if errorlevel 1 (
    color 0C
    echo [HATA] Python bulunamadi!
    echo.
    echo Python indirin: https://www.python.org/downloads/
    echo.
    pause
    exit /b 1
)
echo [OK] Python bulundu
echo.

:: Flask kontrolü
echo [Kontrol] Flask kontrol ediliyor...
python -c "import flask" >nul 2>&1
if errorlevel 1 (
    echo [Bilgi] Flask yukleniyor...
    pip install flask flask-cors >nul 2>&1
    if errorlevel 1 (
        color 0C
        echo [HATA] Flask yuklenemedi!
        echo.
        echo Manuel yukleme: pip install flask flask-cors
        echo.
        pause
        exit /b 1
    )
    echo [OK] Flask yuklendi
) else (
    echo [OK] Flask mevcut
)
echo.

:: Port temizleme
echo [Temizlik] Port 8000 kontrol ediliyor...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":8000.*LISTENING" 2^>nul') do (
    echo     Eski surec kapatiliyor: %%a
    taskkill /F /PID %%a >nul 2>&1
)
timeout /t 1 >nul
echo [OK] Port hazir
echo.

:: Dosya kontrolü
if not exist "server.py" (
    color 0C
    echo [HATA] server.py bulunamadi!
    pause
    exit /b 1
)
if not exist "agaa.html" (
    color 0C
    echo [HATA] agaa.html bulunamadi!
    pause
    exit /b 1
)
echo [OK] Dosyalar mevcut
echo.

:: IP adresi bulma
echo [Bilgi] IP adresi aliniyor...
for /f "tokens=2 delims=:" %%i in ('ipconfig ^| findstr /i "IPv4" 2^>nul') do (
    set "temp=%%i"
    set "LOCAL_IP=!temp: =!"
    goto :ipfound
)
set "LOCAL_IP="
:ipfound
if defined LOCAL_IP (
    echo [OK] IP: !LOCAL_IP!
) else (
    echo [!] IP bulunamadi
)
echo.

:: Firewall kontrolü
echo [Bilgi] Firewall kontrol ediliyor...
netsh advfirewall firewall show rule name="Miray AR Server" >nul 2>&1
if errorlevel 1 (
    echo [!] Firewall kurali yok - port acilacak
    echo     Yonetici izni gerekebilir!
    netsh advfirewall firewall add rule name="Miray AR Server" dir=in action=allow protocol=TCP localport=8000 >nul 2>&1
    if errorlevel 1 (
        echo [UYARI] Firewall kurali eklenemedi
        echo     Yonetici olarak calistirin veya manuel ekleyin
    ) else (
        echo [OK] Firewall kurali eklendi
    )
) else (
    echo [OK] Firewall kurali mevcut
)
echo.

:: Sunucu başlatma
echo [Baslat] Sunucu baslatiliyor...
echo.
start /min "Miray Server" python server.py
timeout /t 3 >nul

:: Başarı kontrolü
set "SUCCESS=0"
for /L %%i in (1,1,10) do (
    netstat -ano | findstr ":8000.*LISTENING" >nul 2>&1
    if not errorlevel 1 (
        set "SUCCESS=1"
        goto :check_done
    )
    timeout /t 1 >nul
)
:check_done

cls
if !SUCCESS!==1 (
    color 0A
    echo.
    echo   ╔═══════════════════════════════════════════════════════╗
    echo   ║          ✓ SUNUCU BASARIYLA BASLATILDI!             ║
    echo   ╚═══════════════════════════════════════════════════════╝
    echo.
    echo   BILGISAYAR:
    echo     http://localhost:8000/agaa.html
    echo     http://127.0.0.1:8000/agaa.html
    echo.
    if defined LOCAL_IP (
        echo   TELEFON (Ayni WiFi):
        echo     http://!LOCAL_IP!:8000/agaa.html
        echo.
        echo   ⚠️  Telefonunuz ayni WiFi aginda olmali!
        echo.
    )
    echo   ════════════════════════════════════════════════════════
    echo.
    echo   Google Chrome aciliyor...
    timeout /t 2 >nul
    
    :: Chrome'u bul ve aç
    set "CHROME_PATH="
    if exist "%ProgramFiles%\Google\Chrome\Application\chrome.exe" (
        set "CHROME_PATH=%ProgramFiles%\Google\Chrome\Application\chrome.exe"
    ) else if exist "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe" (
        set "CHROME_PATH=%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe"
    ) else if exist "%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe" (
        set "CHROME_PATH=%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe"
    )
    
    if defined CHROME_PATH (
        start "" "!CHROME_PATH!" http://localhost:8000/agaa.html
        echo   ✓ Google Chrome acildi!
    ) else (
        echo   [!] Chrome bulunamadi, varsayilan tarayici kullaniliyor...
        start http://localhost:8000/agaa.html
        echo   ✓ Tarayici acildi!
    )
    
    timeout /t 1 >nul
    echo   ✓ Sunucu arka planda calisiyor.
    echo   ✓ Durdurmak icin: taskkill /F /IM python.exe
    echo.
) else (
    color 0C
    echo.
    echo   ╔═══════════════════════════════════════════════════════╗
    echo   ║          ✗ SUNUCU BASLATILAMADI                      ║
    echo   ╚═══════════════════════════════════════════════════════╝
    echo.
    echo   Cozum:
    echo   1. Manuel test: python server.py
    echo   2. Flask yuklu mu: pip install flask flask-cors
    echo   3. Port kontrol: netstat -ano ^| findstr :8000
    echo   4. Yonetici olarak calistirin
    echo.
)

pause

