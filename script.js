const DEFAULT_USER_STATS = {
  daysInGame: 1,
  longestStreak: 0,
  completedMissions: 0,
  levelsGained: 1,

  missedMissions: 0,

  muscleGroups: {
    glutes: 0,
    arms: 0,
    back: 0,
    abs: 0,
    legs: 0,
  },
};

const DEFAULT_PERSONALIZATION = {
  difficulty: ["Podstawowy"],
  muscles: ["Brzuch"],
  goals: ["Kondycja"],
};

const MUSCLE_MAP = {
  Pośladki: "glutes",
  Ręce: "arms",
  Plecy: "back",
  Brzuch: "abs",
  Nogi: "legs",
};

let lastKnownLevel = parseInt(localStorage.getItem("lastKnownLevel") || "1");
let currentStreak = parseInt(localStorage.getItem("currentStreak")) || 0;

const todayKey = new Date().toISOString().split("T")[0];

let missionOpenCountToday =
  Number(localStorage.getItem("missionOpenCountToday")) || 0;

let missionCompletedToday =
  localStorage.getItem("missionCompletedToday") === todayKey;

let shownProcrastinationPopupToday =
  localStorage.getItem("shownProcrastinationPopupToday") === todayKey;

function loadUserStats() {
  const saved = localStorage.getItem("userStats");
  let stats = saved ? JSON.parse(saved) : structuredClone(DEFAULT_USER_STATS);

  // Zapisz datę pierwszego wejścia, jeśli jej nie ma
  if (!localStorage.getItem("firstLoginDate")) {
    localStorage.setItem("firstLoginDate", new Date().toISOString());
  }

  // Obliczanie dni w grze
  const firstLogin = new Date(localStorage.getItem("firstLoginDate"));
  const today = new Date();
  const diffTime = Math.abs(today - firstLogin);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  stats.daysInGame = diffDays;


  stats.missedMissions = Math.max(
    0,
    stats.daysInGame - stats.completedMissions,
  );

  return stats;
}

function saveUserStats(stats) {
  localStorage.setItem("userStats", JSON.stringify(stats));
}

const userStats = loadUserStats();

// ===== RESET XP DNIA (TYLKO PRZY ZMIANIE DNIA) =====
(function resetDailyXpIfNewDay() {
  const todayStr = new Date().toISOString().split("T")[0];
  const lastXpDay = localStorage.getItem("lastXpDay");

  if (lastXpDay && lastXpDay !== todayStr) {
    window.lastEarnedXp = 0;
  }
})();

// podłączanie kafelek statystyk
function updateStatsCards() {
  document.getElementById("daysInGame").textContent = userStats.daysInGame;

  document.getElementById("longestStreak").textContent =
    userStats.longestStreak + " 🔥";

  document.getElementById("completedMissions").textContent =
    userStats.completedMissions;

  document.getElementById("levelsGained").textContent = userStats.levelsGained;
}

updateStatsCards();

// ===== FUNKCJA JEDNORAZOWEGO RESETU STANU GRY =====
function resetGameProgress() {
  console.log("RESETOWANIE STANU GRY...");

  // Główne systemy gry
  localStorage.removeItem("xp");
  localStorage.removeItem("userStats");

  // Misje / streaki
  localStorage.removeItem("currentLevel");
  localStorage.removeItem("completedLevels");
  localStorage.removeItem("lastCompletionDate");
  localStorage.removeItem("currentStreak");


  window.location.reload();
}


// ===== XP SYSTEM =====
let xp = parseInt(localStorage.getItem("xp") || "0");

function saveXP() {
  localStorage.setItem("xp", xp);
}

function addXP(amount) {
  xp += amount;
  saveXP();
  updateXPDisplay();
}

function getXpForNextLevel(level) {
  return 100 + (level - 1) * 50;
}

function updateXPProgress() {
  const progressEl = document.getElementById("xp-progress");
  const levelPills = document.querySelectorAll(
    ".level-pill, .profile-level-pill",
  );

  let level = 1;
  let remainingXp = xp;

  while (remainingXp >= getXpForNextLevel(level)) {
    remainingXp -= getXpForNextLevel(level);
    level++;
  }

  const xpForNext = getXpForNextLevel(level);
  const progress = (remainingXp / xpForNext) * 100;

  if (progressEl) {
    progressEl.style.width = progress + "%";
  }

  levelPills.forEach((pill) => {
    pill.textContent = "Level " + level;
  });

  // === LEVEL UP CHECK ===
  if (level > lastKnownLevel) {
    showLevelUpPopup(level);
    lastKnownLevel = level;
    localStorage.setItem("lastKnownLevel", level);

    // Aktualizujemy statystykę w obiekcie userStats
    userStats.levelsGained = level;
    saveUserStats(userStats);
    updateStatsCards();
  }
}

function showLevelUpPopup(level) {
  const popup = document.getElementById("levelup-popup");
  const levelSpan = document.getElementById("levelup-level");
  const closeBtn = document.getElementById("levelup-close-btn");

  if (!popup || !levelSpan) return;

  levelSpan.textContent = level;
  popup.classList.add("active");

  closeBtn.onclick = () => {
    popup.classList.remove("active");
  };
}

function showXpPopup(xp) {
  const popup = document.getElementById("xp-popup");
  const xpSpan = document.getElementById("xp-amount");
  const closeBtn = document.getElementById("xp-close-btn");

  if (!popup || !xpSpan) return;

  xpSpan.textContent = xp;
  popup.classList.add("active");

  closeBtn.onclick = () => {
    popup.classList.remove("active");
    showNextBadgeUnlockPopup();
  };
}

function showInfoPopup(title, text) {
  const popup = document.getElementById("info-popup");
  const titleEl = document.getElementById("info-popup-title");
  const textEl = document.getElementById("info-popup-text");
  const closeBtn = document.getElementById("info-popup-close");
  const okBtn = document.getElementById("info-popup-ok");

  titleEl.textContent = title;
  textEl.textContent = text;

  popup.classList.add("active");

  function close() {
    popup.classList.remove("active");
    closeBtn.onclick = null;
    okBtn.onclick = null;
  }

  closeBtn.onclick = close;
  okBtn.onclick = close;
}

function updateXPDisplay() {
  const xpEl = document.getElementById("xp-value");
  if (xpEl) xpEl.textContent = xp;
  updateXPProgress();
}

const BADGES = [
  {
    id: "first_mission",
    title: "Pierwszy Krok",
    desc: "Ukończ swoją pierwszą misję.",
    icon: "⭐",
    condition: () => userStats.completedMissions >= 1,
  },
  {
    id: "streak_3",
    title: "Trzy Dni Ognia",
    desc: "Utrzymaj 3-dniowy streak.",
    icon: "🔥",
    condition: () => currentStreak >= 3,
  },
  {
    id: "streak_5",
    title: "Superszybki Start",
    desc: "Utrzymaj 5-dniowy streak.",
    icon: "⚡",
    condition: () => currentStreak >= 5,
  },
  {
    id: "streak_14",
    title: "Perfekcyjna Seria",
    desc: "Utrzymaj 14-dniowy streak.",
    icon: "🏆",
    condition: () => currentStreak >= 14,
  },
  {
    id: "xp_150_day",
    title: "Dzień Perfekcji",
    desc: "Zdobądź 150 XP w jeden dzień.",
    icon: "💎",
    condition: () => {
      const today = new Date().toISOString().split("T")[0];
      return window.lastEarnedXp >= 150 && window.lastXpDay === today;
    },
  },
  {
    id: "missions_10",
    title: "Na Dobrej Drodze",
    desc: "Ukończ 10 misji.",
    icon: "🔟",
    condition: () => userStats.completedMissions >= 10,
  },
  {
    id: "missions_50",
    title: "Wytrwały Wojownik",
    desc: "Ukończ 50 misji.",
    icon: "🔥",
    condition: () => userStats.completedMissions >= 50,
  },
  {
    id: "missions_100",
    title: "Mistrz Konsekwencji",
    desc: "Ukończ 100 misji.",
    icon: "👑",
    condition: () => userStats.completedMissions >= 100,
  },
  {
    id: "collector_5",
    title: "Zdobycz Kolekcjonera",
    desc: "Odblokuj 5 różnych odznak.",
    icon: "🧳",
    condition: (unlocked) => unlocked.length >= 5,
  },
  {
    id: "month_start",
    title: "Mocny Początek",
    desc: "Ukończ misję pierwszego dnia miesiąca.",
    icon: "🗓️",
    condition: () => new Date().getDate() === 1,
  },
  {
    id: "month_end",
    title: "Zamknięcie Miesiąca",
    desc: "Ukończ misję ostatniego dnia miesiąca.",
    icon: "🌙",
    condition: () => {
      const d = new Date();
      const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
      return d.getDate() === lastDay;
    },
  },
  {
    id: "first_personalization",
    title: "To Twój Styl",
    desc: "Zapisz swoją pierwszą personalizację profilu.",
    icon: "🎨",
    condition: () => {
      return localStorage.getItem("hasSavedPersonalization") === "true";
    },
  },
];

