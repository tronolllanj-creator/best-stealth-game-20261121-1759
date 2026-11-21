import { CONFIG } from './config.js';

const DEG = Math.PI / 180;
const EVENT_SPOTTED = 'EVENT_SPOTTED';
const EVENT_LOOT = 'EVENT_LOOT';
const EVENT_LEVEL = 'EVENT_LEVEL';
const EVENT_CAUGHT = 'EVENT_CAUGHT';
const EVENT_WIN = 'EVENT_WIN';
const EVENT_LOCKDOWN = 'EVENT_LOCKDOWN';

function rectsIntersectSegment(x1, y1, x2, y2, rect) {
  const left = rect.x;
  const right = rect.x + rect.w;
  const top = rect.y;
  const bottom = rect.y + rect.h;
  if ((x1 < left && x2 < left) || (x1 > right && x2 > right) ||
      (y1 < top && y2 < top) || (y1 > bottom && y2 > bottom)) {
    return false;
  }
  const dx = x2 - x1;
  const dy = y2 - y1;
  if (dx === 0 && dy === 0) {
    return x1 >= left && x1 <= right && y1 >= top && y1 <= bottom;
  }
  let t0 = 0, t1 = 1;
  const edges = [
    [-dx, x1 - left],
    [dx, right - x1],
    [-dy, y1 - top],
    [dy, bottom - y1]
  ];
  for (const [p, q] of edges) {
    if (p === 0) {
      if (q < 0) return false;
    } else {
      const t = q / p;
      if (p < 0) {
        if (t > t1) return false;
        if (t > t0) t0 = t;
      } else {
        if (t < t0) return false;
        if (t < t1) t1 = t;
      }
    }
  }
  return t0 <= t1;
}

function losClear(x1, y1, x2, y2, walls) {
  for (const w of walls) {
    if (rectsIntersectSegment(x1, y1, x2, y2, w)) return false;
  }
  return true;
}

function pointInRect(px, py, rect) {
  return px >= rect.x && px <= rect.x + rect.w && py >= rect.y && py <= rect.y + rect.h;
}

function dist2(ax, ay, bx, by) {
  const dx = ax - bx, dy = ay - by;
  return dx * dx + dy * dy;
}

function angleToTarget(ax, ay, bx, by) {
  return Math.atan2(by - ay, bx - ax);
}

function normalizeAngle(a) {
  while (a <= -Math.PI) a += 2 * Math.PI;
  while (a > Math.PI) a -= 2 * Math.PI;
  return a;
}

function angleDiff(a, b) {
  let d = a - b;
  while (d <= -Math.PI) d += 2 * Math.PI;
  while (d > Math.PI) d -= 2 * Math.PI;
  return d;
}

function inCone(px, py, cx, cy, facing, range, halfAngle) {
  const dx = px - cx, dy = py - cy;
  const d2 = dx * dx + dy * dy;
  if (d2 > range * range) return false;
  const ang = Math.atan2(dy, dx);
  return Math.abs(normalizeAngle(ang - facing)) <= halfAngle;
}

function createThief(level, rng) {
  const t = CONFIG.thief;
  return {
    x: level.spawn.x,
    y: level.spawn.y,
    vx: 0,
    vy: 0,
    facing: 0,
    speed: t.speed,
    sneakSpeed: t.sneakSpeed,
    dashCd: 0,
    dashTime: 0,
    dashing: false,
    exposure: 0,
    hiddenTimer: 0,
    seen: false,
    channel: null,
    channelProg: 0,
    radius: t.radius,
    coins: CONFIG.coinsPerLevel,
    shoveTimer: 0
  };
}

function createGuards(level, rng) {
  const gcfg = CONFIG.guard;
  const guards = [];
  for (const g of level.guards) {
    const wp = g.waypoints;
    const idx = g.startIndex;
    const nextIdx = (idx + 1) % wp.length;
    const start = wp[idx];
    const next = wp[nextIdx];
    const facing = angleToTarget(start.x, start.y, next.x, next.y);
    guards.push({
      x: start.x,
      y: start.y,
      vx: 0,
      vy: 0,
      waypoints: wp,
      wpIndex: idx,
      state: 'patrol',
      facing,
      coneR: gcfg.coneRange,
      coneA: gcfg.coneHalfAngle * DEG,
      investigateTarget: null,
      investigateTimer: 0,
      chaseTimer: 0,
      returnTimer: 0,
      pauseTimer: 0,
      speed: gcfg.patrolSpeed,
      chaseSpeed: gcfg.chaseSpeed,
      radius: gcfg.radius,
      alert: false
    });
  }
  return guards;
}

