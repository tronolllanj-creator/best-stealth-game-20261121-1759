export function createInput(canvas) {
  const keys = new Set();
  const pressed = new Set();
  const released = new Set();
  const clickQueue = [];
  let mx = 0, my = 0;
  const actionMap = {
    'KeyW': 'up', 'ArrowUp': 'up',
    'KeyS': 'down', 'ArrowDown': 'down',
    'KeyA': 'left', 'ArrowLeft': 'left',
    'KeyD': 'right', 'ArrowRight': 'right',
    'ShiftLeft': 'sneak', 'ShiftRight': 'sneak',
    'Space': 'dash',
    'KeyE': 'interact',
    'KeyP': 'pause', 'Escape': 'pause',
    'KeyM': 'mute',
    'Enter': 'confirm',
    'KeyR': 'restart'
  };

  function onKeyDown(e) {
    const act = actionMap[e.code];
    if (act) {
      if (!keys.has(act)) pressed.add(act);
      keys.add(act);
      e.preventDefault();
    }
  }
  function onKeyUp(e) {
    const act = actionMap[e.code];
    if (act) {
      keys.delete(act);
      released.add(act);
      e.preventDefault();
    }
  }
  function onMouseMove(e) {
    const rect = canvas.getBoundingClientRect();
    mx = e.clientX - rect.left;
    my = e.clientY - rect.top;
  }
  function onMouseDown(e) {
    if (e.button === 0) {
      const rect = canvas.getBoundingClientRect();
      clickQueue.push({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    }
  }

  canvas.addEventListener('keydown', onKeyDown);
  canvas.addEventListener('keyup', onKeyUp);
  canvas.addEventListener('mousemove', onMouseMove);
  canvas.addEventListener('mousedown', onMouseDown);
  canvas.setAttribute('tabindex', '0');
  canvas.focus();

  function update() {
    pressed.clear();
    released.clear();
  }

  function isDown(action) { return keys.has(action); }
  function wasPressed(action) { return pressed.has(action); }
  function wasReleased(action) { return released.has(action); }
  function getMouse() { return { x: mx, y: my }; }
  function consumeClicks() { const c = clickQueue.slice(); clickQueue.length = 0; return c; }
  // Queue actions so each is consumed once per frame, avoiding double-handling
  function getActions() {
    return {
      dash: wasPressed('dash'),
      coinAt: consumeClicks()[0] || null,
      confirm: wasPressed('confirm'),
      restart: wasPressed('restart'),
      pause: wasPressed('pause'),
      mute: wasPressed('mute')
    };
  }

  return { update, isDown, wasPressed, wasReleased, getMouse, consumeClicks, getActions };
}
