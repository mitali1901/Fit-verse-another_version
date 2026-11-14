import datetime
from app.utils.db import Database
from bson import ObjectId

class YogaSession:
    def __init__(self, user_id, pose_name, duration, average_alignment_score, best_alignment_score=0, correction_count=0, completed_at=None, notes="", _id=None, created_at=None, **kwargs):
        self._id = str(_id) if _id else None
        self.user_id = str(user_id)
        self.pose_name = pose_name
        self.duration = duration # in seconds
        self.average_alignment_score = average_alignment_score
        self.best_alignment_score = best_alignment_score
        self.correction_count = correction_count
        self.completed_at = completed_at or datetime.datetime.utcnow().isoformat()
        self.created_at = created_at or self.completed_at
        self.notes = notes

    def to_dict(self):
        return {
            "_id": str(self._id) if self._id else None,
            "user_id": str(self.user_id),
            "pose_name": self.pose_name,
            "duration": self.duration,
            "average_alignment_score": self.average_alignment_score,
            "best_alignment_score": self.best_alignment_score,
            "correction_count": self.correction_count,
            "completed_at": self.completed_at,
            "notes": self.notes
        }

    @classmethod
    def create(cls, user_id, pose_name, duration, average_alignment_score, best_alignment_score=0, correction_count=0, notes=""):
        sessions_col = Database.get_yoga_sessions_collection()
        now = datetime.datetime.utcnow().isoformat()
        doc = {
            "user_id": str(user_id),
            "pose_name": pose_name,
            "duration": int(duration),
            "average_alignment_score": round(float(average_alignment_score), 1),
            "best_alignment_score": round(float(best_alignment_score), 1),
            "correction_count": int(correction_count),
            "completed_at": now,
            "notes": notes
        }
        res = sessions_col.insert_one(doc)
        doc["_id"] = str(res.inserted_id)
        return cls(**doc)

    @classmethod
    def find_by_user(cls, user_id, limit=20):
        sessions_col = Database.get_yoga_sessions_collection()
        docs = sessions_col.find(
            {"user_id": str(user_id)},
            sort=[("completed_at", -1)],
            limit=limit
        )
        return [cls(**{k: v for k, v in doc.items() if k in ["user_id", "pose_name", "duration", "average_alignment_score", "best_alignment_score", "correction_count", "completed_at", "notes", "_id"]}) for doc in docs]
