import React, { useState, useEffect } from 'react';
import { Moon, Volume2, Shield, LogOut, Key, Check, AlertCircle, RotateCcw, Globe, Database } from 'lucide-react';
import { dataManager } from '../../services/dataManager';

const Settings: React.FC = () => {
  const [apiKey, setApiKey] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const storedKey = localStorage.getItem('gemini_api_key');
    if (storedKey) setApiKey(storedKey);
    setCurrency(dataManager.getCurrency());
  }, []);

  const handleSaveKey = () => {
    if (apiKey.trim()) {
      localStorage.setItem('gemini_api_key', apiKey.trim());
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  };

  const handleCurrencyChange = (newCurrency: string) => {
      setCurrency(newCurrency);
      dataManager.setCurrency(newCurrency);
  };

  const handleClearData = () => {
      if(confirm("WARNING: This will delete ALL your data (Notes, Transactions, Cards, etc.). The app will return to a blank state. Are you sure?")) {
          dataManager.clearAllData();
          // Force reload to ensure all components re-mount with clean state
          window.location.reload();
      }
  };

  const handleLoadDemo = () => {
      if(confirm("This will overwrite your current wallet data with demo data. Continue?")) {
          dataManager.loadDemoData();
      }
  };

  return (
    <div className="p-8 max-w-2xl mx-auto pb-32">
        <h2 className="text-2xl font-light mb-8">System Configuration</h2>
        
        <div className="space-y-6">
            {/* API Key Section */}
            <section className="border border-neutral-800 p-6 bg-neutral-900/50">
                <h3 className="text-sm font-mono uppercase text-neutral-500 mb-4 flex items-center gap-2">
                    <Key size={14} /> AI Configuration
                </h3>
                <div className="space-y-4">
                    <div>
                        <label className="text-sm text-neutral-300 block mb-2">Gemini API Key</label>
                        <div className="flex gap-2">
                            <input 
                                type="password" 
                                value={apiKey}
                                onChange={(e) => setApiKey(e.target.value)}
                                placeholder="sk-..."
                                className="flex-1 bg-black border border-neutral-800 px-4 py-2 text-white text-sm focus:outline-none focus:border-white transition-colors"
                            />
                            <button 
                                onClick={handleSaveKey}
                                className="bg-white text-black px-6 py-2 text-sm font-bold hover:bg-neutral-200 transition-colors flex items-center gap-2"
                            >
                                {saved ? <Check size={16} /> : 'SAVE'}
                            </button>
                        </div>
                        <p className="text-xs text-neutral-500 mt-2">
                            Required for "Brain" functionality. Stored locally on your device.
                        </p>
                    </div>
                </div>
            </section>

             <section className="border border-neutral-800 p-6">
                <h3 className="text-sm font-mono uppercase text-neutral-500 mb-4 flex items-center gap-2">
                    <Globe size={14} /> Localization
                </h3>
                <div className="flex items-center justify-between py-2">
                    <span className="text-sm text-neutral-300">Currency</span>
                    <select 
                       value={currency} 
                       onChange={(e) => handleCurrencyChange(e.target.value)}
                       className="bg-black border border-neutral-800 text-white text-xs px-3 py-2 focus:outline-none focus:border-white cursor-pointer"
                    >
                       <option value="USD">USD ($)</option>
                       <option value="EUR">EUR (€)</option>
                       <option value="GBP">GBP (£)</option>
                       <option value="JPY">JPY (¥)</option>
                       <option value="INR">INR (₹)</option>
                    </select>
                </div>
            </section>

            <section className="border border-neutral-800 p-6">
                <h3 className="text-sm font-mono uppercase text-neutral-500 mb-4 flex items-center gap-2">
                    <Moon size={14} /> Appearance
                </h3>
                <div className="flex items-center justify-between py-2 border-b border-neutral-900">
                    <span className="text-sm text-neutral-300">Theme</span>
                    <span className="text-xs font-mono bg-white text-black px-2 py-1">DARK (FORCED)</span>
                </div>
                <div className="flex items-center justify-between py-2 pt-4">
                    <span className="text-sm text-neutral-300">Reduced Motion</span>
                    <div className="w-10 h-5 bg-neutral-800 rounded-full relative cursor-pointer">
                        <div className="absolute left-1 top-1 w-3 h-3 bg-neutral-500 rounded-full"></div>
                    </div>
                </div>
            </section>

            <section className="border border-neutral-800 p-6">
                <h3 className="text-sm font-mono uppercase text-neutral-500 mb-4 flex items-center gap-2">
                    <Shield size={14} /> Data Management
                </h3>
                <div className="flex items-center justify-between py-2 border-b border-neutral-900">
                    <div className="flex flex-col">
                        <span className="text-sm text-neutral-300">Demo Data</span>
                        <span className="text-[10px] text-neutral-500">Populate wallet with sample data</span>
                    </div>
                    <button onClick={handleLoadDemo} className="px-3 py-1 border border-neutral-800 text-xs hover:bg-white hover:text-black flex items-center gap-2 transition-colors">
                        <Database size={12} /> LOAD DEMO
                    </button>
                </div>
                <div className="flex items-center justify-between py-2 pt-4">
                    <div className="flex flex-col">
                         <span className="text-sm text-neutral-300">Factory Reset</span>
                         <span className="text-[10px] text-neutral-500">Permanently delete all data</span>
                    </div>
                    <button onClick={handleClearData} className="px-3 py-1 bg-red-900/20 border border-red-900 text-xs text-red-500 hover:bg-red-900/40 flex items-center gap-2 transition-colors">
                        <RotateCcw size={12} /> RESET EVERYTHING
                    </button>
                </div>
            </section>

             <section className="border border-neutral-800 p-6">
                <h3 className="text-sm font-mono uppercase text-neutral-500 mb-4 flex items-center gap-2">
                    <Volume2 size={14} /> Notifications
                </h3>
                <div className="flex items-center justify-between py-2">
                    <span className="text-sm text-neutral-300">Sound Effects</span>
                    <div className="w-10 h-5 bg-white rounded-full relative cursor-pointer">
                        <div className="absolute right-1 top-1 w-3 h-3 bg-black rounded-full"></div>
                    </div>
                </div>
            </section>

            <button className="w-full border border-neutral-800 p-4 text-neutral-500 hover:bg-white hover:text-black hover:border-white transition-colors flex items-center justify-center gap-2">
                <LogOut size={16} />
                LOGOUT
            </button>
        </div>
    </div>
  );
};

export default Settings;