# backend/aliaport_api/utils/email.py
"""
Email utility for sending password reset and notification emails.
Uses SMTP (configured via environment variables).
"""
import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import List, Optional
import logging

logger = logging.getLogger(__name__)

# SMTP Configuration from environment
SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "noreply@aliaport.com")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
SMTP_FROM_NAME = os.getenv("SMTP_FROM_NAME", "Aliaport Liman Yönetim Sistemi")
SMTP_USE_TLS = os.getenv("SMTP_USE_TLS", "true").lower() == "true"

# Frontend URL for reset links
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5000")


def send_email(
    to_email: str | List[str],
    subject: str,
    body_html: str,
    body_text: Optional[str] = None,
) -> bool:
    """
    Send email via SMTP.
    
    Args:
        to_email: Recipient email(s)
        subject: Email subject
        body_html: HTML email body
        body_text: Plain text fallback (optional)
    
    Returns:
        True if sent successfully, False otherwise
    """
    if not SMTP_PASSWORD:
        logger.warning("SMTP_PASSWORD not configured, email not sent (dev mode)")
        logger.info(f"[DEV] Would send email to {to_email}: {subject}")
        return True  # Simulate success in dev
    
    try:
        # Create message
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = f"{SMTP_FROM_NAME} <{SMTP_USER}>"
        msg["To"] = to_email if isinstance(to_email, str) else ", ".join(to_email)
        
        # Attach plain text and HTML
        if body_text:
            msg.attach(MIMEText(body_text, "plain", "utf-8"))
        msg.attach(MIMEText(body_html, "html", "utf-8"))
        
        # Connect to SMTP
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            if SMTP_USE_TLS:
                server.starttls()
            server.login(SMTP_USER, SMTP_PASSWORD)
            server.send_message(msg)
        
        logger.info(f"Email sent successfully to {to_email}")
        return True
    
    except Exception as e:
        logger.error(f"Failed to send email to {to_email}: {e}")
        return False


def send_password_reset_email(email: str, reset_token: str, user_name: str = "") -> bool:
    """
    Send password reset email with token link.
    
    Args:
        email: User email
        reset_token: Password reset token
        user_name: User's full name (optional)
    
    Returns:
        True if sent successfully
    """
    reset_url = f"{FRONTEND_URL}/reset-password?token={reset_token}"
    
    subject = "Aliaport - Şifre Sıfırlama"
    
    # HTML body
    body_html = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
            .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
            .header {{ background-color: #1e40af; color: white; padding: 20px; text-align: center; }}
            .content {{ background-color: #f9fafb; padding: 30px; }}
            .button {{ 
                display: inline-block; 
                padding: 12px 24px; 
                background-color: #1e40af; 
                color: white; 
                text-decoration: none; 
                border-radius: 6px;
                margin: 20px 0;
            }}
            .footer {{ text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Şifre Sıfırlama</h1>
            </div>
            <div class="content">
                <p>Merhaba{' ' + user_name if user_name else ''},</p>
                
                <p>Aliaport hesabınız için şifre sıfırlama talebinde bulundunuz. 
                   Şifrenizi sıfırlamak için aşağıdaki butona tıklayın:</p>
                
                <div style="text-align: center;">
                    <a href="{reset_url}" class="button">Şifremi Sıfırla</a>
                </div>
                
                <p>Veya bu linki tarayıcınıza kopyalayın:</p>
                <p style="word-break: break-all; color: #1e40af;">{reset_url}</p>
                
                <p><strong>Önemli:</strong> Bu link 1 saat geçerlidir ve sadece bir kez kullanılabilir.</p>
                
                <p>Eğer şifre sıfırlama talebinde bulunmadıysanız, bu e-postayı görmezden gelebilirsiniz.</p>
            </div>
            <div class="footer">
                <p>Bu otomatik bir mesajdır, lütfen yanıtlamayın.</p>
                <p>© 2025 Aliaport Liman Yönetim Sistemi</p>
            </div>
        </div>
    </body>
    </html>
    """
    
    # Plain text fallback
    body_text = f"""
    Merhaba{' ' + user_name if user_name else ''},
    
    Aliaport hesabınız için şifre sıfırlama talebinde bulundunuz.
    
    Şifrenizi sıfırlamak için aşağıdaki linki ziyaret edin:
    {reset_url}
    
    Bu link 1 saat geçerlidir ve sadece bir kez kullanılabilir.
    
    Eğer şifre sıfırlama talebinde bulunmadıysanız, bu e-postayı görmezden gelebilirsiniz.
    
    ---
    Aliaport Liman Yönetim Sistemi
    """
    
    return send_email(email, subject, body_html, body_text)


def send_password_changed_notification(email: str, user_name: str = "") -> bool:
    """
    Send notification email after successful password change.
    
    Args:
        email: User email
        user_name: User's full name (optional)
    
    Returns:
        True if sent successfully
    """
    subject = "Aliaport - Şifreniz Değiştirildi"
    
    body_html = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
            .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
            .header {{ background-color: #059669; color: white; padding: 20px; text-align: center; }}
            .content {{ background-color: #f9fafb; padding: 30px; }}
            .footer {{ text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Şifreniz Güncellendi</h1>
            </div>
            <div class="content">
                <p>Merhaba{' ' + user_name if user_name else ''},</p>
                
                <p>Aliaport hesabınızın şifresi başarıyla değiştirildi.</p>
                
                <p>Eğer bu değişikliği siz yapmadıysanız, lütfen <strong>derhal</strong> sistem yöneticinizle iletişime geçin.</p>
            </div>
            <div class="footer">
                <p>Bu otomatik bir mesajdır, lütfen yanıtlamayın.</p>
                <p>© 2025 Aliaport Liman Yönetim Sistemi</p>
            </div>
        </div>
    </body>
    </html>
    """
    
    body_text = f"""
    Merhaba{' ' + user_name if user_name else ''},
    
    Aliaport hesabınızın şifresi başarıyla değiştirildi.
    
    Eğer bu değişikliği siz yapmadıysanız, lütfen derhal sistem yöneticinizle iletişime geçin.
    
    ---
    Aliaport Liman Yönetim Sistemi
    """
    
    return send_email(email, subject, body_html, body_text)
