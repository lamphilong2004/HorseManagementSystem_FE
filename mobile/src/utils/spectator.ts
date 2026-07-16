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

export function dateTimeValue(value?: string, fallback = Number.MAX_SAFE_INTEGER) {
  if (!value) return fallback;
  const time = new Date(value).getTime();
  return Number.isFinite(time) ? time : fallback;
}

function compareStableName(a: any, b: any) {
  const nameDiff = String(a?.name || '').localeCompare(String(b?.name || ''), 'vi');
  if (nameDiff !== 0) return nameDiff;
  return String(a?._id || a?.id || '').localeCompare(String(b?._id || b?.id || ''));
}

export function sortTournamentsByStartDate<T extends { startDate?: string; name?: string; id?: any; _id?: any }>(items: T[]) {
  return [...items].sort((a, b) => {
    const diff = dateTimeValue(a.startDate) - dateTimeValue(b.startDate);
    return diff !== 0 ? diff : compareStableName(a, b);
  });
}

export function sortRacesByScheduledAt<T extends { scheduledAt?: string; name?: string; id?: any; _id?: any }>(items: T[]) {
  return [...items].sort((a, b) => {
    const diff = dateTimeValue(a.scheduledAt) - dateTimeValue(b.scheduledAt);
    return diff !== 0 ? diff : compareStableName(a, b);
  });
}

export function sortRacesByWebNearest<T extends { status?: string; scheduledAt?: string; name?: string; id?: any; _id?: any }>(items: T[]) {
  const statusOrder = (race: T) => {
    const status = String(race.status || '').toUpperCase();
    if (['ONGOING', 'LIVE'].includes(status)) return 0;
    if (['SCHEDULED', 'PENDING'].includes(status)) return 1;
    return 2;
  };

  return [...items].sort((a, b) => {
    const statusDiff = statusOrder(a) - statusOrder(b);
    if (statusDiff !== 0) return statusDiff;
    const timeDiff = dateTimeValue(a.scheduledAt) - dateTimeValue(b.scheduledAt);
    return timeDiff !== 0 ? timeDiff : compareStableName(a, b);
  });
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
