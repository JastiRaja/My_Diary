import React, { useState, useEffect } from 'react';
import { User, DiaryEntry, Artwork, PaperStyle, ViewMode, BackupData } from './types';
import ProfileSelector from './components/ProfileSelector';
import LoginScreen from './components/LoginScreen';
import DiaryDashboard from './components/DiaryDashboard';
import DiaryEditor from './components/DiaryEditor';
import InstallPrompt from './components/InstallPrompt';
import SecureStorage from './utils/storage';

function App() {
  const [viewMode, setViewMode] = useState<ViewMode>('profiles');
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [currentEntry, setCurrentEntry] = useState<DiaryEntry | null>(null);
  const [isNewEntry, setIsNewEntry] = useState(false);

  // Load users and restore session on app start
  useEffect(() => {
    const loadedUsers = SecureStorage.loadUsers();
    setUsers(loadedUsers);

    // Restore active session across page refresh
    const session = SecureStorage.getActiveSession();
    if (session && session.userId && session.secretCode) {
      const user = loadedUsers.find(u => u.id === session.userId);
      if (user && user.secretCode === session.secretCode) {
        setCurrentUser(user);
        setSelectedUser(user);

        try {
          const userEntries = SecureStorage.loadUserEntries(user.id, user.secretCode);
          setEntries(userEntries);
          const userArtworks = SecureStorage.loadUserArtworks(user.id, user.secretCode);
          setArtworks(userArtworks);

          if (session.viewMode === 'entry' && session.currentEntryId) {
            const existingEntry = userEntries.find(e => e.id === session.currentEntryId);
            if (existingEntry) {
              setCurrentEntry(existingEntry);
              setIsNewEntry(!!session.isNewEntry);
              setViewMode('entry');
            } else if (session.isNewEntry) {
              const draft = SecureStorage.getEntryDraft(user.id);
              const newEntry: DiaryEntry = {
                id: session.currentEntryId,
                userId: user.id,
                date: draft?.date || new Date().toISOString().split('T')[0],
                content: draft?.content || '',
                images: draft?.images,
                pageType: draft?.pageType || 'ruled',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
              };
              setCurrentEntry(newEntry);
              setIsNewEntry(true);
              setViewMode('entry');
            } else {
              setViewMode('diary');
            }
          } else {
            setViewMode('diary');
          }
        } catch (error) {
          console.warn('Failed to restore session data:', error);
          setViewMode('diary');
        }
      } else {
        SecureStorage.clearActiveSession();
      }
    }
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
    
    // Load user's entries and artworks
    const userEntries = SecureStorage.loadUserEntries(selectedUser.id, secretCode);
    setEntries(userEntries);
    const userArtworks = SecureStorage.loadUserArtworks(selectedUser.id, secretCode);
    setArtworks(userArtworks);
    
    setViewMode('diary');

    // Save active session so refresh keeps user logged in
    SecureStorage.saveActiveSession({
      userId: selectedUser.id,
      secretCode,
      viewMode: 'diary',
      lastActiveTime: Date.now()
    });
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
    setArtworks([]);
    setViewMode('diary');

    // Save active session
    SecureStorage.saveActiveSession({
      userId: newUser.id,
      secretCode,
      viewMode: 'diary',
      lastActiveTime: Date.now()
    });
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

    SecureStorage.saveActiveSession({
      userId: currentUser.id,
      secretCode: currentUser.secretCode,
      viewMode: 'entry',
      currentEntryId: newEntry.id,
      isNewEntry: true,
      lastActiveTime: Date.now()
    });
  };

  const handleEditEntry = (entry: DiaryEntry) => {
    if (!currentUser) return;
    setCurrentEntry(entry);
    setIsNewEntry(false);
    setViewMode('entry');

    SecureStorage.saveActiveSession({
      userId: currentUser.id,
      secretCode: currentUser.secretCode,
      viewMode: 'entry',
      currentEntryId: entry.id,
      isNewEntry: false,
      lastActiveTime: Date.now()
    });
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

    SecureStorage.clearEntryDraft(currentUser.id);
    SecureStorage.saveActiveSession({
      userId: currentUser.id,
      secretCode: currentUser.secretCode,
      viewMode: 'diary',
      lastActiveTime: Date.now()
    });
  };

  const handleLogout = () => {
    if (currentUser) {
      SecureStorage.clearArtworkDraft(currentUser.id);
      SecureStorage.clearEntryDraft(currentUser.id);
    }
    SecureStorage.clearActiveSession();
    setCurrentUser(null);
    setSelectedUser(null);
    setEntries([]);
    setArtworks([]);
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
    if (currentUser) {
      SecureStorage.clearEntryDraft(currentUser.id);
      SecureStorage.saveActiveSession({
        userId: currentUser.id,
        secretCode: currentUser.secretCode,
        viewMode: 'diary',
        lastActiveTime: Date.now()
      });
    }
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

  const handleSaveArtwork = (artworkData: { id?: string; title: string; imageData: string; paperStyle: PaperStyle }) => {
    if (!currentUser) return;

    let updatedArtworks: Artwork[];
    if (artworkData.id) {
      // Update existing artwork
      updatedArtworks = artworks.map(a =>
        a.id === artworkData.id
          ? {
              ...a,
              title: artworkData.title,
              imageData: artworkData.imageData,
              paperStyle: artworkData.paperStyle,
              updatedAt: new Date().toISOString()
            }
          : a
      );
    } else {
      // Create new artwork
      const newArtwork: Artwork = {
        id: generateId(),
        userId: currentUser.id,
        title: artworkData.title,
        imageData: artworkData.imageData,
        paperStyle: artworkData.paperStyle,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      updatedArtworks = [newArtwork, ...artworks];
    }

    setArtworks(updatedArtworks);

    const saveResult = SecureStorage.saveUserArtworks(currentUser.id, updatedArtworks, currentUser.secretCode);
    if (!saveResult.success) {
      console.error('Failed to save artwork:', saveResult.error);
      alert(saveResult.error || 'Failed to save artwork');
    }
  };

  const handleDuplicateArtwork = (artwork: Artwork) => {
    if (!currentUser) return;

    const duplicated: Artwork = {
      ...artwork,
      id: generateId(),
      title: `${artwork.title} (Copy)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const updatedArtworks = [duplicated, ...artworks];
    setArtworks(updatedArtworks);
    SecureStorage.saveUserArtworks(currentUser.id, updatedArtworks, currentUser.secretCode);
  };

  const handleAttachArtworkToDate = (artworkImageData: string, targetDate: string = new Date().toISOString().split('T')[0]): { success: boolean; message: string } => {
    if (!currentUser) return { success: false, message: 'No user logged in' };

    const existingEntryIndex = entries.findIndex(e => e.date === targetDate);
    let updatedEntries: DiaryEntry[];

    if (existingEntryIndex >= 0) {
      const entry = entries[existingEntryIndex];
      const currentImages = entry.images || [];
      if (currentImages.length >= 5) {
        return { success: false, message: `The diary entry for ${targetDate} already has 5 images/drawings (maximum allowed).` };
      }
      const updatedEntry: DiaryEntry = {
        ...entry,
        images: [...currentImages, artworkImageData],
        updatedAt: new Date().toISOString()
      };
      updatedEntries = entries.map((e, idx) => idx === existingEntryIndex ? updatedEntry : e);
    } else {
      const newEntry: DiaryEntry = {
        id: generateId(),
        userId: currentUser.id,
        date: targetDate,
        content: '',
        pageType: 'ruled',
        images: [artworkImageData],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      updatedEntries = [...entries, newEntry];
    }

    setEntries(updatedEntries);
    const saveResult = SecureStorage.saveUserEntries(currentUser.id, updatedEntries, currentUser.secretCode);
    if (!saveResult.success) {
      return { success: false, message: saveResult.error || 'Failed to save to diary entry' };
    }

    return { success: true, message: `Successfully attached artwork to diary entry for ${targetDate}!` };
  };

  const handleDeleteArtwork = (artworkId: string) => {
    if (!currentUser) return;

    const updatedArtworks = artworks.filter(a => a.id !== artworkId);
    setArtworks(updatedArtworks);

    const saveResult = SecureStorage.saveUserArtworks(currentUser.id, updatedArtworks, currentUser.secretCode);
    if (!saveResult.success) {
      console.error('Failed to delete artwork:', saveResult.error);
      setArtworks(artworks);
      alert('Failed to delete artwork. Please try again.');
    }
  };

  const handleExport = (): BackupData => {
    if (!currentUser) {
      throw new Error('No user logged in');
    }
    return SecureStorage.exportUserData(currentUser.id, currentUser.secretCode, entries, artworks);
  };

  const handleImport = (data: BackupData, mergeMode: 'replace' | 'merge') => {
    const result = SecureStorage.importBackupData(data, mergeMode);
    
    if (result.success) {
      // Reload users and entries
      const loadedUsers = SecureStorage.loadUsers();
      setUsers(loadedUsers);
      
      // If current user was imported, reload their entries and artworks
      if (currentUser) {
        const updatedUser = loadedUsers.find(u => u.id === currentUser.id);
        if (updatedUser) {
          try {
            const userEntries = SecureStorage.loadUserEntries(updatedUser.id, updatedUser.secretCode);
            setEntries(userEntries);
            const userArtworks = SecureStorage.loadUserArtworks(updatedUser.id, updatedUser.secretCode);
            setArtworks(userArtworks);
            setCurrentUser(updatedUser);
          } catch (error) {
            console.warn('Could not reload data after import:', error);
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
      
      // Load user's entries and artworks
      try {
        const userEntries = SecureStorage.loadUserEntries(importedUser.id, importedUser.secretCode);
        setEntries(userEntries);
        const userArtworks = SecureStorage.loadUserArtworks(importedUser.id, importedUser.secretCode);
        setArtworks(userArtworks);
        setViewMode('diary');

        SecureStorage.saveActiveSession({
          userId: importedUser.id,
          secretCode: importedUser.secretCode,
          viewMode: 'diary',
          lastActiveTime: Date.now()
        });
      } catch (error) {
        console.warn('Could not load data for imported user:', error);
        setEntries([]);
        setArtworks([]);
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

  return (
    <>
      {viewMode === 'profiles' && (
        <>
          <ProfileSelector
            users={users}
            onSelectUser={handleSelectUser}
            onCreateUser={handleCreateUser}
            onImport={handleImport}
            onImportSuccess={handleImportFromLogin}
          />
          <InstallPrompt />
        </>
      )}

      {viewMode === 'login' && (
        <>
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
          <InstallPrompt />
        </>
      )}

      {viewMode === 'diary' && currentUser && (
        <>
          <DiaryDashboard
            user={currentUser}
            entries={entries}
            artworks={artworks}
            onCreateEntry={handleCreateEntry}
            onEditEntry={handleEditEntry}
            onDeleteEntry={handleDeleteEntry}
            onLogout={handleLogout}
            onDeleteProfile={handleDeleteUser}
            onExport={handleExport}
            onImport={handleImport}
            onSaveArtwork={handleSaveArtwork}
            onDeleteArtwork={handleDeleteArtwork}
            onDuplicateArtwork={handleDuplicateArtwork}
            onAttachArtworkToDate={handleAttachArtworkToDate}
          />
          <InstallPrompt />
        </>
      )}

      {viewMode === 'entry' && currentEntry && (
        <>
          <DiaryEditor
            entry={currentEntry}
            onSave={handleSaveEntry}
            onBack={handleBackFromEntry}
            isNew={isNewEntry}
            onSaveArtwork={handleSaveArtwork}
          />
          <InstallPrompt />
        </>
      )}
    </>
  );
}

export default App;