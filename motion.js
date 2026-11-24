/* RITM Motion runtime — lightweight, offline-first and reduced-motion aware */
(() => {
  'use strict';
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const page = document.getElementById('pageContainer');
  if (!page) return;
  let active = document.querySelector('.primary-nav [data-page].is-active')?.dataset.page || 'today';
  let timerValue = document.getElementById('timerValue')?.textContent || '';
  const animatePage = () => {
    page.classList.remove('motion-entering');
    [...page.children].forEach((node, index) => node.style.setProperty('--motion-step', String(Math.min(index, 7))));
    void page.offsetWidth;
    page.classList.add('motion-entering');
    window.setTimeout(() => page.classList.remove('motion-entering'), 1200);
  };
  animatePage();
  new MutationObserver(() => {
    const next = document.querySelector('.primary-nav [data-page].is-active')?.dataset.page || 'today';
    if (next !== active) { active = next; animatePage(); }
    const timer = document.getElementById('timerValue');
    if (timer && timer.textContent !== timerValue) {
      timerValue = timer.textContent;
      if (!reduce) { timer.classList.remove('motion-tick'); void timer.offsetWidth; timer.classList.add('motion-tick'); }
    }
  }).observe(page, { childList: true, subtree: true, characterData: true });
  document.addEventListener('click', event => {
    const button = event.target.closest('[data-action="toggle-task"]');
    if (button && !reduce) {
      const id = button.dataset.id;
      window.setTimeout(() => {
        const row = [...document.querySelectorAll('[data-task-row]')].find(item => item.dataset.taskRow === id);
        if (!row || !row.classList.contains('is-done')) return;
        row.classList.remove('motion-win'); void row.offsetWidth; row.classList.add('motion-win');
        const burst = document.createElement('span'); burst.className = 'motion-burst'; burst.setAttribute('aria-hidden','true');
        burst.innerHTML = '<i>✦</i><i>✧</i><i>·</i><i>+</i><i>✳</i>'; row.append(burst);
        window.setTimeout(() => burst.remove(), 900);
      }, 0);
    }
  });
  if (!reduce && window.matchMedia('(hover:hover) and (pointer:fine)').matches) {
    let last = 0;
    document.addEventListener('pointermove', event => {
      const now = performance.now(); if (now - last < 32) return; last = now;
      const surface = event.target.closest('.day-hero,.panel,.habit-card,.focus-stage,.focus-launch-card,.note-launch-card,.settings-card,.week-day-card');
      if (!surface) return;
      const rect = surface.getBoundingClientRect();
      surface.classList.add('motion-spotlight');
      surface.style.setProperty('--motion-x', (event.clientX - rect.left) + 'px');
      surface.style.setProperty('--motion-y', (event.clientY - rect.top) + 'px');
    }, { passive: true });
  }
})();
