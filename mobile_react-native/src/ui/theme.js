export const darkColors = {
  bg: "#04100C",
  bg2: "#060E18",
  surface: "rgba(13,22,38,0.7)",
  surface2: "rgba(22,32,50,0.6)",
  surface3: "rgba(30,41,59,0.55)",
  text: "#FFFFFF",
  text2: "#F8FAFC",
  muted: "rgba(255,255,255,0.72)",
  border: "rgba(255,255,255,0.14)",
  border2: "rgba(255,255,255,0.24)",
  primary: "#10B981",
  primaryDark: "#059669",
  primaryDarker: "#047857",
  primaryLight: "rgba(16,185,129,0.15)",
  primaryRing: "rgba(16,185,129,0.25)",
  accent: "#F59E0B",
  accentLight: "rgba(245,158,11,0.15)",
  danger: "#EF4444",
  dangerLight: "rgba(239,68,68,0.15)",
  warning: "#F59E0B",
  warningLight: "rgba(245,158,11,0.15)",
  success: "#10B981",
  successLight: "rgba(16,185,129,0.15)",
  info: "#3B82F6",
  infoLight: "rgba(59,130,246,0.15)",
  purple: "#8B5CF6",
  purpleLight: "rgba(139,92,246,0.15)",
  orange: "#F97316",
  orangeLight: "rgba(249,115,22,0.15)",
  cardStart: "rgba(255,255,255,0.2)",
  cardEnd: "rgba(255,255,255,0.1)"
};

export const lightColors = {
  bg: "#F8FAFC",
  bg2: "#FFFFFF",
  surface: "#FFFFFF",
  surface2: "#F1F5F9",
  surface3: "#E2E8F0",
  text: "#0F172A",
  text2: "#334155",
  muted: "#64748B",
  border: "#E2E8F0",
  border2: "#CBD5E1",
  primary: "#10B981",
  primaryDark: "#059669",
  primaryDarker: "#047857",
  primaryLight: "rgba(16,185,129,0.15)",
  primaryRing: "rgba(16,185,129,0.25)",
  accent: "#F59E0B",
  accentLight: "rgba(245,158,11,0.15)",
  danger: "#EF4444",
  dangerLight: "rgba(239,68,68,0.15)",
  warning: "#F59E0B",
  warningLight: "rgba(245,158,11,0.15)",
  success: "#10B981",
  successLight: "rgba(16,185,129,0.15)",
  info: "#3B82F6",
  infoLight: "rgba(59,130,246,0.15)",
  purple: "#8B5CF6",
  purpleLight: "rgba(139,92,246,0.15)",
  orange: "#F97316",
  orangeLight: "rgba(249,115,22,0.15)",
  cardStart: "rgba(255,255,255,0.95)",
  cardEnd: "rgba(255,255,255,0.85)"
};

export function colorsForMode(isDark) {
  return isDark ? darkColors : lightColors;
}

export const roleGradients = {
  ADMIN: ["#A78BFA", "#8B5CF6"],
  OWNER: ["#34D399", "#10B981"],
  JOCKEY: ["#FBBF24", "#F59E0B"],
  REFEREE: ["#60A5FA", "#3B82F6"],
  SPECTATOR: ["#94A3B8", "#64748B"],
  DEFAULT: ["#818CF8", "#6366F1"]
};

export function typography(colors) {
  return {
    h1: { fontSize: 28, fontWeight: "800", color: colors.text, lineHeight: 34 },
    h2: { fontSize: 20, fontWeight: "700", color: colors.text, lineHeight: 26 },
    h3: { fontSize: 16, fontWeight: "700", color: colors.text, lineHeight: 22 },
    body: { fontSize: 14, fontWeight: "400", color: colors.text2, lineHeight: 21 },
    bodyMuted: { fontSize: 14, fontWeight: "400", color: colors.muted, lineHeight: 21 },
    label: { fontSize: 13, fontWeight: "600", color: colors.text2, lineHeight: 18 },
    caption: { fontSize: 12, fontWeight: "500", color: colors.muted, lineHeight: 16 },
    captionUpper: { fontSize: 11, fontWeight: "700", color: colors.muted, letterSpacing: 0.8, lineHeight: 15 },
    statValue: { fontSize: 28, fontWeight: "800", color: colors.text, lineHeight: 30 }
  };
}
