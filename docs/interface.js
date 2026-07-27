(() => {
  const uiStorageKey = 'acta.interface.settings.v1';
  const defaultUISettings = {
    defaultView: 'inbox', compact: false, reduceMotion: false, theme: 'mono-light',
    customPaper: '#fbfaf6', customSidebar: '#ebe7dc', customAccent: '#526b55',
    customTodo: '#4f86a8', customTodoSoft: '#dceef8', customNote: '#987329', customNoteSoft: '#fff0bd', customCalendar: '#4f7656', customCalendarSoft: '#dcebdd',
    appIconPreset: 'default', customAppIcon: '',
    appFont: 'system', customFont: 'Inter', appFontSize: 14,
    noteHeadingH1Size: 32, noteHeadingH2Size: 24, noteHeadingH3Size: 19, noteHeadingStyle: 'classic',
    noteToolbarPosition: 'bottom', noteToolbarShowLabels: false,
    oneDriveFolder: '', oneDriveLabel: '', workspaceLabel: '',
    dataProfiles: [], activeDataProfileId: '', cloudSyncMode: 'onedrive', webDavServer: '', webDavUsername: '', autoSync: false, autoSyncInterval: 5, listPaneWidth: 344, sidebarCollapsed: false, language: ['zh', 'zh-Hant', 'en'].includes(settings.language) ? settings.language : 'zh'
  };
  let uiSettings = { ...defaultUISettings };
  try { uiSettings = { ...uiSettings, ...(JSON.parse(localStorage.getItem(uiStorageKey)) || {}) }; } catch { /* Use safe defaults. */ }
  const legacyAppIconPresets = { classic:'default', forest:'positive', sunset:'outline', midnight:'original' };
  const migratedAppIconPreset = Boolean(legacyAppIconPresets[uiSettings.appIconPreset]);
  if (migratedAppIconPreset) uiSettings.appIconPreset = legacyAppIconPresets[uiSettings.appIconPreset];
  let currentAppIconURL = './icons/icon-192.png';
  const migratedTodayView = uiSettings.defaultView === 'today';
  if (migratedTodayView) uiSettings.defaultView = 'calendar';

  const byId = id => document.getElementById(id);
  const settingsModal = byId('settingsModal');
  const saveUISettings = () => localStorage.setItem(uiStorageKey, JSON.stringify(uiSettings));
  if (migratedTodayView || migratedAppIconPreset) saveUISettings();
  const saveRendererSettings = () => localStorage.setItem(SETTINGS_KEY, JSON.stringify({ ...settings, language: uiSettings.language === 'zh-Hant' ? 'zh' : uiSettings.language }));
  Object.assign(dictionaries.zh, { syncTitle:'连接本地文件夹', syncCopy:'选择设备本地、局域网或系统已挂载的网络文件夹。Acta 会在其中读写清单、归类、notes 和 todos 完整数据文件夹。', download:'下载完整数据文件夹', upload:'上传完整数据文件夹' });
  Object.assign(dictionaries.en, { syncTitle:'Connect a local folder', syncCopy:'Choose a device folder, LAN location, or mounted network folder. Acta reads and writes the complete manifest, classifications, notes, and todos data folder there.', download:'Download complete data folder', upload:'Upload complete data folder' });
  dictionaries['zh-Hant'] = {
    ...dictionaries.zh,
    saved:'已儲存', saving:'正在儲存…', new:'新增', quickCapture:'速記', quickCaptureHint:'快速建立待辦或筆記', newNote:'新增筆記', newNoteHint:'記錄想法與靈感', newTodo:'新增待辦', newTodoHint:'拆解目標與行動',
    inbox:'收集箱', today:'今天', todos:'待辦', notes:'筆記', completed:'已完成', folders:'歸類', classify:'歸類', unclassified:'未歸類', cloudSync:'資料同步', notConfigured:'尚未設定', localWorkspace:'本機行記資料', workspace:'行記資料', actaData:'行記資料',
    search:'搜尋筆記和待辦…', all:'全部', localFirst:'本機優先', syncTitle:'連接本機資料夾', syncCopy:'選擇裝置本機、區域網路或系統已掛載的網路資料夾。Acta 會在其中讀寫清單、歸類、notes 和 todos 完整資料資料夾。',
    chooseFolder:'選擇同步資料夾', noFolder:'尚未選擇位置', download:'下載完整資料資料夾', upload:'上傳完整資料資料夾', safeLocal:'資料預設只儲存在你的裝置上',
    item:'個項目', note:'筆記', todo:'待辦', justNow:'剛剛', yesterday:'昨天', noItems:'這裡還沒有內容', noItemsHint:'新增一則筆記或待辦，開始記錄。',
    selectItem:'選擇一項開始編輯', selectItemHint:'你的想法與行動會在這裡展開。', untitledNote:'未命名筆記', untitledTodo:'新的待辦', created:'建立於', updated:'更新於',
    dueDate:'截止日期', priority:'優先順序', tags:'標籤', high:'高', medium:'中', low:'低', progress:'任務進度', done:'已完成', addTask:'新增子任務', taskPlaceholder:'輸入一個具體行動…',
    description:'補充說明', descriptionPlaceholder:'寫下背景、上下文或任何需要記住的細節…', notePlaceholder:'從一個想法開始…', words:'字', chars:'字元',
    folderPrompt:'新歸類的名稱', folderDefault:'新歸類', folderAdded:'歸類已新增', itemCreated:'已建立', deleted:'已刪除', deleteConfirm:'確定要刪除這一項嗎？',
    synced:'已同步', syncReady:'已連接', uploadDone:'已寫入同步位置', downloadDone:'已從同步位置還原', chooseFirst:'請先選擇同步資料夾', syncWorking:'正在同步…', invalidData:'同步失敗',
    noDate:'無日期', commaTags:'用逗號分隔', format:'格式', heading:'標題', completeTask:'完成待辦', reopenTask:'重新開啟', modified:'最後編輯', archive:'封存',
    viewToday:'今天', viewTodos:'所有待辦', viewNotes:'所有筆記', viewFolder:'歸類', languageChanged:'已切換為繁體中文',
    inboxFolder:'靈感收集', workFolder:'工作計畫', lifeFolder:'生活清單', readingFolder:'閱讀摘記', linkedItems:'關聯項目', linkTodo:'關聯待辦', linkNote:'關聯筆記',
    chooseTodo:'選擇一個待辦…', chooseNote:'選擇一則筆記…', noLinks:'還沒有關聯項目', unlink:'取消關聯', linked:'已建立雙向關聯', unlinked:'已取消關聯',
    importNote:'匯入筆記', importNoteHint:'支援 Markdown 與純文字', exportNote:'匯出這則筆記', noteImported:'筆記已匯入', noteExported:'筆記已匯出',
    importFailed:'匯入失敗', exportFailed:'匯出失敗', fileTooLarge:'檔案不能超過 5 MB', invalidNoteFile:'無法讀取這份筆記'
  };
  Object.assign(dictionaries.zh, { high:'优先处理', medium:'稍后处理', low:'延缓处理' });
  Object.assign(dictionaries.en, { high:'Do first', medium:'Do later', low:'Delay' });
  Object.assign(dictionaries['zh-Hant'], { high:'優先處理', medium:'稍後處理', low:'延緩處理' });
  Object.assign(dictionaries.zh, {
    allPriorities:'全部优先级', allDeadlines:'全部截止时间', overdue:'已逾期', dueToday:'今天截止', nextSevenDays:'未来 7 天', withoutDeadline:'无截止时间',
    allFolders:'全部归类', allRelations:'全部关联', linkedOnly:'已关联', unlinkedOnly:'未关联', anyUpdatedTime:'全部更新时间', lastSevenDays:'最近 7 天', lastThirtyDays:'最近 30 天',
    clearFilters:'清除筛选', filterByPriority:'按优先级筛选', filterByDeadline:'按截止时间筛选', filterByFolder:'按归类筛选', filterByRelation:'按关联状态筛选', filterByUpdated:'按更新时间筛选'
  });
  Object.assign(dictionaries.en, {
    allPriorities:'All priorities', allDeadlines:'All deadlines', overdue:'Overdue', dueToday:'Due today', nextSevenDays:'Next 7 days', withoutDeadline:'No deadline',
    allFolders:'All classifications', allRelations:'All links', linkedOnly:'Linked', unlinkedOnly:'Unlinked', anyUpdatedTime:'Any update time', lastSevenDays:'Last 7 days', lastThirtyDays:'Last 30 days',
    clearFilters:'Clear filters', filterByPriority:'Filter by priority', filterByDeadline:'Filter by deadline', filterByFolder:'Filter by classification', filterByRelation:'Filter by link status', filterByUpdated:'Filter by update time'
  });
  Object.assign(dictionaries['zh-Hant'], {
    allPriorities:'全部優先順序', allDeadlines:'全部截止時間', overdue:'已逾期', dueToday:'今天截止', nextSevenDays:'未來 7 天', withoutDeadline:'無截止時間',
    allFolders:'全部歸類', allRelations:'全部關聯', linkedOnly:'已關聯', unlinkedOnly:'未關聯', anyUpdatedTime:'全部更新時間', lastSevenDays:'最近 7 天', lastThirtyDays:'最近 30 天',
    clearFilters:'清除篩選', filterByPriority:'按優先順序篩選', filterByDeadline:'按截止時間篩選', filterByFolder:'按歸類篩選', filterByRelation:'按關聯狀態篩選', filterByUpdated:'按更新時間篩選'
  });
  Object.assign(dictionaries['zh-Hant'], {
    calendar:'日曆', yearView:'年', monthView:'月', weekView:'週', dayView:'日', previousPeriod:'上一時段', nextPeriod:'下一時段', previousYear:'上一年', nextYear:'下一年', previousMonth:'上一月', nextMonth:'下一月', previousWeek:'上一週', nextWeek:'下一週', previousDay:'上一日', nextDay:'下一日', backToToday:'今天', calendarNavigation:'日曆導覽', calendarViewOptions:'日曆檢視',
    noScheduledTodos:'這段時間沒有待辦', noScheduledTodosHint:'為待辦設定截止日期後，它會顯示在日曆中。', scheduledTodos:'項待辦',
    noCalendarItems:'這段時間沒有日曆內容', noCalendarItemsHint:'有排程的待辦和當天建立的筆記會顯示在這裡。', calendarItems:'項日曆內容', createdNotes:'當日建立筆記',
    moreTodos:'另有 {0} 項', linkedNotes:'關聯筆記', calendarLegendLinked:'帶筆記關聯', calendarOpenTodo:'開啟待辦', calendarOpenNote:'開啟筆記', calendarOpenDay:'查看當日', weekNumber:'週數', swipeWeekHint:'左右滑動查看其他日期'
  });
  Object.assign(dictionaries.zh, {
    paragraph:'正文', heading1:'一级标题', heading2:'二级标题', heading3:'三级标题', bold:'粗体', italic:'斜体', strike:'删除线', highlight:'高亮',
    inlineCode:'行内代码', codeBlock:'代码块', quote:'引用', bulletList:'无序列表', numberedList:'有序列表', taskList:'任务列表', horizontalRule:'分隔线',
    link:'添加链接', unlink:'取消链接', undo:'撤销', redo:'重做', markdownSource:'Markdown 源码', richText:'可视化编辑', focusMode:'沉浸编辑', focusModeExit:'退出沉浸编辑', focusModeHint:'沉浸编辑', linkPrompt:'输入链接地址', invalidLink:'请输入有效的 HTTP、HTTPS 或邮箱链接', selectTextFirst:'请先选择要格式化的文字'
  });
  Object.assign(dictionaries.en, {
    paragraph:'Body', heading1:'Heading 1', heading2:'Heading 2', heading3:'Heading 3', bold:'Bold', italic:'Italic', strike:'Strikethrough', highlight:'Highlight',
    inlineCode:'Inline code', codeBlock:'Code block', quote:'Blockquote', bulletList:'Bulleted list', numberedList:'Numbered list', taskList:'Task list', horizontalRule:'Divider',
    link:'Add link', unlink:'Remove link', undo:'Undo', redo:'Redo', markdownSource:'Markdown source', richText:'Visual editor', focusMode:'Immersive editing', focusModeExit:'Exit immersive editing', focusModeHint:'Immersive editing', linkPrompt:'Enter a link', invalidLink:'Enter a valid HTTP, HTTPS, or email link', selectTextFirst:'Select text to format first'
  });
  Object.assign(dictionaries['zh-Hant'], {
    paragraph:'正文', heading1:'一級標題', heading2:'二級標題', heading3:'三級標題', bold:'粗體', italic:'斜體', strike:'刪除線', highlight:'醒目標記',
    inlineCode:'行內程式碼', codeBlock:'程式碼區塊', quote:'引用', bulletList:'無序清單', numberedList:'有序清單', taskList:'任務清單', horizontalRule:'分隔線',
    link:'新增連結', unlink:'取消連結', undo:'復原', redo:'重做', markdownSource:'Markdown 原始碼', richText:'視覺化編輯', focusMode:'沉浸編輯', focusModeExit:'退出沉浸編輯', focusModeHint:'沉浸編輯', linkPrompt:'輸入連結地址', invalidLink:'請輸入有效的 HTTP、HTTPS 或電子郵件連結', selectTextFirst:'請先選取要格式化的文字'
  });

  const interfaceTranslations = {
    en: {
      '设置':'Settings', '按你的方式使用 Acta':'Make Acta work your way', '关闭设置':'Close settings', '设置页面':'Settings pages',
      '语言':'Language', '工作区':'Workspace', '行记数据':'Acta Data', '数据同步':'Data sync', '常规设置':'General', '外观设置':'Appearance', '关于':'About',
      '切换 Acta 的界面语言，笔记内容不会被翻译或修改。':'Change the interface language. Your note content is never translated or modified.', '简体中文':'Simplified Chinese', '繁體中文':'Traditional Chinese', '英语':'English',
      '整个资料库保存在所选文件夹内唯一的':'The entire library is stored in a single', '文件中。':'file inside the selected folder.', '演示工作区':'Demo workspace', '演示行记数据':'Demo Acta Data', '尚未选择文件夹；本次修改不会保存。':'No folder selected; changes in this session will not be saved.',
      '选择本地文件夹':'Choose local folder', '立即保存':'Save now', '从文件重载':'Reload from file', '返回演示工作区':'Return to demo workspace', '返回演示行记数据':'Return to demo Acta Data', '当前是演示工作区。关闭或刷新页面后，演示内容会恢复，不会写入浏览器本地资料库。':'This is the demo workspace. Its content resets when you close or refresh the page and is not written to browser storage.', '当前是演示行记数据。关闭或刷新页面后，演示内容会恢复，不会写入浏览器本地资料库。':'This is demo Acta Data. Its content resets when you close or refresh the page and is not written to browser storage.',
      '调整启动位置、内容密度和动效偏好。':'Adjust the startup view, content density, and motion.', '默认启动页面':'Default startup view', '打开应用时优先进入的智能视图':'The smart view shown when Acta opens', '收集箱':'Inbox', '今天':'Today', '所有待办':'All tasks', '所有笔记':'All notes', '日历':'Calendar', '已完成':'Completed',
      '紧凑列表':'Compact lists', '在中栏显示更多笔记和待办':'Show more notes and tasks in the middle pane', '减少动态效果':'Reduce motion', '降低转场和弹性动画，减少视觉干扰':'Reduce transitions and spring animations', '设置会自动保存在当前设备。':'Settings are saved automatically on this device.',
      '主题只改变显示效果，不会影响任何笔记或待办数据。':'Themes only change the appearance; your notes and tasks are unaffected.', '黑白浅色':'Monochrome light', '黑白深色':'Monochrome dark', '蓝黄':'Blue and yellow', '黄色护眼':'Eye-comfort yellow', '自定义':'Custom',
      '纸张颜色':'Paper color', '侧栏颜色':'Sidebar color', '强调颜色':'Accent color', '界面字体':'Interface font', '同时应用到列表、编辑器和设置页面':'Applied to lists, the editor, and settings', '系统默认':'System default', '衬线字体':'Serif', '圆体':'Rounded', '等宽字体':'Monospace', '自定义字体':'Custom font',
      '字体家族':'Font family', '输入设备上已安装的字体，例如 Inter 或 Microsoft YaHei':'Enter a font installed on this device, such as Inter or Microsoft YaHei', '字体大小':'Font size', '统一调整界面、列表、编辑器与设置页':'Scale the interface, lists, editor, and settings together', '记录，然后行动。Acta 让笔记与待办自然连接。':'Capture, then act. Acta connects notes and tasks naturally.',
      '先支持 OneDrive 本地同步文件夹；上传与下载均使用完整资料库数据文件。':'OneDrive local sync folders are supported first. Upload and download both use the complete library file.', '尚未选择 OneDrive 同步文件夹':'No OneDrive sync folder selected', 'OneDrive 文件操作':'OneDrive file access', '由 OneDrive 客户端把 acta-library.json 同步到云端':'The OneDrive client syncs acta-library.json to the cloud', '选择文件夹':'Choose folder',
      '自动同步':'Automatic sync', '本地内容变化后自动上传，并定时检查 OneDrive 文件中的更新':'Upload local changes automatically and periodically check the OneDrive file for updates', '检查频率':'Check frequency', '仅在 Acta 保持运行时执行':'Runs only while Acta remains open', '每 1 分钟':'Every minute', '每 5 分钟':'Every 5 minutes', '每 15 分钟':'Every 15 minutes',
      '从 OneDrive 下载':'Download from OneDrive', '上传到 OneDrive':'Upload to OneDrive', '请选择电脑或网页文件选择器中的 OneDrive 同步文件夹。':'Choose your OneDrive sync folder using the desktop or web folder picker.', 'Acta 不会获取你的 OneDrive 账号或密码；文件传输由系统文件夹与 OneDrive 客户端完成。':'Acta never accesses your OneDrive account or password. The system folder and OneDrive client transfer the file.',
      '关于 Acta':'About Acta', '让笔记与行动在一个安静、可掌控的本地空间中自然连接。':'Connect notes and actions naturally in a calm, controllable local space.', '产品':'Product', '版本':'Version', '本版更新日期':'Version date', '桌面框架':'Desktop framework', '笔记、待办和设置默认保存在当前设备；只有在你主动操作时才会导入、导出或同步。':'Notes, tasks, and settings stay on this device by default. Import, export, and sync occur only when you choose them.', '作者：':'Author: ', '。由 Codex 驱动创作；项目开源、免费，欢迎学习、使用与共同改进。':'. Created with Codex; open source and free for learning, use, and collaboration.',
      '完整数据文件夹由 acta-manifest.json、classifications.json、notes/ 和 todos/ 组成；每则笔记与待办分别保存。':'A complete data folder contains acta-manifest.json, classifications.json, notes/, and todos/; every note and task is stored separately.', '保存完整数据文件夹':'Save complete data folder', '从数据文件夹重载':'Reload data folder', '导出数据文件夹':'Export data folder',
      'OneDrive 上传、下载和自动同步均处理完整数据文件夹，笔记与待办不会合并成单个资料库文件。':'OneDrive upload, download, and automatic sync all process the complete data folder; notes and tasks are never merged into one library file.', 'OneDrive 文件夹操作':'OneDrive folder access', '由 OneDrive 客户端同步清单、归类、notes 和 todos 整套文件夹':'The OneDrive client syncs the manifest, classifications, notes, and todos as one complete folder.', '下载完整数据文件夹':'Download complete data folder', '上传完整数据文件夹':'Upload complete data folder', '本地内容变化后自动上传，并定时检查 OneDrive 数据文件夹中的更新':'Upload local changes automatically and periodically check the OneDrive data folder for updates',
      '选择 OneDrive 本地文件夹，由系统 OneDrive 客户端负责上传和下载。':'Choose a local OneDrive folder. The system OneDrive client handles cloud transfers.', 'OneDrive 本地文件夹':'Local OneDrive folder', '尚未选择 OneDrive 本地文件夹':'No local OneDrive folder selected', '文件夹同步':'Folder sync', 'Acta 读写完整数据文件夹，云端传输由 OneDrive 客户端完成':'Acta reads and writes the complete data folder; the OneDrive client handles cloud transfers.', '选择 OneDrive 文件夹':'Choose OneDrive folder', '断开文件夹':'Disconnect folder', '请先选择电脑中的 OneDrive 本地文件夹。':'Choose a local OneDrive folder on this device first.', 'Acta 不连接 Microsoft Graph，也不获取微软账号信息；请确保系统 OneDrive 客户端正在运行。':'Acta does not connect to Microsoft Graph or read Microsoft account information. Keep the system OneDrive client running.',
      '在 OneDrive 本地文件夹与 WebDAV 服务器之间选择一种同步方式。':'Choose between a local OneDrive folder and a WebDAV server.', '同步模式':'Sync mode', '切换后使用对应位置进行上传、下载与自动同步':'Use the selected location for upload, download, and automatic sync.', '仅建议 Windows 用户使用；云端传输由 OneDrive 客户端完成':'Recommended only for Windows users; the OneDrive client handles cloud transfers.', '服务器地址':'Server URL', '填写用于保存 Acta 完整数据文件夹的 WebDAV 目录地址':'Enter the WebDAV directory URL that stores the complete Acta data folder.', '账号':'Account', 'WebDAV 用户名':'WebDAV username', '密码':'Password', '建议使用服务商提供的应用专用密码':'Use an app-specific password from your provider when available.', 'WebDAV 连接':'WebDAV connection', '尚未连接 WebDAV':'WebDAV is not connected', '保存并测试连接':'Save and test connection', '内容变化后自动上传，并定时检查同步位置中的更新':'Upload changes automatically and periodically check the sync location.', '断开同步位置':'Disconnect sync location', '请先选择同步模式并完成连接。':'Choose a sync mode and connect it first.', 'OneDrive 模式不连接 Microsoft Graph；WebDAV 密码仅保存在当前设备，网页版需要服务器允许跨域访问。':'OneDrive mode does not use Microsoft Graph. The WebDAV password stays on this device; web access requires the server to allow cross-origin requests.'
    },
    'zh-Hant': {
      '设置':'設定', '按你的方式使用 Acta':'依照你的方式使用 Acta', '关闭设置':'關閉設定', '设置页面':'設定頁面', '语言':'語言', '工作区':'工作區', '行记数据':'行記資料', '数据同步':'資料同步', '常规设置':'一般設定', '外观设置':'外觀設定', '关于':'關於',
      '切换 Acta 的界面语言，笔记内容不会被翻译或修改。':'切換 Acta 的介面語言，筆記內容不會被翻譯或修改。', '简体中文':'簡體中文', '英语':'英文',
      '整个资料库保存在所选文件夹内唯一的':'整個資料庫儲存在所選資料夾內唯一的', '文件中。':'檔案中。', '演示工作区':'示範工作區', '尚未选择文件夹；本次修改不会保存。':'尚未選擇資料夾；本次修改不會儲存。', '选择本地文件夹':'選擇本機資料夾', '立即保存':'立即儲存', '从文件重载':'從檔案重新載入', '返回演示工作区':'返回示範工作區',
      '当前是演示工作区。关闭或刷新页面后，演示内容会恢复，不会写入浏览器本地资料库。':'目前是示範工作區。關閉或重新整理頁面後，示範內容會還原，不會寫入瀏覽器本機資料庫。', '调整启动位置、内容密度和动效偏好。':'調整啟動位置、內容密度和動效偏好。', '默认启动页面':'預設啟動頁面', '打开应用时优先进入的智能视图':'開啟應用程式時優先進入的智慧檢視', '收集箱':'收集箱', '今天':'今天', '所有待办':'所有待辦', '所有笔记':'所有筆記', '日历':'日曆', '紧凑列表':'緊湊清單', '在中栏显示更多笔记和待办':'在中欄顯示更多筆記和待辦', '减少动态效果':'減少動態效果', '降低转场和弹性动画，减少视觉干扰':'降低轉場和彈性動畫，減少視覺干擾', '设置会自动保存在当前设备。':'設定會自動儲存在目前裝置。',
      '主题只改变显示效果，不会影响任何笔记或待办数据。':'主題只改變顯示效果，不會影響任何筆記或待辦資料。', '黑白浅色':'黑白淺色', '黑白深色':'黑白深色', '蓝黄':'藍黃', '黄色护眼':'黃色護眼', '自定义':'自訂', '纸张颜色':'紙張顏色', '侧栏颜色':'側欄顏色', '强调颜色':'強調顏色', '界面字体':'介面字型', '同时应用到列表、编辑器和设置页面':'同時套用到清單、編輯器和設定頁面', '系统默认':'系統預設', '衬线字体':'襯線字型', '圆体':'圓體', '等宽字体':'等寬字型', '自定义字体':'自訂字型', '字体家族':'字型家族', '输入设备上已安装的字体，例如 Inter 或 Microsoft YaHei':'輸入裝置上已安裝的字型，例如 Inter 或 Microsoft YaHei', '字体大小':'字型大小', '统一调整界面、列表、编辑器与设置页':'統一調整介面、清單、編輯器與設定頁', '记录，然后行动。Acta 让笔记与待办自然连接。':'記錄，然後行動。Acta 讓筆記與待辦自然連接。',
      '先支持 OneDrive 本地同步文件夹；上传与下载均使用完整资料库数据文件。':'目前支援 OneDrive 本機同步資料夾；上傳與下載均使用完整資料庫檔案。', '尚未选择 OneDrive 同步文件夹':'尚未選擇 OneDrive 同步資料夾', 'OneDrive 文件操作':'OneDrive 檔案操作', '由 OneDrive 客户端把 acta-library.json 同步到云端':'由 OneDrive 用戶端把 acta-library.json 同步到雲端', '选择文件夹':'選擇資料夾', '自动同步':'自動同步', '本地内容变化后自动上传，并定时检查 OneDrive 文件中的更新':'本機內容變更後自動上傳，並定時檢查 OneDrive 檔案中的更新', '检查频率':'檢查頻率', '仅在 Acta 保持运行时执行':'僅在 Acta 保持執行時運作', '每 1 分钟':'每 1 分鐘', '每 5 分钟':'每 5 分鐘', '每 15 分钟':'每 15 分鐘', '从 OneDrive 下载':'從 OneDrive 下載', '上传到 OneDrive':'上傳到 OneDrive', '请选择电脑或网页文件选择器中的 OneDrive 同步文件夹。':'請從電腦或網頁資料夾選擇器選擇 OneDrive 同步資料夾。', 'Acta 不会获取你的 OneDrive 账号或密码；文件传输由系统文件夹与 OneDrive 客户端完成。':'Acta 不會取得你的 OneDrive 帳號或密碼；檔案傳輸由系統資料夾與 OneDrive 用戶端完成。',
      '关于 Acta':'關於 Acta', '让笔记与行动在一个安静、可掌控的本地空间中自然连接。':'讓筆記與行動在一個安靜、可掌控的本機空間中自然連接。', '产品':'產品', '版本':'版本', '本版更新日期':'本版更新日期', '桌面框架':'桌面框架', '笔记、待办和设置默认保存在当前设备；只有在你主动操作时才会导入、导出或同步。':'筆記、待辦和設定預設儲存在目前裝置；只有在你主動操作時才會匯入、匯出或同步。',
      '完整数据文件夹由 acta-manifest.json、classifications.json、notes/ 和 todos/ 组成；每则笔记与待办分别保存。':'完整資料資料夾由 acta-manifest.json、classifications.json、notes/ 和 todos/ 組成；每則筆記與待辦分別儲存。', '保存完整数据文件夹':'儲存完整資料資料夾', '从数据文件夹重载':'從資料資料夾重新載入', '导出数据文件夹':'匯出資料資料夾',
      'OneDrive 上传、下载和自动同步均处理完整数据文件夹，笔记与待办不会合并成单个资料库文件。':'OneDrive 上傳、下載和自動同步都會處理完整資料資料夾，筆記與待辦不會合併成單一資料庫檔案。', 'OneDrive 文件夹操作':'OneDrive 資料夾操作', '由 OneDrive 客户端同步清单、归类、notes 和 todos 整套文件夹':'由 OneDrive 用戶端同步清單、歸類、notes 和 todos 整套資料夾。', '下载完整数据文件夹':'下載完整資料資料夾', '上传完整数据文件夹':'上傳完整資料資料夾', '本地内容变化后自动上传，并定时检查 OneDrive 数据文件夹中的更新':'本機內容變更後自動上傳，並定時檢查 OneDrive 資料資料夾中的更新',
      '选择 OneDrive 本地文件夹，由系统 OneDrive 客户端负责上传和下载。':'選擇 OneDrive 本機資料夾，由系統 OneDrive 用戶端負責上傳和下載。', 'OneDrive 本地文件夹':'OneDrive 本機資料夾', '尚未选择 OneDrive 本地文件夹':'尚未選擇 OneDrive 本機資料夾', '文件夹同步':'資料夾同步', 'Acta 读写完整数据文件夹，云端传输由 OneDrive 客户端完成':'Acta 讀寫完整資料資料夾，雲端傳輸由 OneDrive 用戶端完成。', '选择 OneDrive 文件夹':'選擇 OneDrive 資料夾', '断开文件夹':'中斷資料夾', '请先选择电脑中的 OneDrive 本地文件夹。':'請先選擇電腦中的 OneDrive 本機資料夾。', 'Acta 不连接 Microsoft Graph，也不获取微软账号信息；请确保系统 OneDrive 客户端正在运行。':'Acta 不連接 Microsoft Graph，也不取得 Microsoft 帳號資訊；請確保系統 OneDrive 用戶端正在執行。',
      '在 OneDrive 本地文件夹与 WebDAV 服务器之间选择一种同步方式。':'在 OneDrive 本機資料夾與 WebDAV 伺服器之間選擇一種同步方式。', '同步模式':'同步模式', '切换后使用对应位置进行上传、下载与自动同步':'切換後使用對應位置進行上傳、下載與自動同步。', '仅建议 Windows 用户使用；云端传输由 OneDrive 客户端完成':'僅建議 Windows 使用者使用；雲端傳輸由 OneDrive 用戶端完成。', '服务器地址':'伺服器地址', '填写用于保存 Acta 完整数据文件夹的 WebDAV 目录地址':'填寫用於儲存 Acta 完整資料資料夾的 WebDAV 目錄地址。', '账号':'帳號', 'WebDAV 用户名':'WebDAV 使用者名稱', '密码':'密碼', '建议使用服务商提供的应用专用密码':'建議使用服務商提供的應用程式專用密碼。', 'WebDAV 连接':'WebDAV 連接', '尚未连接 WebDAV':'尚未連接 WebDAV', '保存并测试连接':'儲存並測試連接', '内容变化后自动上传，并定时检查同步位置中的更新':'內容變更後自動上傳，並定時檢查同步位置中的更新。', '断开同步位置':'中斷同步位置', '请先选择同步模式并完成连接。':'請先選擇同步模式並完成連接。', 'OneDrive 模式不连接 Microsoft Graph；WebDAV 密码仅保存在当前设备，网页版需要服务器允许跨域访问。':'OneDrive 模式不連接 Microsoft Graph；WebDAV 密碼僅儲存在目前裝置，網頁版需要伺服器允許跨來源存取。'
    }
  };
  Object.assign(interfaceTranslations.en, {
    '缓存与页面':'Cache and page',
    '清除应用缓存并重新加载最新页面，不会删除笔记、待办或设置。':'Clear the app cache and reload the latest page. Notes, tasks, and settings are not deleted.',
    '清除缓存重新加载':'Clear cache and reload',
    '森林晨雾':'Forest mist', '海盐晚霞':'Sea-salt sunset', '糖果气泡':'Candy pop', '深海霓虹':'Neon ocean', '极光夜色':'Aurora night', '多彩浅色':'Colorful light', '深色发光':'Dark glow',
    '基础界面':'Base interface', '内容类型':'Content types', '待办主题色':'Task accent', '待办浅色背景':'Task soft background', '笔记主题色':'Note accent', '笔记浅色背景':'Note soft background', '日历主题色':'Calendar accent', '日历浅色背景':'Calendar soft background',
    '应用图标':'App icon', '应用于 Tauri 桌面客户端和 Capacitor 移动客户端；网页标签页图标保持默认。':'Used by the Tauri desktop client and Capacitor mobile client; the browser tab icon stays unchanged.',
    '默认书页':'Default page', '正·书页':'True · Page', '勾勒·书页':'Outline · Page', '初版简洁':'Original minimal', '自定义图标':'Custom icon', '选择自定义图标':'Choose custom icon', '恢复默认图标':'Restore default icon',
    '四个预设可用于 Tauri（Windows/macOS）与 Android；上传的自定义图标仅用于 Tauri 桌面端。网页端不生效，移动端桌面可能需要稍候刷新。':'The four presets work in Tauri (Windows/macOS) and Android; uploaded custom icons are Tauri desktop-only. This setting has no effect on the web, and Android launchers may take a moment to refresh.',
    '桌面框架':'Desktop framework', 'Tauri（Windows/macOS），Capacitor（Android）':'Tauri (Windows/macOS), Capacitor (Android)',
    '自定义图标已应用。':'Custom icon applied.', '默认图标已恢复。':'Default icon restored.', '应用图标应用失败。':'Failed to apply the app icon.', '网页端不应用应用图标设置。':'App icon settings do not apply on the web.', '移动端仅支持四个内置图标；已恢复默认书页。':'Mobile supports the four built-in icons only; Default Page was restored.', '图标文件不能超过 1.5 MB。':'The icon file cannot exceed 1.5 MB.', '图标至少需要 64 × 64 像素。':'The icon must be at least 64 × 64 pixels.', '请选择 PNG、WebP、JPG 或 SVG 图标。':'Choose a PNG, WebP, JPG, or SVG icon.', '无法读取图标文件。':'The icon file could not be read.',
    '笔记编辑器':'Note editor', '调整 Markdown 渲染标题与格式工具栏。':'Customize Markdown headings and the formatting toolbar.',
    '一级标题字号':'Heading 1 size', 'Markdown 渲染后的一级标题大小':'Rendered Markdown heading 1 size',
    '二级标题字号':'Heading 2 size', 'Markdown 渲染后的二级标题大小':'Rendered Markdown heading 2 size',
    '三级标题字号':'Heading 3 size', 'Markdown 渲染后的三级标题大小':'Rendered Markdown heading 3 size',
    '标题样式':'Heading style', '改变可视化编辑器中的标题字体与装饰':'Change heading typography and decoration in the visual editor',
    '经典衬线':'Classic serif', '现代无衬线':'Modern sans serif', '简约强调':'Minimal accent',
    '工具栏位置':'Toolbar position', '固定在笔记编辑器的上方或下方':'Pin the toolbar above or below the note editor',
    '上方':'Top', '下方':'Bottom', '显示工具名称':'Show tool names', '在图标旁显示工具名称，空间不足时自动换行':'Show names beside icons; wrap automatically when space is limited',
    '标题预览':'Heading preview', '一级标题':'Heading 1', '二级标题':'Heading 2', '三级标题':'Heading 3'
  });
  Object.assign(interfaceTranslations['zh-Hant'], {
    '缓存与页面':'快取與頁面',
    '清除应用缓存并重新加载最新页面，不会删除笔记、待办或设置。':'清除應用程式快取並重新載入最新頁面，不會刪除筆記、待辦或設定。',
    '清除缓存重新加载':'清除快取並重新載入',
    '森林晨雾':'森林晨霧', '海盐晚霞':'海鹽晚霞', '糖果气泡':'糖果氣泡', '深海霓虹':'深海霓虹', '极光夜色':'極光夜色', '多彩浅色':'多彩淺色', '深色发光':'深色發光',
    '基础界面':'基礎介面', '内容类型':'內容類型', '待办主题色':'待辦主題色', '待办浅色背景':'待辦淺色背景', '笔记主题色':'筆記主題色', '笔记浅色背景':'筆記淺色背景', '日历主题色':'日曆主題色', '日历浅色背景':'日曆淺色背景',
    '应用图标':'應用程式圖示', '应用于 Tauri 桌面客户端和 Capacitor 移动客户端；网页标签页图标保持默认。':'套用於 Tauri 桌面用戶端與 Capacitor 行動用戶端；瀏覽器分頁圖示維持預設。',
    '默认书页':'預設書頁', '正·书页':'正·書頁', '勾勒·书页':'勾勒·書頁', '初版简洁':'初版簡潔', '自定义图标':'自訂圖示', '选择自定义图标':'選擇自訂圖示', '恢复默认图标':'恢復預設圖示',
    '四个预设可用于 Tauri（Windows/macOS）与 Android；上传的自定义图标仅用于 Tauri 桌面端。网页端不生效，移动端桌面可能需要稍候刷新。':'四個預設可用於 Tauri（Windows/macOS）與 Android；上傳的自訂圖示僅用於 Tauri 桌面端。網頁端不生效，行動裝置桌面可能需要稍候重新整理。',
    '桌面框架':'桌面框架', 'Tauri（Windows/macOS），Capacitor（Android）':'Tauri（Windows/macOS），Capacitor（Android）',
    '自定义图标已应用。':'自訂圖示已套用。', '默认图标已恢复。':'預設圖示已恢復。', '应用图标应用失败。':'套用應用程式圖示失敗。', '网页端不应用应用图标设置。':'網頁端不套用應用程式圖示設定。', '移动端仅支持四个内置图标；已恢复默认书页。':'行動端僅支援四個內建圖示；已恢復預設書頁。', '图标文件不能超过 1.5 MB。':'圖示檔案不能超過 1.5 MB。', '图标至少需要 64 × 64 像素。':'圖示至少需要 64 × 64 像素。', '请选择 PNG、WebP、JPG 或 SVG 图标。':'請選擇 PNG、WebP、JPG 或 SVG 圖示。', '无法读取图标文件。':'無法讀取圖示檔案。',
    '笔记编辑器':'筆記編輯器', '调整 Markdown 渲染标题与格式工具栏。':'調整 Markdown 轉譯標題與格式工具列。',
    '一级标题字号':'一級標題字級', 'Markdown 渲染后的一级标题大小':'Markdown 轉譯後的一級標題大小',
    '二级标题字号':'二級標題字級', 'Markdown 渲染后的二级标题大小':'Markdown 轉譯後的二級標題大小',
    '三级标题字号':'三級標題字級', 'Markdown 渲染后的三级标题大小':'Markdown 轉譯後的三級標題大小',
    '标题样式':'標題樣式', '改变可视化编辑器中的标题字体与装饰':'改變視覺化編輯器中的標題字型與裝飾',
    '经典衬线':'經典襯線', '现代无衬线':'現代無襯線', '简约强调':'簡約強調',
    '工具栏位置':'工具列位置', '固定在笔记编辑器的上方或下方':'固定在筆記編輯器的上方或下方',
    '上方':'上方', '下方':'下方', '显示工具名称':'顯示工具名稱', '在图标旁显示工具名称，空间不足时自动换行':'在圖示旁顯示工具名稱，空間不足時自動換行',
    '标题预览':'標題預覽', '一级标题':'一級標題', '二级标题':'二級標題', '三级标题':'三級標題'
  });

  const settingsTextEntries = [];
  const settingsWalker = document.createTreeWalker(settingsModal, NodeFilter.SHOW_TEXT);
  while (settingsWalker.nextNode()) {
    const node = settingsWalker.currentNode;
    const source = node.nodeValue.trim();
    if (!source) continue;
    if (node.parentElement?.closest('#workspaceSettingsTitle,#workspaceFolderPath,#workspaceStatus,#generalStatus,#oneDriveFolderPath,#oneDriveStatus,#appFontSizeValue')) continue;
    settingsTextEntries.push({ node, source, leading: node.nodeValue.match(/^\s*/)[0], trailing: node.nodeValue.match(/\s*$/)[0] });
  }
  const settingsAttributeEntries = [];
  settingsModal.querySelectorAll('[aria-label],[placeholder],[title]').forEach(node => ['aria-label', 'placeholder', 'title'].forEach(attribute => {
    if (node.hasAttribute(attribute)) settingsAttributeEntries.push({ node, attribute, source: node.getAttribute(attribute) });
  }));

  function applySettingsTranslation() {
    const translation = interfaceTranslations[uiSettings.language] || {};
    settingsTextEntries.forEach(entry => { entry.node.nodeValue = `${entry.leading}${translation[entry.source] || entry.source}${entry.trailing}`; });
    settingsAttributeEntries.forEach(entry => entry.node.setAttribute(entry.attribute, translation[entry.source] || entry.source));
  }
  const setStatus = (node, message, state = '') => {
    node.textContent = message;
    node.className = `settings-status ${state}`;
  };

  const dataManifestFile = 'acta-manifest.json';
  const classificationsFile = 'classifications.json';
  const notesDirectoryName = 'notes';
  const todosDirectoryName = 'todos';
  const legacyLibraryFile = 'acta-library.json';
  const workspaceFileName = `${dataManifestFile} · ${classificationsFile} · ${notesDirectoryName}/ · ${todosDirectoryName}/`;
  const savedNativeWorkspace = settings.syncFolder || '';
  let workspaceAdapter = null;
  let dataProfiles = [];
  let editingDataProfileId = '';
  let oneDriveAdapter = null;
  let oneDriveFolderAdapter = null;
  let webDavAdapter = null;
  let webDavCredentials = null;
  let workspaceWriteQueue = Promise.resolve();
  let autoSyncTimer = null;
  let autoSyncSaveTimer = null;
  let autoSyncNoticeTimer = null;
  let autoSyncBusy = false;
  let autoSyncDirty = false;
  let autoSyncBaseline = '';
  let oneDriveRemoteVersion = '';
  let oneDriveBaselineReady = false;

  const syncMessages = {
    zh: {
      working:'正在同步网盘数据文件夹…', uploaded:'已将完整数据文件夹写入当前同步位置。', downloaded:'检测到网盘数据更新，已完整载入。', current:'网盘数据文件夹已是最新状态。', waiting:'自动同步已开启，等待数据变化。', disabled:'自动同步已关闭。', choose:'请先完成当前同步模式的连接。', connectFail:'WebDAV 连接失败：', uploadFail:'上传数据失败：', downloadFail:'下载数据失败：', connected:'网盘同步位置已连接。', manualUpload:'已上传清单、归类、notes 和 todos 完整数据文件夹。', manualDownload:'已从网盘完整下载并载入数据文件夹。', confirm:'从网盘下载会替换当前内容，是否继续？', disconnected:'已断开当前网盘同步位置。', reauthorize:'浏览器需要重新授权 OneDrive 文件夹，请重新选择。', conflict:'检测到网盘数据和当前内容均有新修改。为避免覆盖，自动同步已暂停；请先下载检查或手动上传。', invalidWebDavUrl:'请输入有效的 HTTP 或 HTTPS WebDAV 服务器地址。', webDavMissing:'请完整填写 WebDAV 服务器地址、账号和密码。', webDavConnected:'WebDAV 连接测试成功，设置已保存。', webDavStored:'已读取保存的 WebDAV 设置。', webDavCors:'浏览器阻止了跨域 WebDAV 请求。请在 WebDAV 服务器允许当前网页来源、Authorization、Depth、Content-Type 标头，并正确响应 OPTIONS 预检及 PROPFIND、MKCOL、GET、PUT、DELETE、HEAD 方法。', webDavMixedContent:'HTTPS 页面不能连接 HTTP WebDAV，请改用 HTTPS 服务器地址。', webDavNetwork:'无法连接 WebDAV 服务器，请检查地址、网络、证书和服务器状态。'
    },
    en: {
      working:'Syncing the cloud data folder…', uploaded:'Wrote the complete data folder to the current sync location.', downloaded:'A cloud update was found and fully loaded.', current:'The cloud data folder is up to date.', waiting:'Automatic sync is on and waiting for changes.', disabled:'Automatic sync is off.', choose:'Connect the current sync mode first.', connectFail:'WebDAV connection failed: ', uploadFail:'Data upload failed: ', downloadFail:'Data download failed: ', connected:'The cloud sync location is connected.', manualUpload:'Uploaded the complete manifest, classifications, notes, and todos data folder.', manualDownload:'Downloaded and loaded the complete cloud data folder.', confirm:'Downloading from cloud storage will replace the current content. Continue?', disconnected:'Disconnected the current cloud sync location.', reauthorize:'The browser needs permission again. Choose the OneDrive folder again.', conflict:'Both cloud data and current content changed. Automatic sync was paused; download to review or upload manually.', invalidWebDavUrl:'Enter a valid HTTP or HTTPS WebDAV server URL.', webDavMissing:'Enter the WebDAV server URL, account, and password.', webDavConnected:'WebDAV connection test succeeded and settings were saved.', webDavStored:'Loaded the saved WebDAV settings.', webDavCors:'The browser blocked the cross-origin WebDAV request. Allow this web origin and the Authorization, Depth, and Content-Type headers, and correctly answer the OPTIONS preflight for PROPFIND, MKCOL, GET, PUT, DELETE, and HEAD.', webDavMixedContent:'An HTTPS page cannot connect to an HTTP WebDAV server. Use an HTTPS server URL.', webDavNetwork:'Could not reach the WebDAV server. Check its URL, network, certificate, and status.'
    },
    'zh-Hant': {
      working:'正在同步網路硬碟資料資料夾…', uploaded:'已將完整資料資料夾寫入目前同步位置。', downloaded:'偵測到網路硬碟資料更新，已完整載入。', current:'網路硬碟資料資料夾已是最新狀態。', waiting:'自動同步已開啟，等待資料變更。', disabled:'自動同步已關閉。', choose:'請先完成目前同步模式的連接。', connectFail:'WebDAV 連接失敗：', uploadFail:'上傳資料失敗：', downloadFail:'下載資料失敗：', connected:'網路硬碟同步位置已連接。', manualUpload:'已上傳清單、歸類、notes 和 todos 完整資料資料夾。', manualDownload:'已從網路硬碟完整下載並載入資料資料夾。', confirm:'從網路硬碟下載會取代目前內容，是否繼續？', disconnected:'已中斷目前網路硬碟同步位置。', reauthorize:'瀏覽器需要重新授權 OneDrive 資料夾，請重新選擇。', conflict:'偵測到網路硬碟資料和目前內容都有新修改。為避免覆寫，自動同步已暫停；請先下載檢查或手動上傳。', invalidWebDavUrl:'請輸入有效的 HTTP 或 HTTPS WebDAV 伺服器地址。', webDavMissing:'請完整填寫 WebDAV 伺服器地址、帳號和密碼。', webDavConnected:'WebDAV 連接測試成功，設定已儲存。', webDavStored:'已讀取儲存的 WebDAV 設定。', webDavCors:'瀏覽器封鎖了跨來源 WebDAV 請求。請在 WebDAV 伺服器允許目前網頁來源、Authorization、Depth、Content-Type 標頭，並正確回應 OPTIONS 預檢及 PROPFIND、MKCOL、GET、PUT、DELETE、HEAD 方法。', webDavMixedContent:'HTTPS 頁面不能連接 HTTP WebDAV，請改用 HTTPS 伺服器地址。', webDavNetwork:'無法連接 WebDAV 伺服器，請檢查地址、網路、憑證和伺服器狀態。'
    }
  };
  const folderPermissionMessages = {
    zh:'浏览器需要重新授权本地文件夹，请重新选择。',
    en:'The browser needs folder permission again. Choose the local folder again.',
    'zh-Hant':'瀏覽器需要重新授權本機資料夾，請重新選擇。'
  };
  const syncText = key => key === 'reauthorize' ? (folderPermissionMessages[uiSettings.language] || folderPermissionMessages.zh) : (syncMessages[uiSettings.language] || syncMessages.zh)[key];
  const runtimeMessages = {
    zh: {
      invalidLibrary:'这不是有效的 Acta 完整数据文件夹。', localFolder:'本地文件夹', unsupportedFolder:'当前平台不支持完整文件夹读写，请使用最新版 Chrome、Edge 或客户端文件夹选择器。', noFolderPermission:'没有获得文件夹读写权限。',
      localWorkspace:'本地行记数据', demoWorkspace:'演示行记数据', actaData:'行记数据', noFolderNoSave:'尚未选择文件夹；本次修改不会保存。', noSaveChanges:'不会保存更改', demoSave:'演示模式 · 不保存', demoStatus:'当前是演示行记数据。关闭或刷新页面后，演示内容会恢复，不会写入浏览器本地资料库。',
      savedTo:'已保存完整数据文件夹到 {0} / {1}', saveFailed:'保存失败：{0}', loaded:'已完整载入 {0} / {1}', created:'已在 {0} 创建完整数据文件夹：{1}', savedNow:'完整数据文件夹已立即保存。', reloadConfirm:'从数据文件夹重载会覆盖当前尚未保存的界面状态，是否继续？', reloaded:'已从完整数据文件夹重新载入。', exportedFolder:'完整数据文件夹已导出到 {0}。',
      settingsStored:'设置会自动保存在当前设备。', defaultSaved:'默认启动页面已保存。', compactUpdated:'列表密度已更新。', motionUpdated:'动态效果偏好已更新。',
      linkTitle:'关联项目', close:'关闭', linkHint:'选择一个项目建立双向关联；已有关系会显示在编辑器中。', restoreWorkspaceFailed:'无法恢复工作区：{0}', reauthorize:'浏览器需要重新授权工作区文件夹，请点击“选择本地文件夹”。', restoredOneDrive:'已恢复 OneDrive 同步文件夹连接。', restoreOneDriveFailed:'无法恢复 OneDrive 文件夹：{0}'
    },
    en: {
      invalidLibrary:'This is not a valid complete Acta data folder.', localFolder:'Local folder', unsupportedFolder:'This platform cannot read and write complete folders. Use the latest Chrome, Edge, or the client folder picker.', noFolderPermission:'Folder read/write permission was not granted.',
      localWorkspace:'Local Acta Data', demoWorkspace:'Demo Acta Data', actaData:'Acta Data', noFolderNoSave:'No folder selected; changes in this session will not be saved.', noSaveChanges:'Changes are not saved', demoSave:'Demo mode · Not saved', demoStatus:'This is demo Acta Data. Its content resets when you close or refresh the page and is not written to browser storage.',
      savedTo:'Saved the complete data folder to {0} / {1}', saveFailed:'Save failed: {0}', loaded:'Fully loaded {0} / {1}', created:'Created the complete data folder in {0}: {1}', savedNow:'Complete data folder saved now.', reloadConfirm:'Reloading from the data folder will replace the current unsaved interface state. Continue?', reloaded:'Reloaded from the complete data folder.', exportedFolder:'Complete data folder exported to {0}.',
      settingsStored:'Settings are saved automatically on this device.', defaultSaved:'Default startup view saved.', compactUpdated:'List density updated.', motionUpdated:'Motion preference updated.',
      linkTitle:'Link item', close:'Close', linkHint:'Choose an item to create a two-way link. Existing links appear in the editor.', restoreWorkspaceFailed:'Could not restore the workspace: {0}', reauthorize:'The browser needs folder permission again. Click “Choose local folder”.', restoredOneDrive:'Restored the OneDrive sync folder connection.', restoreOneDriveFailed:'Could not restore the OneDrive folder: {0}'
    },
    'zh-Hant': {
      invalidLibrary:'這不是有效的 Acta 完整資料資料夾。', localFolder:'本機資料夾', unsupportedFolder:'目前平台不支援完整資料夾讀寫，請使用最新版 Chrome、Edge 或用戶端資料夾選擇器。', noFolderPermission:'未取得資料夾讀寫權限。',
      localWorkspace:'本機行記資料', demoWorkspace:'示範行記資料', actaData:'行記資料', noFolderNoSave:'尚未選擇資料夾；本次修改不會儲存。', noSaveChanges:'不會儲存變更', demoSave:'示範模式 · 不儲存', demoStatus:'目前是示範行記資料。關閉或重新整理頁面後，示範內容會還原，不會寫入瀏覽器本機資料庫。',
      savedTo:'已儲存完整資料資料夾到 {0} / {1}', saveFailed:'儲存失敗：{0}', loaded:'已完整載入 {0} / {1}', created:'已在 {0} 建立完整資料資料夾：{1}', savedNow:'完整資料資料夾已立即儲存。', reloadConfirm:'從資料資料夾重新載入會覆蓋目前尚未儲存的介面狀態，是否繼續？', reloaded:'已從完整資料資料夾重新載入。', exportedFolder:'完整資料資料夾已匯出到 {0}。',
      settingsStored:'設定會自動儲存在目前裝置。', defaultSaved:'預設啟動頁面已儲存。', compactUpdated:'清單密度已更新。', motionUpdated:'動態效果偏好已更新。',
      linkTitle:'關聯項目', close:'關閉', linkHint:'選擇一個項目建立雙向關聯；已有關係會顯示在編輯器中。', restoreWorkspaceFailed:'無法還原工作區：{0}', reauthorize:'瀏覽器需要重新授權工作區資料夾，請點擊「選擇本機資料夾」。', restoredOneDrive:'已還原 OneDrive 同步資料夾連接。', restoreOneDriveFailed:'無法還原 OneDrive 資料夾：{0}'
    }
  };
  Object.assign(runtimeMessages.zh, {
    clearCacheConfirm:'将清除应用页面缓存并重新加载。笔记、待办、数据档案、同步凭据和设置都不会被删除，是否继续？',
    clearingCache:'正在保存当前档案并清除缓存…',
    clearCacheFailed:'清除缓存失败：{0}',
    cacheSyncBusy:'网盘同步正在进行，请稍候再清除缓存。'
  });
  Object.assign(runtimeMessages.en, {
    clearCacheConfirm:'The app cache will be cleared and the page reloaded. Notes, tasks, profiles, sync credentials, and settings will not be deleted. Continue?',
    clearingCache:'Saving the current profile and clearing the cache…',
    clearCacheFailed:'Could not clear the cache: {0}',
    cacheSyncBusy:'Cloud sync is in progress. Clear the cache after it finishes.'
  });
  Object.assign(runtimeMessages['zh-Hant'], {
    clearCacheConfirm:'將清除應用程式頁面快取並重新載入。筆記、待辦、資料檔案、同步憑據和設定都不會被刪除，是否繼續？',
    clearingCache:'正在儲存目前檔案並清除快取…',
    clearCacheFailed:'清除快取失敗：{0}',
    cacheSyncBusy:'網路硬碟同步正在進行，請稍候再清除快取。'
  });
  const uiText = (key, ...values) => values.reduce((message, value, index) => message.replace(`{${index}}`, value), (runtimeMessages[uiSettings.language] || runtimeMessages.zh)[key]);
  const profileMessages = {
    zh: {
      panelDescription:'每个数据档案都包含完整的归类、笔记和待办；可以保存在软件本地，也可以连接到你选择的文件夹。', newProfile:'新建空白档案', newSubtitle:'从一份没有笔记和待办的数据开始', name:'档案名称', newName:'新的行记数据', location:'保存位置', localDesktop:'软件本地', localNative:'软件本地', localBrowser:'浏览器本地缓存', localHint:'默认位置，无需选择文件夹', folder:'自选文件夹', folderHint:'创建时选择保存位置', cancel:'取消', createOpen:'创建并打开', profiles:'数据档案', count:'{0} 个档案', activeSummary:'当前：{0}', browserTitle:'浏览器本地空间有限', browserHint:'浏览器可能在空间不足或清理缓存时移除本地数据，请定期导出完整档案备份。', active:'当前', open:'打开', edit:'编辑', current:'正在使用', stats:'{0} 则笔记 · {1} 个待办', saveName:'保存名称', changeLocation:'更改位置', copy:'复制', export:'导出完整档案', locationLabel:'档案位置', folderFiles:'完整档案文件夹', emptyName:'请输入档案名称。', duplicateName:'已经存在同名数据档案。', localQuota:'本地空间不足，无法保存。请先导出完整档案，再更换保存位置。', unavailable:'当前位置不可用，请编辑档案并重新选择保存位置。', created:'已创建并打开空白数据档案“{0}”。', switched:'已切换到“{0}”。', renamed:'数据档案已重命名为“{0}”。', moved:'“{0}”已复制到新的保存位置。', copied:'已创建“{0}”的本地副本。', exported:'已将“{0}”的完整档案导出到 {1}。', saved:'“{0}”已保存。', loaded:'已打开“{0}”。', initializing:'正在读取行记数据档案…', ready:'所有更改会自动保存到当前数据档案。', editHint:'修改名称或把完整档案复制到新的文件夹。', copySuffix:'副本', defaultName:'我的行记', chooseLocation:'选择文件夹后，Acta 会写入完整档案；原位置不会被删除。'
    },
    en: {
      panelDescription:'Each data profile contains all classifications, notes, and tasks. Keep it inside Acta or connect a folder you choose.', newProfile:'New blank profile', newSubtitle:'Start without any notes or tasks', name:'Profile name', newName:'New Acta Data', location:'Save location', localDesktop:'Inside Acta', localNative:'Inside Acta', localBrowser:'Browser local storage', localHint:'Default location; no folder needed', folder:'Choose a folder', folderHint:'Select a save location during creation', cancel:'Cancel', createOpen:'Create and open', profiles:'Data profiles', count:'{0} profiles', activeSummary:'Current: {0}', browserTitle:'Browser storage is limited', browserHint:'The browser may remove local data when space is low or its cache is cleared. Export complete backups regularly.', active:'Current', open:'Open', edit:'Edit', current:'In use', stats:'{0} notes · {1} tasks', saveName:'Save name', changeLocation:'Change location', copy:'Duplicate', export:'Export complete profile', locationLabel:'Profile location', folderFiles:'Complete profile folder', emptyName:'Enter a profile name.', duplicateName:'A data profile with this name already exists.', localQuota:'Local storage is full. Export the complete profile, then change its save location.', unavailable:'This location is unavailable. Edit the profile and choose its save location again.', created:'Created and opened the blank profile “{0}”.', switched:'Switched to “{0}”.', renamed:'Renamed the data profile to “{0}”.', moved:'Copied “{0}” to its new save location.', copied:'Created the local copy “{0}”.', exported:'Exported the complete “{0}” profile to {1}.', saved:'Saved “{0}”.', loaded:'Opened “{0}”.', initializing:'Loading Acta data profiles…', ready:'Changes are saved automatically to the current data profile.', editHint:'Change the name or copy the complete profile to another folder.', copySuffix:'copy', defaultName:'My Acta Data', chooseLocation:'After you choose a folder, Acta writes the complete profile there. The old location is not deleted.'
    },
    'zh-Hant': {
      panelDescription:'每個資料檔案都包含完整的歸類、筆記和待辦；可以儲存在軟體本機，也可以連接到你選擇的資料夾。', newProfile:'新增空白檔案', newSubtitle:'從一份沒有筆記和待辦的資料開始', name:'檔案名稱', newName:'新的行記資料', location:'儲存位置', localDesktop:'軟體本機', localNative:'軟體本機', localBrowser:'瀏覽器本機快取', localHint:'預設位置，無需選擇資料夾', folder:'自選資料夾', folderHint:'建立時選擇儲存位置', cancel:'取消', createOpen:'建立並開啟', profiles:'資料檔案', count:'{0} 個檔案', activeSummary:'目前：{0}', browserTitle:'瀏覽器本機空間有限', browserHint:'瀏覽器可能在空間不足或清理快取時移除本機資料，請定期匯出完整檔案備份。', active:'目前', open:'開啟', edit:'編輯', current:'正在使用', stats:'{0} 則筆記 · {1} 個待辦', saveName:'儲存名稱', changeLocation:'變更位置', copy:'複製', export:'匯出完整檔案', locationLabel:'檔案位置', folderFiles:'完整檔案資料夾', emptyName:'請輸入檔案名稱。', duplicateName:'已經存在同名資料檔案。', localQuota:'本機空間不足，無法儲存。請先匯出完整檔案，再變更儲存位置。', unavailable:'目前位置無法使用，請編輯檔案並重新選擇儲存位置。', created:'已建立並開啟空白資料檔案「{0}」。', switched:'已切換到「{0}」。', renamed:'資料檔案已重新命名為「{0}」。', moved:'「{0}」已複製到新的儲存位置。', copied:'已建立「{0}」的本機副本。', exported:'已將「{0}」的完整檔案匯出到 {1}。', saved:'「{0}」已儲存。', loaded:'已開啟「{0}」。', initializing:'正在讀取行記資料檔案…', ready:'所有變更會自動儲存到目前資料檔案。', editHint:'修改名稱或把完整檔案複製到新的資料夾。', copySuffix:'副本', defaultName:'我的行記', chooseLocation:'選擇資料夾後，Acta 會寫入完整檔案；原位置不會被刪除。'
    }
  };
  Object.assign(profileMessages.zh, { deleteProfile:'删除档案', lastProfile:'至少需要保留一个数据档案。', confirmDeleteLocal:'删除“{0}”将永久移除保存在软件或浏览器本地的全部档案数据，确定继续？', confirmDeleteFolder:'从列表删除“{0}”？外部文件夹中的完整档案不会被删除。', profileDeleted:'已删除数据档案“{0}”。' });
  Object.assign(profileMessages.en, { deleteProfile:'Delete profile', lastProfile:'At least one data profile must remain.', confirmDeleteLocal:'Deleting “{0}” permanently removes all profile data stored inside Acta or the browser. Continue?', confirmDeleteFolder:'Remove “{0}” from the list? The complete profile in its external folder will not be deleted.', profileDeleted:'Deleted the data profile “{0}”.' });
  Object.assign(profileMessages['zh-Hant'], { deleteProfile:'刪除檔案', lastProfile:'至少需要保留一個資料檔案。', confirmDeleteLocal:'刪除「{0}」將永久移除儲存在軟體或瀏覽器本機的全部檔案資料，確定繼續？', confirmDeleteFolder:'從清單刪除「{0}」？外部資料夾中的完整檔案不會被刪除。', profileDeleted:'已刪除資料檔案「{0}」。' });
  const profileText = (key, ...values) => values.reduce((message, value, index) => message.replace(`{${index}}`, value), (profileMessages[uiSettings.language] || profileMessages.zh)[key]);

  const quickCaptureMessages = {
    zh: {
      title:'速记', subtitle:'快速创建并立即打开', intro:'选好类型，写下重点，Acta 会立即创建并打开它。', chooseType:'创建什么？', writeContent:'写下内容',
      todo:'待办', todoHint:'记录一个需要行动的事项', note:'笔记', noteHint:'捕捉想法、灵感或片段', itemTitle:'标题', todoTitlePlaceholder:'要完成什么？', noteTitlePlaceholder:'这则笔记讲什么？',
      folder:'归类', start:'开始日期时间', due:'截止日期时间', clearStart:'取消开始时间', clearDue:'取消截止时间', calendarHidden:'开始或截止时间未设置，此待办将不在日历中显示。', invalidSchedule:'请输入有效日期时间，且截止时间必须晚于开始时间。', priority:'优先级', childEvents:'子事件', childEventsPlaceholder:'每行输入一个子事件…', childEventsHint:'每个非空行都会创建为一个独立子事件。', todoBody:'补充说明', todoBodyPlaceholder:'补充背景或需要记住的细节…', todoBodyHint:'创建后仍可继续添加子事件和关联内容。',
      noteBody:'笔记正文', noteBodyPlaceholder:'写下想法；支持 Markdown…', noteBodyHint:'支持标题、列表、引用、任务列表和代码块。', cancel:'取消', clear:'取消', close:'关闭', shortcut:'Ctrl/⌘ + Enter 快速创建', createTodo:'创建待办', createNote:'创建笔记', titleRequired:'请先填写标题。'
    },
    en: {
      title:'Quick capture', subtitle:'Create and open instantly', intro:'Choose a type, capture the essentials, and Acta will create and open it right away.', chooseType:'What are you creating?', writeContent:'Capture the details',
      todo:'Task', todoHint:'Record something that needs action', note:'Note', noteHint:'Capture an idea, spark, or fragment', itemTitle:'Title', todoTitlePlaceholder:'What needs to be done?', noteTitlePlaceholder:'What is this note about?',
      folder:'Classification', start:'Start date and time', due:'Due date and time', clearStart:'Clear start time', clearDue:'Clear due time', calendarHidden:'Without both a start and due time, this task will not appear in the calendar.', invalidSchedule:'Enter valid dates and times, with the due time after the start time.', priority:'Priority', childEvents:'Sub-events', childEventsPlaceholder:'Enter one sub-event per line…', childEventsHint:'Each non-empty line becomes a separate sub-event.', todoBody:'Details', todoBodyPlaceholder:'Add context or anything worth remembering…', todoBodyHint:'You can add more sub-events and linked items after creation.',
      noteBody:'Note body', noteBodyPlaceholder:'Write your idea; Markdown is supported…', noteBodyHint:'Headings, lists, quotes, task lists, and code blocks are supported.', cancel:'Cancel', clear:'Clear', close:'Close', shortcut:'Ctrl/⌘ + Enter to create', createTodo:'Create task', createNote:'Create note', titleRequired:'Enter a title first.'
    },
    'zh-Hant': {
      title:'速記', subtitle:'快速建立並立即開啟', intro:'選好類型，寫下重點，Acta 會立即建立並開啟它。', chooseType:'建立什麼？', writeContent:'寫下內容',
      todo:'待辦', todoHint:'記錄一個需要行動的事項', note:'筆記', noteHint:'捕捉想法、靈感或片段', itemTitle:'標題', todoTitlePlaceholder:'要完成什麼？', noteTitlePlaceholder:'這則筆記在說什麼？',
      folder:'歸類', start:'開始日期時間', due:'截止日期時間', clearStart:'取消開始時間', clearDue:'取消截止時間', calendarHidden:'開始或截止時間未設定，此待辦將不在日曆中顯示。', invalidSchedule:'請輸入有效日期時間，且截止時間必須晚於開始時間。', priority:'優先順序', childEvents:'子事件', childEventsPlaceholder:'每行輸入一個子事件…', childEventsHint:'每個非空行都會建立為一個獨立子事件。', todoBody:'補充說明', todoBodyPlaceholder:'補充背景或需要記住的細節…', todoBodyHint:'建立後仍可繼續新增子事件和關聯內容。',
      noteBody:'筆記正文', noteBodyPlaceholder:'寫下想法；支援 Markdown…', noteBodyHint:'支援標題、清單、引用、任務清單和程式碼區塊。', cancel:'取消', clear:'取消', close:'關閉', shortcut:'Ctrl/⌘ + Enter 快速建立', createTodo:'建立待辦', createNote:'建立筆記', titleRequired:'請先填寫標題。'
    }
  };
  const quickCaptureText = key => (quickCaptureMessages[uiSettings.language] || quickCaptureMessages.zh)[key];

  const clearLegacyTags = snapshot => {
    snapshot?.items?.forEach(item => { delete item.tags; });
    return snapshot;
  };

  const rendererBuildNoteMarkdown = buildNoteMarkdown;
  buildNoteMarkdown = function buildTagFreeNoteMarkdown(item) {
    return rendererBuildNoteMarkdown({ ...item, tags: [] }).replace(/^tags:.*\n/m, '');
  };

  const rendererParseImportedNote = parseImportedNote;
  parseImportedNote = function parseTagFreeImportedNote(...args) {
    const imported = rendererParseImportedNote(...args);
    delete imported.tags;
    return imported;
  };

  const classificationMessages = {
    zh: { rename:'归类名称', placeholder:'修改当前归类名称', hint:'先点击“编辑名称”，修改后再点击勾选确认；更名会应用到该归类下的全部项目。', updated:'归类名称已更新', edit:'编辑名称', confirm:'确认修改', empty:'归类名称不能为空', duplicate:'已经存在同名归类', manage:'管理归类', managerTitle:'编辑归类', save:'保存名称', cancel:'取消', remove:'删除归类', summary:'此归类包含 {0} 个项目；删除后会移动到“{1}”。', lastSummary:'这是最后一个归类，不能删除。', deleteConfirm:'确定删除“{0}”吗？其中 {1} 个项目会移动到“{2}”。', deleted:'归类已删除，相关项目已移动到“{0}”' },
    en: { rename:'Classification name', placeholder:'Rename this classification', hint:'Click “Edit name”, make the change, then confirm with the check button. Renaming applies to every item in this classification.', updated:'Classification name updated', edit:'Edit name', confirm:'Confirm change', empty:'Classification name cannot be empty', duplicate:'A classification with this name already exists', manage:'Manage classification', managerTitle:'Edit classification', save:'Save name', cancel:'Cancel', remove:'Delete classification', summary:'This classification contains {0} items. Deleting it moves them to “{1}”.', lastSummary:'This is the last classification and cannot be deleted.', deleteConfirm:'Delete “{0}”? Its {1} items will move to “{2}”.', deleted:'Classification deleted; related items moved to “{0}”' },
    'zh-Hant': { rename:'歸類名稱', placeholder:'修改目前歸類名稱', hint:'先點擊「編輯名稱」，修改後再點擊勾選確認；更名會套用到該歸類下的全部項目。', updated:'歸類名稱已更新', edit:'編輯名稱', confirm:'確認修改', empty:'歸類名稱不能為空', duplicate:'已經存在同名歸類', manage:'管理歸類', managerTitle:'編輯歸類', save:'儲存名稱', cancel:'取消', remove:'刪除歸類', summary:'此歸類包含 {0} 個項目；刪除後會移動到「{1}」。', lastSummary:'這是最後一個歸類，不能刪除。', deleteConfirm:'確定刪除「{0}」嗎？其中 {1} 個項目會移動到「{2}」。', deleted:'歸類已刪除，相關項目已移動到「{0}」' }
  };
  Object.assign(classificationMessages.zh, { color:'归类颜色', colorHint:'选择颜色后，侧栏和项目卡片会同步更新。', presets:'预设颜色', save:'保存修改', updated:'归类名称、自定义简称或 Emoji 与颜色已更新', add:'新建归类', addHint:'创建一个新的归类', manageHint:'编辑名称、自定义简称或 Emoji 与颜色', menu:'归类操作', shortName:'自定义简称 / Emoji', shortHint:'输入 1–3 个文字或从右侧选择 Emoji；留空自动生成', shortAuto:'自动生成', emojiPicker:'选择 Emoji', emojiOpen:'打开 Emoji 选择器', managerTitle:'归类管理', editClassification:'编辑归类', listTitle:'归类列表', mobileTitle:'所有归类', listCount:'{0} 个归类', contentTitle:'归类内容', notesTitle:'笔记', todosTitle:'待办', noNotes:'此归类下还没有笔记', noTodos:'此归类下还没有待办', itemCount:'{0} 个内容', close:'关闭', openItem:'打开内容' });
  Object.assign(classificationMessages.en, { color:'Classification color', colorHint:'The sidebar and item cards update when you choose a color.', presets:'Preset colors', save:'Save changes', updated:'Classification name, custom short label or emoji, and color updated', add:'New classification', addHint:'Create a new classification', manageHint:'Edit names, custom short labels or emoji, and colors', menu:'Classification actions', shortName:'Custom label / Emoji', shortHint:'Enter 1–3 characters or choose an emoji; leave blank to generate one', shortAuto:'Auto', emojiPicker:'Choose an emoji', emojiOpen:'Open emoji picker', managerTitle:'Manage classifications', editClassification:'Edit classification', listTitle:'Classifications', mobileTitle:'All classifications', listCount:'{0} classifications', contentTitle:'Classification contents', notesTitle:'Notes', todosTitle:'Tasks', noNotes:'No notes in this classification', noTodos:'No tasks in this classification', itemCount:'{0} items', close:'Close', openItem:'Open item' });
  Object.assign(classificationMessages['zh-Hant'], { color:'歸類顏色', colorHint:'選擇顏色後，側欄和項目卡片會同步更新。', presets:'預設顏色', save:'儲存修改', updated:'歸類名稱、自訂簡稱或 Emoji 與顏色已更新', add:'新增歸類', addHint:'建立一個新的歸類', manageHint:'編輯名稱、自訂簡稱或 Emoji 與顏色', menu:'歸類操作', shortName:'自訂簡稱 / Emoji', shortHint:'輸入 1–3 個文字或從右側選擇 Emoji；留空時自動產生', shortAuto:'自動產生', emojiPicker:'選擇 Emoji', emojiOpen:'開啟 Emoji 選擇器', managerTitle:'歸類管理', editClassification:'編輯歸類', listTitle:'歸類列表', mobileTitle:'所有歸類', listCount:'{0} 個歸類', contentTitle:'歸類內容', notesTitle:'筆記', todosTitle:'待辦', noNotes:'此歸類下還沒有筆記', noTodos:'此歸類下還沒有待辦', itemCount:'{0} 個內容', close:'關閉', openItem:'開啟內容' });
  const classificationText = () => classificationMessages[uiSettings.language] || classificationMessages.zh;

  const classificationManagerDialog = byId('classificationManagerDialog');
  const mobileClassificationDialog = byId('mobileClassificationDialog');
  const quickCaptureDialog = byId('quickCaptureDialog');
  const quickCaptureForm = byId('quickCaptureForm');
  const quickCaptureTitleInput = byId('quickCaptureItemTitle');
  const quickCaptureFolder = byId('quickCaptureFolder');
  const quickCaptureStart = byId('quickCaptureStart');
  const quickCaptureDue = byId('quickCaptureDue');
  const quickCapturePriority = byId('quickCapturePriority');
  const quickCaptureTasks = byId('quickCaptureTasks');
  const quickCaptureBody = byId('quickCaptureBody');
  let quickCaptureType = 'todo';
  let quickCaptureStartTouched = false;
  const classificationManagerName = byId('classificationManagerName');
  const classificationManagerShortName = byId('classificationManagerShortName');
  const classificationEmojiButton = byId('classificationEmojiButton');
  const classificationEmojiPicker = byId('classificationEmojiPicker');
  const classificationEmojiGrid = byId('classificationEmojiGrid');
  const classificationEmojis = ['📥','🗓️','✅','📝','💡','💼','🏠','📚','🎯','🚀','❤️','⭐','🔖','🧠','✨','🔧','💰','🛒','✈️','🎵','🎬','🍽️','🏃','🌿','🐾','👨‍👩‍👧‍👦','🎨','💻','📌','🔥','☕','🧭','👩‍💻','🌍','📷','🎁','🧹','💬','🔬','🧘'];
  const classificationManagerColor = byId('classificationManagerColor');
  const folderActionMenu = byId('folderActionMenu');
  const folderActionsMenu = byId('folderActionsMenu');
  let classificationManagerFolderId = '';
  const animatedDialogCloseTimers = new WeakMap();

  const reduceWindowMotion = () => document.body.classList.contains('acta-reduce-motion') || matchMedia('(prefers-reduced-motion: reduce)').matches;
  function openAnimatedDialog(dialog) {
    clearTimeout(animatedDialogCloseTimers.get(dialog));
    animatedDialogCloseTimers.delete(dialog);
    dialog.classList.remove('is-closing');
    if (!dialog.open) dialog.showModal();
  }
  function closeAnimatedDialog(dialog) {
    if (!dialog?.open || dialog.classList.contains('is-closing')) return;
    const finish = () => {
      clearTimeout(animatedDialogCloseTimers.get(dialog));
      animatedDialogCloseTimers.delete(dialog);
      if (dialog.open) dialog.close();
      dialog.classList.remove('is-closing');
    };
    if (reduceWindowMotion()) { finish(); return; }
    dialog.classList.add('is-closing');
    animatedDialogCloseTimers.set(dialog, setTimeout(finish, 250));
  }

  function populateQuickCaptureFolders(preferredFolderId = quickCaptureFolder.value) {
    quickCaptureFolder.replaceChildren();
    const unclassified = document.createElement('option');
    unclassified.value = '';
    unclassified.textContent = t('unclassified');
    quickCaptureFolder.appendChild(unclassified);
    library.folders.forEach(folder => {
      const option = document.createElement('option');
      option.value = folder.id;
      option.textContent = folderName(folder);
      quickCaptureFolder.appendChild(option);
    });
    if (preferredFolderId === '' || getFolder(preferredFolderId)) quickCaptureFolder.value = preferredFolderId;
  }

  function setQuickCaptureType(type) {
    quickCaptureType = type === 'note' ? 'note' : 'todo';
    quickCaptureDialog.querySelectorAll('[data-quick-type]').forEach(button => {
      const active = button.dataset.quickType === quickCaptureType;
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', String(active));
    });
    const isTodo = quickCaptureType === 'todo';
    byId('quickCaptureStartField').hidden = !isTodo;
    byId('quickCaptureDueField').hidden = !isTodo;
    byId('quickCapturePriorityField').hidden = !isTodo;
    byId('quickCaptureTasksField').hidden = !isTodo;
    byId('quickCaptureBodyLabel').textContent = quickCaptureText(isTodo ? 'todoBody' : 'noteBody');
    quickCaptureBody.placeholder = quickCaptureText(isTodo ? 'todoBodyPlaceholder' : 'noteBodyPlaceholder');
    byId('quickCaptureBodyHint').textContent = quickCaptureText(isTodo ? 'todoBodyHint' : 'noteBodyHint');
    quickCaptureTitleInput.placeholder = quickCaptureText(isTodo ? 'todoTitlePlaceholder' : 'noteTitlePlaceholder');
    byId('quickCaptureSubmitLabel').textContent = quickCaptureText(isTodo ? 'createTodo' : 'createNote');
    syncQuickCaptureScheduleHint();
  }

  function syncQuickCaptureScheduleHint() {
    const hint = byId('quickCaptureScheduleHint');
    const isTodo = quickCaptureType === 'todo';
    const incomplete = !quickCaptureStart.value || !quickCaptureDue.value;
    hint.hidden = !isTodo || !incomplete;
    quickCaptureDue.min = quickCaptureStart.value || '';
  }

  function updateQuickCaptureCopy() {
    const copy = quickCaptureText;
    byId('quickCaptureTitle').textContent = copy('title');
    byId('quickCaptureSubtitle').textContent = copy('subtitle');
    byId('quickCaptureIntro').textContent = copy('intro');
    byId('quickCaptureTypeLabel').textContent = copy('chooseType');
    byId('quickCaptureContentLabel').textContent = copy('writeContent');
    byId('quickCaptureTodoLabel').textContent = copy('todo');
    byId('quickCaptureTodoHint').textContent = copy('todoHint');
    byId('quickCaptureNoteLabel').textContent = copy('note');
    byId('quickCaptureNoteHint').textContent = copy('noteHint');
    byId('quickCaptureItemTitleLabel').textContent = copy('itemTitle');
    byId('quickCaptureFolderLabel').textContent = copy('folder');
    byId('quickCaptureStartLabel').textContent = copy('start');
    byId('quickCaptureDueLabel').textContent = copy('due');
    byId('clearQuickCaptureStart').textContent = copy('clear');
    byId('clearQuickCaptureStart').title = copy('clearStart');
    byId('clearQuickCaptureStart').setAttribute('aria-label', copy('clearStart'));
    byId('clearQuickCaptureDue').textContent = copy('clear');
    byId('clearQuickCaptureDue').title = copy('clearDue');
    byId('clearQuickCaptureDue').setAttribute('aria-label', copy('clearDue'));
    byId('quickCaptureScheduleHint').textContent = copy('calendarHidden');
    byId('quickCapturePriorityLabel').textContent = copy('priority');
    byId('quickCaptureTasksLabel').textContent = copy('childEvents');
    quickCaptureTasks.placeholder = copy('childEventsPlaceholder');
    byId('quickCaptureTasksHint').textContent = copy('childEventsHint');
    byId('quickCapturePriority').querySelector('[value="high"]').textContent = t('high');
    byId('quickCapturePriority').querySelector('[value="medium"]').textContent = t('medium');
    byId('quickCapturePriority').querySelector('[value="low"]').textContent = t('low');
    byId('cancelQuickCapture').textContent = copy('cancel');
    byId('closeQuickCapture').setAttribute('aria-label', copy('close'));
    byId('quickCaptureShortcut').textContent = copy('shortcut');
    populateQuickCaptureFolders();
    setQuickCaptureType(quickCaptureType);
  }

  function openQuickCapture() {
    quickCaptureForm.reset();
    quickCaptureTitleInput.setCustomValidity('');
    byId('quickCaptureError').textContent = '';
    quickCaptureStart.value = dateTimeLocalValue(new Date());
    quickCaptureDue.value = '';
    quickCaptureStartTouched = false;
    quickCapturePriority.value = 'medium';
    quickCaptureType = 'todo';
    updateQuickCaptureCopy();
    populateQuickCaptureFolders('');
    byId('createMenu').classList.remove('open');
    openAnimatedDialog(quickCaptureDialog);
    requestAnimationFrame(() => quickCaptureTitleInput.focus());
  }

  quickCaptureDialog.querySelectorAll('[data-quick-type]').forEach(button => button.addEventListener('click', () => {
    setQuickCaptureType(button.dataset.quickType);
    quickCaptureTitleInput.focus();
  }));
  byId('closeQuickCapture').addEventListener('click', () => closeAnimatedDialog(quickCaptureDialog));
  byId('cancelQuickCapture').addEventListener('click', () => closeAnimatedDialog(quickCaptureDialog));
  quickCaptureDialog.addEventListener('click', event => { if (event.target === quickCaptureDialog) closeAnimatedDialog(quickCaptureDialog); });
  quickCaptureDialog.addEventListener('cancel', event => { event.preventDefault(); closeAnimatedDialog(quickCaptureDialog); });
  quickCaptureTitleInput.addEventListener('input', () => {
    quickCaptureTitleInput.setCustomValidity('');
    byId('quickCaptureError').textContent = '';
  });
  quickCaptureStart.addEventListener('input', () => {
    quickCaptureStartTouched = true;
    byId('quickCaptureError').textContent = '';
    syncQuickCaptureScheduleHint();
  });
  quickCaptureDue.addEventListener('input', () => {
    byId('quickCaptureError').textContent = '';
    syncQuickCaptureScheduleHint();
  });
  byId('clearQuickCaptureStart').addEventListener('click', () => {
    quickCaptureStart.value = '';
    quickCaptureStartTouched = true;
    syncQuickCaptureScheduleHint();
  });
  byId('clearQuickCaptureDue').addEventListener('click', () => {
    quickCaptureDue.value = '';
    syncQuickCaptureScheduleHint();
  });
  quickCaptureForm.addEventListener('keydown', event => {
    if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
      event.preventDefault();
      quickCaptureForm.requestSubmit();
    }
  });
  quickCaptureForm.addEventListener('submit', event => {
    event.preventDefault();
    const title = quickCaptureTitleInput.value.trim();
    if (!title) {
      const message = quickCaptureText('titleRequired');
      quickCaptureTitleInput.setCustomValidity(message);
      byId('quickCaptureError').textContent = message;
      quickCaptureTitleInput.reportValidity();
      quickCaptureTitleInput.focus();
      return;
    }
    const created = new Date();
    const now = created.toISOString();
    const folderId = quickCaptureFolder.value === '' ? '' : (getFolder(quickCaptureFolder.value) ? quickCaptureFolder.value : '');
    const base = { id:uid(), type:quickCaptureType, folderId, title, linkedIds:[], createdAt:now, updatedAt:now };
    const content = quickCaptureBody.value.trim();
    const childEvents = quickCaptureTasks.value.split(/\r?\n/).map(text => text.trim()).filter(Boolean);
    const startAt = quickCaptureStart.value ? (quickCaptureStartTouched ? dateTimeLocalISO(quickCaptureStart.value) : now) : '';
    const dueAt = dateTimeLocalISO(quickCaptureDue.value);
    if (quickCaptureType === 'todo' && ((quickCaptureStart.value && !startAt) || (quickCaptureDue.value && !dueAt) || (startAt && dueAt && dueAt <= startAt))) {
      byId('quickCaptureError').textContent = quickCaptureText('invalidSchedule');
      return;
    }
    const item = quickCaptureType === 'note'
      ? { ...base, body:content ? markdownToNoteHTML(content) : '<p><br></p>' }
      : { ...base, startAt, dueAt, priority:['high', 'medium', 'low'].includes(quickCapturePriority.value) ? quickCapturePriority.value : 'medium', notes:content, tasks:childEvents.map(text => ({ id:uid(), text, done:false })), completed:false };
    library.items.unshift(item);
    persist();
    renderAll();
    closeAnimatedDialog(quickCaptureDialog);
    showToast(`${t('itemCreated')} · ${t(item.type)}`);
  });

  const normalizedClassificationColor = color => /^#[0-9a-f]{6}$/i.test(String(color || '')) ? String(color).toUpperCase() : '#526B55';
  function syncClassificationManagerColor() {
    const color = normalizedClassificationColor(classificationManagerColor.value);
    byId('classificationManagerColorValue').textContent = color;
    byId('classificationColorPresets').querySelectorAll('[data-classification-color]').forEach(button => {
      const active = button.dataset.classificationColor.toUpperCase() === color;
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', String(active));
    });
  }

  function formatClassificationMessage(template, ...values) {
    return values.reduce((message, value, index) => message.replace(`{${index}}`, value), template);
  }

  const normalizedFolderShortName = normalizeFolderShortName;
  function renderMobileClassifications() {
    const copy = classificationText();
    byId('mobileClassificationTitle').textContent = copy.mobileTitle;
    byId('mobileClassificationCount').textContent = formatClassificationMessage(copy.listCount, library.folders.length);
    byId('mobileClassificationList').setAttribute('aria-label', copy.mobileTitle);
    byId('closeMobileClassifications').setAttribute('aria-label', copy.close);
    byId('mobileClassificationList').innerHTML = library.folders.map(folder => {
      const count = library.items.filter(item => item.folderId === folder.id).length;
      const shortName = folderShortName(folder);
      const shortNameClasses = ['folder-short-name', folderShortNameUsesEmoji(shortName) ? 'is-emoji' : '', folderShortSegments(shortName).length > 2 ? 'is-long' : ''].filter(Boolean).join(' ');
      const name = folderName(folder);
      return `<div class="mobile-classification-row ${currentView === `folder:${folder.id}` ? 'active' : ''}" style="--folder-color:${escapeHTML(normalizedClassificationColor(folder.color))}">
        <button class="mobile-classification-open" type="button" data-view="folder:${escapeHTML(folder.id)}">
          <i class="folder-dot"><b class="${shortNameClasses}">${escapeHTML(shortName)}</b></i>
          <span><strong>${escapeHTML(name)}</strong><small>${escapeHTML(formatClassificationMessage(copy.itemCount, count))}</small></span><em>${count}</em>
        </button>
        <button class="mobile-classification-edit" type="button" data-classification-edit="${escapeHTML(folder.id)}" title="${escapeHTML(copy.editClassification)}" aria-label="${escapeHTML(`${copy.editClassification}：${name}`)}"><svg><use href="#i-edit"/></svg></button>
      </div>`;
    }).join('');
  }
  function openMobileClassifications() {
    renderMobileClassifications();
    openAnimatedDialog(mobileClassificationDialog);
    requestAnimationFrame(() => byId('mobileClassificationList').querySelector('.mobile-classification-row.active .mobile-classification-open, .mobile-classification-open')?.focus());
  }
  function updateFolderActionCopy() {
    const copy = classificationText();
    const mobileViewLabel = uiSettings.language === 'en' ? 'View classifications' : uiSettings.language === 'zh-Hant' ? '查看歸類' : '查看归类';
    folderActionsMenu.title = copy.menu;
    folderActionsMenu.setAttribute('aria-label', copy.menu);
    byId('mobileClassifications').title = mobileViewLabel;
    byId('mobileClassifications').setAttribute('aria-label', mobileViewLabel);
    byId('mobileClassifications').querySelector('span').textContent = mobileViewLabel;
    const mobileDataLabel = uiSettings.language === 'en' ? 'Acta Data' : uiSettings.language === 'zh-Hant' ? '行記資料' : '行记数据';
    byId('mobileActaData').title = mobileDataLabel;
    byId('mobileActaData').setAttribute('aria-label', mobileDataLabel);
    byId('folderMenuAddTitle').textContent = copy.add;
    byId('folderMenuAddHint').textContent = copy.addHint;
    byId('folderMenuManageTitle').textContent = copy.manage;
    byId('folderMenuManageHint').textContent = copy.manageHint;
  }
  byId('mobileClassifications').addEventListener('click', event => {
    event.preventDefault();
    const trigger = event.currentTarget;
    trigger.classList.remove('is-launching');
    void trigger.offsetWidth;
    trigger.classList.add('is-launching');
    setTimeout(() => trigger.classList.remove('is-launching'), 430);
    openMobileClassifications();
  });
  byId('mobileActaData').addEventListener('click', event => {
    event.preventDefault();
    openSettings('workspace');
  });
  byId('closeMobileClassifications').addEventListener('click', () => closeAnimatedDialog(mobileClassificationDialog));
  mobileClassificationDialog.addEventListener('click', event => {
    if (event.target === mobileClassificationDialog) closeAnimatedDialog(mobileClassificationDialog);
  });
  mobileClassificationDialog.addEventListener('cancel', event => {
    event.preventDefault();
    closeAnimatedDialog(mobileClassificationDialog);
  });
  byId('mobileClassificationList').addEventListener('click', event => {
    const editButton = event.target.closest('[data-classification-edit]');
    if (editButton) {
      event.preventDefault();
      event.stopPropagation();
      if (mobileClassificationDialog.open) mobileClassificationDialog.close();
      mobileClassificationDialog.classList.remove('is-closing');
      openClassificationManager(editButton.dataset.classificationEdit);
      return;
    }
    if (event.target.closest('[data-view^="folder:"]')) closeAnimatedDialog(mobileClassificationDialog);
  });
  function closeFolderActionMenu() {
    folderActionMenu.classList.remove('open');
    folderActionMenu.setAttribute('aria-hidden', 'true');
    folderActionsMenu.setAttribute('aria-expanded', 'false');
  }
  function toggleFolderActionMenu() {
    if (!document.body.classList.contains('sidebar-collapsed')) return;
    if (folderActionMenu.classList.contains('open')) { closeFolderActionMenu(); return; }
    const triggerRect = folderActionsMenu.getBoundingClientRect();
    const sidebarRect = byId('primarySidebar').getBoundingClientRect();
    const top = Math.max(8, Math.min(triggerRect.top - sidebarRect.top - 4, sidebarRect.height - 126));
    folderActionMenu.style.setProperty('--folder-menu-top', `${top}px`);
    folderActionMenu.classList.add('open');
    folderActionMenu.setAttribute('aria-hidden', 'false');
    folderActionsMenu.setAttribute('aria-expanded', 'true');
    requestAnimationFrame(() => folderActionMenu.querySelector('button')?.focus());
  }

  function renderClassificationManagerItems(items, emptyCopy) {
    if (!items.length) return `<div class="classification-manager-empty"><svg><use href="#i-folder"/></svg><span>${escapeHTML(emptyCopy)}</span></div>`;
    return [...items]
      .sort((first, second) => new Date(second.updatedAt) - new Date(first.updatedAt))
      .map(item => {
        const done = item.type === 'todo' && isTodoComplete(item);
        const completedTasks = item.type === 'todo' ? (item.tasks || []).filter(task => task.done).length : 0;
        const totalTasks = item.type === 'todo' ? (item.tasks || []).length : 0;
        const title = item.title?.trim() || t(item.type === 'todo' ? 'untitledTodo' : 'untitledNote');
        const preview = itemPreview(item);
        const meta = item.type === 'todo' && totalTasks ? `${completedTasks}/${totalTasks}` : formatDate(item.updatedAt, true);
        return `<button class="classification-content-item ${done ? 'completed' : ''}" type="button" data-classification-item="${escapeHTML(item.id)}" title="${escapeHTML(classificationText().openItem)}">
          <span class="classification-content-state"><svg><use href="#i-${item.type === 'todo' ? 'check' : 'note'}"/></svg></span>
          <span><strong>${escapeHTML(title)}</strong><small>${escapeHTML(preview)}</small></span><em>${escapeHTML(meta)}</em>
        </button>`;
      }).join('');
  }

  function renderClassificationManager() {
    const copy = classificationText();
    closeClassificationEmojiPicker();
    let folder = getFolder(classificationManagerFolderId);
    if (!folder) {
      folder = library.folders[0];
      classificationManagerFolderId = folder?.id || '';
    }
    if (!folder) return;
    const folderItems = library.items.filter(item => item.folderId === folder.id);
    const notes = folderItems.filter(item => item.type === 'note');
    const todos = folderItems.filter(item => item.type === 'todo');
    const fallback = library.folders.find(entry => entry.id !== folder.id);
    byId('classificationManagerTitle').textContent = copy.managerTitle;
    byId('classificationManagerListTitle').textContent = copy.listTitle;
    byId('classificationManagerListCount').textContent = formatClassificationMessage(copy.listCount, library.folders.length);
    byId('classificationManagerList').setAttribute('aria-label', copy.listTitle);
    byId('classificationManagerContentTitle').textContent = copy.contentTitle;
    byId('classificationManagerNotesTitle').textContent = copy.notesTitle;
    byId('classificationManagerTodosTitle').textContent = copy.todosTitle;
    byId('classificationManagerNotesCount').textContent = notes.length;
    byId('classificationManagerTodosCount').textContent = todos.length;
    byId('classificationManagerLabel').textContent = copy.rename;
    byId('classificationManagerShortLabel').textContent = copy.shortName;
    byId('classificationManagerShortHint').textContent = copy.shortHint;
    byId('classificationEmojiPickerTitle').textContent = copy.emojiPicker;
    byId('classificationEmojiAuto').textContent = copy.shortAuto;
    classificationEmojiButton.title = copy.emojiOpen;
    classificationEmojiButton.setAttribute('aria-label', copy.emojiOpen);
    byId('classificationManagerColorLabel').textContent = copy.color;
    byId('classificationManagerColorHint').textContent = copy.colorHint;
    byId('classificationColorPresets').setAttribute('aria-label', copy.presets);
    byId('closeClassificationManager').setAttribute('aria-label', uiSettings.language === 'en' ? 'Close' : uiSettings.language === 'zh-Hant' ? '關閉' : '关闭');
    byId('deleteClassification').querySelector('span').textContent = copy.remove;
    byId('cancelClassificationManager').textContent = copy.close;
    byId('saveClassificationManager').querySelector('span').textContent = copy.save;
    byId('classificationManagerList').innerHTML = library.folders.map(entry => {
      const itemCount = library.items.filter(item => item.folderId === entry.id).length;
      return `<button type="button" data-classification-folder="${escapeHTML(entry.id)}" class="${entry.id === folder.id ? 'active' : ''}" style="--folder-color:${escapeHTML(normalizedClassificationColor(entry.color))}">
        <i class="folder-dot"></i><span><strong>${escapeHTML(folderName(entry))}</strong><small>${escapeHTML(formatClassificationMessage(copy.itemCount, itemCount))}</small></span><svg><use href="#i-chevron"/></svg>
      </button>`;
    }).join('');
    classificationManagerName.value = folderName(folder);
    classificationManagerShortName.value = normalizedFolderShortName(folder.shortName);
    classificationManagerShortName.placeholder = `${copy.shortAuto} · ${folderShortName({ ...folder, shortName:'' })}`;
    syncClassificationEmojiSelection();
    classificationManagerColor.value = normalizedClassificationColor(folder.color);
    syncClassificationManagerColor();
    classificationManagerName.setCustomValidity('');
    byId('classificationManagerSummary').textContent = fallback
      ? formatClassificationMessage(copy.summary, folderItems.length, folderName(fallback))
      : copy.lastSummary;
    byId('deleteClassification').disabled = !fallback;
    byId('classificationManagerNotes').innerHTML = renderClassificationManagerItems(notes, copy.noNotes);
    byId('classificationManagerTodos').innerHTML = renderClassificationManagerItems(todos, copy.noTodos);
    const manageFolders = byId('manageFolders');
    manageFolders.title = copy.manage;
    manageFolders.setAttribute('aria-label', copy.manage);
    const addFolder = byId('addFolder');
    addFolder.title = copy.add;
    addFolder.setAttribute('aria-label', copy.add);
    updateFolderActionCopy();
  }

  function openClassificationManager(folderId) {
    const preferredFolder = getFolder(folderId)
      || (currentView.startsWith('folder:') ? getFolder(currentView.slice('folder:'.length)) : null)
      || library.folders[0];
    if (!preferredFolder) return;
    classificationManagerFolderId = preferredFolder.id;
    renderClassificationManager();
    if (!classificationManagerDialog.open) openAnimatedDialog(classificationManagerDialog);
    requestAnimationFrame(() => {
      const activeFolder = byId('classificationManagerList').querySelector('.active');
      activeFolder?.focus();
      if (matchMedia('(max-width: 760px)').matches) activeFolder?.scrollIntoView({ block:'nearest', inline:'center' });
    });
  }

  function syncClassificationEmojiSelection() {
    const value = normalizedFolderShortName(classificationManagerShortName.value);
    const selectedEmoji = folderShortNameUsesEmoji(value) ? value : '';
    classificationEmojiButton.textContent = selectedEmoji || '🙂';
    classificationEmojiGrid.querySelectorAll('[data-classification-emoji]').forEach(button => {
      button.setAttribute('aria-selected', String(button.dataset.classificationEmoji === selectedEmoji));
    });
  }

  function closeClassificationEmojiPicker(restoreFocus = false) {
    if (classificationEmojiPicker.hidden) return;
    classificationEmojiPicker.hidden = true;
    classificationEmojiButton.setAttribute('aria-expanded', 'false');
    if (restoreFocus) classificationEmojiButton.focus();
  }

  function openClassificationEmojiPicker() {
    const copy = classificationText();
    classificationEmojiGrid.innerHTML = classificationEmojis.map(emoji => `<button type="button" role="option" data-classification-emoji="${emoji}" aria-label="${escapeHTML(`${copy.emojiPicker}: ${emoji}`)}">${emoji}</button>`).join('');
    syncClassificationEmojiSelection();
    classificationEmojiPicker.hidden = false;
    classificationEmojiButton.setAttribute('aria-expanded', 'true');
    requestAnimationFrame(() => {
      const target = classificationEmojiGrid.querySelector('[aria-selected="true"]') || classificationEmojiGrid.querySelector('button');
      target?.focus();
    });
  }

  function commitClassificationManagerName() {
    const folder = getFolder(classificationManagerFolderId);
    if (!folder) return;
    const copy = classificationText();
    const nextName = classificationManagerName.value.trim();
    if (!nextName) {
      classificationManagerName.setCustomValidity(copy.empty);
      classificationManagerName.reportValidity();
      return;
    }
    if (library.folders.some(entry => entry.id !== folder.id && folderName(entry).trim().toLocaleLowerCase() === nextName.toLocaleLowerCase())) {
      classificationManagerName.setCustomValidity(copy.duplicate);
      classificationManagerName.reportValidity();
      return;
    }
    classificationManagerName.setCustomValidity('');
    folder.name = nextName;
    const nextShortName = normalizedFolderShortName(classificationManagerShortName.value);
    if (nextShortName) folder.shortName = nextShortName;
    else delete folder.shortName;
    folder.color = normalizedClassificationColor(classificationManagerColor.value);
    delete folder.nameKey;
    persist();
    renderAll();
    renderClassificationManager();
    showToast(copy.updated);
  }

  folderActionsMenu.addEventListener('click', event => {
    event.preventDefault();
    event.stopPropagation();
    toggleFolderActionMenu();
  });
  folderActionMenu.addEventListener('click', event => {
    const action = event.target.closest('[data-folder-menu-action]')?.dataset.folderMenuAction;
    if (!action) return;
    event.stopPropagation();
    closeFolderActionMenu();
    if (action === 'add') byId('addFolder').click();
    if (action === 'manage') byId('manageFolders').click();
  });
  document.addEventListener('click', event => {
    if (!event.target.closest('#folderActionMenu,#folderActionsMenu')) closeFolderActionMenu();
  });
  document.addEventListener('keydown', event => {
    if (!isImeComposing(event) && event.key === 'Escape' && folderActionMenu.classList.contains('open')) closeFolderActionMenu();
  });
  byId('manageFolders').addEventListener('click', () => openClassificationManager());
  byId('classificationManagerList').addEventListener('click', event => {
    const folderButton = event.target.closest('[data-classification-folder]');
    if (!folderButton) return;
    classificationManagerFolderId = folderButton.dataset.classificationFolder;
    renderClassificationManager();
    requestAnimationFrame(() => {
      const activeFolder = byId('classificationManagerList').querySelector('.active');
      activeFolder?.focus();
      if (matchMedia('(max-width: 760px)').matches) activeFolder?.scrollIntoView({ block:'nearest', inline:'center' });
    });
  });
  byId('classificationManagerDialog').addEventListener('click', event => {
    if (event.target === classificationManagerDialog) closeAnimatedDialog(classificationManagerDialog);
  });
  byId('classificationManagerDialog').addEventListener('cancel', event => {
    event.preventDefault();
    closeAnimatedDialog(classificationManagerDialog);
  });
  byId('classificationManagerDialog').addEventListener('click', event => {
    const itemButton = event.target.closest('[data-classification-item]');
    if (!itemButton) return;
    currentView = `folder:${classificationManagerFolderId}`;
    selectedId = itemButton.dataset.classificationItem;
    searchQuery = '';
    byId('searchInput').value = '';
    mobileEditorOpen = true;
    closeAnimatedDialog(classificationManagerDialog);
    renderAll();
  });
  byId('closeClassificationManager').addEventListener('click', () => closeAnimatedDialog(classificationManagerDialog));
  byId('cancelClassificationManager').addEventListener('click', () => closeAnimatedDialog(classificationManagerDialog));
  byId('saveClassificationManager').addEventListener('click', commitClassificationManagerName);
  classificationManagerName.addEventListener('input', () => classificationManagerName.setCustomValidity(''));
  classificationManagerName.addEventListener('input', () => {
    const folder = getFolder(classificationManagerFolderId);
    if (!folder || classificationManagerShortName.value.trim()) return;
    classificationManagerShortName.placeholder = `${classificationText().shortAuto} · ${folderShortName({ ...folder, name:classificationManagerName.value.trim(), nameKey:null, shortName:'' })}`;
  });
  classificationManagerShortName.addEventListener('input', () => {
    const normalized = normalizedFolderShortName(classificationManagerShortName.value);
    if (classificationManagerShortName.value !== normalized) classificationManagerShortName.value = normalized;
    syncClassificationEmojiSelection();
  });
  classificationEmojiButton.addEventListener('click', event => {
    event.preventDefault();
    event.stopPropagation();
    if (classificationEmojiPicker.hidden) openClassificationEmojiPicker();
    else closeClassificationEmojiPicker(true);
  });
  classificationEmojiGrid.addEventListener('click', event => {
    const option = event.target.closest('[data-classification-emoji]');
    if (!option) return;
    classificationManagerShortName.value = normalizedFolderShortName(option.dataset.classificationEmoji);
    classificationManagerShortName.dispatchEvent(new Event('input', { bubbles:true }));
    closeClassificationEmojiPicker(true);
  });
  byId('classificationEmojiAuto').addEventListener('click', () => {
    classificationManagerShortName.value = '';
    classificationManagerShortName.dispatchEvent(new Event('input', { bubbles:true }));
    closeClassificationEmojiPicker(true);
  });
  classificationEmojiGrid.addEventListener('keydown', event => {
    if (!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End'].includes(event.key)) return;
    const options = [...classificationEmojiGrid.querySelectorAll('button')];
    const current = Math.max(0, options.indexOf(document.activeElement));
    const columns = 8;
    const next = event.key === 'Home' ? 0
      : event.key === 'End' ? options.length - 1
      : event.key === 'ArrowLeft' ? current - 1
      : event.key === 'ArrowRight' ? current + 1
      : event.key === 'ArrowUp' ? current - columns
      : current + columns;
    event.preventDefault();
    options[Math.max(0, Math.min(options.length - 1, next))]?.focus();
  });
  document.addEventListener('click', event => {
    if (!event.target.closest?.('#classificationEmojiPicker,#classificationEmojiButton')) closeClassificationEmojiPicker();
  });
  classificationManagerDialog.addEventListener('keydown', event => {
    if (event.key !== 'Escape' || classificationEmojiPicker.hidden) return;
    event.preventDefault();
    event.stopPropagation();
    closeClassificationEmojiPicker(true);
  }, true);
  classificationManagerColor.addEventListener('input', syncClassificationManagerColor);
  byId('classificationColorPresets').addEventListener('click', event => {
    const preset = event.target.closest('[data-classification-color]');
    if (!preset) return;
    classificationManagerColor.value = normalizedClassificationColor(preset.dataset.classificationColor);
    syncClassificationManagerColor();
  });
  classificationManagerName.addEventListener('keydown', event => {
    if (isImeComposing(event)) return;
    if (event.key === 'Enter') { event.preventDefault(); commitClassificationManagerName(); }
    if (event.key === 'Escape') { event.preventDefault(); closeAnimatedDialog(classificationManagerDialog); }
  });
  classificationManagerShortName.addEventListener('keydown', event => {
    if (isImeComposing(event)) return;
    if (event.key === 'Enter') { event.preventDefault(); commitClassificationManagerName(); }
    if (event.key === 'Escape') { event.preventDefault(); closeAnimatedDialog(classificationManagerDialog); }
  });
  byId('deleteClassification').addEventListener('click', () => {
    const folder = getFolder(classificationManagerFolderId);
    const fallback = library.folders.find(entry => entry.id !== folder?.id);
    if (!folder || !fallback) return;
    const copy = classificationText();
    const itemCount = library.items.filter(item => item.folderId === folder.id).length;
    if (!confirm(formatClassificationMessage(copy.deleteConfirm, folderName(folder), itemCount, folderName(fallback)))) return;
    const movedAt = new Date().toISOString();
    library.items.forEach(item => { if (item.folderId === folder.id) { item.folderId = fallback.id; item.updatedAt = movedAt; } });
    library.folders = library.folders.filter(entry => entry.id !== folder.id);
    if (currentView === `folder:${folder.id}`) currentView = `folder:${fallback.id}`;
    classificationManagerFolderId = fallback.id;
    persist();
    renderAll();
    renderClassificationManager();
    showToast(formatClassificationMessage(copy.deleted, folderName(fallback)));
  });

  const todoMetaMessages = {
    zh: { edit:'编辑', confirm:'确认时间设置', schedule:'时间安排', created:'创建日期时间', start:'开始日期时间', due:'截止日期时间', clear:'取消', notSet:'未设置', immutable:'创建时间不可更改', invalid:'请输入有效日期时间，且截止时间必须晚于开始时间。', calendarHidden:'开始或截止时间未设置，此待办将不在日历中显示。' },
    en: { edit:'Edit', confirm:'Confirm time settings', schedule:'Schedule', created:'Created date and time', start:'Start date and time', due:'Due date and time', clear:'Clear', notSet:'Not set', immutable:'The creation time cannot be changed', invalid:'Enter valid dates and times, with the due time after the start time.', calendarHidden:'Without both a start and due time, this task will not appear in the calendar.' },
    'zh-Hant': { edit:'編輯', confirm:'確認時間設定', schedule:'時間安排', created:'建立日期時間', start:'開始日期時間', due:'截止日期時間', clear:'取消', notSet:'未設定', immutable:'建立時間不可更改', invalid:'請輸入有效日期時間，且截止時間必須晚於開始時間。', calendarHidden:'開始或截止時間未設定，此待辦將不在日曆中顯示。' }
  };
  const todoMetaText = () => todoMetaMessages[uiSettings.language] || todoMetaMessages.zh;

  createItem = function createItemWithSchedule(type) {
    if (type === 'quick') { openQuickCapture(); return; }
    if (type !== 'note' && type !== 'todo') return;
    const now = new Date().toISOString();
    const currentFolder = currentView.startsWith('folder:') ? currentView.split(':')[1] : 'ideas';
    const base = {
      id: uid(), type, folderId:type === 'todo' ? '' : (getFolder(currentFolder) ? currentFolder : library.folders[0]?.id),
      title: type === 'note' ? t('untitledNote') : t('untitledTodo'), linkedIds: [], createdAt: now, updatedAt: now
    };
    const item = type === 'note'
      ? { ...base, body: '<p><br></p>' }
      : { ...base, startAt:now, dueAt:'', priority:'medium', notes:'', tasks:[{ id:uid(), text:'', done:false }], completed:false };
    library.items.unshift(item);
    selectedId = item.id;
    mobileEditorOpen = true;
    resetListFilters(type);
    currentFilter = 'all';
    searchQuery = '';
    byId('searchInput').value = '';
    persist();
    renderAll();
    byId('createMenu').classList.remove('open');
    showToast(`${t('itemCreated')} · ${t(type)}`);
    requestAnimationFrame(() => byId('editorTitle')?.select());
  };

  classificationField = function selectableClassificationField(item) {
    const currentFolder = getFolder(item.folderId);
    return `<div class="meta-field classification-field">
      <div class="meta-field-heading">
        <label for="classificationFolder"><svg><use href="#i-folder"/></svg>${t('classify')}</label>
      </div>
      <div class="classification-controls classification-select-only">
        <select id="classificationFolder" aria-label="${t('classify')}">
          <option value="" ${currentFolder ? '' : 'selected'}>${escapeHTML(t('unclassified'))}</option>
          ${library.folders.map(folder => `<option value="${escapeHTML(folder.id)}" ${folder.id === item.folderId ? 'selected' : ''}>${escapeHTML(folderName(folder))}</option>`).join('')}
        </select>
      </div>
    </div>`;
  };

  const itemMetaMessages = {
    zh: { open:'编辑时间安排、优先级和归类', noteOpen:'编辑归类', close:'关闭属性设置', panel:'项目属性' },
    en: { open:'Edit schedule, priority, and classification', noteOpen:'Edit classification', close:'Close item properties', panel:'Item properties' },
    'zh-Hant': { open:'編輯時間安排、優先順序和歸類', noteOpen:'編輯歸類', close:'關閉屬性設定', panel:'項目屬性' }
  };
  const itemMetaText = () => itemMetaMessages[uiSettings.language] || itemMetaMessages.zh;

  function itemMetaPopover(item) {
    const copy = itemMetaText();
    if (item.type === 'note') {
      return `<div class="item-meta-popover note-meta-popover" id="itemMetaPopover" role="group" aria-label="${escapeHTML(copy.panel)}" hidden>${classificationField(item)}</div>`;
    }
    const metaCopy = todoMetaText();
    const startLabel = item.startAt ? formatDateTimeSeconds(item.startAt) : metaCopy.notSet;
    const dueLabel = item.dueAt ? formatDateTimeSeconds(item.dueAt) : metaCopy.notSet;
    const scheduleIncomplete = !item.startAt || !item.dueAt;
    return `<div class="item-meta-popover todo-meta-grid" id="itemMetaPopover" role="group" aria-label="${escapeHTML(copy.panel)}" hidden>
      <div class="meta-field schedule-field">
        <div class="meta-field-heading">
          <label><svg><use href="#i-calendar"/></svg>${escapeHTML(metaCopy.schedule)}</label>
          <span class="meta-field-actions">
            <button class="meta-edit-button" id="editSchedule" type="button"><svg><use href="#i-edit"/></svg><span>${escapeHTML(metaCopy.edit)}</span></button>
            <button class="meta-confirm-button" id="confirmSchedule" type="button" title="${escapeHTML(metaCopy.confirm)}" aria-label="${escapeHTML(metaCopy.confirm)}" hidden><svg><use href="#i-check"/></svg></button>
          </span>
        </div>
        <div class="schedule-created-row">
          <span><b>${escapeHTML(metaCopy.created)}</b><time id="todoCreatedAt" datetime="${escapeHTML(item.createdAt)}">${escapeHTML(formatDateTimeSeconds(item.createdAt))}</time></span>
          <small>${escapeHTML(metaCopy.immutable)}</small>
        </div>
        <div class="schedule-display" id="scheduleDisplay">
          <span><b>${escapeHTML(metaCopy.start)}</b><time id="scheduleStartValue" datetime="${escapeHTML(item.startAt || '')}">${escapeHTML(startLabel)}</time></span>
          <span><b>${escapeHTML(metaCopy.due)}</b><time id="scheduleDueValue" datetime="${escapeHTML(item.dueAt || '')}">${escapeHTML(dueLabel)}</time></span>
        </div>
        <div class="schedule-editor" id="scheduleEditor" hidden>
          <div class="schedule-editor-row"><label for="todoStartAt">${escapeHTML(metaCopy.start)}</label><button id="clearTodoStartAt" type="button">${escapeHTML(metaCopy.clear)}</button><input id="todoStartAt" type="datetime-local" step="1" value="${escapeHTML(dateTimeLocalValue(item.startAt))}" /></div>
          <div class="schedule-editor-row"><label for="todoDueAt">${escapeHTML(metaCopy.due)}</label><button id="clearTodoDueAt" type="button">${escapeHTML(metaCopy.clear)}</button><input id="todoDueAt" type="datetime-local" step="1" value="${escapeHTML(dateTimeLocalValue(item.dueAt))}" /></div>
        </div>
        <p class="schedule-warning" id="scheduleWarning" ${scheduleIncomplete ? '' : 'hidden'}>${escapeHTML(metaCopy.calendarHidden)}</p>
        <p class="meta-error" id="scheduleError" hidden>${escapeHTML(metaCopy.invalid)}</p>
      </div>
      <div class="meta-field priority-field"><label><svg><use href="#i-spark"/></svg>${t('priority')}</label><div class="priority-options">
        ${['high','medium','low'].map(value => `<button type="button" data-priority="${value}" class="${item.priority === value ? 'active' : ''}">${t(value)}</button>`).join('')}
      </div></div>
      ${classificationField(item)}
    </div>`;
  }

  const rendererEditorTop = editorTop;
  editorTop = function editorTopWithItemMeta(item) {
    const copy = itemMetaText();
    const openLabel = item.type === 'todo' ? copy.open : copy.noteOpen;
    let top = rendererEditorTop(item).replace(/<button title="[^"]*"><svg><use href="#i-more"\/><\/svg><\/button>/, `<button id="itemMetaButton" type="button" title="${escapeHTML(openLabel)}" aria-label="${escapeHTML(openLabel)}" aria-controls="itemMetaPopover" aria-expanded="false"><svg><use href="#i-more"/></svg></button>`);
    if (item.type === 'note') {
      const exportStart = top.indexOf('<button id="exportNote"');
      const exportEnd = exportStart < 0 ? -1 : top.indexOf('</button>', exportStart) + '</button>'.length;
      if (exportEnd > 0) {
        const focusAction = `<button id="focusNoteEditor" type="button" title="${escapeHTML(t('focusMode'))}" aria-label="${escapeHTML(t('focusMode'))}" aria-pressed="false"><svg><use href="#i-focus"/></svg></button>`;
        top = `${top.slice(0, exportEnd)}${focusAction}${top.slice(exportEnd)}`;
      }
    }
    const closingIndex = top.lastIndexOf('</div>');
    if (closingIndex < 0) return top;
    return `${top.slice(0, closingIndex)}${itemMetaPopover(item)}${top.slice(closingIndex)}`;
  };

  noteEditor = function noteEditorWithMetaMenu(item) {
    const text = stripHTML(item.body);
    const toolButton = (attributes, icon, label, className = '') => `<button type="button"${className ? ` class="${className}"` : ''} ${attributes} title="${escapeHTML(label)}" aria-label="${escapeHTML(label)}"><svg><use href="#${icon}"/></svg><span class="note-tool-label">${escapeHTML(label)}</span></button>`;
    const toolbar = `<div class="note-toolbar" data-toolbar-position="${escapeHTML(uiSettings.noteToolbarPosition)}" aria-label="${t('format')}">
      <select class="note-block-format" id="noteBlockFormat" title="${t('paragraph')}" aria-label="${t('paragraph')}"><option value="p">${t('paragraph')}</option><option value="h1">${t('heading1')}</option><option value="h2">${t('heading2')}</option><option value="h3">${t('heading3')}</option></select>
      ${toolButton('data-command="bold"', 'i-bold', t('bold'))}
      ${toolButton('data-command="italic"', 'i-italic', t('italic'))}
      ${toolButton('data-command="strikeThrough"', 'i-strike', t('strike'))}
      ${toolButton('data-note-action="highlight"', 'i-highlight', t('highlight'))}
      ${toolButton('data-note-action="inline-code"', 'i-code', t('inlineCode'))}
      <span class="toolbar-divider"></span>
      ${toolButton('data-command="insertUnorderedList"', 'i-list', t('bulletList'))}
      ${toolButton('data-command="insertOrderedList"', 'i-ordered-list', t('numberedList'))}
      ${toolButton('data-note-action="task-list"', 'i-task-list', t('taskList'))}
      ${toolButton('data-command="formatBlock" data-value="blockquote"', 'i-quote', t('quote'))}
      ${toolButton('data-command="formatBlock" data-value="pre"', 'i-code-block', t('codeBlock'))}
      ${toolButton('data-command="insertHorizontalRule"', 'i-divider', t('horizontalRule'))}
      <span class="toolbar-divider"></span>
      ${toolButton('data-note-action="link"', 'i-link', t('link'))}
      ${toolButton('data-command="unlink"', 'i-unlink', t('unlink'))}
      <span class="toolbar-divider"></span>
      ${toolButton('data-command="undo"', 'i-undo', t('undo'))}
      ${toolButton('data-command="redo"', 'i-redo', t('redo'))}
      ${toolButton('data-note-action="toggle-markdown"', 'i-markdown', t('markdownSource'), 'markdown-mode-toggle')}
    </div>`;
    const toolbarAtTop = uiSettings.noteToolbarPosition === 'top';
    return `<article class="editor-wrap note-editor" data-editor-id="${escapeHTML(item.id)}">
      <header class="note-focus-header">
        <span class="note-focus-mark"><svg><use id="noteFocusModeIcon" href="#i-note"/></svg></span>
        <span><small id="noteFocusModeLabel">${escapeHTML(t('richText'))}</small><strong id="noteFocusTitle">${escapeHTML(item.title || t('untitledNote'))}</strong><time id="noteFocusUpdatedAt" datetime="${escapeHTML(item.updatedAt)}"><svg><use href="#i-clock"/></svg>${escapeHTML(t('modified'))} ${escapeHTML(formatDateTimeSeconds(item.updatedAt))}</time></span>
        <button id="exitFocusNoteEditor" type="button" title="${escapeHTML(t('focusModeExit'))}" aria-label="${escapeHTML(t('focusModeExit'))}"><svg><use href="#i-focus-exit"/></svg><span>${escapeHTML(t('focusModeExit'))}</span></button>
      </header>
      ${editorTop(item)}
      <textarea class="editor-title" id="editorTitle" rows="1" placeholder="${t('untitledNote')}">${escapeHTML(item.title)}</textarea>
      <div class="editor-subline note-date-line">
        <time id="noteCreatedAt" datetime="${escapeHTML(item.createdAt)}"><svg><use href="#i-calendar"/></svg>${t('created')} ${formatDateTimeSeconds(item.createdAt)}</time>
        <time id="noteUpdatedAt" datetime="${escapeHTML(item.updatedAt)}"><svg><use href="#i-clock"/></svg>${t('modified')} ${formatDateTimeSeconds(item.updatedAt)}</time>
      </div>
      ${linkedItemsSection(item)}
      ${toolbarAtTop ? toolbar : ''}
      <div class="note-body" id="noteBody" contenteditable="true" inputmode="text" spellcheck="true" autocapitalize="sentences" data-placeholder="${t('notePlaceholder')}">${item.body || ''}</div>
      <textarea class="note-markdown-source" id="noteMarkdownSource" spellcheck="false" autocapitalize="off" autocomplete="off" aria-label="${t('markdownSource')}" hidden></textarea>
      <div class="note-footer"><span id="noteStats">${text.split(/\s+/).filter(Boolean).length} ${t('words')} · ${text.length} ${t('chars')}</span><span id="noteFormatMode">Acta / Markdown-ready</span></div>
      ${toolbarAtTop ? '' : toolbar}
    </article>`;
  };

  todoEditor = function enhancedTodoEditor(item) {
    const tasks = item.tasks || [];
    const completed = tasks.filter(task => task.done).length;
    const progress = tasks.length ? Math.round(completed / tasks.length * 100) : (isTodoComplete(item) ? 100 : 0);
    const metaCopy = todoMetaText();
    const startLabel = item.startAt ? formatDateTimeSeconds(item.startAt) : metaCopy.notSet;
    const dueLabel = item.dueAt ? formatDateTimeSeconds(item.dueAt) : metaCopy.notSet;
    return `<article class="editor-wrap todo-editor" data-editor-id="${escapeHTML(item.id)}">
      ${editorTop(item)}
      <textarea class="editor-title" id="editorTitle" rows="1" placeholder="${t('untitledTodo')}">${escapeHTML(item.title)}</textarea>
      <div class="editor-subline todo-time-line" aria-label="${escapeHTML(metaCopy.schedule)}">
        <time id="todoCreatedAtSummary" datetime="${escapeHTML(item.createdAt)}"><svg><use href="#i-calendar"/></svg><b>${escapeHTML(metaCopy.created)}</b><span>${escapeHTML(formatDateTimeSeconds(item.createdAt))}</span></time>
        <time id="todoStartAtSummary" datetime="${escapeHTML(item.startAt || '')}"><svg><use href="#i-clock"/></svg><b>${escapeHTML(metaCopy.start)}</b><span>${escapeHTML(startLabel)}</span></time>
        <time id="todoDueAtSummary" datetime="${escapeHTML(item.dueAt || '')}"><svg><use href="#i-clock"/></svg><b>${escapeHTML(metaCopy.due)}</b><span>${escapeHTML(dueLabel)}</span></time>
      </div>
      ${linkedItemsSection(item)}
      <div class="progress-head"><h2>${t('progress')}</h2><span>${completed} / ${tasks.length} · ${progress}% ${t('done')}</span></div>
      <div class="progress-track"><i style="width:${progress}%"></i></div>
      <div class="task-list" id="taskList">
        ${tasks.map((task, index) => `<div class="task-row ${task.done ? 'done' : ''}" data-task-id="${escapeHTML(task.id)}" style="animation-delay:${index * 35}ms">
          <button class="task-check"><svg><use href="#i-check"/></svg></button>
          <div class="task-text" contenteditable="true" inputmode="text" spellcheck="true" autocapitalize="sentences" data-placeholder="${t('taskPlaceholder')}">${escapeHTML(task.text)}</div>
          <button class="remove-task"><svg><use href="#i-close"/></svg></button>
        </div>`).join('')}
      </div>
      <button class="add-task" id="addTask"><span><svg><use href="#i-plus"/></svg></span>${t('addTask')}</button>
      <section class="note-block"><h2>${t('description')}</h2><div class="todo-notes" id="todoNotes" contenteditable="true" inputmode="text" spellcheck="true" autocapitalize="sentences" data-placeholder="${t('descriptionPlaceholder')}">${escapeHTML(item.notes || '')}</div></section>
    </article>`;
  };

  bindTodoEditor = function bindEnhancedTodoEditor(item) {
    const editSchedule = byId('editSchedule');
    const confirmSchedule = byId('confirmSchedule');
    const scheduleDisplay = byId('scheduleDisplay');
    const scheduleEditor = byId('scheduleEditor');
    const scheduleError = byId('scheduleError');
    const scheduleWarning = byId('scheduleWarning');
    const startInput = byId('todoStartAt');
    const dueInput = byId('todoDueAt');
    const metaCopy = todoMetaText();

    const syncScheduleWarning = () => {
      scheduleWarning.hidden = Boolean(startInput.value && dueInput.value);
      dueInput.min = startInput.value || '';
    };
    const setScheduleEditing = editing => {
      editSchedule.hidden = editing;
      confirmSchedule.hidden = !editing;
      scheduleDisplay.hidden = editing;
      scheduleEditor.hidden = !editing;
      scheduleError.hidden = true;
      editSchedule.setAttribute('aria-expanded', String(editing));
      if (editing) requestAnimationFrame(() => startInput.focus());
    };

    editSchedule.addEventListener('click', () => {
      startInput.value = dateTimeLocalValue(item.startAt);
      dueInput.value = dateTimeLocalValue(item.dueAt);
      syncScheduleWarning();
      setScheduleEditing(true);
    });

    const clearScheduleInput = input => {
      input.value = '';
      scheduleError.hidden = true;
      syncScheduleWarning();
      input.focus();
    };
    byId('clearTodoStartAt').addEventListener('click', () => clearScheduleInput(startInput));
    byId('clearTodoDueAt').addEventListener('click', () => clearScheduleInput(dueInput));
    [startInput, dueInput].forEach(input => input.addEventListener('input', () => {
      scheduleError.hidden = true;
      syncScheduleWarning();
    }));

    confirmSchedule.addEventListener('click', () => {
      const nextStartAt = dateTimeLocalISO(startInput.value);
      const nextDueAt = dateTimeLocalISO(dueInput.value);
      if ((startInput.value && !nextStartAt) || (dueInput.value && !nextDueAt) || (nextStartAt && nextDueAt && nextDueAt <= nextStartAt)) {
        scheduleError.hidden = false;
        return;
      }
      item.startAt = nextStartAt;
      item.dueAt = nextDueAt;
      delete item.due;
      delete item.dueTime;
      delete item.durationMinutes;
      const startValue = byId('scheduleStartValue');
      const dueValue = byId('scheduleDueValue');
      startValue.dateTime = item.startAt;
      startValue.textContent = item.startAt ? formatDateTimeSeconds(item.startAt) : metaCopy.notSet;
      dueValue.dateTime = item.dueAt;
      dueValue.textContent = item.dueAt ? formatDateTimeSeconds(item.dueAt) : metaCopy.notSet;
      const syncSummaryTime = (id, value) => {
        const summary = byId(id);
        if (!summary) return;
        summary.dateTime = value || '';
        summary.querySelector('span').textContent = value ? formatDateTimeSeconds(value) : metaCopy.notSet;
      };
      syncSummaryTime('todoStartAtSummary', item.startAt);
      syncSummaryTime('todoDueAtSummary', item.dueAt);
      scheduleWarning.hidden = Boolean(item.startAt && item.dueAt);
      touchItem(item);
      renderList();
      renderSidebar();
      setScheduleEditing(false);
    });

    [startInput, dueInput].forEach(input => input.addEventListener('keydown', event => {
      if (event.key === 'Enter') { event.preventDefault(); confirmSchedule.click(); }
      if (event.key === 'Escape') { event.preventDefault(); setScheduleEditing(false); }
    }));

    $$('.priority-options button').forEach(button => button.addEventListener('click', () => {
      item.priority = button.dataset.priority;
      touchItem(item);
      $$('.priority-options button').forEach(entry => entry.classList.toggle('active', entry === button));
      renderList();
    }));

    $$('.task-row').forEach(row => {
      const task = item.tasks.find(entry => entry.id === row.dataset.taskId);
      $('.task-check', row).addEventListener('click', () => {
        task.done = !task.done;
        item.completed = (item.tasks || []).length > 0 && item.tasks.every(entry => entry.done);
        row.classList.toggle('done', task.done);
        row.classList.remove('task-toggle-motion');
        requestAnimationFrame(() => row.classList.add('task-toggle-motion'));
        touchItem(item);
        setTimeout(() => { renderEditor(); renderList(); renderSidebar(); }, 220);
      });
      $('.task-text', row).addEventListener('input', event => { task.text = event.target.textContent; touchItem(item); updateCard(item); });
      $('.task-text', row).addEventListener('keydown', event => {
        if (isImeComposing(event)) return;
        if (event.key === 'Enter') { event.preventDefault(); addTask(item); }
      });
      $('.remove-task', row).addEventListener('click', () => {
        item.tasks = item.tasks.filter(entry => entry.id !== task.id);
        item.completed = item.tasks.length > 0 && item.tasks.every(entry => entry.done);
        touchItem(item); renderEditor(); renderList(); renderSidebar();
      });
    });
    byId('addTask').addEventListener('click', () => addTask(item));
    byId('todoNotes').addEventListener('input', event => { item.notes = event.target.textContent; touchItem(item); updateCard(item); });
  };

  const rendererBindEditor = bindEditor;
  bindEditor = function bindSelectableClassification(item) {
    rendererBindEditor(item);
  };

  const closeItemMetaPopover = (restoreFocus = false) => {
    const panel = byId('itemMetaPopover');
    const button = byId('itemMetaButton');
    if (!panel || !button || panel.hidden || panel.classList.contains('is-closing')) return;
    button.classList.remove('is-open');
    button.setAttribute('aria-expanded', 'false');
    const item = getItem();
    const copy = itemMetaText();
    const label = item?.type === 'todo' ? copy.open : copy.noteOpen;
    button.title = label;
    button.setAttribute('aria-label', label);
    const finish = () => {
      clearTimeout(animatedDialogCloseTimers.get(panel));
      animatedDialogCloseTimers.delete(panel);
      if (panel.isConnected) {
        panel.hidden = true;
        panel.classList.remove('is-closing');
      }
      if (restoreFocus && button.isConnected) button.focus();
    };
    if (reduceWindowMotion()) { finish(); return; }
    panel.classList.add('is-closing');
    animatedDialogCloseTimers.set(panel, setTimeout(finish, 220));
  };

  document.addEventListener('click', event => {
    const button = event.target.closest?.('#itemMetaButton');
    if (button) {
      event.preventDefault();
      const panel = byId('itemMetaPopover');
      if (!panel) return;
      const opening = panel.hidden || panel.classList.contains('is-closing');
      if (opening) {
        clearTimeout(animatedDialogCloseTimers.get(panel));
        animatedDialogCloseTimers.delete(panel);
        panel.classList.remove('is-closing');
        panel.hidden = false;
        button.classList.add('is-open');
        button.setAttribute('aria-expanded', 'true');
        button.title = itemMetaText().close;
        button.setAttribute('aria-label', itemMetaText().close);
      } else closeItemMetaPopover();
      return;
    }
    if (!event.target.closest?.('#itemMetaPopover')) closeItemMetaPopover();
  });
  document.addEventListener('keydown', event => {
    if (isImeComposing(event)) return;
    if (event.key === 'Escape' && !byId('itemMetaPopover')?.hidden) closeItemMetaPopover(true);
  });

  function syncMergedTodoNavigation() {
    const switchButton = byId('todoStatusSwitch');
    const todoNavigation = document.querySelector('.smart-nav [data-view="todos"]');
    const onTodoView = currentView === 'todos' || currentView === 'completed';
    const mobile = matchMedia('(max-width: 800px)').matches;
    document.body.classList.remove('hide-type-filters');
    document.body.classList.toggle('merged-todo-view', onTodoView);
    switchButton.hidden = !onTodoView;
    if (onTodoView) {
      const nextLabel = currentView === 'completed' ? t('todos') : t('completed');
      switchButton.querySelector('span').textContent = nextLabel;
      switchButton.title = nextLabel;
      switchButton.setAttribute('aria-label', nextLabel);
    }
    if (todoNavigation) todoNavigation.classList.toggle('active', currentView === 'todos' || (mobile && currentView === 'completed'));

    document.querySelectorAll('.item-card').forEach(card => {
      if (!card.querySelector('.type-pill.note')) return;
      const tagCount = [...card.querySelectorAll('.card-bottom > span')].find(node => node.querySelector('use[href="#i-tag"]'));
      tagCount?.remove();
    });
  }

  const rendererRenderList = renderList;
  renderList = function renderMergedMobileList() {
    rendererRenderList();
    syncMergedTodoNavigation();
  };

  byId('todoStatusSwitch').addEventListener('click', () => {
    const targetView = currentView === 'completed' ? 'todos' : 'completed';
    document.querySelector(`.smart-nav [data-view="${targetView}"]`)?.click();
  });
  matchMedia('(max-width: 800px)').addEventListener?.('change', syncMergedTodoNavigation);

  function showSyncNotice(message, state = '', hold = false) {
    const notice = byId('syncNotice');
    clearTimeout(autoSyncNoticeTimer);
    notice.querySelector('span').textContent = message;
    notice.className = `sync-notice show ${state}`;
    if (!hold) autoSyncNoticeTimer = setTimeout(() => notice.classList.remove('show'), state === 'error' ? 5200 : 3200);
  }

  const librarySignature = (snapshot = library) => JSON.stringify(snapshot);

  function openHandleDatabase() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('acta.workspace.handles', 1);
      request.onupgradeneeded = () => request.result.createObjectStore('handles');
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async function storeDirectoryHandle(key, handle) {
    if (!('indexedDB' in window)) return;
    const database = await openHandleDatabase();
    await new Promise((resolve, reject) => {
      const transaction = database.transaction('handles', 'readwrite');
      transaction.objectStore('handles').put(handle, key);
      transaction.oncomplete = resolve;
      transaction.onerror = () => reject(transaction.error);
    });
    database.close();
  }

  async function readDirectoryHandle(key) {
    if (!('indexedDB' in window)) return null;
    const database = await openHandleDatabase();
    const handle = await new Promise((resolve, reject) => {
      const request = database.transaction('handles').objectStore('handles').get(key);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
    database.close();
    return handle;
  }

  async function removeDirectoryHandle(key) {
    if (!('indexedDB' in window)) return;
    const database = await openHandleDatabase();
    await new Promise((resolve, reject) => {
      const transaction = database.transaction('handles', 'readwrite');
      transaction.objectStore('handles').delete(key);
      transaction.oncomplete = resolve;
      transaction.onerror = () => reject(transaction.error);
    });
    database.close();
  }

  function parseLibraryPayload(raw) {
    const payload = typeof raw === 'string' ? JSON.parse(raw) : raw;
    const candidate = payload?.format === 'acta-library' ? payload.library : payload;
    if (!candidate || !Array.isArray(candidate.items) || !Array.isArray(candidate.folders)) throw new Error(uiText('invalidLibrary'));
    return clearLegacyTags(normalizeLibrary(candidate));
  }

  const itemFileBaseName = item => {
    const bytes = new TextEncoder().encode(String(item.id || 'item'));
    const encodedId = [...bytes].map(byte => byte.toString(16).padStart(2, '0')).join('');
    return `item-${encodedId || '00'}`;
  };
  const itemFileName = item => `${itemFileBaseName(item)}.json`;

  function createDataFolderDocuments(librarySnapshot) {
    const snapshot = clearLegacyTags(JSON.parse(JSON.stringify(librarySnapshot)));
    const syncedAt = new Date().toISOString();
    const notes = snapshot.items.filter(item => item.type === 'note').map(item => {
      const { body = '', ...configuration } = item;
      const baseName = itemFileBaseName(item);
      return {
        id:item.id, markdownFile:`${baseName}.md`, configFile:`${baseName}.json`, updatedAt:item.updatedAt || '',
        markdown:noteHTMLToMarkdown(body),
        config:{ format:'acta-note-config', version:1, contentFile:`${baseName}.md`, item:configuration }
      };
    });
    const todos = snapshot.items.filter(item => item.type === 'todo').map(item => ({
      id: item.id, file: itemFileName(item), updatedAt: item.updatedAt || '',
      document: { format:'acta-todo', version:1, item }
    }));
    return {
      manifest: {
        format:'acta-data-folder', version:3, libraryVersion:snapshot.version || 1, syncedAt,
        classifications:classificationsFile,
        notes:notes.map(({ id, markdownFile, configFile, updatedAt }) => ({ id, markdown:markdownFile, config:configFile, updatedAt })),
        todos:todos.map(({ id, file, updatedAt }) => ({ id, file, updatedAt })),
        itemOrder:snapshot.items.map(item => item.id)
      },
      classifications: { format:'acta-classifications', version:1, folders:snapshot.folders || [] },
      notes,
      todos
    };
  }

  function libraryFromDataFolderDocuments(documents) {
    const { manifest, classifications, notes = [], todos = [] } = documents || {};
    if (manifest?.format !== 'acta-data-folder' || Number(manifest.version) < 2) throw new Error(uiText('invalidLibrary'));
    const folders = classifications?.format === 'acta-classifications' && Array.isArray(classifications.folders)
      ? classifications.folders : (Array.isArray(classifications) ? classifications : null);
    if (!folders) throw new Error(uiText('invalidLibrary'));
    const unwrapItem = (document, expectedType) => {
      const item = document?.item || document;
      if (!item || item.type !== expectedType || !item.id) throw new Error(uiText('invalidLibrary'));
      return item;
    };
    const unwrapNote = document => {
      if (document?.config && Object.prototype.hasOwnProperty.call(document, 'markdown')) {
        const configuration = document.config?.item || document.config;
        if (!configuration || configuration.type !== 'note' || !configuration.id) throw new Error(uiText('invalidLibrary'));
        return { ...configuration, body:markdownToNoteHTML(String(document.markdown || '')) };
      }
      return unwrapItem(document, 'note');
    };
    const items = [
      ...notes.map(unwrapNote),
      ...todos.map(document => unwrapItem(document, 'todo'))
    ];
    const itemMap = new Map(items.map(item => [item.id, item]));
    const ordered = (manifest.itemOrder || []).map(id => itemMap.get(id)).filter(Boolean);
    items.forEach(item => { if (!ordered.includes(item)) ordered.push(item); });
    return clearLegacyTags(normalizeLibrary({ version:manifest.libraryVersion || 1, folders, items:ordered }));
  }

  function createPortableDataFolderBundle(librarySnapshot) {
    const documents = createDataFolderDocuments(librarySnapshot);
    return {
      format:'acta-data-folder-bundle', version:3,
      files: {
        [dataManifestFile]: documents.manifest,
        [classificationsFile]: documents.classifications,
        [notesDirectoryName]: Object.fromEntries(documents.notes.flatMap(entry => [[entry.configFile, entry.config], [entry.markdownFile, entry.markdown]])),
        [todosDirectoryName]: Object.fromEntries(documents.todos.map(entry => [entry.file, entry.document]))
      }
    };
  }

  function parsePortableDataFolderBundle(payload) {
    if (payload?.format !== 'acta-data-folder-bundle') return parseLibraryPayload(payload);
    const files = payload.files || {};
    const manifest = files[dataManifestFile];
    const noteFiles = files[notesDirectoryName] || {};
    const todoFiles = files[todosDirectoryName] || {};
    return libraryFromDataFolderDocuments({
      manifest,
      classifications:files[classificationsFile],
      notes:(manifest?.notes || []).map(entry => entry.config && entry.markdown
        ? { config:noteFiles[entry.config], markdown:noteFiles[entry.markdown] ?? '' }
        : noteFiles[entry.file]),
      todos:(manifest?.todos || []).map(entry => todoFiles[entry.file])
    });
  }

  async function writeJSONFile(directory, name, value) {
    const fileHandle = await directory.getFileHandle(name, { create:true });
    const writable = await fileHandle.createWritable();
    await writable.write(JSON.stringify(value, null, 2));
    await writable.close();
  }

  async function writeTextFile(directory, name, value) {
    const fileHandle = await directory.getFileHandle(name, { create:true });
    const writable = await fileHandle.createWritable();
    await writable.write(String(value || ''));
    await writable.close();
  }

  async function readJSONFile(directory, name) {
    const fileHandle = await directory.getFileHandle(name);
    const file = await fileHandle.getFile();
    return JSON.parse(await file.text());
  }

  async function readTextFile(directory, name) {
    const fileHandle = await directory.getFileHandle(name);
    return (await fileHandle.getFile()).text();
  }

  async function removeStaleItemFiles(directory, expectedFiles) {
    if (!directory.entries || !directory.removeEntry) return;
    for await (const [name, entry] of directory.entries()) {
      if (entry.kind === 'file' && /^item-[a-f0-9]+\.(?:json|md)$/i.test(name) && !expectedFiles.has(name)) {
        await directory.removeEntry(name);
      }
    }
  }

  async function saveDataFolder(handle, librarySnapshot) {
    const documents = createDataFolderDocuments(librarySnapshot);
    const notesDirectory = await handle.getDirectoryHandle(notesDirectoryName, { create:true });
    const todosDirectory = await handle.getDirectoryHandle(todosDirectoryName, { create:true });
    await Promise.all(documents.notes.flatMap(entry => [
      writeJSONFile(notesDirectory, entry.configFile, entry.config),
      writeTextFile(notesDirectory, entry.markdownFile, entry.markdown)
    ]));
    await Promise.all(documents.todos.map(entry => writeJSONFile(todosDirectory, entry.file, entry.document)));
    await writeJSONFile(handle, classificationsFile, documents.classifications);
    await writeJSONFile(handle, dataManifestFile, documents.manifest);
    await removeStaleItemFiles(notesDirectory, new Set(documents.notes.flatMap(entry => [entry.configFile, entry.markdownFile])));
    await removeStaleItemFiles(todosDirectory, new Set(documents.todos.map(entry => entry.file)));
  }

  async function loadDataFolder(handle) {
    let manifest;
    try {
      manifest = await readJSONFile(handle, dataManifestFile);
    } catch (error) {
      if (error?.name !== 'NotFoundError') throw error;
      const legacyPayload = await readJSONFile(handle, legacyLibraryFile);
      const legacyLibrary = parseLibraryPayload(legacyPayload);
      await saveDataFolder(handle, legacyLibrary);
      return legacyLibrary;
    }
    const classifications = await readJSONFile(handle, manifest.classifications || classificationsFile);
    const notesDirectory = await handle.getDirectoryHandle(notesDirectoryName);
    const todosDirectory = await handle.getDirectoryHandle(todosDirectoryName);
    const notes = await Promise.all((manifest.notes || []).map(entry => entry.config && entry.markdown
      ? Promise.all([readJSONFile(notesDirectory, entry.config), readTextFile(notesDirectory, entry.markdown)]).then(([config, markdown]) => ({ config, markdown }))
      : readJSONFile(notesDirectory, entry.file)));
    const todos = await Promise.all((manifest.todos || []).map(entry => readJSONFile(todosDirectory, entry.file)));
    const loadedLibrary = libraryFromDataFolderDocuments({ manifest, classifications, notes, todos });
    if (Number(manifest.version) < 3) await saveDataFolder(handle, loadedLibrary);
    return loadedLibrary;
  }

  function createWebFolderAdapter(handle, kind) {
    return {
      kind: 'web', handle, label: handle.name || uiText('localFolder'),
      save: librarySnapshot => saveDataFolder(handle, librarySnapshot),
      load: () => loadDataFolder(handle),
      version: async () => {
        try {
          const file = await (await handle.getFileHandle(dataManifestFile)).getFile();
          return `${file.lastModified}:${file.size}`;
        } catch (error) {
          if (error?.name === 'NotFoundError') return '';
          throw error;
        }
      }
    };
  }

  function createNativeFolderAdapter(folder, bridge, label = folder) {
    return {
      kind: 'native', folder, label,
      save: librarySnapshot => bridge.uploadLibrary(folder, createPortableDataFolderBundle(librarySnapshot)),
      load: async () => {
        const payload = (await bridge.downloadLibrary(folder)).library;
        const loadedLibrary = parsePortableDataFolderBundle(payload);
        if (payload?.format !== 'acta-data-folder-bundle' || Number(payload.version) < 3 || Number(payload?.files?.[dataManifestFile]?.version) < 3) {
          await bridge.uploadLibrary(folder, createPortableDataFolderBundle(loadedLibrary));
        }
        return loadedLibrary;
      },
      version: async () => ''
    };
  }

  const profileLibraryStorageKey = id => `acta.data.profile.${id}.v1`;
  const createBlankLibrary = () => {
    const blank = createDefaultLibrary();
    blank.items = [];
    return clearLegacyTags(normalizeLibrary(blank));
  };

  function localProfileLocation() {
    if (window.actaDesktop) return profileText('localDesktop');
    if (window.Capacitor?.Plugins) return profileText('localNative');
    return profileText('localBrowser');
  }

  function createLocalProfileAdapter(profile) {
    return {
      kind:'local', label:localProfileLocation(), profile,
      save:async librarySnapshot => {
        try { localStorage.setItem(profileLibraryStorageKey(profile.id), JSON.stringify(clearLegacyTags(JSON.parse(JSON.stringify(librarySnapshot))))); }
        catch (error) {
          if (error?.name === 'QuotaExceededError' || error?.code === 22) throw new Error(profileText('localQuota'));
          throw error;
        }
      },
      load:async () => {
        const raw = localStorage.getItem(profileLibraryStorageKey(profile.id));
        if (!raw) {
          const error = new Error('Profile data not found');
          error.name = 'NotFoundError';
          throw error;
        }
        return parseLibraryPayload(raw);
      },
      version:async () => profile.updatedAt || ''
    };
  }

  async function platformRequest(url, options = {}) {
    const desktopRequest = window.actaDesktop?.webDavRequest;
    if (desktopRequest) {
      const result = await desktopRequest(url, {
        method:options.method || 'GET', headers:options.headers || {}, body:options.body
      });
      const headerEntries = Object.entries(result.headers || {});
      return {
        ok:result.status >= 200 && result.status < 300,
        status:result.status,
        headers:{ get:name => headerEntries.find(([key]) => key.toLowerCase() === name.toLowerCase())?.[1] || null },
        text:async () => result.body || ''
      };
    }
    const nativeHttp = window.Capacitor?.Plugins?.CapacitorHttp;
    if (nativeHttp?.request && window.Capacitor?.isNativePlatform?.()) {
      const result = await nativeHttp.request({
        url, method:options.method || 'GET', headers:options.headers || {}, data:options.body,
        responseType:'text', connectTimeout:30000, readTimeout:30000, disableRedirects:false
      });
      const headerEntries = Object.entries(result.headers || {});
      const raw = typeof result.data === 'string' ? result.data : JSON.stringify(result.data ?? '');
      return {
        ok:result.status >= 200 && result.status < 300,
        status:result.status,
        headers:{ get:name => headerEntries.find(([key]) => key.toLowerCase() === name.toLowerCase())?.[1] || null },
        text:async () => raw
      };
    }
    return fetch(url, options);
  }

  function describeWebDavNetworkError(error, requestUrl) {
    const message = String(error?.message || error || 'Unknown network error');
    if (!/failed to fetch|networkerror|load failed|network request failed/i.test(message)) return message;
    let target;
    try { target = new URL(requestUrl); } catch { return syncText('webDavNetwork'); }
    if (location.protocol === 'https:' && target.protocol === 'http:') return syncText('webDavMixedContent');
    const nativeTransport = Boolean(window.actaDesktop?.webDavRequest || (window.Capacitor?.isNativePlatform?.() && window.Capacitor?.Plugins?.CapacitorHttp));
    return nativeTransport ? syncText('webDavNetwork') : syncText('webDavCors');
  }

  async function runWithConcurrency(values, limit, worker) {
    let cursor = 0;
    const runners = Array.from({ length:Math.min(limit, values.length) }, async () => {
      while (cursor < values.length) {
        const index = cursor++;
        await worker(values[index], index);
      }
    });
    await Promise.all(runners);
  }

  function normalizeWebDavServer(value) {
    const raw = String(value || '').trim();
    const url = new URL(raw);
    if (!['http:', 'https:'].includes(url.protocol)) throw new Error(syncText('invalidWebDavUrl'));
    url.username = '';
    url.password = '';
    url.hash = '';
    url.search = '';
    if (!url.pathname.endsWith('/')) url.pathname += '/';
    return url.toString();
  }

  function webDavAuthorization(username, password) {
    if (!username && !password) return '';
    const bytes = new TextEncoder().encode(`${username}:${password}`);
    let binary = '';
    bytes.forEach(byte => { binary += String.fromCharCode(byte); });
    return `Basic ${btoa(binary)}`;
  }

  function createWebDavAdapter(configuration) {
    const config = {
      server:normalizeWebDavServer(configuration.server),
      username:String(configuration.username || ''),
      password:String(configuration.password || '')
    };
    const baseUrl = new URL(config.server);
    const resourceUrl = path => {
      const url = new URL(baseUrl.toString());
      const encodedPath = String(path || '').split('/').filter(Boolean).map(encodeURIComponent).join('/');
      url.pathname = `${baseUrl.pathname}${encodedPath}${path && String(path).endsWith('/') ? '/' : ''}`;
      return url.toString();
    };
    const auth = webDavAuthorization(config.username, config.password);

    async function request(path = '', options = {}) {
      const headers = { ...(options.headers || {}) };
      if (auth) headers.Authorization = auth;
      const targetUrl = resourceUrl(path);
      let response;
      try {
        response = await platformRequest(targetUrl, {
          method:options.method || 'GET',
          headers,
          body:options.body,
          cache:'no-store',
          redirect:'follow'
        });
      } catch (error) {
        throw new Error(describeWebDavNetworkError(error, targetUrl));
      }
      const raw = options.method === 'HEAD' ? '' : await response.text();
      const accepted = response.ok || (options.allow || []).includes(response.status);
      if (!accepted) {
        const error = new Error(`WebDAV HTTP ${response.status}${raw ? `: ${raw.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 160)}` : ''}`);
        error.status = response.status;
        if (response.status === 404) error.name = 'NotFoundError';
        throw error;
      }
      return { response, raw };
    }

    async function ensureCollection(path = '') {
      try {
        await request(path, {
          method:'PROPFIND',
          headers:{ Depth:'0', 'Content-Type':'application/xml; charset=utf-8' },
          body:'<?xml version="1.0" encoding="utf-8"?><d:propfind xmlns:d="DAV:"><d:prop><d:resourcetype/></d:prop></d:propfind>'
        });
        return;
      } catch (error) {
        if (error.status !== 404) throw error;
      }
      await request(path, { method:'MKCOL', allow:[201, 405] });
    }

    async function readJSON(path) {
      const { raw } = await request(path, { headers:{ Accept:'application/json' } });
      return JSON.parse(raw);
    }

    async function readText(path) {
      const { raw } = await request(path, { headers:{ Accept:'text/markdown, text/plain' } });
      return raw;
    }

    async function writeJSON(path, value) {
      await request(path, {
        method:'PUT',
        headers:{ 'Content-Type':'application/json; charset=utf-8' },
        body:JSON.stringify(value, null, 2)
      });
    }

    async function writeText(path, value) {
      await request(path, {
        method:'PUT',
        headers:{ 'Content-Type':'text/markdown; charset=utf-8' },
        body:String(value || '')
      });
    }

    async function listCollection(path) {
      const { raw } = await request(path, {
        method:'PROPFIND',
        headers:{ Depth:'1', 'Content-Type':'application/xml; charset=utf-8' },
        body:'<?xml version="1.0" encoding="utf-8"?><d:propfind xmlns:d="DAV:"><d:prop><d:resourcetype/></d:prop></d:propfind>'
      });
      const documentNode = new DOMParser().parseFromString(raw, 'application/xml');
      return [...documentNode.getElementsByTagNameNS('DAV:', 'href')].map(node => {
        try {
          const pathname = new URL(node.textContent, baseUrl).pathname.replace(/\/$/, '');
          return decodeURIComponent(pathname.slice(pathname.lastIndexOf('/') + 1));
        } catch { return ''; }
      }).filter(Boolean);
    }

    async function cleanCollection(path, expectedFiles) {
      const stale = (await listCollection(path)).filter(name => /^item-[a-f0-9]+\.(?:json|md)$/i.test(name) && !expectedFiles.has(name));
      await runWithConcurrency(stale, 3, name => request(`${path}/${name}`, { method:'DELETE', allow:[204, 404] }));
    }

    async function save(librarySnapshot) {
      const documents = createDataFolderDocuments(librarySnapshot);
      await ensureCollection('');
      await Promise.all([ensureCollection(notesDirectoryName + '/'), ensureCollection(todosDirectoryName + '/')]);
      await runWithConcurrency([
        ...documents.notes.flatMap(entry => [
          { path:`${notesDirectoryName}/${entry.configFile}`, value:entry.config, type:'json' },
          { path:`${notesDirectoryName}/${entry.markdownFile}`, value:entry.markdown, type:'text' }
        ]),
        ...documents.todos.map(entry => ({ path:`${todosDirectoryName}/${entry.file}`, value:entry.document, type:'json' }))
      ], 4, entry => entry.type === 'text' ? writeText(entry.path, entry.value) : writeJSON(entry.path, entry.value));
      await writeJSON(classificationsFile, documents.classifications);
      await writeJSON(dataManifestFile, documents.manifest);
      await Promise.all([
        cleanCollection(notesDirectoryName + '/', new Set(documents.notes.flatMap(entry => [entry.configFile, entry.markdownFile]))),
        cleanCollection(todosDirectoryName + '/', new Set(documents.todos.map(entry => entry.file)))
      ]);
    }

    async function load() {
      const manifest = await readJSON(dataManifestFile);
      const classifications = await readJSON(manifest.classifications || classificationsFile);
      const notes = new Array((manifest.notes || []).length);
      const todos = new Array((manifest.todos || []).length);
      await runWithConcurrency(manifest.notes || [], 4, async (entry, index) => {
        notes[index] = entry.config && entry.markdown
          ? { config:await readJSON(`${notesDirectoryName}/${entry.config}`), markdown:await readText(`${notesDirectoryName}/${entry.markdown}`) }
          : await readJSON(`${notesDirectoryName}/${entry.file}`);
      });
      await runWithConcurrency(manifest.todos || [], 4, async (entry, index) => { todos[index] = await readJSON(`${todosDirectoryName}/${entry.file}`); });
      const loadedLibrary = libraryFromDataFolderDocuments({ manifest, classifications, notes, todos });
      if (Number(manifest.version) < 3) await save(loadedLibrary);
      return loadedLibrary;
    }

    async function version() {
      try {
        const { response } = await request(dataManifestFile, { method:'HEAD' });
        return response.headers.get('ETag') || response.headers.get('Last-Modified') || response.headers.get('Content-Length') || '';
      } catch (error) {
        if (error.status === 404) return '';
        throw error;
      }
    }

    return {
      kind:'webdav',
      label:config.server,
      config,
      probe:async () => {
        await ensureCollection('');
        await Promise.all([ensureCollection(notesDirectoryName + '/'), ensureCollection(todosDirectoryName + '/')]);
        return true;
      },
      save,
      load,
      version
    };
  }

  async function chooseFolderAdapter(kind, handleKey = '') {
    const bridge = getSyncBridge();
    const chooseNativeFolder = async () => {
      const selection = await bridge.chooseSyncFolder();
      if (!selection) return null;
      const folder = typeof selection === 'string' ? selection : (selection.folder || selection.uri);
      if (!folder) return null;
      return createNativeFolderAdapter(folder, bridge, typeof selection === 'string' ? selection : (selection.label || selection.name || folder));
    };
    if (bridge && window.Capacitor?.isNativePlatform?.()) return chooseNativeFolder();
    if (window.showDirectoryPicker) {
      try {
        const pickerId = `acta-${String(kind).replace(/[^a-z0-9_-]/gi, '-').slice(0, 48)}`;
        const handle = await window.showDirectoryPicker({ id:pickerId, mode:'readwrite', startIn:'documents' });
        if (handle.requestPermission && await handle.requestPermission({ mode:'readwrite' }) !== 'granted') throw new Error(uiText('noFolderPermission'));
        if (handleKey) await storeDirectoryHandle(handleKey, handle);
        else if (kind === 'onedrive') await storeDirectoryHandle(kind, handle);
        return createWebFolderAdapter(handle, kind);
      } catch (error) {
        if (error?.name === 'AbortError') return null;
        if (!bridge || !['SecurityError', 'NotSupportedError'].includes(error?.name)) throw error;
      }
    }
    if (bridge) return chooseNativeFolder();
    throw new Error(uiText('unsupportedFolder'));
  }

  function replaceLibrary(nextLibrary) {
    library = clearLegacyTags(normalizeLibrary(nextLibrary));
    selectedId = library.items[0]?.id || null;
    currentView = 'inbox';
    resetListFilters();
    searchQuery = '';
    mobileEditorOpen = false;
    byId('searchInput').value = '';
    document.querySelectorAll('.filter-row [data-filter]').forEach(button => button.classList.toggle('active', button.dataset.filter === 'all'));
    renderAll();
  }

  const activeDataProfile = () => dataProfiles.find(profile => profile.id === uiSettings.activeDataProfileId) || null;
  const dataProfileById = id => dataProfiles.find(profile => profile.id === id) || null;
  const profileLocation = profile => profile?.storage === 'local' ? localProfileLocation() : (profile?.label || profile?.folder || profileText('folder'));
  const profileStats = (profile, snapshot = null) => {
    const source = snapshot?.items || [];
    if (snapshot) {
      profile.noteCount = source.filter(item => item.type === 'note').length;
      profile.todoCount = source.filter(item => item.type === 'todo').length;
      profile.updatedAt = new Date().toISOString();
    }
    return { notes:Number(profile.noteCount) || 0, todos:Number(profile.todoCount) || 0 };
  };

  function saveDataProfileRegistry() {
    uiSettings.dataProfiles = dataProfiles.map(profile => ({ ...profile }));
    saveUISettings();
  }

  function uniqueProfileName(baseName) {
    const normalizedBase = String(baseName || profileText('newName')).trim() || profileText('newName');
    if (!dataProfiles.some(profile => profile.name.toLocaleLowerCase() === normalizedBase.toLocaleLowerCase())) return normalizedBase;
    let index = 2;
    while (dataProfiles.some(profile => profile.name.toLocaleLowerCase() === `${normalizedBase} ${index}`.toLocaleLowerCase())) index += 1;
    return `${normalizedBase} ${index}`;
  }

  function applyAdapterToProfile(profile, adapter, handleKey = profile.handleKey || '') {
    if (adapter.kind === 'local') {
      profile.storage = 'local';
      delete profile.folder;
      delete profile.handleKey;
      profile.label = localProfileLocation();
      return;
    }
    profile.storage = 'folder';
    profile.label = adapter.label;
    if (adapter.kind === 'native') {
      profile.folder = adapter.folder;
      delete profile.handleKey;
    } else {
      profile.handleKey = handleKey;
      delete profile.folder;
    }
  }

  async function adapterForDataProfile(profile, interactive = false) {
    if (!profile || profile.storage === 'local') return createLocalProfileAdapter(profile);
    const bridge = getSyncBridge();
    if (profile.folder && bridge) return createNativeFolderAdapter(profile.folder, bridge, profile.label || profile.folder);
    if (profile.handleKey) {
      const handle = await readDirectoryHandle(profile.handleKey);
      if (!handle) throw new Error(profileText('unavailable'));
      let permission = handle.queryPermission ? await handle.queryPermission({ mode:'readwrite' }) : 'granted';
      if (permission !== 'granted' && interactive && handle.requestPermission) permission = await handle.requestPermission({ mode:'readwrite' });
      if (permission !== 'granted') throw new Error(profileText('unavailable'));
      return createWebFolderAdapter(handle, 'profile');
    }
    throw new Error(profileText('unavailable'));
  }

  function renderDataProfiles() {
    const copy = profileMessages[uiSettings.language] || profileMessages.zh;
    const active = activeDataProfile();
    const panelHeader = document.querySelector('[data-settings-panel="workspace"] .data-profile-header');
    panelHeader.querySelector('p').textContent = copy.panelDescription;
    byId('newDataProfile').querySelector('span').textContent = copy.newProfile;
    byId('newDataProfileTitle').textContent = copy.newProfile;
    byId('newDataProfileSubtitle').textContent = copy.newSubtitle;
    byId('newDataProfileNameLabel').textContent = copy.name;
    byId('newDataProfileStorageLabel').textContent = copy.location;
    byId('newDataProfileLocalLabel').textContent = localProfileLocation();
    byId('newDataProfileLocalHint').textContent = copy.localHint;
    byId('newDataProfileFolderLabel').textContent = copy.folder;
    byId('newDataProfileFolderHint').textContent = copy.folderHint;
    byId('cancelDataProfile').textContent = copy.cancel;
    byId('confirmDataProfile').querySelector('span').textContent = copy.createOpen;
    byId('dataProfileListTitle').textContent = copy.profiles;
    byId('dataProfileCount').textContent = profileText('count', dataProfiles.length);
    byId('activeDataProfileSummary').textContent = active ? profileText('activeSummary', active.name) : '';
    const browserNotice = byId('browserStorageNotice');
    browserNotice.hidden = Boolean(window.actaDesktop || window.Capacitor?.Plugins);
    browserNotice.querySelector('b').textContent = copy.browserTitle;
    browserNotice.querySelector('span').textContent = copy.browserHint;
    const list = byId('dataProfileList');
    list.innerHTML = dataProfiles.map((profile, index) => {
      const isActive = profile.id === active?.id;
      const editing = profile.id === editingDataProfileId;
      const stats = profileStats(profile);
      const location = profileLocation(profile);
      return `<article class="data-profile-card${isActive ? ' active' : ''}${editing ? ' editing' : ''}" role="listitem" data-profile-id="${escapeHTML(profile.id)}" style="--profile-delay:${Math.min(index * 45, 220)}ms">
        <div class="data-profile-card-main">
          <span class="data-profile-card-icon"><svg><use href="#i-${profile.storage === 'local' ? 'database' : 'folder'}"/></svg></span>
          <div class="data-profile-card-copy"><div class="data-profile-card-title"><b>${escapeHTML(profile.name)}</b>${isActive ? `<span class="data-profile-active-badge">${escapeHTML(copy.active)}</span>` : ''}</div><span class="data-profile-card-path" title="${escapeHTML(location)}">${escapeHTML(location)}</span><small class="data-profile-card-meta">${escapeHTML(profileText('stats', stats.notes, stats.todos))}</small></div>
          <div class="data-profile-card-actions"><button class="data-profile-action ${isActive ? 'current' : 'primary'}" type="button" data-profile-action="switch" ${isActive ? 'disabled' : ''}><svg><use href="#i-${isActive ? 'check' : 'database'}"/></svg><span>${escapeHTML(isActive ? copy.current : copy.open)}</span></button><button class="data-profile-action" type="button" data-profile-action="edit" aria-expanded="${editing}"><svg><use href="#i-edit"/></svg><span>${escapeHTML(copy.edit)}</span></button></div>
        </div>
        <div class="data-profile-editor"><div class="data-profile-editor-inner"><div class="data-profile-edit-grid"><input class="data-profile-edit-name" data-profile-name-input value="${escapeHTML(profile.name)}" maxlength="60" aria-label="${escapeHTML(copy.name)}"/><button class="data-profile-action primary" type="button" data-profile-action="save-name"><svg><use href="#i-check"/></svg><span>${escapeHTML(copy.saveName)}</span></button></div><div class="data-profile-location-row"><svg><use href="#i-${profile.storage === 'local' ? 'database' : 'folder'}"/></svg><span><b>${escapeHTML(copy.locationLabel)}</b><small title="${escapeHTML(location)}">${escapeHTML(location)}</small></span><button class="data-profile-action" type="button" data-profile-action="change-location"><svg><use href="#i-folder"/></svg><span>${escapeHTML(copy.changeLocation)}</span></button></div><div class="data-profile-editor-actions"><button class="data-profile-action danger" type="button" data-profile-action="delete" ${dataProfiles.length <= 1 ? 'disabled' : ''} title="${escapeHTML(dataProfiles.length <= 1 ? copy.lastProfile : copy.deleteProfile)}"><svg><use href="#i-trash"/></svg><span>${escapeHTML(copy.deleteProfile)}</span></button><button class="data-profile-action" type="button" data-profile-action="copy"><svg><use href="#i-copy"/></svg><span>${escapeHTML(copy.copy)}</span></button><button class="data-profile-action" type="button" data-profile-action="export"><svg><use href="#i-upload"/></svg><span>${escapeHTML(copy.export)}</span></button></div></div></div>
      </article>`;
    }).join('');
    if (editingDataProfileId) requestAnimationFrame(() => list.querySelector(`[data-profile-id="${CSS.escape(editingDataProfileId)}"] [data-profile-name-input]`)?.focus());
  }

  function updateWorkspaceUI() {
    const profile = activeDataProfile();
    const connected = Boolean(profile && workspaceAdapter);
    const displayName = profile?.name || uiText('actaData');
    byId('workspaceButton').querySelector('b').textContent = displayName;
    const cardStatus = byId('workspaceCardStatus');
    cardStatus.textContent = profile ? profileLocation(profile) : profileText('initializing');
    cardStatus.className = `workspace-card-status ${connected ? 'connected' : 'demo'}`;
    window.actaDataName = displayName;
    if (byId('viewEyebrow') && !currentView.startsWith('folder:')) byId('viewEyebrow').textContent = displayName;
  }

  async function queueWorkspaceSave(librarySnapshot = JSON.parse(JSON.stringify(library))) {
    const profile = activeDataProfile();
    const adapter = workspaceAdapter;
    if (!profile || !adapter) throw new Error(profileText('unavailable'));
    const snapshot = clearLegacyTags(JSON.parse(JSON.stringify(librarySnapshot)));
    profileStats(profile, snapshot);
    workspaceWriteQueue = workspaceWriteQueue.catch(() => {}).then(() => adapter.save(snapshot)).then(() => saveDataProfileRegistry());
    return workspaceWriteQueue;
  }

  async function flushCurrentDataProfile() {
    clearTimeout(saveTimer);
    if (workspaceAdapter && activeDataProfile()) await queueWorkspaceSave();
  }

  persist = function persistWorkspace() {
    const saveState = byId('saveState');
    clearLegacyTags(library);
    autoSyncDirty = true;
    scheduleAutomaticSync();
    saveState.textContent = t('saving');
    saveState.classList.add('saving');
    clearTimeout(saveTimer);
    saveTimer = setTimeout(async () => {
      saveRendererSettings();
      try {
        await queueWorkspaceSave();
        saveState.textContent = t('saved');
        saveState.classList.remove('saving');
      } catch (error) {
        saveState.textContent = uiText('saveFailed', '').replace(/[:：]\s*$/, '');
        saveState.classList.remove('saving');
        setStatus(byId('workspaceStatus'), error.message, 'error');
      }
    }, 320);
  };

  function missingLibraryFile(error) {
    return error?.name === 'NotFoundError' || /ENOENT|not found|没有 (acta-library|acta-manifest)|不存在|Profile data not found/i.test(error?.message || '');
  }

  async function activateDataProfile(profileId, { adapter = null, createIfMissing = false, notify = true, interactive = false } = {}) {
    const profile = dataProfileById(profileId);
    if (!profile) return;
    const previousId = uiSettings.activeDataProfileId;
    if (workspaceAdapter && previousId && previousId !== profileId) await flushCurrentDataProfile();
    const nextAdapter = adapter || await adapterForDataProfile(profile, interactive);
    let snapshot;
    try { snapshot = await nextAdapter.load(); }
    catch (error) {
      if (!createIfMissing || !missingLibraryFile(error)) throw error;
      snapshot = createBlankLibrary();
      await nextAdapter.save(snapshot);
    }
    workspaceAdapter = nextAdapter;
    uiSettings.activeDataProfileId = profile.id;
    settings.syncFolder = nextAdapter.kind === 'native' ? nextAdapter.folder : '';
    uiSettings.workspaceLabel = nextAdapter.label;
    profile.label = profile.storage === 'local' ? localProfileLocation() : nextAdapter.label;
    profileStats(profile, snapshot);
    saveDataProfileRegistry();
    saveRendererSettings();
    replaceLibrary(snapshot);
    updateWorkspaceUI();
    renderDataProfiles();
    byId('saveState').textContent = t('saved');
    byId('saveState').classList.remove('saving');
    if (notify) setStatus(byId('workspaceStatus'), profileText(previousId === profile.id ? 'loaded' : 'switched', profile.name), 'success');
  }

  async function loadDataProfileSnapshot(profile, interactive = true) {
    if (profile.id === activeDataProfile()?.id) {
      await flushCurrentDataProfile();
      return clearLegacyTags(JSON.parse(JSON.stringify(library)));
    }
    return (await adapterForDataProfile(profile, interactive)).load();
  }

  function setDataProfileCreateOpen(open) {
    const form = byId('dataProfileCreate');
    form.classList.toggle('open', open);
    form.setAttribute('aria-hidden', String(!open));
    byId('newDataProfile').setAttribute('aria-expanded', String(open));
    if (open) {
      byId('newDataProfileName').value = uniqueProfileName(profileText('newName'));
      document.querySelector('input[name="newDataProfileStorage"][value="local"]').checked = true;
      requestAnimationFrame(() => byId('newDataProfileName').select());
    }
  }

  async function initializeDataProfiles() {
    const records = Array.isArray(uiSettings.dataProfiles) ? uiSettings.dataProfiles : [];
    dataProfiles = records.filter(profile => profile && typeof profile.id === 'string').map(profile => ({ storage:'local', name:profileText('defaultName'), noteCount:0, todoCount:0, ...profile }));
    if (!dataProfiles.length) {
      let legacyHandle = null;
      if (!savedNativeWorkspace) legacyHandle = await readDirectoryHandle('workspace').catch(() => null);
      const id = uid();
      const profile = { id, name:uiSettings.workspaceLabel || profileText('defaultName'), storage:savedNativeWorkspace || legacyHandle ? 'folder' : 'local', label:uiSettings.workspaceLabel || localProfileLocation(), noteCount:library.items.filter(item => item.type === 'note').length, todoCount:library.items.filter(item => item.type === 'todo').length, createdAt:new Date().toISOString(), updatedAt:new Date().toISOString() };
      if (savedNativeWorkspace) profile.folder = savedNativeWorkspace;
      else if (legacyHandle) { profile.handleKey = 'workspace'; profile.label = legacyHandle.name || profileText('folder'); }
      dataProfiles.push(profile);
      uiSettings.activeDataProfileId = id;
      if (profile.storage === 'local') await createLocalProfileAdapter(profile).save(library);
      saveDataProfileRegistry();
    }
    if (!dataProfileById(uiSettings.activeDataProfileId)) uiSettings.activeDataProfileId = dataProfiles[0].id;
    renderDataProfiles();
    updateWorkspaceUI();
    try {
      await activateDataProfile(uiSettings.activeDataProfileId, { createIfMissing:true, notify:false });
      setStatus(byId('workspaceStatus'), profileText('ready'), 'success');
    } catch (error) {
      const recovery = { id:uid(), name:uniqueProfileName(profileText('defaultName')), storage:'local', label:localProfileLocation(), createdAt:new Date().toISOString(), updatedAt:new Date().toISOString(), noteCount:library.items.filter(item => item.type === 'note').length, todoCount:library.items.filter(item => item.type === 'todo').length };
      dataProfiles.push(recovery);
      await createLocalProfileAdapter(recovery).save(library);
      await activateDataProfile(recovery.id, { notify:false });
      setStatus(byId('workspaceStatus'), `${error.message} ${profileText('ready')}`, 'error');
    }
  }

  byId('workspaceButton').addEventListener('click', () => openSettings('workspace'));
  byId('newDataProfile').addEventListener('click', () => setDataProfileCreateOpen(!byId('dataProfileCreate').classList.contains('open')));
  byId('cancelDataProfile').addEventListener('click', () => setDataProfileCreateOpen(false));
  byId('confirmDataProfile').addEventListener('click', async () => {
    const name = byId('newDataProfileName').value.trim();
    const storage = document.querySelector('input[name="newDataProfileStorage"]:checked')?.value || 'local';
    if (!name) { byId('newDataProfileName').focus(); setStatus(byId('workspaceStatus'), profileText('emptyName'), 'error'); return; }
    if (dataProfiles.some(profile => profile.name.toLocaleLowerCase() === name.toLocaleLowerCase())) { byId('newDataProfileName').focus(); setStatus(byId('workspaceStatus'), profileText('duplicateName'), 'error'); return; }
    const profile = { id:uid(), name, storage, label:localProfileLocation(), noteCount:0, todoCount:0, createdAt:new Date().toISOString(), updatedAt:new Date().toISOString() };
    try {
      const handleKey = `profile:${profile.id}`;
      const adapter = storage === 'local' ? createLocalProfileAdapter(profile) : await chooseFolderAdapter('profile', handleKey);
      if (!adapter) return;
      applyAdapterToProfile(profile, adapter, handleKey);
      await adapter.save(createBlankLibrary());
      dataProfiles.push(profile);
      saveDataProfileRegistry();
      await activateDataProfile(profile.id, { adapter, notify:false });
      setDataProfileCreateOpen(false);
      setStatus(byId('workspaceStatus'), profileText('created', profile.name), 'success');
    } catch (error) { setStatus(byId('workspaceStatus'), error.message, 'error'); }
  });
  byId('newDataProfileName').addEventListener('keydown', event => {
    if (!isImeComposing(event) && event.key === 'Enter') { event.preventDefault(); byId('confirmDataProfile').click(); }
  });

  byId('dataProfileList').addEventListener('click', async event => {
    const button = event.target.closest('[data-profile-action]');
    const card = event.target.closest('[data-profile-id]');
    if (!button || !card) return;
    const profile = dataProfileById(card.dataset.profileId);
    if (!profile) return;
    const action = button.dataset.profileAction;
    try {
      if (action === 'edit') {
        editingDataProfileId = editingDataProfileId === profile.id ? '' : profile.id;
        renderDataProfiles();
        return;
      }
      if (action === 'delete') {
        if (dataProfiles.length <= 1) throw new Error(profileText('lastProfile'));
        const confirmation = profileText(profile.storage === 'local' ? 'confirmDeleteLocal' : 'confirmDeleteFolder', profile.name);
        if (!window.confirm(confirmation)) return;
        const wasActive = profile.id === activeDataProfile()?.id;
        const fallback = wasActive ? dataProfiles.find(entry => entry.id !== profile.id) : null;
        let fallbackAdapter = null;
        if (wasActive) {
          clearTimeout(saveTimer);
          await workspaceWriteQueue.catch(() => {});
          fallbackAdapter = await adapterForDataProfile(fallback, true);
          await fallbackAdapter.load();
        }
        if (profile.storage === 'local') localStorage.removeItem(profileLibraryStorageKey(profile.id));
        if (profile.handleKey) await removeDirectoryHandle(profile.handleKey).catch(() => {});
        dataProfiles = dataProfiles.filter(entry => entry.id !== profile.id);
        editingDataProfileId = '';
        if (wasActive) {
          workspaceAdapter = null;
          uiSettings.activeDataProfileId = '';
          settings.syncFolder = '';
          saveDataProfileRegistry();
          await activateDataProfile(fallback.id, { adapter:fallbackAdapter, notify:false });
        } else {
          saveDataProfileRegistry();
          renderDataProfiles();
        }
        updateWorkspaceUI();
        setStatus(byId('workspaceStatus'), profileText('profileDeleted', profile.name), 'success');
        return;
      }
      if (action === 'switch') {
        await activateDataProfile(profile.id, { interactive:true });
        return;
      }
      if (action === 'save-name') {
        const name = card.querySelector('[data-profile-name-input]').value.trim();
        if (!name) throw new Error(profileText('emptyName'));
        if (dataProfiles.some(entry => entry.id !== profile.id && entry.name.toLocaleLowerCase() === name.toLocaleLowerCase())) throw new Error(profileText('duplicateName'));
        profile.name = name;
        profile.updatedAt = new Date().toISOString();
        saveDataProfileRegistry();
        updateWorkspaceUI();
        editingDataProfileId = '';
        renderDataProfiles();
        setStatus(byId('workspaceStatus'), profileText('renamed', name), 'success');
        return;
      }
      if (action === 'change-location') {
        const snapshot = await loadDataProfileSnapshot(profile, true);
        const handleKey = profile.handleKey || `profile:${profile.id}`;
        const adapter = await chooseFolderAdapter('profile', handleKey);
        if (!adapter) return;
        await adapter.save(snapshot);
        applyAdapterToProfile(profile, adapter, handleKey);
        profileStats(profile, snapshot);
        if (profile.id === activeDataProfile()?.id) {
          workspaceAdapter = adapter;
          settings.syncFolder = adapter.kind === 'native' ? adapter.folder : '';
          saveRendererSettings();
        }
        saveDataProfileRegistry();
        updateWorkspaceUI();
        renderDataProfiles();
        setStatus(byId('workspaceStatus'), profileText('moved', profile.name), 'success');
        return;
      }
      if (action === 'copy') {
        const snapshot = await loadDataProfileSnapshot(profile, true);
        const copyProfile = { id:uid(), name:uniqueProfileName(`${profile.name} ${profileText('copySuffix')}`), storage:'local', label:localProfileLocation(), createdAt:new Date().toISOString(), updatedAt:new Date().toISOString() };
        profileStats(copyProfile, snapshot);
        await createLocalProfileAdapter(copyProfile).save(snapshot);
        dataProfiles.push(copyProfile);
        saveDataProfileRegistry();
        renderDataProfiles();
        setStatus(byId('workspaceStatus'), profileText('copied', copyProfile.name), 'success');
        return;
      }
      if (action === 'export') {
        const snapshot = await loadDataProfileSnapshot(profile, true);
        const adapter = await chooseFolderAdapter('export');
        if (!adapter) return;
        await adapter.save(snapshot);
        setStatus(byId('workspaceStatus'), profileText('exported', profile.name, adapter.label), 'success');
      }
    } catch (error) { setStatus(byId('workspaceStatus'), error.message, 'error'); }
  });

  const dataProfilesReady = initializeDataProfiles();
  let settingsCloseTimer = 0;

  function openSettings(page = 'language') {
    clearTimeout(settingsCloseTimer);
    settingsCloseTimer = 0;
    settingsModal.classList.remove('is-closing');
    settingsModal.classList.add('open');
    settingsModal.setAttribute('aria-hidden', 'false');
    switchSettingsPage(page);
    syncLanguageChoice();
    applySettingsTranslation();
    updateOneDriveUI();
  }

  function closeSettings() {
    if (!settingsModal.classList.contains('open') || settingsModal.classList.contains('is-closing')) return;
    settingsModal.setAttribute('aria-hidden', 'true');
    const finish = () => {
      clearTimeout(settingsCloseTimer);
      settingsCloseTimer = 0;
      settingsModal.classList.remove('open', 'is-closing');
    };
    if (reduceWindowMotion()) { finish(); return; }
    settingsModal.classList.add('is-closing');
    settingsCloseTimer = setTimeout(finish, 250);
  }

  function switchSettingsPage(page) {
    document.querySelectorAll('[data-settings-page]').forEach(button => button.classList.toggle('active', button.dataset.settingsPage === page));
    document.querySelectorAll('[data-settings-panel]').forEach(panel => panel.classList.toggle('active', panel.dataset.settingsPanel === page));
  }

  byId('settingsButton').addEventListener('click', () => openSettings('language'));
  byId('mobileListSettings').addEventListener('click', event => {
    event.preventDefault();
    openSettings('general');
  }, true);
  byId('settingsClose').addEventListener('click', closeSettings);
  settingsModal.addEventListener('click', event => { if (event.target === settingsModal) closeSettings(); });
  document.querySelectorAll('[data-settings-page]').forEach(button => button.addEventListener('click', () => switchSettingsPage(button.dataset.settingsPage)));
  document.addEventListener('keydown', event => { if (!isImeComposing(event) && event.key === 'Escape') closeSettings(); });

  const brandButton = document.querySelector('.brand');
  let logoMotionFrame = 0;
  let logoMotionTimer = 0;
  const playLogoMotion = () => {
    cancelAnimationFrame(logoMotionFrame);
    clearTimeout(logoMotionTimer);
    brandButton.classList.remove('logo-pulse');
    logoMotionFrame = requestAnimationFrame(() => {
      brandButton.classList.add('logo-pulse');
      logoMotionTimer = window.setTimeout(() => brandButton.classList.remove('logo-pulse'), 620);
    });
  };
  brandButton.addEventListener('click', playLogoMotion);
  brandButton.addEventListener('keydown', event => {
    if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); playLogoMotion(); }
  });

  const sidebarToggle = byId('sidebarToggle');
  const dataRefreshButtons = [byId('dataRefreshButton'), byId('mobileDataRefresh')].filter(Boolean);
  const sidebarToggleCopy = {
    zh: { collapse:'收起左侧功能栏', expand:'展开左侧功能栏' },
    en: { collapse:'Collapse sidebar', expand:'Expand sidebar' },
    'zh-Hant': { collapse:'收起左側功能列', expand:'展開左側功能列' }
  };
  const dataRefreshCopy = {
    zh: { title:'刷新数据', syncLoading:'正在从数据同步位置刷新…', localLoading:'正在重新读取当前行记数据…', syncDone:'已从数据同步位置刷新', localDone:'当前行记数据已刷新', failed:'刷新失败：' },
    en: { title:'Refresh data', syncLoading:'Refreshing from the data sync location…', localLoading:'Reloading the current Acta Data…', syncDone:'Refreshed from the data sync location', localDone:'Current Acta Data refreshed', failed:'Refresh failed: ' },
    'zh-Hant': { title:'重新整理資料', syncLoading:'正在從資料同步位置重新整理…', localLoading:'正在重新讀取目前行記資料…', syncDone:'已從資料同步位置重新整理', localDone:'目前行記資料已重新整理', failed:'重新整理失敗：' }
  };
  let dataRefreshBusy = false;
  let dataRefreshStatusTimer = 0;
  const updateSidebarToggleLabel = () => {
    const collapsed = document.body.classList.contains('sidebar-collapsed');
    const copy = sidebarToggleCopy[uiSettings.language] || sidebarToggleCopy.zh;
    const label = collapsed ? copy.expand : copy.collapse;
    sidebarToggle.title = label;
    sidebarToggle.setAttribute('aria-label', label);
    sidebarToggle.setAttribute('aria-expanded', String(!collapsed));
  };
  const updateDataRefreshLabel = () => {
    const copy = dataRefreshCopy[uiSettings.language] || dataRefreshCopy.zh;
    dataRefreshButtons.forEach(button => {
      button.title = copy.title;
      button.setAttribute('aria-label', copy.title);
    });
  };
  const settleDataRefreshStatus = message => {
    const saveState = byId('saveState');
    clearTimeout(dataRefreshStatusTimer);
    saveState.textContent = message;
    saveState.classList.remove('saving');
    dataRefreshStatusTimer = window.setTimeout(() => {
      if (!saveState.classList.contains('saving') && saveState.textContent === message) saveState.textContent = t('saved');
    }, 1600);
  };
  const refreshCurrentData = async () => {
    if (dataRefreshBusy) return;
    dataRefreshBusy = true;
    const copy = dataRefreshCopy[uiSettings.language] || dataRefreshCopy.zh;
    const saveState = byId('saveState');
    const syncAdapter = activateSelectedCloudAdapter();
    const source = syncAdapter ? 'sync' : 'profile';
    dataRefreshButtons.forEach(button => {
      button.dataset.refreshSource = source;
      button.disabled = true;
      button.classList.add('is-refreshing');
      button.setAttribute('aria-busy', 'true');
    });
    saveState.textContent = source === 'sync' ? copy.syncLoading : copy.localLoading;
    saveState.classList.add('saving');
    clearTimeout(saveTimer);
    clearTimeout(autoSyncSaveTimer);
    autoSyncSaveTimer = null;
    try {
      await workspaceWriteQueue.catch(() => {});
      let snapshot;
      if (syncAdapter) {
        snapshot = await syncAdapter.load();
        replaceLibrary(snapshot);
        await refreshCloudVersion();
        autoSyncBaseline = librarySignature(snapshot);
        autoSyncDirty = false;
        if (!workspaceAdapter && activeDataProfile()) workspaceAdapter = await adapterForDataProfile(activeDataProfile(), true);
        if (workspaceAdapter) await queueWorkspaceSave(snapshot);
        updateWorkspaceUI();
        renderDataProfiles();
        setStatus(byId('oneDriveStatus'), copy.syncDone, 'success');
        showSyncNotice(copy.syncDone);
      } else {
        const profile = activeDataProfile();
        if (!profile) throw new Error(profileText('unavailable'));
        const adapter = workspaceAdapter || await adapterForDataProfile(profile, true);
        snapshot = await adapter.load();
        workspaceAdapter = adapter;
        profileStats(profile, snapshot);
        saveDataProfileRegistry();
        replaceLibrary(snapshot);
        updateWorkspaceUI();
        renderDataProfiles();
        autoSyncDirty = false;
        setStatus(byId('workspaceStatus'), copy.localDone, 'success');
        showSyncNotice(copy.localDone);
      }
      settleDataRefreshStatus(source === 'sync' ? copy.syncDone : copy.localDone);
    } catch (error) {
      const message = `${copy.failed}${error.message}`;
      settleDataRefreshStatus(message);
      if (source === 'sync') setStatus(byId('oneDriveStatus'), message, 'error');
      else setStatus(byId('workspaceStatus'), message, 'error');
      showSyncNotice(message, 'error');
    } finally {
      dataRefreshBusy = false;
      dataRefreshButtons.forEach(button => {
        button.disabled = false;
        button.classList.remove('is-refreshing');
        button.removeAttribute('aria-busy');
      });
    }
  };
  const applySidebarCollapse = collapsed => {
    closeFolderActionMenu();
    uiSettings.sidebarCollapsed = Boolean(collapsed);
    document.body.classList.toggle('sidebar-collapsed', uiSettings.sidebarCollapsed);
    updateSidebarToggleLabel();
  };
  applySidebarCollapse(uiSettings.sidebarCollapsed);
  updateDataRefreshLabel();
  dataRefreshButtons.forEach(button => button.addEventListener('click', refreshCurrentData));
  sidebarToggle.addEventListener('click', () => {
    byId('createMenu').classList.remove('open');
    applySidebarCollapse(!uiSettings.sidebarCollapsed);
    saveUISettings();
  });

  const mobileEdgeQuery = matchMedia('(max-width: 800px)');
  const reducedMotionQuery = matchMedia('(prefers-reduced-motion: reduce)');
  const mobileEdgeTimers = new WeakMap();
  let mobileEdgeGesture = null;
  const mobileEdgeSurfaceSelector = '.item-list, .editor-pane, .settings-content, .settings-nav';

  document.addEventListener('pointerup', event => {
    if (!mobileEdgeQuery.matches || event.pointerType === 'mouse') return;
    const card = event.target.closest?.('.item-card');
    if (!card) return;
    requestAnimationFrame(() => {
      card.classList.remove('active');
      card.blur();
    });
  }, true);

  const mobileEdgeTargetFor = surface => {
    if (surface.classList.contains('editor-pane')) return surface.querySelector('.editor-wrap');
    if (surface.classList.contains('settings-content')) return surface.querySelector('.settings-panel.active');
    return surface;
  };

  const clearMobileEdgeTarget = target => {
    if (!target) return;
    clearTimeout(mobileEdgeTimers.get(target));
    mobileEdgeTimers.delete(target);
    target.classList.remove('mobile-edge-dragging', 'mobile-edge-returning', 'mobile-edge-target');
    target.style.removeProperty('translate');
  };

  document.addEventListener('touchstart', event => {
    if (!mobileEdgeQuery.matches || reducedMotionQuery.matches || document.body.classList.contains('acta-reduce-motion') || event.touches.length !== 1) return;
    const surface = event.target.closest?.(mobileEdgeSurfaceSelector);
    if (!surface || (surface.classList.contains('editor-pane') && !surface.classList.contains('mobile-open'))) return;
    const target = mobileEdgeTargetFor(surface);
    if (!target) return;
    clearMobileEdgeTarget(target);
    target.classList.add('mobile-edge-target', 'mobile-edge-dragging');
    const touch = event.touches[0];
    mobileEdgeGesture = {
      surface, target, startX: touch.clientX, startY: touch.clientY,
      lastY: touch.clientY, axis: '', edgeDistance: 0, offset: 0, active: false, frame: 0
    };
  }, { passive: true });

  document.addEventListener('touchmove', event => {
    const gesture = mobileEdgeGesture;
    if (!gesture || event.touches.length !== 1) return;
    const touch = event.touches[0];
    const totalX = touch.clientX - gesture.startX;
    const totalY = touch.clientY - gesture.startY;
    const stepY = touch.clientY - gesture.lastY;
    gesture.lastY = touch.clientY;
    if (!gesture.axis && Math.max(Math.abs(totalX), Math.abs(totalY)) >= 5) gesture.axis = Math.abs(totalY) >= Math.abs(totalX) ? 'vertical' : 'horizontal';
    if (gesture.axis !== 'vertical') return;

    const { surface, target } = gesture;
    const atTop = surface.scrollTop <= .5;
    const atBottom = surface.scrollTop + surface.clientHeight >= surface.scrollHeight - .5;
    const pullingTop = atTop && stepY > 0;
    const pullingBottom = atBottom && stepY < 0;
    if (!pullingTop && !pullingBottom) {
      gesture.edgeDistance = 0;
      gesture.offset = 0;
      gesture.active = false;
      target.style.translate = '0px 0px';
      return;
    }

    if (event.cancelable) event.preventDefault();
    if ((pullingTop && gesture.edgeDistance < 0) || (pullingBottom && gesture.edgeDistance > 0)) gesture.edgeDistance = 0;
    gesture.edgeDistance += stepY;
    const direction = gesture.edgeDistance < 0 ? -1 : 1;
    gesture.offset = direction * Math.min(22, Math.sqrt(Math.abs(gesture.edgeDistance)) * 2.05);
    gesture.active = true;
    if (!gesture.frame) gesture.frame = requestAnimationFrame(() => {
      gesture.frame = 0;
      if (target.isConnected) target.style.translate = `0px ${gesture.offset.toFixed(2)}px`;
    });
  }, { passive: false });

  const releaseMobileEdge = () => {
    const gesture = mobileEdgeGesture;
    mobileEdgeGesture = null;
    if (!gesture) return;
    cancelAnimationFrame(gesture.frame);
    const { target } = gesture;
    if (!target.isConnected || !gesture.active) { clearMobileEdgeTarget(target); return; }
    target.style.translate = `0px ${gesture.offset.toFixed(2)}px`;
    target.classList.remove('mobile-edge-dragging');
    target.classList.add('mobile-edge-returning');
    requestAnimationFrame(() => { if (target.isConnected) target.style.translate = '0px 0px'; });
    const timer = window.setTimeout(() => clearMobileEdgeTarget(target), 430);
    mobileEdgeTimers.set(target, timer);
  };
  document.addEventListener('touchend', releaseMobileEdge, { passive: true });
  document.addEventListener('touchcancel', releaseMobileEdge, { passive: true });

  const listResizer = byId('listResizer');
  const applyListWidth = value => {
    uiSettings.listPaneWidth = Math.max(280, Math.min(620, Number(value) || 344));
    document.documentElement.style.setProperty('--list-pane-width', `${uiSettings.listPaneWidth}px`);
  };
  applyListWidth(uiSettings.listPaneWidth);
  listResizer.addEventListener('pointerdown', event => {
    if (matchMedia('(max-width: 800px)').matches) return;
    event.preventDefault();
    listResizer.setPointerCapture(event.pointerId);
    listResizer.classList.add('dragging');
    const startX = event.clientX;
    const startWidth = uiSettings.listPaneWidth;
    const move = moveEvent => applyListWidth(startWidth + moveEvent.clientX - startX);
    const end = () => {
      listResizer.classList.remove('dragging');
      listResizer.removeEventListener('pointermove', move);
      listResizer.removeEventListener('pointerup', end);
      listResizer.removeEventListener('pointercancel', end);
      saveUISettings();
    };
    listResizer.addEventListener('pointermove', move);
    listResizer.addEventListener('pointerup', end);
    listResizer.addEventListener('pointercancel', end);
  });

  function currentLanguage() {
    return uiSettings.language;
  }

  function syncLanguageChoice() {
    const option = document.querySelector(`input[name="actaLanguage"][value="${currentLanguage()}"]`);
    if (option) option.checked = true;
  }

  const rendererTranslateStaticUI = translateStaticUI;
  translateStaticUI = function translateActaInterface() {
    rendererTranslateStaticUI();
    document.documentElement.lang = settings.language === 'en' ? 'en' : settings.language === 'zh-Hant' ? 'zh-Hant' : 'zh-CN';
    applySettingsTranslation();
    updateSidebarToggleLabel();
    updateDataRefreshLabel();
  };

  const rendererFormatDate = formatDate;
  formatDate = function formatLocalizedDate(value, short = false) {
    if (settings.language !== 'zh-Hant') return rendererFormatDate(value, short);
    if (!value) return t('noDate');
    const date = new Date(value.length === 10 ? `${value}T12:00:00` : value);
    const today = new Date(`${todayISO()}T12:00:00`);
    const difference = Math.round((date - today) / 86400000);
    if (difference === 0) return t('today');
    if (difference === -1) return t('yesterday');
    return new Intl.DateTimeFormat('zh-Hant', short ? { month:'short', day:'numeric' } : { year:'numeric', month:'short', day:'numeric' }).format(date);
  };

  function applyInterfaceLanguage(locale, notify = false) {
    uiSettings.language = locale;
    settings.language = locale;
    saveUISettings();
    saveRendererSettings();
    renderAll();
    syncLanguageChoice();
    setTimeout(() => {
      updateWorkspaceUI();
      renderDataProfiles();
      updateOneDriveUI();
      updateQuickCaptureCopy();
      const classificationCopy = classificationText();
      byId('manageFolders').title = classificationCopy.manage;
      byId('manageFolders').setAttribute('aria-label', classificationCopy.manage);
      byId('addFolder').title = classificationCopy.add;
      byId('addFolder').setAttribute('aria-label', classificationCopy.add);
      updateFolderActionCopy();
      if (classificationManagerDialog.open) renderClassificationManager();
      setStatus(byId('generalStatus'), uiText('settingsStored'));
    }, 0);
    if (notify) showToast(t('languageChanged'));
  }

  document.querySelectorAll('input[name="actaLanguage"]').forEach(option => option.addEventListener('change', () => {
    if (!option.checked || option.value === currentLanguage()) return;
    applyInterfaceLanguage(option.value, true);
  }));
  applyInterfaceLanguage(uiSettings.language);

  const defaultViewSetting = byId('defaultViewSetting');
  const compactModeSetting = byId('compactModeSetting');
  const reduceMotionSetting = byId('reduceMotionSetting');
  defaultViewSetting.value = uiSettings.defaultView;
  compactModeSetting.checked = Boolean(uiSettings.compact);
  reduceMotionSetting.checked = Boolean(uiSettings.reduceMotion);

  function applyGeneralSettings() {
    document.body.classList.toggle('acta-compact', Boolean(uiSettings.compact));
    document.body.classList.toggle('acta-reduce-motion', Boolean(uiSettings.reduceMotion));
  }

  defaultViewSetting.addEventListener('change', () => {
    uiSettings.defaultView = defaultViewSetting.value;
    saveUISettings();
    setStatus(byId('generalStatus'), uiText('defaultSaved'), 'success');
  });
  compactModeSetting.addEventListener('change', () => {
    uiSettings.compact = compactModeSetting.checked; applyGeneralSettings(); saveUISettings();
    setStatus(byId('generalStatus'), uiText('compactUpdated'), 'success');
  });
  reduceMotionSetting.addEventListener('change', () => {
    uiSettings.reduceMotion = reduceMotionSetting.checked; applyGeneralSettings(); saveUISettings();
    setStatus(byId('generalStatus'), uiText('motionUpdated'), 'success');
  });
  byId('clearCacheReload').addEventListener('click', async () => {
    if (autoSyncBusy) {
      setStatus(byId('generalStatus'), uiText('cacheSyncBusy'), 'error');
      return;
    }
    if (!window.confirm(uiText('clearCacheConfirm'))) return;
    const button = byId('clearCacheReload');
    button.disabled = true;
    setStatus(byId('generalStatus'), uiText('clearingCache'));
    clearInterval(autoSyncTimer);
    autoSyncTimer = null;
    clearTimeout(autoSyncSaveTimer);
    autoSyncSaveTimer = null;
    clearTimeout(saveTimer);
    try {
      saveRendererSettings();
      await flushCurrentDataProfile();
      await workspaceWriteQueue.catch(() => {});
      const nativeCacheClear = window.actaDesktop?.clearAppCache || window.Capacitor?.Plugins?.ActaSync?.clearAppCache;
      const preservedLocalStorage = nativeCacheClear
        ? Array.from({ length:localStorage.length }, (_, index) => localStorage.key(index))
          .filter(Boolean)
          .map(key => [key, localStorage.getItem(key)])
        : [];
      if (window.actaDesktop?.clearAppCache) await window.actaDesktop.clearAppCache();
      if (window.Capacitor?.Plugins?.ActaSync?.clearAppCache) await window.Capacitor.Plugins.ActaSync.clearAppCache();
      if (preservedLocalStorage.length) {
        localStorage.clear();
        preservedLocalStorage.forEach(([key, value]) => localStorage.setItem(key, value));
      }
      if ('caches' in window) {
        const cacheKeys = await caches.keys();
        await Promise.all(cacheKeys.map(key => caches.delete(key)));
      }
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map(registration => registration.unregister()));
      }
      window.location.reload();
    } catch (error) {
      button.disabled = false;
      configureAutomaticSync();
      setStatus(byId('generalStatus'), uiText('clearCacheFailed', error.message), 'error');
    }
  });
  applyGeneralSettings();

  const noteHeadingH1Size = byId('noteHeadingH1Size');
  const noteHeadingH2Size = byId('noteHeadingH2Size');
  const noteHeadingH3Size = byId('noteHeadingH3Size');
  const noteHeadingStyle = byId('noteHeadingStyle');
  const noteToolbarPosition = byId('noteToolbarPosition');
  const noteToolbarShowLabels = byId('noteToolbarShowLabels');
  const noteHeadingSizes = {
    noteHeadingH1Size: new Set([26, 28, 30, 32, 36, 40]),
    noteHeadingH2Size: new Set([20, 22, 24, 26, 28, 32]),
    noteHeadingH3Size: new Set([16, 17, 18, 19, 20, 22, 24])
  };

  function applyNoteEditorSettings() {
    const root = document.documentElement;
    Object.entries(noteHeadingSizes).forEach(([key, allowed]) => {
      const fallback = defaultUISettings[key];
      const value = Number(uiSettings[key]);
      uiSettings[key] = allowed.has(value) ? value : fallback;
    });
    if (!['classic', 'modern', 'accent'].includes(uiSettings.noteHeadingStyle)) uiSettings.noteHeadingStyle = defaultUISettings.noteHeadingStyle;
    if (!['top', 'bottom'].includes(uiSettings.noteToolbarPosition)) uiSettings.noteToolbarPosition = defaultUISettings.noteToolbarPosition;
    uiSettings.noteToolbarShowLabels = Boolean(uiSettings.noteToolbarShowLabels);
    root.style.setProperty('--note-heading-h1-size', `${uiSettings.noteHeadingH1Size}px`);
    root.style.setProperty('--note-heading-h2-size', `${uiSettings.noteHeadingH2Size}px`);
    root.style.setProperty('--note-heading-h3-size', `${uiSettings.noteHeadingH3Size}px`);
    root.dataset.noteHeadingStyle = uiSettings.noteHeadingStyle;
    root.dataset.noteToolbarPosition = uiSettings.noteToolbarPosition;
    root.dataset.noteToolbarLabels = uiSettings.noteToolbarShowLabels ? 'show' : 'hide';
    noteHeadingH1Size.value = String(uiSettings.noteHeadingH1Size);
    noteHeadingH2Size.value = String(uiSettings.noteHeadingH2Size);
    noteHeadingH3Size.value = String(uiSettings.noteHeadingH3Size);
    noteHeadingStyle.value = uiSettings.noteHeadingStyle;
    noteToolbarPosition.value = uiSettings.noteToolbarPosition;
    noteToolbarShowLabels.checked = uiSettings.noteToolbarShowLabels;
  }

  [
    [noteHeadingH1Size, 'noteHeadingH1Size'],
    [noteHeadingH2Size, 'noteHeadingH2Size'],
    [noteHeadingH3Size, 'noteHeadingH3Size']
  ].forEach(([field, key]) => field.addEventListener('change', () => {
    uiSettings[key] = Number(field.value);
    applyNoteEditorSettings();
    saveUISettings();
  }));
  noteHeadingStyle.addEventListener('change', () => {
    uiSettings.noteHeadingStyle = noteHeadingStyle.value;
    applyNoteEditorSettings();
    saveUISettings();
  });
  noteToolbarPosition.addEventListener('change', () => {
    uiSettings.noteToolbarPosition = noteToolbarPosition.value;
    applyNoteEditorSettings();
    saveUISettings();
    renderEditor();
  });
  noteToolbarShowLabels.addEventListener('change', () => {
    uiSettings.noteToolbarShowLabels = noteToolbarShowLabels.checked;
    applyNoteEditorSettings();
    saveUISettings();
  });
  applyNoteEditorSettings();

  const customPaper = byId('customPaperColor');
  const customSidebar = byId('customSidebarColor');
  const customAccent = byId('customAccentColor');
  const customTodo = byId('customTodoColor');
  const customTodoSoft = byId('customTodoSoftColor');
  const customNote = byId('customNoteColor');
  const customNoteSoft = byId('customNoteSoftColor');
  const customCalendar = byId('customCalendarColor');
  const customCalendarSoft = byId('customCalendarSoftColor');
  const darkThemes = new Set(['mono-dark', 'neon-ocean', 'aurora-night']);
  const glowThemes = new Set(['neon-ocean', 'aurora-night']);
  const safeThemeColor = (value, fallback) => /^#[\da-f]{6}$/i.test(String(value || '')) ? String(value) : fallback;
  const customThemeFields = [
    [customPaper, 'customPaper', defaultUISettings.customPaper],
    [customSidebar, 'customSidebar', defaultUISettings.customSidebar],
    [customAccent, 'customAccent', defaultUISettings.customAccent],
    [customTodo, 'customTodo', defaultUISettings.customTodo],
    [customTodoSoft, 'customTodoSoft', defaultUISettings.customTodoSoft],
    [customNote, 'customNote', defaultUISettings.customNote],
    [customNoteSoft, 'customNoteSoft', defaultUISettings.customNoteSoft],
    [customCalendar, 'customCalendar', defaultUISettings.customCalendar],
    [customCalendarSoft, 'customCalendarSoft', defaultUISettings.customCalendarSoft]
  ];
  customThemeFields.forEach(([input, key, fallback]) => {
    uiSettings[key] = safeThemeColor(uiSettings[key], fallback);
    input.value = uiSettings[key];
  });

  const isDarkSystemBarColor = color => {
    const match = String(color || '').trim().match(/^#([\da-f]{6})$/i);
    if (!match) return darkThemes.has(uiSettings.theme);
    const channels = [0, 2, 4].map(offset => parseInt(match[1].slice(offset, offset + 2), 16) / 255).map(channel => channel <= .04045 ? channel / 12.92 : ((channel + .055) / 1.055) ** 2.4);
    return channels[0] * .2126 + channels[1] * .7152 + channels[2] * .0722 < .42;
  };

  const currentSystemBarColor = () => getComputedStyle(document.documentElement).getPropertyValue('--sidebar').trim() || '#e7e7e3';

  function syncNativeSystemBar(color = currentSystemBarColor()) {
    const lightIcons = isDarkSystemBarColor(color);
    const nativeSystemBars = window.Capacitor?.Plugins?.ActaSync;
    if (nativeSystemBars?.setSystemBars) nativeSystemBars.setSystemBars({ color }).catch(() => {});
    const nativeStatusBar = window.Capacitor?.Plugins?.StatusBar;
    if (!nativeStatusBar) return;
    nativeStatusBar.setOverlaysWebView({ overlay:false }).catch(() => {});
    nativeStatusBar.setBackgroundColor({ color }).catch(() => {});
    nativeStatusBar.setStyle({ style:lightIcons ? 'DARK' : 'LIGHT' }).catch(() => {});
  }

  function applyTheme() {
    const root = document.documentElement;
    const isDark = darkThemes.has(uiSettings.theme);
    root.dataset.actaTheme = isDark ? 'mono-dark' : uiSettings.theme;
    root.dataset.actaPalette = uiSettings.theme;
    if (glowThemes.has(uiSettings.theme)) root.dataset.actaGlow = 'true';
    else delete root.dataset.actaGlow;
    const isCustom = uiSettings.theme === 'custom';
    ['--paper', '--panel', '--sidebar', '--sage', '--sage-2', '--todo-accent', '--todo-soft', '--todo-wash', '--note-accent', '--note-soft', '--note-wash', '--calendar-theme-accent', '--calendar-theme-soft'].forEach(property => root.style.removeProperty(property));
    if (isCustom) {
      root.style.setProperty('--paper', uiSettings.customPaper);
      root.style.setProperty('--panel', uiSettings.customPaper);
      root.style.setProperty('--sidebar', uiSettings.customSidebar);
      root.style.setProperty('--sage', uiSettings.customAccent);
      root.style.setProperty('--sage-2', `${uiSettings.customAccent}22`);
      root.style.setProperty('--todo-accent', uiSettings.customTodo);
      root.style.setProperty('--todo-soft', uiSettings.customTodoSoft);
      root.style.setProperty('--todo-wash', `color-mix(in srgb, ${uiSettings.customTodoSoft} 42%, ${uiSettings.customPaper})`);
      root.style.setProperty('--note-accent', uiSettings.customNote);
      root.style.setProperty('--note-soft', uiSettings.customNoteSoft);
      root.style.setProperty('--note-wash', `color-mix(in srgb, ${uiSettings.customNoteSoft} 42%, ${uiSettings.customPaper})`);
      root.style.setProperty('--calendar-theme-accent', uiSettings.customCalendar);
      root.style.setProperty('--calendar-theme-soft', uiSettings.customCalendarSoft);
    }
    byId('customColorSettings').classList.toggle('show', isCustom);
    document.querySelectorAll('input[name="actaTheme"]').forEach(option => option.checked = option.value === uiSettings.theme);
    byId('customSwatchPaper').style.background = uiSettings.customPaper;
    byId('customSwatchSidebar').style.background = uiSettings.customSidebar;
    byId('customSwatchAccent').style.background = uiSettings.customAccent;
    document.querySelector('meta[name="color-scheme"]').content = isDark ? 'dark' : 'light';
    const statusColor = currentSystemBarColor();
    document.querySelector('meta[name="theme-color"]').content = statusColor;
    syncNativeSystemBar(statusColor);
  }

  document.querySelectorAll('input[name="actaTheme"]').forEach(option => option.addEventListener('change', () => {
    if (!option.checked) return;
    uiSettings.theme = option.value; applyTheme(); saveUISettings();
  }));
  customThemeFields.forEach(([input, key]) => input.addEventListener('input', () => {
    uiSettings.theme = 'custom';
    uiSettings[key] = input.value;
    applyTheme(); saveUISettings();
  }));
  applyTheme();

  const appIconPresets = Object.freeze({
    default: './icons/icon-512.png',
    positive: './icons/app-icon-positive-page.png',
    outline: './icons/app-icon-outlined-page.png',
    original: './icons/app-icon-original-simple.png'
  });
  const appIconChoices = new Set([...Object.keys(appIconPresets), 'custom']);
  if (!appIconChoices.has(uiSettings.appIconPreset)) uiSettings.appIconPreset = 'default';
  const appearanceText = source => interfaceTranslations[uiSettings.language]?.[source] || source;
  const activeAppIconSource = () => uiSettings.appIconPreset === 'custom' && uiSettings.customAppIcon ? uiSettings.customAppIcon : appIconPresets[uiSettings.appIconPreset] || appIconPresets.default;
  const loadIconImage = source => new Promise((resolve, reject) => {
    const image = new Image();
    image.decoding = 'async';
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('ICON_READ_FAILED'));
    image.src = source;
  });
  const renderSquareAppIcon = async (source, validateMinimum = false) => {
    const image = await loadIconImage(source);
    if (validateMinimum && (image.naturalWidth < 64 || image.naturalHeight < 64)) throw new Error('ICON_TOO_SMALL');
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const context = canvas.getContext('2d');
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = 'high';
    const scale = Math.min(464 / image.naturalWidth, 464 / image.naturalHeight);
    const width = image.naturalWidth * scale;
    const height = image.naturalHeight * scale;
    context.clearRect(0, 0, 512, 512);
    context.drawImage(image, (512 - width) / 2, (512 - height) / 2, width, height);
    return canvas.toDataURL('image/png');
  };

  async function applyAppIcon() {
    const desktopIcon = window.actaDesktop?.setAppIcon;
    const mobileIcon = window.Capacitor?.Plugins?.ActaSync?.setAppIcon;
    const webOnly = !desktopIcon && !mobileIcon;
    document.querySelectorAll('[data-desktop-app-icon-only]').forEach(control => { control.hidden = webOnly; });
    document.querySelector('.app-icon-options')?.classList.toggle('native-presets-only', false);
    if (mobileIcon && !desktopIcon && uiSettings.appIconPreset === 'custom') {
      uiSettings.appIconPreset = 'default';
      uiSettings.customAppIcon = '';
      saveUISettings();
    }
    const source = activeAppIconSource();
    document.querySelectorAll('[data-app-icon-preview]').forEach(preview => {
      const preset = preview.dataset.appIconPreview;
      preview.src = preset === 'custom' ? uiSettings.customAppIcon || appIconPresets.default : appIconPresets[preset] || appIconPresets.default;
    });
    document.querySelectorAll('input[name="actaAppIcon"]').forEach(option => option.checked = option.value === uiSettings.appIconPreset);
    currentAppIconURL = desktopIcon || mobileIcon ? source : appIconPresets.default;
    let applied = true;
    let mobileRequest = null;
    if (mobileIcon && uiSettings.appIconPreset !== 'custom') {
      try {
        mobileRequest = mobileIcon({ preset:uiSettings.appIconPreset });
      } catch (error) {
        applied = false;
        console.error('Failed to apply the Capacitor app icon.', error);
        setStatus(appIconStatus, appearanceText('应用图标应用失败。'), 'error');
      }
    }
    if (desktopIcon) {
      try {
        const icon = uiSettings.appIconPreset === 'default' ? '' : await renderSquareAppIcon(source);
        await desktopIcon(icon);
      } catch (error) {
        applied = false;
        console.error('Failed to apply the Tauri app icon.', error);
        setStatus(appIconStatus, appearanceText('应用图标应用失败。'), 'error');
      }
    }
    if (mobileRequest) {
      try {
        await mobileRequest;
      } catch (error) {
        applied = false;
        console.error('Failed to apply the Capacitor app icon.', error);
        setStatus(appIconStatus, appearanceText('应用图标应用失败。'), 'error');
      }
    }
    if (mobileIcon && !desktopIcon && applied) setStatus(appIconStatus, appearanceText('四个预设可用于 Android；上传的自定义图标仅支持 PC 本地客户端（Windows/macOS）。'));
    if (webOnly) setStatus(appIconStatus, appearanceText('网页端不应用应用图标设置。'));
    return applied;
  }

  const customAppIconFile = byId('customAppIconFile');
  const appIconStatus = byId('appIconStatus');
  document.querySelectorAll('input[name="actaAppIcon"]').forEach(option => option.addEventListener('change', async () => {
    if (!option.checked) return;
    if (option.value === 'custom' && !window.actaDesktop?.setAppIcon) {
      document.querySelectorAll('input[name="actaAppIcon"]').forEach(entry => entry.checked = entry.value === uiSettings.appIconPreset);
      setStatus(appIconStatus, appearanceText('自定义图标仅支持 PC 本地客户端（Windows/macOS），移动端可使用上方四个预设。'), 'info');
      return;
    }
    if (option.value === 'custom' && !uiSettings.customAppIcon) {
      document.querySelectorAll('input[name="actaAppIcon"]').forEach(entry => entry.checked = entry.value === uiSettings.appIconPreset);
      customAppIconFile.click();
      return;
    }
    uiSettings.appIconPreset = option.value;
    saveUISettings();
    await applyAppIcon();
    if (!window.actaDesktop?.setAppIcon && !window.Capacitor?.Plugins?.ActaSync?.setAppIcon) {
      setStatus(appIconStatus, appearanceText('网页端不应用应用图标设置。'));
    }
  }));
  byId('chooseCustomAppIcon').addEventListener('click', () => customAppIconFile.click());
  byId('resetAppIcon').addEventListener('click', async () => {
    uiSettings.appIconPreset = 'default';
    uiSettings.customAppIcon = '';
    saveUISettings();
    const applied = await applyAppIcon();
    setStatus(appIconStatus, appearanceText(applied ? '默认图标已恢复。' : '应用图标应用失败。'), applied ? 'success' : 'error');
  });
  customAppIconFile.addEventListener('change', async () => {
    const file = customAppIconFile.files?.[0];
    customAppIconFile.value = '';
    if (!file) return;
    const allowedTypes = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']);
    if (!allowedTypes.has(file.type) && !/\.(png|jpe?g|webp|svg)$/i.test(file.name)) {
      setStatus(appIconStatus, appearanceText('请选择 PNG、WebP、JPG 或 SVG 图标。'), 'error');
      return;
    }
    if (file.size > 1.5 * 1024 * 1024) {
      setStatus(appIconStatus, appearanceText('图标文件不能超过 1.5 MB。'), 'error');
      return;
    }
    try {
      const source = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error('ICON_READ_FAILED'));
        reader.readAsDataURL(file);
      });
      uiSettings.customAppIcon = await renderSquareAppIcon(source, true);
      uiSettings.appIconPreset = 'custom';
      saveUISettings();
      const applied = await applyAppIcon();
      const message = !window.actaDesktop?.setAppIcon
        ? '网页端不应用应用图标设置。'
        : applied ? '自定义图标已应用。' : '应用图标应用失败。';
      setStatus(appIconStatus, appearanceText(message), window.actaDesktop?.setAppIcon ? applied ? 'success' : 'error' : '');
    } catch (error) {
      const message = error.message === 'ICON_TOO_SMALL' ? '图标至少需要 64 × 64 像素。' : '无法读取图标文件。';
      setStatus(appIconStatus, appearanceText(message), 'error');
    }
  });
  void applyAppIcon();

  const appFontSetting = byId('appFontSetting');
  const customFontFamily = byId('customFontFamily');
  const customFontRow = byId('customFontRow');
  const appFontSizeSetting = byId('appFontSizeSetting');
  const appFontSizeValue = byId('appFontSizeValue');
  const fontSizeRange = Object.freeze({ min:12, max:18, default:14 });
  appFontSetting.value = uiSettings.appFont;
  customFontFamily.value = uiSettings.customFont || 'Inter';
  appFontSizeSetting.min = String(fontSizeRange.min);
  appFontSizeSetting.max = String(fontSizeRange.max);
  appFontSizeSetting.value = String(uiSettings.appFontSize);

  function applyFontSettings() {
    const safeCustomFont = (uiSettings.customFont || 'Inter').replace(/[;{}<>]/g, '').trim() || 'Inter';
    const requestedFontSize = Number(uiSettings.appFontSize);
    uiSettings.customFont = safeCustomFont;
    uiSettings.appFontSize = Number.isFinite(requestedFontSize) && requestedFontSize > 0
      ? Math.min(fontSizeRange.max, Math.max(fontSizeRange.min, Math.round(requestedFontSize)))
      : fontSizeRange.default;
    document.documentElement.dataset.actaFont = uiSettings.appFont;
    document.documentElement.style.setProperty('--acta-custom-font', safeCustomFont);
    const editorFont = {
      system:'"Segoe UI Variable", "PingFang SC", "Microsoft YaHei", system-ui, sans-serif',
      serif:'Georgia, "Noto Serif CJK SC", "Songti SC", serif',
      rounded:'"Arial Rounded MT Bold", "PingFang SC", "Microsoft YaHei", sans-serif',
      mono:'"SFMono-Regular", Consolas, "Liberation Mono", monospace',
      custom:`${safeCustomFont}, "Segoe UI", "Microsoft YaHei", sans-serif`
    }[uiSettings.appFont] || '"Segoe UI Variable", "PingFang SC", "Microsoft YaHei", system-ui, sans-serif';
    document.documentElement.style.setProperty('--acta-app-font', editorFont);
    document.documentElement.style.setProperty('--acta-font-scale', String(uiSettings.appFontSize / fontSizeRange.default));
    appFontSizeSetting.value = String(uiSettings.appFontSize);
    appFontSizeValue.textContent = `${uiSettings.appFontSize} px`;
    appFontSizeSetting.setAttribute('aria-valuetext', `${uiSettings.appFontSize} px`);
    customFontRow.classList.toggle('show', uiSettings.appFont === 'custom');
  }

  appFontSetting.addEventListener('change', () => {
    uiSettings.appFont = appFontSetting.value; applyFontSettings(); saveUISettings();
    if (uiSettings.appFont === 'custom') customFontFamily.focus();
  });
  customFontFamily.addEventListener('input', () => {
    uiSettings.customFont = customFontFamily.value; applyFontSettings(); saveUISettings();
  });
  appFontSizeSetting.addEventListener('input', () => {
    uiSettings.appFontSize = Number(appFontSizeSetting.value); applyFontSettings(); saveUISettings();
  });
  applyFontSettings();

  const webDavCredentialStorageKey = 'webdav.credentials.v1';
  const autoSyncSetting = byId('autoSyncSetting');
  const autoSyncInterval = byId('autoSyncInterval');
  const cloudSyncMode = byId('cloudSyncMode');
  const webDavServer = byId('webDavServer');
  const webDavUsername = byId('webDavUsername');
  const webDavPassword = byId('webDavPassword');
  const localFolderSyncMessages = {
    zh: {
      description:'在本地文件夹与 WebDAV 服务器之间选择一种同步方式。', mode:'本地文件夹', title:'本地文件夹', folderSync:'文件夹同步', note:'全平台可用；支持设备本地、局域网及系统已挂载的网络位置', choose:'选择本地文件夹', empty:'尚未选择本地文件夹', hint:'本地文件夹模式通过系统文件选择器访问路径，可配合局域网或其他同步工具使用；WebDAV 密码仅保存在当前设备。', restored:'已恢复本地文件夹连接。', restoreFailed:'无法恢复本地文件夹：{0}'
    },
    en: {
      description:'Choose between a local folder and a WebDAV server.', mode:'Local folder', title:'Local folder', folderSync:'Folder sync', note:'Available on every platform; supports device folders, LAN locations, and mounted network storage', choose:'Choose local folder', empty:'No local folder selected', hint:'Local folder mode uses the system folder picker and can work with LAN storage or other sync tools. The WebDAV password stays on this device.', restored:'Restored the local folder connection.', restoreFailed:'Could not restore the local folder: {0}'
    },
    'zh-Hant': {
      description:'在本機資料夾與 WebDAV 伺服器之間選擇一種同步方式。', mode:'本機資料夾', title:'本機資料夾', folderSync:'資料夾同步', note:'全平台可用；支援裝置本機、區域網路及系統已掛載的網路位置', choose:'選擇本機資料夾', empty:'尚未選擇本機資料夾', hint:'本機資料夾模式透過系統資料夾選擇器存取路徑，可搭配區域網路或其他同步工具使用；WebDAV 密碼僅儲存在目前裝置。', restored:'已還原本機資料夾連接。', restoreFailed:'無法還原本機資料夾：{0}'
    }
  };
  const localFolderSyncText = (key, ...values) => values.reduce((message, value, index) => message.replace(`{${index}}`, value), (localFolderSyncMessages[uiSettings.language] || localFolderSyncMessages.zh)[key]);
  cloudSyncMode.value = ['onedrive', 'webdav'].includes(uiSettings.cloudSyncMode) ? uiSettings.cloudSyncMode : 'onedrive';
  uiSettings.cloudSyncMode = cloudSyncMode.value;
  webDavServer.value = uiSettings.webDavServer || '';
  webDavUsername.value = uiSettings.webDavUsername || '';
  autoSyncSetting.checked = Boolean(uiSettings.autoSync);
  autoSyncInterval.value = String(uiSettings.autoSyncInterval || 5);

  function activateSelectedCloudAdapter(resetBaseline = false) {
    oneDriveAdapter = cloudSyncMode.value === 'webdav' ? webDavAdapter : oneDriveFolderAdapter;
    if (resetBaseline) {
      oneDriveRemoteVersion = '';
      oneDriveBaselineReady = false;
      autoSyncBaseline = librarySignature();
      autoSyncDirty = false;
    }
    return oneDriveAdapter;
  }

  function updateOneDriveUI(message = '') {
    const mode = cloudSyncMode.value;
    const connected = Boolean(activateSelectedCloudAdapter());
    const copy = localFolderSyncMessages[uiSettings.language] || localFolderSyncMessages.zh;
    const cloudPanel = document.querySelector('[data-settings-panel="cloud"]');
    cloudPanel.querySelector(':scope > header p').textContent = copy.description;
    cloudSyncMode.querySelector('option[value="onedrive"]').textContent = copy.mode;
    const localFolderRows = byId('oneDriveModeFields').querySelectorAll('.settings-row');
    localFolderRows[0].querySelector('b').textContent = copy.title;
    localFolderRows[1].querySelector('b').textContent = copy.folderSync;
    localFolderRows[1].querySelector('.cloud-mode-note').textContent = copy.note;
    byId('chooseOneDriveFolder').querySelector('span').textContent = copy.choose;
    byId('cloudSyncHint').textContent = copy.hint;
    byId('oneDriveModeFields').hidden = mode !== 'onedrive';
    byId('webDavModeFields').hidden = mode !== 'webdav';
    byId('oneDriveFolderPath').textContent = oneDriveFolderAdapter
      ? `${oneDriveFolderAdapter.label} / ${workspaceFileName}`
      : copy.empty;
    byId('webDavConnectionPath').textContent = webDavAdapter
      ? webDavAdapter.label
      : (uiSettings.language === 'en' ? 'WebDAV is not connected' : uiSettings.language === 'zh-Hant' ? '尚未連接 WebDAV' : '尚未连接 WebDAV');
    byId('downloadOneDrive').disabled = !connected;
    byId('uploadOneDrive').disabled = !connected;
    byId('disconnectOneDrive').disabled = !connected;
    autoSyncSetting.disabled = !connected;
    autoSyncInterval.disabled = !connected || !uiSettings.autoSync;
    byId('autoSyncIntervalRow').style.opacity = connected && uiSettings.autoSync ? '1' : '.55';
    if (message) setStatus(byId('oneDriveStatus'), message, connected ? 'success' : '');
    else if (!connected) setStatus(byId('oneDriveStatus'), syncText('choose'));
  }

  function configureAutomaticSync(report = false) {
    clearInterval(autoSyncTimer);
    autoSyncTimer = null;
    autoSyncSetting.checked = Boolean(uiSettings.autoSync);
    autoSyncInterval.value = String(uiSettings.autoSyncInterval || 5);
    updateOneDriveUI();
    if (uiSettings.autoSync && oneDriveAdapter) {
      autoSyncTimer = setInterval(() => runAutomaticSync('interval'), Math.max(1, Number(uiSettings.autoSyncInterval) || 5) * 60000);
      if (report) {
        setStatus(byId('oneDriveStatus'), syncText('waiting'), 'success');
        showSyncNotice(syncText('waiting'));
      }
    } else if (report) {
      setStatus(byId('oneDriveStatus'), oneDriveAdapter ? syncText('disabled') : syncText('choose'));
      showSyncNotice(oneDriveAdapter ? syncText('disabled') : syncText('choose'));
    }
  }

  function scheduleAutomaticSync() {
    clearTimeout(autoSyncSaveTimer);
    if (!uiSettings.autoSync || !oneDriveAdapter) return;
    autoSyncSaveTimer = setTimeout(() => runAutomaticSync('change'), 1800);
  }

  async function refreshCloudVersion() {
    oneDriveRemoteVersion = oneDriveAdapter?.version ? await oneDriveAdapter.version() : '';
    oneDriveBaselineReady = true;
    return oneDriveRemoteVersion;
  }

  async function runAutomaticSync(reason = 'interval') {
    if (autoSyncBusy || !uiSettings.autoSync || !oneDriveAdapter) return;
    autoSyncBusy = true;
    showSyncNotice(syncText('working'), 'working', true);
    setStatus(byId('oneDriveStatus'), syncText('working'));
    try {
      const currentSnapshot = JSON.parse(JSON.stringify(library));
      const currentSignature = librarySignature(currentSnapshot);
      if (oneDriveBaselineReady && (autoSyncDirty || reason === 'change')) {
        const remoteVersion = oneDriveAdapter.version ? await oneDriveAdapter.version() : '';
        if (remoteVersion && oneDriveBaselineReady && oneDriveRemoteVersion && remoteVersion !== oneDriveRemoteVersion) {
          uiSettings.autoSync = false;
          saveUISettings();
          configureAutomaticSync();
          const conflictError = new Error(syncText('conflict'));
          conflictError.code = 'ACTA_SYNC_CONFLICT';
          throw conflictError;
        }
        await oneDriveAdapter.save(currentSnapshot);
        await refreshCloudVersion();
        autoSyncBaseline = currentSignature;
        autoSyncDirty = librarySignature() !== currentSignature;
        setStatus(byId('oneDriveStatus'), syncText('uploaded'), 'success');
        showSyncNotice(syncText('uploaded'));
        if (autoSyncDirty) scheduleAutomaticSync();
      } else {
        try {
          const remoteVersion = oneDriveAdapter.version ? await oneDriveAdapter.version() : '';
          if (oneDriveBaselineReady && remoteVersion && remoteVersion === oneDriveRemoteVersion) {
            setStatus(byId('oneDriveStatus'), syncText('current'), 'success');
            showSyncNotice(syncText('current'));
            return;
          }
          const remoteLibrary = await oneDriveAdapter.load();
          const remoteSignature = librarySignature(remoteLibrary);
          if (!oneDriveBaselineReady && autoSyncDirty && remoteSignature !== currentSignature) {
            uiSettings.autoSync = false;
            saveUISettings();
            configureAutomaticSync();
            const conflictError = new Error(syncText('conflict'));
            conflictError.code = 'ACTA_SYNC_CONFLICT';
            throw conflictError;
          }
          if (remoteSignature !== autoSyncBaseline && remoteSignature !== currentSignature) {
            replaceLibrary(remoteLibrary);
            autoSyncBaseline = remoteSignature;
            autoSyncDirty = false;
            if (workspaceAdapter) await queueWorkspaceSave(remoteLibrary);
            setStatus(byId('oneDriveStatus'), syncText('downloaded'), 'success');
            showSyncNotice(syncText('downloaded'));
          } else {
            autoSyncBaseline = remoteSignature;
            setStatus(byId('oneDriveStatus'), syncText('current'), 'success');
            showSyncNotice(syncText('current'));
          }
          await refreshCloudVersion();
        } catch (error) {
          if (!missingLibraryFile(error)) throw error;
          await oneDriveAdapter.save(currentSnapshot);
          await refreshCloudVersion();
          autoSyncBaseline = currentSignature;
          autoSyncDirty = false;
          setStatus(byId('oneDriveStatus'), syncText('uploaded'), 'success');
          showSyncNotice(syncText('uploaded'));
        }
      }
    } catch (error) {
      const message = error.code === 'ACTA_SYNC_CONFLICT' ? error.message : `${syncText(autoSyncDirty ? 'uploadFail' : 'downloadFail')}${error.message}`;
      setStatus(byId('oneDriveStatus'), message, 'error');
      showSyncNotice(message, 'error');
    } finally {
      autoSyncBusy = false;
    }
  }

  cloudSyncMode.addEventListener('change', async () => {
    uiSettings.cloudSyncMode = cloudSyncMode.value;
    uiSettings.autoSync = false;
    activateSelectedCloudAdapter(true);
    saveUISettings();
    configureAutomaticSync();
    updateOneDriveUI();
    if (oneDriveAdapter) {
      try { await refreshCloudVersion(); }
      catch (error) { setStatus(byId('oneDriveStatus'), error.message, 'error'); }
    }
  });
  autoSyncSetting.addEventListener('change', async () => {
    uiSettings.autoSync = autoSyncSetting.checked;
    saveUISettings();
    if (uiSettings.autoSync) {
      activateSelectedCloudAdapter(true);
      configureAutomaticSync(true);
      setTimeout(() => runAutomaticSync('interval'), 450);
    } else configureAutomaticSync(true);
  });
  autoSyncInterval.addEventListener('change', () => {
    uiSettings.autoSyncInterval = Number(autoSyncInterval.value);
    saveUISettings();
    configureAutomaticSync(true);
  });

  byId('chooseOneDriveFolder').addEventListener('click', async () => {
    try {
      const adapter = await chooseFolderAdapter('onedrive');
      if (!adapter) return;
      oneDriveFolderAdapter = adapter;
      if (adapter.kind === 'native') {
        uiSettings.oneDriveFolder = adapter.folder;
        uiSettings.oneDriveLabel = adapter.label;
      } else {
        uiSettings.oneDriveFolder = '';
        uiSettings.oneDriveLabel = adapter.label;
      }
      if (cloudSyncMode.value === 'onedrive') oneDriveAdapter = adapter;
      saveUISettings();
      await refreshCloudVersion();
      autoSyncBaseline = librarySignature();
      autoSyncDirty = false;
      updateOneDriveUI(syncText('connected'));
      configureAutomaticSync();
    } catch (error) {
      setStatus(byId('oneDriveStatus'), error.message, 'error');
      showSyncNotice(error.message, 'error');
    }
  });

  byId('connectWebDav').addEventListener('click', async () => {
    const server = webDavServer.value.trim();
    const username = webDavUsername.value.trim();
    const password = webDavPassword.value;
    if (!server || !username || !password) {
      setStatus(byId('oneDriveStatus'), syncText('webDavMissing'), 'error');
      return;
    }
    const previousAdapter = webDavAdapter;
    const previousCredentials = webDavCredentials;
    let connectionError = '';
    byId('connectWebDav').disabled = true;
    setStatus(byId('oneDriveStatus'), syncText('working'));
    showSyncNotice(syncText('working'), 'working', true);
    try {
      const adapter = createWebDavAdapter({ server, username, password });
      await adapter.probe();
      webDavCredentials = { server:adapter.config.server, username, password };
      webDavAdapter = adapter;
      uiSettings.webDavServer = adapter.config.server;
      uiSettings.webDavUsername = username;
      webDavServer.value = adapter.config.server;
      await storeDirectoryHandle(webDavCredentialStorageKey, webDavCredentials);
      if (cloudSyncMode.value === 'webdav') oneDriveAdapter = adapter;
      saveUISettings();
      await refreshCloudVersion();
      autoSyncBaseline = librarySignature();
      autoSyncDirty = false;
      updateOneDriveUI(syncText('webDavConnected'));
      showSyncNotice(syncText('webDavConnected'));
      configureAutomaticSync();
    } catch (error) {
      webDavAdapter = previousAdapter;
      webDavCredentials = previousCredentials;
      if (cloudSyncMode.value === 'webdav') oneDriveAdapter = previousAdapter;
      const message = `${syncText('connectFail')}${error.message}`;
      connectionError = message;
      setStatus(byId('oneDriveStatus'), message, 'error');
      showSyncNotice(message, 'error');
    } finally {
      byId('connectWebDav').disabled = false;
      updateOneDriveUI();
      if (connectionError) setStatus(byId('oneDriveStatus'), connectionError, 'error');
    }
  });

  byId('disconnectOneDrive').addEventListener('click', async () => {
    clearInterval(autoSyncTimer);
    clearTimeout(autoSyncSaveTimer);
    uiSettings.autoSync = false;
    if (cloudSyncMode.value === 'webdav') {
      webDavAdapter = null;
      webDavCredentials = null;
      webDavPassword.value = '';
      await removeDirectoryHandle(webDavCredentialStorageKey).catch(() => {});
    } else {
      oneDriveFolderAdapter = null;
      uiSettings.oneDriveFolder = '';
      uiSettings.oneDriveLabel = '';
      await removeDirectoryHandle('onedrive').catch(() => {});
    }
    oneDriveAdapter = null;
    oneDriveRemoteVersion = '';
    oneDriveBaselineReady = false;
    autoSyncBaseline = '';
    autoSyncDirty = false;
    saveUISettings();
    configureAutomaticSync();
    updateOneDriveUI(syncText('disconnected'));
    showSyncNotice(syncText('disconnected'));
  });

  byId('uploadOneDrive').addEventListener('click', async () => {
    if (!oneDriveAdapter) return;
    showSyncNotice(syncText('working'), 'working', true);
    try {
      const snapshot = JSON.parse(JSON.stringify(library));
      await oneDriveAdapter.save(snapshot);
      await refreshCloudVersion();
      autoSyncBaseline = librarySignature(snapshot);
      autoSyncDirty = false;
      setStatus(byId('oneDriveStatus'), syncText('manualUpload'), 'success');
      showSyncNotice(syncText('manualUpload'));
    } catch (error) {
      const message = `${syncText('uploadFail')}${error.message}`;
      setStatus(byId('oneDriveStatus'), message, 'error');
      showSyncNotice(message, 'error');
    }
  });

  byId('downloadOneDrive').addEventListener('click', async () => {
    if (!oneDriveAdapter || !confirm(syncText('confirm'))) return;
    showSyncNotice(syncText('working'), 'working', true);
    try {
      const remoteLibrary = await oneDriveAdapter.load();
      replaceLibrary(remoteLibrary);
      await refreshCloudVersion();
      autoSyncBaseline = librarySignature(remoteLibrary);
      autoSyncDirty = false;
      if (workspaceAdapter) await queueWorkspaceSave(remoteLibrary);
      setStatus(byId('oneDriveStatus'), syncText('manualDownload'), 'success');
      showSyncNotice(syncText('manualDownload'));
    } catch (error) {
      const message = `${syncText('downloadFail')}${error.message}`;
      setStatus(byId('oneDriveStatus'), message, 'error');
      showSyncNotice(message, 'error');
    }
  });
  updateOneDriveUI();
  configureAutomaticSync();

  function enhanceRelationEditor() {
    const article = byId('editorPane')?.querySelector('[data-editor-id]');
    if (!article || article.dataset.relationUi === 'ready') return;
    const section = article.querySelector('.linked-section');
    const actions = article.querySelector('.editor-actions');
    const picker = section?.querySelector('.link-picker');
    if (!section || !actions || !picker) return;
    article.dataset.relationUi = 'ready';

    const relationCopy = { title: uiText('linkTitle'), close: uiText('close'), hint: uiText('linkHint') };
    const linkedRows = section.querySelectorAll('.linked-row');
    section.classList.add('relation-summary');
    section.hidden = linkedRows.length === 0;

    const trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'relation-trigger';
    trigger.title = relationCopy.title;
    trigger.setAttribute('aria-label', trigger.title);
    trigger.innerHTML = '<svg><use href="#i-link"/></svg>';
    actions.insertBefore(trigger, actions.querySelector('#deleteItem'));

    const dialog = document.createElement('dialog');
    dialog.className = 'relation-dialog';
    dialog.innerHTML = `<header class="relation-dialog-head"><span><svg><use href="#i-link"/></svg></span><h3>${relationCopy.title}</h3><button class="relation-dialog-close" type="button" aria-label="${relationCopy.close}"><svg><use href="#i-close"/></svg></button></header><div class="relation-dialog-body"><p class="relation-dialog-hint">${relationCopy.hint}</p></div>`;
    dialog.querySelector('.relation-dialog-body').appendChild(picker);
    article.appendChild(dialog);

    trigger.addEventListener('click', () => { if (!dialog.open) openAnimatedDialog(dialog); });
    dialog.querySelector('.relation-dialog-close').addEventListener('click', () => closeAnimatedDialog(dialog));
    dialog.addEventListener('click', event => { if (event.target === dialog) closeAnimatedDialog(dialog); });
    dialog.addEventListener('cancel', event => { event.preventDefault(); closeAnimatedDialog(dialog); });
  }

  const editorObserver = new MutationObserver(enhanceRelationEditor);
  editorObserver.observe(byId('editorPane'), { childList: true, subtree: true });
  enhanceRelationEditor();

  let listRevealTimer = null;
  document.addEventListener('click', event => {
    const sidebarNavigation = event.target.closest('.sidebar [data-view]');
    if (sidebarNavigation && event.isTrusted) {
      clearTimeout(listRevealTimer);
      document.body.classList.remove('acta-steady');
      listRevealTimer = setTimeout(() => document.body.classList.add('acta-steady'), 720);
    } else {
      document.body.classList.add('acta-steady');
    }
  }, true);
  document.addEventListener('input', event => {
    if (event.target.closest('#searchInput')) document.body.classList.add('acta-steady');
  }, true);

  function showTodoBurst(target, undo) {
    const rect = target.getBoundingClientRect();
    const burst = document.createElement('span');
    burst.className = `todo-burst${undo ? ' undo' : ''}`;
    burst.style.left = `${rect.left + rect.width / 2}px`;
    burst.style.top = `${rect.top + rect.height / 2}px`;
    burst.innerHTML = `${undo ? '<b>↶</b>' : '<svg><use href="#i-check"/></svg>'}<i></i><i></i><i></i><i></i><i></i><i></i>`;
    document.body.appendChild(burst);
    setTimeout(() => burst.remove(), 780);
  }

  let taskRefreshTimer = null;
  document.addEventListener('click', event => {
    const target = event.target.closest('.task-check, #completeItem, .calendar-todo-check, .calendar-subtask-check');
    if (!target) return;
    const row = target.closest('.task-row');
    const calendarItem = target.dataset.calendarToggle ? library.items.find(item => item.id === target.dataset.calendarToggle) : null;
    const calendarSubtaskItem = target.dataset.calendarSubtaskToggle ? library.items.find(item => item.id === target.dataset.calendarSubtaskToggle) : null;
    const calendarSubtask = calendarSubtaskItem?.tasks?.find(task => task.id === target.dataset.calendarSubtaskId);
    const undo = row ? row.classList.contains('done') : calendarSubtask ? Boolean(calendarSubtask.done) : calendarItem ? isTodoComplete(calendarItem) : isTodoComplete(getItem(selectedId));
    showTodoBurst(target, undo);
    document.body.classList.add('acta-steady');
    document.body.classList.add('suppress-task-refresh');
    clearTimeout(taskRefreshTimer);
    taskRefreshTimer = setTimeout(() => document.body.classList.remove('suppress-task-refresh'), 800);
  }, true);

  async function restoreFolderConnections() {
    await dataProfilesReady.catch(() => {});
    const bridge = getSyncBridge();
    await removeDirectoryHandle('onedrive.graph.auth.v1').catch(() => {});
    try {
      if (bridge && uiSettings.oneDriveFolder) {
        oneDriveFolderAdapter = createNativeFolderAdapter(uiSettings.oneDriveFolder, bridge, uiSettings.oneDriveLabel || uiSettings.oneDriveFolder);
      } else {
        const handle = await readDirectoryHandle('onedrive');
        if (handle && (!handle.queryPermission || await handle.queryPermission({ mode:'readwrite' }) === 'granted')) {
          oneDriveFolderAdapter = createWebFolderAdapter(handle, 'onedrive');
        } else if (handle && cloudSyncMode.value === 'onedrive') {
          setStatus(byId('oneDriveStatus'), syncText('reauthorize'));
        }
      }
    } catch (error) {
      oneDriveFolderAdapter = null;
      if (cloudSyncMode.value === 'onedrive') setStatus(byId('oneDriveStatus'), localFolderSyncText('restoreFailed', error.message), 'error');
    }
    try {
      const storedCredentials = await readDirectoryHandle(webDavCredentialStorageKey);
      if (storedCredentials?.server && storedCredentials?.username && storedCredentials?.password) {
        webDavCredentials = storedCredentials;
        webDavServer.value = storedCredentials.server;
        webDavUsername.value = storedCredentials.username;
        webDavPassword.value = storedCredentials.password;
        webDavAdapter = createWebDavAdapter(storedCredentials);
      }
    } catch (error) {
      webDavAdapter = null;
      if (cloudSyncMode.value === 'webdav') setStatus(byId('oneDriveStatus'), error.message, 'error');
    }
    activateSelectedCloudAdapter(true);
    if (oneDriveAdapter) {
      autoSyncBaseline = librarySignature();
      autoSyncDirty = false;
      updateOneDriveUI(cloudSyncMode.value === 'webdav' ? syncText('webDavStored') : localFolderSyncText('restored'));
      configureAutomaticSync();
      if (uiSettings.autoSync) setTimeout(() => runAutomaticSync('interval'), 450);
      else {
        try { await refreshCloudVersion(); }
        catch (error) { setStatus(byId('oneDriveStatus'), error.message, 'error'); }
      }
    } else updateOneDriveUI();
  }
  restoreFolderConnections();

  const nativeApp = window.Capacitor?.Plugins?.App;
  if (nativeApp?.addListener) {
    nativeApp.addListener('resume', () => syncNativeSystemBar());
    nativeApp.addListener('backButton', async () => {
      if (document.body.classList.contains('note-focus-mode')) {
        byId('exitFocusNoteEditor')?.click();
        return;
      }
      const relationDialog = document.querySelector('.relation-dialog[open]');
      if (relationDialog) {
        closeAnimatedDialog(relationDialog);
        return;
      }
      if (settingsModal.classList.contains('open')) { closeSettings(); return; }
      if (byId('createMenu').classList.contains('open')) { byId('createMenu').classList.remove('open'); return; }
      if (byId('editorPane').classList.contains('mobile-open')) {
        mobileEditorOpen = false;
        byId('editorPane').classList.remove('mobile-open');
        return;
      }
      if (currentView !== 'inbox') {
        document.querySelector('[data-view="inbox"]')?.click();
        return;
      }
      if (nativeApp.minimizeApp) await nativeApp.minimizeApp();
    });
  }

  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
    addEventListener('load', () => navigator.serviceWorker.register('./service-worker.js').catch(() => {}), { once:true });
  }

  requestAnimationFrame(() => {
    const startView = document.querySelector(`[data-view="${uiSettings.defaultView}"]`);
    if (startView) startView.click();
  });
})();
