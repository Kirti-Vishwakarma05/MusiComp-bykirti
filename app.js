/* ============================================================
   Musicomp — daily CS micro-learning x 5-layer beat builder
   Vanilla JS + Tone.js (CDN). All audio synthesized live on the
   shared Tone.Transport clock — zero external audio files.
   ============================================================ */
"use strict";

/* ---------------- Layer + Track catalog (7-day rotation) ---------------- */
const LAYERS = [
  { key: "kick",   name: "Kick Drum",   short: "KICK",  color: "#ff3864" },
  { key: "hat",    name: "Hi-Hat",      short: "HATS",  color: "#ffc857" },
  { key: "bass",   name: "Bassline",    short: "BASS",  color: "#26d7ff" },
  { key: "chords", name: "Synth Chords",short: "CHORDS",color: "#8a5cff" },
  { key: "lead",   name: "Lead Melody", short: "LEAD",  color: "#2dffb3" },
];

/* Each pattern loop is 1 bar = 16 sixteenth-note steps.
   bass:  [step, note, dur?]   chords: [step, [notes], dur]   lead: [step, note, dur?] */
const TRACKS = [
  { id: 0, name: "Neon Pulse",     genre: "Synthwave",   bpm: 104,
    kick: [0, 8],
    hat:  [0, 2, 4, 6, 8, 10, 12, 14],
    bass: [[0,"A1","16n"],[3,"A1","16n"],[6,"C2","16n"],[8,"A1","16n"],[11,"A1","16n"],[14,"G1","16n"]],
    chords: [[0,["A3","C4","E4"],"2n"],[8,["F3","A3","C4"],"2n"]],
    lead: [[2,"E5","8n"],[5,"C5","8n"],[7,"D5","8n"],[10,"B4","8n"],[12,"A4","8n"],[15,"C5","8n"]] },

  { id: 1, name: "Midnight Funk",  genre: "Funk",        bpm: 98,
    kick: [0, 7, 10],
    hat:  [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15],
    bass: [[0,"E1","16n"],[3,"E2","16n"],[6,"D2","16n"],[8,"G1","16n"],[11,"B1","16n"],[14,"D2","16n"]],
    chords: [[4,["E3","G3","B3"],"16n"],[10,["G3","B3","D4"],"16n"]],
    lead: [[2,"G4","8n"],[5,"B4","8n"],[9,"E4","8n"],[12,"G4","8n"]] },

  { id: 2, name: "Retro Arcade",   genre: "Chiptune",    bpm: 132,
    kick: [0, 4, 8, 12],
    hat:  [2, 6, 10, 14],
    bass: [[0,"C2","16n"],[2,"C2","16n"],[4,"G1","16n"],[6,"G1","16n"],[8,"A1","16n"],[10,"A1","16n"],[12,"F1","16n"],[14,"F1","16n"]],
    chords: [[0,["C4","E4","G4"],"2n"],[8,["A3","C4","E4"],"2n"]],
    lead: [[0,"C5","16n"],[2,"E5","16n"],[4,"G5","16n"],[6,"E5","16n"],[8,"A5","16n"],[10,"G5","16n"],[12,"E5","16n"],[14,"D5","16n"]] },

  { id: 3, name: "Deep Circuit",   genre: "House",       bpm: 126,
    kick: [0, 4, 8, 12],
    hat:  [2, 6, 10, 14],
    bass: [[0,"F1","16n"],[3,"F1","16n"],[6,"A#1","16n"],[8,"F1","16n"],[11,"D#2","16n"],[14,"C2","16n"]],
    chords: [[0,["F3","A#3","C4"],"2n"],[8,["D#3","G3","A#3"],"2n"]],
    lead: [[4,"C4","8n"],[7,"F4","8n"],[10,"A#4","8n"],[13,"G4","8n"]] },

  { id: 4, name: "Lo-Fi Groove",   genre: "Lo-Fi Hip-Hop", bpm: 82,
    kick: [0, 6, 10],
    hat:  [0, 3, 6, 8, 11, 14],
    bass: [[0,"D1","8n"],[6,"D1","16n"],[10,"A1","8n"]],
    chords: [[2,["D3","F3","A3","C4"],"2d"],[10,["G3","A#3","D4","F4"],"2d"]],
    lead: [[4,"A4","8n"],[12,"F4","8n"],[14,"G4","8n"]] },

  { id: 5, name: "Trap Cascade",   genre: "Trap",        bpm: 140,
    kick: [0, 7, 10],
    hat:  [0,2,3,4,6,8,10,11,12,14,15],
    bass: [[0,"G1","8n"],[4,"G1","16n"],[7,"A#1","8n"],[10,"D2","16n"]],
    chords: [[0,["G3","A#3","D4"],"2n"]],
    lead: [[2,"D5","16n"],[3,"A#4","16n"],[6,"D5","16n"],[8,"F5","8n"],[11,"D5","16n"],[14,"C5","8n"]] },

  { id: 6, name: "Future Bass Drop", genre: "Future Bass", bpm: 150,
    kick: [0, 10],
    hat:  [0, 2, 4, 6, 8, 10, 12, 14],
    bass: [[0,"A#1","8n"],[10,"F1","16n"]],
    chords: [[0,["A#3","D4","F4"],"2n"],[8,["G3","A#3","D4"],"2n"],[12,["F3","A3","C4"],"4n"]],
    lead: [[0,"D5","16n"],[3,"F5","16n"],[6,"A#5","16n"],[8,"A5","8n"],[11,"F5","16n"],[13,"D5","16n"]] },
];

