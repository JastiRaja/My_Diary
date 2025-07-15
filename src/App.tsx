import React, { useState, useEffect } from 'react';
import { User, DiaryEntry, ViewMode } from './types';
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

  const handleSaveEntry = (content: string) => {
    if (!currentEntry || !currentUser) return;

    const updatedEntry = {
      ...currentEntry,
      content,
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
    SecureStorage.saveUserEntries(currentUser.id, updatedEntries, currentUser.secretCode);
    
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

  if (viewMode === 'profiles') {
    return (
      <ProfileSelector
        users={users}
        onSelectUser={handleSelectUser}
        onCreateUser={handleCreateUser}
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
        onLogout={handleLogout}
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