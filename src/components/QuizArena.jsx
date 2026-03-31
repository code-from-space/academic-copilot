import React, { useState, useEffect } from 'react';
import { getGeminiResponse } from '../gemini'; 

const QuizArena = ({ extractedText }) => {
  const [quiz, setQuiz] = useState(null);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [score, setScore] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [timeLeft, setTimeLeft] = useState(10); 

  useEffect(() => {
    if (!quiz || score !== null) return; 

    if (timeLeft === 0) {
      handleAnswer(null); 
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, quiz, score]);

  const generateQuiz = async () => {
    if (!extractedText) {
      alert("⚠️ SYSTEM HALT\n\nPlease GENERATE A ROADMAP first.");
      return;
    }

    setLoading(true);
    setScore(null);
    setAnswers({});
    setCurrentQIndex(0);
    try {
      const prompt = `
        Based on this study plan data: "${extractedText.substring(0, 15000)}", 
        generate 5 multiple choice questions.
        Return strictly valid JSON array format:
        [
          { "id": 1, "question": "...", "options": ["A", "B", "C", "D"], "correct": "A" }
        ]
        Do not use markdown blocks. Just the raw JSON.
      `;
      const text = await getGeminiResponse(prompt, null);
      const cleanJson = text.replace(/```json|```/g, '').trim();
      setQuiz(JSON.parse(cleanJson));
      setTimeLeft(10); 
    } catch (e) {
      console.error("Quiz Error:", e);
      alert("Failed to generate quiz. Try again.");
    }
    setLoading(false);
  };

  const handleAnswer = (selectedLabel) => {
    const currentQ = quiz[currentQIndex];
    
    setAnswers(prev => ({...prev, [currentQ.id]: selectedLabel}));

    if (currentQIndex < quiz.length - 1) {
      setCurrentQIndex(prev => prev + 1);
      setTimeLeft(10); 
    } else {
      let correctCount = 0;
      const finalAnswers = {...answers, [currentQ.id]: selectedLabel};
      quiz.forEach(q => {
        if (finalAnswers[q.id] === q.correct) correctCount++;
      });
      setScore(correctCount);
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
        
        {/* HEADER */}
        <div className="p-5 border-b border-slate-200 dark:border-white/5 bg-slate-50/50 dark:bg-[#0a0c10]/50 flex justify-between items-center">
          <div className="flex items-center gap-3">
            {/* Sleek SVG Icon replacing Swords Emoji */}
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="22" y1="12" x2="18" y2="12"></line>
              <line x1="6" y1="12" x2="2" y2="12"></line>
              <line x1="12" y1="6" x2="12" y2="2"></line>
              <line x1="12" y1="22" x2="12" y2="18"></line>
            </svg>
            <h2 className="text-xs font-bold text-slate-800 dark:text-white tracking-widest uppercase">Survival Mode</h2>
            
            {quiz && score === null && (
               <div className="ml-2 bg-transparent px-3 py-1 rounded-full border border-red-500/30 flex items-center gap-2">
                 <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping"></div>
                 <span className="text-red-600 dark:text-red-400 font-mono font-bold text-xs">{timeLeft}s</span>
               </div>
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
          {!quiz ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-8">
              {/* Sleek SVG replacing the Stopwatch Emoji */}
              <div className="w-20 h-20 rounded-full flex items-center justify-center border border-red-200 dark:border-red-500/20 bg-gradient-to-b from-transparent to-red-50 dark:to-red-900/10 shadow-inner">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-red-500">
                  <circle cx="12" cy="13" r="8"></circle>
                  <polyline points="12 9 12 13 14 15"></polyline>
                  <line x1="12" y1="2" x2="12" y2="4"></line>
                  <line x1="8" y1="2" x2="16" y2="2"></line>
                </svg>
              </div>
              
              <div>
                <h3 className="text-xl font-black text-slate-800 dark:text-white mb-2 tracking-tight">Survival Assessment</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm max-w-xs mx-auto">10 seconds per question. Answer fast or fail.</p>
              </div>
              
              {/* Ghost Button Upgrade */}
              <button 
                onClick={generateQuiz}
                disabled={loading}
                className="px-8 py-3 bg-transparent border border-red-500/50 hover:border-red-500 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl font-bold text-xs tracking-widest uppercase transition-all shadow-sm flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-red-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    Engaging...
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                    Start Sequence
                  </>
                )}
              </button>
            </div>
          ) : score === null ? (
            <div className="space-y-6 max-w-4xl mx-auto h-full flex flex-col">
              
              <div className="w-full bg-slate-200 dark:bg-slate-800/50 h-1 rounded-full overflow-hidden shrink-0">
                <div 
                  className={`h-full transition-all duration-1000 ease-linear ${timeLeft <= 3 ? 'bg-red-500' : 'bg-red-500/50'}`} 
                  style={{ width: `${(timeLeft / 10) * 100}%` }}
                ></div>
              </div>

              <div className="animate-fade-in py-4 shrink-0">
                <div className="flex justify-between items-center mb-2 text-[10px] font-bold tracking-widest uppercase text-slate-400">
                  <span>Question {currentQIndex + 1} of {quiz.length}</span>
                </div>
                <h3 className="text-lg md:text-xl text-slate-800 dark:text-white font-bold leading-snug">
                  {quiz[currentQIndex].question}
                </h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pb-4">
                {quiz[currentQIndex].options.map((opt, idx) => {
                  const label = ["A", "B", "C", "D"][idx]; 
                  return (
                    <button
                      key={label}
                      onClick={() => handleAnswer(label)}
                      className="text-left p-4 rounded-xl border bg-transparent border-slate-200 dark:border-white/5 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 hover:border-slate-300 dark:hover:border-white/20 transition-all group flex items-start"
                    >
                       <span className="font-bold text-slate-400 dark:text-slate-500 group-hover:text-blue-500 mr-4 text-sm mt-0.5">{label}</span> 
                       <span className="font-medium text-sm">{opt}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center animate-fade-in">
               <div className="mb-6 relative">
                  <div className={`w-24 h-24 rounded-full flex items-center justify-center border-2 bg-transparent ${score >= 3 ? 'border-green-500/50 text-green-500' : 'border-red-500/50 text-red-500'}`}>
                    <span className="text-3xl font-light font-mono">{Math.round((score/quiz.length)*100)}%</span>
                  </div>
               </div>
               <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2 uppercase tracking-wide">
                 {score >= 3 ? "Survival Successful" : "Critical Failure"}
               </h3>
               <p className="text-slate-500 dark:text-slate-400 mb-8 text-sm">
                 Secured {score} out of {quiz.length} points under pressure.
               </p>
               <button 
                 onClick={() => setQuiz(null)}
                 className="px-8 py-3 bg-transparent border border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-500 text-slate-600 dark:text-slate-300 text-xs font-bold tracking-widest uppercase rounded-xl transition-all"
               >
                 Acknowledge
               </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default QuizArena;