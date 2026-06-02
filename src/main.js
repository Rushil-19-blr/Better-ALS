// ============================================================
// NPS ALS — Complete Application with All Features
// ============================================================
import './style.css';
import { subjects, notes as defaultNotes, getQuestions } from './data/mock-data.js';
import { generateHint, explainConcept, chatWithAI, generateSimilarQuestion, answerDoubt, analyzeWorkingImage } from './ai.js';
import { onAuthChange, signInWithGoogle, logout, db, onSnapshot } from './firebase.js';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import QRCode from 'qrcode';

// ─── LAN URL DETECTION (for QR codes to work on phones during dev) ───
let _cachedLanUrl = null;

function getSidecarUrl() {
  const proto = window.location.protocol;
  const host = window.location.host; // includes port
  const path = window.location.pathname;
  const base = `${proto}//${host}${path}`;
  const kcPart = S.kc ? `&kc=${S.kc}&sub=${S.subject}` : '';
  const uidPart = S.user ? `&uid=${S.user.uid}` : '';
  return `${base}?sidecar=1${kcPart}${uidPart}`;
}

async function getLanBaseUrl() {
  // If we're already on a non-localhost address (deployed or LAN IP), use as-is
  const hostname = window.location.hostname;
  if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
    return window.location.origin + window.location.pathname;
  }

  // Try to detect LAN IP via RTCPeerConnection (works in most browsers)
  if (_cachedLanUrl) return _cachedLanUrl;

  try {
    const ip = await detectLanIP();
    if (ip) {
      _cachedLanUrl = `${window.location.protocol}//${ip}:${window.location.port}${window.location.pathname}`;
      return _cachedLanUrl;
    }
  } catch (e) {
    console.warn('LAN IP detection failed:', e);
  }

  // Fallback: just use whatever we have
  return window.location.origin + window.location.pathname;
}

function detectLanIP() {
  return new Promise((resolve) => {
    const timeout = setTimeout(() => resolve(null), 2000);
    try {
      const pc = new RTCPeerConnection({ iceServers: [] });
      pc.createDataChannel('');
      pc.createOffer().then(offer => pc.setLocalDescription(offer)).catch(() => {});
      pc.onicecandidate = (e) => {
        if (!e || !e.candidate) return;
        const match = e.candidate.candidate.match(/([0-9]{1,3}\.){3}[0-9]{1,3}/);
        if (match) {
          const ip = match[0];
          // Filter out link-local and loopback
          if (!ip.startsWith('127.') && !ip.startsWith('0.')) {
            clearTimeout(timeout);
            pc.close();
            resolve(ip);
          }
        }
      };
    } catch (e) {
      clearTimeout(timeout);
      resolve(null);
    }
  });
}

// ── Pending sidecar flag for when user opens QR link but isn't logged in ──
let _pendingSidecar = false;
let _pendingSidecarParams = null;

// ─── DYNAMIC MASTERY CALCULATIONS ────────────────────────────
function getChapterMastery(ch) {
  let correct = 0;
  let total = 0;
  ch.kcs.forEach(kc => {
    const qs = getQuestions(kc.id);
    total += qs.length;
    qs.forEach(q => {
      const ans = S.answers[q.id];
      if (ans?.submitted && ans.sel === q.correct) {
        correct++;
      }
    });
  });
  if (total === 0) return 0;
  return Math.round((correct / total) * 100);
}

function getChapterMarksLost(ch) {
  let marksLost = 0;
  ch.kcs.forEach(kc => {
    const qs = getQuestions(kc.id);
    qs.forEach(q => {
      const ans = S.answers[q.id];
      if (ans && ans.submitted && ans.sel !== q.correct) {
        marksLost++;
      }
    });
  });
  return marksLost;
}

function getSubjectMastery(sub) {
  if (!sub.chapters.length) return 0;
  let totalMastery = 0;
  sub.chapters.forEach(ch => {
    totalMastery += getChapterMastery(ch);
  });
  return Math.round(totalMastery / sub.chapters.length);
}

// ─── FIREBASE SYNC HELPERS ────────────────────────────────────
async function syncToFirebase() {
  if (!S.user || !db) return;
  try {
    const userDocRef = doc(db, 'users', S.user.uid);
    await setDoc(userDocRef, {
      xp: S.xp || 0,
      streak: S.streak || 0,
      answers: S.answers || {},
      notesList: S.notesList || [],
      goals: S.goals || [],
      doubts: S.doubts || []
    }, { merge: true });
  } catch (err) {
    console.error("Failed to sync data to Firestore:", err);
  }
}

// ── Compress image using Canvas (keeps Firestore doc < 200KB) ──
async function compressImage(dataUrl, maxWidth = 900, quality = 0.72) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxWidth / img.width);
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => resolve(dataUrl); // fallback to original
    img.src = dataUrl;
  });
}

// ── Push current practice question to Firestore session doc ──
async function pushSessionToFirestore() {
  if (!S.user || !db || !S.kc) return;
  try {
    const qs = getQuestions(S.kc);
    const q = qs[S.qIdx];
    if (!q) return;
    const { kc, sub } = getKcInfo(S.subject, S.kc);
    const sessionRef = doc(db, 'sessions', S.user.uid);
    await setDoc(sessionRef, {
      currentKc: S.kc,
      currentSubject: S.subject,
      currentQIdx: S.qIdx,
      totalQ: qs.length,
      questionId: q.id,
      questionText: q.text,
      questionOptions: q.options,
      questionCorrect: q.correct,
      kcName: kc?.name || S.kc,
      subjectName: sub?.name || S.subject,
      updatedAt: Date.now(),
      // Don't overwrite sidecarImage if it was just set by phone
    }, { merge: true });
  } catch (err) {
    console.error('Failed to push session to Firestore:', err);
  }
}

// ── Subscribe to real-time session sync via Firestore onSnapshot ──
function subscribeToSession(uid) {
  // Unsubscribe from any existing listener
  if (S.sidecarSessionUnsubscribe) {
    S.sidecarSessionUnsubscribe();
    S.sidecarSessionUnsubscribe = null;
  }
  if (!db || !uid) return;

  const sessionRef = doc(db, 'sessions', uid);
  const unsubscribe = onSnapshot(sessionRef, (snap) => {
    if (!snap.exists()) return;
    const data = snap.data();

    const isSidecar = isMobile() && !S.forceDesktop;

    if (isSidecar) {
      // ── PHONE SIDE: update live question from desktop ──
      if (data.questionText && data.updatedAt) {
        const newLive = {
          text: data.questionText,
          options: data.questionOptions || [],
          correct: data.questionCorrect,
          kcName: data.kcName,
          subjectName: data.subjectName,
          qIdx: data.currentQIdx,
          totalQ: data.totalQ,
          qId: data.questionId,
        };
        S.sidecarLiveQuestion = newLive;
        // Update context for AI prompts
        S.sidecarContext = { kcName: data.kcName, subjectName: data.subjectName };
        render();
      }
    } else {
      // ── DESKTOP SIDE: consume synced image from phone ──
      if (data.sidecarImage && data.sidecarImage.timestamp) {
        const lastTimestamp = S._lastConsumedSidecarTs || 0;
        if (data.sidecarImage.timestamp > lastTimestamp) {
          S._lastConsumedSidecarTs = data.sidecarImage.timestamp;
          // Inject into the desktop chat panel as a special "from phone" message
          const fromPhoneMsg = {
            role: 'ai',
            text: `📱 **From your phone:**\n\n${data.sidecarImage.aiResponse || 'Photo received.'}`,
            imageUrl: data.sidecarImage.dataUrl,
            fromPhone: true,
          };
          S.chatMsgs.push(fromPhoneMsg);
          // Switch to chat tab if on practice page
          if (S.page === 'practice') {
            S.chatHidden = false;
            render();
            setTimeout(() => {
              document.getElementById('chat-msgs')?.scrollTo(0, 999999);
            }, 100);
          }
        }
      }
    }
  }, (err) => {
    console.error('Session onSnapshot error:', err);
  });

  S.sidecarSessionUnsubscribe = unsubscribe;
}

// ─── STATE ───────────────────────────────────────────────────
const S = {
  page: 'home',
  authLoading: true,
  user: null,
  theme: localStorage.getItem('nps-theme') || 'dark',
  subject: null,
  kc: null,
  qIdx: 0,
  selected: null,
  answers: {},       // { qId: { sel, correct, submitted, time } }
  hints: {},         // { qId: { level, texts:[], loading, conceptText } }
  retryQ: null,      // generated similar question
  chatMsgs: [],
  chatTab: 'ask',
  chatLoading: false,
  chatHidden: false,
  expanded: {},      // chapter expand
  notesList: JSON.parse(localStorage.getItem('nps-notes') || 'null') || [...defaultNotes],
  goals: JSON.parse(localStorage.getItem('nps-goals') || '[]'),
  doubts: JSON.parse(localStorage.getItem('nps-doubts') || '[]'),
  // Test Mode
  test: { active: false, setup: true, subjectId: null, time: 30, perQ: false, qs: [], ans: {}, idx: 0, done: false, remaining: 0, flagged: {} },
  // Anti-cheat
  qStartTime: null,
  tabWarnings: 0,
  acOverlay: null,   // { title, text }
  // Timer
  timerSec: 0,
  timerInterval: null,
  // XP
  xp: parseInt(localStorage.getItem('nps-xp') || '0'),
  streak: parseInt(localStorage.getItem('nps-streak') || '0'),
  correctStreak: 0,
  sessionCorrect: 0,
  sessionTotal: 0,
  // Activity log for streak calendar: { 'YYYY-MM-DD': true }
  activityLog: JSON.parse(localStorage.getItem('nps-activity') || '{}'),
  // Notifications
  notifications: JSON.parse(localStorage.getItem('nps-notifications') || 'null') || [
    { title: 'Welcome to Better ALS! 🎉', body: 'Start practicing to build your streak.', read: false },
    { title: 'Tip: Use Test Mode', body: 'Simulate exam conditions — no hints, no AI.', read: false },
  ],
  // Test setup memo
  testSetup: { subjectId: null, chapterId: 'all', kcId: 'all', time: 30, count: 10 },
  // ── Sidecar Mode ──
  sidecarTab: 'live',              // 'live' | 'progress'
  sidecarImage: null,              // { base64, mimeType, dataUrl } — pending image on phone
  sidecarMsgs: [],                 // chat thread for sidecar image analysis
  sidecarLoading: false,
  sidecarContext: null,            // { kcName, subjectName } from URL params
  forceDesktop: localStorage.getItem('nps-force-desktop') === 'true',
  showQRModal: false,
  // Real-time session sync
  sidecarSessionUnsubscribe: null, // Firestore onSnapshot cleanup handle
  sidecarLiveQuestion: null,       // { text, options, correct, kcName, subjectName, qIdx, totalQ, qId } — synced FROM desktop
  sidecarSyncedImage: null,        // { dataUrl, aiResponse, questionId, timestamp } — synced FROM phone TO desktop; null after consumed
  // QR modal state
  qrSidecarUrl: '',                // Pre-computed sidecar URL for QR modal
  qrIsLocalhost: false,            // Whether we're running on localhost (warning)
};

// ── Mobile Detection ──────────────────────────────────────────
function isMobile() {
  if (typeof window === 'undefined') return false;
  const ua = navigator.userAgent || '';
  const mobileUA = /Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(ua);
  const smallScreen = window.innerWidth <= 768;
  return mobileUA || smallScreen;
}

// ── URL Parameter Reading ─────────────────────────────────────
function readURLParams() {
  const params = new URLSearchParams(window.location.search);
  if (params.get('sidecar') === '1') {
    // Mark that user arrived via sidecar QR code
    _pendingSidecar = true;
    _pendingSidecarParams = { 
      kc: params.get('kc'), 
      sub: params.get('sub'),
      uid: params.get('uid')
    };
    const kcParam = params.get('kc');
    const subParam = params.get('sub');
    if (kcParam && subParam) {
      const { kc, sub } = getKcInfo(subParam, kcParam);
      S.sidecarContext = { kcName: kc?.name || kcParam, subjectName: sub?.name || subParam };
    }
  }
}

// Call readURLParams early (before auth) so we know if this is a sidecar load
readURLParams();

// Apply theme
document.documentElement.setAttribute('data-theme', S.theme);

// ─── HELPERS ────────────────────────────────────────────────
function save(key, val) { 
  localStorage.setItem('nps-' + key, JSON.stringify(val)); 
  syncToFirebase();
}

function saveCurrentQuestionToNotes() {
  const qs = getQuestions(S.kc);
  const q = qs[S.qIdx];
  if (!q) return;
  const { kc } = getKcInfo(S.subject, S.kc);
  
  // Prevent duplicate notes of the same question in this KC
  const exists = S.notesList.some(n => n.kcId === S.kc && n.questionText === q.text);
  if (exists) {
    toast('Question already saved to notes!', 'info');
    return;
  }
  
  S.notesList.push({
    id: 'n' + Date.now(),
    kcName: kc?.name || S.kc,
    kcId: S.kc,
    subjectId: S.subject,
    questionText: q.text,
    noteContent: 'Question saved for review.',
    createdAt: new Date().toISOString().split('T')[0]
  });
  save('notes', S.notesList);
  toast('Question copied to notes!', 'success');
  render();
}
function getSubject(id) { return subjects.find(s => s.id === id); }
function getKcInfo(subId, kcId) {
  const sub = getSubject(subId);
  if (!sub) return {};
  for (const ch of sub.chapters) { const kc = ch.kcs.find(k => k.id === kcId); if (kc) return { kc, ch, sub }; }
  return {};
}

// ═══════════════════════════════════════════════════════════
//  ANIMATION UTILITIES
// ═══════════════════════════════════════════════════════════

// ── 1. Typewriter ────────────────────────────────────────────
function startTypewriter(el, texts, { speed = 60, deleteSpeed = 35, waitTime = 2000, initialDelay = 400 } = {}) {
  if (!el) return;
  let textIdx = 0, charIdx = 0, deleting = false;
  let timeout;

  function type() {
    const current = texts[textIdx];
    if (deleting) {
      el.textContent = current.slice(0, charIdx--);
      if (charIdx < 0) {
        deleting = false;
        textIdx = (textIdx + 1) % texts.length;
        charIdx = 0;
        timeout = setTimeout(type, 300);
        return;
      }
      timeout = setTimeout(type, deleteSpeed);
    } else {
      el.textContent = current.slice(0, charIdx++);
      if (charIdx > current.length) {
        if (texts.length > 1) {
          timeout = setTimeout(() => { deleting = true; type(); }, waitTime);
        }
        return;
      }
      timeout = setTimeout(type, speed);
    }
  }
  timeout = setTimeout(type, initialDelay);
  return () => clearTimeout(timeout);
}

// ── 2. Special-Text Scramble (badge) ─────────────────────────
const SCRAMBLE_CHARS = '_!X$0-+*#@%?&=';
function startSpecialTextScramble(el, finalText, { speed = 22, delay = 300 } = {}) {
  if (!el) return;
  const len = finalText.length;
  let step = 0;
  const maxSteps = len * 2;
  let interval;

  function getRandomChar(prev) {
    let c;
    do { c = SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)]; } while (c === prev);
    return c;
  }

  setTimeout(() => {
    interval = setInterval(() => {
      if (step <= maxSteps) {
        // Phase 1: fill with random chars up to current length
        const currentLen = Math.min(step + 1, len);
        let chars = [];
        for (let i = 0; i < currentLen; i++) chars.push(getRandomChar(chars[i-1]));
        for (let i = currentLen; i < len; i++) chars.push('\u00A0');
        el.textContent = chars.join('');
        step++;
      } else {
        // Phase 2: reveal real chars progressively
        const revealIdx = step - maxSteps;
        const revealedCount = Math.floor(revealIdx / 2);
        let chars = [];
        for (let i = 0; i < revealedCount && i < len; i++) chars.push(finalText[i]);
        if (revealedCount < len) {
          chars.push(revealIdx % 2 === 0 ? '_' : getRandomChar());
          for (let i = chars.length; i < len; i++) chars.push(getRandomChar(chars[i-1]));
        }
        el.textContent = chars.join('');
        step++;
        if (revealedCount >= len) {
          el.textContent = finalText;
          clearInterval(interval);
        }
      }
    }, speed);
  }, delay);
}

// ── 3. Matrix Binary Flip (greeting) ─────────────────────────
function startMatrixFlip(el, finalText, { resolveInterval = 55, holdTime = 700, initialDelay = 0, flickerRate = 90 } = {}) {
  if (!el) return;
  const chars = finalText.split('');

  // Immediately render all chars as binary with green glow
  el.innerHTML = chars.map(ch => {
    const flippable = ch !== ' ' && ch !== ',' && ch !== '.' && ch !== '!';
    return `<span class="matrix-char${flippable ? ' flipping' : ''}" data-final="${ch}">${
      flippable ? (Math.random() > 0.5 ? '1' : '0') : ch
    }</span>`;
  }).join('');

  // Flicker all binary chars while they "hold"
  const flickerTimer = setInterval(() => {
    el.querySelectorAll('.matrix-char.flipping').forEach(span => {
      span.textContent = Math.random() > 0.5 ? '1' : '0';
    });
  }, flickerRate);

  // After holdTime, resolve left-to-right
  setTimeout(() => {
    clearInterval(flickerTimer);
    const spans = el.querySelectorAll('.matrix-char');
    let i = 0;
    const resolver = setInterval(() => {
      if (i >= spans.length) { clearInterval(resolver); return; }
      const span = spans[i];
      span.classList.remove('flipping');
      span.textContent = span.dataset.final;
      i++;
    }, resolveInterval);
  }, initialDelay + holdTime);
}