function createCameras(level) {
  const ccfg = CONFIG.camera;
  const cameras = [];
  for (const c of level.cameras) {
    cameras.push({
      x: c.x,
      y: c.y,
      baseAngle: c.baseAngle * DEG,
      angle: c.baseAngle * DEG,
      sweepDir: 1,
      sweepRange: c.sweepRange * DEG,
      sweepSpeed: ccfg.sweepSpeed * DEG,
      coneR: ccfg.coneRange,
      coneA: ccfg.coneHalfAngle * DEG,
      locked: false,
      lockTarget: null
    });
  }
  return cameras;
}

function createLasers(level) {
  const lcfg = CONFIG.laser;
  const lasers = [];
  for (const l of level.lasers) {
    const ang = l.angle * DEG;
    const x1 = l.x;
    const y1 = l.y;
    const x2 = l.x + Math.cos(ang) * l.length;
    const y2 = l.y + Math.sin(ang) * l.length;
    lasers.push({
      x1, y1, x2, y2,
      period: l.period,
      phase: l.phase,
      on: false,
      timer: l.phase,
      thickness: 4
    });
  }
  return lasers;
}

function createLoot(level) {
  const loot = [];
  for (const l of level.loot) {
    let type;
    if (l.type === 'dataCore') type = 'core';
    else if (l.type === 'terminal') type = 'terminal';
    else if (l.type === 'vaultCore') type = 'vault';
    else type = 'core';
    let channelTime = 0;
    if (type === 'terminal') channelTime = CONFIG.terminalHackTime;
    else if (type === 'vault') channelTime = CONFIG.vaultCoreHackTime;
    loot.push({
      x: l.x,
      y: l.y,
      type,
      taken: false,
      channelTime,
      channelProg: 0,
      radius: 12
    });
  }
  return loot;
}

function createExit(level) {
  return { x: level.exit.x, y: level.exit.y, w: level.exit.w, h: level.exit.h, open: false };
}

function createParticles() {
  return [];
}

function createStats() {
  return {
    score: 0,
    bestScore: 0,
    lootTaken: 0,
    timesSpotted: 0,
    coinsThrown: 0,
    lockdowns: 0,
    levelTime: 0,
    maxExposure: 0,
    ghostBonus: 0,
    exitOpenTime: 0
  };
}

function tryGetBestScore() {
  try {
    const v = localStorage.getItem('greyline_best');
    return v ? parseInt(v, 10) : 0;
  } catch { return 0; }
}

function saveBestScore(score) {
  try { localStorage.setItem('greyline_best', String(score)); } catch {}
}

export function createWorld(rng, levelIndex) {
  const level = CONFIG.LEVELS[levelIndex];
  const thief = createThief(level, rng);
  const guards = createGuards(level, rng);
  const cameras = createCameras(level);
  const lasers = createLasers(level);
  const loot = createLoot(level);
  const exit = createExit(level);
  const particles = createParticles();
  const stats = createStats();
  stats.bestScore = tryGetBestScore();
  
  return {
    rng,
    levelIndex,
    level,
    thief,
    guards,
    cameras,
    lasers,
    loot,
    exit,
    particles,
    events: [],
    stats,
    screen: 'PLAY',
    exposure: 0,
    score: 0,
    levelName: level.name,
    lootQuota: level.quota,
    coinsLeft: CONFIG.coinsPerLevel,
    stealthState: 'HIDDEN',
    prompt: '',
    levelScore: 0,
    timeBonus: 0,
    paused: false,
    gameOver: false,
    win: false,
    caught: false,
    lockdown: false,
    lockdownTimer: 0,
    screenShake: 0,
    seenByGuard: false,
    seenByCam: false,
    seenByAny: false,
    nearestGuard: null,
    coinLanding: null,
    nextLevel: false
  };
}

