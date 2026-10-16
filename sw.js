/**
 * ═══════════════════════════════════════════════════════════════════════════
 * AI CLIPPER AGENT — SERVICE WORKER v2.7.5
 * ═══════════════════════════════════════════════════════════════════════════
 * v2.7.5 UPDATE:
 *  ✅ GitHub Releases host ditambahkan ke AI_MODEL_HOSTS
 *  ✅ Cache handler wasm dioptimalkan untuk redirect GitHub
 *  ✅ Semua handler lama UTUH
 * ═══════════════════════════════════════════════════════════════════════════
 */

let CACHE_NAME = 'ai-agent-cache-v2.7.5';
const AI_CACHE_NAME = 'ai-agent-models-v1';
const LLM_CACHE_NAME = 'ai-agent-llm-models-v1';
const FAILED_CACHE_NAME = 'ai-agent-failed-v1';

const LEGACY_CACHE_PREFIXES = ['ai-agent-cache-'];

const NETWORK_FIRST = [
  'version.json',
  'update-auto.js',
  'version-registry.js',
  'version-badge.js',
  'sw.js',
  'index.html',
  'app.html'
];

const CORE_ASSETS = [
  './', './index.html',
  './style.css', './premium-ui.css',

  './script.js', './resource-manager.js', './video-signal-engine.js', './hooks-db.js',
  './clipper-core.js',

  './mp4-trim.js', './mp4box.all.min.js', './mp4-muxer.min.js',

  // ─── FFmpeg (ROOT — struktur yang benar) ───
  './ffmpeg.js',
  './814.ffmpeg.js',
  './ffmpeg-core.js',
  // NOTE: ffmpeg-core.wasm TIDAK di-cache di sini karena di-load dari GitHub Releases
  // (akan otomatis di-cache oleh AI_MODEL_HOSTS handler di bawah)

  './features-v2.js', './turbo-mode.js', './auto-save.js',
  './ai.js', './ai-bridge.js', './ai-worker.js',
  './llm-engine.js', './llm-cache.js', './llm-patch.js',
  './auto-config.js', './auto-config-backup.js',
  './main.js',

  './webcodecs-trimmer.js',
  './smart-trimmer.js',
  './trim-router.js',
  './ffmpeg-muxer.js',

  './version-registry.js', './update-auto.js',
  './version.json', './manifest.json',

  './whisper-auto.js', './Whisper-addon.js',
  './upgrades-v26.js',
  './app.html', './privacy.html', './terms.html',
  './icon-192.png', './icon-512.png',

  // ─── MediaPipe Self-Hosted ───
  './models/mediapipe-tasks-vision.js',
  './models/wasm/vision_wasm_internal.js',
  './models/wasm/vision_wasm_internal.wasm',
  './models/wasm/vision_wasm_nosimd_internal.js',
  './models/wasm/vision_wasm_nosimd_internal.wasm',
  './models/face.tflite',
  './models/pose.task',
  './models/gesture.task',
  './models/object.tflite',
  './models/classifier.tflite'
];

// ⚡ FIX v2.7.5: GitHub Releases + redirect target ditambahkan
const AI_MODEL_HOSTS = [
  'storage.googleapis.com',
  'cdn.jsdelivr.net',
  'unpkg.com',
  'github.com',                              // ← redirect awal GitHub Releases
  'objects.githubusercontent.com',           // ← redirect target lama
  'release-assets.githubusercontent.com'     // ← redirect target baru
];

const LLM_MODEL_HOSTS = ['huggingface.co', 'cdn-lfs.huggingface.co'];

async function resolveCacheNameOnActivate() {
  try {
    const keys = await caches.keys();
    const ours = keys
      .filter(k => LEGACY_CACHE_PREFIXES.some(p => k.startsWith(p)))
      .filter(k => k !== FAILED_CACHE_NAME);
    if (ours.length > 0) {
      ours.sort().reverse();
      CACHE_NAME = ours[0];
      console.log('[SW] ♻️ Cache name dipulihkan:', CACHE_NAME);
    } else {
      console.log('[SW] ℹ️ Tidak ada cache lama, pakai default:', CACHE_NAME);
    }
  } catch (e) {
    console.warn('[SW] resolveCacheNameOnActivate gagal:', e);
  }
}

async function fetchVersionName() {
  try {
    const res = await fetch('./version.json?t=' + Date.now(), { cache: 'no-store' });
    if (res.ok) {
      const info = await res.json();
      return 'ai-agent-cache-v' + (info.version || 'unknown');
    }
  } catch (e) {}
  return 'ai-agent-cache-fallback';
}

