// Self-check: node test.js
// engine.js (the settings schema, normalize, the Wallpaper Engine mapping, the background tone, the animation engine run without a
// browser) and the pure helpers of newtab.js.
const assert = require('assert');
const fs = require('fs');
const A = require('./engine.js');
const I = A.internals;

// ---------- schema ----------
// The seven animals in the original's order, with their labels.
assert.deepStrictEqual(A.ANIMALS, ['butterflies', 'koi', 'jellyfish', 'dragonflies', 'frogs', 'cranes', 'crabs']);
assert.deepStrictEqual(A.ANIMALS.map((id) => A.LABELS[id]), ['Butterfly', 'Koi', 'Jellyfish', 'Dragonfly', 'Frog', 'Crane', 'Crab']);
// Shared tweaks: the default of each animal (null = the original hides that tweak for the animal).
const SHARED = {
  //           butterflies koi   jellyfish dragonflies frogs  cranes crabs
  density:    [1.05, 1.6, 1, 2.1, 1.3, 0.8, 1.8],
  corner:     [false, false, false, false, false, false, false],
  direction:  [49, 49, 49, 49, 49, 49, 49],
  speed:      [1.05, 1.6, 1.05, 1, 1, 1.5, 1],
  sway:       [0, 0, 0.04, 0, 0, 0, 0],
  spread:     [0, 0, 0.08, 0, 0, 0, 0],
  size:       [1.25, 1, 1, 1, 1.2, 1, 1],
  farthest:   [0.18, 0.33, 0.3, 0.32, 0.35, 0.35, 0.25],
  farBias:    [1.7, 1.3, 1.4, 3, 1.4, 1.3, 0.7],
  grip:       [5, 2.65, 1.4, 5, null, 3, 3],
  separation: [700, 780, 300, 720, 450, 150, 400],
  hueShift:   [0, 0, 0, 0, 0, 0, 0],
  shimmer:    [0.3, 0.35, null, null, 0.15, 0.1, 0.1],
  sparkle:    [0.12, 0.08, 0.1, 0.18, 0.05, 0.04, 0.03],
  fog:        [0.75, 0.64, 0.75, 0.26, 0, 0.75, 0.12],
  trail:      [1.55, 4, 0.8, 0.6, 3.45, 0, 1.2],
  trailFade:  [0.15, 0.4, 0.6, 1.2, 0.4, 1.3, 0.35],
  grid:       [1.05, 1.05, 1.05, 1.05, 1.05, 1.05, 1.05],
  detail:     [1.3, 1.3, 1.3, 1.3, 1.3, 1.7, 1.7],
};
const RANGE = { density: [0.1, 4, 0.05], direction: [0, 360, 1], speed: [0.1, 3, 0.05], sway: [0, 0.6, 0.01], spread: [0, 0.8, 0.01], size: [0.3, 2.5, 0.05],
  farthest: [0.1, 1, 0.01], farBias: [0.3, 3, 0.05], grip: [0.2, 5, 0.05], separation: [0, 1000, 10], hueShift: [-180, 180, 1], shimmer: [0, 1, 0.01],
  sparkle: [0, 0.5, 0.01], fog: [0, 1, 0.01], trail: [0, 4, 0.05], trailFade: [0.05, 6, 0.05], grid: [0, 4, 0.05], detail: [0.5, 2, 0.05] };
