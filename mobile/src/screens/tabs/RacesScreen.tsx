import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { ChevronRight, Clock, Flag } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import * as api from '../../api';
import { Race } from '../../types';
import { EmptyState, ScreenHeader, Surface } from '../../components/MobileUI';
import { formatDateTime, getRaceId } from '../../utils/spectator';

export default function RacesScreen() {
  const router = useRouter();
  const [races, setRaces] = useState<Race[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRaces = async () => {
    setLoading(true);
    try {
      const data = await api.getRaces();
      setRaces(data);
    } catch (error) {
      console.error('Failed to fetch races', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRaces();
  }, []);

  const getStatusLabel = (status: string) => {
    const s = (status || '').toLowerCase();
    switch (s) {
      case 'pending': return 'Đang chờ';
      case 'open': return 'Đang mở';
      case 'active': return 'Hoạt động';
      case 'ongoing': return 'Đang diễn ra';
      case 'running': return 'Đang chạy';
      case 'completed': return 'Hoàn thành';
      case 'approved': return 'Đã duyệt';
      case 'confirmed': return 'Xác nhận';
      case 'scheduled': return 'Lên lịch';
      default: return status.toUpperCase();
    }
  };

  const getStatusColor = (status: string) => {
    const s = (status || '').toLowerCase();
    if (['completed', 'confirmed', 'finished', 'result_confirmed'].includes(s)) return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    if (['open', 'active', 'scheduled', 'ongoing', 'running'].includes(s)) return 'bg-blue-100 text-blue-700 border-blue-200';
    return 'bg-slate-100 text-slate-700 border-slate-200';
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <ScreenHeader title="Cuộc đua" subtitle="Theo dõi lịch, trạng thái và kết quả từng cuộc đua." />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 36 }}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchRaces} />}
      >
        {loading && races.length === 0 ? (
          <View className="py-20 items-center justify-center">
            <ActivityIndicator size="large" color="#2563eb" />
          </View>
        ) : races.length === 0 ? (
          <EmptyState icon={Flag} title="Không có cuộc đua" message="Hiện chưa có cuộc đua nào được lên lịch." />
        ) : (
          <View>
            <Text className="text-xs font-extrabold text-slate-400 mb-4 uppercase tracking-wider">
              Tìm thấy {races.length} cuộc đua
            </Text>

            {races.map((race) => {
              const statusColor = getStatusColor(race.status || '');
              return (
                <TouchableOpacity
                  activeOpacity={0.84}
                  key={getRaceId(race)}
                  onPress={() => router.push(`/${getRaceId(race)}`)}
                >
                  <Surface className="p-4 mb-3">
                    <View className="flex-row items-center">
                      <View className="w-12 h-12 rounded-2xl bg-amber-50 items-center justify-center mr-3 border border-amber-100">
                        <Flag size={22} color="#d97706" />
                      </View>
                      <View className="flex-1">
                        <Text className="text-base font-extrabold text-slate-900 mb-1" numberOfLines={1}>{race.name}</Text>
                        <View className={`self-start px-3 py-1 rounded-full border ${statusColor}`}>
                          <Text className={`text-[10px] font-extrabold uppercase ${statusColor.split(' ')[1]}`}>
                            {getStatusLabel(race.status || '')}
                          </Text>
                        </View>
                      </View>
                      <ChevronRight size={19} color="#cbd5e1" />
                    </View>

                    <View className="h-px w-full bg-slate-100 my-3" />

                    <View className="flex-row items-center">
                      <Clock size={15} color="#64748b" />
                      <Text className="text-sm text-slate-500 font-medium ml-2">{formatDateTime(race.scheduledAt || '')}</Text>
                    </View>
                  </Surface>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
