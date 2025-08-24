import React, { useEffect, useMemo, useState } from "react";

// ------------------------------------------------------------
// MoodiPet — Minimal but delightful MVP (FIXED)
// - ✅ Fixed: JSX/paren mismatch & stray non-JS content that caused syntax errors
// - This file is now a clean, compilable React component (TSX/JSX-safe)
// - Pet selection (Sunny/Milo/Willow/Ember/Sage)
// - Cozy Pet Home with idle movement + reactions
// - Quick Mood Check chips + short journal entry
// - Pet Response (personality-based, supportive, non-judgmental)
// - Journal history stored privately in localStorage
// - Optional mini "widget" mode (floating bubble)
// ------------------------------------------------------------

// If you previously copied PWA snippets (manifest.json, sw.js, HTML <head> tags)
// into this file, that will break compilation. Those are now moved to a
// comment-only appendix at the end of this file. Keep this file strictly React.

// ------------------------------------------------------------
// Utilities
// ------------------------------------------------------------
const PETS = [
  { id: "sunny", name: "Sunny", label: "Sunny the Puppy", icon: "🐶", accent: "#fbbf24" },
  { id: "milo", name: "Milo", label: "Milo the Cat", icon: "🐱", accent: "#60a5fa" },
  { id: "willow", name: "Willow", label: "Willow the Bunny", icon: "🐰", accent: "#f472b6" },
  { id: "ember", name: "Ember", label: "Ember the Lion", icon: "🦁", accent: "#fb7185" },
  { id: "sage", name: "Sage", label: "Sage the Owl", icon: "🦉", accent: "#34d399" },
];

const MOODS = [
  { id: "happy", label: "Happy" },
  { id: "calm", label: "Calm" },
  { id: "stressed", label: "Stressed" },
  { id: "anxious", label: "Anxious" },
  { id: "sad", label: "Sad" },
  { id: "tired", label: "Tired" },
  { id: "overwhelmed", label: "Overwhelmed" },
  { id: "angry", label: "Frustrated" },
];

const STORAGE_KEYS = {
  profile: "moodipet.profile.v1",
  logs: "moodipet.logs.v1",
  settings: "moodipet.settings.v1",
};

function loadLocal(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (e) {
    return fallback;
  }
}
function saveLocal(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore
  }
}

function classNames(...a) {
  return a.filter(Boolean).join(" ");
}

function useInterval(callback, delay) {
  useEffect(() => {
    if (typeof delay !== "number") return;
    const id = setInterval(callback, delay);
    return () => clearInterval(id);
  }, [callback, delay]);
}

function formatTime(ts) {
  const d = new Date(ts);
  return d.toLocaleString();
}

// ------------------------------------------------------------
// Pet personalities & responses
// ------------------------------------------------------------
function personaLine(petId, mood) {
  const L = {
    sunny: {
      default: "*tail wags* I’m right here with you.",
      happy: "*zoomies* I'm so proud of this spark!",
      sad: "I’ll sit right next to you. We can breathe together.",
      anxious: "Let’s do 4 slow sniffs in… and out… with me 🐶",
    },
    milo: {
      default: "*purrs softly* We’ll go at your pace.",
      happy: "I see you shining. Keep savoring it.",
      sad: "Curl up here. Rest is allowed.",
      anxious: "Let’s unclench the jaw and drop the shoulders together.",
    },
    willow: {
      default: "*little nose wiggle* Small steps count.",
      happy: "Your joy looks lovely on you.",
      sad: "We’ll be gentle today. One tiny hop at a time.",
      anxious: "Hand on heart, hand on belly—feel the calm returning.",
    },
    ember: {
      default: "Your courage is still here.",
      happy: "You’re on a roll. Own it.",
      sad: "Storms pass. Your strength remains.",
      anxious: "Breathe like a lion: deep, steady, powerful.",
    },
    sage: {
      default: "*hoot* Wisdom whispers when we slow down.",
      happy: "Notice what created this feeling—let’s repeat it.",
      sad: "Feelings are messages, not verdicts.",
      anxious: "What’s one tiny thing within your control right now?",
    },
  };
  const set = L[petId] || L.sunny;
  return set[mood] || set.default;
}

