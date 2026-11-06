/**
 * CyberGuard Ghana Comprehensive Cybersecurity & Online Safety Glossary
 * Provides instant, zero-latency definitions for common cybersecurity,
 * child online protection (Act 1038), digital privacy, and mobile money concepts.
 */

export const CYBER_GLOSSARY = {
  phishing: {
    term: "Phishing",
    phonetic: "/ˈfɪʃ.ɪŋ/",
    partOfSpeech: "noun · cyber attack",
    definition: "A deceptive tactic where cybercriminals impersonate trusted entities (like banks, schools, or services) via email, links, or messages to trick victims into revealing sensitive credentials, passwords, or personal data.",
    example: "Fake emails claiming your account is suspended and asking you to verify your password immediately.",
    tip: "Always check the actual sender address and domain before clicking any link."
  },
  smishing: {
    term: "Smishing",
    phonetic: "/ˈsmɪʃ.ɪŋ/",
    partOfSpeech: "noun · SMS fraud",
    definition: "Phishing conducted via SMS text messages. Attackers send urgent alerts, lottery wins, or mobile money cashout confirmations with malicious links or call-back numbers.",
    example: "SMS: 'Your MoMo wallet has been credited with GHS 500. Click here to reverse or claim.'",
    tip: "Telcos will never send you a link to reverse an accidental mobile money transfer."
  },
  vishing: {
    term: "Vishing",
    phonetic: "/ˈvɪʃ.ɪŋ/",
    partOfSpeech: "noun · voice fraud",
    definition: "Voice phishing where attackers call victims over the phone, posing as bank staff, telecom agents, or police to extract PINs, OTP codes, or personal identities.",
    example: "A caller claiming to be an MTN or Telecel agent asking for the 6-digit code sent to your phone.",
    tip: "Never share an OTP code with anyone over a voice call, even if they claim to be official support."
  },
  momo: {
    term: "MoMo (Mobile Money)",
    phonetic: "/ˈmoʊ.moʊ/",
    partOfSpeech: "noun · financial tech",
    definition: "Mobile Money telecommunication payment service (e.g. MTN MoMo, Telecel Cash, AT Money). In Ghana, mobile money is the primary digital payment rail and a frequent target for PIN theft and fake cashout reversals.",
    example: "Scammers request you enter your 4-digit secret PIN under the guise of verifying a transaction.",
    tip: "Never enter your MoMo PIN after someone instructs you to dial a USSD code."
  },
  ransomware: {
    term: "Ransomware",
    phonetic: "/ˈræn.səm.wɛər/",
    partOfSpeech: "noun · malware",
    definition: "Malicious software that encrypts a victim's files, documents, or entire computer system, holding the data hostage until a ransom payment is made.",
    example: "A hospital's patient files locked with a ransom note demanding Bitcoin for decryption.",
    tip: "Maintain offline 3-2-1 backups of critical schoolwork and files to recover without paying ransoms."
  },
  malware: {
    term: "Malware",
    phonetic: "/ˈmæl.wɛər/",
    partOfSpeech: "noun · malicious code",
    definition: "An umbrella term for malicious software designed to infiltrate, damage, exploit, or gain unauthorized control over computer systems, phones, and networks.",
    example: "Viruses, worms, Trojans, spyware, ransomware, and adware downloaded from unverified websites.",
    tip: "Only download apps and files from verified, official app stores like Google Play or Apple App Store."
  },
  "2fa": {
    term: "Two-Factor Authentication (2FA)",
    phonetic: "/tuː ˈfæk.tər/",
    partOfSpeech: "noun · security control",
    definition: "A security process where a user provides two distinct authentication factors to verify identity: something you know (password) plus something you have (phone authenticator app, hardware key) or are (fingerprint).",
    example: "Logging into Google with your password and approving a prompt on your phone.",
    tip: "Enable 2FA on WhatsApp, Google, Apple ID, and social media to stop account hijacking even if your password leaks."
  },
  mfa: {
    term: "Multi-Factor Authentication (MFA)",
    phonetic: "/ˌmʌl.ti ˈfæk.tər/",
    partOfSpeech: "noun · defense protocol",
    definition: "An authentication method that requires two or more independent factors of identity confirmation before access is granted to an account or network.",
    example: "Password + OTP SMS + Fingerprint scan.",
    tip: "MFA blocks over 99% of automated credential stuffing attacks."
  },
  otp: {
    term: "OTP (One-Time Password)",
    phonetic: "/ˌoʊ.tiːˈpiː/",
    partOfSpeech: "noun · authentication",
    definition: "A temporary, time-sensitive numeric or alphanumeric passcode valid for only one login session or transaction on a digital service.",
    example: "The 6-digit code texted to your phone to approve a mobile money payment or password reset.",
    tip: "Golden Rule: Treat your OTP like your ATM PIN. No legitimate company employee will ever ask for it."
  },
  spoofing: {
    term: "Spoofing",
    phonetic: "/ˈspuː.fɪŋ/",
    partOfSpeech: "noun · deception attack",
    definition: "A technique where an attacker disguises their communication or identity as coming from a known, trusted source (like altering email headers, caller ID, or domain names).",
    example: "An email showing the sender as 'support@paypal.com' when the true header is from a hijacked foreign server.",
    tip: "Inspect full headers and URL domain spellings rather than relying on displayed caller names."
  },
  encryption: {
    term: "Encryption",
    phonetic: "/ɪnˈkrɪp.ʃən/",
    partOfSpeech: "noun · cryptography",
    definition: "The process of converting plain readable text or data into an unreadable cipher code using mathematical algorithms, so only people with the secret decryption key can read it.",
    example: "End-to-end encrypted messaging in WhatsApp or HTTPS secure padlock in browser web addresses.",
    tip: "Always look for https:// and the lock symbol when logging into or purchasing online."
  },
  firewall: {
    term: "Firewall",
    phonetic: "/ˈfaɪər.wɔːl/",
    partOfSpeech: "noun · network defense",
    definition: "A network security device or software that inspects incoming and outgoing network traffic and determines whether to allow or block traffic based on defined security rules.",
    example: "Blocking unauthorized remote desktop connections from unknown international IP addresses.",
    tip: "Keep your operating system's built-in firewall enabled at all times."
  },
  "brute force": {
    term: "Brute Force Attack",
    phonetic: "/bruːt fɔːrs/",
    partOfSpeech: "noun · password attack",
    definition: "A cryptographic trial-and-error method where automated software tries every possible combination of letters, numbers, and symbols until it cracks a password.",
    example: "Running 1,000,000 guesses per second against an unprotected 4-digit numeric password.",
    tip: "Use long passphrases (14+ characters with 4 random words) to make brute forcing mathematically impossible."
  },
  botnet: {
    term: "Botnet",
    phonetic: "/ˈbɑːt.nɛt/",
    partOfSpeech: "noun · network threat",
    definition: "A interconnected network of private computers, routers, and smart devices infected with malware and controlled as a group without the owners' knowledge by a threat actor.",
    example: "Millions of compromised internet cameras used to launch massive DDoS attacks.",
    tip: "Change default passwords on all home Wi-Fi routers and IoT devices."
  },
  trojan: {
    term: "Trojan Horse",
    phonetic: "/ˈtroʊ.dʒən/",
    partOfSpeech: "noun · malware type",
    definition: "Malicious software disguised as a legitimate, harmless application (like a free game, cracked software, or PDF tool) that secretly installs backdoors or spyware once run.",
    example: "Downloading a 'free game cheat' that silently steals browser cookies and passwords.",
    tip: "Never download pirated software or cracked installers from file-sharing platforms."
  },
  keylogger: {
    term: "Keylogger",
    phonetic: "/ˈkiːˌlɑː.ɡər/",
    partOfSpeech: "noun · spyware",
    definition: "A surveillance program or hardware device that records every keystroke typed on a keyboard, allowing hackers to harvest passwords, credit card details, and personal chats.",
    example: "Malware logging your banking login as you type it on an infected public internet café PC.",
    tip: "Avoid logging into sensitive personal or financial accounts on shared public computers."
  },
  ddos: {
    term: "DDoS (Distributed Denial of Service)",
    phonetic: "/ˌdiːˈdɑːs/",
    partOfSpeech: "noun · availability attack",
    definition: "A malicious attempt to disrupt the normal traffic of a targeted server, service, or network by overwhelming the target with a flood of internet traffic from multiple sources.",
    example: "Flooding a government portal with fake requests so legitimate citizens cannot access it.",
    tip: "Cloud-based web application firewalls (WAF) and rate-limiting help protect platforms against DDoS."
  },
  "zero-day": {
    term: "Zero-Day Vulnerability",
    phonetic: "/ˌzɪə.roʊ ˈdeɪ/",
    partOfSpeech: "noun · security flaw",
    definition: "A software security hole or bug unknown to the software vendor or public, meaning zero days have passed since discovery and no official patch exists yet.",
    example: "A flaw in a web browser actively exploited by cybercriminals before the company creates an update.",
    tip: "Keep automatic operating system and browser updates turned on so patches install as soon as released."
  },
  vulnerability: {
    term: "Vulnerability",
    phonetic: "/ˌvʌl.nər.əˈbɪl.ə.ti/",
    partOfSpeech: "noun · weakness",
    definition: "A flaw or weakness in software code, hardware components, system architecture, or human protocol that can be exploited by an attacker to compromise security.",
    example: "An outdated operating system missing critical security patches.",
    tip: "Software updates regularly patch known vulnerabilities to protect your device."
  },
  payload: {
    term: "Payload",
    phonetic: "/ˈpeɪ.loʊd/",
    partOfSpeech: "noun · exploit component",
    definition: "The core malicious code within a cyber attack that executes the attacker's actual objective (such as stealing passwords, encrypting files, or establishing a backdoor).",
    example: "The executable file embedded inside a deceptive email attachment that launches ransomware.",
    tip: "Modern antivirus engines scan files to identify known malicious payload signatures."
  },
  "act 1038": {
    term: "Cybersecurity Act 2020 (Act 1038)",
    phonetic: "/ækt tɛn θɜːti eɪt/",
    partOfSpeech: "proper noun · Ghana law",
    definition: "The flagship law passed by the Parliament of Ghana establishing the Cyber Security Authority (CSA), regulating cybersecurity activities, and criminalizing non-consensual sharing of intimate images, child sexual abuse material (CSAM), cyberbullying, and digital fraud.",
    example: "Section 67-68 criminalizing the cyber harassment and exploitation of children online.",
    tip: "Victims of digital abuse or harassment in Ghana can report confidentially to the CSA helpline 292."
  },
  csa: {
    term: "Cyber Security Authority (CSA)",
    phonetic: "/ˌsiː.ɛsˈeɪ/",
    partOfSpeech: "proper noun · Ghana agency",
    definition: "The statutory regulatory body established under Act 1038 responsible for cybersecurity matters, regulating cybersecurity service providers, critical infrastructure protection, and child online safety in Ghana.",
    example: "CSA national cyber awareness campaigns and incident response teams.",
    tip: "Official national portal: www.csa.gov.gh | Emergency SMS/Call shortcode: 292."
  },
  cop: {
    term: "Child Online Protection (COP)",
    phonetic: "/siː oʊ piː/",
    partOfSpeech: "noun · national framework",
    definition: "A national initiative and legal framework dedicated to safeguarding children and adolescents from online harms, sexual exploitation, cyberbullying, radicalization, and identity theft.",
    example: "CyberGuard Ghana's certified curriculum built on CSA Child Online Protection guidelines.",
    tip: "Children have the right to confidential, non-judgmental assistance when encountering online abuse."
  },
  "social engineering": {
    term: "Social Engineering",
    phonetic: "/ˈsoʊ.ʃəl ˌɛn.dʒɪˈnɪər.ɪŋ/",
    partOfSpeech: "noun · psychological manipulation",
    definition: "The psychological manipulation of people into performing actions or releasing confidential information, exploiting human tendencies like trust, fear, curiosity, or urgency.",
    example: "Urgent messages warning that your account will be deleted within 10 minutes unless you verify credentials.",
    tip: "Whenever a message induces extreme panic or excitement, pause and independently verify the source."
  },
  vpn: {
    term: "Virtual Private Network (VPN)",
    phonetic: "/ˌviː.piːˈɛn/",
    partOfSpeech: "noun · privacy network",
    definition: "A digital service that encrypts your internet connection and masks your IP address by routing network traffic through an intermediary encrypted tunnel.",
    example: "Protecting internet traffic from eavesdroppers while connected to public Wi-Fi at a café or airport.",
    tip: "Use a reputable, paid VPN service rather than untrusted free VPN apps that harvest your browsing data."
  },
  cookie: {
    term: "Cookie (Web Cookie)",
    phonetic: "/ˈkʊk.i/",
    partOfSpeech: "noun · web storage",
    definition: "A small piece of data stored on your computer or phone by web browsers on behalf of websites, used to remember login sessions, shopping carts, and tracking preferences.",
    example: "The session cookie that keeps you logged into your dashboard without retyping your password every click.",
    tip: "Clear cookies regularly on shared devices to ensure unauthorized users cannot access active sessions."
  },
  biometrics: {
    term: "Biometric Authentication",
    phonetic: "/ˌbaɪ.oʊˈmɛt.rɪk/",
    partOfSpeech: "noun · biological verification",
    definition: "Security authentication that relies on unique biological and physiological characteristics of an individual (like fingerprint, face recognition, or iris scanning).",
    example: "Unlocking your smartphone with Face ID or fingerprint sensor.",
    tip: "Biometrics cannot be guessed like passwords, but should be backed up with a strong alpha-numeric fallback PIN."
  },
  hash: {
    term: "Cryptographic Hash",
    phonetic: "/hæʃ/",
    partOfSpeech: "noun · cryptography",
    definition: "A mathematical algorithm (like SHA-256) that transforms data into a fixed-length unique string. Even altering a single comma changes the resulting hash entirely, allowing tamper verification.",
    example: "Verifying certificate integrity on CyberGuard Ghana using SHA-256 digital signatures.",
    tip: "Hashes are one-way: passwords should always be stored hashed with salt, never in plain text."
  },
  whaling: {
    term: "Whaling",
    phonetic: "/ˈweɪ.lɪŋ/",
    partOfSpeech: "noun · targeted attack",
    definition: "A highly targeted phishing attack aimed specifically at high-profile individuals such as corporate executives, politicians, school principals, or government officials.",
    example: "A spear-phishing email targeting a school headmaster to authorize a fraudulent wire transfer.",
    tip: "High-level authorizations should always require verbal confirmation over a verified phone line."
  },
  spyware: {
    term: "Spyware",
    phonetic: "/ˈspaɪ.wɛər/",
    partOfSpeech: "noun · privacy threat",
    definition: "Malware designed to enter your device, gather private information and browsing habits without your consent, and transmit it to third-party cybercriminals or advertisers.",
    example: "An app silently accessing your microphone, camera, or SMS messages in the background.",
    tip: "Review app permissions in your phone settings and revoke access to camera/microphone for apps that don't need them."
  },
  credential: {
    term: "Credential",
    phonetic: "/krɪˈdɛn.ʃəl/",
    partOfSpeech: "noun · access proof",
    definition: "Proof of identity and access authorization used in digital systems, most commonly comprised of a username paired with a password, token, or cryptographic key.",
    example: "Your email address and password combination used to access CyberGuard Ghana.",
    tip: "Never reuse the same credentials across multiple websites; if one gets breached, all become vulnerable."
  }
};

/**
 * Normalizes input word and looks up definition in offline cybersecurity glossary.
 * Supports singular/plural and case-insensitivity.
 */
export function lookupGlossary(rawWord) {
  if (!rawWord || typeof rawWord !== "string") return null;

  const clean = rawWord.trim().toLowerCase().replace(/[^a-z0-9\s\-]/g, "");
  if (!clean) return null;

  // Exact match
  if (CYBER_GLOSSARY[clean]) {
    return CYBER_GLOSSARY[clean];
  }

  // Singular fallback (e.g. "passwords" -> "password", "firewalls" -> "firewall")
  if (clean.endsWith("s") && CYBER_GLOSSARY[clean.slice(0, -1)]) {
    return CYBER_GLOSSARY[clean.slice(0, -1)];
  }

  // Check substring / alias matching
  for (const [key, item] of Object.entries(CYBER_GLOSSARY)) {
    if (clean === key || clean.includes(key) || key.includes(clean)) {
      if (Math.abs(clean.length - key.length) <= 3) {
        return item;
      }
    }
  }

  return null;
}

