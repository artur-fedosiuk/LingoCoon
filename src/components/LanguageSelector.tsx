'use client';

import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

const LANGUAGES = [
    { code: 'en', label: 'English' },
    { code: 'it', label: 'Italiano' },
    { code: 'uk', label: 'Українська' },
    { code: 'fr', label: 'Français' }
];

export default function LanguageSelector() {
    const { i18n } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const [isClient, setIsClient] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setIsClient(true);
    }, []);

    const currentLang = LANGUAGES.find(l => l.code === i18n.language) || LANGUAGES[0];

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
                <span className="text-sm font-medium text-gray-900">{currentLang.label}</span>
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
                <div className="absolute top-full mt-2 right-0 bg-white rounded-lg shadow-lg border border-gray-900 p-2 min-w-[180px] z-50">
                    {LANGUAGES.map(lang => (
                        <button
                            key={lang.code}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors duration-150 ${lang.code === currentLang.code
                                ? 'bg-black text-white'
                                : 'hover:bg-gray-100 text-gray-900'
                                }`}
                            onClick={() => selectLanguage(lang.code)}
                        >
                            <span className="text-sm font-semibold">{lang.label}</span>
                            {lang.code === currentLang.code && (
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
