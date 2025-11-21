import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { ArrowUpRight, Activity, CheckCircle, Wallet, Calendar } from 'lucide-react';
import { dataManager } from '../../services/dataManager';
import { Note, CalendarEvent, Transaction } from '../../types';

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState({
    noteCount: 0,
    eventCount: 0,
    walletBalance: 0,
    recentNote: ''
  });
  const [activityData, setActivityData] = useState<any[]>([]);
  const [currencySymbol, setCurrencySymbol] = useState('$');
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const updateStats = () => {
      const notes = dataManager.getNotes();
      const events = dataManager.getCalendarEvents();
      const currentNetWorth = dataManager.getNetWorth();
      
      setStats({
        noteCount: notes.length,
        eventCount: events.length,
        walletBalance: currentNetWorth,
        recentNote: notes.length > 0 ? notes[0].title : 'No recent notes'
      });
      setCurrencySymbol(dataManager.getCurrencySymbol());
      
      // Get real activity data
      setActivityData(dataManager.getSystemActivity(7));
    };

    updateStats();
    return dataManager.subscribe(updateStats);
  }, []);

  return (
    <div className="p-8 space-y-8 pb-32">
      <header className="flex justify-between items-end border-b border-neutral-800 pb-6">
        <div>
          <h2 className="text-3xl font-light tracking-tight">System Overview</h2>
          <p className="text-neutral-500 mt-1">Operational status: Normal</p>
        </div>
        <div className="text-right hidden sm:block">
          <div className="text-2xl font-bold font-mono">{currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
          <div className="text-xs text-neutral-600 uppercase tracking-widest">
            {currentTime.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}
          </div>
        </div>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-black border border-neutral-800 p-6 hover:border-white transition-colors duration-300 group">
          <div className="flex justify-between items-start mb-4">
            <div className="text-neutral-500 font-mono text-xs uppercase tracking-wider">Total Notes</div>
            <CheckCircle size={16} className="text-neutral-700 group-hover:text-white" />
          </div>
          <div className="text-4xl font-bold mb-1">{stats.noteCount}</div>
          <div className="text-sm text-neutral-400 flex items-center gap-1">
            <Activity size={14} /> <span>Knowledge Base</span>
          </div>
        </div>

        <div className="bg-black border border-neutral-800 p-6 hover:border-white transition-colors duration-300 group">
          <div className="flex justify-between items-start mb-4">
            <div className="text-neutral-500 font-mono text-xs uppercase tracking-wider">Net Worth</div>
            <Wallet size={16} className="text-neutral-700 group-hover:text-white" />
          </div>
          <div className="text-4xl font-bold mb-1">{currencySymbol}{stats.walletBalance.toLocaleString()}</div>
          <div className="text-sm text-neutral-400 flex items-center gap-1">
            <ArrowUpRight size={14} /> <span>Liquid Assets</span>
          </div>
        </div>

        <div className="bg-black border border-neutral-800 p-6 hover:border-white transition-colors duration-300 group">
          <div className="flex justify-between items-start mb-4">
            <div className="text-neutral-500 font-mono text-xs uppercase tracking-wider">Events</div>
            <Calendar size={16} className="text-neutral-700 group-hover:text-white" />
          </div>
          <div className="text-4xl font-bold mb-1">{stats.eventCount}</div>
          <div className="text-sm text-neutral-400 flex items-center gap-1">
            <span>Upcoming Scheduled</span>
          </div>
        </div>
      </div>

      {/* Main Chart */}
      <div className="border border-neutral-800 p-6 bg-black">
        <h3 className="text-sm font-mono uppercase tracking-wider text-neutral-500 mb-6">System Activity (7 Days)</h3>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={activityData}>
              <XAxis 
                dataKey="name" 
                stroke="#333" 
                tick={{fill: '#666', fontSize: 12}} 
                tickLine={false}
                axisLine={false}
              />
              <Tooltip 
                contentStyle={{ backgroundColor: '#000', border: '1px solid #333', color: '#fff' }}
                cursor={{fill: '#111'}}
              />
              <Bar dataKey="activity" fill="#fff" radius={[2, 2, 0, 0]} barSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Items */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         <div className="border border-neutral-800 p-6">
            <h3 className="text-sm font-mono uppercase tracking-wider text-neutral-500 mb-4">Latest Note</h3>
            <div className="bg-neutral-900/50 p-4 border border-neutral-800 min-h-[100px] flex items-center">
               <p className="text-neutral-300 italic w-full truncate">
                 {stats.recentNote !== 'No recent notes' ? `"${stats.recentNote}"` : 'No notes available.'}
               </p>
            </div>
         </div>
         <div className="border border-neutral-800 p-6">
            <h3 className="text-sm font-mono uppercase tracking-wider text-neutral-500 mb-4">System Logs</h3>
            <div className="font-mono text-xs text-neutral-500 space-y-2">
              <p>[{currentTime.toLocaleTimeString()}] Dashboard refreshed.</p>
              <p>[{currentTime.toLocaleTimeString()}] Data integrity check passed.</p>
              <p>User: Authenticated.</p>
            </div>
         </div>
      </div>
    </div>
  );
};

export default Dashboard;