// ── 3b. Sequential Matrix Flip — one char at a time (MatrixText style)
//        Each letter individually goes binary → flickers → resolves before the next starts
function startMatrixFlipSequential(el, finalText, { letterDuration = 420, letterInterval = 95, initialDelay = 0 } = {}) {
  if (!el) return;
  el.innerHTML = finalText.split('').map(ch =>
    `<span class="matrix-char" data-final="${ch}">${ch}</span>`
  ).join('');

  setTimeout(() => {
    const spans = el.querySelectorAll('.matrix-char');
    let i = 0;

    function animateNext() {
      if (i >= spans.length) return;
      const span = spans[i];
      const final = span.dataset.final;
      if (final !== ' ' && final !== ',' && final !== '.' && final !== '!') {
        span.classList.add('flipping');
        span.textContent = Math.random() > 0.5 ? '1' : '0';
        // Flicker a couple of times during the hold
        const flk = setInterval(() => {
          span.textContent = Math.random() > 0.5 ? '1' : '0';
        }, 85);
        setTimeout(() => {
          clearInterval(flk);
          span.classList.remove('flipping');
          span.textContent = final;
        }, letterDuration);
      }
      i++;
      setTimeout(animateNext, letterInterval);
    }
    animateNext();
  }, initialDelay);
}

// ── 3c. Matrix Rain — the classic falling character rain (red-tinted)
//        For login page background. Canvas must already be in the DOM.
function startMatrixRain(canvas) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  // Mix of binary + katakana-range symbols for authentic feel
  const CHARS = '01アイウエオカキクサシスセソタチツラリルレロナニヌネ01ハヒフへホマミムメモ0110';
  const FS = 13;
  let drops = [];
  let animId;
  let frameCount = 0;

  function resize() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
    const cols = Math.floor(canvas.width / FS);
    // Stagger drop start positions
    drops = Array.from({ length: cols }, () => Math.random() * -(canvas.height / FS));
  }

  function draw() {
    frameCount++;
    // Only update every 2nd frame for a slightly slower, more readable rain
    if (frameCount % 2 !== 0) {
      animId = requestAnimationFrame(draw);
      return;
    }

    // Fade previous frame — this creates the trailing glow effect
    ctx.fillStyle = 'rgba(16, 12, 13, 0.07)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.font = `${FS}px "JetBrains Mono", monospace`;

    drops.forEach((y, i) => {
      const ch = CHARS[Math.floor(Math.random() * CHARS.length)];
      const x  = i * FS;
      const py = y * FS;

      // Lead char: bright accent
      ctx.fillStyle = 'rgba(225, 60, 80, 0.85)';
      ctx.fillText(ch, x, py);

      // One char behind: white-hot highlight
      if (y > 1) {
        ctx.fillStyle = 'rgba(255, 180, 190, 0.5)';
        ctx.fillText(CHARS[Math.floor(Math.random() * CHARS.length)], x, py - FS);
      }

      // Reset column randomly when it passes bottom
      if (py > canvas.height && Math.random() > 0.975) {
        drops[i] = 0;
      }
      drops[i] += 0.5; // speed: slow & creepy
    });

    animId = requestAnimationFrame(draw);
  }

  resize();
  window.addEventListener('resize', resize);
  draw();

  return () => {
    cancelAnimationFrame(animId);
    window.removeEventListener('resize', resize);
  };
}

// ── 4. Background Boxes (login) ───────────────────────────────
function buildBackgroundBoxes(container) {
  const BOX_COLORS = [
    'rgba(125,211,252,0.18)', // sky
    'rgba(249,168,212,0.18)', // pink
    'rgba(134,239,172,0.18)', // green
    'rgba(253,224,71,0.18)',  // yellow
    'rgba(252,165,165,0.18)', // red
    'rgba(216,180,254,0.18)', // purple
    'rgba(178,43,61,0.22)',   // accent red
    'rgba(147,197,253,0.18)', // blue
  ];
  const ROWS = 80, COLS = 50;
  const inner = document.createElement('div');
  inner.className = 'login-bg-boxes-inner';

  for (let r = 0; r < ROWS; r++) {
    const row = document.createElement('div');
    row.className = 'bg-box-row';
    for (let c = 0; c < COLS; c++) {
      const cell = document.createElement('div');
      cell.className = 'bg-box-cell';
      // Add cross SVG at even positions
      if (r % 2 === 0 && c % 2 === 0) {
        cell.innerHTML = `<svg class="box-cross" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6v12m6-6H6"/></svg>`;
      }
      // Hover color flash
      cell.addEventListener('mouseenter', () => {
        cell.style.backgroundColor = BOX_COLORS[Math.floor(Math.random() * BOX_COLORS.length)];
      });
      cell.addEventListener('mouseleave', () => {
        cell.style.backgroundColor = '';
      });
      row.appendChild(cell);
    }
    inner.appendChild(row);
  }
  container.appendChild(inner);
}

// ── 5. Beams Background Canvas (dashboard) ───────────────────
function startBeamsBackground(canvas) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let beams = [];
  let animId;

  function createBeam() {
    const w = canvas.width, h = canvas.height;
    const angle = -32 + Math.random() * 8;
    return {
      x: Math.random() * w * 1.5 - w * 0.25,
      y: h + 100,
      width: 40 + Math.random() * 80,
      length: h * 2.5,
      angle,
      speed: 0.4 + Math.random() * 0.6,
      opacity: 0.03 + Math.random() * 0.05,  // very faint
      hue: 340 + Math.random() * 20,          // red-toned: 340-360
      pulse: Math.random() * Math.PI * 2,
      pulseSpeed: 0.015 + Math.random() * 0.025,
    };
  }

  function resize() {
    const dpr = window.devicePixelRatio || 1;
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    canvas.style.width = window.innerWidth + 'px';
    canvas.style.height = window.innerHeight + 'px';
    ctx.scale(dpr, dpr);
    beams = Array.from({ length: 18 }, createBeam);
    // Spread them out vertically so some start mid-screen
    beams.forEach((b, i) => { b.y = (window.innerHeight / 18) * i - 100; });
  }

  function drawBeam(b) {
    ctx.save();
    ctx.translate(b.x, b.y);
    ctx.rotate(b.angle * Math.PI / 180);
    const pulse = b.opacity * (0.8 + Math.sin(b.pulse) * 0.2);
    const grad = ctx.createLinearGradient(0, 0, 0, b.length);
    grad.addColorStop(0,   `hsla(${b.hue},80%,60%,0)`);
    grad.addColorStop(0.1, `hsla(${b.hue},80%,60%,${pulse * 0.5})`);
    grad.addColorStop(0.4, `hsla(${b.hue},80%,60%,${pulse})`);
    grad.addColorStop(0.6, `hsla(${b.hue},80%,60%,${pulse})`);
    grad.addColorStop(0.9, `hsla(${b.hue},80%,60%,${pulse * 0.5})`);
    grad.addColorStop(1,   `hsla(${b.hue},80%,60%,0)`);
    ctx.fillStyle = grad;
    ctx.fillRect(-b.width / 2, 0, b.width, b.length);
    ctx.restore();
  }

  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.filter = 'blur(30px)';
    beams.forEach(b => {
      b.y -= b.speed;
      b.pulse += b.pulseSpeed;
      if (b.y + b.length < -100) {
        Object.assign(b, createBeam());
        b.y = window.innerHeight + 100;
      }
      drawBeam(b);
    });
    animId = requestAnimationFrame(animate);
  }

  resize();
  window.addEventListener('resize', resize);
  animate();

  return () => {
    cancelAnimationFrame(animId);
    window.removeEventListener('resize', resize);
  };
}

// Beams animation cleanup handle (kept across renders)
let _beamsCleanup = null;

// ─── NAVIGATION ─────────────────────────────────────────────
function go(page, params = {}) {
  // Stop beams canvas when leaving home
  if (S.page === 'home' && page !== 'home' && _beamsCleanup) {
    _beamsCleanup();
    _beamsCleanup = null;
  }
  S.page = page;
  Object.assign(S, params);
  S.selected = null;
  render();
  document.querySelector('.page-content')?.scrollTo(0, 0);
}

function startPractice(kcId, subId) {
  S.chatMsgs = [];
  S.chatTab = 'ask';
  S.qIdx = 0;
  S.retryQ = null;
  go('practice', { kc: kcId, subject: subId });
  startTimer();
  S.qStartTime = Date.now();
  pushSessionToFirestore();
}

// ─── RENDER ─────────────────────────────────────────────────
let _renderedPage = null; // track last rendered page for blink fix

function render() {
  if (S.authLoading) {
    document.getElementById('app').innerHTML = `<div style="display:flex;height:100vh;align-items:center;justify-content:center;color:var(--text);font-size:1.2rem;">Loading...</div>`;
    return;
  }
  if (!S.user) {
    // ── If phone opened via sidecar QR code but not logged in, show special sidecar login ──
    if (_pendingSidecar) {
      document.getElementById('app').innerHTML = SidecarLoginPage();
      _renderedPage = 'sidecar-login';
      bindSidecarLogin();
      return;
    }
    document.getElementById('app').innerHTML = LoginPage();
    _renderedPage = 'login';
    bindLogin();
    return;
  }

  // ── Sidecar: Mobile Detection Gate ──
  if ((isMobile() && !S.forceDesktop) || _pendingSidecar) {
    // Clear pending flag now that we're in sidecar mode with a user
    _pendingSidecar = false;
    const isTabChange = _renderedPage !== 'sidecar-' + S.sidecarTab;
    _renderedPage = 'sidecar-' + S.sidecarTab;
    document.getElementById('app').innerHTML = `
      ${SidecarPage()}
      <div class="toast-container" id="toasts"></div>
    `;
    lucide?.createIcons();
    renderMath();
    bindSidecar();
    return;
  }

  // Only animate on actual page change — stops the blink on in-page interactions
  const isPageChange = _renderedPage !== S.page;
  _renderedPage = S.page;

  document.getElementById('app').innerHTML = `
    <div class="app-layout">
      ${Sidebar()}
      <div class="page-content ${isPageChange ? 'fade-in' : ''}">${Page()}</div>
    </div>
    ${S.page !== 'test-active' ? `<button class="fab-report" id="fab-report"><i data-lucide="flag"></i>Report Issue</button>` : ''}
    <div class="toast-container" id="toasts"></div>
    ${S.acOverlay ? AntiCheatOverlay() : ''}
    ${S.showQRModal ? QRModal() : ''}
  `;
  lucide?.createIcons();
  renderMath();
  bind();
}

function renderMath() {
  if (typeof renderMathInElement === 'function') {
    renderMathInElement(document.body, {
      delimiters: [
        { left: '\\(', right: '\\)', display: false },
        { left: '\\[', right: '\\]', display: true },
        { left: '$$', right: '$$', display: true },
      ],
      throwOnError: false,
    });
  }
}

// ─── SIDEBAR ────────────────────────────────────────────────
function Sidebar() {
  if (S.page === 'test-active') return '';
  const items = [
    { id: 'home', icon: 'layout-dashboard', label: 'Dashboard' },
    { id: 'mastery', icon: 'bar-chart-3', label: 'Mastery' },
    { id: 'test-setup', icon: 'timer', label: 'Test Mode' },
    { id: 'leaderboard', icon: 'trophy', label: 'Leaderboard' },
    { id: 'notes', icon: 'sticky-note', label: 'Notes' },
    { id: 'doubts', icon: 'help-circle', label: 'Doubts' },
  ];
  return `<nav class="sidebar">
    ${items.map(i => `<a class="nav-item ${S.page === i.id || (i.id === 'test-setup' && S.page === 'test-active') ? 'active' : ''}" data-nav="${i.id}"><i data-lucide="${i.icon}"></i><span class="nav-label">${i.label}</span></a>`).join('')}
    <div class="nav-spacer"></div>
    <div class="nav-divider"></div>
    <a class="nav-item ${S.page === 'settings' ? 'active' : ''}" data-nav="settings"><i data-lucide="settings"></i><span class="nav-label">Settings</span></a>
  </nav>`;
}

// ─── PAGE ROUTER ────────────────────────────────────────────
function Page() {
  switch (S.page) {
    case 'home': return HomePage();
    case 'subject': return SubjectPage();
    case 'practice': return PracticePage();
    case 'notes': return NotesPage();
    case 'leaderboard': return LeaderboardPage();
    case 'doubts': return DoubtsPage();
    case 'mastery': return MasteryPage();
    case 'test-setup': return TestSetupPage();
    case 'test-active': return TestActivePage();
    case 'test-results': return TestResultsPage();
    case 'settings': return SettingsPage();
    default: return HomePage();
  }
}

// ════════════════════════════════════════════════════════════
//  LOGIN
// ════════════════════════════════════════════════════════════
function LoginPage() {
  return `
    <div style="position:relative;min-height:100vh;background:radial-gradient(circle at top, rgba(178,43,61,0.06) 0%, var(--bg) 65%);color:var(--text);overflow:hidden;font-family:'Inter', sans-serif;display:flex;flex-direction:column;justify-content:space-between;box-sizing:border-box;">

      <!-- Animated background boxes -->
      <div class="login-bg-boxes" id="login-boxes-wrap"></div>

      <!-- Radial mask so boxes don't overpower the hero -->
      <div style="position:absolute;inset:0;background:radial-gradient(ellipse 70% 70% at 50% 40%, transparent 30%, var(--bg) 80%);pointer-events:none;z-index:1;"></div>

      <!-- Navigation -->
      <nav style="position:relative;z-index:2;display:flex;justify-content:space-between;align-items:center;padding:2rem 5%;max-width:1200px;width:100%;margin:0 auto;box-sizing:border-box;">
        <div style="display:flex;align-items:center;gap:0.75rem;">
          <div style="width:40px;height:40px;background:var(--accent);border-radius:12px;display:flex;align-items:center;justify-content:center;color:#fff;box-shadow:0 4px 12px rgba(178,43,61,0.3);">
            <i data-lucide="brain"></i>
          </div>
          <span style="font-size:1.35rem;font-weight:800;letter-spacing:-0.03em;background:linear-gradient(to right, #fff, #b0a8aa);-webkit-background-clip:text;-webkit-text-fill-color:transparent;">NPS ALS</span>
        </div>
      </nav>

      <!-- Hero Section -->
      <header style="position:relative;z-index:2;text-align:center;padding:4rem 1.5rem;max-width:820px;margin:0 auto;display:flex;flex-direction:column;align-items:center;box-sizing:border-box;">

        <!-- Special-text scramble badge -->
        <div style="display:inline-flex;align-items:center;gap:0.5rem;background:rgba(178,43,61,0.08);color:var(--accent);padding:0.5rem 1.25rem;border-radius:999px;font-size:0.78rem;font-weight:700;margin-bottom:2.5rem;border:1px solid rgba(178,43,61,0.18);letter-spacing:0.02em;">
          <i data-lucide="sparkles" style="width:14px;height:14px;flex-shrink:0;"></i>
          <span class="special-text-badge" id="badge-scramble">ASSISTED LEARNING SYSTEM</span>
        </div>

        <!-- Typewriter H1 -->
        <h1 style="font-size:clamp(2.3rem, 7vw, 4.25rem);font-weight:850;line-height:1.1;letter-spacing:-0.04em;margin-bottom:1.5rem;background:linear-gradient(135deg, #ffffff 30%, #a29ba0 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;">
          Master JEE<br>
          <span id="tw-target" style="display:inline;"></span><span class="typewriter-cursor" id="tw-cursor"></span>
        </h1>

        <p style="font-size:1.05rem;color:var(--text-secondary);max-width:540px;margin:0 auto 3rem;line-height:1.6;font-weight:400;letter-spacing:-0.01em;">
          An adaptive practice platform that helps you build deep subject mastery through progressive AI guidance.
        </p>

        <button id="btn-login-hero" class="btn-action primary" style="font-size:1.1rem;padding:0.9rem 2.25rem;border-radius:999px;box-shadow:0 8px 24px rgba(178,43,61,0.35);transition:transform 0.2s, box-shadow 0.2s;display:inline-flex;align-items:center;gap:0.75rem;font-weight:600;border:none;cursor:pointer;">
          <i data-lucide="google"></i> Continue with Google
        </button>
      </header>

      <!-- Footer -->
      <footer style="position:relative;z-index:2;text-align:center;padding:2.5rem;color:var(--text-muted);font-size:0.8rem;letter-spacing:0.01em;">
        &copy; 2026 NPS ALS. Built for JEE Aspirants.
      </footer>
    </div>
  `;
}

function bindLogin() {
  lucide?.createIcons();

  // ── Background boxes ────────────────────────────────────
  const boxWrap = document.getElementById('login-boxes-wrap');
  if (boxWrap) buildBackgroundBoxes(boxWrap);

  // ── Badge scramble ───────────────────────────────────────
  const badgeEl = document.getElementById('badge-scramble');
  if (badgeEl) startSpecialTextScramble(badgeEl, 'ASSISTED LEARNING SYSTEM', { speed: 20, delay: 200 });

  // ── Typewriter hero ──────────────────────────────────────
  const twEl = document.getElementById('tw-target');
  if (twEl) startTypewriter(twEl, [
    'one question at a time.',
    'Physics, Chemistry & Maths.',
    'with AI-powered guidance.',
    'and beat the JEE.',
    'smarter every session.',
  ], { speed: 65, deleteSpeed: 30, waitTime: 1800, initialDelay: 1200 });

  const handleLogin = async () => {
    try {
      await signInWithGoogle();
    } catch (e) {
      console.error(e);
      if (e.message?.includes('CONFIGURATION_NOT_FOUND') || e.code?.includes('auth/configuration-not-found')) {
        alert('Firebase Error: Google Sign-in is not enabled in your Firebase Console.\n\nPlease go to Firebase Console -> Authentication -> Sign-in method -> Add Google.');
      } else {
        alert('Login failed. Please check console.');
      }
    }
  };

  document.getElementById('btn-login-nav')?.addEventListener('click', handleLogin);
  document.getElementById('btn-login-hero')?.addEventListener('click', handleLogin);
}

// ════════════════════════════════════════════════════════════
//  HOME
// ════════════════════════════════════════════════════════════

// Compute questions done per subject from real session data
function getSubjectSessionStats(subId) {
  const sub = getSubject(subId);
  if (!sub) return { done: 0, total: 0 };
  let done = 0, total = 0;
  sub.chapters.forEach(ch => ch.kcs.forEach(kc => {
    const qs = getQuestions(kc.id);
    total += qs.length;
    qs.forEach(q => { if (S.answers[q.id]?.submitted) done++; });
  }));
  return { done, total };
}

