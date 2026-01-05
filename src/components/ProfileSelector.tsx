import React, { useState, useEffect } from 'react';
import { User, BackupData } from '../types';
import { Plus, User as UserIcon, Upload, X, Info, CheckCircle, AlertCircle, Eye, EyeOff, Lock, Trash2, AlertTriangle, Download } from 'lucide-react';
import SimpleEncryption from '../utils/encryption';

interface ProfileSelectorProps {
  users: User[];
  onSelectUser: (user: User) => void;
  onCreateUser: () => void;
  onImport?: (data: BackupData, mergeMode: 'replace' | 'merge') => { success: boolean; message: string; importedUsers: number; importedEntries: number };
  onImportSuccess?: (importedUser: User | null) => void;
}

interface EncryptedBackup {
  version: string;
  encrypted: true;
  data: string;
}

const ProfileSelector: React.FC<ProfileSelectorProps> = ({
  users,
  onSelectUser,
  onCreateUser,
  onImport,
  onImportSuccess
}) => {
  const [hoveredUser, setHoveredUser] = useState<string | null>(null);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importPassword, setImportPassword] = useState('');
  const [showImportPassword, setShowImportPassword] = useState(false);
  const [importResult, setImportResult] = useState<{ success: boolean; message: string; importedUsers: number; importedEntries: number } | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isEncryptedBackup, setIsEncryptedBackup] = useState(false);
  const [mergeMode, setMergeMode] = useState<'replace' | 'merge'>('merge');
  const [showInstallModal, setShowInstallModal] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Show info modal when there are no users (first time user)
  useEffect(() => {
    if (users.length === 0) {
      // Show info modal after a short delay
      const timer = setTimeout(() => {
        setShowInfoModal(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [users.length]);

  const avatarColors = [
    'bg-gradient-to-br from-purple-500 to-pink-500',
    'bg-gradient-to-br from-blue-500 to-cyan-500',
    'bg-gradient-to-br from-green-500 to-emerald-500',
    'bg-gradient-to-br from-orange-500 to-red-500',
    'bg-gradient-to-br from-indigo-500 to-purple-500',
    'bg-gradient-to-br from-teal-500 to-blue-500'
  ];

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const parsed = JSON.parse(content);
        
        // Check if it's an encrypted backup
        if (parsed.encrypted === true && parsed.data) {
          // Encrypted backup - show password prompt
          setIsEncryptedBackup(true);
          setImportPassword('');
        } else {
          // Old unencrypted format - try to import directly
          setIsEncryptedBackup(false);
          const data: BackupData = parsed;
          
          // Validate backup data
          if (!data.users || !data.entries || !data.version) {
            throw new Error('Invalid backup file format');
          }

          if (onImport) {
            const result = onImport(data, mergeMode);
            setImportResult(result);
            
            if (result.success && onImportSuccess) {
              // Find the first imported user and auto-login
              const importedUser = data.users.find(u => u.secretCode);
              if (importedUser) {
                setTimeout(() => {
                  onImportSuccess(importedUser);
                }, 1000);
              } else {
                onImportSuccess(null);
              }
            }
          }
          
          // Reset file input
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
        }
      } catch (error) {
        console.error('Import failed:', error);
        setImportResult({
          success: false,
          message: error instanceof Error ? error.message : 'Failed to parse backup file',
          importedUsers: 0,
          importedEntries: 0
        });
        
        // Reset file input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    };
    reader.readAsText(file);
  };

  const handleDecryptAndImport = () => {
    if (!selectedFile || !importPassword) {
      setImportResult({
        success: false,
        message: 'Please enter the backup password',
        importedUsers: 0,
        importedEntries: 0
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const encryptedBackup: EncryptedBackup = JSON.parse(content);
        
        if (!encryptedBackup.encrypted || !encryptedBackup.data) {
          throw new Error('Invalid encrypted backup format');
        }

        // Decrypt the backup
        const decrypted = SimpleEncryption.decrypt(encryptedBackup.data, importPassword);
        const data: BackupData = JSON.parse(decrypted);
        
        // Validate backup data
        if (!data.users || !data.entries || !data.version) {
          throw new Error('Invalid backup file format');
        }

        if (onImport) {
          const result = onImport(data, mergeMode);
          setImportResult(result);
          
          if (result.success && onImportSuccess) {
            // Find the first imported user with a secret code and auto-login
            const importedUser = data.users.find(u => u.secretCode);
            if (importedUser) {
              setTimeout(() => {
                onImportSuccess(importedUser);
              }, 1000);
            } else {
              onImportSuccess(null);
            }
          }
        }
      } catch (error) {
        console.error('Import failed:', error);
        setImportResult({
          success: false,
          message: error instanceof Error ? error.message : 'Failed to decrypt backup. Incorrect password or corrupted file.',
          importedUsers: 0,
          importedEntries: 0
        });
      }
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    };
    reader.readAsText(selectedFile);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-12">
          <div className="mb-6">
            <img 
              src="https://images.pexels.com/photos/1925536/pexels-photo-1925536.jpeg?auto=compress&cs=tinysrgb&w=400" 
              alt="Diary and pen" 
              className="w-24 h-24 mx-auto rounded-full object-cover shadow-lg"
            />
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
            My Diary
          </h1>
          <p className="text-xl text-purple-200">
            {users.length === 0 ? 'Get started by creating a profile or importing your backup' : 'Choose your profile to continue'}
          </p>
        </div>

        {/* Offline/PWA Info Banner */}
        {!window.matchMedia('(display-mode: standalone)').matches && (window.navigator as any).standalone !== true && (
          <div className="mb-8 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 backdrop-blur-md rounded-2xl p-6 border border-blue-300/30 shadow-lg">
            <div className="flex items-start">
              <Download className="w-6 h-6 text-blue-300 mr-3 mt-1 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="text-xl font-bold text-white mb-2">📱 Install for Offline Use</h3>
                <p className="text-blue-100 mb-3">
                  <strong>Download and install this app</strong> to use it completely offline! No internet connection needed after installation.
                </p>
                <div className="bg-white/10 rounded-lg p-3 mb-3">
                  <p className="text-sm text-blue-50 font-semibold mb-2">✨ Benefits:</p>
                  <ul className="text-xs text-blue-100 space-y-1 list-disc list-inside">
                    <li>Works 100% offline - no internet required</li>
                    <li>Fast access from your home screen/desktop</li>
                    <li>Native app experience</li>
                    <li>All your data stays on your device</li>
                  </ul>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => {
                      // Try to trigger the install prompt
                      const event = new Event('show-install-prompt');
                      window.dispatchEvent(event);
                      
                      // Show manual instructions modal after a short delay
                      setTimeout(() => {
                        setShowInstallModal(true);
                      }, 200);
                    }}
                    className="px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-lg transition-all flex items-center justify-center space-x-2 text-sm font-medium shadow-lg"
                  >
                    <Download className="w-4 h-4" />
                    <span>Install App Now</span>
                  </button>
                  <button
                    onClick={() => setShowInfoModal(true)}
                    className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors text-sm font-medium"
                  >
                    Learn More
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Info Banner for first-time users */}
        {users.length === 0 && (
          <div className="mb-8 bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 shadow-lg">
            <div className="flex items-start">
              <Info className="w-6 h-6 text-yellow-300 mr-3 mt-1 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="text-xl font-bold text-white mb-2">Welcome to My Diary!</h3>
                <p className="text-purple-200 mb-4">
                  This is your first time here. You can either create a new profile or import your existing backup file 
                  if you've used My Diary on another device.
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => setShowInfoModal(true)}
                    className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors text-sm font-medium"
                  >
                    Learn More About Backups
                  </button>
                  {onImport && (
                    <button
                      onClick={() => {
                        setShowImportModal(true);
                        setShowInfoModal(false);
                      }}
                      className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-lg transition-all flex items-center justify-center space-x-2 text-sm font-medium"
                    >
                      <Upload className="w-4 h-4" />
                      <span>Import Backup</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 justify-center">
          {users.map((user, index) => (
            <div
              key={user.id}
              className="flex flex-col items-center transform transition-all duration-300 hover:scale-105 relative group"
              onMouseEnter={() => setHoveredUser(user.id)}
              onMouseLeave={() => setHoveredUser(null)}
            >
              <div 
                className={`
                  w-24 h-24 md:w-32 md:h-32 rounded-full flex items-center justify-center cursor-pointer
                ${avatarColors[index % avatarColors.length]}
                shadow-lg transition-all duration-300
                ${hoveredUser === user.id ? 'shadow-2xl ring-4 ring-white/30' : ''}
                `}
                onClick={() => onSelectUser(user)}
              >
                <UserIcon className="w-12 h-12 md:w-16 md:h-16 text-white" />
              </div>
              <p className="mt-4 text-lg font-semibold text-white text-center">
                {user.name}
              </p>
            </div>
          ))}
          
          {/* Add new user */}
          <div
            className="flex flex-col items-center cursor-pointer transform transition-all duration-300 hover:scale-105"
            onClick={onCreateUser}
            onMouseEnter={() => setHoveredUser('new')}
            onMouseLeave={() => setHoveredUser(null)}
          >
            <div className={`
              w-24 h-24 md:w-32 md:h-32 rounded-full flex items-center justify-center
              bg-white/20 backdrop-blur-sm border-2 border-dashed border-white/40
              shadow-lg transition-all duration-300
              ${hoveredUser === 'new' ? 'shadow-2xl ring-4 ring-white/30 bg-white/30' : ''}
            `}>
              <Plus className="w-12 h-12 md:w-16 md:h-16 text-white" />
            </div>
            <p className="mt-4 text-lg font-semibold text-white text-center">
              Add Profile
            </p>
          </div>
        </div>
      </div>

      {/* Info Modal */}
      {showInfoModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                <Info className="w-6 h-6 mr-2 text-blue-500" />
                About Backup & Restore
              </h2>
              <button
                onClick={() => setShowInfoModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4 text-gray-700">
              <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start mb-3">
                  <Download className="w-5 h-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-blue-900 mb-2">📱 Install for Offline Use</h3>
                    <p className="text-sm text-blue-800 mb-2">
                      <strong>My Diary is a Progressive Web App (PWA)</strong> - you can install it on your device and use it completely offline!
                    </p>
                    <ul className="text-xs text-blue-700 space-y-1 list-disc list-inside ml-2">
                      <li>Works 100% offline - no internet required</li>
                      <li>Install on desktop, Android, or iOS</li>
                      <li>Fast access from home screen/desktop</li>
                      <li>All data stored locally on your device</li>
                    </ul>
                    <p className="text-xs font-semibold text-blue-900 mt-2">
                      💡 Click "Install App" button above or look for install icon in browser address bar
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-2">Why Use Backups?</h3>
                <p className="text-sm text-blue-800">
                  Since all your diary data is stored locally on your device, creating backups ensures you won't lose 
                  your precious memories if you switch devices, clear browser data, or encounter technical issues.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">📤 Export (Creating a Backup)</h3>
                <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside ml-2">
                  <li>All backups are <strong>password-protected</strong> and encrypted</li>
                  <li>Contains all your profiles, diary entries, and settings</li>
                  <li>Save the backup file in cloud storage (Google Drive, Dropbox, etc.)</li>
                  <li>Access this feature from the dashboard after logging in</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">📥 Import (Restoring from Backup)</h3>
                <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside ml-2">
                  <li>Import your backup file to restore all your data</li>
                  <li>Works on any device - transfer your diary between devices easily</li>
                  <li>You'll need the backup password if it's encrypted</li>
                  <li>You can import now or after creating a profile</li>
                </ul>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h3 className="font-semibold text-yellow-900 mb-2">💡 Tips</h3>
                <ul className="text-sm text-yellow-800 space-y-1 list-disc list-inside ml-2">
                  <li>Create regular backups (weekly or monthly)</li>
                  <li>Remember your backup password - you cannot restore without it!</li>
                  <li>Store backups in multiple secure locations</li>
                  <li>Test your backups periodically to ensure they work</li>
                </ul>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  onClick={() => {
                    setShowInfoModal(false);
                    if (onImport) {
                      setShowImportModal(true);
                    }
                  }}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold rounded-lg hover:shadow-lg transition-all"
                >
                  Import Backup Now
                </button>
                <button
                  onClick={() => setShowInfoModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Got It
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900 flex items-center">
                <Upload className="w-6 h-6 mr-2 text-purple-500" />
                Import Backup
              </h3>
              <button
                onClick={() => {
                  setShowImportModal(false);
                  setImportResult(null);
                  setImportPassword('');
                  setSelectedFile(null);
                  setIsEncryptedBackup(false);
                  if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                  }
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  Import your backup file to restore your profile and diary entries. 
                  If you have an encrypted backup, you'll be asked for the password.
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <label className="block font-semibold text-gray-900 mb-3">
                  Import Mode:
                </label>
                <div className="space-y-2">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="mergeMode"
                      value="merge"
                      checked={mergeMode === 'merge'}
                      onChange={() => setMergeMode('merge')}
                      className="mr-2"
                    />
                    <div>
                      <span className="font-medium text-gray-900">Merge</span>
                      <p className="text-sm text-gray-600">
                        Add imported data to existing data. Duplicates will be skipped.
                      </p>
                    </div>
                  </label>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="mergeMode"
                      value="replace"
                      checked={mergeMode === 'replace'}
                      onChange={() => setMergeMode('replace')}
                      className="mr-2"
                    />
                    <div>
                      <span className="font-medium text-gray-900">Replace</span>
                      <p className="text-sm text-gray-600">
                        Replace all existing data with imported data.
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileSelect}
                className="hidden"
              />

              {!selectedFile && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold rounded-lg hover:shadow-lg transform hover:scale-105 transition-all duration-200 flex items-center justify-center"
                >
                  <Upload className="w-5 h-5 mr-2" />
                  Select Backup File
                </button>
              )}

              {selectedFile && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-700 mb-2">
                    <strong>Selected:</strong> {selectedFile.name}
                  </p>
                  {isEncryptedBackup && (
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Backup Password
                      </label>
                      <div className="relative">
                        <input
                          type={showImportPassword ? 'text' : 'password'}
                          value={importPassword}
                          onChange={(e) => setImportPassword(e.target.value)}
                          placeholder="Enter backup password"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 pr-10"
                          autoFocus
                          onKeyPress={(e) => {
                            if (e.key === 'Enter' && importPassword) {
                              handleDecryptAndImport();
                            }
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => setShowImportPassword(!showImportPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                        >
                          {showImportPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                      <button
                        onClick={handleDecryptAndImport}
                        disabled={!importPassword}
                        className="w-full mt-3 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Decrypt & Import
                      </button>
                    </div>
                  )}
                </div>
              )}

              {importResult && (
                <div
                  className={`rounded-lg p-4 ${
                    importResult.success
                      ? 'bg-green-50 border border-green-200'
                      : 'bg-red-50 border border-red-200'
                  }`}
                >
                  <div className="flex items-start">
                    {importResult.success ? (
                      <CheckCircle className="w-5 h-5 text-green-600 mr-2 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-red-600 mr-2 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <p
                        className={`font-semibold ${
                          importResult.success ? 'text-green-900' : 'text-red-900'
                        }`}
                      >
                        {importResult.success ? 'Import Successful!' : 'Import Failed'}
                      </p>
                      <p
                        className={`text-sm mt-1 ${
                          importResult.success ? 'text-green-800' : 'text-red-800'
                        }`}
                      >
                        {importResult.message}
                      </p>
                      {importResult.success && (
                        <p className="text-sm text-green-700 mt-2">
                          Imported {importResult.importedUsers} user(s) and{' '}
                          {importResult.importedEntries} entries.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Install Instructions Modal */}
      {showInstallModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900 flex items-center">
                <Download className="w-6 h-6 mr-2 text-blue-500" />
                Install App for Offline Use
              </h3>
              <button
                onClick={() => setShowInstallModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4 text-gray-700">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800 mb-3">
                  <strong>Install this app</strong> to use it completely offline! No internet connection needed after installation.
                </p>
                <p className="text-xs text-blue-700 font-semibold">
                  ✨ Benefits: Works 100% offline • Fast access • Native app experience • All data stays on your device
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Installation Instructions:</h3>
                <div className="space-y-3">
                  {/* Desktop Chrome/Edge */}
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-sm font-semibold text-gray-900 mb-1">🖥️ Desktop (Chrome/Edge):</p>
                    <ul className="text-xs text-gray-600 space-y-1 list-disc list-inside ml-2">
                      <li>Look for the install icon (➕) in your browser's address bar</li>
                      <li>Or click the menu (⋮) →"cast,save and share" → "Install My Diary" or "Install app"</li>
                      <li>Click "Install" when prompted</li>
                    </ul>
                  </div>

                  {/* Android */}
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-sm font-semibold text-gray-900 mb-1">📱 Android (Chrome):</p>
                    <ul className="text-xs text-gray-600 space-y-1 list-disc list-inside ml-2">
                      <li>Tap the menu button (⋮) in the top right</li>
                      <li>Select "Install app" or "Add to Home screen"</li>
                      <li>Tap "Install" to confirm</li>
                    </ul>
                  </div>

                  {/* iOS */}
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-sm font-semibold text-gray-900 mb-1">🍎 iOS (Safari):</p>
                    <ul className="text-xs text-gray-600 space-y-1 list-disc list-inside ml-2">
                      <li>Tap the Share button (□↑) at the bottom</li>
                      <li>Scroll down and tap "Add to Home Screen"</li>
                      <li>Tap "Add" to confirm</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-xs text-yellow-800">
                  <strong>💡 Note:</strong> If you see an install prompt above, click "Install" there. Otherwise, follow the manual instructions for your device.
                </p>
              </div>

              <div className="flex space-x-3 pt-2">
                <button
                  onClick={() => setShowInstallModal(false)}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold rounded-lg hover:shadow-lg transition-all"
                >
                  Got It
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileSelector;