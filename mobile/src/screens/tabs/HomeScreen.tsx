import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { BarChart2, Bell, Calendar, Flag, Mail, Medal, Radio, Trophy, UserCircle, Wallet } from 'lucide-react-native';
import * as api from '../../api';
import { useAuth } from '../../context/AuthContext';
import { Race, Tournament } from '../../types';
import { EmptyState, ScreenHeader, StatTile, Surface } from '../../components/MobileUI';
import {
  formatDateTime,
  formatPoints,
  getRaceId,
  getTournamentId,
  isActiveTournament,
  isLiveRace,
  isPredictionRaceStatus,
  sortRacesByScheduledAt,
  sortTournamentsByStartDate,
} from '../../utils/spectator';

function roleLabel(role?: string) {
  const map: Record<string, string> = {
    OWNER: 'Chủ ngựa',
    JOCKEY: 'Jockey',
    SPECTATOR: 'Khán giả',
    REFEREE: 'Trọng tài',
    ADMIN: 'Quản trị',
  };
  return map[String(role || '').toUpperCase()] || role || 'Người dùng';
}

export default function HomeScreen() {
  const router = useRouter();
  const { user, balance, refreshBalance } = useAuth();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [races, setRaces] = useState<Race[]>([]);
  const [loading, setLoading] = useState(true);
  const role = user?.role || 'SPECTATOR';
  const isSpectator = role === 'SPECTATOR';
  const isOwner = role === 'OWNER';
  const isJockey = role === 'JOCKEY';

  const fetchData = async () => {
    setLoading(true);
    try {
      const [tourList, raceList] = await Promise.all([
        api.getPublicTournaments().catch(() => []),
        api.getPublicRaces({ limit: 1000 }).catch(() => []),
        isSpectator ? refreshBalance().catch(() => balance) : Promise.resolve(balance),
      ]);
      setTournaments(tourList);
      setRaces(raceList);
    } catch (error) {
      console.error('Failed to fetch dashboard data', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [isSpectator]);

  const activeTournaments = useMemo(() => sortTournamentsByStartDate(tournaments.filter(isActiveTournament)).slice(0, 3), [tournaments]);
  const openRaces = useMemo(() => sortRacesByScheduledAt(races.filter((race) => isPredictionRaceStatus(race.status))).slice(0, 5), [races]);
  const liveCount = races.filter(isLiveRace).length;

  const dashboardCards = [
    {
      label: 'Xem Giải Đấu',
      desc: 'Khám phá các giải đấu đua ngựa đang diễn ra, xem chi tiết lịch thi đấu và bảng xếp hạng thành tích.',
      route: '/(tabs)/tournaments',
      Icon: Trophy,
      color: '#2563eb',
    },
    {
      label: 'Xem Cuộc Đua',
      desc: 'Cập nhật danh sách cuộc đua, cự ly, thời gian xuất phát và diễn biến kết quả thi đấu.',
      route: '/(tabs)/races',
      Icon: Flag,
      color: '#f59e0b',
    },
    ...(isOwner ? [{
      label: 'Ngựa Của Tôi',
      desc: 'Quản lý đội ngựa thi đấu cá nhân, đăng ký tham gia vòng đua mới và gửi lời mời thuê Jockey.',
      route: '/(tabs)/horses',
      Icon: Trophy,
      color: '#10b981',
    }] : []),
    ...(isJockey ? [{
      label: 'Lời Mời Của Tôi',
      desc: 'Xem và phản hồi yêu cầu điều khiển ngựa từ chủ ngựa, sau đó theo dõi lịch trình nhận việc.',
      route: '/(tabs)/invites',
      Icon: Mail,
      color: '#10b981',
    }] : []),
  ];

  const spectatorShortcuts = [
    { label: 'Giải đấu', route: '/(tabs)/tournaments', Icon: Trophy, color: '#2563eb' },
    { label: 'Cuộc đua', route: '/(tabs)/races', Icon: Flag, color: '#f59e0b' },
    { label: 'Dự đoán', route: '/(tabs)/predictions', Icon: BarChart2, color: '#10b981' },
    { label: 'Bảng hạng', route: '/(tabs)/leaderboard', Icon: Medal, color: '#7c3aed' },
    { label: 'Livestream', route: '/(tabs)/livestream', Icon: Radio, color: '#e11d48' },
    { label: 'Thông báo', route: '/(tabs)/notifications', Icon: Bell, color: '#64748b' },
    { label: 'Hồ sơ', route: '/(tabs)/profile', Icon: UserCircle, color: '#64748b' },
  ];

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <ScreenHeader
        title="Dashboard"
        subtitle={`Xin chào, ${user?.name || 'người dùng'} · Vai trò: ${roleLabel(role)}`}
      />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 36 }}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchData} />}
      >
        {isSpectator ? (
          <>
            <View className="rounded-[28px] bg-blue-600 p-5 mb-4 overflow-hidden">
              <View className="flex-row justify-between items-center">
                <View className="flex-1">
                  <Text className="text-blue-100 text-xs font-bold uppercase tracking-wider">Số dư điểm ảo</Text>
                  <Text className="text-white text-4xl font-extrabold mt-1">{formatPoints(balance)}</Text>
                  <Text className="text-blue-100 text-sm mt-2">Dùng để đặt dự đoán trong các cuộc đua đang mở.</Text>
                </View>
                <View className="w-16 h-16 rounded-[24px] bg-white/20 items-center justify-center">
                  <Wallet color="white" size={32} />
                </View>
              </View>
            </View>

            <View className="flex-row gap-3 mb-5">
              <StatTile icon={Trophy} label="Giải mở" value={activeTournaments.length} tone="blue" />
              <StatTile icon={Flag} label="Đua mở" value={openRaces.length} tone="emerald" />
              <StatTile icon={Radio} label="Live" value={liveCount} tone="rose" />
            </View>

            <Text className="text-base font-extrabold text-slate-900 mb-3">Truy cập nhanh</Text>
            <View className="flex-row flex-wrap justify-between mb-6">
              {spectatorShortcuts.map(({ label, route, Icon, color }) => (
                <TouchableOpacity
                  activeOpacity={0.82}
                  key={route}
                  onPress={() => router.push(route as any)}
                  className="bg-white rounded-[22px] p-4 border border-slate-100 w-[48%] min-h-[94px] mb-3"
                >
                  <View className="w-11 h-11 rounded-2xl bg-slate-50 items-center justify-center">
                    <Icon size={24} color={color} />
                  </View>
                  <Text className="text-sm font-extrabold text-slate-800 mt-3">{label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        ) : (
          <View className="mb-6">
            <Text className="text-base font-extrabold text-slate-900 mb-3">Tác vụ chính</Text>
            {dashboardCards.map(({ label, desc, route, Icon, color }) => (
              <TouchableOpacity
                activeOpacity={0.84}
                key={route}
                onPress={() => router.push(route as any)}
                className="bg-white rounded-[24px] p-5 border border-slate-100 mb-3"
              >
                <View className="flex-row items-start">
                  <View className="w-12 h-12 rounded-2xl bg-slate-50 items-center justify-center mr-4">
                    <Icon size={25} color={color} />
                  </View>
                  <View className="flex-1">
                    <Text className="text-lg font-extrabold text-slate-900">{label}</Text>
                    <Text className="text-sm text-slate-500 mt-1 leading-5">{desc}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {loading && tournaments.length === 0 && races.length === 0 ? (
          <View className="py-12 items-center">
            <ActivityIndicator size="large" color="#2563eb" />
          </View>
        ) : isSpectator ? (
          <View>
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-base font-extrabold text-slate-900">Giải đấu nổi bật</Text>
              <TouchableOpacity className="px-3 py-2 rounded-full bg-blue-50" onPress={() => router.push('/(tabs)/tournaments' as any)}>
                <Text className="text-xs text-blue-700 font-extrabold">Xem tất cả</Text>
              </TouchableOpacity>
            </View>

            {activeTournaments.length === 0 ? (
              <View className="mb-6">
                <EmptyState icon={Trophy} title="Chưa có giải đang hoạt động" />
              </View>
            ) : (
              activeTournaments.map((tournament) => (
                <Surface key={getTournamentId(tournament)} className="p-4 mb-3">
                  <View className="flex-row justify-between items-start">
                    <View className="flex-1 pr-3">
                      <Text className="text-base font-extrabold text-slate-900" numberOfLines={1}>{tournament.name}</Text>
                      <Text className="text-sm text-slate-500 mt-1" numberOfLines={1}>{tournament.venue || 'Chưa rõ địa điểm'}</Text>
                    </View>
                    <Text className="text-xs font-extrabold text-amber-700">{formatPoints(tournament.prizePool)} điểm</Text>
                  </View>
                  <Text className="text-xs text-slate-400 mt-3">{formatDateTime(tournament.startDate)}</Text>
                </Surface>
              ))
            )}

            <View className="flex-row items-center justify-between mb-3 mt-3">
              <Text className="text-base font-extrabold text-slate-900">Cuộc đua có thể dự đoán</Text>
              <TouchableOpacity className="px-3 py-2 rounded-full bg-emerald-50" onPress={() => router.push('/(tabs)/predictions' as any)}>
                <Text className="text-xs text-emerald-700 font-extrabold">Đặt cược</Text>
              </TouchableOpacity>
            </View>

            {openRaces.length === 0 ? (
              <EmptyState icon={Flag} title="Chưa có cuộc đua mở dự đoán" />
            ) : (
              openRaces.map((race) => (
                <TouchableOpacity activeOpacity={0.84} key={getRaceId(race)} onPress={() => router.push(`/${getRaceId(race)}`)}>
                  <Surface className="p-4 mb-3">
                    <View className="flex-row justify-between items-start">
                      <View className="flex-1 pr-3">
                        <Text className="text-base font-extrabold text-slate-900" numberOfLines={1}>{race.name}</Text>
                        <Text className="text-sm text-slate-500 mt-1">{formatDateTime(race.scheduledAt)}</Text>
                      </View>
                      <View className="px-3 py-1.5 rounded-full bg-blue-50">
                        <Text className="text-[10px] font-extrabold text-blue-700">{race.status || 'SCHEDULED'}</Text>
                      </View>
                    </View>
                  </Surface>
                </TouchableOpacity>
              ))
            )}
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
