import React, { useEffect, useState } from 'react';
import { Plus, Search, Book, ArrowLeft, ChevronRight, ChevronLeft, Edit2, Trash2, MoreHorizontal, Save } from 'lucide-react';
import { Note } from '../../types';
import { dataManager } from '../../services/dataManager';

// --- Visual Components ---

const NotebookCover: React.FC<{ title: string; count: number; onClick: () => void }> = ({ title, count, onClick }) => (
  <div 
    onClick={onClick}
    className="group relative aspect-[3/4] cursor-pointer perspective-1000"
  >
    {/* Book Spine Shadow */}
    <div className="absolute left-0 top-0 bottom-0 w-4 bg-neutral-900 rounded-l-sm z-10 shadow-lg"></div>
    
    {/* Cover */}
    <div className="absolute inset-0 ml-2 bg-neutral-900 border border-neutral-800 rounded-r-md shadow-2xl transition-transform duration-300 group-hover:-translate-y-2 group-hover:rotate-y-[-5deg] origin-left flex flex-col items-center justify-center p-6 bg-gradient-to-br from-neutral-800 to-black">
      <div className="w-full h-full border border-neutral-700/50 flex flex-col items-center justify-center text-center p-4">
        <div className="mb-4 text-neutral-600">
           <Book size={32} strokeWidth={1} />
        </div>
        <h3 className="text-xl font-serif text-neutral-200 tracking-widest uppercase">{title}</h3>
        <span className="mt-2 text-xs font-mono text-neutral-500">{count} {count === 1 ? 'Entry' : 'Entries'}</span>
      </div>
      
      {/* Texture Overlay */}
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/black-leather.png')] opacity-20 pointer-events-none"></div>
    </div>
    
    {/* Pages Edge Effect */}
    <div className="absolute top-2 bottom-2 right-0 w-3 bg-neutral-800 border-l border-neutral-900 z-0 transform translate-x-1"></div>
    <div className="absolute top-3 bottom-3 right-0 w-2 bg-neutral-700 border-l border-neutral-900 z-0 transform translate-x-2"></div>
  </div>
);