/* ---------------- Question bank: 1000+ fundamentals ----------------
   questions.js exposes window.QUESTION_BANK (flat array of {cat,q,opts,a}).
   Beats draw 5 consecutive cards from a category-interleaved deck, so every
   beat mixes 5 different topics. state.cursor persists: no card repeats
   until the whole bank has been seen (then a new "mastery lap" begins). */
const BANK = Array.isArray(window.QUESTION_BANK) ? window.QUESTION_BANK : [];

function hashStr(s){let h=2166136261>>>0;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)>>>0;}return h>>>0;}
function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
function shuffleArr(arr, rng){ for (let i=arr.length-1;i>0;i--){ const j=Math.floor(rng()*(i+1)); [arr[i],arr[j]]=[arr[j],arr[i]]; } return arr; }

/* Round-robin interleave by category: consecutive cards never share a topic
   (while more than one category still has cards left in the rotation). */
function buildDeck(bank, lap){
  const groups = {};
  bank.forEach((q, i) => { (groups[q.cat] = groups[q.cat] || []).push(i); });
  const keys = Object.keys(groups);
  const rng = mulberry32(hashStr("deck|lap" + lap));
  keys.forEach(k => shuffleArr(groups[k], rng));
  const order = [];
  while (order.length < bank.length)
    keys.forEach(k => { if (groups[k].length) order.push(groups[k].shift()); });
  return order;
}
let DECK = buildDeck(BANK, 0);

function setNumber() { return Math.floor(state.cursor / 5) + 1; }

function beatQuestions() {
  if (!BANK.length) return [];
  /* Start the next mastery lap as soon as fewer than 5 cards remain,
     so every beat is a full 5-layer unlock. */
  if (state.cursor + 5 > DECK.length) {
    state.cursor = 0;
    state.lap = (state.lap || 0) + 1;
    DECK = buildDeck(BANK, state.lap); /* fresh order each mastery lap */
    saveState();
    toast("Full bank mastered \u2014 starting mastery lap " + (state.lap + 1) + " \uD83C\uDFB5");
  }
  const idx = [];
  for (let i = 0; i < 5; i++) idx.push(DECK[state.cursor + i]);
  return idx.map(i => Object.assign({ retried: false }, BANK[i]));
}

/* ---------------- Persistence (localStorage) ---------------- */
const LS_KEY = "musicomp_state_v1";

function defaultState() {
  return { streak: 0, lastDate: null, mixtape: [], cursor: 0, lap: 0 }; // mixtape: [{trackId, date}]
}
function loadState() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return defaultState();
    const s = JSON.parse(raw);
    if (typeof s.streak !== "number" || !Array.isArray(s.mixtape)) return defaultState();
    if (typeof s.cursor !== "number" || s.cursor < 0) s.cursor = 0;
    if (typeof s.lap !== "number") s.lap = 0;
    return s;
  } catch (e) { return defaultState(); }
}
function saveState() {
  try { localStorage.setItem(LS_KEY, JSON.stringify(state)); } catch (e) { /* private mode */ }
}
let state = loadState();

