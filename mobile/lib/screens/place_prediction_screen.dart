import 'package:flutter/material.dart';

import '../core/api/api_client.dart';
import '../core/api/api_service.dart';
import '../core/models/app_models.dart';
import '../ui/rn_widgets.dart';

class PlacePredictionScreen extends StatefulWidget {
  const PlacePredictionScreen({super.key, required this.api});

  final ApiService api;

  @override
  State<PlacePredictionScreen> createState() => _PlacePredictionScreenState();
}

class _PlacePredictionScreenState extends State<PlacePredictionScreen> {
  final _betAmountController = TextEditingController();
  List<Race> _races = [];
  String? _selectedRaceId;
  bool? _isOpen;
  List<RaceHorse> _horses = [];
  String? _selectedHorseId;
  bool _loading = false;

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
  void dispose() {
    _betAmountController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return ScreenScaffold(
      title: 'Place Prediction',
      child: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const Text('Place Prediction', style: rnHeader20),
            const SizedBox(height: 12),
            const Text(
              'Chọn cuộc đua và ngựa để đặt dự đoán.',
              style: rnSecondaryText,
            ),
            const SizedBox(height: 12),
            const Text('1. Chọn cuộc đua:', style: rnSemiBoldText),
            ..._races.map(
              (race) => selectableTextRow(
                text: '${race.name} (${race.status})',
                selected: _selectedRaceId == race.id,
                onTap: () => _selectRace(race.id),
              ),
            ),
            if (_selectedRaceId != null && _isOpen == false)
              const Padding(
                padding: EdgeInsets.only(top: 8),
                child: Text('Cuộc đua đã đóng cược.', style: TextStyle(color: Colors.red)),
              ),
            if (_selectedRaceId != null && _isOpen == true && _horses.isNotEmpty)
              ...[
                const SizedBox(height: 12),
                const Text('2. Chọn ngựa:', style: rnSemiBoldText),
                ..._horses.map(
                  (horse) => selectableTextRow(
                    text: horse.name,
                    selected: _selectedHorseId == horse.id,
                    onTap: () => setState(() => _selectedHorseId = horse.id),
                  ),
                ),
                const SizedBox(height: 12),
                const Text(
                  '3. Số tiền (100,000 - 10,000,000):',
                  style: rnSemiBoldText,
                ),
                const SizedBox(height: 4),
                TextField(
                  controller: _betAmountController,
                  keyboardType: TextInputType.number,
                  decoration: rnInputDecoration(hintText: '500000'),
                  onChanged: (_) => setState(() {}),
                ),
                const SizedBox(height: 12),
                rnButton(
                  title: _loading ? 'Đang đặt...' : 'Đặt dự đoán',
                  onPressed: _loading ||
                          _selectedHorseId == null ||
                          _betAmountController.text.isEmpty
                      ? null
                      : _handlePlace,
                ),
              ],
          ],
        ),
      ),
    );
  }

  void _selectRace(String raceId) {
    setState(() {
      _selectedRaceId = raceId;
      _isOpen = null;
      _horses = [];
      _selectedHorseId = null;
    });

    widget.api
        .checkRaceOpenForPrediction(raceId)
        .then((data) {
          if (mounted && _selectedRaceId == raceId) {
            setState(() => _isOpen = data['isOpen'] == true);
          }
        })
        .catchError((_) {});

    widget.api
        .getRaceHorses(raceId)
        .then((items) {
          if (mounted && _selectedRaceId == raceId) {
            setState(() => _horses = items);
          }
        })
        .catchError((_) {});
  }

  Future<void> _handlePlace() async {
    if (_selectedRaceId == null ||
        _selectedHorseId == null ||
        _betAmountController.text.isEmpty) {
      await showRnAlert(context, 'Error', 'Vui lòng chọn đầy đủ');
      return;
    }

    setState(() => _loading = true);
    try {
      await widget.api.placePrediction(
        raceId: _selectedRaceId!,
        horseId: _selectedHorseId!,
        betAmount: int.tryParse(_betAmountController.text) ?? 0,
      );
      if (!mounted) return;
      showRnAlert(context, 'Success', 'Đặt dự đoán thành công!');
      setState(() {
        _selectedRaceId = null;
        _selectedHorseId = null;
        _isOpen = null;
        _horses = [];
        _betAmountController.clear();
      });
    } catch (error) {
      if (!mounted) return;
      final message = error is ApiException ? error.message : 'Failed';
      await showRnAlert(context, 'Error', message);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }
}
