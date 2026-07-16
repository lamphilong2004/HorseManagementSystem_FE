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
import { Award, BookOpen, Check, Edit3, LogOut, Mail, Phone, Shield, Sparkles, Trophy, UserCircle, Wallet, X } from 'lucide-react-native';
import * as api from '../../api';
import { useAuth } from '../../context/AuthContext';
import { Prediction } from '../../types';
import { ActionButton, EmptyState, ScreenHeader, StatTile, Surface } from '../../components/MobileUI';
import { formatDateTime, formatPoints, getHorseName, getRaceName } from '../../utils/spectator';

function profilePayload(profile: any) {
  return profile?.data?.user || profile?.data?.profile || profile?.user || profile?.profile || profile?.data || profile || {};
}

function roleLabel(role?: string) {
  const map: Record<string, string> = {
    SPECTATOR: 'Khán giả',
    OWNER: 'Chủ ngựa',
    JOCKEY: 'Jockey',
    REFEREE: 'Trọng tài',
    ADMIN: 'Quản trị',
  };
  return map[String(role || '').toUpperCase()] || role || 'Người dùng';
}

export default function ProfileScreen() {
  const { user, balance, logout, refreshBalance } = useAuth();
  const role = user?.role || 'SPECTATOR';
  const isJockey = role === 'JOCKEY';
  const isSpectator = role === 'SPECTATOR';

  const [profile, setProfile] = useState<any>(null);
  const [jockeyProfile, setJockeyProfile] = useState<any>(null);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingJockey, setEditingJockey] = useState(false);
  const [saving, setSaving] = useState(false);
  const [jockeyForm, setJockeyForm] = useState({
    age: '',
    experience: '',
    bio: '',
    specialties: '',
  });

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const profileData = await api.getMyProfile().catch(() => null);
      if (isSpectator) {
        await refreshBalance().catch(() => balance);
      }

      const payload = profilePayload(profileData);
      setProfile(payload);

      if ((payload.role || role) === 'JOCKEY') {
        const jData = await api.getJockeyProfile().catch(() => null);
        setJockeyProfile(jData);
        setJockeyForm({
          age: jData?.age ? String(jData.age) : '',
          experience: jData?.experience ? String(jData.experience) : '',
          bio: jData?.bio || '',
          specialties: Array.isArray(jData?.specialties) ? jData.specialties.join(', ') : '',
        });
      } else if ((payload.role || role) === 'SPECTATOR') {
        const predictionData = await api.getMyPredictions().catch(() => []);
        setPredictions(predictionData);
      }
    } catch (error) {
      console.error('Failed to load profile', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [role]);

  const stats = useMemo(() => {
    const won = predictions.filter((item) => item.status === 'WON').length;
    const lost = predictions.filter((item) => item.status === 'LOST').length;
    const totalBet = predictions.reduce((sum, item) => sum + Number(item.betAmount || 0), 0);
    const payout = predictions.reduce((sum, item) => sum + Number(item.prizeAmount || item.payout || 0), 0);
    return { won, lost, totalBet, payout };
  }, [predictions]);

  const saveJockeyProfile = async () => {
    setSaving(true);
    try {
      await api.updateJockeyProfile({
        age: jockeyForm.age ? Number(jockeyForm.age) : undefined,
        experience: jockeyForm.experience ? Number(jockeyForm.experience) : undefined,
        bio: jockeyForm.bio || undefined,
        specialties: jockeyForm.specialties
          ? jockeyForm.specialties.split(',').map((item) => item.trim()).filter(Boolean)
          : undefined,
      });
      setEditingJockey(false);
      await fetchProfile();
      Alert.alert('Thành công', 'Đã cập nhật hồ sơ Jockey.');
    } catch (error: any) {
      Alert.alert('Lỗi', error?.response?.data?.message || 'Không thể cập nhật hồ sơ Jockey.');
    } finally {
      setSaving(false);
    }
  };

  const displayName = profile?.fullName || profile?.name || user?.name || 'Người dùng';
  const email = profile?.email || user?.email || 'Chưa cập nhật';
  const phone = profile?.phone || user?.phone || 'Chưa cập nhật';
  const recentPredictions = predictions.slice(0, 5);

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <ScreenHeader title="Hồ sơ" subtitle="Thông tin tài khoản và hồ sơ nghiệp vụ." />

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
                  <Text className="text-blue-100 text-xs font-extrabold mt-1">{roleLabel(profile?.role || role)}</Text>
                </View>
              </View>

              {isSpectator ? (
                <View className="mt-5 rounded-[24px] bg-white/15 p-4 flex-row items-center justify-between">
                  <View>
                    <Text className="text-blue-100 text-xs font-extrabold uppercase">Số dư hiện tại</Text>
                    <Text className="text-white text-3xl font-extrabold mt-1">{formatPoints(balance)}</Text>
                  </View>
                  <Wallet size={32} color="white" />
                </View>
              ) : null}
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

            {isJockey ? (
              <View>
                <View className="flex-row items-center justify-between mb-3">
                  <Text className="text-base font-extrabold text-slate-900">Hồ sơ Jockey</Text>
                  <TouchableOpacity
                    onPress={() => setEditingJockey((current) => !current)}
                    className="min-h-[38px] px-3 rounded-full bg-amber-50 border border-amber-100 flex-row items-center justify-center"
                  >
                    {editingJockey ? <X size={16} color="#d97706" /> : <Edit3 size={16} color="#d97706" />}
                    <Text className="text-xs font-extrabold text-amber-700 ml-1">{editingJockey ? 'Hủy' : 'Sửa'}</Text>
                  </TouchableOpacity>
                </View>

                {!editingJockey ? (
                  <View>
                    <View className="flex-row flex-wrap gap-3 mb-5">
                      <StatTile icon={Trophy} label="Tỷ lệ thắng" value={`${jockeyProfile?.winRate || 0}%`} tone="emerald" />
                      <StatTile icon={Award} label="Kinh nghiệm" value={`${jockeyProfile?.experience || 0} năm`} tone="purple" />
                      <StatTile icon={Check} label="Thắng" value={jockeyProfile?.wins || 0} tone="amber" />
                      <StatTile icon={Sparkles} label="Tổng trận" value={jockeyProfile?.races || 0} tone="blue" />
                    </View>

                    <Surface className="p-4 mb-5">
                      <View className="flex-row items-center mb-2">
                        <BookOpen size={18} color="#64748b" />
                        <Text className="text-base font-extrabold text-slate-900 ml-2">Tiểu sử</Text>
                      </View>
                      <Text className="text-sm text-slate-600 leading-5">{jockeyProfile?.bio || 'Chưa có tiểu sử.'}</Text>
                    </Surface>

                    <Surface className="p-4 mb-5">
                      <Text className="text-base font-extrabold text-slate-900 mb-3">Sở trường</Text>
                      <View className="flex-row flex-wrap gap-2">
                        {(jockeyProfile?.specialties?.length ? jockeyProfile.specialties : ['Chưa cập nhật']).map((item: string, index: number) => (
                          <View key={`${item}-${index}`} className="px-3 py-2 rounded-full bg-emerald-50 border border-emerald-100">
                            <Text className="text-xs font-extrabold text-emerald-700">{item}</Text>
                          </View>
                        ))}
                      </View>
                    </Surface>
                  </View>
                ) : (
                  <Surface className="p-4 mb-5">
                    <View className="flex-row gap-3 mb-3">
                      <View className="flex-1">
                        <Text className="text-xs font-extrabold text-slate-500 uppercase mb-2">Tuổi</Text>
                        <TextInput
                          className="h-12 rounded-2xl bg-slate-50 border border-slate-200 px-4 text-slate-900 font-semibold"
                          keyboardType="numeric"
                          value={jockeyForm.age}
                          onChangeText={(value) => setJockeyForm((current) => ({ ...current, age: value.replace(/\D/g, '') }))}
                        />
                      </View>
                      <View className="flex-1">
                        <Text className="text-xs font-extrabold text-slate-500 uppercase mb-2">Kinh nghiệm</Text>
                        <TextInput
                          className="h-12 rounded-2xl bg-slate-50 border border-slate-200 px-4 text-slate-900 font-semibold"
                          keyboardType="numeric"
                          value={jockeyForm.experience}
                          onChangeText={(value) => setJockeyForm((current) => ({ ...current, experience: value.replace(/\D/g, '') }))}
                        />
                      </View>
                    </View>
                    <Text className="text-xs font-extrabold text-slate-500 uppercase mb-2">Sở trường (cách nhau bằng dấu phẩy)</Text>
                    <TextInput
                      className="min-h-[48px] rounded-2xl bg-slate-50 border border-slate-200 px-4 py-3 text-slate-900 font-semibold mb-3"
                      value={jockeyForm.specialties}
                      onChangeText={(value) => setJockeyForm((current) => ({ ...current, specialties: value }))}
                      placeholder="Đua cự ly ngắn, bứt tốc"
                    />
                    <Text className="text-xs font-extrabold text-slate-500 uppercase mb-2">Tiểu sử</Text>
                    <TextInput
                      className="min-h-[96px] rounded-2xl bg-slate-50 border border-slate-200 px-4 py-3 text-slate-900 font-semibold mb-4"
                      multiline
                      textAlignVertical="top"
                      value={jockeyForm.bio}
                      onChangeText={(value) => setJockeyForm((current) => ({ ...current, bio: value }))}
                      placeholder="Giới thiệu ngắn về kinh nghiệm thi đấu"
                    />
                    <ActionButton label="Lưu hồ sơ" onPress={saveJockeyProfile} loading={saving} icon={Check} />
                  </Surface>
                )}
              </View>
            ) : null}

            {isSpectator ? (
              <View>
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
              </View>
            ) : null}

            <ActionButton label="Đăng xuất" onPress={logout} icon={LogOut} variant="danger" />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