function dateKey(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
const TODAY = dateKey(new Date());
const YESTERDAY = dateKey(new Date(Date.now() - 86400000));

/* Which of the 7 catalog days is today? (day-of-year rotation) */
function todayTrackIndex() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const doy = Math.floor((now - start) / 86400000);
  return doy % 7;
}

/* ---------------- Audio engine (Tone.js) ----------------
   All 5 layers are synthesized on one shared Tone.Transport clock.
   A single 16n scheduleRepeat callback steps through the pattern and
   triggers whichever layers are audible (active && !muted && solo-gate). */
const LAYER_HITS = {}; // rebuilt per track: { kick:Set, hat:Set, bass:Set, chords:Set, lead:Set }

const Audio = {
  built: false,
  synth: {},
  loopId: null,
  step: 0,
  track: null,
  active: {},           // layer unlocked for playback
  muted: {},            // library mute toggles
  solo: {},             // library solo toggles
  mode: "game",         // "game" | "library"

  resetFlags() {
    LAYERS.forEach(l => { this.active[l.key] = false; this.muted[l.key] = false; this.solo[l.key] = false; });
  },

  async ensure() {
    if (!window.Tone) { toast("Audio library blocked — check your connection/ad-blocker."); return false; }
    try {
      const withTimeout = (p, ms) => Promise.race([p, new Promise(res => setTimeout(() => res("pending"), ms))]);
      if (!this.built) {
        await withTimeout(Tone.start(), 1500);
        if (Tone.context.state !== "running") { this.toastOnce("Tap again to enable audio \uD83C\uDFA7"); return false; }
        this.build();
      } else if (Tone.context.state !== "running") {
        await withTimeout(Tone.start(), 1500);
        if (Tone.context.state !== "running") { this.toastOnce("Tap again to enable audio \uD83C\uDFA7"); return false; }
      }
      return true;
    } catch (e) {
      console.warn("Audio init failed:", e);
      toast("Audio unavailable on this browser.");
      return false;
    }
  },

  toastOnce(msg) {
    const now = Date.now();
    if (now - (this._lastToast || 0) < 4000) return;
    this._lastToast = now;
    toast(msg);
  },

  build() {
    if (this.built) return;
    const limiter = new Tone.Limiter(-2).toDestination();

    // 1. Kick — membrane synth
    const kick = new Tone.MembraneSynth({
      pitchDecay: 0.045, octaves: 6,
      oscillator: { type: "sine" },
      envelope: { attack: 0.001, decay: 0.42, sustain: 0, release: 0.2 },
    });
    kick.volume.value = -4; kick.connect(limiter);

    // 2. Hi-Hat — filtered noise burst
    const hatGain = new Tone.Gain(0.5).connect(limiter);
    const hatFilter = new Tone.Filter(7500, "highpass").connect(hatGain);
    const hat = new Tone.NoiseSynth({
      noise: { type: "white" },
      envelope: { attack: 0.001, decay: 0.05, sustain: 0, release: 0.01 },
    });
    hat.volume.value = -14; hat.connect(hatFilter);

    // 3. Bass — mono synth through a lowpass
    const bassFilter = new Tone.Filter(600, "lowpass").connect(limiter);
    const bass = new Tone.MonoSynth({
      oscillator: { type: "sawtooth" },
      envelope: { attack: 0.01, decay: 0.2, sustain: 0.4, release: 0.2 },
      filterEnvelope: { attack: 0.01, decay: 0.2, sustain: 0.5, release: 0.2, baseFrequency: 90, octaves: 2.2 },
    });
    bass.volume.value = -7; bass.connect(bassFilter);

    // 4. Synth Chords — poly synth with soft detune + reverb send
    const reverb = new Tone.Reverb({ decay: 2.6, wet: 0.28 }).connect(limiter);
    const chordGain = new Tone.Gain(0.9);
    chordGain.connect(limiter); chordGain.connect(reverb);
    const chords = new Tone.PolySynth(Tone.Synth, {
      maxPolyphony: 6,
      oscillator: { type: "fatsawtooth", count: 2, spread: 12 },
      envelope: { attack: 0.02, decay: 0.4, sustain: 0.3, release: 0.8 },
    });
    chords.volume.value = -16; chords.connect(chordGain);

    // 5. Lead — square-ish synth with echo
    const echo = new Tone.FeedbackDelay("8n", 0.22).connect(limiter);
    echo.wet.value = 0.25;
    const leadGain = new Tone.Gain(1);
    leadGain.connect(limiter); leadGain.connect(echo);
    const lead = new Tone.Synth({
      oscillator: { type: "triangle" },
      envelope: { attack: 0.01, decay: 0.2, sustain: 0.25, release: 0.3 },
    });
    lead.volume.value = -10; lead.connect(leadGain);

    this.synth = { kick, hat, bass, chords, lead };
    this.resetFlags();
    this.built = true;
  },

  audible(layerKey) {
    return this.active[layerKey] &&
           !this.muted[layerKey] &&
           (!Object.values(this.solo).some(Boolean) || this.solo[layerKey]);
  },

  indexHits(track) {
    LAYER_HITS.kick   = new Set(track.kick);
    LAYER_HITS.hat    = new Set(track.hat);
    LAYER_HITS.bass   = new Set(track.bass.map(h => h[0]));
    LAYER_HITS.chords = new Set(track.chords.map(h => h[0]));
    LAYER_HITS.lead   = new Set(track.lead.map(h => h[0]));
  },

  /* Load + play a track on the shared transport. */
  playTrack(track) {
    if (!this.built) return;
    this.track = track;
    this.indexHits(track);
    this.step = 0;
    if (this.loopId !== null) { try { Tone.Transport.clear(this.loopId); } catch (e) {} }
    this.loopId = null;
    Tone.Transport.bpm.value = track.bpm;

    this.loopId = Tone.Transport.scheduleRepeat((time) => {
      const s = this.step % 16;
      this.step++;
      const t = this.track;
      if (!t) return;

      if (this.audible("kick") && LAYER_HITS.kick.has(s)) {
        this.synth.kick.triggerAttackRelease("C1", "8n", time);
        this.pulse("kick", time);
      }
      if (this.audible("hat")) {
        if (LAYER_HITS.hat.has(s)) {
          this.synth.hat.triggerAttackRelease("16n", time);
          this.pulse("hat", time);
        }
      }
      if (this.audible("bass")) {
        const hit = t.bass.find(h => h[0] === s);
        if (hit) { this.synth.bass.triggerAttackRelease(hit[1], hit[2] || "16n", time); this.pulse("bass", time); }
      }
      if (this.audible("chords")) {
        const hit = t.chords.find(h => h[0] === s);
        if (hit) { this.synth.chords.triggerAttackRelease(hit[1], hit[2] || "2n", time); this.pulse("chords", time); }
      }
      if (this.audible("lead")) {
        const hit = t.lead.find(h => h[0] === s);
        if (hit) { this.synth.lead.triggerAttackRelease(hit[1], hit[2] || "8n", time); this.pulse("lead", time); }
      }
    }, "16n");

    Tone.Transport.start();
    setTransportUI(true);
  },

  /* Schedule a visual flash roughly when the note is heard. */
  pulse(layerKey, when) {
    const delay = Math.max(0, (when - Tone.now()) * 1000);
    setTimeout(() => flashBar(layerKey), delay);
  },

  pause() {
    if (this.built) Tone.Transport.pause();
    setTransportUI(false);
  },
  resume() {
    if (this.built && this.track) Tone.Transport.start();
    setTransportUI(true);
  },
  stop() {
    if (!this.built) return;
    Tone.Transport.stop();
    setTransportUI(false);
  },
  isPlaying() { return this.built && Tone.Transport.state === "started"; },
};

