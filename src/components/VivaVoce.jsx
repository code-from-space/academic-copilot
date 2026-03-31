import React, { useState } from 'react';
import { getGeminiResponse } from '../gemini'; 

const VivaVoce = ({ extractedText }) => {
  const [questions, setQuestions] = useState([]);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [gameState, setGameState] = useState('idle'); 
  const [isExpanded, setIsExpanded] = useState(false);
  
  const speak = (text) => {
    window.speechSynthesis.cancel(); 
    const utterance = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    utterance.voice = voices.find(v => v.lang.includes('en') && v.name.includes('Google')) || voices[0];
    utterance.rate = 1.1; 
    utterance.pitch = 1.0;
    window.speechSynthesis.speak(utterance);
  };

  const startGame = async () => {
    if (!extractedText) return alert("Please GENERATE A ROADMAP first so I have content to quiz you on!");
    
    setGameState('loading');
    try {
      const prompt = `
        Create 5 multiple choice questions based on this text: "${extractedText.substring(0, 10000)}".
        Return strictly valid JSON array:
        [
          { "q": "Question text", "options": ["A) Option 1", "B) Option 2", "C) Option 3", "D) Option 4"], "correct": 0 }
        ]
        Do not use markdown. Just raw JSON.
      `;
      const text = await getGeminiResponse(prompt, null);
      const cleanJson = text.replace(/```json|```/g, '').trim();
      const data = JSON.parse(cleanJson);
      
      setQuestions(data);
      setCurrentQIndex(0);
      setScore(0);
      setGameState('playing');
      
      speak(`Speed Round! Question one. ${data[0].q}`);
    } catch (error) {
      console.error("Viva Error:", error);
      alert("AI Error. Try again.");
      setGameState('idle');
    }
  };

  const handleAnswer = (selectedIndex) => {
    const isCorrect = selectedIndex === questions[currentQIndex].correct;
    
    let newScore = score;
    if (isCorrect) {
      newScore = score + 1;
      setScore(newScore);
      speak("Correct!");
    } else {
      speak("Wrong.");
    }

    if (currentQIndex < questions.length - 1) {
      setTimeout(() => {
        const nextIndex = currentQIndex + 1;
        setCurrentQIndex(nextIndex);
        speak(`Next. ${questions[nextIndex].q}`);
      }, 1000);
    } else {
      setTimeout(() => {
        setGameState('finished');
        speak(`Game over. You got ${newScore} out of ${questions.length}`);
      }, 1000);
    }
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

      <div className={`flex flex-col bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200 dark:border-white/5 rounded-3xl overflow-hidden shadow-xl transition-all duration-300 ${
        isExpanded ? "fixed inset-4 md:inset-12 z-50" : "h-[600px] relative"
      }`}>
        
        <div className="p-5 border-b border-slate-200 dark:border-white/5 bg-slate-50/50 dark:bg-[#0a0c10]/50 flex justify-between items-center">
          <div className="flex items-center gap-3">
            {/* Sleek SVG replacing the Microphone Emoji */}
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-orange-500">
              <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path>
              <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
              <line x1="12" y1="19" x2="12" y2="22"></line>
            </svg>
            <h2 className="text-xs font-bold text-slate-800 dark:text-white tracking-widest uppercase flex items-center gap-2">
              Viva Speed Round
            </h2>
            {gameState === 'playing' && (
               <span className="bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/30 text-[10px] tracking-widest uppercase font-bold px-3 py-1 rounded-full animate-pulse shadow-sm">
                 Live
               </span>
            )}
          </div>
          <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-white/10 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest"
          >
            {isExpanded ? (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 14h6v6M20 10h-6V4M14 10l7-7M10 14l-7 7"/></svg>
                <span className="hidden sm:inline">Close</span>
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>
                <span className="hidden sm:inline">Expand</span>
              </>
            )}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700">
          
          {gameState === 'idle' && (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-8">
              {/* Sleek SVG replacing the Lightning Bolt Emoji */}
              <div className="w-20 h-20 rounded-full flex items-center justify-center border border-orange-200 dark:border-orange-500/20 bg-gradient-to-b from-transparent to-orange-50 dark:to-orange-900/10 shadow-inner">
                 <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-orange-500">
                   <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
                 </svg>
              </div>
              
              <div>
                 <h3 className="text-xl font-black text-slate-800 dark:text-white tracking-tight">Rapid Fire Mode</h3>
                 <p className="text-slate-500 dark:text-slate-400 text-sm max-w-xs mx-auto mt-2">
                   The AI speaks. You answer. Fast paced. 5 Questions.
                 </p>
              </div>
              
              {/* Ghost Button Upgrade */}
              <button 
                onClick={startGame}
                className="px-8 py-3 bg-transparent border border-orange-500/50 hover:border-orange-500 text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-500/10 rounded-xl font-bold text-xs tracking-widest uppercase transition-all shadow-sm flex items-center gap-3"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="22"></line></svg>
                Start test Protocol
              </button>
            </div>
          )}

          {gameState === 'loading' && (
            <div className="h-full flex flex-col items-center justify-center text-slate-600 dark:text-slate-400">
              {/* Sleek SVG replacing the Brain Emoji */}
              <svg className="animate-pulse w-12 h-12 mb-6 text-orange-500/50" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              <p className="font-bold text-xs uppercase tracking-widest animate-pulse">Synthesizing Questions...</p>
            </div>
          )}

          {gameState === 'playing' && questions.length > 0 && (
            <div className="max-w-4xl mx-auto h-full flex flex-col animate-fade-in">
              <div className="w-full bg-slate-200 dark:bg-slate-800/50 h-1 rounded-full mb-6 overflow-hidden shrink-0">
                <div 
                  className="bg-orange-500 h-full transition-all duration-500" 
                  style={{ width: `${((currentQIndex + 1) / questions.length) * 100}%` }}
                ></div>
              </div>

              <div className="py-4 shrink-0 mb-4">
                 <div className="flex justify-between items-center mb-2 text-[10px] font-bold tracking-widest uppercase text-slate-400">
                   <span>Question {currentQIndex + 1} of {questions.length}</span>
                 </div>
                 <h3 className="text-lg md:text-xl font-bold text-slate-800 dark:text-white leading-snug">
                   {questions[currentQIndex].q}
                 </h3>
              </div>

              <div className="grid grid-cols-1 gap-3 pb-6">
                {questions[currentQIndex].options.map((opt, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleAnswer(idx)}
                    className="bg-transparent hover:bg-slate-50 dark:hover:bg-white/5 border border-slate-200 dark:border-white/5 text-left p-4 rounded-xl transition-all group flex items-start shadow-sm dark:shadow-none"
                  >
                    <span className="font-bold text-slate-400 dark:text-slate-500 group-hover:text-orange-500 mr-4 text-sm mt-0.5">
                      {['A', 'B', 'C', 'D'][idx]}
                    </span>
                    <span className="text-slate-700 dark:text-slate-300 font-medium text-sm leading-snug">
                      {opt.replace(/^[A-D]\) /, '')}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {gameState === 'finished' && (
             <div className="h-full flex flex-col items-center justify-center text-center space-y-6 animate-fade-in">
               {/* Sleek SVG replacing the Trophy Emoji */}
               <div className="mb-2 relative">
                  <div className={`w-24 h-24 rounded-full flex items-center justify-center border-2 bg-transparent ${score >= 3 ? 'border-green-500/50 text-green-500' : 'border-red-500/50 text-red-500'}`}>
                    <span className="text-3xl font-light font-mono">{Math.round((score/questions.length)*100)}%</span>
                  </div>
               </div>
               
               <h3 className="text-xl font-bold text-slate-800 dark:text-white uppercase tracking-wide">
                 Assessment Complete
               </h3>
               <p className="text-slate-500 dark:text-slate-400 text-sm">
                 Final Score: {score} / {questions.length}
               </p>
               
               <button 
                 onClick={() => setGameState('idle')}
                 className="mt-4 px-8 py-3 bg-transparent border border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-500 text-slate-600 dark:text-slate-300 text-xs font-bold tracking-widest uppercase rounded-xl transition-all"
               >
                 Restart Protocol
               </button>
             </div>
          )}
        </div>
      </div>
    </>
  );
};

export default VivaVoce;