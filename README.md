# 炜炜生日粒子秀 · weiwei-birthday-show

Three.js + Vite 粒子生日动画：海豹 → 炜炜 → 猫 → 合影 → 生日快乐文字。

## 本地运行

```bash
npm install
npm run dev
```

浏览器打开 http://localhost:5173（Safari 上需点一下页面开启声音）。

## 在线预览（推送并开启 Pages 后）

https://sararslt.github.io/weiwei-birthday-show/

GitHub 仓库 Settings → Pages → Source 选 **GitHub Actions**。

## 推到 GitHub（仓库 404 说明还没推上去）

```bash
chmod +x scripts/push-to-github.sh
./scripts/push-to-github.sh
```

仓库地址：https://github.com/sararslt/weiwei-birthday-show

## 恢复旧版特效

```bash
git checkout effects-backup -- src/config.js src/core/ShowDirector.js
```
