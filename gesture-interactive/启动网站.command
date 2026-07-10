#!/bin/bash
cd "$(dirname "$0")"
PORT=8765
echo "正在启动：http://127.0.0.1:$PORT"
echo "浏览器打开后，点「开启摄像头并开始」"
echo "按 Ctrl+C 可停止服务"
echo ""
# 尽量打开浏览器
open "http://127.0.0.1:$PORT/" 2>/dev/null || true
python3 -m http.server "$PORT"
