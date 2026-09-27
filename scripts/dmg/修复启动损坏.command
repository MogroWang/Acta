#!/bin/bash
# ==============================================================
#  Acta · 行记 — 启动修复脚本
#
#  适用情况：打开应用时提示
#      「“Acta · 行记”已损坏，无法打开。您应该将它移到废纸篓。」
#
#  原因：macOS 会给所有从网络下载的文件附加「隔离」扩展属性
#  （com.apple.quarantine）；对未经 Apple 公证的应用，系统会
#  直接拒绝启动并谎称其「已损坏」。这与病毒无关。
#
#  本脚本实际执行的命令只有一条：
#      sudo xattr -r -d com.apple.quarantine <应用路径>
#  即删除这条「隔离」标记，让应用能够正常启动，
#  不会修改应用的任何内容。需要输入开机密码是为了获得
#  清理「应用程序」文件夹属性所需的管理员权限。
#
#  本软件完全开源（MIT 协议）：https://github.com/MogroWangStudio/Acta
# ==============================================================

set -u

APP_NAME="Acta · 行记.app"
REPO_URL="https://github.com/MogroWangStudio/Acta"

C='\033[0m'; G='\033[1;32m'; Y='\033[1;33m'; R='\033[1;31m'

line() { printf '%s\n' "------------------------------------------------------------"; }

echo
line
printf '            Acta · 行记 — 启动修复\n'
line
echo
echo "本脚本将移除 macOS 给应用添加的「隔离」标记，"
echo "解决打开时提示「已损坏，无法打开」的问题。"
echo
echo "将要执行的命令："
echo "    sudo xattr -r -d com.apple.quarantine <应用>"
echo
echo "它只会删除这条标记，不会改动应用本身；"
echo "过程中会要求输入开机密码以获得管理员权限，"
echo "输入时屏幕上不会显示任何字符，输入完直接回车即可。"
echo

# ---- 定位已安装的应用 ----------------------------------------

target=""

# 1) 常规安装位置（拖入「应用程序」或「个人应用程序」文件夹）
candidates=(
  "/Applications/$APP_NAME"
  "$HOME/Applications/$APP_NAME"
)
for c in "${candidates[@]}"; do
  if [ -d "$c" ]; then target="$c"; break; fi
done

# 2) 名称略有出入时，按 Acta* 模糊匹配
if [ -z "$target" ]; then
  for base in "/Applications" "$HOME/Applications"; do
    hit=$(find "$base" -maxdepth 1 -type d -name "Acta*.app" 2>/dev/null | head -n 1 || true)
    if [ -n "$hit" ]; then target="$hit"; break; fi
  done
fi

if [ -z "$target" ]; then
  printf "${R}✘ 未找到「Acta · 行记」${C}\n"
  echo
  echo "请先把 DMG 里的「Acta · 行记」拖入「应用程序」文件夹，"
  echo "再重新运行本脚本。"
  echo
  echo "如果应用安装在其他位置，也可以手动在终端执行"
  echo "（把命令末尾换成应用的实际路径）："
  echo
  echo "    sudo xattr -r -d com.apple.quarantine \"/Applications/$APP_NAME\""
  echo
  echo "项目主页：$REPO_URL"
  echo
  read -r -p "按回车键退出…" _ || true
  exit 1
fi

# ---- 请求提权并清除隔离标记 ----------------------------------

printf "目标应用：%s\n" "$target"
echo
echo "正在请求管理员权限…"
echo
sudo xattr -r -d com.apple.quarantine "$target"
rc=$?
echo

if [ "$rc" -ne 0 ]; then
  printf "${R}✘ 修复未完成（命令返回错误）${C}\n"
  echo
  echo "常见原因："
  echo "  · 在输入密码处直接按了回车或连续输错密码"
  echo "  · 当前账户不是管理员账户"
  echo
  echo "请重新运行本脚本再试；或参考同目录下的"
  echo "「损坏修复说明.txt」中的手动修复方法。"
  echo
  read -r -p "按回车键退出…" _ || true
  exit 1
fi

# ---- 校验结果 -------------------------------------------------

if xattr "$target" 2>/dev/null | grep -q "com.apple.quarantine"; then
  printf "${Y}⚠ 隔离标记仍存在，建议重启 Mac 后再运行一次本脚本。${C}\n"
else
  printf "${G}✔ 修复完成！${C}\n"
  echo
  echo "已移除「隔离」标记，现在可以正常打开「Acta · 行记」了。"
fi

echo
echo "项目主页（源代码完全开源）：$REPO_URL"
echo

# 修复成功后询问是否直接启动应用
read -r -p "是否现在打开应用？[Y/n] " ans || ans="n"
case "$ans" in
  n|N|no|No|NO) ;;
  *)
    open "$target" 2>/dev/null || true
    ;;
esac

read -r -p "按回车键退出…" _ || true
exit 0
