import 'package:flutter/material.dart';

import '../core/api/api_service.dart';
import '../core/models/app_models.dart';
import '../ui/rn_widgets.dart';

class RefereeRacesScreen extends StatefulWidget {
  const RefereeRacesScreen({super.key, required this.api});

  final ApiService api;

  @override
  State<RefereeRacesScreen> createState() => _RefereeRacesScreenState();
}

class _RefereeRacesScreenState extends State<RefereeRacesScreen> {
  List<Race>? _items;

  @override
  void initState() {
    super.initState();
    widget.api
        .getRefereeRaces()
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
      title: 'RefereeRaces',
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const Text('Race Operations (Referee)', style: rnHeader20),
          const SizedBox(height: 12),
          const Text(
            'Placeholder: kiểm tra, theo dõi, vi phạm, xác nhận kết quả…',
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
                  return Text('${item.name} — ${item.status}');
                },
              ),
            ),
        ],
      ),
    );
  }
}
