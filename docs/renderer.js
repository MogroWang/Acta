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
    saved: '已保存', saving: '正在保存…', new: '新建', newNote: '新建笔记', newNoteHint: '记录想法与灵感',
    newTodo: '新建待办', newTodoHint: '拆解目标与行动', inbox: '收集箱', today: '今天', todos: '待办', notes: '笔记', completed: '已完成',
    folders: '归类', classify: '归类', cloudSync: '网盘同步', notConfigured: '尚未配置', localWorkspace: '行记数据', workspace: '行记数据', actaData: '行记数据',
    search: '搜索笔记和待办…', all: '全部', localFirst: '本地优先', syncTitle: '连接你的网盘',
    syncCopy: '选择设备本地、局域网或系统已挂载的网络文件夹。Acta 会在其中读写完整数据。',
    chooseFolder: '选择同步文件夹', noFolder: '尚未选择位置', download: '从网盘下载', upload: '上传到网盘', safeLocal: '数据默认只保存在你的设备上',
    item: '个项目', note: '笔记', todo: '待办', justNow: '刚刚', yesterday: '昨天', noItems: '这里还没有内容', noItemsHint: '新建一则笔记或待办，开始记录。',
    selectItem: '选择一项开始编辑', selectItemHint: '你的想法与行动会在这里展开。', untitledNote: '无标题笔记', untitledTodo: '新的待办',
    created: '创建于', updated: '更新于', dueDate: '截止日期', priority: '优先级', tags: '标签', high: '高', medium: '中', low: '低',
    progress: '任务进度', done: '已完成', addTask: '添加子任务', taskPlaceholder: '输入一个具体行动…', description: '补充说明',
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
    importFailed: '导入失败', exportFailed: '导出失败', fileTooLarge: '文件不能超过 5 MB', invalidNoteFile: '无法读取这份笔记'
  },
  en: {
    saved: 'Saved', saving: 'Saving…', new: 'New', newNote: 'New note', newNoteHint: 'Capture ideas and sparks',
    newTodo: 'New task', newTodoHint: 'Turn goals into action', inbox: 'Inbox', today: 'Today', todos: 'Tasks', notes: 'Notes', completed: 'Completed',
    folders: 'Classify', classify: 'Classify', cloudSync: 'Cloud sync', notConfigured: 'Not configured', localWorkspace: 'Acta Data', workspace: 'Acta Data', actaData: 'Acta Data',
    search: 'Search notes and tasks…', all: 'All', localFirst: 'Local first', syncTitle: 'Connect your cloud drive',
    syncCopy: 'Choose a device folder, LAN location, or mounted network folder. Acta reads and writes the complete data there.',
    chooseFolder: 'Choose sync folder', noFolder: 'No location selected', download: 'Download from cloud', upload: 'Upload to cloud', safeLocal: 'Your data stays on this device by default',
    item: 'items', note: 'Note', todo: 'Task', justNow: 'Just now', yesterday: 'Yesterday', noItems: 'Nothing here yet', noItemsHint: 'Create a note or task to get started.',
    selectItem: 'Select something to edit', selectItemHint: 'Your thoughts and actions will unfold here.', untitledNote: 'Untitled note', untitledTodo: 'New task',
    created: 'Created', updated: 'Updated', dueDate: 'Due date', priority: 'Priority', tags: 'Tags', high: 'High', medium: 'Medium', low: 'Low',
    progress: 'Task progress', done: 'complete', addTask: 'Add subtask', taskPlaceholder: 'Type a concrete action…', description: 'Notes',
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
    importFailed: 'Import failed', exportFailed: 'Export failed', fileTooLarge: 'Files must be under 5 MB', invalidNoteFile: 'This note could not be read'
  }
};

const todayISO = () => {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000;
  return new Date(now - offset).toISOString().slice(0, 10);
};

const daysFromToday = (days) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date - offset).toISOString().slice(0, 10);
};

