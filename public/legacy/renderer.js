try {
  const storedActaSettings = JSON.parse(localStorage.getItem('acta.settings.v1') || 'null');
  if (storedActaSettings?.language === 'zh-Hant') {
    storedActaSettings.language = 'zh';
    localStorage.setItem('acta.settings.v1', JSON.stringify(storedActaSettings));
  }
} catch { /* Use the renderer defaults when stored settings are invalid. */ }

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

const STORAGE_KEY = 'acta.library.v1';
const SETTINGS_KEY = 'acta.settings.v1';

const dictionaries = {
  zh: {
    saved: '已保存', saving: '正在保存…', new: '新建', quickCapture: '速记', quickCaptureHint: '快速创建待办或笔记', newNote: '新建笔记', newNoteHint: '记录想法与灵感',
    newTodo: '新建待办', newTodoHint: '拆解目标与行动', inbox: '收集箱', today: '今天', todos: '待办', notes: '笔记', completed: '已完成',
    folders: '归类', classify: '归类', unclassified:'未归类', cloudSync: '数据同步', notConfigured: '尚未配置', localWorkspace: '行记数据', workspace: '行记数据', actaData: '行记数据',
    search: '搜索笔记和待办…', all: '全部', localFirst: '本地优先', syncTitle: '连接你的网盘',
    syncCopy: '选择设备本地、局域网或系统已挂载的网络文件夹。Acta 会在其中读写完整数据。',
    chooseFolder: '选择同步文件夹', noFolder: '尚未选择位置', download: '从网盘下载', upload: '上传到网盘', safeLocal: '数据默认只保存在你的设备上',
    item: '个项目', note: '笔记', todo: '待办', justNow: '刚刚', yesterday: '昨天', noItems: '这里还没有内容', noItemsHint: '新建一则笔记或待办，开始记录。',
    selectItem: '选择一项开始编辑', selectItemHint: '你的想法与行动会在这里展开。', untitledNote: '无标题笔记', untitledTodo: '新的待办',
    created: '创建于', updated: '更新于', dueDate: '截止日期', priority: '优先级', tags: '标签', high: '高', medium: '中', low: '低',
    progress: '任务进度', done: '已完成', addTask: '添加子任务', taskPlaceholder: '输入一个具体行动…', description: '补充说明',
    checkinTodo: '打卡待办', checkinTodoHint: '每天打卡，养成习惯', checkinToday: '今日打卡', checkinDone: '今日已打卡', checkinTodoYet: '今日未打卡',
    checkinStreak: '连续', checkinTotal: '累计', checkinDays: '天', checkinRecent: '最近 7 天', checkinUndo: '取消打卡', checkinMarkedToast: '打卡成功，继续保持',
    orderedTasks: '顺序执行', unorderedTasks: '无序子任务', taskOrderHint: '开启后子任务按顺序执行，可上下移动调整先后',
    taskMoveUp: '上移', taskMoveDown: '下移', taskDragHint: '拖动调整顺序',
    descriptionPlaceholder: '写下背景、上下文或任何需要记住的细节…', notePlaceholder: '从一个想法开始…', words: '字', chars: '字符',
    folderPrompt: '新归类的名称', folderDefault: '新归类', folderAdded: '归类已添加', itemCreated: '已创建', deleted: '已删除',
    deleteConfirm: '确定要删除这一项吗？', synced: '已同步', syncReady: '已连接', uploadDone: '已上传到网盘', downloadDone: '已从网盘恢复',
    chooseFirst: '请先选择同步文件夹', syncWorking: '正在同步…', invalidData: '同步失败', noDate: '无日期', commaTags: '用逗号分隔',
    format: '格式', heading: '标题', completeTask: '完成待办', reopenTask: '重新打开', modified: '最后编辑', archive: '归档',
    viewToday: '今天', viewTodos: '所有待办', viewNotes: '所有笔记', viewFolder: '归类', languageChanged: '已切换为中文',
    inboxFolder: '灵感收集', workFolder: '工作计划', lifeFolder: '生活清单', readingFolder: '阅读摘记',
    linkedItems: '关联项目', linkTodo: '关联待办', linkNote: '关联笔记', chooseTodo: '选择一个待办…', chooseNote: '选择一则笔记…',
    noLinks: '还没有关联项目', unlink: '取消关联', linked: '已建立双向关联', unlinked: '已取消关联',
    importNote: '导入笔记', importNoteHint: '支持 Markdown 与纯文本', exportNote: '导出这则笔记', noteImported: '笔记已导入', noteExported: '笔记已导出',
    importFailed: '导入失败', exportFailed: '导出失败', fileTooLarge: '文件不能超过 5 MB', invalidNoteFile: '无法读取这份笔记',
    calendar:'日历', yearView:'年', monthView:'月', weekView:'周', dayView:'日', previousPeriod:'上一时段', nextPeriod:'下一时段', previousYear:'上一年', nextYear:'下一年', previousMonth:'上一月', nextMonth:'下一月', previousWeek:'上一周', nextWeek:'下一周', previousDay:'上一日', nextDay:'下一日', backToToday:'今天', calendarNavigation:'日历导航', calendarViewOptions:'日历视图',
    noScheduledTodos:'这段时间没有待办', noScheduledTodosHint:'为待办设置截止日期后，它会显示在日历中。', scheduledTodos:'项待办',
    noCalendarItems:'这段时间没有日历内容', noCalendarItemsHint:'有排期的待办和当天创建的笔记会显示在这里。', calendarItems:'项日历内容', createdNotes:'当日创建笔记',
    moreTodos:'另有 {0} 项', linkedNotes:'关联笔记', calendarLegendLinked:'带笔记关联', calendarOpenTodo:'打开待办', calendarOpenNote:'打开笔记', calendarOpenDay:'查看当日', weekNumber:'周数', swipeWeekHint:'左右滑动查看其他日期',
    stats:'总结', showCompletedTodos:'显示已完成', statOpen:'进行中', confirm:'确定', cancel:'取消',
    statsEmpty:'这里还没有内容可以统计', statsEmptyHint:'创建笔记或待办后，这里会展示记录情况。',
    trash:'回收站', trashItems:'件回收',
    trashEmptyTitle:'回收站还是空的', trashEmptyHint:'删除的待办和笔记会先躺在这里，不会自动清空，随时回来翻翻，也许就有新的灵感。',
    trashFooterNote:'回收站不会自动倾倒', restore:'恢复', destroy:'彻底删除', restored:'已恢复到原位', destroyed:'已彻底删除',
    emptyTrash:'清空回收站', emptyTrashConfirmTitle:'清空回收站', emptyTrashConfirmMessage:'回收站中的 {0} 件内容将被彻底删除，无法恢复。', trashEmptied:'回收站已清空',
    deletedAt:'删除于', restoreHint:'恢复到原来的归类', trashOpenHint:'回收站中的内容不会出现在列表、日历与总结里',
    deleteTitle:'删除项目', deleteSubtitle:'选择如何处理「{0}」', deleteTrashLabel:'移入回收站', deleteTrashHint:'保留在回收站中，随时可以恢复', deleteDestroyLabel:'直接删除', deleteDestroyHint:'不进入回收站，立即彻底删除', moveToTrash:'移入回收站', deletedToTrash:'已移入回收站',
    statsListTitle:'待办笔记清单', statsListHint:'收集指定时间段创建的待办与笔记，勾选后可制作图片',
    statsRangeAll:'全部时间', statsRangeToday:'今天', statsRange7:'最近 7 天', statsRange30:'最近 30 天', statsRange90:'最近 90 天', statsRangeCustom:'自定义',
    statsCustomStart:'开始日期', statsCustomEnd:'截止日期', statsMakeImage:'生成图片', statsSelectedCount:'已选 {0} 件', statsSelectAll:'全选', statsClearSelection:'清除选择',
    statsNeedSelection:'请先勾选要生成图片的条目', statsImageDone:'清单图片已生成', statsImageFailed:'图片生成失败', statsEmptyRange:'这个时间段还没有内容',
    statsGroupToday:'今天', statsGroupYesterday:'昨天', statsCheckItem:'加入图片',
    metaQuickActions:'快捷操作', metaCopyTitle:'复制标题', metaCopyBody:'复制全文', metaCopyNotes:'复制说明', metaCopyMarkdown:'复制 Markdown', metaMarkComplete:'标记完成', metaReopen:'重新打开', metaViewCalendar:'在日历查看', metaTrash:'移入回收站',
    copied:'已复制到剪贴板', copyFailed:'复制失败'
  },
  en: {
    saved: 'Saved', saving: 'Saving…', new: 'New', quickCapture: 'Quick capture', quickCaptureHint: 'Create a task or note fast', newNote: 'New note', newNoteHint: 'Capture ideas and sparks',
    newTodo: 'New task', newTodoHint: 'Turn goals into action', inbox: 'Inbox', today: 'Today', todos: 'Tasks', notes: 'Notes', completed: 'Completed',
    folders: 'Classify', classify: 'Classify', unclassified:'Unclassified', cloudSync: 'Data sync', notConfigured: 'Not configured', localWorkspace: 'Acta Data', workspace: 'Acta Data', actaData: 'Acta Data',
    search: 'Search notes and tasks…', all: 'All', localFirst: 'Local first', syncTitle: 'Connect your cloud drive',
    syncCopy: 'Choose a device folder, LAN location, or mounted network folder. Acta reads and writes the complete data there.',
    chooseFolder: 'Choose sync folder', noFolder: 'No location selected', download: 'Download from cloud', upload: 'Upload to cloud', safeLocal: 'Your data stays on this device by default',
    item: 'items', note: 'Note', todo: 'Task', justNow: 'Just now', yesterday: 'Yesterday', noItems: 'Nothing here yet', noItemsHint: 'Create a note or task to get started.',
    selectItem: 'Select something to edit', selectItemHint: 'Your thoughts and actions will unfold here.', untitledNote: 'Untitled note', untitledTodo: 'New task',
    created: 'Created', updated: 'Updated', dueDate: 'Due date', priority: 'Priority', tags: 'Tags', high: 'High', medium: 'Medium', low: 'Low',
    progress: 'Task progress', done: 'complete', addTask: 'Add subtask', taskPlaceholder: 'Type a concrete action…', description: 'Notes',
    checkinTodo: 'Check-in task', checkinTodoHint: 'Check in daily to build a habit', checkinToday: "Today's check-in", checkinDone: 'Checked in today', checkinTodoYet: 'Not checked in yet',
    checkinStreak: 'streak', checkinTotal: 'total', checkinDays: 'days', checkinRecent: 'Last 7 days', checkinUndo: 'Undo check-in', checkinMarkedToast: 'Checked in — keep it going',
    orderedTasks: 'In order', unorderedTasks: 'Any order', taskOrderHint: 'Subtasks run in order; use the arrows to reorder',
    taskMoveUp: 'Move up', taskMoveDown: 'Move down', taskDragHint: 'Drag to reorder',
    descriptionPlaceholder: 'Add context, background, or anything worth remembering…', notePlaceholder: 'Start with an idea…', words: 'words', chars: 'characters',
    folderPrompt: 'Name your new classification', folderDefault: 'New classification', folderAdded: 'Classification added', itemCreated: 'Created', deleted: 'Deleted',
    deleteConfirm: 'Delete this item?', synced: 'Synced', syncReady: 'Connected', uploadDone: 'Uploaded to cloud', downloadDone: 'Restored from cloud',
    chooseFirst: 'Choose a sync folder first', syncWorking: 'Syncing…', invalidData: 'Sync failed', noDate: 'No date', commaTags: 'Separate with commas',
    format: 'Format', heading: 'Heading', completeTask: 'Complete task', reopenTask: 'Reopen task', modified: 'Last edited', archive: 'Archive',
    viewToday: 'Today', viewTodos: 'All tasks', viewNotes: 'All notes', viewFolder: 'Classification', languageChanged: 'Switched to English',
    inboxFolder: 'Idea inbox', workFolder: 'Work plans', lifeFolder: 'Life lists', readingFolder: 'Reading notes',
    linkedItems: 'Linked items', linkTodo: 'Link task', linkNote: 'Link note', chooseTodo: 'Choose a task…', chooseNote: 'Choose a note…',
    noLinks: 'No linked items yet', unlink: 'Unlink', linked: 'Linked in both directions', unlinked: 'Link removed',
    importNote: 'Import note', importNoteHint: 'Markdown and plain text', exportNote: 'Export this note', noteImported: 'Note imported', noteExported: 'Note exported',
    importFailed: 'Import failed', exportFailed: 'Export failed', fileTooLarge: 'Files must be under 5 MB', invalidNoteFile: 'This note could not be read',
    calendar:'Calendar', yearView:'Year', monthView:'Month', weekView:'Week', dayView:'Day', previousPeriod:'Previous period', nextPeriod:'Next period', previousYear:'Previous year', nextYear:'Next year', previousMonth:'Previous month', nextMonth:'Next month', previousWeek:'Previous week', nextWeek:'Next week', previousDay:'Previous day', nextDay:'Next day', backToToday:'Today', calendarNavigation:'Calendar navigation', calendarViewOptions:'Calendar views',
    noScheduledTodos:'No tasks in this period', noScheduledTodosHint:'Set a task deadline to place it on the calendar.', scheduledTodos:'tasks',
    noCalendarItems:'Nothing on this calendar yet', noCalendarItemsHint:'Scheduled tasks and notes created that day appear here.', calendarItems:'calendar items', createdNotes:'Notes created that day',
    moreTodos:'{0} more', linkedNotes:'Linked notes', calendarLegendLinked:'Linked to notes', calendarOpenTodo:'Open task', calendarOpenNote:'Open note', calendarOpenDay:'Open day', weekNumber:'Week', swipeWeekHint:'Swipe left or right for other days',
    stats:'Summary', showCompletedTodos:'Show completed', statOpen:'In progress', confirm:'Confirm', cancel:'Cancel',
    statsEmpty:'Nothing to report yet', statsEmptyHint:'Once you add notes or tasks, your activity shows up here.',
    trash:'Trash', trashItems:'items',
    trashEmptyTitle:'The trash is empty', trashEmptyHint:'Deleted notes and tasks rest here. Nothing is emptied automatically — come back and rummage whenever you like.',
    trashFooterNote:'Trash is never emptied automatically', restore:'Restore', destroy:'Delete forever', restored:'Restored to its place', destroyed:'Deleted forever',
    emptyTrash:'Empty trash', emptyTrashConfirmTitle:'Empty trash', emptyTrashConfirmMessage:'{0} items in the trash will be deleted forever and cannot be recovered.', trashEmptied:'Trash emptied',
    deletedAt:'Deleted', restoreHint:'Restore to its original classification', trashOpenHint:'Trashed items stay out of lists, calendar, and the summary',
    deleteTitle:'Delete item', deleteSubtitle:'Choose what to do with “{0}”', deleteTrashLabel:'Move to trash', deleteTrashHint:'Kept in the trash, restore anytime', deleteDestroyLabel:'Delete now', deleteDestroyHint:'Skips the trash and is deleted forever', moveToTrash:'Move to trash', deletedToTrash:'Moved to trash',
    statsListTitle:'Notes and tasks list', statsListHint:'Gather notes and tasks created in a chosen period, tick some, and make a picture',
    statsRangeAll:'All time', statsRangeToday:'Today', statsRange7:'Last 7 days', statsRange30:'Last 30 days', statsRange90:'Last 90 days', statsRangeCustom:'Custom',
    statsCustomStart:'Start date', statsCustomEnd:'End date', statsMakeImage:'Make picture', statsSelectedCount:'{0} selected', statsSelectAll:'Select all', statsClearSelection:'Clear',
    statsNeedSelection:'Tick some items before making a picture', statsImageDone:'List picture saved', statsImageFailed:'Picture export failed', statsEmptyRange:'Nothing was created in this period',
    statsGroupToday:'Today', statsGroupYesterday:'Yesterday', statsCheckItem:'Include in picture',
    metaQuickActions:'Quick actions', metaCopyTitle:'Copy title', metaCopyBody:'Copy content', metaCopyNotes:'Copy notes', metaCopyMarkdown:'Copy Markdown', metaMarkComplete:'Mark complete', metaReopen:'Reopen', metaViewCalendar:'Show on calendar', metaTrash:'Move to trash',
    copied:'Copied to clipboard', copyFailed:'Copy failed'
  }
};

const todayISO = () => {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000;
  return new Date(now - offset).toISOString().slice(0, 10);
};

// 子待办完成时刻的短日期（mm/dd，本地时区），悬停 title 给出精确到秒的时刻。
const formatMonthDay = value => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return `${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}`;
};

// 操作历史：本地保留最近 500 条（超出淘汰最旧），按类型词典渲染为
// 当前语言的描述，detail 携带目标标题等原文。
const HISTORY_KEY = 'acta.history.v1';
const HISTORY_LIMIT = 500;
let historyEntries = (() => {
  try {
    const raw = JSON.parse(localStorage.getItem(HISTORY_KEY));
    return Array.isArray(raw) ? raw.slice(0, HISTORY_LIMIT) : [];
  } catch { return []; }
})();
const historyMessages = {
  zh: {
    'note-created': '创建了笔记《{detail}》', 'todo-created': '创建了待办《{detail}》', 'checkin-created': '创建了打卡待办《{detail}》',
    'item-trashed': '把《{detail}》移入回收站', 'item-destroyed': '彻底删除了《{detail}》',
    'todo-completed': '完成了待办《{detail}》', 'todo-reopened': '重新打开了待办《{detail}》',
    'checkin': '为《{detail}》打卡', 'checkin-undo': '取消了《{detail}》的今日打卡',
    'subtask-added': '在《{detail}》中添加了子任务', 'subtask-completed': '完成了《{detail}》中的一个子任务', 'subtask-reopened': '重新打开了《{detail}》中的一个子任务', 'subtask-removed': '删除了《{detail}》中的一个子任务',
    'folder-created': '新建了归类「{detail}」', 'folder-deleted': '删除了归类「{detail}」'
  },
  en: {
    'note-created': 'Created note “{detail}”', 'todo-created': 'Created task “{detail}”', 'checkin-created': 'Created check-in task “{detail}”',
    'item-trashed': 'Moved “{detail}” to trash', 'item-destroyed': 'Permanently deleted “{detail}”',
    'todo-completed': 'Completed task “{detail}”', 'todo-reopened': 'Reopened task “{detail}”',
    'checkin': 'Checked in “{detail}”', 'checkin-undo': 'Undid today’s check-in for “{detail}”',
    'subtask-added': 'Added a subtask to “{detail}”', 'subtask-completed': 'Completed a subtask in “{detail}”', 'subtask-reopened': 'Reopened a subtask in “{detail}”', 'subtask-removed': 'Removed a subtask from “{detail}”',
    'folder-created': 'Created classification “{detail}”', 'folder-deleted': 'Deleted classification “{detail}”'
  }
};
function historyText(entry) {
  const dict = historyMessages[settings.language] || historyMessages.zh;
  return (dict[entry.type] || entry.type).replace('{detail}', entry.detail || '');
}
function logHistory(type, detail = '', targetId = '', snapshotBefore = null) {
  // snapshotBefore 为「操作之前」的条目深拷贝：回溯 = 把该项目恢复到
  // 此操作发生之前的状态；创建类操作无前状态（null），回溯即撤销创建。
  // 单条快照超过 96KB 时不随记录保存（回溯降级为仅跳转）。
  let snapshot = null;
  try {
    if (snapshotBefore) {
      const serialized = JSON.stringify(snapshotBefore);
      if (serialized.length <= 96 * 1024) snapshot = JSON.parse(serialized);
    }
  } catch { snapshot = null; }
  historyEntries.unshift({ id: uid(), type, detail: String(detail || ''), at: new Date().toISOString(), targetId: String(targetId || ''), snapshot });
  if (historyEntries.length > HISTORY_LIMIT) historyEntries.length = HISTORY_LIMIT;
  // 存储溢出时从最旧开始淘汰，直到写入成功。
  while (historyEntries.length) {
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(historyEntries));
      break;
    } catch {
      historyEntries.pop();
    }
  }
}

const daysFromToday = (days) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date - offset).toISOString().slice(0, 10);
};

function createDefaultLibrary() {
  return {
    version: 1,
    folders: [
      { id: 'ideas', nameKey: 'inboxFolder', color: '#b68b54' },
      { id: 'work', nameKey: 'workFolder', color: '#6f8a72' },
      { id: 'life', nameKey: 'lifeFolder', color: '#a87876' },
      { id: 'reading', nameKey: 'readingFolder', color: '#7a7799' }
    ],
    items: []
  };
}

function loadJSON(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) || fallback; }
  catch { return fallback; }
}

// Note bodies are user-authored HTML that round-trips through sync/import, so any
// HTML entering the library gets sanitized once at this single choke point.
const sanitizeNoteHTML = value => (
  typeof value === 'string' && value && window.DOMPurify?.sanitize ? window.DOMPurify.sanitize(value) : value
);

