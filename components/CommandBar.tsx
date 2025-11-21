import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2, X, ChevronUp, Terminal, User, CheckCircle2 } from 'lucide-react';
import { Message } from '../types';
import { sendMessageToGemini } from '../services/geminiService';
import { dataManager } from '../services/dataManager';

interface CommandBarProps {
  messages: Message[];
  onNewMessage: (msg: Message) => void;
}

const CommandBar: React.FC<CommandBarProps> = ({ messages, onNewMessage }) => {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages, isExpanded]);

  const executeCommand = (jsonResponse: string) => {
    try {
      const data = JSON.parse(jsonResponse);
      let systemReply = '';

      switch (data.action) {
        case 'create_note':
          dataManager.saveNote(data.payload);
          systemReply = `Note created: "${data.payload.substring(0, 20)}..."`;
          break;
        case 'add_event':
          dataManager.addCalendarEvent(data.payload.date, data.payload.title);
          systemReply = `Event added: ${data.payload.title} on ${data.payload.date}`;
          break;
        case 'update_wallet':
          dataManager.updateWallet(data.payload.amount, data.payload.type, data.payload.description);
          systemReply = `Wallet updated: ${data.payload.type} of $${data.payload.amount} (${data.payload.description || 'No desc'})`;
          break;
        case 'chat':
        default:
          systemReply = data.payload;
          break;
      }
      return systemReply;
    } catch (e) {
      console.error("Failed to parse AI response", e);
      return "System Error: Could not parse command.";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
      timestamp: Date.now(),
    };

    onNewMessage(userMsg);
    setInput('');
    setIsLoading(true);
    setIsExpanded(true);

    try {
      const responseJson = await sendMessageToGemini(userMsg.text);
      const replyText = executeCommand(responseJson);
      
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        text: replyText,
        timestamp: Date.now(),
      };
      
      onNewMessage(aiMsg);
    } catch (error) {
      const errorMsg: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        text: "Critical Failure: Connection lost.",
        timestamp: Date.now(),
      };
      onNewMessage(errorMsg);
    } finally {
      setIsLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  return (
    <div className="fixed bottom-0 left-0 md:left-64 right-0 z-50 flex flex-col justify-end">
      
      {/* Chat Window */}
      {isExpanded && (
        <div className="bg-neutral-900 border-t border-neutral-700 shadow-2xl animate-in slide-in-from-bottom-10 duration-300 max-h-[60vh] flex flex-col">
          <div className="flex justify-between items-center p-3 border-b border-neutral-800 bg-black">
             <span className="text-xs font-mono text-neutral-500 uppercase flex items-center gap-2">
               <Terminal size={12} /> Command Log
            </span>
            <button 
              onClick={() => setIsExpanded(false)}
              className="text-neutral-500 hover:text-white"
            >
              <X size={14} />
            </button>
          </div>
          
          <div 
            ref={chatContainerRef}
            className="overflow-y-auto p-4 space-y-4 flex-1 bg-black/95"
          >
            {messages.length === 0 && (
              <div className="text-center text-neutral-600 text-sm py-8 italic">
                Systems ready. Awaiting input.
              </div>
            )}
            {messages.map((msg) => (
              <div 
                key={msg.id} 
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div 
                  className={`max-w-[80%] p-3 text-sm border ${
                    msg.role === 'user' 
                      ? 'bg-neutral-900 border-neutral-700 text-neutral-200' 
                      : 'bg-black border-neutral-800 text-white font-mono'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1 opacity-50 text-[10px] uppercase tracking-wider">
                    {msg.role === 'user' ? <User size={10} /> : <CheckCircle2 size={10} />}
                    {msg.role === 'user' ? 'USER' : 'SYSTEM'}
                  </div>
                  <div className="whitespace-pre-wrap leading-relaxed">
                    {msg.text}
                  </div>
                </div>
              </div>
            ))}
            {isLoading && (
               <div className="flex justify-start">
                  <div className="bg-black border border-neutral-800 p-3 text-sm">
                    <div className="flex items-center gap-2 text-neutral-500">
                      <Loader2 size={14} className="animate-spin" /> Processing...
                    </div>
                  </div>
               </div>
            )}
          </div>
        </div>
      )}

      {/* Input Bar */}
      <div className="relative group">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-neutral-700 to-neutral-800 opacity-30 blur transition duration-1000 group-hover:opacity-50"></div>
        <form onSubmit={handleSubmit} className="relative bg-black flex items-center border-t border-neutral-700 focus-within:border-white transition-colors duration-300">
          <button 
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="pl-4 pr-2 text-neutral-500 hover:text-white transition-colors"
          >
            <ChevronUp size={18} className={`transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
          </button>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={isExpanded ? "Type a message..." : "Type a command (e.g., 'Add note: Call John')"}
            className="w-full bg-transparent border-none text-white px-4 py-6 focus:outline-none focus:ring-0 font-mono text-sm placeholder-neutral-600"
            autoComplete="off"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="pr-6 pl-2 text-neutral-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? <Loader2 size={20} className="animate-spin" /> : <Send size={18} />}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CommandBar;