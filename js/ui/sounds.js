/* ============================================================
   UI / SOUNDS.JS — локальный звуковой движок Release 2.0.
   Пять встроенных OGG-эмбиентов + Web Audio для коротких SFX и fallback.
   Только локальные ресурсы; запуск аудио — после действия игрока.
   ============================================================ */
let _audioCtx = null;
let _audioMaster = null;
let _musicGain = null;
let _musicNodes = [];
let _musicOscillators = [];
let _soundContext = "menu";
let _ambientStarted = false;
let _musicLfo = null;
let _musicTexture = null;
let _lastSoundAt = Object.create(null);
// RELEASE 2.0: bundled, context-aware loop tracks. Audio files are local OGG;
// the Web Audio drone remains as a quiet fallback if the browser cannot play them.
const _ambientTracks = Object.freeze({
  archive: "assets/audio/imperial-archive.ogg",
  hive: "assets/audio/hive-industrial.ogg",
  cathedral: "assets/audio/cathedral-crypt.ogg",
  warp: "assets/audio/warp-disturbance.ogg",
  combat: "assets/audio/combat-underscore.ogg"
});
let _ambientAudio = null;
let _ambientTrackKey = "";
let _ambientUnlocked = false;
let _ambientTrackPlaying = false;
let _ambientTransitionTimer = null;
let _ambientTransitionFrom = null;
let _ambientTransitionGeneration = 0;

