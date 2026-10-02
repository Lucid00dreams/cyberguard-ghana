import 'package:flutter/foundation.dart';
import '../models/course_model.dart';
import '../models/quiz_model.dart';

class CourseService extends ChangeNotifier {
  List<CourseModel> _courses = [];
  bool _isLoading = false;

  List<CourseModel> get courses => _courses;
  bool get isLoading => _isLoading;

  CourseService() {
    _loadInitialCourses();
  }

  void _loadInitialCourses() {
    _courses = [
      CourseModel(
        id: 'c1',
        slug: 'detecting-momo-sms-scams',
        title: 'Detecting Mobile Money (MoMo) & SMS Scams',
        description:
            'Learn how cybercriminals in Ghana spoof sender IDs, impersonate telcos, and attempt to steal your Mobile Money wallet PIN.',
        ageBand: '12-18',
        level: 'Beginner',
        durationMinutes: 25,
        category: 'Social Engineering',
        heroImage: 'assets/images/hero-courses.png',
        quizId: 'q1',
        progressPct: 0.65,
        isEnrolled: true,
        modules: [
          CourseModule(
            id: 'm1_1',
            title: 'Anatomy of a Ghanaian SMS Scam',
            lessons: [
              CourseLesson(
                id: 'l1_1',
                title: 'How Telecom Sender ID Spoofing Works',
                durationMinutes: 7,
                isCompleted: true,
                content:
                    'Cybercriminals frequently disguise SMS sender IDs as "MTN Ghana", "Telecel Promo", or "AT Cash". In Ghana, legit telcos will NEVER ask you to dial *170# to reverse a payment or share a 6-digit one-time PIN (OTP) with an agent on a phone call.',
              ),
              CourseLesson(
                id: 'l1_2',
                title: 'The "Wrong Transfer" Social Engineering Trap',
                durationMinutes: 8,
                isCompleted: true,
                content:
                    'A scammer sends a fake SMS mimicking a cash deposit alert of GH₵ 500, followed by an emotional call pleading that it was their sick child hospital fee. ALWAYS verify your real wallet balance by dialing the official USSD yourself before responding.',
              ),
              CourseLesson(
                id: 'l1_3',
                title: 'Reporting Scammer Numbers to 292 & Telcos',
                durationMinutes: 10,
                isCompleted: false,
                content:
                    'Under Ghana Cybersecurity Act (Act 1038), reporting fraudulent MSISDNs allows the National Cyber Security Authority to coordinate with telcos to freeze malicious accounts and trace perpetrators.',
              ),
            ],
          ),
        ],
      ),
      CourseModel(
        id: 'c2',
        slug: 'cop-cyberbullying-online-predators',
        title: 'Child Online Protection: Defense against Grooming & Blackmail',
        description:
            'Critical defense strategies under the National COP Framework to identify predatory behavior, prevent sextortion, and preserve forensic evidence.',
        ageBand: '12-18',
        level: 'Beginner',
        durationMinutes: 30,
        category: 'COP Safety',
        heroImage: 'assets/images/hero-threat.png',
        quizId: 'q2',
        progressPct: 0.2,
        isEnrolled: true,
        modules: [
          CourseModule(
            id: 'm2_1',
            title: 'Recognizing Online Grooming Red Flags',
            lessons: [
              CourseLesson(
                id: 'l2_1',
                title: 'Secrecy, Gifts, and Private Channels',
                durationMinutes: 10,
                isCompleted: true,
                content:
                    'Predators attempt to isolate young people by offering game currency, phone credits, or expensive gifts while asking to switch to disappearing chat apps. Secrecy is always the first warning sign.',
              ),
              CourseLesson(
                id: 'l2_2',
                title: 'Zero-Knowledge Incident Reporting',
                durationMinutes: 10,
                isCompleted: false,
                content:
                    'If you or someone you know faces intimidation or illicit photo threats, NEVER pay or comply. CyberGuard allows you to report anonymously with automatic EXIF metadata stripping and SHA-256 fingerprinting.',
              ),
            ],
          ),
        ],
      ),
      CourseModel(
        id: 'c3',
        slug: 'ethical-hacking-network-fundamentals',
        title: 'Defensive Security & Network Safeguards',
        description:
            'Hands-on foundations for tertiary students (19-23) exploring packet analysis, password entropy, multi-factor authentication, and safe Wi-Fi hygiene.',
        ageBand: '19-23',
        level: 'Intermediate',
        durationMinutes: 45,
        category: 'Defensive Security',
        heroImage: 'assets/images/hero-dashboard.png',
        quizId: 'q3',
        progressPct: 0.0,
        isEnrolled: false,
        modules: [
          CourseModule(
            id: 'm3_1',
            title: 'Authentication & Credential Security',
            lessons: [
              CourseLesson(
                id: 'l3_1',
                title: 'Passphrases vs Brute Force Attacks',
                durationMinutes: 12,
                content:
                    'Learn how mathematical entropy protects passphrases. A four-word random passphrase like "correct-horse-battery-staple" is drastically stronger than complex short passwords like "P@ss1".',
              ),
              CourseLesson(
                id: 'l3_2',
                title: 'Hardware Keys & Authenticator Apps',
                durationMinutes: 15,
                content:
                    'Why SMS 2FA is vulnerable to SIM-swapping in West Africa, and how TOTP apps (Google Authenticator, Bitwarden) eliminate interception vulnerabilities.',
              ),
            ],
          ),
        ],
      ),
      CourseModel(
        id: 'c4',
        slug: 'social-media-privacy-osint-defense',
        title: 'OSINT Defense: Protecting Your Digital Footprint',
        description:
            'How attackers use open source intelligence on TikTok, Instagram, and X to map school schedules, home locations, and family relations.',
        ageBand: '19-23',
        level: 'Advanced',
        durationMinutes: 40,
        category: 'OSINT Defense',
        heroImage: 'assets/images/hero-students.png',
        quizId: 'q4',
        progressPct: 1.0,
        isEnrolled: true,
        modules: [
          CourseModule(
            id: 'm4_1',
            title: 'Metadata and Geolocation Risks',
            lessons: [
              CourseLesson(
                id: 'l4_1',
                title: 'EXIF GPS Data in Shared Photographs',
                durationMinutes: 15,
                isCompleted: true,
                content:
                    'Smartphone cameras embed precise GPS coordinates in every photograph. Sharing raw camera uploads can reveal your exact bedroom window or school bus stop to anonymous actors.',
              ),
            ],
          ),
        ],
      ),
    ];
  }

