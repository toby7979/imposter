const state = {
  screen: "splash",
  returnTo: "splash",
  packId: WORD_PACKS[0].id,
  difficulty: "easy",
  players: 3,
  playerNames: ["Player 1", "Player 2", "Player 3"],
  playerScores: [0, 0, 0],
  round: null,
  revealedIndex: null,
  seenBy: []
};

const el = (id) => document.getElementById(id);

function escapeHtml(str) {
  return str.replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[c]));
}

function syncPlayerNames() {
  while (state.playerNames.length < state.players) {
    state.playerNames.push(`Player ${state.playerNames.length + 1}`);
  }
  state.playerNames.length = state.players;
}

function syncPlayerScores() {
  while (state.playerScores.length < state.players) {
    state.playerScores.push(0);
  }
  state.playerScores.length = state.players;
}

function showToast(message) {
  const existing = document.querySelector(".toast");
  if (existing) existing.remove();
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 2200);
}

async function shareGame() {
  const shareData = {
    title: "Brainbox: Word Imposter",
    text: "One player gets a different word and has to bluff. Free pass-and-play game:",
    url: location.origin + location.pathname
  };
  if (navigator.share) {
    try {
      await navigator.share(shareData);
    } catch (e) {
      // user cancelled the share sheet, nothing to do
    }
    return;
  }
  const copied = await Promise.race([
    navigator.clipboard.writeText(shareData.url).then(() => true).catch(() => false),
    new Promise((resolve) => setTimeout(() => resolve(false), 1200))
  ]);
  if (copied) {
    showToast("Link copied! Send it to your group.");
  } else {
    window.prompt("Copy this link:", shareData.url);
  }
}

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pickPack(id) {
  return WORD_PACKS.find((p) => p.id === id);
}

function buildRound(pack, difficulty) {
  const imposterIndex = randInt(0, state.players - 1);
  if (pack.type === "pairs") {
    const pair = pack.pairs[randInt(0, pack.pairs.length - 1)];
    return {
      type: "pairs",
      secretWord: pair[0],
      imposterWord: difficulty === "easy" ? null : pair[1],
      imposterIndex
    };
  }
  const secret = randInt(pack.min, pack.max);
  const candidates = [];
  for (let n = pack.min; n <= pack.max; n++) {
    const diff = Math.abs(n - secret);
    if (diff >= pack.minOffset && diff <= pack.maxOffset) candidates.push(n);
  }
  const imposterNum = candidates.length
    ? candidates[randInt(0, candidates.length - 1)]
    : secret;
  return {
    type: "numbers",
    secretWord: String(secret),
    imposterWord: difficulty === "easy" ? null : String(imposterNum),
    imposterIndex
  };
}

function mascotSvg(size) {
  return `
    <svg class="mascot" width="${size}" height="${size}" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <ellipse cx="100" cy="120" rx="66" ry="70" fill="#FF9457" stroke="#241C3D" stroke-width="6"/>
      <path d="M42 88a58 40 0 01116 0z" fill="#2B2140"/>
      <rect x="38" y="112" width="124" height="34" rx="16" fill="#2B2140"/>
      <circle cx="74" cy="129" r="15" fill="#FFFFFF"/>
      <circle cx="126" cy="129" r="15" fill="#FFFFFF"/>
      <circle cx="77" cy="129" r="6" fill="#241C3D"/>
      <circle cx="129" cy="129" r="6" fill="#241C3D"/>
      <path d="M85 170q15 10 30 0" fill="none" stroke="#241C3D" stroke-width="5" stroke-linecap="round"/>
    </svg>
  `;
}

function render() {
  if (state.screen === "splash") return renderSplash();
  if (state.screen === "instructions") return renderInstructions();
  if (state.screen === "home") return renderHome();
  if (state.screen === "reveal") return renderReveal();
  if (state.screen === "results") return renderResults();
}