// The animals' own groups: [animal, group, key, label, min, max, step, default].
const OWN = [
  ['butterflies', 'Flight', 'flutter', 'Flutter', 0, 3, 0.05, 0], ['butterflies', 'Flight', 'glide', 'Glide', 0, 4, 0.05, 2.75], ['butterflies', 'Flight', 'flapRate', 'Flap rate', 0.2, 3, 0.05, 1],
  ['koi', 'Swimming', 'meander', 'Meander', 0, 3, 0.05, 0.4], ['koi', 'Swimming', 'tailBeat', 'Tail beat', 0.2, 3, 0.05, 1], ['koi', 'Feeding', 'foodRange', 'Food range', 0, 500, 10, 200],
  ['jellyfish', 'Swimming', 'pulseRate', 'Pulse rate', 0.2, 3, 0.05, 1], ['jellyfish', 'Swimming', 'pulsePower', 'Pulse power', 0.2, 3, 0.05, 1],
  ['jellyfish', 'Swimming', 'pulseGlow', 'Pulse glow', 0, 3, 0.05, 1], ['jellyfish', 'Swimming', 'tentacles', 'Arm length', 0, 2.5, 0.05, 1],
  ['dragonflies', 'Flight', 'hover', 'Hover time', 0.1, 4, 0.05, 1.3], ['dragonflies', 'Flight', 'cruising', 'Cruising', 0, 1, 0.01, 0.5],
  ['dragonflies', 'Flight', 'dart', 'Dart speed', 0.2, 3, 0.05, 1.5], ['dragonflies', 'Flight', 'wingbeat', 'Wingbeat', 0.2, 2, 0.05, 1],
  ['frogs', 'Leaping', 'hop', 'How often', 0.2, 4, 0.05, 1], ['frogs', 'Leaping', 'leap', 'Leap length', 0.3, 2.5, 0.05, 0.45], ['frogs', 'Leaping', 'height', 'Leap height', 0, 2.5, 0.05, 1],
  ['cranes', 'Flight', 'wingbeat', 'Wingbeat', 0.3, 2.5, 0.05, 1], ['cranes', 'Flight', 'glide', 'Glide', 0, 4, 0.05, 1], ['cranes', 'Flight', 'foldFlap', 'Folding flap', null, null, null, false],
  ['crabs', 'Scuttling', 'burst', 'Burst length', 0.2, 4, 0.05, 1], ['crabs', 'Scuttling', 'rest', 'Pause length', 0, 4, 0.05, 1],
  ['crabs', 'Scuttling', 'legSpeed', 'Leg speed', 0.2, 3, 0.05, 1], ['crabs', 'Scuttling', 'scare', 'Scare', 0, 3, 0.05, 0.55],
];
const COUNTS = { butterflies: 22, koi: 22, jellyfish: 22, dragonflies: 22, frogs: 21, cranes: 22, crabs: 23 };
A.ANIMALS.forEach((id, n) => {
  const list = A.TWEAKS[id], keys = list.map((t) => t.key);
  assert.strictEqual(list.length, COUNTS[id], id + ' tweak count');
  assert.strictEqual(new Set(keys).size, keys.length, id + ' keys are unique');
  assert.strictEqual(list[0].group, 'Movement'); // the original panel's order: Movement, the animal's own groups, Look
  assert.strictEqual(list[list.length - 1].group, 'Look');
  const own = OWN.filter((o) => o[0] === id);
  assert.deepStrictEqual([...new Set(list.map((t) => t.group))], ['Movement', ...new Set(own.map((o) => o[1])), 'Look'], id + ' group order');
  for (const key in SHARED) {
    const t = list.find((x) => x.key === key), want = SHARED[key][n];
    if (want === null) { assert.ok(!t, id + ' hides ' + key); continue; }
    assert.ok(t, id + ' shows ' + key);
    assert.strictEqual(t.def, want, id + ' default ' + key);
    assert.strictEqual(t.type, key === 'corner' ? 'toggle' : 'range');
    if (key !== 'corner') assert.deepStrictEqual([t.min, t.max, t.step], RANGE[key], id + ' range ' + key);
  }
  for (const [, group, key, label, min, max, step, def] of own) {
    const t = list.find((x) => x.key === key);
    assert.ok(t, id + ' own ' + key);
    assert.deepStrictEqual([t.group, t.label, t.def], [group, label, def], id + ' own ' + key);
    if (min !== null) assert.deepStrictEqual([t.type, t.min, t.max, t.step], ['range', min, max, step]);
    else assert.strictEqual(t.type, 'toggle');
  }
  assert.strictEqual(own.length + Object.keys(SHARED).filter((k) => SHARED[k][n] !== null).length, list.length, id + ' has nothing else');
  assert.strictEqual(list.find((t) => t.key === 'direction').disabledWhen, 'corner');
  for (const t of list) { // defaults inside the ranges, and on the slider grid (so a slider can show them exactly)
    if (t.type === 'toggle') { assert.strictEqual(typeof t.def, 'boolean'); continue; }
    assert.ok(t.def >= t.min && t.def <= t.max, id + ' ' + t.key + ' default in range');
    for (const v of [t.min, t.max, t.def]) assert.ok(Math.abs(v / t.step - Math.round(v / t.step)) < 1e-9, id + ' ' + t.key + ' ' + v + ' on the step grid');
    assert.strictEqual(t.def, I.species[id].defaults[t.key]); // the schema is the carried-over definitions, not a copy
  }
});
// The chat glass (the search panel on the new tab) and the background tone are global.
assert.deepStrictEqual(A.GLASS.map((g) => [g.key, g.min, g.max, g.step, g.def]),
  [['blur', 0, 30, 0.5, 3.5], ['refraction', 0, 150, 1, 40], ['ripple', 0.001, 0.04, 0.001, 0.007], ['tint', 0, 3, 0.05, 0], ['edge', 0, 2, 0.05, 0.55], ['radius', 0, 48, 1, 24], ['width', 320, 960, 10, 720]]);
assert.deepStrictEqual(A.BACKGROUND, { key: 'background', label: 'Background', group: 'Look', type: 'range', min: 0, max: 1, step: 0.01, def: 0 });
assert.deepStrictEqual(A.DEFAULTS, { animal: 'butterflies', name: '', background: 0, tuning: {}, glass: { blur: 3.5, refraction: 40, ripple: 0.007, tint: 0, edge: 0.55, radius: 24, width: 720 }, ui: { avatar: true, greeting: true, mic: true, lens: true }  });

