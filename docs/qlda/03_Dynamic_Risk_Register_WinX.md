# BÁO CÁO 3: BẢNG QUẢN TRỊ RỦI RO ĐỘNG (DYNAMIC RISK REGISTER)
**HỌC PHẦN:** QUẢN TRỊ DỰ ÁN PHẦN MỀM (SPM) — VKU  
**DỰ ÁN:** SKINSENSE V2 (`VKU-SPM-SKINSENSE02`)  
**NHÓM THỰC HIỆN:** **NHÓM WINX (3 THÀNH VIÊN: HÀ, SÁNG, DUNG)**  
**LỊCH SỬ TIẾN HÓA:** CẬP NHẬT 2 ĐỢT CHUẨN MỰC — ĐỢT 1 (TUẦN 6) & ĐỢT 2 (TUẦN 11)  

---

## 1. PHƯƠNG PHÁP LUẬN QUẢN TRỊ RỦI RO 3 BƯỚC (3-STEP RISK CYCLE)

Nhóm WinX áp dụng quy trình kiểm soát rủi ro chuẩn PMBOK xuyên suốt 15 tuần:
1. **Nhận diện rủi ro:** Thu thập các vấn đề kỹ thuật và tích hợp phát sinh giữa 3 phân hệ của Hà (Bác sĩ/Admin), Sáng (Shop/Seller) và Dung (Profile/Thanh toán/QA).
2. **Định lượng ma trận rủi ro:** Điểm rủi ro = Xác suất ($P: 1-5$) $\times$ Mức độ ảnh hưởng ($I: 1-5$). Phân cấp: Đỏ ($\ge 15$), Vàng ($8 - 14$), Xanh ($\le 7$).
3. **Chiến lược ứng phó:** **Avoid** (Tránh né), **Mitigate** (Giảm thiểu), **Transfer** (Chuyển giao) hoặc **Accept** (Chấp nhận).

---

## 2. BẢNG THEO DÕI RỦI RO ĐỢT 1 — SPRINT 1 (TUẦN 6)

*Ghi nhận tại buổi họp Sprint 1 Review & Retrospective giữa Hà, Sáng và Dung (28/09/2026).*

| Mã Rủi Ro | Mô tả rủi ro thực tế phát sinh | P | I | Điểm | Chiến lược | Kế hoạch hành động cụ thể (Action Plan) | Phụ trách (Owner) | Trạng thái (Status) |
| :---: | :--- | :---: | :---: | :---: | :---: | :--- | :---: | :---: |
| **RSK-01** | **Camera điện thoại quét mã MoMo QR bị lỗi do trỏ vào `localhost`**: Điện thoại thật trong mạng LAN không thể kết nối đến máy chủ dev đang chạy ở `127.0.0.1:3000`. | 5 | 4 | **20** *(Đỏ)* | **Mitigate** | Viết hàm tự động nhận diện địa chỉ IP LAN cục bộ máy chủ (`192.168.1.3`) để nhúng vào payload mã QR Base64 thay vì hardcode `localhost`. | **Thùy Dung** | **Materialized (Đã xử lý xong)** |
| **RSK-02** | **Xung đột giá bán và biến thể dung tích mỹ phẩm trên sàn `/shop`**: Giá trên trang danh mục của Sáng không khớp với giá trong trang checkout khi chọn biến thể chai 473ml và 236ml. | 4 | 3 | **12** *(Vàng)* | **Avoid** | Sáng và Dung chuẩn hóa cấu trúc mảng sản phẩm giữa trang Catalog và Checkout; lấy giá trực tiếp từ backend API. | **Phan Ánh Sáng** | **Materialized (Đã xử lý xong)** |
| **RSK-03** | **Quá tải kết nối Supabase Auth khi 3 thành viên test đồng thời**: Gây chậm phản hồi khi đăng nhập và truy vấn dữ liệu Bác sĩ. | 3 | 3 | **9** *(Vàng)* | **Mitigate** | Hà cấu hình bộ Session Cache cục bộ (`.profiles-cache.json`) cho môi trường dev để giảm 80% số lượng request gửi lên Supabase. | **Trần Thị Ngọc Hà** | **Closed (Đã đóng)** |

