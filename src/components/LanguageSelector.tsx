/**
 * Filename: src/components/LanguageSelector.tsx
 * Description: UI component allowing users to select their preferred application language.
 */
'use client';

import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

const LANGUAGE_KEY_MAP: Record<string, string> = {
    en: 'en-US',
    it: 'it-IT',
    uk: 'ua-UA',
    fr: 'fr-FR'
};

export default function LanguageSelector() {
    const { t, i18n } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const [isClient, setIsClient] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setIsClient(true);
    }, []);

    const supportedLngs = (i18n.options.supportedLngs as string[])?.filter(l => l !== 'cimode') || ['en'];

    const getLanguageLabel = (code: string) => {
        const key = LANGUAGE_KEY_MAP[code] || code;
        return t(`languages.${key}`);
    };

    const currentLangCode = i18n.language || 'en';
    const currentLangLabel = getLanguageLabel(currentLangCode);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    function selectLanguage(code: string) {
        i18n.changeLanguage(code);
        setIsOpen(false);
    }

    /* 
     * Missing Keys:
     * common.language
     */

    if (!isClient) {
        return (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white border border-gray-200">
                <span className="text-sm font-medium">Language</span>
            </div>
        );
    }

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white border border-gray-900 hover:bg-gray-100 transition-colors duration-200"
                onClick={() => setIsOpen(!isOpen)}
                aria-label="Select language"
            >
                <span className="text-sm font-medium text-gray-900">{currentLangLabel}</span>
                <svg
                    className={`w-4 h-4 text-gray-900 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {isOpen && (
                <div className="absolute bottom-full mb-2 right-0 bg-white rounded-lg shadow-lg border border-gray-900 p-2 min-w-[180px] z-50">
                    {supportedLngs.map(code => (
                        <button
                            key={code}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors duration-150 ${code === currentLangCode
                                ? 'bg-black text-white'
                                : 'hover:bg-gray-100 text-gray-900'
                                }`}
                            onClick={() => selectLanguage(code)}
                        >
                            <span className="text-sm font-semibold">{getLanguageLabel(code)}</span>
                            {code === currentLangCode && (
                                <svg className="w-4 h-4 ml-auto" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                            )}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
