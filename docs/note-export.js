(() => {
  const dialog = document.getElementById('noteExportDialog');
  if (!dialog) return;

  const byId = id => document.getElementById(id);
  const formatInputs = [...dialog.querySelectorAll('input[name="noteExportFormat"]')];
  const pdfKindInputs = [...dialog.querySelectorAll('input[name="noteExportPdfKind"]')];
  const optionsPanels = [...dialog.querySelectorAll('[data-export-options]')];
  const preview = byId('noteExportPreview');
  const previewStage = byId('noteExportPreviewStage');
  const previewCaption = byId('noteExportPreviewCaption');
  const status = byId('noteExportStatus');
  const confirmButton = byId('confirmNoteExport');
  const { PDFDocument, rgb } = window.PDFLib || {};
  const fontFamilies = {
    system:'"Segoe UI Variable","PingFang SC","Microsoft YaHei",system-ui,sans-serif',
    serif:'Georgia,"Songti SC","STSong",serif',
    songti:'"Songti SC","STSong","SimSun",serif',
    sans:'"Segoe UI Variable","PingFang SC","Microsoft YaHei",sans-serif',
    mono:'ui-monospace,"SFMono-Regular",Consolas,"Microsoft YaHei",monospace'
  };
  const paperSizes = {
    a4:[595.28,841.89],
    a5:[419.53,595.28],
    letter:[612,792],
    legal:[612,1008]
  };

  // --- Export font (Noto Sans SC) cached in IndexedDB for text-type PDF ---
  const FONT_DB = 'acta-export';
  const FONT_STORE = 'fonts';
  const FONT_KEY = 'noto-sans-sc';
  const FONT_URL = 'https://cdn.jsdelivr.net/gh/notofonts/noto-cjk@main/Sans/SubsetOTF/SC/NotoSansSC-Regular.otf';
  const FONT_FACE_ID = 'acta-export-font-face';
  let fontState = 'unknown'; // 'unknown' | 'none' | 'downloading' | 'ready'
  let fontBytesCache = null;
  let fontBlobUrl = null;

  let activeItem = null;
  let backgroundImageData = '';
  let closeTimer = 0;
  let previewTimer = 0;

  const exportCopy = () => settings.language === 'en' ? {
    title:'Export note', subtitle:'Choose a file format and tune the output', close:'Close',
    ready:'Ready to export', working:'Generating export…', done:'Note exported', failed:'Export failed',
    start:'Start export', cancel:'Cancel', noBackground:'No image selected',
    fontNone:'Text PDF needs a ~10 MB Chinese font (first time only), then offline-ready.',
    fontDownloading:'Downloading export font…', fontReady:'Export font ready — text PDF works offline.',
    fontFailed:'Font download failed', fontDeleted:'Export font removed'
  } : settings.language === 'zh-Hant' ? {
    title:'匯出筆記', subtitle:'選擇檔案格式並調整匯出效果', close:'關閉',
    ready:'已準備匯出', working:'正在產生匯出檔案…', done:'筆記已匯出', failed:'匯出失敗',
    start:'開始匯出', cancel:'取消', noBackground:'未選擇',
    fontNone:'文字型 PDF 需下載約 10 MB 中文字體（僅首次），之後可離線匯出。',
    fontDownloading:'正在下載匯出字體…', fontReady:'匯出字體已就緒，可離線匯出文字型 PDF。',
    fontFailed:'字體下載失敗', fontDeleted:'已刪除匯出字體'
  } : {
    title:'导出笔记', subtitle:'选择文件格式并调整导出效果', close:'关闭',
    ready:'已准备导出', working:'正在生成导出文件…', done:'笔记已导出', failed:'导出失败',
    start:'开始导出', cancel:'取消', noBackground:'未选择',
    fontNone:'文字型 PDF 需下载约 10 MB 中文字体（仅首次），之后可离线导出。',
    fontDownloading:'正在下载导出字体…', fontReady:'导出字体已就绪，可离线导出文字型 PDF。',
    fontFailed:'字体下载失败', fontDeleted:'已删除导出字体'
  };

  function safeBaseName(title = '') {
    return portableFileName(title).replace(/\.md$/i, '');
  }

  function setStatus(message, error = false) {
    status.textContent = message;
    status.classList.toggle('error', error);
  }

  function closeDialog() {
    if (!dialog.open || dialog.classList.contains('is-closing')) return;
    clearTimeout(closeTimer);
    const finish = () => {
      clearTimeout(closeTimer);
      if (dialog.open) dialog.close();
      dialog.classList.remove('is-closing');
    };
    if (document.body.classList.contains('acta-reduce-motion') || matchMedia('(prefers-reduced-motion: reduce)').matches) finish();
    else {
      dialog.classList.add('is-closing');
      closeTimer = setTimeout(finish, 190);
    }
  }

  function activeFormat() {
    return formatInputs.find(input => input.checked)?.value || 'markdown';
  }

  function activePdfKind() {
    return pdfKindInputs.find(input => input.checked)?.value || 'image';
  }

  function setFieldShown(el, show) {
    if (!el) return;
    const wasHidden = el.hidden;
    el.hidden = !show;
    if (show && wasHidden) {
      el.classList.remove('field-entering'); void el.offsetWidth; el.classList.add('field-entering');
    } else if (!show) {
      el.classList.remove('field-entering');
    }
  }

  const RESOLUTION_WIDTHS = { '720p':1280, '1080p':1920, '2k':2560, '4k':3840 };
  function applyResolutionPreset() {
    const width = RESOLUTION_WIDTHS[byId('noteExportImageResolution').value];
    if (width) byId('noteExportImageWidth').value = width;
    updatePreview();
  }
  function syncResolutionFromWidth() {
    const width = String(byId('noteExportImageWidth').value);
    const match = Object.keys(RESOLUTION_WIDTHS).find(key => String(RESOLUTION_WIDTHS[key]) === width);
    byId('noteExportImageResolution').value = match || 'custom';
  }
  function updateImageFormatFields() {
    setFieldShown(byId('noteExportImageJpgQualityField'), byId('noteExportImageFormat').value === 'jpg');
    updatePreview();
  }

  let panelSwapTimer = 0;
  function syncOptionPanels() {
    const format = activeFormat();
    const target = optionsPanels.find(panel => panel.dataset.exportOptions === format);
    clearTimeout(panelSwapTimer);
    if (target && !target.hidden && !target.classList.contains('is-exiting')) {
      updateFontMgrUI(); updatePreview(); return;
    }
    if (target) target.classList.remove('is-exiting');
    optionsPanels.filter(panel => !panel.hidden && panel !== target).forEach(panel => panel.classList.add('is-exiting'));
    panelSwapTimer = setTimeout(() => optionsPanels.forEach(panel => {
      if (panel.classList.contains('is-exiting')) { panel.hidden = true; panel.classList.remove('is-exiting'); }
    }), 170);
    if (target) {
      target.hidden = false;
      target.classList.remove('is-entering'); void target.offsetWidth; target.classList.add('is-entering');
    }
    updateFontMgrUI();
    updatePreview();
  }

  function currentThemeColors() {
    const style = getComputedStyle(document.documentElement);
    return {
      background:style.getPropertyValue('--paper').trim() || '#fbfaf6',
      text:style.getPropertyValue('--ink').trim() || '#242823'
    };
  }

  function hexLuma(hex) {
    const match = /^#([\da-f]{6})$/i.exec(hex);
    if (!match) return 245;
    const value = Number.parseInt(match[1], 16);
    const r = value >> 16;
    const g = value >> 8 & 255;
    const b = value & 255;
    return r * .2126 + g * .7152 + b * .0722;
  }

  function imageTheme() {
    const theme = byId('noteExportImageTheme').value;
    if (theme === 'current') return currentThemeColors();
    if (theme === 'night') return { background:'#151713', text:'#eef1ea' };
    if (theme === 'sepia') return { background:'#f3ead7', text:'#3e3529' };
    if (theme === 'paper') return { background:'#fbfaf6', text:'#242823' };
    const background = byId('noteExportImageBackground').value;
    const text = byId('noteExportImageText').value;
    return { background, text: /^#[\da-f]{6}$/i.test(text) ? text : (hexLuma(background) < 128 ? '#f3f5ef' : '#242823') };
  }

  // --- Font cache (IndexedDB) ---
  function idbGet(key) {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(FONT_DB, 1);
      req.onupgradeneeded = () => req.result.createObjectStore(FONT_STORE);
      req.onsuccess = () => {
        const db = req.result;
        const tx = db.transaction(FONT_STORE, 'readonly');
        const get = tx.objectStore(FONT_STORE).get(key);
        get.onsuccess = () => resolve(get.result);
        get.onerror = () => reject(get.error);
        db.close();
      };
      req.onerror = () => reject(req.error);
    });
  }
  function idbSet(key, value) {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(FONT_DB, 1);
      req.onupgradeneeded = () => req.result.createObjectStore(FONT_STORE);
      req.onsuccess = () => {
        const db = req.result;
        const tx = db.transaction(FONT_STORE, 'readwrite');
        const put = tx.objectStore(FONT_STORE).put(value, key);
        put.onsuccess = () => resolve();
        put.onerror = () => reject(put.error);
        db.close();
      };
      req.onerror = () => reject(req.error);
    });
  }
  function idbDelete(key) {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(FONT_DB, 1);
      req.onupgradeneeded = () => req.result.createObjectStore(FONT_STORE);
      req.onsuccess = () => {
        const db = req.result;
        const tx = db.transaction(FONT_STORE, 'readwrite');
        const del = tx.objectStore(FONT_STORE).delete(key);
        del.onsuccess = () => resolve();
        del.onerror = () => reject(del.error);
        db.close();
      };
      req.onerror = () => reject(req.error);
    });
  }

  function registerFontFace(bytes) {
    if (fontBlobUrl) return;
    try {
      fontBlobUrl = URL.createObjectURL(new Blob([bytes], { type:'font/otf' }));
      const style = document.createElement('style');
      style.id = FONT_FACE_ID;
      style.textContent = `@font-face{font-family:'Acta Export CJK';src:url("${fontBlobUrl}") format("opentype");font-display:block;}`;
      document.head.appendChild(style);
    } catch (err) { /* ignore */ }
  }

  function unregisterFontFace() {
    if (fontBlobUrl) { URL.revokeObjectURL(fontBlobUrl); fontBlobUrl = null; }
    document.getElementById(FONT_FACE_ID)?.remove();
  }

  async function initFontState() {
    try {
      const bytes = await idbGet(FONT_KEY);
      if (bytes) { fontBytesCache = bytes; fontState = 'ready'; registerFontFace(bytes); }
      else fontState = 'none';
    } catch (err) { fontState = 'none'; }
    updateFontMgrUI();
  }

  async function downloadFont() {
    if (fontState === 'downloading' || fontState === 'ready') return;
    fontState = 'downloading';
    updateFontMgrUI();
    setStatus(exportCopy().fontDownloading);
    try {
      const response = await fetch(FONT_URL);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      let bytes;
      if (response.body && typeof response.body.getReader === 'function') {
        const total = Number(response.headers.get('content-length')) || 0;
        const reader = response.body.getReader();
        const chunks = [];
        let received = 0;
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          chunks.push(value);
          received += value.length;
          if (total) setStatus(`${exportCopy().fontDownloading} ${Math.min(99, Math.round(received / total * 100))}%`);
        }
        bytes = new Uint8Array(received);
        let offset = 0;
        for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
      } else {
        bytes = new Uint8Array(await response.arrayBuffer());
      }
      await idbSet(FONT_KEY, bytes);
      fontBytesCache = bytes;
      fontState = 'ready';
      registerFontFace(bytes);
      setStatus(exportCopy().fontReady);
    } catch (err) {
      fontState = 'none';
      setStatus(`${exportCopy().fontFailed}: ${err?.message || err}`, true);
      throw err;
    } finally {
      updateFontMgrUI();
      updatePreview();
    }
  }

  async function deleteFont() {
    try { await idbDelete(FONT_KEY); } catch (err) { /* ignore */ }
    fontBytesCache = null;
    fontState = 'none';
    unregisterFontFace();
    updateFontMgrUI();
    updatePreview();
    setStatus(exportCopy().fontDeleted);
  }

  function updateFontMgrUI() {
    const mgr = byId('noteExportPdfFontMgr');
    if (!mgr) return;
    const copy = exportCopy();
    mgr.hidden = !(activeFormat() === 'pdf' && activePdfKind() === 'text');
    byId('noteExportPdfFontStatus').textContent =
      fontState === 'ready' ? copy.fontReady : fontState === 'downloading' ? copy.fontDownloading : copy.fontNone;
    byId('noteExportPdfFontDownload').hidden = fontState !== 'none';
    byId('noteExportPdfFontDelete').hidden = fontState !== 'ready';
  }

  function applyCopy() {
    const copy = exportCopy();
    byId('noteExportTitle').textContent = copy.title;
    byId('noteExportSubtitle').textContent = copy.subtitle;
    byId('closeNoteExport').setAttribute('aria-label', copy.close);
    byId('cancelNoteExport').textContent = copy.cancel;
    confirmButton.querySelector('span').textContent = copy.start;
    setStatus(copy.ready);
  }

  function openDialog(item) {
    if (!item || item.type !== 'note') return;
    activeItem = item;
    backgroundImageData = '';
    byId('noteExportImageBackgroundFile').value = '';
    byId('noteExportBackgroundName').textContent = exportCopy().noBackground;
    dialog.classList.remove('is-closing');
    applyCopy();
    syncOptionPanels();
    updateImageLayoutFields();
    updateThemeFields();
    syncResolutionFromWidth();
    updateImageFormatFields();
    if (!dialog.open) dialog.showModal();
    requestAnimationFrame(() => formatInputs.find(input => input.checked)?.focus());
  }

  function textBlocks(item) {
    const root = document.createElement('div');
    root.innerHTML = item.body || '';
    const blocks = [];
    const cleanText = node => {
      const clone = node.cloneNode(true);
      clone.querySelectorAll('.markdown-task-box').forEach(box => box.remove());
      return clone.textContent.replace(/\s+/g, ' ').trim();
    };
    [...root.children].forEach(node => {
      const tag = node.tagName.toLowerCase();
      if (/^h[1-3]$/.test(tag)) blocks.push({ type:'heading', level:Number(tag[1]), text:cleanText(node) });
      else if (tag === 'blockquote') blocks.push({ type:'quote', text:cleanText(node) });
      else if (tag === 'pre') blocks.push({ type:'code', text:node.textContent.trimEnd() });
      else if (tag === 'hr') blocks.push({ type:'rule', text:'' });
      else if (tag === 'ul' || tag === 'ol') {
        [...node.children].forEach((li, index) => blocks.push({ type:'list', text:`${tag === 'ol' ? `${index + 1}.` : '•'} ${cleanText(li)}` }));
      } else {
        const text = cleanText(node);
        if (text) blocks.push({ type:'paragraph', text });
      }
    });
    if (!blocks.length) {
      const text = stripHTML(item.body || '').trim();
      if (text) blocks.push({ type:'paragraph', text });
    }
    return blocks;
  }

  function canvasFont(ctx, size, family, weight = 400, italic = false) {
    ctx.font = `${italic ? 'italic ' : ''}${weight} ${size}px ${family}`;
  }

  // --- Measurer abstraction so the same layout works for canvas pixels and PDF text ---
  function canvasMeasurer(ctx) {
    let sig = '';
    return {
      widthOf(text, size, family, weight, italic) {
        const s = `${weight} ${size}px ${family}`;
        if (s !== sig) { ctx.font = `${italic ? 'italic ' : ''}${s}`; sig = s; }
        return ctx.measureText(text).width;
      }
    };
  }
  function fontMeasurer(font) {
    return { widthOf: (text, size) => font.widthOfTextAtSize(text, size) };
  }

  function wrapText(measurer, text, maxWidth, spacing, size, family, weight, italic) {
    const lines = [];
    String(text).split(/\r?\n/).forEach(rawLine => {
      if (!rawLine) { lines.push(''); return; }
      let line = '';
      for (const character of [...rawLine]) {
        const candidate = line + character;
        const width = measurer.widthOf(candidate, size, family, weight, italic) + Math.max(0, [...candidate].length - 1) * spacing;
        if (line && width > maxWidth) { lines.push(line.trimEnd()); line = character.trimStart(); }
        else line = candidate;
      }
      lines.push(line);
    });
    return lines;
  }

  function drawSpacedText(ctx, text, x, y, spacing) {
    if (!spacing) { ctx.fillText(text, x, y); return; }
    let cursor = x;
    [...text].forEach(character => {
      ctx.fillText(character, cursor, y);
      cursor += ctx.measureText(character).width + spacing;
    });
  }

  function layoutLines(item, config, measurer) {
    const { width, margin, baseSize, lineHeight, letterSpacing, fontFamily, showTitle, showDate } = config;
    const maxWidth = width - margin * 2;
    const lines = [];
    const addText = (text, style = {}) => {
      const size = style.size || baseSize;
      const family = style.family || fontFamily;
      const weight = style.weight || 400;
      wrapText(measurer, text, maxWidth - (style.indent || 0), letterSpacing, size, family, weight, style.italic).forEach(line => {
        lines.push({ text:line, size, family, weight, italic:style.italic, indent:style.indent || 0, color:style.color, height:size * (style.lineHeight || lineHeight), gapAfter:0, rule:false });
      });
      if (lines.length) lines.at(-1).gapAfter = style.gapAfter ?? baseSize * .65;
    };
    if (showTitle) addText(item.title || t('untitledNote'), { size:baseSize * 2.05, weight:760, lineHeight:1.2, gapAfter:baseSize * .75 });
    if (showDate) addText(`${t('modified')} ${formatDateTimeSeconds(item.updatedAt)}`, { size:baseSize * .66, color:config.mutedColor, lineHeight:1.25, gapAfter:baseSize * 1.35 });
    textBlocks(item).forEach(block => {
      if (block.type === 'rule') {
        lines.push({ rule:true, height:baseSize * .9, gapAfter:baseSize * .9 });
        return;
      }
      if (block.type === 'heading') {
        const factor = block.level === 1 ? 1.62 : block.level === 2 ? 1.4 : 1.2;
        addText(block.text, { size:baseSize * factor, weight:720, lineHeight:1.35, gapAfter:baseSize * .75 });
      } else if (block.type === 'quote') addText(`│ ${block.text}`, { indent:baseSize * .35, italic:true, color:config.mutedColor, gapAfter:baseSize * .72 });
      else if (block.type === 'code') addText(block.text, { family:fontFamilies.mono, size:baseSize * .82, indent:baseSize * .4, lineHeight:1.55, gapAfter:baseSize * .8 });
      else if (block.type === 'list') addText(block.text, { indent:baseSize * .35, gapAfter:baseSize * .28 });
      else addText(block.text, { gapAfter:baseSize * .72 });
    });
    return lines;
  }

  function paginateLines(lines, config) {
    const pages = [];
    let page = [];
    let y = config.margin;
    for (const line of lines) {
      const totalHeight = line.height + line.gapAfter;
      if (page.length && y + totalHeight > config.height - config.margin) {
        pages.push(page); page = []; y = config.margin;
      }
      page.push({ line, y });
      y += totalHeight;
    }
    if (page.length) pages.push(page);
    return pages;
  }

  async function loadBackgroundImage() {
    if (!backgroundImageData) return null;
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error('无法读取背景图片'));
      image.src = backgroundImageData;
    });
  }

  function drawBackground(ctx, canvas, config, backgroundImage) {
    ctx.fillStyle = config.background;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    if (backgroundImage) {
      const scale = Math.max(canvas.width / backgroundImage.width, canvas.height / backgroundImage.height);
      const width = backgroundImage.width * scale;
      const height = backgroundImage.height * scale;
      ctx.drawImage(backgroundImage, (canvas.width - width) / 2, (canvas.height - height) / 2, width, height);
      ctx.save();
      ctx.globalAlpha = config.overlay;
      ctx.fillStyle = config.background;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.restore();
    }
  }

  function drawWatermark(ctx, canvas, config) {
    if (!config.watermark) return;
    ctx.save();
    ctx.globalAlpha = config.watermarkOpacity;
    ctx.fillStyle = config.textColor;
    canvasFont(ctx, Math.max(16, config.baseSize * .72), config.fontFamily, 700);
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate(-Math.PI / 7);
    const stepX = Math.max(260, ctx.measureText(config.watermark).width + 180);
    const stepY = Math.max(180, config.baseSize * 7);
    for (let y = -canvas.height; y <= canvas.height; y += stepY) {
      for (let x = -canvas.width; x <= canvas.width; x += stepX) ctx.fillText(config.watermark, x, y);
    }
    ctx.restore();
  }

  function drawLines(ctx, canvas, config, lines, startIndex, backgroundImage) {
    drawBackground(ctx, canvas, config, backgroundImage);
    drawWatermark(ctx, canvas, config);
    let y = config.margin;
    let index = startIndex;
    ctx.textBaseline = 'top';
    while (index < lines.length) {
      const line = lines[index];
      const totalHeight = line.height + line.gapAfter;
      if (y + totalHeight > canvas.height - config.margin && index > startIndex) break;
      if (line.rule) {
        ctx.strokeStyle = config.mutedColor;
        ctx.globalAlpha = .35;
        ctx.beginPath();
        ctx.moveTo(config.margin, y + line.height / 2);
        ctx.lineTo(canvas.width - config.margin, y + line.height / 2);
        ctx.stroke();
        ctx.globalAlpha = 1;
      } else {
        ctx.fillStyle = line.color || config.textColor;
        canvasFont(ctx, line.size, line.family, line.weight, line.italic);
        drawSpacedText(ctx, line.text, config.margin + line.indent, y, config.letterSpacing);
      }
      y += totalHeight;
      index += 1;
    }
    return index;
  }

  function imageConfig() {
    const width = Math.max(640, Math.min(3840, Number(byId('noteExportImageWidth').value) || 1080));
    const layout = byId('noteExportImageLayout').value;
    const ratio = byId('noteExportImageRatio').value;
    let height = 0;
    if (layout === 'pages') {
      if (ratio === 'custom') height = Math.max(640, Math.min(6000, Number(byId('noteExportImageHeight').value) || 1440));
      else if (ratio === '4:5') height = Math.min(6000, width * 5 / 4);
      else if (ratio === '9:16') height = Math.min(6000, width * 16 / 9);
      else if (ratio === 'a4') height = Math.min(6000, width * 1.4142);
      else height = Math.min(6000, width * 4 / 3);
    }
    const theme = imageTheme();
    return {
      kind:'image', layout, width:Math.round(width), height:Math.round(height),
      margin:Math.round(width * .085), baseSize:Number(byId('noteExportImageFontSize').value) || 24,
      lineHeight:Number(byId('noteExportImageLineHeight').value) || 1.8,
      letterSpacing:Number(byId('noteExportImageLetterSpacing').value) || 0,
      fontFamily:fontFamilies[byId('noteExportImageFont').value] || fontFamilies.system,
      background:theme.background, textColor:theme.text,
      mutedColor:hexLuma(theme.background) < 128 ? 'rgba(238,241,234,.62)' : 'rgba(36,40,35,.58)',
      overlay:Number(byId('noteExportImageOverlay').value) / 100,
      watermark:byId('noteExportImageWatermark').value.trim(),
      watermarkOpacity:Number(byId('noteExportImageWatermarkOpacity').value) / 100,
      showTitle:byId('noteExportImageTitle').checked,
      showDate:byId('noteExportImageDate').checked
    };
  }

  function pdfConfig() {
    const orientation = byId('noteExportPdfOrientation').value;
    let points = [...(paperSizes[byId('noteExportPdfPaper').value] || paperSizes.a4)];
    if (orientation === 'landscape') points.reverse();
    const scale = 1.6;
    const preset = byId('noteExportPdfMarginPreset').value;
    const marginMm = preset === 'custom' ? Number(byId('noteExportPdfMargin').value) || 20 : Number(preset);
    return {
      kind:'pdf', layout:'pages', width:Math.round(points[0] * scale), height:Math.round(points[1] * scale),
      pagePoints:points, margin:Math.round(marginMm / 25.4 * 72 * scale),
      baseSize:(Number(byId('noteExportPdfFontSize').value) || 14) * scale,
      lineHeight:1.65, letterSpacing:0, fontFamily:fontFamilies.system,
      background:'#ffffff', textColor:'#20231f', mutedColor:'rgba(32,35,31,.56)', overlay:0,
      watermark:'', watermarkOpacity:0,
      showTitle:byId('noteExportPdfTitle').checked, showDate:byId('noteExportPdfDate').checked
    };
  }

  function textPdfConfig() {
    const orientation = byId('noteExportPdfOrientation').value;
    let points = [...(paperSizes[byId('noteExportPdfPaper').value] || paperSizes.a4)];
    if (orientation === 'landscape') points.reverse();
    const preset = byId('noteExportPdfMarginPreset').value;
    const marginMm = preset === 'custom' ? Number(byId('noteExportPdfMargin').value) || 20 : Number(preset);
    return {
      kind:'text-pdf', layout:'pages', width:points[0], height:points[1],
      pagePoints:points, margin:Math.round(marginMm / 25.4 * 72),
      baseSize:Number(byId('noteExportPdfFontSize').value) || 14,
      lineHeight:1.65, letterSpacing:0, fontFamily:'"Acta Export CJK"',
      background:'#ffffff', textColor:'#20231f', mutedColor:'rgba(32,35,31,.56)',
      showTitle:byId('noteExportPdfTitle').checked, showDate:byId('noteExportPdfDate').checked
    };
  }

  async function renderCanvases(item, config) {
    const measureCanvas = document.createElement('canvas');
    const measure = measureCanvas.getContext('2d');
    const lines = layoutLines(item, config, canvasMeasurer(measure));
    if (config.layout === 'long') {
      const total = lines.reduce((sum, line) => sum + line.height + line.gapAfter, 0) + config.margin * 2;
      config.height = Math.max(Math.round(config.width * .7), Math.min(30000, Math.ceil(total)));
    }
    const backgroundImage = config.kind === 'image' ? await loadBackgroundImage() : null;
    const canvases = [];
    let index = 0;
    do {
      const canvas = document.createElement('canvas');
      canvas.width = config.width;
      canvas.height = config.height;
      const context = canvas.getContext('2d');
      const next = drawLines(context, canvas, config, lines, index, backgroundImage);
      canvases.push(canvas);
      if (next <= index) break;
      index = next;
    } while (index < lines.length);
    return canvases;
  }

  function dataUrlBytes(dataUrl) {
    const binary = atob(dataUrl.split(',')[1] || '');
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
    return bytes;
  }

  function concatBytes(parts) {
    const length = parts.reduce((sum, part) => sum + part.length, 0);
    const output = new Uint8Array(length);
    let offset = 0;
    parts.forEach(part => { output.set(part, offset); offset += part.length; });
    return output;
  }

  function ascii(value) {
    return new TextEncoder().encode(value);
  }

  function buildPdf(canvases, pagePoints) {
    const parts = [new Uint8Array([37,80,68,70,45,49,46,52,10,37,226,227,207,211,10])];
    const offsets = [];
    let length = parts[0].length;
    const add = part => { parts.push(part); length += part.length; };
    const addObject = (number, objectParts) => {
      offsets[number] = length;
      add(ascii(`${number} 0 obj\n`));
      objectParts.forEach(add);
      add(ascii('\nendobj\n'));
    };
    const kids = canvases.map((_, index) => `${3 + index * 3} 0 R`).join(' ');
    addObject(1, [ascii('<< /Type /Catalog /Pages 2 0 R >>')]);
    addObject(2, [ascii(`<< /Type /Pages /Count ${canvases.length} /Kids [${kids}] >>`)]);
    canvases.forEach((canvas, index) => {
      const page = 3 + index * 3;
      const content = page + 1;
      const image = page + 2;
      const command = `q\n${pagePoints[0]} 0 0 ${pagePoints[1]} 0 0 cm\n/Im0 Do\nQ`;
      const jpeg = dataUrlBytes(canvas.toDataURL('image/jpeg', .94));
      addObject(page, [ascii(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pagePoints[0]} ${pagePoints[1]}] /Resources << /XObject << /Im0 ${image} 0 R >> >> /Contents ${content} 0 R >>`)]);
      addObject(content, [ascii(`<< /Length ${ascii(command).length} >>\nstream\n${command}\nendstream`)]);
      addObject(image, [ascii(`<< /Type /XObject /Subtype /Image /Width ${canvas.width} /Height ${canvas.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpeg.length} >>\nstream\n`), jpeg, ascii('\nendstream')]);
    });
    const xrefOffset = length;
    add(ascii(`xref\n0 ${offsets.length}\n0000000000 65535 f \n`));
    for (let number = 1; number < offsets.length; number += 1) add(ascii(`${String(offsets[number]).padStart(10, '0')} 00000 n \n`));
    add(ascii(`trailer\n<< /Size ${offsets.length} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`));
    return concatBytes(parts);
  }

  function colorToRgb01(value, background) {
    const str = String(value || '').trim();
    const hex = /^#([\da-f]{6})$/i.exec(str);
    if (hex) {
      const n = parseInt(hex[1], 16);
      return [(n >> 16) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
    }
    const m = /^rgba?\(\s*([\d.]+)\s*[, ]\s*([\d.]+)\s*[, ]\s*([\d.]+)\s*(?:[, /]\s*([\d.]+)\s*)?\)$/i.exec(str);
    if (m) {
      let r = +m[1], g = +m[2], b = +m[3], a = m[4] !== undefined ? +m[4] : 1;
      if (a < 1) {
        const bg = colorToRgb01(background, '#ffffff');
        r = r * a + bg[0] * 255 * (1 - a);
        g = g * a + bg[1] * 255 * (1 - a);
        b = b * a + bg[2] * 255 * (1 - a);
      }
      return [r / 255, g / 255, b / 255];
    }
    return [0, 0, 0];
  }

  async function buildTextPdf(item, config, fontBytes) {
    if (!PDFDocument || !rgb) throw new Error('PDF 引擎未加载');
    if (!window.fontkit) throw new Error('字体引擎未加载');
    const pdf = await PDFDocument.create();
    pdf.registerFontkit(window.fontkit);
    const font = await pdf.embedFont(fontBytes || fontBytesCache, { subset: true });
    const lines = layoutLines(item, config, fontMeasurer(font));
    const pages = paginateLines(lines, config);
    const textColor = colorToRgb01(config.textColor, config.background);
    const mutedColor = colorToRgb01(config.mutedColor, config.background);
    for (const pageLines of pages) {
      const page = pdf.addPage(config.pagePoints);
      for (const { line, y } of pageLines) {
        if (line.rule) {
          page.drawLine({
            start:{ x:config.margin, y:config.height - (y + line.height / 2) },
            end:{ x:config.width - config.margin, y:config.height - (y + line.height / 2) },
            thickness:1, color:rgb(mutedColor[0], mutedColor[1], mutedColor[2]), opacity:.35
          });
        } else {
          const ascent = font.heightAtSize(line.size, { descender:false });
          const c = line.color ? colorToRgb01(line.color, config.background) : textColor;
          page.drawText(line.text, {
            x:config.margin + line.indent,
            y:config.height - (y + ascent),
            size:line.size, font,
            color:rgb(c[0], c[1], c[2])
          });
        }
      }
    }
    return pdf.save();
  }

  function bytesToDataUrl(bytes, mimeType) {
    let binary = '';
    for (let offset = 0; offset < bytes.length; offset += 32768) binary += String.fromCharCode(...bytes.subarray(offset, offset + 32768));
    return `data:${mimeType};base64,${btoa(binary)}`;
  }

  function dataUrlBlob(dataUrl) {
    const [header] = dataUrl.split(',');
    const type = /data:([^;]+)/.exec(header)?.[1] || 'application/octet-stream';
    return new Blob([dataUrlBytes(dataUrl)], { type });
  }

  async function saveAssets(assets) {
    if (window.actaDesktop?.exportAssets) return window.actaDesktop.exportAssets(assets);
    const nativeExport = window.Capacitor?.Plugins?.ActaSync?.exportAsset;
    if (nativeExport) {
      const results = [];
      for (const asset of assets) results.push(await nativeExport(asset));
      return results;
    }
    assets.forEach((asset, index) => {
      const url = URL.createObjectURL(dataUrlBlob(asset.dataUrl));
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

  async function performExport() {
    if (!activeItem || confirmButton.disabled) return;
    const copy = exportCopy();
    confirmButton.disabled = true;
    confirmButton.setAttribute('aria-busy', 'true');
    setStatus(copy.working);
    try {
      const format = activeFormat();
      const baseName = safeBaseName(activeItem.title);
      let result;
      if (format === 'markdown') {
        result = await getNoteFileBridge().exportNote(`${baseName}.md`, buildNoteMarkdown(activeItem));
      } else if (format === 'pdf') {
        if (activePdfKind() === 'text') {
          if (fontState !== 'ready') await downloadFont();
          const config = textPdfConfig();
          const pdfBytes = await buildTextPdf(activeItem, config, fontBytesCache);
          result = await saveAssets([{ fileName:`${baseName}.pdf`, mimeType:'application/pdf', dataUrl:bytesToDataUrl(pdfBytes, 'application/pdf') }]);
        } else {
          const config = pdfConfig();
          const canvases = await renderCanvases(activeItem, config);
          const pdf = buildPdf(canvases, config.pagePoints);
          result = await saveAssets([{ fileName:`${baseName}.pdf`, mimeType:'application/pdf', dataUrl:bytesToDataUrl(pdf, 'application/pdf') }]);
        }
      } else {
        const config = imageConfig();
        const canvases = await renderCanvases(activeItem, config);
        const numbered = canvases.length > 1;
        const imageFormat = byId('noteExportImageFormat').value;
        const ext = imageFormat === 'jpg' ? 'jpg' : 'png';
        const mimeType = imageFormat === 'jpg' ? 'image/jpeg' : 'image/png';
        const quality = (Number(byId('noteExportImageJpgQuality').value) || 85) / 100;
        const assets = canvases.map((canvas, index) => ({
          fileName:`${baseName}${numbered ? `-${String(index + 1).padStart(2, '0')}` : ''}.${ext}`,
          mimeType,
          dataUrl: imageFormat === 'jpg' ? canvas.toDataURL('image/jpeg', quality) : canvas.toDataURL('image/png')
        }));
        result = await saveAssets(assets);
      }
      if (result) {
        setStatus(copy.done);
        showToast(copy.done);
        setTimeout(closeDialog, 360);
      } else setStatus(copy.ready);
    } catch (error) {
      setStatus(`${copy.failed}: ${error?.message || t('invalidNoteFile')}`, true);
      showToast(`${copy.failed}: ${error?.message || t('invalidNoteFile')}`);
    } finally {
      confirmButton.disabled = false;
      confirmButton.removeAttribute('aria-busy');
    }
  }

  // --- Preview: render the actual output so it matches the final file ---
  function updatePreview() {
    clearTimeout(previewTimer);
    previewTimer = setTimeout(renderPreview, 160);
  }

  function resetPreviewInlineStyles() {
    preview.style.backgroundColor = '';
    preview.style.color = '';
    preview.style.fontFamily = '';
    preview.style.backgroundImage = '';
    preview.style.transform = '';
    preview.style.setProperty('--export-preview-overlay', '');
    preview.style.setProperty('--export-preview-overlay-opacity', '');
  }

  async function renderPreview() {
    if (!activeItem) return;
    const format = activeFormat();
    await new Promise(resolve => requestAnimationFrame(resolve));
    try {
      if (format === 'markdown') await renderMarkdownPreview();
      else if (format === 'pdf' && activePdfKind() === 'text') await renderTextPreview();
      else await renderImagePreview();
    } catch (err) {
      resetPreviewInlineStyles();
      previewStage.className = 'note-export-preview-stage';
      previewStage.innerHTML = '<p class="note-export-preview-empty">预览不可用</p>';
      previewCaption.hidden = true;
    }
  }

  async function renderImagePreview() {
    resetPreviewInlineStyles();
    previewStage.className = 'note-export-preview-stage is-image';
    previewStage.innerHTML = '';
    const config = activeFormat() === 'pdf' ? pdfConfig() : imageConfig();
    const canvases = await renderCanvases(activeItem, config);
    canvases.forEach(canvas => {
      const wrap = document.createElement('div');
      wrap.className = 'note-export-preview-page';
      const img = document.createElement('img');
      img.src = canvas.toDataURL('image/jpeg', .9);
      img.alt = '';
      wrap.style.aspectRatio = `${canvas.width} / ${canvas.height}`;
      wrap.append(img);
      previewStage.append(wrap);
    });
    previewCaption.hidden = canvases.length <= 1;
    previewCaption.textContent = canvases.length > 1 ? `共 ${canvases.length} 页` : '';
  }

  async function renderTextPreview() {
    resetPreviewInlineStyles();
    previewStage.className = 'note-export-preview-stage is-text';
    previewStage.innerHTML = '';
    const config = textPdfConfig();
    const previewFont = fontState === 'ready' ? '"Acta Export CJK", sans-serif' : fontFamilies.system;
    const measureFamily = fontState === 'ready' ? '"Acta Export CJK"' : fontFamilies.system;
    if (fontState === 'ready') {
      try { await document.fonts.load(`${config.baseSize}px "Acta Export CJK"`); } catch (err) { /* ignore */ }
    }
    const measureCtx = document.createElement('canvas').getContext('2d');
    const lines = layoutLines(activeItem, { ...config, fontFamily:measureFamily }, canvasMeasurer(measureCtx));
    const pages = paginateLines(lines, config);
    const scale = (previewStage.clientWidth || 320) / config.width;
    pages.forEach(pageLines => {
      const pageEl = document.createElement('div');
      pageEl.className = 'note-export-preview-page is-text';
      pageEl.style.aspectRatio = `${config.width} / ${config.height}`;
      pageEl.style.padding = `${config.margin * scale}px`;
      pageEl.style.background = config.background;
      pageEl.style.color = config.textColor;
      pageEl.style.fontFamily = previewFont;
      pageLines.forEach(({ line }) => {
        if (line.rule) { pageEl.append(Object.assign(document.createElement('hr'), { className:'preview-rule' })); return; }
        const el = document.createElement('div');
        el.className = 'preview-line';
        el.textContent = line.text;
        el.style.fontSize = `${line.size * scale}px`;
        el.style.lineHeight = `${line.height * scale}px`;
        el.style.marginBottom = `${line.gapAfter * scale}px`;
        el.style.paddingLeft = line.indent ? `${line.indent * scale}px` : '';
        el.style.fontStyle = line.italic ? 'italic' : '';
        if (line.color) el.style.color = line.color;
        pageEl.append(el);
      });
      previewStage.append(pageEl);
    });
    previewCaption.hidden = pages.length <= 1;
    previewCaption.textContent = pages.length > 1 ? `共 ${pages.length} 页` : (fontState !== 'ready' ? '下载字体后预览即为最终效果' : '');
  }

  function renderMarkdownPreview() {
    resetPreviewInlineStyles();
    previewStage.className = 'note-export-preview-stage is-markdown';
    previewStage.innerHTML = '';
    const markdown = buildNoteMarkdown(activeItem);
    const pageEl = document.createElement('div');
    pageEl.className = 'note-export-preview-page is-markdown';
    const split = /^---\n([\s\S]*?)\n---\n?([\s\S]*)$/.exec(markdown);
    if (split) {
      const front = document.createElement('pre');
      front.className = 'preview-md-frontmatter';
      front.textContent = `---\n${split[1]}\n---`;
      const body = document.createElement('pre');
      body.className = 'preview-md-body';
      body.textContent = split[2].replace(/^\n+/, '');
      pageEl.append(front, body);
    } else {
      const body = document.createElement('pre');
      body.className = 'preview-md-body';
      body.textContent = markdown;
      pageEl.append(body);
    }
    previewStage.append(pageEl);
    previewCaption.hidden = true;
  }

  function updateImageLayoutFields() {
    const pages = byId('noteExportImageLayout').value === 'pages';
    const custom = pages && byId('noteExportImageRatio').value === 'custom';
    setFieldShown(byId('noteExportImageRatioField'), pages);
    setFieldShown(byId('noteExportImageHeightField'), custom);
    updatePreview();
  }

  function updateThemeFields() {
    const theme = byId('noteExportImageTheme').value;
    const isCustom = theme === 'custom';
    setFieldShown(byId('noteExportImageBackgroundField'), isCustom);
    setFieldShown(byId('noteExportImageTextField'), isCustom);
    if (!isCustom) {
      const colors = imageTheme();
      if (/^#[\da-f]{6}$/i.test(colors.background)) byId('noteExportImageBackground').value = colors.background;
      if (/^#[\da-f]{6}$/i.test(colors.text)) byId('noteExportImageText').value = colors.text;
    }
    updatePreview();
  }

  formatInputs.forEach(input => input.addEventListener('change', syncOptionPanels));
  pdfKindInputs.forEach(input => input.addEventListener('change', () => { updateFontMgrUI(); updatePreview(); }));
  dialog.querySelectorAll('input,select').forEach(control => {
    if (control.name === 'noteExportFormat' || control.name === 'noteExportPdfKind' || control.type === 'file') return;
    control.addEventListener(control.type === 'range' || control.type === 'number' || control.type === 'text' || control.type === 'color' ? 'input' : 'change', () => {
      if (control.id === 'noteExportImageLayout' || control.id === 'noteExportImageRatio') updateImageLayoutFields();
      if (control.id === 'noteExportImageTheme') updateThemeFields();
      if (control.id === 'noteExportImageFormat') updateImageFormatFields();
      if (control.id === 'noteExportImageResolution') applyResolutionPreset();
      if (control.id === 'noteExportImageWidth') syncResolutionFromWidth();
      if (control.id === 'noteExportPdfMarginPreset') setFieldShown(byId('noteExportPdfCustomMarginField'), control.value === 'custom');
      byId('noteExportImageOverlayValue').textContent = `${byId('noteExportImageOverlay').value}%`;
      byId('noteExportImageWatermarkOpacityValue').textContent = `${byId('noteExportImageWatermarkOpacity').value}%`;
      const jpgValue = byId('noteExportImageJpgQualityValue');
      if (jpgValue) jpgValue.textContent = `${byId('noteExportImageJpgQuality').value}%`;
      updatePreview();
    });
  });
  byId('noteExportImageBackgroundFile').addEventListener('change', event => {
    const file = event.target.files?.[0];
    if (!file) {
      backgroundImageData = '';
      byId('noteExportBackgroundName').textContent = exportCopy().noBackground;
      updatePreview();
      return;
    }
    if (file.size > 12 * 1024 * 1024) {
      setStatus('背景图片不能超过 12 MB', true);
      event.target.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      backgroundImageData = String(reader.result || '');
      byId('noteExportBackgroundName').textContent = file.name;
      updatePreview();
    };
    reader.readAsDataURL(file);
  });
  byId('noteExportPdfFontDownload').addEventListener('click', () => { downloadFont().catch(() => {}); });
  byId('noteExportPdfFontDelete').addEventListener('click', deleteFont);
  byId('closeNoteExport').addEventListener('click', closeDialog);
  byId('cancelNoteExport').addEventListener('click', closeDialog);
  confirmButton.addEventListener('click', performExport);
  dialog.addEventListener('click', event => { if (event.target === dialog) closeDialog(); });
  dialog.addEventListener('cancel', event => { event.preventDefault(); closeDialog(); });

  initFontState();

  window.__actaNoteExportTest = {
    activeFormat, activePdfKind, pdfConfig, textPdfConfig, imageConfig,
    renderCanvases, buildPdf, buildTextPdf, layoutLines, paginateLines, fontState: () => fontState
  };
  exportNoteToFile = openDialog;
})();
