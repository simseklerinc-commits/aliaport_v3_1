"""
Email Service - SMTP ile E-posta Gönderimi
Jinja2 templates ile HTML email formatları

Kullanım:
    email_service = EmailService()
    email_service.send_welcome_email(user)
    email_service.send_document_approved_email(document)
"""

import os
import logging
from typing import Optional, List
from datetime import datetime
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import smtplib
from jinja2 import Environment, FileSystemLoader, select_autoescape

logger = logging.getLogger(__name__)


class EmailService:
    """
    Email gönderim servisi
    
    SMTP Configuration (.env):
        SMTP_HOST=mail.aliaport.com.tr
        SMTP_PORT=587
        SMTP_USERNAME=guvenlik@aliaport.com.tr
        SMTP_PASSWORD=dJVehuqdebvxCrh3FCKX
        SMTP_FROM_EMAIL=guvenlik@aliaport.com.tr
        SMTP_FROM_NAME=Aliaport Liman Yönetimi
        SMTP_USE_TLS=True
    """
    
    def __init__(self):
        """Email service configuration"""
        self.smtp_host = os.getenv("SMTP_HOST", "mail.aliaport.com.tr")
        self.smtp_port = int(os.getenv("SMTP_PORT", "587"))
        self.smtp_username = os.getenv("SMTP_USERNAME", "guvenlik@aliaport.com.tr")
        self.smtp_password = os.getenv("SMTP_PASSWORD", "dJVehuqdebvxCrh3FCKX")
        self.from_email = os.getenv("SMTP_FROM_EMAIL", "guvenlik@aliaport.com.tr")
        self.from_name = os.getenv("SMTP_FROM_NAME", "Aliaport Liman Yönetimi")
        self.use_tls = os.getenv("SMTP_USE_TLS", "True").lower() == "true"
        
        # Jinja2 template engine
        template_dir = os.path.join(
            os.path.dirname(__file__), 
            "..", 
            "templates", 
            "emails"
        )
        self.jinja_env = Environment(
            loader=FileSystemLoader(template_dir),
            autoescape=select_autoescape(['html', 'xml'])
        )
        
        logger.info(f"📧 Email Service initialized: {self.smtp_host}:{self.smtp_port}")
    
    def _send_email(
        self,
        to_email: str,
        subject: str,
        html_body: str,
        text_body: Optional[str] = None,
        cc: Optional[List[str]] = None,
        bcc: Optional[List[str]] = None
    ) -> bool:
        """
        Email gönder (SMTP)
        
        Args:
            to_email: Alıcı email
            subject: Email konusu
            html_body: HTML email içeriği
            text_body: Plain text fallback (opsiyonel)
            cc: CC alıcıları (opsiyonel)
            bcc: BCC alıcıları (opsiyonel)
        
        Returns:
            bool: Başarılı mı?
        """
        try:
            # Email message oluştur
            msg = MIMEMultipart('alternative')
            msg['Subject'] = subject
            msg['From'] = f"{self.from_name} <{self.from_email}>"
            msg['To'] = to_email
            
            if cc:
                msg['Cc'] = ', '.join(cc)
            if bcc:
                msg['Bcc'] = ', '.join(bcc)
            
            # Plain text body (fallback)
            if text_body:
                part1 = MIMEText(text_body, 'plain', 'utf-8')
                msg.attach(part1)
            
            # HTML body
            part2 = MIMEText(html_body, 'html', 'utf-8')
            msg.attach(part2)
            
            # SMTP bağlantısı
            with smtplib.SMTP(self.smtp_host, self.smtp_port, timeout=30) as server:
                if self.use_tls:
                    server.starttls()
                
                # Login
                server.login(self.smtp_username, self.smtp_password)
                
                # Alıcı listesi
                recipients = [to_email]
                if cc:
                    recipients.extend(cc)
                if bcc:
                    recipients.extend(bcc)
                
                # Email gönder
                server.sendmail(self.from_email, recipients, msg.as_string())
            
            logger.info(f"✅ Email sent: {to_email} - {subject}")
            return True
            
        except smtplib.SMTPAuthenticationError as e:
            logger.error(f"❌ SMTP Authentication failed: {e}")
            return False
        except smtplib.SMTPException as e:
            logger.error(f"❌ SMTP error sending email to {to_email}: {e}")
            return False
        except Exception as e:
            logger.error(f"❌ Email send failed to {to_email}: {e}", exc_info=True)
            return False
    
    # ===========================
    # PORTAL USER EMAILS
    # ===========================
    
    def send_welcome_email(
        self,
        to_email: str,
        full_name: str,
        temp_password: str,
        login_url: str = "https://portal.aliaport.com.tr/login"
    ) -> bool:
        """
        Portal kullanıcı hoş geldin emaili
        
        Args:
            to_email: Kullanıcı email
            full_name: Ad soyad
            temp_password: Geçici şifre
            login_url: Portal login URL
        """
        try:
            template = self.jinja_env.get_template('welcome.html')
            html_body = template.render(
                full_name=full_name,
                email=to_email,
                temp_password=temp_password,
                login_url=login_url,
                current_year=datetime.now().year
            )
            
            text_body = f"""
Hoş Geldiniz, {full_name}!

Aliaport Portal hesabınız oluşturuldu.

Giriş Bilgileriniz:
Email: {to_email}
Geçici Şifre: {temp_password}

Portal: {login_url}

İlk girişinizde şifrenizi değiştirmeniz gerekecektir.

Aliaport Liman Yönetimi
            """.strip()
            
            return self._send_email(
                to_email=to_email,
                subject="Aliaport Portal Hesabınız Oluşturuldu",
                html_body=html_body,
                text_body=text_body
            )
            
        except Exception as e:
            logger.error(f"❌ Welcome email template error: {e}", exc_info=True)
            return False
    
    def send_password_reset_email(
        self,
        to_email: str,
        full_name: str,
        reset_token: str,
        reset_url_base: str = "https://portal.aliaport.com.tr/reset-password"
    ) -> bool:
        """
        Şifre sıfırlama emaili
        
        Args:
            to_email: Kullanıcı email
            full_name: Ad soyad
            reset_token: Şifre sıfırlama token
            reset_url_base: Reset URL base
        """
        try:
            reset_url = f"{reset_url_base}?token={reset_token}"
            
            template = self.jinja_env.get_template('password_reset.html')
            html_body = template.render(
                full_name=full_name,
                reset_url=reset_url,
                reset_token=reset_token,
                valid_hours=24,
                current_year=datetime.now().year
            )
            
            text_body = f"""
Şifre Sıfırlama Talebi

Merhaba {full_name},

Şifre sıfırlama talebinde bulundunuz.

Şifrenizi sıfırlamak için aşağıdaki linke tıklayın:
{reset_url}

Bu link 24 saat geçerlidir.

Eğer bu talebi siz yapmadıysanız, lütfen bu emaili görmezden gelin.

Aliaport Liman Yönetimi
            """.strip()
            
            return self._send_email(
                to_email=to_email,
                subject="Aliaport Portal - Şifre Sıfırlama",
                html_body=html_body,
                text_body=text_body
            )
            
        except Exception as e:
            logger.error(f"❌ Password reset email template error: {e}", exc_info=True)
            return False
    
    # ===========================
    # DOCUMENT EMAILS
    # ===========================
    
    def send_document_approved_email(
        self,
        to_email: str,
        full_name: str,
        document_type: str,
        work_order_no: str,
        approved_by: str,
        approval_note: Optional[str] = None
    ) -> bool:
        """
        Belge onaylandı emaili
        
        Args:
            to_email: Portal kullanıcı email
            full_name: Ad soyad
            document_type: Belge tipi
            work_order_no: İş emri numarası
            approved_by: Onaylayan kişi
            approval_note: Onay notu
        """
        try:
            template = self.jinja_env.get_template('document_approved.html')
            html_body = template.render(
                full_name=full_name,
                document_type=document_type,
                work_order_no=work_order_no,
                approved_by=approved_by,
                approval_note=approval_note,
                approved_at=datetime.now().strftime("%d.%m.%Y %H:%M"),
                current_year=datetime.now().year
            )
            
            text_body = f"""
Belge Onaylandı

Merhaba {full_name},

{document_type} belgeniz onaylandı.

İş Emri: {work_order_no}
Onaylayan: {approved_by}
Tarih: {datetime.now().strftime("%d.%m.%Y %H:%M")}

{f"Not: {approval_note}" if approval_note else ""}

Aliaport Liman Yönetimi
            """.strip()
            
            return self._send_email(
                to_email=to_email,
                subject=f"Belge Onaylandı - {document_type}",
                html_body=html_body,
                text_body=text_body
            )
            
        except Exception as e:
            logger.error(f"❌ Document approved email template error: {e}", exc_info=True)
            return False
    
    def send_document_rejected_email(
        self,
        to_email: str,
        full_name: str,
        document_type: str,
        work_order_no: str,
        rejected_by: str,
        rejection_reason: str
    ) -> bool:
        """
        Belge reddedildi emaili
        
        Args:
            to_email: Portal kullanıcı email
            full_name: Ad soyad
            document_type: Belge tipi
            work_order_no: İş emri numarası
            rejected_by: Reddeden kişi
            rejection_reason: Red nedeni
        """
        try:
            template = self.jinja_env.get_template('document_rejected.html')
            html_body = template.render(
                full_name=full_name,
                document_type=document_type,
                work_order_no=work_order_no,
                rejected_by=rejected_by,
                rejection_reason=rejection_reason,
                rejected_at=datetime.now().strftime("%d.%m.%Y %H:%M"),
                portal_url="https://portal.aliaport.com.tr",
                current_year=datetime.now().year
            )
            
            text_body = f"""
Belge Reddedildi

Merhaba {full_name},

{document_type} belgeniz reddedildi.

İş Emri: {work_order_no}
Reddeden: {rejected_by}
Tarih: {datetime.now().strftime("%d.%m.%Y %H:%M")}

Red Nedeni:
{rejection_reason}

Lütfen belgeyi düzelterek tekrar yükleyin.

Aliaport Liman Yönetimi
            """.strip()
            
            return self._send_email(
                to_email=to_email,
                subject=f"Belge Reddedildi - {document_type}",
                html_body=html_body,
                text_body=text_body
            )
            
        except Exception as e:
            logger.error(f"❌ Document rejected email template error: {e}", exc_info=True)
            return False
    
    def send_expiry_warning_email(
        self,
        to_email: str,
        full_name: str,
        document_type: str,
        work_order_no: str,
        expires_at: datetime,
        days_remaining: int
    ) -> bool:
        """
        Belge süresi dolmak üzere emaili
        
        Args:
            to_email: Portal kullanıcı email
            full_name: Ad soyad
            document_type: Belge tipi
            work_order_no: İş emri numarası
            expires_at: Son geçerlilik tarihi
            days_remaining: Kalan gün
        """
        try:
            template = self.jinja_env.get_template('document_expiry_warning.html')
            html_body = template.render(
                full_name=full_name,
                document_type=document_type,
                work_order_no=work_order_no,
                expires_at=expires_at.strftime("%d.%m.%Y"),
                days_remaining=days_remaining,
                portal_url="https://portal.aliaport.com.tr",
                current_year=datetime.now().year
            )
            
            urgency = "ACİL!" if days_remaining <= 7 else "UYARI"
            
            text_body = f"""
{urgency} - Belge Süresi Dolmak Üzere

Merhaba {full_name},

{document_type} belgenizin süresi dolmak üzere!

İş Emri: {work_order_no}
Son Geçerlilik: {expires_at.strftime("%d.%m.%Y")}
Kalan Gün: {days_remaining} gün

Lütfen yeni belgeyi en kısa sürede yükleyin.

Aliaport Liman Yönetimi
            """.strip()
            
            return self._send_email(
                to_email=to_email,
                subject=f"{urgency} - Belge Süresi Dolmak Üzere ({days_remaining} gün)",
                html_body=html_body,
                text_body=text_body
            )
            
        except Exception as e:
            logger.error(f"❌ Expiry warning email template error: {e}", exc_info=True)
            return False
    
    def send_document_expired_email(
        self,
        to_email: str,
        full_name: str,
        document_type: str,
        work_order_no: str,
        expired_at: datetime
    ) -> bool:
        """
        Belge süresi doldu emaili
        
        Args:
            to_email: Portal kullanıcı email
            full_name: Ad soyad
            document_type: Belge tipi
            work_order_no: İş emri numarası
            expired_at: Süre dolma tarihi
        """
        try:
            template = self.jinja_env.get_template('document_expired.html')
            html_body = template.render(
                full_name=full_name,
                document_type=document_type,
                work_order_no=work_order_no,
                expired_at=expired_at.strftime("%d.%m.%Y"),
                portal_url="https://portal.aliaport.com.tr",
                current_year=datetime.now().year
            )
            
            text_body = f"""
ACİL! - Belge Süresi Doldu

Merhaba {full_name},

{document_type} belgenizin süresi dolmuştur!

İş Emri: {work_order_no}
Süre Dolma: {expired_at.strftime("%d.%m.%Y")}

Lütfen ACİLEN yeni belgeyi yükleyin.

Aliaport Liman Yönetimi
            """.strip()
            
            return self._send_email(
                to_email=to_email,
                subject=f"ACİL! - Belge Süresi Doldu - {document_type}",
                html_body=html_body,
                text_body=text_body
            )
            
        except Exception as e:
            logger.error(f"❌ Document expired email template error: {e}", exc_info=True)
            return False
    
    # ===========================
    # WORK ORDER EMAILS
    # ===========================
    
    def send_work_order_approved_email(
        self,
        to_email: str,
        full_name: str,
        work_order_no: str,
        approved_by: str,
        estimated_completion: Optional[datetime] = None
    ) -> bool:
        """
        İş emri onaylandı emaili
        
        Args:
            to_email: Portal kullanıcı email
            full_name: Ad soyad
            work_order_no: İş emri numarası
            approved_by: Onaylayan kişi
            estimated_completion: Tahmini tamamlanma
        """
        try:
            template = self.jinja_env.get_template('work_order_approved.html')
            html_body = template.render(
                full_name=full_name,
                work_order_no=work_order_no,
                approved_by=approved_by,
                estimated_completion=estimated_completion.strftime("%d.%m.%Y") if estimated_completion else "Belirtilmedi",
                current_year=datetime.now().year
            )
            
            text_body = f"""
İş Emri Onaylandı

Merhaba {full_name},

İş emriniz onaylandı ve işleme alındı.

İş Emri No: {work_order_no}
Onaylayan: {approved_by}
{f"Tahmini Tamamlanma: {estimated_completion.strftime('%d.%m.%Y')}" if estimated_completion else ""}

Aliaport Liman Yönetimi
            """.strip()
            
            return self._send_email(
                to_email=to_email,
                subject=f"İş Emri Onaylandı - {work_order_no}",
                html_body=html_body,
                text_body=text_body
            )
            
        except Exception as e:
            logger.error(f"❌ Work order approved email template error: {e}", exc_info=True)
            return False
    
    def send_work_order_completed_email(
        self,
        to_email: str,
        full_name: str,
        work_order_no: str,
        completed_by: str,
        completion_notes: Optional[str] = None
    ) -> bool:
        """
        İş emri tamamlandı emaili
        
        Args:
            to_email: Portal kullanıcı email
            full_name: Ad soyad
            work_order_no: İş emri numarası
            completed_by: Tamamlayan kişi
            completion_notes: Tamamlanma notları
        """
        try:
            template = self.jinja_env.get_template('work_order_completed.html')
            html_body = template.render(
                full_name=full_name,
                work_order_no=work_order_no,
                completed_by=completed_by,
                completion_notes=completion_notes,
                completed_at=datetime.now().strftime("%d.%m.%Y %H:%M"),
                current_year=datetime.now().year
            )
            
            text_body = f"""
İş Emri Tamamlandı

Merhaba {full_name},

İş emriniz tamamlanmıştır.

İş Emri No: {work_order_no}
Tamamlayan: {completed_by}
Tarih: {datetime.now().strftime("%d.%m.%Y %H:%M")}

{f"Notlar: {completion_notes}" if completion_notes else ""}

Aliaport Liman Yönetimi
            """.strip()
            
            return self._send_email(
                to_email=to_email,
                subject=f"İş Emri Tamamlandı - {work_order_no}",
                html_body=html_body,
                text_body=text_body
            )
            
        except Exception as e:
            logger.error(f"❌ Work order completed email template error: {e}", exc_info=True)
            return False

    def send_vehicle_document_approved_email(
        self,
        to_email: str,
        company_name: str,
        vehicle_plaka: str,
        doc_type_name: str,
        expiry_date: Optional[datetime] = None
    ) -> bool:
        """
        Araç evrak onaylandı emaili
        
        Args:
            to_email: Portal kullanıcı email
            company_name: Firma adı
            vehicle_plaka: Araç plakası
            doc_type_name: Evrak tipi adı
            expiry_date: Geçerlilik tarihi (opsiyonel)
        """
        try:
            expiry_str = expiry_date.strftime("%d.%m.%Y") if expiry_date else "Belirtilmedi"
            
            html_body = f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
        .content {{ background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }}
        .info-box {{ background: white; padding: 20px; border-left: 4px solid #10b981; margin: 20px 0; }}
        .footer {{ text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }}
        .success-icon {{ font-size: 48px; margin-bottom: 10px; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="success-icon">✅</div>
            <h1 style="margin: 0;">Evrak Onaylandı</h1>
        </div>
        <div class="content">
            <p>Sayın <strong>{company_name}</strong>,</p>
            
            <p>Yüklediğiniz araç evrakı başarıyla onaylanmıştır.</p>
            
            <div class="info-box">
                <p style="margin: 0;"><strong>Araç Plaka:</strong> {vehicle_plaka}</p>
                <p style="margin: 10px 0 0 0;"><strong>Evrak Türü:</strong> {doc_type_name}</p>
                <p style="margin: 10px 0 0 0;"><strong>Geçerlilik Tarihi:</strong> {expiry_str}</p>
                <p style="margin: 10px 0 0 0;"><strong>Onay Tarihi:</strong> {datetime.now().strftime("%d.%m.%Y %H:%M")}</p>
            </div>
            
            <p style="color: #10b981; font-weight: bold;">Evrakınız artık geçerlidir ve sisteme kayıtlıdır.</p>
            
            <p>Teşekkür ederiz.</p>
        </div>
        <div class="footer">
            <p>Aliaport Liman Yönetimi &copy; {datetime.now().year}</p>
        </div>
    </div>
</body>
</html>
            """
            
            text_body = f"""
Evrak Onaylandı

Sayın {company_name},

Yüklediğiniz araç evrakı başarıyla onaylanmıştır.

Araç Plaka: {vehicle_plaka}
Evrak Türü: {doc_type_name}
Geçerlilik Tarihi: {expiry_str}
Onay Tarihi: {datetime.now().strftime("%d.%m.%Y %H:%M")}

Evrakınız artık geçerlidir ve sisteme kayıtlıdır.

Aliaport Liman Yönetimi
            """.strip()
            
            return self._send_email(
                to_email=to_email,
                subject=f"Araç Evrak Onayı - {vehicle_plaka} - {doc_type_name}",
                html_body=html_body,
                text_body=text_body
            )
            
        except Exception as e:
            logger.error(f"❌ Vehicle document approved email error: {e}", exc_info=True)
            return False

    def send_vehicle_document_rejected_email(
        self,
        to_email: str,
        company_name: str,
        vehicle_plaka: str,
        doc_type_name: str,
        reject_reason: str
    ) -> bool:
        """
        Araç evrak reddedildi emaili
        
        Args:
            to_email: Portal kullanıcı email
            company_name: Firma adı
            vehicle_plaka: Araç plakası
            doc_type_name: Evrak tipi adı
            reject_reason: Red nedeni
        """
        try:
            html_body = f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
        .content {{ background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }}
        .info-box {{ background: white; padding: 20px; border-left: 4px solid #ef4444; margin: 20px 0; }}
        .reason-box {{ background: #fef2f2; padding: 15px; border: 1px solid #fecaca; border-radius: 5px; margin: 15px 0; }}
        .footer {{ text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }}
        .reject-icon {{ font-size: 48px; margin-bottom: 10px; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="reject-icon">❌</div>
            <h1 style="margin: 0;">Evrak Reddedildi</h1>
        </div>
        <div class="content">
            <p>Sayın <strong>{company_name}</strong>,</p>
            
            <p>Yüklediğiniz araç evrakı incelendi ancak onaylanamamıştır.</p>
            
            <div class="info-box">
                <p style="margin: 0;"><strong>Araç Plaka:</strong> {vehicle_plaka}</p>
                <p style="margin: 10px 0 0 0;"><strong>Evrak Türü:</strong> {doc_type_name}</p>
                <p style="margin: 10px 0 0 0;"><strong>Red Tarihi:</strong> {datetime.now().strftime("%d.%m.%Y %H:%M")}</p>
            </div>
            
            <div class="reason-box">
                <p style="margin: 0; font-weight: bold; color: #dc2626;">Red Nedeni:</p>
                <p style="margin: 10px 0 0 0;">{reject_reason}</p>
            </div>
            
            <p style="color: #dc2626; font-weight: bold;">Lütfen gerekli düzeltmeleri yaparak evrakı yeniden yükleyiniz.</p>
            
            <p>Portal üzerinden yeni evrak yükleyebilirsiniz.</p>
        </div>
        <div class="footer">
            <p>Aliaport Liman Yönetimi &copy; {datetime.now().year}</p>
        </div>
    </div>
</body>
</html>
            """
            
            text_body = f"""
Evrak Reddedildi

Sayın {company_name},

Yüklediğiniz araç evrakı incelendi ancak onaylanamamıştır.

Araç Plaka: {vehicle_plaka}
Evrak Türü: {doc_type_name}
Red Tarihi: {datetime.now().strftime("%d.%m.%Y %H:%M")}

Red Nedeni:
{reject_reason}

Lütfen gerekli düzeltmeleri yaparak evrakı yeniden yükleyiniz.

Portal üzerinden yeni evrak yükleyebilirsiniz.

Aliaport Liman Yönetimi
            """.strip()
            
            return self._send_email(
                to_email=to_email,
                subject=f"Araç Evrak Reddedildi - {vehicle_plaka} - {doc_type_name}",
                html_body=html_body,
                text_body=text_body
            )
            
        except Exception as e:
            logger.error(f"❌ Vehicle document rejected email error: {e}", exc_info=True)
            return False


# Singleton instance
_email_service_instance = None

def get_email_service() -> EmailService:
    """
    Email service singleton instance
    
    Returns:
        EmailService: Singleton email service instance
    """
    global _email_service_instance
    if _email_service_instance is None:
        _email_service_instance = EmailService()
    return _email_service_instance
