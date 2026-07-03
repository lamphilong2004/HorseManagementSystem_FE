import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, Text, View } from 'react-native';
import { Award, Medal, Trophy } from 'lucide-react-native';
import * as api from '../../api';
import { LeaderboardEntry, Tournament } from '../../types';
import { Chip, EmptyState, ScreenHeader, Surface } from '../../components/MobileUI';
import { formatPoints, getTournamentId, isActiveTournament } from '../../utils/spectator';

export default function LeaderboardScreen() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [selectedTournamentId, setSelectedTournamentId] = useState('');
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loadingTours, setLoadingTours] = useState(true);
  const [loadingBoard, setLoadingBoard] = useState(false);

  const selectedTournament = useMemo(
    () => tournaments.find((tournament) => getTournamentId(tournament) === selectedTournamentId),
    [selectedTournamentId, tournaments],
  );

  const fetchTournaments = async () => {
    setLoadingTours(true);
    try {
      const list = await api.getPublicTournaments();
      const sorted = [...list].sort((a, b) => {
        const aActive = isActiveTournament(a) ? 1 : 0;
        const bActive = isActiveTournament(b) ? 1 : 0;
        return bActive - aActive;
      });
      setTournaments(sorted);
      if (!selectedTournamentId && sorted.length > 0) {
        setSelectedTournamentId(getTournamentId(sorted[0]));
      }
    } catch (error) {
      console.error('Failed to load leaderboard tournaments', error);
      setTournaments([]);
    } finally {
      setLoadingTours(false);
    }
  };

  const fetchLeaderboard = async (tournamentId: string) => {
    if (!tournamentId) {
      setLeaderboard([]);
      return;
    }
    setLoadingBoard(true);
    try {
      const data = await api.getTournamentLeaderboard(tournamentId);
      setLeaderboard(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load leaderboard', error);
      setLeaderboard([]);
    } finally {
      setLoadingBoard(false);
    }
  };

  useEffect(() => {
    fetchTournaments();
  }, []);

  useEffect(() => {
    fetchLeaderboard(selectedTournamentId);
  }, [selectedTournamentId]);

  const refreshAll = async () => {
    await fetchTournaments();
    await fetchLeaderboard(selectedTournamentId);
  };

  const topEntry = leaderboard[0];

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <ScreenHeader title="Bảng xếp hạng" subtitle="Thứ hạng chiến mã theo từng giải đấu." />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 36 }}
        refreshControl={<RefreshControl refreshing={loadingTours || loadingBoard} onRefresh={refreshAll} />}
      >
        {loadingTours && tournaments.length === 0 ? (
          <View className="py-20 items-center">
            <ActivityIndicator size="large" color="#2563eb" />
          </View>
        ) : tournaments.length === 0 ? (
          <EmptyState icon={Medal} title="Chưa có giải đấu" />
        ) : (
          <View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-5">
              {tournaments.map((tournament) => {
                const id = getTournamentId(tournament);
                return (
                  <Chip
                    key={id || tournament.id}
                    label={tournament.name}
                    active={selectedTournamentId === id}
                    onPress={() => setSelectedTournamentId(id)}
                  />
                );
              })}
            </ScrollView>

            <View className="bg-blue-600 rounded-[28px] p-5 mb-5">
              <Text className="text-blue-100 text-xs font-extrabold uppercase tracking-wider">Đang xem</Text>
              <Text className="text-white text-2xl font-extrabold mt-1" numberOfLines={2}>
                {selectedTournament?.name || 'Chọn giải đấu'}
              </Text>
              <View className="flex-row gap-3 mt-4">
                <View className="flex-1 rounded-2xl bg-white/15 p-3">
                  <Text className="text-blue-100 text-[10px] font-extrabold uppercase">Số hạng</Text>
                  <Text className="text-white text-xl font-extrabold">{leaderboard.length}</Text>
                </View>
                <View className="flex-1 rounded-2xl bg-white/15 p-3">
                  <Text className="text-blue-100 text-[10px] font-extrabold uppercase">Dẫn đầu</Text>
                  <Text className="text-white text-sm font-extrabold mt-1" numberOfLines={1}>
                    {topEntry?.horseName || 'Chưa có'}
                  </Text>
                </View>
              </View>
            </View>

            <Surface className="p-4">
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-lg font-extrabold text-slate-900">Thứ hạng</Text>
                <Trophy size={22} color="#f59e0b" />
              </View>

              {loadingBoard ? (
                <View className="py-12 items-center">
                  <ActivityIndicator color="#2563eb" />
                </View>
              ) : leaderboard.length === 0 ? (
                <EmptyState icon={Award} title="Chưa có dữ liệu xếp hạng" />
              ) : (
                leaderboard.map((entry, index) => {
                  const rank = index + 1;
                  const rankTone = rank === 1 ? 'bg-amber-100 text-amber-700' : rank === 2 ? 'bg-slate-200 text-slate-700' : rank === 3 ? 'bg-orange-100 text-orange-700' : 'bg-blue-50 text-blue-700';
                  return (
                    <View key={entry.id || entry._id || `${entry.horseName}-${index}`} className="flex-row items-center min-h-[68px] border-t border-slate-50">
                      <View className={`w-11 h-11 rounded-2xl items-center justify-center mr-3 ${rankTone.split(' ')[0]}`}>
                        <Text className={`font-extrabold ${rankTone.split(' ')[1]}`}>#{rank}</Text>
                      </View>
                      <View className="flex-1">
                        <Text className="text-base font-extrabold text-slate-900" numberOfLines={1}>{entry.horseName || 'Chiến mã'}</Text>
                        <Text className="text-xs text-slate-500 mt-0.5">Nài ngựa: {entry.jockeyName || 'Chưa rõ'}</Text>
                      </View>
                      <View className="items-end">
                        <Text className="text-xs text-slate-400 font-extrabold uppercase">{entry.wins || 0} thắng</Text>
                        <Text className="text-sm text-amber-700 font-extrabold mt-1">{formatPoints(entry.totalPrize)} điểm</Text>
                      </View>
                    </View>
                  );
                })
              )}
            </Surface>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
