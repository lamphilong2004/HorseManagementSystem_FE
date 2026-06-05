import 'package:flutter/material.dart';

import '../core/api/api_service.dart';
import '../core/models/app_models.dart';
import '../ui/rn_widgets.dart';

class TournamentsScreen extends StatefulWidget {
  const TournamentsScreen({super.key, required this.api});

  final ApiService api;

  @override
  State<TournamentsScreen> createState() => _TournamentsScreenState();
}

class _TournamentsScreenState extends State<TournamentsScreen> {
  List<Tournament>? _items;

  @override
  void initState() {
    super.initState();
    widget.api
        .getTournaments()
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
      title: 'Tournaments',
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const Text('Tournaments', style: rnHeader20),
          const SizedBox(height: 12),
          if (_items == null) loadingText(),
          if (_items != null)
            Expanded(
              child: ListView.builder(
                itemCount: _items!.length,
                itemBuilder: (context, index) {
                  final item = _items![index];
                  return Text('${item.name} (${item.location})');
                },
              ),
            ),
        ],
      ),
    );
  }
}
