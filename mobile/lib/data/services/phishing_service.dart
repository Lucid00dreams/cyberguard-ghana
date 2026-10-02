import 'package:flutter/foundation.dart';
import '../models/phishing_model.dart';

class PhishingService extends ChangeNotifier {
  int _score = 0;
  int _testedCount = 0;

  int get score => _score;
  int get testedCount => _testedCount;

  final List<PhishingScenario> _scenarios = [
    PhishingScenario(
      id: 'sc1',
      title: 'MTN Mobile Money 50% Bonus Promo',
      channel: 'SMS',
      senderName: 'MTN-Promo',
      senderAddress: '+233 24 000 0000',
      messageBody:
          'Y’ello! You have been selected to receive 50% bonus on your next MoMo recharge. Dial *170*1*1*0244123456*50*PIN# right now to claim your promo bonus immediately.',
      isPhishing: true,
      redFlags: [
        'Urgency: Tells you to dial "right now"',
        'Direct PIN inclusion: Embedding your PIN into a USSD transfer string transfers money directly to the scammer’s wallet (0244123456)',
        'Telcos never ask you to execute a money transfer to receive a promotion'
      ],
      breakdown:
          'This is a USSD payload injection attack. The string formatted as `*170*1*1*...` initiates an authorized outbound cash transfer directly to the attacker.',
      bestAction:
          'Block sender, never dial the string, and report SMS scam to MTN (shortcode 1515) or CSA (292).',
    ),
    PhishingScenario(
      id: 'sc2',
      title: 'University of Ghana Portal Password Expiry',
      channel: 'EMAIL',
      senderName: 'UG Academic Computing',
      senderAddress: 'it-support@ug-edu-gh.online',
      messageBody:
          'Attention Student: Your MIS Web student portal access will expire in 2 hours due to an emergency database upgrade. Click here: http://mis-ug-login.freehost.cc to verify your student credentials and retain your exam timetable.',
      isPhishing: true,
      redFlags: [
        'Suspicious domain: Sent from "ug-edu-gh.online" instead of official "ug.edu.gh"',
        'Insecure link: Links to "freehost.cc" instead of University portal',
        'False artificial panic: 2-hour deadline to bypass logical thinking'
      ],
      breakdown:
          'Classic credential harvesting phishing email designed to capture university student logins, grades, and fee records.',
      bestAction:
          'Never click external links. Open your browser and navigate directly to your known official school portal.',
    ),
    PhishingScenario(
      id: 'sc3',
      title: 'Official Ghana Card (NIA) Biometric Update Notice',
      channel: 'SMS',
      senderName: 'NIA_GHANA',
      senderAddress: 'Official Government Shortcode',
      messageBody:
          'Public Notice from National Identification Authority (NIA): Biometric update exercises are ongoing at regional district offices nationwide. Visit any district office with your Ghana Card for free verification. NIA staff will never ask for your PIN or bank details over the phone.',
      isPhishing: false,
      redFlags: [],
      breakdown:
          'This is an authentic public awareness notice. It does not ask for personal secrets, has no suspicious hyperlinks, and explicitly warns that staff will never request PINs.',
      bestAction: 'Information is legitimate. No risk involved.',
    ),
    PhishingScenario(
      id: 'sc4',
      title: 'High-Paying Remote Job Offer via WhatsApp',
      channel: 'WHATSAPP',
      senderName: 'HR Recruiter Global',
      senderAddress: '+1 (234) 892-1102',
      messageBody:
          'Hi! We saw your resume on LinkedIn. We offer online part-time tasks liking YouTube videos for GH₵ 350 daily. Send a registration fee of GH₵ 50 to our merchant wallet to activate your worker portal.',
      isPhishing: true,
      redFlags: [
        'Pay-to-work scam: Legitimate employers never charge candidates money to get a job',
        'Unsolicited international phone number for local Ghanaian applicant',
        'Unrealistically high payout for trivial clicks'
      ],
      breakdown:
          'Task scam / advance-fee fraud popular on WhatsApp and Telegram. Victims who send GH₵ 50 are asked for larger "deposit tiers" before the scammers disappear.',
      bestAction: 'Block and report the WhatsApp business contact immediately.',
    ),
  ];

  List<PhishingScenario> get scenarios => _scenarios;

  bool evaluateAnswer(PhishingScenario scenario, bool userSaidPhishing) {
    _testedCount++;
    final isCorrect = userSaidPhishing == scenario.isPhishing;
    if (isCorrect) {
      _score += 50;
    }
    notifyListeners();
    return isCorrect;
  }

  void resetGame() {
    _score = 0;
    _testedCount = 0;
    notifyListeners();
  }
}
