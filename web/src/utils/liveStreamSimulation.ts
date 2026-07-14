export type SimulationPlan = {
  streamId: string
  laneIndex: number
  finishTime: number
  finishTimeLabel: string
  easing: number
}

export type RankedStreamHorse = {
  horse: any
  id: string
  progress: number
  finishTime?: string
  finishTimeSeconds?: number
  originalIndex: number
  finished: boolean
}

export function getValueId(value: any) {
  if (!value) return ''
  if (typeof value === 'string') return value.trim()
  return String(value._id || value.id || value.userId || value.raceId || value.horseId || '').trim()
}

export function getStreamHorseId(horse: any, index: number) {
  const id =
    horse?.registrationId ||
    horse?.id ||
    horse?._id ||
    getValueId(horse?.horseId) ||
    getValueId(horse?.horse) ||
    getValueId(horse)

  return String(id || `horse-${index}`).trim()
}

export function getStreamHorseName(horse: any, index?: number) {
  return (
    horse?.pickedHorseName ||
    horse?.horseName ||
    horse?.horse?.name ||
    horse?.horseId?.name ||
    horse?.name ||
    `Horse ${typeof index === 'number' ? index + 1 : ''}`.trim()
  )
}

export function getStreamJockeyName(horse: any) {
  return horse?.jockey?.user?.fullName || horse?.jockeyName || horse?.jockey?.fullName || horse?.jockey?.name || ''
}

export function buildMockHorses(count = 6) {
  return Array.from({ length: count }).map((_, index) => ({
    registrationId: `mock-reg-${index}`,
    horse: {
      _id: `mock-horse-${index}`,
      name: `Hoa Phong ${index + 1}`,
      breed: 'Than Ma',
    },
    jockeyName: `Nai ngua ${index + 1}`,
  }))
}

export function getRaceSimulationKey(race: any) {
  return getValueId(race?.raceId || race) || String(race?.name || 'race').trim()
}

function hashString(value: string) {
  let hash = 2166136261
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

function seededUnit(seed: string) {
  return hashString(seed) / 4294967295
}

function round2(value: number) {
  return Math.round(value * 100) / 100
}

export function buildRaceSimulationPlans(race: any, horses: any[]): SimulationPlan[] {
  const raceKey = getRaceSimulationKey(race)
  const rawPlans = horses.map((horse, index) => {
    const streamId = getStreamHorseId(horse, index)
    const stamina = seededUnit(`${raceKey}|${streamId}|stamina`)
    const breakSpeed = seededUnit(`${raceKey}|${streamId}|break`)
    const finishTime = round2(23 + stamina * 15 + breakSpeed * 4)

    return {
      streamId,
      laneIndex: index,
      finishTime,
      finishTimeLabel: finishTime.toFixed(2),
      easing: 0.95 + seededUnit(`${raceKey}|${streamId}|pace`) * 0.28,
    }
  })

  const sorted = [...rawPlans].sort((a, b) => {
    if (a.finishTime !== b.finishTime) return a.finishTime - b.finishTime
    return a.streamId.localeCompare(b.streamId)
  })

  const finalById = new Map<string, SimulationPlan>()
  sorted.forEach((plan, rankIndex) => {
    const finishTime = round2(plan.finishTime + rankIndex * 0.01)
    finalById.set(plan.streamId, {
      ...plan,
      finishTime,
      finishTimeLabel: finishTime.toFixed(2),
    })
  })

  return rawPlans.map((plan) => finalById.get(plan.streamId) || plan)
}

export function getProgressAtElapsed(plan: SimulationPlan | undefined, elapsedSeconds: number) {
  if (!plan || elapsedSeconds <= 0) return 0
  if (elapsedSeconds >= plan.finishTime) return 100

  const t = Math.max(0, Math.min(1, elapsedSeconds / plan.finishTime))
  const progress = 100 * (1 - Math.pow(1 - t, plan.easing))
  return Math.max(0, Math.min(99.9, progress))
}

export function getRankedStreamHorses(horses: any[], plans: SimulationPlan[], elapsedSeconds: number): RankedStreamHorse[] {
  const planById = new Map(plans.map((plan) => [plan.streamId, plan]))

  return horses
    .map((horse, index) => {
      const id = getStreamHorseId(horse, index)
      const plan = planById.get(id)
      const progress = getProgressAtElapsed(plan, elapsedSeconds)
      const finished = !!plan && elapsedSeconds >= plan.finishTime

      return {
        horse,
        id,
        progress,
        finishTime: finished ? plan?.finishTimeLabel : undefined,
        finishTimeSeconds: finished ? plan?.finishTime : undefined,
        originalIndex: index,
        finished,
      }
    })
    .sort((a, b) => {
      const aPlan = planById.get(a.id)
      const bPlan = planById.get(b.id)
      const finishDiff = (aPlan?.finishTime || Number.MAX_SAFE_INTEGER) - (bPlan?.finishTime || Number.MAX_SAFE_INTEGER)
      if (finishDiff !== 0) return finishDiff
      return a.id.localeCompare(b.id)
    })
}