/* ---------------- DOM refs ---------------- */
const $ = (sel) => document.querySelector(sel);
const el = {
  dayLabel: $("#dayLabel"), trackTitle: $("#trackTitle"), trackMeta: $("#trackMeta"),
  visualizer: $("#visualizer"), layerProgress: $("#layerProgress"), progressCaption: $("#progressCaption"),
  qCategory: $("#qCategory"), retryBadge: $("#retryBadge"), qCount: $("#qCount"),
  qText: $("#qText"), answers: $("#answers"), feedback: $("#feedback"),
  flashcard: $("#flashcard"), quizArea: $("#quizArea"), doneBanner: $("#doneBanner"), doneSub: $("#doneSub"),
  streakCount: $("#streakCount"), streakChip: $("#streakChip"), libCount: $("#libCount"),
  btnLibrary: $("#btnLibrary"), libraryModal: $("#libraryModal"), mixList: $("#mixList"),
  mixPlayer: $("#mixPlayer"), playerTitle: $("#playerTitle"), layerToggles: $("#layerToggles"),
  btnPlayerPlay: $("#btnPlayerPlay"), btnPlayerStop: $("#btnPlayerStop"), btnCloseLibrary: $("#btnCloseLibrary"),
  completeModal: $("#completeModal"), completeTrackName: $("#completeTrackName"),
  streakLine: $("#streakLine"), cassetteDay: $("#cassetteDay"), confetti: $("#confetti"),
  btnKeepListening: $("#btnKeepListening"), btnOpenLibraryDone: $("#btnOpenLibraryDone"),
  btnTransport: $("#btnTransport"), tIcon: $("#tIcon"), tLabel: $("#tLabel"),
  btnPracticeAgain: $("#btnPracticeAgain"), toast: $("#toast"),
};

