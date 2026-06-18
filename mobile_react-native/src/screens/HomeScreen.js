import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ApiException } from "../core/apiClient";
import { formatNumber, formatWallet, translateStatus } from "../core/formatters";
import { Role } from "../core/models";
import { useAuth } from "../context/AuthContext";
import { useThemeMode } from "../context/ThemeContext";
import { useWallet } from "../context/WalletContext";
import {
  AdminSchedulingScreen,
  AdminUsersScreen,
  HorsesScreen,
  InvitesScreen,
  JockeyScheduleScreen,
  NotificationsScreen,
  PredictionsScreen,
  RaceResultsScreen,
  RacesScreen,
  RefereeRacesScreen
} from "./FeatureScreens";
import { AppBackground, AppBottomSheet, AppButton, GlassCard, Icon, LoadingShimmer, OptionPicker, RaceImageCard, TextField, horseImage, showAppAlert } from "../ui/components";

const navByRole = {
  [Role.spectator]: [
    { key: "HomeDashboard", label: "Trang chủ", icon: "home" },
    { key: "Predictions", label: "Dự đoán", icon: "analytics" },
    { key: "RaceResults", label: "Kết quả", icon: "leaderboard" },
    { key: "Notifications", label: "Thông báo", icon: "notifications" }
  ],
  [Role.owner]: [
    { key: "HomeDashboard", label: "Trang chủ", icon: "home" },
    { key: "Races", label: "Vòng đua", icon: "flag" },
    { key: "Horses", label: "Ngựa đua", icon: "pets" }
  ],
  [Role.jockey]: [
    { key: "HomeDashboard", label: "Trang chủ", icon: "home" },
    { key: "JockeySchedule", label: "Lịch trình", icon: "calendar-month" },
    { key: "Invites", label: "Lời mời", icon: "mail" }
  ],
  [Role.referee]: [
    { key: "HomeDashboard", label: "Trang chủ", icon: "home" },
    { key: "Races", label: "Vòng đua", icon: "flag" },
    { key: "RefereeRaces", label: "Trận của tôi", icon: "gavel" }
  ],
  [Role.admin]: [
    { key: "HomeDashboard", label: "Trang chủ", icon: "home" },
    { key: "Races", label: "Vòng đua", icon: "flag" },
    { key: "AdminUsers", label: "Thành viên", icon: "people" }
  ]
};

export default function HomeScreen({ navigation }) {
  const auth = useAuth();
  const wallet = useWallet();
  const { colors, text, isDark, toggleTheme } = useThemeMode();
  const insets = useSafeAreaInsets();
  const user = auth.session?.user;
  const navItems = navByRole[user?.role] || navByRole[Role.spectator];
  const [selectedIndex, setSelectedIndex] = useState(0);
  const selectedKey = navItems[selectedIndex]?.key || "HomeDashboard";

  if (!user) {
    return (
      <AppBackground>
        <View style={styles.center}><LoadingShimmer height={80} /></View>
      </AppBackground>
    );
  }

  const child = selectedKey === "HomeDashboard" ? (
    <HomeDashboard auth={auth} wallet={wallet} user={user} />
  ) : (
    <ChildScreen screen={selectedKey} api={auth.apiService} wallet={wallet} navigation={navigation} />
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      {selectedKey === "HomeDashboard" ? (
        <AppBackground>
          <View style={{ flex: 1, paddingTop: insets.top }}>
            <View style={[styles.topBar, { borderBottomColor: colors.border, backgroundColor: isDark ? "rgba(4,16,12,0.6)" : "rgba(255,255,255,0.7)" }]}>
              <View style={styles.brandRow}>
                <LinearGradient colors={[colors.primary, colors.primaryDark]} style={styles.brandMark}>
                  <Icon name="emoji-events" color="#fff" size={16} />
                </LinearGradient>
                <Text style={[styles.brandText, { color: colors.text }]}>ERMS</Text>
              </View>
              <Pressable onPress={toggleTheme} style={styles.headerIcon}>
                <Icon name={isDark ? "light-mode" : "dark-mode"} color={colors.text2} size={22} />
              </Pressable>
              <Pressable onPress={auth.logout} style={styles.headerIcon}>
                <Icon name="logout" color={colors.text2} size={22} />
              </Pressable>
            </View>
            <View style={{ flex: 1 }}>{child}</View>
          </View>
        </AppBackground>
      ) : (
        <View style={{ flex: 1 }}>{child}</View>
      )}
      <BottomNav items={navItems} selectedIndex={selectedIndex} onSelect={setSelectedIndex} />
    </View>
  );
}

