# 🚀 ACADEMIC COPILOT: INTEGRATED STUDY ENGINE

**Academic Copilot** is an AI-driven educational intelligence platform that bridges the gap between static curriculum and active learning. It transforms syllabi, notes, and priority topics into a structured, high-performance study experience.

---

## 🌟 EXECUTIVE OVERVIEW

In the fast-paced college environment, students spend more time planning *how* to study than actually studying. **Academic Copilot** automates the architectural phase of learning. By analyzing user-provided materials, it generates a logical day-by-day roadmap, recommends essential literature, and integrates a "Tutorial Lounge" featuring real-time video resources.



---

## ✨ KEY FEATURES 

### 🔹 **Neural Roadmap Architect**
Utilizes **Gemini 2.0 Flash** to parse complex documents and generate a logical, day-by-day study schedule tailored to the user's specific exam timeline.

### 🔹 **Multimodal Context Analysis**
Unlike basic text-parsers, this engine "sees" uploaded PDFs and images using **Base64 data encoding**, extracting key topics directly from the source material without manual entry.

### 🔹 **Dynamic Tutorial Lounge**
Integrates the **YouTube Data API v3** to automatically fetch high-authority video tutorials that correspond specifically to the AI-generated roadmap topics.

### 🔹 **Library Archive & Suppliments**
Features an AI-curated selection of textbooks and academic authors, ensuring students have access to verified supplemental learning materials.

### 🔹 **Cloud Infrastructure**
Leverages **Firebase Storage** for secure document handling, providing a professional and persistent environment for academic assets.

---

## 🛠️ THE TECHNOLOGY STACK

| LAYER | TECHNOLOGY |
| :--- | :--- |
| **Frontend** | React.js + Vite (Tailwind CSS "Midnight" UI) |
| **Primary AI** | Google Gemini 2.0 Flash API |
| **Video Intelligence** | YouTube Data API v3 |
| **Cloud Storage** | Firebase |
| **Deployment** | Vercel |

---

## 🚀 INSTALLATION & SETUP

1. **Clone the Repository**
   ```bash
   git clone [https://github.com/YOUR_USERNAME/academic-copilot.git](https://github.com/YOUR_USERNAME/academic-copilot.git)
   cd academic-copilot

2.  **Install Dependencies**
    ```bash
    npm install
    ```

3.  **Environment Configuration**
    Create a `.env` file in the root directory:
    ```env
    VITE_GEMINI_API_KEY=your_gemini_key
    VITE_YOUTUBE_API_KEY=your_youtube_key
    ```

4.  **Launch the Engine**
    ```bash
    npm run dev
    ```

---

## 📸 Presentation Highlights

### **AI Topic Extraction**
The system doesn't just read text; The system identifies headers, dates, and subject weightage within your syllabus to prioritize high-yield study areas.

### **Automated Video Sourcing**
Unlike static lists, these video cards are generated based on the *weak points* or *key topics* identified by the AI in the roadmap.



---

## 📜 Innovation Statement
This project was developed for the **2026 Open Innovation Hackathon**, focusing on the "Google Technology" track by **integrating Gemini, YouTube, and Firebase** into a single, cohesive educational tool.

---

## 👨‍💻 Developer
**Antariksh Shrivas**
*Built with passion for the future of education.*