function createDefaultLibrary() {
  const now = new Date();
  return {
    version: 1,
    folders: [
      { id: 'ideas', nameKey: 'inboxFolder', color: '#b68b54' },
      { id: 'work', nameKey: 'workFolder', color: '#6f8a72' },
      { id: 'life', nameKey: 'lifeFolder', color: '#a87876' },
      { id: 'reading', nameKey: 'readingFolder', color: '#7a7799' }
    ],
    items: [
      {
        id: 'welcome-note', type: 'note', folderId: 'ideas', title: '欢迎来到 Acta',
        body: '<p>Acta 把<strong>笔记</strong>和<strong>待办</strong>放进同一份安静的行记数据。</p><h2>记录，然后行动</h2><p>左侧用归类管理主题，中间让所有内容自然地汇聚，右侧则专注于当下。你可以随时在中文、繁体中文与英文之间切换。</p><p>选择网盘同步文件夹后，也可以把资料库带到其他设备。</p>',
        tags: ['Acta', '开始'], createdAt: new Date(now - 86400000 * 2).toISOString(), updatedAt: new Date(now - 3600000).toISOString()
      },
      {
        id: 'launch-plan', type: 'todo', folderId: 'work', title: '整理 Acta 原型反馈',
        due: todayISO(), priority: 'high', tags: ['Acta', '原型'], notes: '把反馈归纳为体验、功能和跨平台三组，再安排下一轮迭代。',
        tasks: [
          { id: 't1', text: '体验完整的笔记与待办流程', done: true },
          { id: 't2', text: '记录三栏布局的使用感受', done: true },
          { id: 't3', text: '测试网盘目录上传与下载', done: false },
          { id: 't4', text: '确定下一个版本的范围', done: false }
        ],
        completed: false, createdAt: new Date(now - 86400000).toISOString(), updatedAt: new Date(now - 1800000).toISOString()
      },
      {
        id: 'reading-note', type: 'note', folderId: 'reading', title: '关于注意力的三条摘记',
        body: '<p>注意力不是一块需要填满的容器，而是一种主动的选择。</p><ul><li>把入口变少，才能让重要的事更容易出现。</li><li>记录的意义，是让大脑不必持续记住。</li><li>系统越简单，越有可能长期使用。</li></ul>',
        tags: ['阅读', '思考'], createdAt: new Date(now - 86400000 * 3).toISOString(), updatedAt: new Date(now - 86400000).toISOString()
      },
      {
        id: 'weekend-list', type: 'todo', folderId: 'life', title: '周末的小计划',
        due: daysFromToday(2), priority: 'low', tags: ['生活'], notes: '留一点没有安排的时间。',
        tasks: [
          { id: 't5', text: '去市场买一束花', done: false },
          { id: 't6', text: '整理书桌和书架', done: false },
          { id: 't7', text: '散步四十分钟', done: false }
        ],
        completed: false, createdAt: new Date(now - 86400000 * 2).toISOString(), updatedAt: new Date(now - 7200000).toISOString()
      },
      {
        id: 'idea-note', type: 'note', folderId: 'ideas', title: '把每日回顾做得更轻',
        body: '<p>或许不需要复杂模板。每天只回答三个问题：今天完成了什么？什么值得记住？明天最重要的一步是什么？</p>',
        tags: ['产品想法'], createdAt: new Date(now - 86400000 * 4).toISOString(), updatedAt: new Date(now - 86400000 * 2).toISOString()
      }
    ]
  };
}

function loadJSON(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) || fallback; }
  catch { return fallback; }
}

function normalizeLibrary(candidate) {
  if (!candidate || !Array.isArray(candidate.items) || !Array.isArray(candidate.folders)) return createDefaultLibrary();
  const normalized = { ...candidate, version: Math.max(Number(candidate.version) || 1, 1) };
  const ids = new Set(candidate.items.map(item => item?.id).filter(Boolean));
  normalized.items = candidate.items.filter(item => item && ids.has(item.id) && (item.type === 'note' || item.type === 'todo')).map(item => ({
    ...item,
    tags: Array.isArray(item.tags) ? item.tags.filter(tag => typeof tag === 'string') : [],
    linkedIds: Array.isArray(item.linkedIds) ? [...new Set(item.linkedIds.filter(id => typeof id === 'string' && id !== item.id && ids.has(id)))] : [],
    ...(item.type === 'todo' ? {
      priority: ['high', 'medium', 'low'].includes(item.priority) ? item.priority : 'medium',
      tasks: Array.isArray(item.tasks) ? item.tasks : [],
      completed: Boolean(item.completed)
    } : { body: typeof item.body === 'string' ? item.body : '<p><br></p>' })
  }));

  const itemById = new Map(normalized.items.map(item => [item.id, item]));
  normalized.items.forEach(item => {
    item.linkedIds = item.linkedIds.filter(id => itemById.get(id)?.type && itemById.get(id).type !== item.type);
    item.linkedIds.forEach(id => {
      const other = itemById.get(id);
      if (other && !other.linkedIds.includes(item.id)) other.linkedIds.push(item.id);
    });
  });
  return normalized;
}

