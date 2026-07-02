import React from 'react';
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

export default function TabsLayout() {
  const { user } = useAuth();
  const role = user?.role || 'SPECTATOR';
  const isSpectator = role === 'SPECTATOR';

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#2563eb',
        tabBarInactiveTintColor: '#94a3b8',
        tabBarHideOnKeyboard: true,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
          marginTop: 2,
        },
        tabBarItemStyle: {
          paddingVertical: 6,
        },
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopColor: '#f1f5f9',
          height: 66,
          paddingBottom: 8,
          paddingTop: 6,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color }) => <Home color={color} size={24} />,
        }}
      />

      <Tabs.Screen
        name="tournaments"
        options={{
          title: 'Giai dau',
          tabBarIcon: ({ color }) => <Trophy color={color} size={24} />,
          href: null,
        }}
      />
      <Tabs.Screen
        name="races"
        options={{
          title: 'Cuộc đua',
          tabBarIcon: ({ color }) => <Flag color={color} size={24} />,
          href: isSpectator || ['OWNER', 'REFEREE', 'ADMIN'].includes(role) ? '/(tabs)/races' : null,
        }}
      />
      <Tabs.Screen
        name="leaderboard"
        options={{
          title: 'BXH',
          tabBarIcon: ({ color }) => <Medal color={color} size={24} />,
          href: null,
        }}
      />
      <Tabs.Screen
        name="livestream"
        options={{
          title: 'Live',
          tabBarIcon: ({ color }) => <Tv color={color} size={24} />,
          href: isSpectator ? '/(tabs)/livestream' : null,
        }}
      />
      <Tabs.Screen
        name="predictions"
        options={{
          title: 'Dự đoán',
          tabBarIcon: ({ color }) => <BarChart2 color={color} size={24} />,
          href: isSpectator ? '/(tabs)/predictions' : null,
        }}
      />
      <Tabs.Screen
        name="results"
        options={{
          title: 'Ket qua',
          tabBarIcon: ({ color }) => <BarChart2 color={color} size={24} />,
          href: null,
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: 'Thông báo',
          tabBarIcon: ({ color }) => <Bell color={color} size={24} />,
          href: null,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Hồ sơ',
          tabBarIcon: ({ color }) => <UserCircle color={color} size={24} />,
          href: isSpectator ? '/(tabs)/profile' : null,
        }}
      />

      <Tabs.Screen
        name="horses"
        options={{
          title: 'Ngua dua',
          tabBarIcon: ({ color }) => <UserIcon color={color} size={24} />,
          href: role === 'OWNER' ? '/(tabs)/horses' : null,
        }}
      />
      <Tabs.Screen
        name="schedule"
        options={{
          title: 'Lich trinh',
          tabBarIcon: ({ color }) => <Calendar color={color} size={24} />,
          href: role === 'JOCKEY' ? '/(tabs)/schedule' : null,
        }}
      />
      <Tabs.Screen
        name="invites"
        options={{
          title: 'Loi moi',
          tabBarIcon: ({ color }) => <Mail color={color} size={24} />,
          href: role === 'JOCKEY' ? '/(tabs)/invites' : null,
        }}
      />
      <Tabs.Screen
        name="referee_races"
        options={{
          title: 'Tran cua toi',
          tabBarIcon: ({ color }) => <Gavel color={color} size={24} />,
          href: role === 'REFEREE' ? '/(tabs)/referee_races' : null,
        }}
      />
      <Tabs.Screen
        name="admin_users"
        options={{
          title: 'Thanh vien',
          tabBarIcon: ({ color }) => <Users color={color} size={24} />,
          href: role === 'ADMIN' ? '/(tabs)/admin_users' : null,
        }}
      />
    </Tabs>
  );
}
