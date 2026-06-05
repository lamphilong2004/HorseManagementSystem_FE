import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../core/api/api_client.dart';
import '../core/auth/auth_controller.dart';
import '../core/models/app_models.dart';
import '../ui/rn_widgets.dart';

const _loginRoles = [
  (value: Role.owner, label: 'Horse Owner'),
  (value: Role.jockey, label: 'Jockey'),
  (value: Role.referee, label: 'Race Referee'),
  (value: Role.spectator, label: 'Spectator'),
  (value: Role.admin, label: 'Admin'),
];

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key, required this.auth});

  final AuthController auth;

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  Role _role = Role.spectator;
  bool _loading = false;

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return ScreenScaffold(
      title: 'Login',
      child: SpacedColumn(
        scrollable: true,
        children: [
          const Text('Login', style: rnHeader28),
          const Text(
            'Dev mode: chọn role để mô phỏng đăng nhập.',
            style: rnSecondaryText,
          ),
          const Text('Email'),
          TextField(
            controller: _emailController,
            keyboardType: TextInputType.emailAddress,
            textCapitalization: TextCapitalization.none,
            decoration: rnInputDecoration(),
          ),
          const Text('Password'),
          TextField(
            controller: _passwordController,
            obscureText: true,
            decoration: rnInputDecoration(),
          ),
          const Text('Role'),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: _loginRoles
                .map(
                  (role) => rnButton(
                    title: role.value == _role ? '✓ ${role.label}' : role.label,
                    onPressed: () => setState(() => _role = role.value),
                    fullWidth: false,
                  ),
                )
                .toList(),
          ),
          rnButton(
            title: _loading ? 'Logging in…' : 'Login',
            onPressed: _loading ? null : _handleLogin,
          ),
          rnButton(
            title: 'Register',
            onPressed: () => context.pushNamed('Register'),
          ),
        ],
      ),
    );
  }

  Future<void> _handleLogin() async {
    setState(() => _loading = true);
    try {
      await widget.auth.login(
        email: _emailController.text,
        password: _passwordController.text,
        role: _role,
      );
    } catch (error) {
      if (!mounted) return;
      final message = error is ApiException ? error.message : 'Login failed';
      await showRnAlert(context, 'Error', message);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }
}