// odznaki w localstorage
function getUnlockedBadges() {
  return JSON.parse(localStorage.getItem("unlockedBadges") || "[]");
}

function saveUnlockedBadges(list) {
  localStorage.setItem("unlockedBadges", JSON.stringify(list));
}

let pendingBadgeUnlocks = [];

function queueBadgeUnlockPopup(badge) {
  pendingBadgeUnlocks.push(badge);
}

function showNextBadgeUnlockPopup() {
  if (pendingBadgeUnlocks.length === 0) return;
  const badge = pendingBadgeUnlocks.shift();
  showBadgeUnlockPopup(badge);
}

function checkBadges() {
  const unlocked = getUnlockedBadges();
  let changed = false;

  BADGES.forEach((badge) => {
    if (!unlocked.includes(badge.id) && badge.condition(unlocked)) {
      unlocked.push(badge.id);
      queueBadgeUnlockPopup(badge);
      changed = true;
    }
  });

  if (changed) {
    saveUnlockedBadges(unlocked);
  }

  // odświeżamy UI odznak
  updateBadgesUI();

  if (pendingBadgeUnlocks.length > 0) {
    const xpPopup = document.getElementById("xp-popup");
    if (!xpPopup || !xpPopup.classList.contains("active")) {
      showNextBadgeUnlockPopup();
    }
  }
}

function showBadgePopup(badge) {
  document.getElementById("popup-badge-icon").textContent = badge.icon;
  document.getElementById("popup-badge-title").textContent = badge.title;
  document.getElementById("popup-badge-desc").textContent =
    badge.title + " – " + badge.desc;

  const popup = document.getElementById("badge-popup");
  popup.classList.add("active");

  document.getElementById("badge-close-btn").onclick = () => {
    popup.classList.remove("active");
  };

  document.getElementById("badge-download-btn").onclick = () => {
    popup.classList.remove("active");
    setActiveScreen("profile");
    setActiveProfileTab("badges");
  };
}

function showBadgeUnlockPopup(badge) {
  const popup = document.getElementById("badge-unlock-popup");
  const desc = document.getElementById("badge-unlock-desc");
  const viewBtn = document.getElementById("badge-unlock-view-btn");
  const closeBtn = document.getElementById("badge-unlock-close-btn");

  popup.querySelector(".levelup-icon").textContent = badge.icon;
  desc.textContent = `${badge.title} – ${badge.desc}`;
  popup.classList.add("active");

  updateBadgesUI();
  
  viewBtn.onclick = () => {
    popup.classList.remove("active");
    setActiveScreen("profile");
    setActiveProfileTab("badges");
    updateBadgesUI();
    filterBadges("unlocked");
    showNextBadgeUnlockPopup();
  };

  closeBtn.onclick = () => {
    popup.classList.remove("active");
    showNextBadgeUnlockPopup();
  };
    
}

function updateBadgesUI() {
  const unlocked = getUnlockedBadges();

  document.querySelectorAll(".badge-card").forEach((card) => {
    const badgeId = card.dataset.badgeId;
    const icon = card.querySelector(".badge-icon");

    if (unlocked.includes(badgeId)) {
      card.classList.add("unlocked");
      card.classList.remove("locked");
      if (icon) icon.classList.remove("locked");
    } else {
      card.classList.add("locked");
      card.classList.remove("unlocked");
      if (icon) icon.classList.add("locked");
    }
  });
  attachBadgeClickHandlers();
  attachBadgeTooltips();
}

function attachBadgeTooltips() {
  const badgeTooltip = document.getElementById("badge-tooltip");
  if (!badgeTooltip) return;

  document.querySelectorAll(".badge-card").forEach((card) => {
    card.onmouseenter = () => {
      const desc = card.dataset.desc;
      if (!desc) return;

      // tekst tooltipa
      badgeTooltip.textContent = desc;

      // styl w zależności od stanu odznaki
      if (card.classList.contains("locked")) {
        badgeTooltip.classList.add("locked");
      } else {
        badgeTooltip.classList.remove("locked");
      }

      const rect = card.getBoundingClientRect();
      badgeTooltip.style.top = rect.top - 30 + "px";
      badgeTooltip.style.left = rect.left + rect.width / 2 + "px";
      badgeTooltip.style.transform = "translateX(-50%)";

      badgeTooltip.classList.add("active");
    };

    card.onmouseleave = () => {
      badgeTooltip.classList.remove("active");
    };
  });
}

function attachBadgeClickHandlers() {
  document.querySelectorAll(".badge-card").forEach((card) => {
    card.onclick = () => {
      const isUnlocked = card.classList.contains("unlocked");
      if (!isUnlocked) return;

      const badgeId = card.dataset.badgeId;
      const badge = BADGES.find((b) => b.id === badgeId);
      if (!badge) return;

      document.getElementById("popup-badge-icon").textContent = badge.icon;
      document.getElementById("popup-badge-title").textContent = badge.title;
      document.getElementById("popup-badge-desc").textContent = badge.desc;

      document.getElementById("badge-popup").classList.add("active");
    };
  });
}

function filterBadges(view) {
  document.querySelectorAll(".badge-card").forEach((card) => {
    const isUnlocked = card.classList.contains("unlocked");

    if (view === "unlocked") {
      card.style.display = isUnlocked ? "" : "none";
    } else if (view === "locked") {
      card.style.display = !isUnlocked ? "" : "none";
    }
  });
}

// ===== AVATAR & USERNAME SYSTEM =====
const DEFAULT_AVATAR_ICON = "FG";
const DEFAULT_USERNAME = "Gracz FitGame";

let currentAvatarIcon =
  localStorage.getItem("avatarIcon") || DEFAULT_AVATAR_ICON;
let currentUsername = localStorage.getItem("username") || DEFAULT_USERNAME;

function saveProfile() {
  localStorage.setItem("avatarIcon", currentAvatarIcon);
  localStorage.setItem("username", currentUsername);
  updateProfileDisplay();
}

function updateProfileDisplay() {
  // Aktualizacja Avatara (HUD, Profil, Popup Pobierania)
  const hudAvatar = document.querySelector(".avatar-circle");
  if (hudAvatar) hudAvatar.textContent = currentAvatarIcon;

  const profileAvatar = document.querySelector(".profile-avatar");
  if (profileAvatar) profileAvatar.textContent = currentAvatarIcon;

  // Aktualizacja Nazwy Użytkownika (Profil, Popup Pobierania)
  const profileUsernameEl = document.getElementById("profile-username");
  if (profileUsernameEl) profileUsernameEl.textContent = currentUsername;

  const downloadUsername = document.getElementById("download-username");
  if (downloadUsername) downloadUsername.textContent = currentUsername;

  const downloadAvatar = document.getElementById("download-avatar");
  if (downloadAvatar) downloadAvatar.textContent = currentAvatarIcon;
}

updateXPDisplay();
updateProfileDisplay();

// ====== ZARZĄDZANIE EKRANAMI I OSTRZEGANIEM ======

