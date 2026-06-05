import 'package:flutter/material.dart';

import '../core/api/api_service.dart';
import '../ui/rn_widgets.dart';

class NotificationsScreen extends StatefulWidget {
  const NotificationsScreen({super.key, required this.api});

  final ApiService api;

  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> {
  List<Map<String, dynamic>>? _items;

  @override
  void initState() {
    super.initState();
    widget.api
        .getNotifications()
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
      title: 'Notifications',
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const Text('Notifications', style: rnHeader20),
          const SizedBox(height: 12),
          const Text(
            'Thông báo kết quả dự đoán và giải thưởng.',
            style: rnSecondaryText,
          ),
          const SizedBox(height: 12),
          if (_items == null) loadingText(),
          if (_items != null && _items!.isEmpty)
            const Text('Không có thông báo nào.', style: rnSecondaryText),
          if (_items != null && _items!.isNotEmpty)
            Expanded(
              child: ListView.builder(
                itemCount: _items!.length,
                itemBuilder: (context, index) {
                  final item = _items![index];
                  return Padding(
                    padding: const EdgeInsets.symmetric(vertical: 4),
                    child: Text(
                      '${item['title'] ?? item['type']} — ${item['message']}',
                    ),
                  );
                },
              ),
            ),
        ],
      ),
    );
  }
}
