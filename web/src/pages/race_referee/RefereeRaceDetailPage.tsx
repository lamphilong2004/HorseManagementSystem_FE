import { useEffect, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import type { Race, RaceHorseRegistration, Violation, RaceResult } from '../../types'
import {
  getPublicRace, getRefereeRaceHorses, getRefereeViolations,
  createViolation, resolveViolation, confirmRaceResult, getRaceResults,
} from '@/api'
import { AnimatedTable, type ColumnDef, type SortDirection } from '../../components/ui/animated-table'
import { FileText, Clock3, Ruler, Users, AlertTriangle, ClipboardCheck, Eye, ShieldAlert, Trophy, ChevronLeft, Plus, Scale } from 'lucide-react'
import { getStatusClassName, getStatusLabel } from '@/lib/status'


function statusBadge(s?: string, type: string = 'race') {
  if (!s) return null
  const className = getStatusClassName(s, type)
  const label = getStatusLabel(s, type)
  return (
    <span className={`badge ${className} font-bold inline-flex items-center gap-1.5`}>
      {s === 'ONGOING' && <span className="live-dot" />}
      {label}
    </span>
  )
}

function formatDateTime(d: string) {
  return new Date(d).toLocaleString('vi-VN')
}

function formatMoney(n?: number) {
  if (!n) return '—'
  return n.toLocaleString('vi-VN') + ' VND'
}

type Tab = 'horses' | 'monitor' | 'violations' | 'results'

export function RefereeRaceDetailPage() {
  const { raceId } = useParams<{ raceId: string }>()
  const [searchParams, setSearchParams] = useSearchParams()
  const tabParam = searchParams.get('tab')
  const [activeTab, setActiveTab] = useState<Tab>('horses')
  const [race, setRace] = useState<Race | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Tab data
  const [horses, setHorses] = useState<RaceHorseRegistration[]>([])
  const [horsesLoading, setHorsesLoading] = useState(false)
  const [violations, setViolations] = useState<Violation[]>([])
  const [violationsLoading, setViolationsLoading] = useState(false)
  const [results, setResults] = useState<RaceResult[]>([])

  // Violation form
  const [showViolationForm, setShowViolationForm] = useState(false)
  const [vForm, setVForm] = useState({ horseId: '', jockeyId: '', type: 'FALSE_START', description: '', penalty: 'WARNING', fineAmount: '' })
  const [vLoading, setVLoading] = useState(false)
  const [vMsg, setVMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Resolve violation
  const [resolveId, setResolveId] = useState<string | null>(null)
  const [resolveNote, setResolveNote] = useState('')
  const [resolveLoading, setResolveLoading] = useState(false)

  // Confirm result
  const [rankings, setRankings] = useState<Array<{ position: number; horseId: string; jockeyId: string; finishTime: string }>>([])
  const [resultNotes, setResultNotes] = useState('')
  const [confirmLoading, setConfirmLoading] = useState(false)
  const [confirmMsg, setConfirmMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Table states
  const [horsesSortColumn, setHorsesSortColumn] = useState<string | undefined>()
  const [horsesSortDirection, setHorsesSortDirection] = useState<SortDirection>(null)
  const [horsesFilters, setHorsesFilters] = useState<Record<string, string>>({})
  const [horsesPage, setHorsesPage] = useState(1)

  const [resultsSortColumn, setResultsSortColumn] = useState<string | undefined>()
  const [resultsSortDirection, setResultsSortDirection] = useState<SortDirection>(null)
  const [resultsFilters, setResultsFilters] = useState<Record<string, string>>({})
  const [resultsPage, setResultsPage] = useState(1)

  const [violationsSortColumn, setViolationsSortColumn] = useState<string | undefined>()
  const [violationsSortDirection, setViolationsSortDirection] = useState<SortDirection>(null)
  const [violationsFilters, setViolationsFilters] = useState<Record<string, string>>({})
  const [violationsPage, setViolationsPage] = useState(1)

  useEffect(() => {
    if (tabParam === 'horses' || tabParam === 'monitor' || tabParam === 'violations' || tabParam === 'results') {
      setActiveTab(tabParam)
    }
  }, [tabParam])

  // Load race info
  useEffect(() => {
    if (!raceId) return
    setLoading(true)
    getPublicRace(raceId)
      .then(setRace)
      .catch(() => setError('Không tìm thấy cuộc đua'))
      .finally(() => setLoading(false))
  }, [raceId])

  // Load tab data
  useEffect(() => {
    if (!raceId) return

    if (activeTab === 'horses') {
      setHorsesLoading(true)
      getRefereeRaceHorses(raceId)
        .then((data: any) => setHorses(data?.horses || []))
        .catch(() => setHorses([]))
        .finally(() => setHorsesLoading(false))
    }

    if (activeTab === 'violations') {
      setViolationsLoading(true)
      getRefereeViolations(raceId)
        .then((data: any) => setViolations(data?.violations || []))
        .catch(() => setViolations([]))
        .finally(() => setViolationsLoading(false))
    }

    if (activeTab === 'monitor' || activeTab === 'results') {
      getRaceResults(raceId).then((r) => setResults(Array.isArray(r) ? r : [])).catch(() => setResults([]))
      // Also load horses for confirm result
      getRefereeRaceHorses(raceId)
        .then((data: any) => setHorses(data?.horses || []))
        .catch(() => {})
    }
  }, [raceId, activeTab])

  // Create violation
  async function handleCreateViolation() {
    if (!raceId) return
    setVLoading(true)
    setVMsg(null)
    try {
      await createViolation(raceId, {
        ...vForm,
        fineAmount: vForm.fineAmount ? Number(vForm.fineAmount) : undefined,
      })
      setVMsg({ type: 'success', text: 'Ghi nhận vi phạm thành công!' })
      setShowViolationForm(false)
      setVForm({ horseId: '', jockeyId: '', type: 'FALSE_START', description: '', penalty: 'WARNING', fineAmount: '' })
      // Refresh violations
      const data = await getRefereeViolations(raceId)
      setViolations(data?.violations || [])
    } catch (e: any) {
      setVMsg({ type: 'error', text: e?.response?.data?.message || 'Lỗi khi ghi nhận vi phạm' })
    } finally {
      setVLoading(false)
    }
  }

  // Resolve violation
  async function handleResolve(vId: string) {
    setResolveLoading(true)
    try {
      await resolveViolation(vId, resolveNote)
      setResolveId(null)
      setResolveNote('')
      if (raceId) {
        const data = await getRefereeViolations(raceId)
        setViolations(data?.violations || [])
      }
    } catch (e: any) {
      alert(e?.response?.data?.message || 'Lỗi khi xử lý vi phạm')
    } finally {
      setResolveLoading(false)
    }
  }

  // Confirm result
  async function handleConfirmResult() {
    if (!raceId || rankings.length === 0) return
    setConfirmLoading(true)
    setConfirmMsg(null)
    try {
      await confirmRaceResult(raceId, rankings, resultNotes)
      setConfirmMsg({ type: 'success', text: 'Xác nhận kết quả thành công!' })
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.response?.data?.error || 'Lỗi khi xác nhận kết quả'
      setConfirmMsg({ type: 'error', text: msg })
    } finally {
      setConfirmLoading(false)
    }
  }

  // Find jockey for selected horse in rankings
  const findJockeyForHorse = (horseId: string) => {
    const reg = horses.find((h) => {
      const horse = (h.horse || h) as any
      return (horse._id || horse.id) === horseId
    })
    if (!reg) return { id: '', name: '' }

    const rawJockey = reg.jockeyId || reg.jockey || (reg.horse as any)?.jockeyId || (reg.horse as any)?.jockey
    let id = ''
    let name = ''

    if (rawJockey) {
      if (typeof rawJockey === 'object') {
        id = rawJockey._id || rawJockey.id || ''
        name = rawJockey.fullName || rawJockey.name || ''
      } else {
        id = String(rawJockey)
        name = reg.jockeyName || ''
      }
    }

    // Fallback to horse owner if no jockey is confirmed
    if (!id) {
      const owner = (reg.horse as any)?.ownerId || (reg as any)?.ownerId
      if (owner) {
        if (typeof owner === 'object') {
          id = owner._id || owner.id || ''
          name = owner.fullName || owner.name || ''
        } else {
          id = String(owner)
          name = (reg as any).ownerName || ''
        }
      }
    }

    if (!name && id) {
      name = `Jockey ID: ${id}`
    }

    return { id, name }
  }

  // Add ranking row
  function addRankingRow() {
    setRankings([...rankings, { position: rankings.length + 1, horseId: '', jockeyId: '', finishTime: '' }])
  }

  function updateRanking(idx: number, field: string, value: string) {
    const copy = [...rankings]
    ;(copy[idx] as any)[field] = field === 'position' ? Number(value) : value
    if (field === 'horseId') {
      const { id: jId } = findJockeyForHorse(value)
      copy[idx].jockeyId = jId
    }
    setRankings(copy)
  }

  function removeRanking(idx: number) {
    setRankings(rankings.filter((_, i) => i !== idx))
  }

  function changeTab(tab: Tab) {
    setActiveTab(tab)
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      next.set('tab', tab)
      return next
    })
  }

  const horseInspectionColumns = [
    {
      id: 'index',
      header: '#',
      cell: (_: any, idx: number) => idx + 1,
    },
    {
      id: 'name',
      header: 'Tên ngựa',
      sortable: true,
      filterable: true,
      filterType: 'text',
      cell: (h: RaceHorseRegistration) => {
        const horse = (h.horse || h) as any
        return <span className="fw-700">{horse.name}</span>
      },
    },
    {
      id: 'breed',
      header: 'Giống',
      sortable: true,
      filterable: true,
      filterType: 'text',
      cell: (h: RaceHorseRegistration) => {
        const horse = (h.horse || h) as any
        return horse.breed || '—'
      },
    },
    {
      id: 'age',
      header: 'Tuổi',
      sortable: true,
      cell: (h: RaceHorseRegistration) => {
        const horse = (h.horse || h) as any
        return horse.age ?? '—'
      },
    },
    {
      id: 'weight',
      header: 'Cân nặng',
      sortable: true,
      cell: (h: RaceHorseRegistration) => {
        const horse = (h.horse || h) as any
        return horse.weight ? `${horse.weight} kg` : '—'
      },
    },
    {
      id: 'color',
      header: 'Màu',
      sortable: true,
      cell: (h: RaceHorseRegistration) => {
        const horse = (h.horse || h) as any
        return horse.color || '—'
      },
    },
    {
      id: 'gender',
      header: 'Giới tính',
      sortable: true,
      cell: (h: RaceHorseRegistration) => {
        const horse = (h.horse || h) as any
        return horse.gender || '—'
      },
    },
    {
      id: 'origin',
      header: 'Nguồn gốc',
      sortable: true,
      cell: (h: RaceHorseRegistration) => {
        const horse = (h.horse || h) as any
        return horse.origin || '—'
      },
    },
    {
      id: 'status',
      header: 'Trạng thái ĐK',
      sortable: true,
      filterable: true,
      filterType: 'select',
      filterOptions: [
        { label: 'Chờ duyệt', value: 'PENDING' },
        { label: 'Đã duyệt', value: 'APPROVED' },
        { label: 'Đã xác nhận', value: 'CONFIRMED' },
        { label: 'Từ chối', value: 'REJECTED' },
      ],
      cell: (h: RaceHorseRegistration) => statusBadge(h.registrationStatus || 'PENDING', 'registration'),
    },
  ]

  const monitorHorsesColumns = [
    {
      id: 'index',
      header: '#',
      cell: (_: any, idx: number) => idx + 1,
    },
    {
      id: 'name',
      header: 'Ngựa',
      cell: (h: RaceHorseRegistration) => {
        const horse = (h.horse || h) as any
        return <span className="fw-600">{horse.name}</span>
      },
    },
    {
      id: 'breed',
      header: 'Giống',
      cell: (h: RaceHorseRegistration) => {
        const horse = (h.horse || h) as any
        return horse.breed || '—'
      },
    },
    {
      id: 'status',
      header: 'Trạng thái',
      cell: (h: RaceHorseRegistration) => statusBadge(h.registrationStatus || 'PENDING', 'registration'),
    },
  ]

  const monitorResultsColumns = [
    {
      id: 'position',
      header: 'Hạng',
      sortable: true,
      cell: (r: RaceResult, idx: number) => (
        <span className={`position-cell ${idx < 3 ? `rank-${idx + 1}` : ''}`}>
          {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${r.position}`}
        </span>
      ),
    },
    {
      id: 'horse',
      header: 'Ngựa',
      sortable: true,
      filterable: true,
      filterType: 'text',
      cell: (r: RaceResult) => <span className="fw-600">{r.horseId?.name || '—'}</span>,
    },
    {
      id: 'jockey',
      header: 'Nài ngựa',
      sortable: true,
      filterable: true,
      filterType: 'text',
      cell: (r: RaceResult) => r.jockeyId?.fullName || r.jockeyId?.name || '—',
    },
    {
      id: 'time',
      header: 'Thời gian',
      sortable: true,
      cell: (r: RaceResult) => <span className="fw-600">{r.finishTime || '—'}</span>,
    },
    {
      id: 'status',
      header: 'Trạng thái',
      sortable: true,
      cell: (r: RaceResult) => statusBadge(r.status || '', 'registration'),
    },
  ]

  const violationsColumns = [
    {
      id: 'type',
      header: 'Loại',
      sortable: true,
      filterable: true,
      filterType: 'select',
      filterOptions: [
        { label: 'Xuất phát lỗi', value: 'FALSE_START' },
        { label: 'Cản trở', value: 'INTERFERENCE' },
        { label: 'Quá cân', value: 'OVERWEIGHT' },
        { label: 'Doping', value: 'DOPING' },
        { label: 'Khác', value: 'OTHER' },
      ],
      cell: (v: Violation) => {
        const typeMap: Record<string, string> = {
          'FALSE_START': 'Xuất phát lỗi',
          'INTERFERENCE': 'Cản trở',
          'OVERWEIGHT': 'Quá cân',
          'DOPING': 'Doping',
          'OTHER': 'Khác'
        }
        const label = typeMap[v.type.toUpperCase()] || v.type
        const isCritical = v.type === 'DOPING' || v.type === 'INTERFERENCE'
        return (
          <span className={`badge ${isCritical ? 'badge-rejected' : 'badge-pending'}`}>
            {label}
          </span>
        )
      },
    },
    {
      id: 'description',
      header: 'Mô tả',
      cell: (v: Violation) => v.description,
    },
    {
      id: 'penalty',
      header: 'Hình phạt',
      sortable: true,
      filterable: true,
      filterType: 'select',
      filterOptions: [
        { label: 'Cảnh cáo', value: 'WARNING' },
        { label: 'Truất quyền', value: 'DISQUALIFY' },
        { label: 'Phạt tiền', value: 'FINE' },
      ],
      cell: (v: Violation) => {
        const penaltyMap: Record<string, string> = {
          'WARNING': 'Cảnh cáo',
          'DISQUALIFY': 'Truất quyền',
          'FINE': 'Phạt tiền'
        }
        const label = penaltyMap[v.penalty.toUpperCase()] || v.penalty
        const isDisqualify = v.penalty === 'DISQUALIFY'
        const isFine = v.penalty === 'FINE'
        const badgeClass = isDisqualify ? 'badge-rejected' : isFine ? 'badge-ongoing' : 'badge-pending'
        return <span className={`badge ${badgeClass}`}>{label}</span>
      },
    },
    {
      id: 'fine',
      header: 'Phạt tiền',
      sortable: true,
      cell: (v: Violation) => (v.fineAmount ? formatMoney(v.fineAmount) : '—'),
    },
    {
      id: 'status',
      header: 'Trạng thái',
      sortable: true,
      filterable: true,
      filterType: 'select',
      filterOptions: [
        { label: 'Mở', value: 'OPEN' },
        { label: 'Đã giải quyết', value: 'RESOLVED' },
        { label: 'Đã đóng', value: 'CLOSED' },
      ],
      cell: (v: Violation) => statusBadge(v.status, 'violation'),
    },
    {
      id: 'action',
      header: 'Hành động',
      cell: (v: Violation) => {
        return v.status === 'OPEN' ? (
          resolveId === v._id ? (
            <div className="flex flex-col gap-8" onClick={(e) => e.stopPropagation()}>
              <input
                placeholder="Ghi chú xử lý..."
                value={resolveNote}
                onChange={(e) => setResolveNote(e.target.value)}
                style={{ width: 200 }}
              />
              <div className="flex gap-8">
                <button className="btn btnSmall btnSuccess" disabled={resolveLoading} onClick={() => handleResolve(v._id)}>
                  {resolveLoading ? '...' : '✅ Xử lý'}
                </button>
                <button className="btn btnSmall" onClick={() => setResolveId(null)}>Hủy</button>
              </div>
            </div>
          ) : (
            <button className="btn btnSmall btnSuccess" onClick={(e) => { e.stopPropagation(); setResolveId(v._id) }}>
              Xử lý
            </button>
          )
        ) : (
          <span className="muted fs-13">{v.resolutionNote || 'Đã xử lý'}</span>
        )
      },
    },
  ]

  const horsesWithId = horses.map((h, idx) => {
    const horse = (h.horse || h) as any
    return {
      ...h,
      id: horse._id || String(idx),
    }
  })

  const resultsWithId = [...results]
    .sort((a, b) => (a.position ?? Infinity) - (b.position ?? Infinity))
    .map((r, idx) => ({ ...r, id: r._id || String(idx) }))

  const violationsWithId = violations.map((v, idx) => ({
    ...v,
    id: v._id || String(idx),
  }))

  if (loading) return <div className="loading"><div className="spinner" /></div>
  if (error) return (
    <div className="card max-w-2xl mx-auto mt-8">
      <Link to="/referee/races" className="back-link flex items-center gap-1.5 hover:text-[var(--primary)] transition-colors mb-4">
        <ChevronLeft className="h-4 w-4" />
        <span>Quay lại</span>
      </Link>
      <div className="alert alert-error">⚠️ {error}</div>
    </div>
  )
  if (!race) return null

  const openViolations = violations.filter(v => v.status === 'OPEN').length

  return (
    <div className="space-y-6">
      <Link to="/referee/races" className="back-link inline-flex items-center gap-1.5 hover:text-[var(--primary)] transition-colors text-sm font-bold">
        <ChevronLeft className="h-4 w-4" />
        <span>Quay lại danh sách</span>
      </Link>

      {/* Race Header */}
      <div className="card">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-4">
            <div className="rounded-2xl bg-emerald-500/10 p-3 flex items-center justify-center ring-1 ring-emerald-500/20 shrink-0">
              <Scale className="h-6 w-6 text-emerald-500" />
            </div>
            <div className="space-y-1.5 min-w-0 flex-1">
              <h1 className="text-2xl font-black text-[var(--text)] tracking-tight m-0">{race.name}</h1>
              {race.tournamentId?.name && (
                <div className="text-xs text-[var(--muted)]/60 font-bold flex items-center gap-1.5">
                  <Trophy className="h-3.5 w-3.5 text-amber-500/80 shrink-0" />
                  <span className="truncate">{race.tournamentId.name}</span>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            {statusBadge(race.status, 'race')}
            <Link to={`/referee/report/${raceId}`} className="btn btnPrimary h-10 px-4 rounded-xl flex items-center gap-2 font-bold cursor-pointer transition-all">
              <FileText className="h-4 w-4" />
              <span>Biên bản</span>
            </Link>
          </div>
        </div>

        <div className="grid gap-3 grid-cols-1 sm:grid-cols-4 mt-6">
          {/* Widget 1: Thời gian */}
          <div className="flex items-center gap-3 rounded-xl bg-white/[0.02] border border-white/[0.04] p-3.5 transition-all hover:bg-white/[0.04]">
            <div className="h-9 w-9 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
              <Clock3 className="h-4.5 w-4.5 text-amber-400" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[10px] uppercase font-extrabold tracking-wider text-[var(--muted)]/40 leading-none mb-1">Thời gian</span>
              <span className="text-xs font-bold text-[var(--text)] truncate">{formatDateTime(race.scheduledAt)}</span>
            </div>
          </div>

          {/* Widget 2: Cự ly */}
          {race.distance && (
            <div className="flex items-center gap-3 rounded-xl bg-white/[0.02] border border-white/[0.04] p-3.5 transition-all hover:bg-white/[0.04]">
              <div className="h-9 w-9 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                <Ruler className="h-4.5 w-4.5 text-blue-400" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[10px] uppercase font-extrabold tracking-wider text-[var(--muted)]/40 leading-none mb-1">Cự ly</span>
                <span className="text-xs font-bold text-[var(--text)] truncate">{race.distance}m</span>
              </div>
            </div>
          )}

          {/* Widget 3: Ngựa tham gia */}
          <div className="flex items-center gap-3 rounded-xl bg-white/[0.02] border border-white/[0.04] p-3.5 transition-all hover:bg-white/[0.04]">
            <div className="h-9 w-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
              <Users className="h-4.5 w-4.5 text-emerald-400" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[10px] uppercase font-extrabold tracking-wider text-[var(--muted)]/40 leading-none mb-1">Ngựa tham gia</span>
              <span className="text-xs font-bold text-[var(--text)] truncate">{horses.length}</span>
            </div>
          </div>

          {/* Widget 4: Vi phạm mở */}
          <div className="flex items-center gap-3 rounded-xl bg-white/[0.02] border border-white/[0.04] p-3.5 transition-all hover:bg-white/[0.04]">
            <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${openViolations > 0 ? 'bg-red-500/10 border border-red-500/20' : 'bg-emerald-500/10 border border-emerald-500/20'}`}>
              <AlertTriangle className={`h-4.5 w-4.5 ${openViolations > 0 ? 'text-red-400' : 'text-emerald-400'}`} />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[10px] uppercase font-extrabold tracking-wider text-[var(--muted)]/40 leading-none mb-1">Vi phạm mở</span>
              <span className={`text-xs font-bold truncate ${openViolations > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                {openViolations}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="card">
        <div className="tabs">
          <button className={`tab-link ${activeTab === 'horses' ? 'active' : ''}`} onClick={() => changeTab('horses')}>
            <ClipboardCheck className="h-4 w-4 text-emerald-500 shrink-0" />
            <span>Kiểm tra ngựa</span>
          </button>
          <button className={`tab-link ${activeTab === 'monitor' ? 'active' : ''}`} onClick={() => changeTab('monitor')}>
            <Eye className="h-4 w-4 text-blue-500 shrink-0" />
            <span>Theo dõi đua</span>
          </button>
          <button className={`tab-link ${activeTab === 'violations' ? 'active' : ''}`} onClick={() => changeTab('violations')}>
            <ShieldAlert className="h-4 w-4 text-red-500 shrink-0" />
            <span>Vi phạm {openViolations > 0 && `(${openViolations})`}</span>
          </button>
          <button className={`tab-link ${activeTab === 'results' ? 'active' : ''}`} onClick={() => changeTab('results')}>
            <Trophy className="h-4 w-4 text-amber-500 shrink-0" />
            <span>Xác nhận kết quả</span>
          </button>
        </div>

        {/* ===== TAB 1: Horse Inspection ===== */}
        {activeTab === 'horses' && (
          <AnimatedTable
            data={(() => {
              let res = horsesWithId
              if (horsesFilters.name) res = res.filter(h => ((h.horse || h) as any).name?.toLowerCase().includes(horsesFilters.name.toLowerCase()))
              if (horsesFilters.breed) res = res.filter(h => ((h.horse || h) as any).breed?.toLowerCase().includes(horsesFilters.breed.toLowerCase()))
              if (horsesFilters.status) res = res.filter(h => h.registrationStatus === horsesFilters.status)
              
              if (horsesSortColumn && horsesSortDirection) {
                res.sort((a: any, b: any) => {
                  let aVal = a[horsesSortColumn]
                  let bVal = b[horsesSortColumn]
                  if (horsesSortColumn === 'name' || horsesSortColumn === 'breed' || horsesSortColumn === 'age' || horsesSortColumn === 'weight' || horsesSortColumn === 'color' || horsesSortColumn === 'gender' || horsesSortColumn === 'origin') {
                    aVal = ((a.horse || a) as any)[horsesSortColumn]
                    bVal = ((b.horse || b) as any)[horsesSortColumn]
                  } else if (horsesSortColumn === 'status') {
                    aVal = a.registrationStatus
                    bVal = b.registrationStatus
                  }
                  if (typeof aVal === 'string' && typeof bVal === 'string') {
                    return horsesSortDirection === 'asc' ? aVal.localeCompare(bVal, 'vi') : bVal.localeCompare(aVal, 'vi')
                  }
                  return horsesSortDirection === 'asc' ? aVal - bVal : bVal - aVal
                })
              }
              return res.slice((horsesPage - 1) * 10, horsesPage * 10)
            })()}
            columns={horseInspectionColumns}
            loading={horsesLoading}
            sortColumn={horsesSortColumn}
            sortDirection={horsesSortDirection}
            onSort={(c, d) => { setHorsesSortColumn(c); setHorsesSortDirection(d) }}
            columnFilters={horsesFilters}
            onColumnFilterChange={(c, v) => { setHorsesFilters(prev => ({...prev, [c]: v})); setHorsesPage(1) }}
            pagination={{
              page: horsesPage,
              pageSize: 10,
              totalItems: horsesWithId.length, // Simplified total items for demo
              onPageChange: setHorsesPage,
              pageSizeOptions: [10, 20, 50]
            }}
            emptyMessage={
              <div className="empty-state py-12 text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500">
                  <ClipboardCheck className="h-6 w-6" />
                </div>
                <div className="text-base font-bold text-[var(--text)]">Chưa có ngựa đăng ký</div>
                <p className="text-sm text-[var(--muted)] mt-1">Danh sách ngựa đăng ký tham gia sẽ hiển thị ở đây.</p>
              </div>
            }
          />
        )}

        {/* ===== TAB 2: Race Monitor ===== */}
        {activeTab === 'monitor' && (
          <div className="space-y-6">
            {race.status === 'ONGOING' && (
              <div className="flex items-center gap-2 rounded-xl bg-amber-500/10 border border-amber-500/20 p-4 text-amber-600 dark:text-amber-300 font-bold text-sm">
                <span className="h-2.5 w-2.5 rounded-full bg-amber-500 animate-pulse" />
                <span>Cuộc đua đang diễn ra</span>
              </div>
            )}

            {race.status === 'SCHEDULED' && (
              <div className="flex items-center gap-2 rounded-xl bg-blue-500/10 border border-blue-500/20 p-4 text-blue-600 dark:text-blue-300 font-bold text-sm">
                <span>📅 Cuộc đua chưa bắt đầu — dự kiến {formatDateTime(race.scheduledAt)}</span>
              </div>
            )}

            <div>
              <div className="text-lg font-black text-[var(--text)] mb-3">Ngựa tham gia ({horses.length})</div>
              {horses.length > 0 && (
                <AnimatedTable
                  data={horsesWithId}
                  columns={monitorHorsesColumns}
                  emptyMessage="Chưa có ngựa tham gia"
                />
              )}
            </div>

            {results.length > 0 && (
              <div>
                <div className="text-lg font-black text-[var(--text)] mb-3">Kết quả hiện tại</div>
                <AnimatedTable
                  data={resultsWithId}
                  columns={monitorResultsColumns}
                  emptyMessage="Chưa có kết quả"
                />
              </div>
            )}
          </div>
        )}

        {/* ===== TAB 3: Violations ===== */}
        {activeTab === 'violations' && (
          <div className="space-y-4">
            {vMsg && <div className={`alert ${vMsg.type === 'success' ? 'alert-success' : 'alert-error'} mb-4`}>{vMsg.text}</div>}

            <div className="flex justify-between items-center mb-2">
              <div className="text-lg font-black text-[var(--text)]">
                Danh sách vi phạm ({violations.length})
              </div>
              <button className="btn btnDanger rounded-xl h-10 px-4 flex items-center gap-1.5 font-bold cursor-pointer transition-all" onClick={() => setShowViolationForm(true)}>
                <Plus className="h-4 w-4" />
                <span>Ghi nhận vi phạm</span>
              </button>
            </div>

            <AnimatedTable
              data={(() => {
                let res = violationsWithId
                if (violationsFilters.type) res = res.filter(v => v.type === violationsFilters.type)
                if (violationsFilters.penalty) res = res.filter(v => v.penalty === violationsFilters.penalty)
                if (violationsFilters.status) res = res.filter(v => v.status === violationsFilters.status)
                
                if (violationsSortColumn && violationsSortDirection) {
                  res.sort((a: any, b: any) => {
                    let aVal = a[violationsSortColumn]
                    let bVal = b[violationsSortColumn]
                    if (violationsSortColumn === 'fine') {
                      aVal = a.fineAmount || 0
                      bVal = b.fineAmount || 0
                    }
                    if (typeof aVal === 'string' && typeof bVal === 'string') {
                      return violationsSortDirection === 'asc' ? aVal.localeCompare(bVal, 'vi') : bVal.localeCompare(aVal, 'vi')
                    }
                    return violationsSortDirection === 'asc' ? aVal - bVal : bVal - aVal
                  })
                }
                return res.slice((violationsPage - 1) * 10, violationsPage * 10)
              })()}
              columns={violationsColumns}
              loading={violationsLoading}
              sortColumn={violationsSortColumn}
              sortDirection={violationsSortDirection}
              onSort={(c, d) => { setViolationsSortColumn(c); setViolationsSortDirection(d) }}
              columnFilters={violationsFilters}
              onColumnFilterChange={(c, v) => { setViolationsFilters(prev => ({...prev, [c]: v})); setViolationsPage(1) }}
              pagination={{
                page: violationsPage,
                pageSize: 10,
                totalItems: violationsWithId.length, // Simplified total items
                onPageChange: setViolationsPage,
                pageSizeOptions: [10, 20, 50]
              }}
              emptyMessage={
                <div className="empty-state py-12 text-center">
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500">
                    <ShieldAlert className="h-6 w-6" />
                  </div>
                  <div className="text-base font-bold text-[var(--text)]">Không có vi phạm nào</div>
                  <p className="text-sm text-[var(--muted)] mt-1">Cuộc đua sạch, không phát hiện vi phạm nào.</p>
                </div>
              }
            />

            {/* Violation Form Modal */}
            {showViolationForm && (
              <div className="modal-overlay" onClick={() => setShowViolationForm(false)}>
                <div className="modal-content max-w-lg" onClick={(e) => e.stopPropagation()}>
                  <div className="modal-header">
                    <h2 className="text-lg font-black flex items-center gap-2 m-0 text-[var(--text)]">
                      <ShieldAlert className="h-5 w-5 text-red-500" />
                      <span>Ghi nhận vi phạm mới</span>
                    </h2>
                    <button className="modal-close" onClick={() => setShowViolationForm(false)}>✕</button>
                  </div>

                  <div className="modal-body space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="form-group">
                        <label>Ngựa vi phạm</label>
                        <select
                          className="h-10 rounded-lg"
                          value={vForm.horseId}
                          onChange={(e) => {
                            const horseId = e.target.value
                            const { id: jId } = findJockeyForHorse(horseId)
                            setVForm({ ...vForm, horseId, jockeyId: jId })
                          }}
                        >
                          <option value="">— Chọn ngựa —</option>
                          {horses.map((h) => {
                            const horse = (h.horse || h) as any
                            return <option key={horse._id} value={horse._id}>{horse.name}</option>
                          })}
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Nài ngựa</label>
                        <input
                          className="h-10 rounded-lg bg-white/[0.02] border-white/[0.05] cursor-not-allowed opacity-80"
                          value={findJockeyForHorse(vForm.horseId).name || 'Chưa xác định'}
                          readOnly
                          placeholder="Tên Jockey"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="form-group">
                        <label>Loại vi phạm</label>
                        <select className="h-10 rounded-lg" value={vForm.type} onChange={(e) => setVForm({ ...vForm, type: e.target.value })}>
                          <option value="FALSE_START">Xuất phát lỗi (False Start)</option>
                          <option value="INTERFERENCE">Cản trở (Interference)</option>
                          <option value="OVERWEIGHT">Quá cân (Overweight)</option>
                          <option value="DOPING">Doping</option>
                          <option value="OTHER">Khác (Other)</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Hình phạt</label>
                        <select className="h-10 rounded-lg" value={vForm.penalty} onChange={(e) => setVForm({ ...vForm, penalty: e.target.value })}>
                          <option value="WARNING">Cảnh cáo (Warning)</option>
                          <option value="DISQUALIFY">Truất quyền thi đấu (Disqualify)</option>
                          <option value="FINE">Phạt tiền (Fine)</option>
                        </select>
                      </div>
                    </div>

                    {vForm.penalty === 'FINE' && (
                      <div className="form-group">
                        <label>Số tiền phạt (VND)</label>
                        <input className="h-10 rounded-lg" type="number" value={vForm.fineAmount} onChange={(e) => setVForm({ ...vForm, fineAmount: e.target.value })} placeholder="5000000" />
                      </div>
                    )}

                    <div className="form-group">
                      <label>Mô tả chi tiết</label>
                      <textarea className="rounded-lg p-3" value={vForm.description} onChange={(e) => setVForm({ ...vForm, description: e.target.value })} placeholder="Mô tả vi phạm..." rows={3} />
                    </div>
                  </div>

                  <div className="modal-footer flex gap-3">
                    <button className="btn rounded-xl h-10 px-4 cursor-pointer" onClick={() => setShowViolationForm(false)}>Hủy</button>
                    <button className="btn btnDanger rounded-xl h-10 px-4 cursor-pointer font-bold" disabled={!vForm.horseId || !vForm.description || vLoading} onClick={handleCreateViolation}>
                      {vLoading ? 'Đang xử lý...' : '⚠️ Ghi nhận vi phạm'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ===== TAB 4: Confirm Results ===== */}
        {activeTab === 'results' && (
          <div className="space-y-6">
            {confirmMsg && <div className={`alert ${confirmMsg.type === 'success' ? 'alert-success' : 'alert-error'} mb-4`}>{confirmMsg.text}</div>}

            {openViolations > 0 && (
              <div className="alert alert-warning mb-4">
                ⚠️ Còn {openViolations} vi phạm chưa xử lý. Vui lòng xử lý hết trước khi xác nhận kết quả.
              </div>
            )}

            {/* Existing results */}
            {results.length > 0 && (
              <div>
                <div className="text-lg font-black text-[var(--text)] mb-3">📊 Kết quả hiện tại</div>
                <AnimatedTable
                  data={resultsWithId}
                  columns={monitorResultsColumns}
                  emptyMessage="Chưa có kết quả"
                />
              </div>
            )}

            <div>
              <div className="text-lg font-black text-[var(--text)] mb-4">🏅 Nhập bảng xếp hạng</div>

              <div className="space-y-3">
                {rankings.map((r, idx) => (
                  <div key={idx} className="flex flex-wrap items-end gap-3 rounded-xl bg-white/[0.01] border border-white/[0.03] p-3">
                    <div className="form-group" style={{ maxWidth: 80 }}>
                      <label className="text-xs">Hạng</label>
                      <input className="h-10 rounded-lg text-center" type="number" min="1" value={r.position} onChange={(e) => updateRanking(idx, 'position', e.target.value)} />
                    </div>
                    <div className="form-group flex-1 min-w-[150px]">
                      <label className="text-xs">Ngựa</label>
                      <select className="h-10 rounded-lg" value={r.horseId} onChange={(e) => updateRanking(idx, 'horseId', e.target.value)}>
                        <option value="">— Chọn ngựa —</option>
                        {horses.map((h) => {
                          const horse = (h.horse || h) as any
                          return <option key={horse._id} value={horse._id}>{horse.name}</option>
                        })}
                      </select>
                    </div>
                    <div className="form-group flex-1 min-w-[120px]">
                      <label className="text-xs">Tên Jockey</label>
                      <input
                        className="h-10 rounded-lg bg-white/[0.02] border-white/[0.05] cursor-not-allowed opacity-80"
                        value={findJockeyForHorse(r.horseId).name || 'Chưa xác định'}
                        readOnly
                        placeholder="Tên Jockey"
                      />
                    </div>
                    <div className="form-group flex-1 min-w-[120px]">
                      <label className="text-xs">Thời gian</label>
                      <input className="h-10 rounded-lg" value={r.finishTime} onChange={(e) => updateRanking(idx, 'finishTime', e.target.value)} placeholder="1:12.345" />
                    </div>
                    <button className="btn btnDanger h-10 w-10 p-0 flex items-center justify-center rounded-lg cursor-pointer shrink-0" onClick={() => removeRanking(idx)}>✕</button>
                  </div>
                ))}
              </div>

              <button className="btn rounded-xl h-10 px-4 cursor-pointer mt-4 font-bold" onClick={addRankingRow}>+ Thêm hàng xếp hạng</button>
            </div>

            <div className="form-group">
              <label>Ghi chú cuộc đua</label>
              <textarea className="rounded-lg p-3" value={resultNotes} onChange={(e) => setResultNotes(e.target.value)} placeholder="Ghi chú về cuộc đua..." rows={2} />
            </div>

            <button
              className="btn btnPrimary rounded-xl h-11 px-6 font-bold cursor-pointer transition-all"
              disabled={rankings.length === 0 || confirmLoading || openViolations > 0}
              onClick={handleConfirmResult}
            >
              {confirmLoading ? 'Đang xử lý...' : '✅ Xác nhận kết quả cuộc đua'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
