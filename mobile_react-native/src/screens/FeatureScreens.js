import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { ApiException } from "../core/apiClient";
import { formatDateTime, formatNumber, formatPrize, formatWallet, translateStatus, truncateId, extractTime } from "../core/formatters";
import { Role, roleValues } from "../core/models";
import {
  AppBottomSheet,
  AppButton,
  DateCard,
  EmptyState,
  GlassCard,
  Icon,
  LoadingShimmer,
  OptionPicker,
  RaceResultsModal,
  ScreenScaffold,
  SelectableItemRow,
  StatusBadge,
  TextField,
  UserAvatar,
  RoleBadge,
  horseImage,
  showAppAlert,
  showAppConfirm
} from "../ui/components";
import { useThemeMode } from "../context/ThemeContext";

export function TournamentsScreen({ api }) {
  const { items } = useLoad(() => api.getTournaments(), [api]);
  const { colors, text } = useThemeMode();

  return (
    <ScreenScaffold title="Giải đấu" scroll>
      {items === null ? (
        <LoadingList count={4} height={110} />
      ) : items.length === 0 ? (
        <EmptyState icon="emoji-events" title="Không có giải đấu" subtitle="Hiện tại chưa có giải đấu nào." />
      ) : (
        <>
          <ListHeader title="Tất cả giải đấu" subtitle={`Tìm thấy ${items.length} giải đấu`} />
          {items.map((tournament) => (
            <GlassCard key={tournament.id} style={styles.listGap} contentStyle={{ padding: 18 }}>
              <View style={styles.row}>
                <View style={[styles.squareIcon, { backgroundColor: colors.primaryLight }]}>
                  <Text style={{ fontSize: 20 }}>🏆</Text>
                </View>
                <View style={{ flex: 1, marginLeft: 14 }}>
                  <Text numberOfLines={1} style={text.h3}>{tournament.name}</Text>
                  <View style={styles.metaRow}>
                    <Icon name="location-on" size={13} color={colors.muted} />
                    <Text numberOfLines={1} style={[text.caption, { marginLeft: 4, flex: 1 }]}>{tournament.location}</Text>
                  </View>
                </View>
              </View>
              <Divider />
              <View style={styles.row}>
                <InfoChip icon="calendar-today" label={tournament.startDate} />
                <Icon name="arrow-forward" size={12} color={colors.muted} style={{ marginHorizontal: 8 }} />
                <InfoChip icon="event" label={tournament.endDate} />
              </View>
            </GlassCard>
          ))}
        </>
      )}
    </ScreenScaffold>
  );
}

export function RacesScreen({ api }) {
  const { items } = useLoad(() => api.getRaces(), [api]);
  const { colors, text } = useThemeMode();
  return (
    <ScreenScaffold title="Vòng đua" scroll>
      {items === null ? (
        <LoadingList count={5} height={100} />
      ) : items.length === 0 ? (
        <EmptyState icon="outlined-flag" title="Không có vòng đua" subtitle="Hiện chưa có vòng đua nào được lên lịch." />
      ) : (
        <>
          <ListHeader title="Tất cả vòng đua" subtitle={`Tìm thấy ${items.length} vòng đua`} />
          {items.map((race) => (
            <GlassCard key={race.id} style={styles.listGap} contentStyle={{ padding: 18 }}>
              <View style={styles.row}>
                <View style={[styles.squareIcon, { backgroundColor: colors.accentLight }]}>
                  <Text style={{ fontSize: 20 }}>🏇</Text>
                </View>
                <View style={{ flex: 1, marginLeft: 14 }}>
                  <Text numberOfLines={1} style={text.h3}>{race.name}</Text>
                  <View style={{ marginTop: 6 }}>
                    <StatusBadge label={translateStatus(race.status)} status={race.status} />
                  </View>
                </View>
              </View>
              <Divider />
              <View style={styles.metaRow}>
                <Icon name="schedule" size={13} color={colors.muted} />
                <Text style={[text.caption, { marginLeft: 6, flex: 1 }]}>{formatDateTime(race.scheduledAt)}</Text>
              </View>
            </GlassCard>
          ))}
        </>
      )}
    </ScreenScaffold>
  );
}

export function HorsesScreen({ api }) {
  const { items } = useLoad(() => api.getHorses(), [api]);
  const { colors, text } = useThemeMode();
  return (
    <ScreenScaffold title="Ngựa của tôi" scroll>
      {items === null ? (
        <LoadingList count={4} height={80} />
      ) : items.length === 0 ? (
        <EmptyState icon="pets" title="Không có ngựa đua" subtitle="Bạn chưa đăng ký chiến mã nào." />
      ) : (
        <>
          <ListHeader title="Ngựa của tôi" subtitle={`Có ${items.length} chiến mã`} />
          {items.map((horse) => (
            <GlassCard key={horse.id} style={styles.listGap} contentStyle={{ padding: 16 }}>
              <View style={styles.row}>
                <View style={[styles.squareIconLarge, { backgroundColor: colors.primaryLight }]}>
                  <Text style={{ fontSize: 22 }}>🐎</Text>
                </View>
                <View style={{ flex: 1, marginLeft: 14 }}>
                  <Text style={[text.body, { color: colors.text, fontWeight: "700" }]}>{horse.name}</Text>
                  <View style={styles.metaRow}>
                    <Icon name="person-outline" size={12} color={colors.muted} />
                    <Text style={[text.caption, { marginLeft: 4 }]}>Mã chủ sở hữu: {truncateId(horse.ownerId)}</Text>
                  </View>
                </View>
                <Icon name="chevron-right" size={18} color={colors.muted} />
              </View>
            </GlassCard>
          ))}
        </>
      )}
    </ScreenScaffold>
  );
}

