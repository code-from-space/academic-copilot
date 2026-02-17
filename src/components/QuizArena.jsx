import React, { useState } from 'react';
import { GoogleGenerativeAI } from "@google/generative-ai";

const QuizArena = ({ extractedText }) => {
  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState({});
  const [score, setScore] = useState(null);
  const [loading, setLoading] = useState(false);

  const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

  const generateQuiz = async () => {
    setLoading(true);
    setScore(null);
    setAnswers({});
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
      const prompt = `
        Based on this text: "${extractedText.substring(0, 10000)}", 
        generate 3 multiple choice questions in strictly valid JSON format.
        Structure: [
          { "id": 1, "question": "...", "options": ["A", "B", "C", "D"], "correct": "A" }
        ]
        Do not use markdown formatting like \`\`\`json. Just raw JSON.
      `;
      
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      const cleanJson = text.replace(/```json|```/g, '').trim();
      setQuiz(JSON.parse(cleanJson));
    } catch (e) {
   console.error(e); // <--- This fixes the red line
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
    <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 mt-8 shadow-2xl">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white">⚔️ Examiner Mode</h2>
        <button 
          onClick={generateQuiz}
          disabled={loading}
          className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-bold transition-all"
        >
          {loading ? "Generating Exam..." : "Start Surprise Quiz"}
        </button>
      </div>

      {quiz && (
        <div className="space-y-6">
          {quiz.map((q) => (
            <div key={q.id} className="bg-slate-800 p-4 rounded-lg border border-slate-600">
              <p className="text-lg text-white mb-3">{q.question}</p>
              <div className="grid grid-cols-2 gap-2">
                {q.options.map((opt, idx) => {
                  const label = ["A", "B", "C", "D"][idx];
                  return (
                    <button
                      key={label}
                      onClick={() => setAnswers({...answers, [q.id]: label})}
                      className={`p-2 text-left rounded ${
                        answers[q.id] === label 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                      }`}
                    >
                      <span className="font-bold mr-2">{label}.</span> {opt}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
          
          <button 
            onClick={checkResults}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg mt-4"
          >
            Submit Answer Sheet
          </button>
        </div>
      )}

      {score !== null && (
        <div className="mt-6 p-4 bg-slate-800 border border-green-500 rounded-lg text-center">
          <h3 className="text-2xl text-green-400 font-bold">
            Score: {score} / {quiz.length}
          </h3>
          <p className="text-slate-400 mt-2">
            {score === quiz.length ? "Perfect! 🏆" : "Keep studying! 📚"}
          </p>
        </div>
      )}
    </div>
  );
};

export default QuizArena;