let library = normalizeLibrary(loadJSON(STORAGE_KEY, createDefaultLibrary()));
let settings = loadJSON(SETTINGS_KEY, { language: 'zh', syncFolder: '', lastSyncedAt: '' });
let currentView = 'inbox';
let currentFilter = 'all';
let selectedId = library.items[0]?.id || null;
let searchQuery = '';
let mobileEditorOpen = false;
let saveTimer;
let toastTimer;

const t = (key) => dictionaries[settings.language][key] ?? key;
const uid = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
const escapeHTML = (value = '') => String(value).replace(/[&<>'"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));
const stripHTML = (html = '') => {
  const node = document.createElement('div');
  node.innerHTML = html;
  return (node.textContent || '').trim();
};
const isSafeHref = (value = '') => /^(https?:\/\/|mailto:)/i.test(String(value).trim());

function noteHTMLToMarkdown(html = '') {
  const root = document.createElement('div');
  root.innerHTML = html;
  const renderChildren = (node) => [...node.childNodes].map(renderNode).join('');
  const renderList = (node, ordered) => [...node.children].filter(child => child.tagName === 'LI').map((child, index) => {
    const content = renderChildren(child).trim().replace(/\n+/g, '\n  ');
    return `${ordered ? `${index + 1}.` : '-'} ${content}`;
  }).join('\n') + '\n\n';
  const renderNode = (node) => {
    if (node.nodeType === Node.TEXT_NODE) return (node.nodeValue || '').replace(/\u00a0/g, ' ');
    if (node.nodeType !== Node.ELEMENT_NODE) return '';
    const tag = node.tagName;
    const content = renderChildren(node);
    if (tag === 'BR') return '\n';
    if (tag === 'P' || tag === 'DIV') return `${content.trim()}\n\n`;
    if (/^H[1-6]$/.test(tag)) return `${'#'.repeat(Number(tag.slice(1)))} ${content.trim()}\n\n`;
    if (tag === 'STRONG' || tag === 'B') return `**${content}**`;
    if (tag === 'EM' || tag === 'I') return `*${content}*`;
    if (tag === 'UL') return renderList(node, false);
    if (tag === 'OL') return renderList(node, true);
    if (tag === 'A') {
      const href = node.getAttribute('href') || '';
      return isSafeHref(href) ? `[${content}](${href})` : content;
    }
    if (tag === 'BLOCKQUOTE') return `${content.trim().split('\n').map(line => `> ${line}`).join('\n')}\n\n`;
    if (tag === 'PRE') return `\`\`\`\n${node.textContent || ''}\n\`\`\`\n\n`;
    return content;
  };
  return renderChildren(root).replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
}

function markdownInline(value = '') {
  const links = [];
  let text = String(value).replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_match, label, href) => {
    if (!isSafeHref(href)) return label;
    const token = `\u0000${links.length}\u0000`;
    links.push(`<a href="${escapeHTML(href.trim())}">${escapeHTML(label)}</a>`);
    return token;
  });
  text = escapeHTML(text)
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/__([^_]+)__/g, '<strong>$1</strong>')
    .replace(/(^|[^*])\*([^*]+)\*/g, '$1<em>$2</em>')
    .replace(/(^|[^_])_([^_]+)_/g, '$1<em>$2</em>')
    .replace(/`([^`]+)`/g, '<code>$1</code>');
  return text.replace(/\u0000(\d+)\u0000/g, (_match, index) => links[Number(index)] || '');
}

function markdownToNoteHTML(markdown = '') {
  const lines = String(markdown).replace(/\r\n?/g, '\n').split('\n');
  const output = [];
  let paragraph = [];
  let listType = '';
  let inCode = false;
  let codeLines = [];
  const flushParagraph = () => {
    if (!paragraph.length) return;
    output.push(`<p>${paragraph.map(markdownInline).join('<br>')}</p>`);
    paragraph = [];
  };
  const closeList = () => {
    if (!listType) return;
    output.push(`</${listType}>`);
    listType = '';
  };
  lines.forEach(line => {
    if (/^\s*```/.test(line)) {
      flushParagraph(); closeList();
      if (inCode) {
        output.push(`<pre><code>${escapeHTML(codeLines.join('\n'))}</code></pre>`);
        codeLines = [];
      }
      inCode = !inCode;
      return;
    }
    if (inCode) { codeLines.push(line); return; }
    const heading = line.match(/^(#{1,6})\s+(.+)$/);
    const unordered = line.match(/^\s*[-+*]\s+(.+)$/);
    const ordered = line.match(/^\s*\d+[.)]\s+(.+)$/);
    if (heading) {
      flushParagraph(); closeList();
      output.push(`<h${heading[1].length}>${markdownInline(heading[2])}</h${heading[1].length}>`);
    } else if (unordered || ordered) {
      flushParagraph();
      const nextListType = unordered ? 'ul' : 'ol';
      if (listType !== nextListType) { closeList(); output.push(`<${nextListType}>`); listType = nextListType; }
      output.push(`<li>${markdownInline((unordered || ordered)[1])}</li>`);
    } else if (!line.trim()) {
      flushParagraph(); closeList();
    } else {
      closeList();
      paragraph.push(line);
    }
  });
  if (inCode && codeLines.length) output.push(`<pre><code>${escapeHTML(codeLines.join('\n'))}</code></pre>`);
  flushParagraph(); closeList();
  return output.join('') || '<p><br></p>';
}

