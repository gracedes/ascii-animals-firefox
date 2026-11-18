(function () {
  'use strict';
  // chrome.* is absent when previewed from disk or a plain server (and partially present on file:// pages): guard each API.
  const hasChrome = typeof chrome !== 'undefined';
  const store = hasChrome && chrome.storage && chrome.storage.sync ? chrome.storage : null;
  const $ = (id) => document.getElementById(id);

  function greeting(hour, name) {
    const base = hour >= 5 && hour <= 11 ? 'Good morning' : hour >= 12 && hour <= 17 ? 'Good afternoon' : hour >= 18 && hour <= 22 ? 'Good evening' : 'Still up';
    return base + (name ? ', ' + name : '') + (hour >= 23 || hour <= 4 ? '?' : '');
  }

  // Returns an http(s) URL if the text looks like one, else null (-> web search). Bare "node.js" or "index.html"
  // must search, so a bare host needs a well-known TLD; localhost and IPv4 are always URLs.
  function asUrl(text) {
    if (/\s/.test(text)) return null;
    const tail = '(:\\d+)?([/?#]\\S*)?$';
    const tlds = 'com|org|net|io|dev|app|ai|co|me|edu|gov|tr|uk|de|fr|nl|ru|jp|us|info|xyz|tv|gg';
    let url = null;
    if (/^https?:\/\//i.test(text)) url = text;
    else if (new RegExp('^(localhost|(\\d{1,3}\\.){3}\\d{1,3})' + tail, 'i').test(text)) url = 'http://' + text;
    else if (new RegExp('^([a-z0-9-]+\\.)+(' + tlds + ')' + tail, 'i').test(text)) url = 'https://' + text;
    try { return url && /^https?:$/.test(new URL(url).protocol) ? url : null; } catch (e) { return null; }
  }

  // ---------- pure search helpers (tested in node) ----------
  const MAX_RECENTS = 50, MAX_ITEMS = 8;
  // Newest first, one entry per text ignoring case, capped.
  function addRecent(list, text) {
    text = String(text || '').trim();
    if (!text) return (list || []).slice();
    const low = text.toLowerCase();
    return [text, ...(list || []).filter((t) => t.toLowerCase() !== low)].slice(0, MAX_RECENTS);
  }
  const removeRecent = (list, text) => (list || []).filter((t) => t.toLowerCase() !== String(text).toLowerCase());
  // Google's suggest endpoint answers [query, [suggestions...], ...]; anything unexpected gives no suggestions.
  function parseSuggest(json) {
    if (!Array.isArray(json) || !Array.isArray(json[1])) return [];
    return json[1].filter((s) => typeof s === 'string' && s.trim()).slice(0, MAX_ITEMS);
  }
  // An http(s) URL whose path ends in an image extension.
  function isImageUrl(text) {
    if (/\s/.test(text)) return false;
    try { const u = new URL(text); return /^https?:$/.test(u.protocol) && /\.(png|jpe?g|webp|gif)$/i.test(u.pathname); } catch (e) { return false; }
  }
  // Lens: an image URL is searched directly; otherwise Google's image-upload dialog (?olud; lens.google.com/
  // itself redirects to a product page).
  function lensUrl(text) {
    text = String(text || '').trim();
    return isImageUrl(text) ? 'https://lens.google.com/uploadbyurl?url=' + encodeURIComponent(text) : 'https://www.google.com/?olud';
  }
  // Dropdown items: recents containing the query first, then suggestions not already listed; at most 8.
  function mergeItems(recents, suggestions, query) {
    const q = String(query || '').trim().toLowerCase(), seen = new Set(), out = [];
    for (const t of recents || []) if (!q || t.toLowerCase().includes(q)) { seen.add(t.toLowerCase()); out.push({ text: t, recent: true }); }
    for (const t of suggestions || []) if (!seen.has(t.toLowerCase())) { seen.add(t.toLowerCase()); out.push({ text: t, recent: false }); }
    return out.slice(0, MAX_ITEMS);
  }
  // Only something that looks like a search goes to the suggest endpoint: not a URL, not a long paste.
  const canSuggest = (q) => q.length > 0 && q.length <= 100 && !asUrl(q);
  // The suggestions that still contain the (changed) text; the rest of the old list is stale.
  function narrow(list, q) {
    q = String(q || '').trim().toLowerCase();
    return q ? (list || []).filter((t) => t.toLowerCase().includes(q)) : [];
  }
  // The UI colours over the canvas for a background (AsciiAnimals.backgroundOf): the default dark-theme colours of style.css
  // pass through look.adapt, which keeps their contrast on the new background (so they are unchanged at Background 0, and
  // at least 4.5:1 at every tone for the text ones). The glass panel is dark on a dark background and light on a light one.
  const UI = { fg: '#f2f3f7', strong: '#ffffff', opt: '#d6d7de', dim: '#9a9aa5', mute: '#7d7f8a', hover: '#c9cbd3', ring: '#8f939e', listen: '#ff8a8a', disc1: '#8d8c90', disc2: '#57565b' };
  function uiVars(look) {
    const v = { '--page': look.css, '--ink': look.light ? '0,0,0' : '255,255,255', '--shadow': look.light ? '#fff' : '#000',
      '--panel': look.light ? 'rgba(255,255,255,0.6)' : 'rgba(11,11,17,0.6)', '--sugg': look.light ? 'rgba(255,255,255,0.88)' : 'rgba(11,11,17,0.88)' };
    for (const k in UI) v['--' + k] = 'rgb(' + look.adapt([1, 3, 5].map((i) => parseInt(UI[k].slice(i, i + 2), 16))).join(',') + ')';
    return v;
  }
  if (typeof module !== 'undefined' && module.exports) { // for test.js
    module.exports = { uiVars, asUrl, greeting, addRecent, removeRecent, parseSuggest, isImageUrl, lensUrl, mergeItems, canSuggest, narrow };
    return;
  }

  // ---------- greeting ----------
  let name = '';
  const render = () => { $('greeting').textContent = greeting(new Date().getHours(), name); };
  const setName = (n) => { name = AsciiAnimals.normalize({ name: n }).name; render(); };

  // ---------- chat glass (the search panel) ----------
  function applyGlass(s) { // s = the settings' glass object (all seven values)
    const st = $('search').style;
    st.setProperty('--glass-blur', s.blur + 'px');
    st.setProperty('--glass-tint', String(Math.min(1, s.tint / 3)));
    st.setProperty('--glass-edge', String(s.edge));
    st.setProperty('--glass-radius', s.radius + 'px');
    st.setProperty('--glass-width', s.width + 'px');
    $('glass-map').setAttribute('scale', String(s.refraction));
    $('glass-noise').setAttribute('baseFrequency', String(s.ripple));
  }

  // Background tone: page colour, text, panel and disc colours as custom properties on <html> (no dark flash behind the canvas).
  function applyLook(s) {
    const look = AsciiAnimals.backgroundOf(s), v = uiVars(look), root = document.documentElement;
    for (const k in v) root.style.setProperty(k, v[k]);
    root.style.colorScheme = look.light ? 'light' : 'dark';
    document.body.classList.toggle('light', look.light);
  }

  // ---------- search ----------
  const input = $('q'), list = $('sugg'), msg = $('msg');
  const local = hasChrome && chrome.storage && chrome.storage.local ? chrome.storage.local : null;
  let recents = []; // a copy of the stored list (the only copy without chrome.storage)
  const valid = (r) => (Array.isArray(r) ? r.filter((t) => typeof t === 'string') : []);
  if (local) local.get('recents', (r) => { recents = valid(r && r.recents); });
  // Read-modify-write against storage, so another open tab or "Clear search history" is not overwritten;
  // done() runs after the write lands (navigating can tear the page down before it does).
  function editRecents(fn, done) {
    if (!local) { recents = fn(recents); done(); return; }
    local.get('recents', (r) => { recents = fn(valid(r && r.recents)); local.set({ recents }, () => done()); });
  }
  function go(text) {
    text = String(text || '').trim();
    if (!text) return;
    close();
    const url = asUrl(text), open = () => {
      if (url) location.href = url;
      else if (hasChrome && chrome.search && chrome.search.query) chrome.search.query({ text, disposition: 'CURRENT_TAB' }); // the user's default engine
      else location.href = 'https://www.google.com/search?q=' + encodeURIComponent(text);
    };
    if (url) open(); // an address is not a search: it stays out of the recent searches
    else editRecents((list) => addRecent(list, text), open);
  }

  // Dropdown (ARIA combobox with a listbox popup).
  let items = [], active = -1, suggestions = [], timer = 0, ctrl = null;
  const CLOCK = '<svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/></svg>';
  const MAG = '<svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4-4"/></svg>';
  const X = '<svg viewBox="0 0 24 24" width="12" height="12" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>';
  function show() {
    const keep = active >= 0 && items[active] ? items[active].text : null; // a refreshed list keeps the highlighted entry if it is still there
    items = mergeItems(recents, input.value.trim() ? suggestions : [], input.value);
    active = keep === null ? -1 : items.findIndex((it) => it.text === keep);
    list.textContent = '';
    items.forEach((it, i) => {
      const li = document.createElement('li');
      li.id = 'opt-' + i; li.setAttribute('role', 'option'); li.setAttribute('aria-selected', String(i === active));
      li.className = 'opt' + (it.recent ? ' recent' : '');
      li.dataset.i = i;
      const icon = document.createElement('span');
      icon.className = 'ico'; icon.innerHTML = it.recent ? CLOCK : MAG; // static icon markup only
      const label = document.createElement('span');
      label.className = 'txt'; label.textContent = it.text; // remote text: textContent, never innerHTML
      li.append(icon, label);
      if (it.recent) {
        const rm = document.createElement('button');
        rm.type = 'button'; rm.className = 'rm'; rm.tabIndex = -1; rm.dataset.rm = it.text;
        rm.setAttribute('aria-label', 'Remove ' + it.text); rm.innerHTML = X;
        li.append(rm);
      }
      list.append(li);
    });
    const open = items.length > 0 && document.activeElement === input;
    list.hidden = !open;
    input.setAttribute('aria-expanded', String(open));
    if (active >= 0 && open) input.setAttribute('aria-activedescendant', 'opt-' + active); else input.removeAttribute('aria-activedescendant');
  }
  function close() { active = -1; items = []; list.hidden = true; list.textContent = ''; input.setAttribute('aria-expanded', 'false'); input.removeAttribute('aria-activedescendant'); }
  function highlight(i) {
    active = i;
    for (const li of list.children) li.setAttribute('aria-selected', String(+li.dataset.i === i));
    if (i >= 0) { input.setAttribute('aria-activedescendant', 'opt-' + i); list.children[i].scrollIntoView({ block: 'nearest' }); } else input.removeAttribute('aria-activedescendant');
  }

  // Suggestions: debounced, stale requests aborted, silent on any failure (offline, blocked, CORS outside the extension).
  function fetchSuggestions() {
    clearTimeout(timer);
    if (ctrl) { ctrl.abort(); ctrl = null; }
    const q = input.value.trim();
    if (!canSuggest(q)) { suggestions = []; show(); return; }
    timer = setTimeout(() => {
      if (typeof fetch !== 'function' || typeof AbortController !== 'function') return;
      const c = (ctrl = new AbortController());
      fetch('https://suggestqueries.google.com/complete/search?client=chrome&q=' + encodeURIComponent(q), { signal: c.signal, credentials: 'omit' })
        .then((r) => (r.ok ? r.json() : null))
        .then((json) => { if (c === ctrl && input.value.trim() === q) { suggestions = parseSuggest(json); show(); } })
        .catch(() => { if (c === ctrl) { suggestions = []; show(); } }); // a failed request leaves no stale suggestions behind
    }, 150);
  }

  input.addEventListener('input', () => { active = -1; suggestions = narrow(suggestions, input.value); show(); fetchSuggestions(); msg.textContent = ''; });
  input.addEventListener('click', show); // the list opens on a user action (click, ArrowDown, typing), not on the page's own autofocus
  input.addEventListener('blur', () => setTimeout(() => { if (document.activeElement !== input) close(); }, 0));
  input.addEventListener('keydown', (e) => {
    if (e.isComposing || e.keyCode === 229) return; // an IME is composing: its Enter, arrows and Escape are not ours
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      if (list.hidden) { show(); if (list.hidden) return; }
      e.preventDefault();
      const n = items.length, d = e.key === 'ArrowDown' ? 1 : -1;
      highlight(active + d < -1 ? n - 1 : active + d >= n ? -1 : active + d); // -1 = back to the typed text
    } else if (e.key === 'Escape') {
      if (!list.hidden) { e.preventDefault(); close(); }
    } else if (e.key === 'Delete' && !list.hidden && active >= 0 && items[active] && items[active].recent) { // (Shift+)Delete on a highlighted recent search removes it, like its x button
      e.preventDefault();
      const text = items[active].text;
      editRecents((l) => removeRecent(l, text), () => { active = -1; show(); });
    }
  });
  $('search').addEventListener('submit', (e) => {
    e.preventDefault();
    go(active >= 0 && items[active] ? items[active].text : input.value);
  });
  // Keep focus in the input while using the list (so it does not close before the click lands).
  list.addEventListener('pointerdown', (e) => e.preventDefault());
  list.addEventListener('click', (e) => {
    const rm = e.target.closest('[data-rm]');
    if (rm) {
      const text = rm.dataset.rm;
      editRecents((l) => removeRecent(l, text), () => { active = -1; show(); });
      return;
    }
    const li = e.target.closest('[role=option]');
    if (li && items[+li.dataset.i]) go(items[+li.dataset.i].text);
  });

  // Voice search (webkitSpeechRecognition): interim words go into the box, the final result is searched.
  const SR = typeof window.webkitSpeechRecognition === 'function' ? window.webkitSpeechRecognition : window.SpeechRecognition;
  const voiceOk = typeof SR === 'function';
  const mic = $('mic');
  if (voiceOk) {
    let rec = null;
    const setListening = (on) => { mic.classList.toggle('listening', on); mic.setAttribute('aria-pressed', String(on)); if (on) msg.textContent = 'Listening...'; else if (msg.textContent === 'Listening...') msg.textContent = ''; };
    mic.addEventListener('click', () => {
      if (rec) { rec.stop(); return; }
      rec = new SR();
      rec.lang = navigator.language || 'en-US'; rec.interimResults = true; rec.maxAlternatives = 1;
      rec.onresult = (ev) => {
        let text = '', final = false;
        for (let i = 0; i < ev.results.length; i++) { text += ev.results[i][0].transcript; final = final || ev.results[i].isFinal; }
        input.value = text;
        if (final) { rec.stop(); go(text); }
      };
      rec.onerror = (ev) => {
        msg.textContent = ev.error === 'not-allowed' || ev.error === 'service-not-allowed' ? 'Microphone access was denied.' : ev.error === 'no-speech' ? 'No speech heard.' : 'Voice search is unavailable.';
      };
      rec.onend = () => { rec = null; setListening(false); };
      try { rec.start(); setListening(true); } catch (err) { rec = null; msg.textContent = 'Voice search is unavailable.'; }
    });
  }

  // Search by image: Lens by URL for an image link in the box, otherwise Google's upload dialog.
  $('lens').addEventListener('click', () => { location.href = lensUrl(input.value); });

  // ---------- settings and the animals ----------
  const avatarEl = document.querySelector('.avatar'), toolsRow = document.querySelector('.row.tools');
  // Which page elements show (all on by default). The tools row disappears when both its
  // buttons are hidden.
  function applyUi(s) {
    const u = s.ui || AsciiAnimals.normalize().ui;
    avatarEl.hidden = !u.avatar;
    $('greeting').hidden = !u.greeting;
    mic.hidden = !voiceOk || !u.mic;
    $('lens').hidden = !u.lens;
    toolsRow.hidden = mic.hidden && $('lens').hidden;
  }
  let engine = null;
  function boot(saved) {
    saved = saved || {};
    setName(saved.name);
    applyGlass(AsciiAnimals.normalize(saved).glass);
    applyLook(saved);
    applyUi(saved);
    engine = AsciiAnimals.start($('bg'), saved);
  }
  if (store) {
    let all = {};
    store.sync.get(null, (saved) => { all = saved || {}; boot(all); });
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area === 'local' && changes.recents) { // another tab searched, or the history was cleared in the settings
        recents = valid(changes.recents.newValue);
        if (!list.hidden) { active = -1; show(); }
        return;
      }
      if (area !== 'sync' || !engine) return;
      const s = {};
      for (const k in changes) s[k] = changes[k].newValue;
      Object.assign(all, s);
      if ('name' in s) setName(s.name);
      if ('ui' in s) applyUi(all);
      applyGlass(AsciiAnimals.normalize(all).glass);
      applyLook(all);
      engine.update(s);
    });
  } else boot(AsciiAnimals.fromQuery(location.search)); // preview: ?animal=koi&background=0.5&speed=1.4 works here too
  setInterval(render, 60000); // keep the greeting current on a tab left open
  input.focus(); // Chrome may still give the omnibox focus first on a new tab; that is browser behaviour.
})();
