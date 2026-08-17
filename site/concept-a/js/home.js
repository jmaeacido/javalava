/* ===========================================================
   Java Lava — Concept A · HOMEPAGE animation layer
   Loads AFTER site.js (which owns loader, drawer, nav, .reveal,
   [data-hero] intro and [data-parallax]). This file adds the
   richer, homepage-only motion. Every JS-driven hidden state is
   set via gsap.set(), so with no GSAP the page renders fully.
   =========================================================== */
(function () {
  'use strict';
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = matchMedia('(hover:hover) and (pointer:fine)').matches;
  var hasGSAP = !!window.gsap;
  var nativeScroll = !!document.querySelector('.merch-band');

  /* ---------- deterministic embers (stable for screenshots) ---------- */
  (function () {
    var box = document.getElementById('embers');
    if (!box || reduce) return;
    for (var i = 0; i < 22; i++) {
      var e = document.createElement('span');
      e.className = 'ember';
      var s = 2 + (i % 5);                     // 2–6px
      var left = (i * 4.37 + 2) % 97;          // spread across width
      var dur = 7 + (i % 7);                   // 7–13s
      var delay = (i % 11) * 0.8;              // staggered
      e.style.cssText = 'width:' + s + 'px;height:' + s + 'px;left:' + left +
        '%;animation-duration:' + dur + 's;animation-delay:' + delay + 's';
      box.appendChild(e);
    }
  })();

  /* ---------- hero background video: normal 0:00→0:01, then slow-mo ---------- */
  (function () {
    var video = document.querySelector('.hero-bg-video');
    if (!video) return;
    var slowAt = parseFloat(video.dataset.heroStart || '1');
    if (!Number.isFinite(slowAt) || slowAt < 0) slowAt = 1;
    var slowRate = reduce ? 1 : parseFloat(video.dataset.heroRate || '0.62');
    if (!Number.isFinite(slowRate) || slowRate <= 0) slowRate = 0.62;
    var loopEnd = parseFloat(video.dataset.heroLoopEnd || '');
    var hasLoopEnd = !reduce && Number.isFinite(loopEnd) && loopEnd > slowAt;
    var lastRate;

    function applyRate() {
      var next = reduce ? 1 : (video.currentTime >= slowAt ? slowRate : 1);
      if (next === lastRate) return;
      lastRate = next;
      try { video.playbackRate = next; } catch (e) { /* ignore */ }
    }

    video.addEventListener('loadedmetadata', function () {
      lastRate = null;
      applyRate();
    });
    video.addEventListener('play', function () {
      lastRate = null;
      applyRate();
    });
    video.addEventListener('timeupdate', function () {
      applyRate();
      if (hasLoopEnd && video.currentTime >= loopEnd - 0.05) {
        video.currentTime = 0;
        lastRate = null;
        applyRate();
      }
    });
    applyRate();
  })();

  /* ---------- smooth scroll (Lenis) wired into GSAP ---------- */
  var lenis = null;
  if (window.Lenis && !reduce && !nativeScroll) {
    lenis = new Lenis({ lerp: 0.1, smoothWheel: true, wheelMultiplier: 1 });
    if (hasGSAP) {
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
      gsap.ticker.lagSmoothing(0);
    } else {
      var raf = function (t) { lenis.raf(t); requestAnimationFrame(raf); };
      requestAnimationFrame(raf);
    }
    // in-page anchor links → smooth Lenis scroll
    document.querySelectorAll('a[href^="#"]').forEach(function (a) {
      a.addEventListener('click', function (ev) {
        var id = a.getAttribute('href');
        if (id.length < 2) return;
        var t = document.querySelector(id);
        if (t) { ev.preventDefault(); lenis.scrollTo(t, { offset: -70 }); }
      });
    });
  }

  /* ---------- scroll UI: progress bar · nav state · marquee skew ---------- */
  var bar = document.querySelector('.scroll-progress');
  var nav = document.querySelector('nav.site');
  var marq = document.querySelector('.marquee');
  var skewT;
  function scrollUI(velocity) {
    var st = window.scrollY || document.documentElement.scrollTop || 0;
    var h = document.documentElement.scrollHeight - window.innerHeight;
    var p = h > 0 ? st / h : 0;
    if (bar) bar.style.transform = 'scaleX(' + p.toFixed(4) + ')';
    if (nav && !nav.classList.contains('solid')) nav.classList.toggle('scrolled', st > 60);
    if (marq && !reduce) {
      var sk = Math.max(-5, Math.min(5, (velocity || 0) * 0.45));
      marq.style.transform = 'skewX(' + sk.toFixed(2) + 'deg)';
      clearTimeout(skewT);
      skewT = setTimeout(function () { marq.style.transform = 'skewX(0deg)'; }, 140);
    }
  }
  if (lenis) {
    lenis.on('scroll', function (e) { scrollUI(e.velocity); });
  } else {
    var lastY = window.scrollY || 0;
    window.addEventListener('scroll', function () {
      var y = window.scrollY || 0;
      scrollUI(y - lastY);
      lastY = y;
    }, { passive: true });
  }
  scrollUI(0);

  /* newsletter capture lives in site.js (shared across pages) */

  /* =========================================================
     Everything below is GSAP-only. Without GSAP the markup is
     already in its final, visible state — nothing to do.
     ========================================================= */
  if (!hasGSAP) return;
  gsap.registerPlugin(ScrollTrigger);

  /* hero content parallax + fade as it scrolls away */
  if (document.querySelector('.hero .content')) {
    gsap.to('.hero .content', {
      yPercent: 16, autoAlpha: .25, ease: 'none',
      scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true }
    });
  }
  /* second hero layer drifts slower than the bg for depth */
  if (document.querySelector('.hero .glow')) {
    gsap.to('.hero .glow', {
      yPercent: 26, ease: 'none',
      scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true }
    });
  }

  /* word-rise split headings */
  document.querySelectorAll('[data-split]').forEach(function (el) {
    var words = el.textContent.trim().split(/\s+/);
    el.textContent = '';
    words.forEach(function (word, i) {
      var w = document.createElement('span'); w.className = 'w';
      var inner = document.createElement('span'); inner.textContent = word;
      w.appendChild(inner); el.appendChild(w);
      if (i < words.length - 1) el.appendChild(document.createTextNode(' '));
    });
    var spans = el.querySelectorAll('.w > span');
    gsap.set(spans, { yPercent: 118 });
    gsap.to(spans, {
      yPercent: 0, duration: .9, ease: 'power3.out', stagger: .07,
      scrollTrigger: { trigger: el, start: 'top 86%' }
    });
  });

  /* image clip-path reveal + gentle inner parallax */
  gsap.utils.toArray('.story-img').forEach(function (boxEl) {
    var img = boxEl.querySelector('img,video');
    gsap.set(boxEl, { clipPath: 'inset(100% 0% 0% 0%)' });
    gsap.to(boxEl, {
      clipPath: 'inset(0% 0% 0% 0%)', duration: 1.2, ease: 'power3.out',
      scrollTrigger: { trigger: boxEl, start: 'top 84%' }
    });
    if (img && img.tagName !== 'VIDEO') gsap.fromTo(img, { yPercent: -8, scale: 1.12 }, {
      yPercent: 8, scale: 1.12, ease: 'none',
      scrollTrigger: { trigger: boxEl, start: 'top bottom', end: 'bottom top', scrub: true }
    });
  });

  /* product section: full-bleed bg parallax */
  var productBg = document.querySelector('.product-bg');
  if (productBg) {
    gsap.fromTo(productBg, { yPercent: -4, scale: 1 }, {
      yPercent: 4, scale: 1, ease: 'none',
      scrollTrigger: { trigger: '.product', start: 'top bottom', end: 'bottom top', scrub: true }
    });
  }

  /* count-up stats */
  gsap.utils.toArray('[data-count]').forEach(function (el) {
    var end = parseFloat(el.dataset.count);
    var dec = parseInt(el.dataset.decimals || '0', 10);
    var pre = el.dataset.prefix || '', suf = el.dataset.suffix || '';
    var o = { v: 0 };
    el.textContent = pre + (0).toFixed(dec) + suf;
    gsap.to(o, {
      v: end, duration: 1.7, ease: 'power2.out',
      scrollTrigger: { trigger: el, start: 'top 90%' },
      onUpdate: function () { el.textContent = pre + o.v.toFixed(dec) + suf; }
    });
  });

  /* tasting-note bars fill to their inline width */
  gsap.utils.toArray('.taste-bar .fill').forEach(function (fill) {
    var target = fill.style.width || (fill.dataset.val || 0) + '%';
    gsap.set(fill, { width: 0 });
    gsap.to(fill, {
      width: target, duration: 1.3, ease: 'power3.out',
      scrollTrigger: { trigger: fill, start: 'top 92%' }
    });
  });

  /* flavor underline draws in */
  if (document.querySelector('.flavor-underline')) {
    gsap.fromTo('.flavor-underline', { scaleX: 0 }, {
      scaleX: 1, duration: 1.1, ease: 'power3.out',
      scrollTrigger: { trigger: '.flavor', start: 'top 70%' }
    });
  }

  /* magnetic buttons (hero CTAs) */
  if (fine && !reduce) {
    document.querySelectorAll('[data-magnetic]').forEach(function (btn) {
      btn.addEventListener('mousemove', function (e) {
        var r = btn.getBoundingClientRect();
        var x = e.clientX - (r.left + r.width / 2);
        var y = e.clientY - (r.top + r.height / 2);
        gsap.to(btn, { x: x * 0.4, y: y * 0.5, duration: .4, ease: 'power3.out' });
      });
      btn.addEventListener('mouseleave', function () {
        gsap.to(btn, { x: 0, y: 0, duration: .6, ease: 'elastic.out(1,0.4)' });
      });
    });

    /* 3D tilt cards */
    document.querySelectorAll('[data-tilt]').forEach(function (card) {
      card.addEventListener('mousemove', function (e) {
        var r = card.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width - .5;
        var py = (e.clientY - r.top) / r.height - .5;
        gsap.to(card, {
          rotateY: px * 14, rotateX: -py * 14, transformPerspective: 850,
          transformOrigin: 'center', duration: .4, ease: 'power2.out'
        });
      });
      card.addEventListener('mouseleave', function () {
        gsap.to(card, { rotateX: 0, rotateY: 0, duration: .7, ease: 'power3.out' });
      });
    });
  }

  /* recalc trigger positions once fonts/images settle */
  window.addEventListener('load', function () { ScrollTrigger.refresh(); });
})();
