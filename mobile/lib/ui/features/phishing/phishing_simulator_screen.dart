import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/theme/app_theme.dart';
import '../../../data/models/phishing_model.dart';
import '../../../data/services/auth_service.dart';
import '../../../data/services/phishing_service.dart';

class PhishingSimulatorScreen extends StatefulWidget {
  const PhishingSimulatorScreen({super.key});

  @override
  State<PhishingSimulatorScreen> createState() =>
      _PhishingSimulatorScreenState();
}

class _PhishingSimulatorScreenState extends State<PhishingSimulatorScreen> {
  int _scenarioIndex = 0;
  bool _evaluated = false;
  bool? _wasCorrect;

  @override
  Widget build(BuildContext context) {
    final phishingService = context.watch<PhishingService>();
    final scenarios = phishingService.scenarios;
    final currentScenario = scenarios[_scenarioIndex];
    final total = scenarios.length;

    return Scaffold(
      backgroundColor: AppTheme.backgroundLight,
      appBar: AppBar(
        title: const Text('Phishing Simulator'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded, size: 20),
          onPressed: () => Navigator.of(context).pop(),
        ),
        actions: [
          Container(
            margin: const EdgeInsets.only(right: 16),
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
            decoration: BoxDecoration(
              color: AppTheme.accentAmberLight,
              borderRadius: BorderRadius.circular(100),
            ),
            child: Row(
              children: [
                const Icon(Icons.bolt_rounded, size: 16, color: Color(0xFFB45309)),
                const SizedBox(width: 4),
                Text(
                  'Score: ${phishingService.score} XP',
                  style: const TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w800,
                    color: Color(0xFFB45309),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
      body: SafeArea(
        child: Column(
          children: [
            // Top Progress
            LinearProgressIndicator(
              value: (_scenarioIndex + 1) / total,
              minHeight: 4,
              backgroundColor: AppTheme.surfaceSubtle,
              valueColor: const AlwaysStoppedAnimation<Color>(AppTheme.primaryBlue),
            ),

            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    // Threat Radar Hero Banner
                    Container(
                      margin: const EdgeInsets.only(bottom: 18),
                      height: 120,
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(18),
                        image: const DecorationImage(
                          image: AssetImage('assets/images/hero-threat.png'),
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
                              Colors.black.withOpacity(0.2),
                              Colors.black.withOpacity(0.75),
                            ],
                          ),
                        ),
                        padding: const EdgeInsets.all(14),
                        alignment: Alignment.bottomLeft,
                        child: const Row(
                          children: [
                            Icon(Icons.radar_rounded, color: AppTheme.accentAmber, size: 24),
                            SizedBox(width: 10),
                            Expanded(
                              child: Column(
                                mainAxisSize: MainAxisSize.min,
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    'MoMo & Social Engineering Radar',
                                    style: TextStyle(
                                      color: Colors.white,
                                      fontSize: 14,
                                      fontWeight: FontWeight.w800,
                                    ),
                                  ),
                                  Text(
                                    'Analyze real-world Ghana scam techniques & red flags',
                                    style: TextStyle(color: Colors.white70, fontSize: 11),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),

                    // Scenario Card Header
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                          decoration: BoxDecoration(
                            color: currentScenario.channel == 'SMS'
                                ? AppTheme.accentGreenLight
                                : AppTheme.primaryBlueLight,
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Text(
                            'Channel: ${currentScenario.channel}',
                            style: TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.w800,
                              color: currentScenario.channel == 'SMS'
                                  ? const Color(0xFF047857)
                                  : AppTheme.primaryBlue,
                            ),
                          ),
                        ),
                        Text(
                          'Scenario ${_scenarioIndex + 1} of $total',
                          style: const TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                            color: AppTheme.textSecondary,
                          ),
                        ),
                      ],
                    ),

                    const SizedBox(height: 12),

                    Text(
                      currentScenario.title,
                      style: const TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.w800,
                        color: AppTheme.primaryDark,
                        letterSpacing: -0.3,
                      ),
                    ),

                    const SizedBox(height: 16),

                    // Realistic Mock Device Message Bubble
                    Container(
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(24),
                        boxShadow: AppTheme.cardShadow,
                        border: Border.all(color: AppTheme.borderLight),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          // Fake Message Header
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                            decoration: const BoxDecoration(
                              color: AppTheme.surfaceSubtle,
                              borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
                            ),
                            child: Row(
                              children: [
                                CircleAvatar(
                                  radius: 16,
                                  backgroundColor: AppTheme.primaryDark.withOpacity(0.1),
                                  child: const Icon(Icons.person_rounded, size: 18, color: AppTheme.primaryDark),
                                ),
                                const SizedBox(width: 10),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        currentScenario.senderName,
                                        style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w800),
                                      ),
                                      Text(
                                        currentScenario.senderAddress,
                                        style: const TextStyle(fontSize: 11, color: AppTheme.textMuted),
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                          ),

                          // Message Body
                          Padding(
                            padding: const EdgeInsets.all(20),
                            child: Text(
                              currentScenario.messageBody,
                              style: const TextStyle(
                                fontSize: 14,
                                height: 1.5,
                                color: AppTheme.primaryDark,
                                fontFamily: 'monospace',
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),

                    const SizedBox(height: 20),

                    // Feedback Box after Choice
                    if (_evaluated) ...[
                      Container(
                        padding: const EdgeInsets.all(18),
                        decoration: BoxDecoration(
                          color: _wasCorrect == true
                              ? AppTheme.accentGreenLight
                              : AppTheme.accentRedLight,
                          borderRadius: BorderRadius.circular(20),
                          border: Border.all(
                            color: _wasCorrect == true
                                ? AppTheme.accentGreen
                                : AppTheme.accentRed,
                          ),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                Icon(
                                  _wasCorrect == true
                                      ? Icons.check_circle_rounded
                                      : Icons.cancel_rounded,
                                  color: _wasCorrect == true
                                      ? AppTheme.accentGreen
                                      : AppTheme.accentRed,
                                  size: 22,
                                ),
                                const SizedBox(width: 8),
                                Text(
                                  _wasCorrect == true
                                      ? 'Correct! (+50 XP)'
                                      : 'Incorrect Decision',
                                  style: TextStyle(
                                    fontSize: 14,
                                    fontWeight: FontWeight.w800,
                                    color: _wasCorrect == true
                                        ? const Color(0xFF047857)
                                        : AppTheme.accentRed,
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 10),
                            Text(
                              currentScenario.breakdown,
                              style: const TextStyle(fontSize: 13, height: 1.4, color: AppTheme.primaryDark),
                            ),
                            if (currentScenario.redFlags.isNotEmpty) ...[
                              const SizedBox(height: 10),
                              const Text(
                                'KEY RED FLAGS TO LOOK FOR:',
                                style: TextStyle(fontSize: 10, fontWeight: FontWeight.w800, color: AppTheme.textMuted),
                              ),
                              const SizedBox(height: 4),
                              ...currentScenario.redFlags.map(
                                (rf) => Padding(
                                  padding: const EdgeInsets.only(top: 3),
                                  child: Row(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      const Text('• ', style: TextStyle(fontWeight: FontWeight.w800)),
                                      Expanded(child: Text(rf, style: const TextStyle(fontSize: 12))),
                                    ],
                                  ),
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

            // Bottom Evaluation Buttons
            Container(
              padding: const EdgeInsets.all(16),
              decoration: const BoxDecoration(
                color: Colors.white,
                border: Border(top: BorderSide(color: AppTheme.borderLight)),
              ),
              child: _evaluated
                  ? ElevatedButton(
                      onPressed: () {
                        Haptics.light();
                        if (_scenarioIndex + 1 < total) {
                          setState(() {
                            _scenarioIndex++;
                            _evaluated = false;
                            _wasCorrect = null;
                          });
                        } else {
                          // All completed
                          showDialog(
                            context: context,
                            builder: (ctx) => AlertDialog(
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                              title: const Text('Simulation Completed!'),
                              content: Text('Great job! You achieved ${phishingService.score} XP across all realistic Ghanaian phishing scenarios.'),
                              actions: [
                                TextButton(
                                  onPressed: () {
                                    Navigator.of(ctx).pop();
                                    Navigator.of(context).pop();
                                  },
                                  child: const Text('Done'),
                                ),
                              ],
                            ),
                          );
                        }
                      },
                      style: ElevatedButton.styleFrom(padding: const EdgeInsets.symmetric(vertical: 16)),
                      child: Text(_scenarioIndex + 1 < total ? 'Next Challenge' : 'Complete Simulator'),
                    )
                  : Row(
                      children: [
                        Expanded(
                          child: ElevatedButton.icon(
                            onPressed: () {
                              Haptics.medium();
                              final correct = phishingService.evaluateAnswer(currentScenario, true);
                              if (correct) {
                                context.read<AuthService>().addXp(50);
                              }
                              setState(() {
                                _evaluated = true;
                                _wasCorrect = correct;
                              });
                            },
                            icon: const Icon(Icons.shield_alert_rounded, size: 18),
                            label: const Text('Report Phishing'),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: AppTheme.accentRed,
                              padding: const EdgeInsets.symmetric(vertical: 14),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                            ),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: OutlinedButton.icon(
                            onPressed: () {
                              Haptics.medium();
                              final correct = phishingService.evaluateAnswer(currentScenario, false);
                              if (correct) {
                                context.read<AuthService>().addXp(50);
                              }
                              setState(() {
                                _evaluated = true;
                                _wasCorrect = correct;
                              });
                            },
                            icon: const Icon(Icons.check_circle_outline_rounded, size: 18, color: AppTheme.accentGreen),
                            label: const Text('Mark Legitimate', style: TextStyle(color: Color(0xFF047857), fontWeight: FontWeight.w700)),
                            style: OutlinedButton.styleFrom(
                              padding: const EdgeInsets.symmetric(vertical: 14),
                              side: const BorderSide(color: AppTheme.accentGreen),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                            ),
                          ),
                        ),
                      ],
                    ),
            ),
          ],
        ),
      ),
    );
  }
}
