import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../../core/theme/app_theme.dart';
import '../../../data/models/incident_model.dart';
import '../../../data/services/incident_service.dart';

class IncidentReportScreen extends StatefulWidget {
  const IncidentReportScreen({super.key});

  @override
  State<IncidentReportScreen> createState() => _IncidentReportScreenState();
}

class _IncidentReportScreenState extends State<IncidentReportScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;

  // Form state
  String _selectedCategory = 'SCAM_FRAUD';
  final _titleController = TextEditingController();
  final _descController = TextEditingController();
  final _contactController = TextEditingController();
  String _selectedUrgency = 'MEDIUM';
  bool _isAnonymous = true;
  String? _simulatedEvidenceFile;

  // Track state
  final _searchRefController = TextEditingController(text: 'CG-892147');
  IncidentModel? _trackedCase;

  final List<Map<String, dynamic>> _categories = [
    {
      'id': 'SCAM_FRAUD',
      'title': 'MoMo & Financial Fraud',
      'icon': Icons.payments_outlined,
      'color': Color(0xFF0056D2),
    },
    {
      'id': 'CYBERBULLYING',
      'title': 'Cyberbullying & Threats',
      'icon': Icons.sentiment_very_dissatisfied_outlined,
      'color': Color(0xFFD97706),
    },
    {
      'id': 'SEXTORTION',
      'title': 'Sextortion & Blackmail',
      'icon': Icons.lock_clock_outlined,
      'color': Color(0xFFDC2626),
    },
    {
      'id': 'GROOMING',
      'title': 'Online Grooming / Exploitation',
      'icon': Icons.child_care_outlined,
      'color': Color(0xFF7C3AED),
    },
    {
      'id': 'IDENTITY_THEFT',
      'title': 'Identity Theft & Impersonation',
      'icon': Icons.badge_outlined,
      'color': Color(0xFF0D9488),
    },
  ];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _handleSearchCase();
    });
  }

  @override
  void dispose() {
    _tabController.dispose();
    _titleController.dispose();
    _descController.dispose();
    _contactController.dispose();
    _searchRefController.dispose();
    super.dispose();
  }

  Future<void> _callHotline() async {
    Haptics.medium();
    final uri = Uri.parse('tel:292');
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri);
    } else {
      _showEmergencyModal();
    }
  }

  void _showEmergencyModal() {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(22)),
        title: const Row(
          children: [
            Icon(Icons.phone_in_talk, color: Color(0xFFDC2626), size: 24),
            SizedBox(width: 8),
            Text('Ghana CSA 292 Hotline'),
          ],
        ),
        content: const Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Call 292 directly from your phone dialer for toll-free emergency incident triage across MTN, Telecel, and AT networks.',
              style: TextStyle(fontSize: 13, color: Color(0xFF475569), height: 1.4),
            ),
            SizedBox(height: 12),
            Text(
              'WhatsApp Incident Desk: +233 50 184 0000',
              style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Color(0xFF0F172A)),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Dismiss'),
          ),
          ElevatedButton(
            onPressed: () {
              Clipboard.setData(const ClipboardData(text: '292'));
              Navigator.pop(ctx);
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Hotline number 292 copied to clipboard.')),
              );
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFFDC2626),
              foregroundColor: Colors.white,
            ),
            child: const Text('Copy 292'),
          ),
        ],
      ),
    );
  }

  void _attachEvidence() {
    Haptics.light();
    setState(() {
      _simulatedEvidenceFile = 'evidence_screenshot_momo_2024.png';
    });
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('🔒 Evidence attached: EXIF coordinates scrubbed & SHA-256 hashed.'),
        duration: Duration(seconds: 2),
      ),
    );
  }

  Future<void> _handleSubmitReport() async {
    final title = _titleController.text.trim();
    final desc = _descController.text.trim();

    if (title.isEmpty || desc.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please provide an incident title and description.')),
      );
      return;
    }

    Haptics.medium();
    final report = await context.read<IncidentService>().submitReport(
      category: _selectedCategory,
      title: title,
      description: desc,
      isAnonymous: _isAnonymous,
      urgency: _selectedUrgency,
      contact: _contactController.text.trim().isNotEmpty ? _contactController.text.trim() : null,
      fileName: _simulatedEvidenceFile,
    );

    _showSuccessDialog(report);
  }

  void _showSuccessDialog(IncidentModel report) {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(22)),
        title: const Row(
          children: [
            Icon(Icons.verified, color: Color(0xFF10B981), size: 26),
            SizedBox(width: 8),
            Text('Case Logged (Act 1038)'),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Your report has been securely registered in the Cyber Security Authority National Triage Queue.',
              style: TextStyle(fontSize: 13, color: Color(0xFF475569), height: 1.4),
            ),
            const SizedBox(height: 16),
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: const Color(0xFFF1F5F9),
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: const Color(0xFFE2E8F0)),
              ),
              child: Column(
                children: [
                  const Text('YOUR CASE REFERENCE CODE', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Color(0xFF64748B))),
                  const SizedBox(height: 4),
                  Text(
                    report.referenceCode,
                    style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w900, color: Color(0xFF0056D2), letterSpacing: 1.5),
                  ),
                  const SizedBox(height: 8),
                  InkWell(
                    onTap: () {
                      Clipboard.setData(ClipboardData(text: report.referenceCode));
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('Reference code copied!')),
                      );
                    },
                    child: const Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.copy, size: 14, color: Color(0xFF0056D2)),
                        SizedBox(width: 4),
                        Text('Copy Code', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Color(0xFF0056D2))),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
        actions: [
          ElevatedButton(
            onPressed: () {
              Navigator.pop(ctx);
              _titleController.clear();
              _descController.clear();
              _contactController.clear();
              setState(() {
                _simulatedEvidenceFile = null;
                _searchRefController.text = report.referenceCode;
                _trackedCase = report;
                _tabController.animateTo(1); // switch to Track tab
              });
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF0056D2),
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
            child: const Text('Track Case Status →'),
          ),
        ],
      ),
    );
  }

  void _handleSearchCase() {
    Haptics.light();
    final code = _searchRefController.text.trim();
    if (code.isEmpty) return;

    final found = context.read<IncidentService>().lookupByReference(code);
    setState(() {
      _trackedCase = found;
    });
  }

  @override
  Widget build(BuildContext context) {
    final incidentService = context.watch<IncidentService>();

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: const Text('Child Online Protection Desk'),
        backgroundColor: Colors.white,
        elevation: 0,
        bottom: TabBar(
          controller: _tabController,
          labelColor: const Color(0xFF0056D2),
          unselectedLabelColor: const Color(0xFF64748B),
          indicatorColor: const Color(0xFF0056D2),
          indicatorWeight: 3,
          tabs: const [
            Tab(text: 'File Report'),
            Tab(text: 'Track Case Status'),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          // TAB 1: File Report
          ListView(
            padding: const EdgeInsets.all(16),
            children: [
              // Hero Incident Visual Banner
              Container(
                margin: const EdgeInsets.only(bottom: 16),
                height: 155,
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(20),
                  image: const DecorationImage(
                    image: AssetImage('assets/images/hero-incident.png'),
                    fit: BoxFit.cover,
                  ),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.08),
                      blurRadius: 14,
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
                        Colors.black.withOpacity(0.78),
                      ],
                    ),
                  ),
                  padding: const EdgeInsets.all(16),
                  alignment: Alignment.bottomLeft,
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.end,
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(
                          color: const Color(0xFFDC2626),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: const Text(
                          'Act 1038 Mandatory Reporting',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 10.5,
                            fontWeight: FontWeight.w800,
                            letterSpacing: 0.4,
                          ),
                        ),
                      ),
                      const SizedBox(height: 6),
                      const Text(
                        'Child Online Protection Desk',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 17,
                          fontWeight: FontWeight.w900,
                          letterSpacing: -0.3,
                        ),
                      ),
                      const Text(
                        'Direct, confidential incident escalation to CERT-GH',
                        style: TextStyle(
                          color: Colors.white70,
                          fontSize: 11.5,
                        ),
                      ),
                    ],
                  ),
                ),
              ),

              // 292 Emergency Toll-Free Hotline Banner
              Container(
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [Color(0xFFDC2626), Color(0xFF991B1B)],
                  ),
                  borderRadius: BorderRadius.circular(20),
                  boxShadow: [
                    BoxShadow(
                      color: const Color(0xFFDC2626).withOpacity(0.25),
                      blurRadius: 10,
                      offset: const Offset(0, 4),
                    ),
                  ],
                ),
                padding: const EdgeInsets.all(18),
                child: Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: const BoxDecoration(
                        color: Colors.white24,
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(Icons.phone_in_talk, color: Colors.white, size: 28),
                    ),
                    const SizedBox(width: 14),
                    const Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Emergency? Call 292',
                            style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.w900),
                          ),
                          SizedBox(height: 2),
                          Text(
                            'Ghana CSA 24/7 Toll-Free Incident Helpline',
                            style: TextStyle(color: Colors.white70, fontSize: 11),
                          ),
                        ],
                      ),
                    ),
                    ElevatedButton(
                      onPressed: _callHotline,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.white,
                        foregroundColor: const Color(0xFFDC2626),
                        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                      child: const Text('Call Now', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 20),

              // Category Selection Header
              const Text(
                '1. Select Incident Category',
                style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: Color(0xFF0F172A)),
              ),
              const SizedBox(height: 10),

              // Category chips grid
              ...List.generate(_categories.length, (idx) {
                final cat = _categories[idx];
                final isSelected = _selectedCategory == cat['id'];
                return Container(
                  margin: const EdgeInsets.only(bottom: 8),
                  child: InkWell(
                    onTap: () {
                      Haptics.selection();
                      setState(() => _selectedCategory = cat['id'] as String);
                    },
                    borderRadius: BorderRadius.circular(14),
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                      decoration: BoxDecoration(
                        color: isSelected ? const Color(0xFFEFF6FF) : Colors.white,
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(
                          color: isSelected ? const Color(0xFF0056D2) : const Color(0xFFE2E8F0),
                          width: isSelected ? 1.8 : 1,
                        ),
                      ),
                      child: Row(
                        children: [
                          Icon(cat['icon'] as IconData, color: cat['color'] as Color, size: 22),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Text(
                              cat['title'] as String,
                              style: TextStyle(
                                fontSize: 13,
                                fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
                                color: isSelected ? const Color(0xFF0056D2) : const Color(0xFF1E293B),
                              ),
                            ),
                          ),
                          if (isSelected)
                            const Icon(Icons.check_circle, color: Color(0xFF0056D2), size: 18),
                        ],
                      ),
                    ),
                  ),
                );
              }),

              const SizedBox(height: 16),

              // Details
              const Text(
                '2. What Happened?',
                style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: Color(0xFF0F172A)),
              ),
              const SizedBox(height: 8),

              TextField(
                controller: _titleController,
                decoration: InputDecoration(
                  hintText: 'Brief summary e.g. "Fake MTN cash reversal SMS"',
                  filled: true,
                  fillColor: Colors.white,
                  contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: const BorderSide(color: Color(0xFFCBD5E1))),
                  enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: const BorderSide(color: Color(0xFFE2E8F0))),
                ),
              ),
              const SizedBox(height: 10),

              TextField(
                controller: _descController,
                maxLines: 4,
                decoration: InputDecoration(
                  hintText: 'Provide details: sender phone number, website link, what they demanded, date & time...',
                  filled: true,
                  fillColor: Colors.white,
                  contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: const BorderSide(color: Color(0xFFCBD5E1))),
                  enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: const BorderSide(color: Color(0xFFE2E8F0))),
                ),
              ),

              const SizedBox(height: 18),

              // Evidence attachment
              const Text(
                '3. Supporting Evidence (Optional)',
                style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: Color(0xFF0F172A)),
              ),
              const SizedBox(height: 8),

              InkWell(
                onTap: _attachEvidence,
                borderRadius: BorderRadius.circular(16),
                child: Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: const Color(0xFFCBD5E1), style: BorderStyle.solid),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(
                        _simulatedEvidenceFile != null ? Icons.check_circle : Icons.upload_file,
                        color: _simulatedEvidenceFile != null ? const Color(0xFF10B981) : const Color(0xFF0056D2),
                      ),
                      const SizedBox(width: 8),
                      Text(
                        _simulatedEvidenceFile ?? 'Attach Screenshot / Audio (EXIF Scrubbed)',
                        style: TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.bold,
                          color: _simulatedEvidenceFile != null ? const Color(0xFF10B981) : const Color(0xFF0056D2),
                        ),
                      ),
                    ],
                  ),
                ),
              ),

              const SizedBox(height: 18),

              // Anonymous Switch
              Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: const Color(0xFFE2E8F0)),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Submit Anonymously',
                          style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold),
                        ),
                        Text(
                          'Your name & email will not be recorded in triage',
                          style: TextStyle(fontSize: 11, color: Color(0xFF64748B)),
                        ),
                      ],
                    ),
                    Switch.adaptive(
                      value: _isAnonymous,
                      activeColor: const Color(0xFF0056D2),
                      onChanged: (val) => setState(() => _isAnonymous = val),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 24),

              // Submit Button
              ElevatedButton(
                onPressed: incidentService.isSubmitting ? null : _handleSubmitReport,
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF0056D2),
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                ),
                child: incidentService.isSubmitting
                    ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                    : const Text(
                        'Submit Confidential Incident Report',
                        style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold),
                      ),
              ),

              const SizedBox(height: 32),
            ],
          ),

          // TAB 2: Track Existing Case
          ListView(
            padding: const EdgeInsets.all(16),
            children: [
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: const Color(0xFFE2E8F0)),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Look Up Incident Tracking Code',
                      style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: Color(0xFF0F172A)),
                    ),
                    const SizedBox(height: 6),
                    const Text(
                      'Enter your Ghana CSA Reference Code to see officer updates and response actions.',
                      style: TextStyle(fontSize: 12, color: Color(0xFF64748B)),
                    ),
                    const SizedBox(height: 14),
                    Row(
                      children: [
                        Expanded(
                          child: TextField(
                            controller: _searchRefController,
                            textCapitalization: TextCapitalization.characters,
                            decoration: InputDecoration(
                              hintText: 'e.g. CG-892147',
                              filled: true,
                              fillColor: const Color(0xFFF8FAFC),
                              contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                              border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFFCBD5E1))),
                            ),
                          ),
                        ),
                        const SizedBox(width: 8),
                        ElevatedButton(
                          onPressed: _handleSearchCase,
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFF0056D2),
                            foregroundColor: Colors.white,
                            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                          ),
                          child: const Text('Track', style: TextStyle(fontWeight: FontWeight.bold)),
                        ),
                      ],
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 20),

              if (_trackedCase != null) ...[
                Container(
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: const Color(0xFFE2E8F0)),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.02),
                        blurRadius: 10,
                        offset: const Offset(0, 2),
                      ),
                    ],
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                            decoration: BoxDecoration(
                              color: const Color(0xFF0056D2).withOpacity(0.08),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Text(
                              _trackedCase!.referenceCode,
                              style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w900, color: Color(0xFF0056D2)),
                            ),
                          ),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                            decoration: BoxDecoration(
                              color: const Color(0xFFECFDF5),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Text(
                              _trackedCase!.statusLabel,
                              style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Color(0xFF065F46)),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 14),
                      Text(
                        _trackedCase!.title,
                        style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Color(0xFF0F172A)),
                      ),
                      const SizedBox(height: 6),
                      Text(
                        _trackedCase!.description,
                        style: const TextStyle(fontSize: 13, color: Color(0xFF475569), height: 1.4),
                      ),
                      const SizedBox(height: 20),

                      // Case Lifecycle Progress
                      const Text(
                        'Case Response Progress:',
                        style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Color(0xFF64748B)),
                      ),
                      const SizedBox(height: 12),
                      _buildTimelineItem('1. Report Received & Timestamped', true),
                      _buildTimelineItem('2. Triaged by CSA Duty Officer', true),
                      _buildTimelineItem('3. Active Investigation / Telco Block', _trackedCase!.status == 'INVESTIGATING' || _trackedCase!.status == 'RESOLVED'),
                      _buildTimelineItem('4. Case Resolved & Protection Concluded', _trackedCase!.status == 'RESOLVED'),
                    ],
                  ),
                ),
              ],
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildTimelineItem(String label, bool isCompleted) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        children: [
          Icon(
            isCompleted ? Icons.check_circle : Icons.radio_button_unchecked,
            size: 18,
            color: isCompleted ? const Color(0xFF10B981) : const Color(0xFF94A3B8),
          ),
          const SizedBox(width: 8),
          Text(
            label,
            style: TextStyle(
              fontSize: 12,
              fontWeight: isCompleted ? FontWeight.bold : FontWeight.normal,
              color: isCompleted ? const Color(0xFF0F172A) : const Color(0xFF94A3B8),
            ),
          ),
        ],
      ),
    );
  }
}
