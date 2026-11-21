import { CONFIG } from './config.js';
const PAL = CONFIG.palette;
const FW = CONFIG.field.w;
const FH = CONFIG.field.h;
const DEG = Math.PI / 180;

function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');
  let scale = 1;
  let offsetX = 0;
  let offsetY = 0;
  let shakeX = 0;
  let shakeY = 0;
  let shakeTimer = 0;

  function resize() {
    const cw = canvas.clientWidth;
    const ch = canvas.clientHeight;
    canvas.width = cw;
    canvas.height = ch;
    const sx = cw / FW;
    const sy = ch / FH;
    scale = Math.min(sx, sy);
    offsetX = (cw - FW * scale) * 0.5;
    offsetY = (ch - FH * scale) * 0.5;
  }

  function view() {
    return { x: -offsetX / scale, y: -offsetY / scale, w: FW, h: FH };
  }

  function setShake(v) {
    shakeTimer = v;
  }

  function drawFloor(state) {
    const tile = 64;
    const cols = Math.ceil(FW / tile);
    const rows = Math.ceil(FH / tile);
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        ctx.fillStyle = (x + y) % 2 === 0 ? PAL.floor : PAL.floorAlt;
        ctx.fillRect(x * tile, y * tile, tile, tile);
      }
    }
    for (const s of state.level.shadows) {
      ctx.fillStyle = PAL.shadow;
      ctx.fillRect(s.x, s.y, s.w, s.h);
    }
  }

  function drawWalls(state) {
    for (const w of state.level.walls) {
      ctx.fillStyle = PAL.shadow;
      ctx.fillRect(w.x + 4, w.y + 4, w.w, w.h);
      ctx.fillStyle = PAL.wall;
      ctx.fillRect(w.x, w.y, w.w, w.h);
      ctx.fillStyle = PAL.wallTop;
      ctx.fillRect(w.x, w.y, w.w, 4);
      ctx.fillRect(w.x, w.y, 4, w.h);
    }
    for (const c of state.level.cover) {
      ctx.fillStyle = PAL.shadow;
      ctx.fillRect(c.x + 3, c.y + 3, c.w, c.h);
      ctx.fillStyle = PAL.wall;
      ctx.fillRect(c.x, c.y, c.w, c.h);
      ctx.fillStyle = PAL.wallTop;
      ctx.fillRect(c.x, c.y, c.w, 3);
      ctx.fillRect(c.x, c.y, 3, c.h);
    }
  }

  function drawShelves(state) {
    for (const s of state.level.shelves) {
      ctx.fillStyle = PAL.shelf;
      ctx.fillRect(s.x, s.y, s.w, s.h);
      ctx.strokeStyle = '#3a2818';
      ctx.lineWidth = 1;
      ctx.strokeRect(s.x, s.y, s.w, s.h);
    }
  }

  function drawTerminals(state) {
    for (const l of state.loot) {
      if (l.taken || l.type !== 'terminal') continue;
      ctx.fillStyle = PAL.terminal;
      ctx.fillRect(l.x - 16, l.y - 16, 32, 32);
      ctx.fillStyle = PAL.text;
      ctx.font = 'bold 14px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('▣', l.x, l.y + 2);
      if (state.thief.channel === l) {
        const pct = l.channelProg / l.channelTime;
        ctx.strokeStyle = PAL.loot;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(l.x, l.y, 24, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * pct);
        ctx.stroke();
      }
    }
  }

  function drawVaultCore(state) {
    for (const l of state.loot) {
      if (l.taken || l.type !== 'vault') continue;
      ctx.fillStyle = PAL.loot;
      ctx.beginPath();
      ctx.arc(l.x, l.y, 18, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = PAL.panel;
      ctx.beginPath();
      ctx.arc(l.x, l.y, 10, 0, Math.PI * 2);
      ctx.fill();
      if (state.thief.channel === l) {
        const pct = l.channelProg / l.channelTime;
        ctx.strokeStyle = PAL.loot;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(l.x, l.y, 24, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * pct);
        ctx.stroke();
      }
    }
  }

  function drawDataCores(state) {
    for (const l of state.loot) {
      if (l.taken || l.type !== 'core') continue;
      ctx.fillStyle = PAL.loot;
      ctx.beginPath();
      ctx.moveTo(l.x, l.y - 14);
      ctx.lineTo(l.x + 12, l.y);
      ctx.lineTo(l.x, l.y + 14);
      ctx.lineTo(l.x - 12, l.y);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = PAL.panel;
      ctx.beginPath();
      ctx.moveTo(l.x, l.y - 6);
      ctx.lineTo(l.x + 6, l.y);
      ctx.lineTo(l.x, l.y + 6);
      ctx.lineTo(l.x - 6, l.y);
      ctx.closePath();
      ctx.fill();
    }
  }

  function drawLasers(state) {
    for (const l of state.lasers) {
      if (!l.on) continue;
      ctx.strokeStyle = PAL.laser;
      ctx.lineWidth = l.thickness * scale;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(l.x1, l.y1);
      ctx.lineTo(l.x2, l.y2);
      ctx.stroke();
      ctx.fillStyle = PAL.laser;
      for (let t = 0; t <= 1; t += 0.1) {
        const x = l.x1 + (l.x2 - l.x1) * t;
        const y = l.y1 + (l.y2 - l.y1) * t;
        ctx.beginPath();
        ctx.arc(x, y, 3 * scale, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  function drawExit(state) {
    if (!state.exit.open) return;
    ctx.fillStyle = PAL.exit;
    ctx.fillRect(state.exit.x, state.exit.y, state.exit.w, state.exit.h);
    ctx.fillStyle = PAL.text;
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('EXIT', state.exit.x + state.exit.w / 2, state.exit.y + state.exit.h / 2);
  }

  function drawCone(cx, cy, facing, range, halfAngle, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    const start = facing - halfAngle;
    const end = facing + halfAngle;
    const steps = 16;
    for (let i = 0; i <= steps; i++) {
      const a = start + (end - start) * (i / steps);
      ctx.lineTo(cx + Math.cos(a) * range, cy + Math.sin(a) * range);
    }
    ctx.closePath();
    ctx.fill();
  }

  function drawGuards(state) {
    for (const g of state.guards) {
      drawCone(g.x, g.y, g.facing, g.coneR, g.coneA, PAL.coneGuard);
      ctx.fillStyle = g.alert ? PAL.guardDark : PAL.guard;
      ctx.beginPath();
      ctx.arc(g.x, g.y, g.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = PAL.text;
      ctx.beginPath();
      ctx.arc(g.x + Math.cos(g.facing) * g.radius * 0.6, g.y + Math.sin(g.facing) * g.radius * 0.6, 3, 0, Math.PI * 2);
      ctx.fill();
      if (g.state === 'investigate') {
        ctx.fillStyle = PAL.loot;
        ctx.font = 'bold 20px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('?', g.x, g.y - g.radius - 10);
      } else if (inCone(state.thief.x, state.thief.y, g.x, g.y, g.facing, g.coneR, g.coneA) &&
                 losClear(g.x, g.y, state.thief.x, state.thief.y, state.level.walls)) {
        ctx.fillStyle = PAL.alarmHigh;
        ctx.font = 'bold 20px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('!', g.x, g.y - g.radius - 10);
      }
    }
  }

  function inCone(px, py, cx, cy, facing, range, halfAngle) {
    const dx = px - cx, dy = py - cy;
    const d2 = dx * dx + dy * dy;
    if (d2 > range * range) return false;
    const ang = Math.atan2(dy, dx);
    let d = ang - facing;
    while (d <= -Math.PI) d += 2 * Math.PI;
    while (d > Math.PI) d -= 2 * Math.PI;
    return Math.abs(d) <= halfAngle;
  }

  function losClear(x1, y1, x2, y2, walls) {
    for (const w of walls) {
      const left = w.x, right = w.x + w.w, top = w.y, bottom = w.y + w.h;
      if ((x1 < left && x2 < left) || (x1 > right && x2 > right) ||
          (y1 < top && y2 < top) || (y1 > bottom && y2 > bottom)) continue;
      const dx = x2 - x1, dy = y2 - y1;
      if (dx === 0 && dy === 0) return x1 >= left && x1 <= right && y1 >= top && y1 <= bottom;
      let t0 = 0, t1 = 1;
      const edges = [[-dx, x1 - left], [dx, right - x1], [-dy, y1 - top], [dy, bottom - y1]];
      for (const [p, q] of edges) {
        if (p === 0) { if (q < 0) return false; }
        else { const t = q / p; if (p < 0) { if (t > t1) return false; if (t > t0) t0 = t; } else { if (t < t0) return false; if (t < t1) t1 = t; } }
      }
      if (t0 <= t1) return false;
    }
    return true;
  }

  function drawCameras(state) {
    for (const c of state.cameras) {
      drawCone(c.x, c.y, c.angle, c.coneR, c.coneA, PAL.coneCamera);
      ctx.fillStyle = PAL.camera;
      ctx.beginPath();
      ctx.arc(c.x, c.y, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = PAL.panel;
      ctx.beginPath();
      ctx.arc(c.x + Math.cos(c.angle) * 6, c.y + Math.sin(c.angle) * 6, 3, 0, Math.PI * 2);
      ctx.fill();
      if (c.locked) {
        ctx.strokeStyle = PAL.alarmHigh;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(c.x, c.y, 14, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
  }

  function drawThief(state) {
    const t = state.thief;
    ctx.fillStyle = t.dashing ? PAL.loot : PAL.thief;
    ctx.beginPath();
    ctx.arc(t.x, t.y, t.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = PAL.thiefDark;
    ctx.beginPath();
    ctx.arc(t.x + Math.cos(t.facing) * t.radius * 0.5, t.y + Math.sin(t.facing) * t.radius * 0.5, 3, 0, Math.PI * 2);
    ctx.fill();
    if (t.dashing) {
      ctx.strokeStyle = PAL.loot;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(t.x, t.y, t.radius + 6, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  function drawCoinLanding(state) {
    if (!state.coinLanding) return;
    const c = state.coinLanding;
    const pulse = Math.sin(Date.now() * 0.01) * 2;
    ctx.strokeStyle = PAL.loot;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(c.x, c.y, 12 + pulse, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = PAL.loot;
    ctx.font = '16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('$', c.x, c.y + 5);
  }

  function drawParticles(state) {
    for (const p of state.particles) {
      ctx.globalAlpha = Math.max(0, p.life / (p.maxLife || 1));
      ctx.fillStyle = p.color || PAL.text;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size || 2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function drawHUD(state) {
    ctx.save();
    ctx.scale(scale, scale);
    ctx.translate(offsetX / scale, offsetY / scale);
    
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillStyle = PAL.text;
    ctx.fillText(`SCORE ${state.score}`, 16, 16);
    ctx.fillStyle = PAL.muted;
    ctx.fillText(`BEST ${state.stats.bestScore}`, 16, 34);

    ctx.textAlign = 'center';
    ctx.fillStyle = PAL.text;
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText(state.levelName, FW / 2, 16);
    ctx.font = '14px sans-serif';
    ctx.fillStyle = PAL.muted;
    ctx.fillText(`LOOT ${state.stats.lootTaken}/${state.lootQuota}`, FW / 2, 38);

    // Exposure meter: alarmOk (<40), alarmMid (40-79), alarmHigh (>=80)
    const barW = 200, barH = 16;
    const barX = FW - barW - 16;
    const barY = 16;
    const pct = state.exposure / 100;
    ctx.fillStyle = PAL.panel;
    ctx.fillRect(barX, barY, barW, barH);
    ctx.fillStyle = state.exposure >= 80 ? PAL.alarmHigh : state.exposure >= 40 ? PAL.alarmMid : PAL.alarmOk;
    ctx.fillRect(barX, barY, barW * pct, barH);
    ctx.strokeStyle = PAL.muted;
    ctx.lineWidth = 1;
    ctx.strokeRect(barX, barY, barW, barH);
    ctx.fillStyle = PAL.text;
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText('EXPOSURE', barX - 8, barY + 2);

    ctx.textAlign = 'left';
    ctx.font = '14px sans-serif';
    ctx.fillStyle = PAL.text;
    ctx.fillText(`COINS ${state.coinsLeft}`, 16, FH - 40);
    if (state.thief.channel === null && !state.thief.dashing) {
      ctx.fillStyle = state.inputSneak ? PAL.alarmOk : PAL.muted;
      ctx.fillText(state.inputSneak ? 'SNEAK' : 'RUN', 16, FH - 22);
    }

    ctx.textAlign = 'center';
    if (state.prompt) {
      ctx.fillStyle = PAL.loot;
      ctx.font = 'bold 16px sans-serif';
      ctx.fillText(state.prompt, FW / 2, FH - 30);
    }

    ctx.font = 'bold 18px sans-serif';
    let bannerColor = PAL.alarmOk;
    if (state.stealthState === 'SPOTTED') bannerColor = PAL.alarmMid;
    else if (state.stealthState === 'LOCKDOWN') bannerColor = PAL.alarmHigh;
    ctx.fillStyle = bannerColor;
    ctx.fillText(state.stealthState, FW / 2, FH - 60);
    ctx.restore();
  }

  function drawScreen(state) {
    ctx.save();
    ctx.scale(scale, scale);
    ctx.translate(offsetX / scale, offsetY / scale);
    ctx.fillStyle = 'rgba(18,22,29,0.92)';
    ctx.fillRect(0, 0, FW, FH);
    ctx.fillStyle = PAL.text;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    if (state.screen === 'TITLE') {
      ctx.font = 'bold 48px sans-serif';
      ctx.fillText('GREYLINE PROTOCOL', FW / 2, FH / 2 - 60);
      ctx.font = '20px sans-serif';
      ctx.fillStyle = PAL.muted;
      ctx.fillText('Infiltrate. Extract. Vanish.', FW / 2, FH / 2 - 10);
      ctx.fillStyle = PAL.loot;
      ctx.font = 'bold 18px sans-serif';
      ctx.fillText('PRESS ENTER OR CLICK TO BEGIN', FW / 2, FH / 2 + 50);
      ctx.font = '14px sans-serif';
      ctx.fillStyle = PAL.muted;
      ctx.fillText('WASD/Arrows move  •  Shift sneak  •  Space dash  •  E interact  •  Click throw coin', FW / 2, FH / 2 + 90);
    } else if (state.screen === 'LEVEL_CLEAR') {
      ctx.font = 'bold 36px sans-serif';
      ctx.fillStyle = PAL.alarmOk;
      ctx.fillText('LEVEL CLEAR', FW / 2, FH / 2 - 80);
      ctx.font = '18px sans-serif';
      ctx.fillStyle = PAL.text;
      ctx.fillText(`${state.levelName} complete`, FW / 2, FH / 2 - 30);
      ctx.fillText(`Level Score: ${state.levelScore}`, FW / 2, FH / 2);
      ctx.fillText(`Time Bonus: ${state.timeBonus}`, FW / 2, FH / 2 + 30);
      if (state.stats.ghostBonus) ctx.fillText(`Ghost Bonus: ${state.stats.ghostBonus}`, FW / 2, FH / 2 + 60);
      ctx.fillStyle = PAL.muted;
      ctx.font = '14px sans-serif';
      ctx.fillText('Press Enter to continue', FW / 2, FH / 2 + 110);
    } else if (state.screen === 'PAUSED') {
      ctx.font = 'bold 36px sans-serif';
      ctx.fillText('PAUSED', FW / 2, FH / 2 - 20);
      ctx.font = '16px sans-serif';
      ctx.fillStyle = PAL.muted;
      ctx.fillText('Press P or Esc to resume', FW / 2, FH / 2 + 30);
    } else if (state.screen === 'CAUGHT') {
      ctx.font = 'bold 42px sans-serif';
      ctx.fillStyle = PAL.alarmHigh;
      ctx.fillText('CAUGHT', FW / 2, FH / 2 - 40);
      ctx.font = '18px sans-serif';
      ctx.fillStyle = PAL.text;
      ctx.fillText(`Final Score: ${state.score}`, FW / 2, FH / 2 + 10);
      ctx.fillStyle = PAL.muted;
      ctx.font = '14px sans-serif';
      ctx.fillText('Press R or Click to restart level', FW / 2, FH / 2 + 60);
    } else if (state.screen === 'WIN') {
      ctx.font = 'bold 42px sans-serif';
      ctx.fillStyle = PAL.loot;
      ctx.fillText('MISSION COMPLETE', FW / 2, FH / 2 - 100);
      ctx.font = '18px sans-serif';
      ctx.fillStyle = PAL.text;
      ctx.fillText(`Final Score: ${state.stats.score}`, FW / 2, FH / 2 - 40);
      ctx.fillText(`Best Score: ${state.stats.bestScore}`, FW / 2, FH / 2 - 10);
      ctx.fillText(`Loot Collected: ${state.stats.lootTaken}`, FW / 2, FH / 2 + 20);
      ctx.fillText(`Times Spotted: ${state.stats.timesSpotted}`, FW / 2, FH / 2 + 50);
      ctx.fillText(`Coins Thrown: ${state.stats.coinsThrown}`, FW / 2, FH / 2 + 80);
      ctx.fillText(`Lockdowns: ${state.stats.lockdowns}`, FW / 2, FH / 2 + 110);
      if (state.stats.ghostBonus) {
        ctx.fillStyle = PAL.loot;
        ctx.fillText('GHOST BONUS ACHIEVED', FW / 2, FH / 2 + 140);
      }
      ctx.fillStyle = PAL.muted;
      ctx.font = '14px sans-serif';
      ctx.fillText('Press R or Click to play again', FW / 2, FH / 2 + 180);
    }
    ctx.restore();
  }

  function draw(state) {
    if (shakeTimer > 0) {
      shakeX = (Math.random() - 0.5) * shakeTimer * 8;
      shakeY = (Math.random() - 0.5) * shakeTimer * 8;
      shakeTimer = Math.max(0, shakeTimer - 1/60);
    } else {
      shakeX = 0; shakeY = 0;
    }

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.translate(offsetX + shakeX, offsetY + shakeY);
    ctx.scale(scale, scale);

    drawFloor(state);
    drawWalls(state);
    drawShelves(state);
    drawLasers(state);
    drawTerminals(state);
    drawVaultCore(state);
    drawDataCores(state);
    drawExit(state);
    drawCameras(state);
    drawGuards(state);
    drawThief(state);
    drawCoinLanding(state);
    drawParticles(state);

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    drawHUD(state);

    if (state.screen !== 'PLAY') {
      drawScreen(state);
    }
  }

  resize();
  window.addEventListener('resize', resize);

  return { draw, view, setShake, resize };
}

export { createRenderer };