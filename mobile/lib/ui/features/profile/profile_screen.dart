import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import '../../../core/theme/app_theme.dart';
import '../../../data/services/auth_service.dart';
import '../phishing/phishing_simulator_screen.dart';
import '../certificate/verify_certificate_screen.dart';
import '../admin/csa_portal_screen.dart';

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final authService = context.watch<AuthService>();
    final user = authService.currentUser;

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: const Text('Digital Safety Pass'),
        backgroundColor: Colors.white,
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.logout, color: Color(0xFFDC2626)),
            tooltip: 'Log Out',
            onPressed: () {
              Haptics.medium();
              authService.logout();
            },
          ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(20, 16, 20, 36),
        children: [
          // Holographic COP Digital ID Card
          Container(
            height: 200,
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [
                  Color(0xFF0F172A),
                  Color(0xFF003C96),
                  Color(0xFF0056D2),
                ],
              ),
              borderRadius: BorderRadius.circular(24),
              boxShadow: [
                BoxShadow(
                  color: const Color(0xFF0056D2).withOpacity(0.35),
                  blurRadius: 16,
                  offset: const Offset(0, 8),
                ),
              ],
            ),
            child: Stack(
              children: [
                // Ghana Flag top strip
                Positioned(
                  top: 0,
                  left: 24,
                  right: 24,
                  child: Container(
                    height: 4,
                    decoration: BoxDecoration(
                      borderRadius: const BorderRadius.vertical(bottom: Radius.circular(2)),
                      gradient: const LinearGradient(
                        colors: [Color(0xFFDC2626), Color(0xFFFBBF24), Color(0xFF16A34A)],
                      ),
                    ),
                  ),
                ),

                // Card details
                Padding(
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Row(
                            children: [
                              const Icon(Icons.shield, color: Color(0xFFFBBF24), size: 22),
                              const SizedBox(width: 8),
                              const Text(
                                'COP DIGITAL SAFETY PASS',
                                style: TextStyle(
                                  color: Colors.white,
                                  fontSize: 11,
                                  fontWeight: FontWeight.w900,
                                  letterSpacing: 1.2,
                                ),
                              ),
                            ],
                          ),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                            decoration: BoxDecoration(
                              color: const Color(0xFF10B981).withOpacity(0.2),
                              borderRadius: BorderRadius.circular(6),
                              border: Border.all(color: const Color(0xFF10B981).withOpacity(0.5)),
                            ),
                            child: const Text(
                              'VERIFIED',
                              style: TextStyle(
                                color: Color(0xFF10B981),
                                fontSize: 9,
                                fontWeight: FontWeight.bold,
                                letterSpacing: 0.5,
                              ),
                            ),
                          ),
                        ],
                      ),

                      Row(
                        children: [
                          CircleAvatar(
                            radius: 30,
                            backgroundColor: Colors.white24,
                            backgroundImage: user?.avatarUrl != null ? NetworkImage(user!.avatarUrl!) : null,
                            child: user?.avatarUrl == null
                                ? const Icon(Icons.person, color: Colors.white, size: 34)
                                : null,
                          ),
                          const SizedBox(width: 14),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  user?.displayName ?? 'Kwame Mensah',
                                  style: const TextStyle(
                                    color: Colors.white,
                                    fontSize: 17,
                                    fontWeight: FontWeight.w900,
                                  ),
                                ),
                                const SizedBox(height: 2),
                                Text(
                                  user?.role ?? 'STUDENT DEFENDER',
                                  style: const TextStyle(color: Color(0xFF93C5FD), fontSize: 11, fontWeight: FontWeight.bold),
                                ),
                                const SizedBox(height: 2),
                                Text(
                                  user?.email ?? 'student@cyberguard.gh',
                                  style: const TextStyle(color: Colors.white70, fontSize: 11),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),

                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text(
                            'ID: COP-GH-849201',
                            style: TextStyle(
                              color: Colors.white60,
                              fontSize: 11,
                              fontFamily: 'monospace',
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          const Text(
                            'Act 1038 · Republic of Ghana',
                            style: TextStyle(color: Colors.white70, fontSize: 10, fontWeight: FontWeight.w500),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),

          const SizedBox(height: 18),

          // Hero Dashboard Command Center Banner
          Container(
            height: 130,
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(20),
              image: const DecorationImage(
                image: AssetImage('assets/images/hero-dashboard.png'),
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
                borderRadius: BorderRadius.circular(20),
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [
                    Colors.black.withOpacity(0.15),
                    Colors.black.withOpacity(0.75),
                  ],
                ),
              ),
              padding: const EdgeInsets.all(14),
              alignment: Alignment.bottomLeft,
              child: const Row(
                children: [
                  Icon(Icons.workspace_premium_rounded, color: Color(0xFFFBBF24), size: 24),
                  SizedBox(width: 10),
                  Expanded(
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'National Child Online Protection Network',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 13.5,
                            fontWeight: FontWeight.w800,
                          ),
                        ),
                        Text(
                          'Active participant under Cyber Security Authority Ghana',
                          style: TextStyle(color: Colors.white70, fontSize: 11),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),

          const SizedBox(height: 22),

          // Stats Grid
          Row(
            children: [
              _buildStatCard('Total XP', '${user?.xp ?? 520}', Icons.bolt, const Color(0xFFF59E0B)),
              const SizedBox(width: 12),
              _buildStatCard('Rank Tier', 'Level ${user?.level ?? 3}', Icons.workspace_premium, const Color(0xFF0056D2)),
              const SizedBox(width: 12),
              _buildStatCard('Streak', '${user?.streakDays ?? 6} Days', Icons.local_fire_department, const Color(0xFFEF4444)),
            ],
          ),

          const SizedBox(height: 24),

          // Badges Earned
          const Text(
            'Earned Cybersecurity Badges',
            style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: Color(0xFF0F172A)),
          ),
          const SizedBox(height: 12),

          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              _buildBadgeItem('MoMo Shield', '💳', true),
              _buildBadgeItem('Phish Hunter', '🎣', true),
              _buildBadgeItem('E2EE Master', '🔒', true),
              _buildBadgeItem('Act 1038', '⚖️', true),
            ],
          ),

          const SizedBox(height: 24),

          // E2EE Security Settings Card
          Container(
            padding: const EdgeInsets.all(18),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: const Color(0xFFE2E8F0)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Row(
                  children: [
                    Icon(Icons.vpn_key_outlined, color: Color(0xFF0056D2), size: 20),
                    SizedBox(width: 8),
                    Text(
                      'Cryptographic Identity Keys',
                      style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: Color(0xFF0F172A)),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                const Text(
                  'Your messages and incident reports use client-side Ed25519 & Curve25519 encryption keys stored exclusively in local secure memory.',
                  style: TextStyle(fontSize: 12, color: Color(0xFF64748B), height: 1.4),
                ),
                const SizedBox(height: 12),
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: const Color(0xFFF1F5F9),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text(
                        'Fingerprint: ed25519:7f8a...c912',
                        style: TextStyle(fontSize: 11, fontFamily: 'monospace', fontWeight: FontWeight.bold),
                      ),
                      InkWell(
                        onTap: () {
                          Clipboard.setData(const ClipboardData(text: 'ed25519:7f8a8492019284729102c912'));
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(content: Text('Public key fingerprint copied.')),
                          );
                        },
                        child: const Text('Copy', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Color(0xFF0056D2))),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),

          const SizedBox(height: 24),

          // Platform Tools & Emergency Navigation
          const Text(
            'Safety Hub & Platform Tools',
            style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: Color(0xFF0F172A)),
          ),
          const SizedBox(height: 12),

          _buildActionTile(
            context,
            title: 'MoMo & Phishing Simulator',
            subtitle: 'Hands-on practice identifying SMS & WhatsApp scams',
            icon: Icons.radar_rounded,
            color: const Color(0xFFF59E0B),
            onTap: () {
              Navigator.of(context).push(
                MaterialPageRoute(builder: (_) => const PhishingSimulatorScreen()),
              );
            },
          ),
          const SizedBox(height: 10),

          _buildActionTile(
            context,
            title: 'Verify COP Certificate',
            subtitle: 'Authenticate digital certificates and badges via QR/Serial',
            icon: Icons.verified_outlined,
            color: const Color(0xFF10B981),
            onTap: () {
              Navigator.of(context).push(
                MaterialPageRoute(builder: (_) => const VerifyCertificateScreen()),
              );
            },
          ),
          const SizedBox(height: 10),

          _buildActionTile(
            context,
            title: 'CSA Officer Command Center',
            subtitle: 'Incident triage and case investigation queue',
            icon: Icons.admin_panel_settings_outlined,
            color: const Color(0xFF0056D2),
            badge: user?.role == 'ADMIN' || user?.role == 'CSA_OFFICER' ? 'OFFICER' : 'ACCESS',
            onTap: () {
              Navigator.of(context).push(
                MaterialPageRoute(builder: (_) => const CsaPortalScreen()),
              );
            },
          ),
          const SizedBox(height: 10),

          _buildActionTile(
            context,
            title: 'Ghana Cybersecurity Act 1038 Guide',
            subtitle: 'Legal protections for children and reporting duties',
            icon: Icons.gavel_rounded,
            color: const Color(0xFF7C3AED),
            onTap: () => _showLegalGuide(context),
          ),

          const SizedBox(height: 24),

          // Log out button
          SizedBox(
            width: double.infinity,
            child: OutlinedButton.icon(
              onPressed: () {
                Haptics.medium();
                authService.logout();
              },
              icon: const Icon(Icons.logout, color: Color(0xFFDC2626), size: 18),
              label: const Text('Switch Account or Log Out', style: TextStyle(color: Color(0xFFDC2626), fontWeight: FontWeight.bold)),
              style: OutlinedButton.styleFrom(
                side: const BorderSide(color: Color(0xFFFCA5A5)),
                padding: const EdgeInsets.symmetric(vertical: 14),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildActionTile(
    BuildContext context, {
    required String title,
    required String subtitle,
    required IconData icon,
    required Color color,
    required VoidCallback onTap,
    String? badge,
  }) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: const Color(0xFFE2E8F0)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.02),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        borderRadius: BorderRadius.circular(18),
        child: InkWell(
          borderRadius: BorderRadius.circular(18),
          onTap: () {
            Haptics.light();
            onTap();
          },
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: color.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Icon(icon, color: color, size: 22),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Flexible(
                            child: Text(
                              title,
                              style: const TextStyle(
                                fontSize: 14,
                                fontWeight: FontWeight.w800,
                                color: Color(0xFF0F172A),
                              ),
                            ),
                          ),
                          if (badge != null) ...[
                            const SizedBox(width: 6),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                              decoration: BoxDecoration(
                                color: color.withOpacity(0.12),
                                borderRadius: BorderRadius.circular(6),
                              ),
                              child: Text(
                                badge,
                                style: TextStyle(
                                  fontSize: 9,
                                  fontWeight: FontWeight.w800,
                                  color: color,
                                ),
                              ),
                            ),
                          ],
                        ],
                      ),
                      const SizedBox(height: 2),
                      Text(
                        subtitle,
                        style: const TextStyle(fontSize: 11, color: Color(0xFF64748B)),
                      ),
                    ],
                  ),
                ),
                const Icon(Icons.chevron_right_rounded, color: Color(0xFF94A3B8), size: 20),
              ],
            ),
          ),
        ),
      ),
    );
  }

  void _showLegalGuide(BuildContext context) {
    Haptics.light();
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) => DraggableScrollableSheet(
        initialChildSize: 0.75,
        maxChildSize: 0.9,
        minChildSize: 0.45,
        expand: false,
        builder: (_, scroll) => Padding(
          padding: const EdgeInsets.fromLTRB(24, 16, 24, 24),
          child: ListView(
            controller: scroll,
            children: [
              Center(
                child: Container(
                  width: 44,
                  height: 5,
                  decoration: BoxDecoration(
                    color: const Color(0xFFCBD5E1),
                    borderRadius: BorderRadius.circular(3),
                  ),
                ),
              ),
              const SizedBox(height: 16),
              const Row(
                children: [
                  Icon(Icons.gavel_rounded, color: Color(0xFF7C3AED), size: 24),
                  SizedBox(width: 8),
                  Text(
                    'Ghana Cybersecurity Act 1038',
                    style: TextStyle(fontSize: 17, fontWeight: FontWeight.w800, color: Color(0xFF0F172A)),
                  ),
                ],
              ),
              const SizedBox(height: 6),
              const Text(
                'Provisions regarding Child Online Protection (COP) in the Republic of Ghana.',
                style: TextStyle(fontSize: 12, color: Color(0xFF64748B)),
              ),
              const SizedBox(height: 18),
              _buildLegalSection(
                'Section 62: Child Online Sexual Abuse & Exploitation',
                'Mandates immediate escalation, preservation of digital evidence, and criminalizes production, transmission, or possession of exploitative material involving minors.',
              ),
              const SizedBox(height: 12),
              _buildLegalSection(
                'Section 63: Cyberbullying, Cyberstalking & Harassment',
                'Protects children from intentional infliction of emotional distress, impersonation, or continuous targeted online threats across social networks.',
              ),
              const SizedBox(height: 12),
              _buildLegalSection(
                'Section 64: Duty of Service Providers & Educators',
                'Requires telecom operators, ISPs, and school administrators to implement COP safety measures, content filters, and prompt reporting to the National CERT-GH.',
              ),
              const SizedBox(height: 12),
              _buildLegalSection(
                'Emergency 24/7 Hotline: 292',
                'The Cyber Security Authority (CSA) operates an unmetered, toll-free 292 hotline and emergency WhatsApp channel for immediate intervention.',
              ),
              const SizedBox(height: 24),
              ElevatedButton(
                onPressed: () => Navigator.of(ctx).pop(),
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF7C3AED),
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                ),
                child: const Text('Understood', style: TextStyle(fontWeight: FontWeight.bold)),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildLegalSection(String title, String body) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: const Color(0xFFF8FAFC),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w800, color: Color(0xFF0F172A))),
          const SizedBox(height: 4),
          Text(body, style: const TextStyle(fontSize: 11.5, color: Color(0xFF475569), height: 1.4)),
        ],
      ),
    );
  }

  Widget _buildStatCard(String title, String value, IconData icon, Color color) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 10),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: const Color(0xFFE2E8F0)),
        ),
        child: Column(
          children: [
            Icon(icon, color: color, size: 22),
            const SizedBox(height: 6),
            Text(value, style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 15, color: Color(0xFF0F172A))),
            Text(title, style: const TextStyle(fontSize: 10, color: Color(0xFF94A3B8), fontWeight: FontWeight.w600)),
          ],
        ),
      ),
    );
  }

  Widget _buildBadgeItem(String title, String emoji, bool isEarned) {
    return Column(
      children: [
        Container(
          width: 58,
          height: 58,
          decoration: BoxDecoration(
            color: Colors.white,
            shape: BoxShape.circle,
            border: Border.all(color: const Color(0xFFE2E8F0)),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.04),
                blurRadius: 6,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: Center(
            child: Text(emoji, style: const TextStyle(fontSize: 26)),
          ),
        ),
        const SizedBox(height: 6),
        Text(
          title,
          style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Color(0xFF334155)),
        ),
      ],
    );
  }
}
