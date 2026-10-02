/**
 * evidenceCrypto.js
 * ------------------------------------------------------------
 * Client-side security module for the CyberGuard Ghana COP Incident
 * Portal. Runs entirely in the browser — no file bytes and no metadata
 * ever reach the server unscrubbed.
 *
 * Two responsibilities:
 *   1. stripImageMetadata()  — re-encodes an image via <canvas>, which
 *      drops EXIF/IPTC/XMP blocks (camera model, GPS coordinates,
 *      timestamps, device serial numbers) because canvas only ever
 *      re-encodes raw pixel data.
 *   2. sha256File()          — computes a SHA-256 fingerprint of the
 *      (already-scrubbed) file using the native Web Crypto API, so the
 *      hash can be used for duplicate/viral-media matching without the
 *      server ever seeing the original bytes until upload.
 * ------------------------------------------------------------
 */

const STRIPPABLE_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

/**
 * Re-encodes an image file through an off-screen canvas to strip all
 * embedded metadata. Returns a new File with the same visual content
 * but none of the original binary metadata blocks.
 *
 * Non-image files (e.g. video) are passed through unchanged here —
 * video metadata stripping requires a different approach and is noted
 * as a follow-up in the README.
 */
export async function stripImageMetadata(file) {
  if (!STRIPPABLE_IMAGE_TYPES.includes(file.type)) {
    return file; // not a strippable image type — caller should warn the user
  }

  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement("canvas");
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;

  const ctx = canvas.getContext("2d");
  ctx.drawImage(bitmap, 0, 0);

  const blob = await new Promise((resolve) =>
    canvas.toBlob(resolve, file.type === "image/png" ? "image/png" : "image/jpeg", 0.92)
  );

  return new File([blob], file.name, { type: blob.type, lastModified: Date.now() });
}

/**
 * Computes the SHA-256 hex digest of a File/Blob using the native
 * Web Crypto API. Deterministic: identical bytes always produce an
 * identical hash, which is what makes duplicate/viral-abuse-media
 * matching possible server-side without ever comparing raw files.
 */
export async function sha256File(file) {
  const arrayBuffer = await file.arrayBuffer();
  const digest = await window.crypto.subtle.digest("SHA-256", arrayBuffer);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Full pipeline used by the Incident Report form:
 *   raw file -> strip metadata -> hash -> { cleanFile, sha256Hash }
 */
export async function prepareEvidence(file) {
  const isImage = STRIPPABLE_IMAGE_TYPES.includes(file.type);
  const cleanFile = isImage ? await stripImageMetadata(file) : file;
  const sha256Hash = await sha256File(cleanFile);

  return {
    cleanFile,
    sha256Hash,
    metadataStripped: isImage,
    originalName: file.name,
    mimeType: cleanFile.type,
    byteSize: cleanFile.size,
  };
}
