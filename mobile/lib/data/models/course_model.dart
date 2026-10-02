class CourseLesson {
  final String id;
  final String title;
  final int durationMinutes;
  final String content;
  bool isCompleted;

  CourseLesson({
    required this.id,
    required this.title,
    required this.durationMinutes,
    required this.content,
    this.isCompleted = false,
  });

  factory CourseLesson.fromJson(Map<String, dynamic> json) {
    return CourseLesson(
      id: json['id'] as String? ?? '',
      title: json['title'] as String? ?? '',
      durationMinutes: json['durationMinutes'] as int? ?? 5,
      content: json['content'] as String? ?? '',
      isCompleted: json['isCompleted'] as bool? ?? false,
    );
  }
}

class CourseModule {
  final String id;
  final String title;
  final List<CourseLesson> lessons;

  CourseModule({
    required this.id,
    required this.title,
    required this.lessons,
  });

  factory CourseModule.fromJson(Map<String, dynamic> json) {
    return CourseModule(
      id: json['id'] as String? ?? '',
      title: json['title'] as String? ?? '',
      lessons: (json['lessons'] as List<dynamic>?)
              ?.map((e) => CourseLesson.fromJson(e as Map<String, dynamic>))
              .toList() ??
          [],
    );
  }
}

class CourseModel {
  final String id;
  final String slug;
  final String title;
  final String description;
  final String ageBand; // "12-18", "19-23", "ALL"
  final String level; // "Beginner", "Intermediate", "Advanced"
  final int durationMinutes;
  final String category;
  final String heroImage;
  final List<CourseModule> modules;
  final String? quizId;
  double progressPct;
  bool isEnrolled;

  CourseModel({
    required this.id,
    required this.slug,
    required this.title,
    required this.description,
    required this.ageBand,
    required this.level,
    required this.durationMinutes,
    required this.category,
    required this.heroImage,
    required this.modules,
    this.quizId,
    this.progressPct = 0.0,
    this.isEnrolled = false,
  });

  int get totalLessons => modules.fold(0, (sum, m) => sum + m.lessons.length);
  int get completedLessons => modules.fold(
      0, (sum, m) => sum + m.lessons.where((l) => l.isCompleted).length);
}
