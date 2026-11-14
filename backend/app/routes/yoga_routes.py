from flask import Blueprint, request, jsonify
from app.models.yoga_session_model import YogaSession
from app.middleware.auth_middleware import token_required
from app.services.session_service import SessionService
from app.utils.validators import validate_yoga_session

yoga_bp = Blueprint("yoga_bp", __name__)

POSES_METADATA = [
    {
        "id": "warrior_ii",
        "name": "Warrior II Pose",
        "sanskrit_name": "Virabhadrasana II",
        "category": "Standing / Strength",
        "difficulty": "Beginner / Intermediate",
        "target_time_seconds": 300, # 5 min default
        "description": "A powerful standing pose that strengthens legs and ankles while opening hips and chest.",
        "target_angles": {
            "front_knee": "85° - 100° (Right angle over ankle)",
            "back_leg": "165° - 180° (Straight & engaged)",
            "arms": "170° - 180° (Extended parallel to floor)"
        },
        "instructions": [
            "Step feet wide apart (~3.5 to 4 feet).",
            "Turn your front foot out 90 degrees and back foot slightly inwards.",
            "Bend front knee to 90 degrees directly above your ankle.",
            "Extend arms parallel to the floor, gaze over your front fingertips.",
            "Keep torso upright and centered over hips."
        ],
        "common_mistakes": [
            "Front knee collapsing inward or bending past toes.",
            "Arms dropping below shoulder height or uneven shoulders.",
            "Leaning the torso forward toward the front thigh."
        ]
    },
    {
        "id": "tree_pose",
        "name": "Tree Pose",
        "sanskrit_name": "Vrikshasana",
        "category": "Balancing / Focus",
        "difficulty": "Beginner",
        "target_time_seconds": 300,
        "description": "A classic standing balance posture improving equilibrium, poise, and leg stability.",
        "target_angles": {
            "standing_leg": "170° - 180° (Strong & upright)",
            "bent_knee": "30° - 65° (Folded with hip abducted)",
            "spine": "170° - 180° (Vertical neutral spine)"
        },
        "instructions": [
            "Root down firmly through the sole of your standing foot.",
            "Place the sole of your opposite foot on your inner calf or upper thigh (never the knee).",
            "Bring your palms together at your chest in prayer (Anjali Mudra) or extend overhead.",
            "Fix your gaze on a steady focal point (Drishti) at eye level."
        ],
        "common_mistakes": [
            "Resting the foot directly onto the side of the knee joint.",
            "Collapsing the hip of the standing leg outward.",
            "Hunching shoulders or holding breath."
        ]
    },
    {
        "id": "downward_dog",
        "name": "Downward-Facing Dog",
        "sanskrit_name": "Adho Mukha Svanasana",
        "category": "Inversion / Flexibility",
        "difficulty": "Beginner",
        "target_time_seconds": 300,
        "description": "An energizing inverted 'V' posture stretching hamstrings, calves, spine, and opening shoulders.",
        "target_angles": {
            "hip_apex": "65° - 90° (Hips lifted high to form sharp V)",
            "arms": "165° - 180° (Straight arms from wrist to shoulder)",
            "legs": "160° - 180° (Legs extended, knees soft if hamstrings are tight)"
        },
        "instructions": [
            "Begin on hands and knees, hands shoulder-width, knees hip-width.",
            "Press into palms and lift knees away from the floor, pushing hips back and up.",
            "Lengthen spine, relax neck between upper arms.",
            "Reach heels gently toward the mat without forcing."
        ],
        "common_mistakes": [
            "Rounding the spine due to stiff hamstrings (bend knees instead!).",
            "Dumping too much weight into wrists; push firmly through knuckles.",
            "Shoulders crowding ears; roll shoulders open."
        ]
    }
]

@yoga_bp.route("/poses", methods=["GET"])
def get_poses():
    return jsonify({
        "success": True,
        "poses": POSES_METADATA
    }), 200

@yoga_bp.route("/sessions", methods=["POST"])
@token_required
def create_session(current_user):
    try:
        data = request.get_json() or {}
        errors = validate_yoga_session(data)
        if errors:
            return jsonify({"success": False, "errors": errors}), 400

        session = YogaSession.create(
            user_id=current_user._id,
            pose_name=data.get("pose_name"),
            duration=data.get("duration", 0),
            average_alignment_score=data.get("average_alignment_score", 0),
            best_alignment_score=data.get("best_alignment_score", 0),
            correction_count=data.get("correction_count", 0),
            notes=data.get("notes", "")
        )

        return jsonify({
            "success": True,
            "message": "Yoga session recorded successfully.",
            "session": session.to_dict()
        }), 201
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@yoga_bp.route("/sessions", methods=["GET"])
@token_required
def get_sessions(current_user):
    try:
        limit = int(request.args.get("limit", 20))
        sessions = YogaSession.find_by_user(current_user._id, limit=limit)
        return jsonify({
            "success": True,
            "sessions": [s.to_dict() for s in sessions]
        }), 200
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@yoga_bp.route("/sessions/summary", methods=["GET"])
@token_required
def get_session_summary(current_user):
    try:
        stats = SessionService.get_user_dashboard_stats(current_user)
        return jsonify({
            "success": True,
            "summary": stats
        }), 200
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

