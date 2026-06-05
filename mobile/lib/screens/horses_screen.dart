import 'package:flutter/material.dart';

import '../core/api/api_service.dart';
import '../core/models/app_models.dart';
import '../ui/rn_widgets.dart';

class HorsesScreen extends StatefulWidget {
  const HorsesScreen({super.key, required this.api});

  final ApiService api;

  @override
  State<HorsesScreen> createState() => _HorsesScreenState();
}

class _HorsesScreenState extends State<HorsesScreen> {
  List<Horse>? _items;

  @override
  void initState() {
    super.initState();
    widget.api
        .getHorses()
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
      title: 'Horses',
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const Text('Horses (Owner)', style: rnHeader20),
          const SizedBox(height: 12),
          const Text(
            'Placeholder: quản lý thông tin ngựa, đăng ký, chọn/thuê jockey…',
            style: rnSecondaryText,
          ),
          const SizedBox(height: 12),
          if (_items == null) loadingText(),
          if (_items != null)
            Expanded(
              child: ListView.builder(
                itemCount: _items!.length,
                itemBuilder: (context, index) => Text(_items![index].name),
              ),
            ),
        ],
      ),
    );
  }
}
