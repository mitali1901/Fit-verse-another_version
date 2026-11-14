import datetime
from flask import Blueprint, request, jsonify
from app.models.user_model import User
from app.utils.db import Database
from app.middleware.auth_middleware import generate_token, token_required
from app.utils.validators import validate_registration, validate_login, validate_reset_password
from app.utils.otp_utils import generate_secure_otp, hash_otp, verify_otp_hash
from app.services.email_service import EmailService

auth_bp = Blueprint("auth_bp", __name__)

OTP_EXPIRY_MINUTES = 5
RESEND_COOLDOWN_SECONDS = 60
MAX_VERIFICATION_ATTEMPTS = 5

# ── POST /api/auth/register ───────────────────────────────────────────────────
@auth_bp.route("/register", methods=["POST"])
def register():
    try:
        data = request.get_json() or {}
        errors = validate_registration(data)
        if errors:
            return jsonify({"success": False, "errors": errors, "error": errors[0]}), 400

        name = data.get("name", "").strip()
        email = data.get("email", "").strip().lower()
        password = data.get("password")

        # Create user record with is_verified=False
        user, err = User.create(name=name, email=email, password=password, is_verified=False)
        if err:
            return jsonify({"success": False, "error": err}), 409

        # Generate secure 6-digit OTP
        otp_code = generate_secure_otp()
        otp_hash = hash_otp(otp_code)

        otp_col = Database.get_otp_collection()
        # Invalidate old OTPs for this email and purpose
        otp_col.delete_many({"email": email, "otp_type": "email_verification"})

        now = datetime.datetime.utcnow()
        expires_at = now + datetime.timedelta(minutes=OTP_EXPIRY_MINUTES)

        otp_col.insert_one({
            "email": email,
            "otp_hash": otp_hash,
            "otp_type": "email_verification",
            "attempts": 0,
            "expires_at": expires_at.isoformat(),
            "last_sent_at": now.isoformat(),
            "created_at": now.isoformat()
        })

        # Send real OTP email via SMTP
        email_sent, email_err = EmailService.send_otp_email(
            recipient_email=email,
            otp_code=otp_code,
            purpose="email_verification",
            recipient_name=name
        )

        return jsonify({
            "success": True,
            "message": "Account created! A 6-digit verification code has been sent to your email address.",
            "email": email,
            "is_verified": False,
            "email_dispatched": email_sent
        }), 201

    except Exception as e:
        return jsonify({"success": False, "error": f"Internal server error: {str(e)}"}), 500


# ── POST /api/auth/verify-email ───────────────────────────────────────────────
@auth_bp.route("/verify-email", methods=["POST"])
def verify_email():
    try:
        data = request.get_json() or {}
        email = data.get("email", "").strip().lower()
        otp = str(data.get("otp", "")).strip()

        if not email:
            return jsonify({"success": False, "error": "Email is required."}), 400
        if not otp or len(otp) != 6:
            return jsonify({"success": False, "error": "Please enter a valid 6-digit verification code."}), 400

        otp_col = Database.get_otp_collection()
        record = otp_col.find_one({"email": email, "otp_type": "email_verification"})

        if not record:
            return jsonify({
                "success": False,
                "error": "No active verification code found for this email. Please request a new code."
            }), 400

        # Check maximum verification attempts
        attempts = record.get("attempts", 0)
        if attempts >= MAX_VERIFICATION_ATTEMPTS:
            otp_col.delete_many({"email": email, "otp_type": "email_verification"})
            return jsonify({
                "success": False,
                "error": "Maximum verification attempts (5) exceeded. Please request a new code."
            }), 429

        # Check expiration
        expires_at_str = record.get("expires_at")
        if expires_at_str:
            try:
                expires_at = datetime.datetime.fromisoformat(expires_at_str)
                if datetime.datetime.utcnow() > expires_at:
                    otp_col.delete_many({"email": email, "otp_type": "email_verification"})
                    return jsonify({
                        "success": False,
                        "error": "Verification code has expired. Please request a new code."
                    }), 400
            except Exception:
                pass

        # Verify OTP Hash
        stored_hash = record.get("otp_hash", "")
        if not verify_otp_hash(otp, stored_hash):
            new_attempts = attempts + 1
            otp_col.update_one(
                {"_id": record.get("_id")},
                {"$set": {"attempts": new_attempts}}
            )
            remaining = MAX_VERIFICATION_ATTEMPTS - new_attempts
            if remaining <= 0:
                otp_col.delete_many({"email": email, "otp_type": "email_verification"})
                return jsonify({
                    "success": False,
                    "error": "Maximum verification attempts exceeded. Please request a new code."
                }), 429
            return jsonify({
                "success": False,
                "error": f"Invalid verification code. {remaining} attempt{'s' if remaining != 1 else ''} remaining."
            }), 400

        # OTP is correct! Activate user account
        user = User.verify_user(email)
        if not user:
            return jsonify({"success": False, "error": "User account not found."}), 404

        # Invalidate OTP record
        otp_col.delete_many({"email": email, "otp_type": "email_verification"})

        # Issue JWT Token so user is immediately logged in
        token = generate_token(user._id)

        return jsonify({
            "success": True,
            "message": "Email address verified successfully! Welcome to FitVerse.",
            "token": token,
            "user": user.to_dict()
        }), 200

    except Exception as e:
        return jsonify({"success": False, "error": f"Verification error: {str(e)}"}), 500


