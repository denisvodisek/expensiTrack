import React, { useState, useEffect } from 'react';

const InstallBanner: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showInstallButton, setShowInstallButton] = useState(false);

  useEffect(() => {
    // Check if app is already installed
    const checkIfInstalled = () => {
      if (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) {
        console.log('[PWA] App is already installed (standalone mode)');
        setIsInstalled(true);
        setShowInstallButton(false);
        return true;
      } else if ((window.navigator as any).standalone === true) {
        console.log('[PWA] App is already installed (iOS standalone)');
        setIsInstalled(true);
        setShowInstallButton(false);
        return true;
      }
      return false;
    };

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: any) => {
      console.log('[PWA] beforeinstallprompt event fired!', e);
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallButton(true);
    };

    // Listen for appinstalled event
    const handleAppInstalled = () => {
      console.log('[PWA] App was installed');
      setIsInstalled(true);
      setShowInstallButton(false);
      setDeferredPrompt(null);
    };

    if (checkIfInstalled()) {
      return;
    }

    console.log('[PWA] Setting up install prompt listeners...');
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Check if prompt was already stored (from page reload)
    const storedPrompt = (window as any).deferredPrompt;
    if (storedPrompt) {
      console.log('[PWA] Found stored deferred prompt');
      setDeferredPrompt(storedPrompt);
      setShowInstallButton(true);
    }

    // Debug: Log after a delay to see if event fires
    setTimeout(() => {
      if (!showInstallButton && !isInstalled) {
        console.log('[PWA] Install prompt not available yet. This is normal - browsers may require multiple visits.');
        console.log('[PWA] Check: Service Worker registered?', 'serviceWorker' in navigator);
        console.log('[PWA] Check: Manifest accessible?', document.querySelector('link[rel="manifest"]') !== null);
      }
    }, 2000);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      console.log('[PWA] No deferred prompt available. Trying manual install...');
      // Fallback: Show instructions for manual install
      alert('To install this app:\n\nAndroid Chrome: Tap Menu (⋮) → "Install app"\n\niOS Safari: Tap Share → "Add to Home Screen"');
      return;
    }

    try {
      console.log('[PWA] Showing install prompt...');
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      console.log('[PWA] User choice:', outcome);
      if (outcome === 'accepted') {
        console.log('[PWA] User accepted the install prompt');
      } else {
        console.log('[PWA] User dismissed the install prompt');
      }
    } catch (error) {
      console.error('[PWA] Error showing install prompt:', error);
    }
    
    setDeferredPrompt(null);
    setShowInstallButton(false);
  };

  // Don't show if already installed
  if (isInstalled) {
    return null;
  }

  // Show banner if we have a prompt OR if we're on a mobile device (for manual install instructions)
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  const shouldShow = showInstallButton || (isMobile && !isInstalled);

  if (!shouldShow) {
    return null;
  }

  return (
    <div className="bg-primary text-primary-foreground px-4 py-3 flex items-center justify-between gap-4 shadow-lg z-50 sticky top-0">
      <div className="flex items-center gap-3 flex-1">
        <div className="flex-shrink-0">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold">Install ExpensiTrak</p>
          <p className="text-xs opacity-90">
            {deferredPrompt ? 'Tap Install to add to home screen' : 'Use browser menu to install'}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {deferredPrompt ? (
          <button
            onClick={handleInstallClick}
            className="bg-secondary text-secondary-foreground px-4 py-2 rounded-md text-sm font-semibold hover:bg-secondary/80 transition-colors border border-border"
          >
            Install
          </button>
        ) : (
          <button
            onClick={handleInstallClick}
            className="bg-secondary text-secondary-foreground px-4 py-2 rounded-md text-sm font-semibold hover:bg-secondary/80 transition-colors border border-border"
          >
            How to Install
          </button>
        )}
      </div>
    </div>
  );
};

export default InstallBanner;

