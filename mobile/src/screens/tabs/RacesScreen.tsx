import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, RefreshControl, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { ChevronDown, ChevronRight, Clock, Flag, Radio, RefreshCw, Search, Trophy } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import * as api from '../../api';
import { useAuth } from '../../context/AuthContext';
import { Race } from '../../types';
import { EmptyState, ScreenHeader, Surface } from '../../components/MobileUI';
import { dateTimeValue, formatDateTime, getRaceId } from '../../utils/spectator';

const TIME_FILTERS = [
  { value: 'all', label: 'Tất cả thời gian' },
  { value: 'upcoming', label: 'Sắp diễn ra' },
  { value: 'live', label: 'Đang diễn ra' },
  { value: 'completed', label: 'Đã hoàn tất' },
];

const STATUS_FILTERS = [
  { value: 'all', label: 'Tất cả trạng thái' },
  { value: 'PENDING', label: 'Chưa có lịch' },
  { value: 'SCHEDULED', label: 'Đã lên lịch' },
  { value: 'ONGOING', label: 'Đang diễn ra' },
  { value: 'RUNNING', label: 'Đang chạy' },
  { value: 'FINISHED', label: 'Đã hoàn thành' },
  { value: 'COMPLETED', label: 'Đã kết thúc' },
  { value: 'CANCELLED', label: 'Đã hủy' },
];

const SORT_OPTIONS = [
  { value: 'nearest', label: 'Gần nhất trước' },
  { value: 'newest', label: 'Mới nhất' },
  { value: 'oldest', label: 'Cũ nhất' },
];

type FilterOption = {
  value: string;
  label: string;
};

type PickerType = 'status' | 'sort' | null;

function raceTournamentName(race: Race | any) {
  const tournament = race?.tournamentId || race?.tournament;
  return typeof tournament === 'object' ? (tournament.name || '') : '';
}

function TimeChip({
  label,
  active,
  count,
  onPress,
}: {
  label: string;
  active?: boolean;
  count: number;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.82}
      onPress={onPress}
      className={`min-h-[42px] px-4 rounded-full border mr-2 flex-row items-center justify-center ${active ? 'bg-blue-600 border-blue-600' : 'bg-white border-slate-200'}`}
    >
      <Text className={`text-xs font-extrabold ${active ? 'text-white' : 'text-slate-600'}`} numberOfLines={1}>{label}</Text>
      <View className={`ml-2 px-2 py-0.5 rounded-full ${active ? 'bg-white/20' : 'bg-slate-100'}`}>
        <Text className={`text-[10px] font-extrabold ${active ? 'text-white' : 'text-slate-500'}`}>{count}</Text>
      </View>
    </TouchableOpacity>
  );
}

function SelectButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <TouchableOpacity
      activeOpacity={0.84}
      onPress={onPress}
      className="h-[42px] min-w-[142px] rounded-full border border-slate-200 bg-white px-4 flex-row items-center justify-center"
    >
      <Text className="text-slate-900 text-xs font-extrabold mr-2" numberOfLines={1}>{label}</Text>
      <ChevronDown size={15} color="#64748b" />
    </TouchableOpacity>
  );
}

