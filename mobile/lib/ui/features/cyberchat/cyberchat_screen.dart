import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../../../core/theme/app_theme.dart';
import '../../../data/models/conversation_model.dart';
import '../../../data/models/user_model.dart';
import '../../../data/services/chat_service.dart';
import 'chat_thread_screen.dart';

class CyberChatScreen extends StatefulWidget {
  final String currentUserId;

  const CyberChatScreen({super.key, required this.currentUserId});

  @override
  State<CyberChatScreen> createState() => _CyberChatScreenState();
}

class _CyberChatScreenState extends State<CyberChatScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  final TextEditingController _searchController = TextEditingController();
  String _searchQuery = '';

  final List<UserModel> _directoryContacts = [
    UserModel(
      id: 'bot_guard',
      displayName: 'GuardBot · Cyber Security AI',
      username: 'guardbot_csa',
      email: 'guardbot@cyberguard.gh',
      role: 'ADMIN',
      avatarUrl: null,
    ),
    UserModel(
      id: 'user_officer_1',
      displayName: 'Officer Boateng (CSA)',
      username: 'csa_boateng',
      email: 'officer.boateng@csa.gov.gh',
      role: 'CSA_OFFICER',
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&h=120&fit=crop&crop=faces',
    ),
    UserModel(
      id: 'user_tutor_1',
      displayName: 'Dr. Araba Mensah',
      username: 'araba_cyber',
      email: 'tutor@cyberguard.gh',
      role: 'TUTOR',
      avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&h=120&fit=crop&crop=faces',
    ),
    UserModel(
      id: 'user_mentor_kofi',
      displayName: 'Kofi Owusu-Ansah',
      username: 'kofi_ethical',
      email: 'kofi@cyberguard.gh',
      role: 'TUTOR',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&h=120&fit=crop&crop=faces',
    ),
    UserModel(
      id: 'user_student_serwaa',
      displayName: 'Serwaa Appiah',
      username: 'serwaa_youth',
      email: 'serwaa@school.edu.gh',
      role: 'STUDENT',
      avatarUrl: null,
    ),
  ];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    _searchController.dispose();
    super.dispose();
  }

  void _openChatWithUser(UserModel user) {
    Haptics.selection();
    final chatService = context.read<ChatService>();

    // Check if conversation already exists
    ConversationModel? conv;
    try {
      conv = chatService.conversations.firstWhere((c) => c.peer.id == user.id);
    } catch (_) {
      conv = ConversationModel(
        id: 'conv_${user.id}',
        peer: user,
        lastMessageText: 'E2EE Channel Established',
        lastMessageTime: DateTime.now(),
        isMine: false,
        unreadCount: 0,
      );
    }

    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => ChatThreadScreen(
          conversation: conv!,
          currentUserId: widget.currentUserId,
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final chatService = context.watch<ChatService>();
    final conversations = chatService.conversations.where((c) {
      if (_searchQuery.isEmpty) return true;
      return c.peer.displayName.toLowerCase().contains(_searchQuery.toLowerCase()) ||
          c.lastMessageText.toLowerCase().contains(_searchQuery.toLowerCase());
    }).toList();

    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        title: const Text('CyberChat E2EE'),
        backgroundColor: Colors.white,
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.shield_outlined, color: Color(0xFF0056D2)),
            tooltip: 'E2EE Security Status',
            onPressed: () => _showSecurityDialog(),
          ),
        ],
        bottom: TabBar(
          controller: _tabController,
          labelColor: const Color(0xFF0056D2),
          unselectedLabelColor: const Color(0xFF64748B),
          indicatorColor: const Color(0xFF0056D2),
          indicatorWeight: 3,
          labelStyle: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
          tabs: [
            Tab(
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Text('Active Chats'),
                  if (chatService.totalUnreadCount > 0) ...[
                    const SizedBox(width: 6),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                      decoration: const BoxDecoration(
                        color: Color(0xFF0056D2),
                        shape: BoxShape.circle,
                      ),
                      child: Text(
                        '${chatService.totalUnreadCount}',
                        style: const TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold),
                      ),
                    ),
                  ],
                ],
              ),
            ),
            const Tab(text: 'Contacts & Mentors'),
          ],
        ),
      ),
      body: Column(
        children: [
          // Telegram Style Search Bar
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
            child: TextField(
              controller: _searchController,
              onChanged: (val) => setState(() => _searchQuery = val.trim()),
              decoration: InputDecoration(
                hintText: 'Search chats, contacts, or report codes...',
                prefixIcon: const Icon(Icons.search, size: 20, color: Color(0xFF94A3B8)),
                suffixIcon: _searchQuery.isNotEmpty
                    ? IconButton(
                        icon: const Icon(Icons.clear, size: 18),
                        onPressed: () {
                          _searchController.clear();
                          setState(() => _searchQuery = '');
                        },
                      )
                    : null,
                filled: true,
                fillColor: const Color(0xFFF1F5F9),
                contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(16),
                  borderSide: BorderSide.none,
                ),
              ),
            ),
          ),

          Expanded(
            child: TabBarView(
              controller: _tabController,
              children: [
                // Tab 1: Active Conversations
                conversations.isEmpty
                    ? Center(
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(Icons.chat_bubble_outline, size: 48, color: Colors.grey.shade300),
                            const SizedBox(height: 12),
                            const Text(
                              'No chats found',
                              style: TextStyle(fontWeight: FontWeight.bold, color: Color(0xFF64748B)),
                            ),
                            const SizedBox(height: 4),
                            const Text(
                              'Tap the Contacts tab to message GuardBot or an officer.',
                              style: TextStyle(fontSize: 12, color: Color(0xFF94A3B8)),
                            ),
                          ],
                        ),
                      )
                    : ListView.separated(
                        itemCount: conversations.length,
                        separatorBuilder: (_, __) => const Divider(height: 1, indent: 76),
                        itemBuilder: (context, index) {
                          final conv = conversations[index];
                          return ListTile(
                            onTap: () {
                              Haptics.light();
                              Navigator.push(
                                context,
                                MaterialPageRoute(
                                  builder: (_) => ChatThreadScreen(
                                    conversation: conv,
                                    currentUserId: widget.currentUserId,
                                  ),
                                ),
                              );
                            },
                            contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                            leading: Stack(
                              children: [
                                CircleAvatar(
                                  radius: 26,
                                  backgroundColor: const Color(0xFF0056D2).withOpacity(0.1),
                                  backgroundImage: conv.peer.avatarUrl != null
                                      ? NetworkImage(conv.peer.avatarUrl!)
                                      : null,
                                  child: conv.peer.avatarUrl == null
                                      ? Text(
                                          conv.peer.displayName.substring(0, 1).toUpperCase(),
                                          style: const TextStyle(
                                            color: Color(0xFF0056D2),
                                            fontWeight: FontWeight.bold,
                                            fontSize: 18,
                                          ),
                                        )
                                      : null,
                                ),
                                Positioned(
                                  right: 0,
                                  bottom: 0,
                                  child: Container(
                                    width: 13,
                                    height: 13,
                                    decoration: BoxDecoration(
                                      color: conv.peer.id == 'bot_guard'
                                          ? const Color(0xFF0056D2)
                                          : const Color(0xFF10B981),
                                      shape: BoxShape.circle,
                                      border: Border.all(color: Colors.white, width: 2),
                                    ),
                                  ),
                                ),
                              ],
                            ),
                            title: Row(
                              children: [
                                Expanded(
                                  child: Text(
                                    conv.peer.displayName,
                                    style: const TextStyle(
                                      fontWeight: FontWeight.bold,
                                      fontSize: 15,
                                      color: Color(0xFF0F172A),
                                    ),
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                ),
                                Text(
                                  DateFormat('HH:mm').format(conv.lastMessageTime),
                                  style: const TextStyle(fontSize: 11, color: Color(0xFF94A3B8)),
                                ),
                              ],
                            ),
                            subtitle: Row(
                              children: [
                                if (conv.isMine) ...[
                                  const Icon(Icons.done_all, size: 14, color: Color(0xFF0056D2)),
                                  const SizedBox(width: 4),
                                ],
                                Expanded(
                                  child: Text(
                                    conv.lastMessageText,
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                    style: TextStyle(
                                      fontSize: 13,
                                      color: conv.unreadCount > 0 ? const Color(0xFF0F172A) : const Color(0xFF64748B),
                                      fontWeight: conv.unreadCount > 0 ? FontWeight.bold : FontWeight.normal,
                                    ),
                                  ),
                                ),
                                if (conv.unreadCount > 0)
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
                                    decoration: BoxDecoration(
                                      color: const Color(0xFF0056D2),
                                      borderRadius: BorderRadius.circular(10),
                                    ),
                                    child: Text(
                                      '${conv.unreadCount}',
                                      style: const TextStyle(
                                        color: Colors.white,
                                        fontSize: 10,
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                  ),
                              ],
                            ),
                          );
                        },
                      ),

                // Tab 2: Directory / Mentors
                ListView.separated(
                  itemCount: _directoryContacts.length,
                  separatorBuilder: (_, __) => const Divider(height: 1, indent: 76),
                  itemBuilder: (context, index) {
                    final contact = _directoryContacts[index];
                    return ListTile(
                      onTap: () => _openChatWithUser(contact),
                      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                      leading: CircleAvatar(
                        radius: 24,
                        backgroundColor: const Color(0xFF0056D2).withOpacity(0.1),
                        backgroundImage: contact.avatarUrl != null
                            ? NetworkImage(contact.avatarUrl!)
                            : null,
                        child: contact.avatarUrl == null
                            ? Icon(
                                contact.id == 'bot_guard' ? Icons.smart_toy_outlined : Icons.person_outline,
                                color: const Color(0xFF0056D2),
                                size: 24,
                              )
                            : null,
                      ),
                      title: Row(
                        children: [
                          Expanded(
                            child: Text(
                              contact.displayName,
                              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                            ),
                          ),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                            decoration: BoxDecoration(
                              color: const Color(0xFFF1F5F9),
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: Text(
                              contact.role,
                              style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Color(0xFF475569)),
                            ),
                          ),
                        ],
                      ),
                      subtitle: Text(
                        contact.email,
                        style: const TextStyle(fontSize: 12, color: Color(0xFF64748B)),
                      ),
                      trailing: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                        decoration: BoxDecoration(
                          color: const Color(0xFF0056D2).withOpacity(0.08),
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: const Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(Icons.chat_bubble_outline, size: 14, color: Color(0xFF0056D2)),
                            SizedBox(width: 4),
                            Text(
                              'Chat',
                              style: TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.bold,
                                color: Color(0xFF0056D2),
                              ),
                            ),
                          ],
                        ),
                      ),
                    );
                  },
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  void _showSecurityDialog() {
    Haptics.light();
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Row(
          children: [
            Icon(Icons.lock, color: Color(0xFF10B981), size: 22),
            SizedBox(width: 8),
            Text('End-to-End Encrypted'),
          ],
        ),
        content: const Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'CyberChat messages are protected with ECDH curve25519 key exchange and AES-GCM encryption under the Ghana Child Online Protection guidelines.',
              style: TextStyle(fontSize: 13, color: Color(0xFF475569), height: 1.4),
            ),
            SizedBox(height: 12),
            Text(
              '• Zero server plaintext logging\n• Automatic local key derivation\n• Self-destruct timers supported',
              style: TextStyle(fontSize: 12, color: Color(0xFF334155), height: 1.5),
            ),
          ],
        ),
        actions: [
          ElevatedButton(
            onPressed: () => Navigator.pop(ctx),
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF0056D2),
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
            child: const Text('Understood'),
          ),
        ],
      ),
    );
  }
}
