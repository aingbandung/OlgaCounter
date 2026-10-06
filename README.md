# Stopwatch Latihan (APK)

OlgaCounter + penghitung **Push-up / Sit-up** dari kamera (MediaPipe Pose), dibungkus dengan
[Capacitor](https://capacitorjs.com) menjadi APK lewat **GitHub Actions**. Tidak perlu Android Studio.

## Cara membuat APK
1. Buat repo baru di GitHub, lalu upload **isi** folder ini (termasuk folder `.github`).
   Via terminal:
   ```bash
   git init && git add . && git commit -m "first"
   git branch -M main
   git remote add origin https://github.com/USERNAME/REPO.git
   git push -u origin main
   ```
2. Buka tab **Actions** > workflow **Build APK** (jalan otomatis tiap push; atau klik **Run workflow**).
3. Tunggu sekitar 5–10 menit. Setelah hijau, buka run tersebut > bagian **Artifacts** >
   unduh **stopwatch-latihan-apk** > ekstrak zip > `app-debug.apk`.
4. Pindahkan ke HP, izinkan "Install dari sumber tidak dikenal", lalu install.
   Saat dibuka, izinkan **Kamera** dan **Mikrofon**.

Ingin APK ada di halaman Releases? Push tag: `git tag v1.0.0 && git push origin v1.0.0`.

## Mengubah aplikasi
Semua kode ada di `www/index.html`. Edit, commit, push; APK baru dibuat otomatis.

## Cara kerja singkat
| Bagian | Fungsi |
|---|---|
| `www/index.html` | Aplikasi (Stopwatch, Push-up, Sit-up) |
| `www/native-bridge.js` | Aktif hanya di APK: memakai MediaPipe/model offline dari `www/vendor`, dan menyambungkan perintah suara ke plugin native (WebView Android tidak punya SpeechRecognition) |
| `scripts/prepare-vendor.mjs` | Saat build: menyalin MediaPipe dan mengunduh model pose (`full` dan `lite`) |
| `scripts/patch-android.mjs` | Menambah izin kamera/mikrofon ke AndroidManifest |
| `.github/workflows/build-apk.yml` | Pipeline build |

## Catatan
- **Perintah suara** memakai layanan suara Google di HP (perlu "Google" / Speech Services terpasang, dan biasanya
  koneksi internet). Android bisa mengeluarkan bunyi "ding" kecil tiap mikrofon dimulai ulang; itu perilaku sistem.
- Penghitung kamera berjalan **offline** (model ikut di dalam APK, ukuran APK sekitar 25–30 MB).
- APK yang dihasilkan adalah **debug** (ditandatangani kunci debug), cukup untuk dipasang sendiri.
  Untuk Play Store perlu build release + keystore sendiri.
- Ikon masih bawaan Capacitor. Untuk ikon sendiri, tambahkan `resources/icon.png` dan pakai `@capacitor/assets`.
