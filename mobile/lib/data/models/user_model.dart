class UserModel {
  final String id;
  final String displayName;
  final String? username;
  final String email;
  final String role; // STUDENT, TUTOR, CSA_OFFICER, ADMIN
  final String? avatarUrl;
  final String ageBand; // "12-18" or "19-23"
  final int xp;
  final int level;
  final int streakDays;
  final int completedCoursesCount;
  final int certificatesCount;
  final bool hasKeys;

  UserModel({
    required this.id,
    required this.displayName,
    this.username,
    required this.email,
    required this.role,
    this.avatarUrl,
    this.ageBand = '12-18',
    this.xp = 450,
    this.level = 3,
    this.streakDays = 5,
    this.completedCoursesCount = 2,
    this.certificatesCount = 1,
    this.hasKeys = false,
  });

  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      id: json['id'] as String? ?? '',
      displayName: json['displayName'] as String? ?? 'Cyber Guard',
      username: json['username'] as String?,
      email: json['email'] as String? ?? '',
      role: json['role'] as String? ?? 'STUDENT',
      avatarUrl: json['avatarUrl'] as String?,
      ageBand: json['ageBand'] as String? ?? '12-18',
      xp: json['xp'] as int? ?? 450,
      level: json['level'] as int? ?? 3,
      streakDays: json['streakDays'] as int? ?? 5,
      completedCoursesCount: json['completedCoursesCount'] as int? ?? 2,
      certificatesCount: json['certificatesCount'] as int? ?? 1,
      hasKeys: json['hasKeys'] as bool? ?? false,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'displayName': displayName,
      'username': username,
      'email': email,
      'role': role,
      'avatarUrl': avatarUrl,
      'ageBand': ageBand,
      'xp': xp,
      'level': level,
      'streakDays': streakDays,
      'completedCoursesCount': completedCoursesCount,
      'certificatesCount': certificatesCount,
      'hasKeys': hasKeys,
    };
  }
}
