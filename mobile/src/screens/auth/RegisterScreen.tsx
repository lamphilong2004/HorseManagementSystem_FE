import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity,  ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { useRouter as useExpoRouter } from 'expo-router';
import { Trophy, Mail, Lock, User as UserIcon, Eye, EyeOff, ChevronLeft } from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_NAME_LENGTH = 2;
const MAX_NAME_LENGTH = 100;
const MIN_PASSWORD_LENGTH = 8;

export default function RegisterScreen() {
  const router = useExpoRouter();
  const { register } = useAuth();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [obscure, setObscure] = useState(true);
  const [obscureConfirmPassword, setObscureConfirmPassword] = useState(true);
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    const trimmedName = name.trim();
    const normalizedEmail = email.trim().toLowerCase();

    if (!trimmedName || !normalizedEmail || !password.trim() || !confirmPassword.trim()) {
      Alert.alert('Thiếu thông tin', 'Vui lòng điền đầy đủ các trường.');
      return;
    }

    if (trimmedName.length < MIN_NAME_LENGTH || trimmedName.length > MAX_NAME_LENGTH) {
      Alert.alert(
        'Họ tên không hợp lệ',
        `Họ và tên phải có từ ${MIN_NAME_LENGTH} đến ${MAX_NAME_LENGTH} ký tự.`,
      );
      return;
    }

    if (!EMAIL_PATTERN.test(normalizedEmail)) {
      Alert.alert('Email không hợp lệ', 'Vui lòng nhập đúng định dạng email.');
      return;
    }

    if (password.length < MIN_PASSWORD_LENGTH) {
      Alert.alert(
        'Mật khẩu không hợp lệ',
        `Mật khẩu phải có ít nhất ${MIN_PASSWORD_LENGTH} ký tự.`,
      );
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Mật khẩu không khớp', 'Mật khẩu xác nhận không trùng với mật khẩu đã nhập.');
      return;
    }
    
    setLoading(true);
    try {
      await register(trimmedName, normalizedEmail, password, 'SPECTATOR');
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
                maxLength={MAX_NAME_LENGTH}
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

            {/* Confirm Password */}
            <Text className="text-xs font-semibold text-slate-700 mb-2 uppercase tracking-wider">Xác nhận mật khẩu</Text>
            <View className="flex-row items-center bg-slate-50 border border-slate-200 rounded-xl px-3 py-1 mb-6 h-12">
              <Lock size={18} color="#94a3b8" />
              <TextInput
                className="flex-1 ml-3 text-slate-800"
                placeholder="••••••••"
                placeholderTextColor="#cbd5e1"
                secureTextEntry={obscureConfirmPassword}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
              />
              <TouchableOpacity onPress={() => setObscureConfirmPassword(!obscureConfirmPassword)}>
                {obscureConfirmPassword ? <EyeOff size={18} color="#94a3b8" /> : <Eye size={18} color="#94a3b8" />}
              </TouchableOpacity>
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
