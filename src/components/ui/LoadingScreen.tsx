/**
 * Filename: src/components/ui/LoadingScreen.tsx
 * Description: Minimalist full-screen loading component with pure black & white theme.
 * Used to prevent Flash of Untranslated Content (FOUC) during i18n initialization.
 */
'use client';

import * as React from 'react';

export default function LoadingScreen() {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white dark:bg-black">
            {/* Pulsing Circle Spinner */}
            <div className="relative">
                {/* Outer pulsing ring */}
                <div className="absolute inset-0 animate-ping rounded-full bg-black/20 dark:bg-white/20" />

                {/* Inner solid circle */}
                <div className="relative h-16 w-16 animate-pulse rounded-full bg-black dark:bg-white" />
            </div>
        </div>
    );
}

/**
 * Alternative spinner design (commented out for reference)
 * Uncomment this and replace the above if you prefer a rotating spinner
 */
/*
export default function LoadingScreen() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-white dark:bg-black">
      <div className="h-12 w-12 animate-spin rounded-full border-4 border-black/20 border-t-black dark:border-white/20 dark:border-t-white" />
      <p className="text-sm font-medium text-black/60 dark:text-white/60">Loading...</p>
    </div>
  );
}
*/
