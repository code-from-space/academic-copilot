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
        You are an elite Exam Triage AI. The user has an exam in exactly ${studyDays} days. 
        Analyze the syllabus and extra topics: "${fullSyllabusText.substring(0, 15000)}" | "${extraTopics}"
        
        Return the response strictly in valid JSON format matching this exact object structure:
        {
          "roadmap": [
            { 
              "day": 1, 
              "topic": "Main Concept", 
              "tasks": ["Task 1", "Task 2"], 
              "youtube_query": "Specific Search Query",
              "timestamp": "12:45 - 18:20"
            }
          ],
          "library": [
            { "title": "Book/Resource Name", "reason": "Why it helps" }
          ],
          "youtubeSearchQuery": "One general overarching YouTube search query for this entire syllabus"
        }
        Do not include markdown blocks like \`\`\`json. Just raw JSON.
      `;
      
      const responseText = await getGeminiResponse(prompt, null);
      const cleanJson = responseText.replace(/```json|```/g, "").trim();
      const aiData = JSON.parse(cleanJson);

      setFullSyllabusText(JSON.stringify(aiData));

      // NEW LOGIC: Fetch a specific video for every single day in the roadmap!
      const roadmapWithRealVideos = await Promise.all(
        (aiData.roadmap || []).map(async (dayPlan) => {
          if (dayPlan.youtube_query) {
            // Use your existing function to search YouTube
            const videos = await fetchRealYouTubeVideos(dayPlan.youtube_query);
            // Grab the #1 top result and attach it directly to this day's data
            dayPlan.video = videos.length > 0 ? videos[0] : null; 
          }
          return dayPlan;
        })
      );

      // Save everything properly to state
      setData({
        roadmap: roadmapWithRealVideos,
        library: aiData.library || [],
        youtube: [] // We don't need the global sidebar videos anymore since they are in the roadmap!
      });
      setLoading(false);

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
       STUDYFORGE
     </h1>
     <p className="text-slate-500 mt-2 uppercase tracking-widest text-xs font-bold">Integrated Intelligence</p>
   </header>

   {/* EXAM TRIAGE DASHBOARD - NEW VIBE */}
      <div className="max-w-6xl mx-auto mb-12 grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* T-MINUS COUNTDOWN CLOCK */}
        <div className="col-span-1 md:col-span-1 bg-red-500/10 border border-red-500/30 rounded-3xl p-6 backdrop-blur-xl shadow-lg dark:bg-red-900/20 flex flex-col items-center justify-center animate-pulse">
          <h3 className="text-red-600 dark:text-red-400 font-black tracking-widest uppercase text-sm mb-2">
            Exam T-Minus
          </h3>
          <div className="text-5xl font-black text-red-600 dark:text-red-400 font-mono tracking-tighter">
            23:59:59
          </div>
          <p className="text-red-500/80 dark:text-red-400/80 text-xs mt-2 font-bold uppercase">
            Survival Mode Engaged
          </p>
        </div>

        {/* PROGRESS HEATMAP */}
        <div className="col-span-1 md:col-span-2 bg-white/60 dark:bg-slate-900/40 border border-slate-200 dark:border-white/5 rounded-3xl p-6 backdrop-blur-xl shadow-xl">
          <div className="flex justify-between items-end mb-4">
            <div>
              <h3 className="text-slate-800 dark:text-white font-black text-lg">Burn Rate Heatmap</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm">Syllabus concepts mastered</p>
            </div>
            <div className="text-green-500 font-black text-2xl">
              24%
            </div>
          </div>
          
          {/* THE GRID */}
          <div className="grid grid-cols-10 gap-2">
            {/* Generating 30 squares to look like a GitHub heatmap */}
            {[...Array(30)].map((_, i) => {
              // Fake logic to make some squares green to look like real data
              const isCompleted = i < 7; 
              const isCurrent = i === 7;
              
              return (
                <div 
                  key={i} 
                  className={`h-6 rounded-md transition-all duration-500 ${
                    isCompleted 
                      ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.4)]' 
                      : isCurrent 
                        ? 'bg-orange-400 animate-pulse shadow-[0_0_10px_rgba(249,115,22,0.4)]' 
                        : 'bg-slate-200 dark:bg-slate-800'
                  }`}
                ></div>
              )
            })}
          </div>
        </div>
      </div>

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
              {/* CRASH-PROOF ROADMAP RENDERING */}
              {data?.roadmap && data.roadmap.length > 0 ? (
                data.roadmap.map((dayPlan, index) => (
                  <div key={index} className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-md rounded-2xl p-6 border border-slate-200 dark:border-white/5 shadow-lg mb-6 transition-all hover:scale-[1.01]">
                    
                    {/* Header: Day & Topic */}
                    <div className="flex items-center justify-between mb-4 border-b border-slate-200 dark:border-white/5 pb-4">
                      <h3 className="text-2xl font-black text-slate-800 dark:text-white">Day {dayPlan?.day || index + 1}</h3>
                      <span className="px-3 py-1 bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 font-bold rounded-full text-sm">
                        {dayPlan?.topic || "Study Focus"}
                      </span>
                    </div>
                    
                    {/* Task List */}
                    <ul className="space-y-3 mb-6">
                      {dayPlan?.tasks && dayPlan.tasks.map((task, idx) => (
                        <li key={idx} className="flex items-start gap-3 text-slate-600 dark:text-slate-300 font-medium">
                          <span className="text-green-500 mt-0.5 text-lg">✓</span> {task}
                        </li>
                      ))}
                    </ul>

                    {/* THE YOUTUBE TIMESTAMP SECTION */}
                    {/* THE UPGRADED YOUTUBE THUMBNAIL SECTION */}
                  {dayPlan.youtube_query && (
                    <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-500/20 rounded-xl p-4 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between shadow-sm transition-all hover:border-red-400 dark:hover:border-red-500/50">
                      
                      {/* Video Thumbnail & Title Link */}
                      <div className="flex items-center gap-4 flex-1">
                        {dayPlan.video ? (
                          <a 
                            href={`https://www.youtube.com/watch?v=${dayPlan.video.videoId}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="relative shrink-0 group block overflow-hidden rounded-lg shadow-md"
                          >
                            {/* Fetch the high-quality YouTube thumbnail */}
                            <img 
                              src={`https://img.youtube.com/vi/${dayPlan.video.videoId}/hqdefault.jpg`} 
                              alt="Video Thumbnail" 
                              className="w-32 md:w-40 aspect-video object-cover group-hover:scale-105 transition-transform duration-300" 
                            />
                            <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors flex items-center justify-center">
                              <div className="bg-red-600 text-white rounded-full p-2 w-8 h-8 flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform">
                                ▶
                              </div>
                            </div>
                          </a>
                        ) : (
                          <div className="w-32 md:w-40 aspect-video bg-red-100 dark:bg-red-500/20 rounded-lg flex items-center justify-center shrink-0">
                            ▶️
                          </div>
                        )}
                        
                        <div>
                          <p className="text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-widest mb-1">Targeted Lesson</p>
                          <a 
                            href={dayPlan.video ? `https://www.youtube.com/watch?v=${dayPlan.video.videoId}` : `https://www.youtube.com/results?search_query=${dayPlan.youtube_query}`}
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-slate-800 dark:text-white font-bold text-sm md:text-base hover:text-red-600 dark:hover:text-red-400 transition-colors line-clamp-2"
                          >
                            {dayPlan.video ? dayPlan.video.title : `Search: "${dayPlan.youtube_query}"`}
                          </a>
                        </div>
                      </div>
                      
                      {/* Critical Timestamp Box */}
                      {dayPlan.timestamp && (
                        <div className="bg-white dark:bg-slate-900 border border-red-200 dark:border-red-500/30 px-5 py-3 rounded-lg text-center shrink-0 shadow-md">
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest mb-1">Critical Window</p>
                          <p className="text-red-600 dark:text-red-400 font-black font-mono text-lg md:text-xl animate-pulse">
                            ⏱ {dayPlan.timestamp}
                          </p>
                        </div>
                      )}
                      
                    </div>
                  )}

                  </div>
                ))
              ) : (
                <div className="text-center text-slate-500 p-8">
                  {/* Shows this if no roadmap exists yet to prevent crashes */}
                  Roadmap will appear here once generated...
                </div>
              )}
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











      {/* DEVELOPER CONTACT FOOTER */}
      <footer className="max-w-6xl mx-auto mt-12 mb-8 bg-white/60 dark:bg-slate-900/40 border border-slate-200 dark:border-white/5 rounded-3xl p-8 backdrop-blur-xl shadow-xl dark:shadow-none text-center transition-colors duration-500">
        <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-6">
          Connect with the Developer
        </h3>
        <div className="flex flex-wrap justify-center gap-4 md:gap-8">
          
          {/* Email */}
          <a href="mailto:your.email@example.com" className="px-6 py-3 bg-white dark:bg-slate-800 text-slate-800 dark:text-white rounded-xl font-medium hover:scale-105 transition-transform shadow-sm border border-slate-200 dark:border-white/5 flex items-center gap-2">
            ✉️ Email
          </a>

          

          {/* LinkedIn */}
          <a href="https://linkedin.com/in/yourprofile" target="_blank" rel="noopener noreferrer" className="px-6 py-3 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded-xl font-medium hover:scale-105 transition-transform shadow-sm border border-blue-200 dark:border-blue-500/20 flex items-center gap-2">
            💼 LinkedIn
          </a>

          

          {/* Instagram */}
          <a href="https://instagram.com/yourhandle" target="_blank" rel="noopener noreferrer" className="px-6 py-3 bg-pink-50 dark:bg-pink-900/20 text-pink-600 dark:text-pink-400 rounded-xl font-medium hover:scale-105 transition-transform shadow-sm border border-pink-200 dark:border-pink-500/20 flex items-center gap-2">
            📸 Instagram
          </a>

        </div>
      </footer>



















    </div>
  );
}

export default App;