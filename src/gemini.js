import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

export const getGeminiResponse = async (prompt, filePart) => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // If a file is provided, we send both the text and the file data
    // Otherwise, we just send the text prompt.
    const content = filePart ? [prompt, filePart] : [prompt];

    const result = await model.generateContent(content);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Gemini Error:", error);
    return JSON.stringify({
      roadmap: [{ day: 1, topic: "Error", task: "AI could not process the request." }],
      library: [],
      youtubeSearchQuery: ""
    });
  }
};