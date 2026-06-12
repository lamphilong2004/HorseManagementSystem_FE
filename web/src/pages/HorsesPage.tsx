import { useEffect, useState, startTransition } from 'react'
import type { Horse, Race, Jockey } from '../types'
import {
  getHorses,
  createHorse,
  updateHorse,
  deleteHorse,
  getRaces,
  getRaceHorses,
  registerHorseRace,
  searchJockeys,
  sendJockeyInvitation,
  getHorseJockeys,
  confirmJockey,
  confirmRaceParticipation,
  getHorseResults
} from '@/api'
import { Pagination } from '@/components/ui/Pagination'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollReveal } from '@/components/ui/scroll-text'
import { Magnetic } from '@/components/ui/magnetic'
import { useAnimatedToast } from '@/components/ui/animated-toast'
import { AnimatedTable, type ColumnDef, type SortDirection } from '@/components/ui/animated-table'
import { CalendarRange, Search, Trophy, Activity, FileCheck, Check, X, Users, History, TrendingUp, AlertTriangle, Edit, Trash2, Plus, ShieldCheck } from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────
type Tab = 'my-horses' | 'race-registration' | 'hire-jockey' | 'invitations' | 'my-registrations'

// ─── Helpers ──────────────────────────────────────────────────────────────────
function horseAvatarColor(name: string): string {
  const colors = [
    'linear-gradient(135deg,#059669,#047857)',
    'linear-gradient(135deg,#3b82f6,#1d4ed8)',
    'linear-gradient(135deg,#f59e0b,#d97706)',
    'linear-gradient(135deg,#8b5cf6,#6d28d9)',
    'linear-gradient(135deg,#f97316,#ea580c)',
    'linear-gradient(135deg,#06b6d4,#0e7490)',
    'linear-gradient(135deg,#ec4899,#be185d)',
    'linear-gradient(135deg,#10b981,#059669)',
  ]
  const idx = (name.charCodeAt(0) + name.charCodeAt(name.length - 1)) % colors.length
  return colors[idx]
}

