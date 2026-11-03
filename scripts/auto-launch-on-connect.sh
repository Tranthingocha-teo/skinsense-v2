#!/usr/bin/env bash
set -e

export ANDROID_HOME="${ANDROID_HOME:-/home/tranthingocha/Android/Sdk}"
export PATH="$HOME/.local/bin:$ANDROID_HOME/platform-tools:$PATH"
export DISPLAY="${DISPLAY:-:1}"

echo "⏳ Đang lắng nghe thiết bị Android..."

while true; do
  DEVICE=$(adb devices | grep -w "device" | grep -v ":" | awk '{print $1}' | head -n 1)
  if [ -n "$DEVICE" ]; then
    echo "🎉 Thiết bị đã được kết nối và ủy quyền: $DEVICE"
    notify-send -u normal "SkinSense" "Điện thoại đã kết nối thành công! Đang mở ứng dụng..." 2>/dev/null || true
    
    # 1. Reverse port 8081 cho Metro
    adb -s "$DEVICE" reverse tcp:8081 tcp:8081 >/dev/null 2>&1 || true
    
    # 2. Đánh thức màn hình
    adb -s "$DEVICE" shell input keyevent KEYCODE_WAKEUP >/dev/null 2>&1 || true
    adb -s "$DEVICE" shell wm dismiss-keyguard >/dev/null 2>&1 || true
    
    # 3. Khởi chạy app SkinSense
    adb -s "$DEVICE" shell monkey -p com.skinsense.app -c android.intent.category.LAUNCHER 1 >/dev/null 2>&1 || true
    
    # 4. Mở cửa sổ Scrcpy
    exec scrcpy \
      --serial="$DEVICE" \
      --window-title="SkinSense Mobile" \
      --window-width=376 \
      --window-height=820 \
      --stay-awake
    break
  fi
  sleep 1
done
