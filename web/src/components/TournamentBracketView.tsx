import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getHorsesByRace, getRaceResults } from '@/api'
import { Trophy, ChevronRight } from 'lucide-react'

export function TournamentBracketView({ bracket, races, onGenerateNextRound, loadingNextRound, draftHorsesRecord, championName }: { bracket: any, races?: any[], onGenerateNextRound?: (roundIdx: number) => void, loadingNextRound?: boolean, draftHorsesRecord?: Record<string, any[]>, championName?: string }) {
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
            if (['COMPLETED', 'FINISHED', 'RESULT_CONFIRMED'].includes((r.status || '').toUpperCase())) {
              try {
                const resultsObj = await getRaceResults(r._id || r.id);
                const results = resultsObj?.results || resultsObj?.rankings || resultsObj?.raceResults || (Array.isArray(resultsObj) ? resultsObj : []);
                
                const rankedHorses = h.map((horseItem: any) => {
                  const horseId = horseItem.horse?._id || horseItem.horseId || horseItem._id;
                  const foundResult = results.find((res: any) => {
                     const rHorseId = res.horseId?._id || res.horseId?.id || res.horseId || res.horse?._id || res.horseId;
                     return String(rHorseId) === String(horseId);
                  });
                  if (foundResult) {
                    return { ...horseItem, position: foundResult.position ?? foundResult.rank };
                  }
                  return horseItem;
                });
                result[r._id || r.id] = rankedHorses;
              } catch (e) {
                console.error('Failed to fetch results for race', r._id)
                result[r._id || r.id] = h
              }
            } else {
              result[r._id || r.id] = h
            }
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
                      const isFinalCompleted = isFinal && actualRace &&
                        ['COMPLETED','FINISHED','RESULT_CONFIRMED'].includes((actualRace.status || '').toUpperCase());
                      const podiumIcons = ['🥇','🥈','🥉'];

                      return (
                        <div key={mIdx} className="relative flex items-center">
                          <div 
                            className={`bg-[var(--surface-2)] border rounded-2xl p-0 shadow-xl flex flex-col relative transition-all group ${isFinal ? 'w-80' : 'w-72'} hover:-translate-y-1 overflow-hidden z-10`}
                            style={{ 
                              borderColor: isFinalCompleted ? 'rgba(245,158,11,0.8)' : borderColor, 
                              boxShadow: isFinalCompleted ? '0 8px 40px rgba(245,158,11,0.4), 0 0 0 1px rgba(245,158,11,0.2)' : `0 8px 30px ${shadowColor}` 
                            }}
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
                                  displayHorses.map((h: any, hIdx: number) => {
                                    const isRaceCompleted = actualRace && ['COMPLETED','FINISHED','RESULT_CONFIRMED'].includes((actualRace.status || '').toUpperCase());
                                    const actualRank = h.position || h.rank || h.actualPosition || hIdx + 1;
                                    const isAdvancing = isRaceCompleted && !isFinal && actualRank <= bRace.topAdvance;
                                    
                                    return (
                                      <div key={hIdx} className={`flex items-center gap-3 p-2 rounded-xl transition-colors ${
                                        isAdvancing ? 'bg-white/10 ring-1 ring-white/20' : 'bg-white/5 hover:bg-white/10'
                                      }`}>
                                        <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 border bg-[#27272a] text-zinc-400 border-[#3f3f46]`}>
                                          🐎
                                        </div>
                                        <span className={`font-bold truncate text-sm ${isAdvancing ? 'text-white' : 'text-zinc-300'}`}>
                                          {h.horse?.name || h.horseName || '---'}
                                        </span>
                                        {isAdvancing && (
                                          <span className={`ml-auto text-[10px] px-2 py-0.5 rounded border whitespace-nowrap font-bold ${
                                            actualRank === 1 ? 'text-yellow-400 bg-yellow-400/20 border-yellow-400/30' :
                                            actualRank === 2 ? 'text-slate-300 bg-slate-300/20 border-slate-300/30' :
                                            actualRank === 3 ? 'text-amber-600 bg-amber-600/20 border-amber-600/30' :
                                            actualRank === 4 ? 'text-purple-400 bg-purple-400/20 border-purple-400/30' :
                                            'text-blue-400 bg-blue-400/20 border-blue-400/30'
                                          }`}>
                                            #{actualRank}
                                          </span>
                                        )}
                                        {isDraft && !isRaceCompleted && <span className="ml-auto text-[10px] bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded border border-blue-500/30 whitespace-nowrap">Dự kiến</span>}
                                      </div>
                                    )
                                  })
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
                            
                            {/* Champion Banner for completed final */}
                            {isFinalCompleted && displayHorses.length > 0 && (
                              <div className="bg-gradient-to-r from-amber-900/60 via-yellow-800/60 to-amber-900/60 border-t border-amber-500/50 p-2 flex items-center justify-center gap-2">
                                <Trophy className="w-4 h-4 text-amber-400" />
                                <span className="text-amber-300 text-xs font-black uppercase tracking-wider">Giải đấu kết thúc</span>
                                <Trophy className="w-4 h-4 text-amber-400" />
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

            {/* Champion Node */}
            {championName && (
              <div className="flex flex-col gap-8 relative items-center justify-center">
                <div className="flex flex-col justify-around gap-8 flex-1 w-full relative">
                  {/* Connect line from final */}
                  <div className="absolute left-[-4rem] top-1/2 -translate-y-1/2 w-[4rem] h-[2px] bg-amber-500/50 z-0 flex items-center justify-start"></div>
                  
                  <div className="bg-[var(--surface-2)] border rounded-2xl p-0 shadow-[0_8px_40px_rgba(245,158,11,0.6),_0_0_0_2px_rgba(245,158,11,0.5)] flex flex-col relative transition-all w-64 hover:-translate-y-1 overflow-hidden z-10 animate-bounce" style={{ animationDuration: '2.5s' }}>
                    <div className="bg-gradient-to-b from-amber-500/40 to-[#18181b] p-4 border-b border-amber-500/30 flex flex-col justify-center items-center gap-2">
                      <Trophy className="w-10 h-10 text-amber-400 drop-shadow-[0_0_15px_rgba(245,158,11,0.8)]" />
                      <h4 className="font-black text-amber-400 text-base uppercase tracking-widest drop-shadow-md">Nhà Vô Địch</h4>
                    </div>
                    <div className="p-6 flex flex-col items-center justify-center min-h-[100px] bg-gradient-to-b from-transparent to-amber-900/20">
                      <span className="font-black text-2xl text-amber-300 text-center drop-shadow-lg">{championName}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
