export type StatusScope = 'race' | 'tournament' | 'prediction' | 'registration' | 'notification'

export type StatusOption = {
  value: string
  label: string
}

const STATUS_LABELS: Record<StatusScope, Record<string, string>> = {
  race: {
    PENDING: 'Chờ xác nhận',
    SCHEDULED: 'Đã lên lịch',
    ONGOING: 'Đang diễn ra',
    LIVE: 'Đang diễn ra',
    COMPLETED: 'Đã hoàn tất',
    RESULT_CONFIRMED: 'Đã xác nhận kết quả',
    CANCELLED: 'Đã hủy',
  },
  tournament: {
    DRAFT: 'Bản nháp',
    ACTIVE: 'Đang hoạt động',
    PUBLISHED: 'Đã công bố',
    ONGOING: 'Đang diễn ra',
    COMPLETED: 'Đã hoàn tất',
    RESULT_CONFIRMED: 'Đã xác nhận kết quả',
    CANCELLED: 'Đã hủy',
  },
  prediction: {
    OPEN: 'Đang mở',
    CLOSED: 'Đã đóng',
    PENDING: 'Chờ xử lý',
    WON: 'Đã thắng',
    LOST: 'Đã thua',
    CANCELLED: 'Đã hủy',
  },
  registration: {
    PENDING: 'Chờ duyệt',
    APPROVED: 'Đã duyệt',
    REJECTED: 'Đã từ chối',
    CONFIRMED: 'Đã xác nhận',
    CANCELLED: 'Đã hủy',
  },
  notification: {
    READ: 'Đã đọc',
    UNREAD: 'Chưa đọc',
  },
}

const STATUS_STYLES: Record<StatusScope, Record<string, string>> = {
  race: {
    PENDING: 'bg-slate-500/15 text-slate-200 border-slate-500/30',
    SCHEDULED: 'bg-blue-500/15 text-blue-200 border-blue-500/30',
    ONGOING: 'bg-emerald-500/15 text-emerald-200 border-emerald-500/30',
    LIVE: 'bg-emerald-500/15 text-emerald-200 border-emerald-500/30',
    COMPLETED: 'bg-slate-500/15 text-slate-200 border-slate-500/30',
    RESULT_CONFIRMED: 'bg-violet-500/15 text-violet-200 border-violet-500/30',
    CANCELLED: 'bg-red-500/15 text-red-200 border-red-500/30',
  },
  tournament: {
    DRAFT: 'bg-slate-500/15 text-slate-200 border-slate-500/30',
    ACTIVE: 'bg-emerald-500/15 text-emerald-200 border-emerald-500/30',
    PUBLISHED: 'bg-blue-500/15 text-blue-200 border-blue-500/30',
    ONGOING: 'bg-emerald-500/15 text-emerald-200 border-emerald-500/30',
    COMPLETED: 'bg-slate-500/15 text-slate-200 border-slate-500/30',
    RESULT_CONFIRMED: 'bg-violet-500/15 text-violet-200 border-violet-500/30',
    CANCELLED: 'bg-red-500/15 text-red-200 border-red-500/30',
  },
  prediction: {
    OPEN: 'bg-amber-500/15 text-amber-200 border-amber-500/30',
    CLOSED: 'bg-slate-500/15 text-slate-200 border-slate-500/30',
    PENDING: 'bg-slate-500/15 text-slate-200 border-slate-500/30',
    WON: 'bg-emerald-500/15 text-emerald-200 border-emerald-500/30',
    LOST: 'bg-red-500/15 text-red-200 border-red-500/30',
    CANCELLED: 'bg-red-500/15 text-red-200 border-red-500/30',
  },
  registration: {
    PENDING: 'bg-amber-500/15 text-amber-200 border-amber-500/30',
    APPROVED: 'bg-emerald-500/15 text-emerald-200 border-emerald-500/30',
    REJECTED: 'bg-red-500/15 text-red-200 border-red-500/30',
    CONFIRMED: 'bg-blue-500/15 text-blue-200 border-blue-500/30',
    CANCELLED: 'bg-slate-500/15 text-slate-200 border-slate-500/30',
  },
  notification: {
    READ: 'bg-slate-500/15 text-slate-200 border-slate-500/30',
    UNREAD: 'bg-amber-500/15 text-amber-200 border-amber-500/30',
  },
}

const DEFAULT_LABEL = 'Không xác định'
const DEFAULT_STYLE = 'bg-slate-500/15 text-slate-200 border-slate-500/30'

export const RACE_STATUS_OPTIONS: StatusOption[] = [
  { value: '', label: 'Tất cả trạng thái' },
  { value: 'SCHEDULED', label: 'Đã lên lịch' },
  { value: 'ONGOING', label: 'Đang diễn ra' },
  { value: 'COMPLETED', label: 'Đã hoàn tất' },
  { value: 'CANCELLED', label: 'Đã hủy' },
]

export const TOURNAMENT_STATUS_OPTIONS: StatusOption[] = [
  { value: '', label: 'Tất cả trạng thái' },
  { value: 'DRAFT', label: 'Bản nháp' },
  { value: 'PUBLISHED', label: 'Đã công bố' },
  { value: 'ONGOING', label: 'Đang diễn ra' },
  { value: 'COMPLETED', label: 'Đã hoàn tất' },
  { value: 'CANCELLED', label: 'Đã hủy' },
]

export const PREDICTION_STATUS_OPTIONS: StatusOption[] = [
  { value: '', label: 'Tất cả kết quả' },
  { value: 'OPEN', label: 'Đang mở' },
  { value: 'CLOSED', label: 'Đã đóng' },
  { value: 'WON', label: 'Đã thắng' },
  { value: 'LOST', label: 'Đã thua' },
]

export const NOTIFICATION_READ_OPTIONS: StatusOption[] = [
  { value: 'all', label: 'Tất cả' },
  { value: 'unread', label: 'Chưa đọc' },
  { value: 'read', label: 'Đã đọc' },
]

export function getStatusLabel(status: string | undefined, scope: StatusScope, fallback = DEFAULT_LABEL) {
  if (!status) return fallback
  return STATUS_LABELS[scope][status] || status
}

export function getStatusClassName(status: string | undefined, scope: StatusScope) {
  if (!status) return DEFAULT_STYLE
  return STATUS_STYLES[scope][status] || DEFAULT_STYLE
}

export function getNotificationTypeLabel(type: string | undefined) {
  if (!type) return DEFAULT_LABEL
  return type
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}