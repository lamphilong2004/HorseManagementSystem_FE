import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  Activity,
  Check,
  Clock,
  Edit3,
  FileCheck,
  Flag,
  Medal,
  Plus,
  Search,
  Send,
  Trash2,
  Trophy,
  UserCheck,
  Users,
  X,
} from 'lucide-react-native';
import * as api from '../../api';
import { Horse, Invite, Jockey, Race, Tournament } from '../../types';
import { ActionButton, Chip, EmptyState, ScreenHeader, StatTile, Surface } from '../../components/MobileUI';
import {
  dateTimeValue,
  formatDateTime,
  formatPoints,
  getHorseId,
  getHorseName,
  getRaceId,
  sortRacesByScheduledAt,
  sortTournamentsByStartDate,
} from '../../utils/spectator';

type OwnerTab = 'horses' | 'register' | 'registrations' | 'jockeys' | 'invites';

type OwnerRegistration = {
  id?: string;
  _id?: string;
  registrationId?: string;
  race: Race;
  raceId: string;
  horseId: string;
  horseName: string;
  status: string;
  confirmedByOwner?: boolean;
  rejectionReason?: string;
  jockeyId?: any;
  source?: 'RACE' | 'TOURNAMENT';
  tournamentId?: string;
  tournamentName?: string;
};

const emptyHorseForm = {
  name: '',
  breed: '',
  age: '3',
  weight: '450',
  color: '',
  gender: 'MALE' as 'MALE' | 'FEMALE',
  origin: '',
  healthCertUrl: '',
};

function idOf(value: any) {
  if (!value) return '';
  if (typeof value === 'string') return value.trim();
  return String(value._id || value.id || value.userId || value.raceId || value.horseId || '').trim();
}

function isValidHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return ['http:', 'https:'].includes(url.protocol) && Boolean(url.hostname);
  } catch {
    return false;
  }
}

function statusLabel(status?: string) {
  const s = String(status || '').toUpperCase();
  const map: Record<string, string> = {
    PENDING: 'Chờ duyệt',
    PENDING_APPROVAL: 'Chờ duyệt',
    APPROVED: 'Đã duyệt',
    REJECTED: 'Bị từ chối',
    CONFIRMED: 'Đã chốt',
    ACCEPTED: 'Đã đồng ý',
    DECLINED: 'Đã từ chối',
    AVAILABLE: 'Sẵn sàng',
    UNAVAILABLE: 'Bận',
    SCHEDULED: 'Lên lịch',
    ONGOING: 'Đang diễn ra',
    COMPLETED: 'Hoàn thành',
  };
  return map[s] || s || 'Chưa rõ';
}

function statusTone(status?: string) {
  const s = String(status || '').toUpperCase();
  if (['APPROVED', 'ACCEPTED', 'CONFIRMED', 'COMPLETED', 'AVAILABLE'].includes(s)) return 'bg-emerald-100 text-emerald-700 border-emerald-200';
  if (['REJECTED', 'DECLINED', 'UNAVAILABLE'].includes(s)) return 'bg-rose-100 text-rose-700 border-rose-200';
  if (['PENDING', 'PENDING_APPROVAL', 'SCHEDULED'].includes(s)) return 'bg-amber-100 text-amber-700 border-amber-200';
  return 'bg-slate-100 text-slate-700 border-slate-200';
}

function jockeyName(jockey: Jockey | any) {
  return jockey?.userId?.fullName || jockey?.userId?.name || jockey?.fullName || jockey?.name || 'Jockey';
}

function meaningfulLabel(value: unknown, placeholders: string[] = []) {
  const label = String(value || '').trim();
  if (!label) return '';
  return placeholders.some((placeholder) => label.toLowerCase() === placeholder.toLowerCase()) ? '' : label;
}

function raceTournamentId(race: Race | any) {
  return idOf(race?.tournamentId || race?.tournament);
}

function raceTournamentName(race: Race | any) {
  const tournament = race?.tournamentId || race?.tournament;
  return typeof tournament === 'object' ? tournament?.name : 'Giải đấu';
}

function tournamentIdOf(tournament: Tournament | any) {
  return String(tournament?.id || tournament?._id || '').trim();
}

function tournamentRaceForInvite(tournament: Tournament, raceList: Race[]) {
  const tournamentId = tournamentIdOf(tournament);
  const candidates = raceList.filter((race) => raceTournamentId(race) === tournamentId);
  return sortRacesByScheduledAt(candidates)[0];
}

function pseudoRaceFromTournament(tournament: Tournament): Race {
  const tournamentId = tournamentIdOf(tournament);
  return {
    id: tournamentId,
    _id: tournamentId,
    tournamentId: tournament,
    name: tournament.name,
    distance: 0,
    scheduledAt: tournament.startDate,
    maxHorses: 0,
    prizeFirst: 0,
    prizeSecond: 0,
    prizeThird: 0,
    status: tournament.status as Race['status'],
  };
}

function horseAvatarUrl(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const idx = Math.abs(hash) % 50;
  return `https://loremflickr.com/400/400/horse?lock=${idx}`;
}