/* ---------------- Visualizer ---------------- */
const barEls = {};
function buildVisualizer() {
  el.visualizer.innerHTML = "";
  LAYERS.forEach((l, i) => {
    const bar = document.createElement("div");
    bar.className = "vbar";
    bar.dataset.layer = l.key;
    bar.innerHTML =
      `<div class="tube"><span class="num">${i + 1}</span><div class="fill"></div></div>` +
      `<span class="vlabel">${l.short}</span>`;
    el.visualizer.appendChild(bar);
    barEls[l.key] = bar;
  });
}
function flashBar(layerKey) {
  const bar = barEls[layerKey];
  if (!bar || !bar.classList.contains("active")) return;
  const fill = bar.querySelector(".fill");
  const h = 45 + Math.round(Math.random() * 50);
  fill.classList.add("flash");
  fill.style.height = h + "%";
  clearTimeout(fill._t);
  fill._t = setTimeout(() => {
    fill.style.height = "26%";
    setTimeout(() => fill.classList.remove("flash"), 140);
  }, 130);
}
function setBarActive(layerKey, on) {
  const bar = barEls[layerKey];
  if (!bar) return;
  bar.classList.toggle("active", on);
  bar.classList.toggle("idle", on);
  const fill = bar.querySelector(".fill");
  fill.style.height = on ? "26%" : "14%";
}
function renderProgress() {
  el.layerProgress.innerHTML = "";
  for (let i = 0; i < 5; i++) {
    const d = document.createElement("span");
    d.className = "ldot" + (i < game.unlocked ? " on" : "");
    el.layerProgress.appendChild(d);
  }
  el.progressCaption.textContent = `${game.unlocked} of 5 layers unlocked`;
}

/* ---------------- Game state ---------------- */
const game = {
  trackIndex: 0,
  track: null,
  queue: [],        // remaining questions (objects, may include retried marks)
  current: null,
  unlocked: 0,
  busy: false,
  done: false,
};

function newSession() {
  game.queue = beatQuestions();
  game.current = null;
  game.unlocked = 0;
  game.busy = false;
  game.done = false;
  Audio.resetFlags();
  LAYERS.forEach(l => setBarActive(l.key, false));
  renderProgress();
  el.dayLabel.textContent = `Track of the Day \u00B7 Set #${setNumber()} of the bank`;
  updateBankInfo();
  nextQuestion();
}

function nextQuestion() {
  if (game.queue.length === 0) return;
  game.current = game.queue.shift();
  renderQuestion();
}

function renderQuestion() {
  const q = game.current;
  if (!q) return;
  el.qCategory.textContent = q.cat;
  el.qCategory.dataset.cat = q.cat;
  el.retryBadge.classList.toggle("hidden", !q.retried);
  el.qCount.textContent = `Set #${setNumber()} · Q${5 - game.queue.length} / 5`;
  el.qText.textContent = q.q; /* raw text: bank stems contain literal <tag> chars */
  el.feedback.textContent = "";
  el.feedback.className = "feedback";

  el.answers.innerHTML = "";
  q.opts.forEach((opt, i) => {
    const b = document.createElement("button");
    b.className = "ans";
    b.type = "button";
    const key = document.createElement("span");
    key.className = "key";
    key.textContent = "ABCD"[i];
    const label = document.createElement("span");
    label.textContent = opt;
    b.appendChild(key); b.appendChild(label);
    b.addEventListener("click", () => handleAnswer(i, b));
    el.answers.appendChild(b);
  });
}

