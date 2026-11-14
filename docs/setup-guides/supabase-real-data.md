# Thiết Lập Cơ Sở Dữ Liệu Thực Tế Supabase & Phác Đồ Y Khoa SkinSense v2

**Tác giả & Kiến trúc sư hệ thống:** Trần Thị Ngọc Hà (Super Admin - `hattn.23itb@vku.udn.vn` / `@Tranthingocha-teo`)  
**Ngày cập nhật:** 15/11/2026  
**Dự án:** SkinSense v2 (VKU Software Engineering)

---

## 1. Tổng quan kiến trúc dữ liệu Supabase

Hệ thống SkinSense v2 sử dụng dịch vụ Supabase Cloud kết hợp PostgreSQL, Row Level Security (RLS) và Supabase Storage với các phân hệ chính:

1. **Phân quyền 4 vai trò (`profiles`):**
   - `admin`: Super Admin Trần Thị Ngọc Hà (`hattn.23itb@vku.udn.vn`), toàn quyền hệ thống.
   - `specialist`: Bác sĩ Da liễu được cấp chứng chỉ hành nghề (yêu cầu admin duyệt).
   - `shop`: Chủ gian hàng Shopee Mall Dược mỹ phẩm.
   - `customer`: Người dùng theo dõi sức khỏe da mặt và thực hiện phác đồ điều trị.

2. **Cổng Bác sĩ Chuyên khoa (`specialists`):**
   - Lưu trữ số giấy phép hành nghề Bộ Y Tế, số ca đã điều trị, điểm đánh giá và lịch khám.
   - Bác sĩ chủ chốt: **BS. CKI Nguyễn Mai Hoa** (CCHN: 014289/BYT-CCHN).

3. **Gian hàng Dược mỹ phẩm Shopee Mall (`products` & `orders`):**
   - Dược mỹ phẩm chuẩn y khoa: Bioderma, CeraVe, La Roche-Posay, Paula's Choice.
   - Đơn hàng gắn mã vận đơn Shopee Express tự động.

4. **Phác đồ Y khoa & Routine cá nhân hóa (`routine_items` & `routine_entries`):**
   - File phác đồ gốc: `supabase://photos/real_routine_protocol.json`.
   - Phân biệt chu trình Buổi Sáng (`morning`) vs Buổi Tối (`evening`).
   - Tích hoàn thành từng bước lưu trữ trực tiếp vào Supabase Postgres.

---

## 2. Thông tin kết nối & Biến môi trường

```env
NEXT_PUBLIC_SUPABASE_URL=https://gzecjsqnehgrvkgnznec.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 3. Cách khởi tạo & Cập nhật dữ liệu mẫu

Chạy script tự động:
```bash
bun run scripts/setup-real-supabase.ts
```
Hoặc nạp trực tiếp qua Supabase SQL Editor:
- `supabase/schema.sql` (Tạo bảng & RLS policies)
- `supabase/seed.sql` (Nạp master data chuẩn)
