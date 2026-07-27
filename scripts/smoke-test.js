const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const puppeteer = require('puppeteer-core');

const testData = fs.mkdtempSync(path.join(os.tmpdir(), 'acta-smoke-'));

function findBrowser() {
  const candidates = [
    process.env.ACTA_BROWSER,
    process.platform === 'win32' && path.join(process.env['ProgramFiles(x86)'] || '', 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
    process.platform === 'win32' && path.join(process.env.ProgramFiles || '', 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
    process.platform === 'win32' && path.join(process.env.LOCALAPPDATA || '', 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
    process.platform === 'darwin' && '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
    process.platform === 'darwin' && '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    process.platform === 'linux' && '/usr/bin/microsoft-edge',
    process.platform === 'linux' && '/usr/bin/google-chrome'
  ].filter(Boolean);
  const executable = candidates.find(candidate => fs.existsSync(candidate));
  if (!executable) throw new Error('No compatible browser found. Set ACTA_BROWSER to Microsoft Edge or Google Chrome.');
  return executable;
}

async function main() {
  let browser;
  try {
    browser = await puppeteer.launch({
      executablePath:findBrowser(),
      headless:true,
      userDataDir:testData,
      pipe:true,
      timeout:60000,
      protocolTimeout:60000,
      args:[
        '--disable-gpu',
        '--no-first-run',
        '--no-default-browser-check',
        '--disable-background-networking',
        '--allow-file-access-from-files'
      ]
    });
    const page = await browser.newPage();
    await page.setViewport({ width:1280, height:800, deviceScaleFactor:1 });
    await page.exposeFunction('__actaResizeTo', (width, height) => page.setViewport({
      width,
      height,
      deviceScaleFactor:1
    }));
    await page.goto(pathToFileURL(path.join(__dirname, '..', 'src', 'index.html')).href, { waitUntil:'load' });
    const smokeRun = page.evaluate(`(async () => {
      window.__actaSmokeStep = 'started';
      window.resizeTo = (width, height) => window.__actaResizeTo(width, height);
      window.alert = message => { throw new Error('Unexpected alert: ' + message); };
      window.confirm = message => { throw new Error('Unexpected confirmation: ' + message); };
      window.prompt = message => { throw new Error('Unexpected prompt: ' + message); };
      const waitFor = async predicate => {
        for (let attempt = 0; attempt < 80; attempt += 1) {
          if (predicate()) return true;
          await new Promise(resolve => setTimeout(resolve, 25));
        }
        return false;
      };
      await waitFor(() => document.querySelectorAll('.data-profile-card').length > 0 && document.querySelector('#workspaceStatus')?.textContent !== '正在读取行记数据档案…');
      const defaultLibraryItems = library.items.length;
      const smokeNow = new Date().toISOString();
      const smokeOld = new Date(Date.now() - 45 * 86400000).toISOString();
      library = normalizeLibrary({
        version: 1,
        folders: [
          { id:'ideas', nameKey:'inboxFolder', color:'#b68b54' },
          { id:'work', nameKey:'workFolder', color:'#6f8a72' },
          { id:'life', nameKey:'lifeFolder', color:'#a87876' },
          { id:'reading', nameKey:'readingFolder', color:'#7a7799' }
        ],
        items: [
          { id:'welcome-note', type:'note', folderId:'ideas', title:'欢迎来到 Acta', body:'<p>Acta 把<strong>笔记</strong>和<strong>待办</strong>放进同一份安静的行记数据。</p><h2>记录，然后行动</h2>', linkedIds:[], createdAt:smokeNow, updatedAt:smokeNow },
          { id:'reading-note', type:'note', folderId:'reading', title:'旧阅读摘记', body:'<p>用于验证笔记筛选。</p>', linkedIds:[], createdAt:smokeOld, updatedAt:smokeOld },
          { id:'launch-plan', type:'todo', folderId:'work', title:'整理 Acta 原型反馈', due:todayISO(), dueTime:'09:30:00', durationMinutes:90, priority:'high', notes:'测试待办', linkedIds:[], tasks:[{ id:'t1', text:'已完成步骤', done:true }, { id:'t2', text:'待完成步骤', done:false }], completed:false, createdAt:smokeNow, updatedAt:smokeNow },
          { id:'weekend-list', type:'todo', folderId:'life', title:'周末的小计划', due:daysFromToday(2), priority:'low', notes:'留一点没有安排的时间。', linkedIds:[], tasks:[{ id:'t3', text:'散步四十分钟', done:false }], completed:false, createdAt:smokeNow, updatedAt:smokeNow }
        ]
      });
      selectedId = library.items[0]?.id || null;
      currentView = 'inbox';
      renderAll();
      const developerSettingsRemoved = !document.querySelector('[data-settings-page="developer"], [data-settings-panel="developer"], #notificationStatus, #sendNotificationNow, #scheduleNotification');
      document.querySelector('[data-view="todos"]').click();
      const todoFilterControlsVisible = !document.querySelector('[data-filter-context="todo"]').hidden && document.querySelector('[data-filter-context="mixed"]').hidden;
      const todoOrder = [...document.querySelectorAll('.item-card')].map(card => card.dataset.id);
      const todosOnly = [...document.querySelectorAll('.item-card')].every(card => library.items.find(item => item.id === card.dataset.id)?.type === 'todo');
      const changeFilter = (selector, value) => {
        const select = document.querySelector(selector);
        select.value = value;
        select.dispatchEvent(new Event('change', { bubbles:true }));
        return [...document.querySelectorAll('.item-card')].map(card => card.dataset.id);
      };
      const todoPriorityFilterWorks = JSON.stringify(changeFilter('#todoPriorityFilter', 'low')) === JSON.stringify(['weekend-list']);
      document.querySelector('#clearListFilters').click();
      const todoDeadlineFilterWorks = JSON.stringify(changeFilter('#todoDueFilter', 'today')) === JSON.stringify(['launch-plan']);
      document.querySelector('#clearListFilters').click();
      const todoFolderFilterWorks = JSON.stringify(changeFilter('#todoFolderFilter', 'life')) === JSON.stringify(['weekend-list']);
      document.querySelector('#clearListFilters').click();
      const todoFiltersClear = ['todoPriorityFilter', 'todoDueFilter', 'todoFolderFilter'].every(id => document.querySelector('#' + id).value === 'all') && document.querySelectorAll('.item-card').length === 2;
      document.querySelector('[data-view="notes"]').click();
      const noteFilterControlsVisible = !document.querySelector('[data-filter-context="note"]').hidden && document.querySelector('[data-filter-context="mixed"]').hidden;
      const notesOnly = [...document.querySelectorAll('.item-card')].every(card => library.items.find(item => item.id === card.dataset.id)?.type === 'note');
      const noteFolderFilterWorks = JSON.stringify(changeFilter('#noteFolderFilter', 'reading')) === JSON.stringify(['reading-note']);
      document.querySelector('#clearListFilters').click();
      const noteUpdatedFilterWorks = JSON.stringify(changeFilter('#noteUpdatedFilter', '7')) === JSON.stringify(['welcome-note']);
      document.querySelector('#clearListFilters').click();
      const noteRelationFilterWorks = changeFilter('#noteRelationFilter', 'unlinked').length === 2;
      document.querySelector('#clearListFilters').click();
      const noteFiltersClear = ['noteFolderFilter', 'noteRelationFilter', 'noteUpdatedFilter'].every(id => document.querySelector('#' + id).value === 'all') && document.querySelectorAll('.item-card').length === 2;
      document.querySelector('[data-view="inbox"]').click();
      document.querySelector('.type-filter-group [data-filter="todo"]').click();
      const inboxTodoFilterControlsVisible = !document.querySelector('[data-filter-context="mixed"]').hidden
        && !document.querySelector('[data-filter-context="todo"]').hidden
        && document.querySelector('[data-filter-context="note"]').hidden;
      const inboxTodoFilterWorks = JSON.stringify(changeFilter('#todoPriorityFilter', 'low')) === JSON.stringify(['weekend-list']);
      document.querySelector('#clearListFilters').click();
      document.querySelector('.type-filter-group [data-filter="note"]').click();
      const inboxNoteFilterControlsVisible = !document.querySelector('[data-filter-context="mixed"]').hidden
        && document.querySelector('[data-filter-context="todo"]').hidden
        && !document.querySelector('[data-filter-context="note"]').hidden;
      const inboxNoteFilterWorks = JSON.stringify(changeFilter('#noteUpdatedFilter', '7')) === JSON.stringify(['welcome-note']);
      document.querySelector('#clearListFilters').click();
      document.querySelector('.type-filter-group [data-filter="all"]').click();
      document.querySelector('[data-view="todos"]').click();
      document.querySelector('[data-id="launch-plan"]').click();
      const taskBeforeImeEnter = library.items.find(item => item.id === 'launch-plan').tasks.length;
      const imeEnter = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, isComposing: true });
      document.querySelector('.task-text').dispatchEvent(imeEnter);
      const imeEnterIgnored = library.items.find(item => item.id === 'launch-plan').tasks.length === taskBeforeImeEnter;
      const task = library.items.find(item => item.id === 'launch-plan');
      document.querySelector('#itemMetaButton').click();
      const todoClassificationSelect = document.querySelector('#classificationFolder');
      const scheduledTodoListShowsTimeRange = document.querySelector('.item-card[data-id="launch-plan"] .card-schedule-date')?.querySelectorAll('time').length === 2;
      const todoTimeDetailsVisible = ['todoCreatedAtSummary', 'todoStartAtSummary', 'todoDueAtSummary'].every(id => Boolean(document.querySelector('#' + id)))
        && document.querySelector('#todoStartAtSummary')?.textContent.includes(':')
        && document.querySelector('#todoDueAtSummary')?.textContent.includes(':');
      const todoClassificationSelectOnly = Boolean(todoClassificationSelect?.querySelector('option[value=""]'))
        && !document.querySelector('#classificationName, #editClassificationName, #confirmClassificationName, #manageClassification');
      todoClassificationSelect.value = '';
      todoClassificationSelect.dispatchEvent(new Event('change', { bubbles:true }));
      const todoCanSelectUnclassified = task.folderId === ''
        && document.querySelector('.editor-folder').textContent === '未归类';
      todoClassificationSelect.value = 'work';
      todoClassificationSelect.dispatchEvent(new Event('change', { bubbles:true }));
      const todoCreatedAtImmutable = Boolean(document.querySelector('#todoCreatedAt'))
        && !document.querySelector('input[id*="Created"], input[name*="created"]');
      const todoDurationRemoved = !document.querySelector('#dueDuration, #quickCaptureDuration')
        && !Object.prototype.hasOwnProperty.call(task, 'durationMinutes');
      document.querySelector('#editSchedule').click();
      const editedDue = new Date(new Date(task.startAt).getTime() + 2 * 60 * 60 * 1000);
      document.querySelector('#todoDueAt').value = dateTimeLocalValue(editedDue);
      document.querySelector('#confirmSchedule').click();
      const todoScheduleEditable = task.dueAt === editedDue.toISOString()
        && document.querySelector('#scheduleDueValue').textContent.includes(':')
        && document.querySelector('#todoDueAtSummary').dateTime === task.dueAt;
      document.querySelector('#editSchedule').click();
      document.querySelector('#clearTodoDueAt').click();
      const scheduleCancellationWarningShown = !document.querySelector('#scheduleWarning').hidden;
      document.querySelector('#confirmSchedule').click();
      const todoScheduleCancellationWarns = !task.dueAt
        && scheduleCancellationWarningShown
        && document.querySelector('#todoDueAtSummary').dateTime === ''
        && !calendarTodos().some(item => item.id === task.id);
      const unscheduledTodoListShowsCreatedTime = document.querySelector('.item-card[data-id="launch-plan"] .card-created-date')?.dateTime === task.createdAt;
      document.querySelector('#editSchedule').click();
      document.querySelector('#todoDueAt').value = dateTimeLocalValue(editedDue);
      document.querySelector('#todoDueAt').dispatchEvent(new Event('input', { bubbles:true }));
      document.querySelector('#confirmSchedule').click();
      document.querySelector('#itemMetaButton').click();
      const todoMetaCloseAnimation = document.querySelector('#itemMetaPopover').classList.contains('is-closing')
        && getComputedStyle(document.querySelector('#itemMetaPopover')).animationName === 'itemMetaPopoverOut'
        && getComputedStyle(document.querySelector('#itemMetaPopover')).animationTimingFunction.includes('cubic-bezier');
      await waitFor(() => document.querySelector('#itemMetaPopover').hidden);
      const picker = document.querySelector('#linkItemSelect');
      picker.value = 'welcome-note';
      picker.dispatchEvent(new Event('change'));
      document.querySelector('#addItemLink').click();
      const note = library.items.find(item => item.id === 'welcome-note');
      const reciprocalLink = task.linkedIds.includes(note.id) && note.linkedIds.includes(task.id);
      library.items.push(...Array.from({ length:7 }, (_, index) => {
        const hour = String(10 + Math.floor(index / 2)).padStart(2, '0');
        const minute = index % 2 ? '30' : '00';
        const startAt = new Date(todayISO() + 'T' + hour + ':' + minute + ':00');
        const dueAt = new Date(startAt.getTime() + (index % 3 === 0 ? 90 : 60) * 60000);
        return {
          id:'calendar-overflow-' + index,
          type:'todo',
          folderId:'work',
          title:'日历密集待办 ' + (index + 1),
          startAt:startAt.toISOString(),
          dueAt:dueAt.toISOString(),
          priority:index === 0 ? 'high' : 'medium',
          notes:'',
          linkedIds:[],
          tasks:[
            { id:'overflow-' + index + '-1', text:'准备步骤', done:false },
            { id:'overflow-' + index + '-2', text:'确认步骤', done:false }
          ],
          completed:false,
          createdAt:smokeNow,
          updatedAt:smokeNow
        };
      }));
      const crossDayDates = Array.from({ length:3 }, (_, index) => daysFromToday(index));
      const crossDayTodo = {
        id:'calendar-cross-day',
        type:'todo',
        folderId:'work',
        title:'跨天待办',
        startAt:new Date(crossDayDates[0] + 'T22:00:00').toISOString(),
        dueAt:new Date(crossDayDates[2] + 'T08:00:00').toISOString(),
        priority:'medium',
        notes:'',
        linkedIds:[],
        tasks:[],
        completed:false,
        createdAt:smokeNow,
        updatedAt:smokeNow
      };
      library.items.push(crossDayTodo);
      const crossDayGroups = calendarTodosByDate([crossDayTodo]);
      const calendarCrossDayGrouped = crossDayGroups.size === crossDayDates.length
        && crossDayDates.every(iso => crossDayGroups.get(iso)?.some(item => item.id === crossDayTodo.id));
      const calendarCrossDayPeriodOverlap = crossDayDates.every(iso => calendarPeriodTodos('day', calendarDate(iso)).some(item => item.id === crossDayTodo.id));
      renderEditor();
      const todoLinkPicker = document.querySelector('#linkItemSelect');
      todoLinkPicker.value = 'calendar-overflow-0';
      todoLinkPicker.dispatchEvent(new Event('change'));
      document.querySelector('#addItemLink').click();
      const linkedTodo = library.items.find(item => item.id === 'calendar-overflow-0');
      const reciprocalTodoLink = task.linkedIds.includes(linkedTodo.id) && linkedTodo.linkedIds.includes(task.id);
      const calendarWorkspace = document.querySelector('.workspace');
      calendarWorkspace.style.transition = 'none';
      void calendarWorkspace.offsetWidth;
      const calendarReplacesToday = document.querySelectorAll('.smart-nav [data-view="calendar"]').length === 1 && !document.querySelector('.smart-nav [data-view="today"]');
      const calendarTimetableRemoved = !document.querySelector('[data-calendar-mode="timetable"]');
      document.querySelector('[data-view="calendar"]').click();
      await waitFor(() => document.querySelector('.item-pane').getBoundingClientRect().width > 620);
      const calendarMonthVisible = document.body.classList.contains('calendar-view') && !document.querySelector('#calendarToolbar').hidden && Boolean(document.querySelector('.calendar-month-view'));
      const calendarCreatedNoteVisible = Boolean(document.querySelector('[data-calendar-cell="' + todayISO() + '"] [data-calendar-note="welcome-note"]'));
      const calendarCrossDayMonthVisible = crossDayDates.slice(1).every(iso => document.querySelector('[data-calendar-cell="' + iso + '"] [data-calendar-todo="calendar-cross-day"]'));
      const calendarGreenTheme = getComputedStyle(document.body).getPropertyValue('--calendar-accent').trim().toLowerCase() === '#4f7656'
        && getComputedStyle(document.querySelector('[data-calendar-mode="month"]')).backgroundColor === 'rgb(79, 118, 86)';
      const calendarExpansionMetrics = {
        innerWidth,
        itemWidth:document.querySelector('.item-pane').getBoundingClientRect().width,
        editorDisplay:getComputedStyle(document.querySelector('#editorPane')).display,
        workspaceColumns:getComputedStyle(document.querySelector('.workspace')).gridTemplateColumns
      };
      const calendarExpanded = calendarExpansionMetrics.editorDisplay === 'none' && calendarExpansionMetrics.itemWidth > 620;
      calendarWorkspace.style.removeProperty('transition');
      const calendarTodoVisible = Boolean(document.querySelector('[data-calendar-todo="launch-plan"]'));
      const desktopMonthTodo = document.querySelector('[data-calendar-todo="launch-plan"]');
      const calendarMonthTitleOnly = !desktopMonthTodo.querySelector('time')
        && desktopMonthTodo.querySelector('.calendar-month-todo-title').textContent === task.title
        && getComputedStyle(desktopMonthTodo.querySelector('.calendar-month-todo-title')).display !== 'none';
      const calendarMonthHasNoToggle = !document.querySelector('.calendar-month-view [data-calendar-toggle], .calendar-month-view [data-calendar-subtask-toggle]');
      const calendarMonthOverflowIcon = document.querySelector('.calendar-month-view .calendar-overflow use')?.getAttribute('href') === '#i-more';
      const calendarMonthWeekNumbers = document.querySelector('.calendar-week-number-heading')?.textContent === '周数' && document.querySelectorAll('.calendar-week-number').length === 6 && /^\\d+$/.test(document.querySelector('.calendar-week-number b')?.textContent || '') && /W\\d+/.test(document.querySelector('#viewTitle').textContent);
      const calendarMonthShiftLabels = [...document.querySelectorAll('[data-calendar-shift-label]')].map(node => node.textContent).join('|') === '上一月|下一月';
      const calendarRelationVisible = document.querySelector('[data-calendar-todo="launch-plan"] [data-calendar-open-note="welcome-note"]')?.title.includes('欢迎来到 Acta');
      document.querySelector('[data-calendar-todo="launch-plan"] [data-calendar-open-note="welcome-note"]').click();
      const calendarLinkNavigation = selectedId === 'welcome-note' && currentView === 'notes';
      document.querySelector('[data-view="calendar"]').click();
      document.querySelector('[data-calendar-mode="year"]').click();
      const calendarYearVisible = Boolean(document.querySelector('.calendar-year-view')) && document.querySelectorAll('.calendar-year-month').length === 12;
      const calendarYearShiftLabels = [...document.querySelectorAll('[data-calendar-shift-label]')].map(node => node.textContent).join('|') === '上一年|下一年';
      const calendarNonlinearMotion = getComputedStyle(document.querySelector('.calendar-year-view')).animationName === 'calendarViewEnter' && getComputedStyle(document.querySelector('.calendar-year-view')).animationTimingFunction.includes('cubic-bezier');
      document.querySelector('[data-calendar-mode="week"]').click();
      const calendarWeekVisible = Boolean(document.querySelector('.calendar-week-view')) && document.querySelectorAll('.calendar-week-day').length === 7;
      const desktopWeekEvents = document.querySelector('[data-calendar-todo="launch-plan"]')?.closest('.calendar-week-events');
      const calendarWeekScrollMetrics = { overflowY:getComputedStyle(desktopWeekEvents).overflowY, scrollHeight:desktopWeekEvents.scrollHeight, clientHeight:desktopWeekEvents.clientHeight, viewHeight:document.querySelector('.calendar-week-view').clientHeight, listHeight:document.querySelector('.calendar-list').clientHeight };
      const calendarWeekScrollable = getComputedStyle(desktopWeekEvents).overflowY === 'scroll' && desktopWeekEvents.scrollHeight > desktopWeekEvents.clientHeight;
      const calendarWeekShiftLabels = [...document.querySelectorAll('[data-calendar-shift-label]')].map(node => node.textContent).join('|') === '上一周|下一周';
      document.querySelector('[data-calendar-subtask-toggle="launch-plan"][data-calendar-subtask-id="t2"]').click();
      const calendarWeekSubtaskComplete = task.tasks.find(entry => entry.id === 't2').done && isTodoComplete(task) && document.querySelector('[data-calendar-subtask="t2"]')?.classList.contains('is-complete');
      document.querySelector('[data-calendar-subtask-toggle="launch-plan"][data-calendar-subtask-id="t2"]').click();
      const calendarWeekSubtaskUndo = !task.tasks.find(entry => entry.id === 't2').done && !isTodoComplete(task) && !document.querySelector('[data-calendar-subtask="t2"]')?.classList.contains('is-complete');
      document.querySelector('[data-calendar-mode="day"]').click();
      const calendarDayVisible = Boolean(document.querySelector('.calendar-day-view')) && Boolean(document.querySelector('.calendar-day-summary'));
      const calendarDayShiftLabels = [...document.querySelectorAll('[data-calendar-shift-label]')].map(node => node.textContent).join('|') === '上一日|下一日';
      document.querySelector('[data-calendar-subtask-toggle="launch-plan"][data-calendar-subtask-id="t1"]').click();
      const calendarDaySubtaskUndo = !task.tasks.find(entry => entry.id === 't1').done;
      document.querySelector('[data-calendar-subtask-toggle="launch-plan"][data-calendar-subtask-id="t1"]').click();
      const calendarDaySubtaskComplete = task.tasks.find(entry => entry.id === 't1').done;
      const calendarToggle = document.querySelector('[data-calendar-toggle="launch-plan"]');
      calendarToggle.click();
      const calendarQuickComplete = isTodoComplete(task) && Boolean(document.querySelector('[data-calendar-todo="launch-plan"].is-complete'));
      document.querySelector('[data-calendar-toggle="launch-plan"]').click();
      const calendarQuickUndo = !isTodoComplete(task) && task.tasks.every(entry => entry.done === false) && !document.querySelector('[data-calendar-todo="launch-plan"].is-complete');
      document.querySelector('[data-calendar-mode="week"]').click();
      window.resizeTo(600, 700);
      await waitFor(() => innerWidth <= 600 && innerHeight <= 700);
      const mobileWeekView = document.querySelector('.calendar-week-view');
      const mobileWeekTaskColumn = document.querySelector('[data-calendar-todo="launch-plan"]')?.closest('.calendar-week-day');
      const mobileWeekEvents = mobileWeekTaskColumn?.querySelector('.calendar-week-events');
      const calendarMobileWeekFits = mobileWeekTaskColumn?.getBoundingClientRect().width <= document.querySelector('.calendar-list').getBoundingClientRect().width && getComputedStyle(mobileWeekView).display === 'flex';
      const mobileWeekHint = document.querySelector('.calendar-week-swipe-hint');
      const calendarMobileWeekHint = getComputedStyle(mobileWeekHint).display === 'flex' && mobileWeekHint.textContent.includes('左右滑动');
      const mobileWeekTodo = document.querySelector('[data-calendar-todo="launch-plan"]');
      const calendarMobileWeekRestored = !mobileWeekTodo.querySelector('.calendar-week-icon')
        && getComputedStyle(mobileWeekTodo.querySelector('.calendar-todo-check')).display === 'grid'
        && getComputedStyle(mobileWeekTodo.querySelector('.calendar-todo-content')).display === 'grid'
        && getComputedStyle(mobileWeekTodo.querySelector('.calendar-todo-title')).display !== 'none';
      const mobileWeekViewStyle = getComputedStyle(mobileWeekView);
      const mobileWeekDayStyle = getComputedStyle(mobileWeekTaskColumn);
      const mobileWeekEventsStyle = getComputedStyle(mobileWeekEvents);
      const calendarMobileWeekSwipeMetrics = {
        viewOverflowX:mobileWeekViewStyle.overflowX,
        viewTouchAction:mobileWeekViewStyle.touchAction,
        snap:mobileWeekViewStyle.scrollSnapType,
        dayOverflowX:mobileWeekDayStyle.overflowX,
        dayOverflowY:mobileWeekDayStyle.overflowY,
        eventsOverflowX:mobileWeekEventsStyle.overflowX,
        eventsOverflowY:mobileWeekEventsStyle.overflowY
      };
      const calendarMobileWeekWholeCardSwipe = mobileWeekViewStyle.overflowX === 'auto'
        && mobileWeekViewStyle.touchAction === 'auto'
        && mobileWeekViewStyle.scrollSnapType.includes('x')
        && !mobileWeekViewStyle.scrollSnapType.includes('mandatory')
        && ['clip', 'hidden'].includes(mobileWeekDayStyle.overflowX)
        && mobileWeekEventsStyle.overflowX === 'visible'
        && mobileWeekEventsStyle.overflowY === 'visible'
        && getComputedStyle(mobileWeekTodo.querySelector('.calendar-todo-content')).touchAction.includes('pan-x');
      const calendarMobileWeekVerticalLocked = document.body.classList.contains('calendar-week-active')
        && getComputedStyle(document.querySelector('.calendar-list')).overflowY === 'hidden'
        && mobileWeekViewStyle.overflowY === 'hidden'
        && mobileWeekDayStyle.overflowY === 'auto'
        && mobileWeekEventsStyle.overflowY === 'visible';
      const calendarMobileWeekScrollable = mobileWeekView.scrollWidth > mobileWeekView.clientWidth && getComputedStyle(mobileWeekView).scrollSnapType.includes('x');
      document.querySelector('[data-calendar-mode="month"]').click();
      const mobileMonthRect = document.querySelector('.calendar-month-view').getBoundingClientRect();
      const calendarMobileMonthFits = mobileMonthRect.width <= document.querySelector('.calendar-list').getBoundingClientRect().width + 1;
      const mobileMonthTodo = document.querySelector('[data-calendar-todo="launch-plan"]');
      const calendarMobileMonthIconsOnly = getComputedStyle(mobileMonthTodo.querySelector('.calendar-month-todo-icon')).display === 'grid'
        && getComputedStyle(mobileMonthTodo.querySelector('.calendar-month-todo-title')).display === 'none'
        && (!mobileMonthTodo.querySelector('time') || getComputedStyle(mobileMonthTodo.querySelector('time')).display === 'none')
        && mobileMonthTodo.getBoundingClientRect().width <= 24;
      const mobileTodayCell = document.querySelector('[data-calendar-cell="' + todayISO() + '"]');
      const mobileMonthItems = [...mobileTodayCell.querySelectorAll('.calendar-month-todo')].slice(0, 2);
      const mobileTodayCellRect = mobileTodayCell.getBoundingClientRect();
      const calendarMobileMonthIconsHorizontal = mobileMonthItems.length === 2
        && Math.abs(mobileMonthItems[0].getBoundingClientRect().top - mobileMonthItems[1].getBoundingClientRect().top) <= 1
        && mobileMonthItems.every(item => item.getBoundingClientRect().right <= mobileTodayCellRect.right + 1);
      const selectedBeforeMobileDrill = selectedId;
      document.querySelector('[data-calendar-mode="year"]').click();
      const currentMonthISO = todayISO().slice(0, 7) + '-01';
      const mobileYearMonthRegion = document.querySelector('[data-calendar-year-month="' + currentMonthISO + '"]');
      mobileYearMonthRegion.querySelector('.calendar-mini-day[data-calendar-date="' + todayISO() + '"]').click();
      const calendarMobileYearDrillsToMonth = calendarViewMode === 'month'
        && calendarDateISO(calendarCursor) === currentMonthISO
        && currentView === 'calendar'
        && selectedId === selectedBeforeMobileDrill;
      const mobileTargetWeek = document.querySelector('[data-calendar-cell="' + todayISO() + '"]').closest('[data-calendar-week]');
      mobileTargetWeek.querySelector('[data-calendar-open]').click();
      const calendarMobileMonthDrillsToWeek = calendarViewMode === 'week'
        && calendarDateISO(calendarCursor) === todayISO()
        && currentView === 'calendar'
        && selectedId === selectedBeforeMobileDrill;
      await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      const focusedWeekView = document.querySelector('.calendar-week-view').getBoundingClientRect();
      const focusedWeekDay = document.querySelector('.calendar-week-day[data-calendar-day="' + todayISO() + '"]').getBoundingClientRect();
      const calendarMobileWeekShowsSelectedDay = focusedWeekDay.left >= focusedWeekView.left - 1
        && focusedWeekDay.right <= focusedWeekView.right + 1;
      document.querySelector('.calendar-week-day[data-calendar-day="' + todayISO() + '"] [data-calendar-open]').click();
      const calendarMobileWeekDrillsToDay = calendarViewMode === 'day'
        && calendarDateISO(calendarCursor) === todayISO()
        && currentView === 'calendar'
        && selectedId === selectedBeforeMobileDrill;
      document.querySelector('[data-calendar-mode="month"]').click();
      window.resizeTo(1280, 800);
      await waitFor(() => innerWidth > 1200 && innerHeight > 700);
      document.querySelector('[data-calendar-mode="year"]').click();
      document.querySelector('.calendar-mini-day[data-calendar-date="' + todayISO() + '"]').click();
      const calendarDesktopClickLogicUnchanged = calendarViewMode === 'day' && calendarDateISO(calendarCursor) === todayISO();
      document.querySelector('[data-calendar-mode="month"]').click();
      const calendarPeriodBeforeShift = document.querySelector('#viewTitle').textContent;
      document.querySelector('[data-calendar-shift="1"]').click();
      const calendarPeriodShifted = document.querySelector('#viewTitle').textContent !== calendarPeriodBeforeShift;
      document.querySelector('[data-calendar-today]').click();
      const calendarReturnedToday = calendarDateISO(calendarCursor) === todayISO();
      const calendarDefaultOption = document.querySelector('#defaultViewSetting option[value="calendar"]')?.textContent === '日历' && !document.querySelector('#defaultViewSetting option[value="today"]');
      const editorTitleLayout = () => {
        const title = document.querySelector('#editorTitle');
        const pane = document.querySelector('#editorPane');
        const style = getComputedStyle(title);
        return {
          height:title.getBoundingClientRect().height,
          lineHeight:Number.parseFloat(style.lineHeight),
          paneWidth:pane.getBoundingClientRect().width
        };
      };
      const compactEditorTitle = metrics => metrics.paneWidth > 500 && metrics.height <= metrics.lineHeight * 1.5 + 2;
      document.querySelector('[data-view="todos"]').click();
      document.querySelector('[data-id="launch-plan"]').click();
      calendarWorkspace.style.transition = 'none';
      document.querySelector('[data-view="calendar"]').click();
      void calendarWorkspace.offsetWidth;
      calendarWorkspace.style.removeProperty('transition');
      void calendarWorkspace.offsetWidth;
      document.querySelector('#editorTitle').value = '隐藏期间的错误待办标题';
      document.querySelector('[data-view="todos"]').click();
      const calendarExitTodoTitleSynced = document.querySelector('#viewTitle').textContent === '所有待办' && document.querySelector('#editorTitle').value === task.title && document.querySelector('.editor-wrap')?.dataset.editorId === selectedId;
      calendarWorkspace.style.transition = 'none';
      void calendarWorkspace.offsetWidth;
      const calendarExitTodoTitleCompact = await waitFor(() => compactEditorTitle(editorTitleLayout()));
      const calendarExitTodoTitleMetrics = editorTitleLayout();
      calendarWorkspace.style.removeProperty('transition');
      document.querySelector('[data-view="notes"]').click();
      document.querySelector('[data-id="welcome-note"]').click();
      calendarWorkspace.style.transition = 'none';
      document.querySelector('[data-view="calendar"]').click();
      void calendarWorkspace.offsetWidth;
      calendarWorkspace.style.removeProperty('transition');
      void calendarWorkspace.offsetWidth;
      document.querySelector('#editorTitle').value = '隐藏期间的错误笔记标题';
      document.querySelector('[data-view="notes"]').click();
      const calendarExitNoteTitleSynced = document.querySelector('#viewTitle').textContent === '所有笔记' && document.querySelector('#editorTitle').value === note.title && document.querySelector('.editor-wrap')?.dataset.editorId === selectedId;
      calendarWorkspace.style.transition = 'none';
      void calendarWorkspace.offsetWidth;
      const calendarExitNoteTitleCompact = await waitFor(() => compactEditorTitle(editorTitleLayout()));
      const calendarExitNoteTitleMetrics = editorTitleLayout();
      calendarWorkspace.style.removeProperty('transition');
      document.querySelector('[data-view="todos"]').click();
      document.querySelector('[data-id="launch-plan"]').click();
      await waitFor(() => !document.body.classList.contains('suppress-task-refresh'));
      const markdown = buildNoteMarkdown(note);
      const imported = parseImportedNote(markdown, 'roundtrip.md');
      const unsafe = parseImportedNote('# Test\\n\\n[bad](javascript:alert(1))\\n\\n<img src=x onerror=alert(1)>', 'unsafe.md');
      const tick = String.fromCharCode(96);
      const fence = tick.repeat(3);
      const enhancedSource = ['## Enhanced', '', '> quoted line', '', '~~deleted~~ ==marked== ' + tick + 'code' + tick, '', '- [x] finished', '- [ ] pending', '', '---', '', fence + 'js', 'const ready = true;', fence].join('\\n');
      const enhanced = parseImportedNote(enhancedSource, 'enhanced.md');
      const enhancedRoundtrip = noteHTMLToMarkdown(enhanced.body);
      const markdownRoundtripFlags = {
        quote: enhanced.body.includes('<blockquote>') && enhancedRoundtrip.includes('> quoted line'),
        strike: enhanced.body.includes('<del>deleted</del>') && enhancedRoundtrip.includes('~~deleted~~'),
        highlight: enhanced.body.includes('<mark>marked</mark>') && enhancedRoundtrip.includes('==marked=='),
        inlineCode: enhanced.body.includes('<code>code</code>') && enhancedRoundtrip.includes(tick + 'code' + tick),
        tasks: enhanced.body.includes('markdown-task') && enhancedRoundtrip.includes('- [x] finished') && enhancedRoundtrip.includes('- [ ] pending'),
        divider: enhanced.body.includes('<hr>') && enhancedRoundtrip.includes('---'),
        codeBlock: enhanced.body.includes('data-language="js"') && enhancedRoundtrip.includes(fence + 'js')
      };
      await waitFor(() => Boolean(document.querySelector('.relation-trigger')));
      document.querySelector('.relation-trigger').click();
      const openRelationDialog = document.querySelector('.relation-dialog[open]');
      const relationWindowAnimation = getComputedStyle(openRelationDialog).animationName === 'actaWindowOpen';
      const relationBackdropAnimation = getComputedStyle(openRelationDialog, '::backdrop').animationName === 'actaDialogBackdropIn';
      openRelationDialog.querySelector('.relation-dialog-close').click();
      const relationCloseAnimation = openRelationDialog.classList.contains('is-closing') && getComputedStyle(openRelationDialog).animationName === 'actaWindowClose';
      await waitFor(() => !openRelationDialog.open);
      document.querySelector('.open-linked-item').click();
      document.querySelector('#itemMetaButton').click();
      const noteClassificationSelectOnly = Boolean(document.querySelector('#classificationFolder'))
        && !document.querySelector('#classificationName, #editClassificationName, #confirmClassificationName, #manageClassification');
      document.querySelector('#itemMetaButton').click();
      const noteMetaCloseAnimation = document.querySelector('#itemMetaPopover').classList.contains('is-closing')
        && getComputedStyle(document.querySelector('#itemMetaPopover')).animationName === 'itemMetaPopoverOut';
      await waitFor(() => document.querySelector('#itemMetaPopover').hidden);
      const exportActionButton = document.querySelector('#exportNote');
      const hasExportAction = Boolean(exportActionButton);
      const markdownToolbarActions = document.querySelectorAll('.note-toolbar [data-command], .note-toolbar [data-note-action]').length;
      const immersiveButton = document.querySelector('#focusNoteEditor');
      const exportBeforeImmersive = Boolean(exportActionButton.compareDocumentPosition(immersiveButton) & Node.DOCUMENT_POSITION_FOLLOWING);
      const noteCreationTimeVisible = document.querySelector('#noteCreatedAt')?.textContent.includes('创建于')
        && /\\d{2}:\\d{2}:\\d{2}/.test(document.querySelector('#noteCreatedAt')?.textContent || '')
        && getComputedStyle(document.querySelector('#noteCreatedAt')).display !== 'none';
      const normalEditTimeIncludesSeconds = document.querySelector('#noteUpdatedAt')?.textContent.includes('最后编辑')
        && /\\d{2}:\\d{2}:\\d{2}/.test(document.querySelector('#noteUpdatedAt')?.textContent || '')
        && getComputedStyle(document.querySelector('#noteUpdatedAt')).display !== 'none';
      const immersiveNamingCorrect = immersiveButton?.title === '沉浸编辑'
        && document.querySelector('#exitFocusNoteEditor')?.title === '退出沉浸编辑';
      exportActionButton.click();
      await waitFor(() => document.querySelector('#noteExportDialog').open);
      const noteExportDialog = document.querySelector('#noteExportDialog');
      const exportDialogAnimation = getComputedStyle(noteExportDialog).animationName === 'actaWindowOpen';
      const exportFormatsComplete = ['markdown', 'pdf', 'image'].every(format => noteExportDialog.querySelector('input[name="noteExportFormat"][value="' + format + '"]'));
      const pdfFormatInput = noteExportDialog.querySelector('input[name="noteExportFormat"][value="pdf"]');
      pdfFormatInput.checked = true;
      pdfFormatInput.dispatchEvent(new Event('change', { bubbles:true }));
      const pdfOptionsComplete = ['#noteExportPdfPaper', '#noteExportPdfOrientation', '#noteExportPdfMarginPreset', '#noteExportPdfMargin', '#noteExportPdfFontSize', '#noteExportPdfTitle', '#noteExportPdfDate'].every(selector => noteExportDialog.querySelector(selector))
        && !noteExportDialog.querySelector('[data-export-options="pdf"]').hidden;
      const exportTargetNote = library.items.find(item => item.id === selectedId);
      const pdfTestConfig = window.__actaNoteExportTest.pdfConfig();
      const pdfTestCanvases = await window.__actaNoteExportTest.renderCanvases(exportTargetNote, pdfTestConfig);
      const pdfTestBytes = window.__actaNoteExportTest.buildPdf(pdfTestCanvases, pdfTestConfig.pagePoints);
      const pdfGenerationWorks = String.fromCharCode(...pdfTestBytes.slice(0, 5)) === '%PDF-' && pdfTestBytes.length > 1000;
      const imageFormatInput = noteExportDialog.querySelector('input[name="noteExportFormat"][value="image"]');
      imageFormatInput.checked = true;
      imageFormatInput.dispatchEvent(new Event('change', { bubbles:true }));
      const imageOptionsComplete = ['#noteExportImageLayout', '#noteExportImageRatio', '#noteExportImageWidth', '#noteExportImageHeight', '#noteExportImageTheme', '#noteExportImageBackground', '#noteExportImageBackgroundFile', '#noteExportImageWatermark', '#noteExportImageFontSize', '#noteExportImageFont', '#noteExportImageLineHeight', '#noteExportImageLetterSpacing', '#noteExportImageTitle', '#noteExportImageDate'].every(selector => noteExportDialog.querySelector(selector))
        && !noteExportDialog.querySelector('[data-export-options="image"]').hidden;
      document.querySelector('#closeNoteExport').click();
      const exportDialogCloseAnimation = noteExportDialog.classList.contains('is-closing') && getComputedStyle(noteExportDialog).animationName === 'actaWindowClose';
      await waitFor(() => !noteExportDialog.open);
      const noteBody = document.querySelector('#noteBody');
      noteBody.focus();
      const visualToggleProbe = document.createElement('p');
      visualToggleProbe.textContent = 'toggle-format-smoke';
      noteBody.append(visualToggleProbe);
      const visualToggleRange = document.createRange();
      visualToggleRange.selectNodeContents(visualToggleProbe.firstChild);
      getSelection().removeAllRanges();
      getSelection().addRange(visualToggleRange);
      const boldButton = document.querySelector('[data-command="bold"]');
      boldButton.dispatchEvent(new MouseEvent('mousedown', { bubbles:true }));
      const visualSelectedFormatWorks = Boolean([...noteBody.querySelectorAll('b,strong')].find(node => node.textContent === 'toggle-format-smoke'));
      boldButton.dispatchEvent(new MouseEvent('mousedown', { bubbles:true }));
      const visualSelectedFormatToggles = ![...noteBody.querySelectorAll('b,strong')].some(node => node.textContent === 'toggle-format-smoke');
      visualToggleProbe.remove();
      noteBody.dispatchEvent(new Event('input', { bubbles:true }));
      const collapsedVisualRange = document.createRange();
      collapsedVisualRange.selectNodeContents(noteBody);
      collapsedVisualRange.collapse(false);
      getSelection().removeAllRanges();
      getSelection().addRange(collapsedVisualRange);
      const visualBeforeCollapsedFormat = noteBody.innerHTML;
      document.querySelector('[data-command="bold"]').dispatchEvent(new MouseEvent('mousedown', { bubbles:true }));
      const visualCollapsedFormatIgnored = noteBody.innerHTML === visualBeforeCollapsedFormat;
      immersiveButton.click();
      await waitFor(() => document.body.classList.contains('note-focus-mode'));
      const immersiveStartsVisual = !noteBody.hidden && document.querySelector('#noteMarkdownSource').hidden;
      const immersiveEditTimeIncludesSeconds = /\\d{2}:\\d{2}:\\d{2}/.test(document.querySelector('#noteFocusUpdatedAt')?.textContent || '');
      const originalToolbarPosition = document.documentElement.dataset.noteToolbarPosition || 'bottom';
      document.documentElement.dataset.noteToolbarPosition = 'top';
      await new Promise(resolve => requestAnimationFrame(resolve));
      const immersiveTopbarBottom = document.querySelector('.note-focus-header').getBoundingClientRect().bottom;
      const immersiveTopToolbarTop = document.querySelector('.note-toolbar').getBoundingClientRect().top;
      const immersiveTopbarToolbarSeamless = Math.abs(immersiveTopToolbarTop - immersiveTopbarBottom) <= 1;
      document.documentElement.dataset.noteToolbarPosition = originalToolbarPosition;
      const colorLuma = color => {
        const values = (color.match(/[\\d.]+/g) || []).slice(0, 3).map(Number);
        if (color.startsWith('oklab(')) return (values[0] || 0) * 255;
        const channels = color.startsWith('color(') ? values.map(value => value * 255) : values;
        return channels.length === 3 ? channels[0] * .2126 + channels[1] * .7152 + channels[2] * .0722 : NaN;
      };
      const noteBodyStyle = getComputedStyle(noteBody);
      const immersiveLightColors = [noteBodyStyle.backgroundColor, noteBodyStyle.color, colorLuma(noteBodyStyle.backgroundColor), colorLuma(noteBodyStyle.color)];
      const immersiveLightThemeCorrect = colorLuma(noteBodyStyle.backgroundColor) > colorLuma(noteBodyStyle.color);
      const immersiveContentWidth = noteBody.clientWidth - parseFloat(noteBodyStyle.paddingLeft) - parseFloat(noteBodyStyle.paddingRight);
      const immersivePcArticleWider = immersiveContentWidth >= 1120;
      const immersiveThemeBeforeCheck = document.documentElement.dataset.actaTheme;
      const immersiveTransitionBeforeCheck = noteBody.style.transition;
      noteBody.style.transition = 'none';
      document.documentElement.dataset.actaTheme = 'mono-dark';
      void noteBody.offsetWidth;
      const darkImmersiveStyle = getComputedStyle(noteBody);
      const immersiveDarkColors = [
        darkImmersiveStyle.backgroundColor,
        darkImmersiveStyle.color,
        colorLuma(darkImmersiveStyle.backgroundColor),
        colorLuma(darkImmersiveStyle.color),
        getComputedStyle(document.documentElement).getPropertyValue('--paper').trim(),
        getComputedStyle(document.documentElement).getPropertyValue('--note-wash').trim(),
        darkImmersiveStyle.getPropertyValue('--note-focus-surface').trim()
      ];
      const immersiveDarkThemeCorrect = colorLuma(darkImmersiveStyle.backgroundColor) < colorLuma(darkImmersiveStyle.color);
      document.documentElement.dataset.actaTheme = immersiveThemeBeforeCheck || 'mono-light';
      void noteBody.offsetWidth;
      noteBody.style.transition = immersiveTransitionBeforeCheck;
      const immersiveEnterAnimation = getComputedStyle(document.querySelector('#editorPane')).animationName === 'noteImmersiveBackdropIn'
        && getComputedStyle(document.querySelector('.note-editor')).animationName === 'noteImmersiveEditorIn';
      await Promise.all(
        [...document.querySelectorAll('#editorPane, .note-editor')]
          .flatMap(node => node.getAnimations())
          .map(animation => animation.finished.catch(() => {}))
      );
      document.querySelector('[data-note-action="toggle-markdown"]').click();
      const markdownSource = document.querySelector('#noteMarkdownSource');
      const markdownSourceVisible = document.body.classList.contains('note-focus-mode') && !markdownSource.hidden && noteBody.hidden && markdownSource.value.includes('记录，然后行动');
      markdownSource.setSelectionRange(markdownSource.value.length, markdownSource.value.length);
      const markdownBeforeCollapsedFormat = markdownSource.value;
      document.querySelector('[data-command="bold"]').dispatchEvent(new MouseEvent('mousedown', { bubbles:true }));
      const markdownCollapsedFormatIgnored = markdownSource.value === markdownBeforeCollapsedFormat;
      const markdownInsertStart = markdownSource.value.length;
      markdownSource.setRangeText('\\n\\nfocus', markdownInsertStart, markdownInsertStart, 'end');
      markdownSource.setSelectionRange(markdownInsertStart + 2, markdownInsertStart + 7);
      document.querySelector('[data-command="bold"]').dispatchEvent(new MouseEvent('mousedown', { bubbles:true }));
      const markdownSelectedFormatWorks = markdownSource.value.includes('**focus**');
      document.querySelector('[data-command="bold"]').dispatchEvent(new MouseEvent('mousedown', { bubbles:true }));
      const markdownSelectedFormatToggles = markdownSource.value.includes('focus') && !markdownSource.value.includes('**focus**');
      markdownSource.value += '\\n\\n> source mode quote\\n\\n- [x] source task';
      markdownSource.dispatchEvent(new Event('input'));
      window.resizeTo(600, 700);
      await waitFor(() => innerWidth <= 600 && innerHeight <= 700);
      const immersiveToolbar = document.querySelector('.note-toolbar');
      const immersiveToolbarWraps = immersiveToolbar.scrollWidth <= immersiveToolbar.clientWidth + 1
        && immersiveToolbar.scrollHeight > 48;
      const immersiveHeaderRect = document.querySelector('.note-focus-header').getBoundingClientRect();
      const immersiveSourceRect = markdownSource.getBoundingClientRect();
      const immersiveToolbarRect = immersiveToolbar.getBoundingClientRect();
      const immersiveMobileMetrics = {
        innerHeight,
        headerTop:immersiveHeaderRect.top,
        headerBottom:immersiveHeaderRect.bottom,
        sourceTop:immersiveSourceRect.top,
        sourceBottom:immersiveSourceRect.bottom,
        toolbarTop:immersiveToolbarRect.top,
        toolbarBottom:immersiveToolbarRect.bottom
      };
      const immersiveMobileFits = immersiveHeaderRect.top >= -1
        && immersiveSourceRect.top >= immersiveHeaderRect.bottom - 1
        && immersiveSourceRect.bottom <= immersiveToolbarRect.top + 1
        && immersiveToolbarRect.bottom <= innerHeight + 1;
      window.resizeTo(1280, 800);
      await waitFor(() => innerWidth > 1200 && innerHeight > 700);
      document.querySelector('[data-note-action="toggle-markdown"]').click();
      const immersiveSwitchesToVisual = document.body.classList.contains('note-focus-mode') && !noteBody.hidden && markdownSource.hidden;
      const markdownSourceApplied = Boolean(noteBody.querySelector('blockquote')) && Boolean(noteBody.querySelector('.markdown-task[data-checked="true"]'));
      noteBody.dispatchEvent(new KeyboardEvent('keydown', { key:'Escape', bubbles:true }));
      const immersiveExitAnimation = document.body.classList.contains('note-focus-leaving')
        && getComputedStyle(document.querySelector('#editorPane')).animationName === 'noteImmersiveBackdropOut';
      const immersiveExitIsFast = parseFloat(getComputedStyle(document.querySelector('#editorPane')).animationDuration) <= .2;
      await waitFor(() => !document.body.classList.contains('note-focus-mode'));
      const immersiveEscapeExits = !document.body.classList.contains('note-focus-mode');
      window.resizeTo(600, 700);
      await waitFor(() => innerWidth <= 600 && innerHeight <= 700);
      const mobileEditorPane = document.querySelector('#editorPane');
      mobileEditorPane.classList.add('mobile-open');
      mobileEditorPane.scrollTop = mobileEditorPane.scrollHeight;
      await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      const mobileBottomToolbarRect = document.querySelector('.note-toolbar').getBoundingClientRect();
      const mobileBottomBar = document.querySelector('#primarySidebar');
      const mobileBottomBarRect = mobileBottomBar.getBoundingClientRect();
      const mobileBottomToolbarAvoidsNav = mobileBottomToolbarRect.bottom <= mobileBottomBarRect.top + 1;
      const mobileLightBarLuma = colorLuma(getComputedStyle(mobileBottomBar).backgroundColor);
      document.documentElement.dataset.actaTheme = 'mono-dark';
      const mobileDarkBarLuma = colorLuma(getComputedStyle(mobileBottomBar).backgroundColor);
      const mobileBottomBarFollowsTheme = mobileDarkBarLuma < mobileLightBarLuma;
      document.documentElement.dataset.actaTheme = immersiveThemeBeforeCheck || 'mono-light';
      mobileEditorPane.classList.remove('mobile-open');
      window.resizeTo(1280, 800);
      await waitFor(() => innerWidth > 1200 && innerHeight > 700);
      const quickMenuAction = document.querySelector('#createMenu [data-create="quick"]');
      const quickMenuHasLightning = quickMenuAction.querySelector('use').getAttribute('href') === '#i-lightning';
      const quickMenuAccent = getComputedStyle(quickMenuAction.querySelector('.menu-icon')).color;
      const quickContextBefore = { selectedId, currentView, currentFilter, searchQuery, mobileEditorOpen };
      window.__actaSmokeStep = 'quick-note-opening';
      document.querySelector('#newButton').click();
      quickMenuAction.click();
      await waitFor(() => document.querySelector('#quickCaptureDialog').open);
      const quickGuideAvailable = document.querySelectorAll('.quick-capture-step').length === 2 && document.querySelectorAll('[data-quick-type]').length === 2;
      const quickCaptureDialogRect = document.querySelector('#quickCaptureDialog').getBoundingClientRect();
      const quickCaptureActionsRect = document.querySelector('.quick-capture-actions').getBoundingClientRect();
      const quickCaptureDesktopFits = quickCaptureDialogRect.top >= -1
        && quickCaptureDialogRect.bottom <= innerHeight + 1
        && quickCaptureActionsRect.top >= quickCaptureDialogRect.top
        && quickCaptureActionsRect.bottom <= quickCaptureDialogRect.bottom + 1;
      const quickScheduleDefaults = Boolean(document.querySelector('#quickCaptureStart').value)
        && !document.querySelector('#quickCaptureDue').value
        && !document.querySelector('#quickCaptureScheduleHint').hidden
        && !document.querySelector('#quickCaptureDuration');
      document.querySelector('[data-quick-type="note"]').click();
      document.querySelector('#quickCaptureItemTitle').value = '速记测试笔记';
      document.querySelector('#quickCaptureFolder').value = 'reading';
      document.querySelector('#quickCaptureBody').value = '# 快速想法\\n\\n- 第一条';
      window.__actaSmokeStep = 'quick-note-submitting';
      document.querySelector('#quickCaptureForm').requestSubmit();
      await waitFor(() => !document.querySelector('#quickCaptureDialog').open);
      const quickNote = library.items.find(item => item.title === '速记测试笔记');
      const quickNoteCreated = quickNote?.type === 'note' && quickNote.folderId === 'reading' && quickNote.body.includes('<h1>快速想法</h1>') && quickNote.body.includes('<li>第一条</li>') && selectedId === quickContextBefore.selectedId;
      window.__actaSmokeStep = 'quick-todo-opening';
      document.querySelector('#newButton').click();
      quickMenuAction.click();
      await waitFor(() => document.querySelector('#quickCaptureDialog').open);
      const quickTodoIsDefault = document.querySelector('[data-quick-type="todo"]').classList.contains('active')
        && !document.querySelector('#quickCaptureStartField').hidden
        && !document.querySelector('#quickCaptureDueField').hidden;
      const quickTodoDefaultsUnclassified = document.querySelector('#quickCaptureFolder').value === ''
        && document.querySelector('#quickCaptureFolder option[value=""]')?.textContent === '未归类';
      document.querySelector('#quickCaptureItemTitle').value = '速记测试待办';
      document.querySelector('#quickCaptureFolder').value = 'work';
      document.querySelector('#clearQuickCaptureDue').click();
      const quickCaptureClearWarns = !document.querySelector('#quickCaptureDue').value
        && !document.querySelector('#quickCaptureScheduleHint').hidden;
      const quickStart = new Date(document.querySelector('#quickCaptureStart').value);
      document.querySelector('#quickCaptureDue').value = dateTimeLocalValue(new Date(quickStart.getTime() + 2 * 60 * 60 * 1000));
      document.querySelector('#quickCaptureDue').dispatchEvent(new Event('input', { bubbles:true }));
      document.querySelector('#quickCapturePriority').value = 'high';
      document.querySelector('#quickCaptureTasks').value = '确认需求\\n\\n完成实现\\n验证结果';
      document.querySelector('#quickCaptureBody').value = '马上处理这件事';
      window.__actaSmokeStep = 'quick-todo-submitting';
      document.querySelector('#quickCaptureForm').requestSubmit();
      await waitFor(() => !document.querySelector('#quickCaptureDialog').open);
      const quickTodo = library.items.find(item => item.title === '速记测试待办');
      const quickTodoCreated = quickTodo?.type === 'todo'
        && quickTodo.folderId === 'work'
        && quickTodo.priority === 'high'
        && Boolean(quickTodo.startAt)
        && Boolean(quickTodo.dueAt)
        && quickTodo.dueAt > quickTodo.startAt
        && !Object.prototype.hasOwnProperty.call(quickTodo, 'durationMinutes')
        && quickTodo.notes === '马上处理这件事'
        && quickTodo.tasks.map(entry => entry.text).join('|') === '确认需求|完成实现|验证结果'
        && quickTodo.tasks.every(entry => entry.id && entry.done === false);
      const quickCapturePreservedContext = selectedId === quickContextBefore.selectedId && currentView === quickContextBefore.currentView && currentFilter === quickContextBefore.currentFilter && searchQuery === quickContextBefore.searchQuery && mobileEditorOpen === quickContextBefore.mobileEditorOpen;
      createItem('todo');
      const standardTodo = library.items.find(item => item.id === selectedId);
      const standardTodoDefaultsUnclassified = standardTodo?.type === 'todo'
        && standardTodo.folderId === ''
        && document.querySelector('.editor-folder')?.textContent === '未归类'
        && document.querySelector('#classificationFolder')?.value === '';
      library.items = library.items.filter(item => item.id !== quickNote?.id && item.id !== quickTodo?.id && item.id !== standardTodo?.id);
      selectedId = 'welcome-note';
      currentView = 'inbox';
      currentFilter = 'all';
      persist();
      renderAll();
      task.tasks.forEach(entry => entry.done = true);
      task.completed = false;
      document.querySelector('[data-view="todos"]').click();
      const completedHiddenFromTodos = !document.querySelector('[data-id="launch-plan"]');
      document.querySelector('[data-view="completed"]').click();
      const completedVisible = Boolean(document.querySelector('[data-id="launch-plan"]'));
      const nativeStatusBarCalls = [];
      const nativeSystemBarCalls = [];
      const nativeAppIconCalls = [];
      window.Capacitor = { Plugins:{ ActaSync:{
        setSystemBars: options => { nativeSystemBarCalls.push(options); return Promise.resolve(); },
        setAppIcon: options => { nativeAppIconCalls.push(options); return Promise.resolve(); }
      }, StatusBar:{
        setOverlaysWebView: options => { nativeStatusBarCalls.push(['overlay', options.overlay]); return Promise.resolve(); },
        setBackgroundColor: options => { nativeStatusBarCalls.push(['background', options.color]); return Promise.resolve(); },
        setStyle: options => { nativeStatusBarCalls.push(['style', options.style]); return Promise.resolve(); }
      } } };
      const latestStatusBarCall = type => [...nativeStatusBarCalls].reverse().find(call => call[0] === type)?.[1];
      const darkTheme = document.querySelector('input[name="actaTheme"][value="mono-dark"]');
      darkTheme.checked = true;
      darkTheme.dispatchEvent(new Event('change'));
      const darkCreateMenuBackground = getComputedStyle(document.querySelector('#createMenu')).backgroundColor;
      const darkThemeColor = document.querySelector('meta[name="theme-color"]').content;
      const darkNativeStatusBar = [latestStatusBarCall('background'), latestStatusBarCall('style')];
      const customSidebarTheme = document.querySelector('#customSidebarColor');
      customSidebarTheme.value = '#101820';
      customSidebarTheme.dispatchEvent(new Event('input'));
      const customDarkNativeStatusBar = [latestStatusBarCall('background'), latestStatusBarCall('style')];
      const detailedColorInputs = {
        customTodoColor:'#246f9b',
        customTodoSoftColor:'#d5ebf6',
        customNoteColor:'#a45d27',
        customNoteSoftColor:'#f7e1be',
        customCalendarColor:'#287a52',
        customCalendarSoftColor:'#d6eadc'
      };
      Object.entries(detailedColorInputs).forEach(([id, value]) => {
        const input = document.querySelector('#' + id);
        input.value = value;
        input.dispatchEvent(new Event('input'));
      });
      const customContentColors = getComputedStyle(document.documentElement);
      const detailedThemeColorsWork = customContentColors.getPropertyValue('--todo-accent').trim() === detailedColorInputs.customTodoColor
        && customContentColors.getPropertyValue('--todo-soft').trim() === detailedColorInputs.customTodoSoftColor
        && customContentColors.getPropertyValue('--note-accent').trim() === detailedColorInputs.customNoteColor
        && customContentColors.getPropertyValue('--note-soft').trim() === detailedColorInputs.customNoteSoftColor
        && customContentColors.getPropertyValue('--calendar-theme-accent').trim() === detailedColorInputs.customCalendarColor
        && customContentColors.getPropertyValue('--calendar-theme-soft').trim() === detailedColorInputs.customCalendarSoftColor;
      const colorfulThemeValues = ['forest-mist', 'sunset-coral', 'candy-pop'];
      const colorfulThemesAvailable = colorfulThemeValues.every(value => document.querySelector('input[name="actaTheme"][value="' + value + '"]'));
      const colorfulTheme = document.querySelector('input[name="actaTheme"][value="forest-mist"]');
      colorfulTheme.checked = true;
      colorfulTheme.dispatchEvent(new Event('change'));
      const colorfulThemeWorks = document.documentElement.dataset.actaTheme === 'forest-mist'
        && getComputedStyle(document.documentElement).getPropertyValue('--todo-accent').trim() === '#267f91'
        && getComputedStyle(document.documentElement).getPropertyValue('--note-accent').trim() === '#b6683e';
      const glowThemeValues = ['neon-ocean', 'aurora-night'];
      const glowThemesAvailable = glowThemeValues.every(value => document.querySelector('input[name="actaTheme"][value="' + value + '"]'));
      const neonTheme = document.querySelector('input[name="actaTheme"][value="neon-ocean"]');
      neonTheme.checked = true;
      neonTheme.dispatchEvent(new Event('change'));
      const glowThemeWorks = document.documentElement.dataset.actaTheme === 'mono-dark'
        && document.documentElement.dataset.actaPalette === 'neon-ocean'
        && document.documentElement.dataset.actaGlow === 'true'
        && getComputedStyle(document.querySelector('#newButton')).boxShadow !== 'none'
        && getComputedStyle(document.documentElement).getPropertyValue('--calendar-theme-accent').trim() === '#70edaa';
      const lightTheme = document.querySelector('input[name="actaTheme"][value="mono-light"]');
      lightTheme.checked = true;
      lightTheme.dispatchEvent(new Event('change'));
      const lightNativeStatusBar = [latestStatusBarCall('background'), latestStatusBarCall('style')];
      const nativeStatusBarMatchesThemes = darkNativeStatusBar[0] === '#111310' && darkNativeStatusBar[1] === 'DARK' && customDarkNativeStatusBar[0] === '#101820' && customDarkNativeStatusBar[1] === 'DARK' && lightNativeStatusBar[0] === '#e7e7e3' && lightNativeStatusBar[1] === 'LIGHT' && nativeSystemBarCalls.some(call => call.color === '#111310' && !('lightIcons' in call)) && nativeSystemBarCalls.some(call => call.color === '#e7e7e3' && !('lightIcons' in call));
      const readAppearanceSettings = () => JSON.parse(localStorage.getItem('acta.interface.settings.v1') || '{}');
      const fontSizeSetting = document.querySelector('#appFontSizeSetting');
      fontSizeSetting.value = '14';
      fontSizeSetting.dispatchEvent(new Event('input'));
      const fontSampleSelectors = ['.item-card h3', '.new-button kbd', '.settings-button', '.theme-option small', '.relation-dialog-head h3'];
      const fontSampleNodes = fontSampleSelectors.map(selector => document.querySelector(selector));
      const baselineFontSizes = fontSampleNodes.map(node => parseFloat(getComputedStyle(node).fontSize));
      const fontLayoutSelectors = ['.settings-window', '.item-pane', '.editor-pane'];
      const baselineFontLayoutOverflow = fontLayoutSelectors.map(selector => {
        const node = document.querySelector(selector);
        return Math.max(0, node.scrollWidth - node.clientWidth);
      });
      fontSizeSetting.value = '18';
      fontSizeSetting.dispatchEvent(new Event('input'));
      const expectedFontScale = 18 / 14;
      const fontScalingUnified = fontSampleNodes.every((node, index) => node
        && Math.abs(parseFloat(getComputedStyle(node).fontSize) / baselineFontSizes[index] - expectedFontScale) < .02);
      const fontSizeRangeIsReasonable = fontSizeSetting.min === '12'
        && fontSizeSetting.max === '18'
        && document.querySelector('#appFontSizeValue').textContent === '18 px'
        && document.documentElement.style.getPropertyValue('--acta-font-scale') === String(expectedFontScale)
        && readAppearanceSettings().appFontSize === 18;
      const fontSizeLayoutMetrics = fontLayoutSelectors.map((selector, index) => {
        const node = document.querySelector(selector);
        const bounds = node.getBoundingClientRect();
        const overflowing = [...node.querySelectorAll('*')]
          .filter(child => {
            const rect = child.getBoundingClientRect();
            return rect.width > 0 && rect.height > 0
              && (child.scrollWidth > child.clientWidth + 1 || rect.left < bounds.left - 1 || rect.right > bounds.right + 1);
          })
          .slice(0, 8)
          .map(child => {
            const rect = child.getBoundingClientRect();
            return { tag:child.tagName, id:child.id, className:child.className, clientWidth:child.clientWidth, scrollWidth:child.scrollWidth, left:rect.left, right:rect.right };
          });
        return { selector, clientWidth:node.clientWidth, scrollWidth:node.scrollWidth, baselineOverflow:baselineFontLayoutOverflow[index], overflowing };
      });
      const fontSizeLayoutFits = fontSizeLayoutMetrics.every(metric => metric.scrollWidth - metric.clientWidth <= metric.baselineOverflow + 1);
      fontSizeSetting.value = '14';
      fontSizeSetting.dispatchEvent(new Event('input'));
      const fixedBrandIcon = document.querySelector('.brand-mini-logo').src;
      const fixedAboutIcon = document.querySelector('.about-mark img').src;
      const fixedFavicon = document.querySelector('link[rel="icon"]').href;
      document.querySelector('input[name="actaAppIcon"][value="positive"]').click();
      const presetAppIconWorks = readAppearanceSettings().appIconPreset === 'positive'
        && document.querySelector('[data-app-icon-preview="positive"]').src.endsWith('/icons/app-icon-positive-page.png')
        && document.querySelector('.brand-mini-logo').src === fixedBrandIcon
        && document.querySelector('.about-mark img').src === fixedAboutIcon
        && document.querySelector('link[rel="icon"]').href === fixedFavicon
        && nativeAppIconCalls.at(-1)?.preset === 'positive';
      const previousAppIconPreset = readAppearanceSettings().appIconPreset;
      const previousCheckedRadio = document.querySelector('input[name="actaAppIcon"]:checked');
      document.querySelector('input[name="actaAppIcon"][value="custom"]').click();
      const nativeCustomPromptUI = !document.querySelector('[data-desktop-app-icon-only].app-icon-option').hidden
        && !document.querySelector('#chooseCustomAppIcon').hidden
        && !document.querySelector('.app-icon-options').classList.contains('native-presets-only')
        && (document.querySelector('input[name="actaAppIcon"]:checked') === previousCheckedRadio)
        && /自定义图标仅支持 PC/.test(document.querySelector('#appIconStatus').textContent)
        && readAppearanceSettings().appIconPreset === previousAppIconPreset;
      const desktopAppIconCalls = [];
      window.actaDesktop = { setAppIcon:value => { desktopAppIconCalls.push(value); return Promise.resolve(); } };
      document.querySelector('input[name="actaAppIcon"][value="default"]').click();
      document.querySelector('input[name="actaAppIcon"][value="positive"]').click();
      const nativeAppIconCallsBeforeCustom = nativeAppIconCalls.length;
      const customIconFile = new File(['<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128"><rect width="128" height="128" rx="24" fill="#2f7a52"/><circle cx="64" cy="64" r="28" fill="#fff"/></svg>'], 'smoke-icon.svg', { type:'image/svg+xml' });
      const iconTransfer = new DataTransfer();
      iconTransfer.items.add(customIconFile);
      const customIconInput = document.querySelector('#customAppIconFile');
      customIconInput.files = iconTransfer.files;
      customIconInput.dispatchEvent(new Event('change'));
      await waitFor(() => readAppearanceSettings().appIconPreset === 'custom' && readAppearanceSettings().customAppIcon?.startsWith('data:image/png'));
      await waitFor(() => desktopAppIconCalls.at(-1)?.startsWith('data:image/png'));
      const customIconSettings = readAppearanceSettings();
      const customAppIconMetrics = {
        preset:customIconSettings.appIconPreset,
        hasDataIcon:customIconSettings.customAppIcon?.startsWith('data:image/png'),
        previewMatches:document.querySelector('#customAppIconPreview').src === customIconSettings.customAppIcon,
        brandUnchanged:document.querySelector('.brand-mini-logo').src === fixedBrandIcon,
        faviconUnchanged:document.querySelector('link[rel="icon"]').href === fixedFavicon,
        nativeCallsBefore:nativeAppIconCallsBeforeCustom,
        nativeCallsAfter:nativeAppIconCalls.length,
        lastNativePreset:nativeAppIconCalls.at(-1)?.preset,
        desktopReceivedCustom:desktopAppIconCalls.at(-1)?.startsWith('data:image/png')
      };
      const customAppIconWorks = customIconSettings.appIconPreset === 'custom'
        && customIconSettings.customAppIcon.startsWith('data:image/png')
        && document.querySelector('#customAppIconPreview').src === customIconSettings.customAppIcon
        && document.querySelector('.brand-mini-logo').src === fixedBrandIcon
        && document.querySelector('link[rel="icon"]').href === fixedFavicon
        && nativeAppIconCalls.length === nativeAppIconCallsBeforeCustom
        && nativeAppIconCalls.at(-1)?.preset === 'positive'
        && desktopAppIconCalls.at(-1)?.startsWith('data:image/png');
      document.querySelector('#resetAppIcon').click();
      const resetIconSettings = readAppearanceSettings();
      const appIconResetWorks = resetIconSettings.appIconPreset === 'default'
        && resetIconSettings.customAppIcon === ''
        && document.querySelector('[data-app-icon-preview="default"]').src.endsWith('/icons/icon-512.png')
        && document.querySelector('.brand-mini-logo').src === fixedBrandIcon
        && document.querySelector('link[rel="icon"]').href === fixedFavicon
        && nativeAppIconCalls.at(-1)?.preset === 'default'
        && desktopAppIconCalls.at(-1) === '';
      delete window.actaDesktop;
      delete window.Capacitor;
      darkTheme.checked = true;
      darkTheme.dispatchEvent(new Event('change'));
      const hasPriorityBadge = Boolean(document.querySelector('.priority-pill.high'));
      const colorFlags = document.querySelectorAll('.language-flag img').length;
      const classificationActionsTogether = document.querySelector('#manageFolders').parentElement === document.querySelector('#addFolder').parentElement;
      document.querySelector('#manageFolders').click();
      await waitFor(() => document.querySelector('#classificationManagerDialog').open && Boolean(document.querySelector('[data-classification-folder].active')));
      const classificationManagerDialog = document.querySelector('#classificationManagerDialog');
      const classificationWindowAnimation = getComputedStyle(classificationManagerDialog).animationName === 'actaWindowOpen';
      classificationManagerDialog.style.animation = 'none';
      const managerFitsViewport = () => {
        const dialogRect = document.querySelector('#classificationManagerDialog').getBoundingClientRect();
        const actionsRect = document.querySelector('.classification-manager-actions').getBoundingClientRect();
        return dialogRect.left >= -1 && dialogRect.top >= -1 && dialogRect.right <= innerWidth + 1 && dialogRect.bottom <= innerHeight + 1 && actionsRect.top >= dialogRect.top && actionsRect.bottom <= dialogRect.bottom + 1;
      };
      window.resizeTo(840, 620);
      await waitFor(() => innerWidth < 900 && innerHeight < 650);
      const classificationCompactLayoutFits = managerFitsViewport();
      const compactManagerDetail = document.querySelector('.classification-manager-detail');
      const compactManagerItemLists = [...document.querySelectorAll('.classification-manager-items')];
      const classificationCompactCanScroll = getComputedStyle(compactManagerDetail).overflowY === 'hidden' && compactManagerItemLists.every(list => getComputedStyle(list).overflowY === 'auto' && list.clientHeight > 0);
      window.resizeTo(600, 700);
      await waitFor(() => innerWidth <= 600 && innerHeight <= 700);
      const classificationMobileLayoutFits = managerFitsViewport();
      const mobileManagerDetail = document.querySelector('.classification-manager-detail');
      const mobileDialogRect = document.querySelector('#classificationManagerDialog').getBoundingClientRect();
      const mobileActionsRect = document.querySelector('.classification-manager-actions').getBoundingClientRect();
      const classificationMobileMetrics = { innerWidth, innerHeight, dialog:[mobileDialogRect.left,mobileDialogRect.top,mobileDialogRect.right,mobileDialogRect.bottom], actions:[mobileActionsRect.left,mobileActionsRect.top,mobileActionsRect.right,mobileActionsRect.bottom] };
      const classificationMobileCanScroll = getComputedStyle(mobileManagerDetail).overflowY === 'auto' && mobileManagerDetail.scrollHeight > mobileManagerDetail.clientHeight;
      const mobileNameFieldRect = document.querySelector('#classificationManagerName').closest('.classification-manager-field').getBoundingClientRect();
      const mobileShortFieldRect = document.querySelector('#classificationManagerShortName').closest('.classification-manager-field').getBoundingClientRect();
      const mobileCloseActionRect = document.querySelector('#cancelClassificationManager').getBoundingClientRect();
      const mobileSaveActionRect = document.querySelector('#saveClassificationManager').getBoundingClientRect();
      const mobileDeleteActionRect = document.querySelector('#deleteClassification').getBoundingClientRect();
      const classificationMobileControlsOptimized = mobileShortFieldRect.top > mobileNameFieldRect.bottom
        && mobileNameFieldRect.left >= mobileManagerDetail.getBoundingClientRect().left
        && mobileShortFieldRect.right <= mobileManagerDetail.getBoundingClientRect().right
        && Math.abs(mobileCloseActionRect.top - mobileSaveActionRect.top) <= 1
        && mobileDeleteActionRect.bottom <= mobileCloseActionRect.top;
      window.resizeTo(1280, 800);
      await waitFor(() => innerWidth > 1200 && innerHeight > 700);
      const desktopManagerRect = classificationManagerDialog.getBoundingClientRect();
      const desktopManagerDetail = document.querySelector('.classification-manager-detail');
      const desktopManagerSections = [...document.querySelectorAll('.classification-manager-items-section')].map(section => section.getBoundingClientRect());
      const desktopManagerActions = document.querySelector('.classification-manager-actions').getBoundingClientRect();
      const classificationDesktopContentVisible = desktopManagerRect.width >= 1080 && desktopManagerRect.height >= innerHeight - 42 && getComputedStyle(desktopManagerDetail).overflowY === 'hidden' && desktopManagerSections.every(section => section.width >= 300 && section.height >= 220) && desktopManagerActions.bottom <= desktopManagerRect.bottom + 1;
      const classificationDesktopMetrics = { dialog:[desktopManagerRect.width,desktopManagerRect.height], sections:desktopManagerSections.map(section => [section.width,section.height]), actions:[desktopManagerActions.top,desktopManagerActions.bottom] };
      classificationManagerDialog.style.removeProperty('animation');
      const managedFolderId = document.querySelector('[data-classification-folder].active').dataset.classificationFolder;
      const classificationFolderCountMatches = document.querySelectorAll('[data-classification-folder]').length === library.folders.length;
      const classificationContentCount = document.querySelectorAll('[data-classification-item]').length;
      const classificationColor = document.querySelector('#classificationManagerColor');
      const classificationShortName = document.querySelector('#classificationManagerShortName');
      const classificationEmojiButton = document.querySelector('#classificationEmojiButton');
      const classificationEmojiPicker = document.querySelector('#classificationEmojiPicker');
      classificationColor.value = '#123456';
      classificationColor.dispatchEvent(new Event('input'));
      classificationEmojiButton.click();
      const classificationEmojiPickerOpens = !classificationEmojiPicker.hidden
        && classificationEmojiButton.getAttribute('aria-expanded') === 'true'
        && document.querySelectorAll('#classificationEmojiGrid [data-classification-emoji]').length >= 32;
      document.querySelector('#classificationEmojiGrid [data-classification-emoji="👩‍💻"]').click();
      const classificationEmojiPickerSelects = classificationShortName.value === '👩‍💻'
        && classificationEmojiPicker.hidden
        && classificationEmojiButton.textContent === '👩‍💻';
      classificationShortName.value = 'ABCD';
      classificationShortName.dispatchEvent(new Event('input'));
      const customShortTextLimited = classificationShortName.value === 'ABC';
      classificationEmojiButton.click();
      document.querySelector('#classificationEmojiGrid [data-classification-emoji="👩‍💻"]').click();
      document.querySelector('#saveClassificationManager').click();
      const classificationColorUpdated = library.folders.find(folder => folder.id === managedFolderId)?.color === '#123456';
      const classificationShortNameUpdated = library.folders.find(folder => folder.id === managedFolderId)?.shortName === '👩‍💻';
      const classificationDialogStayedOpen = document.querySelector('#classificationManagerDialog').open;
      const todoFolderId = library.items.find(item => item.type === 'todo')?.folderId;
      document.querySelector('[data-classification-folder="' + todoFolderId + '"]').click();
      const classificationTodoListPopulated = document.querySelectorAll('#classificationManagerTodos [data-classification-item]').length > 0;
      const classificationItemToOpen = document.querySelector('#classificationManagerTodos [data-classification-item]').dataset.classificationItem;
      document.querySelector('#classificationManagerTodos [data-classification-item]').click();
      const classificationCloseAnimation = document.querySelector('#classificationManagerDialog').classList.contains('is-closing') && getComputedStyle(document.querySelector('#classificationManagerDialog')).animationName === 'actaWindowClose';
      await waitFor(() => !document.querySelector('#classificationManagerDialog').open);
      const classificationItemOpened = selectedId === classificationItemToOpen && currentView === 'folder:' + todoFolderId && !document.querySelector('#classificationManagerDialog').open;
      window.resizeTo(600, 700);
      await waitFor(() => innerWidth <= 600 && innerHeight <= 700);
      const mobileFontLayoutSelectors = ['body', '.titlebar', '.workspace', '.item-pane'];
      const mobileFontBaselineOverflow = mobileFontLayoutSelectors.map(selector => {
        const node = document.querySelector(selector);
        return Math.max(0, node.scrollWidth - node.clientWidth);
      });
      fontSizeSetting.value = '18';
      fontSizeSetting.dispatchEvent(new Event('input'));
      const mobileFontSizeLayoutMetrics = mobileFontLayoutSelectors.map((selector, index) => {
        const node = document.querySelector(selector);
        return { selector, clientWidth:node.clientWidth, scrollWidth:node.scrollWidth, baselineOverflow:mobileFontBaselineOverflow[index] };
      });
      const mobileFontSizeLayoutFits = mobileFontSizeLayoutMetrics.every(metric => metric.scrollWidth - metric.clientWidth <= metric.baselineOverflow + 1);
      fontSizeSetting.value = '14';
      fontSizeSetting.dispatchEvent(new Event('input'));
      const mobileTitlebarButtonsVisible = ['#mobileActaData', '#mobileDataRefresh', '#mobileListSettings'].every(selector => {
        const button = document.querySelector(selector);
        const rect = button.getBoundingClientRect();
        return getComputedStyle(button).display === 'grid' && rect.width >= 35 && rect.height >= 35;
      });
      document.querySelector('[data-view="inbox"]').click();
      const mobileClassificationTrigger = document.querySelector('#mobileClassifications');
      const mobileClassificationTriggerRect = mobileClassificationTrigger.getBoundingClientRect();
      const mobileInboxTitleRect = document.querySelector('#viewTitle').getBoundingClientRect();
      const mobileTitlebarActionsRect = document.querySelector('.mobile-titlebar-actions').getBoundingClientRect();
      const mobileClassificationRelocated = mobileClassificationTrigger.textContent.trim() === '查看归类'
        && mobileClassificationTriggerRect.top >= mobileTitlebarActionsRect.bottom - 1
        && Math.abs((mobileClassificationTriggerRect.top + mobileClassificationTriggerRect.height / 2) - (mobileInboxTitleRect.top + mobileInboxTitleRect.height / 2)) <= 8
        && mobileClassificationTriggerRect.right <= document.querySelector('.item-pane').getBoundingClientRect().right + 1;
      document.querySelector('#mobileClassifications').click();
      const mobileClassificationTransition = mobileClassificationTrigger.classList.contains('is-launching')
        && getComputedStyle(mobileClassificationTrigger).animationTimingFunction.includes('cubic-bezier');
      await waitFor(() => document.querySelector('#mobileClassificationDialog').open);
      const mobileClassificationDialog = document.querySelector('#mobileClassificationDialog');
      const mobileClassificationRect = mobileClassificationDialog.getBoundingClientRect();
      const mobileClassificationListComplete = document.querySelectorAll('#mobileClassificationList [data-view^="folder:"]').length === library.folders.length;
      const mobileClassificationEditButtonsComplete = document.querySelectorAll('#mobileClassificationList [data-classification-edit]').length === library.folders.length;
      const mobileClassificationIconsUpright = [...document.querySelectorAll('#mobileClassificationList .folder-dot, #mobileClassificationList .folder-short-name')]
        .every(icon => getComputedStyle(icon).fontStyle === 'normal');
      const nativeDialogPositionFixed = getComputedStyle(mobileClassificationDialog).position === 'fixed'
        && mobileClassificationRect.left >= -1
        && mobileClassificationRect.top >= -1
        && mobileClassificationRect.right <= innerWidth + 1
        && mobileClassificationRect.bottom <= innerHeight + 1;
      const mobileClassificationEdit = document.querySelector('#mobileClassificationList [data-classification-edit]');
      const mobileClassificationEditId = mobileClassificationEdit.dataset.classificationEdit;
      mobileClassificationEdit.click();
      await waitFor(() => document.querySelector('#classificationManagerDialog').open);
      const mobileClassificationEditOpensTarget = document.querySelector('#classificationManagerList [data-classification-folder].active')?.dataset.classificationFolder === mobileClassificationEditId;
      document.querySelector('#closeClassificationManager').click();
      await waitFor(() => !document.querySelector('#classificationManagerDialog').open);
      document.querySelector('#mobileActaData').click();
      const mobileActaDataOpensSettings = document.querySelector('#settingsModal').classList.contains('open')
        && document.querySelector('[data-settings-page="workspace"]').classList.contains('active');
      document.querySelector('#settingsClose').click();
      await waitFor(() => !document.querySelector('#settingsModal').classList.contains('open'));
      window.resizeTo(1280, 800);
      await waitFor(() => innerWidth > 1200 && innerHeight > 700);
      window.__actaSmokeStep = 'classification-item-opened';
      const brandVersion = document.querySelector('.brand-version');
      const expandedBrandVersionVisible = brandVersion?.textContent.trim() === '1.1.000'
        && parseFloat(getComputedStyle(brandVersion).opacity) > .9
        && brandVersion.getBoundingClientRect().width > 0;
      const miniLogoBeforeCollapseRect = document.querySelector('.brand-mini-logo').getBoundingClientRect();
      const miniLogoCenterBeforeCollapse = miniLogoBeforeCollapseRect.left + miniLogoBeforeCollapseRect.width / 2;
      document.querySelector('#sidebarToggle').click();
      const collapsedSidebarAligned = await waitFor(() => {
        const sidebar = document.querySelector('#primarySidebar').getBoundingClientRect();
        const axis = sidebar.left + sidebar.width / 2;
        const aligned = ['#newButton', '#smartNav button', '.section-label-actions', '#folderNav', '.sidebar-control-dock'].map(selector => document.querySelector(selector)?.getBoundingClientRect()).filter(Boolean);
        return document.body.classList.contains('sidebar-collapsed') && aligned.every(rect => Math.abs(rect.left + rect.width / 2 - axis) < 1);
      });
      const collapsedSidebarRect = document.querySelector('#primarySidebar').getBoundingClientRect();
      const collapsedSidebarAxis = collapsedSidebarRect.left + collapsedSidebarRect.width / 2;
      const collapsedSidebarOffsets = Object.fromEntries(['#newButton', '#smartNav button', '.section-label-actions', '#folderNav', '.sidebar-control-dock'].map(selector => {
        const rect = document.querySelector(selector).getBoundingClientRect();
        return [selector, Number((rect.left + rect.width / 2 - collapsedSidebarAxis).toFixed(2))];
      }));
      const collapsedBrandStyle = getComputedStyle(document.querySelector('.brand-mini-logo'));
      const collapsedBrandCentered = parseFloat(collapsedBrandStyle.left) + parseFloat(collapsedBrandStyle.width) / 2 === 36;
      const collapsedBrandVersionStyle = getComputedStyle(brandVersion);
      const collapsedBrandVersionHidden = collapsedBrandVersionStyle.visibility === 'hidden';
      const sidebarToggleButton = document.querySelector('#sidebarToggle');
      sidebarToggleButton.style.transition = 'none';
      void sidebarToggleButton.offsetWidth;
      const collapsedToggleStyle = getComputedStyle(sidebarToggleButton);
      const collapsedToggleRect = sidebarToggleButton.getBoundingClientRect();
      const collapsedToggleInDock = sidebarToggleButton.closest('.sidebar-dock-actions')?.parentElement?.classList.contains('sidebar-control-dock')
        && collapsedToggleStyle.position === 'static'
        && Math.abs(collapsedToggleRect.left + collapsedToggleRect.width / 2 - collapsedSidebarAxis) < 1;
      sidebarToggleButton.style.removeProperty('transition');
      const miniLogoAfterCollapseRect = document.querySelector('.brand-mini-logo').getBoundingClientRect();
      const miniLogoCenterAfterCollapse = miniLogoAfterCollapseRect.left + miniLogoAfterCollapseRect.width / 2;
      const collapsedBrandAnchorStable = Math.abs(miniLogoCenterBeforeCollapse - miniLogoCenterAfterCollapse) < .5;
      const miniLogoPulseCenterBefore = [miniLogoAfterCollapseRect.left + miniLogoAfterCollapseRect.width / 2, miniLogoAfterCollapseRect.top + miniLogoAfterCollapseRect.height / 2];
      document.querySelector('.brand').click();
      await waitFor(() => document.querySelector('.brand').classList.contains('logo-pulse'));
      const miniLogoPulseStyle = getComputedStyle(document.querySelector('.brand-mini-logo'));
      const miniLogoPulseRect = document.querySelector('.brand-mini-logo').getBoundingClientRect();
      const miniLogoPulseCenterAfter = [miniLogoPulseRect.left + miniLogoPulseRect.width / 2, miniLogoPulseRect.top + miniLogoPulseRect.height / 2];
      const collapsedMiniLogoPulseAnchored = miniLogoPulseStyle.animationName === 'miniLogoBounce' && miniLogoPulseCenterBefore.every((value, index) => Math.abs(value - miniLogoPulseCenterAfter[index]) < .5);
      document.querySelector('.brand').classList.remove('logo-pulse');
      const collapsedSmartIconsCentered = await waitFor(() => [...document.querySelectorAll('#smartNav button')].every(button => {
        const buttonRect = button.getBoundingClientRect();
        const iconRect = button.querySelector('svg').getBoundingClientRect();
        return Math.abs(buttonRect.left + buttonRect.width / 2 - iconRect.left - iconRect.width / 2) < .6;
      }));
      const collapsedSmartIconOffsets = [...document.querySelectorAll('#smartNav button')].map(button => {
        const buttonRect = button.getBoundingClientRect();
        const iconRect = button.querySelector('svg').getBoundingClientRect();
        return Number((iconRect.left + iconRect.width / 2 - buttonRect.left - buttonRect.width / 2).toFixed(2));
      });
      const collapsedFolderBadges = [...document.querySelectorAll('#folderNav .folder-dot')];
      const collapsedFolderBadgesVisible = await waitFor(() => collapsedFolderBadges.length === library.folders.length && collapsedFolderBadges.every(badge => badge.getBoundingClientRect().width >= 29 && badge.querySelector('.folder-short-name')?.textContent.trim()));
      const customCollapsedFolderNode = document.querySelector('#folderNav [data-view="folder:' + managedFolderId + '"] .folder-short-name');
      const customCollapsedFolderLabel = customCollapsedFolderNode?.textContent === '👩‍💻' && customCollapsedFolderNode.classList.contains('is-emoji');
      const collapsedFolderLabelIsLarger = parseFloat(getComputedStyle(customCollapsedFolderNode).fontSize) >= 16 && [...document.querySelectorAll('#folderNav .folder-short-name:not(.is-emoji)')].every(node => parseFloat(getComputedStyle(node).fontSize) >= 9);
      const combinedFolderActionVisible = getComputedStyle(document.querySelector('#folderActionsMenu')).display !== 'none' && getComputedStyle(document.querySelector('#addFolder')).display === 'none' && getComputedStyle(document.querySelector('#manageFolders')).display === 'none';
      document.querySelector('#folderActionsMenu').click();
      const collapsedFolderMenuWorks = document.querySelector('#folderActionMenu').classList.contains('open') && document.querySelectorAll('#folderActionMenu [data-folder-menu-action]').length === 2;
      document.querySelector('#folderActionsMenu').click();
      document.querySelector('#sidebarToggle').click();
      await waitFor(() => {
        const sidebarRect = document.querySelector('#primarySidebar').getBoundingClientRect();
        const stateRect = document.querySelector('#saveState').getBoundingClientRect();
        return sidebarRect.width > 200 && Math.abs(stateRect.left - sidebarRect.right - 8) < 1;
      });
      const expandedSidebarRect = document.querySelector('#primarySidebar').getBoundingClientRect();
      const saveStateRect = document.querySelector('#saveState').getBoundingClientRect();
      const saveStateStyle = getComputedStyle(document.querySelector('#saveState'));
      const saveStateRelocated = Math.abs(saveStateRect.left - expandedSidebarRect.right - 8) <= 1 && saveStateStyle.textAlign === 'left';
      const saveStateMetrics = { saveLeft:saveStateRect.left, sidebarRight:expandedSidebarRect.right, difference:saveStateRect.left - expandedSidebarRect.right, textAlign:saveStateStyle.textAlign };
      const lowerLeftControlsTogether = ['#dataRefreshButton', '#settingsButton', '#sidebarToggle'].every(selector => document.querySelector(selector)?.closest('.sidebar-control-dock'));
      window.__actaSmokeStep = 'sidebar-checked';
      document.querySelector('#settingsButton').click();
      const cacheReloadAvailable = Boolean(document.querySelector('#clearCacheReload'));
      const settingsNavigation = [...document.querySelectorAll('.settings-nav [data-settings-page]')];
      const workspaceSettingsIndex = settingsNavigation.findIndex(button => button.dataset.settingsPage === 'workspace');
      const syncSettingsIndex = settingsNavigation.findIndex(button => button.dataset.settingsPage === 'cloud');
      const dataSyncOrderZh = syncSettingsIndex === workspaceSettingsIndex + 1 && settingsNavigation[syncSettingsIndex]?.textContent.trim() === '数据同步';
      document.querySelector('[data-settings-page="note-editor"]').click();
      const noteEditorSettingsComplete = ['#noteHeadingH1Size', '#noteHeadingH2Size', '#noteHeadingH3Size', '#noteHeadingStyle', '#noteToolbarPosition', '#noteToolbarShowLabels']
        .every(selector => Boolean(document.querySelector(selector)));
      const updateNoteSetting = (selector, value, eventType = 'change') => {
        const field = document.querySelector(selector);
        if (field.type === 'checkbox') field.checked = Boolean(value);
        else field.value = String(value);
        field.dispatchEvent(new Event(eventType));
      };
      updateNoteSetting('#noteHeadingH1Size', 36);
      updateNoteSetting('#noteHeadingH2Size', 26);
      updateNoteSetting('#noteHeadingH3Size', 20);
      updateNoteSetting('#noteHeadingStyle', 'accent');
      updateNoteSetting('#noteToolbarPosition', 'top');
      updateNoteSetting('#noteToolbarShowLabels', true);
      const storedNoteEditorSettings = readAppearanceSettings();
      const noteEditorSettingsPersist = storedNoteEditorSettings.noteHeadingH1Size === 36
        && storedNoteEditorSettings.noteHeadingH2Size === 26
        && storedNoteEditorSettings.noteHeadingH3Size === 20
        && storedNoteEditorSettings.noteHeadingStyle === 'accent'
        && storedNoteEditorSettings.noteToolbarPosition === 'top'
        && storedNoteEditorSettings.noteToolbarShowLabels === true;
      const noteHeadingSettingsApplied = document.documentElement.style.getPropertyValue('--note-heading-h1-size') === '36px'
        && document.documentElement.style.getPropertyValue('--note-heading-h2-size') === '26px'
        && document.documentElement.style.getPropertyValue('--note-heading-h3-size') === '20px'
        && document.documentElement.dataset.noteHeadingStyle === 'accent'
        && parseFloat(getComputedStyle(document.querySelector('#noteHeadingPreview h1')).borderLeftWidth) > 0;
      selectedId = 'welcome-note';
      renderEditor();
      const configuredToolbar = document.querySelector('.note-toolbar');
      const configuredNoteBody = document.querySelector('#noteBody');
      const noteToolbarSettingsApplied = Boolean(configuredToolbar.compareDocumentPosition(configuredNoteBody) & Node.DOCUMENT_POSITION_FOLLOWING)
        && getComputedStyle(configuredToolbar).top !== 'auto'
        && getComputedStyle(configuredToolbar.querySelector('.note-tool-label')).display !== 'none';
      window.resizeTo(600, 700);
      await waitFor(() => innerWidth <= 600 && innerHeight <= 700);
      const noteSettingsPanel = document.querySelector('[data-settings-panel="note-editor"]');
      const noteEditorSettingsMobileFits = noteSettingsPanel.scrollWidth <= document.querySelector('.settings-content').clientWidth + 1;
      const labeledToolbarWraps = configuredToolbar.scrollWidth <= configuredToolbar.clientWidth + 1
        && configuredToolbar.scrollHeight > 80;
      window.resizeTo(1280, 800);
      await waitFor(() => innerWidth > 1200 && innerHeight > 700);
      document.querySelector('[data-settings-page="appearance"]').click();
      const appearancePanel = document.querySelector('[data-settings-panel="appearance"]');
      const appearanceSettingsComplete = document.querySelectorAll('input[name="actaTheme"]').length === 10
        && document.querySelectorAll('input[name="actaAppIcon"]').length === 5
        && [...document.querySelectorAll('.app-icon-option b')].slice(0, 4).map(node => node.textContent).join('|') === '默认书页|正·书页|勾勒·书页|初版简洁'
        && Object.keys(detailedColorInputs).every(id => document.querySelector('#' + id));
      const appearanceLayoutFits = appearancePanel.scrollWidth <= document.querySelector('.settings-content').clientWidth;
      document.querySelector('[data-settings-page="workspace"]').click();
      await waitFor(() => document.querySelectorAll('.data-profile-card').length > 0);
      const profileCountBefore = document.querySelectorAll('.data-profile-card').length;
      document.querySelector('#newDataProfile').click();
      document.querySelector('#newDataProfileName').value = 'Smoke blank data';
      document.querySelector('#confirmDataProfile').click();
      await waitFor(() => document.querySelector('.data-profile-card.active .data-profile-card-title b')?.textContent === 'Smoke blank data');
      window.__actaSmokeStep = 'profile-created';
      const blankProfileItems = library.items.length;
      const dataRefreshButton = document.querySelector('#dataRefreshButton');
      dataRefreshButton.click();
      const dataRefreshBusyFeedback = dataRefreshButton.disabled && dataRefreshButton.classList.contains('is-refreshing') && dataRefreshButton.getAttribute('aria-busy') === 'true';
      await waitFor(() => !dataRefreshButton.disabled && dataRefreshButton.dataset.refreshSource === 'profile');
      const localDataRefreshWorks = dataRefreshButton.dataset.refreshSource === 'profile' && library.items.length === 0 && document.querySelector('#saveState').textContent.includes('刷新');
      const activeProfile = document.querySelector('.data-profile-card.active');
      activeProfile.querySelector('[data-profile-action="edit"]').click();
      document.querySelector('.data-profile-card.active [data-profile-action="copy"]').click();
      await waitFor(() => document.querySelectorAll('.data-profile-card').length === profileCountBefore + 2);
      const profileCountAfterCopy = document.querySelectorAll('.data-profile-card').length;
      const deleteProfileAction = document.querySelector('.data-profile-card.active [data-profile-action="delete"]');
      const deleteProfileEnabled = Boolean(deleteProfileAction && !deleteProfileAction.disabled);
      document.querySelector('[data-settings-page="cloud"]').click();
      const dataSyncHeadingZh = document.querySelector('[data-settings-panel="cloud"] h3').textContent === '数据同步';
      const localFolderModeZh = document.querySelector('#cloudSyncMode option[value="onedrive"]').textContent;
      const localFolderNoteZh = document.querySelector('#oneDriveModeFields .cloud-mode-note').textContent;
      const englishLanguage = document.querySelector('input[name="actaLanguage"][value="en"]');
      englishLanguage.checked = true;
      englishLanguage.dispatchEvent(new Event('change'));
      await waitFor(() => document.querySelector('#cloudSyncMode option[value="onedrive"]').textContent === 'Local folder');
      const localFolderModeEn = document.querySelector('#cloudSyncMode option[value="onedrive"]').textContent;
      const dataSyncLabelEn = document.querySelector('[data-settings-page="cloud"] span').textContent === 'Data sync' && document.querySelector('[data-settings-panel="cloud"] h3').textContent === 'Data sync';
      const noteEditorLabelEn = document.querySelector('[data-settings-page="note-editor"] span').textContent === 'Note editor'
        && document.querySelector('[data-settings-panel="note-editor"] h3').textContent === 'Note editor';
      const calendarDefaultOptionEn = document.querySelector('#defaultViewSetting option[value="calendar"]')?.textContent === 'Calendar';
      document.querySelector('#settingsClose').click();
      const settingsCloseAnimation = document.querySelector('#settingsModal').classList.contains('is-closing') && getComputedStyle(document.querySelector('.settings-window')).animationName === 'actaWindowClose';
      await waitFor(() => !document.querySelector('#settingsModal').classList.contains('open'));
      window.__actaSmokeStep = 'returning';
      return {
        developerSettingsRemoved,
        todoOrder,
        todosOnly,
        notesOnly,
        todoFilterControlsVisible,
        noteFilterControlsVisible,
        todoPriorityFilterWorks,
        todoDeadlineFilterWorks,
        todoFolderFilterWorks,
        todoFiltersClear,
        noteFolderFilterWorks,
        noteUpdatedFilterWorks,
        noteRelationFilterWorks,
        noteFiltersClear,
        inboxTodoFilterControlsVisible,
        inboxTodoFilterWorks,
        inboxNoteFilterControlsVisible,
        inboxNoteFilterWorks,
        completedHiddenFromTodos,
        completedVisible,
        darkCreateMenuBackground,
        darkThemeColor,
        detailedThemeColorsWork,
        colorfulThemesAvailable,
        colorfulThemeWorks,
        glowThemesAvailable,
        glowThemeWorks,
        fontScalingUnified,
        fontSizeRangeIsReasonable,
        fontSizeLayoutFits,
        fontSizeLayoutMetrics,
        mobileFontSizeLayoutFits,
        mobileFontSizeLayoutMetrics,
        presetAppIconWorks,
        nativeCustomPromptUI,
        customAppIconWorks,
        customAppIconMetrics,
        appIconResetWorks,
        nativeStatusBarMatchesThemes,
        nativeStatusBarCalls,
        reciprocalLink,
        reciprocalTodoLink,
        todoClassificationSelectOnly,
        todoCanSelectUnclassified,
        todoMetaCloseAnimation,
        todoCreatedAtImmutable,
        todoTimeDetailsVisible,
        todoDurationRemoved,
        todoScheduleEditable,
        todoScheduleCancellationWarns,
        scheduledTodoListShowsTimeRange,
        unscheduledTodoListShowsCreatedTime,
        calendarReplacesToday,
        calendarTimetableRemoved,
        calendarMonthVisible,
        calendarCreatedNoteVisible,
        calendarCrossDayGrouped,
        calendarCrossDayPeriodOverlap,
        calendarCrossDayMonthVisible,
        calendarGreenTheme,
        calendarExpanded,
        calendarExpansionMetrics,
        calendarTodoVisible,
        calendarMonthTitleOnly,
        calendarMonthHasNoToggle,
        calendarMonthOverflowIcon,
        calendarMonthWeekNumbers,
        calendarMonthShiftLabels,
        calendarRelationVisible,
        calendarLinkNavigation,
        calendarYearVisible,
        calendarYearShiftLabels,
        calendarNonlinearMotion,
        calendarWeekVisible,
        calendarWeekScrollable,
        calendarWeekScrollMetrics,
        calendarWeekShiftLabels,
        calendarWeekSubtaskComplete,
        calendarWeekSubtaskUndo,
        calendarDayVisible,
        calendarDayShiftLabels,
        calendarDaySubtaskComplete,
        calendarDaySubtaskUndo,
        calendarQuickComplete,
        calendarQuickUndo,
        calendarMobileWeekFits,
        calendarMobileWeekHint,
        calendarMobileWeekVerticalLocked,
        calendarMobileWeekScrollable,
        calendarMobileWeekRestored,
        calendarMobileWeekWholeCardSwipe,
        calendarMobileWeekSwipeMetrics,
        calendarMobileMonthFits,
        calendarMobileMonthIconsOnly,
        calendarMobileMonthIconsHorizontal,
        calendarMobileYearDrillsToMonth,
        calendarMobileMonthDrillsToWeek,
        calendarMobileWeekShowsSelectedDay,
        calendarMobileWeekDrillsToDay,
        calendarDesktopClickLogicUnchanged,
        calendarPeriodShifted,
        calendarReturnedToday,
        calendarDefaultOption,
        calendarExitTodoTitleSynced,
        calendarExitTodoTitleCompact,
        calendarExitTodoTitleMetrics,
        calendarExitNoteTitleSynced,
        calendarExitNoteTitleCompact,
        calendarExitNoteTitleMetrics,
        relationWindowAnimation,
        relationBackdropAnimation,
        relationCloseAnimation,
        noteClassificationSelectOnly,
        noteMetaCloseAnimation,
        imeEnterIgnored,
        hasPriorityBadge,
        hasExportAction,
        exportBeforeImmersive,
        noteCreationTimeVisible,
        normalEditTimeIncludesSeconds,
        exportDialogAnimation,
        exportFormatsComplete,
        pdfOptionsComplete,
        pdfGenerationWorks,
        imageOptionsComplete,
        exportDialogCloseAnimation,
        markdownToolbarActions,
        immersiveNamingCorrect,
        visualSelectedFormatWorks,
        visualSelectedFormatToggles,
        visualCollapsedFormatIgnored,
        immersiveStartsVisual,
        immersiveEditTimeIncludesSeconds,
        immersiveTopbarToolbarSeamless,
        immersiveLightThemeCorrect,
        immersiveLightColors,
        immersiveDarkThemeCorrect,
        immersiveDarkColors,
        immersivePcArticleWider,
        immersiveContentWidth,
        immersiveEnterAnimation,
        markdownSourceVisible,
        markdownCollapsedFormatIgnored,
        markdownSelectedFormatWorks,
        markdownSelectedFormatToggles,
        immersiveToolbarWraps,
        immersiveMobileFits,
        immersiveMobileMetrics,
        mobileBottomToolbarAvoidsNav,
        mobileBottomBarFollowsTheme,
        immersiveSwitchesToVisual,
        markdownSourceApplied,
        immersiveExitAnimation,
        immersiveExitIsFast,
        immersiveEscapeExits,
        markdownRoundtripFlags,
        quickMenuHasLightning,
        quickMenuAccent,
        quickGuideAvailable,
        quickCaptureDesktopFits,
        quickScheduleDefaults,
        quickNoteCreated,
        quickTodoIsDefault,
        quickTodoDefaultsUnclassified,
        quickCaptureClearWarns,
        quickTodoCreated,
        standardTodoDefaultsUnclassified,
        quickCapturePreservedContext,
        roundtripTitle: imported.title,
        roundtripText: stripHTML(imported.body),
        unsafeBody: unsafe.body,
        colorFlags,
        classificationActionsTogether,
        classificationWindowAnimation,
        classificationCompactLayoutFits,
        classificationCompactCanScroll,
        classificationMobileLayoutFits,
        classificationMobileMetrics,
        classificationMobileCanScroll,
        classificationMobileControlsOptimized,
        classificationDesktopContentVisible,
        classificationDesktopMetrics,
        classificationCloseAnimation,
        classificationFolderCountMatches,
        classificationContentCount,
        classificationEmojiPickerOpens,
        classificationEmojiPickerSelects,
        classificationColorUpdated,
        classificationShortNameUpdated,
        customShortTextLimited,
        classificationDialogStayedOpen,
        classificationTodoListPopulated,
        classificationItemOpened,
        mobileTitlebarButtonsVisible,
        mobileClassificationRelocated,
        mobileClassificationTransition,
        mobileClassificationListComplete,
        mobileClassificationEditButtonsComplete,
        mobileClassificationEditOpensTarget,
        mobileClassificationIconsUpright,
        nativeDialogPositionFixed,
        mobileActaDataOpensSettings,
        expandedBrandVersionVisible,
        collapsedSidebarAligned,
        collapsedSidebarOffsets,
        collapsedBrandCentered,
        collapsedBrandVersionHidden,
        collapsedToggleInDock,
        collapsedTogglePosition: { position:collapsedToggleStyle.position, left:collapsedToggleStyle.left, translate:collapsedToggleStyle.translate },
        collapsedBrandAnchorStable,
        miniLogoCenters: [miniLogoCenterBeforeCollapse, miniLogoCenterAfterCollapse],
        collapsedMiniLogoPulseAnchored,
        miniLogoPulseCenters: [miniLogoPulseCenterBefore, miniLogoPulseCenterAfter],
        collapsedSmartIconsCentered,
        collapsedSmartIconOffsets,
        collapsedFolderBadgesVisible,
        customCollapsedFolderLabel,
        collapsedFolderLabelIsLarger,
        combinedFolderActionVisible,
        collapsedFolderMenuWorks,
        saveStateRelocated,
        saveStateMetrics,
        lowerLeftControlsTogether,
        settingsCloseAnimation,
        defaultLibraryItems,
        cacheReloadAvailable,
        blankProfileItems,
        dataRefreshBusyFeedback,
        localDataRefreshWorks,
        profileCountBefore,
        profileCountAfterCopy,
        deleteProfileEnabled,
        dataSyncOrderZh,
        noteEditorSettingsComplete,
        noteEditorSettingsPersist,
        noteHeadingSettingsApplied,
        noteToolbarSettingsApplied,
        noteEditorSettingsMobileFits,
        labeledToolbarWraps,
        appearanceSettingsComplete,
        appearanceLayoutFits,
        dataSyncHeadingZh,
        localFolderModeZh,
        localFolderNoteZh,
        localFolderModeEn,
        dataSyncLabelEn,
        noteEditorLabelEn,
        calendarDefaultOptionEn
      };
    })()`).catch(async error => {
      const step = await page.evaluate('window.__actaSmokeStep || "unknown"').catch(() => 'unavailable');
      throw new Error(`${error.stack || error.message} at smoke step: ${step}`);
    });
    let smokeWatchdog;
    const smokeTimeout = new Promise((_, reject) => {
      smokeWatchdog = setTimeout(async () => {
        const step = await page.evaluate('window.__actaSmokeStep || "unknown"').catch(() => 'unavailable');
        reject(new Error(`Acta smoke test timed out at: ${step}`));
      }, 25000);
    });
    const result = await Promise.race([smokeRun, smokeTimeout]).finally(() => clearTimeout(smokeWatchdog));
    const unscaledFontDeclarations = ['src/styles.css', 'src/interface.css'].flatMap(relativePath => {
      const source = fs.readFileSync(path.join(__dirname, '..', relativePath), 'utf8');
      return source.split(/\r?\n/).filter(line => /font(?:-size)?\s*:[^;{}]*\b\d+(?:\.\d+)?px\b/.test(line)
        && !line.includes('var(--acta-font-scale'));
    });
    const nativeWebAssets = ['renderer.js', 'interface.js', 'interface.css', 'index.html', 'service-worker.js', 'tauri-bridge.js'];
    nativeWebAssets.forEach(fileName => {
      const webSource = fs.readFileSync(path.join(__dirname, '..', 'src', fileName));
      const nativeSource = fs.readFileSync(path.join(__dirname, '..', 'android', 'app', 'src', 'main', 'assets', 'public', fileName));
      assert.deepEqual(nativeSource, webSource, `Android web asset is stale: ${fileName}`);
    });
    const androidManifest = fs.readFileSync(path.join(__dirname, '..', 'android', 'app', 'src', 'main', 'AndroidManifest.xml'), 'utf8');
    const androidIconPlugin = fs.readFileSync(path.join(__dirname, '..', 'android', 'app', 'src', 'main', 'java', 'com', 'acta', 'xingji', 'ActaSyncPlugin.java'), 'utf8');
    [
      ['default', 'LauncherDefault'],
      ['positive', 'LauncherPositive'],
      ['outline', 'LauncherOutline'],
      ['original', 'LauncherOriginal']
    ].forEach(([preset, alias]) => {
      assert.match(androidManifest, new RegExp(`android:name="\\.${alias}"`));
      assert.match(androidIconPlugin, new RegExp(`case "${preset}": return "${alias}"`));
    });
    const appIconInterfaceSource = fs.readFileSync(path.join(__dirname, '..', 'src', 'interface.js'), 'utf8');
    assert.doesNotMatch(appIconInterfaceSource, /appIconPreset === 'custom'\s*\?\s*'default'/);
    assert.match(appIconInterfaceSource, /自定义图标仅支持 PC 本地客户端/);
    assert.match(appIconInterfaceSource, /const webOnly = !desktopIcon && !mobileIcon/);

    assert.deepEqual(unscaledFontDeclarations, []);
    assert.equal(result.developerSettingsRemoved, true);
    assert.deepEqual(result.todoOrder.slice(0, 2), ['launch-plan', 'weekend-list']);
    assert.equal(result.todosOnly, true);
    assert.equal(result.notesOnly, true);
    assert.equal(result.todoFilterControlsVisible, true);
    assert.equal(result.noteFilterControlsVisible, true);
    assert.equal(result.todoPriorityFilterWorks, true);
    assert.equal(result.todoDeadlineFilterWorks, true);
    assert.equal(result.todoFolderFilterWorks, true);
    assert.equal(result.todoFiltersClear, true);
    assert.equal(result.noteFolderFilterWorks, true);
    assert.equal(result.noteUpdatedFilterWorks, true);
    assert.equal(result.noteRelationFilterWorks, true);
    assert.equal(result.noteFiltersClear, true);
    assert.equal(result.inboxTodoFilterControlsVisible, true);
    assert.equal(result.inboxTodoFilterWorks, true);
    assert.equal(result.inboxNoteFilterControlsVisible, true);
    assert.equal(result.inboxNoteFilterWorks, true);
    assert.equal(result.completedHiddenFromTodos, true);
    assert.equal(result.completedVisible, true);
    assert.match(result.darkCreateMenuBackground, /^rgb\(/);
    assert.equal(result.darkThemeColor, '#111310');
    assert.equal(result.detailedThemeColorsWork, true);
    assert.equal(result.colorfulThemesAvailable, true);
    assert.equal(result.colorfulThemeWorks, true);
    assert.equal(result.glowThemesAvailable, true);
    assert.equal(result.glowThemeWorks, true);
    assert.equal(result.fontScalingUnified, true);
    assert.equal(result.fontSizeRangeIsReasonable, true);
    assert.equal(result.fontSizeLayoutFits, true, JSON.stringify(result.fontSizeLayoutMetrics));
    assert.equal(result.mobileFontSizeLayoutFits, true, JSON.stringify(result.mobileFontSizeLayoutMetrics));
    assert.equal(result.presetAppIconWorks, true);
    assert.equal(result.nativeCustomPromptUI, true);
    assert.equal(result.customAppIconWorks, true, JSON.stringify(result.customAppIconMetrics));
    assert.equal(result.appIconResetWorks, true);
    assert.equal(result.nativeStatusBarMatchesThemes, true, JSON.stringify(result.nativeStatusBarCalls));
    assert.equal(result.reciprocalLink, true);
    assert.equal(result.reciprocalTodoLink, true);
    assert.equal(result.todoClassificationSelectOnly, true);
    assert.equal(result.todoCanSelectUnclassified, true);
    assert.equal(result.todoMetaCloseAnimation, true);
    assert.equal(result.todoCreatedAtImmutable, true);
    assert.equal(result.todoTimeDetailsVisible, true);
    assert.equal(result.todoDurationRemoved, true);
    assert.equal(result.todoScheduleEditable, true);
    assert.equal(result.todoScheduleCancellationWarns, true);
    assert.equal(result.scheduledTodoListShowsTimeRange, true);
    assert.equal(result.unscheduledTodoListShowsCreatedTime, true);
    assert.equal(result.calendarReplacesToday, true);
    assert.equal(result.calendarTimetableRemoved, true);
    assert.equal(result.calendarMonthVisible, true);
    assert.equal(result.calendarCreatedNoteVisible, true);
    assert.equal(result.calendarCrossDayGrouped, true);
    assert.equal(result.calendarCrossDayPeriodOverlap, true);
    assert.equal(result.calendarCrossDayMonthVisible, true);
    assert.equal(result.calendarGreenTheme, true);
    assert.equal(result.calendarExpanded, true, JSON.stringify(result.calendarExpansionMetrics));
    assert.equal(result.calendarTodoVisible, true);
    assert.equal(result.calendarMonthTitleOnly, true);
    assert.equal(result.calendarMonthHasNoToggle, true);
    assert.equal(result.calendarMonthOverflowIcon, true);
    assert.equal(result.calendarMonthWeekNumbers, true);
    assert.equal(result.calendarMonthShiftLabels, true);
    assert.equal(result.calendarRelationVisible, true);
    assert.equal(result.calendarLinkNavigation, true);
    assert.equal(result.calendarYearVisible, true);
    assert.equal(result.calendarYearShiftLabels, true);
    assert.equal(result.calendarNonlinearMotion, true);
    assert.equal(result.calendarWeekVisible, true);
    assert.equal(result.calendarWeekScrollable, true, JSON.stringify(result.calendarWeekScrollMetrics));
    assert.equal(result.calendarWeekShiftLabels, true);
    assert.equal(result.calendarWeekSubtaskComplete, true);
    assert.equal(result.calendarWeekSubtaskUndo, true);
    assert.equal(result.calendarDayVisible, true);
    assert.equal(result.calendarDayShiftLabels, true);
    assert.equal(result.calendarDaySubtaskComplete, true);
    assert.equal(result.calendarDaySubtaskUndo, true);
    assert.equal(result.calendarQuickComplete, true);
    assert.equal(result.calendarQuickUndo, true);
    assert.equal(result.calendarMobileWeekFits, true);
    assert.equal(result.calendarMobileWeekHint, true);
    assert.equal(result.calendarMobileWeekVerticalLocked, true);
    assert.equal(result.calendarMobileWeekScrollable, true);
    assert.equal(result.calendarMobileWeekRestored, true);
    assert.equal(result.calendarMobileWeekWholeCardSwipe, true, JSON.stringify(result.calendarMobileWeekSwipeMetrics));
    assert.equal(result.calendarMobileMonthFits, true);
    assert.equal(result.calendarMobileMonthIconsOnly, true);
    assert.equal(result.calendarMobileMonthIconsHorizontal, true);
    assert.equal(result.calendarMobileYearDrillsToMonth, true);
    assert.equal(result.calendarMobileMonthDrillsToWeek, true);
    assert.equal(result.calendarMobileWeekShowsSelectedDay, true);
    assert.equal(result.calendarMobileWeekDrillsToDay, true);
    assert.equal(result.calendarDesktopClickLogicUnchanged, true);
    assert.equal(result.calendarPeriodShifted, true);
    assert.equal(result.calendarReturnedToday, true);
    assert.equal(result.calendarDefaultOption, true);
    assert.equal(result.calendarExitTodoTitleSynced, true);
    assert.equal(result.calendarExitTodoTitleCompact, true, JSON.stringify(result.calendarExitTodoTitleMetrics));
    assert.equal(result.calendarExitNoteTitleSynced, true);
    assert.equal(result.calendarExitNoteTitleCompact, true, JSON.stringify(result.calendarExitNoteTitleMetrics));
    assert.equal(result.relationWindowAnimation, true);
    assert.equal(result.relationBackdropAnimation, true);
    assert.equal(result.relationCloseAnimation, true);
    assert.equal(result.noteClassificationSelectOnly, true);
    assert.equal(result.noteMetaCloseAnimation, true);
    assert.equal(result.imeEnterIgnored, true);
    assert.equal(result.hasPriorityBadge, true);
    assert.equal(result.hasExportAction, true);
    assert.equal(result.exportBeforeImmersive, true);
    assert.equal(result.noteCreationTimeVisible, true);
    assert.equal(result.normalEditTimeIncludesSeconds, true);
    assert.equal(result.exportDialogAnimation, true);
    assert.equal(result.exportFormatsComplete, true);
    assert.equal(result.pdfOptionsComplete, true);
    assert.equal(result.pdfGenerationWorks, true);
    assert.equal(result.imageOptionsComplete, true);
    assert.equal(result.exportDialogCloseAnimation, true);
    assert.ok(result.markdownToolbarActions >= 16);
    assert.equal(result.immersiveNamingCorrect, true);
    assert.equal(result.visualSelectedFormatWorks, true);
    assert.equal(result.visualSelectedFormatToggles, true);
    assert.equal(result.visualCollapsedFormatIgnored, true);
    assert.equal(result.immersiveStartsVisual, true);
    assert.equal(result.immersiveEditTimeIncludesSeconds, true);
    assert.equal(result.immersiveTopbarToolbarSeamless, true);
    assert.equal(result.immersiveLightThemeCorrect, true, JSON.stringify(result.immersiveLightColors));
    assert.equal(result.immersiveDarkThemeCorrect, true, JSON.stringify(result.immersiveDarkColors));
    assert.equal(result.immersivePcArticleWider, true, String(result.immersiveContentWidth));
    assert.equal(result.immersiveEnterAnimation, true);
    assert.equal(result.markdownSourceVisible, true);
    assert.equal(result.markdownCollapsedFormatIgnored, true);
    assert.equal(result.markdownSelectedFormatWorks, true);
    assert.equal(result.markdownSelectedFormatToggles, true);
    assert.equal(result.immersiveToolbarWraps, true);
    assert.equal(result.immersiveMobileFits, true, JSON.stringify(result.immersiveMobileMetrics));
    assert.equal(result.mobileBottomToolbarAvoidsNav, true);
    assert.equal(result.mobileBottomBarFollowsTheme, true);
    assert.equal(result.immersiveSwitchesToVisual, true);
    assert.equal(result.markdownSourceApplied, true);
    assert.equal(result.immersiveExitAnimation, true);
    assert.equal(result.immersiveExitIsFast, true);
    assert.equal(result.immersiveEscapeExits, true);
    assert.deepEqual(result.markdownRoundtripFlags, { quote:true, strike:true, highlight:true, inlineCode:true, tasks:true, divider:true, codeBlock:true });
    assert.equal(result.quickMenuHasLightning, true);
    assert.match(result.quickMenuAccent, /^rgb\(/);
    assert.equal(result.quickGuideAvailable, true);
    assert.equal(result.quickCaptureDesktopFits, true);
    assert.equal(result.quickScheduleDefaults, true);
    assert.equal(result.quickNoteCreated, true);
    assert.equal(result.quickTodoIsDefault, true);
    assert.equal(result.quickTodoDefaultsUnclassified, true);
    assert.equal(result.quickCaptureClearWarns, true);
    assert.equal(result.quickTodoCreated, true);
    assert.equal(result.standardTodoDefaultsUnclassified, true);
    assert.equal(result.quickCapturePreservedContext, true);
    assert.equal(result.roundtripTitle, '欢迎来到 Acta');
    assert.match(result.roundtripText, /记录，然后行动/);
    assert.doesNotMatch(result.unsafeBody, /javascript:|<img/i);
    assert.equal(result.colorFlags, 3);
    assert.equal(result.classificationActionsTogether, true);
    assert.equal(result.classificationWindowAnimation, true);
    assert.equal(result.classificationCompactLayoutFits, true);
    assert.equal(result.classificationCompactCanScroll, true);
    assert.equal(result.classificationMobileLayoutFits, true, JSON.stringify(result.classificationMobileMetrics));
    assert.equal(result.classificationMobileCanScroll, true);
    assert.equal(result.classificationMobileControlsOptimized, true);
    assert.equal(result.classificationDesktopContentVisible, true, JSON.stringify(result.classificationDesktopMetrics));
    assert.equal(result.classificationCloseAnimation, true);
    assert.equal(result.classificationFolderCountMatches, true);
    assert.ok(result.classificationContentCount > 0);
    assert.equal(result.classificationEmojiPickerOpens, true);
    assert.equal(result.classificationEmojiPickerSelects, true);
    assert.equal(result.classificationColorUpdated, true);
    assert.equal(result.classificationShortNameUpdated, true);
    assert.equal(result.customShortTextLimited, true);
    assert.equal(result.classificationDialogStayedOpen, true);
    assert.equal(result.classificationTodoListPopulated, true);
    assert.equal(result.classificationItemOpened, true);
    assert.equal(result.mobileTitlebarButtonsVisible, true);
    assert.equal(result.mobileClassificationRelocated, true);
    assert.equal(result.mobileClassificationTransition, true);
    assert.equal(result.mobileClassificationListComplete, true);
    assert.equal(result.mobileClassificationEditButtonsComplete, true);
    assert.equal(result.mobileClassificationEditOpensTarget, true);
    assert.equal(result.mobileClassificationIconsUpright, true);
    assert.equal(result.nativeDialogPositionFixed, true);
    assert.equal(result.mobileActaDataOpensSettings, true);
    assert.equal(result.expandedBrandVersionVisible, true);
    assert.equal(result.collapsedSidebarAligned, true, JSON.stringify(result.collapsedSidebarOffsets));
    assert.equal(result.collapsedBrandCentered, true);
    assert.equal(result.collapsedBrandVersionHidden, true);
    assert.equal(result.collapsedToggleInDock, true, JSON.stringify(result.collapsedTogglePosition));
    assert.equal(result.collapsedBrandAnchorStable, true, JSON.stringify(result.miniLogoCenters));
    assert.equal(result.collapsedMiniLogoPulseAnchored, true, JSON.stringify(result.miniLogoPulseCenters));
    assert.equal(result.collapsedSmartIconsCentered, true, JSON.stringify(result.collapsedSmartIconOffsets));
    assert.equal(result.collapsedFolderBadgesVisible, true);
    assert.equal(result.customCollapsedFolderLabel, true);
    assert.equal(result.collapsedFolderLabelIsLarger, true);
    assert.equal(result.combinedFolderActionVisible, true);
    assert.equal(result.collapsedFolderMenuWorks, true);
    assert.equal(result.saveStateRelocated, true, JSON.stringify(result.saveStateMetrics));
    assert.equal(result.lowerLeftControlsTogether, true);
    assert.equal(result.settingsCloseAnimation, true);
    assert.equal(result.defaultLibraryItems, 0);
    assert.equal(result.cacheReloadAvailable, true);
    assert.equal(result.blankProfileItems, 0);
    assert.equal(result.dataRefreshBusyFeedback, true);
    assert.equal(result.localDataRefreshWorks, true);
    assert.equal(result.profileCountAfterCopy, result.profileCountBefore + 2);
    assert.equal(result.deleteProfileEnabled, true);
    assert.equal(result.dataSyncOrderZh, true);
    assert.equal(result.noteEditorSettingsComplete, true);
    assert.equal(result.noteEditorSettingsPersist, true);
    assert.equal(result.noteHeadingSettingsApplied, true);
    assert.equal(result.noteToolbarSettingsApplied, true);
    assert.equal(result.noteEditorSettingsMobileFits, true);
    assert.equal(result.labeledToolbarWraps, true);
    assert.equal(result.appearanceSettingsComplete, true);
    assert.equal(result.appearanceLayoutFits, true);
    assert.equal(result.dataSyncHeadingZh, true);
    assert.equal(result.localFolderModeZh, '本地文件夹');
    assert.match(result.localFolderNoteZh, /全平台/);
    assert.equal(result.localFolderModeEn, 'Local folder');
    assert.equal(result.dataSyncLabelEn, true);
    assert.equal(result.noteEditorLabelEn, true);
    assert.equal(result.calendarDefaultOptionEn, true);

    const tauriMainSource = fs.readFileSync(path.join(__dirname, '..', 'src-tauri', 'src', 'main.rs'), 'utf8');
    const tauriLibSource = fs.readFileSync(path.join(__dirname, '..', 'src-tauri', 'src', 'lib.rs'), 'utf8');
    assert.match(tauriMainSource, /windows_subsystem\s*=\s*"windows"/);
    assert.match(tauriLibSource, /const APP_ICON_FILE:\s*&str\s*=\s*"app-icon\.png"/);
    assert.match(tauriLibSource, /persist_app_icon\(&app,\s*&data_url,\s*&bytes\)/);
    assert.match(tauriLibSource, /\.setup\(\|app\|/);

    const bridgePage = await browser.newPage();
    await bridgePage.setViewport({ width:1280, height:800, deviceScaleFactor:1 });
    await bridgePage.evaluateOnNewDocument(() => {
      const calls = [];
      window.__tauriSmokeCalls = calls;
      const windowCommand = name => () => {
        calls.push({ type:'window', name });
        return Promise.resolve();
      };
      window.__TAURI__ = {
        core:{
          invoke(command, args) {
            calls.push({ type:'invoke', command, args });
            return Promise.resolve(command === 'import_note'
              ? { content:'# Tauri', fileName:'tauri.md', path:args.path }
              : true);
          }
        },
        dialog:{
          open(options) {
            calls.push({ type:'dialog-open', options });
            return Promise.resolve(options.directory ? 'C:\\Acta' : 'C:\\Acta\\tauri.md');
          },
          save(options) {
            calls.push({ type:'dialog-save', options });
            return Promise.resolve('C:\\Acta\\tauri.md');
          }
        },
        opener:{
          openUrl(url) {
            calls.push({ type:'open-url', url });
            return Promise.resolve();
          }
        },
        window:{
          getCurrentWindow() {
            return {
              minimize:windowCommand('minimize'),
              toggleMaximize:windowCommand('toggleMaximize'),
              close:windowCommand('close'),
              startDragging:windowCommand('startDragging')
            };
          }
        }
      };
    });
    await bridgePage.goto(pathToFileURL(path.join(__dirname, '..', 'src', 'index.html')).href, { waitUntil:'load' });
    const bridgeResult = await bridgePage.evaluate(async () => {
      const folder = await window.actaDesktop.chooseSyncFolder();
      await window.actaDesktop.uploadLibrary(folder, { version:1 });
      await window.actaDesktop.webDavRequest('https://example.com/dav', { method:'HEAD' });
      const imported = await window.actaDesktop.importNote();
      await window.actaDesktop.setAppIcon('data:image/png;base64,AA==');
      return {
        platform:window.actaDesktop.platform,
        folder,
        imported,
        desktopPlatform:document.documentElement.dataset.desktopPlatform,
        controlsDisplay:getComputedStyle(document.querySelector('.desktop-window-controls')).display,
        calls:window.__tauriSmokeCalls
      };
    });
    await bridgePage.close();
    assert.equal(bridgeResult.platform, 'win32');
    assert.equal(bridgeResult.desktopPlatform, 'win32');
    assert.equal(bridgeResult.folder, 'C:\\Acta');
    assert.equal(bridgeResult.imported.fileName, 'tauri.md');
    assert.equal(bridgeResult.controlsDisplay, 'flex');
    assert.ok(bridgeResult.calls.some(call => call.command === 'upload_library' && call.args.folder === 'C:\\Acta'));
    assert.ok(bridgeResult.calls.some(call => call.command === 'web_dav_request' && call.args.requestOptions.method === 'HEAD'));
    assert.ok(bridgeResult.calls.some(call => call.command === 'set_app_icon' && call.args.dataUrl.startsWith('data:image/png')));
    console.log('Acta smoke test passed: Tauri bridge, unclassified task defaults, select-only item classification, nonlinear property-panel closing, mobile calendar views, quick capture, data profiles, and Markdown round-trip.');
  } finally {
    if (browser) await browser.close();
    try { fs.rmSync(testData, { recursive:true, force:true }); }
    catch { /* A browser process can briefly retain files on Windows; the OS temp cleaner will remove them. */ }
  }
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
