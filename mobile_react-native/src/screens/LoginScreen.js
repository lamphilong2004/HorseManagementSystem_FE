import React, { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

import { ApiException } from "../core/apiClient";
import { Role } from "../core/models";
import { AppBackground, AppButton, GlassCard, Icon, TextField, showAppAlert } from "../ui/components";
import { useAuth } from "../context/AuthContext";
import { useThemeMode } from "../context/ThemeContext";

export default function LoginScreen({ navigation }) {
  const auth = useAuth();
  const { colors, text } = useThemeMode();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [obscure, setObscure] = useState(true);

  async function handleLogin() {
    if (!email.trim() || !password.trim()) {
      showAppAlert("Thiếu thông tin", "Vui lòng nhập đầy đủ email và mật khẩu.", true);
      return;
    }
    setLoading(true);
    try {
      await auth.login({ email: email.trim(), password: password.trim(), role: Role.spectator });
    } catch (error) {
      const message = error instanceof ApiException ? error.message : "Đăng nhập thất bại";
      showAppAlert("Đăng Nhập Thất Bại", message, true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppBackground>
      <ScrollView contentContainerStyle={styles.container}>
        <Pressable onPress={() => navigation.navigate("Welcome")} style={styles.backRow}>
          <View style={[styles.backButton, { backgroundColor: colors.surface2, borderColor: colors.border }]}>
            <Icon name="arrow-back-ios-new" size={16} color={colors.muted} />
          </View>
          <Text style={[text.bodyMuted, { fontWeight: "600" }]}>Quay lại trang chủ</Text>
        </Pressable>

        <View style={styles.brandWrap}>
          <LinearGradient colors={[colors.primary, colors.primaryDark]} style={styles.logo}>
            <Icon name="emoji-events" color="#fff" size={32} />
          </LinearGradient>
          <Text style={[styles.brand, { color: colors.text }]}>ERMS</Text>
          <Text style={[text.bodyMuted, { fontWeight: "600" }]}>Hệ thống Quản lý Giải đấu</Text>
        </View>

        <GlassCard contentStyle={{ padding: 24 }}>
          <Text style={text.h2}>Đăng Nhập</Text>
          <Text style={[text.bodyMuted, { marginTop: 6, marginBottom: 24 }]}>Vui lòng nhập thông tin tài khoản để tiếp tục.</Text>
          <TextField label="Địa chỉ Email" value={email} onChangeText={setEmail} placeholder="you@example.com" keyboardType="email-address" leftIcon="email" />
          <View style={{ height: 18 }} />
          <TextField
            label="Mật khẩu"
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            secureTextEntry={obscure}
            leftIcon="lock-outline"
            rightIcon={obscure ? "visibility" : "visibility-off"}
            onRightIconPress={() => setObscure((current) => !current)}
          />
          <AppButton label="Đăng nhập" icon="login" loading={loading} onPress={handleLogin} style={{ marginTop: 28 }} />
        </GlassCard>

        <View style={styles.registerRow}>
          <Text style={text.bodyMuted}>Chưa có tài khoản? </Text>
          <Pressable onPress={() => navigation.navigate("Register")}>
            <Text style={{ color: colors.primary, fontWeight: "700", fontSize: 14 }}>Đăng ký ngay</Text>
          </Pressable>
        </View>
      </ScrollView>
    </AppBackground>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, paddingTop: 56, paddingBottom: 32 },
  backRow: { flexDirection: "row", alignItems: "center", marginBottom: 24 },
  backButton: { width: 34, height: 34, borderRadius: 12, borderWidth: 1, alignItems: "center", justifyContent: "center", marginRight: 12 },
  brandWrap: { alignItems: "center", marginBottom: 36 },
  logo: { width: 64, height: 64, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  brand: { fontSize: 26, fontWeight: "900", marginTop: 16, marginBottom: 6 },
  registerRow: { flexDirection: "row", justifyContent: "center", marginTop: 24 }
});
