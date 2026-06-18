import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  FlatList,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { formatDateTime, translateStatus } from "../core/formatters";
import { roleGradients } from "./theme";
import { useThemeMode } from "../context/ThemeContext";

export const horseImage = "https://images.unsplash.com/photo-1598974357801-cbca100e65d3?auto=format&fit=crop&q=80&w=800";

const alertListeners = new Set();

function emitAlert(request) {
  alertListeners.forEach((listener) => listener(request));
}

export function AppBackground({ children }) {
  const { isDark } = useThemeMode();
  return (
    <LinearGradient colors={isDark ? ["#04100C", "#060E18"] : ["#ECFDF5", "#EFF6FF"]} style={styles.fill}>
      <View pointerEvents="none" style={[styles.glow, styles.glowTop, { backgroundColor: isDark ? "rgba(14,165,233,0.08)" : "rgba(245,158,11,0.13)" }]} />
      <View pointerEvents="none" style={[styles.glow, styles.glowBottom, { backgroundColor: isDark ? "rgba(16,185,129,0.08)" : "rgba(16,185,129,0.15)" }]} />
      {children}
    </LinearGradient>
  );
}

export function GlassCard({ children, style, contentStyle, accentColor }) {
  const { colors, isDark } = useThemeMode();
  return (
    <View style={[styles.cardShadow, style]}>
      <BlurView intensity={isDark ? 22 : 16} tint={isDark ? "dark" : "light"} style={[styles.glassClip, { borderColor: colors.border }]}>
        <LinearGradient colors={[colors.cardStart, colors.cardEnd]} style={styles.glassInner}>
          {accentColor ? <View style={{ height: 3, backgroundColor: accentColor }} /> : null}
          <View style={[styles.cardContent, contentStyle]}>{children}</View>
        </LinearGradient>
      </BlurView>
    </View>
  );
}

export function StatusBadge({ label, status }) {
  const { colors, isDark } = useThemeMode();
  const variant = badgeVariant(status || label);
  const config = {
    pending: [colors.warningLight, isDark ? "#FBBF24" : "#B45309", "rgba(245,158,11,0.3)"],
    active: [colors.successLight, isDark ? "#34D399" : "#047857", "rgba(16,185,129,0.3)"],
    completed: [colors.successLight, isDark ? "#34D399" : "#047857", "rgba(16,185,129,0.3)"],
    approved: [colors.successLight, isDark ? "#34D399" : "#047857", "rgba(16,185,129,0.3)"],
    confirmed: [colors.successLight, isDark ? "#34D399" : "#047857", "rgba(16,185,129,0.3)"],
    rejected: [colors.dangerLight, isDark ? "#F87171" : "#B91C1C", "rgba(239,68,68,0.3)"],
    inactive: [colors.dangerLight, isDark ? "#F87171" : "#B91C1C", "rgba(239,68,68,0.3)"],
    cancelled: [colors.dangerLight, isDark ? "#F87171" : "#B91C1C", "rgba(239,68,68,0.3)"],
    scheduled: [colors.infoLight, isDark ? "#60A5FA" : "#1D4ED8", "rgba(59,130,246,0.3)"],
    ongoing: [colors.purpleLight, isDark ? "#A78BFA" : "#6D28D9", "rgba(139,92,246,0.3)"],
    neutral: [colors.surface3, isDark ? colors.muted : colors.text2, colors.border]
  }[variant];

  return (
    <View style={[styles.badge, { backgroundColor: config[0], borderColor: config[2] }]}>
      <Text style={[styles.badgeText, { color: config[1] }]}>{String(label || "").toUpperCase()}</Text>
    </View>
  );
}

