import React from 'react';
import Button from '../ui/Button';

interface SettingsTabProps {
  onSignOut: () => Promise<void>;
}

const SettingsTab: React.FC<SettingsTabProps> = ({ onSignOut }) => {
  return (
    <div className="bg-white rounded-lg shadow-soft p-6">
      <h2 className="text-xl font-medium text-charcoal-800 mb-6">Account Settings</h2>
      
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium text-charcoal-800 mb-2">
            Email Preferences
          </h3>
          <div className="space-y-2">
            <label className="flex items-center space-x-2">
              <input type="checkbox" className="rounded text-gold-400 focus:ring-gold-400" />
              <span className="text-charcoal-600">Order updates</span>
            </label>
            <label className="flex items-center space-x-2">
              <input type="checkbox" className="rounded text-gold-400 focus:ring-gold-400" />
              <span className="text-charcoal-600">Promotional emails</span>
            </label>
            <label className="flex items-center space-x-2">
              <input type="checkbox" className="rounded text-gold-400 focus:ring-gold-400" />
              <span className="text-charcoal-600">New product launches</span>
            </label>
          </div>
        </div>
        
        <div>
          <h3 className="text-lg font-medium text-charcoal-800 mb-2">
            Password
          </h3>
          <Button variant="outline">
            Change Password
          </Button>
        </div>
        
        <div>
          <h3 className="text-lg font-medium text-charcoal-800 mb-2">
            Delete Account
          </h3>
          <p className="text-charcoal-500 text-sm mb-2">
            Once you delete your account, there is no going back. Please be certain.
          </p>
          <Button variant="outline" className="text-error-500 border-error-500 hover:bg-error-50">
            Delete Account
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SettingsTab;