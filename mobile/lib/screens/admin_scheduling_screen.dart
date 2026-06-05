import 'package:flutter/material.dart';

import '../ui/rn_widgets.dart';

class AdminSchedulingScreen extends StatelessWidget {
  const AdminSchedulingScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return const ScreenScaffold(
      title: 'AdminScheduling',
      child: SpacedColumn(
        children: [
          Text('Tournament & Scheduling (Admin)', style: rnHeader20),
          Text('• Quản lý thông tin giải đấu'),
          Text('• Lập lịch thi đấu chung'),
          Text('• Sắp xếp cuộc đua & vòng đua'),
          Text('• Duyệt đăng ký tham gia'),
          Text('• Phân công trọng tài'),
          Text('• Công bố kết quả & tiền thưởng'),
          Text('Placeholder để sau này gắn BE.', style: rnSecondaryText),
        ],
      ),
    );
  }
}
