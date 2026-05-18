# 🏁 Horse Racing Tournament Management System - Frontend Monorepo
*(Hệ Thống Quản Lý Giải Đua Ngựa - Phân Hệ Giao Diện)*

Dự án này là phân hệ **Frontend** (giao diện người dùng) của hệ thống Quản lý giải đua ngựa, được tổ chức dưới dạng **Monorepo** bao gồm cả ứng dụng **Web (React)** và ứng dụng **Mobile (Flutter)**.

---

## 📂 Cấu Trúc Dự Án (Project Structure)

Dự án được phân tách thành 2 thư mục chính độc lập và cực kỳ rõ ràng:

```
frontend/
├── web/        # Phân hệ Web Dashboard dành cho Admin, Chủ Ngựa, Kỵ Sĩ, Trọng Tài (React + Vite)
└── mobile/     # Ứng dụng di động dành cho Khán Giả & Giả lập trực tiếp (Flutter)
```

---

## 💻 1. Phân Hệ Web Dashboard (`frontend/web`)
Dành cho các vai trò quản trị, điều hành giải đấu và đăng ký đua.

*   **Công nghệ:** React 19, Vite 8, TypeScript, Axios, React Router v7, Mock Service Worker (MSW) để giả lập APIs.
*   **Hướng dẫn khởi chạy:**
    ```bash
    # Di chuyển vào thư mục web
    cd web

    # Cài đặt thư viện
    npm install

    # Chạy máy chủ phát triển (Local Server)
    npm run dev
    ```
    *Mở trình duyệt truy cập: `http://localhost:5173/`*

---

## 📱 2. Phân Hệ Mobile App (`frontend/mobile`)
Dành cho vai trò Khán Giả theo dõi giải đấu, cược điểm ảo và theo dõi giả lập đua ngựa thời gian thực.

*   **Công nghệ:** Flutter (Dart), State Management bằng Provider, Outfit Font (Google Fonts), Design System tối cao cấp (Carbon Dark Gold).
*   **Hướng dẫn khởi chạy:**
    ```bash
    # Di chuyển vào thư mục mobile
    cd mobile

    # Đồng bộ hóa thư viện Flutter
    flutter pub get

    # Chạy trên thiết bị di động hoặc giả lập Chrome (Khuyên dùng để thuyết trình)
    flutter run -d chrome
    ```

---

## 👥 3. Bản Đồ Phân Chia Nhiệm Vụ Thành Viên (Team Task Division)

Mã nguồn di động đã được tích hợp sẵn cấu trúc **10 Thực thể cốt lõi (Domain Models)** và khung giao diện Spectator chạy Timer. 

Để chia việc cho 5 thành viên trong nhóm làm 5 vai trò khác nhau (Admin, Owner, Jockey, Referee, Spectator), vui lòng đọc hướng dẫn chi tiết tại:
📍 **`mobile/task_division_blueprint.md`**

---

Chúc nhóm của chúng ta hoàn thành dự án xuất sắc và đạt điểm tối đa! 🚀🏆