function validDate(value) {
  return typeof value === 'string' && !Number.isNaN(Date.parse(value)) ? value : '';
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
const folderName = (folder) => folder ? (folder.nameKey ? t(folder.nameKey) : folder.name) : t('inbox');
const folderShortName = (folder) => {
  if (!folder) return '';
  const custom = Array.from(String(folder.shortName || '').trim()).slice(0, 3).join('');
  if (custom) return custom;
  const name = String(folderName(folder) || '').trim();
  const words = name.split(/\s+/).filter(Boolean);
  if (words.length > 1) return words.slice(0, 3).map(word => Array.from(word)[0]).join('').toLocaleUpperCase();
  return Array.from(name.replace(/\s+/g, '')).slice(0, 2).join('').toLocaleUpperCase();
};
const isTodoComplete = (item) => item?.type === 'todo' && (Boolean(item.completed) || ((item.tasks || []).length > 0 && item.tasks.every(task => task.done)));
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

function translateStaticUI() {
  document.documentElement.lang = settings.language === 'zh' ? 'zh-CN' : 'en';
  $$('[data-i18n]').forEach(node => node.textContent = t(node.dataset.i18n));
  $$('[data-i18n-placeholder]').forEach(node => node.placeholder = t(node.dataset.i18nPlaceholder));
}

function viewTitle() {
  if (currentView.startsWith('folder:')) return folderName(getFolder(currentView.split(':')[1]));
  return ({ inbox: t('inbox'), today: t('viewToday'), todos: t('viewTodos'), notes: t('viewNotes'), completed: t('completed') })[currentView];
}

function getVisibleItems() {
  let items = [...library.items];
  if (currentView === 'inbox') items = items.filter(item => !isTodoComplete(item));
  if (currentView === 'today') items = items.filter(item => item.type === 'todo' && item.due === todayISO() && !isTodoComplete(item));
  if (currentView === 'todos') items = items.filter(item => item.type === 'todo' && !isTodoComplete(item));
  if (currentView === 'notes') items = items.filter(item => item.type === 'note');
  if (currentView === 'completed') items = items.filter(item => isTodoComplete(item));
  if (currentView.startsWith('folder:')) items = items.filter(item => item.folderId === currentView.split(':')[1]);
  if (!['todos', 'notes', 'completed'].includes(currentView) && currentFilter !== 'all') items = items.filter(item => item.type === currentFilter);
  if (searchQuery) {
    const query = searchQuery.toLocaleLowerCase();
    items = items.filter(item => {
      const content = item.type === 'note' ? stripHTML(item.body) : `${item.notes || ''} ${(item.tasks || []).map(task => task.text).join(' ')}`;
      const linkedTitles = getLinkedItems(item).map(linked => linked.title).join(' ');
      return `${item.title} ${content} ${linkedTitles} ${(item.tags || []).join(' ')}`.toLocaleLowerCase().includes(query);
    });
  }
  const taskFocused = currentView === 'today' || currentView === 'todos' || currentView === 'completed' || currentFilter === 'todo';
  return items.sort((a, b) => {
    if (taskFocused && a.type === 'todo' && b.type === 'todo') {
      const completionDifference = Number(isTodoComplete(a)) - Number(isTodoComplete(b));
      if (completionDifference) return completionDifference;
      const priorityDifference = priorityRank(a.priority) - priorityRank(b.priority);
      if (priorityDifference) return priorityDifference;
      const dueDifference = String(a.due || '9999-12-31').localeCompare(String(b.due || '9999-12-31'));
      if (dueDifference) return dueDifference;
    }
    return new Date(b.updatedAt) - new Date(a.updatedAt);
  });
}

function renderSidebar() {
  $('#inboxCount').textContent = library.items.filter(item => !isTodoComplete(item)).length;
  $('#todayCount').textContent = library.items.filter(item => item.type === 'todo' && item.due === todayISO() && !isTodoComplete(item)).length;
  $('#todoCount').textContent = library.items.filter(item => item.type === 'todo' && !isTodoComplete(item)).length;
  $('#noteCount').textContent = library.items.filter(item => item.type === 'note').length;
  $('#completedCount').textContent = library.items.filter(isTodoComplete).length;

  $$('#smartNav button').forEach(button => button.classList.toggle('active', button.dataset.view === currentView));
  $('#folderNav').innerHTML = library.folders.map(folder => {
    const count = library.items.filter(item => item.folderId === folder.id).length;
    return `<button data-view="folder:${escapeHTML(folder.id)}" class="${currentView === `folder:${folder.id}` ? 'active' : ''}" title="${escapeHTML(folderName(folder))}" aria-label="${escapeHTML(folderName(folder))}">
      <span><i class="folder-dot" style="background:${escapeHTML(folder.color)};color:${escapeHTML(folder.color)}"><b class="folder-short-name">${escapeHTML(folderShortName(folder))}</b></i><span>${escapeHTML(folderName(folder))}</span></span><em>${count}</em>
    </button>`;
  }).join('');

}

function itemPreview(item) {
  if (item.type === 'note') return stripHTML(item.body) || t('notePlaceholder');
  const open = (item.tasks || []).filter(task => !task.done).map(task => task.text).filter(Boolean);
  return open[0] || item.notes || (isTodoComplete(item) ? t('done') : t('taskPlaceholder'));
}

function renderList() {
  const items = getVisibleItems();
  $('#viewTitle').textContent = viewTitle();
  $('#viewEyebrow').textContent = currentView.startsWith('folder:') ? t('classify') : (window.actaDataName || t('actaData'));
  $('#itemCountLabel').textContent = `${items.length} ${t('item')}`;
  const list = $('#itemList');
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
    const date = item.type === 'todo' && item.due ? formatDate(item.due, true) : formatDate(item.updatedAt, true);
    const active = !matchMedia('(max-width: 800px)').matches && item.id === selectedId;
    return `<button class="item-card ${active ? 'active' : ''} ${done ? 'completed-card' : ''} ${item.type === 'todo' ? `priority-${item.priority || 'medium'}` : ''}" data-id="${escapeHTML(item.id)}" style="animation-delay:${Math.min(index * 18, 100)}ms">
      <div class="card-top"><span class="type-pill ${item.type}"><svg><use href="#i-${item.type === 'todo' ? 'check' : 'note'}"/></svg>${t(item.type)}</span>${item.type === 'todo' ? `<span class="priority-pill ${item.priority || 'medium'}">${t(item.priority || 'medium')}</span>` : ''}<span class="card-date">${escapeHTML(date)}</span></div>
      <h3>${escapeHTML(item.title || (item.type === 'todo' ? t('untitledTodo') : t('untitledNote')))}</h3>
      <p>${escapeHTML(itemPreview(item))}</p>
      <div class="card-bottom"><span class="mini-folder"><i class="folder-dot" style="background:${folder?.color || '#999'}"></i>${escapeHTML(folderName(folder))}</span>
      ${linkedCount ? `<span class="link-count"><svg><use href="#i-link"/></svg>${linkedCount}</span>` : ''}
      ${item.type === 'todo' ? `<span>${completed}/${total}</span><span class="mini-progress"><i style="width:${progress}%"></i></span>` : `<span><svg><use href="#i-tag"/></svg> ${(item.tags || []).length}</span>`}</div>
    </button>`;
  }).join('');
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
      <button id="deleteItem" title="${t('deleted')}"><svg><use href="#i-trash"/></svg></button>
      <button title="${t('archive')}"><svg><use href="#i-more"/></svg></button>
    </div>
  </div>`;
}

function linkedItemsSection(item) {
  const linkedItems = getLinkedItems(item);
  const targetType = item.type === 'note' ? 'todo' : 'note';
  const availableItems = library.items.filter(entry => entry.type === targetType && entry.id !== item.id && !linkedItems.some(linked => linked.id === entry.id));
  return `<section class="linked-section">
    <div class="linked-head"><span><svg><use href="#i-link"/></svg><b>${t('linkedItems')}</b><em>${linkedItems.length}</em></span></div>
    <div class="link-picker">
      <select id="linkItemSelect" aria-label="${t(targetType === 'todo' ? 'chooseTodo' : 'chooseNote')}">
        <option value="">${t(targetType === 'todo' ? 'chooseTodo' : 'chooseNote')}</option>
        ${availableItems.map(entry => `<option value="${escapeHTML(entry.id)}">${escapeHTML(entry.title || (entry.type === 'todo' ? t('untitledTodo') : t('untitledNote')))}</option>`).join('')}
      </select>
      <button id="addItemLink" disabled><svg><use href="#i-plus"/></svg>${t(targetType === 'todo' ? 'linkTodo' : 'linkNote')}</button>
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
  const item = getItem();
  const pane = $('#editorPane');
  if (!item) {
    pane.classList.remove('mobile-open');
    pane.innerHTML = `<div class="empty-editor"><div><span><svg><use href="#i-spark"/></svg></span><h2>${t('selectItem')}</h2><p>${t('selectItemHint')}</p></div></div>`;
    return;
  }
  pane.innerHTML = item.type === 'note' ? noteEditor(item) : todoEditor(item);
  pane.classList.toggle('mobile-open', mobileEditorOpen);
  bindEditor(item);
}

