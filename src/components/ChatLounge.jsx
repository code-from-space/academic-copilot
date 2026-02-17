import React, { useState } from 'react';
import { GoogleGenerativeAI } from "@google/generative-ai";

const ChatLounge = ({ extractedText }) => {
  const [messages, setMessages] = useState([
    { role: 'ai', text: 'I have read your syllabus. Ask me anything about it!' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

  const handleSend = async () => {
    if (!input.trim()) return;
    
    const userMsg = { role: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
      
      // We purposefully inject the syllabus context every time to ensure accuracy
      const prompt = `
        Context: The user has uploaded a syllabus/document with the following text: 
        "${extractedText.substring(0, 30000)}..." (truncated if too long).
        
        User Question: ${input}
        
        Answer the user's question acting as a helpful, strict academic tutor. 
        Keep answers concise and strictly related to the provided text.
      `;

      const result = await model.generateContent(prompt);
      const response = result.response; // Removed 'await'
      const text = response.text();

      setMessages(prev => [...prev, { role: 'ai', text: text }]);
    } catch (error) {
   console.error(error); // <--- This fixes the red line
   setMessages(prev => [...prev, { role: 'ai', text: "Error connecting to tutor. Try again." }]);
}
    setIsLoading(false);
  };

  return (
    <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 h-[600px] flex flex-col shadow-2xl">
      <h2 className="text-2xl font-bold text-white mb-4 border-b border-slate-700 pb-2">
        💬 Syllabus ChatBot
      </h2>
      
      <div className="flex-1 overflow-y-auto mb-4 space-y-4 pr-2 scrollbar-thin scrollbar-thumb-slate-600">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-lg p-3 ${
              msg.role === 'user' 
                ? 'bg-blue-600 text-white' 
                : 'bg-slate-800 text-slate-200 border border-slate-600'
            }`}>
              {msg.text}
            </div>
          </div>
        ))}
        {isLoading && <div className="text-slate-400 text-sm animate-pulse">Tutor is thinking...</div>}
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          className="flex-1 bg-slate-800 text-white border border-slate-600 rounded-lg p-3 focus:outline-none focus:border-blue-500 transition-colors"
          placeholder="Ask about your exam..."
        />
        <button 
          onClick={handleSend}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 rounded-lg font-semibold transition-colors"
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default ChatLounge;