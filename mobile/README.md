# CyberGuard Ghana — Official COP Mobile Client

Production-grade Flutter mobile application for **CyberGuard Ghana (COP Edition)**, built in strict compliance with the **Cybersecurity Act, 2020 (Act 1038)** and the **National Child Online Protection (COP) Framework**.

Designed following **Apple Human Interface Guidelines (HIG)** and modern Flutter Material 3 with tactile haptics, spring animations, glassmorphism, and responsive states.

---

## Key Modules & Features

1. **Executive Dashboard (`Home`)**:
   - Live security readiness banner & national framework compliance badge.
   - Gamification tracker: Defender Level, XP counter, and daily security streaks.
   - Direct emergency access to **Ghana CSA 24/7 Hotline 292** and WhatsApp support.
   - Quick launchpad to all interactive defense tools.

2. **Cyber Safety Academy (`Academy`)**:
   - Age-banded tracks: **Secondary (12–18 yrs)** and **Tertiary (19–23 yrs)**.
   - Real-world Ghanaian curriculum: MoMo scams, sender ID spoofing, online grooming defense, and OSINT.
   - Interactive Lesson Viewer with progress tracking and checklist milestones.
   - Multi-step interactive exam quizzes with instant explanations, score celebrations, and automatic credential awards.

3. **Zero-Knowledge COP Incident Portal (`Report`)**:
   - Confidential reporting under Act 1038 (Sextortion, MoMo Fraud, Cyberbullying, Grooming).
   - Client-side EXIF metadata stripping & SHA-256 evidence fingerprinting.
   - Generates private `CG-XXXXXX` reference codes for anonymous case lookup.
   - Live case status progression timeline (Intake -> Triage -> CSA Investigation -> Resolution).

4. **CyberChat Secure Youth-Mentor Messenger (`CyberChat`)**:
   - iMessage/Telegram-inspired fluid chat thread with read receipts (double blue checkmarks).
   - **GuardBot AI**: Built-in CSA cybersecurity companion providing instant guidance on Ghana hotlines, MoMo rules, and legal protections.
   - Direct encrypted communication with vetted mentors and CSA youth specialists.

5. **Interactive Phishing Simulator**:
   - Real-world Ghanaian attack vectors: MTN MoMo cash bonus scams, university portal credential harvesting, fake WhatsApp job offers.
   - Interactive choice evaluation with breakdown of red flags (sender spoofing, urgency, USSD transfer payloads).

6. **Mentor & Expert Marketplace**:
   - Vetted profiles for Ghanaian threat intelligence specialists, digital rights attorneys, and ethical hackers.
   - Integrated booking modal with 1-tap launch into encrypted **Jitsi Meet** video clinics.

7. **Verifiable Credential Showcase**:
   - Digital certificate parchment viewer with national gold seal and verification serial lookup.
   - Instant share and export functionality.

---

## Architecture

Following the recommended layered MVVM architecture:

```
mobile/
├── assets/images/              # Webapp hero assets (hero-dashboard, hero-courses, etc.)
└── lib/
    ├── core/
    │   ├── constants/          # API URLs, Ghana Hotline 292, Act 1038 specs
    │   └── theme/              # Apple HIG palette, typography, card shadows, haptics
    ├── data/
    │   ├── models/             # UserModel, CourseModel, QuizModel, IncidentModel, etc.
    │   └── services/           # AuthService, CourseService, IncidentService, TutorService, etc.
    ├── ui/
    │   ├── core/               # CyberCard (tactile spring), CyberBadge (pills)
    │   └── features/
    │       ├── auth/           # Login & Register with 1-tap demo personas
    │       ├── home/           # Master Shell Navigation & Dashboard Overview
    │       ├── courses/        # Academy Catalog, Lesson Reader & Interactive Quiz
    │       ├── incident_report/# Zero-knowledge reporting & reference code tracking
    │       ├── cyberchat/      # iMessage-grade chat thread & GuardBot AI
    │       ├── phishing/       # Interactive Ghanaian scam simulation
    │       ├── tutors/         # Mentor directory, onboarding application & Jitsi clinic
    │       ├── certificate/    # National COP certificate verification & showcase
    │       ├── admin/          # CSA Officer Command Center (Incident Triage & Status)
    │       └── profile/        # Defender level, streaks, badges & Platform Tools
```

## Running the App

```bash
cd mobile
flutter pub get
flutter run
```

### Pre-configured Demo Accounts
You can tap any quick persona chip on the login screen or sign in manually:
- **Youth Student**: `student@cyberguard.gh` (Password: `ChangeMe123!`)
- **CSA Officer**: `csa-officer@cyberguard.gh` (Password: `ChangeMe123!`)
- **Cyber Mentor**: `tutor@cyberguard.gh` (Password: `ChangeMe123!`)
- **Guest Access**: Tap "Explore Platform as Guest" to test immediately without credentials.