function autoSizeTitle() {
  const title = $('#editorTitle');
  if (!title) return;
  title.style.height = 'auto';
  title.style.height = `${title.scrollHeight}px`;
}

function isImeComposing(event) {
  return Boolean(event.isComposing || event.keyCode === 229);
}

function touchItem(item) {
  item.updatedAt = new Date().toISOString();
  persist();
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
    updateCard(item);
  });
  $('#deleteItem')?.addEventListener('click', () => {
    if (!confirm(t('deleteConfirm'))) return;
    library.items.forEach(entry => { entry.linkedIds = (entry.linkedIds || []).filter(id => id !== item.id); });
    library.items = library.items.filter(entry => entry.id !== item.id);
    selectedId = getVisibleItems()[0]?.id || library.items[0]?.id || null;
    persist(); renderAll(); showToast(t('deleted'));
  });
  $('#completeItem')?.addEventListener('click', () => {
    const nextState = !isTodoComplete(item);
    item.completed = nextState;
    (item.tasks || []).forEach(task => task.done = nextState);
    touchItem(item); renderAll();
  });

  $('#classificationFolder')?.addEventListener('change', event => {
    item.folderId = event.target.value;
    touchItem(item);
    const folderLabel = $('.editor-folder');
    if (folderLabel) folderLabel.textContent = folderName(getFolder(item.folderId));
    renderSidebar();
    renderList();
  });
  $('#classificationTags')?.addEventListener('change', event => {
    item.tags = event.target.value.split(',').map(tag => tag.trim()).filter(Boolean);
    touchItem(item);
    updateCard(item);
  });

  if (item.type === 'note') bindNoteEditor(item);
  else bindTodoEditor(item);
  bindLinkedItems(item);
}

