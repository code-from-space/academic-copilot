// src/youtube.js
export const fetchRealYouTubeVideos = async (query) => {
  const apiKey = import.meta.env.VITE_YOUTUBE_API_KEY;
  const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=3&q=${encodeURIComponent(query)}&type=video&key=${apiKey}`;

  try {
    const response = await fetch(url);
    const data = await response.json();
    
    // Map the API results to a format our App can use
    return data.items.map(item => ({
      title: item.snippet.title,
      videoId: item.id.videoId,
      reason: "Top-rated tutorial found via YouTube API"
    }));
  } catch (error) {
    console.error("YouTube API Error:", error);
    return [];
  }
};