export function RoleBadge({ role }) {
  const { colors, isDark } = useThemeMode();
  const normalized = String(role || "").toUpperCase();
  const map = {
    ADMIN: [colors.purpleLight, isDark ? "#C4B5FD" : "#6D28D9", "rgba(139,92,246,0.3)", "Admin"],
    OWNER: [colors.successLight, isDark ? "#34D399" : "#047857", "rgba(16,185,129,0.3)", "Owner"],
    JOCKEY: [colors.orangeLight, isDark ? "#FB923C" : "#C2410C", "rgba(249,115,22,0.3)", "Jockey"],
    REFEREE: [colors.infoLight, isDark ? "#60A5FA" : "#1D4ED8", "rgba(59,130,246,0.3)", "Referee"],
    SPECTATOR: [colors.surface3, isDark ? colors.muted : colors.text2, colors.border, "Spectator"]
  };
  const config = map[normalized] || [colors.surface3, colors.muted, colors.border, role || "User"];
  return (
    <View style={[styles.roleBadge, { backgroundColor: config[0], borderColor: config[2] }]}>
      <Text style={[styles.roleBadgeText, { color: config[1] }]}>{String(config[3]).toUpperCase()}</Text>
    </View>
  );
}

export function UserAvatar({ name, role, size = 36 }) {
  const gradient = roleGradients[String(role || "").toUpperCase()] || roleGradients.DEFAULT;
  return (
    <LinearGradient colors={gradient} style={{ width: size, height: size, borderRadius: size / 2, alignItems: "center", justifyContent: "center" }}>
      <Text style={{ color: "#fff", fontWeight: "800", fontSize: size * 0.35 }}>{initials(name)}</Text>
    </LinearGradient>
  );
}

export function UserBadge({ name, role }) {
  const { colors } = useThemeMode();
  return (
    <View style={[styles.userBadge, { backgroundColor: colors.surface2, borderColor: colors.border }]}>
      <UserAvatar name={name} role={role} size={28} />
      <View style={{ marginLeft: 8 }}>
        <Text numberOfLines={1} style={{ color: colors.text, fontWeight: "700", fontSize: 13, maxWidth: 120 }}>{name}</Text>
        <RoleBadge role={role} />
      </View>
    </View>
  );
}

export function LoadingShimmer({ height = 80, style }) {
  const { colors } = useThemeMode();
  const opacity = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.85, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.35, duration: 700, useNativeDriver: true })
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [opacity]);

  return <Animated.View style={[{ height, borderRadius: 16, backgroundColor: colors.surface3, opacity }, style]} />;
}

export function EmptyState({ icon = "info-outline", title, subtitle }) {
  const { colors, text } = useThemeMode();
  return (
    <View style={styles.emptyState}>
      <View style={[styles.emptyIcon, { backgroundColor: colors.surface2, borderColor: colors.border }]}>
        <MaterialIcons name={icon} size={34} color={colors.muted} />
      </View>
      <Text style={[text.h3, { textAlign: "center", marginTop: 14 }]}>{title}</Text>
      {subtitle ? <Text style={[text.bodyMuted, { textAlign: "center", marginTop: 6, paddingHorizontal: 20 }]}>{subtitle}</Text> : null}
    </View>
  );
}

export function AppButton({ label, icon, onPress, loading, variant = "primary", style, textStyle, disabled }) {
  const { colors } = useThemeMode();
  const isDisabled = disabled || loading || !onPress;
  const danger = variant === "danger";
  const ghost = variant === "ghost";
  const content = (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.button,
        ghost
          ? { backgroundColor: "transparent", borderColor: colors.border, borderWidth: 1 }
          : { backgroundColor: danger ? colors.danger : colors.primaryDark },
        { opacity: isDisabled ? 0.55 : pressed ? 0.85 : 1 },
        style
      ]}
    >
      {loading ? (
        <ActivityIndicator color="#fff" size="small" />
      ) : (
        <>
          {icon ? <MaterialIcons name={icon} size={18} color={ghost ? colors.text2 : "#fff"} style={{ marginRight: 8 }} /> : null}
          <Text style={[styles.buttonText, { color: ghost ? colors.text2 : "#fff" }, textStyle]}>{label}</Text>
        </>
      )}
    </Pressable>
  );

  if (!ghost && !danger) {
    return (
      <LinearGradient colors={[colors.primary, colors.primaryDark]} style={[styles.buttonGradient, style]}>
        {content}
      </LinearGradient>
    );
  }
  return content;
}

