import 'user_model.dart';

class ConversationModel {
  final String id;
  final UserModel peer;
  final String? lastMessageText;
  final DateTime? lastMessageTime;
  final bool isMine;
  final int unreadCount;

  ConversationModel({
    required this.id,
    required this.peer,
    this.lastMessageText,
    this.lastMessageTime,
    this.isMine = false,
    this.unreadCount = 0,
  });

  factory ConversationModel.fromJson(Map<String, dynamic> json, String currentUserId) {
    UserModel peerUser;
    if (json['peer'] != null) {
      peerUser = UserModel.fromJson(json['peer'] as Map<String, dynamic>);
    } else if (json['participants'] != null && json['participants'] is List) {
      final participants = json['participants'] as List;
      final other = participants.firstWhere(
        (p) => p['userId'] != currentUserId,
        orElse: () => participants.first,
      );
      peerUser = UserModel.fromJson(other['user'] as Map<String, dynamic>);
    } else {
      peerUser = UserModel(
        id: 'unknown',
        displayName: 'Cyber Guard',
        email: '',
        role: 'STUDENT',
      );
    }

    String? msgText;
    DateTime? msgTime;
    bool mine = false;

    if (json['lastMessage'] != null) {
      final lm = json['lastMessage'] as Map<String, dynamic>;
      mine = lm['senderId'] == currentUserId;
      msgText = lm['hasAttachment'] == true ? '📎 Attachment' : '🔒 Encrypted message';
      if (lm['createdAt'] != null) {
        msgTime = DateTime.tryParse(lm['createdAt'] as String);
      }
    }

    return ConversationModel(
      id: json['id'] as String? ?? '',
      peer: peerUser,
      lastMessageText: msgText,
      lastMessageTime: msgTime,
      isMine: mine,
      unreadCount: json['unreadCount'] as int? ?? 0,
    );
  }
}
