import React from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

import { AppBackground, AppButton, GlassCard, Icon } from "../ui/components";
import { useThemeMode } from "../context/ThemeContext";

const heroImage = "https://lh3.googleusercontent.com/aida-public/AB6AXuBm_LN5oeZeYaR3sYCdiQp6wzE_iWsWveVll_Ty41EfiWwU-zloTjxlOrDuWhh8UcZq5RUBXDfQrzdK6z0hCt8XMLs9vxLE651q0OW2AjqnW9slOprPaxlJ1W2sA-Vo3lA8AfgS816nNMQxr9kuDMewIOpEk2tRlfXJss2ULlLp-fh_jjhhw-Y2fquvCd7biikftJIBaqQqYLhuJgBDQBkr6XhHUPPdZ38n2ovi-7eQu9xXNgEiYxKKaSIoPiW0L3DHdB1SVS9Pnddm";

const featured = [
  {
    title: "Cúp Quốc gia Grand National",
    desc: "Giải đấu quy mô lớn nhất năm với sự góp mặt của các chiến mã huyền thoại.",
    status: "Sắp diễn ra",
    date: "25/12/2024",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuC_-LGsB-NXPY1FIQ9-AbkVAt0zjgOABU7YKQ3ba_wNEuLWH8uT1grak3vUg1zP_bPSt1phKpPf1-c56j6uyW3rMrrNnI07jgQiIZDcH9JqZ_fu9GnjqN5iCZHHGoY1vtQLG6mgelbIjW5tGR5TZScEO7IBBd0UrzNrlFL0HfmUzGr1Eow0MTKTrvS280R8xk7kqHXUJon_UGFBIXvcOVS0tq4I-X6EaM9kzWl0eEK57MZ3Ssf8IzVenxJyTyLIBI0O3M_P18EqyCa1"
  },
  {
    title: "Giải đua Glacier Sprint",
    desc: "Tốc độ là tất cả. Những vòng chạy kịch tính trên mặt sân cỏ tiêu chuẩn.",
    status: "Trực tiếp",
    date: "Đang diễn ra",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuC1SbKBCegDjoAWAIpTG4fa2rNVldov6CYPM5etTwDVtMu5AQcdWaGqwvO1j7d-GD2lo_reMvtY7gTV3CGhYNxmnng_7PTHOROqMoQgHCU8EjXzO06jpfV3Qoom6RRJp9DVgNI8141aOuRAgOZmW7LfZ_el_f9-5VZj0QyhrYOdE7tLgdCEswrWsjvx_qtoXvSW5JtMmI_Zpw9-qxLP217biu7Ws3AAZ6KXcYPMAgK9w1JD40pb0rvDwg-AfLCnWrzInBw6h7NOdxkw"
  }
];

export default function WelcomeScreen({ navigation }) {
  const { colors, text, isDark, toggleTheme } = useThemeMode();

  return (
    <AppBackground>
      <ScrollView contentContainerStyle={{ paddingBottom: 48 }} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <BrandMark />
          <Text style={[styles.brand, { color: colors.text }]}>ERMS</Text>
          <View style={{ flex: 1 }} />
          <Pressable onPress={toggleTheme} style={[styles.iconButton, { backgroundColor: colors.surface2, borderColor: colors.border }]}>
            <Icon name={isDark ? "light-mode" : "dark-mode"} size={20} color={colors.text2} />
          </Pressable>
          <Pressable onPress={() => navigation.navigate("Login")} style={[styles.loginButton, { borderColor: colors.border }]}>
            <Text style={{ color: colors.text2, fontWeight: "700", fontSize: 12 }}>Đăng nhập</Text>
          </Pressable>
        </View>

        <View style={styles.hero}>
          <Image source={{ uri: heroImage }} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
          <LinearGradient colors={["rgba(0,0,0,0.2)", "rgba(0,0,0,0.75)"]} style={StyleSheet.absoluteFillObject} />
          <View style={styles.heroContent}>
            <View style={[styles.heroPill, { backgroundColor: "rgba(16,185,129,0.3)", borderColor: "rgba(16,185,129,0.5)" }]}>
              <Text style={styles.heroPillText}>NỀN TẢNG ERMS</Text>
            </View>
            <Text style={styles.heroTitle}>Nâng Tầm Đẳng Cấp{"\n"}Đua Ngựa</Text>
            <Text style={styles.heroSubtitle}>Hệ thống quản lý chuyên nghiệp, minh bạch và hiện đại hàng đầu dành cho các giải đua ngựa quốc tế.</Text>
            <AppButton label="Khám Phá Ngay" icon="explore" onPress={() => navigation.navigate("Register")} style={{ marginTop: 20 }} />
          </View>
        </View>

        <View style={styles.content}>
          <View style={styles.statsRow}>
            <Stat icon="sports-score" value="128+" label="Giải đua tổ chức" color={colors.primary} />
            <Stat icon="pets" value="500+" label="Chiến mã tinh anh" color={colors.purple} />
            <Stat icon="military-tech" value="10+" label="Giải đấu lớn" color={colors.accent} />
          </View>

          <Text style={[text.h2, { marginTop: 40, marginBottom: 16 }]}>Tính Năng Ưu Việt</Text>
          {[
            ["verified-user", "Quản lý chuyên nghiệp", "Quy trình vận hành chuẩn quốc tế, bảo mật tuyệt đối.", colors.primary],
            ["speed", "Kết quả trực tiếp", "Cập nhật kết quả tức thì với độ trễ gần như bằng không.", colors.info],
            ["app-registration", "Đăng ký dễ dàng", "Đăng ký tham gia dễ dàng qua nền tảng trực tuyến.", colors.purple]
          ].map(([icon, title, desc, color]) => (
            <GlassCard key={title} style={{ marginBottom: 12 }} contentStyle={{ padding: 16 }}>
              <View style={styles.featureRow}>
                <View style={[styles.featureIcon, { backgroundColor: `${color}26` }]}>
                  <Icon name={icon} size={20} color={color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[text.h3, { fontSize: 14 }]}>{title}</Text>
                  <Text style={[text.bodyMuted, { fontSize: 12, marginTop: 4 }]}>{desc}</Text>
                </View>
              </View>
            </GlassCard>
          ))}

          <Text style={[text.h2, { marginTop: 28, marginBottom: 16 }]}>Giải Đua Nổi Bật</Text>
          {featured.map((race, index) => (
            <View key={race.title} style={[styles.featuredCard, { backgroundColor: colors.surface2 }]}>
              <View style={styles.featuredImage}>
                <Image source={{ uri: race.image }} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
                <View style={[styles.featuredBadge, { backgroundColor: index === 0 ? colors.primary : colors.purple }]}>
                  <Text style={styles.featuredBadgeText}>{race.status}</Text>
                </View>
              </View>
              <View style={{ padding: 16 }}>
                <Text style={text.h3}>{race.title}</Text>
                <Text style={[text.bodyMuted, { fontSize: 12, marginTop: 6 }]}>{race.desc}</Text>
                <View style={[styles.divider, { backgroundColor: colors.border }]} />
                <View style={styles.featuredFooter}>
                  <Text style={{ color: index === 0 ? colors.primary : colors.purple, fontWeight: "800", fontSize: 12 }}>{race.date}</Text>
                  <Pressable onPress={() => navigation.navigate("Login")} style={styles.detailLink}>
                    <Text style={{ color: colors.text, fontWeight: "700", fontSize: 12 }}>Chi tiết</Text>
                    <Icon name="arrow-forward" size={14} color={colors.text} />
                  </Pressable>
                </View>
              </View>
            </View>
          ))}

          <GlassCard style={{ marginTop: 24 }} contentStyle={{ padding: 24 }}>
            <Text style={[text.h2, { fontSize: 18, textAlign: "center" }]}>Sẵn Sàng Nâng Tầm Hệ Thống Của Bạn?</Text>
            <Text style={[text.bodyMuted, { fontSize: 12, textAlign: "center", marginTop: 8 }]}>Gia nhập cộng đồng quản trị viên chuyên nghiệp và trải nghiệm công nghệ hàng đầu thế giới ngay hôm nay.</Text>
            <AppButton label="Bắt Đầu Miễn Phí" icon="rocket-launch" onPress={() => navigation.navigate("Register")} style={{ marginTop: 20 }} />
          </GlassCard>
        </View>
      </ScrollView>
    </AppBackground>
  );
}

