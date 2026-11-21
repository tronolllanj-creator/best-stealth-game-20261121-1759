export function createAudio() {
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  // Master gain at 0.35 — low to avoid clipping when sounds layer
  const master = ctx.createGain();
  master.gain.value = 0.35;
  master.connect(ctx.destination);
  let muted = false;

  function unlock() { if (ctx.state === 'suspended') ctx.resume(); }

  function play(fn) { if (!muted) fn(); }

  // short tick for footsteps
  function footstep() {
    play(() => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'square';
      o.frequency.value = 80;
      g.gain.value = 0.15;
      o.connect(g).connect(master);
      const t = ctx.currentTime;
      g.gain.setValueAtTime(0.15, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
      o.start(t);
      o.stop(t + 0.07);
    });
  }

  // bright double-tone for coin
  function coin() {
    play(() => {
      const t = ctx.currentTime;
      [880, 1320].forEach((f, i) => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = 'sine';
        o.frequency.value = f;
        g.gain.value = 0.12;
        o.connect(g).connect(master);
        const st = t + i * 0.05;
        g.gain.setValueAtTime(0.12, st);
        g.gain.exponentialRampToValueAtTime(0.001, st + 0.12);
        o.start(st);
        o.stop(st + 0.13);
      });
    });
  }

  // soft chime for grab
  function grab() {
    play(() => {
      const t = ctx.currentTime;
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'sine';
      o.frequency.setValueAtTime(660, t);
      o.frequency.exponentialRampToValueAtTime(1320, t + 0.15);
      g.gain.value = 0.1;
      o.connect(g).connect(master);
      g.gain.setValueAtTime(0.1, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
      o.start(t);
      o.stop(t + 0.21);
    });
  }

  // click for hack
  function hackClick() {
    play(() => {
      const t = ctx.currentTime;
      const bufferSize = ctx.sampleRate * 0.02;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.1));
      const src = ctx.createBufferSource();
      const g = ctx.createGain();
      src.buffer = buffer;
      g.gain.value = 0.08;
      src.connect(g).connect(master);
      src.start(t);
    });
  }

  // dissonant sting for spotted
  function spotted() {
    play(() => {
      const t = ctx.currentTime;
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'sawtooth';
      o.frequency.setValueAtTime(440, t);
      o.frequency.exponentialRampToValueAtTime(220, t + 0.25);
      g.gain.value = 0.18;
      o.connect(g).connect(master);
      g.gain.setValueAtTime(0.18, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
      o.start(t);
      o.stop(t + 0.31);
    });
  }

  // alternating siren blips for alarm
  function alarm() {
    play(() => {
      const t = ctx.currentTime;
      [0, 0.18, 0.36, 0.54].forEach((delay, i) => {
        const f = i % 2 === 0 ? 880 : 660;
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = 'square';
        o.frequency.value = f;
        g.gain.value = 0.14;
        o.connect(g).connect(master);
        const st = t + delay;
        g.gain.setValueAtTime(0.14, st);
        g.gain.exponentialRampToValueAtTime(0.001, st + 0.12);
        o.start(st);
        o.stop(st + 0.13);
      });
    });
  }

  // upward arpeggio for level clear
  function levelClear() {
    play(() => {
      const t = ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5 E5 G5 C6
      notes.forEach((f, i) => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = 'triangle';
        o.frequency.value = f;
        g.gain.value = 0.1;
        o.connect(g).connect(master);
        const st = t + i * 0.07;
        g.gain.setValueAtTime(0.1, st);
        g.gain.exponentialRampToValueAtTime(0.001, st + 0.25);
        o.start(st);
        o.stop(st + 0.26);
      });
    });
  }

  // low thud for caught
  function caught() {
    play(() => {
      const t = ctx.currentTime;
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'sine';
      o.frequency.setValueAtTime(120, t);
      o.frequency.exponentialRampToValueAtTime(40, t + 0.15);
      g.gain.value = 0.25;
      o.connect(g).connect(master);
      g.gain.setValueAtTime(0.25, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
      o.start(t);
      o.stop(t + 0.31);
    });
  }

  // winning arpeggio
  function win() {
    play(() => {
      const t = ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.5, 1318.5, 1568, 2093];
      notes.forEach((f, i) => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = 'sine';
        o.frequency.value = f;
        g.gain.value = 0.09;
        o.connect(g).connect(master);
        const st = t + i * 0.06;
        g.gain.setValueAtTime(0.09, st);
        g.gain.exponentialRampToValueAtTime(0.001, st + 0.35);
        o.start(st);
        o.stop(st + 0.36);
      });
    });
  }

  function setMuted(v) { muted = !!v; }

  return { unlock, footstep, coin, grab, hackClick, spotted, alarm, levelClear, caught, win, setMuted, get muted() { return muted; } };
}
