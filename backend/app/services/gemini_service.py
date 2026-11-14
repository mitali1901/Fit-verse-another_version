import os
from config.settings import Config

SYSTEM_PROMPT = """You are the FitVerse AI Fitness & Yoga Coach, an empathetic, encouraging, and knowledgeable AI companion designed to help users practice yoga safely, improve body alignment, build mindful fitness habits, and understand their posture corrections.

Your Tone and Style:
- Warm, supportive, motivational, and beginner-friendly.
- Concise, clear, structured with bullet points where helpful.
- Rooted in classical yoga principles (mindfulness, breath / pranayama, alignment, balance) and modern sports science.

Your Capabilities & Scope:
1. Explain yoga postures (especially Tree Pose / Vrikshasana, Warrior II / Virabhadrasana II, and Downward-Facing Dog / Adho Mukha Svanasana).
2. Interpret posture correction feedback (e.g. why knee alignment over ankle prevents ACL/meniscus strain, how shoulder relaxation relieves neck tension).
3. Offer beginner-friendly fitness routines, gentle mobility stretches, and warm-ups/cool-downs.
4. Share evidence-based nutrition tips (hydration, post-workout recovery, balanced whole foods).
5. Suggest lifestyle & mindfulness advice (sleep hygiene, stress relief, breathing exercises).

Safety Rules:
- Remind users that yoga posture feedback is an AI-assisted training guide and does not replace medical advice or in-person certified yoga instruction.
- If a user mentions sharp pain, dizziness, or injury, advise them to stop gently and consult a healthcare professional.
"""