// ---------- normalize ----------
const D = A.normalize();
assert.deepStrictEqual(D, A.DEFAULTS);
for (const junk of [null, undefined, 5, 'x', [], true]) assert.deepStrictEqual(A.normalize(junk), A.DEFAULTS);
// clamping, junk and step snapping, for every tweak of every animal
for (const id of A.ANIMALS) for (const t of A.TWEAKS[id]) {
  const one = (v) => A.normalize({ animal: id, tuning: { [id]: { [t.key]: v } } }).tuning[id];
  if (t.type === 'toggle') {
    assert.deepStrictEqual(one(!t.def), { [t.key]: !t.def });
    assert.strictEqual(one(t.def), undefined, 'a default value is not stored');
    assert.deepStrictEqual(one(t.def ? 'false' : 'true'), { [t.key]: !t.def }); // from a query string
    continue;
  }
  const hi = one(t.max + 1000), lo = one(t.min - 1000);
  assert.strictEqual(t.max === t.def ? hi : hi[t.key], t.max === t.def ? undefined : t.max, id + ' ' + t.key + ' clamps high');
  assert.strictEqual(t.min === t.def ? lo : lo[t.key], t.min === t.def ? undefined : t.min, id + ' ' + t.key + ' clamps low');
  for (const junk of ['abc', NaN, null, undefined, '', true, {}]) assert.strictEqual(one(junk), undefined, id + ' ' + t.key + ' junk ' + String(junk) + ' is the default');
  assert.strictEqual(one(String(t.max)) && one(String(t.max))[t.key], t.max === t.def ? undefined : t.max, 'from a query string');
  assert.strictEqual(one(t.def + t.step * 1e-6), undefined, 'a default after rounding is not stored');
}
assert.deepStrictEqual(A.normalize({ tuning: { butterflies: { density: 1.07, direction: 90.4 } } }).tuning, { butterflies: { direction: 90 } }); // 1.07 snaps to the default 1.05, which is not stored
assert.deepStrictEqual(A.normalize({ tuning: { koi: { speed: 2.02 } } }).tuning, { koi: { speed: 2 } });
assert.deepStrictEqual(A.normalize({ glass: { ripple: 0.0124 } }).glass.ripple, 0.012);
assert.deepStrictEqual(A.normalize({ tuning: { koi: { corner: 'true' } } }).tuning, { koi: { corner: true } });
assert.deepStrictEqual(A.normalize({ tuning: { koi: { corner: 'maybe' } } }).tuning, {});
// old ids, any case, are aliases; 'random' and junk give the default; the names are the original's too
const OLD = { butterfly: 'butterflies', koi: 'koi', jellyfish: 'jellyfish', dragonfly: 'dragonflies', frog: 'frogs', crane: 'cranes', crab: 'crabs', bird: 'cranes' };
for (const o in OLD) { assert.strictEqual(A.normalize({ animal: o }).animal, OLD[o]); assert.strictEqual(A.normalize({ animal: o.toUpperCase() }).animal, OLD[o]); assert.strictEqual(A.normalize({ animal: ' ' + o + ' ' }).animal, OLD[o]); }
for (const id of A.ANIMALS) assert.strictEqual(A.normalize({ animal: id }).animal, id);
for (const junk of ['random', '', 'unicorn', 7, null, undefined, {}]) assert.strictEqual(A.normalize({ animal: junk }).animal, 'butterflies');
assert.strictEqual(A.normalize({ name: '  Sam  ' }).name, 'Sam');
assert.strictEqual(A.normalize({ name: 'x'.repeat(100) }).name.length, 40);
assert.strictEqual(A.normalize({ name: null }).name, '');
// unknown keys are dropped, at every level; a tweak another animal has (or one this animal hides) is not this animal's
assert.deepStrictEqual(A.normalize({ animal: 'koi', bogus: 1, tuning: { koi: { speed: 2, bogus: 3, glide: 1 }, unicorn: { speed: 2 }, frogs: { grip: 1, hop: 2 } }, glass: { blur: 9, bogus: 1 } }),
  { animal: 'koi', name: '', background: 0, tuning: { koi: { speed: 2 }, frogs: { hop: 2 } }, glass: Object.assign({}, A.DEFAULTS.glass, { blur: 9 }), ui: A.DEFAULTS.ui });
// tuning keeps the other animals' values (each animal remembers its own)
assert.deepStrictEqual(A.normalize({ animal: 'crabs', tuning: { koi: { speed: 2 }, crabs: { burst: 2 } } }).tuning, { koi: { speed: 2 }, crabs: { burst: 2 } });
// settings of the earlier versions: flat, relative tweaks and flat glass keys. The animal (mapped), name, background and glass are
// kept; the flat animal tweaks do not map onto the per-animal values and are discarded.
{
  const old = { animal: 'dragonfly', name: ' Sam ', density: 3, corner: true, direction: 10, speed: 2, size: 2, hold: 1, flutter: 1, hue: 90, shimmer: 1, trail: 0, fade: 0.2, grid: 2, detail: 2, count: 30,
    background: 0.4, blur: 10, refraction: 100, ripple: 0.02, tint: 1, edge: 1, radius: 10, width: 500 };
  assert.deepStrictEqual(A.normalize(old), { animal: 'dragonflies', name: 'Sam', background: 0.4, tuning: {}, glass: { blur: 10, refraction: 100, ripple: 0.02, tint: 1, edge: 1, radius: 10, width: 500 }, ui: A.DEFAULTS.ui });
  assert.deepStrictEqual(A.normalize(Object.assign({}, old, { glass: { blur: 2 } })).glass, Object.assign({}, A.normalize(old).glass, { blur: 2 })); // the new glass object wins over a flat key
  assert.deepStrictEqual(A.normalize({ animal: 'bird' }), Object.assign({}, A.DEFAULTS, { animal: 'cranes' }));
}
// background
assert.strictEqual(A.normalize({ background: 2 }).background, 1);
assert.strictEqual(A.normalize({ background: -3 }).background, 0);
assert.strictEqual(A.normalize({ background: '0.5' }).background, 0.5);
assert.strictEqual(A.normalize({ background: 0.123 }).background, 0.12);
assert.strictEqual(A.normalize({ background: 'dark' }).background, 0);
// whatever normalize returns is stable, and JSON-safe (it is what chrome.storage keeps)
{
  const s = A.normalize({ animal: 'jellyfish', name: 'Ann', background: 0.3, tuning: { jellyfish: { pulseRate: 1.5, trail: 2 } } });
  assert.deepStrictEqual(A.normalize(s), s);
  assert.deepStrictEqual(A.normalize(JSON.parse(JSON.stringify(s))), s);
}
// the preview in a plain browser: ?animal=koi&background=0.5&speed=1.4 (absolute values for that animal)
assert.deepStrictEqual(A.fromQuery('?animal=koi&background=0.5&speed=1.4&width=500&name=Sam'),
  A.normalize({ animal: 'koi', name: 'Sam', background: 0.5, tuning: { koi: { speed: 1.4 } }, glass: { width: 500 } }));
