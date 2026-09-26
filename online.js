// Online mode: each player on their own phone, synced through Firebase
// Realtime Database. Loaded lazily, so pass-and-play never depends on it.
//
// Room layout at rooms/<CODE>:
//   host          uid of the host
//   meta          phase (lobby|clue|vote|result), round, packId, difficulty, result
//   players/<uid> name, joinedAt, connected
//   words/<uid>   that player's private word (only they can read it)
//   hostSecret    imposter + words for the round (host-only)
//   clues/<uid>   { text, round }
//   votes/<uid>   uid they voted for
//   scores/<uid>  running points
// The host's phone runs the game: it deals words, advances phases when
// everyone has submitted, tallies votes and awards points.

const ONLINE_MAX_PLAYERS = 8;
const ONLINE_MIN_PLAYERS = 3;
const CODE_LETTERS = "ABCDEFGHJKLMNPQRSTUVWXYZ";
const FIREBASE_SDK = "https://www.gstatic.com/firebasejs/10.14.1/";

function safeGet(store, key) {
  try { return store.getItem(key); } catch (e) { return null; }
}
function safeSet(store, key, value) {
  try {
    if (value === null) store.removeItem(key); else store.setItem(key, value);
  } catch (e) { /* storage unavailable, fine */ }
}

function emptyRoomData() {
  return { hostId: null, meta: null, players: {}, clues: {}, votes: {}, scores: {}, word: null, secret: null };
}

const online = {
  ready: false,
  db: null,
  uid: null,
  code: null,
  isHost: false,
  name: safeGet(localStorage, "wi-name") || "",
  prefillCode: "",
  data: emptyRoomData(),
  listeners: [],
  metaSeen: false,
  secretAttached: false,
  viewKey: "",
  lastTick: "",
  renderTimer: 0
};

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = src;
    s.onload = resolve;
    s.onerror = () => reject(new Error("Online play needs an internet connection."));
    document.head.appendChild(s);
  });
}

async function onlineInit() {
  if (online.ready) return;
  if (typeof firebase === "undefined") {
    await loadScript(FIREBASE_SDK + "firebase-app-compat.js");
    await Promise.all([
      loadScript(FIREBASE_SDK + "firebase-auth-compat.js"),
      loadScript(FIREBASE_SDK + "firebase-database-compat.js")
    ]);
  }
  if (!firebase.apps.length) firebase.initializeApp(FIREBASE_CONFIG);
  const auth = firebase.auth();
  // Per-tab identity, so refreshing keeps you in your room.
  await auth.setPersistence(firebase.auth.Auth.Persistence.SESSION);
  let user = await new Promise((resolve) => {
    const off = auth.onAuthStateChanged((u) => { off(); resolve(u); });
  });
  if (!user) user = (await auth.signInAnonymously()).user;
  online.uid = user.uid;
  online.db = firebase.database();
  online.ready = true;
}

const roomRef = (path) => online.db.ref(`rooms/${online.code}${path ? "/" + path : ""}`);
const serverTime = () => firebase.database.ServerValue.TIMESTAMP;

function roomUpdate(updates) {
  return roomRef().update(updates).catch((err) => {
    console.error(err);
    showToast("Connection problem, try again.");
  });
}

function friendlyError(err) {
  const known = ["Room not found", "That game has already started", "Room is full", "Enter your name first.", "Online play needs", "Couldn't create"];
  if (err && err.message && known.some((k) => err.message.startsWith(k))) return err.message;
  console.error(err);
  return "Couldn't connect. Check your internet and try again.";
}

function cleanName(raw) {
  return String(raw || "").replace(/\s+/g, " ").trim().slice(0, 16);
}

function uniqueName(name, players) {
  const taken = new Set(Object.values(players || {}).map((p) => p.name.toLowerCase()));
  if (!taken.has(name.toLowerCase())) return name;
  for (let n = 2; n < 20; n++) {
    const candidate = `${name.slice(0, 13)} ${n}`;
    if (!taken.has(candidate.toLowerCase())) return candidate;
  }
  return name;
}

function randomCode() {
  let code = "";
  for (let i = 0; i < 4; i++) code += CODE_LETTERS[Math.floor(Math.random() * CODE_LETTERS.length)];
  return code;
}

/* ---------- joining, leaving, listening ---------- */

