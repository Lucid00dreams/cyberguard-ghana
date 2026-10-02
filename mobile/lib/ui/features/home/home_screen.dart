import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/theme/app_theme.dart';
import '../../../data/services/auth_service.dart';
import '../../../data/services/chat_service.dart';
import '../courses/courses_screen.dart';
import '../cyberchat/cyberchat_screen.dart';
import '../incident_report/incident_report_screen.dart';
import '../tutors/tutors_screen.dart';
import '../profile/profile_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  int _currentIndex = 0;

  @override
  Widget build(BuildContext context) {
    final authService = context.watch<AuthService>();
    final chatService = context.watch<ChatService>();
    final user = authService.currentUser;

    final List<Widget> pages = [
      const CoursesScreen(),
      CyberChatScreen(currentUserId: user?.id ?? ''),
      const IncidentReportScreen(),
      const TutorsScreen(),
      const ProfileScreen(),
    ];

    return Scaffold(
      body: IndexedStack(
        index: _currentIndex,
        children: pages,
      ),
      bottomNavigationBar: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          border: const Border(top: BorderSide(color: Color(0xFFE2E8F0), width: 0.8)),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.04),
              blurRadius: 10,
              offset: const Offset(0, -2),
            ),
          ],
        ),
        child: SafeArea(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 4),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: [
                _buildNavItem(
                  index: 0,
                  icon: Icons.school_outlined,
                  selectedIcon: Icons.school,
                  label: 'Academy',
                ),
                _buildNavItem(
                  index: 1,
                  icon: Icons.chat_bubble_outline,
                  selectedIcon: Icons.chat_bubble,
                  label: 'CyberChat',
                  badgeCount: chatService.totalUnreadCount,
                ),
                _buildNavItem(
                  index: 2,
                  icon: Icons.shield_outlined,
                  selectedIcon: Icons.shield,
                  label: 'Report 292',
                ),
                _buildNavItem(
                  index: 3,
                  icon: Icons.people_outline,
                  selectedIcon: Icons.people,
                  label: 'Mentors',
                ),
                _buildNavItem(
                  index: 4,
                  icon: Icons.badge_outlined,
                  selectedIcon: Icons.badge,
                  label: 'Safety Pass',
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildNavItem({
    required int index,
    required IconData icon,
    required IconData selectedIcon,
    required String label,
    int badgeCount = 0,
  }) {
    final isSelected = _currentIndex == index;

    return InkWell(
      onTap: () {
        Haptics.selection();
        setState(() => _currentIndex = index);
      },
      borderRadius: BorderRadius.circular(16),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Stack(
              clipBehavior: Clip.none,
              children: [
                Icon(
                  isSelected ? selectedIcon : icon,
                  size: 24,
                  color: isSelected ? const Color(0xFF0056D2) : const Color(0xFF64748B),
                ),
                if (badgeCount > 0)
                  Positioned(
                    top: -4,
                    right: -8,
                    child: Container(
                      padding: const EdgeInsets.all(4),
                      decoration: const BoxDecoration(
                        color: Color(0xFFDC2626),
                        shape: BoxShape.circle,
                      ),
                      constraints: const BoxConstraints(minWidth: 16, minHeight: 16),
                      child: Text(
                        '$badgeCount',
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 9,
                          fontWeight: FontWeight.bold,
                        ),
                        textAlign: TextAlign.center,
                      ),
                    ),
                  ),
              ],
            ),
            const SizedBox(height: 3),
            Text(
              label,
              style: TextStyle(
                fontSize: 10.5,
                fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
                color: isSelected ? const Color(0xFF0056D2) : const Color(0xFF64748B),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
