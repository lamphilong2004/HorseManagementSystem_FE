import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Calendar as CalendarIcon, Clock, Flag, MapPin, ShieldAlert } from 'lucide-react-native';
import * as api from '../../api';
import { EmptyState, ScreenHeader, Surface } from '../../components/MobileUI';
import { formatDateTime } from '../../utils/spectator';

type ScheduleItem = {
  _id?: string;
  id?: string;
  registrationId?: string;
  raceId?: string;
  raceName?: string;
  scheduledTime?: string;
  scheduledAt?: string;
  distance?: number;
  location?: string;
  status?: string;
  horse?: {
    id?: string;
    name?: string;
    breed?: string;
    weight?: number;
  };
};

function idOf(value: any) {
  if (!value) return '';
  if (typeof value === 'string') return value.trim();
  return String(value._id || value.id || value.raceId || value.horseId || '').trim();
}

function statusDisplay(status?: string) {
  if (status === 'ACCEPTED_PENDING_CONFIRMATION') {
    return { label: 'Chờ chủ ngựa chốt', cls: 'bg-amber-100 text-amber-700 border-amber-200' };
  }
  if (status === 'OTHER_JOCKEY_CONFIRMED') {
    return { label: 'Chủ ngựa chọn Jockey khác', cls: 'bg-slate-100 text-slate-600 border-slate-200' };
  }
  if (status === 'CONFIRMED') {
    return { label: 'Đã chốt Jockey', cls: 'bg-emerald-100 text-emerald-700 border-emerald-200' };
  }
  const s = String(status || '').toUpperCase();
  const map: Record<string, string> = {
    PENDING: 'Chờ duyệt',
    SCHEDULED: 'Lên lịch',
    ONGOING: 'Đang diễn ra',
    COMPLETED: 'Hoàn thành',
    RESULT_CONFIRMED: 'Đã có kết quả',
  };
  return { label: map[s] || s || 'Chưa rõ', cls: 'bg-blue-100 text-blue-700 border-blue-200' };
}

