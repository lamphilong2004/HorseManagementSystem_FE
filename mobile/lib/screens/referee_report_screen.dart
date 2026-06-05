import 'package:flutter/material.dart';

import '../ui/rn_widgets.dart';

class RefereeReportScreen extends StatelessWidget {
  const RefereeReportScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return const ScreenScaffold(
      title: 'RefereeReport',
      child: SpacedColumn(
        children: [
          Text('Referee Report', style: rnHeader20),
          Text('Placeholder: lập biên bản thi đấu.', style: rnSecondaryText),
        ],
      ),
    );
  }
}
