import 'package:flutter/material.dart';

import '../core/api/api_service.dart';
import '../core/models/app_models.dart';
import '../ui/rn_widgets.dart';

class RacesScreen extends StatefulWidget {
  const RacesScreen({super.key, required this.api});

  final ApiService api;

  @override
  State<RacesScreen> createState() => _RacesScreenState();
}

class _RacesScreenState extends State<RacesScreen> {
  List<Race>? _items;

  @override
  void initState() {
    super.initState();
    widget.api
        .getRaces()
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
      title: 'Races',
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const Text('Races', style: rnHeader20),
          const SizedBox(height: 12),
          if (_items == null) loadingText(),
          if (_items != null)
            Expanded(
              child: ListView.builder(
                itemCount: _items!.length,
                itemBuilder: (context, index) {
                  final item = _items![index];
                  return Text('${item.name} (${item.status})');
                },
              ),
            ),
        ],
      ),
    );
  }
}
