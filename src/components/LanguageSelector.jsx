// File: src/components/LanguageSelector.jsx
// Created: 2025-01-06
// Last-Updated: 2025-01-06
// Author: Claude
// Description: Minimalist language selector with flag icons only

import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import './LanguageSelector.css';

const LANGUAGES = [
  { code: 'en', flag: '🇬🇧', label: 'English' },
  { code: 'it', flag: '🇮🇹', label: 'Italiano' },
  { code: 'uk', flag: '🇺🇦', label: 'Українська' },
  { code: 'fr', flag: '🇫🇷', label: 'Français' }
];

function LanguageSelector() {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const currentLang = LANGUAGES.find(l => l.code === i18n.language) || LANGUAGES[0];

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function selectLanguage(code) {
    i18n.changeLanguage(code);
    setIsOpen(false);
  }

  return (
    <div className="lang-selector" ref={dropdownRef}>
      <button
        className="lang-trigger"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Select language"
        aria-expanded={isOpen}
      >
        <span className="lang-flag">{currentLang.flag}</span>
        <svg 
          className={`lang-chevron ${isOpen ? 'open' : ''}`}
          viewBox="0 0 16 16"
          aria-hidden="true"
        >
          <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {isOpen && (
        <div className="lang-dropdown">
          {LANGUAGES.map(lang => (
            <button
              key={lang.code}
              className={`lang-option ${lang.code === currentLang.code ? 'active' : ''}`}
              onClick={() => selectLanguage(lang.code)}
              title={lang.label}
              aria-label={`Switch to ${lang.label}`}
            >
              <span className="lang-flag-large">{lang.flag}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default LanguageSelector;