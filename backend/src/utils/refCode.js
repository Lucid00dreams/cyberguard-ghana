const crypto = require("crypto");

/**
 * Generates a short, human-shareable reference code that carries no
 * personally identifiable information. Used so an anonymous reporter
 * can check the status of their report later without an account,
 * and for certificate verification codes.
 *
 * Format: PREFIX-XXXX-XXXX (base32-ish, no ambiguous chars)
 */
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // no 0/O, 1/I/L

function generateRefCode(prefix = "CG") {
  const randomBlock = () =>
    Array.from({ length: 4 }, () => ALPHABET[crypto.randomInt(0, ALPHABET.length)]).join("");
  return `${prefix}-${randomBlock()}-${randomBlock()}`;
}

module.exports = { generateRefCode };
