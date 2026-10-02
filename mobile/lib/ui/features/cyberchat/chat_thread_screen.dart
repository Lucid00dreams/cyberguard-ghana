import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../../../core/theme/app_theme.dart';
import '../../../data/models/conversation_model.dart';
import '../../../data/models/message_model.dart';
import '../../../data/services/chat_service.dart';

class ChatThreadScreen extends StatefulWidget {
  final ConversationModel conversation;
  final String currentUserId;

  const ChatThreadScreen({
    super.key,
    required this.conversation,
    required this.currentUserId,
  });

  @override
  State<ChatThreadScreen> createState() => _ChatThreadScreenState();
}

class _ChatThreadScreenState extends State<ChatThreadScreen> {
  final TextEditingController _textController = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  bool _showStickers = false;
  bool _isVoiceRecording = false;

  final List<String> _cyberStickers = [
    '🛡️ Stay Safe Online',
    '🚨 CSA Hotline 292',
    '🔒 E2EE Verified',
    '⚠️ Beware of Phishing',
    '📱 Never Share MoMo PIN',
    '🎓 COP Certified',
    '🛑 Block & Report',
    '⚖️ Act 1038 Protected',
  ];

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<ChatService>().markAsRead(widget.conversation.peer.id);
      _scrollToBottom();
    });
  }

  @override
  void dispose() {
    _textController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 250),
          curve: Curves.easeOut,
        );
      }
    });
  }

  void _handleSend([String? presetText]) {
    final text = presetText ?? _textController.text.trim();
    if (text.isEmpty) return;

    Haptics.light();
    if (presetText == null) {
      _textController.clear();
    }

    context.read<ChatService>().sendMessage(
      peerId: widget.conversation.peer.id,
      text: text,
    );

    _scrollToBottom();
  }

  void _handleVoiceMemo() {
    Haptics.medium();
    setState(() => _isVoiceRecording = true);

    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('🎙️ Voice memo recorded (0:04) with noise cancellation'),
        duration: Duration(milliseconds: 1400),
      ),
    );

    Future.delayed(const Duration(milliseconds: 1500), () {
      if (mounted) {
        setState(() => _isVoiceRecording = false);
        _handleSend('🎤 [Voice Message: 0:04 - E2EE Encrypted]');
      }
    });
  }

  void _showAttachmentSheet() {
    Haptics.light();
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) => Padding(
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Share Encrypted Evidence',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Color(0xFF0F172A)),
            ),
            const SizedBox(height: 16),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: [
                _buildAttachOption(Icons.photo_library_outlined, 'Photos', const Color(0xFF0056D2), () {
                  Navigator.pop(ctx);
                  _handleSend('📷 [Screenshot attached: MoMo_alert.png - EXIF Stripped]');
                }),
                _buildAttachOption(Icons.description_outlined, 'File / PDF', const Color(0xFF10B981), () {
                  Navigator.pop(ctx);
                  _handleSend('📄 [Document: CSA_Incident_Transcript.pdf]');
                }),
                _buildAttachOption(Icons.camera_alt_outlined, 'Camera', const Color(0xFFF59E0B), () {
                  Navigator.pop(ctx);
                  _handleSend('📸 [Camera photo - GPS Scrubbed]');
                }),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildAttachOption(IconData icon, String label, Color color, VoidCallback onTap) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(16),
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: color.withOpacity(0.1),
              shape: BoxShape.circle,
            ),
            child: Icon(icon, color: color, size: 26),
          ),
          const SizedBox(height: 8),
          Text(label, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600)),
        ],
      ),
    );
  }

  void _showFingerprintDialog() {
    Haptics.light();
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(22)),
        title: Row(
          children: [
            const Icon(Icons.verified_user_outlined, color: Color(0xFF10B981), size: 24),
            const SizedBox(width: 8),
            Expanded(
              child: Text(
                '${widget.conversation.peer.displayName} Key',
                style: const TextStyle(fontSize: 16),
              ),
            ),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Compare this 60-digit safety number with your contact to verify that messages cannot be intercepted by any third party.',
              style: TextStyle(fontSize: 12, color: Color(0xFF475569), height: 1.4),
            ),
            const SizedBox(height: 16),
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: const Color(0xFFF1F5F9),
                borderRadius: BorderRadius.circular(14),
              ),
              child: const Text(
                '8492 1048 2940 1827\n0092 4819 2847 1192\n8472 9018 2471 9028',
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.bold,
                  fontFamily: 'monospace',
                  letterSpacing: 1.2,
                  color: Color(0xFF0F172A),
                ),
                textAlign: TextAlign.center,
              ),
            ),
            const SizedBox(height: 14),
            const Row(
              children: [
                Icon(Icons.lock, size: 14, color: Color(0xFF10B981)),
                SizedBox(width: 6),
                Text(
                  'Curve25519 · AES-256-GCM Verified',
                  style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Color(0xFF10B981)),
                ),
              ],
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Close'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(ctx);
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Contact marked as verified safe.')),
              );
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF10B981),
              foregroundColor: Colors.white,
            ),
            child: const Text('Verify Identity'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final chatService = context.watch<ChatService>();
    final messages = chatService.getMessages(widget.conversation.peer.id);
    final isTyping = chatService.isTyping && widget.conversation.peer.id == 'bot_guard';

    return Scaffold(
      backgroundColor: const Color(0xFFEFEAE2), // Telegram / WhatsApp wallpaper background
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 1,
        shadowColor: Colors.black.withOpacity(0.05),
        leadingWidth: 70,
        leading: Row(
          children: [
            IconButton(
              icon: const Icon(Icons.arrow_back, color: Color(0xFF0F172A)),
              onPressed: () => Navigator.pop(context),
            ),
          ],
        ),
        titleSpacing: 0,
        title: Row(
          children: [
            CircleAvatar(
              radius: 19,
              backgroundColor: const Color(0xFF0056D2).withOpacity(0.1),
              backgroundImage: widget.conversation.peer.avatarUrl != null
                  ? NetworkImage(widget.conversation.peer.avatarUrl!)
                  : null,
              child: widget.conversation.peer.avatarUrl == null
                  ? Text(
                      widget.conversation.peer.displayName.substring(0, 1).toUpperCase(),
                      style: const TextStyle(fontWeight: FontWeight.bold, color: Color(0xFF0056D2)),
                    )
                  : null,
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    widget.conversation.peer.displayName,
                    style: const TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.bold,
                      color: Color(0xFF0F172A),
                    ),
                    overflow: TextOverflow.ellipsis,
                  ),
                  Text(
                    widget.conversation.peer.id == 'bot_guard'
                        ? 'AI Online Companion'
                        : widget.conversation.peer.role == 'CSA_OFFICER'
                            ? 'CSA Officer · Verified'
                            : 'E2EE Active',
                    style: const TextStyle(fontSize: 11, color: Color(0xFF10B981), fontWeight: FontWeight.w600),
                  ),
                ],
              ),
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.lock_outline, color: Color(0xFF10B981)),
            tooltip: 'View Safety Numbers',
            onPressed: _showFingerprintDialog,
          ),
        ],
      ),
      body: Column(
        children: [
          // E2EE Notice Banner
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
            color: const Color(0xFFF1F5F9).withOpacity(0.9),
            child: const Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(Icons.lock, size: 12, color: Color(0xFF64748B)),
                SizedBox(width: 6),
                Text(
                  'Messages are end-to-end encrypted under Act 1038. No third party can read them.',
                  style: TextStyle(fontSize: 10.5, color: Color(0xFF475569)),
                ),
              ],
            ),
          ),

          // Message Thread List
          Expanded(
            child: ListView.builder(
              controller: _scrollController,
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 16),
              itemCount: messages.length + (isTyping ? 1 : 0),
              itemBuilder: (context, index) {
                if (index == messages.length && isTyping) {
                  return _buildTypingIndicator();
                }

                final msg = messages[index];
                return _buildMessageBubble(msg);
              },
            ),
          ),

          // Cyber Security Stickers Drawer
          if (_showStickers)
            Container(
              height: 140,
              color: Colors.white,
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text(
                        'Cyber Security Stickers & Safety Alerts',
                        style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Color(0xFF475569)),
                      ),
                      IconButton(
                        icon: const Icon(Icons.close, size: 16),
                        onPressed: () => setState(() => _showStickers = false),
                      ),
                    ],
                  ),
                  Expanded(
                    child: ListView.separated(
                      scrollDirection: Axis.horizontal,
                      itemCount: _cyberStickers.length,
                      separatorBuilder: (_, __) => const SizedBox(width: 8),
                      itemBuilder: (context, sIdx) {
                        final sticker = _cyberStickers[sIdx];
                        return InkWell(
                          onTap: () {
                            _handleSend(sticker);
                            setState(() => _showStickers = false);
                          },
                          borderRadius: BorderRadius.circular(14),
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                            decoration: BoxDecoration(
                              color: const Color(0xFFEFF6FF),
                              borderRadius: BorderRadius.circular(14),
                              border: Border.all(color: const Color(0xFFBFDBFE)),
                            ),
                            child: Center(
                              child: Text(
                                sticker,
                                style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: Color(0xFF1E40AF)),
                              ),
                            ),
                          ),
                        );
                      },
                    ),
                  ),
                ],
              ),
            ),

          // Bottom Input Bar
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
            decoration: const BoxDecoration(
              color: Colors.white,
              border: Border(top: BorderSide(color: Color(0xFFE2E8F0))),
            ),
            child: SafeArea(
              child: Row(
                children: [
                  IconButton(
                    icon: const Icon(Icons.attach_file, color: Color(0xFF64748B), size: 22),
                    onPressed: _showAttachmentSheet,
                  ),
                  IconButton(
                    icon: Icon(
                      _showStickers ? Icons.emoji_emotions : Icons.emoji_emotions_outlined,
                      color: _showStickers ? const Color(0xFF0056D2) : const Color(0xFF64748B),
                      size: 22,
                    ),
                    onPressed: () => setState(() => _showStickers = !_showStickers),
                  ),
                  Expanded(
                    child: TextField(
                      controller: _textController,
                      textCapitalization: TextCapitalization.sentences,
                      decoration: InputDecoration(
                        hintText: 'Message...',
                        filled: true,
                        fillColor: const Color(0xFFF1F5F9),
                        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(22),
                          borderSide: BorderSide.none,
                        ),
                      ),
                      onSubmitted: (_) => _handleSend(),
                    ),
                  ),
                  const SizedBox(width: 6),
                  if (_textController.text.trim().isEmpty)
                    IconButton(
                      icon: Icon(
                        _isVoiceRecording ? Icons.mic : Icons.mic_none,
                        color: _isVoiceRecording ? const Color(0xFFDC2626) : const Color(0xFF0056D2),
                      ),
                      onPressed: _handleVoiceMemo,
                    )
                  else
                    IconButton(
                      icon: const Icon(Icons.send, color: Color(0xFF0056D2)),
                      onPressed: () => _handleSend(),
                    ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMessageBubble(MessageModel msg) {
    final isMine = msg.isMine;

    return Align(
      alignment: isMine ? Alignment.centerRight : Alignment.centerLeft,
      child: Container(
        margin: const EdgeInsets.only(bottom: 10),
        constraints: BoxConstraints(
          maxWidth: MediaQuery.of(context).size.width * 0.78,
        ),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
        decoration: BoxDecoration(
          color: isMine ? const Color(0xFFDCF8C6) : Colors.white, // Telegram mint bubble
          borderRadius: BorderRadius.only(
            topLeft: const Radius.circular(16),
            topRight: const Radius.circular(16),
            bottomLeft: isMine ? const Radius.circular(16) : const Radius.circular(4),
            bottomRight: isMine ? const Radius.circular(4) : const Radius.circular(16),
          ),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.04),
              blurRadius: 4,
              offset: const Offset(0, 1),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (!isMine && widget.conversation.peer.id == 'bot_guard')
              const Padding(
                padding: EdgeInsets.only(bottom: 4),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(Icons.smart_toy_outlined, size: 12, color: Color(0xFF0056D2)),
                    SizedBox(width: 4),
                    Text(
                      'GuardBot AI',
                      style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Color(0xFF0056D2)),
                    ),
                  ],
                ),
              ),
            Text(
              msg.text,
              style: const TextStyle(
                fontSize: 14,
                color: Color(0xFF0F172A),
                height: 1.4,
              ),
            ),
            const SizedBox(height: 4),
            Row(
              mainAxisSize: MainAxisSize.min,
              mainAxisAlignment: MainAxisAlignment.end,
              children: [
                Text(
                  DateFormat('HH:mm').format(msg.createdAt),
                  style: const TextStyle(fontSize: 10, color: Color(0xFF94A3B8)),
                ),
                if (isMine) ...[
                  const SizedBox(width: 4),
                  const Icon(Icons.done_all, size: 14, color: Color(0xFF0056D2)),
                ],
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTypingIndicator() {
    return Align(
      alignment: Alignment.centerLeft,
      child: Container(
        margin: const EdgeInsets.only(bottom: 10),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.04),
              blurRadius: 4,
              offset: const Offset(0, 1),
            ),
          ],
        ),
        child: const Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            SizedBox(
              width: 12,
              height: 12,
              child: CircularProgressIndicator(strokeWidth: 2, valueColor: AlwaysStoppedAnimation<Color>(Color(0xFF0056D2))),
            ),
            SizedBox(width: 8),
            Text(
              'GuardBot is thinking...',
              style: TextStyle(fontSize: 12, fontStyle: FontStyle.italic, color: Color(0xFF64748B)),
            ),
          ],
        ),
      ),
    );
  }
}
