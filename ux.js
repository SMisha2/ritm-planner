/* RITM 1.3 — clarity layer and gentle interaction cues */
(() => {
  'use strict';
  const page = document.getElementById('pageContainer');
  if (!page) return;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let queued = false;
  let knownTaskIds = new Set();
  let initializedRows = false;

  const setText = (node, value) => {
    if (node && node.textContent.trim() !== value) node.textContent = value;
  };
  const makeAction = (label, action) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'button button-primary ux-empty-action';
    button.dataset.action = action;
    button.textContent = label;
    return button;
  };
  const addGuide = (after, className, text) => {
    if (!after || after.parentElement?.querySelector('.' + className)) return;
    const guide = document.createElement('p');
    guide.className = 'ux-guide ' + className;
    guide.textContent = text;
    after.insertAdjacentElement('afterend', guide);
  };

  function enhance() {
    // Navigation names are concrete and consistent on desktop and mobile.
    setText(document.querySelector('.nav-item[data-page="week"] span:not(.nav-icon)'), 'Неделя');
    setText(document.querySelector('.mobile-nav [data-page="week"] small'), 'Неделя');
    setText(document.querySelector('.nav-item[data-page="focus"] span:not(.nav-icon)'), 'Таймер');
    setText(document.querySelector('.mobile-nav [data-page="focus"] small'), 'Таймер');
    document.querySelector('.nav-item[data-page="today"] kbd')?.remove();

    const search = document.getElementById('globalSearch');
    if (search) {
      search.placeholder = 'Поиск по задачам…';
      search.setAttribute('aria-label', 'Поиск по задачам');
    }
    const avatar = document.getElementById('topAvatar');
    if (avatar) setText(avatar, '⚙');
    const tip = document.querySelector('.side-tip p');
    if (tip && tip.dataset.uxCopy !== '1') {
      tip.innerHTML = 'Подсказка<br><strong>Запиши одно важное дело. Остальное можно добавить позже.</strong>';
      tip.dataset.uxCopy = '1';
    }

    const isFocus = Boolean(document.querySelector('[data-page="focus"].is-active'));
    const breadcrumb = document.getElementById('breadcrumbCurrent');
    if (isFocus) setText(breadcrumb, 'Таймер');
    else if (document.querySelector('[data-page="tasks"].is-active')) setText(breadcrumb, 'Задачи');
    else if (document.querySelector('[data-page="week"].is-active')) setText(breadcrumb, 'Неделя');

    // Home screen: state the next action before the decorative copy.
    const hero = page.querySelector('.day-hero');
    if (hero) {
      const title = hero.querySelector('.day-hero-copy h2');
      if (title && title.dataset.uxCopy !== '1') {
        title.innerHTML = 'Сначала главное.<br><em>По шагу за раз.</em>';
        title.dataset.uxCopy = '1';
      }
      const description = hero.querySelector('.day-hero-copy > p');
      setText(description, 'Добавь одно дело ниже. Когда закончишь, отметь его галочкой — прогресс обновится автоматически.');
      setText(hero.querySelector('.hero-progress-top > span'), 'ЗАДАЧИ ВЫПОЛНЕНЫ');
      const dateCard = hero.querySelector('.hero-date-card');
      if (dateCard) dateCard.setAttribute('aria-label', 'Дата: ' + dateCard.textContent.replace(/\s+/g, ' ').trim());
    }

    const captureTitle = page.querySelector('.capture-title');
    if (captureTitle) {
      setText(captureTitle.querySelector('span'), 'БЫСТРОЕ ДОБАВЛЕНИЕ');
      setText(captureTitle.querySelector('strong'), 'Добавить задачу');
    }
    const captureInput = page.querySelector('#todayQuickForm input[name="title"]');
    if (captureInput) {
      captureInput.placeholder = 'Например: подготовить проект…';
      captureInput.setAttribute('aria-label', 'Название новой задачи');
    }
    const captureSubmit = page.querySelector('#todayQuickForm .capture-submit');
    if (captureSubmit) setText(captureSubmit, 'Добавить');
    const captureDetails = page.querySelector('.capture-details');
    if (captureDetails) {
      setText(captureDetails, 'Дата и детали');
      captureDetails.title = 'Открыть форму с датой, временем, приоритетом и заметкой';
      captureDetails.setAttribute('aria-label', 'Добавить задачу с датой и деталями');
    }

    const homeEmpty = page.querySelector('.tasks-panel .empty-state');
    if (homeEmpty) {
      setText(homeEmpty.querySelector('strong'), 'План пока пуст');
      setText(homeEmpty.querySelector('p'), 'Добавь первую задачу в поле выше или открой полную форму.');
      if (!homeEmpty.querySelector('.ux-empty-action')) homeEmpty.append(makeAction('Добавить первую задачу', 'new-task'));
    }

    const heading = page.querySelector('.page-heading h1');
    if (heading && heading.textContent.trim() === 'Все задачи') setText(heading, 'Задачи');

    // A true empty state tells the user exactly how to get started.
    const currentTitle = heading?.textContent.trim() || '';
    const empty = page.querySelector(':scope > .empty-state');
    if (empty && !empty.querySelector('.ux-empty-action')) {
      if (currentTitle === 'Привычки') {
        setText(empty.querySelector('strong'), 'Начни с одной привычки');
        setText(empty.querySelector('p'), 'Выбери небольшое действие, которое реально повторять каждый день.');
        empty.append(makeAction('Добавить первую привычку', 'new-habit'));
      } else if (currentTitle === 'Задачи' && !search?.value.trim()) {
        setText(empty.querySelector('strong'), 'Список пока пуст');
        setText(empty.querySelector('p'), 'Добавь задачу — она появится здесь с датой и приоритетом.');
        empty.append(makeAction('Добавить первую задачу', 'new-task'));
      }
    }

    // Week cards stay informative even when there is nothing scheduled.
    page.querySelectorAll('.week-day-card').forEach(card => {
      if (!card.querySelector('.week-task') && !card.querySelector('.ux-week-empty')) {
        const note = document.createElement('span');
        note.className = 'ux-week-empty';
        note.textContent = 'Нет задач';
        card.querySelector('.week-add')?.before(note);
      }
    });

    // Explain the two interactions which are not immediately obvious.
    if (currentTitle === 'Привычки') {
      const welcome = page.querySelector('.welcome-card');
      addGuide(welcome, 'ux-habit-guide', 'Как отмечать: нажми на число под нужным днём недели. Повторное нажатие снимет отметку.');
      page.querySelectorAll('.habit-day button[data-action="toggle-habit"]').forEach(button => {
        const label = button.getAttribute('aria-label') || 'Отметить привычку';
        button.title = label + '. Нажми ещё раз, чтобы отменить отметку.';
      });
    }

    if (isFocus || currentTitle.includes('сфокусироваться') || currentTitle === 'Время сфокусироваться') {
      const modes = page.querySelector('.timer-modes');
      if (modes && !page.querySelector('.ux-timer-guide')) {
        const guide = document.createElement('div');
        guide.className = 'ux-guide ux-timer-guide';
        guide.innerHTML = '<strong>Как пользоваться</strong><span>1. Выбери фокус или перерыв.</span><span>2. Нажми «Начать фокус».</span><span>3. Нужна пауза? Нажми «Пауза».</span>';
        modes.insertAdjacentElement('afterend', guide);
      }
    }

    // Make the notes autosave and local-storage behaviour explicit.
    const notes = page.querySelector('#notesEditor');
    if (notes) {
      notes.placeholder = 'Запиши мысль, идею или список дел…\n\nЗаметки сохраняются автоматически в этом браузере.';
      notes.setAttribute('aria-label', 'Личные заметки. Сохраняются автоматически в этом браузере.');
    }

    // Animate only genuinely new task rows, never every navigation repaint.
    const rows = [...page.querySelectorAll('[data-task-row]')];
    const ids = new Set(rows.map(row => row.getAttribute('data-task-row')));
    if (!initializedRows) {
      knownTaskIds = ids;
      initializedRows = true;
    } else {
      rows.forEach(row => {
        const id = row.getAttribute('data-task-row');
        if (id && !knownTaskIds.has(id) && !reduced) {
          row.classList.remove('ux-task-added');
          void row.offsetWidth;
          row.classList.add('ux-task-added');
        }
      });
      knownTaskIds = ids;
    }
  }

  function scheduleEnhance() {
    if (queued) return;
    queued = true;
    window.requestAnimationFrame(() => {
      queued = false;
      enhance();
    });
  }

  enhance();
  new MutationObserver(scheduleEnhance).observe(page, { childList: true, subtree: true });

  if (!reduced) {
    document.addEventListener('click', event => {
      const button = event.target.closest('button');
      if (!button || button.disabled) return;
      button.classList.remove('ux-clicked');
      void button.offsetWidth;
      button.classList.add('ux-clicked');
      window.setTimeout(() => button.classList.remove('ux-clicked'), 500);
    }, { passive: true });
  }

  // Theme switching: crossfade the entire interface via the View Transitions API.
  // Re-dispatch the real button click inside the transition so the app's own
  // state and persistence logic remains the single source of truth.
  const themeButton = document.getElementById('themeToggle');
  let replayingThemeClick = false;
  let themeAnimationTimer = 0;

  if (themeButton) {
    document.addEventListener('click', event => {
      const clicked = event.target instanceof Element ? event.target.closest('#themeToggle') : null;
      if (!clicked || replayingThemeClick || reduced) return;

      clicked.classList.remove('ux-theme-icon');
      void clicked.offsetWidth;
      clicked.classList.add('ux-theme-icon');
      window.clearTimeout(themeAnimationTimer);
      themeAnimationTimer = window.setTimeout(() => clicked.classList.remove('ux-theme-icon'), 760);

      if (typeof document.startViewTransition === 'function') {
        event.preventDefault();
        event.stopImmediatePropagation();
        const transition = document.startViewTransition(() => {
          replayingThemeClick = true;
          clicked.click();
          replayingThemeClick = false;
        });
        transition.finished.catch(() => {});
      } else {
        document.body.classList.add('ux-theme-wash');
        window.setTimeout(() => document.body.classList.remove('ux-theme-wash'), 760);
      }
    }, true);
  }

})();