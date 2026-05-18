export interface UserPublic {
  id: string;
  username: string;
  storageBytes: number;
  tokensInput: number;
  tokensOutput: number;
  createdAt: Date;
}

export interface UserAuthResult {
  user: UserPublic;
  sessionId: string;
  expiresAt: Date;
}

export interface UserAuthService {
  register(username: string, password: string, inviteCode: string): Promise<UserAuthResult>;
  login(username: string, password: string): Promise<UserAuthResult>;
  verifySession(sessionId: string): Promise<UserPublic | null>;
  logout(sessionId: string): Promise<void>;
  getById(userId: string): Promise<UserPublic | null>;
}
