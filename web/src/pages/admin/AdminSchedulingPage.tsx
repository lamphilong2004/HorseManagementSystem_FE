import { useEffect, useState, startTransition } from 'react'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { format } from 'date-fns'
import { 
  Trophy, 
  ClipboardList, 
  Sparkles, 
  Scale, 
  Target, 
  Settings, 
  Flag,
  AlertTriangle,
  CheckCircle,
  HelpCircle,
  Lock,
  Coins,
  Phone,
  ExternalLink,
  User as UserIcon,
  Calendar,
  TrendingUp,
  X
} from 'lucide-react'
import type { Tournament, Race, User, RaceRegistration, Horse, Jockey, Prediction } from '../../types'
import { TournamentBracketView } from '../../components/TournamentBracketView'
import {
  getTournaments,
  createTournament,
  updateTournament,
  deleteTournament,
  getRaces,
  createRace,
  updateRace,
  createSchedule,
  assignReferee,
  getAdminUsers,
  getRaceRegistrations,
  approveRaceRegistration,
  rejectRaceRegistration,
  getAdminHorses,
  approveHorse,
  rejectHorse,
  getAdminJockeys,
  publishRaceResult,
  getAdminPredictions,
  closePredictions,
  settlePredictions,
  startRaceStream,
  stopRaceStream,
  closeTournamentRegistration,
  generateTournamentBracket,
} from '@/api'
import { http } from '../../api/http'
import { AnimatedTable, type SortDirection } from '@/components/ui/animated-table'

type Tab = 'tournaments' | 'registrations' | 'horses-jockeys' | 'referee-results' | 'predictions'

// ── Toast helper ──────────────────────────────────────────────────────────────
type ToastType = 'success' | 'error' | 'warning' | 'info'
type ToastItem = { id: number; type: ToastType; message: string }
let _tid = 0
function useToast() {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const show = (message: string, type: ToastType = 'success') => {
    const id = ++_tid
    setToasts((prev) => [...prev, { id, type, message }])
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500)
  }
  return { toasts, show }
}
const toastIcon: Record<ToastType, any> = { 
  success: <CheckCircle className="w-4.5 h-4.5 text-emerald-400 shrink-0" />, 
  error: <AlertTriangle className="w-4.5 h-4.5 text-red-400 shrink-0" />, 
  warning: <AlertTriangle className="w-4.5 h-4.5 text-amber-400 shrink-0" />, 
  info: <HelpCircle className="w-4.5 h-4.5 text-blue-400 shrink-0" /> 
}

