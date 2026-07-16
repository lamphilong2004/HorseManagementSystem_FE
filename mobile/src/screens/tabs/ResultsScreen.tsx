import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Award, BarChart2, ChevronRight, Flag, List, Medal, Trophy } from 'lucide-react-native';
import * as api from '../../api';
import { useAuth } from '../../context/AuthContext';
import { Race } from '../../types';
import { EmptyState, ScreenHeader, StatTile, Surface } from '../../components/MobileUI';
import { formatDateTime, formatPoints } from '../../utils/spectator';

function statusLabel(status?: string) {
  const s = String(status || '').toUpperCase();
  const map: Record<string, string> = {
    PENDING: 'Chờ duyệt',
    SCHEDULED: 'Lên lịch',
    ONGOING: 'Đang diễn ra',
    COMPLETED: 'Hoàn thành',
    RESULT_CONFIRMED: 'Đã có kết quả',
    CANCELLED: 'Đã hủy',
  };
  return map[s] || s || 'Chưa rõ';
}

function statusTone(status?: string) {
  const s = String(status || '').toUpperCase();
  if (['COMPLETED', 'RESULT_CONFIRMED', 'CONFIRMED'].includes(s)) return 'bg-emerald-100 text-emerald-700 border-emerald-200';
  if (['SCHEDULED', 'ONGOING'].includes(s)) return 'bg-blue-100 text-blue-700 border-blue-200';
  if (s === 'CANCELLED') return 'bg-rose-100 text-rose-700 border-rose-200';
  return 'bg-slate-100 text-slate-700 border-slate-200';
}

export default function ResultsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const isJockey = user?.role === 'JOCKEY';
  const [races, setRaces] = useState<Race[]>([]);
  const [jockeyData, setJockeyData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (isJockey) {
        const data = await api.getJockeyResults();
        setJockeyData(data);
      } else {
        const data = await api.getRaces();
        setRaces(data);
      }
    } catch (error) {
      console.error('Failed to fetch results', error);
      if (isJockey) setJockeyData({ stats: null, results: [] });
      else setRaces([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [isJockey]);

  const renderJockeyResults = () => {
    const stats = jockeyData?.stats || {};
    const results = jockeyData?.results || [];
    return (
      <View>
        <View className="flex-row flex-wrap gap-3 mb-5">
          <StatTile icon={Flag} label="Tổng trận" value={stats.totalRaces || 0} tone="blue" />
          <StatTile icon={Trophy} label="Thắng" value={stats.wins || 0} tone="emerald" />
          <StatTile icon={Medal} label="Top 3" value={stats.topThree || 0} tone="amber" />
          <StatTile icon={Award} label="Giải thưởng" value={formatPoints(stats.totalPrizes)} tone="purple" />
        </View>

        {results.length === 0 ? (
          <EmptyState icon={Trophy} title="Chưa có kết quả" message="Kết quả cá nhân sẽ hiển thị sau khi cuộc đua được xác nhận." />
        ) : (
          results.map((result: any, index: number) => (
            <Surface key={String(result._id || result.id || index)} className="p-4 mb-3">
              <View className="flex-row items-center">
                <View className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-100 items-center justify-center mr-3">
                  <Text className="text-amber-800 font-extrabold">#{result.position || index + 1}</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-base font-extrabold text-slate-900" numberOfLines={1}>{result.raceId?.name || result.raceName || 'Cuộc đua'}</Text>
                  <Text className="text-xs text-slate-500 mt-1" numberOfLines={1}>Ngựa: {result.horseId?.name || result.horseName || 'N/A'}</Text>
                  {result.prizeAmount ? (
                    <Text className="text-xs font-extrabold text-emerald-700 mt-1">Giải: {formatPoints(result.prizeAmount)} điểm</Text>
                  ) : null}
                </View>
              </View>
            </Surface>
          ))
        )}
      </View>
    );
  };

  const renderRaceResults = () => (
    <View>
      <Text className="text-base font-extrabold text-slate-900 mb-4">Chọn cuộc đua để xem kết quả</Text>
      {races.length === 0 ? (
        <EmptyState icon={List} title="Không có cuộc đua nào" />
      ) : (
        races.map((race) => {
          const tone = statusTone(race.status);
          return (
            <TouchableOpacity
              key={race.id}
              activeOpacity={0.84}
              onPress={() => router.push(`/${race.id}`)}
            >
              <Surface className="p-4 mb-3">
                <View className="flex-row items-center">
                  <View className="w-12 h-12 rounded-2xl bg-blue-50 items-center justify-center mr-3">
                    <BarChart2 size={22} color="#2563eb" />
                  </View>
                  <View className="flex-1 pr-3">
                    <Text className="text-base font-extrabold text-slate-900" numberOfLines={1}>{race.name}</Text>
                    <Text className="text-xs text-slate-500 mt-1">{formatDateTime(race.scheduledAt)}</Text>
                  </View>
                  <View className="flex-row items-center">
                    <View className={`px-2.5 py-1 rounded-full border mr-2 ${tone}`}>
                      <Text className={`text-[10px] font-extrabold ${tone.split(' ')[1]}`}>{statusLabel(race.status)}</Text>
                    </View>
                    <ChevronRight size={18} color="#cbd5e1" />
                  </View>
                </View>
              </Surface>
            </TouchableOpacity>
          );
        })
      )}
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <ScreenHeader
        title={isJockey ? 'Kết quả của tôi' : 'Kết quả'}
        subtitle={isJockey ? 'Thống kê và kết quả thi đấu cá nhân.' : 'Chọn cuộc đua để xem thứ tự về đích.'}
      />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 36 }}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchData} />}
      >
        {loading && !jockeyData && races.length === 0 ? (
          <View className="py-20 items-center justify-center">
            <ActivityIndicator size="large" color="#2563eb" />
          </View>
        ) : isJockey ? (
          renderJockeyResults()
        ) : (
          renderRaceResults()
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