const screens = {
  welcome: document.getElementById("screen-welcome"),
  game: document.getElementById("screen-game"),
  stats: document.getElementById("screen-stats"),
  profile: document.getElementById("screen-profile"),
};

const hud = document.querySelector(".hud");
const navButtons = document.querySelectorAll(".nav-btn");

// STAŁE DLA NIESTANDARDOWEGO POPUPA OSTRZEGAWCZEGO
const unsavedPopup = document.getElementById("unsaved-popup");
const unsavedStayBtn = document.getElementById("unsaved-stay-btn");
const unsavedLeaveBtn = document.getElementById("unsaved-leave-btn");

let pendingScreen = null;
let pendingTab = null;

// --- Funkcja wykonująca faktyczne przełączenie ekranu ---
function doScreenChange(name) {
  Object.values(screens).forEach((el) => el.classList.remove("active"));

  if (name === "welcome") {
    hud.style.display = "none";
  } else {
    hud.style.display = "flex";
  }

  const targetId = name === "welcome" ? "screen-welcome" : `screen-${name}`;
  const target = document.getElementById(targetId);
  if (target) target.classList.add("active");

  navButtons.forEach((btn) => {
    const btnScreen = btn.dataset.screen;
    btn.classList.toggle("active", btnScreen === name);
  });

  if (name === "game") {
    // Czas dla przeglądarki na zmianę display: none na block
    setTimeout(() => {
      scrollToCurrentDay();
    }, 100);
  }
}

// --- Funkcja wykonuje faktyczne przełączenie zakładki (po potwierdzeniu) ---
function setActiveProfileTab(tabName) {
  const tabButtons = document.querySelectorAll(".tab-btn");
  const tabContents = {
    badges: document.getElementById("tab-badges"),
    personalization: document.getElementById("tab-personalization"),
  };

  tabButtons.forEach((b) => b.classList.remove("active"));
  const targetBtn = document.querySelector(`.tab-btn[data-tab="${tabName}"]`);
  if (targetBtn) targetBtn.classList.add("active");

  Object.entries(tabContents).forEach(([name, el]) => {
    el.classList.toggle("active", name === tabName);
  });
    // zawsze odśwież widok odznak
    if (tabName === "badges") {
      filterBadges("unlocked");
    }
}

// --- Obsługa przycisków ostrzegawczych ---
if (unsavedStayBtn && unsavedPopup) {
  unsavedStayBtn.addEventListener("click", () => {
    pendingScreen = null;
    pendingTab = null;
    unsavedPopup.classList.remove("active");
  });
}

if (unsavedLeaveBtn && unsavedPopup) {
  unsavedLeaveBtn.addEventListener("click", () => {
    // Utrata zmian w naszym modelu oznacza endPersonalizationEdit(false)
    endPersonalizationEdit(false);

    unsavedPopup.classList.remove("active");

    if (pendingScreen) {
      doScreenChange(pendingScreen);
      pendingScreen = null;
    }
    if (pendingTab) {
      setActiveProfileTab(pendingTab);
      pendingTab = null;
    }
  });
}

function setActiveScreen(name) {
  const profileScreen = document.getElementById("screen-profile");
  const personalizationSection = document.querySelector(
    ".personalization-section",
  );

  // Sprawdzamy, czy opuszczamy EKRAN PROFILU, podczas gdy edycja jest aktywna
  if (
    profileScreen &&
    profileScreen.classList.contains("active") &&
    name !== "profile"
  ) {
    if (
      personalizationSection &&
      personalizationSection.classList.contains("personalization-edit-mode")
    ) {
      pendingScreen = name;
      pendingTab = null;
      unsavedPopup.classList.add("active");
      return;
    }
  }

  // Jeśli tryb edycji nie jest aktywny lub nie opuszczamy profilu, przełączamy ekran
  doScreenChange(name);
  if (name === "game") {
    setTimeout(scrollToCurrentDay, 100);
    setTimeout(scrollToCurrentDay, 300);
  }
  if (name === "stats") {
    renderCalendar();
  }
  if (name === "profile") {
    updateBadgesUI();
    filterBadges("unlocked");

    document.querySelectorAll(".subtab-btn").forEach((btn) => {
      btn.classList.remove("active");
      if (btn.dataset.badgestab === "unlocked") {
        btn.classList.add("active");
      }
    });
  }
}

// Kliknięcie avataru — przejście do profilu
const hudAvatar = document.querySelector(".avatar-circle");

if (hudAvatar) {
  hudAvatar.addEventListener("click", () => {
    setActiveScreen("profile");
  });
}

const startBtn = document.getElementById("start-btn");
if (startBtn) {
  startBtn.addEventListener("click", () => setActiveScreen("game"));
}

navButtons.forEach((btn) => {
  btn.addEventListener("click", (e) => {
    const isWelcomeActive = document
      .getElementById("screen-welcome")
      .classList.contains("active");
    if (isWelcomeActive) {
      return;
    }
    const screenName = btn.dataset.screen;
    setActiveScreen(screenName);
  });
});

setActiveScreen("welcome");

// MAPA MISJI: TRWAŁY STAN I AUTOPROGRES

const missionsMap = document.getElementById("missions-map");

// --- TRWAŁE ZMIENNE STANU MISJI ---
let savedCurrentLevel = parseInt(localStorage.getItem("currentLevel") || "1");

let savedCompletedLevels = JSON.parse(
  localStorage.getItem("completedLevels") || "[]",
);

let lastCompletionDate = localStorage.getItem("lastCompletionDate");

// --- FUNKCJA OBLICZAJĄCA POSTĘP DZIENNY ---

function calculateCurrentLevel() {
  if (!lastCompletionDate) {
    updateStreakUI();
    return;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const lastDate = new Date(lastCompletionDate);
  lastDate.setHours(0, 0, 0, 0);

  const diffTime = today.getTime() - lastDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays > 1) {
    currentStreak = 0;
    localStorage.setItem("currentStreak", 0);
  }

  updateStreakUI();
}

calculateCurrentLevel();

// --- Funkcja zapisująca trwały stan misji ---
function saveMissionState() {
  localStorage.setItem("currentLevel", savedCurrentLevel);
  localStorage.setItem("completedLevels", JSON.stringify(savedCompletedLevels));
  localStorage.setItem("lastCompletionDate", lastCompletionDate);
}

const TOTAL_LEVELS = 30;

function getLevelState(levelNumber) {
  if (savedCompletedLevels.includes(levelNumber)) return "completed";

  const today = new Date().toISOString().split("T")[0];
  const finishedToday = localStorage.getItem("lastCompletionDate") === today;


  if (levelNumber === savedCompletedLevels.length + 1) {
    return finishedToday ? "locked" : "current";
  }

  return "locked";
}

function createMissionNode(levelNumber, state, indexFromBottom) {
  const node = document.createElement("button");
  node.className = "mission-node";
  node.classList.add(state);

  // Co 5 poziomów ustawiamy Bossa
  if (levelNumber % 5 === 0) {
    node.classList.add("boss");
  }

  if (state === "locked") {
    const span = document.createElement("span");
    span.textContent = levelNumber;
    node.appendChild(span);
  } else {
    node.textContent = levelNumber;
  }

  const VERTICAL_GAP = 110;

  // indexFromBottom = 0 to sam dół, rośnie w górę
  const baseTop = 20 + indexFromBottom * VERTICAL_GAP;

  const baseLeftPercent = indexFromBottom % 2 === 0 ? 30 : 65;
  const randomOffset = (Math.random() - 0.5) * 10;
  const leftPercent = Math.max(
    15,
    Math.min(75, baseLeftPercent + randomOffset),
  );

  node.style.top = `${baseTop}px`;
  node.style.left = `${leftPercent}%`;

  // === OBSŁUGA KLIKNIĘCIA  ===

  // Pozwalamy klikać zarówno w AKTUALNE jak i UKOŃCZONE
  if (state === "current" || state === "completed") {
    node.addEventListener("click", () => {
      const list = document.getElementById("mission-list");
      const title = document.querySelector("#missions-popup h2");

      // SCENARIUSZ A: Misja Ukończona (Stara)
      if (state === "completed") {
        title.textContent = `Dzień ${levelNumber} – Ukończony`;

        list.innerHTML = `
          <div style="text-align:center; padding: 0.5rem 0 1.5rem;">
            <div style="font-size: 4rem; margin-bottom: 1rem; text-shadow: 0 0 30px rgba(255, 215, 0, 0.6);">🏆</div>
            <p style="font-size: 1.1rem; font-weight: bold; margin-bottom: 0.5rem;">Misja wykonana!</p>
            <p style="color: #9ca3af; font-size: 0.95rem;">Ten etap masz już za sobą. Pnij się dalej w górę!</p>
          </div>
        `;

        if (missionDoneBtn) missionDoneBtn.style.display = "none";

        document.getElementById("missions-popup").classList.add("active");
      }

      // SCENARIUSZ B: Misja Aktualna (Dzisiejsza)
      else if (state === "current") {
        title.textContent = "Twoje dzisiejsze misje";

        list.innerHTML = "";
        const todayStr = new Date().toISOString().split("T")[0];
        const storageKey = "dailyMissions_" + todayStr;
        const saved = localStorage.getItem(storageKey);
        const missions = saved ? JSON.parse(saved) : [];

        if (missions.length === 0) {
          list.innerHTML = "<li>Brak zapisanych zadań dla tego dnia</li>";
        } else {
          missions.forEach((m) => {
            const li = document.createElement("li");
            li.textContent = "✔ " + m.text;
            list.appendChild(li);
          });
        }

        if (missionDoneBtn) missionDoneBtn.style.display = "block";

        openMissionPopup(node);
      }
    });
  }
  return node;
}

const missionsWrapper = document.querySelector(".missions-wrapper");

if (missionsMap) {
  missionsMap.innerHTML = "";
  const VERTICAL_GAP = 110;
  // poziom to liczba ukończonych misji + 1
  const stats = loadUserStats();
  savedCurrentLevel = stats.completedMissions + 1;

  for (let level = 1; level <= TOTAL_LEVELS; level++) {
    const state = getLevelState(level);
    const indexFromBottom = TOTAL_LEVELS - level;
    const node = createMissionNode(level, state, indexFromBottom);

    missionsMap.appendChild(node);
  }

  const totalHeight = 20 + (TOTAL_LEVELS - 1) * VERTICAL_GAP + 120;
  missionsMap.style.height = `${totalHeight}px`;

  // Tutaj NIE wywołujemy scrollToCurrentDay(), bo ekran jest ukryty
}

// ====== Zakładki w profilu ======

const tabButtons = document.querySelectorAll(".tab-btn");
const tabContents = {
  badges: document.getElementById("tab-badges"),
  personalization: document.getElementById("tab-personalization"),
};

tabButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    const tabName = btn.dataset.tab;

    const personalizationSection = document.querySelector(
      ".personalization-section",
    );

    // Logika 1: Sprawdź, czy opuszczamy zakładkę personalizacji I czy jest aktywna edycja
    if (
      personalizationSection.classList.contains("active") &&
      tabName !== "personalization"
    ) {
      if (
        personalizationSection.classList.contains("personalization-edit-mode")
      ) {
        // Popup z ostrzezeniem
        pendingScreen = null;
        pendingTab = tabName;
        unsavedPopup.classList.add("active");
        return;
      }
    }

    // Logika 2: Jeśli nie ma edycji, przełączamy zakładkę
    setActiveProfileTab(tabName);
  });
});

// ====== POPUP EDYCJI PROFILU (Avatar/Nick) ======

const profileEditBtn = document.getElementById("profile-edit-btn");
const profileEditPopup = document.getElementById("profile-edit-popup");
const profileEditCloseBtn = document.getElementById("profile-edit-close-btn");
const profileSaveBtn = document.getElementById("profile-save-btn");
const profileCancelBtn = document.getElementById("profile-cancel-btn");

const avatarSelectionRow = document.getElementById("avatar-selection-row");
const usernameInput = document.getElementById("username-input");

let tempAvatarIcon = currentAvatarIcon;
let tempUsername = currentUsername;

// Ładowanie stanu do popupa
function loadProfileStateToPopup() {
  tempAvatarIcon = currentAvatarIcon;
  tempUsername = currentUsername;

  usernameInput.value = tempUsername;

  const avatarPills = avatarSelectionRow.querySelectorAll(".avatar-pill");
  avatarPills.forEach((pill) => {
    pill.classList.remove("active");
    if (pill.dataset.icon === tempAvatarIcon) {
      pill.classList.add("active");
    }
  });
}

// --- 1. Otwarcie Popupa ---
if (profileEditBtn) {
  profileEditBtn.addEventListener("click", () => {
    loadProfileStateToPopup();
    profileEditPopup.classList.add("active");
  });
}

// --- 2. Wybór Avatara (aktualizuje tempAvatarIcon) ---
if (avatarSelectionRow) {
  avatarSelectionRow.addEventListener("click", (e) => {
    const target = e.target.closest(".avatar-pill");
    if (!target) return;

    const avatarPills = avatarSelectionRow.querySelectorAll(".avatar-pill");
    avatarPills.forEach((p) => p.classList.remove("active"));
    target.classList.add("active");

    tempAvatarIcon = target.dataset.icon;
  });
}

// --- 3. Zmiana Nicka (aktualizuje tempUsername) ---
if (usernameInput) {
  usernameInput.addEventListener("input", (e) => {
    tempUsername = e.target.value;
  });
}

// --- 4. Zapis Zmian (tylko na przycisk Save) ---
if (profileSaveBtn) {
  profileSaveBtn.addEventListener("click", () => {
    currentAvatarIcon = tempAvatarIcon;
    currentUsername = tempUsername.trim() || DEFAULT_USERNAME;

    saveProfile();
    profileEditPopup.classList.remove("active");
    showInfoPopup(
      "Zapisano zmiany",
      "Twój nick i avatar zostały pomyślnie zapisane.",
    );
  });
}

// --- 5. Anulowanie (przycisk Cancel, X lub ESC) ---
function cancelProfileChanges() {
  profileEditPopup.classList.remove("active");
}

if (profileCancelBtn) {
  profileCancelBtn.addEventListener("click", () => {
    askForConfirmation(() => {
      cancelProfileChanges();
    });
  });
}

if (profileEditCloseBtn) {
  profileEditCloseBtn.addEventListener("click", cancelProfileChanges);
}

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && profileEditPopup.classList.contains("active")) {
    e.preventDefault();
    cancelProfileChanges();
  }
});

// ====== Personalizacja (Jawny Zapis/Anuluj) ======

const personalizationSection = document.querySelector(
  ".personalization-section",
);
const editPersonalizationBtn = document.getElementById(
  "edit-personalization-btn",
);
const personalizationActions = document.getElementById(
  "personalization-actions",
);
const personalizationSaveBtn = document.getElementById(
  "personalization-save-btn",
);
const personalizationCancelBtn = document.getElementById(
  "personalization-cancel-btn",
);

let originalPillStates = {};

function restoreDefaultPersonalizationUI() {
  document.querySelectorAll(".settings-group").forEach((group) => {
    const row = group.querySelector(".pill-row");
    if (!row) return;

    const category = row.dataset.setting;
    const defaults = DEFAULT_PERSONALIZATION[category] || [];

    row.querySelectorAll(".pill").forEach((pill) => {
      pill.classList.toggle(
        "active",
        defaults.includes(pill.textContent.trim()),
      );
    });
  });
}

// Kończy tryb edycji personalizacji (zapisuje lub przywraca stan początkowy).
function endPersonalizationEdit(saveChanges) {
  const personalizationSection = document.querySelector(
    ".personalization-section",
  );
  const personalizationActions = document.getElementById(
    "personalization-actions",
  );
  const editPersonalizationBtn = document.getElementById(
    "edit-personalization-btn",
  );

  if (!personalizationSection.classList.contains("personalization-edit-mode")) {
    return;
  }

  personalizationSection.classList.remove("personalization-edit-mode");
  personalizationActions.style.display = "none";
  editPersonalizationBtn.style.boxShadow = "";

  if (!saveChanges) {
    // Anulowanie - przywracamy poprzedni stan
    document.querySelectorAll(".pill-row").forEach((row, index) => {
      const rowId = "row-" + index;
      if (originalPillStates[rowId]) {
        row.querySelectorAll(".pill").forEach((pill, pillIndex) => {
          pill.classList.toggle("active", originalPillStates[rowId][pillIndex]);
        });
      }
    });
  } else {
    const selections = {};
  
    document.querySelectorAll(".settings-group").forEach((group) => {
      const row = group.querySelector(".pill-row");
      if (!row) return;
  
      const category = row.dataset.setting;
      const activePills = [...row.querySelectorAll(".pill.active")].map(
        (p) => p.textContent.trim(),
      );
  
      selections[category] = activePills;
    });
  
    // niepoprawne - przywracamy domyslne ustawienia
    if (
      !selections.goals?.length ||
      !selections.muscles?.length
    ) {
      showInfoPopup(
        "Niepoprawna personalizacja",
        "Musisz wybrać co najmniej jeden cel treningu oraz jedną partię mięśniową.\n\nPrzywrócono ustawienia domyślne.",
      );
  
      restoreDefaultPersonalizationUI();
      endPersonalizationEdit(false);
      return;
    }
  
    // poprawne wiec zapisujemy
    localStorage.setItem(
      "personalizationSettings",
      JSON.stringify(selections),
    );
    localStorage.setItem("hasSavedPersonalization", "true");
  
    checkBadges();
  
    showInfoPopup(
      "Zapisano personalizację",
      "Twoje preferencje zostały zapisane i będą używane przy losowaniu misji.",
    );
  }
}

// ---  Obsługa Ołówka (Start Edycji/Anuluj) ---
if (editPersonalizationBtn && personalizationSection) {
  editPersonalizationBtn.addEventListener("click", () => {
    let editMode = personalizationSection.classList.contains(
      "personalization-edit-mode",
    );

    if (!editMode) {
      // --- START EDYCJI ---
      document.querySelectorAll(".pill-row").forEach((row, index) => {
        const rowId = "row-" + index;
        originalPillStates[rowId] = [];
        row.querySelectorAll(".pill").forEach((pill) => {
          originalPillStates[rowId].push(pill.classList.contains("active"));
        });
      });

      personalizationSection.classList.add("personalization-edit-mode");
      personalizationActions.style.display = "flex";
      editPersonalizationBtn.style.boxShadow =
        "0 0 26px rgba(56, 189, 248, 0.9)";
      showInfoPopup(
        "Tryb personalizacji",
        "Możesz teraz zmienić swoje cele, poziom trudności i partie mięśniowe.",
      );
    } else {
      // --- KLIKNIĘCIE OŁÓWKA W TRAKCIE EDYCJI = ANULUJ ---
      endPersonalizationEdit(false);
      showInfoPopup(
        "Zmiany anulowane",
        "Twoje ustawienia personalizacji nie zostały zapisane.",
      );
    }
  });
}

// ---  Obsługa przycisków Zapisz/Anuluj ---
if (personalizationSaveBtn) {
  personalizationSaveBtn.addEventListener("click", () => {
    endPersonalizationEdit(true);
  });
}

if (personalizationCancelBtn) {
  personalizationCancelBtn.addEventListener("click", () => {
    askForConfirmation(() => {
      endPersonalizationEdit(false);

      setTimeout(() => {
        showInfoPopup(
          "Zmiany anulowane",
          "Twoje ustawienia personalizacji nie zostały zapisane.",
        );
      }, 200);
    });
  });
}

// ---  Przełączanie aktywności pill-i (wymaga trybu edycji) ---
document.querySelectorAll(".pill-row").forEach((row) => {
  row.addEventListener("click", (e) => {
    const target = e.target;
    if (!target.classList.contains("pill")) return;

    // jeżeli rodzic jest w trybie edycji, pozwalamy zmieniać zaznaczenie
    const section = target.closest(".personalization-section");
    if (!section || !section.classList.contains("personalization-edit-mode")) {
      return;
    }

    // w jednym rzędzie może być wiele aktywnych (np. partie mięśniowe)
    if (row.classList.contains("pill-row-wrap")) {
      target.classList.toggle("active");
    } else {
      row
        .querySelectorAll(".pill")
        .forEach((p) => p.classList.remove("active"));
      target.classList.add("active");
    }
  });
});

// ODZNAKI

const badgeSubTabs = document.querySelectorAll(".subtab-btn");
badgeSubTabs.forEach((btn) => {
  btn.addEventListener("click", () => {
    // Active state przycisków
    badgeSubTabs.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");

    // Filtrowanie odznak
    const view = btn.dataset.badgestab; // "unlocked" albo "locked"
    filterBadges(view);
  });
});

// ============ zestaw zadan do losowania na podstawie personalizacji =====
const MISSION_POOL = [
  // ===== BRZUCH =====
  {
    text: "20 brzuszków",
    difficulty: "Podstawowy",
    muscles: ["Brzuch"],
    goals: ["Kondycja"],
  },
  {
    text: "30 brzuszków",
    difficulty: "Zaawansowany",
    muscles: ["Brzuch"],
    goals: ["Kondycja"],
  },
  {
    text: "30 sekund deski",
    difficulty: "Podstawowy",
    muscles: ["Brzuch"],
    goals: ["Kondycja"],
  },
  {
    text: "60 sekund deski",
    difficulty: "Zaawansowany",
    muscles: ["Brzuch"],
    goals: ["Kondycja"],
  },
  {
    text: "40 russian twists",
    difficulty: "Zaawansowany",
    muscles: ["Brzuch"],
    goals: ["Kondycja"],
  },

  // ===== NOGI =====
  {
    text: "20 przysiadów",
    difficulty: "Podstawowy",
    muscles: ["Nogi"],
    goals: ["Więcej ruchu"],
  },
  {
    text: "40 przysiadów",
    difficulty: "Zaawansowany",
    muscles: ["Nogi"],
    goals: ["Kondycja"],
  },
  {
    text: "30 wykroków",
    difficulty: "Podstawowy",
    muscles: ["Nogi"],
    goals: ["Mobilność"],
  },
  {
    text: "50 wykroków",
    difficulty: "Zaawansowany",
    muscles: ["Nogi"],
    goals: ["Kondycja"],
  },
  {
    text: "20 wspięć na palce",
    difficulty: "Podstawowy",
    muscles: ["Nogi"],
    goals: ["Mobilność"],
  },
  {
    text: "40 przysiadów sumo",
    difficulty: "Zaawansowany",
    muscles: ["Nogi"],
    goals: ["Kondycja"],
  },

  // ===== RĘCE =====
  {
    text: "10 pompek z oparciem na kolanach",
    difficulty: "Podstawowy",
    muscles: ["Ręce"],
    goals: ["Kondycja"],
  },
  {
    text: "25 pompek",
    difficulty: "Zaawansowany",
    muscles: ["Ręce"],
    goals: ["Kondycja"],
  },
  {
    text: "30 sekund podporu bokiem",
    difficulty: "Podstawowy",
    muscles: ["Ręce"],
    goals: ["Mobilność"],
  },
  {
    text: "45 sekund podporu bokiem",
    difficulty: "Zaawansowany",
    muscles: ["Ręce"],
    goals: ["Kondycja"],
  },

  // ===== PLECY =====
  {
    text: "2 minuty mobilizacji pleców",
    difficulty: "Podstawowy",
    muscles: ["Plecy"],
    goals: ["Mobilność"],
  },
  {
    text: "3 minuty mobilizacji pleców",
    difficulty: "Zaawansowany",
    muscles: ["Plecy"],
    goals: ["Mobilność"],
  },

  // ===== POŚLADKI =====
  {
    text: "20 mostków biodrowych",
    difficulty: "Podstawowy",
    muscles: ["Pośladki"],
    goals: ["Kondycja"],
  },
  {
    text: "40 mostków biodrowych",
    difficulty: "Zaawansowany",
    muscles: ["Pośladki"],
    goals: ["Kondycja"],
  },

  // ===== MOBILNOŚĆ / REGENERACJA =====
  {
    text: "5 minut rozciągania bioder",
    difficulty: "Podstawowy",
    muscles: ["Pośladki"],
    goals: ["Mobilność"],
  },
  {
    text: "15 minut rozciągania bioder",
    difficulty: "Zaawansowany",
    muscles: ["Pośladki"],
    goals: ["Mobilność"],
  },
  {
    text: "10 minut rozciągania mięśni nóg",
    difficulty: "Podstawowy",
    muscles: ["Plecy"],
    goals: ["Mobilność"],
  },
  {
    text: "20 minut rozciągania mięśni nóg",
    difficulty: "Zaawansowany",
    muscles: ["Plecy"],
    goals: ["Mobilność"],
  },

  // ===== CARDIO / OGÓLNE =====
  {
    text: "30 minut spaceru",
    difficulty: "Podstawowy",
    muscles: ["Nogi"],
    goals: ["Więcej ruchu"],
  },
  {
    text: "15 minut szybkiego marszu",
    difficulty: "Zaawansowany",
    muscles: ["Nogi"],
    goals: ["Więcej ruchu"],
  },
  {
    text: "30 pajacyków",
    difficulty: "Podstawowy",
    muscles: ["Nogi"],
    goals: ["Kondycja"],
  },
  {
    text: "60 pajacyków",
    difficulty: "Zaawansowany",
    muscles: ["Nogi"],
    goals: ["Kondycja"],
  },

  // ===== BOSS BATTLES =====
  {
    text: "100 pajacyków (Seria Bossa)",
    difficulty: "Boss",
    muscles: ["Nogi", "Kondycja"],
    goals: ["Kondycja"],
  },
  {
    text: "2 minuty deski (Plank)",
    difficulty: "Boss",
    muscles: ["Brzuch"],
    goals: ["Kondycja"],
  },
  {
    text: "50 przysiadów",
    difficulty: "Boss",
    muscles: ["Nogi"],
    goals: ["Więcej ruchu"],
  },
  {
    text: "30 pompek",
    difficulty: "Boss",
    muscles: ["Ręce"],
    goals: ["Kondycja"],
  },
  {
    text: "5 minut biegu w miejscu",
    difficulty: "Boss",
    muscles: ["Nogi"],
    goals: ["Kondycja"],
  },
  {
    text: "40 brzuszków",
    difficulty: "Boss",
    muscles: ["Brzuch"],
    goals: ["Kondycja"],
  },
  {
    text: "Trzymaj 'krzesełko' przy ścianie przez 90s",
    difficulty: "Boss",
    muscles: ["Nogi"],
    goals: ["Kondycja"],
  },
];

