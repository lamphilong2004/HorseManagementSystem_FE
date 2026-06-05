import 'package:flutter/material.dart';

import '../core/api/api_service.dart';
import '../core/models/app_models.dart';
import '../ui/rn_widgets.dart';

class AdminUsersScreen extends StatefulWidget {
  const AdminUsersScreen({super.key, required this.api});

  final ApiService api;

  @override
  State<AdminUsersScreen> createState() => _AdminUsersScreenState();
}

class _AdminUsersScreenState extends State<AdminUsersScreen> {
  List<AdminUser>? _items;

  @override
  void initState() {
    super.initState();
    widget.api
        .getAdminUsers()
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
      title: 'AdminUsers',
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const Text('User Management (Admin)', style: rnHeader20),
          const SizedBox(height: 12),
          const Text(
            'Placeholder: quản lý tài khoản & phân quyền.',
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
                  return Text('${item.name} — ${item.role.value}');
                },
              ),
            ),
        ],
      ),
    );
  }
}
