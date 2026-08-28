# Acta 项目：构建环境与核心文件分离方案

## 分析结论（现状）

**核心文件（git 已跟踪，保留原位，不动）**：
- `src/`（3.2MB，vanilla JS 应用本体）、`docs/`（3.2MB，GitHub Pages PWA 副本）
- `src-tauri/` 源码（Rust 后端）、`android/` 源码（Capacitor 8 工程，含 gradle wrapper）
- `scripts/`、`package.json`、`package-lock.json`、`capacitor.config.json`、`.cargo/config.toml`、`.gitignore`、`README.md`、`README_EN.md`、`LICENSE`、4 张预览图
- 共 216 个跟踪文件，`.git` 约 15MB，远程 `github.com/MogroWang/Acta.git`——git 层面分离已经完好

**多余文件（全部已被 .gitignore 排除，本次按下述分类处理）**：
| 类别 | 内容 | 大小 | 处理 |
|---|---|---|---|
| 过时垃圾 | `gradle-8.2.1-bin.zip`、`gradle-8.2.1-bin-mirror.zip`、`.gradle-dist/`、`.gradle-home/`、`android-sdk-tools.zip`、`dist/`、根目录旧 APK、空 `.agents/` | ~1.6GB | **暂不处理**（你的选择） |
| 活跃工具链 | `.android-sdk/`（唯一引用：`android/local.properties` 的 `sdk.dir`）；`.tooling/`（rustup 580M + cargo 469M + 便携 Node 100M，唯一引用：`build-tauri-windows.ps1`） | ~2.1GB | **迁至 `E:\ActaBuildTools`** |
| 发布产物 | `release/`（1.0.x~1.2.0 各平台成品） | 77MB | **移出归档至 `E:\ActaReleases`** |
| 可再生缓存 | `node_modules/`、`src-tauri/target/`、`android/.gradle/`、`android/**/build/` | ~1.9GB | 不动（惯例位置，git 已排除） |

**被埋没的核心文件**：`.tooling/build-tauri-windows.ps1` 是唯一的环境接线脚本，却因位于被 ignore 的 `.tooling/` 内而未入库——本次移入 `scripts/` 并提交。

预期效果：项目目录从约 5.5GB 瘦身至约 3.4GB（剩余主体是 `src-tauri/target` 1.7GB 与暂不处理的垃圾 1.6GB），换机器克隆后只需重装工具链即可构建，脚本不丢。

## 实施步骤

1. **预备**
   - `cd android && gradlew.bat --stop` 停掉 Gradle daemon，避免文件占用导致移动失败
   - 记录迁移前项目目录大小（`du -sh`）作为对比基线
   - `src-tauri/Cargo.toml` 有一处未提交修改——全程不碰它，后续 git 提交只 add 脚本文件

2. **迁移发布产物**
   - `mkdir E:\ActaReleases`，把 `release/` 全部内容移入，移除空目录

3. **迁移 Android SDK**
   - `mv .android-sdk E:\ActaBuildTools\android-sdk`（同盘移动，瞬时完成；目标名无冲突）
   - 修改 `android/local.properties`（机器本地文件，gitignored）：
     `sdk.dir=E:/ActaBuildTools/android-sdk`

4. **迁移 Rust/Node 工具链**
   - 先把 `.tooling/build-tauri-windows.ps1` 移出至 `scripts/`
   - `mv .tooling E:\ActaBuildTools\tooling`（整个目录整体搬迁，包括日志等杂项——全程零删除）

5. **参数化重写 `scripts/build-tauri-windows.ps1`**
   - 新增参数：`$ToolchainRoot`（默认 `E:\ActaBuildTools\tooling`，可用环境变量 `ACTA_TOOLCHAIN_ROOT` 覆盖）、`$VsDevCmd`（默认 `E:\ActaBuildTools\vs-buildtools\Common7\Tools\VsDevCmd.bat`，可用 `ACTA_VSDEVCMD` 覆盖）
   - `RUSTUP_HOME`/`CARGO_HOME` 改为基于 `$ToolchainRoot` 拼接；镜像等其余环境变量逻辑保持不变
   - 脚本从此与具体机器解耦，成为可入库的核心资产

6. **提交脚本**
   - `git add scripts/build-tauri-windows.ps1` 并单独提交（不包含 Cargo.toml 的未提交修改）
   - `.gitignore` 不需要改动：`.tooling/`、`release/` 等条目保留无害，且仍保护残留的垃圾 zip

7. **验证**
   - Android：`cd android && gradlew.bat assembleDebug` 全量构建，确认 SDK 迁移后端到端可用
   - 桌面端：设置新 `RUSTUP_HOME`/`CARGO_HOME` 后运行 `rustc --version` / `cargo --version` 确认工具链在新位置可启动（完整 Tauri 构建耗时较长，如你要求可再跑 `-Mode portable` 全量验证）

8. **汇报**：迁移前后项目目录大小对比、新目录清单（`E:\ActaBuildTools` 与 `E:\ActaReleases` 下各是什么）、遗留未动的垃圾清单

## 风险与回滚

- 全程**只移动、不删除**任何文件；回滚 = 把目录移回原位 + 还原 `local.properties` 和脚本两处路径引用
- `local.properties` 是 gitignored 的机器本地文件，改动不影响仓库
- 同盘（E: → E:）移动即使上 GB 也是改名操作，秒级完成
- 已知小风险：Android SDK 整体搬迁后极少数组件可能需要 gradle 重新解析缓存，`assembleDebug` 验证步骤会暴露并处理