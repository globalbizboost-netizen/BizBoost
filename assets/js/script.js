/* ===== Enhanced interaction script for BizBoost =====
   - Smooth eased parallax (requestAnimationFrame)
   - IntersectionObserver-based reveal (stagger + directional)
   - Counters that start when visible (ease-out)
   - Tilt on hover (cards)
   - Magnetic button micro-interaction (visual)
   - Section theme switching on scroll
   - Respects prefers-reduced-motion
*/

(() => {
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Smooth Parallax (eased) ---------- */
  const parallaxEls = Array.from(document.querySelectorAll('.parallax'));
  let pTargetX = 0, pTargetY = 0, pX = 0, pY = 0;
  if (!prefersReduced && parallaxEls.length) {
    window.addEventListener('mousemove', (e) => {
      pTargetX = (e.clientX / window.innerWidth - 0.5) * 18;
      pTargetY = (e.clientY / window.innerHeight - 0.5) * 12;
    });
    (function rafParallax(){
      pX += (pTargetX - pX) * 0.08;
      pY += (pTargetY - pY) * 0.08;
      parallaxEls.forEach(el=>{
        el.style.transform = `translate3d(${pX}px, ${pY}px, 0)`;
      });
      requestAnimationFrame(rafParallax);
    })();
  }

  /* ---------- Smooth scroll for anchor links (native behavior fallback) ---------- */
  document.querySelectorAll('a[href^="#"]').forEach(a=>{
    a.addEventListener('click', e=>{
      const id = a.getAttribute('href').slice(1);
      const el = document.getElementById(id);
      if(el){ e.preventDefault(); el.scrollIntoView({behavior:'smooth', block:'start'}); }
    });
  });

  /* ---------- Reveal on scroll with IntersectionObserver ---------- */
  const revealOptions = { threshold: 0.14 };
  const revealObserver = new IntersectionObserver((entries, obs) => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        const node = entry.target;
        // allow data-direction to drive animation
        const dir = node.dataset.reveal || '';
        if (dir === 'left') node.classList.add('reveal-left');
        else if (dir === 'right') node.classList.add('reveal-right');
        else if (dir === 'up') node.classList.add('reveal-up');

        // stagger using data-delay or index fallback
        const delay = parseInt(node.datasetDelay || node.dataset.delay || 0, 10) || (i * 80);
        setTimeout(() => node.classList.add('in-view'), delay);
        obs.unobserve(node);
      }
    });
  }, revealOptions);

  // target elements
  const revealTargets = document.querySelectorAll('.pitch-card, .price-card, .glass-card, .reveal, .card-adv');
  revealTargets.forEach(el => {
    el.classList.add('hidden-reveal');
    revealObserver.observe(el);
  });

  /* ---------- Eased Counter when visible ---------- */
  const counterObserver = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if(entry.isIntersecting){
        const el = entry.target;
        const target = parseInt(el.datasetTarget || el.getAttribute('data-target') || el.textContent.replace(/\D/g,''), 10) || 0;
        if(!el.__counting && target > 0){
          el.__counting = true;
          const duration = parseInt(el.datasetDuration || 1800, 10);
          const startTime = performance.now();
          function tick(now){
            const t = Math.min((now - startTime)/duration, 1);
            const eased = 1 - Math.pow(1 - t, 3); // easeOutCubic
            const value = Math.floor(eased * target);
            el.textContent = value.toLocaleString();
            if(t < 1) requestAnimationFrame(tick);
            else el.textContent = target.toLocaleString();
          }
          requestAnimationFrame(tick);
        }
        obs.unobserve(el);
      }
    });
  }, {threshold:0.6});

  document.querySelectorAll('.counter').forEach(el => counterObserver.observe(el));


  /* ---------- Tilt cards (mouse) ---------- */
  function enableTilt(selector, maxRotate=6){
    document.querySelectorAll(selector).forEach(card=>{
      if(prefersReduced) return;
      let rect;
      card.addEventListener('mousemove', (ev)=>{
        rect = rect || card.getBoundingClientRect();
        const x = (ev.clientX - rect.left) / rect.width;
        const y = (ev.clientY - rect.top) / rect.height;
        const rotateY = (x - 0.5) * (maxRotate*2);
        const rotateX = (0.5 - y) * (maxRotate*2);
        card.style.transform = `perspective(900px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.03)`;
      });
      card.addEventListener('mouseleave', ()=>{
        card.style.transform = '';
      });
      // touch fallback: no tilt
    });
  }
  enableTilt('.tilt, .pitch-card, .card-adv');

  /* ---------- Magnetic button micro-interaction (visual) ---------- */
  document.querySelectorAll('.btn-magnetic').forEach(btn=>{
    if(prefersReduced) return;
    btn.addEventListener('mousemove', e=>{
      const rect = btn.getBoundingClientRect();
      const offsetX = (e.clientX - rect.left) - rect.width/2;
      const offsetY = (e.clientY - rect.top) - rect.height/2;
      btn.style.transform = `translate(${offsetX*0.06}px, ${offsetY*0.04}px) scale(1.02)`;
    });
    btn.addEventListener('mouseleave', ()=> btn.style.transform = '');
  });

  /* ---------- Floating light elements fallback for perf ---------- */
  // Use CSS .float for continuous subtle float

  /* ---------- Section theme switching (background fade) ---------- */
  const sectionThemes = document.querySelectorAll('[data-theme]');
  if(sectionThemes.length){
    const themeObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry=>{
        if(entry.isIntersecting){
          const t = entry.target.dataset.theme;
          document.body.classList.remove('section-theme-1','section-theme-2');
          if(t) document.body.classList.add(t);
        }
      });
    }, {threshold: 0.26});
    sectionThemes.forEach(s => themeObserver.observe(s));
  }

  /* ---------- Navbar blur on scroll ---------- */
  const nav = document.querySelector('.navbar');
  if(nav){
    const onScrollNav = () => {
      if(window.scrollY > 40) nav.classList.add('scrolled');
      else nav.classList.remove('scrolled');
    };
    window.addEventListener('scroll', onScrollNav, {passive:true});
    onScrollNav();
  }

  /* ---------- Bootstrap toast smooth init (if present) ---------- */
  try {
    const toastTrigger = document.getElementById('liveToastBtn');
    const toastLiveExample = document.getElementById('liveToast');
    if(toastTrigger && toastLiveExample){
      const t = bootstrap.Toast.getOrCreateInstance(toastLiveExample, {animation:true, autohide:true, delay:3000});
      toastTrigger.addEventListener('click', ()=> t.show());
    }
  } catch(e){ /* bootstrap not present */ }

  /* ---------- Accessibility: if reduced motion, remove heavy transforms ---------- */
  if(prefersReduced){
    document.documentElement.classList.add('reduced-motion');
    // quick cleanup
    document.querySelectorAll('.parallax, .tilt, .btn-magnetic').forEach(el => el.style.transform = '');
  }
})();
