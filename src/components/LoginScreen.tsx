import React, { useState, useRef } from 'react';
import { User, BackupData } from '../types';
import { ArrowLeft, Eye, EyeOff, HelpCircle, Upload, Lock, X, CheckCircle, AlertCircle } from 'lucide-react';
import SecureStorage from '../utils/storage';
import SimpleEncryption from '../utils/encryption';

interface LoginScreenProps {
  user: User | null;
  onLogin: (secretCode: string) => void;
  onBack: () => void;
  isCreating?: boolean;
  onCreateUser?: (name: string, secretCode: string, securityQuestion: string, securityAnswer: string) => void;
  onPasscodeReset?: (user: User, newSecretCode: string) => void;
  onImport?: (data: BackupData, mergeMode: 'replace' | 'merge') => { success: boolean; message: string; importedUsers: number; importedEntries: number };
  onImportSuccess?: (importedUser: User | null) => void;
}

const SECURITY_QUESTIONS = [
  "What was your favorite teacher's name?",
  "What is your best friend's name?",
  "What is your vehicle number?",
  "What was your favorite subject in school?",
  "What is your hall ticket number?"
];

interface EncryptedBackup {
  version: string;
  encrypted: true;
  data: string;
}

const LoginScreen: React.FC<LoginScreenProps> = ({
  user,
  onLogin,
  onBack,
  isCreating = false,
  onCreateUser,
  onPasscodeReset,
  onImport,
  onImportSuccess
}) => {
  const [secretCode, setSecretCode] = useState('');
  const [userName, setUserName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResetMode, setIsResetMode] = useState(false);
  const [resetUser, setResetUser] = useState<User | null>(null);
  const [newSecretCode, setNewSecretCode] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  
  // Security question fields
  const [selectedQuestion, setSelectedQuestion] = useState(SECURITY_QUESTIONS[0]);
  const [securityAnswer, setSecurityAnswer] = useState('');
  const [showSecurityAnswer, setShowSecurityAnswer] = useState(false);
  
  // Reset flow fields
  const [resetStep, setResetStep] = useState<'name' | 'question' | 'newpasscode'>('name');
  const [foundUser, setFoundUser] = useState<User | null>(null);
  const [userSecurityAnswer, setUserSecurityAnswer] = useState('');

  // Import fields
  const [showImportModal, setShowImportModal] = useState(false);
  const [importPassword, setImportPassword] = useState('');
  const [showImportPassword, setShowImportPassword] = useState(false);
  const [importResult, setImportResult] = useState<{ success: boolean; message: string; importedUsers: number; importedEntries: number } | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isEncryptedBackup, setIsEncryptedBackup] = useState(false);
  const [mergeMode, setMergeMode] = useState<'replace' | 'merge'>('merge');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (isResetMode) {
        console.log('Reset mode, step:', resetStep);
        if (resetStep === 'name') {
          if (!userName.trim()) {
            setError('Please enter your name');
            return;
          }
          
          const foundUser = SecureStorage.findUserByName(userName.trim());
          console.log('Found user:', foundUser);
          if (!foundUser) {
            setError('No profile found with that name');
            return;
          }
          
          setFoundUser(foundUser);
          setResetStep('question');
        } else if (resetStep === 'question') {
          if (!userSecurityAnswer.trim()) {
            setError('Please answer the security question');
            return;
          }
          
          console.log('Verifying security answer for user:', foundUser?.id);
          console.log('User security answer:', foundUser?.securityAnswer);
          console.log('Provided answer:', userSecurityAnswer);
          
          const isValid = SecureStorage.verifySecurityAnswer(foundUser!.id, userSecurityAnswer);
          console.log('Security answer valid:', isValid);
          
          if (!isValid) {
            setError('Incorrect answer to security question');
            return;
          }
          
          setResetStep('newpasscode');
        } else if (resetStep === 'newpasscode') {
          if (newSecretCode.length < 4) {
            setError('New secret code must be at least 4 characters');
            return;
          }
          
          console.log('Resetting passcode for user:', foundUser?.id);
          setResetUser(foundUser);
          onPasscodeReset?.(foundUser!, newSecretCode);
        }
      } else if (isCreating) {
        if (!userName.trim()) {
          setError('Please enter a name');
          return;
        }
        if (secretCode.length < 4) {
          setError('Secret code must be at least 4 characters');
          return;
        }
        if (!securityAnswer.trim()) {
          setError('Please answer the security question');
          return;
        }
        onCreateUser?.(userName.trim(), secretCode, selectedQuestion, securityAnswer.trim());
      } else {
        if (secretCode.length < 4) {
          setError('Please enter your secret code');
          setIsLoading(false);
          return;
        }
        try {
        onLogin(secretCode);
        } catch (err) {
          console.error('Error in handleSubmit:', err);
          setError(err instanceof Error ? err.message : 'Authentication failed');
          setIsLoading(false);
          return;
        }
      }
    } catch (err) {
      console.error('Error in handleSubmit:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetMode = () => {
    setIsResetMode(true);
    setResetStep('name');
    setError('');
    setSecretCode('');
    setUserName('');
    setNewSecretCode('');
    setFoundUser(null);
    setUserSecurityAnswer('');
  };

  const handleBackToLogin = () => {
    setIsResetMode(false);
    setResetStep('name');
    setResetUser(null);
    setFoundUser(null);
    setError('');
    setSecretCode('');
    setUserName('');
    setNewSecretCode('');
    setUserSecurityAnswer('');
  };

  const handleBackInReset = () => {
    if (resetStep === 'question') {
      setResetStep('name');
      setFoundUser(null);
      setUserName('');
    } else if (resetStep === 'newpasscode') {
      setResetStep('question');
      setUserSecurityAnswer('');
    }
    setError('');
  };

  const handleImportClick = () => {
    setShowImportModal(true);
    setImportResult(null);
    setImportPassword('');
    setSelectedFile(null);
    setIsEncryptedBackup(false);
  };

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
          // Not encrypted
          setIsEncryptedBackup(false);
          // Old unencrypted format - try to import directly
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

  if (isResetMode && resetUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <button
            onClick={handleBackToLogin}
            className="mb-8 flex items-center text-white/80 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Login
          </button>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 shadow-2xl border border-white/20">
            <div className="text-center mb-8">
              <div className="mb-6">
                <HelpCircle className="w-20 h-20 mx-auto text-yellow-400" />
              </div>
              <h2 className="text-3xl font-bold text-white mb-2">
                Passcode Reset
              </h2>
              <p className="text-purple-200">
                Your passcode has been reset successfully!
              </p>
              <p className="text-green-200 text-sm mt-2">
                Your diary entries have been preserved and are now secured with your new passcode.
              </p>
            </div>

            <button
              onClick={handleBackToLogin}
              className="w-full py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
            >
              Continue to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  const getTitle = () => {
    if (isResetMode) {
      switch (resetStep) {
        case 'name': return 'Reset Passcode';
        case 'question': return 'Security Question';
        case 'newpasscode': return 'New Passcode';
        default: return 'Reset Passcode';
      }
    }
    return isCreating ? 'Create Profile' : `Welcome${user ? `, ${user.name}` : ''}`;
  };

  const getSubtitle = () => {
    if (isResetMode) {
      switch (resetStep) {
        case 'name': return 'Enter your name to find your profile';
        case 'question': return `Answer: ${foundUser?.securityQuestion}`;
        case 'newpasscode': return 'Create a new secret code';
        default: return '';
      }
    }
    return isCreating ? 'Set up your new profile' : 'Enter your secret code to continue';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <button
          onClick={isResetMode ? handleBackInReset : onBack}
          className="mb-8 flex items-center text-white/80 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          {isResetMode ? 'Back' : 'Back to Profiles'}
        </button>

        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 shadow-2xl border border-white/20">
          <div className="text-center mb-8">
            <div className="mb-6">
              <img 
                src="https://images.pexels.com/photos/1925536/pexels-photo-1925536.jpeg?auto=compress&cs=tinysrgb&w=400" 
                alt="Open diary" 
                className="w-20 h-20 mx-auto rounded-full object-cover shadow-lg"
              />
            </div>
            <h2 className="text-3xl font-bold text-white mb-2">
              {getTitle()}
            </h2>
            <p className="text-purple-200">
              {getSubtitle()}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name field for creation or reset step 1 */}
            {(isCreating || (isResetMode && resetStep === 'name')) && (
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Your Name
                </label>
                <input
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent"
                  placeholder="Enter your name"
                  maxLength={20}
                />
              </div>
            )}

            {/* Security question selection for creation */}
            {isCreating && (
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Security Question
                </label>
                <select
                  value={selectedQuestion}
                  onChange={(e) => setSelectedQuestion(e.target.value)}
                  className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent"
                >
                  {SECURITY_QUESTIONS.map((question, index) => (
                    <option key={index} value={question} className="bg-gray-800 text-white">
                      {question}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Security answer for creation */}
            {isCreating && (
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Security Answer
                </label>
                <div className="relative">
                  <input
                    type={showSecurityAnswer ? 'text' : 'password'}
                    value={securityAnswer}
                    onChange={(e) => setSecurityAnswer(e.target.value)}
                    className="w-full px-4 py-3 pr-12 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent"
                    placeholder="Enter your answer"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSecurityAnswer(!showSecurityAnswer)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/60 hover:text-white"
                  >
                    {showSecurityAnswer ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                <p className="text-xs text-purple-200 mt-1">
                  Remember this answer - you'll need it to reset your passcode
                </p>
              </div>
            )}

            {/* Security answer verification for reset */}
            {isResetMode && resetStep === 'question' && (
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Security Answer
                </label>
                <div className="relative">
                  <input
                    type={showSecurityAnswer ? 'text' : 'password'}
                    value={userSecurityAnswer}
                    onChange={(e) => setUserSecurityAnswer(e.target.value)}
                    className="w-full px-4 py-3 pr-12 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent"
                    placeholder="Enter your answer"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSecurityAnswer(!showSecurityAnswer)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/60 hover:text-white"
                  >
                    {showSecurityAnswer ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            )}

            {/* Secret code field for normal login or creation */}
            {!isResetMode && (
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Secret Code
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={secretCode}
                    onChange={(e) => setSecretCode(e.target.value)}
                    className="w-full px-4 py-3 pr-12 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent"
                    placeholder={isCreating ? 'Create a secret code' : 'Enter your secret code'}
                    minLength={4}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/60 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {isCreating && (
                  <p className="text-xs text-purple-200 mt-1">
                    Remember this code - you'll need it to access your diary
                  </p>
                )}
              </div>
            )}

            {/* New secret code for reset */}
            {isResetMode && resetStep === 'newpasscode' && (
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  New Secret Code
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newSecretCode}
                    onChange={(e) => setNewSecretCode(e.target.value)}
                    className="w-full px-4 py-3 pr-12 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent"
                    placeholder="Create a new secret code"
                    minLength={4}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/60 hover:text-white"
                  >
                    {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                <p className="text-xs text-yellow-200 mt-1">
                  ⚠️ Warning: Resetting your passcode will clear all existing diary entries
                </p>
              </div>
            )}

            {error && (
              <div className="text-red-300 text-sm bg-red-500/20 p-3 rounded-lg">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Please wait...' : 
               isResetMode ? 
                 (resetStep === 'name' ? 'Find Profile' : 
                  resetStep === 'question' ? 'Verify Answer' : 'Reset Passcode') :
               isCreating ? 'Create Profile' : 'Enter My Diary'}
            </button>

            {!isCreating && !isResetMode && (
              <button
                type="button"
                onClick={handleResetMode}
                className="w-full py-2 text-purple-200 hover:text-white text-sm transition-colors"
              >
                Forgot your passcode?
              </button>
            )}

            {isResetMode && resetStep === 'name' && (
              <button
                type="button"
                onClick={handleBackToLogin}
                className="w-full py-2 text-purple-200 hover:text-white text-sm transition-colors"
              >
                Back to login
              </button>
            )}

            {isCreating && (
              <div className="pt-4 border-t border-white/20">
                <p className="text-center text-purple-200 text-sm mb-3">Already have a backup?</p>
                <button
                  type="button"
                  onClick={handleImportClick}
                  className="w-full py-2 flex items-center justify-center space-x-2 text-purple-200 hover:text-white text-sm transition-colors border border-white/30 rounded-lg hover:bg-white/10"
                >
                  <Upload className="w-4 h-4" />
                  <span>Import from Backup</span>
                </button>
              </div>
            )}
          </form>
        </div>
      </div>

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
    </div>
  );
};

export default LoginScreen;