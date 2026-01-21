(() => {
    'use strict';
  
    const DEFAULT_VIEW = 'views/index.html';
    const VIEW_SEL = 'main[data-view]';
  
    const viewEl = () => document.getElementById('view');
    const footerSlotEl = () => document.getElementById('footer-slot');
    const sleep = (ms) => new Promise(r => setTimeout(r, ms));
    const shellUrl = () => window.location.href.split('#')[0];
  
    const normalizeViewPath = (p) => {
      if (!p) return DEFAULT_VIEW;
  
      p = String(p).replace(/^#\/?/, '');
      p = p.replace(/^\//, '');
  
      // force dossier views/ si tu passes "about.html"
      if (!p.startsWith('views/')) p = `views/${p}`;
  
      return p || DEFAULT_VIEW;
    };
  
    const viewFromLocation = () => normalizeViewPath(window.location.hash || '');
  
    const isInternalViewLink = (a) => {
      if (!a) return false;
      if (!a.hasAttribute('data-route')) return false;
  
      const href = a.getAttribute('href');
      if (!href) return false;
  
      if (href.startsWith('#')) return false;
      if (href.startsWith('mailto:') || href.startsWith('tel:')) return false;
  
      if (/^https?:\/\//i.test(href)) {
        const u = new URL(href);
        if (u.origin !== location.origin) return false;
      }
  
      return href.endsWith('.html');
    };
  
    async function fetchHtml(viewPath) {
      const abs = new URL(viewPath, shellUrl()).toString();
      const res = await fetch(abs, { cache: 'no-cache' });
      if (!res.ok) throw new Error(`HTTP ${res.status} for ${viewPath}`);
      return await res.text();
    }
  
    function extractViewFooter(doc) {
      return doc.querySelector('[data-view-footer]');
    }
  
    function extractMain(doc, viewPath) {
        const main = doc.querySelector(VIEW_SEL);
        if (main) {
          // enlève le footer de view si jamais il est dedans
          main.querySelectorAll('[data-view-footer]').forEach(n => n.remove());
          return main;
        }
  
      const wrapper = doc.createElement('main');
      const base = (viewPath || '').split('/').pop() || 'view';
      wrapper.setAttribute('data-view', base.replace(/\.html$/i, ''));
  
      if (!doc.body) throw new Error(`No body in ${viewPath}`);
  
      const temp = doc.createElement('div');
      temp.innerHTML = doc.body.innerHTML;
  
      // retirer ce qui ne doit pas être réinjecté
      temp.querySelectorAll('header, script, link[rel="stylesheet"], style').forEach(n => n.remove());
  
      // retirer le footer de view pour éviter double affichage
      temp.querySelectorAll('[data-view-footer]').forEach(n => n.remove());
  
      wrapper.innerHTML = temp.innerHTML;
      return wrapper;
    }
  
    async function loadView(viewPath, { push = true } = {}) {
      const mount = viewEl();
      const footerSlot = footerSlotEl();
      if (!mount) return;
  
      viewPath = normalizeViewPath(viewPath);
  
      // OUT
      document.body.classList.remove('animate-in', 'pre-in');
      document.body.classList.add('animate-out');
      void mount.offsetHeight;
      await sleep(180);
  
      let html;
      try {
        html = await fetchHtml(viewPath);
      } catch (e) {
        console.error('[router] fetch failed:', e);
        document.body.classList.remove('animate-out');
        return;
      }
  
      let main, viewFooter;
      try {
        const doc = new DOMParser().parseFromString(html, 'text/html');
        main = extractMain(doc, viewPath);
        viewFooter = extractViewFooter(doc);
      } catch (e) {
        console.error('[router] parse/extract failed:', e);
        document.body.classList.remove('animate-out');
        return;
      }
  
      // inject main
      mount.innerHTML = '';
      mount.appendChild(main.cloneNode(true));
  
      // inject footer content into real footer slot
      if (footerSlot) {
        footerSlot.className = 'footer';
        if (viewFooter && viewFooter.className) footerSlot.className = viewFooter.className;
        footerSlot.innerHTML = viewFooter ? viewFooter.innerHTML : '';
      }
  
      // URL hash
      if (push) history.pushState({}, '', `${shellUrl()}#/${viewPath}`);
  
      // init scripts for new view
      try {
        window.App?.initAll?.(mount);
      } catch (e) {
        console.error('[App.initAll]', e);
      }
  
      // IN
      document.body.classList.remove('animate-out');
      document.body.classList.add('pre-in');
      void mount.offsetHeight;
  
      document.body.classList.add('animate-in');
      document.body.classList.remove('pre-in');
  
      setTimeout(() => document.body.classList.remove('animate-in'), 240);
    }
  
    document.addEventListener('click', (e) => {
      const a = e.target.closest('a');
      if (!isInternalViewLink(a)) return;
      e.preventDefault();
      loadView(a.getAttribute('href'), { push: true });
    });
  
    window.addEventListener('popstate', () => {
      loadView(viewFromLocation(), { push: false });
    });
  
    // boot
    loadView(viewFromLocation(), { push: false });
  })();
  