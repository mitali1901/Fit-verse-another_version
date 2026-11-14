import re

EMAIL_REGEX = r"^[\w\.-]+@[\w\.-]+\.\w+$"

def validate_strong_password(password: str) -> list:
    """
    Validate that password meets all mandatory strength criteria:
    - Minimum 8 characters
    - At least one uppercase letter
    - At least one lowercase letter
    - At least one number
    - At least one special character
    Returns a list of specific error messages (empty if strong).
    """
    errors = []
    if not password:
        return ["Password is required."]

    if len(password) < 8:
        errors.append("Password must be at least 8 characters long.")

    if not re.search(r"[A-Z]", password):
        errors.append("Password must contain at least one uppercase letter (A-Z).")

    if not re.search(r"[a-z]", password):
        errors.append("Password must contain at least one lowercase letter (a-z).")

    if not re.search(r"[0-9]", password):
        errors.append("Password must contain at least one number (0-9).")

    if not re.search(r"[!@#$%^&*(),.?\":{}|<>\-_+=\\~`\[\]/]", password):
        errors.append("Password must contain at least one special character (!@#$%^&* etc.).")

    return errors

def validate_registration(data):
    """Validate user registration payload with strong password enforcement."""
    errors = []
    
    if not data:
        return ["Request body is missing."]

    name = data.get("name", "").strip()
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")
    confirm_password = data.get("confirm_password", "")

    if not name or len(name) < 2:
        errors.append("Full Name is required (minimum 2 characters).")

    if not email or not re.match(EMAIL_REGEX, email):
        errors.append("A valid email address is required.")

    # Strong password check
    pwd_errors = validate_strong_password(password)
    errors.extend(pwd_errors)

    if confirm_password and password != confirm_password:
        errors.append("Passwords do not match.")

    return errors

def validate_login(data):
    """Validate user login payload."""
    errors = []
    if not data:
        return ["Request body is missing."]

    email = data.get("email", "").strip().lower()
    password = data.get("password", "")

    if not email:
        errors.append("Email is required.")
    if not password:
        errors.append("Password is required.")

    return errors

def validate_reset_password(data):
    """Validate password reset payload."""
    errors = []
    if not data:
        return ["Request body is missing."]

    email = data.get("email", "").strip().lower()
    otp = str(data.get("otp", "")).strip()
    password = data.get("password", "")
    confirm_password = data.get("confirm_password", "")

    if not email or not re.match(EMAIL_REGEX, email):
        errors.append("A valid email address is required.")

    if not otp or len(otp) != 6:
        errors.append("A valid 6-digit verification code is required.")

    pwd_errors = validate_strong_password(password)
    errors.extend(pwd_errors)

    if confirm_password and password != confirm_password:
        errors.append("Passwords do not match.")

    return errors

def validate_yoga_session(data):
    """Validate yoga session record payload."""
    errors = []
    if not data:
        return ["Session data is missing."]

    pose_name = data.get("pose_name", "").strip()
    duration = data.get("duration", 0)

    if not pose_name:
        errors.append("Pose name is required.")

    if not isinstance(duration, (int, float)) or duration < 0:
        errors.append("Duration must be a positive number.")

    return errors
