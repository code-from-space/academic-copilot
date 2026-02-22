import React, { useState } from 'react';
import { getGeminiResponse } from '../gemini'; 

const VivaVoce = ({ extractedText }) => {
  const [questions, setQuestions] = useState([]);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [gameState, setGameState] = useState('idle'); 
  const [isExpanded, setIsExpanded] = useState(false); // NEW: Fullscreen state
  
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
    
    if (isCorrect) {
      setScore(s => s + 1);
      speak("Correct!");
    } else {
      speak("Wrong.");
    }

    if (currentQIndex < questions.length - 1) {
      setTimeout(() => {
        setCurrentQIndex(prev => prev + 1);
        speak(`Next. ${questions[currentQIndex + 1].q}`);
      }, 1000);
    } else {
      setTimeout(() => {
        setGameState('finished');
        speak(`Game over. You got ${score + (isCorrect ? 1 : 0)} out of ${questions.length}`);
      }, 1000);
    }
  };

  return (
    <>
      {isExpanded && <div className="h-[600px] w-full hidden lg:block" />}
      
      {isExpanded && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 transition-opacity"
          onClick={() => setIsExpanded(false)}
        />
      )}

      <div className={`flex flex-col bg-slate-900/90 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl transition-all duration-300 ${
        isExpanded ? "fixed inset-4 md:inset-12 z-50" : "h-[600px] relative"
      }`}>
        
        {/* HEADER */}
        <div className="p-6 border-b border-white/5 bg-white/5 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold text-white tracking-wide flex items-center gap-2">
              🎙️ VIVA SPEED ROUND
            </h2>
            {gameState === 'playing' && (
               <span className="bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full animate-pulse">
                 LIVE
               </span>
            )}
          </div>
          <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-slate-400 hover:text-white transition-colors bg-white/5 p-2 rounded-lg hover:bg-white/10"
          >
            {isExpanded ? '⨯' : '⤢ '}
          </button>
        </div>

        {/* BODY (Fixed Overflow/Scrolling here!) */}
        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-slate-700">
          
          {gameState === 'idle' && (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-6">
              <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-orange-600 rounded-full flex items-center justify-center shadow-lg shadow-orange-900/40">
                 <span className="text-4xl">⚡</span>
              </div>
              <div>
                 <h3 className="text-2xl font-bold text-white">Rapid Fire Mode</h3>
                 <p className="text-slate-400 max-w-xs mx-auto mt-2">
                   The AI speaks. You answer. Fast paced. 5 Questions.
                 </p>
              </div>
              <button 
                onClick={startGame}
                className="px-8 py-4 bg-white text-red-600 rounded-xl font-black text-lg hover:scale-105 transition-transform shadow-xl"
              >
                START GAME
              </button>
            </div>
          )}

          {gameState === 'loading' && (
            <div className="h-full flex flex-col items-center justify-center text-white animate-pulse">
              <div className="text-4xl mb-4">🧠</div>
              <p className="font-bold">Generating Speed Questions...</p>
            </div>
          )}

          {gameState === 'playing' && questions.length > 0 && (
            <div className="max-w-4xl mx-auto h-full flex flex-col">
              {/* Progress Bar */}
              <div className="w-full bg-slate-800 h-2 rounded-full mb-6 overflow-hidden shrink-0">
                <div 
                  className="bg-red-500 h-full transition-all duration-500" 
                  style={{ width: `${((currentQIndex + 1) / questions.length) * 100}%` }}
                ></div>
              </div>

              {/* Question Text */}
              <div className="bg-slate-800/30 border border-white/5 p-6 rounded-2xl mb-6 shrink-0">
                 <h3 className="text-xl md:text-3xl font-black text-white text-center leading-relaxed">
                   {questions[currentQIndex].q}
                 </h3>
              </div>

              {/* Options Grid */}
              <div className="grid grid-cols-1 gap-4 pb-6">
                {questions[currentQIndex].options.map((opt, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleAnswer(idx)}
                    className="bg-slate-800/80 hover:bg-blue-600 border border-white/5 text-left p-4 md:p-6 rounded-2xl transition-all group flex items-start"
                  >
                    <span className="font-bold text-slate-500 group-hover:text-white mr-4 text-xl">
                      {['A', 'B', 'C', 'D'][idx]}
                    </span>
                    <span className="text-white font-bold text-base md:text-lg leading-snug">
                      {opt.replace(/^[A-D]\) /, '')}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {gameState === 'finished' && (
             <div className="h-full flex flex-col items-center justify-center text-center space-y-6 animate-fade-in">
               <div className="text-6xl">🏆</div>
               <h3 className="text-4xl font-black text-white">
                 SCORE: {score}/{questions.length}
               </h3>
               <button 
                 onClick={() => setGameState('idle')}
                 className="px-8 py-3 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-xl"
               >
                 Play Again
               </button>
             </div>
          )}
        </div>
      </div>
    </>
  );
};

export default VivaVoce;