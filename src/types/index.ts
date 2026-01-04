export interface User {
  id: string;
  name: string;
  secretCode: string;
  avatar: string;
  createdAt: string;
  securityQuestion: string;
  securityAnswer: string;
}

export interface DiaryEntry {
  id: string;
  userId: string;
  date: string;
  content: string;
  pageType: 'ruled' | 'plain';
  images?: string[]; // Array of base64 image data URLs
  createdAt: string;
  updatedAt: string;
}

export interface AppState {
  currentUser: User | null;
  users: User[];
  entries: DiaryEntry[];
  isAuthenticated: boolean;
}

export type ViewMode = 'profiles' | 'login' | 'diary' | 'entry';

export interface BackupData {
  version: string;
  exportDate: string;
  users: User[];
  entries: DiaryEntry[];
  encrypted?: boolean; // Flag to indicate if this is an encrypted backup
}