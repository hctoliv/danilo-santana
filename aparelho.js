/* Páginas de aparelho auditivo: menu, formulário de teste no WhatsApp, revelação e bloqueio de zoom */
(() => {
  const $ = (s, c = document) => c.querySelector(s), $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const WA = '5511971054861';
  const MODEL = document.body.dataset.model || 'GN Danavox';
  const isMobile = () => matchMedia('(max-width:760px)').matches;

  // menu
  const nav = $('#nav'), burger = $('#burger');
  burger.addEventListener('click', () => {
    const o = nav.classList.toggle('open');
    burger.setAttribute('aria-expanded', o);
    document.body.style.overflow = o ? 'hidden' : '';
  });
  $$('#menu a').forEach(a => a.addEventListener('click', () => { nav.classList.remove('open'); document.body.style.overflow = ''; }));

  // formulário -> WhatsApp
  const form = $('#bookForm'), preview = $('#waPreview'), nome = $('#nome');
  const picked = n => $$(`.pills[data-name="${n}"] button.is-on`, form).map(b => b.textContent.trim());
  function msg() {
    const n = nome.value.trim(), quem = picked('quem')[0] || 'mim', uso = picked('uso')[0], exame = picked('exame')[0];
    let m = `Olá, Danilo! ${n ? 'Meu nome é ' + n + '. ' : ''}Vi no site o aparelho auditivo ${MODEL} e gostaria de agendar um teste ${quem === 'mim' ? 'para mim' : 'para um familiar'}.`;
    if (uso) m += `\nAparelho auditivo: ${uso}.`;
    if (exame) m += `\nAudiometria: ${exame}.`;
    m += `\n\nQuais horários você tem disponíveis?`;
    preview.textContent = m;
    return m;
  }
  $$('.pills', form).forEach(g => {
    const single = g.hasAttribute('data-single');
    $$('button', g).forEach(b => b.addEventListener('click', () => {
      if (single) $$('button', g).forEach(x => x.classList.toggle('is-on', x === b));
      else b.classList.toggle('is-on');
      msg();
    }));
  });
  nome.addEventListener('input', msg);
  msg();
  form.addEventListener('submit', e => { e.preventDefault(); window.open(`https://wa.me/${WA}?text=${encodeURIComponent(msg())}`, '_blank', 'noopener'); });
  const fl = $('.wa-float'), book = $('#agendar');
  const tick = () => { const b = book.getBoundingClientRect(), vh = innerHeight; fl.classList.toggle('show', scrollY > vh * .5 && !(b.top < vh && b.bottom > 0)); };
  addEventListener('scroll', tick, { passive: true }); tick();

  // revelação ao rolar
  const els = $$('.pd-for__card, .pd-not, .pd-perks li, .pd-specs__list div, .choose, .pd-faq__item, .book__copy, .book__form, .pd-other');
  els.forEach(el => el.classList.add('rv'));
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(es => es.forEach(x => { if (x.isIntersecting) { x.target.classList.add('in'); io.unobserve(x.target); } }), { rootMargin: '0px 0px -8% 0px' });
    els.forEach(el => io.observe(el));
  } else els.forEach(el => el.classList.add('in'));

  // sem zoom no mobile (iOS ignora user-scalable=no)
  ['gesturestart', 'gesturechange', 'gestureend'].forEach(t => document.addEventListener(t, e => e.preventDefault(), { passive: false }));
  let last = 0;
  document.addEventListener('touchend', e => { const t = Date.now(); if (t - last < 300) e.preventDefault(); last = t; }, { passive: false });
})();
