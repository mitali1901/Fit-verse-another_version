# 🧘 FitVerse – AI-Powered Yoga & Fitness Companion
### *Complete Version 1 Development with Professional Authentication & Computer Vision*

FitVerse is a modern, pastel-themed web application designed to help users practice yoga with precision, receive instant posture corrections through client-side Computer Vision (MediaPipe), receive wellness guidance from Generative AI (Gemini), and manage accounts through an enterprise-grade authentication system with SMTP email verification.

---

## 🔐 Complete Authentication System & Security

FitVerse features an authentication architecture built for security, usability, and design elegance:

1. **User Registration (`/register`):**
   - Collects Full Name, Email Address, Password, and Confirm Password.
   - **Mandatory Strong Password Enforcement** (validated on both frontend & backend):
     - Minimum 8 characters.
     - At least one uppercase letter (`A-Z`).
     - At least one lowercase letter (`a-z`).
     - At least one number (`0-9`).
     - At least one special character (`!@#$%^&*` etc.).
   - Live 3-level interactive strength meter (Weak, Medium, Strong) with instant visual checklist.
   - Show/Hide password toggles on both password and confirmation fields.

2. **Real SMTP Email OTP Verification (`/verify-email`):**
   - Dispatches a real 6-digit numeric OTP to the user's email via SMTP (supporting Google App Passwords).
   - Clean, professional HTML email template with FitVerse branding, large styled verification code, and security notices.
   - **OTP Security Rules:**
     - ⏱️ **5-Minute Expiration:** Codes expire strictly after 5 minutes.
     - 🛡️ **Hashed Storage:** Stored as cryptographic SHA-256 hashes in MongoDB; plain OTP is never saved in the database or exposed in responses.
     - 🛑 **Attempt Limiting:** Maximum 5 attempts allowed; exceeding invalidates the code.
     - 🔄 **60-Second Cooldown:** Resend button enforces a 60-second cooldown to prevent spam.
     - 🔒 **One-Time Use:** Code is immediately invalidated upon successful verification.

3. **Secure Login (`/login`):**
   - Email, Password with Show/Hide toggle, "Remember Me" option, and "Forgot Password?" link.
   - **Verification Gate:** Unverified users are rejected with a clear message and a one-click redirect to complete email verification.
   - Issues signed HS256 JWT tokens with 7-day validity.

4. **Forgot Password & Password Reset (`/forgot-password` & `/reset-password`):**
   - User inputs email -> receives a 6-digit password reset OTP via SMTP.
   - Enforces 5-minute expiry, 60s resend cooldown, and 5-attempt limits.
   - User enters OTP, new password (with live strength validation), and confirms entry.
   - Securely updates `password_hash` in MongoDB.

---

## 🎨 Branding & Visual Redesign

1. **Realistic Lotus Brand Logo (`FitVerseLogo.jsx`):**
   - Replaced artificial cartoon shapes with a symmetrical, organic vector lotus flower.
   - Soft amethyst and lavender multi-tone gradient (`#9B5DE5` to `#7B42B4`).
   - Clean typography matching modern wellness brands.
   - Consistently integrated across Login, Register, Verify Email, Forgot Password, Reset Password, and Dashboard Sidebar.

2. **Dashboard Greeting:**
   - Greeting dynamically displays: `Hello, [User Name]! 👋` (pulls real name from authenticated profile).

3. **High-Quality Realistic Yoga Photography:**
   - Replaced illustration with a high-resolution photograph of a real person in mindful meditation within a natural wellness environment (`yoga_meditation_real.jpg`).

---

## 🚀 Version 1 Features Overview

