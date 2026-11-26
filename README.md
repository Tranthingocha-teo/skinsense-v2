# 🌸 LAVIEM – Hệ thống Phân tích Tình trạng Da Sử dụng AI
> **AI-Powered Skin Analysis & Skincare Recommendation System**

[![Dự án VKU](https://img.shields.io/badge/D%E1%BB%B1%20%C3%A1n-VKU%20--%20%C4%90%E1%BB%93%20%C3%A1n%20Chuy%C3%AAn%20ng%C3%A0nh%202-blue?style=for-the-badge)](https://vku.udn.vn)
[![Tech Stack](https://img.shields.io/badge/Stack-React%20Native%20%7C%20Next.js%20%7C%20Python%20%7C%20TensorFlow-brightgreen?style=for-the-badge)](#-c%C3%B4ng-ngh%E1%BB%87-s%E1%BB%AD-d%E1%BB%A5ng-tech-stack)
[![Repo](https://img.shields.io/badge/GitHub-laviem--ai--skin--analysis-black?style=for-the-badge&logo=github)](https://github.com/dinhthianhsang/laviem-ai-skin-analysis)

---

## 📌 Giới thiệu Dự án

**LAVIEM** là **Hệ thống Phân tích Tình trạng Da Sử dụng Trí tuệ Nhân tạo (AI)**, được nghiên cứu và phát triển trong khuôn khổ **Đồ án Chuyên ngành 2** thuộc Khoa Khoa học Máy tính, Trường Đại học Công nghệ Thông tin và Truyền thông Việt - Hàn (VKU).

Hệ thống ứng dụng các kỹ thuật Xử lý ảnh (Computer Vision) và Học sâu (Deep Learning / CNN) để phân tích hình ảnh khuôn mặt người dùng, nhận diện các vấn đề về da phổ biến như **da dầu, da khô, mụn, thâm, da nhạy cảm** với độ chính xác mục tiêu từ **85% – 91%**. Dựa trên kết quả phân tích, LAVIEM tự động cá nhân hóa lộ trình chăm sóc da (skincare routine), gợi ý mỹ phẩm phù hợp, hỗ trợ tích hợp xem chi tiết & đặt mua trực tiếp và lưu trữ lịch sử theo dõi sự cải thiện của làn da theo thời gian.

---

## ✨ Tính năng Chính

### 📱 1. Ứng dụng Di động dành cho Người dùng (Mobile App)
- 📸 **Chụp & Phân tích Ảnh Da bằng AI**: Chụp ảnh trực tiếp hoặc tải ảnh từ thư viện với khung hướng dẫn định vị khuôn mặt chuẩn thời gian thực (sử dụng MediaPipe / TFLite / OpenCV).
- 🔍 **Đánh giá Tình trạng Da**: Nhận diện vùng mẩn đỏ, nốt mụn, loại da và hiển thị chỉ số sức khỏe da chi tiết theo từng vùng trên khuôn mặt.
- 📋 **Lộ trình Skincare Cá nhân hóa**: Đề xuất danh mục sản phẩm và quy trình chăm sóc da sáng / tối được thiết kế riêng cho từng tình trạng da.
- 🛍️ **Cửa hàng & Gợi ý Mỹ phẩm (Boutique & Marketplace)**: Xem chi tiết sản phẩm mỹ phẩm chính hãng, đọc đánh giá và thực hiện đặt mua trực tiếp trên ứng dụng.
- 📈 **Lịch sử & Xu hướng Cải thiện Da**: Theo dõi tiến trình thay đổi của da theo ngày/tháng với biểu đồ trực quan và công cụ so sánh ảnh trước/sau (Before & After).

### 🖥️ 2. Trang Quản trị Hệ thống (Admin Web Portal)
- 👥 **Quản lý Người dùng & Phân quyền**: Quản lý danh sách tài khoản, phân quyền quản trị viên (Admin), chuyên gia/bác sĩ da liễu, gian hàng đối tác (Partner) và người dùng cuối.
- 🩺 **Quản lý Dữ liệu Phân tích Da**: Xem lịch sử kết quả phân tích AI, hồ sơ da của người dùng và quản lý lời khuyên chuyên gia.
- 🛍️ **Quản lý Danh mục & Sản phẩm Mỹ phẩm (CRUD)**: Thêm, sửa, xóa, quản lý tồn kho và thiết lập danh mục mỹ phẩm chính hãng.
- 📦 **Quản lý Đơn hàng & Doanh thu**: Sàn giao dịch mỹ phẩm, xử lý đơn hàng từ người mua, quản lý trạng thái thanh toán & rút tiền của đối tác.
- 📊 **Báo cáo Thống kê**: Thống kê doanh thu, số lượng lượt phân tích da và xu hướng người dùng.

---

## 🛠️ Công nghệ Sử dụng (Tech Stack)

### 🎨 Frontend & Mobile App
- **Mobile App**: React Native (Expo SDK 52), Expo Router (File-based Routing), NativeWind / Tailwind CSS, React Native Vision Camera, Fast-TFLite.
- **Admin Web & Landing Page**: Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS, Lucide Icons, Shadcn UI / Radix UI, Three.js / React Three Fiber (Mô hình 3D).

### 🧠 Backend, AI & Computer Vision
- **AI Core & Computer Vision**:
  - **Mô hình AI**: CNN (MobileNetV2 Transfer Learning), TensorFlow / Keras, OpenCV, Pillow.
  - **Xử lý trên thiết bị (On-Device ML)**: MediaPipe Task Vision, TFLite (TensorFlow Lite) nhận diện và căn chỉnh khuôn mặt thời gian thực.
- **Backend API**: Python (FastAPI / PyTorch / TensorFlow) tích hợp cho module AI inference cao cấp.
- **Cơ sở dữ liệu & Serverless Backend**: Supabase (PostgreSQL, Row Level Security - RLS, Storage Bucket, Edge Functions) kết hợp định hướng kết nối Firebase Authentication / Cloud Firestore.
- **Kiến trúc Dự án**: Turborepo Monorepo (Quản lý đa gói `@skinsense/domain`, `@skinsense/tokens`, `apps/web`, `apps/mobile`) sử dụng Bun Package Manager.

---

## 📁 Cấu trúc Thư mục Dự án

```
laviem-ai-skin-analysis/
├── apps/
│   ├── mobile/             # Ứng dụng Mobile React Native (Expo)
│   │   ├── src/app/        # Các màn hình chính (Tabs, Authentication, Routine, Settings)
│   │   ├── src/components/ # UI Components (Capture, Spot Marker, Marketplace, Admin Portal)
│   │   └── package.json
│   └── web/                # Trang Admin Web & Landing Page (Next.js 16)
│       ├── src/app/        # App Router (Dashboard, Case Study, Demo, Dev tools)
│       ├── src/components/ # Web UI Components & Three.js 3D Models
│       └── package.json
├── packages/
│   ├── domain/             # Logic nghiệp vụ chung, thuật toán xử lý vùng da & Drizzle ORM Schema
│   └── tokens/             # Design System Tokens (Color, Typography) chia sẻ giữa Web & Mobile
├── scripts/                # Utility scripts (Kiểm tra môi trường doctor, seed dữ liệu)
├── supabase/               # Migrations, Edge Functions & RLS Policies
├── package.json            # Root configuration (Turborepo + Bun Workspaces)
└── README.md
```

---

## 🚀 Hướng dẫn Cài đặt & Khởi chạy Dự án

### 📋 Yêu cầu Môi trường
- **Bun** (v1.1+) hoặc **Node.js** (v20+)
- **Git**
- **Android Studio** & Android Emulator / Thiết bị Android thật (đối với ứng dụng Mobile)

### 1️⃣ Cài đặt Dependencies

```bash
# Clone repository về máy
git clone https://github.com/dinhthianhsang/laviem-ai-skin-analysis.git
cd laviem-ai-skin-analysis

# Cài đặt toàn bộ dependencies cho tất cả workspaces
bun install  # hoặc npm install
```

### 2️⃣ Kiểm tra Môi trường Dự án

Chạy script kiểm tra sức khỏe môi trường và kết nối backend:
```bash
bun run doctor
```

### 3️⃣ Cấu hình Biến Môi trường (.env)

Tạo file môi trường cho ứng dụng Web và Mobile từ các file mẫu:
- **Web**: Sao chép `apps/web/.env.example` thành `apps/web/.env.local`
- **Mobile**: Sao chép `apps/mobile/.env.example` thành `apps/mobile/.env`

Nội dung biến môi trường cơ bản:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-supabase-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
EXPO_PUBLIC_SUPABASE_URL=https://your-supabase-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```
*(Lưu ý: Nếu chưa cấu hình Supabase, hệ thống sẽ tự động chạy ở chế độ **Backend-free Demo Mode** mà không bị lỗi).*

### 4️⃣ Khởi chạy Ứng dụng

#### 🌐 Khởi chạy Admin Web & Landing Page (Next.js):
```bash
# Khởi chạy giao diện Web
cd apps/web
bun dev
```
Mở trình duyệt tại địa chỉ: [http://localhost:3000](http://localhost:3000)

#### 📱 Khởi chạy Ứng dụng Mobile (Expo Android):
```bash
# Khởi chạy Expo Metro Bundler
cd apps/mobile
bun run start
```
- Nhấn `a` trong terminal để mở trên Android Emulator.
- Hoặc quét mã QR bằng ứng dụng Expo Go trên điện thoại thực.

#### 🧪 Chạy Kiểm thử & Kiểm tra Type (Typecheck & Unit Tests):
```bash
# Kiểm tra TypeScript trong toàn bộ monorepo
bun run typecheck

# Chạy Unit Tests (Vitest cho Domain/Web & Jest cho Mobile)
bun run test
```

---

## 👥 Đội ngũ Thực hiện & Hướng dẫn

### 🎓 Giảng viên Hướng dẫn
- **TS. Nguyễn Đức Hiển** – Khoa Khoa học Máy tính, Trường Đại học CNTT & TT Việt - Hàn (VKU)

### 👩‍💻 Nhóm Sinh viên Thực hiện
**Lớp 23JIT – Ngành Công nghệ Phần mềm Song ngữ Nhật - Việt (VKU):**

| STT | Họ và Tên | MSSV | Vai trò & Nhiệm vụ Phụ trách |
| :---: | :--- | :---: | :--- |
| **1** | **Từ Thị Thanh Hương** *(Nhóm trưởng)* | **23IT117** | • Phụ trách Phát triển Backend API<br>• Tích hợp Module AI & Xử lý Inference<br>• Kiểm thử hệ thống (Testing & QA) |
| **2** | **Đinh Thị Ánh Sáng** | **23IT.EB084** | • Thiết kế Kiến trúc Hệ thống & Cơ sở dữ liệu<br>• Phát triển Ứng dụng Di động (Mobile App UI/UX)<br>• Tích hợp Luồng Phân tích Da & Chụp ảnh |
| **3** | **Nguyễn Thị Tú Quyên** | **23IT229** | • Thu thập & Tiền xử lý Dữ liệu Hình ảnh Da<br>• Huấn luyện Mô hình AI (Training Model CNN)<br>• Phát triển Giao diện Quản trị (Admin Web Portal) |

---

## 📜 Giấy phép & Bản quyền

Dự án được bảo hộ bản quyền thuộc về **Đội ngũ Thực hiện LAVIEM** – Lớp 23JIT, Trường Đại học Công nghệ Thông tin và Truyền thông Việt - Hàn (VKU).
