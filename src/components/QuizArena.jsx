import React, { useState, useEffect } from 'react';
import { getGeminiResponse } from '../gemini'; 

const QuizArena = ({ extractedText, theme }) => {
  const [quiz, setQuiz] = useState(null);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [score, setScore] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [timeLeft, setTimeLeft] = useState(10); 

  useEffect(() => {
    if (!quiz || score !== null) return; 
    if (timeLeft === 0) { handleAnswer(null); return; }
    const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, quiz, score]);

  const generateQuiz = async () => {
    if (!extractedText) return alert("Please GENERATE A ROADMAP first.");
    setLoading(true); setScore(null); setAnswers({}); setCurrentQIndex(0);
    try {
      const prompt = `Based on this study plan: "${extractedText.substring(0, 15000)}", generate 5 multiple choice questions. Return strictly valid JSON array format: [{ "id": 1, "question": "...", "options": ["A", "B", "C", "D"], "correct": "A" }]`;
      const text = await getGeminiResponse(prompt, null);
      const cleanJson = text.replace(/```json|```/g, '').trim();
      setQuiz(JSON.parse(cleanJson));
      setTimeLeft(10); 
    } catch (e) {
      alert("Failed to generate quiz.");
    }
    setLoading(false);
  };

  const handleAnswer = (selectedLabel) => {
    const currentQ = quiz[currentQIndex];
    setAnswers(prev => ({...prev, [currentQ.id]: selectedLabel}));
    if (currentQIndex < quiz.length - 1) {
      setCurrentQIndex(prev => prev + 1); setTimeLeft(10); 
    } else {
      let correctCount = 0;
      const finalAnswers = {...answers, [currentQ.id]: selectedLabel};
      quiz.forEach(q => { if (finalAnswers[q.id] === q.correct) correctCount++; });
      setScore(correctCount);
    }
  };

  return (
    <>
      {isExpanded && <div className="h-[600px] w-full hidden lg:block" />}
      {isExpanded && <div className="fixed inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-md z-40" onClick={() => setIsExpanded(false)} />}

      <div className={`flex flex-col backdrop-blur-xl rounded-3xl overflow-hidden shadow-xl transition-all duration-300 ${isExpanded ? "fixed inset-4 md:inset-12 z-50" : "h-[600px] relative"} ${theme === 'luxury' ? 'bg-[#1A1C23]/90 border border-[#3A312A]' : 'bg-white/60 dark:bg-slate-900/60 border border-slate-200 dark:border-white/5'}`}>
        
        <div className={`p-5 border-b flex justify-between items-center ${theme === 'luxury' ? 'bg-[#14151A]/80 border-[#3A312A]' : 'bg-slate-50/50 dark:bg-[#0a0c10]/50 border-slate-200 dark:border-white/5'}`}>
          <div className="flex items-center gap-3">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={theme === 'luxury' ? 'text-[#A58B74]' : 'text-red-500'}><circle cx="12" cy="12" r="10"></circle><line x1="22" y1="12" x2="18" y2="12"></line><line x1="6" y1="12" x2="2" y2="12"></line><line x1="12" y1="6" x2="12" y2="2"></line><line x1="12" y1="22" x2="12" y2="18"></line></svg>
            <h2 className={`text-xs font-bold tracking-widest uppercase ${theme === 'luxury' ? 'text-[#C8B3A2]' : 'text-slate-800 dark:text-white'}`}>Survival Mode</h2>
          </div>
          <button onClick={() => setIsExpanded(!isExpanded)} className={`p-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-colors ${theme === 'luxury' ? 'text-[#6E7381] hover:text-[#D6C7B9] hover:bg-[#23252E]' : 'text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-white/10'}`}>
            {isExpanded ? "Close" : "Expand"}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {!quiz ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-8">
              <div className={`w-20 h-20 rounded-full flex items-center justify-center border shadow-inner ${theme === 'luxury' ? 'border-[#4A3B32] bg-[#14151A] text-[#A58B74]' : 'border-red-200 dark:border-red-500/20 bg-gradient-to-b from-transparent to-red-50 dark:to-red-900/10 text-red-500'}`}>
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="13" r="8"></circle><polyline points="12 9 12 13 14 15"></polyline><line x1="12" y1="2" x2="12" y2="4"></line><line x1="8" y1="2" x2="16" y2="2"></line></svg>
              </div>
              <div>
                <h3 className={`text-xl font-black tracking-tight ${theme === 'luxury' ? 'text-[#C8B3A2]' : 'text-slate-800 dark:text-white mb-2'}`}>Survival Assessment</h3>
                <p className={`text-sm max-w-xs mx-auto mt-2 ${theme === 'luxury' ? 'text-[#6E7381]' : 'text-slate-500 dark:text-slate-400'}`}>10 seconds per question. Answer fast or fail.</p>
              </div>
              <button onClick={generateQuiz} disabled={loading} className={`px-8 py-3 border rounded-xl font-bold text-xs tracking-widest uppercase transition-all shadow-sm flex items-center gap-3 ${theme === 'luxury' ? 'border-[#A58B74] text-[#A58B74] hover:bg-[#14151A]' : 'bg-transparent border-red-500/50 hover:border-red-500 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10'}`}>
                {loading ? "Engaging..." : "Start Sequence"}
              </button>
            </div>
          ) : score === null ? (
            <div className="space-y-6 max-w-4xl mx-auto h-full flex flex-col">
              <div className={`w-full h-1 rounded-full overflow-hidden shrink-0 ${theme === 'luxury' ? 'bg-[#23252E]' : 'bg-slate-200 dark:bg-slate-800/50'}`}>
                <div className={`h-full transition-all duration-1000 ease-linear ${theme === 'luxury' ? 'bg-[#A58B74]' : timeLeft <= 3 ? 'bg-red-500' : 'bg-red-500/50'}`} style={{ width: `${(timeLeft / 10) * 100}%` }}></div>
              </div>
              <div className="py-4 shrink-0">
                <h3 className={`text-lg md:text-xl font-bold leading-snug ${theme === 'luxury' ? 'text-[#D6C7B9]' : 'text-slate-800 dark:text-white'}`}>{quiz[currentQIndex].question}</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pb-4">
                {quiz[currentQIndex].options.map((opt, idx) => (
                  <button key={idx} onClick={() => handleAnswer(["A", "B", "C", "D"][idx])} className={`text-left p-4 rounded-xl border transition-all flex items-start ${theme === 'luxury' ? 'bg-transparent border-[#3A312A] text-[#D6C7B9] hover:bg-[#14151A] hover:border-[#8C725D]' : 'bg-transparent border-slate-200 dark:border-white/5 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 hover:border-slate-300 dark:hover:border-white/20'}`}>
                    <span className="font-medium text-sm">{opt}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center">
               <h3 className={`text-xl font-bold uppercase tracking-wide ${theme === 'luxury' ? 'text-[#C8B3A2]' : 'text-slate-800 dark:text-white'}`}>Assessment Complete</h3>
               <p className="mb-8 mt-2 text-sm text-slate-500">Secured {score} out of {quiz.length} points.</p>
               <button onClick={() => setQuiz(null)} className={`px-8 py-3 border text-xs font-bold tracking-widest uppercase rounded-xl transition-all ${theme === 'luxury' ? 'border-[#4A3B32] text-[#A58B74] hover:bg-[#1C1E26]' : 'border-slate-300 dark:border-slate-700 hover:border-slate-400 text-slate-600 dark:text-slate-300'}`}>Acknowledge</button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default QuizArena;