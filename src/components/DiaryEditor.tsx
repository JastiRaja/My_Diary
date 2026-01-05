import React, { useState, useEffect, useRef } from 'react';
import { DiaryEntry } from '../types';
import { ArrowLeft, Save, Calendar, Type, Image as ImageIcon, X, AlertCircle } from 'lucide-react';
import ImageCompression from '../utils/imageCompression';

interface DiaryEditorProps {
  entry: DiaryEntry | null;
  onSave: (content: string, images: string[]) => void;
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
  const [images, setImages] = useState<string[]>(entry?.images || []);
  const [hasChanges, setHasChanges] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const contentChanged = content !== (entry?.content || '');
    const imagesChanged = JSON.stringify(images) !== JSON.stringify(entry?.images || []);
    setHasChanges(contentChanged || imagesChanged);
  }, [content, images, entry?.content, entry?.images]);

  const handleSave = () => {
    setSaveError(null);
    try {
      onSave(content, images);
    setHasChanges(false);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Failed to save entry');
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    setIsCompressing(true);
    setSaveError(null);
    const newImages: string[] = [];
    const maxImages = 5; // Limit to 5 images per entry
    const maxSize = 5 * 1024 * 1024; // 5MB per image

    try {
      const fileArray = Array.from(files).slice(0, maxImages - images.length);
      
      for (const file of fileArray) {
        if (file.size > maxSize) {
          setSaveError(`Image ${file.name} is too large. Maximum size is 5MB.`);
          continue;
        }

        if (!file.type.startsWith('image/')) {
          setSaveError(`File ${file.name} is not an image.`);
          continue;
        }

        const reader = new FileReader();
        const dataUrl = await new Promise<string>((resolve, reject) => {
          reader.onload = (e) => {
            const result = e.target?.result as string;
            if (result) {
              resolve(result);
            } else {
              reject(new Error('Failed to read file'));
            }
          };
          reader.onerror = () => reject(new Error('Failed to read file'));
          reader.readAsDataURL(file);
        });

        // Compress image if it's large
        let compressedDataUrl = dataUrl;
        const sizeInMB = ImageCompression.getSizeInMB(dataUrl);
        
        if (sizeInMB > 0.5) { // Compress if larger than 500KB
          try {
            compressedDataUrl = await ImageCompression.compressImage(dataUrl, 1920, 1920, 0.8);
          } catch (error) {
            console.warn('Failed to compress image, using original:', error);
            // Use original if compression fails
          }
        }

        newImages.push(compressedDataUrl);
      }

      setImages((prev) => [...prev, ...newImages]);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Failed to process images');
    } finally {
      setIsCompressing(false);
      // Reset input
      if (imageInputRef.current) {
        imageInputRef.current.value = '';
      }
    }
  };

  const handleRemoveImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
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

            {/* Image Upload Section */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700">
                  Images ({images.length}/5)
                  {isCompressing && (
                    <span className="ml-2 text-xs text-blue-600">Compressing...</span>
                  )}
                </label>
                {images.length < 5 && (
                  <button
                    type="button"
                    onClick={() => imageInputRef.current?.click()}
                    disabled={isCompressing}
                    className="flex items-center space-x-2 px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ImageIcon className="w-4 h-4" />
                    <span>{isCompressing ? 'Processing...' : 'Add Image'}</span>
                  </button>
                )}
              </div>
              
              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                className="hidden"
              />

              {images.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-3">
                  {images.map((image, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={image}
                        alt={`Memory ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg border border-gray-200 cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={() => setSelectedImage(image)}
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveImage(index);
                        }}
                        className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Remove image"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Image Viewer Modal */}
              {selectedImage && (
                <div 
                  className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-50"
                  onClick={() => setSelectedImage(null)}
                >
                  <div className="relative max-w-4xl max-h-[90vh]">
                    <button
                      onClick={() => setSelectedImage(null)}
                      className="absolute top-4 right-4 bg-white/20 hover:bg-white/30 text-white rounded-full p-2 z-10"
                    >
                      <X className="w-6 h-6" />
                    </button>
                    <img
                      src={selectedImage}
                      alt="Full size memory"
                      className="max-w-full max-h-[90vh] object-contain rounded-lg"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                </div>
              )}
            </div>

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

        {/* Error message */}
        {saveError && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start">
              <AlertCircle className="w-5 h-5 text-red-600 mr-2 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-red-900">Save Error</p>
                <p className="text-sm text-red-800 mt-1">{saveError}</p>
                {saveError.includes('quota') || saveError.includes('too large') ? (
                  <div className="mt-2 text-xs text-red-700">
                    <p>Suggestions:</p>
                    <ul className="list-disc list-inside mt-1 space-y-1">
                      <li>Remove some images from this entry</li>
                      <li>Export your data to free up space</li>
                      <li>Delete old entries you no longer need</li>
                    </ul>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        )}

        {/* Word count and image count */}
        <div className="mt-4 text-center text-sm text-gray-500">
          {content.length} characters • {content.split(/\s+/).filter(word => word.length > 0).length} words
          {images.length > 0 && ` • ${images.length} image${images.length > 1 ? 's' : ''}`}
          {images.length > 0 && (
            <span className="ml-2">
              (Total: {((images.reduce((acc, img) => acc + img.length, 0) * 3) / 4 / 1024 / 1024).toFixed(2)}MB)
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default DiaryEditor;