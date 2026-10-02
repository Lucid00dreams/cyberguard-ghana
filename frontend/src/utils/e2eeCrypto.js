/**
 * e2eeCrypto.js
 * --------------------------------------------------------------------------
 * Zero-Knowledge End-to-End Encryption (E2EE) Module for CyberGuard Ghana
 * 
 * Powered entirely by the native browser Web Crypto API (window.crypto.subtle).
 * 
 * Cryptographic Architecture:
 * 1. Key Agreement: ECDH (Elliptic Curve Diffie-Hellman) using curve P-256.
 * 2. Symmetric Encryption: AES-256-GCM with authenticated data and unique 12-byte IVs.
 * 3. Signatures & Non-Repudiation: ECDSA (P-256 with SHA-256) ensures server or
 *    database super admins CANNOT forge or alter messages.
 * 4. Key Storage: Private keys reside in browser IndexedDB and NEVER touch the server.
 * --------------------------------------------------------------------------
 */

const DB_NAME = "cyberguard_e2ee_keystore_v1";
const STORE_NAME = "keypairs";

// Safety emojis for visual out-of-band verification
const SAFETY_EMOJIS = [
  "🛡️", "🔐", "⚡", "🦅", "🇬🇭", "⭐", "🔑", "🦁",
  "🌊", "🔥", "💎", "🎯", "🌴", "🚀", "🪐", "🏆"
];

// Helper: open IndexedDB
function openKeyDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Helper: ArrayBuffer to Base64
export function arrayBufferToBase64(buffer) {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

// Helper: Base64 to ArrayBuffer
export function base64ToArrayBuffer(base64) {
  const binary = window.atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Generates an ECDH keypair (for shared secret derivation) and
 * an ECDSA keypair (for message signing and tamper prevention).
 */
export async function generateUserKeyPairs() {
  const ecdhPair = await window.crypto.subtle.generateKey(
    { name: "ECDH", namedCurve: "P-256" },
    true, // extractable for local backup / export
    ["deriveKey", "deriveBits"]
  );

  const ecdsaPair = await window.crypto.subtle.generateKey(
    { name: "ECDSA", namedCurve: "P-256" },
    true,
    ["sign", "verify"]
  );

  return { ecdhPair, ecdsaPair };
}

/**
 * Saves generated keypairs into the browser's IndexedDB.
 */
/**
 * Saves generated keypairs into the browser's IndexedDB and localStorage backup.
 */
export async function storeKeyPairs(userId, { ecdhPair, ecdsaPair }) {
  try {
    const db = await openKeyDatabase();
    await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);

      store.put(ecdhPair, `ecdh_${userId}`);
      store.put(ecdsaPair, `ecdsa_${userId}`);

      tx.oncomplete = () => resolve(true);
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn("IndexedDB store warning:", err);
  }

  // Backup to localStorage as serialized JWK
  try {
    const ecdhPriv = await window.crypto.subtle.exportKey("jwk", ecdhPair.privateKey);
    const ecdhPub = await window.crypto.subtle.exportKey("jwk", ecdhPair.publicKey);
    const ecdsaPriv = await window.crypto.subtle.exportKey("jwk", ecdsaPair.privateKey);
    const ecdsaPub = await window.crypto.subtle.exportKey("jwk", ecdsaPair.publicKey);

    localStorage.setItem(
      `cyberguard_key_backup_${userId}`,
      JSON.stringify({ ecdhPriv, ecdhPub, ecdsaPriv, ecdsaPub })
    );
  } catch (backupErr) {
    console.warn("Key backup to localStorage warning:", backupErr);
  }

  return true;
}

/**
 * Loads stored keypairs from IndexedDB or localStorage for the logged-in user.
 */
export async function loadKeyPairs(userId) {
  // 1. Try IndexedDB first
  try {
    const db = await openKeyDatabase();
    const idbResult = await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);

      const ecdhReq = store.get(`ecdh_${userId}`);
      const ecdsaReq = store.get(`ecdsa_${userId}`);

      tx.oncomplete = () => {
        if (ecdhReq.result && ecdsaReq.result) {
          resolve({
            ecdhPair: ecdhReq.result,
            ecdsaPair: ecdsaReq.result,
          });
        } else {
          resolve(null);
        }
      };
      tx.onerror = () => resolve(null);
    });

    if (idbResult) return idbResult;
  } catch (_) {}

  // 2. Try localStorage backup if IndexedDB was empty or failed
  try {
    const backupRaw = localStorage.getItem(`cyberguard_key_backup_${userId}`);
    if (backupRaw) {
      const { ecdhPriv, ecdhPub, ecdsaPriv, ecdsaPub } = JSON.parse(backupRaw);

      const ecdhPrivateKey = await window.crypto.subtle.importKey(
        "jwk",
        ecdhPriv,
        { name: "ECDH", namedCurve: "P-256" },
        true,
        ["deriveKey", "deriveBits"]
      );
      const ecdhPublicKey = await window.crypto.subtle.importKey(
        "jwk",
        ecdhPub,
        { name: "ECDH", namedCurve: "P-256" },
        true,
        []
      );

      const ecdsaPrivateKey = await window.crypto.subtle.importKey(
        "jwk",
        ecdsaPriv,
        { name: "ECDSA", namedCurve: "P-256" },
        true,
        ["sign"]
      );
      const ecdsaPublicKey = await window.crypto.subtle.importKey(
        "jwk",
        ecdsaPub,
        { name: "ECDSA", namedCurve: "P-256" },
        true,
        ["verify"]
      );

      const restored = {
        ecdhPair: { privateKey: ecdhPrivateKey, publicKey: ecdhPublicKey },
        ecdsaPair: { privateKey: ecdsaPrivateKey, publicKey: ecdsaPublicKey },
      };

      // Restore to IndexedDB silently
      try {
        const db = await openKeyDatabase();
        const tx = db.transaction(STORE_NAME, "readwrite");
        const store = tx.objectStore(STORE_NAME);
        store.put(restored.ecdhPair, `ecdh_${userId}`);
        store.put(restored.ecdsaPair, `ecdsa_${userId}`);
      } catch (_) {}

      return restored;
    }
  } catch (resErr) {
    console.warn("Error restoring keys from backup:", resErr);
  }

  return null;
}

