import React, { useState, useRef, useEffect } from 'react';
import { getGeminiResponse } from '../gemini'; 

const ChatLounge = ({ extractedText }) => {
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
    // Only auto-scroll if the user or AI has actually sent a new message!
    if (messages.length > 1) {
      scrollToBottom();
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    if (!extractedText) {
      setMessages(prev => [...prev, 
        { role: 'user', text: input },
        { role: 'ai', text: "⚠️ I can't answer yet! Please upload a syllabus and click 'GENERATE ROADMAP' first so I have data to work with." }
      ]);
      setInput('');
      return; 
    }
    
    const userMsg = { role: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const prompt = `
        Context: The user has a study plan with this data: 
        "${extractedText.substring(0, 15000)}".
        User Question: ${input}
        Answer as a helpful, encouraging tutor. Keep answers concise.
      `;
      const text = await getGeminiResponse(prompt, null);
      setMessages(prev => [...prev, { role: 'ai', text: text }]);
    } catch (error) {
      console.error("Chat Error:", error);
      setMessages(prev => [...prev, { role: 'ai', text: "I'm having trouble connecting. Please try again." }]);
    }
    setIsLoading(false);
  };

  return (
    <>
      {isExpanded && <div className="h-[600px] w-full hidden lg:block" />}
      
      {isExpanded && (
        <div 
          className="fixed inset-0 bg-white/60 dark:bg-black/80 backdrop-blur-sm z-40 transition-opacity"
          onClick={() => setIsExpanded(false)}
        />
      )}

      <div className={`flex flex-col bg-white/80 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-3xl overflow-hidden shadow-2xl transition-all duration-300 ${
        isExpanded ? "fixed inset-4 md:inset-12 z-50" : "h-[600px] relative"
      }`}>
        
        <div className="p-6 border-b border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-white/5 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="h-3 w-3 rounded-full bg-green-500 animate-pulse"></div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-white tracking-wide">AI TUTOR CHAT</h2>
          </div>
          <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors bg-white dark:bg-white/5 border border-slate-200 dark:border-transparent p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 shadow-sm dark:shadow-none"
          >
            {isExpanded ? '↙️ Close Screen' : '⤢'}
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700 scrollbar-track-transparent">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] rounded-2xl p-4 text-sm md:text-base leading-relaxed shadow-md dark:shadow-lg ${
                msg.role === 'user' 
                  ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-tr-none' 
                  : 'bg-white dark:bg-slate-800 border border-slate-100 dark:border-white/5 text-slate-700 dark:text-slate-200 rounded-tl-none'
              }`}>
                {msg.text}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white dark:bg-slate-800 rounded-2xl rounded-tl-none p-4 border border-slate-100 dark:border-white/5 flex gap-2 items-center shadow-md">
                <div className="w-2 h-2 bg-blue-500 dark:bg-blue-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-blue-500 dark:bg-blue-400 rounded-full animate-bounce delay-100"></div>
                <div className="w-2 h-2 bg-blue-500 dark:bg-blue-400 rounded-full animate-bounce delay-200"></div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 bg-slate-50 dark:bg-black/40 border-t border-slate-200 dark:border-white/5">
          <div className="flex gap-2 relative">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              className="flex-1 bg-white dark:bg-slate-900/80 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-xl px-5 py-4 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder-slate-400 dark:placeholder-slate-500 shadow-sm dark:shadow-none"
              placeholder="Ask about a topic..."
            />
            <button 
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="bg-blue-600 hover:bg-blue-500 text-white px-6 rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
            >
              ➤
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default ChatLounge;