import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

class AppTheme {
  // Brand & Accent Colors
  static const Color primaryBlue = Color(0xFF0056D2);
  static const Color primaryBlueLight = Color(0xFFEBF3FF);
  static const Color primaryDark = Color(0xFF0F172A);
  static const Color primaryNavy = Color(0xFF0B1528);
  
  static const Color accentGreen = Color(0xFF10B981);
  static const Color accentGreenLight = Color(0xFFE6F9F2);
  static const Color accentAmber = Color(0xFFF59E0B);
  static const Color accentAmberLight = Color(0xFFFEF3C7);
  static const Color accentRed = Color(0xFFEF4444);
  static const Color accentRedLight = Color(0xFFFEE2E2);
  
  // Backgrounds & Surfaces (Apple iOS style)
  static const Color backgroundLight = Color(0xFFF8FAFC);
  static const Color surfaceWhite = Colors.white;
  static const Color surfaceSubtle = Color(0xFFF1F5F9);
  static const Color borderLight = Color(0xFFE2E8F0);
  static const Color borderSubtle = Color(0xFFF1F5F9);

  // Text Colors
  static const Color textPrimary = Color(0xFF0F172A);
  static const Color textSecondary = Color(0xFF64748B);
  static const Color textMuted = Color(0xFF94A3B8);

  // Telegram/iMessage signature chat colors
  static const Color chatOutgoingBubble = Color(0xFFDCF8C6);
  static const Color chatOutgoingBorder = Color(0xFFC7EFA7);
  static const Color chatIncomingBubble = Colors.white;
  static const Color chatIncomingBorder = Color(0xFFE2E8F0);
  static const Color chatCheckBlue = Color(0xFF34B7F1);

  // Shadows
  static List<BoxShadow> get cardShadow => [
    BoxShadow(
      color: primaryDark.withOpacity(0.04),
      offset: const Offset(0, 4),
      blurRadius: 16,
    ),
    BoxShadow(
      color: primaryDark.withOpacity(0.02),
      offset: const Offset(0, 1),
      blurRadius: 4,
    ),
  ];

  static List<BoxShadow> get elevatedShadow => [
    BoxShadow(
      color: primaryBlue.withOpacity(0.12),
      offset: const Offset(0, 8),
      blurRadius: 24,
    ),
  ];

  static List<BoxShadow> get dangerShadow => [
    BoxShadow(
      color: accentRed.withOpacity(0.18),
      offset: const Offset(0, 6),
      blurRadius: 20,
    ),
  ];

  static ThemeData get lightTheme {
    return ThemeData(
      useMaterial3: true,
      fontFamily: 'Roboto', // Clean modern fallback
      colorScheme: ColorScheme.fromSeed(
        seedColor: primaryBlue,
        primary: primaryBlue,
        secondary: accentGreen,
        tertiary: accentAmber,
        surface: surfaceWhite,
        error: accentRed,
      ),
      scaffoldBackgroundColor: backgroundLight,
      appBarTheme: const AppBarTheme(
        backgroundColor: Colors.white,
        foregroundColor: primaryDark,
        elevation: 0,
        scrolledUnderElevation: 0.5,
        centerTitle: false,
        titleTextStyle: TextStyle(
          color: primaryDark,
          fontSize: 18,
          fontWeight: FontWeight.w700,
          letterSpacing: -0.3,
        ),
      ),
      cardTheme: CardTheme(
        color: surfaceWhite,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(20),
          side: const BorderSide(color: borderLight, width: 1),
        ),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: primaryBlue,
          foregroundColor: Colors.white,
          elevation: 0,
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
          ),
          textStyle: const TextStyle(
            fontWeight: FontWeight.w700,
            fontSize: 15,
            letterSpacing: -0.2,
          ),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: Colors.white,
        contentPadding: const EdgeInsets.symmetric(horizontal: 18, vertical: 16),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: const BorderSide(color: borderLight),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: const BorderSide(color: borderLight),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: const BorderSide(color: primaryBlue, width: 2),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: const BorderSide(color: accentRed),
        ),
      ),
    );
  }
}

// Apple-Grade Haptics helper
class Haptics {
  static void light() {
    HapticFeedback.lightImpact();
  }

  static void medium() {
    HapticFeedback.mediumImpact();
  }

  static void heavy() {
    HapticFeedback.heavyImpact();
  }

  static void selection() {
    HapticFeedback.selectionClick();
  }

  static void success() {
    HapticFeedback.mediumImpact();
  }

  static void error() {
    HapticFeedback.heavyImpact();
  }
}
