import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Gem, Sparkles, Diamond, DollarSign } from 'lucide-react';
import Button from '../ui/Button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Input } from '../ui/input';
import { Label } from '../ui/label';

interface PreferencesFormProps {
  onSubmit: (preferences: any) => void;
}

const PreferencesForm: React.FC<PreferencesFormProps> = ({ onSubmit }) => {
  const { t } = useTranslation();
  const [preferences, setPreferences] = useState({
    jewelryType: '',
    metalPreference: '',
    category: '',
    style: '',
    budget: '',
  });

  const handleChange = (field: string, value: string) => {
    setPreferences(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(preferences);
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="text-center mb-6">
        <h3 className="text-xl font-medium text-charcoal-800 mb-2">
          {t('assistant.preferences.title')}
        </h3>
        <p className="text-charcoal-500">
          {t('assistant.preferences.subtitle', 'Tell us what you\'re looking for')}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label className="flex items-center">
            <Gem className="h-4 w-4 mr-2 text-gold-500" />
            {t('assistant.preferences.jewelryType')}
          </Label>
          <Select
            value={preferences.jewelryType}
            onValueChange={(value) => handleChange('jewelryType', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder={t('assistant.placeholders.selectType', 'Select type')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ring">{t('assistant.options.categories.ring')}</SelectItem>
              <SelectItem value="earrings">{t('assistant.options.categories.earrings')}</SelectItem>
              <SelectItem value="necklace">{t('assistant.options.categories.necklace')}</SelectItem>
              <SelectItem value="bangles">{t('assistant.options.categories.bangles')}</SelectItem>
              <SelectItem value="bracelet">{t('assistant.options.categories.bracelet')}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="flex items-center">
            <Sparkles className="h-4 w-4 mr-2 text-gold-500" />
            {t('assistant.preferences.metalPreference')}
          </Label>
          <Select
            value={preferences.metalPreference}
            onValueChange={(value) => handleChange('metalPreference', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder={t('assistant.placeholders.selectMetal', 'Select metal')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="gold">{t('assistant.options.metals.gold')}</SelectItem>
              <SelectItem value="silver">{t('assistant.options.metals.silver')}</SelectItem>
              <SelectItem value="roseGold">{t('assistant.options.metals.roseGold')}</SelectItem>
              <SelectItem value="platinum">{t('assistant.options.metals.platinum')}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="flex items-center">
            <Diamond className="h-4 w-4 mr-2 text-gold-500" />
            {t('assistant.preferences.style')}
          </Label>
          <Select
            value={preferences.style}
            onValueChange={(value) => handleChange('style', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder={t('assistant.placeholders.selectStyle', 'Select style')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="bridal">{t('assistant.options.styles.bridal')}</SelectItem>
              <SelectItem value="daily">{t('assistant.options.styles.daily')}</SelectItem>
              <SelectItem value="casual">{t('assistant.options.styles.casual')}</SelectItem>
              <SelectItem value="custom">{t('assistant.options.styles.custom')}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="flex items-center">
            <DollarSign className="h-4 w-4 mr-2 text-gold-500" />
            {t('assistant.preferences.budget')}
          </Label>
          <Select
            value={preferences.budget}
            onValueChange={(value) => handleChange('budget', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder={t('assistant.placeholders.selectBudget', 'Select budget range')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0-1000">₹0 - ₹1,000</SelectItem>
              <SelectItem value="1000-5000">₹1,000 - ₹5,000</SelectItem>
              <SelectItem value="5000-10000">₹5,000 - ₹10,000</SelectItem>
              <SelectItem value="10000-50000">₹10,000 - ₹50,000</SelectItem>
              <SelectItem value="50000+">₹50,000+</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button 
          type="submit" 
          className="w-full mt-6"
          disabled={!preferences.jewelryType || !preferences.metalPreference || !preferences.style || !preferences.budget}
        >
          {t('assistant.actions.continue', 'Continue')}
        </Button>
      </form>
    </div>
  );
};

export default PreferencesForm;