assert.deepStrictEqual(A.fromQuery(''), A.DEFAULTS);
assert.deepStrictEqual(A.fromQuery('animal=frog&hop=2&glide=3&speed=9').tuning, { frogs: { hop: 2, speed: 3 } }); // glide is not a frog tweak; clamped
assert.deepStrictEqual(A.fromQuery({ animal: 'cranes', foldFlap: 'true' }).tuning, { cranes: { foldFlap: true } });
assert.deepStrictEqual(A.fromQuery(new URLSearchParams('animal=crab&scare=2')).tuning, { crabs: { scare: 2 } });

// ---------- Wallpaper Engine ----------
// A short, species-independent set; density, speed, size, trail, grid and detail multiply the animal's original defaults, hueshift is absolute.
const WE = (o) => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, { value: v }]));
const tuningOf = (animal, props, base) => A.fromWallpaperProps(Object.assign({ animal: { value: animal } }, WE(props)), base).tuning[animal];
assert.deepStrictEqual(A.fromWallpaperProps({}), A.DEFAULTS);
assert.deepStrictEqual(A.fromWallpaperProps(WE({ animal: 'koi', background: 0.4 })), Object.assign({}, A.DEFAULTS, { animal: 'koi', background: 0.4 }));
assert.deepStrictEqual(tuningOf('koi', { density: 1, speed: 1, size: 1, hueshift: 0, trail: 1, grid: 1, detail: 1 }), undefined, 'the neutral values are the original look');
assert.deepStrictEqual(tuningOf('koi', { speed: 1.25 }), { speed: 2 }); // 1.6 x 1.25
assert.deepStrictEqual(tuningOf('butterflies', { density: 2, size: 0.8 }), { density: 2.1, size: 1 }); // 1.05 x 2, 1.25 x 0.8
assert.deepStrictEqual(tuningOf('dragonflies', { hueshift: 90, detail: 1.5 }), { hueShift: 90, detail: 1.95 });
assert.deepStrictEqual(tuningOf('crabs', { grid: 2, trail: 0.5 }), { grid: 2.1, trail: 0.6 });
assert.deepStrictEqual(tuningOf('koi', { density: 3, speed: 3 }), { density: 4, speed: 3 }); // clamped to the original's range after multiplying (1.6 x 3 = 4.8)
assert.deepStrictEqual(tuningOf('koi', { trail: 3 }), undefined); // 4 x 3 -> 4: the default again
assert.deepStrictEqual(tuningOf('cranes', { trail: 3 }), undefined); // the crane's trail default is 0: a multiplier leaves it
assert.deepStrictEqual(tuningOf('frogs', { hueshift: 999 }), { hueShift: 180 });
assert.deepStrictEqual(tuningOf('frogs', { hueshift: -999 }), { hueShift: -180 });
assert.deepStrictEqual(tuningOf('koi', { speed: 'abc', size: null }), undefined); // junk is ignored
// plain values work as well as {value}; unknown properties are ignored
assert.deepStrictEqual(A.fromWallpaperProps({ animal: 'koi', speed: 1.25, bogus: 4 }).tuning, { koi: { speed: 2 } });
// Wallpaper Engine sends only what changed: the host keeps every property seen, so a new animal gets the multipliers against its own defaults
{
  const seen = {};
  Object.assign(seen, WE({ animal: 'koi', speed: 1.25 }));
  assert.deepStrictEqual(A.fromWallpaperProps(seen).tuning, { koi: { speed: 2 } });
  Object.assign(seen, WE({ animal: 'cranes' })); // only the animal changed
  assert.deepStrictEqual(A.fromWallpaperProps(seen).tuning, { cranes: { speed: 1.9 } }); // 1.5 x 1.25 = 1.875 -> the 0.05 step
  Object.assign(seen, WE({ background: 0.7 }));
  assert.strictEqual(A.fromWallpaperProps(seen).background, 0.7);
  assert.strictEqual(A.fromWallpaperProps(seen).animal, 'cranes');
}
// the base (the ?query preview) supplies what Wallpaper Engine does not send, and loses to what it sends
{
  const base = A.fromQuery('animal=koi&speed=1.4&background=0.2&detail=1.5');
  assert.deepStrictEqual(A.fromWallpaperProps({}, base), base);
  assert.deepStrictEqual(A.fromWallpaperProps(WE({ speed: 1 }), base).tuning, { koi: { detail: 1.5 } });
  assert.strictEqual(A.fromWallpaperProps(WE({ background: 0.9 }), base).background, 0.9);
  assert.strictEqual(A.fromWallpaperProps(WE({ animal: 'frog' }), base).animal, 'frogs');
}
// project.json carries exactly these properties, with their ranges and neutral defaults
{
  const project = JSON.parse(fs.readFileSync('project.json', 'utf8')), props = project.general.properties;
  assert.deepStrictEqual(Object.keys(props), ['animal', 'background', ...A.WALLPAPER.map((w) => w.prop)]);
  assert.deepStrictEqual(props.animal.options, A.ANIMALS.map((id) => ({ label: A.LABELS[id], value: id })));
  assert.strictEqual(props.animal.type, 'combo');
  assert.strictEqual(props.animal.value, A.DEFAULTS.animal);
  assert.deepStrictEqual([props.background.type, props.background.min, props.background.max, props.background.value], ['slider', 0, 1, 0]);
  for (const w of A.WALLPAPER) {
    const p = props[w.prop];
    assert.deepStrictEqual([p.type, p.min, p.max, p.step, p.value], ['slider', w.min, w.max, w.step, w.def], w.prop);
    assert.ok(w.def >= w.min && w.def <= w.max);
    for (const id of A.ANIMALS) { // the extremes of the property end inside the animal's own range after clamping
      const t = A.TWEAKS[id].find((x) => x.key === w.key), lim = (v) => (A.fromWallpaperProps(WE({ animal: id, [w.prop]: v })).tuning[id] || {})[w.key];
      assert.ok(t, id + ' has ' + w.key);
      for (const v of [w.min, w.max]) { const got = lim(v) === undefined ? t.def : lim(v); assert.ok(got >= t.min && got <= t.max, id + ' ' + w.prop + ' ' + v); }
    }
  }
  const orders = Object.values(props).map((p) => p.order);
  assert.deepStrictEqual(orders, [...orders].sort((a, b) => a - b));
  // all the project's own default values, as Wallpaper Engine sends them first, give the original look of the animal
  const first = Object.fromEntries(Object.entries(props).map(([k, p]) => [k, { value: p.value }]));
  assert.deepStrictEqual(A.fromWallpaperProps(first), A.DEFAULTS);
  for (const id of A.ANIMALS) assert.deepStrictEqual(A.fromWallpaperProps(Object.assign({}, first, { animal: { value: id } })), Object.assign({}, A.DEFAULTS, { animal: id }));
  for (const k of ['title', 'file', 'type', 'preview']) assert.ok(project[k], k);
  assert.ok(fs.existsSync(project.file) && fs.existsSync(project.preview));
}

