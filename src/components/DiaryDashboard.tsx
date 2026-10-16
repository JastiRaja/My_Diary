import React, { useState, useEffect } from 'react';
import { User, DiaryEntry, Artwork, PaperStyle, BackupData, ArtworkDraft } from '../types';
import {
  Calendar,
  Plus,
  User as UserIcon,
  LogOut,
  FileText,
  Edit3,
  Database,
  Image as ImageIcon,
  Trash2,
  AlertTriangle,
  Settings,
  Download,
  Palette,
  Sparkles,
  Eye,
  X,
  Search,
  Copy,
  Paperclip,
  CheckCircle2,
  BookOpen
} from 'lucide-react';
import BackupRestore from './BackupRestore';
import InstallPrompt from './InstallPrompt';
import DrawingStudioModal from './DrawingStudioModal';
import SecureStorage from '../utils/storage';

interface DiaryDashboardProps {
  user: User;
  entries: DiaryEntry[];
  artworks: Artwork[];
  onCreateEntry: (date: string, pageType: 'ruled' | 'plain') => void;
  onEditEntry: (entry: DiaryEntry) => void;
  onDeleteEntry: (entryId: string) => void;
  onLogout: () => void;
  onDeleteProfile?: (userId: string) => void;
  onExport: () => BackupData;
  onImport: (data: BackupData, mergeMode: 'replace' | 'merge') => { success: boolean; message: string; importedUsers: number; importedEntries: number };
  onSaveArtwork: (artwork: { id?: string; title: string; imageData: string; paperStyle: PaperStyle }) => void;
  onDeleteArtwork: (artworkId: string) => void;
  onDuplicateArtwork?: (artwork: Artwork) => void;
  onAttachArtworkToDate?: (artworkImageData: string, targetDate?: string) => { success: boolean; message: string };
}

