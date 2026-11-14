import secrets
import hashlib

def generate_secure_otp() -> str:
    """Generate a cryptographically secure 6-digit numeric OTP."""
    # secrets.randbelow(900000) yields 0 to 899999; + 100000 gives 100000 to 999999
    code = secrets.randbelow(900000) + 100000
    return str(code)

def hash_otp(otp: str) -> str:
    """Hash the OTP using SHA-256 for secure database storage."""
    clean_otp = str(otp).strip()
    return hashlib.sha256(clean_otp.encode("utf-8")).hexdigest()

def verify_otp_hash(plain_otp: str, stored_hash: str) -> bool:
    """Safely verify a plain OTP against its stored SHA-256 hash using constant-time comparison."""
    if not plain_otp or not stored_hash:
        return False
    computed_hash = hash_otp(plain_otp)
    return secrets.compare_digest(computed_hash, stored_hash)