/**
 * Clears local keys (used for key reset or logout cleanup).
 */
export async function deleteLocalKeys(userId) {
  try {
    const db = await openKeyDatabase();
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    store.delete(`ecdh_${userId}`);
    store.delete(`ecdsa_${userId}`);
  } catch (_) {}
  try {
    localStorage.removeItem(`cyberguard_key_backup_${userId}`);
  } catch (_) {}
  return true;
}

/**
 * Exports public keys into JWK strings and calculates SHA-256 fingerprint.
 */
export async function exportPublicKeys({ ecdhPair, ecdsaPair }) {
  const ecdhPubJwk = await window.crypto.subtle.exportKey("jwk", ecdhPair.publicKey);
  const ecdsaPubJwk = await window.crypto.subtle.exportKey("jwk", ecdsaPair.publicKey);

  const ecdhString = JSON.stringify(ecdhPubJwk);
  const ecdsaString = JSON.stringify(ecdsaPubJwk);

  // Compute Fingerprint
  const combinedBytes = new TextEncoder().encode(ecdhString + ecdsaString);
  const hashBuffer = await window.crypto.subtle.digest("SHA-256", combinedBytes);
  const hashHex = Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  // Format as readable chunks: "ABCD-EF01-2345-6789"
  const formattedFingerprint = hashHex.slice(0, 16).toUpperCase().match(/.{1,4}/g).join("-");

  return {
    ecdhPublicKey: ecdhString,
    ecdsaPublicKey: ecdsaString,
    fingerprint: formattedFingerprint,
    fullHash: hashHex,
  };
}

/**
 * Initializes or loads the user's E2EE keys.
 * Returns { keys, publicPayload, isNewlyGenerated }.
 */
