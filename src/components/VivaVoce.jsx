import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenerativeAI } from "@google/generative-ai";

const VivaVoce = ({ extractedText }) => {
  const [question, setQuestion] = useState("");
  const [transcript, setTranscript] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [loading, setLoading] = useState(false);

  const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);
  const recognitionRef = useRef(null);

  // Setup Speech Recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;

      recognitionRef.current.onresult = (event) => {
        let currentTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }
        setTranscript(currentTranscript);
      };

      recognitionRef.current.onerror = (event) => {
        console.error("Speech recognition error", event.error);
        setIsListening(false);
      };
    } else {
      console.warn("Speech Recognition API not supported in this browser.");
    }
  }, []);

  const speak = (text) => {
    const synth = window.speechSynthesis;
    const utterance = new SpeechSynthesisUtterance(text);
    // Try to find a good English voice
    const voices = synth.getVoices();
    const englishVoice = voices.find(v => v.lang.includes('en-') && v.name.includes('Google')) || voices[0];
    if (englishVoice) utterance.voice = englishVoice;
    utterance.rate = 0.9;
    synth.speak(utterance);
  };

  const generateQuestion = async () => {
    if (!extractedText) return alert("Generate a roadmap first!");
    setLoading(true);
    setFeedback(null);
    setTranscript("");
    
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
      const prompt = `
        Based on this study material: "${extractedText.substring(0, 10000)}", 
        ask one challenging interview-style question to test the student's conceptual understanding.
        Keep the question under 2 sentences. Do not provide the answer.
      `;
      
      const result = await model.generateContent(prompt);
      const qText = result.response.text();
      setQuestion(qText);
      speak(qText);
    } catch (error) {
      console.error(error);
      alert("Failed to generate a question.");
    }
    setLoading(false);
  };

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      setTranscript("");
      recognitionRef.current?.start();
      setIsListening(true);
    }
  };

  const submitAnswer = async () => {
    if (isListening) toggleListening();
    if (!transcript.trim()) return alert("Please speak an answer first!");
    
    setLoading(true);
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
      const prompt = `
        You are a strict but fair professor.
        The question you asked was: "${question}"
        The student's spoken answer was: "${transcript}"
        
        Evaluate the student's answer based on the following study material: "${extractedText.substring(0, 10000)}".
        Give a brief, encouraging 2-sentence feedback, and a score out of 10.
        Format your response exactly like this:
        Score: X/10
        Feedback: [Your feedback here]
      `;
      
      const result = await model.generateContent(prompt);
      const evaluation = result.response.text();
      setFeedback(evaluation);
      speak("Here is my evaluation. " + evaluation.replace("Score:", "You scored").replace("Feedback:", ""));
    } catch (error) {
      console.error(error);
      alert("Failed to evaluate answer.");
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col h-[600px] bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl relative">
      <div className="p-6 border-b border-white/5 bg-white/5 flex items-center gap-3">
        <div className="text-2xl">🎙️</div>
        <h2 className="text-xl font-bold text-white tracking-wide">VIVA VOCE SIMULATOR</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-6 flex flex-col items-center justify-center text-center space-y-6">
        {!question ? (
          <div className="space-y-4">
            <div className="w-20 h-20 mx-auto bg-blue-500/10 rounded-full flex items-center justify-center border border-blue-500/20">
               <span className="text-4xl animate-bounce">🤖</span>
            </div>
            <h3 className="text-2xl font-bold text-white">Oral Exam</h3>
            <p className="text-slate-400">The AI will ask you a question out loud. Speak your answer to get graded.</p>
            <button 
              onClick={generateQuestion}
              disabled={loading}
              className="mt-4 px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold shadow-lg transition-all"
            >
              {loading ? "Preparing..." : "Start Interview"}
            </button>
          </div>
        ) : (
          <div className="w-full space-y-6 animate-fade-in">
            <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
              <p className="text-sm text-blue-400 font-bold mb-2 uppercase">Professor Asks:</p>
              <p className="text-lg text-white font-medium">"{question}"</p>
            </div>

            <div className="space-y-4">
              <button 
                onClick={toggleListening}
                className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center shadow-lg transition-all ${
                  isListening 
                    ? 'bg-red-500 animate-pulse ring-4 ring-red-500/30' 
                    : 'bg-slate-700 hover:bg-slate-600'
                }`}
              >
                <span className="text-3xl">{isListening ? '🛑' : '🎤'}</span>
              </button>
              <p className="text-slate-400 text-sm">
                {isListening ? "Recording... Click to stop." : "Click microphone to speak"}
              </p>
            </div>

            <div className="bg-black/30 h-32 p-4 rounded-xl border border-white/5 overflow-y-auto text-left">
               <p className="text-slate-300 italic">
                 {transcript || "Your spoken answer will appear here..."}
               </p>
            </div>

            {!feedback ? (
               <button 
                 onClick={submitAnswer}
                 disabled={!transcript || loading}
                 className="w-full py-4 bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl disabled:opacity-50 transition-all"
               >
                 {loading ? "Evaluating..." : "Submit Answer"}
               </button>
            ) : (
               <div className="bg-green-900/20 p-6 rounded-2xl border border-green-500/30 text-left space-y-2">
                 <p className="text-green-400 font-bold uppercase text-sm">Evaluation:</p>
                 <p className="text-white whitespace-pre-line">{feedback}</p>
                 <button 
                   onClick={() => { setQuestion(""); setTranscript(""); setFeedback(null); }}
                   className="mt-4 w-full py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-bold"
                 >
                   Next Question
                 </button>
               </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default VivaVoce;