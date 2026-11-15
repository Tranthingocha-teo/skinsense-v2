-- ==============================================================================
-- SkinSense v2 Master Seed Data (Supabase)
-- Thiết kế & Khởi tạo: Trần Thị Ngọc Hà (hattn.23itb@vku.udn.vn)
-- ==============================================================================

-- 1. Master Specialist (BS. CKI Nguyễn Mai Hoa)
insert into public.specialists (
  id, full_name, license_number, specialty, hospital, experience_years,
  phone, email, avatar_url, status, bio, rating, review_count, cases_count, approved_by
) values (
  'spec_01',
  'BS. CKI Nguyễn Mai Hoa',
  '014289/BYT-CCHN',
  'Chuyên khoa Da liễu & Thẩm mỹ Da',
  'Bệnh viện Da Liễu Trung Ương',
  10,
  '0905 123 456',
  'maihoa.dermatology@skinsense.vn',
  'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&auto=format&fit=crop&q=80',
  'approved',
  'Hơn 10 năm kinh nghiệm điều trị mụn trứng cá chuyên sâu, phục hồi hàng rào màng đáy da nhạy cảm và điều trị tăng sắc tố sau viêm.',
  5.0,
  142,
  890,
  'Trần Thị Ngọc Hà (Super Admin)'
) on conflict (id) do update set
  full_name = excluded.full_name,
  license_number = excluded.license_number,
  status = excluded.status;

-- 2. Master Shopee Mall Skincare Products
insert into public.products (
  id, name, brand, category, price, original_price, image_url,
  rating, sold_count, stock_count, sku, volume, origin, skin_type, license_no, description, is_approved
) values
(
  'prod_01',
  'Nước Tẩy Trang Bioderma Sensibio H2O Micellar Dịu Nhẹ Cho Da Nhạy Cảm 500ml',
  'Bioderma',
  'Nước tẩy trang',
  485000,
  520000,
  'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=600&auto=format&fit=crop&q=80',
  5.0,
  12850,
  450,
  'BIO-H2O-500',
  '500ml',
  'Pháp (France)',
  'Da nhạy cảm, da mụn',
  '12345/21/CBMP-QLD',
  'Công nghệ hạt Micellar sinh học làm sạch sâu 99% bụi mịn và lớp trang điểm mà không gây tổn thương hàng rào lipid.',
  true
),
(
  'prod_02',
  'Sữa Rửa Mặt CeraVe Hydrating Cleanser Dưỡng Ẩm Chuyên Sâu 473ml',
  'CeraVe',
  'Sữa rửa mặt',
  379000,
  420000,
  'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=600&auto=format&fit=crop&q=80',
  4.9,
  9400,
  320,
  'CRV-HYD-473',
  '473ml',
  'Mỹ (USA)',
  'Da thường đến da khô, nhạy cảm',
  '98765/20/CBMP-QLD',
  'Chứa 3 Ceramides thiết yếu (1, 3, 6-II) và Hyaluronic Acid giúp phục hồi hàng rào bảo vệ da, cân bằng pH 5.5.',
  true
),
(
  'prod_03',
  'Kem Dưỡng Giảm Mụn La Roche-Posay Effaclar Duo+M Ngừa Thâm Trong 8H 40ml',
  'La Roche-Posay',
  'Kem dưỡng đặc trị',
  475000,
  525000,
  'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=600&auto=format&fit=crop&q=80',
  5.0,
  15200,
  600,
  'LRP-DUO-40',
  '40ml',
  'Pháp (France)',
  'Da dầu mụn, bít tắc chân lông',
  '54321/22/CBMP-QLD',
  'Công thức cải tiến với Phylobioma giúp kiểm soát vi khuẩn mụn C.acnes, làm dịu vết sưng đỏ sau 8 giờ.',
  true
),
(
  'prod_04',
  'Dung Dịch Tẩy Tế Bào Chết Hóa Học Paula''s Choice Skin Perfecting 2% BHA Liquid 118ml',
  'Paula''s Choice',
  'Serum đặc trị',
  799000,
  949000,
  'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=600&auto=format&fit=crop&q=80',
  4.9,
  8700,
  210,
  'PC-BHA-118',
  '118ml',
  'Mỹ (USA)',
  'Mọi loại da, da bít tắc chân lông',
  '67890/21/CBMP-QLD',
  'Salicylic Acid 2% hòa tan bã nhờn, làm sạch sâu lỗ chân lông, ngăn ngừa mụn đầu đen và mụn ẩn hiệu quả.',
  true
),
(
  'prod_05',
  'Kem Chống Nắng Kiểm Soát Dầu La Roche-Posay Anthelios UVMune 400 SPF50+ 50ml',
  'La Roche-Posay',
  'Kem chống nắng',
  465000,
  510000,
  'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=600&auto=format&fit=crop&q=80',
  5.0,
  18900,
  530,
  'LRP-UVM-50',
  '50ml',
  'Pháp (France)',
  'Da dầu, hỗn hợp thiên dầu',
  '11223/23/CBMP-QLD',
  'Màng lọc độc quyền Mexoryl 400 bảo vệ da trước tia UVA siêu dài 380-400nm, công nghệ Netlock kháng nước kháng mồ hôi tối ưu.',
  true
)
on conflict (id) do update set
  name = excluded.name,
  price = excluded.price,
  stock_count = excluded.stock_count;

-- 3. Master Orders
insert into public.orders (
  id, order_code, customer_name, customer_phone, shipping_address,
  total_amount, status, carrier, tracking_code, items
) values (
  'ord_01',
  'SKIN-20261114-001',
  'Trần Thị Ngọc Hà',
  '0905 888 999',
  'Hải Châu, Đà Nẵng',
  940000,
  'processing',
  'Shopee Express Fast',
  'SPX-VN-9823419',
  '[{"id": "prod_03", "name": "Kem Dưỡng La Roche-Posay Duo+M", "quantity": 1, "price": 475000}, {"id": "prod_05", "name": "Kem Chống Nắng La Roche-Posay UVMune 400", "quantity": 1, "price": 465000}]'::jsonb
) on conflict (id) do update set
  status = excluded.status;
