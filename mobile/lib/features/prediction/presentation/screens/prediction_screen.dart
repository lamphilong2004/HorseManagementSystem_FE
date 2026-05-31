import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../../core/constants/app_colors.dart';
import '../../../../core/state/mock_app_state.dart';
import '../../../home/domain/models/tournament_model.dart';

class PredictionScreen extends StatefulWidget {
  const PredictionScreen({super.key});

  @override
  State<PredictionScreen> createState() => _PredictionScreenState();
}

class _PredictionScreenState extends State<PredictionScreen> {
  int selectedBetAmount = 1000;

  @override
  Widget build(BuildContext context) {
    final appState = Provider.of<MockAppState>(context);
    final activeTournament = appState.tournaments.firstWhere((t) => t.status == 'Live');
    final activeRace = activeTournament.races.firstWhere((r) => r.status == 'Pending');

    return Scaffold(
      appBar: AppBar(
        title: const Text('DỰ ĐOÁN KẾT QUẢ'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Current Balance View
            _buildBalanceCard(appState),

            const SizedBox(height: 24),

            // Active Race betting card
            Text(
              'CƯỢC TRẬN ĐUA TIẾP THEO',
              style: Theme.of(context).textTheme.titleLarge?.copyWith(
                    fontSize: 14,
                    fontWeight: FontWeight.bold,
                    letterSpacing: 0.5,
                    color: AppColors.textPrimary,
                  ),
            ),
            const SizedBox(height: 12),
            _buildActiveRaceBettingCard(context, activeRace, activeTournament, appState),

            const SizedBox(height: 24),

            // Prediction History List
            Text(
              'LỊCH SỬ DỰ ĐOÁN',
              style: Theme.of(context).textTheme.titleLarge?.copyWith(
                    fontSize: 14,
                    fontWeight: FontWeight.bold,
                    letterSpacing: 0.5,
                    color: AppColors.textPrimary,
                  ),
            ),
            const SizedBox(height: 12),
            _buildPredictionHistoryList(appState),
          ],
        ),
      ),
    );
  }

  Widget _buildBalanceCard(MockAppState appState) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0xFF2E2E33)),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: AppColors.primary.withValues(alpha: 0.1),
              shape: BoxShape.circle,
            ),
            child: const Icon(Icons.account_balance_wallet, color: AppColors.primary, size: 28),
          ),
          const SizedBox(width: 16),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Số dư điểm ảo của bạn:',
                style: TextStyle(color: AppColors.textSecondary, fontSize: 13),
              ),
              const SizedBox(height: 2),
              Text(
                '${appState.userPoints} PTS',
                style: const TextStyle(
                  color: AppColors.textPrimary,
                  fontSize: 22,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildActiveRaceBettingCard(
      BuildContext context, Race race, Tournament tournament, MockAppState appState) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  race.name,
                  style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: AppColors.primary.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    race.time,
                    style: const TextStyle(
                      color: AppColors.primary,
                      fontSize: 11,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 4),
            Text(
              'Giải đấu: ${tournament.title} • Cự ly: ${race.distance}',
              style: const TextStyle(color: AppColors.textSecondary, fontSize: 12),
            ),
            const Divider(height: 24, color: Color(0xFF2E2E33)),
            const Text(
              'Chọn chiến mã để đặt cược (Top 1):',
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.bold,
                color: AppColors.textSecondary,
              ),
            ),
            const SizedBox(height: 12),
            ListView.builder(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: race.horses.length,
              itemBuilder: (context, index) {
                final horse = race.horses[index];
                return Padding(
                  padding: const EdgeInsets.only(bottom: 10.0),
                  child: Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: AppColors.surfaceLight,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: const Color(0xFF33333A)),
                    ),
                    child: Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(6),
                          decoration: BoxDecoration(
                            color: AppColors.primary.withValues(alpha: 0.1),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Text(
                            horse.code,
                            style: const TextStyle(
                              color: AppColors.primary,
                              fontWeight: FontWeight.bold,
                              fontSize: 11,
                            ),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                horse.name,
                                style: const TextStyle(
                                  fontWeight: FontWeight.bold,
                                  fontSize: 13,
                                  color: AppColors.textPrimary,
                                ),
                              ),
                              Text(
                                'Kỵ sĩ: ${horse.jockey.name} • Tỷ lệ thắng: ${horse.jockey.winRate}%',
                                style: const TextStyle(color: AppColors.textSecondary, fontSize: 11),
                              ),
                            ],
                          ),
                        ),
                        ElevatedButton(
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppColors.primary,
                            foregroundColor: Colors.black,
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(8),
                            ),
                            padding: const EdgeInsets.symmetric(horizontal: 16),
                          ),
                          onPressed: () => _showPlaceBetDialog(context, race, tournament, horse, appState),
                          child: const Text(
                            'Đặt',
                            style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12),
                          ),
                        ),
                      ],
                    ),
                  ),
                );
              },
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPredictionHistoryList(MockAppState appState) {
    if (appState.predictions.isEmpty) {
      return const Center(
        child: Padding(
          padding: EdgeInsets.all(24.0),
          child: Text(
            'Chưa có lịch sử dự đoán.',
            style: TextStyle(color: AppColors.textSecondary),
          ),
        ),
      );
    }

    return ListView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      itemCount: appState.predictions.length,
      itemBuilder: (context, index) {
        final prediction = appState.predictions[index];
        final isWon = prediction.status == 'Won';
        final isPending = prediction.status == 'Pending';

        Color badgeColor;
        String statusText;

        if (isPending) {
          badgeColor = AppColors.warning;
          statusText = 'ĐANG ĐỢI';
        } else if (isWon) {
          badgeColor = AppColors.success;
          statusText = 'THẮNG';
        } else {
          badgeColor = AppColors.textMuted;
          statusText = 'THUA';
        }

        return Card(
          margin: const EdgeInsets.only(bottom: 12),
          child: Padding(
            padding: const EdgeInsets.all(16.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: badgeColor.withValues(alpha: 0.15),
                        borderRadius: BorderRadius.circular(6),
                        border: Border.all(color: badgeColor, width: 1),
                      ),
                      child: Text(
                        statusText,
                        style: TextStyle(
                          color: badgeColor,
                          fontWeight: FontWeight.bold,
                          fontSize: 10,
                        ),
                      ),
                    ),
                    Text(
                      isWon ? '+${prediction.wonPoints} PTS' : '-${prediction.betPoints} PTS',
                      style: TextStyle(
                        color: isWon ? AppColors.success : AppColors.textMuted,
                        fontWeight: FontWeight.bold,
                        fontSize: 14,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                Text(
                  prediction.raceName,
                  style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
                ),
                Text(
                  'Giải: ${prediction.tournamentName}',
                  style: const TextStyle(color: AppColors.textSecondary, fontSize: 11),
                ),
                const Divider(height: 16, color: Color(0xFF2E2E33)),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'Ngựa chọn cược: ${prediction.predictedHorse.name} (${prediction.predictedHorse.code})',
                      style: const TextStyle(fontSize: 12, color: AppColors.textSecondary),
                    ),
                    Text(
                      'Đặt: ${prediction.betPoints} PTS',
                      style: const TextStyle(
                        fontWeight: FontWeight.w600,
                        fontSize: 12,
                        color: AppColors.textPrimary,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  void _showPlaceBetDialog(
      BuildContext context, Race race, Tournament tournament, Horse horse, MockAppState appState) {
    int localBet = 1000;
    
    showDialog(
      context: context,
      builder: (context) => StatefulBuilder(
        builder: (context, setDialogState) => AlertDialog(
          backgroundColor: AppColors.surface,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
          title: const Text(
            'Xác nhận dự đoán',
            style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
          ),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Chiến mã: ${horse.name} (${horse.code})',
                style: const TextStyle(fontWeight: FontWeight.bold, color: AppColors.primary),
              ),
              const SizedBox(height: 4),
              Text(
                'Trận: ${race.name} • Cự ly: ${race.distance}',
                style: const TextStyle(color: AppColors.textSecondary, fontSize: 12),
              ),
              const Divider(height: 20, color: Color(0xFF2E2E33)),
              const Text(
                'Số điểm muốn cược (PTS):',
                style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12),
              ),
              const SizedBox(height: 8),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceAround,
                children: [500, 1000, 2000].map((amount) {
                  final isSelected = localBet == amount;
                  return GestureDetector(
                    onTap: () {
                      setDialogState(() {
                        localBet = amount;
                      });
                    },
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                      decoration: BoxDecoration(
                        color: isSelected ? AppColors.primary : AppColors.surfaceLight,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        '$amount',
                        style: TextStyle(
                          color: isSelected ? Colors.black : AppColors.textPrimary,
                          fontWeight: FontWeight.bold,
                          fontSize: 13,
                        ),
                      ),
                    ),
                  );
                }).toList(),
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(context).pop(),
              child: const Text('Hủy', style: TextStyle(color: AppColors.textSecondary)),
            ),
            ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primary,
                foregroundColor: Colors.black,
              ),
              onPressed: () {
                if (appState.userPoints < localBet) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Không đủ điểm để đặt cược!')),
                  );
                  return;
                }
                appState.placePrediction(race, tournament, horse, localBet);
                Navigator.of(context).pop();
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(content: Text('Đã đặt cược $localBet PTS thành công!')),
                );
              },
              child: const Text('Đặt cược', style: TextStyle(fontWeight: FontWeight.bold)),
            ),
          ],
        ),
      ),
    );
  }
}
