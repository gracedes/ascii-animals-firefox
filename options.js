(function () {
  'use strict';
  const A = AsciiAnimals;
  const $ = (id) => document.getElementById(id);
  const sync = typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync ? chrome.storage.sync : null;
  // Shown next to a label where the effect is not the original's exactly (see README).
  const NOTES = { refraction: 'approx.', ripple: 'approx.' };
  const decimals = (t) => (String(t.step).split('.')[1] || '').length;
  const fmt = (t, v) => Number(v).toFixed(decimals(t));
  const KEYS = ['animal', 'name', 'background', 'tuning', 'glass', 'ui']; // what is stored; any other key in storage is from an older version

  // One labelled control per tweak; each <label for> is bound to its input.
  function control(t, prefix) {
    const row = document.createElement('div'), label = document.createElement('label'), input = document.createElement('input');
    row.className = 'tw' + (t.type === 'toggle' ? ' check' : '');
    if (t.hint) row.title = t.hint;
    input.id = prefix + t.key;
    label.htmlFor = input.id;
    label.textContent = t.label + (NOTES[t.key] ? ' (' + NOTES[t.key] + ')' : '');
    if (t.type === 'toggle') {
      input.type = 'checkbox';
      row.append(input, label);
    } else {
      Object.assign(input, { type: 'range', min: t.min, max: t.max, step: t.step });
      const out = document.createElement('output');
      out.id = input.id + '-out'; out.htmlFor = input.id;
      input.addEventListener('input', () => { out.textContent = fmt(t, input.value); });
      row.append(label, out, input);
    }
    return row;
  }
  // Fieldsets by group heading, in the given order.
  function groups(host, list, prefix, legend) {
    let group = null;
    for (const t of list) {
      if (!group || group.dataset.name !== t.group) {
        group = document.createElement('fieldset');
        group.dataset.name = t.group;
        const h = document.createElement('legend');
        h.textContent = legend ? legend(t.group) : t.group;
        group.append(h);
        host.append(group);
      }
      group.append(control(t, prefix));
    }
  }

  // The animal's own tweaks (Movement, its groups, Look) are rebuilt when the animal changes; Background and Chat glass are the same for all.
  let shown = null; // the animal whose tweaks are on screen
  function build(animal) {
    shown = animal;
    $('tweaks').textContent = '';
    groups($('tweaks'), A.TWEAKS[animal], 't-');
  }
  groups($('display'), A.UI, 'u-', () => 'Display');
  groups($('extras'), [A.BACKGROUND], 't-', () => 'Background');
  groups($('extras'), A.GLASS, 'g-', (g) => g + ' (new tab search panel)');
  for (const id of A.ANIMALS) $('animal').append(new Option(A.LABELS[id], id));

  const setValue = (t, el, v) => {
    if (t.type === 'toggle') el.checked = v;
    else { el.value = v; $(el.id + '-out').textContent = fmt(t, v); }
  };
  const getValue = (t, el) => (t.type === 'toggle' ? el.checked : el.value);
  const updateDisabled = () => { // e.g. Corner to corner sets the direction itself
    for (const t of A.TWEAKS[shown]) if (t.disabledWhen) $('t-' + t.key).disabled = $('t-' + t.disabledWhen).checked;
  };
  function fill(s) {
    $('animal').value = s.animal;
    $('name').value = s.name;
    if (shown !== s.animal) build(s.animal);
    const own = s.tuning[s.animal] || {};
    for (const t of A.TWEAKS[shown]) setValue(t, $('t-' + t.key), t.key in own ? own[t.key] : t.def);
    setValue(A.BACKGROUND, $('t-background'), s.background);
    for (const t of A.GLASS) setValue(t, $('g-' + t.key), s.glass[t.key]);
    for (const t of A.UI) setValue(t, $('u-' + t.key), s.ui[t.key]);
    updateDisabled();
  }
  let cur = A.normalize(); // the settings as last read or loaded: the other animals' tweaks are kept in it
  function read() { // the form as settings
    const own = {}, glass = {}, ui = {};
    for (const t of A.TWEAKS[shown]) own[t.key] = getValue(t, $('t-' + t.key));
    for (const t of A.GLASS) glass[t.key] = $('g-' + t.key).value;
    for (const t of A.UI) ui[t.key] = $('u-' + t.key).checked;
    return A.normalize({ animal: $('animal').value, name: $('name').value, background: $('t-background').value, tuning: Object.assign({}, cur.tuning, { [shown]: own }), glass, ui });
  }

  const say = (text) => { $('status').textContent = text; };
  // Debounced so sweeping a slider (mouse or arrow keys) is one write, not dozens (chrome.storage.sync allows ~120 writes/minute);
  // flushed when the page is hidden or closed so a value changed just before closing is still saved. A select or a checkbox
  // saves at once. A failed write is retried once, 2 s later, with whatever the form holds by then.
  let timer = 0, retry = 0, legacy = [];
  function save(isRetry) {
    clearTimeout(timer); timer = 0;
    clearTimeout(retry); retry = 0;
    const s = cur = read();
    updateDisabled();
    if (!sync) { say('Not running as an extension: nothing saved.'); return; }
    sync.set(s, () => {
      if (chrome.runtime.lastError) {
        say('Could not save: ' + chrome.runtime.lastError.message);
        if (isRetry !== true) retry = setTimeout(() => save(true), 2000);
        return;
      }
      if (legacy.length) { sync.remove(legacy); legacy = []; } // the flat keys of older versions, replaced by the per-animal tweaks
      say('Saved.');
    });
  }
  const later = () => { clearTimeout(timer); timer = setTimeout(save, 400); };
  const immediate = (el) => el.tagName === 'SELECT' || el.type === 'checkbox';
  // Sliders and the name box: every input and change event goes through the same debounce (a toolbar popup is destroyed
  // as soon as it loses focus, which is what the flush below is for).
  const onEdit = (e) => { if (!immediate(e.target)) later(); else if (e.type === 'change') save(); };
  // The animal's own handler runs before the form's: the old animal's tweaks are read into `cur`, then the new animal's are shown.
  $('animal').addEventListener('change', () => { cur = read(); fill(cur); });
  $('f').addEventListener('input', onEdit);
  $('f').addEventListener('change', onEdit);
  const flush = () => { if (timer || retry) save(); };
  window.addEventListener('pagehide', flush);
  document.addEventListener('visibilitychange', () => { if (document.hidden) flush(); });
  $('f').addEventListener('submit', (e) => e.preventDefault());

  // Reset puts the selected animal's tweaks, the background and the glass back to their defaults; the animal, the name and the
  // other animals' tweaks stay.
  $('reset').addEventListener('click', () => {
    const s = read(), tuning = Object.assign({}, s.tuning);
    delete tuning[s.animal];
    fill(cur = A.normalize({ animal: s.animal, name: s.name, tuning }));
    save();
  });
  $('copy').addEventListener('click', () => {
    const text = JSON.stringify(read(), null, 2);
    const done = () => say('Settings copied.');
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, () => say('Could not copy.'));
    else say('Could not copy.');
  });

  $('clear-history').addEventListener('click', () => {
    const local = typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local ? chrome.storage.local : null;
    if (!local) { say('Not running as an extension: nothing to clear.'); return; }
    local.remove('recents', () => { say(chrome.runtime.lastError ? 'Could not clear: ' + chrome.runtime.lastError.message : 'Search history cleared.'); });
  });

  if (sync) sync.get(null, (saved) => { saved = saved || {}; legacy = Object.keys(saved).filter((k) => !KEYS.includes(k)); fill(cur = A.normalize(saved)); });
  else fill(cur = A.fromQuery(location.search)); // preview: ?animal=koi&background=0.5&speed=1.4
})();
