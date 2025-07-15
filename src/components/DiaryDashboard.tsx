import React, { useState } from 'react';
import { User, DiaryEntry } from '../types';
import { Calendar, Plus, User as UserIcon, LogOut, FileText, Edit3 } from 'lucide-react';

interface DiaryDashboardProps {
  user: User;
  entries: DiaryEntry[];
  onCreateEntry: (date: string, pageType: 'ruled' | 'plain') => void;
  onEditEntry: (entry: DiaryEntry) => void;
  onLogout: () => void;
}

const DiaryDashboard: React.FC<DiaryDashboardProps> = ({
  user,
  entries,
  onCreateEntry,
  onEditEntry,
  onLogout
}) => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showPageTypeModal, setShowPageTypeModal] = useState(false);

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
          <button
            onClick={onLogout}
            className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8">
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
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => onEditEntry(entry)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-500 capitalize">
                          {entry.pageType} page
                        </span>
                        <Edit3 className="w-4 h-4 text-gray-400" />
                      </div>
                      <p className="text-gray-900 line-clamp-3">
                        {entry.content || 'Empty entry...'}
                      </p>
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
                      <p className="text-sm text-gray-900 line-clamp-2">
                        {entry.content || 'Empty entry...'}
                      </p>
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
    </div>
  );
};

export default DiaryDashboard;