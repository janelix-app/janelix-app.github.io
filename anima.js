// Movimento do site: revelar ao rolar, abertura da janela e link de download da versão nova.
(() => {
  const calmo = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Capítulos aparecem quando entram na tela (sem script, tudo já fica visível).
  const els = document.querySelectorAll('.revela');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add('on');
            io.unobserve(e.target);
          }
        }
      },
      { rootMargin: '0px 0px -12% 0px', threshold: 0.15 },
    );
    els.forEach((el) => io.observe(el));
  } else {
    els.forEach((el) => el.classList.add('on'));
  }

  // Abertura: o print do app se endireita conforme a página rola (só onde o CSS não faz sozinho).
  const palco = document.querySelector('.palco');
  const app = document.querySelector('.janela-app');
  const cssFaz = CSS.supports && CSS.supports('animation-timeline: view()');
  if (palco && app && !calmo && !cssFaz) {
    let pedido = false;
    const atualiza = () => {
      pedido = false;
      const r = palco.getBoundingClientRect();
      const vh = window.innerHeight;
      // 0 quando o topo do palco está embaixo da tela, 1 quando chega a 25% do alto
      const p = Math.min(1, Math.max(0, (vh - r.top) / (vh * 0.75)));
      app.style.setProperty('--p', p.toFixed(3));
    };
    window.addEventListener(
      'scroll',
      () => {
        if (!pedido) {
          pedido = true;
          requestAnimationFrame(atualiza);
        }
      },
      { passive: true },
    );
    atualiza();
  }

  // Versão e link de download sempre da versão mais nova (version.json).
  fetch('version.json', { cache: 'no-cache' })
    .then((r) => (r.ok ? r.json() : null))
    .then((v) => {
      if (!v || !v.version) return;
      if (v.download) document.querySelectorAll('a.baixar').forEach((a) => (a.href = v.download));
      document.getElementById('versao').textContent = 'Versão ' + v.version + ' · Windows 10 e 11 (64 bits) · atualiza sozinho';
      document.getElementById('v-num').textContent = v.version;
      if (Array.isArray(v.notes) && v.notes.length) {
        document.getElementById('notas').replaceChildren(
          ...v.notes.map((n) => {
            const li = document.createElement('li');
            li.textContent = n;
            return li;
          }),
        );
      }
    })
    .catch(() => {});
})();