async function handleAnswer(choiceIdx, btn) {
  if (game.busy || game.done || !game.current) return;
  game.busy = true;

  // First user interaction anywhere: unlock mobile audio.
  const audioOK = await Audio.ensure();

  const q = game.current;
  const buttons = [...el.answers.querySelectorAll(".ans")];
  buttons.forEach(b => (b.disabled = true));

  if (choiceIdx === q.a) {
    btn.classList.add("correct");
    el.feedback.textContent = "Correct! Next layer armed\u2026";
    el.feedback.classList.add("good");

    game.unlocked++;
    const layerKey = LAYERS[game.unlocked - 1].key;
    Audio.active[layerKey] = true;
    setBarActive(layerKey, true);
    renderProgress();

    if (audioOK) {
      Audio.mode = "game";
      Audio.muted = {}; Audio.solo = {};
      if (!Audio.isPlaying()) Audio.playTrack(game.track);
    }

    setTimeout(() => {
      game.busy = false;
      if (game.unlocked >= 5) completeTrack();
      else nextQuestion();
    }, 750);
  } else {
    btn.classList.add("wrong");
    buttons[q.a] && buttons[q.a].classList.add("reveal"); // brief correct-answer tease
    el.feedback.textContent = "Not quite — that question goes back in the shuffle.";
    el.feedback.classList.add("bad");
    el.flashcard.classList.add("shake");
    setTimeout(() => el.flashcard.classList.remove("shake"), 450);

    // Mark + insert randomly back into the remaining queue.
    q.retried = true;
    const pos = Math.floor(Math.random() * (game.queue.length + 1));
    game.queue.splice(pos, 0, q);

    setTimeout(() => {
      buttons.forEach(b => b.classList.remove("reveal"));
      game.busy = false;
      nextQuestion();
    }, 1100);
  }
}

/* ---------------- Completion + streak ---------------- */
function completeTrack() {
  game.done = true;

  /* The 5 cards of this beat are now permanently consumed from the deck. */
  state.cursor += 5;
  saveState();

  const alreadyToday = state.mixtape.some(m => m.trackId === game.trackIndex && m.date === TODAY);

  if (!alreadyToday) {
    // Streak: +1 if last completion was yesterday, reset to 1 otherwise.
    if (state.lastDate === YESTERDAY) state.streak += 1;
    else if (state.lastDate !== TODAY) state.streak = 1;
    state.lastDate = TODAY;
    state.mixtape.push({ trackId: game.trackIndex, date: TODAY });
    saveState();
    el.streakChip.classList.remove("bump");
    void el.streakChip.offsetWidth;
    el.streakChip.classList.add("bump");
  }
  refreshHeader();
  updateBankInfo();

  el.completeTrackName.textContent = game.track.name;
  el.streakLine.innerHTML = alreadyToday
    ? `Bonus beat! Streak already counted today: <b>${state.streak}</b> day${state.streak === 1 ? "" : "s"}`
    : `Streak: <b>${state.streak}</b> day${state.streak === 1 ? "" : "s"} \u2022 saved to your Mixtape Library`;
  el.cassetteDay.textContent = String(game.trackIndex + 1);
  el.quizArea.classList.add("hidden");
  el.doneBanner.classList.remove("hidden");
  el.doneSub.textContent = "Next set: 5 fresh cards from the " + BANK.length.toLocaleString() +
    "-question fundamentals bank" + (alreadyToday ? " (streak counts once per day)" : "") + ".";

  show(el.completeModal);
  spawnConfetti();
}

function spawnConfetti() {
  el.confetti.innerHTML = "";
  const colors = LAYERS.map(l => l.color).concat(["#ffffff"]);
  for (let i = 0; i < 36; i++) {
    const bit = document.createElement("i");
    bit.style.left = Math.random() * 100 + "%";
    bit.style.background = colors[i % colors.length];
    bit.style.animationDuration = (1.6 + Math.random() * 1.8) + "s";
    bit.style.animationDelay = (Math.random() * 0.7) + "s";
    bit.style.transform = `rotate(${Math.random() * 360}deg)`;
    el.confetti.appendChild(bit);
  }
}

