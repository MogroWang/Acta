const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { app, BrowserWindow } = require('electron');

const testData = fs.mkdtempSync(path.join(os.tmpdir(), 'acta-smoke-'));
app.setPath('userData', testData);
app.commandLine.appendSwitch('disable-gpu');

app.whenReady().then(async () => {
  const window = new BrowserWindow({ show: false, webPreferences: { contextIsolation: true, sandbox: true } });
  try {
    await window.loadFile(path.join(__dirname, '..', 'src', 'index.html'));
    const result = await window.webContents.executeJavaScript(`(() => {
      document.querySelector('[data-view="todos"]').click();
      const todoOrder = [...document.querySelectorAll('.item-card')].map(card => card.dataset.id);
      const todosOnly = [...document.querySelectorAll('.item-card')].every(card => library.items.find(item => item.id === card.dataset.id)?.type === 'todo');
      document.querySelector('[data-view="notes"]').click();
      const notesOnly = [...document.querySelectorAll('.item-card')].every(card => library.items.find(item => item.id === card.dataset.id)?.type === 'note');
      document.querySelector('[data-view="todos"]').click();
      document.querySelector('[data-id="launch-plan"]').click();
      const taskBeforeImeEnter = library.items.find(item => item.id === 'launch-plan').tasks.length;
      const imeEnter = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, isComposing: true });
      document.querySelector('.task-text').dispatchEvent(imeEnter);
      const imeEnterIgnored = library.items.find(item => item.id === 'launch-plan').tasks.length === taskBeforeImeEnter;
      const picker = document.querySelector('#linkItemSelect');
      picker.value = 'welcome-note';
      picker.dispatchEvent(new Event('change'));
      document.querySelector('#addItemLink').click();
      const task = library.items.find(item => item.id === 'launch-plan');
      const note = library.items.find(item => item.id === 'welcome-note');
      const reciprocalLink = task.linkedIds.includes(note.id) && note.linkedIds.includes(task.id);
      const markdown = buildNoteMarkdown(note);
      const imported = parseImportedNote(markdown, 'roundtrip.md');
      const unsafe = parseImportedNote('# Test\\n\\n[bad](javascript:alert(1))\\n\\n<img src=x onerror=alert(1)>', 'unsafe.md');
      document.querySelector('.open-linked-item').click();
      const hasExportAction = Boolean(document.querySelector('#exportNote'));
      task.tasks.forEach(entry => entry.done = true);
      task.completed = false;
      document.querySelector('[data-view="todos"]').click();
      const completedHiddenFromTodos = !document.querySelector('[data-id="launch-plan"]');
      document.querySelector('[data-view="completed"]').click();
      const completedVisible = Boolean(document.querySelector('[data-id="launch-plan"]'));
      const darkTheme = document.querySelector('input[name="actaTheme"][value="mono-dark"]');
      darkTheme.checked = true;
      darkTheme.dispatchEvent(new Event('change'));
      const darkCreateMenuBackground = getComputedStyle(document.querySelector('#createMenu')).backgroundColor;
      const darkThemeColor = document.querySelector('meta[name="theme-color"]').content;
      return {
        todoOrder,
        todosOnly,
        notesOnly,
        completedHiddenFromTodos,
        completedVisible,
        darkCreateMenuBackground,
        darkThemeColor,
        reciprocalLink,
        imeEnterIgnored,
        hasPriorityBadge: Boolean(document.querySelector('.priority-pill.high')),
        hasExportAction,
        roundtripTitle: imported.title,
        roundtripText: stripHTML(imported.body),
        unsafeBody: unsafe.body
      };
    })()`);

    assert.deepEqual(result.todoOrder.slice(0, 2), ['launch-plan', 'weekend-list']);
    assert.equal(result.todosOnly, true);
    assert.equal(result.notesOnly, true);
    assert.equal(result.completedHiddenFromTodos, true);
    assert.equal(result.completedVisible, true);
    assert.match(result.darkCreateMenuBackground, /^rgb\(/);
    assert.equal(result.darkThemeColor, '#111310');
    assert.equal(result.reciprocalLink, true);
    assert.equal(result.imeEnterIgnored, true);
    assert.equal(result.hasPriorityBadge, true);
    assert.equal(result.hasExportAction, true);
    assert.equal(result.roundtripTitle, '欢迎来到 Acta');
    assert.match(result.roundtripText, /记录，然后行动/);
    assert.doesNotMatch(result.unsafeBody, /javascript:|<img/i);
    console.log('Acta smoke test passed: IME composition, strict views, completed tasks, links, priority sorting, and note Markdown round-trip.');
  } finally {
    window.destroy();
    app.quit();
  }
}).catch(error => {
  console.error(error);
  app.exit(1);
});

app.on('will-quit', () => {
  try { fs.rmSync(testData, { recursive: true, force: true }); }
  catch { /* Electron can briefly retain files on Windows; the OS temp cleaner will remove them. */ }
});
