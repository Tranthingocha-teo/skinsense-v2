# QA Android — checklist chạy tay (ticket 16)

Chạy trên điện thoại Android thật, APK EAS profile `preview` (hoặc `development` + Metro). Ngôn ngữ máy: tiếng Việt. Mỗi dòng = một thao tác + kết quả mong đợi; ghi ✅/❌ và ghi chú ngay tại chỗ. Số trong ngoặc = user story trong `spec.md`. Story web-only (23, 25, 26) không có ở đây — Claude tự chạy.

Chuẩn bị: gỡ app cũ, cài APK từ link EAS, tắt Wi-Fi rồi bật lại (app cần mạng), có sẵn tài khoản Google thứ hai dùng một lần.

## A. Cài đặt và đăng nhập

| # | Thao tác | Mong đợi | ✅/❌ | Ghi chú |
|---|---|---|---|---|
| A1 (22) | Mở link APK trên máy, cài, mở app | App mở, không văng, không hỏi quyền micro | | |
| A2 (24) | Nhìn màn đầu | Chữ tiếng Việt: "Nhật ký da riêng tư…", nút "Đăng nhập bằng Google" | | |
| A3 (21) | Chạm "Chính sách riêng tư" | Mở trình duyệt tới trang privacy của web | | |
| A4 (1) | Chạm "Đăng nhập bằng Google", chọn tài khoản chính | Vào shell, dòng "Đang đăng nhập với <email>" | | |
| A5 (2) | Vuốt tắt app khỏi Recent, mở lại | Vào thẳng shell, không hỏi đăng nhập lại | | |
| A6 (2) | Tắt máy, bật lại, mở app | Vẫn đang đăng nhập | | |

## B. Chụp ảnh lần 1

| # | Thao tác | Mong đợi | ✅/❌ | Ghi chú |
|---|---|---|---|---|
| B1 | Chạm "Chụp ảnh tối nay" | Android hỏi quyền camera → Cho phép → preview camera trước hiện | | |
| B2 (4) | Đưa mặt ra khỏi khung | Nhãn "Đưa mặt vào khung hình", nút "Chụp" bị mờ/không bấm được | | |
| B3 (4) | Đưa mặt vào khung, ngồi yên | Lưới điểm landmark bám theo mặt, chuyển động không giật | | |
| B4 (6) | Che đèn / vào chỗ tối | Nhãn đổi thành "Thiếu sáng" | | |
| B5 (6) | Đưa máy sát mặt | Nhãn "Lùi ra xa"; lùi quá xa → "Lại gần hơn" | | |
| B6 (6) | Quay mặt sang bên | Nhãn "Nhìn thẳng vào camera" | | |
| B7 (4) | Ngồi đúng, sáng đủ | Nhãn "Đủ sáng", nút "Chụp" sáng | | |
| B8 (5) | Chạm "Chụp" | "Đang phân tích…" rồi ảnh tĩnh hiện; ghi thời gian từ lúc bấm tới khi hiện bảng (giây): ___ | | |
| B9 (5) | Nhìn màn kết quả | Bảng 5 vùng (Trán, Má trái, Má phải, Mũi, Cằm) có "Độ đỏ" và "Độ không đều" là số | | |
| B10 (19) | Cuộn xuống | Dòng "Không phải chẩn đoán y khoa…" | | |
| B11 | Chạm "Chụp lại" | Quay về preview camera, không lưu gì | | |
| B12 (6) | Chụp lại trong chỗ tối, chạm "Chụp" | Hộp "Ảnh này có thể cho số liệu sai lệch:" liệt kê "Thiếu sáng", nút đổi thành "Vẫn lưu" | | |
| B13 | Chạm "Chụp lại", chụp ảnh đủ sáng, chạm "Lưu" | "Đang lưu…" rồi "Đã lưu", có nút "Đánh dấu nốt mụn" và "Xong" | | |
| B14 (5) | Supabase dashboard → bảng `photos`, hàng vừa lưu | Cột `awb_locked` = true (khóa cân bằng trắng đã bật trước khi chụp; false = máy này không hỗ trợ, ghi chú model máy) | | |

## C. Đánh dấu nốt mụn

| # | Thao tác | Mong đợi | ✅/❌ | Ghi chú |
|---|---|---|---|---|
| C1 (7) | Chạm "Đánh dấu nốt mụn" | Ảnh vừa chụp hiện (đúng chiều gương như lúc chụp), dòng "Chưa có nốt nào — chạm vào ảnh để thêm" | | |
| C2 (7) | Chạm vào giữa trán | Chấm tròn xuất hiện đúng chỗ, chip "Trán", dòng "1 nốt đã đánh dấu…" | | |
| C3 (9) | Chạm thêm má trái và mũi | 3 chip: Trán, Má trái, Mũi; đếm "3 nốt" | | |
| C4 (7) | Chạm ra ngoài mặt (nền / tóc) | Không thêm chấm, dòng "Chạm vào da trong các vùng mặt…" | | |
| C5 (7) | Chạm vào một chấm đã có | Chấm biến mất, đếm giảm 1 | | |
| C6 | Chạm "Lưu" | "Đã lưu", nút "Xong" → về shell | | |
| C7 (8) | Shell → "Đánh dấu nốt mụn trên ảnh tối nay" | Mở lại ảnh, các chấm đã lưu nằm đúng vị trí cũ | | |
| C8 (8) | Chạm "Quay lại", chụp ảnh mới (B1→B13) ngồi lệch/xa hơn một chút, rồi mở đánh dấu của ảnh mới | Màn trống (ảnh mới chưa có nốt); các nốt của ảnh cũ vẫn nguyên ở C7 — nốt không bị lệch theo khung hình mới | | |

