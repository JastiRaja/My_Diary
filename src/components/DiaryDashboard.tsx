import React, { useState } from 'react';
import { User, DiaryEntry } from '../types';
import { Calendar, Plus, User as UserIcon, LogOut, FileText, Edit3, Database, Image as ImageIcon, Trash2, AlertTriangle, Settings, Download } from 'lucide-react';
import BackupRestore from './BackupRestore';
import InstallPrompt from './InstallPrompt';

interface DiaryDashboardProps {
  user: User;
  entries: DiaryEntry[];
  onCreateEntry: (date: string, pageType: 'ruled' | 'plain') => void;
  onEditEntry: (entry: DiaryEntry) => void;
  onDeleteEntry: (entryId: string) => void;
  onLogout: () => void;
  onDeleteProfile?: (userId: string) => void;
  onExport: () => { version: string; exportDate: string; users: User[]; entries: DiaryEntry[] };
  onImport: (data: { version: string; exportDate: string; users: User[]; entries: DiaryEntry[] }, mergeMode: 'replace' | 'merge') => { success: boolean; message: string; importedUsers: number; importedEntries: number };
}

const DiaryDashboard: React.FC<DiaryDashboardProps> = ({
  user,
  entries,
  onCreateEntry,
  onEditEntry,
  onDeleteEntry,
  onLogout,
  onDeleteProfile,
  onExport,
  onImport
}) => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showPageTypeModal, setShowPageTypeModal] = useState(false);
  const [showBackupModal, setShowBackupModal] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState<DiaryEntry | null>(null);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [showDeleteProfileModal, setShowDeleteProfileModal] = useState(false);

  const todayEntries = entries.filter(entry => entry.date === selectedDate);
  const recentEntries = entries
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  const handleNewEntry = (pageType: 'ruled' | 'plain') => {
    onCreateEntry(selectedDate, pageType);
    setShowPageTypeModal(false);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
              <UserIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">My Diary</h1>
              <p className="text-gray-600">Welcome back, {user.name}</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowBackupModal(true)}
              className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
              title="Backup & Restore"
            >
              <Database className="w-5 h-5" />
              <span className="hidden md:inline">Backup</span>
            </button>
            <div className="relative">
              <button
                onClick={() => setShowSettingsMenu(!showSettingsMenu)}
                className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
                title="Settings"
              >
                <Settings className="w-5 h-5" />
              </button>
              {showSettingsMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                  <button
                    onClick={() => {
                      setShowSettingsMenu(false);
                      // Trigger install prompt if available
                      const event = new Event('show-install-prompt');
                      window.dispatchEvent(event);
                      
                      // Show instructions if prompt not available
                      setTimeout(() => {
                        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
                        const isAndroid = /Android/.test(navigator.userAgent);
                        let message = '';
                        
                        if (isIOS) {
                          message = 'Tap the Share button (□↑) → "Add to Home Screen"';
                        } else if (isAndroid) {
                          message = 'Tap menu (⋮) → "Install app" or "Add to Home screen"';
                        } else {
                          message = 'Look for the install icon (➕) in your browser\'s address bar, or use browser menu → "Install"';
                        }
                        
                        alert(`Install Instructions:\n\n${message}\n\nAfter installation, the app will work completely offline!`);
                      }, 100);
                    }}
                    className="w-full text-left px-4 py-2 text-purple-600 hover:bg-purple-50 transition-colors flex items-center space-x-2"
                  >
                    <Download className="w-4 h-4" />
                    <span>Install App</span>
                  </button>
                  {onDeleteProfile && (
                    <button
                      onClick={() => {
                        setShowSettingsMenu(false);
                        setShowDeleteProfileModal(true);
                      }}
                      className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 transition-colors flex items-center space-x-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Delete Profile</span>
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setShowSettingsMenu(false);
                      onLogout();
                    }}
                    className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors flex items-center space-x-2"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Logout</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Offline Use Notice */}
        {!window.matchMedia('(display-mode: standalone)').matches && (window.navigator as any).standalone !== true && (
          <div className="mb-6 bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-xl p-4 shadow-sm">
            <div className="flex items-start">
              <Download className="w-5 h-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-blue-900 mb-1">
                      💡 Install for Offline Use
                    </h3>
                    <p className="text-xs text-blue-700">
                      Install this app to use it completely offline. No internet connection needed after installation!
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      // Try to trigger the install prompt
                      const event = new Event('show-install-prompt');
                      window.dispatchEvent(event);
                      
                      // Show instructions if prompt not available
                      setTimeout(() => {
                        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
                        const isAndroid = /Android/.test(navigator.userAgent);
                        let message = '';
                        
                        if (isIOS) {
                          message = 'Tap the Share button (□↑) → "Add to Home Screen"';
                        } else if (isAndroid) {
                          message = 'Tap menu (⋮) → "Install app" or "Add to Home screen"';
                        } else {
                          message = 'Look for the install icon (➕) in your browser\'s address bar, or use browser menu → "Install"';
                        }
                        
                        alert(`Install Instructions:\n\n${message}\n\nAfter installation, the app will work completely offline!`);
                      }, 200);
                    }}
                    className="ml-4 px-3 py-1.5 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white text-xs font-semibold rounded-lg transition-all shadow-sm"
                  >
                    Install
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Date Selector */}
            <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                  <Calendar className="w-5 h-5 mr-2 text-purple-500" />
                  Select Date
                </h2>
              </div>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              <p className="mt-2 text-sm text-gray-600">
                {formatDate(selectedDate)}
              </p>
            </div>

            {/* Today's Entries */}
            <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">
                  Entries for {new Date(selectedDate).toLocaleDateString()}
                </h2>
                <button
                  onClick={() => setShowPageTypeModal(true)}
                  className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:shadow-lg transform hover:scale-105 transition-all duration-200"
                >
                  <Plus className="w-4 h-4" />
                  <span>New Entry</span>
                </button>
              </div>

              {todayEntries.length === 0 ? (
                <div className="text-center py-12">
                  <div className="mb-4">
                    <img 
                      src="https://images.pexels.com/photos/261763/pexels-photo-261763.jpeg?auto=compress&cs=tinysrgb&w=400" 
                      alt="Empty notebook" 
                      className="w-24 h-24 mx-auto rounded-lg object-cover opacity-60"
                    />
                  </div>
                  <p className="text-gray-500">No entries for this date</p>
                  <p className="text-sm text-gray-400 mt-2">Create your first entry to get started</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {todayEntries.map((entry) => (
                    <div
                      key={entry.id}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow relative group"
                    >
                      <div 
                        className="cursor-pointer"
                      onClick={() => onEditEntry(entry)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-500 capitalize">
                          {entry.pageType} page
                        </span>
                          <div className="flex items-center space-x-2">
                        <Edit3 className="w-4 h-4 text-gray-400" />
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setEntryToDelete(entry);
                              }}
                              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-50 rounded text-red-500 hover:text-red-600"
                              title="Delete entry"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      {entry.images && entry.images.length > 0 && (
                        <div className="mb-2">
                          <img
                            src={entry.images[0]}
                            alt="Entry preview"
                            className="w-full h-32 object-cover rounded-lg border border-gray-200"
                          />
                          {entry.images.length > 1 && (
                            <div className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                              +{entry.images.length - 1}
                            </div>
                          )}
                      </div>
                      )}
                      <p className="text-gray-900 line-clamp-3 mb-2">
                        {entry.content || 'Empty entry...'}
                      </p>
                      {entry.images && entry.images.length > 0 && (
                        <div className="flex items-center space-x-2 mt-2">
                          <ImageIcon className="w-4 h-4 text-gray-400" />
                          <span className="text-xs text-gray-500">
                            {entry.images.length} image{entry.images.length > 1 ? 's' : ''}
                          </span>
                        </div>
                      )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Recent Entries */}
            <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Entries</h3>
              {recentEntries.length === 0 ? (
                <div className="text-center py-6">
                  <img 
                    src="https://images.pexels.com/photos/590016/pexels-photo-590016.jpg?auto=compress&cs=tinysrgb&w=400" 
                    alt="Stack of books" 
                    className="w-16 h-16 mx-auto rounded-lg object-cover opacity-50 mb-3"
                  />
                  <p className="text-gray-500 text-sm">No entries yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentEntries.map((entry) => (
                    <div
                      key={entry.id}
                      className="border border-gray-100 rounded-lg p-3 hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => onEditEntry(entry)}
                    >
                      <div className="text-sm text-gray-600 mb-1">
                        {new Date(entry.date).toLocaleDateString()}
                      </div>
                      <p className="text-sm text-gray-900 line-clamp-2 mb-1">
                        {entry.content || 'Empty entry...'}
                      </p>
                      {entry.images && entry.images.length > 0 && (
                        <div className="flex items-center space-x-1">
                          <ImageIcon className="w-3 h-3 text-gray-400" />
                          <span className="text-xs text-gray-500">
                            {entry.images.length} photo{entry.images.length > 1 ? 's' : ''}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Stats */}
            <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Statistics</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Entries</span>
                  <span className="font-semibold text-gray-900">{entries.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">This Month</span>
                  <span className="font-semibold text-gray-900">
                    {entries.filter(e => e.date.startsWith(new Date().toISOString().slice(0, 7))).length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Days Active</span>
                  <span className="font-semibold text-gray-900">
                    {new Set(entries.map(e => e.date)).size}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Page Type Modal */}
      {showPageTypeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Choose Page Type</h3>
            <div className="space-y-3">
              <button
                onClick={() => handleNewEntry('ruled')}
                className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-all text-left"
              >
                <div className="font-semibold text-gray-900">Ruled Page</div>
                <div className="text-sm text-gray-600">Perfect for structured writing with guidelines</div>
              </button>
              <button
                onClick={() => handleNewEntry('plain')}
                className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-all text-left"
              >
                <div className="font-semibold text-gray-900">Plain Page</div>
                <div className="text-sm text-gray-600">Clean white space for free-form writing</div>
              </button>
            </div>
            <button
              onClick={() => setShowPageTypeModal(false)}
              className="w-full mt-4 px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Backup/Restore Modal */}
      {showBackupModal && (
        <BackupRestore
          onExport={onExport}
          onImport={onImport}
          onClose={() => setShowBackupModal(false)}
        />
      )}

      {/* Delete Entry Confirmation Modal */}
      {entryToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-start mb-4">
              <div className="flex-shrink-0">
                <AlertTriangle className="w-6 h-6 text-red-500" />
              </div>
              <div className="ml-3 flex-1">
                <h3 className="text-lg font-semibold text-gray-900">Delete Entry</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Are you sure you want to delete this entry? This action cannot be undone.
                </p>
                {entryToDelete.content && (
                  <p className="text-xs text-gray-500 mt-2 line-clamp-2 italic">
                    "{entryToDelete.content.substring(0, 100)}..."
                  </p>
                )}
              </div>
            </div>
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setEntryToDelete(null)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onDeleteEntry(entryToDelete.id);
                  setEntryToDelete(null);
                }}
                className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
              >
                Delete Entry
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Profile Confirmation Modal */}
      {showDeleteProfileModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-start mb-4">
              <div className="flex-shrink-0">
                <AlertTriangle className="w-6 h-6 text-red-500" />
              </div>
              <div className="ml-3 flex-1">
                <h3 className="text-lg font-semibold text-gray-900">Delete Profile</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Are you sure you want to delete <strong>{user.name}</strong>'s profile?
                </p>
              </div>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <div className="flex items-start">
                <AlertTriangle className="w-5 h-5 text-red-600 mr-2 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-red-900 mb-1">⚠️ Warning: This action cannot be undone!</p>
                  <p className="text-xs text-red-800">
                    This will permanently delete:
                  </p>
                  <ul className="text-xs text-red-800 mt-1 list-disc list-inside space-y-1">
                    <li>All {entries.length} diary entries for this profile</li>
                    <li>All images attached to entries</li>
                    <li>Profile settings and security questions</li>
                  </ul>
                  <p className="text-xs font-semibold text-red-900 mt-2">
                    💡 Make sure to backup your data before deleting!
                  </p>
                </div>
              </div>
            </div>

            {/* Backup Option */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <div className="flex items-start">
                <Database className="w-5 h-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-blue-900 mb-2">
                    Backup Your Data First
                  </p>
                  <p className="text-xs text-blue-800 mb-3">
                    Create a backup of your profile and all entries before deleting. You can restore this backup later if needed.
                  </p>
                  <button
                    onClick={() => {
                      setShowDeleteProfileModal(false);
                      setShowBackupModal(true);
                    }}
                    className="w-full px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-lg transition-all flex items-center justify-center space-x-2 text-sm font-semibold"
                  >
                    <Database className="w-4 h-4" />
                    <span>Create Backup Now</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => setShowDeleteProfileModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (onDeleteProfile) {
                    onDeleteProfile(user.id);
                  }
                  setShowDeleteProfileModal(false);
                }}
                className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors font-semibold"
              >
                Delete Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Click outside to close settings menu */}
      {showSettingsMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowSettingsMenu(false)}
        />
      )}

      {/* Install Prompt */}
      <InstallPrompt />
    </div>
  );
};

export default DiaryDashboard;