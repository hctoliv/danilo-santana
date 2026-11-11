(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const WA = '5511971054861';
  let vw = innerWidth, vh = innerHeight;
  const isMobile = () => vw <= 760;

  /* ---------- INTRO (audiometria) ---------- */
  const html = document.documentElement;
  const params = new URLSearchParams(location.search);
  let seen = false;
  try { seen = sessionStorage.getItem('ds-intro') === '1'; } catch (e) {}
  const runIntro = !reduce && (!seen || params.has('intro'));
  const intro = $('#intro');
  const ready = () => document.body.classList.add('ready');
  if (runIntro) {
    html.classList.add('intro-on');
    const path = $('#introWave'), hz = $('#introHz'), labels = $$('.intro__freqs span');
    const freqs = [250, 500, 1000, 2000, 4000, 8000];
    const t0 = performance.now(), DUR = 2600;
    let done = false;
    const finish = () => {
      if (done) return; done = true;
      try { sessionStorage.setItem('ds-intro', '1'); } catch (e) {}
      intro.classList.add('out');
      ready();
      setTimeout(() => { html.classList.remove('intro-on'); intro.remove(); }, 1000);
    };
    const frame = now => {
      if (done) return;
      const t = (now - t0) / DUR;
      const idx = Math.min(5, Math.floor(t * 6));
      labels.forEach((l, i) => l.classList.toggle('on', i <= idx));
      hz.textContent = freqs[idx] >= 1000 ? (freqs[idx] / 1000) + 'k' : freqs[idx];
      const cycles = 2 + idx * 2.2, amp = 28 * (1 - Math.abs(((t * 6) % 1) - .5) * 1.2);
      let d = '';
      for (let x = 0; x <= 600; x += 4) {
        const env = Math.sin(Math.PI * x / 600);
        const y = 40 + Math.sin((x / 600) * cycles * Math.PI * 2 - now / 90) * amp * env;
        d += (x ? 'L' : 'M') + x + ' ' + y.toFixed(1);
      }
      path.setAttribute('d', d);
      if (t >= 1) return finish();
      requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
    $('.intro__skip').addEventListener('click', finish);
    intro.addEventListener('click', finish);
    addEventListener('keydown', finish, { once: true });
  } else {
    intro && intro.remove();
    requestAnimationFrame(ready);
  }

  /* ---------- NAV ---------- */
  const nav = $('#nav'), burger = $('#burger');
  burger.addEventListener('click', () => {
    const o = nav.classList.toggle('open');
    burger.setAttribute('aria-expanded', o);
    document.body.style.overflow = o ? 'hidden' : '';
  });
  $$('#menu a').forEach(a => a.addEventListener('click', () => {
    nav.classList.remove('open'); document.body.style.overflow = '';
  }));
  const darkSecs = $$('.hero, .manifesto, .solutions, .musicians, .book, .foot');

  /* ---------- HERO ---------- */
  const hero = $('#hero'), word = $('.hero__word span'), figure = $('#figure'), copy = $('.hero__copy');
  const canvas = $('#rings'), ctx = canvas.getContext('2d');
  let dpr = Math.min(2, devicePixelRatio || 1);
  let px = 0, py = 0, tpx = 0, tpy = 0;
  addEventListener('pointermove', e => { tpx = e.clientX / vw - .5; tpy = e.clientY / vh - .5; }, { passive: true });
  const sizeCanvas = () => {
    canvas.width = canvas.clientWidth * dpr; canvas.height = canvas.clientHeight * dpr;
  };
  sizeCanvas();
  const rings = [];
  let lastRing = 0;
  const drawRings = (now, heroP) => {
    const w = canvas.width, h = canvas.height;
    ctx.clearRect(0, 0, w, h);
    const r = figure.getBoundingClientRect();
    const cr = canvas.getBoundingClientRect();
    // ear position in the cutout (viewer's right ear)
    const ex = (r.left - cr.left + r.width * .6) * dpr;
    const ey = (r.top - cr.top + r.height * .145) * dpr;
    if (now - lastRing > 900) { rings.push(now); lastRing = now; }
    while (rings.length && now - rings[0] > 7000) rings.shift();
    const maxR = Math.hypot(w, h) * .7;
    ctx.lineWidth = 1.2 * dpr;
    for (const t of rings) {
      const k = (now - t) / 7000;
      const rad = 30 * dpr + k * maxR;
      ctx.strokeStyle = `rgba(185,226,213,${(1 - k) * .28 * (1 - heroP)})`;
      ctx.beginPath(); ctx.arc(ex, ey, rad, 0, Math.PI * 2); ctx.stroke();
    }
    // frequency dots along a horizontal line
    ctx.fillStyle = `rgba(185,226,213,${.5 * (1 - heroP)})`;
    for (let i = 0; i < 6; i++) {
      const a = now / 1400 + i;
      const rr = (60 + i * 70) * dpr;
      ctx.beginPath(); ctx.arc(ex + Math.cos(a) * rr, ey + Math.sin(a) * rr * .9, 2 * dpr, 0, 7); ctx.fill();
    }
  };

  /* ---------- MANIFESTO words ---------- */
  const mText = $('[data-words]');
  const wrapWords = node => {
    [...node.childNodes].forEach(n => {
      if (n.nodeType === 3) {
        const frag = document.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach(p => {
          if (!p) return;
          if (/^\s+$/.test(p)) frag.appendChild(document.createTextNode(p));
          else { const s = document.createElement('span'); s.className = 'w'; s.textContent = p; frag.appendChild(s); }
        });
        n.replaceWith(frag);
      } else if (n.nodeType === 1) wrapWords(n);
    });
  };
  wrapWords(mText);
  const words = $$('.w', mText);

  /* ---------- MUSICIANS horizontal ---------- */
  const mus = $('#musicos'), pin = $('.musicians__pin'), track = $('#track');
  let trackMax = 0;
  const sizeMus = () => {
    if (isMobile()) { mus.style.height = ''; trackMax = 0; track.style.transform = ''; return; }
    trackMax = Math.max(0, track.scrollWidth - vw + 40);
    mus.style.height = (vh + trackMax) + 'px';
  };

  /* ---------- PROCESS steps ---------- */
  const steps = $$('.step'), stepNum = $('#stepNum'), procImgs = $$('.process__img');

  /* ---------- SCROLL LOOP ---------- */
  const waFloat = $('.wa-float'), book = $('#agendar'), simPanelEl = $('#simPanel');
  let heroP = 0;
  const onFrame = now => {
    const sy = scrollY;
    // hero
    const hh = hero.offsetHeight - vh;
    heroP = clamp(sy / Math.max(1, hh));
    px = lerp(px, tpx, .06); py = lerp(py, tpy, .06);
    if (heroP < 1 || sy < hero.offsetHeight) {
      const m = isMobile();
      word.style.transform = `translate3d(${px * -30}px,${heroP * -60 + py * -16}px,0) scale(${1 + heroP * .25})`;
      const base = m ? 'translateX(50%) ' : '';
      figure.style.transform = `${base}translate3d(${px * 18}px,${heroP * 40}px,0) scale(${1 + heroP * .08})`;
      copy.style.opacity = 1 - clamp(heroP * 1.8);
      if (!reduce) drawRings(now, heroP);
    }
    // nav
    let overDark = false;
    for (const s of darkSecs) { const r = s.getBoundingClientRect(); if (r.top <= 40 && r.bottom > 40) { overDark = true; break; } }
    const atTop = sy < 40;
    nav.classList.toggle('solid', !overDark && !atTop);
    nav.classList.toggle('dark', overDark && !atTop && sy > hero.offsetHeight - 80);
    // manifesto words
    const mr = mText.getBoundingClientRect();
    const mp = clamp((vh * .85 - mr.top) / (mr.height + vh * .35));
    const lit = Math.round(mp * words.length);
    for (let i = 0; i < words.length; i++) words[i].classList.toggle('on', i < lit);
    // musicians
    if (trackMax) {
      const r = mus.getBoundingClientRect();
      const p = clamp(-r.top / Math.max(1, mus.offsetHeight - vh));
      track.style.transform = `translate3d(${-p * trackMax}px,0,0)`;
    }
    // process
    let active = 0;
    steps.forEach((s, i) => { const r = s.getBoundingClientRect(); if (r.top < vh * .6) active = i; });
    steps.forEach((s, i) => s.classList.toggle('on', i === active));
    procImgs.forEach((im, i) => im.classList.toggle('on', i === active));
    stepNum.textContent = String(active + 1).padStart(2, '0');
    // float
    const br = book.getBoundingClientRect();
    const sr = simPanelEl.getBoundingClientRect();
    waFloat.classList.toggle('show', sy > vh * .9 && !(br.top < vh && br.bottom > 0) && !(isMobile() && sr.top < vh && sr.bottom > 0));
    requestAnimationFrame(onFrame);
  };
  requestAnimationFrame(onFrame);

  addEventListener('resize', () => {
    vw = innerWidth; vh = innerHeight; sizeCanvas(); sizeMus();
  });
  addEventListener('load', sizeMus);
  sizeMus();

  /* ---------- autoplay videos when visible ---------- */
  const vio = new IntersectionObserver(es => es.forEach(e => {
    const v = e.target;
    if (e.isIntersecting) { v.preload = 'auto'; v.play().catch(() => {}); } else v.pause();
  }), { threshold: .2 });
  $$('video[data-auto]').forEach(v => vio.observe(v));

  /* ---------- reveal ---------- */
  const rvEls = $$('.devices__head > *, .format, .perks__title, .perks__grid li, .choose__copy, .choose__steps li, .choose__cta, .sim__intro, .sim__panel, .process__head, .sol, .reels .h2, .reel, .edu__media, .timeline li, .edu__note, .score, .book__copy, .book__form, .place__info, .solutions .h2, .solutions .lead');
  rvEls.forEach((el, i) => { el.classList.add('rv'); el.style.transitionDelay = (i % 5) * 70 + 'ms'; });
  const rio = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('in'); rio.unobserve(e.target); }
  }), { threshold: .12, rootMargin: '0px 0px -6% 0px' });
  rvEls.forEach(el => rio.observe(el));

  /* ---------- SIMULATOR ---------- */
  const LEVELS = [
    { name: 'Audição normal', desc: 'Você ouve a fala inteira, com consoantes nítidas.', cut: 16000, gain: 0, th: [10, 10, 5, 10, 10, 15] },
    { name: 'Perda leve', desc: 'A voz ainda chega, mas os detalhes somem. É quando a pessoa começa a pedir pra repetir.', cut: 3200, gain: -6, th: [20, 20, 25, 35, 45, 50] },
    { name: 'Perda moderada', desc: 'Conversa em restaurante vira esforço. A TV sobe de volume e o cansaço aparece.', cut: 1400, gain: -15, th: [35, 40, 45, 55, 65, 70] },
    { name: 'Perda severa', desc: 'Sobra só o grave abafado. O cérebro recebe pouco estímulo e deixa de processar a fala.', cut: 520, gain: -26, th: [65, 70, 75, 80, 90, 95] }
  ];
  const range = $('#simRange'), lvlEl = $('#simLevel'), descEl = $('#simDesc'), cap = $('#simCaption');
  const ticks = $$('.sim__ticks button'), playBtn = $('#simPlay');
  const X0 = 80, X1 = 560, Y0 = 20, Y1 = 310, DB0 = -10, DB1 = 120;
  const fx = i => X0 + i * (X1 - X0) / 5;
  const fy = db => Y0 + (db - DB0) / (DB1 - DB0) * (Y1 - Y0);
  // grid
  const grid = $('#agGrid');
  let g = '';
  ['250', '500', '1k', '2k', '4k', '8k'].forEach((f, i) => {
    g += `<line x1="${fx(i)}" y1="${Y0}" x2="${fx(i)}" y2="${Y1}"/><text x="${fx(i)}" y="${Y1 + 16}" text-anchor="middle">${f}</text>`;
  });
  for (let db = 0; db <= 120; db += 20) g += `<line x1="${X0 - 10}" y1="${fy(db)}" x2="${X1 + 10}" y2="${fy(db)}"/><text x="${X0 - 16}" y="${fy(db) + 4}" text-anchor="end">${db}</text>`;
  g += `<text x="${X0 - 16}" y="${Y0 - 6}" text-anchor="end">dB</text>`;
  grid.innerHTML = g;
  const agLine = $('#agLine'), agArea = $('#agArea'), agDots = $('#agDots');
  agDots.innerHTML = Array.from({ length: 6 }, () => '<circle r="6"/>').join('');
  const dots = $$('circle', agDots);

  let actx, src, filt, shelf, gainN, analyser, audio, freqData;
  const curLevel = () => {
    const v = +range.value, i = Math.min(2, Math.floor(v)), t = v - i;
    const a = LEVELS[i], b = LEVELS[i + 1];
    return {
      cut: Math.exp(lerp(Math.log(a.cut), Math.log(b.cut), t)),
      gain: lerp(a.gain, b.gain, t),
      th: a.th.map((x, k) => lerp(x, b.th[k], t)),
      idx: Math.round(v)
    };
  };
  const updateSim = () => {
    const L = curLevel();
    const pts = L.th.map((db, i) => [fx(i), fy(db)]);
    let d = `M${pts[0][0]} ${pts[0][1]}`;
    for (let i = 1; i < pts.length; i++) {
      const [x0, y0] = pts[i - 1], [x1, y1] = pts[i], mx = (x0 + x1) / 2;
      d += ` C${mx} ${y0} ${mx} ${y1} ${x1} ${y1}`;
    }
    agLine.setAttribute('d', d);
    agArea.setAttribute('d', `${d} L${X1} ${Y0} L${X0} ${Y0} Z`);
    pts.forEach((p, i) => { dots[i].setAttribute('cx', p[0]); dots[i].setAttribute('cy', p[1]); });
    const lv = LEVELS[L.idx];
    lvlEl.textContent = lv.name; descEl.textContent = lv.desc;
    ticks.forEach((b, i) => b.classList.toggle('on', i === L.idx));
    const v = +range.value;
    cap.style.filter = `blur(${v * 1.3}px)`; cap.style.opacity = 1 - v * .2;
    if (actx) {
      const t = actx.currentTime;
      filt.frequency.setTargetAtTime(L.cut, t, .05);
      shelf.gain.setTargetAtTime(v > 0 ? -10 * v : 0, t, .05);
      gainN.gain.setTargetAtTime(Math.pow(10, L.gain / 20), t, .05);
    }
  };
  range.addEventListener('input', updateSim);
  ticks.forEach(b => b.addEventListener('click', () => {
    const target = +b.dataset.v, from = +range.value, t0 = performance.now();
    const step = now => {
      const k = clamp((now - t0) / 500), e = 1 - Math.pow(1 - k, 3);
      range.value = lerp(from, target, e); updateSim();
      if (k < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }));
  updateSim();

  const spec = $('#spectrum'), sctx = spec.getContext('2d');
  const sizeSpec = () => { spec.width = spec.clientWidth * dpr; spec.height = spec.clientHeight * dpr; };
  sizeSpec(); addEventListener('resize', sizeSpec);
  let specOn = false;
  const drawSpec = () => {
    const w = spec.width, h = spec.height;
    sctx.clearRect(0, 0, w, h);
    const bars = 64;
    if (analyser) analyser.getByteFrequencyData(freqData);
    const bw = w / bars;
    for (let i = 0; i < bars; i++) {
      // log-ish bin mapping
      const bin = analyser ? Math.floor(Math.pow(i / bars, 1.8) * freqData.length * .8) : 0;
      const val = analyser ? freqData[bin] / 255 : 0;
      const idle = .04 + .03 * Math.sin(performance.now() / 400 + i * .4);
      const bh = Math.max(idle, val) * h * .9;
      sctx.fillStyle = `rgba(185,226,213,${.35 + val * .65})`;
      sctx.fillRect(i * bw + 1, h - bh, bw - 2, bh);
    }
    requestAnimationFrame(drawSpec);
  };
  const sio = new IntersectionObserver(es => { if (es[0].isIntersecting && !specOn) { specOn = true; requestAnimationFrame(drawSpec); } });
  sio.observe(spec);

  const initAudio = () => {
    audio = new Audio('media/voz.m4a');
    audio.loop = true; audio.crossOrigin = 'anonymous';
    actx = new (window.AudioContext || window.webkitAudioContext)();
    src = actx.createMediaElementSource(audio);
    filt = actx.createBiquadFilter(); filt.type = 'lowpass'; filt.Q.value = .7;
    shelf = actx.createBiquadFilter(); shelf.type = 'highshelf'; shelf.frequency.value = 1500;
    gainN = actx.createGain();
    analyser = actx.createAnalyser(); analyser.fftSize = 1024; analyser.smoothingTimeConstant = .8;
    freqData = new Uint8Array(analyser.frequencyBinCount);
    src.connect(filt).connect(shelf).connect(gainN).connect(analyser).connect(actx.destination);
    updateSim();
  };
  playBtn.addEventListener('click', () => {
    if (!actx) initAudio();
    if (actx.state === 'suspended') actx.resume();
    if (audio.paused) {
      stopReels();
      audio.play(); playBtn.classList.add('on');
    } else { audio.pause(); playBtn.classList.remove('on'); }
  });

  /* ---------- SOLUÇÕES accordion ---------- */
  $$('.sol__item').forEach(b => b.addEventListener('click', () => {
    const open = b.classList.contains('is-open');
    $$('.sol__item').forEach(x => x.classList.remove('is-open'));
    if (!open) b.classList.add('is-open');
  }));

  /* ---------- REELS ---------- */
  const reels = $$('.reel');
  function stopReels(except) {
    reels.forEach(r => { if (r !== except) { const v = $('video', r); v.pause(); r.classList.remove('playing'); } });
  }
  reels.forEach(r => {
    const v = $('video', r);
    const toggle = () => {
      if (!v.src) v.src = r.dataset.src;
      if (v.paused) {
        stopReels(r);
        if (audio && !audio.paused) { audio.pause(); playBtn.classList.remove('playing', 'on'); }
        v.play(); r.classList.add('playing');
      } else { v.pause(); r.classList.remove('playing'); }
    };
    $('.reel__btn', r).addEventListener('click', toggle);
    v.addEventListener('click', toggle);
    v.addEventListener('ended', () => r.classList.remove('playing'));
  });

  /* ---------- BOOKING ---------- */
  const form = $('#bookForm'), preview = $('#waPreview'), nome = $('#nome');
  $$('.pills', form).forEach(group => {
    const single = group.hasAttribute('data-single');
    $$('button', group).forEach(b => b.addEventListener('click', () => {
      if (single) { $$('button', group).forEach(x => x.classList.toggle('is-on', x === b && !b.classList.contains('is-on') ? true : x === b)); }
      else b.classList.toggle('is-on');
      buildMsg();
    }));
  });
  const picked = name => $$(`.pills[data-name="${name}"] button.is-on`, form).map(b => b.textContent.trim());
  function buildMsg() {
    const n = nome.value.trim();
    const quem = picked('quem')[0] || 'mim';
    const sinais = picked('sinais');
    const exame = picked('exame')[0];
    const soMusico = sinais.length === 1 && /músico/.test(sinais[0]);
    let m = `Olá, Danilo! ${n ? 'Meu nome é ' + n + '. ' : ''}${soMusico ? 'Gostaria de agendar um horário' : 'Gostaria de agendar um teste com o aparelho auditivo Danavox Boreal'} ${quem === 'mim' ? 'para mim' : 'para um familiar'}.`;
    if (sinais.length) m += `\n\nO que tenho percebido: ${sinais.join(', ')}.`;
    if (exame) m += `\nAudiometria: ${exame}.`;
    m += `\n\nQuais horários você tem disponíveis?`;
    preview.textContent = m;
    return m;
  }
  nome.addEventListener('input', buildMsg);
  buildMsg();
  form.addEventListener('submit', e => {
    e.preventDefault();
    window.open(`https://wa.me/${WA}?text=${encodeURIComponent(buildMsg())}`, '_blank', 'noopener');
  });
  ['musico', 'boreal'].forEach(k => $$('[data-pre="' + k + '"]').forEach(a => a.addEventListener('click', () => {
    const b = $('[data-key="' + k + '"]', form); if (b && !b.classList.contains('is-on')) { b.classList.add('is-on'); buildMsg(); }
  })));
  // botão flutuante "Fale comigo" vai direto para o WhatsApp (href no HTML)

  /* ---------- OPEN / CLOSED (horário de São Paulo) ---------- */
  const HOURS = { 1: [14, 18], 2: [9, 18], 3: null, 4: [9, 18], 5: [14, 18], 6: null, 0: null };
  const NAMES = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
  const spNow = () => {
    const p = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Sao_Paulo', weekday: 'short', hour: 'numeric', minute: 'numeric', hour12: false }).formatToParts(new Date());
    const wd = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(p.find(x => x.type === 'weekday').value);
    const h = +p.find(x => x.type === 'hour').value % 24, m = +p.find(x => x.type === 'minute').value;
    return { wd, t: h + m / 60 };
  };
  const status = () => {
    const { wd, t } = spNow();
    const st = $('#status'), tx = $('#statusTxt');
    $$('#hours li').forEach(li => li.classList.toggle('today', +li.dataset.d === wd || (li.dataset.d === '6' && (wd === 6 || wd === 0))));
    const today = HOURS[wd];
    if (today && t >= today[0] && t < today[1]) {
      st.classList.add('open'); tx.textContent = `Aberto agora · fecha às ${today[1]}h`;
      return;
    }
    st.classList.remove('open');
    for (let k = 0; k < 8; k++) {
      const d = (wd + k) % 7, hrs = HOURS[d];
      if (!hrs) continue;
      if (k === 0 && t >= hrs[0]) continue;
      tx.textContent = `Fechado agora · abre ${k === 0 ? 'hoje' : k === 1 ? 'amanhã' : NAMES[d]} às ${hrs[0]}h`;
      return;
    }
  };
  status(); setInterval(status, 60000);
})();

/* sem zoom no mobile (iOS ignora user-scalable=no) */
['gesturestart', 'gesturechange', 'gestureend'].forEach(t => document.addEventListener(t, e => e.preventDefault(), { passive: false }));
(() => { let last = 0; document.addEventListener('touchend', e => { const n = Date.now(); if (n - last < 300) e.preventDefault(); last = n; }, { passive: false }); })();
