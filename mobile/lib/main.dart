import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'core/theme/app_theme.dart';
import 'data/services/auth_service.dart';
import 'data/services/course_service.dart';
import 'data/services/incident_service.dart';
import 'data/services/tutor_service.dart';
import 'data/services/phishing_service.dart';
import 'data/services/chat_service.dart';
import 'ui/features/auth/login_screen.dart';
import 'ui/features/home/home_screen.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthService()..checkAuthStatus()),
        ChangeNotifierProvider(create: (_) => CourseService()),
        ChangeNotifierProvider(create: (_) => IncidentService()),
        ChangeNotifierProvider(create: (_) => TutorService()),
        ChangeNotifierProvider(create: (_) => PhishingService()),
        ChangeNotifierProvider(create: (_) => ChatService()),
      ],
      child: const CyberGuardApp(),
    ),
  );
}

class CyberGuardApp extends StatelessWidget {
  const CyberGuardApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'CyberGuard Ghana',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.lightTheme,
      home: Consumer<AuthService>(
        builder: (context, authService, _) {
          if (authService.isLoading) {
            return Scaffold(
              backgroundColor: AppTheme.backgroundLight,
              body: Center(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Container(
                      padding: const EdgeInsets.all(18),
                      decoration: BoxDecoration(
                        color: AppTheme.primaryBlue,
                        borderRadius: BorderRadius.circular(24),
                        boxShadow: AppTheme.elevatedShadow,
                      ),
                      child: const Icon(
                        Icons.shield_outlined,
                        color: Colors.white,
                        size: 44,
                      ),
                    ),
                    const SizedBox(height: 20),
                    const Text(
                      'CyberGuard Ghana',
                      style: TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.w800,
                        color: AppTheme.primaryDark,
                        letterSpacing: -0.4,
                      ),
                    ),
                    const SizedBox(height: 6),
                    const Text(
                      'Child Online Protection Framework (Act 1038)',
                      style: TextStyle(
                        fontSize: 12,
                        color: AppTheme.textSecondary,
                      ),
                    ),
                    const SizedBox(height: 24),
                    const SizedBox(
                      width: 24,
                      height: 24,
                      child: CircularProgressIndicator(
                        strokeWidth: 2.5,
                        valueColor: AlwaysStoppedAnimation<Color>(AppTheme.primaryBlue),
                      ),
                    ),
                  ],
                ),
              ),
            );
          }
          if (authService.isAuthenticated) {
            return const HomeScreen();
          }
          return const LoginScreen();
        },
      ),
    );
  }
}
