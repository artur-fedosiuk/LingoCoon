/**
 * Filename: src/app/page.tsx
 * Description: The main landing page of the application, featuring the hero section and language selection.
 */
'use client';

import Link from "next/link";
import { useTranslation } from 'react-i18next';
import LanguageSelector from "@/components/LanguageSelector";
import { useEffect, useState } from "react";

export default function Home() {
  const { t } = useTranslation();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="relative min-h-screen bg-white">
      {/* Header with Language Selector */}
      <header className="relative z-50 flex justify-end p-6 sm:p-8 border-b border-gray-200">
        <LanguageSelector />
      </header>

      {/* Hero Section */}
      <main className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 text-center min-h-[calc(100vh-120px)]">
        {/* Logo/Brand */}
        <div className="mb-12">
          <div className="flex items-center justify-center gap-4">
            <div className="w-20 h-20 rounded-lg bg-black flex items-center justify-center">
              <span className="text-5xl font-bold text-white">L</span>
            </div>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-6xl sm:text-7xl font-bold tracking-tight mb-6 text-black">
          Lingocoon
        </h1>

        {/* Subtitle */}
        <p className="max-w-2xl text-lg sm:text-xl text-gray-600 mb-12 leading-relaxed">
          {mounted ? t('landing.hero_subtitle') : 'Your personal AI-powered language learning companion designed for real results.'}
        </p>

        {/* Start Button */}
        <Link
          href="/onboarding"
          className="inline-flex items-center gap-3 px-10 py-5 rounded-lg bg-black text-white font-semibold text-lg hover:bg-gray-800 transition-colors duration-200"
        >
          <span>
            {mounted ? t('landing.cta_start') : 'Start Learning'}
          </span>
          <svg
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </Link>

        {/* Login link */}
        <p className="mt-8 text-gray-500">
          {mounted ? t('publicOnboarding.hasAccount') : 'Already have an account?'}{' '}
          <Link
            href="/login"
            className="text-black font-medium underline underline-offset-4 hover:text-gray-700 transition-colors"
          >
            {mounted ? t('publicOnboarding.signIn') : 'Sign in'}
          </Link>
        </p>
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-6 text-center text-sm text-gray-400 border-t border-gray-200">
        © 2026 Lingocoon
      </footer>
    </div>
  );
}
