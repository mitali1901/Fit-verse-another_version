# FitVerse – AI Integration Guide (For Placement Interviews & Viva)

This document provides exact explanations and technical distinctions to confidently answer questions regarding the Artificial Intelligence architecture in FitVerse.

---

## 1. Core Technical Distinction: Generative AI vs Computer Vision

A common mistake in AI projects is confusing Computer Vision with Generative AI. In FitVerse, these two distinct branches of AI perform specialized roles:

| Dimension | Generative AI (Google Gemini LLM) | Computer Vision / Pose Estimation (MediaPipe) |
| :--- | :--- | :--- |
| **Model Family** | Large Language Model (Transformer-based, Multimodal) | Convolutional Neural Network (CNN) / BlazePose |
| **Primary Role** | Conversational coach, explanations, motivational feedback | Landmark coordinate tracking & body posture detection |
| **Execution Site** | Cloud API via Flask Backend Gateway | Client-Side Browser execution via WebAssembly / WebGL |
| **Latency Target** | ~1 to 2 seconds per query | 30 to 60 Frames Per Second (Real-Time) |
| **Input Data** | Text prompt + User session telemetry metadata | Webcam video frames / Uploaded photograph pixels |
| **Output Data** | Formatted natural language guidance & recommendations | Array of 33 3D normalized spatial landmarks (`x, y, z, visibility`) |

> **Viva Note:** Do NOT say "MediaPipe generated the posture feedback text". MediaPipe outputs numerical spatial coordinates. Mathematical trigonometry evaluates joint angles. Google Gemini Generative AI creates the rich, conversational coaching answers!

---

## 2. Computer Vision Engine: MediaPipe Pose Landmarker

### 2.1 Landmark Topology
FitVerse utilizes the BlazePose 33-landmark topology:
- **Upper Extremities:** Left/Right Shoulders (11, 12), Elbows (13, 14), Wrists (15, 16).
- **Trunk:** Left/Right Hips (23, 24).
- **Lower Extremities:** Left/Right Knees (25, 26), Ankles (27, 28), Heels (29, 30), Foot Indices (31, 32).

### 2.2 Mathematical Joint-Angle Formulation
For any joint $B$ flanked by adjacent landmarks $A$ and $C$:
$$\vec{BA} = A - B, \quad \vec{BC} = C - B$$
$$\cos(\theta) = \frac{\vec{BA} \cdot \vec{BC}}{\|\vec{BA}\| \|\vec{BC}\|}$$
$$\theta = \arccos\left(\text{clamp}\left(\frac{\vec{BA} \cdot \vec{BC}}{\|\vec{BA}\| \|\vec{BC}\|}, -1, 1\right)\right) \times \left(\frac{180^\circ}{\pi}\right)$$

### 2.3 Pose-Specific Evaluation Rules (Version 1)

1. **Warrior II Pose (*Virabhadrasana II*):**
   - **Front Knee Angle:** Must be $85^\circ - 105^\circ$ (approx. $90^\circ$ right angle).
     - If $\theta > 115^\circ$: Highlight in **RED** $\to$ "Adjust your front knee."
     - If within range: Highlight in **GREEN**.
   - **Back Leg:** Knee angle $\ge 160^\circ$ (straight, engaged).
   - **Arms Extension:** Horizontal inclination $\le 20^\circ$, elbow angle $\ge 155^\circ$.
   - **Torso Alignment:** Spine inclination relative to vertical $\le 18^\circ$.

2. **Tree Pose (*Vrikshasana*):**
   - **Standing Leg:** Knee angle $\ge 165^\circ$.
   - **Bent Leg:** Knee angle $30^\circ - 75^\circ$ with hip abduction.
   - **Hands:** Palms together in prayer (*Anjali Mudra*) or extended overhead.

3. **Downward-Facing Dog (*Adho Mukha Svanasana*):**
   - **Inverted 'V' Apex:** Hip flexion between torso and legs $\approx 65^\circ - 95^\circ$.
   - **Arms:** Extended straight ($\ge 160^\circ$).
   - **Legs:** Extended ($\ge 150^\circ$).

---

## 3. Generative AI Engine: Google Gemini API

### 3.1 Why Gemini?
- **Speed & Latency:** `gemini-2.5-flash` delivers near-instantaneous responses ideal for conversational fitness companions.
- **Multimodal Understanding:** Capable of comprehending sports biomechanics and anatomical terminology.
- **Cost & Availability:** High free-tier quotas make it accessible for local developer workflows.

### 3.2 System Prompt & Prompt Engineering
The system prompt defines the coach's personality, boundary conditions, and tone:
```text
You are the FitVerse AI Fitness & Yoga Coach, an empathetic, encouraging,
and knowledgeable AI companion designed to help users practice yoga safely,
improve body alignment, build mindful fitness habits, and understand their posture corrections.

Tone: Warm, supportive, motivational, structured with bullet points.
Rooted in classical yoga principles and modern sports biomechanics.
Safety: Yoga posture feedback is an AI-assisted training guide and does
not replace medical advice.
```

### 3.3 Context Injection Mechanism
When a user asks a question, the backend attaches dynamic session telemetry:
- `current_pose`: "Warrior II Pose"
- `alignment_score`: "78%"
- `common_mistakes`: ["Front knee angle deviation"]
- `weekly_goal`: "150 minutes"

This allows Gemini to reply with personalized context:
> *"I noticed your front knee angle was slightly wider than 90° in your latest Warrior II session. Here is how engaging your outer hip helps you align your knee right over your ankle..."*