// losowanie misji
function getPersonalizedMissions(isBossLevel = false) {
  // Jeśli to poziom Bossa, losujemy TYLKO trudne zadania
  if (isBossLevel) {
    const bossMissions = MISSION_POOL.filter((m) => m.difficulty === "Boss");

    // Zabezpieczenie: jakby brakowało misji Bossa, dobierz trudne zwykłe
    if (bossMissions.length < 3) {
      const hardMissions = MISSION_POOL.filter(
        (m) => m.difficulty === "Zaawansowany",
      );
      return [...bossMissions, ...hardMissions]
        .sort(() => Math.random() - 0.5)
        .slice(0, 3);
    }

    return bossMissions.sort(() => Math.random() - 0.5).slice(0, 3);
  }

  // Jeśli to zwykły dzień, działamy po staremu (filtry użytkownika)
  let settings = JSON.parse(
    localStorage.getItem("personalizationSettings") || "{}",
  );

  if (!settings.difficulty || !settings.muscles || !settings.goals) {
    settings = {
      difficulty: ["Podstawowy"],
      muscles: ["Brzuch"],
      goals: ["Kondycja"],
    };
  }

  let filtered = MISSION_POOL.filter((m) => {
    // W zwykłe dni nie losujemy zadań Bossa
    if (m.difficulty === "Boss") return false;

    const diffMatch = settings.difficulty.includes(m.difficulty);
    const muscleMatch = m.muscles.some((x) => settings.muscles.includes(x));
    const goalMatch = m.goals.some((x) => settings.goals.includes(x));

    return diffMatch && muscleMatch && goalMatch;
  });

  if (filtered.length < 3) {
    filtered = MISSION_POOL.filter(
      (m) =>
        settings.difficulty.includes(m.difficulty) && m.difficulty !== "Boss",
    );
  }

  return filtered.sort(() => Math.random() - 0.5).slice(0, 3);
}

// liczenie ile xp za dzienna misje
function calculateXpForMissions(missions) {
  let xp = 0;

  missions.forEach((m) => {
    if (m.difficulty === "Zaawansowany") {
      xp += 50;
    } else {
      xp += 30;
    }
  });

  return xp;
}

// Popup misji: otwiera okno i aktualizuje stan dnia (licznik otwarć, popup ostrzegawczy, zapis do localStorage).
const popup = document.getElementById("missions-popup");
const missionDoneBtn = document.getElementById("mission-done-btn");

function openMissionPopup(node) {
  if (!missionCompletedToday) {
    missionOpenCountToday++;
    localStorage.setItem("missionOpenCountToday", missionOpenCountToday);
  }
  if (
    missionOpenCountToday >= 5 &&
    !missionCompletedToday &&
    !shownProcrastinationPopupToday
  ) {
    const iconEl = document.querySelector("#info-popup .levelup-icon");

    const originalIcon = iconEl.textContent;
    iconEl.textContent = "😕";

    showInfoPopup(
      "Misja sama się nie zrobi",
      "To już kolejny raz, gdy zaglądasz do misji, ale jej nie kończysz. Twój progres czeka...",
    );

    const okBtn = document.getElementById("info-popup-ok");
    const closeBtn = document.getElementById("info-popup-close");

    const restoreIcon = () => {
      iconEl.textContent = originalIcon;
    };

    okBtn.addEventListener("click", restoreIcon, { once: true });
    closeBtn.addEventListener("click", restoreIcon, { once: true });

    shownProcrastinationPopupToday = true;
    localStorage.setItem("shownProcrastinationPopupToday", todayKey);
  }
  popup.classList.add("active");

  // Jeśli misja jest już completed → ukryj DONE
  if (node.classList.contains("completed")) {
    missionDoneBtn.style.display = "none";
  } else {
    missionDoneBtn.style.display = "block";
  }

  // Oznacz jako current (jeśli NIE completed)
  if (!node.classList.contains("completed")) {
    document
      .querySelectorAll(".mission-node")
      .forEach((n) => n.classList.remove("current"));
    node.classList.add("current");
  }
}

if (missionDoneBtn) {
  missionDoneBtn.addEventListener("click", () => {
    // Dodanie bonusow
    if (!window.currentMissions || window.currentMissions.length === 0) {
      console.warn("Brak aktywnych misji – XP nie zostało naliczone");
      return;
    }
    let earnedXp;
    if (window.isBossDayToday) {
      earnedXp = 185; // stałą nagroda za Boss Day
    } else {
      earnedXp = calculateXpForMissions(window.currentMissions);
    }
    const todayStr = new Date().toISOString().split("T")[0];
    window.lastEarnedXp = earnedXp;
    window.lastXpDay = todayStr;
    addXP(earnedXp);
    showXpPopup(earnedXp);
    updateStatsAfterMission();
    increaseStreak();
    checkBadges();

    if (!savedCompletedLevels.includes(savedCurrentLevel)) {
      savedCompletedLevels.push(savedCurrentLevel);
    }

    // Zapisujemy dzisiejszą datę jako datę ostatniego ukończenia
    const today = new Date().toISOString().split("T")[0];
    let activityLog = JSON.parse(localStorage.getItem("activityLog") || "[]");

    if (!activityLog.includes(today)) {
      activityLog.push(today);
      localStorage.setItem("activityLog", JSON.stringify(activityLog));
    }
    lastCompletionDate = today;
    localStorage.setItem("lastCompletionDate", today);
    renderCalendar();

    saveMissionState();

    popup.classList.remove("active");

    const currentNode = document.querySelector(".mission-node.current");
    if (currentNode) {
      currentNode.classList.remove("current");
      currentNode.classList.add("completed");
    }

    missionDoneBtn.style.display = "none";

    missionCompletedToday = true;
    localStorage.setItem("missionCompletedToday", todayKey);

    missionOpenCountToday = 0;
    localStorage.removeItem("missionOpenCountToday");
    localStorage.removeItem("shownProcrastinationPopupToday");
  });
}