// ---------- background tone ----------
const TONES = [0, 0.25, 0.5, 0.75, 1], bgAt = (t) => A.backgroundOf({ background: t });
assert.deepStrictEqual(bgAt(0).rgb, [6, 7, 12]); // the original's dark background
assert.deepStrictEqual(bgAt(1).rgb, [255, 255, 255]);
assert.deepStrictEqual(A.backgroundOf({}).rgb, [6, 7, 12]);
assert.strictEqual(A.backgroundOf({ background: '1' }).css, 'rgb(255,255,255)'); // query-string shape
assert.strictEqual(bgAt(0).css, 'rgb(6,7,12)');
for (const t of [0.25, 0.5, 0.75]) { const c = bgAt(t).rgb; assert.ok(Math.max(...c) - Math.min(...c) <= 8 && c[0] > 6 && c[0] < 255, 'near-grey at ' + t); }
for (let i = 1; i <= 100; i++) { const a = bgAt((i - 1) / 100).lum, b = bgAt(i / 100).lum; assert.ok(b > a, 'darker to lighter'); }
assert.deepStrictEqual(TONES.map((t) => bgAt(t).light), [false, false, true, true, true]); // the UI flips at luminance 0.179, where black and white contrast equally
assert.deepStrictEqual(TONES.map((t) => bgAt(t).theme), ['dark', 'dark', 'light', 'light', 'light']); // the renderer's palette: the one whose ink contrasts more
for (const t of TONES) assert.ok(Object.keys(bgAt(t)).includes('adapt') && typeof bgAt(t).adapt === 'function');
{
  // tone 0: the original dark palette object itself (same values, nothing remapped)
  const L0 = A.lookOf(0);
  assert.strictEqual(L0.palette, I.palettes.dark);
  assert.deepStrictEqual(L0.palette, { background: [6, 7, 12], grid: [255, 255, 255, 0.055], trailAlpha: 0.85, ink: [150, 160, 200] });
  assert.deepStrictEqual(I.palettes.light, { background: [246, 243, 236], grid: [30, 34, 60, 0.07], trailAlpha: 0.7, ink: [42, 42, 59] }); // and the light one is untouched
  // above 0: the original palette of the chosen theme with the background replaced
  const L5 = A.lookOf(0.5), L1 = A.lookOf(1);
  assert.deepStrictEqual(L5.palette, Object.assign({}, I.palettes.light, { background: L5.rgb }));
  assert.deepStrictEqual(L1.palette, Object.assign({}, I.palettes.light, { background: [255, 255, 255] }));
  assert.deepStrictEqual(A.lookOf(0.1).palette, Object.assign({}, I.palettes.dark, { background: A.lookOf(0.1).rgb }));
  // the chosen theme is the one whose ink has the better contrast against the actual background
  for (let i = 1; i <= 100; i++) {
    const L = A.lookOf(i / 100), other = L.theme === 'light' ? 'dark' : 'light';
    assert.ok(A.contrast(I.palettes[L.theme].ink, L.rgb) >= A.contrast(I.palettes[other].ink, L.rgb), 'theme at ' + i / 100);
  }
}
// The renderer without a browser: a canvas stub whose 2D context records what is drawn.
function stubs() {
  const log = { text: [], rects: 0, images: 0 }, st = { fillStyle: '' };
  const ctx = new Proxy({}, {
    get(t, k) {
      if (k === 'fillText') return (ch) => log.text.push([ch, st.fillStyle]);
      if (k === 'fillRect') return () => { log.rects++; };
      if (k === 'drawImage') return () => { log.images++; };
      return k === 'fillStyle' ? st.fillStyle : () => {};
    },
    set(t, k, v) { if (k === 'fillStyle') st.fillStyle = v; return true; },
  });
  const make = () => ({ width: 0, height: 0, getContext: () => ctx });
  const canvas = Object.assign(make(), { getBoundingClientRect: () => ({ left: 0, top: 0, width: 1280, height: 720 }), addEventListener() {} });
  return { log, ctx, make, canvas };
}
{
  const S = stubs(), rend = (tone) => { const L = A.lookOf(tone), r = new I.Renderer(S.canvas, { ...I.species.koi.defaults }); globalThis.document = { createElement: S.make }; r.setTheme(L.theme, L.palette); return r; };
  globalThis.document = { createElement: S.make };
  const r0 = rend(0), r1 = rend(1), r5 = rend(0.5);
  assert.strictEqual(r0.cap, 1); // nothing is remapped on the dark background
  assert.deepStrictEqual(r0.turn(255, 255, 255), [255, 255, 255]);
  assert.deepStrictEqual(r0.turn(10, 200, 30), [10, 200, 30]);
  // a light background: bright colours are darkened (hue kept) until they keep their contrast, dark ones stay as they are
  for (const [r, tone] of [[r1, 1], [r5, 0.5]]) {
    const bg = A.lookOf(tone).rgb;
    for (const c of [[255, 255, 255], [244, 240, 230], [255, 200, 240], [236, 238, 242], [232, 56, 182], [200, 255, 220], [176, 70, 40]]) {
      const t = r.turn(...c);
      assert.ok(A.contrast(t, bg) >= I.CAP_CONTRAST * 0.9 || A.contrast(c, bg) >= I.CAP_CONTRAST * 0.9, 'visible on ' + tone + ': ' + c + ' -> ' + t);
      assert.ok(t.every((v, i) => v <= c[i] + 1e-9), 'only darker');
    }
    assert.deepStrictEqual(r.turn(20, 20, 30), [20, 20, 30]);
    const [tr, tg, tb] = r.turn(255, 200, 240); // hue kept: the channels keep their ratios
    assert.ok(Math.abs(tr / tg - 255 / 200) < 1e-9 && Math.abs(tb / tg - 240 / 200) < 1e-9);
  }
}
globalThis.document = undefined;