class GeminiService:
    @staticmethod
    def generate_response(user_message, context=None, conversation_history=None):
        api_key = Config.GEMINI_API_KEY.strip() if Config.GEMINI_API_KEY else ""

        # Construct context block
        context_str = ""
        if context:
            context_parts = []
            if context.get("current_pose"):
                context_parts.append(f"- Current / Recent Pose: {context['current_pose']}")
            if context.get("alignment_score") is not None:
                context_parts.append(f"- Alignment Score: {context['alignment_score']}%")
            if context.get("common_mistakes"):
                context_parts.append(f"- Detected Posture Observations: {', '.join(context['common_mistakes'])}")
            if context.get("session_duration"):
                context_parts.append(f"- Recent Session Duration: {context['session_duration']} seconds")
            if context.get("weekly_goal"):
                context_parts.append(f"- Weekly Fitness Target: {context['weekly_goal']} minutes")
            
            if context_parts:
                context_str = "\n\nUser Session Context:\n" + "\n".join(context_parts) + "\n"

        prompt = f"{SYSTEM_PROMPT}\n{context_str}\nUser Question: {user_message}\nFitVerse Coach:"

        if api_key:
            try:
                # Use Google Generative AI SDK
                import google.generativeai as genai
                genai.configure(api_key=api_key)
                model = genai.GenerativeModel('gemini-1.5-flash')
                response = model.generate_content(prompt)
                if response and response.text:
                    return response.text.strip()
            except Exception as e:
                print(f"[GeminiService Error] API call failed: {e}. Falling back to contextual response generator.")

        # Fallback intelligent contextual response generator
        return GeminiService._generate_fallback_response(user_message, context)

    @staticmethod
    def _generate_fallback_response(message, context=None):
        msg_lower = message.lower()
        pose = context.get("current_pose", "") if context else ""
        score = context.get("alignment_score", 0) if context else 0
        mistakes = context.get("common_mistakes", []) if context else []

        if "knee" in msg_lower or "adjust" in msg_lower or (mistakes and any("knee" in m.lower() for m in mistakes)):
            return (
                "Great question about knee alignment! In standing poses like **Warrior II (Virabhadrasana II)**, "
                "keeping your front knee directly stacked over your ankle (forming approximately a 90° angle) protects the anterior cruciate ligament (ACL) "
                "and distributes weight evenly across your quad and hip. If your knee drifts inward or past your toes, widen your stance slightly and engage your outer hip to press the knee toward your pinky toe! 🧘‍♀️"
            )
        elif "tree" in msg_lower or "vrikshasana" in msg_lower or pose == "Tree Pose":
            return (
                "**Tree Pose (Vrikshasana) Mastery Tips:**\n"
                "• **Grounding:** Root all four corners of your standing foot firmly into the mat.\n"
                "• **Foot Placement:** Place your lifted foot on the inner calf or upper inner thigh—*never directly against the knee joint* to protect cartilage.\n"
                "• **Drishti (Focus Point):** Fix your gaze on a non-moving point 5-6 feet ahead of you to steady your balance.\n"
                "• **Hands:** Bring palms together in front of your heart (*Anjali Mudra*) or extend them gently overhead like tree branches."
            )
        elif "warrior" in msg_lower or "virabhadrasana" in msg_lower or pose == "Warrior II Pose":
            return (
                "**Warrior II (Virabhadrasana II) Guidance:**\n"
                "• **Arms:** Extend both arms parallel to the floor, shoulder-height. Soften your shoulders away from your ears to release tension.\n"
                "• **Front Leg:** Bend your front knee toward a 90-degree angle, keeping it tracking over the second toe.\n"
                "• **Torso:** Keep your torso stacked right over your hips rather than leaning forward toward the front knee.\n"
                "• **Gaze:** Look softly over the middle fingernail of your front hand with calm confidence."
            )
        elif "downward" in msg_lower or "dog" in msg_lower or "svanasana" in msg_lower:
            return (
                "**Downward-Facing Dog (Adho Mukha Svanasana) Checklist:**\n"
                "• **Hands:** Spread fingers wide, pressing firmly through the index finger knuckles and thumbs to protect the wrists.\n"
                "• **Spine:** Prioritize a long, neutral spine over flat heels! Bend your knees as much as needed to tilt your sit bones toward the sky.\n"
                "• **Shoulders:** Externally rotate your upper arms to broaden your collarbones and create space around your neck."
            )
        elif "score" in msg_lower or "improve" in msg_lower:
            curr_score = f"{score}%" if score else "your current session"
            return (
                f"Your alignment score is {curr_score}! To raise your score:\n"
                "1. Focus on stability first before deepening the pose.\n"
                "2. Check the real-time red lines on the camera view—they show which limb segment has an angle deviation.\n"
                "3. Breathe deeply and hold the pose steady for at least 5-10 seconds to allow the computer vision tracker to calibrate your balance."
            )
        elif "nutrition" in msg_lower or "food" in msg_lower or "diet" in msg_lower:
            return (
                "**Nutrition & Recovery Tips for Yoga & Fitness:**\n"
                "• **Pre-Session:** Avoid heavy meals 2 hours before yoga; a light fruit (banana or apple) 30 minutes prior gives quick, light energy.\n"
                "• **Hydration:** Sip water with a pinch of electrolytes throughout the day rather than chugging water right before inversions.\n"
                "• **Post-Session Recovery:** Aim for a 3:1 ratio of complex carbs to clean protein (e.g., oatmeal with chia seeds and plant protein, or lentil soup) to replenish glycogen stores."
            )
        elif "beginner" in msg_lower or "start" in msg_lower or "routine" in msg_lower:
            return (
                "Welcome to your yoga journey! As a beginner, consistency is much more effective than intensity.\n"
                "• Start with **10 to 15 minutes** of gentle practice 3-4 days a week.\n"
                "• Begin each session with 2 minutes of conscious diaphragmatic breathing.\n"
                "• Practice foundational poses: Mountain Pose, Tree Pose, and Downward Dog.\n"
                "• Use the FitVerse AI Studio to get real-time feedback so you build healthy muscle memory from day one!"
            )
        else:
            return (
                f"Hello! I'm your FitVerse AI Coach. {('You are currently practicing ' + pose + '. ') if pose else ''}"
                "I'm here to answer any questions about your yoga poses, help correct joint alignment, recommend tailored workout routines, or discuss recovery and nutrition. "
                "How can I support your fitness goals today?"
            )

