import React, { useState, useEffect } from 'react';
import { CloseIcon } from './Icons';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const InstallBanner: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone) {
      setIsInstalled(true);
      return;
    }

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsVisible(true);
    };

    // Listen for app installed event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsVisible(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Check if prompt was already stored
    const storedPrompt = (window as any).deferredPrompt;
    if (storedPrompt) {
      setDeferredPrompt(storedPrompt);
      setIsVisible(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    // Show the install prompt
    deferredPrompt.prompt();

    // Wait for the user to respond
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
      setIsInstalled(true);
    } else {
      console.log('User dismissed the install prompt');
    }

    setIsVisible(false);
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setIsVisible(false);
    // Store dismissal in localStorage to not show again for a while
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
  };

  // Check if user dismissed recently (within 7 days)
  useEffect(() => {
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    if (dismissed) {
      const dismissedTime = parseInt(dismissed, 10);
      const daysSinceDismissed = (Date.now() - dismissedTime) / (1000 * 60 * 60 * 24);
      if (daysSinceDismissed < 7) {
        setIsVisible(false);
      }
    }
  }, []);

  if (isInstalled || !isVisible || !deferredPrompt) {
    return null;
  }

  return (
    <div className="bg-primary text-primary-foreground px-4 py-3 flex items-center justify-between gap-4 shadow-lg z-50">
      <div className="flex items-center gap-3 flex-1">
        <div className="flex-shrink-0">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold">Install ExpensiTrak</p>
          <p className="text-xs opacity-90">Add to home screen for quick access</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={handleInstallClick}
          className="bg-white text-primary px-4 py-2 rounded-md text-sm font-semibold hover:bg-opacity-90 transition-colors"
        >
          Install
        </button>
        <button
          onClick={handleDismiss}
          className="text-primary-foreground hover:bg-white hover:bg-opacity-20 rounded-full p-1 transition-colors"
          aria-label="Dismiss"
        >
          <CloseIcon className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default InstallBanner;

