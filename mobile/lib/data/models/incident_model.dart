class IncidentModel {
  final String id;
  final String referenceCode; // e.g. "CG-847291"
  final String category; // SCAM_FRAUD, CYBERBULLYING, SEXTORTION, GROOMING, IDENTITY_THEFT, OTHER
  final String title;
  final String description;
  final bool isAnonymous;
  final String status; // "RECEIVED", "TRIAGED", "INVESTIGATING", "RESOLVED"
  final String urgency; // "LOW", "MEDIUM", "HIGH", "CRITICAL"
  final String? evidenceHash; // SHA-256 string
  final DateTime createdAt;
  final String? reporterContact;

  IncidentModel({
    required this.id,
    required this.referenceCode,
    required this.category,
    required this.title,
    required this.description,
    this.isAnonymous = true,
    this.status = 'RECEIVED',
    this.urgency = 'MEDIUM',
    this.evidenceHash,
    required this.createdAt,
    this.reporterContact,
  });

  String get categoryLabel {
    switch (category) {
      case 'SCAM_FRAUD':
        return 'Mobile Money & Online Fraud';
      case 'CYBERBULLYING':
        return 'Cyberbullying & Harassment';
      case 'SEXTORTION':
        return 'Sextortion & Blackmail';
      case 'GROOMING':
        return 'Online Grooming / Exploitation';
      case 'IDENTITY_THEFT':
        return 'Identity Theft & Impersonation';
      default:
        return 'Other Online Harm';
    }
  }

  String get statusLabel {
    switch (status) {
      case 'RECEIVED':
        return 'Report Received';
      case 'TRIAGED':
        return 'Triaged by Officer';
      case 'INVESTIGATING':
        return 'CSA Active Investigation';
      case 'RESOLVED':
        return 'Case Closed & Protected';
      default:
        return 'Processing';
    }
  }
}
