export interface AdminPublic {
  id: string;
  username: string;
  createdAt: Date;
}

export interface AdminAuthResult {
  admin: AdminPublic;
  sessionId: string;
  expiresAt: Date;
}

export interface AdminAuthService {
  login(username: string, password: string): Promise<AdminAuthResult>;
  verifySession(sessionId: string): Promise<AdminPublic | null>;
  logout(sessionId: string): Promise<void>;
  createAdmin(username: string, password: string): Promise<AdminPublic>;
  count(): Promise<number>;
}
