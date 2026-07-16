import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Tabs } from 'expo-router';
import {
  BarChart2,
  Bell,
  Calendar,
  Flag,
  Gavel,
  Home,
  Mail,
  Medal,
  Trophy,
  Tv,
  User as UserIcon,
  UserCircle,
  Users,
} from 'lucide-react-native';
import { useAuth } from '../../src/context/AuthContext';
import * as api from '../../src/api';
import { isLiveRace } from '../../src/utils/spectator';

const roleTabs: Record<string, string[]> = {
  OWNER: ['tournaments', 'races', 'leaderboard', 'livestream', 'profile', 'horses'],
  JOCKEY: ['tournaments', 'races', 'leaderboard', 'livestream', 'profile', 'invites', 'schedule', 'results'],
  SPECTATOR: ['races', 'livestream', 'predictions', 'profile'],
  REFEREE: ['races', 'referee_races', 'profile'],
  ADMIN: ['races', 'admin_users', 'profile'],
};

function visible(role: string, screen: string) {
  if (screen === 'index') return true;
  return (roleTabs[role] || []).includes(screen);
}

function hrefFor(role: string, screen: string) {
  return visible(role, screen) ? (`/(tabs)/${screen}` as const) : null;
}

export default function TabsLayout() {
  const { user } = useAuth();
  const role = user?.role || 'SPECTATOR';
  const compact = role === 'OWNER' || role === 'JOCKEY';
  const [liveRaceCount, setLiveRaceCount] = useState(0);

  useEffect(() => {
    let mounted = true;

    const fetchLiveRaceCount = async () => {
      try {
        const races = await api.getPublicRaces({ limit: 1000 });
        if (!mounted) return;
        setLiveRaceCount(races.filter(isLiveRace).length);
      } catch {
        if (mounted) setLiveRaceCount(0);
      }
    };

    fetchLiveRaceCount();
    const interval = setInterval(fetchLiveRaceCount, 30000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#2563eb',
        tabBarInactiveTintColor: '#94a3b8',
        tabBarHideOnKeyboard: true,
        tabBarLabelStyle: {
          fontSize: compact ? 9 : 11,
          fontWeight: '700',
          marginTop: 1,
        },
        tabBarIconStyle: {
          marginTop: 2,
        },
        tabBarItemStyle: {
          paddingVertical: 4,
        },
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopColor: '#f1f5f9',
          height: compact ? 72 : 66,
          paddingBottom: compact ? 8 : 8,
          paddingTop: 5,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color }) => <Home color={color} size={compact ? 20 : 24} />,
          href: '/(tabs)',
        }}
      />

      <Tabs.Screen
        name="tournaments"
        options={{
          title: 'Giải đấu',
          tabBarIcon: ({ color }) => <Trophy color={color} size={compact ? 20 : 24} />,
          href: hrefFor(role, 'tournaments'),
        }}
      />
      <Tabs.Screen
        name="races"
        options={{
          title: 'Cuộc đua',
          tabBarIcon: ({ color }) => <Flag color={color} size={compact ? 20 : 24} />,
          href: hrefFor(role, 'races'),
        }}
      />
      <Tabs.Screen
        name="leaderboard"
        options={{
          title: 'Bảng hạng',
          tabBarIcon: ({ color }) => <Medal color={color} size={compact ? 20 : 24} />,
          href: hrefFor(role, 'leaderboard'),
        }}
      />
      <Tabs.Screen
        name="livestream"
        options={{
          title: 'Livestream',
          tabBarIcon: ({ color }) => (
            <View style={{ position: 'relative' }}>
              <Tv color={liveRaceCount > 0 ? '#ef4444' : color} size={compact ? 20 : 24} />
              {liveRaceCount > 0 ? (
                <View
                  style={{
                    position: 'absolute',
                    top: -4,
                    right: -4,
                    width: 10,
                    height: 10,
                    borderRadius: 999,
                    backgroundColor: '#ef4444',
                    borderWidth: 2,
                    borderColor: '#ffffff',
                  }}
                />
              ) : null}
            </View>
          ),
          tabBarBadge: liveRaceCount > 0 ? liveRaceCount : undefined,
          tabBarBadgeStyle: {
            backgroundColor: '#ef4444',
            color: '#ffffff',
            fontSize: 10,
            fontWeight: '800',
            minWidth: 18,
            height: 18,
            lineHeight: 18,
          },
          href: hrefFor(role, 'livestream'),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Hồ sơ',
          tabBarIcon: ({ color }) => <UserCircle color={color} size={compact ? 20 : 24} />,
          href: hrefFor(role, 'profile'),
        }}
      />

      <Tabs.Screen
        name="horses"
        options={{
          title: 'Ngựa của tôi',
          tabBarIcon: ({ color }) => <UserIcon color={color} size={compact ? 20 : 24} />,
          href: hrefFor(role, 'horses'),
        }}
      />
      <Tabs.Screen
        name="invites"
        options={{
          title: 'Lời mời',
          tabBarIcon: ({ color }) => <Mail color={color} size={compact ? 20 : 24} />,
          href: hrefFor(role, 'invites'),
        }}
      />
      <Tabs.Screen
        name="schedule"
        options={{
          title: 'Lịch thi đấu',
          tabBarIcon: ({ color }) => <Calendar color={color} size={compact ? 20 : 24} />,
          href: hrefFor(role, 'schedule'),
        }}
      />
      <Tabs.Screen
        name="results"
        options={{
          title: 'Kết quả',
          tabBarIcon: ({ color }) => <BarChart2 color={color} size={compact ? 20 : 24} />,
          href: hrefFor(role, 'results'),
        }}
      />

      <Tabs.Screen
        name="predictions"
        options={{
          title: 'Dự đoán',
          tabBarIcon: ({ color }) => <BarChart2 color={color} size={compact ? 20 : 24} />,
          href: hrefFor(role, 'predictions'),
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: 'Thông báo',
          tabBarIcon: ({ color }) => <Bell color={color} size={compact ? 20 : 24} />,
          href: null,
        }}
      />
      <Tabs.Screen
        name="referee_races"
        options={{
          title: 'Trọng tài',
          tabBarIcon: ({ color }) => <Gavel color={color} size={compact ? 20 : 24} />,
          href: hrefFor(role, 'referee_races'),
        }}
      />
      <Tabs.Screen
        name="admin_users"
        options={{
          title: 'Thành viên',
          tabBarIcon: ({ color }) => <Users color={color} size={compact ? 20 : 24} />,
          href: hrefFor(role, 'admin_users'),
        }}
      />
    </Tabs>
  );
}
