import 'dart:async';
import 'dart:math';
import 'package:flutter/material.dart';
import '../../features/home/domain/models/tournament_model.dart';

class MockAppState extends ChangeNotifier {
  int userPoints = 15250;
  List<Tournament> tournaments = [];
  List<Prediction> predictions = [];

  // Live simulation variables
  Race? activeLiveRace;
  bool isSimulating = false;
  List<String> simulationLogs = [];
  Timer? _simulationTimer;
  String? lastWonDetails;

  MockAppState() {
    _initMockData();
  }

  void _initMockData() {
    // 1. Create Mock Jockeys
    final jockeys = [
      Jockey(id: 'j1', name: 'Alex Cooper', code: 'J-098', nationality: 'UK', winRate: 64),
      Jockey(id: 'j2', name: 'Sato Kenji', code: 'J-112', nationality: 'Japan', winRate: 72),
      Jockey(id: 'j3', name: 'Marco Rossi', code: 'J-224', nationality: 'Italy', winRate: 58),
      Jockey(id: 'j4', name: 'John Miller', code: 'J-053', nationality: 'USA', winRate: 61),
      Jockey(id: 'j5', name: 'Lars Nielsen', code: 'J-443', nationality: 'Denmark', winRate: 50),
    ];

    // 2. Create Mock Horses
    final horses = [
      Horse(id: 'h1', name: 'Golden Pegasus', code: 'H-09', age: 4, ownerId: 'o1', ownerName: 'Lord Harrington', jockey: jockeys[0]),
      Horse(id: 'h2', name: 'Midnight Shadow', code: 'H-15', age: 5, ownerId: 'o2', ownerName: 'K. Sato Syndicate', jockey: jockeys[1]),
      Horse(id: 'h3', name: 'Thunder Bolt', code: 'H-22', age: 4, ownerId: 'o3', ownerName: 'Rossi Farms', jockey: jockeys[2]),
      Horse(id: 'h4', name: 'Silver Storm', code: 'H-03', age: 3, ownerId: 'o4', ownerName: 'A. Miller Corp', jockey: jockeys[3]),
      Horse(id: 'h5', name: 'Nordic Emperor', code: 'H-41', age: 5, ownerId: 'o5', ownerName: 'Viking Stables', jockey: jockeys[4]),
    ];

    // 3. Create Races
    final races1 = [
      Race(id: 'r1', name: 'Grand Cup Final', time: '15:00', distance: '1200m', horses: List.from(horses), status: 'Pending'),
      Race(id: 'r2', name: 'Sprint Championship', time: '17:30', distance: '800m', horses: [horses[1], horses[3], horses[4]], status: 'Pending'),
    ];

    final races2 = [
      Race(id: 'r3', name: 'Royal Derby Round 1', time: 'Tomorrow 10:00', distance: '1600m', horses: [horses[0], horses[2], horses[4]], status: 'Pending'),
    ];

    // 4. Create Tournaments
    tournaments = [
      Tournament(
        id: 't1',
        title: 'Asia-Pacific Championship 2026',
        date: 'May 18 - May 20, 2026',
        location: 'Saitama Turf Course, Japan',
        prizePool: '\$2,500,000',
        status: 'Live',
        races: races1,
      ),
      Tournament(
        id: 't2',
        title: 'Royal Ascot Grand Derby',
        date: 'June 05 - June 08, 2026',
        location: 'Ascot Racecourse, UK',
        prizePool: '\$5,000,000',
        status: 'Upcoming',
        races: races2,
      ),
    ];

    // Initialize one completed prediction
    predictions = [
      Prediction(
        id: 'p0',
        raceId: 'r9',
        raceName: 'Preakness Stakes',
        tournamentName: 'Triple Crown Series',
        predictedHorse: horses[1],
        betPoints: 1000,
        status: 'Won',
        wonPoints: 2500,
      )
    ];

    activeLiveRace = races1[0]; // Set Grand Cup as active for Live tracking demo
  }

  void placePrediction(Race race, Tournament tournament, Horse horse, int points) {
    if (userPoints < points) return;
    
    userPoints -= points;
    
    final newPrediction = Prediction(
      id: 'p_${DateTime.now().millisecondsSinceEpoch}',
      raceId: race.id,
      raceName: race.name,
      tournamentName: tournament.title,
      predictedHorse: horse,
      betPoints: points,
      status: 'Pending',
    );

    predictions.insert(0, newPrediction);
    notifyListeners();
  }