export default function HorsesScreen() {
  const [activeTab, setActiveTab] = useState<OwnerTab>('horses');
  const [horses, setHorses] = useState<Horse[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [races, setRaces] = useState<Race[]>([]);
  const [jockeys, setJockeys] = useState<Jockey[]>([]);
  const [registrations, setRegistrations] = useState<OwnerRegistration[]>([]);
  const [invitations, setInvitations] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState('');
  const [searchText, setSearchText] = useState('');
  const [selectedHorseId, setSelectedHorseId] = useState('');
  const [selectedRaceId, setSelectedRaceId] = useState('');
  const [busyJockeys, setBusyJockeys] = useState<Set<string>>(new Set());

  const [showHorseModal, setShowHorseModal] = useState(false);
  const [editingHorse, setEditingHorse] = useState<Horse | null>(null);
  const [horseForm, setHorseForm] = useState(emptyHorseForm);

  const [resultsModal, setResultsModal] = useState<{ horseName: string; data: any; loading: boolean } | null>(null);

  const approvedHorses = useMemo(() => horses.filter((horse) => String(horse.status || '').toUpperCase() === 'APPROVED'), [horses]);
  const selectedHorse = horses.find((horse) => getHorseId(horse) === selectedHorseId);

  const openTournaments = useMemo(() => {
    const query = searchText.trim().toLowerCase();
    const filtered = tournaments.filter((tournament) => {
      const status = String(tournament.status || '').toUpperCase();
      const isOpen = ['PUBLISHED', 'ONGOING', 'DRAFT', 'ACTIVE', 'SCHEDULED'].includes(status);
      if (!isOpen) return false;
      if (!query) return true;
      return `${tournament.name} ${tournament.venue || ''}`.toLowerCase().includes(query);
    });
    return sortTournamentsByStartDate(filtered);
  }, [tournaments, searchText]);

  const inviteRaces = useMemo(() => {
    if (!selectedHorseId) return [];
    return registrations.filter((reg) => {
      const status = String(reg.status || '').toUpperCase();
      return reg.horseId === selectedHorseId && ['APPROVED', 'CONFIRMED', 'ACCEPTED', 'APPROVED_BY_ADMIN'].includes(status);
    }).sort((a, b) => dateTimeValue(a.race?.scheduledAt) - dateTimeValue(b.race?.scheduledAt));
  }, [registrations, selectedHorseId]);

  const filteredJockeys = useMemo(() => {
    const query = searchText.trim().toLowerCase();
    return jockeys.filter((jockey) => {
      if (query && !jockeyName(jockey).toLowerCase().includes(query)) return false;
      const ids = [
        idOf(jockey),
        idOf(jockey.userId),
        jockey.userId?._id,
        jockey.userId?.id,
      ].filter(Boolean).map((item) => String(item).trim());
      return !ids.some((item) => busyJockeys.has(item));
    }).sort((a, b) => {
      const dateDiff = dateTimeValue(b.createdAt, 0) - dateTimeValue(a.createdAt, 0);
      return dateDiff !== 0 ? dateDiff : String(idOf(b)).localeCompare(String(idOf(a)));
    });
  }, [jockeys, searchText, busyJockeys]);

  const registrationGroups = useMemo(() => {
    const groups = new Map<string, {
      key: string;
      horseId: string;
      horseName: string;
      tournamentId: string;
      tournamentName: string;
      registrations: OwnerRegistration[];
      status: string;
    }>();

    registrations.forEach((reg) => {
      const tournamentId = raceTournamentId(reg.race) || 'independent';
      const key = `${reg.horseId}-${tournamentId}`;
      const current = groups.get(key) || {
        key,
        horseId: reg.horseId,
        horseName: reg.horseName,
        tournamentId,
        tournamentName: raceTournamentName(reg.race),
        registrations: [] as OwnerRegistration[],
        status: reg.status,
      };
      current.registrations.push(reg);
      const statuses = current.registrations.map((item) => String(item.status || '').toUpperCase());
      current.status = statuses.includes('CONFIRMED')
        ? 'CONFIRMED'
        : statuses.includes('APPROVED')
          ? 'APPROVED'
          : statuses.includes('REJECTED')
            ? 'REJECTED'
            : 'PENDING';
      groups.set(key, current);
    });

    return Array.from(groups.values()).sort((a, b) => {
      const minTime = (items: OwnerRegistration[]) => Math.min(...items.map((item) => dateTimeValue(item.race?.scheduledAt)));
      return minTime(a.registrations) - minTime(b.registrations);
    });
  }, [registrations]);

  const selectedHorseTournamentRegistration = (tournament: Tournament) => {
    const tournamentId = tournamentIdOf(tournament);
    return registrations.find((reg) => (
      reg.horseId === selectedHorseId
      && (reg.tournamentId || raceTournamentId(reg.race)) === tournamentId
    ));
  };

  const registrationButtonLabel = (status?: string) => {
    const normalized = String(status || '').toUpperCase();
    if (['PENDING', 'PENDING_APPROVAL'].includes(normalized)) return 'Chờ admin duyệt';
    if (normalized === 'APPROVED') return 'Đã duyệt';
    if (normalized === 'CONFIRMED') return 'Đã chốt';
    if (normalized === 'REJECTED') return 'Bị từ chối';
    return 'Đăng ký giải';
  };

  const loadOwnerInvites = async (
    horseList: Horse[],
    raceList: Race[],
    tournamentList: Tournament[],
    jockeyList: Jockey[],
  ) => {
    const inviteGroups = await Promise.all(
      horseList.map(async (horse) => {
        try {
          const horseId = getHorseId(horse);
          const items = await api.getHorseJockeys(horseId);
          return items.map((item: any) => {
            const inviteRaceId = idOf(item.raceId || item.race);
            const inviteJockeyId = idOf(item.jockeyId || item.jockey);
            const matchedRace = raceList.find((race) => getRaceId(race) === inviteRaceId);
            const matchedJockey = jockeyList.find((jockey) => (
              idOf(jockey) === inviteJockeyId || idOf(jockey.userId) === inviteJockeyId
            ));
            const tournamentId = matchedRace ? raceTournamentId(matchedRace) : idOf(item.tournamentId || item.tournament);
            const matchedTournament = tournamentList.find((tournament) => tournamentIdOf(tournament) === tournamentId);

            return {
              ...item,
              horseId,
              horseName: horse.name || meaningfulLabel(item.horseName, ['Ngựa thi đấu']),
              jockeyId: inviteJockeyId || item.jockeyId,
              jockey: matchedJockey || item.jockey,
              jockeyName: matchedJockey
                ? jockeyName(matchedJockey)
                : meaningfulLabel(item.jockeyName, ['Jockey']),
              raceId: matchedRace ? getRaceId(matchedRace) : item.raceId,
              race: matchedRace || item.race,
              raceName: matchedRace?.name || meaningfulLabel(item.raceName, ['Chưa xác định']),
              tournamentId,
              tournamentName: matchedTournament?.name
                || meaningfulLabel(item.tournamentName, ['Giải đấu', 'Chưa xác định']),
            };
          });
        } catch {
          return [];
        }
      })
    );
    return inviteGroups.flat();
  };

  const loadRegistrations = async (horseList: Horse[], tournamentList: Tournament[], raceList: Race[]) => {
    const myHorseIds = new Set(horseList.map((horse) => getHorseId(horse)));
    const rows: OwnerRegistration[] = [];

    await Promise.all(
      raceList.map(async (race) => {
        try {
          const raceHorses = await api.getRaceHorses(getRaceId(race));
          const entries = Array.isArray(raceHorses) ? raceHorses : [];
          entries.forEach((entry: any) => {
            const entryHorseId = String(entry.horseId || entry.horse?._id || entry.horse?.id || '').trim();
            if (!myHorseIds.has(entryHorseId)) return;
            const horse = horseList.find((item) => getHorseId(item) === entryHorseId);
            rows.push({
              id: entry.id,
              _id: entry._id,
              registrationId: entry.registrationId || entry.id || entry._id,
              race,
              raceId: getRaceId(race),
              horseId: entryHorseId,
              horseName: horse?.name || entry.horse?.name || 'Ngựa thi đấu',
              status: entry.status || entry.registrationStatus || 'PENDING',
              confirmedByOwner: entry.confirmedByOwner,
              rejectionReason: entry.rejectionReason,
              jockeyId: entry.jockeyId || entry.jockey?._id || entry.jockey?.id || entry.jockey,
              source: 'RACE',
              tournamentId: raceTournamentId(race),
              tournamentName: raceTournamentName(race),
            });
          });
        } catch {
          // Keep partial data usable when one race fails.
        }
      })
    );

    const raceRegistrationKeys = new Set(rows.map((row) => `${row.horseId}:${row.tournamentId || raceTournamentId(row.race)}`));
    const tournamentCandidates = tournamentList.filter((tournament) => {
      const status = String(tournament.status || '').toUpperCase();
      return !['CANCELLED', 'COMPLETED'].includes(status);
    });
    const tournamentRegistrationsByTournament = new Map<string, any[]>();
    let loadedMyTournamentRegistrations = false;

    try {
      const myTournamentRegistrations = await api.getMyTournamentRegistrations();
      loadedMyTournamentRegistrations = myTournamentRegistrations.length > 0;
      myTournamentRegistrations.forEach((registration: any) => {
        const tournamentId = idOf(registration.tournamentId || registration.tournament);
        if (!tournamentId) return;
        const current = tournamentRegistrationsByTournament.get(tournamentId) || [];
        current.push(registration);
        tournamentRegistrationsByTournament.set(tournamentId, current);
      });
    } catch {
      // Older backends may not expose an owner-level tournament-registration endpoint.
    }

    await Promise.all(
      tournamentCandidates.map(async (tournament) => {
        const tournamentId = tournamentIdOf(tournament);
        if (!tournamentId) return;

        try {
          const tournamentRegistrations = tournamentRegistrationsByTournament.get(tournamentId)
            || (loadedMyTournamentRegistrations ? [] : await api.getTournamentRegistrations(tournamentId));
          tournamentRegistrations.forEach((registration: any) => {
            const horseId = idOf(registration.horseId || registration.horse);
            if (!myHorseIds.has(horseId)) return;
            if (raceRegistrationKeys.has(`${horseId}:${tournamentId}`)) return;

            const horse = horseList.find((item) => getHorseId(item) === horseId);
            const linkedRace = tournamentRaceForInvite(tournament, raceList);
            const inviteRace = linkedRace || pseudoRaceFromTournament(tournament);

            rows.push({
              id: registration.id,
              _id: registration._id,
              registrationId: registration.registrationId || registration.id || registration._id,
              race: inviteRace,
              raceId: getRaceId(inviteRace),
              horseId,
              horseName: horse?.name || registration.horseName || 'Ngựa thi đấu',
              status: registration.status || 'PENDING',
              confirmedByOwner: registration.confirmedByOwner,
              rejectionReason: registration.rejectionReason,
              source: 'TOURNAMENT',
              tournamentId,
              tournamentName: tournament.name,
            });
          });
        } catch {
          // Some backends keep tournament-registration lists admin-only. Race-level data above remains usable.
        }
      })
    );

    return rows;
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [horseList, tournamentList, raceList, jockeyList] = await Promise.all([
        api.getHorses().catch(() => []),
        api.getTournaments().catch(() => []),
        api.getRaces().catch(() => []),
        api.searchJockeys({ limit: 100 }).catch(() => []),
      ]);
      const [regRows, inviteRows] = await Promise.all([
        loadRegistrations(horseList, tournamentList, raceList),
        loadOwnerInvites(horseList, raceList, tournamentList, jockeyList),
      ]);

      setHorses(horseList);
      setTournaments(tournamentList);
      setRaces(raceList);
      setJockeys(jockeyList);
      setRegistrations(regRows);
      setInvitations(inviteRows);

      if (!selectedHorseId && horseList.length > 0) {
        setSelectedHorseId(getHorseId(horseList[0]));
      }
    } catch (error) {
      console.error('Failed to load owner data', error);
      Alert.alert('Lỗi', 'Không thể tải dữ liệu chủ ngựa.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (inviteRaces.length === 0) {
      setSelectedRaceId('');
      return;
    }
    if (!inviteRaces.some((reg) => reg.raceId === selectedRaceId)) {
      setSelectedRaceId(inviteRaces[0].raceId);
    }
  }, [inviteRaces, selectedRaceId]);

  useEffect(() => {
    if (!selectedRaceId) {
      setBusyJockeys(new Set());
      return;
    }

    let mounted = true;
    api.getRaceHorses(selectedRaceId)
      .then((entries: any[]) => {
        if (!mounted) return;
        const busy = new Set<string>();
        entries.forEach((entry) => {
          const entryHorseId = String(entry.horseId || entry.horse?._id || entry.horse?.id || '').trim();
          const status = String(entry.status || entry.registrationStatus || '').toUpperCase();
          if (entryHorseId === selectedHorseId || status !== 'CONFIRMED') return;
          [entry.jockeyId, entry.jockey?._id, entry.jockey?.id, entry.jockey?.userId?._id, entry.jockey?.userId?.id, entry.jockey?.userId]
            .filter(Boolean)
            .forEach((value) => busy.add(String(value).trim()));
        });
        setBusyJockeys(busy);
      })
      .catch(() => setBusyJockeys(new Set()));

    return () => {
      mounted = false;
    };
  }, [selectedRaceId, selectedHorseId]);

  const openHorseForm = (horse?: Horse) => {
    setEditingHorse(horse || null);
    setHorseForm(horse ? {
      name: horse.name || '',
      breed: horse.breed || '',
      age: String(horse.age || 3),
      weight: String(horse.weight || 450),
      color: horse.color || '',
      gender: horse.gender || 'MALE',
      origin: horse.origin || '',
      healthCertUrl: horse.healthCertUrl || '',
    } : emptyHorseForm);
    setShowHorseModal(true);
  };

  const saveHorse = async () => {
    const name = horseForm.name.trim();
    const breed = horseForm.breed.trim();
    const color = horseForm.color.trim();
    const origin = horseForm.origin.trim();
    const healthCertUrl = horseForm.healthCertUrl.trim();
    const age = Number(horseForm.age);
    const weight = Number(horseForm.weight);

    if (name.length < 2) {
      Alert.alert('Chưa hợp lệ', 'Tên ngựa phải có ít nhất 2 ký tự.');
      return;
    }
    if (!breed) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập giống ngựa.');
      return;
    }
    if (!color) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập màu sắc của ngựa.');
      return;
    }
    if (!origin) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập xuất xứ của ngựa.');
      return;
    }
    if (!healthCertUrl) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập URL giấy chứng nhận sức khỏe.');
      return;
    }
    if (!isValidHttpUrl(healthCertUrl)) {
      Alert.alert('Chưa hợp lệ', 'URL giấy chứng nhận sức khỏe phải là địa chỉ http hoặc https hợp lệ.');
      return;
    }
    if (!Number.isInteger(age) || age < 2 || age > 20) {
      Alert.alert('Chưa hợp lệ', 'Tuổi ngựa phải từ 2 đến 20.');
      return;
    }
    if (!Number.isInteger(weight) || weight < 300 || weight > 700) {
      Alert.alert('Chưa hợp lệ', 'Cân nặng phải từ 300kg đến 700kg.');
      return;
    }

    setActionLoading('horse');
    try {
      const payload = {
        name,
        breed,
        age,
        weight,
        color,
        gender: horseForm.gender,
        origin,
        healthCertUrl,
      };
      if (editingHorse) {
        await api.updateHorse(getHorseId(editingHorse), payload);
        Alert.alert('Thành công', 'Đã cập nhật hồ sơ ngựa.');
      } else {
        await api.createHorse(payload);
        Alert.alert('Thành công', 'Đã thêm ngựa mới. Vui lòng chờ Admin duyệt.');
      }
      setShowHorseModal(false);
      await fetchData();
    } catch (error: any) {
      Alert.alert('Lỗi', error?.response?.data?.message || 'Không thể lưu hồ sơ ngựa.');
    } finally {
      setActionLoading('');
    }
  };

  const deleteHorse = (horse: Horse) => {
    Alert.alert('Xóa ngựa', `Bạn có chắc chắn muốn xóa "${horse.name}"?`, [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa',
        style: 'destructive',
        onPress: async () => {
          setActionLoading(getHorseId(horse));
          try {
            await api.deleteHorse(getHorseId(horse));
            await fetchData();
          } catch (error: any) {
            Alert.alert('Lỗi', error?.response?.data?.message || 'Không thể xóa ngựa đang tham gia cuộc đua.');
          } finally {
            setActionLoading('');
          }
        },
      },
    ]);
  };

  const openResults = async (horse: Horse) => {
    setResultsModal({ horseName: horse.name, data: null, loading: true });
    try {
      const data = await api.getHorseResults(getHorseId(horse));
      setResultsModal({ horseName: horse.name, data, loading: false });
    } catch (error: any) {
      setResultsModal(null);
      Alert.alert('Lỗi', error?.response?.data?.message || 'Không thể tải kết quả của ngựa.');
    }
  };

  const registerTournament = async (tournament: Tournament) => {
    if (!selectedHorseId) {
      Alert.alert('Chọn ngựa', 'Vui lòng chọn ngựa trước khi đăng ký.');
      return;
    }
    const horse = horses.find((item) => getHorseId(item) === selectedHorseId);
    if (String(horse?.status || '').toUpperCase() !== 'APPROVED') {
      Alert.alert('Chưa thể đăng ký', 'Chỉ ngựa đã được Admin duyệt mới có thể đăng ký giải.');
      return;
    }

    const tournamentId = tournamentIdOf(tournament);
    const inviteRace = tournamentRaceForInvite(tournament, races) || pseudoRaceFromTournament(tournament);
    const upsertPendingRegistration = () => {
      const pendingRegistration: OwnerRegistration = {
        id: `pending-${selectedHorseId}-${tournamentId}`,
        _id: `pending-${selectedHorseId}-${tournamentId}`,
        registrationId: `pending-${selectedHorseId}-${tournamentId}`,
        race: inviteRace,
        raceId: getRaceId(inviteRace),
        horseId: selectedHorseId,
        horseName: horse?.name || 'Ngựa thi đấu',
        status: 'PENDING_APPROVAL',
        source: 'TOURNAMENT',
        tournamentId,
        tournamentName: tournament.name,
      };

      setRegistrations((current) => {
        const exists = current.some((reg) => (
          reg.horseId === selectedHorseId
          && (reg.tournamentId || raceTournamentId(reg.race)) === tournamentId
        ));

        if (!exists) return [...current, pendingRegistration];

        return current.map((reg) => (
          reg.horseId === selectedHorseId
          && (reg.tournamentId || raceTournamentId(reg.race)) === tournamentId
            ? { ...reg, status: reg.status || 'PENDING_APPROVAL' }
            : reg
        ));
      });
    };

    setActionLoading(tournamentId);
    try {
      const result = await api.registerHorseForTournament(selectedHorseId, tournamentId);
      if (result.success.length > 0) {
        upsertPendingRegistration();
        Alert.alert('Đã gửi đăng ký', `Đăng ký ${horse?.name || 'ngựa'} vào giải "${tournament.name}". Admin sẽ phân bổ vào vòng đấu phù hợp.`);
      } else if (result.alreadyRegistered.length > 0) {
        upsertPendingRegistration();
        Alert.alert('Đã đăng ký trước đó', 'Ngựa đã có đăng ký trong giải này.');
      } else {
        Alert.alert('Chưa thành công', result.failed[0]?.error || 'Không thể đăng ký giải đấu.');
      }
    } catch (error: any) {
      Alert.alert('Lỗi', error?.message || error?.response?.data?.message || 'Không thể đăng ký giải đấu.');
    } finally {
      setActionLoading('');
    }
  };

  const confirmRace = async (reg: OwnerRegistration) => {
    setActionLoading(reg.registrationId || reg.raceId);
    try {
      await api.confirmRaceParticipation(reg.horseId, reg.raceId);
      Alert.alert('Thành công', 'Đã xác nhận tham gia cuộc đua.');
      await fetchData();
    } catch (error: any) {
      Alert.alert('Lỗi', error?.response?.data?.message || error?.message || 'Không thể xác nhận tham gia.');
    } finally {
      setActionLoading('');
    }
  };

  const inviteJockey = async (jockey: Jockey) => {
    if (!selectedHorseId || !selectedRaceId) {
      Alert.alert('Thiếu thông tin', 'Vui lòng chọn ngựa và giải/cuộc đua trước khi mời Jockey.');
      return;
    }

    const horse = horses.find((item) => getHorseId(item) === selectedHorseId);
    const race = races.find((item) => getRaceId(item) === selectedRaceId);
    const registeredEntry = registrations.find((reg) => reg.horseId === selectedHorseId && reg.raceId === selectedRaceId);
    const regStatus = String(registeredEntry?.status || '').toUpperCase();

    if (!registeredEntry) {
      Alert.alert('Chưa đăng ký', 'Ngựa chưa đăng ký giải/cuộc đua này.');
      return;
    }
    if (['PENDING', 'PENDING_APPROVAL'].includes(regStatus)) {
      Alert.alert('Chờ duyệt', 'Đăng ký đang chờ Admin duyệt. Vui lòng đợi trước khi mời Jockey.');
      return;
    }
    if (regStatus === 'REJECTED') {
      Alert.alert('Bị từ chối', 'Đăng ký đã bị từ chối, không thể mời Jockey.');
      return;
    }
    if (registeredEntry.source === 'TOURNAMENT' && !race) {
      Alert.alert('Chưa có cuộc đua', 'Giải này đã được duyệt nhưng chưa có cuộc đua để gửi lời mời Jockey.');
      return;
    }

    const jId = getHorseId(jockey);
    if (hasActiveInviteForJockey(jockey)) {
      Alert.alert('Đã mời', 'Jockey này đã được mời cho ngựa và giải/cuộc đua đang chọn.');
      return;
    }

    setActionLoading(jId);
    try {
      await api.sendJockeyInvitation(
        selectedHorseId,
        jId,
        selectedRaceId,
        `Mời bạn cưỡi ngựa của tôi|RACE_ID:${selectedRaceId}`,
        registeredEntry.registrationId,
        race?.name || registeredEntry.tournamentName || registeredEntry.race.name || ''
      );
      const optimisticInvite = {
        id: `pending-invite-${selectedHorseId}-${selectedRaceId}-${jId}`,
        _id: `pending-invite-${selectedHorseId}-${selectedRaceId}-${jId}`,
        horseId: selectedHorseId,
        horseName: horse?.name,
        jockeyId: jId,
        jockey,
        jockeyName: jockeyName(jockey),
        raceId: selectedRaceId,
        race,
        raceName: race?.name || registeredEntry.tournamentName || registeredEntry.race.name || '',
        tournamentId: raceTournamentId(race || registeredEntry.race),
        tournamentName: tournaments.find(
          (tournament) => tournamentIdOf(tournament) === raceTournamentId(race || registeredEntry.race),
        )?.name || registeredEntry.tournamentName || '',
        status: 'PENDING',
        message: 'Mời bạn cưỡi ngựa của tôi',
      } as Invite;

      setInvitations((current) => {
        const exists = current.some((invite: any) => (
          idOf(invite.horseId || invite.horse) === selectedHorseId
          && resolveInviteRaceId(invite) === selectedRaceId
          && idOf(invite.jockeyId || invite.jockey) === jId
          && !['REJECTED', 'DECLINED'].includes(String(invite.status || 'PENDING').toUpperCase())
        ));
        return exists ? current : [...current, optimisticInvite];
      });
      Alert.alert('Đã gửi lời mời', `Đã gửi lời mời đến ${jockeyName(jockey)} cho ${horse?.name || 'ngựa'}.`);
      loadOwnerInvites(horses, races, tournaments, jockeys)
        .then((inviteRows) => {
          setInvitations((current) => {
            const merged = [...inviteRows];
            current.forEach((invite: any) => {
              const exists = merged.some((item: any) => (
                String(item.id || item._id || '') === String(invite.id || invite._id || '')
                || (
                  idOf(item.horseId || item.horse) === idOf(invite.horseId || invite.horse)
                  && resolveInviteRaceId(item) === resolveInviteRaceId(invite)
                  && idOf(item.jockeyId || item.jockey) === idOf(invite.jockeyId || invite.jockey)
                )
              ));
              if (!exists) merged.push(invite);
            });
            return merged;
          });
        })
        .catch(() => {});
    } catch (error: any) {
      Alert.alert('Lỗi', error?.response?.data?.message || error?.response?.data?.error || 'Không thể gửi lời mời.');
    } finally {
      setActionLoading('');
    }
  };

  const resolveInviteRaceId = (invite: Invite | any) => {
    const rawRaceId = idOf(invite.raceId || invite.race);
    const regFallback = registrations.find((reg) => String(reg.registrationId || reg.id || reg._id) === rawRaceId);
    if (regFallback) return regFallback.raceId;
    if (rawRaceId) return rawRaceId;
    const horseId = idOf(invite.horseId);
    return registrations.find((reg) => reg.horseId === horseId)?.raceId || '';
  };

  const hasActiveInviteForJockey = (jockey: Jockey | any) => {
    if (!selectedHorseId || !selectedRaceId) return false;

    const jockeyIds = [
      idOf(jockey),
      idOf(jockey.userId),
      jockey.userId?._id,
      jockey.userId?.id,
    ].filter(Boolean).map((value) => String(value).trim());

    return invitations.some((invite: any) => {
      const status = String(invite.status || 'PENDING').toUpperCase();
      if (['REJECTED', 'DECLINED'].includes(status)) return false;

      const inviteHorseId = idOf(invite.horseId || invite.horse);
      if (inviteHorseId !== selectedHorseId) return false;
      if (resolveInviteRaceId(invite) !== selectedRaceId) return false;

      const inviteJockeyIds = [
        idOf(invite.jockeyId || invite.jockey),
        idOf(invite.jockeyId?.userId),
        idOf(invite.jockey?.userId),
      ].filter(Boolean).map((value) => String(value).trim());

      return inviteJockeyIds.some((id) => jockeyIds.includes(id));
    });
  };

  const confirmInviteJockey = async (invite: Invite | any) => {
    const raceId = resolveInviteRaceId(invite);
    const horseId = idOf(invite.horseId);
    const jId = idOf(invite.jockeyId || invite.jockey);
    if (!horseId || !raceId || !jId) {
      Alert.alert('Thiếu thông tin', 'Lời mời này chưa có đủ dữ liệu để chốt Jockey.');
      return;
    }

    setActionLoading(String(invite.id || invite._id));
    try {
      await api.confirmJockey(horseId, jId, raceId);
      Alert.alert('Thành công', 'Đã chốt Jockey cho cuộc đua.');
      await fetchData();
    } catch (error: any) {
      Alert.alert('Lỗi', error?.response?.data?.message || 'Không thể chốt Jockey.');
    } finally {
      setActionLoading('');
    }
  };

  const renderHorsePicker = () => (
    <View className="mb-4">
      <Text className="text-xs font-extrabold text-slate-500 uppercase mb-2">Chọn ngựa</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {(activeTab === 'register' ? approvedHorses : horses).map((horse) => (
          <Chip
            key={getHorseId(horse)}
            label={horse.name}
            active={selectedHorseId === getHorseId(horse)}
            onPress={() => setSelectedHorseId(getHorseId(horse))}
            tone={String(horse.status || '').toUpperCase() === 'APPROVED' ? 'emerald' : 'amber'}
          />
        ))}
      </ScrollView>
    </View>
  );

  const renderHorses = () => (
    <View>
      <View className="flex-row gap-3 mb-5">
        <StatTile icon={Trophy} label="Tổng ngựa" value={horses.length} tone="blue" />
        <StatTile icon={Check} label="Đã duyệt" value={approvedHorses.length} tone="emerald" />
        <StatTile icon={Clock} label="Chờ duyệt" value={horses.filter((horse) => String(horse.status || '').toUpperCase() === 'PENDING').length} tone="amber" />
      </View>

      {horses.length === 0 ? (
        <EmptyState icon={Trophy} title="Chưa có ngựa" message="Thêm hồ sơ ngựa để bắt đầu đăng ký giải đấu." />
      ) : (
        horses.map((horse) => {
          const tone = statusTone(horse.status);
          return (
            <Surface key={getHorseId(horse)} className="p-4 mb-3">
              <View className="flex-row items-start">
                <Image
                  source={{ uri: horseAvatarUrl(horse.name || getHorseName(horse)) }}
                  className="w-14 h-14 rounded-2xl bg-slate-100 border border-slate-300 mr-3"
                  resizeMode="cover"
                />
                <View className="flex-1">
                  <View className="flex-row items-start justify-between">
                    <View className="flex-1 pr-2">
                      <Text className="text-lg font-extrabold text-slate-900" numberOfLines={1}>{horse.name}</Text>
                      <Text className="text-xs text-slate-500 mt-1" numberOfLines={1}>{horse.breed || 'Chưa rõ giống'} · {horse.origin || 'Chưa rõ xuất xứ'}</Text>
                    </View>
                    <View className={`px-2.5 py-1 rounded-full border ${tone}`}>
                      <Text className={`text-[10px] font-extrabold ${tone.split(' ')[1]}`}>{statusLabel(horse.status)}</Text>
                    </View>
                  </View>

                  <View className="flex-row flex-wrap mt-3 gap-2">
                    <View className="px-3 py-1.5 rounded-full bg-slate-50 border border-slate-100">
                      <Text className="text-xs font-bold text-slate-600">{horse.age || '-'} tuổi</Text>
                    </View>
                    <View className="px-3 py-1.5 rounded-full bg-slate-50 border border-slate-100">
                      <Text className="text-xs font-bold text-slate-600">{horse.weight || '-'} kg</Text>
                    </View>
                    <View className="px-3 py-1.5 rounded-full bg-slate-50 border border-slate-100">
                      <Text className="text-xs font-bold text-slate-600">{horse.gender === 'FEMALE' ? 'Cái' : 'Đực'}</Text>
                    </View>
                  </View>
                </View>
              </View>

              <View className="h-px bg-slate-100 my-4" />
              <View className="flex-row gap-2">
                <TouchableOpacity onPress={() => openResults(horse)} className="flex-1 min-h-[42px] rounded-xl bg-emerald-50 border border-emerald-100 items-center justify-center flex-row">
                  <Medal size={16} color="#059669" />
                  <Text className="text-emerald-700 font-extrabold text-xs ml-1">Kết quả</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => openHorseForm(horse)} className="flex-1 min-h-[42px] rounded-xl bg-blue-50 border border-blue-100 items-center justify-center flex-row">
                  <Edit3 size={16} color="#2563eb" />
                  <Text className="text-blue-700 font-extrabold text-xs ml-1">Sửa</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => deleteHorse(horse)} className="flex-1 min-h-[42px] rounded-xl bg-rose-50 border border-rose-100 items-center justify-center flex-row">
                  <Trash2 size={16} color="#e11d48" />
                  <Text className="text-rose-700 font-extrabold text-xs ml-1">Xóa</Text>
                </TouchableOpacity>
              </View>
            </Surface>
          );
        })
      )}
    </View>
  );

  const renderTournamentRegistration = () => (
    <View>
      {renderHorsePicker()}
      <View className="flex-row items-center bg-white border border-slate-200 rounded-2xl px-3 h-12 mb-4">
        <Search size={18} color="#94a3b8" />
        <TextInput
          className="flex-1 ml-2 text-slate-900"
          placeholder="Tìm giải đấu"
          value={searchText}
          onChangeText={setSearchText}
        />
      </View>
      {approvedHorses.length === 0 ? (
        <EmptyState icon={Trophy} title="Chưa có ngựa đã duyệt" message="Bạn cần ngựa đã được Admin duyệt để đăng ký giải." />
      ) : openTournaments.length === 0 ? (
        <EmptyState icon={Trophy} title="Không có giải đang mở" />
      ) : (
        openTournaments.map((tournament) => {
          const tournamentId = tournamentIdOf(tournament);
          const existingRegistration = selectedHorseTournamentRegistration(tournament);
          const hasRegistration = !!existingRegistration;
          const registering = actionLoading === tournamentId;

          return (
            <Surface key={tournamentId} className="p-4 mb-3">
              <View className="flex-row justify-between items-start">
                <View className="flex-1 pr-3">
                  <Text className="text-base font-extrabold text-slate-900" numberOfLines={2}>{tournament.name}</Text>
                  <Text className="text-sm text-slate-500 mt-1" numberOfLines={1}>{tournament.venue || 'Chưa rõ địa điểm'}</Text>
                  <Text className="text-xs text-slate-400 mt-2">{formatDateTime(tournament.startDate)} - {formatDateTime(tournament.endDate)}</Text>
                </View>
                <View className="items-end">
                  <Text className="text-xs font-extrabold text-amber-700">{formatPoints(tournament.prizePool)} điểm</Text>
                  <Text className="text-[10px] font-extrabold text-slate-400 mt-1">{statusLabel(tournament.status)}</Text>
                </View>
              </View>
              <View className="mt-4">
                <ActionButton
                  label={registrationButtonLabel(existingRegistration?.status)}
                  onPress={() => registerTournament(tournament)}
                  loading={registering}
                  disabled={!selectedHorseId || registering || hasRegistration}
                  icon={hasRegistration ? Clock : Send}
                />
              </View>
            </Surface>
          );
        })
      )}
    </View>
  );

  const renderRegistrations = () => (
    <View>
      {registrationGroups.length === 0 ? (
        <EmptyState icon={FileCheck} title="Chưa có đăng ký" message="Đăng ký ngựa vào giải để theo dõi tiến độ tại đây." />
      ) : (
        registrationGroups.map((group) => {
          const confirmable = group.registrations.find((reg) => String(reg.status || '').toUpperCase() === 'APPROVED' && !reg.confirmedByOwner);
          const assigned = group.registrations.filter((reg) => ['APPROVED', 'CONFIRMED'].includes(String(reg.status || '').toUpperCase())).length;
          const pending = group.registrations.filter((reg) => ['PENDING', 'PENDING_APPROVAL'].includes(String(reg.status || '').toUpperCase())).length;
          const tone = statusTone(group.status);
          return (
            <Surface key={group.key} className="p-4 mb-3">
              <View className="flex-row justify-between items-start">
                <View className="flex-1 pr-3">
                  <Text className="text-base font-extrabold text-slate-900" numberOfLines={1}>{group.horseName}</Text>
                  <Text className="text-sm font-bold text-blue-700 mt-1" numberOfLines={1}>{group.tournamentName}</Text>
                </View>
                <View className={`px-3 py-1 rounded-full border ${tone}`}>
                  <Text className={`text-[10px] font-extrabold ${tone.split(' ')[1]}`}>{statusLabel(group.status)}</Text>
                </View>
              </View>
              <View className="flex-row gap-3 mt-4">
                <Surface className="flex-1 p-3 bg-slate-50 shadow-none">
                  <Text className="text-xl font-extrabold text-slate-900 text-center">{assigned}</Text>
                  <Text className="text-[10px] font-extrabold text-slate-400 text-center uppercase">Đã xếp</Text>
                </Surface>
                <Surface className="flex-1 p-3 bg-slate-50 shadow-none">
                  <Text className="text-xl font-extrabold text-slate-900 text-center">{pending}</Text>
                  <Text className="text-[10px] font-extrabold text-slate-400 text-center uppercase">Chờ</Text>
                </Surface>
              </View>
              {confirmable ? (
                <View className="mt-4">
                  <ActionButton
                    label="Xác nhận tham gia"
                    onPress={() => confirmRace(confirmable)}
                    loading={actionLoading === (confirmable.registrationId || confirmable.raceId)}
                    icon={Check}
                    variant="secondary"
                  />
                </View>
              ) : null}
            </Surface>
          );
        })
      )}
    </View>
  );

  const renderJockeys = () => (
    <View>
      {renderHorsePicker()}
      {inviteRaces.length > 0 ? (
        <View className="mb-4">
          <Text className="text-xs font-extrabold text-slate-500 uppercase mb-2">Chọn giải/cuộc đua đã duyệt</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {inviteRaces.map((reg) => (
              <Chip
                key={`${reg.source || 'RACE'}-${reg.registrationId || reg.raceId}`}
                label={reg.source === 'TOURNAMENT' ? (reg.tournamentName || reg.race.name) : reg.race.name}
                active={selectedRaceId === reg.raceId}
                onPress={() => setSelectedRaceId(reg.raceId)}
                tone="blue"
              />
            ))}
          </ScrollView>
        </View>
      ) : (
        <Surface className="p-4 mb-4 bg-amber-50 border-amber-100">
          <Text className="text-sm font-bold text-amber-800">Ngựa được chọn chưa có giải/cuộc đua đã duyệt để mời Jockey.</Text>
        </Surface>
      )}
      <View className="flex-row items-center bg-white border border-slate-200 rounded-2xl px-3 h-12 mb-4">
        <Search size={18} color="#94a3b8" />
        <TextInput
          className="flex-1 ml-2 text-slate-900"
          placeholder="Tìm Jockey"
          value={searchText}
          onChangeText={setSearchText}
        />
      </View>
      {filteredJockeys.length === 0 ? (
        <EmptyState icon={Users} title="Không tìm thấy Jockey" />
      ) : (
        filteredJockeys.map((jockey) => {
          const available = String(jockey.status || '').toUpperCase() === 'AVAILABLE';
          const name = jockeyName(jockey);
          const jockeyId = getHorseId(jockey);
          const invited = hasActiveInviteForJockey(jockey);
          const sending = actionLoading === jockeyId;
          const disabled = !available || !selectedRaceId || invited || sending;
          return (
            <Surface key={jockeyId} className="p-4 mb-3">
              <View className="flex-row items-center">
                <View className={`w-12 h-12 rounded-2xl items-center justify-center mr-3 ${available ? 'bg-emerald-50' : 'bg-slate-100'}`}>
                  <Text className={`font-extrabold ${available ? 'text-emerald-700' : 'text-slate-500'}`}>{name.slice(0, 2).toUpperCase()}</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-base font-extrabold text-slate-900" numberOfLines={1}>{name}</Text>
                  <Text className="text-xs text-slate-500 mt-1">{jockey.experience || 0} năm · {jockey.wins || 0}/{jockey.races || 0} thắng · {jockey.winRate || 0}%</Text>
                </View>
                <View className={`px-2.5 py-1 rounded-full border ${statusTone(jockey.status)}`}>
                  <Text className={`text-[10px] font-extrabold ${statusTone(jockey.status).split(' ')[1]}`}>{statusLabel(jockey.status)}</Text>
                </View>
              </View>
              <View className="mt-4">
                <TouchableOpacity
                  activeOpacity={0.86}
                  disabled={disabled}
                  onPress={() => inviteJockey(jockey)}
                  className={`min-h-[52px] rounded-2xl px-4 flex-row items-center justify-center ${
                    invited
                      ? 'bg-slate-700'
                      : !available || !selectedRaceId
                        ? 'bg-slate-300'
                        : 'bg-blue-600'
                  }`}
                >
                  {sending ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <>
                      {invited ? <Check size={18} color="white" /> : <Send size={18} color="white" />}
                      <Text className="text-white font-extrabold ml-2">
                        {invited ? 'Đã mời' : available ? 'Mời Jockey' : 'Không khả dụng'}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </Surface>
          );
        })
      )}
    </View>
  );

  const renderInvitations = () => (
    <View>
      {invitations.length === 0 ? (
        <EmptyState icon={Send} title="Chưa có lời mời" message="Gửi lời mời ở tab Tuyển Jockey để theo dõi phản hồi." />
      ) : (
        invitations.map((invite: any) => {
          const raceId = resolveInviteRaceId(invite);
          const matchedReg = registrations.find((reg) => reg.horseId === idOf(invite.horseId) && reg.raceId === raceId);
          const matchedHorse = horses.find((horse) => getHorseId(horse) === idOf(invite.horseId));
          const matchedRace = races.find((race) => getRaceId(race) === raceId) || matchedReg?.race;
          const regJockeyId = idOf(matchedReg?.jockeyId);
          const thisJockeyId = idOf(invite.jockeyId || invite.jockey);
          const matchedJockey = jockeys.find((jockey) => (
            idOf(jockey) === thisJockeyId || idOf(jockey.userId) === thisJockeyId
          ));
          const tournamentId = idOf(invite.tournamentId || invite.tournament)
            || matchedReg?.tournamentId
            || raceTournamentId(matchedRace);
          const matchedTournament = tournaments.find((tournament) => tournamentIdOf(tournament) === tournamentId);
          const hasConfirmedForRace = invitations.some((item: any) => resolveInviteRaceId(item) === raceId && item.status === 'CONFIRMED');
          const isThisConfirmed = invite.status === 'CONFIRMED' || (!!regJockeyId && regJockeyId === thisJockeyId);
          const isOtherConfirmed = !isThisConfirmed && (!!regJockeyId || hasConfirmedForRace) && invite.status !== 'REJECTED';
          const displayStatus = isThisConfirmed ? 'CONFIRMED' : isOtherConfirmed ? 'OTHER_CONFIRMED' : invite.status || 'PENDING';
          const tone = statusTone(displayStatus);
          const name = matchedJockey
            ? jockeyName(matchedJockey)
            : meaningfulLabel(invite.jockeyName, ['Jockey'])
              || jockeyName(invite.jockeyId || invite.jockey);
          const horseName = matchedHorse?.name
            || matchedReg?.horseName
            || meaningfulLabel(invite.horseName, ['Ngựa thi đấu'])
            || 'Chưa xác định';
          const raceName = matchedRace?.name
            || matchedReg?.race?.name
            || meaningfulLabel(invite.raceName, ['Chưa xác định'])
            || 'Chưa xác định';
          const tournamentName = matchedTournament?.name
            || matchedReg?.tournamentName
            || meaningfulLabel(invite.tournamentName, ['Giải đấu', 'Chưa xác định'])
            || (tournamentId ? 'Chưa xác định' : 'Cuộc đua độc lập');

          return (
            <Surface key={String(invite.id || invite._id)} className="p-4 mb-3">
              <View className="flex-row justify-between items-start">
                <View className="flex-1 pr-3">
                  <Text className="text-base font-extrabold text-slate-900" numberOfLines={1}>{name}</Text>
                  <Text className="text-xs text-slate-500 mt-1" numberOfLines={1}>Ngựa: {horseName}</Text>
                  <Text className="text-xs text-purple-700 font-bold mt-1" numberOfLines={1}>Giải đấu: {tournamentName}</Text>
                  <Text className="text-xs text-blue-700 font-bold mt-1" numberOfLines={1}>Cuộc đua: {raceName}</Text>
                </View>
                <View className={`px-2.5 py-1 rounded-full border ${displayStatus === 'OTHER_CONFIRMED' ? 'bg-slate-100 text-slate-600 border-slate-200' : tone}`}>
                  <Text className={`text-[10px] font-extrabold ${displayStatus === 'OTHER_CONFIRMED' ? 'text-slate-600' : tone.split(' ')[1]}`}>
                    {displayStatus === 'OTHER_CONFIRMED' ? 'Đã chốt khác' : statusLabel(displayStatus)}
                  </Text>
                </View>
              </View>
              {invite.message ? <Text className="text-sm text-slate-500 italic mt-3">"{String(invite.message).split('|RACE_ID:')[0]}"</Text> : null}
              {displayStatus === 'ACCEPTED' ? (
                <View className="mt-4">
                  <ActionButton
                    label={isOtherConfirmed ? 'Đã chốt người khác' : 'Chốt Jockey'}
                    onPress={() => confirmInviteJockey(invite)}
                    disabled={isOtherConfirmed}
                    loading={actionLoading === String(invite.id || invite._id)}
                    icon={UserCheck}
                    variant="secondary"
                  />
                </View>
              ) : null}
            </Surface>
          );
        })
      )}
    </View>
  );

  const renderActiveTab = () => {
    if (activeTab === 'register') return renderTournamentRegistration();
    if (activeTab === 'registrations') return renderRegistrations();
    if (activeTab === 'jockeys') return renderJockeys();
    if (activeTab === 'invites') return renderInvitations();
    return renderHorses();
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <ScreenHeader
        title="Ngựa của tôi"
        subtitle="Quản lý đàn ngựa, đăng ký giải và tuyển Jockey."
        profileActionBelow={
          <TouchableOpacity onPress={() => openHorseForm()} className="w-11 h-11 rounded-full bg-blue-600 items-center justify-center">
            <Plus color="white" size={22} />
          </TouchableOpacity>
        }
      />

      <View className="px-5 pb-3 bg-slate-50">
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <Chip label="Hồ sơ" active={activeTab === 'horses'} onPress={() => { setActiveTab('horses'); setSearchText(''); }} tone="blue" />
          <Chip label="Đăng ký giải" active={activeTab === 'register'} onPress={() => { setActiveTab('register'); setSearchText(''); }} tone="emerald" />
          <Chip label="Đã đăng ký" active={activeTab === 'registrations'} onPress={() => { setActiveTab('registrations'); setSearchText(''); }} tone="amber" />
          <Chip label="Tuyển Jockey" active={activeTab === 'jockeys'} onPress={() => { setActiveTab('jockeys'); setSearchText(''); }} tone="purple" />
          <Chip label="Lời mời" active={activeTab === 'invites'} onPress={() => { setActiveTab('invites'); setSearchText(''); }} tone="slate" />
        </ScrollView>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 36 }}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchData} />}
      >
        {loading && horses.length === 0 ? (
          <View className="py-20 items-center justify-center">
            <ActivityIndicator size="large" color="#2563eb" />
          </View>
        ) : (
          renderActiveTab()
        )}
      </ScrollView>

      <Modal visible={showHorseModal} transparent animationType="slide" onRequestClose={() => setShowHorseModal(false)}>
        <View className="flex-1 bg-black/40 justify-end">
          <View className="bg-white rounded-t-[28px] p-5 max-h-[88%]">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-xl font-extrabold text-slate-900">{editingHorse ? 'Sửa hồ sơ ngựa' : 'Thêm ngựa mới'}</Text>
              <TouchableOpacity onPress={() => setShowHorseModal(false)} className="w-10 h-10 rounded-full bg-slate-100 items-center justify-center">
                <X size={20} color="#64748b" />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {[
                { key: 'name', label: 'Tên ngựa', placeholder: 'Lightning' },
                { key: 'breed', label: 'Giống', placeholder: 'Thoroughbred' },
                { key: 'color', label: 'Màu sắc', placeholder: 'Nâu đen' },
                { key: 'origin', label: 'Xuất xứ', placeholder: 'Việt Nam' },
                { key: 'healthCertUrl', label: 'URL giấy sức khỏe', placeholder: 'https://...' },
              ].map((field) => (
                <View key={field.key} className="mb-3">
                  <Text className="text-xs font-extrabold text-slate-500 uppercase mb-2">{field.label}</Text>
                  <TextInput
                    className="h-12 rounded-2xl bg-slate-50 border border-slate-200 px-4 text-slate-900 font-semibold"
                    placeholder={field.placeholder}
                    value={(horseForm as any)[field.key]}
                    onChangeText={(value) => setHorseForm((current) => ({ ...current, [field.key]: value }))}
                  />
                </View>
              ))}
              <View className="flex-row gap-3 mb-3">
                <View className="flex-1">
                  <Text className="text-xs font-extrabold text-slate-500 uppercase mb-2">Tuổi</Text>
                  <TextInput
                    className="h-12 rounded-2xl bg-slate-50 border border-slate-200 px-4 text-slate-900 font-semibold"
                    keyboardType="numeric"
                    value={horseForm.age}
                    onChangeText={(value) => setHorseForm((current) => ({ ...current, age: value.replace(/\D/g, '') }))}
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-xs font-extrabold text-slate-500 uppercase mb-2">Cân nặng</Text>
                  <TextInput
                    className="h-12 rounded-2xl bg-slate-50 border border-slate-200 px-4 text-slate-900 font-semibold"
                    keyboardType="numeric"
                    value={horseForm.weight}
                    onChangeText={(value) => setHorseForm((current) => ({ ...current, weight: value.replace(/\D/g, '') }))}
                  />
                </View>
              </View>
              <View className="mb-5">
                <Text className="text-xs font-extrabold text-slate-500 uppercase mb-2">Giới tính</Text>
                <View className="flex-row gap-3">
                  <Chip label="Đực" active={horseForm.gender === 'MALE'} onPress={() => setHorseForm((current) => ({ ...current, gender: 'MALE' }))} tone="blue" />
                  <Chip label="Cái" active={horseForm.gender === 'FEMALE'} onPress={() => setHorseForm((current) => ({ ...current, gender: 'FEMALE' }))} tone="emerald" />
                </View>
              </View>
              <ActionButton label="Lưu thông tin" onPress={saveHorse} loading={actionLoading === 'horse'} icon={Check} />
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal visible={!!resultsModal} transparent animationType="fade" onRequestClose={() => setResultsModal(null)}>
        <View className="flex-1 bg-black/40 justify-end">
          <View className="bg-white rounded-t-[28px] p-5 max-h-[80%]">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-xl font-extrabold text-slate-900" numberOfLines={1}>Kết quả: {resultsModal?.horseName}</Text>
              <TouchableOpacity onPress={() => setResultsModal(null)} className="w-10 h-10 rounded-full bg-slate-100 items-center justify-center">
                <X size={20} color="#64748b" />
              </TouchableOpacity>
            </View>
            {resultsModal?.loading ? (
              <View className="py-10 items-center">
                <ActivityIndicator size="large" color="#2563eb" />
              </View>
            ) : resultsModal?.data?.results?.length ? (
              <ScrollView>
                {resultsModal.data.stats ? (
                  <View className="flex-row gap-3 mb-4">
                    <StatTile icon={Flag} label="Tổng" value={resultsModal.data.stats.totalRaces || 0} tone="blue" />
                    <StatTile icon={Trophy} label="Thắng" value={resultsModal.data.stats.wins || 0} tone="emerald" />
                    <StatTile icon={Medal} label="Top 3" value={resultsModal.data.stats.topThree || 0} tone="amber" />
                  </View>
                ) : null}
                {resultsModal.data.results.map((item: any, index: number) => (
                  <Surface key={item._id || item.id || index} className="p-4 mb-3">
                    <View className="flex-row items-center">
                      <View className="w-10 h-10 rounded-2xl bg-emerald-100 items-center justify-center mr-3">
                        <Text className="text-emerald-800 font-extrabold">#{item.position || index + 1}</Text>
                      </View>
                      <View className="flex-1">
                        <Text className="text-base font-extrabold text-slate-900" numberOfLines={1}>{item.raceName || item.raceId?.name || 'Cuộc đua'}</Text>
                        <Text className="text-xs text-slate-500 mt-1">{item.finishTime || 'Chưa có thời gian'} · {formatPoints(item.prizeAmount)} điểm</Text>
                      </View>
                    </View>
                  </Surface>
                ))}
              </ScrollView>
            ) : (
              <EmptyState icon={Activity} title="Chưa có kết quả thi đấu" />
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
