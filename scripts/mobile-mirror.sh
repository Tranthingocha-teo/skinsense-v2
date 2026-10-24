#!/usr/bin/env bash
set -e

export ANDROID_HOME="${ANDROID_HOME:-/home/tranthingocha/Android/Sdk}"
export PATH="$ANDROID_HOME/platform-tools:$PATH"

# Check if scrcpy is installed
if ! command -v scrcpy &> /dev/null; then
  echo "⚠️  scrcpy chưa được cài đặt. Vui lòng mở Terminal chạy: sudo pacman -S scrcpy"
  notify-send -u critical "SkinSense Mobile" "Chưa cài scrcpy. Hãy chạy: sudo pacman -S scrcpy" 2>/dev/null || true
  exit 1
fi

echo "🔍 Đang tìm kiếm thiết bị Android..."

# 1. Kiểm tra thiết bị cắm qua USB
DEVICE=$(adb devices | grep -w "device" | grep -v ":" | awk '{print $1}' | head -n 1)

if [ -n "$DEVICE" ]; then
  echo "✅ Đã tìm thấy thiết bị qua USB: $DEVICE"
  # Tự động kích hoạt cổng TCP/IP cho Wi-Fi phòng khi rút cáp
  adb -s "$DEVICE" tcpip 5555 >/dev/null 2>&1 || true
  TARGET_SERIAL="$DEVICE"
else
  # 2. Thử kết nối không dây qua Wi-Fi nếu không cắm cáp
  echo "ℹ️  Không thấy cáp USB, đang thử kết nối qua Wi-Fi..."
  PHONE_IP="192.168.2.19"
  adb connect "$PHONE_IP:5555" >/dev/null 2>&1 || true
  WIFI_DEVICE=$(adb devices | grep -w "device" | grep "$PHONE_IP:5555" | awk '{print $1}' | head -n 1)
  if [ -n "$WIFI_DEVICE" ]; then
    echo "✅ Kết nối thành công qua Wi-Fi: $WIFI_DEVICE"
    TARGET_SERIAL="$WIFI_DEVICE"
  else
    echo "❌ Không tìm thấy thiết bị. Hãy cắm cáp USB hoặc đảm bảo điện thoại cùng mạng Wi-Fi."
    notify-send -u critical "SkinSense Mobile" "Không tìm thấy điện thoại qua USB hoặc Wi-Fi" 2>/dev/null || true
    exit 1
  fi
fi

# Tự động khởi chạy app SkinSense
echo "📱 Đang mở ứng dụng SkinSense..."
adb -s "$TARGET_SERIAL" shell monkey -p com.skinsense.app -c android.intent.category.LAUNCHER 1 >/dev/null 2>&1 || true

# Khởi chạy scrcpy với title đặc biệt để Hyprland bắt window rule
echo "🚀 Đang khởi động cửa sổ Scrcpy..."
exec scrcpy \
  --serial="$TARGET_SERIAL" \
  --window-title="SkinSense Mobile" \
  --window-width=380 \
  --window-height=820 \
  --stay-awake \
  --power-off-on-close=false
