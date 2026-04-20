(() => {
  const DATA_URL = 'data/news.json';
  const POLL_MS = 15000;
  const DEFAULT_ROTATION_MS = 18000;

  const state = {
    news: [],
    ticker: [],
    markets: [],
    settings: {},
    lastUpdate: null,
    currentIdx: 0,
    rotationMs: DEFAULT_ROTATION_MS,
    rotationTimer: null,
    progressTimer: null,
    pollTimer: null,
    paused: false,
    loaded: false
  };

  // ---------- DOM helpers ----------
  const $ = (id) => document.getElementById(id);
  const escapeHtml = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));

  // ---------- Render: news card ----------
  function renderNews(idx) {
    if (!state.news.length) {
      $('headline').textContent = 'En attente de données…';
      $('chapo').textContent = 'Le fichier data/news.json est vide ou inaccessible.';
      $('data-block').innerHTML = '';
      $('next-text').textContent = '—';
      return;
    }
    const item = state.news[idx] || state.news[0];
    $('category').textContent = item.category || '';
    $('credit').textContent = item.credit || '';
    $('meta').textContent = [item.time, item.location].filter(Boolean).join(' • ');
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

  // ---------- Render: settings, markets, ticker ----------
  function applySettings() {
    const s = state.settings || {};
    if (s.channel_name) {
      $('logo').textContent = s.channel_name;
      document.title = s.channel_name + ' — Direct';
    }
    const city = s.city || '';
    const temp = s.temperature || '';
    $('weather-text').textContent = [city, temp].filter(Boolean).join(' ');
    if (Number.isFinite(s.rotation_seconds) && s.rotation_seconds > 0) {
      state.rotationMs = s.rotation_seconds * 1000;
    }
  }

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
      return `<span>${escapeHtml(m.label)} <span class="${dir}">${escapeHtml(m.value)}</span></span>`;
    }).join('');
  }

  function renderTicker() {
    const t = $('ticker');
    if (!Array.isArray(state.ticker) || !state.ticker.length) {
      t.innerHTML = '';
      return;
    }
    const block = state.ticker
      .map(it => `<span>${escapeHtml(it)}</span><span class="sep"></span>`)
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

  // ---------- Status banner ----------
  function showStatus(msg) {
    const el = $('status');
    el.textContent = msg;
    el.hidden = false;
  }
  function clearStatus() {
    $('status').hidden = true;
  }

  // ---------- Data loading ----------
  async function loadData({ force = false } = {}) {
    try {
      const url = `${DATA_URL}?t=${Date.now()}`;
      const res = await fetch(url, { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const stamp = data.last_update || JSON.stringify(data).length;
      if (!force && stamp === state.lastUpdate) {
        clearStatus();
        return;
      }
      state.lastUpdate = stamp;
      applyData(data);
      clearStatus();
    } catch (err) {
      console.error('[spoon-news] load error:', err);
      if (!state.loaded) {
        showStatus('Impossible de charger data/news.json');
      } else {
        showStatus('Données obsolètes — reconnexion…');
      }
    }
  }

  function applyData(data) {
    const wasPaused = state.paused;

    state.news = Array.isArray(data.news) ? data.news : [];
    state.ticker = Array.isArray(data.ticker) ? data.ticker : [];
    state.markets = Array.isArray(data.markets) ? data.markets : [];
    state.settings = data.settings || {};

    applySettings();
    renderMarkets();
    renderTicker();

    if (state.currentIdx >= state.news.length) state.currentIdx = 0;
    renderNews(state.currentIdx);

    if (!state.loaded) {
      state.loaded = true;
      if (!wasPaused) startRotation();
    } else {
      // Restart timer with potentially new rotationMs, preserve pause.
      if (!wasPaused) startRotation();
    }
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
      loadData({ force: true });
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
  updateClock();
  setInterval(updateClock, 1000);
  loadData({ force: true });
  state.pollTimer = setInterval(loadData, POLL_MS);
  setTimeout(() => $('hint').classList.add('hidden'), 5000);
})();
