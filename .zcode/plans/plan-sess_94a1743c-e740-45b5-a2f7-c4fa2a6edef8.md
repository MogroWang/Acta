# Acta v3.0.0 UI 规范化与功能修缮计划

依据 kill-ai-slop（减法优先、一个强调色、装饰必须有含义）与 apple-design（按压即时反馈、克制动效、reduced-motion 尊重）两个 skill 的原则执行。版本保持 3.0.0，不做本地打包构建。

## 一、Acta Handy 彻底移除（任务 1，已确认彻底移除）

| 文件 | 位置 | 动作 |
|---|---|---|
| src/index.html | 316（导航按钮）、348-361（设置面板） | 删除 |
| src/interface.js | 199-205、242-248（i18n 词典）、259（applyTranslations 跳过列表清理）、2578（refreshHandyPanel 钩子）、4208-4371（整个 Handy 模块） | 删除 |
| src/tauri-bridge.js | 86-103（6 个 handy 命令封装） | 删除 |
| src-tauri/src/lib.rs | 1049-1055（常量）、1057-1478（辅助函数与 handy_* 命令）、invoke_handler 注册表中的对应项、`upload_library` 内 `absorb_handy_self_write` 调用（298 行附近） | 删除 |
| src/interface.css | 2109-2136（Handy 设置页样式） | 删除 |

README.md / README_EN.md 中的 Acta Handy 功能条目同步删除；CHANGELOG 历史条目保留（不篡改历史），在 v3.0.0 分节追加"移除"说明。

## 二、刷新数据改为纯读取（任务 2）

`src/interface.js` `refreshCurrentData()`（2739-2803）：
- 删除 `await flushCurrentDataProfile()` 与 `await workspaceWriteQueue` 的"先写后读"步骤；
- 删除 sync 分支末尾 `if (workspaceAdapter) await queueWorkspaceSave(snapshot)`（不再把云端快照回写覆盖本地文件夹）；
- 保留 `adapter.load() → replaceLibrary()` 纯读取链路；旧版 manifest（<3）档案在 load 内部的一次性升级重写保留（数据迁移必需，否则旧档案无法读取）。

## 三、左下角按钮组：折叠按钮 + 行记数据统计弹窗（任务 3）

- 折叠按钮 `#sidebarToggle` 当前在 DOM（index.html:192）但布局上不显眼：保留它，并随下方布局调整确保展开/折叠两态均清晰可见（折叠态单列垂直堆叠）。
- `sidebar-dock-actions` 加入新按钮 `#dataStatsButton`（图标 #i-chart），`interface.css:670` grid 由 3 列改 4 列等宽。
- 新增统计弹窗 `#dataStatsDialog`（复用 relation-dialog 风格），展示：**文件总大小、文件数、笔记数、待办数、归类数、最近更新时间**。
- `src-tauri/src/lib.rs` 新增命令 `data_folder_stats`（仿 `inspect_folder` 的 spawn_blocking + read_dir 模式，递归累加 `metadata.len()` 与文件数；遍历 notes/todos 计数）。tauri-bridge.js 与 invoke_handler 注册同步。
- 前端逻辑：folder 档案走后端命令；local 档案（浏览器存储）以 JSON 字节长度估算大小；条目计数直接取内存 library。

## 四、侧边栏「统计」改名「总结」（任务 4）

interface.js i18n 词条 `stats`（统计→总结 / 統計→總結 / Stats→Summary）、index.html:163 初始文案、367 默认启动页选项文案、mobileStats 的 aria-label。选择器 `data-view="stats"` 不变，smoke-test 同步。

## 五、Markdown 编辑器全面优化（任务 5，最大模块）

**5a 行间距滑块**：index.html:389 的 select 改为 `range`（min 1.0 / max 2.0 / step 0.1）+ `<output>`（复用 384 行基准字号的 `.font-size-control` 结构）；interface.js:3096 的取值 Set 改为范围 clamp 校验，change 绑定（3162-3166）同步。

