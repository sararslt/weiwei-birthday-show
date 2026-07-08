# GitHub Pages 部署指南

在线地址（部署成功后）：

**https://sararslt.github.io/weiwei-birthday-show/**

---

## 第一次部署（按顺序做）

### 1. 在 GitHub 创建空仓库

打开 https://github.com/new

- **Repository name：** `weiwei-birthday-show`
- **Public**
- **不要**勾选 Add a README

点 **Create repository**

### 2. 终端推送代码

```bash
cd /Users/sasa/project-seal-new

git remote add origin https://github.com/sararslt/weiwei-birthday-show.git 2>/dev/null || \
  git remote set-url origin https://github.com/sararslt/weiwei-birthday-show.git

git add -A
git status
git commit -m "Add GitHub Pages deploy"   # 若提示 nothing to commit 可跳过

git push -u origin main
git push origin --tags
```

第一次会要求登录 GitHub（浏览器弹窗或输入 Token）。

### 3. 开启 GitHub Pages

1. 打开 https://github.com/sararslt/weiwei-birthday-show/settings/pages  
2. **Build and deployment** → **Source** 选 **GitHub Actions**（不是 Deploy from a branch）  
3. 打开 **Actions** 标签，等 **Deploy to GitHub Pages** 跑绿（约 1～3 分钟）

### 4. 打开网站

https://sararslt.github.io/weiwei-birthday-show/

若仍 404，等 2～5 分钟再刷新，或看 Actions 是否失败。

---

## 给朋友扫二维码

1. 确认上面链接能在手机浏览器打开  
2. 打开 https://www.qrcode-monkey.com（或微信搜「二维码生成」）  
3. 粘贴链接，下载二维码图片，发给朋友  

**提醒朋友：** 打开后**点一下屏幕**才有声音。

---

## 以后更新

改完代码后：

```bash
git add -A
git commit -m "更新说明"
git push
```

Actions 会自动重新部署，几分钟后线上更新。

---

## 常见问题

| 问题 | 处理 |
|------|------|
| 仓库 404 | 第 1 步还没建库，或 push 失败 |
| 网站 404 | Pages 未选 GitHub Actions，或 Actions 还在跑 |
| 页面空白 | 检查 Actions 是否成功；`vite.config.js` 里 base 应为 `/weiwei-birthday-show/` |
| 没声音 | 手机点一下屏幕（浏览器限制） |
