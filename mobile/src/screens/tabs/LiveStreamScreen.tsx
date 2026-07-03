import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { PlayCircle, Radio, RefreshCw, RotateCcw, Trophy, Tv, X } from 'lucide-react-native';
import Svg, { Circle, G, Line, Path, Text as SvgText } from 'react-native-svg';
import * as api from '../../api';
import { Race } from '../../types';
import { ActionButton, EmptyState, ScreenHeader, StatTile, Surface } from '../../components/MobileUI';
import { formatDateTime, getHorseId, getHorseName, getRaceId, isLiveRace } from '../../utils/spectator';

type ProgressMap = Record<string, number>;
type GameState = 'countdown' | 'running' | 'finished';

const LANE_COLORS = [
  '#ef4444',
  '#3b82f6',
  '#10b981',
  '#eab308',
  '#a855f7',
  '#f97316',
  '#ec4899',
  '#14b8a6',
  '#38bdf8',
  '#f43f5e',
];

function getStreamHorseId(horse: any, index: number) {
  return String(horse?.registrationId || horse?.id || horse?._id || getHorseId(horse) || `horse-${index}`);
}

function buildMockHorses(count = 6) {
  return Array.from({ length: count }).map((_, index) => ({
    registrationId: `mock-reg-${index}`,
    horse: {
      _id: `mock-horse-${index}`,
      name: `Hỏa Phong ${index + 1}`,
      breed: 'Thần Mã',
    },
    jockeyName: `Nài ngựa ${index + 1}`,
  }));
}

function getTrackGeometry(totalHorses: number) {
  const startX = 260;
  const endX = 540;
  const centerY = 200;
  const baseRadius = totalHorses > 12 ? 46 : 68;
  const maxRadius = 170;
  const laneGap = totalHorses > 1 ? Math.min(14, (maxRadius - baseRadius) / (totalHorses - 1)) : 0;
  const laneStroke = Math.max(4, Math.min(12, laneGap * 0.9 || 10));

  return { startX, endX, centerY, baseRadius, maxRadius, laneGap, laneStroke };
}

function getHorseCoords(totalHorses: number, laneIndex: number, progress: number) {
  const { startX, endX, centerY, baseRadius, laneGap } = getTrackGeometry(totalHorses);
  const r = baseRadius + laneIndex * laneGap;
  const straightLength = endX - startX;
  const curveLength = Math.PI * r;
  const totalLength = 2 * straightLength + 2 * curveLength;
  const d = (progress / 100) * totalLength;

  let x = 0;
  let y = 0;

  if (d <= straightLength) {
    x = startX + d;
    y = centerY - r;
  } else if (d <= straightLength + curveLength) {
    const dCurve = d - straightLength;
    const theta = -Math.PI / 2 + dCurve / r;
    x = endX + r * Math.cos(theta);
    y = centerY + r * Math.sin(theta);
  } else if (d <= 2 * straightLength + curveLength) {
    const dStraight = d - (straightLength + curveLength);
    x = endX - dStraight;
    y = centerY + r;
  } else {
    const dCurve = d - (2 * straightLength + curveLength);
    const theta = Math.PI / 2 + dCurve / r;
    x = startX + r * Math.cos(theta);
    y = centerY + r * Math.sin(theta);
  }

  return { x, y, r };
}

