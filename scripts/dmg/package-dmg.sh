#!/bin/bash
# ==============================================================
#  将 .app 与「启动修复」脚本、损坏修复说明一起打成 dmg。
#
#  Tauri 自带的 dmg 打包无法塞入额外文件，这里改为：
#  只让 Tauri 产出 .app，再用 hdiutil 把
#     <应用>.app + Applications 软链 + 修复脚本 + 说明
#  一起压缩成 dmg。CI 与本地均可使用：
#
#     scripts/dmg/package-dmg.sh <版本号> [.app 路径]
# ==============================================================
set -euo pipefail

version="${1:?用法: scripts/dmg/package-dmg.sh <版本号> [.app 路径]}"
app_src="${2:-}"
repo_root="$(cd "$(dirname "$0")/../.." && pwd)"

if [ -z "$app_src" ]; then
  app_src=$(ls -d "$repo_root"/src-tauri/target/aarch64-apple-darwin/release/bundle/macos/*.app 2>/dev/null | head -n 1 || true)
fi
if [ -z "$app_src" ] || [ ! -d "$app_src" ]; then
  echo "错误：未找到 .app 包。请先执行 npm run macos:build:app" >&2
  exit 1
fi

stage="$repo_root/dmg-stage"
dist="$repo_root/dist"
dmg="$dist/Acta-${version}-macos-arm64.dmg"

rm -rf "$stage"
mkdir -p "$stage" "$dist"

cp -R "$app_src" "$stage/"
ln -s /Applications "$stage/Applications"
cp "$repo_root/scripts/dmg/修复启动损坏.command" "$stage/"
cp "$repo_root/scripts/dmg/损坏修复说明.txt" "$stage/"
chmod +x "$stage"/*.command

rm -f "$dmg"
hdiutil create -volname "Acta · 行记" -srcfolder "$stage" -format UDZO -ov "$dmg"
rm -rf "$stage"

echo "已生成: $dmg"
echo "包含: $(basename "$app_src")、Applications 软链、修复启动损坏.command、损坏修复说明.txt"
