import {
  createCipheriv,
  createDecipheriv,
  createHmac,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";

const ALGORITHM = "aes-256-gcm";

function getKeyBuffer(rawKey: string): Buffer {
  if (/^[a-f0-9]{64}$/i.test(rawKey)) return Buffer.from(rawKey, "hex");

  try {
    const base64 = Buffer.from(rawKey, "base64");
    if (base64.length === 32) return base64;
  } catch {
    // fall through to utf8 handling
  }

  const utf8 = Buffer.from(rawKey, "utf8");
  if (utf8.length === 32) return utf8;

  throw new Error("INTEGRATIONS_ENCRYPTION_KEY must decode to 32 bytes");
}

export class TokenCipher {
  private readonly key: Buffer;

  constructor(rawKey: string) {
    this.key = getKeyBuffer(rawKey);
  }

  encrypt(plaintext: string): string {
    const iv = randomBytes(12);
    const cipher = createCipheriv(ALGORITHM, this.key, iv);
    const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
    const authTag = cipher.getAuthTag();
    return `v1:${iv.toString("base64url")}:${authTag.toString("base64url")}:${ciphertext.toString("base64url")}`;
  }

  decrypt(payload: string): string {
    const [version, ivRaw, authTagRaw, ciphertextRaw] = payload.split(":");
    if (version !== "v1" || !ivRaw || !authTagRaw || !ciphertextRaw) {
      throw new Error("Invalid encrypted token payload");
    }

    const decipher = createDecipheriv(ALGORITHM, this.key, Buffer.from(ivRaw, "base64url"));
    decipher.setAuthTag(Buffer.from(authTagRaw, "base64url"));
    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(ciphertextRaw, "base64url")),
      decipher.final(),
    ]);
    return decrypted.toString("utf8");
  }

  sign(value: string): string {
    return createHmac("sha256", this.key).update(value).digest("base64url");
  }

  verify(value: string, signature: string): boolean {
    const expected = Buffer.from(this.sign(value));
    const actual = Buffer.from(signature);
    if (expected.length !== actual.length) return false;
    return timingSafeEqual(expected, actual);
  }
}
