/* Subtle, progressively enhanced motion for the academic homepage. */
(function () {
  'use strict';

  function init() {
    var content = document.querySelector('.page__content .intro-block');
    if (!content || !window.matchMedia) return;
    var preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    var running = new Set();
    var observer;
    var pendingFrame = false;
    var links = Array.from(document.querySelectorAll('#site-nav li:not(.masthead__menu-home-item) a'));
    var sections = links.map(function (link) {
      var url = new URL(link.href, window.location.href);
      if (url.origin !== location.origin || url.pathname !== location.pathname || !url.hash) return null;
      var target = document.getElementById(url.hash.slice(1));
      return target ? { link: link, target: target } : null;
    }).filter(Boolean);

    function update() {
      pendingFrame = false;
      var viewport = document.documentElement.clientHeight;
      var distance = Math.max(0, document.documentElement.scrollHeight - viewport);
      var position = Math.max(0, window.scrollY || 0);
      var active = sections[0];
      var masthead = document.querySelector('.masthead');
      var threshold = (masthead ? masthead.getBoundingClientRect().height : 60) + 48;
      sections.forEach(function (section) {
        if (section.target.getBoundingClientRect().top <= threshold) active = section;
      });
      if (distance > 0 && position >= distance - 2) active = sections[sections.length - 1];
      sections.forEach(function (section) {
        if (section === active) section.link.setAttribute('aria-current', 'location');
        else section.link.removeAttribute('aria-current');
      });
    }

    function scheduleUpdate() {
      if (!pendingFrame) {
        pendingFrame = true;
        window.requestAnimationFrame(update);
      }
    }

    function reveal(element) {
      if (preference.matches || !element.animate || element.matches(':focus-within')) return;
      var animation = element.animate([
        { opacity: 0.35, transform: 'translateY(12px)' },
        { opacity: 1, transform: 'translateY(0)' }
      ], { duration: 460, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' });
      running.add(animation);
      animation.onfinish = animation.oncancel = function () { running.delete(animation); };
    }

    function applyPreference() {
      if (observer) observer.disconnect();
      running.forEach(function (animation) { animation.cancel(); });
      running.clear();
      // Keep the existing navigation plugin, with instant jumps when motion is reduced.
      if (window.jQuery && window.jQuery.fn.smoothScroll) {
        window.jQuery('a').smoothScroll('options', { speed: preference.matches ? 0 : 400 });
      }
      if (preference.matches || !('IntersectionObserver' in window)) return;
      observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          observer.unobserve(entry.target);
          reveal(entry.target);
        });
      }, { threshold: 0.08 });
      document.querySelectorAll('.publication-card, .software-card, .honor-item, .education-item').forEach(function (element) {
        // Content stays visible by default, even if JS or animation support is unavailable.
        if (element.getBoundingClientRect().top >= window.innerHeight) observer.observe(element);
      });
    }

    applyPreference();
    reveal(content);
    if (preference.addEventListener) preference.addEventListener('change', applyPreference);
    else if (preference.addListener) preference.addListener(applyPreference);
    window.addEventListener('scroll', scheduleUpdate, { passive: true });
    window.addEventListener('resize', scheduleUpdate);
    window.addEventListener('pageshow', scheduleUpdate);
    if ('ResizeObserver' in window) new ResizeObserver(scheduleUpdate).observe(document.body);
    update();
  }

  // Run after the theme's existing jQuery ready callback.
  if (window.jQuery) window.jQuery(init);
  else if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
}());