async function recordFailedAsset(asset, reason) {
  try {
    const cache = await caches.open(FAILED_CACHE_NAME);
    await cache.put(
      new Request('./__failed__/' + encodeURIComponent(asset)),
      new Response(JSON.stringify({ asset, reason, ts: Date.now() }),
        { headers: { 'Content-Type': 'application/json' } })
    );
  } catch (e) {}
}

async function clearFailedAssets() {
  try { await caches.delete(FAILED_CACHE_NAME); } catch (e) {}
}

async function listFailedAssets() {
  try {
    const cache = await caches.open(FAILED_CACHE_NAME);
    const keys = await cache.keys();
    const out = [];
    for (const req of keys) {
      const res = await cache.match(req);
      if (res) { try { out.push(await res.json()); } catch (e) {} }
    }
    return out;
  } catch (e) { return []; }
}

// ═══════════════════════════════════════════════════════════════════════
// INSTALL
// ═══════════════════════════════════════════════════════════════════════
self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const newName = await fetchVersionName();
    CACHE_NAME = newName;
    console.log('[SW] 📦 Installing:', CACHE_NAME);

    const cache = await caches.open(CACHE_NAME);
    let ok = 0, fail = 0;
    const failedList = [];

    for (const asset of CORE_ASSETS) {
      try {
        await cache.add(asset);
        ok++;
      } catch (e) {
        fail++;
        failedList.push(asset);
        await recordFailedAsset(asset, e.message || 'fetch failed');
      }
    }

    console.log(`[SW] ✅ Cached ${ok}/${CORE_ASSETS.length} (${fail} skipped)`);
    if (failedList.length > 0) {
      console.log(
        '%c[SW] ℹ️ File tidak ter-cache (normal kalau tidak ada di folder):',
        'color:#f59e0b;font-weight:bold;'
      );
      console.log(failedList.join('\n  '));
    }

    await self.skipWaiting();
  })());
});

// ═══════════════════════════════════════════════════════════════════════
// ACTIVATE
// ═══════════════════════════════════════════════════════════════════════
self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    await resolveCacheNameOnActivate();

    const keys = await caches.keys();
    const toDelete = keys.filter(k =>
      k !== CACHE_NAME &&
      k !== AI_CACHE_NAME &&
      k !== LLM_CACHE_NAME &&
      k !== FAILED_CACHE_NAME
    );

    if (toDelete.length > 0) {
      await Promise.all(toDelete.map(k => caches.delete(k)));
      console.log('[SW] 🗑 Cache lama dihapus:', toDelete.length);
    }

    await self.clients.claim();
    console.log('[SW] ✅ Activated:', CACHE_NAME);
  })());
});

// ═══════════════════════════════════════════════════════════════════════
// FETCH
// ═══════════════════════════════════════════════════════════════════════
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);
  const isSameOrigin = url.origin === self.location.origin;

  if (!url.protocol.startsWith('http')) return;

  // ═══ LLM MODEL CACHE ═══
  if (LLM_MODEL_HOSTS.some(h => url.hostname.includes(h))) {
    event.respondWith(
      caches.open(LLM_CACHE_NAME).then(cache =>
        cache.match(event.request).then(cached => {
          if (cached) return cached;
          return fetch(event.request).then(res => {
            if (res && res.status === 200) cache.put(event.request, res.clone()).catch(() => {});
            return res;
          }).catch(() => new Response('', { status: 503 }));
        })
      )
    );
    return;
  }

  // ═══ AI MODEL CACHE (termasuk GitHub Releases wasm) ═══
  // ⚡ FIX v2.7.5: Handle redirect GitHub + simpan response akhir
  if (AI_MODEL_HOSTS.some(h => url.hostname === h)) {
    event.respondWith(
      caches.open(AI_CACHE_NAME).then(async (cache) => {
        // 1. Cek cache dulu
        const cached = await cache.match(event.request);
        if (cached) {
          console.log('[SW] ⚡ AI model dari cache:', url.pathname.split('/').pop());
          return cached;
        }

        // 2. Fetch (browser akan otomatis follow redirect GitHub)
        try {
          const res = await fetch(event.request, {
            // 'omit' credentials untuk menghindari CORS preflight
            credentials: 'omit',
            // biarkan browser follow redirect (default)
            redirect: 'follow',
          });

          // 3. Hanya cache response OK (bukan partial / 3xx / error)
          if (res && res.status === 200) {
            const clone = res.clone();
            cache.put(event.request, clone).catch((e) => {
              console.warn('[SW] ⚠️ Gagal cache AI model:', e.message);
            });
            console.log('[SW] 💾 AI model di-cache:', url.pathname.split('/').pop());
          }

          return res;
        } catch (err) {
          console.warn('[SW] ❌ Fetch AI model gagal:', err.message);
          return new Response('', { status: 503 });
        }
      })
    );
    return;
  }

  // ═══ NETWORK FIRST (index.html, sw.js, version.json, dll) ═══
  const isNetworkFirst = isSameOrigin && NETWORK_FIRST.some(f =>
    url.pathname.endsWith('/' + f) || url.pathname.endsWith(f)
  );

  if (isNetworkFirst) {
    event.respondWith(
      fetch(event.request)
        .then(res => {
          if (res && res.status === 200) {
            const clone = res.clone();
            caches.open(CACHE_NAME).then(c => c.put(event.request, clone)).catch(() => {});
          }
          return res;
        })
        .catch(() => caches.match(event.request).then(r => r || caches.match('./index.html')))
    );
    return;
  }

  // ═══ CACHE FIRST (default) ═══
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(res => {
        if (res && res.status === 200 && isSameOrigin) {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(event.request, clone)).catch(() => {});
        }
        return res;
      }).catch(() => {
        if (event.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
        return new Response('', { status: 503 });
      });
    })
  );
});