const folderColor = value => (typeof value === 'string' && /^#[0-9a-f]{3,8}$/i.test(value) ? value : '#999');

function normalizeLibrary(candidate) {
  if (!candidate || !Array.isArray(candidate.items) || !Array.isArray(candidate.folders)) return createDefaultLibrary();
  const normalized = { ...candidate, version: Math.max(Number(candidate.version) || 1, 1) };
  normalized.folders = candidate.folders.map(folder => (
    folder && typeof folder === 'object' ? { ...folder, color: folderColor(folder.color) } : folder
  ));
  const ids = new Set(candidate.items.map(item => item?.id).filter(Boolean));
  const normalizedAt = new Date().toISOString();
  normalized.items = candidate.items
    .filter(item => item && ids.has(item.id) && (item.type === 'note' || item.type === 'todo'))
    .map(item => {
      const createdAt = validDate(item.createdAt) || validDate(item.updatedAt) || normalizedAt;
      const updatedAt = validDate(item.updatedAt) || validDate(item.createdAt) || normalizedAt;
      const common = {
        ...item,
        createdAt,
        updatedAt,
        tags: Array.isArray(item.tags) ? item.tags.filter(tag => typeof tag === 'string') : [],
        linkedIds: Array.isArray(item.linkedIds) ? [...new Set(item.linkedIds.filter(id => typeof id === 'string' && id !== item.id && ids.has(id)))] : []
      };
      if (item.type === 'note') return { ...common, body:typeof item.body === 'string' ? sanitizeNoteHTML(item.body) : '<p><br></p>' };

      const hasStartAt = Object.prototype.hasOwnProperty.call(item, 'startAt');
      const hasDueAt = Object.prototype.hasOwnProperty.call(item, 'dueAt');
      const legacyStartAt = legacyTodoStartAt(item, createdAt);
      const legacyDuration = Number.isFinite(Number(item.durationMinutes)) && Number(item.durationMinutes) > 0
        ? Number(item.durationMinutes)
        : 60;
      const startAt = hasStartAt ? validDate(item.startAt) : legacyStartAt;
      const dueAt = hasDueAt
        ? validDate(item.dueAt)
        : (calendarDate(item.due) && legacyStartAt ? new Date(new Date(legacyStartAt).getTime() + legacyDuration * 60000).toISOString() : '');
      const { due, dueTime, durationMinutes, ...todo } = common;
      return {
        ...todo,
        startAt,
        dueAt,
        priority:['high', 'medium', 'low'].includes(item.priority) ? item.priority : 'medium',
        tasks:Array.isArray(item.tasks) ? item.tasks : [],
        completed:Boolean(item.completed)
      };
    });

  const itemById = new Map(normalized.items.map(item => [item.id, item]));
  normalized.items.forEach(item => {
    item.linkedIds = item.linkedIds.filter(id => itemById.get(id)?.type);
    item.linkedIds.forEach(id => {
      const other = itemById.get(id);
      if (other && !other.linkedIds.includes(item.id)) other.linkedIds.push(item.id);
    });
  });
  return normalized;
}

let library = normalizeLibrary(loadJSON(STORAGE_KEY, createDefaultLibrary()));
let settings = loadJSON(SETTINGS_KEY, { language: 'zh', syncFolder: '', lastSyncedAt: '' });
settings.showCompletedTodos = Boolean(settings.showCompletedTodos);
let currentView = 'inbox';
let currentFilter = 'all';
let todoPriorityFilter = 'all';
let todoDueFilter = 'all';
let todoFolderFilter = 'all';
let noteFolderFilter = 'all';
let noteRelationFilter = 'all';
let noteUpdatedFilter = 'all';
const listSortModes = ['updated', 'created', 'due', 'priority', 'title'];
let listSortMode = listSortModes.includes(settings.sortMode) ? settings.sortMode : 'updated';
let calendarViewMode = 'month';
let calendarCursor = new Date(`${todayISO()}T12:00:00`);
let calendarMotion = '';
let calendarMotionTimer = null;
let selectedId = library.items.find(item => !item.deletedAt)?.id || null;
let searchQuery = '';
// —— 已完成待办自动置底 ——
// 勾选完成后待办先原地停留一段可配置的延迟（等勾选动效播完，也给用户留出
// 撤回的时间），再把卡片以非线性动效移动到列表末尾（或从被过滤的列表中淡出）。
// 等待期间该待办按「冻结顺序」参与排序与筛选：其它重渲染（搜索、筛选、勾选
// 子任务）都不会让它提前跳动。偏好由 interface.js 写在 <html data-completed-todo-sink*>。
const pendingSink = new Map();          // 待办 id -> 延迟计时器
let sinkFrozenOrder = [];               // 置底等待期间冻结的卡片顺序（当前视图上下文）
let sinkContext = { view: '', filter: '' };
let sinkRenderQueued = false;           // 置底重渲染信号：由延迟计时器置位
const lastRenderCompletion = new Map(); // 待办 id -> 上次渲染时的完成态（用于识别完成瞬间）
const completedTodoSinkEnabled = () => document.documentElement.dataset.completedTodoSink !== 'off';
const completedTodoSinkDelay = () => Math.min(10000, Math.max(0, Number(document.documentElement.dataset.completedTodoSinkDelay) || 1000));
const completedTodoSinkView = () => currentView === 'todos' || currentView === 'inbox' || currentView === 'today' || String(currentView).startsWith('folder:');
let mobileEditorOpen = false;
let saveTimer;
let toastTimer;
let editorPaneResizeObserver;
let editorTitleResizeFrame = 0;

const t = (key) => dictionaries[settings.language][key] ?? key;
const uid = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
const escapeHTML = (value = '') => String(value).replace(/[&<>'"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));
const stripHTML = (html = '') => {
  const node = document.createElement('div');
  node.innerHTML = html;
  return (node.textContent || '').trim();
};
const isSafeHref = (value = '') => /^(https?:\/\/|mailto:)/i.test(String(value).trim());

// 行内 Markdown 特殊字符转义：保证 HTML→Markdown→HTML 往返不改变格式。
// 行首块级字符（#、>、-、数字）不做转义，源码保持易读。
const escapeMarkdownText = value => String(value)
  .replace(/\\/g, '\\\\')
  .replace(/([`*_[\]=~])/g, '\\$1');

function noteHTMLToMarkdown(html = '') {
  const root = document.createElement('div');
  root.innerHTML = html;
  const renderChildren = (node) => [...node.childNodes].map(renderNode).join('');
  const renderList = (node, ordered) => [...node.children].filter(child => child.tagName === 'LI').map((child, index) => {
    const content = renderChildren(child).trim().replace(/\n+/g, '\n  ');
    const taskMarker = child.classList.contains('markdown-task') || child.hasAttribute('data-checked')
      ? `- [${child.dataset.checked === 'true' ? 'x' : ' '}]`
      : '-';
    return `${ordered ? `${index + 1}.` : taskMarker} ${content}`;
  }).join('\n') + '\n\n';
  const renderNode = (node) => {
    if (node.nodeType === Node.TEXT_NODE) return escapeMarkdownText((node.nodeValue || '').replace(/\u00a0/g, ' '));
    if (node.nodeType !== Node.ELEMENT_NODE) return '';
    const tag = node.tagName;
    const content = renderChildren(node);
    if (tag === 'BR') return '\n';
    if (tag === 'P' || tag === 'DIV') return `${content.trim()}\n\n`;
    if (/^H[1-6]$/.test(tag)) return `${'#'.repeat(Number(tag.slice(1)))} ${content.trim()}\n\n`;
    if (tag === 'STRONG' || tag === 'B') return `**${content}**`;
    if (tag === 'EM' || tag === 'I') return `*${content}*`;
    if (tag === 'DEL' || tag === 'S' || tag === 'STRIKE') return `~~${content}~~`;
    if (tag === 'MARK') return `==${content}==`;
    if (tag === 'CODE' && node.parentElement?.tagName !== 'PRE') return `\`${content.replace(/`/g, '\\`')}\``;
    if (tag === 'UL') return renderList(node, false);
    if (tag === 'OL') return renderList(node, true);
    if (tag === 'A') {
      const href = node.getAttribute('href') || '';
      return isSafeHref(href) ? `[${content}](${href})` : content;
    }
    if (tag === 'BLOCKQUOTE') return `${content.trim().split('\n').map(line => `> ${line}`).join('\n')}\n\n`;
    if (tag === 'PRE') {
      const code = node.querySelector(':scope > code');
      const language = String(code?.dataset.language || '').replace(/[^a-z0-9_+-]/gi, '');
      return `\`\`\`${language}\n${node.textContent || ''}\n\`\`\`\n\n`;
    }
    if (tag === 'HR') return `---\n\n`;
    if (tag === 'SPAN' && node.classList.contains('markdown-task-box')) return '';
    return content;
  };
  return renderChildren(root).replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
}

// 行内文本 → HTML。转义字符 `\x` 在格式替换后统一还原，
// 格式匹配的 em 规则排除前置反斜杠，避免把 `\*x\*` 误判为斜体。
const inlineMarkdownHTML = value => markdownInline(value).replace(/\n/g, '<br>');

function markdownInline(value = '') {
  const protectedHTML = [];
  const protect = html => {
    const token = `\u0000${protectedHTML.length}\u0000`;
    protectedHTML.push(html);
    return token;
  };
  let text = String(value).replace(/`([^`\n]+)`/g, (_match, code) => protect(`<code>${escapeHTML(code.replace(/\\`/g, '`'))}</code>`));
  text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_match, label, href) => {
    if (!isSafeHref(href)) return label;
    return protect(`<a href="${escapeHTML(href.trim())}">${escapeHTML(label.replace(/\\([\[\]()])/g, '$1'))}</a>`);
  });
  text = escapeHTML(text)
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/__([^_]+)__/g, '<strong>$1</strong>')
    .replace(/~~([^~]+)~~/g, '<del>$1</del>')
    .replace(/==([^=]+)==/g, '<mark>$1</mark>')
    .replace(/(^|[^*\\])\*([^*\n]+)\*/g, '$1<em>$2</em>')
    .replace(/(^|[^_\\])_([^_\n]+)_/g, '$1<em>$2</em>')
    .replace(/\\([\\`*_[\]=~])/g, '$1');
  return text.replace(/\u0000(\d+)\u0000/g, (_match, index) => protectedHTML[Number(index)] || '');
}

function markdownToNoteHTML(markdown = '') {
  const lines = String(markdown).replace(/\r\n?/g, '\n').split('\n');
  const output = [];
  let paragraph = [];
  // 列表栈按缩进层级解析嵌套列表；与 HTML→Markdown 的缩进输出互为逆操作。
  let listStack = [];
  let inCode = false;
  let codeLines = [];
  let codeLanguage = '';
  let quoteLines = [];
  const flushParagraph = () => {
    if (!paragraph.length) return;
    output.push(`<p>${paragraph.map(inlineMarkdownHTML).join('<br>')}</p>`);
    paragraph = [];
  };
  const closeLists = toDepth => {
    while (listStack.length > toDepth) output.push(`</${listStack.pop().type}>`);
  };
  const flushQuote = () => {
    if (!quoteLines.length) return;
    output.push(`<blockquote><p>${quoteLines.map(inlineMarkdownHTML).join('<br>')}</p></blockquote>`);
    quoteLines = [];
  };
  const openListItem = (indent, type, listItemHTML) => {
    if (listStack.length && indent < listStack[listStack.length - 1].indent) closeLists(listStack.length - 1);
    const top = listStack[listStack.length - 1];
    if (!top || indent > top.indent) {
      output.push(`<${type}>`);
      listStack.push({ type, indent });
    } else if (top.type !== type) {
      output.push(`</${top.type}>`);
      output.push(`<${type}>`);
      listStack[listStack.length - 1] = { type, indent };
    }
    output.push(listItemHTML);
  };
  lines.forEach(line => {
    const fence = line.match(/^\s*```([a-z0-9_+-]*)\s*$/i);
    if (fence) {
      flushParagraph(); closeLists(0); flushQuote();
      if (inCode) {
        output.push(`<pre><code${codeLanguage ? ` data-language="${escapeHTML(codeLanguage)}"` : ''}>${escapeHTML(codeLines.join('\n'))}</code></pre>`);
        codeLines = [];
        codeLanguage = '';
      } else {
        codeLanguage = fence[1] || '';
      }
      inCode = !inCode;
      return;
    }
    if (inCode) { codeLines.push(line); return; }
    const quote = line.match(/^\s*>\s?(.*)$/);
    if (quote) {
      flushParagraph(); closeLists(0);
      quoteLines.push(quote[1]);
      return;
    }
    flushQuote();
    const heading = line.match(/^(#{1,6})\s+(.+)$/);
    const horizontalRule = /^\s{0,3}(?:(?:-\s*){3,}|(?:\*\s*){3,}|(?:_\s*){3,})$/.test(line);
    const task = line.match(/^(\s*)[-+*]\s+\[([ xX])\]\s+(.+)$/);
    const unordered = line.match(/^(\s*)[-+*]\s+(.+)$/);
    const ordered = line.match(/^(\s*)\d+[.)]\s+(.+)$/);
    if (heading) {
      flushParagraph(); closeLists(0);
      output.push(`<h${heading[1].length}>${inlineMarkdownHTML(heading[2])}</h${heading[1].length}>`);
    } else if (horizontalRule) {
      flushParagraph(); closeLists(0);
      output.push('<hr>');
    } else if (task || unordered || ordered) {
      flushParagraph();
      const match = task || unordered || ordered;
      const indent = match[1].length;
      const type = ordered ? 'ol' : 'ul';
      const listItemHTML = task
        ? `<li class="markdown-task" data-checked="${task[2].toLowerCase() === 'x'}"><span class="markdown-task-box" contenteditable="false">${task[2].toLowerCase() === 'x' ? '☑' : '☐'}</span>${inlineMarkdownHTML(task[3])}</li>`
        : `<li>${inlineMarkdownHTML(match[2])}</li>`;
      openListItem(indent, type, listItemHTML);
    } else if (!line.trim()) {
      flushParagraph(); closeLists(0);
    } else {
      closeLists(0);
      paragraph.push(line);
    }
  });
  if (inCode && codeLines.length) output.push(`<pre><code${codeLanguage ? ` data-language="${escapeHTML(codeLanguage)}"` : ''}>${escapeHTML(codeLines.join('\n'))}</code></pre>`);
  flushParagraph(); closeLists(0); flushQuote();
  return output.join('') || '<p><br></p>';
}

function validDate(value) {
  return typeof value === 'string' && !Number.isNaN(Date.parse(value)) ? value : '';
}

function legacyTodoStartAt(item, fallback = '') {
  if (!calendarDate(item?.due)) return fallback;
  const time = /^([01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/.test(String(item.dueTime || ''))
    ? String(item.dueTime)
    : '09:00:00';
  const date = new Date(`${item.due}T${time}`);
  return Number.isNaN(date.getTime()) ? fallback : date.toISOString();
}

function dateTimeLocalValue(value) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const pad = part => String(part).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

function dateTimeLocalISO(value) {
  if (!value) return '';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toISOString();
}

function todoStartDate(item) {
  const value = validDate(item?.startAt);
  return value ? new Date(value) : null;
}

function todoDueDate(item) {
  const value = validDate(item?.dueAt);
  return value ? new Date(value) : null;
}

function todoIsScheduled(item) {
  const start = todoStartDate(item);
  const due = todoDueDate(item);
  return Boolean(start && due && due > start);
}

function todoScheduleDate(item) {
  const start = todoStartDate(item);
  return start ? calendarDateISO(start) : '';
}

function todoDueDateISO(item) {
  const due = todoDueDate(item);
  return due ? calendarDateISO(due) : '';
}

function parseImportedNote(content, fileName = '') {
  if (typeof content !== 'string') throw new Error(t('invalidNoteFile'));
  if (new Blob([content]).size > 5 * 1024 * 1024) throw new Error(t('fileTooLarge'));
  let markdown = content.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n');
  const metadata = {};
  if (markdown.startsWith('---\n')) {
    const end = markdown.indexOf('\n---\n', 4);
    if (end !== -1) {
      markdown.slice(4, end).split('\n').forEach(line => {
        const separator = line.indexOf(':');
        if (separator > 0) metadata[line.slice(0, separator).trim()] = line.slice(separator + 1).trim();
      });
      markdown = markdown.slice(end + 5).replace(/^\n+/, '');
    }
  }

  let title = '';
  if (metadata.title) {
    try { title = JSON.parse(metadata.title); } catch { title = metadata.title; }
  }
  const firstHeading = markdown.match(/^#\s+(.+)\s*(?:\n|$)/);
  if (!title && firstHeading) title = firstHeading[1].trim();
  if (firstHeading) markdown = markdown.slice(firstHeading[0].length).replace(/^\n+/, '');
  if (!title) title = String(fileName).replace(/\.(md|markdown|txt)$/i, '') || t('untitledNote');

  let tags = [];
  if (metadata.tags) {
    try { const parsed = JSON.parse(metadata.tags); if (Array.isArray(parsed)) tags = parsed.filter(tag => typeof tag === 'string'); } catch { /* Ignore malformed optional metadata. */ }
  }
  return {
    title: String(title).trim() || t('untitledNote'),
    tags,
    createdAt: validDate(metadata.created) || new Date().toISOString(),
    body: markdownToNoteHTML(markdown)
  };
}

function portableFileName(title = '') {
  let name = String(title).replace(/[<>:"/\\|?*\u0000-\u001F]/g, '-').replace(/[. ]+$/g, '').trim().slice(0, 80) || 'Acta note';
  if (/^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/i.test(name)) name = `_${name}`;
  return `${name}.md`;
}

function buildNoteMarkdown(item) {
  const title = String(item.title || t('untitledNote')).replace(/[\r\n]+/g, ' ').trim();
  const body = noteHTMLToMarkdown(item.body || '');
  return `---\nacta-note: 1\ntitle: ${JSON.stringify(title)}\ntags: ${JSON.stringify(item.tags || [])}\ncreated: ${item.createdAt || ''}\nupdated: ${item.updatedAt || ''}\n---\n\n# ${title}\n\n${body}${body ? '\n' : ''}`;
}
const getItem = () => library.items.find(item => item.id === selectedId);
const getFolder = (id) => library.folders.find(folder => folder.id === id);
const folderName = (folder) => folder ? (folder.nameKey ? t(folder.nameKey) : folder.name) : t('unclassified');
const folderShortSegmenter = typeof Intl?.Segmenter === 'function' ? new Intl.Segmenter(undefined, { granularity:'grapheme' }) : null;
const folderShortSegments = value => {
  const text = String(value || '').trim();
  return folderShortSegmenter ? [...folderShortSegmenter.segment(text)].map(entry => entry.segment) : Array.from(text);
};
const folderShortNameUsesEmoji = value => folderShortSegments(value).some(segment => /[\p{Extended_Pictographic}\p{Regional_Indicator}\uFE0F\u20E3]/u.test(segment));
const normalizeFolderShortName = value => {
  const segments = folderShortSegments(value);
  if (!segments.length) return '';
  const emoji = segments.find(segment => folderShortNameUsesEmoji(segment));
  return emoji || segments.slice(0, 3).join('');
};
const folderShortName = (folder) => {
  if (!folder) return '';
  const custom = normalizeFolderShortName(folder.shortName);
  if (custom) return custom;
  const name = String(folderName(folder) || '').trim();
  const words = name.split(/\s+/).filter(Boolean);
  if (words.length > 1) return words.slice(0, 3).map(word => folderShortSegments(word)[0]).join('').toLocaleUpperCase();
  return folderShortSegments(name.replace(/\s+/g, '')).slice(0, 2).join('').toLocaleUpperCase();
};
const isTodoComplete = (item) => item?.type === 'todo' && (Boolean(item.completed) || ((item.tasks || []).length > 0 && item.tasks.every(task => task.done)));
const isTrashed = (item) => Boolean(item?.deletedAt);
const activeItems = () => library.items.filter(item => !isTrashed(item));
const trashedItems = () => library.items.filter(isTrashed).sort((a, b) => String(b.deletedAt).localeCompare(String(a.deletedAt)));
const priorityRank = (priority) => ({ high: 0, medium: 1, low: 2 })[priority] ?? 1;
const getLinkedItems = (item) => (item.linkedIds || []).map(id => library.items.find(entry => entry.id === id)).filter(Boolean);

function persist() {
  $('#saveState').textContent = t('saving');
  $('#saveState').classList.add('saving');
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(library));
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    $('#saveState').textContent = t('saved');
    $('#saveState').classList.remove('saving');
  }, 320);
}

function showToast(message) {
  const toast = $('#toast');
  $('p', toast).textContent = message;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2400);
}

function formatDate(value, short = false) {
  if (!value) return t('noDate');
  const date = new Date(value.length === 10 ? `${value}T12:00:00` : value);
  const today = new Date(`${todayISO()}T12:00:00`);
  const difference = Math.round((date - today) / 86400000);
  if (difference === 0) return t('today');
  if (difference === -1) return t('yesterday');
  return new Intl.DateTimeFormat(settings.language === 'zh' ? 'zh-CN' : 'en-US', short
    ? { month: 'short', day: 'numeric' }
    : { year: 'numeric', month: 'short', day: 'numeric' }).format(date);
}

function formatDateTimeSeconds(value) {
  if (!value) return t('noDate');
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return t('noDate');
  const locale = settings.language === 'en' ? 'en-GB' : settings.language === 'zh-Hant' ? 'zh-Hant' : 'zh-CN';
  return new Intl.DateTimeFormat(locale, {
    year:'numeric', month:'2-digit', day:'2-digit',
    hour:'2-digit', minute:'2-digit', second:'2-digit', hour12:false
  }).format(date).replace(',', '');
}

function formatListDateTime(value) {
  if (!value) return t('noDate');
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return t('noDate');
  const locale = settings.language === 'en' ? 'en-GB' : settings.language === 'zh-Hant' ? 'zh-Hant' : 'zh-CN';
  return new Intl.DateTimeFormat(locale, {
    month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit', hour12:false
  }).format(date).replace(',', '');
}

function todoListTimeMarkup(item) {
  const start = todoStartDate(item);
  const due = todoDueDate(item);
  if (start && due && due > start) {
    const fullRange = `${formatDateTimeSeconds(start)} — ${formatDateTimeSeconds(due)}`;
    return `<span class="card-date card-schedule-date" title="${escapeHTML(fullRange)}" aria-label="${escapeHTML(fullRange)}"><time datetime="${escapeHTML(start.toISOString())}">${escapeHTML(formatListDateTime(start))}</time><i aria-hidden="true">—</i><time datetime="${escapeHTML(due.toISOString())}">${escapeHTML(formatListDateTime(due))}</time></span>`;
  }
  const createdAt = validDate(item.createdAt) || validDate(item.updatedAt);
  const createdLabel = formatDateTimeSeconds(createdAt);
  return `<time class="card-date card-created-date" datetime="${escapeHTML(createdAt)}" title="${escapeHTML(createdLabel)}">${escapeHTML(formatListDateTime(createdAt))}</time>`;
}

const calendarLocale = () => settings.language === 'en' ? 'en-US' : settings.language === 'zh-Hant' ? 'zh-Hant' : 'zh-CN';
const calendarModeKey = mode => ({ year:'yearView', month:'monthView', week:'weekView', day:'dayView' })[mode] || 'monthView';
const calendarShiftKey = (direction, mode = calendarViewMode) => `${direction < 0 ? 'previous' : 'next'}${mode[0].toUpperCase()}${mode.slice(1)}`;
const calendarText = (key, ...values) => values.reduce((message, value, index) => message.replace(`{${index}}`, value), t(key));

function calendarDate(value) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return new Date(value.getFullYear(), value.getMonth(), value.getDate(), 12);
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value || ''));
  if (!match) return null;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]), 12);
  return date.getFullYear() === Number(match[1]) && date.getMonth() === Number(match[2]) - 1 && date.getDate() === Number(match[3]) ? date : null;
}

function calendarDateISO(date) {
  const normalized = calendarDate(date);
  if (!normalized) return '';
  const pad = value => String(value).padStart(2, '0');
  return `${normalized.getFullYear()}-${pad(normalized.getMonth() + 1)}-${pad(normalized.getDate())}`;
}

function calendarAddDays(date, amount) {
  const normalized = calendarDate(date) || calendarDate(todayISO());
  return new Date(normalized.getFullYear(), normalized.getMonth(), normalized.getDate() + amount, 12);
}

function calendarStartOfWeek(date) {
  const normalized = calendarDate(date) || calendarDate(todayISO());
  const mondayOffset = (normalized.getDay() + 6) % 7;
  return calendarAddDays(normalized, -mondayOffset);
}

