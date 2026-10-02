import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/theme/app_theme.dart';
import '../../../data/models/quiz_model.dart';
import '../../../data/services/auth_service.dart';

class QuizScreen extends StatefulWidget {
  final QuizModel quiz;
  final VoidCallback? onQuizCompleted;

  const QuizScreen({
    super.key,
    required this.quiz,
    this.onQuizCompleted,
  });

  @override
  State<QuizScreen> createState() => _QuizScreenState();
}

class _QuizScreenState extends State<QuizScreen> {
  int _currentIndex = 0;
  int? _selectedOptionIndex;
  bool _hasAnswered = false;
  int _correctCount = 0;
  bool _isFinished = false;

  void _handleSelectOption(int index) {
    if (_hasAnswered) return;
    Haptics.selection();
    setState(() {
      _selectedOptionIndex = index;
    });
  }

  void _handleSubmitAnswer() {
    if (_selectedOptionIndex == null || _hasAnswered) return;

    final question = widget.quiz.questions[_currentIndex];
    final isCorrect = _selectedOptionIndex == question.correctIndex;

    if (isCorrect) {
      Haptics.success();
      _correctCount++;
    } else {
      Haptics.error();
    }

    setState(() {
      _hasAnswered = true;
    });
  }

  void _handleNextQuestion() {
    Haptics.light();
    if (_currentIndex < widget.quiz.questions.length - 1) {
      setState(() {
        _currentIndex++;
        _selectedOptionIndex = null;
        _hasAnswered = false;
      });
    } else {
      setState(() {
        _isFinished = true;
      });
      // Award XP to user
      final passed = (_correctCount / widget.quiz.questions.length) * 100 >= widget.quiz.passingScore;
      if (passed) {
        context.read<AuthService>().incrementXp(widget.quiz.xpReward);
        widget.onQuizCompleted?.call();
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isFinished) {
      return _buildCompletionScreen();
    }

    final question = widget.quiz.questions[_currentIndex];
    final totalQuestions = widget.quiz.questions.length;
    final progress = (_currentIndex + 1) / totalQuestions;

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.close, color: Color(0xFF0F172A)),
          onPressed: () => Navigator.pop(context),
        ),
        title: Text(
          widget.quiz.courseTitle,
          style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: Color(0xFF0F172A)),
        ),
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(4),
          child: LinearProgressIndicator(
            value: progress,
            backgroundColor: const Color(0xFFE2E8F0),
            valueColor: const AlwaysStoppedAnimation<Color>(Color(0xFF0056D2)),
            minHeight: 4,
          ),
        ),
      ),
      body: SafeArea(
        child: Column(
          children: [
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    // Question Count Indicator
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                          decoration: BoxDecoration(
                            color: const Color(0xFF0056D2).withOpacity(0.08),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Text(
                            'QUESTION ${_currentIndex + 1} OF $totalQuestions',
                            style: const TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.w800,
                              color: Color(0xFF0056D2),
                              letterSpacing: 0.5,
                            ),
                          ),
                        ),
                        Row(
                          children: [
                            const Icon(Icons.bolt, size: 16, color: Color(0xFFF59E0B)),
                            const SizedBox(width: 4),
                            Text(
                              '+${widget.quiz.xpReward} XP',
                              style: const TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.bold,
                                color: Color(0xFFD97706),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                    const SizedBox(height: 18),

                    // Question Box
                    Container(
                      padding: const EdgeInsets.all(18),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(color: const Color(0xFFE2E8F0)),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withOpacity(0.02),
                            blurRadius: 10,
                            offset: const Offset(0, 4),
                          ),
                        ],
                      ),
                      child: Text(
                        question.questionText,
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                          color: Color(0xFF0F172A),
                          height: 1.45,
                        ),
                      ),
                    ),
                    const SizedBox(height: 20),

                    // Options List
                    ...List.generate(question.options.length, (optIndex) {
                      final optText = question.options[optIndex];
                      final isSelected = _selectedOptionIndex == optIndex;
                      final isCorrect = optIndex == question.correctIndex;

                      Color borderColor = const Color(0xFFE2E8F0);
                      Color bgColor = Colors.white;
                      Color textColor = const Color(0xFF334155);
                      Widget? trailingIcon;

                      if (_hasAnswered) {
                        if (isCorrect) {
                          borderColor = const Color(0xFF10B981);
                          bgColor = const Color(0xFFECFDF5);
                          textColor = const Color(0xFF065F46);
                          trailingIcon = const Icon(Icons.check_circle, color: Color(0xFF10B981), size: 20);
                        } else if (isSelected && !isCorrect) {
                          borderColor = const Color(0xFFEF4444);
                          bgColor = const Color(0xFFFEF2F2);
                          textColor = const Color(0xFF991B1B);
                          trailingIcon = const Icon(Icons.cancel, color: Color(0xFFEF4444), size: 20);
                        }
                      } else if (isSelected) {
                        borderColor = const Color(0xFF0056D2);
                        bgColor = const Color(0xFFEFF6FF);
                        textColor = const Color(0xFF0056D2);
                      }

                      return Padding(
                        padding: const EdgeInsets.only(bottom: 12),
                        child: InkWell(
                          onTap: () => _handleSelectOption(optIndex),
                          borderRadius: BorderRadius.circular(16),
                          child: AnimatedContainer(
                            duration: const Duration(milliseconds: 180),
                            padding: const EdgeInsets.all(16),
                            decoration: BoxDecoration(
                              color: bgColor,
                              borderRadius: BorderRadius.circular(16),
                              border: Border.all(color: borderColor, width: isSelected || (_hasAnswered && isCorrect) ? 1.8 : 1),
                              boxShadow: isSelected
                                  ? [
                                      BoxShadow(
                                        color: const Color(0xFF0056D2).withOpacity(0.08),
                                        blurRadius: 8,
                                        offset: const Offset(0, 2),
                                      ),
                                    ]
                                  : null,
                            ),
                            child: Row(
                              children: [
                                Container(
                                  width: 28,
                                  height: 28,
                                  decoration: BoxDecoration(
                                    color: isSelected ? const Color(0xFF0056D2) : const Color(0xFFF1F5F9),
                                    shape: BoxShape.circle,
                                  ),
                                  child: Center(
                                    child: Text(
                                      String.fromCharCode(65 + optIndex), // A, B, C, D
                                      style: TextStyle(
                                        fontSize: 12,
                                        fontWeight: FontWeight.bold,
                                        color: isSelected ? Colors.white : const Color(0xFF64748B),
                                      ),
                                    ),
                                  ),
                                ),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: Text(
                                    optText,
                                    style: TextStyle(
                                      fontSize: 14,
                                      fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
                                      color: textColor,
                                      height: 1.3,
                                    ),
                                  ),
                                ),
                                if (trailingIcon != null) ...[
                                  const SizedBox(width: 8),
                                  trailingIcon,
                                ],
                              ],
                            ),
                          ),
                        ),
                      );
                    }),

                    // Explanation Box
                    if (_hasAnswered) ...[
                      const SizedBox(height: 12),
                      Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: const Color(0xFFF0FDF4),
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: const Color(0xFFBBF7D0)),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Row(
                              children: [
                                Icon(Icons.lightbulb_outline, color: Color(0xFF16A34A), size: 18),
                                SizedBox(width: 6),
                                Text(
                                  'Official Safety Rule (Act 1038):',
                                  style: TextStyle(
                                    fontSize: 12,
                                    fontWeight: FontWeight.bold,
                                    color: Color(0xFF16A34A),
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 6),
                            Text(
                              question.explanation,
                              style: const TextStyle(
                                fontSize: 13,
                                color: Color(0xFF166534),
                                height: 1.4,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ],
                ),
              ),
            ),

            // Bottom Action Button
            Container(
              padding: const EdgeInsets.all(16),
              decoration: const BoxDecoration(
                color: Colors.white,
                border: Border(top: BorderSide(color: Color(0xFFE2E8F0))),
              ),
              child: SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: _selectedOptionIndex == null
                      ? null
                      : _hasAnswered
                          ? _handleNextQuestion
                          : _handleSubmitAnswer,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF0056D2),
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                  ),
                  child: Text(
                    !_hasAnswered
                        ? 'Check Answer'
                        : _currentIndex < totalQuestions - 1
                            ? 'Next Question →'
                            : 'View Final Results 🎉',
                    style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildCompletionScreen() {
    final total = widget.quiz.questions.length;
    final scorePct = ((_correctCount / total) * 100).round();
    final passed = scorePct >= widget.quiz.passingScore;

    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(28),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Center(
                child: Container(
                  width: 90,
                  height: 90,
                  decoration: BoxDecoration(
                    color: passed ? const Color(0xFFECFDF5) : const Color(0xFFFEF2F2),
                    shape: BoxShape.circle,
                    border: Border.all(
                      color: passed ? const Color(0xFF10B981) : const Color(0xFFEF4444),
                      width: 2.5,
                    ),
                  ),
                  child: Center(
                    child: Icon(
                      passed ? Icons.verified : Icons.replay,
                      color: passed ? const Color(0xFF10B981) : const Color(0xFFEF4444),
                      size: 52,
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 20),

              Text(
                passed ? 'Assessment Passed! 🛡️' : 'Keep Training, Defender',
                textAlign: TextAlign.center,
                style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w900, color: Color(0xFF0F172A)),
              ),
              const SizedBox(height: 6),
              Text(
                passed
                    ? 'You scored $scorePct%. You have demonstrated proficiency under the National Child Online Protection guidelines.'
                    : 'You scored $scorePct%. The passing mark is ${widget.quiz.passingScore}%. Review the lessons and try again.',
                textAlign: TextAlign.center,
                style: const TextStyle(fontSize: 13, color: Color(0xFF64748B), height: 1.45),
              ),

              const SizedBox(height: 28),

              // Score Card
              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: const Color(0xFFF8FAFC),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: const Color(0xFFE2E8F0)),
                ),
                child: Column(
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text('Correct Answers', style: TextStyle(color: Color(0xFF64748B), fontSize: 13)),
                        Text('$_correctCount of $total', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                      ],
                    ),
                    const Divider(height: 24),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text('Final Score', style: TextStyle(color: Color(0xFF64748B), fontSize: 13)),
                        Text('$scorePct%', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 16, color: passed ? const Color(0xFF10B981) : const Color(0xFFEF4444))),
                      ],
                    ),
                    const Divider(height: 24),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text('XP Reward Earned', style: TextStyle(color: Color(0xFF64748B), fontSize: 13)),
                        Text(passed ? '+${widget.quiz.xpReward} XP' : '0 XP', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: Color(0xFFD97706))),
                      ],
                    ),
                  ],
                ),
              ),

              const Spacer(),

              ElevatedButton(
                onPressed: () {
                  Haptics.medium();
                  Navigator.pop(context);
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF0056D2),
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                ),
                child: const Text('Return to Course & Modules', style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold)),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
