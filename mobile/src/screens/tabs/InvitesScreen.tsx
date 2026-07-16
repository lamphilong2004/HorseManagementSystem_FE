import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Calendar, Check, ChevronRight, Flag, Mail, User as UserIcon, Weight, X } from 'lucide-react-native';
import * as api from '../../api';
import { Invite } from '../../types';
import { ActionButton, EmptyState, ScreenHeader, Surface } from '../../components/MobileUI';
import { formatDateTime } from '../../utils/spectator';

type EnrichedInvite = Invite & {
  isOtherConfirmed?: boolean;
};

function idOf(value: any) {
  if (!value) return '';
  if (typeof value === 'string') return value.trim();
  return String(value._id || value.id || value.raceId || value.horseId || '').trim();
}

function statusMeta(invite: EnrichedInvite) {
  if (invite.isOtherConfirmed) {
    return { label: 'Đã chốt Jockey khác', cls: 'bg-slate-100 text-slate-600 border-slate-200' };
  }
  const s = String(invite.status || '').toUpperCase();
  if (s === 'PENDING') return { label: 'Chờ phản hồi', cls: 'bg-amber-100 text-amber-700 border-amber-200' };
  if (s === 'ACCEPTED') return { label: 'Đã đồng ý', cls: 'bg-emerald-100 text-emerald-700 border-emerald-200' };
  if (s === 'CONFIRMED') return { label: 'Đã chốt chính thức', cls: 'bg-blue-100 text-blue-700 border-blue-200' };
  if (s === 'DECLINED' || s === 'REJECTED') return { label: 'Đã từ chối', cls: 'bg-rose-100 text-rose-700 border-rose-200' };
  return { label: s || 'Chưa rõ', cls: 'bg-slate-100 text-slate-700 border-slate-200' };
}

