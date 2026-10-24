// Comportamento do site: carrossel de prints e link de download da versão nova.
(() => {
  const calmo = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------------------------------------------------------------- carrossel
  // Sem script, o trilho continua rolando de lado com encaixe (CSS); com script ganha
  // botões, pontos, teclado, arrastar com o mouse e troca automática (ligada pelo botão).
  const car = document.querySelector('[data-carrossel]');
  if (car) {
    const trilho = car.querySelector('.trilho');
    const slides = [...trilho.querySelectorAll('.slide')];
    const pontos = car.querySelector('[data-pontos]');
    const btnPausa = car.querySelector('[data-pausa]');
    const anuncio = car.querySelector('[data-anuncio]');
    const tituloJanela = car.querySelector('[data-titulo]');
    const titulos = slides.map((s) => s.querySelector('figcaption strong').textContent.trim());
    const total = slides.length;
    const INTERVALO = 6000;

    let atual = 0;
    // Começa parado: o único movimento automático da página é o tour da abertura.
    let pausadoPeloUsuario = true;
    let mouseDentro = false;
    let focoDentro = false;
    let visivel = false;
    let timer = null;
    let destino = null;
    let fimDestino = null;

    const dots = slides.map((_, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'ponto';
      b.setAttribute('aria-label', 'Print ' + (i + 1) + ': ' + titulos[i]);
      b.addEventListener('click', () => vaiPara(i, true));
      pontos.appendChild(b);
      return b;
    });

    const marca = (i) => {
      atual = i;
      dots.forEach((d, j) => d.setAttribute('aria-current', j === i ? 'true' : 'false'));
      slides.forEach((s, j) => {
        if (j === i) s.removeAttribute('aria-hidden');
        else s.setAttribute('aria-hidden', 'true');
      });
      tituloJanela.textContent = 'Janelix · ' + titulos[i];
    };

    const vaiPara = (i, peloUsuario) => {
      const alvo = (i + total) % total;
      destino = alvo;
      clearTimeout(fimDestino);
      fimDestino = setTimeout(() => (destino = null), 1200);
      trilho.scrollTo({ left: alvo * trilho.clientWidth, behavior: calmo ? 'auto' : 'smooth' });
      marca(alvo);
      if (peloUsuario) anuncio.textContent = 'Print ' + (alvo + 1) + ' de ' + total + ': ' + titulos[alvo];
      reinicia();
    };

    // o índice segue a rolagem (toque, trackpad, barra)
    let pedido = false;
    trilho.addEventListener(
      'scroll',
      () => {
        if (pedido) return;
        pedido = true;
        requestAnimationFrame(() => {
          pedido = false;
          const i = Math.round(trilho.scrollLeft / trilho.clientWidth);
          if (destino !== null) {
            // rolagem pedida por botão: não marca os prints do meio do caminho
            if (i === destino) destino = null;
            return;
          }
          if (i !== atual && i >= 0 && i < total) marca(i);
        });
      },
      { passive: true },
    );

    car.querySelector('[data-ant]').addEventListener('click', () => vaiPara(atual - 1, true));
    car.querySelector('[data-prox]').addEventListener('click', () => vaiPara(atual + 1, true));

    trilho.addEventListener('keydown', (e) => {
      const mapa = { ArrowLeft: atual - 1, ArrowRight: atual + 1, Home: 0, End: total - 1 };
      if (!(e.key in mapa)) return;
      e.preventDefault();
      vaiPara(mapa[e.key], true);
    });

    // arrastar com o mouse (no toque, a rolagem nativa já faz isso)
    let arrasto = null;
    trilho.addEventListener('pointerdown', (e) => {
      if (e.pointerType !== 'mouse' || e.button !== 0) return;
      arrasto = { x: e.clientX, inicio: trilho.scrollLeft, de: atual, moveu: false };
      trilho.setPointerCapture(e.pointerId);
    });
    trilho.addEventListener('pointermove', (e) => {
      if (!arrasto) return;
      const dx = e.clientX - arrasto.x;
      if (!arrasto.moveu && Math.abs(dx) > 4) {
        arrasto.moveu = true;
        trilho.classList.add('arrastando');
      }
      if (arrasto.moveu) trilho.scrollLeft = arrasto.inicio - dx;
    });
    const soltar = (e) => {
      if (!arrasto) return;
      const dx = e.clientX - arrasto.x;
      const de = arrasto.de;
      const moveu = arrasto.moveu;
      arrasto = null;
      trilho.classList.remove('arrastando');
      if (!moveu) return;
      const limite = Math.min(80, trilho.clientWidth * 0.12);
      vaiPara(dx < -limite ? de + 1 : dx > limite ? de - 1 : de, true);
    };
    trilho.addEventListener('pointerup', soltar);
    trilho.addEventListener('pointercancel', soltar);

    // troca automática: para com o mouse em cima, com foco dentro, fora da tela ou pausada
    const podeRodar = () => !pausadoPeloUsuario && !mouseDentro && !focoDentro && visivel && !document.hidden;
    function reinicia() {
      clearTimeout(timer);
      if (podeRodar()) timer = setTimeout(() => vaiPara(atual + 1, false), INTERVALO);
    }

    const atualizaPausa = () => {
      btnPausa.setAttribute('aria-pressed', pausadoPeloUsuario ? 'true' : 'false');
      btnPausa.setAttribute('aria-label', pausadoPeloUsuario ? 'Retomar troca automática' : 'Pausar troca automática');
    };
    btnPausa.addEventListener('click', () => {
      pausadoPeloUsuario = !pausadoPeloUsuario;
      atualizaPausa();
      reinicia();
    });

    car.addEventListener('mouseenter', () => {
      mouseDentro = true;
      reinicia();
    });
    car.addEventListener('mouseleave', () => {
      mouseDentro = false;
      reinicia();
    });
    car.addEventListener('focusin', () => {
      focoDentro = true;
      reinicia();
    });
    car.addEventListener('focusout', (e) => {
      if (car.contains(e.relatedTarget)) return;
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
        { threshold: 0.4 },
      ).observe(car);
    }

    // ao redimensionar, mantém o print atual encaixado
    window.addEventListener('resize', () => {
      trilho.scrollTo({ left: atual * trilho.clientWidth, behavior: 'auto' });
    });

    atualizaPausa();
    marca(0);
  }

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
