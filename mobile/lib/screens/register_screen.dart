import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../core/api/api_client.dart';
import '../core/auth/auth_controller.dart';
import '../core/models/app_models.dart';
import '../ui/rn_widgets.dart';

const _registerRoles = [
  (value: Role.owner, label: 'Horse Owner'),
  (value: Role.jockey, label: 'Jockey'),
  (value: Role.referee, label: 'Race Referee'),
  (value: Role.spectator, label: 'Spectator'),
];

class RegisterScreen extends StatefulWidget {
  const RegisterScreen({super.key, required this.auth});

  final AuthController auth;

  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  final _nameController = TextEditingController();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  Role _role = Role.spectator;
  bool _loading = false;

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return ScreenScaffold(
      title: 'Register',
      child: SpacedColumn(
        scrollable: true,
        children: [
          const Text('Register', style: rnHeader28),
          const Text('Name'),
          TextField(
            controller: _nameController,
            decoration: rnInputDecoration(),
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
          ..._registerRoles.map(
            (role) => rnButton(
              title: role.value == _role ? '✓ ${role.label}' : role.label,
              onPressed: () => setState(() => _role = role.value),
            ),
          ),
          rnButton(
            title: _loading ? 'Creating…' : 'Create account',
            onPressed: _loading ? null : _handleRegister,
          ),
          rnButton(
            title: 'Back to login',
            onPressed: () => context.goNamed('Login'),
          ),
        ],
      ),
    );
  }

  Future<void> _handleRegister() async {
    setState(() => _loading = true);
    try {
      await widget.auth.register(
        name: _nameController.text,
        email: _emailController.text,
        password: _passwordController.text,
        role: _role,
      );
    } catch (error) {
      if (!mounted) return;
      final message = error is ApiException
          ? error.message
          : 'Create account failed';
      await showRnAlert(context, 'Error', message);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }
}
