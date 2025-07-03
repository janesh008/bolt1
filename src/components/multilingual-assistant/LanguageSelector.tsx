import React from 'react';
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';
import Button from '../ui/Button';

interface LanguageSelectorProps {
  onLanguageSelected: (language: string) => void;
}

interface Language {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
}

const languages: Language[] = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳' },
  { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી', flag: '🇮🇳' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', flag: '🇮🇳' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', flag: '🇮🇳' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी', flag: '🇮🇳' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', flag: '🇮🇳' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇦🇪' }
];

const LanguageSelector: React.FC<LanguageSelectorProps> = ({ onLanguageSelected }) => {
  const { t } = useTranslation();

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-gold-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Globe className="h-8 w-8 text-gold-500" />
        </div>
        <h3 className="text-xl font-medium text-charcoal-800 mb-2">
          {t('assistant.languageSelector')}
        </h3>
        <p className="text-charcoal-500">
          Please select your preferred language to continue
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 max-h-60 overflow-y-auto pr-1">
        {languages.map((language) => (
          <Button
            key={language.code}
            variant="outline"
            onClick={() => onLanguageSelected(language.code)}
            className="flex items-center justify-start py-3 px-4 hover:bg-gold-50 hover:border-gold-300"
          >
            <span className="text-xl mr-3">{language.flag}</span>
            <div className="text-left">
              <div className="font-medium">{language.name}</div>
              <div className="text-xs text-charcoal-500">{language.nativeName}</div>
            </div>
          </Button>
        ))}
      </div>
    </div>
  );
};

export default LanguageSelector;