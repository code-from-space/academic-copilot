import React, { useState } from 'react';
import { getGeminiResponse } from '../gemini'; 

const VivaVoce = ({ extractedText, theme }) => {
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
    if (!extractedText) return alert("Please GENERATE A ROADMAP first!");
    setGameState('loading');
    try {
      const prompt = `Create 5 multiple choice questions based on this text: "${extractedText.substring(0, 10000)}". Return strictly valid JSON array: [{ "q": "...", "options": ["A) ...", "B) ...", "C) ...", "D) ..."], "correct": 0 }]`;
      const text = await getGeminiResponse(prompt, null);
      const data = JSON.parse(text.replace(/```json|```/g, '').trim());
      setQuestions(data); setCurrentQIndex(0); setScore(0); setGameState('playing');
      speak(`Speed Round! Question one. ${data[0].q}`);
    } catch (error) {
      alert("AI Error. Try again."); setGameState('idle');
    }
  };

  const handleAnswer = (selectedIndex) => {
    const isCorrect = selectedIndex === questions[currentQIndex].correct;
    let newScore = score;
    if (isCorrect) { newScore = score + 1; setScore(newScore); speak("Correct!"); } else { speak("Wrong."); }
    if (currentQIndex < questions.length - 1) {
      setTimeout(() => {
        const nextIndex = currentQIndex + 1;
        setCurrentQIndex(nextIndex);
        speak(`Next. ${questions[nextIndex].q}`);
      }, 1000);
    } else {
      setTimeout(() => { setGameState('finished'); speak(`Game over. You got ${newScore} out of ${questions.length}`); }, 1000);
    }
  };

  return (
    <>
      {isExpanded && <div className="h-[600px] w-full hidden lg:block" />}
      {isExpanded && <div className="fixed inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-md z-40" onClick={() => setIsExpanded(false)} />}

      <div className={`flex flex-col backdrop-blur-xl rounded-3xl overflow-hidden shadow-xl transition-all duration-300 ${isExpanded ? "fixed inset-4 md:inset-12 z-50" : "h-[600px] relative"} ${theme === 'luxury' ? 'bg-[#1A1C23]/90 border border-[#3A312A]' : 'bg-white/60 dark:bg-slate-900/60 border border-slate-200 dark:border-white/5'}`}>
        
        <div className={`p-5 border-b flex justify-between items-center ${theme === 'luxury' ? 'bg-[#14151A]/80 border-[#3A312A]' : 'bg-slate-50/50 dark:bg-[#0a0c10]/50 border-slate-200 dark:border-white/5'}`}>
          <div className="flex items-center gap-3">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={theme === 'luxury' ? 'text-[#A58B74]' : 'text-orange-500'}><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="22"></line></svg>
            <h2 className={`text-xs font-bold tracking-widest uppercase ${theme === 'luxury' ? 'text-[#C8B3A2]' : 'text-slate-800 dark:text-white'}`}>Viva Speed Round</h2>
          </div>
          <button onClick={() => setIsExpanded(!isExpanded)} className={`p-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-colors ${theme === 'luxury' ? 'text-[#6E7381] hover:text-[#D6C7B9] hover:bg-[#23252E]' : 'text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-white/10'}`}>
            {isExpanded ? "Close" : "Expand"}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {gameState === 'idle' && (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-8">
              <div className={`w-20 h-20 rounded-full flex items-center justify-center border shadow-inner ${theme === 'luxury' ? 'border-[#4A3B32] bg-[#14151A] text-[#A58B74]' : 'border-orange-200 dark:border-orange-500/20 bg-gradient-to-b from-transparent to-orange-50 dark:to-orange-900/10 text-orange-500'}`}>
                 <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
              </div>
              <div>
                 <h3 className={`text-xl font-black tracking-tight ${theme === 'luxury' ? 'text-[#C8B3A2]' : 'text-slate-800 dark:text-white'}`}>Rapid Fire Mode</h3>
                 <p className={`text-sm max-w-xs mx-auto mt-2 ${theme === 'luxury' ? 'text-[#6E7381]' : 'text-slate-500 dark:text-slate-400'}`}>The AI speaks. You answer. Fast paced.</p>
              </div>
              <button onClick={startGame} className={`px-8 py-3 border rounded-xl font-bold text-xs tracking-widest uppercase transition-all shadow-sm flex items-center gap-3 ${theme === 'luxury' ? 'border-[#A58B74] text-[#A58B74] hover:bg-[#14151A]' : 'bg-transparent border-orange-500/50 hover:border-orange-500 text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-500/10'}`}>
                Start Audio Protocol
              </button>
            </div>
          )}

          {gameState === 'playing' && questions.length > 0 && (
            <div className="max-w-4xl mx-auto h-full flex flex-col">
              <div className={`w-full h-1 rounded-full mb-6 overflow-hidden shrink-0 ${theme === 'luxury' ? 'bg-[#23252E]' : 'bg-slate-200 dark:bg-slate-800/50'}`}>
                <div className={`h-full transition-all duration-500 ${theme === 'luxury' ? 'bg-[#A58B74]' : 'bg-orange-500'}`} style={{ width: `${((currentQIndex + 1) / questions.length) * 100}%` }}></div>
              </div>
              <div className="py-4 shrink-0 mb-4">
                 <h3 className={`text-lg md:text-xl font-bold leading-snug ${theme === 'luxury' ? 'text-[#D6C7B9]' : 'text-slate-800 dark:text-white'}`}>{questions[currentQIndex].q}</h3>
              </div>
              <div className="grid grid-cols-1 gap-3 pb-6">
                {questions[currentQIndex].options.map((opt, idx) => (
                  <button key={idx} onClick={() => handleAnswer(idx)} className={`border text-left p-4 rounded-xl transition-all flex items-start ${theme === 'luxury' ? 'bg-transparent border-[#3A312A] hover:bg-[#14151A] hover:border-[#8C725D] text-[#D6C7B9]' : 'bg-transparent hover:bg-slate-50 dark:hover:bg-white/5 border-slate-200 dark:border-white/5 text-slate-700 dark:text-slate-300'}`}>
                    <span className="font-medium text-sm leading-snug">{opt.replace(/^[A-D]\) /, '')}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {gameState === 'finished' && (
             <div className="h-full flex flex-col items-center justify-center text-center">
               <h3 className={`text-xl font-bold uppercase tracking-wide ${theme === 'luxury' ? 'text-[#C8B3A2]' : 'text-slate-800 dark:text-white'}`}>Assessment Complete</h3>
               <p className="mt-2 text-sm text-slate-500">Final Score: {score} / {questions.length}</p>
               <button onClick={() => setGameState('idle')} className={`mt-8 px-8 py-3 border text-xs font-bold tracking-widest uppercase rounded-xl transition-all ${theme === 'luxury' ? 'border-[#4A3B32] text-[#A58B74] hover:bg-[#1C1E26]' : 'border-slate-300 dark:border-slate-700 hover:border-slate-400 text-slate-600 dark:text-slate-300'}`}>Restart Protocol</button>
             </div>
          )}
        </div>
      </div>
    </>
  );
};

export default VivaVoce;