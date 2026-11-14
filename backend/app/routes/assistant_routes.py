from flask import Blueprint, request, jsonify
from app.services.gemini_service import GeminiService
from app.middleware.auth_middleware import token_required

assistant_bp = Blueprint("assistant_bp", __name__)

@assistant_bp.route("/chat", methods=["POST"])
def chat():
    """Chat with the FitVerse AI Fitness Assistant."""
    try:
        data = request.get_json() or {}
        message = data.get("message", "").strip()
        context = data.get("context", {})
        history = data.get("history", [])

        if not message:
            return jsonify({"success": False, "error": "Message content cannot be empty."}), 400

        reply = GeminiService.generate_response(
            user_message=message,
            context=context,
            conversation_history=history
        )

        return jsonify({
            "success": True,
            "reply": reply,
            "role": "assistant"
        }), 200

    except Exception as e:
        return jsonify({"success": False, "error": f"Assistant service error: {str(e)}"}), 500