export function InvitesScreen({ api }) {
  const { colors, text } = useThemeMode();
  const { items, reload, setItems } = useLoad(() => api.getInvites(), [api]);

  async function handleAction(inviteId, action) {
    try {
      if (action === "accept") await api.acceptInvitation(inviteId);
      else await api.rejectInvitation(inviteId);
      showAppAlert("Thành công", action === "accept" ? "Đã chấp nhận lời mời đua." : "Đã từ chối lời mời đua.");
      setItems(null);
      reload();
    } catch (_error) {
      showAppAlert("Lỗi", action === "accept" ? "Không thể chấp nhận lời mời." : "Không thể từ chối lời mời.", true);
    }
  }

  return (
    <ScreenScaffold title="Lời mời" contentContainerStyle={{ flex: 1 }}>
      {items === null ? (
        <ScrollView contentContainerStyle={{ padding: 20 }}>
          <LoadingList count={4} height={160} />
        </ScrollView>
      ) : (
        <>
          <View style={{ padding: 20, paddingBottom: 16 }}>
            <Text style={[text.h1, { fontSize: 28 }]}>Jockey Invites</Text>
            <Text style={[text.bodyMuted, { fontSize: 16, marginTop: 8 }]}>Review and manage your upcoming race invitations from stable owners.</Text>
          </View>
          {items.length === 0 ? (
            <EmptyState icon="mail-outline" title="Không có lời mời" subtitle="Bạn hiện không có lời mời thi đấu nào." />
          ) : (
            <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 28 }}>
              {items.map((invite) => {
                const pending = invite.status.toLowerCase() === "pending";
                return (
                  <GlassCard key={invite.id} style={{ marginBottom: 24 }} contentStyle={{ padding: 20 }}>
                    <View style={styles.rowTop}>
                      <View style={{ flex: 1 }}>
                        <Text style={[text.caption, { color: pending ? colors.accent : colors.muted, fontWeight: "800", letterSpacing: 1.5 }]}>
                          {pending ? "PENDING INVITE" : translateStatus(invite.status).toUpperCase()}
                        </Text>
                        <Text style={[text.h3, { fontSize: 20, marginTop: 8 }]}>{invite.horseName}</Text>
                        <View style={styles.metaRow}>
                          <Icon name="calendar-today" size={14} color={colors.muted} />
                          <Text style={[text.bodyMuted, { marginLeft: 6 }]}>ERMS Tournament</Text>
                        </View>
                      </View>
                      <Image source={{ uri: horseImage }} style={styles.inviteImage} />
                    </View>
                    <View style={[styles.ownerBox, { backgroundColor: colors.surface2 }]}>
                      <View style={[styles.ownerIcon, { backgroundColor: colors.accentLight }]}>
                        <Icon name="person" color={colors.accent} size={20} />
                      </View>
                      <View style={{ marginLeft: 12, flex: 1 }}>
                        <Text style={[text.caption, { fontSize: 10, letterSpacing: 1.2 }]}>STABLE OWNER</Text>
                        <Text style={[text.body, { color: colors.text, fontWeight: "700" }]}>ERMS Equine Stables</Text>
                      </View>
                    </View>
                    {pending ? (
                      <View style={[styles.row, { marginTop: 20, gap: 12 }]}>
                        <AppButton label="ACCEPT" icon="check-circle-outline" onPress={() => handleAction(invite.id, "accept")} style={{ flex: 1, backgroundColor: colors.success }} />
                        <AppButton label="REJECT" icon="cancel" variant="danger" onPress={() => handleAction(invite.id, "reject")} style={{ flex: 1 }} />
                      </View>
                    ) : null}
                  </GlassCard>
                );
              })}
            </ScrollView>
          )}
        </>
      )}
    </ScreenScaffold>
  );
}

