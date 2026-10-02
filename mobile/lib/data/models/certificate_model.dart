class CertificateModel {
  final String id;
  final String referenceCode; // e.g. "CERT-CG-99214"
  final String recipientName;
  final String courseTitle;
  final String ageBand;
  final DateTime issueDate;
  final String issuer; // "Cyber Security Authority (CSA) Ghana"
  final bool isVerified;

  CertificateModel({
    required this.id,
    required this.referenceCode,
    required this.recipientName,
    required this.courseTitle,
    required this.ageBand,
    required this.issueDate,
    this.issuer = 'National Child Online Protection (COP) Framework · Ghana',
    this.isVerified = true,
  });
}
