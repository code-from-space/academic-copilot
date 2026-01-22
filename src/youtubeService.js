import * as yt from 'youtube-search-without-api-key';

export const getRealVideos = async (query) => {
  try {
    // Searches YouTube for the topic and returns the top results
    const videos = await yt.search(query);
    // Returns the first 3 real videos it finds
    return videos.slice(0, 3).map(v => ({
      title: v.title,
      videoId: v.id.videoId,
      reason: "Top-rated tutorial for this topic"
    }));
  } catch (error) {
    console.error("YouTube Search Error:", error);
    return [];
  }
};