import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Activity, Award, Calendar, CheckCircle, ChevronLeft, DollarSign, Flag, ListOrdered, Wallet } from 'lucide-react-native';
import * as api from '../../api';
import { useAuth } from '../../context/AuthContext';
import { Race } from '../../types';
import { ActionButton, Chip, EmptyState, StatTile, Surface } from '../../components/MobileUI';
import { formatDateTime, formatPoints, getHorseId, getHorseName, isPredictionRaceStatus } from '../../utils/spectator';

export default function RaceDetailsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { user, balance, refreshBalance, updateBalance } = useAuth();

  const [race, setRace] = useState<Race | null>(null);
  const [horses, setHorses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [predictionOpen, setPredictionOpen] = useState(false);
  const [showPrediction, setShowPrediction] = useState(false);
  const [selectedHorseId, setSelectedHorseId] = useState('');
  const [betAmount, setBetAmount] = useState('');
  const [predictedPosition, setPredictedPosition] = useState('1');
  const [submitting, setSubmitting] = useState(false);

  const raceId = String(id || '');
  const isSpectator = user?.role === 'SPECTATOR';
  const canPredict = isSpectator && predictionOpen && isPredictionRaceStatus(race?.status);
  const betValue = Number(betAmount || 0);
  const selectedHorse = horses.find((horse) => getHorseId(horse) === selectedHorseId);

  const results = useMemo(() => {
    if (!race) return [];
    if (Array.isArray(race.results)) return race.results;
    if (Array.isArray(race.rankings)) return race.rankings;
    return [];
  }, [race]);

  const fetchRaceDetails = async () => {
    if (!raceId) return;
    setLoading(true);
    try {
      const [raceData, horsesData, openData] = await Promise.all([
        api.getRace(raceId),
        api.getRaceHorses(raceId).catch(() => []),
        api.checkPredictionOpen(raceId).catch(() => ({ isOpen: null as any })),
        refreshBalance().catch(() => balance),
      ]);
      setRace(raceData);
      setHorses(Array.isArray(horsesData) ? horsesData : []);
      const fallbackOpen = isPredictionRaceStatus(raceData?.status);
      setPredictionOpen(typeof openData?.isOpen === 'boolean' ? openData.isOpen : fallbackOpen);
    } catch (error) {
      console.error('Failed to fetch race details', error);
      Alert.alert('Lỗi', 'Không thể tải chi tiết cuộc đua.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRaceDetails();
  }, [raceId]);

  const handlePlacePrediction = async () => {
    if (!raceId || !selectedHorseId) {
      Alert.alert('Thiếu thông tin', 'Vui lòng chọn chiến mã.');
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
      await api.placePrediction(raceId, selectedHorseId, betValue, Number(predictedPosition) || 1);
      updateBalance((current) => current - betValue);
      Alert.alert('Thành công', `Bạn đã đặt ${formatPoints(betValue)} điểm cho ${getHorseName(selectedHorse)}.`);
      setShowPrediction(false);
      setBetAmount('');
      setSelectedHorseId('');
      await fetchRaceDetails();
    } catch (error: any) {
      Alert.alert('Thất bại', error?.response?.data?.message || 'Có lỗi xảy ra khi đặt dự đoán.');
    } finally {
      setSubmitting(false);
    }
  };

  const statusLabel = (status?: string) => {
    const s = (status || '').toLowerCase();
    if (s === 'ongoing' || s === 'running' || s === 'live') return 'Đang diễn ra';
    if (s === 'scheduled') return 'Lên lịch';
    if (s === 'completed' || s === 'finished' || s === 'result_confirmed') return 'Hoàn thành';
    if (s === 'cancelled') return 'Đã hủy';
    return status || 'Chưa rõ';
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-slate-50 justify-center items-center">
        <ActivityIndicator size="large" color="#2563eb" />
      </SafeAreaView>
    );
  }

  if (!race) {
    return (
      <SafeAreaView className="flex-1 bg-slate-50 justify-center items-center px-6">
        <EmptyState icon={Flag} title="Không tìm thấy cuộc đua" />
        <View className="mt-4 w-full">
          <ActionButton label="Quay lại" onPress={() => router.back()} icon={ChevronLeft} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <View className="px-5 pt-2 pb-4 bg-slate-50 flex-row items-center">
        <TouchableOpacity onPress={() => router.back()} className="w-11 h-11 rounded-full bg-white border border-slate-100 items-center justify-center">
          <ChevronLeft size={24} color="#334155" />
        </TouchableOpacity>
        <View className="flex-1 ml-3">
          <Text className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Chi tiết cuộc đua</Text>
          <Text className="text-xl font-extrabold text-slate-900" numberOfLines={1}>{race.name}</Text>
        </View>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
        <ScrollView className="flex-1" contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: canPredict ? 150 : 32 }}>
          <View className="rounded-[28px] bg-slate-900 p-5 mb-5">
            <View className="flex-row items-center justify-between mb-4">
              <View className="px-3 py-1.5 rounded-full bg-white/10">
                <Text className="text-white text-xs font-extrabold">{statusLabel(race.status)}</Text>
              </View>
              <View className={`px-3 py-1.5 rounded-full ${predictionOpen ? 'bg-emerald-500' : 'bg-rose-500'}`}>
                <Text className="text-white text-xs font-extrabold">
                  {predictionOpen ? 'Dự đoán mở' : 'Dự đoán đóng'}
                </Text>
              </View>
            </View>
            <Text className="text-white text-2xl font-extrabold" numberOfLines={2}>{race.name}</Text>
            <View className="flex-row flex-wrap gap-2 mt-4">
              <View className="flex-row items-center bg-white/10 px-3 py-2 rounded-full">
                <Flag size={14} color="#e2e8f0" />
                <Text className="text-slate-100 text-xs font-bold ml-1">{race.distance}m</Text>
              </View>
              <View className="flex-row items-center bg-white/10 px-3 py-2 rounded-full">
                <Activity size={14} color="#e2e8f0" />
                <Text className="text-slate-100 text-xs font-bold ml-1">{race.maxHorses} chiến mã</Text>
              </View>
              <View className="flex-row items-center bg-white/10 px-3 py-2 rounded-full">
                <Calendar size={14} color="#e2e8f0" />
                <Text className="text-slate-100 text-xs font-bold ml-1">{formatDateTime(race.scheduledAt)}</Text>
              </View>
            </View>
          </View>

          <Text className="text-base font-extrabold text-slate-900 mb-3">Tổng quan</Text>
          <View className="flex-row gap-3 mb-5">
            <StatTile icon={Award} label="Top 1" value={formatPoints(race.prizeFirst)} tone="amber" />
            <StatTile icon={Award} label="Top 2" value={formatPoints(race.prizeSecond)} tone="slate" />
            <StatTile icon={Wallet} label="Số dư" value={formatPoints(balance)} tone="blue" />
          </View>

          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-base font-extrabold text-slate-900">Chiến mã ({horses.length})</Text>
            {canPredict ? <Text className="text-xs font-extrabold text-emerald-600">Có thể dự đoán</Text> : null}
          </View>

          {horses.length === 0 ? (
            <EmptyState icon={Flag} title="Chưa có ngựa tham gia" />
          ) : (
            horses.map((item, index) => {
              const horseId = getHorseId(item);
              const active = selectedHorseId === horseId;
              return (
                <TouchableOpacity
                  activeOpacity={0.84}
                  key={horseId || index}
                  disabled={!canPredict}
                  onPress={() => {
                    if (!canPredict) return;
                    setSelectedHorseId(horseId);
                    setShowPrediction(true);
                  }}
                >
                  <Surface className={`p-4 mb-3 ${active ? 'border-blue-300 bg-blue-50' : ''}`}>
                    <View className="flex-row items-center">
                      <View className={`w-12 h-12 rounded-2xl mr-4 items-center justify-center ${active ? 'bg-blue-600' : 'bg-slate-100'}`}>
                        <Text className={`font-extrabold ${active ? 'text-white' : 'text-slate-500'}`}>{index + 1}</Text>
                      </View>
                      <View className="flex-1">
                        <Text className="text-base font-extrabold text-slate-900" numberOfLines={1}>{getHorseName(item)}</Text>
                        <Text className="text-sm text-slate-500 mt-0.5">Nài ngựa: {item.jockey?.user?.fullName || item.jockeyName || 'Chưa rõ'}</Text>
                      </View>
                      {canPredict ? (
                        active ? <CheckCircle size={22} color="#2563eb" /> : <Text className="text-xs font-extrabold text-blue-600">Chọn</Text>
                      ) : null}
                    </View>
                  </Surface>
                </TouchableOpacity>
              );
            })
          )}

          {results.length > 0 ? (
            <View className="mt-5">
              <Text className="text-base font-extrabold text-slate-900 mb-3">Kết quả về đích</Text>
              {results.map((result: any, index: number) => (
                <Surface key={`${result.horseId || index}`} className="p-4 mb-3 bg-emerald-50 border-emerald-100">
                  <View className="flex-row items-center">
                    <View className="w-10 h-10 bg-emerald-200 rounded-2xl mr-3 items-center justify-center">
                      <Text className="font-extrabold text-emerald-800">{result.position || index + 1}</Text>
                    </View>
                    <Text className="text-base font-extrabold text-slate-900 flex-1">
                      {result.horseName || result.horse?.name || result.horseId?.name || 'Ngựa thi đấu'}
                    </Text>
                  </View>
                </Surface>
              ))}
            </View>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>

      {showPrediction && canPredict ? (
        <View className="absolute bottom-0 left-0 right-0 bg-white rounded-t-[28px] border-t border-slate-100 px-5 pt-4 pb-8 shadow-2xl">
          <View className="w-12 h-1.5 rounded-full bg-slate-200 self-center mb-4" />
          <View className="flex-row justify-between items-center mb-4">
            <View className="flex-1">
              <Text className="text-xl font-extrabold text-slate-900">Đặt cược dự đoán</Text>
              <Text className="text-sm text-slate-500 mt-1" numberOfLines={1}>Chiến mã: {getHorseName(selectedHorse)}</Text>
            </View>
            <TouchableOpacity onPress={() => setShowPrediction(false)} className="w-10 h-10 rounded-full bg-slate-100 items-center justify-center">
              <Text className="text-slate-500 font-extrabold">X</Text>
            </TouchableOpacity>
          </View>

          <View className="flex-row gap-3 mb-3">
            <View className="flex-1">
              <Text className="text-xs font-extrabold text-slate-500 uppercase mb-2">Mức cược</Text>
              <View className="flex-row items-center border border-slate-200 rounded-2xl px-3 h-14 bg-slate-50">
                <DollarSign size={16} color="#64748b" />
                <TextInput
                  className="flex-1 ml-2 text-slate-900 font-extrabold"
                  placeholder="100000"
                  keyboardType="numeric"
                  value={betAmount}
                  onChangeText={(value) => setBetAmount(value.replace(/\D/g, ''))}
                />
              </View>
            </View>
            <View className="w-24">
              <Text className="text-xs font-extrabold text-slate-500 uppercase mb-2">Top</Text>
              <View className="flex-row items-center border border-slate-200 rounded-2xl px-3 h-14 bg-slate-50">
                <ListOrdered size={16} color="#64748b" />
                <TextInput
                  className="flex-1 ml-2 text-slate-900 font-extrabold text-center"
                  keyboardType="numeric"
                  value={predictedPosition}
                  onChangeText={(value) => setPredictedPosition(value.replace(/\D/g, '') || '1')}
                />
              </View>
            </View>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
            {[100000, 200000, 500000].map((amount) => (
              <Chip key={amount} label={formatPoints(amount)} tone="slate" onPress={() => setBetAmount(String(amount))} />
            ))}
            <Chip label="Tất cả" tone="emerald" onPress={() => setBetAmount(String(Math.floor(balance)))} />
          </ScrollView>

          <ActionButton
            label="Xác nhận đặt cược"
            loading={submitting}
            disabled={submitting}
            onPress={handlePlacePrediction}
            icon={CheckCircle}
          />
        </View>
      ) : null}

      {!showPrediction && canPredict ? (
        <View className="absolute bottom-6 left-5 right-5">
          <ActionButton label="Tham gia dự đoán" onPress={() => setShowPrediction(true)} icon={Award} />
        </View>
      ) : null}
    </SafeAreaView>
  );
}
