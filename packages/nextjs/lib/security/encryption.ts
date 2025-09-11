/**
 * Encryption Service for sensitive data
 * Provides AES-256-GCM encryption for mission data, documents, and PII
 */
import crypto from "crypto";

export class EncryptionService {
  private static instance: EncryptionService;
  private readonly algorithm = "aes-256-gcm";
  private readonly keyLength = 32;
  private readonly ivLength = 16;
  private readonly tagLength = 16;
  private readonly saltLength = 64;
  private readonly iterations = 100000;

  // Master key derived from environment variable
  private masterKey: Buffer;

  private constructor() {
    const secret = process.env.ENCRYPTION_SECRET || process.env.NEXTAUTH_SECRET;
    if (!secret || secret.length < 32) {
      console.warn("⚠️ Encryption secret not properly configured. Using fallback.");
      this.masterKey = crypto.scryptSync("fallback-key-not-for-production", "salt", this.keyLength);
    } else {
      this.masterKey = crypto.scryptSync(secret, "mission-planning-salt", this.keyLength);
    }
  }

  static getInstance(): EncryptionService {
    if (!EncryptionService.instance) {
      EncryptionService.instance = new EncryptionService();
    }
    return EncryptionService.instance;
  }

  /**
   * Encrypt sensitive data
   */
  encrypt(text: string): { encrypted: string; iv: string; tag: string } {
    const iv = crypto.randomBytes(this.ivLength);
    const cipher = crypto.createCipheriv(this.algorithm, this.masterKey, iv);

    let encrypted = cipher.update(text, "utf8", "hex");
    encrypted += cipher.final("hex");

    const tag = cipher.getAuthTag();

    return {
      encrypted,
      iv: iv.toString("hex"),
      tag: tag.toString("hex"),
    };
  }

  /**
   * Decrypt sensitive data
   */
  decrypt(encrypted: string, iv: string, tag: string): string {
    const decipher = crypto.createDecipheriv(this.algorithm, this.masterKey, Buffer.from(iv, "hex"));

    decipher.setAuthTag(Buffer.from(tag, "hex"));

    let decrypted = decipher.update(encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  }

  /**
   * Encrypt an object
   */
  encryptObject<T>(obj: T): string {
    const jsonString = JSON.stringify(obj);
    const { encrypted, iv, tag } = this.encrypt(jsonString);

    // Combine encrypted data, iv, and tag into a single string
    const combined = `${encrypted}.${iv}.${tag}`;
    return Buffer.from(combined).toString("base64");
  }

  /**
   * Decrypt an object
   */
  decryptObject<T>(encryptedData: string): T {
    const combined = Buffer.from(encryptedData, "base64").toString();
    const [encrypted, iv, tag] = combined.split(".");

    const decrypted = this.decrypt(encrypted, iv, tag);
    return JSON.parse(decrypted) as T;
  }

  /**
   * Hash sensitive data (one-way)
   */
  hash(data: string): string {
    return crypto.createHash("sha256").update(data).digest("hex");
  }

  /**
   * Generate secure random token
   */
  generateSecureToken(length: number = 32): string {
    return crypto.randomBytes(length).toString("hex");
  }

  /**
   * Encrypt field-level data for database storage
   */
  encryptField(value: any): string {
    if (value === null || value === undefined) {
      return value;
    }

    const stringValue = typeof value === "string" ? value : JSON.stringify(value);
    return this.encryptObject(stringValue);
  }

  /**
   * Decrypt field-level data from database
   */
  decryptField(encryptedValue: string): any {
    if (!encryptedValue) {
      return encryptedValue;
    }

    try {
      const decrypted = this.decryptObject<string>(encryptedValue);

      // Try to parse as JSON, otherwise return as string
      try {
        return JSON.parse(decrypted);
      } catch {
        return decrypted;
      }
    } catch (error) {
      console.error("Failed to decrypt field:", error);
      return null;
    }
  }

  /**
   * Encrypt sensitive mission data
   */
  encryptMissionData(missionData: any): {
    encryptedData: string;
    metadata: {
      encryptedAt: string;
      algorithm: string;
      version: string;
    };
  } {
    const sensitive = {
      ...missionData,
      _encrypted: true,
      _timestamp: new Date().toISOString(),
    };

    return {
      encryptedData: this.encryptObject(sensitive),
      metadata: {
        encryptedAt: new Date().toISOString(),
        algorithm: this.algorithm,
        version: "1.0.0",
      },
    };
  }

  /**
   * Decrypt sensitive mission data
   */
  decryptMissionData(encryptedData: string): any {
    const decrypted = this.decryptObject<any>(encryptedData);

    if (!decrypted._encrypted) {
      throw new Error("Invalid encrypted data format");
    }

    delete decrypted._encrypted;
    delete decrypted._timestamp;

    return decrypted;
  }

  /**
   * Encrypt PII (Personally Identifiable Information)
   */
  encryptPII(pii: {
    email?: string;
    name?: string;
    phone?: string;
    address?: string;
    [key: string]: any;
  }): Record<string, string> {
    const encrypted: Record<string, string> = {};

    for (const [key, value] of Object.entries(pii)) {
      if (value) {
        encrypted[key] = this.encryptField(value);
      }
    }

    return encrypted;
  }

  /**
   * Decrypt PII
   */
  decryptPII(encryptedPII: Record<string, string>): Record<string, any> {
    const decrypted: Record<string, any> = {};

    for (const [key, value] of Object.entries(encryptedPII)) {
      if (value) {
        decrypted[key] = this.decryptField(value);
      }
    }

    return decrypted;
  }

  /**
   * Generate encryption key for client-side encryption
   */
  generateClientKey(): {
    key: string;
    salt: string;
    iterations: number;
  } {
    const salt = crypto.randomBytes(this.saltLength).toString("hex");
    const key = crypto.randomBytes(this.keyLength).toString("hex");

    return {
      key,
      salt,
      iterations: this.iterations,
    };
  }

  /**
   * Validate data integrity
   */
  validateIntegrity(data: string, signature: string): boolean {
    const hmac = crypto.createHmac("sha256", this.masterKey);
    hmac.update(data);
    const computedSignature = hmac.digest("hex");

    return crypto.timingSafeEqual(Buffer.from(signature, "hex"), Buffer.from(computedSignature, "hex"));
  }

  /**
   * Sign data for integrity verification
   */
  signData(data: string): string {
    const hmac = crypto.createHmac("sha256", this.masterKey);
    hmac.update(data);
    return hmac.digest("hex");
  }
}

// Export singleton instance
export const encryptionService = EncryptionService.getInstance();
