import 'package:flutter/material.dart';
import 'core/api/api_client.dart';
import 'core/api/api_service.dart';
import 'core/auth/auth_controller.dart';
import 'core/router/app_router.dart';
import 'core/storage/session_storage.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  final sessionStorage = SessionStorage();
  final apiClient = ApiClient(sessionStorage: sessionStorage);
  final apiService = ApiService(apiClient);
  final authController = AuthController(
    apiService: apiService,
    apiClient: apiClient,
    sessionStorage: sessionStorage,
  );
  await authController.bootstrap();

  runApp(HorseRacingApp(authController: authController));
}

class HorseRacingApp extends StatelessWidget {
  HorseRacingApp({super.key, required this.authController})
    : router = createAppRouter(authController);

  final AuthController authController;
  final AppRouter router;

  @override
  Widget build(BuildContext context) {
    return MaterialApp.router(
      title: 'Horse Racing Tournament',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        useMaterial3: false,
        colorScheme: ColorScheme.fromSwatch(
          primarySwatch: Colors.blue,
        ),
        scaffoldBackgroundColor: Colors.white,
        appBarTheme: const AppBarTheme(
          backgroundColor: Colors.white,
          foregroundColor: Colors.black,
          elevation: 1,
          titleTextStyle: TextStyle(
            color: Colors.black,
            fontSize: 20,
            fontWeight: FontWeight.w600,
          ),
        ),
        elevatedButtonTheme: ElevatedButtonThemeData(
          style: ElevatedButton.styleFrom(
            backgroundColor: const Color(0xFF2196F3),
            foregroundColor: Colors.white,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(2),
            ),
          ),
        ),
      ),
      routerConfig: router,
    );
  }
}
