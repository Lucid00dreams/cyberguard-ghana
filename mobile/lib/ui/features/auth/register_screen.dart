import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/theme/app_theme.dart';
import '../../../data/services/auth_service.dart';

class RegisterScreen extends StatefulWidget {
  const RegisterScreen({super.key});

  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  final _nameController = TextEditingController();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  String _selectedRole = 'STUDENT';
  String _selectedAgeBand = '12-18';
  bool _obscurePassword = true;
  String? _errorMessage;

  Future<void> _handleRegister() async {
    setState(() => _errorMessage = null);
    final name = _nameController.text.trim();
    final email = _emailController.text.trim();
    final password = _passwordController.text;

    if (name.isEmpty || email.isEmpty || password.isEmpty) {
      setState(() => _errorMessage = 'Please complete all required fields.');
      return;
    }

    Haptics.medium();
    final auth = context.read<AuthService>();
    final success = await auth.register(
      name: name,
      email: email,
      password: password,
      role: _selectedRole,
      ageBand: _selectedAgeBand,
    );

    if (success && mounted) {
      Navigator.of(context).pop();
    } else if (mounted) {
      setState(() => _errorMessage = 'Registration could not be completed.');
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthService>();

    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded, size: 20),
          onPressed: () => Navigator.of(context).pop(),
        ),
        title: const Text('Create Account'),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Hero Students Banner
              Container(
                margin: const EdgeInsets.only(bottom: 18),
                height: 120,
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(18),
                  image: const DecorationImage(
                    image: AssetImage('assets/images/hero-students.png'),
                    fit: BoxFit.cover,
                  ),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.06),
                      blurRadius: 10,
                      offset: const Offset(0, 4),
                    ),
                  ],
                ),
                child: Container(
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(18),
                    gradient: LinearGradient(
                      begin: Alignment.topCenter,
                      end: Alignment.bottomCenter,
                      colors: [
                        Colors.black.withOpacity(0.1),
                        Colors.black.withOpacity(0.7),
                      ],
                    ),
                  ),
                  padding: const EdgeInsets.all(14),
                  alignment: Alignment.bottomLeft,
                  child: const Text(
                    'Student & Educator Registration',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 15,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                ),
              ),

              const Text(
                'Join CyberGuard Ghana',
                style: TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.w800,
                  color: AppTheme.primaryDark,
                  letterSpacing: -0.5,
                ),
              ),
              const SizedBox(height: 6),
              const Text(
                'Free national cybersecurity training & confidential child protection support under Act 1038.',
                style: TextStyle(
                  fontSize: 13,
                  color: AppTheme.textSecondary,
                  height: 1.4,
                ),
              ),
              const SizedBox(height: 24),

              if (_errorMessage != null) ...[
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: AppTheme.accentRedLight,
                    borderRadius: BorderRadius.circular(14),
                  ),
                  child: Text(
                    _errorMessage!,
                    style: const TextStyle(
                      color: AppTheme.accentRed,
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
                const SizedBox(height: 16),
              ],

              const Text(
                'Full Name / Guardian Name',
                style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: AppTheme.primaryDark),
              ),
              const SizedBox(height: 6),
              TextField(
                controller: _nameController,
                textCapitalization: TextCapitalization.words,
                decoration: const InputDecoration(
                  hintText: 'e.g. Kwame Mensah',
                  prefixIcon: Icon(Icons.person_outline_rounded, size: 20, color: AppTheme.textMuted),
                ),
              ),

              const SizedBox(height: 16),
              const Text(
                'Email Address',
                style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: AppTheme.primaryDark),
              ),
              const SizedBox(height: 6),
              TextField(
                controller: _emailController,
                keyboardType: TextInputType.emailAddress,
                decoration: const InputDecoration(
                  hintText: 'e.g. kwame@cyberguard.gh',
                  prefixIcon: Icon(Icons.mail_outline_rounded, size: 20, color: AppTheme.textMuted),
                ),
              ),

              const SizedBox(height: 16),
              const Text(
                'Account Role',
                style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: AppTheme.primaryDark),
              ),
              const SizedBox(height: 6),
              Row(
                children: [
                  _buildRoleChip('STUDENT', 'Youth Student', Icons.school_outlined),
                  const SizedBox(width: 8),
                  _buildRoleChip('TUTOR', 'Mentor', Icons.psychology_outlined),
                  const SizedBox(width: 8),
                  _buildRoleChip('CSA_OFFICER', 'Officer', Icons.shield_outlined),
                ],
              ),

              if (_selectedRole == 'STUDENT') ...[
                const SizedBox(height: 16),
                const Text(
                  'Age Band (Curriculum Tailoring)',
                  style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: AppTheme.primaryDark),
                ),
                const SizedBox(height: 6),
                Row(
                  children: [
                    _buildAgeChip('12-18', 'Secondary (12–18 yrs)'),
                    const SizedBox(width: 8),
                    _buildAgeChip('19-23', 'Tertiary (19–23 yrs)'),
                  ],
                ),
              ],

              const SizedBox(height: 16),
              const Text(
                'Create Password',
                style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: AppTheme.primaryDark),
              ),
              const SizedBox(height: 6),
              TextField(
                controller: _passwordController,
                obscureText: _obscurePassword,
                decoration: InputDecoration(
                  hintText: '••••••••',
                  prefixIcon: const Icon(Icons.lock_outline_rounded, size: 20, color: AppTheme.textMuted),
                  suffixIcon: IconButton(
                    icon: Icon(
                      _obscurePassword ? Icons.visibility_off_outlined : Icons.visibility_outlined,
                      size: 20,
                      color: AppTheme.textMuted,
                    ),
                    onPressed: () => setState(() => _obscurePassword = !_obscurePassword),
                  ),
                ),
              ),

              const SizedBox(height: 32),

              ElevatedButton(
                onPressed: auth.isLoading ? null : _handleRegister,
                style: ElevatedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 16),
                ),
                child: auth.isLoading
                    ? const SizedBox(
                        height: 20,
                        width: 20,
                        child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                      )
                    : const Text('Create Free Account'),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildRoleChip(String role, String label, IconData icon) {
    final isSelected = _selectedRole == role;
    return Expanded(
      child: GestureDetector(
        onTap: () {
          Haptics.selection();
          setState(() => _selectedRole = role);
        },
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 150),
          padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 8),
          decoration: BoxDecoration(
            color: isSelected ? AppTheme.primaryBlueLight : AppTheme.surfaceSubtle,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(
              color: isSelected ? AppTheme.primaryBlue : AppTheme.borderLight,
              width: isSelected ? 1.5 : 1,
            ),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(
                icon,
                size: 18,
                color: isSelected ? AppTheme.primaryBlue : AppTheme.textSecondary,
              ),
              const SizedBox(height: 4),
              Text(
                label,
                style: TextStyle(
                  fontSize: 11,
                  fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
                  color: isSelected ? AppTheme.primaryBlue : AppTheme.textSecondary,
                ),
                textAlign: TextAlign.center,
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildAgeChip(String band, String label) {
    final isSelected = _selectedAgeBand == band;
    return Expanded(
      child: GestureDetector(
        onTap: () {
          Haptics.selection();
          setState(() => _selectedAgeBand = band);
        },
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 150),
          padding: const EdgeInsets.symmetric(vertical: 12),
          decoration: BoxDecoration(
            color: isSelected ? AppTheme.accentGreenLight : AppTheme.surfaceSubtle,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(
              color: isSelected ? AppTheme.accentGreen : AppTheme.borderLight,
              width: isSelected ? 1.5 : 1,
            ),
          ),
          child: Center(
            child: Text(
              label,
              style: TextStyle(
                fontSize: 12,
                fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
                color: isSelected ? const Color(0xFF047857) : AppTheme.textSecondary,
              ),
            ),
          ),
        ),
      ),
    );
  }
}