# ── POST /api/auth/resend-otp ─────────────────────────────────────────────────
@auth_bp.route("/resend-otp", methods=["POST"])
def resend_otp():
    try:
        data = request.get_json() or {}
        email = data.get("email", "").strip().lower()
        purpose = data.get("purpose", "email_verification")

        if not email:
            return jsonify({"success": False, "error": "Email is required."}), 400

        user = User.find_by_email(email)
        if not user:
            return jsonify({"success": False, "error": "No account found with this email address."}), 404

        otp_col = Database.get_otp_collection()
        existing = otp_col.find_one({"email": email, "otp_type": purpose})

        now = datetime.datetime.utcnow()

        # Enforce 60-second cooldown
        if existing and existing.get("last_sent_at"):
            try:
                last_sent = datetime.datetime.fromisoformat(existing["last_sent_at"])
                elapsed = (now - last_sent).total_seconds()
                if elapsed < RESEND_COOLDOWN_SECONDS:
                    wait_sec = int(RESEND_COOLDOWN_SECONDS - elapsed)
                    return jsonify({
                        "success": False,
                        "error": f"Please wait {wait_sec} second{'s' if wait_sec != 1 else ''} before requesting another code.",
                        "cooldown_remaining": wait_sec
                    }), 429
            except Exception:
                pass

        # Invalidate previous and generate fresh OTP
        otp_col.delete_many({"email": email, "otp_type": purpose})

        otp_code = generate_secure_otp()
        otp_hash = hash_otp(otp_code)
        expires_at = now + datetime.timedelta(minutes=OTP_EXPIRY_MINUTES)

        otp_col.insert_one({
            "email": email,
            "otp_hash": otp_hash,
            "otp_type": purpose,
            "attempts": 0,
            "expires_at": expires_at.isoformat(),
            "last_sent_at": now.isoformat(),
            "created_at": now.isoformat()
        })

        # Send email
        email_sent, email_err = EmailService.send_otp_email(
            recipient_email=email,
            otp_code=otp_code,
            purpose=purpose,
            recipient_name=user.name
        )

        return jsonify({
            "success": True,
            "message": "A fresh 6-digit verification code has been dispatched to your email.",
            "email": email,
            "email_dispatched": email_sent
        }), 200

    except Exception as e:
        return jsonify({"success": False, "error": f"Resend error: {str(e)}"}), 500