export function PredictionsScreen({ api }) {
  const { items } = useLoad(() => api.getPredictions(), [api]);
  const { colors, text } = useThemeMode();
  return (
    <ScreenScaffold title="Dự đoán" scroll>
      {items === null ? (
        <LoadingList count={4} height={90} />
      ) : items.length === 0 ? (
        <EmptyState icon="analytics" title="Không có dự đoán" subtitle="Bạn chưa thực hiện lượt dự đoán nào." />
      ) : (
        <>
          <ListHeader title="Dự đoán của tôi" subtitle={`Có ${items.length} lượt dự đoán`} />
          {items.map((prediction) => (
            <GlassCard key={prediction.id} style={styles.listGap} contentStyle={{ padding: 16 }}>
              <View style={styles.row}>
                <View style={[styles.squareIconSmall, { backgroundColor: colors.infoLight }]}>
                  <Icon name="analytics" size={19} color={colors.info} />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text numberOfLines={1} style={[text.body, { color: colors.text, fontWeight: "700" }]}>
                    {prediction.raceName || `Trận đấu ${truncateId(prediction.raceId)}`}
                  </Text>
                  <View style={{ marginTop: 4 }}>
                    <StatusBadge label={prediction.status} status={prediction.status} />
                  </View>
                </View>
              </View>
              <Divider />
              <View style={styles.row}>
                <Detail icon="pets" label="Ngựa đua" value={prediction.pickedHorseName || "—"} />
                {prediction.betAmount !== null ? <Detail icon="attach-money" label="Đặt cược" value={formatNumber(prediction.betAmount)} /> : null}
              </View>
            </GlassCard>
          ))}
        </>
      )}
    </ScreenScaffold>
  );
}

