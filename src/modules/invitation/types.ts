export interface InviteCodeRecord {
  code: string;
  createdBy: string;
  usedBy: string | null;
  createdAt: Date;
  usedAt: Date | null;
  expiresAt: Date | null;
}

export interface InviteCodeWithUser extends InviteCodeRecord {
  createdByUsername: string;
  usedByUsername: string | null;
}

export interface InvitationService {
  generate(adminId: string, count?: number, expiresInDays?: number): Promise<InviteCodeRecord[]>;
  list(includeUsed?: boolean): Promise<InviteCodeWithUser[]>;
  revoke(code: string): Promise<void>;
}
