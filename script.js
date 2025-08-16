const USE_STORAGE = true;

// Keys for localStorage
const KEYS = {
  count: 'counter.count',
  step: 'counter.step',
  allowNegative: 'counter.allowNegative',
  min: 'counter.min',
  max: 'counter.max',
};

// State
let state = {
  count: 0,
  step: 1,
  allowNegative: false,
  min: 0,
  max: 100,
};

// DOM elements
const countEl = document.getElementById('count');
const decrementBtn = document.getElementById('decrementBtn');
const incrementBtn = document.getElementById('incrementBtn');
const resetBtn = document.getElementById('resetBtn');
const stepInput = document.getElementById('stepInput');
const allowNegativeToggle = document.getElementById('allowNegativeToggle');
const minInput = document.getElementById('minInput');
const maxInput = document.getElementById('maxInput');
const hintsEl = document.getElementById('hints');

// Load from storage if enabled
function loadFromStorage() {
  if (!USE_STORAGE) return;
  try {
    const c = localStorage.getItem(KEYS.count);
    const s = localStorage.getItem(KEYS.step);
    const an = localStorage.getItem(KEYS.allowNegative);
    const mn = localStorage.getItem(KEYS.min);
    const mx = localStorage.getItem(KEYS.max);

    if (c !== null) state.count = JSON.parse(c);
    if (s !== null) state.step = Math.max(1, Math.floor(JSON.parse(s)));
    if (an !== null) state.allowNegative = JSON.parse(an) === true;
    if (mn !== null) state.min = Number(JSON.parse(mn));
    if (mx !== null) state.max = Number(JSON.parse(mx));
  } catch {
  }
}

function saveToStorage() {
  if (!USE_STORAGE) return;
  try {
    localStorage.setItem(KEYS.count, JSON.stringify(state.count));
    localStorage.setItem(KEYS.step, JSON.stringify(state.step));
    localStorage.setItem(KEYS.allowNegative, JSON.stringify(state.allowNegative));
    localStorage.setItem(KEYS.min, JSON.stringify(state.min));
    localStorage.setItem(KEYS.max, JSON.stringify(state.max));
  } catch {
  }
}

// Helpers
function clamp(n, lo, hi) {
  return Math.min(Math.max(n, lo), hi);
}

function lowerBound() {
  return state.allowNegative ? state.min : 0;
}

function deriveCanIncrement() {
  return state.count + state.step <= state.max;
}

function deriveCanDecrement() {
  return state.count - state.step >= lowerBound();
}

function updateCountClass() {
  countEl.classList.remove('positive', 'zero', 'negative');
  if (state.count > 0) countEl.classList.add('positive');
  else if (state.count < 0) countEl.classList.add('negative');
  else countEl.classList.add('zero');
}

function render() {
  // Sync inputs
  stepInput.value = state.step;
  allowNegativeToggle.checked = state.allowNegative;
  minInput.value = state.min;
  maxInput.value = state.max;

  // Update count display
  countEl.textContent = state.count;
  updateCountClass();

  // Enable/disable buttons
  const canInc = deriveCanIncrement();
  const canDec = deriveCanDecrement();
  incrementBtn.disabled = !canInc;
  decrementBtn.disabled = !canDec;

  // Hints
  hintsEl.textContent = '';
  if (!canInc) hintsEl.textContent = `Reached upper bound (${state.max}).`;
  if (!canDec) hintsEl.textContent = `Reached lower bound (${lowerBound()}).`;

  saveToStorage();
}

// Actions
function increment() {
  if (!deriveCanIncrement()) return;
  state.count = Math.min(state.count + state.step, state.max);
  render();
}

function decrement() {
  if (!deriveCanDecrement()) return;
  state.count = Math.max(state.count - state.step, lowerBound());
  render();
}

function reset() {
  state.count = 0;
  if (!state.allowNegative && state.min !== 0) {
    state.min = 0;
  }
  state.count = clamp(state.count, lowerBound(), state.max);
  render();
}

// Event wiring
incrementBtn.addEventListener('click', increment);
decrementBtn.addEventListener('click', decrement);
resetBtn.addEventListener('click', reset);

stepInput.addEventListener('input', (e) => {
  let v = Number(e.target.value);
  if (!Number.isFinite(v) || v < 1) v = 1;
  state.step = Math.floor(v);
  render();
});

allowNegativeToggle.addEventListener('change', (e) => {
  const next = e.target.checked;
  state.allowNegative = next;
  if (!next) {
    state.min = 0;
    if (state.count < 0) state.count = 0;
  } else {
    if (state.min === 0) state.min = -100;
  }
  state.count = clamp(state.count, lowerBound(), state.max);
  render();
});

minInput.addEventListener('input', (e) => {
  const v = Number(e.target.value);
  if (!Number.isFinite(v)) return;
  state.min = v;
  if (state.min > state.max) {
    const oldMin = state.min;
    state.min = state.max;
    state.max = oldMin;
  }
  if (!state.allowNegative) state.min = 0;

  state.count = clamp(state.count, lowerBound(), state.max);
  render();
});

maxInput.addEventListener('input', (e) => {
  const v = Number(e.target.value);
  if (!Number.isFinite(v)) return;
  state.max = v;
  if (state.min > state.max) {
    const oldMax = state.max;
    state.max = state.min;
    state.min = oldMax;
  }
  state.count = clamp(state.count, lowerBound(), state.max);
  render();
});

window.addEventListener('keydown', (e) => {
  const tag = document.activeElement?.tagName?.toLowerCase();
  if (tag === 'input' || tag === 'textarea') return;

  if (e.key === 'ArrowUp') increment();
  if (e.key === 'ArrowDown') decrement();
  if (e.key.toLowerCase() === 'r') reset();
});

// Initialize
(function init() {
  loadFromStorage();
  // Final sanitation
  if (!Number.isFinite(state.step) || state.step < 1) state.step = 1;
  if (!state.allowNegative) state.min = 0;
  if (state.min > state.max) {
    const t = state.min;
    state.min = state.max;
    state.max = t;
  }
  state.count = clamp(state.count, lowerBound(), state.max);
  render();
})();
