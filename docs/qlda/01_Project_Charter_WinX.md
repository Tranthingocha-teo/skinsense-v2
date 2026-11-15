# BÁO CÁO 1: ĐIỀU LỆ DỰ ÁN (PROJECT CHARTER)
**HỌC PHẦN:** QUẢN TRỊ DỰ ÁN PHẦN MỀM (SOFTWARE PROJECT MANAGEMENT)  
**ĐƠN VỊ ĐÀO TẠO:** KHOA KHOA HỌC MÁY TÍNH — TRƯỜNG ĐẠI HỌC CÔNG NGHỆ THÔNG TIN & TRUYỀN THÔNG VIỆT - HÀN (VKU)  
**GIẢNG VIÊN HƯỚNG DẪN:** TS. NGUYỄN THANH TUẤN  
**NHÓM THỰC HIỆN:** **NHÓM WINX** (LỚP HỌC PHẦN QLDA)  
**MÃ DỰ ÁN (PROJECT KEY):** `VKU-SPM-SKINSENSE02`  
**PHIÊN BẢN TÀI LIỆU:** VERSION 1.0 (APPROVED)  

---

## 1. THÔNG TIN CHUNG DỰ ÁN (PROJECT GENERAL INFORMATION)

| Hạng mục | Chi tiết đặc tả |
| :--- | :--- |
| **Tên dự án đầy đủ** | Hệ thống Quản trị Khám da liễu & Sàn Thương mại Dược mỹ phẩm SkinSense v2 |
| **Tên viết tắt / Project Key** | `SkinSense v2` / `VKU-SPM-SKINSENSE02` |
| **Tên nhóm thực hiện** | **Nhóm WinX** (Gồm 3 thành viên: Hà, Dung, Sáng) |
| **Lớp học phần** | Quản trị dự án phần mềm — Học kỳ 1, Năm học 2026-2027 |
| **Kho mã nguồn GitHub (Repository)** | `https://github.com/Tranthingocha-teo/skinsense-v2` |
| **Bảng quản trị dự án (GitHub Projects)** | `https://github.com/Tranthingocha-teo/skinsense-v2/projects/1` |
| **Địa chỉ ứng dụng Live (Production)** | `https://skinsense-v2.vercel.app` (Môi trường HTTPS Cloud Vercel) |

---

## 2. NGUỒN GỐC ĐỀ TÀI & BỐI CẢNH THỰC TẾ (SOURCING PATHWAY)

Nhóm WinX lựa chọn triển khai đồ án theo con đường chính thống được khuyến nghị:
* **[x] Pathway 1: Kế thừa / Song hành cùng Đồ án môn học chuyên ngành Công nghệ Web & Trí tuệ Nhân tạo.**
* **Mô tả bối cảnh:** Dự án bao bọc khung quản trị dự án chuyên nghiệp quanh nền tảng `SkinSense v2`, đánh giá quy trình làm việc thực tế giữa 3 thành viên: phân rã WBS 100% Rule, quản lý rủi ro qua 2 đợt, xử lý thay đổi phạm vi (Scope Change) và gói bằng chứng kiểm toán Git/CI/CD thật 100%.

---

## 3. TỔNG QUAN NGHIỆP VỤ & BÀI TOÁN THỰC TẾ (BUSINESS CASE)

* **Vấn đề cốt lõi:** Người bệnh da liễu gặp khó khăn khi theo dõi phác đồ bôi thuốc tại nhà; thị trường dược mỹ phẩm tràn lan hàng giả; các phòng khám da liễu và nhà thuốc đối mặt với tình trạng tắc nghẽn kho do đơn hàng treo thanh toán quá lâu.
* **Giải pháp của nhóm WinX:** Xây dựng hệ thống toàn diện phân quyền 4 vai trò rõ rệt, tích hợp:
  1. **Cổng Khám Bác sĩ & Bệnh án da liễu:** Do **Trần Thị Ngọc Hà** chủ trì thiết kế và phát triển.
  2. **Kênh Sàn Dược mỹ phẩm & Seller Center 4 bảng:** Do **Phan Ánh Sáng** chủ trì thiết kế và phát triển.
  3. **Cổng Khách hàng, Thanh toán MoMo QR & Quản lý đơn mua tự hủy 3 ngày:** Do **Thùy Dung** chủ trì thiết kế và phát triển.

