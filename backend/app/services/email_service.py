import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from config.settings import Config

class EmailService:
    @staticmethod
    def is_configured() -> bool:
        """Check if SMTP credentials are fully provided."""
        return bool(Config.SMTP_USERNAME and Config.SMTP_PASSWORD and Config.SMTP_HOST)

    @classmethod
    def send_otp_email(cls, recipient_email: str, otp_code: str, purpose: str = "email_verification", recipient_name: str = "Yogi"):
        """
        Send a real 6-digit verification code using SMTP.
        purpose can be 'email_verification' or 'password_reset'.
        """
        is_pwd_reset = (purpose == "password_reset")
        subject = "FitVerse – Password Reset Verification Code" if is_pwd_reset else "FitVerse – Verify Your Email Address"
        action_title = "Password Reset Request" if is_pwd_reset else "Welcome to FitVerse!"
        action_desc = (
            "We received a request to reset your FitVerse account password. Use the verification code below to proceed."
            if is_pwd_reset
            else "Thank you for creating an account with FitVerse – your AI-Powered Yoga & Fitness Companion. Please enter the verification code below to activate your account."
        )

        # ── Plain text fallback ────────────────────────────────────────────────
        plain_text = f"""
FitVerse – AI Yoga & Fitness Companion
--------------------------------------
{action_title}

Hello {recipient_name},

{action_desc}

Your 6-Digit Verification Code:
>>> {otp_code} <<<

Security Notice:
• This verification code will expire in 5 minutes.
• Maximum 5 verification attempts are allowed.
• If you did not initiate this request, please safely ignore this email.

Stay mindful & healthy,
The FitVerse Team
"""

        # ── High-End Professional HTML Template ────────────────────────────────
        html_content = f"""
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{subject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F8F4FB; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #302044;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #F8F4FB; padding: 40px 15px;">
    <tr>
      <td align="center">
        <!-- Main Card Container -->
        <table role="presentation" width="100%" max-width="580" style="max-width: 580px; background-color: #FFFFFF; border-radius: 24px; border: 1px solid #EFE2F9; box-shadow: 0 10px 30px rgba(168, 117, 213, 0.08); overflow: hidden;" cellspacing="0" cellpadding="0" border="0">
          
          <!-- Header Banner -->
          <tr>
            <td align="center" style="background: linear-gradient(135deg, #F3E8FC 0%, #E8D4F8 100%); padding: 36px 30px; border-bottom: 1px solid #EEDBFA;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td align="center">
                    <!-- Brand Name -->
                    <div style="font-size: 28px; font-weight: 900; letter-spacing: -0.5px; color: #302044; display: inline-block;">
                      Fit<span style="color: #9B5DE5;">Verse</span>
                    </div>
                    <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 2px; color: #7B42B4; margin-top: 4px;">
                      AI Yoga &amp; Fitness Companion
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Content Body -->
          <tr>
            <td style="padding: 36px 32px 28px 32px;">
              <h2 style="margin: 0 0 12px 0; font-size: 22px; font-weight: 800; color: #302044;">
                {action_title}
              </h2>
              <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 1.6; color: #625770;">
                Hello <strong style="color: #302044;">{recipient_name}</strong>,
              </p>
              <p style="margin: 0 0 28px 0; font-size: 14px; line-height: 1.6; color: #625770;">
                {action_desc}
              </p>

              <!-- OTP Code Display Box -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin: 0 0 28px 0;">
                <tr>
                  <td align="center" style="background-color: #FAF4FD; border: 2px dashed #D4B0F5; border-radius: 18px; padding: 24px 20px;">
                    <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; color: #8F52C6; margin-bottom: 8px;">
                      Your 6-Digit Verification Code
                    </div>
                    <div style="font-size: 38px; font-weight: 900; letter-spacing: 10px; color: #7B3EBA; font-family: 'Courier New', Courier, monospace;">
                      {otp_code}
                    </div>
                    <div style="font-size: 12px; font-weight: 600; color: #C07A28; margin-top: 8px;">
                      ⏱️ Valid for 5 minutes only
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Security Information Note -->
              <div style="background-color: #F8F9FA; border-left: 4px solid #9B5DE5; border-radius: 0 12px 12px 0; padding: 14px 16px; margin-bottom: 24px;">
                <p style="margin: 0; font-size: 12px; line-height: 1.5; color: #625770;">
                  <strong style="color: #302044;">Security Notice:</strong> Never share this code with anyone. FitVerse will never ask for your verification code outside our official application.
                </p>
              </div>

              <p style="margin: 0; font-size: 13px; color: #8A8196; line-height: 1.5;">
                If you did not initiate this registration or password reset, you can safely ignore this email.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="background-color: #FAF6FD; padding: 20px 30px; border-top: 1px solid #F0E4F9;">
              <p style="margin: 0; font-size: 11px; color: #9A92A6;">
                &copy; FitVerse AI Yoga &amp; Fitness Companion. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
"""

        # Check SMTP configuration
        if not cls.is_configured():
            print("\n" + "=" * 70)
            print("⚠️  [FitVerse SMTP Warning] SMTP credentials are not yet configured in backend/.env!")
            print(f"👉 Generated 6-Digit OTP for {recipient_email}: [{otp_code}] (Expires in 5 minutes)")
            print("👉 To enable real email delivery, set SMTP_USERNAME and SMTP_PASSWORD in backend/.env")
            print("=" * 70 + "\n")
            # Return success in local dev so development flow doesn't freeze,
            # but note that SMTP credentials need to be set for actual inbox delivery
            return True, "SMTP credentials not configured; OTP logged to backend console for local development."

        # Connect to real SMTP server
        try:
            msg = MIMEMultipart("alternative")
            msg["Subject"] = subject
            msg["From"] = f"FitVerse <{Config.SMTP_FROM_EMAIL}>"
            msg["To"] = recipient_email

            part1 = MIMEText(plain_text, "plain", "utf-8")
            part2 = MIMEText(html_content, "html", "utf-8")
            msg.attach(part1)
            msg.attach(part2)

            print(f"[FitVerse Email] Connecting to SMTP server {Config.SMTP_HOST}:{Config.SMTP_PORT}...")
            server = smtplib.SMTP(Config.SMTP_HOST, Config.SMTP_PORT, timeout=12)
            
            if Config.SMTP_USE_TLS:
                server.starttls()
            
            server.login(Config.SMTP_USERNAME, Config.SMTP_PASSWORD)
            server.sendmail(Config.SMTP_FROM_EMAIL, [recipient_email], msg.as_string())
            server.quit()
            print(f"[FitVerse Email] Real OTP email successfully delivered to {recipient_email}!")
            return True, None

        except Exception as e:
            err_msg = str(e)
            print(f"❌ [FitVerse Email Error] Failed to send email via SMTP to {recipient_email}: {err_msg}")
            # Fallback for dev mode
            print(f"👉 Local Development Fallback: OTP for {recipient_email} is [{otp_code}]")
            return False, f"Could not send email: {err_msg}"

