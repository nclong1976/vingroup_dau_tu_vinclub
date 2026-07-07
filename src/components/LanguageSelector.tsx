import React, { useState, useEffect } from 'react';
import { useLLM } from '../hooks/useLLM';
import { Globe } from 'lucide-react';

interface LanguageSelectorProps {
  onLanguageChange: (language: string) => void;
  currentLanguage: string;
}

export function LanguageSelector({
  onLanguageChange,
  currentLanguage
}: LanguageSelectorProps) {
  const { isInitialized } = useLLM();
  const [languages] = useState([
    { code: 'vi', name: 'Tiếng Việt' },
    { code: 'en', name: 'English' },
    { code: 'ja', name: '日本語' },
    { code: 'ko', name: '한국어' },
    { code: 'zh', name: '中文' }
  ]);

  if (!isInitialized) {
    return (
      <div className="flex items-center gap-2 p-2 bg-gray-100 rounded">
        <Globe size={20} />
        <span className="text-sm text-gray-500">Language service loading...</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <Globe size={20} className="text-gray-600" />
      <select
        value={currentLanguage}
        onChange={(e) => onLanguageChange(e.target.value)}
        className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {languages.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.name}
          </option>
        ))}
      </select>
    </div>
  );
}
