import { useEffect, useState } from 'react'
import type { Invite } from '../types'
import { getInvites, acceptInvitation, rejectInvitation, getRaces, getRaceHorses } from '@/api'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { ScrollReveal } from '@/components/ui/scroll-text'
import { Magnetic } from '@/components/ui/magnetic'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { LiquidMetalButton } from '@/components/ui/liquid-metal-button'
import { Mail, CalendarRange, Ruler, Weight, X, Inbox, ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'

export function InvitesPage() {
  const [items, setItems] = useState<Invite[] | null>(null)
  const [loadingAction, setLoadingAction] = useState<string | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const invites = await getInvites()
      const allRaces = await getRaces()
      
      const registrations = await Promise.all(
        allRaces.map(async (race) => {
          try {
            const horses = await getRaceHorses(race.id)
            return { race, horses }
          } catch {
            return { race, horses: [] }
          }
        })
      )
      
      const enriched = invites.map((inv) => {
        const targetHorseId = typeof inv.horseId === 'object' && inv.horseId !== null
          ? (inv.horseId._id || inv.horseId.id)
          : inv.horseId
          
        if (!targetHorseId) return inv
        
        let extractedRaceId = '';
        let displayMessage = inv.message || '';
        
        if (displayMessage.includes('|RACE_ID:')) {
          const parts = displayMessage.split('|RACE_ID:');
          displayMessage = parts[0];
          extractedRaceId = parts[1]?.trim();
        }
        
        // We override invAny.message for the UI
        const invAny = inv as any;
        invAny.message = displayMessage;

        let matchedReg: any = null
        let matchedRace: any = null
        
        for (const reg of registrations) {
          const found = reg.horses.find((h: any) => String(h.horseId) === String(targetHorseId))
          const inviteRaceId = extractedRaceId || String(invAny.raceId?._id || invAny.raceId?.id || invAny.raceId || invAny.race?._id || invAny.race?.id || invAny.race || '');
          
          if (found && (!inviteRaceId || String(reg.race.id || reg.race._id) === inviteRaceId)) {
            matchedReg = found
            matchedRace = reg.race
            break
          }
        }

        // Fallback: If inviteRaceId was actually a registrationId
        if (!matchedReg || !matchedRace) {
          for (const reg of registrations) {
            const invAny = inv as any;
            const inviteRaceId = String(invAny.raceId?._id || invAny.raceId?.id || invAny.raceId || invAny.race?._id || invAny.race?.id || invAny.race || '');
            const found = reg.horses.find((h: any) => String(h.horseId) === String(targetHorseId) && String(h.registrationId || h.id || h._id) === inviteRaceId)
            if (found) {
              matchedReg = found
              matchedRace = reg.race
              break
            }
          }
        }

        // Absolute fallback: Just find the horse (can cause wrong race name if horse registered in multiple races)
        if (!matchedReg || !matchedRace) {
          for (const reg of registrations) {
            const found = reg.horses.find((h: any) => String(h.horseId) === String(targetHorseId))
            if (found) {
              matchedReg = found
              matchedRace = reg.race
              break
            }
          }
        }
        
        if (matchedReg && matchedRace) {
          const horseObj = matchedReg.horse || {}
          const ownerObj = horseObj.ownerId || horseObj.owner || {}
          
          const assignedJockeyId = String(matchedReg.jockeyId?._id || matchedReg.jockeyId?.id || matchedReg.jockeyId || matchedReg.jockey?._id || matchedReg.jockey?.id || '');
          const myJockeyId = String(invAny.jockeyId?._id || invAny.jockeyId?.id || invAny.jockeyId || invAny.jockey?._id || invAny.jockey?.id || invAny.jockey || '');
          const isOtherConfirmed = assignedJockeyId && myJockeyId && assignedJockeyId !== myJockeyId;

          return {
            ...inv,
            raceId: matchedRace.id,
            tournamentId: typeof matchedRace.tournamentId === 'object' ? (matchedRace.tournamentId._id || matchedRace.tournamentId.id) : matchedRace.tournamentId,
            raceName: matchedRace.name || inv.raceName,
            raceDistance: matchedRace.distance || inv.raceDistance,
            raceScheduledAt: matchedRace.scheduledAt || inv.raceScheduledAt,
            horseBreed: horseObj.breed || inv.horseBreed,
            horseWeight: horseObj.weight || inv.horseWeight,
            ownerName: ownerObj.fullName || ownerObj.name || ownerObj.email || inv.ownerName,
            isOtherConfirmed: !!isOtherConfirmed
          }
        }
        return inv
      })
      
      setItems(enriched)
    } catch (e) {
      console.error('Failed to load enriched invites', e)
      setItems([])
    }
  }

  const handleAction = async (inviteId: string, action: 'accept' | 'reject') => {
    setLoadingAction(inviteId)
    try {
      if (action === 'accept') {
        // Validate if already accepted another horse in the SAME TOURNAMENT
        const targetInvite = items?.find(inv => inv.id === inviteId || (inv as any)._id === inviteId);
        if (targetInvite) {
          const invAny = targetInvite as any;
          const targetTournId = String(invAny.tournamentId || '');
          
          const hasAcceptedInSameTournament = items?.some(inv => {
            const currentTournId = String((inv as any).tournamentId || '');
            return targetTournId && currentTournId === targetTournId && 
                   (inv.status === 'ACCEPTED' || inv.status === 'CONFIRMED') && 
                   (inv.id !== inviteId && (inv as any)._id !== inviteId);
          });
          
          if (hasAcceptedInSameTournament) {
            alert('Bạn đã chấp nhận một lời mời khác trong giải đấu này. Không thể nhận thêm ngựa trong cùng 1 giải!');
            setLoadingAction(null);
            return;
          }
        }

        await acceptInvitation(inviteId)
      } else {
        await rejectInvitation(inviteId)
      }
      loadData()
    } catch (e) {
      console.error('Action failed', e)
      alert(`Không thể ${action === 'accept' ? 'chấp nhận' : 'từ chối'} lời mời. Vui lòng thử lại.`)
    } finally {
      setLoadingAction(null)
    }
  }

  const getStatusDisplay = (inv: any) => {
    if (inv.isOtherConfirmed) {
      return <Badge variant="outline" className="border-slate-500/30 bg-slate-500/10 text-slate-400">🚫 Đã chốt Jockey khác</Badge>
    }
    switch (inv.status) {
      case 'PENDING':
        return <Badge variant="outline" className="border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-300">⏳ Chờ phản hồi</Badge>
      case 'ACCEPTED':
        return <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300">✅ Đã đồng ý</Badge>
      case 'DECLINED':
      case 'REJECTED':
        return <Badge variant="outline" className="border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-300">❌ Đã từ chối</Badge>
      case 'CONFIRMED':
        return <Badge variant="outline" className="border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-300">🎉 Đã chốt (Chính thức)</Badge>
      default:
        return <Badge variant="outline">{inv.status}</Badge>
    }
  }

  return (
    <div className="space-y-6">
      {/* Header section */}
      <ScrollReveal direction="up" distance={60} duration={0.8}>
        <div className="flex flex-col gap-2 mb-8">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-[var(--primary-light)] p-3 ring-1 ring-[var(--primary-ring)]">
              <Mail className="h-8 w-8 text-[var(--primary)]" />
            </div>
            <h1 className="text-4xl font-black text-[var(--text)] m-0">Lời Mời Của Tôi</h1>
          </div>
          <p className="text-[var(--muted)] font-semibold max-w-2xl text-sm" style={{ lineHeight: 1.6 }}>
            Quản lý các yêu cầu mời điều khiển ngựa từ các chủ ngựa khác. Phản hồi nhanh chóng để không bỏ lỡ cơ hội tham gia các giải đua đỉnh cao.
          </p>
        </div>
      </ScrollReveal>

      {!items ? (
        <div className="grid gap-6 md:grid-cols-2">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="card p-6 h-48 skeleton rounded-xl" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <ScrollReveal direction="up" distance={40}>
          <Card className="border-[var(--border)] bg-[var(--surface)] text-center py-20">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[var(--bg2)] mb-4 shadow-inner">
              <Inbox className="h-10 w-10 text-[var(--muted)] opacity-50" />
            </div>
            <h3 className="text-xl font-bold text-[var(--text)] mb-2">Chưa có lời mời nào</h3>
            <p className="text-[var(--muted)] max-w-sm mx-auto font-medium">Bạn hiện không có yêu cầu điều khiển ngựa nào. Hãy làm mới hồ sơ để thu hút chủ ngựa nhé!</p>
          </Card>
        </ScrollReveal>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {items.map((inv, idx) => (
            <ScrollReveal key={inv.id} direction="up" distance={60} duration={0.6} delay={idx * 0.1}>
              <Card className="h-full border-[var(--border)] bg-[var(--surface)] hover:border-[var(--primary)]/30 hover:shadow-xl hover:shadow-[var(--primary)]/5 transition-all duration-300 flex flex-col">
                <CardHeader className="border-b border-[var(--border)] bg-[var(--bg2)]/50 pb-4">
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <CardDescription className="text-xs font-bold uppercase tracking-wider text-[var(--primary)] mb-1">
                        Từ Chủ Ngựa: <span className="text-[var(--text)]">{inv.ownerName || '—'}</span>
                      </CardDescription>
                      <CardTitle className="text-2xl font-black text-[var(--text)] flex items-center gap-2">
                        🐎 {inv.horseName}
                      </CardTitle>
                    </div>
                    <div>{getStatusDisplay(inv)}</div>
                  </div>
                </CardHeader>

                <CardContent className="pt-6 flex-1 flex flex-col gap-6">
                  {/* Info grid */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <div className="text-xs text-[var(--muted)] font-semibold uppercase tracking-wider flex items-center gap-1.5">
                        <CalendarRange className="h-3.5 w-3.5" /> Giải Đua
                      </div>
                      <div className="font-bold text-sm line-clamp-1">{inv.raceName || 'Chưa xác định'}</div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-xs text-[var(--muted)] font-semibold uppercase tracking-wider flex items-center gap-1.5">
                        <Ruler className="h-3.5 w-3.5" /> Cự Ly
                      </div>
                      <div className="font-bold text-sm">{inv.raceDistance ? `${inv.raceDistance}m` : '—'}</div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-xs text-[var(--muted)] font-semibold uppercase tracking-wider flex items-center gap-1.5">
                        <Weight className="h-3.5 w-3.5" /> Ngựa
                      </div>
                      <div className="font-bold text-sm">{inv.horseBreed || 'Chưa rõ'} · {inv.horseWeight ? `${inv.horseWeight}kg` : '?'}</div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-xs text-[var(--muted)] font-semibold uppercase tracking-wider flex items-center gap-1.5">
                        <Mail className="h-3.5 w-3.5" /> Lời nhắn
                      </div>
                      <div className="font-medium text-sm text-[var(--muted)] italic line-clamp-1">"{inv.message || 'Xin chào, mời bạn!'}"</div>
                    </div>
                  </div>

                  <div className="mt-auto pt-4 border-t border-[var(--border)] flex items-center justify-between gap-3">
                    {(inv as any).isOtherConfirmed ? (
                      <Button disabled className="w-full bg-slate-800 text-slate-500 cursor-not-allowed">
                        🚫 Cuộc đua đã có Jockey khác
                      </Button>
                    ) : inv.status === 'PENDING' ? (
                      <>
                        <Button 
                          variant="outline" 
                          className="flex-1 border-red-500/30 text-red-500 hover:bg-red-500/10 hover:border-red-500/50"
                          onClick={() => handleAction(inv.id, 'reject')}
                          disabled={loadingAction === inv.id}
                        >
                          {loadingAction === inv.id ? 'Đang xử lý...' : <><X className="w-4 h-4 mr-2" /> Từ Chối</>}
                        </Button>
                        <Magnetic intensity={0.2}>
                          <div className="flex-1">
                            <LiquidMetalButton 
                              label={loadingAction === inv.id ? 'Đang xử lý...' : '✓ Đồng Ý'}
                              onClick={() => handleAction(inv.id, 'accept')}
                            />
                          </div>
                        </Magnetic>
                      </>
                    ) : (
                      <Link to="/app/jockey/schedule" className="w-full">
                        <Button className="w-full bg-[var(--bg2)] text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--surface-strong)]">
                          Xem lịch thi đấu <ChevronRight className="w-4 h-4 ml-1" />
                        </Button>
                      </Link>
                    )}
                  </div>
                </CardContent>
              </Card>
            </ScrollReveal>
          ))}
        </div>
      )}
    </div>
  )
}
