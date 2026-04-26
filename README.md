# InsightAgent: Autonomous Multi-Agent Web Researcher

InsightAgent is a high-performance, full-stack web application that leverages a specialized pipeline of AI agents to perform deep research on any topic. By orchestrating multiple LLMs (powered by Groq) and real-time Wikipedia scraping, it generates comprehensive, formatted intelligence reports with integrated data visualizations in seconds.

---

## 🚀 Key Features

- **Multi-Agent Orchestration:** A sequential pipeline where specialized agents handle specific tasks:
  - **Planner Agent:** Breaks down a broad topic into strategic research queries.
  - **Data Gatherer Agent:** Uses tools to search and scrape high-quality data from Wikipedia.
  - **Synthesizer Agent:** Analyzes raw data and writes a structured, long-form Markdown report.
- **Real-time Data Visualization:** Automatically identifies quantitative data and generates beautiful, interactive charts (Bar, Line, and Pie) using Recharts.
- **Lightning Fast Reasoning:** Optimized with a hybrid model approach:
  - **Llama-3.1-8b-instant:** Powers high-speed planning and data gathering.
  - **Llama-3.3-70b-versatile:** Powers deep reasoning and high-fidelity report synthesis.
- **Premium Web UI:** A polished, fully responsive React interface featuring glassmorphism, animated status tracking, and overflow-safe layout.
- **Professional PDF Export:** Custom-formatted documents designed for printing, complete with high-resolution charts, clickable citations, and modern typography.
- **Smart Persistence:** Research results and history are saved in your **Research Vault** using LocalStorage.

---

## 🏗️ Architecture

The project is built using a modern decoupled architecture:

1.  **Frontend (React/Vite):** A high-performance UI styled with Tailwind CSS v4. It features intelligent Markdown rendering that safely handles complex block elements.
2.  **Backend (Node.js/Express):** Acts as a bridge. It manages incoming requests and spawns Python child processes to execute the agent pipeline.
3.  **Core Intelligence (Python):** The heart of the app. Uses Pydantic for data validation and the Groq SDK for LLM interactions.
4.  **Research Tools:** A custom Python scraping engine that uses the Wikipedia API to gather real-time data.

---

## 🛠️ Tech Stack

**Frontend:**
- React 18+ (Vite)
- Tailwind CSS v4 (Modern styling)
- Recharts (Interactive data visualizations)
- Framer Motion (Fluid animations)
- Lucide React (Iconography)

**Backend:**
- Node.js & Express
- Child Process (Python integration)

**AI & Python:**
- Groq Cloud API (Llama 3.1 & 3.3)
- Pydantic (Data schemas)
- Wikipedia-API (Data sourcing)
- HTTPX & BeautifulSoup4

---

## ⚙️ Setup & Installation

### 1. Prerequisites
- **Node.js** (v18 or higher)
- **Python** (v3.10 or higher)
- **Groq API Key** (Get one at [console.groq.com](https://console.groq.com/))

### 2. Configure Environment Variables
Create a `.env` file in the root directory:
```env
GROQ_API_KEY=your_groq_api_key_here
```

### 3. Install Python Dependencies
```bash
pip install -r requirements.txt
```

### 4. Setup Backend (Server)
```bash
cd server
npm install
node index.js
```
*The server will run on http://localhost:5000*

### 5. Setup Frontend (Client)
```bash
cd client
npm install
npm run dev
```
*The UI will be accessible at http://localhost:5173*

---

## 📖 Usage

1.  Open the web interface.
2.  Enter a research topic in the central search bar.
3.  Select your desired report length (**Short, Medium, or Long**).
4.  Enable **Include Charts** to have the agents identify and visualize statistical data.
5.  Click **Generate** and watch the "Pipeline Status" sidebar as the agents move from Planning to Synthesis.
6.  Read your report, click citations to open sources, or click the **Download PDF** button for a professional hard copy.

---

## 📂 Folder Structure

```text
web-researcher/
├── client/              # React/Vite Frontend
│   ├── src/App.jsx      # Main UI Logic & Chart Rendering
│   └── src/index.css    # Tailwind & Print styles
├── server/              # Node.js Express Backend
│   └── index.js         # API & Python Spawn logic
├── agents.py            # LLM Agent definitions (Groq)
├── main.py              # Python CLI & Entry Point
├── tools.py             # Wikipedia Scraping Engine
├── schemas.py           # Pydantic Data Models
└── .env                 # API Keys (Protected)
```

---

## ⚖️ License
© 2026 InsightAgent Autonomous Pipeline. Created for advanced automated research.
