import 'package:flutter/foundation.dart';
import '../models/conversation_model.dart';
import '../models/message_model.dart';
import '../models/user_model.dart';

class ChatService extends ChangeNotifier {
  List<ConversationModel> _conversations = [];
  final Map<String, List<MessageModel>> _messagesByPeer = {};
  bool _isTyping = false;

  List<ConversationModel> get conversations => _conversations;
  bool get isTyping => _isTyping;

  int get totalUnreadCount =>
      _conversations.fold(0, (sum, c) => sum + c.unreadCount);

  ChatService() {
    _initConversations();
  }

  void _initConversations() {
    final guardBot = UserModel(
      id: 'bot_guard',
      displayName: 'GuardBot · Cyber Security AI',
      username: 'guardbot_csa',
      email: 'guardbot@cyberguard.gh',
      role: 'ADMIN',
      avatarUrl: null,
    );

    final officerBoateng = UserModel(
      id: 'user_officer_1',
      displayName: 'Officer Boateng (CSA)',
      username: 'csa_boateng',
      email: 'officer.boateng@csa.gov.gh',
      role: 'CSA_OFFICER',
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=faces',
    );

    final arabaTutor = UserModel(
      id: 'user_tutor_1',
      displayName: 'Dr. Araba Mensah',
      username: 'araba_cyber',
      email: 'tutor@cyberguard.gh',
      role: 'TUTOR',
      avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&h=100&fit=crop&crop=faces',
    );

    _conversations = [
      ConversationModel(
        id: 'conv_bot',
        peer: guardBot,
        lastMessageText: 'Ask me anything about Ghana cyber safety or report codes!',
        lastMessageTime: DateTime.now().subtract(const Duration(minutes: 5)),
        isMine: false,
        unreadCount: 1,
      ),
      ConversationModel(
        id: 'conv_officer',
        peer: officerBoateng,
        lastMessageText: 'Report reference CG-892147 has been cataloged for triage.',
        lastMessageTime: DateTime.now().subtract(const Duration(hours: 2)),
        isMine: false,
        unreadCount: 0,
      ),
      ConversationModel(
        id: 'conv_araba',
        peer: arabaTutor,
        lastMessageText: 'Great work on completing the MoMo quiz modules!',
        lastMessageTime: DateTime.now().subtract(const Duration(days: 1)),
        isMine: true,
        unreadCount: 0,
      ),
    ];

    // Seed messages
    _messagesByPeer[guardBot.id] = [
      MessageModel(
        id: 'm_bot_1',
        senderId: guardBot.id,
        recipientId: 'me',
        text:
            'Hello Young Defender! I am GuardBot, your Ghana Cyber Security Authority AI companion. You can ask me how to identify scams, report abuse under Act 1038, or check hotline numbers.',
        createdAt: DateTime.now().subtract(const Duration(minutes: 10)),
        isMine: false,
      ),
      MessageModel(
        id: 'm_bot_2',
        senderId: guardBot.id,
        recipientId: 'me',
        text: 'Ask me anything about Ghana cyber safety or report codes!',
        createdAt: DateTime.now().subtract(const Duration(minutes: 5)),
        isMine: false,
      ),
    ];

    _messagesByPeer[officerBoateng.id] = [
      MessageModel(
        id: 'm_off_1',
        senderId: 'me',
        recipientId: officerBoateng.id,
        text: 'Hello Officer, I submitted evidence for a sender ID spoofing case.',
        createdAt: DateTime.now().subtract(const Duration(hours: 3)),
        isMine: true,
      ),
      MessageModel(
        id: 'm_off_2',
        senderId: officerBoateng.id,
        recipientId: 'me',
        text: 'Report reference CG-892147 has been cataloged for triage.',
        createdAt: DateTime.now().subtract(const Duration(hours: 2)),
        isMine: false,
      ),
    ];

    _messagesByPeer[arabaTutor.id] = [
      MessageModel(
        id: 'm_arb_1',
        senderId: arabaTutor.id,
        recipientId: 'me',
        text: 'Welcome to our mentoring track! Did you find the packet sniffing lesson helpful?',
        createdAt: DateTime.now().subtract(const Duration(days: 1, hours: 2)),
        isMine: false,
      ),
      MessageModel(
        id: 'm_arb_2',
        senderId: 'me',
        recipientId: arabaTutor.id,
        text: 'Yes Dr. Araba! Especially understanding why public Wi-Fi without encryption leaks data.',
        createdAt: DateTime.now().subtract(const Duration(days: 1, hours: 1)),
        isMine: true,
      ),
      MessageModel(
        id: 'm_arb_3',
        senderId: arabaTutor.id,
        recipientId: 'me',
        text: 'Great work on completing the MoMo quiz modules!',
        createdAt: DateTime.now().subtract(const Duration(days: 1)),
        isMine: true,
      ),
    ];
  }

