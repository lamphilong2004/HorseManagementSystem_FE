import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Calendar, ChevronRight, Flag, MapPin, Search, Trophy } from 'lucide-react-native';
import * as api from '../../api';
import { Race, Tournament } from '../../types';
import { Chip, EmptyState, ScreenHeader, StatTile, Surface } from '../../components/MobileUI';
import { formatDateTime, formatPoints, getRaceId, getTournamentId, isActiveTournament } from '../../utils/spectator';

const FILTERS = [
  { value: 'all', label: 'Tất cả' },
  { value: 'active', label: 'Đang diễn ra' },
  { value: 'published', label: 'Đã công bố' },
  { value: 'completed', label: 'Hoàn thành' },
];

export default function TournamentsScreen() {
  const router = useRouter();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [races, setRaces] = useState<Race[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [tourList, raceList] = await Promise.all([
        api.getPublicTournaments().catch(() => []),
        api.getPublicRaces({ limit: 1000 }).catch(() => []),
      ]);
      setTournaments(tourList);
      setRaces(raceList);
    } catch (error) {
      console.error('Failed to load tournaments', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredTournaments = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return tournaments.filter((tournament) => {
      const status = (tournament.status || '').toLowerCase();
      const matchesFilter =
        filter === 'all'
        || (filter === 'active' ? isActiveTournament(tournament) : status === filter);
      const matchesQuery =
        !normalizedQuery
        || tournament.name.toLowerCase().includes(normalizedQuery)
        || (tournament.venue || '').toLowerCase().includes(normalizedQuery)
        || (tournament.description || '').toLowerCase().includes(normalizedQuery);
      return matchesFilter && matchesQuery;
    });
  }, [filter, query, tournaments]);

  const activeCount = tournaments.filter(isActiveTournament).length;

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <ScreenHeader title="Giải đấu" subtitle="Theo dõi các giải đấu và lịch cuộc đua." />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 36 }}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchData} />}
      >
        <View className="flex-row gap-3 mb-5">
          <StatTile icon={Trophy} label="Tổng giải" value={tournaments.length} tone="blue" />
          <StatTile icon={Flag} label="Đang mở" value={activeCount} tone="emerald" />
        </View>

        <View className="h-12 rounded-2xl border border-slate-200 bg-white px-3 flex-row items-center mb-3">
          <Search size={18} color="#94a3b8" />
          <TextInput
            className="flex-1 ml-2 text-slate-700"
            placeholder="Tìm giải đấu, địa điểm"
            value={query}
            onChangeText={setQuery}
          />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-5">
          {FILTERS.map((item) => (
            <Chip key={item.value} label={item.label} active={filter === item.value} onPress={() => setFilter(item.value)} />
          ))}
        </ScrollView>

        {loading && tournaments.length === 0 ? (
          <View className="py-20 items-center">
            <ActivityIndicator size="large" color="#2563eb" />
          </View>
        ) : filteredTournaments.length === 0 ? (
          <EmptyState icon={Trophy} title="Không có giải đấu phù hợp" />
        ) : (
          filteredTournaments.map((tournament) => {
            const tournamentId = getTournamentId(tournament);
            const tournamentRaces = races.filter((race) => getTournamentId(race) === tournamentId);
            return (
              <Surface key={tournamentId || tournament.id} className="p-4 mb-4">
                <View className="flex-row items-start justify-between mb-3">
                  <View className="flex-1 pr-3">
                    <Text className="text-lg font-extrabold text-slate-900" numberOfLines={2}>{tournament.name}</Text>
                    <View className="flex-row items-center mt-2">
                      <MapPin size={15} color="#64748b" />
                      <Text className="text-sm text-slate-500 ml-1 flex-1" numberOfLines={1}>{tournament.venue || 'Chưa rõ địa điểm'}</Text>
                    </View>
                  </View>
                  <View className="px-3 py-1.5 rounded-full bg-slate-100">
                    <Text className="text-[10px] font-extrabold text-slate-600">{tournament.status || 'DRAFT'}</Text>
                  </View>
                </View>

                <View className="flex-row gap-2 mb-3">
                  <View className="flex-1 rounded-2xl bg-slate-50 p-3">
                    <Text className="text-[10px] text-slate-400 font-extrabold uppercase">Thời gian</Text>
                    <Text className="text-xs text-slate-700 font-bold mt-1">{formatDateTime(tournament.startDate)}</Text>
                  </View>
                  <View className="flex-1 rounded-2xl bg-slate-50 p-3">
                    <Text className="text-[10px] text-slate-400 font-extrabold uppercase">Giải thưởng</Text>
                    <Text className="text-xs text-amber-700 font-extrabold mt-1">{formatPoints(tournament.prizePool)} điểm</Text>
                  </View>
                </View>

                <View className="h-px bg-slate-100 mb-3" />
                <View className="flex-row items-center justify-between mb-2">
                  <Text className="text-xs font-extrabold text-slate-500 uppercase">Cuộc đua ({tournamentRaces.length})</Text>
                  <Calendar size={14} color="#94a3b8" />
                </View>

                {tournamentRaces.length === 0 ? (
                  <Text className="text-sm text-slate-400">Chưa có cuộc đua được lên lịch.</Text>
                ) : (
                  tournamentRaces.slice(0, 4).map((race) => (
                    <TouchableOpacity
                      activeOpacity={0.84}
                      key={getRaceId(race)}
                      onPress={() => router.push(`/${getRaceId(race)}`)}
                      className="flex-row items-center min-h-[58px] border-t border-slate-50"
                    >
                      <View className="w-10 h-10 rounded-2xl bg-blue-50 items-center justify-center mr-3">
                        <Flag size={17} color="#2563eb" />
                      </View>
                      <View className="flex-1">
                        <Text className="text-sm font-extrabold text-slate-900" numberOfLines={1}>{race.name}</Text>
                        <Text className="text-xs text-slate-500 mt-0.5">{formatDateTime(race.scheduledAt)}</Text>
                      </View>
                      <ChevronRight size={18} color="#cbd5e1" />
                    </TouchableOpacity>
                  ))
                )}
              </Surface>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
