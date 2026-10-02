import 'dart:math';
import 'package:flutter/foundation.dart';
import 'package:url_launcher/url_launcher.dart';
import '../models/incident_model.dart';
import '../../core/constants/api_constants.dart';

class IncidentService extends ChangeNotifier {
  final List<IncidentModel> _reports = [];
  bool _isSubmitting = false;

  List<IncidentModel> get reports => _reports;
  bool get isSubmitting => _isSubmitting;

  IncidentService() {
    // Seed initial report for demonstration lookup
    _reports.add(
      IncidentModel(
        id: 'inc_sample_1',
        referenceCode: 'CG-892147',
        category: 'SCAM_FRAUD',
        title: 'SMS Sender ID Spoofing targeting MTN Wallet',
        description:
            'Received message claiming 500 GHS deposited followed by aggressive phone calls asking for USSD reversal dial.',
        isAnonymous: true,
        status: 'INVESTIGATING',
        urgency: 'HIGH',
        evidenceHash:
            'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        createdAt: DateTime.now().subtract(const Duration(days: 2)),
      ),
    );
  }

  Future<IncidentModel> submitReport({
    required String category,
    required String title,
    required String description,
    required bool isAnonymous,
    String urgency = 'MEDIUM',
    String? contact,
    String? fileName,
  }) async {
    _isSubmitting = true;
    notifyListeners();

    await Future.delayed(const Duration(milliseconds: 900)); // Haptic processing delay

    // Generate reference code e.g. "CG-682914"
    final randomDigits = 100000 + Random().nextInt(900000);
    final refCode = 'CG-$randomDigits';

    // Simulate SHA-256 zero-knowledge client fingerprint
    final dummyHash = _generateSimulatedSha256(title + description);

    final report = IncidentModel(
      id: 'inc_${DateTime.now().millisecondsSinceEpoch}',
      referenceCode: refCode,
      category: category,
      title: title,
      description: description,
      isAnonymous: isAnonymous,
      status: 'RECEIVED',
      urgency: urgency,
      evidenceHash: fileName != null ? dummyHash : null,
      createdAt: DateTime.now(),
      reporterContact: contact,
    );

    _reports.insert(0, report);
    _isSubmitting = false;
    notifyListeners();
    return report;
  }

  IncidentModel? lookupByReference(String code) {
    final clean = code.trim().toUpperCase();
    try {
      return _reports.firstWhere((r) => r.referenceCode.toUpperCase() == clean);
    } catch (_) {
      // Return a simulated active case for any demo code entered
      if (clean.startsWith('CG-') || clean.length >= 6) {
        return IncidentModel(
          id: 'inc_lookup_${DateTime.now().millisecondsSinceEpoch}',
          referenceCode: clean,
          category: 'SEXTORTION',
          title: 'Child Online Safety Referral (Verified by CSA)',
          description:
              'Confidential case logged under Ghana Cybersecurity Act (Act 1038). Assigned to CSA Child Protection Response Unit.',
          isAnonymous: true,
          status: 'TRIAGED',
          urgency: 'CRITICAL',
          createdAt: DateTime.now().subtract(const Duration(hours: 14)),
        );
      }
      return null;
    }
  }

  String _generateSimulatedSha256(String input) {
    final chars = '0123456789abcdef';
    final random = Random(input.hashCode);
    final buffer = StringBuffer();
    for (int i = 0; i < 64; i++) {
      buffer.write(chars[random.nextInt(chars.length)]);
    }
    return buffer.toString();
  }

  // Ghana Emergency Direct Actions
  Future<void> callCsaEmergency() async {
    final uri = Uri.parse(ApiConstants.csaEmergencyPhone);
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri);
    }
  }

  Future<void> openCsaWhatsApp() async {
    final uri = Uri.parse('https://wa.me/233501840000?text=Hello%20CyberGuard%20Ghana,%20I%20need%20assistance%20with%20a%20child%20online%20safety%20incident.');
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }
}