function renderSplash() {
  el("app").innerHTML = `
    <section class="screen splash">
      <div class="brand">
        <p class="suite-tag">Brainbox</p>
        ${mascotSvg(120)}
        <h1>Word Imposter</h1>
        <p class="subtitle">A vocabulary-building bluffing game for the whole family</p>
      </div>
      <button class="cta" id="playBtn">Play</button>
      <button class="ghost-btn" id="shareBtn">Share with friends</button>
      <button class="ghost-btn" id="howToBtn">How to play</button>
    </section>
  `;
  el("playBtn").addEventListener("click", () => {
    state.screen = "home";
    render();
  });
  el("shareBtn").addEventListener("click", shareGame);
  el("howToBtn").addEventListener("click", () => {
    state.returnTo = "splash";
    state.screen = "instructions";
    render();
  });
}

function renderInstructions() {
  el("app").innerHTML = `
    <section class="screen instructions">
      <div class="ready-card">
        <h2>How to play</h2>
        <ol class="steps">
          <li>Pick a theme and set how many players.</li>
          <li>Pass the phone. Each player taps their own name and looks only at their own word.</li>
          <li>Almost everyone sees the same word. One secret imposter sees a different one.</li>
          <li>Going round the group, everyone says one clue about their word.</li>
          <li>Discuss, then vote on who you think the imposter is.</li>
          <li>Reveal it. Catch the imposter and everyone else wins.</li>
        </ol>
      </div>
      <button class="cta" id="backBtn">Got it</button>
    </section>
  `;
  el("backBtn").addEventListener("click", () => {
    state.screen = state.returnTo;
    render();
  });
}

function renderHome() {
  el("app").innerHTML = `
    <section class="screen home">
      <div class="topbar">
        <button class="icon-btn" id="backSplashBtn" aria-label="Back">←</button>
        <button class="icon-btn" id="helpBtn" aria-label="How to play">?</button>
      </div>

      <div class="block">
        <p class="block-label">Pick a theme</p>
        <div class="theme-grid" id="themeGrid"></div>
      </div>

      <div class="block">
        <p class="block-label">Players</p>
        <div class="stepper">
          <button class="step-btn" id="stepDown" aria-label="Fewer players">−</button>
          <span class="step-value" id="playerCount">${state.players}</span>
          <button class="step-btn" id="stepUp" aria-label="More players">+</button>
        </div>
      </div>

      <div class="block">
        <p class="block-label">Players &amp; scores</p>
        <div class="name-list" id="nameList"></div>
      </div>

      <div class="block">
        <p class="block-label">Difficulty</p>
        <div class="mode-toggle" id="modeToggle">
          <button class="mode-btn ${state.difficulty === "easy" ? "active" : ""}" data-mode="easy">
            <span class="mode-name">Easy</span>
            <span class="mode-desc">Imposter is told, gets no word</span>
          </button>
          <button class="mode-btn ${state.difficulty === "hard" ? "active" : ""}" data-mode="hard">
            <span class="mode-name">Hard</span>
            <span class="mode-desc">Imposter gets a close alternate word</span>
          </button>
        </div>
      </div>

      <button class="cta" id="startBtn">Start round</button>
      <p class="footnote">Builds vocabulary while you play</p>
      ${state.playerScores.some((s) => s > 0) ? `<button class="ghost-btn" id="resetScoreBtn">Reset score</button>` : ""}
    </section>
  `;

  const nameList = el("nameList");
  nameList.innerHTML = state.playerNames.map((name, i) => `
    <div class="name-row">
      <input class="name-input" type="text" maxlength="16" value="${escapeHtml(name)}" data-i="${i}" placeholder="Player ${i + 1}" />
      <span class="name-score">${state.playerScores[i]} pt${state.playerScores[i] === 1 ? "" : "s"}</span>
    </div>
  `).join("");
  nameList.querySelectorAll(".name-input").forEach((input) => {
    input.addEventListener("input", () => {
      const i = parseInt(input.dataset.i, 10);
      state.playerNames[i] = input.value.trim() || `Player ${i + 1}`;
    });
  });

  if (el("resetScoreBtn")) {
    el("resetScoreBtn").addEventListener("click", () => {
      state.playerScores = state.playerScores.map(() => 0);
      renderHome();
    });
  }

  const grid = el("themeGrid");
  grid.innerHTML = WORD_PACKS.map((pack) => `
    <button class="theme-tile c-${pack.color} ${pack.id === state.packId ? "selected" : ""}" data-id="${pack.id}">
      ${pack.id === state.packId ? `<span class="tile-check" aria-hidden="true">${iconGlyph("check")}</span>` : ""}
      <span class="tile-icon" aria-hidden="true">${iconGlyph(pack.icon)}</span>
      <span class="tile-name">${pack.name}</span>
      <span class="tile-tag">${pack.tagline}</span>
    </button>
  `).join("");

  grid.querySelectorAll(".theme-tile").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.packId = btn.dataset.id;
      renderHome();
    });
  });

  el("backSplashBtn").addEventListener("click", () => {
    state.screen = "splash";
    render();
  });
  el("helpBtn").addEventListener("click", () => {
    state.returnTo = "home";
    state.screen = "instructions";
    render();
  });

  el("stepDown").addEventListener("click", () => {
    state.players = Math.max(3, state.players - 1);
    syncPlayerNames();
    syncPlayerScores();
    renderHome();
  });
  el("stepUp").addEventListener("click", () => {
    state.players = Math.min(8, state.players + 1);
    syncPlayerNames();
    syncPlayerScores();
    renderHome();
  });

  el("modeToggle").querySelectorAll(".mode-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.difficulty = btn.dataset.mode;
      renderHome();
    });
  });

  el("startBtn").addEventListener("click", () => {
    const pack = pickPack(state.packId);
    state.round = buildRound(pack, state.difficulty);
    state.seenBy = new Array(state.players).fill(false);
    state.revealedIndex = null;
    state.screen = "reveal";
    render();
  });
}