function ChildScreen({ screen, api, wallet, navigation }) {
  switch (screen) {
    case "Races":
      return <RacesScreen api={api} />;
    case "Predictions":
      return <PredictionsScreen api={api} />;
    case "RaceResults":
      return <RaceResultsScreen api={api} />;
    case "Notifications":
      return <NotificationsScreen api={api} />;
    case "Horses":
      return <HorsesScreen api={api} />;
    case "Invites":
      return <InvitesScreen api={api} />;
    case "JockeySchedule":
      return <JockeyScheduleScreen api={api} />;
    case "RefereeRaces":
      return <RefereeRacesScreen api={api} navigation={navigation} />;
    case "AdminUsers":
      return <AdminUsersScreen api={api} />;
    case "AdminScheduling":
      return <AdminSchedulingScreen api={api} />;
    default:
      return <RacesScreen api={api} wallet={wallet} />;
  }
}

function HomeDashboard({ auth, wallet, user }) {
  const { colors, text } = useThemeMode();
  const [query, setQuery] = useState("");
  const [tournaments, setTournaments] = useState(null);
  const [races, setRaces] = useState(null);
  const [quickRace, setQuickRace] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      const [nextTournaments, nextRaces] = await Promise.all([auth.apiService.getTournaments(), auth.apiService.getRaces()]);
      setTournaments(nextTournaments);
      setRaces(nextRaces);
    } catch (_error) {
      setTournaments([]);
      setRaces([]);
    }
  }, [auth.apiService]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (user.role !== Role.spectator) return;
    let alive = true;
    auth.apiService
      .getPredictions()
      .then(async (predictions) => {
        if (!alive) return;
        const settled = await wallet.getSettledPredictionIds();
        for (const prediction of predictions) {
          if (String(prediction.status).toUpperCase() === "WON" && !settled.includes(prediction.id)) {
            const bet = Number(prediction.betAmount || 0);
            if (bet > 0) {
              await wallet.addBalance(Math.trunc(bet * 1.8));
              await wallet.markPredictionAsSettled(prediction.id);
            }
          }
        }
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [auth.apiService, user.role, wallet]);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return (tournaments || []).filter((tournament) => {
      const matchTournament = tournament.name.toLowerCase().includes(q) || tournament.location.toLowerCase().includes(q);
      const matchRace = (races || []).some((race) => race.tournamentId === tournament.id && race.name.toLowerCase().includes(q));
      return matchTournament || matchRace;
    });
  }, [query, races, tournaments]);

  return (
    <View style={{ flex: 1 }}>
      {user.role === Role.spectator ? (
        <LinearGradient colors={[colors.primary, colors.primaryDark]} style={styles.walletCard}>
          <View>
            <Text style={styles.walletLabel}>SỐ DƯ ĐIỂM ẢO</Text>
            <Text style={styles.walletValue}>{formatWallet(wallet.balance)}</Text>
          </View>
          <View style={styles.walletIcon}><Icon name="account-balance-wallet" color="#fff" size={28} /></View>
        </LinearGradient>
      ) : null}

      <View style={[styles.searchBox, { backgroundColor: colors.surface2, borderColor: colors.border }]}>
        <Icon name="search" size={22} color={colors.muted} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search races, tracks, or tournaments..."
          placeholderTextColor={colors.muted}
          style={[text.body, { flex: 1, marginLeft: 10 }]}
        />
        {query ? (
          <Pressable onPress={() => setQuery("")}>
            <Icon name="clear" size={18} color={colors.muted} />
          </Pressable>
        ) : null}
      </View>

      {tournaments === null || races === null ? (
        <ScrollView contentContainerStyle={{ padding: 20 }}>
          <LoadingShimmer height={120} style={{ marginBottom: 16 }} />
          <LoadingShimmer height={120} style={{ marginBottom: 16 }} />
          <LoadingShimmer height={120} />
        </ScrollView>
      ) : filtered.length === 0 ? (
        <View style={styles.center}>
          <Icon name="search-off" size={44} color={colors.muted} />
          <Text style={[text.h3, { marginTop: 12 }]}>Không tìm thấy giải đấu</Text>
          <Text style={[text.bodyMuted, { textAlign: "center", marginTop: 6 }]}>Thử tìm kiếm bằng từ khóa khác hoặc kéo để tải lại.</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 24 }}>
          {filtered.map((tournament) => {
            const tournamentRaces = (races || []).filter((race) => {
              const q = query.toLowerCase();
              return race.tournamentId === tournament.id && (!q || race.name.toLowerCase().includes(q) || tournament.name.toLowerCase().includes(q));
            });
            return (
              <View key={tournament.id} style={{ marginBottom: 32 }}>
                <View style={styles.tournamentHeader}>
                  <View style={{ flex: 1 }}>
                    <Text numberOfLines={1} style={[text.h2, { fontSize: 20 }]}>{tournament.name}</Text>
                    <View style={styles.metaRow}>
                      <Icon name="location-on" size={16} color={colors.muted} />
                      <Text numberOfLines={1} style={[text.caption, { marginLeft: 4, letterSpacing: 1.2, fontWeight: "700", flex: 1 }]}>{tournament.location}</Text>
                    </View>
                  </View>
                  <Text style={[text.caption, { color: colors.accent, fontWeight: "900" }]}>VIEW ALL</Text>
                </View>
                {tournamentRaces.length === 0 ? (
                  <Text style={[text.bodyMuted, { marginTop: 12 }]}>Không có trận đấu nào.</Text>
                ) : (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingTop: 16 }}>
                    {tournamentRaces.map((race) => <RaceCard key={race.id} race={race} onPredict={() => setQuickRace(race)} />)}
                  </ScrollView>
                )}
              </View>
            );
          })}
        </ScrollView>
      )}
      <QuickPredictionSheet race={quickRace} api={auth.apiService} wallet={wallet} onClose={() => setQuickRace(null)} />
    </View>
  );
}

