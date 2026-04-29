(() => {
  const URLS = {
    settings: 'data/settings.json',
    news:     'data/news.json',
    direct:   'data/direct.json',
    metrics:  'data/metrics.json'
  };

  const DEFAULT_POLL_SECONDS = { news: 300, direct: 30, metrics: 30 };
  const SETTINGS_REFRESH_MS = 5 * 60 * 1000;
  const DEFAULT_ROTATION_MS = 30000;

  const THEME_KEY = 'spoon-news:theme';

  const state = {
    news: [],
    direct: [],
    markets: [],
    weather: null,
    settings: {},
    stamps:  { settings: null, news: null, direct: null, metrics: null },
    updates: { settings: null, news: null, direct: null, metrics: null },
    currentIdx: 0,
    rotationMs: DEFAULT_ROTATION_MS,
    rotationTimer: null,
    progressTimer: null,
    pollTimers: { settings: null, news: null, direct: null, metrics: null },
    paused: false,
    loaded: false
  };

  // ---------- DOM helpers ----------
  const $ = (id) => document.getElementById(id);
  const escapeHtml = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));

  // ---------- Time helpers ----------
  function relativeTime(iso) {
    const d = new Date(iso);
    if (isNaN(d)) return '';
    const diffSec = Math.max(0, Math.floor((Date.now() - d.getTime()) / 1000));
    if (diffSec < 60) return "À L'INSTANT";
    const min = Math.floor(diffSec / 60);
    if (min < 60) return `IL Y A ${min} MIN`;
    const h = Math.floor(min / 60);
    if (h < 24) return `IL Y A ${h} H`;
    const days = Math.floor(h / 24);
    return `IL Y A ${days} J`;
  }

  // ---------- Render: news card ----------
  function renderNews(idx) {
    if (!state.news.length) {
      $('headline').textContent = 'En attente de données…';
      $('chapo').textContent = 'Le flux news est vide ou inaccessible.';
      $('data-block').innerHTML = '';
      $('next-text').textContent = '—';
      return;
    }
    const item = state.news[idx] || state.news[0];
    $('category').textContent = item.category || '';
    const sources = Array.isArray(item.sources) && item.sources.length
      ? item.sources.map(s => `© ${s.name}`).join(' · ')
      : '';
    $('credit').textContent = sources;
    const time = item.published_at ? relativeTime(item.published_at) : '';
    $('meta').textContent = [time, item.location].filter(Boolean).join(' • ');
    $('headline').textContent = item.headline || '';
    $('chapo').textContent = item.chapo || '';
    $('data-label').textContent = item.data_label || '';

    const svgKey = item.illustration || 'generic';
    $('hero-svg').innerHTML = window.SVGS[svgKey] || window.SVGS.generic;

    const nextIdx = (idx + 1) % state.news.length;
    const nxt = state.news[nextIdx];
    if (nxt) {
      const cat = nxt.category || '';
      const pretty = cat.charAt(0) + cat.slice(1).toLowerCase();
      $('next-text').textContent = pretty + ' — ' + (nxt.headline || '');
    } else {
      $('next-text').textContent = '—';
    }

    const dataBlock = $('data-block');
    const data = item.data || {};
    if (data.type === 'grid' && Array.isArray(data.items)) {
      dataBlock.innerHTML = '<div class="data-grid">' +
        data.items.map(c => `<div class="data-cell"><div class="num">${escapeHtml(c.num)}</div><div class="lbl">${escapeHtml(c.lbl)}</div></div>`).join('') +
        '</div>';
    } else if (data.type === 'quote') {
      dataBlock.innerHTML = `<div class="quote">« ${escapeHtml(data.text)} »<cite>— ${escapeHtml(data.cite)}</cite></div>`;
    } else if (data.type === 'bullets' && Array.isArray(data.items)) {
      dataBlock.innerHTML = '<ul class="bullet-list">' +
        data.items.map(b => `<li>${escapeHtml(b)}</li>`).join('') + '</ul>';
    } else {
      dataBlock.innerHTML = '';
    }

    const content = $('content');
    const hero = $('hero');
    [content, hero].forEach(el => {
      el.classList.remove('fade-in', 'hero-fade');
      void el.offsetWidth;
    });
    content.classList.add('fade-in');
    hero.classList.add('hero-fade');

    startProgress();
  }

  // ---------- Render: settings ----------
  function applySettings() {
    const s = state.settings || {};
    if (s.channel_name) {
      $('logo').textContent = s.channel_name;
      document.title = s.channel_name + ' — Direct';
    }
    if (Number.isFinite(s.rotation_seconds) && s.rotation_seconds > 0) {
      state.rotationMs = s.rotation_seconds * 1000;
    }
  }

  // ---------- Render: weather (with tide) ----------
  function renderWeather() {
    const w = state.weather;
    if (!w) { $('weather-text').textContent = ''; return; }
    const main = [w.emoji, w.city, Number.isFinite(w.temperature_c) ? `${w.temperature_c}°` : null]
      .filter(Boolean).join(' ');
    let tideStr = '';
    if (w.tide && Number.isFinite(w.tide.coefficient)) {
      const arrow = w.tide.state === 'rising' ? '↗' : w.tide.state === 'falling' ? '↘' : '';
      const pct = Number.isFinite(w.tide.progress_pct) ? ` ${w.tide.progress_pct}%` : '';
      tideStr = ` · 🌊 ${w.tide.coefficient}${arrow ? ' ' + arrow : ''}${pct}`;
    }
    $('weather-text').textContent = main + tideStr;
  }

  // ---------- Render: markets ----------
  function renderMarkets() {
    const el = $('markets');
    if (!Array.isArray(state.markets) || !state.markets.length) {
      el.innerHTML = '';
      return;
    }
    el.innerHTML = state.markets.map(m => {
      const dir = m.direction === 'up' ? 'up'
                : m.direction === 'down' ? 'down'
                : 'flat';
      const since = m.since
        ? `<span class="since">${escapeHtml(m.since)}</span>`
        : '';
      return `<span class="market-item">${escapeHtml(m.label)} <span class="${dir}">${escapeHtml(m.value)}</span>${since}</span>`;
    }).join('');
  }

  // ---------- Render: DIRECT ticker ----------
  function renderDirect() {
    const t = $('ticker');
    if (!Array.isArray(state.direct) || !state.direct.length) {
      t.innerHTML = '';
      return;
    }
    const block = state.direct
      .map(it => `<span>${escapeHtml(it.text)}</span><span class="sep"></span>`)
      .join('');
    t.innerHTML = block + block;
  }

  // ---------- Rotation / progress ----------
  function startProgress() {
    clearInterval(state.progressTimer);
    const bar = $('progress');
    let pct = 0;
    bar.style.width = '0%';
    if (!state.rotationTimer) return;
    const step = 100 / (state.rotationMs / 100);
    state.progressTimer = setInterval(() => {
      pct += step;
      bar.style.width = Math.min(pct, 100) + '%';
      if (pct >= 100) clearInterval(state.progressTimer);
    }, 100);
  }

  function goNext() {
    if (!state.news.length) return;
    state.currentIdx = (state.currentIdx + 1) % state.news.length;
    renderNews(state.currentIdx);
  }
  function goPrev() {
    if (!state.news.length) return;
    state.currentIdx = (state.currentIdx - 1 + state.news.length) % state.news.length;
    renderNews(state.currentIdx);
  }
  function startRotation() {
    clearInterval(state.rotationTimer);
    if (!state.news.length) return;
    state.rotationTimer = setInterval(goNext, state.rotationMs);
    state.paused = false;
    startProgress();
  }
  function stopRotation() {
    clearInterval(state.rotationTimer);
    state.rotationTimer = null;
    clearInterval(state.progressTimer);
    state.paused = true;
  }

  // ---------- Clock ----------
  function updateClock() {
    const now = new Date();
    const days = ['Dim.', 'Lun.', 'Mar.', 'Mer.', 'Jeu.', 'Ven.', 'Sam.'];
    const months = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    const ss = String(now.getSeconds()).padStart(2, '0');
    $('clock').innerHTML =
      `${hh}:${mm}<span style="opacity:0.55">:${ss}</span> · ${days[now.getDay()]} ${now.getDate()} ${months[now.getMonth()]}`;
  }

  // ---------- Theme ----------
  function applyTheme(theme) {
    const light = theme === 'light';
    document.body.classList.toggle('light', light);
    const btn = $('theme-toggle');
    if (btn) {
      btn.setAttribute(
        'aria-label',
        light ? 'Passer en mode sombre' : 'Passer en mode clair'
      );
      btn.setAttribute(
        'title',
        light ? 'Mode sombre' : 'Mode clair'
      );
    }
  }
  function initTheme() {
    let saved = null;
    try { saved = localStorage.getItem(THEME_KEY); } catch (_) {}
    applyTheme(saved === 'light' ? 'light' : 'dark');
  }
  function toggleTheme() {
    const isLight = document.body.classList.contains('light');
    const next = isLight ? 'dark' : 'light';
    applyTheme(next);
    try { localStorage.setItem(THEME_KEY, next); } catch (_) {}
  }

  // ---------- Last refresh (most recent updated_at across all 4 feeds) ----------
  function mostRecentUpdate() {
    const dates = Object.values(state.updates).filter(Boolean);
    if (!dates.length) return null;
    return dates.reduce((a, b) => (a > b ? a : b));
  }
  function renderLastRefresh() {
    const el = $('last-update');
    if (!el) return;
    const d = mostRecentUpdate();
    if (!d) {
      el.textContent = 'Dernière modification le —';
      return;
    }
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    const ss = String(d.getSeconds()).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const mo = String(d.getMonth() + 1).padStart(2, '0');
    const yy = d.getFullYear();
    el.textContent = `Dernière modification le ${dd}/${mo}/${yy} à ${hh}:${mm}:${ss}`;
  }

  // ---------- Status banner ----------
  function showStatus(msg) {
    const el = $('status');
    el.textContent = msg;
    el.hidden = false;
  }
  function clearStatus() {
    $('status').hidden = true;
  }

  // ---------- Generic feed loader ----------
  // Returns the parsed payload if it changed since the last fetch, otherwise null.
  async function loadFeed(name) {
    const url = `${URLS[name]}?t=${Date.now()}`;
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (data.updated_at) {
      const parsed = new Date(data.updated_at);
      if (!isNaN(parsed)) state.updates[name] = parsed;
    }
    if (data.updated_at && data.updated_at === state.stamps[name]) return null;
    state.stamps[name] = data.updated_at || JSON.stringify(data).length;
    return data;
  }

  async function refreshSettings() {
    try {
      const data = await loadFeed('settings');
      if (data) {
        state.settings = data;
        applySettings();
        schedulePolling();
        if (state.rotationTimer) startRotation();
      }
    } catch (e) {
      console.error('[spoon-news] settings load error', e);
    } finally {
      renderLastRefresh();
    }
  }

  async function refreshNews() {
    try {
      const data = await loadFeed('news');
      if (data) {
        state.news = Array.isArray(data.news) ? data.news : [];
        if (state.currentIdx >= state.news.length) state.currentIdx = 0;
        renderNews(state.currentIdx);
        if (!state.loaded) {
          state.loaded = true;
          if (!state.paused) startRotation();
        }
      }
      clearStatus();
    } catch (e) {
      console.error('[spoon-news] news load error', e);
      if (!state.loaded) showStatus('Impossible de charger data/news.json');
    } finally {
      renderLastRefresh();
    }
  }

  async function refreshDirect() {
    try {
      const data = await loadFeed('direct');
      if (data) {
        state.direct = Array.isArray(data.items) ? data.items : [];
        renderDirect();
      }
    } catch (e) {
      console.error('[spoon-news] direct load error', e);
    } finally {
      renderLastRefresh();
    }
  }

  async function refreshMetrics() {
    try {
      const data = await loadFeed('metrics');
      if (data) {
        state.weather = data.weather || null;
        state.markets = Array.isArray(data.markets) ? data.markets : [];
        renderWeather();
        renderMarkets();
      }
    } catch (e) {
      console.error('[spoon-news] metrics load error', e);
    } finally {
      renderLastRefresh();
    }
  }

  // ---------- Polling schedule (driven by settings.poll_seconds) ----------
  function schedulePolling() {
    const cfg = (state.settings && state.settings.poll_seconds) || {};
    const intervals = {
      news:    Math.max(5, Number(cfg.news)    || DEFAULT_POLL_SECONDS.news),
      direct:  Math.max(5, Number(cfg.direct)  || DEFAULT_POLL_SECONDS.direct),
      metrics: Math.max(5, Number(cfg.metrics) || DEFAULT_POLL_SECONDS.metrics)
    };
    const fns = { news: refreshNews, direct: refreshDirect, metrics: refreshMetrics };
    Object.entries(fns).forEach(([name, fn]) => {
      clearInterval(state.pollTimers[name]);
      state.pollTimers[name] = setInterval(fn, intervals[name] * 1000);
    });
    clearInterval(state.pollTimers.settings);
    state.pollTimers.settings = setInterval(refreshSettings, SETTINGS_REFRESH_MS);
  }

  function forceReloadAll() {
    state.stamps = { settings: null, news: null, direct: null, metrics: null };
    refreshSettings().then(() => Promise.all([refreshNews(), refreshDirect(), refreshMetrics()]));
  }

  // ---------- Keyboard ----------
  document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') {
      goNext();
      if (!state.paused) startRotation();
    } else if (e.key === 'ArrowLeft') {
      goPrev();
      if (!state.paused) startRotation();
    } else if (e.key === ' ') {
      e.preventDefault();
      if (state.paused) startRotation();
      else stopRotation();
    } else if (e.key === 'f' || e.key === 'F') {
      if (document.fullscreenElement) document.exitFullscreen();
      else document.documentElement.requestFullscreen();
    } else if (e.key === 'r' || e.key === 'R') {
      forceReloadAll();
    }
    showHint();
  });

  let hintTimeout;
  function showHint() {
    const h = $('hint');
    h.classList.remove('hidden');
    clearTimeout(hintTimeout);
    hintTimeout = setTimeout(() => h.classList.add('hidden'), 2500);
  }

  // ---------- Init ----------
  initTheme();
  const themeBtn = $('theme-toggle');
  if (themeBtn) themeBtn.addEventListener('click', toggleTheme);
  renderLastRefresh();
  updateClock();
  setInterval(updateClock, 1000);

  (async () => {
    await refreshSettings();
    await Promise.all([refreshNews(), refreshDirect(), refreshMetrics()]);
    schedulePolling();
  })();

  setTimeout(() => $('hint').classList.add('hidden'), 5000);
})();
