# Tổng quan Dự án: Hệ thống Quản lý Đua Ngựa (Frontend)

File này lưu trữ ngữ cảnh toàn bộ kiến trúc, logic nghiệp vụ cốt lõi, và cấu trúc API của Frontend. Hãy đọc file này trước tiên để hiểu dự án mà không cần phải quét lại toàn bộ source code.

## 1. Công nghệ (Tech Stack)
- **Framework**: React 18 + Vite, TypeScript.
- **Routing**: React Router DOM v6 (`createBrowserRouter`).
- **Styling**: TailwindCSS, CSS Modules.
- **Icons**: `lucide-react`.
- **State Management**: React state hooks cơ bản, Context API (`SessionContext` cho auth).

## 2. Các Vai trò (Roles)
- **Admin**: Quản lý toàn bộ hệ thống (User, Giải đấu, Ngựa, Duyệt đăng ký, Chia bảng, Lên lịch).
- **Spectator**: Người xem bình thường (Xem giải đấu, Đặt cược/Dự đoán, Xem kết quả, Bảng xếp hạng).
- **Race Referee**: Trọng tài (Xác nhận kết quả đua, Báo cáo vi phạm).
- **Jockey**: Nài ngựa.

## 3. Các Luồng Nghiệp vụ Cốt lõi (Core Business Logic)

### 3.1. Quản lý Giải đấu và Chia Bảng (Tournament & Bracket)
- **File chính**: `AdminSchedulingPage.tsx` (Admin), `TournamentBracketView.tsx` (Shared UI), `TournamentDetailPage.tsx` (Spectator).
- **Logic Chia Bảng (Bracket Generation)**:
  - Chia bảng động dựa trên số ngựa đăng ký (`N`) và số ngựa tối đa 1 bảng (`MAX` - mặc định 8).
  - Số bảng = `Math.ceil(N / MAX)`.
  - Số ngựa đi tiếp thẳng = `Math.floor(MAX / Số bảng)`. BE sẽ xử lý phần lấy thêm ngựa có thành tích tốt nhất (fastest losers/wildcards) nếu cần để làm đầy vòng tiếp theo.
  - Các vòng đấu: Vòng Loại (Vòng 1, Vòng 2...) -> Tứ Kết -> Bán Kết -> Chung Kết.
- **Logic Lấy Ngựa Thắng Vào Vòng Trong (Advancing Winners)**:
  - Admin bấm `Tạo Vòng X`.
  - FE gọi `GET /results/races/{raceId}` để lấy danh sách kết quả. Hỗ trợ nhiều định dạng response (`data.results`, `data.rankings`, `data.raceResults`, array trực tiếp).
  - Sort danh sách kết quả tăng dần theo `position ?? rank ?? finalPosition ?? 999`. Nhất = position 1.
  - Lấy Top N con đầu tiên (dựa vào `topAdvance` của bracket).
  - Gọi `GET /races/{raceId}/horses` để lấy danh sách ngựa trong race. Map `horseId` từ kết quả thi đấu sang `registrationId` để truyền cho BE lên lịch vòng tiếp theo. Hỗ trợ nhiều định dạng (`data.horses`, `data.registrations`, array trực tiếp).
- **Trạng thái Hoàn Thành (Champion/Podium)**:
  - Khi race Chung kết có status `COMPLETED/FINISHED/RESULT_CONFIRMED`.
  - Hiển thị Podium (🥇 🥈 🥉) trong `TournamentBracketView`.
  - Admin có quyền bấm `Kết Thúc Giải Đấu` (Mark COMPLETED).
  - Spectator thấy `Hero Champion Banner` to hoành tráng ở `TournamentDetailPage`.

### 3.2. Quản lý Ngựa (Horse Management)
- **File chính**: `HorsesPage.tsx`.
- Không bắt buộc upload `Giấy khám sức khỏe` (Đã remove logic kiểm tra/hiển thị health profile).

## 4. Cấu trúc Source Code

- `src/api/index.ts`: File chứa TOÀN BỘ định nghĩa gọi API xuống BE bằng Axios. (Các hàm call API: `getPublicTournament`, `updateTournament`, `createSchedule`, `getRaceResults`, v.v...).
- `src/components/`: Component dùng chung. Nổi bật có `TournamentBracketView.tsx` render sơ đồ thi đấu, `AnimatedTable`, `AppLayout`.
- `src/pages/`: Các màn hình chia theo role.
  - `admin/`: `AdminSchedulingPage`, `AdminDashboard`, `AdminUsersPage`...
  - `spectator/`: `TournamentDetailPage`, `PredictionsPage`...
  - `race_referee/`: `RefereeRacesPage`, `RefereeReportPage`...
  - `jockey/`: `JockeyRacesPage`, `JockeySchedulePage`...

## 5. Danh sách API Chính (Tham khảo nhanh)
- **Auth**: `login`, `register`, `getMyProfile`.
- **Tournaments**: `getTournaments`, `getTournament`, `createTournament`, `updateTournament`, `generateTournamentBracket`, `getPublicTournaments`, `getTournamentBracket`, `getTournamentLeaderboard`.
- **Races**: `getRaces`, `getRace`, `createRace`, `updateRace`, `splitRaceIntoHeats`, `createSchedule`, `getRaceRegistrations`, `approveRaceRegistration`, `publishRaceResult`, `getRaceResults`, `getRaceHorses`.
- **Horses**: `getHorses`, `createHorse`, `updateHorse`, `getAdminHorses`, `approveHorse`.
- **Predictions**: `getPredictions`, `placePrediction`, `settlePredictions`.
- **Referees**: `getRefereeRaces`, `confirmRaceResult`, `createRaceReport`.

## 6. Lưu ý khi code (Notes cho AI)
1. Tuyệt đối không dùng hard-code cho logic đi tiếp (Ví dụ: `topAdvance = 2`). Phải luôn tính toán dựa vào response từ backend (như trường `topAdvance`) hoặc công thức chia bảng chuẩn.
2. Xử lý API responses luôn cẩn thận với định dạng đa dạng (vì BE có thể trả về `.data`, `.results`, `.rankings`, array bọc object, v.v...). Always có fallback!
3. Style tuân theo Tailwind CSS và các custom CSS rules trong `src/styles/` (đặc biệt là CSS cho Spectator UI). Luôn ưu tiên giao diện bắt mắt, có hiệu ứng (animation/glow/badges) tương tự như đã làm với Champion Banner.
4. Tránh lặp lại lỗi vòng lặp `find` sai field (như đã fix trong luồng advance winners). Luôn cẩn thận ép kiểu `String()` khi so sánh các `id` hoặc `_id`.
