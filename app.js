(() => {
  'use strict';
  const STORE_KEY = 'ritm.workspace.v1';
  const root = document.documentElement;
  const pageContainer = document.getElementById('pageContainer');
  const toast = document.getElementById('toast');
  let todayKey = toDateKey(new Date());
  const WEEKDAYS = ['Пн','Вт','Ср','Чт','Пт','Сб','Вс'];
  const MONTHS = ['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря'];
  const MONTHS_NOM = ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'];
  const PAGE_NAMES = {today:'Мой день',tasks:'Все задачи',week:'Неделя',habits:'Привычки',notes:'Заметки',focus:'Фокус',settings:'Настройки'};
  const FOCUS_MODES = {pomodoro:{label:'Фокус',minutes:25},short:{label:'Перерыв',minutes:5},long:{label:'Большой перерыв',minutes:15}};

  function toDateKey(date) {
    return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
  }
  function isValidDateKey(value) {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const [year, month, day] = value.split('-').map(Number);
    const date = new Date(year, month - 1, day, 12, 0, 0, 0);
    return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
  }
  function fromDateKey(key) {
    const value = isValidDateKey(key) ? key : toDateKey(new Date());
    const [year,month,day] = value.split('-').map(Number);
    return new Date(year,month-1,day,12,0,0,0);
  }
  function syncTodayKey() {
    const next = toDateKey(new Date());
    if (next === todayKey) return false;
    const previous = todayKey;
    todayKey = next;
    if (selectedDate === previous) selectedDate = next;
    return true;
  }
  function shiftDate(key,amount) {
    const date=fromDateKey(key); date.setDate(date.getDate()+amount); return toDateKey(date);
  }
  function mondayOf(key) {
    const date=fromDateKey(key); date.setDate(date.getDate()-((date.getDay()+6)%7)); return toDateKey(date);
  }
  function ruDate(key,options={}) {
    const date=fromDateKey(key);
    if(options.long) return `${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
    if(options.weekday) return `${WEEKDAYS[(date.getDay()+6)%7]}, ${date.getDate()} ${MONTHS[date.getMonth()]}`;
    return `${date.getDate()} ${MONTHS[date.getMonth()]}`;
  }
  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  }
  function uid() {
    return window.crypto?.randomUUID ? window.crypto.randomUUID() : `r${Date.now().toString(36)}${Math.random().toString(36).slice(2,9)}`;
  }
  function starterData() {
    return {
      version:1,
      tasks:[],
      habits:[],
      notes:'',focus:{mode:'pomodoro',remaining:1500,running:false,endAt:null,sessions:[]},settings:{theme:'light'}
    };
  }
  function normalizeData(value) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Неверный формат данных');
    const tasks = Array.isArray(value.tasks) ? value.tasks.slice(0, 5000).filter(x => x && typeof x.title === 'string' && x.title.trim()).map(x => {
      const rawDuration = Number(x.duration);
      const rawTime = String(x.time || '');
      const validTime = /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(rawTime);
      return {
        id: String(x.id || uid()).slice(0, 100),
        title: String(x.title).trim().slice(0, 100),
        date: isValidDateKey(x.date) ? x.date : todayKey,
        time: validTime ? rawTime : '',
        priority: ['low','normal','high'].includes(x.priority) ? x.priority : 'normal',
        duration: Number.isFinite(rawDuration) ? Math.min(240, Math.max(5, Math.round(rawDuration))) : 25,
        category: String(x.category || 'Другое').slice(0, 40),
        details: String(x.details || '').slice(0, 300),
        done: Boolean(x.done),
        createdAt: Number.isFinite(Number(x.createdAt)) && Number(x.createdAt) > 0 ? Number(x.createdAt) : Date.now(),
        sample: Boolean(x.sample)
      };
    }) : [];
    const habits = Array.isArray(value.habits) ? value.habits.slice(0, 100).filter(x => x && typeof x.name === 'string' && x.name.trim()).map(x => {
      const history = {};
      if (x.history && typeof x.history === 'object' && !Array.isArray(x.history)) {
        Object.entries(x.history).slice(-1000).forEach(([key, done]) => { if (isValidDateKey(key) && done === true) history[key] = true; });
      }
      return { id:String(x.id || uid()).slice(0,100), name:String(x.name).trim().slice(0,60), color:['violet','mint','orange','blue'].includes(x.color)?x.color:'violet', history, sample:Boolean(x.sample) };
    }) : [];
    const focus = value.focus && typeof value.focus === 'object' && !Array.isArray(value.focus) ? value.focus : {};
    const sessions = Array.isArray(focus.sessions) ? focus.sessions.slice(-500).filter(item => item && isValidDateKey(item.date) && FOCUS_MODES[item.mode] && Number.isFinite(Number(item.minutes)) && Number(item.minutes) > 0).map(item => ({
      date:item.date, minutes:Math.max(1,Math.min(90,Math.round(Number(item.minutes)))), mode:item.mode,
      at:Number.isFinite(Number(item.at))?Number(item.at):Date.now()
    })) : [];
    const rawRemaining = Number(focus.remaining);
    const mode = FOCUS_MODES[focus.mode] ? focus.mode : 'pomodoro';
    const remaining = Number.isFinite(rawRemaining) ? Math.min(5400, Math.max(0, rawRemaining)) : FOCUS_MODES[mode].minutes * 60;
    const running = Boolean(focus.running) && Number.isFinite(Number(focus.endAt)) && Number(focus.endAt) > Date.now();
    return {
      version:1, tasks, habits,
      notes:typeof value.notes === 'string' ? value.notes.slice(0,30000) : '',
      focus:{ mode, remaining:running?Math.max(0,(Number(focus.endAt)-Date.now())/1000):remaining, running, endAt:running?Number(focus.endAt):null, sessions },
      settings:{theme:value.settings?.theme==='dark'?'dark':'light'}
    };
  }

  function loadData() {
    try { const raw=localStorage.getItem(STORE_KEY); return raw?normalizeData(JSON.parse(raw)):starterData(); }
    catch(error) { console.warn('RITM: не удалось прочитать локальные данные.',error); return starterData(); }
  }

  let state=loadData();
  let activePage='today';
  let selectedDate=todayKey;
  let taskFilter='all';
  let searchTerm='';
  let toastTimer=null;
  let tickTimer=null;

  function save() {
    try { localStorage.setItem(STORE_KEY,JSON.stringify(state)); return true; }
    catch(error) { showToast('Не удалось сохранить данные. Проверь свободное место в браузере.'); console.error(error); return false; }
  }
  function showToast(message) {
    toast.textContent=message; toast.classList.add('is-visible'); clearTimeout(toastTimer);
    toastTimer=setTimeout(()=>toast.classList.remove('is-visible'),2600);
  }
  function applyTheme() {
    root.dataset.theme=state.settings.theme;
    const button=document.getElementById('themeToggle');
    button.textContent=state.settings.theme==='dark'?'☾':'☼';
    button.title=state.settings.theme==='dark'?'Включить светлую тему':'Включить тёмную тему';
    button.setAttribute('aria-pressed', state.settings.theme==='dark'?'true':'false');
    const meta=document.querySelector('meta[name="theme-color"]');
    if(meta) meta.content=state.settings.theme==='dark'?'#151722':'#f2f3ef';
  }
  function countDone(key) { return state.tasks.filter(task=>task.date===key&&task.done).length; }
  function countPlanned(key) { return state.tasks.filter(task=>task.date===key).length; }
  function habitDone(habit,key) { return Boolean(habit.history&&habit.history[key]); }
  function dayFocusMinutes(key) { return state.focus.sessions.filter(item=>item.date===key&&item.mode==='pomodoro').reduce((sum,item)=>sum+Number(item.minutes||0),0); }
  function totalFocusMinutes() { return dayFocusMinutes(todayKey); }
  function sortedTasks(tasks) {
    const rank={high:0,normal:1,low:2};
    return [...tasks].sort((a,b)=>a.done!==b.done?(a.done?1:-1):a.time&&b.time?a.time.localeCompare(b.time):a.time?-1:b.time?1:rank[a.priority]-rank[b.priority]||a.createdAt-b.createdAt);
  }
  function greeting() {
    const hour=new Date().getHours();
    if(hour<5) return 'Пора немного отдохнуть';
    if(hour<12) return 'Доброе утро';
    if(hour<18) return 'Хорошего дня';
    return 'Добрый вечер';
  }
  function taskRow(task) {
    const meta=[];
    if(task.priority==='high') meta.push('<span class="task-priority"><i class="priority-dot high"></i> Важно</span>');
    if(task.priority==='low') meta.push('<span class="task-priority muted-priority"><i class="priority-dot low"></i> Не срочно</span>');
    if(task.category && task.category!=='Другое') meta.push(`<span>${escapeHtml(task.category)}</span>`);
    return `<article class="task-row ${task.done?'is-done':''}" data-task-row="${escapeHtml(task.id)}">
      <button class="task-check" data-action="toggle-task" data-id="${escapeHtml(task.id)}" aria-label="${task.done?'Вернуть задачу в план':'Отметить выполненной'}" aria-pressed="${task.done?'true':'false'}">${task.done?'✓':''}</button>
      <div class="task-copy"><strong title="${escapeHtml(task.title)}">${escapeHtml(task.title)}</strong>${task.details?`<p class="task-details">${escapeHtml(task.details)}</p>`:''}${meta.length?`<div class="task-meta">${meta.join('')}</div>`:''}</div>
      ${task.time?`<span class="task-time">${escapeHtml(task.time)}</span>`:''}
      <button class="task-more" data-action="edit-task" data-id="${escapeHtml(task.id)}" aria-label="Изменить задачу" title="Изменить задачу">✎</button>
    </article>`;
  }
  function emptyState(title,text,symbol='✳') {
    return `<div class="empty-state"><span>${symbol}</span><strong>${escapeHtml(title)}</strong><p>${escapeHtml(text)}</p></div>`;
  }
  function pageHeading(kicker,title,subtitle,action='') {
    return `<div class="page-heading"><div><span class="eyebrow">${escapeHtml(kicker)}</span><h1>${title}</h1><p class="page-subtitle">${escapeHtml(subtitle)}</p></div>${action}</div>`;
  }

  function renderToday() {
    const tasks=sortedTasks(state.tasks.filter(task=>task.date===selectedDate));
    const done=tasks.filter(task=>task.done).length;
    const active=tasks.length-done;
    const percent=tasks.length?Math.round(done/tasks.length*100):0;
    const selectedFocus=dayFocusMinutes(selectedDate);
    const selectedHabits=state.habits.filter(habit=>habitDone(habit,selectedDate)).length;
    const date=fromDateKey(selectedDate);
    const title=selectedDate===todayKey?greeting():ruDate(selectedDate,{weekday:true});
    const dateLabel=selectedDate===todayKey?'СЕГОДНЯ':ruDate(selectedDate,{weekday:true}).toUpperCase();
    return `${pageHeading('ТВОЁ ПРОСТРАНСТВО',title,selectedDate===todayKey?'Один понятный шаг за раз. Всё остальное подождёт.':`Твой план на ${ruDate(selectedDate)}.`,`<span class="date-chip"><strong>${escapeHtml(ruDate(selectedDate,{long:true}))}</strong></span>`)}
      <section class="day-hero">
        <div class="day-hero-copy">
          <div class="hero-kicker"><i></i><span>${dateLabel}</span><b>·</b><span>ТВОЙ ДЕНЬ, ТВОИ ПРАВИЛА</span></div>
          <h2>Не спеши.<br><em>Создавай ритм.</em></h2>
          <p>Тебе не нужен идеальный день. Достаточно выбрать то, что действительно важно.</p>
          <div class="hero-progress">
            <div class="hero-progress-top"><span>ПРОГРЕСС ДНЯ</span><strong>${done}<small> / ${tasks.length}</small></strong></div>
            <div class="progress-track" role="progressbar" aria-label="Прогресс задач" aria-valuenow="${percent}" aria-valuemin="0" aria-valuemax="100"><i style="width:${percent}%"></i></div>
            <div class="hero-footline"><span>${tasks.length?active?`${active} ${active===1?'дело':'дела'} ещё впереди`:'Все задачи выполнены — отличный ритм':'Пока чистый лист. Начни с одного дела.'}</span><strong>${percent}%</strong></div>
          </div>
        </div>
        <div class="hero-visual" aria-hidden="true">
          <div class="hero-orbit orbit-one"></div><div class="hero-orbit orbit-two"></div><div class="hero-orbit orbit-three"></div>
          <div class="hero-glow"></div><div class="hero-monogram">r<span>.</span></div>
          <div class="hero-date-card"><small>${MONTHS_NOM[date.getMonth()].toUpperCase()}</small><strong>${String(date.getDate()).padStart(2,'0')}</strong><span>${date.getFullYear()}</span></div>
          <i class="hero-star star-one">✦</i><i class="hero-star star-two">✧</i><i class="hero-pulse"></i>
        </div>
        <div class="hero-foot-stats"><span><i class="hero-stat-icon">◉</i><b>${formatMinutes(selectedFocus)}</b><small>фокуса</small></span><span><i class="hero-stat-icon">✳</i><b>${selectedHabits}/${state.habits.length}</b><small>привычек</small></span><span><i class="hero-stat-icon">↗</i><b>${tasks.length}</b><small>задач</small></span></div>
      </section>
      <section class="today-capture" aria-label="Быстрое добавление задачи">
        <div class="capture-mark">＋</div>
        <div class="capture-title"><span>СЛЕДУЮЩИЙ ШАГ</span><strong>Что нужно сделать?</strong></div>
        <form id="todayQuickForm" class="capture-form"><input name="title" maxlength="100" autocomplete="off" placeholder="Добавь задачу одним предложением…" aria-label="Новая задача" required><button class="capture-submit" type="submit">Добавить <span>↗</span></button></form>
        <button class="capture-details" type="button" data-action="new-task" title="Добавить задачу с датой, временем и деталями">Настроить</button>
      </section>
      <section class="dashboard-grid">
        <section class="panel tasks-panel">
          <div class="panel-head"><div><span class="section-kicker">ТВОЙ СПИСОК</span><h2 class="panel-title">План на день</h2><p class="panel-subtitle">${tasks.length?`${done} из ${tasks.length} выполнено`:'Все важное — в одном месте'}</p></div><div class="plan-head-actions"><div class="day-switch"><button data-action="change-date" data-step="-1" aria-label="Предыдущий день">‹</button><strong>${selectedDate===todayKey?'Сегодня':ruDate(selectedDate)}</strong><button data-action="change-date" data-step="1" aria-label="Следующий день">›</button></div><button class="text-action" data-page="tasks">Все задачи ↗</button></div></div>
          ${tasks.length?`<div class="task-list">${tasks.map(taskRow).join('')}</div>`:emptyState('Пока без задач','Добавь первое дело в поле выше. Это займёт всего пару секунд.','✦')}
          ${tasks.length?`<button class="add-inline" data-action="new-task"><span>＋</span> Добавить с подробностями</button>`:''}
        </section>
        <div class="dashboard-aside">
          <section class="panel habits-panel"><div class="panel-head"><div><span class="section-kicker">МАЛЕНЬКИЕ ПОБЕДЫ</span><h2 class="panel-title">Привычки</h2><p class="panel-subtitle">Каждый шаг имеет значение</p></div><button class="text-action" data-action="go-habits">Все ↗</button></div>${renderHabitMini(selectedDate)}</section>
          <button class="focus-launch-card" data-action="go-focus" type="button"><span class="focus-launch-icon">◉</span><span class="focus-launch-copy"><small>ВРЕМЯ ДЛЯ СЕБЯ</small><strong>Войти в фокус</strong><em>25 минут без лишнего шума</em></span><span class="focus-launch-arrow">↗</span></button>
          <button class="note-launch-card" data-action="go-notes" type="button"><span class="note-launch-icon">✧</span><span><small>ИДЕИ И МЫСЛИ</small><strong>Открыть заметки</strong></span><span class="note-launch-arrow">↗</span></button>
        </div>
      </section>`;
  }

  function renderHabitMini(key) {
    if(!state.habits.length) return `<p class="habit-empty">Добавь одну небольшую привычку. Не нужно менять всё сразу.</p><button class="add-inline" data-action="new-habit"><span>+</span> Добавить привычку</button>`;
    return `<div class="habit-mini-list">${state.habits.slice(0,4).map(habit=>`<div class="habit-mini-row"><i class="habit-color ${escapeHtml(habit.color)}"></i><span>${escapeHtml(habit.name)}</span><button class="${habitDone(habit,key)?'done':''}" data-action="toggle-habit" data-id="${escapeHtml(habit.id)}" data-date="${key}" aria-label="${habitDone(habit,key)?'Отменить отметку':'Отметить привычку'}">${habitDone(habit,key)?'✓':'＋'}</button></div>`).join('')}</div><button class="add-inline" data-action="new-habit"><span>+</span> Новая привычка</button>`;
  }

  function addQuickTask(title,date=selectedDate) {
    const clean=String(title||'').trim();
    if(!clean) return false;
    state.tasks.push({id:uid(),title:clean.slice(0,100),date:isValidDateKey(date)?date:todayKey,time:'',priority:'normal',duration:25,category:'Другое',details:'',done:false,createdAt:Date.now(),sample:false});
    save();
    return true;
  }

  function renderTasks() {
    const tasks=sortedTasks(state.tasks.filter(task=>{
      const ok=taskFilter==='all'||(taskFilter==='active'&&!task.done)||(taskFilter==='done'&&task.done);
      const haystack=`${task.title} ${task.category} ${task.details}`.toLowerCase();
      return ok&&(!searchTerm||haystack.includes(searchTerm.toLowerCase()));
    }));
    const grouped=new Map();
    tasks.forEach(task=>{if(!grouped.has(task.date))grouped.set(task.date,[]);grouped.get(task.date).push(task);});
    const groups=[...grouped.entries()].sort((a,b)=>a[0].localeCompare(b[0]));
    return `${pageHeading('ТВОЙ СПИСОК','Все задачи','Выгрузи дела из головы. Разберёмся с ними по порядку.','<button class="button button-primary" data-action="new-task">＋ Новая задача</button>')}
      <div class="filter-bar"><button class="filter-chip ${taskFilter==='all'?'is-active':''}" data-action="task-filter" data-filter="all">Все задачи · ${state.tasks.length}</button><button class="filter-chip ${taskFilter==='active'?'is-active':''}" data-action="task-filter" data-filter="active">В процессе · ${state.tasks.filter(t=>!t.done).length}</button><button class="filter-chip ${taskFilter==='done'?'is-active':''}" data-action="task-filter" data-filter="done">Готово · ${state.tasks.filter(t=>t.done).length}</button></div>
      ${groups.length?`<div class="task-full-list">${groups.map(([key,items])=>`<section><div class="task-section-title"><span>${key===todayKey?'СЕГОДНЯ':key===shiftDate(todayKey,1)?'ЗАВТРА':ruDate(key,{weekday:true}).toUpperCase()}</span><span>${items.filter(t=>t.done).length}/${items.length}</span></div><div class="task-list">${items.map(taskRow).join('')}</div></section>`).join('')}</div>`:emptyState(searchTerm?'Ничего не найдено':'Пока нет задач',searchTerm?'Попробуй изменить поисковый запрос.':'Добавь первое дело. Большие планы начинаются с одного шага.','☷')}`;
  }

  function renderWeek() {
    const start=mondayOf(selectedDate);
    const days=Array.from({length:7},(_,i)=>shiftDate(start,i));
    const total=days.reduce((sum,key)=>sum+countPlanned(key),0);
    const completed=days.reduce((sum,key)=>sum+countDone(key),0);
    return `${pageHeading('НЕДЕЛЯ БЕЗ СУЕТЫ','Большая картина','Посмотри на неделю целиком и оставь немного свободного пространства.',`<div class="date-chip">${escapeHtml(ruDate(days[0]))} — ${escapeHtml(ruDate(days[6]))}</div>`)}
      <div class="stat-grid"><div class="stat-card"><span class="stat-icon violet">▦</span><div class="stat-text"><span>Запланировано</span><strong>${total}</strong><small>Задач за неделю</small></div></div><div class="stat-card"><span class="stat-icon mint">✓</span><div class="stat-text"><span>Завершено</span><strong>${completed}</strong><small>Небольшие шаги вперёд</small></div></div><div class="stat-card"><span class="stat-icon peach">◷</span><div class="stat-text"><span>Фокус</span><strong>${formatMinutes(days.reduce((sum,key)=>sum+dayFocusMinutes(key),0))}</strong><small>Время на важное</small></div></div></div>
      <div class="week-grid">${days.map(key=>{const items=sortedTasks(state.tasks.filter(t=>t.date===key));const d=fromDateKey(key);return `<section class="week-day-card ${key===todayKey?'is-today':''}"><div class="week-day-head"><span>${WEEKDAYS[(d.getDay()+6)%7]}</span><strong>${d.getDate()}</strong></div>${items.slice(0,4).map(task=>`<div class="week-task ${task.done?'done':''}" title="${escapeHtml(task.title)}">${task.time?`${escapeHtml(task.time)} · `:''}${escapeHtml(task.title)}</div>`).join('')}${items.length>4?`<small class="muted">ещё ${items.length-4}</small>`:''}<button class="week-add" data-action="new-task-date" data-date="${key}">＋ Добавить</button></section>`;}).join('')}</div>
      <div style="display:flex;justify-content:space-between;gap:10px;margin-top:17px"><button class="button button-quiet button-small" data-action="week-shift" data-step="-7">← Предыдущая неделя</button><button class="button button-quiet button-small" data-action="week-current">Текущая неделя</button><button class="button button-quiet button-small" data-action="week-shift" data-step="7">Следующая неделя →</button></div>`;
  }

  function renderHabits() {
    const keys=Array.from({length:7},(_,i)=>shiftDate(todayKey,i-6));
    const doneToday=state.habits.filter(h=>habitDone(h,todayKey)).length;
    return `${pageHeading('ПОВТОРЕНИЕ СОЗДАЁТ РИТМ','Привычки','Не серия идеальных дней, а мягкое возвращение к тому, что важно.','<button class="button button-primary" data-action="new-habit">＋ Новая привычка</button>')}
      <section class="welcome-card" style="min-height:145px"><div class="welcome-copy"><span class="welcome-kicker"><i></i> СЕГОДНЯ</span><h2>${doneToday} из ${state.habits.length} маленьких побед</h2><p>Отмечай то, что получилось. Пропущенный день — не провал, а просто пауза.</p></div><div class="welcome-art" aria-hidden="true"><div class="art-orbit"></div><div class="art-core"><span>✓</span></div><i class="art-dot"></i><b class="art-star">✳</b></div></section>
      ${state.habits.length?`<div class="habit-grid">${state.habits.map(habit=>`<article class="habit-card"><div class="habit-card-top"><i class="habit-color ${escapeHtml(habit.color)}"></i><strong>${escapeHtml(habit.name)}</strong><button data-action="delete-habit" data-id="${escapeHtml(habit.id)}" aria-label="Удалить привычку">···</button></div><div class="habit-week">${keys.map(key=>{const d=fromDateKey(key);return `<div class="habit-day"><span>${WEEKDAYS[(d.getDay()+6)%7]}</span><button class="${habitDone(habit,key)?'done':''} ${key===todayKey?'today':''}" data-action="toggle-habit" data-id="${escapeHtml(habit.id)}" data-date="${key}" aria-label="${ruDate(key)}">${habitDone(habit,key)?'✓':d.getDate()}</button></div>`;}).join('')}</div></article>`).join('')}</div>`:emptyState('Начни с одной привычки','Пить воду, читать несколько страниц, делать паузу — выбери что-то реалистичное.','◌')}`;
  }

  function renderNotes() {
    const words=state.notes.trim()?state.notes.trim().split(/\s+/).length:0;
    return `${pageHeading('МЕСТО ДЛЯ МЫСЛЕЙ','Заметки','Черновики, идеи, списки и всё, что хочется сохранить.','<span class="date-chip"><strong id="notesSaveState">Сохраняется автоматически</strong></span>')}
      <div class="notes-layout"><section class="notes-paper"><div class="notes-meta"><span>ЛИЧНАЯ ЗАПИСНАЯ КНИГА</span><span id="noteWordCount">${words} слов</span></div><textarea id="notesEditor" maxlength="30000" placeholder="Начни с мысли, идеи или плана…\n\nЗдесь не нужно писать красиво. Просто освободи немного места в голове.">${escapeHtml(state.notes)}</textarea><div class="notes-meta"><span>Изменения сохраняются на этом устройстве</span><span id="notesStatus">Сохранено</span></div></section><aside class="notes-aside"><strong>Небольшая подсказка</strong><p>Попробуй разделить заметку на три части: что хочется сделать, что нужно узнать и что пока можно отпустить.</p></aside></div>`;
  }

  function formatMinutes(minutes) {
    const value=Math.max(0,Math.round(Number(minutes)||0));
    if(value<60) return `${value}м`;
    const hours=Math.floor(value/60),rest=value%60;
    return rest?`${hours}ч ${rest}м`:`${hours}ч`;
  }
  function formatSeconds(seconds) {
    const value=Math.max(0,Math.ceil(Number(seconds)||0));
    return `${String(Math.floor(value/60)).padStart(2,'0')}:${String(value%60).padStart(2,'0')}`;
  }
  function renderFocus() {
    const f=state.focus;
    const total=FOCUS_MODES[f.mode].minutes*60;
    const left=Math.max(0,Math.ceil(f.remaining));
    const progress=Math.min(100,Math.max(0,(1-left/total)*100));
    return `${pageHeading('ОДНО ДЕЛО ЗА РАЗ','Время сфокусироваться','Убери лишнее на несколько минут. Не обязательно быть продуктивным весь день.','')}
      <div class="focus-page"><section class="focus-stage"><span class="eyebrow">${escapeHtml(FOCUS_MODES[f.mode].label).toUpperCase()}</span><div class="timer-ring" id="timerRing" style="--progress:${progress}%"><div class="timer-inner"><strong class="timer-value" id="timerValue">${formatSeconds(left)}</strong><span class="timer-caption">${f.running?'ТЫ В ПОТОКЕ':'МОЖНО НАЧИНАТЬ'}</span></div></div><div class="timer-modes">${Object.entries(FOCUS_MODES).map(([key,mode])=>`<button class="${f.mode===key?'is-active':''}" data-action="focus-mode" data-mode="${key}">${mode.label} · ${mode.minutes} мин</button>`).join('')}</div><div class="timer-actions"><button class="button button-primary" data-action="focus-toggle">${f.running?'Пауза':'Начать фокус'} <span>${f.running?'Ⅱ':'→'}</span></button><button class="button button-quiet" data-action="focus-reset">Сбросить</button></div></section>
      <aside class="focus-stats"><div class="focus-stat-card"><span>СЕГОДНЯ В ФОКУСЕ</span><strong>${formatMinutes(totalFocusMinutes())}</strong><p>Время завершённых сессий</p></div><div class="focus-stat-card"><span>ЗАВЕРШЕНО СЕГОДНЯ</span><strong>${state.focus.sessions.filter(s=>s.date===todayKey&&s.mode==='pomodoro').length}</strong><p>Фокус-сессий</p></div><div class="focus-stat-card"><span>ПОСЛЕДНЯЯ СЕССИЯ</span><strong>${state.focus.sessions.filter(s=>s.mode==='pomodoro').length?`${state.focus.sessions.filter(s=>s.mode==='pomodoro').slice(-1)[0].minutes} мин`:'—'}</strong><p>Каждая пауза тоже часть ритма</p></div><div class="notes-aside"><strong>Попробуй так</strong><p>Выбери одну небольшую задачу. Уведомления можно выключить, а после таймера — сделать короткую паузу.</p></div></aside></div>`;
  }
  function renderSettings() {
    return `${pageHeading('ПРОСТРАНСТВО ПОД ТЕБЯ','Настройки','Твои данные принадлежат тебе. Здесь можно сохранить их копию или перенести на другое устройство.','')}
      <div class="settings-grid"><section class="settings-card"><h3>Внешний вид</h3><p>Выбери спокойную светлую или тёмную тему. Настройка применяется сразу.</p><div class="settings-actions"><button class="button button-quiet button-small" data-action="set-theme" data-theme="light">☼ Светлая</button><button class="button button-quiet button-small" data-action="set-theme" data-theme="dark">☾ Тёмная</button></div></section>
      <section class="settings-card"><h3>Резервная копия</h3><p>Скачай все задачи, привычки, заметки и историю фокуса в JSON-файл. Его можно импортировать позже.</p><div class="settings-actions"><button class="button button-primary button-small" data-action="export-data">Экспортировать данные ↓</button><label class="file-button" for="importFile">Импортировать ↑</label><input id="importFile" type="file" accept="application/json,.json" hidden></div></section>
      <section class="settings-card"><h3>Хранение данных</h3><p>RITM не требует аккаунта. Информация сохраняется в локальном хранилище браузера и не отправляется на сервер.</p><div class="settings-actions"><span class="date-chip"><strong>● Локально</strong></span></div></section>
      <section class="settings-card"><h3>Очистить пространство</h3><p>Можно удалить демонстрационные записи отдельно или полностью сбросить всё содержимое приложения.</p><div class="settings-actions"><button class="button button-quiet button-small" data-action="clear-samples">Убрать примеры</button><button class="button button-quiet button-small" data-action="reset-data" style="color:var(--red)">Сбросить всё</button></div></section></div>`;
  }

  function render() {
    syncTodayKey();
    const content=activePage==='today'?renderToday():activePage==='tasks'?renderTasks():activePage==='week'?renderWeek():activePage==='habits'?renderHabits():activePage==='notes'?renderNotes():activePage==='focus'?renderFocus():renderSettings();
    pageContainer.innerHTML=content;
    document.getElementById('breadcrumbCurrent').textContent=PAGE_NAMES[activePage];
    document.querySelectorAll('[data-page]').forEach(button=>{
      button.classList.toggle('is-active',button.dataset.page===activePage);
      if(button.matches('.nav-item, .mobile-nav button')) { if(button.dataset.page===activePage) button.setAttribute('aria-current','page'); else button.removeAttribute('aria-current'); }
    });
    document.getElementById('allTasksCount').textContent=String(state.tasks.filter(t=>!t.done).length);
    applyTheme();
    if(activePage==='notes') bindNotesEditor();
    updateTimerDisplay();
  }
  function navigate(page) {
    if(!PAGE_NAMES[page]) return;
    activePage=page;
    if(page!=='tasks') searchTerm='';
    document.getElementById('globalSearch').value=searchTerm;
    render();
    if(window.innerWidth<680) window.scrollTo({top:0,behavior:'smooth'});
  }
  function openTaskDialog(task=null,date=selectedDate) {
    const form=document.getElementById('taskForm'); form.reset();
    form.elements.id.value=task?.id||'';
    form.elements.title.value=task?.title||'';
    form.elements.date.value=task?.date||date;
    form.elements.time.value=task?.time||'';
    form.elements.priority.value=task?.priority||'normal';
    form.elements.duration.value=String(task?.duration||25);
    form.elements.category.value=task?.category||'Учёба';
    form.elements.details.value=task?.details||'';
    document.getElementById('taskDialogTitle').textContent=task?'Изменить задачу':'Добавить задачу';
    document.getElementById('deleteTaskButton').hidden=!task;
    document.getElementById('taskDialog').showModal();
    setTimeout(()=>document.getElementById('taskTitle').focus(),30);
  }
  function toggleTask(id) {
    const task=state.tasks.find(t=>t.id===id); if(!task) return;
    task.done=!task.done; save(); render(); showToast(task.done?'Отлично. Ещё один шаг сделан.':'Задача возвращена в план.');
  }
  function toggleHabit(id,key=todayKey) {
    const habit=state.habits.find(h=>h.id===id); if(!habit) return;
    habit.history[key]=!habit.history[key]; if(!habit.history[key]) delete habit.history[key];
    save(); render(); showToast(habit.history[key]?'Маленькая победа засчитана.':'Отметка отменена.');
  }
  function updateTimerDisplay() {
    const f=state.focus;
    const total=FOCUS_MODES[f.mode].minutes*60;
    const left=Math.max(0,Math.ceil(f.remaining));
    const timer=document.getElementById('timerValue'); if(timer) timer.textContent=formatSeconds(left);
    const caption=document.querySelector('.timer-caption'); if(caption) caption.textContent=f.running?'ТЫ В ПОТОКЕ':'МОЖНО НАЧИНАТЬ';
    const ring=document.getElementById('timerRing'); if(ring) ring.style.setProperty('--progress',`${Math.min(100,Math.max(0,(1-left/total)*100))}%`);
    const mini=document.getElementById('miniTimer'); if(mini) mini.textContent=formatSeconds(left);
    const label=document.querySelector('.focus-mini-top span:last-child'); if(label) label.textContent=f.running?'ИДЁТ':FOCUS_MODES[f.mode].label.toUpperCase();
    const miniButton=document.querySelector('#focusMini [data-action="focus-toggle"]'); if(miniButton) miniButton.textContent=f.running?'Пауза':'Начать';
  }
  function finishFocus() {
    const mode=state.focus.mode;
    state.focus.sessions.push({date:toDateKey(new Date()),minutes:FOCUS_MODES[mode].minutes,mode,at:Date.now()});
    state.focus.sessions=state.focus.sessions.slice(-500);
    state.focus.running=false; state.focus.endAt=null; state.focus.remaining=0;
    save(); showToast(mode==='pomodoro'?'Сессия завершена. Время для короткой паузы.':'Перерыв завершён. Как себя чувствуешь?'); render();
  }
  function timerTick() {
    if(syncTodayKey()) render();
    if(!state.focus.running||!state.focus.endAt) return;
    state.focus.remaining=Math.max(0,(state.focus.endAt-Date.now())/1000);
    if(state.focus.remaining<=0){finishFocus();return;}
    updateTimerDisplay();
  }
  function startTicker() {
    if(tickTimer) clearInterval(tickTimer);
    tickTimer=setInterval(timerTick,1000);
    if(state.focus.running&&state.focus.endAt) timerTick();
  }
  function toggleFocus() {
    if(state.focus.running){
      if(state.focus.endAt && state.focus.endAt<=Date.now()){finishFocus();return;}
      state.focus.remaining=Math.max(0,(state.focus.endAt-Date.now())/1000);
      state.focus.running=false; state.focus.endAt=null; save(); updateTimerDisplay(); showToast('Таймер на паузе.');
      if(activePage==='focus') render(); return;
    }
    if(state.focus.remaining<=0) state.focus.remaining=FOCUS_MODES[state.focus.mode].minutes*60;
    state.focus.running=true; state.focus.endAt=Date.now()+state.focus.remaining*1000;
    save(); startTicker(); updateTimerDisplay(); showToast('Фокус включён. Одно дело за раз.');
    if(activePage==='focus') render();
  }
  function changeFocusMode(mode) {
    if(!FOCUS_MODES[mode] || state.focus.running) { if(state.focus.running) showToast('Сначала поставь таймер на паузу.'); return; }
    state.focus.mode=mode; state.focus.remaining=FOCUS_MODES[mode].minutes*60; state.focus.running=false; state.focus.endAt=null;
    save(); render();
  }
  function resetFocus() {
    state.focus.running=false; state.focus.endAt=null; state.focus.remaining=FOCUS_MODES[state.focus.mode].minutes*60;
    save(); render(); showToast('Таймер сброшен.');
  }

  function bindNotesEditor() {
    const editor=document.getElementById('notesEditor'); if(!editor) return;
    let debounce=null;
    editor.addEventListener('input',()=>{
      state.notes=editor.value;
      const words=editor.value.trim()?editor.value.trim().split(/\s+/).length:0;
      const count=document.getElementById('noteWordCount'); if(count) count.textContent=`${words} слов`;
      const status=document.getElementById('notesStatus'); if(status) status.textContent='Сохранение…';
      clearTimeout(debounce);
      debounce=setTimeout(()=>{
        save();
        const currentStatus=document.getElementById('notesStatus'); if(currentStatus) currentStatus.textContent='Сохранено';
      },180);
    });
    editor.addEventListener('blur',()=>{ state.notes=editor.value; save(); });
  }
  function exportData() {
    const blob=new Blob([JSON.stringify({product:'RITM',exportedAt:new Date().toISOString(),data:state},null,2)],{type:'application/json'});
    const url=URL.createObjectURL(blob);
    const link=document.createElement('a'); link.href=url; link.download=`ritm-backup-${todayKey}.json`;
    document.body.appendChild(link); link.click(); link.remove(); setTimeout(()=>URL.revokeObjectURL(url),1000);
    showToast('Резервная копия подготовлена.');
  }
  async function importData(file) {
    if(!file) return;
    if(file.size>2000000){showToast('Файл слишком большой (максимум 2 МБ).');return;}
    try{
      const parsed=JSON.parse(await file.text());
      const incoming=normalizeData(parsed.data||parsed);
      if(!confirm('Импорт заменит текущие задачи, привычки и заметки. Продолжить?')) return;
      state=incoming; save(); applyTheme(); if(state.focus.running) startTicker(); navigate('today'); showToast('Данные успешно импортированы.');
    }catch(error){showToast('Не удалось прочитать файл резервной копии.');console.error(error);}
  }
  function handleAction(button) {
    const action=button.dataset.action, id=button.dataset.id;
    if(action==='new-task') openTaskDialog();
    else if(action==='quick-add'){document.getElementById('quickForm').reset();document.getElementById('quickDialog').showModal();setTimeout(()=>document.getElementById('quickText').focus(),30);}
    else if(action==='delete-task-current'){
      const form=document.getElementById('taskForm');const taskId=String(form.elements.id.value||'');
      const task=state.tasks.find(t=>t.id===taskId);
      if(task&&confirm(`Удалить задачу «${task.title}»?`)){state.tasks=state.tasks.filter(t=>t.id!==taskId);save();document.getElementById('taskDialog').close();render();showToast('Задача удалена.');}
    }
    else if(action==='new-task-date') openTaskDialog(null,button.dataset.date);
    else if(action==='edit-task'){const task=state.tasks.find(t=>t.id===id);if(task)openTaskDialog(task);}
    else if(action==='toggle-task') toggleTask(id);
    else if(action==='toggle-habit') toggleHabit(id,button.dataset.date||todayKey);
    else if(action==='new-habit'){document.getElementById('habitForm').reset();document.getElementById('habitDialog').showModal();setTimeout(()=>document.getElementById('habitName').focus(),30);}
    else if(action==='delete-habit'){
      const habit=state.habits.find(h=>h.id===id);
      if(habit&&confirm(`Удалить привычку «${habit.name}» и её историю?`)){state.habits=state.habits.filter(h=>h.id!==id);save();render();showToast('Привычка удалена.');}
    }
    else if(action==='go-habits') navigate('habits');
    else if(action==='go-notes') navigate('notes');
    else if(action==='go-focus') navigate('focus');
    else if(action==='go-settings') navigate('settings');
    else if(action==='change-date'){selectedDate=shiftDate(selectedDate,Number(button.dataset.step));render();}
    else if(action==='select-date'){selectedDate=button.dataset.date;navigate('today');}
    else if(action==='calendar-month'){
      const d=fromDateKey(selectedDate);const target=new Date(d.getFullYear(),d.getMonth()+Number(button.dataset.step),1,12);
      const lastDay=new Date(target.getFullYear(),target.getMonth()+1,0).getDate();
      selectedDate=toDateKey(new Date(target.getFullYear(),target.getMonth(),Math.min(d.getDate(),lastDay),12));render();
    }
    else if(action==='task-filter'){taskFilter=button.dataset.filter;render();}
    else if(action==='week-shift'){selectedDate=shiftDate(selectedDate,Number(button.dataset.step));render();}
    else if(action==='week-current'){selectedDate=todayKey;render();}
    else if(action==='focus-toggle') toggleFocus();
    else if(action==='focus-mode') changeFocusMode(button.dataset.mode);
    else if(action==='focus-reset') resetFocus();
    else if(action==='set-theme'){state.settings.theme=button.dataset.theme;save();render();}
    else if(action==='export-data') exportData();
    else if(action==='clear-samples'){
      const before=state.tasks.length+state.habits.length;
      state.tasks=state.tasks.filter(t=>!t.sample);state.habits=state.habits.filter(h=>!h.sample);save();render();
      showToast(before===state.tasks.length+state.habits.length?'Демонстрационных записей нет.':'Примеры удалены.');
    }
    else if(action==='reset-data'){
      if(confirm('Удалить все задачи, привычки, заметки и историю фокуса? Это действие нельзя отменить.')){
        state={...starterData(),tasks:[],habits:[],notes:''};selectedDate=todayKey;save();render();showToast('Пространство очищено.');
      }
    }
  }

  document.addEventListener('click',event=>{
    const close=event.target.closest('[data-close-dialog]');
    if(close){document.getElementById(close.dataset.closeDialog)?.close();return;}
    const pageButton=event.target.closest('[data-page]');
    if(pageButton){navigate(pageButton.dataset.page);return;}
    const actionButton=event.target.closest('[data-action]');
    if(actionButton) handleAction(actionButton);
  });

  document.getElementById('taskForm').addEventListener('submit',event=>{
    event.preventDefault();
    const form=event.currentTarget;
    const values=Object.fromEntries(new FormData(form).entries());
    const title=String(values.title||'').trim(); if(!title)return;
    const existing=values.id?state.tasks.find(t=>t.id===values.id):null;
    const record={id:existing?.id||uid(),title,date:values.date||todayKey,time:values.time||'',priority:values.priority||'normal',duration:Number(values.duration)||25,category:values.category||'Другое',details:values.details||'',done:existing?.done||false,createdAt:existing?.createdAt||Date.now(),sample:false};
    if(existing) Object.assign(existing,record); else state.tasks.push(record);
    selectedDate=record.date;save();document.getElementById('taskDialog').close();
    if(!['today','tasks','week'].includes(activePage))activePage='today';
    render();showToast(existing?'Задача обновлена.':'Задача добавлена в план.');
  });
  document.getElementById('habitForm').addEventListener('submit',event=>{
    event.preventDefault();
    const values=Object.fromEntries(new FormData(event.currentTarget).entries());
    const name=String(values.name||'').trim();if(!name)return;
    state.habits.push({id:uid(),name,color:values.color||'violet',history:{},sample:false});
    save();document.getElementById('habitDialog').close();render();showToast('Новая привычка добавлена.');
  });
  document.getElementById('quickForm').addEventListener('submit',event=>{
    event.preventDefault();
    const title=String(new FormData(event.currentTarget).get('title')||'').trim();if(!addQuickTask(title,todayKey))return;
    event.currentTarget.reset();document.getElementById('quickDialog').close();selectedDate=todayKey;navigate('today');showToast('Записано. Теперь можно не держать это в голове.');
  });
  document.getElementById('themeToggle').addEventListener('click',()=>{
    state.settings.theme=state.settings.theme==='dark'?'light':'dark';save();applyTheme();
  });
  document.getElementById('topAvatar').addEventListener('click',()=>navigate('settings'));
  document.getElementById('globalSearch').addEventListener('input',event=>{
    searchTerm=event.target.value.trim();activePage='tasks';render();
    const input=document.getElementById('globalSearch');input.focus();input.setSelectionRange(input.value.length,input.value.length);
  });
  pageContainer.addEventListener('change',event=>{
    if(event.target && event.target.id==='importFile'){ importData(event.target.files?.[0]); event.target.value=''; }
  });
  pageContainer.addEventListener('submit',event=>{
    if(event.target?.id!=='todayQuickForm') return;
    event.preventDefault();
    const input=event.target.elements.title;
    if(!addQuickTask(input.value,selectedDate)) return;
    render();
    showToast('Задача добавлена в план.');
    document.querySelector('#todayQuickForm input[name=title]')?.focus();
  });

  document.addEventListener('keydown',event=>{
    const target=event.target;
    const typing=target&&(target.matches('input,textarea,select')||target.isContentEditable);
    if(event.key==='Escape')document.querySelectorAll('dialog[open]').forEach(dialog=>dialog.close());
    if(typing||event.metaKey||event.ctrlKey||event.altKey)return;
    if(event.key==='n'||event.key==='N'){event.preventDefault();openTaskDialog();}
    if(event.key==='/'){event.preventDefault();document.getElementById('globalSearch').focus();}
    if(event.key==='1')navigate('today');
    if(event.key==='2')navigate('tasks');
    if(event.key==='3')navigate('week');
  });

  function initialize() {
    syncTodayKey();
    if(state.focus.running&&state.focus.endAt){
      state.focus.remaining=Math.max(0,(state.focus.endAt-Date.now())/1000);
      if(state.focus.remaining<=0)finishFocus();
    }
    render();startTicker();
    window.addEventListener('pagehide',()=>save());
    document.addEventListener('visibilitychange',()=>{ if(syncTodayKey()) render(); if(state.focus.running) timerTick(); });
    window.addEventListener('pageshow',()=>{ if(syncTodayKey()) render(); if(state.focus.running) timerTick(); });
    if('serviceWorker' in navigator&&location.protocol.startsWith('http')){
      window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(error=>console.warn('RITM offline mode:',error)));
    }
  }
  initialize();
})();