function _setting(key, fallback) {
  try { const v = typeof getSetting === "function" ? getSetting(key) : undefined; return v === undefined ? fallback : v; }
  catch (_) { return fallback; }
}
function _clamp01(v) { v = Number(v); return Number.isFinite(v) ? Math.max(0, Math.min(1, v)) : 0; }
function _audioAvailable() { return typeof window !== "undefined" && (window.AudioContext || window.webkitAudioContext); }
function initAudio(userGesture = false) {
  if (!_audioAvailable()) return false;
  try {
    if (!_audioCtx) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      _audioCtx = new Ctx();
      _audioMaster = _audioCtx.createGain();
      _audioMaster.gain.value = 0;
      _audioMaster.connect(_audioCtx.destination);
      _musicGain = _audioCtx.createGain();
      _musicGain.gain.value = 0;
      _musicGain.connect(_audioMaster);
      _startAmbient();
    }
    if (_audioCtx.state === "suspended") { const resumePromise = _audioCtx.resume(); if (resumePromise && typeof resumePromise.catch === "function") resumePromise.catch(() => {}); }
    if (userGesture) {
      _ambientUnlocked = true;
      _transitionAmbientTrack(_resolveAmbientTrack());
    }
    updateSoundSettings();
    return true;
  } catch (e) { console.warn("[Audio] Звук недоступен в этом браузере:", e); return false; }
}
function _startAmbient() {
  if (!_audioCtx || _ambientStarted) return;
  _ambientStarted = true;
  // Низкий индустриальный дрон с очень медленной модуляцией, без таймеров.
  [49, 73.42, 98].forEach((freq, i) => {
    const osc = _audioCtx.createOscillator();
    const gain = _audioCtx.createGain();
    const filter = _audioCtx.createBiquadFilter();
    osc.type = i === 1 ? "triangle" : "sine";
    osc.frequency.value = freq;
    filter.type = "lowpass"; filter.frequency.value = i === 2 ? 360 : 210;
    gain.gain.value = [0.09, 0.035, 0.018][i];
    const tremolo = _audioCtx.createGain(); tremolo.gain.value = 0.72;
    const lfo = _audioCtx.createOscillator(); const lfoGain = _audioCtx.createGain();
    lfo.type = "sine"; lfo.frequency.value = [0.07,0.11,0.045][i]; lfoGain.gain.value = 0.22;
    lfo.connect(lfoGain); lfoGain.connect(tremolo.gain); osc.connect(filter); filter.connect(gain); gain.connect(tremolo); tremolo.connect(_musicGain);
    osc.start(); lfo.start(); _musicNodes.push(osc, gain, filter, tremolo, lfo, lfoGain); _musicOscillators.push(osc);
  });
  // Тихая «машинная» фактура: полосовой шум с медленным движением фильтра вместо одного ровного гула.
  try {
    const length = Math.floor(_audioCtx.sampleRate * 2);
    const buffer = _audioCtx.createBuffer(1, length, _audioCtx.sampleRate); const data = buffer.getChannelData(0);
    let last = 0; for (let i=0;i<length;i++){ const white=Math.random()*2-1; last=(last+0.018*white)/1.018; data[i]=last*3.5; }
    const noise = _audioCtx.createBufferSource(); noise.buffer=buffer; noise.loop=true;
    const band = _audioCtx.createBiquadFilter(); band.type="bandpass"; band.frequency.value=240; band.Q.value=0.65;
    const textureGain = _audioCtx.createGain(); textureGain.gain.value=0.018;
    const sweep = _audioCtx.createOscillator(); const sweepGain=_audioCtx.createGain(); sweep.frequency.value=0.035; sweepGain.gain.value=100;
    sweep.connect(sweepGain); sweepGain.connect(band.frequency); noise.connect(band); band.connect(textureGain); textureGain.connect(_musicGain); noise.start(); sweep.start();
    _musicNodes.push(noise,band,textureGain,sweep,sweepGain); _musicTexture=noise; _musicLfo=sweep;
  } catch (_) {}
}
function _contextMuted() {
  if (!_setting("soundMaster", true) || !_setting("soundMusic", true)) return true;
  if (_soundContext === "cutscene" && (!_setting("soundInCutscenes", true) || _setting("muteMusicInCutscenes", false))) return true;
  if (_soundContext === "combat" && _setting("muteMusicInCombat", false)) return true;
  if (_soundContext === "menu" && !_setting("soundInMenu", true)) return true;
  if (_soundContext === "story" && !_setting("soundInStory", true)) return true;
  if (_soundContext === "combat" && !_setting("soundInCombat", true)) return true;
  return false;
}
function _resolveAmbientTrack() {
  if (_soundContext === "combat") return "combat";
  const state = typeof GAME !== "undefined" && GAME ? GAME : {};
  const scenario = String(state.campaign?.scenarioId || "").toLowerCase();
  const scene = String(state.campaign?.sceneId || "").toLowerCase();
  const loc = String(state.character?.location || state.world?.current || "").toLowerCase();
  if (/warp|resonance|heart|varp|варп|сердц/.test(scenario + " " + scene + " " + loc)) return "warp";
  if (/catacomb|crypt|temple|cathedral|храм|собор|катакомб|запечатан|подзем/.test(loc + " " + scene)) return "cathedral";
  if (/archive|dossier|chancell|inquis|архив|досье|канцеляр|инквиз/.test(loc + " " + scene) || _soundContext === "menu") return "archive";
  return "hive";
}
function _ambientTargetVolume() {
  if (_contextMuted()) return 0;
  const master = _setting("soundMaster", true) ? _clamp01(_setting("soundMasterVolume", 0.65)) : 0;
  const music = _clamp01(_setting("soundMusicVolume", 0.18));
  return _clamp01(master * music * 1.85);
}
function _disposeAmbientPlayer(player) {
  if (!player) return;
  try { player.pause(); player.removeAttribute("src"); player.load(); } catch (_) {}
}
function _transitionAmbientTrack(trackKey) {
  if (!_ambientUnlocked || typeof Audio === "undefined" || !_ambientTracks[trackKey]) return false;
  if (_ambientAudio && _ambientTrackKey === trackKey) {
    if (!_contextMuted() && _ambientAudio.paused) { try { const p = _ambientAudio.play(); if (p?.catch) p.catch(() => {}); } catch (_) {} }
    _ambientAudio.volume = _ambientTargetVolume();
    return true;
  }
  const generation = ++_ambientTransitionGeneration;
  if (_ambientTransitionTimer) { clearInterval(_ambientTransitionTimer); _ambientTransitionTimer = null; }
  if (_ambientTransitionFrom && _ambientTransitionFrom !== _ambientAudio) _disposeAmbientPlayer(_ambientTransitionFrom);
  const previous = _ambientAudio;
  _ambientTransitionFrom = previous;
  const next = new Audio();
  next.src = _ambientTracks[trackKey]; next.loop = true; next.preload = "auto"; next.volume = 0;
  next.setAttribute("aria-hidden", "true");
  const started = () => {
    if (generation !== _ambientTransitionGeneration) { _disposeAmbientPlayer(next); return; }
    _ambientAudio = next; _ambientTrackKey = trackKey; _ambientTrackPlaying = true;
    const duration = 900, startedAt = Date.now(), startVol = previous ? previous.volume : 0;
    if (_ambientTransitionTimer) clearInterval(_ambientTransitionTimer);
    _ambientTransitionTimer = setInterval(() => {
      if (generation !== _ambientTransitionGeneration) { clearInterval(_ambientTransitionTimer); _ambientTransitionTimer = null; return; }
      const t = Math.min(1, (Date.now() - startedAt) / duration);
      next.volume = _clamp01(startVol * (1 - t) + _ambientTargetVolume() * t);
      if (previous) previous.volume = _clamp01(startVol * (1 - t));
      if (t >= 1) {
        clearInterval(_ambientTransitionTimer); _ambientTransitionTimer = null;
        if (previous && previous !== next) _disposeAmbientPlayer(previous);
        _ambientTransitionFrom = null;
        updateSoundSettings();
      }
    }, 45);
  };
  try {
    const promise = next.play();
    if (promise && typeof promise.then === "function") promise.then(started).catch(() => {
      if (generation === _ambientTransitionGeneration) {
        _ambientTrackPlaying = false;
        _ambientTransitionFrom = null;
        _disposeAmbientPlayer(next);
        // A failed local file/autoplay does not break gameplay; keep the WebAudio fallback.
      }
    });
    else started();
    return true;
  } catch (_) { _ambientTrackPlaying = false; _ambientTransitionFrom = null; _disposeAmbientPlayer(next); return false; }
}
function updateSoundSettings() {
  if (!_audioCtx || !_audioMaster || !_musicGain) return;
  const now = _audioCtx.currentTime;
  const master = _setting("soundMaster", true) ? _clamp01(_setting("soundMasterVolume", 0.65)) : 0;
  const music = _contextMuted() ? 0 : master * _clamp01(_setting("soundMusicVolume", 0.18));
  _audioMaster.gain.cancelScheduledValues(now);
  _audioMaster.gain.setTargetAtTime(master, now, 0.04);
  _musicGain.gain.cancelScheduledValues(now);
  _musicGain.gain.setTargetAtTime(music * (_ambientTrackPlaying ? 0.16 : 1), now, 0.25);
  if (_ambientAudio) {
    const volume = _ambientTargetVolume();
    _ambientAudio.volume = volume;
    if (volume <= 0.001) { /* Keep the track paused while user has muted music. */ try { _ambientAudio.pause(); } catch (_) {} }
    else if (_ambientUnlocked && _ambientAudio.paused) { try { const p = _ambientAudio.play(); if (p?.catch) p.catch(() => {}); } catch (_) {} }
  }
}
function setSoundContext(context) {
  _soundContext = ["menu", "story", "combat", "cutscene"].includes(context) ? context : "story";
  if (_audioCtx && _musicOscillators.length) {
    const voicings = { menu:[55,82.41,110], story:[49,73.42,98], combat:[65.41,97.99,130.81], cutscene:[41.2,61.74,82.41] };
    const notes = voicings[_soundContext] || voicings.story;
    _musicOscillators.forEach((osc,i)=>osc.frequency.setTargetAtTime(notes[i],_audioCtx.currentTime,0.7));
  }
  if (_ambientUnlocked) _transitionAmbientTrack(_resolveAmbientTrack());
  updateSoundSettings();
}
function _allowed(type, critical) {
  if (!_setting("soundMaster", true) || !_setting("soundEffects", true)) return false;
  if (_soundContext === "menu" && !_setting("soundInMenu", true)) return false;
  if (_soundContext === "story" && !_setting("soundInStory", true)) return false;
  if (_soundContext === "combat" && !_setting("soundInCombat", true)) return false;
  if (_soundContext === "cutscene" && !_setting("soundInCutscenes", true)) return false;
  if ((type === "dice" || type === "dice_roll") && !_setting("soundDice", true)) return false;
  if ((type === "cutscene" || type === "terminal_beep" || type === "chapter_hum" || type === "typewriter" || type === "line_appear" || String(type).startsWith("hum_")) && !_setting("soundCutscene", true)) return false;
  if (["ui", "click", "terminal_beep"].includes(type) && !_setting("soundUI", true)) return false;
  if (critical && !_setting("soundCritical", true)) return false;
  return true;
}
function playSound(type, critical = false) {
  if (!_allowed(type, critical) || !initAudio(true)) return false;
  const now = _audioCtx.currentTime;
  const key = String(type || "ui");
  if (_lastSoundAt[key] && now - _lastSoundAt[key] < 0.045) return false;
  _lastSoundAt[key] = now;
  const vol = _clamp01(_setting("soundEffectsVolume", 0.42)) * _clamp01(_setting("soundMasterVolume", 0.65));
  if (!vol) return false;
  const osc = _audioCtx.createOscillator();
  const gain = _audioCtx.createGain();
  const filter = _audioCtx.createBiquadFilter();
  const profiles = {
    dice: [180, 75, "triangle", 0.11], dice_roll: [180, 75, "triangle", 0.11],
    cutscene: [68, 42, "sine", 0.20], chapter_hum: [58, 39, "sine", 0.23],
    hum_docks: [72, 48, "sine", 0.38], hum_catacombs: [45, 31, "triangle", 0.46],
    hum_warp: [118, 38, "sawtooth", 0.34], hum_judgment: [82, 53, "triangle", 0.39],
    hum_gray: [58, 43, "sine", 0.38], hum_new_hive: [64, 40, "triangle", 0.42],
    terminal_beep: [720, 420, "square", 0.075], typewriter: [1100, 760, "square", 0.018],
    line_appear: [440, 620, "sine", 0.055], hit: [130, 48, "sawtooth", 0.14],
    damage: [95, 40, "sawtooth", 0.18], crit: [520, 920, "triangle", 0.22],
    level: [392, 784, "sine", 0.30], ui: [520, 430, "sine", 0.035], click: [520, 430, "sine", 0.035],
    combat: [100, 62, "sawtooth", 0.12], victory: [330, 660, "triangle", 0.32], error: [190, 110, "square", 0.12]
  };
  const p = profiles[key] || profiles.ui;
  osc.type = p[2]; osc.frequency.setValueAtTime(p[0], now); osc.frequency.exponentialRampToValueAtTime(Math.max(25, p[1]), now + p[3]);
  filter.type = "lowpass"; filter.frequency.value = key === "typewriter" ? 2200 : 1500;
  gain.gain.setValueAtTime(Math.max(0.0001, vol * (critical ? 0.7 : 0.35)), now);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + p[3]);
  osc.connect(filter); filter.connect(gain); gain.connect(_audioMaster);
  osc.start(now); osc.stop(now + p[3] + 0.02);
  return true;
}
function toggleSound() {
  const next = !_setting("soundMaster", true);
  if (typeof setSetting === "function") setSetting("soundMaster", next);
  updateSoundSettings(); return next;
}
function updateSoundButton() { return _setting("soundMaster", true); }
function initSounds() { return initAudio(false); }
function stopAmbient() { if (_musicGain && _audioCtx) _musicGain.gain.setTargetAtTime(0, _audioCtx.currentTime, 0.1); }

/* RELEASE 2.0 — subtle narrative cues; these never initialize audio before user interaction. */
let _narrativeSoundBindingsReady = false;
function bindNarrativeSoundEvents(){
  if(_narrativeSoundBindingsReady || typeof Bus === "undefined" || typeof Bus.on !== "function") return;
  _narrativeSoundBindingsReady = true;
  Bus.on("choice_made", () => { if(_audioCtx) playSound("click"); });
  Bus.on("evidence_discovered", () => { if(_audioCtx) playSound("terminal_beep"); });
  Bus.on("quest_completed", () => { if(_audioCtx) playSound("level"); });
  Bus.on("quest_failed", () => { if(_audioCtx) playSound("error", true); });
  Bus.on("player_died", () => { if(_audioCtx) playSound("error", true); });
  Bus.on("scene_entered", () => { if (_ambientUnlocked && _soundContext === "story") _transitionAmbientTrack(_resolveAmbientTrack()); });
  Bus.on("location_changed", () => { if (_ambientUnlocked && _soundContext === "story") _transitionAmbientTrack(_resolveAmbientTrack()); });
}
bindNarrativeSoundEvents();