function renderReveal() {
  if (state.revealedIndex !== null) return renderWordCard();

  if (state.seenBy.every(Boolean)) {
    el("app").innerHTML = `
      <section class="screen reveal">
        <div class="ready-card">
          <span class="ready-icon" aria-hidden="true">${iconGlyph("check")}</span>
          <h2>Everyone's ready</h2>
          <p>Give one clue each, then vote on who you think the imposter is.</p>
        </div>
        <button class="cta" id="newRoundBtn">Reveal the imposter</button>
        <button class="ghost-btn" id="changeSetupBtn">Change theme or players</button>
        <button class="ghost-btn" id="shareBtn">Share with friends</button>
      </section>
    `;
    el("newRoundBtn").addEventListener("click", () => {
      state.screen = "results";
      render();
    });
    el("changeSetupBtn").addEventListener("click", () => {
      state.screen = "home";
      render();
    });
    el("shareBtn").addEventListener("click", shareGame);
    return;
  }

  const rows = state.seenBy.map((seen, i) => `
    <button class="player-row ${seen ? "seen" : ""}" data-i="${i}" ${seen ? "disabled" : ""}>
      <span>${escapeHtml(state.playerNames[i])}</span>
      <span class="row-hint">${seen ? "Revealed" : "Tap to see your word"}</span>
    </button>
  `).join("");

  el("app").innerHTML = `
    <section class="screen reveal">
      <div class="topbar">
        <button class="icon-btn" id="backHomeBtn" aria-label="Back to setup">←</button>
      </div>
      <p class="pass-hint">Pass the phone to each player in turn</p>
      <div class="player-list">${rows}</div>
    </section>
  `;

  el("backHomeBtn").addEventListener("click", () => {
    const someAlreadySeen = state.seenBy.some(Boolean);
    if (someAlreadySeen && !window.confirm("Go back to setup? Some players already saw their word this round, so starting again will give everyone a new one.")) {
      return;
    }
    state.screen = "home";
    render();
  });

  el("app").querySelectorAll(".player-row:not(.seen)").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.revealedIndex = parseInt(btn.dataset.i, 10);
      render();
    });
  });
}