function BrandMark() {
  const { colors } = useThemeMode();
  return (
    <LinearGradient colors={[colors.primary, colors.primaryDark]} style={styles.brandMark}>
      <Icon name="emoji-events" size={16} color="#fff" />
    </LinearGradient>
  );
}

function Stat({ icon, value, label, color }) {
  const { text } = useThemeMode();
  return (
    <GlassCard style={{ flex: 1 }} contentStyle={{ paddingVertical: 16, paddingHorizontal: 8, alignItems: "center" }}>
      <Icon name={icon} size={22} color={color} />
      <Text style={[text.h2, { fontSize: 18, marginTop: 8 }]}>{value}</Text>
      <Text style={[text.captionUpper, { fontSize: 8, textAlign: "center", marginTop: 2 }]}>{label}</Text>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingVertical: 16, paddingTop: 48 },
  brandMark: { width: 32, height: 32, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  brand: { marginLeft: 10, fontSize: 16, fontWeight: "900" },
  iconButton: { width: 38, height: 38, borderRadius: 12, borderWidth: 1, alignItems: "center", justifyContent: "center", marginRight: 8 },
  loginButton: { borderWidth: 1, borderRadius: 6, paddingHorizontal: 14, paddingVertical: 9 },
  hero: { height: 380, marginHorizontal: 20, marginVertical: 8, borderRadius: 20, overflow: "hidden", backgroundColor: "#064E3B" },
  heroContent: { flex: 1, justifyContent: "flex-end", padding: 24 },
  heroPill: { alignSelf: "flex-start", borderRadius: 999, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 4 },
  heroPillText: { color: "#fff", fontSize: 11, fontWeight: "800", letterSpacing: 0.8 },
  heroTitle: { color: "#fff", fontSize: 26, lineHeight: 32, fontWeight: "900", marginTop: 12 },
  heroSubtitle: { color: "rgba(255,255,255,0.75)", fontSize: 13, lineHeight: 19, marginTop: 10 },
  content: { paddingHorizontal: 20 },
  statsRow: { flexDirection: "row", gap: 10, marginTop: 32 },
  featureRow: { flexDirection: "row", alignItems: "flex-start" },
  featureIcon: { width: 40, height: 40, borderRadius: 8, alignItems: "center", justifyContent: "center", marginRight: 14 },
  featuredCard: { borderRadius: 20, overflow: "hidden", marginBottom: 16 },
  featuredImage: { height: 140 },
  featuredBadge: { position: "absolute", top: 12, right: 12, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  featuredBadgeText: { color: "#fff", fontSize: 10, fontWeight: "900" },
  divider: { height: 1, marginTop: 12, marginBottom: 10 },
  featuredFooter: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  detailLink: { flexDirection: "row", alignItems: "center", gap: 4 }
});
