import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getHorsesByRace } from '@/api'
import { Trophy, ChevronRight } from 'lucide-react'

export function TournamentBracketView({ bracket, races, onGenerateNextRound, loadingNextRound, draftHorsesRecord }: { bracket: any, races?: any[], onGenerateNextRound?: (roundIdx: number) => void, loadingNextRound?: boolean, draftHorsesRecord?: Record<string, any[]> }) {
  const [raceHorses, setRaceHorses] = useState<Record<string, any[]>>({})
  const [loading, setLoading] = useState(false)

  let displayBracket = bracket || { rounds: [] };
  
  if ((!displayBracket || !displayBracket.rounds || displayBracket.rounds.length === 0) && races && races.length > 0) {
    const roundGroups = new Map<string, any[]>();
    
    // Sort races by scheduled time so rounds appear in correct chronological order
    const sortedRaces = [...races].sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());
    
    sortedRaces.forEach(r => {
       const parts = r.name.split(' - ');
       let roundName = 'Vòng 1';
       const rNameLower = r.name.toLowerCase();
       if (rNameLower.includes('chung kết')) roundName = 'Chung Kết';
       else if (rNameLower.includes('bán kết')) roundName = 'Bán Kết';
       else if (rNameLower.includes('tứ kết')) roundName = 'Tứ Kết';
       else {
         const match = r.name.match(/(Vòng \d+)/i) || r.name.match(/(Round \d+)/i);
         if (match) roundName = match[1];
         else roundName = parts.length >= 2 ? parts[parts.length - 2].trim() : 'Vòng 1';
       }
       if (!roundGroups.has(roundName)) roundGroups.set(roundName, []);
       roundGroups.get(roundName)!.push({ name: r.name, horseCount: r.maxHorses || 8, topAdvance: (r as any).topAdvance || 2 });
    });
    
    const generatedRounds = Array.from(roundGroups.entries()).map(([name, rList]) => ({
      name,
      races: rList
    }));

    // Sort rounds logically: Vòng 1 -> ... -> Tứ Kết -> Bán Kết -> Chung Kết
    const roundPriority = (name: string) => {
      const n = name.toLowerCase();
      if (n.includes('chung kết')) return 999;
      if (n.includes('bán kết')) return 998;
      if (n.includes('tứ kết')) return 997;
      const match = n.match(/(\d+)/);
      if (match) return parseInt(match[1]);
      return 500;
    };
    generatedRounds.sort((a, b) => roundPriority(a.name) - roundPriority(b.name));

    // Predict future rounds if they are missing
    let lastRound = generatedRounds[generatedRounds.length - 1];
    let rNum = generatedRounds.length + 1;
    while (lastRound && lastRound.races.length > 1 && !lastRound.name.toLowerCase().includes('chung kết')) {
      const nextHorsesCount = lastRound.races.reduce((sum: number, r: any) => sum + (r.topAdvance || 2), 0);
      const maxHorses = lastRound.races[0]?.horseCount || 8;
      let nextRacesCount = Math.ceil(nextHorsesCount / maxHorses);
      if (nextRacesCount === 1 && nextHorsesCount > maxHorses) nextRacesCount = 2;

      const nextRoundName = nextRacesCount === 1 ? 'Chung Kết' : `Vòng ${rNum}`;
      const nextRound = {
        name: nextRoundName,
        races: Array.from({length: nextRacesCount}).map((_, i) => ({
          name: nextRacesCount === 1 ? 'Chung Kết' : `Vòng ${rNum} - Bảng ${i+1}`,
          horseCount: nextRacesCount === 1 ? nextHorsesCount : Math.ceil(nextHorsesCount / nextRacesCount),
          topAdvance: nextRacesCount === 1 ? 1 : Math.floor(maxHorses / nextRacesCount) || 1
        }))
      };
      generatedRounds.push(nextRound);
      lastRound = nextRound;
      rNum++;
    }
    
    displayBracket = { rounds: generatedRounds };
  }

  useEffect(() => {
    if (!races || races.length === 0) return
    setLoading(true)
    const fetchHorses = async () => {
      const result: Record<string, any[]> = {}
      await Promise.all(
        races.map(async (r) => {
          try {
            const h = await getHorsesByRace(r._id || r.id)
            result[r._id || r.id] = h
          } catch (e) {
            console.error('Failed to fetch horses for race', r._id)
          }
        })
      )
      setRaceHorses(result)
      setLoading(false)
    }
    fetchHorses()
  }, [races])

  const hasBracket = displayBracket && displayBracket.rounds && displayBracket.rounds.length > 0
  
  if (!hasBracket) {
    return (
      <div className="spectator-empty">
        <div className="spectator-empty-icon">🌳</div>
        <div className="text-base font-bold text-[var(--text)]">Sơ đồ chưa được tạo</div>
        <p className="text-sm text-[var(--muted)] font-medium mt-1">Sơ đồ thi đấu sẽ được hiển thị sau khi đóng đăng ký hoặc phân chia bảng.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-12 pb-8">
      <div className="flex items-center justify-center gap-4">
        <div className="h-[1px] w-24 bg-gradient-to-r from-transparent to-amber-500/50"></div>
        <h3 className="text-xl font-black text-white uppercase tracking-[0.2em] drop-shadow-[0_2px_10px_rgba(245,158,11,0.5)]">
          Lộ Trình Giải Đấu
        </h3>
        <div className="h-[1px] w-24 bg-gradient-to-l from-transparent to-amber-500/50"></div>
      </div>
      
      {loading ? (
        <div className="flex justify-center p-8"><div className="w-8 h-8 rounded-full border-4 border-amber-500 border-t-transparent animate-spin shadow-[0_0_15px_rgba(245,158,11,0.5)]"></div></div>
      ) : (
        <div className="overflow-x-auto pb-12">
          <div className="flex gap-16 min-w-max p-4 justify-center items-stretch">
            {displayBracket?.rounds?.map((round: any, rIdx: number) => {
              const totalRounds = displayBracket?.rounds?.length || 0;
              const distanceToFinal = totalRounds - 1 - rIdx;
              
              let roundName = round.name || `Vòng ${rIdx + 1}`;
              let themeColor = 'blue';
              let shadowColor = 'rgba(59,130,246,0.15)';
              let borderColor = 'var(--border)';
              let hoverBorder = 'var(--primary)';
              
              if (distanceToFinal === 0) {
                themeColor = 'amber';
                shadowColor = 'rgba(245,158,11,0.3)';
                borderColor = 'rgba(245,158,11,0.4)';
                hoverBorder = '#f59e0b';
              } else if (distanceToFinal === 1) {
                themeColor = 'cyan';
                shadowColor = 'rgba(6,182,212,0.2)';
                borderColor = 'rgba(6,182,212,0.3)';
                hoverBorder = '#06b6d4';
              } else if (distanceToFinal === 2) {
                themeColor = 'purple';
                shadowColor = 'rgba(168,85,247,0.15)';
                borderColor = 'rgba(168,85,247,0.3)';
                hoverBorder = '#a855f7';
              }

              return (
                <div key={rIdx} className="flex flex-col gap-8 relative items-center">
                  <div className={`text-center font-black uppercase tracking-widest text-lg drop-shadow-sm text-${themeColor}-400 bg-[#18181b] border border-[#3f3f46] px-6 py-2 rounded-xl shadow-lg relative`}>
                    {distanceToFinal === 0 && <Trophy className="inline-block w-5 h-5 mr-2 mb-1" />}
                    {roundName}
                    
                    {/* Next round generation button */}
                    {onGenerateNextRound && rIdx > 0 && 
                      // if this round has no actual races yet, and previous round does
                      !round.races?.some((br: any) => races?.find(r => r.name === br.name)) &&
                      displayBracket?.rounds?.[rIdx - 1]?.races?.some((br: any) => races?.find(r => r.name === br.name)) && (
                      <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-max">
                        <button 
                          className="btn btnPrimary h-8 px-4 text-xs font-bold rounded-full shadow-lg"
                          style={{ background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none' }}
                          onClick={() => onGenerateNextRound(rIdx)}
                          disabled={loadingNextRound}
                        >
                          {loadingNextRound ? 'Đang tạo...' : `🚀 Tạo ${roundName}`}
                        </button>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex flex-col justify-around gap-8 flex-1 w-full">
                    {round.races?.map((bRace: any, mIdx: number) => {
                      const actualRace = races?.find(r => r.name === bRace.name)
                      const actualHorses = actualRace ? (raceHorses[actualRace._id || actualRace.id] || []) : []
                      const isDraft = !actualRace && draftHorsesRecord && draftHorsesRecord[bRace.name] && draftHorsesRecord[bRace.name].length > 0;
                      let displayHorses = actualRace ? actualHorses : (isDraft ? draftHorsesRecord![bRace.name] : []);
                      
                      displayHorses = [...displayHorses].sort((a: any, b: any) => {
                        const rankA = a.rank || a.position || a.actualPosition || 999;
                        const rankB = b.rank || b.position || b.actualPosition || 999;
                        return rankA - rankB;
                      });
                      const isFinal = distanceToFinal === 0;

                      return (
                        <div key={mIdx} className="relative flex items-center">
                          <div 
                            className={`bg-[var(--surface-2)] border rounded-2xl p-0 shadow-xl flex flex-col relative transition-all group ${isFinal ? 'w-80' : 'w-72'} hover:-translate-y-1 overflow-hidden z-10`}
                            style={{ borderColor, boxShadow: `0 8px 30px ${shadowColor}` }}
                          >
                            <div className="bg-gradient-to-b from-[#27272a] to-[#18181b] p-3 border-b border-[#3f3f46] flex justify-between items-center group-hover:from-white/5 transition-colors">
                              <h4 className={`font-black text-${themeColor}-500 text-sm uppercase tracking-wider`}>{bRace.name}</h4>
                              {actualRace && (
                                <Link 
                                  to={`/races/${actualRace._id || actualRace.id}`} 
                                  className="bg-[#18181b] border border-[#3f3f46] text-zinc-400 text-[10px] px-3 py-1 rounded-full hover:text-white transition-all font-bold uppercase"
                                  style={{ borderColor: hoverBorder }}
                                >
                                  Chi Tiết
                                </Link>
                              )}
                            </div>

                            <div className="p-3 flex flex-col gap-2 min-h-[100px] justify-center">
                              {actualRace || isDraft ? (
                                displayHorses.length > 0 ? (
                                  displayHorses.map((h: any, hIdx: number) => (
                                    <div key={hIdx} className="flex items-center gap-3 p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
                                      <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs shrink-0 border ${hIdx < bRace.topAdvance ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50' : 'bg-[#27272a] text-zinc-400 border-[#3f3f46]'}`}>
                                        {hIdx + 1}
                                      </div>
                                      <span className={`font-bold truncate text-sm ${hIdx < bRace.topAdvance ? 'text-white' : 'text-zinc-300'}`}>
                                        {h.horse?.name || h.horseName || '---'}
                                      </span>
                                      {isDraft && <span className="ml-auto text-[10px] bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded border border-blue-500/30 whitespace-nowrap">Dự kiến</span>}
                                    </div>
                                  ))
                                ) : (
                                  <div className="text-center text-zinc-500 text-sm italic py-4">Chưa có ngựa</div>
                                )
                              ) : (
                                <div className="flex flex-col items-center justify-center py-4 gap-2 text-zinc-500 border border-dashed border-zinc-700 rounded-xl bg-zinc-900/50">
                                  <span className="text-sm font-semibold text-zinc-400">Dự kiến {bRace.horseCount} ngựa</span>
                                  <span className="text-xs">Lấy Top {bRace.topAdvance} vào vòng trong</span>
                                </div>
                              )}
                            </div>
                            
                            {/* Advancement Indicator (Bottom line) */}
                            {actualRace && !isFinal && (
                              <div className="bg-zinc-900/80 p-2 border-t border-zinc-800 text-center text-xs font-medium text-amber-400/80">
                                Lấy Top {bRace.topAdvance} đi tiếp
                              </div>
                            )}
                          </div>
                          
                          {/* Connector lines to next round */}
                          {!isFinal && (
                            <div className="absolute right-[-4rem] w-[4rem] h-[2px] bg-[#3f3f46] z-0 flex items-center justify-end">
                               <ChevronRight className="w-4 h-4 text-[#3f3f46] mr-[-8px]" />
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
