from flask import Blueprint, request, jsonify
from app.models.user_model import User
from app.middleware.auth_middleware import token_required
from app.services.session_service import SessionService

user_bp = Blueprint("user_bp", __name__)

@user_bp.route("/profile", methods=["GET"])
@token_required
def get_profile(current_user):
    try:
        stats = SessionService.get_user_dashboard_stats(current_user)
        return jsonify({
            "success": True,
            "user": current_user.to_dict(),
            "stats": {
                "total_sessions": stats["total_lifetime_sessions"],
                "active_minutes": stats["stats"]["active_minutes"]["value"],
                "average_alignment_score": stats["average_lifetime_score"],
                "weekly_goal": stats["weekly_goal"]
            }
        }), 200
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@user_bp.route("/profile", methods=["PUT"])
@token_required
def update_profile(current_user):
    try:
        data = request.get_json() or {}
        updates = {}
        
        if "name" in data and len(data["name"].strip()) >= 2:
            updates["name"] = data["name"].strip()
            
        if "weekly_goal_minutes" in data:
            try:
                val = int(data["weekly_goal_minutes"])
                if val > 0:
                    updates["weekly_goal_minutes"] = val
            except ValueError:
                pass

        if not updates:
            return jsonify({"success": False, "error": "No valid profile update fields provided."}), 400

        updated_user = User.update_profile(current_user._id, updates)
        return jsonify({
            "success": True,
            "message": "Profile updated successfully.",
            "user": updated_user.to_dict()
        }), 200
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