async function createRoom(name) {
  await onlineInit();
  for (let attempt = 0; attempt < 10; attempt++) {
    const code = randomCode();
    let result;
    try {
      result = await online.db.ref(`rooms/${code}/host`).transaction((cur) => (cur === null ? online.uid : undefined));
    } catch (e) {
      continue;
    }
    if (!result.committed) continue;
    online.code = code;
    await roomRef().update({
      meta: { phase: "lobby", round: 0, packId: state.packId, difficulty: state.difficulty, createdAt: serverTime() },
      [`players/${online.uid}`]: { name, joinedAt: serverTime(), connected: true }
    });
    enterRoom(code);
    return;
  }
  throw new Error("Couldn't create a room, try again.");
}

async function joinRoom(code, name) {
  await onlineInit();
  online.code = code;
  const metaSnap = await roomRef("meta").once("value");
  if (!metaSnap.exists()) {
    online.code = null;
    throw new Error("Room not found");
  }
  const mine = await roomRef(`players/${online.uid}`).once("value");
  if (!mine.exists()) {
    if (metaSnap.val().phase !== "lobby") {
      online.code = null;
      throw new Error("That game has already started");
    }
    const players = (await roomRef("players").once("value")).val() || {};
    if (Object.keys(players).length >= ONLINE_MAX_PLAYERS) {
      online.code = null;
      throw new Error("Room is full");
    }
    if (!name) {
      online.code = null;
      throw new Error("Enter your name first.");
    }
    await roomRef(`players/${online.uid}`).set({
      name: uniqueName(name, players),
      joinedAt: serverTime(),
      connected: true
    });
  }
  enterRoom(code);
}

function enterRoom(code) {
  online.code = code;
  online.data = emptyRoomData();
  online.metaSeen = false;
  online.secretAttached = false;
  online.viewKey = "";
  online.lastTick = "";
  safeSet(sessionStorage, "wi-room", code);
  if (location.search) history.replaceState(null, "", location.pathname);

  const listen = (path, apply) => {
    const ref = online.db.ref(`rooms/${code}/${path}`);
    const cb = ref.on("value", (snap) => { apply(snap.val()); scheduleOnlineRender(); }, (err) => console.error(path, err));
    online.listeners.push([ref, cb]);
  };
  listen("host", (v) => {
    online.data.hostId = v;
    online.isHost = v === online.uid;
    if (online.isHost && !online.secretAttached) {
      online.secretAttached = true;
      listen("hostSecret", (s) => { online.data.secret = s; });
    }
  });
  listen("meta", (v) => {
    if (v === null && online.metaSeen) {
      roomClosed();
      return;
    }
    if (v !== null) online.metaSeen = true;
    online.data.meta = v;
  });
  listen("players", (v) => { online.data.players = v || {}; });
  listen("clues", (v) => { online.data.clues = v || {}; });
  listen("votes", (v) => { online.data.votes = v || {}; });
  listen("scores", (v) => { online.data.scores = v || {}; });
  listen(`words/${online.uid}`, (v) => { online.data.word = v; });

  // Presence: mark ourselves offline if the connection drops.
  const conn = online.db.ref(".info/connected");
  const connCb = conn.on("value", (snap) => {
    if (snap.val() !== true) return;
    const ref = online.db.ref(`rooms/${code}/players/${online.uid}/connected`);
    ref.onDisconnect().set(false);
    ref.set(true).catch(() => {});
  });
  online.listeners.push([conn, connCb]);

  state.screen = "online-lobby";
  scheduleOnlineRender();
}

function detachRoom() {
  online.listeners.forEach(([ref, cb]) => ref.off("value", cb));
  online.listeners = [];
  if (online.code && online.db) {
    try { online.db.ref(`rooms/${online.code}/players/${online.uid}/connected`).onDisconnect().cancel(); } catch (e) { /* ignore */ }
  }
}

function resetOnlineLocal() {
  detachRoom();
  online.code = null;
  online.isHost = false;
  online.data = emptyRoomData();
  online.viewKey = "";
  safeSet(sessionStorage, "wi-room", null);
}

function roomClosed() {
  resetOnlineLocal();
  showToast("The host closed the room.");
  state.screen = "splash";
  render();
}

async function leaveRoom() {
  const code = online.code;
  if (!code) return;
  const wasHost = online.isHost;
  const phase = online.data.meta && online.data.meta.phase;
  const uid = online.uid;
  resetOnlineLocal();
  state.screen = "splash";
  render();
  const ref = online.db.ref(`rooms/${code}`);
  try {
    if (wasHost) {
      await ref.update({ host: null, meta: null, players: null, clues: null, votes: null, scores: null, words: null, hostSecret: null });
    } else if (phase === "lobby") {
      await ref.child(`players/${uid}`).remove();
    } else {
      await ref.child(`players/${uid}/connected`).set(false);
    }
  } catch (e) {
    console.error(e);
  }
}

