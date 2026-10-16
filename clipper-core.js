/**
 * ============================================================================
 * CLIPPER FORGE - CORE ENGINE (Unified Master Module v5.2)
 * ============================================================================
 * v5.2 FIX (audit 2026-10-13):
 *  ✅ KRITIS: `initSmartClamping` tidak lagi mem-bypass fix OffscreenCanvas
 *     dari ai-bridge.js v2.7.4. Gunakan `_canOffscreen` + fallback <canvas>.
 *  ✅ Gunakan properti `_canvas`/`_ctx` (konsisten dengan ai-bridge).
 *  ✅ Timeout detect disamakan dengan ai-bridge (8000ms).
 *  ✅ Cleanup bitmap pada semua error path.
 *  ✅ Semua fitur v5.1 UTUH (memory guard 250MB, safe frame extractor,
 *     tanpa registrasi Service Worker inline).
 * ═══════════════════════════════════════════════════════════════════════════
 */
(function () {
  'use strict';
  if (window.__CLIPPER_CORE_LOADED) return;
  window.__CLIPPER_CORE_LOADED = true;

  console.log('[Clipper Core v5.2] 🚀 Memuat Modul Inti Terpadu...');

  // ────────────────────────────────────────────────────────────────────────
  // 1. EVENT SYSTEM & DEPENDENCY RESOLVER
  // ────────────────────────────────────────────────────────────────────────
  window.ClipperEvents = {
    listeners: {},
    on(event, cb) { (this.listeners[event] = this.listeners[event] || []).push(cb); },
    emit(event, data) { (this.listeners[event] || []).forEach(cb => { try { cb(data); } catch(e){} }); },
    waitFor(name, timeout = 10000) {
      return new Promise((res, rej) => {
        if (window[name]) return res(window[name]);
        const start = Date.now();
        const t = setInterval(() => {
          if (window[name]) { clearInterval(t); res(window[name]); }
          else if (Date.now() - start > timeout) { clearInterval(t); rej(new Error(`Timeout: ${name} tidak ditemukan.`)); }
        }, 50);
      });
    }
  };
  window.ClipperResolver = window.ClipperEvents;

  // ────────────────────────────────────────────────────────────────────────
  // 2. CENTRALIZED LOGGER
  // ────────────────────────────────────────────────────────────────────────
  window.ClipperLogger = {
    info(tag, msg, data) { console.log(`%c[${tag}] ℹ️ ${msg}`, 'color:#38bdf8;font-weight:bold;', data || ''); },
    warn(tag, msg, data) { console.warn(`%c[${tag}] ⚠️ ${msg}`, 'color:#fbbf24;font-weight:bold;', data || ''); },
    error(tag, msg, err) {
      console.error(`%c[${tag}] ❌ ${msg}`, 'color:#ef4444;font-weight:bold;', err || '');
      if (window.updateStatus) window.updateStatus(`❌ Error di ${tag}`);
    }
  };

  // ────────────────────────────────────────────────────────────────────────
  // 3. INDEXEDDB STORAGE
  // ────────────────────────────────────────────────────────────────────────
  const DB_NAME = 'ClipperForgeUltimateDB';
  const STORE_NAME = 'workspace_store';

  function openIndexedDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, 1);
      request.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  window.ClipperUltimateStorage = {
    async save(sessionData) {
      try {
        const db = await openIndexedDB();
        const tx = db.transaction(STORE_NAME, 'readwrite');
        tx.objectStore(STORE_NAME).put({ id: 'active_session', data: sessionData, timestamp: Date.now() });
      } catch (err) {
        console.warn('[Storage] Gagal akses IndexedDB:', err);
      }
    },
    async load() {
      try {
        const db = await openIndexedDB();
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        return new Promise((res) => {
          const req = store.get('active_session');
          req.onsuccess = () => res(req.result ? req.result.data : null);
          req.onerror = () => res(null);
        });
      } catch (err) {
        return null;
      }
    }
  };

  setInterval(() => {
    if (window.allClipsData && window.allClipsData.length > 0) {
      window.ClipperUltimateStorage.save({
        clips: window.allClipsData,
        skipped: window.skippedClips instanceof Set ? Array.from(window.skippedClips) : [],
        currentPage: window.currentPage || 1
      });
    }
  }, 12000);

  // ────────────────────────────────────────────────────────────────────────
  // 4. SMART RESOLUTION CLAMPING — v5.2 dengan OffscreenCanvas fallback
  // ────────────────────────────────────────────────────────────────────────
  function initSmartClamping() {
    if (!window.AIWorkerBridge) { setTimeout(initSmartClamping, 200); return; }
    if (window.AIWorkerBridge.__corePatched) return;
    window.AIWorkerBridge.__corePatched = true;

    const originalDetect = window.AIWorkerBridge.detect;

    window.AIWorkerBridge.detect = function (videoEl) {
      if (!this.worker || !this.ready) {
        return Promise.resolve({ faceCount: 0, faceConfidence: 0, poseCount: 0, gestures: [], objects: [] });
      }

      const maxAIRes = 480;
      let w = videoEl.videoWidth || 640;
      let h = videoEl.videoHeight || 480;

      if (w > maxAIRes || h > maxAIRes) {
        const scale = maxAIRes / Math.max(w, h);
        w = Math.round(w * scale);
        h = Math.round(h * scale);
      }

      // ═══ FIX v5.2: guard OffscreenCanvas + gunakan properti `_canvas` ═══
      if (!this._canvas || this._canvas.width !== w || this._canvas.height !== h) {
        try {
          if (this._canOffscreen) {
            this._canvas = new OffscreenCanvas(w, h);
          } else {
            this._canvas = document.createElement('canvas');
            this._canvas.width = w;
            this._canvas.height = h;
          }
          this._ctx = this._canvas.getContext('2d', { willReadFrequently: true });
        } catch (err) {
          ClipperLogger.warn('SmartClamping', 'Canvas create gagal, fallback ke originalDetect: ' + err.message);
          return originalDetect.call(this, videoEl);
        }
      }

      let bitmap = null;
      try {
        this._ctx.drawImage(videoEl, 0, 0, w, h);

        if (typeof this._canvas.transferToImageBitmap === 'function') {
          bitmap = this._canvas.transferToImageBitmap();
        } else if (typeof createImageBitmap === 'function') {
          bitmap = createImageBitmap(this._canvas);
        } else {
          return originalDetect.call(this, videoEl);
        }
      } catch (err) {
        ClipperLogger.warn('SmartClamping', 'Gagal ambil bitmap, fallback: ' + err.message);
        return originalDetect.call(this, videoEl);
      }

      // Kalau createImageBitmap return Promise, wrap
      if (bitmap && typeof bitmap.then === 'function') {
        return bitmap.then((bmp) => this._dispatchFrame(bmp, videoEl))
                     .catch(() => originalDetect.call(this, videoEl));
      }

      return this._dispatchFrame(bitmap, videoEl, originalDetect);
    };

    // Helper untuk dispatch frame ke worker (dipasang di prototype agar bisa dipakai)
    window.AIWorkerBridge._dispatchFrame = function (bitmap, videoEl, originalDetect) {
      const id = ++this.seq;
      const timestamp = performance.now();

      return new Promise((resolve) => {
        const timeoutId = setTimeout(() => {
          if (this.pending.has(id)) {
            this.pending.delete(id);
            try { bitmap.close(); } catch (e) {}
            resolve({ faceCount: 0, faceConfidence: 0, poseCount: 0, gestures: [], objects: [] });
          }
        }, 8000);

        this.pending.set(id, {
          resolve: (v) => { clearTimeout(timeoutId); resolve(v); },
          reject: () => { clearTimeout(timeoutId); resolve({ faceCount: 0, faceConfidence: 0, poseCount: 0, gestures: [], objects: [] }); },
          timeoutId
        });

        try {
          this.worker.postMessage(
            { action: 'detect', id, frame: bitmap, timestamp },
            [bitmap]
          );
        } catch (err) {
          clearTimeout(timeoutId);
          this.pending.delete(id);
          try { bitmap.close(); } catch (e) {}
          if (typeof originalDetect === 'function') {
            originalDetect.call(this, videoEl).then(resolve).catch(() => resolve({
              faceCount: 0, faceConfidence: 0, poseCount: 0, gestures: [], objects: []
            }));
          } else {
            resolve({ faceCount: 0, faceConfidence: 0, poseCount: 0, gestures: [], objects: [] });
          }
        }
      });
    };

    ClipperLogger.info('CoreEngine', '✅ AIWorkerBridge di-optimize (Smart Clamping 480p + fallback)');
  }
  initSmartClamping();

  // ────────────────────────────────────────────────────────────────────────
  // 5. iOS / SAFARI SAFE FRAME PIPELINE
  // ────────────────────────────────────────────────────────────────────────
  async function robustProcessClip(file, start, end, onProgress) {
    ClipperLogger.info('VideoProcessor', `Proses klip ${start}s - ${end}s via Safe Frame Extractor...`);
    return new Promise(async (resolve, reject) => {
      try {
        const video = document.createElement('video');
        video.src = URL.createObjectURL(file);
        video.muted = true;
        video.playsInline = true;
        await video.play().catch(() => {});
        video.pause();

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d', { willReadFrequently: true });

        const scale = Math.min(1, 720 / Math.max(video.videoWidth || 720, video.videoHeight || 1280));
        canvas.width = Math.round((video.videoWidth || 720) * scale);
        canvas.height = Math.round((video.videoHeight || 1280) * scale);

        const fps = 30;
        const duration = end - start;
        const totalFrames = Math.floor(duration * fps);
        const chunks = [];

        const stream = canvas.captureStream ? canvas.captureStream(fps) : null;
        if (!stream) throw new Error('Canvas captureStream tidak didukung.');

        const recorder = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp8' });
        recorder.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data); };
        recorder.onstop = () => {
          URL.revokeObjectURL(video.src);
          resolve(new Blob(chunks, { type: 'video/webm' }));
        };

        recorder.start(100);
        let currentFrame = 0;

        const renderNextFrame = () => {
          if (currentFrame >= totalFrames || video.currentTime >= end) {
            recorder.stop();
            return;
          }
          video.currentTime = start + (currentFrame / fps);
          video.onseeked = () => {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            currentFrame++;
            if (onProgress) {
              const pct = Math.round((currentFrame / totalFrames) * 100);
              onProgress(`🎬 Safe Render... ${pct}%`);
            }
            requestAnimationFrame(renderNextFrame);
          };
        };
        renderNextFrame();
      } catch (err) {
        ClipperLogger.error('VideoProcessor', 'Gagal memproses video', err);
        reject(err);
      }
    });
  }

  window.ClipperEvents.waitFor('FFmpegManager', 5000).then(manager => {
    if (manager && !manager.__corePatched) {
      manager.__corePatched = true;
      const originalTrim = manager._processRealCanvasTrimToBlob;
      if (originalTrim) {
        manager._processRealCanvasTrimToBlob = async function(file, start, end) {
          try {
            return await originalTrim.call(this, file, start, end);
          } catch (e) {
            ClipperLogger.warn('FFmpegManager', 'Metode utama gagal, beralih ke Safe Frame Extractor...');
            return await robustProcessClip(file, start, end);
          }
        };
      }
    }
  }).catch(() => {});

  // ────────────────────────────────────────────────────────────────────────
  // 6. AGGRESSIVE MEMORY GUARD (threshold 250MB)
  // ────────────────────────────────────────────────────────────────────────
  setInterval(() => {
    if (window.performance && window.performance.memory) {
      const heapMB = window.performance.memory.usedJSHeapSize / (1024 * 1024);
      if (heapMB > 250) {
        ClipperLogger.warn('MemoryGuard', `Heap tinggi (${heapMB.toFixed(0)}MB). Membersihkan cache...`);
        if (window.AIEngine && typeof window.AIEngine.clearCache === 'function') {
          window.AIEngine.clearCache();
        }
        document.querySelectorAll('video[data-orphan="1"]').forEach(v => {
          try { if (v.src) URL.revokeObjectURL(v.src); v.remove(); } catch (e) {}
        });
      }
    }
  }, 20000);

  // ────────────────────────────────────────────────────────────────────────
  // 7. Service Worker registration DIHAPUS (sesuai v5.1)
  // ────────────────────────────────────────────────────────────────────────

  ClipperLogger.info('CoreEngine', '✅ Modul Inti Terpadu Clipper Forge v5.2 100% Aktif.');
})();