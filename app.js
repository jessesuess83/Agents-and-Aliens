const STORAGE_KEY = "agents-aliens-alert-tracker";
const MAX_LEVEL = 15;

const levels = Array.from({ length: MAX_LEVEL + 1 }, (_, index) => MAX_LEVEL - index);
const defaultState = { level: 0 };

const meter = document.querySelector("#meter");
const loseModal = document.querySelector("#loseModal");
const restartBtn = document.querySelector("#restartBtn");
const rerollModal = document.querySelector("#rerollModal");
const rerollOkayBtn = document.querySelector("#rerollOkayBtn");

let state = loadState();
let loseModalShown = false;
let wakeLock = null;

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return { ...defaultState, ...saved };
  } catch {
    return { ...defaultState };
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function clampLevel(value) {
  return Math.max(0, Math.min(MAX_LEVEL, value));
}

function colorForLevel(level) {
  if (level >= 12) return "#ff1717";
  if (level >= 9) return "#ff7518";
  if (level >= 6) return "#ffd526";
  if (level >= 4) return "#ccff2f";
  return "#27ff58";
}

function labelForLevel(level) {
  if (level === 15) return "You Lose";
  if (level === 10 || level === 5) return "Reroll Barricades";
  return "";
}

function markerForLevel(level) {
  if (level !== MAX_LEVEL) return String(level);

  return `
    <svg class="skull-icon" viewBox="0 0 24 24" aria-label="Skull" role="img">
      <path d="M12 2C7.6 2 4 5.3 4 9.4c0 2.5 1.2 4.7 3.1 6v3.2c0 .8.6 1.4 1.4 1.4h7c.8 0 1.4-.6 1.4-1.4v-3.2c1.9-1.3 3.1-3.5 3.1-6C20 5.3 16.4 2 12 2Zm-3.1 9.7c-1 0-1.8-.8-1.8-1.8s.8-1.8 1.8-1.8 1.8.8 1.8 1.8-.8 1.8-1.8 1.8Zm3.1 4.1-1.2-1.8h2.4L12 15.8Zm3.1-4.1c-1 0-1.8-.8-1.8-1.8s.8-1.8 1.8-1.8 1.8.8 1.8 1.8-.8 1.8-1.8 1.8Z"/>
    </svg>
  `;
}

function renderMeter() {
  meter.innerHTML = "";

  levels.forEach((level) => {
    const item = document.createElement("li");
    const label = labelForLevel(level);
    item.className = "level";
    item.style.color = colorForLevel(level);
    item.dataset.level = String(level);
    item.setAttribute("aria-current", level === state.level ? "true" : "false");

    if (level === state.level) item.classList.add("current");

    item.innerHTML = `
      <span class="level-number">${markerForLevel(level)}</span>
      <span class="level-label">${label}</span>
    `;

    meter.appendChild(item);
  });
}

function render() {
  renderMeter();
  saveState();
}

function setLevel(level) {
  const previousLevel = state.level;
  state.level = clampLevel(level);
  render();

  if (previousLevel < MAX_LEVEL && state.level === MAX_LEVEL) {
    showLoseModal();
  } else if (previousLevel !== state.level && (state.level === 5 || state.level === 10)) {
    showRerollModal();
  }
}

function showLoseModal() {
  loseModalShown = true;
  loseModal.hidden = false;
  restartBtn.focus({ preventScroll: true });
}

function hideLoseModal() {
  loseModal.hidden = true;
}

function showRerollModal() {
  rerollModal.hidden = false;
  rerollOkayBtn.focus({ preventScroll: true });
}

function hideRerollModal() {
  rerollModal.hidden = true;
}

async function requestWakeLock() {
  if (!("wakeLock" in navigator) || wakeLock) return;

  try {
    wakeLock = await navigator.wakeLock.request("screen");
    wakeLock.addEventListener("release", () => {
      wakeLock = null;
    });
  } catch {
    wakeLock = null;
  }
}

document.querySelector("#downBtn").addEventListener("click", () => {
  requestWakeLock();
  setLevel(state.level - 1);
});

document.querySelector("#upBtn").addEventListener("click", () => {
  requestWakeLock();
  setLevel(state.level + 1);
});

document.querySelector("#resetBtn").addEventListener("click", () => {
  requestWakeLock();
  setLevel(0);
});

restartBtn.addEventListener("click", () => {
  requestWakeLock();
  state.level = 0;
  loseModalShown = false;
  hideLoseModal();
  render();
});

rerollOkayBtn.addEventListener("click", () => {
  requestWakeLock();
  hideRerollModal();
});

document.querySelectorAll(".control").forEach((button) => {
  const release = () => button.classList.remove("pressed");

  button.addEventListener("pointerdown", () => {
    button.classList.add("pressed");
  });
  button.addEventListener("pointerup", release);
  button.addEventListener("pointercancel", release);
  button.addEventListener("pointerleave", release);
});

restartBtn.addEventListener("pointerdown", () => restartBtn.classList.add("pressed"));
restartBtn.addEventListener("pointerup", () => restartBtn.classList.remove("pressed"));
restartBtn.addEventListener("pointercancel", () => restartBtn.classList.remove("pressed"));
restartBtn.addEventListener("pointerleave", () => restartBtn.classList.remove("pressed"));

rerollOkayBtn.addEventListener("pointerdown", () => rerollOkayBtn.classList.add("pressed"));
rerollOkayBtn.addEventListener("pointerup", () => rerollOkayBtn.classList.remove("pressed"));
rerollOkayBtn.addEventListener("pointercancel", () => rerollOkayBtn.classList.remove("pressed"));
rerollOkayBtn.addEventListener("pointerleave", () => rerollOkayBtn.classList.remove("pressed"));

document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") {
    requestWakeLock();
  }
});

function initStars() {
  const canvas = document.querySelector("#stars");
  const context = canvas.getContext("2d");
  let stars = [];

  function resize() {
    const scale = window.devicePixelRatio || 1;
    canvas.width = Math.floor(window.innerWidth * scale);
    canvas.height = Math.floor(window.innerHeight * scale);
    context.setTransform(scale, 0, 0, scale, 0, 0);
    stars = Array.from({ length: 170 }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      r: Math.random() * 1.4 + 0.2,
      a: Math.random() * 0.75 + 0.25,
    }));
    draw();
  }

  function draw() {
    context.clearRect(0, 0, window.innerWidth, window.innerHeight);
    stars.forEach((star) => {
      context.beginPath();
      context.fillStyle = `rgba(238, 249, 255, ${star.a})`;
      context.arc(star.x, star.y, star.r, 0, Math.PI * 2);
      context.fill();
    });
  }

  window.addEventListener("resize", resize);
  resize();
}

initStars();
render();

if (state.level === MAX_LEVEL && !loseModalShown) {
  showLoseModal();
}
