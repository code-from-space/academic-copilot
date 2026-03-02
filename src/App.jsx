import React, { useState, useEffect } from 'react';
import { storage } from './firebaseConfig';
import { ref, uploadBytes } from "firebase/storage";
import { getGeminiResponse } from './gemini';
import ChatLounge from './components/ChatLounge';
import QuizArena from './components/QuizArena';
import VivaVoce from './components/VivaVoce';

function App() {
  const [file, setFile] = useState(null);
  const [extraTopics, setExtraTopics] = useState("");
  const [studyDays, setStudyDays] = useState(7);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState({ roadmap: [], library: [], youtube: [] });
  const [fullSyllabusText, setFullSyllabusText] = useState("");
  
  // THEME STATE (Default to Dark)
  const [isDarkMode, setIsDarkMode] = useState(true);

  // Apply the dark class to the HTML tag whenever the toggle changes
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const fileToGenerativePart = async (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve({
        inlineData: {
          data: reader.result.split(',')[1],
          mimeType: file.type
        }
      });
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const fetchRealYouTubeVideos = async (query) => {
    const apiKey = import.meta.env.VITE_YOUTUBE_API_KEY;
    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=3&q=${encodeURIComponent(query)}&type=video&key=${apiKey}`;
    try {
      const response = await fetch(url);
      const result = await response.json();
      if (!result.items) return [];
      return result.items.map(item => ({
        title: item.snippet.title,
        videoId: item.id.videoId,
        reason: "Highly rated tutorial for your roadmap topic."
      }));
    } catch (error) {
      console.error("YouTube API Error:", error);
      return [];
    }
  };

  const handleAnalyze = async () => {
    if (!file && !extraTopics) return alert("Please upload a file or enter topics!");
    setLoading(true);
    
    try {
      let filePart = null;
      if (file) {
        filePart = await fileToGenerativePart(file);
        const fileRef = ref(storage, `documents/${file.name}`);
        await uploadBytes(fileRef, file);
      }

      const prompt = `
        Role: Academic Copilot.
        Instruction: Analyze the attached document (if any) and these topics: ${extraTopics}.
        Timeframe: Create a study plan for ${studyDays} days.
        Provide a JSON response ONLY:
        {
          "roadmap": [{"day": 1, "topic": "Topic Name", "task": "Specific task"}],
          "library": [{"title": "Book Name", "author": "Author"}],
          "youtubeSearchQuery": "Specific YouTube search term for these topics"
        }
      `;
      
      const responseText = await getGeminiResponse(prompt, filePart);
      const cleanJson = responseText.replace(/```json|```/g, "");
      const aiData = JSON.parse(cleanJson);

      setFullSyllabusText(JSON.stringify(aiData)); 

      const searchQuery = aiData.youtubeSearchQuery || extraTopics || "Education";
      const realVideos = await fetchRealYouTubeVideos(searchQuery);

      setData({
        roadmap: aiData.roadmap,
        library: aiData.library,
        youtube: realVideos
      });

    } catch (error) {
      console.error("Analysis Error:", error);
      alert("Something went wrong with the AI. Please try again.");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen transition-colors duration-500 bg-[#f0f4f8] dark:bg-black text-slate-800 dark:text-slate-200 p-6 md:p-12 relative">
      
      {/* THEME TOGGLE BUTTON */}
      <button 
        onClick={() => setIsDarkMode(!isDarkMode)}
        className="absolute top-6 right-6 z-50 p-4 rounded-full bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200 dark:border-white/10 shadow-xl hover:scale-110 transition-all duration-300 flex items-center justify-center"
      >
        <span className="text-2xl">{isDarkMode ? '☀️' : '🌙'}</span>
      </button>

      <header className="max-w-6xl mx-auto mb-16 text-center pt-8">
        <h1 className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-500">
          STUDY FORGE
        </h1>
        <p className="text-slate-500 mt-2 uppercase tracking-widest text-xs font-bold">Integrated Intelligence</p>
      </header>

      <main className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* LEFT COLUMN: INPUTS */}
        <section className="space-y-6 bg-white/60 dark:bg-slate-900/40 p-8 rounded-3xl border border-slate-200 dark:border-white/5 backdrop-blur-xl h-fit shadow-xl dark:shadow-none transition-colors duration-500">
          <label className="block text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest">1. Syllabus Upload</label>
          <div className="w-full">
            <label htmlFor="file-upload" className="w-full flex flex-col items-center justify-center bg-blue-50 hover:bg-blue-100 dark:bg-blue-600/10 dark:hover:bg-blue-600/20 border-2 border-dashed border-blue-300 dark:border-blue-600/30 rounded-2xl py-6 cursor-pointer transition-all">
              <span className="text-blue-700 dark:text-blue-500 font-bold text-sm">
                {file ? `✓ ${file.name}` : "Click to select file"}
              </span>
            </label>
            <input id="file-upload" type="file" className="hidden" onChange={(e) => setFile(e.target.files[0])} />
          </div>
          
          <label className="block text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest">2. Priority Topics</label>
          <textarea className="w-full h-32 bg-white/80 dark:bg-black/50 border border-slate-300 dark:border-white/10 rounded-2xl p-4 text-sm outline-none focus:ring-1 focus:ring-blue-500 transition-colors" value={extraTopics} onChange={(e) => setExtraTopics(e.target.value)} />
          
          <label className="block text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest">3. Days</label>
          <input type="number" value={studyDays} onChange={(e) => setStudyDays(e.target.value)} className="w-full bg-white/80 dark:bg-black/50 border border-slate-300 dark:border-white/10 rounded-xl p-3 outline-none transition-colors" />

          <button onClick={handleAnalyze} disabled={loading} className="w-full bg-blue-600 py-4 rounded-2xl text-white font-bold hover:bg-blue-700 dark:hover:bg-blue-500 transition-all shadow-lg shadow-blue-500/30">
            {loading ? "PROCESSING..." : "GENERATE ROADMAP 🚀"}
          </button>
        </section>

        {/* RIGHT COLUMN: ROADMAP & LIBRARY */}
        <section className="lg:col-span-2 space-y-6">
          <div className="bg-white/60 dark:bg-slate-900/40 p-8 rounded-3xl border border-slate-200 dark:border-white/5 backdrop-blur-xl shadow-xl dark:shadow-none transition-colors duration-500">
            <h2 className="text-2xl font-bold mb-6 border-l-4 border-blue-500 pl-4 text-slate-800 dark:text-white">Roadmap</h2>
            <div className="grid gap-4">
              {data.roadmap.length === 0 && <p className="text-slate-500 italic">Your plan will appear here...</p>}
              {data.roadmap.map((day, i) => (
                <div key={i} className="flex gap-4 p-4 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-white/5 hover:bg-white dark:hover:bg-white/10 transition-colors shadow-sm dark:shadow-none">
                  <div className="h-8 w-8 bg-blue-100 dark:bg-blue-600/20 text-blue-700 dark:text-blue-400 rounded-full flex items-center justify-center text-xs font-bold shrink-0">D{day.day}</div>
                  <div><h4 className="font-bold text-slate-900 dark:text-white text-sm">{day.topic}</h4><p className="text-xs text-slate-600 dark:text-slate-400">{day.task}</p></div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white/60 dark:bg-slate-900/40 p-8 rounded-3xl border border-slate-200 dark:border-white/5 backdrop-blur-xl shadow-xl dark:shadow-none transition-colors duration-500">
            <h2 className="text-xl font-bold text-purple-600 dark:text-purple-400 mb-4 flex items-center">📚 Library Archive</h2>
            <div className="flex flex-wrap gap-2">
              {data.library.length === 0 && <p className="text-slate-500 italic text-xs">Recommended books will appear here...</p>}
              {data.library.map((book, i) => (
                <div key={i} className="px-3 py-1 bg-white dark:bg-black border border-slate-200 dark:border-white/10 rounded-full text-[10px] text-slate-700 dark:text-slate-300 shadow-sm dark:shadow-none">
                  <span className="font-bold text-purple-600 dark:text-purple-400">{book.title}</span> – {book.author}
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* INTERACTIVE SECTION: CHAT, QUIZ, & VIVA */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8 mt-10">
        <ChatLounge extractedText={fullSyllabusText} />
        <QuizArena extractedText={fullSyllabusText} />
        <VivaVoce extractedText={fullSyllabusText} />
      </div>

      {/* YOUTUBE SECTION */}
      {data.youtube && data.youtube.length > 0 && (
        <section className="max-w-6xl mx-auto mt-12 mb-20">
          <h2 className="text-3xl font-black text-red-600 dark:text-red-500 mb-8 border-l-4 border-red-600 pl-4 uppercase tracking-tighter">Tutorial Lounge 📺</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {data.youtube.map((video, i) => (
              <a key={i} href={`https://www.youtube.com/watch?v=${video.videoId}`} target="_blank" rel="noopener noreferrer" className="group bg-white/80 dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-3xl overflow-hidden hover:border-red-500 dark:hover:border-red-600/50 transition-all flex flex-col shadow-lg dark:shadow-none">
                <div className="relative aspect-video overflow-hidden bg-slate-200 dark:bg-slate-800">
                  <img src={`https://i.ytimg.com/vi/${video.videoId}/hqdefault.jpg`} className="w-full h-full object-cover group-hover:scale-105 transition-all" onError={(e) => { e.target.src = `https://img.youtube.com/vi/${video.videoId}/mqdefault.jpg`; }} />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/10 dark:bg-black/30 group-hover:bg-transparent transition-all">
                    <div className="h-12 w-12 bg-red-600 text-white rounded-full flex items-center justify-center shadow-2xl scale-90 group-hover:scale-110 transition-transform">▶</div>
                  </div>
                </div>
                <div className="p-5 flex-grow"><h4 className="font-bold text-slate-900 dark:text-white text-sm line-clamp-2">{video.title}</h4><p className="text-[10px] text-slate-500 italic mt-2 leading-relaxed">"{video.reason}"</p></div>
              </a>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

export default App;