/* Footer: bank size + progress across mastery laps. */
function updateBankInfo() {
  const n = document.getElementById("bankInfo");
  if (!n) return;
  const seen = state.lap * BANK.length + Math.min(state.cursor, BANK.length);
  n.textContent = BANK.length.toLocaleString() + "-question bank \u00B7 " + seen.toLocaleString() +
    " cards seen" + (state.lap ? " \u00B7 mastery lap " + (state.lap + 1) : "");
}

/* ---------------- Mixtape Library ---------------- */
let libSelected = null; // trackId currently shown in player

function refreshHeader() {
  el.streakCount.textContent = state.streak;
  el.libCount.textContent = state.mixtape.length;
}

function renderLibrary() {
  el.mixList.innerHTML = "";
  if (state.mixtape.length === 0) {
    el.mixList.innerHTML =
      `<div class="mix-empty"><span class="big">\u25C8</span>No beats yet.<br>Unlock all 5 layers today to record your first mixtape!</div>`;
    el.mixPlayer.classList.add("hidden");
    libSelected = null;
    return;
  }
  // newest first
  [...state.mixtape].reverse().forEach(entry => {
    const t = TRACKS[entry.trackId];
    const item = document.createElement("button");
    item.type = "button";
    item.className = "mix-item" + (libSelected === entry.trackId ? " selected" : "");
    item.innerHTML =
      `<div class="mix-thumb" style="background:linear-gradient(135deg,${LAYERS[entry.trackId % 5].color},${LAYERS[(entry.trackId + 2) % 5].color})">${entry.trackId + 1}</div>` +
      `<div class="mix-info"><div class="mix-name">${t.name}</div>` +
      `<div class="mix-sub">${t.genre} \u2022 ${t.bpm} BPM \u2022 recorded ${entry.date}</div></div>` +
      `<span class="mix-play-hint">\u25B6 Open</span>`;
    item.addEventListener("click", () => selectLibraryTrack(entry.trackId));
    el.mixList.appendChild(item);
  });
}

function selectLibraryTrack(trackId) {
  const t = TRACKS[trackId];
  libSelected = trackId;
  renderLibrary();
  el.mixPlayer.classList.remove("hidden");
  el.playerTitle.textContent = `${t.name} — ${t.genre} · ${t.bpm} BPM`;

  Audio.resetFlags();
  LAYERS.forEach(l => (Audio.active[l.key] = true));

  el.layerToggles.innerHTML = "";
  LAYERS.forEach((l, i) => {
    const row = document.createElement("div");
    row.className = "lt-row";
    row.dataset.layer = l.key;
    row.innerHTML =
      `<span class="lt-dot" style="background:${l.color};box-shadow:0 0 8px ${l.color}"></span>` +
      `<span class="lt-name">${i + 1}. ${l.name}</span>` +
      `<button class="lt-btn" data-mode="mute" title="Mute layer">M</button>` +
      `<button class="lt-btn" data-mode="solo" title="Solo layer">S</button>`;
    row.querySelector('[data-mode="mute"]').addEventListener("click", () => toggleLayerFlag("muted", l.key, row));
    row.querySelector('[data-mode="solo"]').addEventListener("click", () => toggleLayerFlag("solo", l.key, row));
    el.layerToggles.appendChild(row);
  });
  updateLibraryPlayLabel();
}

async function toggleLayerFlag(kind, layerKey, row) {
  await Audio.ensure();
  Audio[kind][layerKey] = !Audio[kind][layerKey];
  syncLayerRows();
  if (Audio.isPlaying()) pulseAllActive(); // immediate visual refresh on toggle
}

function syncLayerRows() {
  [...el.layerToggles.children].forEach(row => {
    const k = row.dataset.layer;
    const mBtn = row.querySelector('[data-mode="mute"]');
    const sBtn = row.querySelector('[data-mode="solo"]');
    mBtn.classList.toggle("on-mute", !!Audio.muted[k]);
    sBtn.classList.toggle("on-solo", !!Audio.solo[k]);
    row.classList.toggle("dimmed", !Audio.audible(k) && Audio.isPlaying());
  });
}

function pulseAllActive() {
  LAYERS.forEach(l => { if (Audio.audible(l.key)) flashBar(l.key); });
  syncLayerRows();
}