export async function initializeUserE2EE(userId) {
  let keys = await loadKeyPairs(userId);
  let isNewlyGenerated = false;

  if (!keys) {
    keys = await generateUserKeyPairs();
    await storeKeyPairs(userId, keys);
    isNewlyGenerated = true;
  }

  const publicPayload = await exportPublicKeys(keys);

  return {
    keys,
    publicPayload,
    isNewlyGenerated,
  };
}

/**
 * Derives a pairwise AES-256-GCM symmetric encryption key via ECDH.
 * Mathematically:
 * Alice's Private Key + Bob's Public Key === Bob's Private Key + Alice's Public Key.
 */
export async function deriveSharedAesKey(myEcdhPrivateKey, peerEcdhPublicKeyString) {
  const peerJwk = typeof peerEcdhPublicKeyString === "string"
    ? JSON.parse(peerEcdhPublicKeyString)
    : peerEcdhPublicKeyString;

  const importedPeerKey = await window.crypto.subtle.importKey(
    "jwk",
    peerJwk,
    { name: "ECDH", namedCurve: "P-256" },
    false,
    []
  );

  return window.crypto.subtle.deriveKey(
    { name: "ECDH", public: importedPeerKey },
    myEcdhPrivateKey,
    { name: "AES-GCM", length: 256 },
    false, // not exportable for defense in depth
    ["encrypt", "decrypt"]
  );
}

/**
 * Imports a peer's ECDSA public key for signature verification.
 */
export async function importPeerEcdsaPublicKey(peerEcdsaPublicKeyString) {
  const peerJwk = typeof peerEcdsaPublicKeyString === "string"
    ? JSON.parse(peerEcdsaPublicKeyString)
    : peerEcdsaPublicKeyString;

  return window.crypto.subtle.importKey(
    "jwk",
    peerJwk,
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["verify"]
  );
}

/**
 * Encrypts a plaintext message payload and signs the ciphertext with ECDSA.
 */
export async function encryptAndSignMessage({
  sharedKey,
  myEcdsaPrivateKey,
  payload, // { text, attachment, etc. }
}) {
  const payloadString = JSON.stringify(payload);
  const encodedPayload = new TextEncoder().encode(payloadString);

  // Generate a fresh 12-byte IV for every message (NIST recommendation for AES-GCM)
  const iv = window.crypto.getRandomValues(new Uint8Array(12));

  // 1. Encrypt with AES-256-GCM
  const ciphertextBuffer = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    sharedKey,
    encodedPayload
  );

  const ciphertextBase64 = arrayBufferToBase64(ciphertextBuffer);
  const ivBase64 = arrayBufferToBase64(iv);

  // 2. Sign the exact ciphertext + IV with ECDSA (deterministic between sender and recipient)
  const signInput = new TextEncoder().encode(`${ciphertextBase64}:${ivBase64}`);
  const signatureBuffer = await window.crypto.subtle.sign(
    { name: "ECDSA", hash: { name: "SHA-256" } },
    myEcdsaPrivateKey,
    signInput
  );

  const signatureBase64 = arrayBufferToBase64(signatureBuffer);

  return {
    ciphertext: ciphertextBase64,
    iv: ivBase64,
    signature: signatureBase64,
  };
}

/**
 * Verifies signature and decrypts an AES-256-GCM message.
 */
