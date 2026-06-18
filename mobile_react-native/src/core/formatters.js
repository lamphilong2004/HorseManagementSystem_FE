export function translateStatus(status) {
  switch (String(status || "").toLowerCase()) {
    case "pending":
      return "Đang chờ";
    case "open":
      return "Đang mở";
    case "active":
      return "Hoạt động";
    case "completed":
      return "Hoàn thành";
    case "approved":
      return "Đã duyệt";
    case "confirmed":
      return "Xác nhận";
    case "rejected":
      return "Bị từ chối";
    case "inactive":
      return "Không hoạt động";
    case "cancelled":
      return "Đã hủy";
    case "scheduled":
      return "Lên lịch";
    case "ongoing":
      return "Đang diễn ra";
    case "won":
      return "Thắng";
    case "lost":
      return "Thua";
    default:
      return String(status || "");
  }
}

export function formatDateTime(iso) {
  if (!iso) return "—";
  const dt = new Date(iso);
  if (Number.isNaN(dt.getTime())) return String(iso);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${months[dt.getMonth()]} ${dt.getDate()}, ${dt.getFullYear()}  ${String(dt.getHours()).padStart(2, "0")}:${String(dt.getMinutes()).padStart(2, "0")}`;
}

export function extractTime(iso) {
  if (!iso) return "TBA";
  const dt = new Date(iso);
  if (Number.isNaN(dt.getTime())) return "TBA";
  const hour = dt.getHours() % 12 === 0 ? 12 : dt.getHours() % 12;
  const ampm = dt.getHours() >= 12 ? "PM" : "AM";
  return `${String(hour).padStart(2, "0")}:${String(dt.getMinutes()).padStart(2, "0")} ${ampm}`;
}

export function formatNumber(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return "—";
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(number);
}

export function formatWallet(value) {
  return `${formatNumber(value)} Điểm`;
}

export function formatPrize(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return value == null ? "—" : String(value);
  return `$${formatNumber(number)}`;
}

export function truncateId(value, length = 8) {
  const text = String(value || "");
  if (!text) return "—";
  return text.length > length ? `${text.slice(0, length)}…` : text;
}