async function playerPlay() {
  if (libSelected === null) return;
  const ok = await Audio.ensure();
  if (!ok) return;
  Audio.mode = "library";
  Audio.playTrack(TRACKS[libSelected]);
  syncLayerRows();
  updateLibraryPlayLabel();
}

function updateLibraryPlayLabel() {
  el.btnPlayerPlay.innerHTML = Audio.isPlaying() && Audio.mode === "library"
    ? "\u23F8 Restart beat"
    : "\u25B6 Play full beat";
}

function playerStop() {
  Audio.stop();
  syncLayerRows();
  updateLibraryPlayLabel();
}

/* ---------------- Transport control (main screen) ---------------- */
async function toggleTransport() {
  const ok = await Audio.ensure();
  if (!ok) return;
  if (Audio.isPlaying()) {
    Audio.pause();
  } else if (game.unlocked === 0) {
    toast("Answer a question to arm your first layer!");
    return;
  } else {
    if (Audio.mode === "library") {
      Audio.mode = "game";
      Audio.muted = {}; Audio.solo = {};
      Audio.playTrack(game.track);
    } else {
      Audio.resume();
    }
  }
}

function setTransportUI(playing) {
  el.btnTransport.classList.toggle("playing", playing);
  el.btnTransport.setAttribute("aria-pressed", String(playing));
  el.tIcon.innerHTML = playing ? "&#9632;" : "&#9654;";
  el.tLabel.textContent = playing ? "Stop" : "Play";
}

/* ---------------- Modals + toast ---------------- */
const show = (m) => m.classList.remove("hidden");
const hide = (m) => m.classList.add("hidden");

let toastTimer = null;
function toast(msg) {
  el.toast.textContent = msg;
  el.toast.classList.remove("hidden");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.toast.classList.add("hidden"), 2600);
}

/* ---------------- Wiring ---------------- */
function openLibrary() { renderLibrary(); show(el.libraryModal); }

el.btnLibrary.addEventListener("click", openLibrary);
el.btnCloseLibrary.addEventListener("click", () => { hide(el.libraryModal); });
el.btnPlayerPlay.addEventListener("click", playerPlay);
el.btnPlayerStop.addEventListener("click", playerStop);
el.btnTransport.addEventListener("click", toggleTransport);

el.btnKeepListening.addEventListener("click", () => { hide(el.completeModal); toast("Beat saved to your Mixtape Library \uD83C\uDF9F"); });
el.btnOpenLibraryDone.addEventListener("click", () => {
  hide(el.completeModal);
  openLibrary();
  if (libSelected === null) selectLibraryTrack(game.trackIndex);
});

el.btnPracticeAgain.addEventListener("click", () => {
  hide(el.completeModal);
  el.doneBanner.classList.add("hidden");
  el.quizArea.classList.remove("hidden");
  newSession();
  Audio.stop();
  setTransportUI(false);
});

[el.libraryModal, el.completeModal].forEach(m =>
  m.addEventListener("click", (e) => { if (e.target === m) hide(m); })
);
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") { hide(el.libraryModal); hide(el.completeModal); }
});

/* ---------------- Boot ---------------- */
function boot() {
  buildVisualizer();

  if (!BANK.length) {
    el.qText.textContent = "Question bank failed to load (questions.js missing?).";
    return;
  }
  /* Resume the exact card order of the saved mastery lap. */
  if ((state.lap || 0) !== 0) DECK = buildDeck(BANK, state.lap);

  game.trackIndex = todayTrackIndex();
  game.track = TRACKS[game.trackIndex];

  el.dayLabel.textContent = `Track of the Day \u00B7 Set #${setNumber()} of the bank`;
  el.trackTitle.textContent = game.track.name;
  el.trackMeta.innerHTML =
    `${game.track.genre} <span class="bpm-dot">\u25CF</span> ${game.track.bpm} BPM <span class="bpm-dot">\u25CF</span> 5 layers to unlock \u00B7 ${BANK.length.toLocaleString()}-card bank`;

  refreshHeader();
  updateBankInfo();

  /* With a 1,000+ card bank the daily beat can be replayed all day long:
     every completed set advances the shared deck cursor; the streak and the
     mixtape entry are still granted only once per calendar date. */
  newSession();
}

boot();