// ===== POPUP misji: zamknięcie (X) =====
const closeBtn = document.getElementById("mission-close-btn");

closeBtn.addEventListener("click", () => {
  document.getElementById("missions-popup").classList.remove("active");
});

// ===== POPUP odznaki: podgląd szczegółów =====
const badgePopup = document.getElementById("badge-popup");
const badgeCloseBtn = document.getElementById("badge-close-btn");
const badgeDownloadBtn = document.getElementById("badge-download-btn");
const popupBadgeIcon = document.getElementById("popup-badge-icon");
const popupBadgeTitle = document.getElementById("popup-badge-title");
const popupBadgeDesc = document.getElementById("popup-badge-desc");

document.querySelectorAll(".badge-card.unlocked").forEach((card) => {
  card.style.cursor = "pointer";
  card.addEventListener("click", () => {
    const icon = card.querySelector(".badge-icon")?.textContent || "⭐";
    const title = card.querySelector(".badge-title")?.textContent || "Odznaka";

    const description = card.dataset.desc || "Brak opisu.";

    popupBadgeIcon.textContent = icon;
    popupBadgeTitle.textContent = title;

    if (popupBadgeDesc) {
      popupBadgeDesc.textContent = description;
    }

    badgePopup.classList.add("active");
  });
});

if (badgeCloseBtn) {
  badgeCloseBtn.addEventListener("click", () => {
    badgePopup.classList.remove("active");
  });
}

// ===== POPUP POBIERANIA ODZNAKI =====
const badgeDownloadPopup = document.getElementById("badge-download-popup");
const badgeDownloadCloseBtn = document.getElementById(
  "badge-download-close-btn",
);
const finalBadgeDownloadBtn = document.getElementById(
  "final-badge-download-btn",
);
const downloadBadgeTitleEl = document.getElementById("download-badge-title");
const downloadBadgeIconEl = document.getElementById("download-badge-icon");
const downloadUsernameEl = document.getElementById("download-username");
const downloadAvatarEl = document.getElementById("download-avatar");

if (badgeDownloadBtn) {
  badgeDownloadBtn.addEventListener("click", () => {
    downloadBadgeTitleEl.textContent =
      popupBadgeTitle?.textContent || "Odznaka";
    downloadBadgeIconEl.textContent = popupBadgeIcon?.textContent || "⭐";
    const profileUsernameNode = document.getElementById("profile-username");
    downloadUsernameEl.textContent =
      profileUsernameNode?.textContent?.trim() || "Nick";
    const hudAvatar = document.querySelector(".avatar-circle");
    if (hudAvatar && downloadAvatarEl) {
      downloadAvatarEl.textContent = hudAvatar.textContent;
      const cs = getComputedStyle(hudAvatar);
      // Przeniesienie stylu tła/ramki/cienia z HUD Avatar do Download Avatar
      downloadAvatarEl.style.background =
        cs.background || cs.backgroundImage || "";
      downloadAvatarEl.style.border = cs.border;
      downloadAvatarEl.style.boxShadow = cs.boxShadow;
    }
    badgeDownloadPopup.classList.add("active");
  });
}

if (badgeDownloadCloseBtn) {
  badgeDownloadCloseBtn.addEventListener("click", () => {
    badgeDownloadPopup.classList.remove("active");
  });
}

if (finalBadgeDownloadBtn) {
  finalBadgeDownloadBtn.addEventListener("click", () => {
    const title = downloadBadgeTitleEl?.textContent || "Odznaka";
    const username = downloadUsernameEl?.textContent || "Nick";
    const icon = downloadBadgeIconEl?.textContent || "⭐";
    const avatarText = downloadAvatarEl?.textContent || "";
    const desc = popupBadgeDesc?.textContent?.trim() || "";

  // SVG jest renderowane niezależnie od runtime’owych zmian tła w CSS/JS, więc używamy stałych gradientów.

    const svgContent = `
<svg xmlns="http://www.w3.org/2000/svg" width="800" height="500">
  <defs>
    <radialGradient id="avatarGrad" cx="30%" cy="0%">
      <stop offset="0%" stop-color="#facc15"/>
      <stop offset="100%" stop-color="#fb923c"/>
    </radialGradient>
    <linearGradient id="badgeBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1f2937"/>
      <stop offset="100%" stop-color="#0b0d13"/>
    </linearGradient>
  </defs>
  
  <rect width="100%" height="100%" fill="#11131b"/>
  
  <text x="50%" y="80" text-anchor="middle" font-size="42" fill="#ffffff" font-family="Segoe UI, sans-serif">${title}</text>
  
  <rect x="340" y="120" width="120" height="120" rx="18" fill="url(#badgeBg)" stroke="#c084fc" stroke-width="3"/>
  
  <text x="400" y="200" text-anchor="middle" font-size="64" fill="#c084fc">${icon}</text>
  
  <circle cx="320" cy="300" r="36" fill="url(#avatarGrad)" stroke="#f8fafc" stroke-width="3"/>
  <text x="320" y="300" text-anchor="middle" dominant-baseline="middle" font-size="18" font-weight="800" fill="#0b0d13">${avatarText}</text>
  
  <text x="390" y="310" font-size="24" fill="#ffffff" font-family="Segoe UI, sans-serif">${username}</text>
  <text x="50%" y="400" text-anchor="middle" font-size="18" fill="#9ca3af" font-family="Segoe UI, sans-serif">${desc}</text>
  <text x="50%" y="470" text-anchor="middle" font-size="16" fill="#9ca3af">FitGame — odznaka użytkownika</text>
</svg>`;

    const svgBlob = new Blob([svgContent], {
      type: "image/svg+xml;charset=utf-8",
    });
    const url = URL.createObjectURL(svgBlob);

    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;

      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);

      canvas.toBlob((pngBlob) => {
        const pngUrl = URL.createObjectURL(pngBlob);
        const a = document.createElement("a");
        a.href = pngUrl;
        a.download = `${title} - ${username}.png`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(pngUrl);
      });
    };

    img.src = url;
  });
}

// Wykresy w statystykach

let missionsCompletionChart, muscleGroupsChart;

function initCharts() {
  const completionCtx = document
    .getElementById("missionsCompletionChart")
    .getContext("2d");

  missionsCompletionChart = new Chart(completionCtx, {
    type: "doughnut",
    data: {
      labels: ["Ukończone", "Pominięte"],
      datasets: [
        {
          data: [userStats.completedMissions, userStats.missedMissions],
          backgroundColor: ["#4ade80", "#fb7185"],
        },
      ],
    },
    options: {
      cutout: "65%",
      plugins: {
        legend: { labels: { color: "#f9fafb" } },
      },
    },
  });

  const muscleCtx = document
    .getElementById("muscleGroupsChart")
    .getContext("2d");

  muscleGroupsChart = new Chart(muscleCtx, {
    type: "doughnut",
    data: {
      labels: ["Pośladki", "Ręce", "Plecy", "Brzuch", "Nogi"],
      datasets: [
        {
          data: [
            userStats.muscleGroups.glutes,
            userStats.muscleGroups.arms,
            userStats.muscleGroups.back,
            userStats.muscleGroups.abs,
            userStats.muscleGroups.legs,
          ],
          backgroundColor: [
            "#ec4899",
            "#38bdf8",
            "#a855f7",
            "#fb923c",
            "#22c55e",
          ],
        },
      ],
    },
    options: {
      cutout: "65%",
      plugins: {
        legend: { labels: { color: "#f9fafb" } },
      },
    },
  });
}

