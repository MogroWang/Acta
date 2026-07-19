(() => {
  const uiStorageKey = 'acta.interface.settings.v1';
  const defaultUISettings = {
    defaultView: 'inbox', compact: false, reduceMotion: false, theme: 'mono-light',
    customPaper: '#fbfaf6', customSidebar: '#ebe7dc', customAccent: '#526b55',
    appFont: 'system', customFont: 'Inter', appFontSize: 14, oneDriveFolder: '', oneDriveLabel: '', workspaceLabel: '',
    dataProfiles: [], activeDataProfileId: '', cloudSyncMode: 'onedrive', webDavServer: '', webDavUsername: '', autoSync: false, autoSyncInterval: 5, listPaneWidth: 344, sidebarCollapsed: false, language: ['zh', 'zh-Hant', 'en'].includes(settings.language) ? settings.language : 'zh'
  };
  let uiSettings = { ...defaultUISettings };
  try { uiSettings = { ...uiSettings, ...(JSON.parse(localStorage.getItem(uiStorageKey)) || {}) }; } catch { /* Use safe defaults. */ }

  const byId = id => document.getElementById(id);
  const settingsModal = byId('settingsModal');
  const saveUISettings = () => localStorage.setItem(uiStorageKey, JSON.stringify(uiSettings));
  const saveRendererSettings = () => localStorage.setItem(SETTINGS_KEY, JSON.stringify({ ...settings, language: uiSettings.language === 'zh-Hant' ? 'zh' : uiSettings.language }));
  Object.assign(dictionaries.zh, { syncTitle:'连接本地文件夹', syncCopy:'选择设备本地、局域网或系统已挂载的网络文件夹。Acta 会在其中读写清单、归类、notes 和 todos 完整数据文件夹。', download:'下载完整数据文件夹', upload:'上传完整数据文件夹' });
  Object.assign(dictionaries.en, { syncTitle:'Connect a local folder', syncCopy:'Choose a device folder, LAN location, or mounted network folder. Acta reads and writes the complete manifest, classifications, notes, and todos data folder there.', download:'Download complete data folder', upload:'Upload complete data folder' });
  dictionaries['zh-Hant'] = {
    ...dictionaries.zh,
    saved:'已儲存', saving:'正在儲存…', new:'新增', newNote:'新增筆記', newNoteHint:'記錄想法與靈感', newTodo:'新增待辦', newTodoHint:'拆解目標與行動',
    inbox:'收集箱', today:'今天', todos:'待辦', notes:'筆記', completed:'已完成', folders:'歸類', classify:'歸類', cloudSync:'網路硬碟同步', notConfigured:'尚未設定', localWorkspace:'本機行記資料', workspace:'行記資料', actaData:'行記資料',
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

  const interfaceTranslations = {
    en: {
      '设置':'Settings', '按你的方式使用 Acta':'Make Acta work your way', '关闭设置':'Close settings', '设置页面':'Settings pages',
      '语言':'Language', '工作区':'Workspace', '行记数据':'Acta Data', '常规设置':'General', '外观设置':'Appearance', '网盘同步':'Cloud sync', '开发者测试':'Developer tests', '关于':'About',
      '切换 Acta 的界面语言，笔记内容不会被翻译或修改。':'Change the interface language. Your note content is never translated or modified.', '简体中文':'Simplified Chinese', '繁體中文':'Traditional Chinese', '英语':'English',
      '整个资料库保存在所选文件夹内唯一的':'The entire library is stored in a single', '文件中。':'file inside the selected folder.', '演示工作区':'Demo workspace', '演示行记数据':'Demo Acta Data', '尚未选择文件夹；本次修改不会保存。':'No folder selected; changes in this session will not be saved.',
      '选择本地文件夹':'Choose local folder', '立即保存':'Save now', '从文件重载':'Reload from file', '返回演示工作区':'Return to demo workspace', '返回演示行记数据':'Return to demo Acta Data', '当前是演示工作区。关闭或刷新页面后，演示内容会恢复，不会写入浏览器本地资料库。':'This is the demo workspace. Its content resets when you close or refresh the page and is not written to browser storage.', '当前是演示行记数据。关闭或刷新页面后，演示内容会恢复，不会写入浏览器本地资料库。':'This is demo Acta Data. Its content resets when you close or refresh the page and is not written to browser storage.',
      '调整启动位置、内容密度和动效偏好。':'Adjust the startup view, content density, and motion.', '默认启动页面':'Default startup view', '打开应用时优先进入的智能视图':'The smart view shown when Acta opens', '收集箱':'Inbox', '今天':'Today', '所有待办':'All tasks', '所有笔记':'All notes', '已完成':'Completed',
      '紧凑列表':'Compact lists', '在中栏显示更多笔记和待办':'Show more notes and tasks in the middle pane', '减少动态效果':'Reduce motion', '降低转场和弹性动画，减少视觉干扰':'Reduce transitions and spring animations', '设置会自动保存在当前设备。':'Settings are saved automatically on this device.',
      '主题只改变显示效果，不会影响任何笔记或待办数据。':'Themes only change the appearance; your notes and tasks are unaffected.', '黑白浅色':'Monochrome light', '黑白深色':'Monochrome dark', '蓝黄':'Blue and yellow', '黄色护眼':'Eye-comfort yellow', '自定义':'Custom',
      '纸张颜色':'Paper color', '侧栏颜色':'Sidebar color', '强调颜色':'Accent color', '界面字体':'Interface font', '同时应用到列表、编辑器和设置页面':'Applied to lists, the editor, and settings', '系统默认':'System default', '衬线字体':'Serif', '圆体':'Rounded', '等宽字体':'Monospace', '自定义字体':'Custom font',
      '字体家族':'Font family', '输入设备上已安装的字体，例如 Inter 或 Microsoft YaHei':'Enter a font installed on this device, such as Inter or Microsoft YaHei', '字体大小':'Font size', '在紧凑与易读之间调整':'Balance compactness and readability', '记录，然后行动。Acta 让笔记与待办自然连接。':'Capture, then act. Acta connects notes and tasks naturally.',
      '先支持 OneDrive 本地同步文件夹；上传与下载均使用完整资料库数据文件。':'OneDrive local sync folders are supported first. Upload and download both use the complete library file.', '尚未选择 OneDrive 同步文件夹':'No OneDrive sync folder selected', 'OneDrive 文件操作':'OneDrive file access', '由 OneDrive 客户端把 acta-library.json 同步到云端':'The OneDrive client syncs acta-library.json to the cloud', '选择文件夹':'Choose folder',
      '自动同步':'Automatic sync', '本地内容变化后自动上传，并定时检查 OneDrive 文件中的更新':'Upload local changes automatically and periodically check the OneDrive file for updates', '检查频率':'Check frequency', '仅在 Acta 保持运行时执行':'Runs only while Acta remains open', '每 1 分钟':'Every minute', '每 5 分钟':'Every 5 minutes', '每 15 分钟':'Every 15 minutes',
      '从 OneDrive 下载':'Download from OneDrive', '上传到 OneDrive':'Upload to OneDrive', '请选择电脑或网页文件选择器中的 OneDrive 同步文件夹。':'Choose your OneDrive sync folder using the desktop or web folder picker.', 'Acta 不会获取你的 OneDrive 账号或密码；文件传输由系统文件夹与 OneDrive 客户端完成。':'Acta never accesses your OneDrive account or password. The system folder and OneDrive client transfer the file.',
      '测试当前平台的系统通知。定时测试依赖应用内计时器，触发前请保持 Acta 运行。':'Test system notifications on this platform. Scheduled tests use an in-app timer, so keep Acta open until they fire.', '测试当前平台的系统通知。Android 会交给系统定时；Windows 与网页端请在触发前保持 Acta 运行。':'Test system notifications on this platform. Android schedules with the system; keep Acta running before desktop and web reminders fire.', '通知标题':'Notification title', '通知内容':'Notification message', '提醒时间':'Reminder time', '请求通知权限':'Request permission', '立即测试':'Test now', '按时间提醒':'Schedule reminder', '尚未运行通知测试。':'No notification test has run yet.',
      '关于 Acta':'About Acta', '让笔记与行动在一个安静、可掌控的本地空间中自然连接。':'Connect notes and actions naturally in a calm, controllable local space.', '产品':'Product', '版本':'Version', '本版更新日期':'Version date', '桌面框架':'Desktop framework', '笔记、待办和设置默认保存在当前设备；只有在你主动操作时才会导入、导出或同步。':'Notes, tasks, and settings stay on this device by default. Import, export, and sync occur only when you choose them.', '作者：':'Author: ', '。由 Codex 驱动创作；项目开源、免费，欢迎学习、使用与共同改进。':'. Created with Codex; open source and free for learning, use, and collaboration.',
      '完整数据文件夹由 acta-manifest.json、classifications.json、notes/ 和 todos/ 组成；每则笔记与待办分别保存。':'A complete data folder contains acta-manifest.json, classifications.json, notes/, and todos/; every note and task is stored separately.', '保存完整数据文件夹':'Save complete data folder', '从数据文件夹重载':'Reload data folder', '导出数据文件夹':'Export data folder',
      'OneDrive 上传、下载和自动同步均处理完整数据文件夹，笔记与待办不会合并成单个资料库文件。':'OneDrive upload, download, and automatic sync all process the complete data folder; notes and tasks are never merged into one library file.', 'OneDrive 文件夹操作':'OneDrive folder access', '由 OneDrive 客户端同步清单、归类、notes 和 todos 整套文件夹':'The OneDrive client syncs the manifest, classifications, notes, and todos as one complete folder.', '下载完整数据文件夹':'Download complete data folder', '上传完整数据文件夹':'Upload complete data folder', '本地内容变化后自动上传，并定时检查 OneDrive 数据文件夹中的更新':'Upload local changes automatically and periodically check the OneDrive data folder for updates',
      '选择 OneDrive 本地文件夹，由系统 OneDrive 客户端负责上传和下载。':'Choose a local OneDrive folder. The system OneDrive client handles cloud transfers.', 'OneDrive 本地文件夹':'Local OneDrive folder', '尚未选择 OneDrive 本地文件夹':'No local OneDrive folder selected', '文件夹同步':'Folder sync', 'Acta 读写完整数据文件夹，云端传输由 OneDrive 客户端完成':'Acta reads and writes the complete data folder; the OneDrive client handles cloud transfers.', '选择 OneDrive 文件夹':'Choose OneDrive folder', '断开文件夹':'Disconnect folder', '请先选择电脑中的 OneDrive 本地文件夹。':'Choose a local OneDrive folder on this device first.', 'Acta 不连接 Microsoft Graph，也不获取微软账号信息；请确保系统 OneDrive 客户端正在运行。':'Acta does not connect to Microsoft Graph or read Microsoft account information. Keep the system OneDrive client running.',
      '在 OneDrive 本地文件夹与 WebDAV 服务器之间选择一种同步方式。':'Choose between a local OneDrive folder and a WebDAV server.', '同步模式':'Sync mode', '切换后使用对应位置进行上传、下载与自动同步':'Use the selected location for upload, download, and automatic sync.', '仅建议 Windows 用户使用；云端传输由 OneDrive 客户端完成':'Recommended only for Windows users; the OneDrive client handles cloud transfers.', '服务器地址':'Server URL', '填写用于保存 Acta 完整数据文件夹的 WebDAV 目录地址':'Enter the WebDAV directory URL that stores the complete Acta data folder.', '账号':'Account', 'WebDAV 用户名':'WebDAV username', '密码':'Password', '建议使用服务商提供的应用专用密码':'Use an app-specific password from your provider when available.', 'WebDAV 连接':'WebDAV connection', '尚未连接 WebDAV':'WebDAV is not connected', '保存并测试连接':'Save and test connection', '内容变化后自动上传，并定时检查同步位置中的更新':'Upload changes automatically and periodically check the sync location.', '断开同步位置':'Disconnect sync location', '请先选择同步模式并完成连接。':'Choose a sync mode and connect it first.', 'OneDrive 模式不连接 Microsoft Graph；WebDAV 密码仅保存在当前设备，网页版需要服务器允许跨域访问。':'OneDrive mode does not use Microsoft Graph. The WebDAV password stays on this device; web access requires the server to allow cross-origin requests.'
    },
    'zh-Hant': {
      '设置':'設定', '按你的方式使用 Acta':'依照你的方式使用 Acta', '关闭设置':'關閉設定', '设置页面':'設定頁面', '语言':'語言', '工作区':'工作區', '行记数据':'行記資料', '常规设置':'一般設定', '外观设置':'外觀設定', '网盘同步':'網路硬碟同步', '开发者测试':'開發者測試', '关于':'關於',
      '切换 Acta 的界面语言，笔记内容不会被翻译或修改。':'切換 Acta 的介面語言，筆記內容不會被翻譯或修改。', '简体中文':'簡體中文', '英语':'英文',
      '整个资料库保存在所选文件夹内唯一的':'整個資料庫儲存在所選資料夾內唯一的', '文件中。':'檔案中。', '演示工作区':'示範工作區', '尚未选择文件夹；本次修改不会保存。':'尚未選擇資料夾；本次修改不會儲存。', '选择本地文件夹':'選擇本機資料夾', '立即保存':'立即儲存', '从文件重载':'從檔案重新載入', '返回演示工作区':'返回示範工作區',
      '当前是演示工作区。关闭或刷新页面后，演示内容会恢复，不会写入浏览器本地资料库。':'目前是示範工作區。關閉或重新整理頁面後，示範內容會還原，不會寫入瀏覽器本機資料庫。', '调整启动位置、内容密度和动效偏好。':'調整啟動位置、內容密度和動效偏好。', '默认启动页面':'預設啟動頁面', '打开应用时优先进入的智能视图':'開啟應用程式時優先進入的智慧檢視', '收集箱':'收集箱', '今天':'今天', '所有待办':'所有待辦', '所有笔记':'所有筆記', '紧凑列表':'緊湊清單', '在中栏显示更多笔记和待办':'在中欄顯示更多筆記和待辦', '减少动态效果':'減少動態效果', '降低转场和弹性动画，减少视觉干扰':'降低轉場和彈性動畫，減少視覺干擾', '设置会自动保存在当前设备。':'設定會自動儲存在目前裝置。',
      '主题只改变显示效果，不会影响任何笔记或待办数据。':'主題只改變顯示效果，不會影響任何筆記或待辦資料。', '黑白浅色':'黑白淺色', '黑白深色':'黑白深色', '蓝黄':'藍黃', '黄色护眼':'黃色護眼', '自定义':'自訂', '纸张颜色':'紙張顏色', '侧栏颜色':'側欄顏色', '强调颜色':'強調顏色', '界面字体':'介面字型', '同时应用到列表、编辑器和设置页面':'同時套用到清單、編輯器和設定頁面', '系统默认':'系統預設', '衬线字体':'襯線字型', '圆体':'圓體', '等宽字体':'等寬字型', '自定义字体':'自訂字型', '字体家族':'字型家族', '输入设备上已安装的字体，例如 Inter 或 Microsoft YaHei':'輸入裝置上已安裝的字型，例如 Inter 或 Microsoft YaHei', '字体大小':'字型大小', '在紧凑与易读之间调整':'在緊湊與易讀之間調整', '记录，然后行动。Acta 让笔记与待办自然连接。':'記錄，然後行動。Acta 讓筆記與待辦自然連接。',
      '先支持 OneDrive 本地同步文件夹；上传与下载均使用完整资料库数据文件。':'目前支援 OneDrive 本機同步資料夾；上傳與下載均使用完整資料庫檔案。', '尚未选择 OneDrive 同步文件夹':'尚未選擇 OneDrive 同步資料夾', 'OneDrive 文件操作':'OneDrive 檔案操作', '由 OneDrive 客户端把 acta-library.json 同步到云端':'由 OneDrive 用戶端把 acta-library.json 同步到雲端', '选择文件夹':'選擇資料夾', '自动同步':'自動同步', '本地内容变化后自动上传，并定时检查 OneDrive 文件中的更新':'本機內容變更後自動上傳，並定時檢查 OneDrive 檔案中的更新', '检查频率':'檢查頻率', '仅在 Acta 保持运行时执行':'僅在 Acta 保持執行時運作', '每 1 分钟':'每 1 分鐘', '每 5 分钟':'每 5 分鐘', '每 15 分钟':'每 15 分鐘', '从 OneDrive 下载':'從 OneDrive 下載', '上传到 OneDrive':'上傳到 OneDrive', '请选择电脑或网页文件选择器中的 OneDrive 同步文件夹。':'請從電腦或網頁資料夾選擇器選擇 OneDrive 同步資料夾。', 'Acta 不会获取你的 OneDrive 账号或密码；文件传输由系统文件夹与 OneDrive 客户端完成。':'Acta 不會取得你的 OneDrive 帳號或密碼；檔案傳輸由系統資料夾與 OneDrive 用戶端完成。',
      '测试当前平台的系统通知。定时测试依赖应用内计时器，触发前请保持 Acta 运行。':'測試目前平台的系統通知。定時測試依賴應用程式內計時器，觸發前請保持 Acta 執行。', '测试当前平台的系统通知。Android 会交给系统定时；Windows 与网页端请在触发前保持 Acta 运行。':'測試目前平台的系統通知。Android 會交由系統定時；Windows 與網頁端請在觸發前保持 Acta 執行。', '通知标题':'通知標題', '通知内容':'通知內容', '提醒时间':'提醒時間', '请求通知权限':'要求通知權限', '立即测试':'立即測試', '按时间提醒':'按時間提醒', '尚未运行通知测试。':'尚未執行通知測試。', '关于 Acta':'關於 Acta', '让笔记与行动在一个安静、可掌控的本地空间中自然连接。':'讓筆記與行動在一個安靜、可掌控的本機空間中自然連接。', '产品':'產品', '版本':'版本', '本版更新日期':'本版更新日期', '桌面框架':'桌面框架', '笔记、待办和设置默认保存在当前设备；只有在你主动操作时才会导入、导出或同步。':'筆記、待辦和設定預設儲存在目前裝置；只有在你主動操作時才會匯入、匯出或同步。',
      '完整数据文件夹由 acta-manifest.json、classifications.json、notes/ 和 todos/ 组成；每则笔记与待办分别保存。':'完整資料資料夾由 acta-manifest.json、classifications.json、notes/ 和 todos/ 組成；每則筆記與待辦分別儲存。', '保存完整数据文件夹':'儲存完整資料資料夾', '从数据文件夹重载':'從資料資料夾重新載入', '导出数据文件夹':'匯出資料資料夾',
      'OneDrive 上传、下载和自动同步均处理完整数据文件夹，笔记与待办不会合并成单个资料库文件。':'OneDrive 上傳、下載和自動同步都會處理完整資料資料夾，筆記與待辦不會合併成單一資料庫檔案。', 'OneDrive 文件夹操作':'OneDrive 資料夾操作', '由 OneDrive 客户端同步清单、归类、notes 和 todos 整套文件夹':'由 OneDrive 用戶端同步清單、歸類、notes 和 todos 整套資料夾。', '下载完整数据文件夹':'下載完整資料資料夾', '上传完整数据文件夹':'上傳完整資料資料夾', '本地内容变化后自动上传，并定时检查 OneDrive 数据文件夹中的更新':'本機內容變更後自動上傳，並定時檢查 OneDrive 資料資料夾中的更新',
      '选择 OneDrive 本地文件夹，由系统 OneDrive 客户端负责上传和下载。':'選擇 OneDrive 本機資料夾，由系統 OneDrive 用戶端負責上傳和下載。', 'OneDrive 本地文件夹':'OneDrive 本機資料夾', '尚未选择 OneDrive 本地文件夹':'尚未選擇 OneDrive 本機資料夾', '文件夹同步':'資料夾同步', 'Acta 读写完整数据文件夹，云端传输由 OneDrive 客户端完成':'Acta 讀寫完整資料資料夾，雲端傳輸由 OneDrive 用戶端完成。', '选择 OneDrive 文件夹':'選擇 OneDrive 資料夾', '断开文件夹':'中斷資料夾', '请先选择电脑中的 OneDrive 本地文件夹。':'請先選擇電腦中的 OneDrive 本機資料夾。', 'Acta 不连接 Microsoft Graph，也不获取微软账号信息；请确保系统 OneDrive 客户端正在运行。':'Acta 不連接 Microsoft Graph，也不取得 Microsoft 帳號資訊；請確保系統 OneDrive 用戶端正在執行。',
      '在 OneDrive 本地文件夹与 WebDAV 服务器之间选择一种同步方式。':'在 OneDrive 本機資料夾與 WebDAV 伺服器之間選擇一種同步方式。', '同步模式':'同步模式', '切换后使用对应位置进行上传、下载与自动同步':'切換後使用對應位置進行上傳、下載與自動同步。', '仅建议 Windows 用户使用；云端传输由 OneDrive 客户端完成':'僅建議 Windows 使用者使用；雲端傳輸由 OneDrive 用戶端完成。', '服务器地址':'伺服器地址', '填写用于保存 Acta 完整数据文件夹的 WebDAV 目录地址':'填寫用於儲存 Acta 完整資料資料夾的 WebDAV 目錄地址。', '账号':'帳號', 'WebDAV 用户名':'WebDAV 使用者名稱', '密码':'密碼', '建议使用服务商提供的应用专用密码':'建議使用服務商提供的應用程式專用密碼。', 'WebDAV 连接':'WebDAV 連接', '尚未连接 WebDAV':'尚未連接 WebDAV', '保存并测试连接':'儲存並測試連接', '内容变化后自动上传，并定时检查同步位置中的更新':'內容變更後自動上傳，並定時檢查同步位置中的更新。', '断开同步位置':'中斷同步位置', '请先选择同步模式并完成连接。':'請先選擇同步模式並完成連接。', 'OneDrive 模式不连接 Microsoft Graph；WebDAV 密码仅保存在当前设备，网页版需要服务器允许跨域访问。':'OneDrive 模式不連接 Microsoft Graph；WebDAV 密碼僅儲存在目前裝置，網頁版需要伺服器允許跨來源存取。'
    }
  };

  const settingsTextEntries = [];
  const settingsWalker = document.createTreeWalker(settingsModal, NodeFilter.SHOW_TEXT);
  while (settingsWalker.nextNode()) {
    const node = settingsWalker.currentNode;
    const source = node.nodeValue.trim();
    if (!source) continue;
    if (node.parentElement?.closest('#workspaceSettingsTitle,#workspaceFolderPath,#workspaceStatus,#generalStatus,#oneDriveFolderPath,#oneDriveStatus,#notificationStatus,#appFontSizeValue')) continue;
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
      settingsStored:'设置会自动保存在当前设备。', notificationNotRun:'尚未运行通知测试。', defaultSaved:'默认启动页面已保存。', compactUpdated:'列表密度已更新。', motionUpdated:'动态效果偏好已更新。', notificationUnsupported:'当前平台未提供 Web Notification API。', notificationDenied:'通知权限已被系统拒绝，请在系统设置中重新开启。', notificationMissing:'没有获得通知权限。', notificationTitle:'Acta 通知', notificationBody:'通知测试成功。', notificationReady:'通知权限可用，可以开始测试。', notificationSent:'测试通知已发送，请检查系统通知中心。', invalidReminder:'请选择有效的提醒时间。', pastReminder:'提醒时间需要晚于当前时间。', longReminder:'测试提醒时间不能超过 24 天。', notificationFired:'定时通知已触发。', reminderSet:'已安排在 {0} 提醒；触发前请保持 Acta 运行。',
      linkTitle:'关联项目', close:'关闭', linkHint:'选择一个项目建立双向关联；已有关系会显示在编辑器中。', restoreWorkspaceFailed:'无法恢复工作区：{0}', reauthorize:'浏览器需要重新授权工作区文件夹，请点击“选择本地文件夹”。', restoredOneDrive:'已恢复 OneDrive 同步文件夹连接。', restoreOneDriveFailed:'无法恢复 OneDrive 文件夹：{0}'
    },
    en: {
      invalidLibrary:'This is not a valid complete Acta data folder.', localFolder:'Local folder', unsupportedFolder:'This platform cannot read and write complete folders. Use the latest Chrome, Edge, or the client folder picker.', noFolderPermission:'Folder read/write permission was not granted.',
      localWorkspace:'Local Acta Data', demoWorkspace:'Demo Acta Data', actaData:'Acta Data', noFolderNoSave:'No folder selected; changes in this session will not be saved.', noSaveChanges:'Changes are not saved', demoSave:'Demo mode · Not saved', demoStatus:'This is demo Acta Data. Its content resets when you close or refresh the page and is not written to browser storage.',
      savedTo:'Saved the complete data folder to {0} / {1}', saveFailed:'Save failed: {0}', loaded:'Fully loaded {0} / {1}', created:'Created the complete data folder in {0}: {1}', savedNow:'Complete data folder saved now.', reloadConfirm:'Reloading from the data folder will replace the current unsaved interface state. Continue?', reloaded:'Reloaded from the complete data folder.', exportedFolder:'Complete data folder exported to {0}.',
      settingsStored:'Settings are saved automatically on this device.', notificationNotRun:'No notification test has run yet.', defaultSaved:'Default startup view saved.', compactUpdated:'List density updated.', motionUpdated:'Motion preference updated.', notificationUnsupported:'Web Notification API is unavailable on this platform.', notificationDenied:'Notifications are blocked by the system. Re-enable them in system settings.', notificationMissing:'Notification permission was not granted.', notificationTitle:'Acta notification', notificationBody:'Notification test succeeded.', notificationReady:'Notification permission is ready.', notificationSent:'Test notification sent. Check the system notification center.', invalidReminder:'Choose a valid reminder time.', pastReminder:'The reminder time must be in the future.', longReminder:'Test reminders cannot be scheduled more than 24 days ahead.', notificationFired:'Scheduled notification fired.', reminderSet:'Reminder scheduled for {0}. Keep Acta open until it fires.',
      linkTitle:'Link item', close:'Close', linkHint:'Choose an item to create a two-way link. Existing links appear in the editor.', restoreWorkspaceFailed:'Could not restore the workspace: {0}', reauthorize:'The browser needs folder permission again. Click “Choose local folder”.', restoredOneDrive:'Restored the OneDrive sync folder connection.', restoreOneDriveFailed:'Could not restore the OneDrive folder: {0}'
    },
    'zh-Hant': {
      invalidLibrary:'這不是有效的 Acta 完整資料資料夾。', localFolder:'本機資料夾', unsupportedFolder:'目前平台不支援完整資料夾讀寫，請使用最新版 Chrome、Edge 或用戶端資料夾選擇器。', noFolderPermission:'未取得資料夾讀寫權限。',
      localWorkspace:'本機行記資料', demoWorkspace:'示範行記資料', actaData:'行記資料', noFolderNoSave:'尚未選擇資料夾；本次修改不會儲存。', noSaveChanges:'不會儲存變更', demoSave:'示範模式 · 不儲存', demoStatus:'目前是示範行記資料。關閉或重新整理頁面後，示範內容會還原，不會寫入瀏覽器本機資料庫。',
      savedTo:'已儲存完整資料資料夾到 {0} / {1}', saveFailed:'儲存失敗：{0}', loaded:'已完整載入 {0} / {1}', created:'已在 {0} 建立完整資料資料夾：{1}', savedNow:'完整資料資料夾已立即儲存。', reloadConfirm:'從資料資料夾重新載入會覆蓋目前尚未儲存的介面狀態，是否繼續？', reloaded:'已從完整資料資料夾重新載入。', exportedFolder:'完整資料資料夾已匯出到 {0}。',
      settingsStored:'設定會自動儲存在目前裝置。', notificationNotRun:'尚未執行通知測試。', defaultSaved:'預設啟動頁面已儲存。', compactUpdated:'清單密度已更新。', motionUpdated:'動態效果偏好已更新。', notificationUnsupported:'目前平台未提供 Web Notification API。', notificationDenied:'通知權限已被系統拒絕，請在系統設定中重新開啟。', notificationMissing:'未取得通知權限。', notificationTitle:'Acta 通知', notificationBody:'通知測試成功。', notificationReady:'通知權限可用，可以開始測試。', notificationSent:'測試通知已傳送，請檢查系統通知中心。', invalidReminder:'請選擇有效的提醒時間。', pastReminder:'提醒時間需要晚於目前時間。', longReminder:'測試提醒時間不能超過 24 天。', notificationFired:'定時通知已觸發。', reminderSet:'已安排在 {0} 提醒；觸發前請保持 Acta 執行。',
      linkTitle:'關聯項目', close:'關閉', linkHint:'選擇一個項目建立雙向關聯；已有關係會顯示在編輯器中。', restoreWorkspaceFailed:'無法還原工作區：{0}', reauthorize:'瀏覽器需要重新授權工作區資料夾，請點擊「選擇本機資料夾」。', restoredOneDrive:'已還原 OneDrive 同步資料夾連接。', restoreOneDriveFailed:'無法還原 OneDrive 資料夾：{0}'
    }
  };
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
  Object.assign(classificationMessages.zh, { color:'归类颜色', colorHint:'选择颜色后，侧栏和项目卡片会同步更新。', presets:'预设颜色', save:'保存修改', updated:'归类名称、简称与颜色已更新', add:'新建归类', addHint:'创建一个新的归类', manageHint:'编辑名称、简称与颜色', menu:'归类操作', shortName:'折叠简称', shortHint:'留空时根据名称自动生成', shortAuto:'自动生成', managerTitle:'归类管理', listTitle:'归类列表', listCount:'{0} 个归类', contentTitle:'归类内容', notesTitle:'笔记', todosTitle:'待办', noNotes:'此归类下还没有笔记', noTodos:'此归类下还没有待办', itemCount:'{0} 个内容', close:'关闭', openItem:'打开内容' });
  Object.assign(classificationMessages.en, { color:'Classification color', colorHint:'The sidebar and item cards update when you choose a color.', presets:'Preset colors', save:'Save changes', updated:'Classification name, short label, and color updated', add:'New classification', addHint:'Create a new classification', manageHint:'Edit names, short labels, and colors', menu:'Classification actions', shortName:'Collapsed label', shortHint:'Leave blank to generate it from the name', shortAuto:'Auto', managerTitle:'Manage classifications', listTitle:'Classifications', listCount:'{0} classifications', contentTitle:'Classification contents', notesTitle:'Notes', todosTitle:'Tasks', noNotes:'No notes in this classification', noTodos:'No tasks in this classification', itemCount:'{0} items', close:'Close', openItem:'Open item' });
  Object.assign(classificationMessages['zh-Hant'], { color:'歸類顏色', colorHint:'選擇顏色後，側欄和項目卡片會同步更新。', presets:'預設顏色', save:'儲存修改', updated:'歸類名稱、簡稱與顏色已更新', add:'新增歸類', addHint:'建立一個新的歸類', manageHint:'編輯名稱、簡稱與顏色', menu:'歸類操作', shortName:'摺疊簡稱', shortHint:'留空時依名稱自動產生', shortAuto:'自動產生', managerTitle:'歸類管理', listTitle:'歸類列表', listCount:'{0} 個歸類', contentTitle:'歸類內容', notesTitle:'筆記', todosTitle:'待辦', noNotes:'此歸類下還沒有筆記', noTodos:'此歸類下還沒有待辦', itemCount:'{0} 個內容', close:'關閉', openItem:'開啟內容' });
  const classificationText = () => classificationMessages[uiSettings.language] || classificationMessages.zh;

  const classificationManagerDialog = byId('classificationManagerDialog');
  const classificationManagerName = byId('classificationManagerName');
  const classificationManagerShortName = byId('classificationManagerShortName');
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

  const normalizedFolderShortName = value => Array.from(String(value || '').trim()).slice(0, 3).join('');
  function updateFolderActionCopy() {
    const copy = classificationText();
    folderActionsMenu.title = copy.menu;
    folderActionsMenu.setAttribute('aria-label', copy.menu);
    byId('folderMenuAddTitle').textContent = copy.add;
    byId('folderMenuAddHint').textContent = copy.addHint;
    byId('folderMenuManageTitle').textContent = copy.manage;
    byId('folderMenuManageHint').textContent = copy.manageHint;
  }
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
    requestAnimationFrame(() => byId('classificationManagerList').querySelector('.active')?.focus());
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
  });
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
    zh: { edit:'编辑', confirm:'确认截止时间', year:'年', month:'月', day:'日', time:'时间（时:分:秒）', invalid:'请输入有效的年份、月份、日期和精确到秒的时间。' },
    en: { edit:'Edit', confirm:'Confirm deadline', year:'Year', month:'Month', day:'Day', time:'Time (hh:mm:ss)', invalid:'Enter a valid year, month, day, and time precise to the second.' },
    'zh-Hant': { edit:'編輯', confirm:'確認截止時間', year:'年', month:'月', day:'日', time:'時間（時:分:秒）', invalid:'請輸入有效的年份、月份、日期和精確到秒的時間。' }
  };
  const todoMetaText = () => todoMetaMessages[uiSettings.language] || todoMetaMessages.zh;

  const localDeadlineFrom = value => {
    const date = value instanceof Date ? value : new Date(value);
    const valid = !Number.isNaN(date.getTime()) ? date : new Date();
    const pad = number => String(number).padStart(2, '0');
    return {
      date: `${valid.getFullYear()}-${pad(valid.getMonth() + 1)}-${pad(valid.getDate())}`,
      time: `${pad(valid.getHours())}:${pad(valid.getMinutes())}:${pad(valid.getSeconds())}`
    };
  };

  createItem = function createItemWithSynchronizedDeadline(type) {
    const created = new Date();
    const now = created.toISOString();
    const deadline = localDeadlineFrom(created);
    const currentFolder = currentView.startsWith('folder:') ? currentView.split(':')[1] : 'ideas';
    const base = {
      id: uid(), type, folderId: getFolder(currentFolder) ? currentFolder : library.folders[0]?.id,
      title: type === 'note' ? t('untitledNote') : t('untitledTodo'), linkedIds: [], createdAt: now, updatedAt: now
    };
    const item = type === 'note'
      ? { ...base, body: '<p><br></p>' }
      : { ...base, due: deadline.date, dueTime: deadline.time, priority: 'medium', notes: '', tasks: [{ id: uid(), text: '', done: false }], completed: false };
    library.items.unshift(item);
    selectedId = item.id;
    mobileEditorOpen = true;
    currentFilter = 'all';
    searchQuery = '';
    byId('searchInput').value = '';
    persist();
    renderAll();
    byId('createMenu').classList.remove('open');
    showToast(`${t('itemCreated')} · ${t(type)}`);
    requestAnimationFrame(() => byId('editorTitle')?.select());
  };

  function dueParts(item) {
    const createdDeadline = localDeadlineFrom(item.createdAt);
    const dateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(item.due || '') || /^(\d{4})-(\d{2})-(\d{2})$/.exec(createdDeadline.date);
    const timeMatch = /^(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(item.dueTime || createdDeadline.time);
    return {
      year:dateMatch[1], month:dateMatch[2], day:dateMatch[3],
      time:timeMatch ? `${timeMatch[1]}:${timeMatch[2]}:${timeMatch[3] || '00'}` : createdDeadline.time
    };
  }

  function dueDateLabel(parts) {
    if (uiSettings.language === 'en') return `${parts.year} / ${parts.month} / ${parts.day}`;
    return `${parts.year}年 ${Number(parts.month)}月 ${Number(parts.day)}日`;
  }

  classificationField = function editableClassificationField(item) {
    const currentFolder = getFolder(item.folderId);
    const copy = classificationText();
    return `<div class="meta-field classification-field">
      <div class="meta-field-heading">
        <label><svg><use href="#i-folder"/></svg>${t('classify')}</label>
        <span class="meta-field-actions">
          <button class="meta-edit-button" id="editClassificationName" type="button"><svg><use href="#i-edit"/></svg><span>${escapeHTML(copy.edit)}</span></button>
          <button class="meta-edit-button meta-delete-button" id="manageClassification" type="button" title="${escapeHTML(copy.manage)}" aria-label="${escapeHTML(copy.manage)}"><svg><use href="#i-more"/></svg></button>
          <button class="meta-confirm-button" id="confirmClassificationName" type="button" title="${escapeHTML(copy.confirm)}" aria-label="${escapeHTML(copy.confirm)}" hidden><svg><use href="#i-check"/></svg></button>
        </span>
      </div>
      <div class="classification-controls">
        <select id="classificationFolder" aria-label="${t('classify')}">
          ${library.folders.map(folder => `<option value="${escapeHTML(folder.id)}" ${folder.id === item.folderId ? 'selected' : ''}>${escapeHTML(folderName(folder))}</option>`).join('')}
        </select>
        <input id="classificationName" value="${escapeHTML(folderName(currentFolder))}" placeholder="${escapeHTML(copy.placeholder)}" aria-label="${escapeHTML(copy.rename)}" maxlength="60" readonly />
      </div>
      <small class="classification-hint">${escapeHTML(copy.hint)}</small>
    </div>`;
  };

  const itemMetaMessages = {
    zh: { open:'编辑截止日期、优先级和归类', noteOpen:'编辑归类', close:'关闭属性设置', panel:'项目属性' },
    en: { open:'Edit deadline, priority, and classification', noteOpen:'Edit classification', close:'Close item properties', panel:'Item properties' },
    'zh-Hant': { open:'編輯截止日期、優先級和歸類', noteOpen:'編輯歸類', close:'關閉屬性設定', panel:'項目屬性' }
  };
  const itemMetaText = () => itemMetaMessages[uiSettings.language] || itemMetaMessages.zh;

  function itemMetaPopover(item) {
    const copy = itemMetaText();
    if (item.type === 'note') {
      return `<div class="item-meta-popover note-meta-popover" id="itemMetaPopover" role="group" aria-label="${escapeHTML(copy.panel)}" hidden>${classificationField(item)}</div>`;
    }
    const due = dueParts(item);
    const metaCopy = todoMetaText();
    return `<div class="item-meta-popover todo-meta-grid" id="itemMetaPopover" role="group" aria-label="${escapeHTML(copy.panel)}" hidden>
      <div class="meta-field due-field">
        <div class="meta-field-heading">
          <label><svg><use href="#i-calendar"/></svg>${t('dueDate')}</label>
          <span class="meta-field-actions">
            <button class="meta-edit-button" id="editDue" type="button"><svg><use href="#i-edit"/></svg><span>${escapeHTML(metaCopy.edit)}</span></button>
            <button class="meta-confirm-button" id="confirmDue" type="button" title="${escapeHTML(metaCopy.confirm)}" aria-label="${escapeHTML(metaCopy.confirm)}" hidden><svg><use href="#i-check"/></svg></button>
          </span>
        </div>
        <div class="due-display" id="dueDisplay"><b id="dueDateValue">${escapeHTML(dueDateLabel(due))}</b><span id="dueTimeValue">${escapeHTML(due.time)}</span></div>
        <div class="due-editor" id="dueEditor" hidden>
          <label class="due-part"><span>${escapeHTML(metaCopy.year)}</span><input id="dueYear" type="number" min="1900" max="9999" step="1" inputmode="numeric" value="${due.year}" /></label>
          <label class="due-part"><span>${escapeHTML(metaCopy.month)}</span><input id="dueMonth" type="number" min="1" max="12" step="1" inputmode="numeric" value="${Number(due.month)}" /></label>
          <label class="due-part"><span>${escapeHTML(metaCopy.day)}</span><input id="dueDay" type="number" min="1" max="31" step="1" inputmode="numeric" value="${Number(due.day)}" /></label>
          <label class="due-part time-part"><span>${escapeHTML(metaCopy.time)}</span><input id="dueTime" type="time" step="1" value="${escapeHTML(due.time)}" /></label>
        </div>
        <p class="meta-error" id="dueError" hidden>${escapeHTML(metaCopy.invalid)}</p>
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
    const closingIndex = top.lastIndexOf('</div>');
    if (closingIndex < 0) return top;
    return `${top.slice(0, closingIndex)}${itemMetaPopover(item)}${top.slice(closingIndex)}`;
  };

  noteEditor = function noteEditorWithMetaMenu(item) {
    const text = stripHTML(item.body);
    return `<article class="editor-wrap note-editor" data-editor-id="${escapeHTML(item.id)}">
      ${editorTop(item)}
      <textarea class="editor-title" id="editorTitle" rows="1" placeholder="${t('untitledNote')}">${escapeHTML(item.title)}</textarea>
      <div class="editor-subline"><span><svg><use href="#i-clock"/></svg>${t('modified')} ${formatDate(item.updatedAt)}</span></div>
      ${linkedItemsSection(item)}
      <div class="note-toolbar" aria-label="${t('format')}">
        <button class="text-tool" data-command="formatBlock" data-value="h2" title="${t('heading')}">H2</button>
        <button data-command="bold"><svg><use href="#i-bold"/></svg></button>
        <button data-command="italic"><svg><use href="#i-italic"/></svg></button>
        <button class="text-tool" data-command="hiliteColor" data-value="#f1e4a7">M</button>
        <span class="toolbar-divider"></span>
        <button data-command="insertUnorderedList"><svg><use href="#i-list"/></svg></button>
        <button data-command="createLink"><svg><use href="#i-link"/></svg></button>
      </div>
      <div class="note-body" id="noteBody" contenteditable="true" inputmode="text" spellcheck="true" autocapitalize="sentences" data-placeholder="${t('notePlaceholder')}">${item.body || ''}</div>
      <div class="note-footer"><span id="noteStats">${text.split(/\s+/).filter(Boolean).length} ${t('words')} · ${text.length} ${t('chars')}</span><span>Acta / Markdown-ready</span></div>
    </article>`;
  };

  todoEditor = function enhancedTodoEditor(item) {
    const tasks = item.tasks || [];
    const completed = tasks.filter(task => task.done).length;
    const progress = tasks.length ? Math.round(completed / tasks.length * 100) : (isTodoComplete(item) ? 100 : 0);
    return `<article class="editor-wrap todo-editor" data-editor-id="${escapeHTML(item.id)}">
      ${editorTop(item)}
      <textarea class="editor-title" id="editorTitle" rows="1" placeholder="${t('untitledTodo')}">${escapeHTML(item.title)}</textarea>
      <div class="editor-subline"><span><svg><use href="#i-clock"/></svg>${t('created')} ${formatDate(item.createdAt)}</span></div>
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
    const editDue = byId('editDue');
    const confirmDue = byId('confirmDue');
    const dueDisplay = byId('dueDisplay');
    const dueEditor = byId('dueEditor');
    const dueError = byId('dueError');
    const dueInputs = [byId('dueYear'), byId('dueMonth'), byId('dueDay'), byId('dueTime')];

    const setDueEditing = editing => {
      editDue.hidden = editing;
      confirmDue.hidden = !editing;
      dueDisplay.hidden = editing;
      dueEditor.hidden = !editing;
      dueError.hidden = true;
      editDue.setAttribute('aria-expanded', String(editing));
      if (editing) requestAnimationFrame(() => byId('dueYear')?.select());
    };

    editDue.addEventListener('click', () => {
      const current = dueParts(item);
      byId('dueYear').value = current.year;
      byId('dueMonth').value = String(Number(current.month));
      byId('dueDay').value = String(Number(current.day));
      byId('dueTime').value = current.time;
      setDueEditing(true);
    });

    confirmDue.addEventListener('click', () => {
      const year = Number(byId('dueYear').value);
      const month = Number(byId('dueMonth').value);
      const day = Number(byId('dueDay').value);
      const timeMatch = /^(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(byId('dueTime').value);
      const testDate = new Date(Date.UTC(year, month - 1, day));
      const validDate = Number.isInteger(year) && year >= 1900 && year <= 9999 && month >= 1 && month <= 12 && day >= 1 && day <= 31
        && testDate.getUTCFullYear() === year && testDate.getUTCMonth() === month - 1 && testDate.getUTCDate() === day;
      const hour = timeMatch ? Number(timeMatch[1]) : -1;
      const minute = timeMatch ? Number(timeMatch[2]) : -1;
      const second = timeMatch ? Number(timeMatch[3] || 0) : -1;
      if (!validDate || !timeMatch || hour < 0 || hour > 23 || minute < 0 || minute > 59 || second < 0 || second > 59) {
        dueError.hidden = false;
        return;
      }
      const nextDue = `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const nextTime = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:${String(second).padStart(2, '0')}`;
      item.due = nextDue;
      item.dueTime = nextTime;
      byId('dueDateValue').textContent = dueDateLabel({ year:String(year), month:String(month).padStart(2, '0'), day:String(day).padStart(2, '0') });
      byId('dueTimeValue').textContent = nextTime;
      touchItem(item);
      renderList();
      setDueEditing(false);
    });

    dueInputs.forEach(input => input.addEventListener('keydown', event => {
      if (event.key === 'Enter') { event.preventDefault(); confirmDue.click(); }
      if (event.key === 'Escape') { event.preventDefault(); setDueEditing(false); }
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
  bindEditor = function bindEditableClassification(item) {
    rendererBindEditor(item);
    const folderSelect = byId('classificationFolder');
    const nameInput = byId('classificationName');
    if (!folderSelect || !nameInput) return;

    const field = nameInput.closest('.classification-field');
    const editButton = byId('editClassificationName');
    const manageButton = byId('manageClassification');
    const confirmButton = byId('confirmClassificationName');
    const setClassificationEditing = editing => {
      field.classList.toggle('is-editing', editing);
      nameInput.readOnly = !editing;
      folderSelect.disabled = editing;
      editButton.hidden = editing;
      manageButton.hidden = editing;
      confirmButton.hidden = !editing;
      if (editing) requestAnimationFrame(() => nameInput.select());
    };

    folderSelect.addEventListener('change', () => {
      nameInput.value = folderName(getFolder(item.folderId));
      nameInput.setCustomValidity('');
      setClassificationEditing(false);
    });

    const commitFolderName = () => {
      const folder = getFolder(item.folderId);
      if (!folder) return;
      const previousName = folderName(folder);
      const nextName = nameInput.value.trim();
      if (!nextName) {
        nameInput.setCustomValidity(classificationText().empty);
        nameInput.reportValidity();
        return;
      }
      if (library.folders.some(entry => entry.id !== folder.id && folderName(entry).trim().toLocaleLowerCase() === nextName.toLocaleLowerCase())) {
        nameInput.setCustomValidity(classificationText().duplicate);
        nameInput.reportValidity();
        return;
      }
      nameInput.setCustomValidity('');
      if (nextName === previousName) { setClassificationEditing(false); return; }
      folder.name = nextName;
      delete folder.nameKey;
      nameInput.value = nextName;
      const editorFolder = document.querySelector('.editor-folder');
      if (editorFolder) editorFolder.textContent = nextName;
      const option = folderSelect.querySelector(`option[value="${CSS.escape(folder.id)}"]`);
      if (option) option.textContent = nextName;
      persist();
      renderSidebar();
      renderList();
      setClassificationEditing(false);
      showToast(classificationText().updated);
    };

    editButton.addEventListener('click', () => setClassificationEditing(true));
    manageButton.addEventListener('click', () => openClassificationManager(item.folderId));
    confirmButton.addEventListener('click', commitFolderName);
    nameInput.addEventListener('input', () => nameInput.setCustomValidity(''));
    nameInput.addEventListener('keydown', event => {
      if (isImeComposing(event)) return;
      if (event.key === 'Enter') { event.preventDefault(); commitFolderName(); }
      if (event.key === 'Escape') {
        event.preventDefault();
        nameInput.value = folderName(getFolder(item.folderId));
        nameInput.setCustomValidity('');
        setClassificationEditing(false);
      }
    });
  };

  const closeItemMetaPopover = (restoreFocus = false) => {
    const panel = byId('itemMetaPopover');
    const button = byId('itemMetaButton');
    if (!panel || !button || panel.hidden) return;
    panel.hidden = true;
    button.classList.remove('is-open');
    button.setAttribute('aria-expanded', 'false');
    const item = getItem();
    const copy = itemMetaText();
    const label = item?.type === 'todo' ? copy.open : copy.noteOpen;
    button.title = label;
    button.setAttribute('aria-label', label);
    if (restoreFocus) button.focus();
  };

  document.addEventListener('click', event => {
    const button = event.target.closest?.('#itemMetaButton');
    if (button) {
      event.preventDefault();
      const panel = byId('itemMetaPopover');
      if (!panel) return;
      const opening = panel.hidden;
      if (opening) {
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
    document.body.classList.toggle('hide-type-filters', ['todos', 'notes', 'completed'].includes(currentView));
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
      const item = library.items.find(entry => entry.id === card.dataset.id);
      if (item?.type === 'todo') {
        const dateLabel = card.querySelector('.card-date');
        if (dateLabel && item.due) dateLabel.textContent = `${formatDate(item.due, true)} · ${dueParts(item).time}`;
      }
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

  const itemFileName = item => {
    const bytes = new TextEncoder().encode(String(item.id || 'item'));
    const encodedId = [...bytes].map(byte => byte.toString(16).padStart(2, '0')).join('');
    return `item-${encodedId || '00'}.json`;
  };

  function createDataFolderDocuments(librarySnapshot) {
    const snapshot = clearLegacyTags(JSON.parse(JSON.stringify(librarySnapshot)));
    const syncedAt = new Date().toISOString();
    const notes = snapshot.items.filter(item => item.type === 'note').map(item => ({
      id: item.id, file: itemFileName(item), updatedAt: item.updatedAt || '',
      document: { format:'acta-note', version:1, item }
    }));
    const todos = snapshot.items.filter(item => item.type === 'todo').map(item => ({
      id: item.id, file: itemFileName(item), updatedAt: item.updatedAt || '',
      document: { format:'acta-todo', version:1, item }
    }));
    return {
      manifest: {
        format:'acta-data-folder', version:2, libraryVersion:snapshot.version || 1, syncedAt,
        classifications:classificationsFile,
        notes:notes.map(({ id, file, updatedAt }) => ({ id, file, updatedAt })),
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
    const items = [
      ...notes.map(document => unwrapItem(document, 'note')),
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
      format:'acta-data-folder-bundle', version:2,
      files: {
        [dataManifestFile]: documents.manifest,
        [classificationsFile]: documents.classifications,
        [notesDirectoryName]: Object.fromEntries(documents.notes.map(entry => [entry.file, entry.document])),
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
      notes:(manifest?.notes || []).map(entry => noteFiles[entry.file]),
      todos:(manifest?.todos || []).map(entry => todoFiles[entry.file])
    });
  }

  async function writeJSONFile(directory, name, value) {
    const fileHandle = await directory.getFileHandle(name, { create:true });
    const writable = await fileHandle.createWritable();
    await writable.write(JSON.stringify(value, null, 2));
    await writable.close();
  }

  async function readJSONFile(directory, name) {
    const fileHandle = await directory.getFileHandle(name);
    const file = await fileHandle.getFile();
    return JSON.parse(await file.text());
  }

  async function removeStaleItemFiles(directory, expectedFiles) {
    if (!directory.entries || !directory.removeEntry) return;
    for await (const [name, entry] of directory.entries()) {
      if (entry.kind === 'file' && /^item-[a-f0-9]+\.json$/i.test(name) && !expectedFiles.has(name)) {
        await directory.removeEntry(name);
      }
    }
  }

  async function saveDataFolder(handle, librarySnapshot) {
    const documents = createDataFolderDocuments(librarySnapshot);
    const notesDirectory = await handle.getDirectoryHandle(notesDirectoryName, { create:true });
    const todosDirectory = await handle.getDirectoryHandle(todosDirectoryName, { create:true });
    await Promise.all(documents.notes.map(entry => writeJSONFile(notesDirectory, entry.file, entry.document)));
    await Promise.all(documents.todos.map(entry => writeJSONFile(todosDirectory, entry.file, entry.document)));
    await writeJSONFile(handle, classificationsFile, documents.classifications);
    await writeJSONFile(handle, dataManifestFile, documents.manifest);
    await removeStaleItemFiles(notesDirectory, new Set(documents.notes.map(entry => entry.file)));
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
    const notes = await Promise.all((manifest.notes || []).map(entry => readJSONFile(notesDirectory, entry.file)));
    const todos = await Promise.all((manifest.todos || []).map(entry => readJSONFile(todosDirectory, entry.file)));
    return libraryFromDataFolderDocuments({ manifest, classifications, notes, todos });
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
        if (payload?.format !== 'acta-data-folder-bundle') {
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

    async function writeJSON(path, value) {
      await request(path, {
        method:'PUT',
        headers:{ 'Content-Type':'application/json; charset=utf-8' },
        body:JSON.stringify(value, null, 2)
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
      const stale = (await listCollection(path)).filter(name => /^item-[a-f0-9]+\.json$/i.test(name) && !expectedFiles.has(name));
      await runWithConcurrency(stale, 3, name => request(`${path}/${name}`, { method:'DELETE', allow:[204, 404] }));
    }

    async function save(librarySnapshot) {
      const documents = createDataFolderDocuments(librarySnapshot);
      await ensureCollection('');
      await Promise.all([ensureCollection(notesDirectoryName + '/'), ensureCollection(todosDirectoryName + '/')]);
      await runWithConcurrency([
        ...documents.notes.map(entry => ({ path:`${notesDirectoryName}/${entry.file}`, value:entry.document })),
        ...documents.todos.map(entry => ({ path:`${todosDirectoryName}/${entry.file}`, value:entry.document }))
      ], 4, entry => writeJSON(entry.path, entry.value));
      await writeJSON(classificationsFile, documents.classifications);
      await Promise.all([
        cleanCollection(notesDirectoryName + '/', new Set(documents.notes.map(entry => entry.file))),
        cleanCollection(todosDirectoryName + '/', new Set(documents.todos.map(entry => entry.file)))
      ]);
      await writeJSON(dataManifestFile, documents.manifest);
    }

    async function load() {
      const manifest = await readJSON(dataManifestFile);
      const classifications = await readJSON(manifest.classifications || classificationsFile);
      const notes = new Array((manifest.notes || []).length);
      const todos = new Array((manifest.todos || []).length);
      await runWithConcurrency(manifest.notes || [], 4, async (entry, index) => { notes[index] = await readJSON(`${notesDirectoryName}/${entry.file}`); });
      await runWithConcurrency(manifest.todos || [], 4, async (entry, index) => { todos[index] = await readJSON(`${todosDirectoryName}/${entry.file}`); });
      return libraryFromDataFolderDocuments({ manifest, classifications, notes, todos });
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
    if (bridge) {
      const selection = await bridge.chooseSyncFolder();
      if (!selection) return null;
      const folder = typeof selection === 'string' ? selection : (selection.folder || selection.uri);
      if (!folder) return null;
      return createNativeFolderAdapter(folder, bridge, typeof selection === 'string' ? selection : (selection.label || selection.name || folder));
    }
    throw new Error(uiText('unsupportedFolder'));
  }

  function replaceLibrary(nextLibrary) {
    library = clearLegacyTags(normalizeLibrary(nextLibrary));
    selectedId = library.items[0]?.id || null;
    currentView = 'inbox';
    currentFilter = 'all';
    searchQuery = '';
    mobileEditorOpen = false;
    byId('searchInput').value = '';
    document.querySelectorAll('.filter-row button').forEach(button => button.classList.toggle('active', button.dataset.filter === 'all'));
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
  const sidebarToggleCopy = {
    zh: { collapse:'收起左侧功能栏', expand:'展开左侧功能栏' },
    en: { collapse:'Collapse sidebar', expand:'Expand sidebar' },
    'zh-Hant': { collapse:'收起左側功能列', expand:'展開左側功能列' }
  };
  const updateSidebarToggleLabel = () => {
    const collapsed = document.body.classList.contains('sidebar-collapsed');
    const copy = sidebarToggleCopy[uiSettings.language] || sidebarToggleCopy.zh;
    const label = collapsed ? copy.expand : copy.collapse;
    sidebarToggle.title = label;
    sidebarToggle.setAttribute('aria-label', label);
    sidebarToggle.setAttribute('aria-expanded', String(!collapsed));
  };
  const applySidebarCollapse = collapsed => {
    closeFolderActionMenu();
    uiSettings.sidebarCollapsed = Boolean(collapsed);
    document.body.classList.toggle('sidebar-collapsed', uiSettings.sidebarCollapsed);
    updateSidebarToggleLabel();
  };
  applySidebarCollapse(uiSettings.sidebarCollapsed);
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
      updateNotificationDefaults();
      const classificationCopy = classificationText();
      byId('manageFolders').title = classificationCopy.manage;
      byId('manageFolders').setAttribute('aria-label', classificationCopy.manage);
      byId('addFolder').title = classificationCopy.add;
      byId('addFolder').setAttribute('aria-label', classificationCopy.add);
      updateFolderActionCopy();
      if (classificationManagerDialog.open) renderClassificationManager();
      setStatus(byId('generalStatus'), uiText('settingsStored'));
      setStatus(byId('notificationStatus'), uiText('notificationNotRun'));
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
  applyGeneralSettings();

  const customPaper = byId('customPaperColor');
  const customSidebar = byId('customSidebarColor');
  const customAccent = byId('customAccentColor');
  customPaper.value = uiSettings.customPaper;
  customSidebar.value = uiSettings.customSidebar;
  customAccent.value = uiSettings.customAccent;

  const isDarkSystemBarColor = color => {
    const match = String(color || '').trim().match(/^#([\da-f]{6})$/i);
    if (!match) return uiSettings.theme === 'mono-dark';
    const channels = [0, 2, 4].map(offset => parseInt(match[1].slice(offset, offset + 2), 16) / 255).map(channel => channel <= .04045 ? channel / 12.92 : ((channel + .055) / 1.055) ** 2.4);
    return channels[0] * .2126 + channels[1] * .7152 + channels[2] * .0722 < .42;
  };

  const currentSystemBarColor = () => getComputedStyle(document.documentElement).getPropertyValue('--sidebar').trim() || '#e7e7e3';

  function syncNativeSystemBar(color = currentSystemBarColor()) {
    const nativeStatusBar = window.Capacitor?.Plugins?.StatusBar;
    if (!nativeStatusBar) return;
    nativeStatusBar.setOverlaysWebView({ overlay:false }).catch(() => {});
    nativeStatusBar.setBackgroundColor({ color }).catch(() => {});
    nativeStatusBar.setStyle({ style:isDarkSystemBarColor(color) ? 'LIGHT' : 'DARK' }).catch(() => {});
  }

  function applyTheme() {
    const root = document.documentElement;
    root.dataset.actaTheme = uiSettings.theme;
    const isCustom = uiSettings.theme === 'custom';
    ['--paper', '--panel', '--sidebar', '--sage', '--sage-2'].forEach(property => root.style.removeProperty(property));
    if (isCustom) {
      root.style.setProperty('--paper', uiSettings.customPaper);
      root.style.setProperty('--panel', uiSettings.customPaper);
      root.style.setProperty('--sidebar', uiSettings.customSidebar);
      root.style.setProperty('--sage', uiSettings.customAccent);
      root.style.setProperty('--sage-2', `${uiSettings.customAccent}22`);
    }
    byId('customColorSettings').classList.toggle('show', isCustom);
    document.querySelectorAll('input[name="actaTheme"]').forEach(option => option.checked = option.value === uiSettings.theme);
    byId('customSwatchPaper').style.background = uiSettings.customPaper;
    byId('customSwatchSidebar').style.background = uiSettings.customSidebar;
    byId('customSwatchAccent').style.background = uiSettings.customAccent;
    document.querySelector('meta[name="color-scheme"]').content = uiSettings.theme === 'mono-dark' ? 'dark' : 'light';
    const statusColor = currentSystemBarColor();
    document.querySelector('meta[name="theme-color"]').content = statusColor;
    syncNativeSystemBar(statusColor);
  }

  document.querySelectorAll('input[name="actaTheme"]').forEach(option => option.addEventListener('change', () => {
    if (!option.checked) return;
    uiSettings.theme = option.value; applyTheme(); saveUISettings();
  }));
  [customPaper, customSidebar, customAccent].forEach(input => input.addEventListener('input', () => {
    uiSettings.theme = 'custom';
    uiSettings.customPaper = customPaper.value;
    uiSettings.customSidebar = customSidebar.value;
    uiSettings.customAccent = customAccent.value;
    applyTheme(); saveUISettings();
  }));
  applyTheme();

  const appFontSetting = byId('appFontSetting');
  const customFontFamily = byId('customFontFamily');
  const customFontRow = byId('customFontRow');
  const appFontSizeSetting = byId('appFontSizeSetting');
  const appFontSizeValue = byId('appFontSizeValue');
  appFontSetting.value = uiSettings.appFont;
  customFontFamily.value = uiSettings.customFont || 'Inter';
  appFontSizeSetting.value = String(uiSettings.appFontSize);

  function applyFontSettings() {
    const safeCustomFont = (uiSettings.customFont || 'Inter').replace(/[;{}<>]/g, '').trim() || 'Inter';
    uiSettings.customFont = safeCustomFont;
    uiSettings.appFontSize = Math.min(22, Math.max(12, Number(uiSettings.appFontSize) || 14));
    document.documentElement.dataset.actaFont = uiSettings.appFont;
    document.documentElement.style.setProperty('--acta-custom-font', safeCustomFont);
    document.body.style.setProperty('--acta-font-scale', String(uiSettings.appFontSize / 14));
    appFontSizeSetting.value = String(uiSettings.appFontSize);
    appFontSizeValue.textContent = `${uiSettings.appFontSize} px`;
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
      if (autoSyncDirty || reason === 'change') {
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
    configureAutomaticSync(true);
    if (uiSettings.autoSync) {
      try {
        await refreshCloudVersion();
        setTimeout(() => runAutomaticSync('interval'), 450);
      } catch (error) {
        uiSettings.autoSync = false;
        saveUISettings();
        configureAutomaticSync();
        setStatus(byId('oneDriveStatus'), error.message, 'error');
      }
    }
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

  const notificationStatus = byId('notificationStatus');
  const titleInput = byId('notificationTitle');
  const bodyInput = byId('notificationBody');
  const timeInput = byId('notificationTime');
  let notificationTimer = null;

  function updateNotificationDefaults() {
    const defaults = {
      zh: { title:'Acta 通知测试', body:'这是一条来自 Acta 开发者测试页面的通知。' },
      en: { title:'Acta notification test', body:'This is a notification from the Acta developer test page.' },
      'zh-Hant': { title:'Acta 通知測試', body:'這是一則來自 Acta 開發者測試頁面的通知。' }
    };
    const titles = Object.values(defaults).map(value => value.title);
    const bodies = Object.values(defaults).map(value => value.body);
    const next = defaults[uiSettings.language] || defaults.zh;
    if (!titleInput.value.trim() || titles.includes(titleInput.value)) titleInput.value = next.title;
    if (!bodyInput.value.trim() || bodies.includes(bodyInput.value)) bodyInput.value = next.body;
  }
  updateNotificationDefaults();

  function localDateTimeValue(date) {
    const pad = value => String(value).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  }
  timeInput.value = localDateTimeValue(new Date(Date.now() + 60000));

  const nativeNotifications = () => window.Capacitor?.Plugins?.LocalNotifications || null;

  async function notificationPermission() {
    const native = nativeNotifications();
    if (native) {
      let permission = await native.checkPermissions();
      if (permission.display !== 'granted') permission = await native.requestPermissions();
      if (permission.display !== 'granted') throw new Error(uiText('notificationMissing'));
      return true;
    }
    if (!('Notification' in window)) throw new Error(uiText('notificationUnsupported'));
    if (Notification.permission === 'granted') return true;
    if (Notification.permission === 'denied') throw new Error(uiText('notificationDenied'));
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') throw new Error(uiText('notificationMissing'));
    return true;
  }

  async function sendTestNotification() {
    await notificationPermission();
    const title = titleInput.value.trim() || uiText('notificationTitle');
    const body = bodyInput.value.trim() || uiText('notificationBody');
    const native = nativeNotifications();
    if (native) {
      await native.schedule({ notifications:[{ id:(Date.now() % 2000000000) || 1, title, body, schedule:{ at:new Date(Date.now() + 350) }, smallIcon:'ic_stat_acta', iconColor:'#526b55' }] });
      return;
    }
    if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
      const registration = await navigator.serviceWorker.ready;
      await registration.showNotification(title, { body, icon:'./icons/icon-192.png', badge:'./icons/icon-96.png', tag:`acta-test-${Date.now()}` });
      return;
    }
    const notification = new Notification(title, { body, icon:'./icons/icon-192.png', tag: `acta-test-${Date.now()}` });
    notification.onclick = () => window.focus();
  }

  byId('requestNotificationPermission').addEventListener('click', async () => {
    try { await notificationPermission(); setStatus(notificationStatus, uiText('notificationReady'), 'success'); }
    catch (error) { setStatus(notificationStatus, error.message, 'error'); }
  });
  byId('sendNotificationNow').addEventListener('click', async () => {
    try { await sendTestNotification(); setStatus(notificationStatus, uiText('notificationSent'), 'success'); }
    catch (error) { setStatus(notificationStatus, error.message, 'error'); }
  });
  byId('scheduleNotification').addEventListener('click', async () => {
    try {
      await notificationPermission();
      const triggerAt = new Date(timeInput.value).getTime();
      const delay = triggerAt - Date.now();
      if (!timeInput.value || Number.isNaN(triggerAt)) throw new Error(uiText('invalidReminder'));
      if (delay <= 0) throw new Error(uiText('pastReminder'));
      const native = nativeNotifications();
      if (native) {
        await native.schedule({ notifications:[{
          id:(Date.now() % 2000000000) || 1,
          title:titleInput.value.trim() || uiText('notificationTitle'),
          body:bodyInput.value.trim() || uiText('notificationBody'),
          schedule:{ at:new Date(triggerAt), allowWhileIdle:true },
          smallIcon:'ic_stat_acta', iconColor:'#526b55'
        }] });
        setStatus(notificationStatus, uiText('reminderSet', new Date(triggerAt).toLocaleString(document.documentElement.lang)), 'success');
        return;
      }
      if (delay > 2147483647) throw new Error(uiText('longReminder'));
      if (notificationTimer) clearTimeout(notificationTimer);
      notificationTimer = setTimeout(async () => {
        try { await sendTestNotification(); setStatus(notificationStatus, uiText('notificationFired'), 'success'); }
        catch (error) { setStatus(notificationStatus, error.message, 'error'); }
        notificationTimer = null;
      }, delay);
      setStatus(notificationStatus, uiText('reminderSet', new Date(triggerAt).toLocaleString(document.documentElement.lang)), 'success');
    } catch (error) { setStatus(notificationStatus, error.message, 'error'); }
  });

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
    const target = event.target.closest('.task-check, #completeItem');
    if (!target) return;
    const row = target.closest('.task-row');
    const undo = row ? row.classList.contains('done') : Boolean(getItem(selectedId)?.completed);
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
      try { await refreshCloudVersion(); }
      catch (error) { setStatus(byId('oneDriveStatus'), error.message, 'error'); }
      updateOneDriveUI(cloudSyncMode.value === 'webdav' ? syncText('webDavStored') : localFolderSyncText('restored'));
      configureAutomaticSync();
      if (uiSettings.autoSync) setTimeout(() => runAutomaticSync('interval'), 450);
    } else updateOneDriveUI();
  }
  restoreFolderConnections();

  const nativeApp = window.Capacitor?.Plugins?.App;
  if (nativeApp?.addListener) {
    nativeApp.addListener('resume', () => syncNativeSystemBar());
    nativeApp.addListener('backButton', async () => {
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
