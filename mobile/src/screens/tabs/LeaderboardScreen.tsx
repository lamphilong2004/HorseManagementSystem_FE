import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { BarChart3, ChevronDown, Medal, Trophy } from 'lucide-react-native';
import * as api from '../../api';
import { LeaderboardEntry, Tournament } from '../../types';
import { Surface } from '../../components/MobileUI';
import { formatPoints, getTournamentId, isActiveTournament } from '../../utils/spectator';

function TournamentSelect({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <TouchableOpacity
      activeOpacity={0.84}
      onPress={onPress}
      className="h-[46px] rounded-full border border-slate-200 bg-white px-4 flex-row items-center justify-between"
    >
      <Text className="flex-1 text-base font-bold text-slate-950 mr-3" numberOfLines={1}>{label}</Text>
      <ChevronDown size={20} color="#64748b" />
    </TouchableOpacity>
  );
}

function TournamentSheet({
  visible,
  tournaments,
  selectedTournamentId,
  onSelect,
  onClose,
}: {
  visible: boolean;
  tournaments: Tournament[];
  selectedTournamentId: string;
  onSelect: (id: string) => void;
  onClose: () => void;
}) {
  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-black/45">
        <Pressable className="absolute inset-0" onPress={onClose} />
        <View className="max-h-[70%] rounded-t-[28px] bg-white px-5 pt-5 pb-8">
          <View className="w-12 h-1.5 rounded-full bg-slate-200 self-center mb-5" />
          <Text className="text-lg font-extrabold text-slate-950 mb-4">Chọn giải đấu</Text>
          <ScrollView showsVerticalScrollIndicator={false}>
            {tournaments.map((tournament) => {
              const id = getTournamentId(tournament);
              const active = selectedTournamentId === id;
              return (
                <TouchableOpacity
                  key={id || tournament.id}
                  activeOpacity={0.82}
                  onPress={() => onSelect(id)}
                  className={`min-h-[52px] rounded-2xl px-4 mb-2 flex-row items-center justify-between border ${active ? 'bg-blue-50 border-blue-200' : 'bg-white border-slate-100'}`}
                >
                  <Text className={`flex-1 text-sm font-extrabold mr-3 ${active ? 'text-blue-700' : 'text-slate-700'}`} numberOfLines={2}>
                    {tournament.name}
                  </Text>
                  {active ? <View className="w-2.5 h-2.5 rounded-full bg-blue-600" /> : null}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

export default function LeaderboardScreen() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [selectedTournamentId, setSelectedTournamentId] = useState('');
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loadingTours, setLoadingTours] = useState(true);
  const [loadingBoard, setLoadingBoard] = useState(false);
  const [showTournamentSheet, setShowTournamentSheet] = useState(false);

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

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 14, paddingBottom: 36 }}
        refreshControl={<RefreshControl refreshing={loadingTours || loadingBoard} onRefresh={refreshAll} />}
      >
        <Surface className="p-5 mb-5">
          <View className="flex-row items-start mb-4">
            <Trophy size={26} color="#f59e0b" />
            <View className="flex-1 ml-3">
              <Text className="text-3xl font-extrabold text-slate-950" numberOfLines={1}>Bảng Xếp Hạng</Text>
              <Text className="text-sm text-slate-500 mt-1" numberOfLines={2}>Thứ hạng và giải thưởng theo từng giải đấu.</Text>
            </View>
          </View>

          {loadingTours && tournaments.length === 0 ? (
            <View className="h-[46px] rounded-full border border-slate-200 bg-white items-center justify-center">
              <ActivityIndicator color="#2563eb" />
            </View>
          ) : tournaments.length === 0 ? (
            <View className="h-[46px] rounded-full border border-slate-200 bg-white px-4 justify-center">
              <Text className="text-base font-bold text-slate-400">Chưa có giải đấu</Text>
            </View>
          ) : (
            <TournamentSelect
              label={selectedTournament?.name || 'Chọn giải đấu'}
              onPress={() => setShowTournamentSheet(true)}
            />
          )}
        </Surface>

        <Surface className="overflow-hidden">
          <View className="bg-slate-50 px-5 py-5 flex-row items-center border-b border-slate-200">
            <Medal size={23} color="#f59e0b" />
            <Text className="text-xl font-bold text-slate-950 ml-3">Top Chiến Mã</Text>
          </View>

          {loadingBoard ? (
            <View className="min-h-[250px] items-center justify-center">
              <ActivityIndicator color="#2563eb" />
            </View>
          ) : leaderboard.length === 0 ? (
            <View className="min-h-[250px] items-center justify-center px-6">
              <View className="w-12 h-12 rounded-2xl bg-slate-100 items-center justify-center mb-4">
                <BarChart3 size={28} color="#94a3b8" />
              </View>
              <Text className="text-lg font-extrabold text-slate-950 text-center">Chưa có bảng xếp hạng</Text>
              <Text className="text-sm text-slate-500 text-center mt-2">Bảng xếp hạng sẽ hiển thị khi có dữ liệu trận đấu.</Text>
            </View>
          ) : (
            <View className="px-4 pb-2">
              {leaderboard.map((entry, index) => {
                const rank = index + 1;
                const rankTone = rank === 1 ? 'bg-amber-100 text-amber-700' : rank === 2 ? 'bg-slate-200 text-slate-700' : rank === 3 ? 'bg-orange-100 text-orange-700' : 'bg-blue-50 text-blue-700';
                return (
                  <View key={entry.id || entry._id || `${entry.horseName}-${index}`} className="flex-row items-center min-h-[76px] border-b border-slate-100">
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
              })}
            </View>
          )}
        </Surface>
      </ScrollView>

      <TournamentSheet
        visible={showTournamentSheet}
        tournaments={tournaments}
        selectedTournamentId={selectedTournamentId}
        onSelect={(id) => {
          setSelectedTournamentId(id);
          setShowTournamentSheet(false);
        }}
        onClose={() => setShowTournamentSheet(false)}
      />
    </SafeAreaView>
  );
}
