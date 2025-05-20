export interface Session {
  id: string;
  code: string;
  status: string;
  photoCount?: number;
  createdAt: Date;
  updatedAt: Date;
  usedAt?: Date | null;
}
