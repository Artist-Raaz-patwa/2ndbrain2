import React from 'react';
import { View } from '../types';
import { 
  LayoutDashboard, 
  FileText, 
  Calendar as CalendarIcon, 
  Users, 
  Wallet as WalletIcon, 
  Settings as SettingsIcon,
  Brain
} from 'lucide-react';

interface SidebarProps {
  currentView: View;
  onChangeView: (view: View) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, onChangeView }) => {
  const menuItems = [
    { id: View.DASHBOARD, label: 'Dashboard', icon: LayoutDashboard },
    { id: View.NOTES, label: 'Notes', icon: FileText },
    { id: View.CALENDAR, label: 'Calendar', icon: CalendarIcon },
    { id: View.CRM, label: 'CRM', icon: Users },
    { id: View.WALLET, label: 'Wallet', icon: WalletIcon },
    { id: View.SETTINGS, label: 'Settings', icon: SettingsIcon },
  ];

  return (
    <aside className="w-64 h-full border-r border-neutral-800 flex flex-col bg-black text-white hidden md:flex">
      <div className="p-6 flex items-center gap-3 border-b border-neutral-800">
        <div className="p-2 bg-white text-black rounded-sm">
          <Brain size={20} />
        </div>
        <h1 className="text-xl font-bold tracking-tighter">2ndBrain</h1>
      </div>

      <nav className="flex-1 py-6 px-3 space-y-1">
        {menuItems.map((item) => {
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onChangeView(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-all duration-200 group ${
                isActive 
                  ? 'bg-white text-black font-semibold' 
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
              }`}
            >
              <item.icon size={18} className={isActive ? 'stroke-2' : 'stroke-1'} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-6 border-t border-neutral-800">
        <div className="text-xs text-neutral-600 font-mono">
          STATUS: ONLINE<br/>
          V. 2.0.1
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;