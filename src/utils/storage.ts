import SimpleEncryption from './encryption';
import { User, DiaryEntry, BackupData } from '../types';

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
  static saveUserEntries(userId: string, entries: DiaryEntry[], secretCode: string): {
    success: boolean;
    error?: string;
  } {
    try {
      const userEntries = entries.filter(entry => entry.userId === userId);
      const encrypted = SimpleEncryption.encrypt(JSON.stringify(userEntries), secretCode);
      
      // Check if data is too large
      const estimatedSize = encrypted.length;
      const maxSize = 5 * 1024 * 1024; // 5MB limit per key (localStorage typically has 5-10MB total)
      
      if (estimatedSize > maxSize) {
        return {
          success: false,
          error: `Data too large (${(estimatedSize / 1024 / 1024).toFixed(2)}MB). Please reduce image sizes or remove some entries. Maximum recommended: 4MB per user.`
        };
      }
      
      localStorage.setItem(this.ENTRIES_PREFIX + userId, encrypted);
      return { success: true };
    } catch (error) {
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        // Calculate storage usage
        let totalSize = 0;
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key) {
            const value = localStorage.getItem(key);
            if (value) {
              totalSize += value.length;
            }
          }
        }
        
        return {
          success: false,
          error: `Storage quota exceeded. Current usage: ${(totalSize / 1024 / 1024).toFixed(2)}MB. Please export your data, clear old entries, or compress images.`
        };
      }
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to save entries'
      };
    }
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

  // Delete a user profile and all their data
  static deleteUser(userId: string): boolean {
    try {
      // Remove user's entries
      this.clearUserData(userId);
      
      // Remove user from users list
      const users = this.loadUsers();
      const updatedUsers = users.filter(u => u.id !== userId);
      this.saveUsers(updatedUsers);
      
      return true;
    } catch (error) {
      console.error('Failed to delete user:', error);
      return false;
    }
  }

  // Export all data for backup (unencrypted for portability)
  static exportAllData(): BackupData {
    const users = this.loadUsers();
    const allEntries: DiaryEntry[] = [];
    
    // Collect all entries for all users (requires secret codes, so we'll export what we can)
    // Note: This exports entries that are currently decrypted in memory
    // For full backup, entries should be passed from the app state
    
    return {
      version: '1.0.0',
      exportDate: new Date().toISOString(),
      users: users.map(u => ({
        ...u,
        // Don't export secret codes for security - user will need to re-enter
        secretCode: ''
      })),
      entries: allEntries
    };
  }

  // Export single user data (with entries) - unencrypted for internal use
  static exportUserData(userId: string, secretCode: string, entries: DiaryEntry[]): BackupData {
    const users = this.loadUsers();
    const user = users.find(u => u.id === userId);
    
    if (!user) {
      throw new Error('User not found');
    }

    return {
      version: '1.0.0',
      exportDate: new Date().toISOString(),
      users: [{
        ...user,
        secretCode: secretCode // Include secret code for this user's backup
      }],
      entries: entries.filter(e => e.userId === userId),
      encrypted: false
    };
  }

  // Encrypt backup data with a password
  static encryptBackup(backupData: BackupData, password: string): string {
    const jsonString = JSON.stringify(backupData);
    return SimpleEncryption.encrypt(jsonString, password);
  }

  // Decrypt backup data with a password
  static decryptBackup(encryptedData: string, password: string): BackupData {
    try {
      const decrypted = SimpleEncryption.decrypt(encryptedData, password);
      const backupData: BackupData = JSON.parse(decrypted);
      
      // Validate backup data structure
      if (!backupData.users || !backupData.entries || !backupData.version) {
        throw new Error('Invalid backup file format');
      }
      
      return backupData;
    } catch (error) {
      if (error instanceof Error && error.message === 'Failed to decrypt data') {
        throw new Error('Incorrect password. Please check your backup password and try again.');
      }
      throw new Error('Failed to decrypt backup file. The file may be corrupted or password is incorrect.');
    }
  }

  // Import backup data
  static importBackupData(backupData: BackupData, mergeMode: 'replace' | 'merge' = 'merge'): {
    success: boolean;
    message: string;
    importedUsers: number;
    importedEntries: number;
  } {
    try {
      // Validate backup data structure
      if (!backupData.users || !backupData.entries) {
        throw new Error('Invalid backup file format');
      }

      const existingUsers = this.loadUsers();
      let importedUsers = 0;
      let importedEntries = 0;

      if (mergeMode === 'replace') {
        // Replace all data
        const usersToSave = backupData.users.map(user => ({
          ...user,
          // If secret code is empty in backup, generate a placeholder (user will need to reset)
          secretCode: user.secretCode || 'NEEDS_RESET'
        }));
        this.saveUsers(usersToSave);
        importedUsers = usersToSave.length;

        // Save entries for each user
        backupData.users.forEach(user => {
          if (user.secretCode) {
            const userEntries = backupData.entries.filter(e => e.userId === user.id);
            if (userEntries.length > 0) {
              const saveResult = this.saveUserEntries(user.id, userEntries, user.secretCode);
              if (saveResult.success) {
                importedEntries += userEntries.length;
              } else {
                console.warn(`Failed to save entries for user ${user.id}:`, saveResult.error);
              }
            }
          }
        });
      } else {
        // Merge mode - add new users, update existing ones
        const existingUserIds = new Set(existingUsers.map(u => u.id));
        const newUsers: User[] = [];
        const updatedUsers: User[] = [];
        const preservedUsers: User[] = [];

        backupData.users.forEach(backupUser => {
          if (existingUserIds.has(backupUser.id)) {
            // Update existing user (preserve secret code if backup doesn't have it)
            const existingUser = existingUsers.find(u => u.id === backupUser.id);
            if (existingUser) {
              if (backupUser.secretCode) {
                // Backup has secret code, update user
                updatedUsers.push({
                  ...backupUser,
                  secretCode: backupUser.secretCode
                });
              } else {
                // Backup doesn't have secret code, preserve existing user
                preservedUsers.push(existingUser);
              }
            }
          } else {
            // New user
            newUsers.push({
              ...backupUser,
              secretCode: backupUser.secretCode || 'NEEDS_RESET'
            });
          }
        });

        // Save merged users: preserved existing users + updated users + new users + existing users not in backup
        const existingNotInBackup = existingUsers.filter(
          u => !backupData.users.some(bu => bu.id === u.id)
        );
        
        const allUsers = [
          ...existingNotInBackup,
          ...preservedUsers,
          ...updatedUsers,
          ...newUsers
        ];
        this.saveUsers(allUsers);
        importedUsers = newUsers.length + updatedUsers.length;

        // Save entries for users that have secret codes
        backupData.users.forEach(user => {
          if (user.secretCode) {
            const userEntries = backupData.entries.filter(e => e.userId === user.id);
            if (userEntries.length > 0) {
              // Merge entries - avoid duplicates
              try {
                const existingEntries = this.loadUserEntries(user.id, user.secretCode);
                const existingEntryIds = new Set(existingEntries.map(e => e.id));
                const newEntries = userEntries.filter(e => !existingEntryIds.has(e.id));
                const mergedEntries = [...existingEntries, ...newEntries];
                const saveResult = this.saveUserEntries(user.id, mergedEntries, user.secretCode);
                if (saveResult.success) {
                  importedEntries += newEntries.length;
                } else {
                  console.warn(`Failed to save merged entries for user ${user.id}:`, saveResult.error);
                }
              } catch (error) {
                // If can't load existing entries, just save the backup entries
                const saveResult = this.saveUserEntries(user.id, userEntries, user.secretCode);
                if (saveResult.success) {
                  importedEntries += userEntries.length;
                } else {
                  console.warn(`Failed to save entries for user ${user.id}:`, saveResult.error);
                }
              }
            }
          }
        });
      }

      return {
        success: true,
        message: `Successfully imported ${importedUsers} user(s) and ${importedEntries} entries`,
        importedUsers,
        importedEntries
      };
    } catch (error) {
      console.error('Import failed:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to import backup data',
        importedUsers: 0,
        importedEntries: 0
      };
    }
  }
}

export default SecureStorage;