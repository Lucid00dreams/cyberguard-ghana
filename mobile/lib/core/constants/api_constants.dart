import 'dart:io';
import 'package:flutter/foundation.dart';

class ApiConstants {
  // Default to localhost, Android emulator 10.0.2.2, or custom host
  static String get baseUrl {
    if (kIsWeb) {
      return 'http://localhost:4000/api';
    } else if (Platform.isAndroid) {
      return 'http://10.0.2.2:4000/api';
    } else {
      return 'http://localhost:4000/api';
    }
  }

  // Emergency Hotlines for Ghana Cyber Security Authority
  static const String csaHotline = '292';
  static const String csaWhatsapp = '+233501840000';
  static const String csaEmergencyPhone = 'tel:292';
}
