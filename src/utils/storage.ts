import SimpleEncryption from './encryption';
import { User, DiaryEntry } from '../types';

class SecureStorage {
  private static readonly USERS_KEY = 'diary_users';
  private static readonly ENTRIES_PREFIX = 'diary_entries_';
  
  // Save users list (encrypted with a master key)
  static saveUsers(users: User[]): void {
    const masterKey = 'MyDiaryApp2024';
    const encrypted = SimpleEncryption.encrypt(JSON.stringify(users), masterKey);
    localStorage.setItem(this.USERS_KEY, encrypted);
  }
  
  // Load users list
  static loadUsers(): User[] {
    try {
      const masterKey = 'MyDiaryApp2024';
      const encrypted = localStorage.getItem(this.USERS_KEY);
      if (!encrypted) return [];
      
      const decrypted = SimpleEncryption.decrypt(encrypted, masterKey);
      return JSON.parse(decrypted);
    } catch (error) {
      console.warn('Failed to load users:', error);
      return [];
    }
  }

  // Find user by name (for passcode reset)
  static findUserByName(name: string): User | null {
    const users = this.loadUsers();
    console.log('Storage: findUserByName called with:', name);
    console.log('Storage: all users:', users);
    const foundUser = users.find(user => user.name.toLowerCase() === name.toLowerCase());
    console.log('Storage: found user:', foundUser);
    return foundUser || null;
  }

  // Verify security answer for passcode reset
  static verifySecurityAnswer(userId: string, securityAnswer: string): boolean {
    try {
      const users = this.loadUsers();
      const user = users.find(user => user.id === userId);
      console.log('Storage: verifySecurityAnswer called for user:', userId);
      console.log('Storage: user found:', user);
      console.log('Storage: stored answer:', user?.securityAnswer);
      console.log('Storage: provided answer:', securityAnswer);
      
      if (!user) return false;
      
      // Case-insensitive comparison for security answer
      const isValid = user.securityAnswer.toLowerCase().trim() === securityAnswer.toLowerCase().trim();
      console.log('Storage: answer valid:', isValid);
      return isValid;
    } catch (error) {
      console.error('Failed to verify security answer:', error);
      return false;
    }
  }

  // Reset user's passcode
  static resetUserPasscode(userId: string, newSecretCode: string): boolean {
    try {
      console.log('Storage: resetUserPasscode called for user:', userId);
      const users = this.loadUsers();
      const userIndex = users.findIndex(user => user.id === userId);
      
      if (userIndex === -1) {
        console.error('Storage: User not found for reset');
        return false;
      }
      
      // Store the old passcode before updating
      const oldSecretCode = users[userIndex].secretCode;
      
      // Update the user's secret code
      users[userIndex].secretCode = newSecretCode;
      this.saveUsers(users);
      
      // Re-encrypt existing entries with new passcode using the old passcode
      this.reEncryptUserEntries(userId, oldSecretCode, newSecretCode);
      
      console.log('Storage: Passcode reset successful');
      return true;
    } catch (error) {
      console.error('Failed to reset passcode:', error);
      return false;
    }
  }

  // Re-encrypt user entries with new passcode
  private static reEncryptUserEntries(userId: string, oldSecretCode: string, newSecretCode: string): void {
    try {
      const encrypted = localStorage.getItem(this.ENTRIES_PREFIX + userId);
      if (!encrypted) {
        console.log('No existing entries to re-encrypt');
        return;
      }
      
      // Try to decrypt with the old passcode
      try {
        const decrypted = SimpleEncryption.decrypt(encrypted, oldSecretCode);
        const entries = JSON.parse(decrypted);
        
        // Re-encrypt with new passcode
        const newEncrypted = SimpleEncryption.encrypt(JSON.stringify(entries), newSecretCode);
        localStorage.setItem(this.ENTRIES_PREFIX + userId, newEncrypted);
        
        console.log('Successfully re-encrypted entries with new passcode');
      } catch (decryptError) {
        console.warn('Could not decrypt with old passcode, entries may be lost');
        // Clear the old encrypted data since we can't decrypt it
        localStorage.removeItem(this.ENTRIES_PREFIX + userId);
      }
    } catch (error) {
      console.warn('Could not re-encrypt entries, clearing old data:', error);
      localStorage.removeItem(this.ENTRIES_PREFIX + userId);
    }
  }
  
  // Save user entries (encrypted with user's secret code)
  static saveUserEntries(userId: string, entries: DiaryEntry[], secretCode: string): void {
    const userEntries = entries.filter(entry => entry.userId === userId);
    const encrypted = SimpleEncryption.encrypt(JSON.stringify(userEntries), secretCode);
    localStorage.setItem(this.ENTRIES_PREFIX + userId, encrypted);
  }
  
  // Load user entries
  static loadUserEntries(userId: string, secretCode: string): DiaryEntry[] {
    try {
      const encrypted = localStorage.getItem(this.ENTRIES_PREFIX + userId);
      if (!encrypted) return [];
      
      const decrypted = SimpleEncryption.decrypt(encrypted, secretCode);
      return JSON.parse(decrypted);
    } catch (error) {
      console.warn('Failed to load entries for user:', userId, error);
      return [];
    }
  }
  
  // Clear all data for a user
  static clearUserData(userId: string): void {
    localStorage.removeItem(this.ENTRIES_PREFIX + userId);
  }
}

export default SecureStorage;