export function PlacePredictionScreen({ api, wallet }) {
  const { colors, text } = useThemeMode();
  const { items: races } = useLoad(() => api.getRaces(), [api], []);
  const [selectedRaceId, setSelectedRaceId] = useState(null);
  const [isOpen, setIsOpen] = useState(null);
  const [horses, setHorses] = useState([]);
  const [selectedHorseId, setSelectedHorseId] = useState(null);
  const [predictedPosition, setPredictedPosition] = useState(null);
  const [bet, setBet] = useState("");
  const [loadingHorses, setLoadingHorses] = useState(false);
  const [loading, setLoading] = useState(false);

  async function selectRace(raceId) {
    setSelectedRaceId(raceId);
    setIsOpen(null);
    setHorses([]);
    setSelectedHorseId(null);
    setPredictedPosition(null);
    setLoadingHorses(true);
    try {
      const [openData, horseData] = await Promise.all([api.checkRaceOpenForPrediction(raceId), api.getRaceHorses(raceId)]);
      setIsOpen(openData?.isOpen === true);
      setHorses(horseData);
    } catch (_error) {
      setHorses([]);
    } finally {
      setLoadingHorses(false);
    }
  }

  async function submit() {
    if (!selectedRaceId || !selectedHorseId || !predictedPosition || !bet) {
      showAppAlert("Thiếu thông tin", "Vui lòng điền đầy đủ các thông tin.", true);
      return;
    }
    const amount = Number.parseInt(bet, 10) || 0;
    if (amount < 100000 || amount > 10000000) {
      showAppAlert("Sai hạn mức", "Tiền cược phải nằm trong khoảng từ 100k đến 10M.", true);
      return;
    }
    if (amount > wallet.balance) {
      showAppAlert("Số dư không đủ", `Bạn chỉ còn ${formatWallet(wallet.balance)} trong ví.`, true);
      return;
    }
    setLoading(true);
    try {
      await api.placePrediction({ raceId: selectedRaceId, horseId: selectedHorseId, betAmount: amount, predictedPosition });
      await wallet.deductBalance(amount);
      showAppAlert("Thành công! 🎉", "Dự đoán của bạn đã được đặt.");
      setSelectedRaceId(null);
      setSelectedHorseId(null);
      setPredictedPosition(null);
      setIsOpen(null);
      setHorses([]);
      setBet("");
    } catch (error) {
      const message = error instanceof ApiException ? error.message : "Đặt dự đoán thất bại.";
      showAppAlert("Lỗi", message, true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScreenScaffold title="Đặt dự đoán" scroll>
      <Text style={text.h1}>Đặt dự đoán</Text>
      <Text style={[text.bodyMuted, { marginTop: 6 }]}>Chọn một trận đấu và ngựa đua, sau đó nhập số tiền đặt cược.</Text>
      <StepCard step={1} title="Chọn trận đua">
        {(races || []).length === 0 ? <LoadingShimmer height={80} /> : races.map((race) => (
          <SelectableItemRow key={race.id} title={race.name} subtitle={race.status} trailing={<StatusBadge label={race.status} status={race.status} />} selected={selectedRaceId === race.id} onPress={() => selectRace(race.id)} />
        ))}
      </StepCard>
      {selectedRaceId && isOpen === false ? (
        <View style={[styles.closedBanner, { backgroundColor: colors.dangerLight, borderColor: colors.danger }]}>
          <Icon name="lock-outline" size={16} color={colors.danger} />
          <Text style={[text.body, { color: colors.danger, marginLeft: 10, flex: 1 }]}>Trận đấu này đã đóng, không thể đặt dự đoán.</Text>
        </View>
      ) : null}
      {selectedRaceId && isOpen === true && horses.length > 0 ? (
        <>
          <StepCard step={2} title="Chọn chiến mã">
            {horses.map((horse) => <SelectableItemRow key={horse.id} title={horse.name} selected={selectedHorseId === horse.id} onPress={() => setSelectedHorseId(horse.id)} />)}
          </StepCard>
          {selectedHorseId ? (
            <StepCard step={3} title="Dự đoán vị trí về đích">
              <OptionPicker
                value={predictedPosition}
                placeholder="Chọn vị trí"
                options={Array.from({ length: 10 }, (_, index) => ({ value: index + 1, label: `Vị trí thứ ${index + 1}` }))}
                onChange={setPredictedPosition}
              />
            </StepCard>
          ) : null}
          <StepCard step={selectedHorseId ? 4 : 3} title="Số tiền đặt cược">
            <View style={styles.betweenRow}>
              <Text style={text.bodyMuted}>Hạn mức (100.000 - 10.000,000)</Text>
              <Text style={[text.bodyMuted, { color: colors.primary, fontWeight: "800" }]}>Ví: {formatNumber(wallet.balance)}</Text>
            </View>
            <TextField value={bet} onChangeText={setBet} placeholder="500000" keyboardType="number-pad" leftIcon="attach-money" />
          </StepCard>
          <AppButton label="Đặt dự đoán" icon="check-circle-outline" loading={loading} onPress={selectedHorseId && predictedPosition && bet ? submit : null} style={{ marginTop: 8 }} />
        </>
      ) : null}
      {loadingHorses ? <LoadingShimmer height={120} style={{ marginTop: 16 }} /> : null}
    </ScreenScaffold>
  );
}

export function RaceResultsScreen({ api }) {
  const { items: races } = useLoad(() => api.getRaces(), [api], []);
  const [selectedRace, setSelectedRace] = useState(null);
  const { text } = useThemeMode();
  return (
    <ScreenScaffold title="Kết quả vòng đua" scroll>
      <Text style={text.h1}>Kết quả vòng đua</Text>
      <Text style={[text.bodyMuted, { marginTop: 6, marginBottom: 24 }]}>Chọn một vòng đua để xem thứ tự về đích.</Text>
      <Text style={[text.h3, { marginBottom: 12 }]}>Chọn vòng đua</Text>
      {(races || []).length === 0 ? (
        <LoadingList count={3} height={60} />
      ) : races.map((race) => (
        <SelectableItemRow key={race.id} title={race.name} subtitle={translateStatus(race.status)} trailing={<StatusBadge label={translateStatus(race.status)} status={race.status} />} onPress={() => setSelectedRace(race)} />
      ))}
      <RaceResultsModal visible={Boolean(selectedRace)} raceName={selectedRace?.name} onFetchResults={selectedRace ? () => api.getRaceResults(selectedRace.id) : null} onClose={() => setSelectedRace(null)} />
    </ScreenScaffold>
  );
}

export function NotificationsScreen({ api }) {
  const { items } = useLoad(() => api.getNotifications(), [api]);
  const [selectedRace, setSelectedRace] = useState(null);
  const { colors, text } = useThemeMode();

  return (
    <ScreenScaffold title="Thông báo" scroll>
      {items === null ? (
        <LoadingList count={4} height={80} />
      ) : items.length === 0 ? (
        <EmptyState icon="notifications-off" title="Không có thông báo" subtitle="Bạn không có thông báo nào mới." />
      ) : (
        <>
          <ListHeader title="Thông báo" subtitle={`Có ${items.length} thông báo`} />
          {items.map((item, index) => {
            const title = String(item.title || item.type || "Thông báo");
            const message = String(item.message || "");
            const type = String(item.type || "");
            const iconConfig = notificationIcon(type, colors);
            const raceId = item.raceId || item.race?.id || item.data?.raceId || item.prediction?.raceId;
            return (
              <Pressable key={`${title}-${index}`} disabled={!raceId} onPress={() => setSelectedRace({ id: String(raceId), name: title })}>
                <GlassCard style={styles.listGap} contentStyle={{ padding: 16 }}>
                  <View style={styles.rowTop}>
                    <View style={[styles.squareIcon, { backgroundColor: iconConfig.bg }]}>
                      <Icon name={iconConfig.icon} size={20} color={iconConfig.color} />
                    </View>
                    <View style={{ flex: 1, marginLeft: 14 }}>
                      <Text style={[text.body, { color: colors.text, fontWeight: "700" }]}>{title}</Text>
                      {message ? <Text numberOfLines={3} style={[text.bodyMuted, { marginTop: 4 }]}>{message}</Text> : null}
                    </View>
                  </View>
                </GlassCard>
              </Pressable>
            );
          })}
        </>
      )}
      <RaceResultsModal visible={Boolean(selectedRace)} raceName={selectedRace?.name} onFetchResults={selectedRace ? () => api.getRaceResults(selectedRace.id) : null} onClose={() => setSelectedRace(null)} />
    </ScreenScaffold>
  );
}

export function LeaderboardScreen({ api }) {
  const { items: tournaments } = useLoad(() => api.getTournaments(), [api], []);
  const { colors, text } = useThemeMode();
  const [selectedId, setSelectedId] = useState(null);
  const [leaderboard, setLeaderboard] = useState(null);
  const [loading, setLoading] = useState(false);

  async function selectTournament(id) {
    setSelectedId(id);
    setLeaderboard(null);
    setLoading(true);
    try {
      setLeaderboard(await api.getTournamentLeaderboard(id));
    } catch (_error) {
      setLeaderboard({ leaderboard: [] });
    } finally {
      setLoading(false);
    }
  }

  const entries = Array.isArray(leaderboard?.leaderboard) ? leaderboard.leaderboard : [];
  return (
    <ScreenScaffold title="Bảng xếp hạng" scroll>
      <Text style={text.h1}>Bảng xếp hạng</Text>
      <Text style={[text.bodyMuted, { marginTop: 6, marginBottom: 20 }]}>Thứ hạng và giải thưởng theo từng giải đấu.</Text>
      <Text style={[text.h3, { marginBottom: 12 }]}>Chọn giải đấu</Text>
      {(tournaments || []).length === 0 ? <LoadingShimmer height={60} /> : tournaments.map((t) => (
        <SelectableItemRow key={t.id} title={t.name} subtitle={`${t.startDate} → ${t.endDate}`} trailing={<Icon name="chevron-right" size={18} color={colors.muted} />} selected={selectedId === t.id} onPress={() => selectTournament(t.id)} />
      ))}
      {selectedId ? (
        <View style={{ marginTop: 24 }}>
          <View style={styles.row}>
            <Text style={text.h3}>Thứ hạng</Text>
            {loading ? <LoadingShimmer height={14} style={{ width: 14, marginLeft: 10 }} /> : null}
          </View>
          {loading || !leaderboard ? (
            <LoadingList count={3} height={70} />
          ) : entries.length === 0 ? (
            <EmptyState icon="bar-chart" title="Chưa có bảng xếp hạng" subtitle="Bảng xếp hạng sẽ hiển thị sau khi các trận đấu kết thúc." />
          ) : entries.map((entry, index) => (
            <LeaderboardRow key={`${entry.horseName}-${index}`} rank={index + 1} horseName={entry.horseName || "—"} wins={entry.wins || "0"} prize={formatPrize(entry.totalPrize)} />
          ))}
        </View>
      ) : null}
    </ScreenScaffold>
  );
}

export function JockeyScheduleScreen({ api }) {
  const { items } = useLoad(() => api.getJockeyRaces(), [api]);
  const [selectedRace, setSelectedRace] = useState(null);
  const [resultRace, setResultRace] = useState(null);
  const { colors, text } = useThemeMode();
  return (
    <ScreenScaffold title="Lịch trình thi đấu" contentContainerStyle={{ flex: 1 }}>
      {items === null ? (
        <ScrollView contentContainerStyle={{ padding: 20 }}><LoadingList count={4} height={100} /></ScrollView>
      ) : (
        <>
          <View style={{ padding: 20, paddingBottom: 16 }}>
            <Text style={[text.h2, { fontSize: 24 }]}>Race Schedule</Text>
            <Text style={[text.bodyMuted, { marginTop: 4 }]}>Manage your race entries and timings.</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20 }}>
            {[["MON", "12", false, true], ["TUE", "13", false, true], ["WED", "14", true, false], ["THU", "15"], ["FRI", "16"], ["SAT", "17"], ["SUN", "18"]].map(([day, date, active, past]) => (
              <DateCard key={day} day={day} date={date} active={active} past={past} />
            ))}
          </ScrollView>
          {items.length === 0 ? (
            <EmptyState icon="calendar-month" title="Lịch trình trống" subtitle="Bạn chưa có lịch thi đấu nào sắp tới." />
          ) : (
            <ScrollView contentContainerStyle={{ padding: 20 }}>
              {items.map((race, index) => {
                const themeColor = index % 3 === 0 ? colors.accent : index % 3 === 1 ? colors.primary : "#FFB695";
                return (
                  <Pressable key={race.id} onPress={() => setSelectedRace(race)}>
                    <GlassCard style={styles.listGap} contentStyle={{ padding: 20 }}>
                      <View style={styles.rowTop}>
                        <View style={{ flex: 1 }}>
                          <View style={[styles.racePill, { backgroundColor: `${themeColor}26`, borderColor: `${themeColor}33` }]}>
                            <Text style={{ color: themeColor, fontSize: 12, fontWeight: "900", letterSpacing: 1.2 }}>RACE 0{index + 1}</Text>
                          </View>
                          <Text style={[text.h3, { fontSize: 18, marginTop: 8 }]}>{race.name}</Text>
                        </View>
                        <View style={{ alignItems: "flex-end" }}>
                          <Text style={[text.h3, { color: colors.primary, fontSize: 16 }]}>{extractTime(race.scheduledAt)}</Text>
                          <Text style={text.caption}>Post Time</Text>
                        </View>
                      </View>
                      <View style={[styles.metaRow, { marginTop: 16 }]}>
                        <Icon name="stadium" size={18} color={colors.muted} />
                        <Text style={[text.bodyMuted, { marginLeft: 8 }]}>ERMS Main Stadium</Text>
                      </View>
                      <Divider />
                      <View style={styles.betweenRow}>
                        <View style={styles.metaRow}>
                          <Icon name="pets" size={18} color={colors.accent} />
                          <Text style={[text.body, { marginLeft: 8, fontWeight: "600" }]}>My Assigned Horse</Text>
                        </View>
                        <Icon name="chevron-right" color={colors.muted} />
                      </View>
                    </GlassCard>
                  </Pressable>
                );
              })}
              <View style={{ alignItems: "center", paddingVertical: 32 }}>
                <Text style={[text.label, { color: colors.muted }]}>End of scheduled races</Text>
              </View>
            </ScrollView>
          )}
        </>
      )}
      <AppBottomSheet visible={Boolean(selectedRace)} title={selectedRace?.name || ""} subtitle={selectedRace ? formatDateTime(selectedRace.scheduledAt) : ""} onClose={() => setSelectedRace(null)}>
        <View style={styles.betweenRow}>
          <Text style={text.bodyMuted}>Trạng thái:</Text>
          <StatusBadge label={translateStatus(selectedRace?.status)} status={selectedRace?.status} />
        </View>
        <AppButton label="Xem kết quả" icon="emoji-events" onPress={() => { setResultRace(selectedRace); setSelectedRace(null); }} style={{ marginTop: 24 }} />
      </AppBottomSheet>
      <RaceResultsModal visible={Boolean(resultRace)} raceName={resultRace?.name} onFetchResults={resultRace ? () => api.getRaceResults(resultRace.id) : null} onClose={() => setResultRace(null)} />
    </ScreenScaffold>
  );
}