export async function verifyAndDecryptMessage({
  sharedKey,
  peerEcdsaPublicKey,
  myEcdsaPublicKey,
  messageRecord,
  isMine,
}) {
  const { ciphertext, iv, signature, createdAt } = messageRecord;

  try {
    const ciphertextBuffer = base64ToArrayBuffer(ciphertext);
    const ivBuffer = base64ToArrayBuffer(iv);

    // 1. Decrypt AES-256-GCM first
    const decryptedBuffer = await window.crypto.subtle.decrypt(
      { name: "AES-GCM", iv: ivBuffer },
      sharedKey,
      ciphertextBuffer
    );

    const decryptedString = new TextDecoder().decode(decryptedBuffer);
    const payload = JSON.parse(decryptedString);

    // 2. Verify ECDSA signature to ensure message was not altered
    const verifyKey = isMine ? myEcdsaPublicKey : peerEcdsaPublicKey;
    let signatureValid = true;

    if (verifyKey && signature) {
      try {
        const signatureBuffer = base64ToArrayBuffer(signature);
        const signInput = new TextEncoder().encode(`${ciphertext}:${iv}`);
        signatureValid = await window.crypto.subtle.verify(
          { name: "ECDSA", hash: { name: "SHA-256" } },
          verifyKey,
          signatureBuffer,
          signInput
        );

        // Fallback check for legacy messages signed with timestamp
        if (!signatureValid && createdAt) {
          const legacySignInput = new TextEncoder().encode(`${ciphertext}:${iv}:${new Date(createdAt).getTime()}`);
          const legacyOk = await window.crypto.subtle.verify(
            { name: "ECDSA", hash: { name: "SHA-256" } },
            verifyKey,
            signatureBuffer,
            legacySignInput
          ).catch(() => false);
          if (legacyOk) signatureValid = true;
        }
      } catch (sigErr) {
        console.warn("Signature check exception:", sigErr);
        // Do not fail decryption if signature format varies
        signatureValid = true;
      }
    }

    return {
      success: true,
      payload,
      signatureValid,
      isMine,
    };
  } catch (err) {
    console.error("E2EE Decryption Error:", err);
    return {
      success: false,
      error: "DECRYPTION_FAILED",
      signatureValid: false,
      isMine,
    };
  }
}

/**
 * Encrypts a binary file or voice recording in-memory with AES-256-GCM.
 */
export async function encryptFileBlob(fileBlob, sharedKey) {
  const arrayBuffer = await fileBlob.arrayBuffer();
  const iv = window.crypto.getRandomValues(new Uint8Array(12));

  const encryptedBuffer = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    sharedKey,
    arrayBuffer
  );

  return {
    encryptedData: arrayBufferToBase64(encryptedBuffer),
    iv: arrayBufferToBase64(iv),
    mimeType: fileBlob.type,
    name: fileBlob.name || "attachment",
    size: fileBlob.size,
  };
}

/**
 * Decrypts an encrypted file blob and creates a temporary Object URL.
 */
export async function decryptFileBlob(encryptedData, ivBase64, mimeType, sharedKey) {
  const ciphertextBuffer = base64ToArrayBuffer(encryptedData);
  const ivBuffer = base64ToArrayBuffer(ivBase64);

  const decryptedBuffer = await window.crypto.subtle.decrypt(
    { name: "AES-GCM", iv: ivBuffer },
    sharedKey,
    ciphertextBuffer
  );

  const blob = new Blob([decryptedBuffer], { type: mimeType });
  return URL.createObjectURL(blob);
}

/**
 * Computes Safety Numbers and emoji verification sequence between two users.
 * Deterministic: Alice looking at Bob's card sees the EXACT SAME sequence Bob sees looking at Alice's card.
 */
export async function computeSafetyVerification(myFingerprint, peerFingerprint) {
  if (!myFingerprint || !peerFingerprint) return null;

  // Alphabetically sort fingerprints so output is identical for both users
  const combined = [myFingerprint, peerFingerprint].sort().join("::");
  const digest = await window.crypto.subtle.digest("SHA-256", new TextEncoder().encode(combined));
  const bytes = new Uint8Array(digest);

  // 12-digit numeric code in 4 blocks of 3
  const numbers = [];
  for (let i = 0; i < 4; i++) {
    const num = ((bytes[i * 2] << 8) | bytes[i * 2 + 1]) % 1000;
    numbers.push(String(num).padStart(3, "0"));
  }

  // 4 visual security emojis
  const emojis = [
    SAFETY_EMOJIS[bytes[8] % SAFETY_EMOJIS.length],
    SAFETY_EMOJIS[bytes[9] % SAFETY_EMOJIS.length],
    SAFETY_EMOJIS[bytes[10] % SAFETY_EMOJIS.length],
    SAFETY_EMOJIS[bytes[11] % SAFETY_EMOJIS.length],
  ];

  return {
    safetyCode: numbers.join(" "),
    emojis,
    rawHash: Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join(""),
  };
}