function OptionSheet({
  visible,
  title,
  options,
  value,
  onSelect,
  onClose,
}: {
  visible: boolean;
  title: string;
  options: FilterOption[];
  value: string;
  onSelect: (value: string) => void;
  onClose: () => void;
}) {
  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-black/45">
        <Pressable className="absolute inset-0" onPress={onClose} />
        <View className="rounded-t-[28px] bg-white px-5 pt-5 pb-8">
          <View className="w-12 h-1.5 rounded-full bg-slate-200 self-center mb-5" />
          <Text className="text-lg font-extrabold text-slate-950 mb-4">{title}</Text>
          {options.map((option) => {
            const active = option.value === value;
            return (
              <TouchableOpacity
                key={option.value}
                activeOpacity={0.82}
                onPress={() => onSelect(option.value)}
                className={`min-h-[48px] rounded-2xl px-4 mb-2 flex-row items-center justify-between border ${active ? 'bg-amber-50 border-amber-200' : 'bg-white border-slate-100'}`}
              >
                <Text className={`text-sm font-extrabold ${active ? 'text-amber-700' : 'text-slate-700'}`}>{option.label}</Text>
                {active ? <View className="w-2.5 h-2.5 rounded-full bg-amber-500" /> : null}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </Modal>
  );
}

export default function RacesScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [races, setRaces] = useState<Race[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [timeFilter, setTimeFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState('nearest');
  const [picker, setPicker] = useState<PickerType>(null);

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
      case 'finished': return 'Đã hoàn thành';
      case 'result_confirmed': return 'Xác nhận kết quả';
      case 'live': return 'Đang diễn ra';
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

  const counts = useMemo(() => {
    const now = Date.now();
    return {
      all: races.filter((race) => dateTimeValue(race.scheduledAt, 0) >= now).length,
      upcoming: races.filter((race) => ['SCHEDULED', 'PENDING'].includes(String(race.status || '').toUpperCase())).length,
      live: races.filter((race) => ['ONGOING', 'LIVE'].includes(String(race.status || '').toUpperCase())).length,
      completed: races.filter((race) => ['COMPLETED', 'CANCELLED', 'RESULT_CONFIRMED'].includes(String(race.status || '').toUpperCase())).length,
    };
  }, [races]);

  const filteredRaces = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const now = Date.now();

    return races
      .filter((race) => {
        const status = String(race.status || '').toUpperCase();
        if (statusFilter !== 'all' && status !== statusFilter) return false;

        if (query) {
          const matchesRace = String(race.name || '').toLowerCase().includes(query);
          const matchesTournament = raceTournamentName(race).toLowerCase().includes(query);
          if (!matchesRace && !matchesTournament) return false;
        }

        const scheduledAt = dateTimeValue(race.scheduledAt, 0);
        if (timeFilter === 'all' && scheduledAt < now) return false;
        if (timeFilter === 'upcoming' && !['SCHEDULED', 'PENDING'].includes(status)) return false;
        if (timeFilter === 'live' && !['ONGOING', 'LIVE'].includes(status)) return false;
        if (timeFilter === 'completed' && !(['COMPLETED', 'CANCELLED', 'RESULT_CONFIRMED'].includes(status) || scheduledAt < now)) return false;
        return true;
      })
      .sort((a, b) => {
        if (sortOrder === 'nearest') {
          const statusOrder = (race: Race) => {
            const status = String(race.status || '').toUpperCase();
            if (['ONGOING', 'LIVE'].includes(status)) return 0;
            if (['SCHEDULED', 'PENDING'].includes(status)) return 1;
            return 2;
          };
          const statusDiff = statusOrder(a) - statusOrder(b);
          if (statusDiff !== 0) return statusDiff;
          return dateTimeValue(a.scheduledAt) - dateTimeValue(b.scheduledAt);
        }

        const diff = dateTimeValue(a.scheduledAt) - dateTimeValue(b.scheduledAt);
        return sortOrder === 'oldest' ? diff : -diff;
      });
  }, [races, searchQuery, sortOrder, statusFilter, timeFilter]);

  const selectedStatusLabel = STATUS_FILTERS.find((item) => item.value === statusFilter)?.label || STATUS_FILTERS[0].label;
  const selectedSortLabel = SORT_OPTIONS.find((item) => item.value === sortOrder)?.label || SORT_OPTIONS[0].label;
  const role = String(user?.role || '').toUpperCase();
  const hideHeaderRefresh = ['JOCKEY', 'OWNER'].includes(role);

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <ScreenHeader
        title="Cuộc đua"
        subtitle="Theo dõi lịch, trạng thái và kết quả từng cuộc đua."
        right={!hideHeaderRefresh ? (
          <TouchableOpacity onPress={fetchRaces} className="w-11 h-11 rounded-full bg-white border border-slate-100 items-center justify-center">
            <RefreshCw color="#64748b" size={20} />
          </TouchableOpacity>
        ) : undefined}
      />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 36 }}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchRaces} />}
      >
        <View className="h-12 rounded-2xl border border-slate-200 bg-white px-3 flex-row items-center mb-3">
          <Search size={18} color="#94a3b8" />
          <TextInput
            className="flex-1 ml-2 text-slate-700"
            placeholder="Tìm cuộc đua hoặc giải đấu"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-3">
          {TIME_FILTERS.map((item) => (
            <TimeChip
              key={item.value}
              label={item.label}
              active={timeFilter === item.value}
              count={counts[item.value as keyof typeof counts]}
              onPress={() => setTimeFilter(item.value)}
            />
          ))}
        </ScrollView>

        <View className="flex-row self-start mb-5">
          <SelectButton label={selectedStatusLabel} onPress={() => setPicker('status')} />
          <View className="w-3" />
          <SelectButton label={selectedSortLabel} onPress={() => setPicker('sort')} />
        </View>

        {loading && races.length === 0 ? (
          <View className="py-20 items-center justify-center">
            <ActivityIndicator size="large" color="#2563eb" />
          </View>
        ) : filteredRaces.length === 0 ? (
          <EmptyState icon={Flag} title="Không có cuộc đua phù hợp" message="Hãy thử thay đổi bộ lọc trạng thái hoặc thời gian." />
        ) : (
          <View>
            <Text className="text-xs font-extrabold text-slate-400 mb-4 uppercase tracking-wider">
              Tìm thấy {filteredRaces.length} cuộc đua
            </Text>

            {filteredRaces.map((race) => {
              const statusColor = getStatusColor(race.status || '');
              const isLive = ['ONGOING', 'LIVE'].includes(String(race.status || '').toUpperCase());
              const tournamentName = raceTournamentName(race);
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
                        <View className="flex-row items-center mb-1">
                          <Text className="flex-1 text-base font-extrabold text-slate-900 mr-2" numberOfLines={1}>{race.name}</Text>
                          {isLive ? (
                            <View className="px-2 py-1 rounded-full bg-red-50 border border-red-200 flex-row items-center">
                              <Radio size={11} color="#dc2626" />
                              <Text className="text-[10px] font-extrabold text-red-600 uppercase ml-1">Live</Text>
                            </View>
                          ) : null}
                        </View>
                        {tournamentName ? (
                          <View className="flex-row items-center mb-2">
                            <Trophy size={13} color="#d97706" />
                            <Text className="text-xs text-slate-500 font-bold ml-1 flex-1" numberOfLines={1}>{tournamentName}</Text>
                          </View>
                        ) : null}
                        <View className={`self-start px-3 py-1 rounded-full border ${statusColor}`}>
                          <Text className={`text-[10px] font-extrabold uppercase ${statusColor.split(' ')[1]}`}>{getStatusLabel(race.status || '')}</Text>
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

      <OptionSheet
        visible={picker === 'status'}
        title="Trạng thái"
        options={STATUS_FILTERS}
        value={statusFilter}
        onSelect={(value) => {
          setStatusFilter(value);
          setPicker(null);
        }}
        onClose={() => setPicker(null)}
      />
      <OptionSheet
        visible={picker === 'sort'}
        title="Sắp xếp"
        options={SORT_OPTIONS}
        value={sortOrder}
        onSelect={(value) => {
          setSortOrder(value);
          setPicker(null);
        }}
        onClose={() => setPicker(null)}
      />

    </SafeAreaView>
  );
}
