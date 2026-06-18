import React, { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { ApiException } from "../core/apiClient";
import { Role } from "../core/models";
import { AppBackground, AppButton, GlassCard, Icon, TextField, showAppAlert } from "../ui/components";
import { useAuth } from "../context/AuthContext";
import { useThemeMode } from "../context/ThemeContext";

export default function RegisterScreen({ navigation }) {
  const auth = useAuth();
  const { colors, text } = useThemeMode();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [obscure, setObscure] = useState(true);

  async function handleRegister() {
    setLoading(true);
    try {
      await auth.register({ name, email, password, role: Role.spectator });
    } catch (error) {
      const message = error instanceof ApiException ? error.message : "Tạo tài khoản thất bại";
      showAppAlert("Đăng Ký Thất Bại", message, true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppBackground>
      <ScrollView contentContainerStyle={styles.container}>
        <Pressable onPress={() => navigation.navigate("Login")} style={styles.backRow}>
          <View style={[styles.backButton, { backgroundColor: colors.surface2, borderColor: colors.border }]}>
            <Icon name="arrow-back-ios-new" size={16} color={colors.muted} />
          </View>
          <Text style={text.bodyMuted}>Quay lại Đăng nhập</Text>
        </Pressable>

        <Text style={text.h1}>Tạo tài khoản</Text>
        <Text style={[text.bodyMuted, { marginTop: 6, marginBottom: 28 }]}>Tham gia nền tảng Giải đua ngựa.</Text>

        <GlassCard contentStyle={{ padding: 24 }}>
          <TextField label="Họ và tên" value={name} onChangeText={setName} placeholder="Nguyen Van A" leftIcon="person-outline" />
          <View style={{ height: 16 }} />
          <TextField label="Email" value={email} onChangeText={setEmail} placeholder="you@example.com" keyboardType="email-address" leftIcon="email" />
          <View style={{ height: 16 }} />
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
          <AppButton label="Tạo tài khoản" icon="person-add" loading={loading} onPress={handleRegister} style={{ marginTop: 24 }} />
        </GlassCard>
      </ScrollView>
    </AppBackground>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, paddingTop: 56, paddingBottom: 32 },
  backRow: { flexDirection: "row", alignItems: "center", marginBottom: 32 },
  backButton: { width: 34, height: 34, borderRadius: 12, borderWidth: 1, alignItems: "center", justifyContent: "center", marginRight: 12 }
});