// ---------- the animation engine, without a browser ----------
// Every animal: the flock steps for a minute of simulated time, everything stays finite, and the creatures keep moving across the screen.
for (const id of A.ANIMALS) {
  const sp = I.species[id], tuning = { ...sp.defaults };
  for (const extra of [{}, { corner: true }, { density: 4, speed: 3, size: 2.5 }, { density: 0.1, direction: 200 }]) {
    const f = new I.Flock(sp, Object.assign({}, tuning, extra), undefined);
    f.resize(1280, 720);
    assert.ok(f.creatures.length > 0, id + ' has creatures');
    const start = f.creatures.map((c) => [c.x, c.y]);
    for (let i = 0; i < 3600; i++) f.step(1 / 60);
    assert.ok(f.creatures.length > 0 && f.creatures.length <= (sp.max || 200));
    for (const c of f.creatures) assert.ok(Number.isFinite(c.x) && Number.isFinite(c.y) && Number.isFinite(c.heading) && Number.isFinite(c.span) && c.span > 0, id + ' finite creature');
    assert.ok(f.creatures.some((c, n) => start[n] && Math.hypot(c.x - start[n][0], c.y - start[n][1]) > 50), id + ' moves');
  }
  const f = new I.Flock(sp, tuning, undefined);
  f.resize(1280, 720);
  for (let i = 0; i < 120; i++) f.step(1 / 60);
  f.startle(300, 300); // a click
  for (let i = 0; i < 300; i++) f.step(1 / 60);
  assert.ok(f.creatures.every((c) => Number.isFinite(c.x) && Number.isFinite(c.y)), id + ' after a click');
}
// The count follows the area and Density.
{
  const n = (d, w, h) => { const f = new I.Flock(I.species.koi, { ...I.species.koi.defaults, density: d }, undefined); f.resize(w, h); return f.creatures.length; };
  assert.ok(n(4, 1280, 720) > n(1.6, 1280, 720) && n(1.6, 1280, 720) > n(0.2, 1280, 720));
}
// start(): the whole path (wrapper, renderer, frame loop) against stand-ins for window, document and the canvas. The stand-ins lack
// ResizeObserver, IntersectionObserver, matchMedia and document.fonts, like Wallpaper Engine's browser can.
function host(opts) {
  const S = stubs(), listeners = {}, g = globalThis;
  let cb = null, hidden = false, now = 0;
  const win = { devicePixelRatio: 1, addEventListener() {}, removeEventListener() {} };
  if (opts && opts.reduce) win.matchMedia = () => ({ matches: true, addEventListener() {}, removeEventListener() {} });
  const doc = { createElement: S.make, get hidden() { return hidden; }, addEventListener: (t, f) => { (listeners[t] = listeners[t] || []).push(f); }, removeEventListener: (t, f) => { listeners[t] = (listeners[t] || []).filter((x) => x !== f); } };
  const saved = {};
  const put = (o) => { for (const k in o) { saved[k] = g[k]; g[k] = o[k]; } };
  put({ window: win, document: doc, getComputedStyle: () => ({ fontFamily: '"Geist Mono"' }), performance: { now: () => now }, requestAnimationFrame: (f) => { cb = f; return 1; }, cancelAnimationFrame: () => { cb = null; } });
  return Object.assign(S, {
    frames(n, dt) { for (let i = 0; i < n; i++) { now += dt || 16.667; if (cb) { const f = cb; cb = null; f(now); } } },
    scheduled: () => !!cb,
    hide(v) { hidden = v; for (const f of listeners.visibilitychange || []) f(); },
    done() { for (const k in saved) { if (saved[k] === undefined) delete g[k]; else g[k] = saved[k]; } },
  });
}
for (const tone of [0, 0.5, 1]) for (const id of A.ANIMALS) {
  const h = host();
  try {
    const e = A.start(h.canvas, { animal: id, background: tone });
    h.frames(150);
    assert.ok(h.log.images >= 150 && h.log.text.length > 100, id + ' ' + tone + ' draws glyphs'); // the canvas is not blank: background image + characters
    assert.ok(h.log.text.every(([ch]) => typeof ch === 'string' && ch.length === 1));
    e.destroy();
  } finally { h.done(); }
}
{
  const h = host();
  try {
    const e = A.start(h.canvas, { animal: 'koi' });
    h.frames(10);
    const t = e.app.tuning;
    assert.strictEqual(t.speed, 1.6); // the animal's original defaults
    // update: top-level keys, the animal changes, a value back to its default counts, other values stay
    e.update({ tuning: { koi: { speed: 2, trail: 1 } } });
    assert.strictEqual(e.app.tuning.speed, 2); assert.strictEqual(e.app.tuning.trail, 1);
    e.update({ tuning: { koi: { speed: 2 } } });
    assert.strictEqual(e.app.tuning.trail, 4, 'dropping a value restores the default');
    e.update({ tuning: undefined });
    assert.strictEqual(e.app.tuning.speed, 1.6);
    e.update({ animal: 'crab', tuning: { crabs: { scare: 2 } } }); // an old id works
    assert.strictEqual(e.app.animal.key, 'crabs'); assert.strictEqual(e.app.tuning.scare, 2); assert.strictEqual(e.app.tuning.density, 1.8);
    e.update({ animal: 'koi', tuning: { crabs: { scare: 2 } } });
    assert.strictEqual(e.app.animal.key, 'koi'); assert.strictEqual(e.app.tuning.speed, 1.6);
    // the background: the renderer's palette follows
    assert.strictEqual(e.app.renderer.palette, I.palettes.dark);
    e.update({ background: 1 });
    assert.deepStrictEqual(e.app.renderer.palette.background, [255, 255, 255]);
    assert.strictEqual(e.app.renderer.theme, 'light');
    e.update({ background: 0 });
    assert.strictEqual(e.app.renderer.palette, I.palettes.dark);
    assert.strictEqual(e.app.renderer.cap, 1);
    h.frames(30);
    // pause while hidden, resume when shown
    h.hide(true); assert.ok(!h.scheduled(), 'no frames while hidden');
    h.hide(false); assert.ok(h.scheduled(), 'frames again when shown');
    e.destroy(); assert.ok(!h.scheduled());
  } finally { h.done(); }
}
{ // the FPS limit: about fps frames a second (the rest are skipped, not drawn late); 0 = every frame
  const count = (fps) => {
    const h = host();
    try { const e = A.start(h.canvas, { animal: 'frog' }); const n0 = h.log.images; if (fps !== undefined) e.setFps(fps); h.frames(120); e.destroy(); return h.log.images - n0; } finally { h.done(); }
  };
  assert.ok(count(undefined) >= 119);
  const n = count(15); // 2 s of 60 fps frames
  assert.ok(n >= 28 && n <= 32, 'limited to 15 fps: ' + n);
  assert.ok(count(0) >= 119);
}
{ // reduced motion: one still frame, nothing scheduled
  const h = host({ reduce: true });
  try { const e = A.start(h.canvas, { animal: 'jellyfish' }); assert.ok(!h.scheduled()); assert.ok(h.log.images >= 1 && h.log.text.length > 50); e.destroy(); } finally { h.done(); }
}