function calendarWeekNumber(date) {
  const normalized = calendarDate(date) || calendarDate(todayISO());
  const utcDate = new Date(Date.UTC(normalized.getFullYear(), normalized.getMonth(), normalized.getDate()));
  const weekday = utcDate.getUTCDay() || 7;
  utcDate.setUTCDate(utcDate.getUTCDate() + 4 - weekday);
  const yearStart = new Date(Date.UTC(utcDate.getUTCFullYear(), 0, 1));
  return Math.ceil((((utcDate - yearStart) / 86400000) + 1) / 7);
}

function calendarMonthStart(date) {
  const normalized = calendarDate(date) || calendarDate(todayISO());
  return new Date(normalized.getFullYear(), normalized.getMonth(), 1, 12);
}

function calendarWeekdayLabels(style = 'short') {
  const monday = new Date(2024, 0, 1, 12);
  return Array.from({ length:7 }, (_, index) => new Intl.DateTimeFormat(calendarLocale(), { weekday:style }).format(calendarAddDays(monday, index)));
}

function calendarTodoTime(item) {
  const start = todoStartDate(item);
  const due = todoDueDate(item);
  if (!start || !due) return '';
  const time = date => new Intl.DateTimeFormat(calendarLocale(), { hour:'2-digit', minute:'2-digit', hour12:false }).format(date);
  if (calendarDateISO(start) === calendarDateISO(due)) return `${time(start)}–${time(due)}`;
  const dateTime = date => new Intl.DateTimeFormat(calendarLocale(), { month:'numeric', day:'numeric', hour:'2-digit', minute:'2-digit', hour12:false }).format(date);
  return `${dateTime(start)}–${dateTime(due)}`;
}

function calendarTodos() {
  return library.items
    .filter(item => !isTrashed(item) && item.type === 'todo' && todoIsScheduled(item))
    .sort((first, second) => {
      const startDifference = String(first.startAt).localeCompare(String(second.startAt));
      if (startDifference) return startDifference;
      const dueDifference = String(first.dueAt).localeCompare(String(second.dueAt));
      if (dueDifference) return dueDifference;
      const completionDifference = Number(isTodoComplete(first)) - Number(isTodoComplete(second));
      if (completionDifference) return completionDifference;
      return priorityRank(first.priority) - priorityRank(second.priority);
    });
}

function calendarNotes() {
  return library.items
    .filter(item => !isTrashed(item) && item.type === 'note' && calendarDateISO(new Date(item.createdAt)))
    .sort((first, second) => new Date(first.createdAt) - new Date(second.createdAt));
}

function calendarTodosByDate(items = calendarTodos(), rangeStart = null, rangeEnd = null) {
  const grouped = new Map();
  const visibleStart = calendarDate(rangeStart);
  const visibleEnd = calendarDate(rangeEnd);
  items.forEach(item => {
    let date = calendarDate(todoScheduleDate(item));
    let lastDate = calendarDate(todoDueDateISO(item));
    if (!date || !lastDate) return;
    if (visibleStart && date < visibleStart) date = visibleStart;
    if (visibleEnd) {
      const visibleLastDate = calendarAddDays(visibleEnd, -1);
      if (lastDate > visibleLastDate) lastDate = visibleLastDate;
    }
    while (date <= lastDate) {
      const iso = calendarDateISO(date);
      if (!grouped.has(iso)) grouped.set(iso, []);
      grouped.get(iso).push(item);
      date = calendarAddDays(date, 1);
    }
  });
  return grouped;
}

function calendarNotesByDate(items = calendarNotes(), rangeStart = null, rangeEnd = null) {
  const grouped = new Map();
  const visibleStart = calendarDate(rangeStart);
  const visibleEnd = calendarDate(rangeEnd);
  items.forEach(item => {
    const date = calendarDate(new Date(item.createdAt));
    if (!date || (visibleStart && date < visibleStart) || (visibleEnd && date >= visibleEnd)) return;
    const iso = calendarDateISO(date);
    if (!grouped.has(iso)) grouped.set(iso, []);
    grouped.get(iso).push(item);
  });
  return grouped;
}

function calendarPeriodRange(mode = calendarViewMode, cursor = calendarCursor) {
  const active = calendarDate(cursor) || calendarDate(todayISO());
  if (mode === 'year') {
    const start = new Date(active.getFullYear(), 0, 1, 12);
    return [start, new Date(active.getFullYear() + 1, 0, 1, 12)];
  }
  if (mode === 'month') {
    const start = calendarMonthStart(active);
    return [start, new Date(start.getFullYear(), start.getMonth() + 1, 1, 12)];
  }
  if (mode === 'week') {
    const start = calendarStartOfWeek(active);
    return [start, calendarAddDays(start, 7)];
  }
  return [active, calendarAddDays(active, 1)];
}

function calendarPeriodTodos(mode = calendarViewMode, cursor = calendarCursor) {
  const [start, end] = calendarPeriodRange(mode, cursor);
  const startISO = calendarDateISO(start);
  const endISO = calendarDateISO(end);
  return calendarTodos().filter(item => {
    const firstDate = todoScheduleDate(item);
    const lastDate = todoDueDateISO(item);
    return firstDate < endISO && lastDate >= startISO;
  });
}

function calendarPeriodItems(mode = calendarViewMode, cursor = calendarCursor) {
  const [start, end] = calendarPeriodRange(mode, cursor);
  const notesByDate = calendarNotesByDate(calendarNotes(), start, end);
  return [...calendarPeriodTodos(mode, cursor), ...[...notesByDate.values()].flat()];
}

function calendarPeriodLabel() {
  const active = calendarDate(calendarCursor) || calendarDate(todayISO());
  const locale = calendarLocale();
  if (calendarViewMode === 'year') return new Intl.DateTimeFormat(locale, { year:'numeric' }).format(active);
  if (calendarViewMode === 'month') {
    const monthStart = calendarMonthStart(active);
    const gridStart = calendarStartOfWeek(monthStart);
    const monthLabel = new Intl.DateTimeFormat(locale, { year:'numeric', month:'long' }).format(active);
    return `${monthLabel} · W${calendarWeekNumber(gridStart)}–W${calendarWeekNumber(calendarAddDays(gridStart, 35))}`;
  }
  if (calendarViewMode === 'week') {
    const start = calendarStartOfWeek(active);
    const end = calendarAddDays(start, 6);
    const sameYear = start.getFullYear() === end.getFullYear();
    const startLabel = new Intl.DateTimeFormat(locale, { ...(sameYear ? {} : { year:'numeric' }), month:'short', day:'numeric' }).format(start);
    const endLabel = new Intl.DateTimeFormat(locale, { year:'numeric', month:'short', day:'numeric' }).format(end);
    return `W${calendarWeekNumber(start)} · ${startLabel} – ${endLabel}`;
  }
  return new Intl.DateTimeFormat(locale, { year:'numeric', month:'long', day:'numeric', weekday:'long' }).format(active);
}

function calendarLinkedNotes(item) {
  return getLinkedItems(item).filter(linked => linked.type === 'note');
}

function calendarSubtasksMarkup(item) {
  const tasks = item.tasks || [];
  if (!tasks.length) return '';
  return `<div class="calendar-subtasks" aria-label="${escapeHTML(t('progress'))}">
    ${tasks.map(task => {
      const label = task.text || t('taskPlaceholder');
      const actionLabel = task.done ? t('reopenTask') : t('completeTask');
      return `<div class="calendar-subtask ${task.done ? 'is-complete' : ''}" data-calendar-subtask="${escapeHTML(task.id)}">
        <button class="calendar-subtask-check" type="button" data-calendar-subtask-toggle="${escapeHTML(item.id)}" data-calendar-subtask-id="${escapeHTML(task.id)}" title="${escapeHTML(actionLabel)}" aria-label="${escapeHTML(actionLabel)}" aria-pressed="${Boolean(task.done)}"><svg><use href="#i-check"/></svg></button>
        <button class="calendar-subtask-title" type="button" data-calendar-open="${escapeHTML(item.id)}">${escapeHTML(label)}</button>
      </div>`;
    }).join('')}
  </div>`;
}

function calendarTodoMarkup(item, density = 'full') {
  const done = isTodoComplete(item);
  const linkedNotes = calendarLinkedNotes(item);
  const folder = getFolder(item.folderId);
  const time = calendarTodoTime(item);
  const title = item.title || t('untitledTodo');
  const completionLabel = done ? t('reopenTask') : t('completeTask');
  const linkedMarkup = linkedNotes.length ? `<div class="calendar-linked-notes" aria-label="${escapeHTML(t('linkedNotes'))}">
    ${linkedNotes.map(note => `<button type="button" data-calendar-open-note="${escapeHTML(note.id)}" title="${escapeHTML(note.title || t('untitledNote'))}"><svg><use href="#i-note"/></svg><span>${escapeHTML(note.title || t('untitledNote'))}</span></button>`).join('')}
  </div>` : '';
  const meta = density === 'full' ? `<div class="calendar-todo-meta">
    ${time ? `<span><svg><use href="#i-clock"/></svg>${escapeHTML(time)}</span>` : ''}
    <span><i class="folder-dot" style="background:${escapeHTML(folder?.color || '#999')}"></i>${escapeHTML(folderName(folder))}</span>
    <span class="priority-pill ${escapeHTML(item.priority || 'medium')}">${escapeHTML(t(item.priority || 'medium'))}</span>
  </div>` : (time ? `<time>${escapeHTML(time)}</time>` : '');
  return `<article class="calendar-todo calendar-todo-${density} priority-${escapeHTML(item.priority || 'medium')} ${done ? 'is-complete' : ''}" data-calendar-todo="${escapeHTML(item.id)}">
    <button class="calendar-todo-check" type="button" data-calendar-toggle="${escapeHTML(item.id)}" title="${escapeHTML(completionLabel)}" aria-label="${escapeHTML(completionLabel)}" aria-pressed="${done}">
      <svg><use href="#i-check"/></svg>
    </button>
    <div class="calendar-todo-content">
      <div class="calendar-todo-heading">${meta}<button class="calendar-todo-title" type="button" data-calendar-open="${escapeHTML(item.id)}" title="${escapeHTML(t('calendarOpenTodo'))}">${escapeHTML(title)}</button></div>
      ${linkedMarkup}
      ${density === 'full' ? calendarSubtasksMarkup(item) : ''}
    </div>
  </article>`;
}

function calendarMonthTodoMarkup(item) {
  const done = isTodoComplete(item);
  const linkedNotes = calendarLinkedNotes(item);
  const title = item.title || t('untitledTodo');
  const relationTitle = linkedNotes.map(note => note.title || t('untitledNote')).join(' · ');
  const linkedMarkup = linkedNotes.length ? `<button class="calendar-month-link" type="button" data-calendar-open-note="${escapeHTML(linkedNotes[0].id)}" title="${escapeHTML(relationTitle)}" aria-label="${escapeHTML(`${t('linkedNotes')}：${relationTitle}`)}"><svg><use href="#i-note"/></svg>${linkedNotes.length > 1 ? `<span>${linkedNotes.length}</span>` : ''}</button>` : '';
  return `<article class="calendar-month-todo priority-${escapeHTML(item.priority || 'medium')} ${done ? 'is-complete' : ''}" data-calendar-todo="${escapeHTML(item.id)}">
    <button class="calendar-month-todo-icon" type="button" data-calendar-open="${escapeHTML(item.id)}" title="${escapeHTML(title)}" aria-label="${escapeHTML(title)}"><svg><use href="#i-check"/></svg></button>
    <button class="calendar-month-todo-title" type="button" data-calendar-open="${escapeHTML(item.id)}" title="${escapeHTML(title)}">${escapeHTML(title)}</button>
    ${linkedMarkup}
  </article>`;
}

function calendarMonthNoteMarkup(item) {
  const title = item.title || t('untitledNote');
  return `<article class="calendar-month-todo calendar-month-note" data-calendar-note="${escapeHTML(item.id)}">
    <button class="calendar-month-todo-icon calendar-month-note-icon" type="button" data-calendar-open-note="${escapeHTML(item.id)}" title="${escapeHTML(title)}" aria-label="${escapeHTML(title)}"><svg><use href="#i-note"/></svg></button>
    <button class="calendar-month-todo-title" type="button" data-calendar-open-note="${escapeHTML(item.id)}" title="${escapeHTML(title)}">${escapeHTML(title)}</button>
  </article>`;
}

function calendarNoteMarkup(item) {
  const folder = getFolder(item.folderId);
  const title = item.title || t('untitledNote');
  const preview = itemPreview(item);
  return `<article class="calendar-todo calendar-todo-full calendar-note" data-calendar-note="${escapeHTML(item.id)}">
    <span class="calendar-note-state" aria-hidden="true"><svg><use href="#i-note"/></svg></span>
    <div class="calendar-todo-content">
      <div class="calendar-todo-heading">
        <div class="calendar-todo-meta">
          <span><svg><use href="#i-clock"/></svg>${escapeHTML(formatDateTimeSeconds(item.createdAt))}</span>
          <span><i class="folder-dot" style="background:${escapeHTML(folder?.color || '#999')}"></i>${escapeHTML(folderName(folder))}</span>
          <span class="type-pill note">${escapeHTML(t('note'))}</span>
        </div>
        <button class="calendar-todo-title" type="button" data-calendar-open-note="${escapeHTML(item.id)}" title="${escapeHTML(t('calendarOpenNote'))}">${escapeHTML(title)}</button>
      </div>
      ${preview ? `<p class="calendar-note-preview">${escapeHTML(preview)}</p>` : ''}
    </div>
  </article>`;
}

const calendarMonthItemMarkup = item => item.type === 'note' ? calendarMonthNoteMarkup(item) : calendarMonthTodoMarkup(item);
const calendarItemMarkup = item => item.type === 'note' ? calendarNoteMarkup(item) : calendarTodoMarkup(item, 'full');

function calendarEmptyMarkup() {
  return `<div class="calendar-empty"><span><svg><use href="#i-calendar"/></svg></span><h3>${escapeHTML(t('noCalendarItems'))}</h3><p>${escapeHTML(t('noCalendarItemsHint'))}</p></div>`;
}

function renderCalendarMonth() {
  const monthStart = calendarMonthStart(calendarCursor);
  const gridStart = calendarStartOfWeek(monthStart);
  const gridEnd = calendarAddDays(gridStart, 42);
  const activeMonth = monthStart.getMonth();
  const today = todayISO();
  const weekdays = calendarWeekdayLabels('short');
  const todosByDate = calendarTodosByDate(calendarTodos(), gridStart, gridEnd);
  const notesByDate = calendarNotesByDate(calendarNotes(), gridStart, gridEnd);
  const visibleLimit = matchMedia('(max-width: 800px)').matches ? 2 : 3;
  const cells = Array.from({ length:6 }, (_, weekIndex) => {
    const weekStart = calendarAddDays(gridStart, weekIndex * 7);
    const weekNumber = calendarWeekNumber(weekStart);
    const days = Array.from({ length:7 }, (_, dayIndex) => {
      const date = calendarAddDays(weekStart, dayIndex);
      const iso = calendarDateISO(date);
      const items = [...(notesByDate.get(iso) || []), ...(todosByDate.get(iso) || [])];
      const visible = items.slice(0, visibleLimit);
      const remaining = items.length - visible.length;
      return `<section class="calendar-day-cell ${date.getMonth() === activeMonth ? '' : 'is-adjacent'} ${iso === today ? 'is-today' : ''}" data-calendar-cell="${iso}">
        <header><button type="button" data-calendar-date="${iso}" title="${escapeHTML(t('calendarOpenDay'))}">${date.getDate()}</button>${items.length ? `<span>${items.length}</span>` : ''}</header>
        <div class="calendar-day-events">${visible.map(calendarMonthItemMarkup).join('')}${remaining > 0 ? `<button class="calendar-overflow" type="button" data-calendar-date="${iso}" title="${escapeHTML(calendarText('moreTodos', remaining))}" aria-label="${escapeHTML(calendarText('moreTodos', remaining))}"><svg><use href="#i-more"/></svg></button>` : ''}</div>
      </section>`;
    }).join('');
    return `<div class="calendar-month-week" data-calendar-week="${calendarDateISO(weekStart)}"><aside class="calendar-week-number" title="${escapeHTML(`${t('weekNumber')} ${weekNumber}`)}"><span>W</span><b>${weekNumber}</b></aside>${days}</div>`;
  }).join('');
  return `<div class="calendar-month-view"><div class="calendar-weekdays"><span class="calendar-week-number-heading">${escapeHTML(t('weekNumber'))}</span>${weekdays.map(label => `<span>${escapeHTML(label)}</span>`).join('')}</div><div class="calendar-month-grid">${cells}</div></div>`;
}

function renderCalendarWeek() {
  const start = calendarStartOfWeek(calendarCursor);
  const end = calendarAddDays(start, 7);
  const today = todayISO();
  const labels = calendarWeekdayLabels('short');
  const todosByDate = calendarTodosByDate(calendarTodos(), start, end);
  const notesByDate = calendarNotesByDate(calendarNotes(), start, end);
  const days = Array.from({ length:7 }, (_, index) => {
    const date = calendarAddDays(start, index);
    const iso = calendarDateISO(date);
    const items = [...(todosByDate.get(iso) || []), ...(notesByDate.get(iso) || [])];
    return `<section class="calendar-week-day ${iso === today ? 'is-today' : ''}" data-calendar-day="${iso}">
      <header><button type="button" data-calendar-date="${iso}"><span>${escapeHTML(labels[index])}</span><b>${date.getDate()}</b></button><em>${items.length || ''}</em></header>
      <div class="calendar-week-events">${items.length ? items.map(calendarItemMarkup).join('') : '<span class="calendar-day-quiet">—</span>'}</div>
    </section>`;
  }).join('');
  return `<div class="calendar-week-swipe-hint" aria-hidden="true"><svg><use href="#i-chevron"/></svg><span>${escapeHTML(t('swipeWeekHint'))}</span><svg><use href="#i-chevron"/></svg></div><div class="calendar-week-view">${days}</div>`;
}

function renderCalendarDay() {
  const iso = calendarDateISO(calendarCursor);
  const dayStart = calendarDate(calendarCursor);
  const todos = calendarTodosByDate(calendarTodos(), dayStart, calendarAddDays(dayStart, 1)).get(iso) || [];
  const notes = calendarNotesByDate(calendarNotes(), dayStart, calendarAddDays(dayStart, 1)).get(iso) || [];
  const items = [...todos, ...notes];
  const openCount = todos.filter(item => !isTodoComplete(item)).length;
  const completedCount = todos.length - openCount;
  return `<div class="calendar-day-view">
    <div class="calendar-day-summary">
      <div><b>${items.length}</b><span>${escapeHTML(t('calendarItems'))}</span></div>
      <div><b>${openCount}</b><span>${escapeHTML(t('todos'))}</span></div>
      <div><b>${completedCount}</b><span>${escapeHTML(t('completed'))}</span></div>
      <div><b>${notes.length}</b><span>${escapeHTML(t('createdNotes'))}</span></div>
    </div>
    <div class="calendar-day-list">${items.length ? items.map(calendarItemMarkup).join('') : calendarEmptyMarkup()}</div>
  </div>`;
}

function renderCalendarYear() {
  const year = calendarCursor.getFullYear();
  const yearStart = new Date(year, 0, 1, 12);
  const yearEnd = new Date(year + 1, 0, 1, 12);
  const today = todayISO();
  const weekdays = calendarWeekdayLabels('narrow');
  const scheduled = calendarTodos();
  const notes = calendarNotes();
  const todosByDate = calendarTodosByDate(scheduled, yearStart, yearEnd);
  const notesByDate = calendarNotesByDate(notes, yearStart, yearEnd);
  const monthItemIds = Array.from({ length:12 }, () => new Set());
  todosByDate.forEach((todos, iso) => {
    const date = calendarDate(iso);
    todos.forEach(item => monthItemIds[date.getMonth()].add(item.id));
  });
  notesByDate.forEach((createdNotes, iso) => {
    const date = calendarDate(iso);
    createdNotes.forEach(item => monthItemIds[date.getMonth()].add(item.id));
  });
  const monthCounts = monthItemIds.map(ids => ids.size);
  return `<div class="calendar-year-view">${Array.from({ length:12 }, (_, month) => {
    const monthStart = new Date(year, month, 1, 12);
    const gridStart = calendarStartOfWeek(monthStart);
    const monthLabel = new Intl.DateTimeFormat(calendarLocale(), { month:'long' }).format(monthStart);
    const days = Array.from({ length:42 }, (_, index) => {
      const date = calendarAddDays(gridStart, index);
      if (date.getMonth() !== month) return '<span class="calendar-mini-day is-empty"></span>';
      const iso = calendarDateISO(date);
      const todos = todosByDate.get(iso) || [];
      const createdNotes = notesByDate.get(iso) || [];
      const itemCount = todos.length + createdNotes.length;
      const linkedCount = todos.filter(item => calendarLinkedNotes(item).length).length;
      return `<button type="button" class="calendar-mini-day ${iso === today ? 'is-today' : ''} ${todos.length ? 'has-todos' : ''} ${createdNotes.length ? 'has-notes' : ''} ${linkedCount ? 'has-links' : ''}" data-calendar-date="${iso}" title="${escapeHTML(`${date.getDate()} · ${itemCount} ${t('calendarItems')}`)}"><span>${date.getDate()}</span>${itemCount ? `<i>${itemCount}</i>` : ''}</button>`;
    }).join('');
    return `<section class="calendar-year-month" data-calendar-year-month="${calendarDateISO(monthStart)}"><header><button type="button" data-calendar-month="${calendarDateISO(monthStart)}">${escapeHTML(monthLabel)}</button><span>${monthCounts[month] || ''}</span></header><div class="calendar-mini-weekdays">${weekdays.map(label => `<span>${escapeHTML(label)}</span>`).join('')}</div><div class="calendar-mini-grid">${days}</div></section>`;
  }).join('')}</div><div class="calendar-legend"><span><i class="has-todos"></i>${escapeHTML(t('scheduledTodos'))}</span><span><i class="has-notes"></i>${escapeHTML(t('createdNotes'))}</span><span><i class="has-links"></i>${escapeHTML(t('calendarLegendLinked'))}</span></div>`;
}

function renderCalendar() {
  if (calendarViewMode === 'year') return renderCalendarYear();
  if (calendarViewMode === 'week') return renderCalendarWeek();
  if (calendarViewMode === 'day') return renderCalendarDay();
  return renderCalendarMonth();
}

function playCalendarTransition(list) {
  if (!calendarMotion) return;
  clearTimeout(calendarMotionTimer);
  list.classList.remove('calendar-is-animating');
  list.dataset.calendarMotion = calendarMotion;
  calendarMotion = '';
  void list.offsetWidth;
  list.classList.add('calendar-is-animating');
  calendarMotionTimer = setTimeout(() => {
    list.classList.remove('calendar-is-animating');
    delete list.dataset.calendarMotion;
  }, 480);
}