export function AdminUsersScreen({ api }) {
  const { items, setItems } = useLoad(() => api.getAdminUsers(), [api]);
  const { colors, text } = useThemeMode();
  const [query, setQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const filtered = useMemo(() => {
    if (!items) return [];
    const q = query.toLowerCase();
    return q ? items.filter((u) => u.name.toLowerCase().includes(q) || u.role.toLowerCase().includes(q)) : items;
  }, [items, query]);

  async function changeRole(user, role) {
    setSelectedUser(null);
    try {
      await api.updateUserRole(user.id, role);
      setItems(await api.getAdminUsers());
      showAppAlert("Thành công", `Đã cấp quyền ${role} cho ${user.name}`);
    } catch (_error) {
      showAppAlert("Thất bại", "Không thể đổi quyền", true);
    }
  }

  return (
    <ScreenScaffold title="Quản lý thành viên" contentContainerStyle={{ flex: 1 }}>
      <View style={{ padding: 20, paddingBottom: 8 }}>
        <TextField value={query} onChangeText={setQuery} placeholder="Tìm kiếm thành viên…" leftIcon="search" />
      </View>
      {items === null ? (
        <ScrollView contentContainerStyle={{ padding: 20 }}><LoadingList count={5} height={72} /></ScrollView>
      ) : filtered.length === 0 ? (
        <EmptyState icon="people-outline" title="Không tìm thấy thành viên" subtitle="Thử điều chỉnh lại từ khóa tìm kiếm." />
      ) : (
        <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24 }}>
          <Text style={[text.bodyMuted, { marginBottom: 14 }]}>Có {filtered.length} thành viên</Text>
          {filtered.map((user) => (
            <GlassCard key={user.id} style={styles.listGap} contentStyle={{ padding: 14 }}>
              <View style={styles.row}>
                <UserAvatar name={user.name} role={user.role} size={40} />
                <View style={{ flex: 1, marginLeft: 14 }}>
                  <Text style={[text.body, { color: colors.text, fontWeight: "700" }]}>{user.name}</Text>
                  <View style={{ marginTop: 5 }}><RoleBadge role={user.role} /></View>
                </View>
                <Pressable onPress={() => user.role === Role.admin ? showAppAlert("Cảnh báo", "Không thể thay đổi quyền Admin.", true) : setSelectedUser(user)} style={{ padding: 8 }}>
                  <Icon name="more-vert" color={colors.muted} size={22} />
                </Pressable>
              </View>
            </GlassCard>
          ))}
        </ScrollView>
      )}
      <AppBottomSheet visible={Boolean(selectedUser)} title="Chọn vai trò mới" onClose={() => setSelectedUser(null)}>
        {roleValues.filter((role) => role !== Role.admin).map((role) => (
          <Pressable key={role} onPress={() => selectedUser && role !== selectedUser.role ? changeRole(selectedUser, role) : setSelectedUser(null)} style={[styles.optionLine, { borderBottomColor: colors.border }]}>
            <Text style={[text.body, { color: colors.text }]}>{role}</Text>
            {selectedUser?.role === role ? <Icon name="check" color={colors.primary} size={18} /> : null}
          </Pressable>
        ))}
      </AppBottomSheet>
    </ScreenScaffold>
  );
}