// ---------- newtab.js pure helpers (the file exports them instead of touching the DOM when loaded by node) ----------
const N = require('./newtab.js');
const { asUrl, greeting } = N;
// new tab UI colours follow the background: unchanged at 0; text >= 4.5:1 against the background and the panel over it at every tone
// (checked every 0.01, which includes 0, 0.25, 0.5, 0.75 and 1); the focus ring >= 3:1 against both
{
  const nums = (v) => v.match(/[\d.]+/g).map(Number), v0 = N.uiVars(bgAt(0));
  assert.deepStrictEqual(v0, { '--page': 'rgb(6,7,12)', '--ink': '255,255,255', '--shadow': '#000', '--panel': 'rgba(11,11,17,0.6)', '--sugg': 'rgba(11,11,17,0.88)',
    '--fg': 'rgb(242,243,247)', '--strong': 'rgb(255,255,255)', '--opt': 'rgb(214,215,222)', '--dim': 'rgb(154,154,165)', '--mute': 'rgb(125,127,138)', '--hover': 'rgb(201,203,211)',
    '--ring': 'rgb(143,147,158)', '--listen': 'rgb(255,138,138)', '--disc1': 'rgb(141,140,144)', '--disc2': 'rgb(87,86,91)' });
  const over = (p, bg) => bg.map((c, i) => Math.round(p[3] * p[i] + (1 - p[3]) * c)); // the translucent panel over the background
  for (let i = 0; i <= 100; i++) {
    const b = bgAt(i / 100), v = N.uiVars(b), panel = over(nums(v['--panel']), b.rgb), sugg = over(nums(v['--sugg']), b.rgb);
    assert.strictEqual(v['--page'], b.css);
    assert.strictEqual(nums(v['--panel'])[0], b.light ? 255 : 11, 'panel is light on a light background');
    for (const k of ['fg', 'strong', 'opt', 'dim', 'mute', 'hover', 'listen']) {
      const c = nums(v['--' + k]);
      for (const [bg, what] of [[b.rgb, 'page'], [panel, 'panel'], [sugg, 'dropdown']]) assert.ok(A.contrast(c, bg) >= 4.5, k + ' on the ' + what + ' at ' + i / 100 + ': ' + A.contrast(c, bg));
    }
    const ring = nums(v['--ring']);
    assert.ok(A.contrast(ring, panel) >= 3 && A.contrast(ring, b.rgb) >= 3, 'focus ring at ' + i / 100);
  }
}
for (const text of ['node.js', 'index.html', 'readme.md', 'config.json', 'next.js', 'hello world', 'example.com/a b', 'javascript:alert(1)', 'merhaba']) assert.strictEqual(asUrl(text), null, text);
assert.strictEqual(asUrl('example.com'), 'https://example.com');
assert.strictEqual(asUrl('github.com/foo'), 'https://github.com/foo');
assert.strictEqual(asUrl('192.168.1.1'), 'http://192.168.1.1');
assert.strictEqual(asUrl('192.168.1.1:8080/x'), 'http://192.168.1.1:8080/x');
assert.strictEqual(asUrl('localhost:3000'), 'http://localhost:3000');
assert.strictEqual(asUrl('localhost'), 'http://localhost');
assert.strictEqual(asUrl('https://x.y'), 'https://x.y');
assert.strictEqual(asUrl('HTTP://Example.org'), 'HTTP://Example.org');
assert.strictEqual(asUrl('docs.example.co.uk/x'), 'https://docs.example.co.uk/x');
assert.strictEqual(greeting(5, ''), 'Good morning');
assert.strictEqual(greeting(11, 'Sam'), 'Good morning, Sam');
assert.strictEqual(greeting(12, ''), 'Good afternoon');
assert.strictEqual(greeting(18, 'Sam'), 'Good evening, Sam');
assert.strictEqual(greeting(23, ''), 'Still up?');
assert.strictEqual(greeting(2, 'Sam'), 'Still up, Sam?');

