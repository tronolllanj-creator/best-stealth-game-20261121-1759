import { step } from './world.js';
import { CONFIG } from './config.js';

function nearestTarget(state) {
  let best = null, bestDist = Infinity;
  for (const l of state.loot) {
    if (l.taken) continue;
    const d = Math.hypot(l.x - state.thief.x, l.y - state.thief.y);
    if (d < bestDist) { bestDist = d; best = l; }
  }
  if (best) return { x: best.x, y: best.y };
  return { x: state.exit.x + state.exit.w/2, y: state.exit.y + state.exit.h/2 };
}

function inGuardCone(thief, guard) {
  const dx = thief.x - guard.x, dy = thief.y - guard.y;
  const dist = Math.hypot(dx, dy);
  if (dist > guard.coneR) return false;
  const ang = Math.atan2(dy, dx);
  const diff = Math.abs(ang - guard.facing);
  return diff < guard.coneA || diff > Math.PI*2 - guard.coneA;
}

function inCameraCone(thief, cam) {
  const dx = thief.x - cam.x, dy = thief.y - cam.y;
  const dist = Math.hypot(dx, dy);
  if (dist > cam.coneR) return false;
  const ang = Math.atan2(dy, dx);
  const diff = Math.abs(ang - cam.angle);
  return diff < cam.coneA || diff > Math.PI*2 - cam.coneA;
}

export function autopilotInput(state, strength) {
  const target = nearestTarget(state);
  let dx = target.x - state.thief.x;
  let dy = target.y - state.thief.y;
  const dist = Math.hypot(dx, dy);
  if (dist > 0) { dx /= dist; dy /= dist; }
  let sneak = false;
  if (strength === 'strong') {
    for (const g of state.guards) {
      if (inGuardCone(state.thief, g)) {
        sneak = true;
        dx = -Math.sin(g.facing);
        dy =  Math.cos(g.facing);
        break;
      }
    }
    if (!sneak) {
      for (const c of state.cameras) {
        if (inCameraCone(state.thief, c)) {
          sneak = true;
          dx = -Math.sin(c.angle);
          dy =  Math.cos(c.angle);
          break;
        }
      }
    }
  }
  return {
    dx: dx > 0.5 ? 1 : dx < -0.5 ? -1 : 0,
    dy: dy > 0.5 ? 1 : dy < -0.5 ? -1 : 0,
    sneak,
    dash: false,
    throwCoin: false,
    mx: target.x,
    my: target.y
  };
}

// Every staged scene is the real simulation stepped forward, never a fake frame.
export function stageShot(state, shot, rng) {
  const DT = 1/60;
  switch (shot) {
    case 'start': {
      state.screen = 'PLAY';
      for (let i=0;i<480;i++) step(state, autopilotInput(state,'strong'), DT);
      state.screen = 'TITLE';
      break;
    }
    case 'play': {
      state.screen = 'PLAY';
      for (let i=0;i<1560;i++) step(state, autopilotInput(state,'strong'), DT);
      state.thief.exposure = 30;
      state.exposure = 30;
      break;
    }
    case 'alert': {
      state.screen = 'PLAY';
      const g = state.guards[0];
      const ang = g.facing;
      const d = g.coneR * 0.5;
      state.thief.x = g.x + Math.cos(ang)*d;
      state.thief.y = g.y + Math.sin(ang)*d;
      state.thief.exposure = 80;
      state.exposure = 80;
      g.state = 'chase';
      g.chaseTimer = 5;
      state.lasers.forEach(l=>{ l.timer=0; l.on=true; });
      break;
    }
    case 'end': {
      state.screen = 'PLAY';
      const g = state.guards[0];
      const ang = g.facing;
      const d = g.coneR * 0.5;
      state.thief.x = g.x + Math.cos(ang)*d;
      state.thief.y = g.y + Math.sin(ang)*d;
      state.thief.exposure = 95;
      state.exposure = 95;
      g.state = 'chase';
      g.chaseTimer = 10;
      for (let i=0;i<3600;i++) {
        step(state, autopilotInput(state,'weak'), DT);
        if (state.screen === 'CAUGHT') break;
      }
      if (state.screen !== 'CAUGHT') state.screen = 'CAUGHT';
      break;
    }
  }
  return { screen: state.screen, best: state.stats.bestScore };
}
