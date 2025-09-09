// Token management utilities for assignment access tokens

export interface AssignmentToken {
  value: string;
  assignmentId: string;
  testId: string;
  versionId: string;
  issuedAt: string;
  expiresAt?: string;
  isActive: boolean;
  firstUsedAt?: string;
  lastUsedAt?: string;
  usageCount: number;
}

const TOKEN_STORAGE_KEY = 'tn_academy_assignment_tokens';

class TokenManager {
  private tokens: Map<string, AssignmentToken> = new Map();

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(TOKEN_STORAGE_KEY);
      if (stored) {
        const tokenArray: AssignmentToken[] = JSON.parse(stored);
        tokenArray.forEach(token => {
          this.tokens.set(token.value, token);
        });
      }
    } catch (error) {
      console.error('Failed to load tokens from storage:', error);
    }
  }

  private saveToStorage(): void {
    try {
      const tokenArray = Array.from(this.tokens.values());
      localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(tokenArray));
    } catch (error) {
      console.error('Failed to save tokens to storage:', error);
    }
  }

  generateToken(): string {
    // Generate a 8-character alphanumeric token
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  createToken(assignmentId: string, testId: string, versionId: string, expiresInDays?: number): AssignmentToken {
    const tokenValue = this.generateToken();
    const now = new Date().toISOString();
    
    let expiresAt: string | undefined;
    if (expiresInDays && expiresInDays > 0) {
      const expireDate = new Date();
      expireDate.setDate(expireDate.getDate() + expiresInDays);
      expiresAt = expireDate.toISOString();
    }

    const token: AssignmentToken = {
      value: tokenValue,
      assignmentId,
      testId,
      versionId,
      issuedAt: now,
      expiresAt,
      isActive: true,
      usageCount: 0
    };

    this.tokens.set(tokenValue, token);
    this.saveToStorage();
    return token;
  }

  validateToken(tokenValue: string): { isValid: boolean; token?: AssignmentToken; error?: string } {
    const token = this.tokens.get(tokenValue);
    
    if (!token) {
      return { isValid: false, error: '유효하지 않은 토큰입니다.' };
    }

    if (!token.isActive) {
      return { isValid: false, error: '비활성화된 토큰입니다.' };
    }

    if (token.expiresAt && new Date(token.expiresAt) < new Date()) {
      return { isValid: false, error: '만료된 토큰입니다.' };
    }

    return { isValid: true, token };
  }

  useToken(tokenValue: string): boolean {
    const token = this.tokens.get(tokenValue);
    if (!token) return false;

    const now = new Date().toISOString();
    if (!token.firstUsedAt) {
      token.firstUsedAt = now;
    }
    token.lastUsedAt = now;
    token.usageCount += 1;

    this.tokens.set(tokenValue, token);
    this.saveToStorage();
    return true;
  }

  revokeToken(tokenValue: string): boolean {
    const token = this.tokens.get(tokenValue);
    if (!token) return false;

    token.isActive = false;
    this.tokens.set(tokenValue, token);
    this.saveToStorage();
    return true;
  }

  reissueToken(oldTokenValue: string): AssignmentToken | null {
    const oldToken = this.tokens.get(oldTokenValue);
    if (!oldToken) return null;

    // Revoke old token
    this.revokeToken(oldTokenValue);

    // Create new token with same parameters
    const expiresInDays = oldToken.expiresAt ? 
      Math.ceil((new Date(oldToken.expiresAt).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : 
      undefined;

    return this.createToken(oldToken.assignmentId, oldToken.testId, oldToken.versionId, expiresInDays);
  }

  getTokensForAssignment(assignmentId: string): AssignmentToken[] {
    return Array.from(this.tokens.values())
      .filter(token => token.assignmentId === assignmentId)
      .sort((a, b) => new Date(b.issuedAt).getTime() - new Date(a.issuedAt).getTime());
  }

  getAllTokens(): AssignmentToken[] {
    return Array.from(this.tokens.values())
      .sort((a, b) => new Date(b.issuedAt).getTime() - new Date(a.issuedAt).getTime());
  }

  deleteToken(tokenValue: string): boolean {
    const deleted = this.tokens.delete(tokenValue);
    if (deleted) {
      this.saveToStorage();
    }
    return deleted;
  }

  generateShortUrl(tokenValue: string): string {
    return `${window.location.origin}/s/token/${tokenValue}`;
  }

  generateQRCodeData(tokenValue: string): string {
    return this.generateShortUrl(tokenValue);
  }
}

export const tokenManager = new TokenManager();