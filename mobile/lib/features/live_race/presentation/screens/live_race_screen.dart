import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../../core/constants/app_colors.dart';
import '../../../../core/state/mock_app_state.dart';

class LiveRaceScreen extends StatefulWidget {
  const LiveRaceScreen({super.key});

  @override
  State<LiveRaceScreen> createState() => _LiveRaceScreenState();
}

class _LiveRaceScreenState extends State<LiveRaceScreen> with SingleTickerProviderStateMixin {
  late AnimationController _pulseController;
  final ScrollController _logScrollController = ScrollController();

  @override
  void initState() {
    super.initState();
    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1000),
    )..repeat(reverse: true);
  }

  @override
  void dispose() {
    _pulseController.dispose();
    _logScrollController.dispose();
    super.dispose();
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_logScrollController.hasClients) {
        _logScrollController.animateTo(
          _logScrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final appState = Provider.of<MockAppState>(context);
    final activeRace = appState.activeLiveRace;

    // Trigger log auto-scroll during simulation
    if (appState.isSimulating) {
      _scrollToBottom();
    }

    // Trigger win popup if alert exists
    if (appState.lastWonDetails != null) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        _showCelebrationDialog(context, appState);
      });
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text('TRỰC TIẾP TRƯỜNG ĐUA'),
      ),
      body: activeRace == null
          ? const Center(
              child: Text(
                'Hiện tại không có cuộc đua nào đang diễn ra.',
                style: TextStyle(color: AppColors.textSecondary),
              ),
            )
          : Padding(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                children: [
                  // Header Block (Flashing Live indicator)
                  _buildHeaderBlock(activeRace, appState),

                  const SizedBox(height: 16),

                  // Track Leaderboard List
                  Expanded(
                    flex: 5,
                    child: Card(
                      child: Padding(
                        padding: const EdgeInsets.all(16.0),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                const Text(
                                  'BẢNG XẾP HẠNG ĐƯỜNG ĐUA',
                                  style: TextStyle(
                                    fontSize: 14,
                                    fontWeight: FontWeight.bold,
                                    color: AppColors.textPrimary,
                                    letterSpacing: 0.5,
                                  ),
                                ),
                                if (appState.isSimulating)
                                  const Text(
                                    'Đang chạy...',
                                    style: TextStyle(
                                      color: AppColors.secondary,
                                      fontWeight: FontWeight.bold,
                                      fontSize: 12,
                                    ),
                                  ),
                              ],
                            ),
                            const Divider(height: 20, color: Color(0xFF2E2E33)),
                            Expanded(
                              child: ListView.builder(
                                itemCount: activeRace.horses.length,
                                itemBuilder: (context, index) {
                                  // Sort dynamically for visual standing, but keep lists synchronized
                                  final sortedHorses = List.from(activeRace.horses);
                                  sortedHorses.sort((a, b) => b.liveProgress.compareTo(a.liveProgress));
                                  final horse = sortedHorses[index];

                                  return _buildHorseProgressRow(horse);
                                },
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),

                  const SizedBox(height: 16),

                  // Simulated logs commentary
                  Expanded(
                    flex: 3,
                    child: Card(
                      color: const Color(0xFF141416),
                      child: Padding(
                        padding: const EdgeInsets.all(16.0),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text(
                              'BLV TRỰC TUYẾN',
                              style: TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.bold,
                                color: AppColors.textSecondary,
                              ),
                            ),
                            const Divider(height: 16, color: Color(0xFF2E2E33)),
                            Expanded(
                              child: ListView.builder(
                                controller: _logScrollController,
                                itemCount: appState.simulationLogs.length,
                                itemBuilder: (context, index) {
                                  final log = appState.simulationLogs[index];
                                  return Padding(
                                    padding: const EdgeInsets.only(bottom: 6.0),
                                    child: Text(
                                      log,
                                      style: TextStyle(
                                        fontSize: 12,
                                        color: log.contains('🏆')
                                            ? AppColors.primary
                                            : (log.contains('🔔')
                                                ? AppColors.secondary
                                                : AppColors.textPrimary),
                                        fontWeight: log.contains('🏆') || log.contains('🔔')
                                            ? FontWeight.bold
                                            : FontWeight.normal,
                                      ),
                                    ),
                                  );
                                },
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),

                  const SizedBox(height: 16),

                  // Play Simulation Button
                  SizedBox(
                    width: double.infinity,
                    height: 52,
                    child: ElevatedButton.icon(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: appState.isSimulating ? Colors.grey[800] : AppColors.primary,
                        foregroundColor: appState.isSimulating ? Colors.grey : Colors.black,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(16),
                        ),
                        elevation: 4,
                      ),
                      onPressed: appState.isSimulating ? null : () => appState.startRaceSimulation(),
                      icon: appState.isSimulating
                          ? const SizedBox(
                              width: 20,
                              height: 20,
                              child: CircularProgressIndicator(strokeWidth: 2, color: Colors.grey),
                            )
                          : const Icon(Icons.play_arrow, size: 24),
                      label: Text(
                        appState.isSimulating ? 'ĐANG CHẠY GIẢ LẬP...' : 'KHỞI CHẠY GIẢ LẬP TRỰC TIẾP',
                        style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                      ),
                    ),
                  ),
                ],
              ),
            ),
    );
  }

  Widget _buildHeaderBlock(var activeRace, MockAppState appState) {
    return Card(
      color: AppColors.surface,
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Row(
          children: [
            // Flashing Live Red Dot
            FadeTransition(
              opacity: _pulseController,
              child: Container(
                width: 14,
                height: 14,
                decoration: const BoxDecoration(
                  color: AppColors.error,
                  shape: BoxShape.circle,
                  boxShadow: [
                    BoxShadow(color: AppColors.error, blurRadius: 8, spreadRadius: 2),
                  ],
                ),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    activeRace.name,
                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    'Cự ly: ${activeRace.distance} • Saitama Turf Course',
                    style: const TextStyle(color: AppColors.textSecondary, fontSize: 12),
                  ),
                ],
              ),
            ),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
              decoration: BoxDecoration(
                color: AppColors.secondary.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(12),
              ),
              child: const Text(
                'LIVE',
                style: TextStyle(
                  color: AppColors.secondary,
                  fontWeight: FontWeight.bold,
                  fontSize: 12,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildHorseProgressRow(var horse) {
    // Generate placement colors (Gold, Silver, Bronze, standard)
    Color medalColor;
    String positionText;
    
    switch (horse.livePosition) {
      case 1:
        medalColor = AppColors.primary;
        positionText = '1st';
        break;
      case 2:
        medalColor = const Color(0xFFC0C0C0); // Silver
        positionText = '2nd';
        break;
      case 3:
        medalColor = const Color(0xFFCD7F32); // Bronze
        positionText = '3rd';
        break;
      default:
        medalColor = AppColors.textMuted;
        positionText = '${horse.livePosition}th';
    }

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8.0),
      child: Column(
        children: [
          Row(
            children: [
              // Position Medal indicator
              Container(
                width: 32,
                height: 32,
                decoration: BoxDecoration(
                  color: medalColor.withValues(alpha: 0.15),
                  shape: BoxShape.circle,
                  border: Border.all(color: medalColor, width: 1.5),
                ),
                child: Center(
                  child: Text(
                    positionText,
                    style: TextStyle(
                      color: medalColor,
                      fontWeight: FontWeight.bold,
                      fontSize: 11,
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          horse.name,
                          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                        ),
                        Text(
                          'Jockey: ${horse.jockey.name}',
                          style: const TextStyle(color: AppColors.textSecondary, fontSize: 11),
                        ),
                      ],
                    ),
                    const SizedBox(height: 6),
                    // Progress Bar
                    ClipRRect(
                      borderRadius: BorderRadius.circular(4),
                      child: Stack(
                        children: [
                          Container(
                            height: 8,
                            color: AppColors.surfaceLight,
                          ),
                          AnimatedContainer(
                            duration: const Duration(milliseconds: 500),
                            height: 8,
                            width: MediaQuery.of(context).size.width * 0.65 * horse.liveProgress,
                            decoration: BoxDecoration(
                              gradient: LinearGradient(
                                colors: [
                                  medalColor.withValues(alpha: 0.5),
                                  medalColor,
                                ],
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  void _showCelebrationDialog(BuildContext context, MockAppState appState) {
    final details = appState.lastWonDetails!;
    
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => AlertDialog(
        backgroundColor: AppColors.surface,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.emoji_events, size: 72, color: AppColors.primary),
            const SizedBox(height: 16),
            const Text(
              'THẮNG DỰ ĐOÁN!',
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
                color: AppColors.textPrimary,
              ),
            ),
            const SizedBox(height: 12),
            Text(
              details,
              textAlign: TextAlign.center,
              style: const TextStyle(color: AppColors.textSecondary, fontSize: 14),
            ),
            const SizedBox(height: 24),
            ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primary,
                foregroundColor: Colors.black,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
              ),
              onPressed: () {
                appState.clearLastWonDetails();
                Navigator.of(context).pop();
              },
              child: const Text(
                'Tuyệt vời!',
                style: TextStyle(fontWeight: FontWeight.bold),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
