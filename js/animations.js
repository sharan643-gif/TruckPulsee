/* ═══════════════════════════════════════════════════════════════
   ANIMATIONS — Spring physics engine & transition utilities
   ═══════════════════════════════════════════════════════════════ */

const Animations = (() => {
  'use strict';

  /* ─── Spring Physics ───
     Simulates a damped harmonic oscillator.
     Returns an object { x, velocity } each frame. */
  function springAnimation({ from, to, config = {} }) {
    const {
      stiffness = 170,
      damping = 26,
      mass = 1,
      onUpdate,
      onComplete,
      threshold = 0.01,
    } = config;

    let position = from;
    let velocity = 0;
    let rafId = null;
    let lastTime = null;

    function tick(timestamp) {
      if (lastTime === null) lastTime = timestamp;
      const dt = Math.min((timestamp - lastTime) / 1000, 0.064); // cap at 64ms
      lastTime = timestamp;

      // Spring force: F = -k * x - d * v
      const displacement = position - to;
      const springForce = -stiffness * displacement;
      const dampingForce = -damping * velocity;
      const acceleration = (springForce + dampingForce) / mass;

      velocity += acceleration * dt;
      position += velocity * dt;

      if (onUpdate) onUpdate(position, velocity);

      // Check if settled
      if (Math.abs(velocity) < threshold && Math.abs(displacement) < threshold) {
        position = to;
        if (onUpdate) onUpdate(position, velocity);
        if (onComplete) onComplete();
        return;
      }

      rafId = requestAnimationFrame(tick);
    }

    rafId = requestAnimationFrame(tick);

    return {
      stop: () => {
        if (rafId) cancelAnimationFrame(rafId);
      },
    };
  }

  /* ─── Inertia (momentum) animation ───
     Continues motion after drag release with friction decay. */
  function inertiaAnimation({ from, velocity, friction = 0.95, onUpdate, onComplete }) {
    let pos = from;
    let vel = velocity;
    let rafId = null;

    function tick() {
      vel *= friction;
      pos += vel;

      if (onUpdate) onUpdate(pos, vel);

      if (Math.abs(vel) < 0.1) {
        if (onComplete) onComplete(pos);
        return;
      }

      rafId = requestAnimationFrame(tick);
    }

    rafId = requestAnimationFrame(tick);

    return {
      stop: () => {
        if (rafId) cancelAnimationFrame(rafId);
      },
    };
  }

  /* ─── Smooth number counter ─── */
  function countTo(element, from, to, duration = 800) {
    const start = performance.now();
    function tick(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(from + (to - from) * eased);
      element.textContent = current;
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  /* ─── Intersection Observer fade-in ─── */
  function observeFadeIn(selector, options = {}) {
    const els = document.querySelectorAll(selector);
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('page-enter');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, ...options }
    );
    els.forEach((el) => observer.observe(el));
  }

  /* ─── Touch drag with spring snap-back ─── */
  function makeDraggable(element, config = {}) {
    const { axis = 'y', onDrag, onRelease } = config;
    let startPos = 0;
    let startOffset = 0;
    let isDragging = false;

    function onTouchStart(e) {
      isDragging = true;
      const touch = e.touches[0];
      startPos = axis === 'x' ? touch.clientX : touch.clientY;
      const transform = getComputedStyle(element).transform;
      const matrix = new DOMMatrix(transform);
      startOffset = axis === 'x' ? matrix.m41 : matrix.m42;
    }

    function onTouchMove(e) {
      if (!isDragging) return;
      e.preventDefault();
      const touch = e.touches[0];
      const current = axis === 'x' ? touch.clientX : touch.clientY;
      const delta = current - startPos + startOffset;

      if (onDrag) onDrag(delta);
    }

    function onTouchEnd() {
      if (!isDragging) return;
      isDragging = false;
      if (onRelease) onRelease();
    }

    element.addEventListener('touchstart', onTouchStart, { passive: true });
    element.addEventListener('touchmove', onTouchMove, { passive: false });
    element.addEventListener('touchend', onTouchEnd, { passive: true });
  }

  return {
    spring: springAnimation,
    inertia: inertiaAnimation,
    countTo,
    observeFadeIn,
    makeDraggable,
  };
})();