function updateThief(state, input, dt) {
  const t = state.thief;
  const tcfg = CONFIG.thief;
  const level = state.level;
  
  if (t.shoveTimer > 0) {
    t.shoveTimer -= dt;
    if (t.shoveTimer < 0) t.shoveTimer = 0;
  }
  
  if (t.dashing) {
    t.dashTime -= dt;
    if (t.dashTime <= 0) {
      t.dashing = false;
      t.dashTime = 0;
    }
  } else if (t.dashCd > 0) {
    t.dashCd -= dt;
    if (t.dashCd < 0) t.dashCd = 0;
  }
  
  let dx = input.dx || 0;
  let dy = input.dy || 0;
  const moving = dx !== 0 || dy !== 0;
  
  if (moving) {
    const len = Math.hypot(dx, dy);
    dx /= len; dy /= len;
    t.facing = Math.atan2(dy, dx);
  }
  
  let speed = input.sneak ? t.sneakSpeed : t.speed;
  if (t.dashing) speed = tcfg.dashSpeed;
  
  const nx = t.x + dx * speed * dt;
  const ny = t.y + dy * speed * dt;
  
  let blocked = false;
  for (const w of level.walls) {
    if (pointInRect(nx, ny, { x: w.x - t.radius, y: w.y - t.radius, w: w.w + 2 * t.radius, h: w.h + 2 * t.radius })) {
      blocked = true; break;
    }
  }
  if (!blocked) {
    t.x = nx; t.y = ny;
  }
  
  if (input.dash && !t.dashing && t.dashCd <= 0 && !t.shoveTimer) {
    t.dashing = true;
    t.dashTime = tcfg.dashTime;
    t.dashCd = tcfg.dashCooldown;
    if (state.seenByAny) {
      t.exposure += tcfg.dashNoiseExposure;
      if (t.exposure > 100) t.exposure = 100;
    }
    state.events.push({ type: EVENT_SPOTTED }); // dash noise counts as spotted event for sound
  }
  
  if (moving || t.shoveTimer > 0) {
    t.channel = null;
    t.channelProg = 0;
  }
  
  if (input.throwCoin && t.coins > 0) {
    const mx = input.mx, my = input.my;
    state.coinLanding = { x: mx, y: my, timer: CONFIG.coinInvestigateTime };
    t.coins--;
    state.coinsLeft = t.coins;
    state.stats.coinsThrown++;
    state.events.push({ type: EVENT_LOOT }); // coin clink sound
  }
  
  if (state.coinLanding) {
    state.coinLanding.timer -= dt;
    if (state.coinLanding.timer <= 0) state.coinLanding = null;
  }
  
  for (const g of state.guards) {
    if (g.pauseTimer > 0) continue;
    const d2 = dist2(t.x, t.y, g.x, g.y);
    const rsum = t.radius + g.radius;
    if (d2 <= rsum * rsum) {
      if (t.exposure >= CONFIG.exposure.caughtThreshold) {
        state.caught = true;
        state.screen = 'CAUGHT';
        state.events.push({ type: EVENT_CAUGHT });
        return;
      } else {
        const ang = Math.atan2(t.y - g.y, t.x - g.x);
        const force = CONFIG.guard.touchShoveForce;
        t.x += Math.cos(ang) * force * dt;
        t.y += Math.sin(ang) * force * dt;
        t.shoveTimer = 0.1;
        t.exposure += CONFIG.exposure.touchShoveExposure;
        if (t.exposure > 100) t.exposure = 100;
        g.pauseTimer = CONFIG.guard.touchPause;
        state.events.push({ type: EVENT_SPOTTED });
      }
    }
  }
}

