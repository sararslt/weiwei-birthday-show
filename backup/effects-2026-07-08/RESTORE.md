# 特效备份（2026-07-08）

调整 cat/text 清晰度**之前**的版本。

## 一键恢复

```bash
cd /Users/sasa/project-seal-new
git checkout effects-backup -- src/config.js src/core/ShowDirector.js src/core/ParticleSystem.js
```

或恢复整个项目到该版本：

```bash
git checkout effects-backup
```

## Git 标记

- **Tag:** `effects-backup` → commit `496e01c`
- **Branch:** `backup/effects-before-clarity`

## 本目录文件

与 tag 对应的源码副本，可手动复制回 `src/`。