  void startRaceSimulation() {
    if (activeLiveRace == null || isSimulating) return;

    isSimulating = true;
    simulationLogs = ['🔔 Trận đấu bắt đầu! Các chiến mã đang bứt tốc!'];
    lastWonDetails = null;

    // Reset horse positions
    for (var horse in activeLiveRace!.horses) {
      horse.liveProgress = 0.0;
      horse.livePosition = 1;
    }
    notifyListeners();

    final random = Random();
    int tickCount = 0;

    _simulationTimer = Timer.periodic(const Duration(milliseconds: 600), (timer) {
      tickCount++;
      
      // Update progresses
      for (var horse in activeLiveRace!.horses) {
        // Increment progress by a random amount (faster jockey/horse gets a slight advantage)
        double speedModifier = 0.05 + random.nextDouble() * 0.15;
        if (horse.jockey.winRate > 65) {
          speedModifier += 0.015; // Small edge
        }
        horse.liveProgress += speedModifier;
        if (horse.liveProgress > 1.0) {
          horse.liveProgress = 1.0;
        }
      }

      // Re-rank positions based on progress
      final sortedHorses = List<Horse>.from(activeLiveRace!.horses);
      sortedHorses.sort((a, b) => b.liveProgress.compareTo(a.liveProgress));

      for (int i = 0; i < activeLiveRace!.horses.length; i++) {
        final originalHorse = activeLiveRace!.horses.firstWhere((h) => h.id == sortedHorses[i].id);
        originalHorse.livePosition = i + 1;
      }

      // Add logical logging
      if (tickCount == 3) {
        simulationLogs.add('🏇 ${sortedHorses[0].name} đang tạm thời dẫn đầu đoàn đua!');
      } else if (tickCount == 6) {
        simulationLogs.add('⚡ ${sortedHorses[1].name} bám đuổi quyết liệt ở góc cua số 3!');
      } else if (tickCount == 9) {
        simulationLogs.add('⚠️ Trọng tài cảnh cáo Jockey của kỵ sĩ ${sortedHorses[sortedHorses.length - 1].name} vì đi sai làn!');
      }

      // Check if any horse finished
      bool finished = activeLiveRace!.horses.any((h) => h.liveProgress >= 1.0);

      if (finished) {
        _simulationTimer?.cancel();
        _finishRaceSimulation(sortedHorses[0]);
      } else {
        notifyListeners();
      }
    });
  }

  void _finishRaceSimulation(Horse winningHorse) {
    isSimulating = false;
    simulationLogs.add('🏆 CHIẾN THẮNG! Ngựa ${winningHorse.name} (${winningHorse.code}) xuất sắc cán đích đầu tiên!');

    // Update predictions related to this race
    for (int i = 0; i < predictions.length; i++) {
      final p = predictions[i];
      if (p.raceId == activeLiveRace!.id && p.status == 'Pending') {
        if (p.predictedHorse.id == winningHorse.id) {
          int winnings = (p.betPoints * 2.5).toInt();
          userPoints += winnings;
          predictions[i] = Prediction(
            id: p.id,
            raceId: p.raceId,
            raceName: p.raceName,
            tournamentName: p.tournamentName,
            predictedHorse: p.predictedHorse,
            betPoints: p.betPoints,
            status: 'Won',
            wonPoints: winnings,
          );
          lastWonDetails = '🎉 Chúc mừng! Bạn dự đoán đúng chiến mã ${winningHorse.name} vô địch, nhận ngay +$winnings điểm thưởng!';
        } else {
          predictions[i] = Prediction(
            id: p.id,
            raceId: p.raceId,
            raceName: p.raceName,
            tournamentName: p.tournamentName,
            predictedHorse: p.predictedHorse,
            betPoints: p.betPoints,
            status: 'Lost',
          );
        }
      }
    }
    notifyListeners();
  }

  void clearLastWonDetails() {
    lastWonDetails = null;
    notifyListeners();
  }

  @override
  void dispose() {
    _simulationTimer?.cancel();
    super.dispose();
  }
}
