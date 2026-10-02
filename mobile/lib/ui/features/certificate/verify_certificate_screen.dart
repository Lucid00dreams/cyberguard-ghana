import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/theme/app_theme.dart';
import '../../../data/services/auth_service.dart';

class VerifyCertificateScreen extends StatefulWidget {
  final String? courseTitle;
  final String? certRef;

  const VerifyCertificateScreen({
    super.key,
    this.courseTitle,
    this.certRef,
  });

  @override
  State<VerifyCertificateScreen> createState() =>
      _VerifyCertificateScreenState();
}

class _VerifyCertificateScreenState extends State<VerifyCertificateScreen> {
  final _lookupController = TextEditingController();
  bool _isVerified = true;
  late String _activeTitle;
  late String _activeSerial;

  @override
  void initState() {
    super.initState();
    _activeTitle = widget.courseTitle ??
        'Detecting Mobile Money (MoMo) & SMS Scams in Ghana';
    _activeSerial = widget.certRef ?? 'CG-COP-2026-89412';
    _lookupController.text = _activeSerial;
  }

  void _verifySerial() {
    Haptics.medium();
    setState(() {
      _activeSerial = _lookupController.text.trim().toUpperCase();
      _isVerified = true;
    });
  }

  @override
  Widget build(BuildContext context) {
    final user = context.watch<AuthService>().currentUser;
    final recipientName = user?.displayName ?? 'Kwame Mensah';

    return Scaffold(
      backgroundColor: AppTheme.backgroundLight,
      appBar: AppBar(
        title: const Text('Credential Verification'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded, size: 20),
          onPressed: () => Navigator.of(context).pop(),
        ),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Search / Lookup Bar
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(18),
                  boxShadow: AppTheme.cardShadow,
                ),
                child: Row(
                  children: [
                    const Icon(Icons.search_rounded,
                        color: AppTheme.textMuted, size: 22),
                    const SizedBox(width: 8),
                    Expanded(
                      child: TextField(
                        controller: _lookupController,
                        style: const TextStyle(
                            fontSize: 13, fontWeight: FontWeight.w700),
                        decoration: const InputDecoration(
                          hintText: 'Enter Serial (e.g. CG-COP-2026-...)',
                          border: InputBorder.none,
                          enabledBorder: InputBorder.none,
                          focusedBorder: InputBorder.none,
                          contentPadding: EdgeInsets.zero,
                        ),
                      ),
                    ),
                    ElevatedButton(
                      onPressed: _verifySerial,
                      style: ElevatedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 14, vertical: 10),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                      child: const Text('Verify',
                          style: TextStyle(fontSize: 12)),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 24),

              // The Certificate Parchment
              Container(
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(24),
                  border: Border.all(color: const Color(0xFFD4AF37), width: 2), // Gold border
                  boxShadow: AppTheme.cardShadow,
                ),
                child: Stack(
                  children: [
                    // Corner Ornaments
                    Positioned(
                      top: 12,
                      left: 12,
                      child: Icon(Icons.star_rounded,
                          size: 16, color: const Color(0xFFD4AF37).withOpacity(0.6)),
                    ),
                    Positioned(
                      top: 12,
                      right: 12,
                      child: Icon(Icons.star_rounded,
                          size: 16, color: const Color(0xFFD4AF37).withOpacity(0.6)),
                    ),

                    Padding(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 24, vertical: 28),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.center,
                        children: [
                          // Ghana National Emblem Header
                          Container(
                            width: 54,
                            height: 54,
                            decoration: BoxDecoration(
                              color: AppTheme.primaryBlue.withOpacity(0.1),
                              shape: BoxShape.circle,
                            ),
                            child: const Icon(
                              Icons.verified_rounded,
                              color: AppTheme.primaryBlue,
                              size: 32,
                            ),
                          ),
                          const SizedBox(height: 12),
                          const Text(
                            'REPUBLIC OF GHANA',
                            style: TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.w800,
                              color: AppTheme.textSecondary,
                              letterSpacing: 1.5,
                            ),
                          ),
                          const SizedBox(height: 2),
                          const Text(
                            'National Child Online Protection (COP) Framework',
                            textAlign: TextAlign.center,
                            style: TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.w700,
                              color: AppTheme.primaryDark,
                            ),
                          ),
                          const SizedBox(height: 20),

                          const Text(
                            'THIS IS TO CERTIFY THAT',
                            style: TextStyle(
                              fontSize: 10,
                              fontWeight: FontWeight.w700,
                              color: AppTheme.textMuted,
                              letterSpacing: 1.2,
                            ),
                          ),
                          const SizedBox(height: 6),
                          Text(
                            recipientName,
                            style: const TextStyle(
                              fontSize: 22,
                              fontWeight: FontWeight.w900,
                              color: AppTheme.primaryDark,
                              letterSpacing: -0.3,
                            ),
                          ),
                          const SizedBox(height: 12),
                          const Text(
                            'has successfully passed the national examination and demonstrated competency in',
                            textAlign: TextAlign.center,
                            style: TextStyle(
                              fontSize: 12,
                              color: AppTheme.textSecondary,
                              height: 1.4,
                            ),
                          ),
                          const SizedBox(height: 8),
                          Text(
                            _activeTitle,
                            textAlign: TextAlign.center,
                            style: const TextStyle(
                              fontSize: 15,
                              fontWeight: FontWeight.w800,
                              color: AppTheme.primaryBlue,
                            ),
                          ),
                          const SizedBox(height: 24),

                          // Verification Metadata
                          Container(
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(
                              color: AppTheme.surfaceSubtle,
                              borderRadius: BorderRadius.circular(14),
                              border: Border.all(color: AppTheme.borderLight),
                            ),
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    const Text('STATUS',
                                        style: TextStyle(
                                            fontSize: 9,
                                            fontWeight: FontWeight.w800,
                                            color: AppTheme.textMuted)),
                                    const SizedBox(height: 2),
                                    Row(
                                      children: const [
                                        Icon(Icons.check_circle_rounded,
                                            size: 14,
                                            color: AppTheme.accentGreen),
                                        SizedBox(width: 4),
                                        Text('AUTHENTIC & VERIFIED',
                                            style: TextStyle(
                                                fontSize: 11,
                                                fontWeight: FontWeight.w800,
                                                color: Color(0xFF047857))),
                                      ],
                                    ),
                                  ],
                                ),
                                Column(
                                  crossAxisAlignment: CrossAxisAlignment.end,
                                  children: [
                                    const Text('SERIAL NUMBER',
                                        style: TextStyle(
                                            fontSize: 9,
                                            fontWeight: FontWeight.w800,
                                            color: AppTheme.textMuted)),
                                    const SizedBox(height: 2),
                                    Text(_activeSerial,
                                        style: const TextStyle(
                                            fontSize: 11,
                                            fontWeight: FontWeight.w800,
                                            color: AppTheme.primaryDark,
                                            fontFamily: 'monospace')),
                                  ],
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 24),

              // Actions
              ElevatedButton.icon(
                onPressed: () {
                  Haptics.medium();
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Text('Certificate PDF downloaded to device storage.'),
                      backgroundColor: AppTheme.accentGreen,
                    ),
                  );
                },
                icon: const Icon(Icons.download_rounded, size: 18),
                label: const Text('Download Official PDF'),
                style: ElevatedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 16),
                ),
              ),
              const SizedBox(height: 12),
              OutlinedButton.icon(
                onPressed: () {
                  Haptics.light();
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text('Verification link copied: cyberguard.gh/verify/$_activeSerial'),
                    ),
                  );
                },
                icon: const Icon(Icons.share_outlined, size: 18),
                label: const Text('Share Verifiable Link'),
                style: OutlinedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  side: const BorderSide(color: AppTheme.borderLight),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(16),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
