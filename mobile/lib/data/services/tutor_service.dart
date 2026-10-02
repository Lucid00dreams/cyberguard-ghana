import 'package:flutter/foundation.dart';
import 'package:url_launcher/url_launcher.dart';
import '../models/tutor_model.dart';

class TutorService extends ChangeNotifier {
  final List<TutorModel> _tutors = [
    TutorModel(
      id: 't1',
      name: 'Dr. Araba Mensah',
      title: 'Senior Cyber Threat Intelligence Lead · CSA Fellow',
      bio:
          'Passionate about mentoring young Ghanaians in digital forensics and defensive network architecture. Dedicated to youth cyber safety.',
      rating: 4.9,
      reviewsCount: 38,
      avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&h=150&fit=crop&crop=faces',
      specialties: ['Mobile Forensics', 'Incident Triage', 'Network Defense'],
      availableSlots: ['Today, 3:00 PM', 'Tomorrow, 11:00 AM', 'Thursday, 4:30 PM'],
      jitsiRoomUrl: 'https://meet.jit.si/CyberGuard-Session-ArabaMensah',
      isVerified: true,
      hourlyRate: 'Free (Youth Sponsored)',
    ),
    TutorModel(
      id: 't2',
      name: 'Kofi Owusu-Ansah',
      title: 'Lead Ethical Hacker & Fintech Security Specialist',
      bio:
          'Over 10 years defending banking portals and mobile money infrastructure across West Africa. Hands-on CTF mentor.',
      rating: 4.8,
      reviewsCount: 29,
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=faces',
      specialties: ['MoMo Security', 'Web Application Security', 'CTF Training'],
      availableSlots: ['Wednesday, 2:00 PM', 'Friday, 5:00 PM'],
      jitsiRoomUrl: 'https://meet.jit.si/CyberGuard-Session-KofiOwusu',
      isVerified: true,
      hourlyRate: 'Free (Sponsored by CSA)',
    ),
    TutorModel(
      id: 't3',
      name: 'Esi Dede Sutherland',
      title: 'Child Online Safety Advocate & Digital Rights Counsel',
      bio:
          'Specialist in child protection legal frameworks (Act 1038) and counseling for youth targeted by cyberbullying and online blackmail.',
      rating: 5.0,
      reviewsCount: 44,
      avatarUrl: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=150&h=150&fit=crop&crop=faces',
      specialties: ['COP Legal Framework', 'Cyberbullying Counseling', 'Privacy Rights'],
      availableSlots: ['Today, 5:00 PM', 'Saturday, 10:00 AM'],
      jitsiRoomUrl: 'https://meet.jit.si/CyberGuard-Session-EsiSutherland',
      isVerified: true,
      hourlyRate: 'Free (Pro-Bono Clinic)',
    ),
  ];

  List<TutorModel> get tutors => _tutors;

  Future<void> launchVideoSession(String jitsiUrl) async {
    final uri = Uri.parse(jitsiUrl);
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }
}