**5b 深色主题源码模式颜色**：interface.css:1117 `.note-markdown-source` 背景由 `color-mix(--ink 94%…)`（深色主题下 --ink 是浅色，导致浅底浅字）改为纸色系 `color-mix(in srgb, var(--paper) 94%, var(--note-accent))`，`color: var(--ink)`、`caret-color: var(--note-accent)`（与沉浸模式 1222 行的取色统一）；顺带修正 1111 行代码块 pre 的同款 ink 取色问题。

**5c 沉浸顶栏可拖动**：项目现有拖动机制是 tauri-bridge.js:133-140 的 `mousedown → currentWindow.startDragging()`；为 `.note-focus-header` 添加同样处理（排除 button 点击），仅 Tauri 桌面环境生效，Capacitor/浏览器自动跳过。

**5d 模式切换格式改变 bug（严重）**：根因是 HTML→MD→HTML 往返有损转换。
1. `setMarkdownMode`（renderer.js:2478-2505）：进入源码模式时暂存 `body.innerHTML` 原文并置 `sourceDirty=false`；textarea 每次输入才置 dirty；退出时**未修改过源码则直接恢复原文（零转换）**，修改过才走 `markdownToNoteHTML` 转换。
2. 转换器对称性修复（noteHTMLToMarkdown 230-271 / markdownInline 273-293 / markdownToNoteHTML 295-370）：HTML 实体转义/还原对称、嵌套列表缩进、blockquote 嵌套、代码围栏语言标记、任务列表往返一致。
3. smoke-test 增加往返一致性断言（任意笔记 HTML → MD → HTML 的规范化 DOM 等价）。

**5e 沉浸模式输入动画 + 设置项**：
- `defaultUISettings` 新增 `noteTypingAnimation: 'rise'`（三选：off / rise 涌现 / glow 高亮渐隐），编辑器设置面板加下拉；
- 实现：沉浸模式下（body.note-focus-mode）用 MutationObserver 监听 `.note-body` 新增文本，临时包裹 `span.note-type-in`，CSS 动画（rise：opacity+2px 位移涌现；glow：从 --note-accent 高亮色衰减回默认色），`animationend` 后解包保持 DOM 干净；
- `body.acta-reduce-motion` 与 `prefers-reduced-motion` 时自动禁用（尊重全局设置 369 行）。

**5f 可视化模式 Markdown 实时生效**：input 事件中检测——块级（行首 `# `/`## `/`### ` 空格触发标题、`> ` 引用、`- `/`1. `/`- [ ] ` 列表与任务）用 formatBlock/list 命令转换；行内（`**xx**`、`*xx*`、`` `xx` ``、`~~xx~~`、`==xx==` 闭合时）用 Range 将占位符替换为 strong/em/code/del/mark 元素；尽量走 execCommand 保持原生 undo 可用。

**5g 选中文本颜色**：新增 `::selection`（全项目当前未定义）：全局用 `color-mix(in srgb, var(--sage) 30%, transparent)` 跟随主题强调色，编辑器正文内用 `--note-accent` 变体。

## 六、深色模式新建快捷键失配（任务 6）

styles.css:128 的 `.new-button kbd` 硬编码白字改为从 `currentColor` 派生（`color-mix(currentColor 62%…)` 文字 + 12% 底），一处修复自动适配全部 12 个主题（mono-dark/mws-dark 深浅底均正确）。

## 七、速记强调色固定红色（任务 7）

interface.css:886 `:root` 已定义红色 `#d0373f`，但 894/900/906-954 各主题覆盖了它——删除所有主题的 `--quick-accent` 覆盖使其恒为红色；深色主题保留 `--quick-soft/--quick-wash` 的深色适配值。

## 八、文件夹图标小圆点移除（任务 8）

index.html:185 删 `<i></i>`；styles.css:175 与 interface.css:602、647 的 `.sync-icon i` 规则删除（纯装饰、无任何逻辑绑定，符合减法原则）。

## 九、常规设置移到第二位（任务 9）

