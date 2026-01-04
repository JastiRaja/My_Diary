import React, { useState, useRef } from 'react';
import { Download, Upload, X, CheckCircle, AlertCircle, FileText, Lock, Eye, EyeOff } from 'lucide-react';
import { BackupData } from '../types';
import SimpleEncryption from '../utils/encryption';

interface BackupRestoreProps {
  onExport: () => BackupData;
  onImport: (data: BackupData, mergeMode: 'replace' | 'merge') => { success: boolean; message: string; importedUsers: number; importedEntries: number };
  onClose: () => void;
}

interface EncryptedBackup {
  version: string;
  encrypted: true;
  data: string; // Base64 encrypted data
}

const BackupRestore: React.FC<BackupRestoreProps> = ({ onExport, onImport, onClose }) => {
  const [activeTab, setActiveTab] = useState<'export' | 'import'>('export');
  const [exportData, setExportData] = useState<string>('');
  const [importResult, setImportResult] = useState<{ success: boolean; message: string; importedUsers: number; importedEntries: number } | null>(null);
  const [mergeMode, setMergeMode] = useState<'replace' | 'merge'>('merge');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Password states for export
  const [exportPassword, setExportPassword] = useState('');
  const [exportPasswordConfirm, setExportPasswordConfirm] = useState('');
  const [showExportPassword, setShowExportPassword] = useState(false);
  const [showExportPasswordConfirm, setShowExportPasswordConfirm] = useState(false);
  const [exportPasswordError, setExportPasswordError] = useState('');
  
  // Password state for import
  const [importPassword, setImportPassword] = useState('');
  const [showImportPassword, setShowImportPassword] = useState(false);
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleExport = () => {
    // Validate password
    if (exportPassword.length < 4) {
      setExportPasswordError('Password must be at least 4 characters long');
      return;
    }
    
    if (exportPassword !== exportPasswordConfirm) {
      setExportPasswordError('Passwords do not match');
      return;
    }
    
    setExportPasswordError('');
    
    try {
      const data = onExport();
      
      // Encrypt the backup data
      const jsonString = JSON.stringify(data);
      const encrypted = SimpleEncryption.encrypt(jsonString, exportPassword);
      
      // Create encrypted backup structure
      const encryptedBackup: EncryptedBackup = {
        version: '1.0.0',
        encrypted: true,
        data: encrypted
      };
      
      const backupJsonString = JSON.stringify(encryptedBackup, null, 2);
      setExportData(backupJsonString);
      
      // Create download link
      const blob = new Blob([backupJsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `my-diary-backup-encrypted-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      // Reset password fields
      setExportPassword('');
      setExportPasswordConfirm('');
    } catch (error) {
      console.error('Export failed:', error);
      setExportPasswordError('Failed to export data. Please try again.');
    }
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
          setShowPasswordPrompt(true);
          setImportPassword('');
        } else {
          // Old unencrypted format - try to import directly
          const data: BackupData = parsed;
          
          // Validate backup data
          if (!data.users || !data.entries || !data.version) {
            throw new Error('Invalid backup file format');
          }

          const result = onImport(data, mergeMode);
          setImportResult(result);
          
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

        const result = onImport(data, mergeMode);
        setImportResult(result);
        
        // Close password prompt on success
        if (result.success) {
          setShowPasswordPrompt(false);
          setImportPassword('');
          setSelectedFile(null);
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

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <FileText className="w-6 h-6 mr-2 text-purple-500" />
            Backup & Restore
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex space-x-2 mb-6 border-b border-gray-200">
          <button
            onClick={() => {
              setActiveTab('export');
              setImportResult(null);
            }}
            className={`px-4 py-2 font-semibold transition-colors ${
              activeTab === 'export'
                ? 'text-purple-600 border-b-2 border-purple-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Download className="w-4 h-4 inline mr-2" />
            Export Backup
          </button>
          <button
            onClick={() => {
              setActiveTab('import');
              setImportResult(null);
            }}
            className={`px-4 py-2 font-semibold transition-colors ${
              activeTab === 'import'
                ? 'text-purple-600 border-b-2 border-purple-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Upload className="w-4 h-4 inline mr-2" />
            Import Backup
          </button>
        </div>

        {/* Export Tab */}
        {activeTab === 'export' && (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2">Export Your Data</h3>
              <p className="text-sm text-blue-800">
                Create a backup file containing all your profiles and diary entries. 
                Save this file in a safe place (cloud storage, external drive, etc.) 
                so you can restore your data on a new device.
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-2">What gets exported:</h4>
              <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
                <li>Your profile information</li>
                <li>All your diary entries</li>
                <li>Security questions and answers</li>
                <li>Entry dates and page types</li>
              </ul>
            </div>

            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <div className="flex items-start mb-3">
                <Lock className="w-5 h-5 text-purple-600 mr-2 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-semibold text-purple-900 mb-1">Password Protection</h4>
                  <p className="text-sm text-purple-800">
                    Your backup will be encrypted with a password. You'll need this password to restore your data.
                  </p>
                </div>
              </div>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Backup Password (min. 4 characters)
                  </label>
                  <div className="relative">
                    <input
                      type={showExportPassword ? 'text' : 'password'}
                      value={exportPassword}
                      onChange={(e) => {
                        setExportPassword(e.target.value);
                        setExportPasswordError('');
                      }}
                      placeholder="Enter a strong password"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowExportPassword(!showExportPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showExportPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <input
                      type={showExportPasswordConfirm ? 'text' : 'password'}
                      value={exportPasswordConfirm}
                      onChange={(e) => {
                        setExportPasswordConfirm(e.target.value);
                        setExportPasswordError('');
                      }}
                      placeholder="Confirm your password"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowExportPasswordConfirm(!showExportPasswordConfirm)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showExportPasswordConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
                
                {exportPasswordError && (
                  <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">
                    {exportPasswordError}
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={handleExport}
              className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-lg hover:shadow-lg transform hover:scale-105 transition-all duration-200 flex items-center justify-center"
            >
              <Download className="w-5 h-5 mr-2" />
              Download Encrypted Backup File
            </button>

            {exportData && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-600 mr-2 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-green-900 mb-1">Backup file created successfully!</p>
                    <p className="text-xs text-green-800">
                      File saved as: my-diary-backup-encrypted-{new Date().toISOString().split('T')[0]}.json
                    </p>
                    <p className="text-xs text-green-700 mt-2">
                      ⚠️ Remember your password! You'll need it to restore this backup.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Import Tab */}
        {activeTab === 'import' && (
          <div className="space-y-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h3 className="font-semibold text-yellow-900 mb-2">Import Backup Data</h3>
              <p className="text-sm text-yellow-800">
                Restore your diary data from a previously exported backup file. 
                Choose whether to merge with existing data or replace everything.
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
                      Replace all existing data with imported data. This will delete current data!
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

            <button
              onClick={handleImportClick}
              className="w-full py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold rounded-lg hover:shadow-lg transform hover:scale-105 transition-all duration-200 flex items-center justify-center"
            >
              <Upload className="w-5 h-5 mr-2" />
              Select Backup File to Import
            </button>

            {/* Password Prompt Modal for Encrypted Backups */}
            {showPasswordPrompt && (
              <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-[60]">
                <div className="bg-white rounded-2xl p-6 w-full max-w-md">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-gray-900 flex items-center">
                      <Lock className="w-5 h-5 mr-2 text-purple-500" />
                      Encrypted Backup
                    </h3>
                    <button
                      onClick={() => {
                        setShowPasswordPrompt(false);
                        setImportPassword('');
                        setSelectedFile(null);
                        if (fileInputRef.current) {
                          fileInputRef.current.value = '';
                        }
                      }}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-4">
                    This backup file is encrypted. Please enter the password you used when creating this backup.
                  </p>
                  
                  <div className="mb-4">
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
                          if (e.key === 'Enter') {
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
                  </div>
                  
                  <div className="flex space-x-3">
                    <button
                      onClick={() => {
                        setShowPasswordPrompt(false);
                        setImportPassword('');
                        setSelectedFile(null);
                        if (fileInputRef.current) {
                          fileInputRef.current.value = '';
                        }
                      }}
                      className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleDecryptAndImport}
                      className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-lg hover:shadow-lg transition-all"
                    >
                      Decrypt & Import
                    </button>
                  </div>
                </div>
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
        )}
      </div>
    </div>
  );
};

export default BackupRestore;

