/**
 * ═══════════════════════════════════════════════════════════════════════════
 * main.js — Entry Module v2.1.1 (HOTFIX)
 * ═══════════════════════════════════════════════════════════════════════════
 * v2.1.1:
 *  ✅ HAPUS blok orphan kedua setelah IIFE utama yang menyebabkan
 *     ReferenceError (logModuleStatus out of scope) → module gagal
 *     menyelesaikan evaluasi.
 *  ✅ Sisakan satu definisi window.__main (versi 2.1.1).
 * ═══════════════════════════════════════════════════════════════════════════
 */

// ─── AutoConfig layer (side-effect import) ───
import './auto-config.js';
import './auto-config-backup.js';

(function () {
  'use strict';

  if (window.__MAIN_V2_LOADED) return;
  window.__MAIN_V2_LOADED = true;

  console.log(
    '%c[Main v2.1.1] 🚀 Entry module loaded — auto-config AKTIF',
    'color:#38bdf8;font-weight:bold;'
  );

  // ═══════════════════════════════════════════════════════════════════════
  // 1. UNIFIED TRIM HELPER
  // ═══════════════════════════════════════════════════════════════════════
  window.trimVideoFinal = async function (file, startSec, endSec, onProgress) {
    if (!file) throw new Error('trimVideoFinal: file tidak boleh null');

    const has = (name) => typeof window[name] !== 'undefined';

    if (has('TrimRouter') && window.TrimRouter && typeof window.TrimRouter.execute === 'function') {
      console.log('[Main] 🎯 Pakai TrimRouter (auto-route)');
      return window.TrimRouter.execute(file, startSec, endSec, {
        onProgress: onProgress || null,
      });
    }

    if (has('SmartTrimmer') && window.SmartTrimmer && typeof window.SmartTrimmer.trimVideoFinal === 'function') {
      console.log('[Main] 🔄 Pakai SmartTrimmer (hybrid direct)');
      return window.SmartTrimmer.trimVideoFinal(file, startSec, endSec, onProgress);
    }

    if (has('MP4TrimEngine') && typeof window.MP4TrimEngine.trimToBlob === 'function') {
      console.log('[Main] 🔄 Pakai MP4TrimEngine');
      return window.MP4TrimEngine.trimToBlob(file, startSec, endSec);
    }

    if (has('FFmpegManager') && typeof window.FFmpegManager.processRealCanvasTrimToBlob === 'function') {
      console.log('[Main] 🔄 Pakai FFmpegManager (MediaRecorder fallback)');
      return window.FFmpegManager.processRealCanvasTrimToBlob(file, startSec, endSec, {
        fps: 30,
        videoBitrateMbps: 4.0,
      });
    }

    throw new Error(
      'Tidak ada trim engine yang tersedia.\n' +
      'Cek console untuk error saat load modul (mp4-trim.js, webcodecs-trimmer.js, dll).'
    );
  };

  // ═══════════════════════════════════════════════════════════════════════
  // 2. QUICK SAVE TO GALLERY
  // ═══════════════════════════════════════════════════════════════════════
  window.quickSaveToGallery = async function (file, startSec, endSec, filename) {
    const blob = await window.trimVideoFinal(file, startSec, endSec, (info) => {
      if (info && info.message) {
        console.log('[Main] ' + info.stage + ': ' + info.message);
      }
    });

    if (!blob || blob.size === 0) throw new Error('Blob kosong');

    const name = filename || ('clip_' + Date.now() + '.mp4');
    const fileObj = new File([blob], name, { type: blob.type || 'video/mp4' });

    try {
      if (navigator.canShare && navigator.canShare({ files: [fileObj] })) {
        await navigator.share({
          files: [fileObj],
          title: 'Simpan ke Galeri',
          text: 'Pilih "Simpan" / "Save to Photos"',
        });
        return blob;
      }
    } catch (err) {
      if (err && err.name === 'AbortError') return blob;
      console.warn('[Main] Web Share gagal, fallback download:', err.message);
    }

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      if (document.body.contains(a)) document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 2000);

    return blob;
  };

  // ═══════════════════════════════════════════════════════════════════════
  // 3. DEBUG HELPER
  // ═══════════════════════════════════════════════════════════════════════
  function logModuleStatus() {
    const check = (name) => (typeof window[name] !== 'undefined' ? '✅' : '❌');

    console.log(
      '%c[Main v2.1.1] 📊 Status Modul:',
      'color:#10b981;font-weight:bold;font-size:13px;'
    );
    console.table({
      'Orchestrator (script.js)': check('renderPage'),
      'MP4TrimEngine': check('MP4TrimEngine'),
      'WebCodecsTrimmer': check('WebCodecsTrimmer'),
      'FFmpegMuxer': check('FFmpegMuxer'),
      'SmartTrimmer': check('SmartTrimmer'),
      'TrimRouter': check('TrimRouter'),
      'AIEngine': check('AIEngine'),
      'HookEngine': check('HookEngine'),
      'FFmpegManager': check('FFmpegManager'),
      'AIWorkerBridge': check('AIWorkerBridge'),
      'AutoConfig': check('AutoConfig'),
      'CapCutEngine': check('CapCutEngine'),
    });

    const critical = ['MP4TrimEngine', 'FFmpegManager'];
    const missing = critical.filter((name) => typeof window[name] === 'undefined');

    if (missing.length > 0) {
      console.warn(
        '%c[Main v2.1.1] ⚠️ Modul kritis tidak terdeteksi: ' + missing.join(', '),
        'color:#f59e0b;font-weight:bold;'
      );
      console.warn('[Main v2.1.1] Trim mungkin akan gagal. Cek Network tab untuk 404.');
    } else {
      console.log(
        '%c[Main v2.1.1] ✅ Semua modul kritis OK',
        'color:#10b981;font-weight:bold;'
      );
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  // 4. EXPOSE __main (HANYA SATU definisi)
  // ═══════════════════════════════════════════════════════════════════════
  window.__main = {
    version: '2.1.1',
    status: logModuleStatus,
    trim: window.trimVideoFinal,
    save: window.quickSaveToGallery,

  engines: function () {
  const router = window.TrimRouter;
  const caps = router && typeof router.probeCapabilities === 'function'
    ? router.probeCapabilities()
    : null;

  return {
    MP4TrimEngine: !!window.MP4TrimEngine,
    WebCodecsTrimmer: !!window.WebCodecsTrimmer,
    FFmpegMuxer: !!window.FFmpegMuxer,
    SmartTrimmer: !!window.SmartTrimmer,
    TrimRouter: !!router,
    FFmpegManager: !!window.FFmpegManager,
    FFmpegWasm: !!window.FFmpegWasm,
    FFmpegWASM_FFmpeg: !!(window.FFmpegWASM && window.FFmpegWASM.FFmpeg),
    hybridAvailable: !!(caps && caps.canHybrid),
    fastTrimAvailable: !!(caps && caps.canFastTrim),
  };
},
  },

  console.log(
    '%c[Main v2.1.1] 💡 Debug: window.__main.status()',
    'color:#8b5cf6;font-weight:bold;'
  );

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(logModuleStatus, 3000);
    });
  } else {
    setTimeout(logModuleStatus, 3000);
  }

  console.log(
    '%c[Main v2.1.1] ✅ READY — script.js tetap orkestrator UI utama',
    'color:#10b981;font-weight:bold;font-size:13px;padding:4px 0;'
  );
})();