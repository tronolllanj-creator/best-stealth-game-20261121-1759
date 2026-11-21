import { CONFIG } from './config.js';
import { createRng } from './random.js';
import { createAudio } from './audio.js';
import { createInput } from './input.js';
import { createWorld, step } from './world.js';
import { createRenderer } from './render.js';
import { autopilotInput, stageShot } from './shots.js';

const canvas = document.getElementById('canvas');
const renderer = createRenderer(canvas);
const audio = createAudio();
const input = createInput(canvas);
let rng = createRng(0xdeadbeef);
let state = null;
let attractState = null;
let attractRng = createRng(0xcafebabe);
let lastTime = 0;
let accumulator = 0;
const FIXED_DT = 1 / 60;
const MAX_STEPS = 5;
let running = false;
let bestScore = 0;

try { bestScore = parseInt(localStorage.getItem('greyline_best') || '0', 10); } catch {}

function buildInput() {
  const acts = input.getActions();
  const mx = acts.coinAt ? acts.coinAt.x : 0;
  const my = acts.coinAt ? acts.coinAt.y : 0;
  const dx = (input.isDown('right') ? 1 : 0) - (input.isDown('left') ? 1 : 0);
  const dy = (input.isDown('down') ? 1 : 0) - (input.isDown('up') ? 1 : 0);
  return { dx, dy, sneak: input.isDown('sneak'), dash: acts.dash, throwCoin: acts.coinAt, mx, my };
}

function initTitle() {
  attractRng = createRng(0xcafebabe);
  attractState = createWorld(attractRng, 0);
  attractState.screen = 'TITLE';
  state = { screen: 'TITLE', bestScore };
}

function startLevel(idx) {
  rng = createRng(rng.next() * 0x100000000 | 0);
  state = createWorld(rng, idx);
  state.bestScore = bestScore;
  state.screen = 'PLAY';
}

function handleEvents() {
  for (const e of state.events) {
    switch (e) {
      case 'EVENT_SPOTTED': audio.spotted(); break;
      case 'EVENT_LOOT': audio.grab(); break;
      case 'EVENT_LEVEL': audio.levelClear(); break;
      case 'EVENT_CAUGHT': audio.caught(); break;
      case 'EVENT_WIN': audio.win(); break;
      case 'EVENT_LOCKDOWN': audio.alarm(); break;
    }
  }
  state.events.length = 0;
}

function checkBestScore() {
  if ((state.screen === 'CAUGHT' || state.screen === 'WIN') && state.score > bestScore) {
    bestScore = state.score;
    try { localStorage.setItem('greyline_best', String(bestScore)); } catch {}
  }
}

function loop(now) {
  if (!running) return;
  const dt = Math.min((now - lastTime) / 1000, 0.1);
  lastTime = now;
  accumulator += dt;
  input.update();

  if (state.screen === 'TITLE') {
    const aIn = autopilotInput(attractState, 1);
    let steps = 0;
    accumulator += FIXED_DT;
    while (accumulator >= FIXED_DT && steps < MAX_STEPS) {
      step(attractState, aIn, FIXED_DT);
      accumulator -= FIXED_DT;
      steps++;
    }
    renderer.draw(attractState);
  } else {
    const inObj = buildInput();
    // Fixed step: 1/60s, max 5 steps per frame
    let steps = 0;
    while (accumulator >= FIXED_DT && steps < MAX_STEPS) {
      step(state, inObj, FIXED_DT);
      accumulator -= FIXED_DT;
      steps++;
    }
    handleEvents();
    checkBestScore();
    renderer.draw(state);

    if (input.wasPressed('confirm') || input.getActions().confirm) {
      if (state.screen === 'LEVEL_CLEAR' && state.nextLevel) {
        const next = state.levelIndex + 1;
        if (next < CONFIG.LEVELS.length) startLevel(next);
      } else if (state.screen === 'TITLE') {
        startLevel(0);
      }
    }
    if (input.wasPressed('pause') || input.getActions().pause) {
      if (state.screen === 'PLAY') state.screen = 'PAUSED';
      else if (state.screen === 'PAUSED') state.screen = 'PLAY';
    }
    if (input.wasPressed('restart') || input.getActions().restart) {
      if (state.screen === 'CAUGHT') startLevel(state.levelIndex);
      else if (state.screen === 'WIN') { initTitle(); running = true; requestAnimationFrame(loop); return; }
    }
    if (input.getActions().mute) audio.setMuted(!audio.muted);
  }
  requestAnimationFrame(loop);
}

window.onerror = (msg, src, ln, col, err) => { window.__shotError = String(msg); };

window.runShot = (shot) => {
  const seed = new URLSearchParams(window.location.search).get('seed');
  const shotRng = createRng(seed ? parseInt(seed, 10) : 0xfeedface);
  let levelIdx = 0;
  if (shot === 'alert') levelIdx = 2;
  else if (shot === 'end') levelIdx = 4;
  const shotState = createWorld(shotRng, levelIdx);
  const staged = stageShot(shotState, shot, shotRng);
  shotState.screen = staged.screen;
  shotState.bestScore = bestScore;
  renderer.draw(shotState);
  renderer.draw(shotState);
  window.__shotReady = true;
  running = false;
};

function start() {
  if (running) return;
  running = true;
  initTitle();
  audio.unlock();
  lastTime = performance.now();
  requestAnimationFrame(loop);
}

canvas.addEventListener('click', start);
window.addEventListener('keydown', (e) => { if (e.key === 'Enter') start(); });
start();

// Screenshot mode: ?shot=start|play|alert|end stages a deterministic scene
// and freezes it, setting window.__shotReady for the CDP driver.
const _shot = new URLSearchParams(window.location.search).get('shot');
if (_shot) window.runShot(_shot);