## D. Routine tối nay

| # | Thao tác | Mong đợi | ✅/❌ | Ghi chú |
|---|---|---|---|---|
| D1 (11) | Shell → "Routine tối nay" (lần đầu) | 4 bước mặc định: Tẩy trang, Rửa mặt, Serum trị mụn, Kem dưỡng ẩm; "0/4 hoàn thành" | | |
| D2 (12) | Chạm "Tẩy trang" và "Rửa mặt" | Ô tick, thanh tiến độ, "2/4 hoàn thành" | | |
| D3 (12) | Quay lại shell, vào lại "Routine tối nay" | Vẫn "2/4 hoàn thành", đúng 2 bước đã tick | | |
| D4 (10) | Chạm "Thêm bước", gõ "Kem chống nắng", xác nhận | Bước mới ở cuối, "2/5 hoàn thành" | | |
| D5 (10) | Menu (⋯) của "Serum trị mụn" → "Đổi tên" → "Serum BHA" | Tên đổi, tick giữ nguyên, tiến độ không đổi | | |
| D6 (10) | Menu của "Kem chống nắng" → "Chuyển lên" | Nó lên trên "Kem dưỡng ẩm" | | |
| D7 (10) | Menu của "Kem chống nắng" → "Xóa" | Mất khỏi danh sách, "2/4 hoàn thành" | | |
| D8 (14) | Menu của "Tẩy trang" (đã tick) → "Xóa" | Bước mất, nhưng xem Xu hướng → "Routine hoàn thành" của hôm nay vẫn tính 2 bước đã tick, không giảm | | |
| D9 (13) | Ngày hôm sau (hoặc chỉnh ngày máy +1), mở Routine, tick 1 bước, KHÔNG chụp ảnh | Tick lưu được; Xu hướng ghi % của ngày đó dù không có ảnh | | |

## E. Xu hướng

| # | Thao tác | Mong đợi | ✅/❌ | Ghi chú |
|---|---|---|---|---|
| E1 (15) | Shell → "Xu hướng" | Biểu đồ "Chỉ số mẩn đỏ — Trán", có điểm hôm nay, "Gần nhất: <số>", mũi tên ↑/↓/→ | | |
| E2 (15) | Chạm "Má trái" rồi "Mũi" | Tiêu đề đổi theo vùng, đường vẽ lại, số Gần nhất đổi | | |
| E3 (15) | Chạm "30 ngày" rồi "7 ngày" | Trục ngày đổi (tuần ↔ Thứ 2–CN), dữ liệu vẫn có | | |
| E4 (16) | Xem thẻ "Số nốt mụn" | Số đúng bằng nốt đã đánh dấu cho vùng đang chọn (C3/C5) | | |
| E5 (17) | Xem thẻ "Routine hoàn thành" | % khớp với D3/D8 (2/4 = 50 %) | | |
| E6 (18) | Có ≥2 ảnh trong khoảng (B13 + C8): kéo thanh "Kéo để so sánh" | Ảnh trước/sau lộ dần theo tay kéo, không giật | | |
| E7 (18) | Chọn "7 ngày" khi chỉ 1 ảnh trong khoảng (nếu có) | Dòng "Cần ít nhất 2 ảnh trong khoảng này", không có thanh kéo | | |
| E8 (19) | Cuối màn | "Không phải công cụ chẩn đoán y khoa" | | |

## F. Cách ly dữ liệu và xóa tài khoản

| # | Thao tác | Mong đợi | ✅/❌ | Ghi chú |
|---|---|---|---|---|
| F1 | Shell → "Đăng xuất" | Về màn đăng nhập | | |
| F2 (3) | Đăng nhập bằng tài khoản Google thứ hai | Shell không có nút "Đánh dấu nốt mụn…"; Routine "0/4" mặc định; Xu hướng "Chưa có ảnh trong khoảng này" | | |
| F3 (20) | Chụp 1 ảnh, lưu; shell → "Xóa tài khoản" → "Hủy" | Hộp "Xóa tài khoản?" đóng, vẫn đăng nhập | | |
| F4 (20) | "Xóa tài khoản" → xác nhận "Xóa tài khoản" | Về màn đăng nhập | | |
| F5 (20) | Đăng nhập lại bằng tài khoản thứ hai | Shell trống như user mới (không còn ảnh, routine mặc định) | | |
| F6 (20) | Supabase dashboard: Auth users, bảng `photos`, Storage bucket | Không còn user thứ hai, không còn hàng, không còn thư mục ảnh | | |
| F7 (3) | Đăng xuất, đăng nhập lại tài khoản chính | Ảnh, nốt, routine của A4→E8 vẫn nguyên | | |

## Kết quả

Ngày chạy: ______  Máy: ______  Android: ______  Build: ______

Số dòng ❌: ___  → mỗi ❌ thành một dòng trong `## Comments` của ticket tương ứng (08 chụp, 10 nốt, 05 routine, 13 xu hướng, 03/11 tài khoản).
