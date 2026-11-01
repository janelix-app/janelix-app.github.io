// Comportamento do site: janela viva da abertura, frase de impacto e link de download da versão nova.
(() => {
  const calmo = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------------------------------------------------------------- janela viva
  // Um Janelix de mentira montado na página. Cada função do menu é uma cena curta;
  // as cenas passam sozinhas (param com o mouse em cima, com o botão Pausar ou fora da tela).
  // Com menos movimento, nada passa sozinho e a cena aparece pronta, sem animação.
  const demo = document.querySelector('[data-demo]');
  if (demo) {
    const $ = (s) => demo.querySelector(s);
    const itens = [...demo.querySelectorAll('.demo-menu li')];
    const vivo = $('.vivo');
    const app = $('.app');
    const pausa = $('.demo-pausa');
    const ETQ = {
      cliente: ['Cliente', '#3b82f6'],
      negocia: ['Em negociação', '#a855f7'],
      pago: ['Pagamento', '#22c55e'],
      cobra: ['Cobrança', '#f43f5e'],
    };
    const CONTAS = [
      {
        sigla: 'SP',
        cor: '#3b82f6',
        chats: [
          { n: 'Maria Silva', av: 'MS', cor: '#e05a8a', ult: 'Oi! Recebi o boleto.', h: '09:41', et: ['cliente'] },
          { n: 'Carlos Lima', av: 'CL', cor: '#14b8a6', ult: 'Vou ver com meu sócio.', h: '09:12', et: [] },
          { n: 'Equipe Financeiro', av: 'EF', cor: '#f59e0b', ult: 'Reunião às 15h.', h: 'ontem', et: [] },
        ],
      },
      {
        sigla: 'CB',
        cor: '#ec4899',
        chats: [
          { n: 'João Pereira', av: 'JP', cor: '#3b82f6', ult: 'Consegue me mandar a segunda via?', h: '10:02', et: ['cobra'] },
          { n: 'Fernanda Rocha', av: 'FR', cor: '#8b5cf6', ult: 'Paguei agora há pouco.', h: '09:55', et: ['pago'] },
        ],
      },
      {
        sigla: 'VD',
        cor: '#f59e0b',
        chats: [{ n: 'Paulo Mendes', av: 'PM', cor: '#22c55e', ult: 'Qual o valor à vista?', h: '08:47', et: ['negocia'] }],
      },
    ];
    let conta = 0;
    let novas = [0, 1, 0];

    const trilho = $('[data-trilho]');
    const lista = $('[data-lista]');
    const msgs = $('[data-msgs]');
    const campo = $('[data-campo]');
    const aviso = $('[data-aviso]');
    const rec = $('[data-rec]');
    const el = (tag, cls, txt) => {
      const e = document.createElement(tag);
      if (cls) e.className = cls;
      if (txt != null) e.textContent = txt;
      return e;
    };
    const chip = (k) => {
      const c = el('span', 'etq', ETQ[k][0]);
      c.style.setProperty('--c', ETQ[k][1]);
      return c;
    };

    function desenhaTrilho() {
      trilho.replaceChildren(
        ...CONTAS.map((c, i) => {
          const b = el('span', i === conta ? 'conta ativa' : 'conta', c.sigla);
          b.style.setProperty('--c', c.cor);
          if (novas[i]) b.append(el('span', 'conta-n', String(novas[i])));
          return b;
        }),
        el('span', 'conta-add', '+'),
      );
    }
    function desenhaLista() {
      lista.replaceChildren(
        ...CONTAS[conta].chats.map((c, i) => {
          const li = el('li', i === 0 ? 'aberta' : '');
          const av = el('span', 'av', c.av);
          av.style.setProperty('--c', c.cor);
          const meio = el('span', 'lista-meio');
          const linha = el('span', 'lista-linha');
          linha.append(el('strong', '', c.n), ...c.et.map(chip));
          meio.append(linha, el('small', '', c.ult));
          li.append(av, meio, el('span', 'lista-h', c.h));
          return li;
        }),
      );
    }
    function abreConversa(c, falas) {
      $('[data-chat-nome]').textContent = c.n;
      const av = $('[data-chat-av]');
      av.textContent = c.av;
      av.style.setProperty('--c', c.cor);
      msgs.replaceChildren(...falas.map(([quem, t]) => el('p', 'msg ' + quem, t)));
    }
    function trocaConta(i) {
      conta = i;
      novas[i] = 0;
      desenhaTrilho();
      desenhaLista();
    }
    function base() {
      conta = 0;
      novas = [0, 1, 0];
      CONTAS[0].chats[0].et = ['cliente'];
      CONTAS[0].chats[1].et = [];
      desenhaTrilho();
      desenhaLista();
      abreConversa(CONTAS[0].chats[0], [
        ['in', 'Oi! Recebi o boleto.'],
        ['out', 'Oi, Maria! Pode pagar até sexta, sem juros.'],
      ]);
      campo.textContent = 'Digite uma mensagem';
      campo.parentElement.classList.remove('cheio', 'alvo');
      aviso.classList.remove('aberto', 'saindo');
      rec.classList.remove('ligado');
    }
    const alvo = (n) => n && n.classList.add('alvo');
    async function digita(no, texto, w, ms) {
      if (calmo) {
        no.textContent = texto;
        return;
      }
      no.textContent = '';
      for (const ch of texto) {
        no.textContent += ch;
        await w(ms);
      }
    }
    function mostraAviso(t, b, c) {
      $('[data-aviso-t]').textContent = t;
      $('[data-aviso-b]').textContent = b;
      $('[data-aviso-c]').textContent = c;
      aviso.classList.add('aberto');
    }
    async function fechaAviso(w) {
      aviso.classList.add('saindo');
      await w(450);
      aviso.classList.remove('aberto', 'saindo');
    }

    const CENAS = [
      // várias contas: chega mensagem na Cobrança e a pessoa troca de conta
      async (w) => {
        await w(700);
        novas[1] = 2;
        desenhaTrilho();
        alvo(trilho.children[1]);
        await w(1300);
        trocaConta(1);
        abreConversa(CONTAS[1].chats[0], [
          ['in', 'Bom dia!'],
          ['in', 'Consegue me mandar a segunda via?'],
        ]);
        await w(1800);
        trocaConta(2);
        abreConversa(CONTAS[2].chats[0], [['in', 'Qual o valor à vista?']]);
        await w(1800);
      },
      // etiquetas: Carlos ganha "Em negociação" e Maria ganha "Pagamento"
      async (w) => {
        await w(800);
        CONTAS[0].chats[1].et = ['negocia'];
        desenhaLista();
        alvo(lista.children[1]);
        await w(1500);
        CONTAS[0].chats[0].et = ['cliente', 'pago'];
        desenhaLista();
        alvo(lista.children[0]);
        await w(2200);
      },
      // áudio: chega a mensagem de voz, toca e o texto aparece dentro do balão
      async (w) => {
        await w(600);
        const b = el('div', 'msg in audio');
        const linha = el('span', 'audio-linha');
        linha.append(el('i', 'audio-play'), el('span', 'audio-barra'), el('small', '', '0:08'));
        const txt = el('span', 'audio-txt', 'Transcrevendo…');
        b.append(linha, txt);
        msgs.append(b);
        alvo(b);
        await w(150);
        b.classList.add('tocando');
        await w(2100);
        await digita(txt, 'Olá, tudo bem? Estou entrando em contato para combinar o pagamento da parcela de sexta. Podemos fazer um acordo hoje?', w, 22);
        await w(2000);
      },
      // aviso do Windows: mensagem em outra conta, um clique abre a conversa
      async (w) => {
        await w(600);
        novas[1] = 1;
        desenhaTrilho();
        mostraAviso('João Pereira', 'Consegue me mandar a segunda via?', 'Cobrança');
        await w(2400);
        await fechaAviso(w);
        trocaConta(1);
        abreConversa(CONTAS[1].chats[0], [['in', 'Consegue me mandar a segunda via?']]);
        alvo(msgs.lastElementChild);
        await w(2400);
      },
      // ligação: conecta, grava e conta o tempo
      async (w) => {
        await w(600);
        msgs.append(el('p', 'msg sistema', 'Ligação de voz com Maria Silva'));
        rec.classList.add('ligado');
        const t = $('[data-rec-t]');
        for (let s = 0; s <= 9; s++) {
          t.textContent = '00:' + String(s).padStart(2, '0');
          await w(700);
        }
        await w(600);
      },
      // lembrete: avisa 5 minutos antes e abre a conversa com o texto pronto
      async (w) => {
        await w(600);
        mostraAviso('Daqui a 5 minutos: mensagem agendada', 'Maria Silva, às 15:00', 'Suporte');
        await w(2300);
        await fechaAviso(w);
        campo.parentElement.classList.add('cheio');
        alvo(campo.parentElement);
        await digita(campo, 'Bom dia, Maria! Passando para lembrar do boleto de amanhã.', w, 26);
        await w(2200);
      },
    ];

    let rodada = 0;
    let mouseDentro = false;
    let focoDentro = false;
    let pausado = false;
    let visivel = false;
    const podeRodar = () => !calmo && !pausado && !mouseDentro && !focoDentro && visivel && !document.hidden;

    async function toca(i) {
      const minha = ++rodada;
      const dorme = (ms) => new Promise((ok) => setTimeout(ok, calmo ? 0 : ms));
      // Pausar congela a cena no meio; trocar de cena cancela esta.
      const w = async (ms) => {
        await dorme(ms);
        while (pausado && minha === rodada) await dorme(200);
        if (minha !== rodada) throw new Error('trocou');
      };
      itens.forEach((li, j) => {
        li.classList.toggle('ativo', j === i);
        li.querySelector('button').setAttribute('aria-expanded', j === i ? 'true' : 'false');
      });
      base();
      try {
        await CENAS[i](w);
        if (calmo) return;
        // segue para a próxima só quando pode (mouse fora, visível, sem pausa)
        while (!podeRodar()) await w(400);
        await w(500);
        toca((i + 1) % CENAS.length);
      } catch {
        /* outra cena começou */
      }
    }

    itens.forEach((li, i) => li.querySelector('button').addEventListener('click', () => toca(i)));
    // Só mouse de verdade e foco pelo teclado seguram a passagem: toque e clique não a travam.
    demo.addEventListener('pointerenter', (e) => {
      if (e.pointerType === 'mouse') mouseDentro = true;
    });
    demo.addEventListener('pointerleave', () => (mouseDentro = false));
    demo.addEventListener('focusin', (e) => {
      if (e.target.matches(':focus-visible')) focoDentro = true;
    });
    demo.addEventListener('focusout', (e) => {
      if (!demo.contains(e.relatedTarget)) focoDentro = false;
    });
    if (!calmo && pausa) {
      pausa.hidden = false;
      pausa.addEventListener('click', () => {
        pausado = !pausado;
        pausa.setAttribute('aria-pressed', String(pausado));
        pausa.querySelector('span').textContent = pausado ? 'Continuar' : 'Pausar';
        pausa.querySelector('path').setAttribute('d', pausado ? 'M8 5l11 7-11 7z' : 'M9 5v14M15 5v14');
      });
    }

    // a janela de 920 px encolhe junto com a coluna (inclusive no celular)
    const ajusta = () => {
      const s = vivo.clientWidth / 920;
      vivo.style.setProperty('--s', String(s));
      vivo.style.height = Math.round(580 * s) + 'px';
    };
    ajusta();
    if ('ResizeObserver' in window) new ResizeObserver(ajusta).observe(vivo);
    else window.addEventListener('resize', ajusta);

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(([e]) => (visivel = e.isIntersecting), { threshold: 0.3 }).observe(demo);
    } else {
      visivel = true;
    }
    demo.classList.add('vivo-pronto');
    toca(0);
  }

  // ---------------------------------------------------------------- frase de impacto
  // Cada palavra acende quando passa da metade de baixo da tela, na ordem de leitura.
  // Com menos movimento (ou sem JS), a frase aparece inteira acesa.
  const frase = document.querySelector('[data-frase]');
  if (frase) {
    const palavras = frase.textContent.trim().split(/\s+/);
    frase.replaceChildren(
      ...palavras.flatMap((w, i) => {
        const span = document.createElement('span');
        span.className = /^Janelix/.test(w) ? 'p marca-p' : 'p';
        span.textContent = w;
        return i ? [document.createTextNode(' '), span] : [span];
      }),
    );
    const spans = [...frase.querySelectorAll('.p')];
    if (calmo || !('IntersectionObserver' in window)) {
      spans.forEach((s) => s.classList.add('acesa'));
    } else {
      let pedido = 0;
      const atualiza = () => {
        pedido = 0;
        const linha = window.innerHeight * 0.72;
        const r = frase.getBoundingClientRect();
        // progresso: 0 quando o topo da frase cruza a linha, 1 quando o fim cruza
        const prog = Math.min(1, Math.max(0, (linha - r.top) / Math.max(1, r.height + window.innerHeight * 0.2)));
        const n = Math.round(prog * spans.length);
        spans.forEach((s, i) => s.classList.toggle('acesa', i < n));
      };
      const pede = () => {
        if (!pedido) pedido = requestAnimationFrame(atualiza);
      };
      // só escuta a rolagem enquanto a frase está na tela
      new IntersectionObserver(([e]) => {
        if (e.isIntersecting) window.addEventListener('scroll', pede, { passive: true });
        else window.removeEventListener('scroll', pede);
        pede();
      }).observe(frase);
    }
  }

  // ---------------------------------------------------------------- entrada ao rolar
  // Cada bloco entra de leve ao chegar na tela. Sem script ou com menos movimento, tudo já aparece.
  if (!calmo && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver(
      (es) =>
        es.forEach((e) => {
          if (!e.isIntersecting) return;
          e.target.classList.add('visto');
          io.unobserve(e.target);
        }),
      { rootMargin: '0px 0px -10% 0px' },
    );
    document.querySelectorAll('.cabeca, .vitrine > li, .cartao, .grupo, .passos > li, .dev, .final-grade > *').forEach((el) => {
      el.style.setProperty('--atraso', ([...el.parentElement.children].indexOf(el) % 4) * 70 + 'ms');
      el.classList.add('revela');
      io.observe(el);
    });
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
