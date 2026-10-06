// Menyalin MediaPipe dari node_modules & mengunduh model pose ke www/vendor agar APK jalan OFFLINE.
import { copyFileSync, mkdirSync, writeFileSync, existsSync, statSync } from 'node:fs';
const src = 'node_modules/@mediapipe/tasks-vision', out = 'www/vendor';
mkdirSync(out, { recursive: true });
for (const [from, to] of [
  ['vision_bundle.mjs', 'vision_bundle.js'],
  ['wasm/vision_wasm_internal.js', 'vision_wasm_internal.js'],
  ['wasm/vision_wasm_internal.wasm', 'vision_wasm_internal.wasm'],
]) { copyFileSync(`${src}/${from}`, `${out}/${to}`); console.log('copy', to); }

if (process.env.SKIP_MODELS) process.exit(0);

const base = 'https://storage.googleapis.com/mediapipe-models/pose_landmarker';
// Beberapa URL kandidat per model (versi 'latest' dicoba dulu, lalu '1')
const urls = (k) => ['latest', '1'].map(v => `${base}/pose_landmarker_${k}/float16/${v}/pose_landmarker_${k}.task`);

const failed = [];
for (const k of ['full', 'lite']) {
  const f = `${out}/pose_landmarker_${k}.task`;
  if (existsSync(f) && statSync(f).size > 1e6) { console.log('ada', f); continue; }
  let ok = false;
  for (const url of urls(k)) {
    for (let i = 1; i <= 3 && !ok; i++) {
      try {
        const r = await fetch(url);
        if (!r.ok) throw new Error('HTTP ' + r.status);
        const buf = Buffer.from(await r.arrayBuffer());
        if (buf.length < 1e6) throw new Error('file terlalu kecil: ' + buf.length);
        writeFileSync(f, buf); ok = true;
        console.log('unduh', url, (buf.length / 1e6).toFixed(1) + ' MB');
      } catch (e) {
        console.warn(`gagal (${url}) percobaan ${i}: ${e.message}`);
        await new Promise(r => setTimeout(r, 2000 * i));
      }
    }
    if (ok) break;
  }
  if (!ok) { console.error('Gagal mengunduh model ' + k); failed.push(k); }
}
// Gagal hanya kalau SEMUA model gagal (minimal satu model dibutuhkan agar app bisa jalan offline)
if (failed.length === 2) process.exit(1);