const DiaryDashboard: React.FC<DiaryDashboardProps> = ({
  user,
  entries,
  artworks,
  onCreateEntry,
  onEditEntry,
  onDeleteEntry,
  onLogout,
  onDeleteProfile,
  onExport,
  onImport,
  onSaveArtwork,
  onDeleteArtwork,
  onDuplicateArtwork,
  onAttachArtworkToDate
}) => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showPageTypeModal, setShowPageTypeModal] = useState(false);
  const [showBackupModal, setShowBackupModal] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState<DiaryEntry | null>(null);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [showDeleteProfileModal, setShowDeleteProfileModal] = useState(false);
  const [activeDashboardTab, setActiveDashboardTab] = useState<'diary' | 'art'>('diary');
  const [showArtStudioModal, setShowArtStudioModal] = useState(false);
  const [editingArtwork, setEditingArtwork] = useState<Artwork | null>(null);
  const [selectedArtworkForView, setSelectedArtworkForView] = useState<Artwork | null>(null);
  const [artworkToDelete, setArtworkToDelete] = useState<Artwork | null>(null);
  const [searchArtQuery, setSearchArtQuery] = useState('');
  const [selectedPaperFilter, setSelectedPaperFilter] = useState<'all' | PaperStyle>('all');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [restoredArtworkDraft, setRestoredArtworkDraft] = useState<ArtworkDraft | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  };

  // Restore in-progress artwork draft across page refresh
  useEffect(() => {
    const draft = SecureStorage.getArtworkDraft(user.id);
    if (draft && draft.isOpen && draft.source === 'dashboard') {
      setRestoredArtworkDraft(draft);
      showToast('Restored your in-progress artwork draft! 🎨');
    }
  }, [user.id]);

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

      <div className="max-w-6xl mx-auto px-4 py-8 pb-24">
        {/* Offline Use Notice */}
        {!window.matchMedia('(display-mode: standalone)').matches && (window.navigator as unknown as { standalone?: boolean }).standalone !== true && (
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
                          message = 'Look for the install icon (➕) in your browser\'s address bar, or use browser menu → "cast, save and share" → "Install My Diary" or "Install app"';
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

        {/* Dashboard Mode Switcher Tabs */}
        <div className="flex items-center space-x-2 sm:space-x-3 mb-6 bg-white/80 backdrop-blur p-1.5 rounded-2xl shadow-sm border border-gray-200 w-fit">
          <button
            onClick={() => setActiveDashboardTab('diary')}
            className={`flex items-center space-x-2 px-4 sm:px-5 py-2.5 rounded-xl font-medium text-sm transition-all ${
              activeDashboardTab === 'diary'
                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Diary Entries</span>
            <span className={`text-xs px-2 py-0.5 rounded-full ${activeDashboardTab === 'diary' ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600 font-semibold'}`}>
              {entries.length}
            </span>
          </button>

          <button
            onClick={() => setActiveDashboardTab('art')}
            className={`flex items-center space-x-2 px-4 sm:px-5 py-2.5 rounded-xl font-medium text-sm transition-all ${
              activeDashboardTab === 'art'
                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <Palette className="w-4 h-4" />
            <span>Art Gallery & Sketchbook</span>
            <span className={`text-xs px-2 py-0.5 rounded-full ${activeDashboardTab === 'art' ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600 font-semibold'}`}>
              {artworks.length}
            </span>
          </button>
        </div>

        {activeDashboardTab === 'diary' ? (
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
                  <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-tr from-purple-100 to-pink-100 flex items-center justify-center text-purple-500 mb-4 shadow-sm border border-purple-100">
                    <BookOpen className="w-10 h-10" />
                  </div>
                  <h4 className="text-base font-semibold text-gray-700">No entries for this date</h4>
                  <p className="text-sm text-gray-400 mt-2">Write your thoughts or create a sketch for today</p>
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
            {/* Quick Art Studio Launcher Card */}
            <div className="bg-gradient-to-br from-purple-500 via-pink-500 to-rose-500 rounded-2xl shadow-md p-5 text-white">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-purple-200">Creative Space</span>
                  <h3 className="text-lg font-bold mt-0.5">Art Studio & Sketchbook</h3>
                  <p className="text-xs text-purple-100 mt-1 max-w-[200px]">
                    Draw custom sketches, doodles, and digital art with rich tools.
                  </p>
                </div>
                <div className="p-2.5 bg-white/20 backdrop-blur-sm rounded-xl">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
              </div>
              <button
                onClick={() => setShowArtStudioModal(true)}
                className="mt-4 w-full py-2 px-3 bg-white hover:bg-purple-50 text-purple-900 font-semibold rounded-xl text-sm transition-all shadow-sm flex items-center justify-center space-x-2"
              >
                <Palette className="w-4 h-4 text-purple-600" />
                <span>Open Art Studio</span>
              </button>
            </div>

            {/* Recent Entries */}
            <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Entries</h3>
              {recentEntries.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-14 h-14 mx-auto rounded-2xl bg-purple-50 flex items-center justify-center text-purple-400 mb-3 border border-purple-100">
                    <BookOpen className="w-7 h-7" />
                  </div>
                  <p className="text-gray-500 font-medium text-sm">No entries yet</p>
                  <p className="text-xs text-gray-400 mt-1">Your recent memories will appear here</p>
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
                  <span className="text-gray-600">Saved Artworks</span>
                  <span className="font-semibold text-purple-600">{artworks.length}</span>
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
        ) : (
          /* Art Gallery & Sketchbook View */
          <div className="space-y-6">
            {/* Gallery Header Card */}
            <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 bg-gradient-to-tr from-purple-500 to-pink-500 rounded-xl text-white shadow-md">
                    <Palette className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Art Gallery & Sketchbook</h2>
                    <p className="text-sm text-gray-600 mt-0.5">
                      Your personal studio for custom sketches, doodles, and digital art saved in your diary.
                    </p>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowArtStudioModal(true)}
                className="flex items-center space-x-2 px-5 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-xl shadow-md hover:shadow-lg transform hover:scale-[1.02] active:scale-[0.98] transition-all font-semibold text-sm"
              >
                <Plus className="w-4 h-4" />
                <span>New Artwork</span>
              </button>
            </div>

            {/* Search & Paper Style Filter Bar */}
            {artworks.length > 0 && (
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-200 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={searchArtQuery}
                    onChange={(e) => setSearchArtQuery(e.target.value)}
                    placeholder="Search your artwork by title..."
                    className="w-full pl-9 pr-8 py-2 text-sm bg-slate-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all placeholder:text-gray-400"
                  />
                  {searchArtQuery && (
                    <button
                      onClick={() => setSearchArtQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 rounded-full"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Paper Style Filter Pills */}
                <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 md:pb-0 text-xs font-medium">
                  {(['all', 'blank', 'ruled', 'grid', 'dots', 'vintage', 'dark'] as const).map((style) => {
                    const count = style === 'all' ? artworks.length : artworks.filter(a => a.paperStyle === style).length;
                    if (count === 0 && style !== 'all') return null;
                    return (
                      <button
                        key={style}
                        onClick={() => setSelectedPaperFilter(style)}
                        className={`px-3 py-1.5 rounded-xl border transition-all whitespace-nowrap capitalize flex items-center space-x-1.5 ${
                          selectedPaperFilter === style
                            ? 'bg-purple-600 text-white border-purple-600 shadow-sm font-semibold'
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <span>{style}</span>
                        <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                          selectedPaperFilter === style ? 'bg-white/25 text-white' : 'bg-slate-200 text-slate-700'
                        }`}>
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Artworks List */}
            {artworks.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-sm p-12 border border-gray-200 text-center">
                <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-tr from-purple-100 to-pink-100 flex items-center justify-center text-purple-600 shadow-inner">
                  <Sparkles className="w-10 h-10" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Your Sketchbook is Blank</h3>
                <p className="text-gray-600 text-sm max-w-md mx-auto mb-6">
                  Draw art of your choice! Choose from pens, markers, watercolors, geometric shapes, and custom paper styles like ruled diary pages and vintage parchment.
                </p>
                <button
                  onClick={() => setShowArtStudioModal(true)}
                  className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-xl hover:shadow-lg transform hover:scale-105 transition-all text-sm inline-flex items-center space-x-2 shadow-md"
                >
                  <Palette className="w-4 h-4" />
                  <span>Start Your First Drawing</span>
                </button>
              </div>
            ) : (
              (() => {
                const filteredArtworks = artworks.filter((art) => {
                  const matchesSearch = art.title.toLowerCase().includes(searchArtQuery.toLowerCase());
                  const matchesPaper = selectedPaperFilter === 'all' || art.paperStyle === selectedPaperFilter;
                  return matchesSearch && matchesPaper;
                });

                if (filteredArtworks.length === 0) {
                  return (
                    <div className="bg-white rounded-2xl shadow-sm p-8 border border-gray-200 text-center">
                      <p className="text-gray-500 text-sm">No artworks match your search or filter.</p>
                      <button
                        onClick={() => {
                          setSearchArtQuery('');
                          setSelectedPaperFilter('all');
                        }}
                        className="mt-3 text-purple-600 font-semibold text-xs hover:underline"
                      >
                        Clear filters
                      </button>
                    </div>
                  );
                }

                return (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredArtworks.map((artwork) => (
                      <div
                        key={artwork.id}
                        className="bg-white rounded-2xl shadow-sm hover:shadow-md border border-gray-200 overflow-hidden transition-all group flex flex-col"
                      >
                        {/* Artwork Preview */}
                        <div
                          className="relative w-full aspect-[16/10] bg-slate-100 overflow-hidden cursor-pointer"
                          onClick={() => setSelectedArtworkForView(artwork)}
                        >
                          <img
                            src={artwork.imageData}
                            alt={artwork.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-colors flex items-center justify-center">
                            <span className="opacity-0 group-hover:opacity-100 px-3 py-1.5 bg-white/90 text-gray-900 rounded-lg text-xs font-semibold shadow-md transition-opacity flex items-center space-x-1.5">
                              <Eye className="w-3.5 h-3.5 text-purple-600" />
                              <span>View Full Size</span>
                            </span>
                          </div>
                          <span className="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-white/90 text-gray-700 shadow-sm backdrop-blur capitalize">
                            {artwork.paperStyle || 'Art'}
                          </span>
                        </div>

                        {/* Card Content & Actions */}
                        <div className="p-4 flex-1 flex flex-col justify-between">
                          <div>
                            <div className="flex items-start justify-between gap-2">
                              <h4 className="font-bold text-gray-900 text-base line-clamp-1 flex-1">
                                {artwork.title}
                              </h4>
                              <button
                                onClick={() => setEditingArtwork(artwork)}
                                className="text-gray-400 hover:text-purple-600 transition-colors p-1 rounded-md hover:bg-purple-50"
                                title="Edit & Continue Drawing"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                            </div>
                            <p className="text-xs text-gray-500 mt-0.5">
                              Created {new Date(artwork.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </p>
                          </div>

                          <div className="mt-4 pt-3 border-t border-gray-100 flex flex-wrap items-center justify-between gap-1.5">
                            {/* Attach to Today's Entry */}
                            <button
                              onClick={() => {
                                if (onAttachArtworkToDate) {
                                  const res = onAttachArtworkToDate(artwork.imageData, selectedDate);
                                  showToast(res.message);
                                }
                              }}
                              className="flex items-center space-x-1 text-xs font-semibold text-purple-700 hover:text-purple-900 transition-colors px-2 py-1 rounded-md bg-purple-50 hover:bg-purple-100"
                              title={`Attach to entry for ${selectedDate}`}
                            >
                              <Paperclip className="w-3.5 h-3.5 text-purple-600" />
                              <span>Attach to Entry</span>
                            </button>

                            <div className="flex items-center space-x-1">
                              {/* Duplicate */}
                              <button
                                onClick={() => {
                                  if (onDuplicateArtwork) {
                                    onDuplicateArtwork(artwork);
                                    showToast('Artwork duplicated in gallery!');
                                  }
                                }}
                                className="p-1.5 text-gray-500 hover:text-purple-600 transition-colors rounded-md hover:bg-gray-100"
                                title="Duplicate artwork"
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </button>

                              {/* Download */}
                              <button
                                onClick={() => {
                                  const link = document.createElement('a');
                                  link.download = `${artwork.title.toLowerCase().replace(/[^a-z0-9]/g, '_') || 'artwork'}.png`;
                                  link.href = artwork.imageData;
                                  document.body.appendChild(link);
                                  link.click();
                                  document.body.removeChild(link);
                                }}
                                className="p-1.5 text-gray-500 hover:text-purple-600 transition-colors rounded-md hover:bg-gray-100"
                                title="Download PNG"
                              >
                                <Download className="w-3.5 h-3.5" />
                              </button>

                              {/* Delete */}
                              <button
                                onClick={() => setArtworkToDelete(artwork)}
                                className="p-1.5 text-red-500 hover:text-red-700 transition-colors rounded-md hover:bg-red-50"
                                title="Delete artwork"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()
            )}
          </div>
        )}
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

      {/* Drawing Studio Modal */}
      {(showArtStudioModal || !!editingArtwork || !!restoredArtworkDraft) && (
        <DrawingStudioModal
          isOpen={showArtStudioModal || !!editingArtwork || !!restoredArtworkDraft}
          onClose={() => {
            setShowArtStudioModal(false);
            setEditingArtwork(null);
            setRestoredArtworkDraft(null);
          }}
          onSaveArtwork={onSaveArtwork}
          initialTitle={
            editingArtwork
              ? editingArtwork.title
              : restoredArtworkDraft
              ? restoredArtworkDraft.title
              : `Artwork ${artworks.length + 1}`
          }
          initialPaperStyle={
            editingArtwork
              ? editingArtwork.paperStyle
              : restoredArtworkDraft
              ? restoredArtworkDraft.paperStyle
              : 'blank'
          }
          initialImage={
            editingArtwork
              ? editingArtwork.imageData
              : restoredArtworkDraft
              ? restoredArtworkDraft.imageData
              : undefined
          }
          artworkId={
            editingArtwork
              ? editingArtwork.id
              : restoredArtworkDraft
              ? restoredArtworkDraft.artworkId
              : undefined
          }
          userId={user.id}
          source="dashboard"
        />
      )}

      {/* Fullscreen Artwork Viewer Modal */}
      {selectedArtworkForView && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-fade-in"
          onClick={() => setSelectedArtworkForView(null)}
        >
          <div
            className="relative w-full max-w-5xl max-h-[92vh] flex flex-col bg-slate-900 rounded-2xl overflow-hidden shadow-2xl border border-white/10"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Viewer Header */}
            <div className="p-4 bg-slate-950/80 border-b border-white/10 flex items-center justify-between">
              <div>
                <h3 className="text-white font-bold text-lg">{selectedArtworkForView.title}</h3>
                <p className="text-xs text-slate-400 capitalize">
                  {selectedArtworkForView.paperStyle} style • {new Date(selectedArtworkForView.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    const link = document.createElement('a');
                    link.download = `${selectedArtworkForView.title.toLowerCase().replace(/[^a-z0-9]/g, '_') || 'artwork'}.png`;
                    link.href = selectedArtworkForView.imageData;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  }}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-medium transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span>Download</span>
                </button>
                <button
                  onClick={() => setSelectedArtworkForView(null)}
                  className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Artwork Display */}
            <div className="p-4 flex items-center justify-center overflow-auto max-h-[80vh] bg-slate-950">
              <img
                src={selectedArtworkForView.imageData}
                alt={selectedArtworkForView.title}
                className="max-w-full max-h-[75vh] object-contain rounded-lg shadow-2xl"
              />
            </div>
          </div>
        </div>
      )}

      {/* Delete Artwork Confirmation Modal */}
      {artworkToDelete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl border border-gray-100">
            <div className="flex items-start mb-4">
              <div className="flex-shrink-0 p-2 bg-red-100 text-red-600 rounded-xl">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="ml-3 flex-1">
                <h3 className="text-lg font-bold text-gray-900">Delete Artwork</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Are you sure you want to delete <span className="font-semibold text-gray-900">"{artworkToDelete.title}"</span>? This action cannot be undone.
                </p>
              </div>
            </div>
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setArtworkToDelete(null)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onDeleteArtwork(artworkToDelete.id);
                  setArtworkToDelete(null);
                }}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors shadow-sm"
              >
                Delete Artwork
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

      {/* Fixed Install Banner at Bottom */}
      {!window.matchMedia('(display-mode: standalone)').matches && (window.navigator as unknown as { standalone?: boolean }).standalone !== true && (
        <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg z-40 border-t border-blue-500">
          <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center space-x-3 flex-1">
              <Download className="w-5 h-5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold">
                  📱 Install this app for offline use
                </p>
                <p className="text-xs text-blue-100">
                  Works 100% offline • Fast access • No internet needed
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2 ml-4">
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
                      message = 'Look for the install icon (➕) in your browser\'s address bar, or use browser menu → "cast, save and share" → "Install My Diary" or "Install app"';
                    }
                    
                    alert(`Install Instructions:\n\n${message}\n\nAfter installation, the app will work completely offline!`);
                  }, 200);
                }}
                className="px-4 py-2 bg-white text-blue-600 font-semibold rounded-lg hover:bg-blue-50 transition-all text-sm shadow-md"
              >
                Install Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-20 right-6 z-50 animate-bounce bg-slate-900/95 backdrop-blur-md text-white text-sm font-medium px-4 py-3 rounded-xl shadow-2xl border border-white/10 flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Install Prompt */}
      <InstallPrompt />
    </div>
  );
};

export default DiaryDashboard;