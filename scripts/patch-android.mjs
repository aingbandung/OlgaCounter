// Menambah izin kamera/mikrofon & deklarasi layanan suara (STT + TTS) ke AndroidManifest hasil `cap add android`.
import { readFileSync, writeFileSync } from 'node:fs';
const f = 'android/app/src/main/AndroidManifest.xml';
let x = readFileSync(f, 'utf8');
const add = [
  ['android.permission.CAMERA', '<uses-permission android:name="android.permission.CAMERA" />'],
  ['android.permission.RECORD_AUDIO', '<uses-permission android:name="android.permission.RECORD_AUDIO" />'],
  ['android.permission.MODIFY_AUDIO_SETTINGS', '<uses-permission android:name="android.permission.MODIFY_AUDIO_SETTINGS" />'],
  ['android.hardware.camera"', '<uses-feature android:name="android.hardware.camera" android:required="false" />'],
  ['android.hardware.camera.front', '<uses-feature android:name="android.hardware.camera.front" android:required="false" />'],
].filter(([k]) => !x.includes(k)).map(([, v]) => '    ' + v).join('\n');
if (add) x = x.replace('</manifest>', add + '\n</manifest>');

// Android 11+: aplikasi harus mendeklarasikan layanan yang ingin ditemukan (speech recognition & TTS)
const intents = [
  ['android.speech.RecognitionService', '<intent><action android:name="android.speech.RecognitionService" /></intent>'],
  ['android.intent.action.TTS_SERVICE', '<intent><action android:name="android.intent.action.TTS_SERVICE" /></intent>'],
].filter(([k]) => !x.includes(k)).map(([, v]) => '        ' + v).join('\n');
if (intents) {
  if (x.includes('</queries>')) x = x.replace('</queries>', intents + '\n    </queries>');
  else x = x.replace('</manifest>', '    <queries>\n' + intents + '\n    </queries>\n</manifest>');
}
writeFileSync(f, x);
console.log('AndroidManifest diperbarui');