# ── POST /api/auth/login ──────────────────────────────────────────────────────
@auth_bp.route("/login", methods=["POST"])
def login():
    try:
        data = request.get_json() or {}
        errors = validate_login(data)
        if errors:
            return jsonify({"success": False, "errors": errors, "error": errors[0]}), 400

        email = data.get("email", "").strip().lower()
        password = data.get("password", "")

        user = User.find_by_email(email)
        if not user or not User.verify_password(user.password_hash, password):
            return jsonify({"success": False, "error": "Invalid email or password."}), 401

        # Check if email is verified
        if not user.is_verified:
            # Auto-send a fresh OTP if needed
            otp_col = Database.get_otp_collection()
            now = datetime.datetime.utcnow()
            otp_code = generate_secure_otp()
            otp_col.delete_many({"email": email, "otp_type": "email_verification"})
            otp_col.insert_one({
                "email": email,
                "otp_hash": hash_otp(otp_code),
                "otp_type": "email_verification",
                "attempts": 0,
                "expires_at": (now + datetime.timedelta(minutes=OTP_EXPIRY_MINUTES)).isoformat(),
                "last_sent_at": now.isoformat(),
                "created_at": now.isoformat()
            })
            EmailService.send_otp_email(email, otp_code, purpose="email_verification", recipient_name=user.name)

            return jsonify({
                "success": False,
                "error": "Your email address is not verified yet. Please check your inbox and verify your email to continue.",
                "unverified": True,
                "email": email
            }), 403

        token = generate_token(user._id)
        return jsonify({
            "success": True,
            "message": "Login successful.",
            "token": token,
            "user": user.to_dict()
        }), 200

    except Exception as e:
        return jsonify({"success": False, "error": f"Internal server error: {str(e)}"}), 500


# ── POST /api/auth/forgot-password ───────────────────────────────────────────
@auth_bp.route("/forgot-password", methods=["POST"])
def forgot_password():
    try:
        data = request.get_json() or {}
        email = data.get("email", "").strip().lower()

        if not email:
            return jsonify({"success": False, "error": "Email address is required."}), 400

        user = User.find_by_email(email)
        if not user:
            return jsonify({"success": False, "error": "No account found with this email address."}), 404

        otp_col = Database.get_otp_collection()
        now = datetime.datetime.utcnow()

        # Check cooldown
        existing = otp_col.find_one({"email": email, "otp_type": "password_reset"})
        if existing and existing.get("last_sent_at"):
            try:
                last_sent = datetime.datetime.fromisoformat(existing["last_sent_at"])
                elapsed = (now - last_sent).total_seconds()
                if elapsed < RESEND_COOLDOWN_SECONDS:
                    wait_sec = int(RESEND_COOLDOWN_SECONDS - elapsed)
                    return jsonify({
                        "success": False,
                        "error": f"Please wait {wait_sec} second{'s' if wait_sec != 1 else ''} before requesting another code.",
                        "cooldown_remaining": wait_sec
                    }), 429
            except Exception:
                pass

        otp_code = generate_secure_otp()
        otp_col.delete_many({"email": email, "otp_type": "password_reset"})

        expires_at = now + datetime.timedelta(minutes=OTP_EXPIRY_MINUTES)
        otp_col.insert_one({
            "email": email,
            "otp_hash": hash_otp(otp_code),
            "otp_type": "password_reset",
            "attempts": 0,
            "expires_at": expires_at.isoformat(),
            "last_sent_at": now.isoformat(),
            "created_at": now.isoformat()
        })

        EmailService.send_otp_email(
            recipient_email=email,
            otp_code=otp_code,
            purpose="password_reset",
            recipient_name=user.name
        )

        return jsonify({
            "success": True,
            "message": "A 6-digit password reset code has been sent to your registered email address.",
            "email": email
        }), 200

    except Exception as e:
        return jsonify({"success": False, "error": f"Forgot password error: {str(e)}"}), 500