function bindNoteEditor(item) {
  const body = $('#noteBody');
  $('#exportNote')?.addEventListener('click', () => exportNoteToFile(item));
  body.addEventListener('input', () => {
    item.body = body.innerHTML;
    const text = stripHTML(item.body);
    $('#noteStats').textContent = `${text.split(/\s+/).filter(Boolean).length} ${t('words')} · ${text.length} ${t('chars')}`;
    touchItem(item); updateCard(item);
  });
  $$('.note-toolbar button').forEach(button => button.addEventListener('mousedown', event => {
    event.preventDefault();
    const command = button.dataset.command;
    let value = button.dataset.value || null;
    if (command === 'createLink') value = prompt('URL', 'https://');
    if (value !== null || command !== 'createLink') document.execCommand(command, false, value);
    body.focus();
    item.body = body.innerHTML;
    touchItem(item); updateCard(item);
  }));
}

function addTask(item) {
  item.tasks ||= [];
  item.completed = false;
  item.tasks.push({ id: uid(), text: '', done: false });
  touchItem(item); renderEditor(); renderList();
  requestAnimationFrame(() => {
    const rows = $$('.task-text');
    rows.at(-1)?.focus();
  });
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
  currentView = isTodoComplete(target) ? 'completed' : (target.type === 'todo' ? 'todos' : 'notes');
  currentFilter = 'all';
  searchQuery = '';
  mobileEditorOpen = true;
  $('#searchInput').value = '';
  $$('.filter-row button').forEach(button => button.classList.toggle('active', button.dataset.filter === 'all'));
  renderAll();
}

