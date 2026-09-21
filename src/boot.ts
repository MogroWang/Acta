// 引导顺序与原 index.html 末尾的脚本标签一致（renderer.js 由 main.ts 以
// 经典脚本单独加载）。每个模块都是 IIFE，公开面挂在 window 上，顺序不能打乱。
import './legacy/splash.js';
import './legacy/tauri-bridge.js';
import './legacy/note-export.js';
import './legacy/interface.js';
import './legacy/custom-select.js';
import './legacy/custom-datetime.js';
