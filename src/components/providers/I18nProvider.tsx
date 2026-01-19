/**
 * Filename: src/components/providers/I18nProvider.tsx
 * Description: Provider component that initializes and makes i18n functionality available throughout the app.
 * Prevents Flash of Untranslated Content (FOUC) by blocking render until translations are loaded.
 */
'use client';

import { I18nextProvider } from 'react-i18next';
import i18n from '@/lib/i18n';
import { useEffect, useState } from 'react';
import LoadingScreen from '@/components/ui/LoadingScreen';

export default function I18nProvider({ children }: { children: React.ReactNode }) {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Check if i18n is already initialized
    if (i18n.isInitialized) {
      setIsReady(true);
      return;
    }

    // Listen for the initialized event
    const handleInitialized = () => {
      setIsReady(true);
    };

    i18n.on('initialized', handleInitialized);

    // Cleanup listener on unmount
    return () => {
      i18n.off('initialized', handleInitialized);
    };
  }, []);

  // Block rendering until i18n is fully initialized
  if (!isReady) {
    return <LoadingScreen />;
  }

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}