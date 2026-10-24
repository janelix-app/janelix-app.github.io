// Comportamento do site: demonstração da abertura e link de download da versão nova.
(() => {
  const calmo = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------------------------------------------------------------- demonstração da abertura
  // Passa sozinha pelas funções a cada 6 s: abre a explicação no menu, aproxima a câmera e
  // ilumina a parte da janela. Para com o mouse em cima, com foco dentro ou fora da tela.
  // Clicar numa função do menu pula para ela. Com menos movimento, não passa sozinha.
  const demo = document.querySelector('[data-demo]');
  if (demo) {
    const itens = [...demo.querySelectorAll('.demo-menu li')];
    const camera = demo.querySelector('.demo-camera');
    const foco = demo.querySelector('.demo-foco');
    const TEMPO = 6000;
    const nums = (s) => s.split(' ').map(Number);
    let atual = 0;
    let mouseDentro = false;
    let focoDentro = false;
    let visivel = false;
    let timer = null;

    function mostra(i) {
      atual = i;
      const li = itens[i];
      const [fx, fy, fw, fh] = nums(li.dataset.foco);
      const [cx, cy] = nums(li.dataset.centro);
      itens.forEach((el, j) => {
        el.classList.toggle('ativo', j === i);
        el.querySelector('button').setAttribute('aria-expanded', j === i ? 'true' : 'false');
      });
      foco.style.cssText = `--fx:${fx}%;--fy:${fy}%;--fw:${fw}%;--fh:${fh}%`;
      camera.style.cssText = calmo ? '' : `--cx:${cx}%;--cy:${cy}%;--zoom:${li.dataset.zoom}`;
      demo.classList.add('focando');
      reinicia();
    }

    const podeRodar = () => !calmo && !mouseDentro && !focoDentro && visivel && !document.hidden;
    function reinicia() {
      clearTimeout(timer);
      // a barra de tempo reinicia junto com o timer
      demo.classList.remove('rodando');
      if (!podeRodar()) return;
      void demo.offsetWidth;
      demo.classList.add('rodando');
      timer = setTimeout(() => mostra((atual + 1) % itens.length), TEMPO);
    }

    itens.forEach((li, i) => li.querySelector('button').addEventListener('click', () => mostra(i)));
    demo.style.setProperty('--tempo', TEMPO + 'ms');
    demo.addEventListener('mouseenter', () => {
      mouseDentro = true;
      reinicia();
    });
    demo.addEventListener('mouseleave', () => {
      mouseDentro = false;
      reinicia();
    });
    demo.addEventListener('focusin', () => {
      focoDentro = true;
      reinicia();
    });
    demo.addEventListener('focusout', (e) => {
      if (demo.contains(e.relatedTarget)) return;
      focoDentro = false;
      reinicia();
    });
    document.addEventListener('visibilitychange', reinicia);
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(
        ([e]) => {
          visivel = e.isIntersecting;
          reinicia();
        },
        { threshold: 0.3 },
      ).observe(demo);
    } else {
      visivel = true;
    }

    // começa depois que a janela termina de abrir
    setTimeout(() => mostra(0), calmo ? 0 : 1400);
  }

  // ---------------------------------------------------------------- versão e download
  // Versão e link de download sempre da versão mais nova (version.json).
  fetch('version.json', { cache: 'no-cache' })
    .then((r) => (r.ok ? r.json() : null))
    .then((v) => {
      if (!v || !v.version) return;
      if (v.download) document.querySelectorAll('a.baixar').forEach((a) => (a.href = v.download));
      document.getElementById('versao').textContent = 'Versão ' + v.version + ' · para Windows 10 e 11 · atualiza sozinho';
      if (v.sizeMB > 0) document.getElementById('v-tam').textContent = 'Download de cerca de ' + Math.round(v.sizeMB) + ' MB';
      document.getElementById('v-num').textContent = v.version;
      const data = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v.date || '');
      const elData = document.getElementById('v-data');
      if (data && elData) {
        elData.textContent = 'Publicada em ' + data[3] + '/' + data[2] + '/' + data[1];
        elData.hidden = false;
      }
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