function RaceCard({ race, onPredict }) {
  const { colors, text } = useThemeMode();
  const predictable = ["open", "active", "scheduled"].includes(String(race.status).toLowerCase());
  return (
    <GlassCard style={styles.raceCard} contentStyle={{ padding: 0 }}>
      <RaceImageCard image={horseImage}>
        <View style={[styles.statusPill, { backgroundColor: predictable ? "rgba(0,255,127,0.2)" : "rgba(0,0,0,0.45)" }]}>
          {predictable ? <View style={styles.liveDot} /> : null}
          <Text style={{ color: predictable ? "#7CFFB2" : "#fff", fontSize: 10, fontWeight: "900", letterSpacing: 1.2 }}>
            {translateStatus(race.status).toUpperCase()}
          </Text>
        </View>
      </RaceImageCard>
      <View style={{ padding: 16 }}>
        <Text numberOfLines={1} style={[text.h3, { fontSize: 18 }]}>{race.name}</Text>
        <Text style={[text.bodyMuted, { fontSize: 13, marginTop: 4 }]}>Distance: 1200m • 12 Contenders</Text>
        {predictable ? <AppButton label="DỰ ĐOÁN" onPress={onPredict} style={{ marginTop: 16 }} textStyle={{ letterSpacing: 1.2 }} /> : null}
      </View>
    </GlassCard>
  );
}

