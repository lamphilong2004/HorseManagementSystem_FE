import React from 'react';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';
import { usePathname, useRouter } from 'expo-router';
import { UserCircle } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';

type IconComponent = React.ComponentType<{ size?: number; color?: string }>;
type Tone = 'blue' | 'emerald' | 'amber' | 'rose' | 'slate' | 'purple';

const tones: Record<Tone, { soft: string; solid: string; border: string; text: string; icon: string }> = {
  blue: { soft: 'bg-blue-50', solid: 'bg-blue-600', border: 'border-blue-100', text: 'text-blue-700', icon: '#2563eb' },
  emerald: { soft: 'bg-emerald-50', solid: 'bg-emerald-600', border: 'border-emerald-100', text: 'text-emerald-700', icon: '#059669' },
  amber: { soft: 'bg-amber-50', solid: 'bg-amber-500', border: 'border-amber-100', text: 'text-amber-700', icon: '#d97706' },
  rose: { soft: 'bg-rose-50', solid: 'bg-rose-600', border: 'border-rose-100', text: 'text-rose-700', icon: '#e11d48' },
  slate: { soft: 'bg-slate-100', solid: 'bg-slate-800', border: 'border-slate-200', text: 'text-slate-700', icon: '#64748b' },
  purple: { soft: 'bg-violet-50', solid: 'bg-violet-600', border: 'border-violet-100', text: 'text-violet-700', icon: '#7c3aed' },
};

export function ScreenHeader({
  title,
  subtitle,
  right,
  profileActionBelow,
  showProfileAction = true,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  profileActionBelow?: React.ReactNode;
  showProfileAction?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();
  const shouldShowProfileAction = showProfileAction
    && ['JOCKEY', 'OWNER', 'SPECTATOR'].includes(String(user?.role || '').toUpperCase())
    && !pathname.includes('/profile');

  return (
    <View className="px-5 pt-2 pb-4 bg-slate-50">
      <View className="flex-row items-center justify-between">
        <View className="flex-1 pr-3">
          <Text className="text-[11px] font-bold uppercase tracking-wider text-slate-400">ERMS Mobile</Text>
          <Text className="text-2xl font-extrabold text-slate-900 mt-1" numberOfLines={1}>{title}</Text>
          {subtitle ? <Text className="text-sm text-slate-500 mt-1" numberOfLines={2}>{subtitle}</Text> : null}
        </View>
        {right || shouldShowProfileAction ? (
          <View className="flex-row items-center gap-2">
            {right}
            {shouldShowProfileAction && !profileActionBelow ? (
              <TouchableOpacity
                activeOpacity={0.84}
                accessibilityLabel="Hồ sơ"
                onPress={() => router.push('/(tabs)/profile' as any)}
                className="w-11 h-11 rounded-full bg-white border border-slate-100 items-center justify-center"
              >
                <UserCircle color="#64748b" size={22} />
              </TouchableOpacity>
            ) : null}
            {shouldShowProfileAction && profileActionBelow ? (
              <View className="items-center">
                <TouchableOpacity
                  activeOpacity={0.84}
                  accessibilityLabel="Hồ sơ"
                  onPress={() => router.push('/(tabs)/profile' as any)}
                  className="w-11 h-11 rounded-full bg-white border border-slate-100 items-center justify-center"
                >
                  <UserCircle color="#64748b" size={22} />
                </TouchableOpacity>
                <View className="mt-2">{profileActionBelow}</View>
              </View>
            ) : null}
          </View>
        ) : null}
      </View>
    </View>
  );
}

export function Surface({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <View className={`bg-white rounded-[24px] border border-slate-100 shadow-sm ${className}`}>
      {children}
    </View>
  );
}

export function StatTile({
  icon: Icon,
  label,
  value,
  tone = 'blue',
}: {
  icon: IconComponent;
  label: string;
  value: string | number;
  tone?: Tone;
}) {
  const color = tones[tone];
  return (
    <Surface className="flex-1 min-w-[100px] p-4">
      <View className={`w-10 h-10 rounded-2xl items-center justify-center ${color.soft}`}>
        <Icon size={20} color={color.icon} />
      </View>
      <Text className="text-xs text-slate-500 mt-3">{label}</Text>
      <Text className="text-lg font-extrabold text-slate-900 mt-0.5" numberOfLines={1}>{value}</Text>
    </Surface>
  );
}

export function Chip({
  label,
  active,
  onPress,
  tone = 'blue',
}: {
  label: string;
  active?: boolean;
  onPress?: () => void;
  tone?: Tone;
}) {
  const color = tones[tone];
  return (
    <TouchableOpacity
      activeOpacity={0.82}
      onPress={onPress}
      className={`min-h-[40px] px-4 rounded-full border mr-2 items-center justify-center ${active ? `${color.solid} ${color.border}` : 'bg-white border-slate-200'}`}
    >
      <Text className={`text-xs font-extrabold ${active ? 'text-white' : 'text-slate-600'}`} numberOfLines={1}>{label}</Text>
    </TouchableOpacity>
  );
}

export function ActionButton({
  label,
  onPress,
  disabled,
  loading,
  icon: Icon,
  variant = 'primary',
}: {
  label: string;
  onPress?: () => void;
  disabled?: boolean;
  loading?: boolean;
  icon?: IconComponent;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
}) {
  const buttonClass = disabled
    ? 'bg-slate-300'
    : variant === 'secondary'
      ? 'bg-slate-900'
      : variant === 'danger'
        ? 'bg-rose-600'
        : variant === 'ghost'
          ? 'bg-slate-100'
          : 'bg-blue-600';
  const textClass = variant === 'ghost' && !disabled ? 'text-slate-700' : 'text-white';

  return (
    <TouchableOpacity
      activeOpacity={0.86}
      disabled={disabled || loading}
      onPress={onPress}
      className={`min-h-[52px] rounded-2xl px-4 flex-row items-center justify-center ${buttonClass}`}
    >
      {loading ? (
        <ActivityIndicator color="white" />
      ) : (
        <>
          {Icon ? <Icon size={18} color={variant === 'ghost' ? '#334155' : 'white'} /> : null}
          <Text className={`${textClass} font-extrabold ${Icon ? 'ml-2' : ''}`}>{label}</Text>
        </>
      )}
    </TouchableOpacity>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  message,
}: {
  icon: IconComponent;
  title: string;
  message?: string;
}) {
  return (
    <Surface className="px-6 py-10 items-center">
      <View className="w-16 h-16 rounded-[24px] bg-slate-100 items-center justify-center">
        <Icon size={34} color="#94a3b8" />
      </View>
      <Text className="text-slate-800 font-extrabold text-base mt-4 text-center">{title}</Text>
      {message ? <Text className="text-slate-500 text-sm mt-1 text-center">{message}</Text> : null}
    </Surface>
  );
}
