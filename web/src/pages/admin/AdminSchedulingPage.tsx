import { useEffect, useState, startTransition } from 'react'
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
  TrendingUp
} from 'lucide-react'
import type { Tournament, Race, User, RaceRegistration, Horse, Jockey, Prediction } from '../../types'
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
  
  // Filters for Predictions Tab
  const [filterPredStatus, setFilterPredStatus] = useState<string>('ALL')
  const [filterPredRace, setFilterPredRace] = useState<string>('ALL')
  const [filterPredSearch, setFilterPredSearch] = useState<string>('')

  // Filters for Tournaments Tab
  const [filterTournSearch, setFilterTournSearch] = useState<string>('')
  const [filterTournStatus, setFilterTournStatus] = useState<string>('ALL')
  const [expandedTournId, setExpandedTournId] = useState<string | null>(null)

  // Filters for Registrations Tab
  const [filterRegSearch, setFilterRegSearch] = useState<string>('')
  const [filterRegStatus, setFilterRegStatus] = useState<string>('ALL')
  const [filterRegTourn, setFilterRegTourn] = useState<string>('ALL')
  
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
    maxHorses: 10,
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
        const [list, hList] = await Promise.all([
          getRaceRegistrations(),
          getAdminHorses()
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
        maxHorses: t.maxHorses || 10,
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
        maxHorses: 10,
        status: 'DRAFT',
      })
    }
    setShowTournModal(true)
  }

  const handleSaveTourn = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (selectedTourn) {
        await updateTournament(selectedTourn.id, tournForm as any)
        setLastModifiedTournId(selectedTourn.id)
        showToast(`Đã cập nhật giải đấu ${tournForm.name}`)
        loadTabData(selectedTourn.id, undefined, undefined, undefined)
      } else {
        const res = await createTournament(tournForm as any)
        const newId = res?.id || res?._id || res?.data?.id || res?.data?._id
        if (newId) {
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
      showToast(err.response?.data?.message || 'Không thể lưu cuộc đua', 'error')
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
  const handleApproveReg = async (regId: string) => {
    try {
      await approveRaceRegistration(regId)
      setLastModifiedRegId(regId)
      showToast('Đã duyệt đăng ký tham gia cuộc đua')
      loadTabData(undefined, undefined, regId, undefined)
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
      loadTabData(undefined, undefined, regId, undefined)
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Từ chối thất bại', 'error')
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
      const res = await http.get(`${import.meta.env.VITE_API_BASE_URL || 'https://managerhourse-be.onrender.com/api-docs'}/races/${race.id}/horses`)
      const horsesList = res.data.horses || []
      setRaceHorses(horsesList)

      // Initialize rankings form: default positions
      const initialRankings = horsesList.map((h: any, idx: number) => ({
        horseId: h.horse?._id || h.horse?.id,
        jockeyId: h.horse?.ownerId?._id || h.horse?.ownerId, // placeholder or jockey if confirmed
        position: idx + 1,
        finishTime: 60 + idx * 2.5, // default time estimate
        status: 'FINISHED',
        prizeAmount: idx === 0 ? race.prizeFirst : idx === 1 ? race.prizeSecond : idx === 2 ? race.prizeThird : 0,
      }))
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
    if (filterRegStatus !== 'ALL' && reg.status !== filterRegStatus) return false
    
    if (filterRegTourn !== 'ALL') {
      const resolvedTournId = typeof reg.raceId === 'object'
        ? (typeof reg.raceId?.tournamentId === 'object' ? reg.raceId?.tournamentId?._id || reg.raceId?.tournamentId?.id : reg.raceId?.tournamentId)
        : (() => {
            const raceObj = races.find(r => r.id === reg.raceId)
            if (raceObj) {
              return typeof raceObj.tournamentId === 'object' ? raceObj.tournamentId?._id || raceObj.tournamentId?.id : raceObj.tournamentId
            }
            return undefined
          })()
      if (resolvedTournId !== filterRegTourn) return false
    }

    if (filterRegSearch.trim() !== '') {
      const query = filterRegSearch.toLowerCase()
      const horseName = (reg.horseName || (typeof reg.horseId === 'object' ? reg.horseId?.name : '') || '').toLowerCase()
      const raceName = (reg.raceName || (typeof reg.raceId === 'object' ? reg.raceId?.name : '') || '').toLowerCase()
      const horseKey = typeof reg.horseId === 'string' ? reg.horseId : reg.horseId?._id || reg.horseId?.id
      const ownerInfo = horseKey ? registrationOwners[horseKey] : undefined
      const ownerName = (ownerInfo?.fullName || reg.ownerName || (typeof reg.horseId === 'object' ? reg.horseId?.ownerId?.fullName || reg.horseId?.ownerId?.name || reg.horseId?.owner?.fullName || reg.horseId?.owner : '') || '').toLowerCase()

      if (!horseName.includes(query) && !raceName.includes(query) && !ownerName.includes(query)) return false
    }
    return true
  })

  const { toasts, show: showToast } = useToast()

  const tabHeaders: Record<string, { title: string; desc: string; icon: any }> = {
    tournaments: { title: 'Giải Đấu & Lịch Trình', desc: 'Quản lý thông tin giải đấu và xếp lịch các chặng đua.', icon: Trophy },
    registrations: { title: 'Duyệt Đăng Ký Đua', desc: 'Duyệt hoặc từ chối đơn đăng ký tham gia thi đấu của ngựa.', icon: ClipboardList },
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
                          onSchedule={openSchedModal}
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
          <h2>Duyệt Đăng Ký Tham Gia Cuộc Đua</h2>
          <p className="muted">Xem các yêu cầu đăng ký đua ngựa của chủ ngựa và tiến hành duyệt hoặc từ chối.</p>

          {/* Filter Bar */}
          <div className="flex flex-wrap gap-4 items-end mb-6 bg-white/[0.01] border border-white/[0.03] p-4 rounded-xl">
            <div className="form-group flex-1 min-w-[200px]" style={{ margin: 0 }}>
              <label className="text-xs font-bold mb-1.5 block">Tìm kiếm</label>
              <input
                type="text"
                placeholder="Tìm tên ngựa, cuộc đua, chủ sở hữu..."
                value={filterRegSearch}
                onChange={(e) => setFilterRegSearch(e.target.value)}
                className="h-10 rounded-lg"
              />
            </div>
            <div className="form-group min-w-[150px]" style={{ margin: 0 }}>
              <label className="text-xs font-bold mb-1.5 block">Trạng thái đăng ký</label>
              <select
                value={filterRegStatus}
                onChange={(e) => setFilterRegStatus(e.target.value)}
                className="h-10 rounded-lg"
              >
                <option value="ALL">Tất cả trạng thái</option>
                <option value="PENDING_APPROVAL">Chờ duyệt (Pending)</option>
                <option value="APPROVED">Đã duyệt (Approved)</option>
                <option value="CONFIRMED">Đã xác nhận (Confirmed)</option>
                <option value="REJECTED">Đã từ chối (Rejected)</option>
              </select>
            </div>
            <div className="form-group min-w-[200px]" style={{ margin: 0 }}>
              <label className="text-xs font-bold mb-1.5 block">Lọc theo giải đấu</label>
              <select
                value={filterRegTourn}
                onChange={(e) => setFilterRegTourn(e.target.value)}
                className="h-10 rounded-lg"
              >
                <option value="ALL">Tất cả giải đấu</option>
                {tournaments.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
          </div>

          {loading ? (
            <p className="muted">Đang tải...</p>
          ) : filteredRegistrations.length === 0 ? (
            <div className="text-center py-8 text-[var(--muted)] font-semibold">
              Không tìm thấy yêu cầu đăng ký nào khớp với điều kiện lọc.
            </div>
          ) : (
            <div className="admin-table-wrapper w-full overflow-hidden">
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
                    if (regColumnFilters.status && r.status !== regColumnFilters.status) return false
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
                      const raceName = row.raceName || (typeof row.raceId === 'object' ? row.raceId?.name : '')
                      const raceScheduledAt = typeof row.raceId === 'object' ? row.raceId?.scheduledAt : undefined
                      return (
                        <div>
                          <div style={{ fontWeight: 600 }}>{raceName || 'Cuộc đua chưa rõ'}</div>
                          {raceScheduledAt && (
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
                      { label: 'Chờ duyệt', value: 'PENDING_APPROVAL' },
                      { label: 'Đã duyệt', value: 'APPROVED' },
                      { label: 'Đã xác nhận', value: 'CONFIRMED' },
                      { label: 'Đã từ chối', value: 'REJECTED' },
                    ],
                    cell: (row) => (
                      <div>
                        <span className={`badge badge-status-${row.status === 'APPROVED' ? 'approved' : row.status === 'CONFIRMED' ? 'confirmed' : row.status === 'REJECTED' ? 'rejected' : 'pending'}`}>
                          {row.status === 'APPROVED' ? 'Đã duyệt' : row.status === 'CONFIRMED' ? 'Đã xác nhận' : row.status === 'REJECTED' ? 'Đã từ chối' : row.status === 'PENDING_APPROVAL' ? 'Chờ duyệt' : row.status}
                        </span>
                        {row.status === 'REJECTED' && (row as any).rejectionReason && (
                          <div className="text-xs" style={{ marginTop: 4, color: '#ef4444' }}>Lý do: {(row as any).rejectionReason}</div>
                        )}
                      </div>
                    )
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
                      row.status === 'PENDING_APPROVAL' ? (
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
                      res = res.filter(r => r.status === regColumnFilters.status)
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
              <div className="admin-table-wrapper w-full overflow-hidden">
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
              <div className="admin-table-wrapper w-full overflow-hidden">
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
              <div className="admin-table-wrapper w-full overflow-hidden">
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
                        { label: 'Kết thúc', value: 'COMPLETED' },
                        { label: 'Đã hủy', value: 'CANCELLED' },
                      ],
                      cell: (row) => (
                        <span className={`badge ${row.status === 'COMPLETED' ? 'badge-approved' : row.status === 'ONGOING' ? 'badge-ongoing' : row.status === 'CANCELLED' ? 'badge-rejected' : 'badge-scheduled'}`}>
                          {row.status === 'COMPLETED' ? 'Kết thúc' : row.status === 'ONGOING' ? 'Đang diễn ra' : row.status === 'CANCELLED' ? 'Đã hủy' : row.status === 'SCHEDULED' ? 'Đã lên lịch' : row.status}
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
                        <div style={{ display: 'inline-flex', gap: 6, justifyContent: 'flex-end' }}>
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
                          {row.status === 'COMPLETED' && (
                            <span className="success-text flex items-center gap-1" style={{ fontSize: '12px', fontWeight: 600 }}>
                              <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                              <span>Đã hoàn thành</span>
                            </span>
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
              <div className="admin-table-wrapper w-full overflow-hidden">
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
                    <input type="date" required value={tournForm.startDate} onChange={(e) => setTournForm({ ...tournForm, startDate: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>Ngày kết thúc</label>
                    <input type="date" required value={tournForm.endDate} onChange={(e) => setTournForm({ ...tournForm, endDate: e.target.value })} />
                  </div>
                </div>
                <div className="grid-2">
                  <div className="form-group">
                    <label>Tổng tiền thưởng (VND)</label>
                    <input type="number" required value={tournForm.prizePool} onChange={(e) => setTournForm({ ...tournForm, prizePool: parseInt(e.target.value) })} />
                  </div>
                  <div className="form-group">
                    <label>Số ngựa tối đa</label>
                    <input type="number" required value={tournForm.maxHorses} onChange={(e) => setTournForm({ ...tournForm, maxHorses: parseInt(e.target.value) })} />
                  </div>
                </div>
                <div className="form-group">
                  <label>Trạng thái giải đấu</label>
                  <select value={tournForm.status} onChange={(e) => setTournForm({ ...tournForm, status: e.target.value })}>
                    <option value="DRAFT">Bản nháp (DRAFT)</option>
                    <option value="PUBLISHED">Đã công bố (PUBLISHED)</option>
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
                  <label>Tên cuộc đua (Ví dụ: Vòng 1 — Nội dung 1200m)</label>
                  <input type="text" required value={raceForm.name} onChange={(e) => setRaceForm({ ...raceForm, name: e.target.value })} />
                </div>
                <div className="grid-2">
                  <div className="form-group">
                    <label>Cự ly (Meters)</label>
                    <input type="number" required value={raceForm.distance} onChange={(e) => setRaceForm({ ...raceForm, distance: parseInt(e.target.value) })} />
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
  onSchedule,
  onRefresh,
  lastModifiedRaceId,
}: {
  races: Race[]
  onEditRace: (race: Race) => void
  onSchedule: (race: Race) => void
  onRefresh: (highlightRaceId?: string) => void
  lastModifiedRaceId?: string | null
}) {
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

  return (
    <div className="admin-table-wrapper" style={{ margin: 0 }}>
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
          {sortedRaces.map((r) => (
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
                      r.status === 'CANCELLED' ? 'rgba(239,68,68,0.10)' : 'rgba(59,130,246,0.10)',
                    borderColor:
                      r.status === 'ONGOING' ? '#10b981' :
                      r.status === 'COMPLETED' ? '#059669' :
                      r.status === 'CANCELLED' ? '#ef4444' : '#3b82f6',
                    color:
                      r.status === 'ONGOING' ? '#059669' :
                      r.status === 'COMPLETED' ? '#047857' :
                      r.status === 'CANCELLED' ? '#dc2626' : '#2563eb',
                  }}
                >
                  <option value="SCHEDULED">Đã lên lịch</option>
                  <option value="ONGOING">Đang diễn ra</option>
                  <option value="COMPLETED">Hoàn thành</option>
                  <option value="CANCELLED">Đã hủy</option>
                </select>
              </td>
              <td style={{ textAlign: 'right' }}>
                <div style={{ display: 'inline-flex', gap: 4 }}>
                  <button className="btn" style={{ fontSize: '11px', padding: '4px 8px' }} onClick={() => onEditRace(r)}>
                    Sửa
                  </button>
                  {r.status === 'SCHEDULED' && (
                    <button className="btn btnPrimary" style={{ fontSize: '11px', padding: '4px 8px' }} onClick={() => onSchedule(r)}>
                      Lập lịch
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
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
  lastModifiedRaceId,
}: {
  predictions: any[]
  onClosePred: (raceId: string) => void
  onSettlePred: (raceId: string) => void
  onViewStats: (raceId: string) => void
  lastModifiedRaceId?: string | null
}) {
  const [races, setRaces] = useState<Race[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    getRaces()
      .then(setRaces)
      .catch(() => setRaces([]))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <p className="muted">Đang tải danh sách cuộc đua đặt cược...</p>
  if (races.length === 0) return <p className="muted">Không có cuộc đua nào để cược.</p>

  const sortedRaces = [...races].sort((a, b) => {
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

  return (
    <div className="admin-table-wrapper" style={{ margin: 0 }}>
      <table className="admin-table" style={{ fontSize: '13px' }}>
        <thead>
          <tr>
            <th>Cuộc đua / Giải đấu</th>
            <th>Thời gian thi đấu</th>
            <th>Trạng thái đua</th>
            <th>Lượt cược</th>
            <th>Tổng tiền cược</th>
            <th>Đã trả thưởng</th>
            <th>Lợi nhuận</th>
            <th style={{ textAlign: 'right' }}>Thao tác cổng cược</th>
          </tr>
        </thead>
        <tbody>
          {sortedRaces.map((r) => {
            const isCompleted = r.status === 'COMPLETED'
            const racePreds = predictions.filter(p => {
              const rId = typeof p.raceId === 'object' ? p.raceId?._id || p.raceId?.id : p.raceId
              return rId === r.id
            })
            const betCount = racePreds.length
            const totalBets = racePreds.reduce((sum, p) => sum + (p.betAmount || 0), 0)
            const totalPayouts = racePreds.filter(p => p.status === 'WON').reduce((sum, p) => sum + (p.prizeAmount || p.payout || 0), 0)
            const profit = totalBets - totalPayouts

            return (
              <tr key={r.id}>
                <td>
                  <div style={{ fontWeight: 600, color: 'var(--text)' }}>{r.name}</div>
                  <div className="muted" style={{ fontSize: '11px' }}>
                    Giải: {typeof r.tournamentId === 'object' ? r.tournamentId.name : 'Giải đua ngựa'}
                  </div>
                </td>
                <td>{new Date(r.scheduledAt).toLocaleString('vi-VN')}</td>
                <td>
                  <span className={`badge ${r.status === 'COMPLETED' ? 'badge-approved' : r.status === 'ONGOING' ? 'badge-ongoing' : r.status === 'CANCELLED' ? 'badge-rejected' : 'badge-scheduled'}`}>
                    {r.status === 'COMPLETED' ? 'Kết thúc' : r.status === 'ONGOING' ? 'Đang diễn ra' : r.status === 'CANCELLED' ? 'Đã hủy' : r.status === 'SCHEDULED' ? 'Đã lên lịch' : r.status}
                  </span>
                </td>
                <td style={{ fontWeight: 600 }}>{betCount}</td>
                <td style={{ fontWeight: 700, color: '#f59e0b' }}>
                  {totalBets.toLocaleString('vi-VN')} đ
                </td>
                <td style={{ fontWeight: 700, color: '#10b981' }}>
                  {totalPayouts.toLocaleString('vi-VN')} đ
                </td>
                <td style={{ fontWeight: 700, color: profit >= 0 ? '#10b981' : '#ef4444' }}>
                  {profit > 0 ? '+' : ''}{profit.toLocaleString('vi-VN')} đ
                </td>
                <td style={{ textAlign: 'right' }}>
                  <div style={{ display: 'inline-flex', gap: 6 }}>
                    <button className="btn flex items-center gap-1" style={{ fontSize: '12px', padding: '4px 8px' }} onClick={() => onViewStats(r.id)}>
                      <TrendingUp className="w-3.5 h-3.5 text-blue-400" />
                      <span>Chi tiết</span>
                    </button>
                    {!isCompleted && (
                      <button className="btn flex items-center gap-1" style={{ fontSize: '12px', padding: '4px 8px', color: '#d97706' }} onClick={() => onClosePred(r.id)}>
                        <Lock className="w-3.5 h-3.5 text-amber-500" />
                        <span>Đóng cổng</span>
                      </button>
                    )}
                    {isCompleted && (
                      <button className="btn btnPrimary flex items-center gap-1" style={{ fontSize: '12px', padding: '4px 8px' }} onClick={() => onSettlePred(r.id)}>
                        <Coins className="w-3.5 h-3.5 text-white" />
                        <span>Trả thưởng</span>
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