# ── POST /api/auth/verify-reset-otp ──────────────────────────────────────────
@auth_bp.route("/verify-reset-otp", methods=["POST"])
def verify_reset_otp():
    try:
        data = request.get_json() or {}
        email = data.get("email", "").strip().lower()
        otp = str(data.get("otp", "")).strip()

        if not email or not otp or len(otp) != 6:
            return jsonify({"success": False, "error": "Please provide a valid email and 6-digit code."}), 400

        otp_col = Database.get_otp_collection()
        record = otp_col.find_one({"email": email, "otp_type": "password_reset"})

        if not record:
            return jsonify({
                "success": False,
                "error": "No active password reset code found for this email. Please request a new code."
            }), 400

        # Check attempts
        attempts = record.get("attempts", 0)
        if attempts >= MAX_VERIFICATION_ATTEMPTS:
            otp_col.delete_many({"email": email, "otp_type": "password_reset"})
            return jsonify({
                "success": False,
                "error": "Maximum verification attempts exceeded. Please request a new code."
            }), 429

        # Check expiration
        expires_at_str = record.get("expires_at")
        if expires_at_str:
            try:
                expires_at = datetime.datetime.fromisoformat(expires_at_str)
                if datetime.datetime.utcnow() > expires_at:
                    otp_col.delete_many({"email": email, "otp_type": "password_reset"})
                    return jsonify({
                        "success": False,
                        "error": "Password reset code has expired. Please request a new code."
                    }), 400
            except Exception:
                pass

        stored_hash = record.get("otp_hash", "")
        if not verify_otp_hash(otp, stored_hash):
            new_attempts = attempts + 1
            otp_col.update_one(
                {"_id": record.get("_id")},
                {"$set": {"attempts": new_attempts}}
            )
            remaining = MAX_VERIFICATION_ATTEMPTS - new_attempts
            return jsonify({
                "success": False,
                "error": f"Invalid verification code. {remaining} attempt{'s' if remaining != 1 else ''} remaining."
            }), 400

        return jsonify({
            "success": True,
            "message": "Reset code verified successfully. Please enter your new strong password."
        }), 200

    except Exception as e:
        return jsonify({"success": False, "error": f"Verification error: {str(e)}"}), 500


# ── POST /api/auth/reset-password ─────────────────────────────────────────────
@auth_bp.route("/reset-password", methods=["POST"])
def reset_password():
    try:
        data = request.get_json() or {}
        errors = validate_reset_password(data)
        if errors:
            return jsonify({"success": False, "errors": errors, "error": errors[0]}), 400

        email = data.get("email", "").strip().lower()
        otp = str(data.get("otp", "")).strip()
        new_password = data.get("password")

        otp_col = Database.get_otp_collection()
        record = otp_col.find_one({"email": email, "otp_type": "password_reset"})

        if not record:
            return jsonify({
                "success": False,
                "error": "No active password reset code found for this email. Please request a new code."
            }), 400

        attempts = record.get("attempts", 0)
        if attempts >= MAX_VERIFICATION_ATTEMPTS:
            otp_col.delete_many({"email": email, "otp_type": "password_reset"})
            return jsonify({
                "success": False,
                "error": "Maximum verification attempts exceeded. Please request a new code."
            }), 429

        expires_at_str = record.get("expires_at")
        if expires_at_str:
            try:
                expires_at = datetime.datetime.fromisoformat(expires_at_str)
                if datetime.datetime.utcnow() > expires_at:
                    otp_col.delete_many({"email": email, "otp_type": "password_reset"})
                    return jsonify({
                        "success": False,
                        "error": "Password reset code has expired. Please request a new code."
                    }), 400
            except Exception:
                pass

        if not verify_otp_hash(otp, record.get("otp_hash", "")):
            new_attempts = attempts + 1
            otp_col.update_one(
                {"_id": record.get("_id")},
                {"$set": {"attempts": new_attempts}}
            )
            remaining = MAX_VERIFICATION_ATTEMPTS - new_attempts
            return jsonify({
                "success": False,
                "error": f"Invalid verification code. {remaining} attempt{'s' if remaining != 1 else ''} remaining."
            }), 400

        # OTP verified! Update password and set is_verified to True
        updated_user = User.update_password(email, new_password)
        User.verify_user(email)

        # Invalidate OTP record
        otp_col.delete_many({"email": email, "otp_type": "password_reset"})

        return jsonify({
            "success": True,
            "message": "Password reset successfully. You can now sign in with your new password."
        }), 200

    except Exception as e:
        return jsonify({"success": False, "error": f"Password reset error: {str(e)}"}), 500


# ── GET /api/auth/me ──────────────────────────────────────────────────────────
@auth_bp.route("/me", methods=["GET"])
@token_required
def get_current_user(current_user):
    return jsonify({
        "success": True,
        "user": current_user.to_dict()
    }), 200
