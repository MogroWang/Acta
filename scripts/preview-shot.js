// Temporary helper: renders src/index.html with demo data in headless Edge and captures the desktop preview.
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const puppeteer = require('puppeteer-core');

function findBrowser() {
  const candidates = [
    process.env.ACTA_BROWSER,
    process.platform === 'win32' && path.join(process.env['ProgramFiles(x86)'] || '', 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
    process.platform === 'win32' && path.join(process.env.ProgramFiles || '', 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
    process.platform === 'win32' && path.join(process.env.LOCALAPPDATA || '', 'Microsoft', 'Edge', 'Application', 'msedge.exe')
  ].filter(Boolean);
  const executable = candidates.find(candidate => fs.existsSync(candidate));
  if (!executable) throw new Error('No compatible browser found.');
  return executable;
}

async function main() {
  const browser = await puppeteer.launch({
    executablePath: findBrowser(),
    headless: true,
    userDataDir: fs.mkdtempSync(path.join(os.tmpdir(), 'acta-shot-')),
    pipe: true,
    timeout: 60000,
    protocolTimeout: 60000,
    args: ['--disable-gpu', '--no-first-run', '--no-default-browser-check', '--allow-file-access-from-files']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });
  await page.goto(pathToFileURL(path.join(__dirname, '..', 'src', 'index.html')).href, { waitUntil: 'load' });

  await page.evaluate(`(async () => {
    const waitFor = async predicate => {
      for (let attempt = 0; attempt < 120; attempt += 1) {
        if (predicate()) return true;
        await new Promise(resolve => setTimeout(resolve, 25));
      }
      return false;
    };
    await waitFor(() => typeof library !== 'undefined' && typeof normalizeLibrary === 'function' && typeof renderAll === 'function');

    const now = Date.now();
    const iso = offset => new Date(now - offset * 86400000).toISOString();
    const today = new Date();
    const dateWithOffset = days => {
      const date = new Date(today);
      date.setDate(date.getDate() + days);
      return date.toISOString().slice(0, 10);
    };

    library = normalizeLibrary({
      version: 1,
      folders: [
        { id:'ideas', name:'灵感收集', color:'#b68b54' },
        { id:'work', name:'工作计划', color:'#6f8a72' },
        { id:'life', name:'生活清单', color:'#a87876' },
        { id:'reading', name:'阅读摘记', color:'#7a7799' }
      ],
      items: [
        {
          id:'welcome-note', type:'note', folderId:'ideas', title:'欢迎来到 Acta',
          body:'<p>Acta 把<strong>笔记</strong>和<strong>待办</strong>放进同一份安静的行记数据。左侧用文件夹与智能视图整理主题,中间让所有内容自然汇聚,右侧专注于当下。</p><h2>记录,然后行动</h2><p>待办可以设置优先级、开始与截止时间,也能拆成子任务逐步推进;在周视图和日视图里,勾选完成就发生在当下。</p><h2>随身携带</h2><p>数据默认保存在本地,也可以通过 OneDrive 同步目录或 WebDAV 带到其他设备。</p>',
          linkedIds:['launch-plan'], createdAt:iso(0), updatedAt:iso(0)
        },
        {
          id:'launch-plan', type:'todo', folderId:'work', title:'整理 Acta 原型反馈',
          notes:'测试网盘目录上传与下载', due:dateWithOffset(0), dueTime:'09:30:00', durationMinutes:90, priority:'high',
          linkedIds:['welcome-note'],
          tasks:[
            { id:'t1', text:'收集内测反馈', done:true },
            { id:'t2', text:'归纳高频问题', done:true },
            { id:'t3', text:'排定修复顺序', done:false },
            { id:'t4', text:'更新路线图', done:false }
          ],
          completed:false, createdAt:iso(0), updatedAt:iso(0)
        },
        {
          id:'weekend-list', type:'todo', folderId:'life', title:'周末的小计划',
          notes:'去市场买一束花', due:dateWithOffset(2), priority:'low',
          linkedIds:[],
          tasks:[{ id:'t3', text:'散步四十分钟', done:false }],
          completed:false, createdAt:iso(1), updatedAt:iso(1)
        },
        {
          id:'attention-note', type:'note', folderId:'reading', title:'关于注意力的三条摘记',
          body:'<p>注意力不是一块需要填满的容器,而是一种主动的选择。把入口变窄,才能让重要的事更容易出现。</p>',
          linkedIds:['daily-review'], createdAt:iso(1), updatedAt:iso(1)
        },
        {
          id:'daily-review', type:'note', folderId:'ideas', title:'把每日回顾做得更轻',
          body:'<p>或许不需要复杂模板。每天只回答三个问题:今天完成了什么?什么值得记录?明天最重要的一步是什么?</p>',
          linkedIds:['attention-note'], createdAt:iso(3), updatedAt:iso(3)
        }
      ]
    });
    selectedId = 'welcome-note';
    currentView = 'inbox';
    currentFilter = 'all';
    renderAll();
  })()`);

  await page.evaluate(() => document.fonts.ready);
  await new Promise(resolve => setTimeout(resolve, 1500));
  await page.screenshot({ path: path.join(__dirname, '..', 'acta-preview.png') });
  await browser.close();
  console.log('saved acta-preview.png');
}

main().catch(error => { console.error(error); process.exit(1); });