const Notes: React.FC = () => {
  // State
  const [allNotes, setAllNotes] = useState<Note[]>([]);
  const [notebooks, setNotebooks] = useState<string[]>([]);
  const [activeNotebook, setActiveNotebook] = useState<string | null>(null);
  
  // Reader State
  const [currentBookNotes, setCurrentBookNotes] = useState<Note[]>([]);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [isFlipping, setIsFlipping] = useState(false);
  
  // Edit State
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  // New Notebook State
  const [showNewBookInput, setShowNewBookInput] = useState(false);
  const [newBookName, setNewBookName] = useState('');

  useEffect(() => {
    const refresh = () => {
      const notes = dataManager.getNotes();
      setAllNotes(notes);
      
      // Extract unique notebooks, default to 'General' if undefined
      const uniqueNotebooks = Array.from(new Set(notes.map(n => n.notebook || 'General'))).sort();
      if (!uniqueNotebooks.includes('General')) uniqueNotebooks.unshift('General');
      setNotebooks(uniqueNotebooks);

      // Refresh current book context if open
      if (activeNotebook) {
        const filtered = notes.filter(n => (n.notebook || 'General') === activeNotebook);
        setCurrentBookNotes(filtered);
      }
    };

    refresh();
    return dataManager.subscribe(refresh);
  }, [activeNotebook]);

  const handleOpenNotebook = (name: string) => {
    const filtered = allNotes.filter(n => (n.notebook || 'General') === name);
    setCurrentBookNotes(filtered);
    setActiveNotebook(name);
    setCurrentPageIndex(0);
    setIsEditing(false);
  };

  const handleCreateNotebook = (e: React.FormEvent) => {
    e.preventDefault();
    if (newBookName.trim()) {
      // Create a dummy note to initialize the notebook
      dataManager.saveNote('Welcome to your new notebook.', newBookName.trim(), 'First Entry');
      setNewBookName('');
      setShowNewBookInput(false);
    }
  };

  const handleAddPage = () => {
    if (!activeNotebook) return;
    const newNote = dataManager.saveNote('', activeNotebook, '');
    // Switch to the new page (which is unshifted to index 0 usually, let's check dataManager logic)
    // dataManager unshifts, so it's at index 0.
    setCurrentPageIndex(0);
    setEditTitle('');
    setEditContent('');
    setIsEditing(true);
  };

  const handleSavePage = () => {
      if (!currentBookNotes[currentPageIndex]) return;
      
      const noteToUpdate = {
          ...currentBookNotes[currentPageIndex],
          title: editTitle || 'Untitled',
          content: editContent
      };
      dataManager.updateNote(noteToUpdate);
      setIsEditing(false);
  };

  const handleStartEdit = () => {
      const note = currentBookNotes[currentPageIndex];
      if(note) {
          setEditTitle(note.title);
          setEditContent(note.content);
          setIsEditing(true);
      }
  };

  const handleDeletePage = () => {
      if(confirm("Tear out this page? (Delete Note)")) {
          const note = currentBookNotes[currentPageIndex];
          if(note) {
              dataManager.deleteNote(note.id);
              // Adjust index safely
              if(currentPageIndex >= currentBookNotes.length - 1) {
                  setCurrentPageIndex(Math.max(0, currentPageIndex - 1));
              }
          }
      }
  };

  const nextPage = () => {
    if (currentPageIndex < currentBookNotes.length - 1) {
      setIsFlipping(true);
      setTimeout(() => setIsFlipping(false), 600); // Match CSS duration
      setCurrentPageIndex(prev => prev + 1);
    }
  };

  const prevPage = () => {
    if (currentPageIndex > 0) {
      setIsFlipping(true);
      setTimeout(() => setIsFlipping(false), 600);
      setCurrentPageIndex(prev => prev - 1);
    }
  };

  // --- Render: Library View ---
  if (!activeNotebook) {
    return (
      <div className="p-8 h-full pb-32 overflow-y-auto bg-black">
        <div className="flex justify-between items-center mb-12 border-b border-neutral-800 pb-6">
          <div>
              <h2 className="text-3xl font-light tracking-tight">Library</h2>
              <p className="text-neutral-500 mt-1 font-serif italic">Select a volume to begin reading or writing.</p>
          </div>
          <div className="flex gap-4">
              {showNewBookInput ? (
                  <form onSubmit={handleCreateNotebook} className="flex items-center gap-2 animate-in fade-in slide-in-from-right-5">
                      <input 
                        autoFocus
                        type="text" 
                        placeholder="Volume Title..." 
                        className="bg-neutral-900 border border-neutral-700 px-3 py-2 text-sm focus:border-white focus:outline-none w-48"
                        value={newBookName}
                        onChange={e => setNewBookName(e.target.value)}
                      />
                      <button type="submit" className="p-2 bg-white text-black hover:bg-neutral-200"><Plus size={16} /></button>
                  </form>
              ) : (
                  <button 
                    onClick={() => setShowNewBookInput(true)}
                    className="flex items-center gap-2 px-4 py-2 border border-neutral-800 hover:bg-neutral-900 transition-colors text-sm"
                  >
                    <Plus size={14} /> NEW VOLUME
                  </button>
              )}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-12 px-4">
          {notebooks.map(notebook => {
            const count = allNotes.filter(n => (n.notebook || 'General') === notebook).length;
            return (
              <NotebookCover 
                key={notebook} 
                title={notebook} 
                count={count} 
                onClick={() => handleOpenNotebook(notebook)} 
              />
            );
          })}
        </div>
      </div>
    );
  }

  // --- Render: Notebook Reader View ---
  const currentNote = currentBookNotes[currentPageIndex];

  return (
    <div className="h-full flex flex-col bg-[#111] relative overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-black z-50">
         <div className="flex items-center gap-4">
            <button 
              onClick={() => setActiveNotebook(null)} 
              className="flex items-center gap-2 text-neutral-400 hover:text-white transition-colors text-xs uppercase tracking-widest"
            >
                <ArrowLeft size={14} /> Library
            </button>
            <div className="h-4 w-px bg-neutral-800"></div>
            <span className="font-serif text-lg text-neutral-200">{activeNotebook}</span>
         </div>
         <div className="flex items-center gap-2">
             {!isEditing && (
                 <button onClick={handleAddPage} className="px-3 py-1 bg-white text-black text-xs font-bold flex items-center gap-2 hover:bg-neutral-200">
                     <Plus size={12} /> NEW PAGE
                 </button>
             )}
             <div className="text-xs font-mono text-neutral-500 px-4">
                 PAGE {currentPageIndex + 1} / {currentBookNotes.length || 1}
             </div>
         </div>
      </div>

      {/* Book Container */}
      <div className="flex-1 flex items-center justify-center p-8 perspective-2000 overflow-hidden">
          <div className={`relative w-full max-w-4xl aspect-[1.4/1] bg-transparent transition-all duration-500 flex shadow-2xl rounded-md`}>
              
              {/* Left Page (Previous Page Hint or Cover Back) */}
              <div className="w-1/2 h-full bg-neutral-900 border-r border-neutral-800 rounded-l-md relative overflow-hidden hidden md:block">
                  <div className="absolute inset-0 bg-[#1a1a1a] p-12 opacity-50 flex flex-col">
                     {/* Just a visual hint of previous pages */}
                     {currentPageIndex > 0 ? (
                         <div className="text-neutral-700 font-serif text-sm select-none blur-[1px]">
                            {currentBookNotes[currentPageIndex - 1].content.substring(0, 500)}...
                         </div>
                     ) : (
                         <div className="flex items-center justify-center h-full text-neutral-800 font-serif text-4xl italic">
                             Ex Libris
                         </div>
                     )}
                  </div>
                  {/* Shadow Gradient for fold */}
                  <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-black/40 to-transparent pointer-events-none"></div>
              </div>

              {/* Right Page (Active Page) */}
              <div className="w-full md:w-1/2 h-full bg-[#181818] rounded-md md:rounded-l-none md:rounded-r-md relative flex flex-col shadow-inner">
                 {/* Paper Texture / Lines */}
                 <div 
                    className="absolute inset-0 pointer-events-none opacity-10"
                    style={{ backgroundImage: 'linear-gradient(#333 1px, transparent 1px)', backgroundSize: '100% 2rem', marginTop: '2rem' }}
                 ></div>

                 {/* Navigation Overlays */}
                 <button 
                    onClick={prevPage} 
                    disabled={currentPageIndex === 0}
                    className="absolute left-0 top-0 bottom-0 w-16 z-10 hover:bg-gradient-to-r from-black/20 to-transparent opacity-0 hover:opacity-100 transition-opacity disabled:hidden flex items-center justify-start pl-4 text-neutral-500"
                 >
                     <ChevronLeft size={32} />
                 </button>
                 <button 
                    onClick={nextPage} 
                    disabled={currentPageIndex >= currentBookNotes.length - 1}
                    className="absolute right-0 top-0 bottom-0 w-16 z-10 hover:bg-gradient-to-l from-black/20 to-transparent opacity-0 hover:opacity-100 transition-opacity disabled:hidden flex items-center justify-end pr-4 text-neutral-500"
                 >
                     <ChevronRight size={32} />
                 </button>

                 {/* Content Area */}
                 <div className="flex-1 p-8 md:p-12 overflow-y-auto relative z-0 custom-scrollbar">
                     {currentBookNotes.length === 0 ? (
                         <div className="h-full flex flex-col items-center justify-center text-neutral-600">
                             <p className="font-serif italic mb-4">This volume is empty.</p>
                             <button onClick={handleAddPage} className="text-xs underline hover:text-white">Write the first entry</button>
                         </div>
                     ) : isEditing ? (
                         <div className="flex flex-col h-full gap-4 animate-in fade-in">
                             <input 
                                value={editTitle}
                                onChange={e => setEditTitle(e.target.value)}
                                className="bg-transparent text-3xl font-serif text-white placeholder-neutral-700 focus:outline-none border-b border-transparent focus:border-neutral-700 pb-2"
                                placeholder="Title..."
                                autoFocus
                             />
                             <textarea 
                                value={editContent}
                                onChange={e => setEditContent(e.target.value)}
                                className="flex-1 bg-transparent text-neutral-300 text-lg leading-[2rem] font-serif resize-none focus:outline-none placeholder-neutral-700"
                                placeholder="Start writing..."
                             />
                             <div className="flex justify-end gap-2 pt-4 border-t border-neutral-800">
                                 <button onClick={() => setIsEditing(false)} className="px-4 py-2 text-xs text-neutral-500 hover:text-white">CANCEL</button>
                                 <button onClick={handleSavePage} className="px-4 py-2 bg-white text-black text-xs font-bold hover:bg-neutral-200">SAVE CHANGES</button>
                             </div>
                         </div>
                     ) : (
                         <div className="animate-in fade-in duration-500">
                             <div className="flex justify-between items-start mb-6">
                                 <h2 className="text-3xl font-serif text-white tracking-wide">{currentNote.title}</h2>
                                 <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity relative z-20">
                                    <button onClick={handleStartEdit} className="text-neutral-600 hover:text-white"><Edit2 size={16}/></button>
                                    <button onClick={handleDeletePage} className="text-neutral-600 hover:text-red-500"><Trash2 size={16}/></button>
                                 </div>
                             </div>
                             <div className="text-xs font-mono text-neutral-500 mb-8 flex items-center gap-4">
                                 <span>{currentNote.date}</span>
                                 <span className="h-px w-8 bg-neutral-800"></span>
                                 <span>ID: {currentNote.id}</span>
                             </div>
                             <div className="text-lg text-neutral-300 font-serif leading-[2rem] whitespace-pre-wrap">
                                 {currentNote.content}
                             </div>
                         </div>
                     )}
                 </div>
                 
                 {/* Spine Shadow Overlay */}
                 <div className="absolute left-0 top-0 bottom-0 w-6 bg-gradient-to-r from-black/50 to-transparent pointer-events-none"></div>
              </div>

              {/* Mobile Pagination Helper (Visible only on small screens) */}
              <div className="absolute bottom-4 left-0 right-0 flex justify-center md:hidden gap-8 text-neutral-500">
                   <button onClick={prevPage} disabled={currentPageIndex===0}><ChevronLeft /></button>
                   <span className="text-xs font-mono pt-1">{currentPageIndex + 1} / {currentBookNotes.length}</span>
                   <button onClick={nextPage} disabled={currentPageIndex>=currentBookNotes.length-1}><ChevronRight /></button>
              </div>
          </div>
      </div>
      
      <style>{`
        .perspective-1000 { perspective: 1000px; }
        .perspective-2000 { perspective: 2000px; }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #333; border-radius: 2px; }
      `}</style>
    </div>
  );
};

export default Notes;