---

## 3. BẢNG THEO DÕI RỦI RO ĐỢT 2 — SPRINT 2 (TUẦN 11)

*Cập nhật toàn diện tại mốc Milestone M4 (02/11/2026) khi đối mặt với Biến cố thay đổi phạm vi lớn giữa các thành viên.*

| Mã Rủi Ro | Mô tả rủi ro thực tế phát sinh | P | I | Điểm | Chiến lược | Kế hoạch hành động cụ thể (Action Plan) | Phụ trách (Owner) | Trạng thái (Status) |
| :---: | :--- | :---: | :---: | :---: | :---: | :--- | :---: | :---: |
| **RSK-04** | **Biến cố Thay đổi Phạm vi (Scope Change) giữa các phân hệ**: Tech Lead Hà yêu cầu bổ sung 4 bảng Seller (`shops`, `seller_products`, `seller_orders`, `seller_withdrawals`) và tách riêng từng URL Profile theo vai trò. | 5 | 4 | **20** *(Đỏ)* | **Mitigate** | Nhóm thống nhất phân công: Sáng chủ trì 4 bảng Seller trên nhánh `anhsang`, Dung phụ trách tách 4 URL Profile (`/user/profile`, `/specialist/profile`, `/shop/profile`, `/admin/profile`) và luồng đơn hàng. | **Thùy Dung & Phan Ánh Sáng** | **Materialized (Đã giải quyết)** |
| **RSK-05** | **Ràng buộc cấm thay đổi Schema SQL (Database Boundary)**: Yêu cầu lưu toàn bộ thông tin profile mới vào CSDL nhưng tuyệt đối không được thêm cột vào bảng `public.profiles`. | 4 | 5 | **20** *(Đỏ)* | **Avoid** | Dung và Hà tận dụng trường `items jsonb` có sẵn trong bảng `public.orders` và `user_metadata` của Supabase Auth. Không chạy bất kỳ lệnh `ALTER TABLE` nào. | **Thùy Dung & Trần Thị Ngọc Hà** | **Closed (Tuân thủ 100%)** |
| **RSK-06** | **Rác dữ liệu do đơn hàng treo thanh toán (Stale Unpaid Orders)**: Khách hàng tạo mã QR thanh toán MoMo nhưng không bấm xác nhận, gây tồn đọng đơn ảo chiếm dụng kho của Sáng. | 4 | 3 | **12** *(Vàng)* | **Mitigate** | Xây dựng quy tắc tự động hủy: Kiểm tra `Date.now() - createdAt > 3 * 86400000` (72 giờ); tự động đổi status thành `cancelled`, lưu vào CSDL và thêm nhãn đếm ngược trong giao diện. | **Thùy Dung** | **Closed (Đã hoàn thiện)** |
| **RSK-07** | **Xung đột mã nguồn khi Merge vào nhánh `main`**: Nhiều tính năng cùng sửa đổi thanh điều hướng `site-header` và router. | 4 | 4 | **16** *(Đỏ)* | **Avoid** | Thực thi nguyên tắc Branch Protection: Cấm merge trực tiếp vào `main`; đẩy code Task 1 & 2 lên nhánh `feat/checkout-momo-qr`, mở PR #48 để Tech Lead Hà chủ động review và quyết định merge. | **Trần Thị Ngọc Hà & Thùy Dung** | **Closed (Đã bảo vệ main)** |

---

## 4. TỔNG KẾT ĐÁNH GIÁ NĂNG LỰC QUẢN TRỊ RỦI RO
Toàn bộ 7 rủi ro đều là sự cố kỹ thuật có thật phát sinh trong quá trình phối hợp làm việc giữa Hà, Sáng và Dung. Nhóm WinX đã kiểm soát hiệu quả, không để rủi ro nào làm trễ hạn bàn giao hay gây sập hệ thống (Zero Crash).
