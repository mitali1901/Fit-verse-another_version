# FitVerse – REST API Documentation

All API endpoints are hosted by default on `http://localhost:5000/api`.

---

## 1. Authentication Endpoints

### `POST /api/auth/register`
Creates a new user account.
- **Request Body**:
  ```json
  {
    "name": "Ananya Sharma",
    "email": "ananya@fitverse.com",
    "password": "password123",
    "confirm_password": "password123"
  }
  ```
- **Responses**:
  - `201 Created`: `{ "success": true, "token": "<jwt>", "user": {...} }`
  - `400 Bad Request`: `{ "success": false, "errors": [...] }`
  - `409 Conflict`: `{ "success": false, "error": "Email already registered" }`

### `POST /api/auth/login`
Authenticates user and returns JWT token.
- **Request Body**:
  ```json
  {
    "email": "ananya@fitverse.com",
    "password": "password123"
  }
  ```
- **Responses**:
  - `200 OK`: `{ "success": true, "token": "<jwt>", "user": {...} }`
  - `401 Unauthorized`: `{ "success": false, "error": "Invalid email or password" }`

### `GET /api/auth/me`
Fetches authenticated user profile.
- **Headers**: `Authorization: Bearer <token>`
- **Response**: `200 OK`: `{ "success": true, "user": {...} }`

---

## 2. User Profile Endpoints

### `GET /api/users/profile`
Returns profile details and lifetime yoga statistics.
- **Headers**: `Authorization: Bearer <token>`
- **Response**: `200 OK`:
  ```json
  {
    "success": true,
    "user": { "name": "Ananya", "email": "..." },
    "stats": {
      "total_sessions": 6,
      "active_minutes": "90 min",
      "average_alignment_score": 85.0,
      "weekly_goal": { "target_minutes": 150, "current_minutes": 90, "progress_percentage": 60 }
    }
  }
  ```

### `PUT /api/users/profile`
Updates profile name and weekly fitness goals.
- **Headers**: `Authorization: Bearer <token>`
- **Request Body**:
  ```json
  {
    "name": "Ananya Sharma",
    "weekly_goal_minutes": 180
  }
  ```

---

## 3. Yoga Studio Endpoints

### `GET /api/yoga/poses`
Returns the 3 Version 1 supported poses with target biomechanical angles, instructions, and common errors.

### `POST /api/yoga/sessions`
Records a completed practice session.
- **Headers**: `Authorization: Bearer <token>`
- **Request Body**:
  ```json
  {
    "pose_name": "Warrior II Pose",
    "duration": 156,
    "average_alignment_score": 78.5,
    "best_alignment_score": 84.0,
    "correction_count": 3
  }
  ```
- **Response**: `201 Created`: `{ "success": true, "session": {...} }`

### `GET /api/yoga/sessions`
Returns history of sessions for the authenticated user.

### `GET /api/yoga/sessions/summary`
Returns aggregated weekly stats, activity chart data, and recent sessions matching the Dashboard layout.

---

## 4. AI Fitness Assistant Endpoint

### `POST /api/assistant/chat`
Conversational endpoint powered by Google Gemini.
- **Request Body**:
  ```json
  {
    "message": "Why is my knee alignment critical in Warrior II?",
    "context": {
      "current_pose": "Warrior II Pose",
      "alignment_score": 78,
      "common_mistakes": ["Front knee angle deviation"]
    }
  }
  ```
- **Response**: `200 OK`:
  ```json
  {
    "success": true,
    "role": "assistant",
    "reply": "In standing poses like Warrior II..."
  }
  ```