export function AdminSchedulingScreen({ api }) {
  const { items, reload } = useLoad(() => api.getRaces(), [api], []);
  const { colors, text } = useThemeMode();
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const filtered = (items || []).filter((race) => race.name.toLowerCase().includes(query.toLowerCase()));

  async function confirmAction(raceId, action) {
    const isClose = action === "close";
    const confirmed = await showAppConfirm(
      isClose ? "Đóng cổng cược?" : "Quyết toán cược?",
      isClose ? "Người chơi sẽ không thể tiếp tục đặt cược cho trận này." : "Hệ thống sẽ tính điểm thưởng cho người chơi thắng cược.",
      { confirmLabel: "Đồng ý", cancelLabel: "Hủy" }
    );
    if (confirmed) handleAction(raceId, action);
  }

  async function handleAction(raceId, action) {
    setLoading(true);
    try {
      if (action === "close") await api.closePredictions(raceId);
      else await api.settlePredictions(raceId);
      showAppAlert("Thành công", `Đã xử lý yêu cầu ${action === "close" ? "Đóng cược" : "Quyết toán"}.`);
      reload();
    } catch (_error) {
      showAppAlert("Thất bại", "Đã xảy ra lỗi khi thực thi. Có thể trận này đã được xử lý hoặc chưa đủ điều kiện.", true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScreenScaffold title="Quản lý Cược & Lịch" contentContainerStyle={{ flex: 1 }}>
      <View style={{ padding: 20 }}>
        <Text style={text.h1}>Quản lý Dự đoán</Text>
        <Text style={[text.bodyMuted, { marginTop: 6, marginBottom: 20 }]}>Đóng cổng cược hoặc Quyết toán kết quả các trận đấu.</Text>
        <TextField value={query} onChangeText={setQuery} placeholder="Tìm kiếm trận đấu..." leftIcon="search" />
      </View>
      {!items || loading ? (
        <ScrollView contentContainerStyle={{ padding: 20 }}><LoadingList count={3} height={120} /></ScrollView>
      ) : filtered.length === 0 ? (
        <EmptyState icon="outlined-flag" title="Không có trận đấu" subtitle="Chưa có trận đấu nào trong hệ thống." />
      ) : (
        <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 0 }}>
          {filtered.map((race) => (
            <GlassCard key={race.id} style={styles.listGap} contentStyle={{ padding: 16 }}>
              <View style={styles.betweenRow}>
                <Text numberOfLines={1} style={[text.h3, { flex: 1 }]}>{race.name}</Text>
                <StatusBadge label={race.status} status={race.status} />
              </View>
              <View style={[styles.row, { marginTop: 12, gap: 12 }]}>
                <AppButton label="Đóng cược" icon="lock-clock" variant="ghost" onPress={() => confirmAction(race.id, "close")} style={{ flex: 1 }} textStyle={{ color: colors.warning }} />
                <AppButton label="Quyết toán" icon="monetization-on" onPress={() => confirmAction(race.id, "settle")} style={{ flex: 1 }} />
              </View>
            </GlassCard>
          ))}
        </ScrollView>
      )}
    </ScreenScaffold>
  );
}