---

## 4. MỤC TIÊU SMART DỰ ÁN (SMART OBJECTIVES)

1. **Mục tiêu 1 (Khám da liễu & Kê đơn Bác sĩ):** Hoàn thành cổng Bác sĩ chuyên khoa tại `/specialist`, hỗ trợ xem ca bệnh lâm sàng, cảnh báo dị ứng thuốc và chỉ định routine trước Tuần 8 (Phụ trách: Hà).
2. **Mục tiêu 2 (Sàn Dược mỹ phẩm & Kênh Seller 4 bảng):** Triển khai sàn thương mại `/shop` chuẩn Shopee Mall và phân hệ Seller Center dựa trên 4 bảng (`shops`, `seller_products`, `seller_orders`, `seller_withdrawals`) trước Tuần 11 (Phụ trách: Sáng).
3. **Mục tiêu 3 (Hồ sơ 4 Role, Thanh toán MoMo QR & Tự hủy đơn):** Tách riêng 4 URL Profile độc lập, tạo mã MoMo QR tức thời $< 500\text{ms}$ và thực thi quy tắc tự động hủy đơn sau 3 ngày trước Tuần 12 (Phụ trách: Dung).
4. **Mục tiêu 4 (Chất lượng kỹ thuật & Bảo vệ main):** Đạt $100\%$ Conventional Commits, bảo vệ nhánh `main` tuyệt đối, hoàn thành bộ kiểm thử tự động **118/118 unit tests passed** và deploy live Vercel HTTPS trước Tuần 14.

---

## 5. PHẠM VI CAM KẾT (IN-SCOPE & OUT-OF-SCOPE)

### 5.1. Phạm vi thực hiện (In-Scope)
* **Phân hệ Bác sĩ & Admin (Hà phụ trách):**
  * Cổng Bác sĩ da liễu `/specialist`: Danh sách ca bệnh, phân loại Fitzpatrick, cảnh báo dị ứng, hồ sơ bệnh án.
  * Cổng Super Admin `/admin`: Phê duyệt chứng chỉ hành nghề (CCHN) Bác sĩ, kiểm duyệt gian hàng Shop, thống kê GMV toàn sàn.
  * Thiết kế schema CSDL Supabase PostgreSQL và điều hướng `site-header`.
* **Phân hệ Sàn Dược mỹ phẩm & Người bán (Sáng phụ trách):**
  * Sàn thương mại dược mỹ phẩm `/shop`: Danh mục sản phẩm chính hãng (CeraVe, La Roche-Posay, Bioderma), phân loại biến thể chai/tuýp.
  * Phân hệ Kênh Người bán (Seller Center) tích hợp 4 bảng CSDL: `shops` (thông tin gian hàng), `seller_products` (sản phẩm người bán đăng), `seller_orders` (quản lý đơn bán), `seller_withdrawals` (yêu cầu rút tiền doanh thu).
* **Phân hệ Khách hàng, Thanh toán MoMo & QA (Dung phụ trách):**
  * Hồ sơ riêng biệt 4 Role (`/user/profile`, `/specialist/profile`, `/shop/profile`, `/admin/profile`) ở chế độ nhãn (Label Mode), nút Sửa/Lưu trực tiếp vào CSDL không thêm cột.
  * Quản lý đơn mua của User: Lọc 5 trạng thái, ảnh sản phẩm thật, tự động hủy sau 3 ngày chưa thanh toán.
  * Luồng thanh toán MoMo QR thời gian thực: Sinh mã Base64 offline, trang `/pay-demo` quét bằng điện thoại thật.
  * Quản lý tiến độ GitHub Board, điều phối rủi ro và bộ test tự động 118 unit tests Vitest.

### 5.2. Phạm vi không thực hiện (Out-of-Scope)
* Tích hợp thanh toán quốc tế Visa/Mastercard trực tiếp qua cổng Stripe.
* Ứng dụng di động native iOS/Android (tập trung Web Responsive chuẩn PWA).

