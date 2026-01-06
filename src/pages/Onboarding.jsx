// File: src/pages/Onboarding.jsx
// Created: 2025-11-09
// Last-Updated: 25 Dicembre 2025 - 16:15 (CET)
// Author: Claude
// Description: Public onboarding flow - Language selection, goals, and level (no auth required)

import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Eye, Headphones, Hand } from 'lucide-react';
import { useAuthentication } from '../contexts/AuthenticationContext';
import { completeOnboarding } from '../services/userService';
import '../styles/Onboarding.css';

const STEPS = {
  LANGUAGE: 0,
  GOALS: 1,
  LEARNING_STYLE: 2,
  LEVEL: 3
};

const AVAILABLE_LANGUAGES = [
  { code: 'fr', name: 'French', native: 'Français' },
  { code: 'it', name: 'Italian', native: 'Italiano' },
  { code: 'en', name: 'English', native: 'English' },
  { code: 'uk', name: 'Ukrainian', native: 'Українська' }
];

const GOALS = [
  { id: 'travel', key: 'goals.travel' },
  { id: 'work', key: 'goals.work' },
  { id: 'study', key: 'goals.study' },
  { id: 'culture', key: 'goals.culture' },
  { id: 'conversation', key: 'goals.conversation' },
  { id: 'other', key: 'goals.other' }
];

const LEVELS = [
  { code: 'beginner', key: 'levels.beginner' },
  { code: 'elementary', key: 'levels.elementary' },
  { code: 'intermediate', key: 'levels.intermediate' },
  { code: 'advanced', key: 'levels.advanced' },
  { code: 'native', key: 'levels.native' }
];

const LEARNING_STYLES = [
  { id: 'visual', icon: Eye, label: 'Visivo', desc: 'Imparo guardando immagini e video' },
  { id: 'auditory', icon: Headphones, label: 'Uditivo', desc: 'Imparo ascoltando audio e conversazioni' },
  { id: 'kinesthetic', icon: Hand, label: 'Pratico', desc: 'Imparo facendo esercizi e scrivendo' }
];

