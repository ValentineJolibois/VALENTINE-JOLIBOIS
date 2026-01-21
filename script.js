(() => {
  'use strict';

  // ---------- UTIL ----------
  const normalize = (str) =>
    (str ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

  // ---------- SORTERS (ABOUT) ----------
  function initSorters(root = document) {
    const tableBodies = root.querySelectorAll('.table-body');
    if (!tableBodies.length) return;

    // on initialise par table (si tu en as plusieurs)
    tableBodies.forEach((tableBody) => {
      const head = tableBody.closest('.index-table')?.querySelector('.table-head');
      const sorters = head?.querySelectorAll('.sorter') || [];
      if (!sorters.length) return;

      sorters.forEach((btn, colIndex) => {
        if (btn.dataset.bound === '1') return;
        btn.dataset.bound = '1';

        btn.addEventListener('click', (e) => {
          e.preventDefault();

          const isDesc = btn.classList.contains('desc');
          sorters.forEach(b => b.classList.remove('asc', 'desc'));
          btn.classList.add(isDesc ? 'asc' : 'desc');
          const dir = isDesc ? 'asc' : 'desc';

          const rows = Array.from(tableBody.querySelectorAll('.row'));
          rows.sort((r1, r2) => {
            const a = normalize(r1.children[colIndex]?.textContent);
            const b = normalize(r2.children[colIndex]?.textContent);

            const an = Number(a), bn = Number(b);
            const bothNumbers = !Number.isNaN(an) && !Number.isNaN(bn) && a !== '' && b !== '';
            if (bothNumbers) return dir === 'asc' ? an - bn : bn - an;

            if (a === b) return 0;
            return dir === 'asc' ? (a > b ? 1 : -1) : (a > b ? -1 : 1);
          });

          tableBody.innerHTML = '';
          rows.forEach(row => tableBody.appendChild(row));
        });
      });
    });
  }

  // ---------- PROJECTS FOOTER (TITLE + MENU) ----------
  function applyLettrine(el){
    if (!el) return;
    const text = (el.textContent || '').trim();
    if (!text) return;
    el.innerHTML = `<span class="lettrine">${text[0]}</span>${text.slice(1)}`;
  }

  function initProjectsFooter() {
    const projectYear = document.getElementById('projectYear');
    const projectTitle = document.getElementById('projectTitle');
    const projectMenu = document.getElementById('projectMenu');
    const track = document.getElementById('track');

    // si on n'est pas sur projects, rien à faire
    if (!projectTitle || !projectMenu || !track) return;

    // éviter double init en SPA
    if (projectMenu.dataset.bound === '1') return;
    projectMenu.dataset.bound = '1';

    const figures = Array.from(track.querySelectorAll('.figure[data-project]'));
    const menuItems = new Map();

    // build menu
    projectMenu.innerHTML = '';
    const names = [...new Set(figures.map(f => f.getAttribute('data-project')).filter(Boolean))];

    names.forEach(name => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'project-menu-item';
      btn.textContent = name;
      applyLettrine(btn);

      btn.addEventListener('click', () => {
        const target = figures.find(f => f.getAttribute('data-project') === name);
        if (!target) return;
        target.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      });

      projectMenu.appendChild(btn);
      menuItems.set(name, btn);
    });

    // title update based on centered figure
    function updateProjectTitle() {
      if (!figures.length) return;

      const center = window.innerWidth / 2;
      let best = null;
      let bestDist = Infinity;

      figures.forEach(fig => {
        const rect = fig.getBoundingClientRect();
        const c = rect.left + rect.width / 2;
        const d = Math.abs(c - center);
        if (d < bestDist) {
          bestDist = d;
          best = fig;
        }
      });

      if (!best) return;
      const name = best.getAttribute('data-project') || '';
      projectTitle.textContent = name;
      applyLettrine(projectTitle);

      const year = best.getAttribute('data-year') || '';
if (projectYear) {
  projectYear.textContent = year;
}


      menuItems.forEach((btn, n) => {
        btn.classList.toggle('is-active', n === name);
      });
    }

    track.addEventListener('scroll', () => {
      window.requestAnimationFrame(updateProjectTitle);
    }, { passive: true });

    window.addEventListener('resize', updateProjectTitle);
    updateProjectTitle();

    // optional: allow wheel to scroll the menu horizontally
    projectMenu.addEventListener('wheel', (e) => {
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        projectMenu.scrollLeft += e.deltaY;
        e.preventDefault();
      }
    }, { passive: false });
  }

  // ---------- SPA ENTRY POINT ----------
  window.App = window.App || {};
  window.App.initAll = (mount) => {
    initSorters(mount || document);
    initProjectsFooter();
  };

  // first load (non-SPA fallback)
  document.addEventListener('DOMContentLoaded', () => {
    window.App.initAll(document);
  });
})();