function statusConfig(status: string) {
  const map: Record<string, { cls: string; label: string; icon: any }> = {
    PENDING:  { cls: 'border-amber-500/30 bg-amber-500/10 text-amber-600',  label: 'Chờ duyệt', icon: <AlertTriangle className="w-3 h-3 mr-1" /> },
    APPROVED: { cls: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600', label: 'Đã duyệt', icon: <Check className="w-3 h-3 mr-1" /> },
    REJECTED: { cls: 'border-red-500/30 bg-red-500/10 text-red-600', label: 'Bị từ chối', icon: <X className="w-3 h-3 mr-1" /> },
  }
  return map[status] ?? { cls: 'border-slate-500/30 bg-slate-500/10 text-slate-400', label: status, icon: null }
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export function HorsesPage() {
  const [activeTab, setActiveTab] = useState<Tab>('my-horses')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [horses, setHorses] = useState<Horse[]>([])
  const [races, setRaces] = useState<Race[]>([])
  const [jockeys, setJockeys] = useState<Jockey[]>([])
  const [invitations, setInvitations] = useState<any[]>([])

  const [selectedHorseId, setSelectedHorseId] = useState<string>('')
  const [jockeySearch, setJockeySearch] = useState<string>('')
  const [inviteRaceId, setInviteRaceId] = useState<string>('')
  const [registrations, setRegistrations] = useState<{ race: Race; horseId: string; horseName: string; status: string; rejectionReason?: string; confirmedByOwner?: boolean }[]>([])
  // Races that the selected horse has APPROVED registration for (used in hire-jockey tab)
  const [horseRegisteredRaces, setHorseRegisteredRaces] = useState<{ raceId: string; raceName: string; status: string }[]>([])

  // Pagination
  const [horsePage, setHorsePage] = useState(1)
  const PAGE_SIZE = 6

  const [showHorseModal, setShowHorseModal] = useState(false)
  const [selectedHorse, setSelectedHorse] = useState<Horse | null>(null)
  const [horseForm, setHorseForm] = useState({
    name: '', breed: '', age: 3, weight: 450, color: '', gender: 'MALE' as 'MALE' | 'FEMALE', origin: '', healthCertUrl: '',
  })

  // Horse Results Modal
  const [showResultsModal, setShowResultsModal] = useState(false)
  const [horseResults, setHorseResults] = useState<any>(null)
  const [loadingResults, setLoadingResults] = useState(false)
  const [resultsSortColumn, setResultsSortColumn] = useState<string | undefined>()
  const [resultsSortDirection, setResultsSortDirection] = useState<SortDirection>(null)
  const [resultsFilters, setResultsFilters] = useState<Record<string, string>>({})
  const [resultsPage, setResultsPage] = useState(1)

  const handleResultsSort = (columnId: string, direction: SortDirection) => {
    setResultsSortColumn(columnId)
    setResultsSortDirection(direction)
  }

  const handleResultsFilterChange = (columnId: string, value: string) => {
    setResultsFilters(prev => ({ ...prev, [columnId]: value }))
    setResultsPage(1)
  }

  const { addToast } = useAnimatedToast()
  
  const showToast = (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'success') => {
    addToast({ message, type })
  }

  useEffect(() => { loadData() }, [activeTab])

  useEffect(() => {
    if (activeTab === 'invitations' && selectedHorseId) {
      getHorseJockeys(selectedHorseId).then(setInvitations).catch(() => setInvitations([]))
    }
  }, [selectedHorseId, activeTab])

  // When horse changes in hire-jockey tab, load the races that horse is approved for
  useEffect(() => {
    if (activeTab !== 'hire-jockey' || !selectedHorseId) {
      setHorseRegisteredRaces([])
      setInviteRaceId('')
      return
    }
    
    // Filter registrations for the selected horse
    const approved = registrations
      .filter((r) => String(r.horseId).trim() === String(selectedHorseId).trim())
      .map((r) => ({
        raceId: r.race.id,
        raceName: r.race.name,
        status: r.status,
      }))
    
    setHorseRegisteredRaces(approved)
    if (approved.length > 0) {
      setInviteRaceId(approved[0].raceId)
    } else {
      setInviteRaceId('')
    }
  }, [selectedHorseId, activeTab, registrations])

  const loadData = async () => {
    setLoading(true)
    setError(null)
    try {
      const hList = await getHorses()
      setHorses(hList)
      
      const rList = await getRaces()
      
      // Load registrations for our horses in all races for synchronization
      const myHorseIds = new Set(hList.map((h) => String(h.id || h._id)))
      const regs: { race: Race; horseId: string; horseName: string; status: string; rejectionReason?: string; confirmedByOwner?: boolean; registrationId?: string }[] = []
      
      await Promise.all(
        rList.map(async (race) => {
          try {
            const matched = await getRaceHorses(race.id)
            matched.forEach((entry: any) => {
              const horseId = String(entry.horseId || '').trim()
              if (myHorseIds.has(horseId)) {
                const matchedHorse = hList.find((h) => String(h.id || h._id) === horseId)
                regs.push({
                  race,
                  horseId,
                  horseName: matchedHorse?.name || entry.horse?.name || 'Ngựa',
                  status: entry.status || entry.registrationStatus || 'PENDING',
                  confirmedByOwner: entry.confirmedByOwner,
                  rejectionReason: entry.rejectionReason,
                  registrationId: entry.registrationId || entry.id || entry._id,
                })
              }
            })
          } catch { /* skip races with errors */ }
        })
      )
      setRegistrations(regs)

      if (hList.length > 0) {
        const firstId = String(hList[0].id || hList[0]._id || '')
        setSelectedHorseId((prev) => {
          const prevStr = String(prev || '')
          return prevStr && hList.some((h) => String(h.id || h._id) === prevStr) ? prevStr : firstId
        })
      }

      if (activeTab === 'race-registration') {
        setRaces(rList.filter((r) => r.status === 'SCHEDULED'))
      } else if (activeTab === 'hire-jockey') {
        const jList = await searchJockeys({ limit: 100 })
        setJockeys(jList)
        const availableRaces = rList.filter((race) => ['SCHEDULED', 'CONFIRMED', 'UPCOMING'].includes(race.status?.toUpperCase() || ''))
        setRaces(availableRaces)
        if (availableRaces.length > 0 && !inviteRaceId) {
          setInviteRaceId(String(availableRaces[0].id || availableRaces[0]._id))
        }
      } else if (activeTab === 'invitations' && selectedHorseId) {
        const iList = await getHorseJockeys(selectedHorseId)
        setInvitations(iList)
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message)
    } finally {
      setLoading(false)
    }
  }

  // ── Horse CRUD ──────────────────────────────────────────────────────────────
  const openHorseModal = (h: Horse | null) => {
    setSelectedHorse(h)
    setHorseForm(
      h
        ? { name: h.name, breed: h.breed || '', age: h.age || 0, weight: h.weight || 0, color: h.color || '', gender: h.gender || 'MALE', origin: h.origin || '', healthCertUrl: h.healthCertUrl || '' }
        : { name: '', breed: '', age: 3, weight: 450, color: '', gender: 'MALE', origin: '', healthCertUrl: '' },
    )
    setShowHorseModal(true)
  }

  const handleSaveHorse = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (selectedHorse) {
        await updateHorse(selectedHorse.id, horseForm)
        showToast(`Đã cập nhật thông tin ngựa ${horseForm.name}`)
      } else {
        await createHorse(horseForm)
        showToast(`Đã thêm ngựa ${horseForm.name} — Đang chờ Admin duyệt`)
      }
      setShowHorseModal(false)
      loadData()
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Lỗi khi lưu hồ sơ ngựa', 'error')
    }
  }

  const handleDeleteHorse = async (id: string, name: string) => {
    if (!window.confirm(`Xóa ngựa "${name}"?`)) return
    try {
      await deleteHorse(id)
      showToast(`Đã xóa ngựa ${name}`)
      loadData()
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Không thể xóa (Ngựa đang tham gia cuộc đua)', 'error')
    }
  }

  // ── Actions ─────────────────────────────────────────────────────────────────
  const handleRegisterRace = async (race: Race) => {
    if (!selectedHorseId) return showToast('Vui lòng chọn ngựa', 'warning')
    const horse = horses.find((h) => String(h.id || h._id) === selectedHorseId)
    if (horse?.status !== 'APPROVED') return showToast('Chỉ ngựa đã được Admin duyệt mới có thể đăng ký', 'warning')
    try {
      await registerHorseRace(selectedHorseId, race.id)
      showToast(`Đã đăng ký ngựa vào "${race.name}"`)
      loadData()
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Không thể đăng ký cuộc đua', 'error')
    }
  }

  const handleInviteJockey = async (jockeyId: string, jockeyName: string) => {
    if (!selectedHorseId) return showToast('Vui lòng chọn ngựa', 'warning')
    if (!inviteRaceId) return showToast('Vui lòng chọn cuộc đua', 'warning')

    const cleanHorseId = String(selectedHorseId).trim()
    const cleanRaceId = String(inviteRaceId).trim()
    const cleanJockeyId = String(jockeyId).trim()

    const horse = horses.find((h) => String(h.id || h._id).trim() === cleanHorseId)
    // Look in both races (all races) and horseRegisteredRaces (filtered for this horse in hire-jockey tab)
    const race = races.find((r) => String(r.id || r._id).trim() === cleanRaceId)
    const registeredRace = horseRegisteredRaces.find((r) => r.raceId === cleanRaceId)
    
    if (!horse) return showToast('Ngựa không hợp lệ. Vui lòng chọn ngựa khác.', 'error')
    if (!race && !registeredRace) return showToast('Cuộc đua không hợp lệ. Vui lòng chọn lại cuộc đua.', 'error')

    const raceName = race?.name || registeredRace?.raceName || cleanRaceId
    console.log('Validating registration for:', { horseName: horse.name, raceName, raceId: cleanRaceId })

    // Validate that the selected horse is registered for the invited race.
    // registeredEntry declared in outer scope so it's accessible after the try block.
    let registeredEntry: any = undefined
    try {
      const raceHorses = await getRaceHorses(cleanRaceId)
      const entries = Array.isArray(raceHorses) ? raceHorses : (raceHorses.horses || [])

      console.log('[DEBUG] raceHorses entries:', entries.map((e: any) => ({ horseId: e.horseId, status: e.status })))
      console.log('[DEBUG] looking for cleanHorseId:', cleanHorseId)

      registeredEntry = entries.find((entry: any) => {
        const entryHorseId = String(
          entry.horseId ||
          (entry.horse && (entry.horse._id || entry.horse.id)) ||
          entry._id ||
          entry.id ||
          ''
        ).trim()
        console.log('[DEBUG] comparing entryHorseId:', entryHorseId, '=== cleanHorseId:', cleanHorseId, '->', entryHorseId === cleanHorseId)
        return entryHorseId === cleanHorseId
      })

      console.log('[DEBUG] registeredEntry found:', !!registeredEntry, registeredEntry)

      if (!registeredEntry) {
        console.warn('Horse not found in race entries:', { entries, horseId: cleanHorseId })
        return showToast('Ngựa chưa đăng ký cuộc đua này. Vui lòng đăng ký (tab Đăng Ký Đua) trước khi mời Jockey.', 'warning')
      }

      const regStatus = String(registeredEntry.status || registeredEntry.registrationStatus || '').toUpperCase()
      if (regStatus === 'PENDING' || regStatus === 'PENDING_APPROVAL') {
        return showToast('Đăng ký đang chờ Admin duyệt. Vui lòng đợi Admin duyệt trước khi mời Jockey.', 'warning')
      }
      if (regStatus === 'REJECTED') {
        return showToast('Đăng ký đã bị từ chối. Bạn không thể mời Jockey cho cuộc đua này.', 'error')
      }
    } catch (error: any) {
      console.error('Validation error:', error)
      if (error?.response?.status === 401) {
        return // Stop if 401 - interceptor will redirect
      }
      // For any other error, block the invitation with a clear message
      const errMsg = error?.response?.data?.message || error?.message || 'Lỗi kiểm tra đăng ký'
      return showToast(`Không thể xác minh trạng thái đăng ký: ${errMsg}. Vui lòng đăng ký ngựa vào cuộc đua trước.`, 'error')
    }

    try {
      const regId = registeredEntry?.registrationId || registeredEntry?.id || ''
      console.log('Sending invitation:', { cleanHorseId, cleanJockeyId, cleanRaceId, regId })
      await sendJockeyInvitation(cleanHorseId, cleanJockeyId, cleanRaceId, 'Mời bạn cưỡi ngựa của tôi', regId)
      showToast(`Đã gửi lời mời đến Jockey ${jockeyName}`)
    } catch (err: any) {
      console.error('sendJockeyInvitation error:', err?.response?.data || err?.message)
      const msg = err.response?.data?.message || err.response?.data?.error || 'Không thể gửi lời mời. Vui lòng kiểm tra lại trạng thái ngựa và cuộc đua.'
      showToast(msg, 'error')
    }
  }

  const handleConfirmJockey = async (jockeyId: string, raceId: string, jockeyName: string) => {
    if (!selectedHorseId) return
    try {
      await confirmJockey(selectedHorseId, jockeyId, raceId)
      showToast(`Đã chốt Jockey ${jockeyName} thành công!`)
      loadData()
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Không thể chốt Jockey', 'error')
    }
  }

  const handleConfirmRace = async (horseId: string, raceId: string) => {
    try {
      setLoading(true)
      await confirmRaceParticipation(horseId, raceId)
      showToast('Đã xác nhận tham gia đua thành công!')
      loadData()
    } catch (err: any) {
      showToast(err.response?.data?.message || err.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  const openHorseResults = async (horseId: string, horseName: string) => {
    setShowResultsModal(true)
    setLoadingResults(true)
    setHorseResults({ horseName, stats: null, results: [] })
    try {
      const data = await getHorseResults(horseId)
      setHorseResults(data)
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Không thể tải kết quả', 'error')
    } finally {
      setLoadingResults(false)
    }
  }

  const filteredJockeys = jockeys
    .filter((j) => {
      const name = (j.userId?.fullName || j.userId?.name || '').toLowerCase()
      return name.includes(jockeySearch.toLowerCase())
    })
    .sort((a, b) => {
      // Sort by createdAt descending (newest first)
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0
      if (dateA !== dateB) return dateB - dateA
      
      // Fallback to ID sorting if createdAt is missing or same
      return String(b.id).localeCompare(String(a.id))
    })
  const selectedHorseObj = horses.find((h) => String(h.id || h._id) === selectedHorseId)

  return (
    <div className="space-y-6">
      {/* Header section */}
      <ScrollReveal direction="up" distance={60} duration={0.8}>
        <div className="flex items-center justify-between gap-4 mb-8">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-[var(--primary-light)] p-3 ring-1 ring-[var(--primary-ring)]">
                <Trophy className="h-8 w-8 text-[var(--primary)]" />
              </div>
              <h1 className="text-4xl font-black text-[var(--text)] m-0">Quản Lý Ngựa</h1>
            </div>
            <p className="text-[var(--muted)] font-semibold text-sm max-w-xl">
              Thêm mới hồ sơ ngựa, đăng ký đua và tìm kiếm Jockey chuyên nghiệp cho đội của bạn.
            </p>
          </div>
          {activeTab === 'my-horses' && (
            <Magnetic intensity={0.2}>
              <Button onClick={() => openHorseModal(null)} className="h-11 px-6 font-bold bg-gradient-to-r from-[var(--primary)] to-[var(--primary-dark)] text-white hover:opacity-90 shadow-lg shadow-[var(--primary)]/25 rounded-xl transition-all duration-300 flex items-center gap-2 border-none">
                <Plus className="w-4 h-4" /> Thêm Ngựa Mới
              </Button>
            </Magnetic>
          )}
        </div>
      </ScrollReveal>

      {error && (
        <div className="rounded-lg bg-red-500/10 border border-red-500/30 text-red-500 p-4 font-semibold text-sm flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" /> {error}
        </div>
      )}

      <Tabs value={activeTab} onValueChange={(v: any) => startTransition(() => setActiveTab(v))}>
        <ScrollReveal direction="up" distance={20} duration={0.5} delay={0.1}>
          <TabsList className="!bg-[var(--surface-2)] border border-[var(--border)]/45 p-1.5 rounded-2xl shadow-inner mb-8 flex flex-wrap gap-1 h-auto w-fit">
            <TabsTrigger value="my-horses" className="py-2.5 px-4 rounded-xl font-bold transition-all"><Trophy className="w-4 h-4 mr-2" /> Hồ Sơ Ngựa</TabsTrigger>
            <TabsTrigger value="race-registration" className="py-2.5 px-4 rounded-xl font-bold transition-all"><Activity className="w-4 h-4 mr-2" /> Đăng Ký Đua</TabsTrigger>
            <TabsTrigger value="my-registrations" className="py-2.5 px-4 rounded-xl font-bold transition-all"><FileCheck className="w-4 h-4 mr-2" /> Đã Đăng Ký</TabsTrigger>
            <TabsTrigger value="hire-jockey" className="py-2.5 px-4 rounded-xl font-bold transition-all"><Users className="w-4 h-4 mr-2" /> Tuyển Jockey</TabsTrigger>
            <TabsTrigger value="invitations" className="py-2.5 px-4 rounded-xl font-bold transition-all"><History className="w-4 h-4 mr-2" /> Lời Mời Jockey</TabsTrigger>
          </TabsList>
        </ScrollReveal>

        {/* ── TAB 1: My Horses ── */}
        <TabsContent value="my-horses">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 h-64 animate-pulse flex flex-col justify-between">
                  <div className="flex gap-4">
                    <div className="w-14 h-14 rounded-xl bg-[var(--border)]" />
                    <div className="flex-1 space-y-2 py-1">
                      <div className="h-4 bg-[var(--border)] rounded w-3/4" />
                      <div className="h-3 bg-[var(--border)] rounded w-1/2" />
                    </div>
                  </div>
                  <div className="h-10 bg-[var(--border)] rounded-lg w-full" />
                  <div className="flex justify-between items-center">
                    <div className="h-3 bg-[var(--border)] rounded w-1/4" />
                    <div className="h-8 bg-[var(--border)] rounded w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : horses.length === 0 ? (
            <Card className="border-[var(--border)] bg-[var(--surface)] text-center py-20 rounded-2xl shadow-xl">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[var(--bg2)]/60 border border-[var(--border)] mb-6 shadow-inner text-4xl animate-bounce">🐴</div>
              <h3 className="text-xl font-bold text-[var(--text)] mb-2">Chưa có ngựa nào</h3>
              <p className="text-[var(--muted)] max-w-sm mx-auto font-medium mb-6">Bạn cần thêm hồ sơ ngựa để có thể đăng ký tham gia các giải đấu hấp dẫn.</p>
              <Button onClick={() => openHorseModal(null)} className="border-none bg-gradient-to-r from-[var(--primary)] to-[var(--primary-dark)] text-white hover:opacity-90 px-6 py-2.5 rounded-xl font-bold shadow-lg shadow-[var(--primary)]/20">
                Thêm ngựa ngay
              </Button>
            </Card>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {horses.slice((horsePage - 1) * PAGE_SIZE, horsePage * PAGE_SIZE).map((h, index) => {
                  const sc = statusConfig(h.status || 'PENDING')
                  return (
                    <ScrollReveal key={h.id} direction="up" distance={40} duration={0.6} delay={index * 0.1}>
                      <Card className="h-full border-[var(--border)] bg-gradient-to-b from-[var(--surface)] to-[var(--surface)]/80 hover:border-[var(--primary)]/40 hover:shadow-2xl hover:shadow-[var(--primary)]/5 hover:-translate-y-1.5 transition-all duration-300 rounded-2xl overflow-hidden flex flex-col group">
                        <div className="p-5 border-b border-[var(--border)] flex items-start gap-4">
                          <div className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl shadow-lg shrink-0 group-hover:scale-110 transition-transform duration-300" style={{ background: horseAvatarColor(h.name) }}>🐎</div>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start gap-1 mb-1">
                              <h3 className="font-bold text-lg text-[var(--text)] truncate m-0">{h.name}</h3>
                              <Badge variant="outline" className={`shrink-0 flex items-center px-2 py-0.5 text-[10px] font-bold rounded-full ${sc.cls}`}>{sc.icon}{sc.label}</Badge>
                            </div>
                            <p className="text-xs text-[var(--muted)] font-medium truncate">{h.breed || 'Không rõ giống'} · {h.origin || 'Không rõ xuất xứ'}</p>
                            <div className="flex gap-2 mt-3">
                              <Badge variant="secondary" className="bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border-none text-[10px] px-2 py-0.5"><Activity className="w-3 h-3 mr-1" /> {(h as any).stats?.races ?? 0} trận</Badge>
                              <Badge variant="secondary" className="bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border-none text-[10px] px-2 py-0.5"><Trophy className="w-3 h-3 mr-1" /> {(h as any).stats?.wins ?? 0} thắng</Badge>
                            </div>
                          </div>
                        </div>
                        <div className="p-4 grid grid-cols-3 gap-3 bg-[var(--bg2)]/40 backdrop-blur-sm">
                          <div className="text-center p-2.5 bg-[var(--surface-2)]/50 rounded-xl border border-[var(--border)]/40 hover:bg-[var(--surface-2)] transition-colors">
                            <div className="font-extrabold text-[var(--text)] text-sm">{h.age}</div>
                            <div className="text-[10px] uppercase text-[var(--muted)] font-bold mt-0.5 tracking-wider">Tuổi</div>
                          </div>
                          <div className="text-center p-2.5 bg-[var(--surface-2)]/50 rounded-xl border border-[var(--border)]/40 hover:bg-[var(--surface-2)] transition-colors">
                            <div className="font-extrabold text-[var(--text)] text-sm">{h.weight}</div>
                            <div className="text-[10px] uppercase text-[var(--muted)] font-bold mt-0.5 tracking-wider">Kg</div>
                          </div>
                          <div className="text-center p-2.5 bg-[var(--surface-2)]/50 rounded-xl border border-[var(--border)]/40 hover:bg-[var(--surface-2)] transition-colors">
                            <div className="font-extrabold text-[var(--text)] text-sm">{h.gender === 'MALE' ? 'Đực' : 'Cái'}</div>
                            <div className="text-[10px] uppercase text-[var(--muted)] font-bold mt-0.5 tracking-wider">Giới Tính</div>
                          </div>
                        </div>
                        <div className="mt-auto p-4 flex items-center justify-between border-t border-[var(--border)] bg-[var(--bg2)]/10">
                          {h.healthCertUrl ? (
                            <a href={h.healthCertUrl} target="_blank" rel="noreferrer" className="text-xs font-bold text-emerald-400 hover:text-emerald-300 hover:underline flex items-center gap-1 transition-colors">
                              <ShieldCheck className="w-4 h-4 text-emerald-400" /> Sức Khỏe
                            </a>
                          ) : (
                            <span className="text-xs font-bold text-amber-500/80 flex items-center gap-1"><AlertTriangle className="w-4 h-4 text-amber-500" /> Chưa duyệt</span>
                          )}
                          <div className="flex gap-1">
                            <Button variant="ghost" size="sm" className="h-8 px-2 text-xs font-bold text-[var(--primary)] hover:bg-[var(--primary-light)] rounded-lg transition-all" onClick={() => openHorseResults(h.id, h.name)}>
                              <TrendingUp className="w-3.5 h-3.5 mr-1" /> KQ
                            </Button>
                            <Button variant="outline" size="sm" className="h-8 px-2.5 text-xs font-bold hover:border-[var(--primary)] hover:text-[var(--primary)] rounded-lg border-[var(--border)] bg-transparent transition-all" onClick={() => openHorseModal(h)}>
                              <Edit className="w-3.5 h-3.5 mr-1" /> Sửa
                            </Button>
                            <Button variant="outline" size="sm" className="h-8 px-2.5 text-xs font-bold border-red-500/20 text-red-400 hover:bg-red-500/10 hover:border-red-500/40 rounded-lg bg-transparent transition-all" onClick={() => handleDeleteHorse(h.id, h.name)}>
                              <Trash2 className="w-3.5 h-3.5 mr-1" /> Xóa
                            </Button>
                          </div>
                        </div>
                      </Card>
                    </ScrollReveal>
                  )
                })}
              </div>
              {horses.length > PAGE_SIZE && (
                <div className="mt-8 flex justify-center">
                  <Pagination total={horses.length} page={horsePage} pageSize={PAGE_SIZE} onChange={setHorsePage} />
                </div>
              )}
            </>
          )}
        </TabsContent>

        {/* ── TAB 2: Race Registration ── */}
        <TabsContent value="race-registration">
          <Card className="border-[var(--border)] bg-gradient-to-b from-[var(--surface)] to-[var(--surface)]/90 p-6 rounded-2xl shadow-xl">
            <CardHeader className="p-0 mb-6">
              <CardTitle className="text-2xl font-black text-[var(--text)] flex items-center gap-2">🏁 Đăng Ký Đua</CardTitle>
              <CardDescription className="text-slate-400 font-semibold mt-1">Chọn ngựa đã duyệt và ghi danh vào các cuộc đua sắp tới.</CardDescription>
            </CardHeader>
            
            <div className="flex items-center gap-4 mb-8 bg-[var(--bg2)]/80 backdrop-blur-md p-4 rounded-2xl border border-[var(--border)]/40 flex-wrap">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl shrink-0 shadow-md transition-all duration-300" style={{ background: selectedHorseObj ? horseAvatarColor(selectedHorseObj.name) : 'rgba(255,255,255,0.05)' }}>{selectedHorseObj ? '🐎' : '?'}</div>
              <div className="flex-1 min-w-[200px]">
                <label className="text-[10px] font-extrabold text-[var(--muted)] uppercase tracking-wider mb-1 block">Chọn Ngựa Tham Gia</label>
                <select 
                  className="w-full h-10 bg-[var(--surface-2)]/80 border border-[var(--border)] rounded-xl px-3 text-sm font-semibold text-white outline-none focus:border-[var(--primary)] transition-all cursor-pointer"
                  value={selectedHorseId} 
                  onChange={(e) => setSelectedHorseId(e.target.value)}
                >
                  <option value="">— Chọn ngựa —</option>
                  {horses.map((h) => <option key={h.id} value={String(h.id || h._id)}>{h.name} {h.status === 'APPROVED' ? ' (Đã duyệt ✅)' : ' (Chờ duyệt ⏳)'}</option>)}
                </select>
              </div>
              {selectedHorseObj && selectedHorseObj.status !== 'APPROVED' && (
                <Badge variant="outline" className="border-red-500/30 bg-red-500/10 text-red-400 font-bold py-1 px-3 rounded-full flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5 mr-0.5" /> Ngựa Chưa Duyệt
                </Badge>
              )}
            </div>

            {loading ? (
              <div className="space-y-4">
                {[1, 2].map((i) => (
                  <div key={i} className="h-24 rounded-xl bg-[var(--border)]/40 animate-pulse w-full" />
                ))}
              </div>
            ) : races.length === 0 ? (
              <div className="text-center p-12 border border-dashed border-[var(--border)]/30 rounded-2xl bg-[var(--bg2)]/20">
                <div className="text-4xl mb-3">🏁</div>
                <h3 className="text-lg font-bold text-slate-300">Không có cuộc đua nào khả dụng</h3>
                <p className="text-xs text-[var(--muted)] mt-1 font-medium">Hiện không có cuộc đua nào đang trong trạng thái mở đăng ký.</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {races.map((r, idx) => {
                  const reg = registrations.find((reg) => reg.race.id === r.id && String(reg.horseId).trim() === String(selectedHorseId).trim())
                  const isRegistered = !!reg
                  const status = String(reg?.status || '').toUpperCase()

                  return (
                    <ScrollReveal key={r.id} direction="up" distance={20} delay={idx * 0.05}>
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl border border-[var(--border)]/60 bg-[var(--surface-2)]/40 hover:bg-[var(--surface-2)]/60 hover:border-[var(--primary)]/30 hover:shadow-lg transition-all duration-300">
                        <div className="space-y-2">
                          <h4 className="font-extrabold text-white text-lg m-0 flex items-center gap-2">
                            🏆 {r.name}
                          </h4>
                          <div className="flex flex-wrap gap-2.5">
                            <Badge variant="secondary" className="bg-[var(--bg2)]/80 text-[11px] font-semibold text-slate-300 border border-[var(--border)]/20 px-2.5 py-0.5 rounded-lg flex items-center gap-1">
                              <CalendarRange className="w-3.5 h-3.5 text-[var(--primary)]" /> {new Date(r.scheduledAt).toLocaleString('vi-VN')}
                            </Badge>
                            <Badge variant="secondary" className="bg-[var(--bg2)]/80 text-[11px] font-semibold text-slate-300 border border-[var(--border)]/20 px-2.5 py-0.5 rounded-lg">
                              📏 {r.distance}m
                            </Badge>
                            <Badge variant="secondary" className="bg-[var(--bg2)]/80 text-[11px] font-semibold text-slate-300 border border-[var(--border)]/20 px-2.5 py-0.5 rounded-lg">
                              👥 Tối đa {r.maxHorses} ngựa
                            </Badge>
                          </div>
                        </div>
                        <div className="flex items-center justify-between md:flex-col md:items-end gap-3 shrink-0 pt-4 md:pt-0 border-t md:border-t-0 border-[var(--border)]/20">
                          <div className="text-amber-400 font-black text-sm bg-amber-500/10 px-3 py-1 rounded-xl border border-amber-500/20">
                            🥇 Giải nhất: {r.prizeFirst?.toLocaleString('vi-VN')} đ
                          </div>
                          
                          {/* Dynamic button / status based on synchronization logic */}
                          <div className="shrink-0">
                            {!selectedHorseId ? (
                              <Button disabled className="opacity-40 font-bold bg-slate-800 text-slate-400 border border-slate-700 rounded-xl px-4 py-2 text-xs">
                                Chọn ngựa trước
                              </Button>
                            ) : selectedHorseObj && selectedHorseObj.status !== 'APPROVED' ? (
                              <span className="text-xs font-bold text-red-400 bg-red-500/10 px-3 py-1.5 rounded-xl border border-red-500/20">
                                ⚠️ Yêu cầu ngựa đã duyệt
                              </span>
                            ) : !isRegistered ? (
                              <Button onClick={() => handleRegisterRace(r)} className="font-bold bg-gradient-to-r from-[var(--primary)] to-[var(--primary-dark)] text-white hover:opacity-95 shadow-md shadow-[var(--primary)]/20 border-none rounded-xl px-4 py-2 text-xs transition-opacity duration-300">
                                Ghi Danh Ngay
                              </Button>
                            ) : (status === 'PENDING' || status === 'PENDING_APPROVAL') ? (
                              <div className="flex flex-col items-end gap-1">
                                <Badge variant="outline" className="border-amber-500/30 bg-amber-500/10 text-amber-400 font-bold py-1 px-3 rounded-full flex items-center gap-1 text-[10px]">
                                  <AlertTriangle className="w-3.5 h-3.5" /> Chờ duyệt
                                </Badge>
                                <span className="text-[10px] text-amber-500/80 font-medium">Đang chờ phê duyệt</span>
                              </div>
                            ) : status === 'APPROVED' && !reg.confirmedByOwner ? (
                              <div className="flex flex-col items-end gap-1">
                                <Badge variant="outline" className="border-blue-500/30 bg-blue-500/10 text-blue-400 font-bold py-1 px-3 rounded-full flex items-center gap-1 text-[10px]">
                                  <Check className="w-3.5 h-3.5" /> Đã được duyệt
                                </Badge>
                                <Button size="sm" onClick={() => handleConfirmRace(selectedHorseId, r.id)} className="h-8 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl shadow-md border-none flex items-center gap-1 mt-1 text-[11px] px-3 animate-pulse">
                                  ✓ Xác nhận đua
                                </Button>
                              </div>
                            ) : (status === 'CONFIRMED' || (status === 'APPROVED' && reg.confirmedByOwner)) ? (
                              <div className="flex flex-col items-end gap-1">
                                <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-400 font-bold py-1 px-3 rounded-full flex items-center gap-1 text-[10px]">
                                  <Check className="w-3.5 h-3.5" /> Đã chốt đua
                                </Badge>
                                <span className="text-[10px] text-emerald-400/80 font-medium">Sẵn sàng đua</span>
                              </div>
                            ) : status === 'REJECTED' ? (
                              <div className="flex flex-col items-end gap-1">
                                <Badge variant="outline" className="border-red-500/30 bg-red-500/10 text-red-400 font-bold py-1 px-3 rounded-full flex items-center gap-1 text-[10px]">
                                  <X className="w-3.5 h-3.5" /> Bị từ chối
                                </Badge>
                                {reg.rejectionReason && <span className="text-[10px] text-red-400/80 font-semibold max-w-[150px] truncate">{reg.rejectionReason}</span>}
                              </div>
                            ) : (
                              <Button onClick={() => handleRegisterRace(r)} className="font-bold bg-gradient-to-r from-[var(--primary)] to-[var(--primary-dark)] text-white hover:opacity-95 shadow-md shadow-[var(--primary)]/20 border-none rounded-xl px-4 py-2 text-xs transition-opacity duration-300">
                                Ghi Danh Ngay
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </ScrollReveal>
                  )
                })}
              </div>
            )}
          </Card>
        </TabsContent>

        {/* ── TAB 3: My Registrations ── */}
        <TabsContent value="my-registrations">
          <Card className="border-[var(--border)] bg-gradient-to-b from-[var(--surface)] to-[var(--surface)]/90 p-6 rounded-2xl shadow-xl">
            <CardHeader className="p-0 mb-6">
              <CardTitle className="text-2xl font-black text-[var(--text)] flex items-center gap-2">📋 Đăng Ký Của Tôi</CardTitle>
              <CardDescription className="text-slate-400 font-semibold mt-1">Theo dõi tình trạng phê duyệt của Admin cho các cuộc đua đã đăng ký.</CardDescription>
            </CardHeader>
            
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-24 rounded-2xl bg-[var(--border)]/40 animate-pulse w-full" />
                ))}
              </div>
            ) : registrations.length === 0 ? (
              <div className="text-center p-12 border border-dashed border-[var(--border)]/30 rounded-2xl bg-[var(--bg2)]/20">
                <div className="text-4xl mb-3">📋</div>
                <h3 className="text-lg font-bold text-slate-300">Chưa có đăng ký nào</h3>
                <p className="text-xs text-[var(--muted)] mt-1 font-medium">Đăng ký chú ngựa của bạn vào cuộc đua ở tab "Đăng Ký Đua" để xem thông tin tại đây.</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {registrations.map((reg, idx) => {
                  const sc = statusConfig(reg.status)
                  const isPending = reg.status === 'PENDING' || reg.status === 'PENDING_APPROVAL'
                  const isApproved = reg.status === 'APPROVED'
                  const isConfirmed = reg.status === 'CONFIRMED'
                  const isRejected = reg.status === 'REJECTED'

                  return (
                    <ScrollReveal key={idx} direction="up" distance={20} delay={idx * 0.05}>
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl border border-[var(--border)]/60 bg-[var(--surface-2)]/40 hover:bg-[var(--surface-2)]/60 hover:border-[var(--primary)]/30 hover:scale-[1.005] hover:shadow-lg transition-all duration-300">
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl shrink-0 shadow-md" style={{ background: horseAvatarColor(reg.horseName) }}>🐎</div>
                          <div className="space-y-1">
                            <h4 className="font-extrabold text-white text-lg m-0">{reg.horseName}</h4>
                            <div className="text-sm font-bold text-slate-300 flex items-center gap-1.5">
                              <Activity className="w-4 h-4 text-[var(--primary)]" /> {reg.race.name}
                            </div>
                            <div className="text-xs text-[var(--muted)] font-medium">📅 Khởi tranh: {new Date(reg.race.scheduledAt).toLocaleString('vi-VN')}</div>
                          </div>
                        </div>
                        <div className="flex flex-col items-start md:items-end gap-2 shrink-0 pt-4 md:pt-0 border-t md:border-t-0 border-[var(--border)]/20">
                          <Badge variant="outline" className={`shrink-0 flex items-center px-3 py-1 text-xs font-bold rounded-full ${sc.cls}`}>
                            {sc.icon} {sc.label}
                          </Badge>
                          
                          <div className="text-xs font-bold text-[var(--muted)] mt-0.5">
                            {isPending && '⏳ Đang chờ Admin xem xét phê duyệt'}
                            {isApproved && (reg.confirmedByOwner ? '✅ Đã xác nhận tham gia đua' : '⚠️ Cần xác nhận tham gia cuộc đua')}
                            {isConfirmed && '🏆 Đã chốt danh sách chính thức'}
                            {isRejected && '❌ Đăng ký đã bị từ chối'}
                          </div>

                          {isRejected && reg.rejectionReason && (
                            <div className="text-xs font-bold text-red-400 bg-red-500/10 border border-red-500/20 px-3 py-2 rounded-xl mt-1">
                              Lý do từ chối: {reg.rejectionReason}
                            </div>
                          )}

                          {isApproved && !reg.confirmedByOwner && (
                            <Button 
                              size="sm" 
                              onClick={() => handleConfirmRace(reg.horseId, reg.race.id)} 
                              className="mt-2 font-bold bg-gradient-to-r from-emerald-500 to-teal-600 hover:opacity-95 text-white shadow-lg shadow-emerald-500/20 border-none rounded-xl px-4 py-2 transition-all duration-300"
                            >
                              ✓ Xác Nhận Tham Gia
                            </Button>
                          )}
                        </div>
                      </div>
                    </ScrollReveal>
                  )
                })}
              </div>
            )}
          </Card>
        </TabsContent>

        {/* ── TAB 4: Hire Jockey ── */}
        <TabsContent value="hire-jockey">
          <Card className="border-[var(--border)] bg-gradient-to-b from-[var(--surface)] to-[var(--surface)]/90 p-6 rounded-2xl shadow-xl">
            <CardHeader className="p-0 mb-6">
              <CardTitle className="text-2xl font-black text-[var(--text)] flex items-center gap-2">🏇 Tuyển Jockey</CardTitle>
              <CardDescription className="text-slate-400 font-semibold mt-1">Tìm kiếm và gửi lời mời đến các kỵ sĩ xuất sắc nhất cho ngựa của bạn.</CardDescription>
            </CardHeader>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 bg-[var(--bg2)]/80 backdrop-blur-md p-4 rounded-2xl border border-[var(--border)]/40">
              <div>
                <label className="text-[10px] font-extrabold text-[var(--muted)] uppercase tracking-wider mb-1 block">Ngựa của bạn</label>
                <select className="w-full h-10 bg-[var(--surface-2)]/80 border border-[var(--border)] rounded-xl px-3 text-sm font-semibold text-white outline-none focus:border-[var(--primary)] cursor-pointer" value={selectedHorseId} onChange={(e) => setSelectedHorseId(e.target.value)}>
                  <option value="">— Chọn ngựa —</option>
                  {horses.map((h) => <option key={h.id} value={String(h.id || h._id)}>{h.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-extrabold text-[var(--muted)] uppercase tracking-wider mb-1 block">Cuộc đua đã đăng ký</label>
                {loading ? (
                  <div className="w-full h-10 bg-[var(--surface-2)]/80 border border-[var(--border)] rounded-xl px-3 flex items-center text-sm text-[var(--muted)]">Đang tải cuộc đua...</div>
                ) : !selectedHorseId ? (
                  <div className="w-full h-10 bg-[var(--surface-2)]/80 border border-[var(--border)] rounded-xl px-3 flex items-center text-xs text-[var(--muted)] font-semibold">Vui lòng chọn ngựa trước</div>
                ) : horseRegisteredRaces.length === 0 ? (
                  <div className="w-full h-auto bg-amber-500/10 border border-amber-500/30 rounded-xl px-3 py-2 text-xs font-semibold text-amber-600">
                    ⚠️ Ngựa chưa đăng ký cuộc đua đã duyệt nào
                  </div>
                ) : (
                  <select className="w-full h-10 bg-[var(--surface-2)]/80 border border-[var(--border)] rounded-xl px-3 text-sm font-semibold text-white outline-none focus:border-[var(--primary)] cursor-pointer" value={inviteRaceId} onChange={(e) => setInviteRaceId(e.target.value)}>
                    <option value="">— Chọn cuộc đua —</option>
                    {horseRegisteredRaces.map((r) => (
                      <option key={r.raceId} value={r.raceId}>
                        {r.raceName} {r.status === 'APPROVED' ? ' (Đã duyệt ✅)' : r.status === 'PENDING_APPROVAL' ? ' (Chờ duyệt ⏳)' : r.status === 'REJECTED' ? ' (Từ chối ❌)' : ''}
                      </option>
                    ))}
                  </select>
                )}
              </div>
              <div>
                <label className="text-[10px] font-extrabold text-[var(--muted)] uppercase tracking-wider mb-1 block">Tìm Jockey</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted)]" />
                  <input placeholder="Tìm kỵ sĩ theo tên..." className="w-full h-10 bg-[var(--surface-2)]/80 border border-[var(--border)] rounded-xl pl-9 pr-3 text-sm font-semibold text-white outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary-ring)]" value={jockeySearch} onChange={(e) => setJockeySearch(e.target.value)} />
                </div>
              </div>
            </div>

            {loading ? (
              <div className="grid md:grid-cols-2 gap-4">
                {[1, 2].map((i) => (
                  <div key={i} className="h-32 rounded-2xl bg-[var(--border)]/40 animate-pulse w-full" />
                ))}
              </div>
            ) : filteredJockeys.length === 0 ? (
              <div className="text-center p-12 border border-dashed border-[var(--border)]/30 rounded-2xl bg-[var(--bg2)]/20">
                <div className="text-4xl mb-3">🏇</div>
                <h3 className="text-lg font-bold text-slate-300">Không tìm thấy Jockey</h3>
                <p className="text-xs text-[var(--muted)] mt-1 font-medium">Thử nhập tên tìm kiếm khác.</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {filteredJockeys.map((j, idx) => {
                  const name = j.userId?.fullName || j.userId?.name || 'Jockey'
                  const winRate = j.winRate ?? 0
                  const isAvailable = j.status === 'AVAILABLE'

                  return (
                    <ScrollReveal key={j.id} direction="up" distance={20} delay={idx * 0.05}>
                      <div className="flex flex-col gap-4 p-5 rounded-2xl border border-[var(--border)]/60 bg-[var(--surface-2)]/40 hover:bg-[var(--surface-2)]/60 hover:border-[var(--primary)]/30 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between">
                        <div className="flex gap-4">
                          <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-sky-500/20 to-indigo-500/10 text-sky-400 flex items-center justify-center font-extrabold text-lg shrink-0 border border-sky-500/20 shadow-inner">
                            {name.slice(0, 2).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-center gap-1 mb-1">
                              <h4 className="font-extrabold text-white truncate text-base m-0">{name}</h4>
                              <Badge variant="outline" className={`shrink-0 text-[10px] font-bold rounded-full py-0.5 px-2.5 ${isAvailable ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400' : 'border-slate-500/30 bg-slate-500/10 text-slate-400'}`}>
                                {isAvailable ? 'Sẵn sàng' : 'Bận'}
                              </Badge>
                            </div>
                            <div className="flex gap-2 mt-1.5">
                              <Badge variant="secondary" className="bg-[var(--bg2)]/60 text-slate-300 border border-[var(--border)]/20 text-[10px] font-semibold px-2 py-0.5 rounded-lg"><History className="w-3.5 h-3.5 mr-1 text-[var(--primary)]" /> {j.experience} năm kinh nghiệm</Badge>
                            </div>
                          </div>
                        </div>
                        
                        {/* Win Rate Progress Bar */}
                        <div className="flex flex-col gap-1 w-full mt-1.5">
                          <div className="flex justify-between text-xs font-bold text-slate-400">
                            <span className="flex items-center gap-1"><Trophy className="w-3.5 h-3.5 text-amber-400" /> Tỉ lệ thắng</span>
                            <span className="text-amber-400">{winRate}% ({j.wins ?? 0}/{j.races ?? 0} thắng)</span>
                          </div>
                          <div className="w-full bg-[var(--bg2)] rounded-full h-2 overflow-hidden border border-[var(--border)]/10">
                            <div className="bg-gradient-to-r from-amber-400 to-amber-500 h-full rounded-full transition-all duration-500" style={{ width: `${winRate}%` }} />
                          </div>
                        </div>

                        <Button 
                          size="sm" 
                          className={`w-full font-bold shadow-md rounded-xl py-2.5 mt-2 transition-all duration-300 flex items-center justify-center gap-1 border-none ${isAvailable ? 'bg-gradient-to-r from-[var(--primary)] to-[var(--primary-dark)] text-white hover:opacity-95 shadow-[var(--primary)]/20' : 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-50'}`} 
                          onClick={() => handleInviteJockey(j.id, name)} 
                          disabled={!isAvailable}
                        >
                          ✉️ Gửi Lời Mời
                        </Button>
                      </div>
                    </ScrollReveal>
                  )
                })}
              </div>
            )}
          </Card>
        </TabsContent>

        {/* ── TAB 5: Invitations ── */}
        <TabsContent value="invitations">
          <Card className="border-[var(--border)] bg-gradient-to-b from-[var(--surface)] to-[var(--surface)]/90 p-6 rounded-2xl shadow-xl">
            <CardHeader className="p-0 mb-6">
              <CardTitle className="text-2xl font-black text-[var(--text)] flex items-center gap-2">✉️ Lời Mời Jockey</CardTitle>
              <CardDescription className="text-slate-400 font-semibold mt-1">Theo dõi phản hồi và chốt Jockey chính thức cho ngựa đua.</CardDescription>
            </CardHeader>
            <div className="mb-8 bg-[var(--bg2)]/80 backdrop-blur-md p-4 rounded-2xl border border-[var(--border)]/40 max-w-sm">
              <label className="text-[10px] font-extrabold text-[var(--muted)] uppercase tracking-wider mb-1 block">Lọc Theo Ngựa</label>
              <select className="w-full h-10 bg-[var(--surface-2)]/80 border border-[var(--border)] rounded-xl px-3 text-sm font-semibold text-white outline-none focus:border-[var(--primary)] cursor-pointer" value={selectedHorseId} onChange={(e) => setSelectedHorseId(e.target.value)}>
                <option value="">— Chọn ngựa —</option>
                {horses.map((h) => <option key={h.id} value={String(h.id || h._id)}>{h.name}</option>)}
              </select>
            </div>

            {loading ? (
              <div className="space-y-4">
                {[1, 2].map((i) => (
                  <div key={i} className="h-24 rounded-2xl bg-[var(--border)]/40 animate-pulse w-full" />
                ))}
              </div>
            ) : invitations.length === 0 ? (
              <div className="text-center p-12 border border-dashed border-[var(--border)]/30 rounded-2xl bg-[var(--bg2)]/20">
                <div className="text-4xl mb-3">📭</div>
                <h3 className="text-lg font-bold text-slate-300">Chưa có lời mời nào</h3>
                <p className="text-xs text-[var(--muted)] mt-1 font-medium">Chọn ngựa đã đăng ký giải để gửi lời mời đến Jockey ở tab "Tuyển Jockey".</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {invitations.map((inv, idx) => {
                  const jockeyName = inv.jockeyId?.fullName || inv.jockeyId?.name || 'Jockey'
                  const statusMap: Record<string, { cls: string; label: string; icon: any }> = {
                    PENDING:   { cls: 'border-amber-500/30 text-amber-400 bg-amber-500/10', label: 'Chờ phản hồi', icon: <AlertTriangle className="w-3.5 h-3.5 mr-1" /> },
                    ACCEPTED:  { cls: 'border-blue-500/30 text-blue-400 bg-blue-500/10', label: 'Đã chấp nhận', icon: <Check className="w-3.5 h-3.5 mr-1" /> },
                    REJECTED:  { cls: 'border-red-500/30 text-red-400 bg-red-500/10', label: 'Từ chối', icon: <X className="w-3.5 h-3.5 mr-1" /> },
                    CONFIRMED: { cls: 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10', label: 'Chốt thành công', icon: <Check className="w-3.5 h-3.5 mr-1" /> },
                  }
                  
                  const inviteRaceId = String(inv.raceId?._id || inv.raceId?.id || inv.raceId || '').trim()
                  const isConfirmed = registrations.some(
                    (reg) =>
                      String(reg.horseId).trim() === String(selectedHorseId).trim() &&
                      String(reg.race?.id || reg.race?._id || '').trim() === inviteRaceId &&
                      reg.status === 'CONFIRMED'
                  )
                  const displayStatus = isConfirmed ? 'CONFIRMED' : inv.status
                  const sc = statusMap[displayStatus] ?? { cls: 'border-slate-500/30 text-slate-300', label: displayStatus, icon: null }

                  return (
                    <ScrollReveal key={inv._id || inv.id} direction="up" distance={20} delay={idx * 0.05}>
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl border border-[var(--border)]/60 bg-[var(--surface-2)]/40 hover:bg-[var(--surface-2)]/60 hover:border-[var(--primary)]/30 hover:scale-[1.005] hover:shadow-lg transition-all duration-300">
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-blue-500/20 to-teal-500/10 text-blue-400 flex items-center justify-center font-extrabold text-base shrink-0 border border-blue-500/20 shadow-inner">{jockeyName.slice(0, 2).toUpperCase()}</div>
                          <div className="space-y-1">
                            <h4 className="font-extrabold text-white text-lg m-0">{jockeyName}</h4>
                            <div className="text-sm font-bold text-slate-300 flex items-center gap-1.5"><Activity className="w-4 h-4 text-[var(--primary)]" /> Giải đua: {inv.raceId?.name || '—'}</div>
                            <div className="flex gap-2">
                              <Badge variant="secondary" className="bg-[var(--bg2)]/60 text-slate-300 border border-[var(--border)]/20 text-[10px] font-semibold px-2 py-0.5 rounded-lg">Tỉ lệ thắng: {inv.jockeyId?.winRate ?? 0}%</Badge>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col items-start md:items-end gap-2 shrink-0 pt-4 md:pt-0 border-t md:border-t-0 border-[var(--border)]/20">
                          <Badge variant="outline" className={`shrink-0 flex items-center px-3 py-1 text-xs font-bold rounded-full ${sc.cls}`}>{sc.icon} {sc.label}</Badge>
                          {displayStatus === 'ACCEPTED' && (
                            <Button 
                              size="sm" 
                              className="mt-2 font-bold bg-gradient-to-r from-[var(--primary)] to-[var(--primary-dark)] text-white hover:opacity-95 shadow-md shadow-[var(--primary)]/20 border-none rounded-xl px-4 py-2 text-xs transition-all duration-300 animate-pulse" 
                              onClick={() => handleConfirmJockey(inv.jockeyId?._id || inv.jockeyId, inv.raceId?._id || inv.raceId, jockeyName)}
                            >
                              ✓ Chốt Jockey Này
                            </Button>
                          )}
                        </div>
                      </div>
                    </ScrollReveal>
                  )
                })}
              </div>
            )}
          </Card>
        </TabsContent>
      </Tabs>

      {/* ── Modal: Horse Results ── */}
      {showResultsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in" onClick={() => setShowResultsModal(false)}>
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
            <div className="p-5 border-b border-[var(--border)] flex justify-between items-center bg-[var(--bg2)]/50">
              <h2 className="text-xl font-black flex items-center gap-2"><Trophy className="text-amber-500 w-5 h-5" /> Kết Quả: {horseResults?.horseName}</h2>
              <button className="text-[var(--muted)] hover:text-[var(--text)] rounded-full p-1" onClick={() => setShowResultsModal(false)}><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 max-h-[70vh] overflow-y-auto">
              {loadingResults ? <div className="text-center p-8 text-[var(--muted)]">Đang tải kết quả...</div> : horseResults?.results?.length > 0 ? (
                <div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-[var(--bg2)] p-4 rounded-xl text-center border border-[var(--border)]"><div className="text-xs uppercase font-bold text-[var(--muted)] mb-1">Số Trận</div><div className="text-2xl font-black">{horseResults.stats.totalRaces}</div></div>
                    <div className="bg-[var(--bg2)] p-4 rounded-xl text-center border border-amber-500/20 text-amber-500"><div className="text-xs uppercase font-bold mb-1">Thắng</div><div className="text-2xl font-black">{horseResults.stats.wins}</div></div>
                    <div className="bg-[var(--bg2)] p-4 rounded-xl text-center border border-emerald-500/20 text-emerald-500"><div className="text-xs uppercase font-bold mb-1">Top 3</div><div className="text-2xl font-black">{horseResults.stats.topThree}</div></div>
                    <div className="bg-[var(--bg2)] p-4 rounded-xl text-center border border-blue-500/20 text-blue-500"><div className="text-xs uppercase font-bold mb-1">Tiền Thưởng</div><div className="text-lg font-black">{horseResults.stats.totalPrizes.toLocaleString('vi-VN')} đ</div></div>
                  </div>
                  <div className="rounded-xl border border-[var(--border)] overflow-hidden">
                    <AnimatedTable
                      data={(() => {
                        let res = [...horseResults.results].map((r, i) => ({ ...r, id: i }))
                        // Filter
                        res = res.filter(r => {
                          if (resultsFilters.raceName && !r.raceName.toLowerCase().includes(resultsFilters.raceName.toLowerCase())) return false
                          if (resultsFilters.position && String(r.position) !== resultsFilters.position) return false
                          return true
                        })
                        // Sort
                        if (resultsSortColumn && resultsSortDirection) {
                          res.sort((a, b) => {
                            let aVal = a[resultsSortColumn]
                            let bVal = b[resultsSortColumn]
                            if (resultsSortColumn === 'date') {
                              aVal = new Date(a.date).getTime()
                              bVal = new Date(b.date).getTime()
                            }
                            if (typeof aVal === 'string' && typeof bVal === 'string') {
                              return resultsSortDirection === 'asc' ? aVal.localeCompare(bVal, 'vi') : bVal.localeCompare(aVal, 'vi')
                            }
                            return resultsSortDirection === 'asc' ? aVal - bVal : bVal - aVal
                          })
                        }
                        return res
                      })().slice((resultsPage - 1) * 5, resultsPage * 5)}
                      columns={[
                        {
                          id: 'raceName',
                          header: 'Giải / Ngày',
                          sortable: true,
                          filterable: true,
                          filterType: 'text',
                          cell: (row: any) => (
                            <div>
                              <div className="font-bold text-[var(--text)]">{row.raceName}</div>
                              <div className="text-xs text-[var(--muted)]">{new Date(row.date).toLocaleDateString('vi-VN')}</div>
                            </div>
                          )
                        },
                        {
                          id: 'position',
                          header: 'Vị Trí',
                          align: 'center',
                          sortable: true,
                          filterable: true,
                          filterType: 'text',
                          cell: (row: any) => (
                            <Badge variant="outline" className={row.position === 1 ? 'border-amber-500/50 bg-amber-500/10 text-amber-500' : 'border-[var(--border)]'}>#{row.position}</Badge>
                          )
                        },
                        {
                          id: 'prize',
                          header: 'Tiền Thưởng',
                          align: 'right',
                          sortable: true,
                          cell: (row: any) => (
                            <span className="font-bold text-emerald-500">{row.prize.toLocaleString('vi-VN')} đ</span>
                          )
                        }
                      ]}
                      sortColumn={resultsSortColumn}
                      sortDirection={resultsSortDirection}
                      onSort={handleResultsSort}
                      columnFilters={resultsFilters}
                      onColumnFilterChange={handleResultsFilterChange}
                      pagination={{
                        page: resultsPage,
                        pageSize: 5,
                        totalItems: (() => {
                          let res = horseResults.results
                          if (resultsFilters.raceName) res = res.filter((r: any) => r.raceName.toLowerCase().includes(resultsFilters.raceName.toLowerCase()))
                          if (resultsFilters.position) res = res.filter((r: any) => String(r.position) === resultsFilters.position)
                          return res.length
                        })(),
                        onPageChange: setResultsPage,
                        pageSizeOptions: [5, 10, 20]
                      }}
                    />
                  </div>
                </div>
              ) : <div className="text-center p-8 text-[var(--muted)] font-medium">Chưa có kết quả thi đấu nào.</div>}
            </div>
          </div>
        </div>
      )}

      {showHorseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in" onClick={() => setShowHorseModal(false)}>
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in slide-in-from-bottom-4 duration-300" onClick={(e) => e.stopPropagation()}>
            <div className="p-5 border-b border-[var(--border)] flex justify-between items-center bg-[var(--bg2)]/60">
              <h2 className="text-xl font-black text-white flex items-center gap-2">🐴 {selectedHorse ? 'Chỉnh Sửa Ngựa' : 'Thêm Ngựa Mới'}</h2>
              <button className="text-[var(--muted)] hover:text-white rounded-full p-1.5 hover:bg-[var(--surface-2)] transition-colors" onClick={() => setShowHorseModal(false)}><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSaveHorse} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-bold text-[var(--muted)] uppercase mb-1.5 tracking-wider block">Tên ngựa <span className="text-red-400">*</span></label>
                <input required placeholder="Nhập tên chú ngựa..." className="w-full h-10 bg-[var(--bg2)]/80 border border-[var(--border)] rounded-xl px-3 text-sm font-semibold text-white outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary-ring)] transition-all placeholder:text-slate-600" value={horseForm.name} onChange={(e) => setHorseForm({ ...horseForm, name: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-[var(--muted)] uppercase mb-1.5 tracking-wider block">Giống</label>
                  <input placeholder="Thoroughbred..." className="w-full h-10 bg-[var(--bg2)]/80 border border-[var(--border)] rounded-xl px-3 text-sm font-semibold text-white outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary-ring)] transition-all placeholder:text-slate-600" value={horseForm.breed} onChange={(e) => setHorseForm({ ...horseForm, breed: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs font-bold text-[var(--muted)] uppercase mb-1.5 tracking-wider block">Màu sắc</label>
                  <input placeholder="Nâu đen..." className="w-full h-10 bg-[var(--bg2)]/80 border border-[var(--border)] rounded-xl px-3 text-sm font-semibold text-white outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary-ring)] transition-all placeholder:text-slate-600" value={horseForm.color} onChange={(e) => setHorseForm({ ...horseForm, color: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-[var(--muted)] uppercase mb-1.5 tracking-wider block">Tuổi</label>
                  <input type="number" min="0" className="w-full h-10 bg-[var(--bg2)]/80 border border-[var(--border)] rounded-xl px-3 text-sm font-semibold text-white outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary-ring)] transition-all" value={horseForm.age} onChange={(e) => setHorseForm({ ...horseForm, age: Number(e.target.value) })} />
                </div>
                <div>
                  <label className="text-xs font-bold text-[var(--muted)] uppercase mb-1.5 tracking-wider block">Cân nặng (kg)</label>
                  <input type="number" min="0" className="w-full h-10 bg-[var(--bg2)]/80 border border-[var(--border)] rounded-xl px-3 text-sm font-semibold text-white outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary-ring)] transition-all" value={horseForm.weight} onChange={(e) => setHorseForm({ ...horseForm, weight: Number(e.target.value) })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-[var(--muted)] uppercase mb-1.5 tracking-wider block">Giới tính</label>
                  <select className="w-full h-10 bg-[var(--bg2)]/80 border border-[var(--border)] rounded-xl px-3 text-sm font-semibold text-white outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary-ring)] transition-all" value={horseForm.gender} onChange={(e) => setHorseForm({ ...horseForm, gender: e.target.value as any })}>
                    <option value="MALE">Đực</option>
                    <option value="FEMALE">Cái</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-[var(--muted)] uppercase mb-1.5 tracking-wider block">Xuất xứ</label>
                  <input placeholder="Anh Quốc..." className="w-full h-10 bg-[var(--bg2)]/80 border border-[var(--border)] rounded-xl px-3 text-sm font-semibold text-white outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary-ring)] transition-all placeholder:text-slate-600" value={horseForm.origin} onChange={(e) => setHorseForm({ ...horseForm, origin: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-[var(--muted)] uppercase mb-1.5 tracking-wider block">URL Giấy khám sức khỏe</label>
                <input placeholder="https://example.com/certificate.pdf" className="w-full h-10 bg-[var(--bg2)]/80 border border-[var(--border)] rounded-xl px-3 text-sm font-semibold text-white outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary-ring)] transition-all placeholder:text-slate-600" value={horseForm.healthCertUrl} onChange={(e) => setHorseForm({ ...horseForm, healthCertUrl: e.target.value })} />
              </div>
              <div className="pt-4 flex justify-end gap-3 border-t border-[var(--border)] bg-[var(--bg2)]/10">
                <Button type="button" variant="ghost" onClick={() => setShowHorseModal(false)} className="rounded-xl font-bold text-slate-400 hover:text-white hover:bg-[var(--surface-2)]">Hủy</Button>
                <Button type="submit" className="font-bold bg-gradient-to-r from-[var(--primary)] to-[var(--primary-dark)] text-white hover:opacity-90 px-5 rounded-xl border-none shadow-lg shadow-[var(--primary)]/20">Lưu Thông Tin</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
