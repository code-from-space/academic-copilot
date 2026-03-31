import React, { useState, useRef, useEffect } from 'react';
import { getGeminiResponse } from '../gemini'; 

const ChatLounge = ({ extractedText, theme }) => {
  const [messages, setMessages] = useState([
    { role: 'ai', text: 'I am ready to discuss your roadmap. What topic should we start with?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  };

  useEffect(() => {
    if (messages.length > 1) {
      scrollToBottom();
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    if (!extractedText) {
      setMessages(prev => [...prev, 
        { role: 'user', text: input },
        { role: 'ai', text: "SYSTEM HALT: Please upload a syllabus and click 'GENERATE ROADMAP' first so I have data to work with." }
      ]);
      setInput('');
      return; 
    }
    
    const userMsg = { role: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const prompt = `Context: The user has a study plan with this data: "${extractedText.substring(0, 15000)}". User Question: ${input}. Answer as a helpful tutor. Keep answers concise.`;
      const text = await getGeminiResponse(prompt, null);
      setMessages(prev => [...prev, { role: 'ai', text: text }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'ai', text: "I'm having trouble connecting. Please try again." }]);
    }
    setIsLoading(false);
  };

  return (
    <>
      {isExpanded && <div className="h-[600px] w-full hidden lg:block" />}
      
      {isExpanded && (
        <div 
          className="fixed inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-md z-40 transition-opacity"
          onClick={() => setIsExpanded(false)}
        />
      )}

      <div className={`flex flex-col backdrop-blur-xl rounded-3xl overflow-hidden shadow-xl transition-all duration-300 ${
        isExpanded ? "fixed inset-4 md:inset-12 z-50" : "h-[600px] relative"
      } ${
        theme === 'luxury' ? 'bg-[#1A1C23]/90 border border-[#3A312A]' : 'bg-white/60 dark:bg-slate-900/60 border border-slate-200 dark:border-white/5'
      }`}>
        
        {/* HEADER */}
        <div className={`p-5 flex justify-between items-center border-b ${theme === 'luxury' ? 'bg-[#14151A]/80 border-[#3A312A]' : 'bg-slate-50/50 dark:bg-[#0a0c10]/50 border-slate-200 dark:border-white/5'}`}>
          <div className="flex items-center gap-3">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={theme === 'luxury' ? 'text-[#A58B74]' : 'text-blue-500'}>
              <path d="M12 2v4"></path><path d="M12 18v4"></path><path d="m4.93 4.93 2.83 2.83"></path><path d="m16.24 16.24 2.83 2.83"></path><path d="M2 12h4"></path><path d="M18 12h4"></path><path d="m4.93 19.07 2.83-2.83"></path><path d="m16.24 7.76 2.83-2.83"></path>
            </svg>
            <h2 className={`text-xs font-bold tracking-widest uppercase flex items-center gap-2 ${theme === 'luxury' ? 'text-[#C8B3A2]' : 'text-slate-800 dark:text-white'}`}>
              AI Tutor Chat
            </h2>
            <div className={`ml-2 px-3 py-1 rounded-full flex items-center gap-2 shadow-sm border ${theme === 'luxury' ? 'bg-[#A58B74]/10 border-[#A58B74]/20' : 'bg-blue-500/10 border-blue-500/20'}`}>
              <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${theme === 'luxury' ? 'bg-[#A58B74]' : 'bg-blue-500'}`}></div>
              <span className={`font-bold text-[10px] tracking-widest uppercase ${theme === 'luxury' ? 'text-[#A58B74]' : 'text-blue-600 dark:text-blue-400'}`}>Online</span>
            </div>
          </div>
          
          <button onClick={() => setIsExpanded(!isExpanded)} className={`p-2 rounded-lg flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest transition-colors ${theme === 'luxury' ? 'text-[#6E7381] hover:text-[#D6C7B9] hover:bg-[#23252E]' : 'text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-white/10'}`}>
            {isExpanded ? "Close" : "Expand"}
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-track-transparent">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}>
              <div className={`max-w-[85%] rounded-2xl p-4 text-sm leading-relaxed ${
                msg.role === 'user' 
                  ? theme === 'luxury' ? 'bg-[#8C725D] text-[#121317] rounded-br-sm' : 'bg-blue-600 text-white rounded-br-sm shadow-md' 
                  : theme === 'luxury' ? 'bg-[#14151A] text-[#D6C7B9] border border-[#3A312A] rounded-bl-sm' : 'bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-white/5 text-slate-700 dark:text-slate-200 rounded-bl-sm shadow-sm'
              }`}>
                {msg.text}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className={`rounded-2xl rounded-bl-sm p-4 px-5 border flex gap-1.5 items-center ${theme === 'luxury' ? 'bg-[#14151A] border-[#3A312A]' : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-white/5 shadow-sm'}`}>
                <div className={`w-1.5 h-1.5 rounded-full animate-bounce ${theme === 'luxury' ? 'bg-[#A58B74]' : 'bg-slate-400 dark:bg-slate-500'}`}></div>
                <div className={`w-1.5 h-1.5 rounded-full animate-bounce ${theme === 'luxury' ? 'bg-[#A58B74]' : 'bg-slate-400 dark:bg-slate-500'}`} style={{ animationDelay: '0.1s' }}></div>
                <div className={`w-1.5 h-1.5 rounded-full animate-bounce ${theme === 'luxury' ? 'bg-[#A58B74]' : 'bg-slate-400 dark:bg-slate-500'}`} style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} className="h-4" />
        </div>

        <div className={`p-4 border-t backdrop-blur-md ${theme === 'luxury' ? 'bg-[#14151A]/80 border-[#3A312A]' : 'bg-slate-50 dark:bg-[#0a0c10]/80 border-slate-200 dark:border-white/5'}`}>
          <div className="flex gap-3 relative">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              className={`flex-1 rounded-xl px-5 py-4 text-sm focus:outline-none transition-all ${
                theme === 'luxury' 
                  ? 'bg-[#1C1E26] text-[#D6C7B9] border border-[#3A312A] focus:border-[#A58B74] placeholder-[#6E7381]' 
                  : 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-white/10 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder-slate-400 dark:placeholder-slate-500 shadow-sm'
              }`}
              placeholder="Ask about your roadmap..."
            />
            
            <button 
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className={`px-5 rounded-xl transition-all flex items-center justify-center group disabled:opacity-50 disabled:cursor-not-allowed ${
                theme === 'luxury' ? 'bg-[#A58B74] hover:bg-[#8C725D] text-[#121317]' : 'bg-blue-600 hover:bg-blue-500 text-white shadow-md'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="transform group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform">
                <line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default ChatLounge;