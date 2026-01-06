// File: src/pages/PublicLanding.jsx
// Created: 2025-01-19
// Last-Updated: 2025-01-06
// Author: Claude
// Description: LinguaCoon landing page - Futuristic Dark Premium SaaS Design

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LanguageSelector from '../components/LanguageSelector';
import '../styles/PublicLanding.css';

const RaccoonMascot = ({ className = '', size = 'default' }) => (
  <svg 
    className={`raccoon-mascot ${className} raccoon-${size}`}
    viewBox="0 0 200 200" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <defs>
      <radialGradient id="headGlow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#818CF8" stopOpacity="0.3"/>
        <stop offset="100%" stopColor="#818CF8" stopOpacity="0"/>
      </radialGradient>
      <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="4" stdDeviation="8" floodColor="#1E1B4B" floodOpacity="0.3"/>
      </filter>
    </defs>
    
    <circle cx="100" cy="110" r="90" fill="url(#headGlow)"/>
    <ellipse cx="55" cy="50" rx="28" ry="32" fill="#3F3F46"/>
    <ellipse cx="145" cy="50" rx="28" ry="32" fill="#3F3F46"/>
    <ellipse cx="55" cy="48" rx="16" ry="20" fill="#A1A1AA"/>
    <ellipse cx="145" cy="48" rx="16" ry="20" fill="#A1A1AA"/>
    <ellipse cx="100" cy="115" rx="72" ry="68" fill="#E4E4E7" filter="url(#softShadow)"/>
    
    <path 
      d="M30 100 Q100 75 170 100 Q165 138 100 130 Q35 138 30 100" 
      fill="#27272A"
    />
    
    <ellipse cx="68" cy="105" rx="20" ry="22" fill="#FAFAFA"/>
    <ellipse cx="132" cy="105" rx="20" ry="22" fill="#FAFAFA"/>
    <ellipse cx="71" cy="102" rx="11" ry="14" fill="#18181B"/>
    <ellipse cx="135" cy="102" rx="11" ry="14" fill="#18181B"/>
    <ellipse cx="71" cy="102" rx="8" ry="10" fill="#27272A"/>
    <ellipse cx="135" cy="102" rx="8" ry="10" fill="#27272A"/>
    
    <circle cx="75" cy="97" r="5" fill="white"/>
    <circle cx="139" cy="97" r="5" fill="white"/>
    <circle cx="68" cy="107" r="2" fill="white" opacity="0.6"/>
    <circle cx="132" cy="107" r="2" fill="white" opacity="0.6"/>
    
    <ellipse cx="100" cy="145" rx="28" ry="22" fill="#F4F4F5"/>
    <ellipse cx="100" cy="138" rx="12" ry="9" fill="#27272A"/>
    <ellipse cx="97" cy="136" rx="4" ry="2.5" fill="#52525B" opacity="0.6"/>
    
    <path 
      d="M88 152 Q100 160 112 152" 
      stroke="#27272A" 
      strokeWidth="2.5" 
      fill="none"
      strokeLinecap="round"
    />
    
    <circle cx="72" cy="148" r="2.5" fill="#A1A1AA"/>
    <circle cx="78" cy="154" r="2" fill="#A1A1AA"/>
    <circle cx="128" cy="148" r="2.5" fill="#A1A1AA"/>
    <circle cx="122" cy="154" r="2" fill="#A1A1AA"/>
    
    <ellipse cx="50" cy="125" rx="12" ry="8" fill="#F97316" opacity="0.15"/>
    <ellipse cx="150" cy="125" rx="12" ry="8" fill="#F97316" opacity="0.15"/>
  </svg>
);

function PublicLanding() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [showCookies, setShowCookies] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('lc_cookie_consent');
    if (!consent) {
      const timer = setTimeout(() => setShowCookies(true), 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  const acceptCookies = () => {
    localStorage.setItem('lc_cookie_consent', 'yes');
    setShowCookies(false);
  };

  const rejectCookies = () => {
    localStorage.setItem('lc_cookie_consent', 'no');
    setShowCookies(false);
  };

  return (
    <div className="lc-landing">
      <div className="lc-bg-grid"></div>
      <div className="lc-bg-glow"></div>

      <header className="lc-header">
        <div className="lc-header-inner">
          <div className="lc-brand" onClick={() => navigate('/')} role="button" tabIndex={0}>
            <RaccoonMascot size="tiny" />
            <span className="lc-brand-name">LinguaCoon</span>
          </div>

          <div className="lc-header-right">
            <div className="lc-lang-select-wrapper">
              <LanguageSelector variant="dropdown" />
            </div>

            <button className="lc-login-btn" onClick={() => navigate('/login')}>
              {t('landing.login_button')}
            </button>
          </div>
        </div>
      </header>

      <main className="lc-main">
        <section className="lc-hero">
          <div className="lc-hero-content">
            <h1 className="lc-headline">
              <span className="lc-gradient-text">{t('landing.hero_title')}</span>
            </h1>
            
            <p className="lc-subheadline">
              {t('landing.hero_subtitle')}
            </p>

            <div className="lc-cta-buttons">
              <button 
                className="lc-cta-primary"
                onClick={() => navigate('/registration')}
              >
                <span className="lc-cta-overlay"></span>
                <span className="lc-cta-text">{t('landing.cta_start')}</span>
                <svg className="lc-cta-arrow" viewBox="0 0 20 20" fill="none" stroke="currentColor">
                  <path d="M4 10H16M12 5L17 10L12 15" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              
              <button 
                className="lc-cta-secondary"
                onClick={() => navigate('/login')}
              >
                {t('landing.cta_login')}
              </button>
            </div>
          </div>
        </section>
      </main>

      {showCookies && (
        <div className="lc-cookies" role="dialog" aria-labelledby="cookie-heading">
          <div className="lc-cookies-inner">
            <div className="lc-cookies-text">
              <h3 id="cookie-heading">{t('cookies.title')}</h3>
              <p>{t('cookies.description')}</p>
            </div>
            <div className="lc-cookies-actions">
              <button className="lc-btn-accept" onClick={acceptCookies}>
                {t('cookies.accept')}
              </button>
              <button className="lc-btn-reject" onClick={rejectCookies}>
                {t('cookies.reject')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PublicLanding;