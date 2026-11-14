import datetime
from werkzeug.security import generate_password_hash, check_password_hash
from app.utils.db import Database
from bson import ObjectId

class User:
    def __init__(self, name, email, password_hash=None, is_verified=False, created_at=None, updated_at=None, weekly_goal_minutes=150, _id=None):
        self._id = str(_id) if _id else None
        self.name = name
        self.email = email.lower()
        self.password_hash = password_hash
        self.is_verified = bool(is_verified)
        self.created_at = created_at or datetime.datetime.utcnow().isoformat()
        self.updated_at = updated_at or datetime.datetime.utcnow().isoformat()
        self.weekly_goal_minutes = weekly_goal_minutes

    @staticmethod
    def hash_password(password):
        return generate_password_hash(password)

    @staticmethod
    def verify_password(stored_hash, password):
        if not stored_hash or not password:
            return False
        return check_password_hash(stored_hash, password)

    def to_dict(self, include_sensitive=False):
        data = {
            "name": self.name,
            "email": self.email,
            "is_verified": self.is_verified,
            "weekly_goal_minutes": self.weekly_goal_minutes,
            "created_at": self.created_at,
            "updated_at": self.updated_at,
        }
        if self._id:
            data["_id"] = str(self._id)
        if include_sensitive:
            data["password_hash"] = self.password_hash
        return data

    @classmethod
    def create(cls, name, email, password, is_verified=False, weekly_goal_minutes=150):
        users_col = Database.get_users_collection()
        email_clean = email.strip().lower()

        # Check if already exists
        existing = users_col.find_one({"email": email_clean})
        if existing:
            # If account exists but was NEVER verified, allow re-initiating registration
            if not existing.get("is_verified", False):
                pwd_hash = cls.hash_password(password)
                now = datetime.datetime.utcnow().isoformat()
                users_col.update_one(
                    {"email": email_clean},
                    {"$set": {
                        "name": name.strip(),
                        "password_hash": pwd_hash,
                        "updated_at": now
                    }}
                )
                updated_doc = users_col.find_one({"email": email_clean})
                return cls(
                    _id=updated_doc.get("_id"),
                    name=updated_doc.get("name"),
                    email=email_clean,
                    password_hash=pwd_hash,
                    is_verified=False,
                    weekly_goal_minutes=updated_doc.get("weekly_goal_minutes", 150),
                    created_at=updated_doc.get("created_at"),
                    updated_at=now
                ), None
            return None, "An active account with this email address already exists. Please sign in."

        pwd_hash = cls.hash_password(password)
        now = datetime.datetime.utcnow().isoformat()
        new_user_data = {
            "name": name.strip(),
            "email": email_clean,
            "password_hash": pwd_hash,
            "is_verified": is_verified,
            "weekly_goal_minutes": weekly_goal_minutes,
            "created_at": now,
            "updated_at": now
        }

        result = users_col.insert_one(new_user_data)
        new_user = cls(
            _id=result.inserted_id,
            name=name.strip(),
            email=email_clean,
            password_hash=pwd_hash,
            is_verified=is_verified,
            weekly_goal_minutes=weekly_goal_minutes,
            created_at=now,
            updated_at=now
        )
        return new_user, None

    @classmethod
    def find_by_email(cls, email):
        users_col = Database.get_users_collection()
        doc = users_col.find_one({"email": email.strip().lower()})
        if not doc:
            return None
        # Default existing legacy/demo user to verified
        is_verified = doc.get("is_verified")
        if is_verified is None:
            # Legacy demo user defaults to true
            is_verified = (doc.get("email") == "ananya@fitverse.com")
        return cls(
            _id=doc.get("_id"),
            name=doc.get("name"),
            email=doc.get("email"),
            password_hash=doc.get("password_hash"),
            is_verified=bool(is_verified),
            weekly_goal_minutes=doc.get("weekly_goal_minutes", 150),
            created_at=doc.get("created_at"),
            updated_at=doc.get("updated_at")
        )

    @classmethod
    def find_by_id(cls, user_id):
        users_col = Database.get_users_collection()
        query = {"_id": user_id}
        if ObjectId.is_valid(str(user_id)):
            try:
                query = {"$or": [{"_id": str(user_id)}, {"_id": ObjectId(user_id)}]}
            except Exception:
                query = {"_id": str(user_id)}
        
        doc = users_col.find_one(query)
        if not doc and ObjectId.is_valid(str(user_id)):
            doc = users_col.find_one({"_id": str(user_id)})
            
        if not doc:
            return None

        is_verified = doc.get("is_verified")
        if is_verified is None:
            is_verified = (doc.get("email") == "ananya@fitverse.com")

        return cls(
            _id=doc.get("_id"),
            name=doc.get("name"),
            email=doc.get("email"),
            password_hash=doc.get("password_hash"),
            is_verified=bool(is_verified),
            weekly_goal_minutes=doc.get("weekly_goal_minutes", 150),
            created_at=doc.get("created_at"),
            updated_at=doc.get("updated_at")
        )

    @classmethod
    def verify_user(cls, email):
        users_col = Database.get_users_collection()
        now = datetime.datetime.utcnow().isoformat()
        users_col.update_one(
            {"email": email.strip().lower()},
            {"$set": {"is_verified": True, "updated_at": now}}
        )
        return cls.find_by_email(email)

    @classmethod
    def update_password(cls, email, new_password):
        users_col = Database.get_users_collection()
        now = datetime.datetime.utcnow().isoformat()
        pwd_hash = cls.hash_password(new_password)
        users_col.update_one(
            {"email": email.strip().lower()},
            {"$set": {"password_hash": pwd_hash, "updated_at": now}}
        )
        return cls.find_by_email(email)

    @classmethod
    def update_profile(cls, user_id, updates):
        users_col = Database.get_users_collection()
        now = datetime.datetime.utcnow().isoformat()
        payload = dict(updates)
        payload["updated_at"] = now
        
        query = {"_id": user_id}
        if ObjectId.is_valid(str(user_id)):
            try:
                query = {"$or": [{"_id": str(user_id)}, {"_id": ObjectId(user_id)}]}
            except Exception:
                query = {"_id": str(user_id)}

        users_col.update_one(query, {"$set": payload})
        return cls.find_by_id(user_id)
