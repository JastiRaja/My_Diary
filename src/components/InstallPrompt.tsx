import React, { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const InstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches || 
        (window.navigator as any).standalone === true) {
      setIsInstalled(true);
      return;
    }

    // For iOS Safari - check if it's already added to home screen
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isInStandaloneMode = (window.navigator as any).standalone === true;
    if (isIOS && isInStandaloneMode) {
      setIsInstalled(true);
      return;
    }

    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      console.log('beforeinstallprompt event fired');
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Show prompt after a delay
      setTimeout(() => {
        if (!sessionStorage.getItem('installPromptDismissed')) {
          setShowPrompt(true);
        }
      }, 3000);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    
    // Debug: Log if event never fires
    setTimeout(() => {
      if (!deferredPrompt && !isInstalled) {
        console.log('Install prompt not available. Possible reasons:');
        console.log('- App already installed');
        console.log('- Browser does not support PWA installation');
        console.log('- Missing icons in manifest');
        console.log('- Not served over HTTPS (localhost is OK)');
      }
    }, 5000);

    // Listen for manual install trigger from settings
    const handleShowInstallPrompt = () => {
      if (deferredPrompt) {
        setShowPrompt(true);
      }
    };

    window.addEventListener('show-install-prompt', handleShowInstallPrompt);

    // Check if app was just installed
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setShowPrompt(false);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('show-install-prompt', handleShowInstallPrompt);
    };
  }, [deferredPrompt]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    // Show the install prompt
    deferredPrompt.prompt();

    // Wait for the user to respond
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    } else {
      console.log('User dismissed the install prompt');
    }

    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    // Don't show again for this session
    sessionStorage.setItem('installPromptDismissed', 'true');
  };

  // Don't show if already installed
  if (isInstalled) {
    return null;
  }

  // Show if manually triggered, even if dismissed before
  const isManuallyTriggered = showPrompt && deferredPrompt;
  
  // Don't show if dismissed and not manually triggered
  if (!isManuallyTriggered && (sessionStorage.getItem('installPromptDismissed') === 'true' || !showPrompt || !deferredPrompt)) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 animate-slide-up">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 p-4 flex items-start space-x-3">
        <div className="flex-shrink-0">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
            <Download className="w-6 h-6 text-white" />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-gray-900 mb-1">
            Install My Diary
          </h3>
          <p className="text-xs text-gray-600 mb-3">
            Install this app on your device for offline access and a better experience. Works without internet!
          </p>
          {!deferredPrompt && (
            <div className="text-xs text-blue-600 mb-2 space-y-1">
              <p className="font-semibold">Installation Options:</p>
              <ul className="list-disc list-inside space-y-0.5 ml-2">
                <li><strong>Chrome/Edge:</strong> Look for install icon (➕) in address bar</li>
                <li><strong>Android:</strong> Menu (⋮) → "Install app" or "Add to Home screen"</li>
                <li><strong>iOS Safari:</strong> Share (□↑) → "Add to Home Screen"</li>
              </ul>
            </div>
          )}
          <div className="flex space-x-2">
            <button
              onClick={handleInstallClick}
              className="flex-1 px-3 py-1.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-semibold rounded-lg hover:shadow-lg transition-all"
            >
              Install
            </button>
            <button
              onClick={handleDismiss}
              className="px-3 py-1.5 text-gray-600 hover:text-gray-900 text-sm transition-colors"
            >
              Not now
            </button>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default InstallPrompt;

