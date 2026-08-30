from app.core.config import settings
import smtplib

print("EMAIL_HOST:", repr(settings.EMAIL_HOST))
print("EMAIL_PORT:", repr(settings.EMAIL_PORT))
print("EMAIL_USERNAME:", repr(settings.EMAIL_USERNAME))
print("EMAIL_FROM:", repr(settings.EMAIL_FROM))
print("EMAIL_USE_TLS:", repr(settings.EMAIL_USE_TLS))
print("EMAIL_USE_SSL:", repr(settings.EMAIL_USE_SSL))

try:
    if settings.EMAIL_USE_SSL:
        print("Connecting with SMTP_SSL...")
        server = smtplib.SMTP_SSL(settings.EMAIL_HOST, settings.EMAIL_PORT, timeout=10)
    else:
        print("Connecting with SMTP...")
        server = smtplib.SMTP(settings.EMAIL_HOST, settings.EMAIL_PORT, timeout=10)
        if settings.EMAIL_USE_TLS:
            print("Starting TLS...")
            server.starttls()

    if settings.EMAIL_USERNAME and settings.EMAIL_PASSWORD:
        print("Logging in...")
        server.login(settings.EMAIL_USERNAME, settings.EMAIL_PASSWORD)
    print("SMTP Connection & Auth Succeeded!")
    server.quit()
except Exception as e:
    print("SMTP ERROR:", type(e).__name__, str(e))