async function onlineResume() {
  const params = new URLSearchParams(location.search);
  const urlCode = (params.get("room") || "").toUpperCase().replace(/[^A-Z]/g, "").slice(0, 4);
  const saved = safeGet(sessionStorage, "wi-room");
  if (urlCode.length === 4 && urlCode !== saved) {
    online.prefillCode = urlCode;
    state.screen = "online-menu";
    render();
    return;
  }
  if (saved) {
    try {
      await joinRoom(saved, online.name);
    } catch (e) {
      safeSet(sessionStorage, "wi-room", null);
      online.code = null;
    }
  }
}

/* ---------- host logic ---------- */

function orderedIds() {
  const players = online.data.players;
  return Object.keys(players).sort((a, b) => (players[a].joinedAt || 0) - (players[b].joinedAt || 0));
}

function activeIds() {
  const players = online.data.players;
  return orderedIds().filter((id) => players[id].connected !== false);
}

function hostStartRound() {
  const { meta, players } = online.data;
  const ids = orderedIds();
  if (ids.length < ONLINE_MIN_PLAYERS) {
    showToast(`Need at least ${ONLINE_MIN_PLAYERS} players.`);
    return;
  }
  const pack = pickPack(meta.packId);
  const round = buildRound(pack, meta.difficulty, ids.length);
  const imposterId = ids[round.imposterIndex];
  const updates = {
    clues: null,
    votes: null,
    "meta/phase": "clue",
    "meta/round": (meta.round || 0) + 1,
    "meta/result": null,
    hostSecret: { imposterId, secret: round.secretWord, imposterWord: round.imposterWord }
  };
  ids.forEach((id) => {
    updates[`words/${id}`] = id === imposterId
      ? { word: round.imposterWord, blind: round.imposterWord === null }
      : { word: round.secretWord, blind: false };
  });
  roomUpdate(updates);
}

function hostGoVote() {
  roomUpdate({ "meta/phase": "vote" });
}

function hostFinishRound() {
  const { players, votes, scores, secret } = online.data;
  if (!secret) return;
  const tally = {};
  Object.values(votes).forEach((target) => { tally[target] = (tally[target] || 0) + 1; });
  let top = 0;
  let accused = null;
  let tie = false;
  Object.entries(tally).forEach(([id, n]) => {
    if (n > top) { top = n; accused = id; tie = false; } else if (n === top) { tie = true; }
  });
  if (tie) accused = null;
  const caught = accused === secret.imposterId;
  const next = {};
  Object.keys(players).forEach((id) => { next[id] = scores[id] || 0; });
  if (caught) {
    Object.keys(players).forEach((id) => { if (id !== secret.imposterId) next[id] += 1; });
  } else if (next[secret.imposterId] !== undefined) {
    next[secret.imposterId] += 3;
  }
  roomUpdate({
    scores: next,
    "meta/phase": "result",
    "meta/result": {
      imposterId: secret.imposterId,
      accusedId: accused || "",
      caught,
      tie,
      secret: secret.secret,
      imposterWord: secret.imposterWord || "",
      tally
    }
  });
}

// Runs on the host's phone after every data change.
function hostTick() {
  const { meta, clues, votes } = online.data;
  if (!online.isHost || !meta) return;
  const active = activeIds();
  const key = `${meta.phase}:${meta.round}:${active.join()}:${Object.keys(clues).length}:${Object.keys(votes).length}`;
  if (key === online.lastTick) return;
  online.lastTick = key;
  if (meta.phase === "clue" && active.length && active.every((id) => clues[id] && clues[id].round === meta.round)) {
    hostGoVote();
  } else if (meta.phase === "vote" && active.length && active.every((id) => votes[id])) {
    hostFinishRound();
  }
}

/* ---------- rendering ---------- */

function scheduleOnlineRender() {
  clearTimeout(online.renderTimer);
  online.renderTimer = setTimeout(() => {
    if (!online.code) return;
    hostTick();
    if (state.screen.startsWith("online-") && state.screen !== "online-menu") renderOnline();
  }, 30);
}

function progress() {
  const { meta, clues, votes } = online.data;
  const ids = activeIds();
  if (meta.phase === "clue") {
    return { done: ids.filter((id) => clues[id] && clues[id].round === meta.round).length, total: ids.length, noun: "clues" };
  }
  if (meta.phase === "vote") {
    return { done: ids.filter((id) => votes[id]).length, total: ids.length, noun: "votes" };
  }
  return null;
}

