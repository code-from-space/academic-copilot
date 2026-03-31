// import { storage } from './firebaseConfig';
// import { ref, uploadBytes } from "firebase/storage";
import React, { useState, useEffect } from 'react';
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
  
  // --- 3-WAY THEME STATE (Restored & Upgraded) ---
  const [theme, setTheme] = useState('dark'); // 'light', 'dark', or 'luxury'
  const isDarkMode = theme === 'dark' || theme === 'luxury'; 
  
  const cycleTheme = () => {
    if (theme === 'light') setTheme('dark');
    else if (theme === 'dark') setTheme('luxury');
    else setTheme('light');
  };

  // --- REAL-TIME EXAM & HEATMAP LOGIC ---
  const [examTimer, setExamTimer] = useState(null);
  const [completedTasks, setCompletedTasks] = useState(new Set());
  const [totalTasks, setTotalTasks] = useState(0);

  useEffect(() => {
    if (data?.roadmap && data.roadmap.length > 0) {
      // eslint-disable-next-line
      setExamTimer({ days: Math.max(0, Number(studyDays) - 1), hours: 23, minutes: 59, seconds: 59 });
      let count = 0;
      data.roadmap.forEach(day => { count += (day.tasks ? day.tasks.length : 0); });
      setTotalTasks(count);
      setCompletedTasks(new Set()); 
    }
  }, [data.roadmap, studyDays]);

  useEffect(() => {
    if (!examTimer) return;
    const timer = setInterval(() => {
      setExamTimer(prev => {
        if (!prev) return prev;
        let { days, hours, minutes, seconds } = prev;
        if (seconds > 0) { seconds--; }
        else {
          seconds = 59;
          if (minutes > 0) { minutes--; }
          else {
            minutes = 59;
            if (hours > 0) { hours--; }
            else { hours = 23; if (days > 0) days--; }
          }
        }
        return { days, hours, minutes, seconds };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [examTimer !== null]);

  const toggleTask = (taskId) => {
    setCompletedTasks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(taskId)) newSet.delete(taskId);
      else newSet.add(taskId);
      return newSet;
    });
  };

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
      
      const responseText = await getGeminiResponse(prompt, filePart);
      const cleanJson = responseText.replace(/```json|```/g, "").trim();
      const aiData = JSON.parse(cleanJson);

      setFullSyllabusText(JSON.stringify(aiData));

      const roadmapWithRealVideos = await Promise.all(
        (aiData.roadmap || []).map(async (dayPlan) => {
          if (dayPlan.youtube_query) {
            const videos = await fetchRealYouTubeVideos(dayPlan.youtube_query);
            dayPlan.video = videos.length > 0 ? videos[0] : null; 
          }
          return dayPlan;
        })
      );

      setData({
        roadmap: roadmapWithRealVideos,
        library: aiData.library || [],
        youtube: [] 
      });
      setLoading(false);

    } catch (error) {
      console.error("Analysis Error:", error);
      alert("Something went wrong with the AI. Please try again.");
    }
    setLoading(false);
  };

  return (
    <div className={`min-h-screen transition-colors duration-700 p-6 md:p-12 relative font-sans ${
      theme === 'luxury' 
        ? 'bg-[#121317] text-[#D6C7B9]' 
        : theme === 'dark'
          ? 'bg-black text-slate-200'
          : 'bg-[#f0f4f8] text-slate-800'
    }`}>
      
      {/* THE 3-WAY THEME TOGGLE (Clean SVGs) */}
      {/* THE 3-WAY THEME TOGGLE (Emoji Style) */}
      <button
        onClick={cycleTheme}
        className={`absolute top-6 right-6 z-50 w-14 h-14 rounded-full transition-all duration-300 shadow-xl flex items-center justify-center border hover:scale-110 ${
          theme === 'luxury' 
            ? 'bg-[#1A1C23] border-[#3A312A]' 
            : theme === 'dark'
              ? 'bg-[#111318] border-white/5'
              : 'bg-white border-slate-200'
        }`}
        title={`Current Mode: ${theme.toUpperCase()}`}
      >
        <span className="text-2xl drop-shadow-md transition-transform duration-300">
          {theme === 'light' && '🌙'}
          {theme === 'dark' && '☀️'}
          {theme === 'luxury' && '✨'}
        </span>
      </button>

      <header className="max-w-6xl mx-auto mb-16 text-center pt-8 transition-colors duration-500">
        <h1 className={`text-5xl md:text-6xl font-black text-transparent bg-clip-text transition-all duration-700 ${
          theme === 'luxury' 
            ? 'bg-gradient-to-r from-[#8C725D] via-[#C8B3A2] to-[#8C725D] tracking-tight' 
            : 'bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-500'
        }`}>
          STUDYFORGE
        </h1>
        <p className={`mt-2 uppercase tracking-widest text-xs font-bold transition-colors duration-500 ${
          theme === 'luxury' ? 'text-[#A58B74]' : 'text-slate-500'
        }`}>
          Your Academic Triage Partner
        </p>
      </header>

      {/* EXAM TRIAGE DASHBOARD */}
      <div className="max-w-6xl mx-auto mb-12 grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* T-MINUS CLOCK */}
        <div className={`col-span-1 md:col-span-1 rounded-3xl p-6 backdrop-blur-xl shadow-lg flex flex-col items-center justify-center transition-all ${
          theme === 'luxury'
            ? 'bg-[#1A1C23] border border-[#3A312A]'
            : 'bg-red-500/10 border border-red-500/30 dark:bg-red-900/20'
        }`}>
          <h3 className={`font-black tracking-widest uppercase text-sm mb-2 ${theme === 'luxury' ? 'text-[#8C725D]' : 'text-red-600 dark:text-red-400'}`}>
            Exam T-Minus
          </h3>
          <div className={`text-4xl md:text-5xl font-black font-mono tracking-tighter ${theme === 'luxury' ? 'text-[#C8B3A2]' : 'text-red-600 dark:text-red-400'}`}>
            {examTimer 
              ? `${examTimer.days}d ${String(examTimer.hours).padStart(2, '0')}:${String(examTimer.minutes).padStart(2, '0')}:${String(examTimer.seconds).padStart(2, '0')}`
              : "--:--:--"}
          </div>
          <p className={`text-xs mt-2 font-bold uppercase ${theme === 'luxury' ? 'text-[#8C725D]/70' : 'text-red-500/80 dark:text-red-400/80'}`}>
            {examTimer ? "Survival Mode Engaged" : "AWAITING SYLLABUS"}
          </p>
        </div>

        {/* HEATMAP */}
        <div className={`col-span-1 md:col-span-2 rounded-3xl p-6 backdrop-blur-xl shadow-xl transition-all ${
          theme === 'luxury'
            ? 'bg-[#1A1C23] border border-[#3A312A]'
            : 'bg-white/60 dark:bg-slate-900/40 border border-slate-200 dark:border-white/5'
        }`}>
          <div className="flex justify-between items-end mb-4">
            <div>
              <h3 className={`font-black text-lg ${theme === 'luxury' ? 'text-[#D6C7B9]' : 'text-slate-800 dark:text-white'}`}>Burn Rate Heatmap</h3>
              <p className={`text-sm ${theme === 'luxury' ? 'text-[#6E7381]' : 'text-slate-500 dark:text-slate-400'}`}>Daily Tasks Mastery</p>
            </div>
            <div className={`font-black text-2xl transition-all ${theme === 'luxury' ? 'text-[#A58B74]' : 'text-green-500'}`}>
              {totalTasks > 0 ? Math.round((completedTasks.size / totalTasks) * 100) : 0}%
            </div>
          </div>
          
          <div className="grid grid-cols-10 gap-2">
            {[...Array(30)].map((_, i) => {
              const percentage = totalTasks > 0 ? (completedTasks.size / totalTasks) : 0;
              const activeSquares = Math.round(percentage * 30);
              const isCompleted = i < activeSquares; 
              const isCurrent = i === activeSquares && totalTasks > 0 && percentage < 1;
              
              let squareClass = 'bg-slate-200 dark:bg-slate-800';
              if (theme === 'luxury') {
                squareClass = isCompleted ? 'bg-[#8C725D]' : isCurrent ? 'bg-[#A58B74] animate-pulse' : 'bg-[#23252E]';
              } else {
                squareClass = isCompleted ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.4)]' : isCurrent ? 'bg-orange-400 animate-pulse' : 'bg-slate-200 dark:bg-slate-800';
              }

              return <div key={i} className={`h-6 rounded-md transition-all duration-500 ${squareClass}`}></div>;
            })}
          </div>
        </div>
      </div>

      <main className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT COLUMN: INPUTS */}
        <section className={`space-y-6 p-8 rounded-3xl backdrop-blur-xl h-fit shadow-xl dark:shadow-none transition-colors duration-500 ${
          theme === 'luxury' ? 'bg-[#1A1C23] border border-[#3A312A]' : 'bg-white/60 dark:bg-slate-900/40 border border-slate-200 dark:border-white/5'
        }`}>
          <label className={`block text-xs font-bold uppercase tracking-widest ${theme === 'luxury' ? 'text-[#A58B74]' : 'text-blue-600 dark:text-blue-400'}`}>1. Start Here: Syllabus</label>
          <div className="w-full">
            <label htmlFor="file-upload" className={`w-full flex flex-col items-center justify-center border-2 border-dashed rounded-2xl py-6 cursor-pointer transition-all ${
              theme === 'luxury' 
                ? 'bg-[#14151A] hover:bg-[#1C1E26] border-[#524439] text-[#A58B74]' 
                : 'bg-blue-50 hover:bg-blue-100 dark:bg-blue-600/10 dark:hover:bg-blue-600/20 border-blue-300 dark:border-blue-600/30 text-blue-700 dark:text-blue-500'
            }`}>
              <span className="font-bold text-sm flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path></svg>
                {file ? file.name : "Click to select file"}
              </span>
            </label>
            <input id="file-upload" type="file" className="hidden" onChange={(e) => setFile(e.target.files[0])} />
          </div>
          
          <label className={`block text-xs font-bold uppercase tracking-widest ${theme === 'luxury' ? 'text-[#A58B74]' : 'text-blue-600 dark:text-blue-400'}`}>2. Priority Topics</label>
          <textarea className={`w-full h-32 rounded-2xl p-4 text-sm outline-none transition-colors ${
            theme === 'luxury' ? 'bg-[#14151A] border border-[#3A312A] focus:border-[#A58B74]' : 'bg-white/80 dark:bg-black/50 border border-slate-300 dark:border-white/10 focus:ring-1 focus:ring-blue-500'
          }`} value={extraTopics} onChange={(e) => setExtraTopics(e.target.value)} />
          
          <label className={`block text-xs font-bold uppercase tracking-widest ${theme === 'luxury' ? 'text-[#A58B74]' : 'text-blue-600 dark:text-blue-400'}`}>3. Days</label>
          <input type="number" value={studyDays} onChange={(e) => setStudyDays(e.target.value)} className={`w-full rounded-xl p-3 outline-none transition-colors ${
            theme === 'luxury' ? 'bg-[#14151A] border border-[#3A312A] focus:border-[#A58B74]' : 'bg-white/80 dark:bg-black/50 border border-slate-300 dark:border-white/10'
          }`} />

          <button onClick={handleAnalyze} disabled={loading} className={`w-full py-4 rounded-2xl font-bold transition-all ${
            theme === 'luxury' 
              ? 'bg-[#A58B74] text-[#121317] hover:bg-[#B89C82] shadow-[0_0_15px_rgba(165,139,116,0.2)]' 
              : 'bg-blue-600 text-white hover:bg-blue-700 dark:hover:bg-blue-500 shadow-lg shadow-blue-500/30'
          }`}>
            {loading ? "PROCESSING..." : "GENERATE ROADMAP"}
          </button>
        </section>

        {/* RIGHT COLUMN: ROADMAP */}
        <section className="lg:col-span-2 space-y-6">
          <div className={`p-8 rounded-3xl backdrop-blur-xl shadow-xl dark:shadow-none transition-colors duration-500 ${
            theme === 'luxury' ? 'bg-[#1A1C23] border border-[#3A312A]' : 'bg-white/60 dark:bg-slate-900/40 border border-slate-200 dark:border-white/5'
          }`}>
            <h2 className={`text-xl font-bold mb-6 border-l-4 pl-4 uppercase tracking-widest ${theme === 'luxury' ? 'border-[#8C725D] text-[#D6C7B9]' : 'border-blue-500 text-slate-800 dark:text-white'}`}>Roadmap</h2>
            
            <div className="grid gap-4">
              {data.roadmap.length === 0 && <p className={`italic ${theme === 'luxury' ? 'text-[#6E7381]' : 'text-slate-500'}`}>Your plan will appear here...</p>}
              
              {data?.roadmap && data.roadmap.length > 0 && data.roadmap.map((dayPlan, index) => (
                  <div key={index} className={`rounded-2xl p-6 shadow-lg mb-6 transition-all ${
                    theme === 'luxury' ? 'bg-[#14151A] border border-[#3A312A]' : 'bg-white/60 dark:bg-slate-800/60 border border-slate-200 dark:border-white/5'
                  }`}>
                    
                    <div className={`flex items-center justify-between mb-4 border-b pb-4 ${theme === 'luxury' ? 'border-[#3A312A]' : 'border-slate-200 dark:border-white/5'}`}>
                      <h3 className={`text-xl font-bold ${theme === 'luxury' ? 'text-[#C8B3A2]' : 'text-slate-800 dark:text-white'}`}>DAY {dayPlan?.day || index + 1}</h3>
                    </div>
                    
                    <ul className="space-y-3 mb-6">
                      {dayPlan?.tasks && dayPlan.tasks.map((task, idx) => {
                        const taskId = `day${index}-task${idx}`;
                        const isDone = completedTasks.has(taskId);
                        
                        let textClass = 'text-slate-600 dark:text-slate-300';
                        if (theme === 'luxury') textClass = isDone ? 'opacity-40 line-through text-[#6E7381]' : 'text-[#D6C7B9]';
                        else textClass = isDone ? 'opacity-40 line-through text-slate-500' : 'text-slate-600 dark:text-slate-300';

                        return (
                          <li key={idx} onClick={() => toggleTask(taskId)} className={`flex items-start gap-3 text-sm cursor-pointer transition-all duration-300 ${textClass}`}>
                            <div className={`w-4 h-4 mt-0.5 rounded border flex items-center justify-center shrink-0 transition-colors ${
                              isDone 
                                ? theme === 'luxury' ? 'bg-[#8C725D] border-[#8C725D]' : 'bg-green-500 border-green-500'
                                : theme === 'luxury' ? 'border-[#524439]' : 'border-slate-400 dark:border-slate-500'
                            }`}>
                              {isDone && <svg className="w-3 h-3 text-[#121317] dark:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                            </div>
                            {task}
                          </li>
                        );
                      })}
                    </ul>

                    {/* YOUTUBE LINK */}
                    {dayPlan.youtube_query && (
                      <div className={`text-sm flex items-center gap-2 ${theme === 'luxury' ? 'text-[#A58B74]' : 'text-red-500'}`}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M21.582 6.186a2.684 2.684 0 0 0-1.884-1.895C17.973 3.84 12 3.84 12 3.84s-5.973 0-7.698.451a2.684 2.684 0 0 0-1.884 1.895C2 7.925 2 12 2 12s0 4.075.418 5.814a2.684 2.684 0 0 0 1.884 1.895c1.725.451 7.698.451 7.698.451s5.973 0 7.698-.451a2.684 2.684 0 0 0 1.884-1.895C22 16.075 22 12 22 12s0-4.075-.418-5.814zM9.995 15.394V8.606l6.302 3.394-6.302 3.394z"></path></svg>
                        <a href={dayPlan.video ? `https://www.youtube.com/watch?v=${dayPlan.video.videoId}` : `https://www.youtube.com/results?search_query=${dayPlan.youtube_query}`} target="_blank" rel="noopener noreferrer" className="hover:underline hover:opacity-80 transition-opacity">
                          {dayPlan.video ? dayPlan.video.title : `Search: "${dayPlan.youtube_query}"`}
                        </a>
                      </div>
                    )}
                  </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      
      {/* INTERACTIVE SECTION: CHAT, QUIZ, & VIVA */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8 mt-10">
        <ChatLounge extractedText={fullSyllabusText} theme={theme} />
        <QuizArena extractedText={fullSyllabusText} theme={theme} />
        <VivaVoce extractedText={fullSyllabusText} theme={theme} />
      </div>

      {/* ADAPTIVE DEVELOPER CONTACT FOOTER */}
      <footer className={`max-w-6xl mx-auto mt-12 mb-8 backdrop-blur-xl rounded-3xl p-8 shadow-xl transition-colors duration-500 flex flex-col items-center ${
        theme === 'luxury' 
          ? 'bg-[#1A1C23] border border-[#3A312A]' 
          : 'bg-white/60 dark:bg-slate-900/60 border border-slate-200 dark:border-white/5'
      }`}>
        <h3 className={`text-xs font-bold uppercase tracking-widest mb-6 ${
          theme === 'luxury' ? 'text-[#8C725D]' : 'text-slate-400 dark:text-slate-500'
        }`}>
          Connect with the Developer
        </h3>
        <div className="flex flex-wrap justify-center gap-4">
          
          {/* Email */}
          <a href="mailto:antarikshshrivas2006@gmail.com" className={`group px-6 py-3 rounded-xl text-xs font-bold tracking-widest uppercase transition-all flex items-center gap-3 shadow-sm dark:shadow-none ${
            theme === 'luxury'
              ? 'bg-[#14151A] border border-[#4A3B32] text-[#A58B74] hover:border-[#8C725D] hover:bg-[#1C1E26] hover:text-[#C8B3A2]'
              : 'bg-transparent border border-slate-300 dark:border-slate-700 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400'
          }`}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-hover:scale-110"><rect x="2" y="4" width="20" height="16" rx="2" ry="2"></rect><path d="m2 4 10 8 10-8"></path></svg>
            Email
          </a>

          {/* Phone */}
          <a href="tel:+918875788751" className={`group px-6 py-3 rounded-xl text-xs font-bold tracking-widest uppercase transition-all flex items-center gap-3 shadow-sm dark:shadow-none ${
            theme === 'luxury'
              ? 'bg-[#14151A] border border-[#4A3B32] text-[#A58B74] hover:border-[#8C725D] hover:bg-[#1C1E26] hover:text-[#C8B3A2]'
              : 'bg-transparent border border-slate-300 dark:border-slate-700 hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-500/10 text-slate-600 dark:text-slate-300 hover:text-green-600 dark:hover:text-green-400'
          }`}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-hover:scale-110"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
            Phone
          </a>

          {/* LinkedIn */}
          <a href="https://www.linkedin.com/in/code-from-space" target="_blank" rel="noopener noreferrer" className={`group px-6 py-3 rounded-xl text-xs font-bold tracking-widest uppercase transition-all flex items-center gap-3 shadow-sm dark:shadow-none ${
            theme === 'luxury'
              ? 'bg-[#14151A] border border-[#4A3B32] text-[#A58B74] hover:border-[#8C725D] hover:bg-[#1C1E26] hover:text-[#C8B3A2]'
              : 'bg-transparent border border-slate-300 dark:border-slate-700 hover:border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-600/10 text-slate-600 dark:text-slate-300 hover:text-blue-700 dark:hover:text-blue-500'
          }`}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-hover:scale-110"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect x="2" y="9" width="4" height="12"></rect><circle cx="4" cy="4" r="2"></circle></svg>
            LinkedIn
          </a>

          {/* Instagram */}
          <a href="https://instagram.com/antariksh._911" target="_blank" rel="noopener noreferrer" className={`group px-6 py-3 rounded-xl text-xs font-bold tracking-widest uppercase transition-all flex items-center gap-3 shadow-sm dark:shadow-none ${
            theme === 'luxury'
              ? 'bg-[#14151A] border border-[#4A3B32] text-[#A58B74] hover:border-[#8C725D] hover:bg-[#1C1E26] hover:text-[#C8B3A2]'
              : 'bg-transparent border border-slate-300 dark:border-slate-700 hover:border-pink-500 hover:bg-pink-50 dark:hover:bg-pink-500/10 text-slate-600 dark:text-slate-300 hover:text-pink-600 dark:hover:text-pink-400'
          }`}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-hover:scale-110"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
            Instagram
          </a>

          {/* X / Twitter */}
          <a href="https://x.com/elonmusk" target="_blank" rel="noopener noreferrer" className={`group px-6 py-3 rounded-xl text-xs font-bold tracking-widest uppercase transition-all flex items-center gap-3 shadow-sm dark:shadow-none ${
            theme === 'luxury'
              ? 'bg-[#14151A] border border-[#4A3B32] text-[#A58B74] hover:border-[#8C725D] hover:bg-[#1C1E26] hover:text-[#C8B3A2]'
              : 'bg-transparent border border-slate-300 dark:border-slate-700 hover:border-slate-800 hover:bg-slate-100 dark:hover:border-slate-400 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
          }`}>
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="transition-transform group-hover:scale-110"><path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z"></path></svg>
            Twitter
          </a>

        </div>
      </footer>

    </div>
  );
}

export default App;