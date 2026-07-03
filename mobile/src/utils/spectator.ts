import { Prediction, Race, Tournament } from '../types';

export function formatPoints(value?: number | string) {
  const amount = Number(value || 0);
  return amount.toLocaleString('vi-VN');
}

export function formatDateTime(value?: string) {
  if (!value) return 'Chua co lich';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return `${date.toLocaleDateString('vi-VN')} ${date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`;
}

export function getId(value: any) {
  if (!value) return '';
  if (typeof value === 'string') return value;
  return String(value._id || value.id || value.userId || value.raceId || value.horseId || '').trim();
}

export function getTournamentId(value: any) {
  return getId(value?.tournamentId || value?.tournament || value);
}

export function getRaceId(value: Race | Prediction | any) {
  return getId(value?.raceId || value?.race || value);
}

export function getRaceName(value: Race | Prediction | any) {
  const race = value?.raceId && typeof value.raceId === 'object' ? value.raceId : value?.race;
  const name = value?.raceName || value?.name || race?.name || race?.raceName;
  const raceId = getRaceId(value);
  return name || (raceId ? `Tran dau ${raceId.substring(0, 8)}...` : 'Tran dau');
}

export function getHorseId(value: any) {
  return getId(value?.horseId || value?.horse || value);
}

export function getHorseName(value: any) {
  return value?.pickedHorseName || value?.horseName || value?.horse?.name || value?.horseId?.name || value?.name || 'Ngua thi dau';
}

export function isPredictionRaceStatus(status?: string) {
  return ['open', 'active', 'scheduled', 'ongoing', 'live', 'running'].includes((status || '').toLowerCase());
}

export function isLiveRace(race: Race) {
  const status = (race.status || '').toLowerCase();
  return race.isLive === true || ['ongoing', 'live', 'running'].includes(status);
}

export function isUpcomingRace(race: Race) {
  const status = (race.status || '').toLowerCase();
  const scheduledAt = race.scheduledAt ? new Date(race.scheduledAt).getTime() : 0;
  return ['scheduled', 'pending'].includes(status) && (!scheduledAt || scheduledAt >= Date.now() - 60 * 60 * 1000);
}

export function isActiveTournament(tournament: Tournament) {
  const status = (tournament.status || '').toLowerCase();
  const activeByStatus = ['ongoing', 'active', 'published', 'scheduled'].includes(status);
  const endTime = tournament.endDate ? new Date(tournament.endDate).getTime() : 0;
  return activeByStatus && (!endTime || endTime >= Date.now());
}