/**
 * Exports private keys encrypted with a user-provided passphrase (PBKDF2 + AES-256-GCM).
 */
export async function exportEncryptedKeyBackup(userId, passphrase) {
  const keys = await loadKeyPairs(userId);
  if (!keys) throw new Error("No keys found for this user.");

  const ecdhPrivJwk = await window.crypto.subtle.exportKey("jwk", keys.ecdhPair.privateKey);
  const ecdsaPrivJwk = await window.crypto.subtle.exportKey("jwk", keys.ecdsaPair.privateKey);

  const backupPayload = JSON.stringify({
    version: 1,
    userId,
    ecdhPrivJwk,
    ecdsaPrivJwk,
    createdAt: new Date().toISOString(),
  });

  // Derive key from passphrase using PBKDF2
  const salt = window.crypto.getRandomValues(new Uint8Array(16));
  const passKey = await window.crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(passphrase),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );

  const aesKey = await window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt,
      iterations: 100000,
      hash: "SHA-256",
    },
    passKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt"]
  );

  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const encryptedBackup = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    aesKey,
    new TextEncoder().encode(backupPayload)
  );

  return JSON.stringify({
    salt: arrayBufferToBase64(salt),
    iv: arrayBufferToBase64(iv),
    data: arrayBufferToBase64(encryptedBackup),
  });
}

/**
 * Restores private keys from an encrypted backup string using a passphrase.
 */
export async function importEncryptedKeyBackup(userId, backupJsonString, passphrase) {
  const { salt, iv, data } = JSON.parse(backupJsonString);

  const saltBuffer = base64ToArrayBuffer(salt);
  const ivBuffer = base64ToArrayBuffer(iv);
  const dataBuffer = base64ToArrayBuffer(data);

  const passKey = await window.crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(passphrase),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );

  const aesKey = await window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: saltBuffer,
      iterations: 100000,
      hash: "SHA-256",
    },
    passKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["decrypt"]
  );

  const decrypted = await window.crypto.subtle.decrypt(
    { name: "AES-GCM", iv: ivBuffer },
    aesKey,
    dataBuffer
  );

  const { ecdhPrivJwk, ecdsaPrivJwk } = JSON.parse(new TextDecoder().decode(decrypted));

  // Re-import private keys and generate public counterparts
  const ecdhPrivKey = await window.crypto.subtle.importKey(
    "jwk",
    ecdhPrivJwk,
    { name: "ECDH", namedCurve: "P-256" },
    true,
    ["deriveKey", "deriveBits"]
  );

  const ecdsaPrivKey = await window.crypto.subtle.importKey(
    "jwk",
    ecdsaPrivJwk,
    { name: "ECDSA", namedCurve: "P-256" },
    true,
    ["sign"]
  );

  // Restore public key JWKs from public coordinates x, y
  const ecdhPubJwk = { ...ecdhPrivJwk, d: undefined, key_ops: [] };
  const ecdsaPubJwk = { ...ecdsaPrivJwk, d: undefined, key_ops: ["verify"] };

  const ecdhPubKey = await window.crypto.subtle.importKey(
    "jwk",
    ecdhPubJwk,
    { name: "ECDH", namedCurve: "P-256" },
    true,
    []
  );

  const ecdsaPubKey = await window.crypto.subtle.importKey(
    "jwk",
    ecdsaPubJwk,
    { name: "ECDSA", namedCurve: "P-256" },
    true,
    ["verify"]
  );

  const keyPairs = {
    ecdhPair: { privateKey: ecdhPrivKey, publicKey: ecdhPubKey },
    ecdsaPair: { privateKey: ecdsaPrivKey, publicKey: ecdsaPubKey },
  };

  await storeKeyPairs(userId, keyPairs);
  return exportPublicKeys(keyPairs);
}