function statusText() {
  const p = progress();
  if (!p) return "";
  const host = online.data.players[online.data.hostId];
  let text = `${p.done} of ${p.total} ${p.noun} in`;
  if (host && host.connected === false) text += " · host is offline";
  return text;
}

function viewKey() {
  const { meta, players, clues, votes, word } = online.data;
  const me = online.uid;
  const parts = [meta.phase, meta.round, online.isHost];
  if (meta.phase === "lobby") {
    parts.push(meta.packId, meta.difficulty, orderedIds().map((id) => id + players[id].name + players[id].connected).join());
  } else if (meta.phase === "clue") {
    parts.push(!!(clues[me] && clues[me].round === meta.round), word && `${word.word}${word.blind}`);
  } else if (meta.phase === "vote") {
    parts.push(votes[me] || "", orderedIds().map((id) => id + (clues[id] ? clues[id].text : "")).join());
  } else {
    parts.push(JSON.stringify(meta.result), JSON.stringify(online.data.scores));
  }
  return JSON.stringify(parts);
}

function renderOnline() {
  if (state.screen === "online-menu") return renderOnlineMenu();
  const { meta } = online.data;
  if (!online.code || !meta) {
    el("app").innerHTML = `<section class="screen"><p class="pass-hint">Connecting…</p></section>`;
    return;
  }
  const key = viewKey();
  state.screen = `online-${meta.phase}`;
  if (key === online.viewKey) {
    const status = el("status");
    if (status) status.textContent = statusText();
    return;
  }
  online.viewKey = key;
  const active = document.activeElement;
  const focusId = active && active.id;
  const typed = active && active.value;
  if (meta.phase === "lobby") renderLobby();
  else if (meta.phase === "clue") renderClue();
  else if (meta.phase === "vote") renderVote();
  else renderResult();
  if (focusId && typed) {
    const again = el(focusId);
    if (again && "value" in again) { again.value = typed; again.focus(); }
  }
}

function setOnlineError(message) {
  const line = el("onlineError");
  if (line) line.textContent = message || "";
}

function renderOnlineMenu() {
  el("app").innerHTML = `
    <section class="screen home">
      <div class="topbar">
        <button class="icon-btn" id="onlineBackBtn" aria-label="Back">←</button>
      </div>
      <div class="block">
        <p class="block-label">Your name</p>
        <input class="name-input" id="onlineName" type="text" maxlength="16" autocomplete="off" placeholder="Your name" value="${escapeHtml(online.name)}" />
      </div>
      <button class="cta" id="createBtn">Create a room</button>
      <p class="footnote">or join a friend's room</p>
      <input class="name-input code-input" id="joinCode" type="text" maxlength="4" autocomplete="off" autocapitalize="characters" placeholder="ABCD" value="${escapeHtml(online.prefillCode)}" />
      <button class="cta c-coral" id="joinBtn">Join room</button>
      <p class="footnote error" id="onlineError"></p>
    </section>
  `;
  const busy = (on) => {
    el("createBtn").disabled = on;
    el("joinBtn").disabled = on;
    el("createBtn").textContent = on ? "Connecting…" : "Create a room";
    el("joinBtn").textContent = on ? "Connecting…" : "Join room";
  };
  const readName = () => {
    online.name = cleanName(el("onlineName").value);
    safeSet(localStorage, "wi-name", online.name);
    return online.name;
  };
  el("onlineBackBtn").addEventListener("click", () => {
    state.screen = "splash";
    render();
  });
  el("joinCode").addEventListener("input", (e) => {
    e.target.value = e.target.value.toUpperCase().replace(/[^A-Z]/g, "");
  });
  el("createBtn").addEventListener("click", async () => {
    setOnlineError("");
    if (!readName()) return setOnlineError("Enter your name first.");
    busy(true);
    try {
      await createRoom(online.name);
    } catch (err) {
      setOnlineError(friendlyError(err));
      busy(false);
    }
  });
  el("joinBtn").addEventListener("click", async () => {
    setOnlineError("");
    if (!readName()) return setOnlineError("Enter your name first.");
    const code = el("joinCode").value;
    if (code.length !== 4) return setOnlineError("Room codes are 4 letters.");
    busy(true);
    try {
      await joinRoom(code, online.name);
    } catch (err) {
      setOnlineError(friendlyError(err));
      busy(false);
    }
  });
}

