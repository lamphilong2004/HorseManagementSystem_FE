import { useEffect, useState, startTransition, useMemo } from 'react'
import type { Horse, Race, Jockey, Tournament } from '../types'
import {
  getHorses,
  createHorse,
  updateHorse,
  deleteHorse,
  getRaces,
  getRaceHorses,
  registerHorseForTournament,
  getTournaments,
  searchJockeys,
  sendJockeyInvitation,
  getHorseJockeys,
  confirmJockey,
  confirmRaceParticipation,
  getHorseResults
} from '@/api'
import { Pagination } from '@/components/ui/Pagination'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { ScrollReveal } from '@/components/ui/scroll-text'
import { Magnetic } from '@/components/ui/magnetic'
import { useAnimatedToast } from '@/components/ui/animated-toast'
import { AnimatedTable, type SortDirection } from '@/components/ui/animated-table'
import {
  CalendarRange, Search, Trophy, Activity, FileCheck, Check, X, Users,
  TrendingUp, AlertTriangle, Edit, Trash2, Plus, ShieldCheck, RefreshCw,
  Sparkles, Zap, Clock, MapPin, Star, Send, UserCheck
} from 'lucide-react'
import '@/styles/horse-management.css'
import { socket } from '@/lib/socket'

// ─── Types ────────────────────────────────────────────────────────────────────
type Tab = 'my-horses' | 'race-registration' | 'hire-jockey' | 'invitations' | 'my-registrations'

// ─── Helpers ──────────────────────────────────────────────────────────────────
export function horseAvatarUrl(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const idx = Math.abs(hash) % 50;
  return `https://loremflickr.com/400/400/horse?lock=${idx}`;
}

