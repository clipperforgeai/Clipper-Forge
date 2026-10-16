/**
 * AI CLIPPER AGENT - TRIM DISPATCHER v3.5
 * ═══════════════════════════════════════════════════════════════════════════
 * v3.5 FIX (audit 2026-10-16):
 *  ✅ GitHub Releases wasmURL support via window.FFMPEG_CORE_WASM_URL
 *  ✅ WORKERFS mount → anti-OOM untuk file besar di Android
 *  ✅ Preset ultrafast + threads 1 + max 720p untuk speed
 *  ✅ mount/unmount API di FFmpegShim
 *  ✅ Semua API lama UTUH (backward compat 100%)
 * ═══════════════════════════════════════════════════════════════════════════
 */

const FFmpegWasm = (() => {
  'use strict';

  function resolveAssetBase() {
    try {
      const base = new URL('./', window.location.href);
      return base.href.replace(/\/?$/, '/');
    } catch (e) {
      return './';
    }
  }

  const ASSET_BASE = resolveAssetBase();

  // ⚡ FIX: Prioritas GitHub URL untuk wasm
  const GH_WASM_URL = (typeof window !== 'undefined' && window.FFMPEG_CORE_WASM_URL) || null;

  const PATHS = {
    wrapper: ASSET_BASE + '814.ffmpeg.js',       // WAJIB same-origin
    core:    ASSET_BASE + 'ffmpeg-core.js',      // WAJIB same-origin
    wasm:    GH_WASM_URL || (ASSET_BASE + 'ffmpeg-core.wasm'),  // BOLEH cross-origin
  };

  console.log('[ffmpeg.wasm] 📍 Paths:', {
    wrapper: PATHS.wrapper,
    core: PATHS.core,
    wasm: PATHS.wasm,
    source: GH_WASM_URL ? 'GitHub Releases' : 'Local',
  });

  let _ffmpeg  = null;
  let _loading = null;
  let _ready   = false;

  function loadScriptOnce(src) {
    return new Promise((resolve, reject) => {
      const existing = document.querySelector('script[src="' + src + '"]');
      if (existing && window.FFmpegWASM && window.FFmpegWASM.FFmpeg) {
        return resolve();
      }
      const s = document.createElement('script');
      s.src = src;
      s.async = true;
      s.onload = () => resolve();
      s.onerror = () => reject(new Error('Gagal load script: ' + src));
      document.head.appendChild(s);
    });
  }

  /**
   * ═══════════════════════════════════════════════════════════════════════
   * FFMPEG CLASS SHIM — protokol resmi @ffmpeg/ffmpeg@0.12.x
   * ═══════════════════════════════════════════════════════════════════════
   */
  class FFmpegShim {
    constructor() {
      this.loaded = false;
      this.worker = null;
      this._id = 0;
      this._pending = new Map();
      this._listeners = { log: [], progress: [] };
      this._logBuffer = [];
    }

    on(event, cb) {
      if (!this._listeners[event]) this._listeners[event] = [];
      this._listeners[event].push(cb);
    }

    off(event, cb) {
      if (!this._listeners[event]) return;
      this._listeners[event] = this._listeners[event].filter(fn => fn !== cb);
    }

    _emit(event, payload) {
      (this._listeners[event] || []).forEach(fn => {
        try { fn(payload); } catch (e) {}
      });
    }

    _nextId() { return ++this._id; }

    _post(type, data, transfer) {
      return new Promise((resolve, reject) => {
        if (!this.worker) return reject(new Error('Worker belum siap'));
        const id = this._nextId();

        const timeoutMs = type === 'LOAD' ? 90000 : 180000;
        const timer = setTimeout(() => {
          if (this._pending.has(id)) {
            this._pending.delete(id);
            reject(new Error('Timeout: ' + type + ' (' + timeoutMs + 'ms)'));
          }
        }, timeoutMs);

        this._pending.set(id, {
          resolve: (v) => { clearTimeout(timer); resolve(v); },
          reject: (e) => { clearTimeout(timer); reject(e); },
        });

        try {
          if (transfer && transfer.length) {
            this.worker.postMessage({ id, type, data }, transfer);
          } else {
            this.worker.postMessage({ id, type, data });
          }
        } catch (e) {
          clearTimeout(timer);
          this._pending.delete(id);
          reject(e);
        }
      });
    }

    _handleMessage(e) {
      const msg = e.data || {};
      const { id, type, data } = msg;

      if (id == null) {
        if (type === 'LOG') this._emit('log', data);
        if (type === 'PROGRESS') this._emit('progress', data);
        return;
      }

      const pending = this._pending.get(id);
      if (!pending) return;
      this._pending.delete(id);

      if (type === 'ERROR') {
        pending.reject(new Error(typeof data === 'string' ? data : 'FFmpeg error'));
      } else {
        pending.resolve(data);
      }
    }

    async load(opts = {}) {
      if (this.loaded) return true;

      const coreURL = opts.coreURL || PATHS.core;
      const wasmURL = opts.wasmURL || PATHS.wasm;
      const workerURL = opts.workerURL || PATHS.wrapper;

      console.log('[ffmpeg.wasm] 🔧 LOAD:', { coreURL, wasmURL, workerURL });

      try {
        this.worker = new Worker(workerURL);
      } catch (e) {
        try {
          this.worker = new Worker(workerURL, { type: 'module' });
        } catch (e2) {
          throw new Error('Gagal spawn FFmpeg worker: ' + e.message);
        }
      }

      this.worker.onmessage = (e) => this._handleMessage(e);
      this.worker.onerror = (e) => {
        console.error('[FFmpeg] Worker error:', e.message || e);
      };

      await this._post('LOAD', { coreURL, wasmURL, workerURL });
      this.loaded = true;
      console.log('[ffmpeg.wasm] ✅ LOAD selesai');
      return true;
    }

    async writeFile(path, data) {
      const transfer = (data instanceof Uint8Array) ? [data.buffer] : undefined;
      await this._post('WRITE_FILE', { path, data }, transfer);
      return true;
    }

    async readFile(path) {
      return await this._post('READ_FILE', { path });
    }

    async deleteFile(path) {
      await this._post('DELETE_FILE', { path });
      return true;
    }

    async rename(oldPath, newPath) {
      await this._post('RENAME', { oldPath, newPath });
      return true;
    }

    async createDir(path) {
      await this._post('CREATE_DIR', { path });
      return true;
    }

    async listDir(path) {
      return await this._post('LIST_DIR', { path });
    }

    async deleteDir(path) {
      await this._post('DELETE_DIR', { path });
      return true;
    }

    // ⚡ FIX v3.5: WORKERFS mount (anti-OOM untuk file besar)
    async mount(fsType, options, mountPoint) {
      await this._post('MOUNT', { fsType, options, mountPoint });
      return true;
    }

    async unmount(mountPoint) {
      await this._post('UNMOUNT', { mountPoint });
      return true;
    }

    async exec(args) {
      return await this._post('EXEC', { args, timeout: -1 });
    }

    async terminate() {
      if (this.worker) {
        try { this.worker.terminate(); } catch (e) {}
        this.worker = null;
      }
      this.loaded = false;
      this._pending.clear();
    }
  }

  async function resolveFFmpegClass() {
    if (window.FFmpegWASM && typeof window.FFmpegWASM.FFmpeg === 'function') {
      console.log('[ffmpeg.wasm] ✅ Pakai UMD global window.FFmpegWASM.FFmpeg');
      return window.FFmpegWASM.FFmpeg;
    }
    console.log('[ffmpeg.wasm] 🛠 Pakai FFmpegShim lokal (untuk 814.ffmpeg.js worker)');
    return FFmpegShim;
  }

  async function fetchFile(input) {
    if (typeof input === 'string') {
      const res = await fetch(input);
      if (!res.ok) throw new Error('fetchFile HTTP ' + res.status);
      return new Uint8Array(await res.arrayBuffer());
    }
    if (typeof File !== 'undefined' && input instanceof File) return new Uint8Array(await input.arrayBuffer());
    if (typeof Blob !== 'undefined' && input instanceof Blob) return new Uint8Array(await input.arrayBuffer());
    if (input instanceof Uint8Array) return input;
    if (input instanceof ArrayBuffer) return new Uint8Array(input);
    throw new Error('fetchFile: tipe tidak didukung');
  }

  // ⚡ FIX v3.5: profil default lebih ringan untuk Android mid-range
  const DEFAULT_PROFILE = Object.freeze({
    threads: 1,           // ST wasm — thread tambahan hanya overhead
    preset: 'ultrafast',  // 2-3x lebih cepat dari veryfast
    crf: 26,
    maxWidth: 720,        // cukup untuk TikTok/Reels
    maxHeight: 1280,      // portrait-friendly
    hwAccel: 'none',
    wasmMemoryMB: 512,
    chunkSizeMB: 8,
  });

  function getProfile() {
    try {
      const p = window.AutoConfig && window.AutoConfig.getProfile && window.AutoConfig.getProfile();
      if (p && p.ffmpeg) return Object.assign({}, DEFAULT_PROFILE, p.ffmpeg);
    } catch (e) {}
    return DEFAULT_PROFILE;
  }

  // ⚡ FIX v3.5: batas dinaikkan karena WORKERFS bypass MEMFS
  function canHandleFile(file) {
    if (!file) return false;
    const p = getProfile();
    // WORKERFS tidak butuh copy ke MEMFS → limit ~5x lebih longgar
    const budget = p.wasmMemoryMB * 1024 * 1024 * 5;
    return file.size <= budget;
  }

  function load(onProgress) {
    if (_ready) return Promise.resolve(true);
    if (_loading) return _loading;

    _loading = (async () => {
      try {
        if (onProgress) onProgress('📦 Memuat ffmpeg.wasm...');

        const FFmpegCls = await resolveFFmpegClass();
        _ffmpeg = new FFmpegCls();

        _ffmpeg.on('log', function (data) {
          const msg = (data && data.message) || '';
          if (msg && /error|failed/i.test(msg)) {
            console.warn('[ffmpeg.wasm]', msg);
          }
        });

        if (onProgress) onProgress('⚙️ Inisialisasi core...');

        try {
          await _ffmpeg.load({
            coreURL: PATHS.core,
            wasmURL: PATHS.wasm,
            workerURL: PATHS.wrapper,
          });
        } catch (coreErr) {
          console.warn('[ffmpeg.wasm] Load root gagal, coba /ffmpeg/:', coreErr.message);
          await _ffmpeg.load({
            coreURL: './ffmpeg/ffmpeg-core.js',
            wasmURL: PATHS.wasm,  // tetap pakai GitHub URL untuk wasm
            workerURL: './814.ffmpeg.js',
          });
        }

        _ready = true;
        console.log('[ffmpeg.wasm] ✅ Ready — core:', PATHS.core, '| wasm:', PATHS.wasm);
        return true;
      } catch (err) {
        console.error('[ffmpeg.wasm] ❌ Load gagal:', err);
        _ffmpeg = null;
        _ready = false;
        return false;
      } finally {
        _loading = null;
      }
    })();

    return _loading;
  }

  function buildCopyArgs(inName, outName, start, end) {
    const p = getProfile();
    const dur = Math.max(0.05, end - start);
    const queueSize = Math.max(64, Math.round(p.wasmMemoryMB / 4));
    return [
      '-ss', String(start),
      '-i', inName,
      '-t', String(dur),
      '-c', 'copy',
      '-avoid_negative_ts', 'make_zero',
      '-max_muxing_queue_size', String(queueSize),
      '-movflags', '+faststart',
      outName,
    ];
  }

  function buildTranscodeArgs(inName, outName, start, end, opts) {
    opts = opts || {};
    const p = getProfile();
    const dur = Math.max(0.05, end - start);
    const threads = opts.threads != null ? opts.threads : (p.threads || 1);
    const preset  = opts.preset  || p.preset  || 'ultrafast';
    const crf     = opts.crf     != null ? opts.crf : (p.crf || 26);
    const mw      = opts.maxWidth  || p.maxWidth  || 720;
    const mh      = opts.maxHeight || p.maxHeight || 1280;
    const vf = "scale='min(" + mw + ",iw)':'min(" + mh + ",ih)':force_original_aspect_ratio=decrease,scale=trunc(iw/2)*2:trunc(ih/2)*2";
    return [
      '-ss', String(start),
      '-i', inName,
      '-t', String(dur),
      '-threads', String(threads >= 1 ? threads : 1),
      '-c:v', 'libx264',
      '-preset', preset,
      '-crf', String(crf),
      '-pix_fmt', 'yuv420p',
      '-vf', vf,
      '-c:a', 'aac',
      '-b:a', '128k',
      '-movflags', '+faststart',
      outName,
    ];
  }

  function attachProgress(onProgress) {
    if (!onProgress || !_ffmpeg) return function () {};
    const handler = function (data) {
      try {
        const pct = Math.min(100, Math.max(0, Math.round((data.progress || 0) * 100)));
        onProgress('🎬 ffmpeg.wasm ' + pct + '%');
      } catch (e) {}
    };
    _ffmpeg.on('progress', handler);
    return function () { try { _ffmpeg.off('progress', handler); } catch (e) {} };
  }

  /**
   * ⚡ FIX v3.5: WORKERFS anti-OOM dengan fallback MEMFS
   */
  async function trimCopy(file, start, end, onProgress) {
    if (!_ready) throw new Error('ffmpeg.wasm belum siap');
    if (!canHandleFile(file)) throw new Error('File terlalu besar');

    const outName = 'out_' + Date.now() + '.mp4';
    const detach = attachProgress(onProgress);

    // File aman (nama tanpa karakter aneh) untuk WORKERFS
    const ext = (file.name.match(/\.[^.]+$/) || ['.mp4'])[0];
    const safeName = 'input_' + Date.now() + ext;
    const safeFile = new File([file], safeName, { type: file.type || 'video/mp4' });
    const mountPoint = '/mnt_' + Date.now();

    let result = null;

    // ═══ ATTEMPT 1: WORKERFS (anti-OOM untuk file besar) ═══
    let mounted = false;
    try {
      await _ffmpeg.createDir(mountPoint);
      await _ffmpeg.mount('WORKERFS', { files: [safeFile] }, mountPoint);
      mounted = true;

      console.log('[ffmpeg.wasm] 📂 WORKERFS mounted:', mountPoint + '/' + safeName);

      const inputPath = mountPoint + '/' + safeName;
      await _ffmpeg.exec(buildCopyArgs(inputPath, outName, start, end));

      const data = await _ffmpeg.readFile(outName);
      result = new Blob([data.buffer], { type: 'video/mp4' });
      console.log('[ffmpeg.wasm] ✅ WORKERFS trim sukses');
    } catch (err) {
      console.warn('[ffmpeg.wasm] ⚠️ WORKERFS gagal, fallback MEMFS:', err.message);
    } finally {
      if (mounted) {
        try { await _ffmpeg.unmount(mountPoint); } catch (e) {}
      }
      try { await _ffmpeg.deleteDir(mountPoint); } catch (e) {}
    }

    // ═══ ATTEMPT 2: MEMFS (fallback untuk file kecil) ═══
    if (!result) {
      const inName = 'in_' + Date.now() + '.mp4';
      try {
        await _ffmpeg.writeFile(inName, await fetchFile(file));
        await _ffmpeg.exec(buildCopyArgs(inName, outName, start, end));
        const data = await _ffmpeg.readFile(outName);
        result = new Blob([data.buffer], { type: 'video/mp4' });
        console.log('[ffmpeg.wasm] ✅ MEMFS trim sukses');
      } finally {
        try { await _ffmpeg.deleteFile(inName); } catch (e) {}
      }
    }

    detach();
    try { await _ffmpeg.deleteFile(outName); } catch (e) {}

    if (!result) throw new Error('Trim gagal: WORKERFS dan MEMFS sama-sama error');
    return result;
  }

  async function transcode(file, start, end, opts, onProgress) {
    if (!_ready) throw new Error('ffmpeg.wasm belum siap');
    if (!canHandleFile(file)) throw new Error('File terlalu besar');

    const outName = 'out_' + Date.now() + '.mp4';
    const detach = attachProgress(onProgress);

    const ext = (file.name.match(/\.[^.]+$/) || ['.mp4'])[0];
    const safeName = 'input_' + Date.now() + ext;
    const safeFile = new File([file], safeName, { type: file.type || 'video/mp4' });
    const mountPoint = '/mnt_' + Date.now();

    let result = null;
    let mounted = false;

    try {
      // Coba WORKERFS dulu
      try {
        await _ffmpeg.createDir(mountPoint);
        await _ffmpeg.mount('WORKERFS', { files: [safeFile] }, mountPoint);
        mounted = true;

        const inputPath = mountPoint + '/' + safeName;
        await _ffmpeg.exec(buildTranscodeArgs(inputPath, outName, start, end, opts || {}));
        const data = await _ffmpeg.readFile(outName);
        result = new Blob([data.buffer], { type: 'video/mp4' });
      } catch (err) {
        console.warn('[ffmpeg.wasm] ⚠️ WORKERFS transcode gagal:', err.message);
      } finally {
        if (mounted) {
          try { await _ffmpeg.unmount(mountPoint); } catch (e) {}
        }
        try { await _ffmpeg.deleteDir(mountPoint); } catch (e) {}
      }

      // Fallback MEMFS
      if (!result) {
        const inName = 'in_' + Date.now() + '.mp4';
        try {
          await _ffmpeg.writeFile(inName, await fetchFile(file));
          await _ffmpeg.exec(buildTranscodeArgs(inName, outName, start, end, opts || {}));
          const data = await _ffmpeg.readFile(outName);
          result = new Blob([data.buffer], { type: 'video/mp4' });
        } finally {
          try { await _ffmpeg.deleteFile(inName); } catch (e) {}
        }
      }
    } finally {
      detach();
      try { await _ffmpeg.deleteFile(outName); } catch (e) {}
    }

    if (!result) throw new Error('Transcode gagal');
    return result;
  }

  async function destroy() {
    if (_ffmpeg) {
      try { await _ffmpeg.terminate(); } catch (e) {}
      _ffmpeg = null;
      _ready = false;
    }
  }

  return {
    load, destroy, trimCopy, transcode,
    isReady: () => _ready,
    isMultiThread: () => false,
    canHandleFile, getProfile,
    buildCopyArgs, buildTranscodeArgs, fetchFile,
    _paths: PATHS,
    _FFmpegShim: FFmpegShim,
  };
})();

