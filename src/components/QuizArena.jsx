import React, { useState, useEffect } from 'react';
import { getGeminiResponse } from '../gemini'; 

const QuizArena = ({ extractedText }) => {
  const [quiz, setQuiz] = useState(null);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [score, setScore] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [timeLeft, setTimeLeft] = useState(10); // The 10-second brutal timer

  // THE TIMER LOGIC
  useEffect(() => {
    if (!quiz || score !== null) return; 

    if (timeLeft === 0) {
      // Time is up! Auto-fail this question and move on.
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
      setTimeLeft(10); // Start the clock!
    } catch (e) {
      console.error("Quiz Error:", e);
      alert("Failed to generate quiz. Try again.");
    }
    setLoading(false);
  };

  const handleAnswer = (selectedLabel) => {
    const currentQ = quiz[currentQIndex];
    
    // Save the answer (null if they ran out of time)
    setAnswers(prev => ({...prev, [currentQ.id]: selectedLabel}));

    // Move to next question or end quiz
    if (currentQIndex < quiz.length - 1) {
      setCurrentQIndex(prev => prev + 1);
      setTimeLeft(10); // Reset clock for the next question
    } else {
      // Calculate final score
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
          className="fixed inset-0 bg-white/60 dark:bg-black/80 backdrop-blur-sm z-40 transition-opacity"
          onClick={() => setIsExpanded(false)}
        />
      )}

      <div className={`flex flex-col bg-white/80 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-3xl overflow-hidden shadow-2xl transition-all duration-300 ${
        isExpanded ? "fixed inset-4 md:inset-12 z-50" : "h-[600px] relative"
      }`}>
        
        <div className="p-6 border-b border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-white/5 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold text-slate-800 dark:text-white tracking-wide">⚔️ SURVIVAL MODE</h2>
            {quiz && score === null && (
               <div className="bg-red-100 dark:bg-red-500/20 px-3 py-1 rounded-full border border-red-200 dark:border-red-500/30 flex items-center gap-2">
                 <div className="w-2 h-2 rounded-full bg-red-500 animate-ping"></div>
                 <span className="text-red-600 dark:text-red-400 font-bold text-sm">{timeLeft}s</span>
               </div>
            )}
          </div>
          <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors bg-white dark:bg-white/5 border border-slate-200 dark:border-transparent p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 shadow-sm dark:shadow-none"
          >
            {isExpanded ? '↙️ Close Screen' : '⤢ Fullscreen'}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700">
          {!quiz ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-6">
              <div className="w-20 h-20 bg-red-100 dark:bg-red-500/10 rounded-full flex items-center justify-center border border-red-200 dark:border-red-500/20">
                <span className="text-4xl">⏱️</span>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Survival Assessment</h3>
                <p className="text-slate-500 dark:text-slate-400 max-w-xs mx-auto">10 seconds per question. Answer fast or fail.</p>
              </div>
              <button 
                onClick={generateQuiz}
                disabled={loading}
                className="px-8 py-4 bg-red-600 hover:bg-red-500 text-white rounded-xl font-black tracking-widest uppercase shadow-lg shadow-red-900/20 transition-all transform hover:scale-105"
              >
                {loading ? "Engaging..." : "Start Sequence"}
              </button>
            </div>
          ) : score === null ? (
            <div className="space-y-6 max-w-4xl mx-auto h-full flex flex-col">
              
              {/* THE SHRINKING TIMER BAR */}
              <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden shrink-0">
                <div 
                  className={`h-full transition-all duration-1000 ease-linear ${timeLeft <= 3 ? 'bg-red-500' : 'bg-orange-400'}`} 
                  style={{ width: `${(timeLeft / 10) * 100}%` }}
                ></div>
              </div>

              <div className="animate-fade-in bg-white dark:bg-slate-800/30 p-6 rounded-2xl border border-slate-100 dark:border-white/5 shadow-sm dark:shadow-none mb-4 shrink-0">
                <div className="flex justify-between items-center mb-4 text-sm font-bold text-slate-400">
                  <span>QUESTION {currentQIndex + 1} OF {quiz.length}</span>
                </div>
                <h3 className="text-xl md:text-2xl text-slate-800 dark:text-white font-black leading-snug">
                  {quiz[currentQIndex].question}
                </h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4">
                {quiz[currentQIndex].options.map((opt, idx) => {
                  const label = ["A", "B", "C", "D"][idx]; 
                  return (
                    <button
                      key={label}
                      onClick={() => handleAnswer(label)}
                      className="text-left p-5 rounded-xl border bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-white/5 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 hover:border-slate-300 dark:hover:border-white/20 transition-all group flex items-start shadow-sm dark:shadow-none"
                    >
                       <span className="font-black text-slate-400 group-hover:text-slate-600 dark:group-hover:text-white mr-4 opacity-50">{label}.</span> 
                       <span className="font-medium text-lg">{opt}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center animate-fade-in">
               <div className="mb-6 relative">
                  <div className={`w-32 h-32 rounded-full flex items-center justify-center border-4 bg-white dark:bg-transparent shadow-lg dark:shadow-none ${score >= 3 ? 'border-green-500 text-green-600 dark:text-green-400' : 'border-red-500 text-red-600 dark:text-red-400'}`}>
                    <span className="text-5xl font-black">{Math.round((score/quiz.length)*100)}%</span>
                  </div>
               </div>
               <h3 className="text-3xl font-black text-slate-800 dark:text-white mb-2 uppercase tracking-wide">
                 {score >= 3 ? "Survival Successful" : "Critical Failure"}
               </h3>
               <p className="text-slate-500 dark:text-slate-400 mb-8 font-medium">
                 You secured {score} out of {quiz.length} points under pressure.
               </p>
               <button 
                 onClick={() => setQuiz(null)}
                 className="px-8 py-3 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-white font-bold rounded-xl transition-all shadow-sm"
               >
                 Acknowledge & Close
               </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default QuizArena;