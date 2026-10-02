import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/theme/app_theme.dart';
import '../../../data/models/incident_model.dart';
import '../../../data/services/incident_service.dart';

class IncidentStatusScreen extends StatefulWidget {
  final String? initialRef;

  const IncidentStatusScreen({super.key, this.initialRef});

  @override
  State<IncidentStatusScreen> createState() => _IncidentStatusScreenState();
}

class _IncidentStatusScreenState extends State<IncidentStatusScreen> {
  final _refController = TextEditingController();
  IncidentModel? _lookedUpReport;
  bool _searched = false;

  @override
  void initState() {
    super.initState();
    if (widget.initialRef != null) {
      _refController.text = widget.initialRef!;
      _performLookup();
    }
  }

  void _performLookup() {
    Haptics.medium();
    final code = _refController.text.trim();
    if (code.isEmpty) return;

    final incidentService = context.read<IncidentService>();
    final result = incidentService.lookupByReference(code);

    setState(() {
      _lookedUpReport = result;
      _searched = true;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.backgroundLight,
      appBar: AppBar(
        title: const Text('Track Incident Status'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded, size: 20),
          onPressed: () => Navigator.of(context).pop(),
        ),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Search Header Card
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(20),
                  boxShadow: AppTheme.cardShadow,
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Enter Reference Code',
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w800,
                        color: AppTheme.primaryDark,
                      ),
                    ),
                    const SizedBox(height: 4),
                    const Text(
                      'Zero-Knowledge Tracking: No personal identity is ever linked to this lookup.',
                      style: TextStyle(fontSize: 12, color: AppTheme.textSecondary),
                    ),
                    const SizedBox(height: 14),
                    Row(
                      children: [
                        Expanded(
                          child: Container(
                            decoration: BoxDecoration(
                              color: AppTheme.surfaceSubtle,
                              borderRadius: BorderRadius.circular(14),
                              border: Border.all(color: AppTheme.borderLight),
                            ),
                            child: TextField(
                              controller: _refController,
                              textCapitalization: TextCapitalization.characters,
                              style: const TextStyle(
                                fontFamily: 'monospace',
                                fontWeight: FontWeight.w800,
                                fontSize: 15,
                              ),
                              decoration: const InputDecoration(
                                hintText: 'e.g. CG-892147',
                                border: InputBorder.none,
                                enabledBorder: InputBorder.none,
                                focusedBorder: InputBorder.none,
                                contentPadding: EdgeInsets.symmetric(
                                    horizontal: 14, vertical: 12),
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(width: 10),
                        ElevatedButton(
                          onPressed: _performLookup,
                          style: ElevatedButton.styleFrom(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 18, vertical: 14),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(14),
                            ),
                          ),
                          child: const Text('Check'),
                        ),
                      ],
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 24),

              if (_searched && _lookedUpReport == null) ...[
                Center(
                  child: Padding(
                    padding: const EdgeInsets.all(32),
                    child: Column(
                      children: const [
                        Icon(Icons.shield_outlined,
                            size: 48, color: AppTheme.textMuted),
                        SizedBox(height: 12),
                        Text(
                          'No case found for this reference code. Please verify the 6 digits.',
                          textAlign: TextAlign.center,
                          style: TextStyle(
                              color: AppTheme.textSecondary, fontSize: 13),
                        ),
                      ],
                    ),
                  ),
                ),
              ],

              if (_lookedUpReport != null) ...[
                // Case Details Card
                Container(
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(24),
                    boxShadow: AppTheme.cardShadow,
                    border: Border.all(color: AppTheme.borderLight),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 10, vertical: 4),
                            decoration: BoxDecoration(
                              color: AppTheme.primaryBlueLight,
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Text(
                              _lookedUpReport!.referenceCode,
                              style: const TextStyle(
                                fontFamily: 'monospace',
                                fontSize: 13,
                                fontWeight: FontWeight.w800,
                                color: AppTheme.primaryBlue,
                              ),
                            ),
                          ),
                          Container(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 10, vertical: 4),
                            decoration: BoxDecoration(
                              color: AppTheme.accentAmberLight,
                              borderRadius: BorderRadius.circular(100),
                            ),
                            child: Text(
                              _lookedUpReport!.statusLabel,
                              style: const TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.w800,
                                color: Color(0xFFB45309),
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 14),
                      Text(
                        _lookedUpReport!.title,
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w800,
                          color: AppTheme.primaryDark,
                          letterSpacing: -0.3,
                        ),
                      ),
                      const SizedBox(height: 6),
                      Text(
                        _lookedUpReport!.description,
                        style: const TextStyle(
                          fontSize: 13,
                          color: AppTheme.textSecondary,
                          height: 1.4,
                        ),
                      ),

                      const SizedBox(height: 20),
                      const Divider(height: 1, color: AppTheme.borderLight),
                      const SizedBox(height: 20),

                      // Ghana Act 1038 Investigation Timeline
                      const Text(
                        'CASE PROGRESSION',
                        style: TextStyle(
                          fontSize: 10,
                          fontWeight: FontWeight.w800,
                          color: AppTheme.textMuted,
                          letterSpacing: 0.8,
                        ),
                      ),
                      const SizedBox(height: 14),

                      _buildTimelineStep(
                        title: '1. Incident Received (Zero-Knowledge)',
                        subtitle: 'Encrypted into CSA National Intake queue.',
                        isComplete: true,
                        isCurrent: false,
                      ),
                      _buildTimelineStep(
                        title: '2. Triage by Child Protection Specialist',
                        subtitle: 'Risk assessed & assigned to duty officer.',
                        isComplete: true,
                        isCurrent: false,
                      ),
                      _buildTimelineStep(
                        title: '3. CSA Technical Investigation & Telco Action',
                        subtitle: 'Malicious sender accounts coordinated for freeze.',
                        isComplete: _lookedUpReport!.status == 'INVESTIGATING' ||
                            _lookedUpReport!.status == 'RESOLVED',
                        isCurrent: _lookedUpReport!.status == 'INVESTIGATING',
                      ),
                      _buildTimelineStep(
                        title: '4. Case Resolution & Child Protection Closure',
                        subtitle: 'Threat mitigated; evidence hash permanently sealed.',
                        isComplete: _lookedUpReport!.status == 'RESOLVED',
                        isCurrent: false,
                        isLast: true,
                      ),

                      if (_lookedUpReport!.evidenceHash != null) ...[
                        const SizedBox(height: 20),
                        Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: AppTheme.surfaceSubtle,
                            borderRadius: BorderRadius.circular(14),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text(
                                'FORENSIC EVIDENCE HASH (SHA-256)',
                                style: TextStyle(
                                  fontSize: 9,
                                  fontWeight: FontWeight.w800,
                                  color: AppTheme.textMuted,
                                ),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                _lookedUpReport!.evidenceHash!,
                                style: const TextStyle(
                                  fontFamily: 'monospace',
                                  fontSize: 11,
                                  color: AppTheme.primaryDark,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildTimelineStep({
    required String title,
    required String subtitle,
    required bool isComplete,
    required bool isCurrent,
    bool isLast = false,
  }) {
    Color iconColor = AppTheme.textMuted;
    if (isComplete) iconColor = AppTheme.accentGreen;
    if (isCurrent) iconColor = AppTheme.primaryBlue;

    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Column(
          children: [
            Icon(
              isComplete ? Icons.check_circle_rounded : Icons.radio_button_unchecked_rounded,
              size: 20,
              color: iconColor,
            ),
            if (!isLast)
              Container(
                width: 2,
                height: 38,
                color: isComplete ? AppTheme.accentGreen : AppTheme.borderLight,
              ),
          ],
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Padding(
            padding: const EdgeInsets.only(bottom: 12),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: isComplete || isCurrent ? FontWeight.w800 : FontWeight.w500,
                    color: isComplete || isCurrent ? AppTheme.primaryDark : AppTheme.textMuted,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  subtitle,
                  style: const TextStyle(fontSize: 11, color: AppTheme.textSecondary),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}
