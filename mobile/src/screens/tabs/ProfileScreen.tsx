import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { LogOut, Mail, Phone, Shield, Trophy, UserCircle, Wallet } from 'lucide-react-native';
import * as api from '../../api';
import { useAuth } from '../../context/AuthContext';
import { Prediction } from '../../types';
import { ActionButton, EmptyState, ScreenHeader, StatTile, Surface } from '../../components/MobileUI';
import { formatDateTime, formatPoints, getHorseName, getRaceName } from '../../utils/spectator';

export default function ProfileScreen() {
  const { user, balance, logout, refreshBalance } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const [profileData, predictionData] = await Promise.all([
        api.getMyProfile().catch(() => null),
        api.getMyPredictions().catch(() => []),
        refreshBalance().catch(() => balance),
      ]);
      setProfile(profileData?.data?.user || profileData?.user || profileData?.data || profileData);
      setPredictions(predictionData);
    } catch (error) {
      console.error('Failed to load profile', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const stats = useMemo(() => {
    const won = predictions.filter((item) => item.status === 'WON').length;
    const lost = predictions.filter((item) => item.status === 'LOST').length;
    const totalBet = predictions.reduce((sum, item) => sum + Number(item.betAmount || 0), 0);
    const payout = predictions.reduce((sum, item) => sum + Number(item.prizeAmount || item.payout || 0), 0);
    return { won, lost, totalBet, payout };
  }, [predictions]);

  const displayName = profile?.fullName || profile?.name || user?.name || 'Khán giả';
  const email = profile?.email || user?.email || 'Chưa cập nhật';
  const phone = profile?.phone || user?.phone || 'Chưa cập nhật';
  const recentPredictions = predictions.slice(0, 5);

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <ScreenHeader title="Hồ sơ" subtitle="Thông tin tài khoản và lịch sử spectator." />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 36 }}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchProfile} />}
      >
        {loading && !profile ? (
          <View className="py-20 items-center">
            <ActivityIndicator size="large" color="#2563eb" />
          </View>
        ) : (
          <View>
            <View className="bg-blue-600 rounded-[28px] p-5 mb-5">
              <View className="flex-row items-center">
                <View className="w-16 h-16 rounded-[24px] bg-white/20 items-center justify-center mr-4">
                  <UserCircle size={40} color="white" />
                </View>
                <View className="flex-1">
                  <Text className="text-white text-2xl font-extrabold" numberOfLines={1}>{displayName}</Text>
                  <Text className="text-blue-100 text-xs font-extrabold mt-1">{user?.role || 'SPECTATOR'}</Text>
                </View>
              </View>

              <View className="mt-5 rounded-[24px] bg-white/15 p-4 flex-row items-center justify-between">
                <View>
                  <Text className="text-blue-100 text-xs font-extrabold uppercase">Số dư hiện tại</Text>
                  <Text className="text-white text-3xl font-extrabold mt-1">{formatPoints(balance)}</Text>
                </View>
                <Wallet size={32} color="white" />
              </View>
            </View>

            <Surface className="p-4 mb-5">
              <Text className="text-lg font-extrabold text-slate-900 mb-3">Thông tin cá nhân</Text>
              <View className="flex-row items-center min-h-[52px] border-t border-slate-50">
                <Mail size={18} color="#64748b" />
                <Text className="text-sm text-slate-700 ml-3 flex-1">{email}</Text>
              </View>
              <View className="flex-row items-center min-h-[52px] border-t border-slate-50">
                <Phone size={18} color="#64748b" />
                <Text className="text-sm text-slate-700 ml-3 flex-1">{phone}</Text>
              </View>
              <View className="flex-row items-center min-h-[52px] border-t border-slate-50">
                <Shield size={18} color="#64748b" />
                <Text className="text-sm text-slate-700 ml-3 flex-1">{profile?.status || user?.status || 'ACTIVE'}</Text>
              </View>
            </Surface>

            <View className="flex-row flex-wrap gap-3 mb-5">
              <StatTile icon={Trophy} label="Thắng" value={stats.won} tone="emerald" />
              <StatTile icon={Trophy} label="Thua" value={stats.lost} tone="rose" />
              <StatTile icon={Wallet} label="Đã cược" value={formatPoints(stats.totalBet)} tone="amber" />
              <StatTile icon={Wallet} label="Thưởng" value={formatPoints(stats.payout)} tone="purple" />
            </View>

            <Surface className="p-4 mb-5">
              <Text className="text-lg font-extrabold text-slate-900 mb-3">Dự đoán gần đây</Text>
              {recentPredictions.length === 0 ? (
                <EmptyState icon={Trophy} title="Bạn chưa có lượt dự đoán nào" />
              ) : (
                recentPredictions.map((prediction) => (
                  <View key={prediction.id} className="py-3 border-t border-slate-50">
                    <View className="flex-row justify-between">
                      <Text className="text-sm font-extrabold text-slate-900 flex-1" numberOfLines={1}>{getRaceName(prediction)}</Text>
                      <Text className="text-xs font-extrabold text-slate-500 ml-2">{prediction.status}</Text>
                    </View>
                    <Text className="text-xs text-slate-500 mt-1">Chiến mã: {getHorseName(prediction)}</Text>
                    <Text className="text-xs text-slate-400 mt-1">{formatDateTime(prediction.createdAt)}</Text>
                  </View>
                ))
              )}
            </Surface>

            <ActionButton label="Đăng xuất" onPress={logout} icon={LogOut} variant="danger" />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