function updateLoot(state, dt) {
  const t = state.thief;
  for (const l of state.loot) {
    if (l.taken) continue;
    const d2 = dist2(t.x, t.y, l.x, l.y);
    const rsum = t.radius + l.radius;
    if (d2 <= rsum * rsum) {
      if (l.type === 'core') {
        l.taken = true;
        state.stats.lootTaken++;
        state.stats.score += CONFIG.scoring.dataCore;
        state.events.push({ type: EVENT_LOOT });
      } else {
        if (!t.channel || t.channel !== l) {
          t.channel = l;
          t.channelProg = 0;
        }
        if (t.channel === l) {
          t.channelProg += dt;
          if (t.channelProg >= l.channelTime) {
            l.taken = true;
            state.stats.lootTaken++;
            if (l.type === 'terminal') state.stats.score += CONFIG.scoring.terminal;
            else if (l.type === 'vault') state.stats.score += CONFIG.scoring.vaultCore;
            state.events.push({ type: EVENT_LOOT });
            t.channel = null;
            t.channelProg = 0;
          }
        }
      }
    } else if (t.channel === l) {
      t.channel = null;
      t.channelProg = 0;
    }
  }
  
  if (state.stats.lootTaken >= state.lootQuota) {
    state.exit.open = true;
  }
  
  const d2exit = dist2(t.x, t.y, state.exit.x + state.exit.w/2, state.exit.y + state.exit.h/2);
  if (state.exit.open && d2exit <= (t.radius + Math.max(state.exit.w, state.exit.h)) ** 2) {
    state.screen = 'LEVEL_CLEAR';
    state.nextLevel = true;
    state.stats.levelTime = state.stats.levelTime || 0;
    const par = state.level.parTime;
    const elapsed = state.stats.levelTime;
    const timeBonus = Math.max(0, par - elapsed) * CONFIG.scoring.timeBonusPerSec;
    state.stats.score += CONFIG.scoring.levelClearBase * (state.levelIndex + 1);
    state.stats.score += timeBonus;
    state.timeBonus = timeBonus;
    state.levelScore = CONFIG.scoring.levelClearBase * (state.levelIndex + 1) + timeBonus;
    if (state.stats.maxExposure < 50) {
      state.stats.score += CONFIG.scoring.ghostBonus;
      state.stats.ghostBonus = CONFIG.scoring.ghostBonus;
    }
    state.events.push({ type: EVENT_LEVEL });
    if (state.levelIndex === 4) {
      state.win = true;
      state.screen = 'WIN';
      state.events.push({ type: EVENT_WIN });
      saveBestScore(state.stats.score);
    }
  }
}

function updateGuards(state, dt) {
  const gcfg = CONFIG.guard;
  const t = state.thief;
  const level = state.level;
  
  for (const g of state.guards) {
    if (g.pauseTimer > 0) {
      g.pauseTimer -= dt;
      if (g.pauseTimer < 0) g.pauseTimer = 0;
      g.vx = 0; g.vy = 0;
      continue;
    }
    
    const canSee = inCone(t.x, t.y, g.x, g.y, g.facing, g.coneR, g.coneA) &&
                   losClear(g.x, g.y, t.x, t.y, level.walls);
    
    if (state.coinLanding) {
      const d2 = dist2(g.x, g.y, state.coinLanding.x, state.coinLanding.y);
      if (d2 <= CONFIG.coinInvestigateRange * CONFIG.coinInvestigateRange) {
        g.state = 'investigate';
        g.investigateTarget = { x: state.coinLanding.x, y: state.coinLanding.y };
        g.investigateTimer = CONFIG.coinInvestigateTime;
      }
    }
    
    switch (g.state) {
      case 'patrol': {
        g.speed = gcfg.patrolSpeed;
        const wp = g.waypoints[g.wpIndex];
        const dx = wp.x - g.x, dy = wp.y - g.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 10) {
          g.wpIndex = (g.wpIndex + 1) % g.waypoints.length;
        } else {
          g.facing = Math.atan2(dy, dx);
          g.vx = Math.cos(g.facing) * g.speed;
          g.vy = Math.sin(g.facing) * g.speed;
        }
        break;
      }
      case 'investigate': {
        g.speed = gcfg.investigateSpeed;
        if (g.investigateTarget) {
          const dx = g.investigateTarget.x - g.x;
          const dy = g.investigateTarget.y - g.y;
          const dist = Math.hypot(dx, dy);
          if (dist < 10 || g.investigateTimer <= 0) {
            g.state = 'return';
            g.investigateTarget = null;
          } else {
            g.facing = Math.atan2(dy, dx);
            g.vx = Math.cos(g.facing) * g.speed;
            g.vy = Math.sin(g.facing) * g.speed;
            g.investigateTimer -= dt;
          }
        } else {
          g.state = 'return';
        }
        break;
      }
      case 'chase': {
        g.speed = gcfg.chaseSpeed;
        if (canSee) {
          g.chaseTimer = 3;
          g.facing = Math.atan2(t.y - g.y, t.x - g.x);
        } else {
          g.chaseTimer -= dt;
          if (g.chaseTimer <= 0) {
            g.state = 'return';
          }
        }
        g.vx = Math.cos(g.facing) * g.speed;
        g.vy = Math.sin(g.facing) * g.speed;
        break;
      }
      case 'return': {
        g.speed = gcfg.patrolSpeed;
        const wp = g.waypoints[g.wpIndex];
        const dx = wp.x - g.x, dy = wp.y - g.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 10) {
          g.state = 'patrol';
        } else {
          g.facing = Math.atan2(dy, dx);
          g.vx = Math.cos(g.facing) * g.speed;
          g.vy = Math.sin(g.facing) * g.speed;
        }
        break;
      }
    }
    
    if (canSee) {
      if (g.state === 'patrol' || g.state === 'investigate') {
        g.state = 'chase';
        g.chaseTimer = 3;
        g.alert = true;
      }
    }
    
    if (state.lockdown) {
      g.state = 'chase';
      g.alert = true;
    }
    
    const nx = g.x + g.vx * dt;
    const ny = g.y + g.vy * dt;
    let blocked = false;
    for (const w of level.walls) {
      if (pointInRect(nx, ny, { x: w.x - g.radius, y: w.y - g.radius, w: w.w + 2 * g.radius, h: w.h + 2 * g.radius })) {
        blocked = true; break;
      }
    }
    if (!blocked) { g.x = nx; g.y = ny; }
    else { g.vx = 0; g.vy = 0; }
  }
}

