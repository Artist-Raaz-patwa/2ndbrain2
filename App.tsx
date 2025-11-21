import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import CommandBar from './components/CommandBar';
import Dashboard from './components/views/Dashboard';
import Notes from './components/views/Notes';
import Calendar from './components/views/Calendar';
import CRM from './components/views/CRM';
import Wallet from './components/views/Wallet';
import Settings from './components/views/Settings';
import { View, Message } from './types';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>(View.DASHBOARD);
  const [messages, setMessages] = useState<Message[]>([]);

  const renderView = () => {
    switch (currentView) {
      case View.DASHBOARD: return <Dashboard />;
      case View.NOTES: return <Notes />;
      case View.CALENDAR: return <Calendar />;
      case View.CRM: return <CRM />;
      case View.WALLET: return <Wallet />;
      case View.SETTINGS: return <Settings />;
      default: return <Dashboard />;
    }
  };

  const handleNewMessage = (msg: Message) => {
    setMessages(prev => [...prev, msg]);
    // Simple navigation logic via chat
    const lowerText = msg.text.toLowerCase();
    if (msg.role === 'user') {
       if (lowerText.includes('dashboard')) setCurrentView(View.DASHBOARD);
       else if (lowerText.includes('notes')) setCurrentView(View.NOTES);
       else if (lowerText.includes('calendar')) setCurrentView(View.CALENDAR);
       else if (lowerText.includes('crm')) setCurrentView(View.CRM);
       else if (lowerText.includes('wallet')) setCurrentView(View.WALLET);
       else if (lowerText.includes('settings')) setCurrentView(View.SETTINGS);
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-black text-white font-sans selection:bg-white selection:text-black">
      <Sidebar currentView={currentView} onChangeView={setCurrentView} />
      
      <main className="flex-1 relative flex flex-col h-full overflow-hidden">
        {/* Content Area */}
        <div className="flex-1 overflow-y-auto scroll-smooth">
          {renderView()}
        </div>

        {/* Command Bar Overlay */}
        <CommandBar messages={messages} onNewMessage={handleNewMessage} />
      </main>
    </div>
  );
};

export default App;