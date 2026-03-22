// I18nProvider.tsx
// This component wraps the whole app and makes translations available everywhere.
// It waits until the translations are loaded before showing anything.
'use client';

import { I18nextProvider } from 'react-i18next';
import i18n from '@/lib/i18n';
import { useEffect, useState } from 'react';
import LoadingScreen from '@/components/ui/LoadingScreen';

export default function I18nProvider({ children }: { children: React.ReactNode }) {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Check if i18n is already loaded
    if (i18n.isInitialized) {
      setIsReady(true);
      return;
    }

    // Wait for i18n to finish loading
    const handleInitialized = () => {
      setIsReady(true);
    };

    i18n.on('initialized', handleInitialized);

    // Remove the listener when the component is unmounted
    return () => {
      i18n.off('initialized', handleInitialized);
    };
  }, []);

  // Show a loading screen while translations are being fetched
  if (!isReady) {
    return <LoadingScreen />;
  }

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}