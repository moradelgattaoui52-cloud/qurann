/* ═══════════════════════════════════════════════════════════════
   THE NOBLE QUR'AN — Frontend App
   ═══════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  // ── State ──────────────────────────────────────────────────────
  let allSurahs = [];
  let currentSurahNumber = null;
  let viewMode = 'both'; // 'both' | 'arabic' | 'translation'

  // ── DOM refs ───────────────────────────────────────────────────
  const sidebar          = document.getElementById('sidebar');
  const overlay          = document.getElementById('overlay');
  const menuBtn          = document.getElementById('menu-btn');
  const sidebarClose     = document.getElementById('sidebar-close');
  const surahListEl      = document.getElementById('surah-list');
  const surahFilter      = document.getElementById('surah-filter');
  const currentSurahName = document.getElementById('current-surah-name');
  const welcomeScreen    = document.getElementById('welcome-screen');
  const surahView        = document.getElementById('surah-view');
  const ayahsContainer   = document.getElementById('ayahs-container');
  const metaNumber       = document.getElementById('meta-number');
  const metaArabic       = document.getElementById('meta-arabic');
  const metaEnglish      = document.getElementById('meta-english');
  const metaSub          = document.getElementById('meta-sub');
  const surahBismillah   = document.getElementById('surah-bismillah');
  const prevBtn          = document.getElementById('prev-surah');
  const nextBtn          = document.getElementById('next-surah');
  const searchToggle     = document.getElementById('search-toggle');
  const searchPanel      = document.getElementById('search-panel');
  const searchInput      = document.getElementById('search-input');
  const searchBtn        = document.getElementById('search-btn');
  const searchClose      = document.getElementById('search-close');
  const searchResultsEl  = document.getElementById('search-results');
  const viewToggle       = document.getElementById('view-toggle');
  const scrollTopBtn     = document.getElementById('scroll-top');
  const openSidebarCta   = document.getElementById('open-sidebar-cta');

  // ── Sidebar toggle ─────────────────────────────────────────────
  function openSidebar() {
    sidebar.classList.add('open');
    overlay.classList.add('visible');
    document.body.style.overflow = 'hidden';
  }
  function closeSidebar() {
    sidebar.classList.remove('open');
    overlay.classList.remove('visible');
    document.body.style.overflow = '';
  }

  menuBtn.addEventListener('click', openSidebar);
  sidebarClose.addEventListener('click', closeSidebar);
  overlay.addEventListener('click', closeSidebar);
  if (openSidebarCta) openSidebarCta.addEventListener('click', openSidebar);

  // ── Fetch surah list ───────────────────────────────────────────
  async function loadSurahList() {
    try {
      const res = await fetch('/api/surahs');
      if (!res.ok) throw new Error('Failed to load surahs');
      allSurahs = await res.json();
      renderSurahList(allSurahs);
    } catch (e) {
      surahListEl.innerHTML = `<div class="loading-surahs" style="color:#c44">
        Error loading data.<br>Run <code>node scripts/fetch-data.js</code> first.
      </div>`;
    }
  }

  // ── Render surah list ──────────────────────────────────────────
  function renderSurahList(surahs) {
    surahListEl.innerHTML = '';
    if (!surahs.length) {
      surahListEl.innerHTML = '<div class="loading-surahs">No results found.</div>';
      return;
    }
    surahs.forEach(s => {
      const item = document.createElement('div');
      item.className = 'surah-item' + (s.number === currentSurahNumber ? ' active' : '');
      item.dataset.number = s.number;
      item.innerHTML = `
        <span class="surah-item-num">${s.number}</span>
        <span class="surah-item-info">
          <span class="surah-item-eng">${s.englishName}</span>
          <span class="surah-item-meta">${s.englishNameTranslation} · ${s.numberOfAyahs} verses · ${s.revelationType}</span>
        </span>
        <span class="surah-item-arabic">${s.name}</span>
      `;
      item.addEventListener('click', () => {
        loadSurah(s.number);
        closeSidebar();
      });
      surahListEl.appendChild(item);
    });
  }

  // ── Filter surahs in sidebar ───────────────────────────────────
  surahFilter.addEventListener('input', () => {
    const q = surahFilter.value.toLowerCase().trim();
    if (!q) { renderSurahList(allSurahs); return; }
    const filtered = allSurahs.filter(s =>
      s.englishName.toLowerCase().includes(q) ||
      s.englishNameTranslation.toLowerCase().includes(q) ||
      s.name.includes(q) ||
      String(s.number) === q
    );
    renderSurahList(filtered);
  });

  // ── Load & render a surah ─────────────────────────────────────
  async function loadSurah(number) {
    currentSurahNumber = number;

    // Update active state in sidebar
    document.querySelectorAll('.surah-item').forEach(el => {
      el.classList.toggle('active', parseInt(el.dataset.number) === number);
    });

    // Show surah view, hide welcome
    welcomeScreen.classList.add('hidden');
    surahView.classList.remove('hidden');

    // Show spinner
    ayahsContainer.innerHTML = '<div class="spinner">Loading…</div>';
    ayahsContainer.className = 'ayahs-container';

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });

    try {
      const res = await fetch(`/api/surahs/${number}`);
      if (!res.ok) throw new Error('Surah not found');
      const surah = await res.json();
      renderSurah(surah);
    } catch (e) {
      ayahsContainer.innerHTML = `<div class="spinner" style="color:#c44">Failed to load surah. ${e.message}</div>`;
    }
  }

  function renderSurah(surah) {
    // Header
    metaNumber.textContent = `Surah ${surah.number} of 114`;
    metaArabic.textContent = surah.name;
    metaEnglish.textContent = surah.englishName;
    metaSub.textContent = `${surah.englishNameTranslation}  ·  ${surah.numberOfAyahs} Ayahs  ·  ${surah.revelationType}`;
    currentSurahName.textContent = surah.englishName;

    // Hide bismillah for Al-Fatiha (it starts with it) and At-Tawbah (no bismillah)
    if (surah.number === 1 || surah.number === 9) {
      surahBismillah.style.display = 'none';
    } else {
      surahBismillah.style.display = '';
    }

    // Nav buttons
    prevBtn.disabled = surah.number <= 1;
    nextBtn.disabled = surah.number >= 114;

    // Ayahs
    ayahsContainer.innerHTML = '';
    applyViewMode(ayahsContainer);

    surah.ayahs.forEach(ayah => {
      const block = document.createElement('div');
      block.className = 'ayah-block';
      block.innerHTML = `
        <div class="ayah-number-badge">${ayah.numberInSurah}</div>
        <div class="ayah-arabic">${ayah.text} ۝${toArabicNumeral(ayah.numberInSurah)}</div>
        <div class="ayah-translation">${escapeHtml(ayah.translation)}</div>
      `;
      ayahsContainer.appendChild(block);
    });

    // Stagger animation
    const blocks = ayahsContainer.querySelectorAll('.ayah-block');
    blocks.forEach((b, i) => {
      b.style.animationDelay = `${Math.min(i * 30, 600)}ms`;
    });
  }

  // ── Navigation buttons ────────────────────────────────────────
  prevBtn.addEventListener('click', () => {
    if (currentSurahNumber > 1) loadSurah(currentSurahNumber - 1);
  });
  nextBtn.addEventListener('click', () => {
    if (currentSurahNumber < 114) loadSurah(currentSurahNumber + 1);
  });

  // ── View mode toggle ──────────────────────────────────────────
  viewToggle.addEventListener('change', () => {
    viewMode = viewToggle.value;
    applyViewMode(ayahsContainer);
  });

  function applyViewMode(container) {
    container.classList.remove('mode-arabic', 'mode-translation', 'mode-both');
    if (viewMode === 'arabic') container.classList.add('mode-arabic');
    else if (viewMode === 'translation') container.classList.add('mode-translation');
  }

  // ── Search ────────────────────────────────────────────────────
  searchToggle.addEventListener('click', () => {
    searchPanel.classList.toggle('hidden');
    if (!searchPanel.classList.contains('hidden')) {
      searchInput.focus();
    }
  });
  searchClose.addEventListener('click', () => {
    searchPanel.classList.add('hidden');
    searchResultsEl.innerHTML = '';
  });

  searchBtn.addEventListener('click', runSearch);
  searchInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') runSearch();
  });

  async function runSearch() {
    const q = searchInput.value.trim();
    if (!q) return;

    searchResultsEl.innerHTML = '<div class="search-msg">Searching…</div>';

    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      const results = await res.json();

      if (!results.length) {
        searchResultsEl.innerHTML = '<div class="search-no-results">No results found.</div>';
        return;
      }

      searchResultsEl.innerHTML = '';
      const frag = document.createDocumentFragment();
      results.forEach(r => {
        const div = document.createElement('div');
        div.className = 'search-result-item';
        const highlighted = highlight(escapeHtml(r.translation || ''), escapeHtml(q));
        div.innerHTML = `
          <div class="search-result-ref">Surah ${r.surahNumber} (${r.surahName}) · Ayah ${r.ayahNumber}</div>
          <div class="search-result-text">${highlighted}</div>
        `;
        div.addEventListener('click', () => {
          searchPanel.classList.add('hidden');
          loadSurah(r.surahNumber).then(() => {
            // Scroll to the specific ayah
            setTimeout(() => {
              const blocks = ayahsContainer.querySelectorAll('.ayah-block');
              const target = blocks[r.ayahNumber - 1];
              if (target) target.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 400);
          });
        });
        frag.appendChild(div);
      });
      searchResultsEl.appendChild(frag);
      if (results.length === 50) {
        const note = document.createElement('div');
        note.className = 'search-msg';
        note.textContent = 'Showing first 50 results. Try a more specific query.';
        searchResultsEl.appendChild(note);
      }
    } catch (e) {
      searchResultsEl.innerHTML = `<div class="search-no-results">Search failed: ${e.message}</div>`;
    }
  }

  // ── Scroll to top button ──────────────────────────────────────
  window.addEventListener('scroll', () => {
    scrollTopBtn.classList.toggle('hidden', window.scrollY < 300);
  });
  scrollTopBtn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  // ── Keyboard shortcuts ─────────────────────────────────────────
  document.addEventListener('keydown', e => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
    if (e.key === 'ArrowLeft' || e.key === ',') { prevBtn.click(); }
    if (e.key === 'ArrowRight' || e.key === '.') { nextBtn.click(); }
    if (e.key === '/') { e.preventDefault(); searchToggle.click(); searchInput.focus(); }
    if (e.key === 'Escape') { closeSidebar(); searchPanel.classList.add('hidden'); }
  });

  // ── URL hash routing ──────────────────────────────────────────
  function readHash() {
    const hash = window.location.hash;
    const match = hash.match(/^#surah-(\d+)/);
    if (match) {
      const num = parseInt(match[1]);
      if (num >= 1 && num <= 114) loadSurah(num);
    }
  }

  window.addEventListener('hashchange', readHash);

  // Override loadSurah to update URL
  const _loadSurah = loadSurah;
  window.loadSurah = function (num) {
    history.replaceState(null, '', `#surah-${num}`);
    return _loadSurah(num);
  };
  // Re-wire buttons to use window.loadSurah
  prevBtn.addEventListener('click', () => {}, { once: false });

  // ── Helpers ───────────────────────────────────────────────────
  function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function highlight(text, q) {
    if (!q) return text;
    const safe = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return text.replace(new RegExp(`(${safe})`, 'gi'), '<mark>$1</mark>');
  }

  const arabicNumerals = ['٠','١','٢','٣','٤','٥','٦','٧','٨','٩'];
  function toArabicNumeral(n) {
    return String(n).split('').map(d => arabicNumerals[+d] || d).join('');
  }

  // ── Init ──────────────────────────────────────────────────────
  loadSurahList().then(() => {
    readHash();
  });

})();