| Module | Capabilities |
| :--- | :--- |
| **Authentication** | Registration, SMTP OTP verification, Login, JWT auth, Forgot/Reset Password, Strong password validation |
| **Dashboard** | Dynamic greeting (`Hello, [Name]!`), Weekly Goal bar, 4 Stat Cards, Recharts Mon-Sun Activity, Recent Sessions |
| **AI Yoga Studio** | Real webcam via `getUserMedia()`, MediaPipe Pose Landmarker, Dynamic Green/Red skeleton, angle calculations |
| **Pose Detection** | Separate evaluation logic for **Warrior II**, **Tree Pose**, and **Downward-Facing Dog** |
| **Alignment Score** | Dynamically calculated score from joint angles, semi-circular gauge, feedback list |
| **Photo Analysis** | Upload static yoga photo, run 2D MediaPipe landmark detection, render Green/Red skeleton overlay |
| **AI Assistant** | Contextual fitness and biomechanics assistant powered by Google Gemini API |
| **Profile** | View lifetime statistics, edit name and customizable weekly goals |
| **Database** | MongoDB Atlas with thread-safe local JSON persistence fallback |

---

## 📧 SMTP Configuration Steps (For Real Email Delivery)

To receive real OTP codes in your actual Gmail inbox:

1. **Generate a Google App Password:**
   - Go to [Google Account Security](https://myaccount.google.com/security).
   - Ensure **2-Step Verification** is turned ON.
   - Go to [App Passwords](https://myaccount.google.com/apppasswords).
   - Create a new App Password (name it `FitVerse`).
   - Copy the 16-character generated password (e.g., `abcd efgh ijkl mnop`).

2. **Configure in `backend/.env`:**
   Open `backend/.env` and update the SMTP fields:
   ```env
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USERNAME=your_actual_email@gmail.com
   SMTP_PASSWORD=your_16_char_google_app_password
   SMTP_FROM_EMAIL=your_actual_email@gmail.com
   SMTP_USE_TLS=True
   ```

3. **Local Development Fallback:**
   If SMTP credentials are not yet configured, FitVerse will print the generated 6-digit OTP directly to the Flask backend terminal console with a notification banner, allowing full local testing without getting blocked!

---

## 🗄️ MongoDB Atlas Configuration Steps

FitVerse connects to MongoDB Atlas using PyMongo:

1. Open [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) and create a free M0 cluster.
2. Under **Database Access**, create a database user with read/write privileges.
3. Under **Network Access**, add your current IP address (or `0.0.0.0/0` for development).
4. Under **Clusters -> Connect -> Drivers**, copy your connection string:
   ```
   mongodb+srv://<username>:<password>@cluster0.mongodb.net/fitverse?retryWrites=true&w=majority
   ```
5. Paste this connection string into `backend/.env`:
   ```env
   MONGO_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/fitverse?retryWrites=true&w=majority
   ```
6. If `MONGO_URI` is left blank, FitVerse uses its built-in persistent local database (`backend/backend_data.json`).

---

## 💻 Terminal Commands to Run the Application

FitVerse runs locally with two commands:

### Terminal 1: Backend (Flask API)
```powershell
cd c:\Users\admin\Desktop\FitVerse-yoga\backend
python run.py
```
*Runs on `http://127.0.0.1:5000`.*

### Terminal 2: Frontend (React + Vite)
```powershell
cd c:\Users\admin\Desktop\FitVerse-yoga\frontend
npm run dev
```
*Runs on `http://localhost:5173`.*

---

## 🧪 Verified API Endpoints

- `POST /api/auth/register` — Register user & send OTP code.
- `POST /api/auth/verify-email` — Verify 6-digit OTP, activate account, return JWT.
- `POST /api/auth/resend-otp` — Resend fresh OTP with 60s cooldown limit.
- `POST /api/auth/login` — Sign in verified user; reject unverified accounts.
- `POST /api/auth/forgot-password` — Send 6-digit recovery code.
- `POST /api/auth/verify-reset-otp` — Verify password reset code.
- `POST /api/auth/reset-password` — Update password with verified OTP and strong validation.
- `GET /api/auth/me` — Return authenticated user profile.
- `GET /api/yoga/poses` — Catalog of supported yoga poses.
- `POST /api/yoga/sessions` — Record completed yoga practice.
- `GET /api/yoga/sessions/summary` — Aggregate dashboard weekly statistics.
- `POST /api/assistant/chat` — Gemini AI conversation coach.