  List<MessageModel> getMessages(String peerId) {
    return _messagesByPeer[peerId] ?? [];
  }

  void markAsRead(String peerId) {
    final idx = _conversations.indexWhere((c) => c.peer.id == peerId);
    if (idx != -1 && _conversations[idx].unreadCount > 0) {
      final old = _conversations[idx];
      _conversations[idx] = ConversationModel(
        id: old.id,
        peer: old.peer,
        lastMessageText: old.lastMessageText,
        lastMessageTime: old.lastMessageTime,
        isMine: old.isMine,
        unreadCount: 0,
      );
      notifyListeners();
    }
  }

  Future<void> sendMessage({
    required String peerId,
    required String text,
  }) async {
    final clean = text.trim();
    if (clean.isEmpty) return;

    final myMessage = MessageModel(
      id: 'm_${DateTime.now().millisecondsSinceEpoch}',
      senderId: 'me',
      recipientId: peerId,
      text: clean,
      createdAt: DateTime.now(),
      isMine: true,
    );

    if (!_messagesByPeer.containsKey(peerId)) {
      _messagesByPeer[peerId] = [];
    }
    _messagesByPeer[peerId]!.add(myMessage);

    // Update conversation last message
    final idx = _conversations.indexWhere((c) => c.peer.id == peerId);
    if (idx != -1) {
      final old = _conversations[idx];
      _conversations[idx] = ConversationModel(
        id: old.id,
        peer: old.peer,
        lastMessageText: clean,
        lastMessageTime: DateTime.now(),
        isMine: true,
        unreadCount: 0,
      );
    }
    notifyListeners();

    // If talking to GuardBot, simulate AI response
    if (peerId == 'bot_guard') {
      _isTyping = true;
      notifyListeners();

      await Future.delayed(const Duration(milliseconds: 1100));
      _isTyping = false;

      final botReply = _generateBotReply(clean);
      final replyMsg = MessageModel(
        id: 'm_bot_${DateTime.now().millisecondsSinceEpoch}',
        senderId: 'bot_guard',
        recipientId: 'me',
        text: botReply,
        createdAt: DateTime.now(),
        isMine: false,
      );

      _messagesByPeer[peerId]!.add(replyMsg);
      if (idx != -1) {
        final old = _conversations[idx];
        _conversations[idx] = ConversationModel(
          id: old.id,
          peer: old.peer,
          lastMessageText: botReply,
          lastMessageTime: DateTime.now(),
          isMine: false,
          unreadCount: 0,
        );
      }
      notifyListeners();
    }
  }

  String _generateBotReply(String userText) {
    final lower = userText.toLowerCase();
    if (lower.contains('momo') || lower.contains('money') || lower.contains('pin')) {
      return '🛡️ MoMo Safety Rule: Never share your 4-digit secret PIN or 6-digit OTP with anyone, even if they claim to be a branch manager. If you receive a wrong transfer claim, call 100 or 292.';
    } else if (lower.contains('hotline') || lower.contains('call') || lower.contains('emergency')) {
      return '📞 Ghana National Emergency Hotlines:\n• CSA Hotline: 292 (Toll-Free)\n• WhatsApp: +233 50 184 0000\n• Police Cyber Crime Unit: 18555 / 191';
    } else if (lower.contains('bully') || lower.contains('harass') || lower.contains('threat')) {
      return '⚖️ Under Section 88 of Ghana Cybersecurity Act (Act 1038), online harassment and sextortion carry severe legal penalties. Do not delete screenshots, do not pay money, and submit a report on CyberGuard right away.';
    } else if (lower.contains('quiz') || lower.contains('course') || lower.contains('certificate')) {
      return '🎓 Every course you complete with 70%+ score issues a verifiable National COP Certificate backed by CSA Ghana. Check the Learn tab to test your skills!';
    } else {
      return '🛡️ GuardBot Note: Stay vigilant online. Never click unknown short-links, enable 2FA on WhatsApp, and reach out anytime you encounter suspicious digital activity in Ghana.';
    }
  }
}
