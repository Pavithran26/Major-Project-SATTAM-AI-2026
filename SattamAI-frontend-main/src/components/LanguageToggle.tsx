'use client';

import { Globe } from 'lucide-react';

interface LanguageToggleProps {
  language: 'en' | 'ta';
  onLanguageChange: (language: 'en' | 'ta') => void;
}

export default function LanguageToggle({ language, onLanguageChange }: LanguageToggleProps) {
  const toggleLanguage = () => {
    onLanguageChange(language === 'en' ? 'ta' : 'en');
  };

  return (
    <button
      onClick={toggleLanguage}
      className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-emerald-300 bg-white px-4 py-2 text-sm font-semibold text-emerald-900 shadow-sm transition-all hover:-translate-y-0.5 hover:bg-emerald-50 hover:shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
      aria-label={language === 'en' ? 'Switch language to Tamil' : 'Switch language to English'}
    >
      <Globe className="w-4 h-4" />
      <span className="font-medium">
        {language === 'en' ? 'English' : 'தமிழ்'}
      </span>
    </button>
  );
}