if (typeof window !== 'undefined') {
  window.FFmpegWasm = FFmpegWasm;

  if (!window.FFmpegWASM) window.FFmpegWASM = {};
  if (typeof window.FFmpegWASM.FFmpeg !== 'function') {
    window.FFmpegWASM.FFmpeg = FFmpegWasm._FFmpegShim;
  }
}

/* ═══════════════════════════════════════════════════════════════════════════
 * FFmpegManager — UTUH dari versi lama (tidak diubah di sini,
 *                   patch-nya ada di script.js Tier 1.5)
 * ═══════════════════════════════════════════════════════════════════════════ */
const FFmpegManager = {
  _pickBestMime() {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
                  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const isAndroid = /Android/i.test(navigator.userAgent);

    let candidates = [];

    if (isIOS) {
      candidates = [
        'video/mp4;codecs=avc1.42E01E,mp4a.40.2',
        'video/mp4;codecs=h264,aac',
        'video/mp4',
        'video/webm;codecs=vp8,opus',
        'video/webm'
      ];
    } else if (isAndroid) {
      candidates = [
        'video/mp4;codecs=avc1.42E01E,mp4a.40.2',
        'video/mp4;codecs=h264,aac',
        'video/mp4',
        'video/webm;codecs=vp9,opus',
        'video/webm;codecs=vp8,opus',
        'video/webm'
      ];
    } else {
      candidates = [
        'video/mp4;codecs=h264,aac',
        'video/mp4',
        'video/webm;codecs=vp9,opus',
        'video/webm;codecs=vp8,opus',
        'video/webm'
      ];
    }

    for (const m of candidates) {
      try {
        if (MediaRecorder.isTypeSupported(m)) {
          console.log('[FFmpegManager] 🎯 MIME terpilih:', m);
          return m;
        }
      } catch (e) {}
    }
    return '';
  },

  async _buildCaptureStream(video, canvas, fps, onLog) {
    const log = onLog || function () {};
    let audioCtx = null;
    let destNode = null;
    let canvasStream = null;

    try {
      video.muted = false;
      video.volume = 1.0;
    } catch (e) {}

    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        audioCtx = new AudioCtx();
        if (audioCtx.state === 'suspended') {
          try { await audioCtx.resume(); } catch (e) {}
        }
        let sourceNode;
        try {
          sourceNode = audioCtx.createMediaElementSource(video);
        } catch (e) {
          sourceNode = null;
        }
        if (sourceNode) {
          destNode = audioCtx.createMediaStreamDestination();
          sourceNode.connect(destNode);
          log('✅ AudioContext pipeline siap, state: ' + audioCtx.state);
        }
      }
    } catch (e) {
      log('⚠️ AudioContext setup gagal: ' + e.message);
    }

    try {
      canvasStream = canvas.captureStream(fps);
      if (!canvasStream) throw new Error('captureStream return null');
      log('✅ Canvas stream @ ' + fps + 'fps');
    } catch (e) {
      canvasStream = canvas.captureStream(0);
      log('⚠️ Fallback captureStream(0) — manual requestFrame');
    }

    let audioFromVideo = false;
    try {
      const vs = (typeof video.captureStream === 'function' && video.captureStream()) ||
                 (typeof video.mozCaptureStream === 'function' && video.mozCaptureStream());
      if (vs) {
        const tracks = vs.getAudioTracks();
        if (tracks.length > 0) {
          canvasStream.addTrack(tracks[0]);
          audioFromVideo = true;
          log('🔊 Audio dari video.captureStream()');
        }
      }
    } catch (e) {
      log('video.captureStream() audio gagal: ' + e.message);
    }

    if (!audioFromVideo && destNode) {
      const audioTracks = destNode.stream.getAudioTracks();
      if (audioTracks.length > 0) {
        canvasStream.addTrack(audioTracks[0]);
        log('🔊 Audio dari AudioContext.MediaStreamDestination');
      } else {
        log('⚠️ TIDAK ADA audio track — video akan silent');
      }
    }

    return { stream: canvasStream, audioCtx, destNode };
  },

  processRealCanvasTrimToBlob(file, start, end, options) {
    options = options || {};
    const targetFps = options.fps || 30;
    const videoBitrateMbps = options.videoBitrateMbps || 4.0;
    const scale = options.scale || 1.0;

    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.muted = false;
      video.volume = 1.0;
      video.playsInline = true;
      video.preload = 'auto';
      video.crossOrigin = 'anonymous';
      video.setAttribute('playsinline', '');
      video.setAttribute('webkit-playsinline', '');

      const videoUrl = URL.createObjectURL(file);
      video.src = videoUrl;

      let audioCtx = null;
      let destNode = null;
      let mediaRecorder = null;
      let chunks = [];
      let stopRequested = false;

      const cleanup = () => {
        try { if (video.pause) video.pause(); } catch (e) {}
        try { URL.revokeObjectURL(videoUrl); } catch (e) {}
        try {
          if (audioCtx && audioCtx.state !== 'closed') audioCtx.close();
        } catch (e) {}
        try { if (video.parentNode) video.parentNode.removeChild(video); } catch (e) {}
      };

      const duration = end - start;
      if (duration <= 0) {
        cleanup();
        return reject(new Error('Durasi klip tidak valid'));
      }

      const safetyTimer = setTimeout(() => {
        console.warn('[Trim] Safety timeout — force finish');
        try { if (mediaRecorder && mediaRecorder.state !== 'inactive') mediaRecorder.stop(); } catch (e) {}
      }, (duration + 30) * 1000);

      video.onloadedmetadata = () => {
        try { video.currentTime = start; }
        catch (e) {
          clearTimeout(safetyTimer);
          cleanup();
          reject(new Error('Gagal seek ke ' + start));
        }
      };

      video.onerror = () => {
        clearTimeout(safetyTimer);
        cleanup();
        reject(new Error('Video gagal dimuat'));
      };

      video.onseeked = async () => {
        try {
          const srcW = video.videoWidth || 720;
          const srcH = video.videoHeight || 1280;
          const outW = Math.round(srcW * scale / 2) * 2;
          const outH = Math.round(srcH * scale / 2) * 2;

          const canvas = document.createElement('canvas');
          canvas.width = outW;
          canvas.height = outH;
          const ctx = canvas.getContext('2d', { alpha: false, willReadFrequently: false });

          const capture = await this._buildCaptureStream(video, canvas, targetFps, (msg) => {
            console.log('[Trim]', msg);
          });
          const stream = capture.stream;
          audioCtx = capture.audioCtx;
          destNode = capture.destNode;

          const mime = this._pickBestMime();
          const recOpts = {
            videoBitsPerSecond: Math.round(videoBitrateMbps * 1e6),
            audioBitsPerSecond: 128000
          };
          if (mime) recOpts.mimeType = mime;

          try {
            mediaRecorder = new MediaRecorder(stream, recOpts);
          } catch (e) {
            mediaRecorder = new MediaRecorder(stream);
          }

          chunks = [];
          mediaRecorder.ondataavailable = (e) => {
            if (e.data && e.data.size > 0) chunks.push(e.data);
          };

          mediaRecorder.onstop = () => {
            clearTimeout(safetyTimer);
            const actualMime = mediaRecorder.mimeType || mime || 'video/webm';
            const blob = new Blob(chunks, { type: actualMime });
            cleanup();
            if (blob.size === 0) return reject(new Error('Hasil rekaman kosong'));
            resolve(blob);
          };

          mediaRecorder.onerror = (e) => {
            clearTimeout(safetyTimer);
            cleanup();
            reject(new Error('Recorder error: ' + (e && e.error && e.error.message || 'unknown')));
          };

          mediaRecorder.start(250);

          if (audioCtx && audioCtx.state === 'suspended') {
            try { await audioCtx.resume(); } catch (e) {}
          }

          try {
            await video.play();
          } catch (err) {
            clearTimeout(safetyTimer);
            try { mediaRecorder.stop(); } catch (e) {}
            cleanup();
            return reject(new Error('Play video gagal: ' + err.message));
          }

          const endTime = end;
          let lastFrameDrawn = 0;
          const minFrameInterval = 1000 / targetFps;

          const drawFrame = () => {
            try { ctx.drawImage(video, 0, 0, outW, outH); } catch (e) {}
          };

          const shouldStop = () => {
            if (stopRequested) return true;
            if (window.__HARD_ABORT) return true;
            if (video.currentTime >= endTime) return true;
            if (video.ended) return true;
            return false;
          };

          const stopNow = () => {
            stopRequested = true;
            try { video.pause(); } catch (e) {}
            setTimeout(() => {
              try {
                if (mediaRecorder && mediaRecorder.state !== 'inactive') mediaRecorder.stop();
              } catch (e) {}
            }, 150);
          };

          if (typeof video.requestVideoFrameCallback === 'function') {
            const onFrame = () => {
              if (shouldStop()) { stopNow(); return; }
              drawFrame();
              video.requestVideoFrameCallback(onFrame);
            };
            video.requestVideoFrameCallback(onFrame);
          } else {
            const loop = (now) => {
              if (shouldStop()) { stopNow(); return; }
              if (now - lastFrameDrawn >= minFrameInterval) {
                drawFrame();
                lastFrameDrawn = now;
              }
              requestAnimationFrame(loop);
            };
            requestAnimationFrame(loop);
          }

          video.ontimeupdate = () => {
            if (shouldStop()) stopNow();
          };

        } catch (err) {
          clearTimeout(safetyTimer);
          cleanup();
          reject(err);
        }
      };
    });
  },

  async trimAndDownload(file, start, end, filename = 'clip.mp4') {
    if (!file) { alert("❌ File video tidak tersedia."); return; }
    if (start < 0 || end <= start) { alert("❌ Timestamp tidak valid."); return; }

    // ─── Tier 1: MP4TrimEngine (lossless via MP4Box) ───
    if (window.MP4TrimEngine && window.MP4TrimEngine.canHandle(file)) {
      try {
        await window.MP4TrimEngine.trim(file, start, end, filename);
        return;
      } catch (e) {
        console.warn('[Trim] MP4 lossless gagal:', e.message);
      }
    }

    // ⚡ FIX v3.5: Tier 1.5 — FFmpeg.wasm trimCopy (lossless via WASM)
    if (window.FFmpegWasm && window.FFmpegWasm.canHandleFile(file)) {
      try {
        console.log('[Trim] 🎬 Coba FFmpeg.wasm trimCopy...');
        const ok = await window.FFmpegWasm.load((msg) => {
          if (window.updateStatus) window.updateStatus(msg);
        });
        if (ok) {
          const blob = await window.FFmpegWasm.trimCopy(file, start, end);
          this.downloadBlob(blob, filename);
          console.log('[Trim] ✅ FFmpeg.wasm trimCopy sukses');
          return;
        }
      } catch (e) {
        console.warn('[Trim] FFmpeg.wasm trimCopy gagal, fallback MediaRecorder:', e.message);
      }
    }

    // ─── Tier 2: MediaRecorder (fallback terakhir) ───
    try {
      const blob = await this.processRealCanvasTrimToBlob(file, start, end);
      this.downloadBlob(blob, filename);
    } catch (err) {
      alert(
        "⚠️ Pemotongan gagal.\n\nAlasan: " + (err.message || err) + "\n\n" +
        "Coba: potong manual dari " + this._fmt(start) + " hingga " + this._fmt(end) + "."
      );
    }
  },

  async trimAndSaveToGallery(file, start, end, filename = 'clip.mp4') {
    if (!file) { alert("❌ File video tidak tersedia."); return; }
    if (start < 0 || end <= start) { alert("❌ Timestamp tidak valid."); return; }

    let blob = null;
    let finalName = filename;

    // Tier 1: MP4TrimEngine
    if (window.MP4TrimEngine && window.MP4TrimEngine.canHandle(file)) {
      try {
        blob = await window.MP4TrimEngine.trimToBlob(file, start, end);
        finalName = String(filename).replace(/\.[^/.]+$/, '') + '.mp4';
      } catch (e) {
        blob = null;
      }
    }

    // ⚡ FIX v3.5: Tier 1.5 — FFmpeg.wasm
    if (!blob || blob.size === 0) {
      if (window.FFmpegWasm && window.FFmpegWasm.canHandleFile(file)) {
        try {
          const ok = await window.FFmpegWasm.load();
          if (ok) {
            blob = await window.FFmpegWasm.trimCopy(file, start, end);
            finalName = String(filename).replace(/\.[^/.]+$/, '') + '.mp4';
          }
        } catch (e) {
          blob = null;
        }
      }
    }

    // Tier 2: MediaRecorder
    if (!blob || blob.size === 0) {
      try {
        blob = await this.processRealCanvasTrimToBlob(file, start, end);
        const isMp4 = (blob.type || '').indexOf('mp4') !== -1;
        finalName = String(filename).replace(/\.[^/.]+$/, '') + (isMp4 ? '.mp4' : '.webm');
      } catch (err) {
        alert("⚠️ Gagal membuat klip.\n\nAlasan: " + (err.message || err));
        return;
      }
    }

    if (!blob || blob.size === 0) { alert("⚠️ File kosong."); return; }

    try {
      const fileObj = new File([blob], finalName, { type: blob.type || 'video/mp4' });
      const canShare = navigator.canShare && navigator.canShare({ files: [fileObj] });

      if (canShare) {
        await navigator.share({
          files: [fileObj],
          title: 'Simpan ke Galeri',
          text: 'Pilih "Simpan ke Galeri" / "Save to Photos"'
        });
        return;
      }
    } catch (shareErr) {
      if (shareErr && shareErr.name === 'AbortError') return;
      console.warn('[Gallery] Web Share gagal, fallback download:', shareErr);
    }

    this.downloadBlob(blob, finalName);
  },

  processRealCanvasTrim(file, start, end, filename) {
    return this.processRealCanvasTrimToBlob(file, start, end).then(blob => {
      this.downloadBlob(blob, filename);
      return blob;
    });
  },

  _processRealCanvasTrimToBlob(file, start, end) {
    return this.processRealCanvasTrimToBlob(file, start, end);
  },

  _fmt(sec) {
    const s = Math.max(0, Math.floor(sec));
    return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
  },

  downloadBlob(blob, filename) {
    try {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        if (document.body.contains(a)) document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 2000);
    } catch (e) {
      console.warn('Download gagal:', e);
    }
  }
};

if (typeof window !== 'undefined') {
  window.FFmpegManager = FFmpegManager;
}