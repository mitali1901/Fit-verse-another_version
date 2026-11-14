# FitVerse – System Architecture Documentation

## 1. Architectural Overview
FitVerse is engineered using a modular, decoupled **Three-Layer Architecture** designed for high responsiveness, real-time client-side computer vision inference, and context-aware generative AI capabilities.

```
┌────────────────────────────────────────────────────────────────────────┐
│                        PRESENTATION LAYER                              │
│  React.js (Vite) + Tailwind CSS + Lucide Icons + Recharts              │
│  ┌────────────────────────┐  ┌──────────────────────────────────────┐  │
│  │    User Dashboard      │  │        AI Yoga Studio Feed           │  │
│  │ (Stats, Activity, Goal)│  │ (Webcam / Canvas Red-Green Overlay)  │  │
│  └────────────────────────┘  └──────────────────────────────────────┘  │
│  ┌────────────────────────┐  ┌──────────────────────────────────────┐  │
│  │   AI Fitness Coach     │  │       Photo-Based Pose Analyzer      │  │
│  │(Conversational Chatbot)│  │  (Static Landmark & Skeleton Draw)   │  │
│  └────────────────────────┘  └──────────────────────────────────────┘  │
│                                                                        │
│  Client-Side Computer Vision Engine: MediaPipe Pose Landmarker (WASM) │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ HTTP / REST APIs (Axios + JWT)
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                    APPLICATION & BUSINESS LOGIC LAYER                  │
│                     Python Flask RESTful Microservice                  │
│  ┌────────────────────────┐  ┌──────────────────────────────────────┐  │
│  │    Auth Middleware     │  │        Yoga Session Service          │  │
│  │ (JWT Verification /    │  │ (Metric Aggregations, Weekly Calcs,  │  │
│  │  Werkzeug Password)    │  │  Score Normalization)                │  │
│  └────────────────────────┘  └──────────────────────────────────────┘  │
│  ┌────────────────────────┐  ┌──────────────────────────────────────┐  │
│  │  User Management Svc   │  │        Gemini GenAI Service          │  │
│  │(Profile CRUD & Goals)  │  │(Prompt Engine, Context Injection,    │  │
│  │                        │  │ Biomechanics Guidance)               │  │
│  └────────────────────────┘  └──────────────────────────────────────┘  │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ PyMongo Connection Pool
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                              DATA LAYER                                │
│                     MongoDB Atlas (or Persistent Local DB)             │
│  ┌────────────────────────┐  ┌──────────────────┐  ┌─────────────────┐ │
│  │    users Collection    │  │  yoga_sessions   │  │  chat_history   │ │
│  │   (Auth & Profile)     │  │   (Telemetry)    │  │   (Conversations)│ │
│  └────────────────────────┘  └──────────────────┘  └─────────────────┘ │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Real-Time Computer Vision Pipeline (MediaPipe)

The video stream is processed strictly on the client side inside the user's browser, preventing server network bottlenecks and protecting user privacy.

```
Webcam Video Frame / Uploaded Photo
               │
               ▼
   MediaPipe Pose Landmarker (Lite Model: 33 Landmarks, 3D Coordinates)
               │
               ▼
   Landmark Extraction & Confidence Filtering (Visibility >= 0.5)
               │
               ▼
   Vector Geometry & Trigonometric Angle Calculations
   (e.g., θ = arccos((BA · BC) / (|BA| |BC|)))
               │
               ▼
   Pose-Specific Rule Engine (Warrior II, Tree Pose, Downward Dog)
   Evaluates: Knee flexion, Arm horizontal inclination, Torso tilt, Stance
               │
               ▼
   Classification of Body Segments:
   ├── Within tolerance range  ==> GREEN Overlay (#22C55E)
   └── Outside tolerance range ==> RED Overlay (#EF4444) + Joint Halo
               │
               ▼
   HTML5 Canvas Synchronous Rendering (60 FPS)
   Dynamic Feedback List + Real-time Alignment Score Gauge (0-100%)
```

---

## 3. Generative AI Pipeline (Google Gemini)

```
User Yoga Session Context
(Pose: Warrior II, Score: 78%, Mistakes: Front Knee Alignment)
               +
User Chat Query ("How do I adjust my front knee?")
               │
               ▼
Prompt Engineering & System Prompt Construction
(Role: FitVerse Coach, Scope: Sports Science & Classical Yoga, Safety limits)
               │
               ▼
Flask Backend Gateway (/api/assistant/chat)
               │
               ▼
Google Gemini API (gemini-2.5-flash)
               │
               ▼
Personalized, Context-Aware Biomechanical Guidance
               │
               ▼
React Chat Interface (Typing indicators, Formatted Advice, Suggested Pills)
```