function statusConfig(status: string) {
  const map: Record<string, { cls: string; label: string; icon: any; dotCls: string; badgeCls: string }> = {
    PENDING:  { cls: 'border-amber-500/30 bg-amber-500/10 text-amber-600',  label: 'Chờ duyệt', icon: <AlertTriangle className="w-3 h-3 mr-1" />, dotCls: 'pending', badgeCls: 'hm-badge-pending' },
    APPROVED: { cls: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600', label: 'Đã duyệt', icon: <Check className="w-3 h-3 mr-1" />, dotCls: 'approved', badgeCls: 'hm-badge-approved' },
    REJECTED: { cls: 'border-red-500/30 bg-red-500/10 text-red-600', label: 'Bị từ chối', icon: <X className="w-3 h-3 mr-1" />, dotCls: 'rejected', badgeCls: 'hm-badge-rejected' },
    CONFIRMED: { cls: 'border-violet-500/30 bg-violet-500/10 text-violet-400', label: 'Đã chốt', icon: <Check className="w-3 h-3 mr-1" />, dotCls: 'confirmed', badgeCls: 'hm-badge-confirmed' },
  }
  return map[status] ?? { cls: 'border-slate-500/30 bg-slate-500/10 text-slate-400', label: status, icon: null, dotCls: '', badgeCls: 'hm-badge-muted' }
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export function HorsesPage() {
  const [activeTab, setActiveTab] = useState<Tab>('my-horses')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [horses, setHorses] = useState<Horse[]>([])
  const [races, setRaces] = useState<Race[]>([])
  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [jockeys, setJockeys] = useState<Jockey[]>([])
  const [invitations, setInvitations] = useState<any[]>([])

  const [selectedHorseId, setSelectedHorseId] = useState<string>('')
  const [jockeySearch, setJockeySearch] = useState<string>('')
  const [inviteRaceId, setInviteRaceId] = useState<string>('')
  const [registrations, setRegistrations] = useState<{ race: Race; horseId: string; horseName: string; status: string; rejectionReason?: string; confirmedByOwner?: boolean; registrationId?: string; jockeyId?: any; raceId?: string; id?: string; _id?: string }[]>([])
  // Races that the selected horse has APPROVED registration for (used in hire-jockey tab)
  const [horseRegisteredRaces, setHorseRegisteredRaces] = useState<{ raceId: string; raceName: string; status: string }[]>([])

  // Pagination
  const [horsePage, setHorsePage] = useState(1)
  const PAGE_SIZE = 6
  
  const [jockeyPage, setJockeyPage] = useState(1)
  const JOCKEY_PAGE_SIZE = 10

  const [tournamentPage, setTournamentPage] = useState(1)
  const TOURNAMENT_PAGE_SIZE = 10

  const [registrationPage, setRegistrationPage] = useState(1)
  const REGISTRATION_PAGE_SIZE = 10

  const [invitationPage, setInvitationPage] = useState(1)
  const INVITATION_PAGE_SIZE = 10

  const [occupiedJockeys, setOccupiedJockeys] = useState<Set<string>>(new Set())

  // Update occupied jockeys when the selected race or horse changes
  useEffect(() => {
    if (!inviteRaceId) {
      setOccupiedJockeys(new Set())
      return
    }
    let isMounted = true
    getRaceHorses(inviteRaceId)
      .then(list => {
        if (!isMounted) return
        const busy = new Set<string>()
        list.forEach((entry: any) => {
          // If a jockey is confirmed for a horse that is NOT the currently selected horse
          if (entry.jockeyId && String(entry.horseId).trim() !== String(selectedHorseId).trim()) {
            if (entry.status === 'CONFIRMED' || entry.registrationStatus === 'CONFIRMED') {
              busy.add(String(entry.jockeyId).trim())
              if (entry.jockey?.userId?._id) busy.add(String(entry.jockey.userId._id).trim())
              if (entry.jockey?.userId?.id) busy.add(String(entry.jockey.userId.id).trim())
              if (typeof entry.jockey?.userId === 'string') busy.add(String(entry.jockey.userId).trim())
            }
          }
        })
        setOccupiedJockeys(busy)
      })
      .catch(console.error)
    return () => { isMounted = false }
  }, [inviteRaceId, selectedHorseId])

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

  // Filters for My Registrations tab
  const [regSearch, setRegSearch] = useState<string>('')
  const [myRegFilter_HorseId, setMyRegFilter_HorseId] = useState<string>('')
  const [myRegFilter_TournamentId, setMyRegFilter_TournamentId] = useState<string>('')

  // Filter for Tournaments tab (Tab 2)
  const [tournamentSearch, setTournamentSearch] = useState<string>('')
  const [tournamentFilter_Id, setTournamentFilter_Id] = useState<string>('')
  const [tournamentFilter_Schedule, setTournamentFilter_Schedule] = useState<string>('')

  // Filter for Invitations tab
  const [inviteSearch, setInviteSearch] = useState<string>('')

  // Modal states for Registration
  const [showRegisterModal, setShowRegisterModal] = useState(false)
  const [registerTargetTournament, setRegisterTargetTournament] = useState<any>(null)
  const [selectedHorsesForRegister, setSelectedHorsesForRegister] = useState<Set<string>>(new Set())

  // Modal states for Jockey Invitation
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [inviteTargetJockey, setInviteTargetJockey] = useState<any>(null)
  const [inviteModalHorseId, setInviteModalHorseId] = useState('')
  const [inviteModalRaceId, setInviteModalRaceId] = useState('')

  const inviteModalRaces = useMemo(() => {
    if (!inviteModalHorseId) return [];
    return registrations
      .filter((r: any) => String(r.horseId) === inviteModalHorseId && r.status === 'APPROVED' && r.race)
      .map((r: any) => ({
        raceId: String(r.race.id || r.race._id),
        raceName: r.race.name
      }))
  }, [inviteModalHorseId, registrations]);

  // Set default race when horse changes
  useEffect(() => {
    if (inviteModalRaces.length > 0 && !inviteModalRaces.some((r: any) => r.raceId === inviteModalRaceId)) {
      setInviteModalRaceId(inviteModalRaces[0].raceId);
    } else if (inviteModalRaces.length === 0) {
      setInviteModalRaceId('');
    }
  }, [inviteModalRaces, inviteModalRaceId]);

  // Set default race when tournament changes
  useEffect(() => {
    if (inviteModalRaces.length > 0 && !inviteModalRaces.some((r: any) => r.raceId === inviteModalRaceId)) {
      setInviteModalRaceId(inviteModalRaces[0].raceId);
    } else if (inviteModalRaces.length === 0) {
      setInviteModalRaceId('');
    }
  }, [inviteModalRaces, inviteModalRaceId]);



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

  useEffect(() => { loadData() }, [])

  // Socket.IO real-time updates
  useEffect(() => {
    socket.on('tournament_updated', loadData)
    socket.on('registration_updated', loadData)
    return () => {
      socket.off('tournament_updated', loadData)
      socket.off('registration_updated', loadData)
    }
  }, [])

  useEffect(() => {
    if (activeTab === 'invitations') {
      if (horses.length > 0) {
        Promise.all(
          horses.map(h => 
            getHorseJockeys(String(h.id || h._id)).then(invs => invs.map((inv: any) => ({ ...inv, horseId: String(h.id || h._id) })))
          )
        ).then(results => setInvitations(results.flat())).catch(() => setInvitations([]))
      } else {
        setInvitations([])
      }
    } else if (activeTab === 'hire-jockey' && selectedHorseId) {
      getHorseJockeys(selectedHorseId).then(setInvitations).catch(() => setInvitations([]))
    }
  }, [selectedHorseId, activeTab, horses])

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

  const loadData = async (isBackground = false) => {
    if (!isBackground && horses.length === 0) setLoading(true)
    setError(null)
    const partialErrors: string[] = []
    try {
      const hList = await getHorses().catch(() => { partialErrors.push('Không tải được danh sách ngựa'); return [] })
      setHorses(hList)

      // Load tournaments & races song song
      const [tList, rList] = await Promise.all([
        getTournaments().catch(() => { partialErrors.push('Không tải được danh sách giải đấu'); return [] as Tournament[] }),
        getRaces().catch(() => { partialErrors.push('Không tải được danh sách vòng đua'); return [] as Race[] }),
      ])
      // Chỉ hiển thị giải đấu đang mở đăng ký (PUBLISHED / ONGOING)
      const openTournaments = tList.filter((t) => ['PUBLISHED', 'ONGOING', 'DRAFT'].includes(t.status?.toUpperCase?.() || ''))
      setTournaments(openTournaments)

      const jList = await searchJockeys({ limit: 100 }).catch(() => { partialErrors.push('Không tải được danh sách nài ngựa'); return [] })
      setJockeys(jList)
      
      // Load registrations for our horses in all races for synchronization
      const myHorseIds = new Set(hList.map((h) => String(h.id || h._id)))
      const regs: { race: Race; horseId: string; horseName: string; status: string; rejectionReason?: string; confirmedByOwner?: boolean; registrationId?: string; jockeyId?: any }[] = []
      
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
                  jockeyId: entry.jockeyId || entry.jockey?._id || entry.jockey?.id || entry.jockey
                })
              }
            })
          } catch {
            console.warn(`Error loading horses for race ${race.id}`)
          }
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

      if (activeTab === 'hire-jockey') {
        const availableRaces = rList.filter((race) => ['SCHEDULED', 'CONFIRMED', 'UPCOMING'].includes(race.status?.toUpperCase() || ''))
        setRaces(availableRaces)
        if (availableRaces.length > 0 && !inviteRaceId) {
          setInviteRaceId(String(availableRaces[0].id || availableRaces[0]._id))
        }
        if (selectedHorseId) {
          const iList = await getHorseJockeys(selectedHorseId).catch(() => { partialErrors.push('Không tải được lời mời'); return [] })
          setInvitations(iList)
        }
      } else if (activeTab === 'invitations') {
        const results = await Promise.all(
          hList.map((h: any) => getHorseJockeys(String(h.id || h._id)).then(invs => invs.map((inv: any) => ({ ...inv, horseId: String(h.id || h._id) }))))
        ).catch(() => { partialErrors.push('Không tải được lời mời'); return [] })
        setInvitations(results?.flat() || [])
        setRaces(rList)
      } else {
        setRaces(rList)
      }

      if (partialErrors.length > 0) {
        const uniqueErrors = Array.from(new Set(partialErrors))
        setError(`Đã xảy ra một số lỗi: ${uniqueErrors.join(', ')}`)
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message)
    } finally {
      setLoading(false)
    }
  }

  // ── Horse CRUD ──────────────────────────────────────────────────────────────
  const [formError, setFormError] = useState<string | null>(null)

  const openHorseModal = (h: Horse | null) => {
    setSelectedHorse(h)
    setFormError(null)
    setHorseForm(
      h
        ? { name: h.name, breed: h.breed || '', age: h.age || 0, weight: h.weight || 0, color: h.color || '', gender: h.gender || 'MALE', origin: h.origin || '', healthCertUrl: h.healthCertUrl || '' }
        : { name: '', breed: '', age: 3, weight: 450, color: '', gender: 'MALE', origin: '', healthCertUrl: '' },
    )
    setShowHorseModal(true)
  }

  const handleSaveHorse = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)

    if (horseForm.name.trim().length < 2) {
      setFormError('Tên ngựa phải có ít nhất 2 ký tự')
      return
    }
    if (horseForm.age < 1 || horseForm.age > 30) {
      setFormError('Tuổi ngựa phải từ 1 đến 30')
      return
    }
    if (horseForm.weight < 200 || horseForm.weight > 700) {
      setFormError('Cân nặng phải từ 200kg đến 700kg')
      return
    }

    try {
      const payload = { ...horseForm };
      if (!payload.healthCertUrl || payload.healthCertUrl.trim() === '') {
        payload.healthCertUrl = 'https://example.com/no-cert-provided.pdf';
      }

      if (selectedHorse) {
        await updateHorse(selectedHorse.id, payload)
        showToast(`Đã cập nhật thông tin ngựa ${horseForm.name}`)
      } else {
        await createHorse(payload)
        showToast(`Đã thêm ngựa ${horseForm.name} — Đang chờ Admin duyệt`)
      }
      setShowHorseModal(false)
      loadData(true)
    } catch (err: any) {
      let errorMsg = err.response?.data?.message;
      if (Array.isArray(errorMsg)) {
        errorMsg = errorMsg.join(', ');
      }
      showToast(errorMsg || 'Lỗi khi lưu hồ sơ ngựa', 'error')
    }
  }

  const handleDeleteHorse = async (id: string, name: string) => {
    if (!window.confirm(`Xóa ngựa "${name}"?`)) return
    
    // Optimistic UI
    setHorses(prev => prev.filter(h => h.id !== id))
    
    try {
      await deleteHorse(id)
      showToast(`Đã xóa ngựa ${name}`)
      loadData(true)
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Không thể xóa (Ngựa đang tham gia cuộc đua)', 'error')
      loadData(true) // rollback
    }
  }

  // ── Actions ─────────────────────────────────────────────────────────────────
  /**
   * Đăng ký ngựa vào một Giải Đấu (Tournament).
   * FE tự động đăng ký ngựa vào tất cả các Race SCHEDULED thuộc giải đó.
   * Admin sau đó sẽ phân bổ ngựa vào các vòng đấu cụ thể.
   */
  const handleRegisterTournament = async (tournament: Tournament, targetHorseIds?: string[]) => {
    const finalHorseIds = targetHorseIds && targetHorseIds.length > 0 ? targetHorseIds : (selectedHorseId ? [selectedHorseId] : [])
    if (finalHorseIds.length === 0) return showToast('Vui lòng chọn ít nhất một ngựa', 'warning')
    
    try {
      let totalSuccess = 0
      let totalAlready = 0
      let totalFailed = 0
      
      for (const horseId of finalHorseIds) {
        const horse = horses.find((h) => String(h.id || h._id) === horseId)
        if (horse?.status !== 'APPROVED') {
          totalFailed++
          continue
        }
        
        const result = await registerHorseForTournament(horseId, String(tournament.id))
        totalSuccess += result.success.length
        totalAlready += result.alreadyRegistered.length
        totalFailed += result.failed.length
      }
      
      if (totalSuccess > 0) {
        showToast(`✅ Đã gửi đăng ký ${totalSuccess} ngựa cho giải "${tournament.name}". Admin sẽ phân bổ vào vòng đấu phù hợp.`, 'success')
      } else if (totalAlready > 0 && totalSuccess === 0) {
        showToast(`ℹ️ Các ngựa đã có đăng ký trong giải "${tournament.name}" trước đó rồi.`, 'info')
      } else {
        showToast(`❌ Không thể đăng ký ngựa vào giải "${tournament.name}". Vui lòng thử lại.`, 'error')
        return
      }
      
      // Reset selected horses and reload data
      setSelectedHorsesForRegister(new Set())
      setSelectedHorseId('')
      loadData(true)
    } catch (err: any) {
      showToast(err.message || err.response?.data?.message || 'Không thể đăng ký giải đấu', 'error')
    }
  }

  const handleInviteJockey = async (jockeyId: string, jockeyName: string, targetHorseId?: string, targetRaceId?: string) => {
    const finalHorseId = targetHorseId || inviteModalHorseId || selectedHorseId
    const finalRaceId = targetRaceId || inviteModalRaceId || inviteRaceId

    if (!finalHorseId) return showToast('Vui lòng chọn ngựa', 'warning')
    if (!finalRaceId) return showToast('Vui lòng chọn cuộc đua', 'warning')

    const cleanHorseId = String(finalHorseId).trim()
    const cleanRaceId = String(finalRaceId).trim()
    const cleanJockeyId = String(jockeyId).trim()

    const horse = horses.find((h) => String(h.id || h._id).trim() === cleanHorseId)
    const race = races.find((r) => String(r.id || r._id).trim() === cleanRaceId)
    const registeredRace = horseRegisteredRaces.find((r) => r.raceId === cleanRaceId)
    
    if (!horse) return showToast('Ngựa không hợp lệ. Vui lòng chọn ngựa khác.', 'error')
    if (!race && !registeredRace) return showToast('Cuộc đua không hợp lệ. Vui lòng chọn lại cuộc đua.', 'error')

    let registeredEntry: any = undefined
    try {
      const raceHorses = await getRaceHorses(cleanRaceId)
      const entries = Array.isArray(raceHorses) ? raceHorses : (raceHorses.horses || [])

      registeredEntry = entries.find((entry: any) => {
        const entryHorseId = String(
          entry.horseId ||
          (entry.horse && (entry.horse._id || entry.horse.id)) ||
          entry._id ||
          entry.id ||
          ''
        ).trim()
        return entryHorseId === cleanHorseId
      })

      if (!registeredEntry) {
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
      if (error?.response?.status === 401) {
        return 
      }
      const errMsg = error?.response?.data?.message || error?.message || 'Lỗi kiểm tra đăng ký'
      return showToast(`Không thể xác minh trạng thái đăng ký: ${errMsg}. Vui lòng đăng ký ngựa vào cuộc đua trước.`, 'error')
    }

    try {
      const regId = registeredEntry?.registrationId || registeredEntry?.id || ''
      const raceNameStr = race?.name || registeredEntry?.raceName || ''
      const fullMessage = `Mời bạn cưỡi ngựa của tôi|RACE_ID:${cleanRaceId}`
      await sendJockeyInvitation(cleanHorseId, cleanJockeyId, cleanRaceId, fullMessage, regId, raceNameStr)
      showToast(`Đã gửi lời mời đến Jockey ${jockeyName}`)
      
      // Cập nhật UI ngay lập tức (Optimistic update)
      setInvitations(prev => {
        const exists = prev.find(i => String(i.jockeyId?._id || i.jockeyId) === cleanJockeyId && String(i.raceId?._id || i.raceId) === cleanRaceId)
        if (exists) return prev;
        return [...prev, {
          id: 'temp-' + Date.now(),
          jockeyId: cleanJockeyId,
          raceId: cleanRaceId,
          status: 'PENDING'
        } as any]
      })
      
      // Tải lại danh sách lời mời ngầm để đảm bảo đồng bộ
      getHorseJockeys(cleanHorseId).then(setInvitations).catch(() => {})
    } catch (err: any) {
      const msg = err.response?.data?.message || err.response?.data?.error || 'Không thể gửi lời mời. Vui lòng kiểm tra lại trạng thái ngựa và cuộc đua.'
      showToast(msg, 'error')
    }
  }

  const handleConfirmJockey = async (horseId: string, jockeyId: string, raceId: string, jockeyName: string, inviteId: string) => {
    if (!horseId) return
    try {
      await confirmJockey(horseId, jockeyId, raceId)
      showToast(`Đã chốt Jockey ${jockeyName} thành công!`)
      
      // OPTIMISTIC UPDATE: Update UI instantly without waiting for backend cache
      setInvitations(prev => prev.map(inv => {
        if (String(inv.id || inv._id) === String(inviteId)) {
          return { ...inv, status: 'CONFIRMED' }
        }
        return inv
      }))
      
      setRegistrations(prev => prev.map(reg => {
        if (String(reg.horseId).trim() === String(horseId).trim() && 
            (String(reg.race?.id || reg.race?._id || reg.raceId || '').trim() === raceId || 
             String(reg.registrationId || reg.id || reg._id).trim() === raceId)) {
          return { ...reg, jockeyId: jockeyId }
        }
        return reg
      }))

      // Wait briefly to allow backend DB transactions and hooks to finish
      await new Promise(resolve => setTimeout(resolve, 500))
      await loadData(true)
      
      let newInvites: any[] = []
      if (activeTab === 'invitations') {
        const results = await Promise.all(
          horses.map(h => getHorseJockeys(String(h.id || h._id)).then(invs => invs.map((inv: any) => ({ ...inv, horseId: String(h.id || h._id) }))))
        )
        newInvites = results.flat()
      } else {
        newInvites = await getHorseJockeys(horseId)
      }
      
      // Merge optimistic status into fresh data in case of backend cache delay
      setInvitations(prevOpt => {
        return newInvites.map(newInv => {
          const oldInv = prevOpt.find(i => i.id === newInv.id || i._id === newInv._id)
          if (oldInv && oldInv.status === 'CONFIRMED' && newInv.status !== 'CONFIRMED') {
            return { ...newInv, status: 'CONFIRMED' }
          }
          return newInv
        })
      })
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Không thể chốt Jockey', 'error')
    }
  }

  const handleConfirmRace = async (horseId: string, raceId: string) => {
    try {
      await confirmRaceParticipation(horseId, raceId)
      showToast('Đã xác nhận tham gia đua thành công!')
      loadData(true)
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
      if (!name.includes(jockeySearch.toLowerCase())) return false
      
      const jockeyIdStr = String(j.id).trim()
      const userIdStr1 = String(j.userId?._id || '').trim()
      const userIdStr2 = String(j.userId?.id || '').trim()
      const userIdStr3 = String(j.userId || '').trim()
      
      if (occupiedJockeys.has(jockeyIdStr) || 
          (userIdStr1 && occupiedJockeys.has(userIdStr1)) || 
          (userIdStr2 && occupiedJockeys.has(userIdStr2)) || 
          (userIdStr3 && occupiedJockeys.has(userIdStr3))) {
        return false
      }
      
      return true
    })
    .sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0
      if (dateA !== dateB) return dateB - dateA
      return String(b.id).localeCompare(String(a.id))
    })

  // registrationsByTournament was removed

  const getRegistrationTournamentId = (reg: { race: Race }) => {
    const tournament = reg.race?.tournamentId as any
    return String(tournament?.id || tournament?._id || tournament || '')
  }

  const getRegistrationTournamentName = (reg: { race: Race }) => {
    const tournament = reg.race?.tournamentId as any
    const tournamentId = getRegistrationTournamentId(reg)
    return tournament?.name || tournaments.find((t) => String(t.id || t._id) === tournamentId)?.name || 'Giải đấu'
  }

  // Filtered registrations for My Registrations tab
  const filteredRegistrations = registrations.filter(reg => {
    if (regSearch) {
      const search = regSearch.toLowerCase();
      const horseName = (horses.find(h => String(h.id || h._id) === String(reg.horseId))?.name || '').toLowerCase();
      const tId = getRegistrationTournamentId(reg);
      const tournamentName = (tournaments.find(t => String(t.id || t._id) === tId)?.name || 'Giải đấu').toLowerCase();
      if (!horseName.includes(search) && !tournamentName.includes(search)) return false;
    }
    
    if (myRegFilter_HorseId && String(reg.horseId) !== myRegFilter_HorseId) return false;
    
    if (myRegFilter_TournamentId) {
      const tId = getRegistrationTournamentId(reg);
      if (tId !== myRegFilter_TournamentId) return false;
    }
    
    return true
  })

  const myRegHorseOptions = useMemo(() => {
    const horseIds = Array.from(new Set(registrations.map(r => String(r.horseId))));
    return horseIds.map(id => horses.find(h => String(h.id || h._id) === id)).filter(Boolean) as Horse[];
  }, [registrations, horses]);

  const myRegTournamentOptions = useMemo(() => {
    const tIds = Array.from(new Set(registrations.map(r => getRegistrationTournamentId(r))));
    return tIds.map(id => tournaments.find(t => String(t.id || t._id) === id) || { id, name: registrations.find(r => getRegistrationTournamentId(r) === id)?.race?.name || 'Giải đấu' }).filter(Boolean) as Tournament[];
  }, [registrations, tournaments]);

  // Filtered invitations for Invitations tab
  const filteredInvitations = invitations.filter(inv => {
    if (inviteSearch) {
      const search = inviteSearch.toLowerCase();
      const jockeyName = (inv.jockeyId?.userId?.fullName || inv.jockeyId?.userId?.name || inv.jockeyId?.fullName || inv.jockeyId?.name || 'Jockey').toLowerCase();
      const raceName = (inv.raceId?.name || inv.race?.name || 'Vòng đua').toLowerCase();
      if (!jockeyName.includes(search) && !raceName.includes(search)) return false;
    }
    return true
  })

  // Giải đấu hiển thị trong tab Đăng Ký Giải
  const filteredTournaments = tournaments
    .filter(t => {
      if (tournamentSearch && !t.name.toLowerCase().includes(tournamentSearch.toLowerCase())) return false;
      if (tournamentFilter_Id && String(t.id || t._id) !== tournamentFilter_Id) return false;
      if (tournamentFilter_Schedule) {
        const d = new Date(t.startDate);
        const scheduleKey = `${d.getMonth() + 1}-${d.getFullYear()}`;
        if (scheduleKey !== tournamentFilter_Schedule) return false;
      }
      return true;
    })
    .sort((a, b) => {
      const dateA = a.startDate ? new Date(a.startDate).getTime() : 0;
      const dateB = b.startDate ? new Date(b.startDate).getTime() : 0;
      return dateA - dateB;
    });

  const tournamentOptionsTab2 = useMemo(() => {
    return tournaments;
  }, [tournaments]);

  const scheduleOptionsTab2 = useMemo(() => {
    const dates = tournaments.map(t => new Date(t.startDate));
    const unique = Array.from(new Set(dates.map(d => `${d.getMonth() + 1}-${d.getFullYear()}`)));
    return unique.sort((a, b) => {
      const [mA, yA] = a.split('-');
      const [mB, yB] = b.split('-');
      return new Date(Number(yA), Number(mA) - 1).getTime() - new Date(Number(yB), Number(mB) - 1).getTime();
    });
  }, [tournaments]);

  // Cleaned up unused registrationsByTournament

  const registeredTournamentGroups = useMemo(() => {
    type Group = {
      key: string
      tournamentId: string
      tournamentName: string
      horseId: string
      horseName: string
      registrations: typeof filteredRegistrations
      status: string
      pendingCount: number
      approvedCount: number
      confirmedCount: number
      rejectedCount: number
    }

    const map = new Map<string, Group>()
    filteredRegistrations.forEach((reg) => {
      const tournamentId = getRegistrationTournamentId(reg) || `race-${reg.race?.id || reg.raceId}`
      const horseId = String(reg.horseId || '')
      const key = `${tournamentId}:${horseId}`
      if (!map.has(key)) {
        map.set(key, {
          key,
          tournamentId,
          tournamentName: getRegistrationTournamentName(reg),
          horseId,
          horseName: reg.horseName,
          registrations: [],
          status: 'PENDING_APPROVAL',
          pendingCount: 0,
          approvedCount: 0,
          confirmedCount: 0,
          rejectedCount: 0,
        })
      }
      map.get(key)!.registrations.push(reg)
    })

    const groups = Array.from(map.values()).map((group) => {
      group.registrations.forEach((reg) => {
        const status = String(reg.status || '').toUpperCase()
        if (status === 'CONFIRMED') group.confirmedCount += 1
        else if (status === 'APPROVED') group.approvedCount += 1
        else if (status === 'REJECTED') group.rejectedCount += 1
        else group.pendingCount += 1
      })

      if (group.confirmedCount > 0) group.status = 'CONFIRMED'
      else if (group.approvedCount > 0) group.status = 'APPROVED'
      else if (group.pendingCount > 0) group.status = 'PENDING_APPROVAL'
      else if (group.rejectedCount === group.registrations.length) group.status = 'REJECTED'

      return group
    })

    return groups.sort((a, b) => {
      const aDate = Math.min(...a.registrations.map((reg) => reg.race?.scheduledAt ? new Date(reg.race.scheduledAt).getTime() : Number.MAX_SAFE_INTEGER))
      const bDate = Math.min(...b.registrations.map((reg) => reg.race?.scheduledAt ? new Date(reg.race.scheduledAt).getTime() : Number.MAX_SAFE_INTEGER))
      return aDate - bDate
    })
  }, [filteredRegistrations, tournaments])

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <div className="hm-page space-y-6">
      {/* ── Page Header ─────────────────────────────────────────────────────── */}
      <ScrollReveal direction="up" distance={60} duration={0.8}>
        <div className="flex items-center justify-between gap-4 mb-2">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.2), rgba(16,185,129,0.15))', border: '1px solid rgba(139,92,246,0.25)' }}>
                <Sparkles className="h-6 w-6 text-violet-400" />
              </div>
              <div>
                <h1 className="text-3xl font-black text-[color:var(--text)] m-0 tracking-tight">Quản Lý Ngựa</h1>
                <p className="text-sm font-medium mt-0.5" style={{ color: 'var(--text-muted)' }}>
                  Quản lý đàn ngựa, đăng ký thi đấu và tuyển Jockey chuyên nghiệp
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {activeTab === 'my-horses' && (
              <Magnetic intensity={0.2}>
                <button onClick={() => openHorseModal(null)} className="hm-btn-cta violet">
                  <Plus className="w-4 h-4" /> Thêm Ngựa Mới
                </button>
              </Magnetic>
            )}
            <button onClick={() => loadData()} disabled={loading} className="hm-btn-cta bg-[var(--surface-3)] text-[var(--text-2)] shadow-none border border-[var(--border)] hover:bg-[var(--surface-2)]">
              <RefreshCw className={`w-4 h-4 text-[var(--text-2)] ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </ScrollReveal>

      {/* ── Tab Navigation ──────────────────────────────────────────────────── */}
      <Tabs value={activeTab} onValueChange={(v: any) => startTransition(() => setActiveTab(v))}>
        <ScrollReveal direction="up" distance={20} duration={0.5} delay={0.1}>
          <div className="mb-8">
            <TabsList className="!bg-[var(--surface-2)] border border-[var(--border)] p-1.5 rounded-2xl shadow-inner flex flex-wrap gap-1 h-auto w-fit m-0 backdrop-blur-md">
              <TabsTrigger value="my-horses" className="py-2.5 px-4 rounded-xl font-bold transition-all text-sm text-[var(--text-2)] data-active:!bg-[var(--surface)] data-active:!text-[var(--primary)] data-active:!shadow-sm"><Trophy className="w-4 h-4 mr-2" /> Hồ Sơ Ngựa</TabsTrigger>
              <TabsTrigger value="race-registration" className="py-2.5 px-4 rounded-xl font-bold transition-all text-sm text-[var(--text-2)] data-active:!bg-[var(--surface)] data-active:!text-[var(--primary)] data-active:!shadow-sm"><Zap className="w-4 h-4 mr-2" /> Đăng Ký Giải</TabsTrigger>
              <TabsTrigger value="my-registrations" className="py-2.5 px-4 rounded-xl font-bold transition-all text-sm text-[var(--text-2)] data-active:!bg-[var(--surface)] data-active:!text-[var(--primary)] data-active:!shadow-sm">
                <FileCheck className="w-4 h-4 mr-2" /> Đã Đăng Ký
                {registrations.length > 0 && <span className="hm-tab-count">{registrations.length}</span>}
              </TabsTrigger>
              <TabsTrigger value="hire-jockey" className="py-2.5 px-4 rounded-xl font-bold transition-all text-sm text-[var(--text-2)] data-active:!bg-[var(--surface)] data-active:!text-[var(--primary)] data-active:!shadow-sm"><Users className="w-4 h-4 mr-2" /> Tuyển Jockey</TabsTrigger>
              <TabsTrigger value="invitations" className="py-2.5 px-4 rounded-xl font-bold transition-all text-sm text-[var(--text-2)] data-active:!bg-[var(--surface)] data-active:!text-[var(--primary)] data-active:!shadow-sm">
                <Send className="w-4 h-4 mr-2" /> Lời Mời
                {invitations.length > 0 && <span className="hm-tab-count">{invitations.length}</span>}
              </TabsTrigger>
            </TabsList>
          </div>
        </ScrollReveal>

        {/* ═══════════════════════════════════════════════════════════════════
            TAB 1: Hồ Sơ Ngựa (My Horses)
        ═══════════════════════════════════════════════════════════════════ */}
        <TabsContent value="my-horses">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {[1, 2, 3].map((i) => (
                <div key={i} className="hm-skeleton h-72 rounded-2xl" />
              ))}
            </div>
          ) : horses.length === 0 ? (
            <div className="hm-empty">
              <div className="hm-empty-icon">🐴</div>
              <h3 className="text-xl font-bold text-[color:var(--text)] mb-2">Chưa có ngựa nào</h3>
              <p className="text-sm font-medium mb-6" style={{ color: 'var(--text-muted)', maxWidth: 360, margin: '0 auto 24px' }}>Bạn cần thêm hồ sơ ngựa để có thể đăng ký tham gia các giải đấu hấp dẫn.</p>
              <button onClick={() => openHorseModal(null)} className="hm-btn-cta violet">
                <Plus className="w-4 h-4" /> Thêm ngựa ngay
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {horses.slice((horsePage - 1) * PAGE_SIZE, horsePage * PAGE_SIZE).map((h, index) => {
                  const sc = statusConfig(h.status || 'PENDING')
                  return (
                    <ScrollReveal key={h.id} direction="up" distance={40} duration={0.6} delay={index * 0.08}>
                      <div className="hm-glass-card hm-glass-card-hover h-full flex flex-col group">
                        {/* Horse Header */}
                        <div className="p-5 flex items-start gap-4">
                          <img src={horseAvatarUrl(h.name)} alt={h.name} className="w-16 h-16 rounded-xl object-cover shrink-0 group-hover:scale-105 transition-transform duration-300" style={{ border: '2px solid var(--text-muted)', boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }} />
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start gap-2 mb-1">
                              <h3 className="font-extrabold text-lg text-[color:var(--text)] truncate m-0">{h.name}</h3>
                              <span className={`hm-badge ${sc.badgeCls} text-[10px]`}>
                                <span className={`hm-status-dot ${sc.dotCls}`} /> {sc.label}
                              </span>
                            </div>
                            <p className="text-xs font-medium truncate" style={{ color: 'var(--text-muted)' }}>{h.breed || 'Không rõ giống'} · {h.origin || 'Không rõ xuất xứ'}</p>
                            <div className="flex gap-2 mt-3">
                              <span className="hm-badge hm-badge-info text-[10px] py-0.5 px-2"><Activity className="w-3 h-3 mr-0.5" /> {(h as any).stats?.races ?? 0} trận</span>
                              <span className="hm-badge hm-badge-pending text-[10px] py-0.5 px-2"><Trophy className="w-3 h-3 mr-0.5" /> {(h as any).stats?.wins ?? 0} thắng</span>
                            </div>
                          </div>
                        </div>

                        {/* Stats Row */}
                        <div className="px-5 pb-3">
                          <div className="grid grid-cols-3 gap-2">
                            {[
                              { val: h.age, label: 'Tuổi' },
                              { val: `${h.weight}`, label: 'Kg' },
                              { val: h.gender === 'MALE' ? 'Đực' : 'Cái', label: 'Giới Tính' },
                            ].map((s, si) => (
                              <div key={si} className="text-center py-2 px-2 rounded-lg bg-[var(--surface-2)] border border-[var(--border)]">
                                <div className="font-extrabold text-sm text-[color:var(--text)]">{s.val}</div>
                                <div className="text-[9px] uppercase font-bold tracking-widest text-[color:var(--text-muted)]">{s.label}</div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Footer Actions */}
                        <div className="mt-auto px-5 py-3.5 flex items-center justify-between" style={{ borderTop: '1px solid var(--text-muted)' }}>
                          {h.healthCertUrl ? (
                            <a href={h.healthCertUrl} target="_blank" rel="noreferrer" className="text-xs font-bold flex items-center gap-1 transition-colors hover:opacity-80" style={{ color: '#34d399' }}>
                              <ShieldCheck className="w-4 h-4" /> Sức Khỏe
                            </a>
                          ) : (
                            <span className="text-xs font-bold flex items-center gap-1" style={{ color: '#fbbf24' }}><AlertTriangle className="w-4 h-4" /> Chưa duyệt</span>
                          )}
                          <div className="flex gap-1.5">
                            <button className="p-1.5 rounded-lg transition-all hover:scale-110" style={{ color: '#a78bfa', background: 'rgba(139,92,246,0.08)' }} onClick={() => openHorseResults(h.id, h.name)} title="Kết quả">
                              <TrendingUp className="w-4 h-4" />
                            </button>
                            <button className="p-1.5 rounded-lg transition-all hover:scale-110" style={{ color: '#60a5fa', background: 'rgba(59,130,246,0.08)' }} onClick={() => openHorseModal(h)} title="Chỉnh sửa">
                              <Edit className="w-4 h-4" />
                            </button>
                            <button className="p-1.5 rounded-lg transition-all hover:scale-110" style={{ color: '#f87171', background: 'rgba(239,68,68,0.08)' }} onClick={() => handleDeleteHorse(h.id, h.name)} title="Xóa">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
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

        {/* ═══════════════════════════════════════════════════════════════════
            TAB 2: Đăng Ký Giải Đấu (Tournament Registration)
        ═══════════════════════════════════════════════════════════════════ */}
        <TabsContent value="race-registration">
          <div className="space-y-4">
            <div className="flex items-center justify-between px-1 mb-2">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-6 rounded bg-violet-500" />
                <h3 className="text-lg font-black text-[color:var(--text)] tracking-tight">Danh Sách Giải Đấu Đang Mở</h3>
              </div>
              <div className="flex flex-wrap sm:flex-nowrap justify-end items-center gap-2">
                <select
                  className="h-9 py-1 px-2 rounded-xl border border-[rgba(255,255,255,0.08)] bg-[var(--surface-2)] text-xs font-semibold outline-none focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/10 transition-all text-white"
                  value={tournamentFilter_Id}
                  onChange={(e) => { setTournamentFilter_Id(e.target.value); setTournamentPage(1); }}
                >
                  <option value="" className="bg-slate-900 text-white">Tất cả giải đấu</option>
                  {tournamentOptionsTab2.map(t => (
                    <option key={String(t.id || t._id)} value={String(t.id || t._id)} className="bg-slate-900 text-white">{t.name}</option>
                  ))}
                </select>

                <select
                  className="h-9 py-1 px-2 rounded-xl border border-[rgba(255,255,255,0.08)] bg-[var(--surface-2)] text-xs font-semibold outline-none focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/10 transition-all text-white"
                  value={tournamentFilter_Schedule}
                  onChange={(e) => { setTournamentFilter_Schedule(e.target.value); setTournamentPage(1); }}
                >
                  <option value="" className="bg-slate-900 text-white">Mọi lịch trình</option>
                  {scheduleOptionsTab2.map(s => {
                    const [m, y] = s.split('-');
                    return <option key={s} value={s} className="bg-slate-900 text-white">Tháng {m}/{y}</option>
                  })}
                </select>
                
                <div className="relative w-48 sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 z-10 pointer-events-none" style={{ color: 'var(--text-muted)' }} />
                  <input
                    placeholder="Tìm theo tên giải đấu..."
                    className="w-full h-9 py-1 pr-3 rounded-xl border border-[rgba(255,255,255,0.08)] bg-[var(--surface-2)] text-xs font-semibold outline-none focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/10 transition-all text-white"
                    style={{ paddingLeft: '2.5rem' }}
                    value={tournamentSearch}
                    onChange={(e) => { setTournamentSearch(e.target.value); setTournamentPage(1); }}
                  />
                </div>
                <div className="text-xs font-bold text-[color:var(--text-2)] bg-[var(--surface-3)] px-3 py-1.5 rounded-xl border border-[var(--border)] shrink-0">
                  Có <span className="text-violet-400 font-extrabold">{filteredTournaments.length}</span> giải đấu
                </div>
              </div>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[1, 2, 3, 4].map((i) => <div key={i} className="hm-skeleton h-20 rounded-xl" />)}
              </div>
            ) : filteredTournaments.length === 0 ? (
              <div className="hm-empty">
                <div className="hm-empty-icon">🏆</div>
                <h3 className="text-lg font-bold text-[color:var(--text)] mb-1">Không có giải đấu nào đang mở</h3>
                <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Hiện tại chưa có giải đấu nào đang nhận đăng ký. Vui lòng quay lại sau.</p>
                {error && <div className="text-red-400 text-xs mt-3 font-semibold">{error}</div>}
              </div>
            ) : (
              <div className="hm-glass-card overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-[color:var(--text-muted)]">
                    <thead className="text-[10px] uppercase tracking-widest bg-[var(--surface-2)] text-[color:var(--text)] border-b border-[var(--border)]">
                      <tr>
                        <th className="px-5 py-4 font-black">Giải Đấu</th>
                        <th className="px-5 py-4 font-black">Lịch Trình</th>
                        <th className="px-5 py-4 font-black text-right">Tổng Giải Thưởng</th>
                        <th className="px-5 py-4 font-black text-center w-[180px]">Đăng Ký</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border)]">
                      {filteredTournaments.slice((tournamentPage - 1) * TOURNAMENT_PAGE_SIZE, tournamentPage * TOURNAMENT_PAGE_SIZE).map((t) => {
                        const tId = String(t.id)
                        return (
                          <tr key={tId} className="hover:bg-[var(--surface-2)] transition-colors group">
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center shrink-0">
                                  <Trophy className="w-5 h-5 text-violet-400" />
                                </div>
                                <div className="min-w-0">
                                  <div className="font-extrabold text-[color:var(--text)] text-sm truncate">{t.name}</div>
                                  <div className="text-[11px] font-medium mt-0.5 truncate max-w-[200px]" style={{ color: 'var(--text-muted)' }}>
                                    {t.description || 'Chưa có mô tả'}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-5 py-4">
                              <div className="flex flex-col gap-1 text-xs">
                                <span className="flex items-center gap-1.5 font-bold text-[color:var(--text)]">
                                  <CalendarRange className="w-3.5 h-3.5 text-emerald-400" /> {new Date(t.startDate).toLocaleDateString('vi-VN')}
                                </span>
                                <span className="flex items-center gap-1.5 font-medium truncate max-w-[150px]">
                                  <MapPin className="w-3 h-3 text-sky-400" /> {t.venue || t.location || 'Chưa rõ địa điểm'}
                                </span>
                              </div>
                            </td>
                            <td className="px-5 py-4 text-right">
                              <div className="font-extrabold text-amber-400">
                                {t.prizePool?.toLocaleString('vi-VN')} {t.currency || 'VND'}
                              </div>
                            </td>
                            <td className="px-5 py-4">
                              {t.registrationCloseDate && new Date() > new Date(t.registrationCloseDate) ? (
                                <button disabled className="w-full text-xs py-2 rounded-lg bg-[var(--surface-3)] text-muted cursor-not-allowed font-medium border border-[rgba(255,255,255,0.05)]">
                                  Đã hết hạn
                                </button>
                              ) : (
                                <button 
                                  onClick={() => {
                                    setRegisterTargetTournament(t)
                                    setShowRegisterModal(true)
                                  }} 
                                  className="hm-btn-cta w-full text-xs py-2 shadow-none"
                                >
                                  <Zap className="w-3.5 h-3.5 mr-1" /> Đăng Ký
                                </button>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            {filteredTournaments.length > TOURNAMENT_PAGE_SIZE && (
              <div className="mt-6 flex justify-center">
                <Pagination total={filteredTournaments.length} page={tournamentPage} pageSize={TOURNAMENT_PAGE_SIZE} onChange={setTournamentPage} />
              </div>
            )}
          </div>
        </TabsContent>

        {/* ═══════════════════════════════════════════════════════════════════
            TAB 3: Đã Đăng Ký (My Registrations)
        ═══════════════════════════════════════════════════════════════════ */}
        <TabsContent value="my-registrations">
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between px-1 gap-4 mb-2">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-6 rounded bg-violet-500" />
                <h3 className="text-lg font-black text-[color:var(--text)] tracking-tight">Lịch Sử Đăng Ký Của Bạn</h3>
              </div>
              <div className="flex flex-wrap sm:flex-nowrap justify-end items-center gap-2">
                <select
                  className="h-9 py-1 px-2 rounded-xl border border-[rgba(255,255,255,0.08)] bg-[var(--surface-2)] text-xs font-semibold outline-none focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/10 transition-all text-white"
                  value={myRegFilter_HorseId}
                  onChange={(e) => { setMyRegFilter_HorseId(e.target.value); setRegistrationPage(1); }}
                >
                  <option value="" className="bg-slate-900 text-white">Tất cả ngựa</option>
                  {myRegHorseOptions.map(h => (
                    <option key={String(h.id || h._id)} value={String(h.id || h._id)} className="bg-slate-900 text-white">{h.name}</option>
                  ))}
                </select>

                <select
                  className="h-9 py-1 px-2 rounded-xl border border-[rgba(255,255,255,0.08)] bg-[var(--surface-2)] text-xs font-semibold outline-none focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/10 transition-all text-white"
                  value={myRegFilter_TournamentId}
                  onChange={(e) => { setMyRegFilter_TournamentId(e.target.value); setRegistrationPage(1); }}
                >
                  <option value="" className="bg-slate-900 text-white">Tất cả giải đấu</option>
                  {myRegTournamentOptions.map(t => (
                    <option key={String(t.id || t._id)} value={String(t.id || t._id)} className="bg-slate-900 text-white">{t.name}</option>
                  ))}
                </select>

                <div className="relative w-48 sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 z-10 pointer-events-none" style={{ color: 'var(--text-muted)' }} />
                  <input
                    placeholder="Tìm theo ngựa hoặc giải đấu..."
                    className="w-full h-9 py-1 pr-3 rounded-xl border border-[rgba(255,255,255,0.08)] bg-[var(--surface-2)] text-xs font-semibold outline-none focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/10 transition-all text-white"
                    style={{ paddingLeft: '2.5rem' }}
                    value={regSearch}
                    onChange={(e) => { setRegSearch(e.target.value); setRegistrationPage(1); }}
                  />
                </div>
                <div className="text-xs font-bold text-[color:var(--text-2)] bg-[var(--surface-3)] px-3 py-1.5 rounded-xl border border-[var(--border)] shrink-0">
                  Có <span className="text-violet-400 font-extrabold">{registeredTournamentGroups.length}</span> đăng ký
                </div>
              </div>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[1, 2, 3, 4].map((i) => <div key={i} className="hm-skeleton h-20 rounded-xl" />)}
              </div>
            ) : registeredTournamentGroups.length === 0 ? (
              <div className="hm-empty">
                <div className="hm-empty-icon">📋</div>
                <h3 className="text-lg font-bold text-[color:var(--text)] mb-1">Chưa có đăng ký nào</h3>
                <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Đăng ký ngựa vào giải đấu ở tab "Đăng Ký Giải" để xem tại đây.</p>
              </div>
            ) : (
              <div className="hm-glass-card overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-[color:var(--text-muted)]">
                    <thead className="text-[10px] uppercase tracking-widest bg-[var(--surface-2)] text-[color:var(--text)] border-b border-[var(--border)]">
                      <tr>
                        <th className="px-5 py-4 font-black">Ngựa</th>
                        <th className="px-5 py-4 font-black">Giải Đấu</th>
                        <th className="px-5 py-4 font-black text-center">Tiến Độ Vòng Đua</th>
                        <th className="px-5 py-4 font-black text-center">Trạng Thái</th>
                        <th className="px-5 py-4 font-black text-center w-[160px]">Thao Tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border)]">
                      {registeredTournamentGroups.slice((registrationPage - 1) * REGISTRATION_PAGE_SIZE, registrationPage * REGISTRATION_PAGE_SIZE).map((group) => {
                        const sc = statusConfig(group.status === 'PENDING_APPROVAL' ? 'PENDING' : group.status)
                        const confirmableReg = group.registrations.find((reg) => reg.status === 'APPROVED' && !reg.confirmedByOwner)
                        const assignedRegs = group.registrations.filter((reg) => reg.status === 'APPROVED' || reg.status === 'CONFIRMED')
                        const pendingRegs = group.registrations.filter((reg) => reg.status === 'PENDING' || reg.status === 'PENDING_APPROVAL')
                        
                        return (
                          <tr key={group.key} className="hover:bg-[var(--surface-2)] transition-colors group">
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-3">
                                <img src={horseAvatarUrl(group.horseName)} alt={group.horseName} className="w-10 h-10 rounded-lg object-cover border border-white/10" />
                                <div className="font-extrabold text-[color:var(--text)] text-sm">{group.horseName}</div>
                              </div>
                            </td>
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-1.5 font-bold text-violet-400">
                                🏆 {group.tournamentName}
                              </div>
                            </td>
                            <td className="px-5 py-4">
                              <div className="flex justify-center gap-2">
                                <div className="p-1.5 rounded bg-[var(--surface-3)] border border-[var(--border)] text-center w-16">
                                  <div className="text-[10px] font-bold text-[color:var(--text-2)]">{assignedRegs.length}</div>
                                  <div className="text-[8px] font-extrabold uppercase text-[color:var(--text-muted)]">Đã xếp</div>
                                </div>
                                <div className="p-1.5 rounded bg-[var(--surface-3)] border border-[var(--border)] text-center w-16">
                                  <div className="text-[10px] font-bold text-[color:var(--text-2)]">{pendingRegs.length}</div>
                                  <div className="text-[8px] font-extrabold uppercase text-[color:var(--text-muted)]">Chờ</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-5 py-4 text-center">
                              <span className={`hm-badge ${sc.badgeCls} text-[10px]`}>
                                <span className={`hm-status-dot ${sc.dotCls}`} style={{ width: 6, height: 6 }} /> {sc.label}
                              </span>
                            </td>
                            <td className="px-5 py-4">
                              {confirmableReg ? (
                                <button onClick={() => handleConfirmRace(confirmableReg.horseId, confirmableReg.race.id)} className="hm-btn-cta w-full text-[10px] py-2 px-1 shadow-none hm-attention-pulse">
                                  <Check className="w-3.5 h-3.5 mr-1" /> Xác Nhận Tham Gia
                                </button>
                              ) : (
                                <span className="text-[10px] font-medium text-[color:var(--text-muted)] block text-center w-full">Không có hành động</span>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            {registeredTournamentGroups.length > REGISTRATION_PAGE_SIZE && (
              <div className="mt-6 flex justify-center">
                <Pagination total={registeredTournamentGroups.length} page={registrationPage} pageSize={REGISTRATION_PAGE_SIZE} onChange={setRegistrationPage} />
              </div>
            )}
          </div>
        </TabsContent>

        {/* ═══════════════════════════════════════════════════════════════════
            TAB 4: Tuyển Jockey (Hire Jockey)
        ═══════════════════════════════════════════════════════════════════ */}
        <TabsContent value="hire-jockey">
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between px-1 gap-4 mb-2">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-6 rounded bg-violet-500" />
                <h3 className="text-lg font-black text-[color:var(--text)] tracking-tight">Tìm Kiếm Jockey Chuyên Nghiệp</h3>
              </div>
              <div className="flex flex-wrap justify-end items-center gap-3">
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 z-10 pointer-events-none" style={{ color: 'var(--text-muted)' }} />
                  <input
                    placeholder="Tìm theo tên kỵ sĩ..."
                    className="w-full h-9 py-1 pr-3 rounded-xl border border-[rgba(255,255,255,0.08)] bg-[var(--surface-2)] text-xs font-semibold outline-none focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/10 transition-all text-white"
                    style={{ paddingLeft: '2.5rem' }}
                    value={jockeySearch}
                    onChange={(e) => { setJockeySearch(e.target.value); setJockeyPage(1); }}
                  />
                </div>
                <div className="text-xs font-bold text-[color:var(--text-2)] bg-[var(--surface-3)] px-3 py-1.5 rounded-xl border border-[var(--border)] shrink-0">
                  Có <span className="text-violet-400 font-extrabold">{filteredJockeys.length}</span> kỵ sĩ
                </div>
              </div>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 gap-4">
                {[1, 2, 3, 4].map((i) => <div key={i} className="hm-skeleton h-20 rounded-xl" />)}
              </div>
            ) : filteredJockeys.length === 0 ? (
              <div className="hm-empty">
                <div className="hm-empty-icon">🏇</div>
                <h3 className="text-lg font-bold text-[color:var(--text)] mb-1">Không tìm thấy Jockey</h3>
                <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Thử nhập tên tìm kiếm khác.</p>
              </div>
            ) : (
              <div className="hm-glass-card overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-[color:var(--text-muted)]">
                    <thead className="text-[10px] uppercase tracking-widest bg-[var(--surface-2)] text-[color:var(--text)] border-b border-[var(--border)]">
                      <tr>
                        <th className="px-5 py-4 font-black">Kỵ Sĩ</th>
                        <th className="px-5 py-4 font-black text-center">Kinh Nghiệm</th>
                        <th className="px-5 py-4 font-black text-center">Tỉ Lệ Thắng</th>
                        <th className="px-5 py-4 font-black text-center">Trạng Thái</th>
                        <th className="px-5 py-4 font-black text-center w-[160px]">Thao Tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border)]">
                      {filteredJockeys.slice((jockeyPage - 1) * JOCKEY_PAGE_SIZE, jockeyPage * JOCKEY_PAGE_SIZE).map((j) => {
                        const name = j.userId?.fullName || j.userId?.name || 'Jockey'
                        const winRate = j.winRate ?? 0
                        const isAvailable = j.status === 'AVAILABLE'

                        return (
                          <tr key={j.id} className="hover:bg-[var(--surface-2)] transition-colors group">
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-3">
                                <div className={`hm-jockey-avatar ${isAvailable ? 'available' : 'unavailable'} !w-10 !h-10 !text-sm`}>
                                  {name.slice(0, 2).toUpperCase()}
                                  <span className={`hm-status-dot ${isAvailable ? 'approved' : ''}`} style={{ position: 'absolute', bottom: 0, right: 0, width: 8, height: 8, border: '1.5px solid rgba(15,23,42,0.9)' }} />
                                </div>
                                <div className="font-extrabold text-[color:var(--text)] text-sm">{name}</div>
                              </div>
                            </td>
                            <td className="px-5 py-4 text-center">
                              <div className="inline-flex items-center gap-1.5 text-xs font-bold bg-[var(--surface-3)] px-2.5 py-1 rounded-md border border-[var(--border)]">
                                <Star className="w-3.5 h-3.5 text-violet-400" />
                                {j.experience} năm
                              </div>
                            </td>
                            <td className="px-5 py-4">
                              <div className="w-full max-w-[120px] mx-auto">
                                <div className="flex justify-between text-[10px] font-bold mb-1.5">
                                  <span>{j.wins ?? 0}/{j.races ?? 0} trận</span>
                                  <span style={{ color: '#fbbf24' }}>{winRate}%</span>
                                </div>
                                <div className="hm-winrate-bar !h-1.5">
                                  <div className="hm-winrate-fill" style={{ width: `${winRate}%` }} />
                                </div>
                              </div>
                            </td>
                            <td className="px-5 py-4 text-center">
                              <span className={`hm-badge ${isAvailable ? 'hm-badge-approved' : 'hm-badge-muted'} text-[10px] py-1 px-2.5`}>
                                {isAvailable ? 'Sẵn sàng' : 'Bận'}
                              </span>
                            </td>
                            <td className="px-5 py-4">
                              <button
                                className="hm-btn-cta w-full text-[10px] py-2 px-1 shadow-none"
                                onClick={() => {
                                  setInviteTargetJockey({ id: j.id, name })
                                  setShowInviteModal(true)
                                }}
                                disabled={!isAvailable}
                                style={!isAvailable ? { opacity: 0.3, cursor: 'not-allowed', background: 'var(--text-muted)', boxShadow: 'none' } : {}}
                              >
                                <Send className="w-3.5 h-3.5 mr-1" /> Mời Kỵ Sĩ
                              </button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            {filteredJockeys.length > JOCKEY_PAGE_SIZE && (
              <div className="mt-6 flex justify-center">
                <Pagination total={filteredJockeys.length} page={jockeyPage} pageSize={JOCKEY_PAGE_SIZE} onChange={setJockeyPage} />
              </div>
            )}
          </div>
        </TabsContent>

        {/* ═══════════════════════════════════════════════════════════════════
            TAB 5: Lời Mời Jockey (Jockey Invites)
        ═══════════════════════════════════════════════════════════════════ */}
        {/* ═══════════════════════════════════════════════════════════════════
            TAB 5: Lời Mời Jockey (Jockey Invites)
        ═══════════════════════════════════════════════════════════════════ */}
        <TabsContent value="invitations">
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between px-1 gap-4 mb-2">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-6 rounded bg-violet-500" />
                <h3 className="text-lg font-black text-[color:var(--text)] tracking-tight">Trạng Thái Lời Mời Kỵ Sĩ</h3>
              </div>
              <div className="flex flex-wrap justify-end items-center gap-3">
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 z-10 pointer-events-none" style={{ color: 'var(--text-muted)' }} />
                  <input
                    placeholder="Tìm theo kỵ sĩ hoặc giải đấu..."
                    className="w-full h-9 py-1 pr-3 rounded-xl border border-[rgba(255,255,255,0.08)] bg-[var(--surface-2)] text-xs font-semibold outline-none focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/10 transition-all text-white"
                    style={{ paddingLeft: '2.5rem' }}
                    value={inviteSearch}
                    onChange={(e) => { setInviteSearch(e.target.value); setInvitationPage(1); }}
                  />
                </div>
                <div className="text-xs font-bold text-[color:var(--text-2)] bg-[var(--surface-3)] px-3 py-1.5 rounded-xl border border-[var(--border)] shrink-0">
                  Có <span className="text-violet-400 font-extrabold">{filteredInvitations.length}</span> lời mời
                </div>
              </div>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 gap-4">
                {[1, 2, 3].map((i) => <div key={i} className="hm-skeleton h-20 rounded-xl" />)}
              </div>
            ) : filteredInvitations.length === 0 ? (
              <div className="hm-empty">
                <div className="hm-empty-icon">📭</div>
                <h3 className="text-lg font-bold text-[color:var(--text)] mb-1">Chưa có lời mời nào</h3>
                <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Chọn ngựa đã đăng ký giải để gửi lời mời ở tab "Tuyển Jockey".</p>
              </div>
            ) : (
              <div className="hm-glass-card overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-[color:var(--text-muted)]">
                    <thead className="text-[10px] uppercase tracking-widest bg-[var(--surface-2)] text-[color:var(--text)] border-b border-[var(--border)]">
                      <tr>
                        <th className="px-5 py-4 font-black">Kỵ Sĩ</th>
                        <th className="px-5 py-4 font-black">Giải / Vòng Đua</th>
                        <th className="px-5 py-4 font-black text-center">Tỉ Lệ Thắng</th>
                        <th className="px-5 py-4 font-black text-center">Trạng Thái</th>
                        <th className="px-5 py-4 font-black text-center w-[160px]">Thao Tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border)]">
                      {filteredInvitations.slice((invitationPage - 1) * INVITATION_PAGE_SIZE, invitationPage * INVITATION_PAGE_SIZE).map((inv) => {
                        // Calculate actualJockeyId
                        let actualJockeyId = '';
                        if (typeof inv.jockeyId === 'string') {
                          actualJockeyId = inv.jockeyId.trim();
                        } else if (typeof inv.jockeyId?._id) {
                          actualJockeyId = String(inv.jockeyId._id).trim();
                        } else if (typeof inv.jockeyId?.id) {
                          actualJockeyId = String(inv.jockeyId.id).trim();
                        } else if (typeof inv.jockey === 'string') {
                          actualJockeyId = inv.jockey.trim();
                        } else if (typeof inv.jockey?._id) {
                          actualJockeyId = String(inv.jockey._id).trim();
                        } else if (typeof inv.jockey?.id) {
                          actualJockeyId = String(inv.jockey.id).trim();
                        }
                        const matchedJockey = jockeys.find(j => String(j.id || j._id).trim() === actualJockeyId);
                        const jockeyName = matchedJockey?.userId?.fullName || matchedJockey?.userId?.name || inv.jockeyId?.fullName || inv.jockeyId?.name || inv.jockey?.fullName || inv.jockey?.name || 'Jockey';
                        const winRate = matchedJockey?.winRate ?? inv.jockeyId?.winRate ?? 0;

                        const statusMap: Record<string, { badgeCls: string; label: string; icon: any }> = {
                          PENDING:   { badgeCls: 'hm-badge-pending', label: 'Chờ phản hồi', icon: <Clock className="w-3.5 h-3.5" /> },
                          ACCEPTED:  { badgeCls: 'hm-badge-info', label: 'Đã chấp nhận', icon: <Check className="w-3.5 h-3.5" /> },
                          REJECTED:  { badgeCls: 'hm-badge-rejected', label: 'Từ chối', icon: <X className="w-3.5 h-3.5" /> },
                          CONFIRMED: { badgeCls: 'hm-badge-confirmed', label: 'Chốt thành công', icon: <UserCheck className="w-3.5 h-3.5" /> },
                          OTHER_CONFIRMED: { badgeCls: 'hm-badge-muted', label: 'Đã chốt Jockey khác', icon: <X className="w-3.5 h-3.5" /> },
                        }
                        
                        let inviteRaceId = '';
                        if (inv.raceId) inviteRaceId = String(inv.raceId?._id || inv.raceId?.id || inv.raceId || '').trim();
                        else if (inv.race) inviteRaceId = String(inv.race?._id || inv.race?.id || inv.race || '').trim();
                        
                        if (inviteRaceId) {
                          const regFallback = registrations.find((r: any) => String(r.registrationId || r.id || r._id) === inviteRaceId);
                          if (regFallback && regFallback.race) {
                            inviteRaceId = String(regFallback.race.id || regFallback.race._id).trim();
                          }
                        } else if (inv.registrationId) {
                          const matchedReg = registrations.find((r: any) => String(r.registrationId || r.id || r._id) === String(inv.registrationId));
                          if (matchedReg?.race) inviteRaceId = String(matchedReg.race.id || matchedReg.race._id).trim();
                        }

                        const matchedRace = races.find(r => String(r.id || r._id).trim() === inviteRaceId)
                        
                        let displayRaceName = matchedRace?.name || inv.raceId?.name || inv.race?.name;
                        if (!displayRaceName) {
                          const horseRegistrations = registrations.filter(r => String(r.horseId) === String(selectedHorseId));
                          displayRaceName = horseRegistrations.length > 0 ? horseRegistrations.map(r => r.race?.name).join(', ') : '—';
                          if (!inviteRaceId && horseRegistrations.length > 0) {
                            inviteRaceId = String(horseRegistrations[0].race?.id || horseRegistrations[0].race?._id || '').trim();
                          }
                        }
                        
                        const matchedReg = registrations.find(
                          (reg: any) =>
                            String(reg.horseId).trim() === String(inv.horseId).trim() &&
                            String(reg.race?.id || reg.race?._id || reg.raceId || '').trim() === inviteRaceId
                        ) as any
                        
                        const rawJockeyId = matchedReg ? (matchedReg.jockeyId || '') : '';
                        const regJockeyId = typeof rawJockeyId === 'object' ? String(rawJockeyId?._id || rawJockeyId?.id || '').trim() : String(rawJockeyId).trim();
                        
                        const currentJockeyUserId = matchedJockey ? String(matchedJockey.userId?._id || matchedJockey.userId?.id || matchedJockey.userId || '').trim() : ''
                        const jockeyIdentifiers = new Set<string>();
                        if (actualJockeyId) jockeyIdentifiers.add(actualJockeyId);
                        if (currentJockeyUserId) jockeyIdentifiers.add(currentJockeyUserId);
                        if (matchedJockey?.id) jockeyIdentifiers.add(String(matchedJockey.id).trim());
                        if (matchedJockey?._id) jockeyIdentifiers.add(String(matchedJockey._id).trim());

                        const isThisJockeyConfirmed = (regJockeyId && jockeyIdentifiers.has(regJockeyId)) || inv.status === 'CONFIRMED'
                        
                        const hasConfirmedInvite = invitations.some(i => {
                          let iRaceId = '';
                          if (i.raceId) iRaceId = String(i.raceId?._id || i.raceId?.id || i.raceId || '').trim();
                          else if (i.race) iRaceId = String(i.race?._id || i.race?.id || i.race || '').trim();
                          else if (i.registrationId) {
                            const mReg = registrations.find((r: any) => String(r.registrationId || r.id || r._id) === String(i.registrationId));
                            if (mReg?.race) iRaceId = String(mReg.race.id || mReg.race._id).trim();
                          }
                          
                          if (!iRaceId) {
                            const horseRegistrations = registrations.filter(r => String(r.horseId) === String(selectedHorseId));
                            if (horseRegistrations.length > 0) {
                              iRaceId = String(horseRegistrations[0].race?.id || horseRegistrations[0].race?._id || '').trim();
                            }
                          }
                          
                          return iRaceId === inviteRaceId && i.status === 'CONFIRMED';
                        });

                        const isRaceAlreadyConfirmed = !!regJockeyId || hasConfirmedInvite

                        let displayStatus = inv.status || 'PENDING'
                        if (isThisJockeyConfirmed) {
                          displayStatus = 'CONFIRMED'
                        } else if (isRaceAlreadyConfirmed && displayStatus !== 'REJECTED') {
                          displayStatus = 'OTHER_CONFIRMED'
                        }
                        
                        const sc = statusMap[displayStatus] ?? { badgeCls: 'hm-badge-muted', label: displayStatus, icon: null }

                        return (
                          <tr key={inv._id || inv.id} className="hover:bg-[var(--surface-2)] transition-colors group">
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-3">
                                <div className="hm-jockey-avatar available !w-10 !h-10 !text-sm">
                                  {jockeyName.slice(0, 2).toUpperCase()}
                                </div>
                                <div className="font-extrabold text-[color:var(--text)] text-sm">{jockeyName}</div>
                              </div>
                            </td>
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-1.5 font-bold text-violet-400">
                                🏁 {displayRaceName}
                              </div>
                            </td>
                            <td className="px-5 py-4 text-center">
                              <div className="w-full max-w-[120px] mx-auto">
                                <div className="flex justify-between text-[10px] font-bold mb-1.5">
                                  <span>{matchedJockey?.wins ?? 0}/{matchedJockey?.races ?? 0} thắng</span>
                                  <span style={{ color: '#fbbf24' }}>{winRate}%</span>
                                </div>
                                <div className="hm-winrate-bar !h-1.5">
                                  <div className="hm-winrate-fill" style={{ width: `${winRate}%` }} />
                                </div>
                                <div className="text-[9px] font-bold mt-1.5 flex justify-center" style={{ color: 'var(--text-muted)' }}>
                                  {matchedJockey?.experience ? `${matchedJockey.experience} năm KN` : 'Chưa rõ KN'}
                                </div>
                              </div>
                            </td>
                            <td className="px-5 py-4 text-center">
                              <span className={`hm-badge ${sc.badgeCls} text-[10px] py-1 px-2.5 inline-flex items-center`}>
                                {sc.icon} <span className="ml-1">{sc.label}</span>
                              </span>
                            </td>
                            <td className="px-5 py-4">
                              {displayStatus === 'ACCEPTED' ? (
                                <button
                                  disabled={isRaceAlreadyConfirmed}
                                  className={`hm-btn-cta w-full text-[10px] py-2 px-1 shadow-none ${isRaceAlreadyConfirmed ? '' : 'hm-attention-pulse'}`}
                                  style={isRaceAlreadyConfirmed ? { opacity: 0.4, cursor: 'not-allowed', background: 'var(--text-muted)', boxShadow: 'none' } : {}}
                                  onClick={() => handleConfirmJockey(inv.horseId, inv.jockeyId?._id || inv.jockeyId, inviteRaceId, jockeyName, String(inv.id || inv._id))}
                                >
                                  {isRaceAlreadyConfirmed ? 'Đã chốt người khác' : <><UserCheck className="w-3.5 h-3.5 mr-1" /> Chốt Jockey</>}
                                </button>
                              ) : (
                                <span className="text-[10px] font-medium text-[color:var(--text-muted)] block text-center w-full">Không có hành động</span>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            {filteredInvitations.length > INVITATION_PAGE_SIZE && (
              <div className="mt-6 flex justify-center">
                <Pagination total={filteredInvitations.length} page={invitationPage} pageSize={INVITATION_PAGE_SIZE} onChange={setInvitationPage} />
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* ═══════════════════════════════════════════════════════════════════════
          Modal: Horse Results
      ═══════════════════════════════════════════════════════════════════════ */}
      {showResultsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(8px)' }} onClick={() => setShowResultsModal(false)}>
          <div className="hm-glass-card w-full max-w-2xl" style={{ animation: 'hm-scale-in 0.25s ease-out' }} onClick={(e) => e.stopPropagation()}>
            <div className="p-5 flex justify-between items-center border-b border-[var(--border)]">
              <h2 className="text-xl font-black flex items-center gap-2 text-[color:var(--text)] m-0"><Trophy className="w-5 h-5 text-amber-400" /> Kết Quả: {horseResults?.horseName}</h2>
              <button className="p-1.5 rounded-lg transition-colors" style={{ color: 'var(--text-muted)' }} onClick={() => setShowResultsModal(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 max-h-[70vh] overflow-y-auto">
              {loadingResults ? (
                <div className="text-center p-8" style={{ color: 'var(--text-muted)' }}>
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                  Đang tải kết quả...
                </div>
              ) : horseResults?.results?.length > 0 ? (
                <div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                    {[
                      { label: 'Số Trận', value: horseResults.stats.totalRaces, color: 'rgba(139,92,246,0.15)', borderColor: 'rgba(139,92,246,0.2)', textColor: '#a78bfa' },
                      { label: 'Thắng', value: horseResults.stats.wins, color: 'rgba(245,158,11,0.1)', borderColor: 'rgba(245,158,11,0.2)', textColor: '#fbbf24' },
                      { label: 'Top 3', value: horseResults.stats.topThree, color: 'rgba(16,185,129,0.1)', borderColor: 'rgba(16,185,129,0.2)', textColor: '#34d399' },
                      { label: 'Tiền Thưởng', value: `${horseResults.stats.totalPrizes.toLocaleString('vi-VN')} đ`, color: 'rgba(59,130,246,0.1)', borderColor: 'rgba(59,130,246,0.2)', textColor: '#60a5fa', small: true },
                    ].map((s, si) => (
                      <div key={si} className="p-4 rounded-xl text-center" style={{ background: s.color, border: `1px solid ${s.borderColor}` }}>
                        <div className="text-[10px] uppercase font-bold mb-1" style={{ color: 'var(--text-muted)' }}>{s.label}</div>
                        <div className={`font-black ${(s as any).small ? 'text-base' : 'text-2xl'}`} style={{ color: s.textColor }}>{s.value}</div>
                      </div>
                    ))}
                  </div>
                  <div className="rounded-xl overflow-hidden border border-[var(--border)]">
                    <AnimatedTable
                      data={(() => {
                        let res = [...horseResults.results].map((r, i) => ({ ...r, id: i }))
                        res = res.filter(r => {
                          if (resultsFilters.raceName && !r.raceName.toLowerCase().includes(resultsFilters.raceName.toLowerCase())) return false
                          if (resultsFilters.position && String(r.position) !== resultsFilters.position) return false
                          return true
                        })
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
                              <div className="font-bold text-[color:var(--text)]">{row.raceName}</div>
                              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{new Date(row.date).toLocaleDateString('vi-VN')}</div>
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
                            <span className={`hm-badge ${row.position === 1 ? 'hm-badge-pending' : 'hm-badge-muted'} text-[11px]`}>#{row.position}</span>
                          )
                        },
                        {
                          id: 'prize',
                          header: 'Tiền Thưởng',
                          align: 'right',
                          sortable: true,
                          cell: (row: any) => (
                            <span className="font-bold" style={{ color: '#34d399' }}>{row.prize.toLocaleString('vi-VN')} đ</span>
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
              ) : (
                <div className="text-center p-8 font-medium" style={{ color: 'var(--text-muted)' }}>Chưa có kết quả thi đấu nào.</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          Modal: Horse CRUD
      ═══════════════════════════════════════════════════════════════════════ */}
      {showHorseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(8px)' }} onClick={() => setShowHorseModal(false)}>
          <div className="hm-glass-card w-full max-w-md" style={{ animation: 'hm-scale-in 0.25s ease-out' }} onClick={(e) => e.stopPropagation()}>
            <div className="p-5 flex justify-between items-center border-b border-[var(--border)]">
              <h2 className="text-xl font-black text-[color:var(--text)] flex items-center gap-2 m-0">
                {selectedHorse ? <><Edit className="w-5 h-5 text-violet-400" /> Chỉnh Sửa Ngựa</> : <><Plus className="w-5 h-5 text-violet-400" /> Thêm Ngựa Mới</>}
              </h2>
              <button className="p-1.5 rounded-lg transition-colors" style={{ color: 'var(--text-muted)' }} onClick={() => setShowHorseModal(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveHorse} className="p-6 space-y-4">
              {formError && (
                <div className="rounded-xl px-4 py-3 text-sm font-semibold flex items-center gap-2" style={{ color: '#f87171', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)' }}>
                  <X className="w-4 h-4 shrink-0" /> {formError}
                </div>
              )}
              <div>
                <label className="text-xs font-bold uppercase mb-1.5 tracking-wider block" style={{ color: 'var(--text-muted)' }}>Tên ngựa <span style={{ color: '#f87171' }}>*</span></label>
                <input required placeholder="Nhập tên chú ngựa..." value={horseForm.name} onChange={(e) => setHorseForm({ ...horseForm, name: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold uppercase mb-1.5 tracking-wider block" style={{ color: 'var(--text-muted)' }}>Giống</label>
                  <input placeholder="Thoroughbred..." value={horseForm.breed} onChange={(e) => setHorseForm({ ...horseForm, breed: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase mb-1.5 tracking-wider block" style={{ color: 'var(--text-muted)' }}>Màu sắc</label>
                  <input placeholder="Nâu đen..." value={horseForm.color} onChange={(e) => setHorseForm({ ...horseForm, color: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold uppercase mb-1.5 tracking-wider block" style={{ color: 'var(--text-muted)' }}>Tuổi</label>
                  <input type="number" min="1" max="30" value={horseForm.age} onChange={(e) => setHorseForm({ ...horseForm, age: Number(e.target.value) })} />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase mb-1.5 tracking-wider block" style={{ color: 'var(--text-muted)' }}>Cân nặng (kg)</label>
                  <input type="number" min="200" max="700" value={horseForm.weight} onChange={(e) => setHorseForm({ ...horseForm, weight: Number(e.target.value) })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold uppercase mb-1.5 tracking-wider block" style={{ color: 'var(--text-muted)' }}>Giới tính</label>
                  <select value={horseForm.gender} onChange={(e) => setHorseForm({ ...horseForm, gender: e.target.value as any })}>
                    <option value="MALE">Đực</option>
                    <option value="FEMALE">Cái</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold uppercase mb-1.5 tracking-wider block" style={{ color: 'var(--text-muted)' }}>Xuất xứ</label>
                  <input placeholder="Anh Quốc..." value={horseForm.origin} onChange={(e) => setHorseForm({ ...horseForm, origin: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold uppercase mb-1.5 tracking-wider block" style={{ color: 'var(--text-muted)' }}>URL Giấy khám sức khỏe</label>
                <input placeholder="https://example.com/certificate.pdf" value={horseForm.healthCertUrl} onChange={(e) => setHorseForm({ ...horseForm, healthCertUrl: e.target.value })} />
              </div>
              <div className="pt-4 flex justify-end gap-3 border-t border-[var(--border)]">
                <button type="button" onClick={() => setShowHorseModal(false)} className="px-4 py-2 rounded-xl text-sm font-bold transition-all text-[var(--text-2)] hover:bg-[var(--surface-2)] bg-transparent">Hủy</button>
                <button type="submit" className="hm-btn-cta violet">Lưu Thông Tin</button>
              </div>
            </form>
          </div>
        </div>
      )}
    {/* ═══════════════════════════════════════════════════════════════════════
        Modal: Register Tournament
    ═══════════════════════════════════════════════════════════════════════ */}
    {showRegisterModal && registerTargetTournament && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(8px)' }} onClick={() => setShowRegisterModal(false)}>
        <div className="hm-glass-card w-full max-w-md" style={{ animation: 'hm-scale-in 0.25s ease-out' }} onClick={(e) => e.stopPropagation()}>
          <div className="p-5 flex justify-between items-center border-b border-[var(--border)]">
            <h2 className="text-lg font-black text-[color:var(--text)] flex items-center gap-2 m-0">
              <Zap className="w-5 h-5 text-violet-400" /> Đăng Ký Tham Gia
            </h2>
            <button className="p-1.5 rounded-lg transition-colors" style={{ color: 'var(--text-muted)' }} onClick={() => setShowRegisterModal(false)}>
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="p-5">
            <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
              Giải đấu: <strong className="text-[color:var(--text)]">{registerTargetTournament.name}</strong>
            </p>
            <label className="text-xs font-bold uppercase mb-2 tracking-wider block" style={{ color: 'var(--text-muted)' }}>
              ✓ Chọn nhiều ngựa cùng lúc (chỉ ngựa đã được duyệt)
            </label>
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 hm-sidebar-horses">
              {horses.filter(h => h.status === 'APPROVED').length === 0 ? (
                <div className="text-sm font-semibold p-4 text-center rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
                  Bạn chưa có ngựa nào được duyệt để thi đấu.
                </div>
              ) : (
                horses.filter(h => h.status === 'APPROVED').map((h) => {
                  const horseId = String(h.id || h._id)
                  const isSelected = selectedHorsesForRegister.has(horseId)
                  const tId = String(registerTargetTournament.id)
                  // Check if already registered
                  const alreadyRegistered = registrations.some(r => String(r.horseId) === horseId && String(r.race.tournamentId) === tId)
                  
                  return (
                    <div
                      key={horseId}
                      className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all border ${isSelected ? 'bg-violet-500/20 border-violet-500/40' : alreadyRegistered ? 'bg-gray-500/10 border-gray-500/20 opacity-60 cursor-not-allowed' : 'bg-white/[0.01] border-white/[0.05] hover:bg-white/[0.05] hover:border-white/[0.1]'}`}
                      onClick={() => {
                        if (!alreadyRegistered) {
                          const newSet = new Set(selectedHorsesForRegister)
                          if (newSet.has(horseId)) {
                            newSet.delete(horseId)
                          } else {
                            newSet.add(horseId)
                          }
                          setSelectedHorsesForRegister(newSet)
                        }
                      }}
                    >
                      <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${isSelected ? 'bg-violet-500 border-violet-600' : 'border-white/30'}`}>
                        {isSelected && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <img src={horseAvatarUrl(h.name)} alt={h.name} className="w-9 h-9 rounded-lg object-cover shrink-0 border border-white/10" />
                      <div className="flex-1 min-w-0">
                        <div className="font-extrabold text-sm text-[color:var(--text)] truncate">{h.name}</div>
                        {alreadyRegistered && <div className="text-[10px] text-amber-400 font-bold">✓ Đã đăng ký giải này</div>}
                      </div>
                    </div>
                  )
                })
              )}
            </div>
            {selectedHorsesForRegister.size > 0 && (
              <div className="mt-3 p-3 bg-violet-500/10 border border-violet-500/30 rounded-lg text-sm text-violet-300 font-semibold">
                Đã chọn {selectedHorsesForRegister.size} ngựa
              </div>
            )}
          </div>
          <div className="p-4 flex justify-end gap-3 border-t border-[var(--border)]">
            <button type="button" onClick={() => {
              setShowRegisterModal(false)
              setSelectedHorsesForRegister(new Set())
            }} className="px-4 py-2 rounded-xl text-sm font-bold transition-all text-[var(--text-2)] hover:bg-[var(--surface-2)] bg-transparent">Hủy</button>
            <button 
              type="button" 
              className="hm-btn-cta violet"
              disabled={selectedHorsesForRegister.size === 0}
              style={selectedHorsesForRegister.size === 0 ? { opacity: 0.5, cursor: 'not-allowed', boxShadow: 'none' } : {}}
              onClick={() => {
                handleRegisterTournament(registerTargetTournament, Array.from(selectedHorsesForRegister))
                setShowRegisterModal(false)
                setSelectedHorsesForRegister(new Set())
              }}
            >
              <Zap className="w-4 h-4 mr-1.5" /> Đăng Ký ({selectedHorsesForRegister.size}) Ngựa
            </button>
          </div>
        </div>
      </div>
    )}

    {/* ═══════════════════════════════════════════════════════════════════════
        Modal: Invite Jockey
    ═══════════════════════════════════════════════════════════════════════ */}
    {showInviteModal && inviteTargetJockey && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(8px)' }} onClick={() => setShowInviteModal(false)}>
        <div className="hm-glass-card w-full max-w-md" style={{ animation: 'hm-scale-in 0.25s ease-out' }} onClick={(e) => e.stopPropagation()}>
          <div className="p-5 flex justify-between items-center border-b border-[var(--border)]">
            <h2 className="text-lg font-black text-[color:var(--text)] flex items-center gap-2 m-0">
              <Send className="w-5 h-5 text-violet-400" /> Gửi Lời Mời Kỵ Sĩ
            </h2>
            <button className="p-1.5 rounded-lg transition-colors" style={{ color: 'var(--text-muted)' }} onClick={() => setShowInviteModal(false)}>
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="p-5 space-y-4">
            <div>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                Kỵ sĩ: <strong className="text-[color:var(--text)]">{inviteTargetJockey.name || 'Jockey'}</strong>
              </p>
            </div>

            <div>
              <label className="text-xs font-bold uppercase mb-2 tracking-wider block" style={{ color: 'var(--text-muted)' }}>
                1. Chọn ngựa (đã duyệt giải)
              </label>
              <select 
                className="w-full h-11 px-3 rounded-xl border border-[rgba(255,255,255,0.08)] bg-slate-900/60 text-sm font-semibold outline-none focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/10 transition-all text-white"
                value={inviteModalHorseId}
                onChange={(e) => setInviteModalHorseId(e.target.value)}
              >
                <option value="" className="bg-slate-900 text-white">— Chọn ngựa —</option>
                {horses.filter(h => h.status === 'APPROVED').map(h => (
                  <option key={h.id} value={String(h.id || h._id)} className="bg-slate-900 text-white">{h.name}</option>
                ))}
              </select>
            </div>

            {inviteModalHorseId && (
              <div style={{ animation: 'hm-fade-in 0.3s ease-out' }}>
                <label className="text-xs font-bold uppercase mb-2 tracking-wider block" style={{ color: 'var(--text-muted)' }}>
                  2. Chọn vòng đua
                </label>
                {inviteModalRaces.length === 0 ? (
                  <div className="text-xs font-semibold p-3 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
                    Ngựa này chưa được xếp vào vòng đua nào. Vui lòng chọn ngựa khác.
                  </div>
                ) : (
                  <select 
                    className="w-full h-11 px-3 rounded-xl border border-[rgba(255,255,255,0.08)] bg-slate-900/60 text-sm font-semibold outline-none focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/10 transition-all text-white"
                    value={inviteModalRaceId}
                    onChange={(e) => setInviteModalRaceId(e.target.value)}
                  >
                    <option value="" className="bg-slate-900 text-white">— Chọn cuộc đua —</option>
                    {inviteModalRaces.map((r: any) => (
                      <option key={r.raceId} value={r.raceId} className="bg-slate-900 text-white">🏁 {r.raceName}</option>
                    ))}
                  </select>
                )}
              </div>
            )}
          </div>
          <div className="p-4 flex justify-end gap-3 border-t border-[var(--border)]">
            <button type="button" onClick={() => setShowInviteModal(false)} className="px-4 py-2 rounded-xl text-sm font-bold transition-all text-[var(--text-2)] hover:bg-[var(--surface-2)] bg-transparent">Hủy</button>
            <button 
              type="button" 
              className="hm-btn-cta violet"
              disabled={!inviteModalHorseId || !inviteModalRaceId}
              style={(!inviteModalHorseId || !inviteModalRaceId) ? { opacity: 0.5, cursor: 'not-allowed', boxShadow: 'none' } : {}}
              onClick={() => {
                handleInviteJockey(inviteTargetJockey.id, inviteTargetJockey.name || 'Jockey')
                setShowInviteModal(false)
              }}
            >
              <Send className="w-4 h-4 mr-1.5" /> Gửi Lời Mời
            </button>
          </div>
        </div>
      </div>
    )}

    </div>
  )
}
