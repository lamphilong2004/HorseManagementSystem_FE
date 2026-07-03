import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { BarChart2, CheckCircle, Clock, DollarSign, Flag, Search, Target, Trophy, Wallet } from 'lucide-react-native';
import * as api from '../../api';
import { useAuth } from '../../context/AuthContext';
import { Prediction, Race, Tournament } from '../../types';
import { ActionButton, Chip, EmptyState, ScreenHeader, StatTile, Surface } from '../../components/MobileUI';
import {
  formatDateTime,
  formatPoints,
  getHorseId,
  getHorseName,
  getRaceId,
  getRaceName,
  getTournamentId,
  isPredictionRaceStatus,
} from '../../utils/spectator';

const QUICK_BETS = [100000, 200000, 500000];
const HISTORY_STATUS = ['ALL', 'PENDING', 'WON', 'LOST', 'OPEN', 'CLOSED'];

export default function PredictionsScreen() {
  const { balance, refreshBalance, updateBalance } = useAuth();
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [races, setRaces] = useState<Race[]>([]);
  const [horses, setHorses] = useState<any[]>([]);
  const [selectedTournamentId, setSelectedTournamentId] = useState('all');
  const [selectedRaceId, setSelectedRaceId] = useState('');
  const [selectedHorseId, setSelectedHorseId] = useState('');
  const [betAmount, setBetAmount] = useState('');
  const [predictedPosition, setPredictedPosition] = useState('1');
  const [predictionOpen, setPredictionOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingHorses, setLoadingHorses] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchText, setSearchText] = useState('');
  const [sortNewest, setSortNewest] = useState(true);

  const selectedRace = useMemo(
    () => races.find((race) => getRaceId(race) === selectedRaceId),
    [races, selectedRaceId],
  );

  const visibleRaces = useMemo(() => {
    const filtered = selectedTournamentId === 'all'
      ? races
      : races.filter((race) => getTournamentId(race) === selectedTournamentId);
    return filtered.filter((race) => isPredictionRaceStatus(race.status));
  }, [races, selectedTournamentId]);

  const filteredHistory = useMemo(() => {
    const query = searchText.trim().toLowerCase();
    return predictions
      .filter((prediction) => {
        const statusMatch = statusFilter === 'ALL' || prediction.status === statusFilter;
        const nameMatch = !query
          || getRaceName(prediction).toLowerCase().includes(query)
          || getHorseName(prediction).toLowerCase().includes(query);
        return statusMatch && nameMatch;
      })
      .sort((a, b) => {
        const aTime = new Date(a.createdAt || 0).getTime();
        const bTime = new Date(b.createdAt || 0).getTime();
        return sortNewest ? bTime - aTime : aTime - bTime;
      });
  }, [predictions, searchText, sortNewest, statusFilter]);

  const totalBet = useMemo(
    () => predictions.reduce((sum, prediction) => sum + Number(prediction.betAmount || 0), 0),
    [predictions],
  );

  const wonCount = predictions.filter((prediction) => prediction.status === 'WON').length;
  const totalPayout = predictions.reduce((sum, prediction) => sum + Number(prediction.prizeAmount || prediction.payout || 0), 0);
  const betValue = Number(betAmount || 0);
  const selectedHorse = horses.find((horse) => getHorseId(horse) === selectedHorseId);
  const canSubmit = !!selectedRaceId && !!selectedHorseId && betValue > 0 && predictionOpen && !submitting;

  const fetchData = async () => {
    setLoading(true);
    try {
      const [history, tournamentList, scheduledRaces, liveRaces] = await Promise.all([
        api.getMyPredictions().catch(() => []),
        api.getPublicTournaments().catch(() => []),
        api.getPublicRaces({ status: 'SCHEDULED' }).catch(() => []),
        api.getPublicRaces({ status: 'ONGOING' }).catch(() => []),
        refreshBalance().catch(() => balance),
      ]);

      const raceMap = new Map<string, Race>();
      [...scheduledRaces, ...liveRaces].forEach((race) => {
        const id = getRaceId(race);
        if (id) raceMap.set(id, race);
      });

      const nextRaces = Array.from(raceMap.values());
      setPredictions(history);
      setTournaments(tournamentList);
      setRaces(nextRaces);

      if (!selectedRaceId && nextRaces.length > 0) {
        setSelectedRaceId(getRaceId(nextRaces[0]));
      }
    } catch (error) {
      console.error('Failed to load prediction data', error);
      Alert.alert('Lỗi', 'Không thể tải dữ liệu dự đoán.');
    } finally {
      setLoading(false);
    }
  };

  const fetchRaceHorses = async (raceId: string) => {
    if (!raceId) {
      setHorses([]);
      setPredictionOpen(false);
      return;
    }

    setLoadingHorses(true);
    setSelectedHorseId('');
    try {
      const [horseList, openStatus] = await Promise.all([
        api.getRaceHorses(raceId).catch(() => []),
        api.checkPredictionOpen(raceId).catch(() => ({ isOpen: null as any })),
      ]);
      const race = races.find((item) => getRaceId(item) === raceId);
      const fallbackOpen = race ? isPredictionRaceStatus(race.status) : false;
      setHorses(Array.isArray(horseList) ? horseList : []);
      setPredictionOpen(typeof openStatus?.isOpen === 'boolean' ? openStatus.isOpen : fallbackOpen);
    } catch (error) {
      console.error('Failed to load race horses', error);
      setHorses([]);
      setPredictionOpen(false);
    } finally {
      setLoadingHorses(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedRaceId) {
      fetchRaceHorses(selectedRaceId);
    }
  }, [selectedRaceId]);

  useEffect(() => {
    if (visibleRaces.length > 0 && !visibleRaces.some((race) => getRaceId(race) === selectedRaceId)) {
      setSelectedRaceId(getRaceId(visibleRaces[0]));
    }
  }, [selectedTournamentId, visibleRaces, selectedRaceId]);

  const submitPrediction = async () => {
    if (!selectedRaceId || !selectedHorseId) {
      Alert.alert('Thiếu thông tin', 'Vui lòng chọn cuộc đua và chiến mã.');
      return;
    }
    if (!predictionOpen) {
      Alert.alert('Dự đoán đã đóng', 'Cuộc đua này hiện không nhận dự đoán.');
      return;
    }
    if (!betValue || betValue <= 0) {
      Alert.alert('Mức cược chưa hợp lệ', 'Vui lòng nhập số điểm cược lớn hơn 0.');
      return;
    }
    if (balance < betValue) {
      Alert.alert('Không đủ điểm', `Số dư hiện tại của bạn là ${formatPoints(balance)} điểm.`);
      return;
    }

    setSubmitting(true);
    try {
      await api.placePrediction(selectedRaceId, selectedHorseId, betValue, Number(predictedPosition) || 1);
      updateBalance((current) => current - betValue);
      Alert.alert(
        'Đặt dự đoán thành công',
        `${getRaceName(selectedRace)}\nChiến mã: ${getHorseName(selectedHorse)}\nMức cược: ${formatPoints(betValue)} điểm`,
      );
      setBetAmount('');
      setSelectedHorseId('');
      await fetchData();
    } catch (error: any) {
      Alert.alert('Thất bại', error?.response?.data?.message || 'Có lỗi xảy ra khi đặt dự đoán.');
    } finally {
      setSubmitting(false);
    }
  };

  const statusColor = (status?: string) => {
    const s = (status || '').toLowerCase();
    if (s === 'won') return 'bg-emerald-100 border-emerald-200 text-emerald-700';
    if (s === 'lost') return 'bg-rose-100 border-rose-200 text-rose-700';
    if (s === 'closed') return 'bg-slate-100 border-slate-200 text-slate-700';
    return 'bg-blue-100 border-blue-200 text-blue-700';
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <ScreenHeader title="Dự đoán" subtitle="Chọn cuộc đua, chiến mã và đặt điểm dự đoán." />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 36 }}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchData} />}
      >
        {loading && predictions.length === 0 && races.length === 0 ? (
          <View className="py-20 items-center justify-center">
            <ActivityIndicator size="large" color="#2563eb" />
          </View>
        ) : (
          <View>
            <View className="flex-row flex-wrap gap-3 mb-5">
              <StatTile icon={Wallet} label="Số dư" value={formatPoints(balance)} tone="blue" />
              <StatTile icon={BarChart2} label="Đã cược" value={formatPoints(totalBet)} tone="amber" />
              <StatTile icon={Trophy} label="Thắng" value={wonCount} tone="emerald" />
              <StatTile icon={DollarSign} label="Thưởng" value={formatPoints(totalPayout)} tone="purple" />
            </View>

            <Surface className="p-4 mb-6">
              <Text className="text-lg font-extrabold text-slate-900 mb-4">Đặt dự đoán mới</Text>

              <Text className="text-xs font-extrabold text-slate-500 uppercase mb-2">Giải đấu</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
                <Chip label="Tất cả" active={selectedTournamentId === 'all'} onPress={() => setSelectedTournamentId('all')} />
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

              <Text className="text-xs font-extrabold text-slate-500 uppercase mb-2">Cuộc đua đang nhận dự đoán</Text>
              {visibleRaces.length === 0 ? (
                <View className="bg-slate-50 rounded-2xl p-4 border border-slate-100 mb-4">
                  <Text className="text-sm text-slate-500">Hiện chưa có cuộc đua nào đang mở dự đoán.</Text>
                </View>
              ) : (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
                  {visibleRaces.map((race) => {
                    const id = getRaceId(race);
                    const active = selectedRaceId === id;
                    return (
                      <TouchableOpacity
                        activeOpacity={0.84}
                        key={id}
                        onPress={() => setSelectedRaceId(id)}
                        className={`w-72 mr-3 rounded-[24px] p-4 border min-h-[128px] ${active ? 'bg-blue-50 border-blue-300' : 'bg-slate-50 border-slate-100'}`}
                      >
                        <View className="flex-row items-center justify-between mb-3">
                          <View className="flex-row items-center">
                            <Flag size={16} color={active ? '#2563eb' : '#64748b'} />
                            <Text className={`text-xs font-extrabold ml-2 ${active ? 'text-blue-700' : 'text-slate-500'}`}>
                              {(race.status || 'SCHEDULED').toUpperCase()}
                            </Text>
                          </View>
                          {active ? <CheckCircle size={18} color="#2563eb" /> : null}
                        </View>
                        <Text className="text-base font-extrabold text-slate-900" numberOfLines={1}>{race.name}</Text>
                        <Text className="text-sm text-slate-500 mt-1">{formatDateTime(race.scheduledAt)}</Text>
                        <Text className="text-xs text-slate-500 mt-2">{race.distance}m - {race.maxHorses} chiến mã</Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              )}

              <View className="bg-slate-50 rounded-2xl p-4 border border-slate-100 mb-4">
                <View className="flex-row justify-between mb-2">
                  <Text className="text-sm text-slate-500 font-semibold">Trạng thái</Text>
                  <Text className={`text-sm font-extrabold ${predictionOpen ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {predictionOpen ? 'Đang mở' : 'Đã đóng'}
                  </Text>
                </View>
                <View className="flex-row justify-between">
                  <Text className="text-sm text-slate-500 font-semibold">Cuộc đua</Text>
                  <Text className="text-sm text-slate-800 font-extrabold flex-1 text-right" numberOfLines={1}>
                    {selectedRace ? selectedRace.name : 'Chưa chọn'}
                  </Text>
                </View>
              </View>

              <Text className="text-xs font-extrabold text-slate-500 uppercase mb-2">Chọn chiến mã</Text>
              {loadingHorses ? (
                <View className="py-8 items-center">
                  <ActivityIndicator color="#2563eb" />
                </View>
              ) : horses.length === 0 ? (
                <View className="bg-slate-50 rounded-2xl p-4 border border-slate-100 mb-4">
                  <Text className="text-sm text-slate-500">Cuộc đua này chưa có chiến mã hợp lệ.</Text>
                </View>
              ) : (
                <View className="mb-4">
                  {horses.map((horse, index) => {
                    const horseId = getHorseId(horse);
                    const active = selectedHorseId === horseId;
                    return (
                      <TouchableOpacity
                        activeOpacity={0.84}
                        key={horseId || index}
                        onPress={() => setSelectedHorseId(horseId)}
                        className={`flex-row items-center min-h-[64px] p-3 rounded-2xl border mb-2 ${active ? 'bg-emerald-50 border-emerald-300' : 'bg-white border-slate-200'}`}
                      >
                        <View className={`w-10 h-10 rounded-2xl items-center justify-center mr-3 ${active ? 'bg-emerald-600' : 'bg-slate-100'}`}>
                          <Text className={`font-extrabold ${active ? 'text-white' : 'text-slate-500'}`}>{index + 1}</Text>
                        </View>
                        <View className="flex-1">
                          <Text className="text-sm font-extrabold text-slate-900">{getHorseName(horse)}</Text>
                          <Text className="text-xs text-slate-500 mt-0.5">Nài ngựa: {horse.jockey?.user?.fullName || horse.jockeyName || 'Chưa rõ'}</Text>
                        </View>
                        {active ? <CheckCircle size={22} color="#10b981" /> : null}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}

              <View className="flex-row gap-3 mb-3">
                <View className="flex-1">
                  <Text className="text-xs font-extrabold text-slate-500 uppercase mb-2">Mức cược</Text>
                  <View className="h-14 rounded-2xl border border-slate-200 bg-slate-50 px-3 flex-row items-center">
                    <DollarSign size={16} color="#64748b" />
                    <TextInput
                      className="flex-1 ml-2 text-slate-900 font-extrabold"
                      keyboardType="numeric"
                      placeholder="100000"
                      value={betAmount}
                      onChangeText={(value) => setBetAmount(value.replace(/\D/g, ''))}
                    />
                  </View>
                </View>
                <View className="w-24">
                  <Text className="text-xs font-extrabold text-slate-500 uppercase mb-2">Top</Text>
                  <TextInput
                    className="h-14 rounded-2xl border border-slate-200 bg-slate-50 px-3 text-center text-slate-900 font-extrabold"
                    keyboardType="numeric"
                    value={predictedPosition}
                    onChangeText={(value) => setPredictedPosition(value.replace(/\D/g, '') || '1')}
                  />
                </View>
              </View>

              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
                <Chip label="Tối thiểu" tone="amber" onPress={() => setBetAmount('100000')} />
                <Chip label="Tất cả" tone="emerald" onPress={() => setBetAmount(String(Math.floor(balance)))} />
                {QUICK_BETS.map((amount) => (
                  <Chip key={amount} label={formatPoints(amount)} tone="slate" onPress={() => setBetAmount(String(amount))} />
                ))}
              </ScrollView>

              <ActionButton
                label="Xác nhận đặt dự đoán"
                disabled={!canSubmit}
                loading={submitting}
                onPress={submitPrediction}
                icon={CheckCircle}
              />
            </Surface>

            <Surface className="p-4">
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-lg font-extrabold text-slate-900">Lịch sử dự đoán</Text>
                <TouchableOpacity onPress={() => setSortNewest((value) => !value)} className="min-h-[40px] px-3 rounded-full bg-slate-100 items-center justify-center">
                  <Text className="text-xs font-extrabold text-slate-600">{sortNewest ? 'Mới nhất' : 'Cũ nhất'}</Text>
                </TouchableOpacity>
              </View>

              <View className="h-12 rounded-2xl border border-slate-200 bg-slate-50 px-3 flex-row items-center mb-3">
                <Search size={16} color="#94a3b8" />
                <TextInput
                  className="flex-1 ml-2 text-slate-700"
                  placeholder="Tìm theo cuộc đua hoặc chiến mã"
                  value={searchText}
                  onChangeText={setSearchText}
                />
              </View>

              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
                {HISTORY_STATUS.map((status) => (
                  <Chip
                    key={status}
                    label={status === 'ALL' ? 'Tất cả' : status}
                    active={statusFilter === status}
                    tone={statusFilter === status ? 'slate' : 'blue'}
                    onPress={() => setStatusFilter(status)}
                  />
                ))}
              </ScrollView>

              {filteredHistory.length === 0 ? (
                <EmptyState icon={Target} title="Chưa có dữ liệu phù hợp" message="Hãy đặt dự đoán hoặc đổi bộ lọc." />
              ) : (
                filteredHistory.map((prediction) => {
                  const classes = statusColor(prediction.status);
                  const statusTextClass = classes.split(' ')[2];
                  return (
                    <View key={prediction.id} className="rounded-[22px] border border-slate-100 bg-slate-50 p-4 mb-3">
                      <View className="flex-row items-start justify-between">
                        <View className="flex-1 pr-3">
                          <Text className="text-base font-extrabold text-slate-900" numberOfLines={1}>{getRaceName(prediction)}</Text>
                          <Text className="text-sm text-slate-500 mt-1">Chiến mã: {getHorseName(prediction)}</Text>
                          <View className="flex-row items-center mt-2">
                            <Clock size={13} color="#94a3b8" />
                            <Text className="text-xs text-slate-400 ml-1">{formatDateTime(prediction.createdAt)}</Text>
                          </View>
                        </View>
                        <View className={`px-3 py-1.5 rounded-full border ${classes}`}>
                          <Text className={`text-[10px] font-extrabold ${statusTextClass}`}>{prediction.status}</Text>
                        </View>
                      </View>

                      <View className="h-px bg-white my-3" />

                      <View className="flex-row">
                        <View className="flex-1">
                          <Text className="text-[10px] text-slate-400 font-extrabold uppercase">Vị trí</Text>
                          <Text className="text-sm text-slate-700 font-extrabold mt-1">Hạng {prediction.predictedPosition || 1}</Text>
                        </View>
                        <View className="flex-1">
                          <Text className="text-[10px] text-slate-400 font-extrabold uppercase">Mức cược</Text>
                          <Text className="text-sm text-slate-700 font-extrabold mt-1">{formatPoints(prediction.betAmount)} điểm</Text>
                        </View>
                        <View className="flex-1">
                          <Text className="text-[10px] text-slate-400 font-extrabold uppercase">Thưởng</Text>
                          <Text className="text-sm text-emerald-700 font-extrabold mt-1">{formatPoints(prediction.prizeAmount || prediction.payout)} điểm</Text>
                        </View>
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