function renderWordCard() {
  const i = state.revealedIndex;
  const isImposter = i === state.round.imposterIndex;
  const isBlindImposter = isImposter && state.round.imposterWord === null;

  if (isBlindImposter) {
    el("app").innerHTML = `
      <section class="screen reveal">
        <div class="word-card imposter-card">
          <p class="word-card-label">${escapeHtml(state.playerNames[i])}</p>
          <p class="word-card-value imposter-value">You're the imposter!</p>
          <p class="imposter-hint">You don't get a word. Listen to the clues and bluff your way through.</p>
        </div>
        <button class="cta" id="hideBtn">Got it, hide this</button>
      </section>
    `;
  } else {
    const word = isImposter ? state.round.imposterWord : state.round.secretWord;
    el("app").innerHTML = `
      <section class="screen reveal">
        <div class="word-card">
          <p class="word-card-label">${escapeHtml(state.playerNames[i])}, your word is</p>
          <p class="word-card-value">${word}</p>
        </div>
        <button class="cta" id="hideBtn">Got it, hide word</button>
      </section>
    `;
  }

  el("hideBtn").addEventListener("click", () => {
    state.seenBy[i] = true;
    state.revealedIndex = null;
    render();
  });
}

function renderResults() {
  const imposterName = state.playerNames[state.round.imposterIndex];
  el("app").innerHTML = `
    <section class="screen reveal">
      <div class="ready-card">
        <h2>The imposter was ${escapeHtml(imposterName)}</h2>
        <p>Did the group catch them?</p>
      </div>
      <button class="cta" id="caughtBtn">Caught — everyone else +1</button>
      <button class="cta c-coral" id="escapedBtn">Escaped — imposter +3</button>
      <button class="ghost-btn" id="changeSetupBtn">Change theme or players</button>
    </section>
  `;
  el("caughtBtn").addEventListener("click", () => {
    state.playerScores = state.playerScores.map((score, idx) =>
      idx === state.round.imposterIndex ? score : score + 1
    );
    startNextRound();
  });
  el("changeSetupBtn").addEventListener("click", () => {
    state.screen = "home";
    render();
  });
  el("escapedBtn").addEventListener("click", () => {
    state.playerScores[state.round.imposterIndex] += 3;
    startNextRound();
  });
}

function startNextRound() {
  const pack = pickPack(state.packId);
  state.round = buildRound(pack, state.difficulty);
  state.seenBy = new Array(state.players).fill(false);
  state.revealedIndex = null;
  state.screen = "reveal";
  render();
}

function iconGlyph(name) {
  const icons = {
    abc: `<svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M6 24V8h16a4 4 0 010 8H6" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M6 16h14a4 4 0 010 8H6" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`,
    school: `<svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M4 12l12-6 12 6-12 6-12-6z" stroke="currentColor" stroke-width="2.5" stroke-linejoin="round"/>
      <path d="M9 15v6c0 1.5 3 3 7 3s7-1.5 7-3v-6" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M27 12v7" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
    </svg>`,
    paw: `<svg viewBox="0 0 32 32" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="16" cy="21" rx="8" ry="6.5"/>
      <ellipse cx="6" cy="13" rx="3" ry="4"/>
      <ellipse cx="13" cy="8" rx="3" ry="4"/>
      <ellipse cx="19" cy="8" rx="3" ry="4"/>
      <ellipse cx="26" cy="13" rx="3" ry="4"/>
    </svg>`,
    hash: `<svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M11 4L8 28M24 4l-3 24M5 11h22M4 21h22" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`,
    check: `<svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M6 17l7 7 13-15" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`,
    food: `<svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M8 4v11a3 3 0 003 3v10M8 4v11M11 4v11M14 4v11" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M23 4c-3 0-4 3-4 6s1 5 4 5v13" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`,
    globe: `<svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="16" cy="16" r="12" stroke="currentColor" stroke-width="2.5"/>
      <ellipse cx="16" cy="16" rx="5" ry="12" stroke="currentColor" stroke-width="2.5"/>
      <path d="M4 16h24M6 9h20M6 23h20" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
    </svg>`,
    lock: `<svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="7" y="15" width="18" height="13" rx="3" fill="currentColor"/>
      <path d="M11 15v-4a5 5 0 0110 0v4" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
    </svg>`,
    movie: `<svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="4" y="10" width="24" height="18" rx="2.5" stroke="currentColor" stroke-width="2.5" stroke-linejoin="round"/>
      <path d="M4 10l4-6h4l-4 6M14 10l4-6h4l-4 6M24 10l4-6h2v6" stroke="currentColor" stroke-width="2.5" stroke-linejoin="round"/>
    </svg>`
  };
  return icons[name] || "";
}

render();
