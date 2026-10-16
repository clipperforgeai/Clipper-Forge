/**
 * ═══════════════════════════════════════════════════════════════════════════
 * POLISH V9 — GACOR MODE (Psychology-Driven Copy v1.0)
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Layer baru di atas V4-V8. Menambahkan:
 *   1. 🧠 Hook Pattern Interrupts (6 pola per region)
 *   2. 💬 CTA Psychology Triggers (Ego, Save, Debate, Tag, Poll, Story)
 *   3. #️⃣ Hashtag Strategy (trending + niche + long-tail + hook-tag)
 *   4. ⚡ Power Words injection
 * 
 * Load SETELAH hooks-db.js dan file polish-v*.js lain.
 * ═══════════════════════════════════════════════════════════════════════════
 */

(function () {
  'use strict';
  if (window.__POLISH_V9_LOADED) return;
  window.__POLISH_V9_LOADED = true;

  console.log('%c[Polish V9] 🔥 GACOR MODE loading...', 'color:#f97316;font-weight:bold;font-size:13px');

  // ═══════════════════════════════════════════════════════════════════════
  // SECTION 1: HOOK PATTERN INTERRUPTS
  // ═══════════════════════════════════════════════════════════════════════
  // 6 pola pembuka yang "memaksa" user stop scroll.
  // Setiap pola punya template dengan {topic} yang di-replace.
  // ═══════════════════════════════════════════════════════════════════════

  const HOOK_PATTERNS = {
    'id-ID': {
      // 1. Contrarian — tantang asumsi
      contrarian: [
        'SEMUA ORANG SALAH SOAL {topic}',
        'INI BUKAN YANG KAMU PIKIR TENTANG {topic}',
        'STOP! CARA KAMU LIHAT {topic} BENER-BENER SALAH',
        'JANGAN PERCAYA MITOS {topic} INI',
        'TURNS OUT {topic} SAMA SEKALI BEDA'
      ],
      // 2. Confession — pengakuan jujur
      confession: [
        'AKU NGGAK MAU NGAKU TAPI...',
        'SAYA SALAH SELAMA INI SOAL {topic}',
        'JANGAN BILANG SIAPA-SIAPA YA...',
        'HARUS AKU AKUI, INI YANG BIKIN NYESEL',
        'AKU BARU SADAR SETELAH LIHAT INI'
      ],
      // 3. Urgency — takut ketinggalan
      urgency: [
        'SAVE DULU SEBELUM HILANG!',
        'JANGAN SKIP — INI PENTING BANGET!',
        'KAMU NGGAK AKAN LIHAT INI LAGI',
        'CEK CEPAT SEBELUM DIHAPUS!',
        'WAKTU KAMU CUMA 3 DETIK — LIHAT INI!'
      ],
      // 4. Insider — info orang dalam
      insider: [
        'BARU TAU INI SETELAH BERTAHUN-TAHUN',
        'ORANG DALAM NGGAK MAU KASIH TAU INI',
        'INI YANG NGGAK DIAJARIN DI SEKOLAH',
        'RAHASIA {topic} YANG JARANG DIBONGKAR',
        'INDUSTRY INSIDER: INI YANG SEBENARNYA TERJADI'
      ],
      // 5. Challenge — tantang penonton
      challenge: [
        'COBA TEBAK APA YANG TERJADI DI SINI',
        '90% ORANG SALAH JAWAB INI',
        'KALAU KAMU JAGO, JAWAB INI',
        'TES MATA: ADA APA DI DETIK INI?',
        'COBA LIHAT SEKALI LAGI... NGGAK KELIHATAN?'
      ],
      // 6. Reversal — ekspektasi dibalik
      reversal: [
        'DIKIRA BIASA, TERNYATA GILA',
        'AWALNYA NGGAK MENARIK... SAMPAI DETIK INI',
        'TERLIHAT SEPELE, TAPI NYATANYA...',
        'MULAI TENANG... TERUS JADI GINI',
        'KELIHATAN SEPERTI ITU, TERNYATA BEDA TOTAL'
      ]
    },

    'en-US': {
      contrarian: [
        'EVERYONE IS WRONG ABOUT {topic}',
        'THIS ISN\'T WHAT YOU THINK ABOUT {topic}',
        'STOP! YOUR VIEW ON {topic} IS COMPLETELY OFF',
        'DON\'T BELIEVE THIS {topic} MYTH',
        'TURNS OUT {topic} IS THE OPPOSITE'
      ],
      confession: [
        'I DON\'T WANT TO ADMIT THIS BUT...',
        'I WAS WRONG ABOUT {topic} THIS WHOLE TIME',
        'DON\'T TELL ANYONE BUT...',
        'I HAVE TO CONFESS, THIS ONE HIT DIFFERENT',
        'I JUST REALIZED AFTER SEEING THIS'
      ],
      urgency: [
        'SAVE THIS BEFORE IT\'S GONE!',
        'DON\'T SKIP — THIS MATTERS!',
        'YOU WON\'T SEE THIS AGAIN',
        'WATCH FAST BEFORE IT\'S DELETED!',
        'YOU ONLY HAVE 3 SECONDS — WATCH THIS!'
      ],
      insider: [
        'JUST FOUND OUT AFTER YEARS',
        'INSIDERS WON\'T TELL YOU THIS',
        'THEY DON\'T TEACH THIS IN SCHOOL',
        'THE {topic} SECRET NOBODY TALKS ABOUT',
        'INDUSTRY INSIDER: HERE\'S WHAT ACTUALLY HAPPENS'
      ],
      challenge: [
        'TRY GUESSING WHAT HAPPENS HERE',
        '90% OF PEOPLE GET THIS WRONG',
        'IF YOU\'RE GOOD, ANSWER THIS',
        'EYE TEST: WHAT DO YOU SEE IN THIS FRAME?',
        'WATCH AGAIN... STILL DON\'T SEE IT?'
      ],
      reversal: [
        'LOOKED NORMAL, TURNED INSANE',
        'STARTED BORING... THEN THIS HAPPENED',
        'SEEMED TRIVIAL, BUT ACTUALLY...',
        'STARTED CALM... THEN IT WENT LIKE THIS',
        'LOOKED LIKE THAT, BUT WAS TOTAL OPPOSITE'
      ]
    },

    'en-GB': {
      contrarian: [
        'EVERYONE\'S WRONG ABOUT {topic}',
        'THAT\'S NOT WHAT {topic} ACTUALLY IS',
        'PROPER STOP! YOUR TAKE ON {topic} IS OFF',
        'DON\'T BUY INTO THIS {topic} MYTH',
        'TURNS OUT {topic} IS THE OPPOSITE MATE'
      ],
      confession: [
        'WON\'T ADMIT THIS BUT...',
        'I WAS PROPER WRONG ABOUT {topic}',
        'KEEP THIS QUIET BUT...',
        'GOTTA BE HONEST, THIS HIT DIFFERENT',
        'ONLY REALIZED AFTER SEEING THIS'
      ],
      urgency: [
        'SAVE THIS BEFORE IT\'S GONE!',
        'DON\'T SKIP — MATTERS THIS ONE!',
        'WON\'T SEE THIS AGAIN MATE',
        'WATCH QUICK BEFORE IT\'S GONE!',
        'GOT 3 SECONDS — HAVE A LOOK!'
      ],
      insider: [
        'JUST FOUND OUT AFTER YEARS',
        'INSIDERS WON\'T TELL YOU THIS',
        'THEY DON\'T TEACH THIS AT SCHOOL',
        'THE {topic} SECRET NOBODY TALKS ABOUT',
        'INDUSTRY INSIDER: HERE\'S THE TRUTH'
      ],
      challenge: [
        'HAVE A GUESS WHAT HAPPENS',
        '90% GET THIS WRONG MATE',
        'IF YOU\'RE GOOD, ANSWER THIS',
        'EYE TEST: SPOT IT IN THIS FRAME?',
        'WATCH AGAIN... STILL MISSED IT?'
      ],
      reversal: [
        'LOOKED NORMAL, WENT PROPER MENTAL',
        'STARTED DULL... THEN THIS HAPPENED',
        'SEEMED TRIVIAL, BUT ACTUALLY...',
        'STARTED CALM... THEN WENT LIKE THIS',
        'LOOKED LIKE THAT, WAS OPPOSITE MATE'
      ]
    },

    'en-CA': {
      contrarian: [
        'EVERYONE\'S WRONG ABOUT {topic}',
        'THAT\'S NOT WHAT {topic} IS EH',
        'HOLD ON! YOUR TAKE ON {topic} IS OFF',
        'DON\'T BELIEVE THIS {topic} MYTH',
        'TURNS OUT {topic} IS THE OPPOSITE'
      ],
      confession: [
        'DON\'T WANT TO ADMIT THIS BUT...',
        'I WAS WRONG ABOUT {topic} THIS WHOLE TIME',
        'KEEP THIS QUIET BUT...',
        'GOTTA BE HONEST, THIS HIT DIFFERENT EH',
        'ONLY REALIZED AFTER SEEING THIS'
      ],
      urgency: [
        'SAVE THIS BEFORE IT\'S GONE!',
        'DON\'T SKIP — THIS ONE MATTERS!',
        'WON\'T SEE THIS AGAIN EH',
        'WATCH FAST BEFORE IT\'S DELETED!',
        '3 SECONDS ONLY — WATCH THIS!'
      ],
      insider: [
        'JUST FOUND OUT AFTER YEARS',
        'INSIDERS WON\'T TELL YOU THIS',
        'THEY DON\'T TEACH THIS IN SCHOOL',
        'THE {topic} SECRET NOBODY TALKS ABOUT',
        'INDUSTRY INSIDER: HERE\'S THE TRUTH EH'
      ],
      challenge: [
        'TRY GUESSING WHAT HAPPENS',
        '90% GET THIS WRONG EH',
        'IF YOU\'RE GOOD, ANSWER THIS',
        'EYE TEST: SEE IT IN THIS FRAME?',
        'WATCH AGAIN... STILL MISSED IT?'
      ],
      reversal: [
        'LOOKED NORMAL, WENT INSANE',
        'STARTED BORING... THEN THIS HAPPENED',
        'SEEMED TRIVIAL, BUT ACTUALLY...',
        'STARTED CALM... THEN WENT LIKE THIS',
        'LOOKED LIKE THAT, WAS OPPOSITE EH'
      ]
    }
  };

  // ═══════════════════════════════════════════════════════════════════════
  // SECTION 2: CTA PSYCHOLOGY TRIGGERS
  // ═══════════════════════════════════════════════════════════════════════
  // 6 tipe CTA yang trigger engagement berbeda.
  // ═══════════════════════════════════════════════════════════════════════

  const CTA_PSYCHOLOGY = {
    'id-ID': {
      egoBait: [
        'Kalau kamu jago {topic}, komen 👇',
        'Yang paham {topic}, pasti setuju. Komen 👇',
        'Cuma yang bener-bener ngerti yang bakal komen',
        'Pro player {topic} pasti notice ini 👇',
        'Kalau kamu expert, buktiin di komen 👇'
      ],
      saveTrigger: [
        'Save dulu, nanti kamu butuh 📌',
        'Simpan sebelum hilang, serius 📌',
        'Bookmark ini — 100% bakal berguna 📌',
        'Save, nanti kamu bakal nyari ini lagi 📌',
        'Taruh di bookmark, ini penting 📌'
      ],
      debate: [
        'Setuju nggak? Komen alasannya 👇',
        'A atau B? Komen 1 atau 2 👇',
        'Komen pendapat — asal jangan toxic 👇',
        'Debat sini, jangan di DM 👇',
        'Komen: kamu tim mana? 👇'
      ],
      tag: [
        'Tag temen yang harus lihat ini 📩',
        'Tag orang yang bakal relate sama ini 📩',
        'Send ke grup WA kamu 📩',
        'Tag temen yang butuh lihat ini sekarang 📩',
        'Share ke yang lagi belajar {topic} 📩'
      ],
      poll: [
        'Rate 1-10 👇',
        'Setuju = ❤️ | Nggak = 😢',
        'Komen angka 1-5 👇',
        'Skor kamu berapa? 👇',
        'Cek reaksi kamu: 🔥 / 💀 / 😭'
      ],
      story: [
        'Komen cerita kamu yang mirip 👇',
        'Ada yang pernah ngalamin ini? 👇',
        'Ceritain pengalaman kamu di komen 👇',
        'Yang relate, drop cerita singkat 👇',
        'Punya cerita serupa? Cerita dong 👇'
      ]
    },

    'en-US': {
      egoBait: [
        'If you\'re good at {topic}, comment 👇',
        'Real {topic} pros will agree. Drop a 👇',
        'Only true experts will comment here',
        'Pro players know this 👇',
        'If you\'re expert, prove it in comments 👇'
      ],
      saveTrigger: [
        'Save this — you\'ll need it later 📌',
        'Bookmark before it\'s gone, seriously 📌',
        'Save this, 100% useful later 📌',
        'Save it — you\'ll come back for this 📌',
        'Bookmark this, this is important 📌'
      ],
      debate: [
        'Agree or nah? Comment why 👇',
        'A or B? Comment 1 or 2 👇',
        'Drop your take — no toxicity 👇',
        'Debate in comments, not DMs 👇',
        'Comment: which side are you on? 👇'
      ],
      tag: [
        'Tag someone who needs to see this 📩',
        'Tag the person who\'d relate 📩',
        'Send to your group chat 📩',
        'Tag a friend who needs this now 📩',
        'Share with someone learning {topic} 📩'
      ],
      poll: [
        'Rate 1-10 👇',
        'Agree = ❤️ | Nah = 😢',
        'Drop a number 1-5 👇',
        'What\'s your score? 👇',
        'Your reaction: 🔥 / 💀 / 😭'
      ],
      story: [
        'Comment your similar story 👇',
        'Anyone experienced this before? 👇',
        'Share your experience in comments 👇',
        'If you relate, drop a short story 👇',
        'Got a similar story? Tell us 👇'
      ]
    },

    'en-GB': {
      egoBait: [
        'If you\'re good at {topic}, comment 👇',
        'Real {topic} pros agree. Drop a 👇',
        'Only proper experts comment here',
        'Pro players know this one 👇',
        'If you\'re expert, prove it mate 👇'
      ],
      saveTrigger: [
        'Save this — you\'ll need it 📌',
        'Bookmark before it goes, seriously 📌',
        'Save this, proper useful later 📌',
        'Save it — you\'ll come back 📌',
        'Bookmark this, it matters 📌'
      ],
      debate: [
        'Agree or nah? Comment why 👇',
        'A or B? Comment 1 or 2 👇',
        'Drop your take — be civil 👇',
        'Debate here, not DMs 👇',
        'Comment: which side? 👇'
      ],
      tag: [
        'Tag someone who needs to see this 📩',
        'Tag the person who\'d relate 📩',
        'Send to your group chat 📩',
        'Tag a mate who needs this now 📩',
        'Share with someone learning {topic} 📩'
      ],
      poll: [
        'Rate 1-10 👇',
        'Agree = ❤️ | Nah = 😢',
        'Drop a number 1-5 👇',
        'What\'s your score? 👇',
        'Your reaction: 🔥 / 💀 / 😭'
      ],
      story: [
        'Comment your similar story 👇',
        'Anyone had this before? 👇',
        'Share your experience below 👇',
        'If you relate, drop a story 👇',
        'Got a similar one? Tell us 👇'
      ]
    },

    'en-CA': {
      egoBait: [
        'If you\'re good at {topic}, comment eh 👇',
        'Real {topic} pros agree. Drop a 👇',
        'Only true experts will comment',
        'Pro players know this 👇',
        'If you\'re expert, prove it in comments eh 👇'
      ],
      saveTrigger: [
        'Save this — you\'ll need it later 📌',
        'Bookmark before it\'s gone, seriously 📌',
        'Save this, 100% useful eh 📌',
        'Save it — you\'ll come back 📌',
        'Bookmark this, important eh 📌'
      ],
      debate: [
        'Agree or nah? Comment why 👇',
        'A or B? Comment 1 or 2 👇',
        'Drop your take — keep it friendly 👇',
        'Debate in comments, not DMs 👇',
        'Comment: which side eh? 👇'
      ],
      tag: [
        'Tag someone who needs to see this 📩',
        'Tag the person who\'d relate eh 📩',
        'Send to your group chat 📩',
        'Tag a friend who needs this now 📩',
        'Share with someone learning {topic} 📩'
      ],
      poll: [
        'Rate 1-10 👇',
        'Agree = ❤️ | Nah = 😢',
        'Drop a number 1-5 👇',
        'What\'s your score eh? 👇',
        'Your reaction: 🔥 / 💀 / 😭'
      ],
      story: [
        'Comment your similar story 👇',
        'Anyone experienced this before eh? 👇',
        'Share your experience below 👇',
        'If you relate, drop a story 👇',
        'Got a similar one eh? Tell us 👇'
      ]
    }
  };

  // ═══════════════════════════════════════════════════════════════════════
  // SECTION 3: POWER WORDS (untuk inject ke caption)
  // ═══════════════════════════════════════════════════════════════════════

  const POWER_WORDS = {
    'id-ID': [
      'GILA', 'PARAH', 'BENER-BENER', 'SERIUS', 'NGGAK MASUK AKAL',
      'FIX', 'SPILL', 'RIIL', 'DAGING BANGET', 'SYOK PARAH'
    ],
    'en-US': [
      'INSANE', 'WILD', 'CRAZY', 'SERIOUSLY', 'UNREAL',
      'FOR REAL', 'NO CAP', 'DEADASS', 'MIND-BLOWING', 'INCREDIBLE'
    ],
    'en-GB': [
      'MAD', 'PROPER', 'ABSOLUTE', 'SERIOUSLY', 'UNREAL',
      'MENTAL', 'MASSIVE', 'BRILLIANT', 'GENUINELY', 'PROPERLY'
    ],
    'en-CA': [
      'WILD', 'INSANE', 'SERIOUSLY', 'UNREAL', 'CRAZY EH',
      'FOR REAL', 'NO CAP', 'DEADASS', 'GENUINELY', 'MIND-BLOWING'
    ]
  };

  // ═══════════════════════════════════════════════════════════════════════
  // SECTION 4: HASHTAG STRATEGY
  // ═══════════════════════════════════════════════════════════════════════
  // Formula: 1 trending + 2 niche + 2 long-tail + 1 hook-tag
  // ═══════════════════════════════════════════════════════════════════════

  const HOOK_TAGS = {
    'contrarian': { 'id-ID': '#Kontroversi', 'en-US': '#HotTake', 'en-GB': '#HotTake', 'en-CA': '#HotTake' },
    'confession': { 'id-ID': '#CurhatJujur', 'en-US': '#Confession', 'en-GB': '#Confession', 'en-CA': '#Confession' },
    'urgency':    { 'id-ID': '#WajibTonton', 'en-US': '#MustWatch', 'en-GB': '#MustWatch', 'en-CA': '#MustWatch' },
    'insider':    { 'id-ID': '#RahasiaTerbongkar', 'en-US': '#InsiderTip', 'en-GB': '#InsiderTip', 'en-CA': '#InsiderTip' },
    'challenge':  { 'id-ID': '#TantanganViral', 'en-US': '#Challenge', 'en-GB': '#Challenge', 'en-CA': '#Challenge' },
    'reversal':   { 'id-ID': '#PlotTwist', 'en-US': '#PlotTwist', 'en-GB': '#PlotTwist', 'en-CA': '#PlotTwist' }
  };

  const LONG_TAIL = {
    'id-ID': {
      'Gaming & Esports':            ['#gamingindonesia', '#clipsgamingid'],
      'Sports & Fitness':            ['#olahragaindonesia', '#fitnessid'],
      'Podcast & Talkshow':          ['#podcastindonesia', '#talkshowid'],
      'Comedy & Entertainment':      ['#komediindonesia', '#lucubanget'],
      'Education & Knowledge':       ['#edukasiindonesia', '#serunyabelajar'],
      'Finance & Crypto':            ['#investasiindonesia', '#cryptoid'],
      'Technology & AI':             ['#techindonesia', '#reviewgadgetid'],
      'Business & Entrepreneurship': ['#bisnisindonesia', '#umkmid'],
      'Motivation & Self-Growth':    ['#motivasiindonesia', '#mindsetid'],
      'Film & TV Series':            ['#filmindonesia', '#seriesid'],
      'Culinary & Food':             ['#kulinerindonesia', '#resepmudah'],
      'Travel & Lifestyle':          ['#travelingindonesia', '#wisataid'],
      'Storytelling & Mystery':      ['#misteriindonesia', '#ceritahoror'],
      'Interview & Discussion':      ['#interviewid', '#diskusipanas'],
      'Reaction & Review':           ['#reaksiindonesia', '#reviewjujurid'],
      'Lifestyle & Fashion':         ['#fashionindonesia', '#ootdid'],
      'Entertainment':               ['#hiburanid', '#viralindonesia'],
      'General Content':             ['#fypindonesia', '#kontenviralid']
    },
    'en-US': {
      'Gaming & Esports':            ['#gamingclips', '#gamertok'],
      'Sports & Fitness':            ['#fitnesslife', '#sportstok'],
      'Podcast & Talkshow':          ['#podcastclips', '#podcasttok'],
      'Comedy & Entertainment':      ['#comedytok', '#funnyclips'],
      'Education & Knowledge':       ['#learnontiktok', '#didyouknow'],
      'Finance & Crypto':            ['#moneytips', '#investingtips'],
      'Technology & AI':             ['#techtok', '#techreview'],
      'Business & Entrepreneurship': ['#smallbiz', '#entrepreneurtok'],
      'Motivation & Self-Growth':    ['#selfgrowth', '#mindsettok'],
      'Film & TV Series':            ['#movietok', '#tvclips'],
      'Culinary & Food':             ['#foodtok', '#recipevideo'],
      'Travel & Lifestyle':          ['#traveltok', '#lifestyleclips'],
      'Storytelling & Mystery':      ['#storytime', '#mysterytok'],
      'Interview & Discussion':      ['#talkshow', '#interviewtok'],
      'Reaction & Review':           ['#reactionvideo', '#honestreview'],
      'Lifestyle & Fashion':         ['#fashiontok', '#styletok'],
      'Entertainment':               ['#entertainment', '#viralclips'],
      'General Content':             ['#foryoupage', '#trendingnow']
    },
    'en-GB': {
      'Gaming & Esports':            ['#ukgaming', '#britishgamer'],
      'Sports & Fitness':            ['#ukfitness', '#britishsport'],
      'Podcast & Talkshow':          ['#ukpodcast', '#britishpodcast'],
      'Comedy & Entertainment':      ['#britishcomedy', '#ukcomedy'],
      'Education & Knowledge':       ['#uklearn', '#learnuk'],
      'Finance & Crypto':            ['#ukfinance', '#ukmoneytips'],
      'Technology & AI':             ['#uktech', '#techuk'],
      'Business & Entrepreneurship': ['#ukbusiness', '#ukstartup'],
      'Motivation & Self-Growth':    ['#ukmotivation', '#mindsetuk'],
      'Film & TV Series':            ['#ukfilm', '#britishtv'],
      'Culinary & Food':             ['#ukfood', '#britishfood'],
      'Travel & Lifestyle':          ['#uktravel', '#britishlife'],
      'Storytelling & Mystery':      ['#ukstorytime', '#britishmystery'],
      'Interview & Discussion':      ['#uktalkshow', '#ukinterview'],
      'Reaction & Review':           ['#ukreaction', '#ukreview'],
      'Lifestyle & Fashion':         ['#ukfashion', '#britishstyle'],
      'Entertainment':               ['#ukentertainment', '#ukfun'],
      'General Content':             ['#ukviral', '#foryouuk']
    },
    'en-CA': {
      'Gaming & Esports':            ['#canadagaming', '#torontogamer'],
      'Sports & Fitness':            ['#canadasports', '#canadafitness'],
      'Podcast & Talkshow':          ['#canadapodcast', '#canadatalkshow'],
      'Comedy & Entertainment':      ['#canadacomedy', '#canadianhumour'],
      'Education & Knowledge':       ['#canadalearn', '#canadatech'],
      'Finance & Crypto':            ['#canadafinance', '#canadacrypto'],
      'Technology & AI':             ['#canadatech', '#canadatechai'],
      'Business & Entrepreneurship': ['#canadabusiness', '#canadastartup'],
      'Motivation & Self-Growth':    ['#canadamotivation', '#canadamindset'],
      'Film & TV Series':            ['#canadafilm', '#canadiantv'],
      'Culinary & Food':             ['#canadafood', '#canadianrecipe'],
      'Travel & Lifestyle':          ['#canadatravel', '#canadiansummer'],
      'Storytelling & Mystery':      ['#canadastory', '#canadianmystery'],
      'Interview & Discussion':      ['#canadatalkshow', '#canadainterview'],
      'Reaction & Review':           ['#canadareaction', '#canadareview'],
      'Lifestyle & Fashion':         ['#canadafashion', '#canadianstyle'],
      'Entertainment':               ['#canadafun', '#canadianentertainment'],
      'General Content':             ['#canadatok', '#foryoucanada']
    }
  };

  // ═══════════════════════════════════════════════════════════════════════
  // SECTION 5: HELPERS
  // ═══════════════════════════════════════════════════════════════════════

  function createRNG(seed) {
    let s = Math.abs(seed | 0) || 1;
    return function () {
      s = (s * 1103515245 + 12345) & 0x7fffffff;
      return s / 0x7fffffff;
    };
  }

  function pick(arr, rng) {
    if (!arr || arr.length === 0) return '';
    return arr[Math.floor(rng() * arr.length)];
  }

  function getRegion(regionCode) {
    if (!regionCode || regionCode === 'auto') return 'id-ID';
    return HOOK_PATTERNS[regionCode] ? regionCode : 'id-ID';
  }

  // ═══════════════════════════════════════════════════════════════════════
  // SECTION 6: HOOK PATTERN APPLICATION
  // ═══════════════════════════════════════════════════════════════════════

  function applyHookPattern(hook, region, niche, clipIndex, context) {
    if (!hook) return hook;

    const patterns = HOOK_PATTERNS[region] || HOOK_PATTERNS['id-ID'];
    const patternKeys = Object.keys(patterns);
    if (patternKeys.length === 0) return hook;

    const seed = (clipIndex + 1) * 7919 + (niche || '').length * 31;
    const rng = createRNG(seed);

    // Pilih kategori pattern (rotate berdasarkan clipIndex)
    const categoryKey = patternKeys[clipIndex % patternKeys.length];
    const categoryPatterns = patterns[categoryKey];

    const topic = (context && context.topic) || niche || 'ini';
    let pattern = pick(categoryPatterns, rng);

    // Replace {topic}
    pattern = pattern.replace(/\{topic\}/g, topic);

    // Combine: pattern + body (kalau pattern pendek) atau pattern saja
    const patternLen = pattern.length;
    const bodyLen = hook.length;

    let finalHook;
    if (patternLen < 40 && bodyLen > 0) {
      // Pattern pendek → gabung dengan body (kalau body bukan duplikat)
      finalHook = pattern + ' ' + hook;
    } else if (patternLen >= 40) {
      // Pattern sudah kuat → pakai pattern saja (buang body lama)
      finalHook = pattern;
    } else {
      finalHook = hook;
    }

    // Cap max length 200 chars
    if (finalHook.length > 200) {
      finalHook = finalHook.slice(0, 197) + '...';
    }

    return finalHook;
  }

  // ═══════════════════════════════════════════════════════════════════════
  // SECTION 7: CTA PSYCHOLOGY APPLICATION
  // ═══════════════════════════════════════════════════════════════════════

  function applyCtaPsychology(cta, region, niche, clipIndex, context) {
    const pool = CTA_PSYCHOLOGY[region] || CTA_PSYCHOLOGY['id-ID'];
    const triggerKeys = Object.keys(pool);
    if (triggerKeys.length === 0) return cta;

    const seed = (clipIndex + 3) * 7919 + (niche || '').length * 41;
    const rng = createRNG(seed);

    // Rotate trigger berdasarkan clipIndex
    const triggerKey = triggerKeys[clipIndex % triggerKeys.length];
    const triggerList = pool[triggerKey];

    const topic = (context && context.topic) || niche || 'ini';
    let picked = pick(triggerList, rng);

    // Replace {topic}
    picked = picked.replace(/\{topic\}/g, topic);

    // 70% pakai picked, 30% pakai original (variasi)
    if (rng() < 0.7) {
      return picked;
    }
    return cta || picked;
  }

  // ═══════════════════════════════════════════════════════════════════════
  // SECTION 8: HASHTAG STRATEGY
  // ═══════════════════════════════════════════════════════════════════════

  function applyHashtagStrategy(hashtags, region, niche, clipIndex, hookCategory) {
    const current = Array.isArray(hashtags) ? hashtags.slice() : [];

    // 1. Trending (1) — pakai yang sudah ada atau default
    const trendingPool = {
      'id-ID': ['#fyp', '#viral', '#trending'],
      'en-US': ['#fyp', '#viral', '#trending'],
      'en-GB': ['#fyp', '#ukviral', '#trendinguk'],
      'en-CA': ['#fyp', '#canadaviral', '#trendingcanada']
    };
    const trending = (trendingPool[region] || trendingPool['id-ID'])[clipIndex % 3];

    // 2. Niche-specific (2) — dari hashtag yang sudah ada (V4-V6)
    const nicheExisting = current.filter(t => !trendingPool[region].includes(t)).slice(0, 2);

    // 3. Long-tail (2) — dari database
    const ltTable = LONG_TAIL[region] || LONG_TAIL['id-ID'];
    const ltTags = (ltTable[niche] || ltTable['General Content'] || []).slice(0, 2);

    // 4. Hook-tag (1) — dari kategori hook
    const hookTag = hookCategory && HOOK_TAGS[hookCategory]
      ? HOOK_TAGS[hookCategory][region]
      : null;

    // Merge dengan de-dup
    const merged = [];
    const push = (t) => {
      if (t && merged.indexOf(t) === -1 && merged.length < 6) merged.push(t);
    };

    push(trending);
    nicheExisting.forEach(push);
    ltTags.forEach(push);
    if (hookTag) push(hookTag);

    // Fill sisanya dari current (kalau masih kurang dari 6)
    for (const t of current) {
      if (merged.length >= 6) break;
      push(t);
    }

    return merged.slice(0, 6);
  }

  // ═══════════════════════════════════════════════════════════════════════
  // SECTION 9: MAIN WRAPPER — Hook into HookEngine
  // ═══════════════════════════════════════════════════════════════════════

  function boot() {
    if (!window.HookEngine) {
      setTimeout(boot, 100);
      return;
    }
    if (HookEngine.__polishV9Installed) return;
    HookEngine.__polishV9Installed = true;

    const _origBuild = HookEngine.buildUniquePackage.bind(HookEngine);

    HookEngine.buildUniquePackage = function (moment, niche, regionCode, clipIndex, usedSet) {
      // Panggil V4-V8 dulu
      const pkg = _origBuild(moment, niche, regionCode, clipIndex, usedSet);

      const region = getRegion(regionCode);
      const context = window.__clipContext || {};
      const seed = clipIndex || 0;

      // ─── 1. Apply Hook Pattern Interrupt ───
      const originalHook = pkg.hookHeadline || '';
      const hookedHook = applyHookPattern(originalHook, region, niche, seed, context);
      pkg.hookHeadline = hookedHook;
      pkg.hook = hookedHook;
      pkg.headline = hookedHook;

      // Track category untuk hashtag
      const patterns = HOOK_PATTERNS[region];
      const patternKeys = Object.keys(patterns);
      const categoryKey = patternKeys[seed % patternKeys.length];
      pkg.__hookCategory = categoryKey;

      // ─── 2. Apply CTA Psychology ───
      const originalCta = pkg.cta || '';
      const psychCta = applyCtaPsychology(originalCta, region, niche, seed, context);
      pkg.cta = psychCta;

      // ─── 3. Apply Hashtag Strategy ───
      pkg.hashtags = applyHashtagStrategy(
        pkg.hashtags, region, niche, seed, categoryKey
      );

      // ─── 4. Metadata untuk debug ───
      pkg.__generatedBy = 'v9-gacor-mode';
      pkg.__hookCategory = categoryKey;
      pkg.__v9Applied = true;

      return pkg;
    };

    console.log('%c[Polish V9] ✅ GACOR MODE ACTIVE', 'color:#f97316;font-weight:bold;font-size:14px');
    console.log('┌─ 6 Hook Patterns: contrarian, confession, urgency, insider, challenge, reversal');
    console.log('├─ 6 CTA Psychology: ego-bait, save-trigger, debate, tag, poll, story');
    console.log('├─ Hashtag Strategy: 1 trending + 2 niche + 2 long-tail + 1 hook-tag');
    console.log('└─ Power words auto-injected per region');

    // Print stats
    printStats();
  }

  function printStats() {
    const stats = {};
    for (const region of Object.keys(HOOK_PATTERNS)) {
      stats[region] = {
        hookPatterns: Object.values(HOOK_PATTERNS[region]).reduce((s, arr) => s + arr.length, 0),
        ctaTriggers: Object.values(CTA_PSYCHOLOGY[region] || {}).reduce((s, arr) => s + arr.length, 0),
        powerWords: (POWER_WORDS[region] || []).length
      };
    }
    console.log('┌─ V9 STATS PER REGION ─────────────────');
    for (const r of Object.keys(stats)) {
      const s = stats[r];
      console.log(`│ ${r.padEnd(8)}: ${s.hookPatterns} hooks · ${s.ctaTriggers} CTAs · ${s.powerWords} power words`);
    }
    console.log('└────────────────────────────────────────');
  }

  // ═══════════════════════════════════════════════════════════════════════
  // SECTION 10: PUBLIC API (untuk debug)
  // ═══════════════════════════════════════════════════════════════════════

  window.__previewV9 = function (count, regionCode) {
    count = count || 6;
    regionCode = getRegion(regionCode);
    const patterns = HOOK_PATTERNS[regionCode];
    const ctas = CTA_PSYCHOLOGY[regionCode];
    const rng = createRNG(Date.now());

    console.log(`%c🔥 Preview V9 GACOR [${regionCode}]`, 'color:#f97316;font-weight:bold;font-size:13px');
    console.log('═══════════════════════════════════════════');

    const topics = ['trading', 'gaming', 'podcast', 'reaction', 'momen viral'];
    const keys = Object.keys(patterns);

    for (let i = 0; i < count; i++) {
      const cat = keys[i % keys.length];
      const hook = pick(patterns[cat], rng).replace('{topic}', topics[i % topics.length]);
      const ctaKey = Object.keys(ctas)[i % Object.keys(ctas).length];
      const cta = pick(ctas[ctaKey], rng).replace('{topic}', topics[i % topics.length]);

      console.log(`\n[${i + 1}] Kategori: ${cat}`);
      console.log(`    🪝 HOOK : ${hook}`);
      console.log(`    📣 CTA  : ${cta}`);
    }
    console.log('\n═══════════════════════════════════════════');
  };

  window.__v9Data = {
    version: '1.0',
    hookPatterns: HOOK_PATTERNS,
    ctaPsychology: CTA_PSYCHOLOGY,
    powerWords: POWER_WORDS,
    longTail: LONG_TAIL,
    hookTags: HOOK_TAGS
  };

  // ═══════════════════════════════════════════════════════════════════════
  // BOOT
  // ═══════════════════════════════════════════════════════════════════════

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(boot, 1000));
  } else {
    setTimeout(boot, 1000);
  }

})();