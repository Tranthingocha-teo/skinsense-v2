# BÁO CÁO 5: BỘ SLIDE BẢO VỆ ĐỒ ÁN & BẢNG TỰ CHẤM THEO RUBRIC
**HỌC PHẦN:** QUẢN TRỊ DỰ ÁN PHẦN MỀM (SPM) — VKU  
**DỰ ÁN:** SKINSENSE V2 (`VKU-SPM-SKINSENSE02`)  
**NHÓM THỰC HIỆN:** **NHÓM WINX (3 THÀNH VIÊN: HÀ, SÁNG, DUNG)**  
**QUY CÁCH THỜI GIAN:** 16 PHÚT NGHIÊM NGẶT (6 PHÚT SLIDE · 5 PHÚT LIVE DEMO · 5 PHÚT HỎI ĐÁP)  

---

# PHẦN 1: BỘ NỘI DUNG 10 SLIDES THUYẾT TRÌNH BẢO VỆ (10-SLIDE DECK)

### SLIDE 1: TRANG TIÊU ĐỀ & ĐỘI NGŨ THỰC HIỆN (NHÓM WINX)
* **Tiêu đề lớn:** HỆ THỐNG QUẢN LÝ KHÁM DA LIỄU & SÀN DƯỢC MỸ PHẨM SKINSENSE V2
* **Mã dự án:** `VKU-SPM-SKINSENSE02`
* **Nhóm thực hiện:** **Nhóm WinX** (Lớp học phần Quản trị dự án phần mềm)
* **Nguồn gốc đề tài:** *Pathway 1 — Kế thừa & Song hành Đồ án chuyên ngành Web & AI Engineering*
* **Cơ cấu 3 thành viên & Phân công vai trò kỹ thuật chuẩn:**
  * **Trần Thị Ngọc Hà:** Technical Lead / System Architect & PO (33.3%) — Phụ trách Cổng Bác sĩ `/specialist`, Admin `/admin` & Kiến trúc CSDL.
  * **Phan Ánh Sáng:** Backend / E-commerce & Seller Center Engineer (33.3%) — Phụ trách Sàn Dược Mỹ phẩm `/shop` & Kênh Người Bán 4 bảng.
  * **Thùy Dung:** Project Manager / Full-stack & QA Engineer (33.4%) — Phụ trách Hồ sơ 4 Role, Đơn mua tự hủy 3 ngày, MoMo QR & Bộ test 118 ca.
* **Giảng viên hướng dẫn:** TS. Nguyễn Thanh Tuấn

---

### SLIDE 2: BỐI CẢNH THỰC TẾ & BÀI TOÁN NGHIỆP VỤ (BUSINESS CASE)
* **Thực trạng ngành Da liễu & Mỹ phẩm:**
  * Bệnh nhân lúng túng khi thực hiện phác đồ bôi thuốc tại nhà, tỷ lệ tái phát mụn cao.
  * Thị trường tràn lan dược mỹ phẩm giả mạo gây kích ứng da nghiêm trọng.
  * Các phòng khám và nhà thuốc đối mặt với tình trạng tắc nghẽn kho do đơn hàng treo thanh toán quá lâu.
* **Giải pháp phần mềm SkinSense v2 của 3 thành viên:**
  * Cổng Bác sĩ số hóa phác đồ điều trị da liễu chuẩn y khoa (Hà).
  * Sàn thương mại Shopee Mall chính hãng & Kênh người bán 4 bảng (Sáng).
  * Cổng khách hàng, thanh toán MoMo QR tức thời và tự động hủy đơn sau 3 ngày (Dung).

---

### SLIDE 3: KIẾN TRÚC HỆ THỐNG & CƠ CẤU PHÂN RÃ WBS (100% RULE)
* **Kiến trúc công nghệ hiện đại:**
  * Frontend: Next.js 15 (App Router), React 19, Tailwind CSS.
  * Backend & Database: Next.js API Routes, Supabase PostgreSQL, Row Level Security (RLS).
  * Thanh toán & QR Engine: `qrcode` Base64 Offline, tương thích mạng LAN máy dev.
* **Phân rã WBS tuân thủ 100% Rule giữa 3 thành viên:**
  * `1.1` Quản trị dự án Agile/Scrum (Dung).
  * `1.2` CSDL Supabase & Phân hệ Bác sĩ / Super Admin (Hà).
  * `1.3` Sàn Dược Mỹ phẩm & Phân hệ Người bán 4 bảng CSDL (Sáng).
  * `1.4` Hồ sơ 4 Role riêng biệt & Quản lý đơn mua tự hủy sau 3 ngày (Dung).
  * `1.5` Thanh toán MoMo QR thời gian thực & Bộ kiểm thử Vitest 118 tests (Dung).

---

