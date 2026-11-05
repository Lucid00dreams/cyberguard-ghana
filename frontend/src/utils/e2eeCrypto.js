/**
 * e2eeCrypto.js
 * --------------------------------------------------------------------------
 * End-to-End Encryption (E2EE) Module for CyberGuard Ghana Mentorship Chat
 *
 * Uses the browser Web Crypto API (window.crypto.subtle):
 * 1. Key Agreement: ECDH (P-256) -> non-exportable AES-256-GCM session keys.
 * 2. Symmetric Encryption: AES-256-GCM with fresh 12-byte random IV per message.
 * 3. Signatures: ECDSA (P-256 / SHA-256) over ciphertext + IV.
 * 4. Storage: Keys reside in IndexedDB only (never stored unencrypted in localStorage).
 *    Cross-device backups require a user passphrase (PBKDF2 100k SHA-256 + AES-256-GCM).
 * --------------------------------------------------------------------------
 */

const DB_NAME = "cyberguard_e2ee_keystore_v1";
const STORE_NAME = "keypairs";

export const MAX_ATTACHMENT_BYTES = 2 * 1024 * 1024; // 2 MB

export const SAFE_ATTACHMENT_MIMES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "application/pdf",
  "text/plain",
  "audio/webm",
  "audio/ogg",
  "audio/mp4",
  "audio/mpeg",
]);

const SAFETY_EMOJIS = [
  "🛡️", "🔐", "⚡", "🦅", "🇬🇭", "⭐", "🔑", "🦁",
  "🌊", "🔥", "💎", "🎯", "🌴", "🚀", "🪐", "🏆",
];

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

export function arrayBufferToBase64(buffer) {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.byteLength; i += chunkSize) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunkSize));
  }
  return window.btoa(binary);
}

export function base64ToArrayBuffer(base64) {
  const binary = window.atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

export async function generateUserKeyPairs() {
  const ecdhPair = await window.crypto.subtle.generateKey(
    { name: "ECDH", namedCurve: "P-256" },
    true, // extractable only via passphrase-encrypted PBKDF2 export
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
 * Stores generated keypairs in IndexedDB only and purges any legacy plaintext localStorage copy.
 */
export async function storeKeyPairs(userId, { ecdhPair, ecdsaPair }) {
  const db = await openKeyDatabase();
  await new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);

    store.put(ecdhPair, `ecdh_${userId}`);
    store.put(ecdsaPair, `ecdsa_${userId}`);

    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error);
  });

  // Never keep unencrypted private keys in localStorage
  try {
    localStorage.removeItem(`cyberguard_key_backup_${userId}`);
  } catch {
    // ignore storage access errors
  }

  return true;
}

/**
 * Loads stored keypairs from IndexedDB, migrating and deleting any legacy localStorage entry once.
 */
export async function loadKeyPairs(userId) {
  try {
    const db = await openKeyDatabase();
    const idbResult = await new Promise((resolve) => {
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

    if (idbResult) {
      try {
        localStorage.removeItem(`cyberguard_key_backup_${userId}`);
      } catch {
        // ignore
      }
      return idbResult;
    }
  } catch {
    // proceed to one-time legacy migration check
  }

  // One-time migration for legacy accounts, followed by immediate deletion from localStorage
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

      await storeKeyPairs(userId, restored);
      localStorage.removeItem(`cyberguard_key_backup_${userId}`);
      return restored;
    }
  } catch {
    try {
      localStorage.removeItem(`cyberguard_key_backup_${userId}`);
    } catch {
      // ignore
    }
  }

  return null;
}

export async function deleteLocalKeys(userId) {
  try {
    const db = await openKeyDatabase();
    await new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      store.delete(`ecdh_${userId}`);
      store.delete(`ecdsa_${userId}`);
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
    });
  } catch {
    // ignore
  }
  try {
    localStorage.removeItem(`cyberguard_key_backup_${userId}`);
  } catch {
    // ignore
  }
  return true;
}