export function AdminSchedulingPage({ tab }: { tab?: Tab }) {
  const [activeTab, setActiveTab] = useState<Tab>(tab || 'tournaments')

  useEffect(() => {
    if (tab) {
      setActiveTab(tab)
    }
  }, [tab])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // ---------------------------------------------------------
  // DATA STATES
  // ---------------------------------------------------------
  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [races, setRaces] = useState<Race[]>([])
  const [registrations, setRegistrations] = useState<RaceRegistration[]>([])
  const [registrationOwners, setRegistrationOwners] = useState<Record<string, { fullName?: string; phone?: string }>>({})

  const [lastModifiedTournId, setLastModifiedTournId] = useState<string | null>(null)
  const [lastModifiedRaceId, setLastModifiedRaceId] = useState<string | null>(null)
  const [lastModifiedRegId, setLastModifiedRegId] = useState<string | null>(null)
  const [lastModifiedHorseId, setLastModifiedHorseId] = useState<string | null>(null)
  const [horses, setHorses] = useState<Horse[]>([])
  const [jockeys, setJockeys] = useState<Jockey[]>([])
  const [referees, setReferees] = useState<User[]>([])
  const [predictions, setPredictions] = useState<Prediction[]>([])
  
  // View Bracket Modal state
  const [viewBracketTournament, setViewBracketTournament] = useState<Tournament | null>(null)
  const [viewBracketRaces, setViewBracketRaces] = useState<Race[]>([])
  
  // Filters for Predictions Tab
  const [filterPredStatus, setFilterPredStatus] = useState<string>('ALL')
  const [filterPredRace, setFilterPredRace] = useState<string>('ALL')
  const [filterPredSearch, setFilterPredSearch] = useState<string>('')

  // Filters for Tournaments Tab
  const [filterTournSearch, setFilterTournSearch] = useState<string>('')
  const [filterTournStatus, setFilterTournStatus] = useState<string>('ALL')
  const [expandedTournId, setExpandedTournId] = useState<string | null>(null)

  // Filters for Registrations Tab
  // Note: Search and Status are handled by the table's built-in column filters
  const [filterRegTourn, setFilterRegTourn] = useState<string>('ALL')
  const [filterRegRace, setFilterRegRace] = useState<string>('ALL')
  
  // Draft auto-assign states
  const [draftApprovals, setDraftApprovals] = useState<Record<string, { raceId: string, raceName: string }>>({})
  const [draftRejections, setDraftRejections] = useState<Record<string, string>>({})
  const [draftBracket, setDraftBracket] = useState<any>(null)
  const [showConfirmDraftModal, setShowConfirmDraftModal] = useState(false)
  const [confirmDraftLoading, setConfirmDraftLoading] = useState(false)
  const [generatingNextRound, setGeneratingNextRound] = useState(false)

  // Registrations Table State
  const [regSortColumn, setRegSortColumn] = useState<string | undefined>()
  const [regSortDirection, setRegSortDirection] = useState<SortDirection>(null)
  const [regColumnFilters, setRegColumnFilters] = useState<Record<string, string>>({})
  const [regPage, setRegPage] = useState(1)

  const handleRegSort = (columnId: string, direction: SortDirection) => {
    setRegSortColumn(columnId)
    setRegSortDirection(direction)
  }

  const handleRegColumnFilterChange = (columnId: string, value: string) => {
    setRegColumnFilters(prev => ({ ...prev, [columnId]: value }))
    setRegPage(1)
  }

  // Horses Table State
  const [horsesSortColumn, setHorsesSortColumn] = useState<string | undefined>()
  const [horsesSortDirection, setHorsesSortDirection] = useState<SortDirection>(null)
  const [horsesColumnFilters, setHorsesColumnFilters] = useState<Record<string, string>>({})
  const [horsesPage, setHorsesPage] = useState(1)

  const handleHorsesSort = (columnId: string, direction: SortDirection) => {
    setHorsesSortColumn(columnId)
    setHorsesSortDirection(direction)
  }

  const handleHorsesColumnFilterChange = (columnId: string, value: string) => {
    setHorsesColumnFilters(prev => ({ ...prev, [columnId]: value }))
    setHorsesPage(1)
  }

  // Jockeys Table State
  const [jockeysSortColumn, setJockeysSortColumn] = useState<string | undefined>()
  const [jockeysSortDirection, setJockeysSortDirection] = useState<SortDirection>(null)
  const [jockeysColumnFilters, setJockeysColumnFilters] = useState<Record<string, string>>({})
  const [jockeysPage, setJockeysPage] = useState(1)

  const handleJockeysSort = (columnId: string, direction: SortDirection) => {
    setJockeysSortColumn(columnId)
    setJockeysSortDirection(direction)
  }

  const handleJockeysColumnFilterChange = (columnId: string, value: string) => {
    setJockeysColumnFilters(prev => ({ ...prev, [columnId]: value }))
    setJockeysPage(1)
  }

  // Referee Races Table State
  const [refRacesSortColumn, setRefRacesSortColumn] = useState<string | undefined>()
  const [refRacesSortDirection, setRefRacesSortDirection] = useState<SortDirection>(null)
  const [refRacesColumnFilters, setRefRacesColumnFilters] = useState<Record<string, string>>({})
  const [refRacesPage, setRefRacesPage] = useState(1)

  const handleRefRacesSort = (columnId: string, direction: SortDirection) => {
    setRefRacesSortColumn(columnId)
    setRefRacesSortDirection(direction)
  }

  const handleRefRacesColumnFilterChange = (columnId: string, value: string) => {
    setRefRacesColumnFilters(prev => ({ ...prev, [columnId]: value }))
    setRefRacesPage(1)
  }

  // Predictions Table State
  const [predSortColumn, setPredSortColumn] = useState<string | undefined>()
  const [predSortDirection, setPredSortDirection] = useState<SortDirection>(null)
  const [predColumnFilters, setPredColumnFilters] = useState<Record<string, string>>({})
  const [predPage, setPredPage] = useState(1)

  const handlePredSort = (columnId: string, direction: SortDirection) => {
    setPredSortColumn(columnId)
    setPredSortDirection(direction)
  }

  const handlePredColumnFilterChange = (columnId: string, value: string) => {
    setPredColumnFilters(prev => ({ ...prev, [columnId]: value }))
    setPredPage(1)
  }
  
  // Dashboard Stats
  const [adminStats, setAdminStats] = useState({
    tournaments: 0,
    activeRaces: 0,
    pendingHorses: 0,
    pendingRegs: 0,
  })

  // ---------------------------------------------------------
  // MODAL STATES
  // ---------------------------------------------------------
  // Tournaments
  const [showTournModal, setShowTournModal] = useState(false)
  const [selectedTourn, setSelectedTourn] = useState<Tournament | null>(null)
  const [tournForm, setTournForm] = useState({
    name: '',
    description: '',
    venue: '',
    startDate: '',
    endDate: '',
    prizePool: 0,
    maxHorses: 8,
    minHorses: 4,
    registrationCloseDate: '',
    eliminationType: 'SINGLE_ELIMINATION',
    pairingMethod: 'RANDOM',
    hasThirdPlaceMatch: false,
    status: 'DRAFT',
  })

  // Races
  const [showRaceModal, setShowRaceModal] = useState(false)
  const [selectedRace, setSelectedRace] = useState<Race | null>(null)
  const [raceForm, setRaceForm] = useState({
    tournamentId: '',
    name: '',
    distance: 1000,
    scheduledAt: '',
    maxHorses: 8,
    prizeFirst: 0,
    prizeSecond: 0,
    prizeThird: 0,
    refereeId: '',
  })

  // Schedule linking
  const [showSchedModal, setShowSchedModal] = useState(false)
  const [schedForm, setSchedForm] = useState({
    raceId: '',
    tournamentId: '',
    raceName: '',
    scheduledTime: '',
    location: '',
    distance: 1000,
    raceType: 'SPRINT',
    maxParticipants: 8,
    prizePool: 0,
    trackCondition: 'GOOD',
  })

  // Assign Referee
  const [showRefModal, setShowRefModal] = useState(false)
  const [refRaceId, setRefRaceId] = useState<string>('')
  const [selectedRefId, setSelectedRefId] = useState<string>('')

  // Publish Results
  const [showResultModal, setShowResultModal] = useState(false)
  const [resultRace, setResultRace] = useState<Race | null>(null)
  const [raceHorses, setRaceHorses] = useState<any[]>([]) // list of confirmed horses for race
  const [resultRankings, setResultRankings] = useState<any[]>([]) // array of rankings inputs
  const [resultNotes, setResultNotes] = useState<string>('')

  // Prediction Stats
  const [showPredStatsModal, setShowPredStatsModal] = useState(false)
  const [predStats, setPredStats] = useState<any>(null)

  // ---------------------------------------------------------
  // INITIAL DATA LIFECYCLE
  // ---------------------------------------------------------
  useEffect(() => {
    loadTabData()
  }, [activeTab])

  useEffect(() => {
    if (!tab) {
      loadDashboardStats()
    }
  }, [tab])

  const loadDashboardStats = async () => {
    try {
      const [tList, rList, hList, regList] = await Promise.all([
        getTournaments(),
        getRaces(),
        getAdminHorses(),
        getRaceRegistrations(),
      ])
      setAdminStats({
        tournaments: tList.length,
        activeRaces: rList.filter((r) => r.status === 'SCHEDULED' || r.status === 'ONGOING').length,
        pendingHorses: hList.filter((h) => h.status === 'PENDING').length,
        pendingRegs: regList.filter((r) => r.status === 'PENDING_APPROVAL').length,
      })
    } catch (err) {
      console.error('Failed to load admin stats', err)
    }
  }

  const loadTabData = async (
    highlightTournId?: string,
    highlightRaceId?: string,
    highlightRegId?: string,
    highlightHorseId?: string
  ) => {
    setLoading(true)
    setError(null)
    const targetTournId = highlightTournId || lastModifiedTournId
    const targetRaceId = highlightRaceId || lastModifiedRaceId
    const targetRegId = highlightRegId || lastModifiedRegId
    const targetHorseId = highlightHorseId || lastModifiedHorseId

    try {
      if (activeTab === 'tournaments') {
        const [list, refList, allRaces] = await Promise.all([
          getTournaments(),
          getAdminUsers({ role: 'REFEREE' }),
          getRaces()
        ])
        const sortedTournaments = [...list].sort((a, b) => {
          const aId = a.id || a._id
          const bId = b.id || b._id
          if (targetTournId) {
            if (aId === targetTournId) return -1
            if (bId === targetTournId) return 1
          }
          const dateA = a.startDate ? new Date(a.startDate).getTime() : 0
          const dateB = b.startDate ? new Date(b.startDate).getTime() : 0
          return dateB - dateA
        })
        setTournaments(sortedTournaments)
        setReferees(refList)
        setRaces(allRaces)
      } else if (activeTab === 'registrations') {
        const [list, hList, tList, rList] = await Promise.all([
          getRaceRegistrations(),
          getAdminHorses(),
          getTournaments(),
          getRaces()
        ])
        const ownerMap: Record<string, { fullName?: string; phone?: string }> = {}
        hList.forEach((h) => {
          const ownerData = typeof h.ownerId === 'object' ? h.ownerId : { fullName: h.ownerId }
          ownerMap[h.id] = {
            fullName: ownerData?.fullName || ownerData?.name || '',
            phone: ownerData?.phone || ownerData?.email || ''
          }
        })
        const sortedRegs = [...list].sort((a, b) => {
          const aId = a.id || a._id
          const bId = b.id || b._id
          if (targetRegId) {
            if (aId === targetRegId) return -1
            if (bId === targetRegId) return 1
          }
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0
          return dateB - dateA
        })
        setRegistrations(sortedRegs)
        setRegistrationOwners(ownerMap)
        setTournaments(tList)
        setRaces(rList)
      } else if (activeTab === 'horses-jockeys') {
        const [hList, jList] = await Promise.all([
          getAdminHorses(),
          getAdminJockeys({ limit: 100 })
        ])
        const sortedHorses = [...hList].sort((a, b) => {
          const aId = a.id || a._id
          const bId = b.id || b._id
          if (targetHorseId) {
            if (aId === targetHorseId) return -1
            if (bId === targetHorseId) return 1
          }
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0
          return dateB - dateA
        })
        setHorses(sortedHorses)
        setJockeys(jList.sort((a, b) => {
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0
          return dateB - dateA
        }))
      } else if (activeTab === 'referee-results') {
        const [rList, refList] = await Promise.all([
          getRaces(),
          getAdminUsers({ role: 'REFEREE' })
        ])
        const sortedRaces = [...rList].sort((a, b) => {
          const aId = a.id || a._id
          const bId = b.id || b._id
          if (targetRaceId) {
            if (aId === targetRaceId) return -1
            if (bId === targetRaceId) return 1
          }
          const dateA = a.scheduledAt ? new Date(a.scheduledAt).getTime() : 0
          const dateB = b.scheduledAt ? new Date(b.scheduledAt).getTime() : 0
          return dateB - dateA
        })
        setRaces(sortedRaces)
        setReferees(refList)
      } else if (activeTab === 'predictions') {
        const [pList, rList] = await Promise.all([
          getAdminPredictions(),
          getRaces()
        ])
        setPredictions(pList)
        setRaces(rList)
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Lỗi khi tải dữ liệu từ máy chủ')
    } finally {
      setLoading(false)
    }
  }

  // ---------------------------------------------------------
  // TOURNAMENT ACTIONS
  // ---------------------------------------------------------
  const openTournModal = (t: Tournament | null) => {
    setSelectedTourn(t)
    if (t) {
      setTournForm({
        name: t.name,
        description: t.description || '',
        venue: t.venue,
        startDate: t.startDate ? new Date(t.startDate).toISOString().split('T')[0] : '',
        endDate: t.endDate ? new Date(t.endDate).toISOString().split('T')[0] : '',
        prizePool: t.prizePool || 0,
        maxHorses: t.maxHorses || 8,
        minHorses: t.minHorses || 4,
        registrationCloseDate: t.registrationCloseDate ? new Date(t.registrationCloseDate).toISOString() : '',
        eliminationType: t.eliminationType || 'SINGLE_ELIMINATION',
        pairingMethod: t.pairingMethod || 'RANDOM',
        hasThirdPlaceMatch: t.hasThirdPlaceMatch || false,
        status: t.status || 'DRAFT',
      })
    } else {
      setTournForm({
        name: '',
        description: '',
        venue: '',
        startDate: '',
        endDate: '',
        prizePool: 0,
        maxHorses: 8,
        minHorses: 4,
        registrationCloseDate: '',
        eliminationType: 'SINGLE_ELIMINATION',
        pairingMethod: 'RANDOM',
        hasThirdPlaceMatch: false,
        status: 'DRAFT',
      })
    }
    setShowTournModal(true)
  }

  const handleSaveTourn = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (tournForm.startDate && tournForm.endDate) {
      const start = new Date(tournForm.startDate).getTime()
      const end = new Date(tournForm.endDate).getTime()
      if (end < start) {
        showToast('Ngày kết thúc không được nhỏ hơn ngày bắt đầu', 'error')
        return
      }
    }

    if (tournForm.registrationCloseDate && tournForm.startDate) {
      const rEnd = new Date(tournForm.registrationCloseDate).getTime()
      if (new Date(tournForm.startDate).getTime() < rEnd) {
        showToast('Ngày bắt đầu giải đấu phải diễn ra sau khi đã đóng đăng ký!', 'error')
        return
      }
    }

    if (tournForm.minHorses < 4) {
      showToast('Giải đấu cần tối thiểu 4 ngựa để có thể tổ chức thi đấu hợp lệ!', 'error')
      return
    }
    if (tournForm.maxHorses > 64) {
      showToast('Số lượng ngựa tối đa của một giải đấu không được vượt quá 64!', 'error')
      return
    }
    if (tournForm.minHorses > tournForm.maxHorses) {
      showToast('Số ngựa tối thiểu không được lớn hơn số ngựa tối đa!', 'error')
      return
    }
    if (tournForm.prizePool < 0) {
      showToast('Quỹ thưởng không hợp lệ!', 'error')
      return
    }

    try {
      if (selectedTourn) {
        await updateTournament(selectedTourn.id, tournForm as any)
        setLastModifiedTournId(selectedTourn.id)
        showToast(`Đã cập nhật giải đấu ${tournForm.name}`)
        loadTabData(selectedTourn.id, undefined, undefined, undefined)
      } else {
        const res = await createTournament(tournForm as any)
        const newId = res?.tournamentId || res?.id || res?._id || res?.data?.id || res?.data?._id || res?.tournament?._id || res?.tournament?.id || (typeof res === 'string' ? res : null)
        if (newId) {
          if (tournForm.status && tournForm.status !== 'DRAFT') {
            await updateTournament(newId, { status: tournForm.status as any })
          }
          setLastModifiedTournId(newId)
          loadTabData(newId, undefined, undefined, undefined)
        } else {
          loadTabData()
        }
        showToast(`Đã tạo giải đấu ${tournForm.name} thành công`)
      }
      setShowTournModal(false)
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Không thể lưu giải đấu', 'error')
    }
  }

  const handleDeleteTourn = async (id: string, name: string) => {
    if (!window.confirm(`Bạn có chắc muốn xóa giải đấu "${name}"?`)) return
    try {
      await deleteTournament(id)
      showToast(`Đã xóa giải đấu ${name}`)
      loadTabData()
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Không thể xóa giải đấu', 'error')
    }
  }

  const handleQuickStatusChange = async (id: string, name: string, newStatus: string) => {
    try {
      await updateTournament(id, { status: newStatus } as any)
      const statusLabel: Record<string, string> = {
        DRAFT: 'Bản nháp',
        PUBLISHED: 'Đã công bố',
        REGISTRATION_CLOSED: 'Đã đóng đăng ký',
        BRACKET_GENERATED: 'Đã chia bảng',
        ONGOING: 'Đang diễn ra',
        COMPLETED: 'Đã kết thúc',
        CANCELLED: 'Đã hủy',
      }
      setLastModifiedTournId(id)
      showToast(`"${name}" → ${statusLabel[newStatus] || newStatus}`)
      loadTabData(id, undefined, undefined, undefined)
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Không thể đổi trạng thái', 'error')
    }
  }

  const handleCloseRegistration = async (id: string) => {
    try {
      // Mới lấy danh sách tất cả registrations để đếm số CHỜ DUYỆT thuộc giải này
      const regs = await getRaceRegistrations('PENDING')
      const pendingCount = regs.filter((r: any) => 
        (r.race?.tournamentId === id || r.race?.tournamentId?._id === id || r.race?.tournamentId?.id === id || r.race?.tournamentId === id)
      ).length;

      let msg = 'Bạn có chắc muốn đóng cổng đăng ký cho giải đấu này?';
      if (pendingCount > 0) {
        msg = `CẢNH BÁO: Giải đấu này đang có ${pendingCount} đăng ký CHỜ DUYỆT. Nếu đóng cổng, các đăng ký này sẽ bị TỪ CHỐI TỰ ĐỘNG (auto-reject). Bạn có chắc chắn muốn đóng đăng ký không?`;
      }

      if (!window.confirm(msg)) return

      await closeTournamentRegistration(id)
      setLastModifiedTournId(id)
      showToast('Đã đóng cổng đăng ký thành công')
      loadTabData(id, undefined, undefined, undefined)
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Không thể đóng cổng đăng ký', 'error')
    }
  }

  const handleGenerateBracket = async (id: string) => {
    if (!window.confirm('Bạn có chắc muốn chia bảng tự động cho giải đấu này?')) return
    try {
      const tourn = tournaments.find(t => t.id === id || (t as any)._id === id)
      await generateTournamentBracket(id, tourn?.pairingMethod || 'RANDOM')
      setLastModifiedTournId(id)
      showToast('Đã chia bảng thành công')
      loadTabData(id, undefined, undefined, undefined)
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Không thể chia bảng', 'error')
    }
  }

  // ---------------------------------------------------------
  // RACE ACTIONS
  // ---------------------------------------------------------
  const openRaceModal = (race: Race | null, tournId?: string) => {
    setSelectedRace(race)
    if (race) {
      setRaceForm({
        tournamentId: typeof race.tournamentId === 'object' ? race.tournamentId._id : race.tournamentId,
        name: race.name,
        distance: race.distance,
        scheduledAt: race.scheduledAt ? new Date(race.scheduledAt).toISOString().slice(0, 16) : '',
        maxHorses: race.maxHorses,
        prizeFirst: race.prizeFirst,
        prizeSecond: race.prizeSecond,
        prizeThird: race.prizeThird,
        refereeId: typeof race.refereeId === 'object' ? race.refereeId?._id : race.refereeId || '',
      })
    } else {
      setRaceForm({
        tournamentId: tournId || '',
        name: '',
        distance: 1000,
        scheduledAt: '',
        maxHorses: 8,
        prizeFirst: 0,
        prizeSecond: 0,
        prizeThird: 0,
        refereeId: '',
      })
    }
    setShowRaceModal(true)
  }

  const handleSaveRace = async (e: React.FormEvent) => {
    e.preventDefault()

    if (raceForm.maxHorses < 2) {
      showToast('Một cuộc đua cần tối thiểu 2 ngựa tranh tài!', 'error')
      return
    }
    if (raceForm.maxHorses > 20) {
      showToast('Để đảm bảo an toàn trên đường đua, số lượng ngựa tối đa không được vượt quá 20!', 'error')
      return
    }
    if (raceForm.distance < 100) {
      showToast('Cự ly đua quá ngắn, tối thiểu phải là 100m!', 'error')
      return
    }
    if (raceForm.distance > 5000) {
      showToast('Cự ly đua quá dài, tối đa là 5000m!', 'error')
      return
    }
    if (raceForm.prizeFirst < 0 || raceForm.prizeSecond < 0 || raceForm.prizeThird < 0) {
      showToast('Giải thưởng không được là số âm!', 'error')
      return
    }

    try {
      if (selectedRace) {
        await updateRace(selectedRace.id, raceForm)
        setLastModifiedRaceId(selectedRace.id)
        showToast(`Đã cập nhật cuộc đua ${raceForm.name}`)
        loadTabData(undefined, selectedRace.id, undefined, undefined)
      } else {
        const res = await createRace(raceForm)
        const newId = res?.id || res?._id || res?.data?.id || res?.data?._id
        if (newId) {
          setLastModifiedRaceId(newId)
          loadTabData(undefined, newId, undefined, undefined)
        } else {
          loadTabData()
        }
        showToast(`Đã tạo cuộc đua ${raceForm.name} thành công`)
      }
      setShowRaceModal(false)
    } catch (err: any) {
      let errorMsg = err.response?.data?.message;
      if (Array.isArray(errorMsg)) {
        errorMsg = errorMsg.join(', ');
      }
      showToast(errorMsg || 'Không thể lưu cuộc đua', 'error');
    }
  }

  // ---------------------------------------------------------
  // SCHEDULE ACTIONS
  // ---------------------------------------------------------
  const openSchedModal = (race: Race) => {
    const tId = typeof race.tournamentId === 'object' ? race.tournamentId._id : race.tournamentId
    const tVenue = typeof race.tournamentId === 'object' ? race.tournamentId.venue : 'Trường đua'
    setSchedForm({
      raceId: race.id,
      tournamentId: tId,
      raceName: race.name,
      scheduledTime: race.scheduledAt,
      location: tVenue,
      distance: race.distance,
      raceType: 'SPRINT',
      maxParticipants: race.maxHorses,
      prizePool: race.prizeFirst + race.prizeSecond + race.prizeThird,
      trackCondition: 'GOOD',
    })
    setShowSchedModal(true)
  }

  const handleSaveSched = async (e: React.FormEvent) => {
    e.preventDefault()

    if (schedForm.maxParticipants < 2) {
      showToast('Cuộc đua cần tối thiểu 2 ngựa tranh tài!', 'error')
      return
    }
    if (schedForm.maxParticipants > 20) {
      showToast('Để đảm bảo an toàn, số lượng ngựa tối đa không được vượt quá 20!', 'error')
      return
    }
    if (schedForm.distance < 100 || schedForm.distance > 5000) {
      showToast('Cự ly đua phải từ 100m đến 5000m!', 'error')
      return
    }
    if (schedForm.prizePool < 0) {
      showToast('Quỹ thưởng không được là số âm!', 'error')
      return
    }

    try {
      await createSchedule(schedForm)
      const rId = schedForm.raceId
      setLastModifiedRaceId(rId)
      showToast('Đã lập lịch thi đấu thành công!')
      setShowSchedModal(false)
      loadTabData(undefined, rId, undefined, undefined)
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Không thể lập lịch thi đấu', 'error')
    }
  }

  // ---------------------------------------------------------
  // REGISTRATION ACTIONS
  // ---------------------------------------------------------

  const getRegRaceId = (reg: RaceRegistration) => String(
    typeof reg.raceId === 'object' ? reg.raceId?._id || reg.raceId?.id || '' : reg.raceId || ''
  )

  const getRaceForRegistration = (reg: RaceRegistration) => {
    const raceId = getRegRaceId(reg)
    return races.find((race) => String(race.id || race._id) === raceId)
      || (typeof reg.raceId === 'object' ? reg.raceId as Race : undefined)
  }

  const getTournamentIdForRegistration = (reg: RaceRegistration) => {
    const raceId = getRegRaceId(reg)
    // Sometimes the backend assigns the Tournament ID directly to reg.raceId for tournament registrations
    const isDirectTourn = tournaments.find(t => t.id === raceId || (t as any)._id === raceId)
    if (isDirectTourn) return String(isDirectTourn.id || (isDirectTourn as any)._id)

    const race = getRaceForRegistration(reg)
    const tournament = race?.tournamentId as any
    return String(tournament?._id || tournament?.id || tournament || '')
  }




  const handleApproveReg = async (regId: string) => {
    try {
      await approveRaceRegistration(regId)
      setLastModifiedRegId(regId)
      showToast('Đã duyệt đăng ký tham gia cuộc đua')
      setRegistrations(prev => prev.map(r => r.id === regId ? { ...r, status: 'APPROVED' } : r))
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Duyệt đăng ký thất bại', 'error')
    }
  }

  const handleRejectReg = async (regId: string) => {
    const reason = window.prompt('Nhập lý do từ chối đăng ký (có thể để trống):')
    if (reason === null) return // user cancelled
    try {
      await rejectRaceRegistration(regId, reason)
      setLastModifiedRegId(regId)
      showToast('Đã từ chối đăng ký', 'warning')
      setRegistrations(prev => prev.map(r => r.id === regId ? { ...r, status: 'REJECTED', rejectionReason: reason } : r))
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Từ chối thất bại', 'error')
    }
  }

  const handleGenerateNextRound = async (roundIdx: number) => {
    if (!viewBracketTournament) return;
    setGeneratingNextRound(true)
    try {
      const bracket = viewBracketTournament.bracket;
      const prevRound = bracket.rounds[roundIdx - 1];
      const nextRound = bracket.rounds[roundIdx];
      
      const prevRaces = prevRound.races.map((br: any) => viewBracketRaces.find(r => r.name === br.name));
      if (prevRaces.some((r: any) => !r)) {
        showToast('Vòng trước chưa được tạo đầy đủ!', 'error')
        return
      }
      
      if (prevRaces.some((r: any) => r.status !== 'COMPLETED' && r.status !== 'FINISHED' && r.status !== 'RESULT_CONFIRMED')) {
        showToast('Tất cả các bảng vòng trước phải đua xong mới có thể tạo vòng tiếp theo!', 'warning')
        return
      }

      const advancingRegIds: string[] = []
      
      for (let i = 0; i < prevRaces.length; i++) {
        const race = prevRaces[i];
        const topAdvance = prevRound.races[i].topAdvance || 2;
        
        let results = race.results || race.rankings || [];
        if (results.length === 0) {
          // fetch from api if needed
          const res = await http.get(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/results/races/${race.id}`).catch(() => null)
          if (res?.data?.results) results = res.data.results
        }
        
        if (results.length === 0) {
          showToast(`Bảng ${race.name} chưa có kết quả!`, 'error')
          return;
        }

        const sorted = [...results].sort((a: any, b: any) => a.position - b.position);
        const topResults = sorted.slice(0, topAdvance);
        
        const resHorses = await http.get(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/races/${race.id}/horses`).catch(() => null)
        const raceHorses = resHorses?.data || [];
        
        topResults.forEach((res: any) => {
          const horseId = res.horseId?.id || res.horseId?._id || res.horseId;
          const reg = raceHorses.find((rh: any) => (rh.horse?.id || rh.horse?._id || rh.horseId) === horseId);
          if (reg) {
            // Find the original tournament registration
            const tournReg = registrations.find(r => (r.horseId?.id || r.horseId?._id || r.horseId) === horseId && getTournamentIdForRegistration(r) === viewBracketTournament.id)
            if (tournReg) advancingRegIds.push(tournReg.id);
          }
        })
      }
      
      if (advancingRegIds.length === 0) {
        showToast('Không tìm thấy ngựa nào đủ điều kiện vào vòng trong', 'error')
        return;
      }
      
      const heatsMap = new Map<string, string[]>();
      let pointer = 0;
      for (let i = 0; i < nextRound.races.length; i++) {
        const bRace = nextRound.races[i];
        const count = bRace.horseCount;
        const regIdsForThisRace = advancingRegIds.slice(pointer, pointer + count);
        heatsMap.set(bRace.name, regIdsForThisRace);
        pointer += count;
      }

      const payload = {
        heats: Array.from(heatsMap.entries()).map(([name, regIds]) => ({ name, regIds }))
      }

      await http.post(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/admin/tournaments/${viewBracketTournament.id}/generate-heats`, payload)
      
      showToast(`Đã khởi tạo ${nextRound.name} thành công!`, 'success')
      loadTabData(viewBracketTournament.id, undefined, undefined, undefined)
      
      // Update the local view bracket races to instantly reflect without closing
      const updatedRacesRes = await http.get(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/races?tournamentId=${viewBracketTournament.id}`)
      if (updatedRacesRes?.data?.races) {
        setViewBracketRaces(updatedRacesRes.data.races)
      }
      
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Lỗi khi tạo vòng tiếp theo', 'error')
    } finally {
      setGeneratingNextRound(false)
    }
  }

  const handleApproveAllPending = () => {
    const pendingRegs = filteredRegistrations.filter(r => r.status === 'PENDING' || r.status === 'PENDING_APPROVAL')
    if (pendingRegs.length === 0) {
      showToast('Không có đăng ký nào đang chờ duyệt trong danh sách hiện tại', 'warning')
      return
    }
    if (!window.confirm(`Bạn có chắc muốn duyệt tất cả ${pendingRegs.length} đăng ký đang chờ duyệt không?`)) return

    const ids = pendingRegs.map(r => r.id)
    setRegistrations(prev => prev.map(r => ids.includes(r.id) ? { ...r, status: 'APPROVED' } : r))
    
    Promise.allSettled(ids.map(id => approveRaceRegistration(id))).then((results) => {
      const failed = results.filter(r => r.status === 'rejected')
      if (failed.length > 0) {
        showToast(`Duyệt thành công ${ids.length - failed.length}, thất bại ${failed.length}. Vui lòng kiểm tra lại.`, 'warning')
      } else {
        showToast(`Đã duyệt thành công ${ids.length} đăng ký!`)
      }
    })
  }

  const handleAutoAssignTournamentRegistrations = () => {
    if (filterRegTourn === 'ALL') {
      showToast('Vui lòng chọn một giải đấu cụ thể ở bộ lọc trước khi Tự phân bổ!', 'warning')
      return
    }

    const tourn = tournaments.find(t => t.id === filterRegTourn || (t as any)._id === filterRegTourn)
    if (!tourn) {
      showToast('Không tìm thấy thông tin giải đấu', 'error')
      return
    }

    if (tourn.status === 'DRAFT' || tourn.status === 'PUBLISHED') {
      showToast('Không thể phân bổ! Vui lòng đóng cổng đăng ký của giải đấu này trước.', 'warning')
      return
    }

    if (tourn.status && ['BRACKET_GENERATED', 'ONGOING', 'COMPLETED'].includes(tourn.status)) {
      showToast('Giải đấu này đã được chia bảng hoặc đang diễn ra, không thể phân bổ lại!', 'error')
      return
    }

    const eligibleRegs = registrations.filter((reg) => {
      const tournId = getTournamentIdForRegistration(reg)
      return tournId === filterRegTourn && (reg.status === 'APPROVED' || reg.status === 'CONFIRMED')
    })

    if (eligibleRegs.length === 0) {
      showToast('Không có ngựa nào đã được XÁC NHẬN/DUYỆT trong giải đấu này để chia bảng', 'info')
      return
    }

    // Determine rounds and heats dynamically
    const maxHorses = tourn.maxHorses || 8
    let currentHorses = eligibleRegs.length
    
    const newDraftApprovals: Record<string, { raceId: string, raceName: string }> = {}
    const rounds: any[] = []
    let roundNum = 1
    
    // Randomize horses
    const simulatedHorsesArray = [...eligibleRegs].sort(() => Math.random() - 0.5)

    while (currentHorses > maxHorses) {
      const numRaces = Math.ceil(currentHorses / maxHorses)
      const topAdvance = 2 // Advance top 2 by default
      
      const roundRaces = []
      
      for (let i = 0; i < numRaces; i++) {
        const raceName = `Vòng ${roundNum} - Bảng ${i + 1}`
        
        // Assign horses to round 1 races
        if (roundNum === 1) {
          const horsesForRace = simulatedHorsesArray.filter((_, idx) => idx % numRaces === i)
          horsesForRace.forEach(reg => {
            newDraftApprovals[reg.id] = { raceId: `draft-${raceName}`, raceName }
          })
          roundRaces.push({
            name: raceName,
            horseCount: horsesForRace.length,
            topAdvance,
            isDraft: true
          })
        } else {
          // Future rounds placeholder structure
          roundRaces.push({
            name: raceName,
            horseCount: Math.ceil(currentHorses / numRaces),
            topAdvance,
            isDraft: true
          })
        }
      }
      
      rounds.push({
        name: `Vòng ${roundNum}`,
        races: roundRaces
      })
      
      currentHorses = numRaces * topAdvance
      roundNum++
    }

    // Final Round
    const finalRaceName = 'Chung Kết'
    if (roundNum === 1) {
      // Direct to final
      simulatedHorsesArray.forEach(reg => {
        newDraftApprovals[reg.id] = { raceId: `draft-${finalRaceName}`, raceName: finalRaceName }
      })
    }
    
    rounds.push({
      name: finalRaceName,
      races: [{
        name: finalRaceName,
        horseCount: currentHorses,
        topAdvance: 1,
        isDraft: true
      }]
    })

    // Prettify names
    if (rounds.length >= 2) rounds[rounds.length - 2].name = 'Bán Kết'
    if (rounds.length >= 3) rounds[rounds.length - 3].name = 'Tứ Kết'

    setDraftBracket(rounds)
    setDraftApprovals(newDraftApprovals)
    setDraftRejections({})
    showToast(`Đã chia ${eligibleRegs.length} ngựa thành ${rounds.length} vòng đấu. Bấm Xác nhận để chốt!`, 'info')
  }

  const confirmDraftAssignments = async () => {
    if (Object.keys(draftApprovals).length === 0) return
    setConfirmDraftLoading(true)
    try {
      // Group back into heats structure to send to BE
      const heatsMap = new Map<string, string[]>() // raceName -> array of regIds
      for (const [regId, data] of Object.entries(draftApprovals)) {
        if (!heatsMap.has(data.raceName)) heatsMap.set(data.raceName, [])
        heatsMap.get(data.raceName)!.push(regId)
      }
      
      const payload = {
        heats: Array.from(heatsMap.entries()).map(([name, regIds]) => ({ name, regIds }))
      }

      await http.post(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/admin/tournaments/${filterRegTourn}/generate-heats`, payload)
      
      if (draftBracket) {
        await updateTournament(filterRegTourn, { bracket: { rounds: draftBracket } })
      }
      
      showToast(`Đã chốt chia bảng thành công và xếp cổng!`, 'success')
      setDraftApprovals({})
      setDraftRejections({})
      setShowConfirmDraftModal(false)
      loadTabData(filterRegTourn, undefined, undefined, undefined)
      loadDashboardStats()
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Lỗi khi lưu bảng đấu', 'error')
    } finally {
      setConfirmDraftLoading(false)
    }
  }

  // ---------------------------------------------------------
  // HORSE APPROVAL ACTIONS
  // ---------------------------------------------------------
  const handleApproveHorse = async (horseId: string) => {
    try {
      await approveHorse(horseId)
      setLastModifiedHorseId(horseId)
      showToast('Đã duyệt hồ sơ ngựa thành công')
      loadTabData(undefined, undefined, undefined, horseId)
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Không thể duyệt ngựa', 'error')
    }
  }

  const handleRejectHorse = async (horseId: string) => {
    const reason = window.prompt('Nhập lý do từ chối hồ sơ ngựa (có thể để trống):')
    if (reason === null) return // user cancelled
    try {
      await rejectHorse(horseId, reason)
      setLastModifiedHorseId(horseId)
      showToast('Đã từ chối hồ sơ ngựa', 'warning')
      loadTabData(undefined, undefined, undefined, horseId)
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Không thể từ chối ngựa', 'error')
    }
  }

  // ---------------------------------------------------------
  // REFEREE & RESULT ACTIONS
  // ---------------------------------------------------------
  const openRefModal = (raceId: string, currentRefId?: string) => {
    console.debug('openRefModal called', { raceId, currentRefId })
    setRefRaceId(raceId)
    setSelectedRefId(currentRefId || '')
    setShowRefModal(true)
  }

  const handleSaveReferee = async () => {
    if (!selectedRefId) return
    try {
      console.debug('assignReferee called', { refRaceId, selectedRefId })
      await assignReferee(refRaceId, selectedRefId)
      setLastModifiedRaceId(refRaceId)
      showToast('Đã phân công trọng tài thành công')
      setShowRefModal(false)
      loadTabData(undefined, refRaceId, undefined, undefined)
    } catch (err: any) {
      console.error('assignReferee error', err)
      showToast(err.response?.data?.message || 'Không thể phân công trọng tài', 'error')
    }
  }

  const openResultModal = async (race: Race) => {
    setResultRace(race)
    setResultNotes('')
    try {
      // Get horses registered for this race
      const res = await http.get(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/races/${race.id}/horses`)
      const horsesList = res.data.horses || []
      setRaceHorses(horsesList)

      // Check if race already has confirmed rankings/results
      let initialRankings: any[]
      if ((race.status === 'RESULT_CONFIRMED' || race.status === 'COMPLETED') && race.rankings && Array.isArray(race.rankings) && race.rankings.length > 0) {
        initialRankings = race.rankings
      } else if ((race.status === 'RESULT_CONFIRMED' || race.status === 'COMPLETED') && race.results && Array.isArray(race.results) && race.results.length > 0) {
        initialRankings = race.results
      } else {
        // Initialize rankings form: default positions
        initialRankings = horsesList.map((h: any, idx: number) => ({
          horseId: h.horse?._id || h.horse?.id,
          jockeyId: h.horse?.ownerId?._id || h.horse?.ownerId, // placeholder or jockey if confirmed
          position: idx + 1,
          finishTime: 60 + idx * 2.5, // default time estimate
          status: 'FINISHED',
          prizeAmount: idx === 0 ? race.prizeFirst : idx === 1 ? race.prizeSecond : idx === 2 ? race.prizeThird : 0,
        }))
      }
      setResultRankings(initialRankings)
      setShowResultModal(true)
    } catch (err: any) {
      alert('Không thể lấy danh sách ngựa đã đăng ký cho cuộc đua: ' + (err.response?.data?.message || err.message))
    }
  }

  const handleSaveResult = async () => {
    if (!resultRace) return
    try {
      // Build results matching backend schema — guard null jockeyId
      const resultsPayload = resultRankings.map((r) => ({
        horseId: r.horseId,
        jockeyId: r.jockeyId?._id || r.jockeyId || undefined,
        position: parseInt(r.position),
        finishTime: parseFloat(r.finishTime),
        status: r.status,
        prizeAmount: parseFloat(r.prizeAmount),
        notes: resultNotes,
      }))

      await publishRaceResult(resultRace.id, resultsPayload)
      setLastModifiedRaceId(resultRace.id)
      showToast('Công bố kết quả cuộc đua thành công!')
      setShowResultModal(false)
      loadTabData(undefined, resultRace.id, undefined, undefined)
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Không thể công bố kết quả', 'error')
    }
  }

  // ---------------------------------------------------------
  // PREDICTION ACTIONS
  // ---------------------------------------------------------
  const handleClosePredictions = async (raceId: string) => {
    try {
      await closePredictions(raceId)
      setLastModifiedRaceId(raceId)
      showToast('Đã đóng cổng dự đoán cho cuộc đua này!')
      loadTabData(undefined, raceId, undefined, undefined)
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Không thể đóng cổng dự đoán', 'error')
    }
  }

  const handleSettlePredictions = async (raceId: string) => {
    try {
      await settlePredictions(raceId)
      setLastModifiedRaceId(raceId)
      showToast('Đã tất toán dự đoán và gửi thông báo thắng/thua!')
      loadTabData(undefined, raceId, undefined, undefined)
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Không thể tất toán dự đoán', 'error')
    }
  }

  const handleViewPredictionStats = async (raceId: string) => {
    setPredStats(null)
    try {
      const list = await getAdminPredictions({ raceId })
      const totalPredictions = list.length
      const totalPool = list.reduce((sum, p) => sum + (p.betAmount || 0), 0)
      
      const groups: Record<string, { horseName: string; count: number; amount: number }> = {}
      list.forEach((p) => {
        const hId = typeof p.horseId === 'object' ? p.horseId?._id || p.horseId?.id || '' : p.horseId || ''
        const hName = typeof p.horseId === 'object' ? p.horseId?.name || 'Chưa rõ' : 'Chưa rõ'
        
        if (!groups[hId]) {
          groups[hId] = { horseName: hName, count: 0, amount: 0 }
        }
        groups[hId].count += 1
        groups[hId].amount += p.betAmount || 0
      })
      
      const breakdown = Object.entries(groups).map(([horseId, data]) => ({
        horseId,
        horseName: data.horseName,
        count: data.count,
        amount: data.amount,
        percentage: totalPool > 0 ? Math.round((data.amount / totalPool) * 100) : 0
      }))
      
      setPredStats({
        totalPredictions,
        totalPool,
        breakdown
      })
      setShowPredStatsModal(true)
    } catch (err: any) {
      showToast('Không thể lấy thống kê dự đoán: ' + (err.response?.data?.message || err.message), 'error')
    }
  }

  // Filter predictions list
  const filteredPredictions = predictions.filter((p) => {
    if (filterPredStatus !== 'ALL' && p.status !== filterPredStatus) return false
    
    if (filterPredRace !== 'ALL') {
      const rId = typeof p.raceId === 'object' ? p.raceId?._id || p.raceId?.id : p.raceId
      if (rId !== filterPredRace) return false
    }
    
    if (filterPredSearch.trim() !== '') {
      const specName = p.spectatorId?.fullName || p.spectatorId?.name || ''
      const specEmail = p.spectatorId?.email || ''
      const query = filterPredSearch.toLowerCase()
      if (!specName.toLowerCase().includes(query) && !specEmail.toLowerCase().includes(query)) return false
    }
    
    return true
  })

  // Filter tournaments list
  const filteredTournaments = tournaments.filter((t) => {
    if (filterTournStatus !== 'ALL' && t.status !== filterTournStatus) return false
    
    if (filterTournSearch.trim() !== '') {
      const query = filterTournSearch.toLowerCase()
      const name = t.name.toLowerCase()
      const venue = (t.venue || '').toLowerCase()
      const desc = (t.description || '').toLowerCase()
      if (!name.includes(query) && !venue.includes(query) && !desc.includes(query)) return false
    }
    return true
  })

  // Filter registrations list
  const filteredRegistrations = registrations.filter((reg) => {
    
    if (filterRegTourn !== 'ALL') {
      const resolvedTournId = getTournamentIdForRegistration(reg)
      if (resolvedTournId !== filterRegTourn) return false
    }

    if (filterRegRace !== 'ALL') {
      const draftApp = draftApprovals[reg.id || (reg as any)._id]
      const raceName = draftApp ? draftApp.raceName : (reg.raceName || (typeof reg.raceId === 'object' ? reg.raceId?.name : ''))
      if (raceName !== filterRegRace) return false
    }

    return true
  })

  const { toasts, show: showToast } = useToast()

  const tabHeaders: Record<string, { title: string; desc: string; icon: any }> = {
    tournaments: { title: 'Giải Đấu & Lịch Trình', desc: 'Quản lý thông tin giải đấu và xếp lịch các chặng đua.', icon: Trophy },
    registrations: { title: 'Duyệt Đăng Ký Giải', desc: 'Tự phân bổ ngựa đã đăng ký giải vào các vòng đua phù hợp.', icon: ClipboardList },
    'horses-jockeys': { title: 'Ngựa & Jockeys', desc: 'Xét duyệt hồ sơ ngựa chiến mới và danh sách nài ngựa.', icon: Sparkles },
    'referee-results': { title: 'Trọng Tài & Kết Quả', desc: 'Chỉ định trọng tài điều khiển và công bố kết quả cuộc đua.', icon: Scale },
    predictions: { title: 'Dự Đoán (Bets)', desc: 'Theo dõi các hoạt động đặt cược và thanh quyết toán kết quả.', icon: Target }
  }

  const currentHeader = tabHeaders[activeTab] || { title: 'Quản lý Hệ thống', desc: 'Giải đấu, lịch trình, duyệt đăng ký và công bố kết quả', icon: Settings }

  return (
    <>
      {/* Toast notifications */}
      <div className="toast-container">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast-${t.type}`}>
            <span className="toast-icon">{toastIcon[t.type]}</span>
            {t.message}
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      {/* Page header */}
      <div className="flex-between">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-emerald-500/10 ring-1 ring-emerald-500/20 text-emerald-500">
            {(() => {
              const HeaderIcon = currentHeader.icon || Settings
              return <HeaderIcon className="h-6 w-6" />
            })()}
          </div>
          <div>
            <h1 className="text-2xl font-black text-[var(--text)] tracking-tight m-0">
              {tab ? currentHeader.title : 'Quản lý Hệ thống'}
            </h1>
            <p className="muted text-sm m-0">
              {tab ? currentHeader.desc : 'Giải đấu, lịch trình, duyệt đăng ký và công bố kết quả'}
            </p>
          </div>
        </div>
      </div>
      
      {/* Real Stats Panel (Only show if not accessed via dropdown sub-route) */}
      {!tab && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 24 }}>
          <div className="spotlight-card-outer animate-border-custom">
            <div className="card bg-transparent border-transparent" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16 }}>
              <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 shrink-0">
                <Trophy className="h-7 w-7" />
              </div>
              <div>
                <div style={{ fontSize: 13, color: '#3b82f6', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Tổng giải đấu</div>
                <div style={{ fontSize: 24, fontWeight: 900, color: 'var(--text)' }}>{adminStats.tournaments}</div>
              </div>
            </div>
          </div>
          <div className="spotlight-card-outer animate-border-custom">
            <div className="card bg-transparent border-transparent" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16 }}>
              <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shrink-0">
                <Flag className="h-7 w-7" />
              </div>
              <div>
                <div style={{ fontSize: 13, color: '#10b981', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Cuộc đua đang mở</div>
                <div style={{ fontSize: 24, fontWeight: 900, color: 'var(--text)' }}>{adminStats.activeRaces}</div>
              </div>
            </div>
          </div>
          <div className="spotlight-card-outer animate-border-custom">
            <div className="card bg-transparent border-transparent" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16 }}>
              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 shrink-0">
                <ClipboardList className="h-7 w-7" />
              </div>
              <div>
                <div style={{ fontSize: 13, color: '#d97706', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Đăng ký đua chờ duyệt</div>
                <div style={{ fontSize: 24, fontWeight: 900, color: 'var(--text)' }}>{adminStats.pendingRegs}</div>
              </div>
            </div>
          </div>
          <div className="spotlight-card-outer animate-border-custom">
            <div className="card bg-transparent border-transparent" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16 }}>
              <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 shrink-0">
                <Sparkles className="h-7 w-7" />
              </div>
              <div>
                <div style={{ fontSize: 13, color: '#8b5cf6', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Ngựa chờ duyệt</div>
                <div style={{ fontSize: 24, fontWeight: 900, color: 'var(--text)' }}>{adminStats.pendingHorses}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab Navigation (Only show if not accessed via dropdown sub-route) */}
      {!tab && (
        <div className="tabs">
          <button
            className={`tab-link flex items-center gap-2 ${activeTab === 'tournaments' ? 'active' : ''}`}
            onClick={() => startTransition(() => setActiveTab('tournaments'))}
          >
            <Trophy className="w-4 h-4 text-amber-500 shrink-0" />
            <span>Giải Đấu & Lịch Trình</span>
          </button>
          <button
            className={`tab-link flex items-center gap-2 ${activeTab === 'registrations' ? 'active' : ''}`}
            onClick={() => startTransition(() => setActiveTab('registrations'))}
          >
            <ClipboardList className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>Duyệt Đăng Ký Đua</span>
          </button>
          <button
            className={`tab-link flex items-center gap-2 ${activeTab === 'horses-jockeys' ? 'active' : ''}`}
            onClick={() => startTransition(() => setActiveTab('horses-jockeys'))}
          >
            <Sparkles className="w-4 h-4 text-purple-500 shrink-0" />
            <span>Ngựa & Jockeys</span>
          </button>
          <button
            className={`tab-link flex items-center gap-2 ${activeTab === 'referee-results' ? 'active' : ''}`}
            onClick={() => startTransition(() => setActiveTab('referee-results'))}
          >
            <Scale className="w-4 h-4 text-blue-500 shrink-0" />
            <span>Trọng Tài & Kết Quả</span>
          </button>
          <button
            className={`tab-link flex items-center gap-2 ${activeTab === 'predictions' ? 'active' : ''}`}
            onClick={() => startTransition(() => setActiveTab('predictions'))}
          >
            <Target className="w-4 h-4 text-pink-500 shrink-0" />
            <span>Dự Đoán (Bets)</span>
          </button>
        </div>
      )}

      {error && (
        <div className="card" style={{ background: 'var(--danger-light)', border: '1px solid #fca5a5', color: '#991b1b', padding: '12px 16px' }}>
          ⚠️ {error}
        </div>
      )}

      {/* ---------------------------------------------------------
          TAB 1: TOURNAMENTS & RACES
          --------------------------------------------------------- */}
      {activeTab === 'tournaments' && (
        <div className="card">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 style={{ fontSize: '20px', color: 'var(--text)', margin: 0 }}>Quản Lý Giải Đấu Đua Ngựa</h2>
              <p className="muted" style={{ margin: 0 }}>Tạo mới, chỉnh sửa thông tin giải đấu và các vòng đua tương ứng.</p>
            </div>
            <button className="btn btnPrimary" onClick={() => openTournModal(null)}>
              + Thêm giải đấu
            </button>
          </div>

          {/* Filter Bar */}
          <div className="flex flex-wrap gap-4 items-end mb-6 bg-white/[0.01] border border-white/[0.03] p-4 rounded-xl">
            <div className="form-group flex-1 min-w-[200px]" style={{ margin: 0 }}>
              <label className="text-xs font-bold mb-1.5 block">Tìm kiếm giải đấu</label>
              <input
                type="text"
                placeholder="Tìm theo tên, địa điểm, mô tả..."
                value={filterTournSearch}
                onChange={(e) => setFilterTournSearch(e.target.value)}
                className="h-10 rounded-lg"
              />
            </div>
            <div className="form-group min-w-[150px]" style={{ margin: 0 }}>
              <label className="text-xs font-bold mb-1.5 block">Trạng thái giải đấu</label>
              <select
                value={filterTournStatus}
                onChange={(e) => setFilterTournStatus(e.target.value)}
                className="h-10 rounded-lg"
              >
                <option value="ALL">Tất cả trạng thái</option>
                <option value="DRAFT">Bản nháp (Draft)</option>
                <option value="PUBLISHED">Đã công bố (Published)</option>
                <option value="REGISTRATION_CLOSED">Đã đóng đăng ký (Closed)</option>
                <option value="BRACKET_GENERATED">Đã chia bảng (Bracketed)</option>
                <option value="ONGOING">Đang diễn ra (Ongoing)</option>
                <option value="COMPLETED">Hoàn thành (Completed)</option>
                <option value="CANCELLED">Đã hủy (Cancelled)</option>
              </select>
            </div>
          </div>

          {loading ? (
            <p className="muted">Đang tải...</p>
          ) : filteredTournaments.length === 0 ? (
            <div className="text-center py-8 text-[var(--muted)] font-semibold">
              Không tìm thấy giải đấu nào khớp với điều kiện lọc.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {filteredTournaments.map((t) => {
                const isExpanded = expandedTournId === t.id
                const tournRaces = races.filter(r => (typeof r.tournamentId === 'object' ? r.tournamentId?._id || r.tournamentId?.id : r.tournamentId) === t.id)
                return (
                  <div 
                    key={t.id} 
                    className="card animate-fade-in" 
                    style={{ 
                      background: 'var(--surface-2)', 
                      border: '1px solid var(--border)',
                      padding: '16px 20px',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <div 
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer select-none"
                      onClick={() => setExpandedTournId(isExpanded ? null : t.id)}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 4 }}>
                          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800 }} className="text-[var(--text)]">
                            {t.name}
                          </h3>
                          <span 
                            style={{
                              fontSize: '11px',
                              fontWeight: 800,
                              padding: '2px 8px',
                              borderRadius: '999px',
                              border: '1px solid',
                              background:
                                t.status === 'PUBLISHED' || t.status === 'ONGOING' ? 'rgba(16,185,129,0.12)' :
                                t.status === 'COMPLETED' ? 'rgba(16,185,129,0.08)' :
                                t.status === 'CANCELLED' ? 'rgba(239,68,68,0.10)' : 'rgba(245,158,11,0.10)',
                              borderColor:
                                t.status === 'PUBLISHED' || t.status === 'ONGOING' ? '#10b981' :
                                t.status === 'COMPLETED' ? '#059669' :
                                t.status === 'CANCELLED' ? '#ef4444' : '#f59e0b',
                              color:
                                t.status === 'PUBLISHED' || t.status === 'ONGOING' ? '#059669' :
                                t.status === 'COMPLETED' ? '#047857' :
                                t.status === 'CANCELLED' ? '#dc2626' : '#d97706',
                            }}
                          >
                            {t.status === 'DRAFT' ? 'Bản nháp' :
                             t.status === 'PUBLISHED' ? 'Đã công bố' :
                             t.status === 'REGISTRATION_CLOSED' ? 'Đã đóng đăng ký' :
                             t.status === 'BRACKET_GENERATED' ? 'Đã chia bảng' :
                             t.status === 'ONGOING' ? 'Đang diễn ra' :
                             t.status === 'COMPLETED' ? 'Hoàn thành' : 'Đã hủy'}
                          </span>
                          <span className="muted text-xs font-semibold">
                            ({tournRaces.length} cuộc đua)
                          </span>
                        </div>
                        <p className="muted" style={{ fontSize: '13px', margin: 0 }}>
                          📍 {t.venue} | 📅 {new Date(t.startDate).toLocaleDateString('vi-VN')} - {new Date(t.endDate).toLocaleDateString('vi-VN')}
                        </p>
                      </div>

                      <div 
                        style={{ display: 'flex', gap: 8, alignItems: 'center' }} 
                        onClick={(e) => e.stopPropagation()}
                      >
                        {t.status === 'PUBLISHED' && (
                           <button className="btn btn-sm" style={{ padding: '6px 12px', fontSize: '12px', background: '#f59e0b', color: '#fff', border: 'none' }} onClick={() => handleCloseRegistration(t.id)}>Đóng Đăng Ký</button>
                        )}
                        {t.status === 'REGISTRATION_CLOSED' && (
                           <button className="btn btn-sm" style={{ padding: '6px 12px', fontSize: '12px', background: '#3b82f6', color: '#fff', border: 'none' }} onClick={() => handleGenerateBracket(t.id)}>Chia Bảng</button>
                        )}
                        <button className="btn btn-sm" style={{ padding: '6px 12px', fontSize: '12px' }} onClick={() => openRaceModal(null, t.id)}>+ Cuộc đua</button>
                        <button className="btn btn-sm" style={{ padding: '6px 12px', fontSize: '12px' }} onClick={() => openTournModal(t)}>Sửa</button>
                        <button className="btn btn-sm" style={{ color: '#ef4444', padding: '6px 12px', fontSize: '12px' }} onClick={() => handleDeleteTourn(t.id, t.name)}>Xóa</button>
                        
                        <div 
                          className="p-1 hover:bg-white/5 rounded-lg transition-colors cursor-pointer text-[var(--muted)]"
                          onClick={() => setExpandedTournId(isExpanded ? null : t.id)}
                        >
                          <svg 
                            className={`w-5 h-5 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} 
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                            style={{ width: '20px', height: '20px' }}
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>
                    </div>

                    {isExpanded && (
                      <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
                        {t.description && (
                          <p style={{ fontSize: '13.5px', marginTop: 0, marginBottom: 16, fontStyle: 'italic', color: 'var(--text)' }}>
                            Mô tả: {t.description}
                          </p>
                        )}
                        <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>Cập nhật nhanh trạng thái:</span>
                          <select
                            value={t.status || 'DRAFT'}
                            onChange={(e) => handleQuickStatusChange(t.id, t.name, e.target.value)}
                            style={{
                              width: 'auto',
                              padding: '2px 28px 2px 8px',
                              fontSize: '12px',
                              borderRadius: '8px',
                              cursor: 'pointer',
                            }}
                          >
                            <option value="DRAFT">Bản nháp</option>
                            <option value="PUBLISHED">Đã công bố</option>
                            <option value="REGISTRATION_CLOSED">Đã đóng đăng ký</option>
                            <option value="BRACKET_GENERATED">Đã chia bảng</option>
                            <option value="ONGOING">Đang diễn ra</option>
                            <option value="COMPLETED">Hoàn thành</option>
                            <option value="CANCELLED">Đã hủy</option>
                          </select>
                          <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>| Quỹ thưởng: {t.prizePool?.toLocaleString('vi-VN')} {t.currency || 'VND'} | Ngựa tối đa: {t.maxHorses}</span>
                        </div>

                        <h4 style={{ margin: '0 0 10px', fontSize: '13px', fontWeight: 700 }} className="text-[var(--text)]">Danh sách cuộc đua thuộc giải đấu:</h4>
                        <RaceList
                          races={tournRaces}
                          onEditRace={(race) => openRaceModal(race)}
                          onViewRace={() => {
                            setViewBracketTournament(t)
                            setViewBracketRaces(tournRaces)
                          }}
                          onOpenResultModal={openResultModal}
                          onRefresh={(rId) => {
                            if (rId) setLastModifiedRaceId(rId)
                            loadTabData(undefined, rId, undefined, undefined)
                          }}
                          lastModifiedRaceId={lastModifiedRaceId}
                        />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ---------------------------------------------------------
          TAB 2: RACE REGISTRATIONS APPROVAL
          --------------------------------------------------------- */}
      {activeTab === 'registrations' && (
        <div className="card">
          <h2>Duyệt Đăng Ký Tham Gia Giải Đấu</h2>
          <p className="muted">Xem các yêu cầu đăng ký giải của chủ ngựa và tự phân bổ ngựa vào vòng đua phù hợp.</p>

          {/* Filter Bar */}
          <div className="flex flex-wrap gap-4 items-end mb-6 bg-white/[0.01] border border-white/[0.03] p-4 rounded-xl">
            <div className="form-group min-w-[200px]" style={{ margin: 0 }}>
              <label className="text-xs font-bold mb-1.5 block">Lọc theo giải đấu</label>
              <select
                value={filterRegTourn}
                onChange={(e) => { 
                  setFilterRegTourn(e.target.value); 
                  setFilterRegRace('ALL'); 
                  setDraftApprovals({});
                  setDraftRejections({});
                  setDraftBracket(null);
                }}
                className="h-10 rounded-lg"
              >
                <option value="ALL">Tất cả giải đấu</option>
                {tournaments.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
            {filterRegTourn !== 'ALL' && (
              <div className="form-group min-w-[150px]" style={{ margin: 0 }}>
                <label className="text-xs font-bold mb-1.5 block">Lọc bảng đấu</label>
                <select
                  value={filterRegRace}
                  onChange={(e) => setFilterRegRace(e.target.value)}
                  className="h-10 rounded-lg"
                >
                  <option value="ALL">Tất cả bảng đấu</option>
                  {Array.from(new Set(
                    registrations
                      .filter(r => getTournamentIdForRegistration(r) === filterRegTourn)
                      .map(r => {
                        const draftApp = draftApprovals[r.id || (r as any)._id]
                        return draftApp ? draftApp.raceName : (r.raceName || (typeof r.raceId === 'object' ? r.raceId?.name : ''))
                      })
                      .filter(Boolean)
                  )).map((raceName) => (
                    <option key={raceName} value={raceName}>{raceName}</option>
                  ))}
                </select>
              </div>
            )}
            <div className="form-group flex-1 min-w-[300px]" style={{ margin: 0 }}>
              <label className="text-xs font-bold mb-1.5 block">Phân bổ vòng đấu</label>
              <div className="flex gap-2">
                {filterRegTourn !== 'ALL' && (
                  <button
                    type="button"
                    className="btn h-10 flex-1 relative overflow-hidden group"
                    style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)', color: '#fff', border: 'none', fontWeight: 700 }}
                    onClick={() => {
                      const t = tournaments.find(x => x.id === filterRegTourn || (x as any)._id === filterRegTourn)
                      if (t) {
                        setViewBracketTournament(t)
                        const tournRaces = races.filter((r) => {
                          const rTId = typeof r.tournamentId === 'object' ? r.tournamentId._id || r.tournamentId.id : r.tournamentId
                          return rTId === t.id || rTId === (t as any)._id
                        })
                        setViewBracketRaces(tournRaces)
                      }
                    }}
                  >
                    <span className="flex justify-center items-center gap-2 relative z-10">
                      <Trophy className="w-4 h-4" /> Xem Sơ Đồ Bảng Đấu
                    </span>
                    <div className="absolute inset-0 bg-white/20 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out"></div>
                  </button>
                )}
                <button
                  type="button"
                  className="btn btnPrimary h-10 flex-1 relative overflow-hidden group"
                  disabled={filterRegTourn === 'ALL' || registrations.filter(r => (r.status === 'APPROVED' || r.status === 'CONFIRMED') && getTournamentIdForRegistration(r) === filterRegTourn).length === 0 || loading}
                  title={filterRegTourn === 'ALL' ? 'Vui lòng chọn một giải đấu cụ thể để phân bổ' : ''}
                  onClick={handleAutoAssignTournamentRegistrations}
                  style={{
                    opacity: filterRegTourn === 'ALL' || registrations.filter(r => (r.status === 'APPROVED' || r.status === 'CONFIRMED') && getTournamentIdForRegistration(r) === filterRegTourn).length === 0 || loading ? 0.55 : 1,
                    cursor: filterRegTourn === 'ALL' || registrations.filter(r => (r.status === 'APPROVED' || r.status === 'CONFIRMED') && getTournamentIdForRegistration(r) === filterRegTourn).length === 0 || loading ? 'not-allowed' : 'pointer',
                    background: 'linear-gradient(135deg, #10b981, #059669)',
                    border: 'none',
                    fontWeight: 700,
                  }}
                >
                  <span className="flex justify-center items-center gap-2 relative z-10">
                    <Sparkles className="w-4 h-4" /> Tự phân bổ ngẫu nhiên
                  </span>
                  <div className="absolute inset-0 bg-white/20 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out"></div>
                </button>
                <button
                  type="button"
                  className="btn btnPrimary h-10 flex-1 relative overflow-hidden group"
                  onClick={handleApproveAllPending}
                  style={{
                    background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                    border: 'none',
                    fontWeight: 700,
                  }}
                >
                  <span className="flex justify-center items-center gap-2 relative z-10">
                    <CheckCircle className="w-4 h-4" /> Duyệt tất cả chờ duyệt
                  </span>
                  <div className="absolute inset-0 bg-white/20 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out"></div>
                </button>
                {(Object.keys(draftApprovals).length > 0 || Object.keys(draftRejections).length > 0) && (
                  <button
                    type="button"
                    className="btn h-10 animate-pulse-custom relative overflow-hidden group flex-1"
                    style={{ background: '#3b82f6', color: '#fff', border: 'none', fontWeight: 'bold' }}
                    onClick={() => setShowConfirmDraftModal(true)}
                  >
                    <span className="flex justify-center items-center gap-2 relative z-10">
                      <ClipboardList className="w-4 h-4" /> Xác nhận bảng đấu
                    </span>
                    <div className="absolute inset-0 bg-white/20 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out"></div>
                  </button>
                )}
              </div>
            </div>
          </div>

          {loading ? (
            <p className="muted">Đang tải...</p>
          ) : filteredRegistrations.length === 0 ? (
            <div className="text-center py-8 text-[var(--muted)] font-semibold">
              Không tìm thấy yêu cầu đăng ký nào khớp với điều kiện lọc.
            </div>
          ) : (
            <div className="admin-table-wrapper w-full">
              <AnimatedTable
                data={(() => {
                  let res = filteredRegistrations
                  // Column Filters
                  res = res.filter(r => {
                    if (regColumnFilters.raceName) {
                      const rn = (r.raceName || (typeof r.raceId === 'object' ? r.raceId?.name : '')).toLowerCase()
                      if (!rn.includes(regColumnFilters.raceName.toLowerCase())) return false
                    }
                    if (regColumnFilters.horseName) {
                      const hn = (r.horseName || (typeof r.horseId === 'object' ? r.horseId?.name : '')).toLowerCase()
                      if (!hn.includes(regColumnFilters.horseName.toLowerCase())) return false
                    }
                    if (regColumnFilters.ownerName) {
                      const horseKey = typeof r.horseId === 'string' ? r.horseId : r.horseId?._id || r.horseId?.id
                      const ownerInfo = horseKey ? registrationOwners[horseKey] : undefined
                      const own = (ownerInfo?.fullName || r.ownerName || (typeof r.horseId === 'object' ? r.horseId?.ownerId?.fullName || r.horseId?.ownerId?.name || r.horseId?.owner?.fullName || r.horseId?.owner : '')).toLowerCase()
                      if (!own.includes(regColumnFilters.ownerName.toLowerCase())) return false
                    }
                    if (regColumnFilters.status) {
                      if (regColumnFilters.status === 'PENDING') {
                        if (r.status !== 'PENDING' && r.status !== 'PENDING_APPROVAL') return false
                      } else if (r.status !== regColumnFilters.status) {
                        return false
                      }
                    }
                    return true
                  })

                  // Sort
                  if (regSortColumn && regSortDirection) {
                    res.sort((a, b) => {
                      let aVal: any = a[regSortColumn as keyof RaceRegistration]
                      let bVal: any = b[regSortColumn as keyof RaceRegistration]
                      if (regSortColumn === 'raceName') {
                        aVal = a.raceName || (typeof a.raceId === 'object' ? a.raceId?.name : '')
                        bVal = b.raceName || (typeof b.raceId === 'object' ? b.raceId?.name : '')
                      } else if (regSortColumn === 'horseName') {
                        aVal = a.horseName || (typeof a.horseId === 'object' ? a.horseId?.name : '')
                        bVal = b.horseName || (typeof b.horseId === 'object' ? b.horseId?.name : '')
                      } else if (regSortColumn === 'ownerName') {
                        const hKA = typeof a.horseId === 'string' ? a.horseId : a.horseId?._id || a.horseId?.id
                        const hKB = typeof b.horseId === 'string' ? b.horseId : b.horseId?._id || b.horseId?.id
                        aVal = hKA ? registrationOwners[hKA]?.fullName : ''
                        bVal = hKB ? registrationOwners[hKB]?.fullName : ''
                      } else if (regSortColumn === 'createdAt') {
                        aVal = a.createdAt ? new Date(a.createdAt).getTime() : 0
                        bVal = b.createdAt ? new Date(b.createdAt).getTime() : 0
                      }

                      if (typeof aVal === 'string' && typeof bVal === 'string') {
                        return regSortDirection === 'asc' ? aVal.localeCompare(bVal, 'vi') : bVal.localeCompare(aVal, 'vi')
                      }
                      return regSortDirection === 'asc' ? aVal - bVal : bVal - aVal
                    })
                  }
                  return res
                })().slice((regPage - 1) * 10, regPage * 10)}
                columns={[
                  {
                    id: 'raceName',
                    header: 'Giải đấu / Cuộc đua',
                    sortable: true,
                    filterable: true,
                    filterType: 'text',
                    cell: (row) => {
                      const draftApp = draftApprovals[row.id]
                      const raceName = draftApp ? draftApp.raceName : (row.raceName || (typeof row.raceId === 'object' ? row.raceId?.name : ''))
                      const raceScheduledAt = typeof row.raceId === 'object' ? row.raceId?.scheduledAt : undefined
                      return (
                        <div>
                          <div style={{ fontWeight: 600 }}>
                            {raceName || 'Cuộc đua chưa rõ'}
                            {draftApp && <span style={{ marginLeft: 4, color: '#3b82f6', fontSize: 11 }}>(Dự kiến)</span>}
                          </div>
                          {raceScheduledAt && !draftApp && (
                            <div className="muted" style={{ fontSize: '12px' }}>Ngày đua: {new Date(raceScheduledAt).toLocaleDateString('vi-VN')}</div>
                          )}
                        </div>
                      )
                    }
                  },
                  {
                    id: 'horseName',
                    header: 'Ngựa thi đấu',
                    sortable: true,
                    filterable: true,
                    filterType: 'text',
                    cell: (row) => {
                      const horseName = row.horseName || (typeof row.horseId === 'object' ? row.horseId?.name : '')
                      return <div style={{ fontWeight: 600 }}>{horseName || 'Ngựa chưa rõ'}</div>
                    }
                  },
                  {
                    id: 'ownerName',
                    header: 'Chủ ngựa (Owner)',
                    sortable: true,
                    filterable: true,
                    filterType: 'text',
                    cell: (row) => {
                      const horseKey = typeof row.horseId === 'string' ? row.horseId : row.horseId?._id || row.horseId?.id
                      const ownerInfo = horseKey ? registrationOwners[horseKey] : undefined
                      const horseOwnerName = ownerInfo?.fullName || row.ownerName || (typeof row.horseId === 'object' ? row.horseId?.ownerId?.fullName || row.horseId?.ownerId?.name || row.horseId?.owner?.fullName || row.horseId?.owner : '')
                      const horseOwnerPhone = ownerInfo?.phone || (typeof row.horseId === 'object' ? row.horseId?.ownerId?.phone : undefined)
                      return (
                        <div>
                          <div>{horseOwnerName || 'Chưa có thông tin chủ ngựa'}</div>
                          {horseOwnerPhone && (
                            <div className="muted flex items-center gap-1" style={{ fontSize: '12px' }}>
                              <Phone className="w-3 h-3 text-muted shrink-0" />
                              <span>{horseOwnerPhone}</span>
                            </div>
                          )}
                        </div>
                      )
                    }
                  },
                  {
                    id: 'status',
                    header: 'Trạng thái đăng ký',
                    sortable: true,
                    filterable: true,
                    filterType: 'select',
                    filterOptions: [
                      { label: 'Chờ duyệt', value: 'PENDING' },
                      { label: 'Đã duyệt', value: 'APPROVED' },
                      { label: 'Đã xác nhận', value: 'CONFIRMED' },
                      { label: 'Đã từ chối', value: 'REJECTED' },
                    ],
                    cell: (row) => {
                      const draftApp = draftApprovals[row.id]
                      const draftRej = draftRejections[row.id]
                      if (draftApp) {
                        return (
                          <div>
                            <span className="badge badge-status-approved" style={{ background: '#dbeafe', color: '#1d4ed8' }}>Dự kiến: Đã duyệt</span>
                          </div>
                        )
                      }
                      if (draftRej) {
                        return (
                          <div>
                            <span className="badge badge-status-rejected" style={{ background: '#fee2e2', color: '#b91c1c' }}>Dự kiến: Đã từ chối</span>
                            <div className="text-xs" style={{ marginTop: 4, color: '#ef4444' }}>Lý do: {draftRej}</div>
                          </div>
                        )
                      }
                      return (
                        <div>
                          <span className={`badge badge-status-${row.status === 'APPROVED' ? 'approved' : row.status === 'CONFIRMED' ? 'confirmed' : row.status === 'REJECTED' ? 'rejected' : 'pending'}`}>
                            {row.status === 'APPROVED' ? 'Đã duyệt' : row.status === 'CONFIRMED' ? 'Đã xác nhận' : row.status === 'REJECTED' ? 'Đã từ chối' : (row.status === 'PENDING_APPROVAL' || row.status === 'PENDING') ? 'Chờ duyệt' : row.status}
                          </span>
                          {row.status === 'REJECTED' && (row as any).rejectionReason && (
                            <div className="text-xs" style={{ marginTop: 4, color: '#ef4444' }}>Lý do: {(row as any).rejectionReason}</div>
                          )}
                        </div>
                      )
                    }
                  },
                  {
                    id: 'createdAt',
                    header: 'Ngày yêu cầu',
                    sortable: true,
                    cell: (row) => <span>{row.createdAt ? new Date(row.createdAt).toLocaleDateString('vi-VN') : ''}</span>
                  },
                  {
                    id: 'actions',
                    header: 'Hành động',
                    align: 'right',
                    cell: (row) => (
                      (row.status === 'PENDING_APPROVAL' || row.status === 'PENDING') ? (
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                          <button className="btn btnPrimary" style={{ fontSize: '13px', padding: '6px 10px' }} onClick={() => handleApproveReg(row.id)}>Duyệt</button>
                          <button className="btn" style={{ fontSize: '13px', padding: '6px 10px', color: '#ef4444' }} onClick={() => handleRejectReg(row.id)}>Từ chối</button>
                        </div>
                      ) : (
                        <span className="text-xs text-[var(--muted)]">-</span>
                      )
                    )
                  }
                ]}
                sortColumn={regSortColumn}
                sortDirection={regSortDirection}
                onSort={handleRegSort}
                columnFilters={regColumnFilters}
                onColumnFilterChange={handleRegColumnFilterChange}
                pagination={{
                  page: regPage,
                  pageSize: 10,
                  totalItems: (() => {
                    let res = filteredRegistrations
                    if (regColumnFilters.raceName) {
                      res = res.filter(r => {
                        const rn = (r.raceName || (typeof r.raceId === 'object' ? r.raceId?.name : '')).toLowerCase()
                        return rn.includes(regColumnFilters.raceName.toLowerCase())
                      })
                    }
                    if (regColumnFilters.horseName) {
                      res = res.filter(r => {
                        const hn = (r.horseName || (typeof r.horseId === 'object' ? r.horseId?.name : '')).toLowerCase()
                        return hn.includes(regColumnFilters.horseName.toLowerCase())
                      })
                    }
                    if (regColumnFilters.ownerName) {
                      res = res.filter(r => {
                        const horseKey = typeof r.horseId === 'string' ? r.horseId : r.horseId?._id || r.horseId?.id
                        const ownerInfo = horseKey ? registrationOwners[horseKey] : undefined
                        const own = (ownerInfo?.fullName || r.ownerName || (typeof r.horseId === 'object' ? r.horseId?.ownerId?.fullName || r.horseId?.ownerId?.name || r.horseId?.owner?.fullName || r.horseId?.owner : '')).toLowerCase()
                        return own.includes(regColumnFilters.ownerName.toLowerCase())
                      })
                    }
                    if (regColumnFilters.status) {
                      res = res.filter(r => {
                        if (regColumnFilters.status === 'PENDING') {
                          return r.status === 'PENDING' || r.status === 'PENDING_APPROVAL'
                        }
                        return r.status === regColumnFilters.status
                      })
                    }
                    return res.length
                  })(),
                  onPageChange: setRegPage,
                  pageSizeOptions: [10, 20, 50]
                }}
              />
            </div>
          )}
        </div>
      )}

      {/* ---------------------------------------------------------
          TAB 3: HORSES & JOCKEYS APPROVAL
          --------------------------------------------------------- */}
      {activeTab === 'horses-jockeys' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 32 }}>
          {/* Horse profiles approval */}
          <div className="card">
            <h2>Duyệt Hồ Sơ Ngựa Trong Hệ Thống</h2>
            <p className="muted">Khi chủ ngựa khai báo ngựa mới, hồ sơ cần được duyệt (kiểm tra chứng nhận sức khỏe) trước khi có thể đăng ký thi đấu.</p>

            {loading ? (
              <p className="muted">Đang tải...</p>
            ) : horses.length === 0 ? (
              <p className="muted">Không có hồ sơ ngựa nào cần duyệt.</p>
            ) : (
              <div className="admin-table-wrapper w-full">
                <AnimatedTable
                  data={(() => {
                    let res = horses
                    // Filters
                    res = res.filter(h => {
                      if (horsesColumnFilters.name && !h.name.toLowerCase().includes(horsesColumnFilters.name.toLowerCase())) return false
                      if (horsesColumnFilters.breed) {
                        const bStr = `Giống: ${h.breed} | Màu: ${h.color}`.toLowerCase()
                        if (!bStr.includes(horsesColumnFilters.breed.toLowerCase())) return false
                      }
                      if (horsesColumnFilters.ownerId) {
                        const ownStr = (h.ownerId?.fullName || 'Chủ ngựa').toLowerCase()
                        if (!ownStr.includes(horsesColumnFilters.ownerId.toLowerCase())) return false
                      }
                      if (horsesColumnFilters.status && h.status !== horsesColumnFilters.status) return false
                      return true
                    })
                    // Sort
                    if (horsesSortColumn && horsesSortDirection) {
                      res.sort((a, b) => {
                        let aVal: any = a[horsesSortColumn as keyof Horse]
                        let bVal: any = b[horsesSortColumn as keyof Horse]
                        if (horsesSortColumn === 'ownerId') {
                          aVal = a.ownerId?.fullName || ''
                          bVal = b.ownerId?.fullName || ''
                        }
                        if (typeof aVal === 'string' && typeof bVal === 'string') {
                          return horsesSortDirection === 'asc' ? aVal.localeCompare(bVal, 'vi') : bVal.localeCompare(aVal, 'vi')
                        }
                        return horsesSortDirection === 'asc' ? aVal - bVal : bVal - aVal
                      })
                    }
                    return res
                  })().slice((horsesPage - 1) * 10, horsesPage * 10)}
                  columns={[
                    {
                      id: 'name',
                      header: 'Tên ngựa',
                      sortable: true,
                      filterable: true,
                      filterType: 'text',
                      cell: (row) => <div style={{ fontWeight: 600 }}>{row.name}</div>
                    },
                    {
                      id: 'breed',
                      header: 'Giống & Đặc điểm',
                      sortable: true,
                      filterable: true,
                      filterType: 'text',
                      cell: (row) => (
                        <div>
                          <div>Giống: {row.breed} | Màu: {row.color}</div>
                          <div className="muted" style={{ fontSize: '12px' }}>Nguồn gốc: {row.origin} | Tuổi: {row.age} | Cân nặng: {row.weight}kg</div>
                        </div>
                      )
                    },
                    {
                      id: 'ownerId',
                      header: 'Chủ ngựa',
                      sortable: true,
                      filterable: true,
                      filterType: 'text',
                      cell: (row) => (
                        <div>
                          <div>{row.ownerId?.fullName || 'Chủ ngựa'}</div>
                          <div className="muted" style={{ fontSize: '12px' }}>{row.ownerId?.email}</div>
                        </div>
                      )
                    },
                    {
                      id: 'status',
                      header: 'Trạng thái',
                      sortable: true,
                      filterable: true,
                      filterType: 'select',
                      filterOptions: [
                        { label: 'Chờ duyệt', value: 'PENDING' },
                        { label: 'Đã duyệt', value: 'APPROVED' },
                        { label: 'Đã từ chối', value: 'REJECTED' },
                      ],
                      cell: (row) => (
                        <div>
                          <span className={`badge ${row.status === 'APPROVED' ? 'badge-approved' : row.status === 'REJECTED' ? 'badge-rejected' : 'badge-pending'}`}>
                            {row.status === 'APPROVED' ? 'Đã duyệt' : row.status === 'REJECTED' ? 'Đã từ chối' : row.status === 'PENDING' ? 'Chờ duyệt' : row.status}
                          </span>
                          {row.status === 'REJECTED' && (row as any).rejectionReason && (
                            <div className="text-xs" style={{ marginTop: 4, color: '#ef4444' }}>Lý do: {(row as any).rejectionReason}</div>
                          )}
                        </div>
                      )
                    },
                    {
                      id: 'healthCertUrl',
                      header: 'Hồ sơ sức khỏe',
                      cell: (row) => (
                        row.healthCertUrl ? (
                          <a href={row.healthCertUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1" style={{ color: 'var(--primary)', fontWeight: 600 }}>
                            <span>Xem Health Cert</span>
                            <ExternalLink className="w-3 h-3 shrink-0" />
                          </a>
                        ) : (
                          <span className="danger-text flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3 text-red-500 shrink-0" />
                            <span>Thiếu hồ sơ</span>
                          </span>
                        )
                      )
                    },
                    {
                      id: 'actions',
                      header: 'Hành động',
                      align: 'right',
                      cell: (row) => (
                        row.status === 'PENDING' ? (
                          <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                            <button className="btn btnPrimary" style={{ fontSize: '12px', padding: '5px 8px' }} onClick={() => handleApproveHorse(row.id)}>Duyệt</button>
                            <button className="btn" style={{ fontSize: '12px', padding: '5px 8px', color: '#ef4444' }} onClick={() => handleRejectHorse(row.id)}>Từ chối</button>
                          </div>
                        ) : null
                      )
                    }
                  ]}
                  sortColumn={horsesSortColumn}
                  sortDirection={horsesSortDirection}
                  onSort={handleHorsesSort}
                  columnFilters={horsesColumnFilters}
                  onColumnFilterChange={handleHorsesColumnFilterChange}
                  pagination={{
                    page: horsesPage,
                    pageSize: 10,
                    totalItems: (() => {
                      let res = horses
                      if (horsesColumnFilters.name) res = res.filter(h => h.name.toLowerCase().includes(horsesColumnFilters.name.toLowerCase()))
                      if (horsesColumnFilters.breed) res = res.filter(h => `Giống: ${h.breed} | Màu: ${h.color}`.toLowerCase().includes(horsesColumnFilters.breed.toLowerCase()))
                      if (horsesColumnFilters.ownerId) res = res.filter(h => (h.ownerId?.fullName || 'Chủ ngựa').toLowerCase().includes(horsesColumnFilters.ownerId.toLowerCase()))
                      if (horsesColumnFilters.status) res = res.filter(h => h.status === horsesColumnFilters.status)
                      return res.length
                    })(),
                    onPageChange: setHorsesPage,
                    pageSizeOptions: [10, 20, 50]
                  }}
                />
              </div>
            )}
          </div>

          {/* Jockeys Directory */}
          <div className="card">
            <h2>Danh Sách Jockey (Kỵ sĩ)</h2>
            <p className="muted">Danh sách tất cả kỵ sĩ đã đăng ký hoạt động trong hệ thống kèm tỉ lệ thắng và kinh nghiệm.</p>

            {loading ? (
              <p className="muted">Đang tải...</p>
            ) : jockeys.length === 0 ? (
              <p className="muted">Chưa có kỵ sĩ nào đăng ký.</p>
            ) : (
              <div className="admin-table-wrapper w-full">
                <AnimatedTable
                  data={(() => {
                    let res = jockeys
                    // Filters
                    res = res.filter(j => {
                      if (jockeysColumnFilters.userId) {
                        const un = (j.userId?.fullName || 'Kỵ sĩ').toLowerCase()
                        if (!un.includes(jockeysColumnFilters.userId.toLowerCase())) return false
                      }
                      if (jockeysColumnFilters.experience && String(j.experience) !== jockeysColumnFilters.experience) return false
                      if (jockeysColumnFilters.status && j.status !== jockeysColumnFilters.status) return false
                      return true
                    })
                    // Sort
                    if (jockeysSortColumn && jockeysSortDirection) {
                      res.sort((a, b) => {
                        let aVal: any = a[jockeysSortColumn as keyof Jockey]
                        let bVal: any = b[jockeysSortColumn as keyof Jockey]
                        if (jockeysSortColumn === 'userId') {
                          aVal = a.userId?.fullName || ''
                          bVal = b.userId?.fullName || ''
                        }
                        if (typeof aVal === 'string' && typeof bVal === 'string') {
                          return jockeysSortDirection === 'asc' ? aVal.localeCompare(bVal, 'vi') : bVal.localeCompare(aVal, 'vi')
                        }
                        return jockeysSortDirection === 'asc' ? aVal - bVal : bVal - aVal
                      })
                    }
                    return res
                  })().slice((jockeysPage - 1) * 10, jockeysPage * 10)}
                  columns={[
                    {
                      id: 'userId',
                      header: 'Kỵ sĩ',
                      sortable: true,
                      filterable: true,
                      filterType: 'text',
                      cell: (row) => (
                        <div>
                          <div style={{ fontWeight: 600 }}>{row.userId?.fullName || 'Kỵ sĩ'}</div>
                          <div className="muted" style={{ fontSize: '12px' }}>{row.userId?.email} | 📞 {row.userId?.phone}</div>
                        </div>
                      )
                    },
                    {
                      id: 'experience',
                      header: 'Kinh nghiệm',
                      sortable: true,
                      filterable: true,
                      filterType: 'text',
                      cell: (row) => <span>{row.experience} năm</span>
                    },
                    {
                      id: 'winRate',
                      header: 'Tỉ lệ thắng (Win Rate)',
                      sortable: true,
                      cell: (row) => <span style={{ fontWeight: 600, color: 'var(--primary)' }}>{row.winRate}%</span>
                    },
                    {
                      id: 'races',
                      header: 'Số trận đã tham gia',
                      sortable: true,
                      cell: (row) => <span>{row.races} trận</span>
                    },
                    {
                      id: 'wins',
                      header: 'Số trận thắng',
                      sortable: true,
                      cell: (row) => <span>{row.wins} trận</span>
                    },
                    {
                      id: 'specialties',
                      header: 'Sở trường',
                      cell: (row) => (
                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                          {row.specialties?.map((s: string) => (
                            <span key={s} className="badge badge-scheduled" style={{ fontSize: '10px', padding: '2px 6px' }}>{s}</span>
                          ))}
                        </div>
                      )
                    },
                    {
                      id: 'status',
                      header: 'Trạng thái',
                      sortable: true,
                      filterable: true,
                      filterType: 'select',
                      filterOptions: [
                        { label: 'Sẵn sàng', value: 'AVAILABLE' },
                        { label: 'Không sẵn sàng', value: 'UNAVAILABLE' },
                      ],
                      cell: (row) => (
                        <span className={`badge ${row.status === 'AVAILABLE' ? 'badge-approved' : 'badge-rejected'}`}>
                          {row.status === 'AVAILABLE' ? 'Sẵn sàng' : row.status === 'UNAVAILABLE' ? 'Không sẵn sàng' : row.status}
                        </span>
                      )
                    }
                  ]}
                  sortColumn={jockeysSortColumn}
                  sortDirection={jockeysSortDirection}
                  onSort={handleJockeysSort}
                  columnFilters={jockeysColumnFilters}
                  onColumnFilterChange={handleJockeysColumnFilterChange}
                  pagination={{
                    page: jockeysPage,
                    pageSize: 10,
                    totalItems: (() => {
                      let res = jockeys
                      if (jockeysColumnFilters.userId) res = res.filter(j => (j.userId?.fullName || 'Kỵ sĩ').toLowerCase().includes(jockeysColumnFilters.userId.toLowerCase()))
                      if (jockeysColumnFilters.experience) res = res.filter(j => String(j.experience) === jockeysColumnFilters.experience)
                      if (jockeysColumnFilters.status) res = res.filter(j => j.status === jockeysColumnFilters.status)
                      return res.length
                    })(),
                    onPageChange: setJockeysPage,
                    pageSizeOptions: [10, 20, 50]
                  }}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------
          TAB 4: REFEREE & RESULTS PUBLISHING
          --------------------------------------------------------- */}
      {activeTab === 'referee-results' && (
        <div className="card">
          <h2>Phân Công Trọng Tài & Công Bố Kết Quả</h2>
          <p className="muted">Lựa chọn trọng tài điều khiển trận đấu và công bố kết quả chung cuộc kèm tiền thưởng của các cuộc đua.</p>

          {loading ? (
            <p className="muted">Đang tải...</p>
          ) : races.length === 0 ? (
            <p className="muted">Chưa có cuộc đua nào được tạo.</p>
          ) : (
              <div className="admin-table-wrapper w-full">
                <AnimatedTable
                  data={(() => {
                    let res = races
                    // Filters
                    res = res.filter(r => {
                      if (refRacesColumnFilters.name) {
                        const n = (r.name || '').toLowerCase()
                        if (!n.includes(refRacesColumnFilters.name.toLowerCase())) return false
                      }
                      if (refRacesColumnFilters.status && r.status !== refRacesColumnFilters.status) return false
                      if (refRacesColumnFilters.refereeId) {
                        const refName = (typeof r.refereeId === 'object' ? r.refereeId.fullName : r.refereeId || '').toLowerCase()
                        if (!refName.includes(refRacesColumnFilters.refereeId.toLowerCase())) return false
                      }
                      return true
                    })
                    // Sort
                    if (refRacesSortColumn && refRacesSortDirection) {
                      res.sort((a, b) => {
                        let aVal: any = a[refRacesSortColumn as keyof Race]
                        let bVal: any = b[refRacesSortColumn as keyof Race]
                        if (refRacesSortColumn === 'name') {
                          aVal = a.name || ''
                          bVal = b.name || ''
                        } else if (refRacesSortColumn === 'scheduledAt') {
                          aVal = a.scheduledAt ? new Date(a.scheduledAt).getTime() : 0
                          bVal = b.scheduledAt ? new Date(b.scheduledAt).getTime() : 0
                        } else if (refRacesSortColumn === 'refereeId') {
                          aVal = typeof a.refereeId === 'object' ? a.refereeId.fullName : a.refereeId || ''
                          bVal = typeof b.refereeId === 'object' ? b.refereeId.fullName : b.refereeId || ''
                        }
                        if (typeof aVal === 'string' && typeof bVal === 'string') {
                          return refRacesSortDirection === 'asc' ? aVal.localeCompare(bVal, 'vi') : bVal.localeCompare(aVal, 'vi')
                        }
                        return refRacesSortDirection === 'asc' ? aVal - bVal : bVal - aVal
                      })
                    }
                    return res
                  })().slice((refRacesPage - 1) * 10, refRacesPage * 10)}
                  columns={[
                    {
                      id: 'name',
                      header: 'Giải đấu / Cuộc đua',
                      sortable: true,
                      filterable: true,
                      filterType: 'text',
                      cell: (row) => (
                        <div>
                          <div style={{ fontWeight: 600 }}>{row.name}</div>
                          <div className="muted" style={{ fontSize: '12px' }}>Giải: {typeof row.tournamentId === 'object' ? row.tournamentId.name : 'Giải đấu'}</div>
                        </div>
                      )
                    },
                    {
                      id: 'distance',
                      header: 'Cự ly',
                      sortable: true,
                      cell: (row) => <span>{row.distance}m</span>
                    },
                    {
                      id: 'scheduledAt',
                      header: 'Ngày giờ thi đấu',
                      sortable: true,
                      cell: (row) => <span>{new Date(row.scheduledAt).toLocaleString('vi-VN')}</span>
                    },
                    {
                      id: 'status',
                      header: 'Trạng thái',
                      sortable: true,
                      filterable: true,
                      filterType: 'select',
                      filterOptions: [
                        { label: 'Đã lên lịch', value: 'SCHEDULED' },
                        { label: 'Đang diễn ra', value: 'ONGOING' },
                        { label: 'Xác nhận kết quả', value: 'RESULT_CONFIRMED' },
                        { label: 'Kết thúc', value: 'COMPLETED' },
                        { label: 'Đã hủy', value: 'CANCELLED' },
                      ],
                      cell: (row) => (
                        <span className={`badge ${row.status === 'COMPLETED' || row.status === 'RESULT_CONFIRMED' ? 'badge-approved' : row.status === 'ONGOING' ? 'badge-ongoing' : row.status === 'CANCELLED' ? 'badge-rejected' : 'badge-scheduled'}`}>
                          {row.status === 'COMPLETED' ? 'Kết thúc' : row.status === 'RESULT_CONFIRMED' ? 'Xác nhận kết quả' : row.status === 'ONGOING' ? 'Đang diễn ra' : row.status === 'CANCELLED' ? 'Đã hủy' : row.status === 'SCHEDULED' ? 'Đã lên lịch' : row.status}
                        </span>
                      )
                    },
                    {
                      id: 'refereeId',
                      header: 'Trọng tài phụ trách',
                      sortable: true,
                      filterable: true,
                      filterType: 'text',
                      cell: (row) => (
                        row.refereeId ? (
                          <div className="flex items-center gap-1" style={{ fontWeight: 600 }}>
                            <UserIcon className="w-3.5 h-3.5 text-muted shrink-0" />
                            <span>{typeof row.refereeId === 'object' ? row.refereeId.fullName : row.refereeId}</span>
                          </div>
                        ) : (
                          <span className="danger-text flex items-center gap-1">
                            <AlertTriangle className="w-3.5 h-3.5 text-red-500 shrink-0" />
                            <span>Chưa có trọng tài</span>
                          </span>
                        )
                      )
                    },
                    {
                      id: 'actions',
                      header: 'Hành động',
                      align: 'right',
                      cell: (row) => (
                        <div style={{ display: 'inline-flex', gap: 6, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                          {row.status === 'SCHEDULED' && (
                            <>
                              <button type="button" className="btn" style={{ fontSize: '12px', padding: '5px 8px' }} onClick={() => openRefModal(row.id, row.refereeId && typeof row.refereeId === 'object' ? row.refereeId._id : row.refereeId)}>
                                Phân trọng tài
                              </button>
                              <button className="btn btnPrimary" style={{ fontSize: '12px', padding: '5px 8px' }} onClick={() => openSchedModal(row)}>
                                Lập lịch (Schedule)
                              </button>
                            </>
                          )}
                          {row.status === 'ONGOING' && (
                            <button className="btn btnPrimary" style={{ fontSize: '12px', padding: '5px 8px' }} onClick={() => openResultModal(row)}>
                              Công bố kết quả
                            </button>
                          )}
                          {row.status === 'RESULT_CONFIRMED' && (
                            <button className="btn btnPrimary" style={{ fontSize: '12px', padding: '5px 8px' }} onClick={() => openResultModal(row)}>
                              Công bố kết quả
                            </button>
                          )}
                          {row.status === 'COMPLETED' && (
                            <>
                              <button className="btn btnPrimary" style={{ fontSize: '12px', padding: '5px 8px' }} onClick={() => openResultModal(row)}>
                                Công bố lại kết quả
                              </button>
                              <button className="btn btnPrimary" style={{ fontSize: '12px', padding: '5px 8px' }} onClick={() => handleSettlePredictions(row.id)}>
                                Trả thưởng cược
                              </button>
                            </>
                          )}
                        </div>
                      )
                    }
                  ]}
                  sortColumn={refRacesSortColumn}
                  sortDirection={refRacesSortDirection}
                  onSort={handleRefRacesSort}
                  columnFilters={refRacesColumnFilters}
                  onColumnFilterChange={handleRefRacesColumnFilterChange}
                  pagination={{
                    page: refRacesPage,
                    pageSize: 10,
                    totalItems: (() => {
                      let res = races
                      if (refRacesColumnFilters.name) res = res.filter(r => (r.name || '').toLowerCase().includes(refRacesColumnFilters.name.toLowerCase()))
                      if (refRacesColumnFilters.status) res = res.filter(r => r.status === refRacesColumnFilters.status)
                      if (refRacesColumnFilters.refereeId) res = res.filter(r => (typeof r.refereeId === 'object' ? r.refereeId.fullName : r.refereeId || '').toLowerCase().includes(refRacesColumnFilters.refereeId.toLowerCase()))
                      return res.length
                    })(),
                    onPageChange: setRefRacesPage,
                    pageSizeOptions: [10, 20, 50]
                  }}
                />
              </div>
          )}
        </div>
      )}

      {/* ---------------------------------------------------------
          TAB 5: PREDICTIONS (BETTING CONTROL)
          --------------------------------------------------------- */}
      {activeTab === 'predictions' && (
        <div className="card">
          <h2>Thống Kê Dự Đoán Cuộc Đua</h2>
          <p className="muted">Theo dõi số liệu thống kê dự đoán (tổng cược, trả thưởng, lợi nhuận) của từng cuộc đua. Đóng cổng cược trước khi trận đấu bắt đầu và tiến hành trả thưởng sau khi có kết quả.</p>

          <div style={{ marginTop: 16 }}>
            <h3 style={{ fontSize: '16px', marginBottom: 12 }}>Thống kê tổng hợp theo cuộc đua:</h3>
            <PredictionRaceList
              predictions={predictions}
              onClosePred={handleClosePredictions}
              onSettlePred={handleSettlePredictions}
              onViewStats={handleViewPredictionStats}
              onOpenResultModal={openResultModal}
              lastModifiedRaceId={lastModifiedRaceId}
            />
          </div>

          <div style={{ marginTop: 36 }}>
            <h3 style={{ fontSize: '16px', marginBottom: 16 }}>Các giao dịch dự đoán gần đây:</h3>
            
            {/* Filter Bar */}
            <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', marginBottom: 24 }}>
              <div className="form-group" style={{ margin: 0, minWidth: '220px', flex: 1.5 }}>
                <input
                  type="text"
                  placeholder="🔍 Tìm khán giả (tên hoặc email)..."
                  value={filterPredSearch}
                  onChange={(e) => setFilterPredSearch(e.target.value)}
                  style={{ padding: '8px 12px', fontSize: '13px' }}
                />
              </div>
              <div className="form-group" style={{ margin: 0, minWidth: '160px' }}>
                <select
                  value={filterPredStatus}
                  onChange={(e) => setFilterPredStatus(e.target.value)}
                  style={{ padding: '8px 12px', fontSize: '13px' }}
                >
                  <option value="ALL">Tất cả trạng thái</option>
                  <option value="PENDING">Chờ xử lý (Pending)</option>
                  <option value="CLOSED">Đã đóng cổng (Closed)</option>
                  <option value="WON">Thắng cược (Won)</option>
                  <option value="LOST">Thua cược (Lost)</option>
                </select>
              </div>
              <div className="form-group" style={{ margin: 0, minWidth: '220px', flex: 1.5 }}>
                <select
                  value={filterPredRace}
                  onChange={(e) => setFilterPredRace(e.target.value)}
                  style={{ padding: '8px 12px', fontSize: '13px' }}
                >
                  <option value="ALL">Tất cả cuộc đua</option>
                  {races.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} ({typeof r.tournamentId === 'object' ? r.tournamentId?.name : 'Giải đấu'})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {loading ? (
              <p className="muted">Đang tải...</p>
            ) : filteredPredictions.length === 0 ? (
              <p className="muted">Không tìm thấy lượt dự đoán nào phù hợp.</p>
            ) : (
              <div className="admin-table-wrapper w-full">
                <AnimatedTable
                  data={(() => {
                    let res = filteredPredictions
                    // Column Filters
                    res = res.filter(p => {
                      if (predColumnFilters.spectatorId) {
                        const spName = (p.spectatorId?.fullName || p.spectatorId?.name || 'Khán giả').toLowerCase()
                        if (!spName.includes(predColumnFilters.spectatorId.toLowerCase())) return false
                      }
                      if (predColumnFilters.raceId) {
                        const rName = (p.raceId?.name || 'Cuộc đua').toLowerCase()
                        if (!rName.includes(predColumnFilters.raceId.toLowerCase())) return false
                      }
                      if (predColumnFilters.horseId) {
                        const hName = (p.horseId?.name || 'Ngựa').toLowerCase()
                        if (!hName.includes(predColumnFilters.horseId.toLowerCase())) return false
                      }
                      if (predColumnFilters.status && p.status !== predColumnFilters.status) return false
                      return true
                    })

                    // Sort
                    if (predSortColumn && predSortDirection) {
                      res.sort((a, b) => {
                        let aVal: any = a[predSortColumn as keyof Prediction]
                        let bVal: any = b[predSortColumn as keyof Prediction]
                        if (predSortColumn === 'spectatorId') {
                          aVal = a.spectatorId?.fullName || a.spectatorId?.name || ''
                          bVal = b.spectatorId?.fullName || b.spectatorId?.name || ''
                        } else if (predSortColumn === 'raceId') {
                          aVal = a.raceId?.name || ''
                          bVal = b.raceId?.name || ''
                        } else if (predSortColumn === 'horseId') {
                          aVal = a.horseId?.name || ''
                          bVal = b.horseId?.name || ''
                        } else if (predSortColumn === 'createdAt') {
                          aVal = a.createdAt ? new Date(a.createdAt).getTime() : 0
                          bVal = b.createdAt ? new Date(b.createdAt).getTime() : 0
                        }

                        if (typeof aVal === 'string' && typeof bVal === 'string') {
                          return predSortDirection === 'asc' ? aVal.localeCompare(bVal, 'vi') : bVal.localeCompare(aVal, 'vi')
                        }
                        return predSortDirection === 'asc' ? aVal - bVal : bVal - aVal
                      })
                    }
                    return res
                  })().slice((predPage - 1) * 10, predPage * 10)}
                  columns={[
                    {
                      id: 'spectatorId',
                      header: 'Khán giả',
                      sortable: true,
                      filterable: true,
                      filterType: 'text',
                      cell: (row) => (
                        <div>
                          <div style={{ fontWeight: 600 }}>{row.spectatorId?.fullName || row.spectatorId?.name || 'Khán giả'}</div>
                          <div className="muted" style={{ fontSize: '12px' }}>{row.spectatorId?.email}</div>
                        </div>
                      )
                    },
                    {
                      id: 'raceId',
                      header: 'Cuộc đua',
                      sortable: true,
                      filterable: true,
                      filterType: 'text',
                      cell: (row) => <span>{row.raceId?.name || 'Cuộc đua'}</span>
                    },
                    {
                      id: 'horseId',
                      header: 'Ngựa lựa chọn',
                      sortable: true,
                      filterable: true,
                      filterType: 'text',
                      cell: (row) => <span style={{ fontWeight: 600 }}>{row.horseId?.name || 'Ngựa'}</span>
                    },
                    {
                      id: 'betAmount',
                      header: 'Số tiền đặt cược (VND)',
                      sortable: true,
                      cell: (row) => <span>{row.betAmount?.toLocaleString('vi-VN')} VND</span>
                    },
                    {
                      id: 'prizeAmount',
                      header: 'Tiền thưởng có thể nhận',
                      sortable: true,
                      cell: (row) => (
                        <span style={{ color: 'var(--primary)', fontWeight: 600 }}>
                          {row.prizeAmount?.toLocaleString('vi-VN')} VND
                        </span>
                      )
                    },
                    {
                      id: 'status',
                      header: 'Trạng thái',
                      sortable: true,
                      filterable: true,
                      filterType: 'select',
                      filterOptions: [
                        { label: 'Chờ xử lý', value: 'PENDING' },
                        { label: 'Đã đóng', value: 'CLOSED' },
                        { label: 'Thắng cược', value: 'WON' },
                        { label: 'Thua cược', value: 'LOST' },
                      ],
                      cell: (row) => (
                        <span className={`badge ${row.status === 'WON' ? 'badge-approved' : row.status === 'LOST' ? 'badge-rejected' : row.status === 'CLOSED' ? 'badge-inactive' : 'badge-pending'}`}>
                          {row.status === 'WON' ? 'Thắng cược' : row.status === 'LOST' ? 'Thua cược' : row.status === 'CLOSED' ? 'Đã đóng' : row.status === 'PENDING' ? 'Chờ xử lý' : row.status}
                        </span>
                      )
                    },
                    {
                      id: 'createdAt',
                      header: 'Ngày đặt',
                      sortable: true,
                      cell: (row) => <span>{row.createdAt ? new Date(row.createdAt).toLocaleDateString('vi-VN') : ''}</span>
                    }
                  ]}
                  sortColumn={predSortColumn}
                  sortDirection={predSortDirection}
                  onSort={handlePredSort}
                  columnFilters={predColumnFilters}
                  onColumnFilterChange={handlePredColumnFilterChange}
                  pagination={{
                    page: predPage,
                    pageSize: 10,
                    totalItems: (() => {
                      let res = filteredPredictions
                      if (predColumnFilters.spectatorId) res = res.filter(p => (p.spectatorId?.fullName || p.spectatorId?.name || 'Khán giả').toLowerCase().includes(predColumnFilters.spectatorId.toLowerCase()))
                      if (predColumnFilters.raceId) res = res.filter(p => (p.raceId?.name || 'Cuộc đua').toLowerCase().includes(predColumnFilters.raceId.toLowerCase()))
                      if (predColumnFilters.horseId) res = res.filter(p => (p.horseId?.name || 'Ngựa').toLowerCase().includes(predColumnFilters.horseId.toLowerCase()))
                      if (predColumnFilters.status) res = res.filter(p => p.status === predColumnFilters.status)
                      return res.length
                    })(),
                    onPageChange: setPredPage,
                    pageSizeOptions: [10, 20, 50]
                  }}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------
          MODALS
          --------------------------------------------------------- */}

      {/* Confirm Draft Modal */}
      {showConfirmDraftModal && (
        <div className="modal-overlay" onClick={() => setShowConfirmDraftModal(false)} style={{ backdropFilter: 'blur(8px)', backgroundColor: 'rgba(0,0,0,0.6)' }}>
          <div className="modal overflow-hidden p-0 animate-scale-in" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px', background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '20px' }}>
            <div className="modal-header border-b border-white/[0.05] p-6 relative bg-gradient-to-r from-blue-500/10 to-transparent">
              <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 mb-4 ring-4 ring-blue-500/10">
                <ClipboardList className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-black text-[var(--text)] m-0 tracking-tight">Xác nhận phân bổ bảng đấu</h2>
              <button className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/[0.1] text-slate-400 hover:text-white transition-colors" onClick={() => setShowConfirmDraftModal(false)}>✕</button>
            </div>
            
            <div className="p-6">
              <p className="text-slate-300 text-base mb-6">Bạn có chắc chắn muốn chốt kết quả phân bổ này?</p>
              
              <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-5 mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-slate-400 font-medium">Tổng số ngựa phân bổ</span>
                  <span className="text-2xl font-black text-blue-400">{Object.keys(draftApprovals).length}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-300 mt-3">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  Ngựa sẽ được chia thành các bảng (Heats) mới với cổng chạy ngẫu nhiên.
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-200/80 text-sm">
                <AlertTriangle className="w-5 h-5 shrink-0 text-amber-500 mt-0.5" />
                <p className="m-0 leading-relaxed">
                  <strong className="text-amber-500 block mb-1">Lưu ý quan trọng:</strong>
                  Hành động này sẽ thay thế hoàn toàn các vòng đấu cũ (nếu có) bằng các Bảng đấu (A, B, C...) mới trong hệ thống.
                </p>
              </div>
            </div>

            <div className="flex gap-3 p-6 pt-0 mt-2">
              <button className="flex-1 h-11 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-slate-300 font-bold transition-colors" onClick={() => setShowConfirmDraftModal(false)} disabled={confirmDraftLoading}>
                Hủy
              </button>
              <button className="flex-1 h-11 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold transition-all shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:shadow-[0_0_25px_rgba(59,130,246,0.5)] flex items-center justify-center gap-2" onClick={confirmDraftAssignments} disabled={confirmDraftLoading}>
                {confirmDraftLoading ? (
                  <><span className="spinner w-4 h-4 border-2"></span> Đang xử lý...</>
                ) : (
                  <>Xác nhận phân bổ</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 1. Tournament Modal */}
      {showTournModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-500" />
                <span>{selectedTourn ? 'Chỉnh sửa Giải đấu' : 'Thêm Giải đấu mới'}</span>
              </h3>
              <button className="modal-close" onClick={() => setShowTournModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSaveTourn}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Tên giải đấu</label>
                  <input type="text" required value={tournForm.name} onChange={(e) => setTournForm({ ...tournForm, name: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Mô tả giải đấu</label>
                  <input type="text" value={tournForm.description} onChange={(e) => setTournForm({ ...tournForm, description: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Địa điểm tổ chức (Venue)</label>
                  <input type="text" required value={tournForm.venue} onChange={(e) => setTournForm({ ...tournForm, venue: e.target.value })} />
                </div>
                <div className="grid-2">
                  <div className="form-group">
                    <label>Ngày bắt đầu</label>
                    <DatePicker 
                      selected={tournForm.startDate ? new Date(tournForm.startDate) : null}
                      onChange={(date: Date | null) => setTournForm({ ...tournForm, startDate: date ? format(date, "yyyy-MM-dd") : '' })}
                      dateFormat="dd/MM/yyyy"
                      className="w-full h-[42px] px-3 rounded-lg border border-[rgba(255,255,255,0.08)] bg-[var(--surface-2)] text-sm font-medium outline-none focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/10 transition-all text-white"
                      placeholderText="dd/mm/yyyy"
                    />
                  </div>
                  <div className="form-group">
                    <label>Ngày kết thúc</label>
                    <DatePicker 
                      selected={tournForm.endDate ? new Date(tournForm.endDate) : null}
                      onChange={(date: Date | null) => setTournForm({ ...tournForm, endDate: date ? format(date, "yyyy-MM-dd") : '' })}
                      dateFormat="dd/MM/yyyy"
                      className="w-full h-[42px] px-3 rounded-lg border border-[rgba(255,255,255,0.08)] bg-[var(--surface-2)] text-sm font-medium outline-none focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/10 transition-all text-white"
                      placeholderText="dd/mm/yyyy"
                    />
                  </div>
                </div>
                <div className="grid-2">
                  <div className="form-group">
                    <label>Tổng tiền thưởng (VND)</label>
                    <input type="number" required value={tournForm.prizePool} onChange={(e) => setTournForm({ ...tournForm, prizePool: parseInt(e.target.value) })} />
                  </div>
                  <div className="form-group">
                    <label>Số ngựa tối đa</label>
                    <select value={tournForm.maxHorses} onChange={(e) => setTournForm({ ...tournForm, maxHorses: parseInt(e.target.value) })}>
                      <option value="4">4 ngựa</option>
                      <option value="8">8 ngựa</option>
                      <option value="16">16 ngựa</option>
                      <option value="32">32 ngựa</option>
                      <option value="64">64 ngựa</option>
                    </select>
                  </div>
                </div>
                <div className="grid-2">
                  <div className="form-group">
                    <label>Số ngựa tối thiểu</label>
                    <input type="number" required value={tournForm.minHorses} onChange={(e) => setTournForm({ ...tournForm, minHorses: parseInt(e.target.value) })} min="4" />
                  </div>
                  <div className="form-group">
                    <label>Phương thức ghép cặp</label>
                    <select value={tournForm.pairingMethod} onChange={(e) => setTournForm({ ...tournForm, pairingMethod: e.target.value })}>
                      <option value="RANDOM">Ngẫu nhiên (Random)</option>
                      <option value="SEEDED">Xếp hạt giống (Seeded)</option>
                    </select>
                  </div>
                </div>
                <div className="grid-2">
                  <div className="form-group">
                    <label>Ngày đóng đăng ký</label>
                    <DatePicker 
                      selected={tournForm.registrationCloseDate ? new Date(tournForm.registrationCloseDate) : null}
                      onChange={(date: Date | null) => setTournForm({ ...tournForm, registrationCloseDate: date ? date.toISOString() : '' })}
                      showTimeSelect
                      timeFormat="HH:mm"
                      dateFormat="dd/MM/yyyy HH:mm"
                      className="w-full h-[42px] px-3 rounded-lg border border-[rgba(255,255,255,0.08)] bg-[var(--surface-2)] text-sm font-medium outline-none focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/10 transition-all text-white"
                      placeholderText="dd/mm/yyyy --:--"
                    />
                  </div>
                  <div className="form-group"></div>
                </div>
                <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input type="checkbox" id="hasThirdPlace" checked={tournForm.hasThirdPlaceMatch} onChange={(e) => setTournForm({ ...tournForm, hasThirdPlaceMatch: e.target.checked })} />
                  <label htmlFor="hasThirdPlace" style={{ marginBottom: 0 }}>Tổ chức trận tranh hạng ba</label>
                </div>
                <div className="form-group">
                  <label>Trạng thái giải đấu</label>
                  <select value={tournForm.status} onChange={(e) => setTournForm({ ...tournForm, status: e.target.value })}>
                    <option value="DRAFT">Bản nháp (DRAFT)</option>
                    <option value="PUBLISHED">Đã công bố (PUBLISHED)</option>
                    <option value="REGISTRATION_CLOSED">Đã đóng đăng ký (REGISTRATION_CLOSED)</option>
                    <option value="BRACKET_GENERATED">Đã chia bảng (BRACKET_GENERATED)</option>
                    <option value="ONGOING">Đang diễn ra (ONGOING)</option>
                    <option value="COMPLETED">Đã kết thúc (COMPLETED)</option>
                    <option value="CANCELLED">Đã hủy (CANCELLED)</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn" onClick={() => setShowTournModal(false)}>Hủy</button>
                <button type="submit" className="btn btnPrimary">Lưu</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Race Modal */}
      {showRaceModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="flex items-center gap-2">
                <Flag className="w-5 h-5 text-emerald-500" />
                <span>{selectedRace ? 'Chỉnh sửa Cuộc đua' : 'Thêm Cuộc đua mới'}</span>
              </h3>
              <button className="modal-close" onClick={() => setShowRaceModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSaveRace}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Tên cuộc đua / Vòng đấu</label>
                  <select required value={raceForm.name} onChange={(e) => setRaceForm({ ...raceForm, name: e.target.value })}>
                    <option value="">-- Chọn vòng đấu --</option>
                    <option value="Vòng bảng">Vòng bảng</option>
                    <option value="Vòng tứ kết">Vòng tứ kết</option>
                    <option value="Vòng bán kết">Vòng bán kết</option>
                    <option value="Vòng chung kết">Vòng chung kết</option>
                  </select>
                </div>
                <div className="grid-2">
                  <div className="form-group">
                    <label>Cự ly (Meters)</label>
                    <input type="number" required step={100} value={raceForm.distance} onChange={(e) => setRaceForm({ ...raceForm, distance: parseInt(e.target.value) })} />
                  </div>
                  <div className="form-group">
                    <label>Số ngựa tối đa</label>
                    <input type="number" required value={raceForm.maxHorses} onChange={(e) => setRaceForm({ ...raceForm, maxHorses: parseInt(e.target.value) })} />
                  </div>
                </div>
                <div className="form-group">
                  <label>Ngày giờ bắt đầu</label>
                  <input type="datetime-local" required value={raceForm.scheduledAt} onChange={(e) => setRaceForm({ ...raceForm, scheduledAt: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Trọng tài điều hành (Tùy chọn)</label>
                  <select value={raceForm.refereeId || ''} onChange={(e) => setRaceForm({ ...raceForm, refereeId: e.target.value })}>
                    <option value="">-- Chưa phân công --</option>
                    {referees.map((ref) => (
                      <option key={ref.id} value={ref.id}>
                        {ref.name} ({ref.email})
                      </option>
                    ))}
                  </select>
                </div>
                <h4 style={{ margin: '14px 0 8px', fontSize: '14px', borderBottom: '1px solid var(--border)', paddingBottom: '4px' }}>Cơ cấu giải thưởng (VND)</h4>
                <div className="grid-3">
                  <div className="form-group">
                    <label>Giải Nhất</label>
                    <input type="number" value={raceForm.prizeFirst} onChange={(e) => setRaceForm({ ...raceForm, prizeFirst: parseInt(e.target.value) })} />
                  </div>
                  <div className="form-group">
                    <label>Giải Nhì</label>
                    <input type="number" value={raceForm.prizeSecond} onChange={(e) => setRaceForm({ ...raceForm, prizeSecond: parseInt(e.target.value) })} />
                  </div>
                  <div className="form-group">
                    <label>Giải Ba</label>
                    <input type="number" value={raceForm.prizeThird} onChange={(e) => setRaceForm({ ...raceForm, prizeThird: parseInt(e.target.value) })} />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn" onClick={() => setShowRaceModal(false)}>Hủy</button>
                <button type="submit" className="btn btnPrimary">Lưu</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Schedule Link Modal */}
      {showSchedModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-500" />
                <span>Lập Lịch Cuộc Đua</span>
              </h3>
              <button className="modal-close" onClick={() => setShowSchedModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSaveSched}>
              <div className="modal-body">
                <p className="muted" style={{ marginBottom: 14 }}>Tạo bản ghi lịch trình chung để các Jockey và Chủ ngựa có thể theo dõi và rút/xác nhận ngựa của họ.</p>
                <div className="form-group">
                  <label>Tên cuộc đua</label>
                  <input type="text" readOnly value={schedForm.raceName} />
                </div>
                <div className="grid-2">
                  <div className="form-group">
                    <label>Địa điểm</label>
                    <input type="text" required value={schedForm.location} onChange={(e) => setSchedForm({ ...schedForm, location: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>Thời gian</label>
                    <input type="text" readOnly value={new Date(schedForm.scheduledTime).toLocaleString('vi-VN')} />
                  </div>
                </div>
                <div className="grid-3">
                  <div className="form-group">
                    <label>Cự ly (m)</label>
                    <input type="number" readOnly value={schedForm.distance} />
                  </div>
                  <div className="form-group">
                    <label>Số ngựa tối đa</label>
                    <input type="number" readOnly value={schedForm.maxParticipants} />
                  </div>
                  <div className="form-group">
                    <label>Quỹ thưởng (VND)</label>
                    <input type="number" readOnly value={schedForm.prizePool} />
                  </div>
                </div>
                <div className="grid-2">
                  <div className="form-group">
                    <label>Loại hình đua</label>
                    <select value={schedForm.raceType} onChange={(e) => setSchedForm({ ...schedForm, raceType: e.target.value })}>
                      <option value="SPRINT">Sprint (Đua tốc độ)</option>
                      <option value="LONG_DISTANCE">Long Distance (Đua đường dài)</option>
                      <option value="HANDICAP">Handicap (Đua chấp)</option>
                      <option value="STEEPLECHASE">Steeplechase (Đua vượt chướng ngại vật)</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Tình trạng đường đua</label>
                    <select value={schedForm.trackCondition} onChange={(e) => setSchedForm({ ...schedForm, trackCondition: e.target.value })}>
                      <option value="GOOD">Good (Tốt, khô ráo)</option>
                      <option value="YIELDING">Yielding (Ẩm nhẹ)</option>
                      <option value="SOFT">Soft (Mềm, trơn nhẹ)</option>
                      <option value="HEAVY">Heavy (Sũng nước, lầy)</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn" onClick={() => setShowSchedModal(false)}>Hủy</button>
                <button type="submit" className="btn btnPrimary">Tạo lịch thi đấu</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. Assign Referee Modal */}
      {showRefModal && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowRefModal(false) }}>
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="flex items-center gap-2">
                <Scale className="w-5 h-5 text-blue-500" />
                <span>Phân Công Trọng Tài</span>
              </h3>
              <button className="modal-close" onClick={() => setShowRefModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Chọn Trọng tài điều hành trận đấu</label>
                <select value={selectedRefId} onChange={(e) => setSelectedRefId(e.target.value)}>
                  <option value="">-- Lựa chọn trọng tài --</option>
                  {referees.map((ref) => (
                    <option key={ref.id} value={ref.id}>
                      {ref.name} ({ref.email})
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn" onClick={() => setShowRefModal(false)}>Hủy</button>
              <button className="btn btnPrimary" onClick={handleSaveReferee}>Lưu phân công</button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Publish Results Modal */}
      {showResultModal && resultRace && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowResultModal(false) }}>
          <div className="modal-content modal-content-lg">
            <div className="modal-header">
              <h3 className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-500" />
                <span>Công bố Kết quả: {resultRace.name}</span>
              </h3>
              <button className="modal-close" onClick={() => setShowResultModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <p className="muted" style={{ marginBottom: 12 }}>Vui lòng thiết lập vị trí về đích, thời gian hoàn thành và giải thưởng thực tế cho từng chú ngựa tham gia.</p>

              {raceHorses.length === 0 ? (
                <p className="danger-text">Cảnh báo: Không có ngựa nào được xác nhận tham gia cuộc đua này!</p>
              ) : (
                <div className="admin-table-wrapper" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Tên ngựa</th>
                        <th style={{ width: '90px' }}>Thứ hạng</th>
                        <th style={{ width: '120px' }}>Thời gian về đích (s)</th>
                        <th>Trạng thái</th>
                        <th>Tiền thưởng (VND)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {resultRankings.map((rank, idx) => {
                        const horseObj = raceHorses.find(
                          (rh: any) => (rh.horse?._id || rh.horse?.id) === rank.horseId
                        )
                        return (
                          <tr key={rank.horseId}>
                            <td style={{ fontWeight: 600 }}>{horseObj?.horse?.name || 'Ngựa thi đấu'}</td>
                            <td>
                              <input
                                type="number"
                                min="1"
                                max={raceHorses.length}
                                value={rank.position}
                                onChange={(e) => {
                                  const updated = [...resultRankings]
                                  updated[idx].position = parseInt(e.target.value)
                                  setResultRankings(updated)
                                }}
                              />
                            </td>
                            <td>
                              <input
                                type="number"
                                step="0.01"
                                value={rank.finishTime}
                                onChange={(e) => {
                                  const updated = [...resultRankings]
                                  updated[idx].finishTime = parseFloat(e.target.value)
                                  setResultRankings(updated)
                                }}
                              />
                            </td>
                            <td>
                              <select
                                value={rank.status}
                                onChange={(e) => {
                                  const updated = [...resultRankings]
                                  updated[idx].status = e.target.value
                                  setResultRankings(updated)
                                }}
                              >
                                <option value="FINISHED">FINISHED</option>
                                <option value="DISQUALIFIED">DISQUALIFIED</option>
                                <option value="DNF">DNF (Bỏ cuộc)</option>
                              </select>
                            </td>
                            <td>
                              <input
                                type="number"
                                value={rank.prizeAmount}
                                onChange={(e) => {
                                  const updated = [...resultRankings]
                                  updated[idx].prizeAmount = parseInt(e.target.value)
                                  setResultRankings(updated)
                                }}
                              />
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="form-group" style={{ marginTop: 16 }}>
                <label>Ghi chú chung của cuộc đua</label>
                <textarea
                  style={{ width: '100%', height: '70px', padding: '8px', border: '1px solid var(--border)', borderRadius: '8px' }}
                  placeholder="Ghi chú về thời tiết, sự cố..."
                  value={resultNotes}
                  onChange={(e) => setResultNotes(e.target.value)}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn" onClick={() => setShowResultModal(false)}>Hủy</button>
              <button className="btn btnPrimary" disabled={raceHorses.length === 0} onClick={handleSaveResult}>Công bố kết quả</button>
            </div>
          </div>
        </div>
      )}

      {/* 6. Prediction Stats Modal */}
      {showPredStatsModal && predStats && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowPredStatsModal(false) }}>
          <div className="modal-content">
            <div className="modal-header">
              <h3>📊 Thống Kê Dự Đoán Cuộc Đua</h3>
              <button className="modal-close" onClick={() => setShowPredStatsModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="flex-between" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '8px', marginBottom: '12px' }}>
                <div>Tổng số lượt dự đoán:</div>
                <div style={{ fontWeight: 700, fontSize: '18px' }}>{predStats.totalPredictions || 0}</div>
              </div>
              <div className="flex-between" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '8px', marginBottom: '12px' }}>
                <div>Tổng số tiền đặt cược:</div>
                <div style={{ fontWeight: 700, fontSize: '18px', color: 'var(--primary)' }}>
                  {(predStats.totalPool || 0).toLocaleString('vi-VN')} VND
                </div>
              </div>

              <h4 style={{ margin: '16px 0 8px', fontSize: '14px' }}>Chi tiết cược theo ngựa đua:</h4>
              <div className="admin-table-wrapper">
                <table className="admin-table" style={{ fontSize: '13px' }}>
                  <thead>
                    <tr>
                      <th>Ngựa đua</th>
                      <th>Lượt đặt</th>
                      <th>Tổng tiền cược</th>
                      <th>Tỉ lệ %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(predStats.breakdown || []).map((b: any) => (
                      <tr key={b.horseId}>
                        <td style={{ fontWeight: 600 }}>{b.horseName || b.horseId}</td>
                        <td>{b.count} lượt</td>
                        <td>{b.amount?.toLocaleString('vi-VN')} VND</td>
                        <td>{b.percentage}%</td>
                      </tr>
                    ))}
                    {(predStats.breakdown || []).length === 0 && (
                      <tr>
                        <td colSpan={4} className="muted" style={{ textAlign: 'center' }}>Chưa có lượt dự đoán nào cho các ngựa đua.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btnPrimary" onClick={() => setShowPredStatsModal(false)}>Đóng</button>
            </div>
          </div>
        </div>
      )}
      {/* VIEW BRACKET MODAL */}
      {viewBracketTournament && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setViewBracketTournament(null)} />
          <div 
            className="relative bg-[var(--surface)] w-[95vw] max-w-6xl max-h-[90vh] rounded-2xl border border-[var(--border)] shadow-2xl flex flex-col overflow-hidden animate-fade-in-up"
          >
            <div className="flex items-center justify-between p-6 border-b border-[var(--border)] bg-[var(--surface-strong)]">
              <h2 className="text-2xl font-black text-amber-500 drop-shadow-sm flex items-center gap-3">
                <Trophy className="w-6 h-6 text-amber-500" />
                Sơ Đồ Giải Đấu - {viewBracketTournament.name}
              </h2>
              <button 
                className="text-zinc-400 hover:text-white transition-colors bg-white/5 hover:bg-white/10 p-2 rounded-xl cursor-pointer"
                onClick={() => setViewBracketTournament(null)}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 bg-[#0f0f13]">
              <TournamentBracketView 
                bracket={viewBracketTournament.bracket} 
                races={viewBracketRaces} 
                onGenerateNextRound={handleGenerateNextRound}
                loadingNextRound={generatingNextRound}
              />
            </div>
          </div>
        </div>
      )}
      </div>
    </>
  )
}

// ---------------------------------------------------------
// INNER COMPONENT: RACELIST FOR TOURNAMENT
// ---------------------------------------------------------
function RaceList({
  races,
  onEditRace,
  onViewRace,
  onOpenResultModal,
  onRefresh,
  lastModifiedRaceId,
}: {
  races: Race[]
  onEditRace: (race: Race) => void
  onViewRace: (race: Race) => void
  onOpenResultModal: (race: Race) => void
  onRefresh: (highlightRaceId?: string) => void
  lastModifiedRaceId?: string | null
}) {
  const [startingStreamId, setStartingStreamId] = useState<string | null>(null)
  const [stoppingStreamId, setStoppingStreamId] = useState<string | null>(null)

  const handleStartStream = async (raceId: string) => {
    setStartingStreamId(raceId)
    try {
      await startRaceStream(raceId)
      alert("Đã bắt đầu cuộc đua giả lập thành công! Người xem hiện tại có thể xem giả lập 2D trực tiếp.")
      onRefresh(raceId)
    } catch (err: any) {
      alert(err.response?.data?.message || 'Không thể bắt đầu giả lập cho cuộc đua này')
    } finally {
      setStartingStreamId(null)
    }
  }

  const handleStopStream = async (raceId: string) => {
    if (!confirm('Bạn có chắc chắn muốn kết thúc cuộc đua giả lập này?')) return
    setStoppingStreamId(raceId)
    try {
      await stopRaceStream(raceId)
      alert('Đã kết thúc cuộc đua giả lập thành công!')
      onRefresh(raceId)
    } catch (err: any) {
      alert(err.response?.data?.message || 'Không thể kết thúc cuộc đua')
    } finally {
      setStoppingStreamId(null)
    }
  }

  const handleQuickStatusChange = async (id: string, newStatus: string) => {
    try {
      await updateRace(id, { status: newStatus } as any)
      onRefresh(id)
    } catch (err: any) {
      alert(err.response?.data?.message || 'Không thể đổi trạng thái cuộc đua')
    }
  }

  if (races.length === 0) return <p className="muted" style={{ fontSize: '13px', fontStyle: 'italic' }}>Chưa có cuộc đua nào được thiết lập cho giải đấu này.</p>

  const sortedRaces = [...races].sort((a, b) => {
    const aId = a.id || a._id
    const bId = b.id || b._id
    if (lastModifiedRaceId) {
      if (aId === lastModifiedRaceId) return -1
      if (bId === lastModifiedRaceId) return 1
    }
    const dateA = a.scheduledAt ? new Date(a.scheduledAt).getTime() : 0
    const dateB = b.scheduledAt ? new Date(b.scheduledAt).getTime() : 0
    return dateA - dateB
  })

  const groupRaces = sortedRaces.filter(r => r.name.toLowerCase().includes('bảng') || r.name.toLowerCase().includes('group'))
  const knockoutRaces = sortedRaces.filter(r => !r.name.toLowerCase().includes('bảng') && !r.name.toLowerCase().includes('group'))

  const renderTable = (list: Race[], title: string, color: string) => {
    if (list.length === 0) return null;
    return (
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
          <div style={{ height: '1px', flex: 1, background: `linear-gradient(to right, transparent, ${color})`, opacity: 0.3 }} />
          <h5 style={{ margin: 0, fontSize: '13px', fontWeight: 800, color, textTransform: 'uppercase', letterSpacing: '1.5px' }}>{title}</h5>
          <div style={{ height: '1px', flex: 1, background: `linear-gradient(to left, transparent, ${color})`, opacity: 0.3 }} />
        </div>
        <table className="admin-table" style={{ fontSize: '13px' }}>
          <thead>
            <tr>
              <th>Tên cuộc đua</th>
              <th>Cự ly</th>
              <th>Thời gian</th>
              <th>Số ngựa tối đa</th>
              <th>Giải thưởng (1st / 2nd / 3rd)</th>
              <th>Trạng thái</th>
              <th style={{ textAlign: 'right' }}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {list.map((r) => (
              <tr key={r.id}>
                <td style={{ fontWeight: 600 }}>{r.name}</td>
                <td>{r.distance}m</td>
                <td>{new Date(r.scheduledAt).toLocaleString('vi-VN')}</td>
                <td>{r.maxHorses} chú ngựa</td>
                <td>
                  🥇 {r.prizeFirst?.toLocaleString('vi-VN')} | 🥈 {r.prizeSecond?.toLocaleString('vi-VN')} | 🥉 {r.prizeThird?.toLocaleString('vi-VN')}
                </td>
                <td>
                  <select
                    value={r.status || 'SCHEDULED'}
                    onChange={(e) => handleQuickStatusChange(r.id, e.target.value)}
                    style={{
                      width: 'auto',
                      padding: '2px 24px 2px 6px',
                      fontSize: '11px',
                      fontWeight: 700,
                      borderRadius: '999px',
                      border: '1px solid',
                      cursor: 'pointer',
                      background:
                        r.status === 'ONGOING' ? 'rgba(16,185,129,0.12)' :
                        r.status === 'COMPLETED' ? 'rgba(16,185,129,0.08)' :
                        r.status === 'RESULT_CONFIRMED' ? 'rgba(59,130,246,0.10)' :
                        r.status === 'PENDING' ? 'rgba(100,116,139,0.1)' :
                        r.status === 'CANCELLED' ? 'rgba(239,68,68,0.10)' : 'rgba(59,130,246,0.10)',
                      borderColor:
                        r.status === 'ONGOING' ? '#10b981' :
                        r.status === 'COMPLETED' ? '#059669' :
                        r.status === 'RESULT_CONFIRMED' ? '#3b82f6' :
                        r.status === 'PENDING' ? '#64748b' :
                        r.status === 'CANCELLED' ? '#ef4444' : '#3b82f6',
                      color:
                        r.status === 'ONGOING' ? '#059669' :
                        r.status === 'COMPLETED' ? '#047857' :
                        r.status === 'RESULT_CONFIRMED' ? '#2563eb' :
                        r.status === 'PENDING' ? '#475569' :
                        r.status === 'CANCELLED' ? '#dc2626' : '#2563eb',
                    }}
                  >
                    <option value="PENDING">Chưa có lịch</option>
                    <option value="SCHEDULED">Đã lên lịch</option>
                    <option value="ONGOING">Đang diễn ra</option>
                    <option value="RESULT_CONFIRMED">Xác nhận kết quả</option>
                    <option value="COMPLETED">Hoàn thành</option>
                    <option value="CANCELLED">Đã hủy</option>
                  </select>
                </td>
                <td style={{ textAlign: 'right' }}>
                  <div style={{ display: 'inline-flex', gap: 4 }}>
                    <button className="btn" style={{ fontSize: '11px', padding: '4px 8px' }} onClick={() => onEditRace(r)}>
                      Sửa
                    </button>
                    <button className="btn btnPrimary" style={{ fontSize: '11px', padding: '4px 8px' }} onClick={() => onViewRace(r)}>
                      Xem bảng đấu
                    </button>
                    {r.status === 'RESULT_CONFIRMED' && (
                      <button className="btn btnPrimary" style={{ fontSize: '11px', padding: '4px 8px' }} onClick={() => onOpenResultModal(r)}>
                        Công bố kết quả
                      </button>
                    )}
                    {['ONGOING', 'SCHEDULED'].includes(r.status || '') && (
                      <>
                        {!r.isLive ? (
                          <button
                            className="btn"
                            style={{ fontSize: '11px', padding: '4px 8px', background: '#10b981', color: '#fff', border: 'none' }}
                            onClick={() => handleStartStream(r.id)}
                            disabled={startingStreamId === r.id}
                          >
                            {startingStreamId === r.id ? 'Đang chạy...' : 'Bắt Đầu Đua'}
                          </button>
                        ) : (
                          <>
                            <button
                              className="btn"
                              style={{ fontSize: '11px', padding: '4px 8px', background: '#ef4444', color: '#fff', border: 'none' }}
                              onClick={() => handleStopStream(r.id)}
                              disabled={stoppingStreamId === r.id}
                            >
                              {stoppingStreamId === r.id ? 'Đang dừng...' : 'Kết Thúc Đua'}
                            </button>
                          </>
                        )}
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="admin-table-wrapper" style={{ margin: 0, padding: 0, background: 'transparent', border: 'none' }}>
      {renderTable(groupRaces, 'Vòng Bảng', '#f59e0b')}
      {renderTable(knockoutRaces, 'Vòng Loại Trực Tiếp', '#3b82f6')}
    </div>
  )
}

// ---------------------------------------------------------
// INNER COMPONENT: PREDICTION RACE LIST
// ---------------------------------------------------------
function PredictionRaceList({
  predictions,
  onClosePred,
  onSettlePred,
  onViewStats,
  onOpenResultModal,
  lastModifiedRaceId,
}: {
  predictions: any[]
  onClosePred: (raceId: string) => void
  onSettlePred: (raceId: string) => void
  onViewStats: (raceId: string) => void
  onOpenResultModal: (race: Race) => void
  lastModifiedRaceId?: string | null
}) {
  const [races, setRaces] = useState<Race[]>([])
  const [loading, setLoading] = useState(false)

  // AnimatedTable states
  const [sortColumn, setSortColumn] = useState<string | undefined>()
  const [sortDirection, setSortDirection] = useState<SortDirection>(null)
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({})
  const [page, setPage] = useState(1)

  useEffect(() => {
    setLoading(true)
    getRaces()
      .then(setRaces)
      .catch(() => setRaces([]))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <p className="muted">Đang tải danh sách cuộc đua đặt cược...</p>
  if (races.length === 0) return <p className="muted">Không có cuộc đua nào để cược.</p>

  const handleSort = (columnId: string, direction: SortDirection) => {
    setSortColumn(columnId)
    setSortDirection(direction)
  }

  const handleColumnFilterChange = (columnId: string, value: string) => {
    setColumnFilters(prev => ({ ...prev, [columnId]: value }))
    setPage(1)
  }

  const enrichedRaces = races.map(r => {
    const racePreds = predictions.filter(p => {
      const rId = typeof p.raceId === 'object' ? p.raceId?._id || p.raceId?.id : p.raceId
      return rId === r.id
    })
    const betCount = racePreds.length
    const totalBets = racePreds.reduce((sum, p) => sum + (p.betAmount || 0), 0)
    const totalPayouts = racePreds.filter(p => p.status === 'WON').reduce((sum, p) => sum + (p.prizeAmount || p.payout || 0), 0)
    const profit = totalBets - totalPayouts

    return {
      ...r,
      betCount,
      totalBets,
      totalPayouts,
      profit
    }
  })

  // Filter
  let filtered = enrichedRaces.filter(r => {
    if (columnFilters.name) {
      const matchName = (r.name || '').toLowerCase().includes(columnFilters.name.toLowerCase())
      const tournName = (typeof r.tournamentId === 'object' ? r.tournamentId?.name || '' : '').toLowerCase()
      if (!matchName && !tournName.includes(columnFilters.name.toLowerCase())) return false
    }
    if (columnFilters.status && r.status !== columnFilters.status) return false
    return true
  })

  // Sort
  if (sortColumn && sortDirection) {
    filtered.sort((a, b) => {
      let aVal: any = a[sortColumn as keyof typeof a]
      let bVal: any = b[sortColumn as keyof typeof b]
      
      if (sortColumn === 'name') {
        aVal = a.name || ''
        bVal = b.name || ''
      } else if (sortColumn === 'scheduledAt') {
        aVal = a.scheduledAt ? new Date(a.scheduledAt).getTime() : 0
        bVal = b.scheduledAt ? new Date(b.scheduledAt).getTime() : 0
      }

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortDirection === 'asc' ? aVal.localeCompare(bVal, 'vi') : bVal.localeCompare(aVal, 'vi')
      }
      return sortDirection === 'asc' ? aVal - bVal : bVal - aVal
    })
  } else {
    // Default sort by last modified or schedule
    filtered.sort((a, b) => {
      const aId = a.id || a._id
      const bId = b.id || b._id
      if (lastModifiedRaceId) {
        if (aId === lastModifiedRaceId) return -1
        if (bId === lastModifiedRaceId) return 1
      }
      const dateA = a.scheduledAt ? new Date(a.scheduledAt).getTime() : 0
      const dateB = b.scheduledAt ? new Date(b.scheduledAt).getTime() : 0
      return dateB - dateA
    })
  }

  const paginatedData = filtered.slice((page - 1) * 10, page * 10)

  return (
    <div className="admin-table-wrapper w-full" style={{ margin: 0 }}>
      <AnimatedTable
        data={paginatedData}
        columns={[
          {
            id: 'name',
            header: 'Cuộc đua / Giải đấu',
            sortable: true,
            filterable: true,
            filterType: 'text',
            cell: (row) => (
              <div>
                <div style={{ fontWeight: 600, color: 'var(--text)' }}>{row.name}</div>
                <div className="muted" style={{ fontSize: '11px' }}>
                  Giải: {typeof row.tournamentId === 'object' ? row.tournamentId.name : 'Giải đua ngựa'}
                </div>
              </div>
            )
          },
          {
            id: 'scheduledAt',
            header: 'Thời gian thi đấu',
            sortable: true,
            cell: (row) => <span>{new Date(row.scheduledAt).toLocaleString('vi-VN')}</span>
          },
          {
            id: 'status',
            header: 'Trạng thái đua',
            sortable: true,
            filterable: true,
            filterType: 'select',
            filterOptions: [
              { label: 'Đã lên lịch', value: 'SCHEDULED' },
              { label: 'Đang diễn ra', value: 'ONGOING' },
              { label: 'Đã hủy', value: 'CANCELLED' },
              { label: 'Kết thúc', value: 'COMPLETED' },
              { label: 'Xác nhận kết quả', value: 'RESULT_CONFIRMED' }
            ],
            cell: (row) => (
              <span className={`badge ${row.status === 'COMPLETED' || row.status === 'RESULT_CONFIRMED' ? 'badge-approved' : row.status === 'ONGOING' ? 'badge-ongoing' : row.status === 'CANCELLED' ? 'badge-rejected' : 'badge-scheduled'}`}>
                {row.status === 'COMPLETED' ? 'Kết thúc' : row.status === 'RESULT_CONFIRMED' ? 'Xác nhận KQ' : row.status === 'ONGOING' ? 'Đang diễn ra' : row.status === 'CANCELLED' ? 'Đã hủy' : row.status === 'SCHEDULED' ? 'Đã lên lịch' : row.status}
              </span>
            )
          },
          {
            id: 'betCount',
            header: 'Lượt cược',
            sortable: true,
            cell: (row) => <span style={{ fontWeight: 600 }}>{row.betCount}</span>
          },
          {
            id: 'totalBets',
            header: 'Tổng tiền cược',
            sortable: true,
            cell: (row) => <span style={{ fontWeight: 700, color: '#f59e0b' }}>{row.totalBets.toLocaleString('vi-VN')} đ</span>
          },
          {
            id: 'totalPayouts',
            header: 'Đã trả thưởng',
            sortable: true,
            cell: (row) => <span style={{ fontWeight: 700, color: '#10b981' }}>{row.totalPayouts.toLocaleString('vi-VN')} đ</span>
          },
          {
            id: 'profit',
            header: 'Lợi nhuận',
            sortable: true,
            cell: (row) => (
              <span style={{ fontWeight: 700, color: row.profit >= 0 ? '#10b981' : '#ef4444' }}>
                {row.profit > 0 ? '+' : ''}{row.profit.toLocaleString('vi-VN')} đ
              </span>
            )
          },
          {
            id: 'actions',
            header: 'Thao tác cổng cược',
            cell: (r) => (
              <div style={{ display: 'inline-flex', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end', width: '100%' }}>
                <button className="btn flex items-center gap-1" style={{ fontSize: '12px', padding: '4px 8px' }} onClick={() => onViewStats(r.id)}>
                  <TrendingUp className="w-3.5 h-3.5 text-blue-400" />
                  <span>Chi tiết</span>
                </button>
                {r.status !== 'COMPLETED' && r.status !== 'RESULT_CONFIRMED' && (
                  <button className="btn flex items-center gap-1" style={{ fontSize: '12px', padding: '4px 8px', color: '#d97706' }} onClick={() => onClosePred(r.id)}>
                    <Lock className="w-3.5 h-3.5 text-amber-500" />
                    <span>Đóng cổng</span>
                  </button>
                )}
                {r.status === 'RESULT_CONFIRMED' && (
                  <button className="btn btnPrimary flex items-center gap-1" style={{ fontSize: '12px', padding: '4px 8px' }} onClick={() => onOpenResultModal(r as any)}>
                    <Coins className="w-3.5 h-3.5 text-[color:var(--text)]" />
                    <span>Công bố kết quả</span>
                  </button>
                )}
                {r.status === 'COMPLETED' && (
                  <>
                    <button className="btn btnPrimary flex items-center gap-1" style={{ fontSize: '12px', padding: '4px 8px' }} onClick={() => onOpenResultModal(r as any)}>
                      <Coins className="w-3.5 h-3.5 text-[color:var(--text)]" />
                      <span>Công bố lại kết quả</span>
                    </button>
                    <button className="btn btnPrimary flex items-center gap-1" style={{ fontSize: '12px', padding: '4px 8px' }} onClick={() => onSettlePred(r.id)}>
                      <Coins className="w-3.5 h-3.5 text-[color:var(--text)]" />
                      <span>Trả thưởng</span>
                    </button>
                  </>
                )}
              </div>
            )
          }
        ]}
        sortColumn={sortColumn}
        sortDirection={sortDirection}
        onSort={handleSort}
        columnFilters={columnFilters}
        onColumnFilterChange={handleColumnFilterChange}
        pagination={{
          page: page,
          pageSize: 10,
          totalItems: filtered.length,
          onPageChange: setPage,
          pageSizeOptions: [10, 20, 50]
        }}
      />
    </div>
  )
}
