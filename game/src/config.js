export const CONFIG = {
  palette: {
    floor: '#232a35',
    floorAlt: '#1e242e',
    wall: '#3d4a5c',
    wallTop: '#5a6b80',
    shadow: '#0a0d12',
    shelf: '#4a3423',
    thief: '#7ee0a3',
    thiefDark: '#2f7a4d',
    guard: '#e05a4e',
    guardDark: '#8f2f28',
    camera: '#ffd24d',
    coneGuard: 'rgba(224,90,78,0.26)',
    coneCamera: 'rgba(255,210,77,0.22)',
    loot: '#59d8ff',
    terminal: '#b8c4cc',
    laser: '#ff5a7a',
    exit: '#59d867',
    alarmOk: '#59d867',
    alarmMid: '#f0a040',
    alarmHigh: '#e05a4e',
    text: '#e8eef4',
    muted: '#8fa3b0',
    panel: '#12161d'
  },
  field: { w: 1280, h: 720 },
  thief: { speed: 175, sneakSpeed: 88, dashSpeed: 540, dashTime: 0.14, dashCooldown: 1.8, dashNoiseExposure: 12, radius: 14 },
  guard: { coneRange: 235, coneHalfAngle: 33, patrolSpeed: 70, investigateSpeed: 110, chaseSpeed: 180, radius: 16, touchShoveForce: 220, touchPause: 1.0 },
  camera: { coneRange: 265, coneHalfAngle: 28, sweepSpeed: 35, sweepRange: 120 },
  laser: { onRatio: 0.5, touchExposure: 30, alertRange: 200 },
  detection: { baseRateStand: 55, baseRateSneak: 30, cameraRate: 70, distanceFalloff: 0.5, shadowMult: 0.4 },
  exposure: { hiddenDelay: 1.5, hiddenDecay: 18, lockdownThreshold: 100, lockdownDuration: 6, caughtThreshold: 50, touchShoveExposure: 25 },
  scoring: { dataCore: 250, terminal: 500, vaultCore: 1000, levelClearBase: 500, timeBonusPerSec: 10, ghostBonus: 1000 },
  coinsPerLevel: 3,
  coinInvestigateRange: 240,
  coinInvestigateTime: 4,
  terminalHackTime: 2.5,
  vaultCoreHackTime: 3.0,
  // Five floors escalate: guards 2→2→3→3→4, cameras 1→2→2→3→3, lasers 2→3→4→4→5, quota 4→5→5→6→7.
  LEVELS: [
    {
      name: 'THE FOYER',
      parTime: 120,
      quota: 4,
      spawn: { x: 80, y: 640 },
      exit: { x: 1150, y: 40, w: 80, h: 80 },
      walls: [
        { x: 0, y: 0, w: 1280, h: 40 },
        { x: 0, y: 680, w: 1280, h: 40 },
        { x: 0, y: 0, w: 40, h: 720 },
        { x: 1240, y: 0, w: 40, h: 720 },
        { x: 200, y: 120, w: 40, h: 400 },
        { x: 500, y: 120, w: 40, h: 300 },
        { x: 800, y: 300, w: 40, h: 380 },
        { x: 1000, y: 120, w: 40, h: 200 }
      ],
      cover: [
        { x: 150, y: 200, w: 80, h: 80 },
        { x: 400, y: 500, w: 100, h: 60 },
        { x: 700, y: 350, w: 80, h: 100 },
        { x: 950, y: 500, w: 60, h: 80 }
      ],
      shelves: [
        { x: 300, y: 200, w: 180, h: 40 },
        { x: 600, y: 400, w: 160, h: 40 },
        { x: 1100, y: 300, w: 100, h: 40 }
      ],
      shadows: [
        { x: 100, y: 300, w: 120, h: 120 },
        { x: 450, y: 550, w: 140, h: 100 },
        { x: 900, y: 200, w: 100, h: 150 }
      ],
      loot: [
        { type: 'dataCore', x: 180, y: 220 },
        { type: 'dataCore', x: 650, y: 420 },
        { type: 'dataCore', x: 1120, y: 320 },
        { type: 'terminal', x: 400, y: 250 }
      ],
      guards: [
        { waypoints: [{ x: 250, y: 200 }, { x: 250, y: 500 }], startIndex: 0 },
        { waypoints: [{ x: 850, y: 350 }, { x: 1150, y: 350 }, { x: 1150, y: 600 }], startIndex: 0 }
      ],
      cameras: [
        { x: 640, y: 360, baseAngle: -90, sweepRange: 120 }
      ],
      lasers: [
        { x: 400, y: 120, angle: 90, length: 400, period: 4, phase: 0 },
        { x: 900, y: 680, angle: -90, length: 300, period: 3, phase: 1.5 }
      ]
    },
    {
      name: 'RECORDS HALL',
      parTime: 150,
      quota: 5,
      spawn: { x: 80, y: 640 },
      exit: { x: 1150, y: 40, w: 80, h: 80 },
      walls: [
        { x: 0, y: 0, w: 1280, h: 40 },
        { x: 0, y: 680, w: 1280, h: 40 },
        { x: 0, y: 0, w: 40, h: 720 },
        { x: 1240, y: 0, w: 40, h: 720 },
        { x: 300, y: 100, w: 40, h: 500 },
        { x: 600, y: 120, w: 40, h: 400 },
        { x: 900, y: 200, w: 40, h: 480 },
        { x: 150, y: 300, w: 120, h: 40 }
      ],
      cover: [
        { x: 200, y: 200, w: 80, h: 80 },
        { x: 450, y: 400, w: 100, h: 60 },
        { x: 750, y: 300, w: 80, h: 100 },
        { x: 1050, y: 500, w: 60, h: 80 },
        { x: 1150, y: 200, w: 60, h: 60 }
      ],
      shelves: [
        { x: 400, y: 150, w: 180, h: 40 },
        { x: 700, y: 550, w: 160, h: 40 },
        { x: 1000, y: 250, w: 100, h: 40 },
        { x: 200, y: 500, w: 120, h: 40 }
      ],
      shadows: [
        { x: 150, y: 400, w: 120, h: 120 },
        { x: 500, y: 550, w: 140, h: 100 },
        { x: 950, y: 300, w: 100, h: 150 },
        { x: 1100, y: 550, w: 100, h: 100 }
      ],
      loot: [
        { type: 'dataCore', x: 220, y: 220 },
        { type: 'dataCore', x: 480, y: 170 },
        { type: 'dataCore', x: 780, y: 570 },
        { type: 'terminal', x: 1020, y: 270 },
        { type: 'terminal', x: 250, y: 520 }
      ],
      guards: [
        { waypoints: [{ x: 350, y: 200 }, { x: 350, y: 550 }], startIndex: 0 },
        { waypoints: [{ x: 950, y: 250 }, { x: 1150, y: 250 }, { x: 1150, y: 600 }, { x: 950, y: 600 }], startIndex: 0 }
      ],
      cameras: [
        { x: 640, y: 360, baseAngle: -90, sweepRange: 120 },
        { x: 200, y: 600, baseAngle: 0, sweepRange: 90 }
      ],
      lasers: [
        { x: 500, y: 120, angle: 90, length: 350, period: 3.5, phase: 0 },
        { x: 800, y: 680, angle: -90, length: 300, period: 4, phase: 1 },
        { x: 1240, y: 400, angle: 180, length: 250, period: 5, phase: 2 }
      ]
    },
    {
      name: 'SERVER VAULT',
      parTime: 180,
      quota: 5,
      spawn: { x: 80, y: 640 },
      exit: { x: 1150, y: 40, w: 80, h: 80 },
      walls: [
        { x: 0, y: 0, w: 1280, h: 40 },
        { x: 0, y: 680, w: 1280, h: 40 },
        { x: 0, y: 0, w: 40, h: 720 },
        { x: 1240, y: 0, w: 40, h: 720 },
        { x: 400, y: 100, w: 40, h: 500 },
        { x: 800, y: 120, w: 40, h: 400 },
        { x: 200, y: 300, w: 160, h: 40 },
        { x: 1000, y: 200, w: 200, h: 40 }
      ],
      cover: [
        { x: 150, y: 200, w: 80, h: 80 },
        { x: 350, y: 450, w: 100, h: 60 },
        { x: 650, y: 300, w: 80, h: 100 },
        { x: 950, y: 400, w: 60, h: 80 },
        { x: 1150, y: 300, w: 60, h: 60 },
        { x: 50, y: 500, w: 80, h: 80 }
      ],
      shelves: [
        { x: 500, y: 150, w: 200, h: 40 },
        { x: 900, y: 500, w: 180, h: 40 },
        { x: 300, y: 550, w: 120, h: 40 }
      ],
      shadows: [
        { x: 100, y: 400, w: 120, h: 120 },
        { x: 600, y: 500, w: 140, h: 100 },
        { x: 1050, y: 350, w: 100, h: 150 },
        { x: 200, y: 550, w: 100, h: 100 }
      ],
      loot: [
        { type: 'dataCore', x: 180, y: 220 },
        { type: 'dataCore', x: 580, y: 170 },
        { type: 'terminal', x: 950, y: 520 },
        { type: 'terminal', x: 350, y: 570 },
        { type: 'vaultCore', x: 1120, y: 320 }
      ],
      guards: [
        { waypoints: [{ x: 450, y: 200 }, { x: 450, y: 550 }], startIndex: 0 },
        { waypoints: [{ x: 850, y: 180 }, { x: 1150, y: 180 }, { x: 1150, y: 550 }], startIndex: 0 },
        { waypoints: [{ x: 150, y: 550 }, { x: 350, y: 550 }, { x: 350, y: 350 }], startIndex: 0 }
      ],
      cameras: [
        { x: 640, y: 360, baseAngle: -90, sweepRange: 120 },
        { x: 1100, y: 600, baseAngle: 180, sweepRange: 90 }
      ],
      lasers: [
        { x: 600, y: 120, angle: 90, length: 400, period: 3, phase: 0 },
        { x: 1000, y: 680, angle: -90, length: 350, period: 3.5, phase: 1 },
        { x: 40, y: 400, angle: 0, length: 300, period: 4, phase: 2 },
        { x: 1240, y: 300, angle: 180, length: 250, period: 5, phase: 2.5 }
      ]
    },
    {
      name: 'EXECUTIVE WING',
      parTime: 210,
      quota: 6,
      spawn: { x: 80, y: 640 },
      exit: { x: 1150, y: 40, w: 80, h: 80 },
      walls: [
        { x: 0, y: 0, w: 1280, h: 40 },
        { x: 0, y: 680, w: 1280, h: 40 },
        { x: 0, y: 0, w: 40, h: 720 },
        { x: 1240, y: 0, w: 40, h: 720 },
        { x: 300, y: 100, w: 40, h: 500 },
        { x: 700, y: 120, w: 40, h: 400 },
        { x: 1000, y: 200, w: 40, h: 480 },
        { x: 500, y: 300, w: 200, h: 40 }
      ],
      cover: [
        { x: 200, y: 200, w: 80, h: 80 },
        { x: 400, y: 400, w: 100, h: 60 },
        { x: 600, y: 300, w: 80, h: 100 },
        { x: 850, y: 400, w: 60, h: 80 },
        { x: 1150, y: 200, w: 60, h: 60 },
        { x: 1050, y: 550, w: 60, h: 80 }
      ],
      shelves: [
        { x: 450, y: 150, w: 180, h: 40 },
        { x: 800, y: 550, w: 160, h: 40 },
        { x: 1100, y: 250, w: 100, h: 40 },
        { x: 600, y: 200, w: 120, h: 40 }
      ],
      shadows: [
        { x: 150, y: 400, w: 120, h: 120 },
        { x: 550, y: 550, w: 140, h: 100 },
        { x: 950, y: 300, w: 100, h: 150 },
        { x: 1100, y: 550, w: 100, h: 100 }
      ],
      loot: [
        { type: 'dataCore', x: 220, y: 220 },
        { type: 'dataCore', x: 500, y: 170 },
        { type: 'dataCore', x: 820, y: 570 },
        { type: 'terminal', x: 1120, y: 270 },
        { type: 'terminal', x: 650, y: 220 },
        { type: 'vaultCore', x: 1000, y: 500 }
      ],
      guards: [
        { waypoints: [{ x: 350, y: 200 }, { x: 350, y: 550 }], startIndex: 0 },
        { waypoints: [{ x: 750, y: 180 }, { x: 1150, y: 180 }, { x: 1150, y: 550 }, { x: 750, y: 550 }], startIndex: 0 },
        { waypoints: [{ x: 1050, y: 250 }, { x: 1050, y: 500 }], startIndex: 0 }
      ],
      cameras: [
        { x: 640, y: 360, baseAngle: -90, sweepRange: 120 },
        { x: 200, y: 600, baseAngle: 0, sweepRange: 90 },
        { x: 1100, y: 100, baseAngle: 90, sweepRange: 90 }
      ],
      lasers: [
        { x: 500, y: 120, angle: 90, length: 350, period: 3, phase: 0 },
        { x: 900, y: 680, angle: -90, length: 300, period: 3.5, phase: 1 },
        { x: 1240, y: 400, angle: 180, length: 250, period: 4, phase: 2 },
        { x: 40, y: 300, angle: 0, length: 250, period: 4.5, phase: 2.5 }
      ]
    },
    {
      name: 'ROOFTOP',
      parTime: 240,
      quota: 7,
      spawn: { x: 80, y: 640 },
      exit: { x: 1150, y: 40, w: 80, h: 80 },
      walls: [
        { x: 0, y: 0, w: 1280, h: 40 },
        { x: 0, y: 680, w: 1280, h: 40 },
        { x: 0, y: 0, w: 40, h: 720 },
        { x: 1240, y: 0, w: 40, h: 720 },
        { x: 250, y: 100, w: 40, h: 500 },
        { x: 550, y: 120, w: 40, h: 400 },
        { x: 850, y: 200, w: 40, h: 480 },
        { x: 1150, y: 120, w: 40, h: 200 }
      ],
      cover: [
        { x: 150, y: 200, w: 80, h: 80 },
        { x: 350, y: 400, w: 100, h: 60 },
        { x: 650, y: 300, w: 80, h: 100 },
        { x: 950, y: 400, w: 60, h: 80 },
        { x: 1150, y: 300, w: 60, h: 60 },
        { x: 50, y: 500, w: 80, h: 80 },
        { x: 1000, y: 550, w: 60, h: 80 }
      ],
      shelves: [
        { x: 400, y: 150, w: 180, h: 40 },
        { x: 700, y: 550, w: 160, h: 40 },
        { x: 1000, y: 250, w: 100, h: 40 },
        { x: 300, y: 550, w: 120, h: 40 }
      ],
      shadows: [
        { x: 100, y: 400, w: 120, h: 120 },
        { x: 500, y: 550, w: 140, h: 100 },
        { x: 900, y: 300, w: 100, h: 150 },
        { x: 1100, y: 550, w: 100, h: 100 }
      ],
      loot: [
        { type: 'dataCore', x: 180, y: 220 },
        { type: 'dataCore', x: 450, y: 170 },
        { type: 'dataCore', x: 750, y: 570 },
        { type: 'dataCore', x: 1050, y: 270 },
        { type: 'terminal', x: 350, y: 570 },
        { type: 'terminal', x: 1000, y: 570 },
        { type: 'vaultCore', x: 1120, y: 320 }
      ],
      guards: [
        { waypoints: [{ x: 300, y: 200 }, { x: 300, y: 550 }], startIndex: 0 },
        { waypoints: [{ x: 600, y: 180 }, { x: 1150, y: 180 }, { x: 1150, y: 550 }, { x: 600, y: 550 }], startIndex: 0 },
        { waypoints: [{ x: 900, y: 250 }, { x: 900, y: 600 }], startIndex: 0 },
        { waypoints: [{ x: 150, y: 550 }, { x: 450, y: 550 }, { x: 450, y: 350 }], startIndex: 0 }
      ],
      cameras: [
        { x: 640, y: 360, baseAngle: -90, sweepRange: 120 },
        { x: 200, y: 600, baseAngle: 0, sweepRange: 90 },
        { x: 1100, y: 100, baseAngle: 90, sweepRange: 90 }
      ],
      lasers: [
        { x: 450, y: 120, angle: 90, length: 400, period: 2.5, phase: 0 },
        { x: 800, y: 680, angle: -90, length: 350, period: 3, phase: 1 },
        { x: 1240, y: 400, angle: 180, length: 250, period: 3.5, phase: 2 },
        { x: 40, y: 300, angle: 0, length: 200, period: 4, phase: 2.5 },
        { x: 1150, y: 320, angle: -90, length: 180, period: 4.5, phase: 3 }
      ]
    }
  ]
};
