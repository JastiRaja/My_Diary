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

export type PaperStyle = 'blank' | 'ruled' | 'grid' | 'dots' | 'vintage' | 'dark';

export interface Artwork {
  id: string;
  userId: string;
  title: string;
  imageData: string; // base64 image data URL
  paperStyle: PaperStyle;
  createdAt: string;
  updatedAt: string;
}

export interface AppState {
  currentUser: User | null;
  users: User[];
  entries: DiaryEntry[];
  artworks: Artwork[];
  isAuthenticated: boolean;
}

export type ViewMode = 'profiles' | 'login' | 'diary' | 'entry';

export interface BackupData {
  version: string;
  exportDate: string;
  users: User[];
  entries: DiaryEntry[];
  artworks?: Artwork[];
  encrypted?: boolean; // Flag to indicate if this is an encrypted backup
}

export interface ActiveSession {
  userId: string;
  secretCode: string;
  viewMode: ViewMode;
  currentEntryId?: string | null;
  isNewEntry?: boolean;
  lastActiveTime: number;
}

export interface ArtworkDraft {
  userId: string;
  artworkId?: string;
  title: string;
  paperStyle: PaperStyle;
  imageData: string;
  isOpen: boolean;
  source: 'dashboard' | 'editor';
}

export interface EntryDraft {
  userId: string;
  entryId?: string;
  isNewEntry: boolean;
  date: string;
  content: string;
  images: string[];
  pageType: 'ruled' | 'plain';
}