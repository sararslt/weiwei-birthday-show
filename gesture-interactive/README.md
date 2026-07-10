# Gesture Interactive（手势互动特效）

本目录是手势驱动的粒子互动站，位于分支 `gesture-interactive`。

- `main`：原来的炜炜生日秀（时间轴动画）
- `gesture-interactive`：本手势互动版本

## 手势

| 手势 | 效果 |
|------|------|
| OK | 海豹 + 开始循环播放生日快乐歌 |
| 比 1 | 炜炜 |
| 比 2 | 猫 |
| 比 3 | 「生日快乐炜炜」+ 蛋糕 + 全屏烟花 |

## 本地运行

```bash
cd gesture-interactive
python3 -m http.server 8765
```

打开 http://127.0.0.1:8765/
