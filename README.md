# LearnSmart — Smart Interactive Classroom System 🎓✨

[![License: MIT](https://img.shields.io/badge/License-MIT-3B735B.svg)](https://opensource.org/licenses/MIT)
[![Stack: Vanilla JS / Tailwind / Chart.js](https://img.shields.io/badge/Stack-HTML5%20%7C%20TailwindCSS%20%7C%20Chart.js-84AF9B.svg)](#technology-stack)
[![Classroom: Room CS-204](https://img.shields.io/badge/Room-CS--204-FF4266.svg)](#)

> **LearnSmart** is a modern, responsive web application prototype designed to eliminate college student classroom engagement barriers. By combining anonymous question queues, instant peer-upvoting, live concept check quizzes, visual concept explainers, and real-time teacher telemetry, LearnSmart turns passive lectures into high-engagement learning environments.

---

## 🎨 Visual Theme & Editorial Palette

LearnSmart features a clean, warm editorial color scheme designed for long classroom sessions without eye fatigue:

| Color Role | Hex Code | Visual Preview / Tailwind Token | Usage |
| :--- | :--- | :--- | :--- |
| **Soft Cream** | `#FAF8F4` | `bg-cream` | Background canvas and modal panels |
| **Deep Slate** | `#1E2D28` | `text-slate-deep` | High-contrast editorial typography & dark buttons |
| **Sage Teal (Primary)** | `#84AF9B` / `#3B735B` | `bg-sage` / `bg-sage-dark` | Primary badges, success highlights, progress bars |
| **Coral Rose (Accent)** | `#FF4266` / `#D9264D` | `bg-coral` / `bg-coral-dark` | Action prompts, pop-quiz alerts, upvote highlights |
| **Warm Peach** | `#FACDB0` | `bg-peach` | Warning banners, secondary badges, timeline highlights |
| **Soft Sand** | `#EFECE4` | `bg-sand` | Surface cards, borders (`#DDD8CB`), segmented switches |

- **Typography**: Inter (Google Fonts) with JetBrains Mono for technical formulas and timestamps.
- **Icons**: Lucide Icons.
- **Charts**: Chart.js for comprehension distribution.

---

## 🚀 Core Features (All Interactive)

### 1. 📋 Pre-Class Objectives & Readiness Checklist (Student View)
- Displays current lecture details (*CS-204: Raft Consensus, Quorums & Byzantine Fault Tolerance*).
- Three high-yield learning goals with formula cards (`Q = ⌊n/2⌋ + 1`).
- Interactive **"Before-Class Checklist"** with live readiness calculations (e.g. 0% to 100% Ready) to prime students before the lecture begins.

### 2. 💬 Anonymous Doubt Box & Live Q&A Stream
- Zero-identity submission form allowing students to ask questions without peer anxiety.
- Topic selector tags (*Leader Election, Quorum Math, Log Replication, Split-Brain, Heartbeat Timers*).
- Quick prompt pills for one-click inspiration.
- Live Q&A queue with filter tabs (**All / Pending / Answered**).
- Working **Peer Upvote** buttons with dynamic counters to help instructors identify widespread confusion.
- Shows in-class instructor resolution notes once marked answered.

### 3. ⚡ Live Short Quiz with Instant Explanations
- 3-question college-level multiple-choice quiz on distributed systems.
- Step-by-step progress bar and question navigation.
- **Instant Answer Feedback**: Selected options highlight in green (correct) or coral red (incorrect) alongside an in-depth **Insight Breakdown**.
- Final scorecard with accuracy percentages, confetti celebration, and an option to **Retake Practice Quiz**.
- Every quiz completion **instantly feeds comprehension telemetry into the Teacher Dashboard**.

### 4. 🎬 Visual Video Explainers & Offline Note Exporters
- Searchable library of concept cards with duration badges and difficulty tags.
- **"Watch & Read" Modal**:
  - Simulated 3-minute visual concept animation depicting 3 Raft nodes (Candidate, Leader, Followers) exchanging heartbeat and election RPCs.
  - Interactive playback controls: Play/Pause, timeline scrub bar, playback speed, and **toggleable CC Closed-Captions**.
  - Bulleted "High-Yield Key Revision Points" drawer.
- **"Offline" Download Button**:
  - Exports a clean, structured `.txt` revision note file containing summary, definitions, exam trap warnings, and formulas directly to the student's device.
  - Automatically updates the **Teacher's Offline Downloads KPI**.

### 5. 📴 Disconnected Offline Mode Toggle
- Dedicated toggle switch in the top navigation bar.
- Instantly notifies the user with custom toast alerts.
- Displays an offline badge banner letting students know cached notes and summaries are available without internet connectivity.

### 6. 👨‍🏫 Teacher Engagement & Comprehension Dashboard
- Accessible via the **Student / Teacher role switcher** in the sticky navbar.
- **4 Real-Time KPI Cards**:
  1. *Quiz Comprehension %* (with trend indicator)
  2. *Active Participation %* (based on connected student count)
  3. *Pending Doubts Count* (with urgent attention highlight)
  4. *Offline Downloads Count* (live tracker of exported study guides)
- **Chart.js Bar Chart**: Dynamic topic-wise comprehension distribution mapped across Raft syllabus units.
- **"Push Live Quiz Prompt" Button**: Broadcasts an instant pop-quiz alert to all student screens.
- **Doubt Moderation Center**: Instructors can review questions ordered by upvotes, pin urgent doubts to the blackboard, and mark questions as answered with custom explanations.
- **"Simulate Cohort" Tool**: Built-in simulator to generate mock student submissions for testing and demonstrations.

---

## ⚡ Real-Time Multi-Device / Cross-Tab State Sync

LearnSmart includes built-in reactive synchronization:
- Uses the browser's `BroadcastChannel('learnsmart_sync')` API alongside `localStorage` event hooks.
- **Try it out:** Open two browser tabs side-by-side:
  - Tab 1: **Student View**
  - Tab 2: **Teacher Dashboard**
- When you submit a doubt, complete a quiz, upvote a question, or download a note in Tab 1, Tab 2 **updates its KPIs, charts, and queues in real time without refreshing!**

---

## 💻 Quick Start & Running Locally

### Option A: Direct Open (Zero installation required)
Simply open `index.html` in any modern web browser:
```bash
# On Windows PowerShell
Start-Process index.html

# On macOS
open index.html

# On Linux
xdg-open index.html
```

### Option B: Local Static Server (Node.js)
```bash
# Install dependencies & start server
npm start
# Or using npx directly:
npx serve .
```

---

## 📁 Repository Structure

```text
smart-class-room-/
├── index.html        # Main single-page web app with Student & Teacher views
├── app.js            # Reactive store, BroadcastChannel sync, sound synthesizer & UI logic
├── style.css         # Color palette, custom scrollbars, animations & node simulation styles
├── package.json      # NPM script configuration for local serving
└── README.md         # Comprehensive project documentation
```

---

## 🛠️ Technology Stack

- **Markup & Layout**: Semantic HTML5, Tailwind CSS (via CDN) with extended custom palette
- **Typography**: Inter (Google Fonts), JetBrains Mono
- **Scripting & State**: Modern ECMAScript (ES6+), `BroadcastChannel` API, `localStorage`
- **Data Visualization**: Chart.js 4.x
- **Icons**: Lucide Icons
- **Audio Feedback**: Web Audio API Sound Synthesizer (Zero external audio file dependencies)
- **Visual Effects**: Canvas Confetti

---

## 📄 License

Distributed under the [MIT License](LICENSE). Created for modern interactive classroom engagement.