function playerRowsHtml() {
  const { players, hostId } = online.data;
  return orderedIds().map((id) => {
    const tags = [id === hostId ? "Host" : "", id === online.uid ? "You" : "", players[id].connected === false ? "offline" : ""].filter(Boolean).join(" · ");
    return `<div class="player-row static"><span>${escapeHtml(players[id].name)}</span><span class="row-hint">${tags}</span></div>`;
  }).join("");
}

function inviteRoom() {
  shareLink({
    title: "Brainbox: Word Imposter",
    text: `Join my Word Imposter room. Code: ${online.code}`,
    url: `${location.origin}${location.pathname}?room=${online.code}`
  });
}

function bindLeave() {
  const btn = el("leaveBtn");
  if (btn) btn.addEventListener("click", () => leaveRoom());
  const btn2 = el("leaveBtn2");
  if (btn2) btn2.addEventListener("click", () => leaveRoom());
}

function renderLobby() {
  const { meta } = online.data;
  const host = online.isHost;
  const count = orderedIds().length;
  const canStart = activeIds().length >= ONLINE_MIN_PLAYERS;
  const pack = pickPack(meta.packId);
  el("app").innerHTML = `
    <section class="screen reveal">
      <div class="topbar">
        <button class="icon-btn" id="leaveBtn" aria-label="Leave room">←</button>
      </div>
      <div class="word-card">
        <p class="word-card-label">Room code</p>
        <p class="word-card-value room-code">${online.code}</p>
      </div>
      <button class="ghost-btn" id="inviteBtn">Invite friends</button>
      <div class="block">
        <p class="block-label">Players (${count}/${ONLINE_MAX_PLAYERS})</p>
        <div class="player-list">${playerRowsHtml()}</div>
      </div>
      ${host ? `
        <div class="block">
          <p class="block-label">Pick a theme</p>
          <div class="theme-grid" id="themeGrid">${themeTilesHtml(meta.packId)}</div>
        </div>
        <div class="block">
          <p class="block-label">Difficulty</p>
          ${difficultyHtml(meta.difficulty)}
        </div>
        <button class="cta" id="startOnlineBtn" ${canStart ? "" : "disabled"}>${canStart ? "Start round" : `Need ${ONLINE_MIN_PLAYERS}+ players`}</button>
      ` : `
        <p class="pass-hint">Waiting for the host to start…</p>
        <p class="footnote">${escapeHtml(pack ? pack.name : "")} · ${meta.difficulty === "easy" ? "Easy" : "Hard"}</p>
      `}
    </section>
  `;
  bindLeave();
  el("inviteBtn").addEventListener("click", inviteRoom);
  if (host) {
    el("themeGrid").querySelectorAll(".theme-tile").forEach((btn) => {
      btn.addEventListener("click", () => roomUpdate({ "meta/packId": btn.dataset.id }));
    });
    el("modeToggle").querySelectorAll(".mode-btn").forEach((btn) => {
      btn.addEventListener("click", () => roomUpdate({ "meta/difficulty": btn.dataset.mode }));
    });
    el("startOnlineBtn").addEventListener("click", hostStartRound);
  }
}

function renderClue() {
  const { meta, word, clues } = online.data;
  const pack = pickPack(meta.packId);
  const sent = !!(clues[online.uid] && clues[online.uid].round === meta.round);
  let card;
  if (!word) {
    card = `<div class="word-card"><p class="word-card-value">…</p></div>`;
  } else if (word.blind) {
    card = `
      <div class="word-card imposter-card">
        <p class="word-card-label">Round ${meta.round}</p>
        <p class="word-card-value imposter-value">You're the imposter!</p>
        <p class="imposter-hint">You don't get a word. Bluff a clue that fits the theme, then watch for slip-ups.</p>
      </div>`;
  } else {
    card = `
      <div class="word-card">
        <p class="word-card-label">Round ${meta.round} · your word is</p>
        <p class="word-card-value">${escapeHtml(word.word || "")}</p>
      </div>`;
  }
  el("app").innerHTML = `
    <section class="screen reveal">
      ${card}
      <p class="footnote">Theme: ${escapeHtml(pack ? pack.name : "")}</p>
      ${sent ? `
        <div class="ready-card">
          <span class="ready-icon" aria-hidden="true">${iconGlyph("check")}</span>
          <h2>Clue sent</h2>
          <p id="status">${statusText()}</p>
        </div>
      ` : `
        <input class="name-input" id="clueInput" type="text" maxlength="30" autocomplete="off" placeholder="Your clue (a word or short phrase)" />
        <button class="cta" id="sendClueBtn">Send clue</button>
        <p class="footnote" id="status">${statusText()}</p>
      `}
      ${online.isHost ? `<button class="ghost-btn" id="skipBtn">Continue without waiting</button>` : ""}
      <button class="ghost-btn" id="leaveBtn2">Leave room</button>
    </section>
  `;
  bindLeave();
  if (online.isHost) el("skipBtn").addEventListener("click", hostGoVote);
  if (!sent) {
    const send = () => {
      const text = el("clueInput").value.replace(/\s+/g, " ").trim().slice(0, 30);
      if (!text) return;
      roomRef(`clues/${online.uid}`).set({ text, round: meta.round }).catch(() => showToast("Couldn't send, try again."));
    };
    el("sendClueBtn").addEventListener("click", send);
    el("clueInput").addEventListener("keydown", (e) => { if (e.key === "Enter") send(); });
  }
}