index.html:313-320 设置导航重排为：语言 → **常规设置** → 行记数据 → 数据同步 → 笔记编辑器 → 外观设置 → 关于（Handy 移除后共 7 项）；面板 DOM 顺序同步整理。

## 十、设置窗口标题栏重设计（任务 10）

interface.css 100-110 区域：标题栏布局/间距/层级打磨；`.settings-close` 增加 transition 与 `:hover`（背景色变化 + scale(1.06)）、`:active`（scale(.94)）——只有颜色与缩放反馈，无旋转/转圈（apple-design：按压即时反馈）。

## 十一、自定义日期时间选择器（任务 11，不调用原生控件）

新建 `src/custom-datetime.js`，架构复用 custom-select.js 的弹层机制（fixed 定位锚定、上下翻转、dialog 包含块处理、双 rAF 展开、键盘导航、点击外部关闭、acx-menu 风格样式）：
- 弹层 UI：月历网格（上月/下月、回到今天）+ 时/分/秒步进输入 + 「清除」「此刻」操作行；
- 接管点：速记弹窗两处（index.html:532-539）与待办编辑器排程行（interface.js:1138-1139）；原 `input[type=datetime-local]` 替换为自绘触发框，值仍以 ISO 字符串承载（与 renderer.js:385-396 的 `dateTimeLocalValue/dateTimeLocalISO` 兼容，改动面收敛）；
- 深浅主题、界面字号缩放、reduced-motion 全部适配。

## 十二、归类新建/编辑按钮悬停反馈（任务 12）

styles.css:165-166 去掉 `rotate(90deg)`，interface.css:334 去掉 `rotate(-8deg)`——悬停仅保留背景变化 + 轻微缩放（apple-design：反馈与语义一致，图标不旋转）；mono-dark/mws-dark 补充 `.section-label button:hover` 深色适配（半透明白低透明度，替代现沿用的 65% 白底）。

## 十三、移动端按钮布局重排（任务 13，已确认行记数据按钮移除）

- index.html:132 删除 `#mobileActaData` 及其 JS（683-685、700-702）；右上角 actions 变为：**回收站**（新增 `#mobileTrash`，`data-view="trash"` 走现有视图切换委托）、总结、刷新、设置；
- 底栏 smart-nav 5 列 → 4 列均分（styles.css 415-427 与 interface.css:1746-1752 的 nth-child 映射重排），第 5 格（回收站按钮）移动端 `display:none`（桌面侧栏保留）；
- 结果：收集箱 / 日历 / 待办 / 笔记 整齐 4 列，右上角回收站直达。

## 十四、「显示已完成」去重（任务 14）

删除右上角 `#todoStatusSwitch`（index.html:203）及其逻辑（interface.js syncMergedTodoNavigation 1496-1519 中 switchButton 部分、1527-1531 绑定、CSS .todo-status-switch 含 1839-1841 移动端规则）；保留筛选栏下方的 `#todoCompletedToggle`（index.html:276-280）。

## 十五、移动端新建按钮正圆形（任务 15）

styles.css 429-438（及 interface.css:1765、1997 的重复声明处）`border-radius: 17px → 50%`；hover/active 的 translateX(-50%) transform 保持不变。

## 收尾

1. **kill-ai-slop 扫描**：运行该 skill 的 `scripts/scan.mjs`，核对本次涉及文件无新增 slop 命中，报告中说明有意保留项。
2. **冒烟测试**：同步 scripts/smoke-test.js（dock 四按钮、总结改名、日期选择器、动画默认值），运行 `npm test`（本机 Edge/Chrome，非构建）；Rust 侧跑 `cargo check` 仅验证编译。
3. **文档**：README.md / README_EN.md 删 Handy 条目、补充新功能（数据统计弹窗、输入动画、实时 Markdown、自定义日期时间选择器等）；CHANGELOG.md 在 v3.0.0 分节追加本次「新增 / 修复 / 变更」条目。
4. **提交**：按仓库惯例提交到 main，message 形如 `feat(v3.0.0): 移除 Acta Handy 集成、编辑器体验全面优化与界面控件修缮`，正文列要点。不 push。