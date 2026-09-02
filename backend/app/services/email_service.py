import logging
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Tuple
from email_validator import validate_email, EmailNotValidError
from fastapi import HTTPException, status
from app.core.config import settings

logger = logging.getLogger(__name__)


def validate_and_normalize_email(email: str, check_deliverability: bool = True) -> str:
    clean_email = email.strip()
    if not clean_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email address is required.",
        )

    try:
        try:
            valid = validate_email(clean_email, check_deliverability=check_deliverability)
            return valid.normalized.lower()
        except EmailNotValidError as deliverability_err:
            err_msg = str(deliverability_err)
            if "deliverable" in err_msg.lower() or "domain" in err_msg.lower() or "dns" in err_msg.lower():
                try:
                    valid = validate_email(clean_email, check_deliverability=False)
                    if "." not in valid.domain:
                        raise HTTPException(
                            status_code=status.HTTP_400_BAD_REQUEST,
                            detail=f"The email domain '{valid.domain}' does not exist. Please enter a valid email.",
                        )
                    return valid.normalized.lower()
                except EmailNotValidError:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"The email address '{clean_email}' is invalid: {err_msg}",
                    )
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"The email address '{clean_email}' is invalid: {err_msg}",
            )
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid email address: {str(exc)}",
        )


def build_otp_email_content(to_name: str, otp: str, expires_in_minutes: int = 10) -> Tuple[str, str]:
    subject = f"Your API Workbench Verification Code: {otp}"

    text_content = f"""Hello {to_name or 'Developer'},

Thank you for registering with API Workbench!

Your 6-digit email verification code is:

    {otp}

This code will expire in {expires_in_minutes} minutes.
If you did not request this verification, please safely ignore this email.

Best regards,
The API Workbench Team
"""

    html_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{subject}</title>
  <style>
    body {{
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background-color: #0d1117;
      color: #c9d1d9;
      margin: 0;
      padding: 0;
    }}
    .container {{
      max-width: 560px;
      margin: 30px auto;
      background: #161b22;
      border: 1px solid #30363d;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
    }}
    .header {{
      background: linear-gradient(135deg, #1f2937, #111827);
      padding: 28px;
      text-align: center;
      border-bottom: 1px solid #30363d;
    }}
    .brand-title {{
      color: #58a6ff;
      font-size: 22px;
      font-weight: 700;
      margin: 0;
      letter-spacing: 0.5px;
    }}
    .brand-sub {{
      color: #8b949e;
      font-size: 13px;
      margin-top: 4px;
    }}
    .content {{
      padding: 32px 28px;
    }}
    .greeting {{
      font-size: 16px;
      color: #f0f6fc;
      margin-top: 0;
      margin-bottom: 16px;
    }}
    .message {{
      font-size: 14px;
      color: #8b949e;
      line-height: 1.6;
      margin-bottom: 24px;
    }}
    .otp-card {{
      background: #0d1117;
      border: 1px solid #388bfd;
      border-radius: 8px;
      padding: 20px;
      text-align: center;
      margin: 24px 0;
    }}
    .otp-label {{
      color: #8b949e;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 8px;
    }}
    .otp-code {{
      font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
      font-size: 36px;
      font-weight: 800;
      color: #58a6ff;
      letter-spacing: 8px;
      margin: 0;
    }}
    .expiry-note {{
      font-size: 13px;
      color: #e3b341;
      margin-top: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
    }}
    .security-notice {{
      font-size: 12px;
      color: #6e7681;
      line-height: 1.5;
      border-top: 1px solid #21262d;
      padding-top: 20px;
      margin-top: 24px;
    }}
    .footer {{
      background: #0d1117;
      padding: 16px 28px;
      text-align: center;
      font-size: 12px;
      color: #484f58;
      border-top: 1px solid #21262d;
    }}
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="brand-title">⚡ API Workbench</div>
      <div class="brand-sub">Developer API Testing & Mock Server Platform</div>
    </div>
    <div class="content">
      <h2 class="greeting">Hello {to_name or 'Developer'},</h2>
      <p class="message">
        Thank you for creating an account on API Workbench. Please enter the following 6-digit verification code in your browser to verify your email address and activate your account:
      </p>
      
      <div class="otp-card">
        <div class="otp-label">Email Verification Code</div>
        <div class="otp-code">{otp}</div>
      </div>

      <div class="expiry-note">
        ⏱️ This code expires in <strong>{expires_in_minutes} minutes</strong>.
      </div>

      <div class="security-notice">
        <strong>Security Tip:</strong> Never share this verification code with anyone. API Workbench support will never ask for your code. If you did not initiate this registration, no account has been created and you can safely ignore this email.
      </div>
    </div>
    <div class="footer">
      &copy; API Workbench &bull; Practical Full-Stack Developer Tooling
    </div>
  </div>
</body>
</html>"""

    return text_content, html_content


def send_otp_email(to_email: str, to_name: str, otp: str) -> bool:
    text_body, html_body = build_otp_email_content(
        to_name=to_name,
        otp=otp,
        expires_in_minutes=settings.OTP_EXPIRE_MINUTES,
    )
    subject = f"Your API Workbench Verification Code: {otp}"

    if not settings.EMAIL_HOST or not settings.EMAIL_HOST.strip():
        logger.info("=" * 60)
        logger.info("📧 [LOCAL DEV / SIMULATED SMTP EMAIL DISPATCH]")
        logger.info(f"To: {to_name} <{to_email}>")
        logger.info(f"Subject: {subject}")
        logger.info(f"OTP Code: >>> {otp} <<< (Expires in {settings.OTP_EXPIRE_MINUTES} mins)")
        logger.info("=" * 60)
        return True

    try:
        from_address = settings.EMAIL_FROM
        from_header = f"{settings.EMAIL_FROM_NAME} <{from_address}>"

        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = from_header
        msg["To"] = to_email

        msg.attach(MIMEText(text_body, "plain", "utf-8"))
        msg.attach(MIMEText(html_body, "html", "utf-8"))

        if settings.EMAIL_USE_SSL:
            server = smtplib.SMTP_SSL(settings.EMAIL_HOST, settings.EMAIL_PORT, timeout=15)
        else:
            server = smtplib.SMTP(settings.EMAIL_HOST, settings.EMAIL_PORT, timeout=15)
            if settings.EMAIL_USE_TLS:
                server.starttls()

        if settings.EMAIL_USERNAME and settings.EMAIL_PASSWORD:
            server.login(settings.EMAIL_USERNAME, settings.EMAIL_PASSWORD)

        server.sendmail(from_address, [to_email], msg.as_string())
        server.quit()
        logger.info(f"Successfully sent OTP email to {to_email}")
        return True
    except Exception as exc:
        logger.error(f"Failed to send OTP email via SMTP ({settings.EMAIL_HOST}:{settings.EMAIL_PORT}): {exc}")
        if settings.ENVIRONMENT == "development":
            logger.warning(
                f"[DEV FALLBACK] SMTP failed, but logged OTP for {to_email}: >>> {otp} <<<"
            )
            return True
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to send verification email. Please check your email configuration or try again later.",
        )