### SLIDE 4: CHỈ SỐ THỰC THI DỰ ÁN (PROJECT VELOCITY & METRICS)
* **Chỉ số năng suất đội ngũ (Velocity):**
  * Sprint 1 (Tuần 1–6): Đạt 38 Story Points ($90.4\%$ cam kết 42 điểm).
  * Sprint 2 (Tuần 7–12): Đạt 52 Story Points ($108.3\%$ cam kết 48 điểm).
  * Vận tốc trung bình ổn định: **45 Story Points / Sprint**.
* **Hiệu quả quản trị mã nguồn trên GitHub:**
  * Tổng số Pull Requests được thẩm duyệt và đóng: **8 PRs** (PR #32, #48, #49, #58, #59,...).
  * Tỷ lệ tuân thủ Conventional Commits: $100\%$.
  * Tình trạng nhánh `main`: Được bảo vệ tuyệt đối, $0$ commit trái phép.

---

### SLIDE 5: BIẾN CỐ QUẢN LÝ LỚN NHẤT ĐÃ GIẢI QUYẾT (RISK & SCOPE CHANGE)
* **Biến cố Thay đổi phạm vi thực tế (Tuần 11):**
  * Tech Lead Hà yêu cầu bổ sung 4 bảng Seller (`shops`, `seller_products`, `seller_orders`, `seller_withdrawals`), tách riêng 4 URL Profile theo từng role và cấm sửa đổi cột CSDL ban đầu.
* **Giải pháp phối hợp của Nhóm WinX:**
  * Kích hoạt quy trình kiểm soát thay đổi phạm vi (Scope Change Control Record `CR-2026-02`).
  * Sáng tiếp quản hoàn thiện 4 bảng Seller trên nhánh `anhsang`.
  * Dung phụ trách tách riêng 4 URL Profile, quản lý đơn mua và cơ chế tự động hủy sau 3 ngày trên nhánh `feat/checkout-momo-qr`.
  * Tận dụng trường `items jsonb` và Supabase Auth `user_metadata` để lưu thông tin mà không cần chạy `ALTER TABLE`.
  * Đóng gói hoàn chỉnh trong commit `37ce301`, tạo Issue #60 và cập nhật thành công vào PR #48.

---

### SLIDE 6: KẾT QUẢ KIỂM THỬ TỰ ĐỘNG & BẢO ĐẢM CHẤT LƯỢNG (QA & CI/CD)
* **Kết quả kiểm thử tự động với Vitest:**
  * Tổng số file kiểm thử: **28/28 test files PASS** ($100\%$).
  * Tổng số ca kiểm thử đơn vị: **118/118 unit tests PASS** ($100\%$).
  * Lỗi TypeScript Compiler: **0 lỗi** (`bun run typecheck` đạt mã thoát 0).
* **Đường ống tự động hóa GitHub Actions:**
  * Tự động chạy Lint $\rightarrow$ Typecheck $\rightarrow$ Unit test trên mỗi Pull Request.
  * Tự động deploy bản xem trước (Preview Deployment) trên Vercel khi test pass xanh.

---

### SLIDE 7: KẾT QUẢ NGHIỆM THU NGƯỜI DÙNG THỰC TẾ (UAT SIGN-OFF)
* **Kiểm thử chấp nhận người dùng (User Acceptance Testing - UAT):**
  * 15 người dùng thực tế tham gia trải nghiệm toàn bộ luồng giá trị cốt lõi.
  * $100\%$ xác nhận giao diện Profile dạng nhãn (Label Mode) trang nhã, đúng tông màu y tế `#2D5A43`.
  * $100\%$ đánh giá cao tính năng tự động hủy đơn sau 3 ngày và cảnh báo hạn thanh toán đếm ngược.
* **Người thụ hưởng nghiệm thu:**
  * Khách hàng trải nghiệm và Product Owner Trần Thị Ngọc Hà đã ký xác nhận biên bản nghiệm thu UAT.

---

### SLIDE 8: BÀI HỌC KINH NGHIỆM XƯƠNG MÁU (TOP LESSONS LEARNED)
1. **Phân chia ranh giới rõ ràng:** Chia tách độc lập giữa Bác sĩ/Admin (Hà), Seller/Shop (Sáng) và Profile/Thanh toán/QA (Dung) giúp 3 người làm việc song song không bị xung đột.
2. **Kỷ luật Git cứu sống dự án:** Branch Protection và Peer Review giúp nhóm phát hiện sớm các xung đột trước khi chúng lọt vào nhánh chính.
3. **Linh hoạt trong kiến trúc CSDL:** Tận dụng kiểu dữ liệu `jsonb` giúp mở rộng tính năng nhanh chóng mà không làm vỡ schema SQL.

---

### SLIDE 9: KỊCH BẢN BẢO VỆ LIVE DEMO (5 PHÚT — TOÀN BỘ 3 PHÂN HỆ)
* **Phút 1 (Phân hệ Bác sĩ & Admin của Hà):**
  * Đăng nhập Bác sĩ tại `/specialist`: Xem danh sách ca bệnh lâm sàng, tiền sử dị ứng, loại da Fitzpatrick và kê đơn routine.
  * Đăng nhập Admin tại `/admin`: Xem dashboard thống kê GMV sàn, duyệt Bác sĩ CCHN.
* **Phút 2 (Phân hệ Sàn Dược Mỹ phẩm & Người bán của Sáng):**
  * Vào sàn `/shop`: Xem danh mục sản phẩm chính hãng (CeraVe, Bioderma), chọn dung tích chai đổi giá đúng, giới thiệu hệ thống 4 bảng Seller Center.
* **Phút 3-5 (Phân hệ Profile, Đơn mua & MoMo QR của Dung):**
  * Vào `/shop/checkout` đặt hàng $\rightarrow$ Sinh mã MoMo QR tức thì.
  * Dùng điện thoại thật quét mã QR $\rightarrow$ Xác nhận trên `/pay-demo` $\rightarrow$ Màn hình máy tính chuyển sang *Thanh toán thành công*.
  * Vào 4 trang Profile riêng biệt (`/user/profile`, `/specialist/profile`, `/shop/profile`, `/admin/profile`) ở chế độ nhãn (Label Mode).
  * Xem tab "Đơn Mua Của Tôi": Có ảnh sản phẩm thật sắc nét, cảnh báo hạn thanh toán đếm ngược và đơn quá hạn 3 ngày tự động hủy.

---

### SLIDE 10: TỔNG KẾT & MỜI HỘI ĐỒNG ĐẶT CÂU HỎI (Q&A)
* **Kho lưu trữ GitHub:** `https://github.com/Tranthingocha-teo/skinsense-v2`
* **Địa chỉ ứng dụng Live:** `https://skinsense-v2.vercel.app`
* **Thư mục minh chứng Google Drive:** Mở quyền xem công khai $100\%$.
* *Nhóm WinX (Hà, Sáng, Dung) xin chân thành cảm ơn Thầy TS. Nguyễn Thanh Tuấn và Hội đồng chuyên môn!*

---

# PHẦN 2: BẢNG TỰ ĐÁNH GIÁ THEO RUBRIC CHẤM ĐIỂM HỘI ĐỒNG (THANG 10)

| Tiêu chuẩn đánh giá | Trọng số | Minh chứng thực tế của 3 thành viên Nhóm WinX | Tự chấm điểm |
| :--- | :---: | :--- | :---: |
| **Cổng chân thực (Authenticity Gate)** | **Pass / Fail** | • Repo thật, commit trải đều 15 tuần của cả 3 thành viên Hà, Sáng, Dung.<br>• Chạy thực tế trên Vercel HTTPS và Supabase Cloud.<br>• Giải quyết xuất sắc biến cố thay đổi phạm vi ở Tuần 11. | **PASS** |
| **1. Tính đầy đủ & Khả thi của kế hoạch** | **30%** | • Project Charter chuẩn 13 mục PMBOK có chữ ký PO & Thầy.<br>• Cây WBS và Từ điển WBS phân rã chuẩn 100% Rule cho 3 thành viên.<br>• Bảng theo dõi rủi ro cập nhật qua 2 đợt rõ rệt (Tuần 6 & 11). | **9.8 / 10** |
| **2. Sự phù hợp phương pháp luận** | **20%** | • Áp dụng mô hình Hybrid Agile/Scrum có căn cứ khoa học.<br>• Duy trì GitHub Projects Board 5 cột và biểu đồ Burndown.<br>• Có biên bản họp Sprint 1 Retro và Final Retro (mô hình 4Ls). | **9.6 / 10** |
| **3. Bằng chứng thực thi thực tế** | **30%** | • 8 Pull Requests có review và tự động kiểm thử.<br>• Bộ test tự động Vitest đạt **118/118 tests passed (100%)**.<br>• Hồ sơ Change Request xử lý MoMo QR & 4 bảng Seller đầy đủ. | **10.0 / 10** |
| **4. Thuyết trình, Live Demo & Q&A** | **20%** | • Slide 10 trang cấu trúc khoa học, kịch bản demo kết nối cả 3 phân hệ.<br>• Kịch bản Live Demo thời gian thực mượt mà (Zero Crash).<br>• Tự tin bảo vệ các quyết định kỹ thuật trước Hội đồng. | **9.8 / 10** |
| **TỔNG ĐIỂM TỰ ĐÁNH GIÁ DỰ ÁN** | **100%** | **Toàn bộ hồ sơ kiểm toán minh bạch, khách quan của Nhóm WinX** | **9.8 / 10** |
