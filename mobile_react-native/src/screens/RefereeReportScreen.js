import React, { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { ApiException } from "../core/apiClient";
import { AppButton, EmptyState, GlassCard, Icon, LoadingShimmer, OptionPicker, ScreenScaffold, TextField, showAppAlert } from "../ui/components";
import { useAuth } from "../context/AuthContext";
import { useThemeMode } from "../context/ThemeContext";

export default function RefereeReportScreen({ route, navigation }) {
  const { apiService } = useAuth();
  const { colors, text } = useThemeMode();
  const race = route.params?.race;
  const [horses, setHorses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [positions, setPositions] = useState({});
  const [notes, setNotes] = useState("");

  useEffect(() => {
    let alive = true;
    apiService
      .getRefereeRaceHorses(race.id)
      .then((data) => {
        if (alive) setHorses(data);
      })
      .catch(() => {
        if (alive) setHorses([]);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [apiService, race.id]);

  async function submitResults() {
    if (Object.keys(positions).length < horses.length) {
      showAppAlert("Thiếu thông tin", "Vui lòng chọn hạng cho tất cả chiến mã.", true);
      return;
    }
    const rankings = Object.entries(positions).map(([horseId, pos]) => ({
      horseId,
      position: pos === "DNF" ? 99 : Number.parseInt(pos, 10)
    }));
    setSubmitting(true);
    try {
      await apiService.confirmRaceResult(race.id, rankings, notes);
      showAppAlert("Thành công", "Đã lưu biên bản kết quả trận đấu.");
      navigation.goBack();
    } catch (error) {
      const message = error instanceof ApiException ? error.message : String(error);
      showAppAlert("Lỗi", `Không thể lưu kết quả. ${message}`, true);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <ScreenScaffold title="Biên bản trận đấu">
        <View style={{ padding: 20 }}>
          <LoadingShimmer height={120} />
        </View>
      </ScreenScaffold>
    );
  }

  return (
    <ScreenScaffold title="Biên bản trận đấu" scroll>
      <Text style={text.h1}>{race.name}</Text>
      <Text style={[text.bodyMuted, { marginTop: 6, marginBottom: 24 }]}>
        Vui lòng điền thứ hạng thực tế cho từng chiến mã tham gia. Trận đấu chỉ có thể đóng và tổng kết khi có biên bản kết quả.
      </Text>

      <Text style={[text.h2, { marginBottom: 12 }]}>Danh sách nài ngựa và ngựa</Text>
      {horses.length === 0 ? (
        <EmptyState icon="pets" title="Không có dữ liệu chiến mã" subtitle="Không có dữ liệu chiến mã nào tham gia." />
      ) : (
        horses.map((item, index) => {
          const horseId = String(item.horseId || item.horse?._id || item.horse?.id || index);
          const horseName = item.horse?.name || "Ngựa vô danh";
          const jockeyName = item.jockeyName || "Chưa rõ";
          return (
            <GlassCard key={horseId} style={styles.cardGap} contentStyle={{ padding: 16 }}>
              <View style={styles.row}>
                <View style={[styles.horseIcon, { backgroundColor: colors.primaryLight }]}>
                  <Text style={{ fontSize: 22 }}>🐎</Text>
                </View>
                <View style={{ flex: 1, marginLeft: 14 }}>
                  <Text style={[text.body, { color: colors.text, fontWeight: "800" }]}>{horseName}</Text>
                  <Text style={[text.caption, { marginTop: 4 }]}>Nài ngựa: {jockeyName}</Text>
                </View>
                <View style={{ width: 116 }}>
                  <OptionPicker
                    value={positions[horseId]}
                    placeholder="Hạng"
                    options={[
                      ...Array.from({ length: 10 }, (_, i) => ({ value: String(i + 1), label: `Hạng ${i + 1}` })),
                      { value: "DNF", label: "Bỏ cuộc" }
                    ]}
                    onChange={(value) => setPositions((current) => ({ ...current, [horseId]: value }))}
                  />
                </View>
              </View>
            </GlassCard>
          );
        })
      )}

      <Text style={[text.label, { marginTop: 24, marginBottom: 8 }]}>Ghi chú của trọng tài</Text>
      <TextField value={notes} onChangeText={setNotes} placeholder="Nhập ghi chú thêm (nếu có)..." multiline />
      <AppButton label="Xác nhận Kết Quả" icon="check-circle-outline" loading={submitting} onPress={horses.length === 0 ? null : submitResults} style={{ marginTop: 32 }} />
    </ScreenScaffold>
  );
}

const styles = StyleSheet.create({
  cardGap: { marginBottom: 12 },
  row: { flexDirection: "row", alignItems: "center" },
  horseIcon: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" }
});
