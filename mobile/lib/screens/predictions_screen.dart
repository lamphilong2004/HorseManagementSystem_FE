import 'package:flutter/material.dart';

import '../core/api/api_service.dart';
import '../core/models/app_models.dart';
import '../ui/rn_widgets.dart';

class PredictionsScreen extends StatefulWidget {
  const PredictionsScreen({super.key, required this.api});

  final ApiService api;

  @override
  State<PredictionsScreen> createState() => _PredictionsScreenState();
}

class _PredictionsScreenState extends State<PredictionsScreen> {
  List<Prediction>? _items;

  @override
  void initState() {
    super.initState();
    widget.api
        .getPredictions()
        .then((items) {
          if (mounted) setState(() => _items = items);
        })
        .catchError((_) {
          if (mounted) setState(() => _items = []);
        });
  }

  @override
  Widget build(BuildContext context) {
    return ScreenScaffold(
      title: 'Predictions',
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const Text('Predictions (Spectator)', style: rnHeader20),
          const SizedBox(height: 12),
          const Text(
            'Placeholder: dự đoán, theo dõi kết quả, nhận thưởng…',
            style: rnSecondaryText,
          ),
          const SizedBox(height: 12),
          if (_items == null) loadingText(),
          if (_items != null)
            Expanded(
              child: ListView.builder(
                itemCount: _items!.length,
                itemBuilder: (context, index) {
                  final item = _items![index];
                  return Text(
                    'Race ${item.raceId}: ${item.pickedHorseName} — ${item.status}',
                  );
                },
              ),
            ),
        ],
      ),
    );
  }
}
