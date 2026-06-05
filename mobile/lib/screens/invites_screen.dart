import 'package:flutter/material.dart';

import '../core/api/api_service.dart';
import '../core/models/app_models.dart';
import '../ui/rn_widgets.dart';

class InvitesScreen extends StatefulWidget {
  const InvitesScreen({super.key, required this.api});

  final ApiService api;

  @override
  State<InvitesScreen> createState() => _InvitesScreenState();
}

class _InvitesScreenState extends State<InvitesScreen> {
  List<Invite>? _items;

  @override
  void initState() {
    super.initState();
    widget.api
        .getInvites()
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
      title: 'Invites',
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const Text('Invites (Jockey)', style: rnHeader20),
          const SizedBox(height: 12),
          const Text(
            'Placeholder: nhận lời mời, xác nhận/từ chối…',
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
                  return Text('${item.horseName} — ${item.status}');
                },
              ),
            ),
        ],
      ),
    );
  }
}