  List<CourseModel> getCoursesForAge(String ageBand) {
    if (ageBand == 'ALL') return _courses;
    return _courses.where((c) => c.ageBand == ageBand || c.ageBand == 'ALL').toList();
  }

  CourseModel? getCourseBySlug(String slug) {
    try {
      return _courses.firstWhere((c) => c.slug == slug);
    } catch (_) {
      return null;
    }
  }

  void completeLesson(String courseSlug, String lessonId) {
    final course = getCourseBySlug(courseSlug);
    if (course == null) return;

    for (final module in course.modules) {
      for (final lesson in module.lessons) {
        if (lesson.id == lessonId) {
          lesson.isCompleted = true;
        }
      }
    }

    final total = course.totalLessons;
    final done = course.completedLessons;
    course.progressPct = total > 0 ? done / total : 1.0;
    notifyListeners();
  }

  void enrollInCourse(String courseSlug) {
    final course = getCourseBySlug(courseSlug);
    if (course == null) return;
    course.isEnrolled = true;
    notifyListeners();
  }

  // Quiz lookup
  QuizModel getQuiz(String quizId) {
    switch (quizId) {
      case 'q1':
        return QuizModel(
          id: 'q1',
          courseId: 'c1',
          courseTitle: 'Detecting MoMo & SMS Scams',
          passingScore: 75,
          xpReward: 150,
          questions: [
            QuizQuestion(
              id: 'q1_1',
              questionText:
                  'A caller claims they mistakenly transferred GH₵ 400 to your wallet and asks you to immediately dial a code to refund them. What is the safest step?',
              options: [
                'Dial the code they tell you quickly so you are honest',
                'Dial *170# yourself, check your real balance, and call your telco official helpline (100) or 292',
                'Forward the money to an unfamiliar number',
                'Give them your 4-digit PIN so they can pull it back'
              ],
              correctIndex: 1,
              explanation:
                  'Always independently verify your real wallet balance through the official USSD menu. Never trust caller claims or dial USSD sequences requested by strangers.',
            ),
            QuizQuestion(
              id: 'q1_2',
              questionText:
                  'Can an SMS message show "MTN" as the sender name even when it was sent by a scammer?',
              options: [
                'No, telco names can never be forged',
                'Yes, through SMS Sender ID spoofing software',
                'Only if the scammer works at a telecom branch',
                'Only on Android devices, not iPhones'
              ],
              correctIndex: 1,
              explanation:
                  'SMS Sender ID spoofing allows malicious actors to display arbitrary text names in the sender header without cryptographic proof.',
            ),
            QuizQuestion(
              id: 'q1_3',
              questionText:
                  'What is Ghana’s official Cyber Security Authority emergency incident reporting hotline?',
              options: ['911', '191', '292', '112'],
              correctIndex: 2,
              explanation:
                  'Hotline 292 is the national emergency reporting shortcode managed by the Cyber Security Authority (CSA) of Ghana.',
            ),
          ],
        );
      default:
        return QuizModel(
          id: quizId,
          courseId: 'c2',
          courseTitle: 'Child Online Protection Foundations',
          passingScore: 70,
          xpReward: 180,
          questions: [
            QuizQuestion(
              id: 'q_gen_1',
              questionText:
                  'If someone online threatens to publish private pictures unless you send money, what should you do immediately?',
              options: [
                'Pay the demanded money so they delete the photos',
                'Delete your entire social media account right away',
                'Do not pay, do not delete evidence, and confidentially contact CSA Ghana (Hotline 292)',
                'Send them more photos hoping they forgive you'
              ],
              correctIndex: 2,
              explanation:
                  'Paying extortionists always leads to more demands. Keep evidence intact and report immediately to child protection officers at CSA Ghana.',
            ),
            QuizQuestion(
              id: 'q_gen_2',
              questionText:
                  'What is client-side metadata stripping (EXIF removal)?',
              options: [
                'Deleting the image permanently',
                'Removing GPS location coordinates, camera models, and timestamps before uploading files',
                'Compressing the image quality to low resolution',
                'Adding a digital watermark'
              ],
              correctIndex: 1,
              explanation:
                  'EXIF removal strips confidential metadata like home coordinates and camera serial numbers so evidence can be submitted without leaking your physical location.',
            ),
          ],
        );
    }
  }
}
