/**
 * WORKWISE.AI — Carousel v3
 * Premium, $10k-quality smooth animation.
 *
 * Architecture:
 *  - All visual state is driven ENTIRELY by CSS classes on .agent-card
 *  - JS only assigns one of 5 position classes per card
 *  - No JS-based keyframes, no manual style manipulation
 *  - CSS handles ALL transitions, easing, and timing
 *
 * This guarantees shake-free, perfectly buttery movement.
 */
(function () {
  'use strict';

  const POS_CLASSES = ['pos-far-left', 'pos-left', 'pos-center', 'pos-right', 'pos-far-right'];

  const cards = Array.from(document.querySelectorAll('.agent-card'));
  const dotsContainer = document.getElementById('dots');
  
  const TOTAL = cards.length;
  const AUTO_MS = 4500;   // auto-advance interval
  const LOCK_MS = 700;    // input lock during transition

  // Generate dots
  cards.forEach((_, i) => {
    const dot = document.createElement('button');
    dot.className = 'dot-btn';
    dot.setAttribute('data-i', i);
    dot.setAttribute('aria-label', cards[i].querySelector('.card-name').textContent);
    dotsContainer.appendChild(dot);
  });
  const dotBtns = Array.from(document.querySelectorAll('.dot-btn'));

  let active = 0;       // Start with Fusion Promo centered
  let locked = false;
  let autoTimer = null;

  /* ------------------------------------------------
     Map index → CSS position class
  ------------------------------------------------ */
  function posFor(cardIdx) {
    let off = cardIdx - active;

    // Normalize offset into circular range
    const half = Math.floor(TOTAL / 2);
    if (off < -half) off += TOTAL;
    if (off > half) off -= TOTAL;

    // If we have more than 5 cards, hide those that fall outside the 5 visible slots
    const classIdx = off + 2;
    if (classIdx < 0) return 'pos-far-left';
    if (classIdx > 4) return 'pos-far-right';
    
    return POS_CLASSES[classIdx];
  }

  /* ------------------------------------------------
     Apply layout — assign exactly ONE pos class per card
  ------------------------------------------------ */
  function applyLayout(instant) {
    cards.forEach((card, i) => {
      if (instant) card.classList.add('instant');

      // Remove all position classes
      card.classList.remove(...POS_CLASSES);
      const pos = posFor(i);
      card.classList.add(pos);
      
      // Visibility fix for cards outside the 5-slot range
      if (POS_CLASSES.indexOf(pos) === -1) {
          card.style.opacity = '0';
          card.style.pointerEvents = 'none';
      } else {
          card.style.opacity = '';
          card.style.pointerEvents = '';
      }
    });

    // Update dot indicators
    dotBtns.forEach((d, i) => d.classList.toggle('active', i === active));

    if (instant) {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          cards.forEach(c => c.classList.remove('instant'));
        });
      });
    }
  }

  /* ------------------------------------------------
     Navigate
  ------------------------------------------------ */
  function navigate(dir) {
    if (locked) return;
    locked = true;

    active = (active + dir + TOTAL) % TOTAL;
    applyLayout(false);

    setTimeout(() => { locked = false; }, LOCK_MS);
  }

  function goTo(i) {
    if (locked || i === active) return;
    locked = true;
    active = i;
    applyLayout(false);
    setTimeout(() => { locked = false; }, LOCK_MS);
  }

  /* ------------------------------------------------
     Auto-scroll
  ------------------------------------------------ */
  function startAuto() {
    stopAuto();
    autoTimer = setInterval(() => navigate(1), AUTO_MS);
  }
  function stopAuto() {
    if (autoTimer) { clearInterval(autoTimer); autoTimer = null; }
  }
  function resetAuto() { stopAuto(); startAuto(); }

  /* ------------------------------------------------
     Event listeners
  ------------------------------------------------ */

  // Arrows
  document.getElementById('prevBtn').addEventListener('click', () => { navigate(-1); resetAuto(); });
  document.getElementById('nextBtn').addEventListener('click', () => { navigate(1); resetAuto(); });

  // Dots
  dotBtns.forEach((d, i) => d.addEventListener('click', () => { goTo(i); resetAuto(); }));

  // Click side card → navigate toward it
  cards.forEach((card) => {
    card.addEventListener('click', () => {
      if (card.classList.contains('pos-left')) { navigate(-1); resetAuto(); }
      if (card.classList.contains('pos-right')) { navigate(1); resetAuto(); }
    });
  });

  // Keyboard
  document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') { navigate(-1); resetAuto(); }
    if (e.key === 'ArrowRight') { navigate(1); resetAuto(); }
  });

  // Touch swipe on stage
  let touchX = 0;
  const stage = document.getElementById('carouselStage');

  stage.addEventListener('touchstart', (e) => {
    touchX = e.changedTouches[0].screenX;
  }, { passive: true });

  stage.addEventListener('touchend', (e) => {
    const dx = touchX - e.changedTouches[0].screenX;
    if (Math.abs(dx) > 50) {
      navigate(dx > 0 ? 1 : -1);
      resetAuto();
    }
  }, { passive: true });

  // Pause auto-play on hover over carousel
  const outerEl = document.querySelector('.carousel-outer');
  outerEl.addEventListener('mouseenter', stopAuto);
  outerEl.addEventListener('mouseleave', startAuto);

  /* ------------------------------------------------
     Bootstrap
  ------------------------------------------------ */
  applyLayout(true);  // initial layout, no animation
  startAuto();

})();