function getStreakDays() {
  // Get last 7 rolling days of activity
  const days = [];
  const now = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split('T')[0];
    days.push({ date: key, label: ['Su','Mo','Tu','We','Th','Fr','Sa'][d.getDay()], active: !!(S.activityLog && S.activityLog[key]) });
  }
  return days;
}

// ── Beams + Matrix init (called after render) ─────────────────
function initHomeAnimations() {
  // All-at-once binary flip on the big greeting ("Hi Rushil,")
  const greetingEl = document.getElementById('home-greeting');
  if (greetingEl) {
    const finalText = greetingEl.textContent;
    startMatrixFlip(greetingEl, finalText, { holdTime: 800, resolveInterval: 60, flickerRate: 90 });
  }
  // Sequential flip on the subheading — more subtle, starts after greeting resolves
  const greetingSubEl = document.querySelector('.greeting-sub');
  if (greetingSubEl) {
    const subText = greetingSubEl.textContent;
    startMatrixFlipSequential(greetingSubEl, subText, {
      letterDuration: 280,
      letterInterval: 55,
      initialDelay: 900, // start after the greeting's hold period
    });
  }
}

function HomePage() {
  const streakDays = getStreakDays();
  const notifications = S.notifications || [];
  const hasUnread = notifications.some(n => !n.read);
  const streakOpen = S.streakOpen || false;
  const firstName = S.user?.displayName?.split(' ')[0] || 'Student';
  return `
    <div class="home-page-wrap">
    <div style="display:flex;align-items:center;gap:0.75rem;margin-bottom:1.5rem;padding:0.5rem 1.5rem 0 1.5rem;">
      <div style="background:white;padding:0.2rem;border-radius:4px;display:flex;align-items:center;justify-content:center;">
        <img src="https://upload.wikimedia.org/wikipedia/en/thumb/5/52/National_Public_School_Rajajinagar_Logo.png/220px-National_Public_School_Rajajinagar_Logo.png" alt="NPS" style="height:40px;object-fit:contain;">
      </div>
      <div style="font-weight:800;font-size:1.15rem;letter-spacing:1px;color:var(--text);text-transform:uppercase;">National Public School</div>
    </div>
    <header class="page-header">
      <div><h1 class="greeting" id="home-greeting">Hi ${firstName},</h1><p class="greeting-sub">Let's keep the momentum going.</p></div>
      <div class="header-actions">
        <button class="btn-pill"><i data-lucide="zap" style="color:var(--accent);"></i>${S.xp} XP</button>
        
        <!-- Streak Hover Popover -->
        <div class="dropdown-wrap streak-hover-wrap" style="position:relative">
          <button class="btn-pill" id="streak-btn">
            <i data-lucide="flame" style="color:var(--amber);"></i>${S.streak || 0} Streak
          </button>
          <div class="streak-popover">
            <div class="streak-inner">
              <div class="streak-days-row">
                ${streakDays.map(d => `
                  <div class="streak-day">
                    <div class="streak-dot ${d.active ? 'active' : 'inactive'}">${d.active ? '🔥' : ''}</div>
                    <span class="streak-day-label">${d.label}</span>
                  </div>
                `).join('')}
              </div>
              <div class="streak-footer">
                <i data-lucide="flame" style="width:16px;height:16px;color:var(--amber)"></i>
                <span>Current streak: <strong>${S.streak || 0} day${S.streak !== 1 ? 's' : ''}</strong></span>
              </div>
            </div>
          </div>
        </div>

        <div class="dropdown-wrap" style="position:relative">
          <button class="btn-icon ${hasUnread ? 'badge-dot' : ''}" id="notif-btn"><i data-lucide="bell"></i></button>
          <div class="dropdown-panel notif-panel" id="notif-panel">
            <div style="font-size:0.8rem;font-weight:700;margin-bottom:0.75rem;color:var(--text-secondary);text-transform:uppercase;letter-spacing:0.04em">Notifications</div>
            ${notifications.length === 0 ? `<div style="font-size:0.85rem;color:var(--text-muted);text-align:center;padding:1rem 0">All caught up! 🎉</div>` : notifications.slice(0,5).map((n,i) => `
              <div style="padding:0.6rem 0;border-bottom:1px solid var(--border);display:flex;align-items:flex-start;gap:0.6rem">
                <div style="width:8px;height:8px;border-radius:50%;background:${n.read ? 'transparent' : 'var(--accent)'};margin-top:5px;flex-shrink:0"></div>
                <div>
                  <div style="font-size:0.85rem;font-weight:${n.read ? 400 : 600}">${n.title}</div>
                  <div style="font-size:0.75rem;color:var(--text-muted);margin-top:0.15rem">${n.body}</div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    </header>
    <div class="subjects-grid">
      ${subjects.map(sub => {
        const stats = getSubjectSessionStats(sub.id);
        const pct = stats.total > 0 ? Math.round(stats.done / stats.total * 100) : 0;
        const mastery = getSubjectMastery(sub);
        const subGoals = S.goals.filter(g => g.subjectId === sub.id && !g.completed);
        return `
        <div class="subject-card ${sub.bgClass}" data-subject="${sub.id}">
          <div class="subject-card-bg"></div>
          <div class="subject-bg-icon" style="color:${sub.color}"><i data-lucide="${sub.icon}"></i></div>
          <div class="subject-card-body">
            <div class="subject-icon-wrap"><i data-lucide="${sub.icon}" style="color:${sub.color};"></i></div>
            <h2 class="subject-title">${sub.name}</h2>
            <span class="subject-subtitle">${sub.subtitle}</span>
            <div class="subject-stats-panel">
              <div class="stat-row"><span class="stat-label">Questions Done</span><span class="stat-value">${stats.done}/${stats.total}</span></div>
              <div class="stat-bar"><div class="stat-bar-fill" style="width:${pct}%;background:${sub.color};"></div></div>
              <div class="stat-row"><span class="stat-label">Mastery</span><span class="stat-value">${mastery}%</span></div>
              <div class="stat-bar"><div class="stat-bar-fill" style="width:${mastery}%;background:${sub.color};opacity:.6;"></div></div>
              ${subGoals.length ? `
                <div style="margin-top:.6rem;padding-top:.5rem;border-top:1px solid rgba(255,255,255,.08)">
                  <div style="font-size:.68rem;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:rgba(255,255,255,.35);margin-bottom:.35rem">Active Goal</div>
                  ${(() => { const g = subGoals[0]; const p = g.target > 0 ? Math.min(100, Math.round((g.done||0)/g.target*100)) : 0; return `
                    <div style="display:flex;justify-content:space-between;font-size:.76rem;margin-bottom:.2rem">
                      <span style="color:rgba(255,255,255,.55)">${g.period==='weekly'?'Weekly':'Daily'} · ${g.done||0}/${g.target} Qs</span>
                      <span style="color:${p>=100?'var(--green)':'var(--accent-text)'};font-weight:700">${p}%</span>
                    </div>
                    <div style="height:3px;background:rgba(255,255,255,.1);border-radius:99px;overflow:hidden"><div style="height:100%;width:${p}%;background:${p>=100?'var(--green)':sub.color};border-radius:99px"></div></div>
                  `; })()}
                </div>
              ` : ''}
            </div>
          </div>
        </div>`;
      }).join('')}
    </div>
    </div>`;
}


// ════════════════════════════════════════════════════════════
//  SUBJECT
// ════════════════════════════════════════════════════════════
function SubjectPage() {
  const sub = getSubject(S.subject);
  if (!sub) return HomePage();
  // Dynamic mastery from real answers
  const totalQs = sub.chapters.reduce((sum, ch) => sum + ch.kcs.reduce((s2, kc) => s2 + getQuestions(kc.id).length, 0), 0);
  const correctQs = sub.chapters.reduce((sum, ch) => sum + ch.kcs.reduce((s2, kc) => {
    return s2 + getQuestions(kc.id).filter(q => S.answers[q.id]?.submitted && S.answers[q.id].sel === q.correct).length;
  }, 0), 0);
  const dynamicMastery = totalQs > 0 ? Math.round(correctQs / totalQs * 100) : sub.mastery;
  return `
    <nav class="breadcrumb"><span class="bc-item" data-nav="home"><i data-lucide="home" style="width:14px;height:14px;"></i> Dashboard</span><span class="bc-sep">/</span><span class="bc-item current">${sub.name}</span></nav>
    <div class="page-title-bar"><h2 class="page-title" id="page-title-mx">${sub.name}</h2><span class="score-badge"><i data-lucide="award"></i>Mastery: ${dynamicMastery}%</span></div>
    <div class="chapter-list">${sub.chapters.map(ch => ChapterGroup(ch, sub)).join('')}</div>`;
}

function ChapterGroup(ch, sub) {
  const exp = S.expanded[ch.id];
  const circ = 2 * Math.PI * 13;
  const mastery = getChapterMastery(ch);
  const off = circ - (mastery / 100) * circ;
  const col = mastery >= 80 ? 'var(--green)' : mastery >= 50 ? 'var(--amber)' : mastery > 0 ? 'var(--blue)' : 'var(--text-muted)';
  return `<div class="chapter-group ${exp ? 'expanded' : ''}">
    <div class="chapter-header" data-chapter="${ch.id}">
      <div class="chapter-info">
        <div class="mastery-ring"><svg viewBox="0 0 34 34"><circle class="ring-bg" cx="17" cy="17" r="13" fill="none" stroke-width="2.5"/><circle class="ring-fill" cx="17" cy="17" r="13" fill="none" stroke-width="2.5" stroke="${col}" stroke-dasharray="${circ}" stroke-dashoffset="${off}" stroke-linecap="round"/></svg><span class="ring-label" style="color:${col}">${mastery}%</span></div>
        <span class="chapter-name">${ch.name}</span>
      </div>
      <div class="chapter-meta"><span class="status-badge ${ch.status}">${ch.status}</span><i data-lucide="chevron-down" class="expand-icon" style="width:16px;height:16px;"></i></div>
    </div>
    ${exp ? `<div class="kc-list">${ch.kcs.map(kc => KcItem(kc, sub)).join('')}</div>` : ''}
  </div>`;
}

function KcItem(kc, sub) {
  const locked = kc.status === 'locked';
  const icon = kc.status === 'mastered' ? 'check-circle-2' : kc.status === 'assigned' ? 'circle-dot' : 'lock';
  const iconCol = kc.status === 'mastered' ? 'var(--green)' : kc.status === 'assigned' ? 'var(--amber)' : 'var(--text-muted)';
  // Compute real done/total from answers
  const qs = getQuestions(kc.id);
  const realDone = qs.filter(q => S.answers[q.id]?.submitted).length;
  const realCorrect = qs.filter(q => S.answers[q.id]?.submitted && S.answers[q.id].sel === q.correct).length;
  const kcMastery = realDone > 0 ? Math.round(realCorrect / realDone * 100) : 0;
  return `<div class="kc-item" data-kc="${kc.id}" data-sub="${sub.id}" style="${locked ? 'opacity:.5;pointer-events:none;' : ''}">
    <div class="kc-info"><i data-lucide="${icon}" style="width:15px;height:15px;color:${iconCol};flex-shrink:0;"></i><span class="kc-name">${kc.name}</span><span class="kc-module">${kc.module}</span></div>
    <div class="kc-actions">${realDone > 0 ? `<span class="kc-progress-text">${realDone}/${qs.length} (${kcMastery}%)</span>` : `<span class="kc-progress-text">${kc.doneQ}/${kc.totalQ}</span>`}<button class="btn-start ${locked ? 'disabled' : ''}" data-start-kc="${kc.id}" data-start-sub="${sub.id}">${kc.status === 'mastered' ? 'Re-attempt' : locked ? 'Locked' : realDone > 0 ? 'Continue' : 'Start'}</button></div>
  </div>`;
}

// ════════════════════════════════════════════════════════════
//  PRACTICE (Questions + Hints + Chat)
// ════════════════════════════════════════════════════════════
function PracticePage() {
  const sub = getSubject(S.subject);
  const qs = getQuestions(S.kc);
  const q = qs[S.qIdx];
  if (!q || !sub) return HomePage();
  const { kc } = getKcInfo(S.subject, S.kc);
  const kcName = kc?.name || S.kc;
  const progress = ((S.qIdx + 1) / qs.length) * 100;
  const ans = S.answers[q.id];
  const hint = S.hints[q.id];
  const isWrong = ans?.wrongAttempts?.length > 0 && !ans?.submitted;

  return `
    <nav class="breadcrumb">
      <span class="bc-item" data-nav="home"><i data-lucide="home" style="width:14px;height:14px;"></i> Dashboard</span><span class="bc-sep">/</span>
      <span class="bc-item" data-nav-sub="${sub.id}"><i data-lucide="book" style="width:14px;height:14px;"></i> ${sub.name}</span><span class="bc-sep">/</span>
      <span class="bc-item current">${kcName}</span>
    </nav>
    <div class="practice-layout ${S.chatHidden ? 'chat-collapsed' : ''}">
      <div class="question-panel">
        <div class="question-progress"><div class="question-progress-fill" style="width:${progress}%"></div></div>
        <div class="question-top-bar">
          <span class="question-number">Question ${S.qIdx + 1} of ${qs.length}</span>
          <div style="display:flex;align-items:center;gap:0.75rem;">
            <span class="question-timer"><i data-lucide="clock"></i><span id="timer">00:00</span></span>
            <button class="btn-phone-sidecar" id="btn-open-phone" title="Use phone camera"><i data-lucide="smartphone"></i>📱 Phone</button>
            <button class="btn-icon" id="btn-save-q-main" title="Save Question to Notes"><i data-lucide="bookmark"></i></button>
            <button class="btn-icon" id="toggle-chat" title="${S.chatHidden ? 'Show' : 'Hide'} Chat"><i data-lucide="${S.chatHidden ? 'panel-right-open' : 'panel-right-close'}"></i></button>
          </div>
        </div>
        <div class="question-body">
          <div class="question-text">${S.retryQ ? S.retryQ.text : q.text}</div>
          ${S.retryQ ? RetryOptions() : QuestionOptions(q, ans)}
          ${isWrong && !S.retryQ ? HintsPanel(q) : ''}
          ${isWrong && !S.retryQ ? `<button class="btn-action primary" data-action="retry" style="margin-top: 1rem; width: 100%; justify-content: center; background: var(--green); border-color: var(--green);"><i data-lucide="refresh-cw"></i>Try Similar Question</button>` : ''}
        </div>
        <div class="question-actions">
          ${(S.retryQ ? !S.retryQ.submitted : !ans?.submitted) ? 
            `<button class="btn-action primary" id="btn-submit" ${S.selected === null || (!S.retryQ && ans?.wrongAttempts?.includes(S.selected)) ? 'disabled' : ''}><i data-lucide="check"></i>Submit</button>`
            : `<button class="btn-action primary" id="btn-next"><i data-lucide="arrow-right"></i>Next</button>`
          }
          ${(!S.retryQ && !ans?.submitted) ? `<button class="btn-action ghost" id="btn-skip">Skip</button>` : ''}
          ${S.retryQ && !S.retryQ.submitted ? `<button class="btn-action ghost" id="btn-skip-retry">Back to Original</button>` : ''}
          <div class="q-dots">${qs.map((_, i) => {
            let c = 'q-dot';
            const a = S.answers[qs[i].id];
            if (i === S.qIdx) c += ' active';
            else if (a?.submitted) c += ' done';
            else if (a?.wrongAttempts?.length > 0) c += ' wrong-d';
            return `<div class="${c}" data-dot="${i}"></div>`;
          }).join('')}</div>
        </div>
      </div>
      ${S.chatHidden ? '' : ChatPanel()}
    </div>`;
}

function QuestionOptions(q, ans) {
  return `<div class="options-list">${q.options.map((opt, i) => {
    let cls = 'option-item';
    if (ans?.submitted) {
      if (i === q.correct) cls += ' correct';
    } else {
      if (ans?.wrongAttempts?.includes(i)) cls += ' wrong';
      else if (S.selected === i) cls += ' selected';
    }
    return `<div class="${cls}" data-option="${i}"><div class="option-radio"></div><span class="option-num">(${i + 1})</span><span class="option-text">${opt}</span></div>`;
  }).join('')}</div>`;
}

function RetryOptions() {
  const rq = S.retryQ;
  return `<div style="margin-bottom:.5rem;"><span class="status-badge assigned" style="margin-bottom:.75rem;display:inline-block;">Similar Question</span></div>
    <div class="options-list">${rq.options.map((opt, i) => {
      let cls = 'option-item';
      if (rq.submitted) { if (i === rq.correct) cls += ' correct'; else if (i === rq.sel) cls += ' wrong'; }
      else if (S.selected === i) cls += ' selected';
      return `<div class="${cls}" data-retry-opt="${i}"><div class="option-radio"></div><span class="option-num">(${i + 1})</span><span class="option-text">${opt}</span></div>`;
    }).join('')}</div>`;
}

// ─── HINTS PANEL ────────────────────────────────────────────
function HintsPanel(q) {
  const h = S.hints[q.id] || { level: 0, texts: [], loading: false, conceptText: null };
  return `<div class="hints-panel">
    <div class="hint-header"><i data-lucide="lightbulb"></i>You got this wrong — let's work through it</div>
    ${h.texts.map((txt, i) => `
      <div class="hint-item">
        <div class="hint-level ${['l1','l2','l3'][i]}">${['Concept Nudge', 'Application Guide', 'Full Walkthrough'][i]}</div>
        <div class="hint-text">${txt}</div>
      </div>
    `).join('')}
    ${h.loading ? `<div class="hint-item"><div class="hint-loading"><div class="spinner"></div>Generating hint...</div></div>` : ''}
    <div class="hint-actions">
      ${h.level < 3 && !h.loading ? `<button class="btn-action secondary" data-action="hint"><i data-lucide="lightbulb"></i>Hint ${h.level + 1}/3</button>` : ''}
      ${!h.conceptText && !h.loading ? `<button class="btn-action ghost" data-action="concept"><i data-lucide="book-open"></i>Explain Concept</button>` : ''}
    </div>
    ${h.conceptText ? `<div class="hint-item"><div class="hint-level l1">Concept Explanation</div><div class="hint-text">${h.conceptText}</div></div>` : ''}
  </div>`;
}

// ─── CHAT PANEL ─────────────────────────────────────────────
function ChatPanel() {
  return `<div class="chat-panel ${S.chatLoading ? 'thinking' : ''}" style="position:relative">
    <button class="btn-icon" id="hide-chat-btn" style="position:absolute; right:0.5rem; top:0.5rem; z-index:10; width:28px; height:28px; min-height:0; color:var(--text-secondary); background:var(--bg-elevated); border:1px solid var(--border); border-radius:50%;" title="Hide Chat"><i data-lucide="x" style="width:14px;height:14px;"></i></button>
    <div class="chat-tabs" style="padding-top:0; padding-right:2.5rem;">
      <div class="chat-tab ${S.chatTab === 'ask' ? 'active' : ''}" data-ct="ask">Ask AI</div>
      <div class="chat-tab ${S.chatTab === 'hints' ? 'active' : ''}" data-ct="hints">Hints</div>
      <div class="chat-tab ${S.chatTab === 'notes' ? 'active' : ''}" data-ct="notes">Notes</div>
    </div>
    <div class="chat-messages" id="chat-msgs">
      ${S.chatTab === 'ask' ? ChatMessages() : S.chatTab === 'hints' ? ChatHintsView() : ChatNotesView()}
    </div>
    <div class="chat-input-area">
      ${S.chatTab === 'ask' ? `
        <div class="doubt-stage-bar">
          <button class="doubt-pill ${S.doubtStage === 0 ? 'active' : ''}" data-ds="0">I didn’t understand the question</button>
          <button class="doubt-pill ${S.doubtStage === 1 ? 'active' : ''}" data-ds="1">I don’t know the approach</button>
          <button class="doubt-pill ${S.doubtStage === 2 ? 'active' : ''}" data-ds="2">Stuck in the steps</button>
        </div>
        <div class="chat-input-wrap"><input type="text" class="chat-input" id="chat-in" placeholder="Ask about this question..." /><button class="chat-send" id="chat-send"><i data-lucide="arrow-up"></i></button></div>
      ` : S.chatTab === 'notes' ? `
        <div class="chat-input-wrap"><input type="text" class="chat-input" id="note-in" placeholder="Write a note..." /><button class="chat-send" id="note-save" style="background:var(--green);"><i data-lucide="save"></i></button></div>
      ` : ''}
    </div>
  </div>`;
}

function formatAIResponse(text) {
  // Parse numbered steps and render as step cards
  const stepRegex = /(?:^|\n)(?:(?:Step|\*\*)\s*)(\d+)[.:)\s]\s*(.+?)(?=\n(?:Step|\*\*)\s*\d|$)/gis;
  const steps = [];
  let match;
  let remaining = text;
  while ((match = stepRegex.exec(text)) !== null) {
    steps.push({ num: match[1], content: match[2].trim() });
  }
  if (steps.length >= 2) {
    return `<div class="ai-steps">${steps.map((s, i) => `
      <div class="ai-step">
        <div class="ai-step-num">${s.num}</div>
        <div class="ai-step-content">${s.content}</div>
      </div>`).join('')}</div>`;
  }
  // Fallback: just format bold/newlines
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br>');
}

function ChatMessages() {
  if (!S.chatMsgs.length) return `<div class="empty-state" style="padding:1.5rem"><i data-lucide="message-circle"></i><h3>Ask anything</h3><p>Get step-by-step help with this question</p></div>`;
  return S.chatMsgs.map(m => {
    if (m.fromPhone) {
      return `<div class="chat-bubble ai chat-from-phone-bubble">
        <div class="from-phone-label"><i data-lucide="smartphone" style="width:10px;height:10px"></i>From your Phone</div>
        ${m.imageUrl ? `<img class="from-phone-img" src="${m.imageUrl}" alt="Photo from phone">` : ''}
        ${formatAIResponse(m.text.replace('📱 **From your phone:**\n\n', ''))}
      </div>`;
    }
    return `<div class="chat-bubble ${m.role}">${m.role === 'ai' ? formatAIResponse(m.text) : m.text}</div>`;
  }).join('') + (S.chatLoading ? `<div class="chat-bubble ai loading"><div class="spinner"></div>Thinking...</div>` : '');

}

function ChatHintsView() {
  const qs = getQuestions(S.kc);
  const q = qs[S.qIdx];
  const h = S.hints[q?.id];
  if (!h?.texts.length) return `<div class="empty-state" style="padding:1.5rem"><i data-lucide="lightbulb"></i><h3>No hints yet</h3><p>Get a question wrong to unlock progressive hints</p></div>`;
  return h.texts.map((t, i) => `<div style="padding:.75rem;background:var(--bg-elevated);border-radius:var(--radius-md);border:1px solid var(--border);"><div class="hint-level ${['l1','l2','l3'][i]}" style="margin-bottom:.3rem">${['Concept Nudge','Application Guide','Full Walkthrough'][i]}</div><div style="font-size:.84rem;line-height:1.65;">${t}</div></div>`).join('');
}
function ChatNotesView() {
  const kcNotes = S.notesList.filter(n => n.kcId === S.kc);
  return `
    <div style="margin-bottom:0.75rem;">
      <button class="btn-action secondary" id="btn-quick-save-q" style="width:100%;font-size:0.78rem;padding:0.4rem 0.75rem;min-height:0;justify-content:center;">
        <i data-lucide="bookmark" style="width:14px;height:14px;"></i> Save Current Question
      </button>
    </div>
    ${!kcNotes.length ? `
      <div class="empty-state" style="padding:1rem;text-align:center;">
        <i data-lucide="sticky-note" style="width:24px;height:24px;margin-bottom:0.25rem;opacity:0.5;"></i>
        <h4 style="font-size:0.85rem;margin:0 0 0.15rem 0;color:var(--text-secondary);">No notes</h4>
        <p style="font-size:0.75rem;margin:0;">Save notes for later review</p>
      </div>
    ` : kcNotes.map(n => `
      <div style="padding:.65rem;background:var(--bg-elevated);border-radius:var(--radius-md);border:1px solid var(--border);margin-bottom:.35rem;position:relative;display:flex;flex-direction:column;gap:0.25rem;">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:0.5rem;">
          <p style="font-size:.78rem;color:var(--text-secondary);margin:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:85%;">${n.questionText.substring(0, 45)}...</p>
          <button class="btn-icon" data-del-note="${n.id}" style="padding:2px;width:20px;height:20px;min-height:0;color:var(--red);" title="Delete note"><i data-lucide="trash-2" style="width:12px;height:12px;"></i></button>
        </div>
        <p style="font-size:.84rem;margin:0;">${n.noteContent}</p>
      </div>
    `).join('')}
  `;
}// ════════════════════════════════════════════════════════════
//  TEST MODE
// ════════════════════════════════════════════════════════════
function TestSetupPage() {
  const selSubs = S.testSetup?.subjectIds || [subjects[0]?.id];
  const allKcs = subjects.filter(s => selSubs.includes(s.id)).flatMap(s => s.chapters).flatMap(c => c.kcs);
  const selKcs = S.testSetup?.conceptIds || [];
  return `
    <header class="page-header"><div><h1 class="greeting" id="page-title-mx" style="font-size:1.35rem">Test Mode</h1><p class="greeting-sub">Simulate exam conditions — no AI, no hints</p></div></header>
    <div class="test-setup">
      <div class="goal-form">
        <div class="form-row">
          <div class="form-group" style="flex:1">
            <label class="form-label">Subjects (Select Multiple)</label>
            <div class="multi-select-list" id="test-subs">
              ${subjects.map(s => `
                <label class="multi-select-item">
                  <input type="checkbox" value="${s.id}" ${selSubs.includes(s.id)?'checked':''}>
                  ${s.name}
                </label>
              `).join('')}
            </div>
          </div>
          <div class="form-group" style="flex:1">
            <label class="form-label">Concepts <span style="color:var(--text-muted);font-weight:400">(leave empty for all)</span></label>
            <div class="multi-select-list" id="test-kcs">
              ${allKcs.length === 0 ? `<div style="padding:0.5rem;font-size:0.8rem;color:var(--text-muted)">Select a subject first</div>` : ''}
              ${allKcs.map(k => `
                <label class="multi-select-item">
                  <input type="checkbox" value="${k.id}" ${selKcs.includes(k.id)?'checked':''}>
                  ${k.name}
                </label>
              `).join('')}
            </div>
          </div>
        </div>
        <div class="form-row">
          <div class="form-group"><label class="form-label">Total Time (minutes)</label><input type="number" class="form-input" id="test-time" value="${S.testSetup?.time||30}" min="5" max="180" /></div>
          <div class="form-group"><label class="form-label">Questions</label><input type="number" class="form-input" id="test-count" value="${S.testSetup?.count||10}" min="3" max="50" /></div>
        </div>
        <div class="form-row" style="margin-bottom:1rem">
          <div class="form-group">
            <label class="form-label">Time per question <span style="color:var(--text-muted);font-weight:400">(seconds, 0 = no limit)</span></label>
            <input type="number" class="form-input" id="test-perq" value="${S.testSetup?.perQSec||0}" min="0" max="300" />
            <div style="font-size:0.75rem;color:var(--red);margin-top:0.35rem;"><i data-lucide="alert-circle" style="width:12px;height:12px;margin-bottom:-2px"></i> Questions will automatically skip if an answer is not submitted within the allotted time.</div>
          </div>
        </div>
        <button class="btn-action primary" id="test-start" style="margin-top:.5rem"><i data-lucide="play"></i>Start Test</button>
      </div>
    </div>`;
}

function TestActivePage() {
  const t = S.test;
  const q = t.qs[t.idx];
  if (!q) return TestResultsPage();
  const mins = Math.floor(t.remaining / 60);
  const secs = t.remaining % 60;
  const isWarning = t.remaining < 60;
  // Per-question timer bar
  const perQSec = S.testSetup?.perQSec || 0;
  const qElapsed = t.qStartTime ? Math.round((Date.now() - t.qStartTime) / 1000) : 0;
  const qRemaining = perQSec > 0 ? Math.max(0, perQSec - qElapsed) : 0;
  const qPct = perQSec > 0 ? (qRemaining / perQSec) * 100 : 100;
  const timerColor = qPct > 50 ? 'green' : qPct > 20 ? 'amber' : 'red';
  return `
    <div class="test-timer ${isWarning ? 'warning' : ''}"><i data-lucide="timer"></i>${String(mins).padStart(2,'0')}:${String(secs).padStart(2,'0')}</div>
    <div class="practice-layout" style="grid-template-columns:1fr 180px">
      <div class="question-panel">
        <div class="question-progress"><div class="question-progress-fill" style="width:${((t.idx+1)/t.qs.length)*100}%"></div></div>
        ${perQSec > 0 ? `
          <div class="q-timer-bar-wrap" id="q-timer-bar-wrap">
            <div class="q-timer-bar ${timerColor}" id="q-timer-bar" style="width:${qPct}%"></div>
          </div>
        ` : ''}
        <div class="question-top-bar"><span class="question-number">Question ${t.idx+1} of ${t.qs.length}</span><span class="question-timer"><i data-lucide="clock"></i>${t.idx+1}/${t.qs.length}</span></div>
        <div class="question-body">
          <div class="question-text">${q.text}</div>
          <div class="options-list">${q.options.map((o, i) => {
            let c = 'option-item';
            if (t.ans[q.id] === i) c += ' selected';
            return `<div class="${c}" data-test-opt="${i}"><div class="option-radio"></div><span class="option-num">(${i+1})</span><span class="option-text">${o}</span></div>`;
          }).join('')}</div>
        </div>
        <div class="question-actions">
          <button class="btn-action secondary" id="test-prev" ${t.idx === 0 ? 'disabled style="opacity:.4"' : ''}><i data-lucide="arrow-left"></i>Prev</button>
          <button class="btn-action ${t.flagged[q.id] ? 'red' : 'ghost'}" data-action="flag"><i data-lucide="flag"></i>${t.flagged[q.id] ? 'Flagged' : 'Flag'}</button>
          ${t.idx < t.qs.length - 1 ? `<button class="btn-action primary" id="test-next"><i data-lucide="arrow-right"></i>Next</button>` : `<button class="btn-action green" id="test-finish"><i data-lucide="check-circle-2"></i>Submit Test</button>`}
        </div>
      </div>
      <div style="display:flex;flex-direction:column;gap:.75rem">
        <div class="section-title" style="font-size:.8rem">Question Palette</div>
        <div class="test-palette">${t.qs.map((tq, i) => {
          let c = 'palette-dot';
          if (i === t.idx) c += ' current';
          else if (t.ans[tq.id] !== undefined) c += ' answered';
          if (t.flagged[tq.id]) c += ' flagged';
          return `<div class="${c}" data-palette="${i}">${i+1}</div>`;
        }).join('')}</div>
        <button class="btn-action green" id="test-finish-side" style="width:100%;justify-content:center"><i data-lucide="check-circle-2"></i>Submit</button>
      </div>
    </div>`;
}

function TestResultsPage() {
  const t = S.test;
  let correct = 0, attempted = 0, wrong = 0;
  t.qs.forEach(q => { 
    if (t.ans[q.id] !== undefined) { 
      attempted++; 
      if (t.ans[q.id] === q.correct) correct++; 
      else wrong++;
    } 
  });
  const jeeScore = (correct * 4) - (wrong * 1);
  const maxScore = t.qs.length * 4;
  const pct = attempted > 0 ? Math.round(correct / attempted * 100) : 0;
  return `
    <header class="page-header"><div><h1 class="greeting" id="page-title-mx" style="font-size:1.35rem">Test Results</h1><p class="greeting-sub">Here's how you did</p></div></header>
    <div class="mastery-overview">
      <div class="mastery-card"><h4>JEE Score</h4><div class="big-num ${jeeScore > maxScore * 0.7 ? 'text-green' : jeeScore > maxScore * 0.4 ? 'text-amber' : 'text-red'}">${jeeScore}/${maxScore}</div></div>
      <div class="mastery-card"><h4>Accuracy</h4><div class="big-num">${pct}%</div></div>
      <div class="mastery-card"><h4>Attempted</h4><div class="big-num">${attempted}/${t.qs.length}</div></div>
    </div>
    <div class="section-title">Per-Question Review</div>
    <div class="chapter-list">${t.qs.map((q, i) => {
      const userAns = t.ans[q.id];
      const isCorrect = userAns === q.correct;
      const wasAttempted = userAns !== undefined;
      return `<div class="doubt-card"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:.5rem"><span class="question-number">Q${i+1}</span><span class="status-badge ${isCorrect ? 'mastered' : wasAttempted ? 'assigned' : 'locked'}">${isCorrect ? 'Correct' : wasAttempted ? 'Wrong' : 'Skipped'}</span></div><div class="question-text" style="font-size:.88rem;margin-bottom:.5rem">${q.text}</div>${wasAttempted && !isCorrect ? `<p style="font-size:.82rem;color:var(--red)">Your answer: (${userAns+1}) — Correct: (${q.correct+1})</p>` : ''}</div>`;
    }).join('')}</div>
    <button class="btn-action primary" data-nav="home" style="margin-top:1rem"><i data-lucide="home"></i>Back to Dashboard</button>`;
}

// ════════════════════════════════════════════════════════════
//  NOTES
// ════════════════════════════════════════════════════════════
function NotesPage() {
  if (!S.notesList.length) {
    return `<header class="page-header"><div><h1 class="greeting" id="page-title-mx" style="font-size:1.35rem">Notes</h1><p class="greeting-sub">Your saved question notes</p></div></header>
            <div class="empty-state"><i data-lucide="sticky-note"></i><h3>No notes yet</h3><p>Save notes while practicing</p></div>`;
  }

  // Default to first note if none selected
  if (!S.activeNoteId && S.notesList.length > 0) {
    S.activeNoteId = S.notesList[0].id;
  }

  const grouped = {};
  S.notesList.forEach(n => {
    const subId = n.subjectId || 'general';
    const kcName = n.kcName || 'General';
    if (!grouped[subId]) grouped[subId] = {};
    if (!grouped[subId][kcName]) grouped[subId][kcName] = [];
    grouped[subId][kcName].push(n);
  });

  const activeNote = S.notesList.find(n => n.id === S.activeNoteId) || S.notesList[0];

  return `
    <header class="page-header" style="margin-bottom:0.75rem">
      <div><h1 class="greeting" id="page-title-mx" style="font-size:1.35rem">Notes</h1></div>
    </header>
    <div class="notes-layout">
      <div class="notes-sidebar">
        <div class="notes-sidebar-header"><i data-lucide="book" style="margin-right:0.4rem;width:16px;height:16px"></i> Notebooks</div>
        ${Object.entries(grouped).map(([subId, kcs]) => {
          const sub = getSubject(subId);
          const subName = sub ? sub.name : (subId === 'general' ? 'General Notes' : subId);
          const color = sub ? sub.color : 'var(--accent)';
          return `
            <div class="notes-group">
              <div class="notes-group-title" style="color:${color}"><i data-lucide="folder" style="width:12px;height:12px"></i> ${subName}</div>
              ${Object.values(kcs).flat().sort((a,b)=> new Date(b.createdAt) - new Date(a.createdAt)).map(n => `
                <div class="notes-nav-item ${n.id === S.activeNoteId ? 'active' : ''}" data-nav-note="${n.id}">
                  <div class="notes-nav-title">${n.questionText || 'Untitled Note'}</div>
                  <div class="notes-nav-meta">
                    <span>${n.kcName || 'General'}</span>
                    <span>${n.createdAt}</span>
                  </div>
                </div>
              `).join('')}
            </div>
          `;
        }).join('')}
      </div>
      <div class="notes-editor-pane">
        <div class="notes-editor-header">
          <div class="notes-editor-title">${activeNote.questionText || 'Untitled Note'}</div>
          <div class="notes-editor-meta">
            <span><i data-lucide="tag" style="width:12px;height:12px;margin-right:0.2rem;vertical-align:-2px"></i> ${activeNote.kcName || 'General'}</span>
            <span><i data-lucide="calendar" style="width:12px;height:12px;margin-right:0.2rem;vertical-align:-2px"></i> ${activeNote.createdAt}</span>
            <button class="btn-action ghost" data-del-note="${activeNote.id}" style="color:var(--red);padding:0.1rem 0.5rem;font-size:0.75rem;margin-left:auto"><i data-lucide="trash-2" style="width:12px;height:12px"></i> Delete</button>
          </div>
        </div>
        <textarea class="notes-textarea" id="active-note-editor" data-note-id="${activeNote.id}" placeholder="Start typing your notes here...">${activeNote.noteContent || ''}</textarea>
      </div>
    </div>
  `;
}

// ════════════════════════════════════════════════════════════
//  LEADERBOARD
// ════════════════════════════════════════════════════════════
function LeaderboardPage() {
  const totalQ = S.sessionTotal || Object.keys(S.answers).length;
  const correctQ = S.sessionCorrect || Object.values(S.answers).filter(a => a.submitted && a.sel === a.correct).length;
  const acc = totalQ > 0 ? Math.round((correctQ / totalQ) * 100) : 0;
  const userName = S.user?.displayName || 'Student';
  const initials = userName.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
  
  return `
    <header class="page-header"><div><h1 class="greeting" id="page-title-mx" style="font-size:1.35rem">Leaderboard</h1><p class="greeting-sub">See how you compare</p></div></header>
    <div class="filter-bar"><button class="filter-chip active">All Time</button><button class="filter-chip">This Week</button><button class="filter-chip">Today</button></div>
    <table class="lb-table"><thead><tr><th>#</th><th>Student</th><th>XP</th><th>Questions</th><th>Accuracy</th></tr></thead><tbody>
      <tr class="you"><td class="rank-cell gold">1</td><td><div class="user-cell"><img src="${S.user?.photoURL || ''}" alt="" style="width:28px;height:28px;border-radius:50%;border:2px solid var(--accent);" onerror="this.style.display='none';this.nextSibling.style.display='flex'"><div class="user-avatar" style="background:var(--accent);display:none">${initials}</div><span class="user-name">${userName}<span class="you-badge">You</span></span></div></td><td class="font-mono" style="font-size:.82rem">${S.xp}</td><td>${totalQ}</td><td class="acc-cell ${acc>=80?'high':acc>=60?'med':'low'}">${acc}%</td></tr>
    </tbody></table>
    <div class="empty-state" style="margin-top:2rem"><i data-lucide="users"></i><h3>Invite classmates</h3><p>Share your class code to see them on the leaderboard</p></div>`;
}

// ════════════════════════════════════════════════════════════
//  GOALS
// ════════════════════════════════════════════════════════════
function GoalsPage() {
  return `
    <header class="page-header"><div><h1 class="greeting" style="font-size:1.35rem">Goals & Targets</h1><p class="greeting-sub">Set daily or weekly targets</p></div></header>
    <div class="goal-form">
      <div class="section-title">Create New Goal</div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">Subject</label><select class="form-select" id="goal-sub">${subjects.map(s=>`<option value="${s.id}">${s.name}</option>`).join('')}</select></div>
        <div class="form-group"><label class="form-label">Period</label><select class="form-select" id="goal-period"><option value="daily">Daily</option><option value="weekly">Weekly</option></select></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">Target Questions</label><input type="number" class="form-input" id="goal-count" value="20" min="5" max="100"/></div>
        <div class="form-group"><label class="form-label">Min Accuracy %</label><input type="number" class="form-input" id="goal-acc" value="70" min="0" max="100"/></div>
      </div>
      <button class="btn-action primary" id="goal-create"><i data-lucide="plus"></i>Create Goal</button>
    </div>
    ${S.goals.length ? `<div class="section-title">Active Goals</div><div class="goals-list">${S.goals.map(GoalCard).join('')}</div>` : ''}
  `;
}

function GoalCard(g) {
  const sub = getSubject(g.subjectId);
  const pct = g.target > 0 ? Math.round((g.done / g.target) * 100) : 0;
  const circ = 2 * Math.PI * 19;
  const off = circ - (Math.min(pct, 100) / 100) * circ;
  const col = pct >= 100 ? 'var(--green)' : pct >= 50 ? 'var(--accent)' : 'var(--amber)';
  return `
    <div class="goal-card">
      <div style="flex:1">
        <h4 style="margin:0;font-size:0.95rem">${sub?.name || 'Subject'}</h4>
        <div style="font-size:0.8rem;color:var(--text-secondary);margin-top:0.25rem">${g.period === 'weekly' ? 'Weekly' : 'Daily'} Target${g.accuracy ? ` &bull; Min ${g.accuracy}% accuracy` : ''}</div>
      </div>
      <div class="goal-stats" style="text-align:right;margin-right:1rem">
        <div style="font-size:1.1rem;font-weight:700">${g.done || 0} <span style="font-size:0.8rem;color:var(--text-muted);font-weight:500">/ ${g.target}</span></div>
      </div>
      <div class="progress-ring-wrap" style="position:relative;width:44px;height:44px">
        <svg width="44" height="44" viewBox="0 0 44 44" style="transform:rotate(-90deg)">
          <circle cx="22" cy="22" r="19" fill="none" stroke="var(--bg-elevated)" stroke-width="4"></circle>
          <circle cx="22" cy="22" r="19" fill="none" stroke="${col}" stroke-width="4" stroke-dasharray="${circ}" stroke-dashoffset="${off}" stroke-linecap="round" style="transition:stroke-dashoffset 0.5s ease"></circle>
        </svg>
        <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:0.7rem;font-weight:700">${pct}%</div>
      </div>
    </div>
  `;
}

function DoubtsPage() {
  return `
    <header class="page-header"><div><h1 class="greeting" id="page-title-mx" style="font-size:1.35rem">Doubts & Questions</h1><p class="greeting-sub">Get help on specific topics</p></div></header>
    <div class="doubts-form" style="background:var(--bg-surface);padding:1.5rem;border-radius:var(--radius-lg);border:1px solid var(--border);margin-bottom:2rem">
      <div class="form-group"><label class="form-label">Subject</label><select class="form-select" id="doubt-sub">${subjects.map(s=>`<option value="${s.id}">${s.name}</option>`).join('')}</select></div>
      <div class="form-group" style="margin-top:1rem"><label class="form-label">Your Doubt</label><textarea class="form-input" id="doubt-text" rows="3" placeholder="Describe what you're stuck on..."></textarea></div>
      <button class="btn-action primary" id="doubt-submit" style="margin-top:1rem"><i data-lucide="send"></i>Submit Doubt</button>
    </div>
    <div class="section-title" style="display:flex;justify-content:space-between;align-items:center;">
      <span>Recent Doubts</span>
      <button class="btn-action secondary" style="font-size:0.8rem;padding:0.3rem 0.6rem;min-height:0;"><i data-lucide="filter" style="width:14px;height:14px"></i>Filter</button>
    </div>
    <div class="doubts-list">
      ${S.doubts.length === 0 ? '<div class="empty-state"><i data-lucide="help-circle"></i><h3>No doubts yet</h3><p>Ask a question above to get started</p></div>' : 
        S.doubts.map(d => `
          <div class="doubt-card" style="background:var(--bg-surface);padding:1.25rem;border-radius:var(--radius-lg);border:1px solid var(--border);margin-bottom:1rem">
            <div style="display:flex;justify-content:space-between;margin-bottom:0.75rem">
              <span class="badge" style="background:var(--bg-elevated)">${getSubject(d.subjectId)?.name || 'General'}</span>
              <span style="font-size:0.8rem;color:var(--text-muted)">${new Date(d.time).toLocaleDateString()}</span>
            </div>
            <p style="font-size:0.95rem;margin:0 0 1rem 0">${d.text}</p>
            ${d.response ? `
              <div style="background:var(--bg-body);padding:1rem;border-radius:var(--radius-md);">
                <div style="font-size:0.8rem;font-weight:700;color:var(--accent);margin-bottom:0.5rem;display:flex;align-items:center;gap:0.35rem"><i data-lucide="sparkles" style="width:14px;height:14px"></i>AI Teacher</div>
                <div style="font-size:0.9rem;line-height:1.5">${d.response}</div>
                ${!d.teacherAsked ? `<button class="btn-action secondary ask-teacher-btn" data-doubt-id="${d.id}" style="margin-top:0.75rem"><i data-lucide="mail"></i>Ask Human Teacher</button>` : `<div style="margin-top:0.75rem;font-size:0.8rem;color:var(--green);display:flex;align-items:center;gap:0.35rem"><i data-lucide="check" style="width:14px;height:14px"></i> Forwarded to teacher</div>`}
              </div>
            ` : `
              <div style="display:flex;align-items:center;gap:0.5rem;color:var(--amber);font-size:0.85rem">
                <i data-lucide="clock" style="width:16px;height:16px"></i> Waiting for answer...
              </div>
            `}
          </div>
        `).join('')}
    </div>
  `;
}

function MasteryPage() {
  return `
    <header class="page-header">
      <div>
        <h1 class="greeting" id="page-title-mx" style="font-size:1.35rem">Mastery Overview</h1>
        <p class="greeting-sub">Track your progress and subject proficiency in real-time</p>
      </div>
    </header>
    
    <!-- Top Stats Cards with Mountain Viz -->
    <div class="mastery-overview">
      ${subjects.map(s => {
        const avg = getSubjectMastery(s);
        // Mountain SVG: solid base with vibrant fill overlay
        const fillH = Math.round(avg / 100 * 60); // max 60px tall
        const fillY = 64 - fillH;
        return `
          <div class="mastery-mountain-card">
            <div class="mastery-mountain-left">
              <div class="mastery-card-label">${s.name}</div>
              <div class="mastery-pct-display" style="color:${s.color}">${avg}%</div>
              <div class="mastery-card-sub">${s.todayDone || 0} questions today</div>
            </div>
            <div class="mastery-mountain-wrap">
              <svg viewBox="0 0 100 64" width="100" height="64" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
                <!-- Solid subtle background mountain -->
                <path d="M0,64 L15,35 L30,48 L50,15 L68,38 L85,10 L100,64 Z" fill="${s.color}" fill-opacity="0.15" />
                
                <!-- Clipping rect for the bright fill level -->
                <defs>
                  <clipPath id="mtn-clip-${s.id}">
                    <rect x="0" y="${fillY}" width="100" height="${fillH}"/>
                  </clipPath>
                  <linearGradient id="mtn-grad-${s.id}" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stop-color="${s.color}" stop-opacity="0.9"/>
                    <stop offset="100%" stop-color="${s.color}" stop-opacity="0.3"/>
                  </linearGradient>
                </defs>
                
                <!-- Vibrant filled mountain -->
                <path d="M0,64 L15,35 L30,48 L50,15 L68,38 L85,10 L100,64 Z" fill="url(#mtn-grad-${s.id})" clip-path="url(#mtn-clip-${s.id})" />
                
                <!-- Highlight stroke on the bright filled part -->
                <path d="M0,64 L15,35 L30,48 L50,15 L68,38 L85,10 L100,64" fill="none" stroke="${s.color}" stroke-width="2.5" stroke-linejoin="round" clip-path="url(#mtn-clip-${s.id})" />
                
                <!-- Snow caps if >= 85% -->
                ${avg >= 85 ? `
                  <path d="M46,22 L50,15 L54,22 L51,24 L48,21 Z" fill="#ffffff" fill-opacity="0.9" />
                  <path d="M82,16 L85,10 L88,16 L86,18 L83,16 Z" fill="#ffffff" fill-opacity="0.9" />
                ` : ''}
              </svg>
            </div>
          </div>
        `;
      }).join('')}
    </div>
    
    <!-- Chapter Breakdown Section -->
    <div style="margin-top: 2.5rem;">
      <h3 style="font-size: 1.1rem; font-weight: 700; margin-bottom: 1.5rem; letter-spacing: -0.01em;">Chapter Breakdown</h3>
      
      <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 1.5rem;">
        ${subjects.map(s => `
          <div class="subject-breakdown-card" style="background: var(--bg-surface); border: 1px solid var(--border); border-radius: var(--radius-lg); overflow: hidden;">
            <div style="background: ${s.color}10; padding: 1rem 1.25rem; border-bottom: 1px solid var(--border); display: flex; align-items: center; gap: 0.75rem;">
              <div style="width: 12px; height: 12px; border-radius: 50%; background: ${s.color};"></div>
              <h4 style="margin: 0; font-size: 0.95rem; font-weight: 700; color: var(--text);">${s.name}</h4>
            </div>
            <div style="padding: 1.25rem; display: flex; flex-direction: column; gap: 1.25rem;">
              ${s.chapters.map(ch => {
                const mastery = getChapterMastery(ch);
                const isNotStarted = mastery === 0;
                const statusLabel = mastery >= 80 ? 'Mastered' : mastery >= 50 ? 'Proficient' : mastery > 0 ? 'Learning' : 'Not Started';
                const statusColor = mastery >= 80 ? 'var(--green)' : mastery >= 50 ? 'var(--amber)' : mastery > 0 ? 'var(--accent)' : 'var(--text-muted)';
                return `
                  <div style="display: flex; flex-direction: column; gap: 0.35rem; ${isNotStarted ? 'opacity: 0.55;' : ''}">
                    <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.85rem;">
                      <span style="font-weight: 600; color: var(--text);">${ch.name}</span>
                      <span style="font-weight: 700; color: ${statusColor}; font-size: 0.8rem;">${mastery}%</span>
                    </div>
                    <div style="display: flex; align-items: center; gap: 0.75rem;">
                      <div style="flex: 1; height: 6px; background: var(--bg-elevated); border-radius: 99px; overflow: hidden;">
                        <div style="width: ${mastery}%; height: 100%; background: ${s.color}; border-radius: 99px;"></div>
                      </div>
                      <span style="font-size: 0.72rem; color: var(--text-muted); font-weight: 500; min-width: 65px; text-align: right;">${statusLabel}</span>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        `).join('')}
      </div>
    </div>

    <!-- Weak Areas Section -->
    <div style="margin-top: 2.5rem; margin-bottom: 2rem;">
      <h3 style="font-size: 1.1rem; font-weight: 700; margin-bottom: 1rem; letter-spacing: -0.01em;">Action Required: Weak Areas</h3>
      <div style="display: flex; flex-direction: column; gap: 0.5rem;">
        ${subjects.flatMap(s => s.chapters.map(c => ({ name: c.name, marksLost: getChapterMarksLost(c), subject: s.name, color: s.color })).filter(c => c.marksLost > 0)).sort((a, b) => b.marksLost - a.marksLost).map(w => `
          <div class="weak-item" style="display: flex; align-items: center; gap: 0.75rem; padding: 0.85rem 1.25rem; background: var(--bg-surface); border: 1px solid var(--border); border-radius: var(--radius-md); margin-bottom: 0;">
            <i data-lucide="alert-circle" style="width: 16px; height: 16px; color: var(--red); flex-shrink: 0;"></i>
            <span style="font-size: 0.85rem; font-weight: 600; color: var(--text-secondary);"><span style="color: ${w.color};">${w.subject}</span> &mdash; ${w.name}</span>
            <span style="margin-left: auto; font-family: var(--font-mono); font-size: 0.85rem; font-weight: 700; color: var(--red); background: rgba(225, 41, 63, 0.08); padding: 0.2rem 0.6rem; border-radius: 6px;">-${w.marksLost} Mark${w.marksLost > 1 ? 's' : ''}</span>
          </div>
        `).join('') || `
          <div style="display: flex; align-items: center; gap: 0.75rem; padding: 1.25rem; background: var(--bg-surface); border: 1px solid var(--border); border-radius: var(--radius-lg); color: var(--text-secondary);">
            <i data-lucide="check-circle-2" style="width: 20px; height: 20px; color: var(--green);"></i>
            <span style="font-size: 0.9rem; font-weight: 500;">No weak areas detected! You haven't lost marks on any completed questions. Keep it up!</span>
          </div>
        `}
      </div>
    </div>
  `;
}

function AntiCheatOverlay() {
  return `<div class="anticheat-overlay" id="ac-overlay">
    <div class="anticheat-card">
      <div style="display:flex;align-items:center;gap:0.5rem;color:var(--amber);">
        <i data-lucide="alert-triangle" style="width:18px;height:18px;flex-shrink:0;"></i>
        <h3 style="font-size:0.95rem;font-weight:700;margin:0;">${S.acOverlay.title}</h3>
      </div>
      <p style="color:var(--text-secondary);font-size:0.8rem;line-height:1.5;margin:0 0 0.5rem 0;">${S.acOverlay.text}</p>
      <button class="btn-action primary" id="ac-dismiss" style="align-self:flex-end;padding:0.35rem 0.85rem;font-size:0.75rem;border-radius:6px;min-height:0;margin-top:0.25rem;">Dismiss</button>
    </div>
  </div>`;
}

const speedMessages = [
  { title: 'Whoa, speedster!', text: "That was really quick — you sure you solved that yourself? This is for your learning, take your time." },
  { title: 'Hmm, that was fast...', text: "Hey, cheating wouldn't help you here. This practice is for YOUR benefit." },
  { title: 'Too fast?', text: "Just a reminder — you're only cheating yourself if you rush through. Give it an honest shot!" },
];
const slowMessages = [
  "You've been on this one for a while — you got this! Take a hint if you're stuck.",
  "This is for your benefit — don't overthink it. Try a concept nudge!",
];

function checkSpeed(questionId) {
  if (!S.qStartTime) return;
  const elapsed = (Date.now() - S.qStartTime) / 1000;
  if (elapsed < 5) {
    const msg = speedMessages[Math.floor(Math.random() * speedMessages.length)];
    S.acOverlay = msg;
    render();
  } else if (elapsed > 300) {
    toast(slowMessages[Math.floor(Math.random() * slowMessages.length)], 'warning');
  }
}

// ════════════════════════════════════════════════════════════
//  SETTINGS
// ════════════════════════════════════════════════════════════
function SettingsPage() {
  return `
    <header class="page-header"><div><h1 class="greeting" id="page-title-mx" style="font-size:1.35rem">Settings</h1><p class="greeting-sub">Customize your experience</p></div></header>
    <div class="settings-grid">
      <div class="goal-form">
        <div class="section-title">Appearance</div>
        <div class="setting-row">
          <div class="setting-info"><span class="setting-label">Dark Mode</span><span class="setting-desc">Switch between light and dark themes</span></div>
          <button class="toggle-switch ${S.theme === 'dark' ? 'active' : ''}" id="theme-toggle">
            <div class="toggle-knob"></div>
          </button>
        </div>
        ${isMobile() && S.forceDesktop ? `
        <div class="setting-row" style="margin-top:1rem;padding-top:1rem;border-top:1px solid var(--border)">
          <div class="setting-info"><span class="setting-label">Companion Mode</span><span class="setting-desc">Return to the mobile-optimized sidecar view</span></div>
          <button class="btn-action primary" id="btn-restore-sidecar"><i data-lucide="smartphone"></i>Switch to Sidecar</button>
        </div>` : ''}
      </div>
      <div class="goal-form">
        <div class="section-title">Account</div>
        <div style="display:flex;align-items:center;gap:1rem;margin-bottom:1.5rem;">
          <img src="${S.user?.photoURL || ''}" alt="" style="width:56px;height:56px;border-radius:50%;border:3px solid var(--accent);" onerror="this.style.display='none'">
          <div>
            <div style="font-weight:700;font-size:1.1rem;">${S.user?.displayName || 'Student'}</div>
            <div style="font-size:0.85rem;color:var(--text-secondary);">${S.user?.email || ''}</div>
          </div>
        </div>
        <div class="setting-row">
          <div class="setting-info"><span class="setting-label">XP Earned</span><span class="setting-desc">Your total experience points</span></div>
          <span class="font-mono" style="font-size:1.2rem;font-weight:700;color:var(--accent);">${S.xp} XP</span>
        </div>
        <div class="setting-row">
          <div class="setting-info"><span class="setting-label">Questions Answered</span><span class="setting-desc">Total across all sessions</span></div>
          <span class="font-mono" style="font-size:1.2rem;font-weight:700;">${Object.keys(S.answers).length}</span>
        </div>
        <button class="btn-action red" id="settings-logout" style="margin-top:1rem;"><i data-lucide="log-out"></i>Sign Out</button>
      </div>
      <div class="goal-form">
        <div class="section-title">Goals &amp; Targets</div>
        <div class="form-row">
          <div class="form-group"><label class="form-label">Subject</label><select class="form-select" id="goal-sub">${subjects.map(s=>`<option value="${s.id}">${s.name}</option>`).join('')}</select></div>
          <div class="form-group"><label class="form-label">Period</label><select class="form-select" id="goal-period"><option value="daily">Daily</option><option value="weekly">Weekly</option></select></div>
        </div>
        <div class="form-row">
          <div class="form-group"><label class="form-label">Target Questions</label><input type="number" class="form-input" id="goal-count" value="20" min="1" max="200"/></div>
          <div class="form-group"><label class="form-label">Min Accuracy %</label><input type="number" class="form-input" id="goal-acc" value="70" min="0" max="100"/></div>
        </div>
        <button class="btn-action primary" id="goal-create"><i data-lucide="plus"></i>Create Goal</button>
        ${S.goals.length ? `<div style="margin-top:1.5rem">${S.goals.map(g=>GoalCard(g)).join('')}</div>` : ''}
      </div>
    </div>
  `;
}

// Helper: Award XP
function awardXP(difficulty, isCorrect) {
  if (!isCorrect) return;
  const base = difficulty === 'hard' ? 30 : difficulty === 'medium' ? 20 : 10;
  S.correctStreak++;
  const multiplier = S.correctStreak >= 5 ? 2 : S.correctStreak >= 3 ? 1.5 : 1;
  const earned = Math.round(base * multiplier);
  S.xp += earned;
  save('xp', S.xp);
  if (S.correctStreak >= 3) {
    toast(`+${earned} XP (${S.correctStreak}x streak bonus!)`, 'success');
  } else {
    toast(`+${earned} XP`, 'success');
  }
}

// ─── TIMER ──────────────────────────────────────────────────
function startTimer() {
  clearInterval(S.timerInterval);
  S.timerSec = 0;
  S.timerInterval = setInterval(() => {
    S.timerSec++;
    const el = document.getElementById('timer');
    if (el) el.textContent = `${String(Math.floor(S.timerSec/60)).padStart(2,'0')}:${String(S.timerSec%60).padStart(2,'0')}`;
  }, 1000);
}

function startTestTimer() {
  clearInterval(S.timerInterval);
  S.timerInterval = setInterval(() => {
    if (S.test.remaining <= 0) { clearInterval(S.timerInterval); finishTest(); return; }
    S.test.remaining--;
    
    // Per-question auto-skip logic
    const perQSec = S.testSetup?.perQSec || 0;
    if (perQSec > 0 && S.test.qStartTime) {
      const qElapsed = (Date.now() - S.test.qStartTime) / 1000;
      if (qElapsed >= perQSec) {
        if (S.test.idx < S.test.qs.length - 1) {
          toast('Time up! Auto-skipped to next question.', 'warning');
          S.test.idx++;
          S.test.qStartTime = Date.now();
          render();
        } else {
          toast('Time up! Auto-submitting test.', 'warning');
          finishTest();
          return;
        }
      }
    }

    const el = document.querySelector('.test-timer');
    if (el) {
      const m = Math.floor(S.test.remaining / 60), s = S.test.remaining % 60;
      el.innerHTML = `<i data-lucide="timer"></i>${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
      lucide?.createIcons({ nodes: [el] });
      if (S.test.remaining < 60) el.classList.add('warning');
    }
    
    // Force re-render of progress bar if per-Q timer is active
    if (perQSec > 0) {
      const qBar = document.getElementById('q-timer-bar');
      if (qBar) {
        const qElapsedNow = (Date.now() - S.test.qStartTime) / 1000;
        const pct = Math.max(0, ((perQSec - qElapsedNow) / perQSec) * 100);
        qBar.style.width = pct + '%';
        qBar.className = `q-timer-bar ${pct > 50 ? 'green' : pct > 20 ? 'amber' : 'red'}`;
      }
    }
  }, 1000);
}

function finishTest() {
  S.test.done = true;
  clearInterval(S.timerInterval);
  go('test-results');
}

// ─── TOAST ──────────────────────────────────────────────────
function toast(msg, type = 'info') {
  const c = document.getElementById('toasts');
  if (!c) return;
  const icons = { success: 'check-circle-2', error: 'x-circle', info: 'info', warning: 'alert-triangle' };
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.innerHTML = `<i data-lucide="${icons[type]}"></i><span>${msg}</span>`;
  c.appendChild(t);
  lucide?.createIcons({ nodes: [t] });
  setTimeout(() => { t.style.animation = 'toastOut .25s forwards'; setTimeout(() => t.remove(), 250); }, 3500);
}

// ─── EVENT BINDING ──────────────────────────────────────────
function bind() {
  // ── Page animations (fires on every page change) ─────────────
  requestAnimationFrame(() => {
    // Dashboard: beams canvas + greeting matrix
    if (S.page === 'home') {
      initHomeAnimations();
    }
    // All other pages: matrix flip on the page title
    const titleEl = document.getElementById('page-title-mx');
    if (titleEl && S.page !== 'home') {
      const text = titleEl.textContent.trim();
      startMatrixFlip(titleEl, text, { holdTime: 650, resolveInterval: 45, flickerRate: 80 });
    }
  });

  // ── Sidebar nav label hover — sequential matrix flip ───────
  document.querySelectorAll('.nav-item .nav-label').forEach(label => {
    const originalText = label.textContent;
    label.addEventListener('mouseenter', () => {
      if (label.dataset.animating === '1') return;
      label.dataset.animating = '1';
      startMatrixFlipSequential(label, originalText, {
        letterDuration: 350,
        letterInterval: 75,
        initialDelay: 0,
      });
      // Clear flag after animation finishes
      const totalDur = originalText.length * 75 + 350 + 80;
      setTimeout(() => { label.dataset.animating = '0'; }, totalDur);
    });
  });

  // Nav
  document.querySelectorAll('[data-nav]').forEach(el => el.addEventListener('click', () => {
    go(el.dataset.nav);
  }));

  // Theme toggle in Settings
  document.getElementById('theme-toggle')?.addEventListener('click', () => {
    S.theme = S.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', S.theme);
    localStorage.setItem('nps-theme', S.theme);
    render();
  });

  // Settings logout
  document.getElementById('settings-logout')?.addEventListener('click', async () => {
    try { await logout(); } catch (e) { console.error(e); }
  });

  // Chat panel toggle
  document.getElementById('toggle-chat')?.addEventListener('click', () => {
    S.chatHidden = !S.chatHidden; render();
  });

  // Question copy to notes
  document.getElementById('btn-save-q-main')?.addEventListener('click', saveCurrentQuestionToNotes);
  document.getElementById('btn-quick-save-q')?.addEventListener('click', saveCurrentQuestionToNotes);

  // Retry similar question
  document.querySelector('[data-action="retry"]')?.addEventListener('click', async () => {
    const qs = getQuestions(S.kc); const q = qs[S.qIdx];
    
    // Switch the button to a loading state
    const btn = document.querySelector('[data-action="retry"]');
    if (btn) btn.innerHTML = `<div class="spinner"></div> Generating...`;
    
    toast('Generating similar question...', 'info');
    const raw = await generateSimilarQuestion(q.text);
    // Parse the response robustly
    try {
      // Remove any markdown code blocks
      const cleanedRaw = raw.replace(/```[a-z]*\n?/gi, '').replace(/```/g, '');
      const lines = cleanedRaw.split('\n').filter(l => l.trim());
      let text = '', opts = [], correct = 0;
      
      lines.forEach(l => {
        const cleanL = l.replace(/\*\*/g, '').trim(); // remove bold stars
        const u = cleanL.toUpperCase();
        
        // Match A), A., (A), 1), 1., (1)
        const optMatch = cleanL.match(/^[\(]?([A-D1-4])[\.\)][\s]+(.*)/i);
        if (optMatch) {
          opts.push(optMatch[2].trim());
        }
        else if (u.startsWith('CORRECT:')) {
          let ansChar = u.replace('CORRECT:', '').trim().charAt(0);
          if (['1','2','3','4'].includes(ansChar)) {
             correct = parseInt(ansChar) - 1;
          } else {
             correct = ['A','B','C','D'].indexOf(ansChar);
          }
          if (correct === -1) correct = 0;
        }
        else if (u.startsWith('QUESTION:')) {
          text += cleanL.substring(cleanL.toUpperCase().indexOf('QUESTION:') + 9).trim() + '\n';
        }
        else {
          text += cleanL + '\n';
        }
      });
      
      if (opts.length < 2) throw new Error("Not enough options parsed. Raw:\n" + raw);
      S.retryQ = { text: text.trim(), options: opts, correct, sel: null, submitted: false };
      render(); renderMath();
    } catch (e) {
      console.error("AI Parse Error:", e, "\nRaw response:", raw);
      if (btn) btn.innerHTML = `<i data-lucide="refresh-cw"></i>Try Similar Question`;
      toast('Failed to generate. Try again.', 'error');
    }
  });

  // Subject cards
  document.querySelectorAll('[data-subject]').forEach(el => el.addEventListener('click', () => go('subject', { subject: el.dataset.subject })));

  // Subject breadcrumb
  document.querySelectorAll('[data-nav-sub]').forEach(el => el.addEventListener('click', () => go('subject', { subject: el.dataset.navSub })));

  // Chapter expand
  document.querySelectorAll('[data-chapter]').forEach(el => el.addEventListener('click', () => { S.expanded[el.dataset.chapter] = !S.expanded[el.dataset.chapter]; render(); }));

  // KC start
  document.querySelectorAll('[data-start-kc]').forEach(el => el.addEventListener('click', e => { e.stopPropagation(); startPractice(el.dataset.startKc, el.dataset.startSub); }));
  document.querySelectorAll('.kc-item:not([style*="pointer-events:none"])').forEach(el => el.addEventListener('click', () => { if (el.dataset.kc) startPractice(el.dataset.kc, el.dataset.sub); }));

  // Options
  document.querySelectorAll('[data-option]').forEach(el => el.addEventListener('click', () => {
    const qs = getQuestions(S.kc); const q = qs[S.qIdx];
    if (S.answers[q.id]?.submitted) return;
    const opt = parseInt(el.dataset.option);
    if (S.answers[q.id]?.wrongAttempts?.includes(opt)) return;
    S.selected = opt; render();
  }));

  // Submit
  document.getElementById('btn-submit')?.addEventListener('click', () => {
    if (S.selected === null) return;
    const qs = getQuestions(S.kc); const q = qs[S.qIdx];
    
    // Handle Retry Question Submit
    if (S.retryQ) {
      S.retryQ.sel = S.selected;
      S.retryQ.submitted = true;
      const ok = S.selected === S.retryQ.correct;
      if (ok) {
        toast('Correct on the similar question!', 'success');
      } else {
        toast('Still not quite right. Review the hints again!', 'error');
      }
      render(); renderMath();
      return;
    }

    // Handle Normal Question Submit
    checkSpeed(q.id);
    if (!S.answers[q.id]) S.answers[q.id] = { wrongAttempts: [], time: S.timerSec };
    if (!S.answers[q.id].wrongAttempts) S.answers[q.id].wrongAttempts = [];
    const ok = S.selected === q.correct;
    
    if (ok) {
      S.answers[q.id].sel = S.selected;
      S.answers[q.id].correct = q.correct;
      S.answers[q.id].submitted = true;
      S.sessionTotal++;
      S.sessionCorrect++;
      awardXP(q.difficulty || 'medium', true);
      // Update goal progress
      S.goals.forEach(g => { if (g.subjectId === S.subject) { g.done = (g.done || 0) + 1; } });
      save('goals', S.goals);
      toast('Correct!', 'success');
    } else {
      if (!S.answers[q.id].wrongAttempts.includes(S.selected)) {
        S.answers[q.id].wrongAttempts.push(S.selected);
      }
      S.correctStreak = 0;
      S.hints[q.id] = S.hints[q.id] || { level: 0, texts: [], loading: false, conceptText: null };
      toast('Not quite — use the hints to learn from this!', 'error');
    }
    save('answers', S.answers);
    S.qStartTime = Date.now();
    render();
  });

  // Next
  document.getElementById('btn-next')?.addEventListener('click', () => {
    if (S.retryQ) { S.retryQ = null; render(); return; } // Clear retry question, return to original
    const qs = getQuestions(S.kc);
    if (S.qIdx < qs.length - 1) { S.qIdx++; S.selected = null; S.retryQ = null; S.qStartTime = Date.now(); render(); pushSessionToFirestore(); }
    else { toast('KC Complete!', 'success'); go('subject', { subject: S.subject }); }
  });

  // Skip
  document.getElementById('btn-skip')?.addEventListener('click', () => {
    const qs = getQuestions(S.kc);
    if (S.qIdx < qs.length - 1) { S.qIdx++; S.selected = null; S.retryQ = null; S.qStartTime = Date.now(); render(); pushSessionToFirestore(); }
  });
  
  // Skip Retry
  document.getElementById('btn-skip-retry')?.addEventListener('click', () => {
    S.retryQ = null;
    S.selected = null;
    render();
  });

  // Dots
  document.querySelectorAll('[data-dot]').forEach(el => el.addEventListener('click', () => { S.qIdx = parseInt(el.dataset.dot); S.selected = null; S.retryQ = null; render(); pushSessionToFirestore(); }));

  // Hint actions
  document.querySelector('[data-action="hint"]')?.addEventListener('click', async () => {
    const qs = getQuestions(S.kc); const q = qs[S.qIdx];
    const h = S.hints[q.id]; if (!h) return;
    h.level++; h.loading = true; render();
    const txt = await generateHint(q.text, h.level);
    h.texts.push(txt); h.loading = false; render(); renderMath();
  });

  document.querySelector('[data-action="concept"]')?.addEventListener('click', async () => {
    const qs = getQuestions(S.kc); const q = qs[S.qIdx];
    const h = S.hints[q.id]; if (!h) return;
    h.loading = true; render();
    const txt = await explainConcept(q.text);
    h.conceptText = txt; h.loading = false; render(); renderMath();
  });


  // Retry option select
  document.querySelectorAll('[data-retry-opt]').forEach(el => el.addEventListener('click', () => {
    if (S.retryQ?.submitted) return;
    S.selected = parseInt(el.dataset.retryOpt); render();
  }));

  // Chat tabs
  document.querySelectorAll('[data-ct]').forEach(el => el.addEventListener('click', () => { S.chatTab = el.dataset.ct; render(); }));

  // Chat send
  const chatSend = document.getElementById('chat-send');
  const chatIn = document.getElementById('chat-in');
  if (chatSend && chatIn) {
    const send = async () => {
      const txt = chatIn.value.trim(); if (!txt) return;
      const qs = getQuestions(S.kc); const q = qs[S.qIdx];
      S.chatMsgs.push({ role: 'user', text: txt }); S.chatLoading = true; render();
      const resp = await chatWithAI(q.text, txt, S.chatMsgs);
      S.chatMsgs.push({ role: 'ai', text: resp }); S.chatLoading = false; render(); renderMath();
      document.getElementById('chat-msgs')?.scrollTo(0, 999999);
    };
    chatSend.addEventListener('click', send);
    chatIn.addEventListener('keydown', e => { if (e.key === 'Enter') send(); });
  }

  // Note save
  const noteSave = document.getElementById('note-save');
  const noteIn = document.getElementById('note-in');
  if (noteSave && noteIn) {
    noteSave.addEventListener('click', () => {
      const txt = noteIn.value.trim(); if (!txt) return;
      const qs = getQuestions(S.kc); const q = qs[S.qIdx];
      const { kc } = getKcInfo(S.subject, S.kc);
      S.notesList.push({ id: 'n' + Date.now(), kcName: kc?.name || S.kc, kcId: S.kc, subjectId: S.subject, questionText: q.text, noteContent: txt, createdAt: new Date().toISOString().split('T')[0] });
      save('notes', S.notesList); toast('Note saved!', 'success'); render();
    });
  }

  // Hide chat button inside panel
  document.getElementById('hide-chat-btn')?.addEventListener('click', () => {
    S.chatHidden = true;
    render();
  });

  // Notes Revamp Bindings
  document.querySelectorAll('[data-nav-note]').forEach(el => el.addEventListener('click', () => {
    S.activeNoteId = el.dataset.navNote;
    render();
  }));

  const activeEditor = document.getElementById('active-note-editor');
  if (activeEditor) {
    let saveTimeout;
    activeEditor.addEventListener('input', (e) => {
      const id = e.target.dataset.noteId;
      const n = S.notesList.find(x => x.id === id);
      if (n) {
        n.noteContent = e.target.value;
        clearTimeout(saveTimeout);
        saveTimeout = setTimeout(() => {
          save('notes', S.notesList);
        }, 800);
      }
    });
  }

  // Delete note
  document.querySelectorAll('[data-del-note]').forEach(el => el.addEventListener('click', (e) => {
    e.stopPropagation();
    const id = el.currentTarget.dataset.delNote;
    S.notesList = S.notesList.filter(n => n.id !== id);
    if (S.activeNoteId === id) S.activeNoteId = null;
    save('notes', S.notesList); toast('Note deleted.', 'info'); render();
  }));
  
  // Sidecar Mode Restoration
  document.getElementById('btn-restore-sidecar')?.addEventListener('click', () => {
    S.forceDesktop = false;
    render();
  });

  // Goal create
  document.getElementById('goal-create')?.addEventListener('click', () => {
    const subId = document.getElementById('goal-sub')?.value;
    const period = document.getElementById('goal-period')?.value;
    const target = parseInt(document.getElementById('goal-count')?.value) || 20;
    const acc = parseInt(document.getElementById('goal-acc')?.value) || 70;
    S.goals.push({ id: 'g' + Date.now(), subjectId: subId, period, target, accuracy: acc, done: 0, completed: false });
    save('goals', S.goals); toast('Goal created!', 'success'); render();
  });

  // Delete goal
  document.querySelectorAll('[data-del-goal]').forEach(el => el.addEventListener('click', () => {
    S.goals = S.goals.filter(g => g.id !== el.dataset.delGoal);
    save('goals', S.goals); render();
  }));

  // Doubts
  document.getElementById('upload-area')?.addEventListener('click', () => document.getElementById('file-upload')?.click());
  document.getElementById('doubt-submit')?.addEventListener('click', async () => {
    const txt = document.getElementById('doubt-text')?.value.trim(); if (!txt) { toast('Please describe your doubt.', 'warning'); return; }
    const doubt = { id: 'd' + Date.now(), text: txt, status: 'pending', date: new Date().toISOString().split('T')[0], response: null, teacherAsked: false, subjectId: S.subject };
    S.doubts.unshift(doubt); save('doubts', S.doubts); toast('Doubt submitted! Getting AI response...', 'info'); render();
    const resp = await answerDoubt(txt);
    doubt.response = resp; doubt.status = 'answered'; save('doubts', S.doubts); render(); renderMath();
  });
  document.querySelectorAll('.ask-teacher-btn').forEach(el => el.addEventListener('click', () => {
    const dId = el.dataset.doubtId;
    const doubt = S.doubts.find(d => d.id === dId);
    if (doubt) { doubt.teacherAsked = true; save('doubts', S.doubts); toast('Forwarded to teacher!', 'success'); render(); }
  }));

  // Test mode — global change listeners for multi-select
  document.addEventListener('change', (e) => {
    if (e.target.closest('#test-subs')) {
      const checked = Array.from(document.querySelectorAll('#test-subs input:checked')).map(el => el.value);
      S.testSetup = S.testSetup || {};
      S.testSetup.subjectIds = checked.length ? checked : [subjects[0].id];
      S.testSetup.conceptIds = [];
      render();
    }
    if (e.target.closest('#test-kcs')) {
      const checked = Array.from(document.querySelectorAll('#test-kcs input:checked')).map(el => el.value);
      S.testSetup = S.testSetup || {};
      S.testSetup.conceptIds = checked;
    }
  });

  document.getElementById('test-start')?.addEventListener('click', () => {
    const time = parseInt(document.getElementById('test-time')?.value) || 30;
    const count = parseInt(document.getElementById('test-count')?.value) || 10;
    const perQSec = parseInt(document.getElementById('test-perq')?.value) || 0;
    
    const selSubs = S.testSetup?.subjectIds || [subjects[0].id];
    const selKcs = S.testSetup?.conceptIds || [];
    
    S.testSetup = { subjectIds: selSubs, conceptIds: selKcs, time, count, perQSec };
    
    // Collect questions across all selected subjects/concepts
    let allQs = [];
    subjects.filter(s => selSubs.includes(s.id)).forEach(sub => {
      sub.chapters.forEach(ch => {
        ch.kcs.forEach(kc => {
          if (selKcs.length === 0 || selKcs.includes(kc.id)) {
            allQs = allQs.concat(getQuestions(kc.id));
          }
        });
      });
    });
    allQs.sort(() => Math.random() - 0.5);
    allQs = allQs.slice(0, count);
    if (allQs.length === 0) { toast('No questions found for this selection.', 'error'); return; }
    
    S.test = { active: true, setup: false, subjectIds: selSubs, time, qs: allQs, ans: {}, idx: 0, done: false, remaining: time * 60, flagged: {}, qStartTime: Date.now() };
    go('test-active');
    startTestTimer();
    document.addEventListener('visibilitychange', onTabSwitch);
  });

  // Test options
  document.querySelectorAll('[data-test-opt]').forEach(el => el.addEventListener('click', () => {
    const q = S.test.qs[S.test.idx]; S.test.ans[q.id] = parseInt(el.dataset.testOpt); render();
  }));

  // Test nav
  document.getElementById('test-prev')?.addEventListener('click', () => { if (S.test.idx > 0) { S.test.idx--; S.test.qStartTime = Date.now(); render(); } });
  document.getElementById('test-next')?.addEventListener('click', () => { if (S.test.idx < S.test.qs.length - 1) { S.test.idx++; S.test.qStartTime = Date.now(); render(); } });
  document.getElementById('test-finish')?.addEventListener('click', finishTest);
  document.getElementById('test-finish-side')?.addEventListener('click', finishTest);
  document.querySelectorAll('[data-palette]').forEach(el => el.addEventListener('click', () => { S.test.idx = parseInt(el.dataset.palette); S.test.qStartTime = Date.now(); render(); }));
  document.querySelector('[data-action="flag"]')?.addEventListener('click', () => { const q = S.test.qs[S.test.idx]; S.test.flagged[q.id] = !S.test.flagged[q.id]; render(); });

  // Submit for retry question
  if (S.retryQ && !S.retryQ.submitted) {
    document.getElementById('btn-submit')?.addEventListener('click', () => {
      if (S.selected === null) return;
      S.retryQ.sel = S.selected; S.retryQ.submitted = true;
      const ok = S.selected === S.retryQ.correct;
      toast(ok ? 'Correct!' : 'Incorrect.', ok ? 'success' : 'error');
      render();
    });
  }

  // Filter chips
  document.querySelectorAll('.filter-chip').forEach(el => el.addEventListener('click', () => {
    document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
    el.classList.add('active');
  }));

  // Anti-cheat dismiss
  document.getElementById('ac-dismiss')?.addEventListener('click', () => { S.acOverlay = null; render(); });

  // FAB
  document.getElementById('fab-report')?.addEventListener('click', () => toast('Report submitted. Thank you!', 'info'));

  // Print
  document.getElementById('print-notes')?.addEventListener('click', () => window.print());

  // Logout
  document.getElementById('btn-logout')?.addEventListener('click', async () => {
    try { await logout(); } catch (e) { console.error('Logout error:', e); }
  });
  document.getElementById('btn-sidebar-logout')?.addEventListener('click', async () => {
    try { await logout(); } catch (e) { console.error('Logout error:', e); }
  });

  // ── QR / Phone Sidecar Modal ──
  document.getElementById('btn-open-phone')?.addEventListener('click', async () => {
    S.showQRModal = true;
    // Pre-compute the sidecar URL (may need async LAN IP detection)
    const baseUrl = await getLanBaseUrl();
    const kcPart = S.kc ? `&kc=${S.kc}&sub=${S.subject}` : '';
    const uidPart = S.user ? `&uid=${S.user.uid}` : '';
    S.qrSidecarUrl = `${baseUrl}?sidecar=1${kcPart}${uidPart}`;
    S.qrIsLocalhost = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
    render();
    // Render real QR code after modal is in DOM
    requestAnimationFrame(async () => {
      const canvas = document.getElementById('qr-canvas');
      if (canvas) {
        try {
          await QRCode.toCanvas(canvas, S.qrSidecarUrl, {
            width: 200,
            margin: 1,
            color: { dark: '#000000', light: '#ffffff' },
            errorCorrectionLevel: 'M',
          });
        } catch (err) {
          console.error('QR code generation failed:', err);
        }
      }
    });
  });

  document.getElementById('qr-close')?.addEventListener('click', () => {
    S.showQRModal = false;
    render();
  });

  document.getElementById('qr-overlay')?.addEventListener('click', (e) => {
    if (e.target.id === 'qr-overlay') { S.showQRModal = false; render(); }
  });

  document.getElementById('qr-copy-btn')?.addEventListener('click', () => {
    const linkText = document.getElementById('qr-link-text')?.textContent;
    if (linkText) {
      navigator.clipboard.writeText(linkText).then(() => {
        const btn = document.getElementById('qr-copy-btn');
        if (btn) { btn.innerHTML = '<i data-lucide="check"></i>Copied!'; lucide?.createIcons({ nodes: [btn] }); }
      });
    }
  });

}

// ════════════════════════════════════════════════════════════
//  SIDECAR — MOBILE COMPANION MODE
// ════════════════════════════════════════════════════════════

function SidecarPage() {
  const firstName = S.user?.displayName?.split(' ')[0] || 'Student';
  const hasLiveSession = !!S.sidecarLiveQuestion;
  return `
    <div class="sidecar-layout">
      <header class="sidecar-header">
        <div class="sidecar-logo">
          <div class="sidecar-logo-icon"><i data-lucide="brain"></i></div>
          <span class="sidecar-logo-text">NPS ALS</span>
        </div>
        <div style="display:flex;align-items:center;gap:0.5rem">
          ${hasLiveSession ? `<div class="sidecar-live-badge"><span class="sidecar-live-dot"></span>LIVE</div>` : ''}
        </div>
        <div class="sidecar-header-actions">
          <button class="sidecar-header-btn" id="sidecar-settings"><i data-lucide="sun-moon"></i></button>
          <img class="sidecar-avatar" src="${S.user?.photoURL || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + (S.user?.uid || 'user')}" alt="${firstName}" onerror="this.style.display='none'">
        </div>
      </header>

      <div class="sidecar-body">
        ${S.sidecarTab === 'live' ? SidecarLiveTab() : SidecarProgressTab()}

        <div class="sidecar-mode-switch">
          <button class="sidecar-mode-switch-btn" id="sidecar-force-desktop"><i data-lucide="monitor"></i>Switch to Full Desktop Mode</button>
          <div class="sidecar-mode-switch-warning"><i data-lucide="alert-triangle"></i>Not recommended on mobile</div>
        </div>
      </div>

      <nav class="sidecar-tabbar">
        <button class="sidecar-tab ${S.sidecarTab === 'live' ? 'active' : ''}" data-stab="live"><i data-lucide="camera"></i>Companion</button>
        <button class="sidecar-tab ${S.sidecarTab === 'progress' ? 'active' : ''}" data-stab="progress"><i data-lucide="bar-chart-3"></i>Progress</button>
      </nav>
    </div>
  `;
}

function SidecarLiveTab() {
  const lq = S.sidecarLiveQuestion;
  const ctx = S.sidecarContext;

  return `
    <div class="sidecar-animate-in">
      ${lq ? `
        <!-- LIVE QUESTION CARD synced from desktop -->
        <div class="sidecar-live-question-card">
          <div class="sidecar-live-q-header">
            <div style="display:flex;align-items:center;gap:0.5rem">
              <div class="sidecar-live-dot-sm"></div>
              <span style="font-size:0.7rem;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:var(--green)">Live from Desktop</span>
            </div>
            <span style="font-size:0.72rem;color:var(--text-muted);font-weight:600">${lq.subjectName || ''} · ${lq.kcName || ''}</span>
          </div>
          <div class="sidecar-live-q-counter">Question ${(lq.qIdx ?? 0) + 1} of ${lq.totalQ || '?'}</div>
          <div class="sidecar-live-q-text">${lq.text || ''}</div>
          ${lq.options && lq.options.length ? `
            <div class="sidecar-live-options">
              ${lq.options.map((opt, i) => `
                <div class="sidecar-live-option">${String.fromCharCode(65 + i)}. ${opt}</div>
              `).join('')}
            </div>
          ` : ''}
        </div>
      ` : `
        <!-- Waiting for desktop session -->
        <div class="sidecar-waiting-card">
          <div class="sidecar-waiting-pulse"><i data-lucide="wifi"></i></div>
          <h3>Waiting for your desktop session</h3>
          <p>Open a practice set on your laptop — the current question will appear here in real-time.</p>
        </div>
      `}
    </div>

    <!-- Camera upload + AI analysis -->
    <div class="sidecar-animate-in">
      <div class="sidecar-upload-label">
        <i data-lucide="camera" style="width:14px;height:14px"></i>
        ${lq ? 'Photo your working for this question' : 'Photo your working'}
      </div>
      ${!S.sidecarImage ? `
        <div class="sidecar-upload-zone">
          <button class="sidecar-camera-btn" id="sidecar-take-photo"><i data-lucide="camera"></i>Take Photo of Your Working</button>
          <button class="sidecar-gallery-btn" id="sidecar-gallery"><i data-lucide="image"></i>Choose from Gallery</button>
          <input type="file" id="sidecar-file-camera" accept="image/*" capture="environment" style="display:none">
          <input type="file" id="sidecar-file-gallery" accept="image/*" style="display:none">
        </div>
      ` : `
        <div class="sidecar-image-preview sidecar-animate-in">
          <img src="${S.sidecarImage.dataUrl}" alt="Your working">
          <button class="sidecar-image-remove" id="sidecar-remove-img"><i data-lucide="x"></i></button>
        </div>
      `}

      <div class="sidecar-quick-chips">
        <button class="sidecar-chip" data-sq="Where did I go wrong?">Where did I go wrong?</button>
        <button class="sidecar-chip" data-sq="Check my solution">Check my solution</button>
        <button class="sidecar-chip" data-sq="What concept is this?">What concept?</button>
        <button class="sidecar-chip" data-sq="Show the correct approach">Show approach</button>
      </div>

      <div class="sidecar-chat-area">
        <div class="sidecar-prompt-input">
          <input type="text" id="sidecar-chat-input" placeholder="${S.sidecarImage ? 'Ask about your working...' : 'Type a question or upload a photo...'}" />
          <button class="sidecar-send-btn" id="sidecar-chat-send"><i data-lucide="arrow-up"></i></button>
        </div>

        <div class="sidecar-thread" id="sidecar-thread">
          ${S.sidecarMsgs.length === 0 && !S.sidecarLoading ? `
            <div class="sidecar-empty">
              <i data-lucide="message-circle"></i>
              <h3>Your AI tutor is ready</h3>
              <p>Take a photo of your working, then ask what went wrong. The analysis will also appear on your laptop.</p>
            </div>
          ` : ''}
          ${S.sidecarMsgs.map(m => {
            if (m.role === 'user') {
              return `<div class="sidecar-msg user">${m.imageUrl ? `<img class="sidecar-msg-img" src="${m.imageUrl}" alt="Working">` : ''}${m.text}</div>`;
            } else {
              return `<div class="sidecar-msg ai">${formatAIResponse(m.text)}</div>`;
            }
          }).join('')}
          ${S.sidecarLoading ? `<div class="sidecar-msg loading"><div class="spinner"></div>Analyzing your working...</div>` : ''}
        </div>
      </div>
    </div>
  `;
}

function SidecarProgressTab() {
  const streakDays = getStreakDays();
  const totalAnswered = Object.keys(S.answers).length;
  const totalCorrect = Object.values(S.answers).filter(a => a.submitted && a.sel === a.correct).length;
  const accuracy = totalAnswered > 0 ? Math.round(totalCorrect / totalAnswered * 100) : 0;

  return `
    <div class="sidecar-animate-in">
      <div class="sidecar-mode-badge"><i data-lucide="bar-chart-3"></i>Your Progress</div>
      <h1 class="sidecar-section-title">📊 Stats</h1>
      <p class="sidecar-section-sub">Quick overview of how you're doing.</p>
    </div>

    <div class="sidecar-animate-in">
      <div class="sidecar-stat-card">
        <div class="sidecar-stat-icon" style="background:rgba(223,155,36,0.15);color:var(--amber)"><i data-lucide="flame"></i></div>
        <div class="sidecar-stat-info">
          <div class="sidecar-stat-label">Current Streak</div>
          <div class="sidecar-stat-value">${S.streak || 0} <span style="font-size:0.75rem;font-weight:500;color:var(--text-muted)">days</span></div>
        </div>
      </div>

      <div class="sidecar-stat-card">
        <div class="sidecar-stat-icon" style="background:rgba(178,43,61,0.15);color:var(--accent)"><i data-lucide="zap"></i></div>
        <div class="sidecar-stat-info">
          <div class="sidecar-stat-label">Experience Points</div>
          <div class="sidecar-stat-value">${S.xp} <span style="font-size:0.75rem;font-weight:500;color:var(--text-muted)">XP</span></div>
        </div>
      </div>

      <div class="sidecar-stat-card">
        <div class="sidecar-stat-icon" style="background:rgba(46,156,104,0.15);color:var(--green)"><i data-lucide="target"></i></div>
        <div class="sidecar-stat-info">
          <div class="sidecar-stat-label">Accuracy</div>
          <div class="sidecar-stat-value">${accuracy}% <span style="font-size:0.75rem;font-weight:500;color:var(--text-muted)">(${totalCorrect}/${totalAnswered})</span></div>
        </div>
      </div>
    </div>

    <div class="sidecar-animate-in" style="margin-top:1.5rem">
      <div style="font-size:0.85rem;font-weight:700;margin-bottom:0.75rem">Subject Mastery</div>
      ${subjects.map(s => {
        const mastery = getSubjectMastery(s);
        return `
          <div class="sidecar-stat-card" style="flex-direction:column;align-items:stretch;gap:0.5rem">
            <div style="display:flex;justify-content:space-between;align-items:center">
              <span style="font-size:0.85rem;font-weight:600;color:var(--text)">${s.name}</span>
              <span style="font-size:0.85rem;font-weight:700;color:${s.color}">${mastery}%</span>
            </div>
            <div class="sidecar-mastery-bar">
              <div class="sidecar-mastery-fill" style="width:${mastery}%;background:${s.color}"></div>
            </div>
          </div>
        `;
      }).join('')}
    </div>

    <div class="sidecar-animate-in" style="margin-top:1.5rem">
      <div style="font-size:0.85rem;font-weight:700;margin-bottom:0.75rem">This Week</div>
      <div style="display:flex;justify-content:space-between;padding:0.75rem;background:var(--bg-surface);border:1px solid var(--border);border-radius:var(--radius-lg)">
        ${streakDays.map(d => `
          <div style="display:flex;flex-direction:column;align-items:center;gap:0.25rem">
            <div style="width:32px;height:32px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:0.85rem;${d.active ? 'background:linear-gradient(135deg,#ff6b35,#f7c59f);color:#000;box-shadow:0 0 8px rgba(255,107,53,0.3)' : 'background:var(--bg-elevated);color:var(--text-muted)'}">${d.active ? '🔥' : ''}</div>
            <span style="font-size:0.6rem;font-weight:600;color:var(--text-muted);text-transform:uppercase">${d.label}</span>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}
// ─── QR CODE MODAL (Desktop Practice Page) ───────────────────
function QRModal() {
  const sidecarUrl = S.qrSidecarUrl || getSidecarUrl();
  const isLocalhost = S.qrIsLocalhost;
  return `
    <div class="qr-modal-overlay ${S.showQRModal ? 'active' : ''}" id="qr-overlay">
      <div class="qr-modal">
        <div class="qr-modal-title"><i data-lucide="smartphone"></i>Open on Phone</div>
        <p class="qr-modal-desc">Scan this QR code with your phone to use the Sidecar camera mode for this question.</p>
        <div class="qr-canvas-wrap"><canvas id="qr-canvas" width="200" height="200"></canvas></div>
        <div class="qr-link-copy">
          <span class="qr-link-text" id="qr-link-text">${sidecarUrl}</span>
          <button class="qr-copy-btn" id="qr-copy-btn"><i data-lucide="copy"></i>Copy</button>
        </div>

        <div class="qr-info-notes">
          <div class="qr-info-note">
            <i data-lucide="wifi" style="width:13px;height:13px;flex-shrink:0"></i>
            <span>Both devices must be on the <strong>same WiFi network</strong> (dev mode only)</span>
          </div>
          <div class="qr-info-note">
            <i data-lucide="link" style="width:13px;height:13px;flex-shrink:0"></i>
            <span>Companion pairs automatically — <strong>no mobile login required</strong></span>
          </div>
          <div class="qr-info-note">
            <i data-lucide="camera" style="width:13px;height:13px;flex-shrink:0"></i>
            <span>Photo your working on phone → AI feedback appears on both screens</span>
          </div>
          ${isLocalhost ? `
            <div class="qr-info-note qr-info-warning">
              <i data-lucide="alert-triangle" style="width:13px;height:13px;flex-shrink:0"></i>
              <span>You're on <strong>localhost</strong>. Make sure Vite is running with <code>--host</code> flag or the QR points to your LAN IP.</span>
            </div>
          ` : ''}
        </div>

        <button class="qr-modal-close" id="qr-close">Close</button>
      </div>
    </div>
  `;
}

// ─── SIDECAR LOGIN PAGE (shown when phone scans QR but isn't logged in) ───
function SidecarLoginPage() {
  return `
    <div class="sidecar-login-page">
      <div class="sidecar-login-card">
        <div class="sidecar-login-logo">
          <div class="sidecar-login-logo-icon"><i data-lucide="brain"></i></div>
          <span>NPS ALS</span>
        </div>
        <div class="sidecar-login-badge"><i data-lucide="smartphone" style="width:14px;height:14px"></i>Companion Mode</div>
        <h2 class="sidecar-login-title">Sign in to connect</h2>
        <p class="sidecar-login-desc">Sign in with the <strong>same Google account</strong> you use on your laptop to sync your practice session.</p>
        <button class="sidecar-login-btn" id="sidecar-login-google">
          <svg viewBox="0 0 24 24" width="20" height="20"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
          Continue with Google
        </button>
        <div class="sidecar-login-hint">
          <i data-lucide="info" style="width:13px;height:13px;flex-shrink:0;opacity:0.5"></i>
          <span>Use the same account as your desktop session for live question sync.</span>
        </div>
      </div>
    </div>
  `;
}

function bindSidecarLogin() {
  lucide?.createIcons();
  document.getElementById('sidecar-login-google')?.addEventListener('click', async () => {
    try {
      await signInWithGoogle();
      // Auth state change will trigger render, which will see _pendingSidecar and enter sidecar mode
    } catch (err) {
      console.error('Sidecar login error:', err);
      toast('Sign-in failed. Please try again.', 'error');
    }
  });
}

// ─── SIDECAR EVENT BINDINGS ─────────────────────────────────
function bindSidecar() {
  // Tab switching
  document.querySelectorAll('[data-stab]').forEach(el => el.addEventListener('click', () => {
    S.sidecarTab = el.dataset.stab;
    render();
  }));

  // Camera button
  document.getElementById('sidecar-take-photo')?.addEventListener('click', () => {
    document.getElementById('sidecar-file-camera')?.click();
  });

  // Gallery button
  document.getElementById('sidecar-gallery')?.addEventListener('click', () => {
    document.getElementById('sidecar-file-gallery')?.click();
  });

  // File input handlers (both camera and gallery)
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target.result;
      const base64 = dataUrl.split(',')[1];
      const mimeType = file.type || 'image/jpeg';
      S.sidecarImage = { base64, mimeType, dataUrl };
      render();
    };
    reader.readAsDataURL(file);
  };

  document.getElementById('sidecar-file-camera')?.addEventListener('change', handleFileSelect);
  document.getElementById('sidecar-file-gallery')?.addEventListener('change', handleFileSelect);

  // Remove image
  document.getElementById('sidecar-remove-img')?.addEventListener('click', () => {
    S.sidecarImage = null;
    render();
  });

  // Quick chips
  document.querySelectorAll('[data-sq]').forEach(el => el.addEventListener('click', () => {
    const chatInput = document.getElementById('sidecar-chat-input');
    if (chatInput) chatInput.value = el.dataset.sq;
    // Auto-send if image is attached
    if (S.sidecarImage) {
      sendSidecarMessage(el.dataset.sq);
    }
  }));

  // Send button
  document.getElementById('sidecar-chat-send')?.addEventListener('click', () => {
    const input = document.getElementById('sidecar-chat-input');
    if (input) sendSidecarMessage(input.value.trim());
  });

  // Enter key
  document.getElementById('sidecar-chat-input')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const input = document.getElementById('sidecar-chat-input');
      if (input) sendSidecarMessage(input.value.trim());
    }
  });

  // Doubts send
  document.getElementById('sidecar-doubt-send')?.addEventListener('click', async () => {
    const input = document.getElementById('sidecar-doubt-input');
    const txt = input?.value.trim();
    if (!txt) return;

    // Add image if available on upload tab (user may switch tabs)
    const doubt = {
      id: 'd' + Date.now(),
      text: txt,
      status: 'pending',
      date: new Date().toISOString().split('T')[0],
      time: Date.now(),
      response: null,
      teacherAsked: false,
      subjectId: 'physics', // default for sidecar
      imageUrl: null,
    };
    S.doubts.unshift(doubt);
    save('doubts', S.doubts);
    render();

    const resp = await answerDoubt(txt);
    doubt.response = resp;
    doubt.status = 'answered';
    save('doubts', S.doubts);
    render();
    renderMath();
  });

  // Force desktop mode
  document.getElementById('sidecar-force-desktop')?.addEventListener('click', () => {
    S.forceDesktop = true;
    localStorage.setItem('nps-force-desktop', 'true');
    render();
  });

  // Settings (return to sidecar if mobile)
  document.getElementById('sidecar-settings')?.addEventListener('click', () => {
    // Toggle theme as a quick setting on mobile
    S.theme = S.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', S.theme);
    localStorage.setItem('nps-theme', S.theme);
    render();
  });
}

async function sendSidecarMessage(text) {
  if (!text && !S.sidecarImage) return;
  const displayText = text || 'Analyze my working';

  // Add user message with image thumbnail
  const msg = { role: 'user', text: displayText, imageUrl: S.sidecarImage?.dataUrl || null };
  S.sidecarMsgs.push(msg);
  S.sidecarLoading = true;
  render();

  let response;
  if (S.sidecarImage) {
    const ctx = S.sidecarContext ? `${S.sidecarContext.subjectName} - ${S.sidecarContext.kcName}` : '';
    const questionContext = S.sidecarLiveQuestion ? `\n\nCurrent question: ${S.sidecarLiveQuestion.text}` : '';
    response = await analyzeWorkingImage(S.sidecarImage.base64, S.sidecarImage.mimeType, displayText, ctx + questionContext);

    // ── Push image + AI response to Firestore so desktop sees it in real-time ──
    try {
      if (S.user && db) {
        const compressedDataUrl = await compressImage(S.sidecarImage.dataUrl);
        const sessionRef = doc(db, 'sessions', S.user.uid);
        await setDoc(sessionRef, {
          sidecarImage: {
            dataUrl: compressedDataUrl,
            aiResponse: response,
            questionId: S.sidecarLiveQuestion?.qId || null,
            questionText: S.sidecarLiveQuestion?.text || null,
            prompt: displayText,
            timestamp: Date.now(),
          }
        }, { merge: true });
      }
    } catch (err) {
      console.error('Failed to push sidecar image to Firestore:', err);
    }

    // Also save to doubts feed (local + cloud backup)
    const doubt = {
      id: 'd' + Date.now(),
      text: `📸 [Image] ${displayText}`,
      status: 'answered',
      date: new Date().toISOString().split('T')[0],
      time: Date.now(),
      response: response,
      teacherAsked: false,
      subjectId: S.sidecarContext ? S.subject : 'physics',
      imageUrl: S.sidecarImage.dataUrl,
    };
    S.doubts.unshift(doubt);
    save('doubts', S.doubts);
  } else {
    response = await answerDoubt(displayText);

    // Also save to doubts feed
    const doubt = {
      id: 'd' + Date.now(),
      text: displayText,
      status: 'answered',
      date: new Date().toISOString().split('T')[0],
      time: Date.now(),
      response: response,
      teacherAsked: false,
      subjectId: 'physics',
    };
    S.doubts.unshift(doubt);
    save('doubts', S.doubts);
  }

  S.sidecarMsgs.push({ role: 'ai', text: response });
  S.sidecarLoading = false;
  render();
  renderMath();
  document.getElementById('sidecar-thread')?.scrollTo(0, 999999);
}

// ─── GLOBAL DROPDOWN DELEGATION (set up once, survives re-renders) ───────────
document.addEventListener('click', (e) => {
  const streakBtn   = document.getElementById('streak-btn');
  const notifBtn    = document.getElementById('notif-btn');
  const notifPanel  = document.getElementById('notif-panel');

  // Streak hover is handled by CSS, no JS needed for streak open state
  
  // Notification dropdown
  if (notifBtn && notifBtn.contains(e.target)) {
    e.stopPropagation();
    const opening = !notifPanel?.classList.contains('open');
    notifPanel?.classList.toggle('open', opening);
    if (opening) {
      S.notifications.forEach(n => { n.read = true; });
      localStorage.setItem('nps-notifications', JSON.stringify(S.notifications));
      setTimeout(render, 250);
    }
    return;
  }
  // Doubt stage pills — select AND send a standardised prompt
  const dsPill = e.target.closest('[data-ds]');
  if (dsPill) {
    const stage = parseInt(dsPill.dataset.ds);
    S.doubtStage = stage;
    render();
    // Build and send a context-aware prompt based on the selected doubt stage
    const stagePrompts = [
      "I didn't understand what this question is asking. Can you explain it to me in simple terms?",
      "I don't know how to approach this question. What strategy or method should I use to solve it?",
      "I know what to do but I'm getting stuck mid-way through the solution. Can you walk me through the steps one by one?"
    ];
    const promptText = stagePrompts[stage];
    const qs = getQuestions(S.kc);
    const q = qs[S.qIdx];
    if (!q) return;
    S.chatTab = 'ask';
    S.chatMsgs.push({ role: 'user', text: promptText });
    S.chatLoading = true;
    render();
    chatWithAI(q.text, promptText, S.chatMsgs).then(resp => {
      S.chatMsgs.push({ role: 'ai', text: resp });
      S.chatLoading = false;
      render();
      renderMath();
      document.getElementById('chat-msgs')?.scrollTo(0, 999999);
    });
    return;
  }
  // Click outside notif panel — close it
  if (notifPanel && !notifPanel.contains(e.target)) {
    notifPanel.classList.remove('open');
  }
});

// Tab switch handler for test mode
function onTabSwitch() {
  if (!S.test.active || S.test.done) return;
  if (document.hidden) {
    S.tabWarnings++;
    S.acOverlay = { title: 'Tab switch detected!', text: `You switched away from the test. This is monitored for integrity. (Warning ${S.tabWarnings})` };
    render();
  }
}

// Screenshot detection
window.addEventListener('beforeprint', () => {
  if (S.test.active && !S.test.done) {
    S.acOverlay = { title: 'Print/Screenshot detected!', text: 'Screen capture attempts are monitored during tests. This has been logged.' };
    render();
  }
});

// Block common screenshot shortcuts during test
document.addEventListener('keydown', (e) => {
  if (!S.test.active || S.test.done) return;
  // Block PrintScreen, Cmd+Shift+3/4 (Mac), Cmd+Shift+5 (Mac), Ctrl+Shift+S
  if (e.key === 'PrintScreen' || 
      (e.metaKey && e.shiftKey && ['3','4','5'].includes(e.key)) ||
      (e.ctrlKey && e.shiftKey && e.key === 'S')) {
    e.preventDefault();
    S.acOverlay = { title: 'Screenshot blocked!', text: 'Screenshots are not allowed during test mode. Focus on the exam!' };
    render();
  }
});

// Idle detection during practice
let idleTimer = null;
function resetIdleTimer() {
  clearTimeout(idleTimer);
  if (S.page === 'practice' || (S.test.active && !S.test.done)) {
    idleTimer = setTimeout(() => {
      if (S.page === 'practice') {
        toast("Still there? This practice is for your benefit — keep going!", 'warning');
      }
    }, 120000); // 2 minutes
  }
}
document.addEventListener('mousemove', resetIdleTimer);
document.addEventListener('keypress', resetIdleTimer);

// ─── BOOT ───────────────────────────────────────────────────
onAuthChange(async (user) => {
  // Direct pairing companion mode: if we are loading via sidecar QR code and have a desktop UID,
  // we can pair directly without requiring authentication on the phone.
  if (!user && _pendingSidecarParams?.uid) {
    user = {
      uid: _pendingSidecarParams.uid,
      displayName: 'Companion',
      photoURL: 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + _pendingSidecarParams.uid,
      isSidecarCompanion: true
    };
  }

  S.user = user;
  if (user) {
    S.authLoading = true;
    render();
    
    // Only load/sync standard user progress metadata if this is a fully authenticated user
    if (!user.isSidecarCompanion) {
      try {
        const userDocRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(userDocRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.xp !== undefined) S.xp = data.xp;
          if (data.streak !== undefined) S.streak = data.streak;
          if (data.answers !== undefined) S.answers = data.answers;
          if (data.notesList !== undefined) S.notesList = data.notesList;
          if (data.goals !== undefined) S.goals = data.goals;
          if (data.doubts !== undefined) S.doubts = data.doubts;

          localStorage.setItem('nps-xp', S.xp);
          localStorage.setItem('nps-streak', S.streak);
          localStorage.setItem('nps-notes', JSON.stringify(S.notesList));
          localStorage.setItem('nps-goals', JSON.stringify(S.goals));
          localStorage.setItem('nps-doubts', JSON.stringify(S.doubts));
        } else {
          await syncToFirebase();
        }
      } catch (err) {
        console.error("Failed to load user data from Firestore:", err);
      }
    } else {
      // For companion mode, try to load user stats from Firestore for the stats tab,
      // but catch errors gracefully if security rules restrict access.
      try {
        const userDocRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(userDocRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.xp !== undefined) S.xp = data.xp;
          if (data.streak !== undefined) S.streak = data.streak;
          if (data.answers !== undefined) S.answers = data.answers;
        }
      } catch (err) {
        console.warn("Could not fetch user stats in companion mode (likely due to security rules):", err);
      }
    }

    // Apply any pending sidecar context from URL params
    if (_pendingSidecarParams) {
      const kcParam = _pendingSidecarParams.kc;
      const subParam = _pendingSidecarParams.sub;
      if (kcParam && subParam) {
        const { kc, sub } = getKcInfo(subParam, kcParam);
        S.sidecarContext = { kcName: kc?.name || kcParam, subjectName: sub?.name || subParam };
      }
    }
    // Start real-time cross-device session sync
    subscribeToSession(user.uid);
  } else {
    // User signed out — tear down session listener
    if (S.sidecarSessionUnsubscribe) {
      S.sidecarSessionUnsubscribe();
      S.sidecarSessionUnsubscribe = null;
    }
  }
  S.authLoading = false;
  render();
});