function Onboarding() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { currentUser, userProfile, setUserProfile } = useAuthentication();
  const [currentStep, setCurrentStep] = useState(STEPS.LANGUAGE);
  const [preferences, setPreferences] = useState({
    targetLanguage: '',
    goals: [],
    learningStyle: '',
    level: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isAuthenticated = Boolean(currentUser);
  const resolvedInterfaceLanguage = userProfile?.interfaceLanguage || i18n.language || 'en';

  useEffect(() => {
    if (isAuthenticated && userProfile?.onboardingCompleted) {
      navigate('/home', { replace: true });
    }
  }, [isAuthenticated, userProfile, navigate]);

  const totalSteps = Object.keys(STEPS).length;
  const progress = ((currentStep + 1) / totalSteps) * 100;

  const handleLanguageSelect = (langCode) => {
    setPreferences(prev => ({ ...prev, targetLanguage: langCode }));
  };

  const handleGoalToggle = (goalId) => {
    setPreferences(prev => ({
      ...prev,
      goals: prev.goals.includes(goalId)
        ? prev.goals.filter(g => g !== goalId)
        : [...prev.goals, goalId]
    }));
  };

  const handleLevelSelect = (levelCode) => {
    setPreferences(prev => ({ ...prev, level: levelCode }));
  };

  const handleLearningStyleSelect = (styleId) => {
    setPreferences(prev => ({ ...prev, learningStyle: styleId }));
  };

  const handleNext = async () => {
    if (currentStep === STEPS.LANGUAGE && !preferences.targetLanguage) {
      alert(t('publicOnboarding.errors.selectLanguage', 'Please select a language'));
      return;
    }
    if (currentStep === STEPS.GOALS && preferences.goals.length === 0) {
      alert(t('publicOnboarding.errors.selectGoal', 'Please select at least one goal'));
      return;
    }
    if (currentStep === STEPS.LEARNING_STYLE && !preferences.learningStyle) {
      alert(t('publicOnboarding.errors.selectStyle', 'Please select your learning style'));
      return;
    }
    if (currentStep === STEPS.LEVEL && !preferences.level) {
      alert(t('publicOnboarding.errors.selectLevel', 'Please select your level'));
      return;
    }

    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
      return;
    }

    if (isAuthenticated) {
      try {
        setIsSubmitting(true);
        await completeOnboarding(currentUser.uid, {
          nativeLanguage: userProfile?.nativeLanguage || 'en',
          targetLanguage: preferences.targetLanguage,
          interfaceLanguage: resolvedInterfaceLanguage,
          level: preferences.level,
          learningStyle: preferences.learningStyle,
          dailyGoals: userProfile?.dailyGoals || 10,
          goals: preferences.goals
        });

        setUserProfile(prev => ({
          ...(prev || {}),
          nativeLanguage: userProfile?.nativeLanguage || 'en',
          targetLanguage: preferences.targetLanguage,
          interfaceLanguage: resolvedInterfaceLanguage,
          level: preferences.level,
          goals: preferences.goals,
          onboardingCompleted: true
        }));

        navigate('/home', { replace: true });
      } catch (error) {
        console.error('Onboarding completion error:', error);
        alert(t('publicOnboarding.errors.generic', 'We could not save your preferences. Please try again.'));
      } finally {
        setIsSubmitting(false);
      }

      return;
    }

    const payload = {
      ...preferences,
      interfaceLanguage: resolvedInterfaceLanguage,
      nativeLanguage: 'en',
      dailyGoals: 10
    };
    sessionStorage.setItem('onboardingPreferences', JSON.stringify(payload));
    navigate('/registration');
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    } else {
      navigate('/');
    }
  };

  const canProceed = () => {
    if (currentStep === STEPS.LANGUAGE) return preferences.targetLanguage !== '';
    if (currentStep === STEPS.GOALS) return preferences.goals.length > 0;
    if (currentStep === STEPS.LEARNING_STYLE) return preferences.learningStyle !== '';
    if (currentStep === STEPS.LEVEL) return preferences.level !== '';
    return false;
  };

  // Shared classes for all cards
  const baseCardClasses = "flex flex-col items-center justify-center p-6 gap-3 transition-all duration-200 ease-in-out cursor-pointer backdrop-blur-md rounded-xl border";
  const unselectedClasses = "bg-slate-800/40 border-slate-700/50 text-slate-300 hover:bg-slate-700/60 hover:border-indigo-400/50 hover:-translate-y-1 hover:shadow-lg hover:shadow-indigo-500/20 hover:text-white";
  const selectedClasses = "border-2 border-indigo-500 bg-indigo-900/30 shadow-xl shadow-indigo-500/40 text-indigo-100";

  const getCardClass = (isSelected) => {
    return `${baseCardClasses} ${isSelected ? selectedClasses : unselectedClasses}`;
  };

  return (
    <div className="public-onboarding-container">
      <div className="public-onboarding-card">
        <div className="onboarding-header">
          <span className="header-title" style={{ fontSize: '2.5rem' }}>LinguaCoon</span>
        </div>

        <div className="progress-container">
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="progress-text">
            {currentStep + 1} / {totalSteps}
          </span>
        </div>

        <div className="step-content">
          {currentStep === STEPS.LANGUAGE && (
            <div className="step">
              <h1>{t('publicOnboarding.language.title', 'Which language do you want to learn?')}</h1>
              <p className="subtitle">
                {t('publicOnboarding.language.subtitle', 'Choose the language you want to study')}
              </p>
              
              <div className="language-selection-grid">
                {AVAILABLE_LANGUAGES.map((lang) => (
                  <button
                    key={lang.code}
                    className={getCardClass(preferences.targetLanguage === lang.code)}
                    onClick={() => handleLanguageSelect(lang.code)}
                  >
                    <span className="language-name-big">{lang.name}</span>
                    <span className="language-native-big">{lang.native}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {currentStep === STEPS.GOALS && (
            <div className="step">
              <h1>{t('publicOnboarding.goals.title', 'Why do you want to learn?')}</h1>
              <p className="subtitle">
                {t('publicOnboarding.goals.subtitle', 'Select one or more goals')}
              </p>
              
              <div className="goals-grid">
                {GOALS.map((goal) => (
                  <button
                    key={goal.id}
                    className={getCardClass(preferences.goals.includes(goal.id))}
                    onClick={() => handleGoalToggle(goal.id)}
                  >
                    <span className="goal-title">
                      {t(`publicOnboarding.${goal.key}`, goal.id)}
                    </span>
                    <span className="goal-desc">
                      {t(`publicOnboarding.${goal.key}_desc`, '')}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {currentStep === STEPS.LEARNING_STYLE && (
            <div className="step">
              <h1>{t('publicOnboarding.style.title', 'Come impari meglio?')}</h1>
              <p className="subtitle">
                {t('publicOnboarding.style.subtitle', 'Seleziona il tuo stile di apprendimento')}
              </p>
              
              <div className="goals-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
                {LEARNING_STYLES.map((style) => {
                  const Icon = style.icon;
                  const isSelected = preferences.learningStyle === style.id;
                  return (
                    <button
                      key={style.id}
                      className={`group ${getCardClass(isSelected)}`}
                      onClick={() => handleLearningStyleSelect(style.id)}
                    >
                      <Icon className={`w-12 h-12 mb-4 transition-colors duration-300 ${isSelected ? 'text-indigo-400' : 'text-slate-400 group-hover:text-white'}`} />
                      <span className="goal-title">{t(`publicOnboarding.style.${style.id}`, style.label)}</span>
                      <span className="goal-desc">{t(`publicOnboarding.style.${style.id}_desc`, style.desc)}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {currentStep === STEPS.LEVEL && (
            <div className="step">
              <h1>{t('publicOnboarding.level.title', "What's your level?")}</h1>
              <p className="subtitle">
                {t('publicOnboarding.level.subtitle', 'In the language you want to learn')}
              </p>
              
              <div className="levels-grid">
                {LEVELS.map((level) => (
                  <button
                    key={level.code}
                    className={getCardClass(preferences.level === level.code)}
                    onClick={() => handleLevelSelect(level.code)}
                  >
                    <span className="level-title">
                      {t(`publicOnboarding.${level.key}`, level.code)}
                    </span>
                    <span className="level-desc">
                      {t(`publicOnboarding.${level.key}_desc`, '')}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="onboarding-actions">
          <button 
            onClick={handleBack}
            className="btn-back"
          >
            {currentStep === 0 ? 'Back to Home' : 'Back'}
          </button>

          <button 
            onClick={handleNext}
            className={`btn-neon ${canProceed() && !isSubmitting ? '' : 'opacity-50 cursor-not-allowed'}`}
            disabled={!canProceed() || isSubmitting}
            style={{ minWidth: '160px' }}
          >
            {currentStep === totalSteps - 1 
              ? (isAuthenticated 
                  ? t('publicOnboarding.finish', 'Save preferences')
                  : t('publicOnboarding.continue', 'Continue'))
              : t('common.next', 'Next')
            }
          </button>
        </div>

        {/* Already have account link */}
        <div className="auth-footer" style={{ marginTop: '1.5rem', textAlign: 'center' }}>
          <p>
            {t('publicOnboarding.hasAccount', 'Already have an account?')}{' '}
            <Link to="/login" style={{ color: '#8b5cf6', fontWeight: '600', textDecoration: 'none' }}>
              {t('publicOnboarding.signIn', 'Sign in')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Onboarding;