export function RefereeRacesScreen({ api, navigation }) {
  const { items } = useLoad(() => api.getRefereeRaces(), [api]);
  const { colors, text } = useThemeMode();
  return (
    <ScreenScaffold title="Trận đấu của tôi" scroll>
      {items === null ? (
        <LoadingList count={4} height={100} />
      ) : items.length === 0 ? (
        <EmptyState icon="gavel" title="Không có trận đấu được phân công" subtitle="Bạn không có trận đấu nào được phân công giám sát." />
      ) : (
        <>
          <ListHeader title="Trận đấu phân công" subtitle={`Bạn đang giám sát ${items.length} trận đấu.`} />
          {items.map((race) => (
            <Pressable key={race.id} onPress={() => navigation.navigate("RefereeReport", { race })}>
              <GlassCard style={styles.listGap} contentStyle={{ padding: 16 }}>
                <View style={styles.row}>
                  <View style={[styles.squareIcon, { backgroundColor: colors.infoLight }]}>
                    <Icon name="gavel" size={20} color={colors.info} />
                  </View>
                  <View style={{ flex: 1, marginLeft: 14 }}>
                    <Text style={text.h3}>{race.name}</Text>
                    <View style={{ marginTop: 5 }}><StatusBadge label={translateStatus(race.status)} status={race.status} /></View>
                  </View>
                </View>
                <Divider />
                <View style={styles.metaRow}>
                  <Icon name="schedule" size={13} color={colors.muted} />
                  <Text style={[text.caption, { marginLeft: 6 }]}>{formatDateTime(race.scheduledAt)}</Text>
                </View>
              </GlassCard>
            </Pressable>
          ))}
        </>
      )}
    </ScreenScaffold>
  );
}

function useLoad(loader, deps, fallback = null) {
  const [items, setItems] = useState(fallback);
  const reload = useCallback(() => {
    let alive = true;
    loader()
      .then((next) => {
        if (alive) setItems(next);
      })
      .catch(() => {
        if (alive) setItems([]);
      });
    return () => {
      alive = false;
    };
  }, deps);

  useEffect(() => reload(), [reload]);
  return { items, setItems, reload };
}

function LoadingList({ count, height }) {
  return Array.from({ length: count }, (_, index) => <LoadingShimmer key={index} height={height} style={{ marginBottom: 12 }} />);
}

function ListHeader({ title, subtitle }) {
  const { colors, text } = useThemeMode();
  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={text.h1}>{title}</Text>
      <Text style={[text.bodyMuted, { marginTop: 6 }]}>{subtitle}</Text>
      <View style={{ height: 1, backgroundColor: colors.border, marginTop: 16 }} />
    </View>
  );
}