function updateCameras(state, dt) {
  const t = state.thief;
  const level = state.level;
  for (const c of state.cameras) {
    if (c.locked && c.lockTarget) {
      c.angle = Math.atan2(c.lockTarget.y - c.y, c.lockTarget.x - c.x);
    } else {
      c.angle += c.sweepDir * c.sweepSpeed * dt;
      const limit = c.baseAngle + c.sweepDir * c.sweepRange;
      if ((c.sweepDir > 0 && c.angle >= limit) || (c.sweepDir < 0 && c.angle <= limit)) {
        c.angle = limit;
        c.sweepDir *= -1;
      }
    }
    
    const canSee = inCone(t.x, t.y, c.x, c.y, c.angle, c.coneR, c.coneA) &&
                   losClear(c.x, c.y, t.x, t.y, level.walls);
    if (canSee && state.lockdown) {
      c.locked = true;
      c.lockTarget = t;
    }
  }
}

function updateLasers(state, dt) {
  const lcfg = CONFIG.laser;
  const t = state.thief;
  for (const l of state.lasers) {
    l.timer += dt;
    if (l.timer >= l.period) l.timer -= l.period;
    l.on = l.timer < l.period * lcfg.onRatio;
    
    if (l.on) {
      const x1 = l.x1, y1 = l.y1, x2 = l.x2, y2 = l.y2;
      const dx = x2 - x1, dy = y2 - y1;
      const len2 = dx * dx + dy * dy;
      if (len2 > 0) {
        const tParam = ((t.x - x1) * dx + (t.y - y1) * dy) / len2;
        if (tParam >= 0 && tParam <= 1) {
          const projX = x1 + tParam * dx;
          const projY = y1 + tParam * dy;
          const d2 = dist2(t.x, t.y, projX, projY);
          if (d2 <= (t.radius + l.thickness) ** 2) {
            t.exposure += lcfg.touchExposure;
            if (t.exposure > 100) t.exposure = 100;
            let nearest = null, nearestD2 = Infinity;
            for (const g of state.guards) {
              const d2g = dist2(g.x, g.y, t.x, t.y);
              if (d2g < nearestD2) { nearestD2 = d2g; nearest = g; }
            }
            if (nearest) {
              nearest.state = 'chase';
              nearest.chaseTimer = 3;
              nearest.alert = true;
            }
            state.events.push({ type: EVENT_SPOTTED });
          }
        }
      }
    }
  }
}

