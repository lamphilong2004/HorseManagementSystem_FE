import 'package:flutter/material.dart';

import '../core/api/api_service.dart';
import '../core/models/app_models.dart';
import '../ui/rn_widgets.dart';

class RaceResultsScreen extends StatefulWidget {
  const RaceResultsScreen({super.key, required this.api});

  final ApiService api;

  @override
  State<RaceResultsScreen> createState() => _RaceResultsScreenState();
}

class _RaceResultsScreenState extends State<RaceResultsScreen> {
  List<Race> _races = [];
  String? _selectedRaceId;
  Map<String, dynamic>? _results;

  @override
  void initState() {
    super.initState();
    widget.api
        .getRaces()
        .then((items) {
          if (mounted) setState(() => _races = items);
        })
        .catchError((_) {
          if (mounted) setState(() => _races = []);
        });
  }

  @override
  Widget build(BuildContext context) {
    final resultItems = _results?['results'];

    return ScreenScaffold(
      title: 'Race Results',
      child: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const Text('Race Results', style: rnHeader20),
            const SizedBox(height: 12),
            const Text('Chọn cuộc đua để xem kết quả.', style: rnSecondaryText),
            const SizedBox(height: 12),
            ..._races.map(
              (race) => selectableTextRow(
                text: '${race.name} (${race.status})',
                selected: _selectedRaceId == race.id,
                onTap: () => _selectRace(race.id),
              ),
            ),
            if (_selectedRaceId != null && _results != null)
              ...[
                const SizedBox(height: 12),
                Text(
                  'Kết quả: ${_results!['raceName'] ?? ''}',
                  style: const TextStyle(fontWeight: FontWeight.w700),
                ),
                if (resultItems is List && resultItems.isNotEmpty)
                  ...resultItems.whereType<Map>().map((item) {
                    final horseId = item['horseId'];
                    final jockeyId = item['jockeyId'];
                    final horseName = horseId is Map
                        ? horseId['name']?.toString() ?? 'N/A'
                        : 'N/A';
                    final jockeyName = jockeyId is Map
                        ? jockeyId['fullName']?.toString() ?? 'N/A'
                        : 'N/A';
                    return Text(
                      '#${item['position']} — $horseName ($jockeyName)',
                    );
                  })
                else
                  const Text('Chưa có kết quả.', style: rnSecondaryText),
              ],
          ],
        ),
      ),
    );
  }

  void _selectRace(String raceId) {
    setState(() {
      _selectedRaceId = raceId;
      _results = null;
    });
    widget.api
        .getRaceResults(raceId)
        .then((results) {
          if (mounted && _selectedRaceId == raceId) {
            setState(() => _results = results);
          }
        })
        .catchError((_) {
          if (mounted && _selectedRaceId == raceId) {
            setState(() => _results = {'results': []});
          }
        });
  }
}
