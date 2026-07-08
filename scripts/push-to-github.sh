#!/bin/bash
# 把本项目推到 GitHub： https://github.com/sararslt/weiwei-birthday-show
set -e

REPO="weiwei-birthday-show"
USER="sararslt"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

cd "$ROOT"

echo "→ 当前目录: $ROOT"
echo "→ 目标仓库: https://github.com/$USER/$REPO"
echo ""

if ! git rev-parse --git-dir >/dev/null 2>&1; then
  echo "错误: 这里不是 git 仓库"
  exit 1
fi

# 配置 remote
if git remote get-url origin >/dev/null 2>&1; then
  git remote set-url origin "https://github.com/$USER/$REPO.git"
else
  git remote add origin "https://github.com/$USER/$REPO.git"
fi

# 优先用 gh 创建仓库并推送
if command -v gh >/dev/null 2>&1; then
  if ! gh auth status >/dev/null 2>&1; then
    echo "请先登录 GitHub："
    gh auth login
  fi
  echo "→ 创建仓库并推送 main..."
  gh repo create "$REPO" --public --source=. --remote=origin --push 2>/dev/null || \
    git push -u origin main
else
  echo "未安装 gh。请先在浏览器创建空仓库："
  echo "  https://github.com/new"
  echo "  名称: $REPO"
  echo "  不要勾选 README"
  echo ""
  read -r -p "创建好后按回车继续推送..."
  git push -u origin main
fi

echo "→ 推送标签和备份分支..."
git push origin --tags 2>/dev/null || true
git push origin backup/effects-before-clarity 2>/dev/null || true

echo ""
echo "完成！打开: https://github.com/$USER/$REPO"
