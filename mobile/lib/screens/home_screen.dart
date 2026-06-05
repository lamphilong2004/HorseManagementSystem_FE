import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../core/auth/auth_controller.dart';
import '../core/models/app_models.dart';
import '../ui/rn_widgets.dart';

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key, required this.auth});

  final AuthController auth;

  @override
  Widget build(BuildContext context) {
    final session = auth.session;
    if (session == null) {
      return const ScreenScaffold(title: 'Home', child: SizedBox.shrink());
    }

    return ScreenScaffold(
      title: 'Home',
      child: SpacedColumn(
        children: [
          const Text('Horse Racing', style: rnHeader22),
          Text(
            '${session.user.name} (${session.user.role.value})',
            style: rnSecondaryText,
          ),
          ..._roleButtons(session.user.role).map(
            (route) => rnButton(
              title: route,
              onPressed: () => context.pushNamed(route),
            ),
          ),
          rnButton(
            title: 'Logout',
            onPressed: () {
              auth.logout();
            },
          ),
        ],
      ),
    );
  }

  List<String> _roleButtons(Role role) {
    const common = ['Tournaments', 'Races'];
    return switch (role) {
      Role.owner => [...common, 'Horses'],
      Role.jockey => [...common, 'Invites'],
      Role.spectator => [
        ...common,
        'Predictions',
        'PlacePrediction',
        'RaceResults',
        'Leaderboard',
        'Notifications',
      ],
      Role.referee => [...common, 'RefereeRaces', 'RefereeReport'],
      Role.admin => [...common, 'AdminUsers', 'AdminScheduling'],
    };
  }
}
