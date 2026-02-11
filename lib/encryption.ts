import crypto from 'crypto';

// Encryption algorithm
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;
const TAG_POSITION = SALT_LENGTH + IV_LENGTH;
const ENCRYPTED_POSITION = TAG_POSITION + TAG_LENGTH;

/**
 * Get encryption key from environment
 * In production, ENCRYPTION_KEY must be set. Falls back to dev key only in development.
 */
function getEncryptionKey(): string {
  const key =
    process.env.ENCRYPTION_KEY ||
    (process.env.NODE_ENV === 'production'
      ? (() => {
          throw new Error('ENCRYPTION_KEY must be set in production');
        })()
      : 'dev-key-change-in-production-32b');

  // Ensure key is exactly 32 bytes
  return crypto.createHash('sha256').update(key).digest('hex').slice(0, 32);
}

/**
 * Encrypt a string
 */
export function encrypt(text: string): string {
  if (!text) return '';

  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const salt = crypto.randomBytes(SALT_LENGTH);

  const derivedKey = crypto.pbkdf2Sync(key, salt, 100000, 32, 'sha256');
  const cipher = crypto.createCipheriv(ALGORITHM, derivedKey, iv);

  const encrypted = Buffer.concat([
    cipher.update(text, 'utf8'),
    cipher.final(),
  ]);

  const tag = cipher.getAuthTag();

  return Buffer.concat([salt, iv, tag, encrypted]).toString('base64');
}

/**
 * Decrypt a string
 */
export function decrypt(encryptedText: string): string {
  if (!encryptedText) return '';

  try {
    const key = getEncryptionKey();
    const buffer = Buffer.from(encryptedText, 'base64');

    const salt = buffer.subarray(0, SALT_LENGTH);
    const iv = buffer.subarray(SALT_LENGTH, TAG_POSITION);
    const tag = buffer.subarray(TAG_POSITION, ENCRYPTED_POSITION);
    const encrypted = buffer.subarray(ENCRYPTED_POSITION);

    const derivedKey = crypto.pbkdf2Sync(key, salt, 100000, 32, 'sha256');
    const decipher = crypto.createDecipheriv(ALGORITHM, derivedKey, iv);

    decipher.setAuthTag(tag);

    return decipher.update(encrypted) + decipher.final('utf8');
  } catch (error) {
    console.error('Decryption error:', error);
    return '';
  }
}

/**
 * Test if encryption/decryption works
 */
export function testEncryption(): boolean {
  const testString = 'test-encryption-key-123';
  const encrypted = encrypt(testString);
  const decrypted = decrypt(encrypted);
  return testString === decrypted;
}
