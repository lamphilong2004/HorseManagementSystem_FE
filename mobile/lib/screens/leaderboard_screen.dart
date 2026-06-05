import 'package:flutter/material.dart';

import '../core/api/api_service.dart';
import '../core/models/app_models.dart';
import '../ui/rn_widgets.dart';

class LeaderboardScreen extends StatefulWidget {
  const LeaderboardScreen({super.key, required this.api});

  final ApiService api;

  @override
  State<LeaderboardScreen> createState() => _LeaderboardScreenState();
}

class _LeaderboardScreenState extends State<LeaderboardScreen> {
  List<Tournament> _tournaments = [];
  String? _selectedId;
  Map<String, dynamic>? _leaderboard;

  @override
  void initState() {
    super.initState();
    widget.api
        .getTournaments()
        .then((items) {
          if (mounted) setState(() => _tournaments = items);
        })
        .catchError((_) {
          if (mounted) setState(() => _tournaments = []);
        });
  }

  @override
  Widget build(BuildContext context) {
    final entries = _leaderboard?['leaderboard'];

    return ScreenScaffold(
      title: 'Leaderboard',
      child: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const Text('Leaderboard', style: rnHeader20),
            const SizedBox(height: 12),
            const Text('Bảng xếp hạng theo giải đấu.', style: rnSecondaryText),
            const SizedBox(height: 12),
            const Text('Chọn giải đấu:', style: rnSemiBoldText),
            ..._tournaments.map(
              (tournament) => selectableTextRow(
                text: tournament.name,
                selected: _selectedId == tournament.id,
                onTap: () => _selectTournament(tournament.id),
              ),
            ),
            if (_selectedId != null && _leaderboard != null)
              ...[
                const SizedBox(height: 12),
                const Text(
                  'Xếp hạng:',
                  style: TextStyle(fontWeight: FontWeight.w700),
                ),
                if (entries is List && entries.isNotEmpty)
                  ...entries.asMap().entries.map((entry) {
                    final item = entry.value;
                    if (item is! Map) return const SizedBox.shrink();
                    return Text(
                      '#${entry.key + 1} ${item['horseName']} — Wins: ${item['wins']} | Prize: ${_toLocaleString(item['totalPrize'])}',
                    );
                  })
                else
                  const Text('Chưa có dữ liệu.', style: rnSecondaryText),
              ],
          ],
        ),
      ),
    );
  }

  void _selectTournament(String tournamentId) {
    setState(() {
      _selectedId = tournamentId;
      _leaderboard = null;
    });
    widget.api
        .getTournamentLeaderboard(tournamentId)
        .then((leaderboard) {
          if (mounted && _selectedId == tournamentId) {
            setState(() => _leaderboard = leaderboard);
          }
        })
        .catchError((_) {
          if (mounted && _selectedId == tournamentId) {
            setState(() => _leaderboard = {'leaderboard': []});
          }
        });
  }

  String _toLocaleString(Object? value) {
    if (value == null) return '';
    final text = value.toString();
    final number = num.tryParse(text);
    if (number == null) return text;
    final parts = number.toStringAsFixed(number.truncateToDouble() == number ? 0 : 2)
        .split('.');
    final chars = parts.first.split('').reversed.toList();
    final grouped = <String>[];
    for (var index = 0; index < chars.length; index++) {
      if (index != 0 && index % 3 == 0) grouped.add(',');
      grouped.add(chars[index]);
    }
    final integer = grouped.reversed.join();
    return parts.length == 1 ? integer : '$integer.${parts[1]}';
  }
}
