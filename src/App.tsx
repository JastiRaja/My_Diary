import React, { useState, useEffect } from 'react';
import { User, DiaryEntry, ViewMode, BackupData } from './types';
import ProfileSelector from './components/ProfileSelector';
import LoginScreen from './components/LoginScreen';
import DiaryDashboard from './components/DiaryDashboard';
import DiaryEditor from './components/DiaryEditor';
import SecureStorage from './utils/storage';

function App() {
  const [viewMode, setViewMode] = useState<ViewMode>('profiles');
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [currentEntry, setCurrentEntry] = useState<DiaryEntry | null>(null);
  const [isNewEntry, setIsNewEntry] = useState(false);

  // Load users on app start
  useEffect(() => {
    const loadedUsers = SecureStorage.loadUsers();
    setUsers(loadedUsers);
  }, []);

  // Generate unique ID
  const generateId = () => Math.random().toString(36).substr(2, 9);

  const handleSelectUser = (user: User) => {
    setSelectedUser(user);
    setViewMode('login');
  };

  const handleCreateUser = () => {
    setSelectedUser(null);
    setViewMode('login');
  };

  const handleLogin = (secretCode: string) => {
    if (!selectedUser) return;
    
    if (selectedUser.secretCode !== secretCode) {
      throw new Error('Invalid secret code');
    }

    setCurrentUser(selectedUser);
    
    // Load user's entries
    const userEntries = SecureStorage.loadUserEntries(selectedUser.id, secretCode);
    setEntries(userEntries);
    
    setViewMode('diary');
  };

  const handleCreateNewUser = (name: string, secretCode: string, securityQuestion: string, securityAnswer: string) => {
    const newUser: User = {
      id: generateId(),
      name,
      secretCode,
      avatar: '',
      createdAt: new Date().toISOString(),
      securityQuestion,
      securityAnswer
    };

    const updatedUsers = [...users, newUser];
    setUsers(updatedUsers);
    SecureStorage.saveUsers(updatedUsers);
    
    setCurrentUser(newUser);
    setEntries([]);
    setViewMode('diary');
  };

  const handleCreateEntry = (date: string, pageType: 'ruled' | 'plain') => {
    if (!currentUser) return;

    const newEntry: DiaryEntry = {
      id: generateId(),
      userId: currentUser.id,
      date,
      content: '',
      pageType,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setCurrentEntry(newEntry);
    setIsNewEntry(true);
    setViewMode('entry');
  };

  const handleEditEntry = (entry: DiaryEntry) => {
    setCurrentEntry(entry);
    setIsNewEntry(false);
    setViewMode('entry');
  };

  const handleSaveEntry = (content: string, images: string[] = []) => {
    if (!currentEntry || !currentUser) return;

    const updatedEntry = {
      ...currentEntry,
      content,
      images: images.length > 0 ? images : undefined,
      updatedAt: new Date().toISOString()
    };

    let updatedEntries;
    if (isNewEntry) {
      updatedEntries = [...entries, updatedEntry];
    } else {
      updatedEntries = entries.map(e => e.id === updatedEntry.id ? updatedEntry : e);
    }

    setEntries(updatedEntries);
    
    // Save to encrypted storage
    const saveResult = SecureStorage.saveUserEntries(currentUser.id, updatedEntries, currentUser.secretCode);
    
    if (!saveResult.success) {
      // Throw error to be caught by DiaryEditor
      throw new Error(saveResult.error || 'Failed to save entry');
    }
    
    setViewMode('diary');
    setCurrentEntry(null);
    setIsNewEntry(false);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setSelectedUser(null);
    setEntries([]);
    setCurrentEntry(null);
    setViewMode('profiles');
  };

  const handleBackFromLogin = () => {
    setSelectedUser(null);
    setViewMode('profiles');
  };

  const handlePasscodeReset = (user: User, newSecretCode: string) => {
    console.log('App: handlePasscodeReset called for user:', user.id);
    const success = SecureStorage.resetUserPasscode(user.id, newSecretCode);
    console.log('App: resetUserPasscode result:', success);
    
    if (success) {
      // Update the user in the local state
      const updatedUsers = users.map(u => 
        u.id === user.id ? { ...u, secretCode: newSecretCode } : u
      );
      setUsers(updatedUsers);
      
      // Update selectedUser if it's the same user
      if (selectedUser && selectedUser.id === user.id) {
        setSelectedUser({ ...selectedUser, secretCode: newSecretCode });
      }
      
      // Note: Entries are preserved and re-encrypted in storage
      // No need to clear them from state since they'll be reloaded when user logs in
      
      console.log('App: Passcode reset completed successfully');
    } else {
      console.error('App: Passcode reset failed');
    }
  };

  const handleBackFromEntry = () => {
    setCurrentEntry(null);
    setIsNewEntry(false);
    setViewMode('diary');
  };

  const handleDeleteEntry = (entryId: string) => {
    if (!currentUser) return;

    const updatedEntries = entries.filter(e => e.id !== entryId);
    setEntries(updatedEntries);
    
    // Save to encrypted storage
    const saveResult = SecureStorage.saveUserEntries(currentUser.id, updatedEntries, currentUser.secretCode);
    
    if (!saveResult.success) {
      console.error('Failed to delete entry:', saveResult.error);
      // Revert the change if save failed
      setEntries(entries);
      alert('Failed to delete entry. Please try again.');
    }
  };

  const handleExport = (): BackupData => {
    if (!currentUser) {
      throw new Error('No user logged in');
    }
    return SecureStorage.exportUserData(currentUser.id, currentUser.secretCode, entries);
  };

  const handleImport = (data: BackupData, mergeMode: 'replace' | 'merge') => {
    const result = SecureStorage.importBackupData(data, mergeMode);
    
    if (result.success) {
      // Reload users and entries
      const loadedUsers = SecureStorage.loadUsers();
      setUsers(loadedUsers);
      
      // If current user was imported, reload their entries
      if (currentUser) {
        const updatedUser = loadedUsers.find(u => u.id === currentUser.id);
        if (updatedUser) {
          try {
            const userEntries = SecureStorage.loadUserEntries(updatedUser.id, updatedUser.secretCode);
            setEntries(userEntries);
            setCurrentUser(updatedUser);
          } catch (error) {
            console.warn('Could not reload entries after import:', error);
          }
        }
      }
    }
    
    return result;
  };

  const handleImportFromLogin = (importedUser: User | null) => {
    if (importedUser && importedUser.secretCode) {
      // Auto-login the imported user
      setCurrentUser(importedUser);
      setSelectedUser(importedUser);
      
      // Load user's entries
      try {
        const userEntries = SecureStorage.loadUserEntries(importedUser.id, importedUser.secretCode);
        setEntries(userEntries);
        setViewMode('diary');
      } catch (error) {
        console.warn('Could not load entries for imported user:', error);
        setEntries([]);
        setViewMode('diary');
      }
    } else {
      // Import successful but no user to auto-login, go back to profiles
      const loadedUsers = SecureStorage.loadUsers();
      setUsers(loadedUsers);
      setViewMode('profiles');
    }
  };

  const handleDeleteUser = (userId: string) => {
    const success = SecureStorage.deleteUser(userId);
    
    if (success) {
      // Reload users
      const loadedUsers = SecureStorage.loadUsers();
      setUsers(loadedUsers);
      
      // If deleted user was current user, logout
      if (currentUser && currentUser.id === userId) {
        handleLogout();
      }
      
      // If deleted user was selected user, clear selection
      if (selectedUser && selectedUser.id === userId) {
        setSelectedUser(null);
      }
    } else {
      alert('Failed to delete profile. Please try again.');
    }
  };

  if (viewMode === 'profiles') {
    return (
      <ProfileSelector
        users={users}
        onSelectUser={handleSelectUser}
        onCreateUser={handleCreateUser}
        onImport={handleImport}
        onImportSuccess={handleImportFromLogin}
      />
    );
  }

  if (viewMode === 'login') {
    return (
      <LoginScreen
        user={selectedUser}
        onLogin={handleLogin}
        onBack={handleBackFromLogin}
        isCreating={!selectedUser}
        onCreateUser={handleCreateNewUser}
        onPasscodeReset={handlePasscodeReset}
        onImport={handleImport}
        onImportSuccess={handleImportFromLogin}
      />
    );
  }

  if (viewMode === 'diary' && currentUser) {
    return (
      <DiaryDashboard
        user={currentUser}
        entries={entries}
        onCreateEntry={handleCreateEntry}
        onEditEntry={handleEditEntry}
        onDeleteEntry={handleDeleteEntry}
        onLogout={handleLogout}
        onDeleteProfile={handleDeleteUser}
        onExport={handleExport}
        onImport={handleImport}
      />
    );
  }

  if (viewMode === 'entry' && currentEntry) {
    return (
      <DiaryEditor
        entry={currentEntry}
        onSave={handleSaveEntry}
        onBack={handleBackFromEntry}
        isNew={isNewEntry}
      />
    );
  }

  return null;
}

export default App;