// recents: newest first, de-duplicated ignoring case, capped at 50, blank ignored
{
  let r = [];
  r = N.addRecent(r, 'cats'); r = N.addRecent(r, 'dogs'); r = N.addRecent(r, '  CATS ');
  assert.deepStrictEqual(r, ['CATS', 'dogs']);
  assert.deepStrictEqual(N.addRecent(r, '   '), r);
  for (let i = 0; i < 80; i++) r = N.addRecent(r, 'q' + i);
  assert.strictEqual(r.length, 50);
  assert.strictEqual(r[0], 'q79');
  assert.deepStrictEqual(N.removeRecent(['a', 'B', 'c'], 'b'), ['a', 'c']);
  assert.deepStrictEqual(N.addRecent(undefined, 'x'), ['x']);
}
// suggest response parsing: [query, [suggestions...], ...]; anything else is []
{
  const real = ['ascii art', ['ascii art generator', 'ascii art archive', 'ascii art valorant', 'ascii art maker', 'ascii art eu', 'ascii art steam', 'ascii art text', 'ascii art copy paste', 'ascii arts', 'ascıı art kopyala'], ['', ''], [], { 'google:suggesttype': ['QUERY'] }];
  assert.deepStrictEqual(N.parseSuggest(real), real[1].slice(0, 8));
  for (const bad of [null, {}, [], ['q'], ['q', 'x'], 'text', ['q', [1, null, ' ', 'ok']]]) assert.ok(Array.isArray(N.parseSuggest(bad)));
  assert.deepStrictEqual(N.parseSuggest(['q', [1, null, ' ', 'ok']]), ['ok']);
}
// image URLs go to Lens by URL; anything else opens the Lens upload page
assert.ok(N.isImageUrl('https://x.org/a/cat.PNG'));
assert.ok(N.isImageUrl('http://x.org/a.jpeg?w=200'));
assert.ok(N.isImageUrl('https://x.org/a.webp#f'));
for (const t of ['https://x.org/a.png.html', 'ftp://x.org/a.png', 'cat.png', 'https://x.org/gif', 'javascript:a.png']) assert.ok(!N.isImageUrl(t), t);
assert.strictEqual(N.lensUrl(''), 'https://www.google.com/?olud');
assert.strictEqual(N.lensUrl('cats'), 'https://www.google.com/?olud');
assert.strictEqual(N.lensUrl(' https://x.org/a b.png '), 'https://www.google.com/?olud'); // spaces: not a URL
assert.strictEqual(N.lensUrl(' https://x.org/a.gif '), 'https://lens.google.com/uploadbyurl?url=' + encodeURIComponent('https://x.org/a.gif'));
assert.strictEqual(N.lensUrl('https://x.org/a.png?s=1&t=2'), 'https://lens.google.com/uploadbyurl?url=' + encodeURIComponent('https://x.org/a.png?s=1&t=2'));
// dropdown items: matching recents first (max 8 in all), then suggestions not already listed; empty query = recents
{
  const items = N.mergeItems(['Cat food', 'dog', 'cats'], ['cats', 'cat videos', 'CAT FOOD', 'catalog'], 'cat');
  assert.deepStrictEqual(items, [{ text: 'Cat food', recent: true }, { text: 'cats', recent: true }, { text: 'cat videos', recent: false }, { text: 'catalog', recent: false }]);
  const many = Array.from({ length: 20 }, (_, i) => 'r' + i);
  assert.strictEqual(N.mergeItems(many, [], '').length, 8);
  assert.ok(N.mergeItems(many, [], '').every((i) => i.recent));
  assert.strictEqual(N.mergeItems(many, ['r-x', 'r-y'], 'r').length, 8);
}
// suggestions are only requested for something that looks like a search: not a URL, not a long paste; a changed query
// drops the old suggestions that no longer contain it
assert.ok(N.canSuggest('cats') && N.canSuggest('node.js') && N.canSuggest('how to cook rice') && N.canSuggest('x'.repeat(100)));
for (const q of ['', 'example.com', 'https://example.com/a?b=c', 'localhost:3000', '192.168.1.1', 'x'.repeat(101), 'how '.repeat(30)]) assert.ok(!N.canSuggest(q), 'no suggest request for ' + q.slice(0, 20));
assert.deepStrictEqual(N.narrow(['cat videos', 'cats', 'Catalog', 'dog'], 'cat v'), ['cat videos']);
assert.deepStrictEqual(N.narrow(['cat videos', 'cats', 'Catalog', 'dog'], ' CAT '), ['cat videos', 'cats', 'Catalog']);
assert.deepStrictEqual(N.narrow(['cat videos'], 'dogs'), []);
assert.deepStrictEqual(N.narrow(['cat videos'], '  '), []);
assert.deepStrictEqual(N.narrow(undefined, 'a'), []);

console.log('all tests passed');
