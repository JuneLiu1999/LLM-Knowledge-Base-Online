export interface UserWithUsage {
  id: string;
  username: string;
  invitedByCode: string | null;
  storageBytes: number;
  tokensInput: number;
  tokensOutput: number;
  clipCount: number;
  topicCount: number;
  createdAt: Date;
}

export interface DashboardStats {
  totalUsers: number;
  totalAdmins: number;
  totalClips: number;
  totalTopics: number;
  totalStorageBytes: number;
  totalTokensInput: number;
  totalTokensOutput: number;
  totalInviteCodes: number;
  unusedInviteCodes: number;
}

export interface AdminService {
  listUsers(): Promise<UserWithUsage[]>;
  getDashboardStats(): Promise<DashboardStats>;
}
