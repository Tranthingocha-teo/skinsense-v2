# Feature Specification: Mobile avatar shown everywhere

**Feature**: `002-mobile-avatar-display` · **Created**: 2026-11-21 · **Status**: Implemented, chưa chạy trên máy thật · **Scope**: apps/mobile only

Viết theo mẫu "spec trong 5 phút" của https://nashtech-garage.github.io/ai-spec-driven-prep/07-spec-driven-development

**User outcome**: Sau khi đổi ảnh đại diện trong Hồ sơ, người dùng thấy đúng ảnh đó ở Cài đặt (thẻ tài khoản) và ở màn Hồ sơ sau khi mở lại app, không phải ảnh Google cũ.

**Vì sao**: feature 001 cho upload avatar lên Cloudinary và lưu `avatarUrl`, nhưng `Settings` chỉ đọc `user_metadata.picture` (ảnh Google) nên ảnh mới không hiện ở đó.

**Scope**
- Lưu `avatarUrl` vào user hiện tại (`setCurrentUser`) khi Lưu hồ sơ thành công.
- `Settings` hiển thị theo thứ tự ưu tiên: `avatarUrl` (Cloudinary) → ảnh Google → gradient mặc định.
- Màn Hồ sơ nạp `avatarUrl` từ API (đã có) và từ user đã lưu khi offline.

**Non-goals**
- Không đổi web, không đổi API `/api/profile`.
- Không cắt/xoay ảnh nâng cao (chỉ crop vuông của picker).
- Không xóa ảnh avatar cũ trên Cloudinary.
- Không hỗ trợ avatar ở chế độ demo.

**Rules and defaults**
- Chưa có `avatarUrl` → giữ hành vi cũ (ảnh Google, rồi gradient).
- `avatarUrl` rỗng hoặc ảnh tải lỗi → rơi về ảnh Google/gradient, không để ô trống.
- Người dùng đã đăng nhập từ trước (không có trường `avatarUrl` trong bộ nhớ) vẫn chạy bình thường.

**Acceptance example 1 (bình thường)**: Given người dùng có ảnh Google, When họ chọn ảnh mới ở Hồ sơ và bấm Lưu thành công, Then mở Cài đặt thấy ảnh mới (link `res.cloudinary.com`).

**Acceptance example 2 (ngoại lệ)**: Given `avatarUrl` trỏ tới link hỏng, When mở Cài đặt, Then hiện ảnh Google (hoặc gradient nếu không có), app không crash.

**Acceptance example 3 (dữ liệu cũ)**: Given user lưu từ phiên bản trước, không có `avatarUrl`, When mở Cài đặt, Then hiện ảnh Google như trước.

**Quality requirement**: ảnh có `accessibilityIgnoresInvertColors` (đã có) và nhãn truy cập "Ảnh đại diện"; thông báo lỗi upload bằng tiếng Việt rõ ràng.

**Open questions**
1. ~~Làm mới Cài đặt ngay?~~ Có: `useCurrentUser` phản ứng khi `setCurrentUser`.
2. ~~Avatar ở các portal?~~ Không, chỉ Cài đặt (non-goal mới).

## Plan sơ bộ (mobile)
- `src/lib/auth.ts`: thêm `avatarUrl?: string` vào kiểu user, lưu qua `setCurrentUser`.
- `src/components/role-profile.tsx`: gọi `setCurrentUser({... avatarUrl})` sau khi lưu.
- `src/components/settings.tsx`: `<Avatar uri={currentUser?.avatarUrl ?? meta?.picture} />` + `onError` rơi về ảnh Google/gradient.
- Test: `settings.test.tsx` (3 acceptance ở trên), `role-profile` (lưu → user có `avatarUrl`).

## Tasks
- [x] T001 Test đỏ cho 3 acceptance trong `settings.test.tsx`
- [x] T002 Thêm `avatarUrl` vào user + lưu khi Lưu hồ sơ
- [x] T003 `Settings` dùng thứ tự ưu tiên + fallback khi ảnh lỗi
- [x] T004a `bun run typecheck` sạch, `bun run test` 40 suite / 173 test qua
- [ ] T004b Chạy tay trên máy thật RMX5377 (cần build lại dev client): đổi avatar → mở Cài đặt
