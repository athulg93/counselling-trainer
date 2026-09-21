# Conversational Counselling Trainer 🧠💬

[![React](https://img.shields.io/badge/React-19.0-61DAFB?logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-7.0-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Google GenAI](https://img.shields.io/badge/Google%20GenAI-Gemini%202.5-4285F4?logo=googlecloud&logoColor=white)](https://ai.google.dev/)
[![Express](https://img.shields.io/badge/Express-4.21-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![Firebase](https://img.shields.io/badge/Firebase-Firestore-FFCA28?logo=firebase&logoColor=black)](https://firebase.google.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4.0-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)

A deliberate practice counseling simulator powered by Google Gemini, designed for mental health trainees, counseling students, and clinical practitioners. The application pairs a real-time **Simulated Patient Actor (Agent 1)** with an automated **Clinical Supervisor Evaluator (Agent 2)** to provide objective, rubric-driven feedback on therapeutic technique, empathy, alliance building, and crisis detection.

---

## 🌟 Key Features

* **🎭 Dual-Agent AI Architecture**:
  * **Agent 1 (Patient Actor)**: Embodies realistic client personas with somatic behavioral cues, emotional resistance, and dynamic conversational reactivity.
  * **Agent 2 (Supervisor Evaluator)**: Conducts post-session clinical transcripts analysis against established therapeutic rubrics.

* **🎯 Multiple Counseling Modalities & Tracks**:
  * **CBT (Cognitive Behavioral Therapy)**: Identify cognitive distortions, thought records, and automatic thought challenging.
  * **MI (Motivational Interviewing)**: Practice OARS skills (Open questions, Affirmations, Reflections, Summaries) and change talk elicitation.
  * **Person-Centered Therapy**: Cultivate unconditional positive regard, active empathetic validation, and therapeutic congruence.
  * **De-escalation & Crisis Intervention**: Navigate heightened affect, somatic tension, and subtle referral cues.

* **📊 Comprehensive Clinical Scorecards**:
  * **Alliance Assessment**: Bond strength, goal consensus, and rupture/repair handling.
  * **Relational Distance Index**: Track moments of client resistance or withdrawal.
  * **Talk-Time Balance**: Word-count share between counselor and client.
  * **Referral Cues & Safety**: Detect planted medical/psychiatric red flags requiring escalation.

* **🛠️ Custom Persona & Case Study Builder**:
  * Create custom client vignettes, difficulty levels, triggers, and background narratives.
  * Batch import and export case libraries in JSON format.

* **🔒 Dual-Environment Database Isolation**:
  * **Practice / Workbench Mode**: Uses isolated development collections (`users_dev`, `sessions_dev`, `cases_dev`) and local dev JSON storage.
  * **Production Mode**: Connects to primary production Firestore collections (`users`, `sessions`, `cases`) for live clinical training cohorts.

* **🛡️ Admin & Supervisor Management Hub**:
  * Trainee directory & registration management.
  * Session history audit logs and aggregate clinical metrics.
  * One-click JSON backup and restore capabilities.

---

## 🏗️ Architecture & Tech Stack

* **Frontend**: React 19, Vite, Tailwind CSS v4, Lucide React icons, Framer Motion.
* **Backend**: Node.js Express server running TypeScript (`tsx` in dev, `esbuild` bundled CJS in production).
* **AI Model Engine**: `@google/genai` SDK using `gemini-2.5-flash` with multi-model fallback resiliency.
* **Cloud Persistence**: Firebase Firestore for multi-device sync and account management.
* **Local Persistence**: Express JSON storage engine (`/data/conversations_db.json`).

---

## 🚀 Getting Started

### Prerequisites

* **Node.js**: v18.0.0 or higher
* **NPM**, **Yarn**, or **Bun**
* **Gemini API Key**: Obtain a free API key from [Google AI Studio](https://aistudio.google.com/)

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/athulg93/counselling-trainer.git
   cd counselling-trainer
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Create a `.env` file in the root directory:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

4. **Start Development Server**:
   ```bash
   npm run dev
   ```
   Open your browser at `http://localhost:3000`.

---

## 📜 Available Scripts

| Command | Description |
| :--- | :--- |
| `npm run dev` | Launches the Express backend server with Vite middleware in development mode (`port 3000`) |
| `npm run build` | Bundles the React client with Vite and compiles `server.ts` into `dist/server.cjs` via `esbuild` |
| `npm start` | Runs the compiled production server (`node dist/server.cjs`) |
| `npm run lint` | Runs TypeScript type-checking across the codebase (`tsc --noEmit`) |

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).