export default function LiveStreamScreen() {
  const startTimeRef = useRef(0);
  const speedMapRef = useRef<Record<string, number>>({});
  const [races, setRaces] = useState<Race[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRace, setSelectedRace] = useState<Race | null>(null);
  const [streamHorses, setStreamHorses] = useState<any[]>([]);
  const [progress, setProgress] = useState<ProgressMap>({});
  const [finishedHorses, setFinishedHorses] = useState<any[]>([]);
  const [gameState, setGameState] = useState<GameState>('countdown');
  const [countdown, setCountdown] = useState<number | string>(3);
  const [elapsed, setElapsed] = useState(0);
  const [loadingStream, setLoadingStream] = useState(false);

  const liveRaces = useMemo(() => races.filter(isLiveRace), [races]);

  const fetchRaces = async () => {
    setLoading(true);
    try {
      const [ongoing, running] = await Promise.all([
        api.getPublicRaces({ status: 'ONGOING' }).catch(() => []),
        api.getPublicRaces({ status: 'RUNNING' }).catch(() => []),
      ]);
      const raceMap = new Map<string, Race>();
      [...ongoing, ...running].forEach((race) => {
        const id = getRaceId(race);
        if (id) raceMap.set(id, race);
      });
      setRaces(Array.from(raceMap.values()));
    } catch (error) {
      console.error('Failed to load livestream races', error);
      setRaces([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRaces();
  }, []);

  const resetSimulation = (horses: any[]) => {
    const nextProgress: ProgressMap = {};
    const nextSpeeds: Record<string, number> = {};
    horses.forEach((horse, index) => {
      const id = getStreamHorseId(horse, index);
      nextProgress[id] = 0;
      nextSpeeds[id] = 0.65 + Math.random() * 0.55;
    });
    speedMapRef.current = nextSpeeds;
    setProgress(nextProgress);
    setFinishedHorses([]);
    setElapsed(0);
    setGameState('countdown');
    setCountdown(3);
  };

  useEffect(() => {
    if (!selectedRace) return;

    let mounted = true;
    const loadHorses = async () => {
      setLoadingStream(true);
      try {
        const list = await api.getRaceHorses(getRaceId(selectedRace));
        if (!mounted) return;
        const nextHorses = Array.isArray(list) && list.length > 0 ? list : buildMockHorses(6);
        setStreamHorses(nextHorses);
        resetSimulation(nextHorses);
      } catch (error) {
        console.error('Failed to load stream horses, using mock list', error);
        if (mounted) {
          const mockHorses = buildMockHorses(6);
          setStreamHorses(mockHorses);
          resetSimulation(mockHorses);
        }
      } finally {
        if (mounted) setLoadingStream(false);
      }
    };

    loadHorses();
    return () => {
      mounted = false;
    };
  }, [selectedRace]);

  useEffect(() => {
    if (gameState !== 'countdown' || streamHorses.length === 0 || loadingStream) return;

    let value = 3;
    setCountdown(3);
    const timer = setInterval(() => {
      value -= 1;
      if (value > 0) {
        setCountdown(value);
      } else if (value === 0) {
        setCountdown('XUẤT PHÁT!');
      } else {
        clearInterval(timer);
        startTimeRef.current = Date.now();
        setGameState('running');
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [gameState, loadingStream, streamHorses.length]);

  useEffect(() => {
    if (gameState !== 'running') return;

    const elapsedTimer = setInterval(() => {
      setElapsed(Math.max(0, Math.floor((Date.now() - startTimeRef.current) / 1000)));
    }, 500);

    const simulationTimer = setInterval(() => {
      setProgress((current) => {
        const next = { ...current };
        let allFinished = true;

        streamHorses.forEach((horse, index) => {
          const id = getStreamHorseId(horse, index);
          const currentValue = next[id] || 0;
          if (currentValue >= 100) {
            next[id] = 100;
            return;
          }

          allFinished = false;
          const speed = speedMapRef.current[id] || 1;
          const step = (Math.random() * 0.9 + 0.15) * speed * 0.35;
          const nextValue = Math.min(100, currentValue + step);
          next[id] = nextValue;

          if (nextValue >= 100) {
            const finishTime = ((Date.now() - startTimeRef.current) / 1000).toFixed(2);
            setFinishedHorses((currentFinished) => {
              if (currentFinished.some((finished) => finished.streamId === id)) {
                return currentFinished;
              }
              return [...currentFinished, { ...horse, finishTime, streamId: id }];
            });
          }
        });

        if (allFinished) {
          setGameState('finished');
        }

        return next;
      });
    }, 90);

    return () => {
      clearInterval(elapsedTimer);
      clearInterval(simulationTimer);
    };
  }, [gameState, streamHorses]);

  const rankedHorses = useMemo(() => {
    return [...streamHorses]
      .map((horse, index) => {
        const id = getStreamHorseId(horse, index);
        const finishIndex = finishedHorses.findIndex((finished) => finished.streamId === id);
        return {
          horse,
          id,
          progress: progress[id] || 0,
          finishIndex,
          finishTime: finishIndex >= 0 ? finishedHorses[finishIndex].finishTime : undefined,
          originalIndex: index,
        };
      })
      .sort((a, b) => {
        if (a.finishIndex >= 0 && b.finishIndex >= 0) return a.finishIndex - b.finishIndex;
        if (a.finishIndex >= 0) return -1;
        if (b.finishIndex >= 0) return 1;
        return b.progress - a.progress;
      });
  }, [finishedHorses, progress, streamHorses]);

  const closeStream = () => {
    setSelectedRace(null);
    setStreamHorses([]);
    setProgress({});
    setFinishedHorses([]);
    setElapsed(0);
    setGameState('countdown');
  };

  const restartRace = () => {
    resetSimulation(streamHorses.length > 0 ? streamHorses : buildMockHorses(6));
  };

  const raceCard = (race: Race) => (
    <Surface key={getRaceId(race)} className="overflow-hidden mb-4">
      <View className="h-40 items-center justify-center bg-slate-900">
        <View className="px-4 py-2 rounded-full flex-row items-center bg-rose-600">
          <Radio size={15} color="white" />
          <Text className="text-white text-xs font-extrabold ml-2">ĐANG LIVE</Text>
        </View>
        <Tv size={48} color="#f8fafc" style={{ marginTop: 14 }} />
      </View>

      <View className="p-4">
        <View className="flex-row justify-between items-start">
          <View className="flex-1 pr-3">
            <Text className="text-lg font-extrabold text-slate-900" numberOfLines={2}>{race.name}</Text>
            <Text className="text-sm text-slate-500 mt-1">{formatDateTime(race.scheduledAt)}</Text>
            <Text className="text-xs text-slate-500 mt-1">{race.distance}m - {race.maxHorses} chiến mã</Text>
          </View>
          <View className="px-3 py-1.5 rounded-full bg-slate-100">
            <Text className="text-[10px] font-extrabold text-slate-600">{race.status || 'LIVE'}</Text>
          </View>
        </View>

        <View className="mt-4">
          <ActionButton
            label="Xem ngay"
            onPress={() => setSelectedRace(race)}
            icon={PlayCircle}
            variant="danger"
          />
        </View>
      </View>
    </Surface>
  );

  const renderOvalTrack = () => {
    const totalHorses = streamHorses.length;
    const { startX, centerY, baseRadius, maxRadius, laneGap, laneStroke } = getTrackGeometry(totalHorses);

    return (
      <View className="rounded-[28px] bg-emerald-950 border border-emerald-800 p-4 mb-5 overflow-hidden">
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-emerald-100 font-extrabold">Đường đua oval mô phỏng</Text>
          <View className="px-3 py-1 rounded-full bg-rose-600 flex-row items-center">
            <Radio size={12} color="white" />
            <Text className="text-white text-[10px] font-extrabold ml-1">LIVE SIM</Text>
          </View>
        </View>

        <View className="h-72 rounded-[24px] bg-emerald-900/60 overflow-hidden">
          <Svg viewBox="0 0 800 400" width="100%" height="100%">
            {streamHorses.map((_, index) => {
              const r = baseRadius + index * laneGap;
              const d = `M 260,${centerY - r} L 540,${centerY - r} A ${r},${r} 0 0,1 540,${centerY + r} L 260,${centerY + r} A ${r},${r} 0 0,1 260,${centerY - r}`;
              return (
                <G key={`lane-${index}`}>
                  <Path d={d} fill="none" stroke="#263241" strokeWidth={laneStroke} opacity={0.92} />
                  <Path d={d} fill="none" stroke="rgba(255,255,255,0.22)" strokeWidth={1.4} strokeDasharray="8,8" />
                </G>
              );
            })}

            <Line x1={startX} y1={centerY - maxRadius - 8} x2={startX} y2={centerY - baseRadius + 8} stroke="white" strokeWidth={3} />
            <Line x1={startX} y1={centerY - maxRadius - 8} x2={startX} y2={centerY - baseRadius + 8} stroke="black" strokeWidth={3} strokeDasharray="4,4" />
            <SvgText x={startX} y={centerY - maxRadius - 18} fill="#facc15" fontSize="12" fontWeight="800" textAnchor="middle">
              START / FINISH
            </SvgText>

            {streamHorses.map((horse, index) => {
              const id = getStreamHorseId(horse, index);
              const value = progress[id] || 0;
              const { x, y } = getHorseCoords(streamHorses.length, index, value);
              const color = LANE_COLORS[index % LANE_COLORS.length];
              return (
                <G key={id} transform={`translate(${x}, ${y})`}>
                  <Circle cx={0} cy={0} r={13} fill={color} opacity={0.95} stroke="white" strokeWidth={2} />
                  <SvgText x={0} y={5} fill="white" fontSize="13" fontWeight="900" textAnchor="middle">
                    {index + 1}
                  </SvgText>
                  <SvgText x={0} y={-17} fill="white" fontSize="13" textAnchor="middle">
                    🐎
                  </SvgText>
                </G>
              );
            })}
          </Svg>

          {gameState === 'countdown' && !loadingStream ? (
            <View className="absolute inset-0 bg-black/60 items-center justify-center">
              <Text className="text-white text-6xl font-black">{countdown}</Text>
              <Text className="text-yellow-300 text-xs font-extrabold uppercase tracking-widest mt-3">Chuẩn bị xuất phát</Text>
            </View>
          ) : null}
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-3">
          {streamHorses.map((horse, index) => (
            <View key={`legend-${getStreamHorseId(horse, index)}`} className="mr-2 px-3 py-2 rounded-full bg-black/25 flex-row items-center">
              <View className="w-2.5 h-2.5 rounded-full mr-2" style={{ backgroundColor: LANE_COLORS[index % LANE_COLORS.length] }} />
              <Text className="text-emerald-50 text-[11px] font-bold" numberOfLines={1}>Làn {index + 1}: {getHorseName(horse)}</Text>
            </View>
          ))}
        </ScrollView>
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <ScreenHeader
        title="Livestream"
        subtitle="Xem trực tiếp và mô phỏng cuộc đua."
        right={
          <TouchableOpacity onPress={fetchRaces} className="w-11 h-11 rounded-full bg-white border border-slate-100 items-center justify-center">
            <RefreshCw size={18} color="#64748b" />
          </TouchableOpacity>
        }
      />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 36 }}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchRaces} />}
      >
        {loading && races.length === 0 ? (
          <View className="py-20 items-center">
            <ActivityIndicator size="large" color="#2563eb" />
          </View>
        ) : (
          <View>
            <View className="flex-row gap-3 mb-5">
              <StatTile icon={Radio} label="Đang live" value={liveRaces.length} tone="rose" />
            </View>

            <Text className="text-base font-extrabold text-slate-900 mb-3">Đang phát trực tiếp</Text>
            {liveRaces.length === 0 ? (
              <View className="mb-6">
                <EmptyState icon={Radio} title="Chưa có cuộc đua live" />
              </View>
            ) : (
              liveRaces.map((race) => raceCard(race))
            )}
          </View>
        )}
      </ScrollView>

      <Modal visible={!!selectedRace} animationType="slide" onRequestClose={closeStream}>
        <SafeAreaView className="flex-1 bg-slate-950">
          <View className="px-5 pt-2 pb-4 border-b border-white/10 flex-row items-center justify-between">
            <View className="flex-1 pr-3">
              <Text className="text-white text-xl font-extrabold" numberOfLines={1}>{selectedRace?.name || 'Livestream'}</Text>
              <Text className="text-slate-400 text-sm mt-1">
                {gameState === 'finished' ? 'Đã kết thúc' : `${elapsed}s`} - {selectedRace?.distance || 0}m
              </Text>
            </View>
            <TouchableOpacity onPress={closeStream} className="w-11 h-11 rounded-full bg-white/10 items-center justify-center">
              <X size={20} color="white" />
            </TouchableOpacity>
          </View>

          {loadingStream ? (
            <View className="flex-1 items-center justify-center">
              <ActivityIndicator size="large" color="#60a5fa" />
              <Text className="text-slate-300 mt-4 font-semibold">Đang chuẩn bị đường đua oval...</Text>
            </View>
          ) : (
            <ScrollView className="flex-1" contentContainerStyle={{ padding: 20, paddingBottom: 36 }}>
              {renderOvalTrack()}

              <View className="rounded-[28px] bg-white p-4">
                <View className="flex-row items-center justify-between mb-3">
                  <Text className="text-slate-900 font-extrabold text-base">Bảng xếp hạng live</Text>
                  <Trophy size={20} color="#f59e0b" />
                </View>

                {rankedHorses.map((entry, index) => {
                  const color = LANE_COLORS[entry.originalIndex % LANE_COLORS.length];
                  return (
                    <View key={entry.id} className="flex-row items-center min-h-[64px] border-t border-slate-100">
                      <View className="w-11 h-11 rounded-2xl items-center justify-center mr-3" style={{ backgroundColor: `${color}22` }}>
                        <Text className="font-extrabold" style={{ color }}>#{index + 1}</Text>
                      </View>
                      <View className="flex-1">
                        <View className="flex-row items-center">
                          <View className="w-2.5 h-2.5 rounded-full mr-2" style={{ backgroundColor: color }} />
                          <Text className="text-sm font-extrabold text-slate-900 flex-1" numberOfLines={1}>{getHorseName(entry.horse)}</Text>
                        </View>
                        <Text className="text-xs text-slate-500 mt-0.5">Nài ngựa: {entry.horse.jockey?.user?.fullName || entry.horse.jockeyName || 'Chưa rõ'}</Text>
                      </View>
                      <Text className="text-sm font-extrabold text-blue-700">
                        {entry.finishTime ? `${entry.finishTime}s` : `${Math.round(entry.progress)}%`}
                      </Text>
                    </View>
                  );
                })}

                {gameState === 'finished' ? (
                  <View className="mt-4">
                    <ActionButton label="Mô phỏng lại" onPress={restartRace} icon={RotateCcw} variant="secondary" />
                  </View>
                ) : null}
              </View>

              <View className="mt-4 rounded-[24px] bg-white/10 border border-white/10 p-4">
                <Text className="text-slate-300 text-xs font-extrabold uppercase">Thông tin cuộc đua</Text>
                <Text className="text-white text-sm font-bold mt-2">Thời gian: {formatDateTime(selectedRace?.scheduledAt)}</Text>
                <Text className="text-white text-sm font-bold mt-1">Cự ly: {selectedRace?.distance ? `${selectedRace.distance}m` : 'Chưa rõ'}</Text>
                <Text className="text-white text-sm font-bold mt-1">Số chiến mã: {streamHorses.length}</Text>
              </View>
            </ScrollView>
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}
