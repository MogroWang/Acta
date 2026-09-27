import { createApp } from 'vue';
import App from './App.vue';

// 更新向导模式：Rust 侧用 initialization_script 注入的标记在此分岔——
// 向导实例只渲染安装进度小窗，不挂载完整应用、不加载任何引导模块。
if ((window as unknown as Record<string, unknown>).__ACTA_UPDATER__) {
  await import('./legacy/updater-wizard');
} else {
  // Vue 同步渲染应用外壳；引导模块按元素 id 绑定节点，必须等挂载完成后再执行。
  createApp(App).mount('#app');

  // renderer.js 必须保持经典脚本加载：它顶层的 let/const/function 声明
  // （library、settings、$、renderAll 等）是页面与引导模块共用的全局绑定，
  // 转成 ES 模块后作用域会被封闭。文件本体原样放在 public/legacy/ 下。
  await new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = './legacy/renderer.js';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('无法加载 legacy/renderer.js'));
    document.body.appendChild(script);
  });

  await import('./boot');
}
