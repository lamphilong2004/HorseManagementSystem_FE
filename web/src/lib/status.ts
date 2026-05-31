export const TOURNAMENT_STATUS_OPTIONS = [
  { value: 'all', label: 'Tất cả trạng thái' },
  { value: 'DRAFT', label: 'Bản nháp' },
  { value: 'PUBLISHED', label: 'Đã công bố' },
  { value: 'ONGOING', label: 'Đang diễn ra' },
  { value: 'COMPLETED', label: 'Đã kết thúc' },
  { value: 'CANCELLED', label: 'Đã hủy' }
]

export const RACE_STATUS_OPTIONS = [
  { value: 'all', label: 'Tất cả trạng thái' },
  { value: 'SCHEDULED', label: 'Đã lên lịch' },
  { value: 'ONGOING', label: 'Đang diễn ra' },
  { value: 'RUNNING', label: 'Đang chạy' },
  { value: 'FINISHED', label: 'Đã hoàn thành' },
  { value: 'COMPLETED', label: 'Đã kết thúc' },
  { value: 'CANCELLED', label: 'Đã hủy' }
]

export const PREDICTION_STATUS_OPTIONS = [
  { value: 'all', label: 'Tất cả dự đoán' },
  { value: 'PENDING', label: 'Đang chờ' },
  { value: 'WON', label: 'Thắng' },
  { value: 'LOST', label: 'Thua' }
]

export function getStatusLabel(status: string | undefined, type: 'tournament' | 'race' | 'prediction' | 'registration' | 'invite' | 'violation' | string): string {
  if (!status) return '—'
  const s = status.toUpperCase()
  
  if (type === 'tournament') {
    switch (s) {
      case 'DRAFT': return 'Bản nháp'
      case 'PUBLISHED': return 'Đã công bố'
      case 'ONGOING':
      case 'ACTIVE': return 'Đang diễn ra'
      case 'COMPLETED': return 'Đã kết thúc'
      case 'CANCELLED': return 'Đã hủy'
      default: return status
    }
  }

  if (type === 'race') {
    switch (s) {
      case 'SCHEDULED': return 'Đã lên lịch'
      case 'ONGOING':
      case 'RUNNING': return 'Đang diễn ra'
      case 'FINISHED':
      case 'COMPLETED': return 'Đã hoàn thành'
      case 'RESULT_CONFIRMED': return 'Xác nhận kết quả'
      case 'CANCELLED': return 'Đã hủy'
      default: return status
    }
  }

  if (type === 'prediction') {
    switch (s) {
      case 'PENDING':
      case 'OPEN': return 'Đang chờ'
      case 'WON': return 'Thắng'
      case 'LOST': return 'Thua'
      case 'CLOSED': return 'Đã đóng'
      default: return status
    }
  }

  if (type === 'registration' || type === 'invite') {
    switch (s) {
      case 'PENDING':
      case 'PENDING_APPROVAL': return 'Chờ duyệt'
      case 'APPROVED':
      case 'ACCEPTED':
      case 'CONFIRMED': return 'Chấp nhận'
      case 'REJECTED':
      case 'DECLINED': return 'Từ chối'
      default: return status
    }
  }

  if (type === 'violation') {
    switch (s) {
      case 'OPEN': return 'Chưa xử lý'
      case 'RESOLVED': return 'Đã xử lý'
      default: return status
    }
  }

  return status
}

export function getStatusClassName(status: string | undefined, _type: string): string {
  if (!status) return 'badge-pending'
  const s = status.toUpperCase()
  
  switch (s) {
    case 'DRAFT':
    case 'PENDING':
    case 'PENDING_APPROVAL':
    case 'OPEN':
    case 'SCHEDULED':
      return 'badge-pending'
    case 'PUBLISHED':
    case 'APPROVED':
    case 'ACCEPTED':
    case 'CONFIRMED':
    case 'RESOLVED':
    case 'FINISHED':
    case 'COMPLETED':
    case 'RESULT_CONFIRMED':
    case 'WON':
      return 'badge-confirmed'
    case 'ONGOING':
    case 'ACTIVE':
    case 'RUNNING':
      return 'badge-ongoing'
    case 'REJECTED':
    case 'DECLINED':
    case 'CANCELLED':
    case 'LOST':
      return 'badge-cancelled'
    default:
      return 'badge-pending'
  }
}

export function getNotificationTypeLabel(type: string | undefined): string {
  if (!type) return 'Thông báo'
  const t = type.toUpperCase()
  switch (t) {
    case 'BET_WON': return 'Thắng dự đoán 🏆'
    case 'BET_LOST': return 'Thua dự đoán'
    case 'RACE_CANCELLED': return 'Hủy cuộc đua 🚫'
    case 'RACE_ONGOING': return 'Cuộc đua bắt đầu 🏇'
    case 'RACE_FINISHED': return 'Kết thúc cuộc đua'
    case 'INVITATION_RECEIVED': return 'Lời mời nài ngựa'
    case 'INVITATION_ACCEPTED': return 'Lời mời được nhận'
    default: return type
  }
}
