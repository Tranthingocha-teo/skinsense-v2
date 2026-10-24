# Android Manual QA Checklist: Release v1.0.0

This checklist covers full end-to-end testing on physical Android hardware before publishing a signed release build.

---

## 1. Release Acceptance Rules

- **Blockers (Must Fix Before Release)**:
  - Any unhandled crash or frozen screen.
  - Data loss (routine steps unticked, marked spots disappearing unexpectedly).
  - Google Sign-In failure or token exchange error.
  - Failure to capture, analyze or save nightly photos.
  - Account deletion failing to purge photos and database rows.

- **Acceptable Limitations (Non-blocking)**:
  - Slight landmark jitter under extreme low light (< 15 lux).
  - Minor delay (100–300ms) during cold start on Android 10/11 devices.
  - Font scaling differences on non-standard Android vendor skins (MIUI/ColorOS).

---

## 2. Test Matrix

- **Target Device Tested**: ___________________________
- **Android OS Version**: ___________________________
- **Build Variant**: Release APK (`skinsense.apk`, v1.0.0)
- **Tester**: ___________________________
- **Date**: ___________________________

---

## 3. Checklist Items

### A. Authentication & Onboarding
- [ ] **First Launch**: App launches into onboarding flow; 3 slides explain diary concept with smooth transitions.
- [ ] **Camera Permission**: Tapping "Cho phép camera" triggers Android system permission modal.
- [ ] **Sign-in Screen**: "Đăng nhập với Google" button and "Xem thử (dữ liệu mẫu)" button are visible.
- [ ] **Demo Mode ("Xem thử")**: Tapping "Xem thử" enters app immediately without Google account; blue demo banner appears at the top.
- [ ] **Banner Actions**: Tapping "Đặt lại" resets demo values; tapping "Đăng nhập" returns cleanly to sign-in.
- [ ] **Google OAuth**: Tapping Google sign-in displays account chooser and successfully authenticates into `/(app)`.

### B. Hôm Nay (Today Dashboard)
- [ ] **Status Cards**: Tonight's photo card shows "Chưa chụp" (or checkmark if taken).
- [ ] **Routine Progress**: Shows completion count (e.g. `0/4` completed).
- [ ] **Streak Banner**: Displays current active streak count.
- [ ] **Quick Navigation**: Tapping cards navigates to Capture and Routine screens.

### C. Guided Camera Capture
- [ ] **Camera Viewfinder**: Front-facing camera starts smoothly at 30fps.
- [ ] **Head Guide**: Centered oval overlay guides face positioning.
- [ ] **Real-time Feedback**: Hints appear for dark room ("Thiếu sáng"), turned head ("Nhìn thẳng"), or too far ("Lại gần hơn").
- [ ] **Shutter**: Tapping shutter captures photo and shows 5 facial zones (Trán, Má trái, Má phải, Mũi, Cằm).
- [ ] **Quality Warning**: If lighting is poor, "Vẫn lưu" (Save anyway) and "Chụp lại" (Retake) options appear.
- [ ] **Save**: Saving transitions cleanly to spot marking or Today dashboard.

### D. Interactive Spot Marking
- [ ] **Photo Canvas**: Captured photo renders with pinch/pan or tap response.
- [ ] **Tap to Add Spot**: Tapping on skin creates a colored circular marker.
- [ ] **Zone Mapping**: Marker automatically resolves to forehead, cheeks, nose, or chin.
- [ ] **Tap to Remove**: Tapping existing spot allows deletion.
- [ ] **Save**: Spots persist to database / local store.

### E. Daily Routine Checklist
- [ ] **Check Item**: Tapping checkbox toggles state with subtle haptic vibration.
- [ ] **Add Step**: Tapping "Thêm bước" opens input field and adds new routine item.
- [ ] **Reorder / Delete**: Routine steps can be rearranged or removed.
- [ ] **Nightly Persistence**: Checked items persist across app restarts.

### F. Skin Trends & Before/After Comparison
- [ ] **Window Selector**: Switching between 7-day and 30-day updates chart points.
- [ ] **Zone Redness Chart**: SVG line chart displays redness trajectory (trending down / steady / trending up).
- [ ] **Spot Counter**: Displays total spot count for selected zone.
- [ ] **Comparison Slider**: Dragging the vertical split line reveals Before (left) vs After (right) photos smoothly.
- [ ] **Choose Dates**: Date picker enables only days with photos.
- [ ] **Share Comparison**: Tapping "Chia sẻ" opens share dialog; toggling "Che mắt (Blur eyes)" renders privacy bar; native share sheet fires.

### G. Settings, Security & Data Management
- [ ] **Biometric Lock**: Toggling "Khóa ứng dụng bằng vân tay / Face ID" prompts for biometric scan before enabling.
- [ ] **Export Data**: Tapping "Xuất dữ liệu (CSV)" downloads/shares full archive of routines, spots, and redness readings.
- [ ] **Evening Reminder**: Setting time (e.g. 21:00) schedules native Android local notification.
- [ ] **About & Licenses**: Displays version `1.0.0`, GitHub source link, privacy policy, and open-source license list.
- [ ] **Delete Account**: Custom dialog warns irreversibility; confirming purges user photos and records.