function alignMobileWeek(list) {
  if (calendarViewMode !== 'week' || !matchMedia('(max-width: 800px)').matches) return;
  const week = list.querySelector('.calendar-week-view');
  requestAnimationFrame(() => {
    const selectedDate = calendarDateISO(calendarCursor);
    const selectedDay = list.querySelector(`.calendar-week-day[data-calendar-day="${selectedDate}"]`) || list.querySelector('.calendar-week-day.is-today');
    if (!selectedDay || !week) return;
    week.scrollLeft = Math.max(0, selectedDay.offsetLeft - (week.clientWidth - selectedDay.clientWidth) / 2);
  });
}

function syncCalendarShell() {
  const active = currentView === 'calendar';
  document.body.classList.toggle('calendar-view', active);
  document.body.classList.toggle('calendar-week-active', active && calendarViewMode === 'week');
  document.body.classList.toggle('inbox-view', currentView === 'inbox');
  document.body.classList.toggle('stats-view', currentView === 'stats');
  document.body.classList.toggle('trash-view', currentView === 'trash');
  const toolbar = $('#calendarToolbar');
  if (toolbar) {
    toolbar.hidden = !active;
    $$('[data-calendar-mode]', toolbar).forEach(button => {
      const selected = button.dataset.calendarMode === calendarViewMode;
      button.classList.toggle('active', selected);
      button.setAttribute('aria-pressed', String(selected));
    });
    [-1, 1].forEach(direction => {
      const button = $(`[data-calendar-shift="${direction}"]`, toolbar);
      if (!button) return;
      const label = t(calendarShiftKey(direction));
      button.title = label;
      button.setAttribute('aria-label', label);
      $('[data-calendar-shift-label]', button).textContent = label;
    });
    $('[data-calendar-today]', toolbar)?.setAttribute('aria-label', t('backToToday'));
    $('.calendar-navigation', toolbar)?.setAttribute('aria-label', t('calendarNavigation'));
    $('.calendar-view-switch', toolbar)?.setAttribute('aria-label', t('calendarViewOptions'));
  }
}

function translateStaticUI() {
  document.documentElement.lang = settings.language === 'zh' ? 'zh-CN' : 'en';
  $$('[data-i18n]').forEach(node => node.textContent = t(node.dataset.i18n));
  $$('[data-i18n-placeholder]').forEach(node => node.placeholder = t(node.dataset.i18nPlaceholder));
  $$('[data-i18n-title]').forEach(node => node.title = t(node.dataset.i18nTitle));
}

function viewTitle() {
  if (currentView.startsWith('folder:')) return folderName(getFolder(currentView.split(':')[1]));
  return ({ inbox: t('inbox'), today: t('viewToday'), todos: t('viewTodos'), notes: t('viewNotes'), calendar: t('calendar'), trash: t('trash'), stats: t('stats') })[currentView];
}

function listViewContext() {
  if (currentView === 'calendar') return 'calendar';
  if (currentView === 'stats' || currentView === 'trash') return currentView;
  if (['today', 'todos'].includes(currentView)) return 'todo';
  if (currentView === 'notes') return 'note';
  return 'mixed';
}

function listFilterContext() {
  const viewContext = listViewContext();
  return viewContext === 'mixed' && ['todo', 'note'].includes(currentFilter) ? currentFilter : viewContext;
}

function resetListFilters(context = 'all') {
  if (context === 'all' || context === 'mixed') currentFilter = 'all';
  if (context === 'all' || context === 'todo') {
    todoPriorityFilter = 'all';
    todoDueFilter = 'all';
    todoFolderFilter = 'all';
  }
  if (context === 'all' || context === 'note') {
    noteFolderFilter = 'all';
    noteRelationFilter = 'all';
    noteUpdatedFilter = 'all';
  }
}

function hasActiveListFilters(context = listFilterContext()) {
  if (['calendar', 'stats', 'trash'].includes(context)) return false;
  if (context === 'mixed') return currentFilter !== 'all';
  if (context === 'todo') return [todoPriorityFilter, todoDueFilter, todoFolderFilter].some(value => value !== 'all');
  return [noteFolderFilter, noteRelationFilter, noteUpdatedFilter].some(value => value !== 'all');
}

function syncFolderFilter(select, selectedValue) {
  if (!select) return;
  select.innerHTML = [
    `<option value="all">${escapeHTML(t('allFolders'))}</option>`,
    ...library.folders.map(folder => `<option value="${escapeHTML(folder.id)}">${escapeHTML(folderName(folder))}</option>`)
  ].join('');
  select.value = selectedValue;
}

function syncListFilterUI() {
  const row = $('#listFilterRow') || $('.filter-row');
  if (!row) return;
  const viewContext = listViewContext();
  const context = listFilterContext();
  const folderIds = new Set(library.folders.map(folder => folder.id));
  if (todoFolderFilter !== 'all' && !folderIds.has(todoFolderFilter)) todoFolderFilter = 'all';
  if (noteFolderFilter !== 'all' && !folderIds.has(noteFolderFilter)) noteFolderFilter = 'all';

  row.dataset.filterContext = context;
  row.dataset.filterView = viewContext;
  $$('[data-filter-context]', row).forEach(group => {
    group.hidden = group.dataset.filterContext === 'mixed'
      ? viewContext !== 'mixed'
      : group.dataset.filterContext !== context;
  });
  $$('[data-filter]', row).forEach(button => button.classList.toggle('active', button.dataset.filter === currentFilter));

  const values = {
    todoPriorityFilter, todoDueFilter, todoFolderFilter,
    noteFolderFilter, noteRelationFilter, noteUpdatedFilter
  };
  syncFolderFilter($('#todoFolderFilter'), todoFolderFilter);
  syncFolderFilter($('#noteFolderFilter'), noteFolderFilter);
  Object.entries(values).forEach(([id, value]) => {
    const select = $(`#${id}`);
    if (!select) return;
    select.value = value;
    select.closest('.filter-select')?.classList.toggle('is-active', value !== 'all');
  });

  const sortSelect = $('#listSortOrder');
  if (sortSelect) {
    sortSelect.value = listSortMode;
    sortSelect.closest('.filter-select')?.classList.toggle('is-active', listSortMode !== 'updated');
  }

  const labels = {
    todoPriorityFilter:'filterByPriority', todoDueFilter:'filterByDeadline', todoFolderFilter:'filterByFolder',
    noteFolderFilter:'filterByFolder', noteRelationFilter:'filterByRelation', noteUpdatedFilter:'filterByUpdated',
    listSortOrder:'sortBy'
  };
  Object.entries(labels).forEach(([id, key]) => {
    const select = $(`#${id}`);
    select?.setAttribute('aria-label', t(key));
    select?.setAttribute('title', t(key));
  });

  const completedToggle = $('#todoCompletedToggle');
  if (completedToggle) {
    completedToggle.hidden = currentView !== 'todos' && !currentView.startsWith('folder:');
    completedToggle.classList.toggle('is-active', settings.showCompletedTodos);
    const box = $('#todoShowCompleted');
    if (box) box.checked = settings.showCompletedTodos;
  }

  const clearButton = $('#clearListFilters');
  if (clearButton) {
    clearButton.hidden = !hasActiveListFilters(context);
    clearButton.title = t('clearFilters');
    clearButton.setAttribute('aria-label', t('clearFilters'));
  }
}

