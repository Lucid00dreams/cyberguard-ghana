class QuizQuestion {
  final String id;
  final String questionText;
  final List<String> options;
  final int correctIndex;
  final String explanation;

  QuizQuestion({
    required this.id,
    required this.questionText,
    required this.options,
    required this.correctIndex,
    required this.explanation,
  });

  factory QuizQuestion.fromJson(Map<String, dynamic> json) {
    return QuizQuestion(
      id: json['id'] as String? ?? '',
      questionText: json['questionText'] as String? ?? '',
      options: (json['options'] as List<dynamic>?)
              ?.map((e) => e.toString())
              .toList() ??
          [],
      correctIndex: json['correctIndex'] as int? ?? 0,
      explanation: json['explanation'] as String? ?? '',
    );
  }
}

class QuizModel {
  final String id;
  final String courseId;
  final String courseTitle;
  final int passingScore; // percentage e.g. 70
  final int xpReward;
  final List<QuizQuestion> questions;

  QuizModel({
    required this.id,
    required this.courseId,
    required this.courseTitle,
    this.passingScore = 70,
    this.xpReward = 150,
    required this.questions,
  });
}
