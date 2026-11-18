// ASCII Animals engine: the animation and drawing code, then a thin wrapper (settings schema, background tone,
// start()). Classic script: hosts call AsciiAnimals.start(canvas, settings); node tests import it with require().
// Lines marked "patch" differ from the code they were carried over from; everything else is unchanged.
(function () {
  "use strict";
var ts = Object.defineProperty;
var es = (t, e, s) =>
  e in t
    ? ts(t, e, { enumerable: !0, configurable: !0, writable: !0, value: s })
    : (t[e] = s);
var S = (t, e, s) => es(t, typeof e != "symbol" ? e + "" : e, s);
const B = Math.PI * 2,
  R = (t, e, s) => (t < e ? e : t > s ? s : t),
  F = (t, e) => t + Math.random() * (e - t),
  Z = (t) => t - Math.floor(t),
  nt = (t, e, s) => t + (e - t) * s;
function ht(t, e, s) {
  const i = R((s - t) / (e - t), 0, 1);
  return i * i * (3 - 2 * i);
}
function dt(t, e) {
  let s = (e - t) % B;
  return s > Math.PI && (s -= B), s < -Math.PI && (s += B), s;
}
function W(t, e, s) {
  let i =
    Math.imul(t | 0, 374761393) ^
    Math.imul(e | 0, 668265263) ^
    Math.imul(s | 0, 1442695041);
  return (
    (i = Math.imul(i ^ (i >>> 13), 1274126177)),
    (i ^= i >>> 16),
    (i >>> 0) / 4294967296
  );
}

// Firefox canvas limits (gfx/platform/2d/...): max area 2^24 px, per-dimension texture size 32767.
// Chrome allows far larger (32767 per side, ~188M px area), so this clamp is a no-op there.
const FW_MAX_PIX = 16e6;   // comfortably < 2^24 (16,777,216)
const FW_MAX_SIDE = 32000; // comfortably < 32,767

const gt = {
    density: 1,
    corner: !1,
    direction: 49,
    speed: 1,
    sway: 0.04,
    spread: 0.06,
    size: 1,
    farthest: 0.45,
    farBias: 1.6,
    grip: 2,
    separation: 300,
    hueShift: 0,
    shimmer: 0.3,
    sparkle: 0.12,
    fog: 0.75,
    trail: 1,
    trailFade: 1.3,
    grid: 1.05,
    detail: 1.3,
  },
  ue = {
    movement: [
      {
        key: "density",
        label: "Density",
        min: 0.1,
        max: 4,
        step: 0.05,
        hint: "How many are on screen.",
      },
      {
        key: "corner",
        label: "Corner to corner",
        toggle: !0,
        hint: "Cross from the bottom-left corner to the top-right, whatever the window's shape. Turn off to set Direction yourself.",
      },
      {
        key: "direction",
        label: "Direction (°)",
        min: 0,
        max: 360,
        step: 1,
        disabledWhen: "corner",
        hint: "Which way they travel, in degrees: 0 is right, 90 is up. Only used when Corner to corner is off.",
      },
      {
        key: "speed",
        label: "Speed",
        min: 0.1,
        max: 3,
        step: 0.05,
        hint: "How fast they travel.",
      },
      {
        key: "sway",
        label: "Sway",
        min: 0,
        max: 0.6,
        step: 0.01,
        hint: "How much the whole group slowly drifts left and right off course. 0 is a dead-straight line.",
      },
      {
        key: "spread",
        label: "Spread",
        min: 0,
        max: 0.8,
        step: 0.01,
        hint: "How far each one's own path can stray from the group's. 0 means everyone keeps exactly the same line.",
      },
      {
        key: "size",
        label: "Size",
        min: 0.3,
        max: 2.5,
        step: 0.05,
        hint: "How big they are.",
      },
      {
        key: "farthest",
        label: "Farthest depth",
        min: 0.1,
        max: 1,
        step: 0.01,
        hint: "How small and faint the farthest ones get. 1 makes them all equally close.",
      },
      {
        key: "farBias",
        label: "Far bias",
        min: 0.3,
        max: 3,
        step: 0.05,
        hint: "How many sit far away versus close. Higher puts more of them in the distance.",
      },
      {
        key: "grip",
        label: "Hold course",
        min: 0.2,
        max: 5,
        step: 0.05,
        hint: "How hard they steer back onto course after drifting. Higher is stricter.",
      },
      {
        key: "separation",
        label: "Separation",
        min: 0,
        max: 1e3,
        step: 10,
        hint: "How strongly neighbours keep their distance from each other.",
      },
    ],
    look: [
      {
        key: "hueShift",
        label: "Hue shift (°)",
        min: -180,
        max: 180,
        step: 1,
        hint: "Turns the animal's colour around the colour wheel, in degrees. Find one you like and tell me the number to make it permanent.",
      },
      {
        key: "shimmer",
        label: "Shimmer",
        min: 0,
        max: 1,
        step: 0.01,
        hint: "How much iridescent surfaces roll brighter and darker as the animal turns.",
      },
      {
        key: "sparkle",
        label: "Sparkle",
        min: 0,
        max: 0.5,
        step: 0.01,
        hint: "How often cells flash white, like light catching scales or wings.",
      },
      {
        key: "fog",
        label: "Distance fade",
        min: 0,
        max: 1,
        step: 0.01,
        hint: "How much far-away ones fade into the background.",
      },
      {
        key: "trail",
        label: "Trail",
        min: 0,
        max: 4,
        step: 0.05,
        hint: "How much they leave behind: scales, ripples, footprints or glow.",
      },
      {
        key: "trailFade",
        label: "Trail fade",
        min: 0.05,
        max: 6,
        step: 0.05,
        hint: "How quickly that trail fades. Lower lingers longer.",
      },
      {
        key: "grid",
        label: "Grid",
        min: 0,
        max: 4,
        step: 0.05,
        hint: "How visible the background grid lines are.",
      },
      {
        key: "detail",
        label: "ASCII detail",
        min: 0.5,
        max: 2,
        step: 0.05,
        hint: "ASCII resolution. Higher means smaller characters and finer animals.",
      },
    ],
  },
  pe = 240,
  is = 160;
class ge {
  constructor(e, s, i) {
    S(this, "width", 0);
    S(this, "height", 0);
    S(this, "time", 0);
    S(this, "creatures", []);
    S(this, "events", []);
    S(this, "base", 120);
    S(this, "acc", { x: 0, y: 0 });
    S(this, "nextId", 1);
    (this.animal = e), (this.tuning = s), (this.count = i);
  }
  resize(e, s) {
    const i = this.width === 0;
    (this.width = e),
      (this.height = s),
      (this.base = R(Math.min(e, s) * 0.2, 80, 190) * this.animal.scale),
      i && this.populate(!0);
  }
  get course() {
    const e = this.tuning;
    return e.corner
      ? Math.atan2(-this.height, this.width)
      : (-e.direction * Math.PI) / 180;
  }
  get heading() {
    const e = this.time;
    return (
      this.course +
      this.tuning.sway * (Math.sin(e * 0.13) + 0.5 * Math.sin(e * 0.31 + 1.7))
    );
  }
  get target() {
    const { width: e, height: s, animal: i } = this,
      n = (this.base / i.scale / is) ** 2;
    return (
      this.count ??
      R(
        Math.round(((e * s) / (i.area * n)) * this.tuning.density),
        1,
        i.max ?? 200,
      )
    );
  }
  depthOf(e) {
    const s = this.tuning;
    return s.farthest + (1 - s.farthest) * Math.pow(e, s.farBias);
  }
  cruise(e) {
    return this.animal.speed * (0.55 + 0.45 * e.depth) * this.tuning.speed;
  }
  startle(e, s) {
    if (this.animal.tap) {
      this.animal.tap(e, s, this);
      return;
    }
    this.events.push({ x: e, y: s, radius: 6, amount: 1.4 });
    for (const i of this.creatures) {
      const n = i.x - e,
        a = i.y - s,
        o = Math.hypot(n, a) || 1;
      if (o > pe) continue;
      const r = 1 - o / pe;
      if (this.animal.startle) this.animal.startle(i, n / o, a / o, r, this);
      else {
        const h = r * 420 * i.depth;
        (i.vx += (n / o) * h),
          (i.vy += (a / o) * h),
          (i.startledUntil = this.time + F(0.6, 1.2));
      }
    }
  }
  step(e) {
    var s, i;
    (this.time += e), this.populate(!1);
    for (const n of this.creatures)
      (n.depth = this.depthOf(n.roll)),
        (n.span = this.base * n.depth * this.tuning.size);
    (i = (s = this.animal).prepare) == null || i.call(s, this, e);
    for (const n of this.creatures) this.animal.update(n, this, e);
  }
  populate(e) {
    var i, n;
    const s = this.target;
    for (; this.creatures.length > s; ) {
      const [a] = this.creatures.splice(
        Math.floor(Math.random() * this.creatures.length),
        1,
      );
      a.gone = !0;
    }
    for (; this.creatures.length < s; ) {
      const a = this.spawn();
      (e || Math.random() < 0.5) &&
        ((a.x = F(0, this.width)),
        (a.y = F(0, this.height)),
        (n = (i = this.animal).enter) == null || n.call(i, a, this)),
        this.insert(a);
    }
  }
  insert(e) {
    const s = this.creatures.findIndex((i) => i.roll > e.roll);
    this.creatures.splice(s < 0 ? this.creatures.length : s, 0, e);
  }
  spawn() {
    const e = {
      id: this.nextId++,
      roll: Math.random(),
      depth: 1,
      span: 0,
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      heading: 0,
      bias: 0,
      startledUntil: 0,
      gone: !1,
    };
    (e.depth = this.depthOf(e.roll)),
      (e.span = this.base * e.depth * this.tuning.size);
    const s = this.animal.create(e, this);
    return this.reenter(s), s;
  }
  reenter(e) {
    var d, u;
    const { width: s, height: i, course: n } = this,
      a = e.span * 0.6,
      o = Math.cos(n),
      r = Math.sin(n),
      h = i * Math.abs(o),
      l = s * Math.abs(r);
    Math.random() * (h + l) < h
      ? ((e.x = o >= 0 ? -a : s + a), (e.y = F(0, i)))
      : ((e.x = F(0, s)), (e.y = r <= 0 ? i + a : -a));
    const c = this.cruise(e);
    (e.heading = n),
      (e.vx = o * c),
      (e.vy = r * c),
      (e.bias = F(-1, 1)),
      (u = (d = this.animal).enter) == null || u.call(d, e, this);
  }
  passed(e, s = e.span) {
    const { width: i, height: n, course: a } = this,
      o = Math.cos(a),
      r = Math.sin(a),
      h =
        (o > 0.05 && e.x > i + s) ||
        (o < -0.05 && e.x < -s) ||
        (r < -0.05 && e.y < -s) ||
        (r > 0.05 && e.y > n + s),
      l = e.x < -3 * s || e.x > i + 3 * s || e.y < -3 * s || e.y > n + 3 * s;
    return h || l;
  }
  begin() {
    return (this.acc.x = 0), (this.acc.y = 0), this.acc;
  }
  steer(e, s, i, n) {
    (this.acc.x += (Math.cos(s) * i - e.vx) * n),
      (this.acc.y += (Math.sin(s) * i - e.vy) * n);
  }
  separate(e, s = this.tuning.separation, i = 0.42) {
    if (!(s <= 0))
      for (const n of this.creatures) {
        if (n === e || Math.abs(n.depth - e.depth) > 0.18) continue;
        const a = e.x - n.x,
          o = e.y - n.y,
          r = Math.hypot(a, o),
          h = (e.span + n.span) * i;
        if (r < h && r > 0.001) {
          const l = (1 - r / h) * s;
          (this.acc.x += (a / r) * l), (this.acc.y += (o / r) * l);
        }
      }
  }
  move(e, s, i) {
    (e.vx += this.acc.x * s), (e.vy += this.acc.y * s);
    let n = Math.hypot(e.vx, e.vy);
    const a = i + (this.time < e.startledUntil ? 300 : 0);
    return (
      n > a && ((e.vx *= a / n), (e.vy *= a / n), (n = a)),
      (e.x += e.vx * s),
      (e.y += e.vy * s),
      n
    );
  }
  face(e, s, i = 7, n = Math.atan2(e.vy, e.vx)) {
    const a = i * s;
    e.heading += R(dt(e.heading, n), -a, a);
  }
}
const xt = 0,
  V = 1,
  Ye = 2,
  wt = 3,
  Dt = 4,
  pt = 5,
  ze = 6,
  X = 7;
function w(t, e, s, i, n = xt, a = null) {
  return (t.r = e), (t.g = s), (t.b = i), (t.kind = n), (t.glyphs = a), !0;
}
const ut = {
    from: -0.3,
    to: 1,
    reach: 0.56,
    peak: 0.55,
    round: 0.5,
    scallop: 0,
  },
  as = {
    from: -1.45,
    to: 0.15,
    reach: 0.44,
    peak: 0.48,
    round: 0.42,
    scallop: 0.04,
  },
  me = 0.06,
  os = -0.02,
  rs = [30, 30, 42],
  hs = 2.6,
  ls = 0.35,
  cs = 1.3;
function ds(t, e, s = (e - t.from) / (t.to - t.from)) {
  if (s <= 0 || s >= 1) return 0;
  const i =
      s < t.peak
        ? (s / t.peak) * 0.5
        : 0.5 + ((s - t.peak) / (1 - t.peak)) * 0.5,
    n = t.reach * Math.pow(Math.sin(Math.PI * i), t.round);
  return t.scallop
    ? n * (1 - t.scallop * (0.5 + 0.5 * Math.cos(s * Math.PI * 14)))
    : n;
}
function us(t) {
  return t > 0.17 || t < -0.32
    ? 0
    : t > 0.11
      ? Math.sqrt(Math.max(0, 0.03 * 0.03 - (t - 0.14) ** 2))
      : t > -0.04
        ? 0.034
        : 0.03 * (1 - 0.6 * ((-0.04 - t) / 0.28));
}
const se = { t: 0, r: 0 };
function fe(t, e, s) {
  const i = Math.atan2(e, s),
    n = (i - t.from) / (t.to - t.from),
    a = ds(t, i, n),
    o = Math.hypot(e, s);
  return o > a ? !1 : ((se.t = n), (se.r = o / a), !0);
}
const ps = {
    ...gt,
    density: 1.05,
    speed: 1.05,
    sway: 0,
    spread: 0,
    size: 1.25,
    farthest: 0.18,
    farBias: 1.7,
    grip: 5,
    separation: 700,
    trail: 1.55,
    trailFade: 0.15,
    flutter: 0,
    glide: 2.75,
    flapRate: 1,
  },
  gs = {
    key: "butterflies",
    label: "Butterfly",
    swatch: [50, 135, 255],
    defaults: ps,
    controls: [
      [
        "Flight",
        [
          {
            key: "flutter",
            label: "Flutter",
            min: 0,
            max: 3,
            step: 0.05,
            hint: "How much their path zigzags.",
          },
          {
            key: "glide",
            label: "Glide",
            min: 0,
            max: 4,
            step: 0.05,
            hint: "How often they stop flapping and glide with wings held flat.",
          },
          {
            key: "flapRate",
            label: "Flap rate",
            min: 0.2,
            max: 3,
            step: 0.05,
            hint: "How fast their wings beat.",
          },
        ],
      ],
    ],
    area: 48e3,
    scale: 1,
    speed: 90,
    trail: { light: [70, 118, 226], dark: [96, 156, 255] },
    create: (t) => ({
      ...t,
      phase: F(0, B),
      open: 1,
      glide: 0,
      glideUntil: 0,
      flutterX: 0,
      flutterY: 0,
    }),
    enter(t) {
      (t.flutterX = 0), (t.flutterY = 0);
    },
    update(t, e, s) {
      const i = e.tuning,
        n = e.time,
        a = e.cruise(t),
        o = e.begin();
      e.steer(t, e.heading + t.bias * i.spread, a, i.grip);
      const r =
        Math.sqrt(s) *
        520 *
        cs *
        i.flutter *
        (1 - 0.8 * t.glide) *
        (0.5 + 0.5 * t.depth);
      (t.flutterX += -t.flutterX * 3 * s + (Math.random() * 2 - 1) * r),
        (t.flutterY += -t.flutterY * 3 * s + (Math.random() * 2 - 1) * r),
        (o.x += t.flutterX),
        (o.y += t.flutterY);
      const h = Math.max(0, -Math.sin(t.phase)) * (1 - t.glide);
      (o.x += Math.cos(t.heading) * h * a * 1.4),
        (o.y += Math.sin(t.heading) * h * a * 1.4),
        e.separate(t);
      const l = e.move(t, s, a * 2.2);
      e.passed(t) && e.reenter(t),
        l > 12 && e.face(t, s),
        t.glide < 0.5 &&
          n > t.glideUntil &&
          l > a * 0.5 &&
          Math.random() < ls * i.glide * s &&
          (t.glideUntil = n + F(0.5, 1.4)),
        (t.glide +=
          ((n < t.glideUntil ? 1 : 0) - t.glide) * Math.min(1, s * 6));
      const c = R(l / (a * 2), 0, 1);
      t.phase +=
        s * B * hs * i.flapRate * (0.8 + 0.6 * c) * (1 - 0.9 * t.glide);
      const d = Math.pow(0.5 + 0.5 * Math.cos(t.phase), 0.8);
      t.open = 0.1 + 0.9 * (d * (1 - t.glide) + 0.96 * t.glide);
    },
    startle(t, e, s, i, n) {
      const a = i * 420 * t.depth;
      (t.vx += e * a),
        (t.vy += s * a),
        (t.startledUntil = n.time + F(0.6, 1.2)),
        (t.glideUntil = 0);
    },
    draw(t, e) {
      const s = t.span,
        i = Math.max(0.08, t.open),
        n = e.ink,
        a = {
          x: t.x,
          y: t.y,
          heading: t.heading + 0.06 * Math.sin(t.phase),
          span: s,
          depth: t.depth,
          id: t.id,
        },
        o = e.cw * 0.4;
      e.shape(
        a,
        0.75,
        (b, g) => {
          const p = Math.abs(g),
            k = us(b);
          if (k > 0 && p * s <= Math.max(k * s, o)) return w(n, ...rs, ze), !0;
          const M = p / i;
          let y;
          if (fe(ut, b - me, M)) y = 0;
          else if (fe(as, b - os, M)) y = 1;
          else return !1;
          const { t: f, r: m } = se;
          return (
            m > 0.86
              ? y === 0 && m < 0.95 && Math.abs(Z(f * 5) - 0.5) < 0.14
                ? w(n, 236, 240, 255, Ye)
                : w(n, 22, 28, 62, V)
              : m < 0.08
                ? w(n, 26, 44, 110, V)
                : y === 0 && f > 0.9
                  ? w(n, 30, 50, 120, V)
                  : w(n, 50 + 70 * m, 135 + 60 * m, 255, wt),
            !0
          );
        },
        { light: 0.6 + 0.4 * t.open, tilt: t.open * 3 },
      );
      const r = 0.012 * Math.sin(e.t * 3 + t.id);
      for (const b of [-1, 1])
        e.lineBody(
          a,
          0.16,
          0.012 * b,
          0.37 + r,
          (0.12 + r) * b,
          e.contrast,
          s > 120 ? "o" : void 0,
        );
      const h = Math.max(0, -Math.sin(t.phase)) * (1 - t.glide),
        l = ut.from + (ut.to - ut.from) * ut.peak,
        c = me + Math.sin(l) * ut.reach * 0.95,
        d = Math.cos(l) * ut.reach * 0.95 * t.open,
        u = { x: 0, y: 0 };
      for (const b of [-1, 1])
        e.toWorld(a, c, d * b, u), e.shed(u.x, u.y, (0.02 + 0.1 * h) * t.depth);
    },
  },
  Ot = { t: 0 };
function Ke(t, e, s, i, n, a) {
  const o = n - s,
    r = a - i,
    h = R(((t - s) * o + (e - i) * r) / (o * o + r * r || 1), 0, 1);
  return (Ot.t = h), Math.hypot(t - s - o * h, e - i - r * h);
}
function ne(t, e, s, i, n, a) {
  const o = (t - s) / n,
    r = (e - i) / a;
  return o * o + r * r <= 1;
}
function ie(t, e, s, i, n) {
  const a = t / s,
    o = e / s,
    r = Math.floor(a),
    h = Math.floor(o),
    l = 0.25 + 0.5 * W(r, h, n),
    c = 0.25 + 0.5 * W(r, h, n + 11),
    d = (i / s) * (0.6 + 0.6 * W(r, h, n + 23));
  return (a - r - l) ** 2 + (o - h - c) ** 2 < d * d;
}
const ms = [14, 10, 10],
  fs = [255, 252, 246],
  ys = {
    ...gt,
    detail: 1.7,
    fog: 0.12,
    density: 1.8,
    sway: 0,
    spread: 0,
    farthest: 0.25,
    farBias: 0.7,
    grip: 3,
    separation: 400,
    trail: 1.2,
    trailFade: 0.35,
    shimmer: 0.1,
    sparkle: 0.03,
    burst: 1,
    rest: 1,
    legSpeed: 1,
    scare: 0.55,
  },
  Ms = [204, 82, 52],
  ws = [232, 132, 92],
  ye = [140, 46, 32],
  Me = [214, 92, 56],
  xs = [60, 30, 30],
  we = [186, 72, 44],
  bs = [0.07, -0.01, -0.08, -0.14],
  vs = {
    key: "crabs",
    label: "Crab",
    swatch: [204, 82, 52],
    defaults: ys,
    controls: [
      [
        "Scuttling",
        [
          {
            key: "burst",
            label: "Burst length",
            min: 0.2,
            max: 4,
            step: 0.05,
            hint: "How long each scuttle lasts.",
          },
          {
            key: "rest",
            label: "Pause length",
            min: 0,
            max: 4,
            step: 0.05,
            hint: "How long they pause between scuttles. 0 means they never stop.",
          },
          {
            key: "legSpeed",
            label: "Leg speed",
            min: 0.2,
            max: 3,
            step: 0.05,
            hint: "How fast the legs step.",
          },
          {
            key: "scare",
            label: "Scare",
            min: 0,
            max: 3,
            step: 0.05,
            hint: "How fast and far crabs bolt away when you tap near them.",
          },
        ],
      ],
    ],
    area: 7e4,
    scale: 0.8,
    speed: 95,
    trail: { light: [176, 146, 104], dark: [206, 178, 136] },
    create: (t) => ({
      ...t,
      running: !0,
      until: 0,
      facing: Math.random() < 0.5 ? 1 : -1,
      gait: F(0, B),
      alarm: 0,
      fleeDir: 0,
      fleeSpeed: 0,
      fleeFrom: 0,
    }),
    enter(t, e) {
      (t.running = !0),
        (t.until = e.time + F(0.3, 1.2)),
        (t.heading = e.course - (t.facing * Math.PI) / 2);
    },
    update(t, e, s) {
      const i = e.tuning,
        n = e.time;
      n >= t.until &&
        ((t.running = !t.running || i.rest <= 0),
        (t.until =
          n + (t.running ? F(0.5, 1.6) * i.burst : F(0.3, 1.4) * i.rest)));
      const a = e.cruise(t),
        o = e.heading + t.bias * i.spread,
        r = n < t.startledUntil,
        h = r ? (n - t.fleeFrom) / (t.startledUntil - t.fleeFrom) : 1,
        l = r ? t.fleeDir : o;
      e.begin(),
        r
          ? e.steer(t, t.fleeDir, Math.max(a, t.fleeSpeed * (1 - h * h)), 8)
          : e.steer(t, o, t.running ? a : 0, i.grip * 2),
        e.separate(t);
      const c = e.move(t, s, r ? Math.max(a * 2, t.fleeSpeed) : a * 2);
      e.passed(t) && e.reenter(t);
      const d =
          r &&
          Math.abs(dt(t.heading + (t.facing * Math.PI) / 2, l)) > Math.PI / 2
            ? -t.facing
            : t.facing,
        u = l - (d * Math.PI) / 2,
        b = (r ? 10 : 3) * s;
      (t.heading += Math.max(-b, Math.min(b, dt(t.heading, u)))),
        (t.gait += (s * c * i.legSpeed) / Math.max(4, t.span * 0.09)),
        (t.alarm = Math.max(0, t.alarm - s * 0.7));
    },
    startle(t, e, s, i, n) {
      const a = n.tuning;
      a.scare <= 0 ||
        ((t.fleeDir = Math.atan2(s, e) + F(-0.35, 0.35)),
        (t.fleeSpeed = n.cruise(t) * (2.5 + 3 * i) * a.scare),
        (t.fleeFrom = n.time),
        (t.startledUntil = n.time + (1 + 1.5 * i) * Math.sqrt(a.scare)),
        (t.vx = Math.cos(t.fleeDir) * t.fleeSpeed),
        (t.vy = Math.sin(t.fleeDir) * t.fleeSpeed),
        (t.running = !0),
        (t.until = t.startledUntil + F(0.3, 1)),
        (t.alarm = 1));
    },
    draw(t, e) {
      const s = t.span,
        i = e.ink,
        n = {
          x: t.x,
          y: t.y,
          heading: t.heading,
          span: s,
          depth: t.depth,
          id: t.id,
        },
        a = { x: 0, y: 0 };
      for (const h of [-1, 1])
        bs.forEach((l, c) => {
          const d = t.gait + c * Math.PI * 0.5 + (h > 0 ? Math.PI : 0),
            u = Math.max(0, Math.sin(d)),
            b = 0.04 * Math.cos(d),
            g = (c - 1.5) * 0.06,
            p = l + g * 0.6,
            k = (0.36 - 0.03 * u) * h,
            M = l + g * 1.4 + b,
            y = (0.52 + 0.03 * Math.cos(d) - 0.06 * u) * h;
          e.lineBody(n, l, 0.22 * h, p, k, we),
            e.lineBody(n, p, k, M, y, we),
            u < 0.05 &&
              Math.cos(d) > 0.9 &&
              (e.toWorld(n, M, y, a), e.shed(a.x, a.y, 0.12 * t.depth));
        });
      const o = t.alarm;
      e.shape(n, 0.62, (h, l) => {
        const c = Math.abs(l),
          d = Math.abs(h / 0.17),
          u = c / 0.27,
          b = h > 0.06 ? 0.06 * (0.5 + 0.5 * Math.cos(u * Math.PI * 7)) : 0;
        if (Math.pow(d, 2.2) + Math.pow(u, 2.4) <= 1 - b)
          return ie(h, l, 0.05, 0.012, t.id)
            ? w(i, ...ye, V)
            : Math.abs(c - 0.08) < 0.01 && h > -0.08 && h < 0.05
              ? w(i, ...ye, V, "|")
              : ne(h, c, 0.01, 0, 0.1, 0.13)
                ? w(i, ...ws)
                : w(i, ...Ms);
        const g = 0.26 + 0.07 * o,
          p = 0.25 + 0.05 * o;
        if (Ke(h, c, 0.12, 0.17, g, p) < 0.034) return w(i, ...Me, xt);
        const k = 0.34 + 0.08 * o,
          M = 0.19 + 0.04 * o,
          y = 1 + 0.15 * o,
          f = 0.55,
          m = ((h - k) * Math.cos(f) - (c - M) * Math.sin(f)) / y,
          E = ((h - k) * Math.sin(f) + (c - M) * Math.cos(f)) / y;
        if ((m / 0.09) ** 2 + (E / 0.055) ** 2 <= 1) {
          const x = 0.15 + 0.55 * o;
          return m > 0.02 && Math.abs(E) < x * (m - 0.02)
            ? !1
            : m > 0.06
              ? w(i, ...xs, V)
              : w(i, ...Me, xt);
        }
        return !1;
      });
      const r = Math.min(0.14, Math.max(0.06, (e.cw * 0.55) / s));
      for (const h of [-1, 1])
        e.toWorld(n, 0.2, r * h, a), e.spot(a.x, a.y, "●", fs, ms, t.depth);
    },
  },
  Ss = {
    ...gt,
    detail: 1.7,
    density: 0.8,
    speed: 1.5,
    sway: 0,
    spread: 0,
    farthest: 0.35,
    farBias: 1.3,
    grip: 3,
    separation: 150,
    trail: 0,
    shimmer: 0.1,
    sparkle: 0.04,
    wingbeat: 1,
    glide: 1,
    foldFlap: !1,
  },
  lt = 0.045,
  xe = 0.25,
  be = 0.5,
  ft = [236, 238, 242],
  ve = [32, 32, 38],
  ks = [78, 78, 92],
  Es = [226, 36, 36],
  Is = [14, 12, 16],
  As = [255, 252, 246],
  Ls = [196, 196, 150],
  Fs = [60, 60, 66],
  yt = { x: 0, y: 0 },
  Rt = { s: 0, q: 0 };
function Ts(t, e) {
  if (e < lt || e > be) return !1;
  const s = (e - lt) / (be - lt),
    i = 0.12 + 0.03 * s - 0.09 * s * s;
  let n = (-0.075 + 0.03 * s) * 1.2;
  s < 0.78 && (n += 0.012 * (0.5 + 0.5 * Math.cos(s * B * 9)));
  const a = s > 0.72 ? nt(n, i - 0.015, Math.pow((s - 0.72) / 0.28, 1.4)) : n;
  if (t > i || t < a) return !1;
  const o = (t - a) / (i - a);
  return s > 0.78 && o < 0.92 && Z(o * 6) < 0.24
    ? !1
    : ((Rt.s = s), (Rt.q = o), !0);
}
const Y = { arm: 1, hand: 1, sweep: 0, lift: 0 },
  Wt = 0.6,
  Se = 0.85,
  ke = -0.6;
function Hs(t) {
  const e = Math.pow(0.5 + 0.5 * Math.cos(t.phase), 0.8),
    s = Math.max(0.12, 0.25 + 0.75 * (e * (1 - t.glide) + t.glide));
  (Y.arm = s), (Y.hand = s), (Y.sweep = 0), (Y.lift = 0);
}
function Ps(t) {
  const e = Z(t.phase / B),
    s = (r) => 0.5 - 0.5 * Math.cos(Math.PI * r);
  let i, n, a;
  if (e < Wt) {
    const r = e / Wt;
    (i = nt(Se, ke, s(r))),
      (n = -0.12 * Math.sin(Math.PI * r)),
      (a = 0),
      (Y.lift = Math.sin(Math.PI * r));
  } else {
    const r = (e - Wt) / (1 - Wt);
    (i = nt(ke, Se, s(r))),
      (n = 1.05 * Math.sin(Math.PI * r)),
      (a = 0.45 * Math.sin(Math.PI * r)),
      (Y.lift = 0);
  }
  const o = t.glide;
  (i = nt(i, 0.1, o)),
    (Y.sweep = nt(n, 0, o)),
    (Y.arm = Math.cos(i)),
    (Y.hand = Math.max(0.2, Math.cos(i + Math.sign(i || 1) * a * (1 - o)))),
    (Y.lift *= 1 - o);
}
const Lt = { u: 0, v: 0 };
function Os(t, e) {
  const s = lt + (xe - lt) * Y.arm,
    i = 0.03,
    n = t - i,
    a = e - s,
    o = Math.cos(Y.sweep),
    r = Math.sin(Y.sweep),
    h = -n * r + a * o;
  return (
    e <= s || h < 0
      ? ((Lt.u = t), (Lt.v = lt + (e - lt) / Y.arm))
      : ((Lt.u = i + n * o + a * r), (Lt.v = xe + h / Y.hand)),
    Lt
  );
}
const Rs = {
    key: "cranes",
    label: "Crane",
    swatch: [214, 220, 238],
    defaults: Ss,
    controls: [
      [
        "Flight",
        [
          {
            key: "wingbeat",
            label: "Wingbeat",
            min: 0.3,
            max: 2.5,
            step: 0.05,
            hint: "How fast they flap.",
          },
          {
            key: "glide",
            label: "Glide",
            min: 0,
            max: 4,
            step: 0.05,
            hint: "How often they stop flapping and glide.",
          },
          {
            key: "foldFlap",
            label: "Folding flap",
            toggle: !0,
            hint: "Off: the wings open and close evenly from the body. On: a slow downstroke and a quick upstroke that folds the wings back at the wrist.",
          },
        ],
      ],
    ],
    area: 55e3,
    scale: 1.45,
    speed: 85,
    trail: { light: [150, 152, 170], dark: [200, 204, 226] },
    create: (t) => ({
      ...t,
      phase: F(0, B),
      pace: 0.8 + 0.4 * W(t.id, 5, 9),
      glide: 0,
      glideUntil: 0,
    }),
    update(t, e, s) {
      const i = e.tuning,
        n = e.time,
        a = e.cruise(t),
        o = e.heading + t.bias * i.spread;
      e.begin(),
        e.steer(t, o, a, i.grip),
        e.separate(t, i.separation, 0.45),
        e.move(t, s, a * 1.6),
        e.passed(t) && e.reenter(t),
        e.face(t, s, 2, o),
        t.glide < 0.5 &&
          n > t.glideUntil &&
          Math.random() < 0.25 * i.glide * s &&
          (t.glideUntil = n + F(1, 2.5)),
        (t.glide +=
          ((n < t.glideUntil ? 1 : 0) - t.glide) * Math.min(1, s * 3)),
        (t.phase += s * B * 1.25 * i.wingbeat * t.pace * (1 - 0.92 * t.glide));
    },
    draw(t, e, s) {
      s.tuning.foldFlap ? Ps(t) : Hs(t);
      const i = t.span * (1 + 0.025 * Y.lift),
        n = e.ink,
        a = {
          x: t.x,
          y: t.y,
          heading: t.heading,
          span: i,
          depth: t.depth,
          id: t.id,
        },
        o = Math.max(0.018, (e.cw * 0.45) / i),
        r = Math.max(0.032, (e.cw * 0.6) / i);
      for (const h of [-1, 1])
        e.lineBody(a, -0.2, 0.014 * h, -0.62, 0.022 * h, Fs);
      if (
        (e.lineBody(a, 0.47, 0, 0.6, 0, Ls),
        e.shape(
          a,
          0.66,
          (h, l) => {
            const c = Math.abs(l);
            if (Math.hypot(h - 0.44, c) < r) return w(n, ...ve, V);
            if (h > 0.12 && h < 0.43 && c < o)
              return h > 0.28 ? w(n, ...ks, V) : w(n, ...ft);
            if (
              ne(
                h,
                c,
                -0.19,
                0,
                0.08,
                0.045 + 0.4 * Math.max(0, -0.12 - h) ** 1.2,
              )
            )
              return w(n, ...ft);
            if (ne(h, c, 0, 0, 0.16, 0.055)) return w(n, ...ft);
            if (c <= lt) return !1;
            const { u: d, v: u } = Os(h, c);
            if (!Ts(d, u)) return !1;
            if (Rt.q < 0.42 && Rt.s < 0.7) return w(n, ...ve, V);
            const b = 0.9 + 0.1 * Rt.q;
            return w(n, ft[0] * b, ft[1] * b, ft[2] * b, xt);
          },
          { light: 0.82 + 0.18 * Y.arm },
        ),
        e.toWorld(a, 0.445, 0, yt),
        e.spot(yt.x, yt.y, "@", [255, 214, 200], Es, t.depth),
        0.064 * i >= e.cw * 1.2)
      ) {
        const h = Math.max(0.032, e.cw / i);
        for (const l of [-1, 1])
          e.toWorld(a, 0.44, h * l, yt),
            e.spot(yt.x, yt.y, "●", As, Is, t.depth);
      }
    },
  },
  Ft = 6,
  Ee = {
    light: {
      background: [246, 243, 236],
      grid: [30, 34, 60, 0.07],
      trailAlpha: 0.7,
      ink: [42, 42, 59],
    },
    dark: {
      background: [6, 7, 12],
      grid: [255, 255, 255, 0.055],
      trailAlpha: 0.85,
      ink: [150, 160, 200],
    },
  },
  Ie = ".:;+=*%#",
  Cs = "#%@",
  Ds = "o*",
  $s = "8#@",
  Ns = ".:+*",
  Bs = ":;",
  Ws = ".',`",
  Mt = [
    [255, 255, 255],
    [228, 246, 255],
    [200, 244, 255],
  ],
  _s = 0,
  rt = 1,
  _t = 2,
  Kt = [0.25, 0.3, 0.75, 0.3, 0.25, 0.72, 0.75, 0.72];
function Ae(t) {
  const e = Math.cos((t * Math.PI) / 180),
    s = Math.sin((t * Math.PI) / 180);
  return [
    0.213 + e * 0.787 - s * 0.213,
    0.715 - e * 0.715 - s * 0.715,
    0.072 - e * 0.072 + s * 0.928,
    0.213 - e * 0.213 + s * 0.143,
    0.715 + e * 0.285 + s * 0.14,
    0.072 - e * 0.072 - s * 0.283,
    0.213 - e * 0.213 - s * 0.787,
    0.715 - e * 0.715 + s * 0.715,
    0.072 + e * 0.928 + s * 0.072,
  ];
}
function Us(t, e, s, i, n, a, o = "rgba(30,34,60,0.07)") {
  t.setTransform(1, 0, 0, 1, 0, 0),
    (t.strokeStyle = o),
    (t.lineWidth = 1),
    t.beginPath();
  for (let r = 0; r <= Math.ceil(e / i); r++) {
    const h = Math.round(r * i * a) + 0.5;
    t.moveTo(h, 0), t.lineTo(h, s * a);
  }
  for (let r = 0; r <= Math.ceil(s / n); r++) {
    const h = Math.round(r * n * a) + 0.5;
    t.moveTo(0, h), t.lineTo(e * a, h);
  }
  t.stroke();
}
const Xt = (t, e, s) =>
    `rgb(${R(Math.round(t), 0, 255)},${R(Math.round(e), 0, 255)},${R(Math.round(s), 0, 255)})`,
  Tt = (t, e, s) =>
    (R(Math.round(t), 0, 255) << 16) |
    (R(Math.round(e), 0, 255) << 8) |
    R(Math.round(s), 0, 255);
function ae(t) {
  let e = t % Math.PI;
  return (
    e < 0 && (e += Math.PI),
    e < Math.PI / 8 || e >= (7 * Math.PI) / 8
      ? "-"
      : e < (3 * Math.PI) / 8
        ? "\\"
        : e < (5 * Math.PI) / 8
          ? "|"
          : "/"
  );
}
class Gs {
  constructor(e) {
    S(this, "ink", { r: 0, g: 0, b: 0, kind: 0, glyphs: null, au: 0, av: 0 });
    S(this, "t", 0);
    S(this, "theme", "light");
    S(this, "a", { x: 0, y: 0 });
    S(this, "b", { x: 0, y: 0 });
    this.r = e;
  }
  get cw() {
    return this.r.cw;
  }
  get ch() {
    return this.r.ch;
  }
  get cols() {
    return this.r.cols;
  }
  get rows() {
    return this.r.rows;
  }
  get contrast() {
    return this.r.palette.ink;
  }
  toWorld(e, s, i, n) {
    const a = Math.cos(e.heading),
      o = Math.sin(e.heading);
    return (
      (n.x = e.x + (s * a - i * o) * e.span),
      (n.y = e.y + (s * o + i * a) * e.span),
      n
    );
  }
  fogFor(e) {
    return (1 - e) * this.r.tuning.fog;
  }
  shape(e, s, i, n = {}) {
    this.r.shape(e, s, i, n);
  }
  line(e, s, i, n, a, o, r, h = this.fogFor(o)) {
    this.r.line(e, s, i, n, a, h, r);
  }
  lineBody(e, s, i, n, a, o, r) {
    const h = this.toWorld(e, s, i, this.a),
      l = this.toWorld(e, n, a, this.b);
    this.r.line(h.x, h.y, l.x, l.y, o, this.fogFor(e.depth), r);
  }
  dot(e, s, i, n, a, o = this.fogFor(a)) {
    this.r.dot(e, s, i, n, o);
  }
  spot(e, s, i, n, a, o) {
    this.r.spot(e, s, i, n, a, this.fogFor(o));
  }
  shed(e, s, i) {
    this.r.shed(e, s, i);
  }
  cellIndex(e, s) {
    return this.r.cellIndex(e, s);
  }
}
class qs {
  constructor(e, s) {
    S(this, "cw", 12);
    S(this, "ch", 18);
    S(this, "cols", 0);
    S(this, "rows", 0);
    S(this, "palette", Ee.light);
    S(this, "pen", new Gs(this));
    S(this, "ctx");
    S(this, "bg");
    S(this, "dpr", 1);
    S(this, "width", 0);
    S(this, "height", 0);
    S(this, "fontFamily", "ui-monospace, Menlo, monospace");
    S(this, "theme", "light");
    S(this, "animal", null);
    S(this, "energy", new Float32Array(0));
    S(this, "energyTmp", new Float32Array(0));
    S(this, "trailStyles", []);
    S(this, "hue", Ae(0));
    S(this, "hueOn", !1);
    S(this, "cellFlag", new Uint8Array(0));
    S(this, "cellFill", new Uint32Array(0));
    S(this, "cellColor", new Uint32Array(0));
    S(this, "cellGlyph", new Uint16Array(0));
    (this.canvas = e), (this.tuning = s);
    const i = e.getContext("2d", { alpha: !1 });
    if (!i) throw new Error("2D canvas unavailable");
    (this.ctx = i),
      (this.bg = document.createElement("canvas")),
      this.setTheme("light");
  }
  setFontFamily(e) {
    e && (this.fontFamily = e);
  }
  setTheme(e, p) {
    // patch (c): p = a palette built from the background tone (default: the named one); on a light one colours are capped
    (this.theme = e),
      (this.pen.theme = e),
      (this.palette = p || Ee[e]),
      (this.light = e === "light"),
      (this.cap = this.light ? capOf(this.palette.background) : 1),
      this.restyle();
  }
  setAnimal(e, s) {
    (this.animal = e), (this.tuning = s), this.energy.fill(0), this.restyle();
  }
  restyle() {
    var o;
    const e = this.palette,
      s = ((o = this.animal) == null ? void 0 : o.trail[this.theme]) ?? e.ink;
    (this.hue = Ae(this.tuning.hueShift)),
      (this.hueOn = this.tuning.hueShift % 360 !== 0);
    const [i, n, a] = this.turn(s[0], s[1], s[2]);
    this.trailStyles = [];
    for (let r = 0; r < Ft; r++)
      this.trailStyles.push(
        `rgba(${i},${n},${a},${((e.trailAlpha * (r + 1)) / Ft).toFixed(3)})`,
      );
    this.paintBackground();
  }
  turn(e, s, i) {
    if (this.cap < 1) {
      // patch (c): a colour brighter than the cap would vanish on a light background: darken it, keeping its hue
      const l = (0.3 * e + 0.59 * s + 0.11 * i) / 255;
      l > this.cap && ((e *= this.cap / l), (s *= this.cap / l), (i *= this.cap / l));
    }
    if (!this.hueOn) return [e, s, i];
    const n = this.hue;
    return [
      n[0] * e + n[1] * s + n[2] * i,
      n[3] * e + n[4] * s + n[5] * i,
      n[6] * e + n[7] * s + n[8] * i,
    ];
  }
  fade(e, s, i, n) {
    const [a, o, r] = this.palette.background;
    return Tt(e + (a - e) * n, s + (o - s) * n, i + (r - i) * n);
  }
  resize(e, s, i) {
    const n = this.cols,
      a = this.rows;
    (this.width = e),
      (this.height = s),
      (this.dpr = i),
      (this.cw = R(Math.round(e / 124 / this.tuning.detail), 5, 24)),
      (this.ch = Math.round(this.cw * 1.45)),
      (this.cols = Math.ceil(e / this.cw)),
      (this.rows = Math.ceil(s / this.ch)),
      (this.canvas.width = Math.round(e * i)),
      (this.canvas.height = Math.round(s * i)),
      (this.bg.width = this.canvas.width),
      (this.bg.height = this.canvas.height);
    const o = this.cols * this.rows;
    (this.cols !== n || this.rows !== a) &&
      ((this.energy = new Float32Array(o)),
      (this.energyTmp = new Float32Array(o)),
      (this.cellFlag = new Uint8Array(o)),
      (this.cellFill = new Uint32Array(o)),
      (this.cellColor = new Uint32Array(o)),
      (this.cellGlyph = new Uint16Array(o))),
      this.paintBackground();
  }
  paintBackground() {
    const e = this.bg.getContext("2d");
    if (!e) return;
    const { width: s, height: i, dpr: n, cw: a, ch: o } = this;
    e.setTransform(n, 0, 0, n, 0, 0),
      (e.fillStyle = Xt(...this.palette.background)),
      e.fillRect(0, 0, s, i);
    const [r, h, l, c] = this.palette.grid;
    Us(
      e,
      s,
      i,
      a,
      o,
      n,
      `rgba(${r},${h},${l},${(c * this.tuning.grid).toFixed(3)})`,
    );
  }
  render(e, s) {
    const { ctx: i, dpr: n, cols: a, ch: o } = this;
    if (a === 0) return;
    this.pen.t = e.time;
    for (const h of e.events) this.stamp(h.x, h.y, h.radius, h.amount);
    (e.events.length = 0), this.diffuse(s), this.cellFlag.fill(_s);
    const r = e.animal;
    if (r.drawAll) r.drawAll(e, this.pen);
    else if (r.draw) for (const h of e.creatures) r.draw(h, this.pen, e);
    i.setTransform(1, 0, 0, 1, 0, 0),
      i.drawImage(this.bg, 0, 0),
      i.setTransform(n, 0, 0, n, 0, 0),
      this.drawTrail(e.time),
      (i.font = `600 ${Math.round(o * 0.74)}px ${this.fontFamily}`),
      (i.textAlign = "center"),
      (i.textBaseline = "middle"),
      this.drawCells();
  }
  cellIndex(e, s) {
    const i = Math.floor(e / this.cw),
      n = Math.floor(s / this.ch);
    return i < 0 || n < 0 || i >= this.cols || n >= this.rows
      ? -1
      : n * this.cols + i;
  }
  shed(e, s, i) {
    const n = this.cellIndex(e, s);
    n >= 0 &&
      (this.energy[n] = Math.min(1.6, this.energy[n] + i * this.tuning.trail));
  }
  stamp(e, s, i, n) {
    const a = this.energy,
      o = Math.floor(e / this.cw),
      r = Math.floor(s / this.ch);
    for (let h = r - i; h <= r + i; h++)
      for (let l = o - i; l <= o + i; l++) {
        if (l < 0 || h < 0 || l >= this.cols || h >= this.rows) continue;
        const c = Math.hypot(l - o, (h - r) * 1.4);
        if (c > i + 0.5) continue;
        const d = h * this.cols + l;
        a[d] = Math.min(1.6, a[d] + n * (1 - c / (i + 1)));
      }
  }
  diffuse(e) {
    const { cols: s, rows: i, energy: n, energyTmp: a } = this,
      o = Math.exp(-e * this.tuning.trailFade);
    for (let r = 0; r < i; r++)
      for (let h = 0; h < s; h++) {
        const l = r * s + h,
          c = h > 0 ? n[l - 1] : n[l],
          d = h < s - 1 ? n[l + 1] : n[l],
          u = r > 0 ? n[l - s] : n[l],
          b = r < i - 1 ? n[l + s] : n[l];
        a[l] = (n[l] * 4 + c + d + u + b) * 0.125 * o;
      }
    (this.energy = a), (this.energyTmp = n);
  }
  drawTrail(e) {
    const { ctx: s, cols: i, cw: n, ch: a, energy: o, cellFlag: r } = this,
      h = Math.max(2, Math.round(n * 0.19));
    for (let l = 0; l < Ft; l++) {
      s.fillStyle = this.trailStyles[l];
      for (let c = 0; c < o.length; c++) {
        const d = o[c];
        if (d < 0.12 || r[c] === rt) continue;
        const u = c % i,
          b = (c / i) | 0,
          g = 0.75 + 0.25 * Math.sin(e * 5 + W(u, b, 3) * 40);
        if (R(Math.floor(d * g * 4 * Ft) - 1, 0, Ft - 1) !== l) continue;
        const p = d > 0.6 ? h + 1 : h;
        s.fillRect(
          Math.round(u * n + n * 0.5 - p / 2),
          Math.round(b * a + a * 0.6 - p / 2),
          p,
          p,
        );
      }
    }
  }
  probe(e, s, i, n, a, o) {
    const r = this.pen.ink,
      h = a - s.x,
      l = o - s.y,
      c = (h * i + l * n) / s.span,
      d = (l * i - h * n) / s.span;
    return (r.glyphs = null), (r.au = c), (r.av = d), e(c, d, a, o);
  }
  shape(
    e,
    s,
    i,
    { light: n = 1, tilt: a = 0, fog: o = (1 - e.depth) * this.tuning.fog },
  ) {
    const {
        cellFlag: r,
        cellFill: h,
        cellColor: l,
        cellGlyph: c,
        cw: d,
        ch: u,
        cols: b,
        rows: g,
      } = this,
      p = this.pen.ink,
      k = this.pen.t,
      { shimmer: M, sparkle: y } = this.tuning,
      f = e.span,
      m = Math.cos(e.heading),
      E = Math.sin(e.heading),
      x = s * f,
      v = Math.max(0, Math.floor((e.x - x) / d)),
      L = Math.min(b - 1, Math.floor((e.x + x) / d)),
      C = Math.max(0, Math.floor((e.y - x) / u)),
      D = Math.min(g - 1, Math.floor((e.y + x) / u));
    for (let N = C; N <= D; N++)
      for (let J = v; J <= L; J++) {
        const A = J * d,
          _ = N * u,
          U = this.probe(i, e, m, E, A + d / 2, _ + u / 2);
        let I = U ? 1 : 0,
          T = p.r,
          O = p.g,
          H = p.b;
        const P = p.kind,
          z = p.glyphs,
          Q = p.au,
          at = p.av;
        for (let st = 0; st < Kt.length; st += 2)
          this.probe(i, e, m, E, A + Kt[st] * d, _ + Kt[st + 1] * u) &&
            (I === 0 && ((T = p.r), (O = p.g), (H = p.b)), I++);
        if (I === 0) continue;
        const it = I / 5,
          $ = N * b + J,
          ot = U && it >= 0.6;
        if (!ot && r[$] === rt) continue;
        [T, O, H] = this.turn(T, O, H);
        let $t = n * (1 + (W(J, N, Math.floor(k * 6)) - 0.5) * 0.06);
        ot &&
          P === wt &&
          ($t *=
            1 -
            0.4 * M +
            M * Math.sin(k * 2.2 + Q * 9 + at * 6 + a + e.heading * 2)),
          (T *= $t),
          (O *= $t),
          (H *= $t);
        const et =
          (W(
            Math.round((Q * f) / (d * 0.9)),
            Math.round((at * f) / (d * 0.9)),
            e.id,
          ) *
            4294967295) >>>
          0;
        if (!ot) {
          const st = it >= 0.5 ? Bs : Ws;
          (r[$] = _t),
            (l[$] = this.fade(T, O, H, Math.min(1, o + 0.55 - 0.45 * it))),
            (c[$] = st.charCodeAt((et >>> 8) % st.length));
          continue;
        }
        if (P === pt) {
          if (r[$] === rt) continue;
          const st = (0.3 * T + 0.59 * O + 0.11 * H) / 255,
            mt = z ?? Ns;
          (r[$] = _t),
            (l[$] = this.fade(T, O, H, o)),
            (c[$] = mt.charCodeAt(
              z
                ? (et >>> 8) % mt.length
                : R(Math.floor(st * mt.length), 0, mt.length - 1),
            ));
          continue;
        }
        r[$] = rt;
        const qt = W(et, Math.floor(k * 2.4 + (et % 997) / 97), 7);
        let K, bt, vt, St;
        if (P === Dt) {
          (h[$] = this.fade(T, O, H, Math.min(1, 0.62 + o * 0.38))),
            (K = z ?? Ie),
            (l[$] = this.fade(T, O, H, o)),
            (c[$] = K.charCodeAt((et >>> 8) % K.length)),
            qt < y && (l[$] = Tt(...(this.light ? LIGHT_SPARKLE : Mt)[et % Mt.length])); // patch (c)
          continue;
        }
        if (P === X) {
          (h[$] = this.fade(T * 0.58, O * 0.58, H * 0.58, o)),
            (K = z ?? ".:*"),
            (l[$] =
              qt < y
                ? Tt(...Mt[et % Mt.length])
                : this.fade(
                    Math.min(255, T * 1.05 + 50),
                    Math.min(255, O * 1.05 + 50),
                    Math.min(255, H * 1.05 + 50),
                    o,
                  )),
            (c[$] = K.charCodeAt((et >>> 8) % K.length));
          continue;
        }
        const Nt = this.fade(T, O, H, o);
        h[$] = Nt;
        const kt = Nt >>> 16,
          Et = (Nt >>> 8) & 255,
          It = Nt & 255;
        P === ze
          ? ((K = z ?? $s),
            ([bt, vt, St] = this.light // patch (c)
              ? [kt * 0.42, Et * 0.42, It * 0.42]
              : [kt * 1.6 + 44, Et * 1.6 + 40, It * 1.6 + 36]))
          : P === V
            ? ((K = z ?? Cs),
              ([bt, vt, St] = this.light // patch (c)
                ? [kt * 0.42, Et * 0.42, It * 0.42]
                : [kt * 1.7 + 34, Et * 1.7 + 30, It * 1.7 + 30]))
            : P === Ye
              ? ((K = z ?? Ds), ([bt, vt, St] = [kt * 0.4, Et * 0.4, It * 0.4]))
              : ((K = z ?? Ie),
                ([bt, vt, St] = [kt * 0.42, Et * 0.42, It * 0.42]));
        let Yt;
        if (z || (P !== xt && P !== wt))
          Yt = K.charCodeAt((et >>> 8) % K.length);
        else {
          const st = (0.3 * kt + 0.59 * Et + 0.11 * It) / 255,
            mt = ((et >>> 4) % 3) - 1;
          Yt = K.charCodeAt(
            R(Math.floor((1 - st) * (K.length - 0.01)) + mt, 0, K.length - 1),
          );
        }
        c[$] = Yt;
        const je = P === wt ? y : P === xt ? y / 3 : 0;
        l[$] = qt < je ? Tt(...Mt[et % Mt.length]) : Tt(bt, vt, St);
      }
  }
  line(e, s, i, n, a, o, r) {
    const { cellFlag: h, cellColor: l, cellGlyph: c, cw: d } = this,
      [u, b, g] = this.turn(a[0], a[1], a[2]),
      p = this.fade(u, b, g, o),
      k = ae(Math.atan2(n - s, i - e)).charCodeAt(0),
      M = Math.max(1, Math.ceil(Math.hypot(i - e, n - s) / (d * 0.5)));
    let y = -1;
    for (let f = 1; f <= M; f++) {
      const m = this.cellIndex(e + ((i - e) * f) / M, s + ((n - s) * f) / M);
      m < 0 || h[m] === rt || ((h[m] = _t), (l[m] = p), (c[m] = k), (y = m));
    }
    r && y >= 0 && (c[y] = r.charCodeAt(0));
  }
  dot(e, s, i, n, a) {
    const o = this.cellIndex(e, s);
    if (o < 0 || this.cellFlag[o] === rt) return;
    const [r, h, l] = this.turn(n[0], n[1], n[2]);
    (this.cellFlag[o] = _t),
      (this.cellColor[o] = this.fade(r, h, l, a)),
      (this.cellGlyph[o] = i.charCodeAt(0));
  }
  spot(e, s, i, n, a, o) {
    const r = this.cellIndex(e, s);
    if (r < 0) return;
    const [h, l, c] = this.turn(n[0], n[1], n[2]),
      [d, u, b] = this.turn(a[0], a[1], a[2]);
    (this.cellFlag[r] = rt),
      (this.cellFill[r] = this.fade(d, u, b, o)),
      (this.cellColor[r] = this.fade(h, l, c, o)),
      (this.cellGlyph[r] = i.charCodeAt(0));
  }
  drawCells() {
    const {
        ctx: e,
        cols: s,
        rows: i,
        cw: n,
        ch: a,
        cellFlag: o,
        cellFill: r,
        cellColor: h,
        cellGlyph: l,
      } = this,
      c = s * i;
    for (let d = 0; d < c; d++) {
      const u = o[d];
      if (!u) continue;
      const b = (d % s) * n,
        g = ((d / s) | 0) * a;
      if (u === rt) {
        const k = r[d];
        (e.fillStyle = Xt(k >>> 16, (k >>> 8) & 255, k & 255)),
          e.fillRect(b + 1, g + 1, n - 1, a - 1);
      }
      const p = h[d];
      (e.fillStyle = Xt(p >>> 16, (p >>> 8) & 255, p & 255)),
        e.fillText(String.fromCharCode(l[d]), b + n / 2, g + a / 2 + 1);
    }
  }
}
const Ys = {
    ...gt,
    fog: 0.26,
    density: 2.1,
    sway: 0,
    spread: 0,
    farthest: 0.32,
    farBias: 3,
    grip: 5,
    separation: 720,
    trail: 0.6,
    trailFade: 1.2,
    sparkle: 0.18,
    hover: 1.3,
    cruising: 0.5,
    dart: 1.5,
    wingbeat: 1,
  },
  zs = { u: 0.11, v: 0.02, angle: 0.08, length: 0.5, width: 0.062, broad: 0 },
  Ks = {
    u: 0.06,
    v: 0.02,
    angle: -0.05,
    length: 0.48,
    width: 0.07,
    broad: 0.5,
  },
  oe = { s: 0, x: 0 };
function Xs(t, e, s) {
  const i = e - t.u,
    n = s - t.v,
    a = Math.sin(t.angle),
    o = Math.cos(t.angle),
    r = (i * a + n * o) / t.length;
  if (r < 0 || r > 1) return !1;
  const h = i * o - n * a,
    l =
      t.width *
      Math.pow(Math.sin(Math.PI * (0.1 + 0.9 * r)), 0.45) *
      (1 + t.broad * (1 - r) * (1 - r));
  return Math.abs(h) > l ? !1 : ((oe.s = r), (oe.x = h / l), !0);
}
const Xe = [50, 220, 120],
  Vs = [240, 240, 232],
  Js = [10, 10, 12],
  Vt = { x: 0, y: 0 },
  Zs = [96, 232, 130],
  Qs = [28, 70, 44],
  Le = [40, 60, 44],
  js = [24, 72, 46],
  tn = [200, 255, 220],
  en = [18, 40, 28],
  sn = [236, 168, 70],
  Jt = [226, 236, 214],
  nn = [90, 220, 140],
  an = [176, 70, 40],
  on = [255, 255, 255],
  rn = {
    key: "dragonflies",
    label: "Dragonfly",
    swatch: Xe,
    defaults: Ys,
    hide: ["shimmer"],
    controls: [
      [
        "Flight",
        [
          {
            key: "hover",
            label: "Hover time",
            min: 0.1,
            max: 4,
            step: 0.05,
            hint: "How long they hang in place, on average. Each hover varies a lot: mostly brief, now and then a long one.",
          },
          {
            key: "cruising",
            label: "Cruising",
            min: 0,
            max: 1,
            step: 0.01,
            hint: "How often they fly on along the course for a few seconds instead of stopping to hover. Higher means fewer hovers.",
          },
          {
            key: "dart",
            label: "Dart speed",
            min: 0.2,
            max: 3,
            step: 0.05,
            hint: "How fast each dart is.",
          },
          {
            key: "wingbeat",
            label: "Wingbeat",
            min: 0.2,
            max: 2,
            step: 0.05,
            hint: "How fast the wings flicker.",
          },
        ],
      ],
    ],
    area: 15e4,
    scale: 2.1,
    speed: 70,
    trail: { light: [40, 160, 100], dark: [140, 255, 190] },
    create: (t) => ({ ...t, phase: F(0, B), mode: "hover", until: 0, aim: 0 }),
    enter(t, e) {
      (t.mode = "hover"), (t.until = e.time + F(0, 0.6)), (t.aim = e.course);
    },
    update(t, e, s) {
      const i = e.tuning,
        n = e.time,
        a = e.cruise(t);
      if (n >= t.until) {
        const r = t.mode,
          h =
            r === "hover"
              ? "dart"
              : r === "dart"
                ? Math.random() < i.cruising
                  ? "cruise"
                  : "hover"
                : Math.random() < 0.35
                  ? "dart"
                  : "hover";
        (t.mode = h),
          h === "dart"
            ? ((t.until = n + F(0.15, 0.45)),
              r === "cruise" &&
                (t.aim = t.heading + F(-0.4, 0.4) * (i.spread + 0.2)))
            : h === "cruise"
              ? ((t.until = n + F(1.2, 4.5)),
                (t.aim =
                  e.heading + t.bias * i.spread + F(-0.5, 0.5) * i.spread))
              : ((t.until =
                  n +
                  Math.min(
                    3,
                    Math.max(0.15, -Math.log(1 - Math.random()) * 0.7),
                  ) *
                    i.hover),
                (t.aim =
                  e.heading +
                  t.bias * i.spread * 0.5 +
                  F(-1, 1) * i.spread * 1.6));
      }
      const o = e.begin();
      t.mode === "dart"
        ? e.steer(t, t.aim, a * 4 * i.dart, 10)
        : t.mode === "cruise"
          ? ((t.aim += F(-1, 1) * s * 1.2),
            (t.aim +=
              (e.heading + t.bias * i.spread - t.aim) * Math.min(1, s * 0.8)),
            e.steer(t, t.aim, a * 1.8, 3))
          : (e.steer(t, e.heading, a * 0.25, 4 * i.grip),
            (o.x += Math.cos(n * 3 + t.id) * 40),
            (o.y += Math.sin(n * 4.3 + t.id * 2) * 40)),
        e.separate(t),
        e.move(t, s, a * 4.5 * i.dart),
        e.passed(t) && e.reenter(t),
        t.mode === "cruise"
          ? e.face(t, s, 4)
          : e.face(t, s, t.mode === "dart" ? 14 : 2.5, t.aim),
        (t.phase += s * B * 7 * i.wingbeat);
    },
    startle(t, e, s, i, n) {
      (t.mode = "dart"),
        (t.aim = n.heading + t.bias * n.tuning.spread),
        (t.until = n.time + 0.25 + 0.3 * i),
        (t.startledUntil = t.until);
    },
    draw: (t, e) => hn(t, e),
  };
function hn(t, e) {
  const s = t.span,
    i = {
      x: t.x,
      y: t.y,
      heading: t.heading,
      span: s,
      depth: t.depth,
      id: t.id,
    },
    n = e.ink,
    a = 0.86 + 0.14 * Math.cos(t.phase),
    o = 0.86 + 0.14 * Math.cos(t.phase + 1.7),
    r = e.cw * 0.38,
    h = Z(t.phase / B),
    l = Math.floor(e.t * 24);
  for (const c of [-1, 1])
    e.lineBody(i, 0.14, 0.03 * c, 0.2, 0.07 * c, Le),
      e.lineBody(i, 0.1, 0.03 * c, 0.12, 0.08 * c, Le);
  if (
    (e.shape(
      i,
      0.74,
      (c, d) => {
        const u = Math.abs(d),
          b = (c - 0.12) / 0.07,
          g = u / 0.046;
        if (b * b + g * g <= 1)
          return w(n, ...(Z((c + u) * 22) < 0.5 ? Zs : Qs), X, "#8");
        if (c < 0.06 && c > -0.74) {
          const p = Math.max(0.017 - 0.006 * ((0.06 - c) / 0.8), r / s);
          if (u <= p) {
            if (c < -0.66) return w(n, ...en, V);
            const k = Z(c * 20);
            return k < 0.1
              ? w(n, ...tn, X, "-")
              : k < 0.45
                ? w(n, ...Xe, X, "=")
                : w(n, ...js, X, ":=");
          }
        }
        for (const [p, k] of [
          [zs, a],
          [Ks, o],
        ]) {
          if (!Xs(p, c, u / k)) continue;
          const M = d >= 0 ? 1 : -1,
            y = ae(
              t.heading + Math.atan2(M * Math.cos(p.angle), Math.sin(p.angle)),
            ),
            f = ae(
              t.heading + Math.atan2(-M * Math.sin(p.angle), Math.cos(p.angle)),
            ),
            { s: m, x: E } = oe;
          if (m > 0.82 && m < 0.9 && E > 0.35) return w(n, ...an, X, "#");
          if (E > 0.72) return w(n, ...sn, pt, y);
          if (
            Math.abs(m - h) < 0.05 &&
            W(Math.round(c * 60), Math.round(d * 60), l) > 0.45
          )
            return w(n, ...on, pt, "*+");
          const x =
              Math.abs(E + 0.15) < 0.09 ||
              Math.abs(E - 0.35) < 0.07 ||
              E < -0.85 ||
              m > 0.97,
            v = Z(m * 9) < 0.09;
          return x
            ? w(n, ...Jt, pt, v ? "+" : y)
            : v
              ? w(n, ...Jt, pt, f)
              : m < 0.18
                ? w(n, ...nn, Dt, ".")
                : W(Math.round(c * 50), Math.round(d * 50), t.id) > 0.6 &&
                  w(n, ...Jt, pt, ".");
        }
        return !1;
      },
      { light: 0.92 + 0.08 * a },
    ),
    0.068 * s >= e.cw)
  )
    for (const c of [-1, 1])
      e.toWorld(i, 0.2, 0.034 * c, Vt),
        e.spot(Vt.x, Vt.y, "●", Js, Vs, t.depth);
  t.mode === "dart" && e.shed(t.x, t.y, 0.06 * t.depth);
}
const ln = {
    ...gt,
    fog: 0,
    size: 1.2,
    density: 1.3,
    sway: 0,
    spread: 0,
    farthest: 0.35,
    farBias: 1.4,
    separation: 450,
    trail: 3.45,
    trailFade: 0.4,
    shimmer: 0.15,
    sparkle: 0.05,
    hop: 1,
    leap: 0.45,
    height: 1,
  },
  Ut = [104, 184, 76],
  cn = [92, 164, 66],
  dn = [30, 70, 30],
  un = [190, 222, 130],
  pn = [206, 226, 150],
  gn = [36, 80, 32],
  mn = [240, 240, 228],
  fn = [16, 16, 12],
  yn = [20, 30, 16],
  Fe = [120, 190, 90],
  Mn = [
    [-0.16, 0.11],
    [0, 0.22],
    [-0.19, 0.25],
    [-0.04, 0.31],
  ],
  wn = [
    [-0.17, 0.09],
    [-0.38, 0.15],
    [-0.56, 0.13],
    [-0.68, 0.15],
  ],
  xn = [0.056, 0.04, 0.026],
  Te = [
    [0.06, 0.1],
    [0.09, 0.19],
    [0.18, 0.2],
  ],
  He = [
    [0.06, 0.1],
    [0.02, 0.16],
    [-0.06, 0.15],
  ],
  bn = [
    [0.08, 0.11],
    [0.16, 0.19],
    [0.27, 0.19],
  ],
  vn = [0.028, 0.022],
  Pe = [0.18, 0.1],
  Zt = (t, e, s) =>
    t.map(([i, n], a) => [nt(i, e[a][0], s), nt(n, e[a][1], s)]);
function Sn(t, e) {
  const s = 0.155 * Math.sqrt(Math.max(0, 1 - ((t + 0.1) / 0.18) ** 2));
  let i = 0.15 * e * Math.sqrt(Math.max(0, 1 - ((t - 0.12) / 0.18) ** 2));
  return t > 0.18 && (i *= 1 - 0.5 * ((t - 0.18) / 0.12) ** 2), Math.max(s, i);
}
function Oe(t, e, s, i) {
  for (let n = 0; n < t.length - 1; n++) {
    const [a, o] = t[n],
      [r, h] = t[n + 1];
    if (Ke(s, i, a, o, r, h) <= e[n] * (1 - 0.25 * Ot.t))
      return (Ot.t = (n + Ot.t) / (t.length - 1)), !0;
  }
  return !1;
}
const Ht = { x: 0, y: 0 },
  Re = 0.35,
  kn = [1, 0.8, 1.2, 0.65, 1.35],
  En = {
    key: "frogs",
    label: "Frog",
    swatch: [104, 184, 76],
    defaults: ln,
    hide: ["grip"],
    controls: [
      [
        "Leaping",
        [
          {
            key: "hop",
            label: "How often",
            min: 0.2,
            max: 4,
            step: 0.05,
            hint: "How often they leap.",
          },
          {
            key: "leap",
            label: "Leap length",
            min: 0.3,
            max: 2.5,
            step: 0.05,
            hint: "How far each leap goes.",
          },
          {
            key: "height",
            label: "Leap height",
            min: 0,
            max: 2.5,
            step: 0.05,
            hint: "How high each leap arcs: they draw bigger at the top and the shadow slides further away.",
          },
        ],
      ],
    ],
    area: 75e3,
    scale: 0.95,
    speed: 80,
    trail: { light: [80, 150, 170], dark: [110, 200, 220] },
    create: (t) => ({
      ...t,
      leaping: !1,
      until: 0,
      aim: 0,
      s: 0,
      dur: 0.5,
      fromX: 0,
      fromY: 0,
      toX: 0,
      toY: 0,
    }),
    enter(t, e) {
      (t.leaping = !1),
        (t.s = 0),
        (t.vx = 0),
        (t.vy = 0),
        (t.aim = e.heading + t.bias * e.tuning.spread),
        (t.heading = t.aim),
        (t.until = e.time + F(0, 1.5));
    },
    update(t, e, s) {
      const i = e.tuning,
        n = e.time;
      if (!t.leaping) {
        (t.vx = 0),
          (t.vy = 0),
          e.face(t, s, 2.5, t.aim),
          n >= t.until && Ce(t, e, t.aim, 1);
        return;
      }
      if (((t.s += s / t.dur), t.s >= 1)) {
        (t.leaping = !1),
          (t.x = t.toX),
          (t.y = t.toY),
          (t.vx = 0),
          (t.vy = 0),
          (t.until = n + F(0.5, 2.2) / (i.hop * i.speed)),
          (t.aim = e.heading + (t.bias + F(-0.7, 0.7)) * i.spread),
          e.events.push({
            x: t.x,
            y: t.y,
            radius: 2,
            amount: 0.7 * t.depth * i.trail,
          }),
          e.passed(t) && e.reenter(t);
        return;
      }
      (t.x = nt(t.fromX, t.toX, t.s)), (t.y = nt(t.fromY, t.toY, t.s));
    },
    startle(t, e, s, i, n) {
      t.leaping ||
        (Ce(t, n, Math.atan2(s, e), 1 + i, !1),
        (t.startledUntil = n.time + t.dur));
    },
    draw: (t, e, s) => In(t, e, s),
  };
function Ce(t, e, s, i, n = !0) {
  const a = e.tuning;
  n && (s = e.heading + R(dt(e.heading, s), -Re, Re));
  const o = Math.cos(s),
    r = Math.sin(s),
    h = t.span * F(2.4, 3.6) * a.leap * a.speed * i;
  let l = h;
  if (n && a.separation > 0) {
    let c = -1;
    for (const d of kn) {
      const u = t.x + o * h * d,
        b = t.y + r * h * d;
      let g = 1 / 0;
      for (const p of e.creatures) {
        if (p === t || Math.abs(p.depth - t.depth) > 0.2) continue;
        const k = p.leaping ? p.toX : p.x,
          M = p.leaping ? p.toY : p.y;
        g = Math.min(g, Math.hypot(u - k, b - M) / (t.span + p.span));
      }
      if ((g > c && ((c = g), (l = h * d)), g >= 0.6 * (a.separation / 300)))
        break;
    }
  }
  (t.leaping = !0),
    (t.s = 0),
    (t.dur = F(0.42, 0.55) * Math.sqrt(a.leap) * (i > 1 ? 0.8 : 1)),
    (t.heading = s),
    (t.fromX = t.x),
    (t.fromY = t.y),
    (t.toX = t.x + o * l),
    (t.toY = t.y + r * l),
    (t.vx = (t.toX - t.fromX) / t.dur),
    (t.vy = (t.toY - t.fromY) / t.dur);
}
function In(t, e, s) {
  const i = s.tuning,
    n = t.leaping ? t.s : 0,
    a = 4 * n * (1 - n) * i.height,
    o = t.span * (1 + 0.35 * a),
    r = {
      x: t.x,
      y: t.y,
      heading: t.heading,
      span: o,
      depth: t.depth,
      id: t.id,
    },
    h = e.ink,
    l = t.leaping ? ht(0, 0.16, n) * (1 - ht(0.72, 1, n)) : 0,
    c = Zt(Mn, wn, l),
    d = t.leaping
      ? n < 0.6
        ? Zt(Te, He, ht(0, 0.2, n))
        : Zt(He, bn, ht(0.6, 0.95, n))
      : Te,
    u = t.leaping ? 1 : 1 + 0.045 * Math.sin(e.t * 6 + t.id),
    b = !t.leaping && Z(e.t * 0.21 + t.id * 0.37) < 0.035;
  for (const g of [-1, 1]) {
    const p = (k, M, y, f, m) => {
      const E = Math.atan2(M[1] - k[1], M[0] - k[0]);
      for (let x = 0; x < y; x++) {
        const v = E + (x / (y - 1) - 0.5) * m;
        e.lineBody(
          r,
          M[0],
          M[1] * g,
          M[0] + Math.cos(v) * f,
          (M[1] + Math.sin(v) * f) * g,
          Fe,
        );
      }
    };
    p(c[2], c[3], 4, 0.075, 1.2), p(d[1], d[2], 3, 0.045, 1.1);
  }
  e.shape(
    r,
    0.9,
    (g, p) => {
      const k = Math.abs(p),
        M = Sn(g, u);
      if (k <= M && g > -0.29 && g < 0.3) {
        if (Math.abs(k - 0.11) < 0.012 && g > -0.22 && g < 0.14)
          return w(h, ...pn, X);
        if (g < 0.1) {
          if (ie(g, p, 0.085, 0.024, t.id)) return w(h, ...dn, V);
          if (ie(g, p, 0.085, 0.036, t.id)) return w(h, ...un, X);
        }
        const L = 0.9 + 0.2 * (1 - k / Math.max(M, 0.001));
        return w(h, Ut[0] * L, Ut[1] * L, Ut[2] * L, X);
      }
      const [y, f] = c[3],
        [m, E] = c[2],
        x = Math.atan2(f - E, y - m),
        v = Math.atan2(k - f, g - y) - x;
      return Math.hypot(g - y, k - f) < 0.06 &&
        Math.abs(Math.atan2(Math.sin(v), Math.cos(v))) < 0.5
        ? w(h, ...Fe, Dt, ".")
        : Oe(c, xn, g, k) || Oe(d, vn, g, k)
          ? Z(Ot.t * 4.5) < 0.3
            ? w(h, ...gn, V)
            : w(h, ...cn, X)
          : !1;
    },
    { light: 1 + 0.15 * a },
  );
  for (const g of [-1, 1])
    e.toWorld(r, Pe[0], Pe[1] * g, Ht),
      b
        ? e.spot(Ht.x, Ht.y, "-", yn, Ut, t.depth)
        : e.spot(Ht.x, Ht.y, "●", fn, mn, t.depth);
}
const An = {
    ...gt,
    speed: 1.05,
    sway: 0.04,
    spread: 0.08,
    farthest: 0.3,
    farBias: 1.4,
    grip: 1.4,
    trail: 0.8,
    trailFade: 0.6,
    sparkle: 0.1,
    pulseRate: 1,
    pulsePower: 1,
    pulseGlow: 1,
    tentacles: 1,
  },
  Ln = [255, 168, 230],
  Fn = [232, 56, 182],
  Qt = [255, 200, 240],
  Tn = [255, 214, 244],
  Hn = [255, 240, 250],
  Pn = [255, 214, 240],
  On = [204, 56, 172],
  Rn = [232, 100, 204],
  Cn = [255, 170, 226],
  Dn = 6e3,
  j = { x: 0, y: 0 },
  jt = { x: 0, y: 0 },
  $n = (t, e, s) => [
    t[0] + (e[0] - t[0]) * s,
    t[1] + (e[1] - t[1]) * s,
    t[2] + (e[2] - t[2]) * s,
  ],
  Nn = {
    key: "jellyfish",
    label: "Jellyfish",
    swatch: [232, 56, 182],
    defaults: An,
    hide: ["shimmer"],
    controls: [
      [
        "Swimming",
        [
          {
            key: "pulseRate",
            label: "Pulse rate",
            min: 0.2,
            max: 3,
            step: 0.05,
            hint: "How often the bell pulses.",
          },
          {
            key: "pulsePower",
            label: "Pulse power",
            min: 0.2,
            max: 3,
            step: 0.05,
            hint: "How far each pulse pushes it forward.",
          },
          {
            key: "pulseGlow",
            label: "Pulse glow",
            min: 0,
            max: 3,
            step: 0.05,
            hint: "How much the bell lights up on each pulse. 0 turns it off.",
          },
          {
            key: "tentacles",
            label: "Arm length",
            min: 0,
            max: 2.5,
            step: 0.05,
            hint: "Length of the frilly arms and the thin tentacles.",
          },
        ],
      ],
    ],
    area: 95e3,
    scale: 1.6,
    speed: 55,
    trail: { light: [200, 80, 170], dark: [255, 130, 214] },
    create: (t) => ({ ...t, phase: F(0, B), squeeze: 0, turn: 0 }),
    update(t, e, s) {
      const i = e.tuning;
      t.phase += s * B * 0.6 * i.pulseRate * (0.9 + 0.2 * t.roll);
      const n = Z(t.phase / B);
      t.squeeze = n < 0.22 ? ht(0, 0.22, n) : 1 - ht(0.22, 1, n);
      const a = e.heading + t.bias * i.spread,
        o = t.heading;
      (t.heading += R(dt(t.heading, a), -0.6 * i.grip * s, 0.6 * i.grip * s)),
        (t.turn += (dt(o, t.heading) / s - t.turn) * Math.min(1, s * 3));
      const r = e.cruise(t),
        h = e.begin(),
        l = n < 0.22 ? 6.2 * r * i.pulsePower : 0;
      (h.x += Math.cos(t.heading) * l - t.vx * 1.4),
        (h.y += Math.sin(t.heading) * l - t.vy * 1.4),
        e.separate(t, i.separation, 0.5),
        e.move(t, s, r * 3),
        e.passed(t, t.span * 1.4) && e.reenter(t);
    },
    startle(t, e, s, i, n) {
      t.phase = Math.floor(t.phase / B) * B + B;
      const a = 260 * i * t.depth;
      (t.vx += Math.cos(t.heading) * a),
        (t.vy += Math.sin(t.heading) * a),
        (t.startledUntil = n.time + 0.8);
    },
    drawAll(t, e) {
      _n(t, e);
      for (const s of t.creatures) Wn(s, e, t);
    },
  };
function Bn(t) {
  const e = Z(t.phase / B);
  return e < 0.16 ? ht(0, 0.16, e) : Math.exp(-(e - 0.16) * 4.5);
}
function Wn(t, e, s) {
  const i = s.tuning,
    n = t.span,
    a = t.squeeze,
    o = e.t,
    r = {
      x: t.x,
      y: t.y,
      heading: t.heading,
      span: n,
      depth: t.depth,
      id: t.id,
    },
    h = i.tentacles,
    l = e.fogFor(t.depth),
    c = 0.32 * (1 + 0.14 * a),
    d = 0.3 * (1 - 0.2 * a),
    u = -0.04,
    b = R(-t.turn * 0.5, -0.5, 0.5),
    g = Bn(t) * i.pulseGlow;
  for (let M = 0; M < 8; M++) {
    const y = (M / 7 - 0.5) * 2 * d * 0.6;
    let f = u - 0.02,
      m = y;
    const E = 14,
      x = 1.5 * h * (0.75 + 0.35 * W(t.id, M, 4));
    for (let v = 1; v <= E; v++) {
      const L = v / E,
        C = u - 0.02 - L * x * (1 - 0.12 * a),
        D =
          y * (1 - 0.3 * L) +
          0.04 * Math.sin(t.phase - L * 3.5 + M * 1.3) * L +
          b * L * L * 0.4;
      e.toWorld(r, f, m, j),
        e.toWorld(r, C, D, jt),
        e.line(
          j.x,
          j.y,
          jt.x,
          jt.y,
          Rn,
          t.depth,
          void 0,
          Math.min(0.95, l + 0.45 + 0.35 * L),
        ),
        (f = C),
        (m = D);
    }
  }
  for (let M = 0; M < 4; M++) {
    const y = (M / 3 - 0.5) * 0.11,
      f = 26,
      m = 1.05 * h * (0.8 + 0.3 * W(t.id, M, 7));
    for (let E = 1; E <= f; E++) {
      const x = E / f,
        v = u - x * m,
        L =
          y * (1 - 0.4 * x) +
          0.05 * Math.sin(t.phase * 0.9 - x * 4.5 + M * 1.7) * x +
          b * x * 0.25,
        C = 0.055 * (1 - 0.5 * x) * Math.cos(x * 9 + M * 1.3 + o * 0.6),
        D = Math.min(0.95, l + 0.3 * x);
      e.toWorld(r, v, L, j),
        e.dot(
          j.x,
          j.y,
          E % 3 ? ":" : "|",
          On,
          t.depth,
          Math.min(0.95, D + 0.15),
        );
      for (const N of [-1, 1])
        e.toWorld(r, v, L + C * N, j),
          e.dot(
            j.x,
            j.y,
            "{}~§"[(E + M + (N > 0 ? 1 : 0)) % 4],
            Pn,
            t.depth,
            D,
          );
    }
    e.toWorld(r, u - m, y, j), e.shed(j.x, j.y, 0.015 * t.depth);
  }
  const p = e.ink,
    k = 1.3 * (1 + 0.18 * g);
  e.shape(
    r,
    0.32 * k + 0.1,
    (M, y) =>
      Math.hypot((M - u) / (c * k), y / (d * k)) < 1 &&
      M > u - 0.08 &&
      w(p, ...Qt, pt, "."),
    { fog: R(l + 0.55 - 0.3 * g, 0, 0.95) },
  ),
    e.shape(
      r,
      0.42,
      (M, y) => {
        const f = (M - u) / c,
          m = y / d,
          E = f * f + m * m,
          x = u - 0.04 * m * m;
        if (E > 1 || M < x) {
          if (Math.abs(m) > 1 || M > x || M < x - 0.04) return !1;
          const N = 0.04 * Math.sin(Z((m + 1) * 5.5) * Math.PI);
          return M > x - N && w(p, ...Tn, X, "o");
        }
        const v = Math.sqrt(E);
        if (v > 0.88) return w(p, ...Qt, X, ":;");
        const L = Math.atan2(m, f);
        if (f > 0.3) {
          const N = Math.round(f * 11),
            J = Math.round(m * 13);
          if (Math.hypot(f * 11 - N, m * 13 - J) < 0.32 && W(N, J, t.id) > 0.45)
            return w(p, ...Hn, X, ".'");
        }
        if (v > 0.35 && Z((L / Math.PI) * 6) < 0.1) return w(p, ...Qt, X, "|");
        const C = 0.75 + 0.25 * Math.max(R(f, 0, 1), v * v),
          D = $n(Fn, Ln, R(f, 0, 1) * 0.8);
        return w(p, D[0] * C, D[1] * C, D[2] * C, X, " .");
      },
      { light: (0.92 + 0.18 * a) * (1 + 0.6 * g) },
    );
}
function _n(t, e) {
  const { width: s, height: i } = t,
    n = Math.round((s * i) / Dn),
    a = e.t;
  for (let o = 0; o < n; o++) {
    const r = 3 + 9 * W(o, 3, 1),
      h = W(o, 1, 1) * s + Math.sin(a * 0.25 + o) * 6,
      l = (((W(o, 2, 1) * i - a * r) % i) + i) % i,
      c = 0.5 + 0.5 * Math.sin(a * (0.8 + 1.6 * W(o, 4, 1)) + o),
      d = W(o, 5, 1) > 0.92;
    e.dot(
      h,
      l,
      d ? "*" : ".",
      Cn,
      1,
      Math.min(0.95, 0.35 + 0.5 * (1 - c) + (d ? 0 : 0.15)),
    );
  }
}
const q = 14,
  Un = {
    ...gt,
    fog: 0.64,
    density: 1.6,
    speed: 1.6,
    spread: 0,
    sway: 0,
    farthest: 0.33,
    farBias: 1.3,
    grip: 2.65,
    separation: 780,
    trail: 4,
    trailFade: 0.4,
    shimmer: 0.35,
    sparkle: 0.08,
    meander: 0.4,
    foodRange: 200,
    tailBeat: 1,
  },
  Gn = [244, 240, 230],
  te = [222, 66, 40],
  De = [34, 34, 40],
  qn = [238, 182, 64],
  ee = [236, 124, 44],
  Yn = [236, 226, 214],
  Ve = ["kohaku", "sanke", "showa", "ogon", "chagoi"];
function $e(t) {
  return t < 0.12
    ? 0.1 * Math.pow(Math.sin(((t / 0.12) * Math.PI) / 2), 0.6)
    : t < 0.35
      ? 0.1 + 0.016 * Math.sin(((t - 0.12) / 0.23) * (Math.PI / 2))
      : t < 0.82
        ? 0.116 - 0.088 * ht(0.35, 0.82, t)
        : 0.028 + ((t - 0.82) / 0.18) * 0.1;
}
function Ne(t, e, s) {
  return (
    Math.sin(t * 11 + s) * Math.cos(e * 22 + s * 1.3) +
    0.6 * Math.sin(t * 23 + e * 15 + s * 2.1) +
    0.35 * Math.sin(t * 5 - s * 0.7)
  );
}
const Je = 14,
  zn = [232, 178, 104],
  Kn = [14, 12, 16],
  Xn = [255, 252, 246],
  Be = new WeakMap(),
  Ct = (t) => {
    let e = Be.get(t);
    return e || Be.set(t, (e = [])), e;
  };
let Ze = 0;
function Vn(t, e, s) {
  let i = null,
    n = s;
  for (const a of Ct(e)) {
    const o = Math.hypot(a.x - t.x, a.y - t.y);
    o < n && ((n = o), (i = a));
  }
  return (Ze = i ? 1 - n / s : 0), i;
}
const Jn = {
  key: "koi",
  label: "Koi",
  swatch: [244, 196, 44],
  defaults: Un,
  controls: [
    [
      "Swimming",
      [
        {
          key: "meander",
          label: "Meander",
          min: 0,
          max: 3,
          step: 0.05,
          hint: "How much they weave in lazy S-curves.",
        },
        {
          key: "tailBeat",
          label: "Tail beat",
          min: 0.2,
          max: 3,
          step: 0.05,
          hint: "How fast and wide the tail swishes.",
        },
      ],
    ],
    [
      "Feeding",
      [
        {
          key: "foodRange",
          label: "Food range",
          min: 0,
          max: 500,
          step: 10,
          hint: "How close a koi has to be to notice food you drop. The closer it is, the harder it turns and the faster it swims over.",
        },
      ],
    ],
  ],
  area: 75e3,
  scale: 1.15,
  speed: 50,
  trail: { light: [90, 140, 190], dark: [110, 170, 220] },
  create: (t) => ({
    ...t,
    nodes: new Float32Array(q * 2),
    phase: F(0, B),
    variety: Math.floor(W(t.id, 7, 3) * Ve.length),
  }),
  enter(t) {
    const e = t.span / (q - 1);
    for (let s = 0; s < q; s++)
      (t.nodes[s * 2] = t.x - Math.cos(t.heading) * e * s),
        (t.nodes[s * 2 + 1] = t.y - Math.sin(t.heading) * e * s);
  },
  prepare(t, e) {
    const s = Ct(t);
    for (const n of s)
      (n.vx *= Math.exp(-e * 0.8)),
        (n.vy *= Math.exp(-e * 0.8)),
        (n.x += n.vx * e),
        (n.y += n.vy * e);
    const i = t.time;
    for (let n = s.length - 1; n >= 0; n--)
      i - s[n].born > Je && s.splice(n, 1);
  },
  tap(t, e, s) {
    const i = Ct(s),
      n = 7 + Math.floor(Math.random() * 5);
    for (let a = 0; a < n; a++) {
      const o = F(0, B),
        r = 70 * Math.sqrt(Math.random()),
        h = {
          x: t + Math.cos(o) * r,
          y: e + Math.sin(o) * r,
          vx: Math.cos(o) * F(4, 14),
          vy: Math.sin(o) * F(4, 14),
          born: s.time,
        };
      i.push(h), s.events.push({ x: h.x, y: h.y, radius: 1, amount: 0.5 });
    }
    i.length > 60 && i.splice(0, i.length - 60);
  },
  update(t, e, s) {
    const i = e.tuning,
      n = e.time,
      a = Vn(t, e, i.foodRange),
      o = a ? 0.25 + 0.75 * Ze : 0;
    let r = a
      ? Math.atan2(a.y - t.y, a.x - t.x)
      : e.heading +
        t.bias * i.spread +
        i.meander * 0.6 * Math.sin(n * 0.35 + t.id * 1.7);
    const h = e.begin();
    if ((e.separate(t, i.separation, 0.5), h.x || h.y)) {
      const g = e.cruise(t);
      r = Math.atan2(Math.sin(r) * g + h.y * 0.3, Math.cos(r) * g + h.x * 0.3);
    }
    const l = nt(0.9 * i.grip, 2.6, o) * s;
    t.heading += R(dt(t.heading, r), -l, l);
    const c = e.cruise(t) * nt(0.85 + 0.25 * Math.sin(n * 0.5 + t.id), 1.8, o);
    (t.vx = Math.cos(t.heading) * c),
      (t.vy = Math.sin(t.heading) * c),
      (t.x += t.vx * s),
      (t.y += t.vy * s),
      (t.phase += s * (2 + c / 25) * i.tailBeat);
    const d = t.nodes,
      u = t.span / (q - 1);
    (d[0] = t.x), (d[1] = t.y);
    let b = t.heading + Math.PI;
    for (let g = 1; g < q; g++) {
      let p = Math.atan2(d[g * 2 + 1] - d[g * 2 - 1], d[g * 2] - d[g * 2 - 2]);
      (p = b + R(dt(b, p), -0.22, 0.22)),
        (d[g * 2] = d[g * 2 - 2] + Math.cos(p) * u),
        (d[g * 2 + 1] = d[g * 2 - 1] + Math.sin(p) * u),
        (b = p);
    }
    if (a && Math.hypot(a.x - t.x, a.y - t.y) < t.span * 0.1 + 6) {
      const g = Ct(e);
      g.splice(g.indexOf(a), 1),
        e.events.push({ x: a.x, y: a.y, radius: 1, amount: 0.7 });
    }
    e.passed(t, t.span * 1.3) && e.reenter(t);
  },
  drawAll(t, e) {
    Zn(t, e);
    for (const s of t.creatures) Qn(s, e, t);
  },
};
function Zn(t, e) {
  const s = t.time;
  for (const i of Ct(t)) {
    const n = (s - i.born) / Je;
    e.dot(
      i.x,
      i.y,
      n < 0.7 ? "o" : ".",
      zn,
      1,
      Math.min(0.9, Math.max(0, n - 0.5) * 1.6),
    );
  }
}
function Qn(t, e, s) {
  const i = s.tuning,
    n = t.span,
    a = t.nodes,
    o = e.ink,
    r = Ve[t.variety],
    h = t.id * 1.37,
    l = e.theme === "light" ? [222, 217, 206] : Gn,
    c = e.theme === "light" ? [206, 196, 182] : Yn,
    d = new Float32Array(q * 2),
    u = new Float32Array(q);
  for (let y = 0; y < q; y++) {
    const f = y / (q - 1),
      m = Math.max(0, y - 1),
      E = Math.min(q - 1, y + 1);
    let x = a[m * 2] - a[E * 2],
      v = a[m * 2 + 1] - a[E * 2 + 1];
    const L = Math.hypot(x, v) || 1;
    (x /= L), (v /= L);
    const C =
      n *
      0.06 *
      Math.pow(f, 1.6) *
      Math.sin(t.phase - f * 4.5) *
      Math.min(1.5, i.tailBeat);
    (d[y * 2] = a[y * 2] - v * C),
      (d[y * 2 + 1] = a[y * 2 + 1] + x * C),
      y > 0 &&
        (u[y] =
          u[y - 1] +
          Math.hypot(d[y * 2] - d[y * 2 - 2], d[y * 2 + 1] - d[y * 2 - 1]));
  }
  const b = u[q - 1] || 1,
    g = (q / 2) | 0,
    p = {
      x: d[g * 2],
      y: d[g * 2 + 1],
      heading: t.heading,
      span: n,
      depth: t.depth,
      id: t.id,
    },
    k = 0.8 + 0.2 * Math.sin(t.phase * 0.7);
  e.shape(p, 0.72, (y, f, m, E) => {
    let x = 1 / 0,
      v = 0,
      L = 0,
      C = 0;
    for (let I = 0; I < q - 1; I++) {
      const T = d[I * 2],
        O = d[I * 2 + 1],
        H = d[I * 2 + 2] - T,
        P = d[I * 2 + 3] - O,
        z = H * H + P * P || 1,
        Q = ((m - T) * H + (E - O) * P) / z,
        at = R(Q, 0, 1),
        it = Math.sqrt(z);
      if (I === q - 2 && Q > 1) {
        const ot = Math.abs(H * (E - O) - P * (m - T)) / it;
        ot * ot < x &&
          ((x = ot * ot),
          (v = 1),
          (C = ((Q - 1) * it) / n),
          (L = (ot / n) * (H * (E - O) - P * (m - T) >= 0 ? 1 : -1)));
        continue;
      }
      const $ = (m - T - H * at) ** 2 + (E - O - P * at) ** 2;
      $ < x &&
        ((x = $),
        (v = (u[I] + at * it) / b),
        (L = (Math.sqrt($) / n) * (H * (E - O) - P * (m - T) >= 0 ? 1 : -1)),
        (C = 0));
    }
    const D = Math.abs(L),
      N = $e(v);
    if (((o.au = v), (o.av = L), C > 0)) return !1;
    const J =
        v > 0.17 &&
        v < 0.34 &&
        D < N + 0.1 * k * Math.sin(((v - 0.17) / 0.17) * Math.PI),
      A =
        v > 0.48 &&
        v < 0.6 &&
        D < N + 0.05 * Math.sin(((v - 0.48) / 0.12) * Math.PI);
    if (D > N) return (J || A) && w(o, ...c, Dt, "-=");
    if (v > 0.82)
      return v > 0.93 && D < ((v - 0.93) / 0.07) * 0.06
        ? !1
        : w(o, ...c, Dt, v > 0.9 ? "/\\" : "=");
    const _ = Ne(v, L, h) > 0.25,
      U = D / N;
    switch (r) {
      case "kohaku":
        return _ && v < 0.8 ? w(o, ...te) : w(o, ...l);
      case "sanke":
        return W(Math.round(v * 30), Math.round(L * 60), t.id) > 0.9 && v > 0.15
          ? w(o, ...De, V)
          : _ && v < 0.8
            ? w(o, ...te)
            : w(o, ...l);
      case "showa":
        return Ne(v, L, h + 4) > 0.55
          ? w(o, ...l)
          : _
            ? w(o, ...te)
            : w(o, ...De, V, "%#");
      case "ogon":
        return w(o, ...qn, wt);
      default:
        return w(o, ee[0] * (1 - 0.15 * U), ee[1] * (1 - 0.15 * U), ee[2], wt);
    }
  });
  const M = $e(0.09) * 0.55 * n;
  if (2 * M >= e.cw) {
    const y = 0.09 * b;
    let f = 0;
    for (; f < q - 2 && u[f + 1] < y; ) f++;
    const m = u[f + 1] - u[f] || 1,
      E = (y - u[f]) / m,
      x = (d[f * 2 + 2] - d[f * 2]) / m,
      v = (d[f * 2 + 3] - d[f * 2 + 1]) / m,
      L = d[f * 2] + x * E * m,
      C = d[f * 2 + 1] + v * E * m;
    for (const D of [-1, 1])
      e.spot(L - v * M * D, C + x * M * D, "●", Xn, Kn, t.depth);
  }
  e.shed(d[(q - 2) * 2], d[(q - 2) * 2 + 1], 0.02 * t.depth);
}
const ct = {
    butterflies: gs,
    koi: Jn,
    jellyfish: Nn,
    dragonflies: rn,
    frogs: En,
    cranes: Rs,
    crabs: vs,
  },
  jn = Object.keys(ct),
  Pt = 1 / 60,
  We = (t) => (typeof t == "string" ? ct[t] : t),
  _e = 4;
class ti {
  constructor(
    e,
    { animal: s = "butterflies", count: i, theme: n = "light", palette: pal, tuning: a } = {}, // patch (c): palette
  ) {
    S(this, "tuning");
    S(this, "animal");
    S(this, "flock");
    S(this, "renderer");
    S(this, "count");
    S(this, "raf", 0);
    S(this, "last", 0);
    S(this, "acc", 0);
    S(this, "visible", !0);
    S(this, "reducedMotion");
    S(this, "resizeObserver");
    S(this, "intersectionObserver");
    S(this, "disposed", !1);
    // patch (b): pause while the page is hidden
    S(this, "onVisibility", () => this.schedule());
    S(this, "frame", (e) => {
      // patch (a): host FPS limit (0 = unthrottled)
      if (this.fps && e - this.last < 1000 / this.fps - 2) {
        this.raf = requestAnimationFrame(this.frame);
        return;
      }
      const s = Math.min(0.1, (e - this.last) / 1e3);
      (this.last = e), (this.acc += s);
      let i = 0;
      for (; this.acc >= Pt && i < _e; )
        this.flock.step(Pt), (this.acc -= Pt), i++;
      i === _e && (this.acc = 0),
        this.renderer.render(this.flock, s),
        (this.raf = requestAnimationFrame(this.frame));
    });
    S(this, "onMotionPreference", () => {
      this.reducedMotion.matches
        ? (cancelAnimationFrame(this.raf), this.drawStill())
        : this.schedule();
    });
    S(this, "onPointerDown", (e) => {
      if (this.reducedMotion.matches || e.target !== this.canvas) return;
      const s = this.canvas.getBoundingClientRect();
      this.flock.startle(e.clientX - s.left, e.clientY - s.top);
    });
    var o;
    (this.canvas = e),
      (this.count = i),
      (this.animal = We(s)),
      (this.tuning = { ...this.animal.defaults, ...a }),
      (this.flock = new ge(this.animal, this.tuning, i)),
      (this.renderer = new qs(e, this.tuning)),
      this.renderer.setFontFamily(getComputedStyle(e).fontFamily),
      this.renderer.setAnimal(this.animal, this.tuning),
      this.renderer.setTheme(n, pal), // patch (c)
      (this.reducedMotion = window.matchMedia // patch (d)
        ? window.matchMedia("(prefers-reduced-motion: reduce)")
        : NO_MEDIA),
      (this.resizeObserver = new ResizeObs(() => this.resize())),
      this.resizeObserver.observe(e),
      (this.intersectionObserver = new IntersectionObs(([r]) => {
        (this.visible = r.isIntersecting), this.schedule();
      })),
      this.intersectionObserver.observe(e),
      this.reducedMotion.addEventListener("change", this.onMotionPreference),
      document.addEventListener("visibilitychange", this.onVisibility), // patch (b)
      window.addEventListener("pointerdown", this.onPointerDown, {
        passive: !0,
      }),
      this.resize(),
      (o = document.fonts) == null ||
        o.load(`600 16px ${getComputedStyle(e).fontFamily}`).then(() => {
          !this.disposed && this.reducedMotion.matches && this.drawStill();
        }),
      this.schedule();
  }
  destroy() {
    (this.disposed = !0),
      cancelAnimationFrame(this.raf),
      this.resizeObserver.disconnect(),
      this.intersectionObserver.disconnect(),
      this.reducedMotion.removeEventListener("change", this.onMotionPreference),
      document.removeEventListener("visibilitychange", this.onVisibility), // patch (b)
      window.removeEventListener("pointerdown", this.onPointerDown);
  }
  setAnimal(e, s) {
    (this.animal = We(e)),
      (this.tuning = { ...this.animal.defaults, ...s }),
      (this.flock = new ge(this.animal, this.tuning, this.count)),
      this.renderer.setAnimal(this.animal, this.tuning),
      this.resize();
  }
  set(e, s) {
    (this.tuning[e] = s),
      e === "detail"
        ? this.resize()
        : (e === "hueShift" || e === "grid") && this.renderer.restyle(),
      this.reducedMotion.matches && this.drawStill();
  }
  setTheme(e, p) {
    this.renderer.setTheme(e, p), this.reducedMotion.matches && this.drawStill(); // patch (c)
  }
  resize() {
    const e = this.canvas.getBoundingClientRect();
    if (e.width < 1 || e.height < 1) return;
    let s = Math.min(window.devicePixelRatio || 1, 2);
    // clamp so the canvas raster stays within Firefox's area + dimension limits
    s = Math.max(1, Math.min(s, Math.sqrt(FW_MAX_PIX / (e.width * e.height))));
    this.renderer.resize(e.width, e.height, s),
      this.flock.resize(e.width, e.height),
      this.reducedMotion.matches && this.drawStill();
  }
  schedule() {
    cancelAnimationFrame(this.raf),
      !(this.disposed || !this.visible || document.hidden || this.reducedMotion.matches) && // patch (b)
        ((this.last = performance.now()),
        (this.raf = requestAnimationFrame(this.frame)));
  }
  drawStill() {
    if (this.flock.time < 4) for (let e = 0; e < 240; e++) this.flock.step(Pt);
    this.renderer.render(this.flock, Pt);
  }
}

// ================= wrapper (not part of the carried-over code) =================

// ---------- support for the patches above ----------
// Stand-ins for APIs a host may lack (Wallpaper Engine's browser, node): no motion preference, window resize events, always visible.
const NO_MEDIA = { matches: false, addEventListener() {}, removeEventListener() {} };
const ResizeObs =
  typeof ResizeObserver === "function"
    ? ResizeObserver
    : class {
        constructor(cb) { this.cb = cb; }
        observe() { window.addEventListener("resize", this.cb); }
        disconnect() { window.removeEventListener("resize", this.cb); }
      };
const IntersectionObs =
  typeof IntersectionObserver === "function"
    ? IntersectionObserver
    : class {
        observe() {}
        disconnect() {}
      };
// A sparkle on a bare tile is white on a dark background and dark ink on a light one.
const LIGHT_SPARKLE = [[24, 28, 52], [40, 46, 78], [30, 48, 70]];
// Colour maths for the background tone (WCAG relative luminance).
const lin = (v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
const unlin = (v) => Math.round(255 * (v <= 0.0031308 ? v * 12.92 : 1.055 * Math.pow(v, 1 / 2.4) - 0.055));
const lumOf = (c) => 0.2126 * lin(c[0]) + 0.7152 * lin(c[1]) + 0.0722 * lin(c[2]);
const contrast = (a, b) => { const x = lumOf(a), y = lumOf(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
// On a light background the renderer darkens any colour brighter than this (a 0-1 luma, like the code that uses it) so
// that it keeps at least CAP_CONTRAST:1 against the background.
const CAP_CONTRAST = 2.5;
function capOf(bg) {
  const lc = (lumOf(bg) + 0.05) / CAP_CONTRAST - 0.05;
  return lc <= 0 ? 0 : Math.min(1, Math.pow(lc, 1 / 2.2));
}

// ---------- background tone ----------
// Background 0..1 mixes the original dark background toward white (linear in sRGB). At 0 the renderer gets the original
// dark palette object itself. Above 0 it gets the original light or dark palette (whichever has more contrast for its ink
// against the background) with the background colour replaced; the light one also switches on the renderer's colour cap.
// `light` and `adapt` are for host UI drawn over the canvas: `light` flips at luminance 0.179, where black and white
// contrast equally, and adapt(c) gives colour c (chosen for the original background) the same contrast on this background.
const WHITE = [255, 255, 255];
const BASE_BG = Ee.dark.background;
const BASE_LUM = lumOf(BASE_BG);
const mixRgb = (c, d, t) => c.map((v, i) => Math.round(v + (d[i] - v) * t));
const LOOKS = new Map();
function lookOf(tone) {
  let look = LOOKS.get(tone);
  if (look) return look;
  const rgb = mixRgb(BASE_BG, WHITE, tone), lum = lumOf(rgb), light = lum > 0.1791;
  const theme = tone === 0 ? "dark" : contrast(Ee.light.ink, rgb) > contrast(Ee.dark.ink, rgb) ? "light" : "dark";
  look = {
    tone, rgb, css: "rgb(" + rgb.join(",") + ")", light, lum, theme,
    palette: tone === 0 ? Ee.dark : Object.assign({}, Ee[theme], { background: rgb }),
    adapt: tone === 0 ? (c) => c : (c) => {
      const lc = lumOf(c), cd = Math.max(1, (lc + 0.05) / (BASE_LUM + 0.05));
      const t = light ? Math.max(0, (lum + 0.05) / cd - 0.05) : Math.min(1, cd * (lum + 0.05) - 0.05); // luminance with the same contrast
      return c.map((v) => { v = lin(v); return unlin(t > lc ? v + ((1 - v) * (t - lc)) / (1 - lc) : lc ? (v * t) / lc : 0); });
    },
  };
  LOOKS.set(tone, look);
  return look;
}

// ---------- settings ----------
// Settings: { animal, name, background, tuning: { <species>: { <key>: value } }, glass: { <key>: value } }.
// `tuning` holds only the values that differ from that species' defaults (like the original's storage); an absent key means
// "the species' default". The schema below is derived from the carried-over definitions (gt, ue, ct), in the order of the
// original panel: Movement, the species' own groups, Look; shared tweaks the species hides are left out.
const ANIMALS = Object.keys(ct);
const LABELS = Object.fromEntries(ANIMALS.map((id) => [id, ct[id].label]));
const ALIASES = { butterfly: "butterflies", dragonfly: "dragonflies", frog: "frogs", crane: "cranes", crab: "crabs", bird: "cranes" }; // ids of earlier versions
const TWEAKS = Object.fromEntries(
  ANIMALS.map((id) => {
    const sp = ct[id], hidden = new Set(sp.hide || []);
    const make = (group) => (c) => ({
      key: c.key, label: c.label, group, type: "toggle" in c ? "toggle" : "range",
      min: c.min, max: c.max, step: c.step, def: sp.defaults[c.key], hint: c.hint, disabledWhen: c.disabledWhen,
    });
    return [id, [
      ...ue.movement.filter((c) => !hidden.has(c.key)).map(make("Movement")),
      ...sp.controls.flatMap(([group, cs]) => cs.map(make(group))),
      ...ue.look.filter((c) => !hidden.has(c.key)).map(make("Look")),
    ]];
  }),
);
// The new tab's search panel (CSS and SVG only; the same for every species), with the original's defaults.
const GLASS = [
  ["blur", "Blur (px)", 0, 30, 0.5, 3.5], ["refraction", "Refraction", 0, 150, 1, 40], ["ripple", "Ripple", 0.001, 0.04, 0.001, 0.007],
  ["tint", "Tint", 0, 3, 0.05, 0], ["edge", "Edge", 0, 2, 0.05, 0.55], ["radius", "Corner radius", 0, 48, 1, 24], ["width", "Width", 320, 960, 10, 720],
].map(([key, label, min, max, step, def]) => ({ key, label, group: "Chat glass", type: "range", min, max, step, def }));
// Ours: the tone of the page behind the animals.
const BACKGROUND = { key: "background", label: "Background", group: "Look", type: "range", min: 0, max: 1, step: 0.01, def: 0 };
// which elements of the new tab page are shown (the animals and the search box are always there).
const UI = [
  ["avatar", "Avatar"],
  ["greeting", "Greeting"],
  ["mic", "Voice search button", "Shown only in browsers with speech recognition"],
  ["lens", "Image search button"],
].map(([key, label, hint]) => ({ key, label, group: "New tab", type: "toggle", def: true, hint }));
const DEFAULTS = Object.freeze({ animal: ANIMALS[0], name: "", background: 0, tuning: {}, glass: Object.fromEntries(GLASS.map((g) => [g.key, g.def])), ui: Object.fromEntries(UI.map((u) => [u.key, u.def])) });

const num = (v) => (v == null || typeof v === "boolean" || (typeof v === "string" && !v.trim()) ? NaN : Number(v));
const clampNum = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const snap = (v, t) => +(Math.round(v / t.step) * t.step).toFixed(4); // to the slider step
const toBool = (v, d) => {
  if (typeof v === "boolean") return v;
  if (typeof v === "number") return v !== 0;
  if (typeof v === "string") {
    if (/^(false|0|no|off)$/i.test(v)) return false;
    if (/^(true|1|yes|on)$/i.test(v)) return true;
  }
  return d;
};
// The clamped, step-snapped value of a tweak (a toggle: a boolean); `fallback` when the input is junk.
function valueOf(t, v, fallback) {
  if (t.type === "toggle") return toBool(v, fallback);
  const n = num(v);
  return Number.isFinite(n) ? snap(clampNum(n, t.min, t.max), t) : fallback;
}
const animalOf = (v) => {
  const id = String(v == null ? "" : v).trim().toLowerCase();
  return ct[id] ? id : ALIASES[id] || null;
};
// Any input shape (chrome.storage, a settings file, settings of an older version) -> a complete, valid settings object.
// Unknown keys are dropped. Older versions stored flat, relative tweak values (density, speed, hue ...): they do not map onto the
// per-species model and are discarded; the animal (old ids accepted), the name, the background and the glass values are kept.
function normalize(raw) {
  const r = raw && typeof raw === "object" ? raw : {};
  const tuning = {};
  for (const id of ANIMALS) {
    const src = r.tuning && typeof r.tuning === "object" && r.tuning[id];
    if (!src || typeof src !== "object") continue;
    const diff = {};
    for (const t of TWEAKS[id]) {
      if (!(t.key in src)) continue;
      const v = valueOf(t, src[t.key], t.def);
      if (v !== valueOf(t, t.def, t.def)) diff[t.key] = v;
    }
    if (Object.keys(diff).length) tuning[id] = diff;
  }
  const g = r.glass && typeof r.glass === "object" ? r.glass : {};
  const glass = {}, ui = {};
  for (const t of GLASS) glass[t.key] = valueOf(t, g[t.key] !== undefined ? g[t.key] : r[t.key], t.def); // flat keys: older versions
  const u = r.ui && typeof r.ui === "object" ? r.ui : {};
  for (const t of UI) ui[t.key] = valueOf(t, u[t.key], t.def);
  return {
    animal: animalOf(r.animal) || DEFAULTS.animal, // 'random' and unknown values -> the default
    name: String(r.name == null ? "" : r.name).trim().slice(0, 40),
    background: valueOf(BACKGROUND, r.background, BACKGROUND.def),
    tuning,
    glass,
    ui,
  };
}
// Preview in a plain browser: ?animal=koi&background=0.5&speed=1.4 (a string, URLSearchParams or object). Unlike stored settings,
// a tweak key here is an absolute value for the chosen animal; glass keys (blur, width ...) work too.
function fromQuery(query) {
  const q = query && typeof query === "object" && !(query instanceof URLSearchParams) ? query : Object.fromEntries(new URLSearchParams(query || ""));
  const animal = animalOf(q.animal) || DEFAULTS.animal, tune = {}, glass = {};
  for (const t of TWEAKS[animal]) if (q[t.key] !== undefined) tune[t.key] = q[t.key];
  for (const t of GLASS) if (q[t.key] !== undefined) glass[t.key] = q[t.key];
  const ui = {};
  for (const t of UI) if (q[t.key] !== undefined) ui[t.key] = q[t.key];
  return normalize({ animal, name: q.name, background: q.background, tuning: { [animal]: tune }, glass, ui });
}
// Wallpaper Engine has a shorter, species-independent set: density, speed, size, trail, grid and detail are multipliers of the
// selected species' original defaults (1 = the original look), hueshift is degrees. The result is clamped to the original range.
// (A species whose default is 0, like the crane's trail, stays at 0 under a multiplier.)
const WALLPAPER = [
  ["density", "density", "Density (x original)", 0.1, 3, 0.05, 1, true], ["speed", "speed", "Speed (x original)", 0.2, 3, 0.05, 1, true],
  ["size", "size", "Size (x original)", 0.4, 2.5, 0.05, 1, true], ["hueshift", "hueShift", "Hue shift (°)", -180, 180, 1, 0, false],
  ["trail", "trail", "Trail (x original)", 0, 3, 0.05, 1, true], ["grid", "grid", "Grid (x original)", 0, 3, 0.05, 1, true],
  ["detail", "detail", "ASCII detail (x original)", 0.5, 2, 0.05, 1, true],
].map(([prop, key, text, min, max, step, def, relative]) => ({ prop, key, text, min, max, step, def, relative }));
// props: Wallpaper Engine's properties as it sends them ({name: {value}}; plain values work too), all the ones seen so far: it sends
// only what changed, and a multiplier needs the current species. base: settings the rest comes from (e.g. fromQuery(...)).
function fromWallpaperProps(props, base) {
  const b = normalize(base), get = (k) => { const p = props && props[k]; return p && typeof p === "object" ? p.value : p; };
  const animal = animalOf(get("animal")) || b.animal, tune = Object.assign({}, b.tuning[animal]);
  for (const w of WALLPAPER) {
    const v = num(get(w.prop)), t = TWEAKS[animal].find((x) => x.key === w.key);
    if (Number.isFinite(v) && t) tune[w.key] = clampNum(w.relative ? v * t.def : v, t.min, t.max);
  }
  const background = get("background");
  return normalize({ animal, name: b.name, background: background === undefined ? b.background : background, tuning: Object.assign({}, b.tuning, { [animal]: tune }), glass: b.glass, ui: b.ui });
}
// The background of these settings (any shape normalize accepts): { rgb, css, light, lum, theme, palette, adapt(rgb) }.
const backgroundOf = (settings) => lookOf(normalize(settings).background);

// ---------- start ----------
// start(canvas, settings) -> { update(partial), setFps(n), destroy() }. The canvas is sized by CSS and its font-family is the glyph
// font. update() takes any subset of the settings (top-level keys replace; undefined removes), as chrome.storage change events give.
function start(canvas, settings) {
  const raw = {};
  const merge = (p) => { for (const k in p) if (p[k] === undefined) delete raw[k]; else raw[k] = p[k]; };
  merge(settings);
  let s = normalize(raw), look = lookOf(s.background), animal = s.animal;
  const app = new ti(canvas, { animal, theme: look.theme, palette: look.palette, tuning: s.tuning[animal] });
  return {
    update(partial) {
      merge(partial);
      s = normalize(raw);
      const tune = s.tuning[s.animal] || {};
      if (s.animal !== animal) { animal = s.animal; app.setAnimal(animal, tune); }
      else for (const t of TWEAKS[animal]) { const v = t.key in tune ? tune[t.key] : t.def; if (app.tuning[t.key] !== v) app.set(t.key, v); } // back to the default counts too
      const next = lookOf(s.background);
      if (next !== look) { look = next; app.setTheme(look.theme, look.palette); }
    },
    setFps(n) { app.fps = n > 0 ? n : 0; }, // 0 / undefined = unthrottled
    destroy() { app.destroy(); },
    app, // for tests
  };
}

const api = {
  ANIMALS, LABELS, TWEAKS, GLASS, BACKGROUND, UI, DEFAULTS, WALLPAPER, normalize, fromQuery, fromWallpaperProps, backgroundOf, lookOf, contrast, lumOf, start,
  internals: { Flock: ge, Renderer: qs, App: ti, species: ct, palettes: Ee, capOf, CAP_CONTRAST }, // for tests
};
if (typeof module !== "undefined" && module.exports) module.exports = api;
else globalThis.AsciiAnimals = api;

})();