function getVisibleItems() {
  let items = currentView === 'trash' ? trashedItems() : activeItems();
  if (currentView === 'calendar') items = items.filter(item => (item.type === 'todo' && todoIsScheduled(item)) || item.type === 'note');
  if (currentView === 'inbox') items = items.filter(item => !isTodoComplete(item) || pendingSink.has(item.id));
  if (currentView === 'today') items = items.filter(item => item.type === 'todo' && todoScheduleDate(item) === todayISO() && (!isTodoComplete(item) || pendingSink.has(item.id)));
  if (currentView === 'todos') items = items.filter(item => item.type === 'todo' && (settings.showCompletedTodos || !isTodoComplete(item) || pendingSink.has(item.id)));
  if (currentView === 'notes') items = items.filter(item => item.type === 'note');
  if (currentView.startsWith('folder:')) items = items.filter(item => item.folderId === currentView.split(':')[1]
    && (item.type === 'note' || settings.showCompletedTodos || !isTodoComplete(item) || pendingSink.has(item.id)));
  const viewContext = listViewContext();
  const filterContext = listFilterContext();
  if (viewContext === 'mixed' && currentFilter !== 'all') items = items.filter(item => item.type === currentFilter);
  if (filterContext === 'todo') {
    if (todoPriorityFilter !== 'all') items = items.filter(item => item.priority === todoPriorityFilter);
    if (todoFolderFilter !== 'all') items = items.filter(item => item.folderId === todoFolderFilter);
    if (todoDueFilter !== 'all') {
      const today = todayISO();
      const upcoming = daysFromToday(7);
      items = items.filter(item => {
        const dueDate = todoDueDateISO(item);
        if (todoDueFilter === 'none') return !dueDate;
        if (!dueDate) return false;
        if (todoDueFilter === 'overdue') return dueDate < today;
        if (todoDueFilter === 'today') return dueDate === today;
        return dueDate > today && dueDate <= upcoming;
      });
    }
  }
  if (filterContext === 'note') {
    if (noteFolderFilter !== 'all') items = items.filter(item => item.folderId === noteFolderFilter);
    if (noteRelationFilter !== 'all') {
      items = items.filter(item => noteRelationFilter === 'linked' ? getLinkedItems(item).length > 0 : getLinkedItems(item).length === 0);
    }
    if (noteUpdatedFilter !== 'all') {
      const cutoff = Date.now() - Number(noteUpdatedFilter) * 86400000;
      items = items.filter(item => {
        const updatedAt = Date.parse(item.updatedAt);
        return Number.isFinite(updatedAt) && updatedAt >= cutoff;
      });
    }
  }
  if (searchQuery && currentView !== 'calendar') {
    const query = searchQuery.toLocaleLowerCase();
    items = items.filter(item => {
      const content = item.type === 'note' ? stripHTML(item.body) : `${item.notes || ''} ${(item.tasks || []).map(task => task.text).join(' ')}`;
      const linkedTitles = getLinkedItems(item).map(linked => linked.title).join(' ');
      return `${item.title} ${content} ${linkedTitles} ${(item.tags || []).join(' ')}`.toLocaleLowerCase().includes(query);
    });
  }
  const taskFocused = currentView === 'today' || currentView === 'todos' || currentView === 'calendar' || currentFilter === 'todo';
  const sortByDueThenPriority = (a, b) => {
    const dueDifference = String(a.dueAt || '9999-12-31').localeCompare(String(b.dueAt || '9999-12-31'));
    if (dueDifference) return dueDifference;
    return priorityRank(a.priority) - priorityRank(b.priority);
  };
  const listSortComparers = {
    updated: (a, b) => {
      if (a.type === 'todo' && b.type === 'todo') {
        const priorityDifference = priorityRank(a.priority) - priorityRank(b.priority);
        if (priorityDifference) return priorityDifference;
        const dueDifference = String(a.dueAt || '9999-12-31').localeCompare(String(b.dueAt || '9999-12-31'));
        if (dueDifference) return dueDifference;
      }
      return new Date(b.updatedAt) - new Date(a.updatedAt);
    },
    created: (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
    due: (a, b) => {
      if (a.type !== b.type) return a.type === 'todo' ? -1 : 1;
      if (a.type === 'todo') {
        const scheduledDifference = sortByDueThenPriority(a, b);
        if (scheduledDifference) return scheduledDifference;
      }
      return new Date(b.updatedAt) - new Date(a.updatedAt);
    },
    priority: (a, b) => {
      if (a.type !== b.type) return a.type === 'todo' ? -1 : 1;
      if (a.type === 'todo') {
        const priorityDifference = priorityRank(a.priority) - priorityRank(b.priority);
        if (priorityDifference) return priorityDifference;
        const dueDifference = String(a.dueAt || '9999-12-31').localeCompare(String(b.dueAt || '9999-12-31'));
        if (dueDifference) return dueDifference;
      }
      return new Date(b.updatedAt) - new Date(a.updatedAt);
    },
    title: (a, b) => String(a.title || '').localeCompare(String(b.title || ''), undefined, { numeric: true })
  };
  const compareBySortMode = listSortComparers[listSortMode] || ((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  if (currentView === 'trash') return items;
  // 置底等待期间沿用冻结顺序：完成瞬间触碰了 updatedAt，若按正常比较器排序，
  // 待办会在延迟期间跳到未完成区的顶部而不是原地停留。
  if (pendingSink.size && sinkContext.view === currentView && sinkContext.filter === currentFilter && sinkFrozenOrder.length) {
    const orderIndex = new Map(sinkFrozenOrder.map((id, index) => [id, index]));
    return items.sort((a, b) => {
      const aIndex = orderIndex.get(a.id);
      const bIndex = orderIndex.get(b.id);
      if (aIndex !== undefined || bIndex !== undefined) {
        return (aIndex ?? Number.MAX_SAFE_INTEGER) - (bIndex ?? Number.MAX_SAFE_INTEGER);
      }
      return compareBySortMode(a, b);
    });
  }
  return items.sort((a, b) => {
    if (taskFocused && a.type === 'todo' && b.type === 'todo') {
      const completionDifference = Number(isTodoComplete(a)) - Number(isTodoComplete(b));
      if (completionDifference) return completionDifference;
    }
    return compareBySortMode(a, b);
  });
}

function renderSidebar() {
  $('#inboxCount').textContent = activeItems().filter(item => !isTodoComplete(item)).length;
  $('#todoCount').textContent = activeItems().filter(item => item.type === 'todo' && !isTodoComplete(item)).length;
  $('#noteCount').textContent = activeItems().filter(item => item.type === 'note').length;
  $('#calendarCount').textContent = calendarTodos().length + calendarNotes().length;
  $('#trashCount').textContent = trashedItems().length;

  $$('#smartNav button').forEach(button => button.classList.toggle('active', button.dataset.view === currentView));
  $('#folderNav').innerHTML = library.folders.map(folder => {
    const count = activeItems().filter(item => item.folderId === folder.id).length;
    const shortName = folderShortName(folder);
    const shortNameClasses = ['folder-short-name', folderShortNameUsesEmoji(shortName) ? 'is-emoji' : '', folderShortSegments(shortName).length > 2 ? 'is-long' : ''].filter(Boolean).join(' ');
    return `<button data-view="folder:${escapeHTML(folder.id)}" class="${currentView === `folder:${folder.id}` ? 'active' : ''}" title="${escapeHTML(folderName(folder))}" aria-label="${escapeHTML(folderName(folder))}">
      <span><i class="folder-dot" style="background:${escapeHTML(folder.color)};color:${escapeHTML(folder.color)}"><b class="${shortNameClasses}">${escapeHTML(shortName)}</b></i><span>${escapeHTML(folderName(folder))}</span></span><em>${count}</em>
    </button>`;
  }).join('');

}

function itemPreview(item) {
  if (item.type === 'note') return stripHTML(item.body) || t('notePlaceholder');
  const open = (item.tasks || []).filter(task => !task.done).map(task => task.text).filter(Boolean);
  return open[0] || item.notes || (isTodoComplete(item) ? t('done') : t('taskPlaceholder'));
}

const statsRangePresets = ['all', 'today', '7', '30', '90', 'custom'];
const statsSelection = new Set();

// createdAt is a UTC ISO string; slicing it would put items created before the UTC
// offset (e.g. UTC+8 mornings) on the previous day. Stats group by local calendar day.
const statsDateKey = item => {
  const raw = validDate(item.createdAt);
  return raw ? calendarDateISO(new Date(raw)) : '';
};

// Drop ids that no longer belong to the current period/library so the toolbar count,
// the checkboxes and the exported picture always describe the same selection.
const pruneStatsSelection = () => {
  const collected = new Set(statsCollectionItems().map(item => item.id));
  [...statsSelection].forEach(id => { if (!collected.has(id)) statsSelection.delete(id); });
};

function statsRangeWindow() {
  const range = statsRangePresets.includes(settings.statsRange) ? settings.statsRange : 'all';
  const today = todayISO();
  if (range === 'today') return [today, today];
  if (range === '7' || range === '30' || range === '90') return [daysFromToday(-(Number(range) - 1)), today];
  if (range === 'custom') {
    const start = validDate(settings.statsRangeStart) ? settings.statsRangeStart.slice(0, 10) : '';
    const end = validDate(settings.statsRangeEnd) ? settings.statsRangeEnd.slice(0, 10) : '';
    if (start || end) return [start, end];
  }
  return [null, null];
}

function statsRangeLabel() {
  const [start, end] = statsRangeWindow();
  const range = statsRangePresets.includes(settings.statsRange) ? settings.statsRange : 'all';
  if (range === 'today') return t('statsRangeToday');
  if (range === '7' || range === '30' || range === '90') return t(`statsRange${range}`);
  if (range === 'custom') return `${start || '…'} — ${end || '…'}`;
  return t('statsRangeAll');
}

function statsCollectionItems() {
  const [start, end] = statsRangeWindow();
  return activeItems().filter(item => {
    const key = statsDateKey(item);
    if (!key) return false;
    if (start && key < start) return false;
    if (end && key > end) return false;
    return true;
  }).sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
}

function statsGroupLabel(dateKey) {
  if (dateKey === todayISO()) return t('statsGroupToday');
  if (dateKey === daysFromToday(-1)) return t('yesterday');
  return new Intl.DateTimeFormat(calendarLocale(), { month:'long', day:'numeric', weekday:'short' }).format(new Date(`${dateKey}T12:00:00`));
}

function statsItemRow(item, index) {
  const folder = getFolder(item.folderId);
  const checked = statsSelection.has(item.id);
  const done = item.type === 'todo' && isTodoComplete(item);
  const title = item.title || (item.type === 'todo' ? t('untitledTodo') : t('untitledNote'));
  // 完整子待办：逐条列出、不截断；没有子任务时回退到原有的单行预览。
  const tasks = item.type === 'todo' ? (item.tasks || []).filter(task => String(task.text || '').trim()) : [];
  const subtasks = tasks.length ? `<ul class="stats-subtasks">${tasks.map(task => `<li class="${task.done ? 'is-done' : ''}"><i aria-hidden="true"><svg><use href="#i-check"/></svg></i><span>${escapeHTML(task.text)}</span></li>`).join('')}</ul>` : '';
  const preview = tasks.length ? '' : `<small><span class="mini-folder"><i class="folder-dot" style="background:${escapeHTML(folder?.color || '#999')}"></i>${escapeHTML(folderName(folder))}</span>${escapeHTML(itemPreview(item).slice(0, 80))}</small>`;
  return `<div class="stats-item-row ${checked ? 'is-checked' : ''}" data-stats-row="${escapeHTML(item.id)}" style="animation-delay:${Math.min(index * 16, 90)}ms">
    <label class="stats-item-check" title="${escapeHTML(t('statsCheckItem'))}">
      <input type="checkbox" data-stats-check="${escapeHTML(item.id)}" ${checked ? 'checked' : ''}/>
      <i aria-hidden="true"><svg><use href="#i-check"/></svg></i>
    </label>
    <button type="button" class="stats-item-open" data-stats-open="${escapeHTML(item.id)}">
      <span class="stats-item-topline"><span class="type-pill ${item.type}"><svg><use href="#i-${item.type === 'todo' ? 'check' : 'note'}"/></svg>${t(item.type)}${item.type === 'todo' ? ` · ${done ? t('done') : t('statOpen')}` : ''}</span><time datetime="${escapeHTML(item.createdAt)}">${escapeHTML(formatListDateTime(item.createdAt))}</time></span>
      <b>${escapeHTML(title)}</b>
      ${subtasks}
      ${preview || (tasks.length ? `<small><span class="mini-folder"><i class="folder-dot" style="background:${escapeHTML(folder?.color || '#999')}"></i>${escapeHTML(folderName(folder))}</span></small>` : '')}
    </button>
  </div>`;
}

function renderStatsToolbar(selectedCount) {
  return `<section class="stats-toolbar">
    <label class="filter-select stats-range-field">
      <svg><use href="#i-clock"/></svg>
      <select id="statsRange" aria-label="${escapeHTML(t('statsListTitle'))}">
        <option value="all">${escapeHTML(t('statsRangeAll'))}</option>
        <option value="today">${escapeHTML(t('statsRangeToday'))}</option>
        <option value="7">${escapeHTML(t('statsRange7'))}</option>
        <option value="30">${escapeHTML(t('statsRange30'))}</option>
        <option value="90">${escapeHTML(t('statsRange90'))}</option>
        <option value="custom">${escapeHTML(t('statsRangeCustom'))}</option>
      </select>
    </label>
    <div class="stats-custom-range" id="statsCustomRange" ${settings.statsRange === 'custom' ? '' : 'hidden'}>
      <input type="date" id="statsRangeStart" value="${escapeHTML(settings.statsRangeStart || '')}" aria-label="${escapeHTML(t('statsCustomStart'))}"/>
      <i aria-hidden="true">—</i>
      <input type="date" id="statsRangeEnd" value="${escapeHTML(settings.statsRangeEnd || '')}" aria-label="${escapeHTML(t('statsCustomEnd'))}"/>
    </div>
    <div class="stats-toolbar-actions">
      <span class="stats-selection-count" id="statsSelectionCount">${escapeHTML(t('statsSelectedCount').replace('{0}', selectedCount))}</span>
      <button type="button" class="stats-tool-button" id="statsSelectAll">${escapeHTML(t('statsSelectAll'))}</button>
      <button type="button" class="stats-tool-button" id="statsClearSelection">${escapeHTML(t('statsClearSelection'))}</button>
      <button type="button" class="stats-tool-button is-primary" id="statsMakeImage"><svg><use href="#i-image"/></svg>${escapeHTML(t('statsMakeImage'))}</button>
    </div>
  </section>`;
}

function renderStats() {
  const items = statsCollectionItems();
  const selectedCount = items.filter(item => statsSelection.has(item.id)).length;
  if (!items.length) {
    // Keep the toolbar rendered so the period picker stays reachable on empty ranges.
    return `<div class="stats-collection-wrap">
      ${renderStatsToolbar(selectedCount)}
      <div class="stats-empty"><div><span><svg><use href="#i-chart"/></svg></span><h3>${escapeHTML(t('statsListTitle'))}</h3><p>${escapeHTML(t('statsEmptyRange'))}</p></div></div>
    </div>`;
  }
  const groups = new Map();
  items.forEach(item => {
    const key = statsDateKey(item);
    if (!key) return;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(item);
  });
  let rowIndex = 0;
  const groupsMarkup = [...groups.entries()].map(([key, groupItems]) => `
    <section class="stats-day-group">
      <header class="stats-day-head"><b>${escapeHTML(statsGroupLabel(key))}</b><span>${escapeHTML(key)} · ${groupItems.length} ${t('item')}</span></header>
      ${groupItems.map(item => statsItemRow(item, rowIndex++)).join('')}
    </section>`).join('');
  return `<div class="stats-collection-wrap">
    ${renderStatsToolbar(selectedCount)}
    <div class="stats-collection">${groupsMarkup}</div>
    <p class="stats-collection-hint">${escapeHTML(t('statsListHint'))}</p>
  </div>`;
}

function syncStatsSelectionCount() {
  const counter = $('#statsSelectionCount');
  if (!counter) return;
  const selectedCount = statsCollectionItems().filter(item => statsSelection.has(item.id)).length;
  counter.textContent = t('statsSelectedCount').replace('{0}', selectedCount);
}

function bindStatsView() {
  const range = $('#statsRange');
  if (!range) return;
  range.value = statsRangePresets.includes(settings.statsRange) ? settings.statsRange : 'all';
  range.addEventListener('change', () => {
    settings.statsRange = statsRangePresets.includes(range.value) ? range.value : 'all';
    pruneStatsSelection();
    persist();
    renderList();
  });
  [['statsRangeStart', 'statsRangeStart'], ['statsRangeEnd', 'statsRangeEnd']].forEach(([id, key]) => {
    $(`#${id}`)?.addEventListener('change', event => {
      settings[key] = event.target.value;
      pruneStatsSelection();
      persist();
      renderList();
    });
  });
  $('#statsSelectAll')?.addEventListener('click', () => {
    statsCollectionItems().forEach(item => statsSelection.add(item.id));
    $$('.stats-item-row').forEach(row => row.classList.add('is-checked'));
    $$('.stats-item-check input').forEach(box => { box.checked = true; });
    syncStatsSelectionCount();
  });
  $('#statsClearSelection')?.addEventListener('click', () => {
    statsSelection.clear();
    $$('.stats-item-row').forEach(row => row.classList.remove('is-checked'));
    $$('.stats-item-check input').forEach(box => { box.checked = false; });
    syncStatsSelectionCount();
  });
  $('#statsMakeImage')?.addEventListener('click', () => exportStatsImage());
  $$('.stats-item-check input').forEach(box => box.addEventListener('change', () => {
    if (box.checked) statsSelection.add(box.dataset.statsCheck);
    else statsSelection.delete(box.dataset.statsCheck);
    box.closest('.stats-item-row')?.classList.toggle('is-checked', box.checked);
    syncStatsSelectionCount();
  }));
  $$('.stats-item-open').forEach(button => button.addEventListener('click', () => openItem(button.dataset.statsOpen)));
}

function themeCanvasColors() {
  const style = getComputedStyle(document.documentElement);
  const pick = (name, fallback) => style.getPropertyValue(name).trim() || fallback;
  return {
    paper: pick('--paper', '#fbfaf6'),
    ink: pick('--ink', '#242823'),
    muted: pick('--muted', '#6b6f66'),
    faint: pick('--faint', '#9aa094'),
    line: pick('--line', '#e3e2da'),
    card: pick('--white', '#ffffff'),
    todoAccent: pick('--todo-accent', '#4f86a8'),
    todoSoft: pick('--todo-soft', '#dceef8'),
    noteAccent: pick('--note-accent', '#987329'),
    noteSoft: pick('--note-soft', '#fff0bd')
  };
}

const STATS_CANVAS_MAX_HEIGHT = 14000;

if (typeof CanvasRenderingContext2D !== 'undefined' && !CanvasRenderingContext2D.prototype.roundRect) {
  CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r) {
    const radius = Math.min(r, w / 2, h / 2);
    this.moveTo(x + radius, y);
    this.arcTo(x + w, y, x + w, y + h, radius);
    this.arcTo(x + w, y + h, x, y + h, radius);
    this.arcTo(x, y + h, x, y, radius);
    this.arcTo(x, y, x + w, y, radius);
    this.closePath();
    return this;
  };
}

function canvasTruncateText(ctx, text, maxWidth) {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let truncated = String(text);
  while (truncated.length > 1 && ctx.measureText(`${truncated}…`).width > maxWidth) truncated = truncated.slice(0, -1);
  return `${truncated}…`;
}

function renderStatsCanvas(items) {
  const colors = themeCanvasColors();
  const width = 1080;
  const margin = 84;
  const fontFamily = '"PingFang SC","Hiragino Sans GB","Microsoft YaHei",system-ui,sans-serif';
  const measure = document.createElement('canvas').getContext('2d');
  measure.font = `650 30px ${fontFamily}`;

  const groups = new Map();
  items.forEach(item => {
    const key = statsDateKey(item);
    if (!key) return;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(item);
  });

  const layout = [];
  let height = margin + 96 + 44 + 36;
  const limit = STATS_CANVAS_MAX_HEIGHT - margin - 120;
  let omitted = 0;
  groups.forEach((groupItems, key) => {
    if (height >= limit) { omitted += groupItems.length; return; }
    height += 30 + 52;
    layout.push({ type:'group', key, count:groupItems.length });
    groupItems.forEach(item => {
      if (height >= limit) { omitted += 1; return; }
      const title = item.title || (item.type === 'todo' ? t('untitledTodo') : t('untitledNote'));
      const folder = getFolder(item.folderId);
      const meta = [folderName(folder), formatListDateTime(item.createdAt)].filter(Boolean).join(' · ');
      const preview = stripHTML(item.type === 'note' ? item.body : item.notes || '') || '';
      measure.font = `650 30px ${fontFamily}`;
      const titleWidth = width - margin * 2 - 118 - 24;
      const titleLines = canvasTruncateText(measure, title, titleWidth);
      measure.font = `400 22px ${fontFamily}`;
      const metaWidth = width - margin * 2 - 118 - 24;
      const metaLines = meta ? [canvasTruncateText(measure, meta, metaWidth)] : [];
      const previewLines = preview ? [canvasTruncateText(measure, preview.replace(/\s+/g, ' ').trim(), metaWidth)] : [];
      const rowHeight = 34 + (titleLines ? 42 : 0) + (metaLines.length ? 32 : 0) + (previewLines.length ? 30 : 0) + 26;
      height += rowHeight;
      layout.push({ type:'item', item, title:titleLines, meta, metaLines, previewLines, height:rowHeight });
    });
  });
  height = Math.min(height + 150, STATS_CANVAS_MAX_HEIGHT);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = Math.round(height);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = colors.paper;
  ctx.fillRect(0, 0, width, canvas.height);
  ctx.textBaseline = 'alphabetic';

  let y = margin;
  ctx.fillStyle = colors.ink;
  ctx.font = `700 56px ${fontFamily}`;
  ctx.fillText('Acta · 行记', margin, y + 56);
  ctx.fillStyle = colors.faint;
  ctx.font = `600 26px ${fontFamily}`;
  const todoCount = items.filter(item => item.type === 'todo').length;
  const summary = `${statsRangeLabel()} · ${items.length} ${t('item')}（${todoCount} ${t('todo')} · ${items.length - todoCount} ${t('note')}）`;
  ctx.fillText(canvasTruncateText(ctx, summary, width - margin * 2), margin, y + 104);
  y += 140;
  ctx.strokeStyle = colors.line;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(margin, y);
  ctx.lineTo(width - margin, y);
  ctx.stroke();
  y += 30;

  layout.forEach(entry => {
    if (entry.type === 'group') {
      ctx.fillStyle = colors.faint;
      ctx.font = `700 26px ${fontFamily}`;
      ctx.fillText(`${statsGroupLabel(entry.key)} · ${entry.key}`, margin, y + 34);
      y += 52;
      return;
    }
    const item = entry.item;
    const isTodo = item.type === 'todo';
    const done = isTodo && isTodoComplete(item);
    const badge = { x:margin, y:y + 6, w:118, h:40 };
    ctx.fillStyle = isTodo ? colors.todoSoft : colors.noteSoft;
    ctx.beginPath();
    ctx.roundRect(badge.x, badge.y, badge.w, badge.h, 12);
    ctx.fill();
    ctx.fillStyle = isTodo ? colors.todoAccent : colors.noteAccent;
    ctx.font = `700 21px ${fontFamily}`;
    const badgeText = isTodo ? (done ? `✓ ${t('done')}` : t('todo')) : t('note');
    const badgeWidth = ctx.measureText(badgeText).width;
    ctx.fillText(badgeText, badge.x + (badge.w - badgeWidth) / 2, badge.y + 27);
    const textX = margin + 118 + 24;
    let textY = y + 30;
    ctx.fillStyle = done ? colors.faint : colors.ink;
    ctx.font = `650 30px ${fontFamily}`;
    ctx.fillText(entry.title, textX, textY);
    if (done) {
      const titleWidth = ctx.measureText(entry.title).width;
      ctx.strokeStyle = colors.faint;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(textX, textY - 10);
      ctx.lineTo(textX + titleWidth, textY - 10);
      ctx.stroke();
    }
    textY += 42;
    ctx.font = `400 22px ${fontFamily}`;
    ctx.fillStyle = colors.muted;
    if (entry.metaLines.length) {
      ctx.fillText(entry.metaLines[0], textX, textY);
      textY += 32;
    }
    if (entry.previewLines.length) {
      ctx.fillStyle = colors.faint;
      ctx.fillText(entry.previewLines[0], textX, textY);
      textY += 30;
    }
    y += entry.height;
  });

  if (omitted > 0) {
    ctx.fillStyle = colors.faint;
    ctx.font = `600 22px ${fontFamily}`;
    ctx.fillText(t('moreTodos').replace('{0}', omitted), margin, y + 30);
    y += 46;
  }

  ctx.fillStyle = colors.faint;
  ctx.font = `500 22px ${fontFamily}`;
  ctx.fillText(`${formatDateTimeSeconds(new Date().toISOString())} · Acta 行记`, margin, canvas.height - margin / 1.6);
  return canvas;
}

async function saveExportAssets(assets) {
  if (window.actaDesktop?.exportAssets) return window.actaDesktop.exportAssets(assets);
  const nativeExport = window.Capacitor?.Plugins?.ActaSync?.exportAsset;
  if (nativeExport) {
    const results = [];
    for (const asset of assets) results.push(await nativeExport(asset));
    return results;
  }
  assets.forEach((asset, index) => {
    const [header, data] = asset.dataUrl.split(',');
    const mimeType = /data:([^;]+)/.exec(header)?.[1] || asset.mimeType;
    const binary = atob(data);
    const bytes = new Uint8Array(binary.length);
    for (let offset = 0; offset < binary.length; offset += 1) bytes[offset] = binary.charCodeAt(offset);
    const url = URL.createObjectURL(new Blob([bytes], { type:mimeType }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = asset.fileName;
    anchor.hidden = true;
    document.body.appendChild(anchor);
    setTimeout(() => {
      anchor.click();
      anchor.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1200);
    }, index * 140);
  });
  return assets;
}

async function exportStatsImage() {
  const items = statsCollectionItems().filter(item => statsSelection.has(item.id));
  if (!items.length) {
    showToast(t('statsNeedSelection'));
    return;
  }
  try {
    const canvas = renderStatsCanvas(items);
    const stamp = todayISO();
    const asset = { fileName:`Acta ${t('statsListTitle')} ${stamp}.png`, mimeType:'image/png', dataUrl:canvas.toDataURL('image/png') };
    const saved = await saveExportAssets([asset]);
    if (saved) showToast(t('statsImageDone'));
  } catch (error) {
    showToast(`${t('statsImageFailed')}: ${error?.message || error}`);
  }
}

function renderTrashList(items) {
  return `<div class="trash-tools">
      <span class="trash-note">${escapeHTML(t('trashFooterNote'))}</span>
      <button type="button" class="stats-tool-button" id="emptyTrashButton"><svg><use href="#i-trash"/></svg>${escapeHTML(t('emptyTrash'))}</button>
    </div>
    ${items.map((item, index) => {
      const folder = getFolder(item.folderId);
      return `<div class="trash-card ${item.type === 'todo' ? 'is-todo' : 'is-note'}" data-trash-card="${escapeHTML(item.id)}" style="animation-delay:${Math.min(index * 18, 100)}ms">
        <span class="type-pill ${item.type}"><svg><use href="#i-${item.type === 'todo' ? 'check' : 'note'}"/></svg>${t(item.type)}</span>
        <div class="trash-card-body">
          <b>${escapeHTML(item.title || (item.type === 'todo' ? t('untitledTodo') : t('untitledNote')))}</b>
          <small><span class="mini-folder"><i class="folder-dot" style="background:${escapeHTML(folder?.color || '#999')}"></i>${escapeHTML(folderName(folder))}</span><time datetime="${escapeHTML(item.deletedAt)}">${escapeHTML(t('deletedAt'))} ${escapeHTML(formatListDateTime(item.deletedAt))}</time></small>
        </div>
        <div class="trash-card-actions">
          <button type="button" class="trash-action is-restore" data-trash-restore="${escapeHTML(item.id)}" title="${escapeHTML(t('restoreHint'))}"><svg><use href="#i-undo"/></svg><span>${escapeHTML(t('restore'))}</span></button>
          <button type="button" class="trash-action is-destroy" data-trash-destroy="${escapeHTML(item.id)}" title="${escapeHTML(t('destroy'))}"><svg><use href="#i-trash"/></svg><span>${escapeHTML(t('destroy'))}</span></button>
        </div>
      </div>`;
    }).join('')}`;
}

function bindTrashList() {
  $('#emptyTrashButton')?.addEventListener('click', async () => {
    const items = trashedItems();
    if (!items.length) return;
    if (!await askDestroyConfirm({ itemLabel: t('emptyTrash'), message: t('emptyTrashConfirmMessage').replace('{0}', items.length) })) return;
    destroyItems(items.map(item => item.id));
    showToast(t('trashEmptied'));
  });
  $$('[data-trash-restore]').forEach(button => button.addEventListener('click', () => {
    const item = library.items.find(entry => entry.id === button.dataset.trashRestore);
    if (!item) return;
    delete item.deletedAt;
    relinkFromTrash(item);
    touchItem(item);
    renderAll();
    showToast(t('restored'));
  }));
  $$('[data-trash-destroy]').forEach(button => button.addEventListener('click', async () => {
    const item = library.items.find(entry => entry.id === button.dataset.trashDestroy);
    if (!item) return;
    const title = item.title || (item.type === 'todo' ? t('untitledTodo') : t('untitledNote'));
    if (!await askDestroyConfirm({ itemLabel: `${t(item.type)} · ${title}`, message: t('deleteDestroyHint') })) return;
    logHistory('item-destroyed', title, item.id, JSON.parse(JSON.stringify(item)));
    logHistory('item-destroyed', item.title || (item.type === 'todo' ? t('untitledTodo') : t('untitledNote')), item.id, JSON.parse(JSON.stringify(item)));
    destroyItems([item.id]);
    showToast(t('destroyed'));
  }));
}

function destroyItems(ids) {
  const idSet = new Set(ids);
  library.items.forEach(entry => { entry.linkedIds = (entry.linkedIds || []).filter(id => !idSet.has(id)); });
  library.items = library.items.filter(entry => !idSet.has(entry.id));
  idSet.forEach(id => statsSelection.delete(id));
  if (selectedId && idSet.has(selectedId)) selectedId = activeItems()[0]?.id || null;
  persist();
  renderAll();
}

// Moving an item to the trash keeps its two-way links recoverable: both sides stash
// the removed link in _trashedLinkedIds so a restore can rebuild the pair. Items
// destroyed from the trash drop out of the library, and relinkFromTrash skips ids
// that no longer resolve, so stale stashes are cleaned up lazily.
function unlinkForTrash(item) {
  const linked = (item.linkedIds || []).filter(id => id && id !== item.id);
  item._trashedLinkedIds = Array.from(new Set([...(item._trashedLinkedIds || []), ...linked]));
  item.linkedIds = [];
  linked.forEach(id => {
    const other = library.items.find(entry => entry.id === id);
    if (!other) return;
    other._trashedLinkedIds = Array.from(new Set([...(other._trashedLinkedIds || other.linkedIds || []), item.id]));
    other.linkedIds = (other.linkedIds || []).filter(entryId => entryId !== item.id);
  });
}

function relinkFromTrash(item) {
  const linked = Array.isArray(item._trashedLinkedIds) ? item._trashedLinkedIds.filter(id => id && id !== item.id) : [];
  delete item._trashedLinkedIds;
  const restored = [];
  linked.forEach(id => {
    const other = library.items.find(entry => entry.id === id);
    if (!other || other.deletedAt) return;
    restored.push(id);
    other.linkedIds = Array.from(new Set([...(other.linkedIds || []), item.id]));
    if (Array.isArray(other._trashedLinkedIds)) {
      other._trashedLinkedIds = other._trashedLinkedIds.filter(entryId => entryId !== item.id);
      if (!other._trashedLinkedIds.length) delete other._trashedLinkedIds;
    }
  });
  item.linkedIds = Array.from(new Set([...(item.linkedIds || []), ...restored]));
}

const deleteConfirmState = { dialog: null, resolve: null, mode: '', closeTimer: 0 };

function deleteConfirmDialogEl() {
  if (!deleteConfirmState.dialog) deleteConfirmState.dialog = $('#deleteConfirmDialog');
  return deleteConfirmState.dialog;
}

function reduceWindowMotion() {
  return document.body.classList.contains('acta-reduce-motion') || matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function finishDeleteConfirm(result) {
  const dialog = deleteConfirmDialogEl();
  if (!dialog?.open) return;
  const resolve = deleteConfirmState.resolve;
  deleteConfirmState.resolve = null;
  const closeNow = () => {
    clearTimeout(deleteConfirmState.closeTimer);
    deleteConfirmState.closeTimer = 0;
    if (dialog.open) dialog.close();
    dialog.classList.remove('is-closing');
    resolve?.(result);
  };
  if (reduceWindowMotion()) { closeNow(); return; }
  dialog.classList.add('is-closing');
  deleteConfirmState.closeTimer = setTimeout(closeNow, 250);
}

// Settle a still-pending confirm synchronously: openDeleteConfirm can be re-entered
// while the previous dialog is animating out, and the animation timer would otherwise
// close the new dialog or strand the old promise forever.
function settleDeleteConfirm(result) {
  const dialog = deleteConfirmDialogEl();
  const resolve = deleteConfirmState.resolve;
  deleteConfirmState.resolve = null;
  clearTimeout(deleteConfirmState.closeTimer);
  deleteConfirmState.closeTimer = 0;
  if (dialog?.open) dialog.close();
  dialog?.classList.remove('is-closing');
  resolve?.(result);
}

function openDeleteConfirm({ itemLabel, message, mode }) {
  const dialog = deleteConfirmDialogEl();
  if (!dialog) return null;
  if (deleteConfirmState.resolve || deleteConfirmState.closeTimer) settleDeleteConfirm(null);
  deleteConfirmState.mode = mode;
  $('#deleteConfirmTitle').textContent = t('deleteTitle');
  $('#deleteConfirmItem').textContent = t('deleteSubtitle').replace('{0}', itemLabel || '');
  $('#deleteConfirmMessage').textContent = message || t('deleteConfirm');
  $('#deleteChoiceTrashLabel').textContent = t('deleteTrashLabel');
  $('#deleteChoiceTrashHint').textContent = t('deleteTrashHint');
  $('#deleteChoiceDestroyLabel').textContent = t('deleteDestroyLabel');
  $('#deleteChoiceDestroyHint').textContent = t('deleteDestroyHint');
  $('#confirmDestroyAllLabel').textContent = t('destroy');
  $('#cancelDeleteConfirm').textContent = t('cancel');
  $('.delete-confirm-choices', dialog).hidden = mode !== 'item';
  $('#confirmDestroyAll').hidden = mode === 'item';
  dialog.classList.remove('is-closing');
  if (!dialog.open) dialog.showModal();
  return new Promise(resolve => { deleteConfirmState.resolve = resolve; });
}

function askItemDelete(item) {
  const title = item.title || (item.type === 'todo' ? t('untitledTodo') : t('untitledNote'));
  const label = `${t(item.type)} · ${title}`;
  return openDeleteConfirm({
    itemLabel: label,
    message: t('deleteTrashHint'),
    mode: 'item'
  }).then(choice => {
    if (choice !== 'trash') return choice;
    showToast(t('deletedToTrash'));
    return choice;
  });
}

function askDestroyConfirm({ itemLabel, message }) {
  return openDeleteConfirm({ itemLabel, message, mode: 'destroy' }).then(result => result === 'destroy');
}

function bindDeleteConfirmDialog() {
  const dialog = deleteConfirmDialogEl();
  if (!dialog) return;
  $('#deleteChoiceTrash')?.addEventListener('click', () => finishDeleteConfirm('trash'));
  $('#deleteChoiceDestroy')?.addEventListener('click', () => finishDeleteConfirm('destroy'));
  $('#confirmDestroyAll')?.addEventListener('click', () => finishDeleteConfirm('destroy'));
  $('#cancelDeleteConfirm')?.addEventListener('click', () => finishDeleteConfirm(null));
  $('#closeDeleteConfirm')?.addEventListener('click', () => finishDeleteConfirm(null));
  dialog.addEventListener('cancel', event => {
    event.preventDefault();
    finishDeleteConfirm(null);
  });
}

// 每次渲染时对比各待办的完成态：识别「未完成 → 已完成」的瞬间，在可置底的
// 列表视图（所有待办、归类的待办筛选）布置底延迟计时器；视图上下文变化或
// 撤回完成时收回等待。previousOrder 是本次渲染前卡片的 DOM 顺序。
function syncCompletedTodoSink(previousOrder) {
  const eligible = completedTodoSinkView() && completedTodoSinkEnabled() && !reduceWindowMotion();
  if (!eligible || sinkContext.view !== currentView || sinkContext.filter !== currentFilter) {
    if (pendingSink.size) {
      pendingSink.forEach(timer => clearTimeout(timer));
      pendingSink.clear();
    }
    sinkFrozenOrder = [];
    sinkContext = { view: eligible ? currentView : '', filter: eligible ? currentFilter : '' };
  }
  const liveIds = new Set();
  activeItems().forEach(item => {
    if (item.type !== 'todo') return;
    liveIds.add(item.id);
    const complete = isTodoComplete(item);
    const previouslyComplete = lastRenderCompletion.get(item.id);
    lastRenderCompletion.set(item.id, complete);
    if (!complete) {
      // 撤回完成：取消进行中的置底等待，卡片原地恢复。
      if (pendingSink.has(item.id)) {
        clearTimeout(pendingSink.get(item.id));
        pendingSink.delete(item.id);
        if (!pendingSink.size) sinkFrozenOrder = [];
      }
      return;
    }
    if (previouslyComplete === false && !pendingSink.has(item.id) && eligible
        && previousOrder.includes(item.id)) {
      // 只对当前列表里可见的卡片布置底等待（其它视图/筛选下完成不动画）。
      // 冻结当前顺序，让该待办在延迟期间原地停留；多个待办相继完成时，
      // 以屏幕上的现状（含此前冻结的结果）为准重新冻结。
      pendingSink.set(item.id, setTimeout(() => {
        pendingSink.forEach(timer => clearTimeout(timer));
        pendingSink.clear();
        sinkFrozenOrder = [];
        // 完成后仍会留在列表（待办/归类视图且「显示已完成」开启）→ 重渲染
        // 落位并播放 FLIP；不再显示（收集箱、今天、显示已完成关闭）→ 先
        // 淡出卡片再重渲染，避免延迟停留后突然消失。
        const staysVisible = (currentView === 'todos' || String(currentView).startsWith('folder:')) && settings.showCompletedTodos;
        if (!staysVisible && !reduceWindowMotion()) {
          const card = $('#itemList')?.querySelector(`.item-card[data-id="${CSS.escape(item.id)}"]`);
          if (card) {
            // 淡出只负责观感；状态切换用定时器驱动，动画被遮挡节流或
            // 引擎不支持时 onfinish 不触发也不会让卡片滞留列表。
            card.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 240, easing: 'ease-out', fill: 'forwards' });
            setTimeout(() => { sinkRenderQueued = true; renderList(); }, 260);
            return;
          }
        }
        sinkRenderQueued = true;
        renderList();
      }, completedTodoSinkDelay()));
      sinkContext = { view: currentView, filter: currentFilter };
      sinkFrozenOrder = [...previousOrder];
    }
  });
  // 待办被移入回收站或彻底删除后不再参与等待。
  pendingSink.forEach((timer, id) => {
    if (!liveIds.has(id)) {
      clearTimeout(timer);
      pendingSink.delete(id);
    }
  });
  if (!pendingSink.size) sinkFrozenOrder = [];
}

// 置底落位动效：把移位的卡片（被移动的待办与其上方腾位的卡片）从旧位置
// 平滑归位。缓动与界面统一的 --ease-out 同曲线，强减速无非线性回弹——
// 这是按钮触发的状态提交，不带手势动量，不做超调。
function playCompletedSinkMotion(list, previousCards) {
  if (reduceWindowMotion() || !previousCards.size) return;
  list.querySelectorAll('.item-card').forEach(card => {
    const previous = previousCards.get(card.dataset.id);
    if (!previous) return;
    const current = card.getBoundingClientRect();
    const dx = previous.left - current.left;
    const dy = previous.top - current.top;
    if (Math.abs(dx) < 2 && Math.abs(dy) < 2) return;
    card.animate(
      [{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'translate(0, 0)' }],
      { duration: 520, easing: 'cubic-bezier(.16, 1, .3, 1)' }
    );
  });
}

function renderList() {
  const sinkList = $('#itemList');
  const sinkCards = sinkList ? [...sinkList.querySelectorAll('.item-card')] : [];
  const sinkPreviousOrder = sinkCards.map(card => card.dataset.id);
  const sinkPreviousRects = sinkRenderQueued || pendingSink.size
    ? new Map(sinkCards.map(card => [card.dataset.id, card.getBoundingClientRect()]))
    : null;
  const sinking = sinkRenderQueued;
  sinkRenderQueued = false;
  syncCompletedTodoSink(sinkPreviousOrder);
  syncCalendarShell();
  syncListFilterUI();
  const list = $('#itemList');
  if (currentView === 'calendar') {
    const periodItems = calendarPeriodItems();
    $('#viewTitle').textContent = calendarPeriodLabel();
    $('#viewEyebrow').textContent = `${t('calendar')} · ${t(calendarModeKey(calendarViewMode))}`;
    $('#itemCountLabel').textContent = `${periodItems.length} ${t('calendarItems')}`;
    list.className = `item-list calendar-list calendar-${calendarViewMode}`;
    list.innerHTML = renderCalendar();
    playCalendarTransition(list);
    alignMobileWeek(list);
    return;
  }
  if (currentView === 'stats') {
    const total = statsCollectionItems().length;
    $('#viewTitle').textContent = viewTitle();
    $('#viewEyebrow').textContent = window.actaDataName || t('actaData');
    $('#itemCountLabel').textContent = `${total} ${t('item')}`;
    list.className = 'item-list stats-list';
    list.innerHTML = renderStats();
    bindStatsView();
    return;
  }
  if (currentView === 'trash') {
    const items = getVisibleItems();
    $('#viewTitle').textContent = viewTitle();
    $('#viewEyebrow').textContent = t('trashOpenHint');
    $('#itemCountLabel').textContent = `${items.length} ${t('trashItems')}`;
    list.className = 'item-list trash-list';
    list.innerHTML = items.length
      ? renderTrashList(items)
      : `<div class="empty-list trash-empty"><div><span><svg><use href="#i-trash"/></svg></span><h3>${escapeHTML(t('trashEmptyTitle'))}</h3><p>${escapeHTML(t('trashEmptyHint'))}</p></div></div>`;
    bindTrashList();
    return;
  }
  const items = getVisibleItems();
  $('#viewTitle').textContent = viewTitle();
  $('#viewEyebrow').textContent = currentView.startsWith('folder:') ? t('classify') : (window.actaDataName || t('actaData'));
  $('#itemCountLabel').textContent = `${items.length} ${t('item')}`;
  list.className = 'item-list';
  if (!items.length) {
    list.innerHTML = `<div class="empty-list"><div><span><svg><use href="#i-spark"/></svg></span><h3>${t('noItems')}</h3><p>${t('noItemsHint')}</p></div></div>`;
    return;
  }

  list.innerHTML = items.map((item, index) => {
    const folder = getFolder(item.folderId);
    const linkedCount = getLinkedItems(item).length;
    const completed = item.type === 'todo' && (item.tasks || []).filter(task => task.done).length;
    const total = item.type === 'todo' ? (item.tasks || []).length : 0;
    const done = isTodoComplete(item);
    const progress = total ? Math.round(completed / total * 100) : (done ? 100 : 0);
    const dateMarkup = item.type === 'todo'
      ? todoListTimeMarkup(item)
      : `<time class="card-date" datetime="${escapeHTML(item.updatedAt)}">${escapeHTML(formatDate(item.updatedAt, true))}</time>`;
    const active = !matchMedia('(max-width: 800px)').matches && item.id === selectedId;
    return `<button class="item-card ${active ? 'active' : ''} ${done ? 'completed-card' : ''} ${item.type === 'todo' ? `priority-${item.priority || 'medium'}` : ''}" data-id="${escapeHTML(item.id)}" style="animation-delay:${Math.min(index * 18, 100)}ms">
      <div class="card-top"><span class="type-pill ${item.type}"><svg><use href="#i-${item.type === 'todo' ? 'check' : 'note'}"/></svg>${t(item.type)}</span>${item.type === 'todo' ? `<span class="priority-pill ${item.priority || 'medium'}">${t(item.priority || 'medium')}</span>` : ''}${dateMarkup}</div>
      <h3>${escapeHTML(item.title || (item.type === 'todo' ? t('untitledTodo') : t('untitledNote')))}</h3>
      <p>${escapeHTML(itemPreview(item))}</p>
      <div class="card-bottom"><span class="mini-folder"><i class="folder-dot" style="background:${escapeHTML(folder?.color || '#999')}"></i>${escapeHTML(folderName(folder))}</span>
      ${linkedCount ? `<span class="link-count"><svg><use href="#i-link"/></svg>${linkedCount}</span>` : ''}
      ${item.type === 'todo' ? (item.checkin
        ? (() => {
            const checkins = item.checkins || {};
            const todayKey = todayISO();
            const streakCursor = new Date();
            if (!checkins[todayKey]) streakCursor.setDate(streakCursor.getDate() - 1);
            let streak = 0;
            const offsetMs = streakCursor.getTimezoneOffset() * 60000;
            while (checkins[new Date(streakCursor - offsetMs).toISOString().slice(0, 10)]) {
              streak += 1;
              streakCursor.setDate(streakCursor.getDate() - 1);
            }
            const on = Boolean(checkins[todayKey]);
            return `<span class="checkin-badge${on ? ' on' : ''}"><svg><use href="#i-check"/></svg>${escapeHTML(on ? t('checkinDone') : t('checkinTodoYet'))}</span>${streak ? `<span class="checkin-streak">${escapeHTML(t('checkinStreak'))} ${streak} ${escapeHTML(t('checkinDays'))}</span>` : ''}`;
          })()
        : `<span>${completed}/${total}</span><span class="mini-progress"><i style="width:${progress}%"></i></span>`) : ''}</div>
    </button>`;
  }).join('');
  if (sinking && sinkPreviousRects) {
    // 置底落位：抑制入场级联重放，只播移位卡片的位置动效。
    document.body.classList.add('acta-steady');
    try { playCompletedSinkMotion(list, sinkPreviousRects); } catch { /* 动画失败不影响落位。 */ }
  }
}

function editorTop(item) {
  const folder = getFolder(item.folderId);
  return `<div class="editor-topline">
    <button class="mobile-back" id="mobileBack" aria-label="Back"><svg><use href="#i-chevron"/></svg></button>
    <span class="editor-type ${item.type}"><svg><use href="#i-${item.type === 'todo' ? 'check' : 'note'}"/></svg>${t(item.type)}</span>
    <span class="editor-folder">${escapeHTML(folderName(folder))}</span>
    <div class="editor-actions">
      ${item.type === 'todo' ? `<button id="completeItem" title="${isTodoComplete(item) ? t('reopenTask') : t('completeTask')}"><svg><use href="#i-check"/></svg></button>` : ''}
      ${item.type === 'note' ? `<button id="exportNote" title="${t('exportNote')}"><svg><use href="#i-upload"/></svg></button>` : ''}
      <button id="deleteItem" title="${t('moveToTrash')}"><svg><use href="#i-trash"/></svg></button>
      <button title="${t('archive')}"><svg><use href="#i-more"/></svg></button>
    </div>
  </div>`;
}

function linkedItemsSection(item) {
  const linkedItems = getLinkedItems(item);
  const availableItems = library.items.filter(entry => entry.id !== item.id
    && !isTrashed(entry)
    && (item.type === 'todo' || entry.type === 'todo')
    && !linkedItems.some(linked => linked.id === entry.id));
  const pickerLabel = item.type === 'note' ? t('chooseTodo') : t('linkedItems');
  const addLabel = item.type === 'note' ? t('linkTodo') : t('linkedItems');
  return `<section class="linked-section">
    <div class="linked-head"><span><svg><use href="#i-link"/></svg><b>${t('linkedItems')}</b><em>${linkedItems.length}</em></span></div>
    <div class="link-picker">
      <select id="linkItemSelect" aria-label="${escapeHTML(pickerLabel)}">
        <option value="">${escapeHTML(pickerLabel)}</option>
        ${availableItems.map(entry => `<option value="${escapeHTML(entry.id)}">${item.type === 'todo' ? `${escapeHTML(t(entry.type))} · ` : ''}${escapeHTML(entry.title || (entry.type === 'todo' ? t('untitledTodo') : t('untitledNote')))}</option>`).join('')}
      </select>
      <button id="addItemLink" disabled><svg><use href="#i-plus"/></svg>${escapeHTML(addLabel)}</button>
    </div>
    <div class="linked-list">
      ${linkedItems.length ? linkedItems.map(linked => `<div class="linked-row" data-linked-id="${escapeHTML(linked.id)}">
        <button class="open-linked-item"><span class="type-pill ${linked.type}"><svg><use href="#i-${linked.type === 'todo' ? 'check' : 'note'}"/></svg>${t(linked.type)}</span><b>${escapeHTML(linked.title || (linked.type === 'todo' ? t('untitledTodo') : t('untitledNote')))}</b>${linked.type === 'todo' ? `<span class="priority-pill ${linked.priority || 'medium'}">${t(linked.priority || 'medium')}</span>` : ''}</button>
        <button class="remove-item-link" title="${t('unlink')}" aria-label="${t('unlink')}"><svg><use href="#i-close"/></svg></button>
      </div>`).join('') : `<p class="no-links">${t('noLinks')}</p>`}
    </div>
  </section>`;
}

let classificationField;
let noteEditor;
let todoEditor;
let bindTodoEditor;
let createItem;

function renderEditor() {
  let item = getItem();
  if (item && isTrashed(item)) item = null;
  const pane = $('#editorPane');
  const previousEditorId = $('.editor-wrap', pane)?.dataset.editorId;
  document.body.classList.remove('note-focus-mode', 'note-focus-leaving');
  if (!item) {
    pane.classList.remove('mobile-open');
    pane.innerHTML = `<div class="empty-editor"><div><span><svg><use href="#i-spark"/></svg></span><h2>${t('selectItem')}</h2><p>${t('selectItemHint')}</p></div></div>`;
    pane.scrollTop = 0;
    return;
  }
  pane.innerHTML = item.type === 'note' ? noteEditor(item) : todoEditor(item);
  pane.classList.toggle('mobile-open', mobileEditorOpen);
  if (previousEditorId !== item.id) pane.scrollTop = 0;
  bindEditor(item);
}

function autoSizeTitle() {
  const title = $('#editorTitle');
  if (!title) return;
  title.style.height = 'auto';
  if (title.getBoundingClientRect().width <= 1) return;
  title.style.height = `${Math.ceil(title.scrollHeight)}px`;
}

function watchEditorPaneWidth() {
  const pane = $('#editorPane');
  if (!pane) return;
  if (!('ResizeObserver' in window)) {
    window.addEventListener('resize', autoSizeTitle);
    return;
  }
  let previousWidth = -1;
  editorPaneResizeObserver = new ResizeObserver(entries => {
    const width = entries[0]?.contentRect.width ?? pane.clientWidth;
    if (Math.abs(width - previousWidth) < .5) return;
    previousWidth = width;
    cancelAnimationFrame(editorTitleResizeFrame);
    editorTitleResizeFrame = requestAnimationFrame(autoSizeTitle);
  });
  editorPaneResizeObserver.observe(pane);
}

function isImeComposing(event) {
  return Boolean(event.isComposing || event.keyCode === 229);
}

function touchItem(item) {
  item.updatedAt = new Date().toISOString();
  persist();
}

function syncEditorModifiedTime(item) {
  if (!item || item.type !== 'note') return;
  const label = `${t('modified')} ${formatDateTimeSeconds(item.updatedAt)}`;
  const subline = $('#noteUpdatedAt');
  const focusTime = $('#noteFocusUpdatedAt');
  if (subline) {
    subline.dateTime = item.updatedAt;
    subline.lastChild.textContent = label;
  }
  if (focusTime) {
    focusTime.dateTime = item.updatedAt;
    focusTime.lastChild.textContent = label;
  }
}

function setTodoCompletion(item, complete) {
  if (!item || item.type !== 'todo') return;
  const snapshotBefore = JSON.parse(JSON.stringify(item));
  item.completed = Boolean(complete);
  (item.tasks || []).forEach(task => {
    task.done = Boolean(complete);
    if (complete) { task.completedAt = task.completedAt || new Date().toISOString(); }
    else { delete task.completedAt; }
  });
  logHistory('todo-completed', item.title || t('untitledTodo'), item.id, snapshotBefore);
  touchItem(item);
}

function toggleCalendarSubtask(item, taskId) {
  if (!item || item.type !== 'todo') return;
  const task = (item.tasks || []).find(entry => entry.id === taskId);
  if (!task) return;
  task.done = !task.done;
  if (task.done) task.completedAt = new Date().toISOString();
  else delete task.completedAt;
  item.completed = item.tasks.length > 0 && item.tasks.every(entry => entry.done);
  touchItem(item);
}

function updateCard(item) {
  const card = $(`.item-card[data-id="${CSS.escape(item.id)}"]`);
  if (!card) return;
  const heading = $('h3', card);
  const preview = $('p', card);
  if (heading) heading.textContent = item.title || (item.type === 'todo' ? t('untitledTodo') : t('untitledNote'));
  if (preview) preview.textContent = itemPreview(item);
}

function bindEditor(item) {
  autoSizeTitle();
  $('#mobileBack')?.addEventListener('click', () => {
    mobileEditorOpen = false;
    $('#editorPane').classList.remove('mobile-open');
  });
  $('#editorTitle').addEventListener('input', event => {
    item.title = event.target.value;
    autoSizeTitle();
    touchItem(item);
    syncEditorModifiedTime(item);
    const focusTitle = $('#noteFocusTitle');
    if (focusTitle) focusTitle.textContent = item.title || t('untitledNote');
    updateCard(item);
  });
  $('#deleteItem')?.addEventListener('click', async () => {
    const choice = await askItemDelete(item);
    if (!choice) return;
    if (choice === 'trash') {
      logHistory('item-trashed', item.title || (item.type === 'todo' ? t('untitledTodo') : t('untitledNote')), item.id, JSON.parse(JSON.stringify(item)));
      item.deletedAt = new Date().toISOString();
      unlinkForTrash(item);
      const nextSelection = getVisibleItems().find(entry => entry.id !== item.id) || activeItems()[0];
      selectedId = nextSelection?.id || null;
      persist();
      renderAll();
      return;
    }
    destroyItems([item.id]);
    showToast(t('destroyed'));
  });
  $('#completeItem')?.addEventListener('click', () => {
    const nextState = !isTodoComplete(item);
    setTodoCompletion(item, nextState);
    renderAll();
  });

  $('#classificationFolder')?.addEventListener('change', event => {
    item.folderId = event.target.value;
    touchItem(item);
    syncEditorModifiedTime(item);
    const folderLabel = $('.editor-folder');
    if (folderLabel) folderLabel.textContent = folderName(getFolder(item.folderId));
    renderSidebar();
    renderList();
  });
  if (item.type === 'note') bindNoteEditor(item);
  else bindTodoEditor(item);
  bindLinkedItems(item);
}

function bindNoteEditor(item) {
  const article = $('.note-editor');
  const body = $('#noteBody');
  const source = $('#noteMarkdownSource');
  const toolbar = $('.note-toolbar');
  const blockFormat = $('#noteBlockFormat');
  const formatMode = $('#noteFormatMode');
  const markdownToggle = $('[data-note-action="toggle-markdown"]', toolbar);
  const focusButton = $('#focusNoteEditor');
  const exitFocusButton = $('#exitFocusNoteEditor');
  const focusModeLabel = $('#noteFocusModeLabel');
  const focusModeIcon = $('#noteFocusModeIcon');
  let markdownMode = false;
  let focusMode = false;
  let focusExitTimer = 0;
  let savedRange = null;

  const updateStats = html => {
    const text = stripHTML(html);
    $('#noteStats').textContent = `${text.split(/\s+/).filter(Boolean).length} ${t('words')} · ${text.length} ${t('chars')}`;
  };
  const commitHTML = () => {
    item.body = body.innerHTML;
    updateStats(item.body);
    touchItem(item);
    syncEditorModifiedTime(item);
    updateCard(item);
  };
  const commitMarkdown = () => {
    item.body = markdownToNoteHTML(source.value);
    updateStats(item.body);
    touchItem(item);
    syncEditorModifiedTime(item);
    updateCard(item);
  };
  const updateMarkdownSource = (replacement, start, end, selectionStart, selectionEnd) => {
    source.focus();
    source.setRangeText(replacement, start, end, 'end');
    source.setSelectionRange(selectionStart, selectionEnd);
    source.dispatchEvent(new Event('input', { bubbles:true }));
  };
  const markdownHasSelection = () => source.selectionEnd > source.selectionStart && source.value.slice(source.selectionStart, source.selectionEnd).trim().length > 0;
  const markdownSelectionOptional = new Set(['undo', 'redo', 'insertHorizontalRule']);
  const requireMarkdownSelection = action => {
    if (markdownSelectionOptional.has(action) || markdownHasSelection()) return true;
    showToast(t('selectTextFirst'));
    source.focus();
    return false;
  };
  const toggleMarkdownSelection = (prefix, suffix = prefix) => {
    const value = source.value;
    const start = source.selectionStart;
    const end = source.selectionEnd;
    const selected = value.slice(start, end);
    const ambiguousSingleMarker = prefix === suffix
      && prefix.length === 1
      && ['*', '`'].includes(prefix)
      && (selected.startsWith(prefix.repeat(2)) || selected.endsWith(suffix.repeat(2)));
    if (!ambiguousSingleMarker && selected.length >= prefix.length + suffix.length && selected.startsWith(prefix) && selected.endsWith(suffix)) {
      const unwrapped = selected.slice(prefix.length, selected.length - suffix.length);
      updateMarkdownSource(unwrapped, start, end, start, start + unwrapped.length);
      return;
    }
    const markerStart = start - prefix.length;
    const markerEnd = end + suffix.length;
    const hasExternalMarkers = markerStart >= 0
      && value.slice(markerStart, start) === prefix
      && value.slice(end, markerEnd) === suffix;
    const externalSingleMarkerIsExact = !(prefix === suffix
      && prefix.length === 1
      && ['*', '`'].includes(prefix)
      && (value[markerStart - 1] === prefix || value[markerEnd] === suffix));
    if (hasExternalMarkers && externalSingleMarkerIsExact) {
      updateMarkdownSource(selected, markerStart, markerEnd, markerStart, markerStart + selected.length);
      return;
    }
    const replacement = `${prefix}${selected}${suffix}`;
    updateMarkdownSource(replacement, start, end, start + prefix.length, start + prefix.length + selected.length);
  };
  const transformMarkdownLines = transform => {
    const value = source.value;
    const selectionStart = source.selectionStart;
    const selectionEnd = source.selectionEnd;
    const start = value.lastIndexOf('\n', Math.max(0, selectionStart - 1)) + 1;
    const nextBreak = value.indexOf('\n', selectionEnd);
    const end = nextBreak < 0 ? value.length : nextBreak;
    const replacement = value.slice(start, end).split('\n').map(transform).join('\n');
    updateMarkdownSource(replacement, start, end, start, start + replacement.length);
  };
  const stripMarkdownLinePrefix = line => line.replace(/^(?:#{1,6}\s+|>\s+|[-+*]\s+(?:\[[ xX]\]\s+)?|\d+\.\s+)/, '');
  const toggleMarkdownLines = ({ test, remove, apply }) => {
    const value = source.value;
    const selectionStart = source.selectionStart;
    const selectionEnd = source.selectionEnd;
    const start = value.lastIndexOf('\n', Math.max(0, selectionStart - 1)) + 1;
    const nextBreak = value.indexOf('\n', selectionEnd);
    const end = nextBreak < 0 ? value.length : nextBreak;
    const lines = value.slice(start, end).split('\n');
    const contentLines = lines.filter(line => line.trim());
    const shouldRemove = contentLines.length > 0 && contentLines.every(test);
    const replacement = lines.map((line, index) => {
      if (!line.trim()) return line;
      return shouldRemove ? remove(line) : apply(stripMarkdownLinePrefix(line), index);
    }).join('\n');
    updateMarkdownSource(replacement, start, end, start, start + replacement.length);
  };
  const markdownBlockAtCaret = () => {
    const lineStart = source.value.lastIndexOf('\n', Math.max(0, source.selectionStart - 1)) + 1;
    const lineEnd = source.value.indexOf('\n', source.selectionStart);
    const line = source.value.slice(lineStart, lineEnd < 0 ? source.value.length : lineEnd);
    return /^###\s+/.test(line) ? 'h3' : /^##\s+/.test(line) ? 'h2' : /^#\s+/.test(line) ? 'h1' : 'p';
  };
  const setMarkdownBlockFormat = value => {
    if (!requireMarkdownSelection('formatBlock')) return false;
    if (value === 'p') {
      transformMarkdownLines(line => line.replace(/^#{1,6}\s+/, ''));
      return true;
    }
    const level = /^h([1-3])$/.exec(value)?.[1];
    if (level) {
      const marker = `${'#'.repeat(Number(level))} `;
      toggleMarkdownLines({
        test: line => line.startsWith(marker) && !line.startsWith(`${marker}#`),
        remove: line => line.slice(marker.length),
        apply: line => `${marker}${line}`,
      });
    }
    return Boolean(level);
  };
  const removeMarkdownLinkAtSelection = () => {
    const value = source.value;
    const start = source.selectionStart;
    const end = source.selectionEnd;
    const selected = value.slice(start, end);
    const selectedLink = selected.match(/^\[([^\]\n]+)\]\(([^)\n]+)\)$/);
    if (selectedLink) {
      updateMarkdownSource(selectedLink[1], start, end, start, start + selectedLink[1].length);
      return true;
    }
    const suffix = value.slice(end).match(/^\]\(([^)\n]+)\)/)?.[0];
    if (start > 0 && value[start - 1] === '[' && suffix) {
      updateMarkdownSource(selected, start - 1, end + suffix.length, start - 1, start - 1 + selected.length);
      return true;
    }
    return false;
  };
  const addMarkdownLink = () => {
    if (!requireMarkdownSelection('link')) return;
    if (removeMarkdownLinkAtSelection()) return;
    const start = source.selectionStart;
    const end = source.selectionEnd;
    const selected = source.value.slice(start, end).trim();
    const requested = window.prompt(t('linkPrompt'), /^https?:\/\//i.test(selected) ? selected : 'https://');
    if (requested === null) return;
    let href = requested.trim();
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(href)) href = `mailto:${href}`;
    else if (href && !/^[a-z][a-z0-9+.-]*:/i.test(href)) href = `https://${href}`;
    if (!isSafeHref(href)) { showToast(t('invalidLink')); return; }
    const label = selected || href;
    const replacement = `[${label}](${href})`;
    updateMarkdownSource(replacement, start, end, start + 1, start + 1 + label.length);
  };
  const runMarkdownTool = (action, value = '') => {
    if (!source) return;
    if (!requireMarkdownSelection(action)) return;
    if (action === 'bold') toggleMarkdownSelection('**');
    else if (action === 'italic') toggleMarkdownSelection('*');
    else if (action === 'strikeThrough') toggleMarkdownSelection('~~');
    else if (action === 'highlight') toggleMarkdownSelection('==');
    else if (action === 'inline-code') toggleMarkdownSelection('`');
    else if (action === 'insertUnorderedList') toggleMarkdownLines({
      test: line => /^[-+*]\s+(?!\[[ xX]\]\s+)/.test(line),
      remove: line => line.replace(/^[-+*]\s+/, ''),
      apply: line => `- ${line}`,
    });
    else if (action === 'insertOrderedList') toggleMarkdownLines({
      test: line => /^\d+\.\s+/.test(line),
      remove: line => line.replace(/^\d+\.\s+/, ''),
      apply: (line, index) => `${index + 1}. ${line}`,
    });
    else if (action === 'task-list') toggleMarkdownLines({
      test: line => /^[-+*]\s+\[[ xX]\]\s+/.test(line),
      remove: line => line.replace(/^[-+*]\s+\[[ xX]\]\s+/, ''),
      apply: line => `- [ ] ${line}`,
    });
    else if (action === 'formatBlock' && value === 'blockquote') toggleMarkdownLines({
      test: line => /^>\s+/.test(line),
      remove: line => line.replace(/^>\s+/, ''),
      apply: line => `> ${line}`,
    });
    else if (action === 'formatBlock' && value === 'pre') toggleMarkdownSelection('```\n', '\n```');
    else if (action === 'insertHorizontalRule') {
      const start = source.selectionStart;
      updateMarkdownSource('\n\n---\n\n', start, source.selectionEnd, start + 7, start + 7);
    } else if (action === 'link') addMarkdownLink();
    else if (action === 'unlink') {
      if (removeMarkdownLinkAtSelection()) return;
      const start = source.selectionStart;
      const end = source.selectionEnd;
      const selected = source.value.slice(start, end);
      const replacement = selected.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
      updateMarkdownSource(replacement, start, end, start, start + replacement.length);
    } else if (action === 'undo' || action === 'redo') {
      source.focus();
      document.execCommand(action);
      source.dispatchEvent(new Event('input', { bubbles:true }));
    }
  };
  const selectionInsideBody = selection => {
    const anchor = selection?.anchorNode;
    return Boolean(anchor && (anchor === body || body.contains(anchor)));
  };
  const captureSelection = () => {
    const selection = window.getSelection();
    if (selection?.rangeCount && selectionInsideBody(selection)) savedRange = selection.getRangeAt(0).cloneRange();
    return savedRange;
  };
  const restoreSelection = () => {
    if (!savedRange) return;
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(savedRange);
  };
  const visualSelectionOptional = new Set(['undo', 'redo', 'insertHorizontalRule']);
  const visualHasSelection = () => {
    const selection = window.getSelection();
    if (selection?.rangeCount && selectionInsideBody(selection) && !selection.isCollapsed && selection.toString().trim()) return true;
    return Boolean(savedRange && !savedRange.collapsed && body.contains(savedRange.commonAncestorContainer) && savedRange.toString().trim());
  };
  const requireVisualSelection = action => {
    if (visualSelectionOptional.has(action) || visualHasSelection()) return true;
    showToast(t('selectTextFirst'));
    body.focus();
    return false;
  };
  const syncToolbarState = () => {
    if (markdownMode) return;
    const selection = window.getSelection();
    if (!selectionInsideBody(selection)) return;
    captureSelection();
    ['bold', 'italic', 'strikeThrough', 'insertUnorderedList', 'insertOrderedList'].forEach(command => {
      const button = toolbar.querySelector(`[data-command="${command}"]`);
      if (!button) return;
      let active = false;
      try { active = document.queryCommandState(command); } catch { /* Unsupported command. */ }
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', String(active));
    });
    let block = selection.anchorNode?.nodeType === Node.ELEMENT_NODE ? selection.anchorNode : selection.anchorNode?.parentElement;
    while (block && block !== body && !/^(P|H1|H2|H3|BLOCKQUOTE|PRE)$/.test(block.tagName)) block = block.parentElement;
    blockFormat.value = block && /^(P|H1|H2|H3)$/.test(block.tagName) ? block.tagName.toLowerCase() : 'p';
    [['blockquote', 'blockquote'], ['pre', 'pre']].forEach(([value, tag]) => {
      const button = toolbar.querySelector(`[data-command="formatBlock"][data-value="${value}"]`);
      const active = block?.tagName?.toLowerCase() === tag;
      button?.classList.toggle('active', active);
      button?.setAttribute('aria-pressed', String(active));
    });
    [['inline-code', 'code'], ['highlight', 'mark'], ['link', 'a']].forEach(([action, tag]) => {
      const button = toolbar.querySelector(`[data-note-action="${action}"]`);
      const anchor = selection.anchorNode?.nodeType === Node.ELEMENT_NODE ? selection.anchorNode : selection.anchorNode?.parentElement;
      const active = Boolean(anchor?.closest?.(tag) && body.contains(anchor.closest(tag)));
      button?.classList.toggle('active', active);
      button?.setAttribute('aria-pressed', String(active));
    });
  };
  const runCommand = (command, value = null) => {
    restoreSelection();
    if (command === 'formatBlock' && value) {
      const selection = window.getSelection();
      let block = selection?.anchorNode?.nodeType === Node.ELEMENT_NODE ? selection.anchorNode : selection?.anchorNode?.parentElement;
      while (block && block !== body && !/^(P|H1|H2|H3|BLOCKQUOTE|PRE)$/.test(block.tagName)) block = block.parentElement;
      if (block?.tagName?.toLowerCase() === value.toLowerCase()) value = 'p';
    }
    body.focus();
    document.execCommand(command, false, value);
    captureSelection();
    commitHTML();
    syncToolbarState();
  };
  const selectedElementForTag = tag => {
    const selection = window.getSelection();
    if (!selection?.rangeCount || selection.isCollapsed || !selectionInsideBody(selection)) return null;
    const range = selection.getRangeAt(0);
    const closest = node => (node?.nodeType === Node.ELEMENT_NODE ? node : node?.parentElement)?.closest?.(tag);
    const startElement = closest(range.startContainer);
    const endElement = closest(range.endContainer);
    return startElement && startElement === endElement && body.contains(startElement) ? startElement : null;
  };
  const unwrapSelectedElement = element => {
    if (!element?.parentNode) return false;
    const parent = element.parentNode;
    const nodes = [...element.childNodes];
    if (!nodes.length) {
      element.remove();
      return true;
    }
    nodes.forEach(node => parent.insertBefore(node, element));
    element.remove();
    const range = document.createRange();
    range.setStartBefore(nodes[0]);
    range.setEndAfter(nodes.at(-1));
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
    savedRange = range.cloneRange();
    return true;
  };
  const toggleWrappedSelection = tag => {
    restoreSelection();
    const selection = window.getSelection();
    const activeElement = selectedElementForTag(tag);
    if (activeElement) {
      unwrapSelectedElement(activeElement);
      commitHTML();
      syncToolbarState();
      return;
    }
    if (!selection?.rangeCount || selection.isCollapsed) return;
    const range = selection.getRangeAt(0);
    const wrapper = document.createElement(tag);
    wrapper.append(range.extractContents());
    range.insertNode(wrapper);
    range.selectNodeContents(wrapper);
    selection.removeAllRanges();
    selection.addRange(range);
    captureSelection();
    commitHTML();
    syncToolbarState();
  };
  const insertTaskList = () => {
    restoreSelection();
    const selection = window.getSelection();
    const lines = (selection?.toString() || t('taskList')).split(/\r?\n/).map(line => line.trim()).filter(Boolean);
    const items = lines.map(line => `<li class="markdown-task" data-checked="false"><span class="markdown-task-box" contenteditable="false">☐</span>${escapeHTML(line)}</li>`).join('');
    document.execCommand('insertHTML', false, `<ul>${items}</ul>`);
    captureSelection();
    commitHTML();
  };
  const addLink = () => {
    restoreSelection();
    const activeLink = selectedElementForTag('a');
    if (activeLink) {
      unwrapSelectedElement(activeLink);
      commitHTML();
      syncToolbarState();
      return;
    }
    captureSelection();
    const selection = window.getSelection();
    const selectedText = selection?.toString().trim() || '';
    const requested = window.prompt(t('linkPrompt'), /^https?:\/\//i.test(selectedText) ? selectedText : 'https://');
    if (requested === null) return;
    let href = requested.trim();
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(href)) href = `mailto:${href}`;
    else if (href && !/^[a-z][a-z0-9+.-]*:/i.test(href)) href = `https://${href}`;
    if (!isSafeHref(href)) { showToast(t('invalidLink')); return; }
    restoreSelection();
    if (window.getSelection()?.isCollapsed) document.execCommand('insertHTML', false, `<a href="${escapeHTML(href)}">${escapeHTML(href)}</a>`);
    else document.execCommand('createLink', false, href);
    captureSelection();
    commitHTML();
  };
  const updateModeIndicator = () => {
    const label = markdownMode ? t('markdownSource') : t('richText');
    if (focusModeLabel) focusModeLabel.textContent = label;
    focusModeIcon?.setAttribute('href', markdownMode ? '#i-markdown' : '#i-note');
    const toolbarLabel = $('.note-tool-label', markdownToggle);
    if (toolbarLabel) toolbarLabel.textContent = markdownMode ? t('richText') : t('markdownSource');
  };
  const applyFocusMode = enabled => {
    const shouldEnable = Boolean(enabled && source);
    clearTimeout(focusExitTimer);
    focusExitTimer = 0;
    focusMode = shouldEnable;
    focusButton?.setAttribute('aria-pressed', String(focusMode));
    article?.classList.toggle('note-focus-active', focusMode);
    if (focusMode) {
      document.body.classList.remove('note-focus-leaving');
      document.body.classList.add('note-focus-mode');
      requestAnimationFrame(() => (markdownMode ? source : body).focus());
      return;
    }
    if (!document.body.classList.contains('note-focus-mode')) return;
    document.body.classList.add('note-focus-leaving');
    const finish = () => {
      document.body.classList.remove('note-focus-mode', 'note-focus-leaving');
      article?.classList.remove('note-focus-active');
      (markdownMode ? source : body).focus();
    };
    if (document.body.classList.contains('acta-reduce-motion') || matchMedia('(prefers-reduced-motion: reduce)').matches) finish();
    else focusExitTimer = setTimeout(finish, 210);
  };
  // 模式切换保真：进入源码模式时暂存可视化 DOM，若源码未被修改，
  // 退出时直接恢复原文（零转换）；只有真正改过源码才走 MD→HTML 转换。
  let visualHTMLBeforeSource = '';
  let sourceDirty = false;
  const setMarkdownMode = enabled => {
    markdownMode = Boolean(enabled && source);
    if (markdownMode) {
      visualHTMLBeforeSource = body.innerHTML;
      sourceDirty = false;
      source.value = noteHTMLToMarkdown(body.innerHTML);
      body.hidden = true;
      source.hidden = false;
      formatMode.textContent = t('markdownSource');
      markdownToggle.title = t('richText');
      markdownToggle.setAttribute('aria-label', t('richText'));
      requestAnimationFrame(() => source.focus());
    } else {
      if (source && !source.hidden) {
        if (!sourceDirty) {
          body.innerHTML = visualHTMLBeforeSource;
        } else {
          item.body = markdownToNoteHTML(source.value);
          body.innerHTML = item.body;
        }
      }
      if (source) source.hidden = true;
      body.hidden = false;
      formatMode.textContent = 'Acta / Markdown-ready';
      markdownToggle.title = t('markdownSource');
      markdownToggle.setAttribute('aria-label', t('markdownSource'));
      requestAnimationFrame(() => body.focus());
    }
    markdownToggle.classList.toggle('active', markdownMode);
    markdownToggle.setAttribute('aria-pressed', String(markdownMode));
    $('.note-editor').classList.toggle('markdown-source-active', markdownMode);
    updateModeIndicator();
    updateStats(item.body);
  };
  const setFocusMode = enabled => {
    applyFocusMode(Boolean(enabled));
  };

  $('#exportNote')?.addEventListener('click', () => exportNoteToFile(item));
  /* ===================== 可视化模式实时 Markdown =====================
   * 行首键入 "# " / "> " / "- " / "1. " / "- [ ] " 时转换为对应块级格式，
   * 闭合 "**xx**"、"`xx`" 等行内标记时立即替换为富文本元素；
   * 全部通过 execCommand 完成，浏览器原生撤销栈保持可用。 */
  let liveMarkdownBusy = false;
  const liveInlineRules = [
    { marker: '**', tag: 'strong' },
    { marker: '~~', tag: 'del' },
    { marker: '==', tag: 'mark' },
    { marker: '`', tag: 'code' },
    { marker: '*', tag: 'em' },
    { marker: '_', tag: 'em' }
  ];
  const liveBlockFormats = { '#': 'h1', '##': 'h2', '###': 'h3', '>': 'blockquote' };
  const applyLiveBlockMarkdown = () => {
    const selection = window.getSelection();
    if (!selection.rangeCount || !selection.isCollapsed) return false;
    const range = selection.getRangeAt(0);
    const node = range.startContainer;
    if (node.nodeType !== Node.TEXT_NODE) return false;
    const lineText = node.nodeValue.slice(0, range.startOffset);
    if (!lineText.endsWith(' ')) return false;
    const token = lineText.trimEnd();
    let command = null;
    let value = null;
    let isTask = false;
    if (liveBlockFormats[token]) { command = 'formatBlock'; value = liveBlockFormats[token]; }
    else if (token === '-' || token === '*') command = 'insertUnorderedList';
    else if (/^\d+[.)]$/.test(token)) command = 'insertOrderedList';
    else if (token === '- [ ]' || token === '- [x]') { command = 'insertUnorderedList'; isTask = true; }
    if (!command) return false;
    const deleteRange = document.createRange();
    deleteRange.setStart(node, 0);
    deleteRange.setEnd(node, range.startOffset);
    selection.removeAllRanges();
    selection.addRange(deleteRange);
    document.execCommand('delete', false, null);
    document.execCommand(command, false, value);
    if (isTask) {
      const li = window.getSelection().anchorNode?.parentElement?.closest('li');
      if (li) {
        li.classList.add('markdown-task');
        li.dataset.checked = token.endsWith('x') ? 'true' : 'false';
        li.insertAdjacentHTML('afterbegin', `<span class="markdown-task-box" contenteditable="false">${token.endsWith('x') ? '☑' : '☐'}</span>`);
      }
    }
    return true;
  };
  const applyLiveInlineMarkdown = () => {
    const selection = window.getSelection();
    if (!selection.rangeCount || !selection.isCollapsed) return false;
    const range = selection.getRangeAt(0);
    const node = range.startContainer;
    if (node.nodeType !== Node.TEXT_NODE) return false;
    const before = node.nodeValue.slice(0, range.startOffset);
    for (const { marker, tag } of liveInlineRules) {
      if (!before.endsWith(marker)) continue;
      const contentEnd = before.length - marker.length;
      const contentStart = before.lastIndexOf(marker, contentEnd - 1);
      if (contentStart < 0) continue;
      const content = before.slice(contentStart + marker.length, contentEnd);
      if (!content || content.includes('\n')) continue;
      const replace = document.createRange();
      replace.setStart(node, contentStart);
      replace.setEnd(node, range.startOffset);
      selection.removeAllRanges();
      selection.addRange(replace);
      document.execCommand('insertHTML', false, `<${tag}>${escapeHTML(content)}</${tag}>`);
      return true;
    }
    return false;
  };
  body.addEventListener('input', event => {
    if (liveMarkdownBusy || event.isComposing) {
      commitHTML();
      return;
    }
    liveMarkdownBusy = true;
    try {
      applyLiveBlockMarkdown() || applyLiveInlineMarkdown();
    } finally {
      liveMarkdownBusy = false;
    }
    commitHTML();
  });
  body.addEventListener('click', event => {
    const checkbox = event.target.closest('.markdown-task-box');
    if (!checkbox) return;
    const task = checkbox.closest('.markdown-task');
    const checked = task.dataset.checked !== 'true';
    task.dataset.checked = String(checked);
    checkbox.textContent = checked ? '☑' : '☐';
    commitHTML();
  });
  $$('[data-command]', toolbar).forEach(button => button.addEventListener('mousedown', event => {
    event.preventDefault();
    if (markdownMode) runMarkdownTool(button.dataset.command, button.dataset.value || '');
    else if (requireVisualSelection(button.dataset.command)) runCommand(button.dataset.command, button.dataset.value || null);
  }));
  $$('[data-note-action="inline-code"],[data-note-action="highlight"],[data-note-action="task-list"],[data-note-action="link"]', toolbar).forEach(button => button.addEventListener('mousedown', event => {
    event.preventDefault();
    if (markdownMode) runMarkdownTool(button.dataset.noteAction);
    else if (requireVisualSelection(button.dataset.noteAction)) {
      if (button.dataset.noteAction === 'inline-code') toggleWrappedSelection('code');
      else if (button.dataset.noteAction === 'highlight') toggleWrappedSelection('mark');
      else if (button.dataset.noteAction === 'task-list') insertTaskList();
      else addLink();
    }
  }));
  blockFormat.addEventListener('pointerdown', captureSelection);
  blockFormat.addEventListener('change', () => {
    if (markdownMode) {
      if (!setMarkdownBlockFormat(blockFormat.value)) blockFormat.value = markdownBlockAtCaret();
    }
    else if (requireVisualSelection('formatBlock')) runCommand('formatBlock', blockFormat.value);
    else syncToolbarState();
  });
  markdownToggle.addEventListener('click', () => setMarkdownMode(!markdownMode));
  focusButton?.addEventListener('click', () => setFocusMode(true));
  exitFocusButton?.addEventListener('click', () => setFocusMode(false));
  source?.addEventListener('input', () => {
    sourceDirty = true;
    commitMarkdown();
  });
  source?.addEventListener('keydown', event => {
    const mod = event.metaKey || event.ctrlKey;
    if (event.key === 'Escape' && focusMode) {
      event.preventDefault();
      event.stopPropagation();
      setFocusMode(false);
    } else if (event.key === 'Tab') {
      event.preventDefault();
      const start = source.selectionStart;
      source.setRangeText('  ', start, source.selectionEnd, 'end');
      source.dispatchEvent(new Event('input'));
    } else if (mod && event.shiftKey && event.key.toLowerCase() === 'm') {
      event.preventDefault();
      event.stopPropagation();
      setMarkdownMode(false);
    }
  });
  body.addEventListener('keydown', event => {
    if (event.key === 'Escape' && focusMode) {
      event.preventDefault();
      event.stopPropagation();
      setFocusMode(false);
      return;
    }
    const mod = event.metaKey || event.ctrlKey;
    if (!mod) return;
    let handled = true;
    if (event.key.toLowerCase() === 'b') {
      if (requireVisualSelection('bold')) runCommand('bold');
    } else if (event.key.toLowerCase() === 'i') {
      if (requireVisualSelection('italic')) runCommand('italic');
    } else if (event.key.toLowerCase() === 'k') {
      if (requireVisualSelection('link')) addLink();
    } else if (event.shiftKey && event.key === '7') {
      if (requireVisualSelection('insertOrderedList')) runCommand('insertOrderedList');
    } else if (event.shiftKey && event.key === '8') {
      if (requireVisualSelection('insertUnorderedList')) runCommand('insertUnorderedList');
    }
    else if (event.shiftKey && event.key.toLowerCase() === 'm') setMarkdownMode(true);
    else if (event.altKey && ['1','2','3'].includes(event.key)) {
      if (requireVisualSelection('formatBlock')) runCommand('formatBlock', `h${event.key}`);
    } else if (event.code === 'Backquote') {
      if (requireVisualSelection('inline-code')) toggleWrappedSelection('code');
    }
    else handled = false;
    if (handled) { event.preventDefault(); event.stopPropagation(); }
  });
  if (window.__actaNoteToolbarSelectionHandler) document.removeEventListener('selectionchange', window.__actaNoteToolbarSelectionHandler);
  // selectionchange 在拖选与格式化后高频触发，其中 queryCommandState 与
  // 逐按钮的 DOM 查询在大文档上代价可观；合并到每帧最多一次。
  let toolbarSyncFrame = 0;
  const scheduleToolbarSync = () => {
    if (toolbarSyncFrame) return;
    toolbarSyncFrame = requestAnimationFrame(() => { toolbarSyncFrame = 0; syncToolbarState(); });
  };
  window.__actaNoteToolbarSelectionHandler = scheduleToolbarSync;
  document.addEventListener('selectionchange', scheduleToolbarSync);
}

function addTask(item) {
  item.tasks ||= [];
  item.completed = false;
  const task = { id: uid(), text: '', done: false };
  item.tasks.push(task);
  touchItem(item); renderEditor(); renderList();
  requestAnimationFrame(() => focusNewTaskRow(task.id));
  return task.id;
}

// 新行要立即可以输入：聚焦它的正文区并滚动到可视位置。注意不能取
// .task-text 的最后一项——无序模式底部还有折叠的已完成分组，新行
// （未完成）永远在活跃区，按 id 定位才准确。
function focusNewTaskRow(taskId) {
  const row = document.querySelector(`.task-row[data-task-id="${CSS.escape(taskId)}"]`);
  const text = row && !row.closest('#taskDoneGroup') ? $('.task-text', row) : null;
  if (!text) return;
  const pane = $('#editorPane');
  if (pane) {
    const rowRect = row.getBoundingClientRect();
    const paneRect = pane.getBoundingClientRect();
    const fullyVisible = rowRect.top >= paneRect.top && rowRect.bottom <= paneRect.bottom;
    if (!fullyVisible) row.scrollIntoView({ block: 'center', behavior: reduceWindowMotion() ? 'auto' : 'smooth' });
  }
  text.focus({ preventScroll: true });
}

function linkItems(item, linked) {
  item.linkedIds ||= [];
  linked.linkedIds ||= [];
  if (!item.linkedIds.includes(linked.id)) item.linkedIds.push(linked.id);
  if (!linked.linkedIds.includes(item.id)) linked.linkedIds.push(item.id);
  const now = new Date().toISOString();
  item.updatedAt = now;
  linked.updatedAt = now;
  persist();
}

function unlinkItems(item, linked) {
  item.linkedIds = (item.linkedIds || []).filter(id => id !== linked.id);
  linked.linkedIds = (linked.linkedIds || []).filter(id => id !== item.id);
  const now = new Date().toISOString();
  item.updatedAt = now;
  linked.updatedAt = now;
  persist();
}

function openItem(id) {
  const target = library.items.find(item => item.id === id);
  if (!target) return;
  selectedId = id;
  if (isTodoComplete(target) && target.type === 'todo') {
    settings.showCompletedTodos = true;
    persist();
  }
  currentView = target.type === 'todo' ? 'todos' : 'notes';
  resetListFilters(target.type);
  searchQuery = '';
  mobileEditorOpen = true;
  $('#searchInput').value = '';
  $$('.filter-row [data-filter]').forEach(button => button.classList.toggle('active', button.dataset.filter === 'all'));
  renderAll();
}

function shiftCalendarCursor(direction) {
  const active = calendarDate(calendarCursor) || calendarDate(todayISO());
  if (calendarViewMode === 'year') {
    calendarCursor = new Date(active.getFullYear() + direction, active.getMonth(), active.getDate(), 12);
    return;
  }
  if (calendarViewMode === 'month') {
    const targetMonth = new Date(active.getFullYear(), active.getMonth() + direction, 1, 12);
    const lastDay = new Date(targetMonth.getFullYear(), targetMonth.getMonth() + 1, 0, 12).getDate();
    calendarCursor = new Date(targetMonth.getFullYear(), targetMonth.getMonth(), Math.min(active.getDate(), lastDay), 12);
    return;
  }
  calendarCursor = calendarAddDays(active, direction * (calendarViewMode === 'week' ? 7 : 1));
}

function bindLinkedItems(item) {
  const select = $('#linkItemSelect');
  const addButton = $('#addItemLink');
  select?.addEventListener('change', () => { addButton.disabled = !select.value; });
  addButton?.addEventListener('click', () => {
    const linked = library.items.find(entry => entry.id === select.value
      && entry.id !== item.id
      && (item.type === 'todo' || entry.type === 'todo'));
    if (!linked) return;
    linkItems(item, linked);
    renderEditor();
    renderList();
    showToast(t('linked'));
  });
  $$('.linked-row').forEach(row => {
    const linked = library.items.find(entry => entry.id === row.dataset.linkedId);
    if (!linked) return;
    $('.open-linked-item', row).addEventListener('click', () => openItem(linked.id));
    $('.remove-item-link', row).addEventListener('click', () => {
      unlinkItems(item, linked);
      renderEditor();
      renderList();
      showToast(t('unlinked'));
    });
  });
}

function renderAll() {
  translateStaticUI();
  renderSidebar();
  renderList();
  renderEditor();
}

function browserImportNote() {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.md,.markdown,.txt,text/markdown,text/plain';
    input.hidden = true;
    const cleanup = () => input.remove();
    input.addEventListener('cancel', () => { cleanup(); resolve(null); }, { once: true });
    input.addEventListener('change', async () => {
      try {
        const file = input.files?.[0];
        if (!file) { cleanup(); resolve(null); return; }
        if (file.size > 5 * 1024 * 1024) throw new Error(t('fileTooLarge'));
        const content = await file.text();
        cleanup();
        resolve({ content, fileName: file.name });
      } catch (error) { cleanup(); reject(error); }
    }, { once: true });
    document.body.appendChild(input);
    input.click();
  });
}