const RESPONSE_BANK = {
  happy: [
    "I’m smiling with you—let’s bookmark what made today feel good.",
    "Savor this. Your system deserves moments of ease.",
  ],
  calm: [
    "Peace looks good on you. Let’s protect it with gentle boundaries.",
    "Your nervous system is settling—that’s real progress.",
  ],
  stressed: [
    "Okay. One thing at a time. What’s the *next tiny task*?",
    "Let’s take a 30–60s reset: inhale 4, hold 4, exhale 6.",
  ],
  anxious: [
    "You are safe in this moment. Thoughts aren’t facts.",
    "Let’s name 3 things you see, 2 you can touch, 1 you can hear.",
  ],
  sad: [
    "I’m here. Your feelings make sense to me.",
    "Nothing to fix right now—only to feel, gently and slowly.",
  ],
  tired: [
    "Rest is productive. What would 10 minutes of soft rest look like?",
    "You’ve carried a lot. Permission to pause.",
  ],
  overwhelmed: [
    "We can shrink the day: choose one must-do, one nice-to-do.",
    "You don’t have to hold everything at once. Let’s set one boundary.",
  ],
  angry: [
    "Your ‘no’ is wise. Let’s channel it into one clear sentence.",
    "It’s okay to feel heat—movement helps. Shake it out for 20 seconds?",
  ],
};

function makeResponse(petId, mood, text) {
  const base = RESPONSE_BANK[mood] || [
    "I’m here with you.",
    "Let’s take this gently.",
  ];

  const snippet = (text || "").trim().slice(0, 120);
  const echo = snippet
    ? `I heard: “${snippet}${text.length > 120 ? "…" : ""}”. Thank you for trusting me.`
    : undefined;

  const persona = personaLine(petId, mood);
  const pick = base[Math.floor(Math.random() * base.length)];

  return [persona, pick, echo].filter(Boolean).join(" \n\n");
}