initCharts();

function getSelectedMusclesFromPersonalization() {
  const pills = document.querySelectorAll(
    '[data-setting="muscles"] .pill.active',
  );

  return [...pills]
    .map((pill) => MUSCLE_MAP[pill.textContent.trim()])
    .filter(Boolean);
}

function updateStatsAfterMission() {
  // Aktualizacja statystyk po ukończeniu misji (liczniki + progres miesni).
  userStats.completedMissions++;

  // Missed = dni w grze minus dni z ukończoną misją (nigdy poniżej 0).
  userStats.missedMissions = Math.max(
    0,
    userStats.daysInGame - userStats.completedMissions,
  );

  const selectedMuscles = getSelectedMusclesFromPersonalization();

  selectedMuscles.forEach((muscleKey) => {
    if (userStats.muscleGroups.hasOwnProperty(muscleKey)) {
      userStats.muscleGroups[muscleKey]++;
    }
  });

  saveUserStats(userStats);

  updateStatsCards();

  // AKTUALIZACJA WYKRESÓW (Chart.js)

  // Wykres ukończone vs pominięte
  if (missionsCompletionChart) {
    missionsCompletionChart.data.datasets[0].data = [
      userStats.completedMissions,
      userStats.missedMissions,
    ];
    missionsCompletionChart.update();
  }

  // Wykres partii mięśniowych
  if (muscleGroupsChart) {
    muscleGroupsChart.data.datasets[0].data = [
      userStats.muscleGroups.glutes,
      userStats.muscleGroups.arms,
      userStats.muscleGroups.back,
      userStats.muscleGroups.abs,
      userStats.muscleGroups.legs,
    ];
    muscleGroupsChart.update();
  }
}

// Zwiększamy aktualną passę; jeśli to nowy rekord, aktualizuje longestStreak i zapisuje statystyki.
function increaseStreak() {
  currentStreak++;
  localStorage.setItem("currentStreak", currentStreak);

  if (currentStreak > userStats.longestStreak) {
    userStats.longestStreak = currentStreak;
    saveUserStats(userStats);
  }

  updateStreakUI();
}

// Odświeżamy wyświetlanie passy: HUD (aktualna) oraz statystyki (rekord).
function updateStreakUI() {
  const hudStreak = document.getElementById("hud-streak");
  if (hudStreak) hudStreak.textContent = `🔥 ${currentStreak}`;

  const streakEl = document.getElementById("longestStreak");
  if (streakEl) streakEl.textContent = `${userStats.longestStreak} 🔥`;
}

// Wczytujemy zapisane preferencje z localStorage i odtwarza stan "pill" w UI (po data-setting).
function loadPersonalizationSettings() {
  const saved = localStorage.getItem("personalizationSettings");
  if (!saved) return;

  const settings = JSON.parse(saved);

  // Przechodzimy przez każdą zapisaną kategorię (difficulty, goals, muscles)
  Object.keys(settings).forEach((category) => {
    const row = document.querySelector(`[data-setting="${category}"]`);
    if (row) {
      row
        .querySelectorAll(".pill")
        .forEach((p) => p.classList.remove("active"));

      // Dodajemy klasę active tylko tym przyciskom, które były zapisane
      row.querySelectorAll(".pill").forEach((p) => {
        if (settings[category].includes(p.textContent.trim())) {
          p.classList.add("active");
        }
      });
    }
  });
}

// Inicjalizacja UI personalizacji: odtwarzamy zapisane ustawienia przed generowaniem misji.
loadPersonalizationSettings();

(function initDailyMissions() {
  const todayStr = new Date().toISOString().split("T")[0];
  const storageKey = "dailyMissions_" + todayStr;

  if (!localStorage.getItem(storageKey)) {
    const currentLevel = parseInt(localStorage.getItem("currentLevel") || "1");

    const isBossFight = currentLevel % 5 === 0;
    window.isBossDayToday = isBossFight;

    const missions = getPersonalizedMissions(isBossFight);

    localStorage.setItem(storageKey, JSON.stringify(missions));
    window.currentMissions = missions;
  } else {
    window.currentMissions = JSON.parse(localStorage.getItem(storageKey));
  }
})();

let viewDate = new Date();

function renderCalendar() {
  const grid = document.getElementById("calendar-grid");
  const monthDisplay = document.getElementById("current-month-display");

  // Jeśli brakuje któregoś elementu, nie przerywaj całego skryptu, tylko wyjdź z funkcji
  if (!grid || !monthDisplay) return;

  grid.innerHTML = ""; // Czyścimy starą siatkę

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const monthNames = [
    "Styczeń",
    "Luty",
    "Marzec",
    "Kwiecień",
    "Maj",
    "Czerwiec",
    "Lipiec",
    "Sierpień",
    "Wrzesień",
    "Październik",
    "Listopad",
    "Grudzień",
  ];
  monthDisplay.textContent = `${monthNames[month]} ${year}`;

  // Obliczanie przesunięcia (offset)
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const offset = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

  // Dodawanie pustych pól
  for (let i = 0; i < offset; i++) {
    const blank = document.createElement("div");
    blank.classList.add("calendar-day-blank");
    grid.appendChild(blank);
  }

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const activityLog = JSON.parse(localStorage.getItem("activityLog") || "[]");

  for (let i = 1; i <= daysInMonth; i++) {
    const dayDiv = document.createElement("div");
    dayDiv.classList.add("calendar-day");
    dayDiv.textContent = i;

    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(
      i,
    ).padStart(2, "0")}`;
    const isDone = activityLog.includes(dateStr);

    if (isDone) {
      dayDiv.classList.add("active");
    }

    dayDiv.setAttribute(
      "data-status",
      isDone ? "Misja wykonana ✅" : "Brak aktywności",
    );

    grid.appendChild(dayDiv);
  }
}

// Obsługa przycisków
document.addEventListener("DOMContentLoaded", () => {
  renderCalendar();

  document.getElementById("prev-month")?.addEventListener("click", () => {
    viewDate.setMonth(viewDate.getMonth() - 1);
    renderCalendar();
  });

  document.getElementById("next-month")?.addEventListener("click", () => {
    viewDate.setMonth(viewDate.getMonth() + 1);
    renderCalendar();
  });
});

updateBadgesUI();
filterBadges("unlocked");
attachBadgeTooltips();

// --- UNIWERSALNA FUNKCJA POTWIERDZENIA ---
const confirmationPopup = document.getElementById("confirmation-popup");
const confirmYesBtn = document.getElementById("confirm-yes-btn");
const confirmNoBtn = document.getElementById("confirm-no-btn");

let pendingAction = null;

function askForConfirmation(actionCallback) {
  pendingAction = actionCallback;

  confirmationPopup.classList.add("active");
}

// Obsługa przycisku "TAK, ANULUJ"
if (confirmYesBtn) {
  confirmYesBtn.addEventListener("click", () => {
    if (pendingAction) {
      pendingAction(); 
    }
    confirmationPopup.classList.remove("active");
    pendingAction = null;
  });
}

// Obsługa przycisku "NIE, WRÓĆ"
if (confirmNoBtn) {
  confirmNoBtn.addEventListener("click", () => {
    confirmationPopup.classList.remove("active");
    pendingAction = null;
  });
}

function scrollToCurrentDay() {
  const wrapper = document.querySelector(".missions-wrapper");
  // Szukamy aktualnego dnia
  let targetNode = document.querySelector(".mission-node.current");

  // Jeśli nie ma aktualnego (bo np. już zrobiony), szukamy ostatniego ukończonego
  if (!targetNode) {
    const completedNodes = document.querySelectorAll(".mission-node.completed");
    if (completedNodes.length > 0) {
      targetNode = completedNodes[completedNodes.length - 1];
    }
  }

  if (!wrapper || !targetNode) return;

  const nodeTop = targetNode.offsetTop;
  const targetScroll =
    nodeTop - wrapper.clientHeight / 2 + targetNode.offsetHeight / 2;

  wrapper.scrollTo({
    top: targetScroll,
    behavior: "smooth",
  });
}