function renderVote() {
  const { meta, players, clues, votes } = online.data;
  const mine = votes[online.uid];
  const rows = orderedIds().map((id) => {
    const clue = clues[id] && clues[id].round === meta.round ? `“${escapeHtml(clues[id].text)}”` : "—";
    const name = escapeHtml(players[id].name);
    if (id === online.uid) {
      return `<div class="player-row static"><span>${name} (you)</span><span class="clue-text">${clue}</span></div>`;
    }
    return `<button class="player-row ${mine === id ? "picked" : ""}" data-id="${id}"><span>${name}</span><span class="clue-text">${clue}</span></button>`;
  }).join("");
  el("app").innerHTML = `
    <section class="screen reveal">
      <p class="pass-hint">Who's the imposter? Tap to vote</p>
      <div class="player-list">${rows}</div>
      <p class="footnote" id="status">${statusText()}</p>
      ${online.isHost ? `<button class="ghost-btn" id="skipBtn">Finish voting now</button>` : ""}
      <button class="ghost-btn" id="leaveBtn2">Leave room</button>
    </section>
  `;
  bindLeave();
  if (online.isHost) el("skipBtn").addEventListener("click", hostFinishRound);
  el("app").querySelectorAll("button.player-row").forEach((btn) => {
    btn.addEventListener("click", () => {
      roomRef(`votes/${online.uid}`).set(btn.dataset.id).catch(() => showToast("Couldn't vote, try again."));
    });
  });
}

function renderResult() {
  const { meta, players, scores } = online.data;
  const r = meta.result || {};
  const nameOf = (id) => (players[id] ? escapeHtml(players[id].name) : "Someone");
  const verdict = r.caught
    ? `The group caught them! Everyone else +1.`
    : r.tie ? `The vote was tied, so they got away. +3 for ${nameOf(r.imposterId)}.`
      : `They got away with it. +3 for ${nameOf(r.imposterId)}.`;
  const words = r.imposterWord
    ? `The word was <b>${escapeHtml(r.secret || "")}</b>. The imposter had <b>${escapeHtml(r.imposterWord)}</b>.`
    : `The word was <b>${escapeHtml(r.secret || "")}</b>. The imposter had no word.`;
  const board = orderedIds()
    .sort((a, b) => (scores[b] || 0) - (scores[a] || 0))
    .map((id) => {
      const votes = (r.tally && r.tally[id]) || 0;
      const pts = scores[id] || 0;
      return `<div class="player-row static"><span>${nameOf(id)}${id === r.imposterId ? " 🕵️" : ""}${id === online.uid ? " (you)" : ""}</span><span class="row-hint">${votes} vote${votes === 1 ? "" : "s"} · ${pts} pt${pts === 1 ? "" : "s"}</span></div>`;
    }).join("");
  el("app").innerHTML = `
    <section class="screen reveal">
      <div class="ready-card">
        <h2>The imposter was ${nameOf(r.imposterId)}</h2>
        <p>${verdict}</p>
        <p style="margin-top:10px">${words}</p>
      </div>
      <div class="block">
        <p class="block-label">Scores</p>
        <div class="player-list">${board}</div>
      </div>
      ${online.isHost
        ? `<button class="cta" id="nextRoundBtn">Next round</button>`
        : `<p class="pass-hint">Waiting for the host…</p>`}
      <button class="ghost-btn" id="leaveBtn2">Leave room</button>
    </section>
  `;
  bindLeave();
  if (online.isHost) el("nextRoundBtn").addEventListener("click", hostStartRound);
}
