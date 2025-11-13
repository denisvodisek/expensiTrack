import React, { useEffect, useState } from 'react';

interface ServiceWorkerManagerProps {
  children: React.ReactNode;
}

export const ServiceWorkerManager: React.FC<ServiceWorkerManagerProps> = ({ children }) => {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return;
    }

    let swRegistration: ServiceWorkerRegistration | null = null;

    const registerServiceWorker = async () => {
      try {
        swRegistration = await navigator.serviceWorker.register('/sw.js');
        setRegistration(swRegistration);
        console.log('[PWA] Service Worker registered successfully:', swRegistration.scope);
        
        // Check if service worker is active
        if (swRegistration.active) {
          console.log('[PWA] Service Worker is active');
        }
        if (swRegistration.installing) {
          console.log('[PWA] Service Worker is installing...');
        }
        if (swRegistration.waiting) {
          console.log('[PWA] Service Worker is waiting...');
        }

        // Check for updates
        await swRegistration.update();

        // Listen for service worker updates
        swRegistration.addEventListener('updatefound', () => {
          const newWorker = swRegistration!.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New service worker is installed and ready
                setUpdateAvailable(true);
              }
            });
          }
        });

        // Listen for controller change (when new SW takes over)
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          console.log('New service worker is now controlling the page');
          setUpdateAvailable(false);
          // Optionally reload the page to ensure fresh content
          window.location.reload();
        });

      } catch (error) {
        console.error('Service Worker registration failed:', error);
      }
    };

    registerServiceWorker();

    // Cleanup function
    return () => {
      if (swRegistration) {
        swRegistration.removeEventListener('updatefound', () => {});
      }
    };
  }, []);

  const handleUpdate = async () => {
    if (!registration || !registration.waiting) {
      return;
    }

    setIsUpdating(true);
    
    try {
      // Send message to waiting service worker to skip waiting
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      
      // The page will reload automatically when the new service worker takes control
      // due to the 'controllerchange' event listener
    } catch (error) {
      console.error('Failed to update service worker:', error);
      setIsUpdating(false);
    }
  };

  const handleDismiss = () => {
    setUpdateAvailable(false);
  };

  return (
    <>
      {children}
      
      {updateAvailable && (
        <div 
          className="fixed left-4 right-4 sm:left-auto sm:right-4 sm:w-96 bg-card border border-border rounded-lg shadow-lg p-4 z-50"
          style={{ bottom: 'calc(4rem + env(safe-area-inset-bottom, 0px) + 1rem)' }}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h3 className="font-semibold text-sm mb-1">Update Available</h3>
              <p className="text-xs text-muted-foreground mb-3">
                A new version of ExpensiTrak is available. Update now to get the latest features.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={handleDismiss}
                  className="text-xs px-3 py-1.5 rounded-md border border-border hover:bg-secondary transition-colors"
                >
                  Later
                </button>
                <button
                  onClick={handleUpdate}
                  disabled={isUpdating}
                  className="text-xs px-3 py-1.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {isUpdating ? 'Updating...' : 'Update Now'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

