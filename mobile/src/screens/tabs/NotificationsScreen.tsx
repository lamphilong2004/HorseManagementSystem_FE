import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Bell, CheckCircle, Flag, Info, Trophy, XCircle } from 'lucide-react-native';
import * as api from '../../api';
import { Chip, EmptyState, ScreenHeader } from '../../components/MobileUI';
import { formatDateTime, getRaceId } from '../../utils/spectator';

const FILTERS = [
  { value: 'all', label: 'Tất cả' },
  { value: 'unread', label: 'Chưa đọc' },
  { value: 'read', label: 'Đã đọc' },
];

export default function NotificationsScreen() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const [predictionNotifications, accountNotifications] = await Promise.all([
        api.getNotifications().catch(() => []),
        api.getMyNotifications().catch(() => []),
      ]);
      const map = new Map<string, any>();
      [...predictionNotifications, ...accountNotifications].forEach((item, index) => {
        const id = item.id || item._id || `${item.title || 'notification'}-${index}`;
        map.set(String(id), item);
      });
      setNotifications(Array.from(map.values()));
    } catch (error) {
      console.error('Failed to fetch notifications', error);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const filteredNotifications = useMemo(() => {
    return notifications.filter((notification) => {
      const read = notification.read === true || notification.isRead === true;
      if (filter === 'read') return read;
      if (filter === 'unread') return !read;
      return true;
    });
  }, [filter, notifications]);

  const unreadCount = notifications.filter((notification) => !(notification.read === true || notification.isRead === true)).length;

  const getIconConfig = (type: string) => {
    const t = (type || '').toLowerCase();
    if (t.includes('won')) return { Icon: Trophy, bg: 'bg-emerald-100', color: '#10b981' };
    if (t.includes('lost')) return { Icon: XCircle, bg: 'bg-rose-100', color: '#f43f5e' };
    if (t.includes('started') || t.includes('race')) return { Icon: Flag, bg: 'bg-blue-100', color: '#3b82f6' };
    if (t.includes('completed')) return { Icon: CheckCircle, bg: 'bg-emerald-100', color: '#10b981' };
    if (t.includes('system')) return { Icon: Info, bg: 'bg-slate-200', color: '#64748b' };
    return { Icon: Bell, bg: 'bg-slate-200', color: '#64748b' };
  };

  const openNotification = async (notification: any) => {
    const notifId = notification.id || notification._id;
    const rawRaceId = notification.raceId || notification.race?.id || notification.data?.raceId || notification.prediction?.raceId;
    const raceId = getRaceId(rawRaceId);

    if (!(notification.read === true || notification.isRead === true) && notifId) {
      setNotifications((current) => current.map((item) => {
        const id = item.id || item._id;
        return id === notifId ? { ...item, read: true, isRead: true } : item;
      }));
      api.markNotificationRead(String(notifId)).catch(() => {});
    }

    if (raceId) {
      router.push(`/${raceId}`);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <ScreenHeader title="Thông báo" subtitle={`${unreadCount} thông báo chưa đọc`} />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 36 }}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchNotifications} />}
      >
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-5">
          {FILTERS.map((item) => (
            <Chip key={item.value} label={item.label} active={filter === item.value} onPress={() => setFilter(item.value)} />
          ))}
        </ScrollView>

        {loading && notifications.length === 0 ? (
          <View className="py-20 items-center justify-center">
            <ActivityIndicator size="large" color="#2563eb" />
          </View>
        ) : filteredNotifications.length === 0 ? (
          <EmptyState icon={Bell} title="Không có thông báo" message="Không có thông báo phù hợp với bộ lọc." />
        ) : (
          filteredNotifications.map((notification, index) => {
            const type = notification.type || '';
            const title = notification.title || type || 'Thông báo';
            const message = notification.message || '';
            const read = notification.read === true || notification.isRead === true;
            const { Icon, bg, color } = getIconConfig(type);

            return (
              <TouchableOpacity
                activeOpacity={0.84}
                key={notification.id || notification._id || index}
                onPress={() => openNotification(notification)}
                className={`rounded-[24px] p-4 mb-3 border flex-row items-start ${read ? 'bg-white border-slate-100' : 'bg-blue-50 border-blue-100'}`}
              >
                <View className={`w-12 h-12 rounded-2xl items-center justify-center ${bg}`}>
                  <Icon size={22} color={color} />
                </View>
                <View className="flex-1 ml-3">
                  <View className="flex-row items-start">
                    <Text className="text-base font-extrabold text-slate-900 flex-1" numberOfLines={2}>{title}</Text>
                    {!read ? <View className="w-2.5 h-2.5 rounded-full bg-blue-600 ml-2 mt-1.5" /> : null}
                  </View>
                  {message ? <Text className="text-sm text-slate-500 mt-1" numberOfLines={3}>{message}</Text> : null}
                  <Text className="text-xs text-slate-400 mt-2">{formatDateTime(notification.createdAt)}</Text>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