export async function exportPublicKeys({ ecdhPair, ecdsaPair }) {
  const ecdhPubJwk = await window.crypto.subtle.exportKey("jwk", ecdhPair.publicKey);
  const ecdsaPubJwk = await window.crypto.subtle.exportKey("jwk", ecdsaPair.publicKey);

  // Explicitly ensure only public fields are serialized
  const cleanEcdh = { kty: ecdhPubJwk.kty, crv: ecdhPubJwk.crv, x: ecdhPubJwk.x, y: ecdhPubJwk.y, ext: true };
  const cleanEcdsa = { kty: ecdsaPubJwk.kty, crv: ecdsaPubJwk.crv, x: ecdsaPubJwk.x, y: ecdsaPubJwk.y, ext: true };

  const ecdhString = JSON.stringify(cleanEcdh);
  const ecdsaString = JSON.stringify(cleanEcdsa);

  const combinedBytes = new TextEncoder().encode(ecdhString + ecdsaString);
  const hashBuffer = await window.crypto.subtle.digest("SHA-256", combinedBytes);
  const hashHex = Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  const formattedFingerprint = hashHex.slice(0, 16).toUpperCase().match(/.{1,4}/g).join("-");

  return {
    ecdhPublicKey: ecdhString,
    ecdsaPublicKey: ecdsaString,
    fingerprint: formattedFingerprint,
    fullHash: hashHex,
  };
}

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

export async function deriveSharedAesKey(myEcdhPrivateKey, peerEcdhPublicKeyString) {
  const peerJwk =
    typeof peerEcdhPublicKeyString === "string"
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
    false,
    ["encrypt", "decrypt"]
  );
}

export async function importPeerEcdsaPublicKey(peerEcdsaPublicKeyString) {
  const peerJwk =
    typeof peerEcdsaPublicKeyString === "string"
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

export async function encryptAndSignMessage({ sharedKey, myEcdsaPrivateKey, payload }) {
  const payloadString = JSON.stringify(payload);
  const encodedPayload = new TextEncoder().encode(payloadString);
  const iv = window.crypto.getRandomValues(new Uint8Array(12));

  const ciphertextBuffer = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    sharedKey,
    encodedPayload
  );

  const ciphertextBase64 = arrayBufferToBase64(ciphertextBuffer);
  const ivBase64 = arrayBufferToBase64(iv);

  const signInput = new TextEncoder().encode(`${ciphertextBase64}:${ivBase64}`);
  const signatureBuffer = await window.crypto.subtle.sign(
    { name: "ECDSA", hash: { name: "SHA-256" } },
    myEcdsaPrivateKey,
    signInput
  );

  return {
    ciphertext: ciphertextBase64,
    iv: ivBase64,
    signature: arrayBufferToBase64(signatureBuffer),
  };
}

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

    const decryptedBuffer = await window.crypto.subtle.decrypt(
      { name: "AES-GCM", iv: ivBuffer },
      sharedKey,
      ciphertextBuffer
    );

    const decryptedString = new TextDecoder().decode(decryptedBuffer);
    const payload = JSON.parse(decryptedString);

    const verifyKey = isMine ? myEcdsaPublicKey : peerEcdsaPublicKey;
    let signatureValid = false;

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

        if (!signatureValid && createdAt) {
          const legacySignInput = new TextEncoder().encode(
            `${ciphertext}:${iv}:${new Date(createdAt).getTime()}`
          );
          signatureValid = await window.crypto.subtle
            .verify(
              { name: "ECDSA", hash: { name: "SHA-256" } },
              verifyKey,
              signatureBuffer,
              legacySignInput
            )
            .catch(() => false);
        }
      } catch {
        signatureValid = false;
      }
    }

    return {
      success: true,
      payload,
      signatureValid,
      isMine,
    };
  } catch {
    return {
      success: false,
      error: "DECRYPTION_FAILED",
      signatureValid: false,
      isMine,
    };
  }
}