export default function JockeyScheduleScreen() {
  const router = useRouter();
  const [items, setItems] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSchedule = async () => {
    setLoading(true);
    try {
      const [scheduleRes, invites, allRaces] = await Promise.all([
        api.getJockeySchedule().catch(() => ({ data: [] })),
        api.getInvites().catch(() => []),
        api.getRaces().catch(() => []),
      ]);
      const officialItems = Array.isArray(scheduleRes?.data) ? scheduleRes.data : (Array.isArray(scheduleRes) ? scheduleRes : []);
      const acceptedInvites = invites.filter((inv: any) => ['ACCEPTED', 'CONFIRMED'].includes(String(inv.status || '').toUpperCase()));

      const registrations = await Promise.all(
        allRaces.map(async (race) => {
          try {
            const horses = await api.getRaceHorses(race.id);
            return { race, horses };
          } catch {
            return { race, horses: [] };
          }
        })
      );

      const enrichedInvites = acceptedInvites.map((inv: any) => {
        const targetHorseId = idOf(inv.horseId || inv.horse);
        if (!targetHorseId) return null;

        let matchedReg: any = null;
        let matchedRace: any = null;
        const inviteRaceId = idOf(inv.raceId || inv.race);

        for (const row of registrations) {
          const raceIdMatch = !inviteRaceId || idOf(row.race) === inviteRaceId;
          const found = row.horses.find((horse: any) => String(horse.horseId || horse.horse?._id || horse.horse?.id || '').trim() === targetHorseId);
          if (found && raceIdMatch) {
            matchedReg = found;
            matchedRace = row.race;
            break;
          }
        }

        if (!matchedReg || !matchedRace) {
          for (const row of registrations) {
            const found = row.horses.find((horse: any) => {
              const horseId = String(horse.horseId || horse.horse?._id || horse.horse?.id || '').trim();
              const registrationId = String(horse.registrationId || horse.id || horse._id || '').trim();
              return horseId === targetHorseId && registrationId === inviteRaceId;
            });
            if (found) {
              matchedReg = found;
              matchedRace = row.race;
              break;
            }
          }
        }

        if (!matchedReg || !matchedRace) {
          for (const row of registrations) {
            const found = row.horses.find((horse: any) => String(horse.horseId || horse.horse?._id || horse.horse?.id || '').trim() === targetHorseId);
            if (found) {
              matchedReg = found;
              matchedRace = row.race;
              break;
            }
          }
        }

        if (!matchedReg || !matchedRace) return null;

        const horseObj = matchedReg.horse || {};
        const regJockeyId = idOf(matchedReg.jockeyId || matchedReg.jockey);
        const invJockeyId = idOf(inv.jockeyId || inv.jockey);
        const hasAnyJockey = !!regJockeyId || inv.status === 'CONFIRMED';
        let finalStatus = 'ACCEPTED_PENDING_CONFIRMATION';

        if (inv.status === 'CONFIRMED') {
          finalStatus = 'CONFIRMED';
        } else if (hasAnyJockey) {
          finalStatus = regJockeyId && invJockeyId && regJockeyId !== invJockeyId ? 'OTHER_JOCKEY_CONFIRMED' : 'CONFIRMED';
        }

        return {
          _id: `accepted-${inv.id}`,
          registrationId: matchedReg.registrationId || matchedReg.id,
          raceId: matchedRace.id || matchedRace._id,
          raceName: matchedRace.name,
          scheduledTime: matchedRace.scheduledAt,
          distance: matchedRace.distance,
          location: matchedRace.location || matchedRace.venue || 'Trường đua',
          status: finalStatus,
          horse: {
            id: horseObj._id || horseObj.id,
            name: horseObj.name || inv.horseName,
            breed: horseObj.breed || inv.horseBreed,
            weight: horseObj.weight || inv.horseWeight,
          },
        };
      }).filter(Boolean) as ScheduleItem[];

      const merged = [...officialItems];
      enrichedInvites.forEach((item) => {
        const exists = merged.some((official: any) => idOf(official.raceId || official.race) === idOf(item.raceId));
        if (!exists) merged.push(item);
      });

      setItems(merged);
    } catch (error) {
      console.error('Failed to load schedule data', error);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedule();
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <ScreenHeader title="Lịch thi đấu" subtitle="Các cuộc đua bạn đã đồng ý hoặc đã được chủ ngựa chốt." />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 36 }}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchSchedule} />}
      >
        {loading && items.length === 0 ? (
          <View className="py-20 items-center justify-center">
            <ActivityIndicator size="large" color="#2563eb" />
          </View>
        ) : items.length === 0 ? (
          <EmptyState icon={CalendarIcon} title="Chưa có lịch thi đấu" message="Chấp nhận lời mời từ chủ ngựa để cập nhật lịch." />
        ) : (
          items.map((item, index) => {
            const status = statusDisplay(item.status);
            const raceId = idOf(item.raceId || item);
            return (
              <TouchableOpacity
                key={String(item._id || item.id || raceId || index)}
                activeOpacity={0.84}
                onPress={() => raceId && router.push(`/${raceId}`)}
              >
                <Surface className="p-4 mb-3">
                  <View className="flex-row justify-between items-start">
                    <View className="flex-1 pr-3">
                      <Text className="text-[11px] font-extrabold text-blue-600 uppercase mb-1">Trận đấu</Text>
                      <Text className="text-lg font-extrabold text-slate-900" numberOfLines={2}>{item.raceName || 'Cuộc đua'}</Text>
                    </View>
                    <View className={`px-2.5 py-1 rounded-full border ${status.cls}`}>
                      <Text className={`text-[10px] font-extrabold ${status.cls.split(' ')[1]}`}>{status.label}</Text>
                    </View>
                  </View>

                  <View className="h-px bg-slate-100 my-4" />

                  <View className="flex-row flex-wrap gap-y-3">
                    <View className="w-1/2 flex-row items-center pr-2">
                      <Clock size={15} color="#64748b" />
                      <Text className="text-xs font-bold text-slate-600 ml-2 flex-1">{formatDateTime(item.scheduledTime || item.scheduledAt)}</Text>
                    </View>
                    <View className="w-1/2 flex-row items-center pr-2">
                      <MapPin size={15} color="#64748b" />
                      <Text className="text-xs font-bold text-slate-600 ml-2 flex-1" numberOfLines={1}>{item.location || 'Chưa xác định'}</Text>
                    </View>
                    <View className="w-1/2 flex-row items-center pr-2">
                      <Flag size={15} color="#64748b" />
                      <Text className="text-xs font-bold text-slate-600 ml-2">{item.distance ? `${item.distance}m` : 'Chưa rõ'}</Text>
                    </View>
                    <View className="w-1/2 flex-row items-center pr-2">
                      <CalendarIcon size={15} color="#64748b" />
                      <Text className="text-xs font-bold text-slate-600 ml-2 flex-1" numberOfLines={1}>{item.horse?.name || 'Chưa có ngựa'}</Text>
                    </View>
                  </View>

                  {item.status === 'ACCEPTED_PENDING_CONFIRMATION' || item.status === 'OTHER_JOCKEY_CONFIRMED' ? (
                    <View className="mt-4 rounded-2xl bg-amber-50 border border-amber-100 p-3 flex-row items-start">
                      <ShieldAlert size={17} color="#d97706" />
                      <Text className="text-xs font-semibold text-amber-800 ml-2 flex-1">
                        {item.status === 'OTHER_JOCKEY_CONFIRMED'
                          ? 'Chủ ngựa đã chốt Jockey khác cho cuộc đua này.'
                          : 'Bạn đã đồng ý lời mời. Lịch sẽ chính thức khi chủ ngựa chốt Jockey.'}
                      </Text>
                    </View>
                  ) : null}
                </Surface>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
