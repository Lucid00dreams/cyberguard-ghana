class TutorModel {
  final String id;
  final String name;
  final String title;
  final String bio;
  final double rating;
  final int reviewsCount;
  final String avatarUrl;
  final List<String> specialties;
  final List<String> availableSlots;
  final String jitsiRoomUrl;
  final bool isVerified;
  final String hourlyRate; // e.g. "Free (Sponsored by CSA)" or "GH₵ 40"

  TutorModel({
    required this.id,
    required this.name,
    required this.title,
    required this.bio,
    this.rating = 4.9,
    this.reviewsCount = 24,
    required this.avatarUrl,
    required this.specialties,
    required this.availableSlots,
    required this.jitsiRoomUrl,
    this.isVerified = true,
    this.hourlyRate = 'Free (Youth Sponsored)',
  });
}