---

## 6. KẾ HOẠCH CÁC MỐC QUAN TRỌNG (MILESTONES)

| Mốc | Tên mốc kiểm soát | Thời hạn | Trách nhiệm chính |
| :---: | :--- | :---: | :--- |
| **M1** | Điều lệ dự án & Kích hoạt GitHub Board | Tuần 2 | Dung (PM), Hà, Sáng |
| **M2** | Cây WBS & Đường cơ sở lịch trình CPM | Tuần 4 | Dung, Hà, Sáng |
| **M3** | Sprint 1 Review: Cổng Bác sĩ & Sàn mỹ phẩm | Tuần 6 | Hà (Bác sĩ/Admin), Sáng (Shop) |
| **M4** | Sprint 2 Review: Seller Center, Profile & MoMo QR | Tuần 11 | Sáng (Seller), Dung (Profile & MoMo) |
| **M5** | Đóng dự án, Kiểm toán CI/CD & Live Demo | Tuần 14-15 | Cả 3 thành viên Nhóm WinX |

---

## 7. QUY CHUẨN KHO LƯU TRỮ GITHUB & QUẢN TRỊ MÃ NGUỒN

* **Branch Protection:** Cấm push trực tiếp vào `main`. Mọi tính năng phát triển trên các branch riêng (`feat/checkout-momo-qr`, `anhsang`, `feat/specialist-doctor-portal`).
* **Pull Request Workflow:** Bắt buộc có Peer Review từ thành viên khác và CI Actions pass xanh mới được merge.
* **Conventional Commits:** 100% commits bắt buộc dùng chuẩn `feat:`, `fix:`, `test:`, `docs:`.

---

## 8. CƠ CẤU NHÓM WINX — ĐÚNG 3 THÀNH VIÊN & TỶ LỆ ĐÓNG GÓP

| STT | Thành viên | Mã sinh viên | Vai trò kỹ thuật chính | Phân hệ phụ trách thực tế trong dự án | Tỷ lệ đóng góp (%) |
| :---: | :--- | :---: | :--- | :--- | :---: |
| 1 | **Trần Thị Ngọc Hà** | `23IT.B...` | **Technical Lead / System Architect & PO** | Thiết kế kiến trúc Next.js/Supabase, phân hệ Bác sĩ `/specialist`, phân hệ Admin `/admin`, review PR | **33.3%** |
| 2 | **Phan Ánh Sáng** | `23IT.B...` | **Backend / E-commerce & Seller Engineer** | Sàn Dược mỹ phẩm `/shop`, phân hệ Seller Center dựa trên 4 bảng CSDL (`shops`, `seller_products`, `seller_orders`, `seller_withdrawals`) | **33.3%** |
| 3 | **Thùy Dung** | `23IT.B...` | **Project Manager (PM) / Full-stack & QA** | Quản trị tiến độ GitHub Board, phân hệ Profile 4 Role, Quản lý đơn mua tự hủy 3 ngày, MoMo QR, Vitest 118 tests | **33.4%** |

---

## 9. DỰ TOÁN NGÂN SÁCH DỰ ÁN
* **GitHub Organization & CI Actions:** 0 VNĐ (Gói sinh viên).
* **Vercel Serverless Hosting:** 0 VNĐ (Hobby tier).
* **Supabase PostgreSQL Cloud:** 0 VNĐ (Free tier 500MB).
* **Tổng ngân sách:** **0 VNĐ (Tối ưu 100% chi phí).**

---

## 10. CHỮ KÝ PHÊ DUYỆT ĐIỀU LỆ DỰ ÁN

| Technical Lead / PO | Backend & Seller Engineer | Project Manager & QA | Giảng viên hướng dẫn |
| :---: | :---: | :---: | :---: |
| *(Đã ký)* | *(Đã ký)* | *(Đã ký)* | *(Đã duyệt)* |
| **Trần Thị Ngọc Hà** | **Phan Ánh Sáng** | **Thùy Dung** | **TS. Nguyễn Thanh Tuấn** |
