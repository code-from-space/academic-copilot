import React, { useState } from 'react';
import { GoogleGenerativeAI } from "@google/generative-ai";

const QuizArena = ({ extractedText }) => {
  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState({});
  const [score, setScore] = useState(null);
  const [loading, setLoading] = useState(false);

  const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

  const generateQuiz = async () => {
    if (!extractedText) return alert("Generate a roadmap first so I know what to quiz you on!");
    setLoading(true);
    setScore(null);
    setAnswers({});
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
      const prompt = `
        Based on this study plan data: "${extractedText.substring(0, 15000)}", 
        generate 5 multiple choice questions to test the user's understanding of the topics.
        Return strictly valid JSON array format:
        [
          { "id": 1, "question": "...", "options": ["A", "B", "C", "D"], "correct": "A" }
        ]
        Do not use markdown blocks. Just the raw JSON.
      `;
      
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      const cleanJson = text.replace(/```json|```/g, '').trim();
      setQuiz(JSON.parse(cleanJson));
    } catch (e) {
      console.error(e);
      alert("Failed to generate quiz. Try again.");
    }
    setLoading(false);
  };

  const checkResults = () => {
    let correct = 0;
    quiz.forEach(q => {
      if (answers[q.id] === q.correct) correct++;
    });
    setScore(correct);
  };

  return (
    <div className="flex flex-col h-[600px] bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl relative">
      {/* Header */}
      <div className="p-6 border-b border-white/5 bg-white/5 flex justify-between items-center">
        <h2 className="text-xl font-bold text-white tracking-wide">⚔️ EXAMINER MODE</h2>
        {quiz && (
           <button 
             onClick={() => setQuiz(null)}
             className="text-xs text-slate-400 hover:text-white uppercase font-bold"
           >
             Exit Quiz
           </button>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-slate-700">
        {!quiz ? (
          // STATE: NO QUIZ (Centering the button nicely)
          <div className="h-full flex flex-col items-center justify-center text-center space-y-6">
            <div className="w-20 h-20 bg-purple-500/10 rounded-full flex items-center justify-center border border-purple-500/20">
              <span className="text-4xl">🎓</span>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-white mb-2">Ready to test yourself?</h3>
              <p className="text-slate-400 max-w-xs mx-auto">I'll generate 5 questions based on your current study roadmap.</p>
            </div>
            <button 
              onClick={generateQuiz}
              disabled={loading}
              className="px-8 py-4 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-bold shadow-lg shadow-purple-900/20 transition-all transform hover:scale-105"
            >
              {loading ? "Generating Questions..." : "Start Surprise Quiz"}
            </button>
          </div>
        ) : score === null ? (
          // STATE: QUIZ ACTIVE
          <div className="space-y-8">
            {quiz.map((q, i) => (
              <div key={q.id} className="animate-fade-in">
                <h3 className="text-lg text-white font-medium mb-4 flex gap-3">
                  <span className="text-purple-400 font-bold">Q{i+1}.</span> 
                  {q.question}
                </h3>
                <div className="grid grid-cols-1 gap-2 pl-4">
                  {q.options.map((opt, idx) => {
                    const label = ["A", "B", "C", "D"][idx]; // Map index to letter
                    return (
                      <button
                        key={label}
                        onClick={() => setAnswers({...answers, [q.id]: label})}
                        className={`text-left p-4 rounded-xl border transition-all ${
                          answers[q.id] === label 
                            ? 'bg-purple-600 border-purple-500 text-white shadow-lg' 
                            : 'bg-slate-800/50 border-white/5 text-slate-300 hover:bg-slate-800 hover:border-white/10'
                        }`}
                      >
                         <span className="font-bold mr-3 opacity-50">{idx + 1}.</span> {opt}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
            <div className="pt-4 pb-8">
              <button 
                onClick={checkResults}
                className="w-full py-4 bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl shadow-lg transition-all"
              >
                Submit Answers
              </button>
            </div>
          </div>
        ) : (
          // STATE: RESULTS
          <div className="h-full flex flex-col items-center justify-center text-center animate-fade-in">
             <div className="mb-6 relative">
                <div className={`w-32 h-32 rounded-full flex items-center justify-center border-4 ${score > 3 ? 'border-green-500 text-green-400' : 'border-orange-500 text-orange-400'}`}>
                  <span className="text-5xl font-black">{Math.round((score/quiz.length)*100)}%</span>
                </div>
             </div>
             <h3 className="text-3xl font-bold text-white mb-2">
               You scored {score} out of {quiz.length}
             </h3>
             <p className="text-slate-400 mb-8">
               {score === quiz.length ? "Perfect score! You mastered this." : "Review the roadmap and try again!"}
             </p>
             <button 
               onClick={() => setQuiz(null)}
               className="px-8 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-bold transition-all"
             >
               Close Exam
             </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuizArena;