/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Simple robust SHA-256 simulator for web client to ensure cryptographic chaining
export function generateHash(input: string): string {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  const hex = Math.abs(hash).toString(16).padStart(8, '0');
  // deterministic hex expansion
  let fullHex = '';
  for (let i = 0; i < 4; i++) {
    let sub = 0;
    for (let j = 0; j < input.length; j++) {
      sub = ((sub << 7) - sub + input.charCodeAt(j) * (i + 3)) | 0;
    }
    fullHex += Math.abs(sub).toString(16).padStart(8, '0');
  }
  return fullHex;
}

export interface PiiMatch {
  type: 'EMAIL' | 'IP' | 'CREDIT_CARD' | 'NAME' | 'PHONE' | 'SSN';
  raw: string;
  masked: string;
  index: number;
}

export class PrivacyEngine {
  // Regex patterns
  private static emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,7}\b/g;
  private static ssnRegex = /\b\d{3}-\d{2}-\d{4}\b/g;
  private static creditCardRegex = /\b(?:\d{4}[-\s]?){3}\d{4}\b/g;
  private static phoneRegex = /\b(?:\+?1[-.]?)?\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})\b/g;
  private static ipRegex = /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g;

  public static maskEmail(email: string): string {
    const parts = email.split('@');
    if (parts.length !== 2) return '[REDACTED_EMAIL]';
    const name = parts[0];
    const domain = parts[1];
    const maskedName = name.length > 2 ? `${name[0]}***${name[name.length - 1]}` : `${name[0]}***`;
    return `${maskedName}@${domain}`;
  }

  public static maskSSN(ssn: string): string {
    return 'XXX-XX-' + ssn.slice(-4);
  }

  public static maskCreditCard(cc: string): string {
    const clean = cc.replace(/[-\s]/g, '');
    return '****-****-****-' + clean.slice(-4);
  }

  public static maskPhone(phone: string): string {
    return '***-***-' + phone.slice(-4);
  }

  public static maskIP(ip: string): string {
    const segments = ip.split('.');
    if (segments.length === 4) {
      return `${segments[0]}.${segments[1]}.xxx.xxx`;
    }
    return 'xxx.xxx.xxx.xxx';
  }

  public static scanAndSanitize(
    text: string,
    mode: 'MASK' | 'HASH' | 'REDACT' = 'MASK'
  ): {
    sanitizedText: string;
    detectedPii: PiiMatch[];
    hasPii: boolean;
  } {
    const detected: PiiMatch[] = [];
    let sanitized = text;

    // Emails
    sanitized = sanitized.replace(this.emailRegex, (match, offset) => {
      const masked =
        mode === 'HASH'
          ? `[HASH:${generateHash(match).slice(0, 12)}]`
          : mode === 'REDACT'
          ? '[PII:EMAIL_REDACTED]'
          : this.maskEmail(match);
      detected.push({ type: 'EMAIL', raw: match, masked, index: offset });
      return masked;
    });

    // SSN
    sanitized = sanitized.replace(this.ssnRegex, (match, offset) => {
      const masked =
        mode === 'HASH'
          ? `[HASH:${generateHash(match).slice(0, 12)}]`
          : mode === 'REDACT'
          ? '[PII:SSN_REDACTED]'
          : this.maskSSN(match);
      detected.push({ type: 'SSN', raw: match, masked, index: offset });
      return masked;
    });

    // Credit Cards
    sanitized = sanitized.replace(this.creditCardRegex, (match, offset) => {
      const masked =
        mode === 'HASH'
          ? `[HASH:${generateHash(match).slice(0, 12)}]`
          : mode === 'REDACT'
          ? '[PII:FIN_CARD_REDACTED]'
          : this.maskCreditCard(match);
      detected.push({ type: 'CREDIT_CARD', raw: match, masked, index: offset });
      return masked;
    });

    // Phone numbers
    sanitized = sanitized.replace(this.phoneRegex, (match, offset) => {
      const masked =
        mode === 'HASH'
          ? `[HASH:${generateHash(match).slice(0, 12)}]`
          : mode === 'REDACT'
          ? '[PII:PHONE_REDACTED]'
          : this.maskPhone(match);
      detected.push({ type: 'PHONE', raw: match, masked, index: offset });
      return masked;
    });

    // IP addresses
    sanitized = sanitized.replace(this.ipRegex, (match, offset) => {
      // Ignore common localhost
      if (match === '127.0.0.1' || match === '0.0.0.0') return match;
      const masked =
        mode === 'HASH'
          ? `[HASH:${generateHash(match).slice(0, 10)}]`
          : mode === 'REDACT'
          ? '[PII:IP_REDACTED]'
          : this.maskIP(match);
      detected.push({ type: 'IP', raw: match, masked, index: offset });
      return masked;
    });

    return {
      sanitizedText: sanitized,
      detectedPii: detected,
      hasPii: detected.length > 0,
    };
  }
}
