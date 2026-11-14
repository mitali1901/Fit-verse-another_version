# FitVerse – Database Schema & MongoDB Design

FitVerse uses MongoDB Atlas (with seamless fallback to local persistent storage for development and offline testing). The schema is optimized for fast query performance, user-centric data isolation, and time-series telemetry retrieval.

---

## 1. `users` Collection

Stores user credentials, profile information, and weekly fitness targets.

### Schema:
```json
{
  "_id": "ObjectId / UUID string",
  "name": "String (e.g. 'Ananya Sharma')",
  "email": "String (Unique, Lowercase, Indexed)",
  "password_hash": "String (Werkzeug pbkdf2:sha256 hashed)",
  "weekly_goal_minutes": "Number (Default: 150)",
  "created_at": "ISO 8601 String",
  "updated_at": "ISO 8601 String"
}
```

### Indexes:
- `email`: Unique Index (`ASCENDING`) ensuring no duplicate accounts.

---

## 2. `yoga_sessions` Collection

Records completed sessions from the AI Yoga Studio and telemetry metrics.

### Schema:
```json
{
  "_id": "ObjectId / UUID string",
  "user_id": "String (Foreign key reference to users._id)",
  "pose_name": "String ('Warrior II Pose', 'Tree Pose', 'Downward Dog')",
  "duration": "Number (Duration in seconds, e.g. 156)",
  "average_alignment_score": "Number (Float, e.g. 78.5)",
  "best_alignment_score": "Number (Float, e.g. 84.0)",
  "correction_count": "Number (Count of detected misalignments, e.g. 3)",
  "completed_at": "ISO 8601 String",
  "notes": "String (Optional user notes)"
}
```

### Indexes:
- Compound Index: `[("user_id", ASCENDING), ("completed_at", DESCENDING)]` for quick retrieval of recent sessions and weekly activity aggregations.

---

## 3. `chat_history` Collection (Optional / Future Persistence)

Stores conversational interactions between the user and the Gemini AI Fitness Assistant.

### Schema:
```json
{
  "_id": "ObjectId / UUID string",
  "user_id": "String",
  "messages": [
    {
      "role": "user | assistant",
      "content": "String",
      "timestamp": "ISO 8601 String"
    }
  ],
  "created_at": "ISO 8601 String",
  "updated_at": "ISO 8601 String"
}
```

