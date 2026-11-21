// Seeded RNG for deterministic replays and procedural generation
export function createRng(seed = 1) {
  let state = seed >>> 0;
  function next() {
    state += 0x6D2B79F5;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  function range(min, max) { return min + next() * (max - min); }
  function int(min, max) { return min + (next() * (max - min + 1) | 0); }
  function pick(arr) { return arr[int(0, arr.length - 1)]; }
  return { next, range, int, pick };
}
