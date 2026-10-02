class PhishingScenario {
  final String id;
  final String title;
  final String channel; // SMS, EMAIL, WHATSAPP
  final String senderName;
  final String senderAddress;
  final String messageBody;
  final bool isPhishing;
  final List<String> redFlags;
  final String breakdown;
  final String bestAction;

  PhishingScenario({
    required this.id,
    required this.title,
    required this.channel,
    required this.senderName,
    required this.senderAddress,
    required this.messageBody,
    required this.isPhishing,
    required this.redFlags,
    required this.breakdown,
    required this.bestAction,
  });
}
