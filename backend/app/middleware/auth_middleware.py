import jwt
import datetime
from functools import wraps
from flask import request, jsonify
from config.settings import Config
from app.models.user_model import User

def generate_token(user_id):
    """Generate JWT token valid for Config.JWT_EXPIRATION_DAYS."""
    payload = {
        "user_id": str(user_id),
        "exp": datetime.datetime.utcnow() + datetime.timedelta(days=Config.JWT_EXPIRATION_DAYS),
        "iat": datetime.datetime.utcnow()
    }
    return jwt.encode(payload, Config.SECRET_KEY, algorithm="HS256")

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get("Authorization")
        if not auth_header:
            return jsonify({"success": False, "error": "Authorization token is missing."}), 401

        parts = auth_header.split()
        if len(parts) != 2 or parts[0].lower() != "bearer":
            return jsonify({"success": False, "error": "Invalid Authorization header format. Expected 'Bearer <token>'."}), 401

        token = parts[1]
        try:
            payload = jwt.decode(token, Config.SECRET_KEY, algorithms=["HS256"])
            user_id = payload.get("user_id")
            current_user = User.find_by_id(user_id)
            if not current_user:
                return jsonify({"success": False, "error": "User associated with this token was not found."}), 401
        except jwt.ExpiredSignatureError:
            return jsonify({"success": False, "error": "Authentication token has expired. Please log in again."}), 401
        except jwt.InvalidTokenError:
            return jsonify({"success": False, "error": "Invalid authentication token."}), 401
        except Exception as e:
            return jsonify({"success": False, "error": f"Token verification error: {str(e)}"}), 401

        return f(current_user, *args, **kwargs)

    return decorated

