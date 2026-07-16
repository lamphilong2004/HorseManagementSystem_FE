import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity,  ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { useRouter as useExpoRouter } from 'expo-router';
import { Trophy, Mail, Lock, User as UserIcon, Eye, EyeOff, ChevronLeft } from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
import { Role } from '../../types';

export default function RegisterScreen() {
  const router = useExpoRouter();
  const { register } = useAuth();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [obscure, setObscure] = useState(true);
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState<Role>('SPECTATOR');
  const roleOptions: Array<{ value: Role; label: string; desc: string }> = [
    { value: 'SPECTATOR', label: 'Khán giả', desc: 'Theo dõi, livestream và dự đoán' },
    { value: 'OWNER', label: 'Chủ ngựa', desc: 'Quản lý ngựa và tuyển Jockey' },
    { value: 'JOCKEY', label: 'Jockey', desc: 'Nhận lời mời và xem lịch thi đấu' },
  ];

  const handleRegister = async () => {
    if (!name || !email || !password) {
      Alert.alert('Thiếu thông tin', 'Vui lòng điền đầy đủ các trường.');
      return;
    }
    
    setLoading(true);
    try {
      await register(name, email, password, role);
      router.replace('/(tabs)');
    } catch (error: any) {
      Alert.alert('Đăng Ký Thất Bại', error?.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView contentContainerStyle={{ padding: 24 }}>
          {/* Back Button */}
          <TouchableOpacity 
            className="flex-row items-center gap-3 mb-8"
            onPress={() => router.push('/(auth)/welcome')}
          >
            <View className="p-2 bg-white rounded-lg border border-slate-200">
              <ChevronLeft size={16} color="#64748b" />
            </View>
            <Text className="text-slate-500 font-medium">Quay lại trang chủ</Text>
          </TouchableOpacity>

          {/* Brand Header */}
          <View className="items-center mb-8">
            <View className="w-16 h-16 rounded-2xl bg-blue-600 items-center justify-center mb-4 shadow-lg shadow-blue-600/30">
              <Trophy color="white" size={32} />
            </View>
            <Text className="text-2xl font-extrabold text-slate-800 tracking-tight">Tạo Tài Khoản</Text>
            <Text className="text-sm font-medium text-slate-500 mt-1">Tham gia cộng đồng ERMS</Text>
          </View>

          {/* Register Form */}
          <View className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            {/* Name */}
            <Text className="text-xs font-semibold text-slate-700 mb-2 uppercase tracking-wider">Họ và Tên</Text>
            <View className="flex-row items-center bg-slate-50 border border-slate-200 rounded-xl px-3 py-1 mb-4 h-12">
              <UserIcon size={18} color="#94a3b8" />
              <TextInput 
                className="flex-1 ml-3 text-slate-800"
                placeholder="Nguyễn Văn A"
                placeholderTextColor="#cbd5e1"
                value={name}
                onChangeText={setName}
              />
            </View>

            {/* Email */}
            <Text className="text-xs font-semibold text-slate-700 mb-2 uppercase tracking-wider">Địa chỉ Email</Text>
            <View className="flex-row items-center bg-slate-50 border border-slate-200 rounded-xl px-3 py-1 mb-4 h-12">
              <Mail size={18} color="#94a3b8" />
              <TextInput 
                className="flex-1 ml-3 text-slate-800"
                placeholder="you@example.com"
                placeholderTextColor="#cbd5e1"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
            </View>

            {/* Password */}
            <Text className="text-xs font-semibold text-slate-700 mb-2 uppercase tracking-wider">Mật khẩu</Text>
            <View className="flex-row items-center bg-slate-50 border border-slate-200 rounded-xl px-3 py-1 mb-6 h-12">
              <Lock size={18} color="#94a3b8" />
              <TextInput 
                className="flex-1 ml-3 text-slate-800"
                placeholder="••••••••"
                placeholderTextColor="#cbd5e1"
                secureTextEntry={obscure}
                value={password}
                onChangeText={setPassword}
              />
              <TouchableOpacity onPress={() => setObscure(!obscure)}>
                {obscure ? <EyeOff size={18} color="#94a3b8" /> : <Eye size={18} color="#94a3b8" />}
              </TouchableOpacity>
            </View>

            <Text className="text-xs font-semibold text-slate-700 mb-2 uppercase tracking-wider">Vai trò</Text>
            <View className="mb-6 gap-2">
              {roleOptions.map((option) => {
                const active = role === option.value;
                return (
                  <TouchableOpacity
                    key={option.value}
                    activeOpacity={0.84}
                    onPress={() => setRole(option.value)}
                    className={`p-3 rounded-xl border ${active ? 'bg-blue-50 border-blue-200' : 'bg-slate-50 border-slate-200'}`}
                  >
                    <Text className={`font-extrabold ${active ? 'text-blue-700' : 'text-slate-800'}`}>{option.label}</Text>
                    <Text className="text-xs text-slate-500 mt-1">{option.desc}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Register Button */}
            <TouchableOpacity 
              className={`bg-blue-600 rounded-xl py-3.5 flex-row justify-center items-center ${loading ? 'opacity-70' : ''}`}
              onPress={handleRegister}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white font-bold text-base">Đăng ký</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Login Link */}
          <View className="flex-row justify-center mt-6">
            <Text className="text-slate-500">Đã có tài khoản? </Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
              <Text className="text-blue-600 font-bold">Đăng nhập</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