function QuickPredictionSheet({ race, api, wallet, onClose }) {
  const { colors, text } = useThemeMode();
  const [horses, setHorses] = useState([]);
  const [selectedHorseId, setSelectedHorseId] = useState(null);
  const [bet, setBet] = useState("");
  const [loadingHorses, setLoadingHorses] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let alive = true;
    setSelectedHorseId(null);
    setBet("");
    if (!race) return () => {};
    setLoadingHorses(true);
    api
      .getRaceHorses(race.id)
      .then((data) => {
        if (alive) setHorses(data);
      })
      .catch(() => {
        if (alive) setHorses([]);
      })
      .finally(() => {
        if (alive) setLoadingHorses(false);
      });
    return () => {
      alive = false;
    };
  }, [api, race]);

  async function submit() {
    const amount = Number.parseInt(bet, 10) || 0;
    if (!bet) {
      showAppAlert("Thiếu thông tin", "Vui lòng nhập số tiền cược.", true);
      return;
    }
    if (amount < 100000 || amount > 10000000) {
      showAppAlert("Sai hạn mức", "Tiền cược phải nằm trong khoảng từ 100k đến 10M.", true);
      return;
    }
    if (amount > wallet.balance) {
      showAppAlert("Số dư không đủ", `Bạn chỉ còn ${formatWallet(wallet.balance)} trong ví.`, true);
      return;
    }
    setSubmitting(true);
    try {
      await api.placePrediction({ raceId: race.id, horseId: selectedHorseId, betAmount: amount });
      await wallet.deductBalance(amount);
      onClose();
      showAppAlert("Thành công 🎉", "Dự đoán của bạn đã được đặt.");
    } catch (error) {
      const message = error instanceof ApiException ? error.message : "Không thể đặt dự đoán";
      showAppAlert("Thất bại", message, true);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AppBottomSheet visible={Boolean(race)} title="Dự đoán kết quả" subtitle={race?.name} onClose={onClose} showHandle>
      {loadingHorses ? (
        <LoadingShimmer height={80} />
      ) : horses.length === 0 ? (
        <Text style={[text.body, { textAlign: "center", paddingVertical: 16 }]}>Không có ngựa đua nào tham gia trận này.</Text>
      ) : (
        <>
          <OptionPicker label="CHỌN NGỰA" value={selectedHorseId} placeholder="Chọn một chiến mã" options={horses.map((h) => ({ value: h.id, label: h.name }))} onChange={setSelectedHorseId} />
          <View style={{ height: 16 }} />
          <TextField label="MỨC CƯỢC (CREDITS)" value={bet} onChangeText={setBet} placeholder="500000" keyboardType="number-pad" leftIcon="attach-money" />
          <View style={[styles.row, { gap: 16, marginTop: 32 }]}>
            <AppButton label="CANCEL" variant="ghost" onPress={onClose} style={{ flex: 1 }} textStyle={{ color: colors.muted, letterSpacing: 1.2 }} />
            <AppButton label="SUBMIT PREDICTION" loading={submitting} onPress={selectedHorseId ? submit : null} style={{ flex: 2 }} textStyle={{ letterSpacing: 1.2 }} />
          </View>
        </>
      )}
    </AppBottomSheet>
  );
}

function BottomNav({ items, selectedIndex, onSelect }) {
  const { colors } = useThemeMode();
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.bottomNav, { paddingBottom: Math.max(insets.bottom, 8), backgroundColor: colors.bg, borderTopColor: colors.border }]}>
      {items.map((item, index) => {
        const active = selectedIndex === index;
        return (
          <Pressable key={item.key} onPress={() => onSelect(index)} style={styles.navItem}>
            <Icon name={item.icon} size={22} color={active ? colors.primary : colors.muted} />
            <Text numberOfLines={1} style={{ color: active ? colors.primary : colors.muted, fontSize: 11, fontWeight: active ? "800" : "600", marginTop: 3 }}>
              {item.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  topBar: { minHeight: 56, borderBottomWidth: 1, paddingHorizontal: 16, flexDirection: "row", alignItems: "center" },
  brandRow: { flex: 1, flexDirection: "row", alignItems: "center" },
  brandMark: { width: 32, height: 32, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  brandText: { fontSize: 17, fontWeight: "900", marginLeft: 10 },
  headerIcon: { padding: 8, marginLeft: 4 },
  walletCard: { marginHorizontal: 20, marginTop: 16, borderRadius: 16, padding: 16, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  walletLabel: { color: "rgba(255,255,255,0.8)", fontSize: 12, fontWeight: "900", letterSpacing: 1.2 },
  walletValue: { color: "#fff", fontSize: 24, fontWeight: "900", marginTop: 4 },
  walletIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center" },
  searchBox: { marginHorizontal: 20, marginVertical: 16, borderRadius: 12, borderWidth: 1, minHeight: 52, paddingHorizontal: 14, flexDirection: "row", alignItems: "center" },
  tournamentHeader: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between" },
  metaRow: { flexDirection: "row", alignItems: "center", marginTop: 4 },
  raceCard: { width: 280, marginRight: 16 },
  statusPill: { position: "absolute", top: 12, right: 12, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, flexDirection: "row", alignItems: "center" },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#7CFFB2", marginRight: 6 },
  bottomNav: { borderTopWidth: 1, paddingTop: 8, flexDirection: "row" },
  navItem: { flex: 1, alignItems: "center", justifyContent: "center", minHeight: 52 },
  row: { flexDirection: "row", alignItems: "center" }
});
