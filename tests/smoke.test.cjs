const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

test('основные файлы и локальные иконки присутствуют', () => {
  for (const file of ['index.html', 'styles.css', 'app.js', 'sw.js', 'manifest.webmanifest', 'README.md', 'COMPARISON.md', 'start.bat']) {
    assert.ok(fs.existsSync(path.join(root, file)), `Не найден ${file}`);
  }
  for (const file of ['assets/icon.svg', 'assets/icon-192.png', 'assets/icon-512.png']) {
    assert.ok(fs.existsSync(path.join(root, file)), `Не найдена иконка ${file}`);
  }
});

test('страница использует локальные ресурсы и Content Security Policy', () => {
  const html = read('index.html');
  assert.match(html, /Content-Security-Policy/);
  assert.match(html, /script-src 'self'/);
  assert.match(html, /href="styles\.css"/);
  assert.match(html, /src="app\.js"/);
  assert.doesNotMatch(html, /https:\/\/(?:fonts\.googleapis\.com|cdn\.|unpkg\.com)/);
});

test('мобильная навигация содержит все основные разделы, включая заметки', () => {
  const html = read('index.html');
  const nav = html.match(/<nav class="mobile-nav"[\s\S]*?<\/nav>/)?.[0] || '';
  for (const page of ['today', 'tasks', 'week', 'habits', 'notes', 'focus']) {
    assert.match(nav, new RegExp(`data-page="${page}"`));
  }
  assert.equal((nav.match(/data-page=/g) || []).length, 6);
});

test('импорт резервной копии обрабатывается делегированно для динамического поля', () => {
  const app = read('app.js');
  assert.match(app, /pageContainer\.addEventListener\('change'/);
  assert.match(app, /event\.target\.id==='importFile'/);
  assert.doesNotMatch(app, /getElementById\('importFile'\)\.addEventListener/);
});

test('заметки обновляют состояние сразу и сохраняются при уходе со страницы', () => {
  const app = read('app.js');
  assert.match(app, /state\.notes=editor\.value/);
  assert.match(app, /editor\.addEventListener\('blur',\(\)=>\{ state\.notes=editor\.value; save\(\); \}\)/);
  assert.match(app, /window\.addEventListener\('pagehide',\(\)=>save\(\)\)/);
});

test('статистика фокуса не засчитывает перерывы как рабочие сессии', () => {
  const app = read('app.js');
  assert.match(app, /item\.date===key&&item\.mode==='pomodoro'/);
  assert.match(app, /s\.date===todayKey&&s\.mode==='pomodoro'/);
});

test('недельный обзор строит семь дней и поддерживает переход по неделям', () => {
  const app = read('app.js');
  assert.match(app, /Array\.from\(\{length:7\}/);
  assert.match(app, /data-action=\"week-shift\"/);
  assert.match(app, /data-action=\"week-current\"/);
});

test('сервис-воркер обновляет версию и кэширует установочные иконки', () => {
  const sw = read('sw.js');
  assert.match(sw, /ritm-static-v4/);
  assert.match(sw, /icon-192\.png/);
  assert.match(sw, /icon-512\.png/);
  assert.match(sw, /request\.mode==='navigate'/);
});

test('manifest корректен и содержит PNG-иконки для установки', () => {
  const manifest = JSON.parse(read('manifest.webmanifest'));
  assert.equal(manifest.name, 'RITM — твой день в своём ритме');
  assert.equal(manifest.display, 'standalone');
  assert.ok(manifest.icons.some(icon => icon.sizes === '192x192' && icon.type === 'image/png'));
  assert.ok(manifest.icons.some(icon => icon.sizes === '512x512' && icon.purpose === 'maskable'));
});

test('таблица конкурентов отделяет проверенные функции от собственных выводов', () => {
  const comparison = read('COMPARISON.md');
  for (const name of ['Notion', 'Todoist', 'TickTick', 'Structured']) assert.ok(comparison.includes(name));
  assert.match(comparison, /Нет облачной синхронизации и совместной работы/);
  assert.match(comparison, /Источники/);
});

test("GitHub Pages workflow проверяет проект и публикует статические файлы в gh-pages", () => {
  const workflow = fs.readFileSync(path.join(root, ".github/workflows/pages.yml"), "utf8");
  assert.match(workflow, /branches:\s*\[main\]/);
  assert.match(workflow, /npm run check/);
  assert.match(workflow, /npm test/);
  assert.match(workflow, /contents:\s*write/);
  assert.match(workflow, /peaceiris\/actions-gh-pages@v4/);
  assert.match(workflow, /publish_branch:\s*gh-pages/);
  assert.ok(fs.existsSync(path.join(root, ".nojekyll")));
});

test("главный экран позволяет добавить задачу без открытия модального окна", () => {
  const app = read('app.js');
  assert.match(app, /id=\"todayQuickForm\"/);
  assert.match(app, /pageContainer\.addEventListener\('submit'/);
  assert.match(app, /function addQuickTask\(/);
  assert.match(app, /data-action=\"new-task\"/);
});

test("главный экран показывает доступный прогресс задач и быстрые переходы", () => {
  const app = read('app.js');
  assert.match(app, /role=\"progressbar\"/);
  assert.match(app, /data-action=\"go-focus\"/);
  assert.match(app, /data-action=\"go-notes\"/);
});
