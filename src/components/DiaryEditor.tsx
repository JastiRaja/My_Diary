import React, { useState, useEffect } from 'react';
import { DiaryEntry } from '../types';
import { ArrowLeft, Save, Calendar, Type } from 'lucide-react';

interface DiaryEditorProps {
  entry: DiaryEntry | null;
  onSave: (content: string) => void;
  onBack: () => void;
  isNew: boolean;
}

const DiaryEditor: React.FC<DiaryEditorProps> = ({
  entry,
  onSave,
  onBack,
  isNew
}) => {
  const [content, setContent] = useState(entry?.content || '');
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setHasChanges(content !== (entry?.content || ''));
  }, [content, entry?.content]);

  const handleSave = () => {
    onSave(content);
    setHasChanges(false);
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

  const isRuled = entry?.pageType === 'ruled';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={onBack}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Dashboard</span>
            </button>
          </div>

          <div className="flex items-center space-x-4">
            {entry && (
              <div className="flex items-center space-x-2 text-gray-600 text-sm">
                <Calendar className="w-4 h-4" />
                <span>{formatDate(entry.date)}</span>
                <Type className="w-4 h-4 ml-2" />
                <span className="capitalize">{entry.pageType} page</span>
              </div>
            )}
            
            <button
              onClick={handleSave}
              disabled={!hasChanges}
              className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:shadow-lg transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              <Save className="w-4 h-4" />
              <span>{isNew ? 'Save Entry' : 'Save Changes'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Editor */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="p-6">
            {entry && (
              <div className="mb-6">
                <div className="flex items-center justify-center mb-4">
                  <img 
                    src="https://images.pexels.com/photos/1925536/pexels-photo-1925536.jpeg?auto=compress&cs=tinysrgb&w=400" 
                    alt="Writing in diary" 
                    className="w-16 h-16 rounded-full object-cover shadow-md"
                  />
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  {isNew ? 'New Entry' : 'Edit Entry'}
                </h1>
                <p className="text-gray-600">
                  {formatDate(entry.date)} • {entry.pageType === 'ruled' ? 'Ruled Page' : 'Plain Page'}
                </p>
              </div>
            )}

            <div className="relative">
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Start writing your thoughts..."
                className={`
                  w-full h-96 p-6 border-0 resize-none focus:outline-none text-gray-900 text-lg leading-relaxed
                  ${isRuled ? 'ruled-paper' : ''}
                `}
                style={{
                  minHeight: '600px',
                  fontFamily: isRuled ? 'monospace' : 'inherit',
                  lineHeight: isRuled ? '2.5em' : '1.6em'
                }}
              />
              
              {hasChanges && (
                <div className="absolute top-2 right-2">
                  <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse"></div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Word count */}
        <div className="mt-4 text-center text-sm text-gray-500">
          {content.length} characters • {content.split(/\s+/).filter(word => word.length > 0).length} words
        </div>
      </div>
    </div>
  );
};

export default DiaryEditor;