export async function encryptFileBlob(fileBlob, sharedKey) {
  if (!fileBlob) throw new Error("No file selected.");
  if (fileBlob.size > MAX_ATTACHMENT_BYTES) {
    throw new Error("Attachments must be 2 MB or smaller.");
  }

  const normalizedMime = (fileBlob.type || "").split(";")[0].trim().toLowerCase();
  if (!SAFE_ATTACHMENT_MIMES.has(normalizedMime)) {
    throw new Error("Unsupported file type. Allowed: PNG, JPG, WebP, PDF, TXT, or voice notes.");
  }

  const arrayBuffer = await fileBlob.arrayBuffer();
  const iv = window.crypto.getRandomValues(new Uint8Array(12));

  const encryptedBuffer = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    sharedKey,
    arrayBuffer
  );

  const safeName = String(fileBlob.name || "attachment")
    .replace(/[^\w.\- ()]/g, "_")
    .slice(0, 80);

  return {
    encryptedData: arrayBufferToBase64(encryptedBuffer),
    iv: arrayBufferToBase64(iv),
    mimeType: normalizedMime,
    name: safeName,
    size: fileBlob.size,
  };
}

export async function decryptFileBlob(encryptedData, ivBase64, mimeType, sharedKey) {
  const ciphertextBuffer = base64ToArrayBuffer(encryptedData);
  const ivBuffer = base64ToArrayBuffer(ivBase64);

  const decryptedBuffer = await window.crypto.subtle.decrypt(
    { name: "AES-GCM", iv: ivBuffer },
    sharedKey,
    ciphertextBuffer
  );

  const normalizedMime = String(mimeType || "").split(";")[0].trim().toLowerCase();
  const safeBlobType = SAFE_ATTACHMENT_MIMES.has(normalizedMime)
    ? normalizedMime
    : "application/octet-stream";

  const blob = new Blob([decryptedBuffer], { type: safeBlobType });
  return URL.createObjectURL(blob);
}

export async function computeSafetyVerification(myFingerprint, peerFingerprint) {
  if (!myFingerprint || !peerFingerprint) return null;

  const combined = [myFingerprint, peerFingerprint].sort().join("::");
  const digest = await window.crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(combined)
  );
  const bytes = new Uint8Array(digest);

  const numbers = [];
  for (let i = 0; i < 4; i++) {
    const num = ((bytes[i * 2] << 8) | bytes[i * 2 + 1]) % 1000;
    numbers.push(String(num).padStart(3, "0"));
  }

  const emojis = [
    SAFETY_EMOJIS[bytes[8] % SAFETY_EMOJIS.length],
    SAFETY_EMOJIS[bytes[9] % SAFETY_EMOJIS.length],
    SAFETY_EMOJIS[bytes[10] % SAFETY_EMOJIS.length],
    SAFETY_EMOJIS[bytes[11] % SAFETY_EMOJIS.length],
  ];

  return {
    safetyCode: numbers.join(" "),
    emojis,
    rawHash: Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join(""),
  };
}

export async function exportEncryptedKeyBackup(userId, passphrase) {
  if (!passphrase || passphrase.length < 8) {
    throw new Error("Backup passphrase must be at least 8 characters.");
  }

  const keys = await loadKeyPairs(userId);
  if (!keys) throw new Error("No encryption keys found on this device.");

  const ecdhPrivJwk = await window.crypto.subtle.exportKey("jwk", keys.ecdhPair.privateKey);
  const ecdsaPrivJwk = await window.crypto.subtle.exportKey("jwk", keys.ecdsaPair.privateKey);

  const backupPayload = JSON.stringify({
    version: 1,
    userId,
    ecdhPrivJwk,
    ecdsaPrivJwk,
    createdAt: new Date().toISOString(),
  });

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

  const ecdhPubJwk = { kty: ecdhPrivJwk.kty, crv: ecdhPrivJwk.crv, x: ecdhPrivJwk.x, y: ecdhPrivJwk.y, ext: true };
  const ecdsaPubJwk = { kty: ecdsaPrivJwk.kty, crv: ecdsaPrivJwk.crv, x: ecdsaPrivJwk.x, y: ecdsaPrivJwk.y, ext: true };

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
    ecdsaPair: { privateKey: ecdsaPrivKey, publicKey: ecdsaPublicKey },
  };

  await storeKeyPairs(userId, keyPairs);
  return exportPublicKeys(keyPairs);
}
