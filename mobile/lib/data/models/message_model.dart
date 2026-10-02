class MessageModel {
  final String id;
  final String senderId;
  final String recipientId;
  final String text;
  final DateTime createdAt;
  final bool isMine;
  final int selfDestructSeconds;
  final bool hasAttachment;
  final String? attachmentName;

  MessageModel({
    required this.id,
    required this.senderId,
    required this.recipientId,
    required this.text,
    required this.createdAt,
    required this.isMine,
    this.selfDestructSeconds = 0,
    this.hasAttachment = false,
    this.attachmentName,
  });

  factory MessageModel.fromJson(Map<String, dynamic> json, String currentUserId) {
    return MessageModel(
      id: json['id'] as String? ?? '',
      senderId: json['senderId'] as String? ?? '',
      recipientId: json['recipientId'] as String? ?? '',
      text: json['decryptedText'] as String? ?? (json['ciphertext'] != null ? '🔒 Encrypted message' : ''),
      createdAt: json['createdAt'] != null
          ? DateTime.tryParse(json['createdAt'] as String) ?? DateTime.now()
          : DateTime.now(),
      isMine: (json['senderId'] as String?) == currentUserId,
      selfDestructSeconds: json['selfDestructSeconds'] as int? ?? 0,
      hasAttachment: json['hasAttachment'] as bool? ?? false,
      attachmentName: json['attachment']?['name'] as String?,
    );
  }
}