function InfoChip({ icon, label }) {
  const { colors, text } = useThemeMode();
  return (
    <View style={[styles.infoChip, { backgroundColor: colors.surface2, borderColor: colors.border }]}>
      <Icon name={icon} size={12} color={colors.muted} />
      <Text style={[text.caption, { marginLeft: 5 }]}>{label}</Text>
    </View>
  );
}

function Detail({ icon, label, value }) {
  const { colors, text } = useThemeMode();
  return (
    <View style={[styles.metaRow, { flex: 1, alignItems: "flex-start" }]}>
      <Icon name={icon} size={14} color={colors.muted} />
      <View style={{ marginLeft: 6 }}>
        <Text style={text.captionUpper}>{label.toUpperCase()}</Text>
        <Text style={[text.body, { color: colors.text, marginTop: 2 }]}>{value}</Text>
      </View>
    </View>
  );
}

function StepCard({ step, title, children }) {
  const { colors, text } = useThemeMode();
  return (
    <GlassCard style={{ marginTop: 16 }} contentStyle={{ padding: 18 }}>
      <View style={styles.row}>
        <View style={[styles.stepBadge, { backgroundColor: colors.primaryLight, borderColor: colors.primary }]}>
          <Text style={{ color: colors.primary, fontWeight: "800", fontSize: 11 }}>{step}</Text>
        </View>
        <Text style={[text.h3, { marginLeft: 10 }]}>{title}</Text>
      </View>
      <Divider />
      {children}
    </GlassCard>
  );
}

function LeaderboardRow({ rank, horseName, wins, prize }) {
  const { colors, text } = useThemeMode();
  const medal = rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : null;
  const accentColor = rank === 1 ? colors.accent : rank === 2 ? colors.muted : rank === 3 ? colors.orange : undefined;
  return (
    <GlassCard style={styles.listGap} accentColor={rank <= 3 ? accentColor : undefined} contentStyle={{ paddingVertical: 14, paddingHorizontal: 16 }}>
      <View style={styles.row}>
        <Text style={[text.h3, { width: 38, color: colors.muted }]}>{medal || `#${rank}`}</Text>
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={[text.body, { color: rank <= 3 ? colors.text : colors.text2, fontWeight: "700" }]}>{horseName}</Text>
          <View style={styles.metaRow}>
            <Icon name="emoji-events" size={12} color={colors.muted} />
            <Text style={[text.caption, { marginLeft: 4 }]}>{wins} trận thắng</Text>
          </View>
        </View>
        <View style={[styles.prize, { backgroundColor: colors.accentLight, borderColor: colors.accent }]}>
          <Text style={{ color: colors.accent, fontWeight: "800", fontSize: 13 }}>{prize}</Text>
        </View>
      </View>
    </GlassCard>
  );
}

function Divider() {
  const { colors } = useThemeMode();
  return <View style={{ height: 1, backgroundColor: colors.border, marginVertical: 12 }} />;
}

function notificationIcon(type, colors) {
  switch (type.toLowerCase()) {
    case "prediction_won":
    case "won":
      return { icon: "emoji-events", bg: colors.accentLight, color: colors.accent };
    case "prediction_lost":
    case "lost":
      return { icon: "close", bg: colors.dangerLight, color: colors.danger };
    case "race_started":
      return { icon: "flag", bg: colors.infoLight, color: colors.info };
    case "race_completed":
      return { icon: "check-circle", bg: colors.successLight, color: colors.success };
    case "system":
      return { icon: "info-outline", bg: colors.surface2, color: colors.muted };
    default:
      return { icon: "notifications", bg: colors.surface2, color: colors.muted };
  }
}

const styles = StyleSheet.create({
  listGap: { marginBottom: 12 },
  row: { flexDirection: "row", alignItems: "center" },
  rowTop: { flexDirection: "row", alignItems: "flex-start" },
  betweenRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  metaRow: { flexDirection: "row", alignItems: "center", marginTop: 4 },
  squareIcon: { width: 40, height: 40, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  squareIconLarge: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  squareIconSmall: { width: 38, height: 38, borderRadius: 9, alignItems: "center", justifyContent: "center" },
  infoChip: { borderWidth: 1, borderRadius: 6, paddingHorizontal: 9, paddingVertical: 5, flexDirection: "row", alignItems: "center" },
  inviteImage: { width: 64, height: 64, borderRadius: 12, marginLeft: 12 },
  ownerBox: { marginTop: 20, borderRadius: 12, padding: 12, flexDirection: "row", alignItems: "center" },
  ownerIcon: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  closedBanner: { borderWidth: 1, borderRadius: 12, padding: 12, marginTop: 16, flexDirection: "row", alignItems: "center" },
  stepBadge: { width: 22, height: 22, borderRadius: 11, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  racePill: { alignSelf: "flex-start", borderRadius: 16, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 4 },
  optionLine: { minHeight: 52, borderBottomWidth: 1, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  prize: { borderWidth: 1, borderRadius: 6, paddingHorizontal: 10, paddingVertical: 5 }
});
