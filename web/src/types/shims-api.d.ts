// Lightweight module declarations to satisfy relative imports to the api barrel
declare module '../api' {
  export function login(...args: any[]): any
  export function register(...args: any[]): any
  export function getCurrentUserProfile(...args: any[]): any
  export function changePassword(...args: any[]): any

  export function getHorses(...args: any[]): any

  export function getPublicTournaments(...args: any[]): any
  export function getPublicTournament(...args: any[]): any
  export function getTournamentLeaderboard(...args: any[]): any

  export function getPublicRaces(...args: any[]): any
  export function getPublicRace(...args: any[]): any
  export function getRaceHorses(...args: any[]): any
  export function getRaceResults(...args: any[]): any

  export function getInvites(...args: any[]): any
  export function getJockeyLeaderboard(...args: any[]): any

  export function checkPredictionOpen(...args: any[]): any
  export function placePrediction(...args: any[]): any
  export function getMyPredictions(...args: any[]): any
  export function getPredictionDetail(...args: any[]): any

  export function getMyNotifications(...args: any[]): any

  export function getRefereeRaces(...args: any[]): any
  export function getRefereeRaceHorses(...args: any[]): any
  export function getRefereeViolations(...args: any[]): any
  export function createViolation(...args: any[]): any
  export function resolveViolation(...args: any[]): any
  export function confirmRaceResult(...args: any[]): any
  export function createRaceReport(...args: any[]): any
  export function getRaceReport(...args: any[]): any

  export function getAdminUsers(...args: any[]): any

  export function getTournaments(...args: any[]): any
  export function getTournament(...args: any[]): any
  export function getRaces(...args: any[]): any
  export function getRace(...args: any[]): any
  export function getPredictions(...args: any[]): any
}

// Also declare common relative depths used across files
declare module '../../api' {
  export * from '../api'
}
declare module '../../../api' {
  export * from '../api'
}
declare module '../../../../api' {
  export * from '../api'
}