// ═══════════════════════════════════════════════════════════════════════
// MESSAGE ROUTER
// ═══════════════════════════════════════════════════════════════════════
self.addEventListener('message', (event) => {
  if (!event.data) return;

  if (event.data.type === 'SKIP_WAITING') { self.skipWaiting(); return; }

  if (event.data.type === 'CLEAR_CACHE') {
    event.waitUntil((async () => {
      const keys = await caches.keys();
      await Promise.all(keys.map(k => caches.delete(k)));
    })());
    return;
  }

  if (event.data.type === 'CLEAR_AI_MODELS') { event.waitUntil(caches.delete(AI_CACHE_NAME)); return; }
  if (event.data.type === 'CLEAR_LLM_MODELS') { event.waitUntil(caches.delete(LLM_CACHE_NAME)); return; }

  if (event.data.type === 'GET_VERSION') {
    event.waitUntil((async () => {
      const v = await fetchVersionName();
      if (event.source && event.source.postMessage) {
        event.source.postMessage({ type: 'VERSION_INFO', cacheName: v, currentCache: CACHE_NAME });
      }
    })());
    return;
  }

  if (event.data.type === 'GET_AI_CACHE_INFO') {
    event.waitUntil((async () => {
      try {
        const cache = await caches.open(AI_CACHE_NAME);
        const keys = await cache.keys();
        const llmCache = await caches.open(LLM_CACHE_NAME);
        const llmKeys = await llmCache.keys();
        if (event.source && event.source.postMessage) {
          event.source.postMessage({
            type: 'AI_CACHE_INFO',
            count: keys.length,
            llmCount: llmKeys.length,
            urls: keys.map(r => r.url)
          });
        }
      } catch (e) {
        if (event.source) {
          event.source.postMessage({ type: 'AI_CACHE_INFO', count: 0, llmCount: 0, urls: [] });
        }
      }
    })());
    return;
  }

  if (event.data.type === 'LIST_CACHES') {
    event.waitUntil((async () => {
      const keys = await caches.keys();
      if (event.source) event.source.postMessage({ type: 'CACHE_LIST', caches: keys });
    })());
    return;
  }

  if (event.data.type === 'LIST_FAILED_ASSETS') {
    event.waitUntil((async () => {
      const failed = await listFailedAssets();
      if (event.source && event.source.postMessage) {
        event.source.postMessage({ type: 'FAILED_ASSETS', assets: failed });
      }
    })());
    return;
  }

  if (event.data.type === 'CLEAR_FAILED_ASSETS') { event.waitUntil(clearFailedAssets()); return; }

  if (event.data.type === 'RETRY_FAILED') {
    event.waitUntil((async () => {
      const failed = await listFailedAssets();
      const cache = await caches.open(CACHE_NAME);
      let retried = 0, ok = 0;

      for (const item of failed) {
        retried++;
        try { await cache.add(item.asset); ok++; } catch (e) {}
      }

      await clearFailedAssets();

      for (const item of failed) {
        try { await cache.match(item.asset); }
        catch (e) { await recordFailedAsset(item.asset, 'still failing after retry'); }
      }

      if (event.source && event.source.postMessage) {
        event.source.postMessage({ type: 'RETRY_COMPLETE', retried, ok, failed: retried - ok });
      }
    })());
    return;
  }

  if (event.data.type === 'FORCE_RELOAD_ALL') {
    event.waitUntil((async () => {
      const keys = await caches.keys();
      await Promise.all(keys.map(k => caches.delete(k)));
      const clients = await self.clients.matchAll();
      clients.forEach(c => { try { c.postMessage({ type: 'RELOAD_NOW' }); } catch (e) {} });
    })());
    return;
  }
});

console.log(
  '%c[SW v2.7.5] ✅ Loaded — GitHub Releases cache support aktif',
  'color:#38bdf8;font-weight:bold;font-size:13px;padding:4px 0;'
);