export function ScreenScaffold({ title, children, scroll = false, contentContainerStyle, rightAction }) {
  const insets = useSafeAreaInsets();
  const { colors, text, isDark } = useThemeMode();
  const content = scroll ? (
    <ScrollView contentContainerStyle={[{ padding: 20, paddingBottom: insets.bottom + 28 }, contentContainerStyle]}>{children}</ScrollView>
  ) : (
    <View style={[styles.screenBody, contentContainerStyle]}>{children}</View>
  );

  return (
    <AppBackground>
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        <BlurView
          intensity={24}
          tint={isDark ? "dark" : "light"}
          style={[
            styles.appHeader,
            {
              borderBottomColor: colors.border,
              backgroundColor: isDark ? "rgba(4,16,12,0.6)" : "rgba(255,255,255,0.7)"
            }
          ]}
        >
          <LinearGradient colors={[colors.primary, colors.primaryDark]} style={styles.scaffoldBrandMark}>
            <MaterialIcons name="emoji-events" size={14} color="#fff" />
          </LinearGradient>
          <Text style={[text.h3, { flex: 1 }]} numberOfLines={1}>{title}</Text>
          {rightAction}
        </BlurView>
        {content}
      </View>
    </AppBackground>
  );
}

export function TextField({ label, value, onChangeText, placeholder, secureTextEntry, keyboardType, multiline, leftIcon, rightIcon, onRightIconPress }) {
  const { colors, text } = useThemeMode();
  return (
    <View>
      {label ? <Text style={[text.label, { marginBottom: 6 }]}>{label}</Text> : null}
      <View style={[styles.inputWrap, { backgroundColor: colors.surface2, borderColor: colors.border }]}>
        {leftIcon ? <MaterialIcons name={leftIcon} size={18} color={colors.muted} style={{ marginRight: 8 }} /> : null}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.muted}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          multiline={multiline}
          style={[text.body, styles.input, multiline ? { minHeight: 80, textAlignVertical: "top" } : null]}
        />
        {rightIcon ? (
          <Pressable onPress={onRightIconPress} style={styles.inputIconButton}>
            <MaterialIcons name={rightIcon} size={18} color={colors.muted} />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

export function SelectableItemRow({ title, subtitle, trailing, selected, onPress }) {
  const { colors, text, isDark } = useThemeMode();
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [{ opacity: pressed ? 0.8 : 1 }]}>
      <View style={[styles.selectableRow, { backgroundColor: selected ? colors.primaryLight : isDark ? "rgba(255,255,255,0.04)" : colors.surface2, borderColor: selected ? colors.primaryRing : colors.border }]}>
        <View style={[styles.radio, { borderColor: selected ? colors.primary : colors.border, borderWidth: selected ? 5 : 2, backgroundColor: selected ? colors.primary : "transparent" }]} />
        <View style={{ flex: 1 }}>
          <Text numberOfLines={1} style={[text.body, { color: selected ? colors.primary : colors.text2, fontWeight: selected ? "700" : "400" }]}>{title}</Text>
          {subtitle ? <Text numberOfLines={1} style={[text.caption, { marginTop: 2 }]}>{subtitle}</Text> : null}
        </View>
        {trailing}
      </View>
    </Pressable>
  );
}

export function OptionPicker({ label, value, placeholder, options, onChange }) {
  const [visible, setVisible] = useState(false);
  const { colors, text } = useThemeMode();
  const selected = options.find((item) => item.value === value);
  return (
    <View>
      {label ? <Text style={[text.label, { marginBottom: 8 }]}>{label}</Text> : null}
      <Pressable onPress={() => setVisible(true)} style={[styles.pickerButton, { backgroundColor: colors.surface2, borderColor: colors.border }]}>
        <Text style={[text.body, { flex: 1, color: selected ? colors.text : colors.muted }]}>{selected?.label || placeholder}</Text>
        <MaterialIcons name="expand-more" size={22} color={colors.muted} />
      </Pressable>
      <Modal animationType="fade" transparent visible={visible} onRequestClose={() => setVisible(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setVisible(false)}>
          <Pressable style={[styles.optionSheet, { backgroundColor: colors.bg2, borderColor: colors.border }]}>
            <FlatList
              data={options}
              keyExtractor={(item) => String(item.value)}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => {
                    onChange(item.value);
                    setVisible(false);
                  }}
                  style={[styles.optionRow, { borderBottomColor: colors.border }]}
                >
                  <Text style={[text.body, { flex: 1, color: value === item.value ? colors.primary : colors.text2, fontWeight: value === item.value ? "700" : "400" }]}>{item.label}</Text>
                  {value === item.value ? <MaterialIcons name="check" size={18} color={colors.primary} /> : null}
                </Pressable>
              )}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

export function AppBottomSheet({ visible, title, subtitle, children, onClose, showHandle = false }) {
  const insets = useSafeAreaInsets();
  const { colors, text, isDark } = useThemeMode();
  return (
    <Modal animationType="slide" transparent visible={visible} onRequestClose={onClose}>
      <View style={styles.bottomModalWrap}>
        <Pressable style={styles.bottomModalBackdrop} onPress={onClose} />
        <View style={[styles.bottomSheet, { paddingBottom: insets.bottom + 24, backgroundColor: isDark ? "#0D1626" : "#FFFFFF", borderColor: colors.border }]}>
          {showHandle ? <View style={[styles.sheetHandle, { backgroundColor: colors.border }]} /> : null}
          <View style={styles.sheetHeader}>
            <View style={{ flex: 1 }}>
              <Text style={text.h2} numberOfLines={1}>{title}</Text>
              {subtitle ? <Text style={[text.bodyMuted, { marginTop: 4 }]}>{subtitle}</Text> : null}
            </View>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <MaterialIcons name="close" size={22} color={colors.text2} />
            </Pressable>
          </View>
          {children}
        </View>
      </View>
    </Modal>
  );
}

export function RaceResultsModal({ visible, raceName, onFetchResults, onClose }) {
  const { colors, text } = useThemeMode();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [results, setResults] = useState(null);

  useEffect(() => {
    let alive = true;
    if (!visible || !onFetchResults) return () => {};
    setLoading(true);
    setError("");
    setResults(null);
    onFetchResults()
      .then((data) => {
        if (alive) setResults(data);
      })
      .catch((err) => {
        if (alive) setError(String(err?.message || err));
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [onFetchResults, visible]);

  const items = Array.isArray(results?.results) ? results.results : [];

  return (
    <AppBottomSheet visible={visible} title="Thứ tự về đích" subtitle={raceName} onClose={onClose}>
      {loading ? (
        [0, 1, 2].map((item) => <LoadingShimmer key={item} height={72} style={{ marginBottom: 10 }} />)
      ) : error ? (
        <Text style={[text.body, { color: colors.danger, textAlign: "center", paddingVertical: 24 }]}>Lỗi khi tải kết quả: {error}</Text>
      ) : items.length === 0 ? (
        <EmptyState icon="outlined-flag" title="Chưa có kết quả" subtitle="Kết quả sẽ hiển thị sau khi trận đấu kết thúc." />
      ) : (
        <ScrollView style={{ maxHeight: 360 }}>
          {items.map((item, index) => {
            const rank = Number.parseInt(item.position, 10) || index + 1;
            const horseName = typeof item.horseId === "object" ? item.horseId?.name || "N/A" : "N/A";
            const jockeyName = typeof item.jockeyId === "object" ? item.jockeyId?.fullName || "N/A" : "N/A";
            const medal = rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : null;
            const accentColor = rank === 1 ? colors.accent : rank === 2 ? colors.muted : rank === 3 ? colors.orange : undefined;
            return (
              <GlassCard key={`${horseName}-${rank}-${index}`} accentColor={rank <= 3 ? accentColor : undefined} contentStyle={{ paddingVertical: 14 }} style={{ marginBottom: 10 }}>
                <View style={styles.resultRow}>
                  <Text style={[text.h3, { width: 42, color: colors.muted }]}>{medal || `#${rank}`}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[text.body, { color: rank <= 3 ? colors.text : colors.text2, fontWeight: "700" }]}>{horseName}</Text>
                    <View style={{ flexDirection: "row", alignItems: "center", marginTop: 4 }}>
                      <MaterialIcons name="person-outline" size={13} color={colors.muted} />
                      <Text style={[text.caption, { marginLeft: 4 }]}>{jockeyName}</Text>
                    </View>
                  </View>
                </View>
              </GlassCard>
            );
          })}
        </ScrollView>
      )}
    </AppBottomSheet>
  );
}

export function showAppAlert(title, message, isError = false) {
  emitAlert({ kind: "alert", title, message, isError });
}

export function showAppConfirm(title, message, options = {}) {
  return new Promise((resolve) => {
    emitAlert({
      kind: "confirm",
      title,
      message,
      isError: options.isError || false,
      confirmLabel: options.confirmLabel || "Đồng ý",
      cancelLabel: options.cancelLabel || "Hủy",
      resolve
    });
  });
}

export function AppAlertHost() {
  const [request, setRequest] = useState(null);
  const { colors, text } = useThemeMode();

  useEffect(() => {
    const listener = (nextRequest) => setRequest(nextRequest);
    alertListeners.add(listener);
    return () => {
      alertListeners.delete(listener);
    };
  }, []);

  function close(value) {
    if (request?.resolve) request.resolve(value);
    setRequest(null);
  }

  return (
    <Modal transparent animationType="fade" visible={Boolean(request)} onRequestClose={() => close(false)}>
      <View style={styles.alertBackdrop}>
        <GlassCard style={styles.alertCard} contentStyle={{ padding: 24 }}>
          <View style={styles.alertHeader}>
            <View style={[styles.alertIcon, { backgroundColor: request?.isError ? colors.dangerLight : colors.primaryLight }]}>
              <MaterialIcons name={request?.isError ? "error-outline" : "check-circle-outline"} color={request?.isError ? colors.danger : colors.primary} size={18} />
            </View>
            <Text style={[text.h3, { flex: 1 }]}>{request?.title}</Text>
          </View>
          <View style={[styles.alertDivider, { backgroundColor: colors.border }]} />
          <Text style={text.body}>{request?.message}</Text>
          {request?.kind === "confirm" ? (
            <View style={styles.alertActions}>
              <AppButton label={request.cancelLabel} variant="ghost" onPress={() => close(false)} style={{ flex: 1 }} />
              <AppButton label={request.confirmLabel} variant={request.isError ? "danger" : "primary"} onPress={() => close(true)} style={{ flex: 1 }} />
            </View>
          ) : (
            <AppButton label="OK" variant={request?.isError ? "danger" : "primary"} onPress={() => close(true)} style={{ marginTop: 24 }} />
          )}
        </GlassCard>
      </View>
    </Modal>
  );
}

export function RaceImageCard({ image = horseImage, children, style }) {
  const { colors } = useThemeMode();
  return (
    <View style={[styles.imageCard, { backgroundColor: colors.surface2 }, style]}>
      <Image source={{ uri: image }} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
      <LinearGradient colors={["rgba(0,0,0,0.12)", "rgba(0,0,0,0.65)"]} style={StyleSheet.absoluteFillObject} />
      {children}
    </View>
  );
}

export function DateCard({ day, date, active, past }) {
  const { colors } = useThemeMode();
  const content = (
    <View style={[styles.dateCard, !active && { backgroundColor: past ? "rgba(255,255,255,0.08)" : colors.surface2, borderColor: colors.border, borderWidth: 1 }]}>
      <Text style={{ color: active ? "#fff" : colors.muted, fontSize: 12, fontWeight: "800", letterSpacing: 1.2 }}>{day}</Text>
      <Text style={{ color: active ? "#fff" : colors.text, fontSize: 20, fontWeight: "700", marginTop: 4 }}>{date}</Text>
      {active ? <View style={styles.dateDot} /> : null}
    </View>
  );
  return active ? (
    <LinearGradient colors={[colors.primary, colors.accent]} style={[styles.dateCard, { marginRight: 8 }]}>
      {content.props.children}
    </LinearGradient>
  ) : (
    <View style={{ marginRight: 8 }}>{content}</View>
  );
}

function badgeVariant(status) {
  switch (String(status || "").toLowerCase()) {
    case "pending":
      return "pending";
    case "open":
    case "scheduled":
      return "scheduled";
    case "active":
    case "won":
      return "active";
    case "completed":
      return "completed";
    case "approved":
      return "approved";
    case "confirmed":
      return "confirmed";
    case "rejected":
    case "lost":
      return "rejected";
    case "inactive":
      return "inactive";
    case "cancelled":
      return "cancelled";
    case "ongoing":
      return "ongoing";
    default:
      return "neutral";
  }
}

function initials(name) {
  const parts = String(name || "?").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export function statusBadgeFor(status) {
  return <StatusBadge label={translateStatus(status)} status={status} />;
}

export const Icon = MaterialIcons;

const styles = StyleSheet.create({
  fill: { flex: 1 },
  glow: { position: "absolute", width: 450, height: 450, borderRadius: 225 },
  glowTop: { top: -120, left: -120 },
  glowBottom: { bottom: -120, right: -120 },
  cardShadow: {
    borderRadius: 20,
    shadowColor: "#000",
    shadowOpacity: 0.28,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
    overflow: "hidden"
  },
  glassClip: { borderRadius: 20, borderWidth: 1.5, overflow: "hidden" },
  glassInner: { minHeight: 1 },
  cardContent: { padding: 20 },
  badge: { alignSelf: "flex-start", borderWidth: 1, borderRadius: 999, paddingHorizontal: 9, paddingVertical: 3 },
  badgeText: { fontSize: 10, fontWeight: "800", letterSpacing: 0.7 },
  roleBadge: { alignSelf: "flex-start", borderWidth: 1, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 },
  roleBadgeText: { fontSize: 10, fontWeight: "800", letterSpacing: 0.6 },
  userBadge: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderRadius: 999, padding: 5, paddingRight: 12 },
  emptyState: { alignItems: "center", justifyContent: "center", paddingVertical: 48 },
  emptyIcon: { width: 72, height: 72, borderRadius: 36, alignItems: "center", justifyContent: "center", borderWidth: 1 },
  button: { minHeight: 48, borderRadius: 12, alignItems: "center", justifyContent: "center", flexDirection: "row", paddingHorizontal: 18, paddingVertical: 13 },
  buttonGradient: { borderRadius: 12, overflow: "hidden" },
  buttonText: { fontSize: 14, fontWeight: "700" },
  screen: { flex: 1 },
  appHeader: { minHeight: 56, paddingHorizontal: 20, borderBottomWidth: 1, flexDirection: "row", alignItems: "center" },
  scaffoldBrandMark: { width: 26, height: 26, borderRadius: 7, alignItems: "center", justifyContent: "center", marginRight: 10 },
  screenBody: { flex: 1 },
  inputWrap: { minHeight: 46, borderRadius: 12, borderWidth: 1, flexDirection: "row", alignItems: "center", paddingHorizontal: 12 },
  input: { flex: 1, paddingVertical: 10 },
  inputIconButton: { padding: 8 },
  selectableRow: { borderWidth: 1, borderRadius: 12, padding: 14, marginBottom: 8, flexDirection: "row", alignItems: "center" },
  radio: { width: 18, height: 18, borderRadius: 9, marginRight: 12 },
  pickerButton: { minHeight: 46, borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, flexDirection: "row", alignItems: "center" },
  modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", alignItems: "center", justifyContent: "center", padding: 24 },
  optionSheet: { width: "100%", maxHeight: "65%", borderWidth: 1, borderRadius: 18, overflow: "hidden" },
  optionRow: { minHeight: 52, borderBottomWidth: 1, paddingHorizontal: 16, flexDirection: "row", alignItems: "center" },
  bottomModalWrap: { flex: 1, justifyContent: "flex-end" },
  bottomModalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.45)" },
  bottomSheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, borderWidth: 1, padding: 20 },
  sheetHandle: { alignSelf: "center", width: 48, height: 6, borderRadius: 10, marginBottom: 24 },
  sheetHeader: { flexDirection: "row", alignItems: "flex-start", marginBottom: 18 },
  closeButton: { padding: 6, marginLeft: 10 },
  resultRow: { flexDirection: "row", alignItems: "center" },
  imageCard: { height: 160, borderTopLeftRadius: 20, borderTopRightRadius: 20, overflow: "hidden" },
  dateCard: { width: 64, height: 80, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  dateDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: "#fff", marginTop: 4 },
  alertBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", alignItems: "center", justifyContent: "center", padding: 24 },
  alertCard: { width: "100%", maxWidth: 420 },
  alertHeader: { flexDirection: "row", alignItems: "center" },
  alertIcon: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center", marginRight: 12 },
  alertDivider: { height: 1, marginVertical: 16 },
  alertActions: { flexDirection: "row", gap: 12, marginTop: 24 }
});
