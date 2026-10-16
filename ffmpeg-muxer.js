/**
 * ═══════════════════════════════════════════════════════════════════════
 * FFmpeg MUXER — Hybrid Edition v1.3 (FIXED)
 * ═══════════════════════════════════════════════════════════════════════
 * v1.3 FIX:
 *  ✅ GitHub Releases wasmURL support via window.FFMPEG_CORE_WASM_URL
 *  ✅ Semua syntax error diperbaiki (koma & struktur objek)
 * ═══════════════════════════════════════════════════════════════════════
 */

const FFmpegMuxer = {
  _ffmpeg: null,
  _loading: null,
  _ready: false,

  async _load() {
    if (this._ready && this._ffmpeg) return this._ffmpeg;
    if (this._loading) return this._loading;

    this._loading = (async () => {
      const base = new URL('./', window.location.href).href;

      // Prioritas A: UMD global
      if (window.FFmpegWASM && window.FFmpegWASM.FFmpeg) {
        console.log('[FFmpegMuxer] ✅ Pakai UMD global window.FFmpegWASM');
        const ffmpeg = new window.FFmpegWASM.FFmpeg();
        await this._loadCore(ffmpeg, base);
        this._ffmpeg = ffmpeg;
        this._ready = true;
        return ffmpeg;
      }

      // Prioritas B: dynamic import
      let FFmpegCls = null;
      try {
        const mod = await import(/* @vite-ignore */ base + '814.ffmpeg.js');
        FFmpegCls =
          (mod && mod.FFmpeg) ||
          (mod && mod.default && mod.default.FFmpeg) ||
          (window.FFmpegWASM && window.FFmpegWASM.FFmpeg);
      } catch (e1) {
        console.warn('[FFmpegMuxer] Root import gagal, coba /ffmpeg/:', e1.message);
        try {
          const mod = await import(/* @vite-ignore */ base + 'ffmpeg/814.ffmpeg.js');
          FFmpegCls =
            (mod && mod.FFmpeg) ||
            (mod && mod.default && mod.default.FFmpeg) ||
            (window.FFmpegWASM && window.FFmpegWASM.FFmpeg);
        } catch (e2) {
          throw new Error('Tidak dapat memuat 814.ffmpeg.js (root maupun /ffmpeg/).');
        }
      }

      if (!FFmpegCls) throw new Error('FFmpeg class tidak ditemukan di module.');

      const ffmpeg = new FFmpegCls();
      await this._loadCore(ffmpeg, base);

      this._ffmpeg = ffmpeg;
      this._ready = true;
      return ffmpeg;
    })();

    return this._loading;
  },

  // ⚡ FIX v3.5: pakai window.FFMPEG_CORE_WASM_URL untuk wasmURL
  async _loadCore(ffmpeg, base) {
    const wasmUrl = (typeof window !== 'undefined' && window.FFMPEG_CORE_WASM_URL)
      ? window.FFMPEG_CORE_WASM_URL
      : (base + 'ffmpeg-core.wasm');

    console.log('[FFmpegMuxer] 📍 Loading:', {
      coreURL: base + 'ffmpeg-core.js',
      wasmURL: wasmUrl,
      workerURL: base + '814.ffmpeg.js',
      wasmSource: window.FFMPEG_CORE_WASM_URL ? 'GitHub Releases' : 'Local',
    });

    try {
      await ffmpeg.load({
        coreURL: base + 'ffmpeg-core.js',
        wasmURL: wasmUrl,
        workerURL: base + '814.ffmpeg.js',
      });
      console.log('[FFmpegMuxer] ✅ ffmpeg.wasm loaded (root)');
    } catch (err) {
      console.warn('[FFmpegMuxer] Load root gagal, coba /ffmpeg/:', err.message);
      await ffmpeg.load({
        coreURL: base + 'ffmpeg/ffmpeg-core.js',
        wasmURL: wasmUrl,
        workerURL: base + 'ffmpeg/814.ffmpeg.js',
      });
      console.log('[FFmpegMuxer] ✅ ffmpeg.wasm loaded (/ffmpeg/)');
    }
  },

  isSupported() {
    return typeof WebAssembly === 'object';
  },

  async mux(videoBlob, audioBlob, opts = {}) {
    const ffmpeg = await this._load();
    const {
      audioOffsetSec = 0,
      durationSec = null,
      onProgress = null
    } = opts;

    if (onProgress) {
      ffmpeg.on('progress', ({ progress }) => {
        onProgress(Math.min(1, Math.max(0, progress)));
      });
    }

    console.log('[FFmpegMuxer] 📥 Menulis ke MEMFS...');

    const videoData = new Uint8Array(await videoBlob.arrayBuffer());
    const audioData = new Uint8Array(await audioBlob.arrayBuffer());

    await ffmpeg.writeFile('video.mp4', videoData);
    await ffmpeg.writeFile('audio.mp4', audioData);

    const args = [
      '-i', 'video.mp4',
      '-i', 'audio.mp4',
      '-map', '0:v:0',
      '-map', '1:a:0',
      '-c:v', 'copy',
      '-c:a', 'copy',
    ];

    if (audioOffsetSec > 0) {
      args.push('-itsoffset', String(audioOffsetSec));
    }

    if (durationSec && durationSec > 0) {
      args.push('-t', String(durationSec));
    }

    args.push('-shortest', '-movflags', '+faststart', 'output.mp4');

    console.log('[FFmpegMuxer] 🎬 Menjalankan ffmpeg:', args.join(' '));
    await ffmpeg.exec(args);

    const outputData = await ffmpeg.readFile('output.mp4');
    const outputBlob = new Blob([outputData.buffer], { type: 'video/mp4' });

    console.log(`[FFmpegMuxer] ✅ Selesai — ${(outputBlob.size / 1024 / 1024).toFixed(2)} MB`);

    try {
      await ffmpeg.deleteFile('video.mp4');
      await ffmpeg.deleteFile('audio.mp4');
      await ffmpeg.deleteFile('output.mp4');
      console.log('[FFmpegMuxer] 🧹 MEMFS dibersihkan');
    } catch (e) {
      console.warn('[FFmpegMuxer] Cleanup warn:', e.message);
    }

    return outputBlob;
  },

  async extractAudio(inputFile, opts = {}) {
    const ffmpeg = await this._load();
    const { onProgress = null } = opts;

    if (onProgress) {
      ffmpeg.on('progress', ({ progress }) => onProgress(progress));
    }

    const inputData = new Uint8Array(await inputFile.arrayBuffer());
    await ffmpeg.writeFile('input.mp4', inputData);

    await ffmpeg.exec([
      '-i', 'input.mp4',
      '-vn',
      '-c:a', 'copy',
      '-movflags', '+faststart',
      'audio.m4a'
    ]);

    const audioData = await ffmpeg.readFile('audio.m4a');
    const audioBlob = new Blob([audioData.buffer], { type: 'audio/mp4' });

    try {
      await ffmpeg.deleteFile('input.mp4');
      await ffmpeg.deleteFile('audio.m4a');
    } catch (e) {}

    return audioBlob;
  },

  async fastTrim(inputFile, startSec, endSec, opts = {}) {
    const ffmpeg = await this._load();
    const { onProgress = null } = opts;

    if (onProgress) {
      ffmpeg.on('progress', ({ progress }) => onProgress(progress));
    }

    const inputData = new Uint8Array(await inputFile.arrayBuffer());
    await ffmpeg.writeFile('input.mp4', inputData);

    const duration = endSec - startSec;

    await ffmpeg.exec([
      '-ss', String(startSec),
      '-i', 'input.mp4',
      '-t', String(duration),
      '-c', 'copy',
      '-movflags', '+faststart',
      'trimmed.mp4'
    ]);

    const outData = await ffmpeg.readFile('trimmed.mp4');
    const outBlob = new Blob([outData.buffer], { type: 'video/mp4' });

    try {
      await ffmpeg.deleteFile('input.mp4');
      await ffmpeg.deleteFile('trimmed.mp4');
    } catch (e) {}

    return outBlob;
  }
};

if (typeof window !== 'undefined') {
  window.FFmpegMuxer = FFmpegMuxer;
  console.log('[FFmpegMuxer] ✅ Loaded (v1.3 — path GitHub ready)');
}