function browserExportNote(fileName, content) {
  const url = URL.createObjectURL(new Blob([content], { type: 'text/markdown;charset=utf-8' }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  anchor.hidden = true;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return Promise.resolve({ fileName });
}

function getNoteFileBridge() {
  if (window.actaDesktop?.importNote && window.actaDesktop?.exportNote) {
    return { importNote: window.actaDesktop.importNote, exportNote: window.actaDesktop.exportNote };
  }
  const nativeFiles = window.Capacitor?.Plugins?.ActaSync;
  if (nativeFiles?.importNote && nativeFiles?.exportNote) {
    return {
      importNote: () => nativeFiles.importNote(),
      exportNote: (fileName, content) => nativeFiles.exportNote({ fileName, content })
    };
  }
  return { importNote: browserImportNote, exportNote: browserExportNote };
}

async function importNoteFromFile() {
  $('#createMenu').classList.remove('open');
  try {
    const result = await getNoteFileBridge().importNote();
    if (!result) return;
    const imported = parseImportedNote(result.content, result.fileName || result.name || '');
    const now = new Date().toISOString();
    const currentFolder = currentView.startsWith('folder:') ? currentView.split(':')[1] : 'ideas';
    const item = {
      id: uid(), type: 'note', folderId: getFolder(currentFolder) ? currentFolder : library.folders[0]?.id,
      title: imported.title, body: imported.body, tags: imported.tags, linkedIds: [],
      createdAt: imported.createdAt, updatedAt: now
    };
    library.items.unshift(item);
    selectedId = item.id;
    currentView = 'inbox';
    resetListFilters('note');
    currentFilter = 'all';
    searchQuery = '';
    mobileEditorOpen = true;
    $('#searchInput').value = '';
    $$('.filter-row [data-filter]').forEach(button => button.classList.toggle('active', button.dataset.filter === 'all'));
    persist(); renderAll(); showToast(t('noteImported'));
  } catch (error) {
    showToast(`${t('importFailed')}: ${error?.message || t('invalidNoteFile')}`);
  }
}

async function exportNoteToFile(item) {
  if (!item || item.type !== 'note') return;
  try {
    const result = await getNoteFileBridge().exportNote(portableFileName(item.title), buildNoteMarkdown(item));
    if (result) showToast(t('noteExported'));
  } catch (error) {
    showToast(`${t('exportFailed')}: ${error?.message || t('invalidNoteFile')}`);
  }
}

function askClassificationName(defaultName) {
  return new Promise(resolve => {
    const dialog = document.createElement('dialog');
    dialog.className = 'relation-dialog folder-name-dialog';
    dialog.innerHTML = `
      <header class="relation-dialog-head"><span><svg><use href="#i-folder"/></svg></span><h3>${escapeHTML(t('folderPrompt'))}</h3><button class="relation-dialog-close" type="button" aria-label="${escapeHTML(t('cancel'))}"><svg><use href="#i-close"/></svg></button></header>
      <form class="relation-dialog-body folder-name-form" method="dialog" novalidate>
        <input class="folder-name-input" maxlength="60" autocomplete="off" value="${escapeHTML(defaultName)}"/>
        <div class="settings-actions">
          <button type="button" class="settings-button secondary" data-folder-cancel>${escapeHTML(t('cancel'))}</button>
          <button type="submit" class="settings-button"><svg><use href="#i-plus"/></svg><span>${escapeHTML(t('confirm'))}</span></button>
        </div>
      </form>`;
    const input = dialog.querySelector('.folder-name-input');
    let settled = false;
    const finish = value => {
      if (settled) return;
      settled = true;
      resolve(value);
      if (dialog.open) dialog.close();
      dialog.remove();
    };
    dialog.querySelector('[data-folder-cancel]').addEventListener('click', () => finish(null));
    dialog.querySelector('.relation-dialog-close').addEventListener('click', () => finish(null));
    dialog.addEventListener('cancel', event => { event.preventDefault(); finish(null); });
    dialog.addEventListener('close', () => finish(null));
    dialog.addEventListener('submit', event => {
      event.preventDefault();
      const value = input.value.trim();
      finish(value || null);
    });
    document.body.appendChild(dialog);
    dialog.showModal();
    input.focus();
    input.select();
  });
}

function bindShell() {
  $('#newButton').addEventListener('click', event => {
    event.stopPropagation();
    $('#createMenu').classList.toggle('open');
  });
  $$('#createMenu [data-create]').forEach(button => button.addEventListener('click', () => createItem(button.dataset.create)));
  $('#importNoteButton').addEventListener('click', importNoteFromFile);
  document.addEventListener('click', event => {
    if (!event.target.closest('#createMenu')) $('#createMenu').classList.remove('open');
  });
  document.addEventListener('click', event => {
    const modeButton = event.target.closest('[data-calendar-mode]');
    if (modeButton) {
      calendarViewMode = ['year', 'month', 'week', 'day'].includes(modeButton.dataset.calendarMode) ? modeButton.dataset.calendarMode : 'month';
      calendarMotion = 'zoom';
      renderList();
      return;
    }
    const shiftButton = event.target.closest('[data-calendar-shift]');
    if (shiftButton) {
      calendarMotion = Number(shiftButton.dataset.calendarShift) < 0 ? 'backward' : 'forward';
      shiftCalendarCursor(Number(shiftButton.dataset.calendarShift) < 0 ? -1 : 1);
      renderList();
      return;
    }
    if (event.target.closest('[data-calendar-today]')) {
      calendarCursor = calendarDate(todayISO());
      calendarMotion = 'today';
      renderList();
      return;
    }
    const mobileCalendar = currentView === 'calendar' && matchMedia('(max-width: 800px)').matches;
    if (mobileCalendar && calendarViewMode === 'year') {
      const monthRegion = event.target.closest('[data-calendar-year-month]');
      if (monthRegion) {
        calendarCursor = calendarDate(monthRegion.dataset.calendarYearMonth) || calendarCursor;
        calendarViewMode = 'month';
        calendarMotion = 'zoom';
        renderList();
      }
      return;
    }
    if (mobileCalendar && calendarViewMode === 'month') {
      const weekRegion = event.target.closest('[data-calendar-week]');
      if (weekRegion) {
        const dayRegion = event.target.closest('[data-calendar-cell]');
        calendarCursor = calendarDate(dayRegion?.dataset.calendarCell || weekRegion.dataset.calendarWeek) || calendarCursor;
        calendarViewMode = 'week';
        calendarMotion = 'zoom';
        renderList();
      }
      return;
    }
    if (mobileCalendar && calendarViewMode === 'week') {
      const dayRegion = event.target.closest('[data-calendar-day]');
      if (dayRegion) {
        calendarCursor = calendarDate(dayRegion.dataset.calendarDay) || calendarCursor;
        calendarViewMode = 'day';
        calendarMotion = 'zoom';
        renderList();
      }
      return;
    }
    const monthButton = event.target.closest('[data-calendar-month]');
    if (monthButton) {
      calendarCursor = calendarDate(monthButton.dataset.calendarMonth) || calendarCursor;
      calendarViewMode = 'month';
      calendarMotion = 'zoom';
      renderList();
      return;
    }
    const dateButton = event.target.closest('[data-calendar-date]');
    if (dateButton) {
      calendarCursor = calendarDate(dateButton.dataset.calendarDate) || calendarCursor;
      calendarViewMode = 'day';
      calendarMotion = 'zoom';
      renderList();
      return;
    }
    const subtaskButton = event.target.closest('[data-calendar-subtask-toggle]');
    if (subtaskButton) {
      const item = library.items.find(entry => entry.id === subtaskButton.dataset.calendarSubtaskToggle && entry.type === 'todo');
      toggleCalendarSubtask(item, subtaskButton.dataset.calendarSubtaskId);
      renderAll();
      return;
    }
    const toggleButton = event.target.closest('[data-calendar-toggle]');
    if (toggleButton) {
      const item = library.items.find(entry => entry.id === toggleButton.dataset.calendarToggle && entry.type === 'todo');
      if (!item) return;
      setTodoCompletion(item, !isTodoComplete(item));
      renderAll();
      return;
    }
    const noteButton = event.target.closest('[data-calendar-open-note]');
    if (noteButton) {
      openItem(noteButton.dataset.calendarOpenNote);
      return;
    }
    const todoButton = event.target.closest('[data-calendar-open]');
    if (todoButton) openItem(todoButton.dataset.calendarOpen);
  });
  document.addEventListener('click', event => {
    const navigation = event.target.closest('[data-view]');
    if (navigation) {
      currentView = navigation.dataset.view;
      if (currentView === 'calendar') calendarMotion = 'enter';
      mobileEditorOpen = false;
      renderSidebar(); renderList();
      const visible = getVisibleItems();
      if (!visible.some(item => item.id === selectedId)) selectedId = visible[0]?.id || null;
      if (currentView !== 'calendar') renderEditor();
    }
    const card = event.target.closest('.item-card');
    if (card) {
      selectedId = card.dataset.id;
      mobileEditorOpen = true;
      if (!matchMedia('(max-width: 800px)').matches) {
        $$('.item-card').forEach(entry => entry.classList.toggle('active', entry === card));
      }
      renderEditor();
    }
  });
  const refreshFilteredList = () => {
    renderList();
    const visible = getVisibleItems();
    if (!visible.some(item => item.id === selectedId)) { selectedId = visible[0]?.id || null; renderEditor(); }
  };
  $$('.filter-row [data-filter]').forEach(button => button.addEventListener('click', () => {
    currentFilter = button.dataset.filter;
    $$('.filter-row [data-filter]').forEach(entry => entry.classList.toggle('active', entry === button));
    refreshFilteredList();
  }));
  [
    ['todoPriorityFilter', value => { todoPriorityFilter = value; }],
    ['todoDueFilter', value => { todoDueFilter = value; }],
    ['todoFolderFilter', value => { todoFolderFilter = value; }],
    ['noteFolderFilter', value => { noteFolderFilter = value; }],
    ['noteRelationFilter', value => { noteRelationFilter = value; }],
    ['noteUpdatedFilter', value => { noteUpdatedFilter = value; }]
  ].forEach(([id, update]) => $(`#${id}`)?.addEventListener('change', event => {
    update(event.target.value);
    refreshFilteredList();
  }));
  $('#clearListFilters')?.addEventListener('click', () => {
    resetListFilters(listFilterContext());
    refreshFilteredList();
  });
  $('#listSortOrder')?.addEventListener('change', event => {
    listSortMode = listSortModes.includes(event.target.value) ? event.target.value : 'updated';
    settings.sortMode = listSortMode;
    persist();
    refreshFilteredList();
  });
  $('#todoShowCompleted')?.addEventListener('change', event => {
    settings.showCompletedTodos = event.target.checked;
    persist();
    refreshFilteredList();
  });
  // 设置页「显示已完成待办」与筛选栏双向同步。
  const showCompletedSettingSync = () => {
    const settingBox = document.getElementById('showCompletedSetting');
    if (settingBox) settingBox.checked = settings.showCompletedTodos;
  };
  $('#todoCompletedToggle')?.addEventListener('click', () => setTimeout(showCompletedSettingSync, 0));
  $('#searchInput').addEventListener('input', event => {
    searchQuery = event.target.value.trim(); renderList();
    const visible = getVisibleItems();
    if (!visible.some(item => item.id === selectedId)) { selectedId = visible[0]?.id || null; renderEditor(); }
  });
  $('#addFolder').addEventListener('click', async () => {
    const name = await askClassificationName(t('folderDefault'));
    if (!name) return;
    const palette = ['#6f8a72', '#b68b54', '#7a7799', '#a87876', '#668792'];
    const folder = { id: uid(), name, color: palette[library.folders.length % palette.length] };
    library.folders.push(folder);
    logHistory('folder-created', folder.name);
    currentView = `folder:${folder.id}`;
    persist(); renderAll(); showToast(t('folderAdded'));
  });
  matchMedia('(max-width: 800px)').addEventListener?.('change', () => {
    if (currentView !== 'calendar') return;
    renderList();
  });
  bindDeleteConfirmDialog();
  document.addEventListener('keydown', event => {
    if (isImeComposing(event)) return;
    const mod = event.metaKey || event.ctrlKey;
    if (!mod) {
      if (event.key === 'Escape') $('#createMenu').classList.remove('open');
      return;
    }
    // Keep the global shortcuts from hijacking keys inside the editor, quick capture
    // and settings inputs; ignore auto-repeat so holding the combo creates one item.
    if (event.repeat) return;
    if (event.target?.closest?.('input, textarea, select, [contenteditable="true"]')) return;
    if (document.querySelector('dialog[open]')) return;
    if (event.key.toLowerCase() === 'n') { event.preventDefault(); createItem('note'); }
    if (event.key.toLowerCase() === 'k') { event.preventDefault(); $('#searchInput').focus(); }
  });
}

function getSyncBridge() {
  if (window.actaDesktop) return window.actaDesktop;
  const nativeSync = window.Capacitor?.Plugins?.ActaSync;
  if (!nativeSync) return null;
  return {
    chooseSyncFolder: async () => {
      const result = await nativeSync.chooseSyncFolder();
      return result?.uri ? { folder: result.uri, label: result.name || result.uri } : null;
    },
    uploadLibrary: (folder, library) => nativeSync.uploadLibrary({ folder, library }),
    downloadLibrary: (folder) => nativeSync.downloadLibrary({ folder }),
    inspectFolder: (folder) => nativeSync.inspectFolder({ folder })
  };
}

// Android 局域网同步桥：与桌面端 window.actaDesktop.lanSync 同一套 API 面，
// 原生实现在 ActaLanPlugin（UDP 发现 + 极简 HTTP + 协议 v2 两段式确认）。
// 事件名与载荷结构与桌面端一致，interface.js 的局域网逻辑两端共用。
(function initAndroidLanBridge() {
  const native = window.Capacitor?.Plugins?.ActaLan;
  if (!native) return;
  // 大档案数据跨 WebView 桥单次传输会卡死/失败，因此统一分块传递。
  const LAN_CHUNK_CHARS = 400000;
  const sendInChunks = async (begin, append, text) => {
    const { handle } = await begin({ size: text.length });
    for (let offset = 0; offset < text.length; offset += LAN_CHUNK_CHARS) {
      const result = await append({ handle, chunk: text.slice(offset, offset + LAN_CHUNK_CHARS) });
      if (result?.done) return result;
    }
    return null;
  };
  const lanSync = {
    startService: (profiles, trusted) => native.startService({ profiles, trusted }),
    updateMeta: (profiles, trusted) => native.updateMeta({ profiles, trusted }),
    stopService: () => native.stopService(),
    serviceStatus: () => native.serviceStatus(),
    discover: (timeoutMs = 1800) => native.discover({ timeoutMs }).then(result => result?.peers || []),
    fetchInfo: (ip, port, session) => native.fetchInfo({ ip, port, session }).then(result => result?.info || {}),
    pushPlan: (ip, port, session, plan) => native.pushPlan({ ip, port, session, plan }).then(result => result?.token || ''),
    pushData: async (ip, port, session, token, bundle) => {
      const result = await sendInChunks(
        payload => native.pushDataBegin({ ...payload, ip, port, session, token }),
        payload => native.pushDataAppend(payload),
        JSON.stringify(bundle)
      );
      if (!result?.applied) throw new Error('对方写入数据失败。');
      return true;
    },
    fetchProfileBundle: (ip, port, session, profileId) => native.fetchProfileBundle({ ip, port, session, profileId }).then(result => result?.bundle || null),
    decideIncoming: (accept) => native.decideIncoming({ accept }),
    provideBundle: async (requestId, result) => {
      if (!result?.ok) return native.provideBundle({ requestId, ok: false, bundle: null, error: result?.error ?? '档案不可用' });
      await sendInChunks(
        payload => native.provideBundleBegin({ ...payload, requestId }),
        payload => native.provideBundleAppend(payload),
        JSON.stringify(result.bundle)
      );
    },
    readBundleChunk: (requestId, offset) => native.readBundleChunk({ requestId, offset }),
    acceptIncoming: () => native.acceptIncoming().then(result => (result?.bundle ? result.bundle : result)),
    confirmIncoming: () => native.confirmIncoming(),
    rejectIncoming: () => native.rejectIncoming(),
    backupLocal: (bundle, profileName) => native.backupLocal({ bundle, profileName })
  };
  const listen = (event, handler) => (native.addListener
    ? native.addListener(event, payload => handler({ payload }))
    : Promise.resolve(() => {}));
  window.actaMobileLan = {
    lanSync,
    onLanIncoming: handler => listen('lanIncoming', handler),
    onLanData: handler => listen('lanData', handler),
    onLanFetch: handler => listen('lanFetch', handler),
    onLanProgress: handler => listen('lanProgress', handler),
    onLanRejected: handler => listen('lanRejected', handler)
  };
})();

watchEditorPaneWidth();
bindShell();
