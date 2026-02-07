import React, { useState } from 'react';
import { CheckCircle, Globe, Database, Settings } from 'lucide-react';

interface SetupWizardProps {
  onComplete: (config: SetupConfig) => void;
}

export interface SetupConfig {
  language: 'en' | 'fr';
  preProgram: boolean;
  spartakus: boolean;
  clientName: string;
}

export function SetupWizard({ onComplete }: SetupWizardProps) {
  const [language, setLanguage] = useState<'en' | 'fr'>('fr');
  const [preProgram, setPreProgram] = useState(false);
  const [spartakus, setSpartakus] = useState(false);
  const [clientName, setClientName] = useState('');

  const handleSubmit = () => {
    if (!clientName.trim()) {
      alert(language === 'fr' ? 'Veuillez entrer un nom de client' : 'Please enter a client name');
      return;
    }
    
    onComplete({
      language,
      preProgram,
      spartakus,
      clientName: clientName.trim(),
    });
  };

  const texts = {
    fr: {
      title: 'Configuration du classeur',
      language: 'Souhaitez-vous que le classeur soit rempli en anglais?',
      preProgram: 'Souhaitez-vous essayer de pré-programmer le classeur avec des données?',
      spartakus: 'Souhaitez-vous que le classeur soit préparé pour Spartakus?',
      clientName: 'Quel est le nom du client?',
      clientPlaceholder: 'Entrez le nom du client...',
      yes: 'Oui',
      no: 'Non',
      continue: 'Continuer',
    },
    en: {
      title: 'Workbook Configuration',
      language: 'Would you like the workbook to be populated in English?',
      preProgram: 'Would you like to try and pre-program the workbook with data?',
      spartakus: 'Would you like the workbook to be prepared for Spartakus?',
      clientName: 'Name the sheet that will be created',
      clientPlaceholder: 'Enter client name...',
      yes: 'Yes',
      no: 'No',
      continue: 'Continue',
    },
  };

  const t = texts[language];

  return (
    <div className="bg-white rounded-2xl shadow-2xl p-8 w-full">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4">
          <Settings className="text-white" size={32} />
        </div>
        <h1 className="text-3xl font-bold text-gray-900">{t.title}</h1>
      </div>

        <div className="space-y-6">
          {/* Question 1: Language */}
          <div className="bg-gray-50 rounded-xl p-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 mt-1">
                <Globe className="text-blue-600" size={24} />
              </div>
              <div className="flex-1">
                <label className="block text-lg font-semibold text-gray-900 mb-3">
                  {t.language}
                </label>
                <div className="flex gap-3">
                  <button
                    onClick={() => setLanguage('en')}
                    className={`flex-1 px-6 py-3 rounded-lg font-semibold transition-all ${
                      language === 'en'
                        ? 'bg-blue-600 text-white shadow-lg'
                        : 'bg-white text-gray-700 border-2 border-gray-300 hover:border-blue-400'
                    }`}
                  >
                    {t.yes}
                  </button>
                  <button
                    onClick={() => setLanguage('fr')}
                    className={`flex-1 px-6 py-3 rounded-lg font-semibold transition-all ${
                      language === 'fr'
                        ? 'bg-blue-600 text-white shadow-lg'
                        : 'bg-white text-gray-700 border-2 border-gray-300 hover:border-blue-400'
                    }`}
                  >
                    {t.no}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Question 2: Pre-program */}
          <div className="bg-gray-50 rounded-xl p-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 mt-1">
                <Database className="text-green-600" size={24} />
              </div>
              <div className="flex-1">
                <label className="block text-lg font-semibold text-gray-900 mb-3">
                  {t.preProgram}
                </label>
                <div className="flex gap-3">
                  <button
                    onClick={() => setPreProgram(true)}
                    className={`flex-1 px-6 py-3 rounded-lg font-semibold transition-all ${
                      preProgram
                        ? 'bg-green-600 text-white shadow-lg'
                        : 'bg-white text-gray-700 border-2 border-gray-300 hover:border-green-400'
                    }`}
                  >
                    {t.yes}
                  </button>
                  <button
                    onClick={() => setPreProgram(false)}
                    className={`flex-1 px-6 py-3 rounded-lg font-semibold transition-all ${
                      !preProgram
                        ? 'bg-green-600 text-white shadow-lg'
                        : 'bg-white text-gray-700 border-2 border-gray-300 hover:border-green-400'
                    }`}
                  >
                    {t.no}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Question 3: Spartakus */}
          <div className="bg-gray-50 rounded-xl p-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 mt-1">
                <Settings className="text-purple-600" size={24} />
              </div>
              <div className="flex-1">
                <label className="block text-lg font-semibold text-gray-900 mb-3">
                  {t.spartakus}
                </label>
                <div className="flex gap-3">
                  <button
                    onClick={() => setSpartakus(true)}
                    className={`flex-1 px-6 py-3 rounded-lg font-semibold transition-all ${
                      spartakus
                        ? 'bg-purple-600 text-white shadow-lg'
                        : 'bg-white text-gray-700 border-2 border-gray-300 hover:border-purple-400'
                    }`}
                  >
                    {t.yes}
                  </button>
                  <button
                    onClick={() => setSpartakus(false)}
                    className={`flex-1 px-6 py-3 rounded-lg font-semibold transition-all ${
                      !spartakus
                        ? 'bg-purple-600 text-white shadow-lg'
                        : 'bg-white text-gray-700 border-2 border-gray-300 hover:border-purple-400'
                    }`}
                  >
                    {t.no}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Question 4: Client Name */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border-2 border-blue-200">
            <label className="block text-lg font-semibold text-gray-900 mb-3">
              {t.clientName}
            </label>
            <input
              type="text"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder={t.clientPlaceholder}
              className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              onKeyPress={(e) => {
                if (e.key === 'Enter') handleSubmit();
              }}
            />
          </div>

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            disabled={!clientName.trim()}
            className="w-full flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-lg font-bold rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:from-blue-600 disabled:hover:to-indigo-600"
          >
            <CheckCircle size={24} />
            {t.continue}
          </button>
        </div>
    </div>
  );
}