function updateExposure(state, input, dt) {
  const t = state.thief;
  const dcfg = CONFIG.detection;
  const ecfg = CONFIG.exposure;
  
  let seenByGuard = false;
  let seenByCam = false;
  let nearestGuard = null;
  let nearestD2 = Infinity;
  
  for (const g of state.guards) {
    const d2 = dist2(t.x, t.y, g.x, g.y);
    if (d2 < nearestD2) { nearestD2 = d2; nearestGuard = g; }
    const canSee = inCone(t.x, t.y, g.x, g.y, g.facing, g.coneR, g.coneA) &&
                   losClear(g.x, g.y, t.x, t.y, state.level.walls);
    if (canSee) {
      seenByGuard = true;
      let rate = input.sneak ? dcfg.baseRateSneak : dcfg.baseRateStand;
      rate *= (1 - (Math.sqrt(d2) / g.coneR) * dcfg.distanceFalloff);
      const inShadow = state.level.shadows.some(s => pointInRect(t.x, t.y, s));
      if (inShadow) rate *= dcfg.shadowMult;
      t.exposure += rate * dt;
    }
  }
  
  for (const c of state.cameras) {
    const canSee = inCone(t.x, t.y, c.x, c.y, c.angle, c.coneR, c.coneA) &&
                   losClear(c.x, c.y, t.x, t.y, state.level.walls);
    if (canSee) {
      seenByCam = true;
      const d2 = dist2(t.x, t.y, c.x, c.y);
      let rate = dcfg.cameraRate;
      rate *= (1 - (Math.sqrt(d2) / c.coneR) * dcfg.distanceFalloff);
      const inShadow = state.level.shadows.some(s => pointInRect(t.x, t.y, s));
      if (inShadow) rate *= dcfg.shadowMult;
      t.exposure += rate * dt;
    }
  }
  
  state.seenByGuard = seenByGuard;
  state.seenByCam = seenByCam;
  state.seenByAny = seenByGuard || seenByCam;
  state.nearestGuard = nearestGuard;
  
  if (state.seenByAny) {
    t.hiddenTimer = 0;
    if (t.exposure > state.stats.maxExposure) state.stats.maxExposure = t.exposure;
    // At exposure 100, lockdown triggers for ecfg.lockdownDuration seconds
    if (t.exposure >= ecfg.lockdownThreshold && !state.lockdown) {
      state.lockdown = true;
      state.lockdownTimer = ecfg.lockdownDuration;
      state.stats.lockdowns++;
      state.events.push({ type: EVENT_LOCKDOWN });
    }
  } else {
    t.hiddenTimer += dt;
    if (t.hiddenTimer >= ecfg.hiddenDelay) {
      t.exposure -= ecfg.hiddenDecay * dt;
      if (t.exposure < 0) t.exposure = 0;
    }
  }
  
  if (state.lockdown) {
    state.lockdownTimer -= dt;
    t.exposure = Math.max(t.exposure, ecfg.lockdownThreshold);
    if (state.lockdownTimer <= 0) {
      state.lockdown = false;
      t.exposure = ecfg.lockdownThreshold;
    }
  }
  
  if (t.exposure > 100) t.exposure = 100;
  
  if (t.exposure === 0) state.stealthState = 'HIDDEN';
  else if (state.lockdown) state.stealthState = 'LOCKDOWN';
  else state.stealthState = 'SPOTTED';
  
  state.exposure = t.exposure;
}

function updatePrompt(state) {
  const t = state.thief;
  if (t.channel) {
    if (t.channel.type === 'terminal') state.prompt = 'E HACK TERMINAL';
    else if (t.channel.type === 'vault') state.prompt = 'HOLD E CRACKING VAULT CORE';
    else state.prompt = '';
  } else if (state.exit.open) {
    state.prompt = 'EXIT OPEN';
  } else {
    state.prompt = '';
  }
}

function updateParticles(state, dt) {
  for (let i = state.particles.length - 1; i >= 0; i--) {
    const p = state.particles[i];
    p.life -= dt;
    if (p.life <= 0) {
      state.particles.splice(i, 1);
    } else {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
    }
  }
}

export function step(state, input, dt) {
  state.stats.levelTime += dt;
  state.score = state.stats.score;
  state.coinsLeft = state.thief.coins;
  state.levelScore = state.stats.score;
  state.timeBonus = state.stats.levelTime ? Math.max(0, state.level.parTime - state.stats.levelTime) * CONFIG.scoring.timeBonusPerSec : 0;
  
  if (state.screen !== 'PLAY') return;
  
  state.events = [];
  
  updateThief(state, input, dt);
  if (state.screen !== 'PLAY') return;
  
  updateLoot(state, dt);
  updateGuards(state, dt);
  updateCameras(state, dt);
  updateLasers(state, dt);
  updateExposure(state, input, dt);
  updatePrompt(state);
  updateParticles(state, dt);
  
  if (state.caught) {
    state.screen = 'CAUGHT';
    state.gameOver = true;
  }
  if (state.win) {
    state.screen = 'WIN';
  }
  if (state.nextLevel) {
    state.screen = 'LEVEL_CLEAR';
  }
}