function bindLinkedItems(item) {
  const select = $('#linkItemSelect');
  const addButton = $('#addItemLink');
  select?.addEventListener('change', () => { addButton.disabled = !select.value; });
  addButton?.addEventListener('click', () => {
    const linked = library.items.find(entry => entry.id === select.value && entry.type !== item.type);
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
    currentFilter = 'all';
    searchQuery = '';
    mobileEditorOpen = true;
    $('#searchInput').value = '';
    $$('.filter-row button').forEach(button => button.classList.toggle('active', button.dataset.filter === 'all'));
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
    const navigation = event.target.closest('[data-view]');
    if (navigation) {
      currentView = navigation.dataset.view;
      mobileEditorOpen = false;
      renderSidebar(); renderList();
      const visible = getVisibleItems();
      if (!visible.some(item => item.id === selectedId)) { selectedId = visible[0]?.id || null; renderEditor(); }
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
  $$('.filter-row button').forEach(button => button.addEventListener('click', () => {
    currentFilter = button.dataset.filter;
    $$('.filter-row button').forEach(entry => entry.classList.toggle('active', entry === button));
    renderList();
    const visible = getVisibleItems();
    if (!visible.some(item => item.id === selectedId)) { selectedId = visible[0]?.id || null; renderEditor(); }
  }));
  $('#searchInput').addEventListener('input', event => {
    searchQuery = event.target.value.trim(); renderList();
    const visible = getVisibleItems();
    if (!visible.some(item => item.id === selectedId)) { selectedId = visible[0]?.id || null; renderEditor(); }
  });
  $('#addFolder').addEventListener('click', () => {
    const name = prompt(t('folderPrompt'), t('folderDefault'))?.trim();
    if (!name) return;
    const palette = ['#6f8a72', '#b68b54', '#7a7799', '#a87876', '#668792'];
    const folder = { id: uid(), name, color: palette[library.folders.length % palette.length] };
    library.folders.push(folder); currentView = `folder:${folder.id}`;
    persist(); renderAll(); showToast(t('folderAdded'));
  });
  document.addEventListener('keydown', event => {
    if (isImeComposing(event)) return;
    const mod = event.metaKey || event.ctrlKey;
    if (mod && event.key.toLowerCase() === 'n') { event.preventDefault(); createItem('note'); }
    if (mod && event.key.toLowerCase() === 'k') { event.preventDefault(); $('#searchInput').focus(); }
    if (event.key === 'Escape') $('#createMenu').classList.remove('open');
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
    downloadLibrary: (folder) => nativeSync.downloadLibrary({ folder })
  };
}

bindShell();
