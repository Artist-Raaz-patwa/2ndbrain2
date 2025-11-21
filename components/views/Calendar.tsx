
import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';
import { Check, Plus, Trash2, BarChart2, X, Edit2, Save, Settings } from 'lucide-react';
import { dataManager } from '../../services/dataManager';
import { CalendarEvent, Habit, HabitLog } from '../../types';

const Calendar: React.FC = () => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [habitLogs, setHabitLogs] = useState<HabitLog>({});
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showStats, setShowStats] = useState(false);
  const [showHabitManager, setShowHabitManager] = useState(false);
  
  // Stats Data
  const [statsData, setStatsData] = useState<{ 
    barData: any[], 
    lineData: any[], 
    streaks: any[], 
    dayOfWeekData: any[] 
  }>({ 
    barData: [], 
    lineData: [], 
    streaks: [],
    dayOfWeekData: []
  });
  
  // Habit Manager Form State
  const [editingHabitId, setEditingHabitId] = useState<string | null>(null);
  const [editHabitName, setEditHabitName] = useState('');
  const [newHabitName, setNewHabitName] = useState('');

  useEffect(() => {
    const refresh = () => {
      setEvents(dataManager.getCalendarEvents());
      setHabits(dataManager.getHabits());
      setHabitLogs(dataManager.getHabitLogs());
      setStatsData(dataManager.getHabitStats());
    };
    refresh();
    // Initialize selectedDate to today formatted
    if (!selectedDate) setSelectedDate(new Date().toISOString().split('T')[0]);
    return dataManager.subscribe(refresh);
  }, [selectedDate]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 = Sunday

  // Helper to format date key
  const getDateKey = (day: number) => {
    return `${year}-${(month + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
  };

  // Helper to calculate cell styles based on productivity
  const getDayStyle = (day: number) => {
    const dateKey = getDateKey(day);
    const productivity = dataManager.getDailyProductivity(dateKey); // 0.0 to 1.0
    
    // Calculate Grayscale intensity (0 = Black, 255 = White)
    const intensity = Math.round(productivity * 255);
    
    return {
      backgroundColor: `rgb(${intensity}, ${intensity}, ${intensity})`,
      color: productivity > 0.5 ? '#000' : '#fff', // Text contrast
      borderColor: productivity > 0.1 ? `rgba(0,0,0,0.2)` : '#333'
    };
  };

  const handleDateClick = (day: number) => {
    setSelectedDate(getDateKey(day));
    setShowStats(false);
  };

  const toggleHabit = (habitId: string) => {
    if (selectedDate) {
      dataManager.toggleHabit(selectedDate, habitId);
    }
  };

  const handleAddHabit = (e: React.FormEvent) => {
    e.preventDefault();
    if(newHabitName.trim()) {
      dataManager.addHabit(newHabitName);
      setNewHabitName('');
    }
  };

  const handleUpdateHabit = (id: string) => {
      if(editHabitName.trim()) {
          dataManager.updateHabit(id, editHabitName);
          setEditingHabitId(null);
          setEditHabitName('');
      }
  };

  const handleDeleteHabit = (id: string) => {
    if(confirm("Delete this habit? Historic logs will be preserved but it won't appear in the list.")) {
      dataManager.deleteHabit(id);
    }
  };

  const currentMonthName = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const gridCells = [];
  for (let i = 0; i < firstDayOfMonth; i++) gridCells.push(null);
  for (let i = 1; i <= daysInMonth; i++) gridCells.push(i);

  const selectedEvents = events.filter(e => e.date === selectedDate);
  const selectedHabitIds = selectedDate && habitLogs[selectedDate] ? habitLogs[selectedDate] : [];
  const completionPercentage = habits.length > 0 ? Math.round((selectedHabitIds.length / habits.length) * 100) : 0;

  return (
    <div className="p-8 h-full pb-32 flex flex-col md:flex-row gap-8 overflow-hidden relative">
      
      {/* Left: Calendar Heatmap or Stats */}
      <div className="flex-1 flex flex-col min-h-0">
        <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-light tracking-tight uppercase">{showStats ? 'Analytics' : currentMonthName}</h2>
              <p className="text-neutral-500 text-xs mt-1 font-mono">
                  {showStats ? 'PERFORMANCE METRICS' : 'PRODUCTIVITY HEATMAP'}
              </p>
            </div>
            <div className="flex gap-2">
                <button 
                  onClick={() => setShowStats(!showStats)} 
                  className={`px-3 py-2 border ${showStats ? 'bg-white text-black border-white' : 'border-neutral-800 hover:bg-neutral-900'} transition-colors flex items-center gap-2`}
                  title="Productivity Analytics"
                >
                  <BarChart2 size={16} />
                  <span className="text-xs font-bold hidden md:inline">ANALYTICS</span>
                </button>
                {!showStats && (
                    <button 
                    onClick={() => {
                        const today = new Date();
                        // Only reset selection, navigation to actual month not implemented for simplicity
                        setSelectedDate(today.toISOString().split('T')[0]);
                    }}
                    className="px-3 py-2 border border-neutral-800 text-xs hover:bg-white hover:text-black transition-colors"
                    >
                    TODAY
                    </button>
                )}
            </div>
        </div>

        {/* Content Switcher */}
        {showStats ? (
          <div className="flex-1 overflow-y-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 pr-2 custom-scrollbar">
            
            {/* Row 1: Consistency & Streaks */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 border border-neutral-800 bg-black p-6">
                    <h3 className="text-sm font-mono uppercase text-neutral-500 mb-6">Consistency Trend (14 Days)</h3>
                    <div className="h-48 w-full">
                        <ResponsiveContainer>
                        <LineChart data={statsData.lineData}>
                            <XAxis dataKey="date" stroke="#333" tick={{fill: '#666', fontSize: 10}} axisLine={false} tickLine={false} />
                            <YAxis stroke="#333" tick={{fill: '#666', fontSize: 10}} axisLine={false} tickLine={false} />
                            <Tooltip contentStyle={{ backgroundColor: '#000', border: '1px solid #333' }} />
                            <Line type="monotone" dataKey="score" stroke="#fff" strokeWidth={2} dot={{r: 3, fill: '#000', stroke: '#fff', strokeWidth: 2}} />
                        </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
                <div className="border border-neutral-800 bg-black p-6 flex flex-col">
                     <h3 className="text-sm font-mono uppercase text-neutral-500 mb-4">Current Streaks</h3>
                     <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar">
                         {statsData.streaks.length === 0 ? (
                             <div className="text-neutral-600 text-xs italic">No habits active.</div>
                         ) : (
                             statsData.streaks.sort((a,b) => b.streak - a.streak).map(s => (
                                 <div key={s.id} className="flex justify-between items-center p-2 bg-neutral-900/50 border border-neutral-800">
                                     <span className="text-xs font-medium text-neutral-300 truncate w-24" title={s.title}>{s.title}</span>
                                     <div className="flex items-center gap-1">
                                         <span className="text-lg font-bold text-white">{s.streak}</span>
                                         <span className="text-[10px] text-neutral-500 uppercase">Days</span>
                                     </div>
                                 </div>
                             ))
                         )}
                     </div>
                </div>
            </div>

            {/* Row 2: Pattern Radar & Day Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="border border-neutral-800 bg-black p-6">
                    <h3 className="text-sm font-mono uppercase text-neutral-500 mb-2">Habit Balance</h3>
                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={statsData.barData}>
                                <PolarGrid stroke="#333" />
                                <PolarAngleAxis dataKey="name" tick={{ fill: '#999', fontSize: 10 }} />
                                <PolarRadiusAxis angle={30} domain={[0, 'dataMax']} tick={false} axisLine={false} />
                                <Radar name="Completions" dataKey="count" stroke="#fff" fill="#fff" fillOpacity={0.3} />
                                <Tooltip contentStyle={{ backgroundColor: '#000', border: '1px solid #333' }} />
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                 <div className="border border-neutral-800 bg-black p-6">
                    <h3 className="text-sm font-mono uppercase text-neutral-500 mb-6">Day of Week Performance</h3>
                    <div className="h-64 w-full">
                        <ResponsiveContainer>
                        <BarChart data={statsData.dayOfWeekData}>
                            <XAxis dataKey="day" stroke="#333" tick={{fill: '#666', fontSize: 12}} axisLine={false} tickLine={false} />
                            <Tooltip contentStyle={{ backgroundColor: '#000', border: '1px solid #333' }} cursor={{fill: '#111'}} />
                            <Bar dataKey="completions" fill="#fff" radius={[4, 4, 0, 0]} barSize={30} />
                        </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

          </div>
        ) : (
          <div className="flex-1 flex flex-col border border-neutral-800">
            <div className="grid grid-cols-7 bg-black border-b border-neutral-800">
                {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(day => (
                    <div key={day} className="text-center text-[10px] font-mono text-neutral-500 py-3">
                        {day}
                    </div>
                ))}
            </div>
            <div className="grid grid-cols-7 auto-rows-fr flex-1 bg-neutral-900 gap-px border border-neutral-900">
                {gridCells.map((day, index) => {
                    if (day === null) return <div key={`empty-${index}`} className="bg-black"></div>;
                    
                    const dateKey = getDateKey(day);
                    const isSelected = dateKey === selectedDate;
                    const style = getDayStyle(day);
                    
                    return (
                        <div 
                            key={day} 
                            onClick={() => handleDateClick(day)}
                            style={style}
                            className={`relative cursor-pointer transition-all duration-300 hover:z-10 hover:scale-105 hover:shadow-xl p-2 flex flex-col justify-between group ${isSelected ? 'ring-2 ring-blue-500 z-20' : ''}`}
                        >
                            <span className="text-xs font-bold font-mono">{day}</span>
                            <div className="flex gap-0.5 justify-end">
                               {events.filter(e => e.date === dateKey).map((_, i) => (
                                   <div key={i} className={`w-1 h-1 rounded-full ${style.color === '#000' ? 'bg-black' : 'bg-white'}`}></div>
                               ))}
                            </div>
                        </div>
                    );
                })}
            </div>
            <div className="p-4 flex justify-between items-center text-[10px] text-neutral-500 font-mono uppercase bg-black border-t border-neutral-800">
                 <span>0%</span>
                 <div className="flex gap-1">
                     <div className="w-4 h-4 bg-black border border-neutral-800"></div>
                     <div className="w-4 h-4 bg-neutral-800 border border-neutral-700"></div>
                     <div className="w-4 h-4 bg-neutral-500"></div>
                     <div className="w-4 h-4 bg-white"></div>
                 </div>
                 <span>100%</span>
            </div>
          </div>
        )}
      </div>

      {/* Right: Sidebar (Day Detail) */}
      <div className="w-full md:w-80 border-l border-neutral-800 pl-0 md:pl-8 flex flex-col min-h-0">
        
        {/* Date Header */}
        <div className="mb-6 pb-6 border-b border-neutral-800">
           <h3 className="text-sm font-mono text-neutral-500 uppercase mb-1">Selected Date</h3>
           <div className="text-3xl font-light text-white">
               {selectedDate ? new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) : 'Select a date'}
           </div>
           
           <div className="mt-4">
               <div className="flex justify-between text-xs text-neutral-400 mb-1">
                   <span>Daily Score</span>
                   <span>{completionPercentage}%</span>
               </div>
               <div className="h-1 bg-neutral-800 w-full overflow-hidden">
                   <div 
                     className="h-full bg-white transition-all duration-500"
                     style={{ width: `${completionPercentage}%` }}
                   ></div>
               </div>
           </div>
        </div>

        {/* Habits Section */}
        <div className="flex-1 overflow-y-auto pr-2 mb-6 custom-scrollbar">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-mono uppercase text-neutral-500">Daily Habits</h3>
                <button 
                    onClick={() => setShowHabitManager(true)} 
                    className="text-neutral-500 hover:text-white flex items-center gap-1 text-xs border border-neutral-800 px-2 py-1 hover:bg-neutral-900"
                >
                    <Settings size={12}/> MANAGE
                </button>
            </div>

            {habits.length === 0 ? (
                <div className="text-center text-neutral-600 text-sm py-8 border border-dashed border-neutral-800 rounded-lg">
                    <p className="italic mb-2">No habits defined.</p>
                    <button 
                        onClick={() => setShowHabitManager(true)}
                        className="text-xs font-bold text-white underline"
                    >
                        Create your first habit
                    </button>
                </div>
            ) : (
                <div className="space-y-2">
                    {habits.map(habit => {
                        const isCompleted = selectedHabitIds.includes(habit.id);
                        return (
                            <div key={habit.id} className="group flex items-center justify-between p-3 border border-neutral-800 hover:border-neutral-600 bg-black transition-colors cursor-pointer" onClick={() => toggleHabit(habit.id)}>
                                <div className="flex items-center gap-3 flex-1 text-left">
                                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${isCompleted ? 'bg-white border-white text-black' : 'border-neutral-600 text-transparent hover:border-white'}`}>
                                        <Check size={12} strokeWidth={3} />
                                    </div>
                                    <span className={`text-sm select-none ${isCompleted ? 'text-neutral-500 line-through' : 'text-white'}`}>{habit.title}</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>

        {/* Events Section */}
        <div className="border-t border-neutral-800 pt-6">
             <h3 className="text-sm font-mono uppercase text-neutral-500 mb-4">Events</h3>
             {selectedEvents.length === 0 ? (
                 <p className="text-neutral-600 text-xs italic">No events scheduled for this day.</p>
             ) : (
                 <div className="space-y-2">
                     {selectedEvents.map(ev => (
                         <div key={ev.id} className="bg-neutral-900 p-2 border-l-2 border-white text-xs text-neutral-300">
                             {ev.title}
                         </div>
                     ))}
                 </div>
             )}
        </div>
      </div>

      {/* Habit Manager Modal */}
      {showHabitManager && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
              <div className="bg-neutral-900 border border-neutral-700 w-full max-w-lg p-6 shadow-2xl flex flex-col max-h-[80vh]">
                  <div className="flex justify-between items-center mb-6">
                      <h3 className="text-lg font-light">Manage Habits</h3>
                      <button onClick={() => setShowHabitManager(false)} className="text-neutral-500 hover:text-white">
                          <X size={20} />
                      </button>
                  </div>
                  
                  {/* Add New */}
                  <form onSubmit={handleAddHabit} className="flex gap-2 mb-6">
                      <input 
                          type="text" 
                          value={newHabitName} 
                          onChange={e => setNewHabitName(e.target.value)}
                          placeholder="Enter new habit name..."
                          className="flex-1 bg-black border border-neutral-800 px-4 py-2 text-sm text-white focus:outline-none focus:border-white"
                          autoFocus
                      />
                      <button type="submit" className="bg-white text-black px-4 py-2 text-sm font-bold hover:bg-neutral-200">
                          ADD
                      </button>
                  </form>

                  {/* List */}
                  <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar pr-2">
                      {habits.map(habit => (
                          <div key={habit.id} className="flex items-center justify-between p-3 bg-black border border-neutral-800">
                              {editingHabitId === habit.id ? (
                                  <div className="flex flex-1 gap-2">
                                      <input 
                                          type="text" 
                                          value={editHabitName}
                                          onChange={e => setEditHabitName(e.target.value)}
                                          className="flex-1 bg-neutral-900 text-white px-2 py-1 text-sm focus:outline-none"
                                      />
                                      <button onClick={() => handleUpdateHabit(habit.id)} className="text-green-500 hover:text-green-400"><Save size={16}/></button>
                                      <button onClick={() => setEditingHabitId(null)} className="text-neutral-500 hover:text-white"><X size={16}/></button>
                                  </div>
                              ) : (
                                  <>
                                    <span className="text-sm text-neutral-300">{habit.title}</span>
                                    <div className="flex gap-3">
                                        <button 
                                            onClick={() => { setEditingHabitId(habit.id); setEditHabitName(habit.title); }}
                                            className="text-neutral-600 hover:text-white transition-colors"
                                        >
                                            <Edit2 size={14} />
                                        </button>
                                        <button 
                                            onClick={() => handleDeleteHabit(habit.id)}
                                            className="text-neutral-600 hover:text-red-500 transition-colors"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                  </>
                              )}
                          </div>
                      ))}
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default Calendar;