export default function InvitesScreen() {
  const router = useRouter();
  const [invites, setInvites] = useState<EnrichedInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState('');

  const fetchInvites = async () => {
    setLoading(true);
    try {
      const rawInvites = await api.getInvites();
      const inviteList = Array.isArray(rawInvites) ? rawInvites : [];
      setInvites(inviteList as EnrichedInvite[]);

      let allRaces: any[] = [];
      try {
        allRaces = await api.getRaces();
      } catch (error) {
        console.warn('Failed to load races for invite enrichment', error);
        return;
      }

      const registrations = await Promise.all(
        allRaces.map(async (race) => {
          try {
            const horses = await api.getRaceHorses(race.id);
            return { race, horses: Array.isArray(horses) ? horses : [] };
          } catch {
            return { race, horses: [] };
          }
        })
      );

      const enriched = inviteList.map((invite: any) => {
        const targetHorseId = idOf(invite.horseId || invite.horse);
        if (!targetHorseId) return invite;

        let extractedRaceId = '';
        let displayMessage = invite.message || '';
        if (displayMessage.includes('|RACE_ID:')) {
          const parts = displayMessage.split('|RACE_ID:');
          displayMessage = parts[0];
          extractedRaceId = parts[1]?.trim();
        }

        let matchedReg: any = null;
        let matchedRace: any = null;
        const inviteRaceId = extractedRaceId || idOf(invite.raceId || invite.race);

        for (const row of registrations) {
          const horses = Array.isArray(row.horses) ? row.horses : [];
          const found = horses.find((horse: any) => String(horse.horseId || horse.horse?._id || horse.horse?.id || '').trim() === targetHorseId);
          const raceMatches = !inviteRaceId || idOf(row.race) === inviteRaceId;
          if (found && raceMatches) {
            matchedReg = found;
            matchedRace = row.race;
            break;
          }
        }

        if (!matchedReg || !matchedRace) {
          for (const row of registrations) {
            const horses = Array.isArray(row.horses) ? row.horses : [];
            const found = horses.find((horse: any) => {
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
            const horses = Array.isArray(row.horses) ? row.horses : [];
            const found = horses.find((horse: any) => String(horse.horseId || horse.horse?._id || horse.horse?.id || '').trim() === targetHorseId);
            if (found) {
              matchedReg = found;
              matchedRace = row.race;
              break;
            }
          }
        }

        if (!matchedReg || !matchedRace) {
          return { ...invite, message: displayMessage };
        }

        const horseObj = matchedReg.horse || {};
        const ownerObj = horseObj.ownerId || horseObj.owner || {};
        const assignedJockeyId = idOf(matchedReg.jockeyId || matchedReg.jockey);
        const myJockeyId = idOf(invite.jockeyId || invite.jockey);
        const isOtherConfirmed = !!assignedJockeyId && !!myJockeyId && assignedJockeyId !== myJockeyId;

        return {
          ...invite,
          message: displayMessage,
          raceId: matchedRace.id || matchedRace._id,
          raceName: matchedRace.name || invite.raceName,
          raceDistance: matchedRace.distance || invite.raceDistance,
          raceScheduledAt: matchedRace.scheduledAt || invite.raceScheduledAt,
          horseName: horseObj.name || invite.horseName,
          horseBreed: horseObj.breed || invite.horseBreed,
          horseWeight: horseObj.weight || invite.horseWeight,
          ownerName: ownerObj.fullName || ownerObj.name || ownerObj.email || invite.ownerName,
          isOtherConfirmed,
        };
      });

      setInvites(enriched);
    } catch (error) {
      console.error('Failed to fetch invites', error);
      setInvites([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvites();
  }, []);

  const handleResponse = (invite: EnrichedInvite, action: 'accept' | 'reject') => {
    Alert.alert(
      action === 'accept' ? 'Chấp nhận lời mời' : 'Từ chối lời mời',
      `Bạn có chắc chắn muốn ${action === 'accept' ? 'chấp nhận' : 'từ chối'} lời mời này?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xác nhận',
          onPress: async () => {
            const inviteId = String(invite.id || invite._id);
            setActionLoading(inviteId);
            try {
              if (action === 'accept') {
                await api.acceptInvitation(inviteId);
              } else {
                await api.rejectInvitation(inviteId);
              }
              await fetchInvites();
            } catch (error: any) {
              Alert.alert('Lỗi', error?.response?.data?.message || 'Không thể xử lý lời mời.');
            } finally {
              setActionLoading('');
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <ScreenHeader title="Lời mời" subtitle="Phản hồi yêu cầu cưỡi ngựa từ các chủ ngựa." />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 36 }}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchInvites} />}
      >
        {loading && invites.length === 0 ? (
          <View className="py-20 items-center justify-center">
            <ActivityIndicator size="large" color="#2563eb" />
          </View>
        ) : invites.length === 0 ? (
          <EmptyState icon={Mail} title="Chưa có lời mời" message="Hãy cập nhật hồ sơ Jockey để chủ ngựa dễ tìm thấy bạn hơn." />
        ) : (
          invites.map((invite) => {
            const meta = statusMeta(invite);
            const isPending = String(invite.status || '').toUpperCase() === 'PENDING' && !invite.isOtherConfirmed;
            const inviteId = String(invite.id || invite._id);
            return (
              <Surface key={inviteId} className="p-4 mb-3">
                <View className="flex-row justify-between items-start">
                  <View className="flex-row items-center flex-1 pr-3">
                    <View className="w-12 h-12 rounded-2xl bg-blue-50 items-center justify-center mr-3">
                      <UserIcon size={24} color="#2563eb" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-base font-extrabold text-slate-900" numberOfLines={1}>{invite.ownerName || 'Chủ ngựa'}</Text>
                      <Text className="text-xs text-slate-500 mt-1">{formatDateTime(invite.sentAt)}</Text>
                    </View>
                  </View>
                  <View className={`px-2.5 py-1 rounded-full border ${meta.cls}`}>
                    <Text className={`text-[10px] font-extrabold ${meta.cls.split(' ')[1]}`}>{meta.label}</Text>
                  </View>
                </View>

                <View className="bg-slate-50 border border-slate-100 rounded-2xl p-3 mt-4">
                  <View className="flex-row flex-wrap gap-y-3">
                    <View className="w-1/2 pr-2">
                      <Text className="text-[10px] font-extrabold text-slate-400 uppercase">Ngựa</Text>
                      <Text className="text-sm font-bold text-slate-800 mt-1" numberOfLines={1}>{invite.horseName || 'Ngựa thi đấu'}</Text>
                    </View>
                    <View className="w-1/2 pr-2">
                      <Text className="text-[10px] font-extrabold text-slate-400 uppercase">Cuộc đua</Text>
                      <Text className="text-sm font-bold text-slate-800 mt-1" numberOfLines={1}>{invite.raceName || 'Chưa xác định'}</Text>
                    </View>
                    <View className="w-1/2 flex-row items-center pr-2">
                      <Flag size={14} color="#64748b" />
                      <Text className="text-xs font-bold text-slate-600 ml-2">{invite.raceDistance ? `${invite.raceDistance}m` : 'Chưa rõ'}</Text>
                    </View>
                    <View className="w-1/2 flex-row items-center pr-2">
                      <Weight size={14} color="#64748b" />
                      <Text className="text-xs font-bold text-slate-600 ml-2">{invite.horseBreed || 'Chưa rõ'} · {invite.horseWeight ? `${invite.horseWeight}kg` : '?'}</Text>
                    </View>
                    <View className="w-full flex-row items-center pr-2">
                      <Calendar size={14} color="#64748b" />
                      <Text className="text-xs font-bold text-slate-600 ml-2">{formatDateTime(invite.raceScheduledAt)}</Text>
                    </View>
                  </View>
                  {invite.message ? (
                    <Text className="text-sm text-slate-500 italic mt-3">"{invite.message}"</Text>
                  ) : null}
                </View>

                <View className="mt-4">
                  {invite.isOtherConfirmed ? (
                    <ActionButton label="Cuộc đua đã có Jockey khác" disabled icon={X} variant="ghost" />
                  ) : isPending ? (
                    <View className="flex-row gap-3">
                      <View className="flex-1">
                        <ActionButton
                          label="Từ chối"
                          onPress={() => handleResponse(invite, 'reject')}
                          loading={actionLoading === inviteId}
                          icon={X}
                          variant="danger"
                        />
                      </View>
                      <View className="flex-1">
                        <ActionButton
                          label="Đồng ý"
                          onPress={() => handleResponse(invite, 'accept')}
                          loading={actionLoading === inviteId}
                          icon={Check}
                        />
                      </View>
                    </View>
                  ) : (
                    <TouchableOpacity
                      activeOpacity={0.84}
                      onPress={() => router.push('/(tabs)/schedule' as any)}
                      className="min-h-[48px] rounded-2xl bg-slate-100 flex-row items-center justify-center"
                    >
                      <Text className="text-slate-700 font-extrabold">Xem lịch thi đấu</Text>
                      <ChevronRight size={18} color="#334155" />
                    </TouchableOpacity>
                  )}
                </View>
              </Surface>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