// ------------------------------------------------------------
// Main App
// ------------------------------------------------------------
export default function MoodiPetApp() {
  const [view, setView] = useState("select"); // select | home | history
  const [profile, setProfile] = useState(() => loadLocal(STORAGE_KEYS.profile, { petId: "sunny", petName: "Sunny" }));
  const [settings, setSettings] = useState(() => loadLocal(STORAGE_KEYS.settings, { widget: true }));
  const [logs, setLogs] = useState(() => loadLocal(STORAGE_KEYS.logs, []));

  const pet = useMemo(() => PETS.find(p => p.id === profile.petId) || PETS[0], [profile.petId]);

  useEffect(() => saveLocal(STORAGE_KEYS.profile, profile), [profile]);
  useEffect(() => saveLocal(STORAGE_KEYS.settings, settings), [settings]);
  useEffect(() => saveLocal(STORAGE_KEYS.logs, logs), [logs]);

  // Idle movement within container using percentages
  const [pos, setPos] = useState({ x: 42, y: 55 });
  useInterval(() => {
    setPos(prev => {
      const nx = Math.max(8, Math.min(92, prev.x + (Math.random() * 36 - 18)));
      const ny = Math.max(20, Math.min(86, prev.y + (Math.random() * 30 - 15)));
      return { x: nx, y: ny };
    });
  }, view === "home" ? 2400 : null);

  // Check-in state
  const [mood, setMood] = useState(null);
  const [entry, setEntry] = useState("");
  const [reply, setReply] = useState("");

  function submitCheckIn(m) {
    const chosen = m || mood || "calm";
    const res = makeResponse(profile.petId, chosen, entry);
    setReply(res);
    const log = {
      ts: Date.now(),
      petId: profile.petId,
      petName: profile.petName,
      mood: chosen,
      text: entry,
      response: res,
    };
    setLogs(prev => [log, ...prev].slice(0, 500));
    setEntry("");
    setMood(null);
  }

  function resetAll() {
    if (confirm("Reset all local data?")) {
      setLogs([]);
      setProfile({ petId: "sunny", petName: "Sunny" });
      setSettings({ widget: true });
      setView("select");
    }
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-rose-50 to-sky-50 text-slate-800">
      <style>{`
        @keyframes floaty { 0%{ transform: translate(-50%, -50%) translateY(0);} 50%{ transform: translate(-50%, -50%) translateY(-8px);} 100%{ transform: translate(-50%, -50%) translateY(0);} }
        .floaty { animation: floaty 3s ease-in-out infinite; }
        .glass { backdrop-filter: blur(10px); background: rgba(255,255,255,0.6); }
      `}</style>

      {/* Top Bar */}
      <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-3 bg-white/70 border-b border-white/60">
        <div className="flex items-center gap-3">
          <span className="text-2xl" aria-hidden>{pet.icon}</span>
          <div>
            <div className="font-semibold">MoodiPet</div>
            <div className="text-xs text-slate-500">A cozy companion for your feelings</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setView("home")} className={classNames("px-3 py-1.5 rounded-lg text-sm", view === "home" ? "bg-slate-900 text-white" : "bg-white border")}>Home</button>
          <button onClick={() => setView("history")} className={classNames("px-3 py-1.5 rounded-lg text-sm", view === "history" ? "bg-slate-900 text-white" : "bg-white border")}>History</button>
          <button onClick={() => setView("select")} className={classNames("px-3 py-1.5 rounded-lg text-sm", view === "select" ? "bg-slate-900 text-white" : "bg-white border")}>Pet</button>
        </div>
      </div>

      {/* Views */}
      {view === "select" && (
        <div className="max-w-3xl mx-auto p-6">
          <h1 className="text-2xl font-semibold mb-4">Choose your companion</h1>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {PETS.map(p => (
              <button
                key={p.id}
                onClick={() => setProfile(prev => ({ ...prev, petId: p.id, petName: p.name }))}
                className={classNames(
                  "rounded-2xl p-4 border text-left hover:shadow-md transition bg-white",
                  profile.petId === p.id && "ring-2 ring-slate-900"
                )}
                style={{ borderColor: p.accent + "66" }}
              >
                <div className="flex items-center gap-3">
                  <div className="text-4xl">{p.icon}</div>
                  <div>
                    <div className="font-semibold">{p.label}</div>
                    <div className="text-xs text-slate-500">{personaLine(p.id, "default")}</div>
                  </div>
                </div>
              </button>
            ))}
          </div>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl p-4 border">
              <label className="text-sm font-medium">Pet name</label>
              <input
                className="mt-2 w-full rounded-xl border px-3 py-2"
                value={profile.petName}
                onChange={(e) => setProfile(prev => ({ ...prev, petName: e.target.value }))}
              />
              <p className="text-xs text-slate-500 mt-2">Tip: a short, soft name feels extra cozy.</p>
            </div>
            <div className="bg-white rounded-2xl p-4 border">
              <label className="text-sm font-medium">Mini widget</label>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-sm text-slate-600">Show floating widget pet</span>
                <button
                  onClick={() => setSettings(prev => ({ ...prev, widget: !prev.widget }))}
                  className={classNames("px-3 py-1.5 rounded-lg text-sm", settings.widget ? "bg-slate-900 text-white" : "bg-white border")}
                >{settings.widget ? "On" : "Off"}</button>
              </div>
              <p className="text-xs text-slate-500 mt-2">Simulates a home-screen widget inside the app preview.</p>
            </div>
          </div>

          <div className="mt-6 flex gap-3">
            <button onClick={() => setView("home")} className="px-4 py-2 rounded-xl bg-slate-900 text-white">Go to Home</button>
            <button onClick={resetAll} className="px-4 py-2 rounded-xl border">Reset</button>
          </div>
        </div>
      )}

      {view === "home" && (
        <div className="max-w-4xl mx-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Pet Habitat */}
            <div className="relative rounded-3xl h-[420px] overflow-hidden border bg-gradient-to-b from-white/80 to-white/60">
              {/* soft room */}
              <div className="absolute inset-0" aria-hidden={true}>
                <svg width="100%" height="100%">
                  <defs>
                    <linearGradient id="floor" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="#ffffff" stopOpacity="0" />
                      <stop offset="100%" stopColor="#e2e8f0" stopOpacity="0.7" />
                    </linearGradient>
                  </defs>
                  {/* simple floor */}
                  <rect x="0" y="300" width="100%" height="140" fill="url(#floor)" />
                </svg>
              </div>

              {/* Pet */}
              <div
                className="absolute floaty text-6xl select-none"
                style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                title={`${profile.petName} (${pet.label})`}
              >
                <span>{pet.icon}</span>
              </div>

              {/* nameplate */}
              <div className="absolute left-4 top-4 glass rounded-2xl px-3 py-2 border">
                <div className="text-xs text-slate-500">Your companion</div>
                <div className="font-semibold">{profile.petName}</div>
              </div>
            </div>

            {/* Check-in */}
            <div className="bg-white rounded-3xl border p-4 lg:p-6">
              <h2 className="text-lg font-semibold mb-3">How are you feeling?</h2>
              <div className="flex flex-wrap gap-2 mb-3">
                {MOODS.map(m => (
                  <button
                    key={m.id}
                    onClick={() => setMood(m.id)}
                    className={classNames(
                      "px-3 py-1.5 rounded-xl border text-sm",
                      mood === m.id ? "bg-slate-900 text-white" : "bg-white"
                    )}
                  >{m.label}</button>
                ))}
              </div>

              <label className="text-sm font-medium">Want to share more?</label>
              <textarea
                className="mt-2 w-full rounded-xl border p-3 min-h-[96px]"
                placeholder={`Type to vent privately. ${profile.petName} will listen…`}
                value={entry}
                onChange={(e) => setEntry(e.target.value)}
              />

              <div className="mt-3 flex items-center gap-3">
                <button onClick={() => submitCheckIn()} className="px-4 py-2 rounded-xl bg-slate-900 text-white">Check in</button>
                <button onClick={() => { setEntry(""); setMood(null); setReply(""); }} className="px-4 py-2 rounded-xl border">Clear</button>
              </div>

              {reply && (
                <div className="mt-4 p-4 rounded-2xl bg-amber-50 border border-amber-200 whitespace-pre-line">
                  <div className="text-sm font-semibold mb-1">{profile.petName} says:</div>
                  <div className="text-sm leading-relaxed">{reply}</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {view === "history" && (
        <div className="max-w-3xl mx-auto p-6">
          <h2 className="text-lg font-semibold mb-3">Your check-ins</h2>
          {!logs.length && (
            <div className="p-4 rounded-2xl border bg-white">No check-ins yet. When you log a mood, it’ll show up here.</div>
          )}
          <ul className="space-y-3">
            {logs.map((l, idx) => (
              <li key={idx} className="rounded-2xl border bg-white p-4">
                <div className="text-xs text-slate-500">{formatTime(l.ts)} • {l.mood}</div>
                {l.text && <div className="mt-2 text-sm text-slate-700">{l.text}</div>}
                <div className="mt-2 text-sm whitespace-pre-line"><span className="font-semibold">{l.petName}:</span> {"\n"}{l.response}</div>
              </li>
            ))}
          </ul>
          {!!logs.length && (
            <div className="mt-4 flex gap-3">
              <button
                className="px-4 py-2 rounded-xl border"
                onClick={() => {
                  const blob = new Blob([JSON.stringify(logs, null, 2)], { type: "application/json" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url; a.download = "moodipet-journal.json"; a.click(); URL.revokeObjectURL(url);
                }}
              >Export JSON</button>
              <button className="px-4 py-2 rounded-xl border" onClick={() => { if (confirm("Delete all history?")) setLogs([]); }}>Clear History</button>
            </div>
          )}
        </div>
      )}

      {/* Widget bubble */}
      {settings.widget && (
        <WidgetBubble
          pet={pet}
          petName={profile.petName}
          onQuickCheck={(m) => { setView("home"); setMood(m); submitCheckIn(m); }}
        />
      )}

      {/* Footer note */}
      <div className="max-w-4xl mx-auto px-6 pb-10 text-center text-xs text-slate-500">
        MoodiPet is a wellbeing companion, not a medical device. If you’re in crisis, contact local support services.
      </div>
    </div>
  );
}

// ------------------------------------------------------------
// Widget Bubble
// ------------------------------------------------------------
function WidgetBubble({ pet, petName, onQuickCheck }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="relative">
        {open && (
          <div className="absolute bottom-16 right-0 w-64 p-3 rounded-2xl border bg-white shadow-lg">
            <div className="text-xs text-slate-500 mb-2">Quick mood with {petName}</div>
            <div className="flex flex-wrap gap-1.5">
              {MOODS.slice(0, 6).map(m => (
                <button key={m.id} onClick={() => { setOpen(false); onQuickCheck(m.id); }} className="px-2.5 py-1 rounded-lg border text-xs">{m.label}</button>
              ))}
            </div>
          </div>
        )}

        <button
          className="w-14 h-14 rounded-full border shadow-lg bg-white flex items-center justify-center text-2xl"
          title={`${petName} widget`}
          onClick={() => setOpen(v => !v)}
          style={{ borderColor: pet.accent + "66" }}
        >
          <span className="select-none">{pet.icon}</span>
        </button>
      </div>
    </div>
  );
}

// ------------------------------------------------------------
// Dev-time sanity checks (lightweight "tests")
// These run only in dev builds and help catch regressions without a test runner.
// ------------------------------------------------------------
if (typeof window !== "undefined" && process.env.NODE_ENV !== "production") {
  // personaLine returns a non-empty string for known pets
  console.assert(typeof personaLine("sunny", "happy") === "string" && personaLine("sunny", "happy").length > 0, "personaLine should return a string");
  console.assert(typeof personaLine("milo", "sad") === "string", "personaLine should support other pets");

  // makeResponse should include persona and a supportive line
  const r = makeResponse("sunny", "anxious", "Feeling jittery about a deadline");
  console.assert(typeof r === "string" && r.includes("\n\n"), "makeResponse should produce multi-part text");
}

/* ------------------------------------------------------------
  PWA SETUP — Instructions ONLY (do not paste into this file)
  Create separate files in your project as shown below.

  1) public/manifest.json
  {
    "name": "MoodiPet",
    "short_name": "MoodiPet",
    "start_url": "/",
    "scope": "/",
    "display": "standalone",
    "background_color": "#ffffff",
    "theme_color": "#0f172a",
    "description": "A cozy companion for your feelings — MoodiPet.",
    "icons": [
      { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
      { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" },
      { "src": "/icons/maskable-192.png", "sizes": "192x192", "type": "image/png", "purpose": "maskable" },
      { "src": "/icons/maskable-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
    ]
  }

  2) public/sw.js
  const CACHE_NAME = "moodipet-cache-v1";
  const CORE_ASSETS = ["/", "/index.html", "/manifest.json"]; 
  self.addEventListener("install", (event) => {
    event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS)));
    self.skipWaiting();
  });
  self.addEventListener("activate", (event) => {
    event.waitUntil(caches.keys().then((keys) => Promise.all(keys.map((k) => (k !== CACHE_NAME ? caches.delete(k) : null)))));
    self.clients.claim();
  });
  self.addEventListener("fetch", (event) => {
    const req = event.request;
    event.respondWith(
      fetch(req)
        .then((res) => { const resClone = res.clone(); caches.open(CACHE_NAME).then((cache) => cache.put(req, resClone)); return res; })
        .catch(() => caches.match(req).then((cached) => cached || new Response("Offline", { status: 200 })))
    );
  });

  3) src/registerServiceWorker.ts (or .js)
  export function registerServiceWorker() {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker.register("/sw.js").catch((err) => console.error("SW registration failed", err));
      });
    }
  }

  4) In your app entry (src/main.tsx or src/index.tsx)
  import React from "react";
  import ReactDOM from "react-dom/client";
  import MoodiPetApp from "./MoodiPetApp";
  import { registerServiceWorker } from "./registerServiceWorker";
  ReactDOM.createRoot(document.getElementById("root")).render(
    <React.StrictMode>
      <MoodiPetApp />
    </React.StrictMode>
  );
  registerServiceWorker();

  5) Add to public/index.html <head>
    <link rel="manifest" href="/manifest.json" />
    <meta name="theme-color" content="#0f172a" />
    <link rel="apple-touch-icon" href="/icons/icon-192.png" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
    <meta name="mobile-web-app-capable" content="yes" />

  6) Icons (in /public/icons)
    - icon-192.png, icon-512.png
    - maskable-192.png, maskable-512.png (with ~20% padding)

  Notes: Serve over HTTPS. Android: ⋮ → Install App. iOS Safari: Share → Add to Home Screen.
------------------------------------------------------------ */
